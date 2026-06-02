"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image, { type ImageLoaderProps } from "next/image";
import { SHIMMER_BLUR } from "../lib/lqip";
import { getCropEntry, wixMediaKey } from "../lib/wix-image";

// LCP-fix (Leonards rapport: hjältebilden låg blank 1–2 s). Huvudbilden gick
// tidigare via Vercels bildoptimerare (/_next/image), som KALLSTARTAR per ny
// bild — första besöket på en produkt fick vänta på att servern optimerade.
// Wix-CDN:n kan själv leverera en exakt-storlek, center-fylld webp via en
// transform-URL (samma mekanism som blur-miniatyren i lib/lqip). Genom att peka
// huvudbildens loader dit hämtas LCP-elementet direkt från Wix globala CDN,
// redan webp och rätt storlek — ingen optimerar-kallstart i kritiska vägen.
// Galleriets huvudbild visas i aspect-ratio:1 med object-fit:cover, så en
// kvadratisk fill (w=h) matchar exakt utan dubbelbeskärning.
// preload + fetchPriority="high" på <Image> ger fortfarande <link rel=preload>
// i <head>, och Next genererar preload-href:en via SAMMA loader → webbläsaren
// förladdar Wix-URL:en direkt, inte optimerar-URL:en.
//
// Tight-crop (2026-06): många källbilder har inbakad vit padding (bilden ligger
// i mitten av ett vit-fält). Vi slår upp media-key:n i en förberäknad cache
// (`lib/wix-image.ts` → `data/image-crops.json`) och bygger en `/v1/crop/x_..,y_..,
// w_..,h_..`-URL i stället för `fill` när vi har tight-crop-data. Då serveras
// hjälte-rutan med innehållsytan ≥85 % av container — i stället för ~60–70 %.
// Saknar bilden tight-crop-data → behåll fill (oförändrat beteende).
function wixMainLoader({ src, width, quality }: ImageLoaderProps): string {
  const key = wixMediaKey(src);
  if (!key) return src; // icke-Wix (ska inte hända för katalogbilder) → orört
  const q = quality || 72;
  const crop = getCropEntry(src);
  if (crop) {
    // Crop-URL: extraherar tight-bbox i original-pixlar. Browsern skalar via
    // <Image fill>+object-fit:cover. Q kan inte sättas på crop-transformer, men
    // /file.webp ger fortfarande webp (Wix CDN re-encoder). Bandbredd: cropped
    // region är typiskt ~70 % av originalbilden i pixlar → ungefär samma byte-
    // budget som dagens fill men med mycket större synlig produkt.
    return `https://static.wixstatic.com/media/${key}/v1/crop/x_${crop.x},y_${crop.y},w_${crop.w},h_${crop.h}/file.webp`;
  }
  // q_72 i stället för 82: hjältebilden var en PNG-sourcad produktbild som
  // komprimerade dåligt → 114 KB webp och ~6 s LCP på 4G (mätt på prod). Vid 72
  // sparas ~25–30 % utan synlig kvalitetsförlust i webp → snabbare första paint.
  return `https://static.wixstatic.com/media/${key}/v1/fill/w_${width},h_${width},al_c,q_${q}/file.webp`;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function Gallery({
  images,
  alt,
  mainBlur,
  active: activeProp,
  onActiveChange,
  eagerCount,
}: {
  images: string[];
  alt: string;
  mainBlur?: string;
  active?: number;
  onActiveChange?: (i: number) => void;
  // Antal bilder från början som ska bakgrundsförladdas efter LCP (variant-
  // bilderna ligger först). Default: alla. Övriga (svep-bara galleriextrabilder,
  // t.ex. instruktioner) mountas lazy vid första visning så vi inte slösar band-
  // bredd på bilder pickern aldrig hoppar till.
  eagerCount?: number;
}) {
  const imgs = images.filter(Boolean);
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
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.client