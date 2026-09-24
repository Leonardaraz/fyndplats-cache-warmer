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
// FLER BILDER VID BEHOV. Kortet börjar med de två bilder listan redan bär
// (img + altImg). Första gången någon sveper hämtas resten av galleriet från
// /api/kort-galleri/<slug> och läggs till i raden — högst sex bilder totalt.
// Den som bara scrollar förbi betalar alltså ingenting; en tredje nyckel per
// produkt i listnyttolasten hade gjort bildkartan 40 % större för alla (se
// lib/kort-galleri.ts). Hämtningen sker medan besökaren tittar på bild 2, så
// bild 3 finns oftast på plats innan nästa svep.
//
// Svepet är webbläsarens egen horisontella scroll, inte JS som flyttar bilder.
// Det ger rätt fysik, fungerar inuti länken (en panorering blir aldrig ett
// klick) och kostar ingenting på dator, där raden inte kan scrollas. JS:en
// här räknar bara ut vilken prick som ska vara ifylld och hämtar extrabilderna.

// Delad mellan alla kort och ommonteringar: en produkt hämtas högst en gång
// per sidbesök. Ett misslyckat anrop tas bort så att nästa svep försöker igen.
const extraCache = new Map<string, Promise<string[]>>();
function hamtaExtra(slug: string): Promise<string[]> {
  let p = extraCache.get(slug);
  if (!p) {
    // Tidsgränsen med AbortController + setTimeout, inte AbortSignal.timeout:
    // den senare saknas i Safari före iOS 16 och kastar då synkront — inuti
    // scroll-hanteraren, så varken hämtningen eller prickarna hade uppdaterats.
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), 10000) : 0;
    p = fetch(`/api/kort-galleri/${encodeURIComponent(slug)}`, ctl ? { signal: ctl.signal } : undefined)
      .then((r) => (r.ok ? r.json() : []))
      .finally(() => clearTimeout(timer))
      .then((d: unknown) => (Array.isArray(d) ? d.filter((x): x is string => typeof x === "string") : []))
      .catch(() => {
        extraCache.delete(slug);
        return [] as string[];
      });
    extraCache.set(slug, p);
  }
  return p;
}

export function CardGallery({
  slug,
  img,
  altImg,
  name,
  priority,
}: {
  slug: string;
  img: string;
  altImg?: string;
  name: string;
  priority: boolean;
}) {
  const [aktiv, setAktiv] = useState(0);
  const [extra, setExtra] = useState<string[]>([]);
  const bildruta = useRef(0);
  const begard = useRef(false);
  const spar = useRef<HTMLDivElement>(null);
  const antal = altImg ? 2 + extra.length : 1;

  const begarExtra = () => {
    if (begard.current || !altImg) return;
    begard.current = true;
    try {
      hamtaExtra(slug).then((e) => {
        if (e.length) setExtra(e);
        else begard.current = false;
      });
    } catch {
      begard.current = false; // försök igen vid nästa svep
    }
  };

  // Svepet är ren CSS och fungerar innan sidan hydrerat — men onScroll finns
  // först efter. Hann besökaren svepa på en långsam uppkoppling står raden på
  // bild 2 medan prickarna säger 1. Läs läget en gång när komponenten vaknar.
  useEffect(() => {
    const el = spar.current;
    if (el && el.clientWidth && el.scrollLeft > el.clientWidth / 2) {
      setAktiv(Math.round(el.scrollLeft / el.clientWidth));
      begarExtra();
    }
    return () => { if (bildruta.current) cancelAnimationFrame(bildruta.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const sizes = "(max-width:540px) 100vw, (max-width:900px) 50vw, 25vw";

  // rAF-strypt: scroll fyrar per bildruta, men prickarna behöver bara det
  // senaste värdet en gång per ritning. Första scrollen = besökaren sveper →
  // hämta resten av galleriet.
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    // Prickarna först: går något fel i hämtningen ska de ändå följa med.
    if (!bildruta.current) {
      bildruta.current = requestAnimationFrame(() => {
        bildruta.current = 0;
        const i = el.clientWidth ? Math.round(el.scrollLeft / el.clientWidth) : 0;
        setAktiv((a) => (a === i ? a : i));
      });
    }
    begarExtra();
  };

  return (
    <>
      {/* Hämtningen startar redan när fingret nuddar bilden (touchstart
          fyrar före första scroll-händelsen), så bild 3 hinner
          komma medan besökaren sveper till bild 2. onScroll är reserven. */}
      <div
        ref={spar}
        className={`pimg-track${altImg ? " pimg-track-swipe" : ""}`}
        onScroll={altImg ? onScroll : undefined}
        onTouchStart={altImg ? begarExtra : undefined}
      >
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
        {extra.map((k) => (
          <div className="pimg-slide pimg-slide-extra" key={k}>
            <Image
              className="pimg-extra"
              src={tightFillUrl(k, 600, 600)}
              alt=""
              fill
              sizes={sizes}
              placeholder="blur"
              blurDataURL={SHIMMER_BLUR}
              style={{ objectFit: "cover" }}
            />
          </div>
        ))}
      </div>
      {altImg && (
        <div className="pimg-dots" aria-hidden="true">
          {Array.from({ length: antal }, (_, i) => (
            <span key={i} className={aktiv === i ? "on" : ""} />
          ))}
        </div>
      )}
    </>
  );
}
