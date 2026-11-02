// Borttagningen av felaktiga kategorilänkar. Testerna låser de fem egenskaperna i
// lib/polish/kategori-bort.ts: planen säger vad som ska finnas kvar, alla villkor
// prövas före första skrivningen, kategorier anges med sökväg, skarpt läge kräver
// antalet och verifiera läser tillbaka.
//
// Trädet och länkarna är en liten kopia av det som lästes ur butiken 2026-11-02
// (en soppvärmare med importens Bygg & Renovering > Beslag & järnvaror, ett
// våffeljärn med importens Miniugnar & airfryers).

import { describe, expect, it } from "vitest";
import {
  type BortPlan,
  type BortRad,
  korBort,
  MAX_RADER,
  sokvagar,
  valideraBortPlan,
} from "./kategori-bort";
import type { WixAnrop } from "./skrivplan";

interface Nod {
  id: string;
  name: string;
  parent?: string;
  visible: boolean;
}

const TRAD: Nod[] = [
  { id: "alla", name: "All Products", visible: true },
  { id: "kok", name: "Kök & Husgeråd", visible: true },
  { id: "mini", name: "Miniugnar & airfryers", parent: "kok", visible: true },
  { id: "maskin", name: "Köksmaskiner & Apparater", parent: "kok", visible: true },
  { id: "serv", name: "Servering & Glas", parent: "kok", visible: false },
  { id: "bygg", name: "Bygg & Renovering", visible: true },
  { id: "beslag", name: "Beslag & järnvaror", parent: "bygg", visible: false },
  { id: "hem", name: "Hem & Inredning", visible: true },
  { id: "forv", name: "Förvaring & Organisering", parent: "hem", visible: true },
  { id: "mobler", name: "Möbler", visible: true },
  // Samma lövnamn under en annan avdelning: bara sökvägen skiljer dem åt.
  { id: "forv2", name: "Förvaring & Organisering", parent: "mobler", visible: true },
];

const P_VAFFEL = "3aa888bf-4e4d-41c4-b4c9-6ecd44b64c19";
const P_SOPP = "76175ccf-c048-4bb9-b7c6-22ca9320615b";

const VAFFEL: BortRad = {
  kort: "3aa888bf",
  pid: P_VAFFEL,
  bort: ["Kök & Husgeråd > Miniugnar & airfryers"],
  behall: ["Kök & Husgeråd", "Kök & Husgeråd > Köksmaskiner & Apparater"],
};
const SOPP: BortRad = {
  kort: "76175ccf",
  pid: P_SOPP,
  bort: ["Bygg & Renovering", "Bygg & Renovering > Beslag & järnvaror"],
  behall: ["Kök & Husgeråd", "Kök & Husgeråd > Servering & Glas"],
};

function plan(...rader: BortRad[]): BortPlan {
  return { namn: "vevor-1", rader: rader.length ? rader : [VAFFEL, SOPP] };
}

const LANKAR_FORE = () => ({
  [P_VAFFEL]: ["alla", "kok", "mini", "maskin"],
  [P_SOPP]: ["alla", "kok", "serv", "bygg", "beslag"],
});

interface Anrop {
  metod: string;
  sokvag: string;
  kropp?: unknown;
}

interface Val {
  /** `${produkt-id}|${kategori-id}` som Wix nekar. */
  nekaBort?: Set<string>;
  /** Wix ignorerar fields=DIRECT_CATEGORIES_INFO och svarar utan fältet. */
  tomProjektion?: boolean;
  kastaLasning?: string;
  trad?: Nod[];
}

