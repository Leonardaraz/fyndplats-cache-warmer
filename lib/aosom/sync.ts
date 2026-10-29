// Lager- och prissynk för Aosom-sortimentet.
//
// VARFÖR DEN SER HELT ANNORLUNDA UT ÄN ALIEXPRESS-SYNKEN
//
// AE-synken måste ringa DS-API:t en gång per produkt, lever under `maxApiCalls`
// och roterar därför genom katalogen — ett varv tar ~20 timmar och två strikes
// ligger en hel rotation isär. Aosom är **ett enda HTTP-anrop** som ger alla
// 6 057 rader med saldo och pris. Ingen budget, ingen rotation, inga rate limits,
// ingen strike-mekanik: varje körning ser hela sanningen samtidigt.
//
// Det gör problemet mindre — men flyttar också risken. När en körning kan röra
// hela sortimentet på en gång är en trasig feed farligare än en trasig produkt.
// Därför ligger tyngdpunkten här på spärrar mot MASSFEL, inte mot enskilda fel.
//
// ☠️ EN RAD SOM FÖRSVINNER UR FEEDEN ÄR INTE UTGÅNGEN
//
// Aosoms egen B2B-guide, ordagrant: "Items with low stock may be temporarily
// removed to avoid overselling." Raden tas alltså bort SOM ETT LAGERBESKED, och
// kommer tillbaka. Rätt svar är att nolla saldot och låta produkten ligga kvar —
// aldrig att avpublicera eller radera. Nästa körning där raden är tillbaka
// återställer saldot av sig själv.
//
// VAD DEN INTE RÖR
//
// Synlighet, texter, bilder, kategorier. Bara lagersaldo, pris och de tre
// kostnadsfälten på mappningen. Kommer en produkt tillbaka i lager mejlas dess
// bevakare (`aterkomnaLagerrader`, sedan 2026-09-30) — det enda den skickar ut.

import { fetchAosomFeed, harVerkligSeFrakt, landedCostEur, type AosomRow } from "./feed";
import type { AosomFx } from "./to-product";
import {
  artikelbild,
  artikelForTask,
  artikelUtanPrefix,
  artiklarPaRaden,
  arISynkensUrval,
  type Artikelbild,
} from "./artiklar";
import { SUPPLIER_VAT_RATE } from "../auction/seed";
import type { FulfillmentTask } from "../orders/types";
import { computePriceWithRules } from "../import/pricing";
import type { PricingRules } from "../import/types";
import { tillampaKonkurrentregel, type KonkurrentUtfall } from "../pricing/konkurrentregel";
import type { ProductMappingRecord } from "../store";
import { mappingSupplier } from "../store/supplier";
import { AOSOM_ID_PREFIX } from "../store/leverantorsprefix";
import {
  AOSOM_PROFIL,
  lagerbesked,
  PROFILER,
  SYNKPROFILER,
  type Leverantorsprofil,
  type Leverantorsrad,
  type SynkadLeverantor,
} from "../sync/leverantorsrad";
import { MIN_WIX_PRODUKTER, type WixProduktPris } from "../wix/v3-products";
import type { RestockUtskick } from "../restock/notify";

const DEFAULT_LIMIT = 400;
const DEFAULT_TIME_BUDGET_MS = 240_000;

/**
 * Under så här många rader är feeden trasig, inte sortimentet.
 *
 * Den här spärren är hela skillnaden mot AE-synken. Där kan ett API-fel nolla
 * EN produkt; här kan en halvhämtad CSV nolla HELA katalogen i en körning.
 * Feeden har legat på 6 057 rader; ett svar under en tredjedel av det är ett
 * transportfel som ska fälla körningen, inte tolkas som att lagret tagit slut.
 *
 * Talet bor i Aosoms profil (`AOSOM_PROFIL`, lib/sync/leverantorsrad.ts), och
 * motorn läser det därifrån (`minRader`).
 */
export const MIN_FEED_RADER = AOSOM_PROFIL.minRader;

/**
 * Vi visar Aosoms saldo MINUS det här, och saldon på eller under det som
 * SLUTSÅLT.
 *
 * NOLL sedan 2026-10-06. Leonards beslut: "ta bort den där 1 kvar bufferten".
 * Har Aosom 1 kvar visar vi 1, inte "Slutsåld". Talet var 3 fram till
 * 2026-10-01 och 1 därefter ("visa en mindre än Aosom, inte 3"); golvlampan
 * 65ca6f6d stod då som slutsåld med 4 kvar hos Aosom.
 *
 * ⚠️ RISKEN SOM ÄR ACCEPTERAD: feeden uppdateras tre gånger per dygn, så
 * mellan två synkar kan Aosom ha sålt sin sista enhet till någon annan. Då tar
 * vi emot en order vi inte kan expediera, och den får avbokas. Aosom plockar
 * själva bort rader med lågt lager ("Items with low stock may be temporarily
 * removed to avoid overselling"), vilket krymper fönstret men inte stänger det.
 *
 * ☠️ BUFFERTEN SKYDDAR INTE SÅLDA ENHETER — DET GÖR `medSaldaAvdragna`. Sedan
 * 2026-09-30 lägger synken tillbaka flödets tal efter en försäljning
 * (`motButikensSaldo`), och utan avdraget hade samma sista exemplar kunnat
 * säljas två gånger innan Aosoms lista hunnit visa vår beställning. Det vi
 * sålt dras därför av separat tills Aosoms flöde visar det (`vantarPaFlodet`)
 * — ta aldrig bort det avdraget.
 *
 * Talet bor i Aosoms profil (`AOSOM_PROFIL.buffert`, lib/sync/leverantorsrad.ts).
 */
export const LAGER_BUFFERT = AOSOM_PROFIL.buffert;

/**
 * Produkter per tugga i loopen — och därmed per Wix-anrop.
 *
 * ☠️ DET HÄR TALET ÄR HELA SKILLNADEN MOT DEN GAMLA LOOPEN. Den anropade
 * `bulk-update-inventory` — ett BULK-API som tar en array — med EN produkt i
 * taget, ~2 000 gånger per svep. Uppmätt 2026-09-02 slog det i Wix EDGE-spärr
 * efter ~600 skrivningar: 1 190 av 2 095 föll med 429 och en HTML-kropp. Den
 * spärren går enligt husets egen mätning inte att vänta ut inom ruttens 300
 * sekunder, så medicinen blev pacing (`AOSOM_WRITE_DELAY_MS`) — uthärdligt,
 * men fel lager att laga det på. Med tuggor blir samma svep ~40 anrop, och då
 * är spärren irrelevant i stället för uthärdlig.
 *
 * Femtio och inte hundra: en produkt kan ha flera varianter, alltså flera
 * lagerrader, och läsningens sida är 100 poster. Femtio produkter à två
 * varianter är precis en sida.
 */
export const CHUNK_PRODUKTER = 50;

/** En lagerpost i Wix, så som synken behöver se den. */
export interface AosomLagerpost {
  id: string;
  revision: string;
  productId: string;
  /**
   * Wix-variantens id. Avgör vilken färg en post tillhör på en sammanslagen
   * sida (lib/aosom/artiklar.ts). Saknas det behandlas posten som förut.
   */
  variantId?: string;
  /**
   * Saldot som FAKTISKT står i butiken. Avgör drift mot stämpeln
   * (`motButikensSaldo`) och återkomster (`aterkomnaLagerrader`). Saknas det
   * är saldot okänt, aldrig noll.
   */
  quantity?: number;
}

/** Utfallet av en bulk-lagerskrivning, per rad. */
export interface AosomLagerUtfall {
  lyckade: string[];
  misslyckade: { id: string; fel: string }[];
}

/**
 * Tak på hur mycket ett pris får ändras i EN körning, i procent.
 *
 * Prissynken är avsiktligt tvåvägs och automatisk (Leonards beslut 2026-08-28):
 * stiger inköpet ska priset upp, sjunker det ska priset ner. Men en feed-rad med
 * en trasig siffra — en frakt som råkar bli 0, ett grossistpris med fel decimal —
 * får inte slå igenom till kund. Över taket skrivs ingenting och raden hamnar i
 * `varningar` för en människa att titta på.
 */
export const MAX_PRISANDRING_PCT = 40;

/** Priser under detta är alltid fel. Skyddar mot en tom eller nollad feed-rad. */
const MIN_RIMLIGT_PRIS_SEK = 20;

export interface AosomSyncOptions {
  /** Torrkörning. DEFAULT TRUE — samma husregel som svepet och bildfixen. */
  dryRun?: boolean;
  /**
   * Tak på antal produkter som SKRIVS, inte på antal som granskas.
   *
   * En oförändrad produkt kostar noll Wix-anrop — bara en jämförelse i minnet —
   * så den får inte äta av budgeten.
   *
   * ☠️ Det räcker INTE för att nå hela katalogen utan sparad markör (uppmätt
   * 2026-10-13). Aosoms saldon rör sig hela tiden, så en körning som börjar om
   * från början förbrukar `limit` i huvudet varje gång och når aldrig svansen.
   * De schemalagda körningarna fortsätter därför där förra slutade
   * (`?rotation=`, lib/aosom/sync-markor.ts).
   */
  limit?: number;
  timeBudgetMs?: number;
  /** Fortsätt EFTER det här artikelnumret (markören ur föregående svar). */
  after?: string;
  /** Bara dessa artikelnummer. För riktad omkörning. */
  onlySkus?: string[];
  /** Hoppa över prisdelen och synka bara lager. */
  skipPrices?: boolean;
  /**
   * Wix-produkter vars prisändring får gå förbi MAX_PRISANDRING_PCT i den här
   * körningen. En människa har tittat på hoppet och godkänt det (Leonards beslut
   * 2026-09-30: gunghästens rosa, 1 199 → 699 kr).
   *
   * ☠️ BARA TAKET SLÄPPS. Regelpriset, golvet, prislåset, facit i butiken och
   * skrivordningen är desamma. Godkännandet gäller exakt de angivna id:na och
   * sparas ingenstans, så nästa trasiga feed-rad på samma produkt fångas av
   * taket igen.
   */
  godkannPrisandring?: ReadonlySet<string>;
}

