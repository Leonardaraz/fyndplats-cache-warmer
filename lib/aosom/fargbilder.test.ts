// Färgbilderna. Fixturerna i ./fargbilder-fixtures är byggda ur torrkörningen
// 2026-09-30 (fyra av de tio granskade sidorna), utan artikelnummer, SKU:er
// och priser. `torrkorningensForslag` är torrkörningens förslag per färg,
// inklusive det den skar vid 15-taket — testerna jämför planen mot det.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  GRANSKA_FRAN_POSITION,
  WIX_BILDTAK,
  altFor,
  arKort,
  arOpolerad,
  doldaPerFil,
  forButiken,
  givarensBilder,
  harSvenskAlt,
  hittaGivare,
  kontrolleraEfter,
  nammdaFarger,
  olankadeAgare,
  planSha,
  planeraSida,
  raknare,
  valNyckel,
  valjSidor,
  type Bild,
  type Givare,
  type SidaIn,
  type SidOption,
  type SidPlan,
  type TabellRad,
} from "./fargbilder";

interface Fixtur {
  sida: { id: string; namn: string; synlig: boolean; bilder: Bild[]; optioner: SidOption[] };
  givare: (Givare & { val: string })[];
  torrkorningensForslag: Record<string, string[]>;
}

function fixtur(namn: string): Fixtur {
  return JSON.parse(readFileSync(join(__dirname, "fargbilder-fixtures", `${namn}.json`), "utf-8"));
}

/** Sidan som planen ser den: givarna hittade via filen, som rutten gör. */
function sidaAv(f: Fixtur, over: Partial<SidaIn> = {}): SidaIn {
  const katalog = [
    { id: f.sida.id, visible: true, nycklar: f.sida.bilder.map((b) => b.id) },
    ...f.givare.map((g) => ({ id: g.id, visible: false, nycklar: g.bilder.map((b) => b.id) })),
  ];
  const farg = f.sida.optioner.find((o) => o.namn === "Färg")!;
  const { givare, flera } = hittaGivare(f.sida.id, farg.val, doldaPerFil(katalog));
  const perId = new Map(f.givare.map((g) => [g.id, g]));
  return {
    ...structuredClone(f.sida),
    givare: Object.fromEntries(Object.entries(givare).map(([valId, gid]) => [valId, perId.get(gid)!])),
    flerGivare: flera,
    tabell: [],
    ...over,
  };
}

const valPa = (p: SidPlan, namn: string) => p.val.find((v) => v.namn === namn)!;

/** Wix efter en lyckad skrivning av planen. */
function wixEfter(p: SidPlan, s: SidaIn) {
  return {
    synlig: s.synlig,
    bilder: p.galleriEfter,
    optioner: s.optioner.map((o) => ({
      ...o,
      val: o.val.map((v) => {
        const vp = p.val.find((x) => x.valId === v.id);
        return vp ? { ...v, lankade: vp.lankadeEfter } : v;
      }),
    })),
    varianter: [{ id: "v1", synlig: true }],
  };
}

describe("butikens ägarregler, ordagrant", () => {
  it("kort och måttbilder är gemensamma", () => {
    expect(arKort("Faktakort för det vita matskåpet med mått")).toBe(true);
    expect(arKort("Måttritning: 60 cm brett")).toBe(true);
    expect(arKort("Måttbild på matskåpet: 60 × 30 cm")).toBe(true);
    expect(arKort("Hund som äter ur det vita matskåpets skål")).toBe(false);
  });

  it("färgorden böjs, å/ä/ö räknas som bokstäver och bakgrunden stryks", () => {
    expect(nammdaFarger("Det gråa matskåpet", ["Vit", "Grå", "Svart"])).toEqual(["Grå"]);
    expect(nammdaFarger("Den mörkgrå duken", ["Grå", "Mörkgrå"])).toEqual(["Mörkgrå"]);
    expect(nammdaFarger("Svart skåp mot vit bakgrund", ["Vit", "Svart"])).toEqual(["Svart"]);
    expect(nammdaFarger("Färgkort i svart och vitt", ["Vit", "Svart"])).toEqual(["Vit", "Svart"]);
  });

  it("olänkade foton: kort gemensamma, en nämnd färg avgör, annars huvudbildens färg", () => {
    const bilder = [
      { id: "a", alt: "Vitt skåp" },
      { id: "b", alt: "Hund vid skåpet" },
      { id: "c", alt: "Faktakort för skåpet" },
      { id: "d", alt: "Det svarta skåpet i ett kök" },
      { id: "e", alt: "Vitt och svart skåp bredvid varandra" },
    ];
    const agare = olankadeAgare(bilder, new Set(["a"]), ["Vit", "Svart"], "Vit");
    expect(Object.fromEntries(agare)).toEqual({ b: "Vit", c: null, d: "Svart", e: null });
  });
});

