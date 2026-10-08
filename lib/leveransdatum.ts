// lib/leveransdatum.ts
// "ons 14 – mån 19 oktober": leveransintervallet som produktsidan
// (components/delivery-estimate.tsx) och varukorgen (components/cart.tsx)
// visar. En definition, så att de två aldrig visar olika datum för samma köp.
//
// Räknas i WEBBLÄSAREN, aldrig på servern: sidorna är ISR-cachade, och ett
// serverberäknat datum hade frusit i cachen och visat fel datum dagar senare.
//
// Dagarna skickas in (DELIVERY_MIN_DAYS/DELIVERY_MAX_DAYS i lib/shipping.ts)
// i stället för att importeras: filen har inga importer alls, så att den går
// att köra direkt i testerna (node --test löser inte importer utan filändelse).

// Lägg n arbetsdagar (mån–fre) till ett datum. Helger hoppas över; helgdagar
// hanteras inte (medvetet enkelt — intervallet är ett estimat, inte ett löfte).
export function addBusinessDays(from: Date, n: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < n) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) added++; // 0 = söndag, 6 = lördag
  }
  return d;
}

export function formatRange(a: Date, b: Date): string {
  // Kort veckodag ("tis", "fre") för konkretion. Vissa ICU-versioner lägger en
  // punkt ("tis.") — strippa den defensivt så det alltid blir rent.
  const wd = (d: Date) => d.toLocaleDateString("sv-SE", { weekday: "short" }).replace(".", "");
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (sameMonth) {
    // "tis 6 – fre 10 juli"
    const month = b.toLocaleDateString("sv-SE", { month: "long" });
    return `${wd(a)} ${a.getDate()} – ${wd(b)} ${b.getDate()} ${month}`;
  }
  // "tis 29 juni – fre 3 juli"
  const f = (d: Date) => `${wd(d)} ${d.toLocaleDateString("sv-SE", { day: "numeric", month: "long" })}`;
  return `${f(a)} – ${f(b)}`;
}

/** Leveransintervallet för en beställning lagd `nu`. */
export function leveransIntervall(nu: Date, minDagar: number, maxDagar: number): string {
  return formatRange(addBusinessDays(nu, minDagar), addBusinessDays(nu, maxDagar));
}
