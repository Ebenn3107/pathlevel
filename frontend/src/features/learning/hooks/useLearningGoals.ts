import { useQuery } from '@tanstack/react-query';
import { getGoals, getGoal } from '../api/learningGoals';
import { learningKeys } from '../query-keys';

export function useGoals() {
  return useQuery({
    queryKey: learningKeys.goals(),
    queryFn: getGoals,
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: learningKeys.goal(id),
    queryFn: () => getGoal(id),
    enabled: !!id,
  });
}
