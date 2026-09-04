// Per-rad-tolkningen av Wix bulk-lagersvar.
//
// ☠️ VARFÖR DEN HÄR FILEN FINNS. Så länge synken skrev EN produkts varianter
// per anrop räckte det att veta OM något föll. Batchas femtio produkter i ett
// anrop måste varje utfall tillbaka till RÄTT produkt: "Wix före mappningen"
// är en garanti per produkt, och en mappning får aldrig skrivas för en
// skrivning som föll. Bokförs ett radfel på fel produkt blir det tyst — samma
// klass som `sku`-förväxlingen som lät prissynken skriva till ingenting i en
// månad.
//
// ☠️ SVAREN NEDAN ÄR UPPMÄTTA MOT SKARPA WIX 2026-09-04, inte påhittade. Ett
// första utkast av parsern byggdes på antagandet att bara FALLNA rader listas;
// tre befintliga retry-tester föll och hade rätt att göra det. Mätningen
// (`/api/admin/wix-inventory-probe`, läget `api-matning-skriv`) visar att båda
// utfallen bär hela raden med id och originalIndex.

import { describe, expect, it } from "vitest";
import { summarizeBulkInventoryResult, tolkaBulkUtfall } from "./client";

/** Ordagrant ur mätningen 2026-09-04 — en värdeneutral skrivning som gick igenom. */
const MATT_FRAMGANG = {
  results: [{ itemMetadata: { id: "2f3b972c-bcdd-4ed6-b775-275271d42ffc", originalIndex: 0, success: true } }],
  bulkActionMetadata: { totalSuccesses: 1, totalFailures: 0, undetailedFailures: 0 },
};

/** Ordagrant ur mätningen — en rad skickad med föråldrad revision. */
const MATT_FEL = {
  results: [{
    itemMetadata: {
      id: "2f3b972c-bcdd-4ed6-b775-275271d42ffc",
      originalIndex: 0,
      success: false,
      error: {
        code: "INVALID_REVISION",
        description: "Outdated revision for entity id",
        data: { revisionViolation: { entityId: "2f3b972c-bcdd-4ed6-b775-275271d42ffc" } },
      },
    },
  }],
  bulkActionMetadata: { totalSuccesses: 0, totalFailures: 1, undetailedFailures: 0 },
};

const ID = "2f3b972c-bcdd-4ed6-b775-275271d42ffc";

