// VEVOR steg 8: syskonen slås ihop till en produkt vid importen (Leonard
// 2026-10-29: "kan vi när vi hämtar produkter göra så att de slås ihop med
// sina syskon på en gång?").
//
// VEVOR:s sida länkar artikelns syskon (`DETAIL_ATTR_LINK`, lib/vevor/sida.ts),
// och varje syskon har en egen sida med sina egna värden (`PRODUCT_DATA.attr`,
// `egenskaper` på avläsningen). En familj blir en produkt med en variant per
// artikel och en axel per egenskap. Varje variant bär sitt eget artikelnummer,
// sitt eget saldo och sitt eget inköp, som en sammanslagen Aosom-sida
// (lib/aosom/artiklar.ts, utfallet "flera").
//
// Uppmätt på 35 sparade sidor 2026-10-29: 7 hade syskon, 2–6 artiklar per
// familj, en till tre axlar ("Typ", "Kabellängd", "Färg & Längd").
//
// Fem egenskaper som inte ska tas bort:
//
// 1. ☠️ Bara syskon med en egen avläsning följer med. Värdena kommer från
//    syskonets egen sida, aldrig från länklistan: den säger inte vilken
//    kombination syskonet är.
// 2. ☠️ Varje artikel måste ha samma axlar, och ingen kombination får finnas
//    två gånger. Annars går varianterna inte att skilja åt, och då blir
//    artikeln en egen produkt som förut (`ej_sammanslagen`).
// 3. ☠️ Ett syskon som redan sitter på en produkt följer inte med. Det hade
//    blivit samma vara på två sidor.
// 4. Ett syskon som är slut följer med med saldo 0. Annars hade det blivit en
//    egen produkt när det kommer tillbaka.
// 5. ☠️ Ett syskon vars avläsning saknar betyg (läst före steg 8), specifikation
//    eller recensionernas artikel (läst före 2026-10-30) gör att hela familjen
//    väntar på nästa läsning. Annars hade det lämnats utanför familjen och
//    sedan aldrig fått komma in, eller saknats i familjens flik.
// 6. ☠️ Ett syskon som inte lästs alls men står i läsarens kö (`arPaVag`) gör
//    också att familjen väntar (Leonard 2026-10-30: "Gör det som blir
//    proffsigast"). Annars hade artikeln importerats ensam, och syskonet blivit
//    en egen produkt när det lästs. Ett syskon som inte står i kön, är borta,
//    eller vars sida inte går att läsa väntar familjen inte på: då hade den
//    väntat för alltid.
// 7. ☠️ Familjeregeln (Leonard 2026-10-30, lib/vevor/axelklass.ts): bara färg,
//    mönster, storlek, längd och förpackningsstorlek delar en sida. En axel för
//    funktion (effekt, kapacitet, modell, antal lådor) ger egna sidor
//    (`funktion`), och en axel som inte går att avgöra likaså (`oklar_axel`).
//    En axel med samma värde för alla avgör inte. Regeln prövas efter Wix
//    gränser, så att `for_manga_axlar` och `for_langt_namn` säger det verkliga
//    skälet.
//
// ☠️ VARJE FÄRG FÅR SINA EGNA BILDER (Leonard 2026-10-30: "Ja gör det
// noggrant"). Familjen fick först ankarets sex bilder och bara huvudbilden från
// varje syskon. Traktorskopskyddet i tre färger visade då en bild för grön och
// orange och sju för röd, och den röda huvudbilden låg två gånger i galleriet.
// Nu ligger varje artikels egna bilder i galleriet, ankaret först, och kopplas
// till artikelns värde på bildaxeln (`valBilder`, lib/import/types.ts). Varje
// bild laddas upp en gång. Syskonens bilder ligger i egna mappar hos VEVOR,
// så ingen adress delas mellan två artiklar (uppmätt på traktorskopskyddet, 3 × 12
// egna bilder, 0 gemensamma). Skulle en adress ändå delas kopplas den till den
// första artikeln som har den. Wix tar högst 50 bilder per produkt, så en familj
// med fler än åtta artiklar får färre än sex bilder per artikel, minst en.
//
// Ren modul.

