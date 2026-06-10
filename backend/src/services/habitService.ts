import { prisma } from "../config/database";
import { Prisma } from "@prisma/client";
import { NotFoundError } from "../types/error";
import { XP_VALUES } from "./xpService";

export interface HabitResponse {
  id: string;
  title: string;
  description: string | null;
  frequency: string;
  streak: number;
  bestStreak: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHabitInput {
  title: string;
  description?: string;
  frequency?: string;
}

export interface UpdateHabitInput {
  title?: string;
  description?: string;
  frequency?: string;
}

export interface CompleteHabitResult {
  habit: HabitResponse;
  isNew: boolean;
  completionId?: string;
}

/* ── Period Helpers ──────────────────────────────── */

/** Get the period start date key for a given date and frequency. */
export function getPeriodKey(date: Date, frequency: string): string {
  switch (frequency) {
    case "daily":
      return date.toISOString().slice(0, 10);

    case "weekly": {
      // Monday of the ISO week
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      return d.toISOString().slice(0, 10);
    }

    case "monthly":
      return date.toISOString().slice(0, 7) + "-01";

    default:
      return date.toISOString().slice(0, 10);
  }
}

/** Calculate streak and best streak from period keys (sorted descending). */
export function calculateStreakFromKeys(
  periodKeys: string[],
  frequency: string,
  currentBest: number,
): { streak: number; bestStreak: number } {
  if (periodKeys.length === 0) return { streak: 0, bestStreak: currentBest };

  // Current consecutive streak (from most recent backward)
  let streak = 1;
  for (let i = 1; i < periodKeys.length; i++) {
    if (isConsecutivePeriod(periodKeys[i - 1], periodKeys[i], frequency)) {
      streak++;
    } else {
      break;
    }
  }

  // Best streak across all history
  let bestStreak = Math.max(1, currentBest);
  let run = 1;
  for (let i = 1; i < periodKeys.length; i++) {
    if (isConsecutivePeriod(periodKeys[i - 1], periodKeys[i], frequency)) {
      run++;
      bestStreak = Math.max(bestStreak, run);
    } else {
      run = 1;
    }
  }

  return { streak, bestStreak: Math.max(bestStreak, streak) };
}

function isConsecutivePeriod(current: string, previous: string, frequency: string): boolean {
  const a = new Date(current).getTime();
  const b = new Date(previous).getTime();

  switch (frequency) {
    case "daily":
      return a - b === 86_400_000;
    case "weekly":
      return a - b === 604_800_000;
    case "monthly": {
      const d1 = new Date(current);
      const d2 = new Date(previous);
      return (
        d1.getFullYear() * 12 + d1.getMonth() ===
        d2.getFullYear() * 12 + d2.getMonth() + 1
      );
    }
    default:
      return false;
  }
}

/* ── XP Helpers ──────────────────────────────────── */

async function awardHabitXp(
  tx: Omit<typeof prisma, "$transaction" | "$connect" | "$disconnect" | "$on" | "$use" | "$extends">,
  userId: string,
  completionId: string,
) {
  const transaction = await tx.xpTransaction.create({
    data: {
      userId,
      amount: XP_VALUES.habit_completed,
      reason: "habit_completed",
      reference: completionId,
    },
  });

  const aggregate = await tx.xpTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  const totalXp = aggregate._sum.amount ?? 0;
  const level = Math.floor(totalXp / 100) + 1;

  await tx.user.update({
    where: { id: userId },
    data: { xp: totalXp, level },
  }).catch((err: Error) => {
    console.warn(`[xp] User ${userId} not found — XP tracked via XpTransaction only:`, err.message);
  });

  return transaction;
}

/* ── CRUD ────────────────────────────────────────── */

/** Get all habits for a user. */
export async function getHabits(userId: string): Promise<HabitResponse[]> {
  return prisma.habit.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/** Create a new habit for a user. */
export async function createHabit(
  userId: string,
  input: CreateHabitInput,
): Promise<HabitResponse> {
  return prisma.habit.create({
    data: {
      userId,
      title: input.title,
      description: input.description ?? null,
      frequency: input.frequency ?? "daily",
    },
  });
}

/** Update a habit for a user. */
export async function updateHabit(
  id: string,
  userId: string,
  input: UpdateHabitInput,
): Promise<HabitResponse> {
  try {
    return await prisma.habit.update({
      where: { id, userId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.frequency !== undefined && { frequency: input.frequency }),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw new NotFoundError("Habit");
    }
    throw err;
  }
}

/**
 * Complete a habit for the current period.
 *
 * Creates a HabitCompletion record and awards XP in a single atomic transaction.
 * Duplicate completions are rejected by the database unique constraint
 * and return the current habit state with isNew=false.
 */
export async function completeHabit(
  id: string,
  userId: string,
): Promise<CompleteHabitResult> {
  return prisma.$transaction(async (tx) => {
    const habit = await tx.habit.findUnique({ where: { id, userId } });
    if (!habit) throw new NotFoundError("Habit");

    const now = new Date();
    const periodKey = getPeriodKey(now, habit.frequency);

    // Create the completion — P2002 if duplicate (violates @@unique([habitId, userId, periodKey]))
    const completion = await tx.habitCompletion.create({
      data: { userId, habitId: id, completedAt: now, periodKey },
    }).catch((err: unknown) => {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return null;
      }
      throw err;
    });

    if (!completion) {
      // Duplicate — return current state, no XP awarded
      return { habit: habit as HabitResponse, isNew: false };
    }

    // Recalculate streak from all completions
    const allCompletions = await tx.habitCompletion.findMany({
      where: { habitId: id },
      orderBy: { periodKey: "desc" },
      select: { periodKey: true },
    });

    const periodKeys = allCompletions.map((c) => c.periodKey);
    const { streak, bestStreak } = calculateStreakFromKeys(
      periodKeys,
      habit.frequency,
      habit.bestStreak,
    );

    const updated = await tx.habit.update({
      where: { id, userId },
      data: { streak, bestStreak },
    });

    // Award XP atomically within the same transaction
    await awardHabitXp(tx, userId, completion.id);

    return { habit: updated, isNew: true, completionId: completion.id };
  });
}

/** Delete a habit for a user. */
export async function deleteHabit(
  id: string,
  userId: string,
): Promise<void> {
  try {
    await prisma.habit.delete({
      where: { id, userId },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw new NotFoundError("Habit");
    }
    throw err;
  }
}
