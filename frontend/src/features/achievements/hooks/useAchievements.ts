import { useQuery } from '@tanstack/react-query';
import { getAllAchievements, getMyAchievements } from '../api/achievements';
import { achievementKeys } from '../query-keys';

export function useAllAchievements() {
  return useQuery({
    queryKey: achievementKeys.list(),
    queryFn: getAllAchievements,
  });
}

export function useMyAchievements() {
  return useQuery({
    queryKey: achievementKeys.mine(),
    queryFn: getMyAchievements,
  });
}
