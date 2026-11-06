"use client";

// Vår egen kassa: kontakt, leverans, betalning och summering på
// www.fyndplats.se. Två sätt att betala, valda av page.tsx:
//   • Stripe (när nycklarna finns, Leonards val 2026-11-06): betalfältet står i
//     steg 3 på sidan, med kort, Apple Pay, Google Pay och Klarna (i den
//     ordningen: betaltjänstlagen, se BETALFALT). Kunden skriver sina
//     uppgifter EN gång; de följer med till Klarna.
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
import { PaymentMarks } from "../../components/payment-marks";
import { GoogleG } from "../../components/google-g";
import { tightFillUrl } from "../../lib/wix-image";
import { valdaAlternativ } from "../../lib/cart-shape";
import { DELIVERY_MAX_DAYS, DELIVERY_MIN_DAYS, DELIVERY_TIME, FREE_SHIPPING_FROM_KR, fraktKr } from "../../lib/shipping";
import { leveransIntervall } from "../../lib/leveransdatum";
import { faltGiltigt, forstaFel, provaKassa, normalPostnr, snyggtTelefon, type Falt } from "../../lib/kassa/formular";
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
import { useStripeBetalning } from "./use-stripe-betalning";
import { KassaFot, KassaHuvud, Las } from "./kassa-ram";
import s from "./kassa.module.css";

type Varden = Record<"epost" | "fornamn" | "efternamn" | "telefon" | "gata" | "co" | "postnr" | "ort", string>;
const TOMT: Varden = { epost: "", fornamn: "", efternamn: "", telefon: "", gata: "", co: "", postnr: "", ort: "" };

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

/** Fält vars fel kunden ser under fältet (rabattkoden har en egen rad). */
type FormFalt = keyof Varden;

/**
 * Kassan. `betyg` är butikens Google-betyg ("4,9", lib/social-proof-live.ts),
 * som page.tsx läser på servern; null visar ingen betygsrad.
 */
