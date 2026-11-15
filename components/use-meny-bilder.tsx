"use client";
// Menyns bilder, hämtade i webbläsaren från /api/meny-bilder (varför: se rutten).
//
// EN hämtning per sidvisning, delad av datorns meny och mobilens. Den startar
// när någon rör menyn (hamtaMenyBilder), eller när sidan har laddat klart och
// webbläsaren är ledig (forvarmMenyBilder): då är bilderna oftast framme innan
// panelen öppnas, och de tävlar aldrig med sidans egna bilder om nätet.
// Svaret är CDN-cachat och sparas i webbläsaren en timme, så nästa sida får
// det utan nätet. Faller hämtningen visas menyn utan bilder; länkarna fungerar.

import { useSyncExternalStore, type SyntheticEvent } from "react";
import { menyBildSrcSet } from "../lib/meny-bilder";

export type MenyBildsvar = {
  /** Kategorislug → produktbild (kvadrat, 112 px). */
  bilder: Record<string, string>;
  /** Avdelningsslug → miljöfoto i rå form (lib/meny-bilder.ts hjalteAdress). */
  hjaltar: Record<string, string>;
};

const TOMT: MenyBildsvar = { bilder: {}, hjaltar: {} };
let lofte: Promise<MenyBildsvar> | null = null;
let svar: MenyBildsvar | null = null;
const lyssnare = new Set<() => void>();

function tolka(b: unknown): MenyBildsvar {
  const o = (b && typeof b === "object" ? b : {}) as { bilder?: unknown; hjaltar?: unknown };
  const karta = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, string>) : {});
  return { bilder: karta(o.bilder), hjaltar: karta(o.hjaltar) };
}

/** Startar hämtningen (en gång per sidvisning) och ger svaret. */
export function hamtaMenyBilder(): Promise<MenyBildsvar> {
  lofte ??= fetch("/api/meny-bilder")
    .then((r) => (r.ok ? r.json() : TOMT))
    .then(tolka)
    .catch(() => TOMT)
    .then((s) => {
      svar = s;
      for (const f of lyssnare) f();
      return s;
    });
  return lofte;
}

/**
 * Hämtar när sidan har laddat klart (load) och webbläsaren sedan är ledig, så
 * att panelen har sina bilder när den öppnas. Förut startade hämtningen vid
 * första lediga stund, 0,7–1,6 s in i laddningen, och listan och mobilens
 * tretton miniatyrer tävlade då med sidans största bild på ett långsamt nät
 * (Lighthouse mobil 2026-11-15: produktsidans LCP cirka 300 ms sämre än www).
 */
export function forvarmMenyBilder(): () => void {
  if (typeof window === "undefined" || svar || lofte) return () => {};
  const ledig = "requestIdleCallback" in window;
  let id: number | undefined;
  const starta = () => {
    id = ledig
      ? window.requestIdleCallback(() => void hamtaMenyBilder(), { timeout: 5000 })
      : window.setTimeout(() => void hamtaMenyBilder(), 2500);
  };
  if (document.readyState === "complete") starta();
  else window.addEventListener("load", starta, { once: true });
  return () => {
    window.removeEventListener("load", starta);
    if (id === undefined) return;
    if (ledig) window.cancelIdleCallback(id);
    else window.clearTimeout(id);
  };
}

function prenumerera(f: () => void): () => void {
  lyssnare.add(f);
  return () => {
    lyssnare.delete(f);
  };
}

/** Bilderna, eller null tills svaret kommit. Startar ingen hämtning själv. */
export function useMenyBilder(): MenyBildsvar | null {
  // Servern har aldrig bilderna: sidans HTML ritas utan dem (se rutten).
  return useSyncExternalStore(prenumerera, () => svar, () => null);
}

// Bilden tonas in när den laddats (img[data-ok] i globals.css). Attributet
// sätts direkt på bilden: en ny adress ger en ny bild (key), som tonas in för
// sig. En bild ur webbläsarens cache kan vara klar innan React satt onLoad.
const visa = (e: SyntheticEvent<HTMLImageElement>) => e.currentTarget.setAttribute("data-ok", "");
const visaOmKlar = (img: HTMLImageElement | null) => {
  if (img?.complete && img.naturalWidth > 0) img.setAttribute("data-ok", "");
};

/**
 * En menybild: en fast ruta (ingen layoutförskjutning när bilden kommer) som
 * tonar in bilden när den laddats. Bilden är prydnad, namnet står bredvid, så
 * alt är tomt och rutan dold för skärmläsare.
 */
export function MenyBild({ src, klass = "mn-bild", lat = true }: { src?: string; klass?: string; lat?: boolean }) {
  return (
    <span className={klass} aria-hidden="true">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- färdig storlek från Wix CDN, ingen optimerare behövs
        <img
          key={src}
          ref={visaOmKlar}
          src={src}
          srcSet={menyBildSrcSet(src)}
          alt=""
          width={56}
          height={56}
          loading={lat ? "lazy" : "eager"}
          decoding="async"
          onLoad={visa}
        />
      ) : null}
    </span>
  );
}
