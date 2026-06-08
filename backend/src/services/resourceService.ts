import { prisma } from "../config/database";
import { Prisma } from "@prisma/client";
import { NotFoundError } from "../types/error";

export interface ResourceResponse {
  id: string;
  title: string;
  url: string | null;
  description: string | null;
  tags: string[];
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateResourceInput {
  title: string;
  url?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateResourceInput {
  title?: string;
  url?: string | null;
  description?: string;
  tags?: string[];
  completed?: boolean;
}

/** Get all resources for a user. */
export async function getResources(userId: string): Promise<ResourceResponse[]> {
  return prisma.resource.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/** Create a new resource for a user. */
export async function createResource(
  userId: string,
  input: CreateResourceInput,
): Promise<ResourceResponse> {
  return prisma.resource.create({
    data: {
      userId,
      title: input.title,
      url: input.url ?? null,
      description: input.description ?? null,
      tags: input.tags ?? [],
    },
  });
}

/** Update a resource for a user. */
export async function updateResource(
  id: string,
  userId: string,
  input: UpdateResourceInput,
): Promise<ResourceResponse> {
  try {
    return await prisma.resource.update({
      where: { id, userId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.url !== undefined && { url: input.url }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.completed !== undefined && { completed: input.completed }),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw new NotFoundError("Resource");
    }
    throw err;
  }
}

/** Delete a resource for a user. */
export async function deleteResource(
  id: string,
  userId: string,
): Promise<void> {
  try {
    await prisma.resource.delete({
      where: { id, userId },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw new NotFoundError("Resource");
    }
    throw err;
  }
}
