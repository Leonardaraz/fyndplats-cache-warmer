// VEVOR-recensioner som gäller en annan artikel än produktens döljs (2026-10-30).
//
// VEVOR visar en familjs recensioner på varje artikel i familjen: uppmätt på 44
// sparade sidor gällde 129 av 424 recensioner sidans egen artikel och 295 en
// annan storlek, färg eller vara i samma familj. Importen sparade dem alla, och
// 4 044 av 5 182 VEVOR-utkast med recensioner delade minst en text med ett
// annat utkast. Läsaren sparar sedan 2026-10-30 vilken artikel varje recension
// gäller (`artikel`, lib/vevor/sida.ts), och importen tar bara recensioner om
// produktens egna artiklar. Det här verktyget gör samma sak med de rader som
// redan finns.
//
// En rad paras ihop med avläsningens recension på texten, som fotoverktyget
// (lib/vevor/recensionsfoton.ts). Gäller recensionen en artikel som inte finns
// på produkten döljs raden (status `rejected`, `doldAv: "annan_artikel"`). Blir
// artikeln en del av produkten senare, när familjer slås ihop, visas raden igen
// som väntande.
//
// Sex egenskaper som inte ska tas bort:
//
// 1. ☠️ Bara väntande rader döljs. En godkänd eller redigerad rad har en
//    människa sett, och den räknas (`synligaAnnan`) men rörs inte.
// 2. ☠️ Bara rader verktyget själv dolde visas igen. En rad en människa avvisat
//    saknar `doldAv` och rörs aldrig.
// 3. ☠️ En produkt vars avläsningar är från före 2026-10-30 hoppas över
//    (`vantar`): de säger inte vilken artikel recensionerna gäller.
// 4. En rad vars recension inte finns i avläsningarna, eller vars artikel inte
//    går att avgöra, räknas (`okanda`) och lämnas som den är.
// 5. Raden skrivs om med samma text, betyg och foton. Bara status och
//    `doldAv` ändras.
// 6. ☠️ Svaret bär bara antal och Wix-id. Recensionernas text och artikelnummer
//    går aldrig ut: loggen är publik.
//
// På en familj märks varje rad om en egen artikel med varianten kunden köpte
// (`kopt`, "Svart / 50 liter"), som importen gör sedan 2026-10-30. Namnet
// räknas ur mappningens val: värdena på de axlar som skiljer.

import type { ProductMappingRecord } from "@/lib/store";
import { VEVOR_ID_PREFIX } from "@/lib/store/leverantorsprefix";
import type { StoredReview } from "@/lib/store/reviews";
import type { Avlasning } from "./lager";
import { recensionsnyckel } from "./recensionsfoton";
import { recensionshinder } from "./to-product";

export interface RecensionsartikelDeps {
  mappningar(): Promise<ProductMappingRecord[]>;
  avlasningar(skus: string[]): Promise<Map<string, Avlasning>>;
  recensioner(productId: string): Promise<StoredReview[]>;
  spara(rad: StoredReview): Promise<void>;
  klocka?: () => number;
}

export interface RecensionsartikelVal {
  dryRun: boolean;
  /** Börja vid den här mappningen i listan (svarets `kvarFran`). */
  fran: number;
  budgetMs: number;
}

export interface RecensionsartikelSvar {
  dryRun: boolean;
  produkter: number;
  granskade: number;
  /** Produkter vars avläsningar är från före 2026-10-30. */
  vantar: number;
  /** VEVOR-rader som granskades. */
  rader: number;
  /** Rader om en av produktens egna artiklar. */
  egna: number;
  /** Väntande rader om en annan artikel: de som döljs. */
  attDolja: number;
  dolda: number;
  /** Rader på en familj som får varianten kunden köpte ("Köpt: …"). */
  attMarka: number;
  markta: number;
  /** Rader verktyget dolt förut som redan är dolda. */
  redanDolda: number;
  /** Rader verktyget dolt förut vars artikel nu finns på produkten. */
  attVisa: number;
  visade: number;
  /** Godkända eller redigerade rader om en annan artikel: rörs inte. */
  synligaAnnan: number;
  /** Rader en människa avvisat: rörs inte. */
  avvisadeAvManniska: number;
  /** Rader vars recension inte finns i avläsningarna eller vars artikel inte går att avgöra. */
  okanda: number;
  fel: number;
  kvarFran: number | null;
  /** Upp till 50 Wix-id för produkter med rader att dölja eller visa (torrt), eller som ändrades (skarpt). */
  idn: string[];
}

/** Produktens artiklar: radens varianter och `vevorArtiklar`. */
export function produktensArtiklar(m: Pick<ProductMappingRecord, "variants" | "vevorArtiklar">): Set<string> {
  const ut = new Set<string>();
  for (const v of m.variants) if (v.supplierVariantId) ut.add(v.supplierVariantId);
  for (const a of m.vevorArtiklar ?? []) ut.add(a.startsWith(VEVOR_ID_PREFIX) ? a.slice(VEVOR_ID_PREFIX.length) : a);
  return ut;
}

/**
 * Artikeln per recensionstext i avläsningarna. null när den inte går att avgöra:
 * artikeln saknas, eller två avläsningar säger olika om samma text.
 */
export function artikelPerText(avlasningar: Iterable<Avlasning>): Map<string, string | null> {
  const ut = new Map<string, string | null>();
  for (const a of avlasningar) {
    for (const r of a.recensioner ?? []) {
      const k = recensionsnyckel(r.text);
      const artikel = typeof r.artikel === "string" ? r.artikel : null;
      if (!ut.has(k)) ut.set(k, artikel);
      else if (ut.get(k) !== artikel) ut.set(k, null);
    }
  }
  return ut;
}

