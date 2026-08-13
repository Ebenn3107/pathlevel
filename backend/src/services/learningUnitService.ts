import { prisma } from "../config/database";
import { Prisma, LearningUnitStatus } from "@prisma/client";
import { NotFoundError, ValidationError } from "../types/error";
import { toResourceResponse, type ResourceResponse } from "./resourceService";

/* ── Response types ───────────────────────────────────────────── */

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

export interface UnitDetailResponse extends UnitResponse {
  resources: ResourceResponse[];
}

export interface UpdateUnitInput {
  title?: string;
  description?: string | null;
  status?: LearningUnitStatus;
}

/* ── Status transition rules (user-driven) ────────────────────── */

export const UNIT_STATUS_TRANSITIONS: Record<LearningUnitStatus, LearningUnitStatus[]> = {
  NOT_STARTED: ["IN_PROGRESS", "COMPLETED"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: ["REOPENED"],
  REOPENED: ["IN_PROGRESS", "COMPLETED"],
};

function toUnitResponse(unit: {
  id: string;
  goalId: string;
  title: string;
  description: string | null;
  status: LearningUnitStatus;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): UnitResponse {
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

/** Fetch a unit only if it belongs to the user. */
async function findOwnedUnit(unitId: string, userId: string) {
  const unit = await prisma.learningUnit.findFirst({ where: { id: unitId, userId } });
  if (!unit) throw new NotFoundError("Learning unit");
  return unit;
}

/* ── Unit CRUD ────────────────────────────────────────────────── */

/** Get a single unit with its linked Resources. */
export async function getUnit(unitId: string, userId: string): Promise<UnitDetailResponse> {
  const unit = await prisma.learningUnit.findFirst({
    where: { id: unitId, userId },
    include: {
      resources: {
        include: { resource: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!unit) throw new NotFoundError("Learning unit");

  return {
    ...toUnitResponse(unit),
    resources: unit.resources.map((r) => toResourceResponse(r.resource)),
  };
}

/** Get all sessions attached to a unit (ordered newest first). */
export async function getUnitSessions(unitId: string, userId: string) {
  const unit = await prisma.learningUnit.findFirst({ where: { id: unitId, userId } });
  if (!unit) throw new NotFoundError("Learning unit");

  return prisma.learningSession.findMany({
    where: { learningUnitId: unit.id, userId },
    include: { summary: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Update a unit (title/description) and/or its status.
 *
 * Status is user-driven and validated against the approved transitions:
 *   NOT_STARTED → IN_PROGRESS, COMPLETED
 *   IN_PROGRESS → COMPLETED
 *   COMPLETED → REOPENED
 *   REOPENED → IN_PROGRESS, COMPLETED
 *
 * `completedAt` is set when a unit becomes COMPLETED and cleared when it is
 * reopened. Completion is never derived from Resources, Sessions, time, or XP.
 *
 * NOTE: Unit-completion XP is NOT awarded in this slice — it is deferred
 * (see Slice 3 report). This function intentionally does not touch XP.
 */
export async function updateUnit(
  unitId: string,
  userId: string,
  input: UpdateUnitInput,
): Promise<UnitResponse> {
  const existing = await findOwnedUnit(unitId, userId);

  let status = input.status;
  if (status !== undefined) {
    const allowed = UNIT_STATUS_TRANSITIONS[existing.status];
    if (!allowed.includes(status)) {
      throw new ValidationError(
        `Invalid unit status transition from ${existing.status} to ${status}`,
      );
    }
  }

  const completedAt =
    status === "COMPLETED"
      ? new Date()
      : status === "REOPENED"
        ? null
        : undefined;

  const unit = await prisma.learningUnit.update({
    where: { id: existing.id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(status !== undefined && { status }),
      ...(completedAt !== undefined && { completedAt }),
    },
  });
  return toUnitResponse(unit);
}

/** Delete a unit. Cascades its Resource junction rows; Resources are kept. */
export async function deleteUnit(unitId: string, userId: string): Promise<void> {
  const existing = await findOwnedUnit(unitId, userId);
  await prisma.learningUnit.delete({ where: { id: existing.id } });
}

/* ── Unit Resources ───────────────────────────────────────────── */

/** List Resources linked to a unit. */
export async function getUnitResources(unitId: string, userId: string): Promise<ResourceResponse[]> {
  const unit = await findOwnedUnit(unitId, userId);
  const links = await prisma.resourceLearningUnit.findMany({
    where: { unitId: unit.id, userId },
    include: { resource: true },
    orderBy: { createdAt: "asc" },
  });
  return links.map((l) => toResourceResponse(l.resource));
}

/**
 * Link a Resource to a Unit. Both must belong to the user. Idempotent:
 * linking an already-linked Resource is a no-op. The Resource is never
 * duplicated or moved out of the Library.
 */
export async function linkResourceToUnit(
  unitId: string,
  resourceId: string,
  userId: string,
): Promise<void> {
  await findOwnedUnit(unitId, userId);
  // The Resource must belong to the same user (ownership-safe linking).
  const resource = await prisma.resource.findFirst({ where: { id: resourceId, userId } });
  if (!resource) throw new NotFoundError("Resource");
  await prisma.resourceLearningUnit.create({
    data: { unitId, resourceId, userId },
  }).catch((err: unknown) => {
    // P2002 = duplicate link — treat as already linked (idempotent)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return;
    throw err;
  });
}

/** Unlink a Resource from a Unit. Preserves both entities. */
export async function unlinkResourceFromUnit(
  unitId: string,
  resourceId: string,
  userId: string,
): Promise<void> {
  const unit = await findOwnedUnit(unitId, userId);
  const result = await prisma.resourceLearningUnit.deleteMany({
    where: { unitId: unit.id, resourceId, userId },
  });
  if (result.count === 0) throw new NotFoundError("Resource link");
}
