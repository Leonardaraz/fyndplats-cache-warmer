// Fyndauktionens nattliga seed går på Vercels klocka (2026-11-14). GitHub-schemat
// "47 3 * * *" startade 10:56, 11:35 och 11:51 UTC de tre senaste dygnen, alltså
// efter att dagens fynd startat 07:00: seeden prövar morgondagens schemalagda fynd
// mot 30-dagarsspärren (planSeed, liveNotRefreshed), och en vara som slutat klara
// spärren hann aldrig bytas ut. Workflowen finns kvar som larm och andra chans.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROT = join(__dirname, "..", "..", "..", "..");
const RUTT = "/api/cron/auction-seed";

function seedrader(): { path: string; schedule: string }[] {
  const crons: { path: string; schedule: string }[] = JSON.parse(readFileSync(join(ROT, "vercel.json"), "utf8")).crons;
  return crons.filter((c) => c.path.split("?")[0] === RUTT);
}

describe("seedens klocka", () => {
  it("vercel.json schemalägger seeden exakt en gång, och den skriver", () => {
    const rader = seedrader();
    expect(rader).toHaveLength(1);
    expect(new URL(rader[0].path, "https://x").searchParams.get("apply")).toBe("1");
    // Aldrig force från klockan: skyddsräcket ska stoppa en trasig katalogläsning.
    expect(rader[0].path).not.toMatch(/force/);
  });

  it("☠️ varje natt, före fyndens start och utanför Aosoms synkfönster", () => {
    const [minut, timme, dag, manad, veckodag] = seedrader()[0].schedule.trim().split(/\s+/);
    expect([dag, manad, veckodag]).toEqual(["*", "*", "*"]);
    const m = Number(minut);
    const t = Number(timme);
    // Fynden startar 07:00 svensk tid: 05:00 UTC sommartid, 06:00 vintertid.
    expect(t * 60 + m).toBeLessThan(5 * 60);
    // Synkfönstret: :12–:29 var tredje timme från 00 UTC (lib/wix/synkfonster.ts).
    const iFonster = t % 3 === 0 && m >= 12 && m <= 29;
    expect(iFonster).toBe(false);
  });

  it("workflowen finns kvar för körningar för hand och som larm", () => {
    const wf = readFileSync(join(ROT, ".github/workflows/auction-seed.yml"), "utf8");
    expect(wf).toMatch(/workflow_dispatch:/);
    expect(wf).toMatch(/"ok":false/);
  });
});
