// Lättviktig svensk sök-tokenisering + stemming + synonymer + stavfelstolerans,
// delad mellan klient-autocomplete (components/searchbox.tsx) och server-
// sökresultatsidan (app/sok/page.tsx) så matchningen är identisk överallt. Ren
// TS utan node-beroenden → klient-säker.
//
// Historik:
//  • 2026-05-31: den gamla sökningen var keyword-literal — `knivset` gav 0 träffar
//    trots knivhållare i katalogen, och `halsband` matchade en halloween-kattdräkt
//    via beskrivningen. Lösning: stamma bort svenska böjnings-/sammansättnings-
//    suffix och matcha stammen som DELSTRÄNG i produktnamnet (compound-aware), samt
//    prioritera NAMN-träffar före beskrivnings-/spec-träffar.
//  • 2026-07-09: två genomtänkta lager till, båda i nameScore så de gäller BÅDE
//    autocomplete och resultatsidan:
//      1) Synonymer (svenska ⇄ engelska + närsynonymer): "mtb" hittar hela
//         cykelsortimentet, "belysning" hittar lampor, "trådlös" hittar sladdlöst,
//         "storage" hittar förvaring. Bidirektionellt.
//      2) Stavfelstolerans (Damerau-approximativ delsträngsmatchning): "cyckel"→
//         cykel, "sdael"→sadel. Transposition = 1 redigering (vanligaste typo:n).
//    Poängen är skiktad: exakt (100/60) > synonym (~51) > stavfel (~36) så en
//    korrekt träff ALLTID rankas före en synonym-/typo-träff.
//  • 2026-09-24: "Visa alla resultat" matchade sämre än förslagen (Leonard).
//    rankByName tar bort delträffar när riktiga finns, en fras som bara står i
//    namnets tillägg ger 90 i stället för 100, och fyra för korta synonym-
//    needles stängdes av (AMBIGUOUS_NEEDLES).
//  • 2026-10-14: "uppresningsfåtölj" hängde sökrutan på mobilen (Leonard).
//    rankByName körde stavfelstoleransen på varje namn vid varje tangent, ~50 ms
//    på en dator och ~300 ms på en telefon. Nu körs den bara när ingen vara
//    matchar alla sökord utan den (samma svar, uppmätt på 121 prefix), och
//    sökordet tolkas en gång per sökning i stället för en gång per vara.
//    "uppresningsfåtölj" hittar också "Massagefåtölj med uppresning" och
//    "…uppresningshjälp" (synonymgrupp), och småord som "med" krävs inte i namnet.
//    Inom samma poäng går namn där sökordet är ordets huvud före de andra
//    (kant): "tv" visar TV-bänkar före viktvästar, "bord" bord före bordslampor.
//  • 2026-11-10: 39 provsökningar mot butiken. "fatolj" gav 0 träffar fast
//    284 varor har fåtölj i namnet, "sangbord" gamingbord, "tv bank" 949 varor med
//    en hantelbänk överst, "laser tag" en bredgaffel och "elkammin" melaminhyllor.
//    Tre tillägg, alla som RESERV i samma anda som stavfelsledet, så att en
//    sökning som redan har en hel träff svarar som förut:
//      1) Sammanskrivet (sammanskrivet): "laser tag" hittar "lasertag", och
//         "tvbänk" eller "tv bänk" hittar "TV-bänk". Går före ordträffarna.
//      2) Utan prickar (vik): å, ä och ö jämförs som a och o när inget matchar
//         med prickarna kvar. Körs före stavfelsledet.
//      3) Ett stavfel före två: finns en träff med ett fel i ordet visas inte
//         de med två.
//    Samma dag, i granskningen: "barnbil" gav 118 träffar med en barnbokhylla
//    överst, för ordet står inte i något namn och låg två fel från "barnbok".
//      4) Ett sammansatt sökord delat i två (delningar): "barnbil" söks som
//         "barn bil" när inget ord träffar med högst ett fel. Efter ett
//         stavfel, före två.
//  • 2026-11-19: 124 provsökningar mot butiken (Leonard: "tycker du vår
//    sökfunktion är 10/10?"). Stavningen höll, men "svart tv-bänk" gav en
//    diskbänkslåda överst ("tv" står i "två"), "hundbur xl" ingen hundbur,
//    "pulka" tomtar med polkagris, "aosom" nio varor med ordet "som", och
//    "länstol", "papperskorg" och "pallkrage" nästan ingenting fast varorna
//    finns under andra namn. Fem ändringar:
//      1) Korta ord och tal står som EGNA ORD (starSomOrd): "tv" är inte "två",
//         och "120" är inte "1200".
//      2) Stavfel bara för ord som INTE finns i katalogen. "hundbur" står i 19
//         namn och är rättstavat, så det blir aldrig "hundbädd".
//      3) Ett stavfel ska ligga i ETT ord och träffa ordets SLUT (fuzzyOrdslut):
//         "pulka" är inte början av "polkagris", och "aosom" är inte "a som".
//      4) Har inget namn alla sökord STRYKS ord i tur och ordning, med besked
//         till kunden (rankaMedInfo): först ord som inte finns alls, sedan färg,
//         storlek och mått, sedan det vanligaste. "svart tv-bänk" visar
//         tv-bänkarna och säger att "svart" inte står i något namn.
//      5) Kundens ord för varor som heter något annat (ENVAGS) och fler
//         synonymgrupper, alla prövade mot katalogens 7 617 namn.

// Längsta suffix först — vi tar bort EN matchande ändelse och bara om stammen
// blir ≥3 tecken (annars blir "set"→"" och allt matchar).
const SUFFIXES = [
  "erna", "arna", "orna", "andet", "ningen", "heten",
  "ande", "else", "ning", "het", "set", "are", "ast",
  "en", "et", "ar", "er", "or", "na", "an", "n", "t", "s",
];

// ☠️ MÅTT SKRIVS PÅ FLERA SÄTT (2026-11-19, Googles frågor mot butiken).
// Kunden skriver "matbord 70x70", "matta 160x120", "150cm" och "pump 12v";
// namnen skriver "70 × 70 cm", "140x200", "12 V" och "4800W". Som ETT ord blev
// "70x70" ett sällsynt sökord som överlevde strykningen medan "matbord" ströks,
// och sökningen visade två badrumsspeglar. Båda sidor skrivs därför likadant:
// tal × tal med mellanslag, och talet skilt från sin enhet. Bara där en siffra
// står intill, så "g310", "500fg" och "3d" rörs inte.
const MATT_GANGER = /(\d)\s*[x×]\s*(?=\d)/g;
const MATT_ENHET = /(\d)(cm|mm|kg|tum|liter|w|v|l|m)(?![a-zåäö0-9])/g;

export function normalize(s: string): string {
  const t = (s || "").toLowerCase().trim();
  return /\d/.test(t) ? t.replace(MATT_GANGER, "$1 × ").replace(MATT_ENHET, "$1 $2") : t;
}

// Dela på allt som inte är bokstav/siffra (bindestreck, mellanslag, "&", "/").
export function tokenize(s: string): string[] {
  return normalize(s).split(/[^a-zåäö0-9]+/i).filter((t) => t.length > 0);
}

// Lätt stemmer: ta bort ETT känt suffix. Fler-teckens suffix kräver att stammen
// blir ≥3 tecken; ENTECKENS suffix (n/t/s) kräver ≥4 — annars kapas slutkonsonanten
// i korta rotord ("barn"→"bar", "katt"→"kat", "ljus"→"lju"), vilket gjorde att
// "bar" matchade varje -bar-adjektiv (expanderbar, hopfällbar …), "kat" matchade
// "delikat" och "lju" matchade "ljud". Med ≥4 för enteckens-suffixen behålls
// rotorden intakta medan äkta böjning ("bilar"→"bil", "knivset"→"kniv") består.
export function stem(tok: string): string {
  for (const suf of SUFFIXES) {
    const minStem = suf.length === 1 ? 4 : 3;
    if (tok.length - suf.length >= minStem && tok.endsWith(suf)) {
      return tok.slice(0, -suf.length);
    }
  }
  return tok;
}

// ── Synonymer ───────────────────────────────────────────────────────────────
// Bidirektionella grupper. En sökning på VILKEN term som helst i en grupp får
// också prova de övrigas stammar som delsträng i produktnamnet. Grunden är
// Fyndplats faktiska katalog (2026-07: cykel×38, mtb×5, lampa×9, barn×79, …).
//
// PRECISION framför recall: eftersom matchningen är delsträngsbaserad (för
// svenska sammansättningar) är korta/tvetydiga "needles" farliga — `solar`→`sol`
// skulle matcha isolering/parasoll, `fan` skulle matcha elefant. Sådana är
// medvetet BORTvalda. Varje kvarvarande term är handgranskad så dess stam inte är
// en vanlig delsträng i orelaterade ord. Synonymträffar poängsätts dessutom under
// exakta träffar, så en felaktig synonym aldrig kan tränga undan en riktig träff.
const SYNONYM_GROUPS: string[][] = [
  // Cyklar — "mtb"/"mountainbike" ska nå hela cykelsortimentet.
  ["cykel", "mtb", "mountainbike", "racercykel", "elcykel"],
  // Belysning (INTE "ljus"/"led" som needle — krockar med "ljud" resp. otaliga ord).
  ["lampa", "belysning", "lykta", "ficklampa"],
  // Trådlöst = sladdlöst = wireless (äkta synonymer).
  ["trådlös", "sladdlös", "wireless", "bluetooth"],
  // Väskor (+ engelska "bag"). "kasse" bortvalt (→"kass" krockar med kassaskåp).
  ["väska", "bag", "necessär"],
  ["ryggsäck", "backpack"],
  // Barn — engelsktalande söker "kids"/"children".
  ["barn", "kids", "children"],
  // Husdjur (djur×5, hund×17, katt×19). Engelska "cat"/"dog"/"pet" bortvalda
  // (för korta → cat i "delikat", pet i "trumpet").
  ["hund", "valp"],
  ["katt", "kattunge"],
  ["husdjur", "djur"],
  // Möbler & sittplatser.
  ["stol", "chair"],
  ["pall", "stool"],
  ["fåtölj", "armchair"],
  // "kontorsfåtölj" gav en enda träff, varan som heter så, fast katalogen har
  // 120 kontorsstolar (2026-11-10).
  ["kontorsstol", "kontorsfåtölj", "skrivbordsstol", "datorstol"],
  // Uppresningsfåtöljer (Leonard 2026-10-14). 29 heter "Uppresningsfåtölj …",
  // fyra "Massagefåtölj med uppresning" eller "…uppresningshjälp". Nålen "uppres"
  // (stammen av "uppresning") stod i exakt de 33 namnen och inga andra. "lyft"
  // är INTE med: det står också i MC-lyften och brödrosten ("högt lyft").
  ["uppresningsfåtölj", "uppresning", "lyftfåtölj", "lyftstol", "uppresningsstol"],
  ["soffa", "sofa", "couch"],
  ["hylla", "shelf", "shelves", "bokhylla"],
  ["skåp", "cabinet", "cupboard"],
  ["spegel", "mirror"],
  // Textil.
  ["matta", "carpet"],
  ["kudde", "pillow", "cushion"],
  ["filt", "pläd", "täcke", "blanket"],
  ["gardin", "curtain"],
  // Kök & servering.
  ["skål", "bowl"],
  ["kniv", "knife", "knivset"],
  ["gryta", "kastrull"],
  // Elektronik & ljud.
  ["högtalare", "speaker", "soundbar"],
  ["hörlurar", "headset", "hörsnäckor", "earbuds", "headphones"],
  ["projektor", "projector"],
  ["fläkt", "ventilation"],
  ["laddare", "charger", "laddkabel"],
  // Verktyg & garage.
  ["verktyg", "tool", "tools"],
  ["borr", "drill", "borrmaskin"],
  // Utomhus.
  ["tält", "tent"],
  ["grill", "bbq", "barbecue"],
  ["pool", "bassäng"],
  ["solcell", "solpanel", "solenergi"],
  // Förvaring.
  ["förvaring", "storage", "organizer", "förvaringsbox"],
  // Leksaker.
  ["leksak", "leksaker", "toys"],
  // ── 2026-11-19: varor som finns under ett annat namn än kunden söker på.
  // Varje nål är prövad mot katalogens namn (tools/…/sok-nalar i PR-texten):
  // ingen står i ett orelaterat ord.
  ["soptunna", "sophink", "pedalhink", "papperskorg", "sopkorg"],
  ["klösträd", "kattträd", "katträd", "klösmöbel"],
  ["studsmatta", "trampolin"],
  ["solsäng", "solstol", "solvagn", "däckstol"],
  ["garderob", "klädskåp"],
  ["nattduksbord", "sängbord", "nattygsbord"],
  ["skohylla", "skoställ"],
  ["hundbädd", "hundsäng", "hundkorg"],
  ["odlingslåda", "pallkrage", "odlingsbädd", "planteringslåda"],
  ["kattlåda", "kattoalett", "katttoalett"],
  ["skrivbord", "datorbord"],
  ["sideboard", "skänk"],
  ["matbord", "köksbord", "matsalsbord"],
  ["matstol", "köksstol"],
  ["barstol", "barpall"],
  ["vedställ", "vedförvaring", "vedhylla"],
  ["växthus", "drivhus"],
  ["partytält", "festtält"],
  ["paviljong", "lusthus", "gazebo"],
  ["hönshus", "hönsgård", "hönsbur"],
  ["hundhage", "hundgård", "valphage"],
  ["hundkoja", "hundhus"],
  ["cykelkärra", "cykelvagn"],
  ["gåbil", "sparkbil", "åkbil"],
  ["hoppborg", "hoppslott"],
  ["rutschkana", "rutschbana"],
  ["leksakskök", "barnkök", "lekkök"],
  ["lekstuga", "lekhus"],
  ["tvättkorg", "tvättsäck"],
  ["klädställ", "klädställning", "klädhängare", "klädräcke"],
  ["rumsavdelare", "skärmvägg", "vikskärm", "vikvägg"],
  ["kylbox", "kylväska"],
  ["motionscykel", "träningscykel", "spinningcykel"],
  ["boxningssäck", "slagsäck", "boxsäck"],
  ["massagebänk", "massagebord", "behandlingsbänk"],
  ["brevlåda", "postlåda"],
  ["säckkärra", "magasinkärra"],
  ["garagetält", "tältgarage", "carport"],
  ["redskapsbod", "förråd", "trädgårdsbod", "verktygsbod", "metallskjul", "plåtbod", "redskapsskjul"],
  ["terrassvärmare", "infravärmare", "uteplatsvärmare"],
  ["hängstol", "hängfåtölj"],
  ["hollywoodgunga", "hammock", "trädgårdsgunga"],
  ["gamingstol", "gamerstol", "spelstol"],
  ["vinställ", "vinhylla"],
  ["blomställ", "blomhylla", "växthylla", "blomtrappa"],
  ["darttavla", "piltavla"],
  ["basketkorg", "basketställning", "basketställ"],
  ["projektorduk", "filmduk"],
  ["arbetsbänk", "hyvelbänk", "verkstadsbänk"],
  ["hundtrappa", "husdjurstrappa"],
  ["foderautomat", "matautomat"],
  ["dockhus", "dockskåp"],
];

