// Inventering av Media Manager: vilka bilder används inte av något i katalogen?
//
// VARFÖR DEN INTE KAN KÖRAS FRÅN CHATTEN
// Mediabiblioteket på headless-sajten innehöll 30 231 bilder vid mätningen
// 2026-08-27. Ett filobjekt är ~1,3 kB, så en full listning är ~39 MB — den
// ryms inte i en chattsession oavsett hur tålmodig man är. Här, med nycklarna
// i miljön, är samma jobb ~170 API-anrop och några sekunder.
//
// VAD "OANVÄND" BETYDER HÄR — LÄS DETTA INNAN DU RADERAR NÅGOT
// Rapporten svarar på EN fråga: refereras filen av katalogen (produkter +
// kategorier)? Den svarar INTE på om filen används av något ANNAT:
//
//   · sidor, banners, logotyper och bakgrunder i Wix-sajten
//   · bloggen, Wix-appar, e-postutskick
//   · CMS-kollektioner (recensionsbilderna ligger i FyndplatsImportedReviews
//     på det ANDRA site-id:t — se auditReviewMedia nedan)
//   · något som bara en människa vet om
//
// Därför heter fältet `utanKatalogreferens` och inte `oanvända`, och därför
// finns ingen raderingsväg i den här filen. Listan är ett underlag för en
// människa, inte en dödslista. Wix Media har inget "var används den här
// filen"-API (kontrollerat 2026-08-27), så skillnaden går inte att räkna bort
// — bara att vara ärlig om.

import { produktensMedianycklar, type ProduktMedia } from "./produkt-media";

const WIX_BASE = "https://www.wixapis.com";
const DEFAULT_HEADLESS_SITE_ID = "e6d27e90-4749-4720-9afe-0bbe91c1b3d3";

function headers(siteId: string): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  return { Authorization: token, "wix-site-id": siteId, "Content-Type": "application/json" };
}

export function headlessSiteId(): string {
  return process.env.HEADLESS_WIX_SITE_ID || DEFAULT_HEADLESS_SITE_ID;
}

/** Site-id:t där CMS-kollektionerna (recensioner m.m.) ligger — ett ANNAT än butikens. */
export function cmsSiteId(): string | undefined {
  return process.env.WIX_SITE_ID || undefined;
}

export interface MediaFile {
  id: string;
  displayName: string;
  sizeInBytes: number;
  createdDate?: string;
  mediaType?: string;
  parentFolderId?: string;
  hash?: string;
}

export interface AuditBudget {
  /** Stanna självmant före ruttens maxDuration i stället för att dödas mitt i. */
  deadline: number;
}

function budgetExceeded(b?: AuditBudget): boolean {
  return Boolean(b && Date.now() > b.deadline);
}

/**
 * Listar ALLA bildfiler i ett site:s Media Manager.
 *
 * Sidstorleken är 200 (API:ets tak). `nextCursor.total` läses från första
 * sidan så anroparen kan se om körningen hann klart eller stannade på budget.
 */
