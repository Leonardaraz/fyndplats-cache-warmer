// Skrivstöd för FyndplatsRedirects — headless-sajtens 301-tabell.
//
// När en produkt tas bort ur Wix svarar /produkt/<slug> annars 404: gamla
// Google-träffar, annonslänkar och delningar landar i väggen och länkvärdet går
// förlorat. Storefronten (lib/redirects.ts i headless-repot) slår upp den här
// collectionen på 404-vägen och svarar 308 mot `toPath` i stället.
//
// Läsvägen bor i headless-appen; HÄR ligger skrivvägen, eftersom motorn har
// Wix-admin-nyckeln och är den som upptäcker borttagna produkter.

import { mapWithConcurrency } from "../concurrency";
import { katalogenHarSynligProdukt, slugArSynligProdukt } from "./v3-products";

const WIX_BASE = "https://www.wixapis.com";
const COLLECTION = process.env.WIX_DATA_COL_REDIRECTS ?? "FyndplatsRedirects";

// Samma auth-form som lib/sync/sync-log.ts och lib/wix/client.ts: token i
// WIX_API_TOKEN (INTE WIX_API_KEY — det namnet finns inte i miljön) och
// wix-site-id bara när det är satt.
function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { Authorization: token, "Content-Type": "application/json" };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

export interface RedirectRow {
  /** Produkt-slug UTAN /produkt/-prefix, t.ex. "gammal-produkt". */
  fromSlug: string;
  /** Intern målsökväg, t.ex. "/produkt/ny-produkt" eller "/kategori/leksaker-spel". */
  toPath: string;
  reason?: string;
}

/**
 * Validerar en redirect innan den skrivs. Endast interna, absoluta sökvägar
 * accepteras — en felskriven rad ska aldrig kunna skicka besökare till en
 * främmande sajt (samma regel som storefrontens sanitizeRedirectTarget) eller
 * smuggla in radbrytningar i Location-headern.
 *
 * Returnerar felmeddelande, eller null när raden är giltig.
 */
