// "Betala inom 30 dagar – räntefritt med Klarna" under priset på produktsidan.
//
// VIKTIGT (verifierat mot Fyndplats Klarna-kassa 2026-06, payments.klarna.com):
//   • Klarnas MÅNADSFAKTURA (betala hela beloppet inom ~30 dagar) = 0 kr ränta → räntefri.
//   • Klarnas DELBETALNING (3 resp. 6 betalningar) = 21,90 % effektiv ränta → INTE räntefri.
// Därför får vi ALDRIG kalla delbetalningen "räntefri" eller visa ett "räntefritt
// månadsbelopp" — det vore ett felaktigt (och reglerat) kreditpåstående. Vi leder
// i stället med den ärligt räntefria 30-dagars-optionen (Klarnas "Betala senare").
//
// Inget externt script (snabbt + integritetsvänligt). Klarnas rosa märke återanvänds
// (samma /public/payments/klarna.svg som betal-loggorna). Vill man senare visa exakta
// delbetalnings-/månadsbelopp MÅSTE det göras via Klarnas officiella On-Site Messaging-
// widget (som hämtar de verkliga villkoren inkl. ränta/representativt exempel).
export function KlarnaMessage({ priceNum }: { priceNum: number }) {
  if (!priceNum || priceNum <= 0) return null;
  return (
    <div className="klarna-msg">
      <img src="/payments/klarna.svg" alt="Klarna" width={18} height={18} />
      <span>Betala inom <strong>30 dagar</strong> – räntefritt med Klarna</span>
    </div>
  );
}
