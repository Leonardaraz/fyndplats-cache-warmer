// Prismotorn (lib/medlem/pris.ts) mot specens acceptanskriterier E2 och E3,
// med Leonards beslut 2026-11-04: fri frakt från 500,00 kr (E0-5), företagen
// får det högsta av nivån och ordertrappan, och "Begär offert" visas från 6
// exemplar av samma vara eller 20 000 kr exkl. moms.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bas,
  exklMoms,
  FRI_FRAKT_ORE,
  hogstaProcent,
  ORDERTRAPPA,
  prissatt,
  procentAv,
  radpris,
  trappaProcent,
  type Prisrad,
  type Profil,
} from "./pris.ts";
import { nivaFor, REGLER_V1 } from "./niva.ts";

const KR = 100;
let n = 0;
function rad(aKr: number, extra: Partial<Prisrad> = {}): Prisrad {
  n++;
  return {
    id: `r${n}`,
    produktId: `p${n}`,
    antal: 1,
    aOre: Math.round(aKr * KR),
    momsProcent: 25,
    golvOre: Math.round(aKr * KR * 0.5),
    ...extra,
  };
}
const privat = (niva: string): Profil => {
  const v = REGLER_V1.nivaer.find((x) => x.namn === niva)!;
  return { typ: "privat", niva: v.namn, nivaProcent: v.rabattProcent };
};
const foretag = (niva: string): Profil => ({ ...privat(niva), typ: "foretag" });

test("E2-1: 499,90 kr ger 494,90 för Silver, 489,90 för Guld och 474,91 för VIP (half up)", () => {
  const r = rad(499.9);
  assert.equal(prissatt([r], privat("Silver")).rader[0].pOre, 49_490);
  assert.equal(prissatt([r], privat("Guld")).rader[0].pOre, 48_990);
  assert.equal(prissatt([r], privat("VIP")).rader[0].pOre, 47_491);
  assert.equal(procentAv(49_990, 5), 47_491, "474,905 avrundas uppåt");
});

test("E2-4: golvet över A ger ingen rabatt; golvet 137,50 kr släpper fram VIP-priset 142,50", () => {
  // C = 115 kr ger G = 115 · 1,10 · 1,25 = 158,125, avrundat 158,13 kr.
  const dyr = prissatt([rad(150, { golvOre: 15_813 })], privat("VIP")).rader[0];
  assert.equal(dyr.pOre, 15_000);
  assert.equal(dyr.begransning, "golv");
  assert.equal(hogstaProcent(15_000, 15_813), 0);
  // C = 100 kr ger G = 137,50 kr.
  const ok = prissatt([rad(150, { golvOre: 13_750 })], privat("VIP")).rader[0];
  assert.equal(ok.pOre, 14_250);
  assert.equal(ok.begransning, "ingen");
  assert.equal(hogstaProcent(15_000, 13_750), 8);
});

test("E3-8: golvet begränsar en enskild rad och produktsidan kan säga 'högst x %'", () => {
  const r = radpris(10_000, 9_700, 5);
  assert.deepEqual(r, { pOre: 9_700, begransning: "golv" });
  assert.equal(hogstaProcent(10_000, 9_700), 3);
  assert.equal(procentAv(10_000, 3) >= 9_700, true);
  assert.equal(procentAv(10_000, 4) < 9_700, true);
});

test("E2-5: korg 505 kr till Guld stannar på gränsen för fri frakt (500,00 kr)", () => {
  const b = prissatt([rad(505)], privat("Guld"));
  assert.equal(FRI_FRAKT_ORE, 50_000);
  assert.equal(b.summaPOre, 50_000);
  assert.equal(b.friFraktSkydd, true);
  assert.equal(b.rader[0].begransning, "fri-frakt");
});

test("fri frakt-skyddet: proportionellt, öret på den dyraste raden, aldrig under gränsen", () => {
  const tva = prissatt([rad(300), rad(210)], privat("VIP"));
  assert.equal(tva.summaPOre, 50_000);
  assert.deepEqual(
    tva.rader.map((r) => r.pOre),
    [29_411, 20_589],
  );
  // Två exemplar: delsumman kan landa exakt.
  const par = prissatt([rad(253, { antal: 2 })], privat("Guld"));
  assert.equal(par.summaPOre, 50_000);
  // Tre exemplar: exakt går inte, så närmast över.
  const tre = prissatt([rad(169, { antal: 3 })], privat("VIP"));
  assert.equal(tre.summaPOre, 50_001);
  // Under gränsen redan med A: ingen spärr, hela rabatten.
  const liten = prissatt([rad(400)], privat("VIP"));
  assert.equal(liten.friFraktSkydd, false);
  assert.equal(liten.summaPOre, 38_000);
  // Över gränsen även med P: ingen spärr.
  const stor = prissatt([rad(1000)], privat("VIP"));
  assert.equal(stor.friFraktSkydd, false);
  assert.equal(stor.summaPOre, 95_000);
});

