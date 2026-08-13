import { z } from "zod";

export const resourceLibraryStatuses = ["INBOX", "SAVED", "ARCHIVED"] as const;
export const resourceProgresses = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const;

export const createResourceSchema = z
  .object({
    // Title may be empty when a URL is provided (capture-first rule); the
    // refine below enforces "title OR url".
    title: z.string().min(1, "Title is required").or(z.literal("")),
    url: z.string().url("Invalid URL format").optional().or(z.literal("")),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    libraryStatus: z.enum(resourceLibraryStatuses).optional(),
    progress: z.enum(resourceProgresses).optional(),
    // Deprecated compatibility shorthand — maps to `progress`.
    completed: z.boolean().optional(),
  })
  // "Capture first, organize later": a title OR a URL is sufficient. When the
  // title is empty, a URL must be present (metadata enrichment may fill it).
  .refine((v) => (v.title?.trim().length ?? 0) > 0 || Boolean(v.url?.trim()), {
    message: "Title or URL is required",
    path: ["title"],
  });

export const updateResourceSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  url: z.string().url("Invalid URL format").nullable().optional().or(z.literal("")),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  libraryStatus: z.enum(resourceLibraryStatuses).optional(),
  progress: z.enum(resourceProgresses).optional(),
  // Deprecated compatibility shorthand — maps to `progress`.
  completed: z.boolean().optional(),
});
