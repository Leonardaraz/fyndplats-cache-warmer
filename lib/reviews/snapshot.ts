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

import { unstable_cache } from "next/cache";
import { toPublicReview, type PublicReview } from "./public-view";
import { reviewDisplayMode } from "../import/review-display";
import { blobKonfigurerad, lasSnapshotFranBlob } from "./snapshot-blob";
import { getReviewStore, isVisibleStatus, type StoredReview } from "../store/reviews";

/**
 * Taggen som binder ihop ögonblicksbilden med sina läsare.
 *
 * `revalidateTag(SNAPSHOT_TAG)` i /admin/reviews gör att ett godkänt omdöme
 * syns direkt i stället för att vänta in nästa timme. Utan den hade
 * modereringen känts trasig: man trycker "Godkänn" och ingenting händer.
 */
export const SNAPSHOT_TAG = "reviews-snapshot";

/**
 * Version i cachenyckeln. Höj den för att göra ALLA befintliga poster
 * föräldralösa i samma sekund en deploy går ut.
 *
 * ☠️ VARFÖR DET BEHÖVS. Data Cache:n överlever deployer. Har något fel cachats
 * — en tom bild, en bild med fel visningsläge — går den inte att deploya bort,
 * bara vänta ut. Uppmätt 2026-09-18: en tom bild från en felkonfigurerad
 * preview låg kvar en timme efter att miljön rättats.
 *
 * v2: efter att tomma bilder slutade cachas alls (se `kallaSnapshot`).
 */
const NYCKELVERSION = "v2";

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
 * Högst så här många recensioner per produkt i bilden.
 *
 * ☠️ SAMMA TAK SOM `listByProduct(productId, limit = 100)` — med flit, och det
 * är inte en detalj. Fallbacken läser den funktionen, så ett annat tak här
 * hade betytt att en produkt med fler än hundra omdömen visar OLIKA MÅNGA
 * beroende på om svaret kom ur bilden eller ur lagret. Löftet den här
 * konstruktionen bygger på är att butiken inte ska kunna märka vilken väg
 * svaret tog; två olika tak hade brutit det för precis de produkter som har
 * mest att visa.
 *
 * Störst idag är 42 (uppmätt 2026-09-17), så taket biter inte — men det
 * bevakas av prov, inte av tur.
 */
export const MAX_PER_PRODUKT = 100;

export interface ReviewsSnapshot {
  /** När bilden byggdes. Enda sättet att se att cronen faktiskt går. */
  genereradAt: string;
  /** Antal synliga recensioner i bilden. */
  antal: number;
  /** Antal produkter som har minst en synlig recension. */
  produkter: number;
  /**
   * Produkt-id → recensioner, i samma ordning som `listByProduct` ger dem
   * (datum fallande, saknat datum sist), kapat vid `MAX_PER_PRODUKT`.
   */
  perProdukt: Record<string, PublicReview[]>;
  /**
   * Produkt-id → SANT antal synliga omdömen, okapat.
   *
   * ☠️ EGET FÄLT, OCH SKÄLET ÄR EN 0,1-SKILLNAD SOM INGEN HADE SETT.
   * `/api/review-aggregates` matade förut `aggregateByProduct()`, som räknar
   * ALLA synliga rader i databasen. Läser aggregatet i stället längden på den
   * KAPADE listan skulle en produkt med fler än hundra omdömen visa "100" på
   * kortet men ha fler på sidan — en tyst avvikelse som bara drabbar de
   * produkter som har mest att visa. Störst idag är 42, så den hade inte
   * märkts på månader.
   */
  antalPerProdukt: Record<string, number>;
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
  // ☠️ DEN HÄR RADEN ÄR MÄTNINGEN. Allt vilar på att lagret läses ungefär en
  // gång i timmen i stället för ~197. Utan en logg går det inte att skilja
  // "fungerar" från "cachen tar inte emot och vi bygger om varje gång" — och
  // den skillnaden är hela besparingen. Räkna raderna i loggen: fler än ett par
  // i timmen betyder att något inte cachas.
  const start = Date.now();
  const rader = (await getReviewStore().listVisibleAll()).filter((r) => isVisibleStatus(r.status));

  const grupper = new Map<string, StoredReview[]>();
  for (const r of rader) {
    if (!r.productId) continue;
    const lista = grupper.get(r.productId);
    if (lista) lista.push(r);
    else grupper.set(r.productId, [r]);
  }

  const perProdukt: Record<string, PublicReview[]> = {};
  const antalPerProdukt: Record<string, number> = {};
  let antal = 0;
  for (const [productId, lista] of grupper) {
    lista.sort(nyastForst);
    const visade = lista.slice(0, MAX_PER_PRODUKT);
    perProdukt[productId] = visade.map(toPublicReview);
    // Okapat — se fältets kommentar. Aggregatet räknade så här före bytet.
    antalPerProdukt[productId] = lista.length;
    antal += visade.length;
  }

  const bild: ReviewsSnapshot = {
    genereradAt: new Date().toISOString(),
    antal,
    produkter: Object.keys(perProdukt).length,
    perProdukt,
    antalPerProdukt,
  };

