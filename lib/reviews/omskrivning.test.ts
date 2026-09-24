import { describe, expect, it } from "vitest";
import type { StoredReview } from "../store/reviews";
import { MAX_OMSKRIVNINGAR_PER_ANROP, skrivOm, tolkaOmskrivning, type OmskrivDeps } from "./omskrivning";

const ORIGINAL = "Super Qualität schneller Versand und Aufbau unsere kleine ist begeistert";
const FORE = "Superbra kvalitet, snabb leverans och snabb montering – vår lilla är helt förtjust.";
const NY = "Super kvalitet, snabb leverans och snabbt ihopsatt. Vår lilla är helt förtjust";

function lagrad(p: Partial<StoredReview> = {}): StoredReview {
  return {
    productId: "p1",
    reviewIdAE: "r1",
    rating: 5,
    textOriginal: ORIGINAL,
    textSwedish: FORE,
    initials: "A.B.",
    hasImage: false,
    status: "edited",
    source: "aosom",
    ...p,
  };
}

function deps(rader: StoredReview[], ext: Partial<OmskrivDeps> = {}) {
  const skrivna: Array<[string, string, string]> = [];
  const dolda: Array<[string, string]> = [];
  const listningar: string[] = [];
  const d: OmskrivDeps = {
    listByProduct: async (p) => {
      listningar.push(p);
      return rader.filter((r) => r.productId === p);
    },
    editText: async (p, id, sv) => {
      skrivna.push([p, id, sv]);
    },
    setStatus: async (p, id) => {
      dolda.push([p, id]);
    },
    now: () => 0,
    dryRun: false,
    ...ext,
  };
  return { d, skrivna, dolda, listningar };
}

describe("tolkaOmskrivning", () => {
  it("tar omskrivningar och döljningar, vägrar ofullständiga rader", () => {
    const t = tolkaOmskrivning({
      rader: [
        { productId: "p1", reviewIdAE: "r1", fore: FORE, sv: NY },
        { productId: "p1", reviewIdAE: "r2", dolj: true },
        { productId: "p1", reviewIdAE: "r3", sv: NY },
        { reviewIdAE: "r4", fore: FORE, sv: NY },
      ],
    });
    expect(t.rader).toEqual([
      { productId: "p1", reviewIdAE: "r1", fore: FORE, sv: NY },
      { productId: "p1", reviewIdAE: "r2", dolj: true },
    ]);
    expect(t.fel).toHaveLength(2);
  });

  it("vägrar för många rader och fel form", () => {
    const många = Array.from({ length: MAX_OMSKRIVNINGAR_PER_ANROP + 1 }, () => ({}));
    expect(tolkaOmskrivning({ rader: många }).fel[0]).toMatch(/för många/);
    expect(tolkaOmskrivning({}).fel[0]).toMatch(/saknas/);
  });
});

