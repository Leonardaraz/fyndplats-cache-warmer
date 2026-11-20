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

// ☠️ "trädgårdsmöbel" GAV NOLL OCH "trädgårdsmöbler" 89 (Leonard 2026-11-20).
// canon tar bort EN ändelse, och "möbel" har ingen: flertalet "möbler" blir
// "möbl", entalet står kvar som "möbel". Samma sak för spegel och speglar,
// cykel och cyklar, nyckel och nycklar: ord på -el, -en och -er tappar e:et i
// flertal. TAPPAR_E ger nyckeln utan det (se begreppsnyckel).
const TAPPAR_E = /^(.{2,}[bcdfghjklmnpqrstvwxz])e([lnr])$/;

/**
 * Ordet i sina böjningar, utan prickar: som det står, stammen, entalet och de
 * böjda formerna. Två ord är SAMMA ORD när de delar en form (delarForm):
 * "barnmobel" och "Barnmöbler", "leksak" och "Leksaker", "fåtölj" och
 * "Fåtöljer". Används där ett ord jämförs med ett annat ord (kategorinamn,
 * begreppsord), aldrig mot namnen.
 *
 * ☠️ Formerna, inte canon. Den första versionen jämförde canon-nycklar, och
 * canon skalar vad som helst: "kökös" blev "kök" (ändelsen s, sedan vokalen)
 * och räknades som kategorin Kök, så felstavningen rättades aldrig.
 */
function ordformer(ord: string): string[] {
  const st = sokstam(ord);
  // ☠️ Ett avskalat s är ingen böjning: "byggs" är början på "byggsats", inte
  // avdelningen Bygg (39 byggsatser blev 310 varor med pumpar och soffor).
  const stam = st !== ord && ord !== `${st}s` ? [st] : [];
  return [...new Set([ord, ...stam, ...entalAv(ord), ...bojdaFormer(ord)].map(vik))];
}
const delarForm = (a: readonly string[], b: readonly string[]): boolean => a.some((x) => b.includes(x));

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

/**
 * Nyckeln för synonymer och envägsord: canon, eller ordets andra grundform
 * (TAPPAR_E) när bara den är känd. "trädgårdsmöbel" och "utemöbel" når då samma
 * varor som "trädgårdsmöbler" och "utemöbler".
 */
function begreppsnyckel(term: string): string {
  const k = canon(term);
  if (SYN.has(k) || ENVAGS_NALAR.has(k)) return k;
  const m = TAPPAR_E.exec(k);
  if (m && (SYN.has(m[1] + m[2]) || ENVAGS_NALAR.has(m[1] + m[2]))) return m[1] + m[2];
  return k;
}