// ── Kundens ord → katalogens ord, åt ETT håll ───────────────────────────────
// Ord som kunden skriver men som inte står i något namn. Nålarna är skrivna
// som de ska stå i namnet och går inte genom canon: "byrå" hade blivit "byr",
// som också står i "labyrint". Åt andra hållet behövs ingenting, för den som
// söker "fåtölj" saknar inte en vara som heter "länstol".
//
// Kategoriorden ("utemöbler", "trädgårdsmöbler") står här för att ge varor som
// hör dit: förut svarade "trädgårdsmöbler" med en presenning, en högtryckstvätt
// och en plåtbod, alla ur beskrivningarna.
const ENVAGS: Record<string, string[]> = {
  länstol: ["fåtölj"],
  kommod: ["byrå"],
  utemöbler: ["trädgårdsbord", "trädgårdsstol", "trädgårdsbänk", "trädgårdssoffa", "loungegrupp", "loungeset", "bistroset", "trädgårdsfåtölj"],
  trädgårdsmöbler: ["utemöbl", "trädgårdsbord", "trädgårdsstol", "trädgårdsbänk", "trädgårdssoffa", "loungegrupp", "loungeset", "bistroset", "trädgårdsfåtölj"],
  balkongmöbler: ["bistroset", "balkongbord", "balkongset"],
  julpynt: ["juldekoration", "julgirlang", "julkrans", "julstjärn"],
  // "eldfat" som grupp hade gett nålen "eldf", som också står i "eldfast".
  eldfat: ["eldkorg"],
  // Googles frågor mot butiken (2026-11-19): ord som inget namn har.
  hallbyrå: ["byrå"],
  klätterblock: ["skumkloss", "klätterset"],
  busy: ["aktivitetstavla", "aktivitetsbräda"],
  busyboard: ["aktivitetstavla", "aktivitetsbräda"],
  laserpistol: ["lasertag"],
  laserspel: ["lasertag"],
};

// Släpp en kvarvarande ändelsevokal efter stemming så böjningar kollapsar till en
// gemensam nyckel: "lampa"→lamp, "lampor"→lamp, "lampan"→lamp. Bara om resultatet
// blir ≥3 tecken (annars t.ex. "grå"→"gr" — för kort/tvetydigt).
function collapseVowel(k: string): string {
  const c = k.replace(/[aeoåäö]$/, "");
  return c.length >= 3 ? c : k;
}

// Kanonisk form för synonym-uppslag OCH för needles. Appliceras på ORIGINALtermen
// på BÅDA sidor (bygge + fråga) så de alltid möts — stemming är inte idempotent
// (stem("belys")="bely"), så vi får inte stamma en redan stammad token igen.
function canon(term: string): string {
  return collapseVowel(stem(normalize(term)));
}

// Bygg: kanonisk nyckel → övriga gruppmedlemmars needles (kanoniska stammar,
// ≥3 tecken). Enkelriktad iteration men grupperna är symmetriska → bidirektionellt.
// Needles som stammen gör för korta och som därför träffar orelaterade namn.
// Uppmätt mot katalogen 2026-09-24: "sof" (sofa) → "soft close"-soptunnor och
// soffbord, "carp" (carpet) → CarPlay och carport, "tent" (tent) → 14 st
// "vattentät", "bag" → bagagerumsgaller för hund. Söker man på termen själv
// fungerar synonymen fortfarande ("sofa" hittar soffor); det är bara åt andra
// hållet ("soffa" → needle "sof") den stängs av.
const AMBIGUOUS_NEEDLES = new Set(["sof", "carp", "tent", "bag"]);

const SYN: Map<string, string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const group of SYNONYM_GROUPS) {
    const needles = [...new Set(group.map(canon))].filter((x) => x.length >= 3 && !AMBIGUOUS_NEEDLES.has(x));
    for (const term of group) {
      const key = canon(term);
      const others = needles.filter((nd) => nd !== key);
      const prev = map.get(key) || [];
      map.set(key, [...new Set([...prev, ...others])]);
    }
  }
  return map;
})();

// Envägsnålarna under samma nyckel som SYN (canon av kundens ord).
const ENVAGS_NALAR: Map<string, string[]> = new Map(Object.entries(ENVAGS).map(([ord, nalar]) => [canon(ord), nalar]));

// Synonym-needles för en originalterm (exporterad för test/insyn).
export function expandSynonyms(term: string): string[] {
  const k = canon(term);
  return [...(SYN.get(k) || []), ...(ENVAGS_NALAR.get(k) || [])];
}

// ── Stavfelstolerans ─────────────────────────────────────────────────────────
// Ungefärlig DELSTRÄNGSmatchning med Damerau-Levenshtein (infogning, borttagning,
// utbyte OCH transposition av två intilliggande tecken — den i särklass vanligaste
// stavfelstypen, t.ex. "sdael"→"sadel"). Rad 0 = nollor ⇒ fri startposition, så
// mönstret får matcha VAR som helst i texten; svaret är minsta redigeringsavstånd
// för hela mönstret som slutar någonstans i texten. Returnerar true om ≤ maxDist.
// O(|pattern|·|text|); körs bara när exakt/synonym redan missat en token.
export function fuzzyContains(pattern: string, text: string, maxDist: number): boolean {
  return fuzzyAvstand(pattern, text, maxDist) <= maxDist;
}

/** Minsta redigeringsavståndet för mönstret någonstans i texten. Över maxDist: Infinity. */
export function fuzzyAvstand(pattern: string, text: string, maxDist: number): number {
  const m = pattern.length;
  const n = text.length;
  if (m === 0) return 0;
  if (m > n + maxDist) return Infinity; // kan omöjligt rymmas
  let prevPrev: number[] = new Array(n + 1).fill(0);
  let prev: number[] = new Array(n + 1).fill(0); // rad 0: fri start överallt
  for (let i = 1; i <= m; i++) {
    const cur: number[] = new Array(n + 1);
    cur[0] = i; // i mönstertecken mot tom textprefix = i borttagningar
    for (let j = 1; j <= n; j++) {
      const cost = pattern[i - 1] === text[j - 1] ? 0 : 1;
      let v = Math.min(prev[j - 1] + cost, prev[j] + 1, cur[j - 1] + 1);
      if (i > 1 && j > 1 && pattern[i - 1] === text[j - 2] && pattern[i - 2] === text[j - 1]) {
        v = Math.min(v, prevPrev[j - 2] + 1); // transposition
      }
      cur[j] = v;
    }
    prevPrev = prev;
    prev = cur;
  }
  let best = Infinity;
  for (let j = 0; j <= n; j++) if (prev[j] < best) best = prev[j];
  return best <= maxDist ? best : Infinity;
}

/**
 * Minsta redigeringsavståndet för mönstret mot SLUTET av ett ord i texten.
 * Över maxDist: Infinity.
 *
 * Skillnaden mot fuzzyAvstand är två villkor, och båda kommer ur vad som gick
 * fel 2026-11-19:
 *   - Träffen ligger i ETT ord. Ett skiljetecken är en vägg i tabellen, så
 *     "aosom" kan inte bli "a som" över ett mellanslag.
 *   - Träffen slutar där ordet slutar (en böjningsändelse får följa). Svenska
 *     sammansättningar har huvudet sist: "kontorstol" är "kontorsstol" och
 *     "fåtöjl" är slutet av "gungfåtölj", men "pulka" är inte början av
 *     "polkagriskäpp".
 */
export function fuzzyOrdslut(pattern: string, text: string, maxDist: number): number {
  const m = pattern.length;
  const n = text.length;
  if (m === 0) return 0;
  let best = Infinity;
  // Ett ord i taget. De flesta ord faller på längden eller på att de delar
  // för få teckenpar med sökordet, och får aldrig någon tabell: stavfelsledet
  // körs vid varje tangent i sökrutan (☠️ 2026-10-14: ~300 ms på en telefon).
  for (let a = 0; a < n; ) {
    if (!BOKSTAV.test(text[a])) { a++; continue; }
    let b = a + 1;
    while (b < n && BOKSTAV.test(text[b])) b++;
    if (b - a >= m - maxDist && b - a < RAD_MAX) {
      const d = ordslutAvstand(pattern, text, a, b, maxDist);
      if (d < best) best = d;
      if (best === 0) return 0;
    }
    a = b;
  }
  return best <= maxDist ? best : Infinity;
}

// Tabellens rader, återanvända mellan anropen (ett ord är aldrig så långt).
const RAD_MAX = 96;
let radA = new Int32Array(RAD_MAX + 1);
let radB = new Int32Array(RAD_MAX + 1);
let radC = new Int32Array(RAD_MAX + 1);

/** fuzzyOrdslut för ETT ord, text[a..b). */
function ordslutAvstand(pattern: string, text: string, a: number, b: number, maxDist: number): number {
  const m = pattern.length;
  const L = b - a;
  // Ett fel kan förstöra högst tre teckenpar (en omkastning). Delar ordet
  // färre par med sökordet än så lämnar kvar finns ingen träff att hitta.
  const kravPar = m - 1 - 3 * maxDist;
  if (kravPar > 0) {
    let par = 0;
    for (let i = 0; i + 1 < m && par < kravPar; i++) {
      const j = text.indexOf(pattern[i] + pattern[i + 1], a);
      if (j >= 0 && j + 1 < b) par++;
    }
    if (par < kravPar) return Infinity;
  }
  let prevPrev = radA, prev = radB, cur = radC;
  for (let j = 0; j <= L; j++) prev[j] = 0; // rad 0: fri start var som helst i ordet
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    const pc = pattern[i - 1];
    for (let j = 1; j <= L; j++) {
      const tc = text[a + j - 1];
      let v = prev[j - 1] + (pc === tc ? 0 : 1);
      if (prev[j] + 1 < v) v = prev[j] + 1;
      if (cur[j - 1] + 1 < v) v = cur[j - 1] + 1;
      if (i > 1 && j > 1 && pc === text[a + j - 2] && pattern[i - 2] === tc && prevPrev[j - 2] + 1 < v) v = prevPrev[j - 2] + 1; // omkastning
      cur[j] = v;
    }
    const t = prevPrev; prevPrev = prev; prev = cur; cur = t;
  }
  let best = Infinity;
  for (let j = 1; j <= L; j++) {
    if (prev[j] >= best || prev[j] > maxDist) continue;
    // Resten av ordet efter träffen: tomt, en böjningsändelse, eller högst två
    // bokstäver ("konstgjor|da", "justerbar|t"). Mätt på 592 felstavningar av
    // katalogens vanligaste första ord 2026-11-19.
    if (L - j > 2 && !BOJNING.has(text.slice(a + j, b))) continue;
    // Första bokstaven ska stämma. "cyckel" låg lika nära "nyckel" i
    // "momentnyckel" som "cykel" i "motionscykel". Träffen är m tecken lång,
    // plus eller minus felen, så början ligger inom maxDist från j − m.
    //
    // Och den ska börja där ett ord kan börja (2026-11-19): först i ordet,
    // eller med ett helt ord före sig ("barn|cykel", "el|kamin"). "örhängen"
    // låg ett fel från "r|örgäng|or" och gav en rörutdragare.
    let borjanStammer = false;
    for (let st = Math.max(0, j - m - maxDist); st <= j - m + maxDist && st < j; st++) {
      if (text[a + st] !== pattern[0]) continue;
      if (st === 0 || st >= 3 || (st === 2 && KORTA_FORLED.has(text.slice(a, a + 2)))) { borjanStammer = true; break; }
    }
    if (borjanStammer) best = prev[j];
  }
  return best;
}

// ── Utan prickar och sammanskrivet ───────────────────────────────────────────
// Den som skriver på ett tangentbord utan å, ä och ö skriver "fatolj" och
// "sangbord". Båda sidor viks, så det gäller åt båda hållen.
export function vik(s: string): string {
  return /[åäöé]/.test(s) ? s.replace(/[åä]/g, "a").replace(/ö/g, "o").replace(/é/g, "e") : s;
}

// Ett bindestreck INUTI ett ord byts mot en fog, ett tecken som aldrig står i
// ett namn: "tv-bänk" blir "tv␁bänk". Sökorden jämförs sedan sammanskrivna
// med en valfri fog mellan varje tecken (ihopMonster). Mellanslag rörs inte:
// två ord som bara råkar stå intill varandra ("fäst olika") blir aldrig ett
// ("stol").
const FOG = "\u0001";
function medFogar(s: string): string {
  return s.includes("-") ? s.replace(/([a-zåäö0-9])-(?=[a-zåäö0-9])/g, "$1" + FOG) : s;
}

/** Kortare än så jämförs inget sammanskrivet: "tv å" ska inte bli "två". */
const KORTASTE_SAMMANSKRIVET = 4;

// Sökorden skrivna som ett ord, som mönster med valfri fog mellan tecknen.
// Tecknen kommer ur tokenize och är bara bokstäver och siffror.
function ihopMonster(ihop: string): RegExp {
  return new RegExp([...ihop].join(FOG + "?"), "g");
}

// Var sökorden står sammanskrivna i ett namn med fogar: 2 = i huvuddelen,
// 1 = bara efter den, 0 = inte alls. Två villkor håller slumpträffar borta:
//   - Träffen börjar ett ord. "bädd soffa" är inte "hörnbäddsoffa" här (den
//     hittas ändå som två ord), och "topp" börjar inte mitt i "hardtop".
//   - Går träffen över en fog slutar den där en del slutar: "tvbänk" är hela
//     "tv-bänk", men "topp" är inte "top-p…" i "top-paviljong".
// Utan fog i träffen räcker ordets början ("laser tag" → "lasertag-set"), och
// det kan bara hända när sökningen har flera ord: ett ensamt sökord som står
// i namnet utan fog har redan träffat som fras.
function sammanskrivet(fogat: string, re: RegExp, flerOrd: boolean): { var: 0 | 1 | 2; slutarOrd: boolean } {
  const huvudSlut = fogat.search(/ [–-] |,| med | för | till /);
  let bast: 0 | 1 | 2 = 0;
  let slutarOrd = false;
  re.lastIndex = 0;
  for (let m = re.exec(fogat); m; m = re.exec(fogat)) {
    const i = m.index;
    const efter = fogat[i + m[0].length];
    const borjar = i === 0 || (fogat[i - 1] !== FOG && !BOKSTAV.test(fogat[i - 1]));
    const slutar = efter === undefined || efter === FOG || !BOKSTAV.test(efter);
    const overFog = m[0].includes(FOG);
    if (borjar && (overFog ? slutar : flerOrd)) {
      const har: 1 | 2 = huvudSlut < 0 || i < huvudSlut ? 2 : 1;
      if (har > bast) { bast = har; slutarOrd = slutar; }
      if (bast === 2) break;
    }
    re.lastIndex = i + 1; // nästa möjliga start, också en som överlappar
  }
  return { var: bast, slutarOrd };
}

// Hur bra en enskild sökterm matchar ett namn: 1 = exakt delsträng, 0.85 = via
// synonym, 0.6 = via stavfelstolerans, 0 = ingen träff. Stavfel gäller bara
// tokens ≥5 tecken (kortare ord blir för tvetydigt — en enda redigering i ett
// 4-teckensord matchar nästan vad som helst) och körs sist (billigast först).
// maxDist skalar med längden: 1 för 5–6 tecken, 2 för ≥7.
//
// Tre lägen, i den ordning rankByName provar dem:
//   EXAKT    — delsträng och synonym.
//   VIKT     — dessutom utan prickar ("fatolj" → fåtölj), 0.95.
//   STAVFEL  — dessutom stavfelstoleransen: 0.6 för ett fel, 0.5 för två.
// `tok` är ordet som kunden skrev det. `helord`: ordet ska stå för sig i namnet
// (starSomOrd). `egenskap`: färg, storlek eller mått, som stryks först när
// inget namn har alla sökord (rankaMedInfo).
// `fogRe`: ordet som mönster med valfri fog mellan tecknen (se tokenQuality).
// `ihopNasta`: ett kort ord av bokstäver ("el", "sy") skrivet ihop med ordet
// efter ("elbil"), för den som särskriver (se tokenQuality).
// `former`: ordets andra böjningar som stammen inte når (se bojdaFormer).
// `kortStam`: stammen är högst tre tecken och kortare än ordet kunden skrev
// ("rosor" → "ros"), och ska då stå som ett ord i namnet (se ordStar).
type Unit = { stem: string; key: string; vikt: string; tok: string; helord: boolean; egenskap: boolean; fogRe: RegExp | null; ihopNasta?: string; former?: string[]; kortStam?: boolean };
const EXAKT = 0, VIKT = 1, STAVFEL = 2;
type Lage = typeof EXAKT | typeof VIKT | typeof STAVFEL;

