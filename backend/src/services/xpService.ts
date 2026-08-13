import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";

const XP_PER_LEVEL = 100;

export const XP_VALUES = {
  habit_completed: 10,
  task_completed: 20,
  session_completed: 30,
} as const;

export interface XpSummary {
  totalXp: number;
  level: number;
  nextLevelXp: number;
  recentTransactions: {
    id: string;
    amount: number;
    reason: string;
    createdAt: Date;
  }[];
}

/** Calculate level from total XP. */
export function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

/** XP required to reach the given level. */
export function xpForLevel(level: number): number {
  return Math.max(0, (level - 1) * XP_PER_LEVEL);
}

/**
 * Record an XP transaction and update the user aggregate.
 *
 * When no `client` is provided this runs atomically in its own transaction.
 * When called from inside an existing transaction, pass that transaction
 * client so the XP award participates in the surrounding unit of work
 * (see task/session/habit completion).
 */
export async function recordXp(
  userId: string,
  amount: number,
  reason: string,
  reference?: string,
  client?: Prisma.TransactionClient,
) {
  const run = async (db: Prisma.TransactionClient) => {
    // Idempotency: skip if a transaction already exists for (reason, reference)
    if (reference) {
      const existing = await db.xpTransaction.findFirst({
        where: { userId, reason, reference },
      });
      if (existing) return existing;
    }

    const transaction = await db.xpTransaction.create({
      data: { userId, amount, reason, reference: reference ?? null },
    });

    // Recalculate total XP from all transactions
    const aggregate = await db.xpTransaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    const totalXp = aggregate._sum.amount ?? 0;
    const level = calculateLevel(totalXp);

    // Update user aggregate (best-effort — user may not exist yet)
    await db.user.update({
      where: { id: userId },
      data: { xp: totalXp, level },
    }).catch((err) => {
      console.warn(`[xp] User ${userId} not found — XP tracked via XpTransaction only:`, err.message);
    });

    return transaction;
  };

  if (client) {
    return run(client);
  }
  return prisma.$transaction(run);
}

/** Get XP summary for a user. */
export async function getXpSummary(userId: string): Promise<XpSummary> {
  const aggregate = await prisma.xpTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  const totalXp = aggregate._sum.amount ?? 0;
  const level = calculateLevel(totalXp);

  const recentTransactions = await prisma.xpTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, amount: true, reason: true, createdAt: true },
  });

  return {
    totalXp,
    level,
    nextLevelXp: xpForLevel(level + 1),
    recentTransactions,
  };
}
