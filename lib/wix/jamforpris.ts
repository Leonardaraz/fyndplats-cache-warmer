// Jämförpriset (Wix `compareAtPrice`) per variant: läsningen för hela katalogen
// och skrivningen på en produkt. NÄR ett jämförpris får stå avgörs i
// lib/pricing/rea.ts (lagen och husets regler); körningen är lib/pricing/rea-kor.ts.
//
// ☠️ BARA JÄMFÖRPRISET ÄNDRAS. Skrivningen är en variantsInfo-PATCH som skickar
// varianterna ordagrant ur produktens egen GET (med MERCHANT_DATA, så att
// kostnaden följer med), bara med jämförpriset ändrat på de varianter som ska
// ändras, och `visible` och `options` med (annars kan en variantsInfo-PATCH
// publicera ett utkast, och en flervariantsprodukt ger 428). Priset hämtas
// aldrig ur planen. Efter skrivningen läses produkten och lagret om och jämförs
// med läget före (`jamforForeEfter`): namn, adress, synlighet, val, variant-id,
// SKU, pris, kostnad, synlighet, jämförpriset på varje variant som inte skrevs,
// och lagret. Minsta avvikelse stoppar körningen.
//
// ☠️ ETT JÄMFÖRPRIS SÄTTS BARA PÅ DET PRIS BESLUTET GÄLLDE. Har priset ändrats
// mellan läsningen och skrivningen (synken skrev) sätts inget jämförpris på den
// varianten; nästa körning räknar om. Att TA BORT ett jämförpris är alltid
// tillåtet: det påstår ingenting.
//
// ☠️ EN SKRIVNING MED VAL-ID NOLLSTÄLLER VARIANTENS BILD på en
// flervariantsprodukt (CLAUDE.md, lärdom 204 och 234). `refreshVariantMedia`
// följer därför efter, och en avvikelse därifrån stoppar också.
//
// ☠️ MERCHANT_DATA NEKAD (403) SKRIVER INGENTING. En skrivning som inte kan läsa
// kostnaden hade ersatt varianterna utan den (lib/wix/produkt-kostnad.ts).
//
// ☠️ SVARET BÄR BARA WIX-ID OCH RÄKNARE. Det hamnar i en publik Actions-logg.

import type { WixAnrop } from "../polish/skrivplan";
import { tillOre, tillBelopp } from "../pricing/rea";
import { variantsInfoMedKostnad } from "./produkt-kostnad";
import { redigeraFeltext, svepaVarianter } from "./variant-svep";
import {
  VARIANTBILD_FALT,
  jamforForeEfter,
  lasLager,
  lasProdukt,
  lasProduktTillRevision,
  optionerAv,
  refreshVariantMedia,
  varianterAv,
  type VariantbildStatus,
} from "./variant-media";

type Obj = Record<string, unknown>;

const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const paus = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ── Katalogens priser ────────────────────────────────────────────────────

export interface VariantPris {
  variantId: string;
  productId: string;
  /**
   * Varianten går att köpa: produkten och varianten är synliga. Lagret räknas
   * inte: ett pris som visas för en slutsåld variant är ändå ett pris vi
   * tillämpat, och att räkna det kan bara sänka det lägsta priset.
   */
  erbjuden: boolean;
  /** `actualPrice` i öre, null när det saknas. */
  prisOre: number | null;
  /** `compareAtPrice` i öre, null när varianten inte har något. */
  jamforOre: number | null;
}

/**
 * Golv: färre varianter än så är en halvläst katalog. En variant som saknas i
 * svepet hade fått sin historik avbruten och sitt jämförpris orört.
 */
export const MIN_VARIANTER = 4000;

/**
 * Varje variants pris och jämförpris, ur Read-Only Variants API. Uppmätt
 * 2026-11-01: `price.actualPrice.amount` och `price.compareAtPrice.amount` som
 * text med två decimaler ("1669.00"), `visible` på varianten och
 * `productData.visible` på produkten, utan `fields`.
 */
export async function lasVariantpriser(
  wix: WixAnrop,
  vanta: (ms: number) => Promise<void> = paus,
): Promise<VariantPris[]> {
  const rader = await svepaVarianter(wix, { golv: MIN_VARIANTER, vanta });
  return rader.map((v) => {
    const pris = obj(v.price);
    const prisOre = tillOre(obj(pris.actualPrice).amount);
    return {
      variantId: str(v.id),
      productId: str(obj(v.productData).productId),
      erbjuden: obj(v.productData).visible !== false && v.visible !== false && prisOre !== null,
      prisOre,
      jamforOre: tillOre(obj(pris.compareAtPrice).amount),
    };
  });
}

// ── Skrivningen på en produkt ────────────────────────────────────────────

/** Vad en variant ska ha: ett jämförpris (öre) eller inget (`null`). */
export interface OnskatJamforpris {
  jamforOre: number | null;
  /** Priset (öre) beslutet gällde. Ett jämförpris sätts bara om priset står kvar där. */
  prisOre: number | null;
}

