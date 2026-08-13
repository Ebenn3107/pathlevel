import { prisma } from "../config/database";
import { ResourceSourceType } from "@prisma/client";
import { toResourceResponse, type ResourceResponse } from "./resourceService";

/**
 * Resource-first search (Slice 5).
 *
 * Semantics: deterministic keyword search over Resource title, description,
 * and tags. Case-insensitive (ILIKE) and whitespace-tolerant (query is trimmed
 * and collapsed before matching). Results are scoped to the authenticated user.
 *
 * Implementation note: ILIKE over `array_to_string(tags, ' ')` is used rather
 * than a PostgreSQL to_tsvector FTS index. For a personal dataset this is
 * materially safer: it needs no schema migration (FTS over a text[] column
 * would require a generated tsvector column or inline cast that is not
 * indexable), it supports substring matches (searching "over" finds
 * "Overview"), and it is fully parameterized + wildcard-escaped. This matches
 * the approved "deterministic keyword/full-text" direction for the current
 * data volume; an FTS index can be added later if the dataset grows.
 *
 * Ordering is deterministic: title match > description match > tag match,
 * then updatedAt DESC, then id ASC.
 */

/** Escape LIKE wildcards so user input is matched literally. */
function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, "\\$&");
}

/** Normalize a search term: trim + collapse internal whitespace. */
export function normalizeSearchTerm(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/** Column shape returned by the raw query (aliased to camelCase). */
interface SearchResourceRow {
  id: string;
  title: string;
  url: string | null;
  description: string | null;
  tags: string[];
  libraryStatus: "INBOX" | "SAVED" | "ARCHIVED";
  progress: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  thumbnailUrl: string | null;
  siteName: string | null;
  sourceType: ResourceSourceType | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Search a user's Resources by a keyword. `query` must already be normalized
 * (non-empty after trim). Never searches another user's Resources.
 */
export async function searchResources(userId: string, query: string): Promise<ResourceResponse[]> {
  const pattern = `%${escapeLike(query)}%`;

  const rows = await prisma.$queryRaw<SearchResourceRow[]>`
    SELECT
      id,
      title,
      url,
      description,
      tags,
      "library_status" AS "libraryStatus",
      progress,
      "thumbnail_url" AS "thumbnailUrl",
      "site_name" AS "siteName",
      "source_type" AS "sourceType",
      "created_at" AS "createdAt",
      "updated_at" AS "updatedAt"
    FROM "resources"
    WHERE "user_id" = ${userId}
      AND (
        title ILIKE ${pattern}
        OR description ILIKE ${pattern}
        OR array_to_string(tags, ' ') ILIKE ${pattern}
      )
    ORDER BY
      CASE
        WHEN title ILIKE ${pattern} THEN 0
        WHEN description ILIKE ${pattern} THEN 1
        ELSE 2
      END ASC,
      "updated_at" DESC,
      id ASC
  `;

  return rows.map(toResourceResponse);
}
