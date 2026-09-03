import { describe, it, expect } from "vitest";
import {
  hittaTrasigaLankar,
  lagaTrasigaLankar,
  rattaSokvag,
  SOKVAGSRATTNINGAR,
  BUTIKENS_URL,
} from "./relativa-lankar";

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

// ---------------------------------------------------------------------------
// Wix-editorns sökvägar (uppmätta mot skarpa www.fyndplats.se 2026-09-03)
// ---------------------------------------------------------------------------
//
// Svepet 2026-09-03 hittade 64 trasiga länkar på 31 sidor. Sextio pekade på
// `/produkt/`, men fyra bar Wix-editorns egna sökvägar — och de två sorterna
// är olika allvarliga:
//
//   /product-page/<slug>   308 → /produkt/<slug>   fungerar, men via ett hopp
//   /category/<slug>       404                      DÖD, ingen omdirigering
//
// Utan rättningen hade lagningen bytt en död länk mot en INTERN 404 på just
// kategorilänken — sämre än före, eftersom den då också crawlas.

describe("rattaSokvag", () => {
  it("byter Wix-editorns produktsökväg mot butikens", () => {
    expect(rattaSokvag("product-page/leksakskok-for-barn")).toBe("produkt/leksakskok-for-barn");
  });

  it("☠️ byter kategorisökvägen — /category/ svarar 404, /kategori/ svarar 200", () => {
    expect(rattaSokvag("category/leksaker-spel")).toBe("kategori/leksaker-spel");
  });

  it("lämnar butikens egna sökvägar orörda", () => {
    expect(rattaSokvag("produkt/ottomanbank-125-cm-forvaring-gra")).toBe(
      "produkt/ottomanbank-125-cm-forvaring-gra",
    );
    expect(rattaSokvag("kategori/leksaker-spel")).toBe("kategori/leksaker-spel");
  });

  it("rör inte en okänd sökväg — en gissning vore värre än att avstå", () => {
    expect(rattaSokvag("blogg/nagot")).toBe("blogg/nagot");
    expect(rattaSokvag("")).toBe("");
  });

  it("byter bara PREFIXET, aldrig mitt i en slug", () => {
    // En slug som råkar innehålla ordet får inte skrivas om.
    expect(rattaSokvag("produkt/stol-category/vit")).toBe("produkt/stol-category/vit");
  });

  it("varje par är olika i båda leden — annars är raden en no-op", () => {
    for (const [fel, ratt] of SOKVAGSRATTNINGAR) {
      expect(fel).not.toBe(ratt);
      expect(fel.endsWith("/")).toBe(true);
      expect(ratt.endsWith("/")).toBe(true);
    }
  });
});

describe("lagaTrasigaLankar rättar sökvägen i samma svep", () => {
  it("☠️ kategorilänken blir butikens, inte en intern 404", () => {
    const trasig = '<p>Se fler i <a href="https:/category/leksaker-spel">Leksaker</a>.</p>';
    expect(lagaTrasigaLankar(trasig)).toBe(
      `<p>Se fler i <a href="${BUTIKENS_URL}/kategori/leksaker-spel">Leksaker</a>.</p>`,
    );
  });

  it("produktlänken pekar direkt, inte via 308", () => {
    const trasig = '<a href="https:/product-page/leksakskok-for-barn">x</a>';
    expect(lagaTrasigaLankar(trasig)).toBe(
      `<a href="${BUTIKENS_URL}/produkt/leksakskok-for-barn">x</a>`,
    );
  });

  it("☠️ rör INTE en redan hel länk, ens med fel sökväg", () => {
    // Blast-radien är exakt defekten: en absolut länk är inte trasig, och att
    // skriva om den hade vidgat ingreppet till text vi inte kommit för.
    const hel = `<a href="${BUTIKENS_URL}/product-page/x">x</a>`;
    expect(lagaTrasigaLankar(hel)).toBe(hel);
  });

  it("är fortfarande idempotent med rättningen inkopplad", () => {
    const t = '<a href="https:/category/leksaker-spel">x</a>';
    const en = lagaTrasigaLankar(t);
    expect(lagaTrasigaLankar(en)).toBe(en);
  });

  it("blandade former på samma sida rättas var för sig", () => {
    const t =
      '<a href="https:/produkt/a">a</a><a href="https:/product-page/b">b</a>'
      + '<a href="https:/category/c">c</a>';
    expect(lagaTrasigaLankar(t)).toBe(
      `<a href="${BUTIKENS_URL}/produkt/a">a</a>`
        + `<a href="${BUTIKENS_URL}/produkt/b">b</a>`
        + `<a href="${BUTIKENS_URL}/kategori/c">c</a>`,
    );
  });
});
