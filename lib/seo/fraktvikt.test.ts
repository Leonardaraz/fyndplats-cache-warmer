import { describe, it, expect } from "vitest";
import { hittaFraktviktsrader, rattaFraktvikt, viktILoptext } from "./fraktvikt";

const B = '<span style="font-weight: 700">';
const rad = (etikett: string, varde: string) => `<li><p>${B}${etikett}:</span> ${varde}</p></li>`;

const SPEC = "<h2>Tekniska specifikationer</h2><ul>"
  + rad("Mått", "60 × 39,8 × 62 cm")
  + rad("Vikt", "13,2 kg")
  + rad("Paketmått", "71,5 × 46,5 × 15,5 cm")
  + "</ul>";

describe("fraktviktssaxen", () => {
  it("byter etikett när talet är fraktvikten", () => {
    expect(hittaFraktviktsrader(SPEC, 13.2)).toEqual([rad("Vikt", "13,2 kg")]);
    const ny = rattaFraktvikt(SPEC, 13.2);
    expect(ny).toContain(rad("Fraktvikt", "13,2 kg"));
    expect(ny).not.toContain(">Vikt:");
  });

  it("byter bara etiketten — talet och övriga rader står kvar", () => {
    const ny = rattaFraktvikt(SPEC, 13.2);
    expect(ny.replace("Fraktvikt", "Vikt")).toBe(SPEC);
  });

  // ☠️ Ett annat tal kan vara produktens verkliga vikt ur den tyska texten.
  it("rör inte en Vikt-rad med ett annat tal", () => {
    const verklig = SPEC.replace("13,2 kg", "12 kg");
    expect(hittaFraktviktsrader(verklig, 13.2)).toEqual([]);
    expect(rattaFraktvikt(verklig, 13.2)).toBe(verklig);
  });

  it("rör inte etiketter som bara innehåller ordet", () => {
    const andra = "<ul>" + rad("Maxvikt", "13,2 kg") + rad("Vikt per låda", "13,2 kg")
      + rad("Nettovikt", "13,2 kg") + "</ul>";
    expect(hittaFraktviktsrader(andra, 13.2)).toEqual([]);
    expect(rattaFraktvikt(andra, 13.2)).toBe(andra);
  });

  it("gör ingenting utan fraktvikt", () => {
    expect(hittaFraktviktsrader(SPEC, null)).toEqual([]);
    expect(rattaFraktvikt(SPEC, undefined)).toBe(SPEC);
    expect(rattaFraktvikt(SPEC, 0)).toBe(SPEC);
  });

  it("klarar decimalpunkt, heltal och importens bock", () => {
    expect(hittaFraktviktsrader("<ul><li><p>Vikt: 40 kg</p></li></ul>", 40)).toHaveLength(1);
    expect(hittaFraktviktsrader("<ul><li><p>✔ Vikt: 8.5 kg</p></li></ul>", 8.5)).toHaveLength(1);
    expect(rattaFraktvikt("<ul><li><p>✔ Vikt: 8.5 kg</p></li></ul>", 8.5))
      .toBe("<ul><li><p>✔ Fraktvikt: 8.5 kg</p></li></ul>");
  });

  it("klarar tabellformen", () => {
    const tabell = "<table><tr><td><p>Egenskap</p></td><td><p>Uppgift</p></td></tr>"
      + "<tr><td><p>Vikt</p></td><td><p>22,1 kg</p></td></tr></table>";
    expect(hittaFraktviktsrader(tabell, 22.1)).toHaveLength(1);
    expect(rattaFraktvikt(tabell, 22.1)).toContain("<td><p>Fraktvikt</p></td><td><p>22,1 kg</p></td>");
  });

  it("är idempotent", () => {
    const en = rattaFraktvikt(SPEC, 13.2);
    expect(rattaFraktvikt(en, 13.2)).toBe(en);
    expect(hittaFraktviktsrader(en, 13.2)).toEqual([]);
  });
});

describe("viktILoptext", () => {
  it("hittar en mening som säger att varan väger fraktvikten", () => {
    expect(viktILoptext(`<p>Skåpet väger 13,2 kg och hängs på väggen.</p>${SPEC}`, 13.2)).toBe(true);
  });

  it("hittar en vanlig fråga om vikten", () => {
    const faq = `${B}Hur mycket väger den?</span></p><p>13,2 kg.</p>`;
    expect(viktILoptext(`<p>${faq}`, 13.2)).toBe(true);
  });

  it("räknar inte meningar om paketet", () => {
    expect(viktILoptext("<p>Paketet väger 13,2 kg, så var två.</p>", 13.2)).toBe(false);
    const faq = `<p>${B}Hur mycket väger paketet?</span></p><p>13,2 kg.</p>`;
    expect(viktILoptext(faq, 13.2)).toBe(false);
  });

  it("räknar inte spec-raden och inte ett annat tal", () => {
    expect(viktILoptext(SPEC, 13.2)).toBe(false);
    expect(viktILoptext("<p>Spegeln väger 9 kg.</p>", 13.2)).toBe(false);
  });
});
