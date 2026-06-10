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
  recentAchievements: {
    code: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: string;
  }[];
  weeklyXp: number;
  weeklyCompletedTasks: number;
  topStreak: number;
  topStreakHabits: {
    id: string;
    title: string;
    streak: number;
    frequency: string;
  }[];
  achievementProgress: {
    unlocked: number;
    total: number;
    percentage: number;
  };
}
