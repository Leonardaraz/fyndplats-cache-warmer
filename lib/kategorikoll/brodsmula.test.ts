import { describe, expect, it } from "vitest";
import { brodsmula, huvudord, raknaPerSida, somText, typord, type Kat } from "./brodsmula";

// Fallen nedan är butikens (headless-site lib/breadcrumb-category.test.ts),
// med samma namn och tal, så att kopian och originalet prövas lika.
const kat = (id: string, foralder: string | null = null): Kat => ({ id, namn: id, foralder });

const hem = kat("hem-inredning");
const mobler = kat("mobler");
const fatoljer = kat("fatoljer", "mobler");
const snurr = kat("snurrfatoljer", "mobler");
const forvaring = kat("forvaring-organisering", "hem-inredning");
const byraer = kat("byraer", "mobler");
const tunn = kat("tunn-kategori", "mobler");
const alla = [hem, mobler, fatoljer, snurr, forvaring, byraer, tunn];

const antal = new Map([
  ["hem-inredning", 1739],
  ["mobler", 878],
  ["fatoljer", 264],
  ["snurrfatoljer", 18],
  ["forvaring-organisering", 390],
  ["byraer", 27],
  ["tunn-kategori", 3],
]);

describe("brödsmulan före (butikens regel sedan 2026-09-24)", () => {
  const valj = (egna: Kat[], n = antal) => brodsmula(egna, alla, n, "fore");

  it("den smalaste underkategorin vinner, och avdelningen är dess förälder", () => {
    expect(valj([mobler, fatoljer, snurr])).toEqual({ avdelning: "mobler", underkategori: "snurrfatoljer" });
  });

  it("avdelningen följer underkategorin", () => {
    expect(valj([hem, forvaring, mobler, byraer])).toEqual({ avdelning: "mobler", underkategori: "byraer" });
  });

  it("en tunn underkategori hoppas över", () => {
    expect(valj([mobler, fatoljer, tunn]).underkategori).toBe("fatoljer");
    expect(valj([mobler, tunn])).toEqual({ avdelning: "mobler" });
  });

  it("lika många avgörs på sluggen", () => {
    const n = new Map(antal);
    n.set("fatoljer", 18);
    expect(valj([mobler, snurr, fatoljer], n).underkategori).toBe("fatoljer");
    expect(valj([mobler, fatoljer, snurr], n).underkategori).toBe("fatoljer");
  });

  it("utan indexerbar underkategori gäller den gamla regeln", () => {
    expect(valj([hem, mobler])).toEqual({ avdelning: "hem-inredning" });
    expect(valj([fatoljer], new Map())).toEqual({ avdelning: "fatoljer" });
    expect(valj([])).toEqual({});
  });
});

describe("brödsmulan efter: produktens egna avdelningar först (2026-11-04)", () => {
  const skonhet = kat("skonhet-halsa");
  const massage = kat("massage-aterhamtning", "skonhet-halsa");
  const uppres = kat("uppresningsfatoljer", "mobler");
  const trad = [...alla, skonhet, massage, uppres];
  const n = new Map([...antal, ["massage-aterhamtning", 74], ["uppresningsfatoljer", 34], ["skonhet-halsa", 900]]);

  it("fåtöljen från audit: kopplad till Möbler, Fåtöljer och Massage & Återhämtning", () => {
    const egna = [mobler, fatoljer, massage];
    expect(brodsmula(egna, trad, n, "fore")).toEqual({ avdelning: "skonhet-halsa", underkategori: "massage-aterhamtning" });
    expect(brodsmula(egna, trad, n, "efter")).toEqual({ avdelning: "mobler", underkategori: "fatoljer" });
  });

  it("med Uppresningsfåtöljer kopplad blir det den smalaste i Möbler", () => {
    const egna = [mobler, fatoljer, massage, uppres];
    expect(brodsmula(egna, trad, n, "efter")).toEqual({ avdelning: "mobler", underkategori: "uppresningsfatoljer" });
  });

  it("en produkt i båda avdelningarna behåller den smalaste av dem", () => {
    const egna = [mobler, fatoljer, skonhet, massage];
    expect(brodsmula(egna, trad, n, "efter")).toEqual({ avdelning: "skonhet-halsa", underkategori: "massage-aterhamtning" });
  });

  it("utan någon egen avdelning gäller regeln före", () => {
    const egna = [fatoljer, massage];
    expect(brodsmula(egna, trad, n, "efter")).toEqual(brodsmula(egna, trad, n, "fore"));
  });
});