describe("skrivOm", () => {
  it("skriver om en synlig Aosom-rad när texten är den väntade", async () => {
    const { d, skrivna } = deps([lagrad()]);
    const s = await skrivOm([{ productId: "p1", reviewIdAE: "r1", fore: FORE, sv: NY }], d);
    expect(s.omskrivna).toBe(1);
    expect(skrivna).toEqual([["p1", "r1", NY]]);
  });

  it("torrt skriver ingenting men räknar", async () => {
    const { d, skrivna } = deps([lagrad()], { dryRun: true });
    const s = await skrivOm([{ productId: "p1", reviewIdAE: "r1", fore: FORE, sv: NY }], d);
    expect(s.omskrivna).toBe(1);
    expect(skrivna).toEqual([]);
  });

  it("rör aldrig en text som ändrats sedan omskrivningen gjordes", async () => {
    const { d, skrivna } = deps([lagrad({ textSwedish: "Leonards egen text." })]);
    const s = await skrivOm([{ productId: "p1", reviewIdAE: "r1", fore: FORE, sv: NY }], d);
    expect(s.andradeSedan).toBe(1);
    expect(skrivna).toEqual([]);
  });

  it("rör aldrig andra källor än Aosom", async () => {
    const { d, skrivna } = deps([lagrad({ source: undefined })]);
    const s = await skrivOm([{ productId: "p1", reviewIdAE: "r1", fore: FORE, sv: NY }], d);
    expect(s.annanKalla).toBe(1);
    expect(skrivna).toEqual([]);
  });

  it("väcker aldrig en dold eller väntande rad", async () => {
    const { d, skrivna } = deps([
      lagrad({ status: "rejected" }),
      lagrad({ reviewIdAE: "r2", status: "pending" }),
    ]);
    const s = await skrivOm(
      [
        { productId: "p1", reviewIdAE: "r1", fore: FORE, sv: NY },
        { productId: "p1", reviewIdAE: "r2", fore: FORE, sv: NY },
      ],
      d,
    );
    expect(s.ejSynliga).toBe(2);
    expect(skrivna).toEqual([]);
  });

  it("underkänner via översättningsgrinden", async () => {
    const { d, skrivna } = deps([lagrad()]);
    const s = await skrivOm([{ productId: "p1", reviewIdAE: "r1", fore: FORE, sv: "Kort." }], d);
    expect(s.underkanda).toBe(1);
    expect(s.underkandaSkal).toEqual({ "för-kort": 1 });
    expect(skrivna).toEqual([]);
  });

  it("identisk text räknas som oförändrad", async () => {
    const { d, skrivna } = deps([lagrad()]);
    const s = await skrivOm([{ productId: "p1", reviewIdAE: "r1", fore: FORE, sv: FORE }], d);
    expect(s.oforandrade).toBe(1);
    expect(skrivna).toEqual([]);
  });

  it("döljer en rad som hör till fel produkt", async () => {
    const { d, dolda } = deps([lagrad()]);
    const s = await skrivOm([{ productId: "p1", reviewIdAE: "r1", dolj: true }], d);
    expect(s.dolda).toBe(1);
    expect(dolda).toEqual([["p1", "r1"]]);
  });

  it("saknad rad räknas, och produkten läses bara en gång per anrop", async () => {
    const { d, listningar } = deps([lagrad(), lagrad({ reviewIdAE: "r2" })]);
    const s = await skrivOm(
      [
        { productId: "p1", reviewIdAE: "r1", fore: FORE, sv: NY },
        { productId: "p1", reviewIdAE: "r2", fore: FORE, sv: NY },
        { productId: "p1", reviewIdAE: "r9", fore: FORE, sv: NY },
      ],
      d,
    );
    expect(s.omskrivna).toBe(2);
    expect(s.saknas).toBe(1);
    expect(listningar).toEqual(["p1"]);
  });

  it("stannar på tidsbudgeten och säger var den ska fortsätta", async () => {
    let t = 0;
    const { d } = deps([lagrad(), lagrad({ reviewIdAE: "r2" })], {
      now: () => t,
      tidsbudgetMs: 10,
      editText: async () => {
        t += 20;
      },
    });
    const s = await skrivOm(
      [
        { productId: "p1", reviewIdAE: "r1", fore: FORE, sv: NY },
        { productId: "p1", reviewIdAE: "r2", fore: FORE, sv: NY },
      ],
      d,
    );
    expect(s.omskrivna).toBe(1);
    expect(s.stoppadAv).toBe("tidsbudget");
    expect(s.kvarFran).toBe(1);
  });

  it("ett skrivfel stoppar inte resten", async () => {
    let n = 0;
    const { d } = deps([lagrad(), lagrad({ reviewIdAE: "r2" })], {
      editText: async () => {
        n++;
        if (n === 1) throw new Error("Wix");
      },
    });
    const s = await skrivOm(
      [
        { productId: "p1", reviewIdAE: "r1", fore: FORE, sv: NY },
        { productId: "p1", reviewIdAE: "r2", fore: FORE, sv: NY },
      ],
      d,
    );
    expect(s.skrivfel).toBe(1);
    expect(s.omskrivna).toBe(1);
  });
});
