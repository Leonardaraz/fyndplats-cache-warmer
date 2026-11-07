"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { rankByName } from "../lib/search";
import { laddaSokIndex, sokIndexHamtat, type SokTraff as Hit } from "../lib/sok-index";

// Hur många förslag vi visar (sökträffar + tomt-fält-lägets populära). 7, inte
// 8: på mobil täckte Safaris bottenmeny "Visa alla resultat"-knappen när listan
// blev för hög. Bältet+hängslen: .sugg är dessutom max-height-cappad (dvh) med
// knappen sticky i botten, så den är klickbar även på låga skärmar.
const SUGGESTION_COUNT = 7;

// "Populära produkter" (tomt sökfält) är BLÄDDRING, inte sökning — där ska
// slutsålt aldrig med, precis som i kategorierna. Skrivna sökningar behåller dem
// (avsikt), men sist. Fail-open: saknar indexet o-fältet (äldre cache) filtreras
// inget bort och listan ser ut som förut.
const inStockOnly = (hits: Hit[]) => hits.filter((h) => !h.o);

export function SearchBox({ onNavigate }: { onNavigate?: () => void } = {}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
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
    if (!sokIndexHamtat()) setLaddar(true);
    const idx = await laddaSokIndex();
    if (senaste.current !== val) return; // en nyare tangent tar över
    setLaddar(false);
    setIndexFel(!idx);
    if (!idx) {
      setHits([]);
      return;
    }
    if (term.length < 2) {
      // < 2 tecken: visa populära förslag i stället för att filtrera på en bokstav.
      setHits([]);
      setPopular(inStockOnly(idx).slice(0, SUGGESTION_COUNT));
      return;
    }
    // ORDNINGEN ÄR VIKTIG: klipp på RELEVANS först, sänk slutsålda EFTERÅT.
    // Sänker man slutsålda före klippet kan en exakt namnträff som råkar vara
    // slut tryckas ut ur listan av sju svaga träffar som råkar finnas i lager —
    // dvs. söker man på varan man just sett hittar man den inte. Nu visas alltid
    // de 7 mest relevanta; slutsålda bland dem hamnar längst ned. (sort är stabil
    // i JS, så relevansordningen består inom varje grupp.)
    const ranked = rankByName(idx, (h) => h.n, term)
      .slice(0, SUGGESTION_COUNT)
      .sort((a, b) => (a.o ? 1 : 0) - (b.o ? 1 : 0));
    setHits(ranked);
  };

  // Fokus med tomt fält → visa populära produkter som förslag.
  //
  // setOpen(true) ligger FÖRE await:et. Låg det efter — som förr — höll en
  // långsam hämtning hela panelen stängd, och rutan såg död ut medan man
  // väntade. Nu öppnas den direkt; är indexet redan hämtat (vanligt, tack vare
  // förhämtningen nedan) fylls den i samma andetag, annars när svaret kommer.
  const onFocus = async () => {
    setOpen(true);
    setSkickad(false);
    if (!sokIndexHamtat()) setLaddar(true);
    const idx = await laddaSokIndex();
    setLaddar(false);
    setIndexFel(!idx);
    // Populära visas bara med tomt fält (showing), så de kan sättas oavsett.
    if (idx) setPopular(inStockOnly(idx).slice(0, SUGGESTION_COUNT));
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
  const onIntent = () => { void laddaSokIndex(); };

  // Det som faktiskt renderas i listan: sökträffar om man skrivit ≥2 tecken,
  // annars populära produkter.
  const showing: Hit[] = q.trim().length >= 2 ? hits : popular;
  const isPopular = q.trim().length < 2;

  // onNavigate stänger ev. förälder (mobilmenyn) när vi navigerar bort.
  const goProduct = (slug: string) => { setOpen(false); setQ(""); onNavigate?.(); router.push(`/produkt/${slug}`); };
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
  const goSearch = () => {
    const t = (inputRef.current?.value ?? q).trim();
    if (!t) return;
    setSkickad(true);
    onNavigate?.();
    startaSok(() => router.push(`/sok?q=${encodeURIComponent(t)}`));
  };

  // Panelen syns när den är öppen, utom när en skickad sökning har landat.
  // Härlett i stället för en effekt som stänger: skickad och soker sätts i
  // samma rendering, så panelen blinkar inte.
  const visas = open && !(skickad && !soker);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (visas && active >= 0 && showing[active]) goProduct(showing[active].s);
    else goSearch();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (!visas || showing.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, showing.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
  };

  // Panelens fot. ORDNINGEN ÄR VIKTIG. Panelen öppnas innan indexet finns, så
  // "Inga produkter matchade" får BARA visas när vi faktiskt har letat: står
  // laddar kvar är svaret ännu inte känt, och har hämtningen fallit vet vi
  // ingenting. I båda fallen går det att söka på /sok, som inte behöver indexet.
  const fot = () => {
    const term = q.trim();
    const alla = (text: React.ReactNode) => (
      <button type="button" className="sugg-all" onClick={goSearch} disabled={soker}>
        {soker ? "Söker…" : text}
      </button>
    );
    if (isPopular) {
      if (showing.length > 0) return null;
      if (laddar) return <div className="sugg-empty">Söker…</div>;
      if (indexFel) return <div className="sugg-empty">Förslagen kunde inte laddas just nu.</div>;
      return null;
    }
    if (showing.length > 0) return alla(<>Visa alla resultat för “{term}” →</>);
    if (soker) return <div className="sugg-empty">Söker…</div>;
    if (laddar) return <><div className="sugg-empty">Söker…</div>{alla(<>Visa alla resultat för “{term}” →</>)}</>;
    if (indexFel) {
      return <><div className="sugg-empty">Förslagen kunde inte laddas just nu.</div>{alla(<>Sök efter “{term}” i hela butiken →</>)}</>;
    }
    return <div className="sugg-empty">Inga produkter matchade “{term}”.</div>;
  };

  // Bold the matched substring in a suggestion's name.
  const highlight = (name: string) => {
    const term = q.trim();
    const i = term ? name.toLowerCase().indexOf(term.toLowerCase()) : -1;
    if (i < 0) return name;
    return (<>{name.slice(0, i)}<b>{name.slice(i, i + term.length)}</b>{name.slice(i + term.length)}</>);
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
          role="combobox"
          aria-expanded={visas}
          aria-controls="search-suggestions"
        />
      </form>

      {visas && (showing.length > 0 || laddar || soker || indexFel || q.trim().length >= 2) && (
        <div className="sugg" id="search-suggestions" role="listbox">
          {isPopular && showing.length > 0 && (
            <div className="sugg-head">Populära produkter</div>
          )}
          {showing.map((h, i) => (
            <a
              key={h.s}
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
          ))}
          {fot()}
        </div>
      )}
    </div>
  );
}
