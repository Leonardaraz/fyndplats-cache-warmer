"use client";
import { useEffect, useRef, useState } from "react";
import { CardGallery } from "./card-gallery";
import { BILDFONSTER_PX } from "../lib/bildfonster";

// ☠️ KORTETS BILDER FINNS BARA NÄRA FÖNSTRET (Leonard 2026-11-25).
//
// "När man scrollar i alla produkter sidan och backar och går in i nya
// produkter o backar craschar det tillslut." Safari på hans iPhone visade
// "Ett problem inträffade flera gånger på /alla-produkter?sortera=new": fliken
// hade dödats, laddats om, och dödats igen.
//
// Listan växer med 24 kort per "Visa fler" och krymper aldrig, och bakåt från
// en vara ritar upp alla korten igen (lib/sidminne.ts). Varje kort bar sin
// bild och en egen rad att svepa i (.pimg-track-swipe: en rullande yta per
// kort, och på en telefon ett eget lager i grafikminnet), hur långt från
// skärmen det än stod. Mätt i Chromium i telefonstorlek mot www samma dag:
// åtta varv "Visa fler" två gånger, in på en vara och bakåt gav 408 kort,
// 426 hämtade bilder, och fliken växte från 295 till 924 MB, ungefär 1,4 MB
// per kort. Efter en krasch laddar Safari om sidan, listan ställde tillbaka
// alla korten på en gång, och fliken dog igen: därav "flera gånger".
//
// Nu bär ett kort i en lista sina bilder bara när det står inom
// BILDFONSTER_PX från fönstret. Kortet självt står kvar med namn, betyg och
// pris, och bildrutan behåller sin höjd (.prod .pimg har aspect-ratio), så
// sidan flyttar sig inte en pixel när bilderna kommer och går. Bilderna
// ligger kvar i webbläsarens cache: när kortet närmar sig fönstret igen ritas
// de därifrån.
//
// EN bevakare för alla kort (IntersectionObserver), inte en per kort och ingen
// lyssnare på rullningen: webbläsaren säger till när ett kort går över
// gränsen, och bara det kortet ritas om.

type Lyssnare = (nara: boolean) => void;
let vakt: IntersectionObserver | null = null;
const lyssnare = new WeakMap<Element, Lyssnare>();

/** Säger till när `el` kommer inom BILDFONSTER_PX från fönstret eller lämnar det. */
function bevaka(el: Element, cb: Lyssnare): () => void {
  // Utan IntersectionObserver (Safari före 12.1) bär alla kort sina bilder, som förut.
  if (typeof IntersectionObserver !== "function") return () => {};
  if (!vakt) {
    vakt = new IntersectionObserver(
      (poster) => { for (const p of poster) lyssnare.get(p.target)?.(p.isIntersecting); },
      { rootMargin: `${BILDFONSTER_PX}px 0px` },
    );
  }
  lyssnare.set(el, cb);
  vakt.observe(el);
  return () => { lyssnare.delete(el); vakt?.unobserve(el); };
}

/**
 * Kortets bilder, när kortet står nära fönstret. `naraForst` är läget innan
 * bevakaren hunnit svara: sant för kort som ritas där kunden står (sidans
 * första kort och en ny omgång "Visa fler"), falskt för kort långt bort när en
 * lång lista ställs tillbaka efter bakåt (components/shopbrowser.tsx).
 */
export function KortBildfonster({ naraForst, ...galleri }: Parameters<typeof CardGallery>[0] & { naraForst: boolean }) {
  const [nara, setNara] = useState(naraForst);
  const vaktRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = vaktRef.current;
    return el ? bevaka(el, setNara) : undefined;
  }, []);
  return (
    <>
      {/* Bevakarens yta: hela bildrutan, alltid kvar (app/globals.css, .pimg-vakt). */}
      <span ref={vaktRef} className="pimg-vakt" aria-hidden="true" />
      {nara && <CardGallery {...galleri} />}
    </>
  );
}