describe("givaren hittas via filen", () => {
  it("valets huvudbild i exakt ett dolt utkast är givaren", () => {
    const f = fixtur("matskap");
    const s = sidaAv(f);
    expect(Object.keys(s.givare)).toHaveLength(2);
    expect(s.flerGivare).toEqual([]);
  });

  it("☠️ samma fil i två dolda produkter är ett hinder, inte en gissning", () => {
    const f = fixtur("matskap");
    const g = f.givare[0];
    f.givare.push({ ...g, id: "00000000-0000-4000-8000-000000000001" });
    const p = planeraSida(sidaAv(f));
    expect(p.hinder).toContain("flera_givare");
    expect(p.andrarWix).toBe(false);
  });

  it("den publicerade sidan själv är ingen givare", () => {
    const dolda = doldaPerFil([{ id: "sida", visible: true, nycklar: ["x"] }]);
    expect(hittaGivare("sida", [{ id: "v", namn: "Vit", lankade: ["x"] }], dolda).givare).toEqual({});
  });
});

describe("matskåpet: tre färger, polerade givare", () => {
  const f = fixtur("matskap");
  const p = planeraSida(sidaAv(f));

  it("varje färg får sina bilder — samma som torrkörningen föreslog", () => {
    expect(p.hinder).toEqual([]);
    for (const v of p.val) {
      expect([...v.galleri, ...v.overflow].sort()).toEqual([...f.torrkorningensForslag[v.valId]].sort());
    }
  });

  it("huvudbilden först i varje lista, och sidans kort är gemensamma", () => {
    for (const v of p.val) expect(v.lankadeEfter[0]).toBe(v.lankadeFore[0]);
    expect(p.gemensamma).toHaveLength(2);
    expect(p.galleriEfter[0].id).toBe(f.sida.bilder[0].id);
  });

  it("givarnas egna kort följer inte med", () => {
    expect(p.givarkort).toBe(4);
    const alla = p.val.flatMap((v) => v.bilder.map((b) => b.id));
    for (const g of f.givare) {
      for (const b of g.bilder) if (arKort(b.alt)) expect(alla).not.toContain(b.id);
    }
  });

  it("under taket: inget overflow, inget granskas (givarna är polerade)", () => {
    expect(p.galleriEfter.length).toBeLessThanOrEqual(WIX_BILDTAK);
    expect(p.val.every((v) => v.overflow.length === 0 && v.granskas.length === 0)).toBe(true);
  });

  it("svenska alt-texter behålls", () => {
    const gra = valPa(p, "Grå");
    const donator = f.givare.find((g) => g.val === gra.valId)!;
    const b2 = donator.bilder[1];
    expect(gra.bilder.find((b) => b.id === b2.id)!.alt).toBe(b2.alt);
    expect(gra.bilder.find((b) => b.id === b2.id)!.altNy).toBe(false);
  });

  it("tabellen får varje färgs bilder och de gemensamma", () => {
    const ut = forButiken(p.rader);
    expect(Object.keys(ut.val).sort()).toEqual(["Grå", "Svart", "Vit"]);
    expect(ut.val.Vit[0]).toBe(f.sida.bilder[0].id);
    expect(ut.gemensamma).toEqual(p.gemensamma);
  });
});

