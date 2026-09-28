import { describe, expect, it } from "vitest";
import {
  BekraftaFel,
  KATALOG_TOLERANS,
  MAX_OBEKRAFTADE_I_FOLJD,
  MIN_KATALOG,
  UnderlagFel,
  lasUnderlag,
  malSlug,
  markeradRad,
  planera,
  radera,
  stampla,
  type KorDeps,
  type Underlag,
  type UnderlagIo,
} from "./pensionerade";
import { MAX_OMDIRIGERINGAR } from "./sammanslagning";
import type { ProductMappingRecord } from "../store";
import type { KatalogProdukt } from "../wix/media-audit";
import type { ProduktForRadering } from "../wix/v3-products";
import { isAliExpressMapping } from "../store/supplier";

// Syntetiska artiklar — aldrig riktiga nummer i ett publikt repo.
const NU = new Date("2026-10-20T12:00:00.000Z");
const DAG = 86_400_000;
const dagarSedan = (d: number) => new Date(NU.getTime() - d * DAG).toISOString();

function rad(id: string, over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    wixProductId: id,
    supplier: "aosom",
    supplierProductId: `aosom:SYNT-${id}`,
    draftStatus: "rejected",
    needsAiPolish: false,
    reviewedAt: dagarSedan(30),
    variants: [
      { supplierVariantId: `SYNT-${id}`, sku: `FP-utkast-${id}`, wixVariantId: `v-${id}`, choices: {}, costUsd: 1, landedCostSek: 10, grossSek: 20 },
    ],
    ...over,
  } as ProductMappingRecord;
}

function produkt(id: string, over: Partial<KatalogProdukt> = {}): KatalogProdukt {
  return { id, visible: false, slug: `slug-${id}`, nycklar: [`${id}-1~mv2.jpg`, `${id}-2~mv2.jpg`], ...over };
}

function underlag(over: Partial<Underlag> = {}): Underlag {
  return {
    mappningar: [],
    katalog: [],
    kategoribilder: [],
    ordrar: [],
    auktioner: [],
    omdirigeringar: [],
    omdirigeringarFullstandiga: true,
    nu: NU,
    ...over,
  };
}

