// lib/reviews/snapshot.ts
//
// Hela recensionslagret som EN ögonblicksbild.
//
// ☠️ VARFÖR DEN FINNS — DATABASEN FICK ALDRIG SOVA.
//
// Neon debiterar compute-timmar för den tid databasen är VAKEN, och somnar
// efter fem minuters tystnad. `/api/reviews/[productId]` frågade Postgres en
// gång per produktsida butiken renderade.
//
// Uppmätt 2026-09-17: 591 anrop på tre timmar, 554 OLIKA produkter, största
// lucka mellan två frågor 2 min 57 s — och 50 anrop på 20 minuter klockan
// 05:40 på morgonen, när ingen kund är vaken. Databasen nådde aldrig fem
// minuters tystnad, debiterades dygnet runt, och brände ~180 CU-timmar i
// månaden mot en pott på 100. Potten tog slut den 17 september.
//
// ⚠️ EN CACHE-HEADER RÄCKER INTE, OCH RUTTEN HADE REDAN EN.
// `s-maxage=3600` fanns på plats hela tiden. Med 1 251 produkter och ~200
// anrop i timmen hinner varje produkts cache gå ut innan någon frågar om
// samma produkt igen — nästan varje anrop loggades `cache=MISS`. Räknat på sju
// dagars TTL blir det ~7 frågor i timmen, men SLUMPMÄSSIGT fördelade, och då
// är ungefär hälften av luckorna kortare än fem minuter ändå. Cachen gör
// databasen sömnig ibland. Den här filen gör den sömnig ALLTID.
//
// Skillnaden är att åtkomsten blir SCHEMALAGD i stället för slumpmässig: en
// fråga i timmen, på minut :25, i samma väckningsfönster som `order-backfill`
// och `health-check` redan använder. Noll extra väckningar.
//
// ⚠️ ADRESSEN OCH SVARSFORMEN ÄR OFÖRÄNDRADE. Butiken (headless-site,
// lib/reviews.ts) läser `/api/reviews/<produkt>` precis som förut och vet
// ingenting om det här. Att byta lagringsväg utan att röra läsaren är hela
// poängen — jämför spårningssidan 2026-09-01, där en läsare blev TOM utan att
// något kastade.

import { toPublicReview, type PublicReview } from "./public-view";
import { getReviewStore, isVisibleStatus, type StoredReview } from "../store/reviews";

/**
 * Taggen som binder ihop ögonblicksbilden med sina läsare.
 *
 * `revalidateTag(SNAPSHOT_TAG)` i /admin/reviews gör att ett godkänt omdöme
 * syns direkt i stället för att vänta in nästa timme. Utan den hade
 * modereringen känts trasig: man trycker "Godkänn" och ingenting händer.
 */
export const SNAPSHOT_TAG = "reviews-snapshot";

/** Hur länge en bild får serveras innan den hämtas om. Samma som cronens takt. */
export const SNAPSHOT_TTL_SEKUNDER = 3600;

/**
 * Larmtröskel för bildens storlek.
 *
 * ☠️ VARFÖR EN TRÖSKEL OCH INTE BARA HOPP OM DET BÄSTA. Vercels svarsgräns för
 * en serverless-funktion är 4,5 MB. Uppmätt 2026-09-17 var bilden 2,06 MB
 * (4 932 synliga recensioner à ~438 byte) — men endpointen rapporterade 512
 * produkter med betyg den 15:e och 1 251 den 17:e. Aosom-importen växer fort,
 * och den dag bilden passerar gränsen blir felet ett 500 som ingen märker
 * förrän stjärnorna försvunnit från hela katalogen.
 *
 * Vid tröskeln loggas en varning medan det fortfarande finns gott om marginal.
 * Åtgärden när den slår: dela bilden per produkt-id-prefix, eller korta
 * listan per produkt. Båda är små ändringar — men bara om man hinner göra dem
 * i tid.
 */
export const SNAPSHOT_VARNING_BYTES = 3_500_000;

/**
 * Nexts egen utökning av `fetch`.
 *
 * ☠️ VARFÖR TYPEN STÅR HÄR OCH INTE KOMMER FRÅN NEXT. Deklarationen bor i
 * `next-env.d.ts`, som GENERERAS av `next build` och är gitignorerad. I ett
 * rent checkout finns den alltså inte, och `pnpm typecheck` hade fällt på en
 * helt korrekt rad — ett fel som bara syns för den som klonat om, vilket är
 * precis den sorten som får någon att "fixa" rätt kod.
 */
type NextFetchInit = RequestInit & {
  next?: { revalidate?: number; tags?: string[] };
};

export interface ReviewsSnapshot {
  /** När bilden byggdes. Enda sättet att se att cronen faktiskt går. */
  genereradAt: string;
  /** Antal synliga recensioner i bilden. */
  antal: number;
  /** Antal produkter som har minst en synlig recension. */
  produkter: number;
  /**
   * Produkt-id → recensioner, i samma ordning som `listByProduct` ger dem
   * (datum fallande, saknat datum sist).
   */
  perProdukt: Record<string, PublicReview[]>;
}

/**
 * Nyast först, rader utan datum sist.
 *
 * ☠️ MÅSTE MATCHA `listByProduct` i båda lagren (`order by date desc nulls
 * last`). Faller bilden bort svarar rutten ur Postgres i stället, och en kund
 * som laddar om sidan ska inte se recensionerna byta plats för att svaret kom
 * en annan väg.
 */
function nyastForst(a: StoredReview, b: StoredReview): number {
  const ta = a.date ? Date.parse(a.date) : NaN;
  const tb = b.date ? Date.parse(b.date) : NaN;
  const ga = Number.isNaN(ta);
  const gb = Number.isNaN(tb);
  if (ga && gb) return 0;
  if (ga) return 1;
  if (gb) return -1;
  return tb - ta;
}

