// Steg 6: radera drift-datan ur Wix Data — det som faktiskt frigör 4 000-taket.
//
// ☠️ DET HÄR ÄR DEN ENDA OÅTERKALLELIGA OPERATIONEN I HELA MIGRATIONEN.
// Kopieringen kunde köras om, växlingen är en env-variabel, verifieringen
// skriver ingenting. Den här raderar rader som inte finns någon annanstans än
// i Postgres efteråt. Varje spärr nedan finns för att en felaktig körning inte
// ska gå att ångra.
//
// FEM EGENSKAPER SOM INTE SKA TAS BORT
//
// 1. ☠️ VARJE RAD SLÅS UPP I POSTGRES INNAN DEN RADERAS. Inte radantal, inte
//    ett stickprov — varje id. Saknas en enda rad i kopian avbryts sidan och
//    ingenting raderas ur den. Kopieringens verifiering jämför tio rader per
//    tabell; det duger för att upptäcka en trasig kopia, men inte för att
//    auktorisera en radering av 15 000 rader.
//
// 2. ☠️ SPÄRRLISTAN ÄR EGEN, INTE HÄRLEDD UR ATT_KOPIERA. Tre kollektioner
//    läses DIREKT av butiken (recensioner, auktioner, redirects) och flyttade
//    aldrig. Att bara lita på "vi loopar över kopielistan" hade betytt att en
//    framtida rad i den listan tyst vidgar blast-radien till en kollektion
//    butiken behöver. Listan här är ett andra lås som måste öppnas medvetet.
//
// 3. ☠️ RADERING SKER PÅ EXPLICIT ID-LISTA, ALDRIG PÅ FILTER. Ett filter som
//    matchar bredare än avsett är exakt det fel som inte går att ta tillbaka.
//
// 4. ☠️ VI LÄSER ALLTID FRÅN OFFSET 0. Radering KRYMPER kollektionen, så en
//    offset-markör hoppar över precis så många rader som nyss raderades — samma
//    fälla som media-cleanup gick i (se CLAUDE.md: "markören är en OFFSET").
//    Nästa sida flyttar sig till offset 0 av sig själv, så loopen konvergerar.
//
// 5. Torrkörning är default. Utan dryRun=false läses och verifieras allt, men
//    ingenting raderas — samma hållning som resten av husets rutter.

import { ATT_KOPIERA, AUDIT, LLM_SAMLINGAR, SYNC_LOG } from "@/lib/db/tabeller";
import { AUDIT_RETENTION_DAYS, SYNC_LOG_RETENTION_DAYS } from "@/lib/retention";

/** Kollektioner som ALDRIG får röras, oavsett vad kopielistan säger.
 *  De tre första läses direkt av butiksrepot; flyttas de måste butiken byggas
 *  om. Tokenraden står här för att en raderad token inte går att läsa tillbaka
 *  — vägen tillbaka är ny OAuth för hand, samma återvändsgränd som de 30
 *  dygnen utan förnyelse 2026-08-29.
 *
 *  ⚠️ RÄTTAT 2026-09-02: raden påstod tidigare att de tre INTE frigör de rader
 *  som binder. Det stämde när drift-datan var 15 000 rader och de tre var
 *  marginal. Nu är drift-datan borta, och `FyndplatsImportedReviews` är
 *  **2 514 av de ~3 355 rader som är kvar** — alltså 75 % av allt som binder
 *  det globala 4 000-taket. Recensionerna är inte offret för taket, de ÄR det.
 *
 *  ☠️ MEN DE STÅR KVAR HÄR ÄNDÅ, och det är hela poängen med listan: kopian
 *  till Postgres finns sedan 2026-09-02, men butiksrepot läser fortfarande
 *  kollektionen DIREKT (`lib/reviews.ts` och `lib/review-aggregates.ts` på
 *  grenen headless-site). Raderas raderna innan de läsarna följt med blir
 *  produktsidorna TOMMA på recensioner — inte trasiga, tomma, alltså exakt det
 *  fel som spårningssidan drabbades av 2026-09-01 och som varken en kodaudit
 *  eller en felräknare kunde se. Ta bort raden ur listan FÖRST när butiken
 *  läser via API:t. */
export const ALDRIG_RADERA = [
  "FyndplatsImportedReviews",
  "FyndplatsAuctions",
  "FyndplatsRedirects",
  "FyndplatsAliExpressTokens",
  "FyndplatsAppConfig",
  "FyndplatsPricingConfig",
] as const;

export function fårRaderas(kollektion: string): boolean {
  if ((ALDRIG_RADERA as readonly string[]).includes(kollektion)) return false;
  const tillåtna = [
    ...ATT_KOPIERA.map((s) => s.kollektion),
    ...LLM_SAMLINGAR,
  ];
  return tillåtna.includes(kollektion);
}

