import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SYNC_DIGEST_WINDOW_MS } from "./orders/guard";
import { AUDIT_RETENTION_DAYS, LLM_STATS_RETENTION_DAYS, SYNC_LOG_RETENTION_DAYS } from "./retention";
import { __resetLlmMemoryStore, llmGet, llmPruneOlderThan, llmSave } from "./llm/storage";

const DAY_MS = 24 * 60 * 60 * 1000;
const ROUTE = "app/api/cron/aliexpress-sync/route.ts";

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

describe("städningen i synk-cronen", () => {
  const src = readFileSync(ROUTE, "utf-8");

  it("☠️ körs FÖRE synken — en städning efter arbetet kräver att arbetet lyckas", () => {
    // Under fan-out-haveriet 2026-08-28 dog lambdan mitt i loopen. Låg
    // städningen efter hade den aldrig körts, precis när den behövdes mest.
    const pruneIdx = src.indexOf("pruneLogOlderThan");
    const syncIdx = src.indexOf("await runDailySync(");
    expect(pruneIdx).toBeGreaterThan(-1);
    expect(syncIdx).toBeGreaterThan(-1);
    expect(pruneIdx).toBeLessThan(syncIdx);
  });

  it("☠️ är INTE gatad bakom en nattgrind", () => {
    // Nattgrinden (`getUTCHours() < 4`) sparade raderingsjobb men gjorde att ett
    // fullt lager inte kunde städas förrän nästa natt — upp till ett dygn med
    // tappade ordrar.
    //
    // Matchar bara KOD: kommentaren ovanför städningen citerar den borttagna
    // grinden med flit, och ett test som fäller på sin egen dokumentation
    // lär bara läsaren att stryka förklaringen.
    const utanKommentarer = src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .filter((rad) => !rad.trim().startsWith("//"))
      .join("\n");
    // Inget `[^)]*` här: den klassen stoppar vid första parentesen och kan
    // därför aldrig passera `new Date()` — en tidigare version av det här
    // testet passerade med grinden återinförd av just det skälet.
    expect(utanKommentarer).not.toContain("getUTCHours");
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

  it("städas i samma cron-körning som de andra loggarna", () => {
    const src = readFileSync(ROUTE, "utf-8");
    const llmIdx = src.indexOf("llmPruneOlderThan");
    const syncIdx = src.indexOf("await runDailySync(");
    expect(llmIdx).toBeGreaterThan(-1);
    // Samma invariant som de andra: städning FÖRE arbetet.
    expect(llmIdx).toBeLessThan(syncIdx);
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
