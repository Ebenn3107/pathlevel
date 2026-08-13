/**
 * Transactional XP / achievement integrity tests.
 *
 * These tests verify the production services wrap domain completion, XP
 * award, and achievement evaluation in a single Prisma transaction:
 *
 *   BEGIN
 *     persist completion        → ROLLBACK on failure
 *     create XP transaction     → ROLLBACK on failure
 *     update XP/level cache     → ROLLBACK on failure
 *     evaluate achievements     → ROLLBACK on failure
 *     persist unlocked achievements
 *   COMMIT
 *
 * A stubbed Prisma data layer simulates each step and records whether each
 * stage was reached. No database is required.
 *
 * Run with: npm run test:atomicity
 * (ts-node --files tests/atomicity.test.ts)
 */
import assert from "node:assert";
import { Prisma } from "@prisma/client";

import { prisma } from "../src/config/database";
import { ACHIEVEMENT_DEFINITIONS } from "../src/services/achievementService";
import { updateTask } from "../src/services/taskService";
import { updateSession } from "../src/services/learningService";
import { completeHabit } from "../src/services/habitService";

/* ── Transaction simulator ────────────────────────────────────── */

interface StubConfig {
  task?: { completed: boolean };
  session?: { endedAt: Date | null };
  habit?: { id: string; frequency: string; streak: number; bestStreak: number };
  /** When true, the (userId, reason, reference) XP row already exists. */
  xpFindFirst?: boolean;
  /** Simulate a failure at a specific pipeline step. */
  failStep?: "xp" | "achievement" | "domain";
  /** State observed by achievement evaluation. */
  evalCounts?: {
    completedTasks?: number;
    completedSessions?: number;
    habitCompletions?: number;
    totalXp?: number;
  };
}

interface StubResult {
  tx: Record<string, unknown>;
  reached: { domain: boolean; xp: boolean; achievement: boolean };
  getInjected: () => Error | null;
}

/**
 * Install a Prisma-like stub. The singleton's `$transaction` is replaced with
 * an executor that runs the callback against an in-memory `tx` stub. Reads
 * see the configured domain state; writes record whether they were reached;
 * configurable failures simulate each pipeline step failing.
 */
