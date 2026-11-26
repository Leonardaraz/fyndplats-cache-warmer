"use client";

// components/fyndfilm.tsx
//
// Fyndauktionens reklamfilm i en skärm (Leonard 2026-11-26). Filmen och dess
// regler står i lib/fyndfilm.ts.
//
// Två lägen:
// - "band": startsidans auktionsband. Skärmen spelar utan ljud och är en del
//   av bandets länk till auktionen. Den är dekor för skärmläsare (aria-hidden):
//   länken har sin egen text.
// - "studio": auktionssidans studio. Skärmen är en knapp, och ett tryck spelar
//   filmen med ljud i ett eget lager över sidan.
//
// Sex saker som inte ska ändras:
// 1. Ingenting hämtas förrän skärmen syns: ingen src i sidan, preload="none",
//    och stillbilden är en vanlig bild. I bandet laddas den lat.
// 2. Skärmen spelar bara utan ljud, bara medan den syns och bara medan fliken
//    syns. Aldrig för den som bett om mindre rörelse eller sparar data: då står
//    stillbilden kvar.
// 3. Filmen tonas in först när den faktiskt spelar ("playing"). Med strömspar
//    på en iPhone spelar den inte alls, och då ska stillbilden stå kvar i
//    stället för en svart ruta.
// 4. Lagret med ljud läggs i sidan (flushSync) INNAN play() anropas, i samma
//    tryck. En iPhone spelar bara ljud när play() kommer direkt ur kundens
//    handling, och en webbläsare får vägra spela en video som inte finns i
//    sidan än (samma regel som produktvideon, se CLAUDE.md).
// 5. Lagret ligger i <body> (createPortal). Inne i studion hade sidhuvudet
//    kunnat lägga sig över stängknappen, och en video med kontroller får inte
//    ligga i en knapp.
// 6. Efter filmens slut (lib/fyndfilm.ts, slutarMs) ritas ingenting, också
//    när sidan legat kvar i en cache: klockan är klientens efter första
//    renderingen (useClientNow), serverns i den.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { type Fyndfilm, filmKallor, filmStillbild, skarmKalla } from "../lib/fyndfilm";
import { langdTal, langdText, valjKalla } from "../lib/produkt-video";
import { prefersDataSaving } from "../lib/gallery-preload";
import { useClientNow } from "./use-client-now";
import s from "./fyndfilm.module.css";

type Lage = "band" | "studio";

/** Skärmens bredd i CSS-pixlar per läge och skärmbredd. Måste stämma med fyndfilm.module.css. */
const SIZES: Record<Lage, string> = {
  band: "(max-width: 600px) 92px, 118px",
  studio: "(max-width: 600px) 96px, (max-width: 900px) 150px, 236px",
};

/** Stillbildens storlekar för srcset. Den största räcker för 236 px på en tät skärm. */
const STILL_BREDDER = [180, 280, 480] as const;

function sparlage(): boolean {
  const n = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
  return prefersDataSaving(n.connection);
}

const ingenRorelse = () =>
  typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function FyndFilm({ film, lage, nuMs }: { film: Fyndfilm; lage: Lage; nuMs: number }) {
  // Minuttakt räcker: filmen slutar på en hel timme.
  const { nowMs } = useClientNow(nuMs, 60_000);
  if (!(nowMs < film.slutarMs)) return null;
  return <Skarm film={film} lage={lage} />;
}

