import { useQuery } from '@tanstack/react-query';
import { getUnit } from '../api/learningUnits';
import { learningKeys } from '../query-keys';

export function useUnit(id: string) {
  return useQuery({
    queryKey: learningKeys.unit(id),
    queryFn: () => getUnit(id),
    enabled: !!id,
  });
}
