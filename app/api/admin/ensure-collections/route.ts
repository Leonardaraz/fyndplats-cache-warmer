// GET/POST /api/admin/ensure-collections?token=YYY
//
// Skapar alla Wix Data-kollektioner som appen skriver till, om de saknas.
// Idempotent (hoppar över befintliga). Körs en gång efter att STORE_BACKEND
// satts till "wix-data" — annars 500:ar imports/sync när de försöker skriva
// till en kollektion som inte finns.
//
// Servern har WIX_API_TOKEN + WIX_SITE_ID i env, så detta ersätter att köra
// scripts/ensure-*.mjs lokalt. Token-skyddad via EXTENSION_API_TOKEN i query
// (så den kan triggas utan att kunna sätta headers).
//
// Wix Data är schematolerant — extra/nästlade fält lagras även om de inte
// deklareras. Vi skapar därför varje kollektion med ett minimalt fält; appens
// faktiska fält lagras ändå.

import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Default-namnen (env WIX_DATA_COL_* kan override:a, men standard är dessa).
const COLLECTIONS = [
  "FyndplatsMappings",
  "FyndplatsWebhookEvents",
  "FyndplatsTasks",
  "FyndplatsAudit",
  "FyndplatsImportCosts",
  "FyndplatsProductHashes",
  "FyndplatsCompetitorPriceCache",
  "FyndplatsClaudeCache",
  "FyndplatsAnthropicSpend",
  "FyndplatsLlmStats",
  "FyndplatsVariantTranslations",
  "FyndplatsAlternativeCache",
  "FyndplatsRestockSubscribers",
  "FyndplatsRestockLog",
  "FyndplatsImportedReviews",
  "FyndplatsTranslationUsage",
  "FyndplatsBulkImportJobs",
  "FyndplatsBulkImportItems",
  "FyndplatsPricingConfig",
  "FyndplatsSuppliers",
  "FyndplatsDiscoverWatchlist",
  "FyndplatsAliExpressTokens",
  "FyndplatsAliExpressSyncState",
  "FyndplatsAliExpressSyncLog",
  "FyndplatsAliExpressSyncAlerts",
];

type Result = { id: string; status: string; detail?: string };

async function ensure(id: string, headers: Record<string, string>): Promise<Result> {
  const getRes = await fetch(
    `https://www.wixapis.com/wix-data/v2/collections/${encodeURIComponent(id)}`,
    { headers },
  );
  if (getRes.status === 200) return { id, status: "exists" };
  const res = await fetch("https://www.wixapis.com/wix-data/v2/collections", {
    method: "POST",
    headers,
    body: JSON.stringify({
      collection: {
        id,
        displayName: id,
        fields: [{ key: "ref", displayName: "Ref", type: "TEXT" }],
      },
    }),
  });
  if (res.status >= 200 && res.status < 300) return { id, status: "created" };
  return { id, status: `error ${res.status}`, detail: (await res.text()).slice(0, 200) };
}

async function handle(req: NextRequest): Promise<NextResponse> {
  const provided = req.nextUrl.searchParams.get("token");
  const expected = process.env.EXTENSION_API_TOKEN;
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  const token = process.env.WIX_API_TOKEN;
  const site = process.env.WIX_SITE_ID;
  if (!token) {
    return NextResponse.json({ error: "WIX_API_TOKEN saknas i env" }, { status: 500 });
  }
  const headers: Record<string, string> = {
    Authorization: token,
    "Content-Type": "application/json",
    ...(site ? { "wix-site-id": site } : {}),
  };
  // E1-härdning: union av default-namnen OCH ev. WIX_DATA_COL_*-override:r, så vi
  // skapar exakt de namn koden faktiskt slår upp — oavsett om du satt egna.
  const names = new Set<string>(COLLECTIONS);
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith("WIX_DATA_COL_") && typeof v === "string" && v.trim()) {
      names.add(v.trim());
    }
  }
  const results: Result[] = [];
  for (const id of names) {
    try {
      results.push(await ensure(id, headers));
    } catch (e) {
      results.push({ id, status: "exception", detail: String(e).slice(0, 200) });
    }
  }
  const created = results.filter((r) => r.status === "created").length;
  const exists = results.filter((r) => r.status === "exists").length;
  const failed = results.filter((r) => r.status.startsWith("error") || r.status === "exception");
  return NextResponse.json({
    ok: failed.length === 0,
    summary: { created, exists, failed: failed.length, total: results.length },
    results,
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return handle(req);
}
export async function GET(req: NextRequest): Promise<NextResponse> {
  return handle(req);
}