function Skarm({ film, lage }: { film: Fyndfilm; lage: Lage }) {
  const rot = useRef<HTMLElement | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stor = useRef<HTMLVideoElement>(null);
  const stang = useRef<HTMLButtonElement>(null);
  const franTangent = useRef(false);
  const [oppen, setOppen] = useState(false);
  const oppenRef = useRef(false);

  // Skärmen spelar utan ljud när den syns.
  useEffect(() => {
    const v = video.current;
    const r = rot.current;
    if (!v || !r || typeof IntersectionObserver === "undefined") return;
    if (ingenRorelse() || sparlage()) return;
    let synlig = false;
    const spela = () => {
      if (!synlig || document.hidden || oppenRef.current) return;
      if (!v.getAttribute("src")) {
        const k = skarmKalla(filmKallor(film), r.clientWidth * Math.min(2, window.devicePixelRatio || 1));
        if (!k) return;
        v.src = k.url;
      }
      v.play().catch(() => {});
    };
    const io = new IntersectionObserver(
      (poster) => {
        synlig = poster.some((p) => p.isIntersecting);
        if (synlig) spela();
        else v.pause();
      },
      { rootMargin: "80px 0px", threshold: 0.01 },
    );
    io.observe(r);
    const flik = () => (document.hidden ? v.pause() : spela());
    const spelar = () => {
      r.dataset.spelar = "";
    };
    v.addEventListener("playing", spelar);
    document.addEventListener("visibilitychange", flik);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", flik);
      v.removeEventListener("playing", spelar);
      v.pause();
    };
  }, [film]);

  const stangSpelaren = useCallback(() => {
    oppenRef.current = false;
    setOppen(false);
    document.documentElement.style.removeProperty("overflow");
    const v = video.current;
    if (v?.getAttribute("src") && !document.hidden) v.play().catch(() => {});
    if (franTangent.current) rot.current?.focus({ preventScroll: true });
    franTangent.current = false;
  }, []);

  const oppna = useCallback(() => {
    // Lagret finns i sidan när play() anropas, i samma tryck (se sak 4 överst).
    oppenRef.current = true;
    flushSync(() => setOppen(true));
    const v = stor.current;
    if (!v) return;
    video.current?.pause();
    document.documentElement.style.overflow = "hidden";
    const bredd = Math.min(window.innerWidth - 24, ((window.innerHeight - 88) * 9) / 16);
    const k = valjKalla(filmKallor(film), bredd * (window.devicePixelRatio || 1), sparlage());
    if (k) v.src = k.url;
    v.muted = false;
    v.play().catch(() => {
      // Utan ljud hellre än inte alls (en webbläsare som nekar ljud).
      v.muted = true;
      v.play().catch(() => {});
    });
    stang.current?.focus({ preventScroll: true });
  }, [film]);

  // Escape stänger, och Tab stannar i lagret.
  useEffect(() => {
    if (!oppen) return;
    const tangent = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        franTangent.current = true;
        stangSpelaren();
      } else if (e.key === "Tab") {
        const delar = [stang.current, stor.current].filter((d): d is HTMLButtonElement | HTMLVideoElement => !!d);
        const i = delar.indexOf(document.activeElement as HTMLButtonElement | HTMLVideoElement);
        e.preventDefault();
        const nasta = delar[(i + (e.shiftKey ? delar.length - 1 : 1) + delar.length) % delar.length];
        nasta?.focus();
      }
    };
    document.addEventListener("keydown", tangent);
    return () => document.removeEventListener("keydown", tangent);
  }, [oppen, stangSpelaren]);

  // Lämnar kunden sidan med lagret öppet släpps rullningen.
  useEffect(
    () => () => {
      document.documentElement.style.removeProperty("overflow");
    },
    [],
  );

  const still = filmStillbild(film, 280);
  const srcSet = STILL_BREDDER.map((b) => `${filmStillbild(film, b)} ${b}w`).join(", ");
  const skarm = (
    <span className={s.ram}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Wix skalar stillbilden själv; next/image hade lagt en egen omväg. */}
        <img
          className={s.still}
          src={still}
          srcSet={srcSet}
          sizes={SIZES[lage]}
          alt=""
          decoding="async"
          loading={lage === "band" ? "lazy" : "eager"}
          fetchPriority="low"
          width={280}
          height={498}
        />
        <video ref={video} className={s.video} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} />
        <span className={s.glans} aria-hidden="true" />
        {lage === "studio" && (
          <span className={s.spela} aria-hidden="true">
            <svg viewBox="0 0 16 16" width="14" height="14" focusable="false">
              <path d="M5 3.2v9.6a.6.6 0 0 0 .92.5l7.3-4.8a.6.6 0 0 0 0-1L5.92 2.7A.6.6 0 0 0 5 3.2Z" fill="currentColor" />
            </svg>
            <span className={s.spelaText}>Se med ljud</span>
            <span className={s.spelaTid}>{langdText(film.langdSek)}</span>
          </span>
        )}
    </span>
  );

  if (lage === "band") {
    return (
      <span ref={(el) => { rot.current = el; }} className={`${s.skarm} ${s.band} ff-band`} aria-hidden="true">
        {skarm}
      </span>
    );
  }

  return (
    <>
      <button
        ref={(el) => { rot.current = el; }}
        type="button"
        className={`${s.skarm} ${s.studio} ff-studio`}
        aria-label={`${film.namn}. Spela med ljud, ${langdTal(film.langdSek)}`}
        aria-haspopup="dialog"
        onClick={oppna}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") franTangent.current = true;
        }}
      >
        {skarm}
      </button>
      {oppen &&
        createPortal(
          <div
            className={s.spelare}
            role="dialog"
            aria-modal="true"
            aria-label={film.namn}
            onClick={(e) => {
              if (e.target === e.currentTarget) stangSpelaren();
            }}
          >
            <div className={s.spelarRam}>
              <button
                ref={stang}
                type="button"
                className={s.stang}
                onClick={stangSpelaren}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") franTangent.current = true;
                }}
              >
                Stäng
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
              <video
                ref={stor}
                className={s.stor}
                controls
                playsInline
                preload="none"
                poster={filmStillbild(film, 480)}
                onEnded={stangSpelaren}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
