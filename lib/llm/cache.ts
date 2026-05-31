// Persistent resultatcache för LLM-anrop.
//
// Princip: hasha (operation + name + första 500 tecken av description +
// dependency-fingeravtryck). Träff = inget provider-anrop alls.
//
// Två-lagrad cache:
//   1. In-memory (snabbast — överlever inom processen / serverless-warm)
//   2. Wix Data (persistent — överlever cold-start och delas över regioner)
//
// TTL: 30 dagar default. Översättningar/kategorier hänger inte på dagsform.
// Om kollektionen ändras i Wix invaliderar fingeravtrycket cachen automatiskt.

import crypto from "node:crypto";
import { LLM_COLLECTIONS, llmGet, llmSave } from "./storage";

export const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface CacheRecord<T> {
  /** Hash-key (= dokument-id). */
  key: string;
  /** Operation, t.ex. "suggestCategory" — låter olika ops dela kollektion utan kollision. */
  op: string;
  /** Serialiserat resultat. */
  value: T;
  /** Vilken provider som genererade värdet — sparas för stats / debug. */
  provider: string;
  createdAt: string;
  /** ISO-tid då posten ska behandlas som utgången. */
  expiresAt: string;
}

const memCache = new Map<string, CacheRecord<unknown>>();
const MAX_MEM_ENTRIES = 1000;

/**
 * Bygger en stabil cache-key för en operation. dependencyFingerprint är t.ex.
 * sorterad list-av-slug:ar för categories — om listan ändras blir nyckeln ny
 * (och vi bypassar gammal cache).
 */
export function makeCacheKey(args: {
  op: string;
  name: string;
  description: string;
  dependencyFingerprint?: string;
}): string {
  const desc = (args.description ?? "").trim().slice(0, 500);
  const dep = args.dependencyFingerprint ?? "";
  return crypto
    .createHash("sha256")
    .update(`${args.op}|${args.name.trim()}|${desc}|${dep}`)
    .digest("hex");
}

export async function getCachedResult<T>(key: string): Promise<{ value: T; provider: string } | null> {
  const now = Date.now();

  // 1. In-memory först.
  const inMem = memCache.get(key);
  if (inMem) {
    if (new Date(inMem.expiresAt).getTime() > now) {
      return { value: inMem.value as T, provider: inMem.provider };
    }
    memCache.delete(key);
  }

  // 2. Persistent (Wix Data eller in-memory bucket beroende på STORE_BACKEND).
  const record = await llmGet<CacheRecord<T>>(LLM_COLLECTIONS.cache, key);
  if (!record) return null;
  if (new Date(record.expiresAt).getTime() <= now) return null;

  // Backfill in-memory så nästa anrop slipper Wix-rundtrip.
  setMemCache(key, record as CacheRecord<unknown>);
  return { value: record.value, provider: record.provider };
}

export async function setCachedResult<T>(
  key: string,
  op: string,
  value: T,
  provider: string,
  ttlMs = DEFAULT_TTL_MS,
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);
  const record: CacheRecord<T> = {
    key,
    op,
    value,
    provider,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  setMemCache(key, record as CacheRecord<unknown>);
  // Wix-skrivning är fire-and-forget för latens; await:ar ändå för att fel ska
  // hamna i logg samma turn.
  await llmSave(LLM_COLLECTIONS.cache, key, record as unknown as Record<string, unknown>);
}

function setMemCache(key: string, record: CacheRecord<unknown>): void {
  if (memCache.size > MAX_MEM_ENTRIES) {
    // Enkel FIFO-eviction. Översättning/kategori-cachen är inte hot-path för
    // memory, så en exakt LRU är overkill.
    const firstKey = memCache.keys().next().value;
    if (firstKey) memCache.delete(firstKey);
  }
  memCache.set(key, record);
}

/** Endast för tester. */
export function __clearMemCache(): void {
  memCache.clear();
}
