export const learningKeys = {
  all: ['learning'] as const,
  lists: () => [...learningKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...learningKeys.lists(), filters] as const,
  details: () => [...learningKeys.all, 'detail'] as const,
  detail: (id: string) => [...learningKeys.details(), id] as const,
};