describe("tolkaBulkUtfall — mot de UPPMÄTTA svaren", () => {
  it("ett lyckat svar bär sin rad, och raden räknas som lyckad", () => {
    expect(tolkaBulkUtfall(MATT_FRAMGANG, [ID])).toEqual({ lyckade: [ID], misslyckade: [] });
  });

  it("ett revisionsfel räknas som misslyckat med Wix egen beskrivning", () => {
    const r = tolkaBulkUtfall(MATT_FEL, [ID]);
    expect(r.lyckade).toEqual([]);
    expect(r.misslyckade).toEqual([{ id: ID, fel: "Outdated revision for entity id" }]);
  });

  it("☠️ blandat utfall adresseras per rad — inte allt-eller-inget", () => {
    // Det här är hela skälet till batchningen: en produkts revisionskonflikt
    // får inte hindra att de fyrtionio andra mappningarna skrivs.
    const r = tolkaBulkUtfall({
      results: [
        { itemMetadata: { id: "a", originalIndex: 0, success: true } },
        { itemMetadata: { id: "b", originalIndex: 1, success: false, error: { description: "WRONG_REVISION" } } },
        { itemMetadata: { id: "c", originalIndex: 2, success: true } },
      ],
      bulkActionMetadata: { totalSuccesses: 2, totalFailures: 1, undetailedFailures: 0 },
    }, ["a", "b", "c"]);

    expect(r.lyckade).toEqual(["a", "c"]);
    expect(r.misslyckade).toEqual([{ id: "b", fel: "WRONG_REVISION" }]);
  });

  it("☠️ attributionen litar inte på ORDNINGEN — id:t i svaret vinner", () => {
    // Wix får svara i vilken ordning den vill. Läser vi results[i] som
    // updates[i] och det antagandet är fel, skrivs mappningen för fel produkt.
    const r = tolkaBulkUtfall({
      results: [
        { itemMetadata: { id: "c", originalIndex: 2, success: false, error: { description: "fel på c" } } },
        { itemMetadata: { id: "a", originalIndex: 0, success: true } },
        { itemMetadata: { id: "b", originalIndex: 1, success: true } },
      ],
      bulkActionMetadata: { totalFailures: 1 },
    }, ["a", "b", "c"]);

    expect(r.lyckade.sort()).toEqual(["a", "b"]);
    expect(r.misslyckade).toEqual([{ id: "c", fel: "fel på c" }]);
  });

  it("saknas id används originalIndex mot det vi faktiskt skickade", () => {
    const r = tolkaBulkUtfall({
      results: [{ itemMetadata: { originalIndex: 1, success: true } }],
      bulkActionMetadata: { totalFailures: 0 },
    }, ["a", "b"]);

    expect(r.lyckade).toEqual(["b"]);
    expect(r.misslyckade).toEqual([{ id: "a", fel: "Wix nämnde inte raden i svaret" }]);
  });

  it("☠️ REGEL 1: en skickad rad Wix inte nämner är INTE bevisat skriven", () => {
    const r = tolkaBulkUtfall(MATT_FRAMGANG, [ID, "glömd"]);
    expect(r.lyckade).toEqual([ID]);
    expect(r.misslyckade).toEqual([{ id: "glömd", fel: "Wix nämnde inte raden i svaret" }]);
  });

  it("☠️ REGEL 2: undetailedFailures gör HELA anropet oadresserbart", () => {
    // Wix säger "tre fel" men pekar bara ut ett. Vi vet då inte vilka av de
    // andra som gick igenom, och att gissa är precis det som inte får hända —
    // en mappning skriven för en fallen skrivning hittar ingen igen.
    const r = tolkaBulkUtfall({
      results: [
        { itemMetadata: { id: "a", originalIndex: 0, success: true } },
        { itemMetadata: { id: "b", originalIndex: 1, success: false, error: { description: "fel" } } },
        { itemMetadata: { id: "c", originalIndex: 2, success: true } },
      ],
      bulkActionMetadata: { totalSuccesses: 0, totalFailures: 3, undetailedFailures: 2 },
    }, ["a", "b", "c"]);

    expect(r.lyckade).toEqual([]);
    expect(r.misslyckade.map((m) => m.id).sort()).toEqual(["a", "b", "c"]);
    expect(r.misslyckade.find((m) => m.id === "a")?.fel).toContain("går inte att adressera");
  });

  it("felkoden används när Wix inte skickar någon beskrivning", () => {
    const r = tolkaBulkUtfall({
      results: [{ itemMetadata: { id: "a", success: false, error: { code: "SOMETHING" } } }],
      bulkActionMetadata: { totalFailures: 1 },
    }, ["a"]);
    expect(r.misslyckade).toEqual([{ id: "a", fel: "SOMETHING" }]);
  });

  it("tomt eller oväntat svar kastar inte", () => {
    expect(tolkaBulkUtfall(null, [])).toEqual({ lyckade: [], misslyckade: [] });
    expect(tolkaBulkUtfall({}, [])).toEqual({ lyckade: [], misslyckade: [] });
    expect(tolkaBulkUtfall(null, ["a"]).misslyckade).toHaveLength(1);
  });
});

describe("summarizeBulkInventoryResult är uttryckt i tolkaBulkUtfall, inte en tvilling", () => {
  it("ett uppmätt lyckat svar ger noll failures", () => {
    expect(summarizeBulkInventoryResult(MATT_FRAMGANG).failures).toBe(0);
  });

  it("ett uppmätt fel ger ett failure med Wix beskrivning", () => {
    const r = summarizeBulkInventoryResult(MATT_FEL);
    expect(r.failures).toBe(1);
    expect(r.firstError).toContain("Outdated revision");
  });
});
