import { z } from "zod";

const frequencies = ["daily", "weekly", "monthly"] as const;

export const createHabitSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  frequency: z.enum(frequencies).optional(),
});

export const updateHabitSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  description: z.string().optional(),
  frequency: z.enum(frequencies).optional(),
});