/** Kvaliteten, antalet stavfel när träffen kom via stavfelstoleransen, och om den krävde vikta prickar. */
type Ordtraff = { qual: number; fel: number; vikt: boolean };
const INGEN: Ordtraff = { qual: 0, fel: 0, vikt: false };
const HEL: Ordtraff = { qual: 1, fel: 0, vikt: false };
const SYNONYM: Ordtraff = { qual: 0.85, fel: 0, vikt: false };
const UTAN_PRICKAR: Ordtraff = { qual: 0.95, fel: 0, vikt: true };
const ETT_FEL: Ordtraff = { qual: 0.6, fel: 1, vikt: false };
const TVA_FEL: Ordtraff = { qual: 0.5, fel: 2, vikt: false };

// Korta ord och tal ska stå som EGNA ORD i namnet. "tv" står i "två",
// "tvåsitsig" och "viktväst", och "svart tv-bänk" gav en diskbänkslåda "i två
// nivåer" före första tv-bänken (2026-11-19). Ett tal är ett mått: "120" är
// inte "1200". Tre bokstäver räcker som delsträng, för där står huvudet i
// sammansättningar som "elbil" och "hundbur".
//
// Förkortningar på tre eller fyra bokstäver står också för sig: "usb" står i
// "husbilstrappa" och "led" i "ledstång".
const FORKORTNINGAR = new Set(["usb", "led", "rgb", "pvc", "lcd", "gps", "mdf", "abs", "hdmi", "wifi"]);
const helord = (tok: string): boolean => tok.length <= 2 || /^\d+$/.test(tok) || FORKORTNINGAR.has(tok);

/** Börjar något ord i namnet med `s`? */
function ordBorjar(nameNorm: string, s: string): boolean {
  for (let i = nameNorm.indexOf(s); i >= 0; i = nameNorm.indexOf(s, i + 1)) {
    if (i === 0 || !BOKSTAV.test(nameNorm[i - 1])) return true;
  }
  return false;
}

/** Står `s` i namnet med skiljetecken (eller namnets kant) på båda sidor? */
function starSomOrd(nameNorm: string, s: string): boolean {
  for (let i = nameNorm.indexOf(s); i >= 0; i = nameNorm.indexOf(s, i + 1)) {
    const fore = i === 0 || !BOKSTAV.test(nameNorm[i - 1]);
    const efter = i + s.length >= nameNorm.length || !BOKSTAV.test(nameNorm[i + s.length]);
    if (fore && efter) return true;
  }
  return false;
}

/** Står frasen i namnet med en ordgräns före och/eller efter, där det krävs? */
function frasStar(nameNorm: string, q: string, fore: boolean, efter: boolean): boolean {
  for (let i = nameNorm.indexOf(q); i >= 0; i = nameNorm.indexOf(q, i + 1)) {
    const okFore = !fore || i === 0 || !BOKSTAV.test(nameNorm[i - 1]);
    const okEfter = !efter || i + q.length >= nameNorm.length || !BOKSTAV.test(nameNorm[i + q.length]);
    if (okFore && okEfter) return true;
  }
  return false;
}

// Färg, storlek och mått. De säger något OM varan, inte vad den är, och står
// ofta inte i namnet alls (färgen ligger i varans val). När inget namn har
// alla sökord är det dem som stryks först.
const EGENSKAPSORD = new Set([
  "svart", "svarta", "vit", "vita", "vitt", "grå", "gråa", "grått", "beige", "brun", "bruna", "brunt", "grön", "gröna",
  "grönt", "blå", "blåa", "blått", "röd", "röda", "rött", "rosa", "gul", "gula", "gult", "lila", "orange", "silver",
  "guld", "krämvit", "cremevit", "antracit", "mörkgrå", "ljusgrå", "turkos", "transparent",
  "xs", "xl", "xxl", "xxxl", "liten", "litet", "små", "stor", "stort", "stora", "mini", "maxi",
  "cm", "mm", "kg", "liter", "st", "pack", "tum",
  // Måttens ord (2026-11-19). "byrå 60 cm bred" och "skrivbord 85 cm bred"
  // ströks ner till "byrå bred" och "skrivbord bred": en byrå och en
  // skrivbordsstol "55 cm bred". Orden säger något om måttet, inte om varan.
  "bred", "breda", "brett", "bredd", "djup", "djupt", "djupa", "hög", "högt", "höga", "höjd",
  "lång", "långt", "långa", "längd", "smal", "smalt", "smala", "låg", "lågt", "låga", "rund", "runt", "runda",
]);
// Också med sista bokstaven dubblad: "gråå" och "svartt" är färgen felskriven,
// inte ett ovanligt varuord som ska överleva strykningen ("soffa gråå").
const arEgenskap = (tok: string): boolean =>
  EGENSKAPSORD.has(tok) || /^\d+([.,]\d+)?(cm|mm|m|kg|l|w|v)?$/.test(tok) || (tok.length >= 4 && EGENSKAPSORD.has(tok.replace(/(.)\1+$/, "$1")));

// Ord som beskriver varan utan att säga vad den är: "hopfällbar", "golvstående",
// "elektrisk", "vägghängd", "justerad", "sladdlös". Känns igen på ändelsen.
// Bara för valet av vilka sökord som stryks (rankaMedInfo).
const BESKRIVNING = /(?:bar|bart|bara|ande|ende|isk|iskt|iska|lig|ligt|liga|ig|igt|iga|hängd|hängt|hängda|erad|erat|erade|formad|formade|klädd|klätt|klädda|fri|fritt|fria|lös|löst|lösa)$/;
// Inte varorna som råkar sluta likadant: en bardisk är ingen "-isk", och en
// kaffebar ingen "-bar" (BARER).
const arBeskrivning = (tok: string): boolean => tok.length >= 6 && BESKRIVNING.test(tok) && !tok.endsWith("disk") && !BARER.includes(tok);

// Namnet med bindestrecken inne i ord borttagna: "tv-bänkar" blir "tvbänkar".
// Bara för kategorinamnen (kategoriPoang); i varunamnen går samma sak genom
// fogarna nedan, som håller reda på var delarna börjar och slutar.
const utanBindestreck = (n: string): string => (n.includes("-") ? n.replace(/([a-zåäö0-9])-(?=[a-zåäö0-9])/g, "$1") : n);

// `fogat` är namnet med fogar (medFogar) när det har ett bindestreck inne i
// ett ord, annars tomt. Ett sökord som står sammanskrivet över en fog träffar
// som ett helt ord: sammanskrivet-ledet tar "tvbänk" som ensamt sökord, och
// här gäller det ordet i en sökning med flera ("svart tvbänk" gav sittbänkar
// 2026-11-19, för stavfelsledet låg ett fel från "sittbänk"). Samma villkor
// som där: "topp" är inte "top-p…" i "Hardtop-paviljong".
/** Över ordet utanför huvuddelen (90), under ordet i huvuddelen (100). */
const ENVAGS_I_HUVUDDELEN = 92;

/**
 * Står något av det envägsordet pekar på i texten? BARA `ENVAGS`, inte
 * synonymgrupperna: prövat på båda 2026-11-19 ändrades ordningen i 210 av
 * 4 443 sökningar ("bokhylla", "cykel", "barstol"), och där är ordet i namnet
 * oftast rätt vara. Ett envägsord är kundens ord för varor som heter något
 * annat, så ordet i ett namn är oftast ett tillbehör.
 */
function envagsI(unit: Unit, text: string): boolean {
  for (const nd of ENVAGS_NALAR.get(unit.key) ?? []) if (text.includes(nd)) return true;
  return false;
}

// ☠️ EN DELSTRÄNG ÄR INTE ALLTID EN DEL AV ORDET (2026-11-19). "tall" stod i
// 284 namn med "metall", "last" i 98 med "plast", "skor" i "väskor", "sand" i
// "lysande", "torn" i "datorn" och "bil" i "mobil": den som sökte "El bil vit"
// fick en mobil bokvagn överst. Ett svenskt ord sätts ihop av hela ord, så
// det som står FÖRE träffen i samma ord ska vara ett ord. Ett eller två
// tecken är det nästan aldrig. Undantagen är de tvåbokstavsord som faktiskt
// bildar sammansättningar i katalogen (elbil, isbitar, gåvagn, sybord,
// ölkorg, ekskiva, höställ, åkbil), uttagna ur namnen samma dag. Tre tecken
// eller fler före träffen släpps igenom som förut: där är det oftast ett ord
// ("fotpall", "matbord", "julgran"). En siffra före räknas inte som bokstav.
const KORTA_FORLED = new Set(["el", "is", "gå", "sy", "öl", "ek", "hö", "åk", "rå", "så", "tv", "mc", "bi", "av"]);

// Samma slumpträff längre in i ett ord: "last" i "växthusPLAST", "tång" i
// "skivSTÅNG", "skor" i "sadelVÄSKOR". Där står tre tecken eller fler före,
// så regeln ovan släpper igenom dem. Orden här är de vanligaste i katalogen
// som slutar på (eller rymmer) ett annat sökbart ord utan att vara sammansatta
// av det. Står sökordet inne i ett av dem är det inte en träff.
//
// Påfyllt 2026-11-19 efter en genomgång av katalogens ord: "lås" gav 94
// uppBLÅSbara varor, "tyg" 86 VERKTYG, "ring" 250 varor med förvaRING och
// monteRING, "ask" 118 MASKiner, "hus" 31 varor för inomHUS- och utomHUSbruk
// och "stol" varenda limPISTOL. De fem sista är ändelser, inte ord: "ring"
// efter dem är slutet på ett verb ("montera" → "montering").
const BARARE = [
  "plast", "metall", "stång", "stall", "väska", "väskor", "flaska", "flaskor", "grenar", "klocka", "klockor", "linne",
  "blås", "verktyg", "fartyg", "mask", "vask", "inomhus", "utomhus", "pistol", "block", "plattform", "format",
  "transport", "stopp", "knapp", "klapp", "papp", "larm", "karm", "beslag", "fästen", "bassäng", "pingvin",
  "tratt", "grep", "stabil", "canvas", "program", "diagram", "kilogram", "makram", "badminton", "vätskor", "storlek",
  "ering", "varing", "öring", "ädring", "odring", "ådring", "ankring",
];

// Varvet utan prickar jämför "las" mot "uppblasbar": bärarorden gäller där
// också, skrivna på samma sätt.
let bararAlla: string[] | null = null;

/** Står träffen på plats `i` inne i ett av bärarorden (se BARARE)? */
function iBarare(text: string, s: string, i: number): boolean {
  bararAlla ??= [...new Set([...BARARE, ...BARARE.map(vik)])];
  for (const b of bararAlla) {
    const d = b.indexOf(s);
    if (d > 0 && i >= d && text.startsWith(b, i - d)) return true;
  }
  return false;
}

/** Står `s` i texten som ett ord, i början av ett ord eller efter ett helt förled? */
/** Får `s` börja på plats `i` i texten, med de bokstäver som står före? */
function forledOk(text: string, s: string, i: number): boolean {
  let j = i;
  while (j > 0 && i - j < 3 && BOKSTAV.test(text[j - 1])) j--;
  const fore = i - j;
  if (fore === 0) return true;
  const forled = text.slice(j, i);
  if (/\d/.test(forled)) return true;
  if (fore >= 3) return !iBarare(text, s, i);
  return fore === 2 && KORTA_FORLED.has(forled);
}

// ☠️ "-BAR" ÄR EN ÄNDELSE, INGEN BAR (2026-11-19). "bar" gav 2 206 träffar:
// varje hopfällBAR, justerBAR och uppblåsBAR vara i butiken. Efter andra
// bokstäver, och med högst "t" eller "a" efter sig, är "bar" slutet på ett
// adjektiv. De riktiga barerna i katalogen står här. Åt andra hållet får
// "lås" fortfarande träffa "låsbar" (den som skriver "bär" är oftast på väg
// mot "bärbar"), men sist i ordningen: se restArOrd.
const BARER = ["frukostbar", "hexbar", "hemmabar", "kaffebar", "minibar", "vinbar", "poolbar", "cocktailbar", "soundbar", "snackbar", "salladsbar", "juicebar", "utebar"];
const BAR_SLUT = /^(?:bar[ta]?)(?![a-zåäö0-9])/;
function barAdjektiv(text: string, s: string, i: number): boolean {
  if (s !== "bar" || i === 0 || !BOKSTAV.test(text[i - 1]) || !BAR_SLUT.test(text.slice(i, i + 5))) return false;
  return !BARER.some((b) => i + 3 >= b.length && text.startsWith(b, i + 3 - b.length));
}

function starIOrd(text: string, s: string): boolean {
  for (let i = text.indexOf(s); i >= 0; i = text.indexOf(s, i + 1)) {
    if (forledOk(text, s, i) && !barAdjektiv(text, s, i)) return true;
  }
  return false;
}

// ☠️ EN KORT STAM ÄR INGET SÖKORD (2026-11-19). "rosor" har stammen "ros", och
// den står i "rosa" och "rostfritt": 351 träffar, de flesta rostfria bänkar.
// "vaser" gav tvättVASKar, "burar" BURKar, "ramar" RAMPer och "pilar"
// PILATESringar. Kunden skrev ett helt böjt ord, så grundformen är känd: den
// ska stå som ett ord eller sist i ett ("Konstgjord ros", "Elbil"), med högst
// en ändelse efter ("bilar", "bilen"). För en grundform på högst tre tecken
// inte ett ensamt a, e, n, s eller t: "ros" + "a" är en färg och "ros" + "t"
// är rost.
/** Står grundformen `s` som ett ord eller sist i ett ord, med högst en böjningsändelse efter? */
function ordStar(text: string, s: string): boolean {
  const kort = s.length <= 3;
  for (let i = text.indexOf(s); i >= 0; i = text.indexOf(s, i + 1)) {
    const efter = /^[a-zåäö0-9]*/.exec(text.slice(i + s.length))![0];
    if ((efter === "" || (BOJNING.has(efter) && (!kort || efter.length > 1))) && forledOk(text, s, i)) return true;
  }
  return false;
}

function tokenQuality(unit: Unit, nameNorm: string, lage: Lage, namnVikt: string, stavfelOk = true, fogat = ""): Ordtraff {
  const { stem: s, key } = unit;
  if (unit.helord) {
    if (starSomOrd(nameNorm, s)) return HEL;
    // "el bil" är "elbil", "sy bord" är "sybord": ett kort ord som kunden
    // särskrivit får stå ihop med ordet efter, i början av ett ord i namnet.
    return unit.ihopNasta && ordBorjar(nameNorm, unit.ihopNasta) ? HEL : INGEN;
  }
  if (unit.kortStam ? starIOrd(nameNorm, unit.tok) || ordStar(nameNorm, s) : starIOrd(nameNorm, s)) return HEL;
  if (unit.former) for (const f of unit.former) if (starIOrd(nameNorm, f)) return HEL;
  if (unit.fogRe && fogat && sammanskrivet(fogat, unit.fogRe, false).var) return HEL;
  const needles = SYN.get(key);
  if (needles) {
    for (const nd of needles) if (nameNorm.includes(nd)) return SYNONYM;
  }
  const envags = ENVAGS_NALAR.get(key);
  if (envags) {
    for (const nd of envags) if (nameNorm.includes(nd)) return SYNONYM;
  }
  if (lage >= VIKT && starIOrd(namnVikt, unit.vikt)) return UTAN_PRICKAR;
  if (lage >= STAVFEL && stavfelOk && s.length >= 5) {
    const fel = fuzzyOrdslut(s, nameNorm, s.length >= 7 ? 2 : 1);
    if (fel === 1) return ETT_FEL;
    if (fel === 2) return TVA_FEL;
  }
  return INGEN;
}

