// Officiella betal-loggor (SVG i /public/payments). Delad, ren presentational
// komponent (inga server-/klient-beroenden, ingen "use client") → säker att
// importera i BÅDE serverträd (sidfoten, components/site.tsx) och klientträd
// (köp-blocket, components/productview.tsx). Vita chips, Klarna i signaturrosa.
// height/width satta på varje logga → ingen layout-shift.
export function PaymentMarks() {
  return (
    <div className="paymarks" aria-label="Betalsätt vi accepterar">
      <span className="pay pay-klarna" title="Klarna"><img src="/payments/klarna.svg" alt="Klarna" width={18} height={18} /></span>
      <span className="pay" title="Visa"><img src="/payments/visa.svg" alt="Visa" width={56} height={18} /></span>
      <span className="pay" title="Mastercard"><img src="/payments/mastercard.svg" alt="Mastercard" width={23} height={18} /></span>
      <span className="pay" title="American Express"><img src="/payments/amex.svg" alt="American Express" width={18} height={18} /></span>
      <span className="pay" title="Apple Pay"><img src="/payments/applepay.svg" alt="Apple Pay" width={44} height={18} /></span>
    </div>
  );
}
