/**
 * Kanonisk JSON: nycklar sorterade rekursivt.
 *
 * ☠️ UTAN DEN JÄMFÖR MIGRERINGENS VERIFIERING NYCKELORDNING, INTE INNEHÅLL.
 * Postgres JSONB bevarar inte den ordning fälten skrevs i, så `JSON.stringify`
 * på ett nästlat objekt ger olika strängar för identiskt innehåll. Uppmätt
 * 2026-08-31: `.variants` och `.shippingAddress` flaggades som avvikande på
 * 10 av 10 stickprovsrader medan varje platt fält stämde — ett utfall som bara
 * nyckelordning kan förklara.
 *
 * En verifiering som alltid fäller är lika värdelös som en som aldrig gör det:
 * den lär läsaren att ignorera den.
 */
export function kanonisk(v: unknown): string {
  return JSON.stringify(sortera(v));
}

function sortera(x: unknown): unknown {
  // Arrayer behåller sin ordning — den BETYDER något (variantlistan är
  // sorterad), till skillnad från objektens nyckelordning som inte gör det.
  if (Array.isArray(x)) return x.map(sortera);
  if (x && typeof x === "object") {
    return Object.fromEntries(
      Object.keys(x as Record<string, unknown>)
        .sort()
        .map((k) => [k, sortera((x as Record<string, unknown>)[k])]),
    );
  }
  return x;
}