/** En låtsas-Wix som minns varje länk och ändrar dem när remove-items körs. */
function simulera(lankar: Record<string, string[]>, val: Val = {}) {
  const har = new Map(Object.entries(lankar).map(([k, v]) => [k, new Set(v)]));
  const anrop: Anrop[] = [];
  const trad = val.trad ?? TRAD;
  const wix: WixAnrop = async (metod, sokvag, kropp) => {
    anrop.push({ metod, sokvag, kropp });
    if (metod === "POST" && sokvag === "/categories/v1/categories/query") {
      return {
        categories: trad.map((n) => ({
          id: n.id,
          name: n.name,
          visible: n.visible,
          ...(n.parent ? { parentCategory: { id: n.parent } } : {}),
        })),
        pagingMetadata: {},
      };
    }
    const prod = sokvag.match(/^\/stores\/v3\/products\/([^?]+)\?fields=DIRECT_CATEGORIES_INFO$/);
    if (metod === "GET" && prod) {
      if (val.kastaLasning === prod[1]) throw new Error("Wix 503: nere");
      const s = har.get(prod[1]);
      if (!s) throw new Error("Wix 404: finns inte");
      return {
        product: {
          id: prod[1],
          ...(val.tomProjektion ? {} : { directCategoriesInfo: { categories: [...s].map((id) => ({ id })) } }),
        },
      };
    }
    const rem = sokvag.match(/^\/categories\/v1\/bulk\/categories\/([^/]+)\/remove-items$/);
    if (metod === "POST" && rem) {
      const items = (kropp as { items: Array<{ catalogItemId: string }> }).items;
      return {
        results: items.map((it, i) => {
          const neka = val.nekaBort?.has(`${it.catalogItemId}|${rem[1]}`) ?? false;
          if (!neka) har.get(it.catalogItemId)?.delete(rem[1]);
          return {
            itemMetadata: {
              item: { catalogItemId: it.catalogItemId },
              originalIndex: i,
              success: !neka,
              ...(neka ? { error: { code: "FORBIDDEN" } } : {}),
            },
          };
        }),
        bulkActionMetadata: { undetailedFailures: 0 },
      };
    }
    throw new Error(`oväntat anrop: ${metod} ${sokvag}`);
  };
  return { wix, anrop, har, skrivningar: () => anrop.filter((a) => a.sokvag.includes("/remove-items")) };
}

describe("sokvagar", () => {
  it("bygger sökvägen ur föräldrakedjan, och samma lövnamn under två avdelningar skiljs åt", () => {
    const trad = TRAD.map((n) => ({ id: n.id, namn: n.name, foralder: n.parent ?? null, synlig: n.visible }));
    const s = sokvagar(trad);
    expect(s.get("Kök & Husgeråd")).toEqual({ id: "kok", synlig: true });
    expect(s.get("Bygg & Renovering > Beslag & järnvaror")).toEqual({ id: "beslag", synlig: false });
    expect(s.get("Hem & Inredning > Förvaring & Organisering")?.id).toBe("forv");
    expect(s.get("Möbler > Förvaring & Organisering")?.id).toBe("forv2");
    // Det bara lövnamnet är inte en sökväg.
    expect(s.get("Förvaring & Organisering")).toBeUndefined();
  });

  it("☠️ en sökväg som finns två gånger är tvetydig (null)", () => {
    const s = sokvagar([
      { id: "a", namn: "Hem", foralder: null, synlig: true },
      { id: "b", namn: "Mattor", foralder: "a", synlig: true },
      { id: "c", namn: "Mattor", foralder: "a", synlig: true },
    ]);
    expect(s.get("Hem > Mattor")).toBeNull();
    expect(s.get("Hem")?.id).toBe("a");
  });

  it("en kategori vars förälder saknas i trädet får ingen sökväg", () => {
    const s = sokvagar([{ id: "b", namn: "Mattor", foralder: "finns-inte", synlig: true }]);
    expect(s.size).toBe(0);
  });
});

describe("korBort: torrt läge", () => {
  it("skriver ingenting och räknar länkarna som skulle tas bort", async () => {
    const { wix, skrivningar } = simulera(LANKAR_FORE());
    const u = await korBort(plan(), wix, "torr", null);
    expect(u.ok).toBe(true);
    expect(u.attTaBort).toBe(3);
    expect(u.sammanfattning).toBe("3 länkar att ta bort, 0 redan borta (torrt)");
    expect(skrivningar()).toHaveLength(0);
    expect(u.rader).toHaveLength(3);
    expect(u.rader.every((r) => r.torr === true && r.ok)).toBe(true);
    expect(u.rader.find((r) => r.kort === "76175ccf" && r.kat === "Bygg & Renovering")).toMatchObject({ lankar: 5 });
  });
});

