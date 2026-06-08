import { useQuery } from '@tanstack/react-query';
import { getResources } from '../api/resources';
import { resourceKeys } from '../query-keys';

export function useResources() {
  return useQuery({
    queryKey: resourceKeys.lists(),
    queryFn: getResources,
  });
}