// Synonym-needles för en originalterm (exporterad för test/insyn).
export function expandSynonyms(term: string): string[] {
  const k = begreppsnyckel(term);
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

// ── Stavfelsledet räknar per ORD, inte per namn (2026-11-20) ─────────────────
// fuzzyOrdslut går ett ord i taget, och svaret beror bara på ordet. Katalogens
// 7 900 namn har runt 80 000 ord, men bara 9 000 OLIKA: stavfelsledet räknade
// samma ord om och om igen, vid varje tangent i ett ord som inget namn har.
// Mätt med processorn strypt fyra gånger (som en telefon): en tangent i
// "kontorsmöbler" höll skärmen i 766 ms. Nu räknas avståndet en gång per
// unikt ord (felPerOrd), och namnet slår upp sina ord i tabellen. Svaren är
// desamma, bokstav för bokstav (13 933 provsökningar, samma dag).

/** Namnens ord: varje unikt ord en gång, och vilka ord varje namn har. */
type Ordlista = {
  ord: string[];
  /** Vilka tecken ordet har, se stavmask. */
  mask: Int32Array;
  /** Namn i har orden ids[start[i] .. start[i + 1]). */
  start: Int32Array;
  ids: Int32Array;
  /** Avstånden per sökord och antal fel, de senast använda. */
  tabeller: Map<string, Uint8Array>;
};

/** Samma tecken som BOKSTAV, på teckenkoden. */
function arBokstavskod(c: number): boolean {
  return (c >= 97 && c <= 122) || (c >= 48 && c <= 57) || c === 229 || c === 228 || c === 246;
}

/**
 * Vilka tecken ordet har, en bit per tecken: a–z, å, ä, ö, och en gemensam bit
 * för siffror. Varje tecken i sökordet som ordet saknar kostar minst ett fel,
 * så ett ord som saknar fler olika tecken än felen tillåter kan inte träffa.
 */
function stavmask(ord: string): number {
  let m = 0;
  for (let i = 0; i < ord.length; i++) {
    const c = ord.charCodeAt(i);
    if (c >= 97 && c <= 122) m |= 1 << (c - 97);
    else if (c === 229) m |= 1 << 26;
    else if (c === 228) m |= 1 << 27;
    else if (c === 246) m |= 1 << 28;
    else if (c >= 48 && c <= 57) m |= 1 << 29;
  }
  return m;
}

/**
 * Namnlistans ord, byggda en gång. Stavfelsledet slår i dem (felPerOrd), och
 * ordräkningen, orden som står för sig och de kända delarna räknas ur dem
 * (ordAntal, egnaOrd, kandaOrd) i stället för att dela upp varje namn på nytt:
 * det var en tredjedel av uppvärmningen (mätt 2026-11-20).
 * Orden delas som tokenize delar ett normaliserat namn: följder av a–z, å, ä,
 * ö och siffror (lib/sok-2026-11-20.test.ts jämför de två).
 */
function listaFor(namn: readonly string[], sparat: ListFormer): Ordlista {
  return (sparat.ordlista ??= byggOrdlista(namn));
}

/**
 * För testerna: orden som ordlistan ser i varje namn, i ordning, och i hur
 * många namn varje ord står (se listaFor och ordAntal).
 */
export function ordlistansOrd(namn: readonly string[]): { ord: string[][]; antal: [string, number][] } {
  const lista = byggOrdlista(namn);
  return {
    ord: namn.map((_, i) => Array.from(lista.ids.subarray(lista.start[i], lista.start[i + 1]), (id) => lista.ord[id])),
    antal: [...ordAntal(lista)],
  };
}

function byggOrdlista(namn: readonly string[]): Ordlista {
  const plats = new Map<string, number>();
  const ord: string[] = [];
  const start = new Int32Array(namn.length + 1);
  const ids: number[] = [];
  for (let i = 0; i < namn.length; i++) {
    start[i] = ids.length;
    const text = namn[i];
    const n = text.length;
    // Orden som fuzzyOrdslut ser dem: följder av bokstäver och siffror.
    for (let a = 0; a < n; ) {
      if (!arBokstavskod(text.charCodeAt(a))) { a++; continue; }
      let b = a + 1;
      while (b < n && arBokstavskod(text.charCodeAt(b))) b++;
      const w = text.slice(a, b);
      let id = plats.get(w);
      if (id === undefined) {
        id = ord.length;
        ord.push(w);
        plats.set(w, id);
      }
      ids.push(id);
      a = b;
    }
  }
  start[namn.length] = ids.length;
  const mask = new Int32Array(ord.length);
  for (let w = 0; w < ord.length; w++) mask[w] = stavmask(ord[w]);
  return { ord, mask, start, ids: Int32Array.from(ids), tabeller: new Map() };
}

/** Inget ord i tabellen ligger inom felen. */
const INGET_FEL = 255;

/** Avståndet från sökordet till slutet av varje ord i listan (som fuzzyOrdslut), INGET_FEL utanför `maxDist`. */
function felPerOrd(lista: Ordlista, s: string, maxDist: number): Uint8Array {
  const nyckel = `${maxDist}|${s}`;
  const sparad = lista.tabeller.get(nyckel);
  if (sparad) return sparad;
  const ut = new Uint8Array(lista.ord.length).fill(INGET_FEL);
  const m = s.length;
  const sMask = stavmask(s);
  for (let w = 0; w < lista.ord.length; w++) {
    const o = lista.ord[w];
    const L = o.length;
    if (L < m - maxDist || L >= RAD_MAX) continue;
    if (bitar(sMask & ~lista.mask[w]) > maxDist) continue;
    const d = ordslutAvstand(s, o, 0, L, maxDist);
    if (d <= maxDist) ut[w] = d;
  }
  // De senaste sökorden sparas: samma ord prövas i flera varv, och igen vid
  // nästa tangent när sökningen skrivs om till samma ord.
  if (lista.tabeller.size >= 24) lista.tabeller.delete(lista.tabeller.keys().next().value as string);
  lista.tabeller.set(nyckel, ut);
  return ut;
}

/** fuzzyOrdslut för namn `ni`, ur tabellen. */
function felINamn(lista: Ordlista, ni: number, s: string, maxDist: number): number {
  const tabell = felPerOrd(lista, s, maxDist);
  let bast = INGET_FEL;
  for (let k = lista.start[ni], slut = lista.start[ni + 1]; k < slut; k++) {
    const d = tabell[lista.ids[k]];
    if (d < bast) {
      bast = d;
      if (bast === 0) return 0;
    }
  }
  return bast === INGET_FEL ? Infinity : bast;
}

// ── Teckenmasker: hoppa över namn som saknar ett tecken (2026-11-20) ─────────
// Ett sökord kan bara stå i ett namn som har alla ordets tecken. Namnens
// masker räknas en gång per lista, sökordens en gång per varv, och jämförelsen
// är en enda bitoperation i stället för en genomsökning av namnet. Det ändrar
// inga svar: masken säger bara "kan inte stå där".

/** Sökordets masker: stammen, ordet som det skrevs, utan prickar, och de böjda formerna. */
type Unitmasker = { s: number; tok: number; vikt: number; former: number[] };
/**
 * Sökningens masker: hela frasen, de sammanskrivna orden, det ensamma ordets
 * former och varje sökord. `nagon` och `nagonVikt` är förfiltret (se nedan).
 */
type Sokmasker = { q: number; ihop: number; ihopVikt: number; former: number[]; units: Unitmasker[]; nagon: number[]; nagonVikt: number[]; baraEgenskaper: boolean };

// FÖRFILTRET: ETT NAMN SOM INTE KAN TRÄFFA JÄMFÖRS INTE ALLS (2026-11-20).
// Varje väg till en träff i matchPrepared går genom en text som ska stå i
// namnet: frasen, en böjd form, orden sammanskrivna, ett sökords stam eller
// synonym. `nagon` är maskerna för alla de texterna (`nagonVikt` för dem som
// jämförs utan prickar). Har namnet inte alla tecken i någon av dem kan det
// inte träffa, och hela jämförelsen hoppas över: för ett ord på fem bokstäver
// eller fler är det de flesta av katalogens namn. Stavfelsledet har sin egen
// regel (se stavfelsmasker). En mask som rymmer en annan stryks: har namnet
// inte den mindre har det inte den större.
function sokmasker(p: Prepared): Sokmasker {
  const ihop = tokenize(p.q).join("");
  const units = p.units.map((u) => ({ s: stavmask(u.stem), tok: stavmask(u.tok), vikt: stavmask(u.vikt), former: (u.former ?? []).map(stavmask) }));
  const q = stavmask(p.q);
  const ihopMask = stavmask(ihop);
  const ihopVikt = stavmask(vik(ihop));
  const former = (p.former ?? []).map(stavmask);
  // De sammanskrivna orden har samma tecken som frasen (q), så de behöver
  // ingen egen mask här. Utan prickar har de det: "tå bä" står i "tabard".
  const nagon: number[] = [q, ...former];
  const nagonVikt: number[] = p.ihop ? [ihopVikt] : [];
  p.units.forEach((u, i) => {
    const um = units[i];
    nagon.push(um.s);
    if (u.helord) {
      if (u.ihopNasta) nagon.push(stavmask(u.ihopNasta));
      return;
    }
    if (u.kortStam) nagon.push(um.tok);
    nagon.push(...um.former);
    for (const nd of SYN.get(u.key) ?? []) nagon.push(stavmask(nd));
    for (const nd of ENVAGS_NALAR.get(u.key) ?? []) nagon.push(stavmask(nd));
    nagonVikt.push(um.vikt);
  });
  return { q, ihop: ihopMask, ihopVikt, former, units, nagon: minstaMasker(nagon), nagonVikt: minstaMasker(nagonVikt), baraEgenskaper: p.units.every((u) => u.egenskap) };
}

/** Maskerna utan dubbletter och utan dem som rymmer en annan mask i listan. */
function minstaMasker(masker: readonly number[]): number[] {
  const unika = [...new Set(masker)];
  return unika.filter((m) => !unika.some((x) => x !== m && (x & ~m) === 0));
}

/**
 * Stavfelsledets förfilter: sökorden som får ha stavfel, med masken och hur
 * många fel som tillåts. Ett fel byter högst ett tecken, så ett namn som
 * saknar fler av sökordets tecken än felen tillåter kan inte träffa (samma
 * regel som felPerOrd har per ord: namnets mask rymmer varje ords).
 */
type Stavfelsmasker = { mask: number[]; max: number[] };

/** Förfiltret för ett namn med maskerna `nm` (och `nmv` utan prickar): kan det träffa? */
function kanTraffa(nagon: readonly number[], nagonVikt: readonly number[], fel: Stavfelsmasker | null, nm: number, nmv: number): boolean {
  for (let x = 0; x < nagon.length; x++) if ((nagon[x] & ~nm) === 0) return true;
  for (let x = 0; x < nagonVikt.length; x++) if ((nagonVikt[x] & ~nmv) === 0) return true;
  if (fel) for (let x = 0; x < fel.mask.length; x++) if (bitar(fel.mask[x] & ~nm) <= fel.max[x]) return true;
  return false;
}

function stavfelsmasker(p: Prepared, pm: Sokmasker, stavfelOk?: readonly boolean[]): Stavfelsmasker {
  const mask: number[] = [];
  const max: number[] = [];
  p.units.forEach((u, i) => {
    if (u.helord || u.stem.length < 5 || (stavfelOk && !stavfelOk[i])) return;
    mask.push(pm.units[i].s);
    max.push(u.stem.length >= 7 ? 2 : 1);
  });
  return { mask, max };
}

/**
 * Det som är räknat i förväg för namnlistan och som matchPrepared slår upp på
 * namnets plats: maskerna, namnet med fogar utan prickar, huvuddelen (fylls i
 * när den behövs) och ordlistan för stavfelsledet.
 */
type Listdata = { mask: Int32Array; maskVikt: Int32Array | null; fogatVikt: string[] | null; huvud: (string | undefined)[]; lista?: Ordlista };

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
  // Räknas först när en träff finns: de flesta namn har ingen, och sökningen
  // efter huvuddelens slut kostade mer än resten (mätt 2026-11-20).
  let huvudSlut = -2;
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
      if (huvudSlut === -2) huvudSlut = fogat.search(/ [–-] |,| med | för | till /);
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
// `lem`: ordet i sina böjningar utan prickar (ordformer), för jämförelsen med
// kategoriernas ord.
type Unit = { stem: string; key: string; vikt: string; tok: string; helord: boolean; egenskap: boolean; fogRe: RegExp | null; ihopNasta?: string; former?: string[]; kortStam?: boolean; lem: string[] };
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

// `um`, `nm` och `nmv`: sökordets och namnets teckenmasker (se Sokmasker). Ett
// ord kan bara stå i ett namn som har alla dess tecken, så jämförelsen hoppas
// över när masken visar att något saknas. Utan masker (nm = -1) prövas allt.
function tokenQuality(unit: Unit, nameNorm: string, lage: Lage, namnVikt: string, stavfelOk = true, fogat = "", lista?: Ordlista, ni = -1, um?: Unitmasker, nm = -1, nmv = -1): Ordtraff {
  const { stem: s, key } = unit;
  if (unit.helord) {
    if (starSomOrd(nameNorm, s)) return HEL;
    // "el bil" är "elbil", "sy bord" är "sybord": ett kort ord som kunden
    // särskrivit får stå ihop med ordet efter, i början av ett ord i namnet.
    return unit.ihopNasta && ordBorjar(nameNorm, unit.ihopNasta) ? HEL : INGEN;
  }
  const kanS = !um || (um.s & ~nm) === 0;
  if (unit.kortStam ? ((!um || (um.tok & ~nm) === 0) && starIOrd(nameNorm, unit.tok)) || (kanS && ordStar(nameNorm, s)) : kanS && starIOrd(nameNorm, s)) return HEL;
  if (unit.former) {
    for (let k = 0; k < unit.former.length; k++) {
      if (um && (um.former[k] & ~nm) !== 0) continue;
      if (starIOrd(nameNorm, unit.former[k])) return HEL;
    }
  }
  if (unit.fogRe && fogat && kanS && sammanskrivet(fogat, unit.fogRe, false).var) return HEL;
  const needles = SYN.get(key);
  if (needles) {
    for (const nd of needles) if (nameNorm.includes(nd)) return SYNONYM;
  }
  const envags = ENVAGS_NALAR.get(key);
  if (envags) {
    for (const nd of envags) if (nameNorm.includes(nd)) return SYNONYM;
  }
  if (lage >= VIKT && (!um || (um.vikt & ~nmv) === 0) && starIOrd(namnVikt, unit.vikt)) return UTAN_PRICKAR;
  if (lage >= STAVFEL && stavfelOk && s.length >= 5) {
    const maxDist = s.length >= 7 ? 2 : 1;
    // Med namnlistans ord räknade i förväg slås avståndet upp (se felPerOrd).
    const fel = lista && ni >= 0 ? felINamn(lista, ni, s, maxDist) : fuzzyOrdslut(s, nameNorm, maxDist);
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
    .map((t) => ({ tok: t, stem: sokstam(t), key: begreppsnyckel(t) }))
    .filter((u) => u.stem.length >= 2);
  const innehall = alla.filter((u) => !STOPWORDS.has(u.tok));
  const units: Unit[] = (innehall.length > 0 ? innehall : alla).map(({ tok, stem: s, key }) => {
    const u: Unit = {
      stem: s, key, vikt: vik(s), tok, helord: helord(tok), egenskap: arEgenskap(tok),
      fogRe: s.length >= KORTASTE_SAMMANSKRIVET ? ihopMonster(s) : null,
      lem: ordformer(tok),
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
function egnaOrd(lista: Ordlista): Set<string> {
  const ord = new Set<string>();
  for (const t of lista.ord) if (t.length >= 3 && /^[a-zåäö]+$/.test(t)) ord.add(t);
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
 * För testerna (lib/sok-2026-11-20.test.ts): träffar namnet sökningen i läget
 * (0 = som det står, 1 = också utan prickar, 2 = också med stavfel), och
 * släpper förfiltret igenom det? Förfiltret får släppa igenom för mycket men
 * aldrig hålla tillbaka en träff. `okant`: orden söks som ord som inte finns
 * i katalogen (se rankaInre), som stammen av ett okänt ord.
 */
export function forfilterProv(name: string, query: string, katalog: readonly string[], lage: 0 | 1 | 2, okant = false): { traffar: boolean; slapps: boolean } {
  const p = forberedSokning(query, katalog);
  if (okant) for (const u of p.units) { u.kortStam = true; u.vikt = vik(u.tok); }
  const n = normalize(name);
  const pm = sokmasker(p);
  const slapps = kanTraffa(pm.nagon, lage >= VIKT ? pm.nagonVikt : INGA_MASKER, lage >= STAVFEL ? stavfelsmasker(p, pm) : null, stavmask(n), stavmask(vik(n)));
  return { traffar: matchPrepared(n, p, lage).score > 0, slapps };
}

/**
 * Sökningen tolkad och prövad mot katalogens namn: de böjda formerna som
 * något namn har som eget ord, alla former av ett ensamt sökord, och orden
 * som står för sig (för ordningen, se kant).
 */
function forberedSokning(query: string, namn: readonly string[]): Prepared {
  const sparat = formerFor(namn);
  const egna = () => (sparat.egna ??= egnaOrd(listaFor(namn, sparat)));
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
// `ld`, `ni` och `pm`: det som är räknat i förväg för namnlistan, namnets plats
// i den, och sökningens teckenmasker (se Listdata och Sokmasker). Utan dem
// jämförs namnet för sig som förut.
const INGEN_TRAFF: NameMatch = Object.freeze({ score: 0, full: false });
const INGA_MASKER: readonly number[] = [];
/** Namnets huvuddel, räknad en gång per namn och lista när listan är känd. */
function huvudAv(nameNorm: string, ld: Listdata | undefined, ni: number): string {
  return ld ? (ld.huvud[ni] ??= mainPart(nameNorm)) : mainPart(nameNorm);
}
function matchPrepared(
  nameNorm: string, p: Prepared, lage: Lage, fogatNamn?: string, viktNamn?: string,
  kanda?: boolean[], stavfelOk?: readonly boolean[], ld?: Listdata, ni = -1, pm?: Sokmasker,
): NameMatch {
  // Ett och samma objekt för "ingen träff": ett varv går igenom 7 900 namn, och
  // de flesta träffar inte.
  const none = INGEN_TRAFF;
  const { q, units, ihop } = p;
  if (!q || !nameNorm) return none;
  // Namnets tecken, med och utan prickar. -1 (alla bitar) när de inte är räknade.
  const nm = ld && pm ? ld.mask[ni] : -1;
  const nmv = ld && pm && ld.maskVikt ? ld.maskVikt[ni] : -1;
  const fras = (!pm || (pm.q & ~nm) === 0) && starIOrd(nameNorm, q) && ((!p.kantFore && !p.kantEfter) || frasStar(nameNorm, q, p.kantFore, p.kantEfter));
  if (fras && !p.former) {
    return { score: starIOrd(huvudAv(nameNorm, ld, ni), q) ? 100 : 90, full: true, kant: kant(nameNorm, q, p.egna) };
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
      if (pm && (pm.former[n] & ~nm) !== 0) continue;
      const f = p.former[n];
      const star = n === 0 ? starIOrd : ordStar;
      if (!star(nameNorm, f)) continue;
      k = Math.max(k, kant(nameNorm, f, p.egna));
      iHuvud ||= star(huvudAv(nameNorm, ld, ni), f);
    }
    // Står sökningen med sina småord i namnet ("fåtölj med" i "Fåtölj med
    // fotpall") går det namnet först: kunden skriver sig mot just de varorna.
    if (k >= 0) return { score: (iHuvud ? 100 : 90) + (fras && q !== p.former[0] ? 1 : 0), full: true, kant: k };
  }
  // Sammanskrivet: flera sökord som ett ord i namnet, eller ett sökord över
  // ett bindestreck i namnet.
  const fogat = ihop ? (fogatNamn ?? medFogar(nameNorm)) : "";
  if (ihop && (ihop.flerOrd || fogat !== nameNorm) && (!pm || (pm.ihop & ~nm) === 0)) {
    const t = sammanskrivet(fogat, ihop.re, ihop.flerOrd);
    if (t.var) return { score: t.var === 2 ? 95 : 88, full: true, kant: t.slutarOrd ? 5 : 1 };
  }
  const vikt = lage >= VIKT ? (viktNamn ?? vik(nameNorm)) : "";
  if (ihop && lage >= VIKT && (ihop.flerOrd || fogat !== nameNorm) && (!pm || (pm.ihopVikt & ~nmv) === 0)) {
    const t = sammanskrivet(ld?.fogatVikt ? ld.fogatVikt[ni] : vik(fogat), ihop.reVikt, ihop.flerOrd);
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
  const baraEgenskaper = pm ? pm.baraEgenskaper : units.every((u) => u.egenskap);
  let kanter = 6;
  let mask = 0;
  let stark = 0;
  const fogatU = nameNorm.includes("-") ? (fogat || medFogar(nameNorm)) : "";
  const fogatOrd = fogatU !== nameNorm ? fogatU : "";
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    const t = tokenQuality(u, nameNorm, lage, vikt, stavfelOk ? stavfelOk[i] : true, fogatOrd, ld?.lista, ni, pm?.units[i], nm, nmv);
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
  if (units.length === 1 && sum === SYNONYM.qual && envagsI(units[0], huvudAv(nameNorm, ld, ni))) {
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
export function rankByName<T>(items: T[], nameOf: (item: T) => string, query: string, normNamn?: readonly string[], kd?: Kategoridata<T>): T[] {
  return rankaMedInfo(items, nameOf, query, normNamn, kd).traffar;
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
 *   `sokt` är sökningen som den söktes, när ett ord skrevs om utan besked:
 *     med prickarna ("fatolj" → "fåtölj") eller färdigskrivet ("stäl" →
 *     "ställ"). Träffarna är de som det ordet ger.
 */
export type Sokutfall<T> = { traffar: T[]; strukna: string[]; utan?: string[]; hela?: number; rattat?: string; liknande?: true; sokt?: string };

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

// ── Kategorierna som begrepp (2026-11-20) ────────────────────────────────────
//
// ☠️ "barnmöbler" GAV TVÅ VAROR OCH "möbler" 42 (Leonards skärmbild samma dag,
// "trägårdsmöbel" och "barnmobel"). Butiken har 132 barnmöbler och 1 521
// möbler, men ordet står inte i namnen: en barnmöbel heter "Barnbord" och en
// möbel "Soffa". Mätt mot katalogen samma dag gav 41 % av 674 kategoriord
// kategorins varor, och 50 gav ingenting ("köksredskap", "hushållsapparater",
// "garageinredning", "kontorsmöbler").
//
// Sökningen vet nu vilka kategorier varje vara hör till (sökindexet bär dem,
// app/api/search-index/route.ts), och ett sökord kan träffa varan genom
// kategorins namn:
//
//   LIKA    sökordet är ett av kategorins ord, i någon böjning och med eller
//           utan prickar: "barnmobel" är Barnmöbler, "leksak" Leksaker & Spel.
//   HUVUD   sökordet är huvudet i kategorins ord, eller en synonym står i
//           namnet: "möbler" i Utemöbler, "lampa" och Belysning.
//   FORLED  kategorins ord börjar med sökordet: "hund" i Hundburar. Säger vad
//           varan är TILL, inte vad den är.
//
// En vara hör också till kategorins föräldrar: en barnmöbel är en vara i Barn
// & Familj. Två ställen använder det:
//
//   1. SOM RESERV, när inget namn har alla sökord (kategoriVarv): varje sökord
//      får träffa i namnet ELLER genom en kategori. "barnmöbler" visar
//      kategorin, och "kontorsmöbler" (delat i "kontors möbler") visar
//      möblerna med kontor i namnet. En sökning som redan har en hel träff i
//      namnen ändras inte.
//   2. FÖR ETT ENSAMT BEGREPPSORD som också står i några namn (medBegrepp):
//      "belysning" visade en sängram, en pizzaugn och en kylmonter "med
//      belysning" före varenda lampa, och "leksaker" 73 av butikens 485.
const K_FORLED = 1, K_HUVUD = 2, K_LIKA = 3;
const K_KVAL = [0, 0.5, 0.8, 0.9];

/** En kategori i sökningen: namnet, och förälderns plats i listan (-1 för en avdelning). */
export type SokKat = { n: string; f: number };

/**
 * Kategorierna, och vilka varje vara ligger i: platser i `kat`. Föräldrarna
 * räknas in här, så varan behöver bara bära sina egna. En negativ plats,
 * -(plats + 1), är en vara som bara hör till den kategorin och inte till
 * föräldrarna (lib/bara-i-underkategorin.ts).
 */
export type Kategoridata<T> = { kat: readonly SokKat[]; av: (item: T) => readonly number[] | null | undefined };

// `delar`: hur många sorters varor namnet räknar upp ("Selar, Koppel &
// Transport" är tre). En kategori med tre eller fler är en samling, och ett
// av orden säger inte vad resten av varorna är.
type KatInfo = { namn: string; ord: string[]; vikta: string[]; lem: string[][]; delar: number };
const katInfoCache = new WeakMap<readonly SokKat[], KatInfo[]>();
function katInfoFor(kat: readonly SokKat[]): KatInfo[] {
  let info = katInfoCache.get(kat);
  if (!info) {
    info = kat.map((k) => {
      // Mjuka bindestreck (U+00AD) står i långa kategorinamn för radbrytningen.
      const namn = normalize((k.n || "").replace(/­/g, ""));
      const ord = [...new Set([...tokenize(namn), ...tokenize(utanBindestreck(namn))])]
        .filter((o) => o.length >= 3 && !STOPWORDS.has(o) && /^[a-zåäö]+$/.test(o));
      return { namn, ord, vikta: ord.map(vik), lem: ord.map(ordformer), delar: namn.split(/\s*[&,]\s*|\s+och\s+/).filter(Boolean).length };
    });
    katInfoCache.set(kat, info);
  }
  return info;
}

/** Sökordet utan prickar, för jämförelsen med kategoriernas ord (huvudI). */
function utanPrickar(u: Unit): Unit {
  const tok = vik(u.tok);
  const stam = vik(u.stem);
  if (tok === u.tok && stam === u.stem && !u.former?.some((f) => vik(f) !== f)) return u;
  return { ...u, tok, stem: stam, former: u.former?.map(vik) };
}

/** Hur sökordet träffar kategorin: 0, K_FORLED, K_HUVUD eller K_LIKA. */
function katSlag(u: Unit, uVikt: Unit, k: KatInfo): number {
  let bast = 0;
  for (let i = 0; i < k.ord.length; i++) {
    if (delarForm(u.lem, k.lem[i])) return K_LIKA;
    if (bast >= K_HUVUD) continue;
    if (huvudI(k.ord[i], u) || (uVikt !== u && huvudI(k.vikta[i], uVikt))) bast = K_HUVUD;
    else if (bast < K_FORLED && uVikt.stem.length >= 4 && k.vikta[i].length >= uVikt.stem.length + 3 && k.vikta[i].startsWith(uVikt.stem)) bast = K_FORLED;
  }
  if (bast < K_HUVUD) {
    for (const nd of SYN.get(u.key) ?? []) if (k.namn.includes(nd)) return K_HUVUD;
    for (const nd of ENVAGS_NALAR.get(u.key) ?? []) if (k.namn.includes(nd)) return K_HUVUD;
  }
  return bast;
}

/** Ord som står i kategorinamn utan att säga vad varorna är: "Köksredskap & Tillbehör", "Verkstadsutrustning". */
const INGET_BEGREPP = new Set(["tillbehor", "utrustning", "sak", "saker", "pryl", "prylar", "produkt", "produkter", "artikel", "artiklar", "varor"]);

/** Per sökord: hur varje kategori träffar. Null när ingen kategori träffar något sökord. */
function katSlagFor(p: Prepared, info: readonly KatInfo[]): Uint8Array[] | null {
  let nagon = false;
  const ut = p.units.map((u) => {
    const rad = new Uint8Array(info.length);
    if (u.helord || u.egenskap || !/^[a-zåäö]+$/.test(u.tok) || INGET_BEGREPP.has(vik(u.tok))) return rad;
    const uVikt = utanPrickar(u);
    for (let c = 0; c < info.length; c++) {
      const s = katSlag(u, uVikt, info[c]);
      if (s) { rad[c] = s; nagon = true; }
    }
    return rad;
  });
  return nagon ? ut : null;
}

// Varornas kategorier, och kategoriernas varor med underkategoriernas
// inräknade, sparade per varulista: sökrutorna skickar samma lista vid varje
// tangent. Platserna i `medl` står i listans ordning.
type Medlemskap = { kat: readonly SokKat[]; egna: (readonly number[] | null)[]; medl: number[][] };
const medlemsCache = new WeakMap<object, Medlemskap>();
function medlemskapFor<T>(items: readonly T[], kd: Kategoridata<T>): Medlemskap {
  const sparat = medlemsCache.get(items);
  if (sparat && sparat.kat === kd.kat) return sparat;
  const antal = kd.kat.length;
  const medl: number[][] = Array.from({ length: antal }, () => []);
  const sedd = new Int32Array(antal).fill(-1);
  const egna = items.map((item, i) => {
    const ks = kd.av(item);
    if (!ks || ks.length === 0) return null;
    for (const k of ks) {
      // En negativ plats ärver inte uppåt. Högst åtta led, mot en trasig tabell.
      const start = k >= 0 ? k : -k - 1;
      for (let c = start, led = 0; c >= 0 && c < antal && led < 8; c = k >= 0 ? kd.kat[c].f : -1, led++) {
        if (sedd[c] === i) break;
        sedd[c] = i;
        medl[c].push(i);
      }
    }
    return ks;
  });
  const ny = { kat: kd.kat, egna, medl };
  medlemsCache.set(items, ny);
  return ny;
}

/** Ligger kategorin `c` under kategorin `f` (högst åtta led)? */
function arUnder(kat: readonly SokKat[], c: number, f: number): boolean {
  for (let x = kat[c]?.f ?? -1, led = 0; x >= 0 && x < kat.length && led < 8; x = kat[x].f, led++) if (x === f) return true;
  return false;
}

/** Antalet ettställda bitar. */
function bitar(m: number): number {
  let n = 0;
  for (let x = m; x !== 0; x &= x - 1) n++;
  return n;
}

/** Hur stor del av en begreppskategoris varor som högst får bära ordet i namnet. */
const BEGREPP_UNDER = 0.35;

/** Huvudord som bara säger "saker till": "badrumsmöbler", "hundsaker", "kattprylar". */
const ALLMANNA_HUVUDORD = new Set([
  "möbel", "möbler", "möblerna", "sak", "saker", "sakerna", "pryl", "prylar", "grej", "grejer", "produkt", "produkter",
  "artikel", "artiklar", "varor", "tillbehör", "utrustning",
]);
const ALLMANNA_UTAN_PRICKAR = new Set([...ALLMANNA_HUVUDORD].map(vik));
/**
 * Är ordet ett allmänt huvudord, som det står eller skrivet utan prickar
 * ("mobler")? ☠️ Inte med ANDRA prickar: första versionen jämförde utan
 * prickar åt båda håll, och "boxningssäk" lästes som "boxnings" + "sak", ett
 * rättstavat ord som aldrig blev "boxningssäck" (2026-11-20).
 */
function arAllmantHuvudord(x: string): boolean {
  return ALLMANNA_HUVUDORD.has(x) || (vik(x) === x && ALLMANNA_UTAN_PRICKAR.has(x));
}

// ── Är sökordet ett ord? (2026-11-20) ────────────────────────────────────────
//
// ☠️ ETT ORD SOM INTE FINNS RÄTTADES ALDRIG NÄR BOKSTÄVERNA RÅKADE STÅ I ETT
// NAMN. Stavningen rättades bara när inget namn träffade, och en delsträng
// träffar nästan alltid något. Mätt mot katalogen 2026-11-20 (2 089
// felstavningar av de 320 vanligaste varuorden, 79,5 % rätt):
//
//   "lapor"   stammen "lap" stod i "laptophållare": 28 träffar, ingen lampa.
//   "klosar"  stammen "klos" stod i "klossar": rätt varor, fel ordning.
//   "vaska"   stod i "guldVASKArsats": en guldvaskarsats, ingen väska.
//   "sgäll"   utan prickar i "returluftSGALLer": sex galler, inget ställ.
//   "stäl"    stod i "odlingSTÄLt": 365 tält före första stället.
//   "xtolar"  fel första bokstav: noll (233 av 320 sådana gav ingenting).
//
// Nu prövas varje sökord mot katalogens ORD innan namnen genomsöks. Ett ord
// som finns rörs inte. Ett ord som inte finns skrivs om:
//
//   med prickarna   "vaska" → "väska", utan besked (som "fatolj" förut).
//   färdigskrivet   "stäl" → "ställ", när alla ord som börjar så är det ordet.
//   rättstavat      "lapor" → "lampor", ett fel, med besked till kunden.
//
// Ger det omskrivna ordet inga varor gäller sökningen som den skrevs.
//
// ORDET FINNS när det står för sig i ett namn, är en böjning av ett sådant
// ord, slutar ett sammansatt ord ("bank" i "powerbank") eller börjar ett
// ("kläd" i "klädställ"), eller är ett begreppsord (synonym, envägsord,
// kategori). Reglerna är generösa med flit: ett ord som felaktigt räknas som
// känt söks som förut, men ett känt ord som räknas som okänt hade kunnat
// "rättas" till något annat.

/** Katalogens ordförråd för rättningen, sparat per namnlista. */
type Ordbok = {
  antal: Map<string, number>;
  /** Orden av bokstäver, tre tecken och uppåt, sorterade. */
  ord: string[];
  /** Samma ord utan prickar, på samma platser. */
  ordVikt: string[];
  /** Vilka bokstäver ordet har (en bit per bokstav), på samma platser: se bokstavsmask. */
  ordMask: Int32Array;
  /** I hur många namn ordet står, på samma platser. */
  ordAntal: Int32Array;
  /** 1 för småord, färger och mått, som aldrig föreslås (på samma platser). */
  ordInte: Uint8Array;
  /** Ordet utan prickar → ordet som står i flest namn. */
  medPrickar: Map<string, string>;
  /** Namnens första ord, med antal: där står vad varan är. */
  forsta: Map<string, number>;
};

function ordbokFor(namn: readonly string[], sparat: ListFormer): Ordbok {
  if (sparat.bok) return sparat.bok;
  const antal = (sparat.antal ??= ordAntal(listaFor(namn, sparat)));
  const ord = [...antal.keys()].filter((o) => o.length >= 3 && /^[a-zåäö]+$/.test(o)).sort();
  const ordVikt = ord.map(vik);
  const medPrickar = new Map<string, string>();
  for (let i = 0; i < ord.length; i++) {
    const har = medPrickar.get(ordVikt[i]);
    if (!har || (antal.get(ord[i]) ?? 0) > (antal.get(har) ?? 0)) medPrickar.set(ordVikt[i], ord[i]);
  }
  const forsta = new Map<string, number>();
  for (const n of namn) {
    const o = /^[a-zåäö]+/.exec(n)?.[0];
    if (o && o.length >= 4) forsta.set(o, (forsta.get(o) ?? 0) + 1);
  }
  // Per plats, så att rättningen slipper slå upp varje ord vid varje tangent.
  const ordMask = new Int32Array(ord.length);
  const antalet = new Int32Array(ord.length);
  const ordInte = new Uint8Array(ord.length);
  for (let i = 0; i < ord.length; i++) {
    ordMask[i] = bokstavsmask(ordVikt[i]);
    antalet[i] = antal.get(ord[i]) ?? 1;
    ordInte[i] = STOPWORDS.has(ord[i]) || arEgenskap(ord[i]) ? 1 : 0;
  }
  return (sparat.bok = { antal, ord, ordVikt, ordMask, ordAntal: antalet, ordInte, medPrickar, forsta });
}

/**
 * Vilka bokstäver ordet har, en bit per bokstav (a–z, ordet utan prickar).
 * Ett fel ändrar högst två bitar (en bokstav bort, en till), så två ord vars
 * masker skiljer sig i fler än två bitar per tillåtet fel ligger för långt
 * ifrån varandra. Rättningen går igenom hela ordförrådet vid varje tangent i
 * ett okänt ord, och masken sparar nio av tio avståndsräkningar.
 */
function bokstavsmask(ordUtanPrickar: string): number {
  let m = 0;
  for (let i = 0; i < ordUtanPrickar.length; i++) {
    const c = ordUtanPrickar.charCodeAt(i) - 97;
    if (c >= 0 && c < 26) m |= 1 << c;
  }
  return m;
}

/** Första platsen i den sorterade listan där ordet inte är mindre än `t`. */
function forstaPlats(ord: readonly string[], t: string): number {
  let lo = 0;
  let hi = ord.length;
  while (lo < hi) {
    const mitt = (lo + hi) >> 1;
    if (ord[mitt] < t) lo = mitt + 1;
    else hi = mitt;
  }
  return lo;
}

/** Ändelser som följer på ett helt ord sist i en sammansättning. Inte ett ensamt
 *  n, t, a eller e: "stäl" + "t" är inget böjt ord i "odlingstält". */
const HELA_ANDELSER = new Set(["ar", "er", "or", "en", "et", "arna", "erna", "orna", "na", "an"]);

/**
 * Står ordet sist i ett sammansatt ord, med minst tre bokstäver före?
 * `slag`: 2 = som det står, 1 = med en ändelse efter, 0 = nej. `namn`: i hur
 * många namn det står sist som det står (ordet för sig räknas med).
 *
 * ☠️ Det som står före ska vara ett ord, eller så ska ordet sluta minst två
 * olika ord: "varbord" står sist i "skrivarbord" och "ianter" i "varianter",
 * och inget av dem är ett ord. "bank" står i "hantelbank" efter "hantel".
 */
function slutarOrd(t: string, bok: Ordbok): { slag: 0 | 1 | 2; namn: number } {
  let namn = bok.antal.get(t) ?? 0;
  const kantForled = (o: string, i: number): boolean => {
    const fore = o.slice(0, i);
    return bok.antal.has(fore) || (fore.length >= 4 && fore.endsWith("s") && bok.antal.has(fore.slice(0, -1)));
  };
  let somDetStar = 0, somDetStarKant = false;
  let medAndelse = 0, medAndelseKant = false;
  for (const o of bok.ord) {
    if (o.length < t.length + 2) continue;
    const i = o.lastIndexOf(t);
    // Tre bokstäver före, eller ett av de korta förleden ("el" i "elbil").
    if (i < 3 && !(i === 2 && KORTA_FORLED.has(o.slice(0, 2)))) continue;
    const rest = o.length - i - t.length;
    if (rest === 0) {
      somDetStar++;
      namn += bok.antal.get(o) ?? 0;
      somDetStarKant ||= kantForled(o, i);
    } else if (rest <= 4 && HELA_ANDELSER.has(o.slice(i + t.length))) {
      medAndelse++;
      medAndelseKant ||= kantForled(o, i);
    }
  }
  const slag = somDetStarKant || somDetStar >= 2 ? 2 : medAndelseKant || medAndelse >= 2 ? 1 : 0;
  return { slag, namn };
}

/** Så många gånger vanligare ska ordet med prickar vara för att gå före bokstäverna som de står. */
const PRICKAR_GANGER = 5;

/**
 * Grundformerna ett böjt ord kan komma av: stammen, entalet och de böjda
 * formerna. Stammen som sökningen räknar den (sokstam): "hålare" har ingen
 * stam "hål", och "skönhet" ingen stam "skön".
 */
function grundformer(t: string): string[] {
  const s = sokstam(t);
  return [...(s !== t && s.length >= 3 ? [s] : []), ...entalAv(t), ...bojdaFormer(t)];
}

/**
 * Är `skrivet` ordet `ord` med prickar som saknas, och inget annat? "vaska" är
 * "väska" utan prickar, men "stäl" är inte "stål": där står en annan prick, och
 * det är ett stavfel som ska rättas med besked (eller ett annat ord).
 */
function saknarBaraPrickar(skrivet: string, ord: string): boolean {
  if (skrivet.length !== ord.length) return false;
  for (let i = 0; i < ord.length; i++) if (skrivet[i] !== ord[i] && skrivet[i] !== vik(ord[i])) return false;
  return true;
}

const ARORD = 0, BORJAN = 1, OKANT = 2;
/** `byt`: ordet att söka på i stället. `tyst`: bytet behöver inget besked. */
type Ordstatus = { slag: 0 | 1 | 2; byt?: string; tyst?: boolean };
const KANT_ORD: Ordstatus = { slag: ARORD };

/** Finns sökordet i katalogen, är det början på ett ord, eller är det okänt? */
function ordstatus(u: Unit, bok: Ordbok, arBegrepp: (u: Unit) => boolean, begrepp: readonly string[]): Ordstatus {
  const t = u.tok;
  if (bok.antal.has(t) || SYN.has(u.key) || ENVAGS_NALAR.has(u.key)) return KANT_ORD;
  const slut = slutarOrd(t, bok);
  // Samma bokstäver med prickar: "vaska" är "väska", "stang" är "stång".
  const funnen = bok.medPrickar.get(vik(t));
  const medPrickar = funnen && funnen !== t && saknarBaraPrickar(t, funnen) ? funnen : null;
  if (slut.slag === 2) {
    // ☠️ "skap" står sist i "redskap" och "trädgårdsredskap", så det fanns,
    // och den som skrev utan prickar fick redskap i stället för skåp. Är
    // ordet med prickar många gånger vanligare gäller det, med besked: den
    // som faktiskt menade bokstäverna ser vad som hände.
    if (medPrickar && slutarOrd(medPrickar, bok).namn >= PRICKAR_GANGER * slut.namn) return { slag: ARORD, byt: medPrickar };
    return KANT_ORD;
  }
  if (medPrickar) return { slag: ARORD, byt: medPrickar, tyst: true };
  if (arBegrepp(u)) return KANT_ORD;
  const former = grundformer(t);
  for (const f of former) if (bok.antal.has(f)) return KANT_ORD;
  for (const e of HELA_ANDELSER) if (bok.antal.has(t + e)) return KANT_ORD;
  if (bok.antal.has(`${t}a`) || bok.antal.has(`${t}e`)) return KANT_ORD;
  if (slut.slag === 1) return KANT_ORD;
  // En böjning av ett ord med prickar: "bankar" är "bänk". Riktiga ental,
  // inte stammen: "plator" är inte "plåt" (det hade hetat "platar").
  // Minst fyra bokstäver, och inte ord som bara ser böjda ut: "laser" är inte
  // "las" + "er", och blev annars "lås".
  if (!INTE_BOJT.has(t)) {
    for (const f of [...entalAv(t), ...bojdaFormer(t)]) {
      if (f.length < 4) continue;
      const m = bok.medPrickar.get(vik(f));
      if (m && saknarBaraPrickar(f, m)) return { slag: ARORD, byt: m, tyst: true };
    }
  }
  // En böjning av ett ord som bara står sist i sammansättningar.
  for (const f of former) if (f.length >= 3 && slutarOrd(f, bok).slag > 0) return KANT_ORD;
  // Orden som börjar så.
  const fran = forstaPlats(bok.ord, t);
  let kortast = "";
  let alla = true;
  let antal = 0;
  for (let i = fran; i < bok.ord.length && bok.ord[i].startsWith(t); i++) {
    const o = bok.ord[i];
    antal++;
    // Förled: resten är ett eget ord, med eller utan foge-s ("kläd|ställ",
    // "kontor|s|stol").
    const rest = o.slice(t.length);
    for (const r of rest.startsWith("s") ? [rest, rest.slice(1)] : [rest]) {
      if (r.length >= 3 && (bok.antal.has(r) || bok.antal.has(stem(r)))) return KANT_ORD;
    }
    if (!kortast) kortast = o;
    else if (!o.startsWith(kortast)) {
      if (kortast.startsWith(o)) kortast = o;
      else alla = false;
    }
  }
  if (antal === 0) {
    // Början på ett begreppsord som inget namn har: "barnm" är på väg mot
    // "barnmöbler" och "tradgardsmo" mot "trädgårdsmöbler". Ordet skrivs
    // färdigt, så att listan visar samma varor som när det är klart.
    // ☠️ Förut stod början kvar som den var (2026-11-20): "tradgardsmo" gick
    // vidare till rättningen och blev "trädgårdsbro", två broar.
    //
    // Bara när inget namn har ett ord som börjar så, med eller utan prickar:
    // "tradgards" är början på 157 varors "trädgårds…" och söks som det står.
    const tv = vik(t);
    for (const w of bok.ordVikt) if (w.length > tv.length && w.startsWith(tv)) return { slag: BORJAN };
    let mal = "";
    let annat = false;
    for (const b of begreppsformer(begrepp)) {
      if (!b.vikt.startsWith(tv)) continue;
      // Prickarna som skrevs ska stå där: "trödg" är inte början på "trädgård".
      if (!saknarBaraPrickar(t, b.form.slice(0, t.length))) { annat = true; continue; }
      // Hela begreppsordet utan prickar ("tradgardsmobler") är ordet självt.
      if (b.vikt.length === tv.length) return { slag: ARORD, byt: b.mal, tyst: true };
      if (!mal || b.mal.length < mal.length || (b.mal.length === mal.length && b.mal < mal)) mal = b.mal;
    }
    if (mal) return { slag: BORJAN, byt: mal, tyst: true };
    return { slag: annat ? BORJAN : OKANT };
  }
  // Färdigskrivet: alla ord som börjar så är samma ord ("stäl" → "ställ",
  // "verkty" → "verktyg"). "hundb" är både hundbur och hundbädd och står kvar.
  if (alla && kortast.length - t.length <= 2) return { slag: BORJAN, byt: kortast, tyst: true };
  return { slag: BORJAN };
}

// Begreppsorden som rättningen känner utöver katalogens ord: synonymerna och
// envägsorden. "trägårdsmöbler" ska bli "trädgårdsmöbler" fast inget namn har
// ordet.
let fastaBegrepp: string[] | null = null;
function begreppsord(): string[] {
  return (fastaBegrepp ??= [...new Set([...SYNONYM_GROUPS.flat(), ...Object.keys(ENVAGS)])].filter((o) => /^[a-zåäö]{5,}$/.test(o)));
}

/** Ord som aldrig ska rättas till något annat: de är inte felstavade, butiken saknar dem bara. */
const RATTAS_INTE = new Set(["ikea", "jysk", "rusta", "biltema", "jula", "clas", "ohlson", "homcom", "outsunny", "vevor", "aosom", "pawhut", "vinsetto", "kleankin", "durhand", "zonekiz", "aiyaplay", "sportnow", "soozier"]);

// Tangenterna som ligger intill varandra på ett svenskt tangentbord. Mobilens
// tangenter är små, och ett fel landar oftast på grannen: "fläkg" är "fläkt"
// (g ligger under t), inte "flak".
const GRANNAR: ReadonlyMap<string, string> = (() => {
  const rader = ["qwertyuiopå", "asdfghjklöä", "zxcvbnm"];
  const forskjutning = [0, 0.3, 0.8];
  const plats: [string, number, number][] = [];
  rader.forEach((rad, r) => [...rad].forEach((c, i) => plats.push([c, r, i + forskjutning[r]])));
  const ut = new Map<string, string>();
  for (const [c, r, x] of plats) ut.set(c, plats.filter(([d, r2, x2]) => d !== c && Math.abs(r2 - r) <= 1 && Math.abs(x2 - x) <= 1.1).map(([d]) => d).join(""));
  return ut;
})();
const arGrannar = (a: string, b: string): boolean => (GRANNAR.get(a) ?? "").includes(b);

/**
 * Katalogens närmaste ord till ett ord som inte finns, eller null när inget
 * ligger trovärdigt nära. Högst `tak` fel, räknat utan prickar: "fotolj" är
 * ett fel från "fåtölj". Två fel bara när båda orden är minst åtta tecken,
 * tre när båda är minst tolv.
 *
 * Bland lika nära vinner den troligaste rättningen (mätt på 2 089
 * felstavningar av katalogens varuord 2026-11-20):
 *   - en tappad eller omkastad bokstav är vanligast, sedan en granne på
 *     tangentbordet, en bytt vokal, och sist en annan bytt bokstav,
 *   - första bokstaven slår man sällan fel på, men "xtolar" finns: en granne
 *     där kostar lite, allt annat ett helt fel till ("jatta" är "matta",
 *     inte "åtta"),
 *   - ordet som oftast ÄR varan går före ("myckel" är "nyckel", som inleder
 *     40 namn, inte "mycket"), och färger, mått och småord föreslås aldrig
 *     ("dlang" är "slang", inte "lång").
 *
 * Fyra bokstäver rättas bara när en bokstav saknas eller två bytt plats
 * ("kmin", "sotl"), och bara när rättningen är entydig: en bytt bokstav i ett
 * så kort ord är lika ofta ett annat ord.
 */
function narmasteOrd(t: string, tak: number, bok: Ordbok, begrepp: readonly string[]): string | null {
  // Samma ord prövas flera gånger i en sökning (omskrivningen, spärren för
  // färdigskrivningen, rättningen), och varje gång är en genomgång av hela
  // ordboken: svaret sparas per ordbok och begreppslista.
  let perBegrepp = narmastMinne.get(bok);
  if (!perBegrepp) narmastMinne.set(bok, (perBegrepp = new WeakMap()));
  let minne = perBegrepp.get(begrepp);
  if (!minne) perBegrepp.set(begrepp, (minne = new Map()));
  const nyckel = `${tak}|${t}`;
  const sparad = minne.get(nyckel);
  if (sparad !== undefined) return sparad;
  const ut = narmasteOrdRaknat(t, tak, bok, begrepp);
  if (minne.size >= 200) minne.clear();
  minne.set(nyckel, ut);
  return ut;
}
const narmastMinne = new WeakMap<Ordbok, WeakMap<readonly string[], Map<string, string | null>>>();
function narmasteOrdRaknat(t: string, tak: number, bok: Ordbok, begrepp: readonly string[]): string | null {
  if (t.length < 4 || RATTAS_INTE.has(t) || !/^[a-zåäö]+$/.test(t)) return null;
  const tv = vik(t);
  const tMask = bokstavsmask(tv);
  const forsta = tv[0];
  const funna: { mal: string; ord: string; fel: number; n: number }[] = [];
  const fyra = new Set<string>();
  const prova = (w: string, wv: string, n: number, mal: string, wMask: number) => {
    const skillnad = Math.abs(wv.length - tv.length);
    if (skillnad > tak || wv.length < 4) return;
    const kortast = Math.min(tv.length, wv.length);
    const lokalt = Math.min(tak, kortast >= 12 ? 3 : kortast >= 8 ? 2 : 1);
    if (skillnad > lokalt || bitar(tMask ^ wMask) > 2 * lokalt) return;
    const sammaForsta = wv[0] === forsta;
    if (!sammaForsta && tv.length < 5) return;
    const steg = ordAvstand(tv, wv, lokalt);
    if (steg > lokalt || steg === 0) return;
    if (STOPWORDS.has(w) || arEgenskap(w)) return;
    const omkastat = skillnad === 0 && sammaBokstaver(tv, wv);
    if (tv.length === 4) {
      if (!(omkastat || wv.length === 5)) return;
      fyra.add(canon(w));
    }
    let fel = steg;
    if (skillnad === 0) fel += omkastat ? -0.1 : bytetKostar(t, w);
    else if (wv.length < tv.length) fel += 0.15; // en bokstav för mycket är ovanligare än en för lite
    if (!sammaForsta) fel += skillnad === 0 && arGrannar(t[0], w[0]) ? 0.4 : 1;
    funna.push({ mal, ord: w, fel, n });
  };
  for (let i = 0; i < bok.ord.length; i++) {
    const w = bok.ord[i];
    if (w.length < 4) continue;
    prova(w, bok.ordVikt[i], bok.ordAntal[i], w, bok.ordMask[i]);
  }
  // Begreppsorden, i de former kunden kan ha menat ("trägårdsmöbel" är
  // entalet av "trädgårdsmöbler"). Rättningen blir begreppsordet som det står.
  for (const b of begreppsformer(begrepp)) if (!bok.antal.has(b.mal)) prova(b.form, b.vikt, 3, b.mal, b.mask);
  if (funna.length === 0 || (tv.length === 4 && fyra.size > 2)) return null;
  // De närmaste vägs mot hur vanligt ordet är, och mest mot hur ofta det är
  // varan (står sist i namnets första ord). Det räknas bara för de bästa.
  funna.sort((a, b) => a.fel - 0.15 * Math.log(1 + a.n) - (b.fel - 0.15 * Math.log(1 + b.n)));
  let bast = "";
  let bastFel = Infinity;
  for (const k of funna.slice(0, 8)) {
    const fel = k.fel - 0.15 * Math.log(1 + k.n + 4 * varuAntal(k.ord, bok));
    if (fel < bastFel) { bast = k.mal; bastFel = fel; }
  }
  return bast || null;
}

/**
 * Vad ett begreppsord som inget namn har väger mot katalogens ord, räknat i
 * varor. Ett begreppsord står för en hel hylla i butiken, så den som är på
 * väg att skriva det ska komma dit.
 * ☠️ Med vikten 3 gav "trägårdsmö" en tom lista mitt i ordet (2026-11-20),
 * mellan "trägårdsm" och "trägårdsmöb" som båda visade trädgårdsmöblerna:
 * ett ensamt begreppsord nådde inte gränsen för en tappad bokstav.
 */
const BEGREPP_VIKT = 12;

// Begreppsorden i sina former, räknade en gång per lista: rättningen går
// igenom dem vid varje tangent i ett ord som inte finns.
type Begreppsform = { form: string; vikt: string; mal: string; mask: number; inte: boolean };
const formerAvBegrepp = new WeakMap<readonly string[], Begreppsform[]>();
function begreppsformer(begrepp: readonly string[]): Begreppsform[] {
  let ut = formerAvBegrepp.get(begrepp);
  if (!ut) {
    ut = [];
    for (const b of begrepp) {
      for (const f of new Set([b, ...grundformer(b)])) if (f.length >= 4) ut.push({ form: f, vikt: vik(f), mal: b, mask: bokstavsmask(vik(f)), inte: STOPWORDS.has(f) || arEgenskap(f) });
    }
    formerAvBegrepp.set(begrepp, ut);
  }
  return ut;
}

/**
 * Ordet kunden är på väg att skriva, när det skrivna är BÖRJAN på ett ord med
 * ett fel i: "trägå" är början på "trädgård", "fotöl" på "fåtölj". Svarar med
 * ordet och hur vanliga orden som börjar så är tillsammans, eller null.
 *
 * ☠️ Utan den rättades halvskrivna ord som om de vore färdiga (2026-11-20):
 * "trägå" blev "tråg" och visade fodertråg, "trägår" blev "trådar" och "fotöl"
 * "foto", med besked om det, medan kunden skrev vidare mot trädgårdsmöbler.
 *
 * Ett fel, och första bokstaven rätt eller grannen på tangentbordet. Svaret är
 * ordet de flesta av dem börjar med, eller den rättade början själv när de går
 * åt olika håll.
 */
function felstavadBorjan(t: string, bok: Ordbok, begrepp: readonly string[]): { ord: string; vikt: number } | null {
  if (t.length < 4 || RATTAS_INTE.has(t) || !/^[a-zåäö]+$/.test(t)) return null;
  const tv = vik(t);
  // Per rättad början: orden som börjar så, hur vanliga de är tillsammans, och
  // hur många varor felet kräver för att vara trovärdigt (`minst`).
  type Grupp = { ord: { ord: string; vikt: number }[]; minst: number };
  const grupper = new Map<string, Grupp>();
  const lagg = (borjan: string, w: string, vikt: number, minst: number) => {
    const g = grupper.get(borjan);
    if (g) g.ord.push({ ord: w, vikt });
    else grupper.set(borjan, { ord: [{ ord: w, vikt }], minst });
  };
  const forsta = tv.charCodeAt(0);
  const resten = tv.slice(1);
  const prova = (w: string, wv: string, n: number, inte: boolean) => {
    if (wv.length <= tv.length || inte) return;
    if (wv.charCodeAt(0) !== forsta) {
      // Fel första bokstav: bara en granne på tangentbordet, och resten ska
      // stå som det skrevs ("jyll" är "hyll", "dkjut" är "skjut").
      if (t.length >= 4 && arGrannar(t[0], w[0]) && wv.startsWith(resten, 1)) lagg(w.slice(0, tv.length), w, n * 0.7, 8);
      return;
    }
    // En tappad bokstav först (början är då en bokstav längre), sedan en bytt
    // eller omkastad, sist en för mycket: "hunb" är "hundb", inte "hun".
    for (let L = Math.min(tv.length + 1, wv.length); L >= tv.length - 1; L--) {
      if (ordAvstand(tv, wv.slice(0, L), 1) > 1) continue;
      const borjan = w.slice(0, L);
      // Hur troligt felet är, och hur många varor det kräver. En tappad eller
      // omkastad bokstav är vanligast. En bytt bokstav gäller lättast när den
      // är grannen på tangentbordet ("garfer" är "garder"), och svårast när
      // den ligger långt bort ("klosa" är "klossa" hellre än "klöst").
      if (L > tv.length) lagg(borjan, w, n, 5);
      else if (L < tv.length) lagg(borjan, w, n * 0.6, 8);
      else if (sammaBokstaver(tv, wv.slice(0, L))) lagg(borjan, w, n * 0.8, 5);
      else {
        const kostar = bytetKostar(t, borjan);
        lagg(borjan, w, n * Math.max(0.05, 1 - kostar * 1.9), kostar <= 0.15 ? 8 : 20);
      }
      return;
    }
  };
  for (let i = 0; i < bok.ord.length; i++) prova(bok.ord[i], bok.ordVikt[i], bok.ordAntal[i], bok.ordInte[i] === 1);
  for (const b of begreppsformer(begrepp)) if (b.form === b.mal && !bok.antal.has(b.mal)) prova(b.mal, b.vikt, BEGREPP_VIKT, b.inte);
  let borjan = "";
  let vald: Grupp | null = null;
  let summa = 0;
  for (const [b, g] of grupper) {
    const v = g.ord.reduce((x, f) => x + f.vikt, 0);
    // ☠️ "pulka" är inte början på "polkagris" (2026-11-19, nio tomtar blev
    // svaret): felet ska vara trovärdigt för så många varor som börjar så.
    if (v >= g.minst && v > summa) { borjan = b; vald = g; summa = v; }
  }
  // Fyra bokstäver ligger ett fel från början på mycket: bara när många varor börjar så.
  if (!vald || (t.length === 4 && summa < 20)) return null;
  // Ordet de flesta av dem börjar med ("trädgård" för trädgårdsbord och
  // trädgårdsbänk). Finns inget sådant gäller början som den är: "trägårds"
  // söks som "trädgårds", och visar allt som börjar så.
  const funna = vald.ord.sort((a, b) => a.ord.length - b.ord.length || b.vikt - a.vikt);
  for (const f of funna) {
    let familj = 0;
    for (const g of funna) if (g.ord.startsWith(f.ord)) familj += g.vikt;
    if (familj * 2 >= summa) return { ord: f.ord, vikt: summa };
  }
  return { ord: borjan, vikt: summa };
}

/**
 * Vad bytta bokstäver kostar utöver felen, för två lika långa ord: en granne
 * på tangentbordet minst, sedan en vokal mot en vokal, mest en annan bokstav.
 * Varje bytt bokstav räknas: "avdrqare" är "avdragare" (en bokstav saknas, en
 * är grannen) hellre än "avdelare" (två bytta, den ena långt bort).
 */
function bytetKostar(a: string, b: string): number {
  let kostnad = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    // En prick som skiljer är inget byte: "lapor" och "lådor" skiljer i p och d.
    if (a[i] === b[i] || vik(a[i]) === vik(b[i])) continue;
    kostnad += arGrannar(a[i], b[i]) ? 0.15 : /[aeiouyåäö]/.test(a[i]) && /[aeiouyåäö]/.test(b[i]) ? 0.2 : 0.5;
  }
  return kostnad || 0.5;
}

/** I hur många namn ordet är varan: det första ordet slutar så (med eller utan en ändelse). */
function varuAntal(w: string, bok: Ordbok): number {
  let n = 0;
  for (const [o, antal] of bok.forsta) {
    const i = o.lastIndexOf(w);
    if (i >= 0 && (i + w.length === o.length || HELA_ANDELSER.has(o.slice(i + w.length)))) n += antal;
  }
  return n;
}

/** Får ordet prövas mot ordboken? Korta ord, tal, färger och mått rörs inte. */
function provas(u: Unit): boolean {
  return !u.helord && !u.egenskap && u.tok.length >= 4 && /^[a-zåäö]+$/.test(u.tok);
}

/**
 * Ett känt ord följt av ett allmänt huvudord: "barnsaker", "hundprylar",
 * "badrumsmöbler". Rättstavat, fast inget namn har ordet, och ska delas (se
 * medForledet), inte rättas: "barnsaker" låg ett fel från "barnsäkert".
 * Svarar med förledet som det står i katalogen ("barn", "badrum"), eller null.
 */
function allmantForled(t: string, bok: Ordbok): string | null {
  for (let i = 3; i <= t.length - 3; i++) {
    if (!arAllmantHuvudord(t.slice(i))) continue;
    const forled = t.slice(0, i);
    if (bok.antal.has(forled)) return forled;
    if (forled.endsWith("s") && forled.length >= 4 && bok.antal.has(forled.slice(0, -1))) return forled.slice(0, -1);
  }
  return null;
}
const allmantSammansatt = (t: string, bok: Ordbok): boolean => allmantForled(t, bok) !== null;

/**
 * Sökningen med orden som inte finns i katalogen omskrivna (se ovan).
 * `q` är null när inget ord skrevs om. `besked`: kunden ska få veta vad
 * träffarna gäller (en rättad stavning). `okanda`: sökorden som varken finns
 * eller är början på ett ord, och som inte fick någon omskrivning.
 * `finnsInte`: sökorden som varken finns eller är början på ett ord, med
 * eller utan omskrivning (se ofardigtSammansatt).
 */
function skrivOm(p: Prepared, bok: Ordbok, begrepp: readonly string[], arBegrepp: (u: Unit) => boolean): { q: string | null; besked: boolean; okanda: boolean[]; finnsInte: boolean[] } {
  const byten = new Map<string, string>();
  const okanda: boolean[] = new Array(p.units.length).fill(false);
  // Orden som varken finns i katalogen eller är början på ett ord där.
  const finnsInte: boolean[] = new Array(p.units.length).fill(false);
  let besked = false;
  // Hur vanligt ordet är, och mest hur ofta det är varan (se narmasteOrd). Ett
  // begreppsord som inget namn har väger som en hylla i butiken.
  const vikt = (w: string): number => (bok.antal.has(w) ? (bok.antal.get(w) ?? 0) + 4 * varuAntal(w, bok) : begrepp.includes(w) ? BEGREPP_VIKT : 0);
  p.units.forEach((u, i) => {
    if (!provas(u) || byten.has(u.tok)) return;
    const st = ordstatus(u, bok, arBegrepp, begrepp);
    if (st.slag === ARORD) {
      if (st.byt) {
        byten.set(u.tok, st.byt);
        if (!st.tyst) besked = true;
      }
      return;
    }
    const forled = allmantForled(u.tok, bok);
    if (forled !== null) {
      // ☠️ "lekssaker" är "leksaker" med ett s för mycket, inte "leks" +
      // "saker" (2026-11-20: 61 lekmattor i stället för leksakerna). Ligger
      // ordet ett fel från ett katalogord som är vanligare än förledet gäller
      // rättningen: 73 namn har "leksaker", färre har "lek" för sig.
      // "barnsaker" står kvar: "barn" står i hundratals namn, "barnsäkert" i få.
      const nara = narmasteOrd(u.tok, 1, bok, begrepp);
      if (!(nara && bok.antal.has(nara) && (bok.antal.get(nara) ?? 0) > (bok.antal.get(forled) ?? 0))) return;
    }
    // Början på flera olika ord: inget att skriva om, och inget att räkna.
    if (st.slag === BORJAN && !st.byt) return;
    if (st.slag === OKANT) finnsInte[i] = true;
    const rattat = narmasteOrd(u.tok, 1, bok, begrepp);
    if (st.slag === BORJAN) {
      // ☠️ "hundbr" är början på "hundbro" (ett agilityhinder) och ett fel
      // från "hundbur" (19 varor). Det färdigskrivna ordet gäller, utom när
      // rättningen är många gånger vanligare.
      // Den som skrivit en bokstav till har inte skrivit fel: "barnm" är på
      // väg mot "barnmöbler", inte ett "barn" med ett m för mycket.
      if (st.byt && !(rattat && rattat !== st.byt && !u.tok.startsWith(rattat) && vikt(rattat) >= 5 * Math.max(1, vikt(st.byt)))) byten.set(u.tok, st.byt);
      else if (st.byt && rattat) { byten.set(u.tok, rattat); besked = true; }
      return;
    }
    // Färdigt ord med ett fel, eller början på ett ord med ett fel? Början
    // gäller när orden som börjar så är minst tre gånger vanligare än
    // rättningen ("trägå": 8 tråg mot över tusen varor med trädgård).
    const borjan = felstavadBorjan(u.tok, bok, begrepp);
    if (borjan && borjan.ord !== rattat && (!rattat || borjan.vikt >= 3 * Math.max(1, vikt(rattat)))) {
      byten.set(u.tok, borjan.ord);
      besked = true;
      return;
    }
    if (rattat) { byten.set(u.tok, rattat); besked = true; }
    // Börjar något ord med stammen kan kunden vara på väg dit ("kontorst" är
    // snart "kontorstol", och stammen "kontors" inleder "kontorsstol"): då
    // söks ordet som förut.
    else okanda[i] = !(bok.ord[forstaPlats(bok.ord, u.stem)] ?? "").startsWith(u.stem);
  });
  return { q: byten.size === 0 ? null : p.q.replace(/[a-zåäö0-9]+/g, (t) => byten.get(t) ?? t), besked, okanda, finnsInte };
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
//
// `kd` är kategorierna och vilka varje vara hör till (se Kategoridata). Utan
// den söks bara namnen, som förut.
export function rankaMedInfo<T>(items: T[], nameOf: (item: T) => string, query: string, normNamn?: readonly string[], kd?: Kategoridata<T>): Sokutfall<T> {
  const namn = normNamn ?? items.map((item) => normalize(nameOf(item)));
  const lage = { strangt: false };
  const forsta = rankaInre(items, nameOf, query, namn, kd, 0, lage);
  // Gav prövningen mot ordboken ingenting söks orden som de står, med stam
  // och allt, som före 2026-11-20: hellre en svag träff än ingen. Bara när
  // det första varvet faktiskt sökte strängare, annars blir svaret detsamma.
  // Andra varvet rättar och delar inte om (djup 2): de leden beror inte på hur
  // strängt orden söks, och gav redan ingenting.
  const u = forsta.traffar.length > 0 || !lage.strangt ? forsta : rankaInre(items, nameOf, query, namn, kd, 2);
  // Svaret ligger kvar i minnet (se rankaInre): den som anropar får egna
  // listor, så att en sortering på plats aldrig ändrar nästa svar.
  return { ...u, traffar: u.traffar.slice(), strukna: u.strukna.slice(), ...(u.utan ? { utan: u.utan.slice() } : {}) };
}

/** Kategoriernas ord som rättningen får föreslå, sparade per kategorilista. */
const katBegrepp = new WeakMap<readonly SokKat[], string[]>();
function begreppFor(kat: readonly SokKat[] | undefined): string[] {
  if (!kat) return begreppsord();
  let ut = katBegrepp.get(kat);
  if (!ut) {
    ut = [...new Set([...begreppsord(), ...katInfoFor(kat).flatMap((k) => k.ord).filter((o) => o.length >= 5)])];
    katBegrepp.set(kat, ut);
  }
  return ut;
}

// `djup` räknar omskrivningarna: en sökning skrivs om högst två gånger (ett
// okänt ord, och sedan en rättad stavning eller ett delat ord). Djup 3
// (STRIKT) är ett försök med ett färdigskrivet eller rättat ord: det ska
// träffa som det står, i namnen, genom kategorierna eller delat, utan
// stavfelsled och fler rättningar. Träffar av det slaget hade ändå förkastats,
// och varje försök kostade en hel sökning med alla reservled (mätt
// 2026-11-20: "värmefläktra" tog 553 ms på en dator, tre försök à 150 ms).
// `lage.strangt` sätts när ett okänt ord söktes strängare än förut (se nedan).
const STRIKT = 3;

// ☠️ SAMMA SÖKNING RÄKNADES OM VID VARJE TANGENT (mätt 2026-11-20). Den som
// skriver "kontorsm", "kontorsmö", "kontorsmöb" får vid varje tangent ordet
// färdigskrivet till "kontorsmöbler" (ofardigtSammansatt), och varje försök
// var en hel sökning: 30 % av tiden för de tyngsta tangenterna. Samma sak för
// ordet som en rättning eller en omskrivning leder till, och för den som
// suddar en bokstav. Svaren sparas därför per namnlista, de senaste
// SVAR_I_MINNET. Ett svar beror bara på varorna, namnen, kategorierna,
// sökningen och djupet, och inget led ändrar ett svar på plats (de bygger nya
// listor), så minnet ger exakt det en ny räkning hade gett.
// lib/sok-2026-11-20.test.ts jämför med och utan minne.
const SVAR_I_MINNET = 48;
type Svarsminne = { items: unknown; kat: unknown; av: unknown; svar: Map<string, { u: unknown; strangt: boolean }> };

function rankaInre<T>(items: T[], nameOf: (item: T) => string, query: string, normNamn: readonly string[] | undefined, kd: Kategoridata<T> | undefined, djup: number, lage?: { strangt: boolean }): Sokutfall<T> {
  if (!normNamn) return raknaInre(items, nameOf, query, normNamn, kd, djup, lage);
  const sparat = formerFor(normNamn);
  let minne = sparat.svar;
  // Andra varor eller andra kategorier på samma namnlista: börja om.
  if (!minne || minne.items !== items || minne.kat !== kd?.kat || minne.av !== kd?.av) minne = sparat.svar = { items, kat: kd?.kat, av: kd?.av, svar: new Map() };
  const nyckel = `${djup}|${query}`;
  const sparad = minne.svar.get(nyckel);
  if (sparad) {
    if (lage && sparad.strangt) lage.strangt = true;
    return sparad.u as Sokutfall<T>;
  }
  const mitt = { strangt: false };
  const u = raknaInre(items, nameOf, query, normNamn, kd, djup, mitt);
  if (minne.svar.size >= SVAR_I_MINNET) minne.svar.delete(minne.svar.keys().next().value as string);
  minne.svar.set(nyckel, { u, strangt: mitt.strangt });
  if (lage && mitt.strangt) lage.strangt = true;
  return u;
}

function raknaInre<T>(items: T[], nameOf: (item: T) => string, query: string, normNamn: readonly string[] | undefined, kd: Kategoridata<T> | undefined, djup: number, lage?: { strangt: boolean }): Sokutfall<T> {
  const namn = normNamn ?? items.map((item) => normalize(nameOf(item)));
  const p = forberedSokning(query, namn);
  // Namnens övriga former räknas en gång per namnlista (sökrutorna skickar
  // samma lista vid varje tangent), och formen utan prickar först när första
  // varvet inte gett en hel träff.
  const sparat = formerFor(namn);
  const info = kd ? katInfoFor(kd.kat) : null;
  // Ett av kategoriernas ord, i någon böjning: aldrig felstavat.
  const arBegrepp = (u: Unit): boolean => info !== null && info.some((k) => k.lem.some((l) => delarForm(u.lem, l)));

  // ORD SOM INTE FINNS SKRIVS OM FÖRST (se "Är sökordet ett ord?" ovan). Ger
  // det omskrivna inga varor gäller sökningen som den skrevs.
  // Sant när orden prövats mot ordboken i det här varvet (se rattaStavning).
  const provade = djup === 0 && p.units.some(provas);
  if (provade) {
    const om = skrivOm(p, ordbokFor(namn, sparat), begreppFor(kd?.kat), arBegrepp);
    // ETT HALVSKRIVET SAMMANSATT ORD skrivs färdigt (se ofardigtSammansatt):
    // "kontorsmöb" visar samma varor som "kontorsmöbler".
    // ☠️ Bara när ordet inte ligger nära ett ord som står i namnen. Första
    // versionen prövade alltid (2026-11-20), och "matbrod" blev "mat" +
    // "brödrostar" i stället för "matbord", "förvaringsskö" blev "förvarings"
    // + "skönhet" i stället för "förvaringsskåp" och "gungstil" blev "gungs" +
    // "tillbehör" i stället för "gungstol". En sökning som skickas iväg är
    // oftare ett färdigt ord med ett fel än ett halvt ord utan, och en
    // gissning mitt i ordet rättar sig vid nästa tangent.
    if (p.units.length === 1 && om.finnsInte[0] && info) {
      const tok = p.units[0].tok;
      const bok = ordbokFor(namn, sparat);
      // Högst tre försök sammanlagt: vart och ett är en sökning.
      let kvar = 3;
      const prova = (led: "allmanna" | "kategori" | "katalog"): Sokutfall<T> | null => {
        for (const hel of ofardigtSammansatt(tok, led, () => (sparat.ord ??= kandaOrd(listaFor(namn, sparat))), bok, namn, info, arBegrepp)) {
          if (kvar-- <= 0) return null;
          const u = rankaInre(items, nameOf, hel, namn, kd, STRIKT);
          if (u.traffar.length > 0 && !u.rattat && !u.liknande) return { ...u, sokt: u.sokt ?? hel };
        }
        return null;
      };
      // Ett fel från ett ord spärrar allt: ett katalogord, eller ett
      // begreppsord av samma längd ("värmefläktra" är "värmefläktar"). Ett
      // begreppsord som är längre spärrar inte: "hundkop" ligger ett fel från
      // stammen i "hundkojor" men är på väg mot "hundkoppel". Två fel (i ord
      // på åtta tecken och uppåt) spärrar inte de allmänna huvudorden:
      // "kattsake" är en bokstav från "kattsaker" och två fel från "kattsäng".
      const begrepp = begreppFor(kd?.kat);
      const ettOrd = (w: string | null): boolean => w !== null && (bok.antal.has(w) || Math.abs(w.length - tok.length) <= 1);
      if (!ettOrd(narmasteOrd(tok, 1, bok, begrepp))) {
        const u = prova("allmanna") ?? (ettOrd(narmasteOrd(tok, 2, bok, begrepp)) ? null : (prova("kategori") ?? prova("katalog")));
        if (u) return u;
      }
    }
    if (om.q !== null && om.q !== p.q) {
      const u = rankaInre(items, nameOf, om.q, namn, kd, 1);
      // I en sökning på flera ord gäller omskrivningen bara när någon vara
      // har alla orden: "spåra paket" blev "spår paket", som inget namn har,
      // och visade 110 varor med T-spår.
      if (u.traffar.length > 0 && (p.units.length === 1 || u.strukna.length === 0)) return om.besked ? { ...u, rattat: u.rattat ?? om.q } : { ...u, sokt: u.sokt ?? om.q };
    }
    // ☠️ STAMMEN AV ETT OKÄNT ORD ÄR INGET ATT LETA EFTER VAR SOM HELST.
    // "gungstölning" blev stammen "gungstöl", som utan prickar står i varenda
    // gungstol: 33 gungstolar, ingen gungställning, och stavningen rättades
    // aldrig. Ett ord som inte finns söks som det står, stammen bara som ett
    // helt ord, och sedan går ordet till rättningen med fler fel.
    om.okanda.forEach((okant, i) => {
      if (!okant) return;
      const u = p.units[i];
      // Stammen ska stå som ett ord eller sist i ett (som för korta stammar,
      // se ordStar), och utan prickar gäller ordet som det skrevs.
      u.kortStam = true;
      u.vikt = vik(u.tok);
      if (lage) lage.strangt = true;
    });
  }

  const kanda: boolean[] = new Array(p.units.length).fill(false);
  type Rad = { item: T; i: number } & NameMatch;
  const varv = (lage: Lage, sokning: Prepared = p, stavfelOk?: readonly boolean[]): Rad[] => {
    const fogade = sokning.ihop ? (sparat.fogat ??= namn.map(medFogar)) : null;
    const vikta = lage >= VIKT ? (sparat.vikt ??= namn.map(vik)) : null;
    const k = sokning === p ? kanda : undefined;
    // Det som är räknat i förväg för listan (se Listdata), och sökningens masker.
    const ld: Listdata = {
      mask: (sparat.mask ??= Int32Array.from(namn, stavmask)),
      maskVikt: vikta ? (sparat.maskVikt ??= Int32Array.from(vikta, stavmask)) : null,
      fogatVikt: fogade && vikta ? (sparat.fogatVikt ??= fogade.map(vik)) : null,
      huvud: (sparat.huvud ??= new Array<string | undefined>(namn.length)),
      lista: lage >= STAVFEL ? (sparat.ordlista ??= byggOrdlista(namn)) : undefined,
    };
    const pm = sokmasker(sokning);
    // Förfiltret (se sokmasker): namn som inte kan träffa hoppas över.
    const utanPrickar = lage >= VIKT ? ld.maskVikt : null;
    const nagonVikt = utanPrickar ? pm.nagonVikt : INGA_MASKER;
    const fel = lage >= STAVFEL ? stavfelsmasker(sokning, pm, stavfelOk) : null;
    const rader: Rad[] = [];
    for (let i = 0; i < items.length; i++) {
      if (!kanTraffa(pm.nagon, nagonVikt, fel, ld.mask[i], utanPrickar ? utanPrickar[i] : 0)) continue;
      const m = matchPrepared(namn[i], sokning, lage, fogade ? fogade[i] : undefined, vikta ? vikta[i] : undefined, k, stavfelOk, ld, i, pm);
      if (m.score > 0) rader.push({ item: items[i], i, ...m });
    }
    return rader;
  };
  // Poängen först, sedan ordgränsen (kant). Sorteringen är stabil, så
  // katalogens ordning gäller mellan likvärdiga träffar.
  const ordna = (rader: Rad[]): Rad[] => rader.sort((a, b) => b.score - a.score || (b.kant ?? 0) - (a.kant ?? 0));
  const sortera = (rader: Rad[]) => ordna(rader).map((r) => r.item);
  const hela = (rader: Rad[]): Sokutfall<T> => ({ traffar: sortera(rader), strukna: [] });

  // FÄRG OCH MÅTT STÅR OFTA INTE I NAMNET. "svart tv-bänk" hade en enda hel
  // träff, en slutsåld bänk, fast butiken har 63 tv-bänkar och flera svarta:
  // färgen ligger i varans val. Är de hela träffarna färre än en skärm fylls
  // listan på med varorna som har resten av orden, efter de hela. Vilka ord
  // som då saknas i de påfyllda står i `utan`, så att sidan kan säga det.
  const karna = p.units.reduce((m, u, i) => (u.egenskap || i >= 31 ? m : m | (1 << i)), 0);
  const harEgenskap = p.units.some((u) => u.egenskap) && karna !== 0;
  const fyllPa = (rader: Rad[]): Sokutfall<T> => {
    const fulla = rader.filter((r) => r.full);
    if (!harEgenskap || fulla.length >= FYLL_PA_UNDER) return medBegrepp(fulla);
    const ovriga = rader.filter((r) => !r.full && r.mask !== undefined && (r.mask & karna) === karna);
    if (ovriga.length === 0) return hela(fulla);
    return { traffar: [...sortera(fulla), ...sortera(ovriga)], strukna: [], utan: p.units.filter((u) => u.egenskap).map((u) => u.tok), hela: fulla.length };
  };

  // ETT ENSAMT BEGREPPSORD: KATEGORIN GÅR FÖRE EN BISATS I NAMNET (2026-11-20).
  // "belysning" visade en sängram, en pizzaugn och en kylmonter "med
  // belysning" före varenda lampa, och "leksaker" 73 av butikens 485. Är
  // sökordet en kategoris ord delas träffarna i tre led:
  //   1. namnträffar som ligger i kategorin, eller där ordet är varan
  //      ("Julbelysning …", "Hallmöbel …"),
  //   2. namnträffarna utanför kategorin, där ordet bara nämns,
  //   3. kategorins övriga varor, när namnen inte bär ordet (BEGREPP_UNDER):
  //      en barnmöbel heter "Barnbord", en leksak "Dockvagn".
  // Ordningen inom varje led är den vanliga. För ett varuord som "soffa"
  // eller "spegel" bär namnen ordet, led 3 är tomt, och listan är som förut
  // så när som på att en bisats utanför kategorin går efter varorna i den.
  // Kategorins varor går sist för att ett ord i namnet väger tyngre än en
  // hylla i butiken: "småbarn" visar "Åkbil för småbarn" före resten av Baby
  // & Småbarn.
  function medBegrepp(fulla: Rad[]): Sokutfall<T> {
    const u = p.units[0];
    if (!kd || !info || p.units.length !== 1 || u.helord || u.egenskap) return hela(fulla);
    const slag = katSlagFor(p, info)?.[0];
    if (!slag) return hela(fulla);
    const m = medlemskapFor(items, kd);
    const iNamn = new Uint8Array(items.length);
    for (const r of fulla) iNamn[r.i] = 1;
    // Kategorierna ordet står för. Fyller på gör bara de där ordet är
    // kategorins eget ord, eller huvudet i en kategori med ett enda ord:
    // "Matbord & stolar" är två sorters varor, och "stolar" är bara den ena.
    const valda: { c: number; slag: number; fyller: boolean }[] = [];
    let lika = false;
    for (let c = 0; c < slag.length; c++) {
      const antal = m.medl[c].length;
      if (slag[c] < K_HUVUD || antal === 0) continue;
      let med = 0;
      for (const i of m.medl[c]) med += iNamn[i];
      if (slag[c] === K_LIKA) lika = true;
      valda.push({ c, slag: slag[c], fyller: med / antal < BEGREPP_UNDER && (slag[c] === K_LIKA ? info[c].delar <= 2 : info[c].ord.length === 1) });
    }
    // ☠️ "utemöbler" står i avdelningen Trädgård & Utemöbler OCH i dess
    // underkategori Utemöbler. Avdelningen har också växthus och grillar: när
    // en underkategori bär samma ord är det den som fyller på.
    for (const v of valda) {
      if (v.slag !== K_LIKA || !v.fyller) continue;
      if (valda.some((x) => x !== v && x.slag === K_LIKA && arUnder(kd.kat, x.c, v.c))) v.fyller = false;
    }
    if (!lika && !valda.some((v) => v.fyller)) return hela(fulla);
    // En vara utan kända kategorier (ett äldre index) räknas som i kategorin:
    // den ska inte hamna sist för att vi inte vet.
    const iKategorin = new Uint8Array(items.length);
    for (let i = 0; i < items.length; i++) if (!m.egna[i]) iKategorin[i] = 1;
    for (const v of valda) for (const i of m.medl[v.c]) iKategorin[i] = 1;
    // Ordet är varan: det står som ord, eller sist i ett ord, i namnets huvuddel.
    const arVaran = (r: Rad): boolean => r.score >= 100 && (r.kant ?? 0) >= 5;
    const ordnade = ordna(fulla);
    const forst = ordnade.filter((r) => iKategorin[r.i] === 1 || arVaran(r));
    const sist = ordnade.filter((r) => iKategorin[r.i] !== 1 && !arVaran(r));
    // Led 2: kategorins eget ord före huvudet, den smala kategorin före den breda.
    const tagna = new Uint8Array(items.length);
    const fyllda: T[] = [];
    const ettOrd = (c: number): number => (info[c].ord.length === 1 ? 0 : 1);
    for (const v of valda.filter((x) => x.fyller).sort((a, b) => b.slag - a.slag || ettOrd(a.c) - ettOrd(b.c) || m.medl[a.c].length - m.medl[b.c].length)) {
      // ☠️ "Matbord & stolar": den som söker matbord ska inte få stolarna. Ett
      // annat ord i kategorins namn som är en egen sorts vara (står i minst
      // var femte varas namn) håller sina varor utanför.
      const syskon = info[v.c].ord
        .filter((o) => !delarForm(u.lem, ordformer(o)))
        .map((o) => sokstam(o))
        .filter((st) => st.length >= 4 && m.medl[v.c].filter((i) => starIOrd(namn[i], st)).length >= m.medl[v.c].length * 0.2);
      for (const i of m.medl[v.c]) {
        if (iNamn[i] || tagna[i]) continue;
        if (syskon.some((st) => starIOrd(namn[i], st))) continue;
        tagna[i] = 1;
        fyllda.push(items[i]);
      }
    }
    if (fyllda.length === 0 && sist.length === 0) return hela(fulla);
    return { traffar: [...forst.map((r) => r.item), ...sist.map((r) => r.item), ...fyllda], strukna: [] };
  }

  // VARJE SÖKORD I NAMNET ELLER GENOM EN KATEGORI, när inget namn har alla
  // (se "Kategorierna som begrepp" ovan). `rader` är namnträffarna för samma
  // sökning. Finns ingen vara med alla sökord men väl med alla utom färgen
  // eller måttet visas de, med besked (`utan`), som i fyllPa.
  //
  // ☠️ BARA BEGREPPSORD FÅR TRÄFFA GENOM KATEGORIN i en sökning på flera ord
  // (`fritt` falskt). Första versionen lät varje ord göra det, och "skänk 120
  // cm bred" gick från fyra skänkar på 120 cm till 69 varor ur Sideboards &
  // vitrinskåp, "soffa 260 cm bred" från två soffor till 95. Ett ord som
  // namnen bär ("skänk", "soffa", "byrå") ska stå i namnet. Ett begreppsord är
  // kategorins eget ord (eller huvudet i en kategori med ett enda ord) som
  // färre än BEGREPP_UNDER av kategorins varor har i namnet: "möbler",
  // "barnmöbler", "leksaker". Ett ensamt sökord utan någon namnträff, och
  // delarna av ett delat ord, träffar fritt.
  function kategoriVarv(sokning: Prepared, rader: Rad[], fritt: boolean): Sokutfall<T> | null {
    const antalOrd = sokning.units.length;
    if (!kd || !info || antalOrd === 0 || antalOrd > 30) return null;
    const slag = katSlagFor(sokning, info);
    if (!slag) return null;
    const allaOrd = (1 << antalOrd) - 1;
    const karnan = sokning.units.reduce((mm, u, i) => (u.egenskap ? mm : mm | (1 << i)), 0);
    if (karnan === 0) return null;
    const m = medlemskapFor(items, kd);
    const C = info.length;
    const radAv: (Rad | undefined)[] = new Array(items.length);
    for (const r of rader) radAv[r.i] = r;
    if (!fritt) {
      let kvar = false;
      for (let i = 0; i < antalOrd; i++) {
        for (let c = 0; c < C; c++) {
          if (!slag[i][c]) continue;
          const antal = m.medl[c].length;
          let iNamn = 0;
          for (const v of m.medl[c]) {
            const r = radAv[v];
            if (r && (r.mask ?? allaOrd) & (1 << i)) iNamn++;
          }
          const begrepp = antal > 0 && iNamn / antal < BEGREPP_UNDER && (slag[i][c] === K_LIKA ? info[c].delar <= 2 : slag[i][c] === K_HUVUD && info[c].ord.length === 1);
          if (begrepp) kvar = true;
          else slag[i][c] = 0;
        }
      }
      if (!kvar) return null;
    }
    // Per kategori: sökorden den uppfyller och hur väl. `egen` är kategorin
    // själv, `arvd` har föräldrarnas med.
    const egen = new Int32Array(C);
    const egenKval = new Float32Array(C * antalOrd);
    for (let c = 0; c < C; c++) {
      // Den smala kategorin före den breda: "spel" visar Spel & bordsspel
      // före hela Leksaker & Spel.
      const smal = 0.05 * (1 - m.medl[c].length / Math.max(1, items.length));
      for (let i = 0; i < antalOrd; i++) {
        if (!slag[i][c]) continue;
        egen[c] |= 1 << i;
        egenKval[c * antalOrd + i] = K_KVAL[slag[i][c]] + smal;
      }
    }
    const arvd = new Int32Array(C);
    const arvdKval = new Float32Array(egenKval);
    const klar = new Uint8Array(C);
    const arv = (c: number, led: number): void => {
      if (klar[c]) return;
      klar[c] = 1;
      arvd[c] = egen[c];
      const f = kd.kat[c].f;
      if (f < 0 || f >= C || f === c || led >= 8) return;
      arv(f, led + 1);
      arvd[c] |= arvd[f];
      for (let i = 0; i < antalOrd; i++) if (arvdKval[f * antalOrd + i] > arvdKval[c * antalOrd + i]) arvdKval[c * antalOrd + i] = arvdKval[f * antalOrd + i];
    };
    for (let c = 0; c < C; c++) arv(c, 0);
    const fulla: Rad[] = [];
    const karnor: Rad[] = [];
    for (let i = 0; i < items.length; i++) {
      const ks = m.egna[i];
      if (!ks) continue;
      let viaKat = 0;
      for (const k of ks) {
        const c = k >= 0 ? k : -k - 1;
        if (c < C) viaKat |= k >= 0 ? arvd[c] : egen[c];
      }
      if (viaKat === 0) continue;
      const r = radAv[i];
      const iNamnet = r ? (r.mask ?? allaOrd) : 0;
      const tillsammans = iNamnet | viaKat;
      if ((tillsammans & karnan) !== karnan) continue;
      let summa = bitar(iNamnet);
      for (let j = 0; j < antalOrd; j++) {
        if (iNamnet & (1 << j) || !(viaKat & (1 << j))) continue;
        let bast = 0;
        for (const k of ks) {
          const c = k >= 0 ? k : -k - 1;
          if (c >= C) continue;
          const v = (k >= 0 ? arvdKval : egenKval)[c * antalOrd + j];
          if (v > bast) bast = v;
        }
        summa += bast;
      }
      const rad: Rad = { item: items[i], i, score: (summa / antalOrd) * 60, full: tillsammans === allaOrd, kant: r?.kant ?? 0 };
      (rad.full ? fulla : karnor).push(rad);
    }
    if (fulla.length > 0) return hela(fulla);
    if (karnor.length === 0 || karnan === allaOrd) return null;
    return { traffar: sortera(karnor), strukna: [], utan: sokning.units.filter((u) => u.egenskap).map((u) => u.tok), hela: 0 };
  }

  /** Varorna i kategorin vars namn sökningen är, ord för ord (minst två ord), eller null. */
  function kategoriMedNamnet(): number[] | null {
    if (!kd || !info || p.units.length < 2 || p.units.some((u) => u.helord || u.egenskap)) return null;
    // Bara kategorins ord, och högst ett "och" emellan: "matbord med stolar"
    // är en matgrupp, inte kategorin Matbord & stolar.
    if (tokenize(p.q).filter((t) => t !== "och").length !== p.units.length) return null;
    for (let c = 0; c < info.length; c++) {
      const k = info[c];
      if (k.ord.length !== p.units.length) continue;
      if (!p.units.every((u) => k.lem.some((l) => delarForm(u.lem, l)))) continue;
      if (!k.lem.every((l) => p.units.some((u) => delarForm(u.lem, l)))) continue;
      const medl = medlemskapFor(items, kd).medl[c];
      if (medl.length > 0) return medl;
    }
    return null;
  }

  // ETT ALLMÄNT HUVUDORD KRÄVS INTE (2026-11-20). "badrumsmöbler" delas i
  // "badrums" och "möbler", men badrumsskåpen ligger i Hem & Inredning och
  // inte i Möbler: fyra träffar. "hundmöbler" gav en hundbur "som möbel".
  // Huvudordet säger bara "saker till", så när delningen ger få träffar fylls
  // listan på med förledets egna varor, efter dem som har båda delarna.
  function medForledet(sokning: Prepared, utfall: Sokutfall<T>): Sokutfall<T> {
    if (utfall.traffar.length >= FYLL_PA_UNDER || sokning.units.length !== 2 || !arAllmantHuvudord(sokning.units[1].tok)) return utfall;
    const tok = sokning.units[0].tok;
    const med = new Set(utfall.traffar);
    const traffar = [...utfall.traffar];
    const fyll = (ord: string): void => {
      const forled = rankaInre(items, nameOf, ord, namn, kd, 2);
      if (forled.rattat || forled.liknande) return;
      for (const x of forled.traffar) if (!med.has(x)) { med.add(x); traffar.push(x); }
    };
    fyll(tok);
    // ☠️ "sovrumsmöbler" gav sex varor (2026-11-20): bara de har "sovrums" i
    // namnet. Ger förledet med foge-s få varor fylls listan på med förledet
    // utan: "sovrum" står i fler namn, och är en kategori.
    if (traffar.length < FYLL_PA_UNDER && tok.length > 4 && tok.endsWith("s")) fyll(tok.slice(0, -1));
    return traffar.length === utfall.traffar.length ? utfall : { ...utfall, traffar };
  }

  const forsta = varv(EXAKT);
  // HELA KATEGORINS NAMN SOM SÖKNING: "träning & gym", "pool och spa",
  // "matbord stolar". Orden står sällan i samma namn ("träning gym" gav fyra
  // varor av kategorins 268), men kunden har skrivit vad hyllan heter. Varje
  // sökord ska vara ett av kategorins ord, och varje ord i namnet ett sökord.
  // Varorna med alla orden i namnet först, sedan resten av kategorin.
  const helKategori = kategoriMedNamnet();
  if (helKategori) {
    const fulla = ordna(forsta.filter((r) => r.full));
    const med = new Set(fulla.map((r) => r.i));
    return { traffar: [...fulla.map((r) => r.item), ...helKategori.filter((i) => !med.has(i)).map((i) => items[i])], strukna: [] };
  }
  if (forsta.some((r) => r.full)) return fyllPa(forsta);

  // UTAN PRICKAR SOM RESERV, före stavfelsledet (2026-11-10). "fatolj" är två
  // fel från "fåtölj" och sex tecken långt, så stavfelsledet (ett fel för 5–6
  // tecken) hittade ingenting, och "sangbord" låg lika nära "gamingbord" som
  // "sängbord". Finns en hel träff när å, ä och ö jämförs som a och o visas
  // bara de. Varvet är billigt (en delsträngsjämförelse per ord), så den som
  // skriver "fato…" slipper dessutom stavfelsledet vid varje tangent.
  const andra = varv(VIKT);
  // ☠️ "barnsaker" GAV ETT FÖNSTERHANDTAG (2026-11-20): utan prickar står
  // ordet i "barnsäkert". Ett känt ord följt av ett allmänt huvudord är
  // rättstavat som det står och ska delas (nedan). Träffarna utan prickar
  // gäller först om delningen inte ger något.
  const sammansatt = p.units.length === 1 && provas(p.units[0]) && allmantSammansatt(p.units[0].tok, ordbokFor(namn, sparat));
  if (!sammansatt && andra.some((r) => r.full)) return fyllPa(andra);

  // KATEGORIERNA SOM RESERV, före stavfelsledet: "barnmöbler" är rättstavat
  // och står i 132 varors kategori, och ska inte bli något annat.
  const viaKategori = kategoriVarv(p, andra, p.units.length === 1);
  if (viaKategori) return viaKategori;

  // Stavfelsledet, bara för ord som inget namn har. Är alla ord kända finns
  // inget att prova, och andra varvets rader gäller.
  // ☠️ Ett känt ord följt av ett allmänt huvudord ("köksprylar") är rättstavat
  // fast inget namn har det, och ska delas, inte letas med stavfel:
  // "köksprylar" gav två kökshyllor "som liknar", och "kattprylar" ingenting.
  const stavfelOk = kanda.map((k) => !k && !sammansatt);
  // RÄTTA STAVNINGEN MOT KATALOGENS ORD, och säg det (2026-11-19). "Ellamin"
  // (en kunds sökning) gav 39 träffar med pendellampor och hyllplan i melamin:
  // stavfelsledet letar inne i namnen, och där ligger "pendELLAMPa" lika nära
  // som "elkamin". Ligger sökordet ett fel från ett ord som står för sig i
  // katalogen söks det ordet i stället, och utfallet säger vilket (`rattat`).
  const delningarna = delningar(p, () => (sparat.ord ??= kandaOrd(listaFor(namn, sparat))), arBegrepp);
  if (stavfelOk.some(Boolean) && djup < 2) {
    const bok = ordbokFor(namn, sparat);
    const begrepp = begreppFor(kd?.kat);
    let rattad = rattaStavning(p, stavfelOk, bok, begrepp, provade);
    // Ett ord som går att dela i två vanliga ord rättas bara när ETT fel
    // räcker (se starkDelning).
    if (rattad && p.units.length === 1 && starkDelning(delningarna, bok, arBegrepp) && narmasteOrd(p.units[0].tok, 1, bok, begrepp) !== rattad) rattad = null;
    if (rattad && rattad !== p.q) {
      const u = rankaInre(items, nameOf, rattad, namn, kd, djup + 1);
      // I en sökning på flera ord gäller rättningen bara när någon vara har
      // alla orden. Annars stryks ord ur sökningen som den skrevs (nedan), och
      // beskedet nämner kundens ord, inte ett rättat ("ihopfällbar stegpall").
      if (u.traffar.length > 0 && (p.units.length === 1 || u.strukna.length === 0)) return { ...u, rattat: u.rattat ?? rattad };
    }
  }
  const scored = stavfelOk.some(Boolean) && djup < STRIKT ? varv(STAVFEL, p, stavfelOk) : andra;
  const medAlla = sammansatt ? [] : scored.filter((r) => r.full);
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
  const delade = delningarna.map((delad) => forberedSokning(delad, namn));
  for (const sokning of delade) {
    for (const lage of [EXAKT, VIKT] as const) {
      // ☠️ Ett allmänt huvudord letas inte utan prickar: "barn" och "saker"
      // står båda i "barnsäkert", och fönsterhandtaget hamnade först.
      if (lage === VIKT && sokning.units.length === 2 && arAllmantHuvudord(sokning.units[1].tok)) continue;
      const rader = varv(lage, sokning);
      if (!rader.some((r) => r.full)) continue;
      const iNamnen = hela(rader.filter((r) => r.full));
      // Få träffar i namnen: delarna får också träffa genom kategorierna.
      // "trädgårdsbelysning" stod i två namn, och kategorin Trädgårdsdekor &
      // Belysning har 98 varor.
      if (iNamnen.traffar.length >= FYLL_PA_UNDER) return iNamnen;
      const viaKat = kategoriVarv(sokning, varv(VIKT, sokning), true);
      if (!viaKat || viaKat.utan) return medForledet(sokning, iNamnen);
      const med = new Set(iNamnen.traffar);
      return medForledet(sokning, { traffar: [...iNamnen.traffar, ...viaKat.traffar.filter((x) => !med.has(x))], strukna: [] });
    }
  }
  // Delarna genom kategorierna: "kontorsmöbler" är möblerna med kontor i
  // namnet. Efter delningarna som träffar i namnen, så att "barnbil"
  // fortfarande är elbilarna för barn.
  if (kd) {
    for (const sokning of delade) {
      const u = kategoriVarv(sokning, varv(VIKT, sokning), true);
      if (u && !u.utan) return medForledet(sokning, u);
    }
  }
  // ☠️ "kattprylar" GAV INGENTING (2026-11-20), fast "hundsaker" visade 313
  // varor: inget namn har "katt" och "prylar", och "prylar" är ingen kategori,
  // så delningen föll bort. Ett allmänt huvudord säger bara "saker till":
  // förledets egna varor är svaret också när ingenting har båda delarna.
  for (const sokning of delade) {
    const u = medForledet(sokning, { traffar: [], strukna: [] });
    if (u.traffar.length > 0) return u;
  }
  if (sammansatt && andra.some((r) => r.full)) return fyllPa(andra);
  // ETT SAMMANSATT ORD MED ETT STAVFEL I ENA DELEN (2026-11-20).
  // "trägårdsbelysning" är inget ord i katalogen och ligger inte ett fel från
  // något, men "trägårds" är "trädgård" och "belysning" finns. Den ena delen
  // ska vara ett känt ord som det står, den andra ligga ett fel från ett.
  if (djup < 2) {
    for (const { delad, hel } of luddigaDelningar(p, () => (sparat.ord ??= kandaOrd(listaFor(namn, sparat))), ordbokFor(namn, sparat), begreppFor(kd?.kat), arBegrepp)) {
      // Det rättade ordet i ett stycke först: då blir svaret detsamma som för
      // den som stavade rätt.
      // ☠️ "trägårdsbelysning" gav två lampor och "trädgårdsbelysning" 110
      // (2026-11-20): den rättade delningen fylldes aldrig på ur kategorierna.
      const somOrd = rankaInre(items, nameOf, hel, namn, kd, STRIKT);
      if (somOrd.traffar.length > 0 && !somOrd.rattat && !somOrd.liknande) return { ...somOrd, rattat: hel };
      const sokning = forberedSokning(delad, namn);
      // Namnen först, sedan kategorierna: samma två led som för en vanlig
      // delning, utan stavfelsled och strykning (delarna är redan rättade).
      const rader = varv(VIKT, sokning);
      if (rader.some((r) => r.full)) return { ...medForledet(sokning, hela(rader.filter((r) => r.full))), rattat: delad };
      const u = kategoriVarv(sokning, rader, true);
      if (u && !u.utan) return { ...medForledet(sokning, u), rattat: delad };
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
 * när något av dem inte har ett trovärdigt sådant. Trovärdigt avgörs av
 * narmasteOrd: ett fel, två när både sökordet och katalogordet är minst åtta
 * tecken och tre när båda är minst tolv ("upresningsfatoj"), och bland lika
 * nära det ord som står i flest namn. Korta ord, tal, färger och mått rättas
 * inte: där är ett fel lika ofta ett annat ord.
 */
function rattaStavning(p: Prepared, okanda: readonly boolean[], bok: Ordbok, begrepp: readonly string[], provat: boolean): string | null {
  const byten = new Map<string, string>();
  for (let i = 0; i < p.units.length; i++) {
    if (!okanda[i]) continue;
    const u = p.units[i];
    if (u.helord || u.egenskap || u.tok.length < 5 || !/^[a-zåäö]+$/.test(u.tok) || allmantSammansatt(u.tok, bok)) return null;
    // Tre fel i ord på tolv tecken och uppåt, två från åtta (narmasteOrd).
    // Ett kortare ord som prövningen mot ordboken redan lämnat utan rättning
    // har ingen här heller: samma regler, samma svar.
    if (provat && u.tok.length < 8) return null;
    const bast = narmasteOrd(u.tok, 3, bok, begrepp);
    if (!bast) return null;
    byten.set(u.tok, bast);
  }
  if (byten.size === 0) return null;
  return p.q.replace(/[a-zåäö0-9]+/g, (t) => byten.get(t) ?? t);
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

/** I hur många namn varje ord står för sig. Orden i den ordning de först står i namnen. */
function ordAntal(lista: Ordlista): Map<string, number> {
  const n = new Int32Array(lista.ord.length);
  // Namnet där ordet senast räknades: ett ord som står två gånger i ett namn räknas en gång.
  const sist = new Int32Array(lista.ord.length).fill(-1);
  for (let i = 0; i + 1 < lista.start.length; i++) {
    for (let k = lista.start[i], slut = lista.start[i + 1]; k < slut; k++) {
      const w = lista.ids[k];
      if (sist[w] !== i) { sist[w] = i; n[w]++; }
    }
  }
  const antal = new Map<string, number>();
  for (let w = 0; w < lista.ord.length; w++) antal.set(lista.ord[w], n[w]);
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
  const omljud = omljudsformer(tok);
  return omljud.length > 0 ? [...regelbundnaFormer(tok), ...omljud] : regelbundnaFormer(tok);
}

// Flertal med omljud: "tänger" hittade ingen tång och "skivstänger" ingen
// skivstång (2026-11-20), för inget av dem är det andra med en ändelse. Ordet
// byts i slutet, så sammansättningarna följer med ("klädstänger" → "klädstång").
// ☠️ Bara de två: provat med fler 2026-11-20 gav "böcker" 97 fåtöljer "med
// ben i bok" (träslaget), "fötter" dörrbeslag på "8 fot" (måttet) och
// "händer" 323 varor med handtag och handvev.
const OMLJUD: readonly (readonly [string, string])[] = [
  ["stång", "stänger"], ["tång", "tänger"],
];
function omljudsformer(tok: string): string[] {
  for (const [ental, flertal] of OMLJUD) {
    if (tok.endsWith(flertal)) return [tok.slice(0, -flertal.length) + ental];
    if (tok.endsWith(`${flertal}na`)) return [tok.slice(0, -flertal.length - 2) + ental];
    // Entalet ska vara hela ordet eller följa på ett helt led: "stång" i
    // "skivstång".
    if (tok.endsWith(ental) && (tok.length === ental.length || tok.length >= ental.length + 3)) return [tok.slice(0, -ental.length) + flertal];
  }
  return [];
}

function regelbundnaFormer(tok: string): string[] {
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

function kandaOrd(lista: Ordlista): Set<string> {
  const ord = new Set<string>();
  for (const t of lista.ord) {
    if (t.length < KORTASTE_DEL) continue;
    const s = stem(t);
    ord.add(t).add(s).add(vik(t)).add(vik(s));
  }
  return ord;
}

// Sökordet delat i två ord, som sökningar att prova i tur och ordning. Bara
// ett ensamt sökord delas, och bara där båda delarna är kända ord och inget av
// dem är ett småord ("till" i "tillbehör"). Den jämnaste delningen först: ju
// längre den kortaste delen är, desto mindre slump i träffen.
/** Är delen ett känt ord: står det för sig i något namn (också stammat och utan prickar)? */
function arKandDel(x: string, k: ReadonlySet<string>): boolean {
  const s = stem(x);
  return !STOPWORDS.has(x) && (k.has(x) || k.has(s) || k.has(vik(x)) || k.has(vik(s)));
}

function delningar(p: Prepared, kanda: () => Set<string>, arBegrepp?: (u: Unit) => boolean): string[] {
  const ord = tokenize(p.q);
  if (ord.length !== 1 || ord[0].length < 2 * KORTASTE_DEL) return [];
  const t = ord[0];
  // En del får också vara ett av kategoriernas ord: "möbler" står för sig i
  // få namn men är en hel avdelning.
  const ar = (x: string, k: Set<string>) =>
    arKandDel(x, k) || (x.length >= 3 && arAllmantHuvudord(x)) || (x.length >= 4 && arBegrepp !== undefined && arBegrepp(delSomOrd(x)));
  const k = kanda();
  const ut: { a: string; b: string }[] = [];
  for (let i = KORTASTE_DEL; i <= t.length - KORTASTE_DEL; i++) {
    const a = t.slice(0, i);
    const b = t.slice(i);
    if (!ar(b, k)) continue;
    // ☠️ Första delen får bära ett foge-s: "köks" står inte för sig i något
    // namn, och "köksprylar" gick inte att dela (2026-11-20). Delningen prövas
    // med s:et ("köks" står i köksvagn och köksö), och sedan utan: inget namn
    // har "kontors" och "belysning", men 24 lampor är till för "kontor".
    const foge = medFogeS(a, (x) => ar(x, k));
    if (ar(a, k) || foge) ut.push({ a, b });
    if (foge) ut.push({ a: a.slice(0, -1), b });
  }
  const kortast = (d: { a: string; b: string }) => Math.min(d.a.length, d.b.length);
  return [...new Set(ut.sort((x, y) => kortast(y) - kortast(x)).map((d) => `${d.a} ${d.b}`))];
}

/**
 * Går sökordet att dela i två ord som båda är vanliga i katalogen? Då är det
 * ett sammansatt ord, inte ett ord med flera stavfel. Vanligt: minst fyra
 * bokstäver, och ordet inleder ord i minst fem namn ("hall" i hallmöbel och
 * hallbänk) eller är ett begreppsord.
 *
 * ☠️ "hundförvaring" BLEV "vedförvaring" (2026-11-20): tre fel räcker för ord
 * på tolv tecken, och rättningen gick före delningen. "hund" står i 313 namn
 * och "förvaring" i 300.
 * ☠️ Inte ord på tre bokstäver: provat samma dag, och "julförvaring" blev
 * sex förvaringsSKJUL.
 */
function starkDelning(delade: readonly string[], bok: Ordbok, arBegrepp: (u: Unit) => boolean): boolean {
  const inleder = (x: string): number => {
    let n = 0;
    for (let i = forstaPlats(bok.ord, x); i < bok.ord.length && bok.ord[i].startsWith(x); i++) n += bok.antal.get(bok.ord[i]) ?? 0;
    return n;
  };
  const stark = (x: string): boolean => x.length >= 4 && (arAllmantHuvudord(x) || arBegrepp(delSomOrd(x)) || inleder(x) >= 5);
  return delade.some((d) => {
    const [a, b] = d.split(" ");
    return stark(a) && stark(b);
  });
}

/** Är delen ett känt ord följt av ett foge-s ("köks", "badrums")? */
function medFogeS(a: string, kand: (x: string) => boolean): boolean {
  return a.length > KORTASTE_DEL && a.endsWith("s") && kand(a.slice(0, -1));
}

/** En del av ett delat sökord som ett sökord, för jämförelsen med kategoriernas ord. */
function delSomOrd(x: string): Unit {
  return { stem: sokstam(x), key: begreppsnyckel(x), vikt: vik(x), tok: x, helord: false, egenskap: false, fogRe: null, lem: ordformer(x) };
}

/**
 * Ett ensamt sökord delat i två, där den ena delen är ett känt ord som det
 * står och den andra ligger ETT fel från ett ord i katalogen ("trägårds" +
 * "belysning"). Ett foge-s efter första delen hör inte till ordet. Bara ord
 * på åtta tecken och uppåt, och den rättade delen minst fem: kortare delar
 * ligger ett fel från nästan vad som helst. Den jämnaste delningen först.
 */
function luddigaDelningar(p: Prepared, kanda: () => Set<string>, bok: Ordbok, begrepp: readonly string[], arBegrepp: (u: Unit) => boolean): { delad: string; hel: string }[] {
  const ord = tokenize(p.q);
  if (ord.length !== 1 || ord[0].length < 8 || !/^[a-zåäö]+$/.test(ord[0])) return [];
  const t = ord[0];
  const k = kanda();
  const kand = (x: string) => x.length >= 3 && (arKandDel(x, k) || (x.length >= 4 && arBegrepp(delSomOrd(x))));
  const rattad = new Map<string, string | null>();
  const ratta = (x: string): string | null => {
    if (x.length < 5) return null;
    let r = rattad.get(x);
    if (r === undefined) {
      r = narmasteOrd(x, 1, bok, begrepp);
      rattad.set(x, r);
    }
    return r;
  };
  const ut: { a: string; b: string; s: string; kortast: number }[] = [];
  for (let i = KORTASTE_DEL; i <= t.length - KORTASTE_DEL; i++) {
    const b = t.slice(i);
    // Första delen som den står, och utan ett foge-s.
    for (const a of t[i - 1] === "s" && i - 1 >= KORTASTE_DEL ? [t.slice(0, i), t.slice(0, i - 1)] : [t.slice(0, i)]) {
      const aKand = kand(a);
      const bKand = kand(b);
      if (aKand && bKand) continue; // en vanlig delning, redan prövad
      const a2 = aKand ? a : bKand ? ratta(a) : null;
      const b2 = bKand ? b : aKand ? ratta(b) : null;
      if (a2 && b2) ut.push({ a: a2, b: b2, s: a.length < i ? "s" : "", kortast: Math.min(a.length, b.length) });
    }
  }
  // `hel` är ordet i ett stycke med delen rättad ("trädgårdsbelysning"), med
  // foge-s:et tillbaka där det stod.
  const sedda = new Set<string>();
  return ut
    .sort((x, y) => y.kortast - x.kortast)
    .map((d) => ({ delad: `${d.a} ${d.b}`, hel: `${d.a}${d.s}${d.b}` }))
    .filter((d) => (sedda.has(d.delad) ? false : (sedda.add(d.delad), true)))
    .slice(0, 4);
}

/** De allmänna huvudorden (ALLMANNA_HUVUDORD) som en halvskriven sammansättning skrivs färdig till. */
const ALLMANNA_HELA = ["möbler", "saker", "prylar", "tillbehör", "grejer", "produkter", "utrustning"];

/**
 * Ett halvskrivet sammansatt ord, färdigskrivet: första delen är ett känt ord
 * och resten (minst två bokstäver) är början på ett huvudord. Högst tre
 * förslag, den längsta första delen först. Tre led (se rankaInre för när de
 * prövas):
 *
 *   allmanna   "kontorsmöb" är på väg mot "kontorsmöbler", "kattpr" mot
 *              "kattprylar". De allmänna huvudorden säger bara "saker till",
 *              och två bokstäver av dem räcker.
 *   kategori   kategoriernas ord, från tre bokstäver: "trädgårdsbel" →
 *              "trädgårdsbelysning", "hundkop" → "hundkoppel".
 *   katalog    ord som står i samma namn som första delen: "barnbi" →
 *              "barnbil" (elbilar och åkbilar för barn). Första delen ska
 *              vara minst fyra bokstäver, och minst tre namn ha båda.
 *
 * ☠️ Utan den var listan TOM mitt i ordet (2026-11-20): "kontorsmö" visade
 * 124 kontorsstolar, "kontorsmöb" ingenting, "kontorsmöbl" 225 varor, och
 * "kontorsmöble" blev "kontorsstolar" med besked (tre fel från en böjning).
 * "barnbi" blev "barnbord" med besked, ett tangenttryck före 86 elbilar för
 * barn. Det hela ordet står inte i något namn, så ingen början på det gör
 * det heller. Bara för ord som varken finns eller är början på ett ord i
 * katalogen.
 */
function ofardigtSammansatt(
  t: string,
  led: "allmanna" | "kategori" | "katalog",
  kanda: () => Set<string>,
  bok: Ordbok,
  namn: readonly string[],
  info: readonly KatInfo[],
  arBegrepp: (u: Unit) => boolean,
): string[] {
  if (t.length < 2 * KORTASTE_DEL - 1 || !/^[a-zåäö]+$/.test(t)) return [];
  const k = kanda();
  const kand = (x: string) => x.length >= KORTASTE_DEL && (arKandDel(x, k) || (x.length >= 4 && arBegrepp(delSomOrd(x))));
  const borjarPa = (b: string, h: string): boolean => h.length > b.length && saknarBaraPrickar(b, h.slice(0, b.length));
  const ut: string[] = [];
  const lagg = (hel: string) => { if (ut.length < 3 && !ut.includes(hel)) ut.push(hel); };
  for (let i = t.length - 2; i >= KORTASTE_DEL && ut.length < 3; i--) {
    const a = t.slice(0, i);
    const b = t.slice(i);
    const foge = !kand(a) && medFogeS(a, kand);
    if (!foge && !kand(a)) continue;
    // Står resten som ett ord för sig i något namn är det en vanlig delning:
    // "barnbil" är "barn" och "bil", inte början på "barnbiltillbehör". En
    // stam får det vara: "belys" är på väg mot "belysning".
    const arOrd = b.length >= KORTASTE_DEL && bok.antal.has(b);
    if (led === "allmanna") {
      for (const h of ALLMANNA_HELA) if (borjarPa(b, h)) lagg(a + h);
      continue;
    }
    if (arOrd) continue;
    if (led === "kategori") {
      // ☠️ Från tre bokstäver: med två blev "kontorsm" till "kontor" + "småbord".
      if (b.length >= 3) for (const c of info) for (const o of c.ord) if (o.length >= 5 && !ALLMANNA_HELA.includes(o) && borjarPa(b, o)) lagg(a + o);
      continue;
    }
    if (a.length < 4) continue;
    // Orden som står i samma namn som första delen, för sig eller sist i ett
    // sammansatt ord ("bil" i "elbil"), det vanligaste först.
    const forled = foge ? a.slice(0, -1) : a;
    const bVikt = vik(b);
    const antal = new Map<string, number>();
    for (const n of namn) {
      const plats = n.indexOf(forled);
      if (plats < 0 || (plats > 0 && BOKSTAV.test(n[plats - 1]))) continue;
      const sedda = new Set<string>();
      for (const o of tokenize(n)) {
        if (!/^[a-zåäö]+$/.test(o)) continue;
        const oVikt = vik(o);
        for (let j = oVikt.indexOf(bVikt); j >= 0; j = oVikt.indexOf(bVikt, j + 1)) {
          const h = o.slice(j);
          if (sedda.has(h) || !borjarPa(b, h) || !bok.antal.has(h) || STOPWORDS.has(h) || arEgenskap(h)) continue;
          sedda.add(h);
          antal.set(h, (antal.get(h) ?? 0) + 1);
        }
      }
    }
    for (const [o, n] of [...antal].sort((x, y) => y[1] - x[1]).slice(0, 2)) if (n >= 3) lagg(a + o);
  }
  return ut;
}

// Namnlistans övriga former, sparade per lista: sökrutorna skickar samma
// normaliserade lista vid varje tangent (rankaForslag i lib/sok-index.ts).
type ListFormer = {
  fogat?: string[]; vikt?: string[]; ord?: Set<string>; antal?: Map<string, number>; egna?: Set<string>; led?: Set<string>; slut?: string[]; bok?: Ordbok;
  // Räknat i förväg för varven (se Listdata): namnens ord, teckenmasker, fogade namn utan prickar och huvuddelar.
  ordlista?: Ordlista; mask?: Int32Array; maskVikt?: Int32Array; fogatVikt?: string[]; huvud?: (string | undefined)[];
  // De senaste svaren för den här namnlistan (se rankaInre).
  svar?: Svarsminne;
};
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

/**
 * Kategorinamnet tolkat för jämförelsen, räknat en gång per namn. Sökrutan
 * frågar efter kategorier vid varje tangent, och förr tolkades både varje
 * kategorinamn och sökningen om för var och en av de 170 kategorierna: en
 * sjundedel av tiden per tangent (mätt 2026-11-20).
 */
type Kategoriform = { namn: string; raa: string[]; ord: string[]; vikta: string[]; former: string[][] };
const kategoriformer = new Map<string, Kategoriform>();
function kategoriformFor(kategoriNamn: string): Kategoriform {
  let f = kategoriformer.get(kategoriNamn);
  if (!f) {
    // Mjuka bindestreck (U+00AD) står i långa kategorinamn för radbrytningen.
    const namn = normalize(kategoriNamn.replace(/\u00ad/g, ""));
    // Orden som de står, och med bindestrecken borta: "TV-bänkar" är både
    // "tv" + "bänkar" och "tvbänkar".
    const raa = [...new Set([...tokenize(namn), ...tokenize(utanBindestreck(namn))])];
    // Kategorins ord utan prickar och i sina böjningar: den som skriver
    // "barnmobel" eller "fatoljer" ska få samma kategori som med prickarna
    // (Leonards skärmbild 2026-11-20: ingen kategori för "barnmobel").
    f = { namn, raa, ord: raa.map(canon), vikta: raa.map(vik), former: raa.map(ordformer) };
    if (kategoriformer.size >= 2000) kategoriformer.clear();
    kategoriformer.set(kategoriNamn, f);
  }
  return f;
}

/** Sökningens ord för kategorijämförelsen, som de står och utan prickar. */
type Kategorifraga = { units: Unit[]; vikta: Unit[] };
function kategorifraga(query: string): Kategorifraga {
  // Färg, storlek och mått säger inget om kategorin: "svart tv-bänk" är TV-bänkar.
  const units = prepare(query).units.filter((u) => !u.egenskap);
  return { units, vikta: units.map(utanPrickar) };
}

/** Poäng för hur väl ett kategorinamn matchar sökningen. 0 = inte alls. */
export function kategoriPoang(kategoriNamn: string, query: string): number {
  return poangFor(kategoriformFor(kategoriNamn), kategorifraga(query));
}

function poangFor({ namn, raa, ord, vikta, former }: Kategoriform, fraga: Kategorifraga): number {
  const units = fraga.units;
  if (units.length === 0 || ord.length === 0) return 0;
  let summa = 0;
  for (let n = 0; n < units.length; n++) {
    const u = units[n];
    let bast = 0;
    const uVikt = fraga.vikta[n];
    for (let i = 0; i < ord.length; i++) {
      const o = ord[i];
      if (o === u.key || (!u.helord && delarForm(u.lem, former[i]))) bast = Math.max(bast, 3);
      // Huvudet i en sammansättning: "fåtölj" i "uppresningsfåtöljer".
      // ☠️ Som ett ORD sist i kategorins ord (ordStar), inte som bokstäver i
      // slutet (2026-11-19): "bar" gav "Baby & Småbarn", "tyg" gav Verktyg och
      // "ring" Badrumsrenovering och Förvaring. Samma spärrar som för
      // varunamnen gäller (BARARE), och "hus" hittar nu Växthus.
      else if (!u.helord && u.key.length >= 3 && (huvudI(raa[i], u) || (uVikt !== u && huvudI(vikta[i], uVikt)))) bast = Math.max(bast, 2);
      // Förledet: "kontor" i "kontorsstolar" och "hund" i "hundburar", och
      // sökordet som börjar med kategorins ord: "trädgårdsmöbler" och
      // "Trädgård". Förledet jämförs som kunden skrev det, inte i kanonisk
      // form: "soffa" blir kanoniskt "soff", som också inleder "soffbord".
      else if (!u.helord && u.tok.length >= 4 && (o.startsWith(u.tok) || (uVikt !== u && vikta[i].startsWith(uVikt.tok)) || (o.length >= 5 && u.key.startsWith(o)))) bast = Math.max(bast, 1);
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
  const fraga = kategorifraga(query);
  return kategorier
    .map((k, i) => ({ k, i, poang: poangFor(kategoriformFor(k.name), fraga) }))
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
export function rankaMedForslag<T>(items: T[], nameOf: (item: T) => string, query: string, kd?: Kategoridata<T>): { utfall: Sokutfall<T>; visar: string } {
  const utfall = rankaMedInfo(items, nameOf, query, undefined, kd);
  // En rättad stavning visas på samma sätt som ordet för två bokstäver:
  // sidan säger vilket ord träffarna gäller.
  if (!kortOrd(query)) return { utfall, visar: utfall.rattat ?? "" };
  const mal = visaVarorFor(query, menadeDu(items, nameOf, query), utfall.traffar.length);
  if (!mal) return { utfall, visar: "" };
  const forMalet = rankaMedInfo(items, nameOf, mal, undefined, kd);
  return forMalet.traffar.length > 0 ? { utfall: forMalet, visar: mal } : { utfall, visar: "" };
}

/**
 * Bygger i förväg det sökningen annars bygger vid första tangenten: katalogens
 * ordbok (ordbokFor), orden som står för sig, och varornas kategorier. Mätt
 * 2026-11-20 på 7 886 varor: runt 200 ms på en dator, flera gånger det på en
 * telefon. Sökrutan anropar den när webbläsaren är ledig (lib/sok-rankning.ts,
 * varmUpp). Hinner den inte byggs allt vid första sökningen, som förut.
 *
 * `normNamn` är namnen normaliserade (normalize), samma lista som sökningarna
 * sedan skickar in: det är den som det sparade hänger på.
 */
export function forberedKatalog<T>(items: T[], normNamn: readonly string[], kd?: Kategoridata<T>): void {
  for (const steg of forberedKatalogSteg(items, normNamn, kd)) steg();
}

/**
 * Samma arbete som forberedKatalog, i steg som kan göras ett i taget.
 *
 * ☠️ I ETT STYCKE LÅSTE DEN SKÄRMEN (mätt 2026-11-20 med fyrdubbelt strypt
 * processor): uppvärmningen var en enda uppgift på upp till 390 ms, och en
 * tangent som trycktes under tiden fick vänta på den. Sökrutan gör nu ett
 * steg per ledig stund (lib/sok-rankning.ts, varmUpp), så att en tangent
 * hinner emellan. Det som inte hunnit byggas byggs vid första sökningen.
 */
export function forberedKatalogSteg<T>(items: T[], normNamn: readonly string[], kd?: Kategoridata<T>): (() => void)[] {
  const sparat = formerFor(normNamn);
  return [
    // Namnens ord och katalogens ordbok (rättningen).
    () => { ordbokFor(normNamn, sparat); },
    // Orden som står för sig, sista leden och de kända delarna (böjningar och delade ord).
    () => {
      const lista = listaFor(normNamn, sparat);
      const egna = (sparat.egna ??= egnaOrd(lista));
      sparat.led ??= sistaLed(egna);
      sparat.ord ??= kandaOrd(lista);
    },
    // Namnen utan prickar och med fogar, och teckenmaskerna (varven).
    () => {
      const vikta = (sparat.vikt ??= normNamn.map(vik));
      const fogade = (sparat.fogat ??= normNamn.map(medFogar));
      sparat.fogatVikt ??= fogade.map(vik);
      sparat.mask ??= Int32Array.from(normNamn, stavmask);
      sparat.maskVikt ??= Int32Array.from(vikta, stavmask);
    },
    // Kategorierna och varornas medlemskap (begreppsorden).
    () => {
      if (!kd) return;
      katInfoFor(kd.kat);
      medlemskapFor(items, kd);
      begreppsformer(begreppFor(kd.kat));
    },
  ];
}
