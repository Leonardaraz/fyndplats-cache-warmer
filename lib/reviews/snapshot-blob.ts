// lib/reviews/snapshot-blob.ts
//
// Recensionsbilden som en VARAKTIG fil i Vercel Blob.
//
// ☠️ VARFÖR DEN FINNS — CACHEN RÄCKER INTE NÄR DATABASEN ÄR AVSTÄNGD.
//
// Ögonblicksbilden (lib/reviews/snapshot.ts) ligger i Next Data Cache. Den
// löser kostnaden: en databasläsning i timmen i stället för ~197. Men en cache
// är per definition något man får bygga om, och byggandet kräver Postgres. Är
// Neon avstängd — vilket den kan vara i upp till två veckor när månadspotten
// tar slut — finns inget att bygga av. Stjärnorna försvinner då från hela
// katalogen så fort den sista cachade kopian gått ut.
//
// Filen här bryter den kopplingen: cronen läser databasen EN gång i timmen och
// skriver resultatet till en fil. Läsarna läser filen. Slutar databasen svara
// ligger den senast skrivna filen kvar och serveras vidare, hur länge som helst.
//
// ⚠️ HELT VALFRI. Utan `BLOB_READ_WRITE_TOKEN` i miljön gör modulen ingenting
// och allt beter sig exakt som utan den — bilden byggs ur lagret som förut.
// Ingen store, ingen kostnad, ingen skillnad. Skapas en store aktiveras
// varaktigheten av sig själv vid nästa deploy.
//
// ⚠️ GZIP, OCH DET ÄR EN KOSTNADSFRÅGA. Bilden är ~2 MB som JSON och ~400 kB
// komprimerad. Läsarna hämtar den när Data Cache:n är kall — per region, per
// timme — så skillnaden är ungefär 4 GB mot 900 MB i månaden i överföring.
// Blob debiteras på lagring OCH överföring; att skicka fem gånger mer data för
// ingenting vore att lösa en kostnad genom att skapa en annan.

import { gunzipSync, gzipSync } from "node:zlib";
import { put } from "@vercel/blob";
import type { ReviewsSnapshot } from "./snapshot";

/**
 * Fast sökväg — ingen slumpsuffix, så adressen är densamma efter varje
 * skrivning och går att räkna ut utan att fråga.
 */
export const BLOB_SOKVAG = "reviews/snapshot.json.gz";

/** Sant när en Blob-store är kopplad till projektet. */
export function blobKonfigurerad(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/**
 * Adressen filen serveras på.
 *
 * Sätts av skrivningen (`put` returnerar den) och sparas i miljön som
 * `REVIEWS_SNAPSHOT_BLOB_URL`. Saknas den slår vi upp den via SDK:n i stället —
 * ett extra anrop, men bara när Data Cache:n är kall.
 */
export function blobUrl(): string | null {
  return process.env.REVIEWS_SNAPSHOT_BLOB_URL?.trim() || null;
}

/**
 * Skriver bilden. Anropas BARA av cronen, som är den enda som läser Postgres.
 *
 * ☠️ KASTAR ALDRIG UPPÅT. Misslyckas skrivningen ligger den FÖRRA filen kvar
 * och serveras vidare — det är hela poängen med att ha en fil. Att låta ett
 * skrivfel bli ett fel för kunden vore att bygga in den bräcklighet vi tar bort.
 */
export async function skrivSnapshotTillBlob(bild: ReviewsSnapshot): Promise<string | null> {
  if (!blobKonfigurerad()) return null;
  try {
    const komprimerad = gzipSync(Buffer.from(JSON.stringify(bild), "utf8"));
    const res = await put(BLOB_SOKVAG, komprimerad, {
      access: "public",
      contentType: "application/gzip",
      addRandomSuffix: false,
      allowOverwrite: true,
      // Filen byts varje timme. En lång webbläsarcache skulle bara göra att
      // läsarna får en gammal bild efter att vi skrivit en ny.
      cacheControlMaxAge: 60,
    });
    console.log(`[reviews/blob] skrev ${komprimerad.length} byte (${bild.antal} recensioner) → ${res.url}`);
    return res.url;
  } catch (err) {
    console.error("[reviews/blob] skrivningen föll:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Läser bilden ur filen. `null` = den fanns inte att få, och anroparen ska då
 * bygga ur lagret som vanligt.
 *
 * ☠️ KASTAR ALDRIG. Samma regel som resten av kedjan: varje väg som inte ger
 * en användbar bild måste sluta i att anroparen faller tillbaka.
 */
export async function lasSnapshotFranBlob(): Promise<ReviewsSnapshot | null> {
  const url = blobUrl();
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.warn(`[reviews/blob] ${res.status} från filen`);
      return null;
    }
    const rå = Buffer.from(await res.arrayBuffer());
    const json = gunzipSync(rå).toString("utf8");
    const bild = JSON.parse(json) as Partial<ReviewsSnapshot>;
    // Formkontroll, inte typtro — samma skäl som i snapshot.ts.
    if (!bild || typeof bild !== "object" || !bild.perProdukt || typeof bild.perProdukt !== "object") {
      console.warn("[reviews/blob] filen saknade perProdukt");
      return null;
    }
    return bild as ReviewsSnapshot;
  } catch (err) {
    console.warn("[reviews/blob] kunde inte läsas:", err instanceof Error ? err.message : err);
    return null;
  }
}
