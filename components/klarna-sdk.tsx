"use client";
// Klarna Web SDK loader. En instans per sida (Klarnas crav — flera
// laddningar gör att OSM-widgeten hydrerar dubbelt eller inte alls). Gated
// på marknadssamtycke, samma mönster som components/metapixel.tsx.
//
// SDK:t är själv-idempotent: det första <script data-client-id> vinner. Vi
// använder ändå useEffect + guard så vi aldrig försöker mounta en andra
// script-tag efter klientnavigering.
//
// Fyllnadskoll (test på preview innan production): sätt
// NEXT_PUBLIC_KLARNA_CLIENT_ID i Vercel. Tom → SDK:t laddas inte, OSM-
// komponenten trippar sin fallback (KlarnaMessage) och sajten fungerar
// oförändrat.

import { useEffect } from "react";
import { useMarketingConsent } from "../lib/use-marketing-consent";

const SCRIPT_ID = "klarna-osm-sdk";
const SDK_URL = "https://js.klarna.com/web-sdk/v1/klarna.js";

export function KlarnaSDK({ clientId }: { clientId: string }) {
  const consent = useMarketingConsent();

  useEffect(() => {
    if (!consent) return;
    if (!clientId) return;
    if (document.getElementById(SCRIPT_ID)) return;
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.async = true;
    s.src = SDK_URL;
    s.setAttribute("data-environment", "production");
    s.setAttribute("data-client-id", clientId);
    document.head.appendChild(s);
  }, [consent, clientId]);

  return null;
}
