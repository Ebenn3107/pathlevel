/**
 * Deterministic page-metadata extraction for URL-based Resources (Micro-Slice B).
 *
 * NOT an AI feature. Uses standard page metadata (OpenGraph / Twitter cards /
 * <title>) with deterministic fallbacks, and infers a source type from URL
 * shape. Every failure is swallowed — metadata enrichment must never break
 * Resource creation or updates.
 */

import { ResourceSourceType } from "@prisma/client";

/** Metadata extracted for a URL (all optional). */
export interface ResourceMetadata {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  siteName?: string;
  sourceType?: ResourceSourceType;
}

/* ── SSRF / network safety ────────────────────────────────────── */

const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2 MB
const FETCH_TIMEOUT_MS = 4000;
const MAX_REDIRECTS = 3;

/** Reject non-HTTP(S) schemes and empty hosts. */
function isSafeHttpUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (!url.hostname) return false;
  return true;
}

/**
 * Block obvious private/loopback addresses (practical SSRF guard). DNS rebinding
 * is out of scope for this personal tool; this blocks the common literal cases.
 */
function isPrivateAddress(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost") return true;
  if (lower.endsWith(".localhost")) return true;
  if (/^127\.\d+\.\d+\.\d+$/.test(lower)) return true;
  if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return true;
  if (/^10\.\d+\.\d+\.\d+$/.test(lower)) return true;
  if (/^192\.168\.\d+\.\d+$/.test(lower)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(lower)) return true;
  if (lower.endsWith(".internal") || lower.endsWith(".local")) return true;
  return false;
}

/** Deterministic source-type rules (documented). */
export function detectSourceType(raw: string): ResourceSourceType {
  const url = raw.toLowerCase();
  if (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("vimeo.com") || url.includes("twitch.tv")) {
    return "VIDEO";
  }
  if (url.endsWith(".pdf") || /\.pdf(\?|#|$)/.test(url)) return "DOCUMENT";
  // Common article-hosting patterns → ARTICLE
  if (/(\/article[s]?\/|\/blog\/|\/post[s]?\/|\/news\/)/.test(url)) return "ARTICLE";
  // A recognizable bare webpage → WEBSITE
  if (/^https?:\/\/[^/]+\/?$/.test(url) || !url.includes(" ")) return "WEBSITE";
  return "OTHER";
}

/* ── HTML parsing (deterministic, lightweight) ────────────────── */

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'");
}

/** Extract a meta[property|name] content value by attribute key. */
function metaContent(html: string, attr: "property" | "name", key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+${attr}\\s*=\\s*["']${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`,
    "i",
  );
  const m = html.match(re);
  if (!m) return null;
  const content = m[0].match(/content\s*=\s*["']([^"']*)/i);
  return content ? decodeEntities(content[1]).trim() : null;
}

/** Extract <title>...</title>. */
function htmlTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  const inner = m[1].replace(/<[^>]+>/g, "").trim();
  return inner ? decodeEntities(inner).trim() : null;
}

/* ── Fetch + extract ──────────────────────────────────────────── */

export interface FetchOutcome {
  ok: boolean;
  metadata: ResourceMetadata;
}

/**
 * Fetch a page and extract deterministic metadata. Never throws on network or
 * parse errors — returns `{ ok: false, metadata: {} }` on failure.
 */
export async function fetchPageMetadata(rawUrl: string): Promise<FetchOutcome> {
  if (!isSafeHttpUrl(rawUrl)) return { ok: false, metadata: {} };

  const url = new URL(rawUrl.trim());
  if (isPrivateAddress(url.hostname)) return { ok: false, metadata: {} };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let current = url;
    const redirects: string[] = [];
    for (let i = 0; i <= MAX_REDIRECTS; i++) {
      const res = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "PathLevel/1.0 (+https://pathlevel.app)" },
      });

      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        const next = new URL(res.headers.get("location")!, current);
        if (!isSafeHttpUrl(next.href) || isPrivateAddress(next.hostname)) {
          clearTimeout(timer);
          return { ok: false, metadata: {} };
        }
        redirects.push(next.href);
        if (redirects.length > MAX_REDIRECTS) {
          clearTimeout(timer);
          return { ok: false, metadata: {} };
        }
        current = next;
        continue;
      }

      if (!res.ok || !res.headers.get("content-type")?.includes("text/html")) {
        clearTimeout(timer);
        return { ok: false, metadata: {} };
      }

      const buffer = await res.arrayBuffer();
      clearTimeout(timer);
      const text = Buffer.from(buffer.slice(0, MAX_BODY_BYTES)).toString("utf8");

      return { ok: true, metadata: extractMetadata(text, current.href) };
    }
    clearTimeout(timer);
    return { ok: false, metadata: {} };
  } catch {
    return { ok: false, metadata: {} };
  }
}

/** Extract the supported metadata fields from an HTML document. */
export function extractMetadata(html: string, pageUrl: string): ResourceMetadata {
  const hostname = (() => {
    try {
      return new URL(pageUrl).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  })();

  return {
    title:
      metaContent(html, "property", "og:title") ??
      metaContent(html, "name", "twitter:title") ??
      htmlTitle(html) ??
      undefined,
    description:
      metaContent(html, "property", "og:description") ??
      metaContent(html, "name", "twitter:description") ??
      undefined,
    thumbnailUrl:
      metaContent(html, "property", "og:image") ??
      metaContent(html, "name", "twitter:image") ??
      undefined,
    siteName: metaContent(html, "property", "og:site_name") ?? hostname ?? undefined,
    sourceType: detectSourceType(pageUrl),
  };
}
