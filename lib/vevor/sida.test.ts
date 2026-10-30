import { describe, expect, it } from "vitest";
import { MAX_RECENSIONER, fonsterObjekt, sidadress, sokvagUr, tolkaProduktsida, utanWebp, webbIdUr } from "./sida";
import { TESTSKU, TESTWEBBID, testSokvag, testrecension, testsida } from "./testsida";

describe("tolkaProduktsida", () => {
  it("☠️ sajtens egen valuta måste också vara kronor", () => {
    expect(tolkaProduktsida(testsida({ globalValuta: "EUR" }))).toEqual({ ok: false, fel: "fel_valuta" });
  });

  it("☠️ flera erbjudanden: samma valuta och samma pris, annars okänt", () => {
    expect(tolkaProduktsida(testsida({ extraErbjudande: { valuta: "EUR", pris: 999.5 } }))).toEqual({ ok: false, fel: "fel_valuta" });
    expect(tolkaProduktsida(testsida({ extraErbjudande: { valuta: "SEK", pris: 1099 } }))).toEqual({ ok: false, fel: "motsagelse_pris" });
    expect(tolkaProduktsida(testsida({ extraErbjudande: { valuta: "SEK", pris: 999.5 } })).ok).toBe(true);
  });

  it("☠️ en trasig bildadress eller entitet fäller inte tolkningen", () => {
    const html = testsida()
      .replace("test-f1.jpg", "test-%E0%A4%A.jpg")
      .replace("Hållbar: ram i", "Hållbar &#99999999; ram i");
    const t = tolkaProduktsida(html);
    expect(t.ok).toBe(true);
    if (!t.ok) return;
    expect(t.sida.bilder.some((b) => b.url.includes("%E0%A4%A"))).toBe(true);
    expect(t.sida.punkter[0]).toContain("\uFFFD");
  });

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

describe("betyg och recensioner (steg 8)", () => {
  const sida = (over: Parameters<typeof testsida>[0]) => {
    const t = tolkaProduktsida(testsida(over));
    if (!t.ok) throw new Error("ska gå att tolka");
    return t.sida;
  };

  it("läser betyget ur aggregateRating", () => {
    expect(sida({}).betyg).toEqual({ snitt: 4.5, antal: 12 });
    expect(sida({ betyg: { ratingValue: "3.75", ratingCount: "5" } }).betyg).toEqual({ snitt: 3.75, antal: 5 });
  });

  it("☠️ ett betyg som inte går att lita på är inget betyg, och fäller inte sidan", () => {
    expect(sida({ betyg: null }).betyg).toBeNull();
    expect(sida({ betyg: { ratingValue: 0, reviewCount: 3 } }).betyg).toBeNull();
    expect(sida({ betyg: { ratingValue: 6, reviewCount: 3 } }).betyg).toBeNull();
    expect(sida({ betyg: { ratingValue: 4 } }).betyg).toBeNull();
    expect(sida({ betyg: { ratingValue: 4, reviewCount: 2.5 } }).betyg).toBeNull();
    expect(sida({ betyg: { ratingValue: "fyra", reviewCount: 3 } }).betyg).toBeNull();
  });

  it("läser recensionerna: betyg, text, datum och namn", () => {
    expect(sida({}).recensioner).toEqual([
      {
        betyg: 5,
        text: "Stabil och lätt att montera, hjulen rullar fint i sanden. Rekommenderas.",
        datum: "2026-09-14",
        namn: "Test P.",
      },
    ]);
  });

  it("☠️ en recension utan text eller med ett betyg utanför 1–5 tas inte med", () => {
    const r = sida({
      recensioner: [
        testrecension({ reviewBody: "" }),
        testrecension({ reviewRating: { ratingValue: 9 } }),
        testrecension({ reviewRating: {} }),
        testrecension({ reviewBody: "Bra &amp; prisvärd", author: "Anna", datePublished: "igår" }),
      ],
    }).recensioner;
    expect(r).toEqual([{ betyg: 5, text: "Bra & prisvärd", datum: null, namn: "Anna" }]);
  });

  it("högst tio recensioner", () => {
    const tolv = Array.from({ length: 12 }, (_, i) => testrecension({ reviewBody: `Recension nummer ${i} är bra.` }));
    expect(sida({ recensioner: tolv }).recensioner).toHaveLength(MAX_RECENSIONER);
  });

  it("en sida utan recensioner ger en tom lista", () => {
    expect(sida({ recensioner: [], betyg: null })).toMatchObject({ recensioner: [], betyg: null });
  });
});
