// Repot kör node --test (se package.json) — syskonmodulen importeras MED .ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FARGVAL_FILTER, FARGVAL_SIDTAK, fargvalKropp, hamtaFargval, type FargvalSvar } from "./product-colors-paging.ts";

// En kedja sidor som products/query svarar med. Varje produkt får ett id och
// en option; `tolka` bestämmer om optionen bär en färg.
function wix(storlekar: number[], fel?: { sida: number; status: number }) {
  const kroppar: any[] = [];
  let n = 0;
  const post = async (kropp: unknown): Promise<FargvalSvar> => {
    kroppar.push(kropp);
    const sida = kroppar.length;
    if (fel && fel.sida === sida) return { ok: false, status: fel.status, json: async () => ({}) };
    const i = sida - 1;
    const products = Array.from({ length: storlekar[i] ?? 0 }, () => {
      const id = `p${n++}`;
      return { id, options: [{ name: "Färg", choicesSettings: { choices: [{ name: id }] } }] };
    });
    const hasNext = i + 1 < storlekar.length;
    return {
      ok: true,
      status: 200,
      json: async () => ({ products, pagingMetadata: { hasNext, cursors: hasNext ? { next: `markor-${sida}` } : {} } }),
    };
  };
  return { post, kroppar };
}

// Varannan produkt har ett färgord i valet, varannan inte.
const tolka = (options: any) => {
  const namn = options?.[0]?.choicesSettings?.choices?.[0]?.name ?? "";
  return Number(namn.slice(1)) % 2 === 0 ? ["svart"] : [];
};

test("bara FÖRSTA sidan bär filtret, sedan går markören ensam", async () => {
  // Filter plus markör svarar 400 INVALID_CURSOR på products/query (uppmätt
  // 2026-09-24). Markören bär frågan, så sida två och tre ska inte ha filtret.
  const { post, kroppar } = wix([100, 100, 39]);
  await hamtaFargval(post, tolka);
  assert.equal(kroppar.length, 3);
  assert.deepEqual(kroppar[0], { query: { filter: FARGVAL_FILTER, cursorPaging: { limit: 100 } } });
  assert.deepEqual(kroppar[1], { query: { cursorPaging: { limit: 100, cursor: "markor-1" } } });
  assert.deepEqual(kroppar[2], { query: { cursorPaging: { limit: 100, cursor: "markor-2" } } });
});

test("frågan filtrerar på optioner, inte på de nyaste produkterna", () => {
  // De 5 100 nyaste produkterna hade noll optioner, och den ofiltrerade frågan
  // slutade efter 1 200. Facetten stod därför tom i produktion.
  assert.deepEqual(fargvalKropp().query.filter, { "options.id": { $exists: true } });
});

test("alla sidor läses, och kartan bär bara produkter med ett färgord", async () => {
  const { post } = wix([100, 100, 39]);
  const { farger, medOptioner } = await hamtaFargval(post, tolka);
  assert.equal(medOptioner, 239);
  assert.equal(farger.size, 120); // p0, p2 … p238
  assert.deepEqual(farger.get("p238"), ["svart"]);
  assert.equal(farger.has("p1"), false);
});

test("ett fel på en senare sida KASTAR i stället för att ge en halv karta", async () => {
  // En halv karta ger fel antal i facetten och ser frisk ut.
  const { post } = wix([100, 100, 39], { sida: 2, status: 429 });
  await assert.rejects(hamtaFargval(post, tolka), /HTTP 429 på sida 2 — visar hellre ingen facett/);
});

test("sidtaket kastar i stället för att kapa", async () => {
  const { post } = wix([100, 100, 100, 100]);
  await assert.rejects(hamtaFargval(post, tolka, 3), /fler än 3 sidor/);
  assert.ok(FARGVAL_SIDTAK >= 10);
});

test("en sida räcker när Wix inte har fler", async () => {
  const { post, kroppar } = wix([37]);
  const { medOptioner } = await hamtaFargval(post, tolka);
  assert.equal(medOptioner, 37);
  assert.equal(kroppar.length, 1);
});

test("butikens färghämtning går genom pagineringen och gör inte ISR-sidan dynamisk", () => {
  const t = readFileSync("lib/product-colors.ts", "utf8")
    .split("\n")
    .filter((rad) => !rad.trim().startsWith("//"))
    .join("\n");
  assert.match(t, /hamtaFargval\(/, "färgerna ska hämtas via hamtaFargval");
  assert.doesNotMatch(t, /cursorPaging/, "product-colors.ts ska inte bygga en egen fråga");
  assert.doesNotMatch(t, /MAX_PAGES/, "det gamla sidtaket på 12 ska inte tillbaka");
  // Hämtningen körs inne i getProducts, alltså i varje ISR-sida, precis som
  // orderhämtningen i lib/popularity.ts.
  assert.doesNotMatch(t, /no-store/, "no-store gör ISR-sidan dynamisk vid körning");
  assert.doesNotMatch(t, /revalidate:\s*0\b/, "revalidate 0 gör ISR-sidan dynamisk vid körning");
});