// Småord som inte säger vad varan är. De krävs inte i namnet när sökningen har
// andra ord: "fåtölj med uppresning" ska hitta "Uppresningsfåtölj i grå frotté",
// som saknar "med" (1 400 av 4 184 namn gör det). "utan" är INTE med, för
// "fåtölj utan massage" får inte bli "fåtölj massage". Hela frasen jämförs
// fortfarande med småorden kvar, så en exakt fras ger 100 som förut.
//
// Sedan 2026-11-19 också ord som hör till frågan och inte till varan: "billig
// soffa", "soffa under 2000 kr", "köp julgran". Förut räknades "under" som ett
// sökord och gav 692 träffar med "förvaring under sitsen" överst.
const STOPWORDS = new Set([
  "med", "och", "för", "till", "på", "av", "en", "ett", "som", "från",
  "under", "över", "billig", "billiga", "billigt", "bra", "bästa", "köp", "köpa", "kr", "kronor",
  // "barnkök rea" och "massagebänk rea" gav julgirlanger med REAlistiska
  // barrgrenar (2026-11-19): ordet hör till frågan, inte till varan.
  "rea", "rean", "billigast", "billigaste", "erbjudande",
]);

// `ihop` är sökorden skrivna som ett ord ("laser tag" → "lasertag") som
// mönster, med prickarna kvar och utan. Null när det blir för kort.
type Ihop = { re: RegExp; reVikt: RegExp; flerOrd: boolean };
// `kantFore` och `kantEfter`: sökningens första respektive sista ord är ett
// kort ord eller ett tal (helord), så hela frasen ska börja respektive sluta
// vid en ordgräns i namnet. "skrivbord 120" står inte i "Skrivbord 1200 mm".
// `former`: ett ENSAMT sökord i alla sina böjningar, ordet som kunden skrev
// först ("stolar" → "stolar", "stol"). Sätts av rankaMedInfo, som vet vilka
// former katalogen har (se ensamtOrdsFormer).
// `egna`: orden som står för sig i katalogens namn, för ordningen (se kant).
type Prepared = { q: string; units: Unit[]; ihop: Ihop | null; kantFore: boolean; kantEfter: boolean; former?: string[]; egna?: () => Set<string> };

// ☠️ STAMMEN ÄR INTE ALLTID ORDET (2026-11-19). "träning" har stammen "trä" och
// gav 910 träffar, de flesta möbler i trä. "matare" blev "mat" (437 träffar
// med matbord), "krona" blev "kro" (krokar och krom) och "höger" blev "hög".
// Ändelsen som togs bort var ingen böjning utan en avledning ("-ning",
// "-are") eller en del av ordet. En stam på högst tre tecken gäller därför
// bara efter en riktig böjningsändelse ("bilar" → "bil", "huset" → "hus"),
// och orden i INTE_BOJT stammas inte alls.
//
// Efter en avledning gäller det också stammar på fyra tecken: en "laddare" är
// ingen "laddbar lampa", en "hängare" ingen "hängmatta", och "packning" gav
// varenda vara i "2-pack".
const BOJDA_SLUT = new Set(["ar", "er", "or", "en", "et", "arna", "erna", "orna"]);
const AVLEDNING = new Set(["andet", "ningen", "heten", "ande", "else", "ning", "het", "are", "ast"]);
function sokstam(tok: string): string {
  if (INTE_BOJT.has(tok)) return tok;
  const s = stem(tok);
  if (s === tok) return s;
  const andelse = tok.slice(s.length);
  // En lång stam bär ordet även efter en avledning: "basketställning" och
  // "basketställ" är samma vara, "upphängning" hör ihop med "upphängd".
  if (AVLEDNING.has(andelse)) return s.length <= 4 ? tok : s;
  return s.length <= 3 && !BOJDA_SLUT.has(andelse) ? tok : s;
}

// Sökordet tolkas EN gång per sökning. nameMatch gjorde det förr per vara, alltså
// 4 184 gånger per tangent.
function prepare(query: string): Prepared {
  const q = normalize(query);
  const alla = tokenize(q)
    .map((t) => ({ tok: t, stem: sokstam(t), key: canon(t) }))
    .filter((u) => u.stem.length >= 2);
  const innehall = alla.filter((u) => !STOPWORDS.has(u.tok));
  const units: Unit[] = (innehall.length > 0 ? innehall : alla).map(({ tok, stem: s, key }) => {
    const u: Unit = {
      stem: s, key, vikt: vik(s), tok, helord: helord(tok), egenskap: arEgenskap(tok),
      fogRe: s.length >= KORTASTE_SAMMANSKRIVET ? ihopMonster(s) : null,
    };
    if (!u.helord && !u.egenskap) {
      // "rosor" är inte "rosa": en form som är en färg, ett mått eller ett
      // småord är ett annat ord.
      const former = INTE_BOJT.has(tok) ? [] : bojdaFormer(tok).filter((f) => !arEgenskap(f) && !STOPWORDS.has(f));
      if (former.length > 0) u.former = former;
      if (s.length <= 3 && s !== tok) u.kortStam = true;
    }
    return u;
  });
  for (let i = 0; i < units.length - 1; i++) {
    const u = units[i];
    const nasta = units[i + 1];
    if (u.helord && !u.egenskap && /^[a-zåäö]+$/.test(u.tok) && /^[a-zåäö]/.test(nasta.tok) && nasta.stem.length >= 3) u.ihopNasta = u.tok + nasta.stem;
  }
  const ord = tokenize(q);
  const ihop = ord.join("");
  return {
    q,
    units,
    kantFore: ord.length > 0 && helord(ord[0]),
    kantEfter: ord.length > 0 && helord(ord[ord.length - 1]),
    ihop: ihop.length >= KORTASTE_SAMMANSKRIVET
      ? { re: ihopMonster(ihop), reVikt: ihopMonster(vik(ihop)), flerOrd: ord.length > 1 }
      : null,
  };
}

// Produktnamnen skrivs "Vad det är – detaljer" ("Klösträd 200 cm med sex
// nivåer – tre grottor och hängmatta"). Huvuddelen är texten före första
// tankstreck, komma eller " med "/" för "/" till ". En fras som bara finns i
// resten beskriver ett tillbehör eller en egenskap, inte varan: "matta" i
// "…och hängmatta" eller "soffa" i "Sidobord för soffan".
// Sedan 2026-11-19 slutar huvuddelen också vid "i", "på", "som", "under",
// "över", "av", "mot", "vid", "från" och en parentes: efter dem står material,
// plats och användning. "kruka" ska visa krukor före "Konstgjord växt i
// kruka", och "säng" sängar före "Förvaring under sängen". Kommat ska följas
// av ett mellanslag: "1,5 m" är ett tal, inget skiljetecken.
const HUVUDDEL_SLUT = / [–—-] |[,:] | \(| (?:med|för|till|utan|i|på|som|under|över|av|mot|vid|från) /;
function mainPart(nameNorm: string): string {
  const cut = nameNorm.search(HUVUDDEL_SLUT);
  return cut >= 0 ? nameNorm.slice(0, cut) : nameNorm;
}

// Svenska sammansättningar har huvudet SIST: en kontorsstol är en stol, en
// lyktstolpe är det inte, och en bordslampa är en lampa och inget bord. Inom
// samma poäng går därför namn där sökordet slutar ett ord ("kontorsstol",
// "stolar", "TV-bänk") först, sedan namn där ett ord börjar med det (den som
// skriver "kontorss" är på väg mot "Kontorsstol"), och sist resten ("stolpe",
// "bordslampa", och "två" eller "viktväst" för "tv"). Efter sökordet får bara en
// böjningsändelse följa. Ett sökord på högst tre tecken räknas som huvud bara
// som eget ord, utan ändelse: "upp" är inte huvudet i "grupp", och "bar" varken
// i "hopfällbar" eller i "barn".
// Det ändrar bara ordningen, aldrig vilka varor som visas.
//
// Sedan 2026-11-19 bara BÖJNINGAR, inte avledningar och inte ett ensamt s:
// en "bockare" är ingen bock, en "laddare" ingen ladd och en "krans" ingen
// kran. Förut gick rörbockaren före sågbockarna och dörrkransen före kranarna.
const BOJNING = new Set<string>(["erna", "arna", "orna", "en", "et", "ar", "er", "or", "na", "an", "n", "t", "a", "e", "set"]);
const BOKSTAV = /[a-zåäö0-9]/;

//
// Sedan 2026-11-19 räknas också VAR i namnet ordet står. Huvuddelen (före
// "med", "för", komma och tankstreck) säger vad varan ÄR, resten vad den har:
// "Star" gav en bollkastare ("kaSTARe") före tältet Star River, "bord" en
// bordsduk "för rektangulärt bord" före matborden, och "stolar" fyra
// matgrupper "… och fyra stolar" före varenda kontorsstol.
/**
 * Hur sökordet står i namnet, bara för ordningen inom samma poäng:
 * 6 = eget ord i huvuddelen ("Bord i ek"), 5 = slutar ett ord i huvuddelen
 * ("Matbord"), 4 = eget ord efter huvuddelen ("… för barn"), 3 = slutar ett
 * ord efter huvuddelen ("… med soffbord"), 2 = börjar en sammansättning vars
 * rest är ett ord i katalogen ("Barstol", "Skohylla"), 1 = börjar ett annat
 * ord ("Barn", "Skopa") eller står som enhet efter ett tal ("135 bar"),
 * 0 = mitt i ett ord.
 */
function kant(nameNorm: string, s: string, egna?: () => Set<string>): number {
  let bast = 0;
  let huvudSlut = -2;
  const kort = s.length <= 3;
  for (let i = nameNorm.indexOf(s); i >= 0 && bast < 6; i = nameNorm.indexOf(s, i + 1)) {
    const borjar = i === 0 || !BOKSTAV.test(nameNorm[i - 1]);
    const efter = /^[a-zåäö0-9]*/.exec(nameNorm.slice(i + s.length))![0];
    const slutar = efter === "" || (!kort && BOJNING.has(efter));
    let k = borjar ? 1 : 0;
    if (slutar && (borjar || !kort)) {
      if (!(borjar && ENHETSORD.has(s) && /\d ?$/.test(nameNorm.slice(Math.max(0, i - 2), i)))) {
        if (huvudSlut === -2) huvudSlut = nameNorm.search(HUVUDDEL_SLUT);
        k += huvudSlut < 0 || i < huvudSlut ? 5 : 3;
      }
    } else if (borjar && egna && efter.length >= 3 && restArOrd(efter, egna())) k = 2;
    if (k > bast) bast = k;
  }
  return bast;
}

// Ord som efter ett tal är en enhet och ingen vara: "Högtryckstvätt 135 bar"
// är ingen bar, och "Domkraft 3 ton" ingen färgton.
const ENHETSORD = new Set(["bar", "ton", "tum", "liter", "watt", "volt", "grader", "varv", "gram", "lux", "lumen", "psi"]);

/** Börjar resten av en sammansättning med ett ord som står för sig i katalogen (med eller utan foge-s)? */
function restArOrd(rest: string, egna: Set<string>): boolean {
  // "låsbar" är inget lås med en bar: "-bar" är adjektivets ändelse.
  if (/^bar[ta]?$/.test(rest)) return false;
  for (const r of rest.startsWith("s") ? [rest, rest.slice(1)] : [rest]) {
    for (let n = Math.min(r.length, 14); n >= 3; n--) if (egna.has(r.slice(0, n))) return true;
  }
  return false;
}

/** Orden på tre tecken eller fler som står för sig i något namn. */
function egnaOrd(namn: readonly string[]): Set<string> {
  const ord = new Set<string>();
  for (const n of namn) for (const t of tokenize(n)) if (t.length >= 3 && /^[a-zåäö]+$/.test(t)) ord.add(t);
  return ord;
}

/**
 * Sista ledet i katalogens sammansättningar: resten av ett ord vars början
 * står för sig ("möbel" i "hallmöbel", för "hall" är ett eget ord; "innar" i
 * "sittpinnar" är det inte, för "sittp" är inget ord). Foge-s räknas:
 * "kontors|stol". Bara för att pröva böjda former (forberedSokning): början
 * kan vara ett annat ord än det ser ut ("bar|nbord"), så leden säger inte
 * vad som är en sammansättning.
 */
function sistaLed(egna: ReadonlySet<string>): Set<string> {
  const led = new Set<string>();
  for (const t of egna) {
    for (let k = 3; k <= t.length - 3; k++) {
      if (egna.has(t.slice(0, k)) || (t[k - 1] === "s" && k >= 4 && egna.has(t.slice(0, k - 1)))) led.add(t.slice(k));
    }
  }
  return led;
}

/** Sökordets bästa ordgräns i namnet, över stammen och de böjda formerna. */
function kantFor(nameNorm: string, u: Unit, egna?: () => Set<string>): number {
  let bast = kant(nameNorm, u.stem, egna);
  if (u.tok !== u.stem && bast < 6) bast = Math.max(bast, kant(nameNorm, u.tok, egna));
  if (u.former) for (const f of u.former) if (bast < 6) bast = Math.max(bast, kant(nameNorm, f, egna));
  return bast;
}

export type NameMatch = {
  /** 0 = ingen träff; se nameScore för skalan. */
  score: number;
  /** Sant när VARJE sökterm hittades (exakt, synonym eller stavfel). */
  full: boolean;
  /** Sant när minst en term bara hittades via stavfelstoleransen. */
  stavfel?: boolean;
  /** Flest stavfel i ett enskilt sökord (1 eller 2) när stavfel är sant. */
  fel?: number;
  /** Sant när träffen krävde att å, ä och ö jämfördes som a och o. */
  vikt?: boolean;
  /** Sämsta ordgränsen bland de exakta träffarna (se kant). Bara för ordningen. */
  kant?: number;
  /** Vilka sökord (bitar som i `mask`) som står som ord eller sist i ett ord, eller träffade på annat sätt än ordagrant. */
  stark?: number;
  /** Vilka sökord som träffade, en bit per ord i sökningens ordning. Saknas
   *  när hela frasen eller de sammanskrivna orden träffade (då är alla med). */
  mask?: number;
};

// Hur väl matchar `query` ett produktNAMN?
//   100 — hela söksträngen finns i namnets huvuddel ("vinöppnare")
//    95 — sökorden finns sammanskrivna i huvuddelen ("laser tag" → "Lasertag-set",
//         "tvbänk" → "TV-bänk"); 93 när det dessutom krävde att prickarna veks
//    90 — hela söksträngen finns, men bara efter huvuddelen ("…med hängmatta")
//    88 — sammanskrivet, men bara efter huvuddelen; 86 med prickarna vikta
//    60 — alla söktermer matchar exakt (compound-aware: "knivset"→"kniv" i
//         "knivhållare", "halsband" i "kedjehalsband")
//   ~57 — alla söktermer matchar men minst en bara utan prickar ("fatolj")
//   ~51 — alla söktermer matchar men minst en via synonym ("mtb"→cykel)
//   ~36 — alla söktermer matchar men minst en via stavfelstolerans ("cyckel"→cykel),
//         ~30 när ordet har två fel
//   1–59 — bara några termer matchade (delvis), proportionellt & kvalitetsviktat
//
// `katalog` är alla namn, normaliserade (normalize). Med den prövas sökordet
// mot katalogen som i rankByName: böjda former som finns, och vilka ord som
// står för sig (se forberedSokning). Utan den jämförs namnet för sig.
export function nameMatch(name: string, query: string, katalog?: readonly string[]): NameMatch {
  return matchPrepared(normalize(name), katalog ? forberedSokning(query, katalog) : prepare(query), STAVFEL);
}

/**
 * Sökningen tolkad och prövad mot katalogens namn: de böjda formerna som
 * något namn har som eget ord, alla former av ett ensamt sökord, och orden
 * som står för sig (för ordningen, se kant).
 */
function forberedSokning(query: string, namn: readonly string[]): Prepared {
  const sparat = formerFor(namn);
  const egna = () => (sparat.egna ??= egnaOrd(namn));
  const p = prepare(query);
  // "inne" blir annars "innar", som står i "sittPINNAR". En form som inget
  // namn har som eget ord eller som sista led är inget ord.
  const led = () => (sparat.led ??= sistaLed(egna()));
  for (const u of p.units) if (u.former) u.former = u.former.filter((f) => egna().has(f) || led().has(f));
  p.egna = egna;
  // Entalet av ett ensamt sökord finns när det står för sig, är ett sista led,
  // eller (fyra tecken och uppåt) avslutar något ord: "stol" i "kontorsstol".
  if (p.units.length === 1) {
    p.former = ensamtOrdsFormer(p.units[0], () => {
      const ord = egna();
      const slut = (sparat.slut ??= [...ord].filter((t) => t.length >= 7));
      return (e: string) => ord.has(e) || (e.length >= 4 && slut.some((t) => t.endsWith(e)));
    });
  }
  return p;
}

// `fogatNamn` och `viktNamn` är namnet med fogar (medFogar) och utan prickar
// (vik). rankByName räknar dem en gång per namnlista och skickar in dem; utan
// dem räknas de här.
// `kanda` fylls i när den skickas med: sant för varje sökord som träffade
// UTAN stavfel. `stavfelOk` säger per sökord om stavfelsledet får provas.
function matchPrepared(
  nameNorm: string, p: Prepared, lage: Lage, fogatNamn?: string, viktNamn?: string,
  kanda?: boolean[], stavfelOk?: readonly boolean[],
): NameMatch {
  const none = { score: 0, full: false };
  const { q, units, ihop } = p;
  if (!q || !nameNorm) return none;
  const fras = starIOrd(nameNorm, q) && ((!p.kantFore && !p.kantEfter) || frasStar(nameNorm, q, p.kantFore, p.kantEfter));
  if (fras && !p.former) {
    return { score: starIOrd(mainPart(nameNorm), q) ? 100 : 90, full: true, kant: kant(nameNorm, q, p.egna) };
  }
  // ETT ENSAMT SÖKORD ÄR SAMMA ORD I ALLA BÖJNINGAR (2026-11-19). "växter"
  // gav frasens 90 åt "spaljé för klätterväxter", där bokstäverna råkar stå,
  // och ordträffens 60 åt "Konstgjord växt": kunden fick spaljéer före
  // växterna. "stolar" gav matgrupper "… och fyra stolar" före varenda
  // kontorsstol. Formerna räknas därför som frasen, var och en för sig.
  if (p.former) {
    let k = -1;
    let iHuvud = false;
    // Ordet som kunden skrev får börja ett ord ("stol" → "Stolsdyna": hon kan
    // vara på väg dit). De andra formerna är härledda ur ett helt ord och ska
    // stå som ord: "pilar" är inte "Pilatesboll" och "dukar" inte
    // "Nattduksbord".
    for (let n = 0; n < p.former.length; n++) {
      const f = p.former[n];
      const star = n === 0 ? starIOrd : ordStar;
      if (!star(nameNorm, f)) continue;
      k = Math.max(k, kant(nameNorm, f, p.egna));
      iHuvud ||= star(mainPart(nameNorm), f);
    }
    // Står sökningen med sina småord i namnet ("fåtölj med" i "Fåtölj med
    // fotpall") går det namnet först: kunden skriver sig mot just de varorna.
    if (k >= 0) return { score: (iHuvud ? 100 : 90) + (fras && q !== p.former[0] ? 1 : 0), full: true, kant: k };
  }
  // Sammanskrivet: flera sökord som ett ord i namnet, eller ett sökord över
  // ett bindestreck i namnet.
  const fogat = ihop ? (fogatNamn ?? medFogar(nameNorm)) : "";
  if (ihop && (ihop.flerOrd || fogat !== nameNorm)) {
    const t = sammanskrivet(fogat, ihop.re, ihop.flerOrd);
    if (t.var) return { score: t.var === 2 ? 95 : 88, full: true, kant: t.slutarOrd ? 5 : 1 };
  }
  const vikt = lage >= VIKT ? (viktNamn ?? vik(nameNorm)) : "";
  if (ihop && lage >= VIKT && (ihop.flerOrd || fogat !== nameNorm)) {
    const t = sammanskrivet(vik(fogat), ihop.reVikt, ihop.flerOrd);
    if (t.var) return { score: t.var === 2 ? 93 : 86, full: true, kant: t.slutarOrd ? 5 : 1, vikt: true };
  }
  if (units.length === 0) return none;
  let sum = 0;
  let hit = 0;
  let fel = 0;
  let utanPrickar = false;
  // Ordgränsen räknas på orden som säger vad varan ÄR. Färg och mått ska
  // bara finnas: "soffa grå" ska inte sätta "Hörnsoffa i grått tyg" före
  // "Soffa 3-sits, grå" för att färgen står efter kommat.
  const baraEgenskaper = units.every((u) => u.egenskap);
  let kanter = 6;
  let mask = 0;
  let stark = 0;
  const fogatU = nameNorm.includes("-") ? (fogat || medFogar(nameNorm)) : "";
  const fogatOrd = fogatU !== nameNorm ? fogatU : "";
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    const t = tokenQuality(u, nameNorm, lage, vikt, stavfelOk ? stavfelOk[i] : true, fogatOrd);
    sum += t.qual;
    if (t.qual > 0) {
      hit++;
      if (i < 31) mask |= 1 << i;
      if (kanda && t.fel === 0) kanda[i] = true;
    }
    if (t.fel > fel) fel = t.fel;
    if (t.vikt) utanPrickar = true;
    if (t.qual === 1 && (baraEgenskaper || !u.egenskap)) {
      const k = kantFor(nameNorm, u, p.egna);
      kanter = Math.min(kanter, k);
      if (k >= 3 && i < 31) stark |= 1 << i;
    } else if (t.qual > 0 && i < 31) stark |= 1 << i;
  }
  if (sum === 0) return none;
  // ETT ENVÄGSORD, OCH VARAN HETER NÅGOT ANNAT (2026-11-19). "utemöbler" gav
  // tre skyddsöverdrag "för utemöbler" före varenda trädgårdsbord och
  // loungegrupp: ordet i namnet gav 90 och envägsträffen 51. Står varans typ
  // i namnets HUVUDDEL (före "för", "med", "till", komma och tankstreck) är
  // varan det kunden söker, och den går före ett tillbehör som nämner ordet.
  if (units.length === 1 && sum === SYNONYM.qual && envagsI(units[0], mainPart(nameNorm))) {
    return { score: ENVAGS_I_HUVUDDELEN, full: true, kant: 5, mask };
  }
  // Perfekt täckning (alla exakta) → 60, samma tak som förr. Synonym-/stavfel-
  // tokens bidrar <1 så de landar strax under en likvärdig exakt träff.
  const m: NameMatch = { score: Math.max(1, Math.round((sum / units.length) * 60)), full: hit === units.length, stavfel: fel > 0, kant: kanter, mask, stark };
  if (fel > 0) m.fel = fel;
  if (utanPrickar) m.vikt = true;
  return m;
}

