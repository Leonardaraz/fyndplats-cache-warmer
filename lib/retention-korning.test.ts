import { describe, expect, it } from "vitest";
import { korRetention, retentionDagar, type RetentionDeps } from "./retention-korning";
import { AUDIT_RETENTION_DAYS, LLM_STATS_RETENTION_DAYS, SYNC_LOG_RETENTION_DAYS } from "./retention";

const NU = Date.parse("2026-10-29T02:50:00Z");

/** Beroenden som minns vad varje steg fick. */
function spion(fel: Partial<Record<keyof RetentionDeps, Error>> = {}) {
  const anrop: { steg: keyof RetentionDeps; dagar: number; nuMs: number }[] = [];
  const steg = (namn: keyof RetentionDeps) => async (dagar: number, nuMs: number) => {
    anrop.push({ steg: namn, dagar, nuMs });
    const f = fel[namn];
    if (f) throw f;
    return `jobb-${namn}`;
  };
  const deps: RetentionDeps = {
    synklogg: steg("synklogg"),
    audit: steg("audit"),
    llmStatistik: steg("llmStatistik"),
  };
  return { deps, anrop };
}

describe("korRetention", () => {
  it("städar alla tre loggarna med sina fönster och samma klocka", async () => {
    const { deps, anrop } = spion();
    const steg = await korRetention(deps, { nuMs: NU, env: {} });
    expect(anrop).toEqual([
      { steg: "synklogg", dagar: SYNC_LOG_RETENTION_DAYS, nuMs: NU },
      { steg: "audit", dagar: AUDIT_RETENTION_DAYS, nuMs: NU },
      { steg: "llmStatistik", dagar: LLM_STATS_RETENTION_DAYS, nuMs: NU },
    ]);
    expect(steg.map((s) => [s.namn, s.ok, s.svar])).toEqual([
      ["synklogg", true, "jobb-synklogg"],
      ["audit", true, "jobb-audit"],
      ["llm-statistik", true, "jobb-llmStatistik"],
    ]);
  });

  it("☠️ ett steg som faller stoppar inte de andra", async () => {
    const { deps, anrop } = spion({ audit: new Error("WDE0014: kvoten") });
    const steg = await korRetention(deps, { nuMs: NU, env: {} });
    expect(anrop.map((a) => a.steg)).toEqual(["synklogg", "audit", "llmStatistik"]);
    expect(steg.map((s) => s.ok)).toEqual([true, false, true]);
    expect(steg[1].svar).toContain("WDE0014");
  });

  it("fönstren går att ändra med samma miljövariabler som förut", async () => {
    const { deps, anrop } = spion();
    await korRetention(deps, {
      nuMs: NU,
      env: { SYNC_LOG_RETENTION_DAYS: "3", AUDIT_RETENTION_DAYS: "20", LLM_STATS_RETENTION_DAYS: "45" },
    });
    expect(anrop.map((a) => a.dagar)).toEqual([3, 20, 45]);
  });
});

describe("retentionDagar", () => {
  it("☠️ ett värde som inte är ett positivt tal ger standardfönstret, aldrig noll dygn", () => {
    // Noll dygn hade raderat varje rad, och ett negativt fönster rader från framtiden.
    for (const varde of ["0", "-3", "abc", "", "NaN", "Infinity"]) {
      expect(retentionDagar({ AUDIT_RETENTION_DAYS: varde }).audit).toBe(AUDIT_RETENTION_DAYS);
    }
  });

  it("utan miljövariabler gäller lib/retention.ts", () => {
    expect(retentionDagar({})).toEqual({
      synklogg: SYNC_LOG_RETENTION_DAYS,
      audit: AUDIT_RETENTION_DAYS,
      "llm-statistik": LLM_STATS_RETENTION_DAYS,
    });
  });
});
