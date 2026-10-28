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
// ✅ UTKAST ÄR PRÖVADE (2026-10-03, Leonards ja). En variantsInfo-PATCH har
// publicerat ett utkast förut (CLAUDE.md), så `visible` skickas med på
// produkten. Provat på utkastet d4118d39 (rumsavdelaren): efter skrivningen
// `visible: false`, den vita varianten på sin vita bild, SKU och pris lika och
// lagret orört (antal 60/5, revision 93 före och efter). Kontrollen efter
// skrivningen fäller dessutom en ändrad synlighet. `utkast: false` hoppar dem.
//
// ☠️ Skicka aldrig `inventoryItem` (då blir svarets `inventoryResults` tomt och
// lagret orört) och aldrig variantens `media` (Wix ignorerar det).
//
// ✅ FÄRGEN FÖRST (2026-10-23, Leonards ja). Wix räknar variantens bild ur det
// FÖRSTA valet i variantens egen `choices`-lista som har kopplade bilder, och
// räknar om den bara vid en namn-skrivning (mätt på dolda testprodukter, som
// raderades direkt). En skrivning med val-id (`bilder-bort`, färgbilderna,
// miljöbilden, sammanslagningen) NOLLSTÄLLER den till huvudbilden när en lista
// ändras eller den andra optionen länkas.
//
// ☠️ WIX RÄKNAR INGEN SKÄRNING. Förut var förväntan "första bilden som ligger
// i ALLA valens listor", och tom skärning gav ingen förväntan alls
// (`inget_snitt`): svepet kunde varken se eller rätta en nollställd
// variantbild på de 49 tvåaxliga sidorna, och 16 av dem rättades för hand
// 2026-10-23 med variantbild-farg.js. Men även när listorna ÖVERLAPPAR väljer
// Wix första bilden hos första valet, inte skärningen. Mätt samma natt på en
// dold testprodukt (Färg Svart [X2, X1], Silver [Y2, Y1], Storlek S [K1, X1],
// L [K2, Y1]; skärningen för S × Svart är X1, för L × Silver Y1): med färgen
// först blev ALLA fyra varianter färgens första foto (X2, Y2, X2, Y2), med
// storleken först storlekens (K1, K1, K2, K2), och med färgen först igen
// färgens. Ingen variant fick X1 eller Y1. I katalogen 2026-10-23 är 82 av 82
// varianter med bilder på två val (22 sidor) i linje med regeln, och ingen har
// överlappande listor. Förväntan är därför alltid första bilden hos första valet
// i skrivordningen, och skrivkroppen lägger färgen först i varje variant.
// Optionernas ordning rörs aldrig.

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
  | { bild: string; kalla: "val" | "forsta_val" | "huvudbild" }
  | { bild: null; kalla: "ingen_bild" };

/**
 * Färgoptionen: samma regel som butikens variantbild (`v3MultiVariantData` i
 * butiksrepot väljer färgaxeln på /färg|color|kulör/i). Färgen äger
 * variantens bild, så den ligger först i varianten.
 */
const FARG_OPTION = /färg|color|kulör/i;
const arFargOption = (o: Obj): boolean => FARG_OPTION.test(str(o.name));

type Traff = { option: Obj; val: Obj };

/** Variantens val med sin option och sitt val, i variantens egen ordning. */
function valenAv(p: Obj, variant: Obj): Traff[] {
  return lista(variant.choices)
    .map((c) => hittaVal(p, c))
    .filter((t): t is Traff => t !== null);
}

/** Skrivordningens rang för ett val: färgoptionerna först, sedan optionernas egen ordning. */
function rangAv(p: Obj, t: Traff): number {
  const optioner = optionerAv(p);
  return (arFargOption(t.option) ? 0 : optioner.length) + optioner.indexOf(t.option);
}

/**
 * Valen i skrivordningen. Det är ordningen valen får i varianten när vi
 * skriver, och den Wix räknar variantens bild ur.
 */
function iSkrivordning(p: Obj, traffar: Traff[]): Traff[] {
  return [...traffar].sort((a, b) => rangAv(p, a) - rangAv(p, b));
}

const lankade = (t: Traff): string[] => lista(t.val.linkedMedia).map(bildId).filter(Boolean);

/**
 * Bilden Wix ska ge varianten: första bilden i `linkedMedia` hos det FÖRSTA
 * valet i skrivordningen som har kopplade bilder (färgen först, sedan
 * optionernas ordning). Det är vad Wix räknar fram ur en namn-skrivning,
 * också när flera vals listor överlappar: Wix tar ingen skärning (mätt
 * 2026-10-23, se huvudet). Har bara ett val bilder är det självklart det
 * (`val`), annars avgör ordningen (`forsta_val`).
 *
 * Saknas kopplade bilder helt gäller produktens huvudbild.
 */
export function forvantadBild(p: Obj, variant: Obj): Forvantan {
  const listor = iSkrivordning(p, valenAv(p, variant)).map(lankade).filter((l) => l.length > 0);
  if (listor.length === 1) return { bild: listor[0][0], kalla: "val" };
  if (listor.length > 1) return { bild: listor[0][0], kalla: "forsta_val" };
  const huvud = bildId(obj(p.media).main);
  return huvud ? { bild: huvud, kalla: "huvudbild" } : { bild: null, kalla: "ingen_bild" };
}

