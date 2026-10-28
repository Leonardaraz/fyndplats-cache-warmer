// lib/auction/store.ts
//
// Fyndauktionens persistens och pris-PATCH mot Stores V3. Ren logik ligger i
// ./engine — här bor I/O.
//
// ☠️ TVÅ LAGER, EN VÄLJARE. Raderna bor i Wix Data (FyndplatsAuctions) eller i
// Postgres (./store-postgres), och `auctionsBackend()` i lib/store/backend.ts
// avgör vilket — aldrig anroparen. Default är Wix: att deploya koden får inte
// byta lager. Butiken läser och avslutar via motorns rutter (/api/auctions/*),
// så den följer med i samma växling.
//
// Wix Data går via lib/db/wix-data-klient.ts sedan 2026-10-29: markör till
// slutet, massanrop i omgångar och återförsök på kvotstopp (WDE0014).
//
// Pris-PATCH följer SEO-runbookens hårda regler: färsk revision precis före
// PATCH, `options` + `variantsInfo` skickas ihop (428-fällan), och priser är
// hela kronor med 9-slut. `compareAtPrice` sätts till listpriset under
// auktionen (ger överstruket ord.pris i storefronten) och rensas vid slut.

import { WIX_BASE, wixHeaders } from "@/lib/wix/client";
import { KOSTNAD_EJ_LASBAR, KOSTNADSFALT, arKostnadNekadSvar, variantMedKostnad } from "@/lib/wix/produkt-kostnad";
import { auctionsBackend } from "@/lib/store/backend";
import { allaRader, fraga, sparaManga, spara, taBort, taBortManga } from "@/lib/db/wix-data-klient";
import type { AuctionDoc } from "./engine";
import {
  pgQueryAuctions,
  pgRemoveAuction,
  pgRemoveAuctionsBulk,
  pgSaveAuction,
  pgSaveAuctionsBulk,
  pgSenastSalda,
} from "./store-postgres";

export const AUCTION_COLLECTION = "FyndplatsAuctions";

function headers(): Record<string, string> {
  return wixHeaders();
}

/** Vilket lager som servar just nu. Står i rutternas svar, så en växling går
 *  att se utifrån i stället för att antas ur en env-panel. */
export function auktionslager(): "wix-data" | "postgres" {
  return auctionsBackend();
}

const iPostgres = () => auctionsBackend() === "postgres";

/**
 * Alla auktioner med status i `statuses` (kö-ordning stigande).
 *
 * `köHuvud`: läs bara de första N köade (Postgres). Wix-vägen tar redan
 * högst 1 000 rader totalt och bryr sig inte om gränsen.
 */
export async function queryAuctions(
  statuses: string[],
  opts: { köHuvud?: number } = {},
): Promise<AuctionDoc[]> {
  return iPostgres() ? pgQueryAuctions(statuses, opts.köHuvud) : wixQueryAuctions(statuses, opts.köHuvud);
}

/**
 * De senast sålda, nyast först — butikens "Senast sålda fynd".
 * Wix: sorterad fråga med en sida på högst 50 (samma som butiken gjorde själv).
 */
export async function senastSalda(limit: number): Promise<AuctionDoc[]> {
  if (iPostgres()) return pgSenastSalda(limit);
  const rader = await fraga<AuctionDoc & { _id?: string }>(AUCTION_COLLECTION, {
    filter: { status: "sold" },
    sort: [{ fieldName: "endedAt", order: "DESC" }],
    limit: Math.min(Math.max(1, limit), 50),
  });
  return rader.map(tillDok).filter((d) => d && d.productId);
}

/** En rad ur Wix som auktionsdokument. Wix ger ibland datum som `{"$date": …}`; motorn och butiken gör Date.parse. */
function tillDok(d: AuctionDoc & { _id?: string }): AuctionDoc {
  const ut = { ...d } as Record<string, unknown>;
  for (const k of ["startAt", "endedAt"]) {
    const v = ut[k];
    if (v && typeof v === "object" && typeof (v as { $date?: unknown }).$date === "string") ut[k] = (v as { $date: string }).$date;
  }
  return ut as unknown as AuctionDoc;
}