/**
 * Bygger bilden ur lagret. EN läsning, hela katalogen.
 *
 * Statusfiltret körs en gång till här trots att `listVisibleAll` redan
 * filtrerar: Wix-lagret filtrerar hos Wix och Postgres-lagret i SQL, och den
 * här funktionen ska ge samma resultat oavsett vilket som svarade. Att lita på
 * att två lager filtrerar likadant är precis den sortens antagande som gör att
 * en avvisad recension dyker upp på en produktsida.
 */
export async function byggSnapshot(): Promise<ReviewsSnapshot> {
  const rader = (await getReviewStore().listVisibleAll()).filter((r) => isVisibleStatus(r.status));

  const grupper = new Map<string, StoredReview[]>();
  for (const r of rader) {
    if (!r.productId) continue;
    const lista = grupper.get(r.productId);
    if (lista) lista.push(r);
    else grupper.set(r.productId, [r]);
  }

  const perProdukt: Record<string, PublicReview[]> = {};
  let antal = 0;
  for (const [productId, lista] of grupper) {
    lista.sort(nyastForst);
    perProdukt[productId] = lista.map(toPublicReview);
    antal += lista.length;
  }

  return {
    genereradAt: new Date().toISOString(),
    antal,
    produkter: Object.keys(perProdukt).length,
    perProdukt,
  };
}

/**
 * Är bilden värd att lita på?
 *
 * ☠️ EN TOM BILD ÄR INTE ETT SVAR, DET ÄR ETT FEL SOM SER UT SOM ETT SVAR.
 *
 * Hittat på preview 2026-09-17, av just den här konstruktionen: miljön saknade
 * `REVIEWS_BACKEND=postgres`, läste därför ett annat (tomt) lager, och bilden
 * byggdes utan att kasta. Resultatet blev `{antal: 0, perProdukt: {}}` — en
 * fullt giltig form. Läsrutterna tog den för sanning, hoppade över sin
 * fallback, och svarade `count: 0` för VARENDA produkt. Inget fel i någon
 * logg, ingen röd status. Stjärnorna hade bara försvunnit från 1 251
 * produktsidor.
 *
 * Det är tredje gången samma fälla: spårningssidan blev tom 2026-09-01,
 * aggregatet svarade 200 med fel form 2026-09-02. Bägge gångerna var lärdomen
 * densamma — ett tomt svar och ett trasigt svar måste gå att skilja åt.
 *
 * Därför: noll synliga omdömen i HELA katalogen räknas som "ingen bild", och
 * anroparen läser lagret i stället. Skulle butiken en dag faktiskt sakna
 * omdömen är det exakt rätt beteende ändå — då är läsningen billig, och
 * kostnadsproblemet den här filen finns för existerar inte.
 */
function arTrovardig(bild: ReviewsSnapshot): boolean {
  return typeof bild.antal === "number" && bild.antal > 0;
}

/**
 * Adressen bilden serveras på. Egen miljövariabel först så en preview kan peka
 * på sin egen bild; annars deployens egen värd; annars produktionen.
 *
 * ☠️ ALDRIG en relativ adress. En route handler som `fetch`:ar "/api/..." har
 * ingen bas att lösa den mot och kastar — och felet hade fångats av
 * fallbacken, så vi hade tyst fortsatt fråga Postgres varje gång utan att
 * någon märkte att fixen inte gjorde något.
 */
export function snapshotUrl(): string {
  const egen = process.env.REVIEWS_SNAPSHOT_URL?.trim();
  if (egen) return egen;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}/api/reviews-snapshot`;
  return "https://fyndplats-cache-warmer.vercel.app/api/reviews-snapshot";
}

/**
 * Hämtar bilden. `null` = den fanns inte att få, och anroparen ska då läsa
 * lagret direkt.
 *
 * ☠️ KASTAR ALDRIG. Bilden är en optimering, inte en sanning. Varje väg
 * härifrån som inte ger en giltig bild måste sluta i att anroparen faller
 * tillbaka på Postgres — annars har vi bytt en dyr sajt mot en trasig.
 */
export async function hamtaSnapshot(): Promise<ReviewsSnapshot | null> {
  try {
    const init: NextFetchInit = {
      next: { revalidate: SNAPSHOT_TTL_SEKUNDER, tags: [SNAPSHOT_TAG] },
    };
    const res = await fetch(snapshotUrl(), init);
    if (!res.ok) {
      console.warn(`[reviews/snapshot] ${res.status} från ${snapshotUrl()}`);
      return null;
    }
    const body = (await res.json()) as Partial<ReviewsSnapshot>;
    // Formkontroll, inte typtro: ett 200 med fel form är exakt det tysta felet
    // /api/reviews/aggregates gav 2026-09-02.
    if (!body || typeof body !== "object" || !body.perProdukt || typeof body.perProdukt !== "object") {
      console.warn("[reviews/snapshot] svaret saknade perProdukt — faller tillbaka på lagret");
      return null;
    }
    if (!arTrovardig(body as ReviewsSnapshot)) {
      console.warn("[reviews/snapshot] bilden var tom — faller tillbaka på lagret");
      return null;
    }
    return body as ReviewsSnapshot;
  } catch (err) {
    console.warn("[reviews/snapshot] kunde inte hämtas:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Recensionerna för en produkt ur bilden. Tom lista = produkten saknar omdömen. */
export function urSnapshot(bild: ReviewsSnapshot, productId: string): PublicReview[] {
  return bild.perProdukt[productId] ?? [];
}
