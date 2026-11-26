"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { KORTASTE_SOKNING, laddaSokIndex, sokIndexHamtat, type SokTraff as Hit } from "../lib/sok-index";
import { registreradeKategorier, rentNamn, type SokKategori } from "../lib/sok-kategorier";
import { harPris, inomPris, prisTal, prisText, tolkaPris } from "../lib/sok-pris";
import { glomSokningar, kommIhagSokning, senasteSokningar } from "../lib/sok-senaste";
import { tightFillUrl } from "../lib/wix-image";
import { varmHjaltebild } from "../lib/hjaltebild-varm";
import { lasSidan } from "../lib/las-sidan";
import { gorBakomInert } from "../lib/bakom-inert";
import { prefersDataSaving } from "../lib/gallery-preload";
import { rullaDirekt } from "./use-landa-vid-bilder";
import { lasSokmarke, medSokmarke, utanSokmarke, type Sokmarke } from "../lib/sok-atervand";
import type { Fonster } from "../lib/sidminne";

// Hur många förslag vi visar (sökträffar + tomt-fält-lägets populära). 7, inte
// 8: på mobil täckte Safaris bottenmeny "Visa alla resultat"-knappen när listan
// blev för hög. Bältet+hängslen: .sugg är dessutom max-height-cappad (dvh) med
// knappen sticky i botten, så den är klickbar även på låga skärmar.
const SUGGESTION_COUNT = 7;

// KATEGORIER I FÖRSLAGEN (2026-11-19). "utemöbler" gav sju varor, fyra av dem
// skyddsöverdrag, och ingen väg till kategorin med hundratals. Kategorierna
// vars namn matchar står nu överst, högst två, och tar plats från varorna så
// att listan inte blir högre än förut (se SUGGESTION_COUNT). De kommer ur
// menyns träd (lib/sok-kategorier.ts) och behöver inte vänta på sökindexet.
const KATEGORIFORSLAG = 2;

// SISTA GENOMGÅNGEN (2026-11-19, Leonard: "saknas det något mer för att göra
// detta till världens bästa e-handel sökfält, och fixa det"):
//   • Priset i sökningen: "soffa under 2000" visar soffor under 2 000 kr
//     (lib/sok-pris.ts), här och på söksidan.
//   • Senaste sökningar när rutan är tom (lib/sok-senaste.ts, sparas bara med
//     kundens ja till kakor).
//   • Knappen säger hur många träffarna är: "Visa alla 89 resultat".
//   • Ett kryss som tömmer rutan, och "Sök" på telefonens tangentbord.
//   • Varje sökord står i fetstil i namnen, inte bara hela frasen.
//   • Piltangenterna läses upp (aria-activedescendant) och raden rullas fram.
//   • Utan träff: vägar vidare i stället för en återvändsgränd.
//   • Sökförslag medan man skriver ("sof" → soffa, soffbord, bäddsoffa) och
//     exempel i den tomma rutan, ur katalogens egna ord (sokforslag i
//     lib/search.ts). Det de bästa sökrutorna gör först: föreslå SÖKNINGEN.
//   • På datorn en rad som säger vad piltangenterna, Enter och Esc gör.
// Senaste sökningar, exemplen och sökförslagen tar plats från varorna, så
// panelen blir inte högre.
const RADER_SENASTE = 2;
const RADER_CHIPS = 1;
const SOKFORSLAG = 3;
const SOKEXEMPEL = 6;

// MOBILENS SÖKLÄGE (2026-11-20). Leonard sökte "bilar" på sin iPhone: med
// tangentbordet uppe rymde panelen ordförslagen, två kategorirader och
// rubriken "Varor", och inte en enda vara. Panelen hängde under sidhuvudet
// (remsan, loggans rad och sökraden, 170 px) och varje kategori tog en rad.
//
// Nu tar sökningen över hela skärmen på mobilen: fältet står överst, remsan
// och loggans rad göms (html[data-sok-lage] i app/globals.css), kategorierna
// står som chips på samma rad som ordförslagen, och varorna visas i ett
// rutnät med stora bilder och priset på bilden. Med tangentbordet uppe syns
// chipsen, rubriken och två varor med bild, pris och namn. Ett drag i listan
// fäller tangentbordet, och då syns sex.
//
// Bara rutan i mobilens sökrad (`helskarm`, components/site.tsx), och bara
// under 900 px, där sidhuvudet byter till mobilens. Datorns lista och
// mobilmenyns ruta är som förut.
//
// 12 varor: jämna rader med två, tre och fyra kort i bredd.
const RUTNAT = 12;
const SOKLAGE_MEDIA = "(max-width: 900px)";
// Kortets bild: två i bredd under 600 px, tre under 800, sedan fyra. På en
// skärm med tre pixlar per punkt sägs bredden vara 128 px, så att webbläsaren
// väljer 384 px-filen (2,2 pixlar per punkt på en iPhone) i stället för 640.
// Den filen väger hälften, och det är samma fil som produktkorten i listorna
// hämtar på en dator: den ligger oftast redan i Wix CDN och i webbläsaren.
const RUTNAT_SIZES = "(-webkit-min-device-pixel-ratio:2.5) 128px, (min-resolution:2.5dppx) 128px, (max-width:599px) calc( 50vw - 21px), (max-width:799px) calc( 33vw - 18px), calc( 25vw - 16px)";
// ☠️ BILDERNA SKA STÅ DÄR NÄR RADEN SYNS (Leonard 2026-11-20: "När man sökt och
// klickar på bocken måste bilder visas direkt inte ett tomt fält i några 100
// ms"). Två saker låg bakom det tomma fältet:
//   1. Panelen slutade vid tangentbordet, och höjden räknades om först när
//      iPhone sa att tangentbordet var borta, alltså efter att det glidit ner.
//      Under tiden syntes den vita ytan som täcker sidan. Nu går panelen ända
//      ner till skärmens kant, bakom tangentbordet (app/globals.css,
//      .hsearch-mobile .sugg): raderna står redan där när det fälls.
//   2. Kortens bilder var lata, och i en lista som rullar för sig själv hämtar
//      Safari en lat bild först när den syns. Nu hämtas de sex första (tre
//      rader på en telefon) direkt, och resten när listan stått still en
//      kvarts sekund: den som skriver vidare slipper hämta tolv bilder för
//      varje bokstav, och den som tittar på träffarna har alla tolv hemma
//      innan fingret hunnit till listan.
const BILDER_DIREKT = 6;
const ALLA_BILDER_EFTER_MS = 250;

const prenumereraSmal = (lyssnare: () => void) => {
  const mq = window.matchMedia(SOKLAGE_MEDIA);
  mq.addEventListener("change", lyssnare);
  return () => mq.removeEventListener("change", lyssnare);
};
const arSmal = () => window.matchMedia(SOKLAGE_MEDIA).matches;
/** På servern och under hydreringen: datorns lista. Läget börjar först vid fokus. */
const inteSmal = () => false;

// ☠️ SÖKMOTORN LADDAS VID AVSIKT, INTE MED SIDAN (2026-11-19). Rutan ligger i
// sidhuvudet på varje sida, och rankningen (lib/sok-rankning.ts, som drar in
// lib/search.ts) var 18 kB minifierat och 7,6 kB gzip i varje sidas
// JavaScript, för alla besökare, fast de flesta aldrig söker. Nu hämtas den
// med import() när pekaren eller fingret når rutan, samtidigt som sökindexet,
// som är mycket större: väntan blir ingen annan än förut.
//
// Importera ALDRIG ../lib/search eller ../lib/sok-rankning överst i den här
// filen. lib/sok-2026-11-19.test.ts fäller om det händer.
type Motor = typeof import("../lib/sok-rankning");
let motor: Motor | null = null;
let motorLofte: Promise<Motor | null> | null = null;
function laddaMotor(): Promise<Motor | null> {
  if (motor) return Promise.resolve(motor);
  if (!motorLofte) {
    motorLofte = import("../lib/sok-rankning").then(
      (m) => { motor = m; return m; },
      // Ett fall (tappat nät) får inte bli permanent: nästa tangent försöker igen.
      () => { motorLofte = null; return null; },
    );
  }
  return motorLofte;
}

