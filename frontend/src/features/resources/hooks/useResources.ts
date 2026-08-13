import { useQuery } from '@tanstack/react-query';
import { getResources } from '../api/resources';
import { resourceKeys } from '../query-keys';
import type { ResourceListParams } from '../types';

export function useResources(params?: ResourceListParams) {
  return useQuery({
    queryKey: resourceKeys.list(params),
    queryFn: () => getResources(params),
  });
}
