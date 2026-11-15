"use client";
// Favoriterna: listan, hjärtat på korten och produktsidan, och knappen i
// sidhuvudet. Lådan med varorna ligger i components/favoriter-lada.tsx och
// hämtas först när sidan är ledig (components/deferred.tsx); den här filen
// går med sidhuvudet till varje sida och ska vara liten.
//
// Reglerna står i lib/favoriter.ts: listan i webbläsaren (`fp_wishlist`),
// kopplingen till medlemskontot och kön med ändringar som inte nått kontot.
// Utloggad skickas ingenting. Inloggad (tecknet `fp_medlem_inne`) frågas
// kontot högst var femte minut, och varje tryck på ett hjärta skickas dit.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { productCountLabel } from "../lib/rating";
import { forvarmFavoriter } from "./favoriter-hamtning";
import {
  FAVORIT_NYCKLAR as N,
  MAX_KO,
  SYNK_MAX_ALDER_MS,
  UTLOGGNING,
  efterSvar,
  gallraInfo,
  giltigFavorit,
  lasInfo,
  lasKo,
  lasLista,
  lasMarkor,
  medInfo,
  synkplan,
  vaxla,
  vidUtloggning,
  type Favoritinfo,
  type Koad,
  type Markor,
} from "../lib/favoriter";

/** Det hjärtat vet om varan när det trycks: namn, bild och pristext som de står på sidan. */
export type Favoritkort = { n?: string; b?: string; p?: string };

type Ctx = {
  /** Produktadresserna, äldst först. */
  lista: string[];
  count: number;
  has: (slug: string) => boolean;
  toggle: (slug: string, kort?: Favoritkort) => void;
  open: boolean;
  setOpen: (b: boolean) => void;
  /** Listan är läst ur webbläsarens minne. */
  redo: boolean;
  /** Besökaren är inloggad (tecknet `fp_medlem_inne`), och kontot har inte nekat. */
  inne: boolean;
  /** "1": listan är kontots. "ut": kunden loggade ut, och kontots lista lämnade enheten. */
  markor: Markor;
  /** Det sparade kortet per favorit. */
  info: Record<string, Favoritinfo>;
  sparaInfo: (kort: Record<string, Favoritkort>) => void;
  /** Stäm av mot kontot om svaret är äldre än så här. */
  synka: (maxAlderMs: number) => void;
};
const C = createContext<Ctx | null>(null);

const minne = {
  las(nyckel: string): string | null {
    try {
      return localStorage.getItem(nyckel);
    } catch {
      return null;
    }
  },
  skriv(nyckel: string, varde: string | null): void {
    try {
      if (varde === null) localStorage.removeItem(nyckel);
      else localStorage.setItem(nyckel, varde);
    } catch {
      // Privat läge eller fullt minne: listan lever då bara på den här sidan.
    }
  },
};

/** Tecknet `fp_medlem_inne` ("1" privat, "f" företag). Ger ingen behörighet: kontots rutter läser sessionen. */
function arInne(): boolean {
  if (typeof document === "undefined") return false;
  return /(?:^|;\s*)fp_medlem_inne=(?:1|f)(?:;|$)/.test(document.cookie);
}

const KONTO = "/api/konto/favoriter";
/** Tryck i snabb följd skickas i ett anrop. */
const SAMLA_MS = 500;

/** Sanningen för avstämningen mot kontot. Komponentens tillstånd är dess spegel för ritningen. */
type Lager = {
  lista: string[];
  ko: Koad[];
  markor: Markor;
  /** När kontot senast svarade, i millisekunder. */
  senast: number;
  info: Record<string, Favoritinfo>;
  pagar: boolean;
  igen: boolean;
  /** Kontot svarade 401 fast tecknet finns: som utloggad resten av sidan. */
  nekad: boolean;
  samla: ReturnType<typeof setTimeout> | undefined;
};

const nyttLager = (): Lager => ({ lista: [], ko: [], markor: null, senast: 0, info: {}, pagar: false, igen: false, nekad: false, samla: undefined });

/** Inte längre kontots kopia: listan står som den är i webbläsaren, och kön och tidsstämpeln nollas. */
function slapp(l: Lager, markor: Markor): void {
  l.ko = [];
  l.markor = markor;
  l.senast = 0;
}

/**
 * Stämmer av mot kontot enligt synkplanen (lib/favoriter.ts): ingenting för
 * en utloggad, annars en läsning eller en sändning av kön. Ett anrop i taget;
 * ett tryck under tiden ställs i kön och skickas när svaret kommit.
 */
