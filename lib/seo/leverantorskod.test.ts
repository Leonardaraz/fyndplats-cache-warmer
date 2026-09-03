import { describe, it, expect } from "vitest";
import { hittaKodrader, taBortKodrader, barKod } from "./leverantorskod";

const SPEC = (rader: string) => `<h2>Tekniska specifikationer</h2><ul>${rader}</ul>`;

describe("hittaKodrader", () => {
  // De två formerna som FAKTISKT låg på de 51 sidor svepet hittade 2026-09-03.
  it("hittar den nakna formen", () => {
    const html = SPEC("<li><p>Färg: vit</p></li><li><p>Artikelnummer: Z00-111V00XX</p></li>");
    expect(hittaKodrader(html)).toEqual(["<li><p>Artikelnummer: Z00-111V00XX</p></li>"]);
  });

  it("hittar span-formen", () => {
    const rad = '<li><p><span style="font-weight: 700">Referens:</span> Z90-222V00BK</p></li>';
    expect(hittaKodrader(SPEC(rad))).toEqual([rad]);
  });

  it("hittar Modellreferens", () => {
    const rad = '<li><p><span style="font-weight: 700">Modellreferens:</span> Z00-333GN</p></li>';
    expect(hittaKodrader(SPEC(rad))).toEqual([rad]);
  });

  it("hittar två koder på samma rad", () => {
    const rad = "<li><p>Artikelnummer: Z0D-444GN / Z0D-444</p></li>";
    expect(hittaKodrader(SPEC(rad))).toEqual([rad]);
  });

  it("hittar långa numeriska koder", () => {
    const rad = '<li><p><span style="font-weight: 700">Referens:</span> Z00110-555BG</p></li>';
    expect(hittaKodrader(SPEC(rad))).toEqual([rad]);
  });

  // ☠️ GEMENA KODER. Nitton publicerade sidor bar en gemen kod medan svepet
  // rapporterade noll — prefixet var `[0-9A-Z]` och regexen saknade `i`.
  // Formerna nedan är de faktiskt uppmätta, med siffrorna utbytta.
  it("hittar en gemen kod efter Referens", () => {
    const rad = '<li><p><span style="font-weight: 700">Referens:</span> z30-670v00yl</p></li>';
    expect(hittaKodrader(SPEC(rad))).toEqual([rad]);
  });

  it("hittar två gemena koder på samma rad", () => {
    const rad = '<li><p><span style="font-weight: 700">Referens:</span> z30-670v00yl / z30-670v00gy</p></li>';
    expect(hittaKodrader(SPEC(rad))).toEqual([rad]);
  });

  it("hittar en gemen kod med bokstav först i prefixet", () => {
    const rad = "<li><p>Artikelnummer: z20-287v00cg</p></li>";
    expect(hittaKodrader(SPEC(rad))).toEqual([rad]);
  });

  it("hittar en gemen etikett", () => {
    const rad = "<li><p>artikelnummer: z4d-032cf</p></li>";
    expect(hittaKodrader(SPEC(rad))).toEqual([rad]);
  });

  // ☠️ Saxen får inte ta för mycket. Det här är hela skälet till att värdet
  // måste se ut som en kod och inte bara etiketten stämma.
  //
  // Gemener öppnade en ny riktning för det felet: ett vanligt bindestrecksord.
  // Därför krävs minst en SIFFRA i båda halvorna av koden.
  it("rör INTE ett bindestrecksord utan siffror", () => {
    expect(hittaKodrader(SPEC("<li><p>Referens: bruks-anvisning</p></li>"))).toEqual([]);
  });

  it("rör INTE ett bindestrecksord med versaler", () => {
    expect(hittaKodrader(SPEC("<li><p>Referens: Made-in-Sweden</p></li>"))).toEqual([]);
  });

  it("rör INTE en säkerhetsstandard", () => {
    expect(hittaKodrader(SPEC("<li><p>Standard: EN 1930</p></li>"))).toEqual([]);
  });

  it("rör INTE en referens som är löpande text", () => {
    const rad = '<li><p><span style="font-weight: 700">Referens:</span> se bruksanvisningen</p></li>';
    expect(hittaKodrader(SPEC(rad))).toEqual([]);
  });

  it("rör INTE ett mått med bindestreck", () => {
    expect(hittaKodrader(SPEC("<li><p>Höjd: 124-130 cm</p></li>"))).toEqual([]);
  });

  it("rör INTE en EN-norm efter en referens-etikett", () => {
    expect(hittaKodrader(SPEC("<li><p>Referens: EN 71-30</p></li>"))).toEqual([]);
  });
});

describe("taBortKodrader", () => {
  it("tar bort raden och lämnar resten orörd", () => {
    const fore = SPEC(
      "<li><p>Färg: vit</p></li>"
        + "<li><p>Artikelnummer: Z00-111V00XX</p></li>"
        + "<li><p>Vikt: 12 kg</p></li>",
    );
    const efter = taBortKodrader(fore);
    expect(efter).toBe(SPEC("<li><p>Färg: vit</p></li><li><p>Vikt: 12 kg</p></li>"));
    expect(efter.length).toBeLessThan(fore.length);
  });

  it("är idempotent", () => {
    const html = SPEC("<li><p>Artikelnummer: Z00-777</p></li>");
    expect(taBortKodrader(taBortKodrader(html))).toBe(taBortKodrader(html));
  });

  it("tar flera rader på samma sida", () => {
    const html = SPEC(
      "<li><p>Artikelnummer: Z00-777</p></li><li><p>Modellnummer: Z0A-888V80WT</p></li>",
    );
    expect(hittaKodrader(html)).toHaveLength(2);
    expect(taBortKodrader(html)).toBe(SPEC(""));
  });
});

describe("barKod", () => {
  it("ser koden var den än står", () => {
    expect(barKod("<p>Artikelnummer: Z00-777 står mitt i texten.</p>")).toBe(true);
    expect(barKod(undefined, null, "Referens: Z30-666V00BN")).toBe(true);
  });

  it("är falsk för ren svensk text", () => {
    expect(barKod("<p>Hundvagn för mellanstor hund, 124 x 67 x 100 cm.</p>")).toBe(false);
    expect(barKod("Standard: EN 1930")).toBe(false);
  });

  // Ett globalt regex bär `lastIndex` mellan anrop. Utan nollställning svarar
  // vartannat anrop fel — och kvittot efter en skrivning blir slumpmässigt.
  it("svarar samma sak två gånger i rad", () => {
    const t = "Artikelnummer: Z00-777";
    expect(barKod(t)).toBe(true);
    expect(barKod(t)).toBe(true);
  });
});