export async function saveAuction(doc: AuctionDoc): Promise<void> {
  return iPostgres() ? pgSaveAuction(doc) : wixSaveAuction(doc);
}

export async function saveAuctionsBulk(docs: AuctionDoc[]): Promise<string[]> {
  return iPostgres() ? pgSaveAuctionsBulk(docs) : wixSaveAuctionsBulk(docs);
}

export async function removeAuctionsBulk(ids: string[]): Promise<string[]> {
  return iPostgres() ? pgRemoveAuctionsBulk(ids) : wixRemoveAuctionsBulk(ids);
}

/** Tar bort ett auktionsdokument (används när en köad produkt diskvalificeras). */
export async function removeAuction(id: string): Promise<void> {
  return iPostgres() ? pgRemoveAuction(id) : wixRemoveAuction(id);
}

/**
 * Alla med status i `statuses`, i köordning — med markör till slutet.
 *
 * ☠️ Den gamla vägen läste EN sida om 1 000 rader. Kön var 4 522 rader när
 * datan flyttade tillbaka till Wix (2026-10-29): seeden, pensioneringens
 * spärr och morgonmejlet hade sett en fjärdedel av den, utan ett ord.
 *
 * `köHuvud` som i Postgres: bara kön begränsas, till de första N i
 * köordning. Ticken går var tionde minut och främjar högst fem; att läsa hela
 * kön varje gång hade ätit läskvoten för ingenting.
 */
async function wixQueryAuctions(statuses: string[], köHuvud?: number): Promise<AuctionDoc[]> {
  if (statuses.length === 0) return [];
  const iKöordning = [{ fieldName: "queueOrder", order: "ASC" as const }];
  const begränsa = typeof köHuvud === "number" && köHuvud >= 0 && statuses.includes("queued");
  let rader: (AuctionDoc & { _id?: string })[];
  if (begränsa) {
    const övriga = statuses.filter((st) => st !== "queued");
    const huvud = Math.floor(köHuvud);
    const [andra, kö] = await Promise.all([
      övriga.length
        ? allaRader<AuctionDoc & { _id?: string }>(AUCTION_COLLECTION, { filter: { status: { $in: övriga } }, sort: iKöordning })
        : Promise.resolve([]),
      huvud === 0
        ? Promise.resolve([])
        : huvud <= 1000
          ? fraga<AuctionDoc & { _id?: string }>(AUCTION_COLLECTION, { filter: { status: "queued" }, sort: iKöordning, limit: huvud })
          : allaRader<AuctionDoc & { _id?: string }>(AUCTION_COLLECTION, { filter: { status: "queued" }, sort: iKöordning }).then((r) => r.slice(0, huvud)),
    ]);
    rader = [...andra, ...kö].sort((a, b) => (a.queueOrder ?? Infinity) - (b.queueOrder ?? Infinity));
  } else {
    rader = await allaRader<AuctionDoc & { _id?: string }>(AUCTION_COLLECTION, {
      filter: { status: { $in: statuses } },
      sort: iKöordning,
    });
  }
  return rader.map(tillDok).filter((d) => d && d.productId);
}

/** Full-ersättande save (Wix Data har ingen partial-patch värd namnet här). */
async function wixSaveAuction(doc: AuctionDoc): Promise<void> {
  if (!doc._id) throw new Error("saveAuction: dokumentet saknar _id");
  await spara(AUCTION_COLLECTION, doc._id, { ...doc } as unknown as Record<string, unknown>);
}

/**
 * Bulk-save i chunkar om 100. Seedens ~400 enskilda saves sprängde Wix Datas
 * per-minut-kvot (WDE0014: 279/399 sparade, resten 429 — kön halvskriven).
 * Bulk-endpointen tar 100 dokument per anrop → hela kön på 4 anrop.
 * Returnerar felbeskrivningar (tom lista = allt sparat).
 */
