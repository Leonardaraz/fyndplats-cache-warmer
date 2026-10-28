// Liten Wix Data-helper för LLM-specifik drift-data (cache, daglig spend,
// call-stats). Hålls åtskild från lib/store/wix-data.ts eftersom den lagrar
// drift/observability, inte domänobjekt (mappningar/tasks/audit).
//
// Backend-val: läser STORE_BACKEND via lib/store/backend.ts, men kan inte
// återanvända Store-interfacet eftersom det är knappt till product-/task-
// records. Här behöver vi nyckel-värde-look-up med TTL.
//
// När STORE_BACKEND=memory (default lokalt) är allt in-memory och försvinner
// vid omstart — det är ok eftersom cache är optimering, inte korrekthet.
//
// ☠️ IN-MEMORY ÄR DÄREMOT INTE OK I DRIFT, och det var nära att hända.
// Funktionen hette `useWixBackend()` och jämförde mot strängen "wix-data", så
// ett tredje backend-värde hade tyst gjort ALLT här in-memory. Det värsta är
// inte cachen: **den dagliga budgettaket bor i FyndplatsAnthropicSpend**, och
// in-memory får varje lambda sin EGEN räknare — taket hade slutat gälla utan
// ett ord i loggen. Hittat i auditen 2026-08-31, innan växlingen gjordes.
//
// I Postgres bor alla fyra samlingarna i EN tabell (`llm_kv`), nycklad på
// (collection, key). De hade identisk form hela tiden och skilde sig bara i
// vilken Wix-kollektion de låg i.

import { storeBackend, type StoreBackend } from "../store/backend";
import { sql } from "../db/client";
import { allaRader, fraga, hamta, spara, taBortMedFilter } from "../db/wix-data-klient";

export const LLM_COLLECTIONS = {
  cache: process.env.WIX_DATA_COL_LLM_CACHE ?? "FyndplatsClaudeCache",
  spend: process.env.WIX_DATA_COL_LLM_SPEND ?? "FyndplatsAnthropicSpend",
  stats: process.env.WIX_DATA_COL_LLM_STATS ?? "FyndplatsLlmStats",
  variantTranslations:
    process.env.WIX_DATA_COL_LLM_VARIANT_TRANSLATIONS ?? "FyndplatsVariantTranslations",
} as const;

function backend(): StoreBackend {
  return storeBackend();
}

// In-memory fallback (default när STORE_BACKEND=memory). Globalt så samma map
// återanvänds över hot-reloads i dev.
const memStore = new Map<string, Map<string, unknown>>();

function memBucket(col: string): Map<string, unknown> {
  let b = memStore.get(col);
  if (!b) {
    b = new Map();
    memStore.set(col, b);
  }
  return b;
}

export async function llmGet<T>(col: string, id: string): Promise<T | null> {
  const b = backend();
  if (b === "memory") {
    return (memBucket(col).get(id) as T) ?? null;
  }
  if (b === "postgres") {
    const rows = await sql()`select data from llm_kv
                              where collection = ${col} and key = ${id} limit 1`;
    return (rows[0] as { data?: T } | undefined)?.data ?? null;
  }
  try {
    return await hamta<T>(col, id);
  } catch (e) {
    // Tyst tolerans: cache/stats är best-effort. Vi vill INTE krascha importen
    // bara för att en stats-rad inte gick att läsa.
    console.warn(`[llm-storage] get ${col}/${id}: ${e instanceof Error ? e.message.slice(0, 160) : e}`);
    return null;
  }
}

export async function llmSave(col: string, id: string, data: Record<string, unknown>): Promise<void> {
  const b = backend();
  if (b === "memory") {
    memBucket(col).set(id, data);
    return;
  }
  if (b === "postgres") {
    const at = typeof data.at === "string" ? data.at : null;
    await sql()`insert into llm_kv (collection, key, data, at)
                values (${col}, ${id}, ${JSON.stringify(data)}, ${at})
                on conflict (collection, key)
                do update set data = excluded.data, at = excluded.at`;
    return;
  }
  try {
    await spara(col, id, data);
  } catch (e) {
    console.warn(`[llm-storage] save ${col}/${id}: ${e instanceof Error ? e.message.slice(0, 200) : e}`);
  }
}

export async function llmQuery<T>(
  col: string,
  filter?: Record<string, unknown>,
  sort?: { fieldName: string; order: "ASC" | "DESC" }[],
  limit = 100,
): Promise<T[]> {
  const b = backend();
  if (b === "memory") {
    const all = [...memBucket(col).values()] as T[];
    // Inget filter-stöd in-memory — den används bara för stats där vi sorterar
    // efter datum, vilket vi gör i ren JS i stats.ts.
    return all.slice(0, limit);
  }
  if (b === "postgres") {
    // Samma begränsning som in-memory: anroparen (stats.ts) filtrerar och
    // sorterar i JS. Att bygga ett filteruttryck här hade varit en andra
    // frågespråksdialekt att hålla i synk med Wix — utan någon anropare.
    const rows = await sql()`select data from llm_kv
                              where collection = ${col}
                              order by at desc nulls last limit ${limit}`;
    return rows.map((r) => (r as { data: T }).data);
  }
  try {
    return limit <= 1000
      ? await fraga<T>(col, { filter, sort, limit })
      : (await allaRader<T>(col, { filter, sort })).slice(0, limit);
  } catch (e) {
    // Admin-sidan visar hellre en tom lista än kraschar på stats.
    console.warn(`[llm-storage] query ${col}: ${e instanceof Error ? e.message.slice(0, 200) : e}`);
    return [];
  }
}

/**
 * Raderar rader äldre än `days` dygn, filtrerat på radens egna `at`-fält.
 *
 * ☠️ VARFÖR DEN BEHÖVS. `FyndplatsLlmStats` får EN rad per LLM-anrop och hade
 * ingen städning alls — den växte obegränsat och stod på 804 rader när
 * sitens CMS-postgräns nåddes 2026-08-31. Gränsen är site-BRED: när den är
 * full avvisas varje ny rad i VARJE kollektion, även fulfillment-tasken för en
 * betald order. Loggvolym är därför inte en städfråga utan en
 * tillgänglighetsfråga, och en logg utan retention är en tidsinställd bomb.
 *
 * Samma mekanik som synk-loggen och auditen: asynkront Wix-jobb, best-effort,
 * anroparen loggar felet och låter aldrig städningen fälla sin körning.
 * Returnerar Wix jobId (tomt vid okänt svar).
 */
export async function llmPruneOlderThan(
  col: string,
  days: number,
  nowMs = Date.now(),
): Promise<string> {
  const cutoff = new Date(nowMs - days * 24 * 60 * 60 * 1000).toISOString();
  const b = backend();
  if (b === "postgres") {
    const rows = await sql()`delete from llm_kv
                              where collection = ${col} and at is not null and at < ${cutoff}
                              returning key`;
    return `${rows.length} rader`;
  }
  if (b === "memory") {
    const bucket = memBucket(col);
    let n = 0;
    for (const [id, row] of bucket) {
      const at = (row as { at?: unknown })?.at;
      if (typeof at === "string" && at < cutoff) {
        bucket.delete(id);
        n++;
      }
    }
    return `${n} rader`;
  }
  return taBortMedFilter(col, { at: { $lt: cutoff } });
}

/** Endast för tester: tömmer in-memory-bucketen. Saknar effekt i prod. */
export function __resetLlmMemoryStore(): void {
  memStore.clear();
}
