import { useQuery } from '@tanstack/react-query';
import { getUnitSessions } from '../api/learning';
import { learningKeys } from '../query-keys';

export function useUnitSessions(unitId: string) {
  return useQuery({
    queryKey: learningKeys.unitSessions(unitId),
    queryFn: () => getUnitSessions(unitId),
    enabled: !!unitId,
  });
}