export type JamforStatus =
  | "skriven" // skriven, läst om, allt utom jämförpriset på de skrivna varianterna oförändrat
  | "redan_klar" // inget att skriva (varje variant hade redan det önskade, eller priset hade ändrats)
  | "torr" // inget skrevs
  | "avvikelse" // skrivningen ändrade något annat, eller jämförpriset syns inte efteråt — STOPP
  | "fel"; // läsningen eller skrivningen föll, ingenting ändrat

export interface JamforUtfall {
  productId: string;
  status: JamforStatus;
  /** Varianter som fick (eller torrt: skulle få) ett jämförpris. */
  satta: number;
  /** Varianter vars jämförpris togs bort (eller torrt: skulle tas bort). */
  borttagna: number;
  /** Varianter som redan hade det önskade. */
  redan: number;
  /** Önskade varianter som inte finns på produkten. */
  saknas: number;
  /** Varianter där priset ändrats sedan beslutet: inget jämförpris sattes. */
  prisAndrat: number;
  variantbild?: VariantbildStatus;
  avvikelser?: string[];
  fel?: string;
}

export interface JamforSkrivOpts {
  torr?: boolean;
  vanta?: (ms: number) => Promise<void>;
  /** Omläsningar medan Wix läsning släpar efter skrivningen. */
  omlasningar?: number;
  /** Byts bara i tester. Default: `refreshVariantMedia`. */
  foljUpVariantbild?: (productId: string, minRevision: number) => Promise<{ status: VariantbildStatus; avvikelser?: string[] }>;
}

const jamforAv = (v: Obj): number | null => tillOre(obj(obj(v.price).compareAtPrice).amount);
const prisAv = (v: Obj): number | null => tillOre(obj(obj(v.price).actualPrice).amount);

/**
 * Beloppen som tal i varje variant ("1669.00" och "1669" är samma pris), så att
 * jämförelsen före och efter inte fäller på Wix sätt att skriva ett belopp.
 */
function medTalBelopp(p: Obj): Obj {
  const ut = structuredClone(p) as Obj;
  const normera = (b: unknown) => {
    const o = obj(b);
    if (typeof o.amount === "string" || typeof o.amount === "number") {
      const n = Number(o.amount);
      if (Number.isFinite(n)) o.amount = String(n);
    }
  };
  for (const v of varianterAv(ut)) {
    const pris = obj(v.price);
    normera(pris.actualPrice);
    normera(pris.compareAtPrice);
    normera(obj(v.revenueDetails).cost);
  }
  return ut;
}

/**
 * Skriver jämförpriserna på en produkt och läser tillbaka. Kastar aldrig: ett fel
 * blir `fel` (ingenting ändrat) eller, efter en skrivning, `avvikelse` (vi vet
 * inte vad Wix har), så att en körning som skriver många produkter stannar.
 */