describe("korBort: skarpt läge", () => {
  it("tar bort exakt de angivna länkarna och inget annat", async () => {
    const { wix, har, skrivningar } = simulera(LANKAR_FORE());
    const u = await korBort(plan(), wix, "skriv", 3);
    expect(u.ok).toBe(true);
    expect(u.sammanfattning).toBe("3 länkar borttagna, 0 redan borta, 0 fel");
    expect([...har.get(P_VAFFEL)!].sort()).toEqual(["alla", "kok", "maskin"]);
    expect([...har.get(P_SOPP)!].sort()).toEqual(["alla", "kok", "serv"]);
    // En skrivning per kategori, med Wix Stores app-id i varje rad.
    expect(skrivningar().map((a) => a.sokvag).sort()).toEqual([
      "/categories/v1/bulk/categories/beslag/remove-items",
      "/categories/v1/bulk/categories/bygg/remove-items",
      "/categories/v1/bulk/categories/mini/remove-items",
    ]);
    expect(skrivningar()[0].kropp).toMatchObject({
      treeReference: { appNamespace: "@wix/stores" },
      items: [{ appId: "215238eb-22a5-4c36-9e7b-e7c08025e04e" }],
    });
  });

  it("två produkter i samma kategori tas bort i ETT anrop", async () => {
    const andra: BortRad = { ...VAFFEL, kort: "4bb999c0", pid: "4bb999c0-4e4d-41c4-b4c9-6ecd44b64c19" };
    const { wix, skrivningar } = simulera({ ...LANKAR_FORE(), [andra.pid]: ["alla", "kok", "mini", "maskin"] });
    const u = await korBort(plan(VAFFEL, andra), wix, "skriv", 2);
    expect(u.ok).toBe(true);
    expect(skrivningar()).toHaveLength(1);
    expect((skrivningar()[0].kropp as { items: unknown[] }).items).toHaveLength(2);
  });

  it("☠️ kräver bekrafta = antalet länkar som tas bort, och skriver annars ingenting", async () => {
    for (const fel of [null, 0, 2, 4]) {
      const { wix, skrivningar } = simulera(LANKAR_FORE());
      const u = await korBort(plan(), wix, "skriv", fel);
      expect(u.ok).toBe(false);
      expect(u.avbrutet).toMatch(/bekrafta ska vara 3/);
      expect(skrivningar()).toHaveLength(0);
    }
  });

  it("en omkörning är lugn: länkarna är redan borta, ingenting skrivs och antalet är 0", async () => {
    const { wix, skrivningar } = simulera(LANKAR_FORE());
    await korBort(plan(), wix, "skriv", 3);
    const forsta = skrivningar().length;

    const torr = await korBort(plan(), wix, "torr", null);
    expect(torr.attTaBort).toBe(0);
    expect(torr.rader.every((r) => r.redan === true)).toBe(true);

    const igen = await korBort(plan(), wix, "skriv", 0);
    expect(igen.ok).toBe(true);
    expect(igen.sammanfattning).toBe("0 länkar borttagna, 3 redan borta, 0 fel");
    expect(skrivningar()).toHaveLength(forsta);
  });

  it("om Wix nekar en länk blir just den raden ett fel, och de andra tas bort", async () => {
    const { wix, har } = simulera(LANKAR_FORE(), { nekaBort: new Set([`${P_VAFFEL}|mini`]) });
    const u = await korBort(plan(), wix, "skriv", 3);
    expect(u.ok).toBe(false);
    expect(u.sammanfattning).toBe("2 länkar borttagna, 0 redan borta, 1 fel");
    expect(u.rader.find((r) => r.kort === "3aa888bf")).toMatchObject({ ok: false, fel: expect.stringContaining("FORBIDDEN") });
    expect(har.get(P_VAFFEL)!.has("mini")).toBe(true);
    expect(har.get(P_SOPP)!.has("beslag")).toBe(false);
  });
});

