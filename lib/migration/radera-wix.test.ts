import { describe, expect, it } from "vitest";
import {
  ALDRIG_RADERA,
  beslutaSida,
  fårRaderas,
  retentionFör,
  tidsfältFör,
  tolkaTid,
} from "./radera-wix";
import { ATT_KOPIERA, AUDIT, LLM_SAMLINGAR, SYNC_LOG } from "@/lib/db/tabeller";
import { AUDIT_RETENTION_DAYS, SYNC_LOG_RETENTION_DAYS } from "@/lib/retention";

const NU = Date.parse("2026-09-01T19:00:00.000Z");
const dygn = (n: number) => n * 24 * 60 * 60 * 1000;

describe("fårRaderas — spärrlistan", () => {
  it("☠️ de kollektioner butiken läser DIREKT ur Wix är fredade", () => {
    // Auktioner och redirects läses fortfarande rakt ur Wix Data av butiken;
    // flyttas de måste butiksrepot byggas om.
    expect(fårRaderas("FyndplatsAuctions")).toBe(false);
    expect(fårRaderas("FyndplatsRedirects")).toBe(false);
  });

  it("recensionerna är SLÄPPTA — butiken läser dem via API:t sedan 2026-09-02", () => {
    // ☠️ Det här testet vänder riktning med flit, så ändringen är en MEDVETEN
    // handling och inte en rad som tyst försvann ur en lista. Villkoren står i
    // kommentaren vid ALDRIG_RADERA och är mätta, inte antagna.
    expect(fårRaderas("FyndplatsImportedReviews")).toBe(true);
  });

  it("☠️ men recensionerna har INGET retention-fönster — det är den hårda spärren", () => {
    // Utan fönster kan beslutaSida aldrig skriva av en saknad rad som "utgången".
    // En enda Wix-rad som inte finns i Postgres avbryter hela sidan.
    expect(retentionFör("FyndplatsImportedReviews")).toBeNull();
    const beslut = beslutaSida(
      [{ nyckel: "p1__r1", tid: "2020-01-01T00:00:00.000Z" }],
      new Set(),
      retentionFör("FyndplatsImportedReviews"),
      NU,
    );
    expect(beslut.sort).toBe("avbryt");
  });

  it("☠️ tokenraden är fredad — den går inte att läsa tillbaka", () => {
    expect(fårRaderas("FyndplatsAliExpressTokens")).toBe(false);
  });

  it("☠️ spärrlistan vinner ÖVER kopielistan", () => {
    for (const namn of ALDRIG_RADERA) expect(fårRaderas(namn)).toBe(false);
  });

  it("de flyttade kollektionerna får raderas", () => {
    for (const spec of ATT_KOPIERA) {
      if ((ALDRIG_RADERA as readonly string[]).includes(spec.kollektion)) continue;
      expect(fårRaderas(spec.kollektion)).toBe(true);
    }
    for (const k of LLM_SAMLINGAR) expect(fårRaderas(k)).toBe(true);
  });

  it("☠️ en okänd kollektion får ALDRIG raderas — bara uppräknade", () => {
    expect(fårRaderas("FyndplatsNågotHeltAnnat")).toBe(false);
    expect(fårRaderas("")).toBe(false);
    expect(fårRaderas("Members/PrivateMembersData")).toBe(false);
  });
});

describe("retentionFör — talen ärvs, de skrivs inte av", () => {
  it("audit och sync_log ärver lib/retention.ts", () => {
    expect(retentionFör(AUDIT.kollektion)).toEqual({ dagar: AUDIT_RETENTION_DAYS });
    expect(retentionFör(SYNC_LOG.kollektion)).toEqual({ dagar: SYNC_LOG_RETENTION_DAYS });
  });

  it("☠️ en kollektion utan städning får INGET undantag", () => {
    expect(retentionFör("FyndplatsMappings")).toBeNull();
    expect(retentionFör("FyndplatsTasks")).toBeNull();
    expect(retentionFör("okänd")).toBeNull();
  });

  it("tidsfältet är Wix-radens namn, inte Postgres-kolumnen", () => {
    expect(tidsfältFör(AUDIT.kollektion)).toBe("at");
    expect(tidsfältFör(SYNC_LOG.kollektion)).toBe("checkedAt");
    expect(tidsfältFör("FyndplatsMappings")).toBeNull();
  });
});

describe("tolkaTid", () => {
  it("läser ISO-strängar", () => {
    expect(tolkaTid("2026-08-18T16:03:38.240Z")).toBe(Date.parse("2026-08-18T16:03:38.240Z"));
  });

  it("☠️ läser Wix {$date}-form — den kostade en halv skarp kopiering", () => {
    expect(tolkaTid({ $date: "2026-08-18T16:03:38.240Z" })).toBe(
      Date.parse("2026-08-18T16:03:38.240Z"),
    );
  });

  it("otolkbart ger null, aldrig en gissning", () => {
    expect(tolkaTid(undefined)).toBeNull();
    expect(tolkaTid(null)).toBeNull();
    expect(tolkaTid("")).toBeNull();
    expect(tolkaTid("i förrgår")).toBeNull();
    expect(tolkaTid({})).toBeNull();
    expect(tolkaTid(new Date("ogiltigt"))).toBeNull();
  });
});

