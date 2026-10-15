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
];

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

// Synonym-needles för en originalterm (exporterad för test/insyn).
export function expandSynonyms(term: string): string[] {
  return SYN.get(canon(term)) || [];
}

// ── Stavfelstolerans ─────────────────────────────────────────────────────────
// Ungefärlig DELSTRÄNGSmatchning med Damerau-Levenshtein (infogning, borttagning,
// utbyte OCH transposition av två intilliggande tecken — den i särklass vanligaste
// stavfelstypen, t.ex. "sdael"→"sadel"). Rad 0 = nollor ⇒ fri startposition, så
// mönstret får matcha VAR som helst i texten; svaret är minsta redigeringsavstånd
// för hela mönstret som slutar någonstans i texten. Returnerar true om ≤ maxDist.
// O(|pattern|·|text|); körs bara när exakt/synonym redan missat en token.
export function fuzzyContains(pattern: string, text: string, maxDist: number): boolean {
  const m = pattern.length;
  const n = text.length;
  if (m === 0) return true;
  if (m > n + maxDist) return false; // kan omöjligt rymmas
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
  return best <= maxDist;
}

// Hur bra en enskild sökterm matchar ett namn: 1 = exakt delsträng, 0.85 = via
// synonym, 0.6 = via stavfelstolerans, 0 = ingen träff. Stavfel gäller bara
// tokens ≥5 tecken (kortare ord blir för tvetydigt — en enda redigering i ett
// 4-teckensord matchar nästan vad som helst) och körs sist (billigast först).
// maxDist skalar med längden: 1 för 5–6 tecken, 2 för ≥7. Med fuzzy=false
// hoppas stavfelsledet över (första varvet i rankByName).
type Unit = { stem: string; key: string };

function tokenQuality(unit: Unit, nameNorm: string, fuzzy: boolean): number {
  const { stem: s, key } = unit;
  if (nameNorm.includes(s)) return 1;
  const needles = SYN.get(key);
  if (needles) {
    for (const nd of needles) if (nameNorm.includes(nd)) return 0.85;
  }
  if (fuzzy && s.length >= 5 && fuzzyContains(s, nameNorm, s.length >= 7 ? 2 : 1)) return 0.6;
  return 0;
}

// Småord som inte säger vad varan är. De krävs inte i namnet när sökningen har
// andra ord: "fåtölj med uppresning" ska hitta "Uppresningsfåtölj i grå frotté",
// som saknar "med" (1 400 av 4 184 namn gör det). "utan" är INTE med, för
// "fåtölj utan massage" får inte bli "fåtölj massage". Hela frasen jämförs
// fortfarande med småorden kvar, så en exakt fras ger 100 som förut.
const STOPWORDS = new Set(["med", "och", "för", "till", "på", "av", "en", "ett", "som", "från"]);

type Prepared = { q: string; units: Unit[] };

// Sökordet tolkas EN gång per sökning. nameMatch gjorde det förr per vara, alltså
// 4 184 gånger per tangent.
function prepare(query: string): Prepared {
  const q = normalize(query);
  const alla = tokenize(q)
    .map((t) => ({ tok: t, stem: stem(t), key: canon(t) }))
    .filter((u) => u.stem.length >= 2);
  const innehall = alla.filter((u) => !STOPWORDS.has(u.tok));
  const units = (innehall.length > 0 ? innehall : alla).map(({ stem: s, key }) => ({ stem: s, key }));
  return { q, units };
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
  /** Sämsta ordgränsen bland de exakta träffarna (se kant). Bara för ordningen. */
  kant?: number;
};

// Hur väl matchar `query` ett produktNAMN?
//   100 — hela söksträngen finns i namnets huvuddel ("vinöppnare")
//    90 — hela söksträngen finns, men bara efter huvuddelen ("…med hängmatta")
//    60 — alla söktermer matchar exakt (compound-aware: "knivset"→"kniv" i
//         "knivhållare", "halsband" i "kedjehalsband")
//   ~51 — alla söktermer matchar men minst en via synonym ("mtb"→cykel)
//   ~36 — alla söktermer matchar men minst en via stavfelstolerans ("cyckel"→cykel)
//   1–59 — bara några termer matchade (delvis), proportionellt & kvalitetsviktat
export function nameMatch(name: string, query: string): NameMatch {
  return matchPrepared(normalize(name), prepare(query), true);
}

function matchPrepared(nameNorm: string, p: Prepared, fuzzy: boolean): NameMatch {
  const none = { score: 0, full: false };
  const { q, units } = p;
  if (!q || !nameNorm) return none;
  if (nameNorm.includes(q)) {
    return { score: mainPart(nameNorm).includes(q) ? 100 : 90, full: true, kant: kant(nameNorm, q) };
  }
  if (units.length === 0) return none;
  let sum = 0;
  let hit = 0;
  let stavfel = false;
  let kanter = 2;
  for (const u of units) {
    const qual = tokenQuality(u, nameNorm, fuzzy);
    sum += qual;
    if (qual > 0) hit++;
    if (qual > 0 && qual < 0.85) stavfel = true;
    if (qual === 1) kanter = Math.min(kanter, kant(nameNorm, u.stem));
  }
  if (sum === 0) return none;
  // Perfekt täckning (alla exakta) → 60, samma tak som förr. Synonym-/stavfel-
  // tokens bidrar <1 så de landar strax under en likvärdig exakt träff.
  return { score: Math.max(1, Math.round((sum / units.length) * 60)), full: hit === units.length, stavfel, kant: kanter };
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
export function rankByName<T>(items: T[], nameOf: (item: T) => string, query: string): T[] {
  const p = prepare(query);
  const namn = items.map((item) => normalize(nameOf(item)));
  const varv = (fuzzy: boolean) =>
    items
      .map((item, i) => ({ item, ...matchPrepared(namn[i], p, fuzzy) }))
      .filter((r) => r.score > 0);
  // Poängen först, sedan ordgränsen (kant). Sorteringen är stabil, så
  // katalogens ordning gäller mellan likvärdiga träffar.
  const sortera = (rader: ReturnType<typeof varv>) =>
    rader.sort((a, b) => b.score - a.score || (b.kant ?? 0) - (a.kant ?? 0)).map((r) => r.item);

  const forsta = varv(false);
  if (forsta.some((r) => r.full)) return sortera(forsta.filter((r) => r.full));

  const scored = varv(true);
  const hela = scored.some((r) => r.full) ? scored.filter((r) => r.full) : scored;
  const kept = hela.some((r) => !r.stavfel) ? hela.filter((r) => !r.stavfel) : hela;
  return sortera(kept);
}