import { WIX_MAX_BILDER_PER_PRODUKT, WIX_MAX_OPTIONS_PER_PRODUCT, WIX_MAX_VALNAMN } from "@/lib/wix/limits";
import type { AliExpressProduct } from "@/lib/import/types";
import type { Avlasning, Sidrad } from "./lager";
import { medlemshinder, specifikation, kostnadUsd, vevorProdukt, type Prisunderlag } from "./to-product";
import { BILDER_PER_PRODUKT, type Bildval } from "./bilder";
import { arFunktionsrad, familjensKlass } from "./axelklass";

export type FamiljSkal =
  | "utan_egenskaper"
  | "olika_axlar"
  | "samma_kombination"
  | "for_manga_axlar"
  | "for_langt_namn"
  /** En axel är en funktion (effekt, kapacitet, modell): egna sidor (lib/vevor/axelklass.ts). */
  | "funktion"
  /** En axel går inte att avgöra: egna sidor, och gränsfallet listas för Leonard. */
  | "oklar_axel";

export const FAMILJ_SKAL: readonly FamiljSkal[] = [
  "utan_egenskaper",
  "olika_axlar",
  "samma_kombination",
  "for_manga_axlar",
  "for_langt_namn",
  "funktion",
  "oklar_axel",
];

export type Familj =
  /** Inga syskon att slå ihop med: artikeln blir en egen produkt. */
  | { typ: "ensam" }
  /** Ett syskon saknar betyg, eller är oläst men står i läsarens kö: familjen väntar. */
  | { typ: "vanta" }
  /** Syskonen går inte att skilja åt: artikeln blir en egen produkt. */
  | { typ: "ej_sammanslagen"; skal: FamiljSkal }
  | {
      typ: "familj";
      /** Ankaret först, sedan syskonen i artikelnummerordning. */
      medlemmar: Avlasning[];
      /** Axlarna i ankarets ordning. */
      axlar: string[];
      /** Axeln vars värden är olika för varje artikel, eller null. Den bär varianternas bilder. */
      bildaxel: string | null;
    };

/**
 * Ska familjen vänta på syskonets sida? Bara när sidan står i läsarens kö och
 * inte har prövats, eller senast föll på ett övergående fel. En sida som
 * lästs (då finns en avläsning, eller ett annat artikelnummer), är borta,
 * saknas, har flyttat, är spärrad eller inte går att tolka väntar familjen inte
 * på.
 */
export function arPaVag(r: Sidrad | undefined): boolean {
  if (!r || r.borta) return false;
  return r.senastUtfall === null || r.senastUtfall === "tillfalligt" || r.senastUtfall === "skrivfel";
}

/** Syskonens artikelnummer, utan artikeln själv, en gång var. */
export function syskonSkus(a: Pick<Avlasning, "sku" | "syskon">): string[] {
  return [...new Set((a.syskon ?? []).map((s) => s.sku).filter((s) => s && s !== a.sku))];
}

/**
 * Ett värde som det ska stå på varianten. Mellanslagen rensas, och en känd
 * felöversättning hos VEVOR rättas: "20 M" (meter) blev "20 miljoner" på en
 * längdaxel (uppmätt 2026-10-29). Ett variantvärde går inte att döpa om i Wix
 * efteråt, så det rättas här.
 */
export function rensaVarde(axel: string, varde: string): string {
  const v = varde.replace(/\s+/g, " ").trim();
  const m = /^(\d+(?:[.,]\d+)?)\s*miljoner$/i.exec(v);
  if (m && /längd/i.test(axel)) return `${m[1]} m`;
  return v;
}

/** Artikelns egenskaper som axel → värde, rensade. Tomma tas bort. */
export function egenskaperFor(a: Pick<Avlasning, "egenskaper">): Record<string, string> {
  const ut: Record<string, string> = {};
  for (const [k, v] of a.egenskaper ?? []) {
    const axel = k.replace(/\s+/g, " ").trim();
    const varde = rensaVarde(axel, v ?? "");
    if (axel && varde && !(axel in ut)) ut[axel] = varde;
  }
  return ut;
}

/** Axlarna som skiljer artiklarna åt, med sina värden. */
export function skiljandeAxlar(axlar: readonly string[], varden: readonly Record<string, string>[]): { namn: string; varden: string[] }[] {
  return axlar
    .map((k) => ({ namn: k, varden: varden.map((v) => v[k] ?? "") }))
    .filter((a) => new Set(a.varden.map((x) => x.toLowerCase())).size > 1);
}

