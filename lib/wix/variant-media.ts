// Variantens bild ska följa valet: `variantsInfo.variants[].media`.
//
// VARFÖR MODULEN FINNS (2026-10-03). Wix Catalog V3 räknar själv fram
// variantens `media` ur valets `linkedMedia`. Fältet är skrivskyddat, och Wix
// räknar bara om det när varianterna skickas med valen angivna ENBART med namn
// (`optionChoiceNames`), så som Wix egen redigerare gör. Motorns skrivningar
// skickar `variantsInfo` ordagrant ur GET:en, alltså med `optionChoiceIds`, och
// då behåller Wix den gamla bilden. Bilderna kopplas till valen efter att
// produkten skapats, när variantbilden redan är satt till huvudbilden, så den
// fastnade där. Varukorgen (Cart v2 `lineItems[].image`), Wix kassa och ordern
// visade därför första färgens bild oavsett vald färg.
//
// Receptet är fångat ur redigerarens anrop, prövat via API och kört på 566
// publicerade produkter den 3 oktober. Före och efter varje skrivning
// kontrollerades id, SKU, pris, lager, synlighet, bildordning och kostnad, och
// allt var oförändrat. Den kontrollen bor här, i `jamforForeEfter`.
//
// ☠️ UTKAST ÄR OPRÖVADE. Alla 566 var publicerade, och en variantsInfo-PATCH
// har publicerat ett utkast förut (CLAUDE.md). `visible` skickas därför med på
// produkten, men utkast skrivs bara med `utkast: true`, som kräver Leonards ja
// efter ett prov på ett enda utkast.
//
// ☠️ Skicka aldrig `inventoryItem` (då blir svarets `inventoryResults` tomt och
// lagret orört) och aldrig variantens `media` (Wix ignorerar det).

import type { WixAnrop } from "../polish/skrivplan";

type Obj = Record<string, unknown>;

/** Projektionen för att JÄMFÖRA: valens namn på varianterna. */
export const VARIANTBILD_LASFALT = "fields=VARIANT_OPTION_CHOICE_NAMES";

/**
 * Projektionen för att SKRIVA: valens namn och varukostnaden. Utan
 * `MERCHANT_DATA` saknas kostnaden, och skrivningen hade ersatt varianten utan.
 *
 * ☠️ `MERCHANT_DATA` kräver behörigheten SCOPE.STORES.PRODUCT_READ_ADMIN.
 * Motorns nyckel saknade den 2026-09-27 (403 NO_PERMISSION_TO_READ_MERCHANT_DATA,
 * lib/aosom/sammanslagning.ts). Då skriver rättningen ingenting och säger det
 * (`fel`), hellre än att skicka varianterna utan kostnad. Jämförelsen klarar
 * sig utan fältet.
 */
export const VARIANTBILD_FALT = "fields=VARIANT_OPTION_CHOICE_NAMES&fields=MERCHANT_DATA";

const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const lista = (v: unknown): Obj[] => (Array.isArray(v) ? (v as Obj[]).filter((x) => x && typeof x === "object") : []);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** En bilds nyckel: id, annars bildens id, annars filnamnet ur adressen. */
export function bildId(m: unknown): string {
  const o = obj(m);
  const id = str(o.id) || str(obj(o.image).id);
  if (id) return id;
  const url = str(o.url) || str(obj(o.image).url);
  return url ? (url.split("?")[0].split("/").pop() ?? "") : "";
}

export function optionerAv(p: Obj): Obj[] {
  return lista(p.options);
}

export function varianterAv(p: Obj): Obj[] {
  return lista(obj(p.variantsInfo).variants);
}

function valAv(o: Obj): Obj[] {
  return lista(obj(o.choicesSettings).choices);
}

/** Valet som en variant pekar på i en option: på id, annars på namn. */
function hittaVal(p: Obj, c: Obj): { option: Obj; val: Obj } | null {
  const ids = obj(c.optionChoiceIds);
  const namn = obj(c.optionChoiceNames);
  for (const o of optionerAv(p)) {
    const sammaOption = str(ids.optionId)
      ? str(o.id) === str(ids.optionId)
      : !!str(namn.optionName) && str(o.name) === str(namn.optionName);
    if (!sammaOption) continue;
    for (const v of valAv(o)) {
      const sammaVal = str(ids.choiceId)
        ? str(v.choiceId) === str(ids.choiceId)
        : !!str(namn.choiceName) && str(v.name) === str(namn.choiceName);
      if (sammaVal) return { option: o, val: v };
    }
  }
  return null;
}

export type Forvantan =
  | { bild: string; kalla: "val" | "snitt" | "huvudbild" }
  | { bild: null; kalla: "inget_snitt" | "ingen_bild" };

