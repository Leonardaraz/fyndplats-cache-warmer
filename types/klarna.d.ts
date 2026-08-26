// Klarna On-Site Messaging web component (<klarna-placement>) — deklarera
// för TS så JSX-checken accepterar taggen i components/klarna-osm.tsx.
//
// React 19 flyttade JSX-namespace från global `JSX` till `React.JSX`. Vår
// första fix (2026-08-26) augmenterade det gamla globala `JSX` och failade
// build:en tyst med samma error. Modulen "react" måste augmenteras direkt.
//
// Ligger i .d.ts (inte inline i tsx) för att Next.js 16 + Turbopack inte
// plockar upp `declare global` från "use client"-moduler under production
// build — bekräftat via Vercel-loggen för commit 4850ea4.

import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "klarna-placement": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          "data-key": string;
          "data-locale": string;
          "data-purchase-amount"?: string;
        },
        HTMLElement
      >;
    }
  }
}

declare global {
  interface Window {
    Klarna?: {
      OnsiteMessaging?: { refresh?: () => void };
    };
  }
}

export {};
