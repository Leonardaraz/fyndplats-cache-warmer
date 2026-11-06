"use client";

// Vår egen kassa: kontakt, leverans och summering på www.fyndplats.se, sedan
// Wix betalsida (lib/kassa/flode.ts). Skälet till kassan är att Wix
// mobilkassa hoppade och lämnade tomrum på iPhone (2026-11-05), så sidan är
// byggd för att aldrig flytta det kunden skriver i:
//   • fälten har 16 px text (iPhone zoomar annars in när ett fält får fokus);
//   • inget ovanför fälten växer medan kunden skriver: summeringen i mobil är
//     stängd tills kunden öppnar den, och felrader har sin plats reserverad;
//   • knappen ligger fast längst ned i mobil, i sidans eget flöde.
//
// Wix betalsida har ingen väg tillbaka hit. Ordern som väntar på betalning
// sparas därför i sessionStorage, och när kunden kommer tillbaka (bakåtknappen
// eller en ny flik) frågar sidan om den är betald och går då till /tack.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCart, liImageUrl } from "../../components/cart";
import { PaymentMarks } from "../../components/payment-marks";
import { tightFillUrl } from "../../lib/wix-image";
import { DELIVERY_TIME, fraktKr } from "../../lib/shipping";
import { provaKassa, normalPostnr, type Falt } from "../../lib/kassa/formular";
import s from "./kassa.module.css";

type Varden = Record<"epost" | "fornamn" | "efternamn" | "telefon" | "gata" | "co" | "postnr" | "ort", string>;
const TOMT: Varden = { epost: "", fornamn: "", efternamn: "", telefon: "", gata: "", co: "", postnr: "", ort: "" };

interface Summa {
  delsummaOre: number | null;
  rabattOre: number;
  fraktOre: number | null;
  totalOre: number | null;
  fraktnamn: string | null;
  kupong: string | null;
}

/** En rad i varukorgen som CartProvider normaliserar den (lib/cart-shape.ts). */
interface KorgRadVy {
  _id?: string;
  productName?: { original?: string } | string;
  image?: unknown;
  price?: { formattedAmount?: string };
  quantity?: number;
}

interface Vantar {
  orderId: string;
  betalningId: string;
  cartId: string;
  url: string;
  at: number;
}

const ADRESS_NYCKEL = "fp_kassa_adress";
const VANTAR_NYCKEL = "fp_kassa_vantar";

