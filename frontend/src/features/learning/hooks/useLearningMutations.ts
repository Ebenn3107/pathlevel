import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createGoal,
  updateGoal,
  deleteGoal,
  archiveGoal,
  restoreGoal,
  createUnit,
  linkResourceToGoal,
  unlinkResourceFromGoal,
} from '../api/learningGoals';
import {
  updateUnit,
  deleteUnit,
  linkResourceToUnit,
  unlinkResourceFromUnit,
} from '../api/learningUnits';
import { learningKeys } from '../query-keys';
import { resourceKeys } from '../../resources/query-keys';
import type { CreateGoalInput, UpdateGoalInput, CreateUnitInput, UpdateUnitInput } from '../types';

/** Invalidate all Learning + Resource queries (links affect both domains). */
function invalidateLearning(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: learningKeys.all });
  queryClient.invalidateQueries({ queryKey: resourceKeys.all });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGoalInput) => createGoal(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: learningKeys.goals() }),
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGoalInput }) => updateGoal(id, input),
    onSuccess: () => invalidateLearning(queryClient),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: () => invalidateLearning(queryClient),
  });
}

export function useArchiveGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveGoal(id),
    onSuccess: () => invalidateLearning(queryClient),
  });
}

export function useRestoreGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreGoal(id),
    onSuccess: () => invalidateLearning(queryClient),
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, input }: { goalId: string; input: CreateUnitInput }) =>
      createUnit(goalId, input),
    onSuccess: () => invalidateLearning(queryClient),
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUnitInput }) => updateUnit(id, input),
    onSuccess: () => invalidateLearning(queryClient),
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUnit(id),
    onSuccess: () => invalidateLearning(queryClient),
  });
}

export function useLinkResourceToGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, resourceId }: { goalId: string; resourceId: string }) =>
      linkResourceToGoal(goalId, resourceId),
    onSuccess: () => invalidateLearning(queryClient),
  });
}

export function useUnlinkResourceFromGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, resourceId }: { goalId: string; resourceId: string }) =>
      unlinkResourceFromGoal(goalId, resourceId),
    onSuccess: () => invalidateLearning(queryClient),
  });
}

export function useLinkResourceToUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, resourceId }: { unitId: string; resourceId: string }) =>
      linkResourceToUnit(unitId, resourceId),
    onSuccess: () => invalidateLearning(queryClient),
  });
}

export function useUnlinkResourceFromUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, resourceId }: { unitId: string; resourceId: string }) =>
      unlinkResourceFromUnit(unitId, resourceId),
    onSuccess: () => invalidateLearning(queryClient),
  });
}
