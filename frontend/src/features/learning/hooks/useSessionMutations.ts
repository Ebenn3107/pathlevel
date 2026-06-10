import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSession, updateSession, deleteSession } from '../api/learning';
import { learningKeys } from '../query-keys';
import { showAchievementNotifications } from '../../achievements/components/AchievementNotification';
import type { CreateLearningInput, UpdateLearningInput } from '../types';

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLearningInput) => createSession(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningKeys.lists() });
    },
  });
}

export function useUpdateSession(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateLearningInput) => updateSession(id, input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: learningKeys.lists() });
      queryClient.invalidateQueries({ queryKey: learningKeys.detail(id) });

      if (result.newAchievements && result.newAchievements.length > 0) {
        showAchievementNotifications(result.newAchievements);
      }
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningKeys.lists() });
    },
  });
}
