// Färgbildsverktygets skrivning mot en låtsas-Wix som vägrar det riktiga Wix
// vägrar: en kopplad bild utanför galleriet (404 PRODUCT_MEDIA_NOT_EXIST), fler
// än 15 bilder, och en options-PATCH utan variantsInfo (428).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { doldaPerFil, planeraSida, type Bild, type SidOption, type SidPlan } from "./fargbilder";
import { lasSidaIn, mediaPost, skrivSida, tolkaProdukt } from "./fargbilder-kor";
import { MinnesFargbildLager } from "../store/fargbilder";
import type { WixAnrop } from "../polish/skrivplan";

type Obj = Record<string, unknown>;

interface Fixtur {
  sida: { id: string; namn: string; bilder: Bild[]; optioner: SidOption[] };
  givare: { id: string; namn: string; bilder: Bild[] }[];
}

const fixtur = (namn: string): Fixtur =>
  JSON.parse(readFileSync(join(__dirname, "fargbilder-fixtures", `${namn}.json`), "utf-8"));

function v3(id: string, namn: string, synlig: boolean, bilder: Bild[], optioner: SidOption[]): Obj {
  return {
    id,
    name: namn,
    visible: synlig,
    revision: "1",
    media: { itemsInfo: { items: bilder.map((b) => ({ id: b.id, altText: b.alt })) } },
    options: optioner.map((o) => ({
      name: o.namn,
      optionRenderType: "TEXT_CHOICES",
      choicesSettings: {
        choices: o.val.map((v) => ({ choiceId: v.id, name: v.namn, choiceType: "CHOICE_TEXT", linkedMedia: v.lankade.map((m) => ({ id: m })) })),
      },
    })),
    variantsInfo: { variants: [{ id: "var-1", visible: true, sku: "FP-x-1" }, { id: "var-2", visible: true, sku: "FP-x-2" }] },
  };
}

function fejkWix(f: Fixtur) {
  const produkter: Record<string, Obj> = {
    [f.sida.id]: v3(f.sida.id, f.sida.namn, true, f.sida.bilder, f.sida.optioner),
  };
  for (const g of f.givare) produkter[g.id] = v3(g.id, g.namn, false, g.bilder, []);
  const fel: Record<string, number> = {};
  const patchar: string[][] = [];
  /** Låter Wix "tappa" något i en skrivning, för att se att återläsningen märker det. */
  const sabotage: { altText?: boolean; gamlaLasningar?: number } = {};
  /** Produkten före senaste galleri-PATCH, som en gammal läsning svarar med. */
  const fore: Record<string, Obj> = {};
  const kast = (k: string, msg: string) => {
    if ((fel[k] ?? 0) > 0) {
      fel[k]--;
      throw new Error(msg);
    }
  };
  const lankade = (p: Obj) =>
    ((p.options ?? []) as Obj[]).flatMap((o) =>
      (((o.choicesSettings as Obj).choices ?? []) as Obj[]).flatMap((c) => ((c.linkedMedia ?? []) as Obj[]).map((m) => String(m.id))));
  const galleri = (p: Obj) => (((p.media as Obj).itemsInfo as Obj).items as Obj[]).map((b) => String(b.id));

  const wix: WixAnrop = async (metod, sokvag, kropp) => {
    const id = decodeURIComponent(sokvag.split("?")[0].split("/").pop()!);
    const p = produkter[id];
    if (metod === "GET") {
      if (!p) throw new Error("Wix 404: finns inte");
      if (fore[id] && (sabotage.gamlaLasningar ?? 0) > 0) {
        sabotage.gamlaLasningar!--;
        return { product: structuredClone(fore[id]) };
      }
      return { product: structuredClone(p) };
    }
    if (metod === "PATCH") {
      const k = kropp as { product: Obj; fieldMask: { paths: string[] } };
      patchar.push(k.fieldMask.paths);
      if (k.product.revision !== p.revision) throw new Error("Wix 409: INVALID_REVISION");
      if (k.fieldMask.paths.join() === "media") {
        const items = ((k.product.media as Obj).itemsInfo as Obj).items as Obj[];
        if (items.length > 15) throw new Error("Wix 400: för många bilder");
        const nya = new Set(items.map((b) => String(b.id)));
        if (lankade(p).some((m) => !nya.has(m))) throw new Error("Wix 404: PRODUCT_MEDIA_NOT_EXIST");
        fore[id] = structuredClone(p);
        p.media = { itemsInfo: { items: structuredClone(items).map((b) => (sabotage.altText ? { ...b, altText: "" } : b)) } };
      } else {
        if (!k.fieldMask.paths.includes("variantsInfo") || !k.fieldMask.paths.includes("options")) {
          throw new Error("Wix 428: MISSING_OPTIONS_ON_UPDATE_VARIANTS");
        }
        kast("koppling", "Wix 404: PRODUCT_MEDIA_NOT_EXIST (tas emot)");
        kast("koppling500", "Wix 500: internal error");
        const g = new Set(galleri(p));
        const opts = k.product.options as Obj[];
        const nyaLankar = opts.flatMap((o) =>
          (((o.choicesSettings as Obj).choices ?? []) as Obj[]).flatMap((c) => ((c.linkedMedia ?? []) as Obj[]).map((m) => String(m.id))));
        if (nyaLankar.some((m) => !g.has(m))) throw new Error("Wix 404: PRODUCT_MEDIA_NOT_EXIST");
        p.options = structuredClone(opts);
        p.variantsInfo = structuredClone(k.product.variantsInfo);
        p.visible = k.product.visible;
      }
      p.revision = String(Number(p.revision) + 1);
      return { product: structuredClone(p) };
    }
    throw new Error(`oväntat anrop ${metod} ${sokvag}`);
  };
  return { wix, produkter, fel, patchar, sabotage };
}