export function nameScore(name: string, query: string): number {
  return nameMatch(name, query).score;
}

// Rankar en lista på namn-relevans — delad av autocomplete och /sok så att
// "Visa alla resultat" visar samma sak som förslagen, bara fler.
//
// DELTRÄFFAR BARA SOM RESERV. "solcell lampa" gav förr 114 träffar: 15
// solcellslampor och -lyktor, och sedan 99 vanliga golv- och bordslampor som
// bara matchade "lampa". Finns det minst en vara som matchar VARJE sökord
// visas bara sådana; annars (inget matchar allt) visas delträffarna som förut.
//
// STAVFEL BARA SOM RESERV, av samma skäl. Två fel tillåts i långa ord, så
// "hundvagn" matchade "handtag" och "hundtand": 17 hundvagnar och sedan
// nattduksbord, skänkar och gunghästar (extern audit 2026-10-07). Finns det
// träffar utan stavfel visas bara de; "cyckel" hittar fortfarande cyklar.
//
// ☠️ TVÅ VARV, OCH SVARET ÄR DETSAMMA SOM I ETT (2026-10-14). Stavfelsledet är
// det dyra (fuzzyContains är O(sökord × namn)), och regeln ovan slänger ändå
// varje stavfelsträff så fort en vara matchar alla sökord utan stavfel. Första
// varvet räknar därför utan stavfel. Finns en hel träff där är det exakt den
// mängd ett varv med stavfel hade behållit, med samma poäng i samma ordning: en
// vara som är hel utan stavfel är hel utan stavfel även med det, och en vara som
// bara blir hel genom ett stavfel slängs av regeln. Annars räknas allt om med
// stavfel, som förut. Ett test jämför med den gamla definitionen.
//
// `normNamn` är namnen redan normaliserade, i items ordning. Sökrutorna skickar
// in dem (rankaForslag i lib/sok-index.ts), så att hela katalogens namn inte
// görs om vid varje tangent.
export function rankByName<T>(items: T[], nameOf: (item: T) => string, query: string, normNamn?: readonly string[]): T[] {
  return rankaMedInfo(items, nameOf, query, normNamn).traffar;
}

/**
 * Träffarna, och hur de kom till:
 *   `strukna` är sökord som ströks för att få någon träff alls (tomt annars).
 *   `utan` och `hela` är satta när listan fyllts på: de första `hela`
 *     träffarna har alla sökord, resten saknar färgen eller måttet i `utan`.
 *   `rattat` är sökningen med stavningen rättad, när träffarna gäller den
 *     ("ellamin" → "elkamin"). Sidan säger då vad den visar.
 *   `liknande` är satt när inget namn har sökordet och träffarna bara ligger
 *     nära det i stavning. Sidan säger det, i stället för att låtsas.
 */
export type Sokutfall<T> = { traffar: T[]; strukna: string[]; utan?: string[]; hela?: number; rattat?: string; liknande?: true };

/** Färre hela träffar än så, och sökningen har en färg eller ett mått: fyll på. */
export const FYLL_PA_UNDER = 24;

/**
 * Orden att markera i en träff: sökorden som de skrevs, deras stammar och
 * böjda former, längst först. "speglar" markerar "spegel" i "Rund spegel",
 * och "stolar" markerar "stol" i "Kontorsstol". Småorden markeras inte.
 */
export function markeringsord(query: string): string[] {
  const ord = new Set<string>();
  for (const u of prepare(query).units) {
    ord.add(u.tok);
    if (u.stem.length >= 3) ord.add(u.stem);
    for (const f of u.former ?? []) ord.add(f);
  }
  return [...ord].filter((o) => o.length >= 2).sort((a, b) => b.length - a.length);
}

/**
 * Namnet delat i bitar för markering: bitarna på udda platser är träffar.
 * Samma spärrar som sökningen har: "bar" markeras inte i "hopfällBAR" och
 * "tyg" inte i "verkTYG", för där träffar sökningen inte heller. Förr
 * markerades bokstäverna var de än stod ("Hopfäll**bar** **bar**disk").
 */
export function markeraTraffar(namn: string, ord: readonly string[]): string[] {
  const text = namn.toLowerCase();
  if (text.length !== namn.length || ord.length === 0) return [namn];
  const bitar: string[] = [];
  let fran = 0;
  for (let i = 0; i < text.length; ) {
    const o = ord.find((x) => text.startsWith(x, i) && forledOk(text, x, i) && !barAdjektiv(text, x, i));
    if (!o) { i++; continue; }
    bitar.push(namn.slice(fran, i), namn.slice(i, i + o.length));
    i += o.length;
    fran = i;
  }
  bitar.push(namn.slice(fran));
  return bitar;
}

