// Städar bort föräldralösa Aosom-bilder ur Wix Media Manager.
//
// ☠️ VARFÖR LAGRINGEN TOG SLUT (2026-08-28)
//
// `image-repair.ts` laddar upp ALLA fem bilderna på nytt för varje produkt den
// lagar och ersätter produktens medialista. De gamla filerna blir kvar i Media
// Manager, och ingenting städar dem. Kommentaren i den filen säger att det
// "kostar några hundra extra uppladdningar totalt" — den skrevs när katalogen
// var 744 produkter och en enda reparationskörning var planerad.
//
// Verkligheten blev fyra körningar mot en katalog som växte till 2 712 produkter.
// Varje lagad produkt lämnade fem filer à drygt en megabyte efter sig, och
// lagringen tog slut mitt under den fjärde körningen.
//
// ☠️ OCH VARFÖR DET ÄR DUBBELT SÅ MYCKET SOM DET BORDE
//
// Uppmätt 2026-08-28: **591 av 595 granskade wixstatic-filer var KOPIOR av
// bilder vi själva laddat upp.** V3:s dokumentation säger att `url` i ett
// media-item betyder "an external media URL" — och vi skickade wixstatic-
// adresser, alltså bilder som redan låg i Media Manager. Wix importerade om
// varenda en till en ny fil. Varje produktbild fanns därför i två exemplar.
//
// Det är lagat i lib/wix/client.ts (skicka `id`, inte `url`), men de befintliga
// kopiorna ligger kvar och måste städas bort här.
//
// VAD "FÖRÄLDRALÖS" BETYDER HÄR
//
// En fil som (a) VÅR kod skapat och (b) inte sitter på någon produkt.
//
// Punkt (a) är den svåra, för `addedBy` är identiskt för allt: vår API-nyckel
// agerar som sajtägaren, så en bild Leonard dragit in i editorn ser likadan ut
// som en vi importerat. Det som SKILJER dem är `sourceUrl`:
//
//   • En importerad fil bär adressen den hämtades från. Våra kommer från
//     leverantörernas CDN — `img.aosomcdn.com`, `alicdn.com`,
//     `aliexpress-media.com`.
//   • Wix egna kopior bär en `static.wixstatic.com`-adress som pekar tillbaka på
//     en av VÅRA filer. Två hopp, men entydigt.
//   • En bild som laddats upp för hand i editorn har INGEN sourceUrl alls, och
//     kan därför aldrig komma i fråga. Det är skyddet för logotyper, banners och
//     allt annat som hör till sajtens design — sådant syns inte i något API vi
//     kan lista, så det måste undantas på egenskap, inte på uppräkning.
//
// Referenslistan byggs ur ALLA produkter, inte bara Aosom-produkterna.
//
// ☠️ SPÄRREN SOM INTE FÅR TAS BORT
//
// Om produktlistningen halvfallerar ser VARENDA fil föräldralös ut, och en
// körning skulle radera hela butikens bildbank permanent. Därför kastar
// `planeraStadning` när referenslistan är misstänkt liten i förhållande till
// antalet produkter. Samma tanke som `MIN_FEED_RADER` i sync.ts: när en körning
// kan röra allt på en gång är massfelet det enda som är värt att skydda mot.

import { mediaNyckel, produktensMedianycklar, type ProduktMedia } from "../wix/produkt-media";
import { raderbartId, wixMediaIdn } from "../wix/media-idn";
import { KARENS_DYGN, KARENS_MS, type KarensLager } from "../store/bildstadning-karens";

const MIN_BILDER_PER_PRODUKT = 0.5;

export interface MediaFil {
  id: string;
  displayName: string;
  url: string;
  sizeInBytes: number;
  /** Adressen filen importerades från. Saknas = uppladdad för hand. */
  sourceUrl?: string;
  /** ISO-tid. Läget "allt" rör inga filer som skapats eller ändrats nyligen. */
  createdDate?: string;
  updatedDate?: string;
}

/** Leverantörernas CDN. En fil därifrån är alltid vår import. */
const VARA_KALLHOSTAR = ["img.aosomcdn.com", "alicdn.com", "aliexpress-media.com"];

function host(url: string): string {
  try { return new URL(url).hostname; } catch { return ""; }
}

/**
 * Är filen skapad av VÅR kod?
 *
 * @param franOss Nycklarna för filer vi redan vet är våra — används för att
 *                känna igen Wix egna kopior, som pekar tillbaka på dem.
 */
export function arVarFil(f: MediaFil, franOss: ReadonlySet<string>): boolean {
  const src = f.sourceUrl ?? "";
  // Ingen källadress = handuppladdad. Rör aldrig.
  if (!src) return false;
  const h = host(src);
  if (VARA_KALLHOSTAR.some((k) => h === k || h.endsWith(`.${k}`))) return true;
  if (h === "static.wixstatic.com") {
    // Wix omimport, känd på att den pekar på en fil vi äger.
    if (franOss.has(mediaNyckel(src))) return true;
    // ☠️ ELLER på sin EGEN signatur — och den regeln är inte valfri.
    //
    // Kedjan ovan kräver att ORIGINALET finns i samma fönster. Raderas
    // originalet först blir kopian oigenkännlig för alltid och kan aldrig
    // städas bort. Uppmätt 2026-08-28 efter ett skarpt provvarv på 200 filer:
    // originalet var borta och kopian låg kvar med en sourceUrl som pekade
    // rakt ut i tomma intet. Med 36 083 filer att radera hade det strandat
    // dem i tusental.
    //
    // Signaturen finns i filen själv. En omimport döps efter ADRESSEN den
    // hämtades från, så filnamnet i sourceUrl ÄR displayName:
    //
    //   displayName  b379ce_ee39b9fc…~mv2.jpg
    //   sourceUrl    …/media/b379ce_ee39b9fc…~mv2.jpg
    //
    // Våra egna uppladdningar ser inte ut så: de får ett namn vi själva satt
    // ("aosom-84H-237V01CG-1.jpg") och en sourceUrl hos leverantörens CDN.
    // Och en handuppladdad bild saknar sourceUrl helt och når aldrig hit.
    //
    // ☠️ OCH KÄLLAN MÅSTE VARA VÅR EGEN (granskningen 2026-10-14). Signaturen
    // ensam känner också igen en bild som hämtats in från ETT ANNAT bibliotek
    // med samma namn: Wix egna gratisbilder (11062b_…) eller mallens bilder
    // (22e53e_…, All Products-kategorins bild). Sådana kan sitta på Wix egna
    // sidor, där ingen läsare ser dem. Prefixet före understrecket är
    // bibliotekets ägare, och en kopia av en av våra filer har samma som filen.
    const kalla = mediaNyckel(src);
    return kalla === f.displayName && agare(kalla) !== "" && agare(kalla) === agare(f.id);
  }
  return false;
}

/** Bibliotekets ägare: prefixet före understrecket i ett Wix-media-id. */
function agare(id: string): string {
  const m = /^([0-9a-f]{6})_/i.exec(id);
  return m ? m[1].toLowerCase() : "";
}

/**
 * Vilka filer en körning får radera.
 *
 * - `aosom` (nattens läge, och default): filer `arVarFil` känner igen, alltså
 *   leverantörsimporter och Wix kopior av dem. Inga andra.
 * - `allt` (Leonard 2026-10-14: "alla bilder som inte används till något"):
 *   dessutom poleringens utsnitt och kort, men bara filer som varken skapats
 *   eller ändrats på `minAlderMs`, se `PlanTillagg`.
 *
 * Inget läge raderar en fil utan källadress eller med en okänd källa, se
 * `Filklass`.
 */
export type Omfang = "aosom" | "allt";

/**
 * Vem skapade filen? Avgörs på källadressen, som i `arVarFil`.
 *
 * Bara de fyra första får raderas, och bara i läget `allt` (de två första
 * också i `aosom`). Resten räknas och syns i svaret men rörs aldrig:
 *
 * - `ingen-kalla`: uppladdad för hand eller som byte. Logotypen
 *   (b379ce_0b3a…, kontrollerad 2026-10-14), delningsbilden och kundernas
 *   recensionsbilder ligger här. Wix har inget API som svarar på var en fil
 *   används, så en sådan fil kan inte bevisas oanvänd.
 * - `wix-annan` och `annan-kalla`: importerade från en adress som varken är
 *   vår eller en känd kopia. Samma skäl.
 */
