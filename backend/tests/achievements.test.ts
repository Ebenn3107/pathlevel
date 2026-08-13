/**
 * Achievement evaluation tests.
 *
 * These tests execute against the REAL production service
 * (achievementService.evaluateAchievements) with a stubbed Prisma
 * data layer, so no database is required.
 *
 * Run with: npm run test:achievements
 * (ts-node --files tests/achievements.test.ts)
 */
import assert from "node:assert";

import { prisma } from "../src/config/database";
import {
  ACHIEVEMENT_DEFINITIONS,
  evaluateAchievements,
} from "../src/services/achievementService";

/* ── Test data layer ──────────────────────────────────────────── */

interface MockOverrides {
  xpAgg?: { _sum: { amount: number } };
  unlocked?: Array<{ achievement: { code: string }; unlockedAt: Date }>;
  habitCompletions?: number;
  habitStreaks?: number[];
  completedTasks?: number;
  completedSessions?: number;
}

/**
 * Stub the shared Prisma singleton so the real achievement service can be
 * exercised without a database. Every delegate the service reads is replaced;
 * per-test data is supplied via overrides.
 */
function setupMock(overrides: MockOverrides = {}) {
  const {
    xpAgg = { _sum: { amount: 0 } },
    unlocked = [],
    habitCompletions = 0,
    habitStreaks = [],
    completedTasks = 0,
    completedSessions = 0,
  } = overrides;

  const prismaAny = prisma as unknown as Record<string, unknown>;

  prismaAny.xpTransaction = {
    aggregate: async () => xpAgg,
  };
  prismaAny.userAchievement = {
    findMany: async () => unlocked,
    // unlockAchievement() records the unlock; duplicate prevention is handled
    // upstream by the already-unlocked set, so creation always succeeds here.
    create: async () => ({ id: "ua-1" }),
  };
  prismaAny.habitCompletion = {
    count: async () => habitCompletions,
  };
  prismaAny.habit = {
    findMany: async () => habitStreaks.map((streak) => ({ streak })),
  };
  prismaAny.task = {
    count: async () => completedTasks,
  };
  prismaAny.learningSession = {
    count: async () => completedSessions,
  };
  prismaAny.achievement = {
    // unlockAchievement() resolves the achievement definition by code.
    findUnique: async ({ where }: { where: { code: string } }) => {
      const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.code === where.code);
      return def ? { id: `achievement-${def.code}`, ...def } : null;
    },
  };
}