describe("beslutaSida — utan retention är varje saknad rad ett stopp", () => {
  const utan = (rader: { nyckel: string }[], kopia: string[]) =>
    beslutaSida(rader, new Set(kopia), null, NU);

  it("raderar sidan när varje rad finns i kopian", () => {
    const b = utan([{ nyckel: "a" }, { nyckel: "b" }], ["a", "b", "z"]);
    expect(b).toEqual({ sort: "radera", utgångna: 0 });
  });

  it("☠️ EN saknad rad avbryter HELA sidan — inte bara den raden", () => {
    const b = utan([{ nyckel: "a" }, { nyckel: "b" }, { nyckel: "c" }], ["a", "c"]);
    expect(b.sort).toBe("avbryt");
    if (b.sort !== "avbryt") throw new Error("fel gren");
    expect(b.saknade).toEqual(["b"]);
    expect(b.av).toBe(3);
  });

  it("☠️ en tom kopia raderar ingenting — det är utplåningsfallet", () => {
    const b = utan([{ nyckel: "a" }, { nyckel: "b" }], []);
    expect(b.sort).toBe("avbryt");
  });

  it("en tom sida är inget fel — kollektionen är slut", () => {
    expect(utan([], [])).toEqual({ sort: "radera", utgångna: 0 });
  });

  it("rapporterar ALLA saknade, inte bara den första", () => {
    const b = utan(
      [{ nyckel: "a" }, { nyckel: "b" }, { nyckel: "c" }, { nyckel: "d" }],
      ["c"],
    );
    if (b.sort !== "avbryt") throw new Error("fel gren");
    expect(b.saknade).toEqual(["a", "b", "d"]);
  });

  it("☠️ en gammal rad räddas INTE av ålder när kollektionen saknar retention", () => {
    // FyndplatsMappings städas inte. En saknad mappning är alltid en lucka,
    // hur gammal raden än är.
    const b = utan([{ nyckel: "gammal" }], []);
    expect(b.sort).toBe("avbryt");
  });
});

describe("beslutaSida — retention skiljer utgången från förlorad", () => {
  // Det verkliga fallet ur torrkörningen 2026-09-01: 71 av 95 audit-rader
  // saknades i kopian, daterade 2026-08-18 — exakt 14 dygn bakåt, alltså
  // bortstädade ur Postgres med flit.
  const audit = (rader: { nyckel: string; tid?: unknown }[], kopia: string[]) =>
    beslutaSida(rader, new Set(kopia), { dagar: AUDIT_RETENTION_DAYS }, NU);

  it("☠️ en saknad rad ÄLDRE än fönstret är utgången, inte förlorad", () => {
    const b = audit(
      [{ nyckel: "gammal", tid: new Date(NU - dygn(15)).toISOString() }],
      [],
    );
    expect(b).toEqual({ sort: "radera", utgångna: 1 });
  });

  it("☠️ en saknad rad INNANFÖR fönstret är en verklig lucka och blockerar", () => {
    const b = audit([{ nyckel: "färsk", tid: new Date(NU - dygn(2)).toISOString() }], []);
    expect(b.sort).toBe("avbryt");
    if (b.sort !== "avbryt") throw new Error("fel gren");
    expect(b.saknade).toEqual(["färsk"]);
  });

  it("☠️ EN färsk lucka blockerar hela sidan även bland hundra utgångna", () => {
    const rader = [
      ...Array.from({ length: 100 }, (_, i) => ({
        nyckel: `g${i}`,
        tid: new Date(NU - dygn(20)).toISOString(),
      })),
      { nyckel: "färsk", tid: new Date(NU - dygn(1)).toISOString() },
    ];
    const b = audit(rader, []);
    expect(b.sort).toBe("avbryt");
    if (b.sort !== "avbryt") throw new Error("fel gren");
    expect(b.saknade).toEqual(["färsk"]);
  });

  it("☠️ saknad tidsstämpel ger ALDRIG undantag", () => {
    expect(audit([{ nyckel: "a" }], []).sort).toBe("avbryt");
    expect(audit([{ nyckel: "a", tid: "" }], []).sort).toBe("avbryt");
    expect(audit([{ nyckel: "a", tid: "inte ett datum" }], []).sort).toBe("avbryt");
  });

  it("en rad som FINNS i kopian räknas aldrig som utgången", () => {
    const b = audit([{ nyckel: "a", tid: new Date(NU - dygn(99)).toISOString() }], ["a"]);
    expect(b).toEqual({ sort: "radera", utgångna: 0 });
  });

  it("sync_log har ett kortare fönster än audit", () => {
    const tid = new Date(NU - dygn(10)).toISOString();
    // 10 dygn: utgången för sync_log (7), men INNANFÖR audits fönster (14).
    expect(
      beslutaSida([{ nyckel: "a", tid }], new Set(), { dagar: SYNC_LOG_RETENTION_DAYS }, NU).sort,
    ).toBe("radera");
    expect(
      beslutaSida([{ nyckel: "a", tid }], new Set(), { dagar: AUDIT_RETENTION_DAYS }, NU).sort,
    ).toBe("avbryt");
  });
});
