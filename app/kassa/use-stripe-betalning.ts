"use client";

// Betalfältet, adressfältet och snabbkassan på /kassa: Stripe.js, Payment
// Element, Address Element och Express Checkout Element
// (lib/kassa/stripe-klient.ts, lib/kassa/snabbkassa.ts).
//
// Stripe.js hämtas från js.stripe.com när sidan visas (aldrig från vår server:
// Stripe kräver det för kortuppgifterna, och dess bedrägeriskydd behöver se hela
// besöket). Fälten monteras när korgens summa är känd, utan PaymentIntent;
// beloppet hålls lika med summeringen så att plånböckerna visar rätt belopp.
// Adressfältet står i samma Elements som betalfältet: då ger Stripe Googles
// adressförslag utan egen nyckel, och bekräftelsen tar med leveransadressen.
// Snabbkassans knappar (Apple Pay, Google Pay) står i en EGEN Elements-grupp
// med samma belopp: elements.submit() prövar varje fält i sin grupp, och
// adressfältet och betalfältet är tomma när kunden betalar med plånboken.

import { useEffect, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js/pure";
import type {
  Stripe,
  StripeAddressElement,
  StripeAddressElementChangeEvent,
  StripeElements,
  StripeExpressCheckoutElement,
  StripeExpressCheckoutElementClickEvent,
  StripeExpressCheckoutElementConfirmEvent,
  StripePaymentElement,
} from "@stripe/stripe-js";
import { BETALFALT, RAM_VANTA_MS, adressfaltInstallningar, elementsInstallningar, ramenStilla, type AdressStart } from "../../lib/kassa/stripe-klient";
import { planbocker, snabbknappar, type Planbok, type Sammandrag } from "../../lib/kassa/snabbkassa";

export type BetalfaltLage = "av" | "laddar" | "redo" | "fel";

/** Snabbkassan: "tom" när kunden inte har Apple Pay eller Google Pay i den här webbläsaren. */
export type SnabbLage = "av" | "laddar" | "redo" | "tom" | "fel";

/** Så länge väntar sidan på att Stripe säger vilka plånböcker som finns. */
const SNABB_VANTA_MS = 12_000;

// Stripe.js hämtas en gång per sida och nyckel. Hämtningen startar när kassan
// visas med en varukorg (eller en på väg från Wix), inte först när summan är
// känd: efter en omladdning kommer summan först när varukorgen hämtats från
// Wix, och då startade Stripe 793 i stället för 427 ms efter sidans början och
// betalfältet var klart 0,7 s senare (mätt 2026-11-07). Fälten monteras som
// förut när summan finns. Ett misslyckat försök sparas inte.
const stripeLoften = new Map<string, Promise<Stripe | null>>();
function hamtaStripe(nyckel: string): Promise<Stripe | null> {
  let lofte = stripeLoften.get(nyckel);
  if (!lofte) {
    const nytt = loadStripe(nyckel);
    nytt.catch(() => {
      if (stripeLoften.get(nyckel) === nytt) stripeLoften.delete(nyckel);
    });
    stripeLoften.set(nyckel, nytt);
    lofte = nytt;
  }
  return lofte;
}

export interface StripeBetalning {
  /** Platsen där betalfältet monteras. */
  plats: React.RefObject<HTMLDivElement | null>;
  lage: BetalfaltLage;
  /** Betalsättet kunden valt i fältet: "card" eller "klarna". */
  valt: string | null;
  stripe: React.RefObject<Stripe | null>;
  elements: React.RefObject<StripeElements | null>;
  /** Beloppet fältet visar just nu (öre). */
  visat: React.RefObject<number | null>;
  /** Platsen där adressfältet monteras (steg 2). */
  adressPlats: React.RefObject<HTMLDivElement | null>;
  adressLage: BetalfaltLage;
  adressfalt: React.RefObject<StripeAddressElement | null>;
  /** Platsen där snabbkassans knappar monteras (överst). */
  snabbPlats: React.RefObject<HTMLDivElement | null>;
  snabbLage: SnabbLage;
  /** Plånböckerna knapparna visar. */
  snabbPlanbocker: Planbok[];
  /** Snabbkassans egen Elements-grupp. */
  snabbElements: React.RefObject<StripeElements | null>;
  /** Beloppet knapparna visar just nu (öre). */
  snabbVisat: React.RefObject<number | null>;
}

export interface Adresskoppling {
  /** Läses när adressfältet skapas: kundens sparade uppgifter. */
  start: () => AdressStart;
  /** Varje ändring i adressfältet. */
  andrad: (h: StripeAddressElementChangeEvent) => void;
}

export interface Snabbkoppling {
  /** Läses när knapparna skapas: det summeringen visar. */
  start: () => Sammandrag | null;
  /** Kunden tryckte på en knapp: svara inom en sekund (klickSvar). */
  klick: (h: StripeExpressCheckoutElementClickEvent) => void;
  /** Kunden godkände i bladet (snabbBekrafta). */
  bekrafta: (h: StripeExpressCheckoutElementConfirmEvent) => void;
}

/**
 * Kör klar() när Stripes ram i el står still (ramenStilla), eller efter
 * RAM_VANTA_MS. Adressfältets ram glider från mobilhöjd till fältets höjd efter
 * "ready"; platshållaren står kvar så länge, så att formuläret inte hoppar.
 * Ger en funktion som stänger av väntan.
 */
function narRamenStilla(el: HTMLElement | null, klar: () => void): () => void {
  const ram = el?.querySelector<HTMLElement>(".__PrivateStripeElement") ?? null;
  const hojd = (x: Element | null | undefined) => (x ? x.getBoundingClientRect().height : null);
  const stilla = () => ramenStilla(hojd(ram), hojd(ram?.querySelector("iframe")));
  if (!ram || typeof ResizeObserver === "undefined" || stilla()) {
    klar();
    return () => {};
  }
  let gjort = false;
  let tid = 0;
  const ro = new ResizeObserver(() => {
    if (stilla()) avsluta(true);
  });
  const avsluta = (kor: boolean) => {
    if (gjort) return;
    gjort = true;
    ro.disconnect();
    window.clearTimeout(tid);
    if (kor) klar();
  };
  tid = window.setTimeout(() => avsluta(true), RAM_VANTA_MS);
  ro.observe(ram);
  return () => avsluta(false);
}

/**
 * `korgFinns`: kassan visar en varukorg, eller väntar på en (kakan fp_cart).
 * Då börjar Stripe.js hämtas direkt (hamtaStripe); fälten monteras när
 * `beloppOre` är känd.
 */
export function useStripeBetalning(nyckel: string | null, beloppOre: number | null, adress: Adresskoppling, snabb: Snabbkoppling, korgFinns = false): StripeBetalning {
  const plats = useRef<HTMLDivElement | null>(null);
  const adressPlats = useRef<HTMLDivElement | null>(null);
  const snabbPlats = useRef<HTMLDivElement | null>(null);
  const stripe = useRef<Stripe | null>(null);
  const elements = useRef<StripeElements | null>(null);
  const snabbElements = useRef<StripeElements | null>(null);
  const adressfalt = useRef<StripeAddressElement | null>(null);
  const visat = useRef<number | null>(null);
  const snabbVisat = useRef<number | null>(null);
  // Senaste kopplingarna: fältens händelser ska alltid nå sidans senaste funktioner.
  const koppling = useRef(adress);
  const snabbKoppling = useRef(snabb);
  useEffect(() => {
    koppling.current = adress;
    snabbKoppling.current = snabb;
  });
  const [lage, setLage] = useState<BetalfaltLage>(nyckel ? "laddar" : "av");
  const [adressLage, setAdressLage] = useState<BetalfaltLage>(nyckel ? "laddar" : "av");
  const [snabbLage, setSnabbLage] = useState<SnabbLage>(nyckel ? "laddar" : "av");
  const [snabbPlanbocker, setSnabbPlanbocker] = useState<Planbok[]>([]);
  const [valt, setValt] = useState<string | null>(null);
  const kant = beloppOre !== null && beloppOre > 0;

  // Stripe.js börjar hämtas så fort det finns en varukorg, före summan.
  useEffect(() => {
    if (nyckel && (korgFinns || kant)) hamtaStripe(nyckel).catch(() => {});
  }, [nyckel, korgFinns, kant]);

  // Monteras en gång, när summan först blir känd.
  useEffect(() => {
    if (!nyckel || !kant || beloppOre === null) return;
    let avbruten = false;
    let falt: StripePaymentElement | null = null;
    let adr: StripeAddressElement | null = null;
    let knappar: StripeExpressCheckoutElement | null = null;
    let slutaVanta = () => {};
    hamtaStripe(nyckel)
      .then((s) => {
        if (avbruten) return;
        if (!s || !plats.current) {
          setLage("fel");
          setAdressLage("fel");
          setSnabbLage("fel");
          return;
        }
        stripe.current = s;
        // Butikens typsnitt från vår egen server (elementsInstallningar), så att
        // adressen och kortet står i samma typsnitt som resten av formuläret.
        // Stripe tar bara https (lokalt över http: systemets typsnitt, och en varning).
        const bas = window.location.protocol === "https:" ? window.location.origin : undefined;
        const e = s.elements(elementsInstallningar(beloppOre, bas));
        elements.current = e;
        visat.current = beloppOre;
        if (adressPlats.current) {
          adr = e.create("address", adressfaltInstallningar(koppling.current.start()));
          // "redo" först när Stripes ram glidit till fältets höjd (narRamenStilla).
          adr.on("ready", () => {
            slutaVanta = narRamenStilla(adressPlats.current, () => {
              if (!avbruten) setAdressLage("redo");
            });
          });
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
        // Knapparna sist och för sig: ett fel i snabbkassan (Stripe kastar
        // IntegrationError på ogiltiga val) får aldrig stoppa formuläret och betalfältet.
        if (!snabbPlats.current) {
          setSnabbLage("av");
          return;
        }
        try {
          const g = s.elements(elementsInstallningar(beloppOre));
          snabbElements.current = g;
          snabbVisat.current = beloppOre;
          knappar = g.create("expressCheckout", snabbknappar(snabbKoppling.current.start()));
          knappar.on("ready", (h) => {
            const p = planbocker(h.availablePaymentMethods);
            setSnabbPlanbocker(p);
            setSnabbLage(p.length > 0 ? "redo" : "tom");
          });
          knappar.on("loaderror", () => setSnabbLage("fel"));
          knappar.on("click", (h) => snabbKoppling.current.klick(h));
          knappar.on("confirm", (h) => snabbKoppling.current.bekrafta(h));
          knappar.mount(snabbPlats.current);
        } catch {
          knappar = null;
          snabbElements.current = null;
          snabbVisat.current = null;
          setSnabbLage("fel");
        }
      })
      .catch(() => {
        if (!avbruten) {
          setLage("fel");
          setAdressLage("fel");
          setSnabbLage("fel");
        }
      });
    return () => {
      avbruten = true;
      slutaVanta();
      falt?.destroy();
      adr?.destroy();
      knappar?.destroy();
      adressfalt.current = null;
      elements.current = null;
      snabbElements.current = null;
      visat.current = null;
      snabbVisat.current = null;
    };
    // Bara nyckeln och att summan blivit känd: beloppet uppdateras nedan utan ny montering.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nyckel, kant]);

  // Stripe svarar inte om plånböckerna (blockerat skript, segt nät): snabbkassan
  // döljs i stället för att stå som en tom ruta. Formuläret fungerar som vanligt.
  useEffect(() => {
    if (snabbLage !== "laddar" || !nyckel) return;
    const t = window.setTimeout(() => setSnabbLage((l) => (l === "laddar" ? "tom" : l)), SNABB_VANTA_MS);
    return () => window.clearTimeout(t);
  }, [snabbLage, nyckel]);

  // Summan ändrades (rabattkod, Wix räkning): fälten och knapparna visar det nya beloppet.
  useEffect(() => {
    if (beloppOre === null || beloppOre <= 0) return;
    if (elements.current && visat.current !== beloppOre) {
      elements.current.update({ amount: beloppOre });
      visat.current = beloppOre;
    }
    if (snabbElements.current && snabbVisat.current !== beloppOre) {
      snabbElements.current.update({ amount: beloppOre });
      snabbVisat.current = beloppOre;
    }
  }, [beloppOre]);

  return { plats, lage, valt, stripe, elements, visat, adressPlats, adressLage, adressfalt, snabbPlats, snabbLage, snabbPlanbocker, snabbElements, snabbVisat };
}
