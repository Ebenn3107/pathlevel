import { prisma } from "../config/database";
import { Prisma } from "@prisma/client";

/* ── Achievement Definitions ─────────────────────── */

export interface AchievementDef {
  code: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  /* ── XP ────────────────────────────────────── */
  { code: "XP_100", title: "Getting Started", description: "Earn 100 total XP", icon: "⚡" },
  { code: "XP_500", title: "Half Way There", description: "Earn 500 total XP", icon: "🔥" },
  { code: "XP_1000", title: "XP Champion", description: "Earn 1,000 total XP", icon: "💎" },

  /* ── Habits ────────────────────────────────── */
  { code: "FIRST_HABIT", title: "First Step", description: "Complete your first habit", icon: "🌱" },
  { code: "HABIT_10", title: "Getting Consistent", description: "Complete 10 habits", icon: "🌿" },
  { code: "HABIT_50", title: "Habit Machine", description: "Complete 50 habits", icon: "🌳" },

  /* ── Streaks ───────────────────────────────── */
  { code: "STREAK_7", title: "Week Warrior", description: "Reach a 7-day streak on any habit", icon: "📅" },
  { code: "STREAK_30", title: "Monthly Master", description: "Reach a 30-day streak on any habit", icon: "🏆" },

  /* ── Tasks ─────────────────────────────────── */
  { code: "FIRST_TASK", title: "Task Initiated", description: "Complete your first task", icon: "✅" },
  { code: "TASK_25", title: "Task Crusher", description: "Complete 25 tasks", icon: "📋" },

  /* ── Learning ──────────────────────────────── */
  { code: "FIRST_SESSION", title: "Curious Mind", description: "Complete your first learning session", icon: "📚" },
  { code: "SESSION_10", title: "Dedicated Learner", description: "Complete 10 learning sessions", icon: "🎓" },
];

/* ── Public API ──────────────────────────────────── */

/**
 * Get all achievement definitions.
 *
 * The database is the runtime source of truth for achievement APIs. The
 * code-level definitions are synchronized into the database at startup
 * (syncAchievementDefinitions), so reading here reflects the runtime state.
 */
export async function getAllAchievements(): Promise<AchievementDef[]> {
  const dbAchievements = await prisma.achievement.findMany({
    orderBy: { createdAt: "asc" },
    select: { code: true, title: true, description: true, icon: true },
  });
  return dbAchievements;
}

