import { useQuery } from '@tanstack/react-query';
import { getSessionSummary } from '../api/learning';
import { learningKeys } from '../query-keys';

/** Fetch the optional LearningSummary for a session (0 or 1). */
export function useSessionSummary(sessionId: string) {
  return useQuery({
    queryKey: learningKeys.sessionSummary(sessionId),
    queryFn: () => getSessionSummary(sessionId),
    enabled: !!sessionId,
  });
}
