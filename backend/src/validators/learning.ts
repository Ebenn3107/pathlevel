import { z } from "zod";

export const createSessionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  notes: z.string().optional(),
  duration: z.number().int().positive("Duration must be a positive number"),
  startedAt: z.string().optional(),
  learningUnitId: z.string().optional(),
});

export const updateSessionSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  notes: z.string().optional(),
  duration: z.number().int().positive("Duration must be a positive number").optional(),
  startedAt: z.string().optional(),
  endedAt: z.string().nullable().optional(),
  learningUnitId: z.string().nullable().optional(),
});

export const linkResourceSchema = z.object({
  resourceId: z.string().min(1, "resourceId is required"),
});

export const createSummarySchema = z.object({
  content: z.string().min(1, "Summary content is required"),
});
