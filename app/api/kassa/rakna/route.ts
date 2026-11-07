// POST /api/kassa/rakna  { cartId, kupong?, postnr? }
//
// Wix räkning av besökarens korg för kassans summering: delsumma, rabatt,
// frakt och total, i öre. Korgen får Sverige som land (annars räknar Wix med
// serverns land, USA i E0-provet) och postnumret när kunden skrivit det.
// `kupong` lägger till eller byter rabattkoden; en tom sträng tar bort den.
// Ingen order skapas här.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { egenKassa, kassaLage, PROV_KAKA } from "@/lib/kassa/lage";
import { normalPostnr } from "@/lib/kassa/formular";
import { landRedanSatt, oreAv, stoppandeOvertradelser, type Forsok } from "@/lib/kassa/flode";
import { hamtaKorg, korgensForsok, laggTillKupong, rakna, sattLand, sattLeverans, taBortKupong } from "@/lib/kassa/wix-kassa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVAT = { "Cache-Control": "private, no-store" };
const svar = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status, headers: PRIVAT });
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  // Växeln läses samtidigt med korgen: den är cachad en minut per instans, och
  // en kall läsning tog 0,2–0,3 s före allt annat (mätt 2026-11-07). Svaren är
  // desamma som förut och i samma ordning: stängd kassa först, sedan fel i
  // anropet. Med stängd kassa används läsningen aldrig.
  const provkaka = (await cookies()).get(PROV_KAKA)?.value;
  const lage = kassaLage();
  let body: Record<string, unknown> | null = null;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = null;
  }
  const cartId = typeof body?.cartId === "string" ? body.cartId : "";
  // Korgen och om kunden redan har en väntande betalning, samtidigt.
  const lasning = body && GUID.test(cartId) ? Promise.all([hamtaKorg(cartId), korgensForsok(cartId, new Date(Date.now() - 3 * 3_600_000)).catch((): Forsok[] => [])]) : null;
  lasning?.catch(() => {});
  if (!egenKassa(await lage, provkaka)) return svar({ ok: false, kod: "stangd" }, 503);
  if (!body) return svar({ ok: false, kod: "fel" }, 400);
  if (!lasning) return svar({ ok: false, kod: "korg" }, 400);
  const kupong = typeof body.kupong === "string" ? body.kupong.replace(/\s/g, "").slice(0, 40) : null;

  try {
    const [korg, forsok] = await lasning;
    if (!korg || korg.orderPlaced) return svar({ ok: false, kod: "korg_saknas" }, 404);
    const vantarBetalning = forsok.some((f) => f.status === "UNPAID");
    // Har korgen redan Sverige och samma postnummer ändrar PATCH:en ingenting.
    const postnr = normalPostnr(body.postnr);
    if (!landRedanSatt(korg, postnr)) await sattLand(cartId, postnr);

    let kupongFel: string | null = null;
    if (kupong !== null) {
      const forra = (korg.coupons ?? [])[0];
      const byts = (forra?.code ?? "").toLowerCase() !== kupong.toLowerCase();
      if (forra?.id && byts) await taBortKupong(cartId, forra.id);
      if (kupong && byts && (await laggTillKupong(cartId, kupong)) === "ogiltig") {
        kupongFel = "Rabattkoden finns inte eller gäller inte för de här varorna.";
      }
    }

    let r = await rakna(cartId);
    const satt = r.summary?.deliverySummary?.method;
    if (satt?.code && satt.appId && r.cart?.deliveryInfo?.method?.code !== satt.code) {
      await sattLeverans(cartId, { code: satt.code, appId: satt.appId });
      r = await rakna(cartId);
    }
    const p = r.summary?.priceSummary;
    const totalOre = oreAv(p?.total);
    // Wix räknar momsen när den är inställd (ordrarna bär den, 25 %). Annars är
    // den en femtedel av ett pris med 25 % moms.
    const skattOre = oreAv(p?.tax);
    // Kundens egen väntande order håller varorna, så Wix räknar dem som slut:
    // det är ingen brist för den här kunden.
    const stopp = stoppandeOvertradelser(r, { utanLager: vantarBetalning });
    return svar({
      ok: true,
      delsummaOre: oreAv(p?.subtotal),
      rabattOre: oreAv(p?.discount) ?? 0,
      fraktOre: oreAv(p?.delivery),
      totalOre,
      momsOre: skattOre && skattOre > 0 ? skattOre : totalOre === null ? null : Math.round(totalOre / 5),
      fraktnamn: r.summary?.deliverySummary?.method?.title?.original ?? null,
      kupong: (r.cart?.coupons ?? [])[0]?.code ?? null,
      kupongFel,
      meddelanden: stopp.meddelanden,
    });
  } catch (e) {
    console.error("[kassa] räkningen föll:", e instanceof Error ? e.message.slice(0, 300) : e);
    return svar({ ok: false, kod: "wix" }, 502);
  }
}
