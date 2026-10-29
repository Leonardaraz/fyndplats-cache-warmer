// Spårningens klocka. GitHub Actions körde schemat "0 */3 * * *" 22 gånger på
// fem dagar i stället för ~41 (24–29 oktober 2026), med 2,3–8,4 timmar mellan
// körningarna. Motorn ligger på Pro, där Vercels cron går på minuten, så
// spårningen schemaläggs i vercel.json. Se CLAUDE.md, "Spårningen hämtas av
// Vercels cron, inte av GitHub".
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROT = join(__dirname, "..", "..", "..", "..");
const RUTT = "/api/cron/poll-tracking";

function spårningsrader(): { path: string; schedule: string }[] {
  const crons: { path: string; schedule: string }[] = JSON.parse(readFileSync(join(ROT, "vercel.json"), "utf8")).crons;
  return crons.filter((c) => c.path.split("?")[0] === RUTT);
}

describe("spårningens klocka", () => {
  it("vercel.json schemalägger spårningen exakt en gång", () => {
    expect(spårningsrader()).toHaveLength(1);
  });

  it("den går minst var tredje timme, varje dag", () => {
    const [rad] = spårningsrader();
    const [minut, timme, dag, manad, veckodag] = rad.schedule.trim().split(/\s+/);
    expect(minut).toMatch(/^\d+$/);
    expect([dag, manad, veckodag]).toEqual(["*", "*", "*"]);
    const steg = timme === "*" ? 1 : Number(/^\*\/(\d+)$/.exec(timme)?.[1]);
    expect(steg).toBeGreaterThanOrEqual(1);
    expect(steg).toBeLessThanOrEqual(3);
  });

  it("☠️ GitHub-schemat är borta: två samtidiga körningar hade försökt skicka samma rad", () => {
    const yml = readFileSync(join(ROT, ".github", "workflows", "poll-tracking.yml"), "utf8");
    // Kommentarerna får nämna det gamla schemat, så de räknas inte.
    const kod = yml.split("\n").filter((r) => !r.trimStart().startsWith("#")).join("\n");
    expect(kod).not.toMatch(/^\s*schedule:/m);
    expect(kod).not.toMatch(/cron:/);
    expect(kod).toMatch(/^\s*workflow_dispatch:/m);
  });
});
