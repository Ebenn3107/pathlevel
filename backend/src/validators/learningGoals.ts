import { z } from "zod";

export const learningUnitStatuses = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "REOPENED"] as const;

export const createGoalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  description: z.string().nullable().optional(),
});

export const createUnitSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export const updateUnitSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  description: z.string().nullable().optional(),
  status: z.enum(learningUnitStatuses).optional(),
});

export const linkResourceSchema = z.object({
  resourceId: z.string().min(1, "resourceId is required"),
});