describe("planera — vad får raderas", () => {
  it("en gammal pensionerad Aosom-rad med dold produkt är raderbar", () => {
    const p = planera(underlag({ mappningar: [rad("a")], katalog: [produkt("a")] }));
    expect(p.pensionerade).toBe(1);
    expect(p.raderbara.map((r) => r.wixProductId)).toEqual(["a"]);
    expect(p.bilder).toEqual({ totalt: 2, delade: 0 });
  });

  it("AliExpress-rader, levande rader och redan raderade räknas inte alls", () => {
    const p = planera(underlag({
      mappningar: [
        rad("ae", { supplier: "aliexpress", supplierProductId: "1005000000000001" }),
        rad("levande", { draftStatus: "published" }),
        rad("utkast", { draftStatus: "pending_review" }),
        rad("borta", { supplierProductId: "", wixRaderad: { at: dagarSedan(1) } }),
      ],
      katalog: [produkt("ae"), produkt("levande"), produkt("utkast")],
    }));
    expect(p.pensionerade).toBe(0);
    expect(p.raderbara).toEqual([]);
  });

  it("☠️ utan tidsstämpel raderas ingenting — raden hamnar i stampla-listan", () => {
    const p = planera(underlag({ mappningar: [rad("a", { reviewedAt: undefined })], katalog: [produkt("a")] }));
    expect(p.raderbara).toEqual([]);
    expect(p.hinder.utanTidsstampel).toBe(1);
    expect(p.utanTidsstampel).toEqual(["a"]);
  });

  it("en oläsbar tidsstämpel behandlas som ingen", () => {
    const p = planera(underlag({ mappningar: [rad("a", { reviewedAt: "i går" })], katalog: [produkt("a")] }));
    expect(p.hinder.utanTidsstampel).toBe(1);
  });

  it("☠️ för ung: fjorton dagar, och planen säger när den blir raderbar", () => {
    const p = planera(underlag({
      mappningar: [rad("ung", { reviewedAt: dagarSedan(3) }), rad("gransen", { reviewedAt: dagarSedan(14) })],
      katalog: [produkt("ung"), produkt("gransen")],
    }));
    expect(p.hinder.forUng).toBe(1);
    expect(p.raderbara.map((r) => r.wixProductId)).toEqual(["gransen"]);
    expect(p.nastaRaderbar).toBe(new Date(NU.getTime() + 11 * DAG).toISOString());
  });

  it("☠️ rejected betyder inte dold — en synlig produkt raderas aldrig", () => {
    const p = planera(underlag({ mappningar: [rad("a")], katalog: [produkt("a", { visible: true })] }));
    expect(p.raderbara).toEqual([]);
    expect(p.hinder.synlig).toBe(1);
  });

  it("en produkt någon har köpt raderas inte", () => {
    const p = planera(underlag({
      mappningar: [rad("a")],
      katalog: [produkt("a")],
      ordrar: [{ wixCatalogItemId: "a", sku: "FP-annat" }],
    }));
    expect(p.hinder.harOrdrar).toBe(1);
    expect(p.raderbara).toEqual([]);
  });

  it("en produkt i en köad eller pågående auktion raderas inte", () => {
    const p = planera(underlag({ mappningar: [rad("a")], katalog: [produkt("a")], auktioner: [{ productId: "a" }] }));
    expect(p.hinder.iAuktion).toBe(1);
  });

  it("☠️ en omdirigering som pekar HIT hade blivit en 301 till en 404", () => {
    const p = planera(underlag({
      mappningar: [rad("a"), rad("b")],
      katalog: [produkt("a", { slug: "Gammal-Sida" }), produkt("b")],
      omdirigeringar: [{ toPath: "/produkt/gammal-sida?utm=x" }, { toPath: "/kategori/slug-b" }],
    }));
    expect(p.hinder.omdirigeringsmal).toBe(1);
    expect(p.raderbara.map((r) => r.wixProductId)).toEqual(["b"]);
  });

  it("en rad vars produkt inte finns i svepet listas för bokföring, inte för radering", () => {
    const p = planera(underlag({ mappningar: [rad("a")], katalog: [produkt("x")] }));
    expect(p.saknasIWix).toEqual(["a"]);
    expect(p.raderbara).toEqual([]);
  });

  it("räknar filer som en annan produkt eller en kategori delar — de ligger kvar", () => {
    const p = planera(underlag({
      mappningar: [rad("givare")],
      katalog: [
        produkt("givare", { nycklar: ["farg~mv2.jpg", "egen~mv2.jpg", "kat~mv2.jpg"] }),
        produkt("sidan", { visible: true, nycklar: ["farg~mv2.jpg", "sidan~mv2.jpg"] }),
      ],
      kategoribilder: ["https://static.wixstatic.com/media/kat~mv2.jpg"],
    }));
    expect(p.raderbara[0]).toMatchObject({ wixProductId: "givare", bilder: 3, delade: 2 });
  });

  it("☠️ produkter utan delade filer först — de mäter att en radering lämnar filerna", () => {
    const p = planera(underlag({
      mappningar: [rad("givare", { reviewedAt: dagarSedan(60) }), rad("egen", { reviewedAt: dagarSedan(20) })],
      katalog: [
        produkt("givare", { nycklar: ["farg~mv2.jpg", "givare~mv2.jpg"] }),
        produkt("sidan", { visible: true, nycklar: ["farg~mv2.jpg"] }),
        produkt("egen"),
      ],
    }));
    expect(p.raderbara.map((r) => r.wixProductId)).toEqual(["egen", "givare"]);
  });

  it("äldst pensionering först, sedan id", () => {
    const p = planera(underlag({
      mappningar: [rad("c", { reviewedAt: dagarSedan(20) }), rad("b", { reviewedAt: dagarSedan(40) }), rad("a", { reviewedAt: dagarSedan(20) })],
      katalog: [produkt("a"), produkt("b"), produkt("c")],
    }));
    expect(p.raderbara.map((r) => r.wixProductId)).toEqual(["b", "a", "c"]);
  });

  it("☠️ planen bär aldrig artikelnummer eller slug — den hamnar i en publik logg", () => {
    const p = planera(underlag({ mappningar: [rad("a"), rad("b", { reviewedAt: undefined })], katalog: [produkt("a"), produkt("b")] }));
    const json = JSON.stringify(p);
    expect(json).not.toContain("SYNT-");
    expect(json).not.toContain("slug-");
  });
});

