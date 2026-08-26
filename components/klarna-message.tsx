// "Betala inom 30 dagar – räntefritt med Klarna" under priset på produktsidan.
//
// VIKTIGT (verifierat mot Fyndplats Klarna-kassa 2026-06, payments.klarna.com):
//   • Klarnas MÅNADSFAKTURA (betala hela beloppet inom ~30 dagar) = 0 kr ränta → räntefri.
//   • Klarnas DELBETALNING (3 resp. 6 betalningar) = 21,90 % effektiv ränta → INTE räntefri.
// Därför får vi ALDRIG kalla delbetalningen "räntefri" eller visa ett "räntefritt
// månadsbelopp" — det vore ett felaktigt (och reglerat) kreditpåstående. Vi leder
// i stället med den ärligt räntefria 30-dagars-optionen (Klarnas "Betala senare").
//
// Inget externt script (snabbt + integritetsvänligt). Vill man visa exakta
// delbetalnings-/månadsbelopp MÅSTE det göras via Klarnas officiella On-Site Messaging-
// widget (som hämtar de verkliga villkoren inkl. ränta/representativt exempel).
//
// MÄRKET (bytt 2026-08-26): tidigare /payments/klarna.svg — bara "K."-glyfen i ett
// litet rosa chip, 28×22. Nu Klarnas riktiga bricka i 45×30, samma mått och samma
// grafik som OSM-widgeten renderar med data-logo-type="badge".
//
// Skälet är bytet. Den här raden syns medan widgeten laddar och ersätts av den när
// den är klar (se klarna-osm.tsx). Med olika märken hoppade texten 17px i sidled och
// brickan växte mitt framför ögonen på besökaren. Med samma bricka ligger raderna på
// samma indrag, och bytet syns bara som att orden ändras.
export function KlarnaMessage({ priceNum }: { priceNum: number }) {
  if (!priceNum || priceNum <= 0) return null;
  return (
    <div className="klarna-msg">
      <img src="/payments/klarna-badge.svg" alt="Klarna" width={45} height={30} />
      <span>Betala inom <strong>30 dagar</strong> – räntefritt med Klarna</span>
    </div>
  );
}
