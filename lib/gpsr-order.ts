// lib/gpsr-order.ts
//
// Produktsäkerheten för varorna i en order, till orderbekräftelsen.
//
// VARFÖR (Leonard 2026-09-27). Produktsidans flik (lib/gpsr-flik.ts) ger
// kunden säkerhetsinformationen på svenska FÖRE köpet. Bruksanvisningen som
// följer med Aosoms varor finns däremot bara på engelska, tyska och andra
// språk — inte svenska. Som återförsäljare ska vi se till att svensk
// säkerhetsinformation följer med varan (EU 2023/988, Konsumentverket).
// Samma rader i orderbekräftelsen är det kunden har kvar och kan leta fram
// när varan står hemma — mejlet de redan sparar för kvittot och reklamationen.
//
// Ren modul, inga importer utom typer, så att node-testköraren laddar den.

import type { GpsrAnsvarig, GpsrData } from "./gpsr-flik";

export interface OrderSakerhetVara {
  namn: string;
  marke: string | null;
  rader: string[];
}

export interface OrderSakerhet {
  varor: OrderSakerhetVara[];
  /** Tillverkarna, utan dubbletter — för Aosom-varorna alltid en. */
  ansvariga: GpsrAnsvarig[];
}

/**
 * Parar orderns rader (namn) med motorns uppgifter (samma ordning). Varor
 * utan uppgifter hoppas över; har ingen vara uppgifter blir svaret null och
 * mejlet får inget avsnitt. Samma produkt två gånger (två varianter) står en
 * gång.
 */
export function byggOrderSakerhet(
  namn: readonly string[],
  gpsr: readonly (GpsrData | null)[],
): OrderSakerhet | null {
  const varor: OrderSakerhetVara[] = [];
  const ansvariga: GpsrAnsvarig[] = [];
  const settNamn = new Set<string>();
  const settAnsvarig = new Set<string>();
  namn.forEach((n, i) => {
    const g = gpsr[i];
    if (!g) return;
    if (!settNamn.has(n)) {
      settNamn.add(n);
      varor.push({ namn: n, marke: g.marke, rader: [...g.sakerhet] });
    }
    const nyckel = `${g.ansvarig.namn}|${g.ansvarig.gata}|${g.ansvarig.ort}`;
    if (!settAnsvarig.has(nyckel)) {
      settAnsvarig.add(nyckel);
      ansvariga.push({ ...g.ansvarig });
    }
  });
  return varor.length ? { varor, ansvariga } : null;
}
