// Loggstädningen: synkloggen, auditen och LLM-statistiken, var och en efter
// sitt fönster i lib/retention.ts. Körs av /api/cron/retention en gång per
// dygn.
//
// ☠️ EGEN CRON SEDAN 2026-10-29. Städningen låg i AliExpress-synkens rutt, och
// den cronen togs bort 2026-09-15 (#633). Sedan dess städade ingenting. Den
// 2026-10-29 hade auditen 10 104 rader, varav 7 706 äldre än 14 dygn, och
// synkloggen 8 954, alla äldre än sju. Leonard bestämde samma dag att
// AliExpress-synken ska förbli avstängd. Städning som hänger på ett annat jobb
// slutar när jobbet slutar.
//
// En körning per dygn räcker sedan Wix Business Elite (2026-10-28, tio
// miljoner rader). Den 2026-08-31 var Wix tak 4 000 rader för hela sajten, och
// då behövdes städningen varje timme: ett fullt lager avvisade nya order-tasks.
//
// Tre egenskaper som inte ska tas bort:
//   1. Varje steg körs även när ett annat föll. Ett fel i auditen får inte
//      lämna synkloggen ostädad.
//   2. Fönstren går att ändra med samma miljövariabler som förut
//      (SYNC_LOG_RETENTION_DAYS, AUDIT_RETENTION_DAYS, LLM_STATS_RETENTION_DAYS).
//      Ett värde som inte är ett positivt tal ger standardfönstret, aldrig noll
//      dygn, som hade raderat allt.
//   3. Funktionen tar sina beroenden som argument, så testerna ser exakt vilka
//      fönster och vilken tid varje steg fick.

import { AUDIT_RETENTION_DAYS, LLM_STATS_RETENTION_DAYS, SYNC_LOG_RETENTION_DAYS } from "./retention";

export type RetentionNamn = "synklogg" | "audit" | "llm-statistik";

export interface RetentionSteg {
  namn: RetentionNamn;
  dagar: number;
  ok: boolean;
  /** Wix jobId (Wix Data), antal raderade rader (Postgres) eller felet. */
  svar: string;
}

/** Ett steg får sitt fönster i dygn och klockan, och svarar som städfunktionerna. */
export type Stadning = (dagar: number, nuMs: number) => Promise<string>;

export interface RetentionDeps {
  synklogg: Stadning;
  audit: Stadning;
  llmStatistik: Stadning;
}

function dagarUrMiljo(varde: string | undefined, standard: number): number {
  if (!varde) return standard;
  const n = Number(varde);
  return Number.isFinite(n) && n > 0 ? n : standard;
}

/** Fönstren i dygn: standard ur lib/retention.ts, eller miljövariabeln. */
export function retentionDagar(env: Record<string, string | undefined> = process.env): Record<RetentionNamn, number> {
  return {
    synklogg: dagarUrMiljo(env.SYNC_LOG_RETENTION_DAYS, SYNC_LOG_RETENTION_DAYS),
    audit: dagarUrMiljo(env.AUDIT_RETENTION_DAYS, AUDIT_RETENTION_DAYS),
    "llm-statistik": dagarUrMiljo(env.LLM_STATS_RETENTION_DAYS, LLM_STATS_RETENTION_DAYS),
  };
}

export async function korRetention(
  deps: RetentionDeps,
  opts: { nuMs?: number; env?: Record<string, string | undefined> } = {},
): Promise<RetentionSteg[]> {
  const nuMs = opts.nuMs ?? Date.now();
  const dagar = retentionDagar(opts.env);
  const steg: [RetentionNamn, Stadning][] = [
    ["synklogg", deps.synklogg],
    ["audit", deps.audit],
    ["llm-statistik", deps.llmStatistik],
  ];
  const ut: RetentionSteg[] = [];
  for (const [namn, stada] of steg) {
    try {
      ut.push({ namn, dagar: dagar[namn], ok: true, svar: await stada(dagar[namn], nuMs) });
    } catch (e) {
      ut.push({ namn, dagar: dagar[namn], ok: false, svar: (e instanceof Error ? e.message : String(e)).slice(0, 200) });
    }
  }
  return ut;
}
