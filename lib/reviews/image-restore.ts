// lib/reviews/image-restore.ts
//
// Återställer AliExpress-recensioners kundfoton som mediastädningen raderat.
//
// VARFÖR DEN FINNS (2026-09-28). Städningen (lib/aosom/media-cleanup.ts)
// raderade importerade recensionsbilder permanent: före 2026-09-04 för att
// recensionerna inte fanns i skyddslistan alls, och därefter för att listan
// bara läste de 5 000 nyaste raderna. Uppmätt på de publicerade raderna:
// 917 av 936 AE-bilder svarade 403 hos static.wixstatic.com. Filerna är borta
// ur Wix, men källbilderna ligger kvar hos AliExpress, och varje rad bär AE:s
// eget recensions-id. Alltså: hämta produktens recensioner igen, para ihop på
// id och flytta hem bilderna en gång till.
//
// ☠️ BARA DÖDA BILDER. En rad skrivs bara om minst en av dess bilder svarar
// 403/404. Ett nätfel eller 5xx räknas som levande — att skriva om en frisk
// rad på ett tillfälligt fel kostar en ny kopia i Media Manager och ger inget.
//
// ☠️ SKRIV BARA HEMFLYTTADE ADRESSER. Bilderna importeras här, innan raden
// skrivs, och bara de som fick en egen wixstatic-adress följer med. Upsert
// hade annars behållit leverantörens adress vid ett importfel (med flit, se
// withOwnImage), och den står då i klartext i produktsidans HTML.
//
// ☠️ BARA PUBLICERADE RADER. En `pending`-rad pekar med flit på leverantörens
// CDN tills den godkänns (lib/store/reviews.ts, regel 2), så den har inget i
// Wix att förlora.
//
// ☠️ AOSOM OCH KUNDERNAS EGNA RADER RÖRS INTE. Aosom-bilderna går bara att
// hämta i en riktig webbläsare, och kundernas uppladdningar raderas aldrig.

import { isVisibleStatus, type StoredReview } from "../store/reviews";
import type { AERReview } from "../import/review-import";
import { reviewImages, reviewImageFields, MAX_REVIEW_IMAGES } from "./images";

export interface ImageRestoreDeps {
  /** Hela recensionslagret. */
  listAll: () => Promise<StoredReview[]>;
  /** AE:s produkt-id för en Wix-produkt, eller null om den inte är en AE-mappning. */
  aeProductId: (wixProductId: string) => Promise<string | null>;
  /**
   * AE-id:t ur AE-synkens minne, för en produkt som inte längre är en
   * AE-mappning. Se `aeIdUrSynken`.
   */
  aeProductIdFranSynken?: (wixProductId: string) => Promise<string | null>;
  fetchReviews: (aeProductId: string) => Promise<{ reviews: AERReview[]; throttled: boolean }>;
  /** true = filen finns inte längre (403/404). Kastar aldrig; osäkert → false. */
  isDead: (url: string) => Promise<boolean>;
  /** Egen wixstatic-adress, eller null om importen misslyckades. */
  importImage: (url: string, displayName: string) => Promise<string | null>;
  upsert: (review: StoredReview) => Promise<void>;
  now?: () => number;
}

export interface ImageRestoreOptions {
  dryRun: boolean;
  /** Max antal produkter att hämta från AE i denna körning. */
  limit: number;
  /** Fortsätt efter denna productId (sorterad ordning). */
  after?: string;
  /** Väggklocka; loopen stannar före Vercels maxDuration. */
  timeBudgetMs: number;
}

export interface ImageRestoreSummary {
  dryRun: boolean;
  /** Produkter med AE-rader som bär bilder, i hela lagret. */
  produkterTotalt: number;
  produkterGenomgangna: number;
  /** Produkter där minst en rad hade döda bilder. */
  produkterMedDoda: number;
  raderMedDoda: number;
  /** Rader vars recension hittades hos AE med minst en bild. */
  hittadeHosAE: number;
  /** Rader som skrevs om med hemflyttade bilder (0 i torrkörning). */
  aterstallda: number;
  bilderAterstallda: number;
  /** Recensionen fanns inte längre hos AE, eller saknade bilder där. */
  saknasHosAE: number;
  /** Produkten har ingen AE-mappning (borttagen eller annan leverantör). */
  utanAEMappning: number;
  /**
   * Rader på produkter som bytt till Aosom, där AE-id:t hittades i
   * AE-synkens minne i stället för på mappningen.
   */
  viaSynkensMinne: number;
  /** AE strypte hämtningen; produkten får tas om. */
  strypta: number;
  importfel: number;
  skrivfel: number;
  /** Nästa `after`, eller null när hela listan är genomgången. */
  nasta: string | null;
  stoppadAv: "klar" | "limit" | "tid";
}

