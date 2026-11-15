// Fyndauktionens klocka. GitHub Actions körde schemat "*/10 * * * *" 29 gånger
// på 122 timmar i stället för ~735 (uppmätt 24–29 oktober 2026, ämnesfil 39),
// så tickens enda pålitliga klocka var Vercels timcron. Med 50 och 100 fynd om
// dagen (Black Week) kan ett tick lämna arbete till nästa (lib/auction/tick.ts,
// `kvar`), och då måste nästa komma inom minuter, inte en timme: en
// återställning kl 19 som väntar en timme är en timme med auktionspris efter
// auktionens slut. Motorn ligger på Pro, där Vercels cron går på minuten.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROT = join(__dirname, "..", "..", "..", "..");
const RUTT = "/api/cron/auction-tick";

function tickrader(): { path: string; schedule: string }[] {
  const crons: { path: string; schedule: string }[] = JSON.parse(readFileSync(join(ROT, "vercel.json"), "utf8")).crons;
  return crons.filter((c) => c.path.split("?")[0] === RUTT);
}

/** Minuterna i timmen som ett cron-fält träffar ("*", "*\/10", "0,10,20" …). */
function minuter(falt: string): number[] {
  if (falt === "*") return Array.from({ length: 60 }, (_, i) => i);
  const steg = /^\*\/(\d+)$/.exec(falt);
  if (steg) return Array.from({ length: Math.ceil(60 / Number(steg[1])) }, (_, i) => i * Number(steg[1]));
  return falt.split(",").map(Number);
}

describe("fyndauktionens klocka", () => {
  it("vercel.json schemalägger ticken exakt en gång", () => {
    expect(tickrader()).toHaveLength(1);
  });

  it("☠️ den går var tionde minut eller oftare, varje timme, varje dag", () => {
    const [rad] = tickrader();
    const [minut, timme, dag, manad, veckodag] = rad.schedule.trim().split(/\s+/);
    expect([timme, dag, manad, veckodag]).toEqual(["*", "*", "*", "*"]);
    const m = minuter(minut);
    const glapp = m.map((x, i) => (i + 1 < m.length ? m[i + 1] - x : 60 - x + m[0]));
    expect(Math.max(...glapp)).toBeLessThanOrEqual(10);
  });

  it("den går på hel timme, när auktionens pris byter steg", () => {
    const [rad] = tickrader();
    expect(minuter(rad.schedule.trim().split(/\s+/)[0])).toContain(0);
  });
});
