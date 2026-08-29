import type { FulfillmentTask, TaskStatus } from "../orders/types";
import type { VariantMapping } from "../import/pipeline";

// Lagringsabstraktion för mappningar, fulfillment-tasks och idempotens.
//
// OBS: Standardimplementationen (memory.ts) är in-memory och överlever INTE en
// serverless-omstart. För produktion ska detta backas av en Wix Data-collection
// eller en databas. Interfacet hålls litet så bytet blir enkelt.

export type DraftStatus = "pending_review" | "published" | "rejected";

/** Per-bild verdict från Claude vision (sparas på mapping för granskning). */
export interface ImageAnalysisEntry {
  url: string;
  verdict: "ok" | "warn" | "reject";
  /** Svensk anledning, visas i /admin/queue. Tom om verdict=ok. */
  reason: string;
}

/** Claude-förslag på Wix-kategori. */
export interface CategorySuggestionRecord {
  collectionSlug: string | null;
  collectionId?: string;
  collectionName?: string;
  confidence: number;
  /** Svensk motivering, visas i kö-UI:t. */
  reason: string;
  /**
   * "auto" = redan tilldelad i Wix vid import (confidence > 0.7).
   * "suggested" = väntar på Leonards ett-klick (0.4–0.7).
   * "uncategorized" = för låg confidence eller fel — manuell hantering.
   */
  status: "auto" | "suggested" | "uncategorized";
}

/**
 * Vilken leverantör produkten kommer FRÅN. Saknas = "aliexpress" — alla rader
 * som skapades innan Aosom-importen fanns är AliExpress-produkter.
 *
 * Fältet är inte kosmetiskt. Hela synk-, prisbevaknings- och recensionskedjan
 * slår upp `supplierProductId` mot AliExpress API. Ett Aosom-artikelnummer
 * skickat dit är i bästa fall ett bortkastat anrop per produkt och körning, i
 * sämsta fall ett svar som tolkas som "listningen är borta". Se
 * lib/store/supplier.ts#isAliExpressMapping.
 */
export type MappingSupplier = "aliexpress" | "aosom";