/**
 * Varje artikels variantnamn på en familj, ur mappningens val: värdena på de
 * axlar som skiljer ("Svart / 50 liter"). Tom för en produkt med en artikel.
 */
export function koptPerArtikel(m: Pick<ProductMappingRecord, "variants">): Map<string, string> {
  const ut = new Map<string, string>();
  const varianter = m.variants.filter((v) => v.supplierVariantId);
  if (varianter.length < 2) return ut;
  const axlar = [...new Set(varianter.flatMap((v) => Object.keys(v.choices ?? {})))];
  const lc = (x: string) => x.replace(/\s+/g, " ").trim().toLowerCase();
  const skiljer = axlar.filter((k) => new Set(varianter.map((v) => lc(v.choices?.[k] ?? ""))).size > 1);
  for (const v of varianter) {
    const namn = skiljer.map((k) => (v.choices?.[k] ?? "").trim()).filter(Boolean).join(" / ");
    if (namn) ut.set(v.supplierVariantId, namn);
  }
  return ut;
}

export type Radbeslut = "egen" | "dolj" | "redan_dold" | "visa" | "synlig_annan" | "okand" | "manniska";

/** Vad som ska hända med en rad. Ren. */
export function beslutFor(rad: StoredReview, artiklar: ReadonlySet<string>, perText: ReadonlyMap<string, string | null>): Radbeslut {
  const artikel = perText.get(recensionsnyckel(rad.textOriginal ?? ""));
  if (artikel === undefined || artikel === null) return "okand";
  const egen = artiklar.has(artikel);
  if (rad.status === "rejected") {
    if (rad.doldAv !== "annan_artikel") return "manniska";
    return egen ? "visa" : "redan_dold";
  }
  if (egen) return "egen";
  return rad.status === "pending" ? "dolj" : "synlig_annan";
}

export async function korRecensionsartikel(deps: RecensionsartikelDeps, val: RecensionsartikelVal): Promise<RecensionsartikelSvar> {
  const klocka = deps.klocka ?? Date.now;
  const start = klocka();
  const svar: RecensionsartikelSvar = {
    dryRun: val.dryRun,
    produkter: 0,
    granskade: 0,
    vantar: 0,
    rader: 0,
    egna: 0,
    attDolja: 0,
    dolda: 0,
    attMarka: 0,
    markta: 0,
    redanDolda: 0,
    attVisa: 0,
    visade: 0,
    synligaAnnan: 0,
    avvisadeAvManniska: 0,
    okanda: 0,
    fel: 0,
    kvarFran: null,
    idn: [],
  };
  const rader = (await deps.mappningar()).filter((m) => m.wixProductId && m.variants.length > 0 && !m.wixRaderad);
  svar.produkter = rader.length;
  let i = Math.max(0, val.fran);
  for (; i < rader.length; i++) {
    if (klocka() - start > val.budgetMs) break;
    const m = rader[i];
    svar.granskade++;
    try {
      const artiklar = produktensArtiklar(m);
      const avl = await deps.avlasningar([...artiklar]);
      if ([...avl.values()].some((a) => recensionshinder(a) !== null)) {
        svar.vantar++;
        continue;
      }
      const perText = artikelPerText(avl.values());
      const kopt = koptPerArtikel(m);
      const koptFor = (rad: StoredReview) => {
        const artikel = perText.get(recensionsnyckel(rad.textOriginal ?? ""));
        return artikel ? kopt.get(artikel) : undefined;
      };
      const sparade = (await deps.recensioner(m.wixProductId)).filter((r) => r.source === "vevor");
      let andrad = false;
      for (const rad of sparade) {
        svar.rader++;
        const beslut = beslutFor(rad, artiklar, perText);
        if (beslut === "egen") {
          svar.egna++;
          const variant = koptFor(rad);
          if (variant && rad.kopt !== variant) {
            svar.attMarka++;
            andrad = true;
            if (!val.dryRun) {
              await deps.spara({ ...rad, kopt: variant });
              svar.markta++;
            }
          }
        }
        else if (beslut === "redan_dold") svar.redanDolda++;
        else if (beslut === "synlig_annan") svar.synligaAnnan++;
        else if (beslut === "okand") svar.okanda++;
        else if (beslut === "manniska") svar.avvisadeAvManniska++;
        else if (beslut === "dolj") {
          svar.attDolja++;
          andrad = true;
          if (!val.dryRun) {
            await deps.spara({ ...rad, status: "rejected", doldAv: "annan_artikel" });
            svar.dolda++;
          }
        } else if (beslut === "visa") {
          svar.attVisa++;
          andrad = true;
          if (!val.dryRun) {
            const { doldAv: _bort, ...utan } = rad;
            const variant = koptFor(rad);
            await deps.spara({ ...utan, status: "pending", ...(variant ? { kopt: variant } : {}) });
            svar.visade++;
          }
        }
      }
      if (andrad && svar.idn.length < 50) svar.idn.push(m.wixProductId);
    } catch (err) {
      svar.fel++;
      // Bara felets namn: meddelandet kan bära en recensionstext.
      console.warn("[vevor-recensionsartikel] en produkt föll", err instanceof Error ? err.name : "");
    }
  }
  svar.kvarFran = i < rader.length ? i : null;
  return svar;
}
