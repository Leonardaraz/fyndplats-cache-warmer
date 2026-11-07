"use client";

// Vår egen kassa: kontakt, leverans, betalning och summering på
// www.fyndplats.se. Två sätt att betala, valda av page.tsx:
//   • Stripe (när nycklarna finns, Leonards val 2026-11-06): överst
//     snabbkassan med Apple Pay och Google Pay, där plånboken ger namn, e-post,
//     telefon och adress (lib/kassa/snabbkassa.ts). Annars formuläret och
//     betalfältet i steg 3, med kort och Klarna (i den ordningen:
//     betaltjänstlagen, se BETALFALT). Kunden skriver sina uppgifter EN gång;
//     de följer med till Klarna.
//     Flödet: lib/kassa/stripe-klient.ts och lib/kassa/flode.ts.
//   • Annars Wix betalsida (Order Payment Request), som beskrivs nedan.
// Skälet till kassan är att Wix
// mobilkassa hoppade och lämnade tomrum på iPhone (2026-11-05), så sidan är
// byggd för att aldrig flytta det kunden skriver i:
//   • fälten har 16 px text (iPhone zoomar annars in när ett fält får fokus);
//   • inget ovanför fälten växer medan kunden skriver: summeringen i mobil är
//     stängd tills kunden öppnar den, och felrader har sin plats reserverad;
//   • knappen står sist i formuläret, i sidans eget flöde.
//
// Premiumkassan (Leonard 2026-11-06, "allt visuellt premium"): eget sidhuvud
// och egen sidfot utan butikens meny (kassa-ram.tsx), flytande etiketter som i
// betalfältet, en bock när ett fält är rätt ifyllt, "Menade du …@gmail.com?"
// (lib/kassa/epost-forslag.ts), c/o bakom en länk, summeringen med varianter
// och "Ändra", och "Spara mina uppgifter" som kunden själv väljer. Inget av det
// flyttar fälten medan kunden skriver: ett fel som rättas lämnar sin rad kvar
// (tom) tills nästa tryck.
//
// Wix betalsida har ingen väg tillbaka hit. Ordern som väntar på betalning
// sparas därför i sessionStorage, och när kunden kommer tillbaka (bakåtknappen
// eller en ny flik) frågar sidan om den är betald och går då till /tack. Är den
// inte betald visar sidan en länk till betalningen bara när servern sagt att
// länken fungerar (status `betalbar`): en makulerad Wix-länk visar bara "Det
// gick inte att öppna länken" (Leonards iPhone 2026-11-06).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { preconnect, prefetchDNS } from "react-dom";
import { useCart, liImageUrl } from "../../components/cart";
import { lastKorgStammer } from "../../lib/kassa/lastkorg";
import { PaymentMarks } from "../../components/payment-marks";
import { GoogleG } from "../../components/google-g";
import { tightFillUrl } from "../../lib/wix-image";
import { valdaAlternativ } from "../../lib/cart-shape";
import { DELIVERY_MAX_DAYS, DELIVERY_MIN_DAYS, DELIVERY_TIME, FREE_SHIPPING_FROM_KR, fraktKr } from "../../lib/shipping";
import { leveransIntervall } from "../../lib/leveransdatum";
import { ADRESS_FALT, LAN, adressFranStripe, faltGiltigt, forstaFel, kundFranPlanbok, lanFranPostnr, provaKassa, normalPostnr, normalTelefon, snyggtTelefon, type Falt } from "../../lib/kassa/formular";
import { visaTomKorg } from "../../lib/kassa/vy";
import { epostForslag } from "../../lib/kassa/epost-forslag";
import {
  RETUR_SOKVAG,
  STRIPE_NYCKEL,
  betalfelText,
  fragaKlar,
  klarBeslut,
  sparadAvsikt,
  stripeMeddelande,
  vantaPaOrder,
} from "../../lib/kassa/stripe-klient";
import { klickSvar, planbokNamn, planbokTrolig, snabbBekrafta, type Sammandrag } from "../../lib/kassa/snabbkassa";
import type { StripeAddressElementChangeEvent, StripeExpressCheckoutElementClickEvent, StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
import { useStripeBetalning } from "./use-stripe-betalning";
import { KassaFot, KassaHuvud, Las } from "./kassa-ram";
import s from "./kassa.module.css";

type Varden = Record<"epost" | "fornamn" | "efternamn" | "telefon" | "gata" | "rad2" | "co" | "postnr" | "ort" | "lan", string>;
const TOMT: Varden = { epost: "", fornamn: "", efternamn: "", telefon: "", gata: "", rad2: "", co: "", postnr: "", ort: "", lan: "" };

interface Summa {
  delsummaOre: number | null;
  rabattOre: number;
  fraktOre: number | null;
  totalOre: number | null;
  momsOre: number | null;
  fraktnamn: string | null;
  kupong: string | null;
}

/** En rad i varukorgen som CartProvider normaliserar den (lib/cart-shape.ts). */
interface KorgRadVy {
  _id?: string;
  productName?: { original?: string } | string;
  image?: unknown;
  price?: { amount?: string; formattedAmount?: string };
  quantity?: number;
}

interface Vantar {
  orderId: string;
  betalningId: string;
  cartId: string;
  url: string;
  at: number;
}

/** En betalning som servern sagt går att öppna: länken och när reservationen går ut. */
interface Betalbar {
  url: string;
  utgar: string | null;
}

const ADRESS_NYCKEL = "fp_kassa_adress";
const VANTAR_NYCKEL = "fp_kassa_vantar";

/** Stegen i väntan på Wix betalsida. Servern tar 1–4 s, Wix sida ytterligare några. */
const STEG = ["Kontrollerar pris och lager", "Reserverar dina varor", "Öppnar säker betalning"] as const;

/** Stegen med Stripe: korgen och betalningen förbereds, kunden godkänner, ordern skapas. */
const stripeSteg = (valt: string | null) =>
  ["Kontrollerar pris och lager", valt === "klarna" ? "Öppnar Klarna" : "Godkänner betalningen", "Skapar din order"] as const;

/** "14:05" i svensk tid. */
const klockslag = (iso: string | null): string | null => {
  const t = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t)) return null;
  return new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm" }).format(t);
};

