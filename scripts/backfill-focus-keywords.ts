// Backfill av Wix "fokusord" (focus keyword) på ALLA befintliga V3-produkter.
//
// Fokusordet härleds deterministiskt ur produktnamnet (samma funktion som
// import-pipelinen använder) — INGA AI-anrop, $0. Lagras i Wix under
// seoData.settings.keywords[{ term, isMain:true, origin:"USER" }] via PATCH med
// fieldMask seoData.settings (verifierat fungerande fältväg 2026-06-01).
//
// Idempotent: produkter som redan har ett isMain-fokusord hoppas över. Att köra
// skriptet två gånger ändrar inget för redan satta produkter.
//
// Dry-run (visar bara vad som skulle sättas):
//   node --experimental-strip-types --env-file=.env.local scripts/backfill-focus-keywords.ts
// Skarpt (PATCH:ar produkterna):
//   node --experimental-strip-types --env-file=.env.local scripts/backfill-focus-keywords.ts --apply

import { deriveFocusKeyword } from "../lib/import/focus-keyword.ts";

const WIX_BASE = "https://www.wixapis.com";
const APPLY = process.argv.includes("--apply");
const SITE_ID = process.env.WIX_SITE_ID || "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";

function headers(): Record<string, string> {
  const t = process.env.WIX_API_TOKEN;
  if (!t) throw new Error("WIX_API_TOKEN saknas (kör med --env-file=.env.local).");
  return { Authorization: t, "wix-site-id": SITE_ID, "Content-Type": "application/json" };
}

interface Keyword { term?: string; isMain?: boolean; origin?: string }
interface ProductRow {
  id: string;
  name: string;
  revision: string;
  keywords: Keyword[];
}

/** Paginerar igenom alla produkter och plockar id/namn/revision/keywords. */
async function queryAllProducts(): Promise<ProductRow[]> {
  const all: ProductRow[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 50; page++) {
    const cursorPaging: Record<string, unknown> = { limit: 100 };
    if (cursor) cursorPaging.cursor = cursor;
    const res = await fetch(`${WIX_BASE}/stores/v3/products/query`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ query: { cursorPaging } }),
    });
    if (!res.ok) throw new Error(`query ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = (await res.json()) as {
      products?: Array<{
        id: string;
        name: string;
        revision: string;
        seoData?: { settings?: { keywords?: Keyword[] } };
      }>;
      pagingMetadata?: { cursors?: { next?: string }; hasNext?: boolean };
    };
    for (const p of data.products ?? []) {
      all.push({
        id: p.id,
        name: p.name,
        revision: p.revision,
        keywords: p.seoData?.settings?.keywords ?? [],
      });
    }
    cursor = data.pagingMetadata?.cursors?.next;
    if (!(data.products?.length ?? 0) || !cursor || data.pagingMetadata?.hasNext === false) break;
  }
  return all;
}

/** GET en produkt för färsk revision (vid stale-revision-retry). */
async function freshRevision(id: string): Promise<string> {
  const res = await fetch(`${WIX_BASE}/stores/v3/products/${id}`, { headers: headers() });
  if (!res.ok) throw new Error(`GET ${id} ${res.status}`);
  const data = (await res.json()) as { product?: { revision?: string } };
  return data.product?.revision ?? "";
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function patchOnce(id: string, body: unknown): Promise<Response> {
  return fetch(`${WIX_BASE}/stores/v3/products/${id}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(body),
  });
}

/** PATCH:ar fokusordet via fieldMask seoData.settings (bevarar befintliga tags). */
async function setFocusKeyword(id: string, revision: string, term: string): Promise<void> {
  const body = {
    product: {
      revision,
      seoData: { settings: { keywords: [{ term, isMain: true, origin: "USER" }] } },
    },
    fieldMask: { paths: ["seoData.settings"] },
  };
  let res = await patchOnce(id, body);
  // Wix throttlar (429) → exponentiell backoff, upp till 5 försök.
  for (let attempt = 0; res.status === 429 && attempt < 5; attempt++) {
    const wait = 1000 * 2 ** attempt;
    console.warn(`[fokusord]   429 throttlad på ${id.slice(0, 8)}, väntar ${wait}ms…`);
    await sleep(wait);
    res = await patchOnce(id, body);
  }
  // En stale-revision (samtidig ändring) → hämta färsk revision och försök igen.
  if (res.status === 400) {
    const txt = await res.text();
    if (/revision/i.test(txt)) {
      body.product.revision = await freshRevision(id);
      res = await patchOnce(id, body);
    } else {
      throw new Error(`PATCH ${id} 400: ${txt.slice(0, 300)}`);
    }
  }
  if (!res.ok) throw new Error(`PATCH ${id} ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

async function main(): Promise<void> {
  console.log(`[fokusord] Läge: ${APPLY ? "SKARPT (PATCH)" : "DRY-RUN (inget skrivs)"}  site=${SITE_ID}`);
  const products = await queryAllProducts();
  console.log(`[fokusord] ${products.length} produkter hämtade.\n`);

  let updated = 0;
  let skipped = 0;
  let empty = 0;
  const samples: string[] = [];

  for (const p of products) {
    const existing = p.keywords.find((k) => k.isMain && k.term?.trim());
    if (existing) {
      skipped++;
      continue;
    }
    const term = deriveFocusKeyword(p.name);
    if (!term) {
      empty++;
      console.warn(`[fokusord] TOM härledning, hoppar över: "${p.name}" (${p.id})`);
      continue;
    }
    if (samples.length < 5) samples.push(`  • "${p.name}"\n      gammalt: (inget) → nytt: "${term}"`);
    if (APPLY) {
      try {
        await setFocusKeyword(p.id, p.revision, term);
        updated++;
        await sleep(120); // håll oss under Wix throttle-gränsen
      } catch (err) {
        console.error(`[fokusord] ✗ ${p.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      updated++; // "skulle uppdateras"
    }
  }

  console.log(`\n[fokusord] 5 exempel (gammalt → nytt):`);
  console.log(samples.join("\n") || "  (inga — alla hade redan fokusord)");
  console.log(
    `\n[fokusord] KLART. ${updated} ${APPLY ? "uppdaterade" : "skulle uppdateras"}, ` +
      `${skipped} hoppade över (hade redan fokusord), ${empty} tom härledning.`,
  );
  if (!APPLY && updated > 0) console.log(`[fokusord] Kör om med --apply för att skriva.`);
}

main().catch((err) => {
  console.error(`[fokusord] FEL: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
