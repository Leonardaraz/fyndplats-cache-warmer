// POST /api/aliexpress/discover
//
// Utökad sök-endpoint för /admin/discover och tilläggets "Alla EU"-panel.
// Skiljer sig från /api/aliexpress/search genom att stödja sortBy, max-pris,
// kategori, paginering samt server-side EU-warehouse-filterring.
//
// Använder samma underliggande AliExpress-metod: aliexpress.ds.text.search
// (det är den enda search-metoden vår app-grupp har permission på).
//
// VIKTIGT om EU-filtret: ds.text.search ger ingen ship-from per träff, så när
// euOnly=true BERIKAR vi varje träff med riktig ship-from via detalj-API:t
// (getProduct) och tar bara med bekräftade EU-lager (fail-closed). Se
// lib/aliexpress/eu-discover.ts. Det kostar ett detalj-anrop per okänd träff —
// dämpat med cache + concurrency-gräns (env-tunbart nedan).

import { type NextRequest, NextResponse } from "next/server";
import {
  getProduct,
  searchAliExpressByText,
  type AliExpressSearchOptions,
  type AliExpressSortBy,
} from "@/lib/aliexpress/client";
import { filterEuWarehouses } from "@/lib/aliexpress/eu-discover";
import { isAuthorized } from "@/lib/auth";

export const runtime = "nodejs";
// EU-läget gör flera detalj-anrop (berikning) per sida → tillåt längre körtid.
export const maxDuration = 60;

// Rate-limit-skydd: AliExpress tål ~1 req / 2 s — enkel in-memory-throttle per
// process. (Inte krypteringsstark; skyddar mot dubbel-klick.)
const lastCall = { at: 0 };
const MIN_INTERVAL_MS = 2000;

function envInt(name: string, def: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : def;
}

interface DiscoverBody {
  query?: string;
  sortBy?: AliExpressSortBy;
  page?: number;
  pageSize?: number;
  maxPriceUsd?: number;
  categoryId?: string;
  /** Default true — filtrera bort icke-EU-warehouse på resultatlistan. */
  euOnly?: boolean;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  let body: DiscoverBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  const query = (body.query ?? "").trim();
  if (!query) {
    return NextResponse.json({ error: "Tom sökterm" }, { status: 400 });
  }

  // Rate-limit per process. Returnera 429 så UI:t kan disable knappen.
  const now = Date.now();
  if (now - lastCall.at < MIN_INTERVAL_MS) {
    const retryAfter = Math.ceil((MIN_INTERVAL_MS - (now - lastCall.at)) / 1000);
    return NextResponse.json(
      { error: "För snabba sökningar — vänta " + retryAfter + " s." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }
  lastCall.at = now;

  const euOnly = body.euOnly !== false;
  const page = Math.max(1, Math.trunc(Number(body.page)) || 1);
  // I EU-läget berikar vi varje träff → använd en (env-tunbar) sidstorlek så vi
  // får tillräckligt med kandidater per sida (EU-lager är en minoritet av träffarna).
  const pageSize = euOnly
    ? Math.min(50, envInt("DISCOVER_EU_PAGE_SIZE", 30))
    : Math.min(50, body.pageSize ?? 20);

  const options: AliExpressSearchOptions = {
    sortBy: body.sortBy,
    page,
    pageSize,
    maxPriceUsd: typeof body.maxPriceUsd === "number" ? body.maxPriceUsd : undefined,
    categoryId: body.categoryId,
  };

  try {
    const all = await searchAliExpressByText(query, options);
    // Full sida tillbaka ⇒ sannolikt fler sidor (för pagineringen i UI:t).
    const hasMore = all.length >= pageSize;

    const results = euOnly
      ? await filterEuWarehouses(all, {
          getShipFrom: async (pid) => (await getProduct(pid)).shipsFromCountries ?? [],
          concurrency: envInt("DISCOVER_EU_CONCURRENCY", 4),
          cacheTtlMs: envInt("DISCOVER_EU_CACHE_TTL_MS", 24 * 60 * 60 * 1000),
        })
      : all;

    return NextResponse.json({
      ok: true,
      results,
      total: results.length,
      scanned: all.length,
      page,
      nextPage: page + 1,
      hasMore,
      euFilterApplied: euOnly,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sökfel";
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint:
          "Om felet är 'method not exist' eller 'no permission' har appen inte sök-permission. "
          + "Använd paste-URL-fältet i tilläggspopupen istället.",
      },
      { status: 502 },
    );
  }
}
