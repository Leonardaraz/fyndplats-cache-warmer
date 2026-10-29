import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SYNC_DIGEST_WINDOW_MS } from "./orders/guard";
import { AUDIT_RETENTION_DAYS, LLM_STATS_RETENTION_DAYS, SYNC_LOG_RETENTION_DAYS } from "./retention";
import { __resetLlmMemoryStore, llmGet, llmPruneOlderThan, llmSave } from "./llm/storage";

const DAY_MS = 24 * 60 * 60 * 1000;
const ROUTE = "app/api/cron/retention/route.ts";
const KORNING = "lib/retention-korning.ts";

describe("retention mot läsarna", () => {
  it("☠️ synk-loggen sparas längre än morgonmejlet läser", () => {
    // Underskrider retentionen läsfönstret raderas det mejlet är på väg att
    // läsa — och felet syns inte, mejlet blir bara tystare. Marginalen ska
    // dessutom vara rejäl: digesten körs en gång per dygn och kan hoppa över
    // en körning utan att historiken hinner städas bort under den.
    expect(SYNC_LOG_RETENTION_DAYS * DAY_MS).toBeGreaterThan(SYNC_DIGEST_WINDOW_MS);
    expect(SYNC_LOG_RETENTION_DAYS * DAY_MS).toBeGreaterThanOrEqual(5 * SYNC_DIGEST_WINDOW_MS);
  });

  it("audit-loggen sparas längre än synk-loggen", () => {
    // Med flit: audit är spåret man vill ha kvar när en order ska redas ut i
    // efterhand, synk-loggen är rullande drift.
    expect(AUDIT_RETENTION_DAYS).toBeGreaterThan(SYNC_LOG_RETENTION_DAYS);
  });

  it("båda fönstren är ändliga — obegränsad logg fyllde radtaket", () => {
    // 2026-08-31: synk-loggen 12 278 rader och auditen 22 977 fyllde Wix Datas
    // radtak, och när taket är nått avvisas VARJE ny rad — även fulfillment-
    // tasken för en betald order.
    for (const d of [SYNC_LOG_RETENTION_DAYS, AUDIT_RETENTION_DAYS]) {
      expect(Number.isFinite(d)).toBe(true);
      expect(d).toBeGreaterThan(0);
      expect(d).toBeLessThanOrEqual(30);
    }
  });
});

// ☠️ Städningen låg i AliExpress-synkens rutt fram till 2026-10-29. Den cronen
// togs bort 2026-09-15, och sex veckor senare hade auditen 7 706 rader äldre
// än sitt fönster. Städning som hänger på ett annat jobb slutar när jobbet
// slutar. Sedan dess har den en egen cron (lib/retention-korning.ts).
describe("städningen i en egen cron", () => {
  const cronRad = () => {
    const konfig = JSON.parse(readFileSync("vercel.json", "utf-8")) as {
      crons?: { path: string; schedule: string }[];
    };
    return (konfig.crons ?? []).find((c) => c.path.split("?")[0] === "/api/cron/retention");
  };

  it("☠️ är schemalagd i vercel.json", () => {
    expect(cronRad()).toBeDefined();
  });

  it("☠️ körs varje dygn", () => {
    // Minut och timme får vara vad som helst, men dag, månad och veckodag ska
    // vara `*`. Ett schema som bara går vissa dagar låter auditen växa
    // emellan, och ett skrivfel där syns inte förrän tabellen är stor.
    const [, , dag, manad, veckodag] = (cronRad()?.schedule ?? "").trim().split(/\s+/);
    expect([dag, manad, veckodag]).toEqual(["*", "*", "*"]);
  });

  it("rutten städar alla tre loggarna med sina riktiga funktioner", () => {
    // Typen kräver tre steg, men ett steg kunde vara en tom funktion.
    const src = readFileSync(ROUTE, "utf-8");
    expect(src).toContain("getSyncStore().pruneLogOlderThan(");
    expect(src).toContain("getStore().pruneAuditOlderThan(");
    expect(src).toContain("llmPruneOlderThan(LLM_COLLECTIONS.stats,");
  });

  it("☠️ är INTE gatad bakom en nattgrind", () => {
    // Nattgrinden (`getUTCHours() < 4`) i synkrutten sparade raderingsjobb men
    // gjorde att ett fullt lager inte kunde städas förrän nästa natt — upp
    // till ett dygn med tappade ordrar.
    //
    // Matchar bara KOD: en kommentar som citerar den borttagna grinden får
    // stå kvar, och ett test som fäller på sin egen dokumentation lär bara
    // läsaren att stryka förklaringen.
    for (const fil of [ROUTE, KORNING]) {
      const utanKommentarer = readFileSync(fil, "utf-8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .split("\n")
        .filter((rad) => !rad.trim().startsWith("//"))
        .join("\n");
      // Inget `[^)]*` här: den klassen stoppar vid första parentesen och kan
      // därför aldrig passera `new Date()` — en tidigare version av det här
      // testet passerade med grinden återinförd av just det skälet.
      expect(utanKommentarer).not.toContain("getUTCHours");
    }
  });
});

describe("LLM-statistikens retention", () => {
  it("☠️ finns alls — samlingen hade ingen städning och åt site-bred kvot", () => {
    // FyndplatsLlmStats får EN rad per LLM-anrop. Utan städning växer den för
    // alltid, och postgränsen är delad med mappningar och ordrar: en logg utan
    // retention tar utrymme från fulfillment-tasken för en betald order.
    expect(Number.isFinite(LLM_STATS_RETENTION_DAYS)).toBe(true);
    expect(LLM_STATS_RETENTION_DAYS).toBeGreaterThan(0);
    expect(LLM_STATS_RETENTION_DAYS).toBeLessThanOrEqual(90);
  });

});

describe("llmPruneOlderThan", () => {
  it("raderar bara rader äldre än fönstret", async () => {
    __resetLlmMemoryStore();
    const now = Date.parse("2026-08-31T12:00:00Z");
    const dag = 24 * 60 * 60 * 1000;
    await llmSave("t", "gammal", { at: new Date(now - 40 * dag).toISOString() });
    await llmSave("t", "ny", { at: new Date(now - 2 * dag).toISOString() });
    const res = await llmPruneOlderThan("t", 30, now);
    expect(res).toBe("1 rader");
    expect(await llmGet("t", "gammal")).toBeNull();
    expect(await llmGet("t", "ny")).not.toBeNull();
  });

  it("rör inte rader utan giltigt at-fält — hellre kvar än gissa", async () => {
    __resetLlmMemoryStore();
    await llmSave("t", "utan-at", { costUsd: 1 });
    await llmPruneOlderThan("t", 30, Date.parse("2026-08-31T12:00:00Z"));
    expect(await llmGet("t", "utan-at")).not.toBeNull();
  });
});