test("E2-6: kampanjvara räknas på aktuellt pris (P4), och golvet gäller", () => {
  assert.equal(prissatt([rad(400)], privat("Silver")).rader[0].pOre, 39_600);
  // Golvet 398 kr tillåter inte ens 1 % på 400 kr: ingen rabatt alls, inte 398 kr
  // med texten "högst 0 %" (Leonards ja 2026-11-04).
  const golv = prissatt([rad(400, { golvOre: 39_800 })], privat("Silver")).rader[0];
  assert.equal(golv.pOre, 40_000);
  assert.equal(golv.begransning, "golv");
  assert.equal(hogstaProcent(40_000, 39_800), 0);
});

test("golvet ger den högsta hela procenten, inte golvet självt, så att priset och 'högst x %' stämmer", () => {
  // 1 000 kr med golvet 985,50 kr: 3 % hade gett 970 kr. Golvet tillåter 1,45 %,
  // och kunden får 1 % = 990 kr, med texten "högst 1 %".
  const r = radpris(100_000, 98_550, 3);
  assert.deepEqual(r, { pOre: 99_000, begransning: "golv" });
  assert.equal(hogstaProcent(100_000, 98_550), 1);
  assert.equal(r.pOre, procentAv(100_000, hogstaProcent(100_000, 98_550)));
  // Samma i varukorgen, för en Platina-medlem och för ett företag.
  for (const profil of [privat("Platina"), foretag("Platina")]) {
    const x = prissatt([rad(1000, { golvOre: 98_550 })], profil).rader[0];
    assert.equal(x.pOre, 99_000);
    assert.equal(x.begransning, "golv");
  }
  // Ett golv som är exakt en hel procent ger just den procenten.
  assert.deepEqual(radpris(100_000, 98_000, 3), { pOre: 98_000, begransning: "golv" });
});

test("E2-8: köpet som pågår ingår inte i sin egen nivå", () => {
  const fore = nivaFor(190_000, REGLER_V1);
  assert.equal(fore.namn, "Brons");
  const b = prissatt([rad(500)], { typ: "privat", niva: fore.namn, nivaProcent: fore.rabattProcent });
  assert.equal(b.summaPOre, 50_000);
  assert.equal(b.rader[0].begransning, "ingen-rabatt");
  assert.equal(nivaFor(190_000 + 50_000, REGLER_V1).namn, "Silver");
});

test("rader utan golv eller med undantag är inte rabattberättigade och ingår inte i basen", () => {
  const rader = [
    rad(1000),
    rad(800, { golvOre: null }),
    rad(500, { undantag: "auktion" }),
    rad(250, { undantag: "presentkort" }),
  ];
  const b = prissatt(rader, privat("VIP"));
  assert.deepEqual(
    b.rader.map((r) => [r.pOre, r.begransning, r.procent]),
    [
      [95_000, "ingen", 5],
      [80_000, "ej-berattigad", 0],
      [50_000, "ej-berattigad", 0],
      [25_000, "ej-berattigad", 0],
    ],
  );
  assert.equal(b.basOreExMoms, 80_000);
});

test("E3-4: priser exkl. moms, 499,90 kr blir 399,92 kr", () => {
  assert.equal(exklMoms(49_990, 25), 39_992);
  assert.equal(exklMoms(1, 25), 1);
  assert.equal(exklMoms(0, 25), 0);
});

test("E3-5: 6 240 kr inkl. moms ger 0 %, 6 250 kr ger 1 % på alla berättigade rader", () => {
  const under = prissatt([rad(6240)], foretag("Brons"));
  assert.equal(under.basOreExMoms, 499_200);
  assert.equal(under.procent, 0);
  const pa = prissatt([rad(6250)], foretag("Brons"));
  assert.equal(pa.basOreExMoms, 500_000);
  assert.equal(pa.procent, 1);
  assert.equal(pa.kalla, "trappa");
  assert.equal(pa.rader[0].pOre, 618_750);
});