/**
 * Behöver varianternas val läggas färgen först? Bara när minst en variant har
 * kopplade bilder hos flera av sina val: då avgör ordningen vilken bild Wix
 * väljer. Annars rörs ordningen inte.
 */
function behovFargForst(p: Obj): boolean {
  return varianterAv(p).some((v) => valenAv(p, v).filter((t) => lankade(t).length > 0).length > 1);
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
  /** Varianter utan förväntan (ingen bild alls, varken på valen eller på produkten). */
  okanda: { variantId: string; namn: string; skal: "ingen_bild" }[];
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
 *
 * ☠️ Har flera av variantens val kopplade bilder läggs färgen först i VARJE
 * variant (`behovFargForst`), för Wix räknar variantens bild ur det första
 * valet som har bilder. Optionerna skickas ordagrant som förut: det är
 * variantens egen valordning som styr, inte optionernas. Annars rörs
 * ordningen inte alls.
 */
export function byggVariantbildKropp(p: Obj): Obj {
  const fargForst = behovFargForst(p);
  const variants = varianterAv(p).map((v) => {
    const val = lista(v.choices);
    // Valen i skrivordning (stabil): färgoptionerna först, sedan optionernas ordning.
    // Ett val som inte hittas i optionerna behåller sin plats efter de andra.
    const ordnade = fargForst
      ? val
        .map((c, i) => {
          const t = hittaVal(p, c);
          return { c, i, rang: t ? rangAv(p, t) : Number.MAX_SAFE_INTEGER };
        })
        .sort((a, b) => a.rang - b.rang || a.i - b.i)
        .map((x) => x.c)
      : val;
    const choices = ordnade.map((c) => {
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
      // Valen som en mängd: ordningen läggs om med flit (färgen först), men
      // vilka val varianten har ska stå still.
      val: lista(v.choices)
        .map((c) => {
          const ids = obj(c.optionChoiceIds);
          const n = obj(c.optionChoiceNames);
          return { optionId: ids.optionId, choiceId: ids.choiceId, optionName: n.optionName, choiceName: n.choiceName };
        })
        .sort((x, y) => kanonisk(x).localeCompare(kanonisk(y))),
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
  | "utkast_hoppat" // hoppat med `utkast: false`
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
  /** `false` hoppar utkast. Default: utkast rättas också (provat 2026-10-03). */
  utkast?: boolean;
  vanta?: (ms: number) => Promise<void>;
  /** Omläsningar medan Wix läsning släpar efter skrivningen. */
  omlasningar?: number;
  /**
   * Revisionen produkten har efter en skrivning som just gjorts (`updateV3VariantPrices`).
   * ☠️ Läsningen släpar efter skrivningen: utan den ser första läsningen ut som produkten
   * FÖRE prisskrivningen, alla varianter står på sin bild, och ingenting rättas. Då är
   * variantbilden nollställd till huvudbilden tills nattens cron kommer. Med den läses
   * produkten om (`omlasningar` gånger) tills revisionen är minst den här.
   */
  minRevision?: number;
}

const OMLASNING_PAUS_MS = 1500;

export async function lasProdukt(wix: WixAnrop, id: string, falt = VARIANTBILD_FALT): Promise<Obj | null> {
  const svar = obj(await wix("GET", `/stores/v3/products/${encodeURIComponent(id)}?${falt}`));
  const p = obj(svar.product);
  return str(p.id) ? p : null;
}

/** Som `lasProdukt`, men väntar ut en läsning som släpar: omläsning tills revisionen når `minRevision`. */
export async function lasProduktTillRevision(
  wix: WixAnrop,
  id: string,
  falt: string,
  minRevision: number | undefined,
  vanta: (ms: number) => Promise<void>,
  varv: number,
): Promise<Obj | null> {
  let p = await lasProdukt(wix, id, falt);
  for (let i = 1; p && minRevision !== undefined && Number(p.revision) < minRevision && i < varv; i++) {
    await vanta(OMLASNING_PAUS_MS);
    p = await lasProdukt(wix, id, falt);
  }
  return p;
}

/**
 * Lagerposterna för produkten. Samma form som `queryInventoryItemsByProductIds`:
 * filtret bara på första sidan, markören bär frågan. Kastar hellre än
 * returnerar en halv lista.
 */
export async function lasLager(wix: WixAnrop, id: string): Promise<LagerPost[]> {
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
 * Skriver bara när en variant avviker. Utkast rättas också, utom med `utkast: false`.
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
    const forst = await lasProduktTillRevision(
      wix,
      productId,
      VARIANTBILD_LASFALT,
      opts.minRevision,
      vanta,
      Math.max(1, opts.omlasningar ?? 4),
    );
    if (!forst) return utfall("fel", { fel: "produkten gick inte att läsa" });
    const visible = forst.visible !== false;
    if (varianterAv(forst).length < 2) return utfall("en_variant", { visible });

    const lage = variantbildLage(forst);
    const bas = { avvikande: lage.avvikande, okanda: lage.okanda, visible };
    if (lage.avvikande.length === 0) return utfall("ratt", bas);
    if (opts.torr) return utfall("torr", bas);
    if (!visible && opts.utkast === false) return utfall("utkast_hoppat", bas);

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
    if (fore.visible === false && opts.utkast === false) return utfall("utkast_hoppat", bas);

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
      return { rad: `variantbilder: ${n} fel, utkast hoppade`, stopp: false };
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
