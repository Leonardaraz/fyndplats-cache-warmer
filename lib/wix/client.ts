// Tunn klient mot Wix Stores Catalog V3.
// Endpoint verifierad mot docs: POST https://www.wixapis.com/stores/v3/products
// https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/products-v3/create-product
import { isDryRun } from "../audit";

// Exporterad så read-only-moduler (t.ex. lib/wix/prune-customizations.ts) kan
// återanvända bas-URL + auth-headers utan att duplicera dem.
export const WIX_BASE = "https://www.wixapis.com";

export interface WixVariantInput {
  sku: string;
  /** Slutpris inkl. moms i butikens valuta, som sträng. */
  actualPrice: string;
  compareAtPrice?: string;
  /** Mappning optionsnamn -> valt värde, t.ex. { Färg: "Röd", Storlek: "M" }. */
  choices: Record<string, string>;
  visible?: boolean;
  /**
   * Initialt lagersaldo. Sätts via /products-with-inventory så lagerposterna
   * skapas vid import (Wix skapar dem INTE automatiskt vid vanlig create →
   * produkten blev annars "Slut i lager"). undefined = inget lager skapas.
   */
  inventoryQuantity?: number;
  /**
   * Varukostnad (inköp) i butikens valuta, decimalsträng. Mappar till V3:s
   * variantsInfo.variants[].revenueDetails.cost → driver Wix lönsamhetsrapporter
   * och /admin/profitability (istället för 30%-antagande).
   */
  costAmount?: string;
}

export interface WixProductInput {
  name: string;
  slug?: string;
  plainDescription?: string;
  brandName?: string;
  ribbonName?: string;
  seo?: { title?: string; description?: string };
  /**
   * Fokusord (Wix "focus keyword"). Lagras i seoData.settings.keywords med
   * isMain:true → visas i Wix-adminens SEO-panel. Härleds deterministiskt ur
   * produktnamnet (lib/import/focus-keyword.ts), inga AI-anrop.
   */
  focusKeyword?: string;
  /**
   * Bilder från media.ts/importMediaByUrl.
   *
   * ☠️ SKICKA `id`, ALDRIG BARA `url`. V3:s dokumentation är entydig: `url` i ett
   * media-item betyder "an external media URL", och Wix IMPORTERAR OM adressen
   * till en ny fil. Skickar man en wixstatic-adress — alltså en bild som redan
   * ligger i Media Manager — får man en andra kopia av samma bild.
   *
   * Det var inte teoretiskt: uppmätt 2026-08-28 var 591 av 595 granskade
   * wixstatic-filer kopior av bilder vi själva laddat upp. Media Manager hade
   * 58 160 filer där hälften räckt, och lagringen tog slut mitt under en
   * bildfix-körning. Omimporten är dessutom ASYNKRON, vilket är varför produkter
   * ibland fick fyra av fem bilder: den femte kopian hade inte hunnit bli klar.
   */
  mediaItems?: { id?: string; url: string; altText?: string }[];
  /**
   * Optionsdefinitioner. Ett val kan ha `colorCode` (hex) → renderas som
   * färg-swatch (bubbla). Har alla val i en option en colorCode blir hela
   * optionen en swatch; annars text. Tom = enkel produkt utan varianter.
   */
  options?: { name: string; choices: { name: string; colorCode?: string }[] }[];
  variants: WixVariantInput[];
  /**
   * Initial synlighet i butiken. Default true. När review-kön används
   * (draft-imports) sätts den till false fram tills Leonard publicerar.
   */
  visible?: boolean;
}

export interface WixCreateProductResult {
  id: string;
  slug: string;
  revision: string;
  /** Wix-tilldelade variant-id:n kopplade till våra SKU:er (för lager-/orderkoppling). */
  variants: { id: string; sku: string }[];
  /**
   * Sätts om Wix svarade DUPLICATE_SLUG_ERROR och vi fick lägga på ett suffix.
   * T.ex. "-2" eller "-a7c2". Tomt/saknas = originalslug:en accepterades.
   * Används av /admin/queue för att visa "Slug auto-justerad"-badge.
   */
  slugSuffix?: string;
}

export function wixHeaders(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  const siteId = process.env.WIX_SITE_ID;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: token,
  };
  if (siteId) headers["wix-site-id"] = siteId;
  return headers;
}

/** En option blir färg-swatch om alla dess val har en colorCode. */
function isSwatchOption(o: { choices: { colorCode?: string }[] }): boolean {
  return o.choices.length > 0 && o.choices.every((c) => Boolean(c.colorCode));
}

