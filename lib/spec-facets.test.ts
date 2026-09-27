// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Specfiltrens tolkning, låst mot verkliga beskrivningar ur katalogen
// (2026-09-27). Regeln är "hellre tom än fel": en produkt utan värde försvinner
// bara när just det filtret används, ett fel värde hamnar på fel ställe.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  lasMatt, lasSpec, lasAlder, specRader, inomIntervall, harMaterial,
  specSkala, specOversikt, specFor, specSlug, lasSpecSlug, specEtikett, specUndre, specOvre,
  type Spec,
} from "./spec-facets.ts";

test("mått: tre tal utan förklaring är bredd × djup × höjd", () => {
  assert.deepEqual(lasMatt("82 × 35 × 76 cm"), { b: 82, d: 35, h: 76 });
  assert.deepEqual(lasMatt("200 x 100 x 80 cm"), { b: 200, d: 100, h: 80 });
});

test("mått: förklaring i parentes och justerbar höjd som intervall", () => {
  assert.deepEqual(lasMatt("76 × 56 × 120–187,5 cm (B × D × H)"), { b: 76, d: 56, h: [120, 187.5] });
  assert.deepEqual(lasMatt("103 × 80 × 88 cm (bredd × djup × höjd)"), { b: 103, d: 80, h: 88 });
});

test("mått: bokstäver vid talen, före eller efter", () => {
  assert.deepEqual(lasMatt("600L x 300B x 197H cm"), { b: 600, d: 300, h: 197 });
  assert.deepEqual(lasMatt("L245 x B200 x H198 cm"), { b: 245, d: 200, h: 198 });
  assert.deepEqual(lasMatt("71H × 113–166L cm"), { h: 71, b: [113, 166] });
});

test("mått: diameter och meter", () => {
  assert.deepEqual(lasMatt("Ø16 × 125 cm"), { b: 16, d: 16, h: 125 });
  assert.deepEqual(lasMatt("5,97 × 2,95 m"), { b: 597 });
});

test("mått: två tal utan förklaring ger bara bredden", () => {
  assert.deepEqual(lasMatt("60 × 180 cm"), { b: 60 });
});

test("mått: flera mått där bara ett går att läsa → inget alls", () => {
  assert.equal(lasMatt("ca 60 x ungefär 180 cm"), null);
});

test("spec-rader: tabell och text", () => {
  const r = specRader("<table><tr><td>Mått</td><td>82 × 35 × 76 cm</td></tr></table><p>Vikt: 14,5 kg<br>Maxlast: 30 kg</p>");
  assert.equal(r.get("mått"), "82 × 35 × 76 cm");
  assert.equal(r.get("vikt"), "14,5 kg");
  assert.equal(r.get("maxlast"), "30 kg");
});

test("spec: kartongens mått läses aldrig som produktens", () => {
  const s = lasSpec("Byrå", "<p>Paketmått: 155 × 39 × 12 cm</p><p>Vikt: 20 kg</p>");
  assert.equal(s?.b, undefined);
  assert.equal(s?.kg, 20);
});

test("spec: fåtölj med produktens egen rad och sitthöjd i en mening", () => {
  const html = "<p>Fåtölj:  74 × 82 × 89 cm</p><p>Fotpall:  56 × 44 cm, höjd 45–51 cm</p>"
    + "<p>Sits:  74 × 45 cm, sitthöjd 50 cm</p><p>Paketmått:  79 × 69 × 45 cm</p><p>Material: sammet och stål</p>";
  const s = lasSpec("Läsfåtölj i beige manchester med fotpall – snurrbar, 20 cm tjock sits", html);
  assert.deepEqual([s?.b, s?.d, s?.h, s?.sh], [74, 82, 89, 50]);
  assert.equal(s?.m, "my");
});

test("spec: ett ensamt mått i namnet är ingen bredd (\"bred sits på 79 cm\")", () => {
  const s = lasSpec("Loungefåtölj med fotpall – bred sits på 79 cm", "<p>Material: chenille</p>");
  assert.equal(s?.b, undefined);
});

test("spec: julgranens höjd ur namnet och diametern ur texten", () => {
  const s = lasSpec("Julgran 183 cm med 2380 grenspetsar", "<p>En konstgjord julgran på 183 cm med 2380 grenspetsar och 110 cm diameter.</p>");
  assert.deepEqual([s?.h, s?.b, s?.d], [183, 110, 110]);
});

