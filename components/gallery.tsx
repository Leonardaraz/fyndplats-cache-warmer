"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image, { type ImageLoaderProps } from "next/image";
import { SHIMMER_BLUR } from "../lib/lqip";
import { tightFillUrl } from "../lib/wix-image";

// LCP-fix (Leonards rapport: hjältebilden låg blank 1–2 s). Huvudbilden gick
// tidigare via Vercels bildoptimerare (/_next/image), som KALLSTARTAR per ny
// bild — första besöket på en produkt fick vänta på att servern optimerade.
// Wix-CDN:n kan själv leverera en exakt-storlek, center-fylld webp via en
// transform-URL (samma mekanism som blur-miniatyren i lib/lqip). Genom att peka
// huvudbildens loader dit hämtas LCP-elementet direkt från Wix globala CDN,
// redan webp och rätt storlek — ingen optimerar-kallstart i kritiska vägen.
// Galleriets huvudbild visas i aspect-ratio:1 med object-fit:cover, så en
// kvadratisk fill (w=h) matchar exakt utan dubbelbeskärning.
// `priority` på initiala lagret (LCP-bilden) genererar <link rel=preload
// fetchpriority=high> i <head> via SAMMA loader → webbläsaren förladdar
// rätt URL. (OBS: next/image har ingen `preload`-prop — det är `priority`.)
function wixMainLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!(src || "").includes("static.wixstatic.com")) return src; // icke-Wix (ska inte hända för katalogbilder) → orört
  // q_72 i stället för 82: hjältebilden var en PNG-sourcad produktbild som
  // komprimerade dåligt → 114 KB webp och ~6 s LCP på 4G (mätt på prod). Vid 72
  // sparas ~25–30 % utan synlig kvalitetsförlust i webp → snabbare första paint.
  // tightFillUrl: när crop-data finns i image-crops.json byggs en /v1/crop-URL
  // (bbox i original-pixlar); annars samma fill-URL som tidigare. Säker fallback.
  return tightFillUrl(src, width, width, quality || 72);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function Gallery({
  images,
  alt,
  mainBlur,
  active: activeProp,
  onActiveChange,
  eagerCount,
  variantImageIndices,
}: {
  images: string[];
  alt: string;
  mainBlur?: string;
  active?: number;
  onActiveChange?: (i: number) => void;
  // Galleri-index som tillhör den VALDA varianten → markeras med ram så man ser
  // att just de bilderna hör till varianten. Tom/utelämnad = ingen markering.
  variantImageIndices?: number[];
  // Antal bilder från början som ska bakgrundsförladdas efter LCP (variant-
  // bilderna ligger först). Default: alla. Övriga (svep-bara galleriextrabilder,
  // t.ex. instruktioner) mountas lazy vid första visning så vi inte slösar band-
  // bredd på bilder pickern aldrig hoppar till.
  eagerCount?: number;
}) {
  const imgs = images.filter(Boolean);
  // Index (i `images`) som tillhör den valda varianten → ram-markeras i thumb-raden.
  const variantSet = new Set(variantImageIndices || []);
  const [activeInternal, setActiveInternal] = useState(0);
  const controlled = activeProp !== undefined;
  const active = controlled ? activeProp! : activeInternal;

  const setActive = useCallback(
    (v: number | ((a: number) => number)) => {
      const cur = controlled ? activeProp! : activeInternal;
      const next = typeof v === "function" ? (v as (a: number) => number)(cur) : v;
      if (onActiveChange) onActiveChange(next);
      if (!controlled) setActiveInternal(next);
    },
    [controlled, activeProp, activeInternal, onActiveChange]
  );

  const [lightbox, setLightbox] = useState(false);
  // Transform-modell för lightbox-zoom: skala + panorering (px). Ersätter den
  // gamla origin/scale-toggeln så att pinch-zoom, panorering och dubbeltapp kan
  // dela samma tillstånd. scale 1 = oförstorad.
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const resetView = useCallback(() => setView({ s: 1, x: 0, y: 0 }), []);
  const main = imgs[active] || imgs[0] || "";

  // ── Hjälte-crossfade (ersätter <Image key={main}>) ──────────────────────────
  // Tidigare remountade en enda <Image> via key={src} vid varje variant-/bildbyte.
  // Mätt på prod (Leonards rapport, 4G): det gav (1) blur-placeholdern tillbaka,
  // (2) ett layout-hopp 321→130→321 px medan elementet remounterades, och (3) en
  // bortkastad w_3840-fetch innan srcset hann räknas om. Nu renderas i stället
  // varje bild som ett absolut lager och vi tonar opacity mellan dem. Lagren
  // mountas lazy (bara den initiala laddas direkt → oförändrad LCP) och ett nytt
  // lager visas FÖRST när dess bild laddat klart, så det gamla ligger kvar tills
  // det nya är redo — äkta crossfade utan blink, hopp eller refetch.
  // Fångar `active` vid första render (det initiala/LCP-lagret) en gång. useState
  // i stället för useRef().current → inget ref-läs under render (react-hooks/refs).
  const [initialActive] = useState(active);
  const gmainRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState<number[]>([active]);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [shown, setShown] = useState(active);
  useEffect(() => {
    setMounted((m) => (m.includes(active) ? m : [...m, active]));
    if (loaded[active]) setShown(active); // byt först när målbilden är dekodad
  }, [active, loaded]);

  // Pålitlig "dekodad"-detektering. next/image:s onLoad fyrar INTE för en bild
  // som redan låg i webbläsarcachen när lagret mountas (klassisk next/image-fälla,
  // mätt här: förladdade lager fick aldrig loaded=true → crossfaden bytte aldrig
  // och spinnern fastnade). Efter varje mount-ändring läser vi därför av varje
  // lagers faktiska `complete`-status och markerar de dekodade som laddade — så
  // täcks både cache-träff (complete direkt) och kall fetch (onLoad nedan).
  useEffect(() => {
    const root = gmainRef.current;
    if (!root) return;
    const scan = () => {
      const nodes = root.querySelectorAll<HTMLImageElement>("img.ghero-layer[data-idx]");
      const done: number[] = [];
      nodes.forEach((im) => { if (im.complete && im.naturalWidth > 0) done.push(Number(im.dataset.idx)); });
      if (done.length) setLoaded((l) => {
        let next = l;
        for (const i of done) if (!next[i]) { if (next === l) next = { ...l }; next[i] = true; }
        return next;
      });
    };
    // Synkron avläsning (cache-träffar är complete redan här) + ett par sena
    // svep för bilder som dekodar strax efter mount. setTimeout (inte rAF) — rAF
    // pausas helt i en dold flik, vilket annars låste crossfaden + spinnern.
    scan();
    const t1 = setTimeout(scan, 60);
    const t2 = setTimeout(scan, 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [mounted]);

  // ── Ivrig förladdning av ALLA variant-/galleribilder (Leonards rapport:
  //    "när man byter variant händer inget om bilden inte laddats"). Tidigare
  //    mountades ett bildlager först VID variantbytet → första bytet till varje
  //    variant väntade på en kall fetch (1–3 s på 4G, ingen feedback). Nu mountar
  //    vi resten av lagren (opacity:0) SÅ FORT hjältebilden/LCP-bilden dekodats,
  //    via requestIdleCallback så de aldrig konkurrerar med LCP i kritiska vägen.
  //    Lagren hämtas+dekodas på exakt den srcset-kandidat ett kommande byte visar
  //    → variantbytet blir en direkt cache-träff (mätt: 0 nya fetchar, <100 ms).
  const preloadedAll = useRef(false);
  const doPreload = useCallback(() => {
    if (preloadedAll.current || imgs.length <= 1) return;
    preloadedAll.current = true;
    const n = eagerCount && eagerCount > 0 ? Math.min(eagerCount, imgs.length) : imgs.length;
    const targets = Array.from({ length: n }, (_, i) => i);
    setMounted((m) => [...new Set([...m, ...targets])]);
  }, [imgs.length, eagerCount]);
  // Gate:as på att hjältebilden (LCP) faktiskt dekodats — annars stal de 5
  // variant-fetcharna bandbredd från LCP-bilden på 4G (mätt: sportflaskans LCP
  // sköt från 2,0→3,0 s när förladdningen råkade starta för tidigt). loaded-
  // detekteringen ovan är pålitlig (synk-scan för cache-träff, onLoad för kall
  // fetch), så detta fyrar säkert. requestIdleCallback skjuter dessutom upp till
  // browser-idle. Inget separat skyddsnät → förladdningen kan ALDRIG ligga före
  // LCP. (Slår förladdningen fel uteblir den bara → svep faller tillbaka på
  // on-demand-mount med spinner, dvs det gamla beteendet.)
  useEffect(() => {
    if (!loaded[initialActive]) return;
    const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void };
    if (w.requestIdleCallback) { w.requestIdleCallback(doPreload, { timeout: 1500 }); return; }
    const t = setTimeout(doPreload, 300);
    return () => clearTimeout(t);
  }, [loaded, initialActive, doPreload]);

  // Subtil laddningsindikator: man har bytt till ett lager vars bild ännu inte
  // dekodats (det gamla ligger kvar tills det nya är redo — äkta crossfade). Utan
  // feedback upplevdes det som att "inget händer". Efter förladdningen ovan är
  // detta normalt aldrig sant (träffen är direkt); annars syns en mjuk spinner.
  const waiting = active !== shown && !loaded[active];

  const go = useCallback((dir: number) => {
    setView({ s: 1, x: 0, y: 0 }); // nollställ zoom vid bildbyte (inlinat → stabil dep-lista)
    setActive((a) => (a + dir + imgs.length) % imgs.length);
  }, [imgs.length, setActive]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [lightbox, go]);

  // ── Inline hero: svep vänster/höger för att bläddra på mobil ────────────────
  // En enda <Image> byts på plats (LCP-vänligt — ingen scroll-container, ingen
  // scroll-jump vid variantbyte). Svep navigerar; en ren tap öppnar lightboxen.
  const heroTouch = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const heroSwiped = useRef(false);
  const onHeroTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    heroTouch.current = { x: t.clientX, y: t.clientY, moved: false };
  };
  const onHeroTouchMove = (e: React.TouchEvent) => {
    const s = heroTouch.current; if (!s) return;
    const t = e.touches[0];
    if (Math.abs(t.clientX - s.x) > 10 || Math.abs(t.clientY - s.y) > 10) s.moved = true;
  };
  const onHeroTouchEnd = (e: React.TouchEvent) => {
    const s = heroTouch.current; heroTouch.current = null; if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (imgs.length > 1 && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      heroSwiped.current = true; // hindra att tap-handlern öppnar lightboxen
      go(dx < 0 ? 1 : -1);
    }
  };
  const onHeroClick = () => {
    if (heroSwiped.current) { heroSwiped.current = false; return; }
    resetView();
    setLightbox(true);
  };

  // ── Lightbox: pinch-zoom + panorering + svep (pointer events) ───────────────
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<
    | { mode: "pinch"; startDist: number; startScale: number }
    | { mode: "pan"; sx: number; sy: number; bx: number; by: number; moved: boolean }
    | { mode: "swipe"; sx: number; sy: number; moved: boolean }
    | null
  >(null);
  const [gesturing, setGesturing] = useState(false);
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  const onStageDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setGesturing(true);
    if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()];
      gesture.current = { mode: "pinch", startDist: dist(a, b) || 1, startScale: view.s };
    } else if (ptrs.current.size === 1) {
      gesture.current = view.s > 1
        ? { mode: "pan", sx: e.clientX, sy: e.clientY, bx: view.x, by: view.y, moved: false }
        : { mode: "swipe", sx: e.clientX, sy: e.clientY, moved: false };
    }
  };
  const onStageMove = (e: React.PointerEvent) => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current; if (!g) return;
    if (g.mode === "pinch" && ptrs.current.size >= 2) {
      const [a, b] = [...ptrs.current.values()];
      const s = clamp(g.startScale * (dist(a, b) / g.startDist), 1, 4);
      setView((v) => ({ ...v, s }));
    } else if (g.mode === "pan") {
      // Klampa panoreringen så bildlagret ALLTID täcker scenen. Utan gräns kunde
      // man dra bilden hur långt som helst → den mörka lightbox-bakgrunden blottas
      // i kanterna ("grå bakgrund-rester på bilden", Leonards desktop-rapport). Vid
      // skala s får lagret dras max (s−1)·halva scenen åt varje håll (samma gräns
      // som toggleZoomAt:s hörn-zoom ger), annars glider en kant in i vyn.
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const maxX = ((view.s - 1) * r.width) / 2;
      const maxY = ((view.s - 1) * r.height) / 2;
      const nx = clamp(g.bx + (e.clientX - g.sx), -maxX, maxX);
      const ny = clamp(g.by + (e.clientY - g.sy), -maxY, maxY);
      setView({ s: view.s, x: nx, y: ny });
      // Räkna bara som "flyttad" över en liten tröskel. Annars markeras ett stilla
      // klick (0–några px muspekar-jitter) som en pan, och toggle-ut-zoomen nedan
      // körs aldrig → man fastnar inzoomad (Leonards desktop-buggrapport).
      if (Math.abs(e.clientX - g.sx) > 8 || Math.abs(e.clientY - g.sy) > 8) g.moved = true;
    } else if (g.mode === "swipe") {
      if (Math.abs(e.clientX - g.sx) > 8 || Math.abs(e.clientY - g.sy) > 8) g.moved = true;
    }
  };
  const onStageUp = (e: React.PointerEvent) => {
    const g = gesture.current;
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size > 0) return; // vänta tills alla fingrar släppts
    setGesturing(false);
    gesture.current = null;
    if (!g) return;
    if (g.mode === "pinch") {
      if (view.s <= 1.05) resetView(); // snäpp tillbaka om man nästan zoomat ut
      return;
    }
    // pan: en riktig dragning panorerade redan under move → gör inget på up. Men ett
    // stilla klick (moved=false) medan man är inzoomad ska toggla UT zoomen igen
    // (toggleZoomAt nollställer när s>1.05) — annars går det bara att zooma in, aldrig ut.
    if (g.mode === "pan") { if (!g.moved) toggleZoomAt(e); return; }
    // swipe: ren tap → toggla zoom kring tap-punkten; annars navigera/stäng
    if (!g.moved) { toggleZoomAt(e); return; }
    const dx = e.clientX - g.sx, dy = e.clientY - g.sy;
    if (dy > 90 && Math.abs(dy) > Math.abs(dx)) setLightbox(false);          // svep ned → stäng
    else if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1); // svep i sidled
  };
  const onStageCancel = (e: React.PointerEvent) => {
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size === 0) { setGesturing(false); gesture.current = null; }
  };
  // Toggla mellan 1× och 2.5×; vid inzoom centreras tap-punkten.
  const toggleZoomAt = (e: React.PointerEvent) => {
    if (view.s > 1.05) { resetView(); return; }
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const s = 2.5;
    const px = e.clientX - (r.left + r.width / 2);
    const py = e.clientY - (r.top + r.height / 2);
    setView({ s, x: -px * (s - 1), y: -py * (s - 1) });
  };

  // Produkt utan bilder → visa en igenkännbar platshållare i stället för en tom
  // gräddvit ruta (Leonards rapport). Hela katalogen har i dag bild, men import-
  // brister kan ge enstaka bildlösa produkter; då vill vi ändå visa något vänligt.
  if (imgs.length === 0) {
    return (
      <div className="gallery">
        <div className="gmain gmain-empty" role="img" aria-label={`${alt} – bild kommer snart`}>
          <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect x="6" y="9" width="36" height="30" rx="4" stroke="currentColor" strokeWidth="2.2" />
            <circle cx="17" cy="20" r="3.5" stroke="currentColor" strokeWidth="2.2" />
            <path d="M9 35l10-10 7 7 5-4 8 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Bild kommer snart</span>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery">
      <button
        type="button"
        className="gmain"
        ref={gmainRef}
        onClick={onHeroClick}
        onTouchStart={onHeroTouchStart}
        onTouchMove={onHeroTouchMove}
        onTouchEnd={onHeroTouchEnd}
        aria-label="Förstora bilden"
      >
        {/* Crossfade-lager: ett <Image> per bild som hunnit bli aktiv. Bara det
            initiala lagret preloadas (LCP-bilden); övriga laddas eager först när
            man växlar dit. `is-shown` tonar in det lager vars bild laddat klart. */}
        {mounted.map((i) => {
          const src = imgs[i];
          if (!src) return null;
          const isWix = src.includes("static.wixstatic.com");
          const isInitial = i === initialActive;
          return (
            <Image
              key={i}
              src={src}
              alt={i === active ? alt : ""}
              width={800}
              height={800}
              data-idx={i}
              loader={isWix ? wixMainLoader : undefined}
              {...(isInitial
                ? { priority: true as const }
                : { loading: "eager" as const, fetchPriority: "low" as const })}
              placeholder="blur"
              blurDataURL={isInitial ? (mainBlur || SHIMMER_BLUR) : SHIMMER_BLUR}
              sizes="(max-width:760px) 100vw, 45vw"
              className={`ghero-layer ${isInitial ? "ghero-base" : ""} ${i === shown ? "is-shown" : ""}`}
              draggable={false}
              onLoad={() => setLoaded((l) => (l[i] ? l : { ...l, [i]: true }))}
            />
          );
        })}
        {waiting && <span className="ghero-spin" aria-hidden />}
        <span className="gmain-zoom" aria-hidden>⤢</span>
      </button>

      {imgs.length > 1 && (
        <div className="gthumbs" role="tablist" aria-label="Fler produktbilder">
          {imgs.slice(0, 12).map((g, i) => (
            <button
              type="button"
              key={g + i}
              className={`gthumb ${i === active ? "active" : ""} ${variantSet.has(i) ? "variant-owned" : ""}`}
              onClick={() => setActive(i)}
              role="tab"
              aria-selected={i === active}
              aria-label={`Visa bild ${i + 1} av ${Math.min(imgs.length, 12)}${variantSet.has(i) ? " (vald variant)" : ""}`}
            >
              <Image src={tightFillUrl(g, 152, 152)} alt="" fill placeholder="blur" blurDataURL={SHIMMER_BLUR} sizes="76px" style={{ objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}

      {/* Prickindikator — ersätter miniatyrgriden på mobil (renare look), klickbar */}
      {imgs.length > 1 && (
        <div className="gdots" role="tablist" aria-label="Bläddra bland produktbilder">
          {imgs.slice(0, 12).map((g, i) => (
            <button
              type="button"
              key={"dot" + i}
              className={`gdot ${i === active ? "active" : ""} ${variantSet.has(i) ? "variant-owned" : ""}`}
              onClick={() => setActive(i)}
              role="tab"
              aria-selected={i === active}
              aria-label={`Visa bild ${i + 1} av ${Math.min(imgs.length, 12)}`}
            />
          ))}
        </div>
      )}

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(false)} role="dialog" aria-modal="true" aria-label={alt}>
          <button className="lb-close" onClick={() => setLightbox(false)} aria-label="Stäng">✕</button>
          {imgs.length > 1 && (
            <button className="lb-nav lb-prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Föregående bild">‹</button>
          )}
          <div
            className={`lb-stage ${view.s > 1 ? "zoomed" : ""}`}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={onStageDown}
            onPointerMove={onStageMove}
            onPointerUp={onStageUp}
            onPointerCancel={onStageCancel}
          >
            <div
              className="lb-imgwrap"
              style={{
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`,
                transition: gesturing ? "none" : "transform .28s cubic-bezier(.2,.7,.2,1)",
              }}
            >
              <Image key={main} src={tightFillUrl(main, 1600, 1600)} alt={alt} fill sizes="92vw" style={{ objectFit: "contain" }} loading="eager" draggable={false} />
            </div>
          </div>
          {imgs.length > 1 && (
            <button className="lb-nav lb-next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Nästa bild">›</button>
          )}
          {imgs.length > 1 && <div className="lb-count">{active + 1} / {imgs.length}</div>}
          <div className="lb-hint" aria-hidden>Nyp för att zooma · svep ned för att stänga</div>
        </div>
      )}
    </div>
  );
}