const Lupp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.4" />
    <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

const Rutor = ({ storlek = 18 }: { storlek?: number }) => (
  <svg width={storlek} height={storlek} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
);

const regexSakert = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Står resultatsidan för just den här sökningen redan framme, med sina träffar?
 *  Utan träffar på sidan (den laddar, eller hämtningen föll) görs sökningen om. */
const resultatsidanVisar = (t: string) =>
  window.location.pathname === "/sok"
  && (new URLSearchParams(window.location.search).get("q") ?? "").trim() === t
  && document.querySelector("main .shoplista") !== null;

/** Sökordet i adressen, på resultatsidan. Tomt på alla andra sidor. */
const sokordIAdressen = () => (window.location.pathname === "/sok" ? (new URLSearchParams(window.location.search).get("q") ?? "").trim() : "");

// ── Sökläget i historikposten (lib/sok-atervand.ts) ──────────────────────────
/** Tar bort märket ur posten man står på: sökläget stängdes utan att sidan
 *  byttes, eller posten bär ett märke som inte ska öppna något. */
function glomMarke(): void {
  try {
    const utan = utanSokmarke(window.history.state);
    if (utan) window.history.replaceState(utan, "");
  } catch { /* en webbläsare som vägrar: märket blir för gammalt av sig självt */ }
}
/** Skriver märket i posten man står på. Svarar med märkets tid, eller null om det inte gick. */
function skrivMarke(q: string, y: number): number | null {
  const t = Date.now();
  try {
    window.history.replaceState(medSokmarke(window.history.state, { q, y, t }), "");
    return t;
  } catch {
    // Utan märke beter sig bakåt som förut.
    return null;
  }
}
/** Märket i posten man står på, om det går att läsa och inte är för gammalt. */
function markeHar(): Sokmarke | null {
  try { return lasSokmarke(window.history.state, Date.now()); } catch { return null; }
}

// "Populära produkter" (tomt sökfält) är BLÄDDRING, inte sökning — där ska
// slutsålt aldrig med, precis som i kategorierna. Skrivna sökningar behåller dem
// (avsikt), men sist. Fail-open: saknar indexet o-fältet (äldre cache) filtreras
// inget bort och listan ser ut som förut.
const inStockOnly = (hits: Hit[]) => hits.filter((h) => !h.o);