test("spec: effekt och volym, men aldrig en längd som volym", () => {
  const ugn = lasSpec("Bänkugn 28 liter med två kokplattor, 2600 W totalt", "<p>Effekt: 2600 W</p>");
  assert.equal(ugn?.w, 2600);
  assert.equal(ugn?.l, 28);
  assert.equal(lasSpec("Värmare 2,2 kW", "")?.w, 2200);
  assert.equal(lasSpec("Växthus 200L x 75B x 188H cm", "")?.l, undefined);
});

test("ålder: spann, månader och öppet uppåt", () => {
  assert.deepEqual(lasAlder("3–8 år"), [3, 8]);
  assert.deepEqual(lasAlder("12–60 månader"), [1, 5]);
  assert.deepEqual(lasAlder("från 3 år"), [3, 99]);
  assert.deepEqual(lasAlder("3+ år"), [3, 99]);
});

test("material: flera klasser, och PE-duk räknas som plast", () => {
  assert.equal(lasSpec("Hylla", "<p>Material: stål och MDF</p>")?.m, "tm");
  assert.equal(lasSpec("Växthus", "<p>Material: Stål, PE-nätmaterial</p>")?.m, "mp");
});

test("filter: justerbar höjd passar urval som överlappar", () => {
  const s: Spec = { h: [73, 89] };
  assert.ok(inomIntervall(s, "h", 80, 100));
  assert.ok(inomIntervall(s, "h", 60, 75));
  assert.ok(!inomIntervall(s, "h", 90, 120));
  assert.ok(!inomIntervall({}, "h", 0, 999), "saknat värde passar aldrig");
});

test("filter: material är ELLER mellan valen", () => {
  assert.ok(harMaterial({ m: "tm" }, "my"));
  assert.ok(!harMaterial({ m: "tm" }, "y"));
  assert.ok(!harMaterial({}, "t"));
});

test("skala: kapar svansen och kräver spridning", () => {
  const v = [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 400];
  const s = specSkala(v)!;
  assert.ok(s.max < 400 && s.openTop);
  assert.equal(specSkala([50, 50, 50, 50, 50, 50, 50, 50]), null);
  assert.equal(specSkala([10, 20, 30]), null);
});

test("översikt: filtret visas bara när minst 60 % har värdet", () => {
  const med = Array.from({ length: 10 }, (_, i) => ({ spec: { b: 40 + i * 10 } as Spec }));
  const utan = Array.from({ length: 10 }, () => ({ spec: undefined }));
  assert.equal(specOversikt([...med, ...utan.slice(0, 4)], [{ nyckel: "b", namn: "Bredd" }]).length, 1);
  assert.equal(specOversikt([...med, ...utan], [{ nyckel: "b", namn: "Bredd" }]).length, 0);
});

test("översikt: material kräver minst två material med minst två produkter", () => {
  const items = [...Array(5).fill({ spec: { m: "t" } }), ...Array(5).fill({ spec: { m: "m" } })];
  const f = specOversikt(items, [{ nyckel: "m", namn: "Material" }]);
  assert.equal(f.length, 1);
  assert.deepEqual(f[0].nyckel === "m" ? f[0].val : null, [["t", 5], ["m", 5]]);
  assert.equal(specOversikt(Array(10).fill({ spec: { m: "t" } }), [{ nyckel: "m", namn: "Material" }]).length, 0);
});

test("specFor: bara kategorins nycklar skickas", () => {
  assert.deepEqual(specFor({ b: 1, kg: 2, m: "t" }, new Set(["b", "m"] as const)), { b: 1, m: "t" });
  assert.equal(specFor({ kg: 2 }, new Set(["b"] as const)), undefined);
});

test("URL: slug fram och tillbaka, skräp ger hela skalan", () => {
  const s = { min: 40, max: 200, step: 5, openTop: false };
  assert.equal(specSlug(40, 200, s), "");
  assert.equal(specSlug(40, 120, s), "under-120");
  assert.equal(specSlug(60, 200, s), "over-60");
  assert.equal(specSlug(60, 120, s), "60-120");
  assert.deepEqual(lasSpecSlug("60-120", s), [60, 120]);
  assert.deepEqual(lasSpecSlug("under-120", s), [40, 120]);
  assert.deepEqual(lasSpecSlug("skräp", s), [40, 200]);
  assert.deepEqual(lasSpecSlug("300-400", s), [40, 200]);
  assert.equal(specEtikett(60, 120, s, "cm"), "60–120 cm");
  assert.equal(specEtikett(40, 120, s, "cm"), "Upp till 120 cm");
  assert.equal(specUndre(40, s), -Infinity);
  assert.equal(specOvre(200, s), Infinity);
});
