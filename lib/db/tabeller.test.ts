import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ATT_KOPIERA, LLM_SAMLINGAR } from "./tabeller";

/** Kollektionsnamn i en källfil, som strängliteraler. */
function kollektionerI(fil: string): string[] {
  return [...readFileSync(fil, "utf-8").matchAll(/"(Fyndplats[A-Za-z]+)"/g)]
    .map((m) => m[1])
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();
}

describe("☠️ kopieringslistan måste vara KOMPLETT", () => {
  // Det här testet finns för att verifieringen har en blind fläck: den granskar
  // bara tabellerna i listan. En kollektion som saknas där är osynlig för BÅDA
  // — kopieringen hoppar över den, och verifieringen ger grönt ljus ändå.
  //
  // Uppmätt 2026-08-31: FyndplatsAliExpressTokens låg inte i listan. Efter
  // växlingen hade tokenraden varit tom, och eftersom refreshAndPersist ROTERAR
  // refresh-token vid varje förnyelse hade den enda giltiga legat kvar i Wix
  // medan produktionen läste Postgres. Vägen tillbaka: ny OAuth för hand.
  //
  // Ett grönt kvitto på en ofullständig lista är värre än ett rött på en
  // fullständig.

  const täckta = new Set<string>([
    ...ATT_KOPIERA.map((t) => t.kollektion),
    ...LLM_SAMLINGAR,
    // Tokenraden har egen form (en rad, låst id, snake_case) och kopieras
    // särskilt i rutten via PostgresStore.saveAliExpressTokens.
    "FyndplatsAliExpressTokens",
  ]);

  it.each([
    ["lib/store/wix-data.ts", "Store"],
    ["lib/sync/sync-log.ts", "SyncStore"],
    ["lib/store/product-hashes.ts", "produkt-hasharna"],
    ["lib/store/import-costs.ts", "importkostnaderna"],
    ["lib/llm/storage.ts", "LLM-lagret"],
    ["lib/store/reviews.ts", "recensionslagret"],
  ])("varje kollektion i %s (%s) täcks av kopieringen", (fil) => {
    const saknade = kollektionerI(fil).filter((k) => !täckta.has(k));
    expect(saknade).toEqual([]);
  });

  it("listan innehåller inget som ingen modul äger — då är den inaktuell", () => {
    const ägda = new Set(
      [
        "lib/store/wix-data.ts",
        "lib/sync/sync-log.ts",
        "lib/store/product-hashes.ts",
        "lib/store/import-costs.ts",
        "lib/llm/storage.ts",
        "lib/store/reviews.ts",
      ].flatMap(kollektionerI),
    );
    const föräldralösa = [...täckta].filter((k) => !ägda.has(k));
    expect(föräldralösa).toEqual([]);
  });
});
