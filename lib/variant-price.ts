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
    // V3 keyar VAL på `choiceId` (INTE `id`, som alltid är undefined i V3-svaret) —
    // samma id som varianternas optionChoiceIds.choiceId pekar på. Att läsa c.id
    // hoppade över ALLA val → choices tom → null → single-axel-produkter (t.ex.
    // paviljongen Grå/Kräm) föll till SDK:ns text-läge UTAN variantbilder (ingen
    // bildväxling). v3MultiVariantData fixades redan; detta var samma bugg kvar i
    // single-axel-vägen.
    if (!c?.choiceId || !c?.name) continue;
    order.push(c.choiceId);
    meta[c.choiceId] = { name: c.name, image: c?.linkedMedia?.[0]?.image?.url || "" };
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

export type V3MultiVariantData = {
  /** En axel per options-dimension (t.ex. Färg + Storlek) — för en väljare var. */
  axes: { name: string; choices: { label: string; image: string }[] }[];
  /** Alla varianter: hel kombination → variant-id/pris/lager/bild. */
  table: {
    choices: Record<string, string>; // axelnamn → val-etikett
    variantId: string;
    price: string;
    priceNum: number;
    originalPrice: string;
    inStock: boolean;
    image: string;
  }[];
} | null;

/**
 * Multi-axel-variant (t.ex. Färg × Storlek). Det publika SDK:t ger bara FÖRSTA
 * axeln → kunden kunde inte välja t.ex. storlek och alla kombinationer visade
 * baspriset. Här byggs ALLA axlar (för en väljare var) + en variant-tabell som
 * mappar hela kombinationen → variant-id/pris/lager/bild, ur V3:s options +
 * variantsInfo. Returnerar null för single-axel (hanteras av v3VariantData) eller
 * när inget användbart finns. Ren funktion.
 */
export function v3MultiVariantData(product: any): V3MultiVariantData {
  const options = product?.options || [];
  if (options.length < 2) return null; // single-axel hanteras separat
  const variants = product?.variantsInfo?.variants || [];
  if (variants.length === 0) return null;

  // optionId → { namn, choiceId→namn, choiceId→bild }, samt axlarna i katalog-ordning.
  const optById: Record<string, { name: string; choiceName: Record<string, string>; choiceImage: Record<string, string> }> = {};
  const axes: { name: string; choices: { label: string; image: string }[] }[] = [];
  for (const opt of options) {
    if (!opt?.id || !opt?.name) continue;
    const choiceName: Record<string, string> = {};
    const choiceImage: Record<string, string> = {};
    const axisChoices: { label: string; image: string }[] = [];
    for (const c of opt?.choicesSettings?.choices || []) {
      // V3 keyar val på `choiceId` (INTE `id`) — varianternas optionChoiceIds.choiceId
      // pekar hit. Att läsa c.id (alltid undefined i V3-svaret) hoppade över ALLA val
      // → axeln blev tom → axes < 2 → multi-axel-data null → fleraxlade produkter
      // (t.ex. skjutdörren Längd × Typ) föll tillbaka till SDK:ns enda axel på live.
      // Matchar nu variant-loopens cid-uppslag (optionChoiceIds.choiceId) nedan.
      if (!c?.choiceId || !c?.name) continue;
      const img = c?.linkedMedia?.[0]?.image?.url || "";
      choiceName[c.choiceId] = c.name;
      choiceImage[c.choiceId] = img;
      axisChoices.push({ label: c.name, image: img });
    }
    if (axisChoices.length === 0) continue;
    optById[opt.id] = { name: opt.name, choiceName, choiceImage };
    axes.push({ name: opt.name, choices: axisChoices });
  }
  if (axes.length < 2) return null;

  const table: NonNullable<V3MultiVariantData>["table"] = [];
  for (const v of variants) {
    const choices: Record<string, string> = {};
    let image = "";
    let ok = true;
    for (const ch of v?.choices || []) {
      const oid = ch?.optionChoiceIds?.optionId;
      const cid = ch?.optionChoiceIds?.choiceId;
      const o = oid ? optById[oid] : undefined;
      const name = o && cid ? o.choiceName[cid] : undefined;
      if (!o || !name) { ok = false; break; }
      choices[o.name] = name;
      if (!image && cid) image = o.choiceImage[cid] || ""; // första val med bild (typ. färgen)
    }
    // Varianten måste täcka ALLA axlar för att kombinationen ska gå att matcha entydigt.
    if (!ok || Object.keys(choices).length !== axes.length) continue;
    const num = Number(v?.price?.actualPrice?.amount);
    if (!Number.isFinite(num)) continue;
    const cmp = Number(v?.price?.compareAtPrice?.amount);
    table.push({
      choices,
      variantId: v?.id || "",
      price: formatSek(num),
      priceNum: num,
      originalPrice: Number.isFinite(cmp) && cmp > num ? formatSek(cmp) : "",
      inStock: v?.inventoryStatus?.inStock !== false,
      image,
    });
  }
  return table.length >= 2 ? { axes, table } : null;
}
