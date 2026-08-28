// Kör en asynkron funktion över en lista med ETT TAK på hur många som är i
// luften samtidigt.
//
// ☠️ Bakgrunden är en tyst produktionsincident (hittad i audit 2026-08-28).
// `runDailySync` läste synk-tillståndet för varje mappning i ett obegränsat
// `Promise.all`: en Wix-läsning per produkt, alla avfyrade i samma ögonblick.
// Det fungerade på 980 produkter och slutade fungera utan att någon rörde
// koden — 2026-08-26 kl 12 svarade rutten 500 i stället, och gjorde det varje
// körning i 57 timmar. Lagret och priserna för hela AliExpress-katalogen stod
// stilla under tiden.
//
// Felet gick inte att se: lambdan DOG av fan-outen, så ruttens egen
// catch-gren hann aldrig skriva sin `aliexpress-sync-fatal`-rad, och Vercel
// loggade en naken 500 utan en enda rad. Sedan Aosom-importen låg talet på
// 5 423 samtidiga anrop.
//
// Regeln är densamma som huset lärt sig fyra gånger förut: en obegränsad
// fan-out är en tickande bomb som exploderar när katalogen växer, inte när
// koden ändras.

/**
 * Som `Promise.all(items.map(fn))`, fast med högst `limit` anrop igång
 * samtidigt. Resultaten kommer tillbaka i SAMMA ORDNING som `items` — det är
 * ett kontrakt, inte en tillfällighet: synkens rotationssortering bygger på
 * att paret (mappning, tillstånd) hör ihop.
 *
 * Ett kast från `fn` fäller hela anropet, precis som `Promise.all` — vill du
 * ha fail-open får `fn` fånga själv.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  const workers = Math.max(1, Math.min(Math.floor(limit) || 1, items.length));
  let next = 0;
  await Promise.all(
    Array.from({ length: workers }, async () => {
      for (;;) {
        const i = next++;
        if (i >= items.length) return;
        out[i] = await fn(items[i] as T, i);
      }
    }),
  );
  return out;
}
