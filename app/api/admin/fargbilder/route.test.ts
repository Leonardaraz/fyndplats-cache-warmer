// Admin-rutten för färgbilderna: auth, parametrarna, sha-kvitteringen och
// tillat_ur_galleriet. Wix, katalogsvepet och auktionerna är låtsade; planen
// och skrivningen är de riktiga.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { Bild, SidOption } from "@/lib/aosom/fargbilder";

type Obj = Record<string, unknown>;

interface Fixtur {
  sida: { id: string; namn: string; bilder: Bild[]; optioner: SidOption[] };
  givare: { id: string; namn: string; bilder: Bild[] }[];
}
const fixtur = (namn: string): Fixtur =>
  JSON.parse(readFileSync(join(__dirname, "../../../../lib/aosom/fargbilder-fixtures", `${namn}.json`), "utf-8"));

const varld = vi.hoisted(() => ({
  produkter: {} as Record<string, Record<string, unknown>>,
  patchar: [] as string[][],
  lager: null as unknown,
  /** Så många länkskrivningar till svarar 500. */
  fel500: 0,
}));

function v3(id: string, namn: string, synlig: boolean, bilder: Bild[], optioner: SidOption[]): Obj {
  return {
    id, name: namn, visible: synlig, revision: "1",
    media: { itemsInfo: { items: bilder.map((b) => ({ id: b.id, altText: b.alt })) } },
    options: optioner.map((o) => ({
      name: o.namn,
      choicesSettings: { choices: o.val.map((v) => ({ choiceId: v.id, name: v.namn, linkedMedia: v.lankade.map((m) => ({ id: m })) })) },
    })),
    variantsInfo: { variants: [{ id: "var-1", visible: true, sku: "FP-x", price: { actualPrice: { amount: "699" } } }] },
  };
}

vi.mock("@/lib/polish/skrivplan-wix", () => ({
  skapaWixAnrop: () => async (metod: string, sokvag: string, kropp?: unknown) => {
    const id = decodeURIComponent(sokvag.split("?")[0].split("/").pop()!);
    const p = varld.produkter[id];
    if (!p) throw new Error("Wix 404: finns inte");
    if (metod === "GET") return { product: structuredClone(p) };
    const k = kropp as { product: Record<string, unknown>; fieldMask: { paths: string[] } };
    varld.patchar.push(k.fieldMask.paths);
    if (k.fieldMask.paths.join() === "media") p.media = structuredClone(k.product.media);
    else {
      if (varld.fel500 > 0) {
        varld.fel500--;
        throw new Error("Wix 500: internal error");
      }
      p.options = structuredClone(k.product.options);
      p.variantsInfo = structuredClone(k.product.variantsInfo);
    }
    p.revision = String(Number(p.revision) + 1);
    return { product: structuredClone(p) };
  },
}));

vi.mock("@/lib/wix/media-audit", () => ({
  headlessSiteId: () => "sajt",
  countProducts: async () => Object.keys(varld.produkter).length,
  listCatalogProductMedia: async () => ({
    complete: true,
    produkter: Object.values(varld.produkter).map((p) => {
      const items = ((p.media as { itemsInfo: { items: { id: string }[] } }).itemsInfo.items).map((b) => b.id);
      const val = ((p.options ?? []) as { name: string; choicesSettings: { choices: { choiceId: string; linkedMedia: { id: string }[] }[] } }[])
        .flatMap((o) => o.choicesSettings.choices.map((c) => ({ axel: o.name, id: c.choiceId, forsta: c.linkedMedia[0]?.id ?? null })));
      return { id: p.id as string, visible: p.visible === true, slug: "", nycklar: items, val };
    }),
  }),
}));

vi.mock("@/lib/auction/store", () => ({ queryAuctions: async () => [] }));
vi.mock("@/lib/audit", () => ({ audit: async () => {} }));
vi.mock("@/lib/store/fargbilder", async () => {
  const { MinnesFargbildLager } = await vi.importActual<typeof import("@/lib/store/fargbilder")>("@/lib/store/fargbilder");
  return { getFargbildLager: () => (varld.lager ??= new MinnesFargbildLager()) };
});

import { GET } from "./route";

const HEMLIGT = "test-hemlighet";
const anrop = (q: string, auth = true) =>
  GET(new NextRequest(`https://motor.test/api/admin/fargbilder?${q}`, {
    headers: auth ? { authorization: `Bearer ${HEMLIGT}` } : {},
  }));