export type Filklass =
  | "leverantor"
  | "wix-kopia"
  | "wix-utsnitt"
  | "github"
  | "wix-annan"
  | "annan-kalla"
  | "ingen-kalla";

const RADERBARA_I_ALLT: ReadonlySet<Filklass> = new Set<Filklass>(["leverantor", "wix-kopia", "wix-utsnitt", "github"]);

export function klassaFil(f: MediaFil, franOss: ReadonlySet<string>): Filklass {
  const src = f.sourceUrl ?? "";
  if (!src) return "ingen-kalla";
  let u: URL;
  try { u = new URL(src); } catch { return "annan-kalla"; }
  const h = u.hostname;
  if (VARA_KALLHOSTAR.some((k) => h === k || h.endsWith(`.${k}`))) return "leverantor";
  if (h === "static.wixstatic.com") {
    if (arVarFil(f, franOss)) return "wix-kopia";
    // Poleringens utsnitt laddas upp ur Wix egen crop-adress
    // (docs/polish/bildmetoder.md, *Beskärning*). Bara crop: butiken visar
    // sina bilder som fill- och fit-adresser, och en fil som någon hämtat in
    // från en sådan är inte bevisat vår.
    // Och källan måste vara vår egen, som för kopiorna: ett utsnitt ur Wix
    // gratisbilder eller mallens bilder är inte poleringens.
    if (/\/v1\/crop\//.test(u.pathname)) {
      const kallId = u.pathname.split("/")[2] ?? "";
      if (agare(kallId) !== "" && agare(kallId) === agare(f.id)) return "wix-utsnitt";
    }
    return "wix-annan";
  }
  // Poleringens kort: Wix hämtar dem ur grenen innan de sätts på produkten.
  // Bara vårt eget repo; en annan GitHub-källa är okänd.
  if (h === "raw.githubusercontent.com" && /^\/leonardaraz\/fyndplats-cache-warmer\//i.test(u.pathname)) {
    return "github";
  }
  return "annan-kalla";
}

export interface KlassSiffror {
  filer: number;
  /** Refererade av någon läsare. */
  anvanda: number;
  /** Inte refererade, oavsett om de får raderas. */
  oanvanda: number;
  /** Inte refererade och tillåtna att radera i den här körningen. */
  raderbara: number;
  bytesOanvanda: number;
  bytesRaderbara: number;
}

export interface PlanTillagg {
  /** Butikens egna hänvisningar: blogg, kod, reservkatalog, variantbilder. */
  butiksbilder?: ReadonlyArray<string>;
  /** Ordrarnas varubilder, som kunden ser i sina mejl och sin order. */
  orderbilder?: ReadonlyArray<string>;
  /** Varje variants egen bild: den varukorgen, kassan och ordern visar. */
  variantbilder?: ReadonlyArray<string>;
  omfang?: Omfang;
  /**
   * Läget `allt`: rör bara filer som varken skapats eller ändrats på så här
   * länge. Andra sessioner laddar upp kandidater, utsnitt och kort som sätts på
   * produkten först efter granskning; uppmätt 2026-10-14 kom tre sådana
   * uppladdningar medan den här mätningen pågick.
   */
  minAlderMs?: number;
  nu?: number;
}

export interface StadningsPlan {
  /** Filer som är trygga att radera. */
  attRadera: MediaFil[];
  /** Våra filer som sitter på en produkt. */
  anvanda: number;
  /** Byte som frigörs. */
  bytes: number;
  /** Filer listningen såg i det här fönstret (alla namn). */
  filerIFonstret: number;
  omfang: Omfang;
  /** Alla filer i fönstret, per klass. */
  perKlass: Record<Filklass, KlassSiffror>;
  /** Oanvända filer i en raderbar klass som får ligga kvar för att de är nya. */
  forUnga: number;
  /** Oanvända filer i en raderbar klass vars id inte har den vanliga formen. */
  ovanligtId: number;
  /**
   * Används filen med den här karensnyckeln av någon läsare? Gäller vilken fil
   * som helst, inte bara fönstrets: karenstiden glömmer varje antecknad fil som
   * används, var i biblioteket den än ligger.
   */
  anvands: (nyckel: string) => boolean;
}

function tommaKlasser(): Record<Filklass, KlassSiffror> {
  const ut = {} as Record<Filklass, KlassSiffror>;
  for (const k of ["leverantor", "wix-kopia", "wix-utsnitt", "github", "wix-annan", "annan-kalla", "ingen-kalla"] as Filklass[]) {
    ut[k] = { filer: 0, anvanda: 0, oanvanda: 0, raderbara: 0, bytesOanvanda: 0, bytesRaderbara: 0 };
  }
  return ut;
}

/** Tidpunkten filen senast rördes, eller NaN när den inte går att avgöra. */
function senastRord(f: MediaFil): number {
  const t = [f.createdDate, f.updatedDate].map((d) => Date.parse(d ?? ""));
  return t.some((x) => Number.isNaN(x)) ? Number.NaN : Math.max(...t);
}

/** Jämförelsenyckel: filens id-del, gemener. */
function jamfor(s: string): string {
  return mediaNyckel(s).toLowerCase();
}

/**
 * Filens nyckel i karenstabellen: samma nyckel som jämförelsen med läsarna
 * använder (adressens id-del, gemener), så att "används den?" och "när sågs
 * den oanvänd?" alltid frågar om samma sak.
 */
export function karensNyckel(f: Pick<MediaFil, "id" | "url">): string {
  return jamfor(f.url) || jamfor(f.id);
}

// `mediaNyckel` bor i lib/wix/produkt-media.ts tillsammans med definitionen av
// vilka filer en produkt använder. Exporteras vidare härifrån för befintliga
// importer.
export { mediaNyckel };

/**
 * Bygger raderingsplanen.
 *
 * @param filer     Alla filer i Media Manager.
 * @param ianvandning Alla media-URL:er som sitter på en produkt just nu.
 * @param antalProdukter Antal produkter listningen såg — bara för spärren.
 * @param recensionsbilder Alla media-URL:er som sitter på en RECENSION. Lika
 *        mycket i bruk som produktbilderna, men osynliga i produktlistningen.
 */