export interface AosomSyncSummary {
  dryRun: boolean;
  /** Rader i feeden den här körningen — kvittot på att spärren passerades. */
  feedRader: number;
  granskade: number;
  /** Produkter vars lagersaldo skrevs om. */
  lagerUppdaterade: number;
  /** Produkter vars pris skrevs om. */
  prisUppdaterade: number;
  /** Nollade för att raden saknades i feeden (tillfälligt bortplockad hos Aosom). */
  urFeeden: number;
  /** Nollade för att saldot låg på eller under bufferten. */
  slutsalda: number;
  /**
   * Nollade för att Aosom inte skickar dem till Sverige (fraktsentinel).
   *
   * ☠️ EGEN RÄKNARE, inte hopslagen med `slutsalda`. "Aosom har slut" och
   * "Aosom skickar den inte hit" kräver olika åtgärd: det första löser sig
   * självt, det andra kan betyda att en publicerad sida tar emot en order vi
   * inte kan expediera. Talet ska stå i loggraden — går det upp är det ett
   * besked, inte brus.
   */
  ejSkeppbara: number;
  /**
   * Produkter vars besked var okänt: synken rörde varken saldo, pris eller
   * stämpel (`Produktplan.okand`). Okänt blir aldrig 0 i lager.
   *
   * Aosoms feed ger ett besked om varje artikel, så för en Aosom-rad är talet
   * alltid 0. Det som kan ge ett tal här i dag är en rad som urvalet tar på
   * prefixet `aosom:` men vars `supplier`-fält säger en annan leverantör: fält
   * och id är oense, och då vet vi inte vems lager som gäller. Talet ska vara 0.
   *
   * ☠️ Inte samma sak som `okandaVarianter`, som NOLLAR lagret på en
   * Wix-variant mappningen inte känner till. Här rörs ingenting.
   */
  okantBesked: number;
  /** Wix-id för produkterna i `okantBesked`. Publika id, aldrig artikelnummer. */
  okantBeskedProdukter: string[];
  /**
   * Av `okantBesked`: rader där mappningens leverantör inte är källans
   * (`Produktplan.oense`). Urvalet tog dem på prefixet, men `supplier`-fältet
   * säger något annat. Ska vara 0, och ingen körning lagar det av sig själv.
   */
  leverantorOense: number;
  /**
   * Produkter vars nya regelpris väntar på en andra avläsning med samma pris
   * (`prisKraverTvaAvlasningar`, VEVOR). Inget pris skrevs. Alltid 0 för Aosom.
   */
  prisVantar: number;
  /** Ingen förändring — varken lager eller pris. */
  oforandrade: number;
  /**
   * Produkter där butikens pris inte gick att läsa, så prisdelen hoppades över.
   *
   * ☠️ Egen räknare, inte hopslagen med `oforandrade`. En produkt vi inte kan
   * prisjämföra är inte en produkt som stämmer — och den skillnaden är precis
   * vad som gjorde att de tjugo drivande raderna kunde ligga osedda i en månad.
   */
  utanWixPris: number;
  /** Rader vars pris är låst (`prisLast`) och därför medvetet inte rörs. */
  prisLasta: number;
  /**
   * Produkter med en fyndauktion i status `live`, vars pris därför inte rörs
   * (`lasAuktionsprodukter`). Lagret synkas som vanligt. Räknas bara bland de
   * granskade, och bara när prisdelen kör.
   */
  iAuktion: number;
  /** Wix-id för produkterna i `iAuktion`. Publika id, aldrig artikelnummer. */
  iAuktionProdukter: string[];
  /**
   * Konkurrentregeln (lib/pricing/konkurrentregel.ts), per utfall. Rader utan
   * `prisgrupp` räknas ingenstans här — de följer husets regel som förut.
   *
   *   - `konkurrentMal`     priset sattes strax under dealproffsen
   *   - `konkurrentTak`     målet låg över taket (1,50 × landad) — taket gäller
   *   - `konkurrentGolv`    deras pris ligger under vårt golv — vi står kvar,
   *                         och raden är inte konkurrenskraftig att annonsera
   *   - `konkurrentFrysta`  konkurrentpriset är äldre än sju dagar eller
   *                         trasigt — INGET pris skrevs
   *
   * ☠️ `konkurrentFrysta` ÄR ETT LARM, INTE BRUS. Går talet upp har
   * jämförelsen slutat köras, och då står varje testrad still tills någon
   * ser det. Talet går ut i loggraden och audit-raden av samma skäl som
   * `prisLasta`: ett lås ingen ser är ett lås som glöms bort.
   */
  konkurrentMal: number;
  konkurrentTak: number;
  konkurrentGolv: number;
  konkurrentFrysta: number;
  /**
   * Varför butikens prislista inte gick att läsa, eller null när den gjorde det.
   *
   * ☠️ Ett LÄSFEL FÄLLER INTE LAGERSYNKEN. Att sälja något vi inte har är ett
   * kundfel; att inte hinna rätta ett pris på ett osynligt utkast är det inte.
   * Prisdelen hoppas över (allt hamnar i `utanWixPris`) medan saldona synkas
   * som vanligt — men körningen får aldrig se frisk ut: fältet går ut i svaret,
   * i loggraden, i audit-raden, och fäller workflow-jobbet.
   */
  prislistaFel: string | null;
  /**
   * Produkter som skulle skrivas men saknar lagerrader i Wix.
   *
   * ☠️ EGEN RÄKNARE, för den gamla vägen gjorde det här TYST. `setStock`
   * svarade `if (poster.length === 0) return;` — inget fel, ingen räknare — och
   * loopen räknade ändå upp `lagerUppdaterade` och stämplade mappningen som
   * synkad. En produkt utan lagerrader såg alltså ut som en lyckad skrivning,
   * för alltid. Nionde gången samma klass: ett svar utan fel är inget kvitto.
   *
   * De stämplas inte längre, så de granskas om varje körning. Det kostar
   * ingenting extra — de rider med i tuggans läsning ändå.
   */
  utanLagerrader: number;
  /**
   * Produkter där butikens FAKTISKA saldo skiljer sig från stämpeln, alltså
   * från det mappningen tror att den skrev. Räknas före skrivningen: talet
   * säger hur butiken såg ut när körningen kom.
   *
   * ⚠️ Exakt samma frågeställning som `jamforelsePris` byggdes för på PRISET —
   * mappningen är vad vi TROR att kunden ser, Wix är vad kunden faktiskt ser.
   * Talet mättes utan åtgärd från 2026-09-04 (1 av 4 542). Sedan 2026-09-30
   * rättas driften: se `motButikensSaldo` och `lagerDriftRattade`. Efter en
   * skarp körning ska talet vara noll.
   */
  lagerDrift: number;
  /**
   * Produkter där driften lade till minst en lagerrad: stämpeln sa redan
   * flödets tal för den raden, så utan driften hade synken gått förbi den. I
   * torrläge: där det SKULLE skrivas. Räknas när skrivningen är bekräftad,
   * precis som `lagerUppdaterade`, och ingår i den.
   *
   * En drivande rad som ändå skulle skrivas, för att flödets tal ändrats,
   * lägger inte till något och räknas inte. Därför kan talet vara lägre än
   * `lagerDrift`. På en sammanslagen sida räknas produkten även när en annan
   * variant skrevs för att flödet ändrats.
   */
  lagerDriftRattade: number;
  /** Wix-id för produkterna i `lagerDriftRattade`. Publika id, aldrig artikelnummer. */
  lagerDriftProdukter: string[];
  /**
   * Produkter där Wix skrevs men mappningen INTE stämplades, eftersom raden
   * ändrats under körningen: raderats, bytt artikel, bytt form eller tappat en
   * variant som skulle stämplas (`stampelPaFarskRad`). Skälet står i `errors`.
   * Nästa körning läser den färska raden och stämplar då. Inget fel — talet
   * ska ändå vara noll utanför en sammanslagning eller ommappning.
   */
  stampelHoppade: number;
  /**
   * Sålda enheter som Aosoms flöde inte visar än, och som därför drogs av från
   * flödets saldo (`medSaldaAvdragna`, urvalet i `vantarPaFlodet`). Räknas per
   * granskad produkt, alltså bara orderrader på Aosom-sidor. Ett mått, inget
   * fel: talet sjunker när ordrarna lagts hos Aosom och flödet visar dem.
   */
  saldaAvdragna: number;
  /** Wix-id för produkterna i `saldaAvdragna`. Publika id, aldrig artikelnummer. */
  saldaAvdragnaProdukter: string[];
  /**
   * Färgsammanslagna sidor som granskades — en Aosom-artikel per variant, var
   * och en med sitt eget saldo och pris (lib/aosom/artiklar.ts). Ett mått,
   * inget fel.
   */
  flerartikelrader: number;
  /**
   * ☠️ Wix-varianter som mappningen inte känner till, på en produkt med mer än
   * en lagerrad. Deras lager NOLLAS i stället för att få radens saldo.
   *
   * Det är läget efter en sammanslagning där Wix fick den nya färgen men
   * mappningen aldrig skrevs. Den gamla vägen skrev radens saldo på VARJE
   * lagerrad, alltså hade den nya färgen sålts på den gamla färgens lager och
   * beställts som den gamla färgen. Nollat går den inte att köpa, och talet
   * ska vara noll — allt annat är en halvgjord sammanslagning.
   */
  okandaVarianter: number;
  /**
   * ☠️ Rader vars varianter bär olika artiklar men inte går att läsa entydigt.
   * Lagret nollas och raden stämplas aldrig, så varje körning säger det igen
   * tills någon rättat mappningen.
   */
  tvetydiga: number;
  /**
   * Produkter där minst en variant kom tillbaka i lager i butiken: saldot var
   * noll före skrivningen och större än noll efter (`aterkomnaLagerrader`). I
   * torrläge: produkter där det SKULLE hända.
   */
  aterILager: number;
  /** Restock-mejl till bevakare som Resend tog emot (lib/restock/notify.ts). */
  restockMejl: number;
  /**
   * Bevakare av en produkt som kom tillbaka men som inte fick sitt mejl:
   * sidan var dold eller saknade en synlig variant, eller utskicket föll.
   *
   * ☠️ De ligger kvar som väntande, men nästa körning ser ingen övergång, så
   * de får inget mejl förrän varan tar slut och kommer tillbaka igen. Talet
   * ska därför vara noll.
   */
  restockEjSkickade: number;
  /** Per produkt vars bevakare mejlades eller skulle ha mejlats. Bara Wix-id och räknare. */
  restockUtskick: ({ wixProductId: string } & RestockUtskick)[];
  /** Varför bevakarna inte gick att läsa, eller null. Då mejlades ingen i körningen. */
  restockFel: string | null;
  misslyckade: number;
  kvar: number;
  cursor: string | null;
  stoppedBy: "klart" | "limit" | "tidsbudget";
  /**
   * `wixProductId` är produktens PUBLIKA id och det som workflowen skriver ut.
   * `sku` är Aosoms artikelnummer och får aldrig nå en publik logg — se
   * lib/aosom/markor.ts för varför.
   */
  errors: { sku: string; wixProductId?: string; error: string }[];
  /** Prisändringar som blockerades av taket. Kräver mänskligt öga. */
  varningar: { sku: string; wixProductId?: string; fran: number; till: number; andringPct: number }[];
  /**
   * Prishopp över taket som skrevs för att de var godkända
   * (`godkannPrisandring`). Bara wix-id och belopp, aldrig artikelnumret: raden
   * skrivs ut i en publik Actions-logg.
   */
  godkandaHopp: { wixProductId: string; fran: number; till: number; andringPct: number }[];
}

/**
 * Priset det nyräknade ska jämföras MOT — butikens, aldrig bokföringens.
 *
 * ☠️ HELA BUGGEN BODDE I EN RAD: `const gammalt = variant.grossSek`. Det är
 * mappningens tal, alltså vad vi TROR att kunden ser. Prisskrivningen var
 * trasig i en månad (2026-08-29) men hann ändå uppdatera mappningen, så nästa
 * körning räknade fram exakt det tal som redan stod där, såg ingen skillnad och
 * hoppade över produkten. Tjugo rader kunde därför aldrig självläka: rätt pris
 * i böckerna, fel pris i butiken, och en synk som rapporterade allt friskt.
 *
 * Utfallen är tre, och de är MEDVETET olika:
 *   - `{ pris }`      butiken svarade entydigt → jämför mot det.
 *   - `"saknas"`      produkten fanns inte i svaret. Orörd i Wix, kanske
 *                     raderad, kanske föräldralös mappning. Vi vet inte vad
 *                     kunden ser, så vi skriver INGET pris.
 *   - `"flera"`       produkten har varianter med olika pris. `actualPriceRange`
 *                     är då ett spann, inte ett pris, och synken skriver bara
 *                     variant[0] — att jämföra mot spannets botten hade kunnat
 *                     skriva ner en dyrare variant. Aosom har en variant per
 *                     produkt, så det här ska aldrig hända; händer det är det
 *                     ett besked, inte något att gissa förbi.
 */
export function jamforelsePris(
  wix: WixProduktPris | undefined,
): { pris: number } | "saknas" | "flera" {
  if (!wix) return "saknas";
  if (wix.priceSek === null) return "flera";
  if (wix.variantCount > 1) return "flera";
  return { pris: wix.priceSek };
}

/**
 * Lagersaldot vi faktiskt visar för kund, givet leverantörens siffra och
 * leverantörens buffert (profilen). Utan buffert gäller Aosoms.
 */
export function synligtSaldo(leverantorensSaldo: number, buffert: number = LAGER_BUFFERT): number {
  const q = Math.trunc(leverantorensSaldo);
  if (!Number.isFinite(q) || q <= buffert) return 0;
  return q - buffert;
}

/** Landad kostnad INKLUSIVE moms, husets konvention för `landedCostSek`. */
export function landadKostnadSek(row: AosomRow, eurToSek: number): number {
  return landedCostEur(row) * eurToSek * (1 + SUPPLIER_VAT_RATE);
}

/**
 * Aosoms feedrad som synkens gemensamma radformat (lib/sync/leverantorsrad.ts).
 *
 * Synken läser saldot, skeppbarheten och den landade kostnaden ur raden, inget
 * annat. En rad som inte skickas hit (`harVerkligSeFrakt`) blir
 * `ej_levererbar`: saldot nollas och priset rörs inte, precis som förut.
 */
export function aosomTillRad(row: AosomRow, eurToSek: number, lastAt: string): Leverantorsrad {
  return {
    leverantor: "aosom",
    artikel: row.sku,
    status: !harVerkligSeFrakt(row) ? "ej_levererbar" : row.qty > 0 ? "i_lager" : "slut",
    saldo: row.qty,
    landadKostnadSek: landadKostnadSek(row, eurToSek),
    lastAt,
  };
}

export interface AosomSyncDeps {
  fetchFeed: () => Promise<AosomRow[]>;
  /**
   * Butikens priser i bulk, `wixProductId` → pris.
   *
   * ☠️ FACIT ÄR WIX, INTE MAPPNINGEN. Se `jamforelsePris` nedan.
   */
  listWixPriser: () => Promise<Map<string, WixProduktPris>>;
  /** Alla Aosom-mappningar. */
  listAosom: () => Promise<ProductMappingRecord[]>;
  /**
   * Lagerposter för FLERA produkter i ETT anrop.
   *
   * ☠️ Ersätter den gamla `setStock`, som slog upp posterna själv per produkt.
   * Uppslaget låg då inne i skrivningen och var därför lika många anrop som
   * skrivningarna: ~900 läsningar plus ~900 skrivningar per svep. `$in` på
   * productId är uppmätt mot skarpa Wix 2026-09-04 (fem id gav fem poster mot
   * ett för ett enskilt id) — inte läst i dokumentationen, som huset redan
   * betalat för att lita på två gånger.
   */
  lasLagerposter: (wixProductIds: string[]) => Promise<AosomLagerpost[]>;
  /**
   * Butikens pris PER VARIANT för färgsammanslagna sidor: wixProductId →
   * (wixVariantId → pris).
   *
   * `listWixPriser` ger ett pris per PRODUKT, och på en sida vars färger
   * kostar olika är det ett spann, inte ett pris (`jamforelsePris` svarar
   * "flera"). Facit måste då läsas per variant — ett GET per sammanslagen sida,
   * och de är få. Saknas depen, eller faller läsningen, skrivs inget pris på
   * de sidorna: samma hållning som "saknas" i `jamforelsePris`.
   */
  lasVariantPriser?: (wixProductIds: string[]) => Promise<Map<string, Map<string, number>>>;
  /**
   * Skriver absoluta lagersaldon i klump och svarar PER RAD.
   *
   * ☠️ PER RAD ÄR INTE EN BEKVÄMLIGHET. "Wix före mappningen" är en garanti
   * PER PRODUKT: en mappning får bara skrivas när just den produktens saldo
   * bevisligen nådde butiken. Med femtio produkter i ett anrop måste utfallet
   * alltså tillbaka till rätt produkt, och det går bara för att Wix svar bär
   * radens id (uppmätt 2026-09-04, både vid framgång och fel). Vore svaret
   * aggregerat hade en enda revisionskonflikt antingen fällt hela tuggan eller
   * bokförts på fel produkt — tyst.
   */
  skrivLager: (
    updates: { id: string; revision: string; quantity: number }[],
  ) => Promise<AosomLagerUtfall>;
  /** Skriver variantpriset OCH inköpskostnaden i Wix. Får aldrig röra synlighet. */
  /**
   * ☠️ Tar variantens WIX-identitet, inte Aosoms artikelnummer.
   *
   * Den här signaturen sa tidigare `sku: string`, och anroparen skickade
   * loopens `sku` — som är feedens artikelnummer ("‹REDIGERAT›"), nyckeln
   * till feed-raden. Wix-variantens SKU är något helt annat
   * ("FP-schlafsofa-2er-sofa-mit"), så matchningen kunde aldrig lyckas.
   * `setStock` tog samma argument men IGNORERADE det (`_sku`) och slog upp
   * lagerposterna på produkt-id — därför fungerade lagret, och därför såg
   * felet ut som om det inte fanns.
   */
  setPrice: (
    wixProductId: string,
    variant: { wixVariantId?: string; sku?: string },
    grossSek: number,
    landedCostSek: number,
  ) => Promise<void>;
  /**
   * Sparar tuggans stämplar i klump och svarar PER RAD: de rader som inte
   * bevisligen sparades, med skälet. Se `stamplaTuggan`.
   */
  sparaMappningar: (rader: ProductMappingRecord[]) => Promise<{ fel: { wixProductId: string; fel: string }[] }>;
  /**
   * Mappningsraderna så som de står i lagret NU, nycklade på Wix-produkt-id.
   * En rad som är borta finns inte i svaret.
   *
   * ☠️ LÄSES OM STRAX FÖRE STÄMPLARNA, för hela tuggan i ett anrop.
   * `listAosom` läses en gång när körningen startar, och en körning tar
   * minuter. Sparades raden som den såg ut då skrev synken tyst över allt som
   * skrivits på den under tiden: spegeln 4117e161 tappade sin sammanslagning
   * så 03:20 den 2026-09-30 (B71 i tools/polish-gates/FLAGGADE.md). Se
   * `stampelPaFarskRad`.
   */
  lasMappningar: (wixProductIds: string[]) => Promise<Map<string, ProductMappingRecord>>;
  /**
   * Orderrader som kan vara sålda utan att synas i Aosoms flöde: tasks med
   * status `pending` eller `ordered`. Urvalet görs i körningen
   * (`vantarPaFlodet`), så att klockan går att styra i testerna. Läses om för
   * varje tugga, direkt efter butikens lager.
   *
   * ☠️ OBLIGATORISK, av samma skäl som `lasMappningar`: en valfri dep glöms av
   * nästa anropare, och utan avdraget kan samma sista exemplar säljas två
   * gånger — se `LAGER_BUFFERT` och `medSaldaAvdragna`. Ett läsfel stoppar
   * tuggans lagerskrivningar, precis som ett fel i lagerläsningen.
   */
  lasSaldaOrderrader: () => Promise<SaldOrderrad[]>;
  /**
   * Wix-id för produkter med en fyndauktion i status `live`, även de som
   * främjats och startar nästa morgon. Läses en gång per körning, före loopen,
   * och bara när prisdelen kör.
   *
   * ☠️ EN LEVANDE AUKTION ÄGER PRISET. Auktionen sätter ett steg i timmen från
   * listpriset ner mot golvet, och tick-cronen skriver bara när steget byts.
   * Skrev synken regelpriset mitt i en auktion stod det kvar till nästa steg,
   * och auktionen återställer sitt eget listpris när den slutar. Sedan
   * 2026-10-13 går priskörningar 09:20 och 15:20 UTC, mitt i auktionstimmarna
   * (07–19 svensk tid). En främjad auktion som inte startat räknas också: dess
   * listpris lästes när den främjades, och ett nytt pris före starten hade
   * gjort startpriset till ett annat än det kunden såg dagen före.
   *
   * ☠️ OBLIGATORISK, av samma skäl som `lasMappningar`. Ett läsfel stoppar alla
   * prisskrivningar i körningen men inte lagret, och felet bärs i
   * `prislistaFel`, som fäller workflow-jobbet.
   */
  lasAuktionsprodukter: () => Promise<Set<string>>;
  /**
   * Produkter med väntande restock-bevakare. Läses högst en gång per körning,
   * och bara när en produkt kommit tillbaka i lager. Saknas depen (testerna,
   * en körning för hand utan utskick) mejlas ingen.
   */
  bevakadeProdukter?: () => Promise<Set<string>>;
  /** Mejlar en produkts bevakare (lib/restock/notify.ts). */
  mejlaBevakare?: (
    wixProductId: string,
    opts: { visaPris: boolean; varianter: string[] },
  ) => Promise<RestockUtskick>;
  fx: AosomFx;
  rules: PricingRules;
  now?: () => number;
}