export async function skrivJamforpriser(
  wix: WixAnrop,
  productId: string,
  onskat: ReadonlyMap<string, OnskatJamforpris>,
  opts: JamforSkrivOpts = {},
): Promise<JamforUtfall> {
  const vanta = opts.vanta ?? paus;
  const utfall = (status: JamforStatus, rest: Partial<JamforUtfall> = {}): JamforUtfall => ({
    productId,
    status,
    satta: 0,
    borttagna: 0,
    redan: 0,
    saknas: 0,
    prisAndrat: 0,
    ...rest,
  });
  let skrivet = false;
  try {
    let fore: Obj | null;
    try {
      fore = await lasProdukt(wix, productId, VARIANTBILD_FALT);
    } catch (e) {
      const t = String((e as Error)?.message ?? e);
      if (/Wix 403|NO_PERMISSION_TO_READ_MERCHANT_DATA/i.test(t)) {
        return utfall("fel", { fel: "nyckeln får inte läsa varukostnaden (MERCHANT_DATA, 403) — ingenting skrevs" });
      }
      throw e;
    }
    if (!fore) return utfall("fel", { fel: "produkten gick inte att läsa" });
    const varianter = varianterAv(fore);

    // variant-id → nytt jämförpris (öre), eller null för att ta bort det.
    const att = new Map<string, number | null>();
    let redan = 0;
    let saknas = 0;
    let prisAndrat = 0;
    for (const [id, o] of onskat) {
      const v = varianter.find((x) => str(x.id) === id);
      if (!v) {
        saknas++;
        continue;
      }
      const nu = jamforAv(v);
      if (o.jamforOre === null) {
        if (nu === null) redan++;
        else att.set(id, null);
        continue;
      }
      const pris = prisAv(v);
      // Beslutet gällde ett pris. Har priset ändrats, eller är jämförpriset inte
      // högre än priset, sätts ingenting: nästa körning räknar om.
      if (pris === null || pris !== o.prisOre || o.jamforOre <= pris) {
        prisAndrat++;
        continue;
      }
      if (nu === o.jamforOre) redan++;
      else att.set(id, o.jamforOre);
    }
    let satta = 0;
    let borttagna = 0;
    for (const j of att.values()) {
      if (j === null) borttagna++;
      else satta++;
    }
    const bas = { satta, borttagna, redan, saknas, prisAndrat };
    if (att.size === 0) return utfall("redan_klar", bas);
    if (opts.torr) return utfall("torr", bas);

    // Det som ska stå efter skrivningen: läget före med jämförpriserna ändrade.
    const ny = structuredClone(fore) as Obj;
    for (const v of varianterAv(ny)) {
      const id = str(v.id);
      if (!att.has(id)) continue;
      const j = att.get(id) ?? null;
      v.price = { ...obj(v.price), compareAtPrice: j === null ? null : { amount: tillBelopp(j) } };
    }
    // `profit` och `profitMargin` räknas av Wix och är skrivskyddade: bara kostnaden går tillbaka.
    const variants = (variantsInfoMedKostnad(obj(ny.variantsInfo)).variants ?? []) as unknown[];
    const harOptions = optionerAv(ny).length > 0;
    const bevaraSynlighet = typeof fore.visible === "boolean";
    const body = {
      product: {
        revision: fore.revision,
        variantsInfo: { variants },
        ...(bevaraSynlighet ? { visible: fore.visible } : {}),
        ...(harOptions ? { options: ny.options } : {}),
      },
      fieldMask: {
        paths: ["variantsInfo", ...(bevaraSynlighet ? ["visible"] : []), ...(harOptions ? ["options"] : [])],
      },
    };

    const lagerFore = await lasLager(wix, productId);
    const svar = obj(await wix("PATCH", `/stores/v3/products/${encodeURIComponent(productId)}`, body));
    skrivet = true;

    // ☠️ Läsningen släpar efter skrivningen: läs om tills revisionen gått fram.
    const patchRev = Number(obj(svar.product).revision);
    const minRevision = Number.isFinite(patchRev) ? patchRev : Number(fore.revision) + 1;
    const efter = await lasProduktTillRevision(
      wix,
      productId,
      VARIANTBILD_FALT,
      minRevision,
      vanta,
      Math.max(1, opts.omlasningar ?? 5),
    );
    if (!efter) return utfall("avvikelse", { ...bas, avvikelser: ["produkten gick inte att läsa efter skrivningen"] });
    const lagerEfter = await lasLager(wix, productId);

    const avvikelser = jamforForeEfter(
      { produkt: medTalBelopp(ny), lager: lagerFore },
      { produkt: medTalBelopp(efter), lager: lagerEfter },
    );
    for (const [id, j] of att) {
      const v = varianterAv(efter).find((x) => str(x.id) === id);
      if (!v) avvikelser.push(`variant ${id.slice(0, 8)}: finns inte efter skrivningen`);
      else if (jamforAv(v) !== j) {
        avvikelser.push(`variant ${id.slice(0, 8)}: jämförpriset ${j === null ? "står kvar" : "syns inte"} efter skrivningen`);
      }
    }
    if (Number(efter.revision) <= Number(fore.revision)) avvikelser.push("revisionen gick inte fram, skrivningen syns inte");
    if (avvikelser.length > 0) {
      console.error(`[jamforpris] ${productId}: AVVIKELSE efter skrivningen — ${avvikelser.join("; ")}`);
      return utfall("avvikelse", { ...bas, avvikelser });
    }

    // ☠️ En skrivning med val-id nollställer variantens bild: rätta den, och stanna om rättningen avviker.
    let variantbild: VariantbildStatus | undefined;
    if (varianterAv(efter).length >= 2) {
      const foljUp = opts.foljUpVariantbild
        ?? (async (id: string, rev: number) => {
          const u = await refreshVariantMedia(wix, id, { minRevision: rev, vanta });
          return { status: u.status, avvikelser: u.avvikelser };
        });
      const u = await foljUp(productId, Number(efter.revision));
      variantbild = u.status;
      if (u.status === "avvikelse") {
        console.error(`[jamforpris] ${productId}: variantbilden avvek efter jämförpriset — ${(u.avvikelser ?? []).join("; ")}`);
        return utfall("avvikelse", { ...bas, variantbild, avvikelser: u.avvikelser ?? ["variantbilden avvek"] });
      }
      if (u.status === "fel" || u.status === "ej_rattad") {
        console.warn(`[jamforpris] ${productId}: variantbild ${u.status} efter jämförpriset`);
      }
    }
    return utfall("skriven", { ...bas, ...(variantbild ? { variantbild } : {}) });
  } catch (e) {
    const fel = redigeraFeltext(String((e as Error)?.message ?? e)).slice(0, 300);
    // Föll kontrollen EFTER en skrivning vet vi inte vad Wix har: en avvikelse, så att körningen stannar.
    if (skrivet) {
      console.error(`[jamforpris] ${productId}: kontrollen efter skrivningen föll — ${fel}`);
      return utfall("avvikelse", { avvikelser: [`kontrollen efter skrivningen föll: ${fel}`], fel });
    }
    console.warn(`[jamforpris] ${productId}: ${fel}`);
    return utfall("fel", { fel });
  }
}
