"use client";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { KORTASTE_SOKNING, laddaSokIndex, sokIndexHamtat, type SokTraff as Hit } from "../lib/sok-index";
import { registreradeKategorier, rentNamn, type SokKategori } from "../lib/sok-kategorier";
import { harPris, inomPris, prisTal, prisText, tolkaPris } from "../lib/sok-pris";
import { glomSokningar, kommIhagSokning, senasteSokningar } from "../lib/sok-senaste";

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

const regexSakert = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "Populära produkter" (tomt sökfält) är BLÄDDRING, inte sökning — där ska
// slutsålt aldrig med, precis som i kategorierna. Skrivna sökningar behåller dem
// (avsikt), men sist. Fail-open: saknar indexet o-fältet (äldre cache) filtreras
// inget bort och listan ser ut som förut.
const inStockOnly = (hits: Hit[]) => hits.filter((h) => !h.o);

export function SearchBox({ onNavigate }: { onNavigate?: () => void } = {}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [kat, setKat] = useState<SokKategori[]>([]);
  // Hur många varor som matchar, också de som inte får plats i listan.
  const [totalt, setTotalt] = useState(0);
  const [tidigare, setTidigare] = useState<string[]>([]);
  // Sökningarna kunden är på väg att skriva, och exemplen för en tom ruta.
  const [forslag, setForslag] = useState<string[]>([]);
  const [exempel, setExempel] = useState<string[]>([]);
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
  const router = useRouter();
  const pathname = usePathname();
  const forraSida = useRef<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Värdet från den SENASTE tangenten. Se onType.
  const senaste = useRef("");

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, []);

  // SÖKORDET STÅR KVAR I RUTAN PÅ RESULTATSIDAN (2026-11-19), också efter en
  // omladdning, en delad länk eller bakåtknappen: där vill man kunna ändra sin
  // sökning. Lämnar man resultatsidan börjar rutan om. Värdet läses ur
  // adressen i en effekt, inte med useSearchParams: den hade tvingat varje
  // statisk sida att vänta på webbläsaren för att rita sidhuvudet.
  useEffect(() => {
    const el = inputRef.current;
    const iAdressen = () => (window.location.pathname === "/sok" ? (new URLSearchParams(window.location.search).get("q") ?? "").trim() : "");
    const fran = forraSida.current;
    forraSida.current = pathname;
    const harFokus = () => document.activeElement === el;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- adressen finns bara i webbläsaren
    // Bara när rutan är tom: det kunden själv skriver skrivs aldrig över.
    if (pathname === "/sok") { const t = iAdressen(); if (t && el && !el.value) setQ(t); }
    // Också med fokus kvar i rutan: ordet hörde till sidan man lämnade.
    else if (fran === "/sok") { if (el) el.value = ""; setQ(""); }
    // Bakåt och framåt mellan två sökningar byter adress men inte sida.
    const onPop = () => window.setTimeout(() => { const t = iAdressen(); if (t && !harFokus()) setQ(t); }, 0);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [pathname]);

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
  const onType = async (val: string) => {
    senaste.current = val;
    setQ(val);
    setActive(-1);
    setOpen(true);
    setSkickad(false);
    const term = val.trim();
    // Priset läses ur sökningen och sökorden rankas utan det (lib/sok-pris.ts).
    const pris = tolkaPris(term);
    // Kategorierna först: de finns redan i sidan, också medan indexet hämtas.
    // De behöver bara motorn, som är liten och kommer långt före indexet.
    const kategorierFor = (m: Motor) => m.matchaKategorier(pris.fraga, registreradeKategorier(), KATEGORIFORSLAG);
    if (term.length < KORTASTE_SOKNING) setKat([]);
    else if (motor) setKat(kategorierFor(motor));
    else void laddaMotor().then((m) => { if (m && senaste.current === val) setKat(kategorierFor(m)); });
    if (!sokIndexHamtat() || !motor) setLaddar(true);
    const [idx, m] = await Promise.all([laddaSokIndex(), laddaMotor()]);
    if (senaste.current !== val) return; // en nyare tangent tar över
    setLaddar(false);
    setIndexFel(!idx || !m);
    if (!idx || !m) {
      setHits([]);
      setTotalt(0);
      setForslag([]);
      return;
    }
    if (term.length < KORTASTE_SOKNING) {
      // < 2 tecken: visa populära förslag i stället för att filtrera på en bokstav.
      setHits([]);
      setTotalt(0);
      setForslag([]);
      setExempel(m.sokexempelFor(idx, SOKEXEMPEL));
      setPopular(inStockOnly(idx).slice(0, SUGGESTION_COUNT));
      return;
    }
    // Med ett pris i sökningen är det sista ordet ett tal, inget att fylla i.
    setForslag(harPris(pris) ? [] : m.sokforslagFor(idx, term, SOKFORSLAG));
    // De mest relevanta, slutsålda sist (ordningen förklaras i lib/sok-index.ts).
    // Med ett pris i sökningen gallras träffarna före klippet.
    const svar = m.rankaForslagMedAntal(idx, pris.fraga, SUGGESTION_COUNT, harPris(pris) ? (h) => inomPris(pris, prisTal(h.p)) : undefined);
    setHits(svar.traffar);
    setTotalt(svar.totalt);
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
    setOpen(true);
    setSkickad(false);
    setTidigare(senasteSokningar());
    if (!sokIndexHamtat() || !motor) setLaddar(true);
    const [idx, m] = await Promise.all([laddaSokIndex(), laddaMotor()]);
    setLaddar(false);
    setIndexFel(!idx || !m);
    // Populära visas bara med tomt fält (showing), så de kan sättas oavsett.
    if (idx && m) {
      setPopular(inStockOnly(idx).slice(0, SUGGESTION_COUNT));
      setExempel(m.sokexempelFor(idx, SOKEXEMPEL));
    }
  };

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
  const isPopular = q.trim().length < 2;
  const kategorier = isPopular ? [] : kat;
  const pris = tolkaPris(q.trim());
  const visaTidigare = isPopular && tidigare.length > 0;
  const visaExempel = isPopular && exempel.length > 0;
  const visaForslag = !isPopular && forslag.length > 0;
  // Kategoriraderna och chipsen tar plats från varorna: listan är lika hög som förut.
  const showing: Hit[] = isPopular
    ? popular.slice(0, SUGGESTION_COUNT - (visaTidigare ? RADER_SENASTE : 0) - (visaExempel ? RADER_CHIPS : 0))
    : hits.slice(0, SUGGESTION_COUNT - kategorier.length - (visaForslag ? RADER_CHIPS : 0));
  // Piltangenterna går över kategorierna först, sedan varorna.
  const rader = kategorier.length + showing.length;

  // onNavigate stänger ev. förälder (mobilmenyn) när vi navigerar bort.
  const goProduct = (slug: string) => { setOpen(false); setQ(""); onNavigate?.(); router.push(`/produkt/${slug}`); };
  const goKategori = (slug: string) => { setOpen(false); setQ(""); onNavigate?.(); router.push(`/kategori/${slug}`); };
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
    setSkickad(true);
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
  const visas = open && !(skickad && !soker);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (visas && active >= 0 && active < kategorier.length) goKategori(kategorier[active].slug);
    else if (visas && active >= kategorier.length && showing[active - kategorier.length]) goProduct(showing[active - kategorier.length].s);
    else goSearch();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (!visas || rader === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, rader - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
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
    const term = q.trim();
    const alla = (text: React.ReactNode) => (
      <button type="button" className="sugg-all" onClick={() => goSearch()} disabled={soker}>
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
  const ord = pris.fraga.split(/\s+/).filter((t) => t.length >= 2).sort((a, b) => b.length - a.length).map(regexSakert);
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
    const delar = name.split(ordRe);
    if (delar.length === 1) return name;
    // split med en fångande grupp lägger träffarna på udda platser.
    return <>{delar.map((d, i) => (i % 2 === 1 ? <b key={i}>{d}</b> : d))}</>;
  };

  return (
    <div className="searchwrap" ref={wrapRef}>
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
          aria-controls="search-suggestions"
          aria-autocomplete="list"
          aria-activedescendant={visas && active >= 0 && active < rader ? radId(active) : undefined}
        />
        {q && (
          <button type="button" className="search-rensa" aria-label="Rensa sökfältet" onClick={rensa}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        )}
      </form>

      {visas && (showing.length > 0 || laddar || soker || indexFel || visaTidigare || visaExempel || q.trim().length >= 2) && (
        <div className="sugg" id="search-suggestions" role="listbox">
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
          {visaForslag && (
            <div className="sugg-forslag sugg-chiprad" role="group" aria-label="Sökförslag">
              {forslag.map((t) => (
                <button type="button" className="sugg-chip sugg-chip-sok" key={t} onClick={() => goSearch(t)}><Lupp /><span>{tillagg(t)}</span></button>
              ))}
            </div>
          )}
          {isPopular && showing.length > 0 && (
            <div className="sugg-head">Populära produkter</div>
          )}
          {kategorier.length > 0 && <div className="sugg-head">Kategorier</div>}
          {kategorier.map((k, j) => (
            <a
              key={k.slug}
              id={radId(j)}
              href={`/kategori/${k.slug}`}
              className={`sugg-item sugg-kat ${j === active ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); goKategori(k.slug); }}
              onMouseEnter={() => setActive(j)}
              role="option"
              aria-selected={j === active}
            >
              <span className="sugg-kat-ikon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
              </span>
              <span className="sugg-name">{rentNamn(k.name)}</span>
              <span className="sugg-kat-pil" aria-hidden="true">→</span>
            </a>
          ))}
          {!isPopular && showing.length > 0 && (kategorier.length > 0 || harPris(pris)) && (
            <div className="sugg-head">{harPris(pris) ? `Varor ${prisText(pris)}` : "Varor"}</div>
          )}
          {showing.map((h, hi) => { const i = hi + kategorier.length; return (
            <a
              key={h.s}
              id={radId(i)}
              href={`/produkt/${h.s}`}
              className={`sugg-item ${i === active ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); goProduct(h.s); }}
              onMouseEnter={() => setActive(i)}
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
              </span>
              {h.p && <span className="sugg-price">{h.p}</span>}
            </a>
          ); })}
          {rader > 0 && (
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
