// GET/POST /api/cron/order-backfill
//
// Räddningsnätet under orderwebhooken. `/api/wix-order` är ENDA vägen in i
// pipelinen — `/admin` läser bara `store.listTasks()` — och Wix ger upp efter
// ett fåtal retries. Misslyckas den skrivningen är ordern borta för oss medan
// kunden har betalat.
//
// ☠️ Det hände 2026-08-31. Wix Datas radtak var nått, `createTaskIfAbsent`
// kastade `WDE0195`, webhooken svarade 500 tre gånger och gav upp. Order 10024
// var betald och osynlig. Samma tak stoppade samtidigt varje audit-skrivning i
// ett dygn utan att det syntes någonstans.
//
// Vakten SÅG det (`buildGuardFindings.missingTasks`) men agerade inte, och den
// kör dessutom bara en gång per dygn. Den här rutten gör åtgärden, ofta.
//
// SKARP SOM DEFAULT, tvärtemot husets övriga cron-rutter. Skälet: de andra
// SKRIVER något nytt till kunden (priser, texter, lager) och ska därför be om
// lov. Den här ÅTERSTÄLLER en order kunden redan betalat för, och att avstå är
// det farliga utfallet. `?dryRun=1` finns för den som vill titta först.
//
// Ofarlig att köra ofta: `createTaskIfAbsent` skriver aldrig över en befintlig
// task, så en order som redan finns kostar noll skrivningar.
//
// Query:
//   ?dryRun=1            visa vad som skulle skapas, skriv ingenting
//   ?lookbackDays=14     hur långt bak i tiden vi letar
//   ?order=10024,10025   bara dessa ordernummer

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getStore } from "@/lib/store/factory";
import { fetchOrders } from "@/lib/wix/orders";
import type { WixOrder } from "@/lib/orders/types";
import { DEFAULT_LOOKBACK_DAYS, runOrderBackfill } from "@/lib/orders/backfill";

export const runtime = "nodejs";
export const maxDuration = 300;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

async function handle(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1"
    || req.nextUrl.searchParams.get("dryRun") === "true";
  const lookbackRaw = Number(req.nextUrl.searchParams.get("lookbackDays"));
  const lookbackDays = Number.isFinite(lookbackRaw) && lookbackRaw > 0
    ? Math.trunc(lookbackRaw)
    : DEFAULT_LOOKBACK_DAYS;
  const onlyOrderNumbers = (req.nextUrl.searchParams.get("order") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const store = getStore();
    const summary = await runOrderBackfill(
      {
        dryRun,
        lookbackDays,
        onlyOrderNumbers: onlyOrderNumbers.length ? onlyOrderNumbers : undefined,
      },
      {
        // `lib/wix/orders.ts` deklarerar en SMALARE projektion än vad Orders-API:t
        // faktiskt returnerar — den utelämnar adresser och `descriptionLines`,
        // som `deriveTasks` behöver för leveransadress och variantval. Fälten
        // finns i svaret (verifierat mot skarpa API:t 2026-08-31); det är bara
        // typen som är avkortad. Därför den här överlämningen.
        listOrders: async (sinceIso) =>
          (await fetchOrders(sinceIso, { maxPages: 5 })) as unknown as WixOrder[],
        listTasks: () => store.listTasks(),
        createTaskIfAbsent: (task) => store.createTaskIfAbsent(task),
      },
    );

    // Bara när något faktiskt räddades — en tom körning var fjärde timme ska
    // inte fylla loggen (det var just loggvolym som orsakade incidenten).
    if (!dryRun && (summary.created > 0 || summary.failed > 0)) {
      await audit(
        "order-backfill",
        "cron",
        `${summary.created} tasks återskapade för order ${summary.recovered.join(", ") || "—"}`
          + `, ${summary.failed} fel av ${summary.missing} saknade`,
      );
    }

    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Serialisera felet till svaret. En naken 500 gjorde aliexpress-sync
    // omöjlig att felsöka i 57 timmar (audit 2026-08-28).
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
