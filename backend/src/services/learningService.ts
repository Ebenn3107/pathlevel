import { prisma } from "../config/database";
import { Prisma } from "@prisma/client";
import { NotFoundError } from "../types/error";

export interface LearningSessionResponse {
  id: string;
  title: string;
  notes: string | null;
  duration: number;
  startedAt: Date;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLearningInput {
  title: string;
  notes?: string;
  duration: number;
  startedAt?: string;
}

export interface UpdateLearningInput {
  title?: string;
  notes?: string;
  duration?: number;
  startedAt?: string;
  endedAt?: string | null;
}



/** Get all learning sessions for a user. */
export async function getSessions(userId: string): Promise<LearningSessionResponse[]> {
  return prisma.learningSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/** Create a new learning session for a user. */
export async function createSession(
  userId: string,
  input: CreateLearningInput,
): Promise<LearningSessionResponse> {
  return prisma.learningSession.create({
    data: {
      userId,
      title: input.title,
      notes: input.notes ?? null,
      duration: input.duration,
      startedAt: input.startedAt ? new Date(input.startedAt) : new Date(),
    },
  });
}

/** Update a learning session for a user. */
export async function updateSession(
  id: string,
  userId: string,
  input: UpdateLearningInput,
): Promise<LearningSessionResponse> {
  try {
    return await prisma.learningSession.update({
      where: { id, userId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.duration !== undefined && { duration: input.duration }),
        ...(input.startedAt !== undefined && { startedAt: new Date(input.startedAt) }),
        ...(input.endedAt !== undefined && {
          endedAt: input.endedAt ? new Date(input.endedAt) : null,
        }),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw new NotFoundError("Learning session");
    }
    throw err;
  }
}

/** Delete a learning session for a user. */
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
