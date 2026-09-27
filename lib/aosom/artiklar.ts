// Vilken Aosom-artikel bär en mappningsrad — och vilken bär en viss variant?
//
// VARFÖR DEN FINNS
//
// Fram till färgsammanslagningen (2026-09-27) var en Aosom-rad EN artikel:
// `supplierProductId` = "aosom:<artikel>", en variant, och den variantens
// `supplierVariantId` = samma artikel. Synken, beställningsfilen, dubblettspärren
// och bildfixen läste alla radens artikel och använde den för hela sidan.
//
// En sammanslagen sida är två (eller fler) artiklar på EN Wix-produkt: en färg
// per artikel, och varje färg har sitt eget saldo, sitt eget inköpspris och sitt
// eget artikelnummer hos Aosom. Läser en av de gamla vägarna radens artikel för
// hela sidan blir det fel på tre dyra sätt:
//
//   - synken skriver den ena färgens saldo på båda → vi säljer en färg Aosom
//     inte har,
//   - beställningsfilen beställer den ena färgens artikel → kunden får fel färg,
//   - dubblettspärren ser inte den andra artikeln → importen skapar ett nytt
//     utkast för en vara som redan ligger ute.
//
// Därför går alla dessa vägar via `aosomArtikelbild`, och den har TRE utfall.
//
//   "en"        Radens artikel gäller hela sidan. EXAKT det som gällde före
//               sammanslagningen, och det gäller för varje rad som inte bär
//               minst två olika artiklar på sina varianter. Ingen befintlig rad
//               byter beteende.
//   "flera"     En artikel per variant, var och en med sitt eget Wix-variant-id.
//   "tvetydig"  Varianterna bär olika artiklar men raden går inte att läsa
//               entydigt (saknat variant-id, två varianter med samma artikel,
//               radens artikel finns inte bland varianterna). Då får ingen väg
//               gissa: synken nollar lagret, beställningsfilen håller ordern.
//
// ☠️ ARTIKELNUMRET FÅR ALDRIG STÅ I ETT SKÄL. Skälen hamnar i svar som
// workflowerna skriver till PUBLIKA Actions-loggar. De namnger varianter med
// index, aldrig med nummer.

import type { FulfillmentTask } from "../orders/types";
import type { ProductMappingRecord } from "../store";
import { AOSOM_ID_PREFIX } from "./to-product";

/**
 * Variant-id:t en orderrad bär för en produkt UTAN optioner.
 *
 * ☠️ UPPMÄTT 2026-09-27 på skarpa ordrar: en enkelvariantsprodukt ger
 * `catalogReference.options.variantId = "00000000-…"` på orderraden — inte
 * produktens V3-variant-id (`aaf87acb…` för samma kattlåda i katalogen). En
 * produkt MED optioner ger det riktiga variant-id:t. Nollan betyder alltså
 * "produkten hade inga optioner när ordern lades", och den går aldrig att slå
 * upp mot mappningens `wixVariantId`.
 */
export const NIL_VARIANT_ID = "00000000-0000-0000-0000-000000000000";

export interface AosomVariantArtikel {
  /** Index i `m.variants`. */
  index: number;
  artikel: string;
  wixVariantId: string;
  sku: string;
  choices: Record<string, string>;
}

export type AosomArtikelbild =
  | { typ: "en"; artikel: string }
  | { typ: "flera"; artikel: string; varianter: AosomVariantArtikel[] }
  | { typ: "tvetydig"; artikel: string; skal: string };

type Rad = Pick<ProductMappingRecord, "supplierProductId" | "variants">;

/** Radens artikel utan prefix, eller "" när raden inte är en Aosom-rad. */
export function radensArtikel(m: Pick<ProductMappingRecord, "supplierProductId">): string {
  const id = (m.supplierProductId ?? "").trim();
  return id.startsWith(AOSOM_ID_PREFIX) ? id.slice(AOSOM_ID_PREFIX.length) : "";
}

export function aosomArtikelbild(m: Rad): AosomArtikelbild {
  const artikel = radensArtikel(m);
  const varianter = m.variants ?? [];
  const artiklar = varianter.map((v) => (v.supplierVariantId ?? "").trim());
  const olika = new Set(artiklar.filter(Boolean));

  // Allt som inte bär minst två OLIKA artiklar är en vanlig rad — exakt som
  // före sammanslagningen. Det är den här raden som gör att ingen befintlig
  // mappning byter beteende.
  if (varianter.length <= 1 || olika.size <= 1) return { typ: "en", artikel };

  if (artiklar.some((a) => !a)) {
    return { typ: "tvetydig", artikel, skal: "en variant saknar artikelnummer" };
  }
  if (olika.size !== varianter.length) {
    return { typ: "tvetydig", artikel, skal: "två varianter bär samma artikelnummer" };
  }
  const idn = varianter.map((v) => (v.wixVariantId ?? "").trim());
  if (idn.some((id) => !id)) {
    return { typ: "tvetydig", artikel, skal: "en variant saknar Wix-variant-id" };
  }
  if (new Set(idn).size !== idn.length) {
    return { typ: "tvetydig", artikel, skal: "två varianter bär samma Wix-variant-id" };
  }
  if (!artikel || !olika.has(artikel)) {
    return { typ: "tvetydig", artikel, skal: "radens artikelnummer finns inte bland varianterna" };
  }

  return {
    typ: "flera",
    artikel,
    varianter: varianter.map((v, index) => ({
      index,
      artikel: artiklar[index],
      wixVariantId: idn[index],
      sku: (v.sku ?? "").trim(),
      choices: v.choices ?? {},
    })),
  };
}