function kr(ore: number | null | undefined): string {
  if (ore === null || ore === undefined || !Number.isFinite(ore)) return "–";
  const hela = Math.floor(Math.abs(ore) / 100);
  const oren = Math.abs(ore) % 100;
  const grupp = String(hela).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${ore < 0 ? "−" : ""}${grupp}${oren ? `,${String(oren).padStart(2, "0")}` : ""} kr`;
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

export function Kassa() {
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
  const [vantar, setVantar] = useState<Vantar | null>(null);
  const [kollar, setKollar] = useState(true);
  const [sammanfattningOppen, setSammanfattningOppen] = useState(false);
  const [senastPostnr, setSenastPostnr] = useState<string | null>(null);

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
  const kollaVantande = useCallback(async () => {
    const v = lasJson<Vantar>("session", VANTAR_NYCKEL);
    if (!v?.orderId) {
      setKollar(false);
      return;
    }
    try {
      const r = await fetch(`/api/kassa/status?order=${encodeURIComponent(v.orderId)}`, { cache: "no-store" });
      const j = await r.json();
      if (j?.betald) {
        skrivJson("session", VANTAR_NYCKEL, null);
        window.location.replace(`/tack?orderId=${encodeURIComponent(v.orderId)}`);
        return;
      }
      if (j?.finns === false || j?.avbruten) {
        skrivJson("session", VANTAR_NYCKEL, null);
        setVantar(null);
      } else {
        setVantar(v);
      }
    } catch {
      setVantar(v);
    }
    setKollar(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- den väntande ordern finns bara i webbläsarens sessionStorage
    kollaVantande();
    const visa = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setSkickar(false);
        kollaVantande();
      }
    };
    window.addEventListener("pageshow", visa);
    return () => window.removeEventListener("pageshow", visa);
  }, [kollaVantande]);

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
          setSumma({ delsummaOre: j.delsummaOre, rabattOre: j.rabattOre ?? 0, fraktOre: j.fraktOre, totalOre: j.totalOre, fraktnamn: j.fraktnamn, kupong: j.kupong });
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Wix räkning hämtas när korgen blir känd i webbläsaren
    if (cartId) rakna();
    // Bara när korgen byts; postnumret räknas vid blur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartId, rader.length]);

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
  const momsOre = Math.round(totalOre / 5);

  const skicka = async (e: React.FormEvent) => {
    e.preventDefault();
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
    setSkickar(true);
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
    setSkickar(false);
  };

  const anvandKupong = async () => {
    const kod = kupong.replace(/\s/g, "");
    setKupongFel(null);
    await rakna({ kupong: kod });
  };

  if (!cartId && !kollar && rader.length === 0) {
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
              <span className={s.radPris}>{li.price?.formattedAmount || ""}</span>
            </li>
          );
        })}
      </ul>
      <dl className={s.summor}>
        <div><dt>Delsumma</dt><dd>{kr(delsummaOre)}</dd></div>
        {summa && summa.rabattOre > 0 ? <div className={s.rabatt}><dt>Rabatt{summa.kupong ? ` (${summa.kupong})` : ""}</dt><dd>−{kr(summa.rabattOre)}</dd></div> : null}
        <div><dt>Frakt</dt><dd>{fraktOre === 0 ? "Fri frakt" : kr(fraktOre)}</dd></div>
        <div className={s.total}><dt>Att betala</dt><dd>{kr(totalOre)}</dd></div>
      </dl>
      <p className={s.moms}>Varav moms {kr(momsOre)}{raknar ? " · räknar …" : ""}</p>
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
          <strong>{kr(totalOre)}</strong>
        </button>
        {sammanfattningOppen ? sammanfattning : null}
      </div>

      {vantar ? (
        <div className={s.vantar} role="status">
          <strong>Betalningen är inte klar.</strong> Ordern väntar fortfarande. Gå tillbaka till betalningen, eller ändra uppgifterna nedan och fortsätt igen.
          <a className={s.vantarLank} href={vantar.url}>Till betalningen</a>
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
              <span className={s.fraktPrick} aria-hidden="true" />
              <span>
                <strong>{summa?.fraktnamn || "Spårbar standardleverans"}</strong>
                <span className={s.fraktTid}>{DELIVERY_TIME} · skickas från EU-lager</span>
              </span>
              <span className={s.fraktPris}>{fraktOre === 0 ? "Fri frakt" : kr(fraktOre)}</span>
            </div>
          </section>

          <section className={s.kort} aria-labelledby="kassa-betalning">
            <h2 id="kassa-betalning" className={s.steg}><span className={s.nr}>3</span> Betalning</h2>
            <p className={s.betalText}>Du väljer kort, Klarna eller Apple Pay på nästa sida, i Wix säkra betalning.</p>
            <PaymentMarks />
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
            <button type="submit" className={s.knapp} disabled={skickar || !cartId} aria-busy={skickar}>
              {skickar ? "Öppnar betalningen …" : <>Till betalning <span className={s.knappBelopp}>{kr(totalOre)}</span></>}
            </button>
            <p className={s.villkor}>
              Genom att gå vidare godkänner du våra <a href="/kopvillkor">köpvillkor</a> och bekräftar att du läst vår <a href="/sekretesspolicy">integritetspolicy</a>. 30 dagars öppet köp.
            </p>
          </div>
        </form>

        <aside className={s.sida2} aria-label="Din beställning">
          <h2 className={s.sidRubrik}>Din beställning</h2>
          {sammanfattning}
        </aside>
      </div>
    </main>
  );
}
