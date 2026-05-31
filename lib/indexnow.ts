// lib/indexnow.ts
// IndexNow — the free, instant URL-submission protocol (Bing, Yandex, Seznam,
// Naver and others share one endpoint; Google does NOT participate but Bing does,
// which is the point). https://www.indexnow.org/documentation
//
// We POST a host + key + urlList to api.indexnow.org. Ownership is proven by a
// static key file served at https://www.fyndplats.se/<KEY>.txt (see
// public/<KEY>.txt). Cost: $0.
//
// Used by:
//   • app/api/cron/indexnow-ping        (weekly sweep of the whole sitemap)
//   • app/api/admin/seo-ping            (Leonard's manual "submit now" button)
//   • app/api/wix-webhook (product.created/updated → ping that product's URL)
import { SITE, getSiteUrlStrings } from "./site-urls";

// Static IndexNow key. NOT a secret — it's published at /<KEY>.txt for the search
// engines to read back. Changing it means renaming public/<KEY>.txt to match.
export const INDEXNOW_KEY = "a3f9c2e7b6d8419fae20c5d731b8e4f6";

export const INDEXNOW_HOST = new URL(SITE).host; // "www.fyndplats.se"
export const INDEXNOW_KEY_LOCATION = `${SITE}/${INDEXNOW_KEY}.txt`;
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

// IndexNow accepts at most 10 000 URLs per request.
const MAX_URLS_PER_REQUEST = 10000;

export type IndexNowResult = {
  ok: boolean;
  submitted: number;
  batches: { status: number; count: number; ok: boolean }[];
  error?: string;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Submit a list of absolute URLs to IndexNow. No-ops (ok:true, submitted:0) on
 * an empty list. Never throws — network failures are captured in the result so
 * callers (cron / webhook) can log without crashing the request.
 */
export async function pingIndexNow(urls: string[]): Promise<IndexNowResult> {
  const unique = [...new Set(urls.filter((u) => typeof u === "string" && u.startsWith("http")))];
  if (unique.length === 0) return { ok: true, submitted: 0, batches: [] };

  const batches: IndexNowResult["batches"] = [];
  try {
    for (const part of chunk(unique, MAX_URLS_PER_REQUEST)) {
      const res = await fetch(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host: INDEXNOW_HOST,
          key: INDEXNOW_KEY,
          keyLocation: INDEXNOW_KEY_LOCATION,
          urlList: part,
        }),
      });
      // IndexNow returns 200 (accepted) or 202 (accepted, pending) on success.
      const ok = res.status === 200 || res.status === 202;
      batches.push({ status: res.status, count: part.length, ok });
    }
    const allOk = batches.every((b) => b.ok);
    return { ok: allOk, submitted: unique.length, batches };
  } catch (e) {
    return {
      ok: false,
      submitted: 0,
      batches,
      error: (e as Error).message,
    };
  }
}

/** Ping every indexable URL on the site (the full sitemap). Used by the weekly cron. */
export async function pingAllSiteUrls(): Promise<IndexNowResult> {
  const urls = await getSiteUrlStrings();
  return pingIndexNow(urls);
}

/** Convenience for the webhook: ping a single product URL by slug. */
export async function pingProductSlug(slug: string): Promise<IndexNowResult> {
  if (!slug) return { ok: true, submitted: 0, batches: [] };
  return pingIndexNow([`${SITE}/produkt/${slug}`]);
}

/** Convenience for the webhook: ping a single blog post URL by slug. */
export async function pingBlogSlug(slug: string): Promise<IndexNowResult> {
  if (!slug) return { ok: true, submitted: 0, batches: [] };
  return pingIndexNow([`${SITE}/blogg/${slug}`, `${SITE}/blogg`]);
}
