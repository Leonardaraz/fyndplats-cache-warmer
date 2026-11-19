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

export function normalize(s: string): string {
  return (s || "").toLowerCase().trim();
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
  const bokstav: boolean[] = new Array(n);
  for (let j = 0; j < n; j++) bokstav[j] = BOKSTAV.test(text[j]);
  let prevPrev: number[] = new Array(n + 1).fill(0);
  let prev: number[] = new Array(n + 1).fill(0); // rad 0: fri start överallt
  for (let i = 1; i <= m; i++) {
    const cur: number[] = new Array(n + 1);
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      // Väggen: en träff som slutar på ett skiljetecken har inte tagit något
      // av texten, alltså i infogningar.
      if (!bokstav[j - 1]) {
        cur[j] = i;
        continue;
      }
      const cost = pattern[i - 1] === text[j - 1] ? 0 : 1;
      let v = Math.min(prev[j - 1] + cost, prev[j] + 1, cur[j - 1] + 1);
      if (i > 1 && j > 1 && bokstav[j - 2] && pattern[i - 1] === text[j - 2] && pattern[i - 2] === text[j - 1]) {
        v = Math.min(v, prevPrev[j - 2] + 1); // transposition
      }
      cur[j] = v;
    }
    prevPrev = prev;
    prev = cur;
  }
  let best = Infinity;
  for (let j = 1; j <= n; j++) {
    if (prev[j] >= best || !bokstav[j - 1]) continue;
    // Resten av ordet efter träffen: tomt, en böjningsändelse, eller högst två
    // bokstäver ("konstgjor|da", "justerbar|t"). Mätt på 592 felstavningar av
    // katalogens vanligaste första ord 2026-11-19.
    let slut = j;
    while (slut < n && bokstav[slut]) slut++;
    if (slut - j > 2 && !BOJNING.has(text.slice(j, slut))) continue;
    // Första bokstaven ska stämma. "cyckel" låg lika nära "nyckel" i
    // "momentnyckel" som "cykel" i "motionscykel". Träffen är m tecken lång,
    // plus eller minus felen, så början ligger inom maxDist från j − m.
    let borjanStammer = false;
    for (let st = Math.max(0, j - m - maxDist); st <= j - m + maxDist && st < j; st++) {
      if (text[st] === pattern[0] && bokstav[st]) { borjanStammer = true; break; }
    }
    if (borjanStammer) best = prev[j];
  }
  return best <= maxDist ? best : Infinity;
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
type Unit = { stem: string; key: string; vikt: string; tok: string; helord: boolean; egenskap: boolean; fogRe: RegExp | null };
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
const helord = (tok: string): boolean => tok.length <= 2 || /^\d+$/.test(tok);

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
]);
const arEgenskap = (tok: string): boolean => EGENSKAPSORD.has(tok) || /^\d+([.,]\d+)?(cm|mm|m|kg|l|w|v)?$/.test(tok);

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
function tokenQuality(unit: Unit, nameNorm: string, lage: Lage, namnVikt: string, stavfelOk = true, fogat = ""): Ordtraff {
  const { stem: s, key } = unit;
  if (unit.helord) return starSomOrd(nameNorm, s) ? HEL : INGEN;
  if (nameNorm.includes(s)) return HEL;
  if (unit.fogRe && fogat && sammanskrivet(fogat, unit.fogRe, false).var) return HEL;
  const needles = SYN.get(key);
  if (needles) {
    for (const nd of needles) if (nameNorm.includes(nd)) return SYNONYM;
  }
  const envags = ENVAGS_NALAR.get(key);
  if (envags) {
    for (const nd of envags) if (nameNorm.includes(nd)) return SYNONYM;
  }
  if (lage >= VIKT && namnVikt.includes(unit.vikt)) return UTAN_PRICKAR;
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
]);

// `ihop` är sökorden skrivna som ett ord ("laser tag" → "lasertag") som
// mönster, med prickarna kvar och utan. Null när det blir för kort.
type Ihop = { re: RegExp; reVikt: RegExp; flerOrd: boolean };
// `kantFore` och `kantEfter`: sökningens första respektive sista ord är ett
// kort ord eller ett tal (helord), så hela frasen ska börja respektive sluta
// vid en ordgräns i namnet. "skrivbord 120" står inte i "Skrivbord 1200 mm".
type Prepared = { q: string; units: Unit[]; ihop: Ihop | null; kantFore: boolean; kantEfter: boolean };

