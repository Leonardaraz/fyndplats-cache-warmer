// Repot kör node --test (se package.json) — syskonmodulen importeras MED .ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FARGVAL_FILTER,
  FARGVAL_OMFORSOK_MS,
  FARGVAL_SIDTAK,
  fargvalKropp,
  hamtaFargval,
  type FargvalSvar,
} from "./product-colors-paging.ts";

// En kedja sidor som products/query svarar med. Varje produkt får ett id och
// en option; `tolka` bestämmer om optionen bär en färg. Sidan avgörs av
// markören, så ett nytt försök får samma sida. `fel` slår till de första
// `ganger` gångerna sidan efterfrågas (varje gång utan `ganger`), med en
// status eller ett nätfel.
type Fel = { sida: number; status?: number; ganger?: number; natfel?: boolean };
function wix(storlekar: number[], fel?: Fel) {
  const kroppar: unknown[] = [];
  const forsok = new Map<number, number>();
  const post = async (kropp: unknown): Promise<FargvalSvar> => {
    kroppar.push(kropp);
    const markor = (kropp as { query: { cursorPaging: { cursor?: string } } }).query.cursorPaging.cursor;
    const sida = markor ? Number(markor.slice("markor-".length)) + 1 : 1;
    const n = (forsok.get(sida) ?? 0) + 1;
    forsok.set(sida, n);
    if (fel && fel.sida === sida && n <= (fel.ganger ?? Infinity)) {
      if (fel.natfel) throw new TypeError("fetch failed");
      return { ok: false, status: fel.status ?? 500, json: async () => ({}) };
    }
    const i = sida - 1;
    const forst = storlekar.slice(0, i).reduce((a, b) => a + b, 0);
    const products = Array.from({ length: storlekar[i] ?? 0 }, (_, k) => {
      const id = `p${forst + k}`;
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

// Pausen före ett nytt försök, utan att vänta på riktigt.
function klocka() {
  const pauser: number[] = [];
  return { pauser, vanta: async (ms: number) => void pauser.push(ms) };
}

// Varannan produkt har ett färgord i valet, varannan inte.
type Option = { choicesSettings?: { choices?: { name?: string }[] } };
const tolka = (options: Option[] | undefined) => {
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

test("ett fel som står kvar efter omförsöken KASTAR i stället för att ge en halv karta", async () => {
  // En halv karta ger fel antal i facetten och ser frisk ut.
  const { post, kroppar } = wix([100, 100, 39], { sida: 2, status: 429 });
  const { pauser, vanta } = klocka();
  await assert.rejects(
    hamtaFargval(post, tolka, undefined, undefined, vanta),
    /HTTP 429 på sida 2 — visar hellre ingen facett/,
  );
  // Sida ett en gång, sida två i tre försök, och sida tre aldrig.
  assert.equal(kroppar.length, 4);
  assert.deepEqual(pauser, FARGVAL_OMFORSOK_MS);
});

test("en tillfällig 503 försöks om på samma sida, och kartan blir hel", async () => {
  // Produktionen 2026-10-29: "färgfrågan svarade HTTP 503 på sida 11" åtta
  // gånger på sex timmar. Varje gång försvann färgfiltret för hela instansen.
  const { post, kroppar } = wix([100, 100, 39], { sida: 2, status: 503, ganger: 1 });
  const { pauser, vanta } = klocka();
  const { farger, medOptioner, omforsok } = await hamtaFargval(post, tolka, undefined, undefined, vanta);
  assert.equal(medOptioner, 239);
  assert.equal(farger.size, 120);
  assert.equal(omforsok, 1);
  assert.deepEqual(pauser, [FARGVAL_OMFORSOK_MS[0]]);
  // Omförsöket skickar samma markör som försöket före, inte filtret.
  assert.equal(kroppar.length, 4);
  assert.deepEqual(kroppar[1], kroppar[2]);
  assert.deepEqual(kroppar[2], { query: { cursorPaging: { limit: 100, cursor: "markor-1" } } });
});

test("ett nätfel försöks om på samma sätt", async () => {
  const { post } = wix([100, 100, 39], { sida: 3, natfel: true, ganger: 2 });
  const { pauser, vanta } = klocka();
  const { medOptioner, omforsok } = await hamtaFargval(post, tolka, undefined, undefined, vanta);
  assert.equal(medOptioner, 239);
  assert.equal(omforsok, 2);
  assert.deepEqual(pauser, FARGVAL_OMFORSOK_MS);
});

test("ett nätfel som står kvar kastar med sidan i meddelandet", async () => {
  const { post } = wix([100, 100, 39], { sida: 1, natfel: true });
  const { vanta } = klocka();
  await assert.rejects(
    hamtaFargval(post, tolka, undefined, undefined, vanta),
    /nätfel \(fetch failed\) på sida 1 — visar hellre ingen facett/,
  );
});

test("en annan 4xx kastar direkt, utan omförsök", async () => {
  // 400 INVALID_CURSOR blir inte bättre av att frågas igen.
  const { post, kroppar } = wix([100, 100, 39], { sida: 2, status: 400 });
  const { pauser, vanta } = klocka();
  await assert.rejects(hamtaFargval(post, tolka, undefined, undefined, vanta), /HTTP 400 på sida 2/);
  assert.equal(kroppar.length, 2);
  assert.deepEqual(pauser, []);
});

test("utan fel blir det inga omförsök och ingen paus", async () => {
  const { post } = wix([100, 39]);
  const { pauser, vanta } = klocka();
  const { omforsok } = await hamtaFargval(post, tolka, undefined, undefined, vanta);
  assert.equal(omforsok, 0);
  assert.deepEqual(pauser, []);
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
