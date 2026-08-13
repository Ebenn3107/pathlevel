/**
 * Search tests (Slice 5) — Resource-first deterministic keyword search.
 *
 * These tests exercise the REAL production service (searchService) against a
 * stubbed Prisma `$queryRaw`. The stub inspects the parameterized SQL values
 * (userId + ILIKE patterns) and applies the same filtering/ordering semantics,
 * verifying:
 *   - title / description / tag matching
 *   - case-insensitivity + whitespace normalization
 *   - ownership isolation (never another user's Resources)
 *   - deterministic ordering (title > description > tag, updatedAt desc)
 *   - all Library statuses are searchable
 *   - no Resource metadata is modified
 *
 * Run with: npm run test:search
 */
import assert from "node:assert";

import { prisma } from "../src/config/database";
import { searchResources, normalizeSearchTerm } from "../src/services/searchService";
import { searchQuerySchema } from "../src/validators/search";

/* ── In-memory data + stub ────────────────────────────────────── */

type Row = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  tags: string[];
  libraryStatus: string;
  progress: string;
  createdAt: Date;
  updatedAt: Date;
};

function makeRow(data: Partial<Row> & { userId: string }): Row {
  return {
    id: data.id ?? `r-${Math.random().toString(36).slice(2)}`,
    title: data.title ?? "Untitled",
    description: data.description ?? null,
    tags: data.tags ?? [],
    libraryStatus: data.libraryStatus ?? "SAVED",
    progress: data.progress ?? "NOT_STARTED",
    createdAt: data.createdAt ?? new Date("2026-01-01"),
    updatedAt: data.updatedAt ?? new Date("2026-01-01"),
    userId: data.userId,
  };
}

/** Simple ILIKE equivalent (case-insensitive substring). */
function ilike(haystack: string | null | string[], needle: string): boolean {
  if (haystack === null) return false;
  const joined = Array.isArray(haystack) ? haystack.join(" ") : haystack;
  return joined.toLowerCase().includes(needle.toLowerCase());
}

/**
 * Stub Prisma.$queryRaw with the same semantics the real SQL implements.
 * Supports the tagged-template call form: (strings, ...values).
 */
