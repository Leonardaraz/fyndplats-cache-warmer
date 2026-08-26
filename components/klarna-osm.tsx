"use client";
// Klarna On-Site Messaging (OSM) — den officiella widgeten som visar
// "Betala inom 30 dagar" eller "Från X kr/mån med Klarna" under priset på PDP.
//
// KOMPLIANS: Kärnan varför vi migrerar från static KlarnaMessage → riktig OSM.
// Delbetalning är räntebärande (21,9 % effektiv), och när vi själva skriver
// "räntefri" bredvid ett månadsbelopp bryter vi mot Konsumentkreditlagen §§7-8
// (informationsskyldighet: representativt exempel + effektiv ränta MÅSTE visas).
// Klarnas widget renderar den lagkravsdelen automatiskt per betalsätt, så
// compliance-risken flyttar från oss till dem.
//
// SAMTYCKE: Gated på marknadssamtycke ("Godkänn alla"), samma logik som Meta
// Pixel. Klarnas OSM samlar impressions/klick server-side. Nekar användaren
// marknadscookies → static-fallbacken renderas i stället (behåller 30-dagars-
// budskapet så priset aldrig står naket, men utan tracking).
//
// SDK: Klarna-scripten laddas i app/layout.tsx (en instans per sida — Klarnas
// crav). Denna komponent renderar bara <klarna-placement>-taggen; widgeten
// hittar den och hydrerar när SDK:t är laddat. Om SDK:t aldrig kommer fram
// (adblock, network) sitter <klarna-placement> tomt, och fallbacken tar över
// via en detektions-timeout.

import { useEffect, useRef, useState } from "react";
import { useMarketingConsent } from "../lib/use-marketing-consent";
import { toMinorUnits } from "../lib/klarna-price";
import { KlarnaMessage } from "./klarna-message";

// data-key för "under priset" på PDP. Autosize = matchar containerbredden
// (144-296px räckvidd rekommenderas av Klarna). credit-promotion visar
// 30-dagars-budskap ELLER delbetalning beroende på Klarnas dynamiska val
// per kund + korgstorlek — vi kan inte styra vilket, och ska inte heller
// (Klarna optimerar konvertering med sin ML-modell).
const PLACEMENT_KEY = "credit-promotion-auto-size";
const LOCALE = "sv-SE";
const HYDRATION_TIMEOUT_MS = 3000; // Efter detta: SDK laddade inte → fallback.

// Klarnas web component + window.Klarna typas i types/klarna.d.ts — flyttat
// från denna fil 2026-08-26 efter Vercel-buildfail: Next.js 16 + Turbopack
// plockar inte upp `declare global` från en "use client"-modul under
// production build, bara i dev. Global augmentation måste bo i en fristående
// .d.ts som tsconfig include:ar via **/*.ts.

export function KlarnaOSM({ priceNum }: { priceNum: number }) {
  const consent = useMarketingConsent();
  const [hydrated, setHydrated] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const ref = useRef<HTMLElement>(null);

  // Klarna OSM hydrerar automatiskt när SDK:t hittar <klarna-placement>-taggen.
  // Vi kickstartar refresh() om SDK:t redan var laddat vid montering (t.ex.
  // klientnavigering mellan PDPs — SDK ligger kvar i minnet).
  useEffect(() => {
    if (!consent) return;
    if (window.Klarna?.OnsiteMessaging?.refresh) {
      try { window.Klarna.OnsiteMessaging.refresh(); } catch {}
    }
    // Detektera hydration: Klarna injicerar shadow DOM eller innerHTML
    // i taggen. Kolla var 250ms om taggen fått content. Timeout → gaveUp.
    const start = Date.now();
    const int = window.setInterval(() => {
      if (!ref.current) return;
      const hasContent =
        ref.current.shadowRoot != null ||
        (ref.current.innerHTML || "").trim().length > 0 ||
        ref.current.children.length > 0;
      if (hasContent) {
        setHydrated(true);
        window.clearInterval(int);
      } else if (Date.now() - start > HYDRATION_TIMEOUT_MS) {
        setGaveUp(true);
        window.clearInterval(int);
      }
    }, 250);
    return () => window.clearInterval(int);
  }, [consent, priceNum]);

  if (!priceNum || priceNum <= 0) return null;

  // Fallback: ingen consent, eller SDK:t hydrerade aldrig. Behåll vår statiska
  // 30-dagars-rad så priset aldrig står naket. Static-varianten är komplians-
  // säker (bara "Betala inom 30 dagar — räntefritt" om månadsfakturan, inget
  // månadsbelopp/delbetalning).
  if (!consent || gaveUp) {
    return <KlarnaMessage priceNum={priceNum} />;
  }

  // hydrated=false renderar tomt initialt (utan fallback) för att undvika
  // flicker: static → OSM när SDK:t landar (typisk 150-500ms). Enda tiden vi
  // visar static ovanför är när consent saknas eller efter timeout — då är
  // static "final".
  return (
    <div className="klarna-osm-wrap" data-hydrated={hydrated ? "1" : "0"}>
      <klarna-placement
        ref={ref}
        data-key={PLACEMENT_KEY}
        data-locale={LOCALE}
        data-purchase-amount={String(toMinorUnits(priceNum))}
      />
    </div>
  );
}