/**
 * Varje artikel raden bär — radens egen plus varianternas på en
 * flerartikelrad. För dubblettspärren och ommappningens "redan upptagen"-koll:
 * en artikel som sitter som färg på en publicerad sida är upptagen lika mycket
 * som en som sitter på en egen rad.
 *
 * En tvetydig rad bidrar med ALLA sina artiklar. Fel åt det hållet ger en
 * utebliven import; fel åt det andra ett nytt utkast för en vara som redan
 * ligger ute.
 */
export function aosomArtiklarPaRaden(m: Rad): string[] {
  const artikel = radensArtikel(m);
  if (!artikel) return [];
  const bild = aosomArtikelbild(m);
  if (bild.typ === "en") return [artikel];
  const ut = new Set([artikel]);
  for (const v of m.variants ?? []) {
    const a = (v.supplierVariantId ?? "").trim();
    if (a) ut.add(a);
  }
  return [...ut];
}

export type ArtikelFörTask = { artikel: string } | { skal: string };

function sammaVal(a: Record<string, string>, b: Record<string, string>): boolean {
  const ka = Object.keys(a).filter((k) => (a[k] ?? "").trim());
  const kb = Object.keys(b).filter((k) => (b[k] ?? "").trim());
  if (ka.length === 0 || ka.length !== kb.length) return false;
  return ka.every((k) => (b[k] ?? "").trim().toLowerCase() === (a[k] ?? "").trim().toLowerCase());
}

/**
 * Vilken artikel ska beställas för en orderrad?
 *
 * ☠️ ALDRIG EN GISSNING. Går varianten inte att avgöra svarar funktionen med ett
 * skäl, och beställningsfilen håller då HELA ordern för en människa. En
 * felbeställd färg är ett paket kunden inte ville ha, en retur och en ny frakt
 * — dyrare än en order som väntar en dag.
 *
 * Vanlig rad ("en"): radens artikel, precis som förut — med ETT undantag. En
 * enkelvariantsprodukt ger alltid nollan som variant-id på orderraden (se
 * `NIL_VARIANT_ID`). Bär en orderrad ett annat id än radens enda variant har
 * produkten alltså fått optioner som mappningen inte känner till — exakt läget
 * efter en sammanslagning där Wix skrevs men mappningen inte gjorde det. Att då
 * beställa radens artikel kunde skicka fel färg.
 *
 * Flerartikelrad: variant-id:t avgör. En order lagd FÖRE sammanslagningen bär
 * nollan (eller inget id alls, om tasken skapades innan fältet fanns) och
 * matchas i stället på variantens SKU, sedan på valen.
 */
export function aosomArtikelForTask(
  task: Pick<FulfillmentTask, "wixVariantId" | "sku" | "variantChoices">,
  m: Rad,
): ArtikelFörTask {
  const bild = aosomArtikelbild(m);
  if (bild.typ === "tvetydig") return { skal: `mappningen är tvetydig: ${bild.skal}` };

  const vid = (task.wixVariantId ?? "").trim();
  const riktigtId = vid && vid !== NIL_VARIANT_ID ? vid : "";

  if (bild.typ === "en") {
    if (!bild.artikel) return { skal: "raden saknar artikelnummer" };
    const varianter = m.variants ?? [];
    const kant = (varianter[0]?.wixVariantId ?? "").trim();
    if (riktigtId && varianter.length === 1 && kant && kant !== riktigtId) {
      return {
        skal: "orderraden bär en variant som mappningen inte känner till — "
          + "sidan kan ha fått en färg som inte är mappad",
      };
    }
    return { artikel: bild.artikel };
  }

  if (riktigtId) {
    const traff = bild.varianter.find((v) => v.wixVariantId === riktigtId);
    return traff
      ? { artikel: traff.artikel }
      : { skal: "orderradens variant finns inte bland mappningens varianter" };
  }

  const sku = (task.sku ?? "").trim();
  if (sku) {
    const traffar = bild.varianter.filter((v) => v.sku && v.sku === sku);
    if (traffar.length === 1) return { artikel: traffar[0].artikel };
    if (traffar.length > 1) return { skal: "två varianter bär orderradens SKU" };
  }

  const val = task.variantChoices ?? {};
  const traffar = bild.varianter.filter((v) => sammaVal(v.choices, val));
  if (traffar.length === 1) return { artikel: traffar[0].artikel };

  return { skal: "orderradens färg gick inte att avgöra — varken variant-id, SKU eller val matchar" };
}
