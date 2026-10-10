// Officiella betal-loggor (SVG i /public/payments). Delad, ren presentational
// komponent (inga server-/klient-beroenden, ingen "use client") → säker att
// importera i BÅDE serverträd (sidfoten, components/site.tsx) och klientträd
// (köp-blocket, components/productview.tsx).
//
// Samma betalsätt som köpvillkoren § 4: allt går via Klarna, som tar kort
// (Visa, Mastercard, American Express), Apple Pay och Google Pay. Varje märke
// sitter i en bricka med samma mått, så raden läser som en rad och inte som
// fem logotyper i olika storlekar. Klarna har sitt eget rosa märke i stället
// för en vit bricka — det är så Klarna själva vill att det visas.
// height/width satta på varje logga → ingen layout-shift.
// loading="lazy": utan det lade React en <link rel="preload"> per logga i
// sidhuvudet på VARJE sida (fem stycken, uppmätt 2026-10-07), som konkurrerade
// med sidans LCP-bild och typsnitt om de första anslutningarna. Loggorna står i
// sidfoten och under köpknappen.
// <img> och inte next/image, med flit: loggorna är små SVG-filer som
// next/image inte optimerar, och måtten står redan på varje logga.
/* eslint-disable @next/next/no-img-element */
import { GoogleG } from "./google-g";

export function PaymentMarks() {
  return (
    <ul className="paymarks" aria-label="Betalsätt vi accepterar">
      <li className="pay pay-klarna" title="Klarna">
        <img src="/payments/klarna-badge.svg" alt="Klarna" width={60} height={25} loading="lazy" decoding="async" />
      </li>
      <li className="pay" title="Visa">
        <img src="/payments/visa.svg" alt="Visa" width={34} height={11} loading="lazy" decoding="async" />
      </li>
      <li className="pay" title="Mastercard">
        <img src="/payments/mastercard.svg" alt="Mastercard" width={26} height={20} loading="lazy" decoding="async" />
      </li>
      <li className="pay pay-amex" title="American Express">
        <img src="/payments/amex.svg" alt="American Express" width={30} height={30} loading="lazy" decoding="async" />
      </li>
      <li className="pay" title="Apple Pay">
        <img src="/payments/applepay.svg" alt="Apple Pay" width={36} height={15} loading="lazy" decoding="async" />
      </li>
      <li className="pay pay-gpay" title="Google Pay">
        <GoogleG size={14} />
        <span>Pay</span>
      </li>
    </ul>
  );
}