/** Get all achievements for a user, with unlock status. */
export async function getUserAchievements(userId: string) {
  const dbAchievements = await prisma.achievement.findMany({
    include: {
      userAchievements: {
        where: { userId },
        select: { unlockedAt: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return dbAchievements.map((a) => ({
    id: a.id,
    code: a.code,
    title: a.title,
    description: a.description,
    icon: a.icon,
    unlocked: a.userAchievements.length > 0,
    unlockedAt: a.userAchievements[0]?.unlockedAt ?? null,
  }));
}

/**
 * Evaluate all achievement conditions for a user and unlock any new ones.
 * Returns the list of newly unlocked achievements.
 *
 * This is the central evaluation function — call it after any source-of-truth
 * event (XP earned, habit completed, task completed, learning session created).
 */
export async function evaluateAchievements(
  userId: string,
  client?: Prisma.TransactionClient,
): Promise<{ code: string; title: string; icon: string }[]> {
  const newlyUnlocked: { code: string; title: string; icon: string }[] = [];

  // Use the supplied transaction client so unlocks persist atomically with
  // the triggering domain event; otherwise fall back to the shared client.
  const db = client ?? prisma;

  // Gather all data needed for evaluation in parallel
  const [xpAgg, userAchievements, habitCompletions, habits, completedTasks, completedSessions] =
    await Promise.all([
      db.xpTransaction.aggregate({
        where: { userId },
        _sum: { amount: true },
      }),
      db.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      }),
      db.habitCompletion.count({ where: { userId } }),
      db.habit.findMany({ where: { userId }, select: { streak: true } }),
      db.task.count({ where: { userId, completed: true } }),
      db.learningSession.count({ where: { userId, endedAt: { not: null } } }),
    ]);

  const totalXp = xpAgg._sum.amount ?? 0;
  const unlockedCodes = new Set(userAchievements.map((ua) => ua.achievement.code));

  // Determine which achievements should now be unlocked
  const codesToUnlock: string[] = [];

  /* ── XP Achievements ─────────────────────── */
  if (totalXp >= 100 && !unlockedCodes.has("XP_100")) codesToUnlock.push("XP_100");
  if (totalXp >= 500 && !unlockedCodes.has("XP_500")) codesToUnlock.push("XP_500");
  if (totalXp >= 1000 && !unlockedCodes.has("XP_1000")) codesToUnlock.push("XP_1000");

  /* ── Habit Achievements ──────────────────── */
  if (habitCompletions >= 1 && !unlockedCodes.has("FIRST_HABIT")) codesToUnlock.push("FIRST_HABIT");
  if (habitCompletions >= 10 && !unlockedCodes.has("HABIT_10")) codesToUnlock.push("HABIT_10");
  if (habitCompletions >= 50 && !unlockedCodes.has("HABIT_50")) codesToUnlock.push("HABIT_50");

  /* ── Streak Achievements ─────────────────── */
  const anyStreak7 = habits.some((h) => h.streak >= 7);
  const anyStreak30 = habits.some((h) => h.streak >= 30);
  if (anyStreak7 && !unlockedCodes.has("STREAK_7")) codesToUnlock.push("STREAK_7");
  if (anyStreak30 && !unlockedCodes.has("STREAK_30")) codesToUnlock.push("STREAK_30");

  /* ── Task Achievements ───────────────────── */
  if (completedTasks >= 1 && !unlockedCodes.has("FIRST_TASK")) codesToUnlock.push("FIRST_TASK");
  if (completedTasks >= 25 && !unlockedCodes.has("TASK_25")) codesToUnlock.push("TASK_25");

  /* ── Learning Achievements ───────────────── */
  if (completedSessions >= 1 && !unlockedCodes.has("FIRST_SESSION")) codesToUnlock.push("FIRST_SESSION");
  if (completedSessions >= 10 && !unlockedCodes.has("SESSION_10")) codesToUnlock.push("SESSION_10");

  // Unlock each one (idempotent — database unique constraint prevents duplicates)
  for (const code of codesToUnlock) {
    const unlocked = await unlockAchievement(userId, code, client);
    if (unlocked) {
      newlyUnlocked.push(unlocked);
    }
  }

  return newlyUnlocked;
}

/**
 * Unlock a single achievement for a user. Idempotent — returns the
 * achievement data if newly unlocked, or null if already unlocked.
 */
export async function unlockAchievement(
  userId: string,
  code: string,
  client?: Prisma.TransactionClient,
): Promise<{ code: string; title: string; icon: string } | null> {
  const db = client ?? prisma;

  const achievement = await db.achievement.findUnique({ where: { code } });
  if (!achievement) {
    console.warn(`[achievement] Unknown achievement code: ${code}`);
    return null;
  }

  try {
    await db.userAchievement.create({
      data: { userId, achievementId: achievement.id },
    });
    return { code: achievement.code, title: achievement.title, icon: achievement.icon };
  } catch (err) {
    // P2002 = unique constraint violation → already unlocked
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return null;
    }
    throw err;
  }
}

/**
 * Ensure all achievement definitions exist in the database.
 * Call during seed or startup to sync definitions.
 */
export async function syncAchievementDefinitions(): Promise<void> {
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    await prisma.achievement.upsert({
      where: { code: def.code },
      update: { title: def.title, description: def.description, icon: def.icon },
      create: { code: def.code, title: def.title, description: def.description, icon: def.icon },
    });
  }
}
