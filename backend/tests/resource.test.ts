/**
 * Resource domain + API tests (Slice 1A / 1B).
 *
 * These tests execute against the REAL production Resource service
 * (resourceService) and validation schemas (validators/resources), with a
 * stubbed Prisma data layer, so no database is required.
 *
 * Coverage:
 *   - Library Status / Resource Progress enum validation
 *   - legacy `completed` → `progress` mapping (approved migration mapping)
 *   - create/update persist the new states (independence preserved)
 *   - list filtering by libraryStatus / progress
 *   - archive / restore semantics
 *   - ownership scoping (cross-user access/update/delete rejected)
 *   - legacy `completed` compatibility (progress wins)
 *
 * Run with: npm run test:resource
 * (ts-node --files tests/resource.test.ts)
 */
import assert from "node:assert";
import { Prisma } from "@prisma/client";

import { prisma } from "../src/config/database";
import {
  createResource,
  updateResource,
  getResources,
  deleteResource,
  archiveResource,
  restoreResource,
  type ResourceListFilters,
} from "../src/services/resourceService";
import {
  createResourceSchema,
  updateResourceSchema,
} from "../src/validators/resources";

/* ── Test data layer ──────────────────────────────────────────── */

type StoredRow = {
  id: string;
  userId: string;
  title: string;
  url: string | null;
  description: string | null;
  tags: string[];
  libraryStatus: string;
  progress: string;
  thumbnailUrl: string | null;
  siteName: string | null;
  sourceType: string | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

let _seq = 0;
function makeRow(data: Partial<StoredRow>): StoredRow {
  return {
    id: data.id ?? `r-${++_seq}`,
    userId: data.userId ?? "user-1",
    title: data.title ?? "Untitled",
    url: data.url ?? null,
    description: data.description ?? null,
    tags: data.tags ?? [],
    libraryStatus: data.libraryStatus ?? "INBOX",
    progress: data.progress ?? "NOT_STARTED",
    thumbnailUrl: data.thumbnailUrl ?? null,
    siteName: data.siteName ?? null,
    sourceType: data.sourceType ?? null,
    completed: data.completed ?? false,
    createdAt: data.createdAt ?? new Date(),
    updatedAt: data.updatedAt ?? new Date(),
  };
}

function p2025(): never {
  throw new Prisma.PrismaClientKnownRequestError("Record not found", { code: "P2025", clientVersion: "7.8.0" });
}

function installResourceStub() {
  _seq = 0; // predictable ids per stub (r-1, r-2, ...)
  const rows: StoredRow[] = [];

  const prismaAny = prisma as unknown as Record<string, unknown>;
  prismaAny.resource = {
    findFirst: async ({ where }: { where?: { id?: string; userId?: string } }) => {
      const r = rows.find((x) => (where?.id ? x.id === where.id : true) && (where?.userId ? x.userId === where.userId : true));
      return r ?? null;
    },
    findMany: async ({ where }: { where: { userId?: string; libraryStatus?: string; progress?: string } }) => {
      return rows.filter((r) => {
        if (where.userId !== undefined && r.userId !== where.userId) return false;
        if (where.libraryStatus !== undefined && r.libraryStatus !== where.libraryStatus) return false;
        if (where.progress !== undefined && r.progress !== where.progress) return false;
        return true;
      });
    },
    create: async ({ data }: { data: Partial<StoredRow> }) => {
      const row = makeRow(data);
      rows.push(row);
      return row;
    },
    update: async ({ where, data }: { where: { id: string; userId: string }; data: Partial<StoredRow> }) => {
      const row = rows.find((r) => r.id === where.id && r.userId === where.userId);
      if (!row) p2025();
      const updated = makeRow({ ...row, ...data });
      rows.splice(rows.indexOf(row), 1, updated);
      return updated;
    },
    delete: async ({ where }: { where: { id: string; userId: string } }) => {
      const idx = rows.findIndex((r) => r.id === where.id && r.userId === where.userId);
      if (idx === -1) p2025();
      rows.splice(idx, 1);
      return { id: where.id };
    },
  };

  return {
    rows,
    seed: (...data: Array<Partial<StoredRow>>) => data.forEach((d) => rows.push(makeRow(d))),
  };
}

/** Assert a cross-user operation is rejected with NotFound (ownership scoping). */
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

  console.log("\n📋 Resource Domain Tests\n");

  /* ── Validation: valid enum values ──────────────────────────── */
  await test("Valid libraryStatus values are accepted", () => {
    for (const v of ["INBOX", "SAVED", "ARCHIVED"]) {
      assert.ok(updateResourceSchema.safeParse({ libraryStatus: v }).success, `expected ${v} to be valid`);
    }
  });

  await test("Valid progress values are accepted", () => {
    for (const v of ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]) {
      assert.ok(updateResourceSchema.safeParse({ progress: v }).success, `expected ${v} to be valid`);
    }
  });

  await test("Invalid libraryStatus is rejected", () => {
    assert.ok(!updateResourceSchema.safeParse({ libraryStatus: "DRAFT" }).success);
  });

  await test("Invalid progress is rejected", () => {
    assert.ok(!updateResourceSchema.safeParse({ progress: "DONE" }).success);
  });

  /* ── Validation: deprecated completed shorthand ─────────────── */
  await test("Deprecated completed shorthand is still accepted", () => {
    assert.ok(updateResourceSchema.safeParse({ completed: true }).success);
  });

  /* ── Approved migration mapping (completed → progress) ──────── */
  await test("completed=true maps to progress COMPLETED", async () => {
    const stub = installResourceStub();
    await createResource("user-1", { title: "X", completed: true });
    assert.strictEqual(stub.rows[0].progress, "COMPLETED");
    assert.strictEqual(stub.rows[0].completed, true);
  });

  await test("completed=false maps to progress NOT_STARTED", async () => {
    const stub = installResourceStub();
    await createResource("user-1", { title: "X", completed: false });
    assert.strictEqual(stub.rows[0].progress, "NOT_STARTED");
    assert.strictEqual(stub.rows[0].completed, false);
  });

  await test("Existing resources remain SAVED (not INBOX) on read", async () => {
    const stub = installResourceStub();
    stub.seed({ title: "Migrated", libraryStatus: "SAVED", progress: "COMPLETED" });
    const result = await getResources("user-1");
    assert.strictEqual(result[0].libraryStatus, "SAVED");
  });

  /* ── Progress is canonical when both provided ───────────────── */
  await test("Explicit progress wins over deprecated completed", async () => {
    const stub = installResourceStub();
    await createResource("user-1", { title: "X", progress: "IN_PROGRESS", completed: true });
    assert.strictEqual(stub.rows[0].progress, "IN_PROGRESS");
    assert.strictEqual(stub.rows[0].completed, false);
  });

  /* ── Response derivation ────────────────────────────────────── */
  await test("Response completed is derived from progress", async () => {
    const stub = installResourceStub();
    stub.seed({ title: "A", progress: "COMPLETED" }, { title: "B", progress: "NOT_STARTED" });
    const result = await getResources("user-1");
    assert.strictEqual(result[0].completed, true);
    assert.strictEqual(result[1].completed, false);
  });

  /* ── List: ownership + filters ──────────────────────────────── */
  await test("List only returns the authenticated user's resources", async () => {
    const stub = installResourceStub();
    stub.seed(
      { title: "mine", userId: "user-1" },
      { title: "theirs", userId: "user-2" },
      { title: "also-mine", userId: "user-1" },
    );
    const result = await getResources("user-1");
    assert.strictEqual(result.length, 2);
    assert.ok(result.every((r) => r.title !== "theirs"));
  });

  await test("List filters by libraryStatus", async () => {
    const stub = installResourceStub();
    stub.seed(
      { title: "inbox", libraryStatus: "INBOX" },
      { title: "saved", libraryStatus: "SAVED" },
      { title: "archived", libraryStatus: "ARCHIVED" },
    );
    const filters: ResourceListFilters = { libraryStatus: "SAVED" };
    const result = await getResources("user-1", filters);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].title, "saved");
  });

  await test("List filters by progress", async () => {
    const stub = installResourceStub();
    stub.seed(
      { title: "ns", progress: "NOT_STARTED" },
      { title: "ip", progress: "IN_PROGRESS" },
      { title: "done", progress: "COMPLETED" },
    );
    const result = await getResources("user-1", { progress: "IN_PROGRESS" });
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].title, "ip");
  });

  await test("List filters are optional and combine with AND", async () => {
    const stub = installResourceStub();
    stub.seed(
      { title: "a", libraryStatus: "SAVED", progress: "COMPLETED" },
      { title: "b", libraryStatus: "SAVED", progress: "IN_PROGRESS" },
      { title: "c", libraryStatus: "ARCHIVED", progress: "COMPLETED" },
    );
    const both = await getResources("user-1", { libraryStatus: "SAVED", progress: "COMPLETED" });
    assert.strictEqual(both.length, 1);
    assert.strictEqual(both[0].title, "a");
    const none = await getResources("user-1");
    assert.strictEqual(none.length, 3);
  });

  /* ── Create defaults ────────────────────────────────────────── */
  await test("New resource defaults to INBOX + NOT_STARTED", async () => {
    const stub = installResourceStub();
    const result = await createResource("user-1", { title: "X" });
    assert.strictEqual(result.libraryStatus, "INBOX");
    assert.strictEqual(result.progress, "NOT_STARTED");
    assert.strictEqual(result.completed, false);
  });

  await test("Create accepts explicit valid status/progress", async () => {
    const stub = installResourceStub();
    const result = await createResource("user-1", { title: "X", libraryStatus: "SAVED", progress: "IN_PROGRESS" });
    assert.strictEqual(result.libraryStatus, "SAVED");
    assert.strictEqual(result.progress, "IN_PROGRESS");
  });

  /* ── Update independence ────────────────────────────────────── */
  await test("Status change does not touch progress", async () => {
    const stub = installResourceStub();
    stub.seed({ title: "X", libraryStatus: "SAVED", progress: "IN_PROGRESS" });
    const result = await updateResource("r-1", "user-1", { libraryStatus: "ARCHIVED" });
    assert.strictEqual(result.libraryStatus, "ARCHIVED");
    assert.strictEqual(result.progress, "IN_PROGRESS", "progress must be preserved");
  });

  await test("Progress change does not touch status", async () => {
    const stub = installResourceStub();
    stub.seed({ title: "X", libraryStatus: "SAVED", progress: "NOT_STARTED" });
    const result = await updateResource("r-1", "user-1", { progress: "COMPLETED" });
    assert.strictEqual(result.progress, "COMPLETED");
    assert.strictEqual(result.libraryStatus, "SAVED", "status must be preserved");
  });

  await test("ARCHIVED + COMPLETED is a valid independent state", async () => {
    const stub = installResourceStub();
    stub.seed({ title: "X", libraryStatus: "SAVED", progress: "NOT_STARTED" });
    const result = await updateResource("r-1", "user-1", { libraryStatus: "ARCHIVED", progress: "COMPLETED" });
    assert.deepStrictEqual(
      { libraryStatus: result.libraryStatus, progress: result.progress },
      { libraryStatus: "ARCHIVED", progress: "COMPLETED" },
    );
  });

  /* ── Archive / Restore ──────────────────────────────────────── */
  await test("Archive moves to ARCHIVED, preserves progress and metadata", async () => {
    const stub = installResourceStub();
    stub.seed({ title: "X", description: "keep me", libraryStatus: "SAVED", progress: "COMPLETED" });
    const result = await archiveResource("r-1", "user-1");
    assert.strictEqual(result.libraryStatus, "ARCHIVED");
    assert.strictEqual(result.progress, "COMPLETED", "archive must not reset progress");
    assert.strictEqual(result.description, "keep me", "archive must not clear metadata");
    assert.strictEqual(result.completed, true);
  });

  await test("Restore returns an archived resource to SAVED, preserving progress", async () => {
    const stub = installResourceStub();
    stub.seed({ title: "X", libraryStatus: "ARCHIVED", progress: "COMPLETED" });
    const result = await restoreResource("r-1", "user-1");
    assert.strictEqual(result.libraryStatus, "SAVED");
    assert.strictEqual(result.progress, "COMPLETED");
  });

  /* ── Ownership / security ───────────────────────────────────── */
  await test("Cross-user list does not expose another user's resources", async () => {
    const stub = installResourceStub();
    stub.seed({ title: "secret", userId: "user-2" });
    const result = await getResources("user-1");
    assert.strictEqual(result.length, 0);
  });

  await test("Cross-user update is rejected", async () => {
    const stub = installResourceStub();
    stub.seed({ title: "theirs", userId: "user-2" });
    await expectNotFound(() => updateResource("r-1", "user-1", { progress: "COMPLETED" }));
  });

  await test("Cross-user archive is rejected", async () => {
    const stub = installResourceStub();
    stub.seed({ title: "theirs", userId: "user-2" });
    await expectNotFound(() => archiveResource("r-1", "user-1"));
  });

  await test("Cross-user restore is rejected", async () => {
    const stub = installResourceStub();
    stub.seed({ title: "theirs", userId: "user-2" });
    await expectNotFound(() => restoreResource("r-1", "user-1"));
  });

  await test("Cross-user delete is rejected", async () => {
    const stub = installResourceStub();
    stub.seed({ title: "theirs", userId: "user-2" });
    await expectNotFound(() => deleteResource("r-1", "user-1"));
    assert.strictEqual(stub.rows.length, 1, "another user's resource must remain");
  });

  await test("Delete only removes the authenticated user's resource", async () => {
    const stub = installResourceStub();
    stub.seed({ title: "mine", userId: "user-1" });
    await deleteResource("r-1", "user-1");
    assert.strictEqual(stub.rows.length, 0);
  });

  /* ── Archive is not Delete ──────────────────────────────────── */
  await test("Archiving does not delete the resource", async () => {
    const stub = installResourceStub();
    stub.seed({ title: "X", libraryStatus: "SAVED" });
    await archiveResource("r-1", "user-1");
    assert.strictEqual(stub.rows.length, 1, "resource must still exist after archive");
    assert.strictEqual(stub.rows[0].libraryStatus, "ARCHIVED");
  });

  // ── Summary ──
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
