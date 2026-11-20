"use client";
// Startsidans köpguider som en rad man bläddrar i: alla inlägg, inte tre.
// Sidan bär de första korten; resten hämtas när någon rör raden. Varför står
// i lib/guide-kort.ts.
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import { PrefetchLink } from "./prefetch-link";
import { flerKort, medResten, type GuideKort } from "../lib/guide-kort";
import { tidsgransSignal } from "../lib/tidsgrans-signal";

/** Så länge väntar en bläddring på resten av inläggen innan den rullar ändå. */
const VANTA_PA_RESTEN_MS = 700;

export function GuideKarusell({ guider, totalt }: { guider: GuideKort[]; totalt: number }) {
  // Alla kort vi känner till: sidans egna, och resten när de har hämtats.
  const [alla, setAlla] = useState(guider);
  const [antal, setAntal] = useState(guider.length);
  // Var raden står: längst till vänster, och längst till höger om det ritade.
  const [vid, setVid] = useState({ start: true, slut: false });
  const rad = useRef<HTMLDivElement>(null);
  const kanda = useRef(guider);
  const hamtning = useRef<Promise<void> | null>(null);
  const vantar = useRef(0);
  // Sant när någon har bläddrat. Att bara föra pekaren över raden hämtar
  // resten av inläggen men ritar inga fler kort (och hämtar inga fler omslag).
  const rort = useRef(false);
  const matOm = useRef<() => void>(() => {});

  // Resten av inläggen, EN gång. Startar vid avsikt (pekaren eller fingret når
  // raden), så svaret oftast finns när bläddringen kommer. Faller hämtningen
  // försöker nästa bläddring igen; de ritade korten och "Alla guider" finns kvar.
  const hamta = useCallback((): Promise<void> => {
    if (kanda.current.length >= totalt) return Promise.resolve();
    if (!hamtning.current) {
      hamtning.current = fetch("/api/guider", { signal: tidsgransSignal(15_000) })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((d: unknown) => {
          kanda.current = medResten(guider, d);
          setAlla(kanda.current);
          // Den som redan svept till kanten ska få korten utan att svepa igen.
          if (rort.current) matOm.current();
        })
        .catch(() => { hamtning.current = null; });
    }
    return hamtning.current;
  }, [guider, totalt]);

  const mat = useCallback(() => {
    vantar.current = 0;
    const el = rad.current;
    if (!el) return;
    const kvar = el.scrollWidth - el.clientWidth - el.scrollLeft;
    // Fler kort ritas en och en halv radbredd innan de behövs, så att den som
    // sveper inte når en kant som inte är slutet.
    if (kvar < el.clientWidth * 1.5) {
      setAntal((n) => flerKort(n, kanda.current.length));
      void hamta();
    }
    setVid({ start: el.scrollLeft < 8, slut: kvar < 8 });
  }, [hamta]);

  // En mätning per bildruta, hur många rullhändelser som än kommer.
  const vidRullning = useCallback(() => {
    rort.current = true;
    if (!vantar.current) vantar.current = requestAnimationFrame(mat);
  }, [mat]);
  useEffect(() => { matOm.current = vidRullning; }, [vidRullning]);
  useEffect(() => () => { if (vantar.current) cancelAnimationFrame(vantar.current); }, []);

  const blad = async (riktning: 1 | -1) => {
    const el = rad.current;
    if (!el) return;
    rort.current = true;
    if (riktning === 1) {
      // Framåt: rita nästa omgång FÖRST, annars finns det inget att rulla till.
      await Promise.race([hamta(), new Promise<void>((klar) => setTimeout(klar, VANTA_PA_RESTEN_MS))]);
      flushSync(() => setAntal((n) => flerKort(n, kanda.current.length)));
    }
    const mjukt = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: riktning * el.clientWidth * 0.92, behavior: mjukt ? "smooth" : "auto" });
  };

  const avsikt = () => { void hamta(); };
  // Framåt är slut först när alla inlägg är ritade och raden står längst till höger.
  const slut = vid.slut && antal >= Math.max(totalt, alla.length);
  return (
    <div className="guide-karusell" onPointerEnter={avsikt} onTouchStart={avsikt} onFocus={avsikt}>
      <div className="guider" ref={rad} onScroll={vidRullning}>
        {alla.slice(0, antal).map((g) => (
          <PrefetchLink className="guide" key={g.slug} href={`/blogg/${g.slug}`}>
            <span className="guide-bild">
              <Image src={g.cover} alt="" fill sizes="(max-width:880px) 78vw, 360px" />
            </span>
            <span className="guide-titel">{g.title}</span>
            {g.excerpt && <span className="guide-text">{g.excerpt}</span>}
          </PrefetchLink>
        ))}
      </div>
      {totalt > 3 && (
        <>
          <button type="button" className="guide-pil guide-pil-bak" aria-label="Föregående guider" onClick={() => void blad(-1)} disabled={vid.start}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button type="button" className="guide-pil guide-pil-fram" aria-label="Fler guider" onClick={() => void blad(1)} disabled={slut}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}
    </div>
  );
}