export function Kassa({ stripeNyckel = null, betyg = null }: { stripeNyckel?: string | null; betyg?: string | null }) {
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
  const cartId: string = cart?._id || "";
  const rader: KorgRadVy[] = useMemo(() => cart?.lineItems ?? [], [cart]);
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

  // Sparade uppgifter från förra gången (bara i den här webbläsaren).
  useEffect(() => {
    const sparat = lasJson<Partial<Varden>>("local", ADRESS_NYCKEL);
    if (!sparat || typeof sparat !== "object") return;
    const giltigt = Object.fromEntries(Object.entries(sparat).filter(([k, x]) => k in TOMT && typeof x === "string")) as Partial<Varden>;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- uppgifterna finns bara i webbläsaren; servern och första renderingen måste vara lika
    setVarden((v) => ({ ...v, ...giltigt }));
    // Kunden valde att spara förra gången: valet står kvar tills hen tar bort det.
    setKomIhag(true);
    if (giltigt.co) setCoOppen(true);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Wix räkning hämtas när korgen blir känd i webbläsaren
    if (cartId) rakna();
    // Bara när korgen eller dess innehåll byts; postnumret räknas vid blur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartId, korgSignatur]);

  const andra = (f: FormFalt) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setVarden((x) => ({ ...x, [f]: v }));
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
    if (forsta) window.requestAnimationFrame(() => document.getElementById(`kassa-${forsta}`)?.focus());
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
  const {
    plats: betalPlats,
    lage: betalLage,
    valt: betalValt,
    stripe: stripeRef,
    elements: elementsRef,
    visat: visatRef,
  } = useStripeBetalning(stripeNyckel, harKorg && totalOre > 0 ? totalOre : null);
  const steglista: readonly string[] = stripeNyckel ? stripeSteg(betalValt) : STEG;

  /** Väntan på ett bestämt steg, utan Wix-vägens klocka. */
  const stegTill = (n: number) => {
    stoppaSteg();
    setSteg(n);
    setSkickar(true);
  };

  /** Ordern finns: det sparade försöket är förbrukat, och kunden går till tacksidan. */
  const tillTack = (orderId: string) => {
    skrivJson("local", STRIPE_NYCKEL, null);
    window.location.replace(`/tack?orderId=${encodeURIComponent(orderId)}`);
  };

  /**
   * Betalningen är godkänd (eller var det redan): servern gör ordern
   * (vantaPaOrder frågar tills den finns). Efter en minut säger sidan att
   * bekräftelsen kommer via e-post (webhooken och nätet slutför), och kunden
   * kan inte betala igen.
   */
  const slutforStripe = async (avsiktId: string) => {
    stegTill(2);
    const b = await vantaPaOrder(avsiktId);
    if (b.gor === "tack") {
      tillTack(b.orderId);
      return;
    }
    if (b.gor === "fel") {
      // Ingen order: reservationen är släppt. Kunden kan försöka igen med en ny betalning.
      skrivJson("local", STRIPE_NYCKEL, null);
      setMeddelanden(b.meddelanden);
      doljVantan();
      pagar.current = false;
      rakna();
      return;
    }
    setKlarVantar(true);
    doljVantan();
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
    if (!prov.ok) {
      visaFel(prov.fel);
      return;
    }
    setFel({});
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements || betalLage !== "redo") {
      setBetalFel(betalLage === "fel" ? "Betalsätten kunde inte laddas. Ladda om sidan och försök igen." : "Betalsätten laddas. Vänta ett ögonblick och försök igen.");
      return;
    }
    pagar.current = true;
    // ☠️ FÖRST, i själva trycket: Apple Pay och Google Pay öppnar sitt blad bara
    // i ett tryck, och efter ett nätverksanrop räknas det inte längre som ett.
    let inskickat: Awaited<ReturnType<typeof elements.submit>>;
    try {
      inskickat = await elements.submit();
    } catch {
      pagar.current = false;
      setBetalFel(betalfelText(null));
      return;
    }
    if (inskickat.error) {
      pagar.current = false;
      setBetalFel(betalfelText(inskickat.error));
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
          setFel((x) => ({ ...x, postnr: j.meddelanden?.[0] ?? "Kontrollera postnumret." }));
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

  if (!cartId && !kollar && !korgVantas && rader.length === 0) {
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
    const ok = !visaFelText && rorda.has(f) && faltGiltigt(f, varden[f]);
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
      <button type="button" onClick={() => setVarden((x) => ({ ...x, epost: epostTips }))}>
        {epostTips}
      </button>
      ?
    </span>
  ) : (
    "Orderbekräftelsen och spårningen kommer hit."
  );

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
  ) : (
    <button type="button" className={s.lank} onClick={() => setKupongOppen(true)}>Har du en rabattkod?</button>
  );

  return (
    <div className={s.sida} data-kassa-sida="">
      <KassaHuvud tillVarukorgen={() => oppnaVarukorgen(true)} />
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
              {sammanfattningOppen ? "Dölj beställningen" : "Visa beställningen"}
              {antalVaror > 0 ? <span className={s.visaSummeringAntal}>({antalVaror} {antalVaror === 1 ? "vara" : "varor"})</span> : null}
              <svg className={s.chevron} data-oppen={sammanfattningOppen ? "ja" : undefined} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg>
            </span>
            <strong>{belopp(totalOre)}</strong>
          </button>
          {sammanfattningOppen ? (
            <div id="kassa-summering-mobil" className={s.mobilSummeringInnehall}>
              {sammanfattning}
              <button type="button" className={s.andraMobil} onClick={() => oppnaVarukorgen(true)}>Ändra varukorgen</button>
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
            <section className={s.kort} aria-labelledby="kassa-kontakt">
              <h2 id="kassa-kontakt" className={s.steg}><span className={s.nr}>1</span> Kontakt</h2>
              {falt("epost", "E-postadress", { type: "email", autoComplete: "email", inputMode: "email", autoCapitalize: "none", spellCheck: false, enterKeyHint: "next" }, epostHjalp)}
              {falt("telefon", "Mobilnummer", { type: "tel", autoComplete: "tel", inputMode: "tel", enterKeyHint: "next" }, "Transportören aviserar dit.")}
            </section>

            <section className={s.kort} aria-labelledby="kassa-leverans">
              <h2 id="kassa-leverans" className={s.steg}><span className={s.nr}>2</span> Leverans</h2>
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
                {falt("ort", "Ort", { autoComplete: "shipping address-level2", autoCapitalize: "words", enterKeyHint: "done" })}
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
              <button type="button" className={s.andra} onClick={() => oppnaVarukorgen(true)}>Ändra</button>
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