/** Familjeregeln: null när axlarna får dela en sida, annars skälet. */
export function regelFor(axlar: readonly string[], varden: readonly Record<string, string>[]): "funktion" | "oklar_axel" | null {
  const klass = familjensKlass(skiljandeAxlar(axlar, varden));
  return klass === "funktion" ? "funktion" : klass === "oklar" ? "oklar_axel" : null;
}

/**
 * Artikelns värde på varje axel: egenskapen på sidan (en länkad familj), annars
 * raden i specifikationen med samma namn (en familj med samma SPU, vars axlar
 * kommer ur specifikationen).
 */
export function familjeVarden(m: Pick<Avlasning, "egenskaper" | "spec">, axlar: readonly string[]): Record<string, string> {
  const e = egenskaperFor(m);
  const spec = new Map((m.spec ?? []).map(([k, v]) => [k.replace(/\s+/g, " ").trim().toLowerCase(), (v ?? "").replace(/\s+/g, " ").trim()]));
  const ut: Record<string, string> = {};
  for (const k of axlar) {
    const v = e[k] ?? spec.get(k.replace(/\s+/g, " ").trim().toLowerCase());
    if (v) ut[k] = rensaVarde(k, v);
  }
  return ut;
}

/**
 * Familjen artikeln hör till.
 *
 * `lasta` är syskonens avläsningar. `upptagen` svarar sant för en artikel som
 * redan sitter på en produkt (id med prefix). `pavag` är artikelnumren för
 * syskon utan avläsning vars sida står i läsarens kö (`arPaVag`).
 */
export function byggFamilj(
  ankare: Avlasning,
  lasta: ReadonlyMap<string, Avlasning>,
  nu: number,
  upptagen: (sku: string) => boolean,
  pavag: ReadonlySet<string> = new Set(),
): Familj {
  const syskon: Avlasning[] = [];
  for (const sku of syskonSkus(ankare).sort()) {
    if (upptagen(sku)) continue;
    const m = lasta.get(sku);
    if (!m || m.sku !== sku) {
      if (pavag.has(sku)) return { typ: "vanta" };
      continue;
    }
    if (m.spu !== ankare.spu) continue;
    const h = medlemshinder(m, nu);
    if (h === "betyg_okant" || h === "spec_okant" || h === "recension_okand") return { typ: "vanta" };
    if (h === null) syskon.push(m);
  }
  if (syskon.length === 0) return { typ: "ensam" };

  const medlemmar = [ankare, ...syskon];
  const varden = medlemmar.map(egenskaperFor);
  if (varden.some((v) => Object.keys(v).length === 0)) return { typ: "ej_sammanslagen", skal: "utan_egenskaper" };
  const axlar = Object.keys(varden[0]);
  const nyckel = (v: Record<string, string>) => Object.keys(v).sort().join("\u0001");
  if (varden.some((v) => nyckel(v) !== nyckel(varden[0]))) return { typ: "ej_sammanslagen", skal: "olika_axlar" };
  if (axlar.length > WIX_MAX_OPTIONS_PER_PRODUCT) return { typ: "ej_sammanslagen", skal: "for_manga_axlar" };
  // Wix avvisar hela produkten när en axel eller ett värde är längre än 50 tecken.
  if (varden.some((v) => Object.entries(v).some(([k, x]) => k.length > WIX_MAX_VALNAMN || x.length > WIX_MAX_VALNAMN)))
    return { typ: "ej_sammanslagen", skal: "for_langt_namn" };
  const kombination = (v: Record<string, string>) => axlar.map((k) => (v[k] ?? "").toLowerCase()).join("\u0001");
  if (new Set(varden.map(kombination)).size !== varden.length) return { typ: "ej_sammanslagen", skal: "samma_kombination" };
  // ☠️ Familjeregeln (Leonard 2026-10-30): bara färg, mönster, storlek, längd
  // och förpackning delar en sida. En axel med samma värde för alla skiljer
  // inte varianterna åt och avgör inte.
  const regel = regelFor(axlar, varden);
  if (regel) return { typ: "ej_sammanslagen", skal: regel };

  const bildaxel =
    axlar.find((k) => new Set(varden.map((v) => (v[k] ?? "").toLowerCase())).size === varden.length) ?? null;
  return { typ: "familj", medlemmar, axlar, bildaxel };
}

