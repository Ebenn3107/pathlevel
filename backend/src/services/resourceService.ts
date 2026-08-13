import { prisma } from "../config/database";
import { Prisma, ResourceLibraryStatus, ResourceProgress, ResourceSourceType } from "@prisma/client";
import { NotFoundError } from "../types/error";
import { fetchPageMetadata } from "./metadataService";

export interface ResourceResponse {
  id: string;
  title: string;
  url: string | null;
  description: string | null;
  tags: string[];
  libraryStatus: ResourceLibraryStatus;
  progress: ResourceProgress;
  /** Deterministic metadata enrichment (Micro-Slice B) — optional. */
  thumbnailUrl: string | null;
  siteName: string | null;
  sourceType: ResourceSourceType | null;
  /** Deprecated compatibility field — derived from `progress`. */
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateResourceInput {
  title: string;
  url?: string;
  description?: string;
  tags?: string[];
  libraryStatus?: ResourceLibraryStatus;
  progress?: ResourceProgress;
  /** Deprecated compatibility shorthand — maps to `progress`. */
  completed?: boolean;
}

export interface UpdateResourceInput {
  title?: string;
  url?: string | null;
  description?: string;
  tags?: string[];
  libraryStatus?: ResourceLibraryStatus;
  progress?: ResourceProgress;
  /** Deprecated compatibility shorthand — maps to `progress`. */
  completed?: boolean;
}

/**
 * Derive the deprecated `completed` boolean from the canonical `progress`
 * value so the legacy API field stays consistent with the new source of truth.
 */
export function toResourceResponse(resource: {
  id: string;
  title: string;
  url: string | null;
  description: string | null;
  tags: string[];
  libraryStatus: ResourceLibraryStatus;
  progress: ResourceProgress;
  thumbnailUrl: string | null;
  siteName: string | null;
  sourceType: ResourceSourceType | null;
  createdAt: Date;
  updatedAt: Date;
}): ResourceResponse {
  return {
    ...resource,
    completed: resource.progress === "COMPLETED",
  };
}

/**
 * Normalize legacy `completed` input into an explicit `progress` value.
 * `completed` remains accepted as a deprecated shorthand; `progress` is the
 * canonical field and wins if both are provided.
 */
function resolveProgress(
  input: Pick<CreateResourceInput | UpdateResourceInput, "progress" | "completed">,
): ResourceProgress | undefined {
  if (input.progress !== undefined) return input.progress;
  if (input.completed !== undefined) return input.completed ? "COMPLETED" : "NOT_STARTED";
  return undefined;
}

/** Keep the deprecated `completed` column consistent with `progress`. */
function completedFromProgress(progress: ResourceProgress): boolean {
  return progress === "COMPLETED";
}

export interface ResourceListFilters {
  libraryStatus?: ResourceLibraryStatus;
  progress?: ResourceProgress;
}

/**
 * Get resources for a user, optionally filtered by library status and/or
 * progress. Filters are combined with AND and both are optional.
 */
export async function getResources(
  userId: string,
  filters: ResourceListFilters = {},
): Promise<ResourceResponse[]> {
  const resources = await prisma.resource.findMany({
    where: {
      userId,
      ...(filters.libraryStatus !== undefined && { libraryStatus: filters.libraryStatus }),
      ...(filters.progress !== undefined && { progress: filters.progress }),
    },
    orderBy: { createdAt: "desc" },
  });
  return resources.map(toResourceResponse);
}

/**
 * Create a new resource for a user.
 *
 * When a URL is provided, deterministic metadata (thumbnail, site name,
 * source type, and — only when the user left them empty — title/description)
 * is fetched. Metadata failure never prevents creation.
 */
export async function createResource(
  userId: string,
  input: CreateResourceInput,
): Promise<ResourceResponse> {
  // New resources default to the Library "INBOX" status (the approved model:
  // captures land in the Inbox). Existing resources stay SAVED (see migration).
  const progress = resolveProgress(input);
  const libraryStatus = input.libraryStatus ?? "INBOX";
  const resolvedProgress = progress ?? "NOT_STARTED";

  // Metadata enrichment is best-effort and never blocks creation.
  let meta: Awaited<ReturnType<typeof fetchPageMetadata>> = { ok: false, metadata: {} };
  if (input.url) {
    try {
      meta = await fetchPageMetadata(input.url);
    } catch {
      meta = { ok: false, metadata: {} };
    }
  }
  const m = meta.ok ? meta.metadata : {};

  const resource = await prisma.resource.create({
    data: {
      userId,
      // User-entered title/description always win over fetched values.
      title: input.title || m.title || input.url || "Untitled",
      url: input.url ?? null,
      description: input.description ?? m.description ?? null,
      tags: input.tags ?? [],
      libraryStatus,
      progress: resolvedProgress,
      thumbnailUrl: m.thumbnailUrl ?? null,
      siteName: m.siteName ?? null,
      sourceType: m.sourceType ?? null,
      // Keep the deprecated column consistent with the canonical value.
      completed: completedFromProgress(resolvedProgress),
    },
  });
  return toResourceResponse(resource);
}

/** Update a resource for a user. */
export async function updateResource(
  id: string,
  userId: string,
  input: UpdateResourceInput,
): Promise<ResourceResponse> {
  try {
    const progress = resolveProgress(input);
    const existing = await prisma.resource.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundError("Resource");

    // Re-enrich ONLY when the URL changes. Title/description-only updates do
    // not refetch metadata (user-entered title/description always win anyway).
    const urlChanged = input.url !== undefined && input.url !== existing.url;
    let meta: Awaited<ReturnType<typeof fetchPageMetadata>> | null = null;
    if (urlChanged && input.url) {
      try {
        meta = await fetchPageMetadata(input.url);
      } catch {
        meta = { ok: false, metadata: {} };
      }
    }
    const m = meta?.ok ? meta.metadata : {};

    const resource = await prisma.resource.update({
      where: { id, userId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.url !== undefined && { url: input.url }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.libraryStatus !== undefined && { libraryStatus: input.libraryStatus }),
        ...(progress !== undefined && {
          progress,
          completed: completedFromProgress(progress),
        }),
        // On URL change: refresh metadata (title/desc still user-first).
        ...(urlChanged && {
          thumbnailUrl: m.thumbnailUrl ?? null,
          siteName: m.siteName ?? null,
          sourceType: m.sourceType ?? null,
          ...(input.title === undefined && { title: m.title ?? existing.title }),
          ...(input.description === undefined && {
            description: m.description ?? existing.description,
          }),
        }),
      },
    });
    return toResourceResponse(resource);
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

/**
 * Archive a resource: move it to ARCHIVED without deleting it, clearing
 * metadata, or resetting progress. Reuses the ownership-scoped update path.
 */
export async function archiveResource(
  id: string,
  userId: string,
): Promise<ResourceResponse> {
  return updateResource(id, userId, { libraryStatus: "ARCHIVED" });
}

/**
 * Restore an archived resource: move it back to SAVED. Progress is preserved
 * (ARCHIVED does not reset progress). The Library lifecycle is
 * INBOX → SAVED → ARCHIVED; there is no separate "restored" status, so the
 * smallest deterministic behavior is to return to SAVED.
 */
export async function restoreResource(
  id: string,
  userId: string,
): Promise<ResourceResponse> {
  return updateResource(id, userId, { libraryStatus: "SAVED" });
}

/** Learning-context links for a resource (Goals and Units it is linked to). */
export interface ResourceLearningLinks {
  goals: { id: string; title: string }[];
  units: { id: string; title: string; goalId: string }[];
}

/**
 * Get the Learning links for a resource (read-only, for the "Add to Learning"
 * UI). The resource must belong to the user.
 */
export async function getResourceLearningLinks(
  resourceId: string,
  userId: string,
): Promise<ResourceLearningLinks> {
  const resource = await prisma.resource.findFirst({ where: { id: resourceId, userId } });
  if (!resource) throw new NotFoundError("Resource");

  const [goalLinks, unitLinks] = await Promise.all([
    prisma.resourceLearningGoal.findMany({
      where: { resourceId, userId },
      select: { goal: { select: { id: true, title: true } } },
    }),
    prisma.resourceLearningUnit.findMany({
      where: { resourceId, userId },
      select: { unit: { select: { id: true, title: true, goalId: true } } },
    }),
  ]);

  return {
    goals: goalLinks.map((l) => l.goal),
    units: unitLinks.map((l) => l.unit),
  };
}
