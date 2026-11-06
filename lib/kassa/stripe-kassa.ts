// lib/kassa/stripe-kassa.ts
//
// Stripe-kassans riktiga beroenden: Wix-anropen (lib/kassa/wix-kassa.ts),
// Stripe-anropen (lib/kassa/stripe.ts) och låset (lib/kassa/stripe-las.ts).
// Flödet och skälen står i lib/kassa/flode.ts (forberedStripe, slutforStripe,
// speglaAterbetalningar).

import type { AterbetalningDeps, StripeKassaDeps } from "./flode";
import { speglaAterbetalningar } from "./flode";
import { avbrytOrder, hamtaKorg, laggOrder, laggTillKupong, orderBetalningar, orderTransaktioner, rakna, registreraBetalning, sattLeverans, taBortKupong, uppdateraKorg } from "./wix-kassa";
import { aterbetala, aterbetalaDel, dra, hamtaAvsikt, hamtaLaddning, harStripe, markeraAvsikt, skapaAvsikt, slappAvsikt, uppdateraAvsikt } from "./stripe";
import { sparaLas, tagLas } from "./stripe-las";

// Ingen kunddata i raderna: bara steg, belopp i öre och Stripes/Wix felkoder.
// ☠️-rader (pengar som inte står där de ska) är fel och syns bland Vercels
// körfel; resten är avvikelser som flödet själv tog hand om, och varningar.
const logg = (rad: string) => (rad.includes("☠️") ? console.error(rad) : console.warn(rad));

export const stripeKassa: StripeKassaDeps = {
  hamtaKorg,
  uppdateraKorg,
  laggTillKupong,
  taBortKupong,
  rakna,
  sattLeverans,
  laggOrder,
  registreraBetalning,
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
  sparaLas,
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
