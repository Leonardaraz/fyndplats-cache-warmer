// Recensions-import: filtrerar/rankar råa AliExpress-recensioner och sparar de
// bästa i Wix Data-kollektionen FyndplatsImportedReviews.
//
// INGEN ÖVERSÄTTNINGSTJÄNST. DeepL togs bort 2026-08-19 (Leonards beslut: "vi
// polerar alla via chatten"). Det var redan så det fungerade i praktiken —
// DeepL-cronen stängdes av långt tidigare — men koden bar kvar hela
// maskineriet: API-nyckel, månadsbudget, användningslager och en tyst fallback
// som sparade ORIGINALTEXTEN när budgeten tog slut.
//
// Följden är avsiktlig: importerade recensioner sparas som `pending` med
// källtexten, och blir svenska när någon skriver om dem i /admin/reviews. De
// når alltså aldrig en produktsida oöversatta — vilket är precis vad den gamla
// fallbacken riskerade.
//
// Vi tar fortfarande bara topp 10–15 per produkt: fler ger inget för kunden och
// mer att skriva om.
//
// All filtrering/rankning är rena, testbara funktioner. I/O:t (Wix) injiceras
// som beroende så orchestreringen kan enhetstestas utan nätverk.

import { getReviewStore, type ReviewStore, type StoredReview } from "../store/reviews";
import { isEuCountry as isEuWarehouseCode } from "../aliexpress/eu-countries";
import { mentionsForeignDelivery } from "./review-locale-filter";
import { ownImageUrlForReview } from "../wix/media-import";
import { MAX_REVIEW_IMAGES, reviewImageFields, reviewImages } from "../reviews/images";

/** Rå recension som skrapan (extension/content.js) eller AE-API:t levererar. */
export interface AERReview {
  /** Unik AliExpress-review-id för dedup. Saknas → härleds ur text-hash. */
  reviewIdAE?: string;
  rating: number;
  text: string;
  /** Detekterat källspråk om känt (t.ex. "en", "zh") — påverkar inte flödet. */
  language?: string;
  hasImage?: boolean;
  /** Första bilden. Kvar som eget fält för bakåtkompatibilitet. */
  imageUrl?: string;
  /**
   * ALLA bilder recensenten postade.
   *
   * Importen behöll länge bara `images[0]` och slängde resten — foton vi redan
   * hämtat och som gör recensionen mer trovärdig. Sedan 2026-08-19 bevaras hela
   * listan; taket sätts när raden skrivs, inte här.
   */
  imageUrls?: string[];
  /** Rått AE-användarnamn (t.ex. "M***a", "u****6543"). LAGRAS för bevis, visas
   * ALDRIG — vi härleder bara initialer för visning. */
  customerName?: string;
  /** ISO-2-kod eller landnamn. LAGRAS för bevis, visas ALDRIG. */
  customerCountry?: string;
  /** ISO-datum om känt. */
  date?: string;
}

export const REVIEW_FILTER = {
  minRating: 3,
  minLength: 50,
  /**
   * Övre längdgräns.
   *
   * HÖJD 300 → 1200 (2026-08-19). Taket sorterade bort precis de recensioner
   * som är mest värda att visa. Leonard hittade fallet: en femstjärnig
   * recension med TVÅ foton, utförlig text om att man kan montera möbeln själv
   * — 331 tecken, alltså 31 över gränsen. Den hade fått 6,0 i rankningspoäng,
   * nära max (+3 foto, +1 Europa, +2 maxad textlängd), men kastades innan
   * rankningen ens körde.
   *
   * Längdfiltret är blint för allt annat: det ser varken bilderna, betyget
   * eller att texten är välskriven. 300 tecken är ungefär tre meningar, och
   * den som skriver "du behöver inte vara två för att montera den" passerar
   * det utan att försöka.
   *
   * Att gränsen var inkonsekvent syns tydligast internt: butikens EGNA kunder
   * får skriva 2000 tecken (TEXT_MAX i lib/customer-review.ts), medan
   * importerade omdömen kapades vid 300 — samma produktsida, samma läsare.
   *
   * Ett tak behövs fortfarande mot väggar av AI-text och klistrade
   * säljarrepliker, men 1200 räcker för varje äkta recension i katalogen.
   * Skräpet fångas ändå av filter som faktiskt tittar på innehållet: isSpam,
   * dubblettnyckeln och mentionsForeignDelivery.
   *
   * Produktkortet klampar långa texter till fem rader med "Visa mer"
   * (ProductReviews i butiksrepot), så listan går att skumma.
   */
  maxLength: 1200,
  /** Topp-N efter rankning (spec: 10–15). */
  maxReviews: 15,
};