export function SearchBox({ onNavigate, helskarm = false }: { onNavigate?: () => void; /** Mobilens sökrad: sökningen tar över skärmen (se RUTNAT ovan). */ helskarm?: boolean } = {}) {
  const [q, setQ] = useState("");
  // Sant i mobilens sökrad under 900 px: förslagen ritas som ett rutnät.
  const smal = useSyncExternalStore(prenumereraSmal, arSmal, inteSmal);
  const rutnat = helskarm && smal;
  const [hits, setHits] = useState<Hit[]>([]);
  const [kat, setKat] = useState<SokKategori[]>([]);
  // Hur många varor som matchar, också de som inte får plats i listan.
  const [totalt, setTotalt] = useState(0);
  const [tidigare, setTidigare] = useState<string[]>([]);
  // Sökningarna kunden är på väg att skriva, och exemplen för en tom ruta.
  const [forslag, setForslag] = useState<string[]>([]);
  const [exempel, setExempel] = useState<string[]>([]);
  // Ordet vars varor listan visar när det skrivna är för kort eller inte gav
  // något ("få" → fåtölj), och om rutan väntar på fler bokstäver. Se onType.
  // Båda bär texten de räknades för: rutan kan få ett nytt ord utan att
  // förslagen räknas om (ur adressen på resultatsidan), och då gäller de inte.
  const [visarFor, setVisarFor] = useState<{ q: string; ord: string } | null>(null);
  // Sökningen (texten i rutan) vars träffar bara ligger nära i stavning: inget
  // namn har ordet, och listan säger det (lib/search.ts, `liknande`).
  const [liknandeFor, setLiknandeFor] = useState<string | null>(null);
  // Sökningen vars första träffar är varan som heter så hos en
  // prisjämförelsesajt, och hur många de är (lib/search.ts, medNamntraff).
  const [namnFor, setNamnFor] = useState<{ q: string; antal: number } | null>(null);
  // Sökningen som bara var leverantörens märke, eller början på det ("hom"),
  // och märket som listan visar varor för (lib/search.ts, medMarkesvaror).
  const [markeFor, setMarkeFor] = useState<{ q: string; marke: string } | null>(null);
  const [fortsattFor, setFortsattFor] = useState<string | null>(null);
  const uid = useId();
  const [popular, setPopular] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // Sant medan indexet hämtas. Utan det skulle panelen — som nu öppnas direkt —
  // hinna visa "Inga produkter matchade" innan vi ens har något att matcha mot.
  // Att ljuga om noll träffar är sämre än att säga att vi letar.
  const [laddar, setLaddar] = useState(false);
  // Sant när senaste hämtningen av indexet föll (nät, timeout, felkod). Då vet
  // vi inte om något matchar, och panelen får inte påstå att inget gör det.
  const [indexFel, setIndexFel] = useState(false);
  const [soker, startaSok] = useTransition();
  // Sant när en sökning skickats till /sok. Panelen visar "Söker…" medan sidan
  // byts och stängs när den bytts (se `visas`). Förr stängdes panelen direkt,
  // och under de 0,5–0,8 s /sok tar att svara syntes ingenting alls.
  const [skickad, setSkickad] = useState(false);
  // Varan eller kategorin kunden tryckt på, medan sidan hämtas (se `ga`).
  const [pavag, setPavag] = useState<string | null>(null);
  const [gar, startaGa] = useTransition();
  const forhamtade = useRef(new Set<string>());
  const router = useRouter();
  const pathname = usePathname();
  const forraSida = useRef<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Värdet från den SENASTE tangenten. Se onType.
  const senaste = useRef("");
  // ☠️ BAKÅT LANDAR I SÖKLÄGET (Leonard 2026-11-25, lib/sok-atervand.ts). "Om jag
  // skriver i sökfältet på något och trycker på produkten och sen backar borde
  // jag komma tillbaka till där jag var sist i sökfältet inte helt annan plats."
  // Förr gav bakåt sidan som låg UNDER sökläget, med tomt fält.
  //   • `rankadFor`: texten som `hits` är räknad för. Står listan för ordet kvar
  //     när kunden kommer tillbaka visas den som den var, utan omräkning.
  //   • `platsAtt`: platsen i listan som ska ställas tillbaka när listan för
  //     ordet står ritad.
  //   • `aterAdress`: adressen sökläget ställdes tillbaka på (se effekten som
  //     tömmer rutan när resultatsidan lämnas).
  //   • `lamnadMed`: tiden i märket som skrevs när kunden senast lämnade
  //     sökläget för en annan sida. Det märket ska stå kvar när sökläget
  //     stängs av sidbytet; alla andra stängningar tar bort märket.
  const rankadFor = useRef<string | null>(null);
  const platsAtt = useRef<{ q: string; y: number } | null>(null);
  const aterAdress = useRef<string | null>(null);
  const lamnadMed = useRef<number | null>(null);
  const aterstallRef = useRef<(m: Sokmarke) => void>(() => {});

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      // I mobilens sökläge täcker sökningen skärmen: ett tryck bredvid fältet
      // är inget tryck utanför. Där stänger knappen Stäng.
      if (document.documentElement.hasAttribute("data-sok-lage")) return;
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, []);

  // TABB UT UR RUTAN STÄNGER PANELEN (2026-11-19). Förr stod den kvar öppen
  // över sidan när fokus gått vidare till menyn. ☠️ Bara när fokus faktiskt
  // landat utanför: på iPhone får en länk eller knapp inget fokus av ett
  // tryck, så relatedTarget är null när man trycker på ett förslag. Stängde
  // vi då försvann förslaget innan klicket hann fram.
  const onBlur = (e: React.FocusEvent) => {
    const till = e.relatedTarget as Node | null;
    if (till && wrapRef.current && !wrapRef.current.contains(till)) setOpen(false);
  };

  // SÖKORDET STÅR KVAR I RUTAN PÅ RESULTATSIDAN (2026-11-19), också efter en
  // omladdning, en delad länk eller bakåtknappen: där vill man kunna ändra sin
  // sökning. Lämnar man resultatsidan börjar rutan om. Värdet läses ur
  // adressen i en effekt, inte med useSearchParams: den hade tvingat varje
  // statisk sida att vänta på webbläsaren för att rita sidhuvudet.
  useEffect(() => {
    const el = inputRef.current;
    const fran = forraSida.current;
    forraSida.current = pathname;
    // Ställdes sökläget nyss tillbaka på just den här adressen (ett steg i
    // historiken, se onPop) är ordet i rutan söklägets: det töms inte.
    const aterstalld = aterAdress.current === window.location.pathname + window.location.search;
    aterAdress.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- adressen finns bara i webbläsaren
    // Bara när rutan är tom: det kunden själv skriver skrivs aldrig över.
    if (pathname === "/sok") { const t = sokordIAdressen(); if (t && el && !el.value) setQ(t); }
    // Också med fokus kvar i rutan: ordet hörde till sidan man lämnade.
    else if (fran === "/sok" && !aterstalld) { if (el) el.value = ""; setQ(""); }
  }, [pathname]);

  // Bakåt och framåt mellan två sökningar byter adress men inte sida.
  // Panelen stängs: i mobilens sökläge täcker den hela sidan man kom till.
  // ☠️ UTOM NÄR POSTEN BÄR SÖKLÄGETS MÄRKE: då lämnade kunden den här sidan
  // genom sökläget, och steget tillbaka öppnar det igen med samma ord på
  // samma plats (aterstall). Bara rutan i mobilens sökrad, och bara i
  // telefonbredd: på datorn är förslagen en lista under rutan, ingen sida.
  //
  // ☠️ LYSSNAREN SITTER KVAR SÅ LÄNGE RUTAN FINNS (2026-11-25). Förr satt den i
  // effekten ovan och byttes ut vid varje sidbyte. Efter första sidbytet stod
  // den därför EFTER Nexts egen popstate-lyssnare, och React ritar ett steg i
  // historiken direkt, mellan två lyssnare: effekten städades, lyssnaren togs
  // bort innan den hunnit köras, och den nya gäller inte händelsen som pågår.
  // Mätt i bygget: bakåt till en post med märket anropade aldrig lyssnaren.
  // Samma sak gällde stängningen: panelen stängdes bara vid sessionens första
  // steg i historiken. Därför läser lyssnaren allt den behöver ur referenser.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const marke = helskarm ? lasSokmarke(e.state, Date.now()) : null;
      if (marke && arSmal()) { aterstallRef.current(marke); return; }
      if (marke) glomMarke();
      setOpen(false); window.setTimeout(() => { const t = sokordIAdressen(); if (t && document.activeElement !== inputRef.current) setQ(t); }, 0);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [helskarm]);

  // Tokeniserad, stam-medveten matchning (lib/search): "knivset" → knivhållare,
  // "halsband" → kedjehalsband. Sorteras på relevans (namn-score), inte katalogordning.
  //
  // setOpen(true) ligger FÖRE await:et, av samma skäl som i onFocus. Att bara
  // laga onFocus (PR #556) räckte inte: skriver man i rutan går man aldrig
  // genom onFocus igen, så en långsam eller hängande hämtning lämnade panelen
  // stängd medan man skrev — inga förslag alls, och ingen förklaring. Det är
  // skärmdumparna Leonard skickade 2026-08-29 ("Jkkk" och "Kontorsstol", tom
  // sida under sökrutan).
  //
  // ☠️ BARA SENASTE TANGENTEN RANKAS (2026-10-14). Varje tangent som trycks
  // medan indexet hämtas väntar på samma löfte. När det kom rankade förr varje
  // väntande tangent sitt eget, för länge sedan inaktuella prefix, alla i samma
  // uppgift: "uppresningsfåtölj" skrivet på en telefon under hämtningen gav
  // 14 rankningar i rad och en frusen skärm i 2,3–2,6 s (uppmätt med
  // fyrdubbelt strypt processor, Leonards "det buggade"). Nu returnerar en
  // väntande tangent direkt om en nyare har tryckts.
  const onType = async (val: string, aterstaller = false) => {
    senaste.current = val;
    setQ(val);
    setActive(-1);
    setOpen(true);
    setSkickad(false);
    // Nya förslag börjar överst, också om listan var rullad. Ställs sökläget
    // tillbaka efter ett bakåtsteg (aterstall) är det tvärtom: listan ska stå
    // där kunden lämnade den. Skriver kunden själv gäller den platsen inte längre.
    if (!aterstaller) { platsAtt.current = null; panelRef.current?.scrollTo(0, 0); }
    const term = val.trim();
    // Priset läses ur sökningen och sökorden rankas utan det (lib/sok-pris.ts).
    const pris = tolkaPris(term);
    // Kategorierna först: de finns redan i sidan, också medan indexet hämtas.
    // De behöver bara motorn, som är liten och kommer långt före indexet.
    const kategorierFor = (m: Motor) => m.matchaKategorier(pris.fraga, registreradeKategorier(), KATEGORIFORSLAG);
    // Två bokstäver är början på ett ord: kategorierna räknas för ordet som
    // listan visar, när det är känt (längre ner), inte för bokstäverna.
    const kort = term.length <= 2 && !/\s/.test(term);
    if (term.length < KORTASTE_SOKNING) setKat([]);
    else if (!kort) {
      if (motor) setKat(kategorierFor(motor));
      else void laddaMotor().then((m) => { if (m && senaste.current === val) setKat(kategorierFor(m)); });
    }
    if (!sokIndexHamtat() || !motor) setLaddar(true);
    // Rutnätet i mobilens sökläge rymmer fler varor än listan. Bredden läses
    // nu, inte ur renderingen: sökläget kan ställas tillbaka från en lyssnare
    // som skapades när skärmen var en annan (onPop, och effekten vid start).
    const antal = helskarm && arSmal() ? RUTNAT : SUGGESTION_COUNT;
    const [idx, m] = await Promise.all([laddaSokIndex(), laddaMotor()]);
    if (senaste.current !== val) return; // en nyare tangent tar över
    // ☠️ BOKSTAVEN SKA SYNAS INNAN RANKNINGEN BÖRJAR (2026-11-19). Är indexet
    // redan hämtat är löftet ovan klart, och allt nedanför körde i samma
    // uppgift som tangenten: på en strypt telefon (4× långsammare processor)
    // höll ett felstavat ord kvar tangenten i 350 ms innan bokstaven ritades.
    // Nu lämnas turen tillbaka till webbläsaren först. Den som skriver fort
    // slipper dessutom rankningen för bokstäverna däremellan: när turen
    // kommer har en nyare tangent tagit över.
    await new Promise<void>((klar) => setTimeout(klar, 0));
    if (senaste.current !== val) return;
    setLaddar(false);
    setIndexFel(!idx || !m);
    if (!idx || !m) {
      rankadFor.current = null;
      setHits([]);
      setTotalt(0);
      setForslag([]);
      setVisarFor(null);
      setNamnFor(null);
      setMarkeFor(null);
      setFortsattFor(null);
      return;
    }
    if (term.length < KORTASTE_SOKNING) {
      // < 2 tecken: visa populära förslag i stället för att filtrera på en bokstav.
      rankadFor.current = null;
      setHits([]);
      setTotalt(0);
      setForslag([]);
      setVisarFor(null);
      setNamnFor(null);
      setMarkeFor(null);
      setFortsattFor(null);
      setExempel(m.sokexempelFor(idx, SOKEXEMPEL));
      setPopular(inStockOnly(idx).slice(0, antal));
      return;
    }
    // Med ett pris i sökningen är det sista ordet ett tal, inget att fylla i.
    const forslagen = harPris(pris) ? [] : m.sokforslagFor(idx, term, SOKFORSLAG);
    setForslag(forslagen);
    // De mest relevanta, slutsålda sist (ordningen förklaras i lib/sok-index.ts).
    // Med ett pris i sökningen gallras träffarna före klippet.
    let svar = m.rankaForslagMedAntal(idx, pris.fraga, antal, harPris(pris) ? (h) => inomPris(pris, prisTal(h.p)) : undefined);
    // ☠️ TVÅ BOKSTÄVER SA "Inga produkter matchade" (Leonard 2026-11-19, "få"
    // och "bi"). Den som skrivit två bokstäver är på väg mot ett ord: listan
    // visar varorna för det första sökförslaget, och säger vilket ord det är.
    // Samma sak när ett längre ord inte gav någon träff men har ett förslag.
    // Regeln står i lib/search.ts (visaVarorFor).
    let visar = "";
    const mal = m.visaVarorFor(term, forslagen, svar.totalt);
    if (mal) {
      const forMalet = m.rankaForslagMedAntal(idx, mal, antal);
      if (forMalet.totalt > 0) { svar = forMalet; visar = mal; }
    }
    // En rättad stavning ("ellamin" → "elkamin") sägs på samma sätt.
    if (!visar && svar.rattat) visar = svar.rattat;
    const kategorier = m.matchaKategorier(visar || pris.fraga, registreradeKategorier(), KATEGORIFORSLAG);
    setKat(kategorier);
    setVisarFor(visar ? { q: val, ord: visar } : null);
    setLiknandeFor(!visar && svar.liknande ? val : null);
    setNamnFor(!visar && svar.namn ? { q: val, antal: svar.namn } : null);
    setMarkeFor(!visar && svar.marke ? { q: val, marke: svar.marke } : null);
    rankadFor.current = val;
    setHits(svar.traffar);
    setTotalt(svar.totalt);
    // Två bokstäver som inget börjar på ("xq"): inget "inga träffar" om ett
    // ord som inte är skrivet än. Rutan visar det tomma lägets förslag och ber
    // om lite till.
    const vantar = m.kortOrd(term) && svar.totalt === 0 && forslagen.length === 0 && kategorier.length === 0;
    setFortsattFor(vantar ? val : null);
    if (vantar) {
      setExempel(m.sokexempelFor(idx, SOKEXEMPEL));
      setPopular(inStockOnly(idx).slice(0, antal));
    }
  };

  // Fokus med tomt fält → visa populära produkter som förslag.
  //
  // setOpen(true) ligger FÖRE await:et. Låg det efter — som förr — höll en
  // långsam hämtning hela panelen stängd, och rutan såg död ut medan man
  // väntade. Nu öppnas den direkt; är indexet redan hämtat (vanligt, tack vare
  // förhämtningen nedan) fylls den i samma andetag, annars när svaret kommer.
  const onFocus = async () => {
    // ☠️ STÅR DET REDAN ETT ORD I RUTAN ska förslagen gälla det ordet. Rutan
    // kan ha fått sitt ord utan att förslagen räknats: ur adressen på
    // resultatsidan, eller skrivet före hydreringen. Då visade panelen "Inga
    // produkter matchade" om ett ord med hundratals träffar.
    const skrivet = inputRef.current?.value ?? "";
    if (skrivet.trim().length >= KORTASTE_SOKNING) {
      setTidigare(senasteSokningar());
      await onType(skrivet);
      return;
    }
    await oppnaTomt();
  };
  // Det tomma lägets förslag: populära produkter, senaste sökningar och exempel.
  const oppnaTomt = async () => {
    setOpen(true);
    setSkickad(false);
    setTidigare(senasteSokningar());
    if (!sokIndexHamtat() || !motor) setLaddar(true);
    const [idx, m] = await Promise.all([laddaSokIndex(), laddaMotor()]);
    setLaddar(false);
    setIndexFel(!idx || !m);
    // Populära visas bara med tomt fält (showing), så de kan sättas oavsett.
    if (idx && m) {
      setPopular(inStockOnly(idx).slice(0, helskarm && arSmal() ? RUTNAT : SUGGESTION_COUNT));
      setExempel(m.sokexempelFor(idx, SOKEXEMPEL));
    }
  };

  // ── Bakåt landar i sökläget (lib/sok-atervand.ts) ──────────────────────────
  // Kunden lämnar sökläget för sidan `till`: ordet i fältet och listans plats
  // skrivs i posten man står på, omedelbart före sidbytet.
  const markUt = (till: string) => {
    lamnadMed.current = null;
    if (!rutnat || !document.documentElement.hasAttribute("data-sok-lage")) return;
    // Sidan man redan står på: ingen ny post läggs, så det finns inget att komma tillbaka från.
    if (till === window.location.pathname + window.location.search) return;
    lamnadMed.current = skrivMarke(inputRef.current?.value ?? q, panelRef.current?.scrollTop ?? 0);
  };
  // Ett steg i historiken landade på en post med märket: sökläget öppnas igen.
  // Fältet får inget fokus, så tangentbordet kommer inte upp: kunden lämnade
  // sökläget med ett tryck på en vara, och då var tangentbordet redan fällt.
  const aterstall = (m: Sokmarke) => {
    lamnadMed.current = null;
    platsAtt.current = { q: m.q, y: m.y };
    aterAdress.current = window.location.pathname + window.location.search;
    senaste.current = m.q;
    setPavag(null);
    setActive(-1);
    if (m.q.trim().length < KORTASTE_SOKNING) { setQ(m.q); void oppnaTomt(); return; }
    // Listan för ordet står kvar sedan kunden lämnade sökläget: den visas som den var.
    if (rankadFor.current === m.q) { setQ(m.q); setOpen(true); setSkickad(false); return; }
    // Annars räknas den om (rutan har använts till något annat, eller sidan har
    // laddats om), och kortens platser visas under tiden.
    setHits([]);
    setTotalt(0);
    setLaddar(true);
    void onType(m.q, true);
  };
  useLayoutEffect(() => { aterstallRef.current = aterstall; });
  // Dokumentet laddades med bakåt eller framåt (fliken hade lämnat minnet, eller
  // sidbytet var en hel sidladdning): webbläsaren har kvar postens tillstånd, så
  // sökläget öppnas också då. Efter en omladdning eller i datorbredd tas märket
  // bort i stället: annars hade det öppnat sökläget vid ett senare bakåtsteg.
  useEffect(() => {
    if (!helskarm) return;
    const marke = markeHar();
    if (!marke) return;
    const w = window as Fonster;
    let typ: string | undefined;
    try { typ = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type; } catch { /* äldre webbläsare */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- postens tillstånd finns bara i webbläsaren
    if (arSmal() && typ === "back_forward" && !w.__fpNy && !w.__fpTrav && !w.__fpKlick) aterstall(marke);
    else glomMarke();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bara när rutan monteras
  }, []);

  // ☠️ TEXT SOM SKREVS FÖRE HYDRERINGEN (2026-10-14). React skriver inte över
  // rutans värde när sidan hydreras (initInput med isHydrating), men q är tomt.
  // Skrev man på en långsam telefon innan sidan blivit interaktiv stod ordet
  // kvar i rutan utan att React kände till det: Enter gjorde ingenting, för
  // goSearch såg en tom sökning, och nästa rendering (fokus öppnar panelen)
  // tömde rutan. Nu tas värdet in när komponenten monteras.
  useEffect(() => {
    const el = inputRef.current;
    if (!el || !el.value) return;
    if (document.activeElement === el) void onType(el.value);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- värdet finns bara i webbläsaren, skrivet innan React tog över rutan
    else setQ(el.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bara när rutan monteras
  }, []);

  // Avsikt att söka → börja hämta indexet. pointerenter fyrar när muspekaren
  // når rutan (desktop, ofta hundratals ms före klicket) och touchstart när
  // fingret landar (mobil, före focus). laddaSokIndex() är idempotent — flera
  // anrop delar samma inflight-löfte.
  // Motorn hämtas samtidigt, och ordförrådet byggs när webbläsaren har en ledig
  // stund, så att det oftast är klart före första tangenten.
  const onIntent = () => {
    void Promise.all([laddaSokIndex(), laddaMotor()]).then(([idx, m]) => { if (idx && m) m.varmUpp(idx); });
  };

  // Det som faktiskt renderas i listan: sökträffar om man skrivit ≥2 tecken,
  // annars populära produkter.
  // `fortsatt`: två bokstäver som inget börjar på. Då gäller det tomma lägets
  // förslag, med en rad som ber om lite till (se onType).
  const fortsatt = fortsattFor !== null && fortsattFor === q;
  const isPopular = q.trim().length < 2 || fortsatt;
  const kategorier = isPopular ? [] : kat;
  // Ordet som listan visar varor för, när det inte är det som står i rutan.
  const visar = !isPopular && visarFor && visarFor.q === q ? visarFor.ord : "";
  const liknande = !isPopular && liknandeFor !== null && liknandeFor === q;
  // Så många av de första korten är varan kunden sökte på namn.
  const soktaVaror = !isPopular && namnFor !== null && namnFor.q === q ? namnFor.antal : 0;
  // Märket som listan visar varor för, när sökningen bara var märket eller början på det.
  const marke = !isPopular && markeFor !== null && markeFor.q === q ? markeFor.marke : "";
  const pris = tolkaPris(q.trim());
  const visaTidigare = isPopular && tidigare.length > 0;
  const visaExempel = isPopular && exempel.length > 0;
  const visaForslag = !isPopular && forslag.length > 0;
  // Kategoriraderna och chipsen tar plats från varorna: listan är lika hög som förut.
  // I rutnätet rullar varorna, och kategorierna står som chips: där tar inget plats från dem.
  const iListan: Hit[] = isPopular
    ? popular.slice(0, SUGGESTION_COUNT - (visaTidigare ? RADER_SENASTE : 0) - (visaExempel ? RADER_CHIPS : 0))
    : hits.slice(0, SUGGESTION_COUNT - kategorier.length - (visaForslag ? RADER_CHIPS : 0));
  const showing: Hit[] = rutnat ? (isPopular ? popular : hits).slice(0, RUTNAT) : iListan;
  // Kategorierna som rader i listan (datorn) eller som chips ovanför rutnätet (mobilens sökläge).
  const katRader = rutnat ? [] : kategorier;
  // Piltangenterna går över kategorierna först, sedan varorna.
  const rader = katRader.length + showing.length;

  // ☠️ SÖKLÄGET STÅR KVAR TILLS SIDAN ÄR FRAMME (Leonard 2026-11-24). Förr
  // stängdes det i trycket, före sidbytet. I mobilens sökläge täcker sökningen
  // skärmen, så när den stängdes syntes sidan som låg under ("Sökresultat för
  // renar") i några hundra millisekunder innan produktsidan kom: två sidbyten
  // för ett tryck. Nu står listan kvar med det tryckta kortet markerat, och
  // byts mot produktsidan i samma bildruta som den ritas (`visas` nedan).
  // Sidbytet görs i en övergång, som sökningen gör sedan 2026-08-29.
  //
  // Produktsidans huvudbild börjar hämtas i samma tryck (lib/hjaltebild-varm.ts),
  // och sidan själv redan när fingret landar på kortet (`forhamta`).
  const ga = (href: string) => {
    // Sökläget: tangentbordet fälls, så att kunden ser kortet hen tryckte på.
    if (rutnat) inputRef.current?.blur();
    // Bakåt från sidan ska landa i sökläget igen (lib/sok-atervand.ts).
    markUt(href);
    setPavag(href);
    startaGa(() => router.push(href));
  };
  const goProduct = (slug: string, bild?: string, kortet?: Element) => { varmHjaltebild(bild, kortet); ga(`/produkt/${slug}`); };
  const goKategori = (slug: string) => ga(`/kategori/${slug}`);
  // Sidan hämtas vid AVSIKT: fingret landar på kortet 100–200 ms innan det
  // släpper, och muspekaren når raden ännu tidigare. Produktsidorna är
  // statiska, så hela sidan hinner oftast fram före trycket. En gång per vara,
  // som components/prefetch-link.tsx gör på korten i listorna.
  const forhamta = (href: string) => {
    if (forhamtade.current.has(href)) return;
    forhamtade.current.add(href);
    // router.prefetch kastar aldrig; faller hämtningen hämtar trycket som förut.
    try { router.prefetch(href); } catch { forhamtade.current.delete(href); }
  };
  // BLÅ "GÅ"-KNAPPEN SÅG DÖD UT. /sok är en dynamisk route utan cache — uppmätt
  // i produktion 2026-08-29: cache-control "private, no-cache, no-store",
  // x-vercel-cache MISS varje gång, TTFB 0,50–0,78 s. Under den halvsekunden
  // hände ingenting synligt: panelen stängdes och sidan stod kvar. Med
  // useTransition vet vi att navigeringen pågår och kan säga det.
  //
  // Panelen stängdes förr först av allt, och med den knappen som sa "Söker…".
  // Nu står den kvar och säger "Söker…" tills /sok har bytt sida (se `visas`).
  // Sökordet läses ur rutan, inte ur q: text skriven före hydreringen kan
  // finnas där innan q fått den.
  const goSearch = (vald?: string) => {
    const t = (vald ?? inputRef.current?.value ?? q).trim();
    if (!t) return;
    // Ett valt förslag (chip) blir rutans ord, och förslagen räknas om för
    // det: annars stod listan för det gamla ordet kvar nästa gång rutan öppnades.
    if (vald) void onType(vald);
    setTidigare(kommIhagSokning(t));
    // ☠️ SAMMA SÖKNING IGEN, PÅ RESULTATSIDAN FÖR DEN (2026-11-20). Rutan behåller
    // sitt ord på resultatsidan, så "Visa alla 178" och Enter leder ofta till
    // sidan man redan står på. Förr hämtades den en gång till, och listan, som
    // kunden rullat ner i efter ett par "Visa fler", började om med 24 kort:
    // sidan blev kortare än platsen man stod på och webbläsaren ställde kunden
    // vid sidfoten (mätt på www, audit/sok-samma.cjs: "kvar till botten 0").
    // Leonard: "ibland kastas man längst ner på sidan". Nu hämtas ingenting:
    // sökläget stängs och sidan visas från början, där träffarna står.
    if (resultatsidanVisar(t)) {
      setOpen(false);
      inputRef.current?.blur();
      onNavigate?.();
      rullaDirekt(0);
      return;
    }
    setSkickad(true);
    // Sökläget: tangentbordet fälls, annars täcker det halva resultatsidan.
    if (rutnat) inputRef.current?.blur();
    // Resultatsidan är sökningen i sin helhet: bakåt därifrån öppnar inte
    // sökläget igen. Ett märke från ett tidigare besök i posten tas bort.
    lamnadMed.current = null;
    if (rutnat) glomMarke();
    onNavigate?.();
    startaSok(() => router.push(`/sok?q=${encodeURIComponent(t)}`));
  };

  // Krysset: töm rutan och visa det tomma lägets förslag, med fokus kvar.
  //
  // ☠️ RUTAN TÖMS I DOM FÖRST. Fokus läser rutans värde (se onFocus), och React
  // har inte hunnit skriva det tömda värdet när focus() anropas här: utan
  // raden räknade fokus om förslagen för det gamla ordet och skrev tillbaka
  // det, så krysset gjorde ingenting. Provet i webbläsaren fångade det.
  const rensa = () => {
    const el = inputRef.current;
    if (el) el.value = "";
    void onType("");
    setTidigare(senasteSokningar());
    el?.focus();
  };

  // Panelen syns när den är öppen, utom när en skickad sökning har landat.
  // Härlett i stället för en effekt som stänger: skickad och soker sätts i
  // samma rendering, så panelen blinkar inte.
  // Detsamma för en tryckt vara: panelen står kvar medan sidan hämtas (`gar`)
  // och är borta i samma rendering som den nya sidan ritas.
  const framme = pavag !== null && !gar;
  const visas = open && !(skickad && !soker) && !framme;
  // Mobilens sökläge: sökningen täcker skärmen så länge panelen är öppen.
  const sokLage = rutnat && visas;
  const stang = () => { setOpen(false); inputRef.current?.blur(); };

  // Sidan är framme: rutan töms, och en förälder (mobilmenyn) får veta att vi
  // har lämnat sidan. Panelen är redan borta i den här renderingen (`visas`),
  // så ingenting blinkar.
  useEffect(() => {
    if (!framme) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- städning efter ett sidbyte som gjordes i en övergång
    setOpen(false);
    setQ("");
    setPavag(null);
    onNavigate?.();
  }, [framme, onNavigate]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (visas && active >= 0 && active < katRader.length) goKategori(katRader[active].slug);
    else if (visas && active >= katRader.length && showing[active - katRader.length]) goProduct(showing[active - katRader.length].s, showing[active - katRader.length].i);
    // Enter gör det foten säger: visar listan varorna för "fåtölj" är det den sökningen.
    else goSearch(visar || undefined);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (!visas || rader === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, rader - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
  };

  // PANELEN SLUTAR OVANFÖR TANGENTBORDET (2026-11-19). 100dvh krymper inte när
  // telefonens tangentbord kommer upp: det lägger sig över sidan, och panelens
  // fot ("Visa alla 89 resultat") hamnade bakom det. visualViewport är det som
  // faktiskt syns. Höjden sätts som en CSS-variabel på rutan; utan den gäller
  // den gamla regeln i globals.css.
  //
  // SÖKLÄGET SÄTTS PÅ html FÖRE MÄTNINGEN. Effekten nedan mäter var rutan
  // står, och i sökläget står den överst på skärmen först när remsan och
  // loggans rad är gömda. Effekterna körs i den ordning de står, och före
  // första ritningen (useLayoutEffect): annars syns panelen en bildruta under
  // det gamla sidhuvudet innan den hoppar upp.
  useLayoutEffect(() => {
    if (!sokLage) return;
    const rot = document.documentElement;
    rot.setAttribute("data-sok-lage", "");
    const slapp = lasSidan();
    // Sidan under syns inte: den ska inte heller gå att tabba till eller läsas upp.
    const huvud = wrapRef.current?.closest("header");
    const tillbaka = huvud ? gorBakomInert(huvud, document.body) : null;
    return () => {
      rot.removeAttribute("data-sok-lage"); slapp(); tillbaka?.();
      // ☠️ SÖKLÄGET STÄNGS: MÄRKET I POSTEN TAS BORT (lib/sok-atervand.ts). Stäng,
      // Esc och allt annat som stänger sökläget på sidan man står på: ett
      // senare bakåtsteg hit ska inte öppna det igen. Undantaget är märket som
      // skrevs i samma tryck som lämnar sidan (`lamnadMed`): det ska stå kvar.
      // Vid ett sidbyte har Next oftast redan lagt den nya posten när
      // städningen körs, och då finns inget märke att ta bort i den.
      const marke = markeHar();
      if (marke && marke.t !== lamnadMed.current) glomMarke();
    };
  }, [sokLage]);

  // Platsen i listan ställs tillbaka i samma rendering som listan för ordet
  // ritas: kunden ser aldrig listan från början först. Väntar medan listan
  // räknas om (`laddar`).
  useLayoutEffect(() => {
    const plats = platsAtt.current, panel = panelRef.current;
    if (!plats || !panel || !sokLage || q !== plats.q || laddar) return;
    panel.scrollTop = plats.y;
    platsAtt.current = null;
  });

  useLayoutEffect(() => {
    const vv = window.visualViewport;
    const wrap = wrapRef.current;
    if (!wrap || !visas) return;
    const satt = () => {
      const ruta = wrap.getBoundingClientRect();
      if (sokLage) {
        // ☠️ SÖKLÄGET FÖLJER INTE TANGENTBORDET (2026-11-20). Panelen börjar vid
        // sidhuvudets underkant (sökradens 12 px) och går ända ner till
        // skärmens kant, också bakom tangentbordet. Höjden står i stilmallen
        // (100dvh minus --sok-topp) och ändras inte när tangentbordet kommer
        // eller går: förr räknades den om först när iPhone sa att
        // tangentbordet var borta, och tills dess var ytan under panelen tom.
        wrap.style.setProperty("--sok-topp", `${Math.max(0, Math.round(ruta.bottom + 12))}px`);
        wrap.style.setProperty("--sok-kant", `${Math.max(0, Math.round(ruta.left))}px`);
        return;
      }
      // Listan hänger 8 px under rutan och slutar 8 px över tangentbordet.
      if (vv) wrap.style.setProperty("--sok-max", `${Math.max(160, Math.round(vv.height + vv.offsetTop - ruta.bottom - 16))}px`);
    };
    // Skärmens höjd för webbläsare utan dvh (Safari före 15.4): mätt när
    // sökläget öppnas, innan tangentbordet kommit, och sedan bara när rutan
    // inte har fokus eller skärmens bredd ändrats (telefonen vreds). Ett
    // tangentbord ändrar aldrig bredden, så då kan det inte räknas in.
    let bredd = window.innerWidth;
    const hojd = () => { if (sokLage) wrap.style.setProperty("--sok-vh", `${window.innerHeight}px`); };
    const nyHojd = () => {
      if (document.activeElement !== inputRef.current || window.innerWidth !== bredd) hojd();
      bredd = window.innerWidth;
      satt();
    };
    hojd();
    satt();
    vv?.addEventListener("resize", satt);
    vv?.addEventListener("scroll", satt);
    window.addEventListener("scroll", satt, { passive: true });
    window.addEventListener("resize", nyHojd);
    return () => {
      vv?.removeEventListener("resize", satt);
      vv?.removeEventListener("scroll", satt);
      window.removeEventListener("scroll", satt);
      window.removeEventListener("resize", nyHojd);
    };
  }, [visas, sokLage]);

  // Kortens bilder: de första direkt, resten när listan stått still en stund
  // (se BILDER_DIREKT). `allaBilderFor` är listan som har stått still: en ny
  // lista börjar om, utan att något behöver nollställas.
  const iRutnatet = isPopular ? popular : hits;
  const [allaBilderFor, setAllaBilderFor] = useState<Hit[] | null>(null);
  useEffect(() => {
    if (!sokLage || iRutnatet.length <= BILDER_DIREKT) return;
    // Den som sparar data hämtar bilderna när de syns, som förut.
    if (prefersDataSaving((navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection)) return;
    const t = window.setTimeout(() => setAllaBilderFor(iRutnatet), ALLA_BILDER_EFTER_MS);
    return () => window.clearTimeout(t);
  }, [sokLage, iRutnatet]);
  const allaBilder = allaBilderFor === iRutnatet;

  // ETT DRAG I LISTAN FÄLLER TANGENTBORDET (sökläget). Med det uppe syns två
  // varor, utan det sex. Fingret som rullar listan vill se fler, inte skriva.
  // Ett drag i sidled (chipsens rad) rör inte tangentbordet.
  const dragFran = useRef<{ x: number; y: number } | null>(null);
  const onDragStart = (e: React.TouchEvent) => { const t = e.touches[0]; dragFran.current = t ? { x: t.clientX, y: t.clientY } : null; };
  const onDrag = (e: React.TouchEvent) => {
    const fran = dragFran.current, t = e.touches[0];
    if (!fran || !t || document.activeElement !== inputRef.current) return;
    const dy = Math.abs(t.clientY - fran.y);
    if (dy > 12 && dy > Math.abs(t.clientX - fran.x)) inputRef.current?.blur();
  };

  // Raden som piltangenterna står på ska synas: listan har en högsta höjd och rullar.
  const radId = (i: number) => `${uid}-rad-${i}`;
  useEffect(() => {
    if (active >= 0) document.getElementById(`${uid}-rad-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, uid]);

  // Panelens fot. ORDNINGEN ÄR VIKTIG. Panelen öppnas innan indexet finns, så
  // "Inga produkter matchade" får BARA visas när vi faktiskt har letat: står
  // laddar kvar är svaret ännu inte känt, och har hämtningen fallit vet vi
  // ingenting. I båda fallen går det att söka på /sok, som inte behöver indexet.
  const fot = () => {
    const term = visar || q.trim();
    const alla = (text: React.ReactNode) => (
      <button type="button" className="sugg-all" onClick={() => goSearch(visar || undefined)} disabled={soker}>
        {soker ? "Söker…" : text}
      </button>
    );
    if (isPopular) {
      if (showing.length > 0) return null;
      if (laddar) return <div className="sugg-empty">Söker…</div>;
      if (indexFel) return <div className="sugg-empty">Förslagen kunde inte laddas just nu.</div>;
      return null;
    }
    // Antalet står med när det finns fler träffar än listan visar.
    if (showing.length > 0) return alla(totalt > showing.length ? <>Visa alla {totalt} resultat för “{term}” →</> : <>Visa alla resultat för “{term}” →</>);
    if (soker) return <div className="sugg-empty">Söker…</div>;
    // Inga varor i namnet, men en kategori ovanför: säg det utan att låta som en återvändsgränd.
    if (!laddar && !indexFel && kategorier.length > 0) return <div className="sugg-empty">Inga varor har “{term}” i namnet. Titta i kategorin ovan.</div>;
    if (laddar) return <><div className="sugg-empty">Söker…</div>{alla(<>Visa alla resultat för “{term}” →</>)}</>;
    if (indexFel) {
      return <><div className="sugg-empty">Förslagen kunde inte laddas just nu.</div>{alla(<>Sök efter “{term}” i hela butiken →</>)}</>;
    }
    // Utan träff: säg vad som gick att göra i stället, och visa vägarna vidare.
    return (
      <div className="sugg-empty">
        {harPris(pris) ? <>Inga produkter {prisText(pris)} matchade “{pris.fraga}”.</> : <>Inga produkter matchade “{term}”.</>}
        <span className="sugg-tips">{harPris(pris) ? "Sök utan priset för att se alla." : "Prova ett kortare ord eller varans typ, till exempel “fåtölj”."}</span>
        <span className="sugg-vagar">
          <a href="/butik">Se alla kategorier</a>
          <a href="/kontaktaoss">Fråga oss om varan</a>
        </span>
      </div>
    );
  };

  // VARJE sökord i fetstil. Förut bara hela frasen, så "svart tv-bänk" och
  // "hundbur xl" markerade ingenting. Priset i sökningen räknas inte som ord.
  // Också ordets andra böjningar: "speglar" markerar "spegel" (lib/search.ts,
  // markeringsord). Motorn är laddad när det finns träffar att markera, och
  // den markerar med sökningens egna spärrar (markeraTraffar): "bar" i
  // "bardisk" men inte i "hopfällbar". Utan motorn markeras orden som de står.
  const markOrd = motor ? motor.markeringsord(visar || pris.fraga) : [];
  const ord = (visar || pris.fraga).split(/\s+/).filter((t) => t.length >= 2).sort((a, b) => b.length - a.length).map(regexSakert);
  const ordRe = ord.length > 0 ? new RegExp(`(${ord.join("|")})`, "gi") : null;
  // I ett sökförslag är det tvärtom: det kunden redan skrivit står som det är,
  // och det förslaget LÄGGER TILL står i fetstil ("sof" → sof**fbord**).
  const sistaOrdet = q.trim().toLowerCase().split(/\s+/).pop() ?? "";
  const tillagg = (f: string) => {
    const start = f.lastIndexOf(" ") + 1;
    const i = sistaOrdet ? f.toLowerCase().indexOf(sistaOrdet, start) : -1;
    if (i < 0) return <>{f.slice(0, start)}<b>{f.slice(start)}</b></>;
    return <>{f.slice(0, start)}{i > start && <b>{f.slice(start, i)}</b>}{f.slice(i, i + sistaOrdet.length)}<b>{f.slice(i + sistaOrdet.length)}</b></>;
  };
  const highlight = (name: string) => {
    if (!ordRe) return name;
    const delar = motor && markOrd.length > 0 ? motor.markeraTraffar(name, markOrd) : name.split(ordRe);
    if (delar.length === 1) return name;
    // split med en fångande grupp lägger träffarna på udda platser.
    return <>{delar.map((d, i) => (i % 2 === 1 ? <b key={i}>{d}</b> : d))}</>;
  };

  // Rubriken över varorna: vilket ord de gäller, när det inte är det skrivna.
  // ☠️ Märkets rubrik är kortare i sökläget: där delar den rad med "Visa alla",
  // och den långa kapades till "Säljs som Homcom hos prisjä…" på en telefon
  // (mätt på förhandsbygget 2026-11-26, 393 px).
  const varuRubrik = visar ? `Visar “${visar}”` : marke ? (rutnat ? `Säljs som ${marke}` : `Säljs som ${marke} hos prisjämförelsesajterna`) : liknande ? "Närmast i stavning" : harPris(pris) ? `Varor ${prisText(pris)}` : "Varor";

  // Vad en skärmläsare får höra när listan ändras: antalet, och vilket ord
  // det gäller när det inte är det som står i rutan.
  const listaId = `${uid}-lista`;
  const upplast = isPopular || laddar || soker ? ""
    : showing.length > 0 ? `${totalt === 1 ? "1 träff" : `${totalt} träffar`}${visar ? ` för ${visar}` : marke ? `, säljs som ${marke} hos prisjämförelsesajterna` : liknande ? ", närmast i stavning" : ""}`
    : kategorier.length > 0 ? "Inga varor i namnet. Titta i kategorin ovan."
    : indexFel ? "" : "Inga träffar";

  return (
    <div className="searchwrap" ref={wrapRef} onBlur={onBlur}>
      {/* action+method+name ger progressiv förbättring: utan JS submittar Enter
          en GET till /sok?q=… (server-renderad sökresultatsida). Med JS kör
          onSubmit (preventDefault) client-side routing istället. */}
      <form className="search" onSubmit={onSubmit} role="search" action="/sok" method="get">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          name="q"
          value={q}
          onChange={(e) => onType(e.target.value)}
          onFocus={onFocus}
          onPointerEnter={onIntent}
          onTouchStart={onIntent}
          onKeyDown={onKeyDown}
          placeholder="Sök efter produkter…"
          aria-label="Sök efter produkter"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          role="combobox"
          aria-expanded={visas}
          aria-controls={listaId}
          aria-autocomplete="list"
          aria-activedescendant={visas && active >= 0 && active < rader ? radId(active) : undefined}
        />
        {q && (
          <button type="button" className="search-rensa" aria-label="Rensa sökfältet" onClick={rensa}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        )}
      </form>
      {/* Sökläget lämnas med knappen: där finns inget "utanför" att trycka på. */}
      {sokLage && <button type="button" className="search-stang" onClick={stang}>Stäng</button>}

      {visas && (showing.length > 0 || laddar || soker || indexFel || visaTidigare || visaExempel || q.trim().length >= 2) && (
        <div className="sugg" ref={panelRef} data-pavag={pavag ? "" : undefined} aria-busy={pavag ? true : undefined} onTouchStart={rutnat ? onDragStart : undefined} onTouchMove={rutnat ? onDrag : undefined}>
          {fortsatt && q.trim().length >= 2 && <div className="sugg-fortsatt" role="status">Skriv lite till, så visar vi förslag.</div>}
          {visaTidigare && (
            <>
              <div className="sugg-head sugg-head-rad">
                Senaste sökningar
                <button type="button" className="sugg-rensa" onClick={() => setTidigare(glomSokningar())}>Rensa</button>
              </div>
              <div className="sugg-senaste">
                {tidigare.map((t) => (
                  <button type="button" className="sugg-chip" key={t} onClick={() => goSearch(t)}>{t}</button>
                ))}
              </div>
            </>
          )}
          {visaExempel && (
            <>
              <div className="sugg-head">Sök till exempel</div>
              <div className="sugg-exempel sugg-chiprad">
                {exempel.map((t) => (
                  <button type="button" className="sugg-chip sugg-chip-sok" key={t} onClick={() => goSearch(t)}><Lupp />{t}</button>
                ))}
              </div>
            </>
          )}
          {(visaForslag || (rutnat && kategorier.length > 0)) && (
            <div className="sugg-forslag sugg-chiprad" role="group" aria-label="Sökförslag">
              {visaForslag && forslag.map((t) => (
                <button type="button" className={`sugg-chip sugg-chip-sok${t === visar ? " sugg-chip-visas" : ""}`} key={t} onClick={() => goSearch(t)}><Lupp /><span>{tillagg(t)}</span></button>
              ))}
              {/* Sökläget: kategorierna står här som chips, så att varorna får raderna under. */}
              {rutnat && kategorier.map((k) => (
                <a key={k.slug} href={`/kategori/${k.slug}`} className={`sugg-chip sugg-chip-kat${pavag === `/kategori/${k.slug}` ? " pavag" : ""}`} onTouchStart={() => forhamta(`/kategori/${k.slug}`)} onClick={(e) => { e.preventDefault(); goKategori(k.slug); }}><Rutor storlek={14} />{rentNamn(k.name)}</a>
              ))}
            </div>
          )}
          {/* Sökläget: rubriken står utanför listboxen, för den bär en knapp. */}
          {rutnat && showing.length > 0 && (
            <div className="sugg-rubrik">
              <span className="sugg-rubrik-text">{isPopular ? "Populära produkter" : varuRubrik}</span>
              {!isPopular && totalt > showing.length && (
                <button type="button" className="sugg-alla-lank" onClick={() => goSearch(visar || undefined)} disabled={soker}>Visa alla {totalt} →</button>
              )}
            </div>
          )}
          {/* Listboxen bär bara raderna man väljer bland. Chipsen ovanför är
              knappar och foten en knapp: de hör inte hemma i en listbox, och en
              skärmläsare räknade dem förr som trasiga alternativ. */}
          <div role="listbox" id={listaId} aria-label="Förslag">
          {!rutnat && isPopular && showing.length > 0 && (
            <div className="sugg-head" role="presentation">Populära produkter</div>
          )}
          {katRader.length > 0 && <div className="sugg-head" role="presentation">Kategorier</div>}
          {katRader.map((k, j) => (
            <a
              key={k.slug}
              id={radId(j)}
              href={`/kategori/${k.slug}`}
              className={`sugg-item sugg-kat ${j === active ? "active" : ""}${pavag === `/kategori/${k.slug}` ? " pavag" : ""}`}
              onClick={(e) => { e.preventDefault(); goKategori(k.slug); }}
              onMouseEnter={() => setActive(j)}
              onPointerEnter={() => forhamta(`/kategori/${k.slug}`)}
              onTouchStart={() => forhamta(`/kategori/${k.slug}`)}
              role="option"
              aria-selected={j === active}
            >
              <span className="sugg-kat-ikon" aria-hidden="true"><Rutor /></span>
              <span className="sugg-name">{rentNamn(k.name)}</span>
              <span className="sugg-kat-pil" aria-hidden="true">→</span>
            </a>
          ))}
          {!rutnat && !isPopular && showing.length > 0 && (kategorier.length > 0 || harPris(pris) || visar || marke || liknande) && (
            <div className="sugg-head" role="presentation">{varuRubrik}</div>
          )}
          {showing.map((h, hi) => { const i = hi + katRader.length; return rutnat ? (
            // Sökläget: ett kort med stor bild, priset på bilden och namnet under.
            // Ordningen här är den som läses upp: namn, pris, slutsåld. Priset
            // och märket läggs på bilden av kortets rutnät (.sugg-kort i
            // app/globals.css), så att det upplästa namnet är den synliga texten.
            <a
              key={h.s}
              id={radId(i)}
              href={`/produkt/${h.s}`}
              className={`sugg-kort${i === active ? " active" : ""}${pavag === `/produkt/${h.s}` ? " pavag" : ""}`}
              onClick={(e) => { e.preventDefault(); goProduct(h.s, h.i, e.currentTarget); }}
              onTouchStart={() => forhamta(`/produkt/${h.s}`)}
              onPointerEnter={(e) => { if (e.pointerType === "mouse") forhamta(`/produkt/${h.s}`); }}
              role="option"
              aria-selected={i === active}
            >
              <span className="sugg-kort-bild">
                {h.i && <Image src={tightFillUrl(h.i, 600, 600)} alt="" fill sizes={RUTNAT_SIZES} loading={hi < BILDER_DIREKT || allaBilder ? "eager" : "lazy"} />}
              </span>
              <span className="sugg-kort-namn">{highlight(h.n)}</span>
              {h.p && <span className="sugg-kort-pris">{h.p}</span>}
              {h.o && <span className="sugg-kort-slut">Slutsåld</span>}
              {/* Vårt namn på varan är ett annat än jämförelsesajtens: märket
                  säger att kortet är varan kunden sökte. Slutsåld går före. */}
              {hi < soktaVaror && !h.o && <span className="sugg-kort-sokt">Varan du sökte</span>}
            </a>
          ) : (
            <a
              key={h.s}
              id={radId(i)}
              href={`/produkt/${h.s}`}
              className={`sugg-item ${i === active ? "active" : ""}${pavag === `/produkt/${h.s}` ? " pavag" : ""}`}
              onClick={(e) => { e.preventDefault(); goProduct(h.s, h.i, e.currentTarget); }}
              onMouseEnter={() => setActive(i)}
              onPointerEnter={() => forhamta(`/produkt/${h.s}`)}
              onTouchStart={() => forhamta(`/produkt/${h.s}`)}
              role="option"
              aria-selected={i === active}
            >
              <span className="sugg-img">
                {h.i && <Image src={h.i} alt="" fill sizes="46px" style={{ objectFit: "cover" }} />}
              </span>
              <span className="sugg-name">
                {highlight(h.n)}
                {/* Slutsålt syns FÖRE klicket — annars är förslaget en fälla. */}
                {h.o && <span className="sugg-oos">Slutsåld</span>}
                {hi < soktaVaror && <span className="sugg-sokt">Varan du sökte</span>}
              </span>
              {h.p && <span className="sugg-price">{h.p}</span>}
            </a>
          ); })}
          </div>
          <div className="sr-only" role="status" aria-live="polite">{upplast}</div>
          {/* Sökläget medan indexet hämtas: kortens platser, så att sidan inte står tom. */}
          {rutnat && laddar && showing.length === 0 && (
            <div className="sugg-skelett" aria-hidden="true"><span /><span /><span /><span /></div>
          )}
          {!rutnat && rader > 0 && (
            <div className="sugg-tangenter" aria-hidden="true">
              <span><kbd>↑</kbd><kbd>↓</kbd> bläddra</span><span><kbd>Enter</kbd> välj</span><span><kbd>Esc</kbd> stäng</span>
            </div>
          )}
          {fot()}
        </div>
      )}
    </div>
  );
}
