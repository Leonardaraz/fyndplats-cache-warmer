// Varje färgs egna bilder i produktgalleriet — beroendefri modul.
//
// Sammanslagna produkter (en sida, flera färger) bär alla färgers foton i
// samma Wix-galleri, men valets linkedMedia pekar oftast bara på EN bild per
// färg. Galleriet visade därför alla färgers bilder huller om buller, och den
// som valde grått såg den svarta bilens barnbilder (Leonard, 2026-09-30:
// "trycker man på andra alternativet så ska alla dens bilder dyka upp").
//
// Två steg:
//   1. agareMedAltText: vilken färg varje bild visar. linkedMedia avgör först.
//      Olänkade bilder tillskrivs en färg när alt-texten nämner exakt EN av
//      produktens färger ("Pojke kör den svarta Audi-elbilen"). Nämner den
//      ingen eller flera ("Färgkort i svart, grått och rött") är bilden
//      gemensam och visas för alla färger.
//   2. synligaBilder: galleriet för ett val = valets egna bilder + de
//      gemensamma, med valets huvudbild först. Andra färgers bilder göms.
//
// Hellre gemensam än fel: en bild som inte säkert hör till en färg visas för
// alla. Värsta fallet är då dagens beteende, aldrig en färg utan sin bild.
//
// Bor separat från lib/products.ts av samma skäl som lib/image-alt.ts: den
// används både på servern och i klientkomponenten components/productview.tsx.

// Samma nyckel som lib/image-alt.ts imgKey (Wix fil-id). Kopierad hit så
// modulen saknar importer och kan testas direkt med node --test.
const imgKey = (url: string): string => (url || "").match(/\/media\/([^/?]+)/)?.[1] || url || "";

// Bokstavsgränser som förstår å, ä och ö (JavaScripts \b gör inte det).
const FORE = "(?<![\\p{L}\\p{N}])";
const EFTER = "(?![\\p{L}\\p{N}])";

// "mot vit bakgrund" beskriver fotot, inte varan. Tas bort innan färgerna läses.
const BAKGRUND = /(?<![\p{L}])(?:vit|vita|vitt|grå|gråa|grått|svart|svarta|ljus|ljusa|ljusgrå|beige)\s+(?:bakgrund|bakgrunden|studiobakgrund|yta|ytan)(?![\p{L}])/giu;

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Böjningsformerna av ett svenskt färgord: svart → svart, svarta; röd → röd,
 * röda, rött; grå → grå, gråa, grått; vit → vit, vita, vitt. Null när
 * etiketten inte är ett enda ord (t.ex. "Svart/vit", "110 cm"): då gissar vi
 * inte.
 */
export function fargFormer(etikett: string): string[] | null {
  const w = (etikett || "").trim().toLowerCase();
  if (!/^\p{L}{3,}$/u.test(w)) return null;
  const former = new Set([w, w + "a", w + "t", w + "tt"]);
  if (w.endsWith("d")) former.add(w.slice(0, -1) + "tt"); // röd → rött
  if (w.endsWith("t")) former.add(w + "t"); // vit → vitt
  return [...former];
}

/** Vilka av etiketterna en alt-text nämner (efter att bakgrunden strukits). */
export function nammdaFarger(alt: string, etiketter: string[]): string[] {
  const text = (alt || "").replace(BAKGRUND, " ");
  const traffar: string[] = [];
  for (const e of etiketter) {
    const former = fargFormer(e);
    if (!former) continue;
    const re = new RegExp(`${FORE}(?:${former.map(esc).join("|")})${EFTER}`, "iu");
    if (re.test(text)) traffar.push(e);
  }
  return traffar;
}

/**
 * Bildägare: fil-id → färgetikett. `lankade` (ur linkedMedia) vinner alltid.
 * Övriga bilder i `bilder` får en ägare bara när alt-texten nämner exakt en av
 * `fargEtiketter`. Kräver minst två färger; annars finns inget att välja mellan.
 */
export function agareMedAltText(opts: {
  lankade: Record<string, string>;
  alts: Record<string, string>;
  bilder: string[];
  fargEtiketter: string[];
}): Record<string, string> {
  const { lankade, alts, bilder, fargEtiketter } = opts;
  const ut: Record<string, string> = { ...lankade };
  const etiketter = fargEtiketter.filter((e) => fargFormer(e));
  if (etiketter.length < 2) return ut;
  for (const url of bilder) {
    const k = imgKey(url);
    if (!k || k in ut) continue;
    const traffar = nammdaFarger(alts[k] || "", etiketter);
    if (traffar.length === 1) ut[k] = traffar[0];
  }
  return ut;
}

/**
 * Galleriet för de valda etiketterna: bilder som ägs av något valt val plus
 * gemensamma bilder (utan ägare), med `forst` (valets huvudbild) först.
 * Filtrerar bara när minst en bild ägs av ett valt val; annars, och om
 * resultatet blir tomt, returneras hela listan oförändrad.
 */
export function synligaBilder(
  bilder: string[],
  agare: Record<string, string> | undefined,
  valda: string[],
  forst?: string,
): string[] {
  if (!agare || !valda.length) return bilder;
  const valdaSet = new Set(valda);
  const egna = bilder.some((u) => valdaSet.has(agare[imgKey(u)]));
  if (!egna) return bilder;
  const synliga = bilder.filter((u) => {
    const o = agare[imgKey(u)];
    return !o || valdaSet.has(o);
  });
  if (!synliga.length) return bilder;
  if (!forst) return synliga;
  const fk = imgKey(forst);
  const i = synliga.findIndex((u) => imgKey(u) === fk);
  if (i <= 0) return synliga;
  return [synliga[i], ...synliga.slice(0, i), ...synliga.slice(i + 1)];
}
