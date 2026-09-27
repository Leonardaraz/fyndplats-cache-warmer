import { describe, it, expect } from "vitest";
import {
  AOSOM_ANSVARIG,
  kallHash,
  kallText,
  markeUrAosomUrl,
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

describe("kallText", () => {
  it("skalar HTML och platshållaren [BRAND NAME]", () => {
    const t = kallText({
      namn: "Kinderküche",
      kategori: "Baby & Kind > Spielzeug",
      punkterHtml: "<ul><li>Achtung: Nicht geeignet für Kinder unter 36 Monaten.</li></ul>",
      beskrivningHtml: "<p>Diese Küche von [BRAND NAME] ist &amp; bleibt schön.</p>",
    });
    expect(t).toContain("Achtung: Nicht geeignet für Kinder unter 36 Monaten.");
    expect(t).toContain("Diese Küche von ist & bleibt schön.");
    expect(t).not.toMatch(/BRAND NAME|<li>|&amp;/);
  });
});

describe("kallHash", () => {
  it("är stabil för samma text och ändras med texten", () => {
    expect(kallHash("a")).toBe(kallHash("a"));
    expect(kallHash("a")).not.toBe(kallHash("b"));
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
    const pub = tillPublik({ marke: "HOMCOM", sakerhet: ["Endast för inomhusbruk."] });
    expect(pub).toEqual({ marke: "HOMCOM", ansvarig: { ...AOSOM_ANSVARIG }, sakerhet: ["Endast för inomhusbruk."] });
    expect(Object.keys(pub).sort()).toEqual(["ansvarig", "marke", "sakerhet"]);
  });
});