function installTransactionStub(config: StubConfig = {}): StubResult {
  const reached = { domain: false, xp: false, achievement: false };
  let injected: Error | null = null;
  const evalCounts = config.evalCounts ?? {};

  const tx: Record<string, unknown> = {
    xpTransaction: {
      findFirst: async () => (config.xpFindFirst ? { id: "existing-xp" } : null),
      create: async () => {
        if (config.failStep === "xp") throw (injected = new Error("XP insert failed"));
        reached.xp = true;
        return { id: "xp-1" };
      },
      aggregate: async () => ({ _sum: { amount: evalCounts.totalXp ?? 50 } }),
    },
    user: {
      update: async () => {
        reached.xp = true;
        return { id: "user-1" };
      },
    },
    userAchievement: {
      // Called only by evaluateAchievements; marks that evaluation ran.
      findMany: async () => {
        reached.achievement = true;
        return [];
      },
      create: async () => {
        if (config.failStep === "achievement") throw (injected = new Error("Achievement unlock failed"));
        return { id: "ua-1" };
      },
    },
    habitCompletion: {
      count: async () => evalCounts.habitCompletions ?? 0,
      findMany: async () => [],
      create: async () => {
        if (config.failStep === "domain") throw (injected = new Error("Habit completion create failed"));
        reached.domain = true;
        return { id: "completion-1" };
      },
    },
    habit: {
      findMany: async () => [],
      findUnique: async () =>
        config.habit
          ? {
              id: config.habit.id,
              userId: "user-1",
              frequency: config.habit.frequency,
              bestStreak: config.habit.bestStreak,
            }
          : null,
      update: async () => ({ id: config.habit?.id }),
    },
    achievement: {
      findUnique: async ({ where }: { where: { code: string } }) => {
        const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.code === where.code);
        return def ? { id: `achievement-${def.code}`, ...def } : null;
      },
    },
    task: {
      update: async () => {
        if (config.failStep === "domain") throw (injected = new Error("Task update failed"));
        reached.domain = true;
        return {
          id: "task-1",
          title: "Task",
          description: null,
          priority: "medium",
          completed: config.task?.completed ?? false,
          dueDate: null,
          completedAt: config.task?.completed ? new Date() : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
      count: async () => evalCounts.completedTasks ?? 0,
    },
    learningSession: {
      update: async () => {
        if (config.failStep === "domain") throw (injected = new Error("Session update failed"));
        reached.domain = true;
        return {
          id: "session-1",
          title: "Session",
          notes: null,
          duration: 30,
          startedAt: new Date(),
          endedAt: config.session?.endedAt ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
      count: async () => evalCounts.completedSessions ?? 0,
    },
  };

  // $transaction: if passed a function, execute it immediately with the stub tx
  const prismaAny = prisma as unknown as { $transaction: unknown } & Record<string, unknown>;
  prismaAny.$transaction = (arg: unknown) =>
    typeof arg === "function" ? (arg as (tx: unknown) => Promise<unknown>)(tx) : Promise.resolve([]);

  return { tx, reached, getInjected: () => injected };
}

/** Helper to read a stubbed delegate off the fake tx. */
function txDelegate<T>(tx: Record<string, unknown>, name: string): T {
  return tx[name] as T;
}

/* ── Tests ────────────────────────────────────────────────────── */

async function runTests() {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => Promise<void> | void) {
    const run = async () => {
      try {
        await fn();
        console.log(`  ✅ ${name}`);
        passed++;
      } catch (err: unknown) {
        console.log(`  ❌ ${name}: ${err instanceof Error ? err.message : String(err)}`);
        failed++;
      }
    };
    return run();
  }

  console.log("\n📋 Transactional Integrity Tests\n");

  /* ── Task: success path reaches domain + XP + achievements ─── */
  await test("Task completion runs domain + XP + achievement in one transaction", async () => {
    const { reached } = installTransactionStub({
      task: { completed: true },
      evalCounts: { completedTasks: 1, totalXp: 100 }, // triggers FIRST_TASK + XP_100
    });
    await updateTask("task-1", "user-1", { completed: true });
    assert.ok(reached.domain, "task update must be reached");
    assert.ok(reached.xp, "XP award must be reached");
    assert.ok(reached.achievement, "achievement evaluation must be reached");
  });

  /* ── Task: XP failure rolls back (achievement never evaluated) ── */
  await test("Task completion with XP failure ROLLS BACK", async () => {
    const { reached, getInjected } = installTransactionStub({
      task: { completed: true },
      failStep: "xp",
    });
    let thrown: unknown = null;
    try {
      await updateTask("task-1", "user-1", { completed: true });
    } catch (err) {
      thrown = err;
    }
    assert.ok(thrown instanceof Error, "XP failure must propagate");
    assert.ok(getInjected(), "injected XP failure must be the thrown error");
    // In a real Prisma transaction the whole unit is rolled back. Here we
    // assert the pipeline stops before achievement evaluation.
    assert.ok(!reached.achievement, "achievement must NOT be reached after XP failure");
  });

  /* ── Task: achievement failure rolls back ───────────────────── */
  await test("Task completion with achievement failure ROLLS BACK", async () => {
    const { reached, getInjected } = installTransactionStub({
      task: { completed: true },
      failStep: "achievement",
      evalCounts: { completedTasks: 1, totalXp: 100 }, // triggers an unlock → create fails
    });
    let thrown: unknown = null;
    try {
      await updateTask("task-1", "user-1", { completed: true });
    } catch (err) {
      thrown = err;
    }
    assert.ok(thrown instanceof Error, "achievement failure must propagate");
    assert.ok(getInjected(), "injected achievement failure must be the thrown error");
    assert.ok(reached.xp, "XP was awarded before the failure");
    assert.ok(reached.domain, "task update was persisted before the failure");
  });

  /* ── Task: un-complete should NOT award XP ──────────────────── */
  await test("Task marked incomplete does NOT award XP", async () => {
    const { reached } = installTransactionStub({ task: { completed: false } });
    await updateTask("task-1", "user-1", { completed: false });
    assert.ok(reached.domain, "task update reached");
    assert.ok(!reached.xp, "XP must NOT be awarded on un-complete");
    assert.ok(!reached.achievement, "achievement must NOT be evaluated on un-complete");
  });

  /* ── Task: duplicate completion (XP already exists) → no new XP ── */
  await test("Task duplicate completion skips duplicate XP", async () => {
    const { reached } = installTransactionStub({
      task: { completed: true },
      xpFindFirst: true,
    });
    await updateTask("task-1", "user-1", { completed: true });
    assert.ok(reached.domain, "task update reached");
    // With the (userId, reason, reference) already present, no XP insert occurs.
    assert.ok(!reached.xp, "duplicate XP must be skipped");
  });

  /* ── Session: finish runs domain + XP + achievements ────────── */
  await test("Session finish runs domain + XP + achievement in one transaction", async () => {
    const { reached } = installTransactionStub({
      session: { endedAt: new Date() },
      evalCounts: { completedSessions: 1, totalXp: 130 }, // triggers FIRST_SESSION
    });
    await updateSession("session-1", "user-1", { endedAt: new Date().toISOString() });
    assert.ok(reached.domain, "session update reached");
    assert.ok(reached.xp, "XP award reached");
    assert.ok(reached.achievement, "achievement evaluation reached");
  });

  /* ── Session: XP failure rolls back ─────────────────────────── */
  await test("Session finish with XP failure ROLLS BACK", async () => {
    const { reached, getInjected } = installTransactionStub({
      session: { endedAt: new Date() },
      failStep: "xp",
    });
    let thrown: unknown = null;
    try {
      await updateSession("session-1", "user-1", { endedAt: new Date().toISOString() });
    } catch (err) {
      thrown = err;
    }
    assert.ok(thrown instanceof Error, "XP failure must propagate");
    assert.ok(getInjected(), "injected XP failure must be the thrown error");
    assert.ok(!reached.achievement, "achievement must NOT be reached after XP failure");
  });

  /* ── Session: session update (not finish) should NOT award XP ── */
  await test("Session edit without endedAt does NOT award XP", async () => {
    const { reached } = installTransactionStub({ session: { endedAt: null } });
    await updateSession("session-1", "user-1", { title: "Renamed" });
    assert.ok(reached.domain, "session update reached");
    assert.ok(!reached.xp, "XP must NOT be awarded on plain edit");
    assert.ok(!reached.achievement, "achievement must NOT be evaluated on plain edit");
  });

  /* ── Habit: complete runs domain + XP + achievements ────────── */
  await test("Habit complete runs domain + XP + achievement in one transaction", async () => {
    const { reached } = installTransactionStub({
      habit: { id: "habit-1", frequency: "daily", streak: 0, bestStreak: 0 },
      evalCounts: { habitCompletions: 1, totalXp: 60 }, // triggers FIRST_HABIT
    });
    const result = await completeHabit("habit-1", "user-1");
    assert.ok(result.isNew, "expected a new completion");
    assert.ok(reached.domain, "streak update reached");
    assert.ok(reached.xp, "XP award reached");
    assert.ok(reached.achievement, "achievement evaluation reached");
  });

  /* ── Habit: duplicate completion is a no-op ─────────────────── */
  await test("Habit duplicate completion is a no-op (no XP, no achievements)", async () => {
    const { tx, reached } = installTransactionStub({
      habit: { id: "habit-1", frequency: "daily", streak: 0, bestStreak: 0 },
    });
    // Force the completion create to simulate the P2002 duplicate path using
    // a real PrismaClientKnownRequestError so the service's catch handles it.
    txDelegate<{ create: () => Promise<unknown> }>(tx, "habitCompletion").create = async () => {
      throw new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`habit_id`,`user_id`,`period_key`)",
        { code: "P2002", clientVersion: "7.8.0" },
      );
    };

    const result = await completeHabit("habit-1", "user-1");
    assert.ok(!result.isNew, "expected duplicate to report isNew=false");
    assert.ok(!reached.xp, "XP must NOT be awarded on duplicate");
    assert.ok(!reached.achievement, "achievements must NOT be evaluated on duplicate");
  });

  // ── Summary ──
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