export function validateRedirect(row: RedirectRow): string | null {
  const from = (row.fromSlug || "").trim();
  const to = (row.toPath || "").trim();
  if (!from) return "fromSlug saknas";
  if (from.startsWith("/")) return "fromSlug ska vara enbart slug, utan /produkt/-prefix";
  if (!/^[a-z0-9åäö][a-z0-9åäö-]*$/i.test(from)) return `ogiltig fromSlug: ${from}`;
  if (!to.startsWith("/") || to.startsWith("//")) return "toPath måste vara en intern sökväg som börjar med /";
  if (/[\s\r\n]/.test(to)) return "toPath får inte innehålla mellanslag eller radbrytningar";
  if (from === to.replace(/^\/produkt\//, "")) return "fromSlug och toPath pekar på samma sida";
  return null;
}

export interface RedirectConflict {
  fromSlug: string;
  problem: string;
}

/**
 * Hur många slug-frågor en batch har i luften samtidigt. En rad kostar som mest
 * två frågor à ~0,1 s, så femtio rader tar ett par sekunder med fyra i taget.
 * En obegränsad `Promise.all` hade avfyrat alla på en gång mot en Wix som
 * stryper på tempo (se `lib/concurrency.ts` för vad en obegränsad fan-out kostat).
 */
export const SAMTIDIGA_SLUGFRAGOR = 4;

/** Produktmålets slug i gemener, eller "" när målet inte är en produktsida. */
function produktmalSlug(toPath: string): string {
  const to = (toPath || "").trim();
  return to.startsWith("/produkt/") ? to.slice("/produkt/".length).split(/[?#]/)[0].toLowerCase() : "";
}

/**
 * Andra försvarslinjen: stoppar redirects som pekar BORT från levande sidor.
 *
 * validateRedirect() ser bara på strängarna. Den kan inte veta om slugen
 * fortfarande är en säljbar produkt — och det är precis det som gick fel
 * 2026-07-31: två rader skrevs för produkter som råkade svara 404 för stunden
 * (utgången ISR-cache), fast båda var `visible: true` och i lager. En 308 är
 * PERMANENT; hade den hunnit fyra hade Google avindexerat två säljande
 * produktsidor. En tredje rad från 2026-07-14 hade blivit inaktuell på samma
 * sätt när produkten återkom.
 *
 * Lärdomen: HTTP-status är ett för svagt bevis för att en produkt är död.
 * Katalogen är facit.
 *
 * ☠️ MEN EN TRÄFF ÄR INTE EN LEVANDE SIDA — och den här kommentaren påstod i
 * månader att den var det. Den skrev att `listAllV3Products()` "returnerar
 * bara synliga produkter (query:t sätter inte returnNonVisibleProducts)".
 * Det är fel: `products/query` lägger INTE på något implicit `visible:true`,
 * vilket huset redan mätt upp och skrivit ned (CLAUDE.md, 2026-09-02 — ett
 * utkast returneras med `visible:false` av en fråga som inte nämner
 * synlighet alls). Listan bar dessutom inget `visible`-fält, så påståendet
 * gick inte att motbevisa genom att läsa koden intill.
 *
 * Felet gick åt BÅDA håll, och det andra är det dyra:
 *   1. En 301 FRÅN ett pensionerat utkast vägrades som "en säljande sida".
 *      Falsklarm — irriterande, men ofarligt.
 *   2. En 301 TILL ett utkast SLÄPPTES IGENOM. Målkontrollen finns just för
 *      att stoppa en redirect som leder till en 404, och den kunde aldrig
 *      fälla en: ett osynligt utkast låg i `liveSlugs` som vilken sida som
 *      helst. En kontroll som inte KAN fälla räknas ändå som gjord.
 *
 * Mätt 2026-09-16 på trappkärran `59c3b5d6`: avpublicerad (revision 10,
 * `visible:false` i både GET och search), och rutten vägrade ändå med
 * "är fortfarande en synlig produkt".
 *
 * Två kontroller:
 *   1. fromSlug får inte vara en levande produkt (annars kapar vi en säljande sida).
 *   2. toPath som pekar på /produkt/<slug> måste vara en levande produkt
 *      (annars omdirigerar vi från en död sida till en annan död sida).
 *
 * ☠️ FRÅGA PER ADRESS, LÄS ALDRIG HELA KATALOGEN (2026-09-30). Kontrollen läste
 * hela katalogen för att svara på en fråga om en eller två adresser: 6 311
 * produkter på 64 sidor, ~1 s per sida. Att stryka PLAIN_DESCRIPTION
 * (`4a0dd284`) räckte inte, för bara sidorna tog ~63 s mot ruttens tak på 60.
 * Rutten dog med 504 två gånger samma kväll på EN rad, och raden fick
 * kontrolleras för hand och skrivas med `force`. Nu ställs en exakt slug-fråga
 * per berörd adress (`slugArSynligProdukt`), och en rad kostar tre frågor på
 * ~0,1 s var.
 *
 * Fail-CLOSED med flit: går en fråga inte att ställa vet vi inget och skriver
 * inget. Motsatsen — skriva i blindo — är just det som orsakade incidenten.
 * Läsvägen i storefronten är fortfarande fail-open; att INTE kunna lägga till
 * en redirect är ofarligt, att lägga till fel redirect är det inte.
 */
export async function findRedirectConflicts(rows: RedirectRow[]): Promise<RedirectConflict[]> {
  if (!rows.length) return [];

  const kallor = rows.map((r) => (r.fromSlug || "").trim().toLowerCase());
  const mal = rows.map((r) => produktmalSlug(r.toPath));
  // Varje adress frågas en gång, även när flera rader pekar på samma mål.
  const slugs = [...new Set([...kallor, ...mal].filter(Boolean))];

  const synlig = new Map<string, boolean>();
  try {
    // Med en fråga per adress ÄR "ingen träff" beskedet att en källa är
    // ledig, så en tom eller felkopplad katalog hade godkänt varje rad. Samma
    // spärr som helkatalogsläsningen hade mot noll synliga produkter. Den går
    // först, så att en fallen kontroll inte hinner starta några slug-frågor.
    if (!(await katalogenHarSynligProdukt())) {
      return rows.map((r) => ({
        fromSlug: r.fromSlug,
        problem: "produktkatalogen kom tillbaka tom — vägrar skriva utan facit",
      }));
    }
    // En lambda, inte funktionen rakt av: mapWithConcurrency skickar index som
    // andra argument, och där tar slugArSynligProdukt emot sin fetch.
    const svar = await mapWithConcurrency(slugs, SAMTIDIGA_SLUGFRAGOR, (slug) => slugArSynligProdukt(slug));
    slugs.forEach((slug, i) => synlig.set(slug, svar[i]));
  } catch (err) {
    const detail = err instanceof Error ? err.message.slice(0, 200) : String(err);
    return rows.map((r) => ({
      fromSlug: r.fromSlug,
      problem: `kunde inte verifiera mot produktkatalogen, skriver inget: ${detail}`,
    }));
  }

  const conflicts: RedirectConflict[] = [];
  for (const [i, row] of rows.entries()) {
    if (synlig.get(kallor[i]) === true) {
      conflicts.push({
        fromSlug: row.fromSlug,
        problem: `"${row.fromSlug}" är fortfarande en synlig produkt — en 301 hade kapat en säljande sida`,
      });
      continue;
    }
    const to = (row.toPath || "").trim();
    if (mal[i] && synlig.get(mal[i]) !== true) {
      conflicts.push({
        fromSlug: row.fromSlug,
        problem: `målet ${to} är ingen synlig produkt — redirecten hade lett till en 404`,
      });
    }
  }
  return conflicts;
}

/**
 * Skriver (eller uppdaterar) en redirect-rad. Idempotent: id = fromSlug, så
 * samma slug kan skrivas om utan att skapa dubbletter.
 */
export async function upsertRedirect(row: RedirectRow): Promise<void> {
  const problem = validateRedirect(row);
  if (problem) throw new Error(`Ogiltig redirect (${row.fromSlug}): ${problem}`);
  const id = row.fromSlug.trim();
  const res = await fetch(`${WIX_BASE}/wix-data/v2/items/save`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      dataCollectionId: COLLECTION,
      dataItem: {
        id,
        dataCollectionId: COLLECTION,
        data: {
          _id: id,
          fromSlug: id,
          toPath: row.toPath.trim(),
          reason: (row.reason || "").trim() || "Tillagd via /api/admin/redirects",
        },
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix Data save ${COLLECTION} (${res.status}): ${text.slice(0, 300)}`);
  }
}

/** Läser befintliga redirects (för verifiering/listning i admin-verktyget). */
export async function listRedirects(limit = 200): Promise<RedirectRow[]> {
  const res = await fetch(`${WIX_BASE}/wix-data/v2/items/query`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      dataCollectionId: COLLECTION,
      query: { filter: {}, sort: [{ fieldName: "_updatedDate", order: "DESC" }], paging: { limit } },
    }),
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    const text = await res.text();
    throw new Error(`Wix Data query ${COLLECTION} (${res.status}): ${text.slice(0, 300)}`);
  }
  const body = (await res.json()) as { dataItems?: { data?: RedirectRow }[] };
  return (body.dataItems ?? []).map((d) => d.data).filter((d): d is RedirectRow => Boolean(d));
}
