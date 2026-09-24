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
// vid beröring — och sedan fastnade den där. Nu är bilderna en rad med
// scroll-snap på enheter utan hovrande pekare: man sveper, prickarna visar var
// man är, och ett tryck går till produkten som förut.
//
// FLER BILDER, HÄMTADE I FÖRVÄG — MEN ALDRIG MITT I ETT SVEP.
// Kortet börjar med de två bilder listan redan bär (img + altImg). Resten av
// galleriet (högst sex bilder totalt) hämtas så fort kortet visas på en
// pekskärm, samlat för alla kort som ritas samtidigt: EN förfrågan till
// /api/kort-galleri för 24 kort, inte en per kort.
//
// Första versionen hämtade per kort vid första svepet. På Leonards iPhone kom
// bilderna sent, och raden byggdes om mitt i gesten så att svepet studsade
// tillbaka — han fick svepa två gånger på varje ny produkt. Nu ligger bilderna
// oftast på plats innan någon hinner röra kortet, och kommer de ändå under en
// pågående gest läggs de till först när fingret släppt och raden stannat.
//
// Svepet är webbläsarens egen horisontella scroll, inte JS som flyttar bilder:
// rätt fysik, fungerar inuti länken (en panorering blir aldrig ett klick) och
// kostar ingenting på dator, där raden inte kan scrollas och inget hämtas.

// ── Samlad hämtning ─────────────────────────────────────────────────────────
// Delad mellan alla kort: varje produkt hämtas högst en gång per sidbesök.
const klara = new Map<string, string[]>();
const lyssnare = new Map<string, Set<(k: string[]) => void>>();
const ko = new Set<string>();
const pagaende = new Set<string>();
let koTimer: ReturnType<typeof setTimeout> | null = null;
const MAX_PER_ANROP = 48;

function skickaKon() {
  koTimer = null;
  const slugs = [...ko].slice(0, MAX_PER_ANROP);
  slugs.forEach((s) => { ko.delete(s); pagaende.add(s); });
  if (ko.size) koTimer = setTimeout(skickaKon, 0); // resten i nästa anrop
  if (!slugs.length) return;
  // AbortController + setTimeout, inte AbortSignal.timeout: den senare saknas i
  // Safari före iOS 16 och kastar då synkront.
  const ctl = typeof AbortController === "function" ? new AbortController() : null;
  const t = ctl ? setTimeout(() => ctl.abort(), 10000) : null;
  fetch(`/api/kort-galleri?s=${slugs.map(encodeURIComponent).join(",")}`, ctl ? { signal: ctl.signal } : undefined)
    .then((r) => (r.ok ? r.json() : {}))
    .then((d: Record<string, unknown>) => {
      for (const s of slugs) {
        const v = d?.[s];
        const k = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
        klara.set(s, k);
        lyssnare.get(s)?.forEach((cb) => cb(k));
      }
    })
    .catch(() => { /* kortet står kvar på två bilder; nästa beröring försöker igen */ })
    .finally(() => {
      if (t) clearTimeout(t);
      slugs.forEach((s) => pagaende.delete(s));
    });
}

function begar(slug: string) {
  if (klara.has(slug) || pagaende.has(slug) || ko.has(slug)) return;
  ko.add(slug);
  // Kort som ritas i samma omgång samlas i samma anrop.
  if (!koTimer) koTimer = setTimeout(skickaKon, 60);
}

function prenumerera(slug: string, cb: (k: string[]) => void): () => void {
  const k = klara.get(slug);
  if (k) cb(k);
  let set = lyssnare.get(slug);
  if (!set) { set = new Set(); lyssnare.set(slug, set); }
  set.add(cb);
  return () => { set!.delete(cb); };
}

const arPekskarm = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(hover: none)").matches;

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
  const spar = useRef<HTMLDivElement>(null);
  // Gest pågår: fingret ligger på raden, eller raden rörde sig nyss.
  const ror = useRef(false);
  const senasteScroll = useRef(0);
  const vantande = useRef<string[] | null>(null);
  const antal = altImg ? 2 + extra.length : 1;

  useEffect(() => {
    if (!altImg || !arPekskarm()) return;
    let vantaTimer: ReturnType<typeof setTimeout> | null = null;
    // Lägg till extrabilderna först när gesten är över — en rad som byggs om
    // under fingret får svepet att studsa tillbaka.
    const tillampa = () => {
      vantaTimer = null;
      const k = vantande.current;
      if (!k) return;
      if (ror.current || Date.now() - senasteScroll.current < 250) {
        vantaTimer = setTimeout(tillampa, 150);
        return;
      }
      vantande.current = null;
      setExtra(k);
    };
    const av = prenumerera(slug, (k) => {
      if (!k.length) return;
      vantande.current = k;
      tillampa();
    });
    begar(slug);
    // Svepte besökaren innan sidan hydrerat står raden kanske redan på bild 2.
    const el = spar.current;
    if (el && el.clientWidth && el.scrollLeft > el.clientWidth / 2) {
      setAktiv(Math.round(el.scrollLeft / el.clientWidth));
    }
    return () => {
      av();
      if (vantaTimer) clearTimeout(vantaTimer);
      if (bildruta.current) cancelAnimationFrame(bildruta.current);
    };
  }, [slug, altImg]);

  const sizes = "(max-width:540px) 100vw, (max-width:900px) 50vw, 25vw";

  // rAF-strypt: scroll fyrar per bildruta, men prickarna behöver bara det
  // senaste värdet en gång per ritning.
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    senasteScroll.current = Date.now();
    if (bildruta.current) return;
    bildruta.current = requestAnimationFrame(() => {
      bildruta.current = 0;
      const i = el.clientWidth ? Math.round(el.scrollLeft / el.clientWidth) : 0;
      setAktiv((a) => (a === i ? a : i));
    });
  };
  const onTouchStart = () => {
    ror.current = true;
    begar(slug); // om den tidiga hämtningen misslyckades
  };
  const onTouchEnd = () => {
    ror.current = false;
  };

  return (
    <>
      <div
        ref={spar}
        className={`pimg-track${altImg ? " pimg-track-swipe" : ""}`}
        onScroll={altImg ? onScroll : undefined}
        onTouchStart={altImg ? onTouchStart : undefined}
        onTouchEnd={altImg ? onTouchEnd : undefined}
        onTouchCancel={altImg ? onTouchEnd : undefined}
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
        {/* Rutorna finns direkt (prickarna stämmer och raden byggs aldrig om
            under fingret), men själva bilden laddas först när besökaren står
            på bilden före. Annars hade 24 kort × fyra extrabilder betytt
            nästan hundra bildnedladdningar per sida. */}
        {extra.map((k, i) => (
          <div className="pimg-slide pimg-slide-extra" key={k}>
            {i + 2 <= aktiv + 1 && <Image
              className="pimg-extra"
              src={tightFillUrl(k, 600, 600)}
              alt=""
              fill
              sizes={sizes}
              placeholder="blur"
              blurDataURL={SHIMMER_BLUR}
              style={{ objectFit: "cover" }}
            />}
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