/** Familjens galleri, uppdelat på de foton ett värde har ensamt och de som flera delar. */
export interface Familjegalleri {
  /** Galleriet: varje foto en gång, i medlemmarnas ordning. */
  imageUrls: string[];
  /** Foton som bara ett värde har, per värde. De kopplas till värdet. */
  perVarde: Record<string, string[]>;
  /** Foton som flera värden har. De kopplas inte och syns för alla värden. */
  gemensamma: string[];
}

/**
 * Familjens galleri och bilderna per värde: varje artikels egna bilder, i
 * medlemmarnas ordning, så att ankarets första bild blir huvudbilden. Högst
 * `WIX_MAX_BILDER_PER_PRODUKT` bilder, fördelade lika mellan artiklarna (minst
 * en var så länge taket räcker).
 *
 * ☠️ Varje FOTO tas en gång, inte varje adress. `nyckel` ger fotots innehåll
 * (md5, lib/vevor/bildinnehall.ts): VEVOR lägger samma foto under olika
 * adresser för varje storlek. Ett foto som bara ett värde har kopplas till det
 * värdet. Ett foto som flera värden har kopplas inte: butiken ger varje bild
 * EN ägare (headless-site lib/variant-bilder.ts), och en bild utan ägare visas
 * för alla val. Utan nyckel jämförs adresserna.
 */
export function familjensBilder(
  medlemmar: Avlasning[],
  bildval: (a: Avlasning) => Bildval,
  varde: (i: number) => string,
  nyckel: (url: string) => string = (u) => u,
): Familjegalleri {
  const perArtikel = Math.min(BILDER_PER_PRODUKT, Math.max(1, Math.floor(WIX_MAX_BILDER_PER_PRODUKT / medlemmar.length)));
  const forsta = new Map<string, string>();
  const agare = new Map<string, Set<string>>();
  const perMedlem: { v: string; nycklar: string[] }[] = [];
  const imageUrls: string[] = [];
  for (const [i, m] of medlemmar.entries()) {
    const v = varde(i);
    const nycklar: string[] = [];
    for (const url of bildval(m).urls) {
      if (nycklar.length >= perArtikel) break;
      const k = nyckel(url);
      if (nycklar.includes(k)) continue;
      if (!forsta.has(k)) {
        if (imageUrls.length >= WIX_MAX_BILDER_PER_PRODUKT) continue;
        forsta.set(k, url);
        imageUrls.push(url);
      }
      nycklar.push(k);
      (agare.get(k) ?? agare.set(k, new Set()).get(k)!).add(v);
    }
    perMedlem.push({ v, nycklar });
  }
  const perVarde: Record<string, string[]> = {};
  for (const { v, nycklar } of perMedlem) {
    const egna = nycklar.filter((k) => agare.get(k)!.size === 1).map((k) => forsta.get(k)!);
    if (egna.length > 0) perVarde[v] = [...(perVarde[v] ?? []), ...egna];
  }
  const gemensamma = imageUrls.filter((u) => agare.get(nyckel(u))!.size > 1);
  return { imageUrls, perVarde, gemensamma };
}

/**
 * Varje varians namn: värdena på de axlar som skiljer, i axlarnas ordning
 * ("Svart / 50 liter"). Samma namn står i familjens flik och i recensionernas
 * "Köpt: …". En variant utan värde heter "variant N".
 */
export function variantEtiketter(
  medlemmar: readonly Pick<Avlasning, "spec" | "egenskaper">[],
  axlar: readonly string[],
): string[] {
  const lc = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const varden = medlemmar.map((m) => familjeVarden(m, axlar));
  const skiljer = axlar.filter((k) => new Set(varden.map((v) => lc(v[k] ?? ""))).size > 1);
  return varden.map((v, i) => skiljer.map((k) => v[k] ?? "").filter(Boolean).join(" / ") || `variant ${i + 1}`);
}

