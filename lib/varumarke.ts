// Produktens varumärke i strukturerad data och i flödena.
//
// BESLUTET (Leonard 2026-10-06, efter genomgången samma kväll):
//
// 1. Aosoms varor säljs som white label. Aosom skrev 2026-09-15 att de inte
//    lämnar ut EAN och att återförsäljaren säljer under eget namn (motorns
//    CLAUDE.md, "Aosom svarade: leveransen är WHITE LABEL"). Googles regel
//    tillåter butikens namn för "products manufactured by someone else and
//    rebranded by you". Aosoms märken blir därför Fyndplats — också om någon
//    satt märket i Wix.
// 2. En riktig märkesvara (Naturehike, Baseus, IMILAB …) visar sitt eget
//    märke. Där är Fyndplats fel enligt samma regel: varan är inte ommärkt.
//    Märket läses ur Wix produktfält "brand".
// 3. Ingen vara får ett märke vi gissat. Saknas märket i Wix blir det
//    Fyndplats, som förut.
//
// Ren modul utan importer, så att node-testköraren laddar den direkt.

export const BUTIKENS_MARKE = "Fyndplats";

/**
 * Aosoms märken (samma lista som motorns lib/gpsr/aosom.ts) och butikens eget.
 * Jämförs utan hänsyn till skiftläge, ®/™ och mellanslag.
 */
const WHITE_LABEL = new Set([
  "homcom",
  "outsunny",
  "pawhut",
  "aiyaplay",
  "sportnow",
  "vinsetto",
  "kleankin",
  "durhand",
  "zonekiz",
  "aosom",
  "fyndplats",
]);

const normera = (s: string) => s.toLowerCase().replace(/[®™\s]/g, "");

/** Varumärket som strukturerad data och flöden ska ange för en produkt. */
export function varumarke(wixMarke: string | null | undefined): string {
  const namn = (wixMarke ?? "").trim();
  if (!namn || WHITE_LABEL.has(normera(namn))) return BUTIKENS_MARKE;
  return namn;
}
