import { describe, expect, it } from "vitest";
import { lasManuellNiva, lasOrsak, maskeradEpost, medlemsId, normaliseraEpost, ORSAKSKODER } from "./admin";

describe("medlemsadmin", () => {
  it("☠️ medlemmens id är detsamma som butikens (samma vektor som butikens prov)", () => {
    // headless-site lib/medlem/inloggning.ts räknar m_ + sha256("fyndplats-medlem|" + e-post)[0..40].
    expect(medlemsId("kund@example.se")).toBe("m_c588e83376d516775bbe57a903163f283673325e");
  });

  it("e-posten normaliseras som i butiken och maskeras i loggen", () => {
    expect(normaliseraEpost(" Kund@Example.SE ")).toBe("kund@example.se");
    expect(normaliseraEpost("20001")).toBeNull();
    expect(maskeradEpost("kund@example.se")).toBe("k•••@example.se");
  });

  it("E1-11: en manuell ändring kräver orsakskod och text", () => {
    expect(lasOrsak("", "en orsak här")).toBe("Välj en orsakskod.");
    expect(lasOrsak("hittepa", "en orsak här")).toBe("Välj en orsakskod.");
    expect(lasOrsak("kompensation", "kort")).toBe("Skriv en orsak på minst fem tecken.");
    expect(lasOrsak("kompensation", "Försenad leverans, order i oktober")).toEqual({
      kod: "kompensation",
      text: "Försenad leverans, order i oktober",
    });
    expect(Object.keys(ORSAKSKODER)).toContain("radering");
  });

  it("den manuella nivån är en av specens sex, med ett valfritt slutdatum framåt", () => {
    expect(lasManuellNiva("Guld", "", "2026-11-04")).toEqual({ niva: "Guld", till: null });
    expect(lasManuellNiva("Guld", "2026-12-31", "2026-11-04")).toEqual({ niva: "Guld", till: "2026-12-31" });
    expect(lasManuellNiva("", "", "2026-11-04")).toEqual({ niva: "", till: null });
    expect(lasManuellNiva("Guldig", "", "2026-11-04")).toBe("Okänd nivå.");
    expect(lasManuellNiva("Guld", "2026-11-03", "2026-11-04")).toBe("Slutdatumet har redan passerat.");
    expect(lasManuellNiva("Guld", "31/12", "2026-11-04")).toBe("Datumet ska skrivas ÅÅÅÅ-MM-DD.");
  });
});
