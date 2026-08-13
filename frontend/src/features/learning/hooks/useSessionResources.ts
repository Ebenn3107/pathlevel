import { useQuery } from '@tanstack/react-query';
import { getSessionResources } from '../api/learning';
import { learningKeys } from '../query-keys';

/** Fetch the Resources linked to a session (M:N). */
export function useSessionResources(sessionId: string) {
  return useQuery({
    queryKey: learningKeys.sessionResources(sessionId),
    queryFn: () => getSessionResources(sessionId),
    enabled: !!sessionId,
  });
}
