// Tömmer produktsidor som ändrats — den verkställande halvan av lib/produkt-cache.ts.
//
// ☠️ BARA FÖR ROUTE HANDLERS OCH CRON. Hämtningarna här har `cache: "no-store"`,
// och en sådan hämtning mitt i en sidrendering gör en ISR-sida dynamisk (Next
// svarar 500 "Page changed from static to dynamic at runtime", se lib/popularity.ts).
// Importera aldrig modulen från en sida eller komponent.
//
// Tre källor till "vad har ändrats":
//   · Wix-produkten: V3 Query Products på updatedDate. Fältet flyttas av allt som
//     rör produkten i Wix — synkens pris och lager (lagret verifierat 2026-09-30:
//     produkter vars lager synken skrev 18:20 UTC hade updatedDate 18:20–18:21),
//     fyndauktionens prissteg, Leonards ändringar i Wix, poleringens texter och
//     bilder, sammanslagningar och synlighet.
//   · Köp: nya ordrar i Wix. Ett köp drar ner lagret, och det är inte verifierat
//     att det flyttar produktens updatedDate — därför läses ordrarna för sig.
//     Webhooken tömmer sidan redan vid köpet, men Wix läsning kan släpa efter en
//     skrivning (motorns CLAUDE.md), så en ombyggnad i samma sekund kan få med
//     det gamla lagret. Cronens tömning kommer minuter senare och rättar det.
//   · Motorn: recensioner ligger i motorns Postgres, inte i Wix. Motorns
//     /api/review-andringar listar produkter vars recensioner ändrats sedan en tidpunkt.

import { revalidatePath, revalidateTag } from "next/cache";
import { behoverSlug, planeraUppdatering, type AndradProdukt, type Uppdateringsplan } from "./produkt-cache";

const WIX_API_KEY = process.env.WIX_API_KEY;
const WIX_SITE_ID = process.env.WIX_SITE_ID || "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";
const V3_QUERY = "https://www.wixapis.com/stores/v3/products/query";
const ORDERS_SEARCH = "https://www.wixapis.com/ecom/v1/orders/search";

/** Motorns lista över produkter med ändrade recensioner. Eget segment med flit:
 *  /api/reviews/<något> fångas av motorns [productId]-rutt (se lib/review-aggregates.ts).
 *  Hemligheten skickas med, så en överstyrd adress måste vara https. */
const RECENSIONSANDRINGAR_STANDARD = "https://fyndplats-cache-warmer.vercel.app/api/review-andringar";
function recensionsAdress(): string {
  const overstyrd = process.env.CACHE_WARMER_REVIEW_CHANGES_URL;
  if (!overstyrd) return RECENSIONSANDRINGAR_STANDARD;
  try {
    if (new URL(overstyrd).protocol === "https:") return overstyrd;
  } catch {
    // faller igenom
  }
  console.error("[uppdatera] CACHE_WARMER_REVIEW_CHANGES_URL är inte en https-adress — använder standardadressen");
  return RECENSIONSANDRINGAR_STANDARD;
}

/** Högst så många sidor à 100 per körning (en natts prissynk ryms med marginal). */
const MAX_SIDOR = 30;
/** Väntan före omförsök när Wix svarar 429/5xx eller nätet fallerar. */
const OMFORSOK_MS = [2_000, 5_000];

class TillfalligtFel extends Error {}

