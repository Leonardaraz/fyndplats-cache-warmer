"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { SHIMMER_BLUR } from "../lib/lqip";
import { tightFillUrl } from "../lib/wix-image";
import { kortDel } from "../lib/kort-galleri";

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
// pekskärm, ur förbyggda delar av katalogen som alla kort på sidan delar
// (/api/kort-galleri/<del>).
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

// ── Hämtning per del ────────────────────────────────────────────────────────
// Delad mellan alla kort. Katalogen ligger i KORT_DELAR förbyggda svar
// (/api/kort-galleri/<del>, se lib/kort-galleri.ts); varje del hämtas högst en
// gång per sidbesök och täcker alla kort som hör till den.
//
// Kallstart: förra versionen frågade efter just sidans produkter, vilket gick
// till en funktion som på en kall instans läste hela katalogen — 47,5 s
// uppmätt. Leonards prickar kom först när han öppnade sidan igen (2026-09-25).
// Delarna är förbyggda och svarar från CDN:en direkt.
//
// NYA PRODUKTER (2026-09-26). En del byggs ur katalogen som den instans som
// byggde den hade, och en produkt som lagts upp efter det saknas i delen —
// Leonard såg bara två bilder per kort när han sorterade på "Nyast". Varje del
// bär därför `_senast`: det högsta createdAt i katalogen den byggdes ur. Ett
// kort som är NYARE än så, och som saknas i delen, hämtar sina extrabilder
// från /api/kort-galleri/nya, som läser produkten direkt från Wix. Ett kort
// som bara saknas i delen utan att vara nyare har helt enkelt inga
// extrabilder — delen utelämnar sådana för att hålla nere storleken.
type Del = { rader: Record<string, unknown>; senast: number };
const delar = new Map<number, Del>();
const pagaende = new Set<number>();
const forsok = new Map<number, number>();
const lyssnare = new Map<string, Set<(k: string[]) => void>>();
const skapad = new Map<string, number>();
const nya = new Map<string, string[]>();
const nyaKo = new Set<string>();
const nyaPagaende = new Set<string>();
let nyaTimer: ReturnType<typeof setTimeout> | null = null;
const TIDSGRANS_MS = 20000;
const OMFORSOK_MS = 3000;
const NYA_PER_ANROP = 12;

const nycklar = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

/** Är kortet nyare än katalogen delen byggdes ur, och saknas i den? */
function arOkandForDelen(slug: string, del: Del): boolean {
  if (slug in del.rader) return false;
  const t = skapad.get(slug) ?? 0;
  return del.senast > 0 && t > del.senast;
}

/** Extrabilderna om de är kända, annars undefined (och hämtningen startas). */
function resultat(slug: string): string[] | undefined {
  const n = nya.get(slug);
  if (n) return n;
  const del = delar.get(kortDel(slug));
  if (!del) return undefined;
  if (arOkandForDelen(slug, del)) {
    begarNy(slug);
    return undefined;
  }
  return nycklar(del.rader[slug]);
}

function meddela(slug: string) {
  const k = resultat(slug);
  if (k) lyssnare.get(slug)?.forEach((cb) => cb(k));
}

function hamta(url: string): Promise<Record<string, unknown>> {
  // AbortController + setTimeout, inte AbortSignal.timeout: den senare saknas i
  // Safari före iOS 16 och kastar då synkront.
  const ctl = typeof AbortController === "function" ? new AbortController() : null;
  const t = ctl ? setTimeout(() => ctl.abort(), TIDSGRANS_MS) : null;
  return fetch(url, ctl ? { signal: ctl.signal } : undefined)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((d: unknown) => (d && typeof d === "object" ? (d as Record<string, unknown>) : {}))
    .finally(() => { if (t) clearTimeout(t); });
}

function hamtaDel(del: number) {
  if (delar.has(del) || pagaende.has(del)) return;
  pagaende.add(del);
  hamta(`/api/kort-galleri/${del}`)
    .then((d) => {
      delar.set(del, { rader: d, senast: Number(d._senast) || 0 });
      for (const slug of lyssnare.keys()) if (kortDel(slug) === del) meddela(slug);
    })
    .catch(() => {
      // Kortet står kvar på två bilder tills vidare. Ett automatiskt omförsök;
      // därefter bara när besökaren rör kortet.
      const n = forsok.get(del) ?? 0;
      forsok.set(del, n + 1);
      if (n < 1) setTimeout(() => hamtaDel(del), OMFORSOK_MS);
    })
    .finally(() => pagaende.delete(del));
}

function begarNy(slug: string) {
  if (nya.has(slug) || nyaPagaende.has(slug) || nyaKo.has(slug)) return;
  nyaKo.add(slug);
  if (!nyaTimer) nyaTimer = setTimeout(skickaNya, 60);
}

function skickaNya() {
  nyaTimer = null;
  const slugs = [...nyaKo].slice(0, NYA_PER_ANROP);
  slugs.forEach((s) => { nyaKo.delete(s); nyaPagaende.add(s); });
  if (nyaKo.size) nyaTimer = setTimeout(skickaNya, 0);
  if (!slugs.length) return;
  hamta(`/api/kort-galleri/nya?s=${slugs.map(encodeURIComponent).join(",")}`)
    .then((d) => {
      for (const s of slugs) {
        nya.set(s, nycklar(d[s]));
        meddela(s);
      }
    })
    // Misslyckas det står kortet på sina två bilder. Inget omförsök här: det
    // är ovanligt, och nästa sidladdning försöker igen.
    .catch(() => { for (const s of slugs) nya.set(s, []); })
    .finally(() => slugs.forEach((s) => nyaPagaende.delete(s)));
}

const begar = (slug: string) => hamtaDel(kortDel(slug));

function prenumerera(slug: string, cb: (k: string[]) => void, createdAt?: number): () => void {
  if (createdAt) skapad.set(slug, createdAt);
  const k = resultat(slug);
  if (k) cb(k);
  let set = lyssnare.get(slug);
  if (!set) { set = new Set(); lyssnare.set(slug, set); }
  set.add(cb);
  return () => {
    set!.delete(cb);
    if (!set!.size) lyssnare.delete(slug);
  };
}

const arPekskarm = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(hover: none)").matches;

export function CardGallery({
  slug,
  img,
  altImg,
  name,
  priority,
  createdAt,
}: {
  slug: string;
  img: string;
  altImg?: string;
  name: string;
  priority: boolean;
  /** Produktens createdAt (Wix numericId) — avgör om delen kan känna till den. */
  createdAt?: number;
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
    }, createdAt);
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
  }, [slug, altImg, createdAt]);

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