/**
 * Motorns beroenden: allt i `AosomSyncDeps` utom källan. Samma för Aosom och
 * VEVOR (lib/vevor/synk.ts). Dokumentationen för varje fält står på
 * `AosomSyncDeps`, där den skrevs.
 */
export type SynkDeps = Omit<AosomSyncDeps, "fetchFeed" | "listAosom" | "fx"> & {
  /**
   * Leverantörens mappningsrader: de som bär leverantörens prefix
   * (`listMappingsMedPrefix`). Motorn väljer urvalet ur dem.
   */
  listMappningar: () => Promise<ProductMappingRecord[]>;
  /** USD → SEK, för `costUsd` på mappningen. Samma kurs som prissättningen. */
  fx: { usdToSek: number };
};

/** Vad en källa lämnar till motorn inför en körning. */
export interface Kallaslasning {
  /** Antal rader i källan, före dubbletter. Kvittot på att den lästes, och det `minRader` prövas mot. */
  antal: number;
  /** En rad per artikel, nycklad på artikelnumret. */
  rader: ReadonlyMap<string, Leverantorsrad>;
  /**
   * Varför priserna inte går att räkna i körningen, eller null. Raderna bär då
   * ingen kostnad, så inget pris skrivs, och skälet går ut i `prislistaFel`.
   * Lagret synkas som vanligt.
   */
  prisFel?: string | null;
}

/**
 * Var en synk får sina rader ifrån. En per leverantör: Aosoms feed
 * (`aosomKalla`) och VEVOR:s avläsningar (lib/vevor/synk.ts).
 *
 * ☠️ KÄLLAN LÄSES EN GÅNG, FÖRE ALLT ANNAT, och kastar hellre än svarar halvt.
 * Motorn prövar sedan antalet mot profilens `minRader`.
 */
export interface Synkkalla {
  /** Leverantören. Dess profil (lib/sync/leverantorsrad.ts) styr resten. */
  leverantor: SynkadLeverantor;
  /** Källans namn i felmeddelanden, till exempel "Aosom-feeden". */
  namn: string;
  las(): Promise<Kallaslasning>;
}

/** Aosoms feed som källa. Raden byggs av `aosomTillRad`, precis som förut. */
export function aosomKalla(deps: Pick<AosomSyncDeps, "fetchFeed" | "fx" | "now">): Synkkalla {
  return {
    leverantor: "aosom",
    namn: "Aosom-feeden",
    async las() {
      const feed = await deps.fetchFeed();
      // Samma nyckel som förut, artikelnumret, och vid en dubblett i feeden
      // vinner den sista.
      const lastAt = new Date((deps.now ?? Date.now)()).toISOString();
      return {
        antal: feed.length,
        rader: new Map(feed.map((r) => [r.sku, aosomTillRad(r, deps.fx.eurToSek, lastAt)] as const)),
      };
    },
  };
}

/**
 * Prefixet för radens leverantör, ur profilen. En rad utan profil når aldrig
 * hit (planen blir okänd i `planeraProdukt`), men skulle den göra det gäller
 * Aosoms prefix, som innan VEVOR fanns.
 */
function prefixFor(m: Pick<ProductMappingRecord, "supplier" | "supplierProductId">): string {
  return PROFILER[mappingSupplier(m)]?.prefix ?? AOSOM_ID_PREFIX;
}

/**
 * Det planeringen behöver ur körningen. `iAuktion` kommer ur
 * `lasAuktionsprodukter`, inte från anroparen.
 */
export type Planval = Pick<AosomSyncOptions, "skipPrices" | "godkannPrisandring"> & {
  /** Wix-id med en levande fyndauktion. Deras pris planeras inte. */
  iAuktion?: ReadonlySet<string>;
};

/** Vad som ska hända med EN produkt. Räknas fram utan ett enda API-anrop. */
export interface Produktplan {
  sku: string;
  m: ProductMappingRecord;
  variant: ProductMappingRecord["variants"][number] | undefined;
  /**
   * Saldot som ska SKRIVAS, eller null när stämpeln redan säger flödets tal
   * och, efter lagerläsningen, butiken gör det också (`motButikensSaldo`).
   */
  nyttSaldo: number | null;
  /** Saldot vi vill att produkten ska ha, skrivet eller ej. */
  onskatSaldo: number;
  nyttPris: number | null;
  nyLandad: number | null;
  urFeeden: boolean;
  slutsald: boolean;
  /** Raden finns, men Aosom skickar den inte till Sverige (fraktsentinel). */
  ejSkeppbar: boolean;
  utanWixPris: boolean;
  prisLast: boolean;
  /** Produkten har en levande fyndauktion: priset rörs inte (`lasAuktionsprodukter`). */
  iAuktion: boolean;
  /** Konkurrentregelns utfall, eller null när raden aldrig nådde prisdelen. */
  konkurrent: KonkurrentUtfall | null;
  varning: { sku: string; fran: number; till: number; andringPct: number } | null;
  /**
   * Färgsammanslagen sida: en plan per variant, med variantens egen artikel,
   * eget saldo och eget pris (lib/aosom/artiklar.ts). Saknas på en vanlig rad,
   * och då gäller fälten ovan precis som förut.
   *
   * På en sådan plan är `nyttSaldo` icke-null när NÅGON variant ska skrivas,
   * och `onskatSaldo` är summan — talen per variant står här.
   */
  varianter?: VariantPlan[];
  /** Raden bär olika artiklar men går inte att läsa entydigt: skälet. */
  tvetydig?: string;
  /** Fler blockerade prishopp än ett — bara på en sammanslagen sida. */
  fleraVarningar?: NonNullable<Produktplan["varning"]>[];
  /** Hopp över taket som skrivs för att produkten är godkänd, per variant. */
  godkandaHopp?: GodkantHopp[];
  /**
   * Butikens saldo skiljer sig från stämpeln, för produkten eller för minst en
   * variant på en sammanslagen sida. Sätts av `motButikensSaldo` efter
   * lagerläsningen. `planeraProdukt` ser aldrig butiken.
   */
  drift?: boolean;
  /** Driften lade till minst en lagerrad som annars inte skrivits (`lagerDriftRattade`). */
  driftRattas?: boolean;
  /**
   * Sålda enheter på produktens orderrader som Aosoms flöde inte visar än, och
   * som drogs av från flödets saldo. Sätts av `medSaldaAvdragna`.
   */
  saldaAvdragna?: number;
  /**
   * ☠️ VI VET INTE. Leverantörens besked är okänt (`lagerbesked` → `kant:
   * false`), leverantören saknar profil, eller raden kommer från en annan
   * leverantör än mappningens. Körningen räknar planen i `okantBesked` och
   * sorterar bort den direkt efter planeringen, så att varken avdraget,
   * rättelsen mot butiken, skrivningen eller stämpeln ser den. Okänt blir
   * aldrig 0.
   */
  okand?: boolean;
  /**
   * Okänd för att mappningens leverantör inte är källans: urvalet tog raden på
   * prefixet, men `supplier`-fältet säger något annat. Räknas för sig
   * (`leverantorOense`), för det lagar ingen körning av sig själv.
   */
  oense?: boolean;
  /**
   * Ett nytt regelpris väntar på en andra avläsning med samma pris
   * (`prisKraverTvaAvlasningar`). Inget pris skrevs.
   */
  prisVantar?: boolean;
}

/** Planen för en produkt vars besked är okänt: ingenting skrivs, ingenting stämplas. */
export function planeraOkand(m: ProductMappingRecord, sku: string): Produktplan {
  return {
    sku,
    m,
    variant: m.variants?.[0],
    nyttSaldo: null,
    onskatSaldo: 0,
    nyttPris: null,
    nyLandad: null,
    urFeeden: false,
    slutsald: false,
    ejSkeppbar: false,
    utanWixPris: false,
    prisLast: false,
    iAuktion: false,
    konkurrent: null,
    varning: null,
    okand: true,
  };
}

/**
 * En orderrad ur task-lagret, med de fält avdraget läser. `wixCatalogItemId`
 * är produktens Wix-id. Vilka rader som dras av avgör `vantarPaFlodet`.
 */
export type SaldOrderrad = Pick<
  FulfillmentTask,
  "wixCatalogItemId" | "wixVariantId" | "sku" | "variantChoices" | "quantity" | "status" | "orderedAt"
>;

/**
 * Hur länge en order räknas som osynlig i Aosoms flöde efter att den markerats
 * beställd. Flödet uppdateras tre gånger per dygn, alltså högst åtta timmar
 * mellan två exporter, och fyra timmars marginal ovanpå det.
 *
 * Talet bor i Aosoms profil (`AOSOM_PROFIL.bestalldOsynligMs`). VEVOR har sitt
 * eget i sin profil.
 */
export const NYSS_BESTALLD_MS = AOSOM_PROFIL.bestalldOsynligMs;

/**
 * Ska orderraden dras av från flödets saldo? Ren.
 *
 * `pending`: såld hos oss men inte beställd hos Aosom. Aosoms siffra vet
 * ingenting om den.
 *
 * `ordered`: beställd hos Aosom för mindre än `NYSS_BESTALLD_MS` sedan
 * (`orderedAt`, som sätts av workflowen "Order — beställd eller skickad för
 * hand"). Flödet visar beställningen först vid nästa export, och till dess
 * räcker inte bufferten: två beställda enheter mot en gammal siffra hade sålts
 * en gång till. Visar flödet redan ordern dras den av två gånger under resten
 * av fönstret, och det är åt det säkra hållet.
 *
 * ☠️ En `ordered`-rad UTAN `orderedAt` dras inte av. Den markerades före
 * 2026-10-01 eller beställdes via AliExpress, och flödet har haft tid att visa
 * den.
 */
export function vantarPaFlodet(
  r: Pick<SaldOrderrad, "status" | "orderedAt">,
  nuMs: number,
  fonsterMs: number = NYSS_BESTALLD_MS,
): boolean {
  if (r.status === "pending") return true;
  if (r.status !== "ordered" || !r.orderedAt) return false;
  const t = Date.parse(r.orderedAt);
  return Number.isFinite(t) && nuMs - t < fonsterMs;
}

/** Ett prishopp över taket som en människa godkänt för den här körningen. */
export interface GodkantHopp {
  fran: number;
  till: number;
  andringPct: number;
}

/** En variants del av planen på en färgsammanslagen sida. */
export interface VariantPlan {
  /** Index i `m.variants`. */
  index: number;
  artikel: string;
  wixVariantId: string;
  sku: string;
  onskatSaldo: number;
  /** Saldot som ska skrivas på just den här variantens lagerrad, eller null. */
  nyttSaldo: number | null;
  nyttPris: number | null;
  nyLandad: number | null;
}

/** Prisdelen av en plan, för EN artikel mot ETT facit. */
interface Prisutfall {
  nyttPris: number | null;
  nyLandad: number | null;
  konkurrent: KonkurrentUtfall;
  utanWixPris: boolean;
  varning: Produktplan["varning"];
  godkantHopp: GodkantHopp | null;
  /** Ett nytt pris väntar på en andra avläsning med samma regelpris. */
  prisVantar: boolean;
}

/**
 * Regelpriset för en landad kostnad: husets regel, och konkurrentregeln när
 * profilen säger att den gäller. Ren. En definition för det nya priset och för
 * föregående avläsnings pris, så att de två jämförs med samma regel.
 */
function regelprisFor(
  landad: number,
  profil: Leverantorsprofil,
  konkurrent: ProductMappingRecord["konkurrent"],
  prisgrupp: ProductMappingRecord["prisgrupp"],
  deps: Pick<SynkDeps, "fx" | "rules" | "now">,
): KonkurrentUtfall {
  const costUsd = landad / deps.fx.usdToSek;
  // Kategorin är null: Aosom-utkast är okategoriserade tills poleringen sätter
  // den, och prisregeln har ändå inga kategorimultiplikatorer (rensade
  // 2026-08-27 — "Husdjur: 2,5" hade satt 60 % marginal på hela
  // PawHut-sortimentet utan att någon regel sa det).
  const regelPris = computePriceWithRules(costUsd, deps.rules, null).grossSek;
  return tillampaKonkurrentregel({
    regelPris,
    landadInklMoms: landad,
    konkurrent: profil.konkurrentregel ? konkurrent : undefined,
    prisgrupp: profil.konkurrentregel ? prisgrupp : undefined,
    nu: (deps.now ?? Date.now)(),
    rounding: deps.rules.rounding,
  });
}

/**
 * Priset för EN artikel: regelpriset ur feedraden, konkurrentregeln, och
 * jämförelsen mot butikens facit.
 *
 * ☠️ EN DEFINITION, TVÅ ANROPARE. Utbruten ur `planeraProdukt` när
 * färgsammanslagna sidor kom till (2026-09-27), så att en variant på en
 * sammanslagen sida prissätts med EXAKT samma regel som en vanlig rad. En
 * kopia hade glidit isär — huset har betalat för det tre gånger
 * (SHIP_AXIS_RE, EU_TULL_CODES, mapWithConcurrency).
 */
