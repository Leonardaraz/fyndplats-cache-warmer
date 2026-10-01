"use client";
// Menyns produktantal, hämtade i webbläsaren (varför: se lib/meny-antal.ts).
//
// EN hämtning per sidvisning, delad av mega-menyn och mobilmenyn. Svaret är
// CDN-cachat, så det kostar varken en funktion eller en ISR-skrivning. Faller
// hämtningen visas menyn utan siffror — länkarna fungerar ändå.

import { useEffect, useState } from "react";

let lofte: Promise<Record<string, number>> | null = null;

function hamtaAntal(): Promise<Record<string, number>> {
  if (!lofte) {
    lofte = fetch("/api/meny-antal")
      .then((r) => (r.ok ? r.json() : { antal: {} }))
      .then((b: { antal?: Record<string, number> }) => b.antal ?? {})
      .catch(() => ({}));
  }
  return lofte;
}

/** slug → antal, eller null tills svaret kommit. */
export function useMenyAntal(): Record<string, number> | null {
  const [antal, setAntal] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    let aktiv = true;
    hamtaAntal().then((a) => {
      if (aktiv) setAntal(a);
    });
    return () => {
      aktiv = false;
    };
  }, []);
  return antal;
}
