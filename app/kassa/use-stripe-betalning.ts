"use client";

// Betalfältet på /kassa: Stripe.js och Payment Element (lib/kassa/stripe-klient.ts).
//
// Stripe.js hämtas från js.stripe.com när sidan visas (aldrig från vår server:
// Stripe kräver det för kortuppgifterna, och dess bedrägeriskydd behöver se hela
// besöket). Fältet monteras när korgens summa är känd, utan PaymentIntent;
// beloppet hålls lika med summeringen så att Apple Pay visar rätt belopp.

import { useEffect, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js/pure";
import type { Stripe, StripeElements, StripePaymentElement } from "@stripe/stripe-js";
import { BETALFALT, elementsInstallningar } from "../../lib/kassa/stripe-klient";

export type BetalfaltLage = "av" | "laddar" | "redo" | "fel";

export interface StripeBetalning {
  /** Platsen där fältet monteras. */
  plats: React.RefObject<HTMLDivElement | null>;
  lage: BetalfaltLage;
  /** Betalsättet kunden valt i fältet: "klarna", "card", "apple_pay", "google_pay". */
  valt: string | null;
  stripe: React.RefObject<Stripe | null>;
  elements: React.RefObject<StripeElements | null>;
  /** Beloppet fältet visar just nu (öre). */
  visat: React.RefObject<number | null>;
}

export function useStripeBetalning(nyckel: string | null, beloppOre: number | null): StripeBetalning {
  const plats = useRef<HTMLDivElement | null>(null);
  const stripe = useRef<Stripe | null>(null);
  const elements = useRef<StripeElements | null>(null);
  const visat = useRef<number | null>(null);
  const [lage, setLage] = useState<BetalfaltLage>(nyckel ? "laddar" : "av");
  const [valt, setValt] = useState<string | null>(null);
  const kant = beloppOre !== null && beloppOre > 0;

  // Monteras en gång, när summan först blir känd.
  useEffect(() => {
    if (!nyckel || !kant || beloppOre === null) return;
    let avbruten = false;
    let falt: StripePaymentElement | null = null;
    loadStripe(nyckel)
      .then((s) => {
        if (avbruten) return;
        if (!s || !plats.current) {
          setLage("fel");
          return;
        }
        stripe.current = s;
        const e = s.elements(elementsInstallningar(beloppOre));
        elements.current = e;
        visat.current = beloppOre;
        falt = e.create("payment", BETALFALT);
        falt.on("ready", () => setLage("redo"));
        falt.on("loaderror", () => setLage("fel"));
        falt.on("change", (h) => setValt(h.value?.type ?? null));
        falt.mount(plats.current);
      })
      .catch(() => {
        if (!avbruten) setLage("fel");
      });
    return () => {
      avbruten = true;
      falt?.destroy();
      elements.current = null;
      visat.current = null;
    };
    // Bara nyckeln och att summan blivit känd: beloppet uppdateras nedan utan ny montering.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nyckel, kant]);

  // Summan ändrades (rabattkod, Wix räkning): fältet visar det nya beloppet.
  useEffect(() => {
    if (!elements.current || beloppOre === null || beloppOre <= 0 || visat.current === beloppOre) return;
    elements.current.update({ amount: beloppOre });
    visat.current = beloppOre;
  }, [beloppOre]);

  return { plats, lage, valt, stripe, elements, visat };
}
