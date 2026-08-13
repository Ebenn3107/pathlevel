/**
 * Learning domain tests (Slice 3): Goals, Units, and Resource relationships.
 *
 * These tests execute against the REAL production services
 * (learningGoalService, learningUnitService) with an in-memory Prisma stub,
 * so no database is required.
 *
 * Coverage:
 *   - Goal CRUD; Goal may exist with zero Units
 *   - Unit CRUD; Unit may exist with zero Resources
 *   - Unit status transitions (valid + invalid), reopen
 *   - Goal progress is DERIVED from Unit statuses (not stored)
 *   - Resource ↔ Unit link/unlink, idempotency, detach-safe
 *   - Resource ↔ Goal link/unlink, idempotency, detach-safe
 *   - Cross-user ownership rejection
 *   - Delete Goal/Unit preserves Resources
 *
 * Run with: npm run test:learning
 */
import assert from "node:assert";

import { prisma } from "../src/config/database";
import { Prisma } from "@prisma/client";
import {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  archiveGoal,
  restoreGoal,
  createGoalUnit,
  getGoalResources,
  linkResourceToGoal,
  unlinkResourceFromGoal,
} from "../src/services/learningGoalService";
import {
  getUnit,
  updateUnit,
  deleteUnit,
  getUnitResources,
  linkResourceToUnit,
  unlinkResourceFromUnit,
} from "../src/services/learningUnitService";

/* ── In-memory Prisma stub ────────────────────────────────────── */

