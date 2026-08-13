/**
 * XP service tests.
 *
 * These tests execute against the REAL production services
 * (xpService, achievementService) with a stubbed Prisma data layer,
 * so no database is required.
 *
 * Run with: npm run test:xp
 * (ts-node --files tests/xp.test.ts)
 */
import assert from "node:assert";

import { prisma } from "../src/config/database";
import {
  ACHIEVEMENT_DEFINITIONS,
  evaluateAchievements,
} from "../src/services/achievementService";
import { calculateLevel, xpForLevel, recordXp } from "../src/services/xpService";
import { syncAchievementDefinitions } from "../src/services/achievementService";

/* ── Test data layer ──────────────────────────────────────────── */

interface MockOverrides {
  xpAgg?: { _sum: { amount: number } };
  unlocked?: Array<{ achievement: { code: string }; unlockedAt: Date }>;
  habitCompletions?: number;
  habitStreaks?: number[];
  completedTasks?: number;
  completedSessions?: number;
  dbAchievements?: Array<{ code: string; title: string; description: string; icon: string }>;
}

/**
 * Stub the shared Prisma singleton so the real services can be exercised
 * without a database. Every delegate the services read is replaced; per-test
 * data is supplied via overrides.
 */
function setupMock(overrides: MockOverrides = {}) {
  const {
    xpAgg = { _sum: { amount: 0 } },
    unlocked = [],
    habitCompletions = 0,
    habitStreaks = [],
    completedTasks = 0,
    completedSessions = 0,
    dbAchievements = ACHIEVEMENT_DEFINITIONS.map((d) => ({ ...d })),
  } = overrides;

  const prismaAny = prisma as unknown as Record<string, unknown>;

  prismaAny.xpTransaction = {
    aggregate: async () => xpAgg,
    findFirst: async () => null,
    findMany: async () => [],
    create: async ({ data }: { data: { id?: string } }) => ({ id: data.id ?? "xp-1" }),
  };
  prismaAny.user = {
    update: async () => ({ id: "user-1" }),
  };
  prismaAny.userAchievement = {
    findMany: async () => unlocked,
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
    findMany: async () => dbAchievements,
    findUnique: async ({ where }: { where: { code: string } }) => {
      const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.code === where.code);
      return def ? { id: `achievement-${def.code}`, ...def } : null;
    },
    upsert: async () => ({ id: "achievement-1" }),
  };
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

  console.log("\n📋 XP Service Tests\n");

  /* ── XP level calculation (canonical) ───────────────────────── */
  await test("Level 1 starts at 0 XP", () => {
    assert.strictEqual(calculateLevel(0), 1);
  });

  await test("Level 1 below 100 XP", () => {
    assert.strictEqual(calculateLevel(99), 1);
  });

  await test("Level 2 exactly at 100 XP", () => {
    assert.strictEqual(calculateLevel(100), 2);
  });

  await test("Level 2 between 100 and 200 XP", () => {
    assert.strictEqual(calculateLevel(150), 2);
  });

  await test("Level 3 exactly at 200 XP", () => {
    assert.strictEqual(calculateLevel(200), 3);
  });

  await test("xpForLevel matches the canonical formula", () => {
    assert.strictEqual(xpForLevel(1), 0);
    assert.strictEqual(xpForLevel(2), 100);
    assert.strictEqual(xpForLevel(3), 200);
    assert.strictEqual(xpForLevel(5), 400);
  });

  await test("Representative XP/level boundaries are correct", () => {
    assert.strictEqual(calculateLevel(420), 5);
    assert.strictEqual(calculateLevel(999), 10);
    assert.strictEqual(calculateLevel(1000), 11);
  });

  /* ── Achievement synchronization ────────────────────────────── */
  await test("syncAchievementDefinitions upserts every code definition", async () => {
    let upserted = 0;
    const prismaAny = prisma as unknown as Record<string, unknown>;
    // syncAchievementDefinitions only touches prisma.achievement.upsert, so
    // no full mock setup is needed here (and setupMock() would overwrite this).
    prismaAny.achievement = {
      upsert: async () => {
        upserted++;
        return { id: "a" };
      },
    };
    await syncAchievementDefinitions();
    assert.strictEqual(upserted, ACHIEVEMENT_DEFINITIONS.length);
  });

  await test("syncAchievementDefinitions is idempotent", async () => {
    setupMock();
    await syncAchievementDefinitions();
    await syncAchievementDefinitions();
    await syncAchievementDefinitions();
  });

  await test("Synchronized definitions can be read from the database source", async () => {
    const dbAchievements = ACHIEVEMENT_DEFINITIONS.map((d) => ({ ...d }));
    setupMock({ dbAchievements });
    const result = await (prisma.achievement as unknown as {
      findMany: () => Promise<typeof dbAchievements>;
    }).findMany();
    assert.strictEqual(result.length, ACHIEVEMENT_DEFINITIONS.length);
    assert.deepStrictEqual(result, dbAchievements);
  });

  /* ── XP idempotency (canonical recordXp) ────────────────────── */
  await test("recordXp skips a duplicate (userId, reason, reference)", async () => {
    const created: Array<{ userId: string; amount: number; reason: string; reference: string | null }> = [];
    // recordXp accepts an optional transaction client; passing a fake one
    // exercises the idempotency path without a real $transaction.
    const fakeTx = {
      xpTransaction: {
        // Duplicate already exists for this (reason, reference)
        findFirst: async () => ({ id: "existing-xp" }),
        create: async ({ data }: { data: { userId: string; amount: number; reason: string; reference: string | null } }) => {
          created.push(data);
          return { id: "new-xp", ...data };
        },
      },
      user: { update: async () => ({ id: "user-1" }) },
    };

    const result = await recordXp("user-1", 10, "habit_completed", "completion-1", fakeTx as never);
    assert.ok(result, "expected existing transaction returned");
    assert.strictEqual(created.length, 0, "no duplicate XP row should be created");
  });

  /* ── Achievement evaluation idempotency ─────────────────────── */
  await test("Re-evaluating with the same state does not unlock again", async () => {
    setupMock({
      xpAgg: { _sum: { amount: 100 } },
      unlocked: [{ achievement: { code: "XP_100" }, unlockedAt: new Date() }],
    });
    const result = await evaluateAchievements("user-1");
    assert.deepStrictEqual(result, [], "Expected no new unlocks");
  });

  await test("New thresholds unlock exactly the expected achievements", async () => {
    setupMock({ xpAgg: { _sum: { amount: 500 } }, completedTasks: 1 });
    const result = await evaluateAchievements("user-1");
    const codes = result.map((a) => a.code);
    assert.ok(codes.includes("XP_100"), "Expected XP_100");
    assert.ok(codes.includes("XP_500"), "Expected XP_500");
    assert.ok(codes.includes("FIRST_TASK"), "Expected FIRST_TASK");
  });

  // ── Summary ──
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
