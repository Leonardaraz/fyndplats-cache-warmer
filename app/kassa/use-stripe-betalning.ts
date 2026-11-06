"use client";

// Betalfältet och adressfältet på /kassa: Stripe.js, Payment Element och
// Address Element (lib/kassa/stripe-klient.ts).
//
// Stripe.js hämtas från js.stripe.com när sidan visas (aldrig från vår server:
// Stripe kräver det för kortuppgifterna, och dess bedrägeriskydd behöver se hela
// besöket). Fälten monteras när korgens summa är känd, utan PaymentIntent;
// beloppet hålls lika med summeringen så att Apple Pay visar rätt belopp.
// Adressfältet står i samma Elements som betalfältet: då ger Stripe Googles
// adressförslag utan egen nyckel, och bekräftelsen tar med leveransadressen.

import { useEffect, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js/pure";
import type { Stripe, StripeAddressElement, StripeAddressElementChangeEvent, StripeElements, StripePaymentElement } from "@stripe/stripe-js";
import { BETALFALT, adressfaltInstallningar, elementsInstallningar, type AdressStart } from "../../lib/kassa/stripe-klient";

export type BetalfaltLage = "av" | "laddar" | "redo" | "fel";

export interface StripeBetalning {
  /** Platsen där betalfältet monteras. */
  plats: React.RefObject<HTMLDivElement | null>;
  lage: BetalfaltLage;
  /** Betalsättet kunden valt i fältet: "klarna", "card", "apple_pay", "google_pay". */
  valt: string | null;
  stripe: React.RefObject<Stripe | null>;
  elements: React.RefObject<StripeElements | null>;
  /** Beloppet fältet visar just nu (öre). */
  visat: React.RefObject<number | null>;
  /** Platsen där adressfältet monteras (steg 2). */
  adressPlats: React.RefObject<HTMLDivElement | null>;
  adressLage: BetalfaltLage;
  adressfalt: React.RefObject<StripeAddressElement | null>;
}

export interface Adresskoppling {
  /** Läses när adressfältet skapas: kundens sparade uppgifter. */
  start: () => AdressStart;
  /** Varje ändring i adressfältet. */
  andrad: (h: StripeAddressElementChangeEvent) => void;
}

export function useStripeBetalning(nyckel: string | null, beloppOre: number | null, adress: Adresskoppling): StripeBetalning {
  const plats = useRef<HTMLDivElement | null>(null);
  const adressPlats = useRef<HTMLDivElement | null>(null);
  const stripe = useRef<Stripe | null>(null);
  const elements = useRef<StripeElements | null>(null);
  const adressfalt = useRef<StripeAddressElement | null>(null);
  const visat = useRef<number | null>(null);
  // Senaste kopplingen: fältens händelser ska alltid nå sidans senaste funktioner.
  const koppling = useRef(adress);
  useEffect(() => {
    koppling.current = adress;
  });
  const [lage, setLage] = useState<BetalfaltLage>(nyckel ? "laddar" : "av");
  const [adressLage, setAdressLage] = useState<BetalfaltLage>(nyckel ? "laddar" : "av");
  const [valt, setValt] = useState<string | null>(null);
  const kant = beloppOre !== null && beloppOre > 0;

  // Monteras en gång, när summan först blir känd.
  useEffect(() => {
    if (!nyckel || !kant || beloppOre === null) return;
    let avbruten = false;
    let falt: StripePaymentElement | null = null;
    let adr: StripeAddressElement | null = null;
    loadStripe(nyckel)
      .then((s) => {
        if (avbruten) return;
        if (!s || !plats.current) {
          setLage("fel");
          setAdressLage("fel");
          return;
        }
        stripe.current = s;
        const e = s.elements(elementsInstallningar(beloppOre));
        elements.current = e;
        visat.current = beloppOre;
        if (adressPlats.current) {
          adr = e.create("address", adressfaltInstallningar(koppling.current.start()));
          adr.on("ready", () => setAdressLage("redo"));
          adr.on("loaderror", () => setAdressLage("fel"));
          adr.on("change", (h) => koppling.current.andrad(h));
          adr.mount(adressPlats.current);
          adressfalt.current = adr;
        }
        falt = e.create("payment", BETALFALT);
        falt.on("ready", () => setLage("redo"));
        falt.on("loaderror", () => setLage("fel"));
        falt.on("change", (h) => setValt(h.value?.type ?? null));
        falt.mount(plats.current);
      })
      .catch(() => {
        if (!avbruten) {
          setLage("fel");
          setAdressLage("fel");
        }
      });
    return () => {
      avbruten = true;
      falt?.destroy();
      adr?.destroy();
      adressfalt.current = null;
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

  return { plats, lage, valt, stripe, elements, visat, adressPlats, adressLage, adressfalt };
}
