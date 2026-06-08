import { useQuery } from '@tanstack/react-query';
import { getSessions } from '../api/learning';
import { learningKeys } from '../query-keys';

export function useSessions() {
  return useQuery({
    queryKey: learningKeys.lists(),
    queryFn: getSessions,
  });
}