// rankByName med besked. `strukna` är sökord som inget namn har tillsammans
// med de andra: sökningen visar då träffarna för resten, och sidan säger det.
//
// ☠️ STAVFEL BARA FÖR ORD SOM INTE FINNS (2026-11-19). "hundbur xl" gav en
// hundbädd i XL och en hundtrappa, och ingen hundbur: inget namn har båda
// orden, så stavfelsledet gjorde "hundbur" till "hundbädd". Ett ord som står i
// katalogen (utan stavfel, med eller utan prickar, eller som synonym) är
// rättstavat och provas aldrig i stavfelsledet. `kanda` fylls i av de två
// första varven.
//
// ☠️ STRYKNING I STÄLLET FÖR DELTRÄFFAR (samma dag). När inget namn hade alla
// sökord visades förut allt som träffade NÅGOT ord, i katalogens ordning:
// "svart tv-bänk" gav en diskbänkslåda, en trädgårdsbänk och ett picknickset.
// Nu stryks ett ord i taget tills något namn har alla som är kvar:
//   1. ord som inte står i något namn alls,
//   2. färg, storlek och mått (EGENSKAPSORD) och korta ord som "el",
//   3. det vanligaste ordet (det säger minst).
// Kvar blir det som säger mest om vad kunden letar efter.
export function rankaMedInfo<T>(items: T[], nameOf: (item: T) => string, query: string, normNamn?: readonly string[]): Sokutfall<T> {
  const namn = normNamn ?? items.map((item) => normalize(nameOf(item)));
  const p = forberedSokning(query, namn);
  // Namnens övriga former räknas en gång per namnlista (sökrutorna skickar
  // samma lista vid varje tangent), och formen utan prickar först när första
  // varvet inte gett en hel träff.
  const sparat = formerFor(namn);
  const kanda: boolean[] = new Array(p.units.length).fill(false);
  const varv = (lage: Lage, sokning: Prepared = p, stavfelOk?: readonly boolean[]) => {
    const fogade = sokning.ihop ? (sparat.fogat ??= namn.map(medFogar)) : null;
    const vikta = lage >= VIKT ? (sparat.vikt ??= namn.map(vik)) : null;
    const k = sokning === p ? kanda : undefined;
    return items
      .map((item, i) => ({ item, ...matchPrepared(namn[i], sokning, lage, fogade ? fogade[i] : undefined, vikta ? vikta[i] : undefined, k, stavfelOk) }))
      .filter((r) => r.score > 0);
  };
  // Poängen först, sedan ordgränsen (kant). Sorteringen är stabil, så
  // katalogens ordning gäller mellan likvärdiga träffar.
  const sortera = (rader: ReturnType<typeof varv>) =>
    rader.sort((a, b) => b.score - a.score || (b.kant ?? 0) - (a.kant ?? 0)).map((r) => r.item);
  const hela = (rader: ReturnType<typeof varv>): Sokutfall<T> => ({ traffar: sortera(rader), strukna: [] });

  // FÄRG OCH MÅTT STÅR OFTA INTE I NAMNET. "svart tv-bänk" hade en enda hel
  // träff, en slutsåld bänk, fast butiken har 63 tv-bänkar och flera svarta:
  // färgen ligger i varans val. Är de hela träffarna färre än en skärm fylls
  // listan på med varorna som har resten av orden, efter de hela. Vilka ord
  // som då saknas i de påfyllda står i `utan`, så att sidan kan säga det.
  const karna = p.units.reduce((m, u, i) => (u.egenskap || i >= 31 ? m : m | (1 << i)), 0);
  const harEgenskap = p.units.some((u) => u.egenskap) && karna !== 0;
  const fyllPa = (rader: ReturnType<typeof varv>): Sokutfall<T> => {
    const fulla = rader.filter((r) => r.full);
    if (!harEgenskap || fulla.length >= FYLL_PA_UNDER) return hela(fulla);
    const ovriga = rader.filter((r) => !r.full && r.mask !== undefined && (r.mask & karna) === karna);
    if (ovriga.length === 0) return hela(fulla);
    return { traffar: [...sortera(fulla), ...sortera(ovriga)], strukna: [], utan: p.units.filter((u) => u.egenskap).map((u) => u.tok), hela: fulla.length };
  };

  const forsta = varv(EXAKT);
  if (forsta.some((r) => r.full)) return fyllPa(forsta);

  // UTAN PRICKAR SOM RESERV, före stavfelsledet (2026-11-10). "fatolj" är två
  // fel från "fåtölj" och sex tecken långt, så stavfelsledet (ett fel för 5–6
  // tecken) hittade ingenting, och "sangbord" låg lika nära "gamingbord" som
  // "sängbord". Finns en hel träff när å, ä och ö jämförs som a och o visas
  // bara de. Varvet är billigt (en delsträngsjämförelse per ord), så den som
  // skriver "fato…" slipper dessutom stavfelsledet vid varje tangent.
  const andra = varv(VIKT);
  if (andra.some((r) => r.full)) return fyllPa(andra);

  // Stavfelsledet, bara för ord som inget namn har. Är alla ord kända finns
  // inget att prova, och andra varvets rader gäller.
  const stavfelOk = kanda.map((k) => !k);
  // RÄTTA STAVNINGEN MOT KATALOGENS ORD, och säg det (2026-11-19). "Ellamin"
  // (en kunds sökning) gav 39 träffar med pendellampor och hyllplan i melamin:
  // stavfelsledet letar inne i namnen, och där ligger "pendELLAMPa" lika nära
  // som "elkamin". Ligger sökordet ett fel från ett ord som står för sig i
  // katalogen söks det ordet i stället, och utfallet säger vilket (`rattat`).
  if (stavfelOk.some(Boolean)) {
    const rattad = rattaStavning(p, stavfelOk, () => (sparat.antal ??= ordAntal(namn)));
    if (rattad && rattad !== p.q) {
      const u = rankaMedInfo(items, nameOf, rattad, namn);
      if (u.traffar.length > 0) return { ...u, rattat: u.rattat ?? rattad };
    }
  }
  const scored = stavfelOk.some(Boolean) ? varv(STAVFEL, p, stavfelOk) : andra;
  const medAlla = scored.filter((r) => r.full);
  if (medAlla.length > 0) {
    const kept = medAlla.some((r) => !r.stavfel) ? medAlla.filter((r) => !r.stavfel) : medAlla;
    // ETT STAVFEL FÖRE TVÅ. Två fel tillåts i ord på sju tecken eller fler, och
    // då låg "elkammin" lika nära "melamin" och "kammare" som "elkamin": 39
    // träffar med hyllplan och en fladdermusholk överst. Finns en träff där
    // inget ord har mer än ett fel visas bara sådana.
    if (kept.some((r) => r.fel !== 2)) {
      const visas = kept.filter((r) => r.fel !== 2);
      return visas.every((r) => r.stavfel) ? { ...hela(visas), liknande: true } : hela(visas);
    }
  }

  // ETT SAMMANSATT SÖKORD SOM RESERV, före träffarna med två stavfel
  // (2026-11-10). "barnbil" står inte i något namn, för varorna heter "Elbil
  // barn …" och "Åkbil för barn". Två fel tillåts i sju tecken, och då låg
  // ordet lika nära "barnbok", "barn i" och "bar vil": 118 träffar med en
  // barnbokhylla och en viltvagn överst. Går sökordet att dela i två ord som
  // båda står i katalogen, och finns varor med båda, visas de: "barn bil" ger
  // 84 elbilar, åkbilar och sparkbilar. Se delningar för villkoren.
  //
  // ☠️ EFTER ett stavfel, inte före. Ett felstavat ord går oftare att dela i
  // två riktiga ord än man tror: "matsolar" är "mat" och "solar", och gav en
  // fågelmatare med solpaneler i stället för matstolarna. Mätt på 1 050
  // felstavningar ur katalogen bytte 55 lista med delningen först, de flesta
  // till det sämre. Ett ord med ETT fel har nästan alltid sin rätta träff i
  // raden ovan, och kommer aldrig hit.
  for (const delad of delningar(p, () => (sparat.ord ??= kandaOrd(namn)))) {
    const sokning = forberedSokning(delad, namn);
    for (const lage of [EXAKT, VIKT] as const) {
      const rader = varv(lage, sokning);
      if (rader.some((r) => r.full)) return hela(rader.filter((r) => r.full));
    }
  }
  // Träffar där något ord har två stavfel (bara de är kvar av medAlla här).
  if (medAlla.length > 0) return { ...hela(medAlla), liknande: true };

  // INGET NAMN HAR ALLA SÖKORD. Visa varorna som har de VIKTIGASTE orden, och
  // säg vilka som ströks.
  //
  // ☠️ Förr ströks det vanligaste ordet först, tills något namn hade resten
  // (2026-11-19, Googles frågor mot butiken). "dieselvärmare husvagn" visade
  // stödben för husvagnar, "ihopfällbar stegpall" en campingtoalett och
  // "laser tag 4 player set" en bakverksdisplay ("disPLAY"): det ovanligaste
  // ordet blev kvar, hur lite det än sa om varan. Nu väljs den uppsättning ord
  // som något namn faktiskt har och som säger mest:
  //   - ett ord som säger vad varan är väger efter hur ovanligt det är i
  //     katalogen, och sökningens första sådana ord hälften mer
  //     ("dieselvärmare husvagn" är en värmare, "sängbord med laddare" ett
  //     sängbord). Ett mycket ovanligare ord vinner ändå: "elbil brandbil
  //     barn" visar brandbilarna,
  //   - färg, mått, tal, korta ord och beskrivande ord ("hopfällbar",
  //     "golvstående", "elektrisk") väger lite, men aldrig mer än varan,
  //   - ett ord som inget namn har väger ingenting.
  // Ett ord som bara BÖRJAR ett annat ord i namnet väger hälften:
  // "skrivbord 85 cm bred" ska inte välja "cm" och "bred" för att en
  // skrivbordsSTOL är 55 cm bred. Den hamnar sist bland skrivborden.
  const n = p.units.length;
  if (n < 2 || scored.length === 0) return { traffar: [], strukna: [] };
  const antal: number[] = new Array(n).fill(0);
  for (const r of scored) for (let i = 0; i < n && i < 31; i++) if ((r.mask ?? 0) & (1 << i)) antal[i]++;
  let forstaVaruordet = true;
  const vikter = p.units.map((u, i) => {
    if (antal[i] === 0 || i >= 31) return 0;
    if (u.egenskap || u.helord || arBeskrivning(u.tok)) return /^\d/.test(u.tok) ? 1.5 : 1;
    const ovanlighet = Math.max(1, Math.log(namn.length / antal[i]));
    const vikt = 2 + (forstaVaruordet ? ovanlighet * 1.5 : ovanlighet);
    forstaVaruordet = false;
    return vikt;
  });
  const varde = (r: { mask?: number; stark?: number }, bland: number): number => {
    const m = (r.mask ?? 0) & bland;
    let v = 0;
    for (let i = 0; i < n && i < 31; i++) if (m & (1 << i)) v += vikter[i] * ((r.stark ?? 0) & (1 << i) ? 1 : 0.5);
    return v;
  };
  const alla = n < 31 ? (1 << n) - 1 : 0x7fffffff;
  const masker = new Map<number, { varde: number; rader: number }>();
  for (const r of scored) {
    const m = r.mask ?? 0;
    if (m === 0) continue;
    const v = varde(r, alla);
    const f = masker.get(m);
    if (f) {
      f.rader++;
      if (v > f.varde) f.varde = v;
    } else masker.set(m, { varde: v, rader: 1 });
  }
  let behall = 0;
  let bast = { varde: 0, rader: 0 };
  for (const [m, f] of masker) {
    if (f.varde > bast.varde + 1e-9 || (Math.abs(f.varde - bast.varde) <= 1e-9 && f.rader > bast.rader)) {
      behall = m;
      bast = f;
    }
  }
  if (behall === 0) return { traffar: [], strukna: [] };
  const rader = scored
    .filter((r) => ((r.mask ?? 0) & behall) === behall)
    .sort((a, b) => varde(b, behall) - varde(a, behall) || b.score - a.score || (b.kant ?? 0) - (a.kant ?? 0));
  return { traffar: rader.map((r) => r.item), strukna: p.units.filter((_, i) => i >= 31 || !(behall & (1 << i))).map((u) => u.tok) };
}

// ── Ett sammansatt sökord delat i två ─────────────────────────────────────────
// Motsatsen till sammanskrivet: kunden skriver ett ord ("barnbil"), och
// katalogen har de två orden var för sig ("Elbil barn", "Åkbil för barn").

/** Ingen del får bli kortare än tre tecken, så sökord under sex delas aldrig. */
const KORTASTE_DEL = 3;

// Varje ord i namnen, också stammat och utan prickar. En del av sökordet är
// känd när den står här: "barn" och "bil" gör det, "elkam" (ur "elkammin") och
// "nbil" gör det inte. Ordet ska stå för sig i något namn: "bil" är känt för
// att 22 namn har ordet, inte för att "Elbil" slutar så. Mätt på 749
// felstavningar med två fel bytte en enda lista.
/**
 * Sökningen med de okända orden bytta mot katalogens närmaste ord, eller null
 * när något av dem inte har ett trovärdigt sådant. Trovärdigt: samma första
 * bokstav, ett fel (två när både sökordet och katalogordet är minst åtta
 * tecken), och bland lika nära det ord som står i flest namn. Korta ord,
 * tal, färger och mått rättas inte: där är ett fel lika ofta ett annat ord.
 */
function rattaStavning(p: Prepared, okanda: readonly boolean[], antal: () => Map<string, number>): string | null {
  const byten = new Map<string, string>();
  for (let i = 0; i < p.units.length; i++) {
    if (!okanda[i]) continue;
    const u = p.units[i];
    if (u.helord || u.egenskap || u.tok.length < 5 || !/^[a-zåäö]+$/.test(u.tok)) return null;
    const forsta = vik(u.tok[0]);
    let bast = "";
    let bastFel = 3;
    for (const [w, n] of antal()) {
      const skillnad = Math.abs(w.length - u.tok.length);
      if (skillnad > 2 || w.length < 4 || vik(w[0]) !== forsta || !/^[a-zåäö]+$/.test(w)) continue;
      const tak = u.tok.length >= 8 && w.length >= 8 ? 2 : 1;
      if (skillnad > tak) continue;
      // En tappad, dubblad eller omkastad bokstav är vanligare än en bytt:
      // "barnord" är "barnbord" (ett b saknas) hellre än "barbord" (n bytt
      // mot b). Bytet räknas därför som ett halvt fel till, en bytt vokal som
      // ett kvarts ("setsbord" är "satsbord"). Bland ungefär lika nära vinner
      // ordet som står i flest namn.
      const steg = ordAvstand(u.tok, w, tak);
      if (steg > tak || steg === 0) continue;
      const fel = steg + (skillnad === 0 && !sammaBokstaver(u.tok, w) ? (bytVokal(u.tok, w) ? 0.25 : 0.5) : 0) - 0.15 * Math.log(n);
      if (fel < bastFel) { bast = w; bastFel = fel; }
    }
    if (!bast) return null;
    byten.set(u.tok, bast);
  }
  if (byten.size === 0) return null;
  return tokenize(p.q).map((t) => byten.get(t) ?? t).join(" ");
}

/** Är första stället där två lika långa ord skiljer sig en vokal i båda? */
function bytVokal(a: string, b: string): boolean {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return /[aeiouyåäö]/.test(a[i]) && /[aeiouyåäö]/.test(b[i]);
  return false;
}

/** Har orden samma bokstäver, bara i annan ordning? */
function sammaBokstaver(a: string, b: string): boolean {
  return a.length === b.length && [...a].sort().join("") === [...b].sort().join("");
}

/** Redigeringsavståndet mellan två ord (byte, tillägg, borttag, omkastning). Över `tak`: tak + 1. */
function ordAvstand(a: string, b: string, tak: number): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > tak) return tak + 1;
  let fore2: number[] = [];
  let fore: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const rad: number[] = [i];
    let minst = i;
    for (let j = 1; j <= n; j++) {
      let v = Math.min(fore[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1), fore[j] + 1, rad[j - 1] + 1);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, fore2[j - 2] + 1);
      rad.push(v);
      if (v < minst) minst = v;
    }
    if (minst > tak) return tak + 1;
    fore2 = fore;
    fore = rad;
  }
  return fore[n];
}

/** I hur många namn varje ord står för sig. */
function ordAntal(namn: readonly string[]): Map<string, number> {
  const antal = new Map<string, number>();
  for (const n of namn) for (const t of new Set(tokenize(n))) antal.set(t, (antal.get(t) ?? 0) + 1);
  return antal;
}

// ── Böjningar som stammen inte når ──────────────────────────────────────────
// ☠️ "speglar" gav 6 träffar av butikens 126 speglar, "cyklar" 2 av 103 och
// "möbler" inga möbler alls (2026-11-19): stammen tar bort EN ändelse, och
// "spegl" står inte i "spegel". Åt andra hållet hittade "bordslampa" inte
// "Bordslampor 2-pack" och "matta" inte "Dräneringsmattor", för stammen rör
// inte ett slutande a. Tre av svenskans vanligaste böjningsklasser:
//   hylla → hyllor, kudde → kuddar, och spegel → speglar / möbel → möbler.
// Formerna är så egna att de inte behöver prövas mot katalogen: ett ord som
// inte finns ("stoel" och "stole" ur "stolar") står inte i något namn.
function bojdaFormer(tok: string): string[] {
  if (!/^[a-zåäö]{4,}$/.test(tok)) return [];
  if (tok.endsWith("a")) return [`${tok.slice(0, -1)}or`];
  if (tok.endsWith("e")) return [`${tok.slice(0, -1)}ar`];
  if (tok.length >= 5 && tok.endsWith("el")) return [`${tok.slice(0, -2)}lar`, `${tok.slice(0, -2)}ler`];
  const ut: string[] = [];
  const flertal = /^(.{2,})l(?:ar|er)(?:na)?$/.exec(tok);
  if (flertal) ut.push(`${flertal[1]}el`);
  // Åt andra hållet: lådor → låda, påsar → påse. Stammen ("låd", "pås") når
  // dem bara som en del av ett ord, och en kort stam får inte det.
  const or = /^(.{3,})or(?:na)?$/.exec(tok);
  if (or) ut.push(`${or[1]}a`);
  const ar = /^(.{3,})ar(?:na)?$/.exec(tok);
  if (ar) ut.push(`${ar[1]}e`);
  // Bestämd form: lådan → låda, soffan → soffa.
  if (/^.{3,}an$/.test(tok)) ut.push(tok.slice(0, -1));
  return ut;
}