export async function listAllMediaFiles(
  siteId: string,
  budget?: AuditBudget,
): Promise<{ files: MediaFile[]; total: number; complete: boolean }> {
  const files: MediaFile[] = [];
  let cursor: string | undefined;
  let total = 0;

  // Taket är en säkring mot en cursor som aldrig tar slut, inte en förväntan:
  // 400 sidor à 200 = 80 000 filer, rejält över de 30 231 som fanns 2026-08-27.
  for (let page = 0; page < 400; page++) {
    if (budgetExceeded(budget)) return { files, total, complete: false };

    const body: Record<string, unknown> = {
      rootFolder: "MEDIA_ROOT",
      mediaTypes: ["IMAGE"],
      paging: cursor ? { limit: 200, cursor } : { limit: 200 },
    };
    const res = await fetch(`${WIX_BASE}/site-media/v1/files/search`, {
      method: "POST",
      headers: headers(siteId),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Media search failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      files?: Array<{
        id?: string;
        displayName?: string;
        sizeInBytes?: string;
        createdDate?: string;
        mediaType?: string;
        parentFolderId?: string;
        hash?: string;
      }>;
      nextCursor?: { total?: number; hasNext?: boolean; cursors?: { next?: string } };
    };

    for (const f of data.files ?? []) {
      if (!f.id) continue;
      files.push({
        id: f.id,
        displayName: f.displayName ?? "",
        sizeInBytes: Number(f.sizeInBytes ?? 0) || 0,
        createdDate: f.createdDate,
        mediaType: f.mediaType,
        parentFolderId: f.parentFolderId,
        hash: f.hash,
      });
    }

    if (page === 0) total = data.nextCursor?.total ?? files.length;
    cursor = data.nextCursor?.cursors?.next;
    if (!data.files?.length || !cursor || data.nextCursor?.hasNext === false) {
      return { files, total: total || files.length, complete: true };
    }
  }
  return { files, total, complete: false };
}

/** En produkt i katalogsvepet: det raderingen och inventeringen behöver veta. */
export interface KatalogProdukt {
  id: string;
  visible: boolean;
  slug: string;
  /** Filernas nycklar — lib/wix/produkt-media.ts är definitionen. */
  nycklar: string[];
}

/** Återförsök vid 429/5xx/edge-HTML, samma steg som prislistan (lib/wix/v3-products.ts). */
const SVEP_PAUS_MS = [1_000, 3_000, 8_000];
/** Paus mellan sidor — billigare än ett återförsök. */
const SVEP_SIDPAUS_MS = 120;

/**
 * Hela katalogen, en post per produkt, med varje fil produkten använder.
 *
 * ☠️ `fields` SKICKAS OM PÅ VARJE SIDA. Utan det svarar sida två med
 * galleriet FRÅNVARANDE (uppmätt 2026-09-16: 0 av 100 med bara markören),
 * och då ser varje produkt efter sida ett bildlös ut.
 *
 * `complete: false` betyder att svepet stannade på tidsbudgeten eller sidtaket.
 * En anropare som fattar ett beslut om EN produkt utifrån svepet — som
 * raderingen av pensionerade utkast — måste vägra ett ofullständigt svep.
 */
export async function listCatalogProductMedia(
  siteId: string,
  budget?: AuditBudget,
): Promise<{ produkter: KatalogProdukt[]; complete: boolean }> {
  const produkter: KatalogProdukt[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < 200; page++) {
    if (budgetExceeded(budget)) return { produkter, complete: false };
    if (page > 0) await new Promise((r) => setTimeout(r, SVEP_SIDPAUS_MS));

    const cursorPaging: Record<string, unknown> = { limit: 100 };
    if (cursor) cursorPaging.cursor = cursor;
    let res: Response | null = null;
    let sistaFel = "";
    for (let forsok = 0; forsok <= SVEP_PAUS_MS.length; forsok++) {
      try {
        res = await fetch(`${WIX_BASE}/stores/v3/products/search`, {
          method: "POST",
          headers: headers(siteId),
          body: JSON.stringify({ fields: ["MEDIA_ITEMS_INFO"], search: { cursorPaging } }),
        });
      } catch (err) {
        sistaFel = err instanceof Error ? err.message : String(err);
        res = null;
      }
      if (res?.ok) break;
      if (res) {
        const text = await res.text();
        sistaFel = `${res.status}: ${text.slice(0, 200)}`;
        const overgaende = res.status === 429 || res.status >= 500 || text.trimStart().startsWith("<");
        res = null;
        if (!overgaende) break;
      }
      if (forsok < SVEP_PAUS_MS.length) await new Promise((r) => setTimeout(r, SVEP_PAUS_MS[forsok]));
    }
    if (!res) throw new Error(`Product search failed on page ${page} (${sistaFel})`);

    const data = (await res.json()) as {
      products?: Array<ProduktMedia & { id?: string; visible?: boolean; slug?: string }>;
      pagingMetadata?: { cursors?: { next?: string }; hasNext?: boolean };
    };

    for (const p of data.products ?? []) {
      if (!p.id) continue;
      produkter.push({
        id: p.id,
        visible: p.visible !== false,
        slug: p.slug ?? "",
        nycklar: produktensMedianycklar(p),
      });
    }

    cursor = data.pagingMetadata?.cursors?.next;
    if (!data.products?.length || !cursor || data.pagingMetadata?.hasNext === false) {
      return { produkter, complete: true };
    }
  }
  return { produkter, complete: false };
}

/**
 * Alla mediaid katalogen refererar.
 *
 * `media.itemsInfo.items` räcker för produkten: Wix kräver att både `media.main`
 * och varje `linkedMedia` finns i galleriet (försöker man ta bort en länkad bild
 * ur galleriet svarar API:t 404 PRODUCT_MEDIA_NOT_EXIST). Vi läser ändå main och
 * linkedMedia explicit — kostar ingenting och gör spärren oberoende av att den
 * invarianten fortsätter gälla. Definitionen bor i lib/wix/produkt-media.ts.
 */
export async function collectCatalogMediaIds(
  siteId: string,
  budget?: AuditBudget,
): Promise<{ ids: Set<string>; products: number; complete: boolean }> {
  const { produkter, complete } = await listCatalogProductMedia(siteId, budget);
  const ids = new Set<string>();
  for (const p of produkter) for (const k of p.nycklar) ids.add(k);
  return { ids, products: produkter.length, complete };
}

/**
 * Filernas tillstånd i Media Manager: `OK`, `DELETED` (i papperskorgen) — och
 * en fil som inte finns i svaret finns inte alls.
 *
 * Läser bara. Finns för raderingen av pensionerade utkast
 * (lib/aosom/pensionerade.ts), som efter varje raderad produkt kontrollerar att
 * filerna den delade med en annan produkt finns kvar. Wix dokumentation säger
 * inte vad som händer med bildfilerna när en produkt raderas; det här är hur
 * det mäts i stället för antas.
 *
 * ☠️ KASTAR VID FEL. Ett misslyckat anrop får aldrig se ut som "alla filer finns".
 */
export async function getFileStates(siteId: string, fileIds: string[]): Promise<Map<string, string>> {
  const ut = new Map<string, string>();
  const ids = [...new Set(fileIds.filter(Boolean))];
  for (let i = 0; i < ids.length; i += 50) {
    const res = await fetch(`${WIX_BASE}/site-media/v1/files/get-files`, {
      method: "POST",
      headers: headers(siteId),
      body: JSON.stringify({ fileIds: ids.slice(i, i + 50) }),
    });
    if (!res.ok) throw new Error(`get-files failed (${res.status})`);
    const data = (await res.json()) as { files?: Array<{ id?: string; state?: string }> };
    for (const f of data.files ?? []) if (f.id) ut.set(f.id, f.state ?? "OK");
  }
  return ut;
}

/**
 * Antalet produkter katalogen SÄGER att den har.
 *
 * Finns för att fälla ett tyst fel som annars vore osynligt och dyrt: om
 * sök-endpointen (eller tokenets scope) utelämnar icke-synliga produkter
 * hittar inventeringen färre produkter än katalogen har — och då ser varenda
 * utkasts bilder föräldralösa ut. Skillnaden måste synas i rapporten, inte
 * upptäckas när någon redan raderat.
 */
export async function countProducts(siteId: string): Promise<number> {
  const res = await fetch(`${WIX_BASE}/stores/v3/products/count`, {
    method: "POST",
    headers: headers(siteId),
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`Product count failed (${res.status})`);
  const data = (await res.json()) as { count?: number };
  return data.count ?? 0;
}

/** Kategoribilderna. Få till antalet, men en raderad kategoribild syns direkt i menyn. */
export async function collectCategoryMediaIds(siteId: string): Promise<Set<string>> {
  const ids = new Set<string>();
  let cursor: string | undefined;
  for (let page = 0; page < 20; page++) {
    const cursorPaging: Record<string, unknown> = { limit: 100 };
    if (cursor) cursorPaging.cursor = cursor;
    const res = await fetch(`${WIX_BASE}/categories/v1/categories/search`, {
      method: "POST",
      headers: headers(siteId),
      body: JSON.stringify({
        search: { cursorPaging },
        // Dolda kategorier räknas MED. En dold kategori kan publiceras igen,
        // och dess bild ska inte hinna raderas under tiden.
        returnNonVisibleCategories: true,
        treeReference: { appNamespace: "@wix/stores", treeKey: null },
      }),
    });
    // Kategorier är en bonus, inte kärnan: svarar API:t inte får resten av
    // inventeringen ändå bli av. Men då MÅSTE anroparen få veta det, annars
    // ser en kategoribild ut som en föräldralös fil.
    if (!res.ok) throw new Error(`Category search failed (${res.status})`);
    const data = (await res.json()) as {
      categories?: Array<{ image?: { id?: string } }>;
      pagingMetadata?: { cursors?: { next?: string }; hasNext?: boolean };
    };
    for (const c of data.categories ?? []) if (c.image?.id) ids.add(c.image.id);
    cursor = data.pagingMetadata?.cursors?.next;
    if (!data.categories?.length || !cursor || data.pagingMetadata?.hasNext === false) break;
  }
  return ids;
}

export interface MediaAuditReport {
  siteId: string;
  filerTotalt: number;
  filerLasta: number;
  produkter: number;
  produkterIKatalogen: number | null;
  katalogreferenser: number;
  utanKatalogreferens: number;
  bytesUtanReferens: number;
  bytesTotalt: number;
  kategoribilder: number | null;
  kategorifel?: string;
  fullstandig: boolean;
  /** Grupper av byte-identiska filer (samma hash) — dubbletter kostar plats även när de används. */
  dubblettgrupper: number;
  bytesIDubbletter: number;
  storsta: Array<{ id: string; displayName: string; mb: number; createdDate?: string }>;
  idUtanReferens: string[];
}

export function buildReport(
  siteId: string,
  media: { files: MediaFile[]; total: number; complete: boolean },
  katalog: { ids: Set<string>; products: number; complete: boolean },
  kategori: { ids: Set<string> | null; fel?: string },
  produkterIKatalogen: number | null = null,
): MediaAuditReport {
  const anvanda = new Set<string>(katalog.ids);
  for (const id of kategori.ids ?? []) anvanda.add(id);

  const foraldralosa = media.files.filter((f) => !anvanda.has(f.id));
  const bytesUtanReferens = foraldralosa.reduce((s, f) => s + f.sizeInBytes, 0);
  const bytesTotalt = media.files.reduce((s, f) => s + f.sizeInBytes, 0);

  const perHash = new Map<string, MediaFile[]>();
  for (const f of media.files) {
    if (!f.hash) continue;
    const arr = perHash.get(f.hash);
    if (arr) arr.push(f);
    else perHash.set(f.hash, [f]);
  }
  let dubblettgrupper = 0;
  let bytesIDubbletter = 0;
  for (const arr of perHash.values()) {
    if (arr.length < 2) continue;
    dubblettgrupper++;
    // Kostnaden är kopiorna, inte originalet.
    bytesIDubbletter += arr.slice(1).reduce((s, f) => s + f.sizeInBytes, 0);
  }

  const storsta = [...foraldralosa]
    .sort((a, b) => b.sizeInBytes - a.sizeInBytes)
    .slice(0, 200)
    .map((f) => ({
      id: f.id,
      displayName: f.displayName,
      mb: Math.round((f.sizeInBytes / 1_048_576) * 100) / 100,
      createdDate: f.createdDate,
    }));

  return {
    siteId,
    filerTotalt: media.total,
    filerLasta: media.files.length,
    produkter: katalog.products,
    produkterIKatalogen,
    katalogreferenser: anvanda.size,
    utanKatalogreferens: foraldralosa.length,
    bytesUtanReferens,
    bytesTotalt,
    kategoribilder: kategori.ids ? kategori.ids.size : null,
    kategorifel: kategori.fel,
    // Delrapporter duger till siffror men ALDRIG till radering: en produkt som
    // inte hanns läsas gör sina bilder föräldralösa på pappret. Samma sak om
    // vi såg färre produkter än katalogen säger sig ha — då saknas referenser
    // vi inte vet om.
    fullstandig:
      media.complete &&
      katalog.complete &&
      Boolean(kategori.ids) &&
      (produkterIKatalogen === null || katalog.products >= produkterIKatalogen),
    dubblettgrupper,
    bytesIDubbletter,
    storsta,
    idUtanReferens: foraldralosa.map((f) => f.id),
  };
}
