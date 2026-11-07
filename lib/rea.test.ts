// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// PUNKT 16 — /rea.
//
// Provet vaktar tre saker, och alla tre har en historia:
//
// 1. URVALET. REA-knappen i navigationen visas när `hasSale` är sant
//    (components/site.tsx), och sidan fylls av saleProducts() här. Det är TVÅ
//    regler som måste betyda samma sak. Gör de inte det leder knappen till en
//    tom sida — precis det fel som redan lagats en gång, när knappen pekade på
//    /kategori/rea (en kategori som aldrig funnits) och 307:ade till /butik.
//
// 2. ADRESSEN. Navigationen ska peka på /rea, inte på det gamla filtret
//    /alla-produkter?rea=1. En frågesträng är inget Google indexerar, och hela
//    poängen med punkten är att rean får en adress som kan rankas.
//
// 3. TEXTEN. Sidan får inte påstå hur mycket kunden sparar, eller mot vilket
//    pris nedsättningen räknas. Den uppgiften mäts först från och med punkt 14
//    och blir användbar efter 30 dagars historik — ett löfte här hade varit
//    exakt det påstående punkt 14 finns till för att kunna belägga.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { saleProducts, REA_TITLE, REA_H1, REA_META_DESC, REA_INTRO, reaLede } from "./rea.ts";

// ── 1. Urvalet ──────────────────────────────────────────────────────────
test("bara nedsatta OCH köpbara varor är fynd", () => {
  const katalog = [
    { id: "a", onSale: true, inStock: true },
    { id: "b", onSale: true, inStock: false },   // slutsåld rea = besvikelse
    { id: "c", onSale: false, inStock: true },
    { id: "d", onSale: false, inStock: false },
  ];
  assert.deepEqual(saleProducts(katalog).map((p) => p.id), ["a"]);
});

test("saknade fält räknas som nej, aldrig som ja", () => {
  // En produkt utan onSale/inStock ska inte glida in på /rea för att fälten
  // råkar vara undefined. Samma säkra riktning som lib/retur-frakt.ts.
  assert.deepEqual(saleProducts([{}, { onSale: true }, { inStock: true }]), []);
});

test("tom katalog ger tom lista, inte ett kast", () => {
  assert.deepEqual(saleProducts([]), []);
});

test("urvalsregeln är identisk med REA-knappens i navigationen", () => {
  // site.tsx avgör om knappen alls visas. Divergerar reglerna leder knappen
  // till en tom sida. Regeln är kort nog att jämföras som text.
  const site = readFileSync("components/site.tsx", "utf8");
  assert.match(
    site,
    /hasSale\s*=\s*\(await getProducts\(\)\)\.some\(\(p\) => p\.onSale && p\.inStock\)/,
    "hasSale i components/site.tsx matchar inte saleProducts() i lib/rea.ts",
  );
});

// ── 2. Adressen ─────────────────────────────────────────────────────────
test("navigationen pekar på /rea, inte på det gamla filtret", () => {
  for (const f of ["components/meganav.tsx", "components/mobilenav.tsx"]) {
    const src = readFileSync(f, "utf8");
    const rad = src.split("\n").find((l) => l.includes("hasSale &&") && l.includes("REA"));
    assert.ok(rad, `${f}: hittade ingen REA-länk`);
    assert.match(rad, /href="\/rea"/, `${f}: REA-länken pekar inte på /rea`);
  }
});

test("den gamla kategori-adressen 301:as till /rea", () => {
  const cfg = readFileSync("next.config.ts", "utf8");
  assert.match(
    cfg,
    /source:\s*"\/kategori\/rea"[\s\S]{0,80}?destination:\s*"\/rea"[\s\S]{0,60}?permanent:\s*true/,
    "saknar permanent redirect /kategori/rea → /rea",
  );
});

test("sidan finns och bär punktens titel och rubrik", () => {
  assert.equal(REA_TITLE, "REA – aktuella fynd & erbjudanden");
  assert.equal(REA_H1, "REA & aktuella fynd");
  const sida = readFileSync("app/rea/page.tsx", "utf8");
  assert.match(sida, /alternates|pageMeta\(REA_TITLE/, "canonical sätts inte via pageMeta");
  assert.match(sida, /"\/rea"/, "canonical-sökvägen är inte /rea");
});

// ── 3. Texten ───────────────────────────────────────────────────────────
test("ingen text på sidan påstår hur mycket kunden sparar", () => {
  // Jämförpriset finns inte förrän punkt 14 har 30 dagars historik. Tills dess
  // får sidan visa nedsatta varor — men inte kvantifiera nedsättningen i sin
  // egen brödtext.
  const PASTAENDE = /\bdu sparar\b|\bspara upp till\b|\btidigare pris\b|\bordinarie pris\b|\b\d+\s*%\s*(rabatt|billigare)\b/i;
  const texter = [REA_META_DESC, ...REA_INTRO, reaLede(0), reaLede(1), reaLede(42)];
  const bad = texter.filter((t) => PASTAENDE.test(t));
  assert.deepEqual(bad, []);
});

test("ledet säger sanningen i alla tre lägena", () => {
  assert.match(reaLede(0), /är inget nedsatt/i);
  assert.match(reaLede(1), /^En vara/);
  assert.ok(reaLede(42).startsWith("42 varor"), reaLede(42));
  // Aldrig "1 varor" — punkt 17a:s fel får inte återuppstå på en ny sida.
  assert.doesNotMatch(reaLede(1), /\b1 varor\b/);
});

test("brödtexten är egen och inte tom", () => {
  // En permanent landningssida utan egen text är bara ett filtrerat rutnät i
  // Googles ögon, vilket är precis vad punkten vill bort ifrån.
  assert.ok(REA_INTRO.length >= 2, "för få stycken");
  const ord = REA_INTRO.join(" ").split(/\s+/).length;
  assert.ok(ord >= 60, `bara ${ord} ord brödtext`);
});