type GoalRow = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type UnitRow = {
  id: string;
  goalId: string;
  userId: string;
  title: string;
  description: string | null;
  status: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type RluRow = { id: string; resourceId: string; unitId: string; userId: string; createdAt: Date };
type RlgRow = { id: string; resourceId: string; goalId: string; userId: string; createdAt: Date };

type ResourceRow = {
  id: string;
  userId: string;
  title: string;
  url: string | null;
  description: string | null;
  tags: string[];
  libraryStatus: string;
  progress: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

let _seq = 0;
function nextId(): string {
  return `id-${++_seq}`;
}

function makeGoal(u: Partial<GoalRow> & { userId: string }): GoalRow {
  const now = new Date();
  return {
    id: u.id ?? nextId(),
    title: u.title ?? "Goal",
    description: u.description ?? null,
    archivedAt: u.archivedAt ?? null,
    createdAt: now,
    updatedAt: now,
    ...u,
  };
}

function makeUnit(u: Partial<UnitRow> & { goalId: string; userId: string }): UnitRow {
  const now = new Date();
  return {
    id: u.id ?? nextId(),
    title: u.title ?? "Unit",
    description: u.description ?? null,
    status: u.status ?? "NOT_STARTED",
    completedAt: u.completedAt ?? null,
    createdAt: now,
    updatedAt: now,
    ...u,
  };
}

function makeResource(u: Partial<ResourceRow> & { userId: string }): ResourceRow {
  const now = new Date();
  return {
    id: u.id ?? nextId(),
    title: u.title ?? "Resource",
    url: u.url ?? null,
    description: u.description ?? null,
    tags: u.tags ?? [],
    libraryStatus: u.libraryStatus ?? "SAVED",
    progress: u.progress ?? "NOT_STARTED",
    completed: u.completed ?? false,
    createdAt: now,
    updatedAt: now,
    ...u,
  };
}

function p2025(): never {
  throw new Prisma.PrismaClientKnownRequestError("Record not found", { code: "P2025", clientVersion: "7.8.0" });
}

function p2002(): never {
  throw new Prisma.PrismaClientKnownRequestError("Unique constraint failed", { code: "P2002", clientVersion: "7.8.0" });
}

interface LearningStub {
  goals: GoalRow[];
  units: UnitRow[];
  rlu: RluRow[];
  rlg: RlgRow[];
  resources: ResourceRow[];
}

function installStub(): LearningStub {
  _seq = 0;
  const store: LearningStub = { goals: [], units: [], rlu: [], rlg: [], resources: [] };

  const p = prisma as unknown as Record<string, unknown>;

  p.learningGoal = {
    findMany: async ({ where, include }: { where?: { userId: string }; include?: { units: { select: { status: true } } } }) => {
      let rows = store.goals;
      if (where?.userId) rows = rows.filter((g) => g.userId === where.userId);
      return rows.map((g) => (include ? { ...g, units: store.units.filter((u) => u.goalId === g.id) } : g));
    },
    findFirst: async ({ where, include }: { where?: { id?: string; userId?: string }; include?: unknown }) => {
      const g = store.goals.find((x) => (where?.id ? x.id === where.id : true) && (where?.userId ? x.userId === where.userId : true));
      if (!g) return null;
      if (include) {
        return {
          ...g,
          units: store.units
            .filter((u) => u.goalId === g.id)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
          resources: store.rlg
            .filter((r) => r.goalId === g.id)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .map((r) => ({ ...r, resource: store.resources.find((res) => res.id === r.resourceId) })),
        };
      }
      return g;
    },
    create: async ({ data, include }: { data: Partial<GoalRow> & { userId: string }; include?: unknown }) => {
      const g = makeGoal(data);
      store.goals.push(g);
      return include ? { ...g, units: [] } : g;
    },
    update: async ({ where, data, include }: { where: { id: string }; data: Partial<GoalRow>; include?: unknown }) => {
      const g = store.goals.find((x) => x.id === where.id);
      if (!g) p2025();
      Object.assign(g, data, { updatedAt: new Date() });
      return include ? { ...g, units: store.units.filter((u) => u.goalId === g.id) } : g;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const idx = store.goals.findIndex((g) => g.id === where.id);
      if (idx === -1) p2025();
      store.goals.splice(idx, 1);
      // cascade: remove child units + junction rows (Resources are preserved)
      store.units = store.units.filter((u) => u.goalId !== where.id);
      store.rlu = store.rlu.filter((r) => !store.units.some((u) => u.id === r.unitId));
      store.rlg = store.rlg.filter((r) => r.goalId !== where.id);
      return { id: where.id };
    },
  };

  p.learningUnit = {
    findMany: async ({ where }: { where?: { goalId?: string; userId?: string } }) =>
      store.units.filter((u) => (where?.goalId ? u.goalId === where.goalId : true) && (where?.userId ? u.userId === where.userId : true)),
    findFirst: async ({ where, include }: { where?: { id?: string; userId?: string }; include?: unknown }) => {
      const u = store.units.find((x) => (where?.id ? x.id === where.id : true) && (where?.userId ? x.userId === where.userId : true));
      if (!u) return null;
      if (include) {
        return {
          ...u,
          resources: store.rlu
            .filter((r) => r.unitId === u.id)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .map((r) => ({ ...r, resource: store.resources.find((res) => res.id === r.resourceId) })),
        };
      }
      return u;
    },
    create: async ({ data }: { data: Partial<UnitRow> & { goalId: string; userId: string } }) => {
      const u = makeUnit(data);
      store.units.push(u);
      return u;
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<UnitRow> }) => {
      const u = store.units.find((x) => x.id === where.id);
      if (!u) p2025();
      Object.assign(u, data, { updatedAt: new Date() });
      return u;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const idx = store.units.findIndex((u) => u.id === where.id);
      if (idx === -1) p2025();
      store.units.splice(idx, 1);
      // cascade: remove only the unit's resource junction rows; Resources kept
      store.rlu = store.rlu.filter((r) => r.unitId !== where.id);
      return { id: where.id };
    },
  };

  p.resourceLearningUnit = {
    create: async ({ data }: { data: Partial<RluRow> & { resourceId: string; unitId: string; userId: string } }) => {
      if (store.rlu.some((r) => r.resourceId === data.resourceId && r.unitId === data.unitId)) p2002();
      const row: RluRow = { id: nextId(), createdAt: new Date(), ...data };
      store.rlu.push(row);
      return row;
    },
    findMany: async ({ where, include }: { where?: { unitId?: string; userId?: string; resourceId?: string }; include?: { resource: true } | { unit: { select: unknown } } }) => {
      const rows = store.rlu.filter(
        (r) =>
          (where?.unitId ? r.unitId === where.unitId : true) &&
          (where?.userId ? r.userId === where.userId : true) &&
          (where?.resourceId ? r.resourceId === where.resourceId : true),
      );
      if (include) {
        return rows.map((r) =>
          "resource" in (include as object)
            ? { ...r, resource: store.resources.find((res) => res.id === r.resourceId) }
            : { ...r, unit: store.units.find((u) => u.id === r.unitId) },
        );
      }
      return rows;
    },
    deleteMany: async ({ where }: { where: { unitId?: string; resourceId?: string; userId?: string } }) => {
      const before = store.rlu.length;
      store.rlu = store.rlu.filter(
        (r) =>
          !(
            (where.unitId ? r.unitId === where.unitId : true) &&
            (where.resourceId ? r.resourceId === where.resourceId : true) &&
            (where.userId ? r.userId === where.userId : true)
          ),
      );
      return { count: before - store.rlu.length };
    },
  };

  p.resourceLearningGoal = {
    create: async ({ data }: { data: Partial<RlgRow> & { resourceId: string; goalId: string; userId: string } }) => {
      if (store.rlg.some((r) => r.resourceId === data.resourceId && r.goalId === data.goalId)) p2002();
      const row: RlgRow = { id: nextId(), createdAt: new Date(), ...data };
      store.rlg.push(row);
      return row;
    },
    findMany: async ({ where, include }: { where?: { goalId?: string; userId?: string; resourceId?: string }; include?: { resource: true } | { goal: { select: unknown } } }) => {
      const rows = store.rlg.filter(
        (r) =>
          (where?.goalId ? r.goalId === where.goalId : true) &&
          (where?.userId ? r.userId === where.userId : true) &&
          (where?.resourceId ? r.resourceId === where.resourceId : true),
      );
      if (include) {
        return rows.map((r) =>
          "resource" in (include as object)
            ? { ...r, resource: store.resources.find((res) => res.id === r.resourceId) }
            : { ...r, goal: store.goals.find((g) => g.id === r.goalId) },
        );
      }
      return rows;
    },
    deleteMany: async ({ where }: { where: { goalId?: string; resourceId?: string; userId?: string } }) => {
      const before = store.rlg.length;
      store.rlg = store.rlg.filter(
        (r) =>
          !(
            (where.goalId ? r.goalId === where.goalId : true) &&
            (where.resourceId ? r.resourceId === where.resourceId : true) &&
            (where.userId ? r.userId === where.userId : true)
          ),
      );
      return { count: before - store.rlg.length };
    },
  };

  p.resource = {
    findFirst: async ({ where }: { where?: { id?: string; userId?: string } }) => {
      const r = store.resources.find((x) => (where?.id ? x.id === where.id : true) && (where?.userId ? x.userId === where.userId : true));
      return r ?? null;
    },
  };

  return store;
}

/** Assert an operation is rejected with NotFound (ownership scoping). */
async function expectNotFound(fn: () => Promise<unknown>): Promise<void> {
  let thrown: unknown = null;
  try {
    await fn();
  } catch (err) {
    thrown = err;
  }
  assert.ok(thrown instanceof Error, "expected an error");
  assert.ok((thrown as Error).message.includes("not found"), `expected not-found, got: ${(thrown as Error).message}`);
}

async function expectValidation(fn: () => Promise<unknown>): Promise<void> {
  let thrown: unknown = null;
  try {
    await fn();
  } catch (err) {
    thrown = err;
  }
  assert.ok(thrown instanceof Error, "expected an error");
  assert.strictEqual((thrown as Error & { statusCode?: number }).statusCode, 400);
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

  console.log("\n📋 Learning Domain Tests\n");

  /* ── Goal CRUD ─────────────────────────────────────────────── */
  await test("Create goal; goal exists with zero units", async () => {
    const s = installStub();
    const goal = await createGoal("user-1", { title: "Backend Development" });
    assert.strictEqual(s.goals.length, 1);
    assert.strictEqual(goal.totalUnits, 0);
    assert.strictEqual(goal.progressPercentage, 0);
  });

  await test("List goals scoped to user", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-1", title: "mine" }));
    s.goals.push(makeGoal({ id: "g2", userId: "user-2", title: "theirs" }));
    const result = await getGoals("user-1");
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].title, "mine");
  });

  await test("Update and archive/restore goal", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-1", title: "Goal" }));
    const updated = await updateGoal("g1", "user-1", { title: "Renamed" });
    assert.strictEqual(updated.title, "Renamed");
    const archived = await archiveGoal("g1", "user-1");
    assert.ok(archived.archivedAt);
    const restored = await restoreGoal("g1", "user-1");
    assert.strictEqual(restored.archivedAt, null);
  });

  /* ── Unit CRUD + status ────────────────────────────────────── */
  await test("Create unit under a goal; unit exists with zero resources", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-1", title: "Goal" }));
    const unit = await createGoalUnit("g1", "user-1", { title: "HTTP" });
    assert.strictEqual(s.units.length, 1);
    assert.strictEqual(unit.status, "NOT_STARTED");
    const detail = await getUnit(unit.id, "user-1");
    assert.deepStrictEqual(detail.resources, []);
  });

  await test("Unit status transitions follow the approved rules", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-1", title: "Goal" }));
    const unit = await createGoalUnit("g1", "user-1", { title: "Unit" });
    // NOT_STARTED → IN_PROGRESS
    const ip = await updateUnit(unit.id, "user-1", { status: "IN_PROGRESS" });
    assert.strictEqual(ip.status, "IN_PROGRESS");
    // IN_PROGRESS → COMPLETED (sets completedAt)
    const done = await updateUnit(unit.id, "user-1", { status: "COMPLETED" });
    assert.strictEqual(done.status, "COMPLETED");
    assert.ok(done.completedAt);
    // COMPLETED → REOPENED (clears completedAt)
    const reopened = await updateUnit(unit.id, "user-1", { status: "REOPENED" });
    assert.strictEqual(reopened.status, "REOPENED");
    assert.strictEqual(reopened.completedAt, null);
    // REOPENED → COMPLETED
    const done2 = await updateUnit(unit.id, "user-1", { status: "COMPLETED" });
    assert.strictEqual(done2.status, "COMPLETED");
  });

  await test("Invalid unit status transition is rejected", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-1", title: "Goal" }));
    const unit = await createGoalUnit("g1", "user-1", { title: "Unit" });
    // NOT_STARTED → REOPENED is invalid
    await expectValidation(() => updateUnit(unit.id, "user-1", { status: "REOPENED" }));
    // COMPLETED → NOT_STARTED is invalid
    await updateUnit(unit.id, "user-1", { status: "COMPLETED" });
    await expectValidation(() => updateUnit(unit.id, "user-1", { status: "NOT_STARTED" }));
  });

  await test("Unit status can go directly NOT_STARTED → COMPLETED", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-1", title: "Goal" }));
    const unit = await createGoalUnit("g1", "user-1", { title: "Unit" });
    const done = await updateUnit(unit.id, "user-1", { status: "COMPLETED" });
    assert.strictEqual(done.status, "COMPLETED");
  });

  /* ── Derived Goal progress ─────────────────────────────────── */
  await test("Goal progress is derived from unit statuses (1/3 → 33%)", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-1", title: "Goal" }));
    s.units.push(
      makeUnit({ id: "u1", goalId: "g1", userId: "user-1", status: "COMPLETED" }),
      makeUnit({ id: "u2", goalId: "g1", userId: "user-1", status: "IN_PROGRESS" }),
      makeUnit({ id: "u3", goalId: "g1", userId: "user-1", status: "NOT_STARTED" }),
    );
    const [goal] = await getGoals("user-1");
    assert.strictEqual(goal.completedUnits, 1);
    assert.strictEqual(goal.totalUnits, 3);
    assert.strictEqual(goal.progressPercentage, 33);
  });

  await test("Reopened unit is not counted as completed in goal progress", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-1", title: "Goal" }));
    s.units.push(
      makeUnit({ id: "u1", goalId: "g1", userId: "user-1", status: "REOPENED" }),
      makeUnit({ id: "u2", goalId: "g1", userId: "user-1", status: "COMPLETED" }),
    );
    const [goal] = await getGoals("user-1");
    assert.strictEqual(goal.completedUnits, 1);
    assert.strictEqual(goal.totalUnits, 2);
  });

  /* ── Resource ↔ Unit ───────────────────────────────────────── */
  await test("Link resource to unit; resource stays independent", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-1", title: "Goal" }));
    s.units.push(makeUnit({ id: "u1", goalId: "g1", userId: "user-1", title: "Unit" }));
    s.resources.push(makeResource({ id: "r1", userId: "user-1", title: "Res" }));
    await linkResourceToUnit("u1", "r1", "user-1");
    const resources = await getUnitResources("u1", "user-1");
    assert.strictEqual(resources.length, 1);
    assert.strictEqual(resources[0].title, "Res");
    // Resource remains in Library (still exists, status unchanged)
    assert.strictEqual(s.resources.length, 1);
    assert.strictEqual(s.resources[0].libraryStatus, "SAVED");
  });

  await test("Same resource can link to multiple units", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-1", title: "Goal" }));
    s.units.push(makeUnit({ id: "u1", goalId: "g1", userId: "user-1" }));
    s.units.push(makeUnit({ id: "u2", goalId: "g1", userId: "user-1" }));
    s.resources.push(makeResource({ id: "r1", userId: "user-1" }));
    await linkResourceToUnit("u1", "r1", "user-1");
    await linkResourceToUnit("u2", "r1", "user-1");
    assert.strictEqual(s.rlu.length, 2);
  });

  await test("Duplicate resource-unit link is idempotent", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-1", title: "Goal" }));
    s.units.push(makeUnit({ id: "u1", goalId: "g1", userId: "user-1" }));
    s.resources.push(makeResource({ id: "r1", userId: "user-1" }));
    await linkResourceToUnit("u1", "r1", "user-1");
    await linkResourceToUnit("u1", "r1", "user-1"); // no-op
    assert.strictEqual(s.rlu.length, 1);
  });

  await test("Unlink preserves resource and unit", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-1", title: "Goal" }));
    s.units.push(makeUnit({ id: "u1", goalId: "g1", userId: "user-1" }));
    s.resources.push(makeResource({ id: "r1", userId: "user-1" }));
    await linkResourceToUnit("u1", "r1", "user-1");
    await unlinkResourceFromUnit("u1", "r1", "user-1");
    assert.strictEqual(s.rlu.length, 0);
    assert.strictEqual(s.units.length, 1, "unit preserved");
    assert.strictEqual(s.resources.length, 1, "resource preserved");
  });

  await test("Deleting a unit removes link rows only, keeps resources", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-1", title: "Goal" }));
    s.units.push(makeUnit({ id: "u1", goalId: "g1", userId: "user-1" }));
    s.resources.push(makeResource({ id: "r1", userId: "user-1" }));
    await linkResourceToUnit("u1", "r1", "user-1");
    await deleteUnit("u1", "user-1");
    assert.strictEqual(s.rlu.length, 0, "link rows removed");
    assert.strictEqual(s.resources.length, 1, "resource preserved");
  });

  /* ── Resource ↔ Goal (unassigned) ──────────────────────────── */
  await test("Link resource to goal as unassigned; list goal resources", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-1", title: "Goal" }));
    s.resources.push(makeResource({ id: "r1", userId: "user-1", title: "Res" }));
    await linkResourceToGoal("g1", "r1", "user-1");
    const resources = await getGoalResources("g1", "user-1");
    assert.strictEqual(resources.length, 1);
    assert.strictEqual(resources[0].title, "Res");
  });

  await test("Unlink resource from goal preserves both", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-1", title: "Goal" }));
    s.resources.push(makeResource({ id: "r1", userId: "user-1" }));
    await linkResourceToGoal("g1", "r1", "user-1");
    await unlinkResourceFromGoal("g1", "r1", "user-1");
    assert.strictEqual(s.rlg.length, 0);
    assert.strictEqual(s.goals.length, 1);
    assert.strictEqual(s.resources.length, 1);
  });

  await test("Deleting a goal removes link rows and child units, keeps resources", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-1", title: "Goal" }));
    s.units.push(makeUnit({ id: "u1", goalId: "g1", userId: "user-1" }));
    s.resources.push(makeResource({ id: "r1", userId: "user-1" }));
    await linkResourceToGoal("g1", "r1", "user-1");
    await deleteGoal("g1", "user-1");
    assert.strictEqual(s.rlg.length, 0, "goal link rows removed");
    assert.strictEqual(s.units.length, 0, "child units removed");
    assert.strictEqual(s.resources.length, 1, "resources preserved");
  });

  /* ── Cross-user ownership ──────────────────────────────────── */
  await test("User A cannot access User B's goal", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-2", title: "theirs" }));
    await expectNotFound(() => getGoal("g1", "user-1"));
    await expectNotFound(() => updateGoal("g1", "user-1", { title: "x" }));
    await expectNotFound(() => deleteGoal("g1", "user-1"));
  });

  await test("User A cannot access User B's unit", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-2", title: "theirs" }));
    s.units.push(makeUnit({ id: "u1", goalId: "g1", userId: "user-2" }));
    await expectNotFound(() => getUnit("u1", "user-1"));
    await expectNotFound(() => updateUnit("u1", "user-1", { status: "COMPLETED" }));
    await expectNotFound(() => deleteUnit("u1", "user-1"));
  });

  await test("User A cannot create a unit under User B's goal", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-2", title: "theirs" }));
    await expectNotFound(() => createGoalUnit("g1", "user-1", { title: "x" }));
  });

  await test("User A cannot link User B's resource", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-1", title: "mine" }));
    s.units.push(makeUnit({ id: "u1", goalId: "g1", userId: "user-1" }));
    s.resources.push(makeResource({ id: "r1", userId: "user-2", title: "theirs" }));
    // The resource belongs to user-2; user-1 must not be able to link it.
    await expectNotFound(() => linkResourceToUnit("u1", "r1", "user-1"));
  });

  await test("Cross-user unlink of a relationship is rejected", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-1", title: "mine" }));
    s.units.push(makeUnit({ id: "u1", goalId: "g1", userId: "user-1" }));
    s.resources.push(makeResource({ id: "r1", userId: "user-1" }));
    await linkResourceToUnit("u1", "r1", "user-1");
    await expectNotFound(() => unlinkResourceFromUnit("u1", "r1", "user-2"));
  });

  /* ── Goal detail includes unassigned resources ─────────────── */
  await test("Goal detail returns units and unassigned resources", async () => {
    const s = installStub();
    s.goals.push(makeGoal({ id: "g1", userId: "user-1", title: "Goal" }));
    s.units.push(makeUnit({ id: "u1", goalId: "g1", userId: "user-1", title: "HTTP" }));
    s.resources.push(makeResource({ id: "r1", userId: "user-1", title: "Unassigned" }));
    await linkResourceToGoal("g1", "r1", "user-1");
    const detail = await getGoal("g1", "user-1");
    assert.strictEqual(detail.units.length, 1);
    assert.strictEqual(detail.resources.length, 1);
    assert.strictEqual(detail.resources[0].title, "Unassigned");
  });

  // ── Summary ──
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
