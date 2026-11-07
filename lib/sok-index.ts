// lib/sok-index.ts
//
// Sökindexet (/api/search-index), hämtat en gång per sidbesök och delat av
// sidhuvudets sökruta (components/searchbox.tsx) och kontaktformulärets
// produktväljare (components/kontakt-produkt.tsx). Utbrutet ur searchbox.tsx
// 2026-11-07, med skälen kvar nedan.

// o = slutsåld (sätts bara på slutsålda produkter, se /api/search-index).
export type SokTraff = { n: string; s: string; i: string; p: string; o?: 1 };

// Module-level cache so the header + mobile SearchBox share ONE fetch of the index.
//
// HÄMTNINGEN STARTAR PÅ AVSIKT, INTE PÅ FOKUS. Förr kallades laddaSokIndex() först
// i onFocus, och onFocus väntade in svaret innan listan öppnades — så hela
// nätverksrundan låg mellan tryckningen och första förslaget. Uppmätt i
// produktion 2026-08-28: 0,29–0,92 s bara för /api/search-index, som dessutom
// aldrig CDN-cachades (se huvudet i rutten). Det är den paus Leonard beskrev.
//
// Nu startar hämtningen redan på pointerenter/touchstart — händelser som fyrar
// FÖRE focus — så indexet oftast ligger i `cache` när fokus väl kommer och
// listan kan öppnas direkt. Kostar ingenting för den som aldrig går nära rutan.
let cache: SokTraff[] | null = null;
let inflight: Promise<SokTraff[] | null> | null = null;

// ETT MISSLYCKANDE FICK INTE BLI PERMANENT. Förr satte .catch() inflight till
// ett löst löfte om [] — och eftersom `cache` bara sätts i lyckade fallet var
// `inflight` kvar som icke-null för alltid. En enda skakig hämtning på mobilen
// dödade alltså sökrutan för hela sidbesöket: varje nytt anrop fick tillbaka
// samma tomma lista, utan att någonsin försöka igen. Det är den "ibland buggar
// den"-symptom Leonard rapporterade 2026-08-29.
//
// Nu nollställs inflight vid fel, så nästa tangenttryck gör ett nytt försök.
//
// TIMEOUT, av samma skäl. fetch utan gräns kan hänga i minuter på ett dåligt
// mobilnät, och await:et i onType/onFocus hänger med — panelen förblir tom
// utan att någonsin ge upp.
//
// ☠️ 6 s RÄCKTE INTE, OCH ETT FEL SÅG UT SOM "INGA TRÄFFAR" (2026-10-14).
// Indexet har vuxit till 4 184 produkter, 1,08 MB JSON och 270 kB över nätet.
// Uppmätt på en långsam mobilanslutning: 5,9 s. Med gränsen på 6 s avbröts det
// mitt i, löftet löstes med en tom lista, och panelen sa "Inga produkter
// matchade 'uppresningsfåtölj'" om en vara vi har 33 av (Leonards "det
// buggade"). Nu är gränsen 20 s, ett fel svarar null i stället för [], och
// panelen erbjuder sökningen på /sok, som inte behöver indexet, både medan vi
// väntar och när hämtningen fallit.
const TIMEOUT_MS = 20_000;
export function laddaSokIndex(): Promise<SokTraff[] | null> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/api/search-index", { signal: AbortSignal.timeout(TIMEOUT_MS) })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: SokTraff[]) => { cache = d; return d; })
      .catch(() => {
        inflight = null; // låt nästa anrop försöka igen
        return null; // ett fel, inte en tom katalog
      });
  }
  return inflight;
}

/** Indexet om det redan är hämtat, annars null. Hämtar inget. */
export function sokIndexHamtat(): SokTraff[] | null {
  return cache;
}
