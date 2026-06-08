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

  const [
    xpAgg,
    activeHabits,
    pendingTasks,
    completedTasks,
    todayAgg,
    recentTx,
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
  ]);

  const totalXp = xpAgg._sum.amount ?? 0;
  const level = calculateLevel(totalXp);
  const nextLevelXpVal = xpForLevel(level + 1);
  const currentLevelFloor = xpForLevel(level);

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
  };
}