export function planeraStadning(
  filer: ReadonlyArray<MediaFil>,
  ianvandning: ReadonlyArray<string>,
  antalProdukter: number,
  recensionsbilder: ReadonlyArray<string> = [],
  kategoribilder: ReadonlyArray<string> = [],
  fargbilder: ReadonlyArray<string> = [],
  tillagg: PlanTillagg = {},
): StadningsPlan {
  const omfang = tillagg.omfang ?? "aosom";
  const nu = tillagg.nu ?? Date.now();
  const minAlderMs = tillagg.minAlderMs ?? 0;
  // ☠️ MASSFEL-SPÄRREN. En halvläst produktlistning gör varje fil föräldralös.
  // Butikens produkter har mätbart flera bilder styck, så en referenslista som
  // är mindre än en halv bild per produkt är ett läsfel — inte en tom katalog.
  if (antalProdukter > 0 && ianvandning.length < antalProdukter * MIN_BILDER_PER_PRODUKT) {
    throw new Error(
      `Referenslistan har bara ${ianvandning.length} bilder för ${antalProdukter} produkter. `
        + `Det är ett läsfel, inte en tom katalog — ingen fil raderas.`,
    );
  }

  // ☠️ RECENSIONSBILDERNA HÖR TILL REFERENSLISTAN. De sitter inte på någon
  // produkt — de sitter på en recensionsrad — men de är lika mycket i bruk.
  // Se `listaRecensionsbilder` i deps för vad det kostade att glömma dem.
  //
  // ☠️ OCH KATEGORIBILDERNA. En kategoribild som valts ur en produkts bilder är
  // SAMMA fil, och i menyn syns en raderad kategoribild direkt. Så länge
  // produkten finns skyddar dess galleri filen — men när produkten raderas
  // (lib/aosom/pensionerade.ts) är kategorin filens enda användare.
  //
  // ☠️ OCH FÄRGBILDSTABELLEN (lib/aosom/fargbilder.ts). Wix tar 50 bilder per
  // produkt (uppmätt 2026-10-21), och det som inte rymdes står bara i motorns tabell — ofta som
  // filer på en givare som ska raderas. Utan tabellen i listan tar städningen
  // dem natten efter att givaren raderats, och butiken visar döda bilder.
  //
  // ☠️ OCH BUTIKEN OCH ORDRARNA (2026-10-14). Bloggen visade 215 Wix-bilder,
  // 61 av dem Aosom-importer och 122 Wix-kopior; reservkatalogen och
  // variantbilderna pekade på drygt 3 000 till. Ingen av dem behöver sitta på
  // en produkt. Ordrarnas varubilder är bilden som den sålts med, och kunden
  // ser den i sina mejl efter att produkten fått nya bilder.
  //
  // Jämförelsen görs i gemener: butikens lista är gemener, och en fil vars
  // ändelse Wix skrivit med versaler ska inte se oanvänd ut för det.
  //
  // Varje referens ger också de id som står INNE i den. En omskalad adress
  // (…/media/<id>/v1/fill/w_640,h_640/file.jpg) slutar på "file.jpg", och
  // bara sista ledet hade då inte skyddat filen.
  //
  // ☠️ OCH VARIANTERNAS EGNA BILDER (granskningen 2026-10-14). Varukorgen,
  // Wix-kassan och ordern visar `variantsInfo.variants[].media`, som Wix
  // sätter när varianten skrivs och som kan peka på en fil som inte längre
  // står i galleriet (lib/wix/variant-media.ts). Produktsökningen bär inte
  // varianterna, så de läses för sig.
  const anvandaNycklar = new Set<string>();
  for (const ref of [
    ...ianvandning, ...recensionsbilder, ...kategoribilder, ...fargbilder,
    ...(tillagg.butiksbilder ?? []), ...(tillagg.orderbilder ?? []), ...(tillagg.variantbilder ?? []),
  ]) {
    anvandaNycklar.add(jamfor(ref));
    for (const id of wixMediaIdn(ref)) anvandaNycklar.add(id);
  }

  // Första passet: filer som kommer direkt från en leverantörs CDN. Andra passet
  // känner igen Wix kopior på att de pekar tillbaka på dem.
  const varaNycklar = new Set<string>();
  for (const f of filer) {
    if (arVarFil(f, varaNycklar)) varaNycklar.add(mediaNyckel(f.url));
  }
  for (const f of filer) {
    if (arVarFil(f, varaNycklar)) varaNycklar.add(mediaNyckel(f.url));
  }

  const attRadera: MediaFil[] = [];
  const perKlass = tommaKlasser();
  let anvanda = 0;
  let forUnga = 0;
  let ovanligtId = 0;

  for (const f of filer) {
    const klass = klassaFil(f, varaNycklar);
    const s = perKlass[klass];
    s.filer++;
    if (anvandaNycklar.has(jamfor(f.url)) || anvandaNycklar.has(jamfor(f.id))) {
      s.anvanda++;
      if (varaNycklar.has(mediaNyckel(f.url))) anvanda++;
      continue;
    }
    s.oanvanda++;
    s.bytesOanvanda += f.sizeInBytes || 0;

    let raderbar: boolean;
    if (omfang === "aosom") {
      // Bara filer vår kod skapat. En handuppladdad bild rörs aldrig.
      raderbar = varaNycklar.has(mediaNyckel(f.url));
    } else if (!RADERBARA_I_ALLT.has(klass)) {
      raderbar = false;
    } else if (!raderbartId(mediaNyckel(f.url))) {
      ovanligtId++;
      raderbar = false;
    } else {
      const rord = senastRord(f);
      raderbar = !Number.isNaN(rord) && nu - rord >= minAlderMs;
      if (!raderbar) forUnga++;
    }
    if (!raderbar) continue;
    s.raderbara++;
    s.bytesRaderbara += f.sizeInBytes || 0;
    attRadera.push(f);
  }

  return {
    attRadera,
    anvanda,
    bytes: attRadera.reduce((s, f) => s + (f.sizeInBytes || 0), 0),
    filerIFonstret: filer.length,
    omfang,
    perKlass,
    forUnga,
    ovanligtId,
    anvands: (nyckel: string) => anvandaNycklar.has(nyckel),
  };
}

/**
 * Paus mellan raderingsskopor.
 *
 * ☠️ UTAN DEN TRIPPAR RADERINGEN EDGE-SPÄRREN, och kostnaden är inte de
 * förlorade filerna utan TIDEN. Uppmätt 2026-08-28, femte passet:
 *
 *     varv 4: 1775 föräldralösa, 650 raderade, 200 fel [tidsbudget]
 *
 * Skoporna kördes rygg mot rygg, spärren slog till, och varje trasig skopa
 * väntade sedan 2 + 10 + 30 sekunder på återförsök som ändå inte gick igenom.
 * Fyra sådana skopor åt upp hela raderingsbudgeten — 650 filer i stället för
 * 1 200.
 *
 * Samma lärdom som listningen (250 ms) och `importMediaByUrl` (serie + paus):
 * en liten paus är billigare än ett återförsök. 200 ms × 24 skopor är fem
 * sekunder; fyra strypta skopor är fyrtiotvå.
 */
const PAUS_MELLAN_SKOPOR_MS = 200;

export interface MediaCleanupDeps {
  /**
   * Ett FÖNSTER av Media Manager, inte hela. `cursor` i svaret är null när allt
   * är genomgånget; `komplett: false` betyder att fönstret stannade på sidtaket
   * eller tidsgränsen och att planen görs på det som HANN läsas.
   */
  listaFiler: (opts: { efter?: string; stoppaVid?: number })
    => Promise<{ filer: MediaFil[]; cursor: string | null; komplett: boolean }>;
  /** Alla media-URL:er som sitter på en produkt, plus antalet produkter. */
  listaAnvanda: () => Promise<{ urls: string[]; antalProdukter: number }>;
  /**
   * Alla media-URL:er som sitter på en RECENSION.
   *
   * ☠️ UTAN DEN HÄR RADERAR STÄDNINGEN KUNDERNAS RECENSIONSBILDER. Det gjorde
   * den: uppmätt 2026-09-04 var 68 av 68 recensionsbilder över fyra produkter
   * döda (403). Mekanismen är att `listaAnvanda` bara går igenom
   * `stores/v3/products/search`, medan en recensionsbild refereras av en
   * RECENSIONSRAD — och eftersom vår kod importerade den från
   * aliexpress-media.com bär den en `sourceUrl` och passerar därmed
   * "vår kod skapade den"-filtret. Föräldralös enligt planen, permanent
   * raderad, varje natt.
   *
   * Samma klass som bloggomslagen samma dag, och samma lärdom som migreringen:
   * en referenslista är klar först när ALLA läsare finns med i den. En läsare
   * som bor i en annan tabell — eller ett annat repo — syns inte i koden här.
   */
  listaRecensionsbilder: () => Promise<string[]>;
  /**
   * Kategoriernas bilder (id eller URL). Obligatorisk av samma skäl som
   * recensionsbilderna: en valfri dep glöms av nästa anropare, och ett läsfel
   * FÄLLER körningen i stället för att tolkas som "inga kategoribilder".
   */
  listaKategoribilder: () => Promise<string[]>;
  /**
   * Varje fil-id i färgbildstabellen (lib/store/fargbilder.ts): färgernas
   * bilder utöver Wix tak, och de som väntar på granskning. Obligatorisk och
   * ett läsfel fäller körningen, av samma skäl som kategoribilderna.
   */
  listaFargbilder: () => Promise<string[]>;
  /**
   * Varje Wix-bild butiken själv pekar på: bloggen, adresserna i koden,
   * reservkatalogen och variantbilderna (butikens /api/media-referenser, se
   * lib/wix/butikens-media.ts). Obligatorisk, och ett läsfel eller en lista
   * under golvet fäller körningen.
   */
  listaButikensBilder: () => Promise<string[]>;
  /** Varje Wix-bild i en order (alla ordrar, alla statusar). Obligatorisk. */
  listaOrderbilder: () => Promise<string[]>;
  /**
   * Varje variants egen bild (Read-Only Variants API), även utkastens. Det är
   * den bilden varukorgen, kassan och ordern visar. Obligatorisk, och ett
   * läsfel eller en lista under golvet fäller körningen.
   */
  listaVariantbilder: () => Promise<string[]>;
  /**
   * Karenstiden (lib/store/bildstadning-karens.ts). Obligatorisk: utan den
   * hade en fil kunnat raderas samma natt som den togs bort ur ett galleri.
   */
  karens: KarensLager;
  /** Raderar PERMANENT — papperskorgen räknas fortfarande mot lagringen. */
  raderaPermanent: (fileIds: string[]) => Promise<void>;
  /** Injicerbar klocka för tidsbudgeten. */
  now?: () => number;
  /** Paus mellan raderingsskopor. Utelämnas i test så sviten går snabbt. */
  paus?: (ms: number) => Promise<void>;
}

