// app/api/cron/ae-delivery-poll/route.ts
// Vercel Cron entry: GET /api/cron/ae-delivery-poll
// Schedule: "20 */2 * * *" (varannan timme — se vercel.json).
//
// VARFÖR. Leveransnotisen ("ute för leverans" / "levererat") fyras av
// 17TRACK:s push. Men 17TRACK registrerar bara nummer vars fraktbolag den
// känner igen, och våra EU-leverantörer använder last-mile-bolag den ofta
// inte gör. Order 10023 (2026-09-01): paketet gick från Polen, 17TRACK sa
// "carrier odetekterad, inget format-mönster matchar — ingen push för detta
// paket". Ingen push → aldrig ett "levererat"-mejl, hur väl paketet än kom
// fram. AliExpress visste däremot exakt var det var: /api/track visade fem
// händelser från deras källa medan 17TRACK hade noll.
//
// Den här cronen frågar AliExpress-källan (via cache-warmern) för varje
// paket i luften och mejlar när AE säger levererat/ute för leverans — genom
// SAMMA sändare och SAMMA dedup som pushen (lib/delivery-notify). Kommer
// pushen först vinner den anspråket och pollen hoppar; kommer pollen först
// gäller det omvända. Kunden får ett mejl, aldrig två.
//
// Den pollar ALLA paket i luften, inte bara de 17TRACK avvisade. Vi sparar
// inte registreringsutfallet, och ett registrerat nummer kan ändå aldrig
// pushas (carrier-datalucka). Priset är ett AliExpress-anrop per paket och
// körning — ~10 paket × 12 körningar per dygn. Cache-warmern cachar 5 min.
//
// Auth: Vercel Cron skickar "Authorization: Bearer $CRON_SECRET". Saknas
// CRON_SECRET i miljön släpper vi igenom (samma mönster som övriga cron-routes).

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { fetchAliExpressEvents } from "@/lib/ae-source";
import { sendDeliveryNotification } from "@/lib/delivery-notify";
import {
  POLL_MAX_PER_KÖRNING,
  POLL_MAX_ÅLDER_DAGAR,
  POLL_PAUS_MS,
  POLL_STATUSAR,
  notisStatusFör,
  skaSkrivaStatus,
} from "@/lib/delivery-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Väggklocka. Under maxDuration med marginal så svaret alltid hinner ut —
 *  en rutt som dödas mitt i har mejlat utan att kunna säga vad. */
const TIDSBUDGET_MS = 50_000;

function isAuthorised(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // dev fallback
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

interface MappingRad {
  tracking_number: string;
  order_id: string | null;
  customer_email: string;
  customer_name: string | null;
  status: string;
}

const paus = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }

  const start = Date.now();
  const url = new URL(request.url);
  // ?dryRun=1: fråga källan och rapportera, men mejla inte och skriv inget.
  const dryRun = url.searchParams.get("dryRun") === "1";

  // Bara paket i luften, nyast sist så de äldsta (mest sannolikt levererade)
  // tas först om tidsbudgeten skulle ta slut. 'ambiguous' (två kunder på
  // samma nummer) är aldrig med — findMapping i push/SMS exkluderar den
  // också, av samma skäl: vi vet inte vem mejlet gäller.
  let rader: MappingRad[];
  try {
    // sql.query i stället för taggen: taggen tar bara primitiver, och
    // statuslistan ska vara EN array-parameter så urvalet följer POLL_STATUSAR
    // hur många status den än får — inte två inskrivna platshållare.
    const r = await sql.query<MappingRad>(
      `SELECT tracking_number, order_id, customer_email, customer_name, status
         FROM tracking_mapping
        WHERE status = ANY($1::text[])
          AND created_at > NOW() - ($2::int * INTERVAL '1 day')
        ORDER BY created_at ASC
        LIMIT $3`,
      [[...POLL_STATUSAR], POLL_MAX_ÅLDER_DAGAR, POLL_MAX_PER_KÖRNING],
    );
    rader = r.rows;
  } catch (err) {
    console.error("[ae-delivery-poll] tracking_mapping-läsning misslyckades", err);
    return NextResponse.json({ ok: false, error: "db_read_failed" }, { status: 500 });
  }

  const summering = {
    ok: true,
    dryRun,
    granskade: 0,
    utanKälla: 0,
    iTransit: 0,
    skickade: [] as Array<{ tn: string; status: string }>,
    dubbletter: 0,
    misslyckade: [] as Array<{ tn: string; reason: string }>,
    avbrutenAvTid: false,
  };

  for (const rad of rader) {
    if (Date.now() - start > TIDSBUDGET_MS) {
      summering.avbrutenAvTid = true;
      break;
    }
    summering.granskade++;

    const ae = await fetchAliExpressEvents(rad.tracking_number);
    if (!ae) {
      summering.utanKälla++;
      await paus(POLL_PAUS_MS);
      continue;
    }

    const status = notisStatusFör(ae.status);
    if (!status || status === rad.status) {
      // Inget att mejla, eller redan på den status vi skulle mejla om
      // (out_for_delivery igen). Delivered efter out_for_delivery går vidare.
      summering.iTransit++;
      await paus(POLL_PAUS_MS);
      continue;
    }

    if (dryRun) {
      summering.skickade.push({ tn: rad.tracking_number, status: `${status} (torr)` });
      await paus(POLL_PAUS_MS);
      continue;
    }

    const utfall = await sendDeliveryNotification({
      trackingNumber: rad.tracking_number,
      mottagare: rad,
      status,
      rawCarrier: ae.carrier,
      channel: "ae-poll",
      logg: "[ae-delivery-poll]",
    });

    if (utfall.sent) summering.skickade.push({ tn: rad.tracking_number, status });
    else if (utfall.reason === "duplicate_suppressed") summering.dubbletter++;
    else summering.misslyckade.push({ tn: rad.tracking_number, reason: utfall.reason });

    // ☠️ Statusen skrivs bara när mejlet är skickat (av oss eller pushen).
    // Skrevs den vid Resend-fel hade raden lämnat urvalet och kunden aldrig
    // fått mejlet — pollen ÄR återförsöket. Se lib/delivery-status.
    if (skaSkrivaStatus(utfall)) {
      try {
        await sql/*sql*/`
          UPDATE tracking_mapping SET status = ${status}, updated_at = NOW()
           WHERE tracking_number = ${rad.tracking_number}
        `;
      } catch (err) {
        console.error(`[ae-delivery-poll] statusskrivning ${rad.tracking_number} misslyckades`, err);
      }
    }

    await paus(POLL_PAUS_MS);
  }

  console.log(
    `[ae-delivery-poll] ${summering.granskade} granskade, ${summering.skickade.length} skickade, `
      + `${summering.dubbletter} dubbletter, ${summering.misslyckade.length} misslyckade, `
      + `${summering.utanKälla} utan källa${dryRun ? " (torr)" : ""}${summering.avbrutenAvTid ? " — AVBRUTEN AV TID" : ""}`,
  );
  return NextResponse.json(summering);
}
