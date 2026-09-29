// Återställning av Aosom-recensioners foton vars filer raderats ur Wix Media.
//
// BAKGRUND (mätt 2026-09-28): 1 942 synliga recensioner bar foto-flagga, och
// på 1 358 av dem svarade VARENDA bildadress 403 — filerna finns inte längre i
// Media Manager, inte ens i papperskorgen. Butikssidan döljer trasiga bilder
// (onError), så kunden ser "Se bilden" utan bild. Hur filerna försvann är en
// annan fråga och ett annat arbete; det här handlar bara om att få tillbaka dem.
//
// OMFATTNING: bara Aosom-rader (601 st). AliExpress-raderna återställs av
// lib/reviews/image-restore.ts (#686) och rörs inte här — rutten tar därför
// bara emot källfoton på Aosoms bild-CDN. Att Aosoms CDN går att nå från
// servern är mätt: 897 av 912 källfoton svarade 2026-09-28, och det är samma
// väg som hemflytten 2026-09-16 tog.
//
// Raderna pekar fortfarande på de döda adresserna, men källadressen är borta:
// hemflytten ersatte leverantörens adress med vår. Källfotona finns däremot i
// rådatan från inläsningarna och skickas med i nyttolasten
// (`sourceImageUrls`). Aosoms sajt släpper inte igenom serveranrop, men deras
// bild-CDN gör det.
//
// Tre egenskaper som inte ska tas bort:
//
// 1. ☠️ EN RAD SKRIVS BARA NÄR MINST ETT FOTO ÄR BEKRÄFTAT KLART hos Wix
//    (`importeraOchBekrafta` väntar på operationStatus READY). En import som
//    Wix accepterar men aldrig slutför ger annars samma döda adress igen — och
//    då har vi skrivit över en död länk med en annan död länk.
// 2. RADER MED NÅGOT FUNGERANDE FOTO RÖRS INTE. Körningen är därför säker att
//    göra om: en återställd rad ser frisk ut nästa varv och hoppas över.
// 3. OSÄKERT ÄR INTE DÖTT. Går det inte att avgöra om en adress lever (nätfel)
//    räknas raden som okänd och lämnas orörd.

import { isVisibleStatus, type StoredReview } from "../store/reviews";
import { MAX_REVIEW_IMAGES, reviewImageFields, reviewImages } from "./images";

/** Den enda värd källfoton får komma ifrån. */
const AOSOM_CDN = "https://img.aosomcdn.com/";

/** En rad att återställa, som den står i nyttolasten. */
export interface RestoreTarget {
  productId: string;
  reviewIdAE: string;
  /** Källfotona på Aosoms CDN, i visningsordning (högst tre). */
  sourceImageUrls: string[];
}

export interface RestoreDeps {
  listByProduct(productId: string): Promise<StoredReview[]>;
  upsert(review: StoredReview): Promise<void>;
  /** true = svarar, false = borta (403/404/410), null = gick inte att avgöra. */
  lever(url: string): Promise<boolean | null>;
  /**
   * Lägger källfotot i Wix Media och ger Wix-adressen när filen är KLAR
   * (READY), annars null. Rutten hämtar bytena själv och laddar upp dem — se
   * `bildtypUrSignatur` för varför Wix import inte räcker.
   */
  importeraOchBekrafta(källa: string, namn: string): Promise<string | null>;
  now(): number;
}

export interface RestoreOptions {
  dryRun: boolean;
  fromIndex: number;
  /** Högst så här många rader per anrop. */
  limit: number;
  /** Sluta ta nya rader efter så här många ms. */
  budgetMs: number;
}

export interface RestoreStats {
  mal: number;
  behandlade: number;
  saknarRad: number;
  inteSynlig: number;
  redanOk: number;
  okandStatus: number;
  kanAterstallas: number;
  fotonAttHamta: number;
  aterstallda: number;
  fotonAterstallda: number;
  fotoMissar: number;
  misslyckade: number;
  fel: number;
  /** Index att fortsätta från, eller null när nyttolasten är slut. */
  kvarFran: number | null;
}

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Tvättar nyttolasten. En rad utan giltigt produkt-id, recensions-id eller
 * minst ett källfoto på Aosoms CDN kastas — rutten ska inte gå att använda för
 * att peka en recension mot en godtycklig bild.
 */