describe("malSlug", () => {
  it("läser produktslugen ur en intern sökväg, annars null", () => {
    expect(malSlug("/produkt/En-Sida/")).toBe("en-sida");
    expect(malSlug("/produkt/en-sida#x")).toBe("en-sida");
    expect(malSlug("/kategori/soffor")).toBeNull();
    expect(malSlug("")).toBeNull();
  });
});

describe("markeradRad", () => {
  it("☠️ tömmer artikeln, flyttar den till importSparr och fryser leverantören", () => {
    const ny = markeradRad(rad("a", { supplier: undefined }), NU, "slug-a");
    expect(ny.supplierProductId).toBe("");
    expect(ny.importSparr).toBe("aosom:SYNT-a");
    expect(ny.supplier).toBe("aosom");
    expect(isAliExpressMapping(ny)).toBe(false);
    expect(ny.needsAiPolish).toBe(false);
    expect(ny.wixRaderad).toEqual({ at: NU.toISOString(), slug: "slug-a" });
    // Historiken rörs inte.
    expect(ny.variants).toEqual(rad("a").variants);
    expect(ny.draftStatus).toBe("rejected");
  });

  it("en givare som redan tömts behåller sin gamla spärr och får ingen tom", () => {
    const ny = markeradRad(rad("a", { supplierProductId: "", importSparr: "aosom:SYNT-gammal" }), NU);
    expect(ny.importSparr).toBe("aosom:SYNT-gammal");
    const tom = markeradRad(rad("b", { supplierProductId: "" }), NU);
    expect(tom.importSparr).toBeUndefined();
  });
});

function io(over: Partial<UnderlagIo> = {}): UnderlagIo {
  const katalog = Array.from({ length: MIN_KATALOG }, (_, i) => produkt(`p${i}`));
  return {
    listMappings: async () => [],
    lasKatalog: async () => ({ produkter: katalog, complete: true }),
    raknaProdukter: async () => MIN_KATALOG,
    listaKategoribilder: async () => [],
    listTasks: async () => [],
    listAktivaAuktioner: async () => [],
    listOmdirigeringar: async () => [],
    now: () => NU.getTime(),
    ...over,
  };
}

