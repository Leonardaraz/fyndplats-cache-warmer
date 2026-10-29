import { describe, expect, it } from "vitest";
import { fonsterObjekt, sidadress, sokvagUr, tolkaProduktsida, utanWebp, webbIdUr } from "./sida";
import { TESTSKU, TESTWEBBID, testSokvag, testsida } from "./testsida";

describe("tolkaProduktsida", () => {
  it("läser en giltig sida: pris i kronor ur JSON-LD, lager, kategorier, tabeller och bilder", () => {
    const t = tolkaProduktsida(testsida());
    expect(t.ok).toBe(true);
    if (!t.ok) return;
    const s = t.sida;
    expect(s.sku).toBe(TESTSKU);
    expect(s.spu).toBe("12345");
    expect(s.prisSek).toBe(999.5);
    expect(s.saldo).toBe(12);
    expect(s.flode).toBe("EU");
    expect(s.levererasTillSe).toBe(true);
    expect(s.fraktSe).toEqual({ belopp: 0, valuta: "EUR" });
    expect(s.namn).toBe("VEVOR Testprodukt, 90 kg lastkapacitet & 7 hållare");
    // Brödsmulan sorteras på position, och "Home" tas bort.
    expect(s.kategorier).toEqual([
      { id: "100", namn: "Toppkategori" },
      { id: "200", namn: "Underkategori" },
    ]);
    expect(s.egenskaper).toEqual({ Färg: "Svart", Storlek: "Stor" });
    expect(s.spec).toEqual([
      ["Artikelmodellnummer", "TEST-1"],
      ["Maximal lastkapacitet", "90,7 kg"],
    ]);
    expect(s.punkter).toEqual(["Hållbar: ram i kolstål.", "Enkel montering & skötsel."]);
    expect(s.beskrivning).toContain("Denna testvagn klarar terräng.");
    expect(s.beskrivning).not.toContain("color");
    expect(s.manualSokvag).toBe("/pages/contact-us/TESTMANUAL01");
    expect(s.syskon).toEqual([{ sku: "TESTSKUSYSKON000002", webbId: "000000000002", kanKopas: true }]);
  });

  it("bilderna: bara bilder, originalet, utan format=webp, och egen mapp markerad", () => {
    const t = tolkaProduktsida(testsida());
    if (!t.ok) throw new Error("ska gå att tolka");
    expect(t.sida.bilder).toHaveLength(3);
    expect(t.sida.bilder.every((b) => !/webp/.test(b.url))).toBe(true);
    expect(t.sida.bilder.every((b) => b.url.includes("original_img"))).toBe(true);
    expect(t.sida.bilder.map((b) => b.egen)).toEqual([true, true, false]);
  });

  it("☠️ fel språk är okänt, inte slut — både dokumentets lang och sajtens LANG", () => {
    expect(tolkaProduktsida(testsida({ lang: "en" }))).toEqual({ ok: false, fel: "fel_sprak" });
    expect(tolkaProduktsida(testsida({ globalLang: "de" }))).toEqual({ ok: false, fel: "fel_sprak" });
  });

  it("☠️ fel valuta är okänt — priset läses bara i kronor", () => {
    expect(tolkaProduktsida(testsida({ valuta: "EUR" }))).toEqual({ ok: false, fel: "fel_valuta" });
  });

  it("☠️ saknat pris, saknat lager och ett trasigt lagertal är okända", () => {
    expect(tolkaProduktsida(testsida({ pris: null }))).toEqual({ ok: false, fel: "saknar_pris" });
    expect(tolkaProduktsida(testsida({ pris: 0 }))).toEqual({ ok: false, fel: "saknar_pris" });
    expect(tolkaProduktsida(testsida({ lager: null }))).toEqual({ ok: false, fel: "saknar_lager" });
    expect(tolkaProduktsida(testsida({ lager: 2.5 }))).toEqual({ ok: false, fel: "saknar_lager" });
    expect(tolkaProduktsida(testsida({ lager: -1 }))).toEqual({ ok: false, fel: "saknar_lager" });
  });

  it("☠️ två uppgifter som säger emot varandra är okända, inte den ena av dem", () => {
    expect(tolkaProduktsida(testsida({ ldSku: "TESTSKUANNAN0000099" }))).toEqual({ ok: false, fel: "motsagelse_sku" });
    expect(tolkaProduktsida(testsida({ lager: 0 }))).toEqual({ ok: false, fel: "motsagelse_lager" });
    expect(
      tolkaProduktsida(testsida({ lager: 5, tillganglighet: "https://schema.org/OutOfStock" })),
    ).toEqual({ ok: false, fel: "motsagelse_lager" });
    expect(
      tolkaProduktsida(testsida({ tillganglighet: "https://schema.org/PreOrder" })),
    ).toEqual({ ok: false, fel: "okand_tillganglighet" });
  });

  it("en slutsåld sida: lager 0 och OutOfStock, överens", () => {
    const t = tolkaProduktsida(testsida({ lager: 0, tillganglighet: "https://schema.org/OutOfStock" }));
    expect(t.ok && t.sida.saldo).toBe(0);
  });

  it("lagertal som sträng tas emot, som sidan ibland skriver dem", () => {
    const t = tolkaProduktsida(testsida({ lager: "7", pris: "123.45" }));
    expect(t.ok && [t.sida.saldo, t.sida.prisSek]).toEqual([7, 123.45]);
  });

  it("utan Sverige bland fraktländerna levereras varan inte hit", () => {
    const t = tolkaProduktsida(testsida({ frakt: [{ land: ["DE"], belopp: 0, valuta: "EUR" }] }));
    expect(t.ok && t.sida.levererasTillSe).toBe(false);
    expect(t.ok && t.sida.fraktSe).toBeNull();
  });

  it("en sida utan manuallänk har ingen manual — den allmänna kontaktsidan räknas inte", () => {
    const t = tolkaProduktsida(testsida({ manual: false }));
    expect(t.ok && t.sida.manualSokvag).toBeNull();
  });

  it("VEVOR:s 404-sida är ingen produktsida", () => {
    expect(tolkaProduktsida(testsida({ utanProdukt: true }))).toEqual({ ok: false, fel: "ej_produktsida" });
  });
});