describe("korBort: villkoren före första skrivningen", () => {
  it("☠️ en behall som inte är kopplad stoppar ALLA rader, också de som är i sin ordning", async () => {
    const { wix, skrivningar } = simulera({
      [P_VAFFEL]: ["alla", "kok", "mini"], // saknar Köksmaskiner & Apparater
      [P_SOPP]: ["alla", "kok", "serv", "bygg", "beslag"],
    });
    const u = await korBort(plan(), wix, "skriv", 3);
    expect(u.ok).toBe(false);
    expect(u.avbrutet).toMatch(/ett villkor föll/);
    expect(u.rader).toEqual([
      { kort: "3aa888bf", ok: false, fel: "ska ligga kvar men är inte kopplad till: Kök & Husgeråd > Köksmaskiner & Apparater" },
    ]);
    expect(skrivningar()).toHaveLength(0);
  });

  it("☠️ en tom projektion ser inte ut som 'redan borta': behall faller", async () => {
    const { wix, skrivningar } = simulera(LANKAR_FORE(), { tomProjektion: true });
    const u = await korBort(plan(), wix, "skriv", 0);
    expect(u.ok).toBe(false);
    expect(u.rader.every((r) => /inte kopplad/.test(String(r.fel)))).toBe(true);
    expect(skrivningar()).toHaveLength(0);
  });

  it("minst en kategori som ligger kvar ska vara synlig", async () => {
    const dold: BortRad = { ...SOPP, behall: ["Kök & Husgeråd > Servering & Glas"] };
    const { wix, skrivningar } = simulera(LANKAR_FORE());
    const u = await korBort(plan(dold), wix, "skriv", 2);
    expect(u.ok).toBe(false);
    expect(u.rader[0]).toMatchObject({ kort: "76175ccf", fel: "ingen av kategorierna som ska ligga kvar är synlig" });
    expect(skrivningar()).toHaveLength(0);
  });

  it("en okänd sökväg, eller bara ett lövnamn, avbryter innan produkterna ens läses", async () => {
    for (const s of ["Kök & Husgeråd > Finns inte", "Förvaring & Organisering"]) {
      const { wix, anrop, skrivningar } = simulera(LANKAR_FORE());
      const u = await korBort(plan({ ...VAFFEL, bort: [s] }), wix, "skriv", 1);
      expect(u.ok).toBe(false);
      expect(u.avbrutet).toBe(`okänd eller tvetydig kategori: ${s} — ingenting skrivet`);
      expect(skrivningar()).toHaveLength(0);
      expect(anrop.some((a) => a.sokvag.startsWith("/stores/v3/products/"))).toBe(false);
    }
  });

  it("☠️ en tvetydig sökväg i trädet avbryter", async () => {
    const dubbel: Nod[] = [...TRAD, { id: "mini2", name: "Miniugnar & airfryers", parent: "kok", visible: true }];
    const { wix, skrivningar } = simulera(LANKAR_FORE(), { trad: dubbel });
    const u = await korBort(plan(VAFFEL), wix, "skriv", 1);
    expect(u.ok).toBe(false);
    expect(u.avbrutet).toMatch(/tvetydig/);
    expect(skrivningar()).toHaveLength(0);
  });

  it("en produkt som inte går att läsa stoppar alla rader", async () => {
    const { wix, skrivningar } = simulera(LANKAR_FORE(), { kastaLasning: P_SOPP });
    const u = await korBort(plan(), wix, "skriv", 3);
    expect(u.ok).toBe(false);
    expect(u.avbrutet).toMatch(/gick inte att läsa/);
    expect(u.rader).toEqual([{ kort: "76175ccf", ok: false, fel: expect.stringMatching(/^går inte att läsa: /) }]);
    expect(skrivningar()).toHaveLength(0);
  });
});

