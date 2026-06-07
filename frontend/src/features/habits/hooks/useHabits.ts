import { useQuery } from '@tanstack/react-query';
import { getHabits, getHabit } from '../api/habits';
import { habitKeys } from '../query-keys';

export function useHabits() {
  return useQuery({
    queryKey: habitKeys.lists(),
    queryFn: getHabits,
  });
}

export function useHabit(id: string) {
  return useQuery({
    queryKey: habitKeys.detail(id),
    queryFn: () => getHabit(id),
    enabled: !!id,
  });
}
