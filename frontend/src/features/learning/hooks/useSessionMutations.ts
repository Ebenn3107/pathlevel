import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSession,
  updateSession,
  deleteSession,
  linkResourceToSession,
  unlinkResourceFromSession,
  saveSessionSummary,
  deleteSessionSummary,
} from '../api/learning';
import { learningKeys } from '../query-keys';
import { resourceKeys } from '../../resources/query-keys';
import { showAchievementNotifications } from '../../achievements/components/AchievementNotification';
import type { CreateLearningInput, UpdateLearningInput } from '../types';

function invalidateLearning(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: learningKeys.all });
  queryClient.invalidateQueries({ queryKey: resourceKeys.all });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLearningInput) => createSession(input),
    onSuccess: () => invalidateLearning(queryClient),
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateLearningInput }) => updateSession(id, input),
    onSuccess: (result) => {
      invalidateLearning(queryClient);
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
    onSuccess: () => invalidateLearning(queryClient),
  });
}

export function useLinkResourceToSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, resourceId }: { sessionId: string; resourceId: string }) =>
      linkResourceToSession(sessionId, resourceId),
    onSuccess: () => invalidateLearning(queryClient),
  });
}

export function useUnlinkResourceFromSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, resourceId }: { sessionId: string; resourceId: string }) =>
      unlinkResourceFromSession(sessionId, resourceId),
    onSuccess: () => invalidateLearning(queryClient),
  });
}

export function useSaveSessionSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, content }: { sessionId: string; content: string }) =>
      saveSessionSummary(sessionId, content),
    onSuccess: () => invalidateLearning(queryClient),
  });
}

export function useDeleteSessionSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => deleteSessionSummary(sessionId),
    onSuccess: () => invalidateLearning(queryClient),
  });
}
