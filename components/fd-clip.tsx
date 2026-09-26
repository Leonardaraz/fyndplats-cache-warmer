"use client";
import { useEffect, useRef, useState } from "react";

// Klippet från arenan på /futdaddyh.
//
// FYRA SAKER SOM INTE ÄR SJÄLVKLARA:
//
// 1. Filmen hämtas INTE när sidan laddas. src sätts först när rutan syns i
//    fönstret. Klippet ligger under hjälten, så den som tittar på bilden och
//    lämnar sidan betalar aldrig för 3,7 MB film hen inte såg.
//
// 2. Inget autoPlay-attribut. React kan inte slå på det i efterhand, och
//    valet beror på prefers-reduced-motion som vi känner först efter
//    hydrering. Vi startar därför med play() i en effekt i stället — tillåtet
//    eftersom klippet är muted + playsInline.
//
// 3. Den som bett om mindre rörelse i sitt operativsystem får en stillbild
//    med spelknapp, inte en loop. Samma hänsyn som @media (prefers-reduced-
//    motion) längst ner i globals.css, fast för något CSS inte kan stoppa.
//
// 4. LJUDET FINNS, MEN STARTAR AVSTÄNGT. Det är inte en artighet utan ett
//    krav: ingen webbläsare låter en film spela av sig själv med ljud på.
//    Startade den ljudande skulle den i stället inte starta alls. Knappen
//    ger besökaren valet, och ett klick är den användarhandling som gör
//    avstängningen laglig att häva.

/** Högtalaren i ljudknappen. Två streck när ljudet är på, kryss när det är av. */
function Hogtalare({ pa }: { pa: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      {pa ? (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </>
      ) : (
        <>
          <path d="M22 9l-6 6" />
          <path d="M16 9l6 6" />
        </>
      )}
    </svg>
  );
}

export function FdClip({
  src,
  poster,
  etikett,
}: {
  src: string;
  poster: string;
  etikett: string;
}) {
  const rutan = useRef<HTMLDivElement>(null);
  const filmen = useRef<HTMLVideoElement>(null);
  const [synlig, setSynlig] = useState(false);
  const [rorelseOk, setRorelseOk] = useState(true);
  const [ljud, setLjud] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const las = () => setRorelseOk(!mq.matches);
    las();
    mq.addEventListener("change", las);
    return () => mq.removeEventListener("change", las);
  }, []);

  useEffect(() => {
    const el = rutan.current;
    if (!el || synlig) return;
    // Ingen reserv för webbläsare utan IntersectionObserver: den finns i
    // Safari sedan 12.1 och Chrome sedan 51. En reserv här hade dessutom
    // krävt setState rakt i effekten, vilket eslint stoppar med rätta.
    const io = new IntersectionObserver(
      (traffar) => {
        if (traffar.some((t) => t.isIntersecting)) {
          setSynlig(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [synlig]);

  useEffect(() => {
    if (!synlig || !rorelseOk) return;
    // play() avvisas tyst i vissa lägen (batterisparläge, datasparläge).
    // Då står stillbilden kvar, vilket är ett fullt godtagbart slut.
    filmen.current?.play().catch(() => {});
  }, [synlig, rorelseOk]);

  return (
    <div className="fd-clip-video" ref={rutan}>
      <video
        ref={filmen}
        className="fd-clip-v"
        poster={poster}
        src={synlig ? src : undefined}
        preload="none"
        muted={!ljud}
        loop
        playsInline
        controls={!rorelseOk}
        aria-label={etikett}
      />
      {/* Göms när de inbyggda kontrollerna visas — de har redan en volymknapp,
          och två knappar för samma sak är en knapp för mycket. */}
      {rorelseOk && (
        <button
          type="button"
          className="fd-clip-ljud"
          aria-pressed={ljud}
          aria-label={ljud ? "Stäng av ljudet" : "Slå på ljudet"}
          onClick={() => {
            const el = filmen.current;
            setLjud((f) => !f);
            // Klicket kan ha kommit innan filmen börjat spela (avvisad
            // autostart). Passa på: nu FINNS en användarhandling.
            el?.play().catch(() => {});
          }}
        >
          <Hogtalare pa={ljud} />
        </button>
      )}
    </div>
  );
}