describe("pergolataket: fyra färger, en opolerad givare", () => {
  const f = fixtur("pergolatak");
  const utan = planeraSida(sidaAv(f));
  const med = planeraSida(sidaAv(f), { taMedGranskade: true });

  it("den opolerade givarens bilder från position 3 granskas och skrivs inte", () => {
    const mg = valPa(utan, "Mörkgrå");
    const g = f.givare.find((x) => x.val === mg.valId)!;
    expect(arOpolerad(g)).toBe(true);
    expect(mg.granskas).toEqual(g.bilder.slice(GRANSKA_FRAN_POSITION - 1).map((b) => b.id));
    expect(mg.galleri).toEqual(g.bilder.slice(0, GRANSKA_FRAN_POSITION - 1).map((b) => b.id));
    expect(utan.galleriEfter.map((b) => b.id)).not.toContain(g.bilder[2].id);
  });

  it("granskade bilder hamnar i tabellen som `granskas` — och når aldrig butiken", () => {
    const mg = valPa(utan, "Mörkgrå");
    expect(utan.rader.filter((r) => r.plats === "granskas").map((r) => r.filId)).toEqual(mg.granskas);
    const ut = forButiken(utan.rader);
    for (const id of mg.granskas) expect(ut.val["Mörkgrå"]).not.toContain(id);
  });

  it("de opolerade bilderna får svensk alt-text, de polerade behåller sin", () => {
    const mg = valPa(utan, "Mörkgrå");
    const ny = mg.bilder.find((b) => b.id === mg.galleri[1])!;
    expect(ny.altNy).toBe(true);
    expect(ny.alt).toBe(altFor(f.sida.namn, { Färg: "Mörkgrå" }, 2));
    expect(valPa(utan, "Beige").bilder.filter((b) => b.kalla === "givare").every((b) => !b.altNy)).toBe(true);
  });

  it("☠️ över 15 med de granskade: fördelat jämnt, resten i overflow — samma som torrkörningen skar", () => {
    expect(med.galleriEfter).toHaveLength(WIX_BILDTAK);
    const overflow = med.val.flatMap((v) => v.overflow);
    expect(overflow).toHaveLength(2);
    // Torrkörningen skar sidans femte foto och givarens sista.
    expect(valPa(med, "Mörkbrun").overflow).toHaveLength(1);
    expect(valPa(med, "Mörkgrå").overflow).toHaveLength(1);
    for (const v of med.val.filter((x) => !x.ursprung)) {
      expect([...v.galleri, ...v.overflow].sort()).toEqual([...f.torrkorningensForslag[v.valId]].sort());
    }
  });

  it("sidans kort som bara nämner en färg hör till den färgen — butikens regel, inte torrkörningens", () => {
    // "Kort: mörkbrun duk …" är inget `arKort` (regeln kräver faktakort,
    // måttkort m.fl.), och alt-texten nämner exakt en färg. Butiken visar
    // alltså kortet bara för mörkbrunt, och planen gör likadant.
    const kort = f.sida.bilder.find((b) => b.alt.startsWith("Kort:"))!;
    expect(arKort(kort.alt)).toBe(false);
    const mb = valPa(med, "Mörkbrun");
    expect([...mb.galleri, ...mb.overflow]).toContain(kort.id);
    expect(med.gemensamma).not.toContain(kort.id);
    expect([...mb.galleri, ...mb.overflow]).toEqual(expect.arrayContaining(f.torrkorningensForslag[mb.valId]));
  });

  it("varje färg behåller sin huvudbild, och ingen länkad bild faller ur", () => {
    for (const v of med.val) {
      expect(v.galleri[0]).toBe(v.lankadeFore[0]);
      expect(v.lankadeEfter.slice(0, v.lankadeFore.length)).toEqual(v.lankadeFore);
    }
    const idn = new Set(med.galleriEfter.map((b) => b.id));
    for (const o of f.sida.optioner) for (const v of o.val) for (const id of v.lankade) expect(idn.has(id)).toBe(true);
  });

  it("sidans foto som flyttas till overflow var olänkat — och räknas", () => {
    const flyttad = valPa(med, "Mörkbrun").overflow[0];
    expect(f.sida.bilder.some((b) => b.id === flyttad)).toBe(true);
    expect(raknare(med).urGalleriet).toBe(1);
  });

  it("planens sha skiljer på med och utan de granskade", () => {
    expect(planSha([utan], false)).not.toBe(planSha([med], true));
    expect(planSha([planeraSida(sidaAv(f))], false)).toBe(planSha([utan], false));
  });
});

