// Tacksidans "Din beställning": varorna med bild, frakten, totalen och när
// paketet beräknas komma. Renderas på servern ur samma orderuppslag som
// ordernumret (lib/wix-orders.ts), så sidan gör fortfarande ett enda Wix-anrop.
//
// Visar aldrig namn, adress eller e-post. Sidan nås med orderns GUID i adressen,
// och den adressen hamnar i webbläsarens historik och i analysverktygen.
//
// Beloppen är inklusive moms: radens `totalPriceAfterTax`, frakten ur
// `shippingInfo.cost` och orderns total (se lib/wix-order-fields.ts). Rabatten
// räknas som skillnaden mellan totalen och raderna plus frakten, så att det som
// står på sidan alltid summerar till det kunden betalade.

import { tightFillUrl } from "../lib/wix-image";
import { formatPrice } from "../lib/price-range";
import type { OrderRad } from "../lib/wix-order-fields";

function kronor(n: number): string {
  if (Number.isInteger(n)) return formatPrice(n);
  const [hel, del] = n.toFixed(2).split(".");
  return `${hel.replace(/\B(?=(\d{3})+(?!\d))/g, " ")},${del} kr`;
}

export function TackOrder({
  rader,
  frakt,
  totalt,
  leverans,
}: {
  rader: readonly OrderRad[];
  frakt?: number;
  totalt?: number;
  leverans?: string | null;
}) {
  // Uppslaget föll eller ordern saknar rader: sidan visar ordernumret och
  // stegen som förut, hellre än en tom ruta.
  if (rader.length === 0) return null;

  const allaBelopp = rader.every((r) => typeof r.belopp === "number");
  const raderSumma = rader.reduce((s, r) => s + (r.belopp ?? 0), 0);
  const rabatt =
    allaBelopp && typeof frakt === "number" && typeof totalt === "number"
      ? Math.round((totalt - raderSumma - frakt) * 100) / 100
      : 0;

  return (
    <section className="tack-order" aria-label="Din beställning">
      <h2 className="tack-order-title">Din beställning</h2>
      <ul className="tack-rader">
        {rader.map((r, i) => (
          <li className="tack-rad" key={i}>
            {r.bild ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="tack-rad-img" src={tightFillUrl(r.bild, 128, 128)} alt="" loading="lazy" />
            ) : (
              <span className="tack-rad-img" aria-hidden="true" />
            )}
            <span className="tack-rad-text">
              <strong>{r.namn}</strong>
              {r.variant ? <span>{r.variant}</span> : null}
              {r.antal > 1 ? <span>{r.antal} st</span> : null}
            </span>
            {typeof r.belopp === "number" ? <span className="tack-rad-belopp">{kronor(r.belopp)}</span> : null}
          </li>
        ))}
      </ul>
      {typeof totalt === "number" ? (
        <dl className="tack-summa">
          {rabatt <= -0.5 ? (
            <div>
              <dt>Rabatt</dt>
              <dd>−{kronor(-rabatt)}</dd>
            </div>
          ) : null}
          {typeof frakt === "number" ? (
            <div>
              <dt>Frakt</dt>
              <dd className={frakt === 0 ? "fri" : undefined}>{frakt === 0 ? "Fri frakt" : kronor(frakt)}</dd>
            </div>
          ) : null}
          <div className="tot">
            <dt>
              Totalt <small>inkl. moms</small>
            </dt>
            <dd>{kronor(totalt)}</dd>
          </div>
        </dl>
      ) : null}
      {leverans ? (
        <p className="tack-leverans">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            <circle cx="7" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.7" />
            <circle cx="17.5" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.7" />
          </svg>
          <span>
            Beräknad leverans <b>{leverans}</b>
          </span>
        </p>
      ) : null}
    </section>
  );
}