/**
 * Familjens specifikation, utan axlarnas rader: värdena på axlarna står i
 * väljaren, och en axel med samma värde för alla lägger pipelinen till som en
 * rad (lib/import/constant-axes.ts).
 *
 * ☠️ En rad som skiljer mellan artiklarna visar varje varians värde
 * ("24 tum: 610 mm · 36 tum: 914 mm"). Beskrivningen är densamma för alla
 * varianter, och fram till 2026-10-30 stod ankarets värde där: i 107 av 143
 * uppmätta familjer visade fliken fel mått, färg eller effekt för den som valt
 * en annan variant. Varianter med samma värde delar det ("4 st, 6 st: …"). En
 * rad som bara vissa artiklar har visas för dem.
 *
 * Raderna kommer i ankarets ordning, och sedan de rader bara andra artiklar
 * har. Varianten namnges med sina värden på de axlar som skiljer.
 */
export function familjensSpec(
  medlemmar: readonly Pick<Avlasning, "spec" | "egenskaper">[],
  axlar: readonly string[],
): Record<string, string> {
  if (medlemmar.length === 0) return {};
  const lc = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const a = new Set(axlar.map(lc));
  const tabeller = medlemmar.map((m) => {
    const t = new Map<string, string>();
    for (const [k, v] of Object.entries(specifikation({ spec: m.spec, egenskaper: [] }))) t.set(lc(k), v);
    return t;
  });
  const etiketter = variantEtiketter(medlemmar, axlar);

  const nycklar: string[] = [];
  const sedda = new Set<string>();
  for (const m of medlemmar) {
    for (const k of Object.keys(specifikation({ spec: m.spec, egenskaper: [] }))) {
      const n = lc(k);
      if (a.has(n) || sedda.has(n)) continue;
      sedda.add(n);
      nycklar.push(k);
    }
  }

  const ut: Record<string, string> = {};
  for (const k of nycklar) {
    const n = lc(k);
    const per = tabeller.map((t) => t.get(n));
    const finns = per.filter((v): v is string => v !== undefined);
    if (finns.length === medlemmar.length && new Set(finns.map(lc)).size === 1) {
      ut[k] = finns[0];
      continue;
    }
    const grupper = new Map<string, { varde: string; vilka: string[] }>();
    per.forEach((v, i) => {
      if (v === undefined) return;
      const g = grupper.get(lc(v)) ?? { varde: v, vilka: [] };
      g.vilka.push(etiketter[i]);
      grupper.set(lc(v), g);
    });
    ut[k] = [...grupper.values()].map((g) => `${g.vilka.join(", ")}: ${g.varde}`).join(" · ");
  }
  return ut;
}

/**
 * Familjen som pipelinens produkt: ankarets text och specifikation, och en
 * variant per artikel med dess egna värden, saldo och inköp.
 *
 * Värdena och axlarnas namn är VEVOR:s egen svenska och skickas som manuella
 * namn (`variantNameOverrides`, `axisNameOverrides`), så att pipelinen varken
 * översätter dem eller flaggar dem. Med en `bildaxel` får varje artikel sina
 * egna bilder kopplade till sitt värde, och foton som flera artiklar har blir
 * gemensamma (`familjensBilder`). Utan en får produkten ankarets bilder,
 * okopplade.
 */
export function vevorFamiljeProdukt(
  f: Extract<Familj, { typ: "familj" }>,
  pris: Prisunderlag,
  bilder: Bildval,
  bildval: (a: Avlasning) => Bildval,
  nyckel?: (url: string) => string,
): AliExpressProduct {
  const [ankare] = f.medlemmar;
  const bas = vevorProdukt(ankare, pris, bilder);
  const spec = familjensSpec(f.medlemmar, f.axlar);
  const varianter = f.medlemmar.map((m) => {
    const v = familjeVarden(m, f.axlar);
    return {
      supplierVariantId: m.sku,
      options: Object.fromEntries(f.axlar.map((k) => [k, v[k]])),
      costUsd: kostnadUsd(m, pris),
      // Bufferten är 0 (Leonard 2026-10-28): VEVOR:s saldo rakt av.
      stock: m.saldo > 0 ? m.saldo : 0,
      included: true,
    };
  });
  const namn: Record<string, string> = {};
  for (const v of varianter) for (const varde of Object.values(v.options)) namn[varde] = varde;
  const axel = f.bildaxel;
  const galleri = axel ? familjensBilder(f.medlemmar, bildval, (i) => varianter[i].options[axel], nyckel) : null;
  return {
    ...bas,
    variants: varianter,
    inStock: varianter.some((v) => v.stock > 0),
    specifications: spec,
    variantNameOverrides: namn,
    axisNameOverrides: Object.fromEntries(f.axlar.map((k) => [k, k])),
    ...(axel && galleri && galleri.imageUrls.length > 0
      ? {
          imageUrls: galleri.imageUrls,
          valBilder: { [axel]: galleri.perVarde },
          ...(galleri.gemensamma.length > 0 ? { gemensammaBilder: galleri.gemensamma } : {}),
        }
      : {}),
  };
}

