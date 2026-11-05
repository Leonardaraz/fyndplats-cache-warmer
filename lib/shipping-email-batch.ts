// lib/shipping-email-batch.ts
//
// Ett fraktmejl per order, inte ett per paket.
//
// Wix skapar en fulfillment per spårningsnummer. En order på två sängramar som
// går i två DPD-paket (order 10051, 2026-09-30) gav därför två "Ditt paket är
// på väg"-mejl några sekunder isär. Nu köas varje nytt spårningsnummer här, och
// mejlet går när ordern är helt skickad, med alla nummer i samma mejl.
//
// Skickas ordern i omgångar (en del i dag, resten senare) blir den aldrig helt
// skickad vid första numret. Då skickar cronen /api/cron/fraktmejl det som
// väntat i minst VANTETID_MIN minuter, så kunden aldrig står utan spårning.
//
// Dedup: spårningstabellen (unik på spårningsnummer) avgör fortfarande om ett
// nummer är nytt. Kön avgör bara NÄR mejlet går och vilka nummer det bär.
// Anspråket är atomiskt (`fraktmejlKo.taVantande` i lib/wix-lager.ts, under
// ett lås), så två samtidiga webhook-anrop för samma order kan inte båda skicka.

import { fraktmejlKo } from "./wix-lager";
import { sandningsRader, slaIhopRader, heltSkickad, type KoadSandning, type SandningsRad } from "./fraktmejl-rader";

export { sandningsRader, slaIhopRader, heltSkickad };
export type { KoadSandning, SandningsRad };

/** Minuter ett nummer får vänta på resten av ordern innan cronen skickar det. */
export const VANTETID_MIN = 30;

/** Lägger ett nytt spårningsnummer i kön. false vid lagerfel: anroparen skickar
 *  då mejlet direkt som förr, hellre ett extra mejl än ett tappat. */
export async function koaSandning(orderGuid: string, s: KoadSandning): Promise<boolean> {
  try {
    await fraktmejlKo.koa(orderGuid, s);
    return true;
  } catch (err) {
    console.error("[fraktmejl] kunde inte köa", s.trackingNumber, err instanceof Error ? err.message : err);
    return false;
  }
}

/** Tar atomiskt alla väntande nummer för ordern. Tom lista = inget att skicka
 *  (eller någon annan hann före). */
export async function taVantande(orderGuid: string): Promise<KoadSandning[]> {
  return (await fraktmejlKo.taVantande(orderGuid)).map((r) => ({
    trackingNumber: r.trackingNumber,
    carrier: r.carrier,
    lineItems: r.lineItems as SandningsRad[],
  }));
}

/** Lämnar tillbaka anspråket när mejlet inte gick iväg, så nästa försök tar det. */
export async function slappVantande(trackingNumbers: string[]): Promise<void> {
  for (const tn of trackingNumbers) {
    try {
      await fraktmejlKo.slapp(tn);
    } catch (err) {
      console.error("[fraktmejl] kunde inte släppa", tn, err instanceof Error ? err.message : err);
    }
  }
}

/** Ordrar vars äldsta väntande nummer har väntat minst `minuter`. */
export async function ordrarSomVantat(minuter: number = VANTETID_MIN, max = 25): Promise<string[]> {
  return fraktmejlKo.ordrarSomVantat(new Date(Date.now() - minuter * 60_000).toISOString(), max);
}
