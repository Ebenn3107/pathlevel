import { z } from "zod";

export const MAX_SEARCH_QUERY_LENGTH = 100;

/**
 * Search query validation. `q` is required, trimmed, non-empty, and capped at
 * a reasonable length. Empty/whitespace-only queries are rejected (400).
 */
export const searchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, "Query is required")
    .max(MAX_SEARCH_QUERY_LENGTH, `Query must be ${MAX_SEARCH_QUERY_LENGTH} characters or fewer`),
});
