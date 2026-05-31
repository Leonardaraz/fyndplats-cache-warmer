// POST /api/aliexpress/discover
//
// Utökad sök-endpoint för /admin/discover. Skiljer sig från
// /api/aliexpress/search genom att stödja sortBy, max-pris, kategori,
// paginering samt server-side EU-warehouse-filterring.
//
// Använder samma underliggande AliExpress-metod: aliexpress.ds.text.search
// (det är den enda search-metoden vår app-grupp har permission på enligt
// existerande klient — om vi senare aktiverar affiliate.product.query
// får vi även orders/rating-fält och fler filter).

import { type NextRequest, NextResponse } from "next/server";
import {
  searchAliExpressByText,
  type AliExpressSearchOptions,
  type AliExpressSortBy,
} from "@/lib/aliexpress/client";
import { isEuCountry } from "@/lib/aliexpress/eu-countries";
import { isAuthorized } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 30;

// Rate-limit-skydd: AliExpress tål ~1 req / 2 s — vi gör en enkel in-memory
// throttle per process. (Inte krypteringsstark; bara skyddar mot dubbel-klick.)
const lastCall = { at: 0 };
const MIN_INTERVAL_MS = 2000;

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

  const options: AliExpressSearchOptions = {
    sortBy: body.sortBy,
    page: body.page,
    pageSize: body.pageSize ?? 20,
    maxPriceUsd: typeof body.maxPriceUsd === "number" ? body.maxPriceUsd : undefined,
    categoryId: body.categoryId,
  };

  try {
    const all = await searchAliExpressByText(query, options);
    // EU-only filter (default true). UNKNOWN släpps igenom — sajt-detection
    // sker när Leonard klickar Importera (då har vi shipFrom från detail API).
    const euOnly = body.euOnly !== false;
    const filtered = euOnly
      ? all.filter((p) => {
          const codes = p.shipsFromCountries ?? [];
          if (codes.length === 0) return true; // okänd — visa, märk i UI
          return codes.some((c) => isEuCountry(c));
        })
      : all;

    return NextResponse.json({
      ok: true,
      results: filtered,
      total: filtered.length,
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
