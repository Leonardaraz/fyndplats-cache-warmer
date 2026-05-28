import { getMemoryStore } from "./store/memory";

/** Bekvämlighetsfunktion för att skriva en audit-rad (sväljer fel — loggning ska aldrig fälla en request). */
export async function audit(kind: string, ref?: string, detail?: string): Promise<void> {
  try {
    await getMemoryStore().appendAudit({ at: new Date().toISOString(), kind, ref, detail });
  } catch {
    // ignore
  }
}

/** Testläge: när DRY_RUN=1 görs inga skrivningar mot Wix (för säker testning mot ej-live). */
export function isDryRun(): boolean {
  return process.env.DRY_RUN === "1";
}
