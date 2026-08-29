"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { nameScore } from "../lib/search";

// o = slutsåld (sätts bara på slutsålda produkter, se /api/search-index).
type Hit = { n: string; s: string; i: string; p: string; o?: 1 };

// Module-level cache so the header + mobile SearchBox share ONE fetch of the index.
//
// HÄMTNINGEN STARTAR PÅ AVSIKT, INTE PÅ FOKUS. Förr kallades loadIndex() först
// i onFocus, och onFocus väntade in svaret innan listan öppnades — så hela
// nätverksrundan låg mellan tryckningen och första förslaget. Uppmätt i
// produktion 2026-08-28: 0,29–0,92 s bara för /api/search-index, som dessutom
// aldrig CDN-cachades (se huvudet i rutten). Det är den paus Leonard beskrev.
//
// Nu startar hämtningen redan på pointerenter/touchstart — händelser som fyrar
// FÖRE focus — så indexet oftast ligger i `cache` när fokus väl kommer och
// listan kan öppnas direkt. Kostar ingenting för den som aldrig går nära rutan.
let cache: Hit[] | null = null;
let inflight: Promise<Hit[]> | null = null;
function loadIndex(): Promise<Hit[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/api/search-index")
      .then((r) => r.json())
      .then((d: Hit[]) => { cache = d; return d; })
      .catch(() => [] as Hit[]);
  }
  return inflight;
}

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
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);

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
  const onType = async (val: string) => {
    setQ(val);
    setActive(-1);
    const term = val.trim();
    if (term.length < 2) {
      // < 2 tecken: visa populära förslag i stället för att filtrera på en bokstav.
      const idx = await loadIndex();
      setPopular(inStockOnly(idx).slice(0, SUGGESTION_COUNT));
      setHits([]);
      setOpen(true);
      return;
    }
    const idx = await loadIndex();
    // ORDNINGEN ÄR VIKTIG: klipp på RELEVANS först, sänk slutsålda EFTERÅT.
    // Sänker man slutsålda före klippet kan en exakt namnträff som råkar vara
    // slut tryckas ut ur listan av sju svaga träffar som råkar finnas i lager —
    // dvs. söker man på varan man just sett hittar man den inte. Nu visas alltid
    // de 7 mest relevanta; slutsålda bland dem hamnar längst ned. (sort är stabil
    // i JS, så relevansordningen består inom varje grupp.)
    const ranked = idx
      .map((h) => ({ h, score: nameScore(h.n, term) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, SUGGESTION_COUNT)
      .sort((a, b) => (a.h.o ? 1 : 0) - (b.h.o ? 1 : 0))
      .map((r) => r.h);
    setHits(ranked);
    setOpen(true);
  };

  // Fokus med tomt fält → visa populära produkter som förslag.
  //
  // setOpen(true) ligger FÖRE await:et. Låg det efter — som förr — höll en
  // långsam hämtning hela panelen stängd, och rutan såg död ut medan man
  // väntade. Nu öppnas den direkt; är indexet redan hämtat (vanligt, tack vare
  // förhämtningen nedan) fylls den i samma andetag, annars när svaret kommer.
  const onFocus = async () => {
    setOpen(true);
    const idx = await loadIndex();
    if (q.trim().length >= 2) return;
    setPopular(inStockOnly(idx).slice(0, SUGGESTION_COUNT));
  };

  // Avsikt att söka → börja hämta indexet. pointerenter fyrar när muspekaren
  // når rutan (desktop, ofta hundratals ms före klicket) och touchstart när
  // fingret landar (mobil, före focus). loadIndex() är idempotent — flera
  // anrop delar samma inflight-löfte.
  const onIntent = () => { void loadIndex(); };

  // Det som faktiskt renderas i listan: sökträffar om man skrivit ≥2 tecken,
  // annars populära produkter.
  const showing: Hit[] = q.trim().length >= 2 ? hits : popular;
  const isPopular = q.trim().length < 2;

  // onNavigate stänger ev. förälder (mobilmenyn) när vi navigerar bort.
  const goProduct = (slug: string) => { setOpen(false); setQ(""); onNavigate?.(); router.push(`/produkt/${slug}`); };
  const goSearch = () => {
    const t = q.trim();
    if (!t) return;
    setOpen(false);
    onNavigate?.();
    router.push(`/sok?q=${encodeURIComponent(t)}`);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (open && active >= 0 && showing[active]) goProduct(showing[active].s);
    else goSearch();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (!open || showing.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, showing.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
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
          aria-expanded={open}
          aria-controls="search-suggestions"
        />
      </form>

      {open && (showing.length > 0 || q.trim().length >= 2) && (
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
          {!isPopular && (showing.length > 0 ? (
            <button type="button" className="sugg-all" onClick={goSearch}>
              Visa alla resultat för “{q.trim()}” →
            </button>
          ) : (
            <div className="sugg-empty">Inga produkter matchade “{q.trim()}”.</div>
          ))}
        </div>
      )}
    </div>
  );
}
