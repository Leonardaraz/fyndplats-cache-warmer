"use client";
import { useEffect, useState } from "react";
import { useCart } from "./cart";

// Exit-intent-påminnelse för varukorgen. Triggar när muspekaren lämnar
// viewporten uppåt (mot flik-/adressfältet) MEDAN kundvagnen har varor — det
// klassiska tecknet på att besökaren är på väg att lämna. Visas max en gång per
// session (sessionStorage).
//
// OBS om "checkout/cart-sidan": Fyndplats kassa är Wix-hostad på en separat
// domän (checkout.fyndplats.se) och kan inte instrumenteras härifrån, och det
// finns ingen fristående cart-route — varukorgen är en drawer. Den enda
// meningsfulla "cart-ytan" i den här kodbasen är därför "kundvagn har varor".
// Vi mountar globalt men grindar hårt på count > 0, så popupen visas bara i
// just det läget (= cart-kontext), aldrig för en tom katalogbesökare.

const SESSION_KEY = "fp_exit_intent_shown";

function shownThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markShown(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {}
}

export function ExitIntentCart() {
  const { count, setOpen, checkout, busy } = useCart();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Inget att påminna om utan varor, och bara en gång per session.
    if (count <= 0 || shownThisSession()) return;

    const onMouseOut = (e: MouseEvent) => {
      // Lämnar mot toppen: pekaren ut ur dokumentet (relatedTarget null) och
      // y vid/ovanför kanten. Touch-enheter har ingen mouseout → ofarligt.
      if (e.clientY > 0) return;
      if (e.relatedTarget) return;
      if (shownThisSession()) return;
      markShown();
      setShow(true);
      document.removeEventListener("mouseout", onMouseOut);
    };

    document.addEventListener("mouseout", onMouseOut);
    return () => document.removeEventListener("mouseout", onMouseOut);
  }, [count]);

  const close = () => {
    setShow(false);
  };

  const toCheckout = async () => {
    close();
    try {
      await checkout();
    } catch {
      // checkout() visar redan eget fel-alert; öppna drawern som fallback.
      setOpen(true);
    }
  };

  if (!show) return null;

  return (
    <div className="xpop-ov" role="dialog" aria-modal="true" aria-label="Glöm inte din varukorg" onClick={close}>
      <div className="xpop" onClick={(e) => e.stopPropagation()}>
        <button className="xpop-x" onClick={close} aria-label="Stäng">✕</button>
        <div className="xpop-ic" aria-hidden="true">🛒</div>
        <h2 className="xpop-title">Glöm inte din varukorg!</h2>
        <p className="xpop-sub">Du har varor kvar i kundvagnen. Slutför din beställning nu – och få <strong>fri frakt</strong> på din order.</p>
        <button className="xpop-cta" onClick={toCheckout} disabled={busy}>
          {busy ? "Öppnar kassan…" : "Fortsätt till kassan →"}
        </button>
        <button type="button" className="xpop-nothanks" onClick={close}>Nej tack</button>
      </div>
    </div>
  );
}
