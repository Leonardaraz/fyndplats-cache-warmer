"use client";
// Startsidans köpguider som en rad man bläddrar i: alla inlägg, inte tre.
// Varför bara de första korten ritas från början står i lib/guide-kort.ts.
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { PrefetchLink } from "./prefetch-link";
import { flerKort, GUIDER_FORST, type GuideKort } from "../lib/guide-kort";

export function GuideKarusell({ guider }: { guider: GuideKort[] }) {
  const [antal, setAntal] = useState(Math.min(GUIDER_FORST, guider.length));
  // Var raden står: längst till vänster, och längst till höger om det ritade.
  const [vid, setVid] = useState({ start: true, slut: false });
  const rad = useRef<HTMLDivElement>(null);
  const vantar = useRef(0);

  const mat = useCallback(() => {
    vantar.current = 0;
    const el = rad.current;
    if (!el) return;
    const kvar = el.scrollWidth - el.clientWidth - el.scrollLeft;
    // Fler kort ritas en och en halv radbredd innan de behövs, så att den som
    // sveper aldrig når en kant som inte är slutet.
    if (kvar < el.clientWidth * 1.5) setAntal((n) => flerKort(n, guider.length));
    setVid({ start: el.scrollLeft < 8, slut: kvar < 8 });
  }, [guider.length]);

  // En mätning per bildruta, hur många rullhändelser som än kommer.
  const vidRullning = () => {
    if (!vantar.current) vantar.current = requestAnimationFrame(mat);
  };
  useEffect(() => () => { if (vantar.current) cancelAnimationFrame(vantar.current); }, []);

  const blad = (riktning: 1 | -1) => {
    const el = rad.current;
    if (!el) return;
    // Framåt: rita nästa omgång FÖRST, annars finns det inget att rulla till.
    if (riktning === 1) setAntal((n) => flerKort(n, guider.length));
    const mjukt = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => el.scrollBy({ left: riktning * el.clientWidth * 0.92, behavior: mjukt ? "smooth" : "auto" }));
  };

  const allaRitade = antal >= guider.length;
  return (
    <div className="guide-karusell">
      <div className="guider" ref={rad} onScroll={vidRullning}>
        {guider.slice(0, antal).map((g) => (
          <PrefetchLink className="guide" key={g.slug} href={`/blogg/${g.slug}`}>
            <span className="guide-bild">
              <Image src={g.cover} alt="" fill sizes="(max-width:880px) 78vw, 360px" />
            </span>
            <span className="guide-titel">{g.title}</span>
            {g.excerpt && <span className="guide-text">{g.excerpt}</span>}
          </PrefetchLink>
        ))}
      </div>
      {guider.length > 3 && (
        <>
          <button type="button" className="guide-pil guide-pil-bak" aria-label="Föregående guider" onClick={() => blad(-1)} disabled={vid.start}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button type="button" className="guide-pil guide-pil-fram" aria-label="Fler guider" onClick={() => blad(1)} disabled={vid.slut && allaRitade}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}
    </div>
  );
}