// Sökordet tolkas EN gång per sökning. nameMatch gjorde det förr per vara, alltså
// 4 184 gånger per tangent.
function prepare(query: string): Prepared {
  const q = normalize(query);
  const alla = tokenize(q)
    .map((t) => ({ tok: t, stem: stem(t), key: canon(t) }))
    .filter((u) => u.stem.length >= 2);
  const innehall = alla.filter((u) => !STOPWORDS.has(u.tok));
  const units = (innehall.length > 0 ? innehall : alla).map(({ tok, stem: s, key }) => ({
    stem: s, key, vikt: vik(s), tok, helord: helord(tok), egenskap: arEgenskap(tok),
    fogRe: s.length >= KORTASTE_SAMMANSKRIVET ? ihopMonster(s) : null,
  }));
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
function mainPart(nameNorm: string): string {
  const cut = nameNorm.search(/ [–-] |,| med | för | till /);
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
const BOJNING = new Set<string>([...SUFFIXES, "a", "e"]);
const BOKSTAV = /[a-zåäö0-9]/;

/** 2 = sökordet slutar ett ord, 1 = ett ord börjar med det, 0 = mitt i ett ord. */
function kant(nameNorm: string, s: string): number {
  let bast = 0;
  for (let i = nameNorm.indexOf(s); i >= 0 && bast < 2; i = nameNorm.indexOf(s, i + 1)) {
    const borjar = i === 0 || !BOKSTAV.test(nameNorm[i - 1]);
    const efter = /^[a-zåäö0-9]*/.exec(nameNorm.slice(i + s.length))![0];
    const kort = s.length <= 3;
    const slutar = efter === "" || (!kort && BOJNING.has(efter));
    if (slutar && (borjar || !kort)) bast = 2;
    else if (borjar) bast = 1;
  }
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
export function nameMatch(name: string, query: string): NameMatch {
  return matchPrepared(normalize(name), prepare(query), STAVFEL);
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
  if (nameNorm.includes(q) && ((!p.kantFore && !p.kantEfter) || frasStar(nameNorm, q, p.kantFore, p.kantEfter))) {
    return { score: mainPart(nameNorm).includes(q) ? 100 : 90, full: true, kant: kant(nameNorm, q) };
  }
  // Sammanskrivet: flera sökord som ett ord i namnet, eller ett sökord över
  // ett bindestreck i namnet.
  const fogat = ihop ? (fogatNamn ?? medFogar(nameNorm)) : "";
  if (ihop && (ihop.flerOrd || fogat !== nameNorm)) {
    const t = sammanskrivet(fogat, ihop.re, ihop.flerOrd);
    if (t.var) return { score: t.var === 2 ? 95 : 88, full: true, kant: t.slutarOrd ? 2 : 1 };
  }
  const vikt = lage >= VIKT ? (viktNamn ?? vik(nameNorm)) : "";
  if (ihop && lage >= VIKT && (ihop.flerOrd || fogat !== nameNorm)) {
    const t = sammanskrivet(vik(fogat), ihop.reVikt, ihop.flerOrd);
    if (t.var) return { score: t.var === 2 ? 93 : 86, full: true, kant: t.slutarOrd ? 2 : 1, vikt: true };
  }
  if (units.length === 0) return none;
  let sum = 0;
  let hit = 0;
  let fel = 0;
  let utanPrickar = false;
  let kanter = 2;
  let mask = 0;
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
    if (t.qual === 1) kanter = Math.min(kanter, kant(nameNorm, u.stem));
  }
  if (sum === 0) return none;
  // Perfekt täckning (alla exakta) → 60, samma tak som förr. Synonym-/stavfel-
  // tokens bidrar <1 så de landar strax under en likvärdig exakt träff.
  const m: NameMatch = { score: Math.max(1, Math.round((sum / units.length) * 60)), full: hit === units.length, stavfel: fel > 0, kant: kanter, mask };
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
 */
export type Sokutfall<T> = { traffar: T[]; strukna: string[]; utan?: string[]; hela?: number };

/** Färre hela träffar än så, och sökningen har en färg eller ett mått: fyll på. */
export const FYLL_PA_UNDER = 24;

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
//   2. färg, storlek och mått (EGENSKAPSORD),
//   3. det vanligaste ordet (det säger minst).
// Kvar blir det som säger mest om vad kunden letar efter.
export function rankaMedInfo<T>(items: T[], nameOf: (item: T) => string, query: string, normNamn?: readonly string[]): Sokutfall<T> {
  const p = prepare(query);
  const namn = normNamn ?? items.map((item) => normalize(nameOf(item)));
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
  const scored = stavfelOk.some(Boolean) ? varv(STAVFEL, p, stavfelOk) : andra;
  const medAlla = scored.filter((r) => r.full);
  if (medAlla.length > 0) {
    const kept = medAlla.some((r) => !r.stavfel) ? medAlla.filter((r) => !r.stavfel) : medAlla;
    // ETT STAVFEL FÖRE TVÅ. Två fel tillåts i ord på sju tecken eller fler, och
    // då låg "elkammin" lika nära "melamin" och "kammare" som "elkamin": 39
    // träffar med hyllplan och en fladdermusholk överst. Finns en träff där
    // inget ord har mer än ett fel visas bara sådana.
    if (kept.some((r) => r.fel !== 2)) return hela(kept.filter((r) => r.fel !== 2));
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
    const sokning = prepare(delad);
    for (const lage of [EXAKT, VIKT] as const) {
      const rader = varv(lage, sokning);
      if (rader.some((r) => r.full)) return hela(rader.filter((r) => r.full));
    }
  }
  // Träffar där något ord har två stavfel (bara de är kvar av medAlla här).
  if (medAlla.length > 0) return hela(medAlla);

  // INGET NAMN HAR ALLA SÖKORD. Stryk ord tills något namn har de som är kvar.
  const n = p.units.length;
  if (n < 2 || scored.length === 0) return { traffar: [], strukna: [] };
  const antal: number[] = new Array(n).fill(0);
  for (const r of scored) for (let i = 0; i < n; i++) if ((r.mask ?? 0) & (1 << i)) antal[i]++;
  const rang = (i: number) => (antal[i] === 0 ? 0 : p.units[i].egenskap ? 1 : 2);
  const ordning = p.units.map((_, i) => i).sort((a, b) => rang(a) - rang(b) || antal[b] - antal[a]);
  let kvar = n < 31 ? (1 << n) - 1 : 0x7fffffff;
  for (let k = 0; k < n - 1; k++) {
    kvar &= ~(1 << ordning[k]);
    const rader = scored.filter((r) => ((r.mask ?? 0) & kvar) === kvar);
    if (rader.length > 0) {
      return { traffar: sortera(rader), strukna: ordning.slice(0, k + 1).sort((a, b) => a - b).map((i) => p.units[i].tok) };
    }
  }
  return { traffar: [], strukna: [] };
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
type ListFormer = { fogat?: string[]; vikt?: string[]; ord?: Set<string> };
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

/** Poäng för hur väl ett kategorinamn matchar sökningen. 0 = inte alls. */
export function kategoriPoang(kategoriNamn: string, query: string): number {
  // Mjuka bindestreck (U+00AD) står i långa kategorinamn för radbrytningen.
  const namn = normalize(kategoriNamn.replace(/\u00ad/g, ""));
  // Orden som de står, och med bindestrecken borta: "TV-bänkar" är både
  // "tv" + "bänkar" och "tvbänkar".
  const ord = [...new Set([...tokenize(namn), ...tokenize(utanBindestreck(namn))])].map(canon);
  // Färg, storlek och mått säger inget om kategorin: "svart tv-bänk" är TV-bänkar.
  const units = prepare(query).units.filter((u) => !u.egenskap);
  if (units.length === 0 || ord.length === 0) return 0;
  let summa = 0;
  for (const u of units) {
    let bast = 0;
    for (const o of ord) {
      if (o === u.key) bast = Math.max(bast, 3);
      // Huvudet i en sammansättning: "fåtölj" i "uppresningsfåtöljer".
      else if (!u.helord && u.key.length >= 3 && o.endsWith(u.key)) bast = Math.max(bast, 2);
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
