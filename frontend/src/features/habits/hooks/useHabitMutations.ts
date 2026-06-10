import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createHabit, updateHabit, deleteHabit, completeHabit } from '../api/habits';
import { habitKeys } from '../query-keys';
import { showAchievementNotifications } from '../../achievements/components/AchievementNotification';
import type { CreateHabitInput, UpdateHabitInput } from '../types';

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHabitInput) => createHabit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
    },
  });
}

export function useUpdateHabit(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateHabitInput) => updateHabit(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: habitKeys.detail(id) });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteHabit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
    },
  });
}

export function useCompleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => completeHabit(id),
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: habitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: habitKeys.detail(id) });

      if (result.newAchievements && result.newAchievements.length > 0) {
        showAchievementNotifications(result.newAchievements);
      }
    },
  });
}