async function wixSaveAuctionsBulk(docs: AuctionDoc[]): Promise<string[]> {
  const utan = docs.filter((d) => !d._id);
  if (utan.length) return [`bulkSave: ${utan.length} dokument saknar _id`];
  const u = await sparaManga(
    AUCTION_COLLECTION,
    docs.map((d) => ({ id: d._id as string, data: { ...d } as unknown as Record<string, unknown> })),
  );
  return u.fel.map((f) => `bulkSave ${f.id}: ${f.fel}`);
}

/**
 * Bulk-borttagning i chunkar om 100 (samma kvot-skäl som saveAuctionsBulk).
 * Returnerar felbeskrivningar (tom lista = allt borttaget).
 */
async function wixRemoveAuctionsBulk(ids: string[]): Promise<string[]> {
  return (await taBortManga(AUCTION_COLLECTION, ids)).fel.map((f) => `bulkRemove ${f}`);
}

/**
 * Känner igen "produkten är raderad"-fel från pris-PATCH:arna. applyVariantPatch
 * gör alltid en GET före PATCH; svarar den 404 finns produkten inte längre i
 * katalogen. Sådana fel är INTE transienta — auktionsdokumentet måste bort,
 * annars fastnar raden som evig live-zombie och blockerar sin slot (det var
 * exakt så /fyndauktion krympte till 2 produkter: tre raderade produkter höll
 * slot 1, 2 och 5 gisslan i veckor).
 */
export function isProductGone(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /patch GET 404\b/.test(msg);
}

/**
 * Finns produkten kvar i katalogen? 404 = raderad. Alla andra svar (även fel)
 * tolkas som "finns" — ett transient Wix-fel får aldrig leda till att
 * kö-dokument slängs eller att en främjning hoppar över en levande produkt.
 */
export async function productExists(productId: string): Promise<boolean> {
  try {
    const res = await fetch(`${WIX_BASE}/stores/v3/products/${productId}`, {
      method: "GET",
      headers: headers(),
    });
    return res.status !== 404;
  } catch {
    return true;
  }
}

async function wixRemoveAuction(id: string): Promise<void> {
  // "fanns-inte" = redan borta, som 404 förut.
  await taBort(AUCTION_COLLECTION, id);
}

interface RawVariant {
  id: string;
  price?: { actualPrice?: { amount?: string }; compareAtPrice?: { amount?: string } };
  [k: string]: unknown;
}

/** Nytt pris (och ev. jämförpris) för en variant. compareAt null = rensa. */
type VariantTarget = { price: number; compareAt: number | null };

/**
 * Delad GET→map→PATCH mot Stores V3. `resolve` returnerar nytt pris per variant
 * (eller null = lämna variantens pris orört). Följer runbookens hårda regler:
 * färsk revision, options + variantsInfo skickas ihop (428), visible:true.
 */