/** Bygger V3-request-body från vårt interna produktformat. */
export function buildCreateProductBody(input: WixProductInput): Record<string, unknown> {
  // Render-typ per option (behövs i variants optionChoiceNames.renderType).
  const renderTypeByOption = new Map<string, "SWATCH_CHOICES" | "TEXT_CHOICES">();
  for (const o of input.options ?? []) {
    renderTypeByOption.set(o.name, isSwatchOption(o) ? "SWATCH_CHOICES" : "TEXT_CHOICES");
  }

  const product: Record<string, unknown> = {
    name: input.name,
    productType: "PHYSICAL",
    physicalProperties: {},
    ...(input.visible === false ? { visible: false } : {}),
    variantsInfo: {
      variants: input.variants.map((v) => ({
        sku: v.sku,
        visible: v.visible ?? true,
        price: {
          actualPrice: { amount: v.actualPrice },
          ...(v.compareAtPrice ? { compareAtPrice: { amount: v.compareAtPrice } } : {}),
        },
        // Varukostnad → V3 revenueDetails.cost (Wix räknar marginal/vinst på detta).
        ...(v.costAmount ? { revenueDetails: { cost: { amount: v.costAmount } } } : {}),
        // Lagerpost skapas in-line (endast via /products-with-inventory). quantity>0
        // → availabilityStatus=IN_STOCK. trackQuantity=true så daglig OOS-sync kan
        // flippa saldot till 0 senare.
        ...(v.inventoryQuantity !== undefined
          ? { inventoryItem: { trackQuantity: true, quantity: Math.max(0, Math.trunc(v.inventoryQuantity)) } }
          : {}),
        choices: Object.entries(v.choices).map(([optionName, choiceName]) => ({
          optionChoiceNames: {
            optionName,
            choiceName,
            renderType: renderTypeByOption.get(optionName) ?? "TEXT_CHOICES",
          },
        })),
      })),
    },
  };

  if (input.slug) product.slug = input.slug;
  if (input.plainDescription) product.plainDescription = input.plainDescription;
  if (input.brandName) product.brand = { name: input.brandName };
  if (input.ribbonName) product.ribbon = { name: input.ribbonName };
  if (input.seo) {
    // VIKTIGT (bug 2026-05-31): Wix SEO-panelen visade "Ingen produktbeskrivning"
    // trots att metabeskrivningen sattes. Två orsaker, båda fixade här:
    //   1. Taggarna måste markeras `custom: true` (annars behandlar Wix dem som
    //      auto-genererade defaults och panelen visar dem som tomma/overridebara).
    //   2. og:description/og:title saknades helt → ingen social-preview-text.
    // Shapen speglar lib/seo/enrich.ts (den verifierat fungerande enrichern):
    // meta name=description, plus og:title/og:description/og:type via props.property.
    const tags: Array<Record<string, unknown>> = [];
    if (input.seo.title) {
      tags.push({ type: "title", children: input.seo.title });
      tags.push({
        type: "meta",
        props: { property: "og:title", content: input.seo.title },
        children: "",
        custom: true,
      });
    }
    if (input.seo.description) {
      tags.push({
        type: "meta",
        props: { name: "description", content: input.seo.description },
        children: "",
        custom: true,
      });
      tags.push({
        type: "meta",
        props: { property: "og:description", content: input.seo.description },
        children: "",
        custom: true,
      });
    }
    tags.push({
      type: "meta",
      props: { property: "og:type", content: "product" },
      children: "",
      custom: true,
    });
    product.seoData = { tags };
  }
  // Fokusord → seoData.settings.keywords med isMain:true (Wix-adminens "Fokusord").
  // Verifierat 2026-06-01: create accepterar fältet inline och det round-trippar.
  // Fältväg + format speglar setProductFocusKeyword (backfill av befintliga).
  if (input.focusKeyword) {
    const seoData = (product.seoData as Record<string, unknown> | undefined) ?? {};
    seoData.settings = {
      keywords: [{ term: input.focusKeyword, isMain: true, origin: "USER" }],
    };
    product.seoData = seoData;
  }
  if (input.options?.length) {
    product.options = input.options.map((o) => {
      const swatch = isSwatchOption(o);
      return {
        name: o.name,
        optionRenderType: swatch ? "SWATCH_CHOICES" : "TEXT_CHOICES",
        choicesSettings: {
          choices: o.choices.map((c) =>
            swatch
              ? { choiceType: "ONE_COLOR", name: c.name, colorCode: c.colorCode }
              : { choiceType: "CHOICE_TEXT", name: c.name },
          ),
        },
      };
    });
  }
  if (input.mediaItems?.length) {
    // `id` när vi har det (bilden ligger redan i Media Manager), annars `url`
    // för en genuint extern adress. Se kommentaren på mediaItems ovan.
    const items = input.mediaItems.map((m) => ({
      ...(m.id ? { id: m.id } : { url: m.url }),
      ...(m.altText ? { altText: m.altText } : {}),
    }));
    product.media = {
      // `media.main` är READ-ONLY i V3 och sätts automatiskt till första posten
      // i itemsInfo.items. Att skicka den gör ingen nytta och gav tidigare en
      // extra omimport av huvudbilden.
      itemsInfo: { items },
    };
  }

  const fields = ["URL", "PLAIN_DESCRIPTION"];
  return { product, fields };
}

/**
 * Backoff för lager-anropen (både läsning och skrivning). Följer `Retry-After`
 * när Wix skickar den.
 *
 * ☠️ UPPMÄTT 2026-09-02, INTE ANTAGET. Ett skarpt Aosom-svep försökte 2 095
 * lagerskrivningar i rad och fick **1 190 stycken 429** — och svaret var en
 * HTML-sida, alltså Wix EDGE-spärr, inte det vanliga JSON-felet. Kort körning
 * (40 skrivningar) gav noll fel; 600 gav 521. Gränsen ligger däremellan.
 *
 * Återförsöket är därför inte hela medicinen — huset har redan mätt att
 * edge-spärren inte går att vänta ut inom ruttens 300 sekunder (se
 * media-cleanup i CLAUDE.md). Det som håller den borta är att inte springa,
 * och pacingen ligger hos anroparen. Det här fångar det som ÄR övergående:
 * API-nivåns 429, 5xx och nätverksfel.
 */
const LAGER_PAUS_MS = [1_000, 3_000, 8_000];

/** 429/408/5xx är övergående. Andra 4xx blir inte bättre av att frågas igen. */
function lagerFelArOvergaende(status: number): boolean {
  return status === 429 || status === 408 || status >= 500;
}

export interface WixInventoryItem {
  id: string;
  revision: string;
  variantId: string;
  productId: string;
}

/**
 * Hur många produkt-id som ryms i EN lagerläsning.
 *
 * ☠️ UPPMÄTT MOT SKARPA WIX 2026-09-04, inte läst i dokumentationen. Både
 * `limit: 100` och `limit: 200` accepteras av `inventory-items/query` — till
 * skillnad från fil-API:erna, som svarar `400 INVALID_ARGUMENT` över 100 trots
 * att dev.wix.com påstår 200 (uppmätt 2026-08-28). Talet här är ändå 50, för
 * det är PRODUKTER och en produkt kan ha flera varianter: 50 produkter à två
 * varianter är 100 poster, alltså precis en sida. Läsningen pagineras ändå —
 * taket är en säkerhet, inte ett antagande.
 */
export const LAGER_PRODUKTER_PER_LASNING = 50;

/** Sidtak för lagerläsningen. Kastar hellre än returnerar en halv lista. */
const LAGER_MAX_SIDOR = 40;

/**
 * Lagerposter för FLERA produkter i ETT anrop.
 *
 * ☠️ `$in` PÅ productId ÄR MÄTT, INTE ANTAGET (2026-09-04): fem produkt-id gav
 * fem poster där ett enskilt id gav en. Utan den mätningen hade batchningen
 * varit en gissning om ett filter API:t kanske inte stödjer.
 *
 * ☠️ ÅTERFÖRSÖK HÖR TILL BATCHNINGEN. Den gamla enproduktsläsningen hade inget
 * alls, och det gick an: föll den kostade det EN produkt, som nästa körning tog
 * om gratis. En batchad läsning som faller kostar femtio. Samma steg som
 * lagerskrivningen (1/3/8 s, följer `Retry-After`) — och `wixHeaders()` ligger
 * UTANFÖR loopen av samma skäl som där: ett saknat token är inte övergående.
 */