// --- Pure filtering & ranking ---------------------------------------------

/** Normaliserad nyckel för dedup: gemener, kollapsad whitespace, ingen punkt. */
export function dedupKey(text: string): string {
  return (text || "")
    .toLowerCase()
    // Skiljetecken blir MELLANSLAG, inte tomt. Torktumlaren 2026-08-18: en rysk
    // recension skriven utan blanksteg efter punkt — "отлично.быстрая
    // доставка.работает..." — klistrades ihop till tre ord i stället för sju,
    // och isSpam (som kräver minst fyra ord) kastade en fullt vettig recension.
    // Att skriva utan mellanslag efter punkt är vanligt, inte ett spam-tecken.
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Spam-/lågkvalitetsmönster: text som domineras av upprepade ord ("good good
 * very nice nice") eller består av ett enda upprepat ord. Korta generiska fraser
 * fångas redan av längdfiltret (>=50 tecken).
 */
export function isSpam(text: string): boolean {
  const words = dedupKey(text).split(" ").filter(Boolean);
  if (words.length < 4) return true;
  const unique = new Set(words);
  // Färre än hälften unika ord = upprepningsspam.
  if (unique.size / words.length < 0.5) return true;
  return false;
}

function isEuCountry(country?: string): boolean {
  if (!country) return false;
  return isEuWarehouseCode(country.trim());
}

function withinDays(dateIso: string | undefined, now: Date, days: number): boolean {
  if (!dateIso) return false;
  const t = Date.parse(dateIso);
  if (Number.isNaN(t)) return false;
  const diffDays = (now.getTime() - t) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

/**
 * Rankningspoäng (högre = bättre). Vikter enligt spec:
 *   1. senaste 30 dagar (relevans)  +2
 *   2. med foto (trovärdigare)      +3
 *   3. från Europa (närmare mål)    +1
 *   4. längre text (mer substans)   +0..2 (längd/150, capad)
 */
export function scoreReview(r: AERReview, now: Date): number {
  let score = 0;
  if (r.hasImage) score += 3;
  if (withinDays(r.date, now, 30)) score += 2;
  if (isEuCountry(r.customerCountry)) score += 1;
  score += Math.min((r.text?.length ?? 0) / 150, 2);
  return score;
}

/**
 * Filtrerar bort recensioner under 3 stjärnor, för korta/långa, spam och
 * dubbletter; rankar resten och returnerar topp-N. Deterministisk (tiebreak på
 * datum desc, sedan reviewIdAE) så samma input alltid ger samma urval.
 */
export function filterAndRankReviews(
  reviews: AERReview[],
  now: Date,
  opts: { max?: number; minLength?: number } = {},
): AERReview[] {
  const max = opts.max ?? REVIEW_FILTER.maxReviews;
  // Per körning, ALDRIG globalt: golvet på 50 tecken finns kvar för alla
  // vanliga importer. Överdraget används för att svepa upp det ett gammalt,
  // för snävt filter slängde — se REVIEW_FILTER.maxLength om 300 → 1200.
  const minLength = Math.min(
    Math.max(opts.minLength ?? REVIEW_FILTER.minLength, REVIEW_FILTER.minLength),
    REVIEW_FILTER.maxLength,
  );
  const seen = new Set<string>();
  const kept: AERReview[] = [];
  for (const r of reviews) {
    if (!r || typeof r.text !== "string") continue;
    const text = r.text.trim();
    if (r.rating < REVIEW_FILTER.minRating) continue;
    if (text.length < minLength || text.length > REVIEW_FILTER.maxLength) continue;
    if (isSpam(text)) continue;
    // "Kom snabbt till Tjeckien" hör inte hemma på en svensk produktsida
    // (Leonards rapport 2026-08-16). Vi tar bort dem i stället för att skriva
    // om dem — att byta land vore att förfalska ett kundomdöme.
    if (mentionsForeignDelivery(text)) continue;
    const key = dedupKey(text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    kept.push({ ...r, text });
  }
  kept.sort((a, b) => {
    const sb = scoreReview(b, now);
    const sa = scoreReview(a, now);
    if (sb !== sa) return sb - sa;
    const db = Date.parse(b.date ?? "") || 0;
    const da = Date.parse(a.date ?? "") || 0;
    if (db !== da) return db - da;
    return (a.reviewIdAE ?? "").localeCompare(b.reviewIdAE ?? "");
  });
  return kept.slice(0, max);
}

// --- Initialer (visningsnamn) ---------------------------------------------
//
// Vi visar BARA initialer ("M.K."), aldrig hela namnet eller landet. Initialerna
// härleds från AE-användarnamnet om det innehåller bokstäver (AE maskerar ofta
// mitten men visar första+sista tecken, t.ex. "M***a" → "M.A."), annars
// deterministiskt ur reviewIdAE så samma recension ALLTID får samma initialer.

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

/** Deterministisk versal A–Z ur en seed + salt. */
function hashLetter(seed: string, salt: number): string {
  const h = hashString(`${seed}#${salt}`);
  return String.fromCharCode(65 + (h % 26));
}

const LETTER_RE = /[a-zA-ZÀ-ÿЀ-ӿ]/g;

/**
 * Härleder visningsinitialer "X.Y." för en recension.
 *   - Flera namn-tokens ("Maria K") → första bokstaven i första + sista token.
 *   - Ett token, maskerat ("M***a") → första + sista bokstaven i token.
 *   - En enda bokstav ("u****6543") → den + en deterministisk andra ur reviewIdAE.
 *   - Inga bokstäver → två deterministiska bokstäver ur reviewIdAE.
 */
export function deriveInitials(rawName: string | undefined, reviewIdAE: string): string {
  const name = (rawName ?? "").trim();
  if (name) {
    const tokens = name.split(/\s+/).filter((t) => LETTER_RE.test(t) || /\d/.test(t));
    LETTER_RE.lastIndex = 0;
    if (tokens.length >= 2) {
      const first = (tokens[0].match(LETTER_RE) ?? [])[0];
      const lastTok = tokens[tokens.length - 1].match(LETTER_RE) ?? [];
      const last = lastTok[0];
      if (first && last) return `${first.toUpperCase()}.${last.toUpperCase()}.`;
    }
    // Ett token — använd första + sista bokstaven (maskerade namn "M***a").
    const alphas = name.match(LETTER_RE) ?? [];
    const firstA = alphas[0];
    const lastA = alphas[alphas.length - 1];
    if (firstA && lastA && alphas.length >= 2) {
      return `${firstA.toUpperCase()}.${lastA.toUpperCase()}.`;
    }
    if (firstA && alphas.length === 1) {
      return `${firstA.toUpperCase()}.${hashLetter(reviewIdAE, 1)}.`;
    }
  }
  return `${hashLetter(reviewIdAE, 0)}.${hashLetter(reviewIdAE, 1)}.`;
}

/** Stabil reviewIdAE när skrapan inte gav någon (hash av normaliserad text). */
export function ensureReviewId(r: AERReview): string {
  if (r.reviewIdAE && r.reviewIdAE.trim()) return r.reviewIdAE.trim();
  return `gen-${hashString(dedupKey(r.text)).toString(36)}`;
}

// --- Orchestrering (persist) -----------------------------------------------

export interface ReviewImportDeps {
  reviewStore?: ReviewStore;
  now?: Date;
  /**
   * Hemflytt av en kundbild till vår mediahantering. Injicerbar av samma skäl
   * som `reviewStore`: uppladdningsslingan var helt otestad fram till
   * 2026-08-22, och det är just DEN som tappade bilder tyst. Utan en väg att
   * simulera ett Wix-fel går felgrenen inte att låsa.
   */
  importImage?: typeof ownImageUrlForReview;
  /**
   * Radens ursprung, skrivs rakt till `StoredReview.source`.
   *
   * ☠️ HÄRKOMSTEN ÄR ETT LAGKRAV, INTE METADATA. Artikel 7.6 UCPD (Omnibus)
   * kräver att den som visar konsumentrecensioner upplyser om huruvida och hur
   * de kommer från konsumenter som faktiskt använt produkten — och bilaga I
   * punkt 23b förbjuder att PÅSTÅ att de är egna kunders utan täckning.
   * Syndikerade produktrecensioner (Bazaarvoice, Reevoo, och vår Aosom-väg) är
   * lagliga just för att källan anges.
   *
   * Därför sätts fältet av den som HÄMTAR, inte av den som visar: en rad som
   * saknar sitt ursprung går inte att märka i efterhand, och en omärkt rad
   * renderas under rubriken "Kundrecensioner" som om den vore vår egen kunds.
   *
   * Utelämnat = AliExpress-import, precis som före 2026-08-29. `"customer"`
   * sätts av headless-site:lib/customer-review.ts och betyder verifierat köp
   * hos oss; `"aosom"` av lib/aosom/reviews.ts.
   */
  source?: string;
}

export interface ReviewImportResult {
  /** Antal recensioner som faktiskt sparades (efter dedup mot befintliga). */
  imported: number;
  /** Antal som hoppades över för att de redan fanns. */
  skippedExisting: number;
  reviews: StoredReview[];
  /**
   * Kundbilder som inte gick att flytta hem till vår mediahantering. Raderna
   * sparas då med LEVERANTÖRENS adress kvar (aldrig utan bild) och lagas av
   * nästa repairImages-körning. Siffran bärs i API-svaret så att en strypt
   * eller trasig Wix-media-väg syns i loggen i stället för att bli tyst.
   */
  bildmissar: number;
}

/**
 * Hela recensions-importen för EN produkt:
 *   filtrera/ranka → anonymisera → spara som `pending` (dedup).
 *
 * INGEN ÖVERSÄTTNING. Den görs i chatten och skrivs in via /admin/reviews —
 * se noten längre ner om varför DeepL togs bort.
 *
 * Best-effort: alla fel (Wix) ska fångas av callern; importen av själva
 * produkten får aldrig falla på recensioner.
 */
export async function importReviewsForProduct(
  productId: string,
  rawReviews: AERReview[],
  deps: ReviewImportDeps = {},
): Promise<ReviewImportResult> {
  const now = deps.now ?? new Date();
  const reviewStore = deps.reviewStore ?? getReviewStore();
  const importImage = deps.importImage ?? ownImageUrlForReview;

  const ranked = filterAndRankReviews(rawReviews ?? [], now);
  if (ranked.length === 0) {
    return { imported: 0, skippedExisting: 0, reviews: [], bildmissar: 0 };
  }

  // ÖVERSÄTTNINGEN GÖRS I CHATTEN, INTE AV EN TJÄNST.
  //
  // DeepL togs bort 2026-08-19 (Leonards beslut: "vi polerar alla via
  // chatten"). Det var redan så det fungerade i praktiken — DeepL-cronen
  // stängdes av långt tidigare — men koden bar kvar hela maskineriet: en
  // API-nyckel, en månadsbudget, ett användningslager och en tyst
  // fallback som lade ut ORIGINALTEXTEN när budgeten tog slut.
  //
  // Följden av borttagningen är avsiktlig och viktig: importerade recensioner
  // auto-godkänns inte längre. De landar som `pending` med källtexten i både
  // textOriginal och textSwedish, och blir svenska när någon skriver om dem i
  // /admin/reviews (editReviewText). Alternativet — att publicera direkt —
  // hade betytt engelska omdömen på en svensk produktsida, vilket är precis
  // det den gamla fallbacken gjorde.

  const importedAt = now.toISOString();
  let imported = 0;
  let skippedExisting = 0;
  // Bilder som inte gick att flytta hem. Bärs i svaret så en strypt eller
  // trasig Wix-media-väg syns i workflow-loggen i stället för att bli tyst.
  let bildmissar = 0;
  const reviews: StoredReview[] = [];
  for (let i = 0; i < ranked.length; i++) {
    const r = ranked[i];
    const reviewIdAE = ensureReviewId(r);
    try {
      if (await reviewStore.exists(productId, reviewIdAE)) {
        skippedExisting++;
        continue;
      }
    } catch (err) {
      console.warn("[review-import] exists-koll misslyckades, fortsätter:", err instanceof Error ? err.message : err);
    }
    // Kundbilderna hämtas hem till vår egen mediahantering. Se
    // lib/wix/media-import.ts.
    //
    // ALLA bilder, inte bara den första: AE-recensenter postar ofta flera, och
    // importen slängde resten fram till 2026-08-19. Hämtas i tur och ordning —
    // parallellt hade gett fler samtidiga anrop mot Wix media per recension,
    // och backfillen kör redan många recensioner efter varandra.
    //
    // MISSLYCKAS UPPLADDNINGEN BEHÅLLS KÄLLADRESSEN (2026-08-22).
    //
    // Raden slängde tidigare bilden tyst: ingen logg, ingen räknare, och
    // källadressen sparades ingenstans. Resultatet blev `hasImage:false` på en
    // recension som HADE ett foto — ett fel som varken gick att upptäcka eller
    // reparera i efterhand, eftersom `repairImages` bara letar efter rader som
    // FORTFARANDE bär en leverantörs-URL.
    //
    // Nu behålls källadressen i stället. Den är inte vacker — den pekar ut
    // leverantören — men raden är `pending` och når aldrig produktsidan i det
    // skicket, och nästa repairImages-körning flyttar hem den. Samma val som
    // systerfunktionen withOwnImage i lib/store/reviews.ts redan gör.
    const kallbilder = reviewImages({ imageUrl: r.imageUrl, imageUrls: r.imageUrls })
      .slice(0, MAX_REVIEW_IMAGES);
    const egnaBilder: string[] = [];
    let missarHar = 0;
    for (const [n, kalla] of kallbilder.entries()) {
      // Suffixet gör filnamnen unika per bild — utan det hade bild 2 och 3
      // skrivit över den första i mediabiblioteket.
      const egen = await importImage(kalla, n === 0 ? reviewIdAE : `${reviewIdAE}-${n + 1}`);
      egnaBilder.push(egen ?? kalla);
      if (!egen) missarHar++;
    }
    if (missarHar > 0) {
      bildmissar += missarHar;
      console.warn(
        `[review-import] kunde inte flytta hem ${missarHar} av ${kallbilder.length} ` +
          `kundbilder för ${reviewIdAE} (produkt ${productId}) — källadressen behålls, ` +
          "kör repairImages när Wix svarar igen.",
      );
    }
    const bildfalt = reviewImageFields(egnaBilder);
    const stored: StoredReview = {
      productId,
      reviewIdAE,
      rating: Math.max(1, Math.min(5, Math.round(r.rating))),
      textOriginal: r.text,
      // Källtexten tills någon skrivit om den i /admin/reviews. Raden är
      // `pending`, så den når aldrig produktsidan oöversatt.
      textSwedish: r.text,
      sourceLanguage: r.language ? r.language.toUpperCase() : undefined,
      customerNameRaw: r.customerName,
      initials: deriveInitials(r.customerName, reviewIdAE),
      // Utelämnas när ingen källa angetts → oförändrad AE-rad (fältet saknas,
      // exakt som alla rader före 2026-08-29). Aldrig tomma strängen: den
      // hade sett ut som ett SATT ursprung utan att vara det.
      ...(deps.source ? { source: deps.source } : {}),
      customerCountry: r.customerCountry,
      date: r.date,
      ...bildfalt,
      // ALLTID pending — samma som butikens egna kundrecensioner. Fram till
      // 2026-08-19 auto-godkändes importerade AE-recensioner (spec 2026-06-02),
      // eftersom DeepL antogs ha gjort dem svenska innan de sparades.
      // Texten är numera källspråket tills någon skrivit om den i
      // /admin/reviews, så ett auto-godkännande hade lagt ENGELSKA recensioner
      // rakt ut på en svensk produktsida.
      status: "pending",
      importedAt,
    };
    try {
      await reviewStore.upsert(stored);
      imported++;
      reviews.push(stored);
    } catch (err) {
      console.warn("[review-import] kunde inte spara recension:", err instanceof Error ? err.message : err);
    }
  }

  return { imported, skippedExisting, reviews, bildmissar };
}
