// "Betala med Klarna" under priset på produktsidan.
//
// ☠️ BARA KLARNAS ALLMÄNNA TEXT, ALDRIG KREDIT (2026-11-14). Från 2026-11-20
// gäller det nya konsumentkreditdirektivet (CCD2), och Stripe mejlade alla
// handlare med Klarna i EU om det. Klarnas riktlinjer för Sverige
// (docs.klarna.com/acquirer/klarna/resources/marketing-tools/partner-marketing-legal-guidelines/sweden/,
// länkade från Stripes Klarna-sida) säger:
//   • Text som nämner att betala senare, om 30 dagar eller delbetalning är
//     kreditreklam. Den får bara stå i Klarnas exakta ordalydelse och ska ha
//     riskvarningen "Att låna kostar pengar!" med röd triangel, lika
//     framträdande och direkt intill, och ett exempel med effektiv ränta.
//   • Lägg aldrig till "räntefritt", en ränta eller ett månadsbelopp.
//   • "Betala med Klarna" och "Klarna tillgänglig" nämner bara Klarna som
//     betalsätt och behöver varken varning eller exempel.
// Raden sa förut "Betala senare – räntefritt med Klarna" och hade alltså fallit
// på båda punkterna. Ändra inte orden här (Klarnas regel), och skriv aldrig in
// dagar, ränta eller belopp. Klarnas egen ruta (klarna-osm.tsx) uppdateras av
// Klarna och får visa villkoren; den här raden är dess reserv och höjdhållare.
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
      <img src="/payments/klarna-badge.svg" alt="" width={72} height={30} />
      <span><strong>Betala med Klarna</strong></span>
    </div>
  );
}