/**
 * Tak för recensionsläsningen i städningen. Långt över katalogen; slår det i
 * är det ett fel, inte en katalog.
 */
export const RECENSION_TAK = 500_000;

/**
 * Varje bild-URL som sitter på en recension, ur HELA recensionslagret.
 *
 * ☠️ INGET TYST TAK. `listAll()` utan argument stannar vid MAX_LIST_ALL (5 000
 * rader), ett tak som finns för admin-sidornas rendering. Städningen använde
 * det: med fler än 5 000 recensioner föll de äldsta ur skyddslistan, och deras
 * importerade bilder såg föräldralösa ut och raderades permanent. Butiken
 * visar 6 582 recensioner (2026-09-28). Här läses allt, och ett svar som når
 * taket kastar — ett tak ska kasta, aldrig kapa (CLAUDE.md).
 */
export async function recensionsbildUrler(
  store: { listAll(limit?: number): Promise<Array<{ imageUrl?: string; imageUrls?: string[] }>> },
): Promise<string[]> {
  const alla = await store.listAll(RECENSION_TAK);
  if (alla.length >= RECENSION_TAK) {
    throw new Error(`Recensionslagret har minst ${RECENSION_TAK} rader: höj RECENSION_TAK.`);
  }
  const urls: string[] = [];
  for (const r of alla) {
    if (r.imageUrl) urls.push(r.imageUrl);
    for (const u of r.imageUrls ?? []) urls.push(u);
  }
  return urls;
}

export interface MediaCleanupSummary {
  dryRun: boolean;
  omfang: Omfang;
  /** Fönstrets filer per klass: hur många, hur många används, hur många får raderas. */
  perKlass: Record<Filklass, KlassSiffror>;
  /** Oanvända filer i en raderbar klass som ligger kvar för att de är nya (läget `allt`). */
  forUnga: number;
  /** Oanvända filer i en raderbar klass med ett ovanligt id (läget `allt`). */
  ovanligtId: number;
  /** Antal referenser per läsare. Ett tal som rasar mellan körningar är ett läsfel. */
  referenser: {
    produkter: number;
    antalProdukter: number;
    recensioner: number;
    kategorier: number;
    fargbilder: number;
    butiken: number;
    ordrar: number;
    varianter: number;
  };
  /** Filer i FÖNSTRET, inte i hela Media Manager — se `cursor`. */
  filerIFonstret: number;
  /** Våra filer i fönstret som sitter på en produkt. */
  anvandaEgnaFiler: number;
  /** Oanvända filer som får raderas i det här läget, med eller utan karens. */
  foraldralosa: number;
  /** Av dem: oanvända i minst `karensDygn`. Bara de raderas. */
  mogna: number;
  /** Av dem: oanvända kortare tid än så. Räknas och antecknas, rörs inte. */
  iKarens: number;
  karensDygn: number;
  raderade: number;
  frigjordMb: number;
  misslyckade: number;
  errors: string[];
  /**
   * Läste listningen HELA Media Manager? `false` = siffrorna beskriver bara den
   * del som hanns med, och `filerIFonstret` är alltså inte beståndet. Körningen är
   * ändå meningsfull: det som raderas är föräldralöst, och nästa körning når
   * längre eftersom listan blivit kortare.
   */
  komplettListning: boolean;
  /** Varför körningen slutade. `klart` = allt planerat blev gjort. */
  stoppedBy: "klart" | "tidsbudget" | "limit";
  /**
   * Markör att fortsätta från. `null` = hela Media Manager är genomgången.
   *
   * ☠️ VARFÖR LISTNINGEN ÄR FÖNSTRAD (2026-08-28)
   *
   * Wix edge-lager svarar 429 med en HTML-sida — inte ett API-fel — när ett och
   * samma anrop bläddrar för många sidor i rad. Backoff hjälper inte: spärren
   * släpper inte förrän långt efter att ruttens 300 sekunder är slut. 58 160
   * filer i ETT anrop är alltså inte möjligt, oavsett hur tålmodigt det görs.
   *
   * Därför tar varje körning en tugga och lämnar en markör, precis som svepet
   * och bildfixen. Samma mönster, samma skäl.
   *
   * ⚠️ MARKÖREN ÄR EN OFFSET, inte en nyckel. Uppmätt 2026-08-28: cursorn
   * `vsp.eyJvZmZzZXQiOjIsInRvdGFsIjo1ODE1OH0` avkodas till `{"offset":2,…}`.
   * Raderar en körning filer krymper alltså listan, och nästa fönster hoppar
   * över lika många som raderades. Ett SKARPT svep är därför inte komplett på
   * ett varv — men det konvergerar, för nästa svep börjar om från noll över en
   * kortare lista.
   *
   * Det gör mindre än det låter: listningen sorteras `updatedDate DESC` och
   * kopiorna skapades av bildfixen i går och i natt, så de ligger samlade i
   * BÖRJAN av listan — precis där fönstret börjar.
   */
  cursor: string | null;
}

/** Wix tar emot flera id:n per anrop; håll skoporna lagom stora. */
const BATCH = 50;

/** Läget `allt` rör aldrig filer yngre än så här, oavsett vad anroparen ber om. */
export const MIN_ALDER_ALLT_DAGAR = 7;
const DAG_MS = 86_400_000;

export type Lasare = keyof MediaCleanupSummary["referenser"];
export const LASARE: ReadonlyArray<Lasare> = [
  "produkter", "antalProdukter", "recensioner", "kategorier", "fargbilder", "butiken", "ordrar", "varianter",
];

