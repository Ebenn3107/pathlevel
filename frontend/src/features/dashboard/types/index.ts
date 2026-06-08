export interface ActivityEntry {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface DashboardSummary {
  xp: number;
  level: number;
  nextLevelXp: number;
  xpRemaining: number;
  levelProgress: number;
  activeHabits: number;
  pendingTasks: number;
  todayLearningMinutes: number;
  completedTasks: number;
  recentActivity: ActivityEntry[];
}
