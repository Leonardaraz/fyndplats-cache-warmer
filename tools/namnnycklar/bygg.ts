// tools/namnnycklar/bygg.ts
//
// Bygger lib/namnnycklar-data.ts ur en fil med jämförelsesajtens namn på våra
// varor (kolumnerna pr_namn, sakerhet och slug). Se "Jämförelsesajtens namn
// på varan" i lib/search.ts.
//
//   node --experimental-strip-types --no-warnings tools/namnnycklar/bygg.ts \
//     <koppling.csv> <sparat sökindex.json> [klasser, standard A]
//
// ☠️ FILEN MED NAMNEN LIGGER UTANFÖR REPOT och checkas aldrig in. Verktyget
// skriver bara nycklar och våra egna adresser, och det skriver aldrig ut ett
// namn: bara antal. Repot är publikt.
//
// Sökindexet (/api/search-index, sparat till en fil) avgör vilka varor som
// finns: en nyckel till en vara som inte står i indexet skrivs inte.

import { readFileSync, writeFileSync } from "node:fs";

// Sökmodulen laddas vid körning, som i tools/sok-matning: en statisk import
// med filändelsen fäller typkontrollen, och utan den hittar Node inte filen.
type Sokmodul = {
  MINST_ORD: number;
  BORJAN_MINST_ORD: number;
  namnnyckel: (text: string) => string | null;
  namnetsNycklar: (text: string) => string[];
  markeForstINamn: (namn: string) => string | null;
  markesnyckel: (marke: string) => string;
};
const sok = (await import(new URL("../../lib/search.ts", import.meta.url).href)) as Sokmodul;

/** Fler varor än så på samma nyckel: namnet säger inte vilken vara det är. */
export const FLEST_VAROR_PER_NYCKEL = 3;

/** En CSV-rad med citattecken och kommatecken i fälten (RFC 4180). */
export function lasCsv(text: string): Record<string, string>[] {
  const rader: string[][] = [];
  let rad: string[] = [];
  let falt = "";
  let iCitat = false;
  const t = text.replace(/^﻿/, "");
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (iCitat) {
      if (c === '"' && t[i + 1] === '"') { falt += '"'; i++; }
      else if (c === '"') iCitat = false;
      else falt += c;
    } else if (c === '"') iCitat = true;
    else if (c === ",") { rad.push(falt); falt = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      rad.push(falt); falt = "";
      if (rad.length > 1 || rad[0] !== "") rader.push(rad);
      rad = [];
    } else falt += c;
  }
  if (falt !== "" || rad.length > 0) { rad.push(falt); rader.push(rad); }
  const [huvud, ...kropp] = rader;
  return kropp.map((r) => Object.fromEntries(huvud.map((namn, i) => [namn, r[i] ?? ""])));
}

export interface Bygge {
  /** Vår adress → nycklarna för namnen som pekar på varan, sorterade. */
  perVara: Record<string, string[]>;
  rakning: Record<string, number>;
}

/**
 * Nycklarna för raderna i de valda klasserna. `finns` säger om en adress står
 * i sökindexet. Svaret bär aldrig ett namn.
 */