function laddaVarld(namn: string) {
  const f = fixtur(namn);
  varld.produkter = {};
  // Katalogsvepet vägrar under 500 produkter — fyll på med vanliga sidor.
  for (let i = 0; i < 500; i++) {
    const id = `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
    varld.produkter[id] = v3(id, `Produkt ${i}`, true, [{ id: `fyll-${i}`, alt: "Produkt" }], []);
  }
  varld.produkter[f.sida.id] = v3(f.sida.id, f.sida.namn, true, f.sida.bilder, f.sida.optioner);
  for (const g of f.givare) varld.produkter[g.id] = v3(g.id, g.namn, false, g.bilder, []);
  return f;
}

beforeEach(() => {
  process.env.CRON_SECRET = HEMLIGT;
  varld.patchar = [];
  varld.lager = null;
  varld.fel500 = 0;
});

describe("/api/admin/fargbilder", () => {
  it("401 utan CRON_SECRET eller token", async () => {
    laddaVarld("matskap");
    expect((await anrop("lage=plan", false)).status).toBe(401);
  });

  it("plan: räknar fram planen, skriver ingenting, svaret bär bara id och räknare", async () => {
    const f = laddaVarld("matskap");
    const res = await anrop("lage=plan");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kandidaterTotalt).toBe(1);
    expect(body.sidor.map((s: { id: string }) => s.id)).toEqual([f.sida.id]);
    expect(body.sha).toMatch(/^[0-9a-f]{64}$/);
    expect(varld.patchar).toEqual([]);
    const text = JSON.stringify(body);
    expect(text).not.toContain(f.sida.namn.slice(0, 10));
    expect(text).not.toMatch(/b379ce_/);
  });

  it("☠️ skriv med en sha som inte stämmer svarar 409 och skriver ingenting", async () => {
    laddaVarld("matskap");
    const res = await anrop(`lage=skriv&bekrafta=${"0".repeat(64)}`);
    expect(res.status).toBe(409);
    expect(varld.patchar).toEqual([]);
  });

  it("skriv med planens sha skriver sidan", async () => {
    laddaVarld("matskap");
    const plan = await (await anrop("lage=plan")).json();
    const res = await anrop(`lage=skriv&bekrafta=${plan.sha}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.skrivna).toBe(1);
    expect(body.stoppadAv).toBe("klart");
    expect(varld.patchar[0]).toEqual(["media"]);
  });

  it("☠️ en sida som faller efter tabellen är halvskriven och väljs igen av hogst — bekräftas först efter lyckad omkörning (N1)", async () => {
    const f = laddaVarld("matskap");
    const plan = await (await anrop("lage=plan")).json();
    varld.fel500 = 1;
    const forsta = await anrop(`lage=skriv&bekrafta=${plan.sha}`);
    expect(forsta.status).toBe(500);
    expect((await forsta.json()).stoppadAv).toBe("avvikelse");

    // Tabellen står, men Wix är obekräftat: sidan räknas inte som skriven.
    const igen = await (await anrop("lage=plan")).json();
    expect(igen.summa.halvskrivna).toBe(1);
    expect(igen.kandidaterTotalt).toBe(1);
    expect(igen.sidor.map((s: { id: string }) => s.id)).toEqual([f.sida.id]);

    const andra = await anrop(`lage=skriv&bekrafta=${igen.sha}`);
    expect(andra.status).toBe(200);
    const lager = varld.lager as { lasSkrivnaVal(): Promise<{ bekraftad: boolean }[]> };
    const val = await lager.lasSkrivnaVal();
    expect(val.length).toBeGreaterThan(0);
    expect(val.every((v) => v.bekraftad)).toBe(true);

    const sist = await (await anrop("lage=plan")).json();
    expect(sist.summa.halvskrivna).toBe(0);
    expect(sist.kandidaterTotalt).toBe(0);
  });

  it("skriv utan bekrafta, fel hogst och sidor ihop med hogst svarar 400", async () => {
    laddaVarld("matskap");
    expect((await anrop("lage=skriv")).status).toBe(400);
    expect((await anrop("hogst=0")).status).toBe(400);
    expect((await anrop("hogst=51")).status).toBe(400);
    expect((await anrop("sidor=inte-ett-id")).status).toBe(400);
    expect((await anrop(`sidor=${"0".repeat(8)}-0000-4000-8000-000000000001&hogst=5`)).status).toBe(400);
    expect((await anrop("lage=radera")).status).toBe(400);
  });

  it("med sidor krävs en givare: en sida utan får ingen_givare", async () => {
    laddaVarld("matskap");
    const utan = "00000000-0000-4000-8000-000000000001";
    varld.produkter[utan] = v3(utan, "Stol", true, [{ id: "a", alt: "Vit" }, { id: "b", alt: "Svart" }], [
      { namn: "Färg", val: [{ id: "v1", namn: "Vit", lankade: ["a"] }, { id: "v2", namn: "Svart", lankade: ["b"] }] },
    ]);
    const body = await (await anrop(`sidor=${utan}`)).json();
    expect(body.sidor[0].hinder).toContain("ingen_givare");
  });

  it("☠️ tillat_ur_galleriet: utan den hindras en sida som skulle flytta ut sidans foton", async () => {
    const f = laddaVarld("pergolatak");
    const utan = await (await anrop(`sidor=${f.sida.id}&ta_med_granskade=ja`)).json();
    expect(utan.sidor[0].hinder).toContain("ur_galleriet_kraver_butiken");
    const med = await (await anrop(`sidor=${f.sida.id}&ta_med_granskade=ja&tillat_ur_galleriet=ja`)).json();
    expect(med.sidor[0].hinder).toEqual([]);
    expect(med.tillatUrGalleriet).toBe(true);
    expect(med.sha).not.toBe(utan.sha);
  });
});
