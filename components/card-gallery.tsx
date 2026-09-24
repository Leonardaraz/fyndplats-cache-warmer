"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { SHIMMER_BLUR } from "../lib/lqip";
import { tightFillUrl } from "../lib/wix-image";

// Produktkortets bilder: en rad bilder man sveper mellan på pekskärm, och
// hover-växlingen på dator.
//
// VARFÖR (Leonard 2026-09-24, med Ur&Penns mobilsajt som förebild): på mobil
// växlade kortet till den andra bilden när fingret rörde det — iOS fyrar :hover
// vid beröring — och sedan fastnade den där. Man kunde inte gå tillbaka och
// inte se bilderna i sin egen takt. Nu är bilderna en rad med scroll-snap på
// enheter utan hovrande pekare: man sveper, prickarna visar var man är, och
// ett tryck går till produkten som förut.
//
// SAMMA TVÅ BILDER SOM FÖRUT, med flit. Kortet får img + altImg från
// listnyttolasten (lib/products.ts forClient) och bildkartan
// (/api/kort-bilder). En tredje bild vore en ny nyckel per produkt i båda —
// värd att göra först när kostnaden är mätt, inte i förbifarten.
//
// Svepet är webbläsarens egen horisontella scroll, inte JS som flyttar bilder.
// Det ger rätt fysik, fungerar inuti länken (en panorering blir aldrig ett
// klick) och kostar ingenting på dator, där raden inte kan scrollas. JS:en
// här räknar bara ut vilken prick som ska vara ifylld.
export function CardGallery({
  img,
  altImg,
  name,
  priority,
}: {
  img: string;
  altImg?: string;
  name: string;
  priority: boolean;
}) {
  const [aktiv, setAktiv] = useState(0);
  const bildruta = useRef(0);
  const spar = useRef<HTMLDivElement>(null);

  // Svepet är ren CSS och fungerar innan sidan hydrerat — men onScroll finns
  // först efter. Hann besökaren svepa på en långsam uppkoppling står raden på
  // bild 2 medan prickarna säger 1. Läs läget en gång när komponenten vaknar.
  useEffect(() => {
    const el = spar.current;
    if (el && el.clientWidth && el.scrollLeft > el.clientWidth / 2) setAktiv(1);
    return () => { if (bildruta.current) cancelAnimationFrame(bildruta.current); };
  }, []);
  const sizes = "(max-width:540px) 100vw, (max-width:900px) 50vw, 25vw";

  // rAF-strypt: scroll fyrar per bildruta, men prickarna behöver bara det
  // senaste värdet en gång per ritning.
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (bildruta.current) return;
    bildruta.current = requestAnimationFrame(() => {
      bildruta.current = 0;
      const i = el.clientWidth ? Math.round(el.scrollLeft / el.clientWidth) : 0;
      setAktiv((a) => (a === i ? a : i));
    });
  };

  return (
    <>
      <div ref={spar} className={`pimg-track${altImg ? " pimg-track-swipe" : ""}`} onScroll={altImg ? onScroll : undefined}>
        <div className="pimg-slide">
          <Image
            className="pimg-main"
            src={tightFillUrl(img, 600, 600)}
            alt={name}
            fill
            priority={priority}
            sizes={sizes}
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR}
            style={{ objectFit: "cover" }}
          />
        </div>
        {altImg && (
          <div className="pimg-slide">
            <Image
              className="pimg-alt"
              src={tightFillUrl(altImg, 600, 600)}
              // Dekorativ: samma länk visar redan huvudbilden med alt={name} och
              // produktnamnet som text. Med alt här läste skärmläsare namnet två
              // gånger per kort. Tom alt = hoppa över dubbletten.
              alt=""
              fill
              sizes={sizes}
              style={{ objectFit: "cover" }}
            />
          </div>
        )}
      </div>
      {altImg && (
        <div className="pimg-dots" aria-hidden="true">
          <span className={aktiv === 0 ? "on" : ""} />
          <span className={aktiv === 1 ? "on" : ""} />
        </div>
      )}
    </>
  );
}