export function byggNycklar(rader: readonly Record<string, string>[], klasser: ReadonlySet<string>, finns: (slug: string) => boolean): Bygge {
  const rakning: Record<string, number> = { rader: 0, forFaOrd: 0, varanSaknas: 0, utanAdress: 0, nycklar: 0, flertydiga: 0, forMangaVaror: 0, varor: 0, medMarke: 0 };
  const perNyckel = new Map<string, Set<string>>();
  // Märket namnet börjar med, per vara (lib/search.ts, medMarkesvaror). Också
  // för ett namn med för få ord för en nyckel: märket gäller varan ändå.
  const marken = new Map<string, Set<string>>();
  for (const r of rader) {
    if (!klasser.has((r.sakerhet || "").trim())) continue;
    rakning.rader++;
    const slug = (r.slug || "").trim();
    if (!slug) { rakning.utanAdress++; continue; }
    if (!finns(slug)) { rakning.varanSaknas++; continue; }
    const marke = sok.markeForstINamn(r.pr_namn || "");
    if (marke) {
      let m = marken.get(slug);
      if (!m) marken.set(slug, (m = new Set()));
      m.add(marke);
    }
    // Hela namnet, och varje början på minst fyra ord (namnetsNycklar).
    const nycklar = sok.namnetsNycklar(r.pr_namn || "");
    if (nycklar.length === 0) { rakning.forFaOrd++; continue; }
    for (const nyckel of nycklar) {
      let varor = perNyckel.get(nyckel);
      if (!varor) perNyckel.set(nyckel, (varor = new Set()));
      varor.add(slug);
    }
  }
  const perVara: Record<string, string[]> = {};
  for (const [nyckel, varor] of perNyckel) {
    if (varor.size > FLEST_VAROR_PER_NYCKEL) { rakning.forMangaVaror++; continue; }
    if (varor.size > 1) rakning.flertydiga++;
    rakning.nycklar++;
    for (const slug of varor) (perVara[slug] ??= []).push(nyckel);
  }
  // Märkesnyckeln sist i räkningen, så att `nycklar` är namnens: en summa som de andra.
  for (const [slug, m] of marken) {
    rakning.medMarke++;
    for (const marke of m) {
      (perVara[slug] ??= []).push(sok.markesnyckel(marke));
      rakning[`marke_${marke}`] = (rakning[`marke_${marke}`] ?? 0) + 1;
    }
  }
  for (const slug of Object.keys(perVara)) perVara[slug] = [...new Set(perVara[slug])].sort();
  rakning.varor = Object.keys(perVara).length;
  return { perVara, rakning };
}

/** Datafilen som text: adresserna i bokstavsordning, så att en ombyggnad ger en läsbar diff. */
export function somModul(perVara: Record<string, string[]>, datum: string, klasser: string): string {
  const rader = Object.keys(perVara).sort().map((slug) => `  ${JSON.stringify(slug)}: ${JSON.stringify(perVara[slug])},`);
  return [
    "// lib/namnnycklar-data.ts",
    "//",
    `// BYGGD AV tools/namnnycklar/bygg.ts ${datum}, klass ${klasser}. Ändra inte för hand.`,
    "//",
    "// Vår adress → nycklarna för jämförelsesajtens namn på varan: hela namnet,",
    "// varje början på minst fyra ord, och märket namnet börjar med (namnetsNycklar",
    "// och markesnyckel i lib/search.ts). Här står inga namn och inga märken, bara",
    "// enkelriktade summor.",
    "//",
    "// ☠️ BARA SERVERN LÄSER DEN HÄR FILEN (app/api/search-index och app/sok).",
    "// Sökrutan får nycklarna med indexet, rad för rad, för de varor som finns.",
    "",
    "export const NAMNNYCKLAR: Readonly<Record<string, readonly string[]>> = {",
    ...rader,
    "};",
    "",
  ].join("\n");
}

if (process.argv[1] && process.argv[1].endsWith("bygg.ts")) {
  const [csv, indexfil, klassval = "A"] = process.argv.slice(2);
  if (!csv || !indexfil) {
    console.error("Användning: bygg.ts <koppling.csv> <sparat sökindex.json> [klasser, standard A]");
    process.exit(1);
  }
  const index = JSON.parse(readFileSync(indexfil, "utf8")) as { s?: string }[];
  const adresser = new Set(index.map((h) => h.s).filter((s): s is string => typeof s === "string" && s.length > 0));
  const klasser = new Set(klassval.split(",").map((k) => k.trim()).filter(Boolean));
  const { perVara, rakning } = byggNycklar(lasCsv(readFileSync(csv, "utf8")), klasser, (s) => adresser.has(s));
  const ut = new URL("../../lib/namnnycklar-data.ts", import.meta.url);
  writeFileSync(ut, somModul(perVara, new Date().toISOString().slice(0, 10), [...klasser].join(",")));
  console.log(`minst ${sok.MINST_ORD} ord per nyckel, högst ${FLEST_VAROR_PER_NYCKEL} varor per nyckel, ${adresser.size} varor i indexet`);
  console.log(JSON.stringify(rakning));
}