export async function runMediaCleanup(
  deps: MediaCleanupDeps,
  opts: {
    dryRun?: boolean;
    limit?: number;
    timeBudgetMs?: number;
    after?: string;
    omfang?: Omfang;
    /** Läget `allt`: minst MIN_ALDER_ALLT_DAGAR. */
    minAlderDagar?: number;
    /**
     * Minsta antal referenser per läsare, normalt 95 % av torrkörningens.
     * Kontrolleras efter läsningen och FÖRE listningen och raderingen, så en
     * läsare som tyst ger färre svar stoppar körningen innan något raderas.
     */
    golv?: Partial<Record<Lasare, number>>;
  } = {},
): Promise<MediaCleanupSummary> {
  const omfang = opts.omfang ?? "aosom";
  const minAlderDagar = opts.minAlderDagar ?? (omfang === "allt" ? 14 : 0);
  // ☠️ Spärren ligger här och inte bara i rutten: en anropare som glömmer den
  // hade annars kunnat radera kandidater och kort som en annan session
  // laddade upp för en timme sedan.
  if (omfang === "allt" && !(minAlderDagar >= MIN_ALDER_ALLT_DAGAR)) {
    throw new Error(`Läget allt kräver minAlderDagar på minst ${MIN_ALDER_ALLT_DAGAR}, fick ${minAlderDagar}.`);
  }
  const dryRun = opts.dryRun !== false;
  const now = deps.now ?? (() => Date.now());
  const start = now();
  const budget = opts.timeBudgetMs ?? 240_000;

  // ☠️ LISTNINGARNA KÖRS EFTER VARANDRA, INTE MED Promise.all.
  //
  // De gick parallellt fram till 2026-08-28 och dubblade därmed anropstakten mot
  // samma Wix-värd. Wix svarade 429 efter ~30 sekunder, `post` kastade, och hela
  // rutten föll med 500 utan att radera en enda fil. Det ser ut som en
  // optimering och är i själva verket det som fäller körningen.
  //
  // Referenslistan först, med flit: den är massfel-spärrens underlag och måste
  // vara KOMPLETT, medan fillistningen tål att kapas på tidsbudgeten.
  // Listningen får en DEL av budgeten, inte hela: äter den allt finns ingen tid
  // kvar att radera på, och en körning som bara listar frigör noll byte.
  //
  // Referenslistan läses om för VARJE fönster. Den är ~37 sidor mot en annan
  // API-familj och alltså billig, och alternativet — att bära den mellan
  // körningar — hade betytt att en produkt som fått nya bilder sedan förra
  // varvet såg ut att sakna dem. Fel åt det hållet raderar bilder som används.
  const { urls, antalProdukter } = await deps.listaAnvanda();

  // ☠️ ETT LÄSFEL HÄR MÅSTE FÄLLA KÖRNINGEN, ALDRIG FORTSÄTTA.
  //
  // Fortsätter vi med en tom recensionslista ser varenda recensionsbild
  // föräldralös ut och raderas PERMANENT — exakt den skada fixen finns för att
  // stoppa. Samma form som MIN_FEED_RADER i Aosom-synken: när ett läsfel och
  // ett tomt svar ser likadana ut, och det ena utfallet är oåterkalleligt, är
  // avbrott enda säkra svaret.
  //
  // Att en katalog HAR noll recensionsbilder är däremot legitimt, så tomt
  // svar utan fel går igenom. Det är felet vi vägrar tolka, inte tomheten.
  let recensionsbilder: string[];
  try {
    recensionsbilder = await deps.listaRecensionsbilder();
  } catch (err) {
    throw new Error(
      `Recensionsbilderna gick inte att läsa (${err instanceof Error ? err.message : String(err)}). `
        + "Körningen avbryts — utan den listan hade varje recensionsbild sett föräldralös ut "
        + "och raderats permanent.",
    );
  }

  let kategoribilder: string[];
  try {
    kategoribilder = await deps.listaKategoribilder();
  } catch (err) {
    throw new Error(
      `Kategoribilderna gick inte att läsa (${err instanceof Error ? err.message : String(err)}). `
        + "Körningen avbryts — utan den listan kan en kategoribild se föräldralös ut "
        + "och raderas permanent.",
    );
  }

  let fargbilder: string[];
  try {
    fargbilder = await deps.listaFargbilder();
  } catch (err) {
    throw new Error(
      `Färgbildstabellen gick inte att läsa (${err instanceof Error ? err.message : String(err)}). `
        + "Körningen avbryts — utan den listan ser färgernas bilder utöver Wix tak föräldralösa ut "
        + "och raderas permanent.",
    );
  }

  // ☠️ Butikens lista och ordrarna, av samma skäl och med samma hållning:
  // ett läsfel fäller körningen. Utan butikens lista ser bloggens bilder
  // föräldralösa ut så fort ingen produkt bär dem längre.
  let butiksbilder: string[];
  try {
    butiksbilder = await deps.listaButikensBilder();
  } catch (err) {
    throw new Error(
      `Butikens bildlista gick inte att läsa (${err instanceof Error ? err.message : String(err)}). `
        + "Körningen avbryts — utan den ser bloggens, reservkatalogens och variantbildernas bilder "
        + "föräldralösa ut och raderas permanent.",
    );
  }

  let orderbilder: string[];
  try {
    orderbilder = await deps.listaOrderbilder();
  } catch (err) {
    throw new Error(
      `Ordrarnas bilder gick inte att läsa (${err instanceof Error ? err.message : String(err)}). `
        + "Körningen avbryts — utan dem kan bilden en vara såldes med raderas ur kundens orderbekräftelse.",
    );
  }

  let variantbilder: string[];
  try {
    variantbilder = await deps.listaVariantbilder();
  } catch (err) {
    throw new Error(
      `Varianternas bilder gick inte att läsa (${err instanceof Error ? err.message : String(err)}). `
        + "Körningen avbryts — utan dem kan bilden i varukorgen, kassan och ordern raderas.",
    );
  }

  const referenser: MediaCleanupSummary["referenser"] = {
    produkter: urls.length,
    antalProdukter,
    recensioner: recensionsbilder.length,
    kategorier: kategoribilder.length,
    fargbilder: fargbilder.length,
    butiken: butiksbilder.length,
    ordrar: orderbilder.length,
    varianter: variantbilder.length,
  };

  // ☠️ GOLVEN KONTROLLERAS HÄR, FÖRE LISTNINGEN OCH RADERINGEN. En kontroll i
  // workflowen efter anropet hade kommit först när fönstret redan var raderat.
  for (const [lasare, golv] of Object.entries(opts.golv ?? {}) as [Lasare, number][]) {
    if (referenser[lasare] < golv) {
      throw new Error(
        `Läsaren ${lasare} gav ${referenser[lasare]} referenser, under golvet ${golv}. `
          + "Körningen avbryts innan något raderas.",
      );
    }
  }

  const { filer, cursor, komplett } = await deps.listaFiler({
    efter: opts.after,
    stoppaVid: start + Math.round(budget * 0.7),
  });

  // Läsarna kan äta upp listningens tidsbudget. Då kommer inga filer och
  // samma markör tillbaka, och utan den här spärren hade ett första fönster
  // sett ut som ett genomgånget bibliotek utan något att radera.
  if (!komplett && filer.length === 0 && cursor === (opts.after ?? null)) {
    throw new Error("Listningen hann inte börja innan tidsbudgeten tog slut. Ingen fil granskades.");
  }

  const plan = planeraStadning(filer, urls, antalProdukter, recensionsbilder, kategoribilder, fargbilder, {
    butiksbilder,
    orderbilder,
    variantbilder,
    omfang,
    minAlderMs: minAlderDagar * DAG_MS,
    nu: now(),
  });

  // ☠️ KARENSTIDEN (granskningen 2026-10-14). Varje oanvänd fil antecknas med
  // när den FÖRST sågs oanvänd, och bara de som varit oanvända i KARENS_DYGN
  // raderas. Antecknas gör även torrkörningen: den raderar ingenting i Wix,
  // men den för bok över vad den såg. En fil som används igen glöms.
  //
  // Bokföringen görs FÖRE raderingen. Faller den avbryts körningen, och
  // ingenting raderas utan en känd tid.
  //
  // ☠️ HELA TABELLEN jämförs med läsarna, inte bara fönstrets filer. En gammal
  // fil ligger utanför nattens fönster och ses annars bara vid en full
  // genomgång; en fil som tagits i bruk och släppts igen däremellan hade då
  // behållit sin gamla tid och kunnat raderas dagen efter att den släpptes.
  // Läsarna läser hela katalogen varje körning, så varje natt glöms det som
  // används någonstans.
  const nuMs = now();
  const forstSedd = await deps.karens.registrera(plan.attRadera.map(karensNyckel), nuMs);
  await deps.karens.glom((await deps.karens.lasAlla()).filter((n) => plan.anvands(n)));
  const mogna = plan.attRadera.filter((f) => {
    const t = forstSedd.get(karensNyckel(f));
    return t !== undefined && Number.isFinite(t) && nuMs - t >= KARENS_MS;
  });
  const attRadera = opts.limit ? mogna.slice(0, opts.limit) : mogna;

  const summary: MediaCleanupSummary = {
    dryRun,
    omfang,
    perKlass: plan.perKlass,
    forUnga: plan.forUnga,
    ovanligtId: plan.ovanligtId,
    referenser,
    filerIFonstret: plan.filerIFonstret,
    anvandaEgnaFiler: plan.anvanda,
    foraldralosa: plan.attRadera.length,
    mogna: mogna.length,
    iKarens: plan.attRadera.length - mogna.length,
    karensDygn: KARENS_DYGN,
    raderade: 0,
    frigjordMb: 0,
    misslyckade: 0,
    errors: [],
    komplettListning: komplett,
    stoppedBy: opts.limit && mogna.length > opts.limit ? "limit" : "klart",
    cursor,
  };

  if (dryRun) {
    summary.frigjordMb = Math.round(mogna.reduce((s, f) => s + (f.sizeInBytes || 0), 0) / 1e6);
    return summary;
  }

  let frigjort = 0;
  const raderadeIdn: string[] = [];
  for (let i = 0; i < attRadera.length; i += BATCH) {
    // ☠️ Raderingen är också tidsbudgeterad. Utan det kan en stor `limit` dra
    // förbi ruttens maxDuration, och då dödas svaret mitt i: filerna ÄR
    // raderade men ingen siffra kommer tillbaka, så nästa körning vet inte
    // vad som hände. Hellre ett ärligt "tidsbudget" än ett tyst avbrott.
    if (now() - start >= budget) {
      summary.stoppedBy = "tidsbudget";
      break;
    }
    if (i > 0) await deps.paus?.(PAUS_MELLAN_SKOPOR_MS);
    const skopa = attRadera.slice(i, i + BATCH);
    try {
      await deps.raderaPermanent(skopa.map((f) => f.id));
      summary.raderade += skopa.length;
      frigjort += skopa.reduce((s, f) => s + (f.sizeInBytes || 0), 0);
      raderadeIdn.push(...skopa.map(karensNyckel));
    } catch (err) {
      summary.misslyckade += skopa.length;
      summary.errors.push(err instanceof Error ? err.message : String(err));
    }
  }
  summary.frigjordMb = Math.round(frigjort / 1e6);
  // Raderade filers rader är bara skräp i tabellen. Ett fel här ska inte
  // dölja att filerna ÄR raderade, så det blir en rad i errors, inte ett kast.
  try {
    await deps.karens.glom(raderadeIdn);
  } catch (err) {
    summary.errors.push(`karenstabellen: ${err instanceof Error ? err.message : String(err)}`);
  }
  return summary;
}

