"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { trackPurchase } from "../lib/analytics";

// Post-checkout "tack"-sida. Wix Ecom redirectar hit efter completed checkout
// (via postFlowUrl satt i cart.tsx). Wix kan appenda ?orderId= eller liknande
// query-param med order-ID — vi läser flera vanliga fält defensivt.
//
// Anonymiseringsboundary: vi visar bara ordernumret + generisk leverans-info,
// INTE några sourcing-detaljer. Wix Ecom skickar order-bekräftelse-mejl med
// fullständiga detaljer separat.
export function ThankYou() {
  const params = useSearchParams();
  // Wix Headless redirect-params variera över versioner — prova flera
  const orderId =
    params.get("orderId") ||
    params.get("orderNumber") ||
    params.get("order") ||
    params.get("orderID");

  // Rensa lokal cart-cookie så cart-bubblen i header visar 0 efter köp.
  // (Wix tömmer cart server-side när checkout completes, men vår client-state
  // kan hänga kvar på gammal data tills nästa refresh.)
  useEffect(() => {
    // GA4 purchase — kritisk för Google Ads konvertering. Läser
    // fp_purchase_pending-snapshoten som cart.tsx stashar innan kassan öppnas
    // (Wix redirectar tillbaka utan items i URL:en). Dedupar internt på
    // transaction_id så att F5 inte rapporterar dubbla konverteringar.
    trackPurchase(orderId);
    Cookies.remove("fp_cart");
    Cookies.remove("session"); // tvingar ny visitor-session vid nästa /butik-besök
  }, [orderId]);

  return (
    <div className="tack-wrap">
      <div className="tack-check" aria-hidden>
        <svg viewBox="0 0 100 100" width="84" height="84">
          <circle
            cx="50" cy="50" r="46"
            fill="none" stroke="#16804a" strokeWidth="6"
            strokeDasharray="289" strokeDashoffset="289"
            className="tack-circle"
          />
          <path
            d="M30 52 L45 67 L72 38"
            fill="none" stroke="#16804a" strokeWidth="7"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="80" strokeDashoffset="80"
            className="tack-tick"
          />
        </svg>
      </div>

      <div className="eyebrow">Beställning mottagen</div>
      <h1 className="tack-title">Tack för din order!</h1>

      {orderId && (
        <div className="tack-orderno">
          <span className="tack-orderno-label">Ordernummer</span>
          <span className="tack-orderno-val">#{orderId}</span>
        </div>
      )}

      <p className="tack-lede">
        Vi har skickat en orderbekräftelse till din e-post med alla detaljer.
        Du får ett nytt mejl med spårningsnummer när paketet är på väg
        – brukar ta <b>1–3 arbetsdagar</b>.
      </p>

      <div className="tack-next">
        <div className="tack-step done">
          <div className="tack-step-icon" aria-hidden>✉️</div>
          <div className="tack-step-text">
            <strong>Bekräftelse skickad</strong>
            <span>Kolla din inkorg</span>
          </div>
        </div>
        <div className="tack-step">
          <div className="tack-step-icon" aria-hidden>📦</div>
          <div className="tack-step-text">
            <strong>Förbereds & skickas</strong>
            <span>Inom 1–3 arbetsdagar</span>
          </div>
        </div>
        <div className="tack-step">
          <div className="tack-step-icon" aria-hidden>🚚</div>
          <div className="tack-step-text">
            <strong>Beräknad leverans</strong>
            <span>5–15 arbetsdagar</span>
          </div>
        </div>
      </div>

      <div className="tack-trust">
        <span><i className="dot" /> Fri frakt över 499 kr</span>
        <span><i className="dot" /> 30 dagars öppet köp</span>
        <span><i className="dot" /> Trygg Klarna-betalning</span>
      </div>

      <div className="tack-actions">
        <a className="btn btn-primary" href="/butik">Fortsätt handla →</a>
        <a className="btn btn-ghost" href="/sparning">Spåra paket</a>
      </div>

      <div className="tack-help">
        <p>
          Frågor om din order? Hör av dig till{" "}
          <a href="mailto:info@fyndplats.com">info@fyndplats.com</a> eller{" "}
          <a href="tel:+46736630990">+46 (0) 736 630 990</a>. Vi svarar normalt
          inom 24 timmar.
        </p>
      </div>
    </div>
  );
}
