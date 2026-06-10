import { prisma } from "../config/database";
import { calculateLevel, xpForLevel } from "./xpService";

const XP_PER_LEVEL = 100;

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
  recentActivity: {
    id: string;
    amount: number;
    reason: string;
    createdAt: Date;
  }[];
  recentAchievements: {
    code: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: Date;
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

const REASON_LABELS: Record<string, string> = {
  habit_completed: "Completed a habit",
  task_completed: "Completed a task",
  session_completed: "Finished a learning session",
};

/** Get the dashboard summary for a user. */
export async function getDashboard(userId: string): Promise<DashboardSummary> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Monday of the current week at 00:00:00
  const startOfWeek = new Date(todayStart);
  const dayOfWeek = startOfWeek.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as start
  startOfWeek.setDate(startOfWeek.getDate() + diff);

  const [
    xpAgg,
    activeHabits,
    pendingTasks,
    completedTasks,
    todayAgg,
    recentTx,
    recentAchievements,
    weeklyXpAgg,
    weeklyCompletedTasks,
    topHabits,
    totalAchievements,
    unlockedAchievements,
  ] = await Promise.all([
    prisma.xpTransaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    }),
    prisma.habit.count({ where: { userId } }),
    prisma.task.count({ where: { userId, completed: false } }),
    prisma.task.count({ where: { userId, completed: true } }),
    prisma.learningSession.aggregate({
      where: { userId, startedAt: { gte: todayStart } },
      _sum: { duration: true },
    }),
    prisma.xpTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, amount: true, reason: true, createdAt: true },
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: "desc" },
      take: 5,
      include: {
        achievement: { select: { code: true, title: true, description: true, icon: true } },
      },
    }),
    prisma.xpTransaction.aggregate({
      where: { userId, createdAt: { gte: startOfWeek } },
      _sum: { amount: true },
    }),
    prisma.task.count({
      where: { userId, completed: true, completedAt: { gte: startOfWeek } },
    }),
    prisma.habit.findMany({
      where: { userId },
      orderBy: { streak: "desc" },
      take: 3,
      select: { id: true, title: true, streak: true, frequency: true },
    }),
    prisma.achievement.count(),
    prisma.userAchievement.count({ where: { userId } }),
  ]);

  const totalXp = xpAgg._sum.amount ?? 0;
  const level = calculateLevel(totalXp);
  const nextLevelXpVal = xpForLevel(level + 1);
  const currentLevelFloor = xpForLevel(level);

  const totalAchievementsCount = totalAchievements;
  const unlockedCount = unlockedAchievements;

  return {
    xp: totalXp,
    level,
    nextLevelXp: nextLevelXpVal,
    xpRemaining: Math.max(0, nextLevelXpVal - totalXp),
    levelProgress: totalXp - currentLevelFloor,
    activeHabits,
    pendingTasks,
    todayLearningMinutes: todayAgg._sum.duration ?? 0,
    completedTasks,
    recentActivity: recentTx.map((t) => ({
      ...t,
      reason: REASON_LABELS[t.reason] || t.reason,
    })),
    recentAchievements: recentAchievements.map((ua) => ({
      code: ua.achievement.code,
      title: ua.achievement.title,
      description: ua.achievement.description,
      icon: ua.achievement.icon,
      unlockedAt: ua.unlockedAt,
    })),
    weeklyXp: weeklyXpAgg._sum.amount ?? 0,
    weeklyCompletedTasks,
    topStreak: topHabits[0]?.streak ?? 0,
    topStreakHabits: topHabits.map((h) => ({
      id: h.id,
      title: h.title,
      streak: h.streak,
      frequency: h.frequency,
    })),
    achievementProgress: {
      unlocked: unlockedCount,
      total: totalAchievementsCount,
      percentage: totalAchievementsCount > 0
        ? Math.round((unlockedCount / totalAchievementsCount) * 100)
        : 0,
    },
  };
}