describe("sittbänken: fem färger, fyra opolerade givare", () => {
  const f = fixtur("sittbank");

  it("utan de granskade: position 1 och 2 per givare, allt under taket", () => {
    const p = planeraSida(sidaAv(f));
    expect(p.hinder).toEqual([]);
    expect(p.galleriEfter.length).toBeLessThanOrEqual(WIX_BILDTAK);
    for (const v of p.val.filter((x) => !x.ursprung)) {
      expect(v.galleri.length).toBeGreaterThanOrEqual(2);
      expect(v.granskas.length).toBeGreaterThan(0);
    }
  });

  it("med de granskade: långt över 15, men varje färg har bilder i galleriet och resten i tabellen", () => {
    const p = planeraSida(sidaAv(f), { taMedGranskade: true });
    expect(p.galleriEfter).toHaveLength(WIX_BILDTAK);
    const antal = p.val.map((v) => v.galleri.length);
    expect(Math.max(...antal) - Math.min(...antal)).toBeLessThanOrEqual(1);
    for (const v of p.val) {
      expect([...v.galleri, ...v.overflow].sort()).toEqual([...f.torrkorningensForslag[v.valId]].sort());
    }
    const ut = forButiken(p.rader);
    const totalt = Object.values(ut.val).reduce((n, l) => n + l.length, 0);
    expect(totalt).toBe(p.val.reduce((n, v) => n + v.galleri.length + v.overflow.length, 0));
  });
});

describe("verktygslådan: färg och storlek på samma sida", () => {
  const f = fixtur("verktygslada");
  const s = sidaAv(f);
  const p = planeraSida(s);

  it("storleksvalens bilder står kvar orörda i galleriet", () => {
    const storlek = f.sida.optioner.find((o) => o.namn === "Storlek")!;
    const ids = storlek.val.flatMap((v) => v.lankade);
    expect(p.fasta.sort()).toEqual([...ids].sort());
    for (const id of ids) expect(p.galleriEfter.map((b) => b.id)).toContain(id);
    const efter = wixEfter(p, s);
    expect(kontrolleraEfter(p, { synlig: true, optioner: s.optioner, varianter: efter.varianter }, efter)).toEqual([]);
  });

  it("en färg utan länkad bild får ingenting och varnas", () => {
    const sor = valPa(p, "Svart och Röd");
    expect(sor.lankadeFore).toEqual([]);
    expect(sor.lankadeEfter).toEqual([]);
    expect(p.varningar).toContain("val_utan_bild");
  });
});