export function tolkaMål(rå: unknown): RestoreTarget[] {
  const lista = Array.isArray(rå) ? rå : [];
  const ut: RestoreTarget[] = [];
  const sedda = new Set<string>();
  for (const x of lista) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const productId = typeof o.productId === "string" ? o.productId.trim() : "";
    const reviewIdAE = typeof o.reviewIdAE === "string" ? o.reviewIdAE.trim() : "";
    if (!GUID.test(productId) || !reviewIdAE || reviewIdAE.length > 64) continue;
    const källor = Array.isArray(o.sourceImageUrls)
      ? (o.sourceImageUrls as unknown[])
          .filter((u): u is string => typeof u === "string")
          .map((u) => u.trim())
          .filter((u) => u.startsWith(AOSOM_CDN) && !/[\s"'<>]/.test(u))
      : [];
    const unika = [...new Set(källor)].slice(0, MAX_REVIEW_IMAGES);
    if (unika.length === 0) continue;
    const nyckel = `${productId}__${reviewIdAE}`;
    if (sedda.has(nyckel)) continue;
    sedda.add(nyckel);
    ut.push({ productId, reviewIdAE, sourceImageUrls: unika });
  }
  return ut;
}

/** En bildtyp Wix Media tar emot, bestämd av filens innehåll. */
export interface Bildtyp {
  mime: "image/jpeg" | "image/png" | "image/webp";
  andelse: "jpg" | "png" | "webp";
}

/**
 * Vad är filen, enligt dess egna första byte?
 *
 * ☠️ LITA INTE PÅ VÄRDEN. Aosoms bild-CDN skickar en del kundfoton med
 * Content-Type `application/x-www-form-urlencoded`, och några heter .heif fast
 * innehållet är en vanlig JPEG. Mätt 2026-09-29 på de 95 rader som inte gick
 * att återställa: 139 källfoton med fel typ, 13 med fel ändelse — och alla 152
 * var i själva verket JPEG eller PNG. Wix import tror på värdens uppgifter och
 * ger upp; signaturen i filen ljuger inte.
 *
 * Allt annat än JPEG, PNG och WebP → null. En äkta HEIC, en HTML-felsida eller
 * en tom fil ska inte bli en "kundbild".
 */
export function bildtypUrSignatur(b: Uint8Array): Bildtyp | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { mime: "image/jpeg", andelse: "jpg" };
  }
  const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (b.length >= 8 && PNG.every((v, i) => b[i] === v)) {
    return { mime: "image/png", andelse: "png" };
  }
  const ascii = (från: number, till: number) => String.fromCharCode(...b.subarray(från, till));
  if (b.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    return { mime: "image/webp", andelse: "webp" };
  }
  return null;
}

/** Filnamnet med bildens riktiga ändelse: `kundbild-x.jpg` → `kundbild-x.png`. */
export function medAndelse(namn: string, andelse: Bildtyp["andelse"]): string {
  return `${namn.replace(/\.[a-z0-9]{2,5}$/i, "")}.${andelse}`;
}

function tomStats(antal: number): RestoreStats {
  return {
    mal: antal, behandlade: 0, saknarRad: 0, inteSynlig: 0, redanOk: 0, okandStatus: 0,
    kanAterstallas: 0, fotonAttHamta: 0, aterstallda: 0, fotonAterstallda: 0,
    fotoMissar: 0, misslyckade: 0, fel: 0, kvarFran: null,
  };
}

export async function restoreReviewImages(
  mål: RestoreTarget[],
  deps: RestoreDeps,
  opts: RestoreOptions,
): Promise<RestoreStats> {
  const s = tomStats(mål.length);
  const start = deps.now();
  const raderPerProdukt = new Map<string, StoredReview[]>();

  const slut = Math.min(mål.length, Math.max(0, opts.fromIndex) + Math.max(1, opts.limit));
  let i = Math.max(0, opts.fromIndex);
  for (; i < slut; i++) {
    if (deps.now() - start > opts.budgetMs) break;
    const m = mål[i];
    s.behandlade++;
    try {
      let rader = raderPerProdukt.get(m.productId);
      if (!rader) {
        rader = await deps.listByProduct(m.productId);
        raderPerProdukt.set(m.productId, rader);
      }
      const rad = rader.find((r) => r.reviewIdAE === m.reviewIdAE);
      if (!rad) { s.saknarRad++; continue; }
      if (!isVisibleStatus(rad.status)) { s.inteSynlig++; continue; }

      // Bara rader där VARJE foto är bevisat borta. Något levande eller osäkert
      // → rör inte raden.
      let levande = false;
      let osäker = false;
      for (const u of reviewImages(rad)) {
        const svar = await deps.lever(u);
        if (svar === true) { levande = true; break; }
        if (svar === null) osäker = true;
      }
      if (levande) { s.redanOk++; continue; }
      if (osäker) { s.okandStatus++; continue; }

      const källor = m.sourceImageUrls.slice(0, MAX_REVIEW_IMAGES);
      s.kanAterstallas++;
      s.fotonAttHamta += källor.length;
      if (opts.dryRun) continue;

      const nya: string[] = [];
      for (const [n, källa] of källor.entries()) {
        const namn = n === 0 ? `kundbild-${m.reviewIdAE}.jpg` : `kundbild-${m.reviewIdAE}-${n + 1}.jpg`;
        const url = await deps.importeraOchBekrafta(källa, namn);
        if (url) nya.push(url);
        else s.fotoMissar++;
      }
      if (nya.length === 0) { s.misslyckade++; continue; }

      await deps.upsert({ ...rad, ...reviewImageFields(nya) });
      s.aterstallda++;
      s.fotonAterstallda += nya.length;
    } catch (err) {
      s.fel++;
      // Bara en markering — felmeddelanden kan bära källadresser.
      console.warn("[image-restore] en rad föll", err instanceof Error ? err.name : "");
    }
  }
  s.kvarFran = i < mål.length ? i : null;
  return s;
}
