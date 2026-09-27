import { describe, it, expect } from "vitest";
import {
  AOSOM_ANSVARIG,
  kandidatHash,
  kandidatMeningar,
  markeUrAosomUrl,
  paHittadeTal,
  tillPublik,
  tvattaSakerhet,
} from "./aosom";

describe("markeUrAosomUrl", () => {
  it("läser märket först i Aosoms produktadress", () => {
    expect(markeUrAosomUrl("https://www.aosom.de/item/homcom-elektrokamin-1200w")).toBe("HOMCOM");
    expect(markeUrAosomUrl("https://www.aosom.de/item/pawhut-kratzbaum-xl")).toBe("PawHut");
    expect(markeUrAosomUrl("https://www.aosom.de/item/aiyaplay-kinderkueche")).toBe("AIYAPLAY");
  });

  it("känner igen ®-formen i slugen (homcomr = HOMCOM®)", () => {
    expect(markeUrAosomUrl("https://www.aosom.de/item/homcomr-sofa-3-sitzer")).toBe("HOMCOM");
    expect(markeUrAosomUrl("https://www.aosom.de/item/outsunnyr-pavillon")).toBe("Outsunny");
  });

  it("gissar inte på okända ord, inte ens de som slutar på r", () => {
    expect(markeUrAosomUrl("https://www.aosom.de/item/heimtrainer-fahrrad")).toBeNull();
    expect(markeUrAosomUrl("https://www.aosom.de/item/ersatzdach-pavillon")).toBeNull();
    expect(markeUrAosomUrl("")).toBeNull();
    expect(markeUrAosomUrl(undefined)).toBeNull();
  });
});

describe("kandidatMeningar", () => {
  it("plockar säkerhetsmeningar, punktlistan först, och lämnar säljtexten", () => {
    const k = kandidatMeningar(
      "<p>Diese Küche von [BRAND NAME] ist schön. Achtung: Nur unter Aufsicht von Erwachsenen verwenden.</p>",
      "<ul><li>✔ Belastbarkeit: 30 kg</li><li>✔ Gute Belüftung durch Gitter</li></ul>",
    );
    expect(k).toEqual(["Belastbarkeit: 30 kg", "Achtung: Nur unter Aufsicht von Erwachsenen verwenden."]);
  });

  it("tar bort dubbletter och platshållaren", () => {
    const k = kandidatMeningar("<p>Belastbarkeit: 30 kg</p>", "<li>Belastbarkeit: 30 kg</li><li>[BRAND NAME] Warnung: heiß.</li>");
    expect(k).toEqual(["Belastbarkeit: 30 kg", "Warnung: heiß."]);
  });

  it("ger en tom lista när texten saknar säkerhetsinformation", () => {
    expect(kandidatMeningar("<p>Ein schönes Sofa in Grau.</p>", "")).toEqual([]);
  });
});

describe("kandidatHash", () => {
  it("är stabil och ändras när en mening ändras", () => {
    expect(kandidatHash(["a", "b"])).toBe(kandidatHash(["a", "b"]));
    expect(kandidatHash(["a", "b"])).not.toBe(kandidatHash(["a", "c"]));
  });
});

describe("paHittadeTal", () => {
  it("godtar tal som står i källan, även med decimalkomma och tusentalsavgränsare", () => {
    expect(paHittadeTal("Maxbelastning: 1,5 kg.", ["Belastbarkeit: 1.5 kg"])).toEqual([]);
    expect(paHittadeTal("Maxbelastning: 1 000 kg.", ["Belastbarkeit: 1.000 kg"])).toEqual([]);
    expect(paHittadeTal("Rekommenderad ålder: 3–8 år.", ["für Kinder von 3 bis 8 Jahren"])).toEqual([]);
    expect(paHittadeTal("Uppfyller EN 71-1, -2, -3.", ["Geprüft nach EN71-1.2.3"])).toEqual([]);
  });

  it("flaggar ett tal som inte finns i källan", () => {
    expect(paHittadeTal("Maxbelastning: 150 kg.", ["Belastbarkeit: 120 kg"])).toEqual(["150"]);
    expect(paHittadeTal("Ej lämplig för barn under 3 år.", ["Nicht geeignet für Kinder unter 36 Monaten."])).toEqual(["3"]);
  });
});

describe("tvattaSakerhet", () => {
  it("släpper igenom korta svenska meningar i ordning, utan dubbletter", () => {
    expect(tvattaSakerhet(["Maxbelastning: 120 kg.", "  Ej lämplig för barn under 3 år. ", "maxbelastning: 120 kg."]))
      .toEqual(["Maxbelastning: 120 kg.", "Ej lämplig för barn under 3 år."]);
  });

  it("stoppar rader som nämner leverantören eller platshållaren", () => {
    expect(tvattaSakerhet(["Tillverkad av Aosom.", "MH Handel ansvarar.", "Från [BRAND NAME].", "Endast för inomhusbruk."]))
      .toEqual(["Endast för inomhusbruk."]);
  });

  it("tål svar som inte är en lista av strängar", () => {
    expect(tvattaSakerhet(null)).toEqual([]);
    expect(tvattaSakerhet("Maxbelastning 5 kg")).toEqual([]);
    expect(tvattaSakerhet([1, {}, "ok."])).toEqual([]);
  });

  it("kapar vid tolv rader", () => {
    const rader = Array.from({ length: 20 }, (_, i) => `Säkerhetsrad nummer ${i}.`);
    expect(tvattaSakerhet(rader)).toHaveLength(12);
  });
});

describe("tillPublik", () => {
  it("bär märke, ansvarig och säkerhetstext — aldrig artikelnummer eller källa", () => {
    const pub = tillPublik({ m: "HOMCOM", s: ["Endast för inomhusbruk."] });
    expect(pub).toEqual({ marke: "HOMCOM", ansvarig: { ...AOSOM_ANSVARIG }, sakerhet: ["Endast för inomhusbruk."] });
    expect(Object.keys(pub).sort()).toEqual(["ansvarig", "marke", "sakerhet"]);
  });
});