describe("☠️ inga länkade bilder tappas", () => {
  it("en plan som skulle flytta en länkad bild blir plan_ogiltig", () => {
    // Sexton länkade bilder: Wix kunde aldrig ha dem, men om det händer ska
    // planen hellre vägra än välja bort en.
    const bilder = Array.from({ length: 16 }, (_, i) => ({ id: `b${i}`, alt: `Bild ${i}` }));
    const s: SidaIn = {
      id: "sida", namn: "Stol", synlig: true, bilder,
      optioner: [{ namn: "Färg", val: [{ id: "v1", namn: "Vit", lankade: bilder.slice(0, 8).map((b) => b.id) }, { id: "v2", namn: "Svart", lankade: bilder.slice(8).map((b) => b.id) }] }],
      givare: {}, flerGivare: [], tabell: [],
    };
    expect(planeraSida(s).hinder).toContain("over_tak_redan");
  });

  it("en färg som redan har flera länkade bilder behåller hela listan först", () => {
    const f = fixtur("matskap");
    const s = sidaAv(f);
    const farg = s.optioner[0];
    const vit = farg.val.find((v) => v.namn === "Vit")!;
    vit.lankade = [s.bilder[0].id, s.bilder[3].id, s.bilder[1].id];
    const p = planeraSida(s);
    expect(valPa(p, "Vit").lankadeEfter.slice(0, 3)).toEqual(vit.lankade);
  });

  it("återläsningen fäller ett val som tappat en bild, och ett galleri i fel ordning", () => {
    const f = fixtur("matskap");
    const s = sidaAv(f);
    const p = planeraSida(s);
    const fore = { synlig: true, optioner: s.optioner, varianter: [{ id: "v1", synlig: true }] };
    const ratt = wixEfter(p, s);
    expect(kontrolleraEfter(p, fore, ratt)).toEqual([]);

    const tappad = structuredClone(ratt);
    tappad.optioner[0].val[1].lankade = tappad.optioner[0].val[1].lankade.slice(0, 1);
    expect(kontrolleraEfter(p, fore, tappad)).toContain("ett färgval pekar inte på de planerade bilderna");

    const omkastad = structuredClone(ratt);
    omkastad.bilder = [...omkastad.bilder].reverse();
    expect(kontrolleraEfter(p, fore, omkastad)).toContain("galleriet är inte det planerade");

    const dold = { ...ratt, varianter: [{ id: "v1", synlig: false }] };
    expect(kontrolleraEfter(p, fore, dold)).toContain("en variant är inte längre synlig");
  });
});

describe("omkörning och tabellen", () => {
  it("en omkörning efter en skrivning ändrar ingenting", () => {
    const f = fixtur("pergolatak");
    const s = sidaAv(f, {});
    const p = planeraSida(s, { taMedGranskade: true });
    const efter = wixEfter(p, s);
    const igen = planeraSida({ ...s, bilder: efter.bilder, optioner: efter.optioner, tabell: p.rader }, { taMedGranskade: true });
    expect(igen.andrarWix).toBe(false);
    expect(igen.andrarTabell).toBe(false);
  });

  it("☠️ när givaren är raderad bär tabellen overflow — ingenting försvinner", () => {
    const f = fixtur("pergolatak");
    const s = sidaAv(f);
    const p = planeraSida(s, { taMedGranskade: true });
    const efter = wixEfter(p, s);
    const utanGivare = planeraSida(
      { ...s, bilder: efter.bilder, optioner: efter.optioner, givare: {}, tabell: p.rader },
      { taMedGranskade: true },
    );
    expect(utanGivare.andrarWix).toBe(false);
    for (const v of p.val) {
      expect(valPa(utanGivare, v.namn).overflow).toEqual(v.overflow);
    }
  });

  it("en godkänd bild granskas inte igen när givaren fortfarande finns", () => {
    const f = fixtur("pergolatak");
    const s = sidaAv(f);
    const med = planeraSida(s, { taMedGranskade: true });
    const efter = wixEfter(med, s);
    const utan = planeraSida({ ...s, bilder: efter.bilder, optioner: efter.optioner, tabell: med.rader });
    expect(utan.andrarWix).toBe(false);
    expect(valPa(utan, "Mörkgrå").granskas).toEqual([]);
  });

  it("forButiken lämnar aldrig ut det som granskas", () => {
    const rader: TabellRad[] = [
      { wixProductId: "p", choiceId: "v", choiceName: "Grå", ordning: 0, filId: "a", plats: "galleri", givareId: null },
      { wixProductId: "p", choiceId: "v", choiceName: "Grå", ordning: 1, filId: "b", plats: "overflow", givareId: "g" },
      { wixProductId: "p", choiceId: "v", choiceName: "Grå", ordning: 2, filId: "c", plats: "granskas", givareId: "g" },
      { wixProductId: "p", choiceId: "", choiceName: "", ordning: 0, filId: "k", plats: "gemensam", givareId: null },
    ];
    expect(forButiken(rader)).toEqual({ val: { Grå: ["a", "b"] }, gemensamma: ["k"] });
  });
});

