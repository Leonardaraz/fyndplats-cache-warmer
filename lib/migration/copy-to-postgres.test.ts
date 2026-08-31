import { describe, expect, it, vi } from "vitest";
import { runCopy, SIDSTORLEK, type KopieraDeps } from "./copy-to-postgres";
import { ATT_KOPIERA, LLM_SAMLINGAR } from "../db/tabeller";

/** En Wix-kollektion med `antal` rader, sidhanterad som den riktiga. */
function källa(perKollektion: Record<string, number>) {
  return async (kollektion: string, offset: number, limit: number) => {
    const n = perKollektion[kollektion] ?? 0;
    const kvar = Math.max(0, n - offset);
    return Array.from({ length: Math.min(limit, kvar) }, (_, i) => ({
      _id: `${kollektion}-${offset + i}`,
    }));
  };
}

function deps(over: Partial<KopieraDeps> = {}): KopieraDeps & { skrivna: number } {
  const bag = { skrivna: 0 };
  return {
    läsSida: källa({}),
    skrivSida: async (_s, rader) => {
      bag.skrivna += rader.length;
      return rader.length;
    },
    skrivLlmSida: async (_k, rader) => {
      bag.skrivna += rader.length;
      return rader.length;
    },
    get skrivna() {
      return bag.skrivna;
    },
    ...over,
  } as KopieraDeps & { skrivna: number };
}

const MAPPNINGAR = ATT_KOPIERA[0];

describe("runCopy", () => {
  it("torrkörning är DEFAULT — utan dryRun:false skrivs ingenting", async () => {
    const d = deps({ läsSida: källa({ [MAPPNINGAR.kollektion]: 250 }) });
    const s = await runCopy({}, d);
    expect(s.dryRun).toBe(true);
    expect(s.totaltLäst).toBe(250);
    expect(s.totaltSkrivet).toBe(0);
    expect(d.skrivna).toBe(0);
  });

  it("☠️ läser HELA kollektionen, inte de första 10 000", async () => {
    // queryAll avkortade tyst vid 10 000 rader. Ett kopieringsskript som tar
    // 10 000 av 15 353 och säger "klart" är den halvmigrering som inte får ske.
    const d = deps({ läsSida: källa({ [MAPPNINGAR.kollektion]: 12_345 }) });
    const s = await runCopy({ dryRun: false }, d);
    expect(s.tabeller.find((t) => t.tabell === "mappings")?.läst).toBe(12_345);
    expect(s.totaltSkrivet).toBe(12_345);
  });

  it("lämnar en markör när tidsbudgeten tar slut, och fortsätter DÄR", async () => {
    let tid = 0;
    const d = deps({
      läsSida: källa({ [MAPPNINGAR.kollektion]: 1000 }),
      now: () => (tid += 50),
    });
    const första = await runCopy({ dryRun: false, timeBudgetMs: 120 }, d);
    expect(första.stoppadAv).toBe("tidsbudget");
    expect(första.cursor).not.toBeNull();
    expect(första.cursor!.tabell).toBe("mappings");
    expect(första.cursor!.offset).toBeGreaterThan(0);

    // Fortsättningen börjar på markörens offset — inte om från noll.
    const lästaOffset: number[] = [];
    const d2 = deps({
      läsSida: async (k, offset, limit) => {
        lästaOffset.push(offset);
        return källa({ [MAPPNINGAR.kollektion]: 1000 })(k, offset, limit);
      },
    });
    await runCopy({ dryRun: false, after: första.cursor, baraTabeller: ["mappings"] }, d2);
    expect(lästaOffset[0]).toBe(första.cursor!.offset);
  });

  it("☠️ en trasig sida fäller inte resten — och syns med sin offset", async () => {
    let n = 0;
    const d = deps({
      läsSida: källa({ [MAPPNINGAR.kollektion]: 300 }),
      skrivSida: async (_s, rader) => {
        if (++n === 2) throw new Error("deadlock detected");
        return rader.length;
      },
    });
    const s = await runCopy({ dryRun: false, baraTabeller: ["mappings"] }, d);
    const res = s.tabeller[0];
    expect(res.läst).toBe(300);
    expect(res.skrivet).toBe(200);
    expect(res.fel).toHaveLength(1);
    expect(res.fel[0]).toContain(`offset ${SIDSTORLEK}`);
    expect(res.fel[0]).toContain("deadlock");
  });

  it("LLM-samlingarna kopieras var för sig till llm_kv", async () => {
    const d = deps({ läsSida: källa({ [LLM_SAMLINGAR[2]]: 40 }) });
    const s = await runCopy({ dryRun: false }, d);
    const rad = s.tabeller.find((t) => t.tabell === `llm_kv:${LLM_SAMLINGAR[2]}`);
    expect(rad?.läst).toBe(40);
    expect(rad?.skrivet).toBe(40);
  });

  it("en okänd markör kastar i stället för att börja om från början", async () => {
    // Att tyst börja om hade dubbelläst hela katalogen och sett ut som framgång.
    await expect(
      runCopy({ after: { tabell: "hittepå", offset: 0 } }, deps()),
    ).rejects.toThrow(/okänd tabell/);
  });

  it("cursor är null när allt är klart", async () => {
    const s = await runCopy({ dryRun: false }, deps());
    expect(s.cursor).toBeNull();
    expect(s.stoppadAv).toBe("klart");
  });
});

describe("☠️ riktningen på kopieringen", () => {
  // Kopieringen är en upsert FRÅN Wix TILL Postgres. Det är rätt så länge Wix
  // är sanningen. Efter växlingen vänder riktningen: produktionen skriver till
  // Postgres och Wix fryser — och en körning då hade TYST rullat tillbaka
  // levande data till gårdagens värden, med ett svar som ser identiskt lyckat
  // ut ("15 310 skrivna").
  //
  // Spärren sitter i rutten (den känner till STORE_BACKEND); det här testet
  // låser den invariant motorn själv bär: den skriver ALDRIG i torrläge, så
  // ett torrt anrop är ofarligt oavsett riktning.
  it("torrläge rör aldrig målet, oavsett vad som är inställt", async () => {
    let skrivningar = 0;
    const s = await runCopy(
      {},
      deps({
        läsSida: källa({ [MAPPNINGAR.kollektion]: 500 }),
        skrivSida: async (_s, r) => {
          skrivningar += r.length;
          return r.length;
        },
        skrivLlmSida: async (_k, r) => {
          skrivningar += r.length;
          return r.length;
        },
      }),
    );
    expect(s.totaltLäst).toBe(500);
    expect(skrivningar).toBe(0);
  });
});