// ── Familjer med samma SPU (Leonard 2026-10-30) ────────────────────────────
//
// VEVOR länkar inte alla varianter. Artiklar med samma SPU (VEVOR:s
// produktfamilj) och samma betyg delar recensioner och är ofta samma vara i
// olika storlek, färg eller förpackning, utan länk mellan sidorna. Uppmätt
// 2026-10-30: 637 sådana grupper med 2 271 artiklar.
//
// Axlarna kommer ur specifikationen: raderna som skiljer, där rader som delar
// upp artiklarna likadant är samma axel. Sex villkor, alla måste hålla:
//
// 1. ☠️ Ingen artikel i gruppen länkar till en annan. Länkade familjer bygger
//    byggFamilj. Importen räknar bara artiklar utan länkar till gruppen, så
//    en ensam artikel i en länkad familjs SPU blir ingen grupp.
// 2. ☠️ Samma betyg (snitt och antal) på varje artikel. Det visar att VEVOR
//    räknar dem som samma familj.
// 3. En eller två axlar, värden högst 50 tecken, varje kombination en gång.
// 4. ☠️ Titlarna förklaras av axlarna: varje ord som skiljer en artikels titel
//    från de andras finns i dess egna värden. "850W" i titeln utan en axel för
//    effekt betyder att något annat skiljer.
// 5. ☠️ Familjeregeln (lib/vevor/axelklass.ts) på axlarna, och ingen rad i en
//    axel får visa en funktion som skiljer ("Effekt" som följer med storleken).
// 6. Ett syskon som redan sitter på en produkt följer inte med, ett som väntar
//    på läsaren får familjen att vänta, som i byggFamilj.

/** Rader som följer storleken eller är artikelns egna och därför aldrig är en axel. */
const INTE_AXEL = /vikt|förpack|forpack|paket|modell|artikel|varumärke|märke|ean|garanti|certifi/i;

const ord = (s: string) =>
  s
    .toLowerCase()
    .replace(/^vevor\s+/, "")
    .split(/[^0-9a-zåäöüéß]+/)
    .filter(Boolean);

/** Specifikationens skiljande rader, grupperade i axlar. Ren. */
export function specAxlar(
  medlemmar: readonly Pick<Avlasning, "spec">[],
): { axlar: string[]; rader: string[][]; skiljer: string[] } | "ingen_axel" | "for_manga_axlar" {
  const lc = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const kartor = medlemmar.map((m) => new Map((m.spec ?? []).map(([k, v]) => [k.replace(/\s+/g, " ").trim(), (v ?? "").replace(/\s+/g, " ").trim()])));
  if (kartor.some((k) => k.size === 0)) return "ingen_axel";
  const gemensamma = [...kartor[0].keys()].filter((k) => kartor.every((kk) => kk.has(k)));
  const skiljer = gemensamma.filter((k) => new Set(kartor.map((kk) => lc(kk.get(k)!))).size > 1);
  const dims = new Map<string, string[]>();
  for (const k of skiljer) {
    if (INTE_AXEL.test(k)) continue;
    const forsta = new Map<string, number>();
    const monster = kartor
      .map((kk) => {
        const v = lc(kk.get(k)!);
        if (!forsta.has(v)) forsta.set(v, forsta.size);
        return forsta.get(v);
      })
      .join(",");
    dims.set(monster, [...(dims.get(monster) ?? []), k]);
  }
  if (dims.size === 0) return "ingen_axel";
  if (dims.size > 2) return "for_manga_axlar";
  const rader = [...dims.values()];
  // Axeln är raden med de kortaste värdena: "Antal" före "Förpackningens innehåll".
  const langst = (k: string) => Math.max(...kartor.map((kk) => kk.get(k)!.length));
  const axlar = rader.map((r) => [...r].sort((a, b) => langst(a) - langst(b))[0]);
  return { axlar, rader, skiljer };
}