async function stamAv(l: Lager, spara: () => void, maxAlderMs: number): Promise<void> {
  if (l.pagar) {
    l.igen = true;
    return;
  }
  const plan = synkplan({ inne: arInne() && !l.nekad, markor: l.markor, lokal: l.lista, ko: l.ko, senastMs: l.senast, nuMs: Date.now(), maxAlderMs });
  if (plan.typ === "lokal" || plan.typ === "vanta") return;
  if (plan.typ === "slapp") {
    // Inloggningen gick ut av sig själv: listan står kvar som en vanlig lista.
    slapp(l, null);
    spara();
    return;
  }
  l.pagar = true;
  const skickade = plan.typ === "skicka" ? l.ko.slice(0, plan.sanda) : [];
  let lyckades = false;
  try {
    const r = await fetch(KONTO, {
      credentials: "same-origin",
      signal: AbortSignal.timeout(15_000),
      ...(plan.typ === "skicka" ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(plan.andring) } : {}),
    });
    if (r.status === 401) {
      // Sessionen gäller inte längre, fast tecknet finns kvar. Listan står
      // kvar som en vanlig lista, som när inloggningen går ut av sig själv.
      l.nekad = true;
      slapp(l, l.markor === "1" ? null : l.markor);
      spara();
      return;
    }
    const svar = r.ok ? ((await r.json().catch(() => null)) as { ok?: boolean; sluggar?: unknown } | null) : null;
    if (svar?.ok && Array.isArray(svar.sluggar)) {
      const e = efterSvar(svar.sluggar, l.ko, skickade);
      l.lista = e.lista;
      l.ko = e.ko;
      l.markor = "1";
      l.senast = Date.now();
      lyckades = true;
      spara();
    }
  } catch {
    // Nätet svarade inte. Kön står kvar till nästa tryck eller nästa sida.
  } finally {
    l.pagar = false;
    const igen = l.igen || (lyckades && l.ko.length > 0);
    l.igen = false;
    if (igen) void stamAv(l, spara, 0);
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [lista, setLista] = useState<string[]>([]);
  const [info, setInfo] = useState<Record<string, Favoritinfo>>({});
  const [open, setOpen] = useState(false);
  const [redo, setRedo] = useState(false);
  const [konto, setKonto] = useState<{ inne: boolean; markor: Markor }>({ inne: false, markor: null });

  const s = useRef<Lager>(nyttLager());

  const spara = useCallback(() => {
    const l = s.current;
    minne.skriv(N.lista, JSON.stringify(l.lista));
    minne.skriv(N.ko, l.ko.length ? JSON.stringify(l.ko) : null);
    minne.skriv(N.konto, l.markor);
    minne.skriv(N.synkad, l.senast ? String(l.senast) : null);
    setLista(l.lista);
    setKonto({ inne: arInne() && !l.nekad, markor: l.markor });
  }, []);

  const synka = useCallback((maxAlderMs: number) => void stamAv(s.current, spara, maxAlderMs), [spara]);

  useEffect(() => {
    const l = s.current;
    l.lista = lasLista(minne.las(N.lista));
    l.ko = lasKo(minne.las(N.ko));
    l.markor = lasMarkor(minne.las(N.konto));
    l.senast = Number(minne.las(N.synkad)) || 0;
    l.info = lasInfo(minne.las(N.info));
    setLista(l.lista);
    setInfo(l.info);
    setKonto({ inne: arInne(), markor: l.markor });
    setRedo(true);

    // Kontot frågas när sidan är ledig, aldrig i vägen för första ritningen.
    const start = () => synka(SYNK_MAX_ALDER_MS);
    const ledig = "requestIdleCallback" in window;
    const id = ledig ? window.requestIdleCallback(start, { timeout: 4000 }) : window.setTimeout(start, 1500);
    // En sida som loggar in utan omladdning säger till (components/konto-lank.tsx).
    const vidKonto = () => {
      l.nekad = false;
      synka(0);
    };
    // En annan flik har ändrat listan: visa samma lista här.
    const vidMinne = (e: StorageEvent) => {
      if (e.key !== N.lista && e.key !== N.konto) return;
      l.lista = lasLista(minne.las(N.lista));
      l.markor = lasMarkor(minne.las(N.konto));
      setLista(l.lista);
      setKonto({ inne: arInne() && !l.nekad, markor: l.markor });
    };
    // Kunden loggar ut (ett formulär; sidan laddas om). Kontots lista lämnar
    // enheten i samma stund och står kvar på kontot.
    const vidUt = (e: SubmitEvent) => {
      const form = e.target instanceof HTMLFormElement ? e.target : null;
      if (!form || new URL(form.action, window.location.href).pathname !== UTLOGGNING) return;
      const ut = vidUtloggning({ markor: l.markor, lokal: l.lista, ko: l.ko });
      l.lista = ut.lista;
      slapp(l, ut.markor);
      clearTimeout(l.samla);
      spara();
    };
    window.addEventListener("fp-konto-andrat", vidKonto);
    window.addEventListener("storage", vidMinne);
    document.addEventListener("submit", vidUt, true);
    return () => {
      if (ledig) window.cancelIdleCallback(id);
      else window.clearTimeout(id);
      window.removeEventListener("fp-konto-andrat", vidKonto);
      window.removeEventListener("storage", vidMinne);
      document.removeEventListener("submit", vidUt, true);
      clearTimeout(l.samla);
    };
  }, [synka, spara]);

  const sparaInfo = useCallback((kort: Record<string, Favoritkort>) => {
    const l = s.current;
    let ny = l.info;
    for (const [slug, k] of Object.entries(kort)) ny = medInfo(ny, slug, k);
    // Bara favoriternas kort sparas, plus dem som just fick ett (ett hjärta som nyss tänts).
    ny = gallraInfo(ny, [...l.lista, ...Object.keys(kort)]);
    l.info = ny;
    minne.skriv(N.info, JSON.stringify(ny));
    setInfo(ny);
  }, []);

  const toggle = useCallback(
    (slug: string, kort?: Favoritkort) => {
      const l = s.current;
      if (!giltigFavorit(slug)) return;
      const fanns = l.lista.includes(slug);
      l.lista = vaxla(l.lista, slug);
      if (arInne() && !l.nekad) {
        l.ko = [...l.ko, { t: fanns ? ("b" as const) : ("l" as const), s: slug }].slice(-MAX_KO);
        clearTimeout(l.samla);
        l.samla = setTimeout(() => synka(0), SAMLA_MS);
      }
      if (!fanns && kort?.n) sparaInfo({ [slug]: kort });
      spara();
    },
    [spara, sparaInfo, synka],
  );

  const has = useCallback((slug: string) => lista.includes(slug), [lista]);
  const value = useMemo<Ctx>(
    () => ({ lista, count: lista.length, has, toggle, open, setOpen, redo, inne: konto.inne, markor: konto.markor, info, sparaInfo, synka }),
    [lista, has, toggle, open, redo, konto, info, sparaInfo, synka],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useWishlist() {
  const c = useContext(C);
  if (!c) throw new Error("useWishlist must be used within WishlistProvider");
  return c;
}

const HJARTA = "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z";

export function HjartIkon({ fylld = false, storlek = 20 }: { fylld?: boolean; storlek?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={storlek} height={storlek} fill={fylld ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={HJARTA} />
    </svg>
  );
}

/**
 * Kortets namn, pris och bild, lästa ur kortet som hjärtat sitter på. Hjärtat
 * får bara adressen som egenskap: en listsida bär redan namnet och priset en
 * gång per kort, och en kopia till hade vuxit med katalogen. Klasserna hålls
 * ihop med kortet av lib/favoriter.test.ts.
 */
function kortUrSidan(knapp: HTMLElement): Favoritkort {
  const kort = knapp.closest(".prod");
  if (!kort) return {};
  const bild = kort.querySelector<HTMLImageElement>("img");
  return {
    n: kort.querySelector(".pname")?.textContent ?? undefined,
    p: kort.querySelector(".pprice-now")?.textContent ?? undefined,
    b: bild?.currentSrc || bild?.src || undefined,
  };
}

/** Trycket: hjärtat växlar, och ett nytänt hjärta sparar varans kort så att lådan har något att visa direkt. */
function useHjarta(slug: string, kort?: Favoritkort) {
  const { has, toggle } = useWishlist();
  const on = has(slug);
  // Ett hjärta som just tänts slår ett slag. Bara efter ett tryck, aldrig när sidan laddas.
  const [nyss, setNyss] = useState(false);
  const tryck = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setNyss(!on);
    toggle(slug, on ? undefined : { ...kortUrSidan(e.currentTarget), ...kort });
  };
  const text = on ? "Ta bort från favoriter" : "Lägg till i favoriter";
  return { on, nyss, tryck, text, slut: () => setNyss(false) };
}

/** Hjärtat på ett produktkort. */
export function WishlistHeart({ slug }: { slug: string }) {
  const h = useHjarta(slug);
  return (
    <button type="button" className={`wl-heart ${h.on ? "on" : ""}`} data-nyss={h.nyss ? "" : undefined} onClick={h.tryck} onAnimationEnd={h.slut} aria-label={h.text} aria-pressed={h.on} title={h.text}>
      <HjartIkon fylld={h.on} />
    </button>
  );
}

/** Hjärtat bredvid köpknappen på produktsidan. Sidan vet varans namn, pris och bild och skickar dem med. */
export function FavoritKnapp({ slug, namn, pris, bild }: { slug: string; namn: string; pris?: string; bild?: string }) {
  const h = useHjarta(slug, { n: namn, ...(pris ? { p: pris } : {}), ...(bild ? { b: bild } : {}) });
  return (
    <button type="button" className={`fav-knapp ${h.on ? "on" : ""}`} data-nyss={h.nyss ? "" : undefined} onClick={h.tryck} onAnimationEnd={h.slut} aria-label={h.text} aria-pressed={h.on} title={h.text}>
      <HjartIkon fylld={h.on} storlek={22} />
    </button>
  );
}

export function WishlistButton() {
  const { count, setOpen, lista } = useWishlist();
  // Lådans rader frågas redan när kunden siktar på knappen (musen över, fingret
  // ner, tangentbordets fokus), så att svaret oftast är framme när lådan glidit in.
  const forvarna = () => forvarmFavoriter(lista);
  return (
    <button className="wl-btn" onClick={() => setOpen(true)} onPointerEnter={forvarna} onPointerDown={forvarna} onFocus={forvarna} aria-label={`Öppna favoriter, ${productCountLabel(count)}`}>
      <HjartIkon />
      {count > 0 && <span className="wl-count">{count}</span>}
    </button>
  );
}
