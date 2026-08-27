// "Betala senare – räntefritt med Klarna" under priset på produktsidan.
//
// VIKTIGT (verifierat mot Fyndplats Klarna-kassa 2026-06, payments.klarna.com):
//   • Klarnas MÅNADSFAKTURA (betala hela beloppet inom ~30 dagar) = 0 kr ränta → räntefri.
//   • Klarnas DELBETALNING (3 resp. 6 betalningar) = 21,90 % effektiv ränta → INTE räntefri.
// Därför får vi ALDRIG kalla delbetalningen "räntefri" eller visa ett "räntefritt
// månadsbelopp" — det vore ett felaktigt (och reglerat) kreditpåstående. Vi leder
// i stället med den ärligt räntefria fakturaoptionen (Klarnas "Betala senare").
//
// INGET DAGANTAL I VÅR EGEN RAD (2026-08-27). Raden sa tidigare "Betala inom 30
// dagar". Det var sant i vissa beloppsband men fel i andra: Klarnas eget API
// svarar "Betala inom 30 dagar" ELLER "Betala inom 60 dagar" beroende på belopp
// (mätt 2026-08-26 mot js.klarna.com för 99, 789, 2 579, 9 999 och 25 000 kr).
//
// Att skriva 30 underskattade alltså erbjudandet i 60-banden, och att skriva 60
// hade varit direkt falskt i 30-banden. Vi kan inte veta bandet här — det avgörs
// av Klarna per köp och kund — så vi anger inget antal alls. "Betala senare" är
// Klarnas eget namn på betalsättet och är sant i alla band.
//
// Det exakta dagantalet visas ändå: OSM-widgeten hämtar det från Klarna och tar
// över den här raden när den laddat (se klarna-osm.tsx). Vår rad är fallback och
// höjdhållare, och en fallback ska inte påstå mer än den kan veta.
//
// Inget externt script (snabbt + integritetsvänligt). Vill man visa exakta
// delbetalnings-/månadsbelopp MÅSTE det göras via Klarnas officiella On-Site Messaging-
// widget (som hämtar de verkliga villkoren inkl. ränta/representativt exempel).
//
// MÄRKET (bytt 2026-08-26): tidigare /payments/klarna.svg — bara "K."-glyfen i ett
// litet rosa chip, 28×22. Nu Klarnas riktiga bricka i 72×30: samma fil (deras
// klarna_v2_1.svg, vendad lokalt) och samma mått som OSM-widgeten renderar.
//
// Skälet är bytet. Den här raden syns medan widgeten laddar och ersätts av den när
// den är klar (se klarna-osm.tsx). Med olika märken hoppade texten 17px i sidled och
// brickan växte mitt framför ögonen på besökaren. Med samma bricka ligger raderna på
// samma indrag, och bytet syns bara som att orden ändras.
export function KlarnaMessage({ priceNum }: { priceNum: number }) {
  if (!priceNum || priceNum <= 0) return null;
  return (
    <div className="klarna-msg">
      <img src="/payments/klarna-badge.svg" alt="Klarna" width={72} height={30} />
      <span><strong>Betala senare</strong> – räntefritt med Klarna</span>
    </div>
  );
}