/**
 * Bilden Wix ska ge varianten: första bilden i valets `linkedMedia`. Har flera
 * optioner kopplade bilder gäller första bilden i snittet, i den första
 * optionens ordning. Saknas kopplade bilder gäller produktens huvudbild.
 *
 * Ett tomt snitt (färgen och storleken pekar på helt olika bilder) ger ingen
 * förväntan alls. Det har inte setts i katalogen och vi vet inte vad Wix gör
 * då, så det rapporteras i stället för att gissas.
 */
export function forvantadBild(p: Obj, variant: Obj): Forvantan {
  const listor: string[][] = [];
  // Optionernas ordning, inte variantens: den avgör vilken lista som är "först".
  const traffar = lista(variant.choices)
    .map((c) => hittaVal(p, c))
    .filter((t): t is { option: Obj; val: Obj } => t !== null)
    .sort((a, b) => optionerAv(p).indexOf(a.option) - optionerAv(p).indexOf(b.option));
  for (const t of traffar) {
    const idn = lista(t.val.linkedMedia).map(bildId).filter(Boolean);
    if (idn.length > 0) listor.push(idn);
  }
  if (listor.length === 1) return { bild: listor[0][0], kalla: "val" };
  if (listor.length > 1) {
    const forsta = listor[0].find((id) => listor.slice(1).every((l) => l.includes(id)));
    return forsta ? { bild: forsta, kalla: "snitt" } : { bild: null, kalla: "inget_snitt" };
  }
  const huvud = bildId(obj(p.media).main);
  return huvud ? { bild: huvud, kalla: "huvudbild" } : { bild: null, kalla: "ingen_bild" };
}

export interface VariantAvvikelse {
  variantId: string;
  /** Variantens namn, t.ex. "Blå / M". */
  namn: string;
  har: string;
  vill: string;
}

export interface VariantbildLage {
  /** Varianter vars bild inte är den förväntade. */
  avvikande: VariantAvvikelse[];
  /** Varianter utan förväntan (tomt snitt eller ingen bild alls). */
  okanda: { variantId: string; namn: string; skal: "inget_snitt" | "ingen_bild" }[];
}

function variantNamn(v: Obj): string {
  return lista(v.choices).map((c) => str(obj(c.optionChoiceNames).choiceName)).filter(Boolean).join(" / ")
    || str(v.id).slice(0, 8);
}

/** Jämför varje variants bild med den förväntade. Läser bara. */
export function variantbildLage(p: Obj): VariantbildLage {
  const ut: VariantbildLage = { avvikande: [], okanda: [] };
  for (const v of varianterAv(p)) {
    const f = forvantadBild(p, v);
    if (f.bild === null) {
      ut.okanda.push({ variantId: str(v.id), namn: variantNamn(v), skal: f.kalla });
      continue;
    }
    const har = bildId(v.media);
    if (har !== f.bild) ut.avvikande.push({ variantId: str(v.id), namn: variantNamn(v), har, vill: f.bild });
  }
  return ut;
}

/**
 * PATCH-kroppen till `products-with-inventory`, utan fältmask.
 *
 * Varje variant byggs ur GET:en med exakt de fält receptet nämner. Det här är
 * det enda stället i motorn där ett variantobjekt byggs från grunden, och det
 * är med flit: receptet är just att INTE skicka valens id, lagret eller
 * variantens media. Varje fält som skickas tas ur GET:en, och kontrollen efter
 * skrivningen jämför dem alla.
 *
 * Kastar om ett val saknar namn. Utan `VARIANT_OPTION_CHOICE_NAMES` i GET:en
 * saknas de, och en variant utan val hade skrivits över med fel kombination.
 */
export function byggVariantbildKropp(p: Obj): Obj {
  const variants = varianterAv(p).map((v) => {
    const choices = lista(v.choices).map((c) => {
      const n = obj(c.optionChoiceNames);
      if (!str(n.optionName) || !str(n.choiceName)) {
        throw new Error(`varianten ${str(v.id)} saknar valnamn (hämtades GET:en utan VARIANT_OPTION_CHOICE_NAMES?)`);
      }
      return {
        optionChoiceNames: {
          optionName: n.optionName,
          choiceName: n.choiceName,
          ...(str(n.renderType) ? { renderType: n.renderType } : {}),
        },
      };
    });
    const cost = obj(v.revenueDetails).cost;
    const ut: Obj = {
      id: v.id,
      choices,
      price: v.price,
      sku: v.sku,
      barcode: v.barcode ?? null,
      visible: v.visible,
      physicalProperties: v.physicalProperties ?? {},
    };
    if (cost && typeof cost === "object") ut.revenueDetails = { cost };
    return ut;
  });
  return {
    product: {
      id: p.id,
      revision: p.revision,
      // ☠️ `visible` följer med oförändrad: en variantsInfo-PATCH har
      // publicerat ett utkast förut.
      ...(typeof p.visible === "boolean" ? { visible: p.visible } : {}),
      options: p.options,
      variantsInfo: { variants },
    },
  };
}