async function vanta(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

/** Kör `fn`, och gör om den efter en paus om felet är tillfälligt (429, 5xx, nät). */
async function medOmforsok<T>(fn: () => Promise<T>): Promise<T> {
  for (let forsok = 0; ; forsok++) {
    try {
      return await fn();
    } catch (e) {
      if (!(e instanceof TillfalligtFel) || forsok >= OMFORSOK_MS.length) throw e;
      await vanta(OMFORSOK_MS[forsok]);
    }
  }
}

async function wixPost<T>(url: string, kropp: unknown, namn: string): Promise<T> {
  if (!WIX_API_KEY) throw new Error("WIX_API_KEY saknas");
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { Authorization: WIX_API_KEY, "wix-site-id": WIX_SITE_ID, "Content-Type": "application/json" },
      body: JSON.stringify(kropp),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch (e) {
    throw new TillfalligtFel(`${namn}: ${(e as Error).message}`);
  }
  if (res.status === 429 || res.status >= 500) throw new TillfalligtFel(`${namn}: HTTP ${res.status}`);
  if (!res.ok) throw new Error(`${namn}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

interface V3Produkt { id?: string; slug?: string }
interface V3Svar {
  products?: V3Produkt[];
  pagingMetadata?: { hasNext?: boolean; cursors?: { next?: string } };
}

const v3Fraga = (kropp: unknown) => medOmforsok(() => wixPost<V3Svar>(V3_QUERY, kropp, "Wix V3 query"));

/** Nuvarande slug per Wix-id (id → slug), i omgångar om 100. Döljda produkter ingår. */
export async function hamtaSlugs(ids: readonly string[]): Promise<Map<string, string>> {
  const ut = new Map<string, string>();
  for (let i = 0; i < ids.length; i += 100) {
    const svar = await v3Fraga({
      query: { filter: { id: { $in: ids.slice(i, i + 100) } }, cursorPaging: { limit: 100 } },
      fields: [],
    });
    for (const p of svar.products ?? []) if (p.id && p.slug) ut.set(p.id.toLowerCase(), p.slug);
  }
  return ut;
}

/**
 * Produkter vars updatedDate är senare än `sedan` (ISO), nyast först.
 * `trunkerad` betyder att fönstret hade fler än MAX_SIDOR × 100 ändringar: de
 * ÄLDSTA i fönstret töms då inte av den här körningen (och nästa körnings fönster
 * börjar senare), så de väntar på säkerhetsnätet. Loggas som fel.
 */
export async function andradeIWix(sedan: string): Promise<{ produkter: AndradProdukt[]; trunkerad: boolean }> {
  const produkter: AndradProdukt[] = [];
  let svar = await v3Fraga({
    query: {
      filter: { updatedDate: { $gt: sedan } },
      sort: [{ fieldName: "updatedDate", order: "DESC" }],
      cursorPaging: { limit: 100 },
    },
    fields: [],
  });
  for (let sida = 1; ; sida++) {
    for (const p of svar.products ?? []) if (p.id) produkter.push({ id: p.id, slug: p.slug, vad: "produkt" });
    const nasta = svar.pagingMetadata?.cursors?.next;
    if (!svar.pagingMetadata?.hasNext || !nasta) return { produkter, trunkerad: false };
    if (sida >= MAX_SIDOR) {
      console.error(
        `[uppdatera] fler än ${MAX_SIDOR * 100} ändrade produkter sedan ${sedan} — de äldsta i fönstret `
          + "töms inte nu utan när säkerhetsnätet (6 h) går ut. Kör ?minuter= för hand om det gäller priser.",
      );
      return { produkter, trunkerad: true };
    }
    // Med en cursor bär Wix själv filtret och sorteringen.
    svar = await v3Fraga({ query: { cursorPaging: { limit: 100, cursor: nasta } }, fields: [] });
  }
}

interface OrderSvar {
  orders?: { lineItems?: { catalogReference?: { catalogItemId?: string } }[] }[];
  pagingMetadata?: { cursors?: { next?: string } };
}

/**
 * Produkter som köpts i ordrar skapade efter `sedan`. Bara produkt-id:n lämnar
 * funktionen — ordrarnas kunduppgifter läses aldrig vidare och loggas aldrig.
 */
export async function kopteProdukter(sedan: string): Promise<AndradProdukt[]> {
  const ids = new Set<string>();
  let cursor: string | undefined;
  for (let sida = 0; sida < 5; sida++) {
    const svar = await medOmforsok(() =>
      wixPost<OrderSvar>(
        ORDERS_SEARCH,
        {
          search: {
            filter: { createdDate: { $gte: sedan } },
            cursorPaging: cursor ? { limit: 100, cursor } : { limit: 100 },
          },
        },
        "Wix orders search",
      ),
    );
    for (const o of svar.orders ?? []) {
      for (const rad of o.lineItems ?? []) {
        const id = rad.catalogReference?.catalogItemId;
        if (typeof id === "string" && id) ids.add(id);
      }
    }
    cursor = svar.pagingMetadata?.cursors?.next || undefined;
    if (!cursor) break;
  }
  return [...ids].map((id) => ({ id, vad: "produkt" as const }));
}

/**
 * Produkt-id:n vars recensioner ändrats sedan `sedan`. `null` betyder att motorn
 * inte svarade som väntat (t.ex. innan motorns del är deployad) — då töms inga
 * recensioner den här gången, men säkerhetsnätet på sex timmar gäller fortfarande.
 */
export async function andradeRecensioner(sedan: string): Promise<AndradProdukt[] | null> {
  const hemlighet = process.env.REVIEW_INGEST_SECRET;
  if (!hemlighet) return null;
  try {
    const res = await fetch(`${recensionsAdress()}?sedan=${encodeURIComponent(sedan)}`, {
      headers: { Authorization: `Bearer ${hemlighet}` },
      cache: "no-store",
      // En omdirigering hade tagit hemligheten med sig till en annan värd.
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { produkter?: unknown; trunkerad?: unknown };
    if (!Array.isArray(body.produkter)) return null;
    if (body.trunkerad === true) {
      console.error(`[uppdatera] motorn kapade listan med recensionsändringar sedan ${sedan} — resten väntar på säkerhetsnätet`);
    }
    return body.produkter
      .filter((x): x is string => typeof x === "string")
      .map((id) => ({ id, vad: "recensioner" as const }));
  } catch {
    return null;
  }
}

/**
 * Tömmer det som ändrats för varje produkt, och själva sidan.
 *
 * Taggarna töms med `expire: 0`: nästa hämtning är blockerande och färsk, inte
 * stale-while-revalidate (node_modules/next/dist/docs/01-app/03-api-reference/
 * 04-functions/revalidateTag.md: webhooks och externa system som kräver direkt
 * utgång). Sidan töms med revalidatePath: nästa besök bygger om den med färsk data.
 *
 * ⚠️ Tömningen verkställs först när route-hanteraren svarat (Next lägger den i
 * waitUntil), inte när funktionen här returnerar. Den som värmer sidorna efteråt
 * ska därför vänta en stund först — se VANTA_FORE_VARMNING_MS i rutterna.
 */
export async function uppdateraProduktsidor(poster: readonly AndradProdukt[]): Promise<Uppdateringsplan & { uppslagFel?: string }> {
  let slugPerId = new Map<string, string>();
  let uppslagFel: string | undefined;
  const saknas = behoverSlug(poster);
  if (saknas.length) {
    try {
      slugPerId = await hamtaSlugs(saknas);
    } catch (e) {
      // Utan slug töms ändå taggarna — sidan själv byggs då om vid säkerhetsnätet,
      // eller när nästa körning hittar produkten igen.
      uppslagFel = (e as Error).message.slice(0, 200);
    }
  }
  const plan = planeraUppdatering(poster, slugPerId);
  for (const t of plan.taggar) revalidateTag(t, { expire: 0 });
  for (const s of plan.sokvagar) revalidatePath(s);
  return uppslagFel ? { ...plan, uppslagFel } : plan;
}
