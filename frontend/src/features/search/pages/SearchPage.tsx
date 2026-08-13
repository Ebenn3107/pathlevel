import { useSearchParams } from 'react-router-dom';
import { Card, Spinner, Badge } from '../../../components/ui';
import { useSearch } from '../hooks/useSearch';
import type { Resource } from '../../resources/types';

const STATUS_LABELS: Record<Resource['libraryStatus'], string> = {
  INBOX: 'Inbox',
  SAVED: 'Saved',
  ARCHIVED: 'Archived',
};

function statusVariant(status: Resource['libraryStatus']): 'primary' | 'secondary' | 'muted' {
  if (status === 'INBOX') return 'primary';
  if (status === 'ARCHIVED') return 'muted';
  return 'secondary';
}

/** A single Resource search result (mirrors the Library card language). */
function SearchResultCard({ resource }: { resource: Resource }) {
  return (
    <Card className="hover:border-border/80">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(resource.libraryStatus)}>
              {STATUS_LABELS[resource.libraryStatus]}
            </Badge>
            <Badge variant="muted">{resource.progress.replace('_', ' ')}</Badge>
            {resource.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="neutral" className="normal-case tracking-normal">
                {tag}
              </Badge>
            ))}
          </div>
          <p className="mt-3 text-base font-semibold text-gray-100">{resource.title}</p>
          {resource.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted">{resource.description}</p>
          )}
          {resource.url && (
            <div className="mt-2 flex items-center gap-1">
              <svg className="h-3 w-3 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-xs text-tertiary hover:underline"
              >
                {resource.url}
              </a>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/** Dedicated Search results view (Resource-first, Slice 5). */
export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const { data: results, isLoading, isError, error } = useSearch(q);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Search Results</h1>
        {q.trim() && <p className="mt-1 text-sm text-muted">Results for &quot;{q.trim()}&quot;</p>}
      </div>

      {!q.trim() ? (
        <Card>
          <div className="py-8 text-center">
            <p className="text-sm text-gray-300">Type a query to search your Library</p>
            <p className="mt-1 text-xs text-muted">
              Search matches Resource titles, descriptions, and tags.
            </p>
          </div>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">
            {error instanceof Error ? error.message : 'Search failed.'}
          </p>
        </div>
      ) : !results || results.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <p className="text-sm text-gray-300">No matching resources</p>
            <p className="mt-1 text-xs text-muted">
              Nothing in your Library matches &quot;{q.trim()}&quot;.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted">
            {results.length} resource{results.length !== 1 ? 's' : ''} found
          </p>
          {results.map((resource) => (
            <SearchResultCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}
