import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { REFRESH_SKIP_THRESHOLD_MS } from "./route";

// Invarianten som INTE fanns när den behövdes (incident 2026-08-29): rutten
// hoppade över förnyelsen så länge mer än 2 h återstod, medan workflowen körde
// var 12:e timme. En körning måste alltså råka landa i de sista två timmarna
// för att förnya något — 2/12 av gångerna. Token dog, och varje AliExpress-
// anrop svarade IllegalAccessToken i timmar utan att något sa till.
//
// Testet läser schemat ur workflow-filen i stället för att upprepa det, så
// tröskeln och schemat inte kan glida isär: ändrar någon cron-raden till
// tätare eller glesare körningar fäller testet om talet inte följer med.

const HOUR_MS = 60 * 60 * 1000;

/** Timmar mellan två körningar enligt workflowens cron-rad. */
function intervalTimmar(cron: string): number {
  const fält = cron.trim().split(/\s+/);
  if (fält.length !== 5) throw new Error(`Oväntad cron-form: "${cron}"`);
  const [minut, timme] = fält as [string, string, string, string, string];
  const stegvis = /^\*\/(\d+)$/.exec(timme);
  if (stegvis) return Number(stegvis[1]);
  if (timme === "*") return 1;
  // En fast timme (t.ex. "0 5 * * *") = en gång per dygn.
  if (/^\d+$/.test(timme) && /^\d+$/.test(minut)) return 24;
  // Okänd form → kasta hellre än att gissa ett tal som får testet att passera.
  throw new Error(`Kan inte tolka intervallet ur cron "${cron}" — utöka parsern.`);
}

function workflowCron(): string {
  const yml = readFileSync(".github/workflows/refresh-tokens.yml", "utf8");
  const m = /-\s*cron:\s*"([^"]+)"/.exec(yml);
  if (!m) throw new Error("Hittade ingen cron-rad i refresh-tokens.yml");
  return m[1];
}

describe("REFRESH_SKIP_THRESHOLD_MS", () => {
  it("rymmer minst två schemalagda körningar — annars kan token dö emellan", () => {
    const timmar = intervalTimmar(workflowCron());
    expect(REFRESH_SKIP_THRESHOLD_MS).toBeGreaterThanOrEqual(2 * timmar * HOUR_MS);
  });

  it("det gamla värdet (2 h) hade fällt det här testet", () => {
    const timmar = intervalTimmar(workflowCron());
    expect(2 * HOUR_MS).toBeLessThan(2 * timmar * HOUR_MS);
  });

  it("parsern gissar aldrig — en cron-form den inte kan tolka kastar", () => {
    expect(intervalTimmar("0 */6 * * *")).toBe(6);
    expect(intervalTimmar("0 * * * *")).toBe(1);
    expect(intervalTimmar("40 4 * * *")).toBe(24);
    expect(() => intervalTimmar("0 1-5 * * *")).toThrow(/Kan inte tolka/);
    expect(() => intervalTimmar("trasig")).toThrow();
  });
});
