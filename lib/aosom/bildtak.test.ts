// Bildtaket: Wix tar 50 bilder per produkt, inte de 15 som dokumentationen säger.
//
// Uppmätt 2026-10-21 på en dold testprodukt (raderad direkt efteråt): 16, 20,
// 25, 30, 40, 46 och 50 bilder skrevs och lästes tillbaka i ett eget anrop, och
// den 51:a gav `400 MAX_SIZE` ("has size 51, expected 50 or less"). 86
// publicerade sidor höll dessutom redan 16–46 bilder.
//
// Den här filen prövar det VERKLIGA taket. Testerna av fördelningen mot
// torrkörningens fixturer (fargbilder.test.ts, fargbilder-kor.test.ts och
// ruttens test) är pinnade till 15 i sina egna huvuden, eftersom deras
// förväntningar är mätta när taket antogs vara 15.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WIX_MAX_BILDER_PER_PRODUKT } from "../wix/limits";
import {
  WIX_BILDTAK,
  doldaPerFil,
  hittaGivare,
  planeraSida,
  type Bild,
  type Givare,
  type SidaIn,
  type SidOption,
} from "./fargbilder";
import { MAX_BILDER } from "./livsbild";
import { fordelaGivarensBilder } from "./sammanslagning";

interface Fixtur {
  sida: { id: string; namn: string; synlig: boolean; bilder: Bild[]; optioner: SidOption[] };
  givare: (Givare & { val: string })[];
  torrkorningensForslag: Record<string, string[]>;
}

const fixtur = (namn: string): Fixtur =>
  JSON.parse(readFileSync(join(__dirname, "fargbilder-fixtures", `${namn}.json`), "utf-8"));

/** Sidan som planen ser den: givarna hittade via filen, som rutten gör. */
function sidaAv(f: Fixtur): SidaIn {
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
  };
}

describe("taket är uppmätt, och alla moduler läser samma tal", () => {
  it("Wix tar 50 — sänk det inte till 15 utan en ny mätning", () => {
    expect(WIX_MAX_BILDER_PER_PRODUKT).toBe(50);
  });

  it("färgbilderna och miljöbilden läser konstanten i lib/wix/limits.ts", () => {
    expect(WIX_BILDTAK).toBe(WIX_MAX_BILDER_PER_PRODUKT);
    expect(MAX_BILDER).toBe(WIX_MAX_BILDER_PER_PRODUKT);
  });

  it("☠️ ingen modul hårdkodar ett eget tak (källkodsgrind, som gate-kopior)", () => {
    const kataloger = [__dirname, join(__dirname, "../polish")];
    const traffar: string[] = [];
    for (const dir of kataloger) {
      for (const namn of readdirSync(dir)) {
        if (!namn.endsWith(".ts") || namn.endsWith(".test.ts")) continue;
        readFileSync(join(dir, namn), "utf-8").split("\n").forEach((rad, i) => {
          const kod = rad.replace(/\/\/.*$/, "");
          // En jämförelse av en bild- eller medialängd mot ett tal i stället för konstanten.
          if (/(?:media|bilder|galleri)\w*(?:\.length)?\s*[<>]=?\s*(?:1[0-9]|[2-9][0-9])\b/i.test(kod)) {
            traffar.push(`${namn}:${i + 1}`);
          }
          // Ett namngivet tak som tilldelas ett tal i stället för konstanten.
          if (/\b(?:WIX_BILDTAK|MAX_BILDER)\s*=\s*\d+/.test(kod)) traffar.push(`${namn}:${i + 1}`);
        });
      }
    }
    expect(traffar).toEqual([]);
  });
});

describe("sammanslagna sidor vid det verkliga taket", () => {
  it("pergolataket med de granskade: allt ryms i galleriet — inget overflow, som torrkörningen skar vid 15", () => {
    const f = fixtur("pergolatak");
    const p = planeraSida(sidaAv(f), { taMedGranskade: true, tillatUrGalleriet: true });
    expect(p.hinder).toEqual([]);
    expect(p.val.flatMap((v) => v.overflow)).toEqual([]);
    expect(p.galleriEfter.length).toBeGreaterThan(15);
    expect(p.galleriEfter.length).toBeLessThanOrEqual(WIX_BILDTAK);
    // Samma bilder per färg som torrkörningen föreslog — bara ingen av dem i tabellen.
    for (const v of p.val.filter((x) => !x.ursprung)) {
      expect([...v.galleri].sort()).toEqual([...f.torrkorningensForslag[v.valId]].sort());
    }
  });

  it("sittbänken med de granskade: planen håller sig under taket och varje bild är kvar", () => {
    const f = fixtur("sittbank");
    const p = planeraSida(sidaAv(f), { taMedGranskade: true, tillatUrGalleriet: true });
    expect(p.hinder).toEqual([]);
    expect(p.galleriEfter.length).toBeLessThanOrEqual(WIX_BILDTAK);
    for (const v of p.val) {
      expect([...v.galleri, ...v.overflow].sort()).toEqual([...f.torrkorningensForslag[v.valId]].sort());
    }
  });

  it("☠️ över taket är fortfarande ett hinder: taket + 1 länkade bilder blir over_tak_redan, 16 gör det inte längre", () => {
    const sida = (antal: number): SidaIn => {
      const bilder = Array.from({ length: antal }, (_, i) => ({ id: `b${i}`, alt: `Bild ${i}` }));
      const hälften = Math.floor(antal / 2);
      return {
        id: "sida", namn: "Stol", synlig: true, bilder,
        optioner: [{ namn: "Färg", val: [
          { id: "v1", namn: "Vit", lankade: bilder.slice(0, hälften).map((b) => b.id) },
          { id: "v2", namn: "Svart", lankade: bilder.slice(hälften).map((b) => b.id) },
        ] }],
        givare: {}, flerGivare: [], tabell: [],
      };
    };
    expect(planeraSida(sida(16)).hinder).not.toContain("over_tak_redan");
    expect(planeraSida(sida(WIX_BILDTAK)).hinder).not.toContain("over_tak_redan");
    expect(planeraSida(sida(WIX_BILDTAK + 1)).hinder).toContain("over_tak_redan");
  });

  it("givarens bilder ryms nu på en sida med 16 bilder, och overflow börjar först vid taket", () => {
    const sida = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `s${i}`, altText: `Stol, vy ${i + 1}` }));
    const givare = Array.from({ length: 5 }, (_, i) => ({ id: `g${i}`, altText: `Den grå stolen, vy ${i + 1}` }));
    const fran = (n: number) => fordelaGivarensBilder(sida(n), givare, "Kontorsstol i grått", "Kontorsstol", { Färg: "Grå" });

    // Sexton bilder på sidan: det var fullt när taket antogs vara 15.
    const sexton = fran(16);
    expect(sexton.overflow).toEqual([]);
    expect(sexton.nya).toHaveLength(5);

    // Två platser kvar: två bilder ryms, tre går till tabellen.
    const tva = fran(WIX_BILDTAK - 2);
    expect(tva.nya).toHaveLength(2);
    expect(tva.overflow).toHaveLength(3);
  });
});
