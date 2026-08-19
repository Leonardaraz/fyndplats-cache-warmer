"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useMarketingConsent } from "../lib/use-marketing-consent";
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
// identiteten. Dessutom är platform.js ett tredjepartsskript med egna cookies;
// att ladda det för någon som just valt "bara nödvändiga" i vår egen banner
// vore att motsäga bannern på sidan direkt efter köpet.
//
// Grinden sitter på TVÅ ställen och det är med flit. Servern (app/tack) läser
// samtyckescookien och bygger inte ens konfigurationen utan den — annars hade
// e-postadressen legat i sidans RSC-payload oavsett vad som renderas. Den här
// komponenten gatar dessutom själva skriptladdningen, och sköter fallet där
// kunden godkänner FÖRST efter att sidan renderats.
//
// Priset är färre opt-ins. Tröskeln för stjärnor är ~100 färdiga recensioner
// per land på 12 månader, så det är långt dit oavsett grind.

declare global {
  interface Window {
    gapi?: {
      load: (mod: string, cb: () => void) => void;
      surveyoptin?: { render: (cfg: GcrRenderConfig) => void };
    };
  }
}

/**
 * Renderar Googles opt-in-modul.
 *
 * `config` byggs server-side och är null både när ordern saknar något Google
 * kräver OCH när kunden inte samtyckt. Är den null laddas inget skript.
 */
export function GoogleCustomerReviewsOptIn({ config }: { config: GcrRenderConfig | null }) {
  const samtycke = useMarketingConsent();
  const router = useRouter();
  const harUppdaterat = useRef(false);

  // Godkänner kunden cookies medan hen står på /tack finns ingen konfiguration
  // i payloaden — servern byggde sidan innan cookien fanns. En refresh låter
  // servern rendera om med cookien satt. Utan den missar just den kunden
  // enkäten, vilket är den grupp som nyss sagt ja till precis det här.
  //
  // HÖGST EN gång per montering. Skulle cookien inte gå att sätta (blockerade
  // cookies, privat läge) förblir `config` null, och utan spärren hade varje
  // refresh startat en ny — var och en med ett blockerande Wix-uppslag på
  // kundens bekräftelsesida (granskning 2026-08-19, andra vändan).
  useEffect(() => {
    if (samtycke && !config && !harUppdaterat.current) {
      harUppdaterat.current = true;
      router.refresh();
    }
  }, [samtycke, config, router]);

  // BÅDA grindarna, som kommentaren ovan lovar. `config` bär serverns beslut
  // (cookien), `samtycke` klientens (localStorage). Divergerar de — cookien
  // kvar men localStorage rensat av ITP eller av användaren — ska skriptet inte
  // laddas. Tidigare gatade bara `config`, så det påståendet var inte sant.
  if (!config || !samtycke) return null;

  return (
    <Script
      id="gcr-platform"
      src="https://apis.google.com/js/platform.js"
      strategy="afterInteractive"
      // onReady i stället för Googles ?onload=renderOptIn-global.
      //
      // Två skäl (granskning 2026-08-19). Dels körs barnets effekt före
      // förälderns i React, så en global som sätts i en effekt här hinner inte
      // fram innan next/script hunnit lägga in skript-taggen — ordningen höll
      // bara på nätverkslatens. Dels hoppar next/script över appendChild helt
      // när skriptet redan finns i dess LoadCache, så vid en omrendering (eller
      // klientnavigering tillbaka hit) hade ?onload aldrig fyrat igen och
      // dialogen uteblivit tyst. onReady körs efter laddning OCH vid varje
      // montering, vilket är precis vad som behövs.
      onReady={() => {
        try {
          window.gapi?.load("surveyoptin", () => {
            try {
              window.gapi?.surveyoptin?.render(config);
            } catch (err) {
              console.warn("[gcr] surveyoptin.render misslyckades", err);
            }
          });
        } catch (err) {
          console.warn("[gcr] gapi.load misslyckades", err);
        }
      }}
      onError={() => console.warn("[gcr] platform.js kunde inte laddas")}
    />
  );
}
