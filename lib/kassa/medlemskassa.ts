// lib/kassa/medlemskassa.ts
//
// Medlemskorgen i vår kassa, serverns del (lib/kassa/lastkorg.ts har reglerna).
//
//   1. Gäller vår kassa med Stripe för besökaren (`egenKassaMedStripe`) svarar
//      /api/medlem/kassa och /api/medlem/offert/kassa med "/kassa" och sätter
//      kakan fp_kassa_korg på den låsta korgen, i stället för Wix kassa.
//   2. /kassa (`lastKorgForKassan`) använder den låsta korgen bara om den hör
//      till den inloggade medlemmen, har ett prisbeslut utan utfall och inte
//      blivit en order. Annars gäller besökarens vanliga korg som förut.
//   3. Efter köpet (`efterMedlemskop`) tas de köpta varorna bort ur besökarens
//      korg, men bara om ordern verkligen kom från den låsta korgen och är betald,
//      och bara en gång per beslut. Webhooken gör det för varje godkänd order
//      (också Wix kassas), och kassans sida direkt efter köpet.
//
// Allt här är best effort: ett fel gör att kunden får den vanliga kassan eller
// en varukorg som inte tömts, aldrig ett stoppat köp.

import { cookies } from "next/headers";
import { wixFetch } from "@/lib/wix-client";
import { normaliseraKundvagn, type NormaliseradRad } from "@/lib/cart-shape";
import { inloggad } from "@/lib/medlem/inloggad";
import { hamtaPrisbeslut, taRensning } from "@/lib/medlem/lager";
import { egenKassa, kassaLage, PROV_KAKA } from "./lage";
import { harStripe } from "./stripe";
import { hamtaKorg, hamtaOrder } from "./wix-kassa";
import { LAST_KORG_KAKA, lastKorgAnvandbar, lastKorgId, medSdkId, raderAttTaBort, beslutetsRensning, rensningsplan } from "./lastkorg";

/** Vår kassa med Stripe gäller för den här besökaren (läget och provkakan). */
export async function egenKassaMedStripe(): Promise<boolean> {
  if (!harStripe() || !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()) return false;
  try {
    return egenKassa(await kassaLage(), (await cookies()).get(PROV_KAKA)?.value);
  } catch {
    return false;
  }
}

export interface LastKorg {
  id: string;
  rader: NormaliseradRad[];
  /** Medlemmens e-post på korgen, så att kassans fält fylls i. */
  epost: string | null;
  /** Besökarens korg som den låsta kopierades från: kassan jämför, och släpper en gammal. */
  besokarensKorg: string | null;
}

/** Den låsta korgen till /kassa, eller null: då gäller besökarens vanliga korg. */
export async function lastKorgForKassan(): Promise<LastKorg | null> {
  try {
    const id = lastKorgId((await cookies()).get(LAST_KORG_KAKA)?.value);
    if (!id) return null;
    const session = await inloggad();
    if (!session) return null;
    const beslut = await hamtaPrisbeslut(id);
    if (!beslut || beslut.medlemsId !== session.sub || typeof beslut.utfall === "string") return null;
    const korg = await hamtaKorg(id);
    if (!lastKorgAnvandbar(korg)) return null;
    const vagn = normaliseraKundvagn(medSdkId(korg));
    if (!vagn || vagn.lineItems.length === 0) return null;
    const epost = (korg as { buyerInfo?: { email?: unknown } } | null)?.buyerInfo?.email;
    return {
      id,
      rader: vagn.lineItems,
      epost: typeof epost === "string" && epost ? epost : null,
      besokarensKorg: typeof beslut.besokarensKorg === "string" && beslut.besokarensKorg ? beslut.besokarensKorg : null,
    };
  } catch (e) {
    console.error("[medlemskassa] den låsta korgen gick inte att läsa:", e instanceof Error ? e.message.slice(0, 120) : "okänt");
    return null;
  }
}

/**
 * Efter ett köp med en medlemskorg: kom ordern från den låsta korgen och är den
 * betald tas de köpta varorna bort ur besökarens vanliga korg, en gång per
 * beslut (`taRensning`). Webhooken anropar den för varje godkänd order, och
 * kassans sida direkt efter köpet med `vanta` (ordern kan vara ett ögonblick
 * före Wix läsning). Svarar hur många rader som togs bort.
 */
export async function efterMedlemskop(lastId: string, orderId: string, opt: { vanta?: boolean } = {}): Promise<number> {
  const beslut = await hamtaPrisbeslut(lastId);
  // Inget beslut, en offert eller redan gjort: ingen order behöver läsas.
  if (beslutetsRensning(beslut).gor === "inget") return 0;
  let plan = rensningsplan(lastId, beslut, await hamtaOrder(orderId));
  for (let i = 0; opt.vanta && plan.gor === "inget" && plan.varfor === "obetald" && i < 3; i++) {
    await new Promise((r) => setTimeout(r, 1_500));
    plan = rensningsplan(lastId, beslut, await hamtaOrder(orderId));
  }
  if (plan.gor === "inget") return 0;
  if (!(await taRensning(lastId, orderId))) return 0;
  const korg = await hamtaKorg(plan.besokarensKorg);
  const rader = Array.isArray((korg as { lineItems?: unknown } | null)?.lineItems) ? (korg as { lineItems: unknown[] }).lineItems : [];
  const bort = raderAttTaBort(rader, plan.kopta);
  if (bort.length === 0) return 0;
  await wixFetch({
    method: "POST",
    path: `/ecom/v2/carts/${encodeURIComponent(plan.besokarensKorg)}/remove-line-items`,
    body: { lineItemIds: bort },
  });
  return bort.length;
}

/** Webhookens anrop: fel loggas utan id och stoppar aldrig något annat. */
export async function efterMedlemskopTyst(lastId: string, orderId: string): Promise<void> {
  try {
    const n = await efterMedlemskop(lastId, orderId);
    if (n > 0) console.info(`[medlemskassa] ${n} köpta rader borttagna ur besökarens korg`);
  } catch (e) {
    console.error("[medlemskassa] besökarens korg gick inte att tömma:", e instanceof Error ? e.message.slice(0, 120) : "okänt");
  }
}
