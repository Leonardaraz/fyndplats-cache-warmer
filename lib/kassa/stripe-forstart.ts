// lib/kassa/stripe-forstart.ts
//
// Stripe.js börjar köras redan vid trycket på "Till kassan" i varukorgen
// (components/cart.tsx), inte först när kassan har ritats.
//
// VARFÖR (Leonard 2026-11-16: "när man går in i leverans får man inte upp
// leveransadress och sånt, utan rutorna är blanka för att sen kommer det upp
// och går att skriva"). Adressfälten är Stripes egna och ritas i en ram som
// Stripe.js skapar. Mätt på www med strypt processor (4×) och 9 Mbit: kassan
// syns 0,28 s efter trycket, men Stripe.js började köras först då, och
// adressfälten gick att skriva i efter 2,2 s. Filen är redan hämtad när lådan
// är öppen (förladdad med kassans sida), så det som går att tidigarelägga är
// själva körningen. Kassans loadStripe (app/kassa/use-stripe-betalning.ts)
// hittar skriptet eller window.Stripe och lägger inte in det en gång till.
//
// Inga kakor sätts här: skriptet definierar bara Stripe. Stripes ramar och
// kakor skapas som förut, när kassan anropar Stripe med butikens nyckel.
//
// LÖVMODUL med flit (inga importer): varukorgen finns på varje sida, och
// lib/kassa/stripe-klient.ts skulle följa med i dess kod. Adressen står därför
// en gång till här; stripe-forstart.test.ts fäller om de två skiljer sig.

/** Samma adress som kassans loadStripe och förladdningen (STRIPE_JS). */
export const STRIPE_SKRIPT = "https://js.stripe.com/basil/stripe.js";

type Dokument = Pick<Document, "querySelector" | "createElement"> & { head: Pick<HTMLHeadElement, "appendChild"> };

/** Lägger in Stripe.js om det inte redan finns. Sant om skriptet lades in nu. */
export function forstartaStripe(dok: Dokument = document, fonster: { Stripe?: unknown } = window as unknown as { Stripe?: unknown }): boolean {
  try {
    if (fonster.Stripe) return false;
    if (dok.querySelector(`script[src="${STRIPE_SKRIPT}"]`)) return false;
    const s = dok.createElement("script");
    s.src = STRIPE_SKRIPT;
    s.async = true;
    dok.head.appendChild(s);
    return true;
  } catch {
    // Ett fel här får aldrig stoppa vägen till kassan: kassan laddar Stripe själv.
    return false;
  }
}
