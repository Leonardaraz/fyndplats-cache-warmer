// En publicerad sidas SEO-titel och metabeskrivning ska vara dess egna.
//
// ☠️ VARFÖR (2026-11-11). Semrush fann 63 publicerade sidor som delade titel med
// en annan sida (30 grupper) och fyra som delade metabeskrivning (två grupper).
// Sökmotorerna läser två sidor med samma titel som dubbletter och visar högst
// en av dem. Ingenting hade stoppat det: rundans grindar jämför bara produkterna
// i SAMMA runda, och syskonen polerades i olika rundor, ibland av olika chattar.
// Samma dag publicerades en fåtölj till med en titel som redan fanns.
//
// En regel man måste komma ihåg glöms bort. Därför frågar skrivvägen butiken
// själv, varje gång, och vägrar en plan vars titel eller beskrivning redan står
// på en annan publicerad sida (lib/polish/skrivplan.ts, stegText).
//
// Jämförelsen görs på en NYCKEL, inte på strängen: två av dubbletterna skilde
// sig till slut bara på ett kommatecken, och det gör dem inte till två titlar.

import type { WixAnrop } from "./skrivplan";

type Obj = Record<string, unknown>;

/** Butikens namn sist i varje titel. Det skiljer ingen sida från en annan. */
const SUFFIX = /\s*\|\s*fyndplats\s*$/i;

/**
 * Nyckeln två titlar (eller två beskrivningar) jämförs på: utan butikens suffix,
 * gemener, och bara bokstäver och siffror med ett mellanslag emellan. Skiljetecken,
 * tankstreck, gångertecken och dubbla mellanslag gör ingen skillnad.
 */
