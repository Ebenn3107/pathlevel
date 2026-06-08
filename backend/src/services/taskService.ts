import { prisma } from "../config/database";
import { Prisma } from "@prisma/client";

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

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
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

/** Update a task for a user. */
export async function updateTask(
  id: string,
  userId: string,
  input: UpdateTaskInput,
): Promise<TaskResponse> {
  try {
    return await prisma.task.update({
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
