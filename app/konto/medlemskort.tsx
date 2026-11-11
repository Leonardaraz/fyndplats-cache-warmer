// Medlemskortet: nivån som ett kort i nivåns egen färg (Leonard 2026-11-04,
// "premiumkänsla"). Samma kort på Mina sidor och som förhandsvisning på
// inloggningen. Färgerna bor i konto.module.css under [data-niva].

import s from "./konto.module.css";
import { nivaNyckel } from "../../lib/medlem/niva-nyckel";

/** Nivåns nyckel för färgerna, densamma som rutan med medlemspriset använder. */
export { nivaNyckel };

/** Fyndplats-kuben, samma former som public/logo.svg. */
function Kub({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-t`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FC7E26" />
          <stop offset="1" stopColor="#FF9838" />
        </linearGradient>
        <linearGradient id={`${id}-v`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF4210" />
          <stop offset="1" stopColor="#FA3A0B" />
        </linearGradient>
        <linearGradient id={`${id}-h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF852B" />
          <stop offset="1" stopColor="#FF6B1E" />
        </linearGradient>
      </defs>
      <polygon points="12,1 21.6,6.5 12,12.1 2.4,6.5" fill={`url(#${id}-t)`} />
      <polygon points="2.4,6.5 12,12.1 12,23 2.4,17.3" fill={`url(#${id}-v)`} />
      <polygon points="21.6,6.5 12,12.1 12,23 21.6,17.3" fill={`url(#${id}-h)`} />
    </svg>
  );
}

export function Medlemskort({
  niva,
  rad1,
  rad2,
  id = "mk",
  liten = false,
  etikett = "Medlem",
  nyckel,
}: {
  niva: string;
  /** Nere till vänster, t.ex. den maskerade adressen. */
  rad1?: string;
  /** Nere till höger, t.ex. "Medlem sedan november 2026". */
  rad2?: string;
  /** Unikt prefix för kubens gradienter när flera kort står på samma sida. */
  id?: string;
  liten?: boolean;
  /** Ordet uppe till höger. Företagskortet säger "Företag". */
  etikett?: string;
  /** Färgernas nyckel när kortet inte är en medlemsnivå ("foretag"). */
  nyckel?: string;
}) {
  return (
    <div className={`${s.medlemskort} ${liten ? s.medlemskortLiten : ""}`} data-niva={nyckel ?? nivaNyckel(niva)}>
      <div className={s.kortTopp}>
        <span className={s.kortMarke}>
          <Kub id={id} />
          Fyndplats
        </span>
        <span className={s.kortEtikett}>{etikett}</span>
      </div>
      <p className={s.kortNiva}>{niva}</p>
      {rad1 || rad2 ? (
        <div className={s.kortBotten}>
          <span>{rad1}</span>
          <span>{rad2}</span>
        </div>
      ) : null}
    </div>
  );
}
