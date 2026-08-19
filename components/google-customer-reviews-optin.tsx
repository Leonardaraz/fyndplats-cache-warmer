"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
import { CONSENT_EVENT, hasMarketingConsent } from "../lib/consent";
import type { GcrRenderConfig } from "../lib/gcr";

// Google Customer Reviews opt-in — Googles egen dialog på /tack som frågar
// kunden om hen vill få en enkät om köpet. Enkäterna är det som till slut ger
// "Butikens betyg" i Shopping-annonser, och de är dessutom FÖRSTAHANDSdata:
// våra egna kunders omdömen, till skillnad från de importerade. Det är precis
// den sortens data som legitimt får bli aggregateRating i JSON-LD (se noten i
// lib/social-proof.ts om varför vi håller den avstängd idag).
//
// SAMTYCKESGRINDEN är ett medvetet val, inte försiktighet på rutin.
//
// Modulen skickar kundens E-POSTADRESS till ett Google-skript. Kodbasens egen
// dokumenterade konvention (lib/consent.ts) är att GA4 får köra ogated medan
// Meta Pixel gatas, med motiveringen att pixeln "matchar besökaren mot ett
// Facebook-konto". En e-postadress är mer identifierande än så — den ÄR
// identiteten. Samma grind gäller därför här.
//
// Dessutom är platform.js ett tredjepartsskript som sätter egna cookies. Att
// ladda det för en kund som just valt "bara nödvändiga" i vår egen banner vore
// att motsäga bannern på sidan direkt efter köpet.
//
// Priset är färre opt-ins. Det är ett verkligt pris, men litet i praktiken:
// tröskeln för stjärnor är ~100 färdiga recensioner per land på 12 månader, och
// dit är det långt oavsett grind. Vill man byta bort grinden är det en rad —
// sätt KRAV_PA_SAMTYCKE till false — men gör det som ett medvetet beslut.
const KRAV_PA_SAMTYCKE = true;

declare global {
  interface Window {
    renderOptIn?: () => void;
    gapi?: {
      load: (mod: string, cb: () => void) => void;
      surveyoptin?: { render: (cfg: GcrRenderConfig) => void };
    };
  }
}

/**
 * Renderar Googles opt-in-modul.
 *
 * `config` byggs server-side av buildGcrConfig och är null när ordern saknar
 * något Google kräver — då renderas ingenting alls.
 */
export function GoogleCustomerReviewsOptIn({ config }: { config: GcrRenderConfig | null }) {
  const [tillaten, setTillaten] = useState(!KRAV_PA_SAMTYCKE);

  // Samma lyssnarmönster som MetaPixel: reagera direkt när kunden klickar
  // "Godkänn alla" i bannern, utan sidladdning, och plocka upp samtycke som
  // getts i en annan flik.
  useEffect(() => {
    if (!KRAV_PA_SAMTYCKE) return;
    const sync = () => setTillaten(hasMarketingConsent());
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // window.renderOptIn måste finnas INNAN platform.js laddas — Google anropar
  // den via ?onload=renderOptIn. Därför sätts den i en effekt som körs före
  // att <Script> monteras, och Script:en renderas först när `tillaten`.
  useEffect(() => {
    if (!config || !tillaten) return;
    window.renderOptIn = () => {
      try {
        window.gapi?.load("surveyoptin", () => {
          try {
            window.gapi?.surveyoptin?.render(config);
          } catch {
            /* Googles modul får aldrig fälla bekräftelsesidan */
          }
        });
      } catch {
        /* dito */
      }
    };
    return () => {
      delete window.renderOptIn;
    };
  }, [config, tillaten]);

  if (!config || !tillaten) return null;

  return (
    <Script
      id="gcr-platform"
      src="https://apis.google.com/js/platform.js?onload=renderOptIn"
      strategy="afterInteractive"
    />
  );
}