/**
 * Standard-deps mot skarpa systemet.
 *
 * Både listningarna sidbryts, och båda pausar mellan sidorna: Media Manager
 * svarar 429 vid ~50 sidor i rad (uppmätt 2026-08-28 under felsökningen av just
 * det här problemet). En städning som dör halvvägs är inte farlig, men den är
 * onödig.
 */
/**
 * ☠️ ETT 400 FRÅN EDGE-LAGRET ÄR INTE ETT 400 FRÅN API:T.
 *
 * Uppmätt 2026-08-28 under första skarpa rensningen: bulk-raderingen fick `400`
 * med en HTML-SIDA i kroppen på ungefär var femte skopa — 450 av 2 190 filer i
 * ett enda fönster gavs upp direkt, eftersom 4xx utom 429 inte återförsöktes.
 * Det var edge-strypningen, inte ett ogiltigt anrop.
 *
 * De går att skilja åt på KROPPEN, inte på statuskoden: ett äkta API-fel svarar
 * JSON (`INVALID_ARGUMENT: 'paging.limit' must be less than or equal to 100`),
 * edge-lagret svarar `<!DOCTYPE html>`. Ett HTML-svar är transient och ska
 * väntas ut; ett JSON-4xx blir aldrig bättre av att frågas igen — och att
 * återförsöka det hade bara gjort varje trasigt anrop fyra gånger långsammare.
 */
export function borAterforsoka(status: number, kropp: string): boolean {
  if (status === 429 || status >= 500) return true;
  if (status >= 400) return kropp.trimStart().startsWith("<");
  return false;
}

/**
 * Edge-lagrets felsida är 200 tecken HTML-boilerplate utan ett ord om vad som
 * gick fel. Loggas den rakt av per misslyckad skopa dränks per-fönster-raderna
 * fullständigt — första skarpa körningen gick inte att läsa av den anledningen.
 * Ett API-fel bär däremot verklig information och behålls ordagrant.
 */
export function sammanfattaFelkropp(kropp: string): string {
  const t = kropp.trim();
  if (t.startsWith("<")) return "(HTML-felsida från Wix edge-lager)";
  return t.slice(0, 200);
}

/**
 * Sidor per körning. 40 × 100 = 4 000 filer.
 *
 * Taket är satt av edge-spärren, inte av tiden: en körning dog efter ~150 sidor
 * i rad. Läsarna kostar ~80 anrop mot samma värd innan fillistningen ens börjar
 * (2026-10-14: ~64 produktsidor, räknaren, två kategorisidor, upp till ~20
 * variantsidor, ordrarna), så 40 håller hela körningen kring 125 anrop: samma
 * nivå som den torrkörning som gick igenom alla fönster 2026-10-14. Var 60 när
 * produktsökningen var ~37 sidor och varianterna inte lästes.
 */
const SIDOR_PER_FONSTER = 40;

/** Sidor om 100 ordrar. Butiken hade 90 ordrar 2026-10-14. */
const ORDER_SIDTAK = 100;

/**
 * Golv för läsare som kan svara tomt utan att kasta. Under dem är svaret ett
 * läsfel, inte en butik utan recensioner eller ordrar. Talen ligger långt
 * under det uppmätta (3 592 recensionsbilder 2026-10-06, 83 orderbilder
 * 2026-10-14), och de kan bara växa: recensioner döljs, de raderas inte.
 */
const MIN_RECENSIONSBILDER = 1_000;
const MIN_ORDERBILDER = 40;

/**
 * Golv för de andra läsarna (granskningen 2026-10-14). Ett tomt svar utan fel
 * hade annars gett golv 0 i workflowen och fått varje fil läsaren skyddar att
 * se oanvänd ut.
 *
 * - Kategorierna räknas på KATEGORIER, inte på bilder: bara All Products bar
 *   en bild den dagen, och att ta bort den bilden ska inte stoppa städningen.
 *   130 kategorier uppmätta.
 * - Färgbildstabellen bär varje färgvals bilder på över 500 sammanslagna sidor.
 * - Varianterna: minst en per produkt, ~6 300 produkter.
 */
const MIN_KATEGORIER = 50;
const MIN_FARGBILDER = 100;
const MIN_VARIANTBILDER = 1_000;

/** Varianter per sida i Read-Only Variants API (dokumenterat tak 1 000). */
const VARIANTER_PER_SIDA = 1_000;
const VARIANT_SIDTAK = 100;

/**
 * Produktsökningen får se högst så här många färre produkter än katalogens
 * räknare. Samma tal och skäl som KATALOG_TOLERANS i lib/aosom/pensionerade.ts:
 * en import kan skapa en produkt medan svepet pågår, fler saknade än så
 * betyder att svepet tappat sidor.
 */
const KATALOG_TOLERANS = 5;

/** Katalogens räknare under det här är ett läsfel (samma tal som MIN_KATALOG i pensionerade). */
const MIN_KATALOG_PRODUKTER = 500;

/**
 * Varianterna ska komma från minst så stor andel av katalogens produkter. En
 * enda sida (1 000 varianter) täcker långt färre, så en läsning som stannat
 * efter första sidan fäller. Hälften och inte nästan alla: utan behörighet för
 * dolda produkter lämnar API:t ute utkastens varianter (~40 % av katalogen
 * 2026-10-14), och golvet ska inte stoppa varje körning för det.
 */
const MIN_VARIANTPRODUKTER_ANDEL = 0.5;

/**
 * ☠️ ALLA LÄSARE OCH RADERINGEN MÅSTE GÄLLA SAMMA SAJT (granskningen
 * 2026-10-14). Filerna, produkterna, varianterna och kategorierna läses med
 * `WIX_SITE_ID`, ordrarna med butikens sajt (`HEADLESS_WIX_SITE_ID`). Pekar
 * de isär läser ordrarna en annan butik, och deras bilder ser oanvända ut.
 * Uppmätt lika 2026-09-28 (`sammaSajtSomBildstadningen`).
 */
export function kontrolleraSammaSajt(wixSiteId: string | undefined, butikensSajt: string): void {
  if (wixSiteId && wixSiteId !== butikensSajt) {
    throw new Error(
      "WIX_SITE_ID och butikens sajt (HEADLESS_WIX_SITE_ID) pekar på olika sajter. "
        + "Bildstädningen läser då ordrarna i en annan butik än filerna, och ingenting raderas.",
    );
  }
}

