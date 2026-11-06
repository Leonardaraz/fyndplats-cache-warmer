"use client";

// Påminnelsemejlets länk (lib/kassa/aterta.ts). Servern prövar korgens varor
// mot katalogen (/api/kassa/aterta); här läggs de som saknas i besökarens
// varukorg (lib/kassa/aterta-korg.ts, så att en andra öppning inte ger
// dubbletter), och kunden går till kassan. Rabattkoden från mejl 3 följer med
// som ?kod= och läggs på där. Är vår kassa avstängd öppnas varukorgen i
// stället, och "Till kassan" går till Wix kassa som för alla andra.
//
// Var en vara slut eller borta stannar kunden här och får veta det, med en
// knapp vidare. Annars går det av sig självt.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../../components/cart";
import { attLaggaI, korgensRader, tillKassan, type Atertarad } from "../../../lib/kassa/aterta-korg";
import { kopIgenBesked } from "../../../lib/medlem/kop-igen";
import { KassaFot, KassaHuvud, Las } from "../kassa-ram";
import s from "../kassa.module.css";

type Lage =
  | { steg: "hamtar" }
  | { steg: "besked"; text: string; vidare: string }
  | { steg: "fel"; rubrik: string; text: string; igen: boolean };

const FEL: Record<string, { rubrik: string; text: string; igen: boolean }> = {
  ogiltig: { rubrik: "Länken fungerar inte", text: "Öppna länken direkt från mejlet. Varorna du tittade på finns kvar i butiken.", igen: false },
  saknas: { rubrik: "Varukorgen finns inte längre", text: "Den är för gammal eller tömd. Varorna du tittade på finns kvar i butiken.", igen: false },
  kopt: { rubrik: "Det här köpet är redan klart", text: "Orderbekräftelsen ligger i din e-post. Tack för att du handlar hos oss!", igen: false },
  tillfalligt: { rubrik: "Varukorgen gick inte att öppna", text: "Försök igen om en liten stund.", igen: true },
};

/** Väntar in besökarens varukorg från Wix när kakan säger att det finns en (components/cart.tsx), högst åtta sekunder. */
function harKorgKaka(): boolean {
  try {
    return /(?:^|;\s*)fp_cart=/.test(document.cookie);
  } catch {
    return false;
  }
}

export function Aterta() {
  const { cart, addMany, setOpen } = useCart();
  const router = useRouter();
  const [lage, setLage] = useState<Lage>({ steg: "hamtar" });
  const [forsok, setForsok] = useState(0);
  const [korgKlar, setKorgKlar] = useState(false);
  const startad = useRef(-1);

  // Besökarens egen varukorg måste vara hämtad innan vi jämför, annars kan varorna läggas i två gånger.
  useEffect(() => {
    if (cart || !harKorgKaka()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- kakan och korgen finns bara i webbläsaren
      setKorgKlar(true);
      return;
    }
    const t = window.setTimeout(() => setKorgKlar(true), 8_000);
    return () => window.clearTimeout(t);
  }, [cart]);

  useEffect(() => {
    if (!korgKlar || startad.current === forsok) return;
    startad.current = forsok;
    const q = new URLSearchParams(window.location.search);
    const k = q.get("k") ?? "";
    const kod = q.get("kod");
    void (async () => {
      try {
        const [r, l] = await Promise.all([
          fetch("/api/kassa/aterta", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ k }), cache: "no-store" }),
          fetch("/api/kassa/lage", { cache: "no-store" }).then((x) => x.json()).catch(() => null),
        ]);
        const j = await r.json().catch(() => null);
        if (!j?.ok) {
          setLage({ steg: "fel", ...(FEL[j?.skal as string] ?? FEL.tillfalligt) });
          return;
        }
        const rader: Atertarad[] = Array.isArray(j.rader) ? j.rader : [];
        // Samma korg (samma telefon, ingenting köpt sedan): varorna ligger redan där.
        const saknas = cart?._id === j.cartId ? [] : attLaggaI(rader, korgensRader(cart));
        if (saknas.length > 0) {
          const ok = await addMany(saknas.map((x) => ({ id: x.produktId, variantId: x.variantId, antal: x.antal })));
          if (!ok) {
            setOpen(false);
            setLage({ steg: "fel", ...FEL.tillfalligt });
            return;
          }
        }
        const egen = l?.egen === true;
        const besked = kopIgenBesked(rader.length, Number(j.slut) || 0, Number(j.borta) || 0, "korgen");
        if (!egen) {
          // Vår kassa är avstängd: varukorgen öppnas, och dess knapp går till Wix kassa.
          setOpen(true);
          if (besked) setLage({ steg: "besked", text: besked, vidare: "" });
          else router.replace("/");
          return;
        }
        setOpen(false);
        if (besked && rader.length === 0) {
          setLage({ steg: "fel", rubrik: "Varorna går inte att köpa just nu", text: besked, igen: false });
        } else if (besked) {
          setLage({ steg: "besked", text: besked, vidare: tillKassan(kod) });
        } else {
          router.replace(tillKassan(kod));
        }
      } catch {
        setLage({ steg: "fel", ...FEL.tillfalligt });
      }
    })();
  }, [korgKlar, forsok, cart, addMany, setOpen, router]);

  // Kassans eget sidhuvud och sidfot (kassa-ram.tsx). Ingen <main>: layouten har redan en.
  return (
    <div className={s.sida} data-kassa-sida="">
      <KassaHuvud />
      <div className={s.klarYta}>
        {lage.steg === "hamtar" ? (
          <div className={`${s.vantanKort} ${s.klarKort}`} role="status" aria-live="polite" aria-busy="true">
            <div className={s.vantanRing} aria-hidden="true">
              <Las storlek={26} />
            </div>
            <p className={s.vantanRubrik}>Din varukorg laddas</p>
            <p className={s.vantanUnder}>Varorna läggs i varukorgen och du kommer till kassan.</p>
          </div>
        ) : lage.steg === "besked" ? (
          <div className={s.tom} role="status" aria-live="polite">
            <h1 className={s.rubrik}>Din varukorg är tillbaka</h1>
            <p>{lage.text}</p>
            {lage.vidare ? (
              <button type="button" className={s.knapp} onClick={() => router.replace(lage.vidare)}>
                Till kassan
              </button>
            ) : (
              <a className={s.knappSekundar} href="/butik">
                Till butiken
              </a>
            )}
          </div>
        ) : (
          <div className={s.tom} role="alert">
            <h1 className={s.rubrik}>{lage.rubrik}</h1>
            <p>{lage.text}</p>
            {lage.igen ? (
              <button
                type="button"
                className={s.knapp}
                onClick={() => {
                  setLage({ steg: "hamtar" });
                  setForsok((n) => n + 1);
                }}
              >
                Försök igen
              </button>
            ) : (
              <a className={s.knappSekundar} href="/butik">
                Till butiken
              </a>
            )}
          </div>
        )}
      </div>
      <KassaFot />
    </div>
  );
}
