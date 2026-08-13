import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, Badge } from '../../../components/ui';
import { useSaveResource, useArchiveResource, useRestoreResource, useUpdateResource } from '../hooks/useResourceMutations';
import { resourceKeys } from '../query-keys';
import { LIBRARY_STATUS_LABELS, PROGRESS_LABELS, PROGRESS_ORDER } from '../types';
import type { Resource, ResourceProgress, ResourceSourceType } from '../types';

const PROGRESS_BADGE: Record<ResourceProgress, 'secondary' | 'tertiary' | 'muted'> = {
  NOT_STARTED: 'muted',
  IN_PROGRESS: 'tertiary',
  COMPLETED: 'secondary',
};

const SOURCE_LABEL: Record<ResourceSourceType, string> = {
  ARTICLE: 'Article',
  VIDEO: 'Video',
  DOCUMENT: 'Document',
  WEBSITE: 'Website',
  OTHER: 'Other',
};

const SOURCE_ICON: Record<ResourceSourceType, string> = {
  ARTICLE: 'M9 12h6m-6 4h6M12 5l7 7-7 7H6a1 1 0 01-1-1V6a1 1 0 011-1h6z',
  VIDEO: 'M7 4v16l13-8z',
  DOCUMENT: 'M9 12h6m-6 4h6M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8l-5-5zM14 3v5h5',
  WEBSITE: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0zM3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18',
  OTHER: 'M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8-5-3.7-5 3.7 1.9-5.8L4 8.8h6.1z',
};

/** Display hostname from a URL (keeps the external link readable + short). */
function displayHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ── Thumbnail zone (with clean fallbacks) ────────────────────── */

