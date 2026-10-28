// Adressen när motorn skickar workflowens kopieringsanrop vidare till butiken
// (app/api/admin/butik-neon-till-wix). Bara de parametrar butikens rutt tar
// följer med; allt annat stannar i motorn.

export const TILLATNA_PARAMETRAR = ["lage", "dryRun", "tabeller", "after", "vaxling", "kopieradSedan"] as const;

export function butikensAdress(inkommande: string, bas: string): string {
  const fran = new URL(inkommande);
  const till = new URL(`${bas.replace(/\/$/, "")}/api/admin/neon-till-wix`);
  for (const k of TILLATNA_PARAMETRAR) {
    const v = fran.searchParams.get(k);
    if (v !== null) till.searchParams.set(k, v);
  }
  return till.toString();
}