function kr(ore: number | null | undefined): string {
  if (ore === null || ore === undefined || !Number.isFinite(ore)) return "–";
  const hela = Math.floor(Math.abs(ore) / 100);
  const oren = Math.abs(ore) % 100;
  const grupp = String(hela).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${ore < 0 ? "−" : ""}${grupp}${oren ? `,${String(oren).padStart(2, "0")}` : ""} kr`;
}

/** Radens summa (styckpris × antal); butikens egen text när beloppet saknas. */
function radSumma(li: KorgRadVy): string {
  const antal = li.quantity ?? 1;
  const st = parseFloat(li.price?.amount ?? "");
  return Number.isFinite(st) ? kr(Math.round(st * 100) * antal) : li.price?.formattedAmount || "";
}

const lasJson = <T,>(lagring: "local" | "session", nyckel: string): T | null => {
  try {
    const v = (lagring === "local" ? localStorage : sessionStorage).getItem(nyckel);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
};
const skrivJson = (lagring: "local" | "session", nyckel: string, v: unknown) => {
  try {
    const l = lagring === "local" ? localStorage : sessionStorage;
    if (v === null) l.removeItem(nyckel);
    else l.setItem(nyckel, JSON.stringify(v));
  } catch {
    /* privat läge: kassan fungerar ändå */
  }
};

/** Raden valda alternativ som en text: "Färg: Natur · Storlek: L". */
function variantText(li: KorgRadVy): string {
  return valdaAlternativ(li)
    .map((a) => (a.namn ? `${a.namn}: ${a.varde}` : a.varde))
    .join(" · ");
}

const IKON_BOCK = (
  <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

const IKON_PIL = (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
  </svg>
);

/** Fält vars fel kunden ser under fältet (rabattkoden har en egen rad). */
type FormFalt = keyof Varden;

/**
 * Kassan. `betyg` är butikens Google-betyg ("4,9", lib/social-proof-live.ts),
 * som page.tsx läser på servern; null visar ingen betygsrad.
 */
export function Kassa({
  stripeNyckel = null,
  betyg = null,
  last: lastFranServern = null,
}: {
  stripeNyckel?: string | null;
  betyg?: string | null;
  /** Medlemskorgen med låsta priser (lib/kassa/medlemskassa.ts), eller null. */
  last?: { id: string; rader: KorgRadVy[]; epost: string | null; besokarensKorg: string | null } | null;
}) {
  if (stripeNyckel) {
    // Stripe.js och betalfältet hämtas direkt när sidan visas.
    preconnect("https://js.stripe.com");
    preconnect("https://api.stripe.com");
  } else {
    // Wix betalsida ligger på en annan värd: anslutningen öppnas medan kunden
    // fyller i, så att sidan börjar laddas direkt när ordern är skapad.
    preconnect("https://checkout.fyndplats.se");
    prefetchDNS("https://static.parastorage.com");
    prefetchDNS("https://static.wixstatic.com");
  }

  const { cart, setOpen: oppnaVarukorgen } = useCart();
  // Medlemskorgen med låsta priser går före besökarens vanliga korg: den är en
  // kopia med medlemmens priser och låst kupong (lib/kassa/lastkorg.ts).
  const [last, setLast] = useState(lastFranServern);
  const [lastSlappt, setLastSlappt] = useState(false);
  const cartId: string = last?.id || cart?._id || "";
  const rader: KorgRadVy[] = useMemo(() => (last ? last.rader : (cart?.lineItems ?? [])), [cart, last]);
  const [varden, setVarden] = useState<Varden>(TOMT);
  const [fel, setFel] = useState<Partial<Record<Falt, string>>>({});
  const [meddelanden, setMeddelanden] = useState<string[]>([]);
  const [summa, setSumma] = useState<Summa | null>(null);
  const [kupongOppen, setKupongOppen] = useState(false);
  const [kupong, setKupong] = useState("");
  const [kupongFel, setKupongFel] = useState<string | null>(null);
  const [raknar, setRaknar] = useState(false);
  const [skickar, setSkickar] = useState(false);
  const [steg, setSteg] = useState(0);
  const stegTimrar = useRef<number[]>([]);
  const [vantar, setVantar] = useState<Vantar | null>(null);
  const [betalbar, setBetalbar] = useState<Betalbar | null>(null);
  // Varukorgen hämtas i webbläsaren när kakan fp_cart finns (components/cart.tsx).
  // Tills den kommit visas kassan med platshållare, inte "Varukorgen är tom".
  const [korgVantas, setKorgVantas] = useState(true);
  // Kakan fp_cart finns: en varukorg är på väg, så Stripe.js kan börja hämtas
  // innan den kommit (useStripeBetalning, korgFinns).
  const [korgPaVag, setKorgPaVag] = useState(false);
  // "ons 11 – mån 16 november": räknas i webbläsaren (lib/leveransdatum.ts), som i varukorgen.
  const [levDatum, setLevDatum] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- datumet beror på kundens klocka, inte serverns
    setLevDatum(leveransIntervall(new Date(), DELIVERY_MIN_DAYS, DELIVERY_MAX_DAYS));
  }, []);
  const [kollar, setKollar] = useState(true);
  const [sammanfattningOppen, setSammanfattningOppen] = useState(false);
  const [senastPostnr, setSenastPostnr] = useState<string | null>(null);
  // Stripe: felet under betalfältet, och "betalningen är godkänd men ordern inte
  // klar" (då får kunden aldrig betala igen). `pagar` stoppar ett dubbeltryck
  // direkt, innan React hunnit rita om knappen.
  const [betalFel, setBetalFel] = useState<string | null>(null);
  const [klarVantar, setKlarVantar] = useState(false);
  const pagar = useRef(false);
  // Fält kunden lämnat minst en gång: först då visas bocken och e-postförslaget.
  const [rorda, setRorda] = useState<ReadonlySet<FormFalt>>(() => new Set());
  const [coOppen, setCoOppen] = useState(false);
  // "Spara mina uppgifter": kundens eget val och aldrig förvalt. Utan det sparas
  // ingenting i webbläsaren, och det som sparats förut tas bort vid nästa köp.
  const [komIhag, setKomIhag] = useState(false);
  // Länet fylls i av sig självt (Googles förslag eller postnumret) tills kunden väljer själv.
  const lanSjalv = useRef(false);
  // Stripes adressfält (steg 2 med Stripe): är adressen komplett, och kassans rad under fältet.
  const adressKomplett = useRef(false);
  const [adressFel, setAdressFel] = useState<string | null>(null);
  // Snabbkassan (Apple Pay, Google Pay överst): felet under knapparna, och att
  // betalningen pågår därifrån (väntans text gäller då inte betalfältets val).
  const [snabbFel, setSnabbFel] = useState<string | null>(null);
  const [snabbPagar, setSnabbPagar] = useState(false);
  // Finns Apple Pay i webbläsaren? Då hålls knapparnas plats medan Stripe svarar
  // (planbokTrolig). Sant från början, också på servern: de flesta kunder är på
  // iPhone, och rutan som dök upp efter hydreringen knuffade ner formuläret
  // 256 px (lokalt prov 2026-11-06). I andra webbläsare håller CSS:en ingen plats
  // redan före hydreringen (PLANBOK_SKRIPT sätter data-applepay på <html>).
  const [planbokMojlig, setPlanbokMojlig] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- webbläsarens förmågor finns inte på servern
    setPlanbokMojlig(planbokTrolig({ applePaySession: "ApplePaySession" in window }));
  }, []);

  /**
   * "Ändra" öppnar varukorgen. Med medlemskorgen släpps den först (kakan bort),
   * eftersom en ändrad varukorg ska prissättas igen: varukorgens "Till kassan"
   * gör en ny medlemskorg.
   */
  const andraVarukorgen = () => {
    if (last) {
      void fetch("/api/kassa/lastkorg", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ steg: "slapp" }), keepalive: true }).catch(() => {});
      setLast(null);
      setLastSlappt(true);
    }
    oppnaVarukorgen(true);
  };

  // En låst korg som inte längre stämmer med varukorgen (ändrad efteråt, eller en
  // gammal kaka) släpps: kunden går till kassan från varukorgen igen.
  useEffect(() => {
    if (!last || !cart) return;
    if (lastKorgStammer(last, { id: cart._id, rader: cart.lineItems ?? [] })) return;
    void fetch("/api/kassa/lastkorg", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ steg: "slapp" }), keepalive: true }).catch(() => {});
    // eslint-disable-next-line react-hooks/set-state-in-effect -- varukorgen kommer från Wix efter första renderingen
    setLast(null);
    setLastSlappt(true);
  }, [cart, last]);

  // Medlemmens e-post på den låsta korgen fyller fältet, så att köpet räknas på kontot.
  useEffect(() => {
    const epost = lastFranServern?.epost;
    if (!epost) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- en gång, från serverns korg
    setVarden((v) => (v.epost ? v : { ...v, epost }));
  }, [lastFranServern]);

  // Provläget: /kassa?prova=1 sätter kakan som låter den här besökaren använda kassan.
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("prova") === "1") {
        document.cookie = `fp_kassa_prov=1; Max-Age=${60 * 60 * 24 * 30}; Path=/; SameSite=Lax; Secure`;
      }
    } catch {
      /* ingen kaka: vanliga läget gäller */
    }
  }, []);

  // Påminnelsen om varukorgen (lib/kassa/aterta.ts): e-posten och numret till
  // Wix-korgen när kunden lämnat fältet, så att Wix skapar en övergiven kassa
  // om köpet inte blir av. En gång per korg och uppgifter. Medlemskorgen har
  // redan kontots e-post och får inga påminnelser (lib/medlem/overgiven.ts).
  const kontaktSkickad = useRef("");
  const skickaKontakt = useCallback(
    (v: { epost?: string; telefon?: string }) => {
      if (last || !cartId) return;
      const epost = (v.epost ?? "").trim();
      if (!faltGiltigt("epost", epost)) return;
      const telefon = normalTelefon(v.telefon ?? "");
      const nyckel = `${cartId}|${epost.toLowerCase()}|${telefon ?? ""}`;
      if (kontaktSkickad.current === nyckel) return;
      kontaktSkickad.current = nyckel;
      void fetch("/api/kassa/kontakt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cartId, epost, ...(telefon ? { telefon } : {}) }),
        keepalive: true,
      })
        .then((r) => {
          if (!r.ok) kontaktSkickad.current = "";
        })
        .catch(() => {
          kontaktSkickad.current = "";
        });
    },
    [cartId, last],
  );
  // Sparade uppgifter fyller e-posten utan att kunden lämnar fältet: de skickas när korgen är känd.
  const forifyllt = useRef<Partial<Varden> | null>(null);

  // Sparade uppgifter från förra gången (bara i den här webbläsaren).
  useEffect(() => {
    const sparat = lasJson<Partial<Varden>>("local", ADRESS_NYCKEL);
    if (!sparat || typeof sparat !== "object") return;
    const giltigt = Object.fromEntries(Object.entries(sparat).filter(([k, x]) => k in TOMT && typeof x === "string")) as Partial<Varden>;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- uppgifterna finns bara i webbläsaren; servern och första renderingen måste vara lika
    setVarden((v) => ({ ...v, ...giltigt }));
    forifyllt.current = giltigt;
    // Kunden valde att spara förra gången: valet står kvar tills hen tar bort det.
    setKomIhag(true);
    if (giltigt.co) setCoOppen(true);
  }, []);

  useEffect(() => {
    const f = forifyllt.current;
    if (!f || !cartId) return;
    forifyllt.current = null;
    skickaKontakt(f);
  }, [cartId, skickaKontakt]);

  // Rabattkoden från påminnelsemejlet (/kassa/aterta → /kassa?kod=…) läggs på
  // när korgen är känd, en gång, och tas sedan bort ur adressen.
  const mejlKod = useRef<string | null>(null);
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const kod = (q.get("kod") ?? "").replace(/\s/g, "").slice(0, 40);
      if (!kod) return;
      mejlKod.current = kod;
      q.delete("kod");
      const rest = q.toString();
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${rest ? `?${rest}` : ""}`);
    } catch {
      /* utan koden fungerar kassan som vanligt */
    }
  }, []);

  // Tillbaka från Wix betalsida? Är ordern betald går kunden till tacksidan.
  // Annars visas länken till betalningen bara om servern säger att den fungerar.
  const kollaVantande = useCallback(async () => {
    const v = lasJson<Vantar>("session", VANTAR_NYCKEL);
    if (!v?.orderId) {
      setVantar(null);
      setBetalbar(null);
      setKollar(false);
      return;
    }
    setVantar(v);
    try {
      const fraga = `order=${encodeURIComponent(v.orderId)}${v.betalningId ? `&betalning=${encodeURIComponent(v.betalningId)}` : ""}`;
      const r = await fetch(`/api/kassa/status?${fraga}`, { cache: "no-store" });
      const j = await r.json();
      if (j?.betald) {
        skrivJson("session", VANTAR_NYCKEL, null);
        window.location.replace(`/tack?orderId=${encodeURIComponent(v.orderId)}`);
        return;
      }
      if (j?.finns === false || j?.avbruten) {
        skrivJson("session", VANTAR_NYCKEL, null);
        setVantar(null);
        setBetalbar(null);
      } else {
        setBetalbar(j?.betalbar && typeof j.url === "string" ? { url: j.url, utgar: typeof j.utgar === "string" ? j.utgar : null } : null);
      }
    } catch {
      // Okänt läge: ingen länk som kanske är död. Servern hittar ordern själv vid nästa tryck.
      setBetalbar(null);
    }
    setKollar(false);
  }, []);

  const stoppaSteg = () => {
    for (const t of stegTimrar.current) window.clearTimeout(t);
    stegTimrar.current = [];
  };
  const visaVantan = (fran: number) => {
    stoppaSteg();
    setSteg(fran);
    setSkickar(true);
    if (fran === 0) stegTimrar.current = [window.setTimeout(() => setSteg(1), 1100)];
  };
  const doljVantan = () => {
    stoppaSteg();
    setSkickar(false);
    setSteg(0);
  };

  useEffect(() => {
    let kaka = false;
    try {
      kaka = /(?:^|;\s*)fp_cart=/.test(document.cookie);
    } catch {
      /* ingen kaka att läsa */
    }
    if (!kaka) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- kakan finns bara i webbläsaren
      setKorgVantas(false);
      return;
    }
    setKorgPaVag(true);
    // Hämtningen kan misslyckas tyst (Wix nere): efter 10 s gäller det som syns.
    const t = window.setTimeout(() => setKorgVantas(false), 10_000);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- korgen kom från CartProvider
    if (cart) setKorgVantas(false);
  }, [cart]);

  useEffect(() => {
    // Med Stripe finns ingen väntande Wix-betalning att fråga om.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- den väntande ordern finns bara i webbläsarens sessionStorage
    if (stripeNyckel) setKollar(false);
    else kollaVantande();
    // Bakåtknappen från Wix betalsida (eller från Klarna) visar ofta sidan ur
    // webbläsarens minne: väntan stängs och betalningen kollas igen.
    const visa = (e: PageTransitionEvent) => {
      if (e.persisted) {
        for (const t of stegTimrar.current) window.clearTimeout(t);
        stegTimrar.current = [];
        setSkickar(false);
        setSteg(0);
        pagar.current = false;
        if (!stripeNyckel) kollaVantande();
      }
    };
    window.addEventListener("pageshow", visa);
    return () => window.removeEventListener("pageshow", visa);
  }, [kollaVantande, stripeNyckel]);

  // Wix räkning: när korgen är känd, när postnumret blir giltigt och när rabattkoden ändras.
  const rakna = useCallback(
    async (opts: { kupong?: string } = {}): Promise<{ kupong?: string | null; kupongFel?: string | null } | null> => {
      if (!cartId) return null;
      setRaknar(true);
      try {
        const r = await fetch("/api/kassa/rakna", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartId, postnr: varden.postnr, ...(opts.kupong !== undefined ? { kupong: opts.kupong } : {}) }),
        });
        const j = await r.json().catch(() => null);
        if (r.ok && j?.ok) {
          setSumma({ delsummaOre: j.delsummaOre, rabattOre: j.rabattOre ?? 0, fraktOre: j.fraktOre, totalOre: j.totalOre, momsOre: j.momsOre ?? null, fraktnamn: j.fraktnamn, kupong: j.kupong });
          setKupongFel(j.kupongFel ?? null);
          setMeddelanden(Array.isArray(j.meddelanden) ? j.meddelanden : []);
          if (j.kupong) setKupong(j.kupong);
          return j;
        }
        return null;
      } catch {
        /* summeringen visar butikens egen uppskattning tills nästa försök */
        return null;
      } finally {
        setRaknar(false);
      }
    },
    [cartId, varden.postnr],
  );

  // Korgens innehåll (rader och antal): ändras det i varukorgslådan räknas summan om.
  const korgSignatur = rader.map((li) => `${li._id}:${li.quantity ?? 1}`).join("|");
  useEffect(() => {
    if (!cartId) return;
    // Rabattkoden från påminnelsemejlet läggs på i samma räkning, så att två
    // räkningar inte tävlar om summeringen. Medlemskorgen har låst kupong.
    const kod = last ? null : mejlKod.current;
    if (kod) {
      mejlKod.current = null;
      setKupong(kod);
      void rakna({ kupong: kod }).then((j) => setKupongOppen(!(j?.kupong && !j.kupongFel)));
      return;
    }
    // Wix räkning hämtas när korgen blir känd i webbläsaren.
    rakna();
    // Bara när korgen eller dess innehåll byts; postnumret räknas vid blur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartId, korgSignatur]);

  // Stripes adressfält: ett nytt, giltigt postnummer räknas om. Kassans egna
  // fält räknar när kunden lämnar fältet (postnrKlart).
  const giltigtPostnr = normalPostnr(varden.postnr);
  useEffect(() => {
    if (!stripeNyckel || !giltigtPostnr || giltigtPostnr === senastPostnr) return;
    const t = window.setTimeout(() => {
      setSenastPostnr(giltigtPostnr);
      rakna();
    }, 350);
    return () => window.clearTimeout(t);
    // Bara när postnumret byts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [giltigtPostnr]);

  const andra = (f: FormFalt) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setVarden((x) => {
      const ny = { ...x, [f]: v };
      // Ett nytt, giltigt postnummer tar länet med sig, också efter kundens eget val (ny adress).
      const lan = f === "postnr" && v !== x.postnr ? lanFranPostnr(v) : null;
      if (lan) {
        ny.lan = lan;
        lanSjalv.current = false;
      }
      return ny;
    });
    // Felet släcks men raden står kvar (tom) till nästa tryck: annars flyttar
    // allt under fältet upp medan kunden skriver.
    if (fel[f]) setFel((x) => ({ ...x, [f]: "" }));
  };

  /** Kunden lämnar ett fält: bocken och förslagen visas, numret skrivs snyggt. */
  const lamna = (f: FormFalt) => () => {
    setRorda((r) => (r.has(f) ? r : new Set(r).add(f)));
    if (f === "telefon") setVarden((x) => ({ ...x, telefon: snyggtTelefon(x.telefon.trim()) }));
    if (f === "epost") setVarden((x) => ({ ...x, epost: x.epost.trim() }));
    if (f === "postnr") postnrKlart();
    if (f === "epost" || f === "telefon") skickaKontakt(varden);
  };

  /** Uppgifterna sparas bara om kunden valt det; annars tas det som sparats förut bort. */
  const sparaUppgifter = (v: Partial<Record<FormFalt, string>>) => {
    if (!komIhag) {
      skrivJson("local", ADRESS_NYCKEL, null);
      return;
    }
    const ut: Partial<Varden> = {};
    for (const k of Object.keys(TOMT) as FormFalt[]) if (typeof v[k] === "string") ut[k] = v[k];
    // Numret sparas som kunden skrev det ("070 …"), inte som Wix får det (+46…).
    ut.telefon = varden.telefon.trim();
    skrivJson("local", ADRESS_NYCKEL, ut);
  };

  /** Fel i formuläret: rabattkodens fel visas vid koden, och fokus går till det första felet uppifrån. */
  const visaFel = (nya: Partial<Record<Falt, string>>) => {
    setFel(nya);
    if (nya.kupong) {
      setKupongOppen(true);
      setKupongFel(nya.kupong);
    }
    const forsta = forstaFel(nya);
    if (forsta === "co") setCoOppen(true);
    if (forsta && stripeNyckel && ADRESS_FALT.includes(forsta)) {
      // Adressen står i Stripes fält: kassans rad under det, och fokus dit.
      setAdressFel(nya[forsta] || "Kontrollera adressen.");
      adressfaltRef.current?.focus();
    } else if (forsta) window.requestAnimationFrame(() => document.getElementById(`kassa-${forsta}`)?.focus());
  };

  const postnrKlart = () => {
    const pn = normalPostnr(varden.postnr);
    if (pn && pn !== senastPostnr) {
      setSenastPostnr(pn);
      setVarden((x) => ({ ...x, postnr: pn }));
      rakna();
    }
  };

  // Uppskattningen innan Wix svarat: korgens delsumma och butikens fraktregel (samma som Wix).
  const uppskattadDelsumma = Math.round((parseFloat(cart?.subtotal?.amount ?? "0") || 0) * 100);
  const delsummaOre = summa?.delsummaOre ?? uppskattadDelsumma;
  const fraktOre = summa?.fraktOre ?? fraktKr(uppskattadDelsumma / 100) * 100;
  const totalOre = summa?.totalOre ?? delsummaOre + fraktOre;
  const momsOre = summa?.momsOre ?? Math.round(totalOre / 5);
  const harKorg = Boolean(cartId);
  const kvarTillFri = FREE_SHIPPING_FROM_KR * 100 - (delsummaOre - (summa?.rabattOre ?? 0));

  // ── Stripe ──────────────────────────────────────────────────────────────
  // Uppdelat: lage och valt är tillstånd som ritas, resten är refs som bara läses i trycket.
  // Adressfältet börjar med kundens sparade uppgifter; en sparad c/o blir adressrad 2.
  const vardenRef = useRef(varden);
  useEffect(() => {
    vardenRef.current = varden;
  });
  const adressStart = () => {
    const v = vardenRef.current;
    return { fornamn: v.fornamn, efternamn: v.efternamn, gata: v.gata, rad2: v.rad2 || (v.co ? `c/o ${v.co.replace(/^c\/o\s*/i, "")}` : ""), postnr: v.postnr, ort: v.ort };
  };
  /** Stripes adressfält ändrades: kassans fält följer med, och länet så länge kunden inte valt själv. */
  const adressAndrad = (h: StripeAddressElementChangeEvent) => {
    adressKomplett.current = h.complete;
    const a = adressFranStripe(h.value);
    setVarden((x) => {
      if (normalPostnr(a.postnr) !== normalPostnr(x.postnr)) lanSjalv.current = false;
      return { ...x, fornamn: a.fornamn, efternamn: a.efternamn, gata: a.gata, rad2: a.rad2, co: "", postnr: a.postnr, ort: a.ort, lan: lanSjalv.current ? x.lan : a.lan };
    });
    setAdressFel(null);
  };
  // Snabbkassans blad visar det summeringen visar: raderna, rabatten, frakten och totalen.
  const sammandrag: Sammandrag = {
    rader: rader.map((li) => {
      const antal = li.quantity ?? 1;
      const st = parseFloat(li.price?.amount ?? "");
      return {
        namn: (typeof li.productName === "string" ? li.productName : li.productName?.original) || "Vara",
        antal,
        radOre: Number.isFinite(st) ? Math.round(st * 100) * antal : null,
      };
    }),
    delsummaOre,
    rabattOre: summa?.rabattOre ?? 0,
    kupong: summa?.kupong ?? null,
    fraktOre,
    fraktnamn: summa?.fraktnamn ?? null,
    totalOre,
    dagar: { min: DELIVERY_MIN_DAYS, max: DELIVERY_MAX_DAYS },
  };
  const sammandragRef = useRef(sammandrag);
  useEffect(() => {
    sammandragRef.current = sammandrag;
  });
  const {
    plats: betalPlats,
    lage: betalLage,
    valt: betalValt,
    stripe: stripeRef,
    elements: elementsRef,
    visat: visatRef,
    adressPlats,
    adressLage,
    adressfalt: adressfaltRef,
    snabbPlats,
    snabbLage,
    snabbPlanbocker,
    snabbElements: snabbElementsRef,
    snabbVisat: snabbVisatRef,
  } = useStripeBetalning(
    stripeNyckel,
    harKorg && totalOre > 0 ? totalOre : null,
    { start: adressStart, andrad: adressAndrad },
    {
      start: () => (harKorg ? sammandragRef.current : null),
      // Händelserna kommer från Stripe efter renderingen; funktionerna står längre ned.
      klick: (h) => snabbKlick(h),
      bekrafta: (h) => void snabbBekraftaHandelse(h),
    },
    korgPaVag || rader.length > 0,
  );
  const steglista: readonly string[] = stripeNyckel ? stripeSteg(snabbPagar ? null : betalValt) : STEG;

  /** Väntan på ett bestämt steg, utan Wix-vägens klocka. */
  const stegTill = (n: number) => {
    stoppaSteg();
    setSteg(n);
    setSkickar(true);
  };

  /** Ordern finns: det sparade försöket är förbrukat, och kunden går till tacksidan. */
  const tillTack = (orderId: string) => {
    skrivJson("local", STRIPE_NYCKEL, null);
    if (last) {
      // Medlemskorgen var en kopia: de köpta varorna tas bort ur besökarens korg.
      void fetch("/api/kassa/lastkorg", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ steg: "kopt", orderId }), keepalive: true }).catch(() => {});
    }
    window.location.replace(`/tack?orderId=${encodeURIComponent(orderId)}`);
  };

  /**
   * Betalningen är godkänd (eller var det redan): servern gör ordern
   * (vantaPaOrder frågar tills den finns). Efter en minut säger sidan att
   * bekräftelsen kommer via e-post (webhooken och nätet slutför), och kunden
   * kan inte betala igen.
   */
  const slutforStripe = async (avsiktId: string): Promise<string[]> => {
    stegTill(2);
    const b = await vantaPaOrder(avsiktId);
    if (b.gor === "tack") {
      tillTack(b.orderId);
      return [];
    }
    if (b.gor === "fel") {
      // Ingen order: reservationen är släppt. Kunden kan försöka igen med en ny betalning.
      skrivJson("local", STRIPE_NYCKEL, null);
      setMeddelanden(b.meddelanden);
      doljVantan();
      pagar.current = false;
      rakna();
      return b.meddelanden;
    }
    setKlarVantar(true);
    doljVantan();
    return [];
  };

  // Tillbaka från Klarna utan order (/kassa?stripe=<kod>): säg varför, och ta bort koden ur adressen.
  useEffect(() => {
    if (!stripeNyckel) return;
    try {
      const sok = new URLSearchParams(window.location.search);
      const text = stripeMeddelande(sok.get("stripe"));
      if (!text) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- koden finns bara i webbläsarens adress
      setMeddelanden([text]);
      sok.delete("stripe");
      const q = sok.toString();
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${q ? `?${q}` : ""}`);
    } catch {
      /* ingen adress att läsa */
    }
  }, [stripeNyckel]);

  // En betalning som redan godkänts för den här korgen (sidan laddades om mitt
  // i, eller kunden kom tillbaka): servern slutför den i stället för att kunden
  // betalar igen. En obetald betalning återanvänds vid nästa tryck.
  useEffect(() => {
    if (!stripeNyckel || !cartId) return;
    const id = sparadAvsikt(lasJson("local", STRIPE_NYCKEL), cartId, Date.now());
    if (!id) return;
    let avbruten = false;
    void fragaKlar(id).then(async ({ status, j }) => {
      if (avbruten || pagar.current) return;
      const b = klarBeslut(status, j);
      if (b.gor === "tack") tillTack(b.orderId);
      else if (status === 202) {
        // Betald och på väg att bli en order (webhooken håller på): vänta på den.
        pagar.current = true;
        await slutforStripe(id);
      }
      // Annars: obetald eller släppt. Kunden betalar som vanligt.
    });
    return () => {
      avbruten = true;
    };
    // Bara när korgen blir känd; slutforStripe är en vanlig funktion i komponenten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripeNyckel, cartId]);

  const skickaStripe = async () => {
    if (pagar.current || klarVantar) return;
    setMeddelanden([]);
    setBetalFel(null);
    const prov = provaKassa({ ...varden, kupong: kupongOppen ? kupong : summa?.kupong ?? "" });
    // Adressen står i Stripes fält: det visar själv vad som saknas när
    // elements.submit() prövar det nedan. Kassans egna fält prövas här.
    const egnaFel = prov.ok ? {} : Object.fromEntries(Object.entries(prov.fel).filter(([f]) => !ADRESS_FALT.includes(f as Falt)));
    if (Object.keys(egnaFel).length > 0 || (!prov.ok && adressKomplett.current)) {
      // Stripes fält (adressen och kortet) visar sina fel i samma tryck, så att
      // kunden ser allt som saknas på en gång i stället för ett steg i taget.
      // Ingen betalning skapas; fokus går sedan till kassans första fel.
      const el = elementsRef.current;
      if (el && betalLage === "redo") await el.submit().catch(() => null);
      // Komplett hos Stripe men inte hos kassan (en för lång rad): kassans text, och inget blad öppnas.
      visaFel(Object.keys(egnaFel).length > 0 ? egnaFel : prov.ok ? {} : prov.fel);
      return;
    }
    setFel({});
    setAdressFel(null);
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements || betalLage !== "redo") {
      setBetalFel(betalLage === "fel" ? "Betalsätten kunde inte laddas. Ladda om sidan och försök igen." : "Betalsätten laddas. Vänta ett ögonblick och försök igen.");
      return;
    }
    pagar.current = true;
    // ☠️ FÖRST, i själva trycket: Stripe prövar fälten innan betalningen skapas,
    // och ett plånboksblad öppnas bara i ett tryck (efter ett nätverksanrop
    // räknas det inte längre som ett).
    let inskickat: Awaited<ReturnType<typeof elements.submit>>;
    try {
      inskickat = await elements.submit();
    } catch {
      pagar.current = false;
      setBetalFel(betalfelText(null));
      return;
    }
    if (inskickat.error || !prov.ok) {
      pagar.current = false;
      if (!adressKomplett.current || !prov.ok) {
        setAdressFel("Fyll i leveransadressen ovan.");
        adressfaltRef.current?.focus();
      } else {
        setBetalFel(betalfelText(inskickat.error));
      }
      return;
    }
    stegTill(0);
    sparaUppgifter(prov.varden);
    try {
      const r = await fetch("/api/kassa/stripe/forbered", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId, ...prov.varden, avsiktId: sparadAvsikt(lasJson("local", STRIPE_NYCKEL), cartId, Date.now()) }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok || typeof j.avsiktId !== "string") {
        if (j?.fel) visaFel(j.fel);
        if (j?.falt === "kupong") {
          setKupongOppen(true);
          setKupongFel(j.meddelanden?.[0] ?? "Rabattkoden gäller inte.");
        } else if (j?.falt === "postnr") {
          setAdressFel(j.meddelanden?.[0] ?? "Kontrollera postnumret.");
        }
        setMeddelanden(Array.isArray(j?.meddelanden) && j.meddelanden.length ? j.meddelanden : j?.fel ? [] : ["Något gick fel. Försök igen om en stund."]);
        doljVantan();
        pagar.current = false;
        return;
      }
      skrivJson("local", STRIPE_NYCKEL, { avsiktId: j.avsiktId, cartId, at: Date.now() });
      if (j.redanBetald) {
        await slutforStripe(j.avsiktId);
        return;
      }
      // Wix räknade fram en annan total än den kunden ser: ingen betalning på
      // ett belopp kunden inte sett. Summan visas, och kunden trycker igen.
      const komplett = typeof j.totalOre === "number" && typeof j.clientSecret === "string" && Boolean(j.fakturering && typeof j.fakturering === "object");
      if (!komplett || j.totalOre !== visatRef.current) {
        if (komplett) {
          elements.update({ amount: j.totalOre });
          visatRef.current = j.totalOre;
          setMeddelanden([`Att betala är nu ${kr(j.totalOre)}. Kontrollera beställningen och tryck på knappen igen.`]);
        } else {
          setMeddelanden(["Något gick fel. Försök igen om en stund."]);
        }
        rakna();
        doljVantan();
        pagar.current = false;
        return;
      }
      stegTill(1);
      const svar = await stripe.confirmPayment({
        elements,
        clientSecret: j.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}${RETUR_SOKVAG}`,
          // Faktureringen ur serverns svar (faktureringAv): betalfältet frågar aldrig efter den.
          payment_method_data: { billing_details: j.fakturering },
        },
        redirect: "if_required",
      });
      if (svar.error) {
        setBetalFel(betalfelText(svar.error));
        doljVantan();
        pagar.current = false;
        return;
      }
      const lage = svar.paymentIntent?.status;
      if (lage === "requires_capture" || lage === "succeeded" || lage === "processing") {
        await slutforStripe(j.avsiktId);
        return;
      }
      setBetalFel("Betalningen godkändes inte. Välj ett annat betalsätt eller försök igen.");
      doljVantan();
      pagar.current = false;
    } catch {
      setMeddelanden(["Ingen kontakt med kassan. Kontrollera uppkopplingen och försök igen."]);
      doljVantan();
      pagar.current = false;
    }
  };

  // ── Snabbkassan (Apple Pay, Google Pay) ─────────────────────────────────
  /** Trycket på en knapp: bladet öppnas med det summeringen visar, inom en sekund. */
  const snabbKlick = (h: StripeExpressCheckoutElementClickEvent) => {
    if (pagar.current || klarVantar || !harKorg) {
      h.reject();
      return;
    }
    setSnabbFel(null);
    h.resolve(klickSvar(sammandragRef.current));
  };

  /**
   * Kunden godkände i Apple Pay eller Google Pay: samma väg som betalfältet
   * (snabbBekrafta), med plånbokens uppgifter i stället för formulärets.
   */
  const snabbBekraftaHandelse = async (h: StripeExpressCheckoutElementConfirmEvent) => {
    const stripe = stripeRef.current;
    const grupp = snabbElementsRef.current;
    if (pagar.current || klarVantar || !stripe || !grupp || !cartId) {
      h.paymentFailed({ reason: "fail" });
      return;
    }
    pagar.current = true;
    setSnabbPagar(true);
    setMeddelanden([]);
    setBetalFel(null);
    setSnabbFel(null);
    // Rabattkoden som står i summeringen; beloppet i bladet är räknat med den.
    const kod = summa?.kupong ?? "";
    const u = await snabbBekrafta(
      {
        submit: () => grupp.submit(),
        // Medlemmens korg: kontots e-post går före plånbokens, så att köpet räknas på kontot.
        prova: (p) => provaKassa(kundFranPlanbok(p, { kupong: kod, epost: last?.epost })),
        forbered: async (kund) => {
          try {
            const r = await fetch("/api/kassa/stripe/forbered", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cartId, ...kund, avsiktId: sparadAvsikt(lasJson("local", STRIPE_NYCKEL), cartId, Date.now()) }),
            });
            return { status: r.status, j: await r.json().catch(() => null) };
          } catch {
            return { status: 0, j: null };
          }
        },
        spara: (avsiktId) => skrivJson("local", STRIPE_NYCKEL, { avsiktId, cartId, at: Date.now() }),
        visat: () => snabbVisatRef.current,
        bekrafta: async (clientSecret) => {
          // Plånboken ger fakturering och leveransadress; servern sätter ingen (avsiktParametrar).
          const r = await stripe.confirmPayment({
            elements: grupp,
            clientSecret,
            confirmParams: { return_url: `${window.location.origin}${RETUR_SOKVAG}` },
            redirect: "if_required",
          });
          return { error: r.error, status: r.paymentIntent?.status };
        },
        felText: betalfelText,
        steg: (n) => stegTill(n),
      },
      h,
    );
    if (u.gor === "slutfor") {
      // Blev det ingen order står texten också vid knapparna, där kunden är.
      const fel = await slutforStripe(u.avsiktId);
      if (fel.length > 0) setSnabbFel(fel.join(" "));
      setSnabbPagar(false);
      return;
    }
    doljVantan();
    pagar.current = false;
    setSnabbPagar(false);
    setSnabbFel(u.text);
    if (u.gor === "belopp") {
      // Wix räknade fram en annan total: knapparna visar den, och kunden trycker igen.
      grupp.update({ amount: u.totalOre });
      snabbVisatRef.current = u.totalOre;
      rakna();
    } else if (u.falt === "kupong") {
      setKupongOppen(true);
      setKupongFel(u.text);
    }
  };

  /** "Betala med Apple Pay i stället": tillbaka upp till knapparna. */
  const tillSnabbkassan = () => {
    document.getElementById("kassa-snabb")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  /** "Har du en rabattkod?" vid knapparna: koden står i steg 3, och fältet öppnas där. */
  const tillRabattkoden = () => {
    setKupongOppen(true);
    window.requestAnimationFrame(() => {
      const f = document.getElementById("kassa-kupong");
      f?.scrollIntoView({ behavior: "smooth", block: "center" });
      f?.focus({ preventScroll: true });
    });
  };

  const skicka = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stripeNyckel) {
      await skickaStripe();
      return;
    }
    if (skickar) return;
    setMeddelanden([]);
    const prov = provaKassa({ ...varden, kupong: kupongOppen ? kupong : summa?.kupong ?? "" });
    if (!prov.ok) {
      visaFel(prov.fel);
      return;
    }
    setFel({});
    visaVantan(0);
    sparaUppgifter(prov.varden);
    try {
      const r = await fetch("/api/kassa/betala", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId, ...prov.varden, tidigare: vantar && vantar.cartId === cartId ? { orderId: vantar.orderId, betalningId: vantar.betalningId } : null }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.ok && j.url) {
        const ny: Vantar = { orderId: j.orderId, betalningId: j.betalningId, cartId, url: j.url, at: Date.now() };
        skrivJson("session", VANTAR_NYCKEL, ny);
        stoppaSteg();
        setSteg(2);
        window.location.href = j.url;
        return;
      }
      if (j?.fel) visaFel(j.fel);
      if (j?.falt === "kupong") {
        setKupongOppen(true);
        setKupongFel(j.meddelanden?.[0] ?? "Rabattkoden gäller inte.");
      } else if (j?.falt === "postnr") {
        setFel((x) => ({ ...x, postnr: j.meddelanden?.[0] ?? "Kontrollera postnumret." }));
      }
      if (j?.kod === "redan_betald" && vantar) {
        window.location.replace(`/tack?orderId=${encodeURIComponent(vantar.orderId)}`);
        return;
      }
      setMeddelanden(Array.isArray(j?.meddelanden) && j.meddelanden.length ? j.meddelanden : j?.fel ? [] : ["Något gick fel. Försök igen om en stund."]);
    } catch {
      setMeddelanden(["Ingen kontakt med kassan. Kontrollera uppkopplingen och försök igen."]);
    }
    doljVantan();
    // Servern kan ha släppt den förra ordern: rutan ska visa läget som det är nu.
    kollaVantande();
  };

  const tillVantandeBetalning = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    visaVantan(2);
  };

  const anvandKupong = async () => {
    const kod = kupong.replace(/\s/g, "");
    if (!kod) return;
    setKupongFel(null);
    const j = await rakna({ kupong: kod });
    // Koden gick in: fältet stängs och koden visas som en bricka med "Ta bort".
    if (j?.kupong && !j.kupongFel) setKupongOppen(false);
  };

  /** Rabattkoden tas bort ur korgen (en tom kod till /api/kassa/rakna). */
  const taBortKupong = async () => {
    setKupong("");
    setKupongFel(null);
    await rakna({ kupong: "" });
    setKupongOppen(false);
  };

  if (visaTomKorg({ rader: rader.length, korgVantas, kollar, skickar, klarVantar })) {
    return (
      <div className={s.sida} data-kassa-sida="">
        <KassaHuvud />
        <div className={s.innehall}>
          <div className={s.tom}>
            <span className={s.tomIkon} aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" d="M6 7h12l-1 13H7L6 7Zm3 0a3 3 0 0 1 6 0" /></svg>
            </span>
            <h1 className={s.rubrik}>Varukorgen är tom</h1>
            <p>Lägg något i varukorgen först, så kommer du hit när du vill betala.</p>
            <a className={s.knappSekundar} href="/butik">Till butiken</a>
          </div>
        </div>
        <KassaFot />
      </div>
    );
  }

  /** Beloppet, eller en platshållare med samma höjd medan korgen hämtas. */
  const belopp = (ore: number | null) => (harKorg ? kr(ore) : <span className={s.skelett} aria-label="Hämtar" />);
  // Snabbkassan syns när kunden har en plånbok. Medan Stripe svarar hålls
  // platsen bara i webbläsare som kan ha en; annars står rutan utanför sidan
  // tills knapparna finns, så att formuläret inte hoppar.
  const snabbVisas = Boolean(stripeNyckel) && (snabbLage === "redo" || (snabbLage === "laddar" && planbokMojlig));
  const planbokText = snabbLage === "redo" ? planbokNamn(snabbPlanbocker) : "Apple Pay eller Google Pay";
  const antalVaror = rader.reduce((n, li) => n + (li.quantity ?? 1), 0);
  // "Menade du …?" när kunden lämnat fältet. Står på hjälptextens rad, så att inget flyttar.
  const epostTips = rorda.has("epost") && !fel.epost ? epostForslag(varden.epost) : null;
  const friFraktAndel = Math.max(0, Math.min(1, (delsummaOre - (summa?.rabattOre ?? 0)) / (FREE_SHIPPING_FROM_KR * 100)));

  /**
   * Ett fält med flytande etikett (som i betalfältet). Raden under fältet finns
   * när fältet har en hjälptext eller har haft ett fel sedan senaste trycket;
   * ett rättat fel lämnar raden tom i stället för att ta bort den.
   */
  const falt = (f: FormFalt, etikett: string, props: React.InputHTMLAttributes<HTMLInputElement>, hjalp?: React.ReactNode) => {
    const felText = fel[f];
    const visaFelText = Boolean(felText);
    // Ingen bock medan kassan frågar "Menade du …?": bocken sa förut att en
    // felstavad adress (gmial.com) var rätt, på samma rad som förslaget (auditen 2026-11-06).
    const ok = !visaFelText && rorda.has(f) && faltGiltigt(f, varden[f]) && !(f === "epost" && epostTips);
    const harRad = felText !== undefined || Boolean(hjalp);
    const textId = `kassa-${f}-text`;
    return (
      <div className={s.falt}>
        <div className={`${s.faltRam} ${visaFelText ? s.faltRamFel : ""} ${ok ? s.faltRamOk : ""}`}>
          <input
            id={`kassa-${f}`}
            name={f}
            className={s.input}
            value={varden[f]}
            onChange={andra(f)}
            onBlur={lamna(f)}
            placeholder=" "
            aria-invalid={visaFelText ? true : undefined}
            aria-describedby={harRad ? textId : undefined}
            {...props}
          />
          <label className={s.etikett} htmlFor={`kassa-${f}`}>{etikett}</label>
          {ok ? <span className={s.faltOk} aria-hidden="true">{IKON_BOCK}</span> : null}
        </div>
        {harRad ? (
          <div id={textId} className={visaFelText ? s.felText : s.hjalpText} aria-live="polite">
            {visaFelText ? felText : hjalp}
          </div>
        ) : null}
      </div>
    );
  };

  const epostHjalp = epostTips ? (
    <span className={s.forslag}>
      Menade du{" "}
      <button
        type="button"
        onClick={() => {
          setVarden((x) => ({ ...x, epost: epostTips }));
          skickaKontakt({ ...varden, epost: epostTips });
        }}
      >
        {epostTips}
      </button>
      ?
    </span>
  ) : (
    "Orderbekräftelsen och spårningen kommer hit."
  );

  /** Kunden väljer länet själv: valet står kvar tills postnumret byts. */
  const valjLan = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    lanSjalv.current = true;
    setVarden((x) => ({ ...x, lan: v }));
  };

  const oppnaCo = () => {
    setCoOppen(true);
    window.requestAnimationFrame(() => document.getElementById("kassa-co")?.focus());
  };

  const sammanfattning = (
    <div className={s.summering}>
      <ul className={s.rader}>
        {rader.map((li) => {
          const bild = liImageUrl(li.image);
          const namn = (typeof li.productName === "string" ? li.productName : li.productName?.original) || "Vara";
          const variant = variantText(li);
          const antal = li.quantity ?? 1;
          return (
            <li key={li._id} className={s.rad}>
              <span className={s.bild}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {bild ? <img src={tightFillUrl(bild, 112, 112)} alt="" width={56} height={56} loading="lazy" /> : null}
                {antal > 1 ? <span className={s.antal} aria-label={`${antal} st`}>{antal}</span> : null}
              </span>
              <span className={s.radText}>
                <span className={s.radNamn}>{namn}</span>
                {variant ? <span className={s.radVariant}>{variant}</span> : null}
              </span>
              <span className={s.radPris}>{radSumma(li)}</span>
            </li>
          );
        })}
      </ul>
      <dl className={s.summor}>
        <div><dt>Delsumma</dt><dd>{belopp(delsummaOre)}</dd></div>
        {summa && summa.rabattOre > 0 ? <div className={s.rabatt}><dt>Rabatt{summa.kupong ? ` (${summa.kupong})` : ""}</dt><dd>−{kr(summa.rabattOre)}</dd></div> : null}
        <div><dt>Frakt</dt><dd className={harKorg && fraktOre === 0 ? s.gratis : undefined}>{harKorg ? (fraktOre === 0 ? "Fri frakt" : kr(fraktOre)) : belopp(null)}</dd></div>
        {harKorg && fraktOre > 0 && kvarTillFri > 0 ? (
          <div className={s.friFrakt}>
            <dt>Handla för {kr(kvarTillFri)} till så blir frakten gratis</dt>
            <dd className={s.friFraktMatare} aria-hidden="true"><span style={{ width: `${Math.round(friFraktAndel * 100)}%` }} /></dd>
          </div>
        ) : null}
        <div className={s.total}><dt>Att betala</dt><dd>{belopp(totalOre)}</dd></div>
      </dl>
      <p className={s.moms}>{harKorg ? <>Varav moms {kr(momsOre)}{raknar ? " · räknar …" : ""}</> : " "}</p>
    </div>
  );

  // Det kunden ofta vill veta precis innan hen betalar. Bara det som stämmer:
  // öppet köp och leveranstiden står i köpvillkoren och lib/shipping.ts.
  const fortroende = (
    <div className={s.fortroende}>
      <ul className={s.fortroendeLista}>
        <li>
          <span className={s.fortroendeIkon} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" /></svg>
          </span>
          <span><strong>30 dagars öppet köp</strong>Ångra köpet inom 30 dagar efter att du fått varan.</span>
        </li>
        <li>
          <span className={s.fortroendeIkon} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M3 6.5h11v9H3zM14 9.5h3.6l3.4 3.4v2.6h-7M6.5 18.5a1.75 1.75 0 1 0 0-.01M17.5 18.5a1.75 1.75 0 1 0 0-.01" /></svg>
          </span>
          <span><strong>Spårbar leverans</strong>{levDatum ? `Beräknad ${levDatum}` : DELIVERY_TIME}, från EU-lager utan tull.</span>
        </li>
        <li>
          <span className={s.fortroendeIkon} aria-hidden="true"><Las storlek={16} /></span>
          <span>
            <strong>Trygg betalning</strong>
            {stripeNyckel ? "Kort, Apple Pay, Google Pay eller Klarna, krypterat via Stripe." : "Kort, Klarna eller Apple Pay, krypterat hos Wix."}
          </span>
        </li>
      </ul>
      {betyg ? (
        <p className={s.betyg}>
          <GoogleG size={16} />
          <span><strong>{betyg}</strong> av 5 på Google</span>
          <span className={s.betygStjarnor} aria-hidden="true">★★★★★</span>
        </p>
      ) : null}
    </div>
  );

  const kupongDel = summa?.kupong && !kupongOppen ? (
    <div className={s.kupongTillagd}>
      <span className={s.kupongBricka}>
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 12V4h8l10 10-8 8L3 12Zm5-4.5h.01" /></svg>
        {summa.kupong}
      </span>
      <span className={s.kupongBelopp}>{summa.rabattOre > 0 ? `−${kr(summa.rabattOre)}` : "Tillagd"}</span>
      <button type="button" className={s.lankLiten} onClick={taBortKupong} disabled={raknar}>Ta bort</button>
    </div>
  ) : kupongOppen ? (
    <div className={s.kupong}>
      <div className={s.kupongRad}>
        <div className={`${s.faltRam} ${kupongFel ? s.faltRamFel : ""}`}>
          <input
            id="kassa-kupong"
            className={s.input}
            placeholder=" "
            value={kupong}
            onChange={(e) => { setKupong(e.target.value); setKupongFel(null); }}
            // Enter i rabattfältet lägger till koden. Förut skickade det hela
            // formuläret, alltså betalningen.
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void anvandKupong(); } }}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="done"
            aria-invalid={kupongFel ? true : undefined}
            aria-describedby="kassa-kupong-text"
          />
          <label className={s.etikett} htmlFor="kassa-kupong">Rabattkod</label>
        </div>
        <button type="button" className={s.knappSekundar} onClick={anvandKupong} disabled={raknar || !kupong.trim()}>Använd</button>
      </div>
      <div id="kassa-kupong-text" className={kupongFel ? s.felText : s.hjalpText} aria-live="polite">{kupongFel ?? ""}</div>
    </div>
  ) : last ? (
    <p className={s.medlemsrad}>Ditt medlemspris är med. Det går inte att kombinera med rabattkoder.</p>
  ) : lastSlappt ? (
    <p className={s.medlemsrad}>Gå till kassan från varukorgen igen, så räknas ditt medlemspris.</p>
  ) : (
    <button type="button" className={`${s.lankLiten} ${s.kupongLank}`} onClick={() => setKupongOppen(true)}>Har du en rabattkod?</button>
  );

  return (
    <div className={s.sida} data-kassa-sida="">
      <KassaHuvud tillVarukorgen={andraVarukorgen} />
      <div className={s.innehall}>
        <h1 className="sr-only">Kassa</h1>

        {/* Mobil: summeringen stängd ovanför formuläret, så att inget flyttar fälten. */}
        <div className={s.mobilSummering}>
          <button
            type="button"
            className={s.visaSummering}
            aria-expanded={sammanfattningOppen}
            aria-controls="kassa-summering-mobil"
            onClick={() => setSammanfattningOppen((v) => !v)}
          >
            <span className={s.visaSummeringText}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M6 7h12l-1 13H7L6 7Zm3 0a3 3 0 0 1 6 0" /></svg>
              <span className={s.visaSummeringEtikett}>{sammanfattningOppen ? "Dölj beställningen" : "Visa beställningen"}</span>
              {antalVaror > 0 ? <span className={s.visaSummeringAntal}>({antalVaror} {antalVaror === 1 ? "vara" : "varor"})</span> : null}
              <svg className={s.chevron} data-oppen={sammanfattningOppen ? "ja" : undefined} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg>
            </span>
            <strong>{belopp(totalOre)}</strong>
          </button>
          {sammanfattningOppen ? (
            <div id="kassa-summering-mobil" className={s.mobilSummeringInnehall}>
              {sammanfattning}
              <button type="button" className={s.andraMobil} onClick={andraVarukorgen}>Ändra varukorgen</button>
            </div>
          ) : null}
        </div>

        {klarVantar ? (
          <div className={s.klarVantar} role="status">
            <span className={s.klarBock} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" /></svg>
            </span>
            <span className={s.vantarText}>
              <strong>Betalningen är godkänd</strong>
              <span>Vi slutför din beställning. Orderbekräftelsen kommer till din e-post inom några minuter, och du behöver inte betala igen.</span>
            </span>
          </div>
        ) : null}

        {vantar && betalbar && vantar.cartId === cartId ? (
          <div className={s.vantar} role="status">
            <div className={s.vantarText}>
              <strong>Din betalning väntar</strong>
              <span>
                {klockslag(betalbar.utgar) ? `Varorna är reserverade åt dig till kl ${klockslag(betalbar.utgar)}.` : "Varorna är reserverade åt dig."} Ändrar du något nedan
                får du en ny betalning med de nya uppgifterna.
              </span>
            </div>
            <a className={s.vantarKnapp} href={betalbar.url} onClick={tillVantandeBetalning}>
              Fortsätt till betalningen <span aria-hidden="true">→</span>
            </a>
          </div>
        ) : null}

        <div className={s.layout}>
          <form className={s.formular} onSubmit={skicka} noValidate>
            {stripeNyckel ? (
              <section
                id="kassa-snabb"
                className={`${s.kort} ${s.snabb}`}
                data-visas={snabbVisas ? "ja" : "nej"}
                data-snabb={snabbLage}
                aria-labelledby="kassa-snabb-rubrik"
                aria-hidden={snabbVisas ? undefined : true}
              >
                <h2 id="kassa-snabb-rubrik" className={s.snabbRubrik}>Snabbkassa</h2>
                <p className={s.snabbUnder}>Namn, adress och e-post hämtas från {planbokText}. Du fyller inte i något.</p>
                <div className={s.snabbYta}>
                  {/* Stripes knappar (use-stripe-betalning.ts). Platshållaren har knappens höjd, så att inget hoppar. */}
                  <div ref={snabbPlats} />
                  {snabbLage === "laddar" ? <div className={s.snabbSkelett} aria-hidden="true" /> : null}
                </div>
                {snabbFel ? <p className={s.betalFel} role="alert">{snabbFel}</p> : null}
                <p className={s.snabbKod}>
                  {summa?.kupong ? (
                    <>Rabattkoden <strong>{summa.kupong}</strong> är med i beloppet.</>
                  ) : last ? (
                    // Medlemspriset går inte att kombinera med rabattkoder (kupongen är låst i korgen).
                    <>Ditt medlemspris är med i beloppet.</>
                  ) : (
                    <button type="button" className={s.lankLiten} onClick={tillRabattkoden}>Har du en rabattkod?</button>
                  )}
                </p>
              </section>
            ) : null}
            {snabbVisas ? (
              <p className={s.eller} role="separator" data-snabb={snabbLage}>
                <span>eller fyll i dina uppgifter</span>
              </p>
            ) : null}

            <section className={s.kort} aria-labelledby="kassa-kontakt">
              <h2 id="kassa-kontakt" className={s.steg}><span className={s.nr}>1</span> Kontakt</h2>
              {falt("epost", "E-postadress", { type: "email", autoComplete: "email", inputMode: "email", autoCapitalize: "none", spellCheck: false, enterKeyHint: "next" }, epostHjalp)}
              {falt("telefon", "Mobilnummer", { type: "tel", autoComplete: "tel", inputMode: "tel", enterKeyHint: "next" }, "Transportören aviserar dit.")}
            </section>

            <section className={s.kort} aria-labelledby="kassa-leverans">
              <h2 id="kassa-leverans" className={s.steg}><span className={s.nr}>2</span> Leverans</h2>
              {stripeNyckel ? (
                // Stripes adressfält med Googles adressförslag (use-stripe-betalning.ts).
                // Platshållaren ligger i samma ruta tills fältet ritats, så att inget hoppar.
                <div className={s.adressYta} data-adress={adressLage}>
                  <div ref={adressPlats} className={s.adressfalt} />
                  {adressLage === "laddar" ? (
                    <div className={s.adressSkelett} aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className={s.tva}>
                    {falt("fornamn", "Förnamn", { autoComplete: "shipping given-name", autoCapitalize: "words", enterKeyHint: "next" })}
                    {falt("efternamn", "Efternamn", { autoComplete: "shipping family-name", autoCapitalize: "words", enterKeyHint: "next" })}
                  </div>
                  {falt("gata", "Gatuadress", { autoComplete: "shipping address-line1", autoCapitalize: "words", enterKeyHint: "next" })}
                  {coOppen || varden.co || fel.co !== undefined ? (
                    falt("co", "c/o (frivilligt)", { autoComplete: "shipping address-line2", autoCapitalize: "words", enterKeyHint: "next" })
                  ) : (
                    <button type="button" className={s.lankLiten} onClick={oppnaCo}>+ Lägg till c/o-adress</button>
                  )}
                  <div className={s.postrad}>
                    {falt("postnr", "Postnummer", { autoComplete: "shipping postal-code", inputMode: "numeric", maxLength: 6, enterKeyHint: "next" })}
                    {falt("ort", "Stad", { autoComplete: "shipping address-level2", autoCapitalize: "words", enterKeyHint: "done" })}
                  </div>
                </>
              )}
              {adressFel || (stripeNyckel && adressLage === "fel") ? (
                <div className={s.felText} role="alert">
                  {adressFel ?? "Adressfältet kunde inte laddas. Ladda om sidan och försök igen."}
                </div>
              ) : null}
              <div className={s.falt}>
                <div className={s.faltRam}>
                  <select
                    id="kassa-lan"
                    name="lan"
                    className={`${s.input} ${s.val} ${varden.lan ? s.valIfyllt : ""}`}
                    value={varden.lan}
                    onChange={valjLan}
                    autoComplete="shipping address-level1"
                    aria-describedby="kassa-lan-text"
                  >
                    <option value="" disabled hidden />
                    {LAN.map((l) => (
                      <option key={l.kod} value={l.kod}>
                        {l.namn}
                      </option>
                    ))}
                  </select>
                  <label className={s.etikett} htmlFor="kassa-lan">Län</label>
                  <span className={s.valPil} aria-hidden="true">{IKON_PIL}</span>
                </div>
                <div id="kassa-lan-text" className={s.hjalpText}>
                  {varden.lan ? "Ifyllt automatiskt från adressen." : "Fylls i automatiskt från postnumret."}
                </div>
              </div>
              <div className={s.frakt}>
                <span className={s.fraktIkon} aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M3 6.5h11v9H3zM14 9.5h3.6l3.4 3.4v2.6h-7M6.5 18.5a1.75 1.75 0 1 0 0-.01M17.5 18.5a1.75 1.75 0 1 0 0-.01" /></svg>
                </span>
                <span>
                  <span className={s.fraktTopp}>
                    <strong>{summa?.fraktnamn || "Spårbar standardleverans"}</strong>
                    <span className={`${s.fraktPris} ${harKorg && fraktOre === 0 ? s.gratis : ""}`}>{harKorg ? (fraktOre === 0 ? "Fri frakt" : kr(fraktOre)) : belopp(null)}</span>
                  </span>
                  <span className={s.fraktTid}>{levDatum ? `Beräknad leverans ${levDatum}` : DELIVERY_TIME}</span>
                  <span className={s.fraktTid}>Från EU-lager · spårningslänk via e-post när paketet skickas</span>
                </span>
              </div>
              <label className={s.komIhag}>
                <input type="checkbox" checked={komIhag} onChange={(e) => setKomIhag(e.target.checked)} />
                <span className={s.komIhagRuta} aria-hidden="true">{IKON_BOCK}</span>
                <span>Spara mina uppgifter i den här webbläsaren till nästa köp</span>
              </label>
            </section>

            <section className={s.kort} aria-labelledby="kassa-betalning">
              <h2 id="kassa-betalning" className={s.steg}><span className={s.nr}>3</span> Betalning</h2>
              <p className={s.betalUnder}>
                <Las storlek={12} />
                {stripeNyckel ? "Alla betalningar är krypterade. Inget dras förrän ordern är lagd." : "Alla betalningar är krypterade."}
              </p>
              {stripeNyckel ? (
                <>
                  <div className={s.betalfalt} data-lage={betalLage}>
                    {betalLage === "laddar" ? (
                      <div className={s.betalfaltLaddar} role="status" aria-label="Hämtar betalsätten">
                        <span />
                        <span />
                        <span />
                      </div>
                    ) : null}
                    <div ref={betalPlats} />
                  </div>
                  {betalLage === "fel" ? <p className={s.felText} role="alert">Betalsätten kunde inte laddas. Ladda om sidan och försök igen.</p> : null}
                  {betalFel ? <p className={s.betalFel} role="alert">{betalFel}</p> : null}
                  {snabbLage === "redo" ? (
                    <button type="button" className={`${s.lankLiten} ${s.tillSnabb}`} onClick={tillSnabbkassan}>
                      Betala med {planbokText} i stället
                      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-6 6 6-6 6 6" /></svg>
                    </button>
                  ) : null}
                </>
              ) : (
                <>
                  <p className={s.betalText}>Du väljer kort, Klarna eller Apple Pay på nästa sida, i Wix säkra betalning.</p>
                  <p className={s.betalNot}>Väljer du Klarna fyller du i namn och adress en gång till på nästa sida innan du skickas till Klarna. Med kort och Apple Pay går det direkt.</p>
                  <PaymentMarks />
                </>
              )}
              {kupongDel}
            </section>

            {meddelanden.length > 0 ? (
              <div className={s.meddelanden} role="alert">
                {meddelanden.map((m) => <p key={m}>{m}</p>)}
              </div>
            ) : null}

            <div className={s.betala}>
              {stripeNyckel ? (
                <button type="submit" className={s.knapp} disabled={skickar || !cartId || klarVantar || betalLage === "fel"} aria-busy={skickar}>
                  {skickar ? (
                    <><span className={s.knappSnurr} aria-hidden="true" />Behandlar betalningen …</>
                  ) : betalValt === "klarna" ? (
                    // Distansavtalslagen 2 kap. 9 §: knappen ska säga att beställningen kostar
                    // pengar. Kunden godkänner hos Klarna, men ordern skapas utan fler klick här.
                    <><Las storlek={16} />Betala med Klarna <span className={s.knappBelopp}>{belopp(totalOre)}</span></>
                  ) : (
                    <><Las storlek={16} />Betala <span className={s.knappBelopp}>{belopp(totalOre)}</span></>
                  )}
                </button>
              ) : (
                <button type="submit" className={s.knapp} disabled={skickar || !cartId} aria-busy={skickar}>
                  {skickar ? <><span className={s.knappSnurr} aria-hidden="true" />Öppnar betalningen …</> : <><Las storlek={16} />Till betalning <span className={s.knappBelopp}>{belopp(totalOre)}</span></>}
                </button>
              )}
              <p className={s.villkor}>
                Genom att {stripeNyckel ? "betala" : "gå vidare"} godkänner du våra{" "}
                <a href="/kopvillkor" target="_blank" rel="noopener">köpvillkor</a> och bekräftar att du läst vår{" "}
                <a href="/sekretesspolicy" target="_blank" rel="noopener">integritetspolicy</a>.
              </p>
              {stripeNyckel ? <div className={s.betalMarken}><PaymentMarks /></div> : null}
              <div className={s.fortroendeMobil}>{fortroende}</div>
            </div>
          </form>

          <aside className={s.sida2} aria-label="Din beställning">
            <div className={s.sidRubrikRad}>
              <h2 className={s.sidRubrik}>
                Din beställning
                {antalVaror > 0 ? <span className={s.sidRubrikAntal}>{antalVaror} {antalVaror === 1 ? "vara" : "varor"}</span> : null}
              </h2>
              <button type="button" className={s.andra} onClick={andraVarukorgen}>Ändra</button>
            </div>
            {sammanfattning}
            {fortroende}
          </aside>
        </div>
      </div>
      <KassaFot />

      {skickar ? (
        <div className={s.vantan} role="status" aria-live="polite" aria-busy="true">
          <div className={s.vantanKort}>
            <div className={s.vantanRing} aria-hidden="true">
              <Las storlek={26} />
            </div>
            <p className={s.vantanRubrik}>{stripeNyckel ? "Behandlar din betalning" : "Öppnar säker betalning"}</p>
            {harKorg ? <p className={s.vantanBelopp}>{kr(totalOre)} till Fyndplats</p> : null}
            <p className={s.vantanUnder}>{stripeNyckel ? "Stäng inte sidan. Det tar bara några sekunder." : "Det tar bara några sekunder."}</p>
            <ol className={s.vantanSteg}>
              {steglista.map((t, i) => (
                <li key={t} data-lage={i < steg ? "klar" : i === steg ? "nu" : "sen"}>
                  <span className={s.stegPrick} aria-hidden="true">
                    {i < steg ? <svg width="12" height="12" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" /></svg> : null}
                  </span>
                  {t}
                </li>
              ))}
            </ol>
            <div className={s.vantanBar} aria-hidden="true"><span data-steg={steg} /></div>
            <p className={s.vantanFot}>{stripeNyckel ? "Kort, Apple Pay, Google Pay och Klarna · krypterad betalning via Stripe" : "Kort, Klarna och Apple Pay · krypterad betalning hos Wix"}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
