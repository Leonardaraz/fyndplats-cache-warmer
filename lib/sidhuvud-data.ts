// Sidhuvudets meny och REA-knapp utan att en kall instans väntar in katalogen.
// Vägvalet och raden prövas i lib/sidhuvud-val.ts; här är kopplingen till
// katalogen och Wix.
//
// ☠️ LÄSNINGEN GÖRS MED fetch UTAN CACHE-VAL, med flit (som lib/popularity.ts).
// Den körs inne i ISR-renderingen, och `cache: "no-store"`, som lib/wix-lager.ts
// använder, gör en ISR-sida dynamisk mitt i renderingen så att Next svarar 500
// ("Page changed from static to dynamic at runtime", lib/kort-livslangd.ts).
// Utan cache-val lagras svaret inte i datacachen och sidan förblir statisk.
// Färskheten styrs av minnet nedan: en minut per instans.
//
// SKRIVNINGEN görs av /api/cron/meny var 15:e minut, med samma kod som en varm
// instans använder (bygg). En degraderad katalog sparas aldrig, och en meny med
// för få huvudkategorier inte heller.

import { getCategoryTree, type CategoryNode } from "./category-groups";
import { utanAntal } from "./meny-antal";
import { getProducts, katalogenArDegraderad, katalogenLaddad } from "./products";
import { K, WIX_DATA_BAS, hamta, spara, wixDataRubriker } from "./wix-lager";
import {
  MENY_LAS_TIDSGRANS_MS, harRea, menyRadId, radForMeny, tolkaSparadMeny, valjSidhuvud, varforInteSpara,
  type Sidhuvudsdata,
} from "./sidhuvud-val";

export type Meny = Sidhuvudsdata<CategoryNode>;

const RAD_ID = menyRadId(process.env.VERCEL_ENV);
/** Så länge håller en instans den färdiga menyn innan den läser om den. */
const MINNE_MS = 60_000;
/** Efter ett fel försöker instansen igen så här snart. */
const MINNE_FEL_MS = 10_000;

async function bygg(): Promise<Meny & { degraderad: boolean }> {
  const [tree, produkter] = await Promise.all([getCategoryTree(), getProducts()]);
  // Trädet utan antal: siffrorna hämtas i webbläsaren (lib/meny-antal.ts).
  return { tree: utanAntal(tree), hasSale: harRea(produkter), degraderad: katalogenArDegraderad(produkter) };
}

async function levande(): Promise<Meny> {
  const { tree, hasSale } = await bygg();
  return { tree, hasSale };
}

async function lasRad(): Promise<Meny | null> {
  // Utan nyckel (lokalt utan Wix) finns ingen färdig meny att läsa.
  if (!process.env.WIX_API_KEY || !process.env.WIX_SITE_ID) return null;
  const res = await fetch(
    `${WIX_DATA_BAS}/items/${encodeURIComponent(RAD_ID)}?dataCollectionId=${encodeURIComponent(K.installningar)}`,
    // INGET cache-val, med flit (se överst).
    { headers: wixDataRubriker(), signal: AbortSignal.timeout(MENY_LAS_TIDSGRANS_MS) },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const svar = (await res.json()) as { dataItem?: { data?: Record<string, unknown> } };
  return tolkaSparadMeny(svar.dataItem?.data, Date.now());
}

let minne: { at: number; ttl: number; lofte: Promise<Meny | null> } | null = null;

/** Den färdiga menyn, delad av alla renderingar på instansen i en minut. */
function sparad(): Promise<Meny | null> {
  const nu = Date.now();
  if (minne && nu - minne.at < minne.ttl) return minne.lofte;
  const post: { at: number; ttl: number; lofte: Promise<Meny | null> } = { at: nu, ttl: MINNE_MS, lofte: Promise.resolve(null) };
  post.lofte = lasRad().catch((e) => {
    post.ttl = MINNE_FEL_MS;
    console.warn(`[meny] kunde inte läsa den färdiga menyn: ${e instanceof Error ? e.message.slice(0, 120) : String(e)}`);
    return null;
  });
  minne = post;
  return post.lofte;
}

// En rad per instans och väg, så att loggen visar hur ofta den färdiga menyn
// sparade väntan (och hur ofta reserven behövdes) utan att fylla den.
const loggat = new Set<string>();

/** Menyn (utan antal) och om REA-knappen ska visas. */
export async function sidhuvudsdata(): Promise<Meny> {
  const { data, kalla } = await valjSidhuvud<CategoryNode>({ laddad: katalogenLaddad, levande, sparad });
  if (kalla !== "levande" && !loggat.has(kalla)) {
    loggat.add(kalla);
    if (kalla === "sparad") console.info(`[meny] ny instans: sidhuvudet läste den färdiga menyn (${RAD_ID}) i stället för att vänta in katalogen`);
    else console.warn(`[meny] ingen färdig meny (${RAD_ID}); sidhuvudet byggdes ur katalogen som förut`);
  }
  return data;
}

export type MenyUtfall =
  | { ok: true; andrad: boolean; grupper: number; underkategorier: number; byte: number; hasSale: boolean }
  | { ok: false; orsak: string };

/** Bygger menyn ur katalogen och sparar den åt de kalla instanserna (/api/cron/meny). */
export async function byggOchSparaMeny(): Promise<MenyUtfall> {
  const { tree, hasSale, degraderad } = await bygg();
  const varfor = varforInteSpara({ tree, hasSale }, degraderad);
  if (varfor) return { ok: false, orsak: varfor };
  const rad = radForMeny({ tree, hasSale }, Date.now());
  const forra = await hamta(K.installningar, RAD_ID).catch(() => null);
  const andrad = forra?.menyJson !== rad.menyJson || forra?.hasSale !== rad.hasSale;
  await spara(K.installningar, RAD_ID, rad);
  minne = null;
  return { ok: true, andrad, grupper: rad.grupper, underkategorier: rad.underkategorier, byte: rad.byte, hasSale };
}