describe("små läsare", () => {
  it("fonsterObjekt hoppar över `window.X = window.X || {}` och tål klamrar i strängar", () => {
    const html = `<script>window.A = window.A || {};</script><script>window.A = {"b":"{inte}","c":[1,2]};</script>`;
    expect(fonsterObjekt(html, "A")).toEqual({ b: "{inte}", c: [1, 2] });
    expect(fonsterObjekt(html, "SAKNAS")).toBeUndefined();
  });

  it("webb-id, sökväg och adress", () => {
    expect(webbIdUr(testSokvag())).toBe(TESTWEBBID);
    expect(webbIdUr(`https://eur.vevor.com${testSokvag()}?lang=sv`)).toBe(TESTWEBBID);
    expect(webbIdUr("/pages/contact-us")).toBeNull();
    expect(sokvagUr(`https://eur.vevor.com${testSokvag()}?x=1`)).toBe(testSokvag());
    expect(sokvagUr(`https://www.vevor.com${testSokvag()}`)).toBeNull();
    expect(sidadress(testSokvag())).toBe(`https://eur.vevor.com${testSokvag()}?lang=sv&currency=SEK`);
  });

  it("utanWebp tar bara bort format=webp", () => {
    expect(utanWebp("https://x.test/a.jpg?timestamp=1&format=webp&format=webp")).toBe("https://x.test/a.jpg?timestamp=1");
    expect(utanWebp("https://x.test/a.jpg?format=webp")).toBe("https://x.test/a.jpg");
    expect(utanWebp("https://x.test/a.jpg")).toBe("https://x.test/a.jpg");
  });
});
