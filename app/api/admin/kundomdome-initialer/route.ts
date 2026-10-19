// POST /api/admin/kundomdome-initialer — initialer på kundomdömen som saknar dem.
//
//   (ingen parameter)   torrt: räknar bara, skriver ingenting
//   ?skarp=ja           skriver initialerna och läser tillbaka varje rad
//
// VARFÖR RUTTEN FINNS (2026-10-18). Ett godkänt kundomdöme visade "Verifierad
// köpare" som namn, eftersom kunden lämnat namnfältet tomt. Leonard: det ska
// visa initialer. /api/reviews/customer tar sedan dess initialerna från ordern
// när omdömet skrivs; den här rutten rättar raderna som skrevs innan dess.
// Logiken bor i lib/reviews/kundinitialer.ts, det här är IO och auth.
//
// ☠️ HELA LAGRET LÄSES, av samma skäl som datumrensningen: listAll sorterar
// nyast först och kapar vid sin gräns. Svaret säger `trunkerad: true` om taket
// ändå nås, och då skrivs ingenting.
//
// ☠️ LOGGEN BÄR BARA RÄKNARE OCH PRODUKT-ID, aldrig namn eller initialer.
// Rutten anropas från en publik Actions-logg.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getReviewStore } from "@/lib/store/reviews";
import { rattaKundinitialer } from "@/lib/reviews/kundinitialer";
import { fetchOrderKundnamn } from "@/lib/wix/orders";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Långt över lagrets storlek (≈8 000 rader i september 2026). */
const LASTAK = 100_000;
/** En produkts alla omdömen, för återläsningen. */
const PRODUKTTAK = 5_000;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }
  const skarp = req.nextUrl.searchParams.get("skarp") === "ja";

  const store = getReviewStore();
  let rader;
  try {
    rader = await store.listAll(LASTAK);
  } catch (err) {
    console.error(`[kundinitialer] kunde inte läsa lagret: ${String(err).slice(0, 200)}`);
    return NextResponse.json({ ok: false, error: "Kunde inte läsa recensionslagret" }, { status: 500 });
  }
  const trunkerad = rader.length >= LASTAK;

  const svar = await rattaKundinitialer(
    {
      rader,
      upsert: (r) => store.upsert(r),
      lasOm: async (productId, reviewIdAE) =>
        (await store.listByProduct(productId, PRODUKTTAK)).find((r) => r.reviewIdAE === reviewIdAE) ?? null,
      kundnamn: (orderId) => fetchOrderKundnamn(orderId),
    },
    { skarp: skarp && !trunkerad },
  );

  if (skarp && svar.rattade > 0) {
    await audit(
      "reviews",
      "kundinitialer",
      `${svar.rattade} kundomdömen fick initialer från ordern i stället för "Verifierad köpare", ${svar.fel} fel`,
    );
  }
  console.log(
    `[kundinitialer] ${skarp ? "skarp" : "torr"}: ${svar.kundomdomen} kundomdömen, ${svar.attRatta} utan initialer, `
      + `${svar.kanRattas} kan rättas, ${svar.rattade} rättade, ${svar.utanOrder} utan order-id, `
      + `${svar.orderSaknas} där ordern saknas, ${svar.utanNamn} utan namn, ${svar.fel} fel`,
  );

  return NextResponse.json({ ok: true, skarp, trunkerad, ...svar });
}