/**
 * Entalen ett böjt ord kan komma av, efter svenskans vanliga mönster:
 * mattor → matta, stolar → stol, kuddar → kudde, växter → växt, och de
 * bestämda formerna (lampan → lampa, bordet → bord). Bara kandidater:
 * ensamtOrdsFormer behåller dem som katalogen har.
 */
function entalAv(ord: string): string[] {
  const ut: string[] = [];
  const prova = (slut: string, minst: number, ...nya: string[]) => {
    if (ord.endsWith(slut) && ord.length - slut.length >= minst) for (const n of nya) ut.push(ord.slice(0, -slut.length) + n);
  };
  prova("orna", 3, "a");
  prova("arna", 3, "", "e");
  prova("erna", 3, "");
  prova("or", 3, "a");
  prova("ar", 3, "", "e");
  prova("er", 3, "");
  prova("an", 3, "a");
  prova("en", 3, "", "e");
  prova("et", 3, "", "e");
  prova("n", 4, "");
  prova("t", 4, "");
  return ut;
}

// Ord som SER böjda ut men är sin egen grundform, och vars "ental" är en
// annan vara i butiken: ett filter är ingen filt, en racket inget rack och en
// raket inget rakt. Prövat mot katalogens ord 2026-11-19 (415 par, de här föll).
const INTE_BOJT = new Set([
  "filter", "racket", "raket", "paket", "staket", "planet", "poster", "lager", "master", "start",
  "medar", "håller", "höjer", "klarar", "sitter", "spelar", "banan",
  "höger", "vänster", "motor", "rotor", "dator", "meter", "liter", "timer", "ingen", "eller", "efter",
  // "laser" blev "las" och träffade "TSA-lås" och "säker last"; "player" blev
  // "play" och träffade "display"; "vinter" blev "vint" och träffade "vintage".
  "laser", "player", "locker", "grinder", "vinter", "center", "roller", "cooler", "speaker", "printer", "router",
  "burner", "heater", "washer", "tower", "power", "cover", "super", "poker", "fiber", "tiger", "läder", "väder",
  "finger", "pulver", "hammer", "mixer", "dimmer", "trimmer", "stepper", "spinner", "trainer", "holder", "cutter",
  "scanner", "radar", "sommar", "hammar",
]);

// "stegar" är stegen man klättrar på, inte stegen man tar: entalet "steg" är
// ett annat ord, och "stege" kommer ändå med som böjd form.
const INTE_ENTAL = new Set(["steg", "rak", "rack", "filt"]);

/**
 * Ett ensamt sökord i alla sina former, ordet som kunden skrev först. Entalet
 * tas bara med när katalogen har det (`antal` svarar), och aldrig ett småord,
 * en färg eller ett mått ("rosor" är inte "rosa", "medar" inte "med").
 */
function ensamtOrdsFormer(u: Unit, antal: () => (ord: string) => boolean): string[] | undefined {
  if (u.helord || u.egenskap || !/^[a-zåäö]+$/.test(u.tok)) return undefined;
  const former = [u.tok, ...(u.former ?? [])];
  if (!INTE_BOJT.has(u.tok)) {
    const finns = antal();
    for (const e of entalAv(u.tok)) {
      if (!former.includes(e) && finns(e) && !INTE_ENTAL.has(e) && !STOPWORDS.has(e) && !helord(e) && !arEgenskap(e)) former.push(e);
    }
  }
  return former;
}

function kandaOrd(namn: readonly string[]): Set<string> {
  const ord = new Set<string>();
  for (const n of namn) {
    for (const t of tokenize(n)) {
      if (t.length < KORTASTE_DEL) continue;
      const s = stem(t);
      ord.add(t).add(s).add(vik(t)).add(vik(s));
    }
  }
  return ord;
}

// Sökordet delat i två ord, som sökningar att prova i tur och ordning. Bara
// ett ensamt sökord delas, och bara där båda delarna är kända ord och inget av
// dem är ett småord ("till" i "tillbehör"). Den jämnaste delningen först: ju
// längre den kortaste delen är, desto mindre slump i träffen.
function delningar(p: Prepared, kanda: () => Set<string>): string[] {
  const ord = tokenize(p.q);
  if (ord.length !== 1 || ord[0].length < 2 * KORTASTE_DEL) return [];
  const t = ord[0];
  const ar = (x: string, k: Set<string>) => {
    const s = stem(x);
    return !STOPWORDS.has(x) && (k.has(x) || k.has(s) || k.has(vik(x)) || k.has(vik(s)));
  };
  const k = kanda();
  const ut: { a: string; b: string }[] = [];
  for (let i = KORTASTE_DEL; i <= t.length - KORTASTE_DEL; i++) {
    const a = t.slice(0, i);
    const b = t.slice(i);
    if (ar(a, k) && ar(b, k)) ut.push({ a, b });
  }
  const kortast = (d: { a: string; b: string }) => Math.min(d.a.length, d.b.length);
  return ut.sort((x, y) => kortast(y) - kortast(x)).map((d) => `${d.a} ${d.b}`);
}

// Namnlistans övriga former, sparade per lista: sökrutorna skickar samma
// normaliserade lista vid varje tangent (rankaForslag i lib/sok-index.ts).
type ListFormer = { fogat?: string[]; vikt?: string[]; ord?: Set<string>; antal?: Map<string, number>; egna?: Set<string>; led?: Set<string>; slut?: string[] };
const formCache = new WeakMap<readonly string[], ListFormer>();
function formerFor(namn: readonly string[]): ListFormer {
  let f = formCache.get(namn);
  if (!f) {
    f = {};
    formCache.set(namn, f);
  }
  return f;
}


// ── Kategorier som matchar en sökning ────────────────────────────────────────
// "utemöbler" gav åtta varor, två av de tre första skyddsöverdrag, fast
// kategorin Utemöbler har hundratals (2026-11-19). Sökrutan och söksidan visar
// därför också de kategorier vars NAMN matchar sökningen.
//
// Kategorinamnen står i plural ("Fåtöljer", "Soffor & bäddsoffor", "Speglar"),
// och delsträngsjämförelsen i tokenQuality räcker inte åt det hållet: "soffa"
// står inte i "soffor". Här jämförs orden i sin kanoniska form (canon), som är
// densamma för "soffa" och "soffor".

/** Är sökordet, i någon av sina former, huvudet i ordet (sist, med högst en böjningsändelse)? */
function huvudI(ord: string, u: Unit): boolean {
  if (ord.length <= u.stem.length) return false;
  return ordStar(ord, u.stem) || (u.tok !== u.stem && ordStar(ord, u.tok)) || (u.former ?? []).some((f) => ordStar(ord, f));
}

/** Poäng för hur väl ett kategorinamn matchar sökningen. 0 = inte alls. */
export function kategoriPoang(kategoriNamn: string, query: string): number {
  // Mjuka bindestreck (U+00AD) står i långa kategorinamn för radbrytningen.
  const namn = normalize(kategoriNamn.replace(/\u00ad/g, ""));
  // Orden som de står, och med bindestrecken borta: "TV-bänkar" är både
  // "tv" + "bänkar" och "tvbänkar".
  const raa = [...new Set([...tokenize(namn), ...tokenize(utanBindestreck(namn))])];
  const ord = raa.map(canon);
  // Färg, storlek och mått säger inget om kategorin: "svart tv-bänk" är TV-bänkar.
  const units = prepare(query).units.filter((u) => !u.egenskap);
  if (units.length === 0 || ord.length === 0) return 0;
  let summa = 0;
  for (const u of units) {
    let bast = 0;
    for (let i = 0; i < ord.length; i++) {
      const o = ord[i];
      if (o === u.key) bast = Math.max(bast, 3);
      // Huvudet i en sammansättning: "fåtölj" i "uppresningsfåtöljer".
      // ☠️ Som ett ORD sist i kategorins ord (ordStar), inte som bokstäver i
      // slutet (2026-11-19): "bar" gav "Baby & Småbarn", "tyg" gav Verktyg och
      // "ring" Badrumsrenovering och Förvaring. Samma spärrar som för
      // varunamnen gäller (BARARE), och "hus" hittar nu Växthus.
      else if (!u.helord && u.key.length >= 3 && huvudI(raa[i], u)) bast = Math.max(bast, 2);
      // Förledet: "kontor" i "kontorsstolar" och "hund" i "hundburar", och
      // sökordet som börjar med kategorins ord: "trädgårdsmöbler" och
      // "Trädgård". Förledet jämförs som kunden skrev det, inte i kanonisk
      // form: "soffa" blir kanoniskt "soff", som också inleder "soffbord".
      else if (!u.helord && u.tok.length >= 4 && (o.startsWith(u.tok) || (o.length >= 5 && u.key.startsWith(o)))) bast = Math.max(bast, 1);
      // "spegel" och "speglar" (canon "spegl") skiljer ett tecken.
      else if (!u.helord && u.key.length >= 5 && o.length >= 5 && Math.abs(o.length - u.key.length) <= 1 && fuzzyOrdslut(u.key, o, 1) === 1 && o[0] === u.key[0]) bast = Math.max(bast, 1);
    }
    if (bast < 2) {
      const nalar = [...(SYN.get(u.key) ?? []), ...(ENVAGS_NALAR.get(u.key) ?? [])];
      if (nalar.some((nd) => namn.includes(nd))) bast = 2;
    }
    if (bast === 0) return 0;
    summa += bast;
  }
  return summa;
}

/**
 * De kategorier som bäst matchar sökningen, högst `max`. Bäst poäng först,
 * sedan det kortaste namnet (den allmänna kategorin före den smala), sedan
 * listans egen ordning.
 */
export function matchaKategorier<K extends { name: string }>(query: string, kategorier: readonly K[], max = 3): K[] {
  if (normalize(query).length < 2) return [];
  return kategorier
    .map((k, i) => ({ k, i, poang: kategoriPoang(k.name, query) }))
    .filter((r) => r.poang > 0)
    .sort((a, b) => b.poang - a.poang || a.k.name.length - b.k.name.length || a.i - b.i)
    .slice(0, max)
    .map((r) => r.k);
}

// ── Sökförslag: orden kunden är på väg att skriva (2026-11-19) ──────────────
//
// Leonard efter första genomgången: "det känns fortfarande inte som att det är
// världens bästa e-handel sökfält". Det som saknades var det de bästa rutorna
// gör först: föreslå SÖKNINGEN, inte bara varorna. "sof" ger soffa, soffbord
// och bäddsoffa, och en tom ruta visar vad man kan söka på.
//
// Orden kommer ur katalogens egna namn, så varje förslag ger träffar. Ingen
// sökstatistik behövs, och inget nytt hämtas: namnen ligger redan i sökindexet.

/** Katalogens ord: vilka som finns, hur många namn de står i, och vilka som inleder namn. */
export type Ordforrad = {
  /** Varje ord som går att föreslå, med antal namn det står i, vanligast först. */
  ord: { text: string; vikt: string; nyckel: string; antal: number; varu: number }[];
  /** De vanligaste varuorden (namnens första ord), för den tomma rutan. */
  exempel: string[];
  /** Varje ord som står i något namn, utan prickar: säger om ett ord är färdigskrivet. */
  former: ReadonlySet<string>;
};

const ORD_RE = /[a-zåäöé]+(?:-[a-zåäöé]+)*/g;
/** Kortaste ord som föreslås. "bord" och "säng" är fyra. */
const KORTASTE_FORSLAG = 4;
/** Ändelser som nästan bara adjektiv har: justerbar, elektrisk, vattentät, rostfri. */
const ADJEKTIVSLUT = /(?:bar|bara|bart|lig|liga|ligt|isk|iska|iskt|ande|ende|fri|fria|fritt|tät|täta|tätt)$/;

/**
 * Ett adjektiv känns igen på sin böjning: finns ordet också med -t ("manuell",
 * "manuellt"; "konstgjord", "konstgjort"; "smal", "smalt") är det inget
 * varuord. Substantiv böjs inte så ("bord" men aldrig "bordt").
 */
function arAdjektiv(o: string, alla: ReadonlySet<string>): boolean {
  if (ADJEKTIVSLUT.test(o)) return true;
  if (alla.has(`${o}t`)) return true;
  if (o.endsWith("d") && alla.has(`${o.slice(0, -1)}t`)) return true;
  if (o.endsWith("t") && (alla.has(o.slice(0, -1)) || alla.has(`${o.slice(0, -1)}a`) || alla.has(`${o.slice(0, -1)}d`))) return true;
  if (o.endsWith("a") && (alla.has(`${o.slice(0, -1)}t`) || (alla.has(o.slice(0, -1)) && alla.has(`${o.slice(0, -1)}t`)))) return true;
  if (o.endsWith("da") && alla.has(`${o.slice(0, -2)}t`)) return true;
  return false;
}

/** Så få bokstäver är början på ett ord, och förslagen är varor (se sokforslag). */
const KORT_PREFIX = 2;
/** Ett ord är en vara när det är varan i minst så många namn. */
const MINST_VARA = 2;
/**
 * Ord som inleder namn utan att vara varan, och som böjningsprovet (arAdjektiv)
 * inte fångar: oregelbundna adjektiv, räkneord, mått och material. Bara för
 * tvåbokstavsförslagen, där det första förslaget också bestämmer vilka varor
 * som visas.
 */
const INGEN_VARA = new Set([
  "armlös", "täckt", "yttre", "inre", "övre", "nedre", "främre", "bakre", "själv", "åtta",
  "kilo", "linne", "aluminium", "allt-i-ett",
]);

/** Ändelser som bara böjer ordet. Inte "a": "matt" → "matta" är ett annat ord. */
const BOJNINGSSLUT = new Set(["ar", "er", "or", "r", "n", "en", "et", "na", "arna", "erna", "orna", "s", "t", "e"]);