export function seoNyckel(text: string): string {
  return text
    .normalize("NFKC")
    .replace(SUFFIX, "")
    .toLocaleLowerCase("sv")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** En publicerad sidas titel och metabeskrivning, så som butiken visar dem. */
export interface PubliceradSeo {
  id: string;
  titel: string;
  besk: string;
}

const text = (x: unknown): string => (typeof x === "string" ? x.trim() : "");

/**
 * Titel och metabeskrivning ur en produkt i Wix svar. Taggarna går först; saknas
 * titeltaggen visar butiken produktens namn, så namnet är då sidans titel.
 */
export function seoUrProdukt(p: Obj): { titel: string; besk: string } {
  const tags = ((p.seoData as Obj | undefined)?.tags as Obj[] | undefined) ?? [];
  const titeltagg = tags.find((t) => t?.type === "title");
  const besktagg = tags.find((t) => t?.type === "meta" && (t.props as Obj | undefined)?.name === "description");
  return {
    titel: text(titeltagg?.children) || text(p.seoTitle) || text(p.name),
    besk: text((besktagg?.props as Obj | undefined)?.content) || text(p.seoDescription),
  };
}

/** 100 produkter per sida. Katalogen har cirka 6 200 publicerade (2026-11-11). */
export const MAX_SEO_SIDOR = 400;

/**
 * Frågan för en sida av läsningen: filtret på första sidan, bara markören sedan.
 *
 * ☠️ FILTRET FÅR INTE FÖLJA MED MARKÖREN. Markören bär redan frågan, och Wix
 * svarar `400 INVALID_CURSOR: "Sort or filter can not be specified together with
 * cursor"` när filtret skickas igen. Mätt mot butiken 2026-11-11 på just den här
 * frågan: sida två med filter och markör gav 400, sida två med bara markören gav
 * 200 och bara publicerade sidor. Samma fälla som lagerläsningen (2026-09-13)
 * och kategorikollen (2026-11-05) gick i. Här hade den fällt varje körning av
 * textsteget, eftersom katalogen är längre än en sida.
 */
export function seoFraga(markor: string | undefined): Obj {
  return {
    query: markor
      ? { cursorPaging: { limit: 100, cursor: markor } }
      : { filter: { visible: true }, cursorPaging: { limit: 100 } },
  };
}

/**
 * Alla PUBLICERADE produkters titel och metabeskrivning, färskt ur Wix.
 *
 * Frågan filtrerar på `visible: true` (mätt 2026-11-11: filtret biter åt båda
 * hållen, och utkasten är två tredjedelar av katalogen). Svaret prövas ändå:
 * en produkt med `visible: false` i svaret betyder att filtret inte bet, och då
 * kastar läsningen hellre än jämför mot utkastens tyska titlar.
 *
 * ☠️ Läsningen följer markören tills den tar slut. `hasNext: false` avslutar,
 * men ett svar UTAN `hasNext` gör det inte: en läsning som slutade där hade
 * gett en avkortad lista, och en avkortad lista släpper igenom en dubblett utan
 * att säga det. Av samma skäl kastar taket, det kortar inte av.
 */
export async function lasPubliceradSeo(wix: WixAnrop): Promise<PubliceradSeo[]> {
  const ut: PubliceradSeo[] = [];
  let markor: string | undefined;
  for (let sida = 0; ; sida++) {
    if (sida === MAX_SEO_SIDOR) {
      throw new Error(`de publicerade sidornas titlar passerade ${MAX_SEO_SIDOR} sidor — höj taket, en avkortad lista släpper igenom dubbletter`);
    }
    const svar = (await wix("POST", "/stores/v3/products/query", seoFraga(markor))) as Obj | null;
    const produkter = svar?.products;
    if (!Array.isArray(produkter)) throw new Error("frågan om publicerade sidors titlar svarade utan produktlista");
    for (const p of produkter as Obj[]) {
      if (p.visible === false) throw new Error("frågan om publicerade sidors titlar gav ett utkast — filtret bet inte");
      const id = text(p.id);
      if (!id) continue;
      ut.push({ id, ...seoUrProdukt(p) });
    }
    const paging = (svar?.pagingMetadata as Obj | undefined) ?? {};
    markor = text((paging.cursors as Obj | undefined)?.next) || undefined;
    if (!markor || produkter.length === 0 || paging.hasNext === false) break;
  }
  return ut;
}

export type SeoFalt = "seoTitel" | "seoBesk";

/** En produkt i en plan vars titel eller beskrivning redan står på en annan sida. */
export interface SeoKrock {
  /** Planens produkt, åtta tecken. */
  kort: string;
  falt: SeoFalt;
  /** Den andra sidans id, åtta tecken. */
  mot: string;
}

/** Det minsta en plan behöver bära för att jämföras. */
export interface SeoRadLik {
  kort: string;
  pid: string;
  seoTitel: string;
  seoBesk: string;
}

/**
 * Planens titlar och beskrivningar mot de publicerade sidornas.
 *
 * Planens egna produkter räknas inte som "andra sidor": en omskrivning av en
 * publicerad sida får behålla sin titel, och två produkter i samma plan får
 * byta titel med varandra. Dubbletter INOM planen fångas av `seoKrockarInom`.
 */
export function seoKrockar(rader: readonly SeoRadLik[], publicerade: readonly PubliceradSeo[]): SeoKrock[] {
  const egna = new Set(rader.map((r) => r.pid));
  const titlar = new Map<string, string>();
  const besk = new Map<string, string>();
  for (const p of publicerade) {
    if (egna.has(p.id)) continue;
    const t = seoNyckel(p.titel);
    const b = seoNyckel(p.besk);
    if (t && !titlar.has(t)) titlar.set(t, p.id);
    if (b && !besk.has(b)) besk.set(b, p.id);
  }
  const ut: SeoKrock[] = [];
  for (const r of rader) {
    const t = titlar.get(seoNyckel(r.seoTitel));
    if (t) ut.push({ kort: r.kort, falt: "seoTitel", mot: t.slice(0, 8) });
    const b = besk.get(seoNyckel(r.seoBesk));
    if (b) ut.push({ kort: r.kort, falt: "seoBesk", mot: b.slice(0, 8) });
  }
  return ut;
}

/** Två rader i SAMMA plan med samma titel eller samma beskrivning. `mot` är den första radens kort. */
export function seoKrockarInom(rader: readonly Pick<SeoRadLik, "kort" | "seoTitel" | "seoBesk">[]): SeoKrock[] {
  const sedda: Record<SeoFalt, Map<string, string>> = { seoTitel: new Map(), seoBesk: new Map() };
  const ut: SeoKrock[] = [];
  for (const r of rader) {
    for (const falt of ["seoTitel", "seoBesk"] as const) {
      const v = r[falt];
      if (typeof v !== "string") continue;
      const nyckel = seoNyckel(v);
      if (!nyckel) continue;
      const forsta = sedda[falt].get(nyckel);
      if (forsta !== undefined) ut.push({ kort: r.kort, falt, mot: forsta });
      else sedda[falt].set(nyckel, r.kort);
    }
  }
  return ut;
}

const FALTNAMN: Record<SeoFalt, string> = { seoTitel: "titeln", seoBesk: "metabeskrivningen" };

/** Krockarna i klartext för en publik logg: bara kort-id och fältnamn, aldrig texten. */
export function krocktext(krockar: readonly SeoKrock[]): string {
  return krockar.map((k) => `${k.kort}: ${FALTNAMN[k.falt]} står redan på ${k.mot}`).join("; ");
}