describe("urvalet och hindren", () => {
  it("valjSidor tar publicerade sidor med en givare som tabellen inte har, sorterat", () => {
    const katalog = [
      { id: "b", visible: true, nycklar: [], val: [{ axel: "Färg", id: "v1", forsta: "x1" }, { axel: "Färg", id: "v2", forsta: "x2" }] },
      { id: "a", visible: true, nycklar: [], val: [{ axel: "Färg", id: "v1", forsta: "y1" }, { axel: "Färg", id: "v2", forsta: "y2" }] },
      { id: "c", visible: true, nycklar: [], val: [{ axel: "Färg", id: "v1", forsta: "z1" }, { axel: "Färg", id: "v2", forsta: "z2" }] },
      { id: "g1", visible: false, nycklar: ["x2"] },
      { id: "g2", visible: false, nycklar: ["y2"] },
    ];
    const dolda = doldaPerFil(katalog);
    expect(valjSidor(katalog, dolda, new Set())).toEqual(["a", "b"]);
    expect(valjSidor(katalog, dolda, new Set([valNyckel("a", "v2")]))).toEqual(["b"]);
  });

  it("ett val utan id i svepet räknas som skrivet när sidan har rader — annars väljs samma sida om och om igen", () => {
    const katalog = [
      { id: "a", visible: true, nycklar: [], val: [{ axel: "Färg", id: "", forsta: "y1" }, { axel: "Färg", id: "", forsta: "y2" }] },
      { id: "g", visible: false, nycklar: ["y2"] },
    ];
    const dolda = doldaPerFil(katalog);
    expect(valjSidor(katalog, dolda, new Set())).toEqual(["a"]);
    expect(valjSidor(katalog, dolda, new Set([valNyckel("a", "*")]))).toEqual([]);
  });

  it("en dold sida och en sida utan färgval hoppas över", () => {
    const f = fixtur("matskap");
    expect(planeraSida(sidaAv(f, { synlig: false })).hinder).toContain("ej_publicerad");
    expect(planeraSida(sidaAv(f, { optioner: [] })).hinder).toContain("saknar_fargaxel");
    expect(planeraSida(sidaAv(f, { hinder: ["oppen_auktion"] })).hinder).toContain("oppen_auktion");
  });

  it("räknarna bär bara id, antal och koder — inga namn eller alt-texter", () => {
    const f = fixtur("pergolatak");
    const r = raknare(planeraSida(sidaAv(f)));
    const text = JSON.stringify(r);
    expect(text).not.toContain(f.sida.namn.slice(0, 12));
    for (const g of f.givare) expect(text).not.toContain(g.namn.slice(0, 12));
    expect(text).not.toMatch(/b379ce_/);
  });

  it("tyska och svenska alt-texter skiljs åt", () => {
    expect(harSvenskAlt("Beige pergoladuk över en uteplats")).toBe(true);
    expect(harSvenskAlt("Ersatzplane für 3x3m Pavillons")).toBe(false);
    expect(harSvenskAlt("")).toBe(false);
    expect(arOpolerad({ namn: "Bürostuhl grau", bilder: [{ alt: "x" }] })).toBe(true);
    expect(arOpolerad({ namn: "Kontorsstol i grått", bilder: [{ alt: "" }] })).toBe(true);
    expect(arOpolerad({ namn: "Kontorsstol i grått", bilder: [{ alt: "Stolen framifrån" }] })).toBe(false);
  });

  it("givarens första bild följer alltid med, även när den ser ut som ett kort", () => {
    const g = givarensBilder({ id: "g", namn: "Stol", bilder: [{ id: "a", alt: "Faktakort" }, { id: "b", alt: "Måttritning" }, { id: "c", alt: "Stol" }] });
    expect(g.bilder.map((b) => b.id)).toEqual(["a", "c"]);
    expect(g.kort).toBe(1);
  });
});