function planeraPris(
  nyLandad: number,
  forraLandad: number | null,
  profil: Leverantorsprofil,
  konkurrent: ProductMappingRecord["konkurrent"],
  prisgrupp: ProductMappingRecord["prisgrupp"],
  facit: { pris: number } | "saknas" | "flera",
  sku: string,
  deps: Pick<SynkDeps, "fx" | "rules" | "now">,
  tillatHopp = false,
): Prisutfall {
  const regel = regelprisFor(nyLandad, profil, konkurrent, prisgrupp, deps);

  // ── KONKURRENTREGELN (2026-09-15) ────────────────────────────────────
  // Husets regelpris är GOLVET. Bär raden en prisgrupp och ett färskt
  // dealproffsen-pris lyfts priset mot strax under deras, aldrig över taket
  // 1,50 × landad. Utan grupp svarar regeln med golvet — alltså exakt det
  // pris synken alltid räknat fram. Se lib/pricing/konkurrentregel.ts.
  //
  // ☠️ FRYST SKRIVER INGET, och ligger FÖRE facit-jämförelsen av samma skäl
  // som `prisLast`: en rad vi inte tänker skriva ska inte hamna i `varningar`.
  //
  // Gäller regeln inte leverantören (`profil.konkurrentregel`, VEVOR enligt
  // Leonards beslut 2026-10-21) skickas varken grupp eller konkurrentpris in,
  // och regeln svarar med husets pris. Se `regelprisFor`.
  const ut: Prisutfall = {
    nyttPris: null,
    nyLandad: null,
    konkurrent: regel,
    utanWixPris: false,
    varning: null,
    godkantHopp: null,
    prisVantar: false,
  };
  if (regel.typ === "fryst") return ut;
  const pris = regel.pris;

  // ☠️ FACIT ÄR BUTIKEN. Se jamforelsePris — mappningens grossSek är vad vi
  // TROR att kunden ser, och de två kan ha glidit isär.
  const gammalt = typeof facit === "object" ? facit.pris : -1;

  if (typeof facit === "string") {
    // Vet vi inte vad kunden ser skriver vi inget pris. Lagret är redan
    // planerat — det uppslaget går på produkt-id och berörs inte.
    ut.utanWixPris = true;
    return ut;
  }
  if (pris < MIN_RIMLIGT_PRIS_SEK) {
    ut.varning = { sku, fran: gammalt, till: pris, andringPct: 0 };
    return ut;
  }
  // ── TVÅ AVLÄSNINGAR I RAD (VEVOR, steg 5) ─────────────────────────────
  // VEVOR räknar om sina priser från euro, så ett pris kan hoppa fram och
  // tillbaka mellan två avläsningar. Ett NYTT pris skrivs därför först när
  // föregående avläsning gav samma regelpris. Saknas föregående avläsning
  // väntar priset också. Ligger FÖRE taket: ett hopp vi ännu inte tänker
  // skriva ska inte hamna i `varningar`.
  if (profil.prisKraverTvaAvlasningar && pris !== gammalt) {
    const forra = forraLandad === null ? null : regelprisFor(forraLandad, profil, konkurrent, prisgrupp, deps);
    if (!forra || forra.typ === "fryst" || forra.pris !== pris) {
      ut.prisVantar = true;
      return ut;
    }
  }
  if (gammalt > 0) {
    const andringPct = ((pris - gammalt) / gammalt) * 100;
    if (Math.abs(andringPct) > MAX_PRISANDRING_PCT) {
      // Tvåvägssynken är medvetet automatisk, men ett hopp av den här
      // storleken är oftare en trasig feed-rad än en verklig prisändring.
      if (!tillatHopp) {
        ut.varning = { sku, fran: gammalt, till: pris, andringPct: Math.round(andringPct) };
        return ut;
      }
      // Godkänt av en människa för den här körningen: skrivs som vilket pris
      // som helst, men räknas för sig så att det syns i loggen.
      ut.godkantHopp = { fran: gammalt, till: pris, andringPct: Math.round(andringPct) };
    }
    if (pris !== gammalt) {
      ut.nyttPris = pris;
      ut.nyLandad = nyLandad;
    }
    return ut;
  }
  if (pris > 0) {
    ut.nyttPris = pris;
    ut.nyLandad = nyLandad;
  }
  return ut;
}

/**
 * Räknar fram planen för en produkt — REN, utan I/O.
 *
 * ☠️ ATT DEN ÄR REN ÄR VAD SOM GÖR BATCHNINGEN MÖJLIG. Ska femtio produkters
 * saldon skickas i ett anrop måste vi veta vilka rader som ska med INNAN
 * anropet görs. Den gamla loopen vävde ihop räkning och skrivning, så varje
 * produkt var ett eget anrop av nödvändighet.
 *
 * Logiken är oförändrad — samma feedtolkning, samma `jamforelsePris`, samma
 * tak och samma golv som förut. Bara utflyttad.
 */
export function planeraProdukt(
  m: ProductMappingRecord,
  sku: string,
  rad: Leverantorsrad | undefined,
  wixPris: WixProduktPris | undefined,
  deps: Pick<SynkDeps, "fx" | "rules" | "now">,
  opts: Planval,
): Produktplan {
  const variant = m.variants?.[0];

  // ── INGÅNGEN (steg 3, 2026-10-21) ─────────────────────────────────────
  // Profilen slås upp på mappningens leverantör, aldrig på ett antagande om
  // vem raden kommer från. Utan profil, eller med ett okänt besked, rör
  // synken ingenting: planen märks `okand` och sorteras bort av körningen.
  //
  // ☠️ RADEN MÅSTE KOMMA FRÅN MAPPNINGENS LEVERANTÖR. Annars hade en sida som
  // mappningen säger är VEVOR kunnat få Aosoms saldo och pris, bara för att
  // artikelnumret råkade finnas i Aosoms feed.
  const leverantor = mappingSupplier(m);
  const profil = PROFILER[leverantor];
  if (!profil) return planeraOkand(m, sku);
  if (rad && rad.leverantor !== leverantor) return planeraOkand(m, sku);
  const besked = lagerbesked(rad, profil, (saldo) => synligtSaldo(saldo, profil.buffert));
  if (!besked.kant) return planeraOkand(m, sku);

  // ── LAGER ──────────────────────────────────────────────────────────────
  // Saknad rad, enligt Aosoms profil: tillfälligt bortplockad hos Aosom, inte
  // utgången. Nolla saldot, lämna sidan. Se filhuvudet.
  const feedSaldo = besked.synligt;

  // ☠️ SKEPPBARHETEN GATAS HÄR, INTE BARA VID IMPORTEN (2026-09-10).
  //
  // `isShippableToSe` hade fem anropare — importen, ommappningen, bildfixen och
  // feed-sökningen — och synken var inte en av dem. En rad som blir oskeppbar
  // EFTER importen fortsatte därför få sitt saldo speglat, och massagebänken
  // ‹REDIGERAT› låg publicerad och köpbar med Aosoms "skickas inte hit"-frakt
  // (999,90 €) i feeden. Mappningens egen fraktandel var 0,292 vid importen —
  // frakten var alltså normal då. Exakt samma mönster som den döda
  // AE-listningen: importen gatade, synken gjorde det inte, och felet nådde kund.
  //
  // Svaret är detsamma som där: NOLLA SALDOT, AVPUBLICERA INTE. Sidan ligger
  // kvar (SEO-beslutet från 2026-08-09) och en senare körning där frakten är
  // normal igen återställer saldot av sig själv.
  const ejSkeppbar = besked.ejLevererbar;
  const onskatSaldo = ejSkeppbar ? 0 : feedSaldo;

  const plan: Produktplan = {
    sku,
    m,
    variant,
    nyttSaldo: m.aosomSyncedQty !== onskatSaldo ? onskatSaldo : null,
    onskatSaldo,
    nyttPris: null,
    nyLandad: null,
    urFeeden: besked.saknas,
    // ☠️ `slutsald` räknas ur FEEDENS saldo, inte ur det nollade. Annars hade
    // varje ej skeppbar rad också bokförts som slutsåld, och de två är olika
    // besked: "Aosom har slut" mot "Aosom skickar den inte hit". Att slå ihop
    // dem hade gjort räknaren oanvändbar precis när den behövs.
    slutsald: besked.slut,
    ejSkeppbar,
    utanWixPris: false,
    prisLast: false,
    iAuktion: false,
    konkurrent: null,
    varning: null,
  };

  // ── PRIS ───────────────────────────────────────────────────────────────
  // Bara när raden finns: utan rad finns inget nytt pris att räkna på, och ett
  // gammalt pris på en slutsåld vara skadar ingen.
  //
  // ☠️ OCH EJ SKEPPBAR RAD PRISSÄTTS INTE. `landedCostEur` adderar
  // sentinelfrakten rakt av, så regelpriset blir 17 619 kr på en vara som
  // kostar 58 € — ett tal som bara MAX_PRISANDRING_PCT hindrar från att nå
  // kund. Det taket är en spärr mot trasiga feed-rader, inte en prissättare,
  // och en varning som fyrar varje natt på ett känt tillstånd är samma
  // falsklarm som `regelGäller` byggdes för att ta bort.
  if (besked.landad === null || opts.skipPrices || !variant) return plan;

  // ☠️ LÅST PRIS RÖRS INTE. Leonards beslut per rad — se `prisLast` i
  // ProductMappingRecord. Ligger FÖRE uträkningen: en rad som ändå inte får
  // skrivas ska inte heller kunna hamna i `varningar` för ett hopp vi aldrig
  // tänkte göra. Lagret ovan är redan planerat och berörs inte.
  if (m.prisLast) {
    plan.prisLast = true;
    return plan;
  }

  // ☠️ EN LEVANDE FYNDAUKTION ÄGER PRISET — se `lasAuktionsprodukter`. Ligger
  // också FÖRE uträkningen: auktionens steg ligger under regelpriset, och en
  // rad vi inte tänker skriva ska inte hamna i `varningar`.
  if (opts.iAuktion?.has(m.wixProductId)) {
    plan.iAuktion = true;
    return plan;
  }

  const pr = planeraPris(
    besked.landad,
    besked.forraLandad,
    profil,
    m.konkurrent,
    m.prisgrupp,
    jamforelsePris(wixPris),
    sku,
    deps,
    opts.godkannPrisandring?.has(m.wixProductId) ?? false,
  );
  plan.konkurrent = pr.konkurrent;
  plan.utanWixPris = pr.utanWixPris;
  plan.varning = pr.varning;
  plan.nyttPris = pr.nyttPris;
  plan.nyLandad = pr.nyLandad;
  if (pr.prisVantar) plan.prisVantar = true;
  if (pr.godkantHopp) plan.godkandaHopp = [pr.godkantHopp];
  return plan;
}

/**
 * En sammanslagen sida skrivs när NÅGON variant ska skrivas, och radens tal är
 * sidans summa. En definition för både planen och rättelsen mot butiken.
 */
function sidansNyttSaldo(varianter: ReadonlyArray<VariantPlan>, onskatSaldo: number): number | null {
  return varianter.some((v) => v.nyttSaldo !== null) ? onskatSaldo : null;
}

/**
 * Planen för en FÄRGSAMMANSLAGEN sida — en Aosom-artikel per variant.
 *
 * Varje variant planeras som en egen vanlig rad: sitt eget feedsaldo, sin egen
 * skeppbarhet, sitt eget regelpris och sitt eget facit i butiken. Det enda
 * som delas är raden — prislåset och prisgruppen gäller hela sidan.
 *
 * ☠️ KONKURRENTPRISET GÄLLER BARA RADENS EGEN ARTIKEL. `konkurrent` på raden
 * hämtas för radens artikelnummer (lib/pricing/konkurrentpris-plan.ts), alltså
 * för den FÖRSTA färgen. Att låta den styra den andra färgen hade satt ett pris
 * räknat på en annan artikels konkurrentpris. Övriga färger får husets regel,
 * vilket är exakt vad de hade som egna sidor före sammanslagningen.
 *
 * ☠️ FACIT ÄR VARIANTENS PRIS I BUTIKEN, INTE PRODUKTENS. Saknas det skrivs
 * inget pris på den varianten — samma hållning som "saknas" i `jamforelsePris`.
 */
export function planeraFlerartikel(
  m: ProductMappingRecord,
  bild: Extract<Artikelbild, { typ: "flera" }>,
  perSku: ReadonlyMap<string, Leverantorsrad>,
  variantPriser: ReadonlyMap<string, number> | undefined,
  deps: Pick<SynkDeps, "fx" | "rules" | "now">,
  opts: Planval,
): Produktplan {
  const leverantor = mappingSupplier(m);
  const profil = PROFILER[leverantor];
  if (!profil) return planeraOkand(m, bild.artikel);
  const varianter: VariantPlan[] = [];
  const godkanda: GodkantHopp[] = [];
  const tillatHopp = opts.godkannPrisandring?.has(m.wixProductId) ?? false;
  const varningar: NonNullable<Produktplan["varning"]>[] = [];
  const plan: Produktplan = {
    sku: bild.artikel,
    m,
    variant: m.variants?.[0],
    nyttSaldo: null,
    onskatSaldo: 0,
    nyttPris: null,
    nyLandad: null,
    urFeeden: false,
    slutsald: false,
    ejSkeppbar: false,
    utanWixPris: false,
    prisLast: false,
    iAuktion: false,
    konkurrent: null,
    varning: null,
    varianter,
  };

  for (const va of bild.varianter) {
    const rad = perSku.get(va.artikel);
    // ☠️ ÄR EN ENDA FÄRGS BESKED OKÄNT RÖRS INGEN DEL AV SIDAN. Sidans saldo är
    // summan av färgernas, och en summa med en okänd term är okänd. Samma sak
    // när raden kommer från en annan leverantör än mappningens.
    if (rad && rad.leverantor !== leverantor) return planeraOkand(m, bild.artikel);
    const besked = lagerbesked(rad, profil, (saldo) => synligtSaldo(saldo, profil.buffert));
    if (!besked.kant) return planeraOkand(m, bild.artikel);
    const feedSaldo = besked.synligt;
    const ejSkeppbar = besked.ejLevererbar;
    const onskat = ejSkeppbar ? 0 : feedSaldo;
    const synkat = m.variants[va.index]?.aosomSyncedQty;
    const vp: VariantPlan = {
      index: va.index,
      artikel: va.artikel,
      wixVariantId: va.wixVariantId,
      sku: va.sku,
      onskatSaldo: onskat,
      nyttSaldo: synkat !== onskat ? onskat : null,
      nyttPris: null,
      nyLandad: null,
    };
    varianter.push(vp);
    if (besked.saknas) plan.urFeeden = true;
    if (ejSkeppbar) plan.ejSkeppbar = true;
    if (besked.slut) plan.slutsald = true;

    if (besked.landad === null || opts.skipPrices) continue;
    if (m.prisLast) {
      plan.prisLast = true;
      continue;
    }
    // Auktionen gäller hela sidan, alltså varje färg (se `lasAuktionsprodukter`).
    if (opts.iAuktion?.has(m.wixProductId)) {
      plan.iAuktion = true;
      continue;
    }
    const egen = va.artikel === bild.artikel;
    const pris = variantPriser?.get(va.wixVariantId);
    const pr = planeraPris(
      besked.landad,
      besked.forraLandad,
      profil,
      egen ? m.konkurrent : undefined,
      m.prisgrupp,
      typeof pris === "number" ? { pris } : "saknas",
      va.artikel,
      deps,
      tillatHopp,
    );
    if (egen) plan.konkurrent = pr.konkurrent;
    if (pr.utanWixPris) plan.utanWixPris = true;
    if (pr.prisVantar) plan.prisVantar = true;
    if (pr.varning) varningar.push(pr.varning);
    if (pr.godkantHopp) godkanda.push(pr.godkantHopp);
    vp.nyttPris = pr.nyttPris;
    vp.nyLandad = pr.nyLandad;
  }

  plan.onskatSaldo = varianter.reduce((sum, v) => sum + v.onskatSaldo, 0);
  plan.nyttSaldo = sidansNyttSaldo(varianter, plan.onskatSaldo);
  plan.varning = varningar[0] ?? null;
  if (varningar.length > 1) plan.fleraVarningar = varningar.slice(1);
  if (godkanda.length > 0) plan.godkandaHopp = godkanda;
  return plan;
}

