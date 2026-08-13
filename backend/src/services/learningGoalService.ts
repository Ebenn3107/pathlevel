import { prisma } from "../config/database";
import { Prisma, LearningGoal, LearningUnitStatus } from "@prisma/client";
import { NotFoundError, ValidationError } from "../types/error";
import { toResourceResponse, type ResourceResponse } from "./resourceService";

/* ── Response types ───────────────────────────────────────────── */

export interface GoalResponse {
  id: string;
  title: string;
  description: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  /** Derived (never stored): completed units / total units. */
  completedUnits: number;
  totalUnits: number;
  progressPercentage: number;
}

export interface UnitResponse {
  id: string;
  goalId: string;
  title: string;
  description: string | null;
  status: LearningUnitStatus;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalDetailResponse extends GoalResponse {
  units: UnitResponse[];
  /** Goal-level / unassigned Resources (not assigned to any Unit). */
  resources: ResourceResponse[];
}

export interface CreateGoalInput {
  title: string;
  description?: string;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string | null;
}

/* ── Helpers ──────────────────────────────────────────────────── */

function deriveGoalProgress(units: { status: LearningUnitStatus }[]): {
  completedUnits: number;
  totalUnits: number;
  progressPercentage: number;
} {
  const totalUnits = units.length;
  const completedUnits = units.filter((u) => u.status === "COMPLETED").length;
  const progressPercentage = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;
  return { completedUnits, totalUnits, progressPercentage };
}

function toGoalResponse(goal: LearningGoal, units: { status: LearningUnitStatus }[]): GoalResponse {
  const { completedUnits, totalUnits, progressPercentage } = deriveGoalProgress(units);
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    archivedAt: goal.archivedAt,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
    completedUnits,
    totalUnits,
    progressPercentage,
  };
}

/** Fetch a goal only if it belongs to the user. */
async function findOwnedGoal(goalId: string, userId: string): Promise<LearningGoal> {
  const goal = await prisma.learningGoal.findFirst({ where: { id: goalId, userId } });
  if (!goal) throw new NotFoundError("Learning goal");
  return goal;
}

/* ── Goals CRUD ───────────────────────────────────────────────── */

/** List all goals for a user with derived progress. */
export async function getGoals(userId: string): Promise<GoalResponse[]> {
  const goals = await prisma.learningGoal.findMany({
    where: { userId },
    include: { units: { select: { status: true } } },
    orderBy: { createdAt: "desc" },
  });
  return goals.map((g) => toGoalResponse(g, g.units));
}

