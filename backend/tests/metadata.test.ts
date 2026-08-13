/**
 * Resource metadata enrichment tests (Micro-Slice B).
 *
 * Covers the deterministic extractor (extractMetadata / detectSourceType) with
 * no network, plus the service-level create/update integration with a stubbed
 * fetcher and in-memory Prisma.
 *
 * Run with: npm run test:metadata
 */
import assert from "node:assert";

import {
  extractMetadata,
  detectSourceType,
  type ResourceMetadata,
} from "../src/services/metadataService";

/* ── Pure extractor tests (no network) ────────────────────────── */

const OG_HTML = `
<html><head>
  <title>Raw Title</title>
  <meta property="og:title" content="OpenGraph Title" />
  <meta property="og:description" content="OG desc" />
  <meta property="og:image" content="https://cdn.example.com/img.jpg" />
  <meta property="og:site_name" content="Example Site" />
</head></html>`;

const TWITTER_HTML = `
<html><head>
  <title>Fallback Title</title>
  <meta name="twitter:title" content="Twitter Title" />
  <meta name="twitter:description" content="Twitter desc" />
  <meta name="twitter:image" content="https://cdn.example.com/tw.jpg" />
</head></html>`;

const TITLE_ONLY_HTML = `<html><head><title>   Only Title   </title></head></html>`;

/* ── Service-level tests ──────────────────────────────────────── */

import { prisma } from "../src/config/database";
import { Prisma } from "@prisma/client";
import { createResource, updateResource } from "../src/services/resourceService";
import * as metadataService from "../src/services/metadataService";

type StoredRow = Record<string, unknown> & {
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
  createdAt: Date;
  updatedAt: Date;
};

let _seq = 0;
function row(data: Partial<StoredRow>): StoredRow {
  const now = new Date();
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
    createdAt: now,
    updatedAt: now,
    ...data,
  };
}

function p2025(): never {
  throw new Prisma.PrismaClientKnownRequestError("Record not found", { code: "P2025", clientVersion: "7.8.0" });
}

/** In-memory Prisma stub with a rows store. */
function installStub() {
  const rows: StoredRow[] = [];
  const p = prisma as unknown as Record<string, unknown>;
  p.resource = {
    findFirst: async ({ where }: { where?: { id?: string; userId?: string } }) => {
      const r = rows.find((x) => (where?.id ? x.id === where.id : true) && (where?.userId ? x.userId === where.userId : true));
      return r ?? null;
    },
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const r = row(data);
      rows.push(r);
      return r;
    },
    update: async ({ where, data }: { where: { id: string; userId: string }; data: Record<string, unknown> }) => {
      const idx = rows.findIndex((x) => x.id === where.id && x.userId === where.userId);
      if (idx === -1) p2025();
      const merged = { ...rows[idx], ...data, updatedAt: new Date() };
      rows[idx] = merged;
      return merged;
    },
  };
  return rows;
}