/**
 * ☠️ Ett produktsvep som inte blev klart, eller som såg färre produkter än
 * katalogens räknare, är ett läsfel. Halvbildsspärren i planeraStadning ser
 * inte ett svep som kapats jämnt (granskningen 2026-10-14).
 */
export function kontrolleraProduktsvep(sedda: number, klar: boolean, katalogensRaknare: number): void {
  if (!klar) throw new Error("Produktsvepet nådde sidtaket utan att bli klart.");
  // Ett svar utan antal blir 0 i countProducts, och 0 hade stängt av
  // jämförelsen nedan. Katalogen har tusentals produkter.
  if (!(katalogensRaknare >= MIN_KATALOG_PRODUKTER)) {
    throw new Error(`Katalogens räknare svarade ${katalogensRaknare}, golvet är ${MIN_KATALOG_PRODUKTER}.`);
  }
  if (sedda < katalogensRaknare - KATALOG_TOLERANS) {
    throw new Error(`Produktsvepet såg ${sedda} av ${katalogensRaknare} produkter — det har tappat sidor.`);
  }
}

export async function liveDeps(): Promise<MediaCleanupDeps> {
  const { headlessSiteId: butikensSajt, countProducts } = await import("../wix/media-audit");
  kontrolleraSammaSajt(process.env.WIX_SITE_ID, butikensSajt());
  // Katalogens räknare, en gång per anrop: produktsvepet och varianterna
  // stäms av mot samma tal.
  let raknare: Promise<number> | null = null;
  const katalogensRaknare = () => (raknare ??= countProducts(process.env.WIX_SITE_ID || butikensSajt()));
  const WIX_BASE = "https://www.wixapis.com";
  const paus = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const headers = (): Record<string, string> => {
    const token = process.env.WIX_API_TOKEN;
    if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
    const h: Record<string, string> = { Authorization: token, "Content-Type": "application/json" };
    const siteId = process.env.WIX_SITE_ID;
    if (siteId) h["wix-site-id"] = siteId;
    return h;
  };

  // ☠️ WIX SVARAR 429 EFTER ~40-50 SIDOR I RAD.
  //
  // Media Manager har 58 160 filer = 582 sidor. Utan återförsök är en hel
  // genomgång en kastning av tärning: bildstädningen 2026-08-28 föll efter 30
  // sekunder med 500, och eftersom workflowens felutskrift slukades av en
  // kommandosubstitution såg det ut som ett tomt misslyckande.
  //
  // Backoffen följer `Retry-After` när Wix skickar den. Samma mönster som
  // `importMediaByUrl` fick 2026-08-27, och av exakt samma skäl.
  // Edge-spärren är trögare än ett vanligt API-429 och behöver längre pauser.
  const paus_ms = [2_000, 10_000, 30_000];

  /**
   * ☠️ ÅTERFÖRSÖK ÄR RÄTT FÖR LISTNINGEN OCH FEL FÖR RADERINGEN.
   *
   * Skillnaden är vad ett fel KOSTAR. Faller listningen dör hela körningen och
   * ingenting blir gjort — då är det värt att vänta ut spärren. Faller en
   * raderingsskopa ligger 50 filer kvar till nästa körning, och körningen är
   * idempotent: nästa pass tar dem gratis.
   *
   * Uppmätt 2026-08-28, sjätte passet, med återförsök på BÅDA:
   *
   *     varv 4: 1136 föräldralösa, 150 raderade, 200 fel [tidsbudget]
   *
   * Tre skopor gick igenom. Fyra strypta skopor väntade 2 + 10 + 30 sekunder
   * var — 168 sekunder mot en raderingsbudget på 72 — och sprängde den, så
   * resten av skoporna hann aldrig ens försökas. Att ge upp direkt hade i
   * stället låtit dem alla få ett försök.
   */
  const post = async (url: string, body: unknown, aterforsok = true): Promise<Record<string, unknown>> => {
    let sist = "";
    for (let forsok = 0; forsok <= paus_ms.length; forsok++) {
      let res: Response;
      try {
        res = await fetch(url, { method: "POST", headers: headers(), body: JSON.stringify(body) });
      } catch (err) {
        sist = err instanceof Error ? err.message : String(err);
        // ☠️ Inte heller här för raderingen: ett nätverksfel kan komma EFTER
        // att Wix raderat skopan, och ett nytt försök hade då räknat den som
        // misslyckad. Taket (`limit`) hade inte minskat för filer som redan
        // var borta.
        if (!aterforsok || forsok === paus_ms.length) break;
        await paus(paus_ms[forsok]);
        continue;
      }
      if (res.ok) return (await res.json()) as Record<string, unknown>;

      const kropp = await res.text();
      sist = `${res.status}: ${sammanfattaFelkropp(kropp)}`;
      if (!aterforsok || !borAterforsoka(res.status, kropp)) break;
      if (forsok === paus_ms.length) break;
      const retryAfter = Number(res.headers.get("retry-after"));
      await paus(Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 15_000)
        : paus_ms[forsok]);
    }
    throw new Error(`${url} svarade ${sist}`);
  };

  return {
    // ETT FÖNSTER, inte hela beståndet. Se `cursor` i MediaCleanupSummary för
    // varför: Wix edge-lager svarar 429 med en HTML-sida när ett anrop bläddrar
    // för många sidor i rad, och den spärren går inte att vänta ut inom ruttens
    // 300 sekunder.
    //
    // ☠️ `paging.limit` TAKAS PÅ 100, vad än dokumentationen påstår.
    //
    // Både Search Files och Query File Descriptors står som "up to 200 files"
    // i dev.wix.com. Uppmätt mot skarpa API:t 2026-08-28 svarar BÅDA 400:
    //
    //   INVALID_ARGUMENT: 'paging.limit' must be less than or equal to 100
    //
    // En körning med 200 föll direkt på första sidan. Talet är alltså inte
    // förhandlingsbart, och 58 160 filer är 582 sidor oavsett.
    //
    // Pausen är 250 ms — mätt föll en körning efter ~150 sidor på 120 ms.
    listaFiler: async ({ efter, stoppaVid } = {}) => {
      const ut: MediaFil[] = [];
      let cursor: string | null = efter ?? null;
      let komplett = false;
      for (let i = 0; i < SIDOR_PER_FONSTER; i++) {
        if (stoppaVid !== undefined && Date.now() >= stoppaVid) break;
        const data = (await post(`${WIX_BASE}/site-media/v1/files/search`, {
          paging: { limit: 100, ...(cursor ? { cursor } : {}) },
        })) as { files?: Record<string, string>[]; nextCursor?: { hasNext?: boolean; cursors?: { next?: string } } };
        for (const f of data.files ?? []) {
          ut.push({
            id: String(f.id ?? ""),
            displayName: String(f.displayName ?? ""),
            url: String(f.url ?? ""),
            sizeInBytes: Number(f.sizeInBytes ?? 0),
            sourceUrl: f.sourceUrl ? String(f.sourceUrl) : undefined,
            createdDate: f.createdDate ? String(f.createdDate) : undefined,
            updatedDate: f.updatedDate ? String(f.updatedDate) : undefined,
          });
        }
        cursor = data.nextCursor?.hasNext ? (data.nextCursor.cursors?.next ?? null) : null;
        if (!cursor) { komplett = true; break; }
        await paus(250);
      }
      return { filer: ut, cursor, komplett };
    },

    // ☠️ Recensionsbilderna sitter inte på en produkt utan på en recensionsrad,
    // och var därför osynliga för planen. `listAll` tar hela lagret; en
    // recension bär både `imageUrl` (den första) och `imageUrls` (alla), och
    // BÅDA måste med — den första är också med i listan, men en rad som bara
    // har `imageUrl` har ingen `imageUrls`.
    listaRecensionsbilder: async () => {
      const { getReviewStore } = await import("../store/reviews");
      const urls = await recensionsbildUrler(getReviewStore());
      // ☠️ Ett tomt svar UTAN fel är också ett läsfel här: pekar
      // REVIEWS_BACKEND fel landar läsningen i den tömda Wix-kollektionen och
      // svarar []. Uppmätt 2026-10-06: 3 592 bildadresser bara på de
      // publicerade raderna.
      if (urls.length < MIN_RECENSIONSBILDER) {
        throw new Error(`bara ${urls.length} recensionsbilder, golvet är ${MIN_RECENSIONSBILDER}`);
      }
      return urls;
    },

    // Samma sajt som resten av städningen (WIX_SITE_ID när den är satt) och
    // samma läsning som bildinventeringen gör — dolda kategorier räknas med.
    // Kastar vid läsfel; runMediaCleanup gör det till ett avbrott.
    listaKategoribilder: async () => {
      const { collectCategoryMedia, headlessSiteId } = await import("../wix/media-audit");
      const { ids, kategorier } = await collectCategoryMedia(process.env.WIX_SITE_ID || headlessSiteId());
      if (kategorier < MIN_KATEGORIER) {
        throw new Error(`bara ${kategorier} kategorier lästa, golvet är ${MIN_KATEGORIER}`);
      }
      return [...ids];
    },

    // Färgernas bilder utöver Wix tak (lib/aosom/fargbilder.ts). Kastar vid
    // läsfel och under golvet; runMediaCleanup gör det till ett avbrott.
    listaFargbilder: async () => {
      const { getFargbildLager } = await import("../store/fargbilder");
      const idn = await getFargbildLager().lasAllaFilIdn();
      if (idn.length < MIN_FARGBILDER) {
        throw new Error(`bara ${idn.length} filer i färgbildstabellen, golvet är ${MIN_FARGBILDER}`);
      }
      return idn;
    },

    // Varje variants egen bild, även utkastens: den varukorgen, Wix-kassan och
    // ordern visar. Produktsökningen bär inga varianter, så de läses ur
    // Read-Only Variants API (uppmätt 2026-10-14: `media.id` per variant, även
    // för dolda produkter, utan filter och med markör). Bara mediadelen läses,
    // inte produktdatan.
    listaVariantbilder: async () => {
      const ut = new Set<string>();
      const produkter = new Set<string>();
      let cursor: string | null = null;
      let sidor = 0;
      for (;;) {
        // Sida två och framåt bär bara markören: andra Wix-sökningar avvisar
        // filter eller sortering tillsammans med en markör.
        const data = (await post(`${WIX_BASE}/stores/v3/products/query-variants`, {
          fields: [],
          query: { cursorPaging: { limit: VARIANTER_PER_SIDA, ...(cursor ? { cursor } : {}) } },
        })) as {
          variants?: Array<{ media?: unknown; productData?: { productId?: string } }>;
          pagingMetadata?: { cursors?: { next?: string }; hasNext?: boolean };
        };
        for (const v of data.variants ?? []) {
          if (v.productData?.productId) produkter.add(v.productData.productId);
          if (v.media) for (const id of wixMediaIdn(JSON.stringify(v.media))) ut.add(id);
        }
        sidor++;
        if (!data.pagingMetadata?.hasNext) break;
        // ☠️ "Det finns mer" utan markör är ett trasigt svar, inte slutet.
        cursor = data.pagingMetadata.cursors?.next ?? null;
        if (!cursor) throw new Error("query-variants svarade hasNext utan markör");
        // Ett tak ska kasta, aldrig kapa.
        if (sidor >= VARIANT_SIDTAK) throw new Error(`minst ${VARIANT_SIDTAK} sidor varianter: höj VARIANT_SIDTAK`);
        await paus(250);
      }
      if (ut.size < MIN_VARIANTBILDER) {
        throw new Error(`bara ${ut.size} variantbilder, golvet är ${MIN_VARIANTBILDER}`);
      }
      const totalt = await katalogensRaknare();
      if (produkter.size < totalt * MIN_VARIANTPRODUKTER_ANDEL) {
        throw new Error(`varianter från bara ${produkter.size} av ${totalt} produkter`);
      }
      console.log(`[media-cleanup] varianter: ${ut.size} bilder från ${produkter.size} av ${totalt} produkter`);
      return [...ut];
    },

    karens: (await import("../store/bildstadning-karens")).getKarensLager(),

    // Butikens egen lista (blogg, kod, reservkatalog, variantbilder). Kastar
    // vid läsfel och under golvet; runMediaCleanup gör det till ett avbrott.
    listaButikensBilder: async () => {
      const { lasButikensMediaIdn } = await import("../wix/butikens-media");
      return lasButikensMediaIdn();
    },

    // Alla ordrar, alla statusar: en avbruten order har också skickat ett mejl.
    // Search Orders lämnar ute PENDING och REJECTED om de inte efterfrågas, så
    // de läses i ett eget anrop (0 st 2026-10-14, men en handlagd fakturaorder
    // kan stå som PENDING).
    listaOrderbilder: async () => {
      const { fetchOrders } = await import("../wix/orders");
      const { wixMediaIdn } = await import("../wix/media-idn");
      const SEDAN = "2020-01-01T00:00:00.000Z";
      const ordrar = [
        ...await fetchOrders(SEDAN, { includeCancelled: true, strict: true, maxPages: ORDER_SIDTAK }),
        ...await fetchOrders(SEDAN, { statusar: ["PENDING", "REJECTED"], strict: true, maxPages: ORDER_SIDTAK }),
      ];
      // fetchOrders slutar tyst vid sidtaket. Ett tak ska kasta, aldrig kapa.
      if (ordrar.length >= ORDER_SIDTAK * 100) {
        throw new Error(`Minst ${ORDER_SIDTAK * 100} ordrar: höj ORDER_SIDTAK.`);
      }
      const ut = new Set<string>();
      for (const o of ordrar) for (const id of wixMediaIdn(JSON.stringify(o))) ut.add(id);
      // Samma hållning som recensionerna: fel site-id ger 200 och noll ordrar.
      // Uppmätt 2026-10-14: 90 ordrar, 83 bild-id.
      if (ut.size < MIN_ORDERBILDER) {
        throw new Error(`bara ${ut.size} bilder i ordrarna, golvet är ${MIN_ORDERBILDER}`);
      }
      return [...ut];
    },

    listaAnvanda: async () => {
      const urls: string[] = [];
      let antalProdukter = 0;
      let cursor: string | null = null;
      let klar = false;
      for (let i = 0; i < 500; i++) {
        // ☠️ fields: MEDIA_ITEMS_INFO krävs. Utan det svarar V3 med media.main
        // ifylld men itemsInfo.items TOM — och då ser varje fil föräldralös ut.
        // Exakt samma projektionsfälla som kostade en runda 2026-08-27.
        const data = (await post(`${WIX_BASE}/stores/v3/products/search`, {
          search: { cursorPaging: { limit: 100, ...(cursor ? { cursor } : {}) } },
          fields: ["MEDIA_ITEMS_INFO"],
        })) as {
          products?: ProduktMedia[];
          pagingMetadata?: { cursors?: { next?: string } };
        };
        // Huvudbild, galleri OCH valens kopplade bilder — samma definition som
        // raderingen av pensionerade utkast använder (lib/wix/produkt-media.ts).
        for (const p of data.products ?? []) {
          antalProdukter++;
          urls.push(...produktensMedianycklar(p));
        }
        cursor = data.pagingMetadata?.cursors?.next ?? null;
        if (!cursor || (data.products ?? []).length === 0) { klar = true; break; }
        // 250 ms som fillistningen: anropen i rad mot samma värd är det som
        // utlöser edge-spärren (granskningen 2026-10-14).
        await paus(250);
      }
      // ☠️ SVEPET STÄMS AV MOT KATALOGENS RÄKNARE (granskningen 2026-10-14).
      // En tom sida eller en saknad markör mitt i katalogen avslutar loopen som
      // om katalogen tagit slut, och halvbildsspärren i planeraStadning ser inte
      // ett svep som kapats jämnt. Samma kontroll som raderingen av
      // pensionerade utkast gör.
      kontrolleraProduktsvep(antalProdukter, klar, klar ? await katalogensRaknare() : 0);
      return { urls, antalProdukter };
    },

    // permanent: true — papperskorgen räknas fortfarande mot lagringen, så en
    // vanlig radering frigör ingenting alls.
    // Utan återförsök, med flit — se kommentaren vid `post`.
    raderaPermanent: async (fileIds) => {
      await post(`${WIX_BASE}/site-media/v1/bulk/files/delete`, { fileIds, permanent: true }, false);
    },

    paus: async (ms) => { await paus(ms); },
  };
}