/**
 * Planen för en TVETYDIG rad: skriv inget pris, nolla lagret, stämpla aldrig.
 *
 * ☠️ NOLLAT, INTE ORÖRT. Går det inte att avgöra vilken artikel en variant är,
 * går det inte heller att veta vilket saldo den har — och den gamla vägen hade
 * skrivit radens saldo på varje variant. En vara vi inte vet om vi kan leverera
 * ska inte gå att köpa. Raden stämplas aldrig, så varje körning säger det igen.
 */
export function planeraTvetydig(m: ProductMappingRecord, sku: string, skal: string): Produktplan {
  return {
    sku,
    m,
    variant: m.variants?.[0],
    nyttSaldo: null,
    onskatSaldo: 0,
    nyttPris: null,
    nyLandad: null,
    urFeeden: false,
    slutsald: false,
    ejSkeppbar: false,
    utanWixPris: false,
    prisLast: false,
    iAuktion: false,
    konkurrent: null,
    varning: null,
    tvetydig: skal,
  };
}

/**
 * Planen efter att det vi SÅLT men som Aosoms flöde inte visar än dragits av.
 * Ren. Anroparen väljer raderna (`vantarPaFlodet`).
 *
 * ☠️ AOSOMS SIFFRA VET INGENTING OM VÅRA ORDRAR FÖRRÄN DE SYNS I FLÖDET. En
 * Aosom-order läggs för hand, och feeden uppdateras tre gånger per dygn. Sedan
 * 2026-09-30 skriver synken dessutom tillbaka flödets tal efter en
 * försäljning (`motButikensSaldo`). Utan avdraget hade golvlampan 65ca6f6d, med
 * 4 hos Aosom och en såld men obeställd, fått 3 tillbaka på sidan — och en ny
 * kund hade kunnat köpa samma exemplar. Med 3 i buffert räckte bufferten som
 * skydd; med 1, och sedan 2026-10-06 med 0, gör den inte det (`LAGER_BUFFERT`).
 *
 * Vanlig rad: allt produktens sålda dras av, vilken variant orderraden än
 * bär. Sammanslagen sida: varje orderrad dras från sin egen färg, avgjord på
 * samma sätt som beställningsfilen avgör den (`aosomArtikelForTask`). ☠️ En
 * orderrad som inte går att knyta till en färg dras från ALLA färger — hellre en
 * färg för lite i lager en stund än samma exemplar sålt två gånger.
 */
export function medSaldaAvdragna(p: Produktplan, rader: ReadonlyArray<SaldOrderrad>): Produktplan {
  // En tvetydig rad nollas redan (`planeraTvetydig`).
  if (p.tvetydig) return p;
  const antal = (r: SaldOrderrad) =>
    Number.isFinite(r.quantity) && r.quantity > 0 ? Math.trunc(r.quantity) : 0;
  const totalt = rader.reduce((sum, r) => sum + antal(r), 0);
  if (totalt === 0) return p;

  if (!p.varianter) {
    const onskat = Math.max(0, p.onskatSaldo - totalt);
    return {
      ...p,
      onskatSaldo: onskat,
      nyttSaldo: p.m.aosomSyncedQty !== onskat ? onskat : null,
      saldaAvdragna: totalt,
    };
  }

  const perArtikel = new Map<string, number>();
  let okopplade = 0;
  for (const r of rader) {
    const n = antal(r);
    if (n === 0) continue;
    const a = artikelForTask(r, p.m, prefixFor(p.m));
    if ("artikel" in a) perArtikel.set(a.artikel, (perArtikel.get(a.artikel) ?? 0) + n);
    else okopplade += n;
  }
  const varianter = p.varianter.map((v) => {
    const avdrag = (perArtikel.get(v.artikel) ?? 0) + okopplade;
    if (avdrag === 0) return v;
    const onskat = Math.max(0, v.onskatSaldo - avdrag);
    const synkat = p.m.variants[v.index]?.aosomSyncedQty;
    return { ...v, onskatSaldo: onskat, nyttSaldo: synkat !== onskat ? onskat : null };
  });
  const onskatSaldo = varianter.reduce((sum, v) => sum + v.onskatSaldo, 0);
  return {
    ...p,
    varianter,
    onskatSaldo,
    nyttSaldo: sidansNyttSaldo(varianter, onskatSaldo),
    saldaAvdragna: totalt,
  };
}

/**
 * Lagerraderna EN produkt ska skriva, ur planen och butikens lagerposter. Ren.
 *
 *   - vanlig rad: radens saldo på produktens poster, som förut.
 *   - sammanslagen sida: varje variants eget saldo på varje variants post.
 *   - tvetydig rad: noll på allt som inte redan är noll.
 *
 * ☠️ OKÄNDA VARIANTER NOLLAS. Har produkten mer än en lagerpost och bär någon
 * av dem ett variant-id som mappningen inte känner till, får den posten noll —
 * aldrig radens saldo. Det är läget efter en sammanslagning där Wix fick den
 * nya färgen men mappningen inte skrevs: den gamla vägen hade sålt den nya
 * färgen på den gamla färgens lager. En produkt med EN lagerpost skrivs som
 * förut oavsett id — där finns ingen annan variant att förväxla den med.
 *
 * `saknas` betyder att en planerad skrivning inte hade någon post att landa
 * på: räknas i `utanLagerrader`, stämplas inte.
 */
export function lagerraderForProdukt(
  p: Produktplan,
  poster: ReadonlyArray<AosomLagerpost>,
): { rader: { id: string; revision: string; quantity: number }[]; saknas: boolean; okanda: number } {
  const rad = (x: AosomLagerpost, quantity: number) => ({ id: x.id, revision: x.revision, quantity });

  if (p.tvetydig) {
    return { rader: poster.filter((x) => x.quantity !== 0).map((x) => rad(x, 0)), saknas: false, okanda: 0 };
  }

  if (p.varianter) {
    const perVariant = new Map(p.varianter.map((v) => [v.wixVariantId, v]));
    const rader: { id: string; revision: string; quantity: number }[] = [];
    let okanda = 0;
    for (const x of poster) {
      const v = x.variantId ? perVariant.get(x.variantId) : undefined;
      if (v) {
        if (v.nyttSaldo !== null) rader.push(rad(x, v.nyttSaldo));
        continue;
      }
      okanda++;
      if (x.quantity !== 0) rader.push(rad(x, 0));
    }
    const saknas = p.varianter.some(
      (v) => v.nyttSaldo !== null && !poster.some((x) => x.variantId === v.wixVariantId),
    );
    return { rader, saknas, okanda };
  }

  const { egna, okanda } = delaPoster(p, poster);
  const rader: { id: string; revision: string; quantity: number }[] = [];
  if (p.nyttSaldo !== null) for (const x of egna) rader.push(rad(x, p.nyttSaldo));
  for (const x of okanda) if (x.quantity !== 0) rader.push(rad(x, 0));
  return { rader, saknas: p.nyttSaldo !== null && egna.length === 0, okanda: okanda.length };
}

/**
 * En vanlig rads lagerposter, delade i radens egna och de okända: poster med
 * ett variant-id som mappningen inte känner till. Okända finns bara när
 * produkten har mer än en post — en ensam post är radens, vad dess id än är.
 * En definition för skrivningen och för drift-jämförelsen.
 */
function delaPoster(
  p: Produktplan,
  poster: ReadonlyArray<AosomLagerpost>,
): { egna: AosomLagerpost[]; okanda: AosomLagerpost[] } {
  const kanda = new Set(
    (p.m.variants ?? []).map((v) => (v.wixVariantId ?? "").trim()).filter(Boolean),
  );
  const okanda = poster.length > 1 && kanda.size > 0
    ? poster.filter((x) => !!x.variantId && !kanda.has(x.variantId))
    : [];
  return { egna: poster.filter((x) => !okanda.includes(x)), okanda };
}

/**
 * Planen efter att butikens FAKTISKA saldo lästs. Ren, utan I/O.
 *
 * ☠️ STÄMPELN ÄR VAD VI TROR ATT VI SKREV, BUTIKEN ÄR VAD KUNDEN SER.
 * `planeraProdukt` jämför flödets saldo mot stämpeln (`aosomSyncedQty`),
 * eftersom planen räknas innan lagret läses. Det räcker bara så länge ingen
 * annan skriver i butiken. Hundburen `6297606f` (2026-09-30): sammanslagningen
 * stämplade 90 cm med flödets tal, och synken 03:20 nollade sedan varianten i
 * butiken som okänd, eftersom den hade läst mappningen före sammanslagningen.
 * Stämpeln sa "redan skrivet", butiken sa 0, och varianten stod som slutsåld
 * tills Aosoms saldo på artikeln ändrades. Samma förväxling som
 * `jamforelsePris` byggdes för på priset.
 *
 * Skiljer sig butikens saldo från stämpeln är stämpeln opålitlig, och
 * flödets saldo planeras för skrivning även när stämpeln redan säger det.
 * Jämförelsen görs per variant på en sammanslagen sida. På en vanlig rad
 * räknas bara radens egna poster: en okänd variant nollas ändå
 * (`lagerraderForProdukt`) och är ingen drift.
 *
 * ☠️ ETT OKÄNT SALDO ÄR INGEN DRIFT. En post utan `quantity` gick inte att
 * läsa, och då är stämpeln enda underlaget, samma hållning som
 * `aterkomnaLagerrader`. En tvetydig rad nollas redan och rörs inte här.
 */
export function motButikensSaldo(
  p: Produktplan,
  poster: ReadonlyArray<AosomLagerpost>,
): Produktplan {
  if (p.tvetydig) return p;
  const skiljer = (x: AosomLagerpost, synkat: number | undefined) =>
    typeof synkat === "number" && typeof x.quantity === "number" && x.quantity !== synkat;

  if (p.varianter) {
    let drift = false;
    let rattas = false;
    const varianter = p.varianter.map((v) => {
      const synkat = p.m.variants[v.index]?.aosomSyncedQty;
      if (!poster.some((x) => x.variantId === v.wixVariantId && skiljer(x, synkat))) return v;
      drift = true;
      if (v.nyttSaldo !== null) return v;
      rattas = true;
      return { ...v, nyttSaldo: v.onskatSaldo };
    });
    if (!drift) return p;
    return {
      ...p,
      varianter,
      nyttSaldo: sidansNyttSaldo(varianter, p.onskatSaldo),
      drift: true,
      driftRattas: rattas,
    };
  }

  if (!delaPoster(p, poster).egna.some((x) => skiljer(x, p.m.aosomSyncedQty))) return p;
  if (p.nyttSaldo !== null) return { ...p, drift: true, driftRattas: false };
  return { ...p, drift: true, driftRattas: true, nyttSaldo: p.onskatSaldo };
}

type MappningsVariant = ProductMappingRecord["variants"][number];

/** Samma variant före och efter: samma Wix-variant-id och samma artikel. */
function sammaVariant(a: MappningsVariant, b: MappningsVariant): boolean {
  return (a.wixVariantId ?? "").trim() === (b.wixVariantId ?? "").trim()
    && (a.supplierVariantId ?? "").trim() === (b.supplierVariantId ?? "").trim();
}

/**
 * Mappningsraden att spara efter en skrivning, byggd på den FÄRSKA raden — eller
 * skälet att inte stämpla alls. Ren.
 *
 * ☠️ STÄMPELN LÄGGS PÅ RADEN SOM DEN STÅR NU, INTE SOM DEN STOD NÄR KÖRNINGEN
 * STARTADE. Den gamla vägen sparade `{ ...p.m, … }`, alltså ögonblicksbilden
 * från `listAosom`, och skrev därmed tyst över allt som hänt på raden under
 * körningens minuter: en sammanslagnings nya variant, poleringens SKU och
 * status, en ommappning — och återskapade en raderad rad. Spegeln 4117e161
 * tappade sin sammanslagning så (B71, 2026-09-30).
 *
 * Bara synkens egna fält skrivs: `aosomSyncedQty` och `aosomSyncedAt` på
 * raden, och per variant `aosomSyncedQty`, `grossSek`, `landedCostSek` och
 * `costUsd` — bara det som faktiskt skrevs till Wix. Varianterna matchas på
 * Wix-id och artikel, aldrig på plats i listan, så en färg som lagts till under
 * körningen lämnas orörd.
 *
 * ☠️ HELLRE INGEN STÄMPEL ÄN EN SOM LJUGER. Har raden raderats, bytt artikel,
 * bytt form (vanlig ↔ sammanslagen) eller tappat en variant som skulle
 * stämplas, skrivs ingenting. Wix är redan skrivet; nästa körning läser den
 * färska raden, och stämpeln kommer då — eller driften rättas
 * (`motButikensSaldo`).
 *
 * Radens `aosomSyncedQty` på en sammanslagen sida är summan av varianternas,
 * räknad på den färska raden.
 */
export function stampelPaFarskRad(
  p: Produktplan,
  farsk: ProductMappingRecord | null,
  skrivet: {
    lager: boolean;
    /** Vanlig rad: priset skrevs på radens variant. */
    pris: boolean;
    /** Sammanslagen sida: de varianter vars pris faktiskt skrevs. */
    prisSkrivna: ReadonlyArray<VariantPlan>;
  },
  usdToSek: number,
  nu: number,
): ProductMappingRecord | { skal: string } {
  if (!farsk) return { skal: "raden finns inte längre" };
  if ((farsk.supplierProductId ?? "").trim() !== (p.m.supplierProductId ?? "").trim()) {
    return { skal: "raden har bytt artikel" };
  }
  const prefix = prefixFor(p.m);
  if (artikelbild(farsk, prefix).typ !== artikelbild(p.m, prefix).typ) return { skal: "raden har bytt form" };

  const fore = p.m.variants ?? [];
  const variants = [...(farsk.variants ?? [])];
  /** Var en variant ur ögonblicksbilden står i den färska raden, eller -1. */
  const iFarsk = (index: number) => {
    const v = fore[index];
    return v ? variants.findIndex((x) => sammaVariant(v, x)) : -1;
  };
  const priset = (pris: number, landad: number) => ({
    grossSek: pris,
    landedCostSek: landad,
    costUsd: landad / usdToSek,
  });
  const iso = new Date(nu).toISOString();

  if (!p.varianter) {
    if (skrivet.pris && p.nyttPris !== null && p.nyLandad !== null) {
      const j = iFarsk(0);
      if (j < 0) return { skal: "radens variant finns inte kvar" };
      variants[j] = { ...variants[j], ...priset(p.nyttPris, p.nyLandad) };
    }
    return {
      ...farsk,
      ...(skrivet.lager ? { aosomSyncedQty: p.onskatSaldo, aosomSyncedAt: iso } : {}),
      variants,
    };
  }

  const prisSkrivna = new Set(skrivet.prisSkrivna.map((v) => v.index));
  for (const vp of p.varianter) {
    const stamplaSaldo = skrivet.lager && vp.nyttSaldo !== null;
    const stamplaPris = prisSkrivna.has(vp.index) && vp.nyttPris !== null && vp.nyLandad !== null;
    if (!stamplaSaldo && !stamplaPris) continue;
    const j = iFarsk(vp.index);
    if (j < 0) return { skal: "en variant som skulle stämplas finns inte kvar" };
    variants[j] = {
      ...variants[j],
      ...(stamplaSaldo ? { aosomSyncedQty: vp.onskatSaldo } : {}),
      ...(stamplaPris ? priset(vp.nyttPris as number, vp.nyLandad as number) : {}),
    };
  }
  const synkade = variants
    .map((v) => v.aosomSyncedQty)
    .filter((q): q is number => typeof q === "number");
  return {
    ...farsk,
    ...(skrivet.lager ? { aosomSyncedQty: synkade.reduce((a, b) => a + b, 0), aosomSyncedAt: iso } : {}),
    variants,
  };
}

