/**
 * Achievement validation tests.
 *
 * Mocks Prisma to test the evaluation logic independently.
 * Run with: node tests/achievements.test.js
 */
const assert = require("node:assert");

// ── Mock Prisma ────────────────────────────────────────────────

function createMockPrisma(overrides = {}) {
  const defaults = {
    xpTransaction: { aggregate: () => ({ _sum: { amount: 0 } }) },
    achievement: { findUnique: () => null, findMany: () => [], upsert: () => null },
    userAchievement: { findMany: () => [], create: () => null },
    habitCompletion: { count: () => 0 },
    habit: { findMany: () => [] },
    task: { count: () => 0 },
    learningSession: { count: () => 0 },
  };
  return { ...defaults, ...overrides };
}

// ── Inline the evaluation logic (mirrors evaluateAchievements) ──

async function evaluateAchievements(mockPrisma, userId) {
  const [xpAgg, userAchievements, habitCompletions, habits, completedTasks, completedSessions] =
    await Promise.all([
      mockPrisma.xpTransaction.aggregate({ where: { userId }, _sum: { amount: true } }),
      mockPrisma.userAchievement.findMany({ where: { userId }, include: { achievement: true } }),
      mockPrisma.habitCompletion.count({ where: { userId } }),
      mockPrisma.habit.findMany({ where: { userId }, select: { streak: true } }),
      mockPrisma.task.count({ where: { userId, completed: true } }),
      mockPrisma.learningSession.count({ where: { userId, endedAt: { not: null } } }),
    ]);

  const totalXp = xpAgg._sum.amount ?? 0;
  const unlockedCodes = new Set(userAchievements.map((ua) => ua.achievement.code));
  const codesToUnlock = [];

  // XP
  if (totalXp >= 100 && !unlockedCodes.has("XP_100")) codesToUnlock.push("XP_100");
  if (totalXp >= 500 && !unlockedCodes.has("XP_500")) codesToUnlock.push("XP_500");
  if (totalXp >= 1000 && !unlockedCodes.has("XP_1000")) codesToUnlock.push("XP_1000");

  // Habits
  if (habitCompletions >= 1 && !unlockedCodes.has("FIRST_HABIT")) codesToUnlock.push("FIRST_HABIT");
  if (habitCompletions >= 10 && !unlockedCodes.has("HABIT_10")) codesToUnlock.push("HABIT_10");
  if (habitCompletions >= 50 && !unlockedCodes.has("HABIT_50")) codesToUnlock.push("HABIT_50");

  // Streaks
  if (habits.some((h) => h.streak >= 7) && !unlockedCodes.has("STREAK_7")) codesToUnlock.push("STREAK_7");
  if (habits.some((h) => h.streak >= 30) && !unlockedCodes.has("STREAK_30")) codesToUnlock.push("STREAK_30");

  // Tasks
  if (completedTasks >= 1 && !unlockedCodes.has("FIRST_TASK")) codesToUnlock.push("FIRST_TASK");
  if (completedTasks >= 25 && !unlockedCodes.has("TASK_25")) codesToUnlock.push("TASK_25");

  // Learning
  if (completedSessions >= 1 && !unlockedCodes.has("FIRST_SESSION")) codesToUnlock.push("FIRST_SESSION");
  if (completedSessions >= 10 && !unlockedCodes.has("SESSION_10")) codesToUnlock.push("SESSION_10");

  return codesToUnlock;
}

// ── Tests ──────────────────────────────────────────────────────