test("E3-6: tolv varor à 2 500 kr ger 3 % = 900 kr; en rad utan känd kostnad får 0 %", () => {
  const rader = Array.from({ length: 12 }, () => rad(2500));
  const utan = rad(1000, { golvOre: null });
  const b = prissatt([...rader, utan], foretag("Brons"));
  assert.equal(b.basOreExMoms, 2_400_000);
  assert.equal(b.procent, 3);
  assert.equal(b.rabattOre, 90_000);
  assert.equal(b.rader.at(-1)!.pOre, 100_000);
  assert.equal(b.rader.at(-1)!.procent, 0);
});

test("E3-7: 11 000 kr visar 'Lägg till 1 500 kr för 2 %'; 60 000 kr ger 4 % = 2 400 kr", () => {
  const b = prissatt([rad(11_000)], foretag("Brons"));
  assert.equal(b.procent, 1);
  assert.deepEqual(b.nastaSteg, { procent: 2, kvarOreExMoms: 120_000, kvarOreInklMoms: 150_000 });
  const stor = prissatt([rad(60_000)], foretag("Brons"));
  assert.equal(stor.procent, 4);
  assert.equal(stor.rabattOre, 240_000);
  assert.deepEqual(stor.nastaSteg, { procent: 5, kvarOreExMoms: 200_000, kvarOreInklMoms: 250_000 });
});

test("företag: det högsta av nivån och trappan, aldrig båda tillsammans", () => {
  // Diamant (4 %) med en korg som trappan ger 1 %: nivån vinner.
  const niva = prissatt([rad(7000)], foretag("Diamant"));
  assert.equal(niva.trappaProcent, 1);
  assert.equal(niva.procent, 4);
  assert.equal(niva.kalla, "niva");
  // Nästa steg som ger mer än 4 % är 5 % från 50 000 kr exkl. moms.
  assert.equal(niva.nastaSteg?.procent, 5);
  // Brons med en korg på 3 % i trappan: trappan vinner.
  const trappa = prissatt([rad(30_000)], foretag("Brons"));
  assert.equal(trappa.procent, 3);
  assert.equal(trappa.kalla, "trappa");
  // Lika: nivån står som källa, och procenten adderas inte.
  const lika = prissatt([rad(30_000)], foretag("Platina"));
  assert.equal(lika.procent, 3);
  assert.equal(lika.kalla, "niva");
  // VIP högst i båda: inget nästa steg.
  assert.equal(prissatt([rad(70_000)], foretag("VIP")).nastaSteg, null);
});

test("privatpersoner har ingen trappa och ingen offert, hur stor korgen än är", () => {
  const b = prissatt([rad(70_000, { antal: 10, produktId: "x" })], privat("Brons"));
  assert.equal(b.procent, 0);
  assert.equal(b.trappaProcent, undefined);
  assert.equal(b.offert, false);
  assert.equal(b.nastaSteg, null);
});

test("F7: 'Begär offert' från 6 exemplar av samma vara (varianter räknas ihop) eller 20 000 kr exkl. moms", () => {
  const fem = prissatt([rad(100, { produktId: "stol", antal: 5 })], foretag("Brons"));
  assert.equal(fem.offert, false);
  const sex = prissatt(
    [rad(100, { produktId: "stol", variantId: "svart", antal: 3 }), rad(100, { produktId: "stol", variantId: "vit", antal: 3 })],
    foretag("Brons"),
  );
  assert.equal(sex.offert, true);
  // Sex olika varor är inte sex av samma vara.
  const olika = prissatt(Array.from({ length: 6 }, () => rad(100)), foretag("Brons"));
  assert.equal(olika.offert, false);
  // Basen: 25 000 kr inkl. moms är 20 000 kr exkl.
  assert.equal(prissatt([rad(24_999.99)], foretag("Brons")).offert, false);
  assert.equal(prissatt([rad(25_000)], foretag("Brons")).offert, true);
  // Presentkort räknas inte som exemplar.
  const kort = prissatt([rad(100, { produktId: "pk", antal: 9, undantag: "presentkort" })], foretag("Brons"));
  assert.equal(kort.offert, false);
});

test("ordertrappan är specens tabell", () => {
  assert.deepEqual(
    ORDERTRAPPA.map((s) => [s.franOreExMoms / 100, s.procent]),
    [
      [0, 0],
      [5000, 1],
      [10_000, 2],
      [20_000, 3],
      [30_000, 4],
      [50_000, 5],
    ],
  );
  assert.equal(trappaProcent(499_999), 0);
  assert.equal(trappaProcent(500_000), 1);
  assert.equal(trappaProcent(5_000_000), 5);
});

