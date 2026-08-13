export const learningKeys = {
  all: ['learning'] as const,
  // Session log keys
  lists: () => [...learningKeys.all, 'list'] as const,
  list: (filters?: object) => [...learningKeys.lists(), filters ?? {}] as const,
  details: () => [...learningKeys.all, 'detail'] as const,
  detail: (id: string) => [...learningKeys.details(), id] as const,
  // Goals / Units
  goals: () => [...learningKeys.all, 'goals'] as const,
  goal: (id: string) => [...learningKeys.goals(), id] as const,
  unit: (id: string) => [...learningKeys.all, 'unit', id] as const,
  // Unit sessions
  unitSessions: (unitId: string) => [...learningKeys.all, 'unit', unitId, 'sessions'] as const,
  // Session resources / summary
  sessionResources: (sessionId: string) => [...learningKeys.all, 'session', sessionId, 'resources'] as const,
  sessionSummary: (sessionId: string) => [...learningKeys.all, 'session', sessionId, 'summary'] as const,
};
