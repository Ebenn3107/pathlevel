export type ResourceLibraryStatus = 'INBOX' | 'SAVED' | 'ARCHIVED';
export type ResourceProgress = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type ResourceSourceType = 'ARTICLE' | 'VIDEO' | 'DOCUMENT' | 'WEBSITE' | 'OTHER';

export interface Resource {
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
  /** Deprecated compatibility field — use `progress` instead of `completed`. */
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceInput {
  title: string;
  url?: string;
  description?: string;
  tags?: string[];
  libraryStatus?: ResourceLibraryStatus;
  progress?: ResourceProgress;
}

export interface UpdateResourceInput {
  title?: string;
  url?: string | null;
  description?: string;
  tags?: string[];
  libraryStatus?: ResourceLibraryStatus;
  progress?: ResourceProgress;
}

/** List filters passed to GET /api/resources (both optional). */
export interface ResourceListParams {
  libraryStatus?: ResourceLibraryStatus;
  progress?: ResourceProgress;
}

export const RESOURCE_LIBRARY_STATUSES: ResourceLibraryStatus[] = ['INBOX', 'SAVED', 'ARCHIVED'];
export const RESOURCE_PROGRESSES: ResourceProgress[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];

export const LIBRARY_STATUS_LABELS: Record<ResourceLibraryStatus, string> = {
  INBOX: 'Inbox',
  SAVED: 'Saved',
  ARCHIVED: 'Archived',
};

export const PROGRESS_LABELS: Record<ResourceProgress, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};

export const PROGRESS_ORDER: ResourceProgress[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