/** Bygger ordförrådet ur katalogens namn. Görs en gång per hämtat sökindex. */
export function byggOrdforrad(namn: readonly string[]): Ordforrad {
  const antal = new Map<string, number>();
  const forst = new Map<string, number>();
  for (const n of namn) {
    const ordINamnet = (n || "").toLowerCase().match(ORD_RE);
    if (!ordINamnet) continue;
    for (const o of new Set(ordINamnet)) antal.set(o, (antal.get(o) ?? 0) + 1);
    forst.set(ordINamnet[0], (forst.get(ordINamnet[0]) ?? 0) + 1);
  }
  const alla: ReadonlySet<string> = new Set(antal.keys());
  const duger = (o: string) =>
    o.length >= KORTASTE_FORSLAG && !STOPWORDS.has(o) && !arEgenskap(o) && !arAdjektiv(o, alla);
  // Ental och flertal är samma förslag: den vanligaste formen står för båda.
  const perNyckel = new Map<string, { text: string; antal: number; storst: number }>();
  for (const [o, n] of antal) {
    if (n < 2 || !duger(o)) continue;
    const nyckel = canon(o);
    const har = perNyckel.get(nyckel);
    if (!har) perNyckel.set(nyckel, { text: o, antal: n, storst: n });
    else {
      har.antal += n;
      if (n > har.storst) { har.text = o; har.storst = n; }
    }
  }
  // Hur ofta ordet ÄR VARAN: det inleder ett namn, eller är huvudet i namnets
  // första ord ("Matstolar 2-pack …" räknas för stolar, "Hörnskrivbord …" för
  // skrivbord och bord). "fack", "bitar", "stål" och "månader" står i hundratals
  // namn men inleder aldrig något: de är egenskaper, inte varor (se sokforslag).
  //
  // Två spärrar, båda mätta på katalogen 2026-11-19. Namnets första ord ska
  // självt vara ett varuord: "Upphöjd odlingslåda" gjorde annars "höjd" till
  // en vara. Och slutet ska stå som ett eget ord i något namn: stammen av en
  // godtycklig ändelse ("blandare" → "landare" → land) är ingen sammansättning.
  const varu = new Map<string, number>();
  for (const [w, n] of forst) {
    if (!duger(w)) continue;
    const egen = canon(w);
    if (perNyckel.has(egen)) varu.set(egen, (varu.get(egen) ?? 0) + n);
    for (let i = 2; i <= w.length - KORTASTE_FORSLAG; i++) {
      const slut = w.slice(i);
      if (!alla.has(slut)) continue;
      const huvud = canon(slut);
      if (huvud !== egen && perNyckel.has(huvud)) varu.set(huvud, (varu.get(huvud) ?? 0) + n);
    }
  }
  const ord = [...perNyckel.entries()]
    .map(([nyckel, v]) => ({ text: v.text, vikt: vik(v.text), nyckel, antal: v.antal, varu: varu.get(nyckel) ?? 0 }))
    .sort((a, b) => b.antal - a.antal || a.text.localeCompare(b.text, "sv"));
  // Den tomma rutans exempel: orden som oftast INLEDER ett namn är varutyper.
  const sedda = new Set<string>();
  const exempel: string[] = [];
  for (const [o] of [...forst.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "sv"))) {
    if (o.length < 5 || !duger(o) || (forst.get(o) ?? 0) < 5) continue;
    const nyckel = canon(o);
    if (sedda.has(nyckel)) continue;
    sedda.add(nyckel);
    exempel.push(perNyckel.get(nyckel)?.text ?? o);
    if (exempel.length >= 12) break;
  }
  return { ord, exempel, former: new Set([...alla].map(vik)) };
}

/**
 * Sökningarna kunden är på väg att skriva, högst `max`. Det sista ordet i
 * rutan fylls i: först ord som BÖRJAR så ("sof" → soffa, soffbord), sedan,
 * när minst fyra bokstäver står där, sammansättningar som SLUTAR så ("soffa"
 * → bäddsoffa, hörnsoffa): huvudet står sist i svenska ord, så de är samma
 * vara i en smalare form. Prickarna får saknas ("fatol" → fåtölj). Ordet som
 * redan står i rutan föreslås inte.
 */
export function sokforslag(forrad: Ordforrad, skrivet: string, max = 3): string[] {
  const delar = (skrivet || "").toLowerCase().replace(/\s+/g, " ").trimStart().split(" ");
  const sist = delar[delar.length - 1] ?? "";
  if (sist.length < 2 || max <= 0) return [];
  const fore = delar.slice(0, -1).join(" ");
  const p = vik(sist);
  const pNyckel = canon(sist);
  const kort = sist.length <= 2 || FORKORTNINGAR.has(sist);
  const helt = forrad.former.has(p);
  // Har kunden skrivit prickarna gäller de: "sän" är sängram, inte sand, och
  // "skå" är skåp, inte skärm. Utan prickar går ordet som börjar precis så
  // först ("bad" → badrumsskåp före bädd), och det utan prickar sist ("fatol"
  // → fåtölj).
  const harPrickar = /[åäöé]/.test(sist);
  type Ord = Ordforrad["ord"][number];
  const medStreck: string[] = [];
  const nara: string[] = [];
  const exakta: Ord[] = [];
  const vikta: Ord[] = [];
  const slutar: string[] = [];
  let exaktVikt = 0;
  let viktaVikt = 0;
  let slutarVikt = 0;
  const tagna = new Set(delar.slice(0, -1).map((d) => canon(d)));
  for (const o of forrad.ord) {
    if (o.vikt === p || tagna.has(o.nyckel)) continue;
    // En böjning av ordet som redan står i rutan för inte sökningen vidare:
    // "soffor" → "soffa", "stol" → "stolar". Är ordet inte färdigskrivet gör
    // den det: "julgr" → "julgran", "lamp" → "lampor".
    if (o.nyckel === pNyckel && (!o.vikt.startsWith(p) || (helt && BOJNINGSSLUT.has(o.vikt.slice(p.length))))) continue;
    // Ett kort ord eller en förkortning står för sig (helord, se ovan): "tv"
    // är tv-bänk och tv-stativ, inte tvåsitssoffa och tvättkorg.
    if (kort && o.vikt.startsWith(`${p}-`) && medStreck.length < max) medStreck.push(o.text);
    if (o.vikt.startsWith(p)) {
      if (!o.text.startsWith(sist)) {
        vikta.push(o);
        viktaVikt += o.antal;
        continue;
      }
      // Ordet kunden nästan har skrivit färdigt går först, när det också är
      // det vanligaste som börjar så: "matt" → matta före hängmatta.
      if (exaktVikt === 0 && o.vikt.length <= p.length + 2) nara.push(o.text);
      else exakta.push(o);
      exaktVikt += o.antal;
    } else if (p.length >= 4 && o.vikt.length > p.length + 1 && ((helt ? o.text.endsWith(sist) : o.vikt.endsWith(p)) || o.nyckel.endsWith(pNyckel))) {
      // ☠️ Är det skrivna ett eget ord gäller prickarna: "smal" är inte slutet
      // av "fotbollsmål" (2026-11-19). Den som skriver "fatolj" har inget ord
      // i katalogen och får fortfarande "massagefåtölj".
      slutarVikt += o.antal;
      if (slutar.length < max) slutar.push(o.text);
    }
  }
  if (kort && medStreck.length > 0) return medStreck.map((o) => (fore ? `${fore} ${o}` : o));
  // ☠️ TVÅ BOKSTÄVER ÄR BÖRJAN PÅ EN VARA, INTE PÅ VILKET ORD SOM HELST
  // (2026-11-19). Rankat på hur många namn ordet står i gav "få" fack,
  // fåtölj, fälls och "bi" biking, bistroset, bitar: egenskaper och verb som
  // ingen söker på. Nu rankas de på hur ofta ordet är varan (varu, se
  // byggOrdforrad): "få" → fåtölj, fågelbur, fågelmatare; "st" → stolar,
  // ställ, stativ. Har kunden skrivit prickarna gäller de: "sä" är säng och
  // sängram, inte sammet, och "kö" är köksskåp, inte kontorsstol.
  if (sist.length <= KORT_PREFIX) {
    // Efter ett annat ord är två bokstäver oftast en färg eller ett mått på
    // väg ("soffa gr" → grå), och de står inte i ordförrådet: hellre inget
    // förslag än "soffa gran".
    if (fore) return [];
    let varor = forrad.ord.filter((o) => o.varu >= MINST_VARA && o.vikt !== p && o.vikt.startsWith(p) && !INGEN_VARA.has(o.text));
    if (/[åäöé]/.test(sist)) {
      // Börjar ingen vara så MED prickarna föreslås ingenting: "vå" är inte "vagn".
      varor = varor.filter((o) => o.text.startsWith(sist));
    }
    varor.sort((a, b) => b.varu - a.varu || b.antal - a.antal || a.text.localeCompare(b.text, "sv"));
    const korta: string[] = [];
    for (const o of varor) {
      if (korta.some((v) => (o.text.startsWith(v) && o.text.length - v.length <= 3) || (v.startsWith(o.text) && v.length - o.text.length <= 3))) continue;
      korta.push(o.text);
      if (korta.length >= max) break;
    }
    // Börjar ingen vara så föreslås ingenting: "ne" → nedre och "yt" → yttre
    // är inga sökningar. Rutan ber då kunden skriva lite till.
    return korta;
  }
  // Vilken sorts ord är det? "soffa", "bord" och "stol" är huvudet i många
  // sammansättningar (bäddsoffa, matbord): de smalare formerna går först.
  // "barn", "hund" och "jul" inleder många (barnbord, hundbur): de går först.
  // Varorna först bland dem som börjar så ("sof" → soffbord, soffa före soft;
  // "sto" → stolar före storlekar), i övrigt de vanligaste först.
  const varorForst = (lista: Ord[]) => [...lista.filter((o) => o.varu > 0), ...lista.filter((o) => o.varu === 0)].map((o) => o.text);
  const medVikta = !harPrickar || exaktVikt === 0;
  const borjar = [...varorForst(exakta), ...(medVikta ? varorForst(vikta) : [])];
  const borjarVikt = exaktVikt + (medVikta ? viktaVikt : 0);
  const ordning = [...nara, ...(slutarVikt > borjarVikt ? [...slutar, ...borjar] : [...borjar, ...slutar])];
  const valda: string[] = [];
  for (const o of ordning) {
    // "julgran" och "julgranar" är samma förslag.
    if (valda.some((v) => (o.startsWith(v) && o.length - v.length <= 3) || (v.startsWith(o) && v.length - o.length <= 3))) continue;
    valda.push(o);
    if (valda.length >= max) break;
  }
  return valda.map((o) => (fore ? `${fore} ${o}` : o));
}

/**
 * Sökförslagen prövade mot katalogens namn (2026-11-19).
 *
 * ☠️ sokforslag fyller i det sista ordet utan att se på de andra: "golvlampa
 * fot" blev "golvlampa fotbollsmål", "kattlåda med tak" blev "kattlåda med
 * taklampa" och "hundsoffa stor hund" blev "hundsoffa stor hundgrind". Ett
 * förslag på flera ord ska leda till varor, så det föreslås bara när något
 * namn har ordet tillsammans med de andra.
 *
 * Särskrivet: butikens vanligaste egna sökning är "Vägg hylla" (GA4). Står
 * orden ihopskrivna i ordförrådet föreslås det ordet först ("vägghylla").
 *
 * `namn` är katalogens namn, normaliserade (normalize).
 */
export function sokforslagINamn(forrad: Ordforrad, namn: readonly string[], skrivet: string, max = 3): string[] {
  const delar = (skrivet || "").toLowerCase().replace(/\s+/g, " ").trim().split(" ");
  if (delar.length < 2) return sokforslag(forrad, skrivet, max);
  const ut: string[] = [];
  if (!/\s$/.test(skrivet) && delar.every((d) => /^[a-zåäöé]+$/.test(d))) {
    // Ihop, eller med bindestreck som i "tv-bänk".
    const ihop = vik(delar.join(""));
    const medStreck = vik(delar.join("-"));
    const ord = forrad.ord.find((o) => o.vikt === ihop || o.vikt === medStreck)
      ?? forrad.ord.find((o) => o.varu > 0 && o.vikt.startsWith(ihop) && o.vikt.length <= ihop.length + 2);
    if (ord) ut.push(ord.text);
  }
  // De andra orden ska stå i samma namn. Ett kort ord ("tv", "el") som eget
  // ord eller i början av ett: som delsträng står "tv" i "två" och "tvätt".
  const ovriga = delar.slice(0, -1).filter((d) => d.length >= 2 && !STOPWORDS.has(d)).map((d) => {
    const st = sokstam(d);
    return st.length > 3 ? (n: string) => n.includes(st) : (n: string) => starSomOrd(n, st) || (st.length === 3 && ordBorjar(n, st));
  });
  // Namnen med de andra orden plockas fram en gång, inte en gång per förslag:
  // rutan räknar förslagen vid varje tangent.
  let medOvriga: string[] | null = null;
  for (const f of sokforslag(forrad, skrivet, max * 4)) {
    if (ut.length >= max) break;
    const ord = f.slice(f.lastIndexOf(" ") + 1);
    // "tv bänk" har redan fått "tv-bänk": inte "tv tv-bänk" också.
    if (ut.includes(ord)) continue;
    medOvriga ??= namn.filter((n) => ovriga.every((star) => star(n)));
    if (medOvriga.some((n) => n.includes(ord))) ut.push(f);
  }
  return ut;
}

/**
 * Ordet vars varor listan visar när det skrivna inte räcker till en sökning,
 * eller null när det skrivna gäller som det står.
 *
 * ☠️ TVÅ BOKSTÄVER GAV "Inga produkter matchade" (Leonards skärmbilder
 * 2026-11-19, "få" och "bi"). Ett så kort ord ska stå för sig i namnet
 * (lib/search.ts, helord), så "få" hittade ingenting och "st" hittade 107
 * varor med "2 st" i namnet. Men den som skrivit två bokstäver är på väg mot
 * ett ord. Nu visas varorna för det första sökförslaget ("få" → fåtölj), som
 * sökmotorer gör medan man skriver, och rutan säger vilket ord det gäller.
 *
 * Tre fall:
 *  - ett enda ord på högst två bokstäver: förslagets varor, också när det
 *    korta ordet råkar stå i några namn ("st", "ut"). Undantag: förslaget är
 *    samma ord med bindestreck ("tv" → tv-bänk). Då är det korta ordet varan.
 *  - ingen träff alls men ett förslag ("julgr" hade träffar, "fatö" inte
 *    alltid): förslagets varor i stället för en återvändsgränd.
 *  - annars null.
 */
export function visaVarorFor(skrivet: string, forslag: readonly string[], traffar: number): string | null {
  const forsta = forslag[0];
  if (!forsta) return null;
  const t = skrivet.trim().toLowerCase();
  if (kortOrd(t)) return forsta.toLowerCase().startsWith(`${t}-`) ? null : forsta;
  return traffar === 0 ? forsta : null;
}

/** Ett enda ord på högst två bokstäver: början på ett ord, ingen sökning än. */
export function kortOrd(skrivet: string): boolean {
  const t = skrivet.trim();
  return t.length > 0 && t.length <= 2 && !/\s/.test(t);
}

// Ordförrådet per katalog, för söksidan. Byggs första gången någon söker på
// två bokstäver (runt 60 ms för 7 600 namn) och delas sedan av alla.
const menadeForrad = new WeakMap<object, Ordforrad>();

/**
 * Orden kunden var på väg att skriva ("få" → fåtölj, fågelbur), ur varornas
 * namn. Bara för ett enda ord: efter flera ord är det sista ofta en färg eller
 * ett mått, och de står inte i ordförrådet.
 */
export function menadeDu<T>(varor: readonly T[], namn: (v: T) => string, fraga: string, max = 3): string[] {
  const t = (fraga || "").trim();
  if (!t || /\s/.test(t)) return [];
  let f = menadeForrad.get(varor);
  if (!f) {
    f = byggOrdforrad(varor.map(namn));
    menadeForrad.set(varor, f);
  }
  return sokforslag(f, t, max);
}

/**
 * Söksidans rankning, med samma regel för två bokstäver som sökrutan har.
 *
 * ☠️ "få" GAV 605 VAROR OCH "so" 3 795 (mätt 2026-11-19): inget namn har ett
 * så kort ord för sig, så söksidan föll till reserven i beskrivningarna, där
 * två bokstäver står i nästan varje text. Nu visar sidan varorna för ordet
 * kunden var på väg att skriva ("få" → fåtölj) och säger det (`visar`).
 * Längre ord rankas som förut.
 */
export function rankaMedForslag<T>(items: T[], nameOf: (item: T) => string, query: string): { utfall: Sokutfall<T>; visar: string } {
  const utfall = rankaMedInfo(items, nameOf, query);
  // En rättad stavning visas på samma sätt som ordet för två bokstäver:
  // sidan säger vilket ord träffarna gäller.
  if (!kortOrd(query)) return { utfall, visar: utfall.rattat ?? "" };
  const mal = visaVarorFor(query, menadeDu(items, nameOf, query), utfall.traffar.length);
  if (!mal) return { utfall, visar: "" };
  const forMalet = rankaMedInfo(items, nameOf, mal);
  return forMalet.traffar.length > 0 ? { utfall: forMalet, visar: mal } : { utfall, visar: "" };
}