describe("brödsmulan efter: produktens typkategori först (Leonard 2026-11-05)", () => {
  // Butikens fall (headless-site lib/breadcrumb-category.test.ts), med riktiga namn.
  const n = (id: string, namn: string, foralder: string | null = null): Kat => ({ id, namn, foralder });
  const hemN = n("hem-inredning", "Hem & Inredning");
  const moblerN = n("mobler", "Möbler");
  const forvaringN = n("forvaring-organisering", "Förvaring & Organisering", "hem-inredning");
  const skoskap = n("skoskap-skobankar", "Skoskåp & skobänkar", "mobler");
  const fatoljerN = n("fatoljer", "Fåtöljer", "mobler");
  const uppresN = n("uppresningsfatoljer", "Uppresningsfåtöljer", "mobler");
  const skonhetN = n("skonhet-halsa", "Skönhet & Hälsa");
  const massageN = n("massage-aterhamtning", "Massage & Återhämtning", "skonhet-halsa");
  const julN = n("jul-hogtider", "Jul & Högtider");
  const julgranar = n("julgranar", "Julgranar", "jul-hogtider");
  const dekoration = n("dekoration-prydnad", "Dekoration & Prydnad", "hem-inredning");
  const trad = [hemN, moblerN, forvaringN, skoskap, fatoljerN, uppresN, skonhetN, massageN, julN, julgranar, dekoration];
  const antalN = new Map([
    ["hem-inredning", 1739], ["mobler", 878], ["forvaring-organisering", 390], ["skoskap-skobankar", 41],
    ["fatoljer", 264], ["uppresningsfatoljer", 34], ["skonhet-halsa", 900], ["massage-aterhamtning", 74],
    ["jul-hogtider", 300], ["julgranar", 60], ["dekoration-prydnad", 45],
  ]);
  const efter = (egna: Kat[], namn?: string, a = antalN) => brodsmula(egna, trad, a, "efter", namn);

  it("skoskåpet behåller sin typkategori fast det bara är kopplat till avdelningen Hem & Inredning", () => {
    const egna = [hemN, forvaringN, skoskap];
    expect(efter(egna, "Skoskåp med tre fack och sittdyna")).toEqual({ avdelning: "Möbler", underkategori: "Skoskåp & skobänkar" });
    expect(efter(egna).underkategori).toBe("Förvaring & Organisering");
    // Regeln före (live) tog redan den smalaste: samma svar som efter, alltså inget byte.
    expect(brodsmula(egna, trad, antalN, "fore")).toEqual({ avdelning: "Möbler", underkategori: "Skoskåp & skobänkar" });
  });

  it("uppresningsfåtöljen går till Uppresningsfåtöljer, inte till Massage & Återhämtning", () => {
    expect(efter([moblerN, fatoljerN, massageN, uppresN], "Elektrisk uppresningsfåtölj med liggfunktion – chenille").underkategori).toBe(
      "Uppresningsfåtöljer",
    );
    expect(efter([moblerN, fatoljerN, massageN], "Massagestol med värme").underkategori).toBe("Fåtöljer");
  });

  it("julgranen stannar i Julgranar fast den är kopplad till avdelningen Hem & Inredning", () => {
    expect(efter([hemN, dekoration, julgranar], "Konstgjord julgran 150 cm med 1724 grenspetsar")).toEqual({
      avdelning: "Jul & Högtider",
      underkategori: "Julgranar",
    });
  });

  it("ett ord efter med, för eller tankstreck räknas inte, och en tunn typkategori hoppas över", () => {
    const egna = [hemN, forvaringN, skoskap];
    expect(efter(egna, "Bänk med skoskåp").underkategori).toBe("Förvaring & Organisering");
    expect(efter(egna, "Hallmöbel – skoskåp och krokar").underkategori).toBe("Förvaring & Organisering");
    const tunn = new Map(antalN);
    tunn.set("skoskap-skobankar", 3);
    expect(efter(egna, "Skoskåp med tre fack", tunn).underkategori).toBe("Förvaring & Organisering");
  });

  it("bara produktens egna kategorier kan bli typkategori", () => {
    expect(efter([hemN, forvaringN], "Skoskåp med tre fack").underkategori).toBe("Förvaring & Organisering");
  });

  it("typord och huvudord", () => {
    expect(typord("Skoskåp & skobänkar")).toEqual(expect.arrayContaining(["skoskåp", "skobänkar", "skobänk"]));
    expect(typord("TV-bänkar")).toContain("bänk");
    expect(typord("TV-bänkar")).not.toContain("tv");
    expect(typord("Sideboards & vitrinskåp")).toContain("sideboard");
    expect(typord("Soptunnor")).toContain("soptunna");
    expect(typord("Byråer")).toContain("byrå");
    expect(typord("Julgranar")).toContain("julgran");
    expect([...huvudord("Elektrisk uppresningsfåtölj med liggfunktion – chenille")]).toEqual(["elektrisk", "uppresningsfåtölj"]);
    expect([...huvudord("TV-bänk i ek")]).toEqual(["tv", "bänk"]);
  });
});

describe("raknaPerSida och somText", () => {
  it("räknar varje produkt en gång per sida, och föräldern får underkategorins", () => {
    const r = raknaPerSida([{ kat: ["fatoljer", "snurrfatoljer"] }, { kat: ["fatoljer"] }], alla);
    expect(r.get("fatoljer")).toBe(2);
    expect(r.get("snurrfatoljer")).toBe(1);
    expect(r.get("mobler")).toBe(2);
  });

  it("text för rapporten", () => {
    expect(somText({ avdelning: "Möbler", underkategori: "Fåtöljer" })).toBe("Möbler > Fåtöljer");
    expect(somText({})).toBe("–");
  });
});