describe("korBort: verifiera", () => {
  it("är ok när alla borttagna länkar är borta och alla behall finns kvar", async () => {
    const { wix } = simulera(LANKAR_FORE());
    await korBort(plan(), wix, "skriv", 3);
    const u = await korBort(plan(), wix, "verifiera", null);
    expect(u.ok).toBe(true);
    expect(u.sammanfattning).toBe("2 av 2 rader verifierade");
    // Antalet direkta länkar kvar syns, så att en människa kan jämföra mot torrkörningen.
    expect(u.rader).toEqual([
      { kort: "3aa888bf", ok: true, lankar: 3 },
      { kort: "76175ccf", ok: true, lankar: 3 },
    ]);
  });

  it("☠️ fäller en rad där en länk finns kvar, och en där en behall saknas", async () => {
    const { wix } = simulera({
      [P_VAFFEL]: ["alla", "kok", "mini", "maskin"], // mini finns kvar
      [P_SOPP]: ["alla", "kok"], // Servering & Glas har försvunnit
    });
    const u = await korBort(plan(), wix, "verifiera", null);
    expect(u.ok).toBe(false);
    expect(u.rader).toEqual([
      { kort: "3aa888bf", ok: false, fel: "länken finns kvar: Kök & Husgeråd > Miniugnar & airfryers", lankar: 4 },
      { kort: "76175ccf", ok: false, fel: "ska ligga kvar men saknas: Kök & Husgeråd > Servering & Glas", lankar: 2 },
    ]);
  });
});

describe("valideraBortPlan", () => {
  it("godtar en korrekt plan", () => {
    expect("plan" in valideraBortPlan(plan())).toBe(true);
  });

  function fel(p: unknown): string {
    const v = valideraBortPlan(p);
    return "fel" in v ? v.fel.join(" | ") : "";
  }

  it("vägrar tom plan, fel namn och fler än MAX_RADER rader", () => {
    expect(fel(null)).toMatch(/objekt/);
    expect(fel({ namn: "vevor-1", rader: [] })).toMatch(/rader saknas/);
    expect(fel({ namn: "Fel Namn", rader: [VAFFEL] })).toMatch(/namn/);
    const manga = Array.from({ length: MAX_RADER + 1 }, (_, i) => {
      const hex = i.toString(16).padStart(8, "0");
      return { ...VAFFEL, kort: hex, pid: `${hex}-4e4d-41c4-b4c9-6ecd44b64c19` };
    });
    expect(fel({ namn: "vevor-1", rader: manga })).toMatch(/högst 30/);
  });

  it("vägrar kort och pid som inte hör ihop, och dubbletter", () => {
    expect(fel({ namn: "vevor-1", rader: [{ ...VAFFEL, kort: "00000000" }] })).toMatch(/pid börjar inte med kort/);
    expect(fel({ namn: "vevor-1", rader: [{ ...VAFFEL, pid: "inte-ett-uuid" }] })).toMatch(/uuid/);
    expect(fel({ namn: "vevor-1", rader: [VAFFEL, VAFFEL] })).toMatch(/förekommer två gånger/);
  });

  it("☠️ kräver att planen säger vad som ska ligga kvar, och att det inte överlappar", () => {
    expect(fel({ namn: "vevor-1", rader: [{ ...VAFFEL, behall: [] }] })).toMatch(/behall ska vara 1–8/);
    expect(fel({ namn: "vevor-1", rader: [{ ...VAFFEL, bort: [] }] })).toMatch(/bort ska vara 1–6/);
    expect(fel({ namn: "vevor-1", rader: [{ ...VAFFEL, bort: ["Kök & Husgeråd"] }] })).toMatch(/både i bort och behall/);
    expect(fel({ namn: "vevor-1", rader: [{ ...VAFFEL, bort: ["A > B", "A > B"] }] })).toMatch(/samma sökväg två gånger/);
  });

  it("vägrar en sökväg med blanksteg i kanten eller artikelnummerform", () => {
    expect(fel({ namn: "vevor-1", rader: [{ ...VAFFEL, bort: [" Kök & Husgeråd"] }] })).toMatch(/blanksteg/);
    const v = fel({ namn: "vevor-1", rader: [{ ...VAFFEL, bort: ["Kat ABC-12345"] }] });
    expect(v).toMatch(/artikelnummerform/);
    // Felet namnger fältet, aldrig träffen: svaret går till en publik logg.
    expect(v).not.toMatch(/ABC-12345/);
  });
});