  // ☠️ Varningen hör hemma HÄR, inte i rutten: rutten serverar numera den
  // cachade bilden och bygger den sällan. Mäts den på fel ställe hade den
  // tystnat precis när den behövdes.
  const bytes = JSON.stringify(bild).length;
  console.log(
    `[reviews/snapshot] BYGGD ur lagret: ${bild.antal} recensioner, `
      + `${bild.produkter} produkter, ${(bytes / 1e6).toFixed(2)} MB, ${Date.now() - start} ms`,
  );
  if (bytes >= SNAPSHOT_VARNING_BYTES) {
    console.warn(
      `[reviews/snapshot] bilden är ${(bytes / 1e6).toFixed(2)} MB `
        + `(${bild.antal} recensioner, ${bild.produkter} produkter) — närmar sig Vercels 4,5 MB-tak`,
    );
  }
  return bild;
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
export function arTrovardig(bild: ReviewsSnapshot): boolean {
  return typeof bild.antal === "number" && bild.antal > 0;
}

/**
 * Bilden, cachad i Next Data Cache.
 *
 * ☠️ INGEN SJÄLV-HÄMTNING ÖVER HTTP. Första versionen lät läsrutterna `fetch`:a
 * `/api/reviews-snapshot` på den egna deployen. Det fungerade i produktion och
 * gick sönder överallt annars: preview-deployer ligger bakom Vercels
 * inloggningsskydd, så anropet fick SSO-sidans HTML tillbaka. Uppmätt
 * 2026-09-17 i preview-loggen:
 *
 *   [reviews/snapshot] kunde inte hämtas: Unexpected token '<', "<!DOCTYPE "…
 *
 * Fallbacken räddade svaret, så ingenting SÅG trasigt ut — men varenda
 * förfrågan läste lagret, precis som före hela den här konstruktionen. Den
 * sortens fel går inte att skilja från att allt fungerar, och det gick heller
 * inte att bevisa att produktion INTE gjorde samma sak.
 *
 * `unstable_cache` löser det i grunden: samma Data Cache, samma tagg, samma
 * TTL — men i processen. Ingen adress, inget inloggningsskydd, identiskt
 * beteende i preview och produktion.
 *
 * ☠️ VISNINGSLÄGET INGÅR I NYCKELN. `toPublicReview` läser
 * `REVIEW_DISPLAY_MODE` — killswitchen som tömmer initialerna. Cachen
 * överlever enligt Next egna dokumentation ÄVEN EN DEPLOY, så utan läget i
 * nyckeln hade en påslagen killswitch kunnat serveras bort ur en gammal bild
 * i upp till en timme efter att den slagits på. En killswitch som biter "snart"
 * är ingen killswitch.
 */
/**
 * Varifrån bilden kommer, i ordning.
 *
 * ☠️ FILEN FÖRST, DATABASEN SEDAN — och ordningen ÄR varaktigheten.
 * Är en Blob-store kopplad läser ingen läsare Postgres överhuvudtaget; cronen
 * är den enda som gör det, en gång i timmen. Slutar databasen svara ligger den
 * senast skrivna filen kvar och serveras vidare, hur länge som helst. Det är
 * skillnaden mot en ren cache, som måste byggas om av något.
 *
 * Utan store hoppas hela steget över och allt fungerar precis som förut.
 */
async function kallaSnapshot(): Promise<ReviewsSnapshot> {
  if (blobKonfigurerad()) {
    const franFil = await lasSnapshotFranBlob();
    if (franFil && arTrovardig(franFil)) return franFil;
  }
  const byggd = await byggSnapshot();

  // ☠️ EN OTROVÄRDIG BILD FÅR ALDRIG HAMNA I CACHEN — VI KASTAR I STÄLLET.
  //
  // Uppmätt 2026-09-18: preview byggde en tom bild medan REVIEWS_BACKEND
  // saknades. Den tomma bilden CACHADES, och eftersom Data Cache:n överlever
  // deployer låg den kvar en timme efter att miljön rättats. Resultatet: rutten
  // fortsatte svara 503 långt efter att felet var borta, och varje förfrågan
  // föll tillbaka på lagret — alltså exakt den dyra läsningen hela
  // konstruktionen finns för att ta bort, i sextio minuter, tyst.
  //
  // `unstable_cache` cachar inte ett kast. Att kasta här betyder alltså: ingen
  // dålig bild fastnar, nästa förfrågan försöker igen, och den sekund miljön
  // är rätt är läget rätt. Anroparen (`hamtaSnapshot`) fångar och faller
  // tillbaka på lagret precis som förut — utfallet för kunden är oförändrat.
  if (!arTrovardig(byggd)) {
    throw new Error("tom ögonblicksbild — cachas inte");
  }
  return byggd;
}

function cachadSnapshot() {
  return unstable_cache(kallaSnapshot, ["reviews-snapshot", NYCKELVERSION, reviewDisplayMode()], {
    revalidate: SNAPSHOT_TTL_SEKUNDER,
    tags: [SNAPSHOT_TAG],
  });
}

/**
 * Bilden att läsa ur. `null` = den gick inte att få, och anroparen ska då läsa
 * lagret direkt.
 *
 * ☠️ KASTAR ALDRIG. Bilden är en optimering, inte en sanning. Varje väg
 * härifrån som inte ger en trovärdig bild måste sluta i att anroparen faller
 * tillbaka på lagret — annars har vi bytt en dyr sajt mot en trasig.
 */
export async function hamtaSnapshot(): Promise<ReviewsSnapshot | null> {
  try {
    const bild = await cachadSnapshot()();
    if (!arTrovardig(bild)) {
      console.warn("[reviews/snapshot] bilden var tom — faller tillbaka på lagret");
      return null;
    }
    return bild;
  } catch (err) {
    console.warn("[reviews/snapshot] kunde inte byggas:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Recensionerna för en produkt ur bilden. Tom lista = produkten saknar omdömen. */
export function urSnapshot(bild: ReviewsSnapshot, productId: string): PublicReview[] {
  return bild.perProdukt[productId] ?? [];
}