// ── Kontrollen före och efter ────────────────────────────────────────────

/** JSON med sorterade nycklar, så att två lika objekt alltid ger samma text. */
export function kanonisk(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(kanonisk).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Obj;
    return `{${Object.keys(o).sort().filter((k) => o[k] !== undefined).map((k) => `${JSON.stringify(k)}:${kanonisk(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}

/** Det som inte får ändras på produkten. Variantens bild står medvetet utanför. */
export function produktAvtryck(p: Obj): Obj {
  return {
    name: p.name,
    slug: p.slug,
    visible: p.visible,
    options: optionerAv(p).map((o) => ({
      id: o.id,
      name: o.name,
      val: valAv(o).map((c) => ({
        choiceId: c.choiceId,
        name: c.name,
        bilder: lista(c.linkedMedia).map(bildId),
      })),
    })),
    // Efter id, inte position: samma varianter i annan ordning är ingen skada.
    varianter: [...varianterAv(p)].sort((x, y) => str(x.id).localeCompare(str(y.id))).map((v) => ({
      id: v.id,
      val: lista(v.choices).map((c) => {
        const ids = obj(c.optionChoiceIds);
        const n = obj(c.optionChoiceNames);
        return { optionId: ids.optionId, choiceId: ids.choiceId, optionName: n.optionName, choiceName: n.choiceName };
      }),
      sku: v.sku ?? null,
      pris: str(obj(obj(v.price).actualPrice).amount) || null,
      jamforpris: str(obj(obj(v.price).compareAtPrice).amount) || null,
      visible: v.visible ?? null,
      physicalProperties: v.physicalProperties ?? {},
      kostnad: str(obj(obj(v.revenueDetails).cost).amount) || null,
    })),
  };
}

export interface LagerPost {
  id?: string;
  variantId?: string;
  quantity?: number;
  trackQuantity?: boolean;
  availabilityStatus?: string;
  revision?: string;
}

/** Lagret per post: antal, spårning, status och revision. Revisionen ska stå still. */
export function lagerAvtryck(poster: LagerPost[]): Obj[] {
  return [...poster]
    .map((x) => ({
      id: x.id ?? null,
      variantId: x.variantId ?? null,
      quantity: x.quantity ?? null,
      trackQuantity: x.trackQuantity ?? null,
      availabilityStatus: x.availabilityStatus ?? null,
      revision: x.revision ?? null,
    }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

/** Avvikelserna mellan två avtryck, som läsbara rader. Tom lista = oförändrat. */
export function jamforForeEfter(
  fore: { produkt: Obj; lager: LagerPost[] },
  efter: { produkt: Obj; lager: LagerPost[] },
): string[] {
  const ut: string[] = [];
  const a = produktAvtryck(fore.produkt);
  const b = produktAvtryck(efter.produkt);
  for (const k of ["name", "slug", "visible"] as const) {
    if (kanonisk(a[k]) !== kanonisk(b[k])) ut.push(`produktens ${k} ändrades`);
  }
  if (kanonisk(a.options) !== kanonisk(b.options)) ut.push("optionerna (val, namn eller bildordning) ändrades");
  const va = a.varianter as Obj[];
  const vb = b.varianter as Obj[];
  if (kanonisk(va.map((v) => v.id)) !== kanonisk(vb.map((v) => v.id))) {
    ut.push(`variant-id ändrades (${va.length} → ${vb.length} varianter)`);
  } else {
    for (let i = 0; i < va.length; i++) {
      for (const k of Object.keys(va[i])) {
        if (kanonisk(va[i][k]) !== kanonisk(vb[i][k])) ut.push(`variant ${String(va[i].id).slice(0, 8)}: ${k} ändrades`);
      }
    }
  }
  if (kanonisk(lagerAvtryck(fore.lager)) !== kanonisk(lagerAvtryck(efter.lager))) {
    ut.push("lagret (antal, spårning, status eller revision) ändrades");
  }
  return ut;
}

// ── Rättningen ───────────────────────────────────────────────────────────

export type VariantbildStatus =
  | "ratt" // alla varianter visar redan sin bild
  | "en_variant" // inget att räkna på
  | "utkast_hoppat" // utkast skrivs bara med `utkast: true`
  | "torr" // avvikande, men inget skrevs
  | "rattad" // skriven, läst om, allt utom bilden oförändrat
  | "avvikelse" // skrivningen ändrade något annat än bilden — STOPP
  | "ej_rattad" // skrivningen tog, men bilden står kvar
  | "fel"; // läsning eller skrivning föll

export interface VariantbildUtfall {
  productId: string;
  status: VariantbildStatus;
  avvikande: VariantAvvikelse[];
  okanda: VariantbildLage["okanda"];
  /** Bara vid `avvikelse`: vad som ändrades. */
  avvikelser?: string[];
  fel?: string;
  visible?: boolean;
}

export interface VariantbildOpts {
  /** Läs och jämför, men skriv ingenting. */
  torr?: boolean;
  /** Skriv även utkast. Kräver Leonards ja efter ett prov på ett enda utkast. */
  utkast?: boolean;
  vanta?: (ms: number) => Promise<void>;
  /** Omläsningar medan Wix läsning släpar efter skrivningen. */
  omlasningar?: number;
}

const OMLASNING_PAUS_MS = 1500;

async function lasProdukt(wix: WixAnrop, id: string, falt = VARIANTBILD_FALT): Promise<Obj | null> {
  const svar = obj(await wix("GET", `/stores/v3/products/${encodeURIComponent(id)}?${falt}`));
  const p = obj(svar.product);
  return str(p.id) ? p : null;
}

/**
 * Lagerposterna för produkten. Samma form som `queryInventoryItemsByProductIds`:
 * filtret bara på första sidan, markören bär frågan. Kastar hellre än
 * returnerar en halv lista.
 */
async function lasLager(wix: WixAnrop, id: string): Promise<LagerPost[]> {
  const poster: LagerPost[] = [];
  let cursor: string | undefined;
  for (let sida = 0; sida < 20; sida++) {
    const query: Obj = { cursorPaging: cursor ? { limit: 100, cursor } : { limit: 100 } };
    if (!cursor) query.filter = { productId: id };
    const svar = obj(await wix("POST", "/stores/v3/inventory-items/query", { query }));
    const rader = lista(svar.inventoryItems) as LagerPost[];
    poster.push(...rader);
    const meta = obj(svar.pagingMetadata);
    cursor = str(obj(meta.cursors).next) || undefined;
    if (rader.length === 0 || !cursor || meta.hasNext === false) return poster;
  }
  throw new Error(`lagret för ${id} nådde sidtaket med markören kvar`);
}

/**
 * Läser produkten färskt och rättar variantbilderna om någon avviker.
 *
 * Skriver bara när en variant avviker, aldrig ett utkast utan `utkast: true`.
 * Efter skrivningen läses produkten och lagret om och jämförs med läget före:
 * namn, slug, synlighet, val (id, namn, bildordning), variant-id, SKU, pris,
 * jämförpris, synlighet, fysiska egenskaper, kostnad, och lagrets antal,
 * spårning, status och revision. Minsta avvikelse ger `avvikelse` och loggas
 * som fel; en anropare som rättar många produkter ska då stanna.
 *
 * Kastar aldrig. Ett fel blir `fel` i utfallet, så att en import eller en
 * bildkoppling aldrig fälls av rättningen.
 */
export async function refreshVariantMedia(
  wix: WixAnrop,
  productId: string,
  opts: VariantbildOpts = {},
): Promise<VariantbildUtfall> {
  const vanta = opts.vanta ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const utfall = (status: VariantbildStatus, rest: Partial<VariantbildUtfall> = {}): VariantbildUtfall => ({
    productId,
    status,
    avvikande: [],
    okanda: [],
    ...rest,
  });
  let skrivet = false;
  try {
    // Först utan kostnaden: de flesta produkter är redan rätt, och jämförelsen
    // ska fungera även med en nyckel som inte får läsa handelsdata.
    const forst = await lasProdukt(wix, productId, VARIANTBILD_LASFALT);
    if (!forst) return utfall("fel", { fel: "produkten gick inte att läsa" });
    const visible = forst.visible !== false;
    if (varianterAv(forst).length < 2) return utfall("en_variant", { visible });

    const lage = variantbildLage(forst);
    const bas = { avvikande: lage.avvikande, okanda: lage.okanda, visible };
    if (lage.avvikande.length === 0) return utfall("ratt", bas);
    if (opts.torr) return utfall("torr", bas);
    if (!visible && !opts.utkast) return utfall("utkast_hoppat", bas);

    let fore: Obj | null;
    try {
      fore = await lasProdukt(wix, productId);
    } catch (e) {
      const t = String((e as Error)?.message ?? e);
      if (/403|MERCHANT_DATA/.test(t)) {
        return utfall("fel", {
          ...bas,
          fel: "nyckeln får inte läsa varukostnaden (MERCHANT_DATA, 403) — ingenting skrevs",
        });
      }
      throw e;
    }
    if (!fore) return utfall("fel", { ...bas, fel: "produkten gick inte att läsa" });
    // Produkten kan ha ändrats mellan läsningarna; planen räknas om på den nya.
    if (fore.revision !== forst.revision && variantbildLage(fore).avvikande.length === 0) {
      return utfall("ratt", { ...bas, avvikande: [] });
    }
    if (fore.visible === false && !opts.utkast) return utfall("utkast_hoppat", bas);

    const kropp = byggVariantbildKropp(fore);
    const lagerFore = await lasLager(wix, productId);
    await wix("PATCH", `/stores/v3/products-with-inventory/${encodeURIComponent(productId)}`, kropp);
    skrivet = true;

    // ☠️ Läs om tills revisionen gått fram: en läsning direkt efter en PATCH
    // kan visa produkten som den var före.
    let efter: Obj | null = null;
    const varv = Math.max(1, opts.omlasningar ?? 4);
    for (let i = 0; i < varv; i++) {
      if (i > 0) await vanta(OMLASNING_PAUS_MS);
      efter = await lasProdukt(wix, productId);
      if (efter && Number(efter.revision) > Number(fore!.revision)) break;
    }
    if (!efter) {
      console.error(`[variantbild] ${productId}: produkten gick inte att läsa efter skrivningen`);
      return utfall("avvikelse", { ...bas, avvikelser: ["produkten gick inte att läsa efter skrivningen"] });
    }
    const lagerEfter = await lasLager(wix, productId);

    const avvikelser = jamforForeEfter({ produkt: fore, lager: lagerFore }, { produkt: efter, lager: lagerEfter });
    if (Number(efter.revision) <= Number(fore.revision)) avvikelser.push("revisionen gick inte fram, skrivningen syns inte");
    if (avvikelser.length > 0) {
      console.error(`[variantbild] ${productId}: AVVIKELSE efter skrivningen — ${avvikelser.join("; ")}`);
      return utfall("avvikelse", { ...bas, avvikelser });
    }
    const kvar = variantbildLage(efter).avvikande;
    if (kvar.length > 0) {
      console.warn(`[variantbild] ${productId}: ${kvar.length} varianter har fortfarande fel bild efter skrivningen`);
      return utfall("ej_rattad", { ...bas, avvikande: kvar });
    }
    console.log(`[variantbild] ${productId}: ${lage.avvikande.length} varianter rättade`);
    return utfall("rattad", bas);
  } catch (e) {
    const fel = String((e as Error)?.message ?? e).slice(0, 300);
    // Föll kontrollen EFTER en skrivning vet vi inte vad Wix har. Det räknas
    // som en avvikelse, så att en anropare som rättar många produkter stannar.
    if (skrivet) {
      console.error(`[variantbild] ${productId}: kontrollen efter skrivningen föll — ${fel}`);
      return utfall("avvikelse", { avvikelser: [`kontrollen efter skrivningen föll: ${fel}`], fel });
    }
    console.warn(`[variantbild] ${productId}: ${fel}`);
    return utfall("fel", { fel });
  }
}

/**
 * En rad till ett verktygs steglista, och om verktyget ska stanna. Bara
 * `avvikelse` stoppar: då ändrade skrivningen något annat än bilden.
 */
export function variantbildSteg(u: VariantbildUtfall): { rad: string; stopp: boolean } {
  const n = u.avvikande.length;
  switch (u.status) {
    case "ratt":
    case "en_variant":
      return { rad: "variantbilder: rätt", stopp: false };
    case "rattad":
      return { rad: `variantbilder: ${n} rättade`, stopp: false };
    case "utkast_hoppat":
      return { rad: `variantbilder: ${n} fel, utkast rättas inte ännu`, stopp: false };
    case "torr":
      return { rad: `variantbilder: ${n} fel (torrt)`, stopp: false };
    case "ej_rattad":
      return { rad: `variantbilder: ${n} står kvar på fel bild efter skrivningen`, stopp: false };
    case "avvikelse":
      return { rad: `variantbilder: AVVIKELSE efter skrivningen (${(u.avvikelser ?? []).join("; ")})`, stopp: true };
    case "fel":
      return { rad: `variantbilder: kunde inte kontrolleras (${u.fel ?? "okänt fel"})`, stopp: false };
  }
}
