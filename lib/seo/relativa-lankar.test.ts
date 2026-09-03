import { describe, it, expect } from "vitest";
import { hittaTrasigaLankar, lagaTrasigaLankar, BUTIKENS_URL } from "./relativa-lankar";

const TRASIG = '<p>Finns också i <a href="https:/produkt/ottomanbank-125-cm-forvaring-gra">grå</a>.</p>';
const HEL = `<p>Finns också i <a href="${BUTIKENS_URL}/produkt/ottomanbank-125-cm-forvaring-gra">grå</a>.</p>`;

describe("hittaTrasigaLankar", () => {
  it("hittar formen med en snedstreck", () => {
    expect(hittaTrasigaLankar(TRASIG)).toEqual(["https:/produkt/ottomanbank-125-cm-forvaring-gra"]);
  });

  it("hittar flera på samma sida", () => {
    const h = '<a href="https:/produkt/a">a</a><a href="https:/produkt/b">b</a>';
    expect(hittaTrasigaLankar(h)).toHaveLength(2);
  });

  // ☠️ Utan (?!/) matchar mönstret varje korrekt länk och lagningen dubblerar
  // värdnamnet på det som redan fungerar.
  it("rör INTE en korrekt absolut länk", () => {
    expect(hittaTrasigaLankar(HEL)).toEqual([]);
    expect(hittaTrasigaLankar('<a href="https://static.wixstatic.com/x.jpg">b</a>')).toEqual([]);
  });

  it("rör INTE en rotrelativ länk som butiken själv renderar", () => {
    expect(hittaTrasigaLankar('<a href="/produkt/x">x</a>')).toEqual([]);
  });

  it("svarar samma sak två gånger i rad", () => {
    expect(hittaTrasigaLankar(TRASIG)).toHaveLength(1);
    expect(hittaTrasigaLankar(TRASIG)).toHaveLength(1);
  });
});

describe("lagaTrasigaLankar", () => {
  it("sätter tillbaka värdnamnet", () => {
    expect(lagaTrasigaLankar(TRASIG)).toBe(HEL);
  });

  it("lämnar en hel text orörd", () => {
    expect(lagaTrasigaLankar(HEL)).toBe(HEL);
  });

  it("är idempotent", () => {
    expect(lagaTrasigaLankar(lagaTrasigaLankar(TRASIG))).toBe(HEL);
  });

  it("rör inte texten runt länken", () => {
    const h = '<p>https:/produkt/x står i brödtexten.</p><a href="https:/produkt/y">y</a>';
    expect(lagaTrasigaLankar(h)).toBe(
      `<p>https:/produkt/x står i brödtexten.</p><a href="${BUTIKENS_URL}/produkt/y">y</a>`,
    );
  });
});