/** Run the real service and reduce its result to a list of unlocked codes. */
async function unlockedCodes(userId = "user-1"): Promise<string[]> {
  const result = await evaluateAchievements(userId);
  return result.map((a) => a.code);
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

  console.log("\n📋 Achievement Service Tests\n");

  // 1. No activity → nothing
  await test("No achievements unlocked with zero activity", async () => {
    setupMock();
    assert.deepStrictEqual(await unlockedCodes(), [], "Expected no achievements");
  });

  // 2. First task → FIRST_TASK
  await test("Completing first task unlocks FIRST_TASK", async () => {
    setupMock({ xpAgg: { _sum: { amount: 20 } }, completedTasks: 1 });
    const result = await unlockedCodes();
    assert.ok(result.includes("FIRST_TASK"), "Expected FIRST_TASK to unlock");
  });

  // 3. FIRST_TASK only once (duplicate prevention)
  await test("FIRST_TASK is not unlocked again if already unlocked", async () => {
    setupMock({
      xpAgg: { _sum: { amount: 20 } },
      completedTasks: 1,
      unlocked: [{ achievement: { code: "FIRST_TASK" }, unlockedAt: new Date() }],
    });
    const result = await unlockedCodes();
    assert.ok(!result.includes("FIRST_TASK"), "Expected FIRST_TASK to NOT be in unlock list");
  });

  // 4. First habit → FIRST_HABIT
  await test("Completing first habit unlocks FIRST_HABIT", async () => {
    setupMock({ xpAgg: { _sum: { amount: 10 } }, habitCompletions: 1 });
    const result = await unlockedCodes();
    assert.ok(result.includes("FIRST_HABIT"), "Expected FIRST_HABIT to unlock");
  });

  // 5. First learning session → FIRST_SESSION
  await test("Completing first learning session unlocks FIRST_SESSION", async () => {
    setupMock({ xpAgg: { _sum: { amount: 30 } }, completedSessions: 1 });
    const result = await unlockedCodes();
    assert.ok(result.includes("FIRST_SESSION"), "Expected FIRST_SESSION to unlock");
  });

  // 6. XP thresholds
  await test("Earning 100 XP unlocks XP_100", async () => {
    setupMock({ xpAgg: { _sum: { amount: 100 } } });
    const result = await unlockedCodes();
    assert.ok(result.includes("XP_100"), "Expected XP_100 to unlock");
  });

  await test("Earning 500 XP unlocks XP_100 and XP_500", async () => {
    setupMock({ xpAgg: { _sum: { amount: 500 } } });
    const result = await unlockedCodes();
    assert.ok(result.includes("XP_100"), "Expected XP_100 to unlock");
    assert.ok(result.includes("XP_500"), "Expected XP_500 to unlock");
  });

  // 7. Streak thresholds
  await test("Habit with 7-day streak unlocks STREAK_7", async () => {
    setupMock({ habitStreaks: [7] });
    const result = await unlockedCodes();
    assert.ok(result.includes("STREAK_7"), "Expected STREAK_7 to unlock");
  });

  await test("Habit with 30-day streak unlocks STREAK_7 and STREAK_30", async () => {
    setupMock({ habitStreaks: [30] });
    const result = await unlockedCodes();
    assert.ok(result.includes("STREAK_7"), "Expected STREAK_7 to unlock");
    assert.ok(result.includes("STREAK_30"), "Expected STREAK_30 to unlock");
  });

  // 8. Multiple achievements together
  await test("First task + XP_100 unlock together", async () => {
    setupMock({ xpAgg: { _sum: { amount: 100 } }, completedTasks: 1 });
    const result = await unlockedCodes();
    assert.ok(result.includes("FIRST_TASK"), "Expected FIRST_TASK");
    assert.ok(result.includes("XP_100"), "Expected XP_100");
  });

  // 9. All three first-actions at once
  await test("All first-actions unlock together with sufficient XP", async () => {
    setupMock({
      xpAgg: { _sum: { amount: 100 } },
      habitCompletions: 1,
      completedTasks: 1,
      completedSessions: 1,
    });
    const result = await unlockedCodes();
    assert.ok(result.includes("FIRST_HABIT"), "Expected FIRST_HABIT");
    assert.ok(result.includes("FIRST_TASK"), "Expected FIRST_TASK");
    assert.ok(result.includes("FIRST_SESSION"), "Expected FIRST_SESSION");
    assert.ok(result.includes("XP_100"), "Expected XP_100");
  });

  // 10. Duplicate prevention — already unlocked all
  await test("No achievements unlock when all are already earned", async () => {
    const alreadyUnlocked = [
      "XP_100", "XP_500", "XP_1000",
      "FIRST_HABIT", "HABIT_10", "HABIT_50",
      "STREAK_7", "STREAK_30",
      "FIRST_TASK", "TASK_25",
      "FIRST_SESSION", "SESSION_10",
    ];
    setupMock({
      xpAgg: { _sum: { amount: 2000 } },
      habitCompletions: 100,
      completedTasks: 100,
      completedSessions: 100,
      habitStreaks: [60],
      unlocked: alreadyUnlocked.map((code) => ({
        achievement: { code },
        unlockedAt: new Date(),
      })),
    });
    const result = await unlockedCodes();
    assert.deepStrictEqual(result, [], "Expected no new unlocks");
  });

  // ── Summary ──
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