async function runTests() {
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    const runCall = async () => {
      try {
        await fn();
        console.log(`  ✅ ${name}`);
        passed++;
      } catch (err) {
        console.log(`  ❌ ${name}: ${err.message}`);
        failed++;
      }
    };
    return runCall();
  }

  console.log("\n📋 Achievement Service Tests\n");

  // 1. No activity → nothing
  await test("No achievements unlocked with zero activity", async () => {
    const mock = createMockPrisma();
    const result = await evaluateAchievements(mock, "user-1");
    assert.deepStrictEqual(result, [], "Expected no achievements");
  });

  // 2. First task
  await test("Completing first task unlocks FIRST_TASK", async () => {
    const mock = createMockPrisma({
      xpTransaction: { aggregate: () => ({ _sum: { amount: 20 } }) },
      task: { count: () => 1 },
    });
    const result = await evaluateAchievements(mock, "user-1");
    assert.ok(result.includes("FIRST_TASK"), "Expected FIRST_TASK to unlock");
  });

  // 3. Duplicate prevention
  await test("FIRST_TASK is not unlocked again if already unlocked", async () => {
    const mock = createMockPrisma({
      xpTransaction: { aggregate: () => ({ _sum: { amount: 20 } }) },
      task: { count: () => 1 },
      userAchievement: {
        findMany: () => [{ achievement: { code: "FIRST_TASK" }, unlockedAt: new Date() }],
      },
    });
    const result = await evaluateAchievements(mock, "user-1");
    assert.ok(!result.includes("FIRST_TASK"), "FIRST_TASK must not appear again");
  });

  // 4. First habit
  await test("Completing first habit unlocks FIRST_HABIT", async () => {
    const mock = createMockPrisma({
      xpTransaction: { aggregate: () => ({ _sum: { amount: 10 } }) },
      habitCompletion: { count: () => 1 },
    });
    const result = await evaluateAchievements(mock, "user-1");
    assert.ok(result.includes("FIRST_HABIT"), "Expected FIRST_HABIT to unlock");
  });

  // 5. First learning session
  await test("Completing first learning session unlocks FIRST_SESSION", async () => {
    const mock = createMockPrisma({
      xpTransaction: { aggregate: () => ({ _sum: { amount: 30 } }) },
      learningSession: { count: () => 1 },
    });
    const result = await evaluateAchievements(mock, "user-1");
    assert.ok(result.includes("FIRST_SESSION"), "Expected FIRST_SESSION to unlock");
  });

  // 6. XP thresholds
  await test("Earning 100 XP unlocks XP_100", async () => {
    const mock = createMockPrisma({
      xpTransaction: { aggregate: () => ({ _sum: { amount: 100 } }) },
    });
    const result = await evaluateAchievements(mock, "user-1");
    assert.ok(result.includes("XP_100"), "Expected XP_100 to unlock");
  });

  await test("Earning 500 XP unlocks XP_100 and XP_500", async () => {
    const mock = createMockPrisma({
      xpTransaction: { aggregate: () => ({ _sum: { amount: 500 } }) },
    });
    const result = await evaluateAchievements(mock, "user-1");
    assert.ok(result.includes("XP_100"), "Expected XP_100");
    assert.ok(result.includes("XP_500"), "Expected XP_500");
  });

  // 7. Streak thresholds
  await test("Habit with 7-day streak unlocks STREAK_7", async () => {
    const mock = createMockPrisma({
      habit: { findMany: () => [{ streak: 7 }] },
    });
    const result = await evaluateAchievements(mock, "user-1");
    assert.ok(result.includes("STREAK_7"), "Expected STREAK_7");
  });

  await test("Habit with 30-day streak unlocks STREAK_7 and STREAK_30", async () => {
    const mock = createMockPrisma({
      habit: { findMany: () => [{ streak: 30 }] },
    });
    const result = await evaluateAchievements(mock, "user-1");
    assert.ok(result.includes("STREAK_7"), "Expected STREAK_7");
    assert.ok(result.includes("STREAK_30"), "Expected STREAK_30");
  });

  // 8. Multiple at once
  await test("First task + XP_100 unlock together", async () => {
    const mock = createMockPrisma({
      xpTransaction: { aggregate: () => ({ _sum: { amount: 100 } }) },
      task: { count: () => 1 },
    });
    const result = await evaluateAchievements(mock, "user-1");
    assert.ok(result.includes("FIRST_TASK"), "Expected FIRST_TASK");
    assert.ok(result.includes("XP_100"), "Expected XP_100");
  });

  // 9. All first-actions together
  await test("All first-actions unlock together with sufficient XP", async () => {
    const mock = createMockPrisma({
      xpTransaction: { aggregate: () => ({ _sum: { amount: 100 } }) },
      habitCompletion: { count: () => 1 },
      task: { count: () => 1 },
      learningSession: { count: () => 1 },
    });
    const result = await evaluateAchievements(mock, "user-1");
    assert.ok(result.includes("FIRST_HABIT"), "Expected FIRST_HABIT");
    assert.ok(result.includes("FIRST_TASK"), "Expected FIRST_TASK");
    assert.ok(result.includes("FIRST_SESSION"), "Expected FIRST_SESSION");
    assert.ok(result.includes("XP_100"), "Expected XP_100");
  });

  // 10. All already unlocked → nothing new
  await test("No achievements unlock when all are already earned", async () => {
    const allCodes = [
      "XP_100", "XP_500", "XP_1000",
      "FIRST_HABIT", "HABIT_10", "HABIT_50",
      "STREAK_7", "STREAK_30",
      "FIRST_TASK", "TASK_25",
      "FIRST_SESSION", "SESSION_10",
    ];
    const mock = createMockPrisma({
      xpTransaction: { aggregate: () => ({ _sum: { amount: 2000 } }) },
      habitCompletion: { count: () => 100 },
      task: { count: () => 100 },
      learningSession: { count: () => 100 },
      habit: { findMany: () => [{ streak: 60 }] },
      userAchievement: {
        findMany: () => allCodes.map((code) => ({ achievement: { code }, unlockedAt: new Date() })),
      },
    });
    const result = await evaluateAchievements(mock, "user-1");
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
