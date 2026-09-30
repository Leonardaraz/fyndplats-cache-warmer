// priceValidUntil i produktsidans JSON-LD.
//
// Förut: i dag + 30 dagar, räknat vid varje rendering. Datumet ändrades alltså
// varje dygn, och en sida som byggs om med ett nytt datum är en NY sida för
// Vercel — en ISR-skrivning till, fast inget i butiken hänt (mätt 2026-09-30:
// en omrenderad produktsida skilde sig från den förra i datum och menysiffror).
//
// Nu: sista dagen i nästa månad (UTC). Samma värde hela månaden, och alltid
// minst 28 dagar fram, vilket är vad Googles merchant-listing vill se: ett
// datum i framtiden. LÖVMODUL, testad i lib/pris-giltig.test.ts.

/** Sista dagen i månaden efter `nu`, som YYYY-MM-DD (UTC). */
export function prisGiltigTill(nu: Date): string {
  // Dag 0 i månaden två steg fram = sista dagen i nästa månad.
  const sista = new Date(Date.UTC(nu.getUTCFullYear(), nu.getUTCMonth() + 2, 0));
  return sista.toISOString().slice(0, 10);
}
