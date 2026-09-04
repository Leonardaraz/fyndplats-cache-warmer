"use client";
import { useEffect, useRef, useState } from "react";

// Klippet från arenan på /futdaddyh.
//
// TRE SAKER SOM INTE ÄR SJÄLVKLARA:
//
// 1. Filmen hämtas INTE när sidan laddas. src sätts först när rutan syns i
//    fönstret. Klippet ligger under hjälten, så den som tittar på bilden och
//    lämnar sidan betalar aldrig för 670 kB film hen inte såg.
//
// 2. Ingen autoPlay-attribut. React kan inte slå på det i efterhand, och
//    valet beror på prefers-reduced-motion som vi känner först efter
//    hydrering. Vi startar därför med play() i en effekt i stället — tillåtet
//    eftersom klippet är muted + playsInline.
//
// 3. Den som bett om mindre rörelse i sitt operativsystem får en stillbild
//    med spelknapp, inte en loop. Samma hänsyn som @media (prefers-reduced-
//    motion) längst ner i globals.css, fast för något CSS inte kan stoppa.
//
// Ljudspåret är bortklippt vid kodningen. En loop som kan låta är en loop som
// förr eller senare låter i fel läge.

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
        muted
        loop
        playsInline
        controls={!rorelseOk}
        aria-label={etikett}
      />
    </div>
  );
}
