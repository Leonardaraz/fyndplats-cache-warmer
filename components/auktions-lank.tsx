"use client";
// components/auktions-lank.tsx
//
// Länken till Fyndauktionen från startsidan: knappen i hjälten och bannern
// längre ner (ChatGPT:s audit, punkt 5, 2026-11-04). Klicket mäts i GA4 och
// Vercel (lib/analytics.ts, trackAuktionLank) så att de två ingångarna går att
// jämföra. Vanlig <a>: sidan laddas om, och /fyndauktion får startsidan som
// referrer.
import type { ReactNode } from "react";
import { trackAuktionLank, type AuktionKalla } from "../lib/analytics";

export function AuktionsLank({ kalla, className, children }: { kalla: AuktionKalla; className: string; children: ReactNode }) {
  return (
    <a className={className} href="/fyndauktion" onClick={() => trackAuktionLank(kalla)}>
      {children}
    </a>
  );
}