/** Retention-fönstret för en kollektion vars gamla rader städas bort ur
 *  Postgres av synken. `null` = ingen städning, alltså ska varje rad finnas. */
export type Retention = { dagar: number } | null;

export type Rad = { nyckel: string; tid?: unknown };

export type SidBeslut =
  | { sort: "radera"; utgångna: number }
  | { sort: "avbryt"; saknade: string[]; av: number };

/**
 * ☠️ EN RAD SOM SAKNAS I KOPIAN ÄR INTE NÖDVÄNDIGTVIS FÖRLORAD — DEN KAN VARA
 * UTGÅNGEN. Det här är den distinktion torrkörningen 2026-09-01 tvingade fram,
 * och den är hela skillnaden mellan en säker radering och dataförlust.
 *
 * Sedan växlingen städar synken `audit` (>14 dygn) och `sync_log` (>7 dygn) ur
 * POSTGRES. Wix städas inte längre av någon, så de gamla raderna ligger kvar
 * där. Torrkörningen såg 71 av 95 audit-rader "saknas i kopian" — daterade
 * 2026-08-18, alltså exakt AUDIT_RETENTION_DAYS bakåt, och 50 av 100
 * sync_log-rader daterade 2026-08-25, exakt SYNC_LOG_RETENTION_DAYS bakåt.
 * De är borta med flit.
 *
 * Regeln blir därför: en rad som saknas i kopian får raderas ur Wix BARA om
 * den är äldre än tabellens retention-fönster. Saknas den och ligger INNANFÖR
 * fönstret är det en verklig lucka i kopian, och då raderas ingenting alls ur
 * sidan — inte ens de rader som råkar finnas. En delvis raderad sida är svårare
 * att upptäcka och laga än en orörd.
 *
 * Saknad eller otolkbar tidsstämpel ger ALDRIG undantag. Tomt fält är ingen
 * bevisning, och domen här raderar rader permanent — samma hållning som
 * `classifyListingAvailability`, där saknad status blir `unknown` och aldrig
 * `offline`.
 */
export function beslutaSida(
  rader: Rad[],
  iKopian: Set<string>,
  retention: Retention,
  nu: number,
): SidBeslut {
  const gräns = retention ? nu - retention.dagar * 24 * 60 * 60 * 1000 : null;

  const saknade: string[] = [];
  let utgångna = 0;

  for (const rad of rader) {
    if (iKopian.has(rad.nyckel)) continue;
    if (gräns !== null && ärÄldreÄn(rad.tid, gräns)) {
      utgångna++;
      continue;
    }
    saknade.push(rad.nyckel);
  }

  if (saknade.length > 0) return { sort: "avbryt", saknade, av: rader.length };
  return { sort: "radera", utgångna };
}

function ärÄldreÄn(tid: unknown, gräns: number): boolean {
  const ms = tolkaTid(tid);
  return ms !== null && ms < gräns;
}

/** Wix returnerar datum antingen som ISO-sträng eller som {"$date": "..."} —
 *  den andra formen kostade en halv skarp kopiering att upptäcka. */
export function tolkaTid(tid: unknown): number | null {
  if (tid instanceof Date) return Number.isNaN(tid.getTime()) ? null : tid.getTime();
  if (typeof tid === "number") return Number.isFinite(tid) ? tid : null;
  const s =
    typeof tid === "string"
      ? tid
      : typeof (tid as { $date?: unknown })?.$date === "string"
        ? ((tid as { $date: string }).$date)
        : null;
  if (!s) return null;
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Vilka kollektioner som städas ur Postgres, och med vilket fönster.
 *
 * ☠️ Talen ÄRVS från lib/retention.ts, de skrivs inte av. Skulle någon ändra
 * SYNC_LOG_RETENTION_DAYS utan att ändra här hade raderingen antingen blockerat
 * i onödan eller — mycket värre — vinkat igenom rader som fortfarande borde
 * finnas i kopian. Samma skäl som SHIP_AXIS_RE och EU_TULL_CODES: tvillingar
 * glider isär.
 *
 * `fält` är tidsstämpeln i WIX-radens data, inte Postgres-kolumnnamnet.
 */
const RETENTION: Record<string, { dagar: number; fält: string }> = {
  [AUDIT.kollektion]: { dagar: AUDIT_RETENTION_DAYS, fält: "at" },
  [SYNC_LOG.kollektion]: { dagar: SYNC_LOG_RETENTION_DAYS, fält: "checkedAt" },
};

/** Retention-fönstret för en kollektion, eller null när den inte städas.
 *  ☠️ Default är null — en okänd kollektion får INGET undantag. */
export function retentionFör(kollektion: string): Retention {
  const r = RETENTION[kollektion];
  return r ? { dagar: r.dagar } : null;
}

/** Vilket fält i Wix-raden som bär tidsstämpeln, om kollektionen städas. */
export function tidsfältFör(kollektion: string): string | null {
  return RETENTION[kollektion]?.fält ?? null;
}
