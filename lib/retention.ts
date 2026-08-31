// Hur länge loggarna sparas.
//
// Talen bor här, inte som magiska defaults inne i cron-rutten, av ett skäl:
// de har en INVARIANT mot läsarna som ska gå att testa. En retention som
// underskrider läsfönstret raderar det mejlet är på väg att läsa, och det
// felet syns inte — mejlet blir bara tystare.
//
// ☠️ BÅDA TALEN VAR RÄTT NÄR DE SATTES OCH BLEV FEL NÄR KATALOGEN VÄXTE.
// Samma klass av bugg som den obegränsade fan-outen (2026-08-28) och
// token-fönstret (2026-08-29): ingen commit att skylla på, bara en konstant
// som slutade hålla när volymen ändrades under den.
//
// Uppmätt 2026-08-31 vid 5 470 mappningar:
//
//   synk-loggen   ~600 rader/dygn → 21 dygn = 12 278 rader (8 306 äldre än en vecka)
//   audit-loggen  90 dygn = 22 977 rader, mot 4 723 när talet sattes
//
// Tillsammans fyllde de Wix Datas radtak, och när taket är nått avvisas VARJE
// ny rad — inklusive fulfillment-tasken för en betald order. Order 10024 föll
// så. Loggvolym är alltså inte en städfråga utan en tillgänglighetsfråga.
//
// Ändras katalogens storlek igen är det de här två talen som ska följa med.

/** Synk-loggen. Läses av morgonmejlet (senaste dygnet), /admin (200 senaste)
 *  och produkthistoriken (50 senaste) — ingenting läser äldre än så. */
export const SYNC_LOG_RETENTION_DAYS = 7;

/** Audit-loggen. Längre fönster än synk-loggen med flit: det är spåret man
 *  vill ha kvar när en order behöver redas ut i efterhand. `listAudit()`
 *  hämtar de N senaste (order-guard tar 500), aldrig efter datum. */
export const AUDIT_RETENTION_DAYS = 14;
