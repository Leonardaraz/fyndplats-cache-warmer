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
import { tightFillUrl } from "../../lib/wix-image";
import { DELIVERY_MAX_DAYS, DELIVERY_MIN_DAYS, DELIVERY_TIME, FREE_SHIPPING_FROM_KR, fraktKr } from "../../lib/shipping";
import { leveransIntervall } from "../../lib/leveransdatum";
import { provaKassa, normalPostnr, type Falt } from "../../lib/kassa/formular";
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

export function Kassa({ stripeNyckel = null }: { stripeNyckel?: string | null }) {
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

  const { cart } = useCart();
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- uppgifterna finns bara i webbläsaren; servern och första renderingen måste vara lika
    if (sparat) setVarden((v) => ({ ...v, ...Object.fromEntries(Object.entries(sparat).filter(([k, x]) => k in TOMT && typeof x === "string")) }));
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
    async (opts: { kupong?: string } = {}) => {
      if (!cartId) return;
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
        }
      } catch {
        /* summeringen visar butikens egen uppskattning tills nästa försök */
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

  const andra = (f: keyof Varden) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setVarden((x) => ({ ...x, [f]: v }));
    if (fel[f]) setFel((x) => ({ ...x, [f]: undefined }));
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
      setFel(prov.fel);
      const forsta = (Object.keys(prov.fel) as Falt[])[0];
      document.getElementById(`kassa-${forsta}`)?.focus();
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
    // Numret sparas som kunden skrev det ("070 …"), inte som Wix får det (+46…).
    skrivJson("local", ADRESS_NYCKEL, { ...prov.varden, telefon: varden.telefon.trim(), kupong: undefined });
    try {
      const r = await fetch("/api/kassa/stripe/forbered", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId, ...prov.varden, avsiktId: sparadAvsikt(lasJson("local", STRIPE_NYCKEL), cartId, Date.now()) }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok || typeof j.avsiktId !== "string") {
        if (j?.fel) setFel(j.fel);
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
      setFel(prov.fel);
      const forsta = (Object.keys(prov.fel) as Falt[])[0];
      document.getElementById(`kassa-${forsta}`)?.focus();
      return;
    }
    setFel({});
    visaVantan(0);
    // Numret sparas som kunden skrev det ("070 …"), inte som Wix får det (+46…).
    skrivJson("local", ADRESS_NYCKEL, { ...prov.varden, telefon: varden.telefon.trim(), kupong: undefined });
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
      if (j?.fel) setFel(j.fel);
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
    setKupongFel(null);
    await rakna({ kupong: kod });
  };

  if (!cartId && !kollar && !korgVantas && rader.length === 0) {
    return (
      <main className={s.sida}>
        <div className={s.tom}>
          <h1 className={s.rubrik}>Varukorgen är tom</h1>
          <p>Lägg något i varukorgen först, så kommer du hit när du vill betala.</p>
          <a className={s.knappSekundar} href="/butik">Till butiken</a>
        </div>
      </main>
    );
  }

  /** Beloppet, eller en platshållare med samma höjd medan korgen hämtas. */
  const belopp = (ore: number | null) => (harKorg ? kr(ore) : <span className={s.skelett} aria-label="Hämtar" />);

  const falt = (f: keyof Varden, etikett: string, props: React.InputHTMLAttributes<HTMLInputElement>, hjalp?: string) => (
    <div className={s.falt}>
      <label className={s.etikett} htmlFor={`kassa-${f}`}>{etikett}</label>
      <input
        id={`kassa-${f}`}
        name={f}
        className={`${s.input} ${fel[f as Falt] ? s.inputFel : ""}`}
        value={varden[f]}
        onChange={andra(f)}
        aria-invalid={fel[f as Falt] ? true : undefined}
        aria-describedby={`kassa-${f}-text`}
        {...props}
      />
      <div id={`kassa-${f}-text`} className={fel[f as Falt] ? s.felText : s.hjalpText} aria-live="polite">
        {fel[f as Falt] ?? hjalp ?? " "}
      </div>
    </div>
  );

  const sammanfattning = (
    <div className={s.summering}>
      <ul className={s.rader}>
        {rader.map((li) => {
          const bild = liImageUrl(li.image);
          const namn = (typeof li.productName === "string" ? li.productName : li.productName?.original) || "Vara";
          return (
            <li key={li._id} className={s.rad}>
              <span className={s.bild}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {bild ? <img src={tightFillUrl(bild, 112, 112)} alt="" width={56} height={56} loading="lazy" /> : null}
                {(li.quantity ?? 1) > 1 ? <span className={s.antal}>{li.quantity}</span> : null}
              </span>
              <span className={s.radNamn}>{namn}</span>
              <span className={s.radPris}>{radSumma(li)}</span>
            </li>
          );
        })}
      </ul>
      <dl className={s.summor}>
        <div><dt>Delsumma</dt><dd>{belopp(delsummaOre)}</dd></div>
        {summa && summa.rabattOre > 0 ? <div className={s.rabatt}><dt>Rabatt{summa.kupong ? ` (${summa.kupong})` : ""}</dt><dd>−{kr(summa.rabattOre)}</dd></div> : null}
        <div><dt>Frakt</dt><dd>{harKorg ? (fraktOre === 0 ? "Fri frakt" : kr(fraktOre)) : belopp(null)}</dd></div>
        {harKorg && fraktOre > 0 && kvarTillFri > 0 ? (
          <div className={s.friFrakt}><dt>Handla för {kr(kvarTillFri)} till så blir frakten gratis</dt><dd /></div>
        ) : null}
        <div className={s.total}><dt>Att betala</dt><dd>{belopp(totalOre)}</dd></div>
      </dl>
      <p className={s.moms}>{harKorg ? <>Varav moms {kr(momsOre)}{raknar ? " · räknar …" : ""}</> : " "}</p>
    </div>
  );

  return (
    <main className={s.sida}>
      <div className={s.topp}>
        <h1 className={s.rubrik}>Kassa</h1>
        <span className={s.saker} aria-label="Säker kassa">
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z" /></svg>
          Säker kassa
        </span>
      </div>

      {/* Mobil: summeringen stängd ovanför formuläret, så att inget flyttar fälten. */}
      <div className={s.mobilSummering}>
        <button type="button" className={s.visaSummering} aria-expanded={sammanfattningOppen} onClick={() => setSammanfattningOppen((v) => !v)}>
          <span>{sammanfattningOppen ? "Dölj din beställning" : "Visa din beställning"}</span>
          <strong>{belopp(totalOre)}</strong>
        </button>
        {sammanfattningOppen ? sammanfattning : null}
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
            {falt("epost", "E-post", { type: "email", autoComplete: "email", inputMode: "email", autoCapitalize: "none", spellCheck: false, enterKeyHint: "next" }, "Orderbekräftelsen kommer hit.")}
            {falt("telefon", "Mobilnummer", { type: "tel", autoComplete: "tel", inputMode: "tel", enterKeyHint: "next" }, "Transportören aviserar dit.")}
          </section>

          <section className={s.kort} aria-labelledby="kassa-leverans">
            <h2 id="kassa-leverans" className={s.steg}><span className={s.nr}>2</span> Leverans</h2>
            <div className={s.tva}>
              {falt("fornamn", "Förnamn", { autoComplete: "given-name", enterKeyHint: "next" })}
              {falt("efternamn", "Efternamn", { autoComplete: "family-name", enterKeyHint: "next" })}
            </div>
            {falt("gata", "Gatuadress", { autoComplete: "address-line1", enterKeyHint: "next" })}
            {falt("co", "c/o (frivilligt)", { autoComplete: "address-line2", enterKeyHint: "next" })}
            <div className={s.postrad}>
              {falt("postnr", "Postnummer", { autoComplete: "postal-code", inputMode: "numeric", maxLength: 6, onBlur: postnrKlart, enterKeyHint: "next" })}
              {falt("ort", "Ort", { autoComplete: "address-level2", enterKeyHint: "done" })}
            </div>
            <div className={s.frakt}>
              <span className={s.fraktIkon} aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M3 6.5h11v9H3zM14 9.5h3.6l3.4 3.4v2.6h-7M6.5 18.5a1.75 1.75 0 1 0 0-.01M17.5 18.5a1.75 1.75 0 1 0 0-.01" /></svg>
              </span>
              <span>
                <strong>{summa?.fraktnamn || "Spårbar standardleverans"}</strong>
                <span className={s.fraktTid}>{levDatum ? `Beräknad leverans ${levDatum}` : DELIVERY_TIME}</span>
                <span className={s.fraktTid}>Från EU-lager · spårningslänk via e-post när paketet skickas</span>
              </span>
              <span className={s.fraktPris}>{harKorg ? (fraktOre === 0 ? "Fri frakt" : kr(fraktOre)) : belopp(null)}</span>
            </div>
          </section>

          <section className={s.kort} aria-labelledby="kassa-betalning">
            <h2 id="kassa-betalning" className={s.steg}><span className={s.nr}>3</span> Betalning</h2>
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
                <p className={s.betalSaker}>
                  <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z" /></svg>
                  Krypterad betalning via Stripe. Kortuppgifterna når aldrig Fyndplats, och inget dras förrän ordern är lagd.
                </p>
              </>
            ) : (
              <>
                <p className={s.betalText}>Du väljer kort, Klarna eller Apple Pay på nästa sida, i Wix säkra betalning.</p>
                <p className={s.betalNot}>Väljer du Klarna fyller du i namn och adress en gång till på nästa sida innan du skickas till Klarna. Med kort och Apple Pay går det direkt.</p>
                <PaymentMarks />
              </>
            )}
            {kupongOppen ? (
              <div className={s.kupong}>
                <label className={s.etikett} htmlFor="kassa-kupong">Rabattkod</label>
                <div className={s.kupongRad}>
                  <input id="kassa-kupong" className={`${s.input} ${kupongFel ? s.inputFel : ""}`} value={kupong} onChange={(e) => { setKupong(e.target.value); setKupongFel(null); }} autoCapitalize="characters" autoComplete="off" spellCheck={false} />
                  <button type="button" className={s.knappSekundar} onClick={anvandKupong} disabled={raknar || !kupong.trim()}>Använd</button>
                </div>
                <div className={kupongFel ? s.felText : s.hjalpText} aria-live="polite">{kupongFel ?? (summa?.kupong ? `${summa.kupong} är tillagd.` : " ")}</div>
              </div>
            ) : (
              <button type="button" className={s.lank} onClick={() => setKupongOppen(true)}>Har du en rabattkod?</button>
            )}
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
                  "Behandlar betalningen …"
                ) : betalValt === "klarna" ? (
                  // Distansavtalslagen 2 kap. 9 §: knappen ska säga att beställningen kostar
                  // pengar. Kunden godkänner hos Klarna, men ordern skapas utan fler klick här.
                  <>Betala med Klarna <span className={s.knappBelopp}>{belopp(totalOre)}</span></>
                ) : (
                  <>Betala <span className={s.knappBelopp}>{belopp(totalOre)}</span></>
                )}
              </button>
            ) : (
              <button type="submit" className={s.knapp} disabled={skickar || !cartId} aria-busy={skickar}>
                {skickar ? "Öppnar betalningen …" : <>Till betalning <span className={s.knappBelopp}>{belopp(totalOre)}</span></>}
              </button>
            )}
            <p className={s.villkor}>
              Genom att {stripeNyckel ? "betala" : "gå vidare"} godkänner du våra <a href="/kopvillkor">köpvillkor</a> och bekräftar att du läst vår <a href="/sekretesspolicy">integritetspolicy</a>. 30 dagars öppet köp.
            </p>
          </div>
        </form>

        <aside className={s.sida2} aria-label="Din beställning">
          <h2 className={s.sidRubrik}>Din beställning</h2>
          {sammanfattning}
        </aside>
      </div>

      {skickar ? (
        <div className={s.vantan} role="status" aria-live="polite" aria-busy="true">
          <div className={s.vantanKort}>
            <div className={s.vantanRing} aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z" /></svg>
            </div>
            <p className={s.vantanRubrik}>{stripeNyckel ? "Behandlar din betalning" : "Öppnar säker betalning"}</p>
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
    </main>
  );
}
