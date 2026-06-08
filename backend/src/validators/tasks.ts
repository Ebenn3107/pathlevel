import { z } from "zod";

const priorities = ["low", "medium", "high"] as const;

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(priorities).optional(),
  dueDate: z.string().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  description: z.string().optional(),
  priority: z.enum(priorities).optional(),
  completed: z.boolean().optional(),
  dueDate: z.string().nullable().optional(),
});