export interface ProductMappingRecord {
  supplierProductId: string;
  /** Leverantör. Saknas = "aliexpress" (back-compat med alla äldre rader). */
  supplier?: MappingSupplier;
  /**
   * AOSOM: fraktens andel av den landade kostnaden vid importen, 0-1.
   *
   * Finns för att poleringskön ska kunna sortera. Aosoms SE-frakt är per kolli
   * och skalar med vikten, och på 1 175 av 5 566 importerbara artiklar kostar
   * frakten MER än varan (andel > 0,5). De går att sälja, men marginalen är
   * borta innan påslaget ens är satt — den som poleras först ska vara den som
   * bär. Medianen över feeden är 0,40.
   */
  aosomFreightShare?: number;
  /**
   * AOSOM: lagersaldot vi SENAST skrev till Wix för den här produkten.
   *
   * Finns för att lagersynken ska slippa läsa Wix för varje produkt i varje
   * körning. Feeden ger 6 000 rader i ett anrop, men lagerskrivningen kräver en
   * Wix-GET per produkt för att få postens id och revision — och saldot ändras
   * bara för en minoritet mellan två körningar. Skiljer sig feedens siffra inte
   * från den här rörs Wix inte alls.
   *
   * Skrivs FÖRST efter en lyckad skrivning, aldrig före: annars hade ett
   * misslyckat anrop bokförts som synkat och produkten hoppats över för alltid.
   */
  aosomSyncedQty?: number;
  /** AOSOM: ISO-tid för senaste lyckade lager-/prissynk. */
  aosomSyncedAt?: string;
  /**
   * AOSOM: tillverkarens EGNA aggregat, taget rått ur produktsidans
   * `aggregateRating`.
   *
   * ☠️ FÅR ALDRIG RÄKNAS UR DE HÄMTADE TEXTERNA. JSON-LD bär högst fem
   * recensioner av ibland åttiotalet, och Aosoms urval lutar högt — uppmätt
   * snitt 4,86 över 30 spridda produkter ur vår katalog (2026-08-29). Räknas
   * snittet av de fem blir deras filter vår sanning, och sidan påstår "5,0 av
   * 5 recensioner" där verkligheten är "4,8 av 88".
   *
   * Paret är också det som gör härkomstraden ärlig: produktsidan visar
   * `aosomReviewCount`, inte antalet rader vi råkar ha sparat.
   */
  aosomRating?: number;
  /** AOSOM: antal omdömen bakom `aosomRating`. Se noten där. */
  aosomReviewCount?: number;
  /**
   * AOSOM: vilken KÄLLBILD varje uppladdad Wix-fil kom från.
   *
   * ☠️ DET HÄR FÄLTET ÄR SKILLNADEN MELLAN ATT LAGA EN BILD OCH ATT LADDA OM FEM.
   *
   * En wixstatic-adress avslöjar inte vilken av produktens fem källbilder den
   * hämtades från. Utan den kopplingen kunde bildreparationen inte veta VILKA
   * som saknades på en produkt med tre av fem, och laddade därför om alla fem
   * och ersatte listan. De gamla filerna blev föräldralösa — fyra körningar mot
   * en växande katalog gjorde att Wix-lagringen tog slut (2026-08-28), och
   * 37 000 filer fick städas bort efteråt.
   *
   * Med kopplingen sparad laddas bara det som faktiskt fattas om, och de
   * befintliga filerna behålls vid sitt id. Då uppstår inga föräldralösa alls.
   *
   * Saknas fältet härleds kopplingen ur Wix egen `sourceUrl`
   * (`getMediaSourceUrls`) — det är bootstrappen för allt som importerades
   * innan fältet fanns.
   */
  aosomBildFiler?: { kalla: string; fileId: string }[];
  wixProductId: string;
  variants: VariantMapping[];
  /**
   * Review-status. Nyimporterade produkter får "pending_review" och
   * visible:false i Wix tills Leonard publicerar via /admin/queue.
   * Saknar default = behandlas som "published" (back-compat med äldre rader).
   */
  draftStatus?: DraftStatus;
  /** ISO-tid när posten skapades. */
  createdAt?: string;
  /** ISO-tid när status-ändringen skedde (publish/reject). */
  reviewedAt?: string;
  /** SEO-title som genererats vid import (visas i kön). */
  seoTitle?: string;
  /** Källadress till AliExpress-produkten — visas i kön. */
  sourceUrl?: string;
  /** Claude vision-analys per bild. Saknas = analyserades inte. */
  imageAnalysis?: ImageAnalysisEntry[];
  /** Claude-förslag på Wix-kategori. Saknas = ej kategoriserad. */
  categorySuggestion?: CategorySuggestionRecord;
  /**
   * Aggregerade warehouse-koder (t.ex. ["ES","CN"]). Tom/saknas = okänt.
   * Används av /admin/queue-filter och av sajten för EU-badge.
   */
  shipsFromCountries?: string[];
  /** True om någon variant skickas från EU-lager (snabbsorterings-flagga). */
  hasEuWarehouse?: boolean;
  /**
   * Klassificering: "EU" = alla varianter från EU; "CN" = inga; "MIXED" =
   * några varianter EU och några inte; "UNKNOWN" = saknar data.
   */
  warehouseClass?: "EU" | "CN" | "MIXED" | "UNKNOWN";
  /**
   * Sätts om Wix gav DUPLICATE_SLUG_ERROR och importen lade på ett suffix.
   * /admin/queue visar "Slug auto-justerad"-badge när detta är satt.
   */
  slugSuffix?: string;
  /**
   * Sync-prioritet (Feature 4 — prioriterad sync). Styr ordningen i
   * /api/cron/aliexpress-sync: "high" synkas före "normal"/"low" oavsett
   * lastCheckedAt. Saknas = behandlas som "normal" (back-compat).
   *   - "high": bestsellers (top-50 senaste 30 dgr) + nyss köpta produkter.
   *   - "normal": default rullande kö (äldsta lastCheckedAt först).
   *   - "low": avprioriterad (t.ex. långsam-säljare) — synkas sist.
   * Sätts av applyBestsellerPriority (daglig) + order-webhooken (vid köp).
   */
  priority?: "low" | "normal" | "high";
  /** Svensk motivering till varför priority sattes — visas i admin. */
  priorityReason?: string;
  /** ISO-tid då priority senast ändrades automatiskt. */
  priorityUpdatedAt?: string;
  /**
   * AliExpress seller/store-id (Feature 6 — säljar-score). Foreign key till
   * FyndplatsSuppliers. Sätts vid import om extensionen kunde skrapa säljaren.
   * Saknas = importerad innan säljarspårningen fanns (eller säljaren okänd).
   */
  supplierId?: string;
  /** AE-butikens namn (denormaliserat för admin-vyer, slipper extra uppslag). */
  supplierName?: string;
  /**
   * ISO-tid då vi senast LETADE efter AliExpress-recensioner för produkten.
   * Sätts även när AE inte hade några — utan den stämpeln kan en schemalagd
   * backfill inte se skillnad på "aldrig kollad" och "kollad, inget fanns", och
   * skulle hämta om de ~40 % recensionslösa produkterna vid varje körning i all
   * evighet. Stämpeln gör att körningen konvergerar och sedan blir en no-op.
   * Recensionslösa produkter kollas om efter REVIEW_RECHECK_DAYS (nya
   * recensioner dyker upp hos AE över tid).
   */
  reviewsCheckedAt?: string;
  /**
   * True när produkten importerades RÅ (AI_ENRICHMENT_ENABLED=false): ingen
   * Claude-text/kategori/bild-ranking kördes. /admin/queue visar då en
   * "✨ Behöver AI-polering"-badge + knapp för att polera via chatten. Saknas =
   * normalt AI-berikad import (back-compat med äldre rader).
   */
  needsAiPolish?: boolean;
  /**
   * Satt när variantpriserna inte gick att bekräfta vid import: alla varianter
   * delade inköpspris utan per-SKU-täckning (lib/import/price-trust.ts).
   * Produkten hålls som utkast och /admin/queue visar motiveringen, som är
   * värdet självt.
   */
  priceUnverified?: string;
  /**
   * Variantvärden/axelnamn som förblev (halv-)engelska vid importen (tabell+
   * cache+AI löste dem inte). Kö-badgen listar dem — de är key-låsta i Wix V3,
   * så fixen är omimport efter tabell-/AI-rättning, inte polering i efterhand.
   */
  unresolvedVariantValues?: string[];
}