/** Get a single goal with its Units and unassigned Resources. */
export async function getGoal(goalId: string, userId: string): Promise<GoalDetailResponse> {
  const goal = await prisma.learningGoal.findFirst({
    where: { id: goalId, userId },
    include: {
      units: { orderBy: { createdAt: "asc" } },
      resources: {
        include: { resource: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!goal) throw new NotFoundError("Learning goal");

  return {
    ...toGoalResponse(goal, goal.units),
    units: goal.units.map((u) => ({
      id: u.id,
      goalId: u.goalId,
      title: u.title,
      description: u.description,
      status: u.status,
      completedAt: u.completedAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    })),
    resources: goal.resources.map((r) => toResourceResponse(r.resource)),
  };
}

/** Create a new goal. A goal may exist with zero Units and zero Resources. */
export async function createGoal(userId: string, input: CreateGoalInput): Promise<GoalResponse> {
  const goal = await prisma.learningGoal.create({
    data: {
      userId,
      title: input.title,
      description: input.description ?? null,
    },
    include: { units: { select: { status: true } } },
  });
  return toGoalResponse(goal, goal.units);
}

/** Update a goal's title/description. */
export async function updateGoal(
  goalId: string,
  userId: string,
  input: UpdateGoalInput,
): Promise<GoalResponse> {
  const existing = await findOwnedGoal(goalId, userId);
  const goal = await prisma.learningGoal.update({
    where: { id: existing.id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
    },
    include: { units: { select: { status: true } } },
  });
  return toGoalResponse(goal, goal.units);
}

/** Hard-delete a goal. Cascades its Units and junction rows; Resources are kept. */
export async function deleteGoal(goalId: string, userId: string): Promise<void> {
  const existing = await findOwnedGoal(goalId, userId);
  await prisma.learningGoal.delete({ where: { id: existing.id } });
}

/** Archive a goal (reversible). Does not delete Units or Resources. */
export async function archiveGoal(goalId: string, userId: string): Promise<GoalResponse> {
  const existing = await findOwnedGoal(goalId, userId);
  const goal = await prisma.learningGoal.update({
    where: { id: existing.id },
    data: { archivedAt: new Date() },
    include: { units: { select: { status: true } } },
  });
  return toGoalResponse(goal, goal.units);
}

/** Restore an archived goal. */
export async function restoreGoal(goalId: string, userId: string): Promise<GoalResponse> {
  const existing = await findOwnedGoal(goalId, userId);
  const goal = await prisma.learningGoal.update({
    where: { id: existing.id },
    data: { archivedAt: null },
    include: { units: { select: { status: true } } },
  });
  return toGoalResponse(goal, goal.units);
}

/* ── Units under a Goal ───────────────────────────────────────── */

/** List units belonging to a goal. */
export async function getGoalUnits(goalId: string, userId: string): Promise<UnitResponse[]> {
  const goal = await findOwnedGoal(goalId, userId);
  const units = await prisma.learningUnit.findMany({
    where: { goalId: goal.id, userId },
    orderBy: { createdAt: "asc" },
  });
  return units.map((u) => ({
    id: u.id,
    goalId: u.goalId,
    title: u.title,
    description: u.description,
    status: u.status,
    completedAt: u.completedAt,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));
}

/** Create a unit under a goal. A unit may exist with zero Resources. */
export async function createGoalUnit(
  goalId: string,
  userId: string,
  input: CreateGoalInput,
): Promise<UnitResponse> {
  const goal = await findOwnedGoal(goalId, userId);
  const unit = await prisma.learningUnit.create({
    data: {
      goalId: goal.id,
      userId,
      title: input.title,
      description: input.description ?? null,
    },
  });
  return {
    id: unit.id,
    goalId: unit.goalId,
    title: unit.title,
    description: unit.description,
    status: unit.status,
    completedAt: unit.completedAt,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
  };
}

/* ── Goal-level / Unassigned Resources ────────────────────────── */

/** List goal-level (unassigned) resources. */
export async function getGoalResources(goalId: string, userId: string): Promise<ResourceResponse[]> {
  const goal = await findOwnedGoal(goalId, userId);
  const links = await prisma.resourceLearningGoal.findMany({
    where: { goalId: goal.id, userId },
    include: { resource: true },
    orderBy: { createdAt: "asc" },
  });
  return links.map((l) => toResourceResponse(l.resource));
}

/**
 * Link a Resource to a Goal (goal-level / unassigned). Both must belong to
 * the user. Idempotent: linking an already-linked Resource is a no-op.
 */
export async function linkResourceToGoal(
  goalId: string,
  resourceId: string,
  userId: string,
): Promise<void> {
  await findOwnedGoal(goalId, userId);
  // The Resource must belong to the same user (ownership-safe linking).
  const resource = await prisma.resource.findFirst({ where: { id: resourceId, userId } });
  if (!resource) throw new NotFoundError("Resource");
  await prisma.resourceLearningGoal.create({
    data: { goalId, resourceId, userId },
  }).catch((err: unknown) => {
    // P2002 = duplicate link — treat as already linked (idempotent)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return;
    throw err;
  });
}

/** Unlink a Resource from a Goal. Preserves both entities. */
export async function unlinkResourceFromGoal(
  goalId: string,
  resourceId: string,
  userId: string,
): Promise<void> {
  const goal = await findOwnedGoal(goalId, userId);
  const result = await prisma.resourceLearningGoal.deleteMany({
    where: { goalId: goal.id, resourceId, userId },
  });
  if (result.count === 0) throw new NotFoundError("Resource link");
}
