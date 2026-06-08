import { prisma } from "../config/database";
import { Prisma } from "@prisma/client";

export interface HabitResponse {
  id: string;
  title: string;
  description: string | null;
  frequency: string;
  streak: number;
  bestStreak: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHabitInput {
  title: string;
  description?: string;
  frequency?: string;
}

export interface UpdateHabitInput {
  title?: string;
  description?: string;
  frequency?: string;
}

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
}

/** Get all habits for a user. */
export async function getHabits(userId: string): Promise<HabitResponse[]> {
  return prisma.habit.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/** Create a new habit for a user. */
export async function createHabit(
  userId: string,
  input: CreateHabitInput,
): Promise<HabitResponse> {
  return prisma.habit.create({
    data: {
      userId,
      title: input.title,
      description: input.description ?? null,
      frequency: input.frequency ?? "daily",
    },
  });
}

/** Update a habit for a user. */
export async function updateHabit(
  id: string,
  userId: string,
  input: UpdateHabitInput,
): Promise<HabitResponse> {
  try {
    return await prisma.habit.update({
      where: { id, userId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.frequency !== undefined && { frequency: input.frequency }),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw new NotFoundError("Habit");
    }
    throw err;
  }
}

/** Delete a habit for a user. */
export async function deleteHabit(
  id: string,
  userId: string,
): Promise<void> {
  try {
    await prisma.habit.delete({
      where: { id, userId },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw new NotFoundError("Habit");
    }
    throw err;
  }
}