/** En produkt vars Wix-skrivning gick igenom och som ska stämplas. */
export interface Stampeljobb {
  p: Produktplan;
  skrivet: Parameters<typeof stampelPaFarskRad>[2];
}

/**
 * Stämplar tuggans produkter: läser om raderna i ETT anrop och sparar dem i
 * ETT, efter att tuggans alla Wix-skrivningar är gjorda.
 *
 * ☠️ UPPMÄTT 2026-10-29, när driften flyttat till Wix. Stämpeln läste och
 * sparade en rad i taget, två Wix-anrop per skriven produkt à 110–220 ms
 * (samma anrop tog millisekunder i Postgres). Lagerkörningen 00:20 UTC
 * skrev 470 saldon, granskade 3 150 av 4 809 och stannade på tidsbudgeten:
 * stämplarna åt runt 200 av 240 sekunder. Femtio rader läses på 140–270 ms
 * med `$in`, så tuggan kostar nu två anrop i stället för upp till hundra.
 *
 * Reglerna är `stampelPaFarskRad`s, oförändrade: stämpeln läggs på den färska
 * raden, och en rad som raderats, bytt artikel, bytt form eller tappat en
 * variant stämplas inte. Fönstret mellan omläsningen och skrivningen är
 * tuggans två anrop, under en sekund.
 *
 * ☠️ Går omläsningen inte att göra stämplas INGEN av tuggans produkter, och
 * var och en räknas som misslyckad. Wix är redan skrivet. Nästa körning ser
 * driften mot butiken (`motButikensSaldo`) och stämplar då. En rad som inte
 * sparades räknas som misslyckad, de andra står kvar som sparade. Funktionen
 * kastar aldrig: ett fel här fäller produkter, inte körningen.
 */
export async function stamplaTuggan(
  jobb: readonly Stampeljobb[],
  deps: Pick<SynkDeps, "lasMappningar" | "sparaMappningar" | "fx">,
  summary: Pick<AosomSyncSummary, "misslyckade" | "stampelHoppade" | "errors">,
  nu: number,
): Promise<void> {
  const misslyckad = (p: Produktplan, error: string) => {
    summary.misslyckade++;
    summary.errors.push({ sku: p.sku, wixProductId: p.m.wixProductId, error });
  };

  let farska: Map<string, ProductMappingRecord>;
  try {
    farska = await deps.lasMappningar(jobb.map((j) => j.p.m.wixProductId));
  } catch (err) {
    const fel = err instanceof Error ? err.message : String(err);
    for (const { p } of jobb) misslyckad(p, `mappningarna gick inte att läsa om: ${fel} — Wix är skrivet, stämpeln väntar till nästa körning`);
    return;
  }

  const stamplar: ProductMappingRecord[] = [];
  const planFor = new Map<string, Produktplan>();
  for (const { p, skrivet } of jobb) {
    let stampel: ReturnType<typeof stampelPaFarskRad>;
    try {
      stampel = stampelPaFarskRad(p, farska.get(p.m.wixProductId) ?? null, skrivet, deps.fx.usdToSek, nu);
    } catch (err) {
      misslyckad(p, err instanceof Error ? err.message : String(err));
      continue;
    }
    if ("skal" in stampel) {
      summary.stampelHoppade++;
      summary.errors.push({
        sku: p.sku,
        wixProductId: p.m.wixProductId,
        error: `mappningen ändrades under körningen (${stampel.skal}) — Wix är skrivet, stämpeln väntar till nästa körning`,
      });
      continue;
    }
    stamplar.push(stampel);
    planFor.set(stampel.wixProductId, p);
  }
  if (stamplar.length === 0) return;

  let fel: { wixProductId: string; fel: string }[];
  try {
    fel = (await deps.sparaMappningar(stamplar)).fel;
  } catch (err) {
    const f = err instanceof Error ? err.message : String(err);
    fel = stamplar.map((s) => ({ wixProductId: s.wixProductId, fel: f }));
  }
  for (const f of fel) {
    summary.misslyckade++;
    summary.errors.push({
      sku: planFor.get(f.wixProductId)?.sku ?? f.wixProductId,
      wixProductId: f.wixProductId,
      error: `mappningen sparades inte: ${f.fel} — Wix är skrivet, stämpeln väntar till nästa körning`,
    });
  }
}

/**
 * Kör en tugga av lager- och prissynken.
 *
 * Ordningen är artikelnummer stigande, samma som svepet och bildfixen, så
 * markören betyder samma sak i alla tre.
 */
/**
 * Lagerraderna som kom tillbaka i lager i butiken i den här körningen: saldot
 * var noll före skrivningen och är större än noll efter. `skrivna` är
 * lagerpost-id → saldot som skrevs och bekräftades av Wix. En rad som inte
 * skrevs behåller sitt saldo. Null när ingen rad kom tillbaka.
 *
 * ☠️ FACIT ÄR BUTIKEN, INTE MAPPNINGEN. Mappningens `aosomSyncedQty` är vad vi
 * tror att vi skrev. Frågan här är om kunden såg "Slutsåld", och det avgörs
 * av butikens saldo — samma skäl som `jamforelsePris`.
 *
 * ☠️ PER RAD, INTE PER PRODUKT. Butikens formulär visas när den VALDA färgen
 * är slut, också när en annan färg finns, och bevakningen sparar ingen färg.
 * Den 2026-09-30 väntade två av fyra bevakare på en färg medan en annan fanns
 * (vitt sängbord, beige klättervägg). En regel som krävde att hela produkten
 * var slut hade aldrig mejlat dem. Mejlet namnger i stället färgen som kom
 * tillbaka (lib/restock/notify.ts).
 *
 * ☠️ Ett saldo som inte gick att läsa är okänt, aldrig noll. Då räknas ingen
 * rad på produkten.
 */
export function aterkomnaLagerrader(
  poster: AosomLagerpost[],
  skrivna: Map<string, number>,
): AosomLagerpost[] | null {
  if (poster.some((x) => typeof x.quantity !== "number")) return null;
  const tillbaka = poster.filter(
    (x) => (x.quantity as number) <= 0 && (skrivna.get(x.id) ?? (x.quantity as number)) > 0,
  );
  return tillbaka.length > 0 ? tillbaka : null;
}

/** Aosom-synken: motorn med Aosoms feed som källa. Oförändrad utåt sedan steg 5. */
export async function runAosomSync(
  deps: AosomSyncDeps,
  opts: AosomSyncOptions = {},
): Promise<AosomSyncSummary> {
  return korSynk({ ...deps, listMappningar: deps.listAosom }, aosomKalla(deps), opts);
}

/**
 * Lager- och prissynken för EN leverantör, med raderna ur `kalla` och reglerna
 * ur leverantörens profil (lib/sync/leverantorsrad.ts).
 *
 * Det här var `runAosomSync` fram till steg 5 (2026-10-29). Allt som var Aosom
 * i den låg i källan (feeden och dess radformat) och i fyra tal: bufferten,
 * minsta antal rader, fönstret för beställda enheter och urvalets prefix. De
 * står nu i profilen, och VEVOR-synken (lib/vevor/synk.ts) kör samma motor med
 * sin egen källa och profil. Inget annat skiljer: avdraget för sålda enheter,
 * rättelsen mot butiken, prislåset, auktionslåset, taket, stämpeln på den
 * färska raden och restock-mejlen är desamma.
 */
