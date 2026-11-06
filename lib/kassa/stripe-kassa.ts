// lib/kassa/stripe-kassa.ts
//
// Stripe-kassans riktiga beroenden: Wix-anropen (lib/kassa/wix-kassa.ts),
// Stripe-anropen (lib/kassa/stripe.ts) och låset (lib/kassa/stripe-las.ts).
// Flödet och skälen står i lib/kassa/flode.ts (forberedStripe, slutforStripe).

import type { StripeKassaDeps } from "./flode";
import { avbrytOrder, hamtaKorg, laggOrder, laggTillKupong, orderBetalningar, rakna, registreraBetalning, sattLeverans, taBortKupong, uppdateraKorg } from "./wix-kassa";
import { aterbetala, dra, hamtaAvsikt, markeraAvsikt, skapaAvsikt, slappAvsikt, uppdateraAvsikt } from "./stripe";
import { sparaLas, tagLas } from "./stripe-las";

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
  // Ingen kunddata i raderna: bara steg, belopp i öre och Stripes/Wix felkoder.
  // ☠️-rader (pengar som inte står där de ska) är fel och syns bland Vercels
  // körfel; resten är avvikelser som flödet själv tog hand om, och varningar.
  logg: (rad) => (rad.includes("☠️") ? console.error(rad) : console.warn(rad)),
};