export async function queryInventoryItemsByProductIds(
  productIds: string[],
): Promise<WixInventoryItem[]> {
  const unika = [...new Set(productIds.filter(Boolean))];
  if (unika.length === 0) return [];

  const headers = wixHeaders();
  const poster: WixInventoryItem[] = [];
  let cursor: string | undefined;

  for (let sida = 0; sida < LAGER_MAX_SIDOR; sida++) {
    const cursorPaging: Record<string, unknown> = { limit: 100 };
    if (cursor) cursorPaging.cursor = cursor;
    const body = JSON.stringify({
      query: {
        // Ett enda id skickas som skalär, inte som `$in` med ett element:
        // formen är den beprövade och den nya vägen ska inte ändra beteendet
        // för de tre anropare som läser en produkt i taget.
        filter: { productId: unika.length === 1 ? unika[0] : { $in: unika } },
        cursorPaging,
      },
    });

    let svar: Response | null = null;
    let sistaFel = "";
    for (let forsok = 0; forsok <= LAGER_PAUS_MS.length; forsok++) {
      let res: Response;
      try {
        res = await fetch(`${WIX_BASE}/stores/v3/inventory-items/query`, {
          method: "POST",
          headers,
          body,
        });
      } catch (err) {
        sistaFel = `nätverksfel: ${err instanceof Error ? err.message : String(err)}`;
        if (forsok === LAGER_PAUS_MS.length) break;
        await new Promise((r) => setTimeout(r, LAGER_PAUS_MS[forsok]));
        continue;
      }
      if (res.ok) {
        svar = res;
        break;
      }
      const text = await res.text();
      sistaFel = `(${res.status}): ${text.slice(0, 400)}`;
      if (!lagerFelArOvergaende(res.status) || forsok === LAGER_PAUS_MS.length) break;
      const retryAfter = Number(res.headers?.get?.("retry-after"));
      await new Promise((r) =>
        setTimeout(r, Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 15_000)
          : LAGER_PAUS_MS[forsok]),
      );
    }
    if (!svar) {
      throw new Error(`Wix query-inventory misslyckades ${sistaFel}`);
    }

    const data = (await svar.json()) as {
      inventoryItems?: WixInventoryItem[];
      pagingMetadata?: { cursors?: { next?: string }; hasNext?: boolean };
    };
    poster.push(...(data.inventoryItems ?? []));

    cursor = data.pagingMetadata?.cursors?.next;
    if ((data.inventoryItems?.length ?? 0) === 0 || !cursor || data.pagingMetadata?.hasNext === false) {
      return poster;
    }
  }

  // ☠️ Samma hållning som `queryAll` och `listV3ProductPrices`: en halv lista
  // som ser komplett ut hade fått synken att skriva mappningen för produkter
  // vars lagerposter aldrig lästes.
  throw new Error(
    `Wix query-inventory nådde sidtaket (${LAGER_MAX_SIDOR} sidor, ${poster.length} poster `
      + `för ${unika.length} produkter) med markören kvar.`,
  );
}

/**
 * Hämtar lagerposter för en produkt (en post per variant + lager).
 *
 * Uttryckt i den batchade vägen i stället för att vara en tvilling till den —
 * husets vanligaste bugg är att två kopior glider isär (`SHIP_AXIS_RE`,
 * `EU_TULL_CODES`, `mapWithConcurrency`).
 */
export async function queryInventoryItemsByProductId(productId: string): Promise<WixInventoryItem[]> {
  return queryInventoryItemsByProductIds([productId]);
}

/**
 * Lagerrader per bulk-SKRIVNING.
 *
 * ☠️ UPPMÄTT MOT SKARPA WIX 2026-09-04 (`/api/admin/wix-inventory-probe`,
 * läget `api-matning`): 20, 50 och 100 rader gav alla `200` med ett
 * individuellt utfall per rad. Mätt utan att skriva — raderna skickades med
 * föråldrad revision, så alla föll och ingenting ändrades. 101 är oprövat,
 * och det är hela skälet till att talet är 100 och inte större.
 */
export const BATCH_LAGERRADER = 100;

export interface InventoryQuantityUpdate {
  id: string;
  revision: string;
  /** Absolut lagersaldo. */
  quantity: number;
}

/**
 * Request-body för bulk-lageruppdateringen — bruten till ren funktion så
 * formen kan regressionstestas. INCIDENT 2026-07-13: kvantiteten låg tidigare
 * nästlad i ett påhittat `trackingMethod`-objekt som Wix tyst ignorerade —
 * varje "uppdatering" bumpade bara revision utan att röra saldot, så
 * slut-i-lager-produkter förblev köpbara i veckor. Per Wix-schemat ska
 * `quantity` ligga DIREKT på inventoryItem (verifierat mot både docs och
 * skarpt anrop).
 */
export function buildBulkInventoryUpdateBody(updates: InventoryQuantityUpdate[]): {
  inventoryItems: Array<{ inventoryItem: { id: string; revision: string; trackQuantity: true; quantity: number } }>;
} {
  return {
    inventoryItems: updates.map((u) => ({
      inventoryItem: {
        id: u.id,
        revision: u.revision,
        trackQuantity: true,
        quantity: u.quantity,
      },
    })),
  };
}

/** Utfallet av en bulk-lagerskrivning, uppdelat per rad. */
export interface BulkLagerUtfall {
  /** Lagerpost-id som Wix uttryckligen bekräftade. */
  lyckade: string[];
  /** Lagerpost-id som föll, med orsaken. */
  misslyckade: { id: string; fel: string }[];
}

/**
 * Tolkar bulk-svaret PER RAD.
 *
 * ☠️ FORMEN ÄR UPPMÄTT MOT SKARPA WIX 2026-09-04, inte läst i dokumentationen
 * och inte gissad. Ett första utkast skrevs på antagandet att bara FALLNA
 * rader listas; tre befintliga retry-tester föll på det och hade rätt att
 * göra det. Mätningen visar att båda utfallen bär hela raden:
 *
 *   fel:      {"itemMetadata":{"id":"2f3b…","originalIndex":0,"success":false,
 *              "error":{"code":"INVALID_REVISION","description":"Outdated revision…"}}}
 *             bulkActionMetadata: {totalSuccesses:0, totalFailures:1, undetailedFailures:0}
 *
 *   framgång: {"itemMetadata":{"id":"2f3b…","originalIndex":0,"success":true}}
 *             bulkActionMetadata: {totalSuccesses:1, totalFailures:0, undetailedFailures:0}
 *
 * Attributionen behöver alltså inte lita på ORDNINGEN — id:t står i svaret.
 * Det är hela skälet till att batchningen är säker: "Wix före mappningen" är
 * en garanti PER PRODUKT, och en mappning får aldrig skrivas för en skrivning
 * som föll. Utan id i svaret hade hundra produkter i ett anrop betytt att ett
 * enda radfel kunde bokföras på fel produkt — tyst, samma klass som
 * `sku`-förväxlingen som lät prissynken skriva till ingenting i en månad.
 *
 * Tre konservativa regler, alla åt samma håll — hellre en skrivning för mycket
 * nästa körning än en mappning som ljuger:
 *
 *   1. En SKICKAD rad som Wix inte nämner räknas som MISSLYCKAD. Mätningen
 *      säger att det inte händer; regeln finns för dagen det gör det.
 *   2. `undetailedFailures` — fler fel än vi kan peka ut — gör HELA anropet
 *      misslyckat. Vi vet då inte vilka rader som gick igenom, och att gissa
 *      är exakt det som inte får hända. Nästa körning skriver om dem, och en
 *      omskrivning av ett redan rätt saldo är en no-op.
 *   3. Går id:t inte att härleda (varken `itemMetadata.id` eller ett
 *      `originalIndex` som pekar in i det vi skickade) används radens plats
 *      som nyckel. Då är utfallet ändå räknat, bara inte adresserat.
 */