/** Förklaras varje artikels titel av dess egna värden? Ren. */
export function titlarnaForklaras(medlemmar: readonly Pick<Avlasning, "namn" | "spec">[], skiljer: readonly string[]): boolean {
  const alla = medlemmar.map((m) => new Set(ord(m.namn ?? "")));
  const gemensamma = new Set([...alla[0]].filter((w) => alla.every((a) => a.has(w))));
  return medlemmar.every((m, i) => {
    const spec = new Map((m.spec ?? []).map(([k, v]) => [k.replace(/\s+/g, " ").trim(), v ?? ""]));
    const egna = new Set(skiljer.flatMap((k) => ord(spec.get(k) ?? "")));
    return [...alla[i]].every((w) => gemensamma.has(w) || egna.has(w));
  });
}

/**
 * Familjen ur artiklarna med samma SPU som ankaret. `grupp` är de andra
 * avläsningarna med samma SPU. Se villkoren ovan.
 */
export function byggSpuFamilj(
  ankare: Avlasning,
  grupp: readonly Avlasning[],
  nu: number,
  upptagen: (sku: string) => boolean,
): Familj {
  if (!ankare.spu) return { typ: "ensam" };
  const andra = grupp
    .filter((m) => m.sku !== ankare.sku && m.spu === ankare.spu && !m.borta)
    .sort((a, b) => (a.sku < b.sku ? -1 : a.sku > b.sku ? 1 : 0));
  if (andra.length === 0) return { typ: "ensam" };
  const alla = [ankare, ...andra];
  const skus = new Set(alla.map((m) => m.sku));
  if (alla.some((m) => syskonSkus(m).some((s) => skus.has(s)))) return { typ: "ensam" };
  // ☠️ Ett betyg som saknas på avläsningen (läst före steg 8) går inte att
  // jämföra: gruppen väntar på nästa läsning i stället för att bli egna sidor.
  if (andra.some((m) => !upptagen(m.sku) && m.betyg === undefined)) return { typ: "vanta" };
  const b0 = ankare.betyg;
  if (!b0 || alla.some((m) => !m.betyg || m.betyg.antal !== b0.antal || m.betyg.snitt !== b0.snitt)) return { typ: "ensam" };

  const medlemmar: Avlasning[] = [ankare];
  for (const m of andra) {
    if (upptagen(m.sku)) continue;
    const h = medlemshinder(m, nu);
    if (h === "betyg_okant" || h === "spec_okant" || h === "recension_okand") return { typ: "vanta" };
    if (h === null) medlemmar.push(m);
  }
  if (medlemmar.length < 2) return { typ: "ensam" };

  const sa = specAxlar(medlemmar);
  if (sa === "ingen_axel") return { typ: "ensam" };
  if (sa === "for_manga_axlar") return { typ: "ej_sammanslagen", skal: "for_manga_axlar" };
  const varden = medlemmar.map((m) => familjeVarden(m, sa.axlar));
  if (sa.axlar.some((k) => k.length > WIX_MAX_VALNAMN) || varden.some((v) => Object.values(v).some((x) => x.length > WIX_MAX_VALNAMN)))
    return { typ: "ej_sammanslagen", skal: "for_langt_namn" };
  const kombination = (v: Record<string, string>) => sa.axlar.map((k) => (v[k] ?? "").toLowerCase()).join("\u0001");
  if (new Set(varden.map(kombination)).size !== varden.length) return { typ: "ej_sammanslagen", skal: "samma_kombination" };
  if (!titlarnaForklaras(medlemmar, sa.skiljer)) return { typ: "ensam" };
  const regel = regelFor(sa.axlar, varden);
  if (regel) return { typ: "ej_sammanslagen", skal: regel };
  const specVarden = (k: string) => medlemmar.map((m) => familjeVarden(m, [k])[k] ?? "");
  if (sa.rader.some((r) => r.some((k) => arFunktionsrad(k, specVarden(k))))) return { typ: "ej_sammanslagen", skal: "funktion" };

  const bildaxel = sa.axlar.find((k) => new Set(varden.map((v) => (v[k] ?? "").toLowerCase())).size === varden.length) ?? null;
  return { typ: "familj", medlemmar, axlar: sa.axlar, bildaxel };
}

