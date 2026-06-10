export const achievementKeys = {
  all: ['achievements'] as const,
  list: () => [...achievementKeys.all, 'list'] as const,
  mine: () => [...achievementKeys.all, 'mine'] as const,
};
