// lib/feed/gtin.ts
//
// VILKEN EAN/GTIN EN VARIANT FÅR i Prisjakt- och PriceRunner-flödet (2026-11-15,
// Leonards "kör dina förslag noggrant"). Två källor:
//
//  - "cdon" (gtin-cdon.ts): en kod per variant ur Leonards CDON-lista, parad på
//    leverantörens artikelnummer. Gäller också produkter med flera varianter.
//  - "dealproffsen" (prisjakt-gtin.ts, testet 2026-10-23): koder ur en annan
//    säljares produktlänkar. För dem gäller regeln om EXAKT en variant i
//    Google-flödet (gtinUrval i prisjakt.ts).
//
// Har CDON-listan en kod för varianten vinner den: 492 av de 534 varianter som
// båda källorna har skilde sig 2026-11-15, och Prisjakt hade bara matchat 9 av
// 6 818 erbjudanden med dealproffsens koder (2026-10-28). En dealproffsen-kod som
// CDON-listan har på en ANNAN variant tas bort, så att en kod aldrig står på två
// varor.
//
// ☠️ Google-flödet får aldrig en kod härifrån. Aosom levererar white label, och
// Google stämmer av GTIN mot märket, som där är Fyndplats. gtin.test.ts vaktar
// att app/feed/google.xml inte läser någon GTIN-karta.
//
// Ren funktion utan importer vid körning, så att node:test kan köra den direkt.
// Kartan som rutterna använder byggs i flode-gtin.ts.

export type GtinKalla = "cdon" | "dealproffsen";
export type GtinPost = { readonly kod: string; readonly kalla: GtinKalla };
/** Variant-id (g:id) → kod och källa. */
export type FlodeGtin = Readonly<Record<string, GtinPost>>;

export function byggFlodeGtin(
  cdon: Readonly<Record<string, string>>,
  dealproffsen: Readonly<Record<string, string>>,
): FlodeGtin {
  const ut: Record<string, GtinPost> = {};
  const cdonKoder = new Set(Object.values(cdon));
  for (const [id, kod] of Object.entries(dealproffsen)) {
    if (Object.hasOwn(cdon, id) || cdonKoder.has(kod)) continue;
    ut[id] = { kod, kalla: "dealproffsen" };
  }
  for (const [id, kod] of Object.entries(cdon)) ut[id] = { kod, kalla: "cdon" };
  return ut;
}