test("basen avrundas nedåt så att ett öre aldrig lyfter korgen över en gräns", () => {
  assert.equal(bas([rad(0.01)]), 0);
  assert.equal(bas([rad(6249.99)]), 499_999);
});

test("felaktiga rader stoppas", () => {
  assert.throws(() => prissatt([rad(100, { antal: 0 })], privat("Silver")), /antal/);
  assert.throws(() => prissatt([rad(100, { aOre: -1 })], privat("Silver")), /A/);
  assert.throws(() => prissatt([rad(100, { aOre: 10.5 })], privat("Silver")), /A/);
  assert.throws(() => prissatt([rad(100, { golvOre: 3.2 })], privat("Silver")), /G/);
});

// ─────────────────────────────────────────────────────────────────────────────
// Egenskaper över slumpade korgar
// ─────────────────────────────────────────────────────────────────────────────

function slump(fro: number) {
  let s = fro >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test("egenskaper i 20 000 slumpade korgar: G ≤ P ≤ A, aldrig mer än procenten, fri frakt behålls", () => {
  const r = slump(20261104);
  const nivaer = REGLER_V1.nivaer;
  for (let fall = 0; fall < 20_000; fall++) {
    const antalRader = 1 + Math.floor(r() * 6);
    const rader: Prisrad[] = Array.from({ length: antalRader }, (_, i) => {
      const aOre = 100 + Math.floor(r() * (r() < 0.2 ? 2_000_000 : 80_000));
      const golv = r() < 0.15 ? null : Math.floor(aOre * (0.6 + r() * 0.5));
      const undantag = r() < 0.05 ? ("auktion" as const) : undefined;
      return {
        id: `r${i}`,
        produktId: `p${Math.floor(r() * 4)}`,
        antal: 1 + Math.floor(r() * (r() < 0.2 ? 8 : 3)),
        aOre,
        momsProcent: 25,
        golvOre: golv,
        ...(undantag ? { undantag } : {}),
      };
    });
    const niva = nivaer[Math.floor(r() * nivaer.length)];
    const profil: Profil = { typ: r() < 0.5 ? "privat" : "foretag", niva: niva.namn, nivaProcent: niva.rabattProcent };
    const b = prissatt(rader, profil);

    const forvantadProcent =
      profil.typ === "foretag" ? Math.max(niva.rabattProcent, trappaProcent(bas(rader))) : niva.rabattProcent;
    assert.equal(b.procent, forvantadProcent);
    for (const [i, x] of b.rader.entries()) {
      const in_ = rader[i];
      assert.ok(x.pOre <= in_.aOre, "aldrig över A");
      if (in_.golvOre === null || in_.undantag) {
        assert.equal(x.pOre, in_.aOre, "ej berättigad: P = A");
        continue;
      }
      assert.ok(x.pOre >= Math.min(in_.aOre, in_.golvOre), "aldrig under G (eller A om G > A)");
      assert.ok(x.pOre >= procentAv(in_.aOre, b.procent), "aldrig mer än procenten");
      if (x.begransning === "golv") {
        // Hela procent: den högsta som golvet tillåter, och ingen högre.
        const h = hogstaProcent(in_.aOre, in_.golvOre);
        assert.equal(x.pOre, procentAv(in_.aOre, h), "golvbegränsad rad i hela procent");
        assert.ok(h < b.procent, "golvet begränsar bara under korgens procent");
        assert.ok(procentAv(in_.aOre, h + 1) < in_.golvOre, "en procent till hade gått under G");
      }
    }
    if (b.summaAOre >= FRI_FRAKT_ORE) assert.ok(b.summaPOre >= FRI_FRAKT_ORE, "fri frakt behålls");
    if (b.friFraktSkydd) {
      // Närmast över gränsen: ett öre mindre per exemplar på någon rad med rabatt kvar hade gått under.
      const minstaAntal = Math.min(...b.rader.filter((x) => x.pOre < x.aOre).map((x) => x.antal), Infinity);
      assert.ok(b.summaPOre - FRI_FRAKT_ORE < Math.max(1, minstaAntal) || minstaAntal === Infinity);
    }
    assert.equal(b.rabattOre, b.summaAOre - b.summaPOre);
  }
});
