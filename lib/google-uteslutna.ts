// lib/google-uteslutna.ts
// Produkter som aldrig skickas i Google-flödet (/feed/google.xml).
//
// Merchant Center avvisade dem på policy 2026-11-07, i alla rapportytor:
//   • tobaksregeln: den elektriska cigarettmaskinen, alla fyra varianterna;
//   • vapendelar: PCP-handpumpen till luftgevär.
// En policyvara rättas inte med en bättre text eller bild. Den ska inte skickas
// alls, eftersom upprepade policyavslag kan ge varningar på hela kontot.
//
// Sidorna ligger kvar i butiken. PriceRunner- och Prisjakt-flödena byggs ur
// Google-flödet (app/feed/pricerunner.xml, prisjakt.xml och [fil]), så
// produkterna försvinner också därifrån.
//
// Nyckeln är Wix produkt-id (g:item_group_id), inte variantens. En ny variant
// på en utesluten produkt följer alltså med ut.
export const GOOGLE_UTESLUTNA: ReadonlyMap<string, string> = new Map([
  ["f31eb0a5-5267-40fd-b193-a5adbebfb5d0", "tobak: elektrisk cigarettmaskin"],
  ["975c9daf-d3da-4c9b-911b-7c21e48f27e2", "vapendelar: PCP-handpump till luftgevär"],
]);

export function uteslutenFranGoogle(produktId: string | null | undefined): boolean {
  return !!produktId && GOOGLE_UTESLUTNA.has(produktId);
}
