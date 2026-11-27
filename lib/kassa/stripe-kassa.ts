// lib/kassa/stripe-kassa.ts
//
// Stripe-kassans riktiga beroenden: Wix-anropen (lib/kassa/wix-kassa.ts),
// Stripe-anropen (lib/kassa/stripe.ts) och låset (lib/kassa/stripe-las.ts).
// Flödet och skälen står i lib/kassa/flode.ts (forberedStripe, slutforStripe,
// speglaAterbetalningar).

import { after } from "next/server";
import type { AterbetalningDeps, StripeKassaDeps } from "./flode";
import { speglaAterbetalningar } from "./flode";
import { heylinkKop } from "../heylink";
import { arProduktion, heylinkKropp, heylinkNyckel, skickaTillHeylink } from "../heylink-s2s";
import { fetchWixOrderInfo } from "../wix-orders";
import { avbrytOrder, avbrytPlatshallare, hamtaKorg, laggOrder, laggTillKupong, orderBetalningar, orderTransaktioner, rakna, registreraBetalning, sattLeverans, taBortKupong, uppdateraKorg } from "./wix-kassa";
import { aterbetala, aterbetalaDel, dra, hamtaAvsikt, hamtaLaddning, harStripe, markeraAvsikt, skapaAvsikt, slappAvsikt, uppdateraAvsikt } from "./stripe";
import { sparaLas, tagLas, taOverLas } from "./stripe-las";

// Ingen kunddata i raderna: bara steg, belopp i öre och Stripes/Wix felkoder.
// ☠️-rader (pengar som inte står där de ska) är fel och syns bland Vercels
// körfel; resten är avvikelser som flödet själv tog hand om, och varningar.
const logg = (rad: string) => (rad.includes("☠️") ? console.error(rad) : console.warn(rad));

/**
 * Köpet till Heylink åt GoWish, från servern (lib/heylink-s2s.ts). Ordern läses
 * ur Wix med samma läsare och samma uträkning som tacksidan (heylinkKop), så
 * att beloppen är desamma som skriptet skulle ha skickat.
 *
 * Bara i produktion och bara med nyckeln. Loggraden bär ordernumret och
 * Heylinks statuskod, aldrig adressen, nyckeln eller klick-id:t.
 */
async function lamnaKopTillHeylink(orderId: string, hltid: string): Promise<void> {
  const nyckel = heylinkNyckel(process.env.HEYLINK_SECRET_KEY);
  if (!arProduktion(process.env)) return;
  if (!nyckel) {
    console.warn(`[heylink] köpet ${orderId.slice(0, 8)} skickades inte: HEYLINK_SECRET_KEY saknas`);
    return;
  }
  const info = await fetchWixOrderInfo(orderId);
  const kop = heylinkKop(info, orderId);
  if (!kop) {
    console.warn(`[heylink] köpet ${orderId.slice(0, 8)} skickades inte: ordern gick inte att räkna`);
    return;
  }
  const utfall = await skickaTillHeylink(heylinkKropp(kop, hltid), nyckel);
  if (utfall.ok) console.info(`[heylink] köp ${kop.orderId} skickat till Heylink (${utfall.status})`);
  else console.warn(`[heylink] köp ${kop.orderId} kom inte fram till Heylink (${utfall.status ?? "inget svar"}): ${utfall.orsak}`);
}

/**
 * Efter svaret till kunden (after), så att kassan aldrig väntar på Heylink.
 * Utanför ett anrop (nätet i cron) finns ingen after: då görs det direkt.
 */
async function rapporteraKop(orderId: string, hltid: string): Promise<void> {
  const jobb = async () => {
    try {
      await lamnaKopTillHeylink(orderId, hltid);
    } catch (e) {
      console.warn(`[heylink] köpet föll: ${e instanceof Error ? e.message.slice(0, 160) : e}`);
    }
  };
  try {
    after(jobb);
  } catch {
    await jobb();
  }
}

export const stripeKassa: StripeKassaDeps = {
  hamtaKorg,
  uppdateraKorg,
  laggTillKupong,
  taBortKupong,
  rakna,
  sattLeverans,
  laggOrder,
  registreraBetalning,
  avbrytPlatshallare,
  orderBetalningar,
  avbrytOrder,
  skapaAvsikt,
  uppdateraAvsikt,
  hamtaAvsikt,
  dra,
  slappAvsikt,
  aterbetala,
  markeraAvsikt,
  tagLas,
  taOverLas,
  sparaLas,
  rapporteraKop,
  logg,
};

export const aterbetalningKassa: AterbetalningDeps = { orderTransaktioner, hamtaLaddning, aterbetalaDel, logg };

/**
 * Wix-webhookens spegling av en återbetalning, efter svaret (after): kastar
 * aldrig. Det som faller tas av nätet (/api/cron/kassa-stripe), som också
 * larmar; här loggas bara utfallet.
 */
export async function speglaEfterWebhook(orderId: string): Promise<void> {
  if (!harStripe()) return;
  try {
    const u = await speglaAterbetalningar(aterbetalningKassa, orderId);
    if (u.aterbetalda || u.larm.length || u.vantar) {
      console.info(`[kassa-ater] webhook: ${u.aterbetalda} återbetalda i Stripe, ${u.larm.length} larm${u.vantar ? ", väntar på Wix" : ""}`);
    }
  } catch (e) {
    console.error(`[kassa-ater] ☠️ speglingen föll (nätet tar om den): ${e instanceof Error ? e.message.slice(0, 200) : e}`);
  }
}
