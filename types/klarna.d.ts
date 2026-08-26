// Klarna On-Site Messaging web component (<klarna-placement>) — deklarera
// för TS så JSX-checken accepterar taggen i components/klarna-osm.tsx.
//
// Global .d.ts, inte inline i tsx-filen: Next.js 16 + Turbopack ser inte
// `declare global { namespace JSX ... }` från en "use client"-modul under
// production build (fungerar dev, failar build — bekräftat via
// Vercel-loggen för commit 4850ea4). Global augmentation MÅSTE ligga i en
// .d.ts som tsconfig plockar upp via "include"-glob.

import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare global {
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
  interface Window {
    Klarna?: {
      OnsiteMessaging?: { refresh?: () => void };
    };
  }
}

export {};