function katalogAv(w: ReturnType<typeof fejkWix>) {
  return Object.values(w.produkter).map((p) => {
    const t = tolkaProdukt(p);
    return {
      id: t.id,
      visible: t.synlig,
      nycklar: [...t.bilder.map((b) => b.id), ...t.optioner.flatMap((o) => o.val.flatMap((v) => v.lankade))],
    };
  });
}

async function planFor(
  w: ReturnType<typeof fejkWix>,
  lager: MinnesFargbildLager,
  id: string,
  taMedGranskade = false,
  tillatUrGalleriet = false,
): Promise<SidPlan> {
  const las = await lasSidaIn({ wix: w.wix, lager }, id, doldaPerFil(katalogAv(w)), []);
  return planeraSida(las!.in, { taMedGranskade, tillatUrGalleriet });
}

const lankarPa = (w: ReturnType<typeof fejkWix>, id: string) => {
  const t = tolkaProdukt(w.produkter[id]);
  return Object.fromEntries(t.optioner.find((o) => o.namn === "Färg")!.val.map((v) => [v.namn, v.lankade]));
};

describe("skrivSida", () => {
  it("skriver tabellen FÖRST, sedan galleriet, sedan länkarna, och läser tillbaka", async () => {
    const f = fixtur("pergolatak");
    const w = fejkWix(f);
    const lager = new MinnesFargbildLager();
    const plan = await planFor(w, lager, f.sida.id, true, true);
    expect(plan.hinder).toEqual([]);
    // Tabellen ska stå när Wix rörs första gången.
    let raderVidForstaPatch = -1;
    const wix: typeof w.wix = async (m, v, k) => {
      if (m === "PATCH" && raderVidForstaPatch < 0) raderVidForstaPatch = (await lager.lasForProdukt(f.sida.id)).length;
      return w.wix(m, v, k);
    };

    const u = await skrivSida(plan, { wix, lager, vanta: async () => {} });
    expect(raderVidForstaPatch).toBe(plan.rader.length);
    expect(u.ok).toBe(true);
    // Galleriet ENSAMT först, sedan options + variantsInfo + visible.
    expect(w.patchar[0]).toEqual(["media"]);
    expect(w.patchar[1]).toEqual(["options", "variantsInfo", "visible"]);

    const efter = tolkaProdukt(w.produkter[f.sida.id]);
    expect(efter.bilder).toEqual(plan.galleriEfter);
    // Först efter återläsningen är sidan bekräftad.
    expect((await lager.lasSkrivnaVal()).every((v) => v.bekraftad)).toBe(true);
    expect(efter.bilder).toHaveLength(15);
    for (const v of plan.val) expect(lankarPa(w, f.sida.id)[v.namn]).toEqual(v.lankadeEfter);
    expect(efter.synlig).toBe(true);
    expect(efter.varianter.every((v) => v.synlig)).toBe(true);
    expect(await lager.lasForProdukt(f.sida.id)).toHaveLength(plan.rader.length);
  });

  it("en koppling som faller medan Wix tar emot bilderna försöks om", async () => {
    const f = fixtur("matskap");
    const w = fejkWix(f);
    w.fel.koppling = 3;
    const lager = new MinnesFargbildLager();
    const plan = await planFor(w, lager, f.sida.id);
    const u = await skrivSida(plan, { wix: w.wix, lager, vanta: async () => {} });
    expect(u.ok).toBe(true);
    expect(u.steg.join(" ")).toMatch(/4 försök/);
  });

  it("☠️ en avvikelse som inte gäller länkarna stoppar direkt — inga länkförsök", async () => {
    const f = fixtur("matskap");
    const w = fejkWix(f);
    w.sabotage.altText = true;
    const lager = new MinnesFargbildLager();
    const plan = await planFor(w, lager, f.sida.id);
    const u = await skrivSida(plan, { wix: w.wix, lager, vanta: async () => {} });
    expect(u.ok).toBe(false);
    expect(u.fel).toMatch(/alt-text/);
    expect(w.patchar).toEqual([["media"]]);
    // Tabellen skrevs före Wix, och står kvar.
    expect(await lager.lasForProdukt(f.sida.id)).toHaveLength(plan.rader.length);
  });

  it("en gammal läsning av galleriet direkt efter PATCH:en läses om, och sidan skrivs klart", async () => {
    const f = fixtur("matskap");
    const w = fejkWix(f);
    const lager = new MinnesFargbildLager();
    const plan = await planFor(w, lager, f.sida.id);
    w.sabotage.gamlaLasningar = 2;
    const u = await skrivSida(plan, { wix: w.wix, lager, vanta: async () => {} });
    expect(u.ok).toBe(true);
    expect(u.steg.join(" ")).toMatch(/galleriet omläst 2 gånger/);
    expect(w.patchar).toEqual([["media"], ["options", "variantsInfo", "visible"]]);
    expect(tolkaProdukt(w.produkter[f.sida.id]).bilder.map((b) => b.id)).toEqual(plan.galleriEfter.map((b) => b.id));
  });

  it("☠️ ett galleri som står kvar fel efter omläsningarna stoppar — inga länkförsök", async () => {
    const f = fixtur("matskap");
    const w = fejkWix(f);
    const lager = new MinnesFargbildLager();
    const plan = await planFor(w, lager, f.sida.id);
    w.sabotage.gamlaLasningar = 1000;
    const u = await skrivSida(plan, { wix: w.wix, lager, vanta: async () => {} });
    expect(u.ok).toBe(false);
    expect(u.fel).toMatch(/galleriet är inte det planerade/);
    expect(w.patchar).toEqual([["media"]]);
  });

  it("utan galleri-PATCH läses ett avvikande galleri inte om", async () => {
    const f = fixtur("matskap");
    const w = fejkWix(f);
    const lager = new MinnesFargbildLager();
    const plan = await planFor(w, lager, f.sida.id);
    // Planen säger att galleriet står still, men det avviker: ingen PATCH av
    // galleriet, alltså ingen gammal läsning att vänta ut.
    const utanGalleri = { ...plan, galleriEfter: plan.galleriFore };
    const u = await skrivSida(utanGalleri, { wix: w.wix, lager, vanta: async () => {} });
    expect(u.ok).toBe(false);
    expect(u.steg.join(" ")).not.toMatch(/omläst/);
    expect(w.patchar).not.toContainEqual(["media"]);
  });

  it("☠️ ett fel som inte är 404 PRODUCT_MEDIA_NOT_EXIST eller 409 stoppar efter ett försök, med felet", async () => {
    const f = fixtur("matskap");
    const w = fejkWix(f);
    w.fel.koppling500 = 1000;
    const lager = new MinnesFargbildLager();
    const plan = await planFor(w, lager, f.sida.id);
    const u = await skrivSida(plan, { wix: w.wix, lager, vanta: async () => {} });
    expect(u.ok).toBe(false);
    expect(u.fel).toMatch(/Wix 500/);
    expect(w.patchar.filter((p) => p.includes("options"))).toHaveLength(1);
  });

  it("☠️ ett foto som flyttas ut ur galleriet står i tabellen även när länkningen faller — och omkörningen ser det (B1)", async () => {
    const f = fixtur("pergolatak");
    const w = fejkWix(f);
    const lager = new MinnesFargbildLager();
    const plan = await planFor(w, lager, f.sida.id, true, true);
    const utflyttade = plan.galleriFore.map((b) => b.id).filter((id) => !plan.galleriEfter.some((b) => b.id === id));
    expect(utflyttade).toHaveLength(1);

    w.fel.koppling500 = 1000;
    const forsta = await skrivSida(plan, { wix: w.wix, lager, vanta: async () => {} });
    expect(forsta.ok).toBe(false);
    // Fotot är ute ur Wix galleri — men inte borta.
    expect(tolkaProdukt(w.produkter[f.sida.id]).bilder.map((b) => b.id)).not.toContain(utflyttade[0]);
    const rader = await lager.lasForProdukt(f.sida.id);
    expect(rader.find((r) => r.filId === utflyttade[0])?.plats).toBe("overflow");
    // ☠️ Halvskriven: raderna finns men är inte bekräftade.
    expect((await lager.lasSkrivnaVal()).some((v) => !v.bekraftad)).toBe(true);

    w.fel.koppling500 = 0;
    const igen = await planFor(w, lager, f.sida.id, true, true);
    const agare = igen.val.find((v) => v.overflow.includes(utflyttade[0]));
    expect(agare).toBeTruthy();
    const andra = await skrivSida(igen, { wix: w.wix, lager, vanta: async () => {} });
    expect(andra.ok).toBe(true);
    expect((await lager.lasForProdukt(f.sida.id)).some((r) => r.filId === utflyttade[0])).toBe(true);
  });

  it("faller tabellen rörs Wix inte alls", async () => {
    const f = fixtur("matskap");
    const w = fejkWix(f);
    const lager = new MinnesFargbildLager();
    const plan = await planFor(w, lager, f.sida.id);
    lager.ersattForProdukt = async () => { throw new Error("databasen svarade inte"); };
    const u = await skrivSida(plan, { wix: w.wix, lager, vanta: async () => {} });
    expect(u.ok).toBe(false);
    expect(u.fel).toMatch(/tabellen föll.*Wix rördes INTE/);
    expect(w.patchar).toEqual([]);
  });

  it("läser tabellen inte tillbaka som planen rörs Wix inte alls", async () => {
    const f = fixtur("matskap");
    const w = fejkWix(f);
    const lager = new MinnesFargbildLager();
    const plan = await planFor(w, lager, f.sida.id);
    lager.lasForProdukt = async () => [];
    const u = await skrivSida(plan, { wix: w.wix, lager, vanta: async () => {} });
    expect(u.ok).toBe(false);
    expect(u.fel).toMatch(/läste inte tillbaka.*Wix rördes INTE/);
    expect(w.patchar).toEqual([]);
  });

  it("en sida som ändrats sedan planen rörs inte", async () => {
    const f = fixtur("matskap");
    const w = fejkWix(f);
    const lager = new MinnesFargbildLager();
    const plan = await planFor(w, lager, f.sida.id);
    ((w.produkter[f.sida.id].media as Obj).itemsInfo as { items: Obj[] }).items.pop();
    const u = await skrivSida(plan, { wix: w.wix, lager, vanta: async () => {} });
    expect(u.ok).toBe(false);
    expect(u.fel).toMatch(/ändrats sedan planen/);
    expect(w.patchar).toEqual([]);
  });

  it("☠️ en körning som föll efter galleriet: omkörningen ger samma listor — givarens foton går inte till fel färg", async () => {
    const f = fixtur("pergolatak");
    const w = fejkWix(f);
    const lager = new MinnesFargbildLager();
    const plan = await planFor(w, lager, f.sida.id, true, true);
    w.fel.koppling = 1000;
    const forsta = await skrivSida(plan, { wix: w.wix, lager, vanta: async () => {} });
    expect(forsta.ok).toBe(false);
    // Galleriet är skrivet, länkarna inte. Inga länkade bilder har tappats.
    expect(tolkaProdukt(w.produkter[f.sida.id]).bilder.map((b) => b.id)).toEqual(plan.galleriEfter.map((b) => b.id));
    for (const v of plan.val) expect(lankarPa(w, f.sida.id)[v.namn]).toEqual(v.lankadeFore);

    w.fel.koppling = 0;
    const igen = await planFor(w, lager, f.sida.id, true, true);
    for (const v of plan.val) {
      expect(igen.val.find((x) => x.valId === v.valId)!.lankadeEfter).toEqual(v.lankadeEfter);
    }
    const andra = await skrivSida(igen, { wix: w.wix, lager, vanta: async () => {} });
    expect(andra.ok).toBe(true);
  });

  it("en plan med hinder skrivs aldrig", async () => {
    const f = fixtur("matskap");
    const w = fejkWix(f);
    const lager = new MinnesFargbildLager();
    const las = await lasSidaIn({ wix: w.wix, lager }, f.sida.id, doldaPerFil(katalogAv(w)), ["oppen_auktion"]);
    const plan = planeraSida(las!.in);
    const u = await skrivSida(plan, { wix: w.wix, lager, vanta: async () => {} });
    expect(u.ok).toBe(false);
    expect(w.patchar).toEqual([]);
  });

  it("en publicerad givare är ett hinder — den kan vara en egen sida", async () => {
    const f = fixtur("matskap");
    const w = fejkWix(f);
    w.produkter[f.givare[0].id].visible = true;
    const lager = new MinnesFargbildLager();
    // Den publicerade finns inte i indexet över dolda, så den hittas inte som givare.
    const plan = await planFor(w, lager, f.sida.id);
    expect(plan.val.filter((v) => v.givareId)).toHaveLength(1);
  });
});

describe("mediaPost", () => {
  it("skickar inte en tom alt-text (Wix 400 altText has size 0)", () => {
    expect(mediaPost({ id: "a", alt: "" })).toEqual({ id: "a" });
    expect(mediaPost({ id: "b", alt: "Soffa i grått" })).toEqual({ id: "b", altText: "Soffa i grått" });
  });
});
