"use client";

// components/gowish-knapp.tsx
//
// GoWish önskelistknapp under köpraden på produktsidan (Leonard 2026-11-25).
// Vad GoWish skript gör, och varför deras stilmall inte laddas, står i
// lib/gowish.ts.
//
// TVÅ LÄGEN, som Trustpilots knapp på omdömessidan
// (components/trustpilot-insamling.tsx) och som sekretesspolicyn säger:
//
// - Utan samtycke till alla cookies hämtas ingenting från GoWish förrän kunden
//   trycker. Knappen är då en vanlig länk till GoWish egen sida med varan, i en
//   ny flik. Det är också vad servern skickar, till alla.
// - Med samtycke hämtas GoWish skript, och knappen öppnar deras ruta ovanpå
//   sidan (på telefon först ett försök att öppna appen). Skriptet hämtas med
//   strategy="lazyOnload": efter att sidan laddat klart, när webbläsaren är
//   ledig. next/script hämtar det en gång hur många produktsidor kunden än går
//   mellan.
//
// Länken och knappen har samma klass och samma mått, så bytet mellan dem
// flyttar ingenting på sidan.
import Script from "next/script";
import { useMarketingConsent } from "../lib/use-marketing-consent";
import {
  GOWISH_DIALOG_ID,
  GOWISH_KNAPP_ID,
  GOWISH_KNAPP_TEXT,
  GOWISH_RAM_ID,
  GOWISH_REGION,
  GOWISH_SKRIPT,
  GOWISH_SKRIPT_ID,
  GOWISH_VANTA_MS,
  gowishProduktadress,
  gowishReservadress,
  gowishSvenskRuta,
} from "../lib/gowish";

declare global {
  interface Window {
    /** Sätts av GoWish skript när det har laddats. */
    GoWish?: { createIframe: (region?: string, targetUrl?: string) => void; closeIframe: () => void };
  }
}

/** GoWish moln, ur deras egen ikon (dark_cloud.svg). Dekoration: knappens namn är texten. */
function Moln() {
  return (
    <svg viewBox="0 0 26 16" width="26" height="16" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.5947 6.26158C21.0026 6.26669 20.3901 6.32446 19.8446 6.54381C20.0092 6.14166 20.0864 5.71321 20.0813 5.28549C20.0763 3.48394 18.6197 2.01066 16.8493 2.01066C15.794 2.01066 14.8006 2.53782 14.1889 3.42106C14.0651 2.00993 11.924 0 9.49446 0C4.73449 0 3.87513 5.10196 4.73449 6.54308C3.12866 6.11533 0 7.23766 0 10.7106C0 13.1702 2.3778 14.7736 4.4206 15.197C6.57191 15.6408 16.8493 16.1789 21.5947 15.197C23.3855 14.8263 26 13.6718 26 10.7318C26 8.27737 23.7562 6.25062 21.5947 6.26158Z"
      />
    </svg>
  );
}

/**
 * GoWish ruta på svenska. Skriptet ger sin ram adressen gowish.com/quick-add,
 * och den sidan står på engelska (se lib/gowish.ts). Här byts ramens adress
 * till /sv/quick-add så fort skriptet har satt den: direkt på datorn, och på
 * telefon efter att appen fått sin chans.
 *
 * Bevakningen startas vid klicket och lever bara medan rutan är öppen, högst
 * GOWISH_VANTA_MS. Sidan har alltså ingen bevakning när ingen tryckt.
 */
function svenskRuta() {
  if (typeof MutationObserver === "undefined") return;
  let settRutan = false;
  const bevakning = new MutationObserver(se);
  const tid = window.setTimeout(sluta, GOWISH_VANTA_MS);
  function sluta() {
    bevakning.disconnect();
    window.clearTimeout(tid);
  }
  function se() {
    if (document.getElementById(GOWISH_DIALOG_ID)) settRutan = true;
    else if (settRutan) return sluta();
    const ram = document.getElementById(GOWISH_RAM_ID);
    const svensk = ram instanceof HTMLIFrameElement ? gowishSvenskRuta(ram.getAttribute("src")) : null;
    if (ram instanceof HTMLIFrameElement && svensk) ram.src = svensk;
  }
  bevakning.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
  se();
}

export function GowishKnapp({ slug }: { slug: string }) {
  const samtycke = useMarketingConsent();
  const adress = gowishProduktadress(slug);
  const reserv = gowishReservadress(adress);

  if (!samtycke) {
    return (
      <div className="pdp-gowish">
        <a className="gowish-btn" href={reserv} target="_blank" rel="noopener noreferrer">
          <Moln />
          {GOWISH_KNAPP_TEXT}
          <span className="sr-only"> (öppnas i en ny flik)</span>
        </a>
      </div>
    );
  }

  // GoWish skript lyssnar själv på dokumentet och öppnar sin ruta för den här
  // knappens id. Här händer bara något när skriptet INTE finns (blockerat av
  // ett tillägg, eller kunden hann före laddningen): då öppnas samma sida som
  // länken ovan, så att knappen aldrig är död. ☠️ Anropa aldrig createIframe
  // härifrån när skriptet finns: det öppnar rutan, och skriptets egen lyssnare
  // stänger den igen i samma klick.
  const tryck = () => {
    if (window.GoWish) return svenskRuta();
    window.open(reserv, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="pdp-gowish">
      <button id={GOWISH_KNAPP_ID} className="gowish-btn" type="button" data-producturl={adress} onClick={tryck}>
        <Moln />
        {GOWISH_KNAPP_TEXT}
      </button>
      <Script id={GOWISH_SKRIPT_ID} src={GOWISH_SKRIPT} strategy="lazyOnload" data-region={GOWISH_REGION} />
    </div>
  );
}
