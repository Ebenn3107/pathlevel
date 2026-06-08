export interface DashboardSummary {
  xp: number;
  level: number;
  activeHabits: number;
  pendingTasks: number;
  todayLearningMinutes: number;
}

/** Get the dashboard summary for a user. */
export async function getDashboard(userId: string): Promise<DashboardSummary> {
  // TODO: replace with Prisma queries once database is wired in
  return {
    xp: 120,
    level: 2,
    activeHabits: 3,
    pendingTasks: 5,
    todayLearningMinutes: 45,
  };
}
