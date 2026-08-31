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
import { buildStuckOrdersEmail, sendEmail } from "@/lib/email/resend";

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
        // `strict` är inte pynt: utan den svarar fetchOrders med en TOM lista
        // vid 403/404 (saknad scope), och då drar återhämtningen slutsatsen att
        // inga ordrar saknas. Nätet hade slutat fungera utan att någon kunde se
        // det — samma klass av fel som det nätet finns för att fånga.
        listOrders: async (sinceIso) =>
          (await fetchOrders(sinceIso, { maxPages: 5, strict: true })) as unknown as WixOrder[],
        listTasks: () => store.listTasks(),
        createTaskIfAbsent: (task) => store.createTaskIfAbsent(task),
      },
    );

    // ☠️ SKRIV ALLTID TILL KONSOLEN NÄR NÅGOT SAKNAS. Audit-raden nedan går via
    // Wix och kan därför INTE skrivas i exakt det läge nätet finns för — ett
    // fullt radtak. Uppmätt 2026-08-31 14:25: rutten svarade 200 utan en enda
    // loggrad medan order 10024 fortfarande saknade sin task, eftersom felet
    // fångas per order och audit-skrivningen föll på samma tak.
    //
    // Konsolen kräver ingen databas. Ett nät som kan misslyckas tyst är inget
    // nät — det är den bugg nätet byggdes för att fånga, en våning upp.
    if (summary.missing > 0 || summary.failed > 0) {
      console.error(
        `[order-backfill] ${summary.created} av ${summary.missing} saknade tasks skapade`
          + `, ${summary.failed} fel`
          + (summary.recovered.length ? ` (räddade: ${summary.recovered.join(", ")})` : "")
          + (summary.errors.length
            ? ` — ${summary.errors.map((e) => `${e.order}: ${e.error}`).join(" | ")}`
            : ""),
      );
    }

    // ☠️ LARMET GÅR VIA MEJL, INTE VIA WIX. Faller task-skrivningen är det
    // oftast för att Wix Datas postgräns är nådd — och då är varje kanal vi
    // annars litar på blockerad av exakt samma vägg: audit-raden nedan,
    // vaktens fynd, admin-listan, nästa körnings andra försök. Resend rör
    // inte Wix och är därför den enda vägen ut ur en full databas.
    //
    // Mejlet upprepas varje timme så länge ordern sitter fast. Det är med
    // flit: en betald order som inte kan expedieras SKA tjata, och tjatet
    // upphör av sig självt i samma sekund som skrivningen går igenom. Order
    // 10024 låg annars 19 timmar innan morgonmejlet nämnde den — och den
    // enda anledningen att den upptäcktes var att Leonard råkade titta.
    //
    // Bara i skarpt läge: en torrkörning har per definition inte tappat något.
    if (!dryRun && summary.stuck.length > 0) {
      const to = process.env.OPS_ALERT_EMAIL;
      const byggt = buildStuckOrdersEmail(summary.stuck, `${adminBaseUrl()}/admin`);
      if (to && byggt) {
        try {
          await sendEmail({ to, subject: byggt.subject, bodyHtml: byggt.html, bodyText: byggt.text });
        } catch (mailErr) {
          // Mejlet får aldrig fälla körningen — tasks som GICK att skapa är
          // redan skapade, och konsolraden ovan står kvar som spår.
          console.error(
            `[order-backfill] larmmejlet gick inte fram: ${mailErr instanceof Error ? mailErr.message : String(mailErr)}`,
          );
        }
      } else if (!to) {
        console.error(
          "[order-backfill] OPS_ALERT_EMAIL saknas — ingen kan larmas om de tappade ordrarna",
        );
      }
    }

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

/** Adressen till admin, för länken i larmmejlet. Samma härledning som
 *  aliexpress-sync-rutten använder för sina mejllänkar. */
function adminBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL
    ?? process.env.VERCEL_URL
    ?? "https://fyndplats-cache-warmer.vercel.app"
  )
    .replace(/^https?:\/\//, "https://")
    .replace(/\/$/, "");
}

export const GET = handle;
export const POST = handle;
