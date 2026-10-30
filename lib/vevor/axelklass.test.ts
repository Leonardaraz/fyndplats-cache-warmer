import { describe, expect, it } from "vitest";
import { axelklass, familjensKlass, namndelar } from "./axelklass";

// Axelnamn och värden ur de länkade VEVOR-familjerna, uppmätta 2026-10-30.
describe("axelklass", () => {
  it.each([
    ["Storlek", ['15,4" x 15,0"', '21,5" x 19,0"'], "storlek"],
    ["Storlek", ["S", "M", "XL"], "storlek"],
    ["Storlek", ["Liten", "Stor"], "storlek"],
    ["Produktstorlek (L x B x H)", ["L22 x B22 x H14 tum", "L15 x B10 x H9 tum"], "storlek"],
    ["Höjd", ["88,9 cm", "116,8 cm"], "storlek"],
    ["Tillämplig storlek", ["12-18 tum", "24-30 tum"], "storlek"],
    ["Färg", ["Röd", "Svart", "Blå julmönster"], "farg"],
    ["Presenning färg", ["Gradient Svart", "Gradient blå"], "farg"],
    ["Färg-Size", ["Brun - 52x48x47 cm", "Blå - 48x56x44 cm"], "farg"],
    ["Antal och färg", ["4 st - Svart", "6 st - vita"], "farg"],
    ["Längd", ["20 tum", "28 tum"], "langd"],
    ["Kabellängd", ["3 m", "6 m"], "langd"],
    ["Kvantitet", ["1-delad set", "2 st", "6-delat set"], "forpackning"],
    ["Antal", ["4 st", "6 st"], "forpackning"],
    ["Antal stycken", ["2 pack", "1 förpackning"], "forpackning"],
    ["Totalt antal artiklar", ["40 stycken", "60 st"], "forpackning"],
  ] as const)("%s %j är tillåten (%s)", (namn, varden, klass) => {
    expect(axelklass(namn, varden)).toBe(klass);
  });

  it.each([
    ["Kapacitet", ["3 L", "6 L"]],
    ["Kraft", ["2200W", "1550 W"]],
    ["Driva", ["66 kW", "110 kW"]],
    ["Lastkapacitet", ["1360 kg", "725 kg"]],
    ["Tryck", ["4500 PSI", "3600 PSI"]],
    ["Typ", ["Vertikal typ", "Horisontell typ"]],
    ["Modell", ["Nr.130", "Nr.120"]],
    ["Produkttyp", ["Helkroppskudde", "Medium kudde"]],
    ["Tillbehör", ["Utan bomullsdyna", "Med bomullsdyna"]],
    ["Antal lådor", ["6 lådor", "9 lådor"]],
    ["Antal cylindrar", ["1", "3"]],
    ["Med eller utan rutschkana", ["Inga", "Ja"]],
    ["Kompatibel med", ["2015-2020 Skoda", "2012-2020 Skoda"]],
  ] as const)("☠️ %s %j är funktion", (namn, varden) => {
    expect(axelklass(namn, varden)).toBe("funktion");
  });

  it("☠️ en funktionsenhet som skiljer gör axeln till funktion, vad den än heter", () => {
    expect(axelklass("Storlek", ["3 L", "6 L"])).toBe("funktion");
    expect(axelklass("Storlek", ["20 V", "40 V"])).toBe("funktion");
  });

  it("en funktionsenhet som är lika i alla värden avgör inte", () => {
    expect(axelklass("Färg", ["5 kW-Röd", "5 kW-Orange"])).toBe("farg");
  });

  it.each([
    ["Material", ["Bambu", "Trä"]],
    ["Stil", ["Med huva", "Vanlig"]],
    ["Form", ["Triangel", "Rektangel"]],
    ["Vikt", ["5 lbs", "3 lbs"]],
    ["Paneler", ["6 paneler", "4 paneler"]],
    ["Tjocklek", ["Förtjockad", "Regelbunden"]],
    ["Form-Kvantitet", ["T-klämmor - 500 st", "Vanlig-500 st"]],
  ] as const)("☠️ %s %j är oklar och listas i stället för att gissas", (namn, varden) => {
    expect(axelklass(namn, varden)).toBe("oklar");
  });

  it("ett mått utan tal är oklart", () => {
    expect(axelklass("Storlek", ["Enkel", "Dubbel"])).toBe("oklar");
    expect(axelklass("Antal", ["Enkel", "Dubbel"])).toBe("oklar");
  });

  it("namnets delar", () => {
    expect(namndelar("Färg-Size")).toEqual(["färg", "size"]);
    expect(namndelar("Antal och färg")).toEqual(["antal", "färg"]);
    expect(namndelar("Storlek - Tjocklek")).toEqual(["storlek", "tjocklek"]);
    expect(namndelar("  ")).toEqual([]);
  });
});

describe("familjensKlass", () => {
  it("alla axlar tillåtna", () => {
    expect(familjensKlass([{ namn: "Färg", varden: ["Röd", "Blå"] }, { namn: "Storlek", varden: ["S", "M"] }])).toBe("tillaten");
  });
  it("☠️ en funktionsaxel räcker för egna sidor", () => {
    expect(familjensKlass([{ namn: "Färg", varden: ["Röd", "Blå"] }, { namn: "Effekt", varden: ["850W", "1800W"] }])).toBe("funktion");
  });
  it("en oklar axel utan funktion är oklar", () => {
    expect(familjensKlass([{ namn: "Färg", varden: ["Röd", "Blå"] }, { namn: "Material", varden: ["Trä", "Metall"] }])).toBe("oklar");
  });
});