function installSearchStub(rows: Row[]) {
  const prismaAny = prisma as unknown as Record<string, unknown>;
  prismaAny.$queryRaw = async (...args: unknown[]) => {
    // Tagged template → args = [strings, ...interpolatedValues]
    // (a `Prisma.Sql` object with `.values` is also tolerated).
    const first = args[0] as { values?: unknown[] };
    const values: unknown[] = Array.isArray(first) ? args.slice(1) : (first.values ?? []);

    // Template order: userId, pattern (title), pattern (desc), pattern (tags)
    const [userId, pattern] = values as [string, string];
    const term = pattern.slice(1, -1); // strip surrounding %

    const matched = rows
      .filter((r) => r.userId === userId)
      .filter((r) => ilike(r.title, term) || ilike(r.description, term) || ilike(r.tags, term))
      .sort((a, b) => {
        const rankA = ilike(a.title, term) ? 0 : ilike(a.description ?? "", term) ? 1 : 2;
        const rankB = ilike(b.title, term) ? 0 : ilike(b.description ?? "", term) ? 1 : 2;
        if (rankA !== rankB) return rankA - rankB;
        if (a.updatedAt.getTime() !== b.updatedAt.getTime()) return b.updatedAt.getTime() - a.updatedAt.getTime();
        return a.id.localeCompare(b.id);
      });

    // Map to the aliased row shape the real query returns.
    return matched.map((r) => ({
      id: r.id,
      title: r.title,
      url: null,
      description: r.description,
      tags: r.tags,
      libraryStatus: r.libraryStatus,
      progress: r.progress,
      thumbnailUrl: null,
      siteName: null,
      sourceType: null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
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

  console.log("\n📋 Search Tests\n");

  await test("Matches a Resource by title", async () => {
    installSearchStub([
      makeRow({ userId: "u1", title: "Docker Fundamentals", updatedAt: new Date("2026-02-01") }),
      makeRow({ userId: "u1", title: "React Guide" }),
    ]);
    const results = await searchResources("u1", "docker");
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].title, "Docker Fundamentals");
  });

  await test("Matches a Resource by description", async () => {
    installSearchStub([
      makeRow({ userId: "u1", title: "Postgres Notes", description: "Everything about indexing in postgres" }),
      makeRow({ userId: "u1", title: "Other" }),
    ]);
    const results = await searchResources("u1", "indexing");
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].title, "Postgres Notes");
  });

  await test("Matches a Resource by tag", async () => {
    installSearchStub([
      makeRow({ userId: "u1", title: "Networking", tags: ["devops", "linux"] }),
      makeRow({ userId: "u1", title: "Math", tags: ["algebra"] }),
    ]);
    const results = await searchResources("u1", "devops");
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].title, "Networking");
  });

  await test("Case-insensitive query", async () => {
    installSearchStub([
      makeRow({ userId: "u1", title: "Docker Fundamentals" }),
      makeRow({ userId: "u1", title: "Other" }),
    ]);
    const upper = await searchResources("u1", "DOCKER");
    const lower = await searchResources("u1", "docker");
    assert.strictEqual(upper.length, 1);
    assert.strictEqual(upper[0].id, lower[0].id);
  });

  await test("Whitespace is normalized (trim + collapse)", async () => {
    installSearchStub([makeRow({ userId: "u1", title: "Docker Fundamentals" })]);
    const results = await searchResources("u1", normalizeSearchTerm("  docker   fundamentals  "));
    assert.strictEqual(results.length, 1);
    assert.strictEqual(normalizeSearchTerm("  a   b  "), "a b");
  });

  await test("Empty / whitespace-only query is rejected by validation", () => {
    assert.ok(!searchQuerySchema.safeParse({ q: "" }).success);
    assert.ok(!searchQuerySchema.safeParse({ q: "   " }).success);
    assert.ok(!searchQuerySchema.safeParse({ q: undefined }).success);
    assert.ok(searchQuerySchema.safeParse({ q: "docker" }).success);
  });

  await test("Over-long query is rejected by validation", () => {
    assert.ok(!searchQuerySchema.safeParse({ q: "a".repeat(101) }).success);
    assert.ok(searchQuerySchema.safeParse({ q: "a".repeat(100) }).success);
  });

  await test("No matches returns an empty result", async () => {
    installSearchStub([makeRow({ userId: "u1", title: "Docker" })]);
    const results = await searchResources("u1", "kubernetes");
    assert.deepStrictEqual(results, []);
  });

  await test("Search is scoped to the authenticated user", async () => {
    installSearchStub([
      makeRow({ userId: "u1", title: "Docker Fundamentals" }),
      makeRow({ userId: "u2", title: "Docker Secrets" }),
      makeRow({ userId: "u1", title: "React Guide" }),
    ]);
    const forA = await searchResources("u1", "docker");
    const forB = await searchResources("u2", "docker");
    assert.strictEqual(forA.length, 1);
    assert.strictEqual(forA[0].title, "Docker Fundamentals");
    assert.strictEqual(forB.length, 1);
    assert.strictEqual(forB[0].title, "Docker Secrets");
    // User B never sees User A's Resources.
    assert.ok(!forB.some((r) => r.title === "Docker Fundamentals"));
  });

  await test("Ordering is deterministic: title > description > tag, then updatedAt", async () => {
    installSearchStub([
      makeRow({ userId: "u1", title: "Other", description: "docker in description", updatedAt: new Date("2026-01-01") }),
      makeRow({ userId: "u1", title: "Docker Title", updatedAt: new Date("2026-01-03") }),
      makeRow({ userId: "u1", title: "Third", tags: ["docker"], updatedAt: new Date("2026-01-02") }),
    ]);
    const results = await searchResources("u1", "docker");
    assert.deepStrictEqual(
      results.map((r) => r.title),
      ["Docker Title", "Other", "Third"],
    );
  });

  await test("All Library statuses are searchable", async () => {
    installSearchStub([
      makeRow({ userId: "u1", title: "Inbox Docker", libraryStatus: "INBOX" }),
      makeRow({ userId: "u1", title: "Saved Docker", libraryStatus: "SAVED" }),
      makeRow({ userId: "u1", title: "Archived Docker", libraryStatus: "ARCHIVED" }),
    ]);
    const results = await searchResources("u1", "docker");
    assert.strictEqual(results.length, 3);
    const statuses = results.map((r) => r.libraryStatus).sort();
    assert.deepStrictEqual(statuses, ["ARCHIVED", "INBOX", "SAVED"]);
  });

  await test("Search does not modify Resource metadata", async () => {
    const rows = [
      makeRow({ userId: "u1", title: "Docker", description: "note", tags: ["x"], libraryStatus: "SAVED", progress: "IN_PROGRESS" }),
    ];
    installSearchStub(rows);
    await searchResources("u1", "docker");
    assert.strictEqual(rows[0].title, "Docker");
    assert.strictEqual(rows[0].description, "note");
    assert.deepStrictEqual(rows[0].tags, ["x"]);
    assert.strictEqual(rows[0].libraryStatus, "SAVED");
    assert.strictEqual(rows[0].progress, "IN_PROGRESS");
  });

  // ── Summary ──
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
