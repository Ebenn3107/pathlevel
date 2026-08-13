import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createResource,
  updateResource,
  deleteResource,
  archiveResource,
  restoreResource,
} from '../api/resources';
import { resourceKeys } from '../query-keys';
import type { CreateResourceInput, UpdateResourceInput } from '../types';

/** Invalidate all resource list queries (they share the same key prefix). */
function invalidateAllResources(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: resourceKeys.all });
}

export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateResourceInput) => createResource(input),
    onSuccess: () => {
      invalidateAllResources(queryClient);
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateResourceInput }) => updateResource(id, input),
    onSuccess: () => {
      invalidateAllResources(queryClient);
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteResource(id),
    onSuccess: () => {
      invalidateAllResources(queryClient);
    },
  });
}

/** Move an Inbox resource to SAVED (progress is preserved). */
export function useSaveResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => updateResource(id, { libraryStatus: 'SAVED' }),
    onSuccess: () => {
      invalidateAllResources(queryClient);
    },
  });
}

export function useArchiveResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveResource(id),
    onSuccess: () => {
      invalidateAllResources(queryClient);
    },
  });
}

export function useRestoreResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreResource(id),
    onSuccess: () => {
      invalidateAllResources(queryClient);
    },
  });
}