async function applyVariantPatch(
  productId: string,
  resolve: (v: RawVariant) => VariantTarget | null,
  precheck?: (variants: RawVariant[]) => void,
): Promise<void> {
  // ☠️ Läsningen ber om varukostnaden (MERCHANT_DATA). PATCH:en nedan skickar hela
  // variantsInfo, och den ersätter varianterna: utan fältet i läsningen nollades
  // kostnaden på auktionsprodukten vid varje prissänkning. Nekas fältet (403) läses
  // produkten utan det och priset sätts som förut — en prissänkning får aldrig
  // stoppas av ett kosmetiskt fält — men det loggas (lib/wix/produkt-kostnad.ts).
  let getRes = await fetch(`${WIX_BASE}/stores/v3/products/${productId}?${KOSTNADSFALT}`, {
    method: "GET",
    headers: headers(),
  });
  if (!getRes.ok && arKostnadNekadSvar(getRes.status, await getRes.clone().text())) {
    console.warn(`[auction] ${KOSTNAD_EJ_LASBAR}: ${productId}`);
    getRes = await fetch(`${WIX_BASE}/stores/v3/products/${productId}`, { method: "GET", headers: headers() });
  }
  if (!getRes.ok) {
    const text = await getRes.text();
    throw new Error(`patch GET ${getRes.status}: ${text.slice(0, 200)}`);
  }
  const data = (await getRes.json()) as {
    product?: { revision?: string; options?: unknown[]; variantsInfo?: { variants?: RawVariant[] } };
  };
  const p = data.product;
  if (!p?.revision || !p.variantsInfo?.variants?.length) {
    throw new Error(`patch(${productId}): saknar revision/varianter`);
  }
  precheck?.(p.variantsInfo.variants);
  const variants = p.variantsInfo.variants.map((raw) => {
    // Bara kostnaden går tillbaka av revenueDetails (profit och profitMargin är skrivskyddade).
    const v = variantMedKostnad(raw);
    const t = resolve(raw);
    if (!t) return v;
    return {
      ...v,
      price: {
        ...(v.price ?? {}),
        actualPrice: { amount: String(t.price) },
        ...(t.compareAt != null ? { compareAtPrice: { amount: String(t.compareAt) } } : { compareAtPrice: null }),
      },
    };
  });
  const body: Record<string, unknown> = {
    product: {
      id: productId,
      revision: p.revision,
      // En variantsInfo-PATCH på publicerad produkt kan flippa visible → skicka alltid true.
      visible: true,
      variantsInfo: { ...p.variantsInfo, variants },
      // options MÅSTE följa med när variantsInfo skickas (V3 428) — men bara om de finns.
      ...(Array.isArray(p.options) && p.options.length > 0 ? { options: p.options } : {}),
    },
  };
  const patchRes = await fetch(`${WIX_BASE}/stores/v3/products/${productId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!patchRes.ok) {
    const text = await patchRes.text();
    throw new Error(`patch PATCH ${patchRes.status}: ${text.slice(0, 300)}`);
  }
}

/**
 * ENKEL-PRIS-läge (legacy + enkel-variant): sätter samma pris på ALLA varianter.
 * `compareAt` = listpris under auktion, null för att rensa (återställning).
 *
 * `requireUniform` (pris-SÄNKNINGAR i ticken): vägra om varianterna inte längre
 * delar ETT pris — enkel-pris-läget får aldrig platta ett prisspann (fel pris/
 * förlust på dyraste varianten). Återställningar skickar false så priset aldrig
 * fastnar på auktionsnivå. Multi-variant-produkter använder patchProductVariants.
 */
export async function patchProductPrice(
  productId: string,
  newPrice: number,
  compareAt: number | null,
  requireUniform = false,
): Promise<void> {
  const precheck = requireUniform
    ? (variants: RawVariant[]) => {
        const distinct = new Set(variants.map((v) => v.price?.actualPrice?.amount ?? ""));
        if (distinct.size > 1) {
          throw new Error(
            `patchProductPrice(${productId}): varianterna har olika priser (${[...distinct].join(", ")}) — vägrar sänka`,
          );
        }
      }
    : undefined;
  await applyVariantPatch(productId, () => ({ price: newPrice, compareAt }), precheck);
}

/**
 * PER-VARIANT-läge: varje variant sätts till sitt eget pris (och jämförpris).
 * `byVariantId`: wixVariantId → {price, compareAt}. Varianter som saknas i
 * mappen lämnas orörda (skulle en ny variant dyka upp mellan seed och tick).
 */
export async function patchProductVariants(
  productId: string,
  byVariantId: Map<string, VariantTarget>,
): Promise<void> {
  await applyVariantPatch(productId, (v) => byVariantId.get(v.id) ?? null).catch((e) => {
    throw new Error(`patchProductVariants ${(e as Error).message}`);
  });
}

/**
 * Återställ produkten till ordinariepris (per variant om trackar finns) och
 * rensa det överstrukna jämförpriset. EN definition: timcronens sold- och
 * dagslutssteg och butikens direktavslut (/api/auctions/avsluta) använder den.
 * Butiken hade tidigare en egen port av samma PATCH; två kopior av en
 * prisåterställning är två ställen där ett auktionspris kan bli kvar.
 */
export async function restoreListPrice(a: AuctionDoc): Promise<void> {
  if (a.variantPrices?.length) {
    const byVariant = new Map(a.variantPrices.map((t) => [t.wixVariantId, { price: t.listPrice, compareAt: null }]));
    await patchProductVariants(a.productId, byVariant);
  } else {
    await patchProductPrice(a.productId, a.listPrice, null);
  }
}