export function tolkaBulkUtfall(json: unknown, skickadeIds: string[]): BulkLagerUtfall {
  const obj = (json ?? {}) as {
    results?: Array<{
      itemMetadata?: {
        id?: string;
        originalIndex?: number;
        success?: boolean;
        error?: { code?: string; description?: string; message?: string };
      };
    }>;
    bulkActionMetadata?: { totalFailures?: number; undetailedFailures?: number };
  };

  const lyckade: string[] = [];
  const misslyckade: { id: string; fel: string }[] = [];
  const sedda = new Set<string>();

  (obj.results ?? []).forEach((rad, i) => {
    const meta = rad.itemMetadata ?? {};
    const viaIndex =
      typeof meta.originalIndex === "number" ? skickadeIds[meta.originalIndex] : undefined;
    const id = meta.id ?? viaIndex ?? `rad-${i}`;
    sedda.add(id);
    if (meta.success === false) {
      const e = meta.error;
      misslyckade.push({
        id,
        fel: e?.description ?? e?.message ?? e?.code ?? "okänt radfel",
      });
    } else {
      lyckade.push(id);
    }
  });

  // Regel 1: skickat men obesvarat är inte bevisat skrivet.
  for (const id of skickadeIds) {
    if (!sedda.has(id)) {
      misslyckade.push({ id, fel: "Wix nämnde inte raden i svaret" });
    }
  }

  // Regel 2: fler fel än vi kan peka ut → ingen rad är bevisat skriven.
  const totalt = obj.bulkActionMetadata?.totalFailures ?? 0;
  if (totalt > misslyckade.length) {
    const oadresserade = totalt - misslyckade.length;
    for (const id of lyckade.splice(0, lyckade.length)) {
      misslyckade.push({
        id,
        fel: `Wix rapporterade ${oadresserade} fel utan rad-id — utfallet går inte att adressera`,
      });
    }
  }

  return { lyckade, misslyckade };
}

/**
 * Ren summering av bulk-svaret — HTTP 200 betyder INTE att alla rader gick
 * igenom (audit-fynd 4, 2026-07-14): per-rad-fel (t.ex. revisionskonflikt när
 * en kund köper samtidigt som synken skriver) rapporteras i results[] och
 * bulkActionMetadata, inte i statuskoden.
 *
 * Uttryckt i `tolkaBulkUtfall` i stället för att vara en tvilling till den —
 * två räknare på samma svar hade kunnat bli oense om vad "lyckat" betyder.
 */
export function summarizeBulkInventoryResult(json: unknown): { failures: number; firstError?: string } {
  const { misslyckade } = tolkaBulkUtfall(json, []);
  return {
    failures: misslyckade.length,
    firstError: misslyckade[0]?.fel,
  };
}

/** Sätter absoluta lagersaldon för flera varianter i en request. */
/**
 * Skriver saldon och svarar PER RAD — vilka som gick igenom och vilka som föll.
 *
 * ☠️ DEN HÄR FORMEN ÄR HELA POÄNGEN MED BATCHNINGEN. Anropas den med en enda
 * produkts varianter spelar det ingen roll om utfallet är per rad eller
 * aggregerat: faller något faller produkten. Anropas den med femtio produkter
 * i klump gör det all skillnad — "Wix före mappningen" är en garanti PER
 * PRODUKT, och en mappning får bara skrivas för de rader Wix uttryckligen
 * bekräftat. Se `tolkaBulkUtfall` för de tre konservativa reglerna.
 *
 * Kastar bara när HELA anropet föll (nätverk, 4xx/5xx efter återförsök) — då
 * finns inget svar att fördela. Per-rad-fel returneras i `misslyckade`.
 */
export async function bulkUpdateInventoryQuantitiesPerRad(
  updates: InventoryQuantityUpdate[],
): Promise<BulkLagerUtfall> {
  if (updates.length === 0) return { lyckade: [], misslyckade: [] };
  if (isDryRun()) return { lyckade: updates.map((u) => u.id), misslyckade: [] };

  // ☠️ Delas vid det UPPMÄTTA taket, inte vid ett antaget. Wix svarade 200 med
  // ett individuellt utfall per rad på 20, 50 OCH 100 rader (2026-09-04); 101
  // är oprövat, och huset har redan betalat två gånger för att lita på
  // dev.wix.com om just gränser. En tugga på femtio produkter ryms i ETT anrop
  // så länge produkterna har en variant var — delningen finns för dem som har
  // fler.
  if (updates.length > BATCH_LAGERRADER) {
    const samlat: BulkLagerUtfall = { lyckade: [], misslyckade: [] };
    for (let i = 0; i < updates.length; i += BATCH_LAGERRADER) {
      const del = await bulkUpdateInventoryQuantitiesPerRad(updates.slice(i, i + BATCH_LAGERRADER));
      samlat.lyckade.push(...del.lyckade);
      samlat.misslyckade.push(...del.misslyckade);
    }
    return samlat;
  }

  // ☠️ UTANFÖR loopen med flit. `wixHeaders()` kastar när token saknas, och
  // ett konfigurationsfel är inte övergående — inuti try-blocket hade det
  // gjorts om fyra gånger och sedan rapporterats som "nätverksfel". Ett test
  // fångade just det.
  const headers = wixHeaders();
  const body = JSON.stringify(buildBulkInventoryUpdateBody(updates));

  let res: Response | null = null;
  let sistaFel = "";
  for (let forsok = 0; forsok <= LAGER_PAUS_MS.length; forsok++) {
    let svar: Response;
    try {
      svar = await fetch(`${WIX_BASE}/stores/v3/bulk/inventory-items/update`, {
        method: "POST",
        headers,
        body,
      });
    } catch (err) {
      sistaFel = `nätverksfel: ${err instanceof Error ? err.message : String(err)}`;
      if (forsok === LAGER_PAUS_MS.length) break;
      await new Promise((r) => setTimeout(r, LAGER_PAUS_MS[forsok]));
      continue;
    }
    if (svar.ok) {
      res = svar;
      break;
    }
    const text = await svar.text();
    sistaFel = `(${svar.status}): ${text.slice(0, 400)}`;
    if (!lagerFelArOvergaende(svar.status) || forsok === LAGER_PAUS_MS.length) break;
    const retryAfter = Number(svar.headers?.get?.("retry-after"));
    await new Promise((r) =>
      setTimeout(r, Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 15_000)
        : LAGER_PAUS_MS[forsok]),
    );
  }

  if (!res) {
    throw new Error(`Wix bulk-update-inventory misslyckades ${sistaFel}`);
  }
  const json = (await res.json().catch(() => null)) as unknown;
  return tolkaBulkUtfall(json, updates.map((u) => u.id));
}

