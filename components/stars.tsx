// Stjärnraden. Bruten ur ProductReviews 2026-08-17 när samma betyg också
// började visas direkt under produktrubriken — två kopior av samma markup
// hade glidit isär.
//
// Ren presentation, inga hooks: fungerar i både server- och klientkomponenter.
//
// DELVIS FYLLNING (2026-08-17, Leonards fråga): tidigare avrundades betyget
// till närmaste heltal, så 4,5 ritades som fem fyllda stjärnor. Det överdrev
// med en halv stjärna på precis de produkter där kunden är mest hjälpt av
// nyansen. Nu fylls stjärnorna proportionellt: 4,8 ger fyra hela plus 80 % av
// den femte.
//
// Tekniken är två lager ovanpå varandra — grå stjärnor i botten, gula i topp,
// där topplagret klipps med `width` i procent. Alternativet, att klippa texten
// med `background-clip:text`, ger exaktare kant men gör stjärnorna OSYNLIGA om
// egenskapen inte stöds. Här är felläget i stället "allt grått", vilket är
// synligt och begripligt. Bredden räknas på hela raden inklusive letter-spacing,
// vilket ger under en pixels avvikelse vid de storlekar vi använder.

const FULL = "★★★★★";

export function Stars({
  rating,
  className,
  "aria-hidden": ariaHidden,
}: {
  rating: number;
  className?: string;
  /** Sätts när en omgivande behållare redan bär hela betygets etikett — annars
   *  läses värdet två gånger (se kommentaren i productcard.tsx). */
  "aria-hidden"?: boolean;
}) {
  const v = Math.max(0, Math.min(5, Number(rating) || 0));
  // En decimal räcker: 4,75 och 4,8 är omöjliga att skilja åt vid 13–15 px.
  const andel = Math.round((v / 5) * 1000) / 10;
  const text = (Math.round(v * 10) / 10).toFixed(1).replace(".", ",");
  return (
    <span
      className={className ? `rev-stars ${className}` : "rev-stars"}
      {...(ariaHidden
        ? { "aria-hidden": true as const }
        : { role: "img", "aria-label": `${text} av 5 stjärnor` })}
      title={`${text} av 5`}
    >
      <span className="rev-stars-bg" aria-hidden="true">
        {FULL}
      </span>
      <span className="rev-stars-fg" aria-hidden="true" style={{ width: `${andel}%` }}>
        {FULL}
      </span>
    </span>
  );
}