/**
 * AE-id:t ur AE-synkens minne (`SyncStateEntry.aliexpressId`), eller null.
 *
 * VARFÖR (2026-10-06). Ommappningen till Aosom (lib/aosom/remap.ts) byter
 * `supplierProductId` och tar bort allt som beskriver den gamla AE-listningen.
 * Recensionerna från AliExpress ligger kvar på sidan — men återställningen
 * hittade inte längre någon AE-produkt att hämta dem från, och deras döda
 * foton räknades som `utanAEMappning`. Hörnskrivbordet c342826f var ett av dem.
 * AE-synkens tillstånd sparas per Wix-produkt och överlever bytet, så id:t
 * finns kvar där.
 *
 * Bara ett rent AE-id (siffror) släpps igenom; allt annat är okänt.
 */
export function aeIdUrSynken(state: { aliexpressId?: string | null } | null | undefined): string | null {
  const id = (state?.aliexpressId ?? "").trim();
  return /^\d{6,}$/.test(id) ? id : null;
}

/** Importerad AE-rad: ingen källa satt (äldre) eller uttryckligen AliExpress. */
export function arAERad(r: StoredReview): boolean {
  return !r.source || r.source === "aliexpress";
}

export async function runImageRestore(
  deps: ImageRestoreDeps,
  opts: ImageRestoreOptions,
): Promise<ImageRestoreSummary> {
  const now = deps.now ?? Date.now;
  const start = now();

  const perProdukt = new Map<string, StoredReview[]>();
  for (const r of await deps.listAll()) {
    if (!arAERad(r) || !isVisibleStatus(r.status) || reviewImages(r).length === 0) continue;
    const lista = perProdukt.get(r.productId) ?? [];
    lista.push(r);
    perProdukt.set(r.productId, lista);
  }
  const produkter = [...perProdukt.keys()].sort();
  const kvar = opts.after ? produkter.filter((p) => p > opts.after!) : produkter;

  const s: ImageRestoreSummary = {
    dryRun: opts.dryRun,
    produkterTotalt: produkter.length,
    produkterGenomgangna: 0,
    produkterMedDoda: 0,
    raderMedDoda: 0,
    hittadeHosAE: 0,
    aterstallda: 0,
    bilderAterstallda: 0,
    saknasHosAE: 0,
    utanAEMappning: 0,
    viaSynkensMinne: 0,
    strypta: 0,
    importfel: 0,
    skrivfel: 0,
    nasta: null,
    stoppadAv: "klar",
  };

  let hamtade = 0;
  for (const pid of kvar) {
    if (now() - start > opts.timeBudgetMs) {
      s.stoppadAv = "tid";
      return s;
    }
    if (hamtade >= opts.limit) {
      s.stoppadAv = "limit";
      return s;
    }

    const doda: StoredReview[] = [];
    for (const r of perProdukt.get(pid)!) {
      for (const u of reviewImages(r)) {
        if (await deps.isDead(u)) {
          doda.push(r);
          break;
        }
      }
    }
    s.produkterGenomgangna++;
    s.nasta = pid;
    if (doda.length === 0) continue;
    s.produkterMedDoda++;
    s.raderMedDoda += doda.length;

    let aeId = await deps.aeProductId(pid);
    if (!aeId && deps.aeProductIdFranSynken) {
      aeId = await deps.aeProductIdFranSynken(pid);
      if (aeId) s.viaSynkensMinne += doda.length;
    }
    if (!aeId) {
      s.utanAEMappning += doda.length;
      continue;
    }
    hamtade++;
    const { reviews, throttled } = await deps.fetchReviews(aeId);
    if (throttled && reviews.length === 0) {
      s.strypta += doda.length;
      continue;
    }
    const perId = new Map<string, AERReview>();
    for (const a of reviews) if (a.reviewIdAE) perId.set(a.reviewIdAE, a);

    for (const r of doda) {
      const ae = perId.get(r.reviewIdAE);
      const kallor = ae ? reviewImages(ae).slice(0, MAX_REVIEW_IMAGES) : [];
      if (kallor.length === 0) {
        s.saknasHosAE++;
        continue;
      }
      s.hittadeHosAE++;
      if (opts.dryRun) continue;

      // Samma filnamn som importen och withOwnImage: bild 2 och 3 får suffix.
      const egna: string[] = [];
      for (const [n, u] of kallor.entries()) {
        const namn = `kundbild-${n === 0 ? r.reviewIdAE : `${r.reviewIdAE}-${n + 1}`}.jpg`;
        const egen = await deps.importImage(u, namn);
        if (egen) egna.push(egen);
        else s.importfel++;
      }
      if (egna.length === 0) continue;
      try {
        await deps.upsert({ ...r, ...reviewImageFields(egna) });
        s.aterstallda++;
        s.bilderAterstallda += egna.length;
      } catch (err) {
        s.skrivfel++;
        console.warn("[review-image-restore]", r.reviewIdAE, err instanceof Error ? err.message : err);
      }
    }
  }

  s.nasta = null;
  return s;
}
