import { prisma } from "../config/database";
import { Prisma } from "@prisma/client";
import { NotFoundError } from "../types/error";
import { recordXp, XP_VALUES } from "./xpService";
import { evaluateAchievements } from "./achievementService";

export interface TaskResponse {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  completed: boolean;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: string;
  completed?: boolean;
  dueDate?: string | null;
}

/** Result of updating a task. */
export interface UpdateTaskResult {
  task: TaskResponse;
  newAchievements?: { code: string; title: string; icon: string }[];
}


/** Get all tasks for a user. */
export async function getTasks(userId: string): Promise<TaskResponse[]> {
  return prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/** Create a new task for a user. */
export async function createTask(
  userId: string,
  input: CreateTaskInput,
): Promise<TaskResponse> {
  return prisma.task.create({
    data: {
      userId,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? "medium",
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
  });
}

/**
 * Update a task for a user.
 *
 * A task marked complete awards XP and evaluates achievements atomically
 * with the completion. Completing an already-completed task is a no-op for
 * XP: the unique (userId, reason, reference) constraint makes the award
 * idempotent, so no duplicate XP or achievement is created.
 */
export async function updateTask(
  id: string,
  userId: string,
  input: UpdateTaskInput,
): Promise<UpdateTaskResult> {
  const persist = async (db: Prisma.TransactionClient): Promise<UpdateTaskResult> => {
    const updated = await db.task.update({
      where: { id, userId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.completed !== undefined && {
          completed: input.completed,
          completedAt: input.completed ? new Date() : null,
        }),
        ...(input.dueDate !== undefined && {
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        }),
      },
    });

    let newAchievements: { code: string; title: string; icon: string }[] | undefined;
    if (input.completed === true) {
      await recordXp(userId, XP_VALUES.task_completed, "task_completed", id, db);
      newAchievements = await evaluateAchievements(userId, db);
    }

    return { task: updated, newAchievements };
  };

  try {
    return await prisma.$transaction(persist);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw new NotFoundError("Task");
    }
    throw err;
  }
}

/** Delete a task for a user. */
export async function deleteTask(
  id: string,
  userId: string,
): Promise<void> {
  try {
    await prisma.task.delete({
      where: { id, userId },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw new NotFoundError("Task");
    }
    throw err;
  }
}