export async function korSynk(
  deps: SynkDeps,
  kalla: Synkkalla,
  opts: AosomSyncOptions = {},
): Promise<AosomSyncSummary> {
  const profil = SYNKPROFILER[kalla.leverantor];
  const dryRun = opts.dryRun !== false;
  const limit = Math.max(1, opts.limit ?? DEFAULT_LIMIT);
  const timeBudgetMs = opts.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS;
  const now = deps.now ?? (() => Date.now());
  const start = now();

  const kallan = await kalla.las();

  // ☠️ MASSFEL-SPÄRREN. Kollas FÖRE allt annat och kastar — en halvhämtad feed
  // får aldrig se ut som att sortimentet tagit slut. Gränsen är profilens
  // (`minRader`). En källa utan gräns (VEVOR) kan inte halvhämtas till ett
  // lagerbesked: en saknad rad är redan okänd.
  if (profil.minRader !== null && kallan.antal < profil.minRader) {
    throw new Error(
      `${kalla.namn} gav bara ${kallan.antal} rader (minst ${profil.minRader} krävs). `
        + `Körningen avbryts — det här är ett hämtningsfel, inte ett lagerbesked.`,
    );
  }

  // ☠️ BUTIKENS PRISER, EN GÅNG. Ett anrop per 100 produkter i HELA katalogen
  // (`listV3ProductPrices`): ~64 i dag och ~220 efter VEVOR-importen, och de
  // räknas in i körningens tidsbudget. Hämtas FÖRE loopen så en produkt aldrig
  // jämförs mot ett facit som hunnit ändras mitt i körningen.
  //
  // Massfel-spärren speglar MIN_FEED_RADER: svarar Wix med en handfull
  // produkter är det ett läsfel, och alternativet vore att tolka det som "de
  // här produkterna finns inte i butiken" och sluta prisjämföra hela
  // sortimentet — tyst, och exakt den sortens fel som redan kostat en månad.
  //
  // ☠️ OCH DEN FÄLLER INTE KÖRNINGEN, till skillnad från MIN_FEED_RADER.
  // Skillnaden är vad felet KOSTAR. En trasig feed nollar lagersaldon över hela
  // katalogen — där är avbrott enda säkra svaret. En oläsbar prislista kan
  // ingenting förstöra: `jamforelsePris` svarar "saknas" och då skrivs inget
  // pris. Att ändå avbryta hade stoppat LAGERSYNKEN i sex timmar för ett fel i
  // prisdelen, och att sälja något vi inte har är ett kundfel medan ett orättat
  // pris på ett osynligt utkast inte är det.
  //
  // Priset för att fortsätta är att körningen inte får se frisk ut: felet går
  // ut i `prislistaFel` → svaret, loggraden, audit-raden och workflow-jobbet.
  let wixPriser = new Map<string, WixProduktPris>();
  let prislistaFel: string | null = null;
  if (!opts.skipPrices) {
    try {
      wixPriser = await deps.listWixPriser();
      if (wixPriser.size < MIN_WIX_PRODUKTER) {
        throw new Error(
          `butikens prislista gav bara ${wixPriser.size} produkter (minst ${MIN_WIX_PRODUKTER} krävs) `
            + `— det här är ett läsfel, inte en tom katalog`,
        );
      }
    } catch (err) {
      prislistaFel = err instanceof Error ? err.message : String(err);
      // Tom karta → varje produkt blir "saknas" → utanWixPris. Inget pris
      // skrivs, och det syns i räknaren i stället för att gissas förbi.
      wixPriser = new Map();
    }
  }

  // ── LEVANDE FYNDAUKTIONER, EN GÅNG ────────────────────────────────────
  // Deras pris ägs av auktionen (se `lasAuktionsprodukter`). ☠️ Går listan
  // inte att läsa vet vi inte vilka produkter som är i auktion, och då skrivs
  // INGET pris i körningen, på någon produkt. Lagret synkas som vanligt, och
  // felet går ut i `prislistaFel`, samma hållning som för prislistan ovan.
  let iAuktion = new Set<string>();
  let auktionsFel: string | null = null;
  if (!opts.skipPrices) {
    try {
      iAuktion = await deps.lasAuktionsprodukter();
    } catch (err) {
      const fel = err instanceof Error ? err.message : String(err);
      auktionsFel = `fyndauktionerna gick inte att läsa, så inga priser skrevs: ${fel}`;
      prislistaFel = prislistaFel ? `${prislistaFel}; ${auktionsFel}` : auktionsFel;
    }
  }
  // Källan kan inte räkna priser i körningen (VEVOR utan rabatt i
  // konfigurationen). Raderna bär då ingen kostnad och inget pris skrivs, men
  // körningen får inte se frisk ut: skälet går ut i `prislistaFel`.
  if (kallan.prisFel) prislistaFel = prislistaFel ? `${prislistaFel}; ${kallan.prisFel}` : kallan.prisFel;
  const planval: Planval = {
    skipPrices: opts.skipPrices || auktionsFel !== null,
    godkannPrisandring: opts.godkannPrisandring,
    iAuktion,
  };

  // Synkens gemensamma radformat (lib/sync/leverantorsrad.ts), nycklat på
  // artikelnumret. Källan byggde det (`Synkkalla`).
  const perSku = kallan.rader;
  const onlySkus = opts.onlySkus?.length ? new Set(opts.onlySkus) : null;

  // `sku` är RADENS artikel även på en färgsammanslagen sida — den bär
  // markören, så `?after=` betyder samma sak som förut. Artikeln per variant
  // står i `bild` (lib/aosom/artiklar.ts). `?sku=` träffar en sammanslagen
  // sida på vilken som helst av dess artiklar. Urvalet och artikeln läses på
  // leverantörens prefix (profilen).
  const prefix = profil.prefix;
  const mappningar = (await deps.listMappningar())
    .filter((m) => arISynkensUrval(m, prefix))
    .map((m) => ({ m, sku: artikelUtanPrefix(m, prefix), bild: artikelbild(m, prefix) }))
    .filter((x) => !onlySkus || artiklarPaRaden(x.m, prefix).some((a) => onlySkus.has(a)))
    .filter((x) => !opts.after || x.sku.localeCompare(opts.after) > 0)
    .sort((a, b) => a.sku.localeCompare(b.sku));

  // ── PRISER PER VARIANT, FÖR DE SAMMANSLAGNA SIDORNA ────────────────────
  // En sida vars färger kostar olika har inget produktpris att jämföra mot —
  // `jamforelsePris` svarar "flera". Facit läses därför per variant, ett GET
  // per sammanslagen sida. Faller läsningen bär `prislistaFel` det, och de
  // sidorna får inget pris skrivet: samma hållning som för hela prislistan.
  //
  // ☠️ LÄSES PER TUGGA, INTE FÖRE LOOPEN (2026-10-13). Läsningen låg tidigare
  // här och tog ALLA sammanslagna sidor i katalogen, en i taget, innan en enda
  // produkt granskats. Kommentaren sa "de är få"; den 2026-10-13 var de ~360,
  // och läsningen åt nästan hela tidsbudgeten. Nattens priskörning granskade
  // 550 av 4 938 produkter och stannade på tidsbudget, en torrkörning samma
  // kväll granskade NOLL. Bokhyllan bd664764 såldes för 749 kr mot regelpriset
  // 819. Nu läses bara sidorna i den tugga som granskas, så budgeten går till
  // granskningen och en körning som stannar har läst exakt det den hann pröva.
  let variantPrisFel: string | null = null;
  const lasVariantPriserFor = async (
    tugga: readonly { m: ProductMappingRecord; bild: Artikelbild }[],
  ): Promise<Map<string, Map<string, number>>> => {
    const idn = tugga.filter((x) => x.bild.typ === "flera").map((x) => x.m.wixProductId);
    if (planval.skipPrices || idn.length === 0) return new Map();
    if (!deps.lasVariantPriser) {
      variantPrisFel ??= "priser per variant går inte att läsa i den här körningen";
      return new Map();
    }
    try {
      return await deps.lasVariantPriser(idn);
    } catch (err) {
      const fel = err instanceof Error ? err.message : String(err);
      variantPrisFel ??= `priserna per variant gick inte att läsa: ${fel}`;
      return new Map();
    }
  };

  const summary: AosomSyncSummary = {
    dryRun,
    feedRader: kallan.antal,
    granskade: 0,
    lagerUppdaterade: 0,
    prisUppdaterade: 0,
    urFeeden: 0,
    slutsalda: 0,
    ejSkeppbara: 0,
    okantBesked: 0,
    okantBeskedProdukter: [],
    leverantorOense: 0,
    prisVantar: 0,
    oforandrade: 0,
    utanWixPris: 0,
    prisLasta: 0,
    iAuktion: 0,
    iAuktionProdukter: [],
    konkurrentMal: 0,
    konkurrentTak: 0,
    konkurrentGolv: 0,
    konkurrentFrysta: 0,
    prislistaFel,
    utanLagerrader: 0,
    lagerDrift: 0,
    lagerDriftRattade: 0,
    lagerDriftProdukter: [],
    stampelHoppade: 0,
    saldaAvdragna: 0,
    saldaAvdragnaProdukter: [],
    flerartikelrader: 0,
    okandaVarianter: 0,
    tvetydiga: 0,
    aterILager: 0,
    restockMejl: 0,
    restockEjSkickade: 0,
    restockUtskick: [],
    restockFel: null,
    misslyckade: 0,
    kvar: mappningar.length,
    cursor: null,
    stoppedBy: "klart",
    errors: [],
    varningar: [],
    godkandaHopp: [],
  };

  /** Antal produkter vi FAKTISKT skrivit. Det är den här `limit` gäller. */
  let skrivna = 0;

  /** Produkter med väntande restock-bevakare. Läses första gången en produkt kommer tillbaka. */
  let bevakade: Set<string> | null = null;

  // ── LOOPEN GÅR I TUGGOR, INTE EN PRODUKT I TAGET ────────────────────────
  // Ordningen inom tuggan är oförändrad artikelnummerordning, och HELA tuggan
  // granskas innan markören flyttas — så `?after=` betyder exakt samma sak som
  // förut.
  //
  // ☠️ TUGGAN KAPAS MOT DET SOM ÅTERSTÅR AV `limit`. En tugga med N produkter
  // kan aldrig ge fler än N skrivningar, så `min(CHUNK, limit - skrivna)` gör
  // `limit` EXAKT i stället för ungefärlig. Utan kapningen hade en körning med
  // `limit: 1` skrivit hela den första tuggan — och `limit` finns för att
  // hålla en serverless-rutt innanför sina 300 sekunder, inte som en
  // riktlinje. Ett test på markören fångade just det.
  for (let i = 0; i < mappningar.length; ) {
    if (skrivna >= limit) {
      summary.stoppedBy = "limit";
      break;
    }
    // Budgeten kollas FÖRE varje tugga — aldrig mitt i, där lagret hunnit
    // skrivas men mappningen inte.
    if (now() - start >= timeBudgetMs) {
      summary.stoppedBy = "tidsbudget";
      break;
    }

    const tuggstorlek = Math.max(1, Math.min(CHUNK_PRODUKTER, limit - skrivna));
    const tugga = mappningar.slice(i, i + tuggstorlek);
    i += tugga.length;

    // ── FAS 1: PLANERA (ren, ingen I/O) ──────────────────────────────────
    // Feeden och butikens prislista hämtades före loopen; de sammanslagna
    // sidornas priser per variant läses här, bara för tuggans sidor (se
    // `lasVariantPriserFor`). Att räkna först och skriva sedan är vad som gör
    // batchningen möjlig: vi vet vilka rader som ska med i anropet innan vi
    // gör det.
    const variantPriser = await lasVariantPriserFor(tugga);
    const allaPlaner = tugga.map(({ m, sku, bild }) => {
      // ☠️ SYNKEN PLANERAR BARA KÄLLANS LEVERANTÖRS RADER. Urvalet går på
      // prefixet (`aosom:`, `vevor:`), men leverantören avgörs av
      // `supplier`-fältet när det finns (`mappingSupplier`). Säger fältet en
      // annan leverantör är fält och id oense, och då rörs raden inte — inte
      // heller nollningen av en tvetydig sida, som läser varianterna som
      // källans artiklar.
      if (mappingSupplier(m) !== kalla.leverantor) return { ...planeraOkand(m, sku), oense: true };
      if (bild.typ === "flera") {
        return planeraFlerartikel(m, bild, perSku, variantPriser.get(m.wixProductId), deps, planval);
      }
      if (bild.typ === "tvetydig") return planeraTvetydig(m, sku, bild.skal);
      return planeraProdukt(m, sku, perSku.get(sku), wixPriser.get(m.wixProductId), deps, planval);
    });
    // ☠️ OKÄNT RÖRS INTE. En plan märkt `okand` når varken avdraget,
    // rättelsen mot butiken, skrivningen eller stämpeln — den räknas och
    // sorteras bort här. Aosom ger aldrig ett okänt besked; regeln finns för
    // VEVOR, vars sida kan gå att inte läsa eller vars avläsning kan vara för
    // gammal, och för en rad vars fält och id är oense (ovan).
    const planer = allaPlaner.filter((p) => !p.okand);
    for (const p of allaPlaner) {
      if (!p.okand) continue;
      summary.okantBesked++;
      summary.okantBeskedProdukter.push(p.m.wixProductId);
      if (p.oense) summary.leverantorOense++;
    }

    summary.granskade += tugga.length;
    summary.kvar -= tugga.length;
    summary.cursor = tugga[tugga.length - 1].sku;
    for (const p of planer) {
      if (p.urFeeden) summary.urFeeden++;
      if (p.slutsald) summary.slutsalda++;
      if (p.ejSkeppbar) summary.ejSkeppbara++;
      if (p.utanWixPris) summary.utanWixPris++;
      if (p.prisVantar) summary.prisVantar++;
      if (p.prisLast) summary.prisLasta++;
      if (p.iAuktion) {
        summary.iAuktion++;
        summary.iAuktionProdukter.push(p.m.wixProductId);
      }
      if (p.konkurrent?.typ === "mal") summary.konkurrentMal++;
      if (p.konkurrent?.typ === "tak") summary.konkurrentTak++;
      if (p.konkurrent?.typ === "golv") summary.konkurrentGolv++;
      if (p.konkurrent?.typ === "fryst") summary.konkurrentFrysta++;
      if (p.varianter) summary.flerartikelrader++;
      if (p.tvetydig) summary.tvetydiga++;
      if (p.varning) summary.varningar.push({ ...p.varning, wixProductId: p.m.wixProductId });
      for (const v of p.fleraVarningar ?? []) summary.varningar.push({ ...v, wixProductId: p.m.wixProductId });
      for (const h of p.godkandaHopp ?? []) summary.godkandaHopp.push({ ...h, wixProductId: p.m.wixProductId });
    }

    // ── FAS 2: LÄS LAGERPOSTERNA FÖR HELA TUGGAN, I ETT ANROP ────────────
    // Läses även i torrläge, till skillnad från förr. En torrkörning ska säga
    // sanningen om vad en skarp skulle göra, och `utanLagerrader` går inte att
    // veta utan att titta. Läsningar ändrar ingenting.
    const idn = planer.map((p) => p.m.wixProductId);
    let posterPerProdukt = new Map<string, AosomLagerpost[]>();
    let lasfel: string | null = null;
    try {
      for (const post of await deps.lasLagerposter(idn)) {
        const lista = posterPerProdukt.get(post.productId);
        if (lista) lista.push(post);
        else posterPerProdukt.set(post.productId, [post]);
      }
    } catch (err) {
      lasfel = err instanceof Error ? err.message : String(err);
      posterPerProdukt = new Map();
    }

    // ── DET SÅLDA SOM FLÖDET INTE VISAR ÄN, DIREKT EFTER LAGRET ──────────
    // Läses för varje tugga och EFTER butikens lager, inte en gång när
    // körningen startar. En försäljning drar av i Wix och skapar sin orderrad
    // (webhooken, några sekunder senare). Lästes raderna före lagret kunde en
    // försäljning mitt i körningen synas i butiken men inte här, och
    // `motButikensSaldo` hade lagt tillbaka den. Kvar är webhookens sekunder.
    // Läses även i torrläge: torrkörningen ska säga vad en skarp skulle skriva.
    //
    // ☠️ Går raderna inte att läsa skrivs inget lager i tuggan, precis som när
    // lagret inte går att läsa. Utan avdraget hade varje såld enhet lagts
    // tillbaka.
    let saldaPerProdukt = new Map<string, SaldOrderrad[]>();
    let orderfel: string | null = null;
    if (!lasfel) {
      try {
        const nu = now();
        for (const r of await deps.lasSaldaOrderrader()) {
          const pid = (r.wixCatalogItemId ?? "").trim();
          if (!pid || !vantarPaFlodet(r, nu, profil.bestalldOsynligMs)) continue;
          const lista = saldaPerProdukt.get(pid);
          if (lista) lista.push(r);
          else saldaPerProdukt.set(pid, [r]);
        }
      } catch (err) {
        orderfel = err instanceof Error ? err.message : String(err);
        saldaPerProdukt = new Map();
      }
    }
    for (let k = 0; k < planer.length; k++) {
      const p = medSaldaAvdragna(planer[k], saldaPerProdukt.get(planer[k].m.wixProductId) ?? []);
      planer[k] = p;
      if (p.saldaAvdragna) {
        summary.saldaAvdragna += p.saldaAvdragna;
        summary.saldaAvdragnaProdukter.push(p.m.wixProductId);
      }
    }
    /** Varför tuggans lager inte går att skriva, eller null. */
    const lagerfel = lasfel
      ? `lagerposterna gick inte att läsa: ${lasfel}`
      : orderfel
        ? `de sålda orderraderna gick inte att läsa: ${orderfel}`
        : null;

    // ── BUTIKENS SALDO MOT STÄMPELN ──────────────────────────────────────
    // En stämpel som skiljer sig från butiken är opålitlig: flödets saldo
    // planeras för skrivning även när stämpeln redan säger det. Se
    // `motButikensSaldo`. Faller läsningen finns inget att jämföra med, och då
    // gäller stämpeln som förut. Rättelserna ryms i tuggan, som redan är
    // kapad mot `limit`, så `limit` förblir exakt.
    if (!lagerfel) {
      for (let k = 0; k < planer.length; k++) {
        planer[k] = motButikensSaldo(planer[k], posterPerProdukt.get(planer[k].m.wixProductId) ?? []);
        if (planer[k].drift) summary.lagerDrift++;
      }
    }

    // ── FAS 3: SKRIV SALDONA I KLUMP ─────────────────────────────────────
    /** wixProductId → lagerskrivningen gick igenom (eller behövdes inte). */
    const lagerOk = new Map<string, boolean>();
    /** Produkter där en planerad skrivning inte hade någon lagerrad att landa på. */
    const saknarRad = new Set<string>();
    /** wixProductId → antal Wix-varianter som mappningen inte känner till. */
    const okandaPerProdukt = new Map<string, number>();
    const rader: { id: string; revision: string; quantity: number; produkt: string }[] = [];
    for (const p of planer) {
      const pid = p.m.wixProductId;
      if (lagerfel) {
        if (p.nyttSaldo !== null) lagerOk.set(pid, false);
        continue;
      }
      // Raderna räknas ur planen och butikens poster — se lagerraderForProdukt
      // för hur en sammanslagen sida, en tvetydig rad och en okänd variant
      // hanteras. En vanlig rad får exakt samma rader som förut.
      const utfall = lagerraderForProdukt(p, posterPerProdukt.get(pid) ?? []);
      if (utfall.okanda > 0) okandaPerProdukt.set(pid, utfall.okanda);
      if (utfall.saknas) {
        // ☠️ Räknas, stämplas inte. Den gamla vägen svarade tyst `return` här
        // och bokförde ändå produkten som synkad — för alltid.
        summary.utanLagerrader++;
        saknarRad.add(pid);
        lagerOk.set(pid, false);
      }
      for (const r of utfall.rader) rader.push({ ...r, produkt: pid });
    }

    if (rader.length > 0 && !dryRun) {
      try {
        const utfall = await deps.skrivLager(
          rader.map(({ id, revision, quantity }) => ({ id, revision, quantity })),
        );
        const fallna = new Map(utfall.misslyckade.map((f) => [f.id, f.fel]));
        const felPerProdukt = new Map<string, string>();
        for (const r of rader) {
          const fel = fallna.get(r.id);
          if (fel && !felPerProdukt.has(r.produkt)) felPerProdukt.set(r.produkt, fel);
        }
        // ☠️ En produkt är OK bara när INGEN av dess rader föll. Halvskrivet
        // lager är svårare att upptäcka än orört: mappningen hade sagt
        // "synkad" medan en variant stod kvar på gammalt saldo.
        for (const produkt of new Set(rader.map((r) => r.produkt))) {
          lagerOk.set(produkt, !felPerProdukt.has(produkt) && !saknarRad.has(produkt));
        }
        for (const [produkt, fel] of felPerProdukt) {
          const p = planer.find((x) => x.m.wixProductId === produkt);
          summary.misslyckade++;
          summary.errors.push({ sku: p?.sku ?? produkt, wixProductId: produkt, error: fel });
        }
      } catch (err) {
        // Hela anropet föll (nätverk, 4xx/5xx efter återförsök). Ingen rad är
        // bevisat skriven, alltså är ingen produkt det heller.
        const fel = err instanceof Error ? err.message : String(err);
        for (const r of rader) lagerOk.set(r.produkt, false);
        for (const produkt of new Set(rader.map((r) => r.produkt))) {
          const p = planer.find((x) => x.m.wixProductId === produkt);
          summary.misslyckade++;
          summary.errors.push({ sku: p?.sku ?? produkt, wixProductId: produkt, error: fel });
        }
      }
    } else {
      // Torrläge, eller inga saldon att skriva: allt som skulle skrivas räknas
      // som lyckat, precis som förr.
      for (const produkt of new Set(rader.map((r) => r.produkt))) {
        lagerOk.set(produkt, !saknarRad.has(produkt));
      }
    }

    // ☠️ OKÄNDA VARIANTER SKA SYNAS, INTE BARA NOLLAS. Nollningen gör sidan
    // säker; talet är det som får någon att laga mappningen. Står i torrläge
    // också — det är där den ska upptäckas, före en skarp körning.
    for (const [pid, antal] of okandaPerProdukt) {
      const p = planer.find((x) => x.m.wixProductId === pid);
      summary.okandaVarianter += antal;
      summary.errors.push({
        sku: p?.sku ?? pid,
        wixProductId: pid,
        error: `${antal} variant(er) i Wix som mappningen inte känner till — deras lager nollas`,
      });
    }

    // Lässkadan bokförs en gång per drabbad produkt, efter att raderna räknats.
    if (lagerfel) {
      for (const p of planer) {
        if (p.nyttSaldo === null) continue;
        summary.misslyckade++;
        summary.errors.push({
          sku: p.sku,
          wixProductId: p.m.wixProductId,
          error: lagerfel,
        });
      }
    }

    // ── TILLBAKA I LAGER ─────────────────────────────────────────────────
    // Butikens saldo före skrivningen står i lagerposterna, och det som skrevs
    // står i `rader`. Bara en bekräftad skrivning räknas. I torrläge räknas
    // det som SKULLE skrivas, så torrkörningen visar vad en skarp gör.
    /** Produkt → Wix-varianterna som kom tillbaka (tom när posten saknar variant-id). */
    const aterITuggan: { pid: string; varianter: string[] }[] = [];
    if (!lagerfel) {
      const skrivet = new Map<string, number>();
      for (const r of rader) if (lagerOk.get(r.produkt) === true) skrivet.set(r.id, r.quantity);
      for (const p of planer) {
        if (p.tvetydig || lagerOk.get(p.m.wixProductId) !== true) continue;
        const tillbaka = aterkomnaLagerrader(posterPerProdukt.get(p.m.wixProductId) ?? [], skrivet);
        if (tillbaka) {
          aterITuggan.push({
            pid: p.m.wixProductId,
            varianter: tillbaka.map((x) => x.variantId ?? "").filter(Boolean),
          });
        }
      }
    }
    summary.aterILager += aterITuggan.length;
    /** Produkter vars pris skrevs i tuggan. Deras mejl visar inget pris, se nedan. */
    const prisSkrivet = new Set<string>();
    /** Produkter vars Wix-skrivning gick igenom och som ska stämplas (`stamplaTuggan`). */
    const attStampla: Stampeljobb[] = [];

    // ── FAS 4: PRISET — PER PRODUKT ──────────────────────────────────────
    // Priset är per produkt hos Wix (`updateV3VariantPrices` tar ett
    // produkt-id), så den delen kan inte batchas. Den är också den lilla
    // delen: efter konvergens vill nästan inga priser skrivas.
    for (const p of planer) {
      if (p.tvetydig) {
        summary.errors.push({
          sku: p.sku,
          wixProductId: p.m.wixProductId,
          error: `mappningen är tvetydig: ${p.tvetydig} — lagret nollas tills raden är rättad`,
        });
        continue;
      }
      const skrevLager = p.nyttSaldo !== null;
      if (skrevLager && lagerOk.get(p.m.wixProductId) !== true) continue;

      try {
        if (skrevLager) {
          summary.lagerUppdaterade++;
          if (p.driftRattas) {
            summary.lagerDriftRattade++;
            summary.lagerDriftProdukter.push(p.m.wixProductId);
          }
        }

        let skrevPris = false;
        /** Sammanslagen sida: de varianter vars pris faktiskt skrevs. */
        const prisSkrivna: VariantPlan[] = [];
        if (p.varianter) {
          // ☠️ EN VARIANT I TAGET, och ett fel fäller bara den varianten. Gick
          // den första färgens pris igenom ska det stämplas även om den andras
          // föll — annars jämför nästa körning mot butiken, ser rätt pris och
          // lämnar mappningens tal gammalt för alltid.
          for (const v of p.varianter) {
            if (v.nyttPris === null || v.nyLandad === null) continue;
            try {
              if (!dryRun) {
                await deps.setPrice(
                  p.m.wixProductId,
                  { wixVariantId: v.wixVariantId, sku: v.sku },
                  v.nyttPris,
                  v.nyLandad,
                );
              }
              summary.prisUppdaterade++;
              prisSkrivna.push(v);
              skrevPris = true;
            } catch (err) {
              summary.misslyckade++;
              summary.errors.push({
                sku: v.artikel,
                wixProductId: p.m.wixProductId,
                error: err instanceof Error ? err.message : String(err),
              });
            }
          }
        } else if (p.nyttPris !== null && p.nyLandad !== null && p.variant) {
          if (!dryRun) {
            await deps.setPrice(
              p.m.wixProductId,
              { wixVariantId: p.variant.wixVariantId, sku: p.variant.sku },
              p.nyttPris,
              p.nyLandad,
            );
          }
          summary.prisUppdaterade++;
          skrevPris = true;
        }

        if (skrevPris) prisSkrivet.add(p.m.wixProductId);
        if (!skrevLager && !skrevPris) {
          summary.oforandrade++;
          continue;
        }
        skrivna++;
        if (!dryRun) attStampla.push({ p, skrivet: { lager: skrevLager, pris: skrevPris, prisSkrivna } });
      } catch (err) {
        summary.misslyckade++;
        summary.errors.push({
          sku: p.sku,
          wixProductId: p.m.wixProductId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // ── FAS 5: MAPPNINGEN SIST, FÖR HELA TUGGAN ──────────────────────────
    // Wix skrivs FÖRE mappningen, samma ordning och samma skäl som
    // price-repair: går bara den ena igenom står kunden inför rätt pris medan
    // bokföringen är gammal, och nästa körning rättar det. Omvänd ordning hade
    // gjort mappningen "synkad" medan kunden köper till fel pris — och då
    // hittar ingen felet igen. Bara produkter vars Wix-skrivning gick igenom
    // står i `attStampla`. Torrläget stämplar ingenting och läser inte om.
    //
    // ☠️ `aosomSyncedQty` stämplas BARA när saldot faktiskt skrevs. Skrevs
    // bara priset behåller fältet sitt gamla värde, så nästa körning
    // fortfarande ser att saldot vill skrivas.
    //
    // ☠️ OCH RADERNA LÄSES OM FÖRST, en gång för tuggan. Stämpeln läggs på
    // raden som den står nu, inte på ögonblicksbilden från körningens start —
    // se `stampelPaFarskRad` och `stamplaTuggan`. Har raden ändrats så att
    // stämpeln inte går att lägga säkert väntar den till nästa körning, och
    // det syns.
    if (attStampla.length > 0) await stamplaTuggan(attStampla, deps, summary, now());

    // ── RESTOCK-MEJLEN ───────────────────────────────────────────────────
    // Efter prisdelen, så att mejlet läser butikens namn, bild och pris när
    // tuggan är klar. Bara skarpt, och bara för produkter någon bevakar.
    //
    // ☠️ DEN HÄR KÖRNINGEN ÄR ENDA CHANSEN. Övergången syns bara en gång: nästa
    // körning ser ett saldo över noll och inget att mejla om. Därför räknas
    // varje bevakare som inte fick sitt mejl (`restockEjSkickade`).
    if (!dryRun && aterITuggan.length > 0 && deps.bevakadeProdukter && deps.mejlaBevakare) {
      if (bevakade === null && summary.restockFel === null) {
        try {
          bevakade = await deps.bevakadeProdukter();
        } catch (err) {
          summary.restockFel = err instanceof Error ? err.message.slice(0, 200) : String(err);
        }
      }
      for (const { pid, varianter } of aterITuggan) {
        if (!bevakade?.has(pid)) continue;
        try {
          // Ett pris som skrevs nyss visas inte: Wix läsning släpar efter en
          // skrivning, och mejlet får inte säga ett annat pris än sidan.
          const utskick = await deps.mejlaBevakare(pid, { visaPris: !prisSkrivet.has(pid), varianter });
          summary.restockMejl += utskick.skickade;
          summary.restockEjSkickade += utskick.ejSkickade;
          summary.restockUtskick.push({ wixProductId: pid, ...utskick });
        } catch (err) {
          // Bevakarna gick inte att läsa för produkten. Hur många de är vet vi
          // inte, så felet står i `restockFel` i stället för i räknaren.
          const fel = err instanceof Error ? err.message.slice(0, 200) : String(err);
          summary.restockFel = summary.restockFel ?? `${pid}: ${fel}`;
        }
      }
    }
  }

  if (variantPrisFel) {
    summary.prislistaFel = summary.prislistaFel ? `${summary.prislistaFel}; ${variantPrisFel}` : variantPrisFel;
  }
  if (summary.kvar <= 0) summary.cursor = null;
  return summary;
}

/**
 * Paus mellan två Wix-SKRIVNINGAR i skarpt läge.
 *
 * ☠️ UPPMÄTT, INTE GISSAT (2026-09-02). Ett skarpt svep försökte 2 095
 * lagerskrivningar i rad och fick 1 190 stycken **429 med en HTML-kropp** —
 * Wix EDGE-spärr, inte API-nivåns JSON-fel. Skalan:
 *
 *   |  försökta skrivningar | fel  |
 *   |----------------------:|-----:|
 *   |                    40 |    0 |
 *   |                 1 150 |  521 |
 *   |                 2 095 | 1190 |
 *
 * Återförsök räcker inte mot den spärren — huset har redan mätt att den inte
 * går att vänta ut inom ruttens 300 sekunder (media-städningen, 2026-08-28).
 * Det som håller den borta är att inte springa. Samma medicin som
 * `MEDIA_UPLOAD_DELAY_MS` och `FREIGHT_CALL_DELAY_MS`, av samma skäl.
 *
 * Ligger i `liveDeps`, inte i loopen: pacing hör till den skarpa skrivvägen,
 * och testerna injicerar sina egna deps och ska inte bli långsamma av den.
 */
export function aosomSkrivPausMs(): number {
  const n = Number(process.env.AOSOM_WRITE_DELAY_MS);
  return Number.isFinite(n) && n >= 0 ? n : 120;
}

/**
 * Motorns beroenden mot skarpa systemet, utom källan och mappningarna: Wix
 * lager och priser, stämplarna, ordrarna, auktionerna och restock-mejlen.
 * Delas av Aosom-synken och VEVOR-synken (lib/vevor/synk.ts), så att de två
 * skriver till butiken på exakt samma sätt.
 */
export async function gemensammaSynkDeps(): Promise<Omit<SynkDeps, "listMappningar">> {
  const [{ getStore }, { getPricingRules }, wix, v3] = await Promise.all([
    import("../store/factory"),
    import("../store/pricing-config"),
    import("../wix/client"),
    import("../wix/v3-products"),
  ]);
  const rules = await getPricingRules();
  const store = getStore();

  const pausMs = aosomSkrivPausMs();
  const pausa = () => (pausMs > 0 ? new Promise((r) => setTimeout(r, pausMs)) : Promise.resolve());

  return {
    listWixPriser: () => v3.listV3ProductPrices(),
    lasLagerposter: (ids) => wix.queryInventoryItemsByProductIds(ids),
    // Ett GET per färgsammanslagen sida, en i taget, och bara för tuggans
    // sidor (`lasVariantPriserFor`). De var ~360 den 2026-10-13 — lästa alla
    // på en gång åt de hela tidsbudgeten. Ett fel ska fälla prisdelen synligt
    // (`prislistaFel`), inte gissas förbi.
    lasVariantPriser: async (ids) => {
      const ut = new Map<string, Map<string, number>>();
      for (const id of ids) ut.set(id, await v3.getV3VariantPriser(id));
      return ut;
    },
    // Pacingen ligger kvar trots att anropen är ~40 i stället för ~2 000.
    // Den kostar fem sekunder på ett helt svep och är den enda kuren mot en
    // strypning som utlöses av tempo — se `aosomSkrivPausMs`.
    skrivLager: async (updates) => {
      await pausa();
      return wix.bulkUpdateInventoryQuantitiesPerRad(updates);
    },
    // updateV3VariantPrices skickar tillbaka `visible` oförändrad — utan det
    // publicerar en variantsInfo-PATCH utkastet (uppmätt 2026-08-28).
    setPrice: async (wixProductId, variant, grossSek, landedCostSek) => {
      await pausa();
      // ☠️ SVARET MÅSTE LÄSAS. updateV3VariantPrices returnerar {updated, missing}
      // och KASTAR INTE när ingen variant matchade — den hoppar över PATCH:en och
      // returnerar tyst. Det gamla anropet slängde returvärdet, så synken räknade
      // upp `prisUppdaterade` och skrev mappningen med det nya priset medan Wix
      // behöll det gamla. Uppmätt 2026-08-29 på bäddsoffan `efaa0c7b`: mappningen
      // sa 3 529 kr, kunden såg 4 539 kr, och produkten stod kvar på revision 1.
      //
      // Sjunde gången samma lärdom i det här repot: ett svar utan fel är inget
      // kvitto. Räkna efter.
      const resultat = await v3.updateV3VariantPrices(wixProductId, [
        {
          ...(variant.wixVariantId ? { wixVariantId: variant.wixVariantId } : {}),
          ...(variant.sku ? { sku: variant.sku } : {}),
          actualPrice: grossSek,
          costAmount: Math.round(landedCostSek),
        },
      ]);
      if (resultat.updated === 0) {
        throw new Error(
          `prisskrivningen matchade ingen variant på ${wixProductId} `
          + `(sökte ${resultat.missing.join(", ") || "utan nyckel"}) — priset i Wix är oförändrat`,
        );
      }
    },
    sparaMappningar: (rader) => store.saveMappings(rader),
    lasMappningar: (wixProductIds) => store.getMappingsByWixProductIds(wixProductIds),
    // Väntande och beställda tasks, även AliExpress-ordrarnas: de matchar
    // ingen Aosom-sida och gör därför ingenting. Urvalet (`vantarPaFlodet`)
    // görs i körningen. Två små frågor per tugga, för bara pågående ordrar
    // har de här två statusarna.
    lasSaldaOrderrader: async () => {
      const [vantande, bestallda] = await Promise.all([
        store.listTasks("pending"),
        store.listTasks("ordered"),
      ]);
      return [...vantande, ...bestallda];
    },
    // Fem rader i normalfallet: dagens fynd, eller morgondagens när de
    // främjats. Samma lager som tick-cronen läser (lib/auction/store.ts).
    lasAuktionsprodukter: async () => {
      const { queryAuctions } = await import("../auction/store");
      return new Set((await queryAuctions(["live"])).map((a) => a.productId));
    },
    bevakadeProdukter: async () => {
      const { getRestockStore } = await import("../restock/store");
      return getRestockStore().listPendingProductIds();
    },
    mejlaBevakare: async (wixProductId, opts) => {
      const { mejlaBevakare } = await import("../restock/notify");
      return mejlaBevakare(wixProductId, opts);
    },
    fx: { usdToSek: rules.usdToSek },
    rules,
  };
}

/** Standard-deps mot skarpa systemet. Bryts ut så testerna slipper mocka moduler. */
export async function liveDeps(): Promise<AosomSyncDeps> {
  const [gemensamma, { getStore }, { eurToSekFromEnv }] = await Promise.all([
    gemensammaSynkDeps(),
    import("../store/factory"),
    import("../config"),
  ]);
  const store = getStore();
  return {
    ...gemensamma,
    fetchFeed: () => fetchAosomFeed(),
    // ☠️ BARA RADERNA MED AOSOMS PREFIX, INTE HELA KATALOGEN (steg 5,
    // 2026-10-29). Den gamla vägen läste alla mappningar och filtrerade här.
    // Uppmätt samma dag: 4 827 av 7 398 rader bar prefixet, och efter
    // VEVOR-importen blir katalogen runt 22 000 rader. Varje schemalagd
    // körning hade läst dem alla innan den granskat en enda produkt.
    listAosom: () => store.listMappingsMedPrefix(AOSOM_PROFIL.prefix),
    fx: { eurToSek: eurToSekFromEnv(), usdToSek: gemensamma.fx.usdToSek },
  };
}
