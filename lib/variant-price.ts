// Per-val variantdata (pris, variant-id, bild) ur en V3-produkt.
//
// Bakgrund: storefronten läser produkter via det publika @wix/stores-OAuth-SDK:t
// (queryProducts). För V3-katalogen släpper SDK:t per-variant-PRISET (precis som
// det släpper choice.media) → PDP:n visade då BASpriset för alla varianter, vilket
// är fel för storleksvarianter med olika pris (t.ex. 2 L vs 30 L fick samma pris).
// getProduct hydrerar därför priserna autentiserat via V3 REST och använder den här
// rena, SDK-/fetch-fria parsningen (enhetstestbar med node --test).
//
// Samma SDK-begränsning gäller per-variant-LAGRET → en slut-variant kunde köpas på
// sidan (produkten räknades som "i lager" så länge NÅGON variant fanns). Vi läser
// därför även `inventoryStatus.inStock` per variant ur samma V3-svar.

const SEK_FMT = new Intl.NumberFormat("sv-SE", {
  style: "currency",
  currency: "SEK",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Svenskt valutaformat: 1082.9 → "1 082,90 kr". */
export function formatSek(n: number): string {
  return SEK_FMT.format(n);
}

export type V3VariantData = {
  optionName: string;
  choices: {
    label: string;
    image: string;
    variantId: string;
    price: string;
    priceNum: number;
    originalPrice: string;
    inStock: boolean;
  }[];
} | null;

/**
 * Bygger per-val variantdata ur en V3-produkts `options[0]` + `variantsInfo`.
 * Varianternas choices är i V3 keyade på optionId/choiceId, så vi mappar
 * choiceId → val-namn via `options[0].choicesSettings.choices`, och kopplar
 * varje vals pris/variant-id från `variantsInfo.variants[].price.actualPrice`.
 *
 * Single-option-antagande (samma som extractOptions i products.ts) — fler-options-
 * produkter mappar inte 1:1 choice→pris och hoppas över (null → SDK-beteendet
 * behålls). Returnerar null om inget användbart finns (fail-open).
 */
export function v3VariantData(product: any): V3VariantData {
  const options = product?.options || [];
  if (options.length !== 1) return null; // bara single-option
  const opt = options[0];
  const variants = product?.variantsInfo?.variants || [];
  if (!opt || variants.length === 0) return null;

  // choiceId → { namn, bild }, i katalogens val-ordning.
  const order: string[] = [];
  const meta: Record<string, { name: string; image: string }> = {};
  for (const c of opt?.choicesSettings?.choices || []) {
    if (!c?.id || !c?.name) continue;
    order.push(c.id);
    meta[c.id] = { name: c.name, image: c?.linkedMedia?.[0]?.image?.url || "" };
  }

  // choiceId → variantpris/-id/lager (första varianten per val).
  const byChoiceId: Record<string, { variantId: string; price: string; priceNum: number; originalPrice: string; inStock: boolean }> = {};
  for (const v of variants) {
    const cid = v?.choices?.[0]?.optionChoiceIds?.choiceId;
    if (!cid || byChoiceId[cid]) continue;
    const num = Number(v?.price?.actualPrice?.amount);
    if (!Number.isFinite(num)) continue;
    const cmp = Number(v?.price?.compareAtPrice?.amount);
    byChoiceId[cid] = {
      variantId: v?.id || "",
      price: formatSek(num),
      priceNum: num,
      originalPrice: Number.isFinite(cmp) && cmp > num ? formatSek(cmp) : "",
      // Slut i lager bara när Wix EXPLICIT säger inStock:false; saknat fält → i lager
      // (bryt inte produkter där statusen inte hydrerats).
      inStock: v?.inventoryStatus?.inStock !== false,
    };
  }

  const choices = order
    .filter((cid) => byChoiceId[cid] && meta[cid])
    .map((cid) => ({ label: meta[cid].name, image: meta[cid].image, ...byChoiceId[cid] }));
  return choices.length >= 2 ? { optionName: opt.name, choices } : null;
}