/**
 * Sätter absoluta lagersaldon för flera varianter i en request, och KASTAR om
 * någon rad föll.
 *
 * Uttryckt i `bulkUpdateInventoryQuantitiesPerRad` i stället för att vara en
 * tvilling till den. Den här formen är rätt för anropare som skriver EN
 * produkts varianter — där är "någon rad föll" samma sak som "produkten föll",
 * och ett kast är enklare att inte råka ignorera än ett returvärde. Sjunde
 * gången huset lärt sig att ett svar utan fel inte är ett kvitto.
 */
export async function bulkUpdateInventoryQuantities(updates: InventoryQuantityUpdate[]): Promise<void> {
  const { misslyckade } = await bulkUpdateInventoryQuantitiesPerRad(updates);
  if (misslyckade.length > 0) {
    throw new Error(
      `Wix bulk-update-inventory: ${misslyckade.length}/${updates.length} rader misslyckades`
        + ` — första: ${misslyckade[0].fel.slice(0, 200)}`,
    );
  }
}

export interface FulfillmentInput {
  orderId: string;
  lineItems: { id: string; quantity: number }[];
  trackingNumber: string;
  shippingProvider?: string;
  trackingLink?: string;
}

/** Skapar en fulfillment på en Wix-order med spårningsinfo. */
export async function createFulfillment(input: FulfillmentInput): Promise<{ fulfillmentId: string }> {
  if (isDryRun()) return { fulfillmentId: `dry-${input.orderId}` };
  const res = await fetch(
    `${WIX_BASE}/ecom/v1/fulfillments/orders/${encodeURIComponent(input.orderId)}/create-fulfillment`,
    {
      method: "POST",
      headers: wixHeaders(),
      body: JSON.stringify({
        fulfillment: {
          lineItems: input.lineItems,
          trackingInfo: {
            trackingNumber: input.trackingNumber,
            ...(input.shippingProvider ? { shippingProvider: input.shippingProvider } : {}),
            ...(input.trackingLink ? { trackingLink: input.trackingLink } : {}),
          },
        },
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix create-fulfillment misslyckades (${res.status}): ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as { fulfillment?: { id?: string } };
  return { fulfillmentId: data.fulfillment?.id ?? "" };
}

interface CreateProductRaw {
  product: {
    id: string;
    slug: string;
    revision: string;
    variantsInfo?: { variants?: { id: string; sku?: string }[] };
  };
}

type CreateProductAttempt =
  | { ok: true; data: CreateProductRaw }
  | { ok: false; status: number; body: string; errorCode?: string };

async function attemptCreateProduct(input: WixProductInput): Promise<CreateProductAttempt> {
  // VIKTIGT: /products-with-inventory (INTE /products). Wix skapar INTE lagerposter
  // automatiskt vid vanlig create — utan dem blir varianterna "Slut i lager" och
  // den separata setInitialStock-queryn hittade inga poster att uppdatera (bug
  // 2026-05-31, andra försöket). Denna endpoint skapar produkt + lager atomiskt
  // via variantsInfo.variants[].inventoryItem som buildCreateProductBody sätter.
  const res = await fetch(`${WIX_BASE}/stores/v3/products-with-inventory`, {
    method: "POST",
    headers: wixHeaders(),
    body: JSON.stringify(buildCreateProductBody(input)),
  });
  if (res.ok) {
    return { ok: true, data: (await res.json()) as CreateProductRaw };
  }
  const body = await res.text();
  let errorCode: string | undefined;
  try {
    const parsed = JSON.parse(body) as {
      details?: { applicationError?: { code?: string } };
    };
    errorCode = parsed?.details?.applicationError?.code;
  } catch {
    // icke-JSON-body — errorCode lämnas undefined
  }
  return { ok: false, status: res.status, body, errorCode };
}

function isSlugCollision(attempt: CreateProductAttempt): boolean {
  return !attempt.ok && attempt.status === 409 && attempt.errorCode === "DUPLICATE_SLUG_ERROR";
}

/** 4 tecken base36 — räcker för att undvika kollision när -2..-10 också är tagna. */
function randomSlugSuffix(): string {
  return Math.random().toString(36).slice(2, 6).padEnd(4, "0");
}

export async function createProduct(input: WixProductInput): Promise<WixCreateProductResult> {
  if (isDryRun()) {
    return {
      id: `dry-${Date.now()}`,
      slug: input.slug ?? "dry-run",
      revision: "1",
      variants: input.variants.map((v, i) => ({ id: `dry-var-${i}`, sku: v.sku })),
    };
  }

  let attempt = await attemptCreateProduct(input);
  let slugSuffix: string | undefined;

  // Slug-kollision: Wix V3 returnerar 409 DUPLICATE_SLUG_ERROR när någon
  // annan produkt redan tagit slug:en. Vi vill INTE skriva över existerande
  // produkt — istället lägger vi på ett suffix (-2..-10, sen slumpat).
  // Produktens namn ändras inte; endast URL-slug:en.
  if (isSlugCollision(attempt) && input.slug) {
    const baseSlug = input.slug;
    for (let i = 2; i <= 10; i++) {
      const suffix = `-${i}`;
      const retry = await attemptCreateProduct({ ...input, slug: baseSlug + suffix });
      if (retry.ok) {
        slugSuffix = suffix;
        attempt = retry;
        console.warn(
          `[wix.createProduct] DUPLICATE_SLUG_ERROR: "${baseSlug}" upptagen, använder "${baseSlug + suffix}".`,
        );
        break;
      }
      if (!isSlugCollision(retry)) {
        attempt = retry;
        break;
      }
      attempt = retry;
    }

    if (isSlugCollision(attempt)) {
      const suffix = `-${randomSlugSuffix()}`;
      const retry = await attemptCreateProduct({ ...input, slug: baseSlug + suffix });
      if (retry.ok) {
        slugSuffix = suffix;
        attempt = retry;
        console.warn(
          `[wix.createProduct] DUPLICATE_SLUG_ERROR: numeriska suffix uttömda, använder slumpad "${baseSlug + suffix}".`,
        );
      } else {
        attempt = retry;
      }
    }
  }

  if (!attempt.ok) {
    throw new Error(`Wix create-product misslyckades (${attempt.status}): ${attempt.body.slice(0, 500)}`);
  }

  const data = attempt.data;
  const variants = (data.product.variantsInfo?.variants ?? []).map((v) => ({
    id: v.id,
    sku: v.sku ?? "",
  }));
  return {
    id: data.product.id,
    slug: data.product.slug,
    revision: data.product.revision,
    variants,
    ...(slugSuffix ? { slugSuffix } : {}),
  };
}

/**
 * En koppling bild→optionsval: visa media-item:et vars `altText` matchar, när
 * kunden väljer `choiceName` i `optionName`.
 */
export interface ChoiceMediaLink {
  optionName: string;
  choiceName: string;
  /**
   * Exakt altText som satts på swatch-bildens media-item i createProduct. Detta
   * är den STABILA matchningsnyckeln mot produktens media-pool: Wix re-importerar
   * varje bild till produkten och tilldelar då ett NYTT id OCH en NY URL (verifierat
   * 2026-06-01), så varken uppladdnings-id:t eller -URL:en går att matcha på — men
   * altText följer med oförändrad och är unik per val.
   */
  altText: string;
}

/**
 * Kopplar produktbilder till specifika optionsval (V3 `linkedMedia`) så att
 * huvudbilden byts när kunden väljer t.ex. "Blå". Verifierad mot V3 2026-06-01:
 *   1. Bilderna måste FÖRST ligga i produktens media-pool (laddas upp med en unik
 *      altText per val + skickas som mediaItems i createProduct). linkedMedia vid
 *      CREATE ger 404 PRODUCT_MEDIA_NOT_EXIST eftersom Wix ingest:ar asynkront.
 *   2. Vi matchar media-item → val på altText (id/URL byts vid Wix re-import och
 *      duger inte som nyckel) och läser id:t ur produkt-readbacken.
 *   3. PATCH:ar options.choicesSettings.choices[].linkedMedia = [{ id }] (+ skickar
 *      variantsInfo verbatim, annars 428 MISSING_VARIANT_OPTION_CHOICE). Ingest:en
 *      är asynkron (~5 s) så PATCH:en kan "lyckas" (200) men tappa linkedMedia tills
 *      bilden är klar → vi verifierar via re-GET och försöker om med ny revision.
 * Fail-open: loggar och returnerar antal lyckade kopplingar (0 vid fel) — bild-
 * kopplingen får ALDRIG fälla en import.
 */
export async function linkChoiceMedia(productId: string, links: ChoiceMediaLink[]): Promise<number> {
  if (isDryRun() || links.length === 0) return 0;
  const url = `${WIX_BASE}/stores/v3/products/${encodeURIComponent(productId)}?fields=MEDIA_ITEMS_INFO`;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const getProductRaw = async (): Promise<any | null> => {
    const res = await fetch(url, { headers: wixHeaders() });
    return res.ok ? (await res.json()).product : null;
  };
  // Sätter linkedMedia på matchande val genom att slå upp media-item-id via altText.
  // Returnerar [options, antal satta].
  const applyLinks = (product: any): [any[], number] => {
    const idByAlt = new Map<string, string>();
    for (const it of product?.media?.itemsInfo?.items ?? []) {
      const alt = it?.altText ?? it?.image?.altText;
      if (alt && it?.id && !idByAlt.has(alt)) idByAlt.set(alt, it.id);
    }
    const options: any[] = product.options ?? [];
    let n = 0;
    for (const opt of options) {
      for (const ch of opt?.choicesSettings?.choices ?? []) {
        const link = links.find((l) => l.optionName === opt.name && l.choiceName === ch.name);
        if (!link) continue;
        const id = idByAlt.get(link.altText);
        if (!id) continue;
        ch.linkedMedia = [{ id }];
        n++;
      }
    }
    return [options, n];
  };

  // Antalet val som matchar på NAMN (oberoende av om bilden hunnit ingest:as) —
  // om 0 finns inget att vänta på och vi ger upp direkt.
  const linkNames = new Set(links.map((l) => `${l.optionName} ${l.choiceName}`));
  const countLinked = (p: any): number =>
    (p?.options ?? []).reduce(
      (sum: number, o: any) =>
        sum + (o?.choicesSettings?.choices ?? []).filter((c: any) => (c.linkedMedia ?? []).length).length,
      0,
    );

  try {
    // Upp till 8 försök (~20 s) för att rida ut den asynkrona media-ingest:en (~5 s
    // typiskt, men varierar). intended===0 = bilden ännu inte ingest:ad → försök om.
    let target = 0;
    let best = 0;
    for (let attempt = 0; attempt < 10; attempt++) {
      const product = await getProductRaw();
      if (!product) break;

      if (attempt === 0) {
        target = (product.options ?? []).reduce(
          (sum: number, o: any) =>
            sum + (o?.choicesSettings?.choices ?? []).filter((c: any) => linkNames.has(`${o.name} ${c.name}`)).length,
          0,
        );
        if (target === 0) {
          console.warn(`[wix.linkChoiceMedia] inga val matchar på namn för ${productId} (${links.length} länkar).`);
          return 0;
        }
      }

      const [options, intended] = applyLinks(product);
      if (intended > 0) {
        const body = {
          product: { revision: product.revision, options, variantsInfo: product.variantsInfo },
          fieldMask: { paths: ["options", "variantsInfo"] },
        };
        const res = await fetch(`${WIX_BASE}/stores/v3/products/${encodeURIComponent(productId)}`, {
          method: "PATCH",
          headers: wixHeaders(),
          body: JSON.stringify(body),
        });
        if (res.ok) {
          // Verifiera att linkedMedia faktiskt persisterades (kan tappas medan media
          // fortfarande ingest:as trots 200-svar).
          best = countLinked(await getProductRaw());
          if (best >= target) return best;
        } else if (res.status !== 404 && res.status !== 409 && res.status !== 428) {
          // 404 (media ej klar) / 409 (revision) / 428 → försök om; annat = ge upp.
          console.warn(`[wix.linkChoiceMedia] PATCH misslyckades (${res.status}): ${(await res.text()).slice(0, 200)}`);
          return best;
        }
      }
      await new Promise((r) => setTimeout(r, 2500));
    }
    if (best < target) {
      console.warn(`[wix.linkChoiceMedia] kopplade ${best}/${target} val för ${productId} (media ingest:ades långsamt).`);
    }
    return best;
  } catch (err) {
    console.warn("[wix.linkChoiceMedia] fel (icke-fatalt):", err instanceof Error ? err.message : String(err));
    return 0;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export interface WixProductSnapshot {
  id: string;
  revision: string;
  name: string;
  /** URL-slug (för att bygga produktsidans länk i restock-mejl). */
  slug?: string;
  visible: boolean;
  variants: { id: string; sku: string; actualPriceAmount: string }[];
}

/** Hämtar en produkt från V3-katalogen (används av review-kön för publish). */
export async function getProduct(productId: string): Promise<WixProductSnapshot | null> {
  const url = `${WIX_BASE}/stores/v3/products/${encodeURIComponent(productId)}?fields=PLAIN_DESCRIPTION`;
  const res = await fetch(url, { method: "GET", headers: wixHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix get-product misslyckades (${res.status}): ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    product: {
      id: string;
      revision: string;
      name: string;
      slug?: string;
      visible?: boolean;
      variantsInfo?: {
        variants?: { id: string; sku?: string; price?: { actualPrice?: { amount?: string } } }[];
      };
    };
  };
  const p = data.product;
  return {
    id: p.id,
    revision: p.revision,
    name: p.name,
    slug: p.slug,
    visible: p.visible ?? true,
    variants: (p.variantsInfo?.variants ?? []).map((v) => ({
      id: v.id,
      sku: v.sku ?? "",
      actualPriceAmount: v.price?.actualPrice?.amount ?? "0",
    })),
  };
}

export interface WixProductSummary {
  id: string;
  name?: string;
  slug?: string;
  visible?: boolean;
}

/**
 * Batch-uppslag av namn/slug/synlighet för många produkt-id:n på en gång —
 * admin-vyer (t.ex. /admin/sync-alerts) länkar till live-sidan och visar
 * produktnamn utan ett API-anrop per rad. Chunkar på 100 (V3-searchens
 * sidgräns). Okända id:n saknas bara i svaret — kastar aldrig för dem.
 */
export async function searchProductSummaries(ids: string[]): Promise<Map<string, WixProductSummary>> {
  const map = new Map<string, WixProductSummary>();
  const unique = [...new Set(ids.filter(Boolean))];
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    const res = await fetch(`${WIX_BASE}/stores/v3/products/search`, {
      method: "POST",
      headers: wixHeaders(),
      body: JSON.stringify({
        search: { filter: { id: { $in: chunk } }, cursorPaging: { limit: 100 } },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Wix product-search misslyckades (${res.status}): ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      products?: { id?: string; name?: string; slug?: string; visible?: boolean }[];
    };
    for (const p of data.products ?? []) {
      if (p.id) map.set(p.id, { id: p.id, name: p.name, slug: p.slug, visible: p.visible });
    }
  }
  return map;
}

export interface WixProductEnrichInfo {
  id: string;
  revision: string;
  name: string;
  /** Rik beskrivnings-HTML (PLAIN_DESCRIPTION) — källan för flik-back-fill. */
  plainDescription: string;
}

/**
 * Hämtar en produkts beskrivning + revision för flik-back-fill
 * (/admin/enrich-products). Returnerar null vid 404.
 */
export async function getProductForEnrich(productId: string): Promise<WixProductEnrichInfo | null> {
  const url = `${WIX_BASE}/stores/v3/products/${encodeURIComponent(productId)}?fields=PLAIN_DESCRIPTION`;
  const res = await fetch(url, { method: "GET", headers: wixHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix get-product (enrich) misslyckades (${res.status}): ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    product: { id: string; revision: string; name?: string; plainDescription?: string };
  };
  const p = data.product;
  return {
    id: p.id,
    revision: p.revision,
    name: p.name ?? "",
    plainDescription: p.plainDescription ?? "",
  };
}

/**
 * Skriver om produktens beskrivning (plainDescription) — används av flik-back-fill
 * för att foga in de genererade <h2>-flikblocken. PATCH med fieldMask så endast
 * beskrivningen rörs. Returnerar nya revisionen.
 */
export async function updateProductDescription(
  productId: string,
  revision: string,
  plainDescription: string,
): Promise<{ revision: string }> {
  if (isDryRun()) return { revision };
  const body = {
    product: { revision, plainDescription },
    fieldMask: { paths: ["plainDescription"] },
  };
  const res = await fetch(`${WIX_BASE}/stores/v3/products/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    headers: wixHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix update-description misslyckades (${res.status}): ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as { product?: { revision?: string } };
  return { revision: data.product?.revision ?? revision };
}

/** Sätter visible på en produkt (true = synlig, false = dold i butiken). */
export async function setProductVisibility(
  productId: string,
  revision: string,
  visible: boolean,
): Promise<{ revision: string }> {
  if (isDryRun()) return { revision };
  const body = {
    product: { revision, visible },
    fieldMask: { paths: ["visible"] },
  };
  const res = await fetch(`${WIX_BASE}/stores/v3/products/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    headers: wixHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix set-visibility misslyckades (${res.status}): ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as { product?: { revision?: string; visible?: boolean } };
  // Verifiera att ändringen faktiskt TILLÄMPADES (audit-fynd 5, 2026-07-14):
  // lagerbuggen (#307) lärde oss att Wix tyst ignorerar okända fält och ändå
  // svarar 200 + bumpar revision. Denna skrivväg har aldrig exercerats i
  // drift — utan echo-kontrollen skulle en trasig body se lyckad ut.
  const got = data.product?.visible;
  if (typeof got === "boolean" && got !== visible) {
    throw new Error(
      `Wix set-visibility: svaret ekar visible=${got} trots begärt ${visible} — uppdateringen tillämpades inte (fältmasken ignorerad?).`,
    );
  }
  if (got === undefined) {
    console.warn(`[wix] set-visibility ${productId}: svaret saknar visible-fältet — kan inte verifiera att ändringen tillämpades.`);
  }
  return { revision: data.product?.revision ?? revision };
}

// --------------------------------------------------------------------------
// Kategorier (Wix Stores Catalog V3)
//
// VIKTIGT (bug 2026-06-01, fix): Den gamla koden anropade /stores/v3/collections/query
// ("collections"). Butiken är Catalog V3 och har INGA collections — anropet gav 404
// (och /stores/v1/.../query gav 428 "site is using CATALOG_V3"). De riktiga
// kategorierna (Leksaker & Spel, Förvaring & Organisering, ...) ligger i den DELADE
// Categories-tjänsten, inte under stores/*. Verifierad endpoint mot site
// e6d27e90-...: POST /categories/v1/categories/query med treeReference appNamespace
// "@wix/stores" → 200 med alla 45 kategorier. Add-to-category sker via
// /categories/v1/bulk/categories/{id}/add-items med samma treeReference + Wix Stores
// app-id som item-referens.
// Docs: https://dev.wix.com/docs/rest/business-management/categories/
// --------------------------------------------------------------------------

/** Wix Stores app-id — krävs som item-referens när produkter läggs i en kategori. */
const WIX_STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";
/** Categories-tjänsten är multi-app; för Stores-katalogen är trädet alltid detta. */
const CATEGORIES_TREE_REFERENCE = { appNamespace: "@wix/stores" } as const;

export interface WixCollection {
  id: string;
  name: string;
  /** Stabil slug — det vi mappar tillbaka mot vid auto-kategorisering. */
  slug: string;
  description?: string;
  /** Förälderkategorins id (saknas för rotkategorier). */
  parentId?: string;
}

interface WixCategoryRaw {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  parentCategory?: { id?: string };
}

/**
 * Modulnivå-cache. Kategorier ändras sällan (Leonard skapar/redigerar dem
 * manuellt i Wix-adminet) så en kort TTL räcker — en varm lambda slipper då
 * göra om query:n för varje produkt i en bulk-import. Cachen delas inte mellan
 * kall-starter, vilket är helt OK.
 */
let categoriesCache: { at: number; data: WixCollection[] } | null = null;
const CATEGORIES_CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Hämtar alla Wix Stores-kategorier via den delade Categories-tjänsten.
 * Paginerar tills cursor är slut och cachar resultatet (TTL ovan).
 * Behåller namnet getCollections() så anroparna (lib/import/pipeline.ts) inte
 * behöver röras — "kollektion" och "kategori" är samma sak för vår del.
 */
export async function getCollections(): Promise<WixCollection[]> {
  if (categoriesCache && Date.now() - categoriesCache.at < CATEGORIES_CACHE_TTL_MS) {
    return categoriesCache.data;
  }

  const all: WixCollection[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 20; page++) {
    const cursorPaging: Record<string, unknown> = { limit: 100 };
    if (cursor) cursorPaging.cursor = cursor;
    const res = await fetch(`${WIX_BASE}/categories/v1/categories/query`, {
      method: "POST",
      headers: wixHeaders(),
      body: JSON.stringify({
        treeReference: CATEGORIES_TREE_REFERENCE,
        query: { cursorPaging },
      }),
    });
    if (!res.ok) {
      // Saknad katalogapp eller saknade scopes — tolerera tyst (importen
      // ska inte falla bara för att kategoriförslaget inte går att göra).
      if (res.status === 404 || res.status === 403) return all;
      const text = await res.text();
      throw new Error(`Wix get-categories misslyckades (${res.status}): ${text.slice(0, 400)}`);
    }
    const data = (await res.json()) as {
      categories?: WixCategoryRaw[];
      pagingMetadata?: { cursors?: { next?: string }; hasNext?: boolean };
    };
    for (const c of data.categories ?? []) {
      if (!c.slug || !c.name) continue;
      all.push({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        ...(c.parentCategory?.id ? { parentId: c.parentCategory.id } : {}),
      });
    }
    cursor = data.pagingMetadata?.cursors?.next;
    if (!data.pagingMetadata?.hasNext || !cursor) break;
  }

  categoriesCache = { at: Date.now(), data: all };
  return all;
}

/**
 * Lägger till en produkt i en kategori via Categories-tjänstens
 * bulk-add-items-endpoint. Produkten refereras med Wix Stores app-id +
 * produkt-id (catalogItemId). Auto-hanterade kategorier (t.ex. "All Products")
 * returnerar 403 MANAGED_CATEGORY_OPERATION_NOT_ALLOWED — det är förväntat och
 * får bubbla upp (pipelinen demoterar då förslaget till "suggested").
 */
export async function addProductToCollection(productId: string, collectionId: string): Promise<void> {
  if (isDryRun()) return;
  const res = await fetch(
    `${WIX_BASE}/categories/v1/bulk/categories/${encodeURIComponent(collectionId)}/add-items`,
    {
      method: "POST",
      headers: wixHeaders(),
      body: JSON.stringify({
        treeReference: CATEGORIES_TREE_REFERENCE,
        items: [{ appId: WIX_STORES_APP_ID, catalogItemId: productId }],
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix add-to-category misslyckades (${res.status}): ${text.slice(0, 400)}`);
  }
}

// --------------------------------------------------------------------------
// Media-hantering på existerande produkt (för "Ta bort bild" i kö-UI:t)
// --------------------------------------------------------------------------

export interface WixProductMediaSnapshot {
  id: string;
  revision: string;
  media: { url: string; altText?: string; id?: string }[];
}

/** Hämtar produktens nuvarande mediaItems (för att kunna ta bort en specifik bild). */
export async function getProductMedia(productId: string): Promise<WixProductMediaSnapshot | null> {
  // ☠️ fields=MEDIA_ITEMS_INFO ÄR OBLIGATORISKT. Utan det returnerar V3 en
  // produkt med `media.main` ifylld men `media.itemsInfo.items` TOM — inte ett
  // fel, bara en tystare projektion. Uppmätt 2026-08-27 på en produkt med fem
  // bilder: 0 utan fältet, 5 med.
  //
  // Två saker gick sönder på det, båda tyst: bildreparationen såg alla 744
  // Aosom-produkter som bildlösa, och knappen "ta bort bild" i /admin/queue
  // filtrerade en tom lista, såg ingen skillnad och anropade därför aldrig Wix
  // — den har aldrig gjort något.
  const url = `${WIX_BASE}/stores/v3/products/${encodeURIComponent(productId)}?fields=MEDIA_ITEMS_INFO`;
  const res = await fetch(url, { method: "GET", headers: wixHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix get-product-media misslyckades (${res.status}): ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    product: {
      id: string;
      revision: string;
      media?: {
        main?: { image?: { url?: string; altText?: string; id?: string } } & {
          url?: string;
          altText?: string;
          id?: string;
        };
        itemsInfo?: {
          items?: Array<
            { image?: { url?: string; altText?: string; id?: string } } & {
              url?: string;
              altText?: string;
              id?: string;
            }
          >;
        };
      };
    };
  };
  const items = data.product.media?.itemsInfo?.items ?? [];
  const media = items
    .map((it) => {
      const url = it.image?.url ?? it.url;
      const altText = it.image?.altText ?? it.altText;
      const id = it.image?.id ?? it.id;
      return url ? { url, altText, id } : null;
    })
    .filter((m): m is { url: string; altText: string | undefined; id: string | undefined } => m !== null);
  return { id: data.product.id, revision: data.product.revision, media };
}

/**
 * Skriver om produktens mediaItems till den nya listan (utan den
 * borttagna bilden). Wix V3 ersätter hela media-arrayen vid PATCH med
 * fieldMask=["media"].
 */
export async function setProductMedia(
  productId: string,
  revision: string,
  media: { id?: string; url: string; altText?: string }[],
): Promise<{ revision: string }> {
  if (isDryRun()) return { revision };
  // ☠️ `id` när bilden redan ligger i Media Manager. Skickas `url` importerar Wix
  // om den till en NY fil — se kommentaren på WixProductInput.mediaItems.
  const items = media.map((m) => ({
    ...(m.id ? { id: m.id } : { url: m.url }),
    ...(m.altText ? { altText: m.altText } : {}),
  }));
  const body = {
    product: {
      revision,
      // `media.main` är read-only i V3 och härleds ur första posten.
      media: { itemsInfo: { items } },
    },
    fieldMask: { paths: ["media"] },
  };
  const res = await fetch(`${WIX_BASE}/stores/v3/products/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    headers: wixHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix set-media misslyckades (${res.status}): ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as { product?: { revision?: string } };
  return { revision: data.product?.revision ?? revision };
}
