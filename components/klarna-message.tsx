// "Dela upp i 3 räntefria delar à X kr med Klarna" under priset på produktsidan.
//
// Klarna "Betala i 3" är RÄNTEFRITT → delbeloppet är exakt pris/3 (ingen ränta →
// ingen representativt-exempel-komplexitet enligt konsumentkreditlagen). Egen
// uträkning, INGET externt script (snabbt + integritetsvänligt, i linje med resten
// av sajten — vi consent-gatar tredjeparts-skript). Klarnas rosa märke återanvänds
// (samma /public/payments/klarna.svg som betal-loggorna).
//
// Visas bara över ett litet minimibelopp så vi aldrig "lovar" delbetalning på små
// köp där det inte är relevant. Vill man senare ha Klarnas officiella On-Site
// Messaging ("från X kr/mån" med riktiga villkor) byts denna mot <klarna-placement>
// gated på ett klient-ID — separat uppgradering.
const KLARNA_MIN_KR = 100;

export function KlarnaMessage({ priceNum }: { priceNum: number }) {
  if (!priceNum || priceNum < KLARNA_MIN_KR) return null;
  const perPart = Math.round(priceNum / 3);
  return (
    <div className="klarna-msg">
      <img src="/payments/klarna.svg" alt="Klarna" width={18} height={18} />
      <span>Dela upp i <strong>3 räntefria delar</strong> à {perPart} kr med Klarna</span>
    </div>
  );
}