describe("lasUnderlag — ett underlag som kan ha tappat något vägras", () => {
  it("ett komplett svep går igenom", async () => {
    const u = await lasUnderlag(io());
    expect(u.katalog).toHaveLength(MIN_KATALOG);
    expect(u.omdirigeringarFullstandiga).toBe(true);
  });

  it("☠️ ett svep som stannade fäller — även när det hann se en hel butiks antal", async () => {
    const full = Array.from({ length: MIN_KATALOG + 10 }, (_, i) => produkt(`p${i}`));
    await expect(lasUnderlag(io({ lasKatalog: async () => ({ produkter: full, complete: false }) })))
      .rejects.toThrow(/blev inte klart/);
  });

  it("☠️ ett för litet svep är ett läsfel, inte butiken", async () => {
    await expect(lasUnderlag(io({
      lasKatalog: async () => ({ produkter: [produkt("a")], complete: true }),
      raknaProdukter: async () => 1,
    }))).rejects.toThrow(/läsfel/);
  });

  it("☠️ färre produkter än butikens räknare fäller — utom en import medan svepet gick", async () => {
    await expect(lasUnderlag(io({ raknaProdukter: async () => MIN_KATALOG + KATALOG_TOLERANS + 1 })))
      .rejects.toThrow(/tappat sidor/);
    await expect(lasUnderlag(io({ raknaProdukter: async () => MIN_KATALOG + KATALOG_TOLERANS })))
      .resolves.toBeTruthy();
  });

  it("ett läsfel mot kategorierna tystas inte", async () => {
    await expect(lasUnderlag(io({ listaKategoribilder: async () => { throw new Error("503"); } })))
      .rejects.toThrow("503");
  });

  it("en omdirigeringslista som nått taket är ofullständig", async () => {
    const full = Array.from({ length: MAX_OMDIRIGERINGAR }, () => ({ toPath: "/produkt/x" }));
    const u = await lasUnderlag(io({ listOmdirigeringar: async () => full }));
    expect(u.omdirigeringarFullstandiga).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Skarpa körningar mot en falsk butik och en falsk Wix
// ---------------------------------------------------------------------------

interface Varld {
  rader: Map<string, ProductMappingRecord>;
  wix: Map<string, { visible: boolean; slug: string; skus: string[]; nycklar: string[] }>;
  /** Filer som raderas tillsammans med produkten (för att pröva kanariefågeln). */
  filerSomForsvinner: Set<string>;
  borttagnaFiler: Set<string>;
  raderingar: string[];
  /** Produkter som fortsätter synas efter radering. */
  seg: Set<string>;
}

function varld(rader: ProductMappingRecord[], produkter: KatalogProdukt[]): Varld {
  return {
    rader: new Map(rader.map((r) => [r.wixProductId, structuredClone(r)])),
    wix: new Map(produkter.map((p) => [p.id, { visible: p.visible, slug: p.slug, skus: [`FP-utkast-${p.id}`], nycklar: p.nycklar }])),
    filerSomForsvinner: new Set(),
    borttagnaFiler: new Set(),
    raderingar: [],
    seg: new Set(),
  };
}

function deps(v: Varld, over: Partial<KorDeps> = {}): KorDeps {
  let klocka = NU.getTime();
  return {
    getMapping: async (id) => (v.rader.has(id) ? structuredClone(v.rader.get(id)!) : null),
    saveMapping: async (m) => { v.rader.set(m.wixProductId, structuredClone(m)); },
    lasProdukt: async (id): Promise<ProduktForRadering | null> => {
      const p = v.wix.get(id);
      return p ? { finns: true, ...p } : { finns: false };
    },
    raderaProdukt: async (id) => {
      v.raderingar.push(id);
      const p = v.wix.get(id);
      for (const k of p?.nycklar ?? []) if (v.filerSomForsvinner.has(k)) v.borttagnaFiler.add(k);
      if (!v.seg.has(id)) v.wix.delete(id);
      return "raderad";
    },
    produktFinns: async (id) => v.wix.has(id),
    filstatus: async (nycklar) => new Map(nycklar.filter((k) => !v.borttagnaFiler.has(k)).map((k) => [k, "OK"])),
    paus: async () => {},
    now: () => (klocka += 10),
    ...over,
  };
}

function korPlan(v: Varld, over: Partial<Underlag> = {}) {
  const u = underlag({
    mappningar: [...v.rader.values()],
    katalog: [...v.wix.entries()].map(([id, p]) => ({ id, visible: p.visible, slug: p.slug, nycklar: p.nycklar })),
    ...over,
  });
  return { u, plan: planera(u) };
}

describe("radera — skarpt", () => {
  it("☠️ fel bekrafta: ingenting raderas", async () => {
    const v = varld([rad("a")], [produkt("a")]);
    const { u, plan } = korPlan(v);
    await expect(radera(deps(v), u, plan, { bekrafta: "2" })).rejects.toBeInstanceOf(BekraftaFel);
    expect(v.raderingar).toEqual([]);
  });

  it("☠️ hogst: planen får krympa mellan varven men aldrig växa", async () => {
    const v = varld([rad("a"), rad("b")], [produkt("a"), produkt("b")]);
    const { u, plan } = korPlan(v);
    await expect(radera(deps(v), u, plan, { hogst: 1 })).rejects.toThrow(/fler än de 1 som återstod/);
    expect(v.raderingar).toEqual([]);
    const r = await radera(deps(v), u, plan, { hogst: 3, limit: 1 });
    expect(r.raderade).toEqual(["a"]);
  });

  it("☠️ hogst och bekrafta samtidigt, eller ett tak som inte är ett heltal, vägras", async () => {
    const v = varld([rad("a")], [produkt("a")]);
    const { u, plan } = korPlan(v);
    await expect(radera(deps(v), u, plan, { bekrafta: "1", hogst: 1 })).rejects.toBeInstanceOf(BekraftaFel);
    await expect(radera(deps(v), u, plan, { hogst: 1.5 })).rejects.toBeInstanceOf(BekraftaFel);
    await expect(radera(deps(v), u, plan, { hogst: -1 })).rejects.toBeInstanceOf(BekraftaFel);
    await expect(radera(deps(v), u, plan, {})).rejects.toBeInstanceOf(BekraftaFel);
    expect(v.raderingar).toEqual([]);
  });

  it("☠️ en ofullständig omdirigeringslista vägras", async () => {
    const v = varld([rad("a")], [produkt("a")]);
    const { u, plan } = korPlan(v, { omdirigeringarFullstandiga: false });
    await expect(radera(deps(v), u, plan, { bekrafta: "1" })).rejects.toBeInstanceOf(BekraftaFel);
    expect(v.raderingar).toEqual([]);
  });

  it("raderar, bekräftar, märker raden och läser tillbaka — äldst först, exakt limit", async () => {
    const v = varld(
      [rad("a", { reviewedAt: dagarSedan(40) }), rad("b", { reviewedAt: dagarSedan(30) }), rad("c", { reviewedAt: dagarSedan(20) })],
      [produkt("a"), produkt("b"), produkt("c")],
    );
    const { u, plan } = korPlan(v);
    const r = await radera(deps(v), u, plan, { bekrafta: "3", limit: 2 });
    expect(r.raderade).toEqual(["a", "b"]);
    expect(r.stoppadAv).toBe("limit");
    expect(v.raderingar).toEqual(["a", "b"]);
    const a = v.rader.get("a")!;
    expect(a.wixRaderad?.slug).toBe("slug-a");
    expect(a.supplierProductId).toBe("");
    expect(a.importSparr).toBe("aosom:SYNT-a");
    expect(v.rader.get("c")!.wixRaderad).toBeUndefined();
  });

  it("☠️ en produkt som blivit synlig sedan planen rörs inte", async () => {
    const v = varld([rad("a")], [produkt("a")]);
    const { u, plan } = korPlan(v);
    v.wix.get("a")!.visible = true;
    const r = await radera(deps(v), u, plan, { bekrafta: "1" });
    expect(r.raderade).toEqual([]);
    expect(r.hoppadeVidKontroll).toEqual({ synlig: 1 });
    expect(v.raderingar).toEqual([]);
  });

  it("☠️ en rad som publicerats sedan planen rörs inte", async () => {
    const v = varld([rad("a")], [produkt("a")]);
    const { u, plan } = korPlan(v);
    v.rader.set("a", { ...v.rader.get("a")!, draftStatus: "published" });
    const r = await radera(deps(v), u, plan, { bekrafta: "1" });
    expect(r.hoppadeVidKontroll).toEqual({ raden_andrad: 1 });
    expect(v.raderingar).toEqual([]);
  });

  it("☠️ en order på produktens SKU stoppar raderingen, även utan produkt-id på ordern", async () => {
    const v = varld([rad("a")], [produkt("a")]);
    const { u, plan } = korPlan(v, { ordrar: [{ sku: "FP-utkast-a" }] });
    const r = await radera(deps(v), u, plan, { bekrafta: "1" });
    expect(r.hoppadeVidKontroll).toEqual({ har_ordrar: 1 });
    expect(v.raderingar).toEqual([]);
  });

  it("en produkt som redan saknas märks utan radering", async () => {
    const v = varld([rad("a")], [produkt("a")]);
    const { u, plan } = korPlan(v);
    v.wix.delete("a");
    const r = await radera(deps(v), u, plan, { bekrafta: "1" });
    expect(r.markeradeUtanRadering).toEqual(["a"]);
    expect(v.raderingar).toEqual([]);
    expect(v.rader.get("a")!.wixRaderad).toBeTruthy();
  });

  it("saknas i svepet: märks bara efter en läsning som säger 404", async () => {
    const v = varld([rad("borta"), rad("finns")], [produkt("finns")]);
    const { u, plan } = korPlan(v);
    // Svepet missade "finns" — läsningen före märkningen ser den.
    const u2 = { ...u, katalog: [] };
    const plan2 = planera(u2);
    expect(plan2.saknasIWix.sort()).toEqual(["borta", "finns"]);
    const r = await radera(deps(v), u2, plan2, { bekrafta: "0" });
    expect(r.markeradeUtanRadering).toEqual(["borta"]);
    expect(r.hoppadeVidKontroll).toEqual({ finns_i_wix: 1 });
    expect(v.rader.get("finns")!.wixRaderad).toBeUndefined();
    expect(plan.raderbara).toHaveLength(1);
  });

  it("☠️ ett raderingsfel stoppar körningen — nästa produkt rörs inte", async () => {
    const v = varld([rad("a", { reviewedAt: dagarSedan(40) }), rad("b")], [produkt("a"), produkt("b")]);
    const { u, plan } = korPlan(v);
    const r = await radera(deps(v, { raderaProdukt: async () => { throw new Error("403"); } }), u, plan, { bekrafta: "2" });
    expect(r.stoppadAv).toBe("raderingsfel");
    expect(r.raderade).toEqual([]);
    expect(v.rader.get("a")!.wixRaderad).toBeUndefined();
  });

  it("☠️ en radering som inte syns märks inte, och tre i följd stoppar", async () => {
    const ids = ["a", "b", "c", "d"];
    const v = varld(ids.map((id) => rad(id)), ids.map((id) => produkt(id)));
    for (const id of ids) v.seg.add(id);
    const { u, plan } = korPlan(v);
    const r = await radera(deps(v), u, plan, { bekrafta: "4" });
    expect(r.obekraftade).toHaveLength(MAX_OBEKRAFTADE_I_FOLJD);
    expect(r.stoppadAv).toBe("obekraftade");
    expect(v.raderingar).toHaveLength(MAX_OBEKRAFTADE_I_FOLJD);
    for (const id of ids) expect(v.rader.get(id)!.wixRaderad).toBeUndefined();
  });

  it("☠️ KANARIEFÅGELN: försvinner en delad fil stoppas allt efter den produkten", async () => {
    const v = varld(
      [rad("egen", { reviewedAt: dagarSedan(20) }), rad("givare", { reviewedAt: dagarSedan(40) }), rad("givare2", { reviewedAt: dagarSedan(30) })],
      [
        produkt("egen"),
        produkt("givare", { nycklar: ["farg~mv2.jpg", "givare~mv2.jpg"] }),
        produkt("givare2", { nycklar: ["farg2~mv2.jpg"] }),
        produkt("sidan", { visible: true, nycklar: ["farg~mv2.jpg", "farg2~mv2.jpg"] }),
      ],
    );
    v.filerSomForsvinner.add("farg~mv2.jpg");
    const { u, plan } = korPlan(v);
    const r = await radera(deps(v), u, plan, { bekrafta: "3" });
    expect(r.stoppadAv).toBe("filkontroll");
    expect(r.fel).toMatch(/1 av 2 filer låg inte kvar efter raderingen av givare, varav 1 delade/);
    expect(r.raderade).toEqual(["egen", "givare"]);
    // Produkten ÄR borta, så raden märks — men nästa rörs inte.
    expect(v.rader.get("givare")!.wixRaderad).toBeTruthy();
    expect(v.raderingar).toEqual(["egen", "givare"]);
  });

  it("☠️ försvinner produktens EGNA filer stoppas också allt — antagandet håller inte", async () => {
    const v = varld([rad("a", { reviewedAt: dagarSedan(40) }), rad("b")], [produkt("a"), produkt("b")]);
    v.filerSomForsvinner.add("a-1~mv2.jpg");
    const { u, plan } = korPlan(v);
    const r = await radera(deps(v), u, plan, { bekrafta: "2" });
    expect(r.stoppadAv).toBe("filkontroll");
    expect(r.fel).toMatch(/1 av 2 filer låg inte kvar efter raderingen av a, varav 0 delade/);
    expect(v.raderingar).toEqual(["a"]);
  });

  it("en fil som redan var borta före raderingen stoppar ingenting", async () => {
    const v = varld([rad("a"), rad("b")], [produkt("a"), produkt("b")]);
    v.borttagnaFiler.add("a-1~mv2.jpg");
    const { u, plan } = korPlan(v);
    const r = await radera(deps(v), u, plan, { bekrafta: "2" });
    expect(r.stoppadAv).toBe("klart");
    expect(r.raderade).toEqual(["a", "b"]);
  });

  it("☠️ går filerna inte att läsa efter raderingen stoppas allt", async () => {
    const v = varld(
      [rad("givare", { reviewedAt: dagarSedan(40) }), rad("nasta")],
      [produkt("givare", { nycklar: ["farg~mv2.jpg"] }), produkt("sidan", { visible: true, nycklar: ["farg~mv2.jpg"] }), produkt("nasta")],
    );
    const { u, plan } = korPlan(v);
    const d = deps(v);
    let anrop = 0;
    const r = await radera({
      ...d,
      filstatus: async (k) => {
        anrop++;
        if (anrop > 3) throw new Error("get-files failed (500)");
        return d.filstatus(k);
      },
    }, u, plan, { bekrafta: "2" });
    // nasta (utan delade filer) först: läst före och efter. Sedan givare: läst före, efter kastar.
    expect(r.stoppadAv).toBe("filkontroll");
    expect(r.fel).toMatch(/gick inte att läsa efter raderingen av givare/);
    expect(v.raderingar).toEqual(["nasta", "givare"]);
  });

  it("☠️ går filerna inte att läsa FÖRE raderingen rörs produkten inte", async () => {
    const v = varld([rad("a")], [produkt("a")]);
    const { u, plan } = korPlan(v);
    const r = await radera(deps(v, { filstatus: async () => { throw new Error("get-files failed (500)"); } }), u, plan, { bekrafta: "1" });
    expect(r.hoppadeVidKontroll).toEqual({ lasfel_filer: 1 });
    expect(v.raderingar).toEqual([]);
  });

  it("☠️ har produkten filer men ingen går att läsa rörs den inte", async () => {
    const v = varld([rad("a")], [produkt("a")]);
    const { u, plan } = korPlan(v);
    const r = await radera(deps(v, { filstatus: async () => new Map() }), u, plan, { bekrafta: "1" });
    expect(r.hoppadeVidKontroll).toEqual({ filer_okanda: 1 });
    expect(v.raderingar).toEqual([]);
  });

  it("en produkt utan filer frågar inte efter filstatus; en med filer läser dem före och efter", async () => {
    const v = varld([rad("tom", { reviewedAt: dagarSedan(40) }), rad("a")], [produkt("tom", { nycklar: [] }), produkt("a")]);
    const { u, plan } = korPlan(v);
    const d = deps(v);
    const fragor: string[][] = [];
    const r = await radera({ ...d, filstatus: async (k) => { fragor.push(k); return d.filstatus(k); } }, u, plan, { bekrafta: "2" });
    expect(r.raderade).toEqual(["tom", "a"]);
    expect(fragor).toEqual([["a-1~mv2.jpg", "a-2~mv2.jpg"], ["a-1~mv2.jpg", "a-2~mv2.jpg"]]);
  });

  it("en märkning som inte läser tillbaka räknas — produkten är ändå raderad", async () => {
    const v = varld([rad("a"), rad("b")], [produkt("a"), produkt("b")]);
    const { u, plan } = korPlan(v);
    const d = deps(v);
    const r = await radera({ ...d, saveMapping: async () => {} }, u, plan, { bekrafta: "2" });
    expect(r.raderade).toEqual(["a", "b"]);
    expect(r.markeringsfel).toEqual(["a", "b"]);
  });

  it("☠️ en skrivning som kastar efter raderingen stoppar körningen", async () => {
    const v = varld([rad("a", { reviewedAt: dagarSedan(40) }), rad("b")], [produkt("a"), produkt("b")]);
    const { u, plan } = korPlan(v);
    const r = await radera(deps(v, { saveMapping: async () => { throw new Error("Postgres nere"); } }), u, plan, { bekrafta: "2" });
    expect(r.stoppadAv).toBe("markeringsfel");
    expect(r.raderade).toEqual(["a"]);
    expect(v.raderingar).toEqual(["a"]);
  });

  it("☠️ en kontroll som kastar före raderingen stoppar utan att radera", async () => {
    const v = varld([rad("a")], [produkt("a")]);
    const { u, plan } = korPlan(v);
    const r = await radera(deps(v, { getMapping: async () => { throw new Error("Postgres nere"); } }), u, plan, { bekrafta: "1" });
    expect(r.stoppadAv).toBe("ovantat_fel");
    expect(v.raderingar).toEqual([]);
  });

  it("tidsbudgeten stoppar före nästa produkt", async () => {
    const v = varld([rad("a"), rad("b")], [produkt("a"), produkt("b")]);
    const { u, plan } = korPlan(v);
    const r = await radera(deps(v), u, plan, { bekrafta: "2", timeBudgetMs: 0 });
    expect(r.stoppadAv).toBe("tidsbudget");
    expect(v.raderingar).toEqual([]);
  });
});

describe("stampla", () => {
  it("☠️ fel bekrafta: ingenting skrivs", async () => {
    const v = varld([rad("a", { reviewedAt: undefined })], [produkt("a")]);
    const { plan } = korPlan(v);
    await expect(stampla(deps(v), plan, { bekrafta: "5" })).rejects.toBeInstanceOf(BekraftaFel);
    expect(v.rader.get("a")!.reviewedAt).toBeUndefined();
  });

  it("startar klockan och läser tillbaka — en rad som fått en tid emellan rörs inte", async () => {
    const v = varld([rad("a", { reviewedAt: undefined }), rad("b", { reviewedAt: undefined })], [produkt("a"), produkt("b")]);
    const { plan } = korPlan(v);
    v.rader.set("b", { ...v.rader.get("b")!, reviewedAt: dagarSedan(2) });
    const r = await stampla(deps(v), plan, { bekrafta: "2" });
    expect(r).toEqual({ stamplade: 1, hoppade: 1, skrivfel: 0 });
    expect(v.rader.get("a")!.reviewedAt).toBeTruthy();
    expect(v.rader.get("b")!.reviewedAt).toBe(dagarSedan(2));
  });
});
