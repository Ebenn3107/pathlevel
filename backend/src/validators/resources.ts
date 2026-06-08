import { z } from "zod";

export const createResourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Invalid URL format").optional().or(z.literal("")),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateResourceSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  url: z.string().url("Invalid URL format").nullable().optional().or(z.literal("")),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  completed: z.boolean().optional(),
});