export interface AuditEntry {
  at: string;
  /** Typ av händelse, t.ex. "import", "price-alert", "stock", "order", "ship", "cancel". */
  kind: string;
  /** Referens (produkt-/order-/task-id). */
  ref?: string;
  detail?: string;
}

/**
 * Persisterad AliExpress OAuth-state. expiresAt är när access_token slutar
 * gälla (absolut timestamp, inte sekunder kvar) så Task B kan schemalägga
 * refresh utan att behöva känna till när den persisterades.
 */
export interface AliExpressTokenRecord {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface Store {
  // --- Idempotens för webhooks ---
  hasSeenEvent(eventId: string): Promise<boolean>;
  markEventSeen(eventId: string): Promise<void>;

  // --- Produktmappningar ---
  saveMapping(record: ProductMappingRecord): Promise<void>;
  getMappingByWixProductId(wixProductId: string): Promise<ProductMappingRecord | null>;
  listMappings(): Promise<ProductMappingRecord[]>;

  // --- Fulfillment-tasks ---
  upsertTask(task: FulfillmentTask): Promise<void>;
  /** Skapar bara om taskId inte redan finns (idempotent per orderrad). */
  createTaskIfAbsent(task: FulfillmentTask): Promise<boolean>;
  listTasks(status?: TaskStatus): Promise<FulfillmentTask[]>;
  /**
   * Alla tasks för EN order (`${orderId}:${lineItemId}`-nycklar delar orderId).
   * Server-side-filtrerat i wix-data ({orderId}) — undviker full-scan per
   * refund/cancel-event. Används av F19 refund/cancel-grenen.
   */
  listTasksByOrderId(orderId: string): Promise<FulfillmentTask[]>;
  setTaskStatus(taskId: string, status: TaskStatus): Promise<void>;
  /** Uppdaterar delmängd av en task (merge). Saknad task = tyst no-op. */
  updateTask(taskId: string, patch: Partial<FulfillmentTask>): Promise<void>;
  /**
   * Atomiskt dubbel-order-lås (CAS). Sätter `claimToken=token` ENBART om tasken
   * varken är claimad eller redan beställd (aliexpressOrderId tom). true = vi vann
   * låset → lägg ordern; false = någon annan håller det / redan lagd → AVBRYT.
   * Kastar bara vid okänt fel (fail-closed: lägg aldrig ordern på okänt låstillstånd).
   */
  claimTask(taskId: string, token: string): Promise<boolean>;
  /** Släpper låset om VI håller det (claimToken === token). No-op annars. Kastar aldrig. */
  releaseTask(taskId: string, token: string): Promise<void>;
  /**
   * Atomiskt CAS: sätt status="cancelled" ENBART om tasken varken är claimad (pågående
   * orderläggning) eller redan beställd (aliexpressOrderId tom). Samma villkor som
   * claimTask → cancel och orderläggning är ÖMSESIDIGT uteslutande (stänger TOCTOU:n där
   * en cancel på en stale snapshot annars klobbrar en task place-order just hunnit claima).
   *   - "applied"   → vi avbröt rent (ingen orderläggning på gång).
   *   - "blocked"   → claimad ELLER redan beställd → anroparen läser om färskt och avgör
   *                   (avbeställ + AE-larm om order finns; annars flagga cancelMidOrder).
   *   - "not-found" → tasken finns inte.
   * Kastar bara vid okänt fel (anroparen avgör fail-open).
   */
  cancelTaskIfFree(taskId: string): Promise<"applied" | "blocked" | "not-found">;

  // --- Audit-logg (spårbarhet) ---
  appendAudit(entry: AuditEntry): Promise<void>;
  listAudit(limit?: number): Promise<AuditEntry[]>;
  /**
   * Raderar audit-rader äldre än `days` dygn. Utan den växer loggen obegränsat:
   * synk-loggen fick retention i #332, audit-loggen glömdes och stod på 4 723
   * rader. Ingen läser äldre rader — listAudit() hämtar de N senaste.
   *
   * Returnerar en kort statussträng för loggning (Wix svarar med ett jobId,
   * minnes-storen med antal raderade rader).
   */
  pruneAuditOlderThan(days: number, nowMs?: number): Promise<string>;

  // --- AliExpress OAuth-tokens ---
  /** Returnerar persisterade tokens, eller null om inga finns än (cold bootstrap). */
  getAliExpressTokens(): Promise<AliExpressTokenRecord | null>;
  /** Skriver tokens (overwrite). Last-write-wins; concurrency-lock är Task B:s ansvar. */
  saveAliExpressTokens(record: AliExpressTokenRecord): Promise<void>;
}