function Thumbnail({ resource }: { resource: Resource }) {
  const [broken, setBroken] = useState(false);

  // Fallback placeholder: source-type icon when known, else neutral.
  const placeholder = (
    <div className="flex aspect-video w-full items-center justify-center bg-container">
      <svg className="h-10 w-10 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={resource.sourceType ? SOURCE_ICON[resource.sourceType] : SOURCE_ICON.OTHER} />
      </svg>
    </div>
  );

  if (!resource.thumbnailUrl || broken) {
    return placeholder;
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border border-border/60 bg-container">
      <img
        src={resource.thumbnailUrl}
        alt=""
        loading="lazy"
        onError={() => setBroken(true)}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

/* ── Resource card ────────────────────────────────────────────── */

interface ResourceCardProps {
  resource: Resource;
  onEdit: (r: Resource) => void;
  onDelete: (r: Resource) => void;
  onAddToLearning: (r: Resource) => void;
}

export default function ResourceCard({ resource, onEdit, onDelete, onAddToLearning }: ResourceCardProps) {
  const queryClient = useQueryClient();
  const saveMutation = useSaveResource();
  const archiveMutation = useArchiveResource();
  const restoreMutation = useRestoreResource();
  const progressMutation = useUpdateResource();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: resourceKeys.all });

  const handleProgressCycle = () => {
    const current = PROGRESS_ORDER.indexOf(resource.progress);
    const next = PROGRESS_ORDER[(current + 1) % PROGRESS_ORDER.length];
    progressMutation.mutate({ id: resource.id, input: { progress: next } }, { onSuccess: invalidate });
  };

  const handleSave = () => saveMutation.mutate(resource.id, { onSuccess: invalidate });
  const handleArchive = () => archiveMutation.mutate(resource.id, { onSuccess: invalidate });
  const handleRestore = () => restoreMutation.mutate(resource.id, { onSuccess: invalidate });

  const statusVariant =
    resource.libraryStatus === 'INBOX' ? 'primary' : resource.libraryStatus === 'ARCHIVED' ? 'muted' : 'secondary';

  const visibleTags = resource.tags.slice(0, 3);
  const extraTagCount = Math.max(0, resource.tags.length - visibleTags.length);

  const progressPct =
    resource.progress === 'COMPLETED' ? 100 : resource.progress === 'IN_PROGRESS' ? 50 : 0;

  return (
    <Card className="hover:border-border/80">
      {/* Desktop: three-zone horizontal layout. Mobile: stacked. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Zone 1 — Thumbnail / visual anchor (≈28–30% width) */}
        <div className="w-full shrink-0 sm:w-[50%]">
          <Thumbnail resource={resource} />
        </div>

        {/* Zone 2 — Information */}
        <div className="min-w-0 flex-1">
          {/* Metadata row (primary, compact) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {resource.sourceType && (
              <Badge variant="neutral">{SOURCE_LABEL[resource.sourceType]}</Badge>
            )}
            <Badge variant={statusVariant}>{LIBRARY_STATUS_LABELS[resource.libraryStatus]}</Badge>
            <Badge variant={PROGRESS_BADGE[resource.progress]}>
              {PROGRESS_LABELS[resource.progress]}
            </Badge>
          </div>

          {/* Title — primary text element */}
          <p className="mt-2.5 text-base font-semibold leading-snug text-gray-100">{resource.title}</p>

          {/* Site/source */}
          {resource.siteName && <p className="mt-0.5 text-xs text-muted">{resource.siteName}</p>}

          {/* Description — clamped */}
          {resource.description && (
            <p className="mt-1.5 line-clamp-2 text-sm text-muted">{resource.description}</p>
          )}

          {/* Tags — subtle secondary chips, capped with +N */}
          {(visibleTags.length > 0 || extraTagCount > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-border/60 px-1.5 py-0.5 text-[10px] font-medium normal-case text-muted"
                >
                  {tag}
                </span>
              ))}
              {extraTagCount > 0 && (
                <span className="rounded border border-border/60 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                  +{extraTagCount}
                </span>
              )}
            </div>
          )}

          {/* URL — secondary, hostname-first with external link */}
          {resource.url && (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex max-w-full items-center gap-1 text-xs text-tertiary hover:underline"
            >
              <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="truncate">{displayHost(resource.url)}</span>
            </a>
          )}

          {/* Saved time */}
          <p className="mt-2 text-[10px] uppercase tracking-[0.08em] text-muted">
            {LIBRARY_STATUS_LABELS[resource.libraryStatus]} {timeAgo(resource.updatedAt)}
          </p>
        </div>

        {/* Zone 3 — Progress + actions (grouped and labeled) */}
        <div className="flex shrink-0 flex-row items-start justify-between gap-3 sm:w-[20%] sm:flex-col sm:items-end">
          {/* Progress block */}
          <div className="flex min-w-[90px] flex-col gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted">Progress</span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-white">{progressPct}%</span>
              <span className="text-[10px] uppercase tracking-[0.08em] text-muted">
                {PROGRESS_LABELS[resource.progress]}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <button
              onClick={handleProgressCycle}
              disabled={progressMutation.isPending}
              aria-label={`Progress: ${PROGRESS_LABELS[resource.progress]} — change progress`}
              title={`Progress: ${PROGRESS_LABELS[resource.progress]} — click to change`}
              className="rounded border border-border/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted transition-colors hover:border-primary/40 hover:text-white disabled:opacity-50"
            >
              Change
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-row items-center gap-1 sm:flex-col sm:items-end">
            {/* Save (Inbox → SAVED) */}
            {resource.libraryStatus === 'INBOX' && (
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="rounded px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-secondary transition-colors hover:bg-secondary/10"
                title="Save to Library"
              >
                Save
              </button>
            )}

            {/* Add to Learning */}
            {resource.libraryStatus !== 'ARCHIVED' && (
              <button
                onClick={() => onAddToLearning(resource)}
                className="rounded px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-primary transition-colors hover:bg-primary/10"
                title="Add to Learning"
              >
                Add to Learning
              </button>
            )}

            {/* Archive / Restore */}
            {resource.libraryStatus !== 'ARCHIVED' ? (
              <button
                onClick={handleArchive}
                disabled={archiveMutation.isPending}
                aria-label="Archive resource"
                title="Archive"
                className="rounded p-1.5 text-muted transition-colors hover:bg-container hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleRestore}
                disabled={restoreMutation.isPending}
                aria-label="Restore resource"
                title="Restore"
                className="rounded p-1.5 text-muted transition-colors hover:bg-container hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h13a5 5 0 010 10H9M3 10l4-4m-4 4l4 4" />
                </svg>
              </button>
            )}

            {/* Edit */}
            <button
              onClick={() => onEdit(resource)}
              aria-label="Edit resource"
              title="Edit"
              className="rounded p-1.5 text-muted transition-colors hover:bg-container hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            {/* Delete */}
            <button
              onClick={() => onDelete(resource)}
              aria-label="Delete resource"
              title="Delete"
              className="rounded p-1.5 text-muted transition-colors hover:bg-container hover:text-red-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
