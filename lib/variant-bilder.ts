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
  /** Sidans huvudbild. Se steg 2 nedan. */
  huvudbild?: string;
}): Record<string, string> {
  const { lankade, alts, bilder, fargEtiketter, huvudbild } = opts;
  const ut: Record<string, string> = { ...lankade };
  const etiketter = fargEtiketter.filter((e) => fargFormer(e));
  if (etiketter.length < 2) return ut;
  for (const url of bilder) {
    const k = imgKey(url);
    if (!k || k in ut) continue;
    const traffar = nammdaFarger(alts[k] || "", etiketter);
    if (traffar.length === 1) ut[k] = traffar[0];
  }
  // Steg 2, bara på sammanslagna sidor: någon färg äger precis EN bild (den
  // som följde med givaren). Då är sidans övriga olänkade foton den
  // ursprungliga färgens — huvudbildens färg — och inte gemensamma. Utan det
  // visade Svart och Grå på matskåpet Vit-färgens skålbilder (Leonard,
  // 2026-09-30). Fyndplats egna kort (spec-, mått-, färgkort) och bilder som
  // nämner flera färger förblir gemensamma.
  // Äger huvudbilden ett storleksval (t.ex. "45 liter") gäller inte steget.
  const huvudFarg = huvudbild ? ut[imgKey(huvudbild)] : undefined;
  if (huvudFarg && etiketter.includes(huvudFarg)) {
    const antal: Record<string, number> = {};
    for (const o of Object.values(ut)) antal[o] = (antal[o] || 0) + 1;
    const sammanslagen = etiketter.some((e) => e !== huvudFarg && antal[e] === 1);
    if (sammanslagen) {
      for (const url of bilder) {
        const k = imgKey(url);
        if (!k || k in ut) continue;
        const alt = alts[k] || "";
        if (arKort(alt) || nammdaFarger(alt, etiketter).length > 1) continue;
        ut[k] = huvudFarg;
      }
    }
  }
  return ut;
}

/**
 * Bilder som gäller alla färger: Fyndplats egna kort (spec-, mått-, färg-,
 * faktakort) och måttbilder ("Måttskiss: 60 × 30 cm", "Måttritning …"). Måtten
 * är desamma i alla färger.
 */
export function arKort(alt: string): boolean {
  return (
    /^\s*(?:fyndplats|mått|specifikation)/i.test(alt) ||
    /(?:spec(?:ifikations)?|mått|färg|fakta|storleks)kort/i.test(alt) ||
    /mått(?:bild|ritning|skiss|skisser|uppgifter)/i.test(alt)
  );
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
  return medForst(synliga, forst);
}

/** `forst` (valets huvudbild) först i listan, om den finns där. */
function medForst(bilder: string[], forst?: string): string[] {
  if (!forst) return bilder;
  const fk = imgKey(forst);
  const i = bilder.findIndex((u) => imgKey(u) === fk);
  if (i <= 0) return bilder;
  return [bilder[i], ...bilder.slice(0, i), ...bilder.slice(i + 1)];
}

// ── Kopplingar per option (2026-10-23) ──────────────────────────────────────
//
// Wix kopplar bilder per val (linkedMedia), och samma bild kan kopplas till
// val i flera optioner. Galleriet gav förut varje bild EN ägare, det första val
// som kopplade den, och visade den när det valet var valt. En bild som visar en
// viss kombination gick därför inte att visa bara där: bokhyllans stora hylla i
// brunt syntes under båda höjderna så länge bilden var kopplad till färgen, och
// under båda färgerna om den var kopplad till höjden (Leonard, 2026-10-23).
//
// Regeln nu: en bild syns när den, i VARJE option som kopplar den, är kopplad
// till det valda valet. Inom en option räcker ett av valen. En bild som är
// kopplad till Rustik brun och till 136 cm syns alltså bara för brun 136 cm, en
// bild som bara är kopplad till färgen syns för färgens alla storlekar, och en
// bild som är kopplad till två storlekar syns för båda. En sida där varje bild
// har högst en koppling ser ut precis som förut.

/**
 * Bildens kopplingar: fil-id → en lista per option som kopplar bilden, med
 * valens etiketter. [["Rustik brun och svart"], ["136 cm"]] är en bild av den
 * bruna hyllan på 136 cm.
 */
export type Kopplingar = Record<string, string[][]>;

/**
 * Kopplingarna ur optionernas val. `optioner` har en lista per option med
 * varje vals etikett och dess kopplade bilder (alla, i Wix ordning). Etiketten
 * ska vara densamma som väljaren visar.
 */
export function kopplingarPerOption(
  optioner: ReadonlyArray<ReadonlyArray<{ etikett: string; bilder: ReadonlyArray<string> }>>,
): Kopplingar {
  const ut: Kopplingar = {};
  for (const val of optioner) {
    const iOptionen: Record<string, string[]> = {};
    for (const v of val) {
      if (!v.etikett) continue;
      for (const url of v.bilder) {
        const k = imgKey(url);
        if (!k) continue;
        const lista = (iOptionen[k] ||= []);
        if (!lista.includes(v.etikett)) lista.push(v.etikett);
      }
    }
    for (const [k, etiketter] of Object.entries(iOptionen)) (ut[k] ||= []).push(etiketter);
  }
  return ut;
}

/**
 * Kopplingarna kompletterade med ägarna ur alt-texten (agareMedAltText): en
 * okopplad bild vars alt-text gav den en färg räknas som kopplad till färgen.
 */
export function medAgareUrAltText(kopplingar: Kopplingar, agare: Record<string, string>): Kopplingar {
  const ut: Kopplingar = { ...kopplingar };
  for (const [k, etikett] of Object.entries(agare)) {
    if (!(k in ut) && etikett) ut[k] = [[etikett]];
  }
  return ut;
}

/**
 * Galleriet för de valda etiketterna (en per option) enligt kopplingarna, med
 * `forst` först. Samma reserv som synligaBilder: syns ingen kopplad bild för
 * valet, eller blir listan tom, returneras hela listan oförändrad.
 */
export function synligaBilderForKombination(
  bilder: string[],
  kopplingar: Kopplingar | undefined,
  valda: string[],
  forst?: string,
): string[] {
  if (!kopplingar || !valda.length) return bilder;
  const valdaSet = new Set(valda);
  const passar = (u: string): boolean => {
    const grupper = kopplingar[imgKey(u)];
    return !grupper || grupper.every((etiketter) => etiketter.some((e) => valdaSet.has(e)));
  };
  const egna = bilder.some((u) => (kopplingar[imgKey(u)]?.length ?? 0) > 0 && passar(u));
  if (!egna) return bilder;
  const synliga = bilder.filter(passar);
  if (!synliga.length) return bilder;
  return medForst(synliga, forst);
}