/** Stub fetchPageMetadata to return a fixed outcome (or fail). */
function stubFetcher(outcome: { ok: boolean; metadata: ResourceMetadata } | "throw") {
  const orig = metadataService.fetchPageMetadata;
  (metadataService as { fetchPageMetadata: unknown }).fetchPageMetadata = async () => {
    if (outcome === "throw") throw new Error("network down");
    return outcome;
  };
  return () => {
    (metadataService as { fetchPageMetadata: unknown }).fetchPageMetadata = orig;
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

  console.log("\n📋 Resource Metadata Tests\n");

  /* ── Extractor ─────────────────────────────────────────────── */
  await test("Extracts og:title, og:description, og:image, og:site_name", () => {
    const m = extractMetadata(OG_HTML, "https://example.com/article/1");
    assert.strictEqual(m.title, "OpenGraph Title");
    assert.strictEqual(m.description, "OG desc");
    assert.strictEqual(m.thumbnailUrl, "https://cdn.example.com/img.jpg");
    assert.strictEqual(m.siteName, "Example Site");
  });

  await test("Falls back to twitter: fields when og: is absent", () => {
    const m = extractMetadata(TWITTER_HTML, "https://example.com/x");
    assert.strictEqual(m.title, "Twitter Title");
    assert.strictEqual(m.description, "Twitter desc");
    assert.strictEqual(m.thumbnailUrl, "https://cdn.example.com/tw.jpg");
  });

  await test("Falls back to <title> and hostname siteName", () => {
    const m = extractMetadata(TITLE_ONLY_HTML, "https://www.example.com/post/1");
    assert.strictEqual(m.title, "Only Title");
    assert.strictEqual(m.siteName, "example.com");
    assert.strictEqual(m.thumbnailUrl, undefined);
  });

  /* ── Source type detection (deterministic) ─────────────────── */
  await test("detectSourceType: youtube → VIDEO", () => {
    assert.strictEqual(detectSourceType("https://youtube.com/watch?v=abc"), "VIDEO");
    assert.strictEqual(detectSourceType("https://youtu.be/abc"), "VIDEO");
  });

  await test("detectSourceType: .pdf → DOCUMENT", () => {
    assert.strictEqual(detectSourceType("https://example.com/manual.pdf"), "DOCUMENT");
  });

  await test("detectSourceType: article/blog/post/news → ARTICLE", () => {
    assert.strictEqual(detectSourceType("https://example.com/blog/hello"), "ARTICLE");
    assert.strictEqual(detectSourceType("https://example.com/articles/1"), "ARTICLE");
  });

  await test("detectSourceType: plain domain → WEBSITE, unknown → OTHER", () => {
    assert.strictEqual(detectSourceType("https://example.com"), "WEBSITE");
    assert.strictEqual(detectSourceType("https://example.com/weird-path"), "WEBSITE");
  });

  /* ── Service: create with successful metadata ──────────────── */
  await test("Create with URL enriches metadata (og:image + site name)", async () => {
    const rows = installStub();
    const restore = stubFetcher({
      ok: true,
      metadata: {
        title: "OG Title",
        description: "OG desc",
        thumbnailUrl: "https://cdn.example.com/img.jpg",
        siteName: "Example Site",
        sourceType: "ARTICLE",
      },
    });
    try {
      const r = await createResource("user-1", { title: "User Title", url: "https://example.com/a", description: "User desc" });
      assert.strictEqual(r.thumbnailUrl, "https://cdn.example.com/img.jpg");
      assert.strictEqual(r.siteName, "Example Site");
      assert.strictEqual(r.sourceType, "ARTICLE");
      // User title/description always win over fetched.
      assert.strictEqual(r.title, "User Title");
      assert.strictEqual(r.description, "User desc");
    } finally {
      restore();
    }
  });

  await test("Create fills title from og:title when user left it empty", async () => {
    const rows = installStub();
    const restore = stubFetcher({ ok: true, metadata: { title: "OG Title", sourceType: "WEBSITE" } });
    try {
      const r = await createResource("user-1", { title: "", url: "https://example.com/a" });
      assert.strictEqual(r.title, "OG Title");
      assert.strictEqual(r.sourceType, "WEBSITE");
    } finally {
      restore();
    }
  });

  await test("Metadata failure still creates the Resource (network error)", async () => {
    const rows = installStub();
    const restore = stubFetcher("throw");
    try {
      const r = await createResource("user-1", { title: "Still Saved", url: "https://example.com/a" });
      assert.strictEqual(r.title, "Still Saved");
      assert.strictEqual(r.thumbnailUrl, null);
      assert.strictEqual(r.siteName, null);
      assert.strictEqual(r.sourceType, null);
      assert.strictEqual(rows.length, 1);
    } finally {
      restore();
    }
  });

  await test("Metadata failure (ok:false) still creates the Resource", async () => {
    const rows = installStub();
    const restore = stubFetcher({ ok: false, metadata: {} });
    try {
      const r = await createResource("user-1", { title: "No Meta", url: "https://example.com/a" });
      assert.strictEqual(r.title, "No Meta");
      assert.strictEqual(rows.length, 1);
    } finally {
      restore();
    }
  });

  /* ── Service: update ───────────────────────────────────────── */
  await test("URL change re-enriches metadata", async () => {
    const rows = installStub();
    rows.push(row({ id: "r1", userId: "user-1", title: "Old", url: "https://old.com", description: null, tags: [], libraryStatus: "SAVED", progress: "NOT_STARTED", thumbnailUrl: null, siteName: null, sourceType: null }));
    const restore = stubFetcher({
      ok: true,
      metadata: { thumbnailUrl: "https://cdn.example.com/new.jpg", siteName: "New Site", sourceType: "ARTICLE", title: "New Meta Title" },
    });
    try {
      const r = await updateResource("r1", "user-1", { url: "https://new.com" });
      assert.strictEqual(r.thumbnailUrl, "https://cdn.example.com/new.jpg");
      assert.strictEqual(r.siteName, "New Site");
      assert.strictEqual(r.sourceType, "ARTICLE");
      // No user title supplied → falls back to fetched title.
      assert.strictEqual(r.title, "New Meta Title");
    } finally {
      restore();
    }
  });

  await test("Title-only update does NOT refetch metadata", async () => {
    const rows = installStub();
    rows.push(row({ id: "r1", userId: "user-1", title: "Old", url: "https://old.com", description: "d", tags: [], libraryStatus: "SAVED", progress: "NOT_STARTED", thumbnailUrl: null, siteName: null, sourceType: null }));
    let fetched = 0;
    const orig = metadataService.fetchPageMetadata;
    (metadataService as { fetchPageMetadata: unknown }).fetchPageMetadata = async () => {
      fetched++;
      return { ok: true, metadata: { title: "Should Not Apply" } };
    };
    try {
      const r = await updateResource("r1", "user-1", { title: "Renamed" });
      assert.strictEqual(r.title, "Renamed");
      assert.strictEqual(fetched, 0, "metadata must not be fetched on title-only update");
    } finally {
      (metadataService as { fetchPageMetadata: unknown }).fetchPageMetadata = orig;
    }
  });

  /* ── Ownership ─────────────────────────────────────────────── */
  await test("Cross-user update still rejected (ownership enforced)", async () => {
    const rows = installStub();
    rows.push(row({ id: "r1", userId: "user-2", title: "theirs", url: "https://x.com", description: null, tags: [], libraryStatus: "SAVED", progress: "NOT_STARTED", thumbnailUrl: null, siteName: null, sourceType: null }));
    let thrown: unknown = null;
    try {
      await updateResource("r1", "user-1", { title: "hack" });
    } catch (err) {
      thrown = err;
    }
    assert.ok(thrown instanceof Error);
    assert.ok((thrown as Error).message.includes("not found"));
    assert.strictEqual(rows[0].title, "theirs");
  });

  // ── Summary ──
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
