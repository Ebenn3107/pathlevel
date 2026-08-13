import { prisma } from "../config/database";
import { Prisma, LearningSummary } from "@prisma/client";
import { NotFoundError } from "../types/error";
import { recordXp, XP_VALUES } from "./xpService";
import { evaluateAchievements } from "./achievementService";
import { toResourceResponse, type ResourceResponse } from "./resourceService";

export interface LearningSessionResponse {
  id: string;
  title: string;
  /** Deprecated legacy field — content migrated into LearningSummary. */
  notes: string | null;
  duration: number;
  startedAt: Date;
  endedAt: Date | null;
  learningUnitId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionSummaryResponse {
  id: string;
  sessionId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Result of updating a learning session. */
export interface UpdateSessionResult {
  session: LearningSessionResponse;
  newAchievements?: { code: string; title: string; icon: string }[];
}

export interface CreateLearningInput {
  title: string;
  notes?: string;
  duration: number;
  startedAt?: string;
  learningUnitId?: string;
}

export interface UpdateLearningInput {
  title?: string;
  notes?: string;
  duration?: number;
  startedAt?: string;
  endedAt?: string | null;
  learningUnitId?: string | null;
}

function toSessionResponse(s: {
  id: string;
  title: string;
  notes: string | null;
  duration: number;
  startedAt: Date;
  endedAt: Date | null;
  learningUnitId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): LearningSessionResponse {
  return {
    id: s.id,
    title: s.title,
    notes: s.notes,
    duration: s.duration,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    learningUnitId: s.learningUnitId,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

function toSummaryResponse(s: LearningSummary): SessionSummaryResponse {
  return {
    id: s.id,
    sessionId: s.sessionId,
    content: s.content,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

/** Verify the session belongs to the user. */
async function findOwnedSession(sessionId: string, userId: string) {
  const session = await prisma.learningSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) throw new NotFoundError("Learning session");
  return session;
}

/** Verify the unit belongs to the user (for optional Unit context). */
async function findOwnedUnit(unitId: string, userId: string) {
  const unit = await prisma.learningUnit.findFirst({ where: { id: unitId, userId } });
  if (!unit) throw new NotFoundError("Learning unit");
  return unit;
}



/** Get all learning sessions for a user. */
export async function getSessions(userId: string): Promise<LearningSessionResponse[]> {
  const sessions = await prisma.learningSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return sessions.map(toSessionResponse);
}

/** Get sessions for a specific unit. */
export async function getUnitSessions(unitId: string, userId: string): Promise<LearningSessionResponse[]> {
  const unit = await findOwnedUnit(unitId, userId);
  const sessions = await prisma.learningSession.findMany({
    where: { learningUnitId: unit.id, userId },
    orderBy: { createdAt: "desc" },
  });
  return sessions.map(toSessionResponse);
}

/**
 * Create a new learning session.
 *
 * A session may exist WITHOUT a Unit (retrospective / unorganized activity).
 * When a `learningUnitId` is provided it must belong to the user.
 */
export async function createSession(
  userId: string,
  input: CreateLearningInput,
): Promise<LearningSessionResponse> {
  if (input.learningUnitId) {
    await findOwnedUnit(input.learningUnitId, userId);
  }
  const session = await prisma.learningSession.create({
    data: {
      userId,
      title: input.title,
      notes: input.notes ?? null,
      duration: input.duration,
      startedAt: input.startedAt ? new Date(input.startedAt) : new Date(),
      learningUnitId: input.learningUnitId ?? null,
    },
  });
  return toSessionResponse(session);
}

/**
 * Update a learning session for a user.
 *
 * Setting `endedAt` (finishing the session) awards XP and evaluates
 * achievements atomically with the session update. Finishing an already
 * finished session is a no-op for XP: the unique (userId, reason, reference)
 * constraint makes the award idempotent, so no duplicate XP or achievement
 * is created.
 */
export async function updateSession(
  id: string,
  userId: string,
  input: UpdateLearningInput,
): Promise<UpdateSessionResult> {
  if (input.learningUnitId) {
    await findOwnedUnit(input.learningUnitId, userId);
  }

  const persist = async (db: Prisma.TransactionClient): Promise<LearningSessionResponse> => {
    const updated = await db.learningSession.update({
      where: { id, userId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.duration !== undefined && { duration: input.duration }),
        ...(input.startedAt !== undefined && { startedAt: new Date(input.startedAt) }),
        ...(input.learningUnitId !== undefined && { learningUnitId: input.learningUnitId }),
        ...(input.endedAt !== undefined && {
          endedAt: input.endedAt ? new Date(input.endedAt) : null,
        }),
      },
    });

    if (input.endedAt) {
      await recordXp(userId, XP_VALUES.session_completed, "session_completed", id, db);
      await evaluateAchievements(userId, db);
    }

    return updated;
  };

  try {
    const session = await prisma.$transaction(persist);
    return { session: toSessionResponse(session) };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw new NotFoundError("Learning session");
    }
    throw err;
  }
}

/** Delete a learning session for a user. Cascades its Summary + Resource junction rows; Resources are kept. */
export async function deleteSession(
  id: string,
  userId: string,
): Promise<void> {
  try {
    await prisma.learningSession.delete({
      where: { id, userId },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw new NotFoundError("Learning session");
    }
    throw err;
  }
}

/* ── Session Resources (M:N) ──────────────────────────────────── */

/** List Resources linked to a session. */
export async function getSessionResources(sessionId: string, userId: string): Promise<ResourceResponse[]> {
  const session = await findOwnedSession(sessionId, userId);
  const links = await prisma.sessionResource.findMany({
    where: { sessionId: session.id, userId },
    include: { resource: true },
    orderBy: { createdAt: "asc" },
  });
  return links.map((l) => toResourceResponse(l.resource));
}

/** Link a Resource to a Session. Idempotent; Resource is never duplicated or modified. */
export async function linkResourceToSession(
  sessionId: string,
  resourceId: string,
  userId: string,
): Promise<void> {
  await findOwnedSession(sessionId, userId);
  // The Resource must belong to the same user (ownership-safe linking).
  const resource = await prisma.resource.findFirst({ where: { id: resourceId, userId } });
  if (!resource) throw new NotFoundError("Resource");
  await prisma.sessionResource.create({
    data: { sessionId, resourceId, userId },
  }).catch((err: unknown) => {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return;
    throw err;
  });
}

/** Unlink a Resource from a Session. Preserves both entities. */
export async function unlinkResourceFromSession(
  sessionId: string,
  resourceId: string,
  userId: string,
): Promise<void> {
  const session = await findOwnedSession(sessionId, userId);
  const result = await prisma.sessionResource.deleteMany({
    where: { sessionId: session.id, resourceId, userId },
  });
  if (result.count === 0) throw new NotFoundError("Resource link");
}

/* ── Summaries ────────────────────────────────────────────────── */

/** Get the (optional) summary for a session. */
export async function getSessionSummary(sessionId: string, userId: string): Promise<SessionSummaryResponse | null> {
  const session = await findOwnedSession(sessionId, userId);
  const summary = await prisma.learningSummary.findUnique({ where: { sessionId: session.id } });
  return summary ? toSummaryResponse(summary) : null;
}

/** Create or replace the summary for a session (one summary per session). */
export async function upsertSessionSummary(
  sessionId: string,
  userId: string,
  content: string,
): Promise<SessionSummaryResponse> {
  const session = await findOwnedSession(sessionId, userId);
  const summary = await prisma.learningSummary.upsert({
    where: { sessionId: session.id },
    update: { content },
    create: { userId, sessionId: session.id, content },
  });
  return toSummaryResponse(summary);
}

/** Delete the summary for a session (skip). */
export async function deleteSessionSummary(sessionId: string, userId: string): Promise<void> {
  const session = await findOwnedSession(sessionId, userId);
  await prisma.learningSummary.deleteMany({ where: { sessionId: session.id, userId } });
}
