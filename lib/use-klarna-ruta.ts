"use client";
// Vilken Klarna-ruta produktsidan ska visa (klarnaRuta i lib/kassa/stripe-klient.ts).
//
// Utan Stripes publika nyckel i bygget finns ingen Stripe-kassa: svaret är
// "osm" direkt, utan någon fråga, och sidan beter sig som före Stripe-kassan.
// Med nyckeln frågar sidan /api/kassa/klarna en gång (delat mellan rutan och
// Klarnas skript) och får null tills svaret kommit. Fel eller inget svar inom
// fyra sekunder ger "statisk": vår rad stämmer i båda kassorna, Klarnas egen
// ruta bara i Wix kassa.

import { useEffect, useState } from "react";
import type { KlarnaRuta } from "./kassa/stripe-klient";

const STRIPE_BYGGD = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

let fraga: Promise<KlarnaRuta> | null = null;

function hamtaRuta(): Promise<KlarnaRuta> {
  fraga ??= fetch("/api/kassa/klarna", { signal: AbortSignal.timeout(4000) })
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { ruta?: unknown } | null): KlarnaRuta => (j?.ruta === "osm" ? "osm" : "statisk"))
    .catch((): KlarnaRuta => "statisk");
  return fraga;
}

export function useKlarnaRuta(): KlarnaRuta | null {
  const [ruta, setRuta] = useState<KlarnaRuta | null>(STRIPE_BYGGD ? null : "osm");
  useEffect(() => {
    if (!STRIPE_BYGGD) return;
    let aktiv = true;
    void hamtaRuta().then((r) => {
      if (aktiv) setRuta(r);
    });
    return () => {
      aktiv = false;
    };
  }, []);
  return ruta;
}
