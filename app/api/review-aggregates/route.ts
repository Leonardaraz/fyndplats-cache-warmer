// GET /api/review-aggregates
//
// Antal + snitt per produkt för HELA katalogen, i ETT svar.
//
// ☠️ VARFÖR DEN FINNS. Butiken visar stjärnor på varje produktkort i alla
// listningsvyer. Den läste betygen genom att fråga Wix Data DIREKT — vilket
// fungerade så länge recensionerna bodde där, och slutar fungera i samma
// sekund som de flyttar. Den läsaren hade inte gått sönder, den hade blivit
// TOM: korten tappar sina stjärnor utan ett enda fel i någon logg. Exakt vad
// som hände spårningssidan 2026-09-01.
//
// Formen är avsiktligt densamma som butiken redan använder (`productId`,
// `antal`, `snitt`), så bytet är en ändrad adress och inte en omskriven
// renderare.
//
// EN FRÅGA, INTE EN PER PRODUKT. Den naiva vägen hade blivit 24+ anrop per
// listningssida och ~800 på /alla-produkter. Samma resonemang som
// `listV3ProductPrices` för priserna.
//
// ☠️ EGEN SEGMENT, INTE /api/reviews/aggregates. Den adressen fångas av den
// dynamiska `[productId]`-rutten, som svarar **200** med
// `{productId:"aggregates", count:0, reviews:[]}`. En anropare som kollar
// `res.ok` hade alltså passerat, inte hittat sitt `betyg`-fält, och tyst
// visat noll betyg. Next prioriterar visserligen en statisk segment framför en
// dynamisk — men bara efter att den deployats, så fönstret mellan butikens och
// motorns deploy hade varit precis det tysta felet. En adress som i stället
// 404:ar när rutten saknas är den ärliga formen.
//
// Ingen auth: betygen är publik social proof och visas ändå på varje kort.
// Svaret bär BARA produkt-id, antal och snitt — ingen text, inga namn, inga
// bilder, alltså ingenting som kan röja en person eller en leverantör.

import { NextResponse } from "next/server";
import { getReviewStore } from "@/lib/store/reviews";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rader = await getReviewStore().aggregateByProduct();

    // Karta i stället för lista: butiken slår upp per produkt-id, och en karta
    // gör det till en uppslagning i stället för en genomsökning per kort.
    const betyg: Record<string, { antal: number; snitt: number }> = {};
    for (const r of rader) betyg[r.productId] = { antal: r.antal, snitt: r.snitt };

    return NextResponse.json(
      { ok: true, produkter: rader.length, betyg },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
      },
    );
  } catch (err) {
    // ☠️ 502, INTE ETT TOMT SVAR MED 200. Ett tomt aggregat är ett giltigt
    // tillstånd (ingen produkt har omdömen ännu), så en anropare kan inte
    // skilja "inga betyg" från "läsningen föll" om båda är 200 med tom karta.
    // Butiken faller ändå tillbaka på inga stjärnor — men felet syns.
    const message = err instanceof Error ? err.message : "Okänt fel";
    console.error("[api/reviews/aggregates] läsningen föll:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
