import { useQuery } from '@tanstack/react-query';
import { searchResources } from '../api/search';

export const searchKeys = {
  all: ['search'] as const,
  results: (q: string) => [...searchKeys.all, q] as const,
};

/** Search Resources for a non-empty query (disabled when empty). */
export function useSearch(q: string) {
  const trimmed = q.trim();
  return useQuery({
    queryKey: searchKeys.results(trimmed),
    queryFn: () => searchResources(trimmed),
    enabled: trimmed.length > 0,
  });
}
