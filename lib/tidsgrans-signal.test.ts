// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// ☠️ AbortSignal.timeout saknas i Safari före 16.0 och kastar då synkront. Den
// 6 november 2026 kom ett sådant anrop in i en effekt som körs på varje sida
// (lib/use-klarna-ruta.ts), och i två veckor visade varje sida "Något gick fel"
// i Safari på iOS 14 och 15. Mätt på riktiga telefoner 2026-11-20.
//
// En spärr man måste komma ihåg glöms bort: felet stod redan antecknat i
// components/card-gallery.tsx. Det här provet går importerna från varje fil
// med "use client" och fäller om någon fil som kan hamna i webbläsaren anropar
// AbortSignal.timeout själv, i stället för tidsgransSignal.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tidsgransSignal } from "./tidsgrans-signal.ts";

const ROT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function filerUnder(katalog: string): string[] {
  const ut: string[] = [];
  for (const namn of readdirSync(katalog)) {
    if (namn === "node_modules" || namn.startsWith(".")) continue;
    const p = join(katalog, namn);
    if (statSync(p).isDirectory()) ut.push(...filerUnder(p));
    else if (/\.tsx?$/.test(namn) && !/\.test\.tsx?$/.test(namn) && !namn.endsWith(".d.ts")) ut.push(p);
  }
  return ut;
}

/** Källtexten utan kommentarer, så att en förklaring i en kommentar inte fäller provet. */
const utanKommentarer = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1");

const arKlientfil = (t: string) => /^\s*["']use client["']/.test(utanKommentarer(t));

/** De filer en fil drar in när den körs: import, export från, och import(). Rena typimporter räknas inte. */
function importer(fil: string, t: string): string[] {
  const kod = utanKommentarer(t);
  const spec: string[] = [];
  for (const m of kod.matchAll(/(?:^|\n)\s*(?:import|export)\s+(type\s+)?[^;"']*?from\s+["']([^"']+)["']/g)) if (!m[1]) spec.push(m[2]);
  for (const m of kod.matchAll(/(?:^|\n)\s*import\s+["']([^"']+)["']/g)) spec.push(m[1]);
  for (const m of kod.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) spec.push(m[1]);
  const ut: string[] = [];
  for (const s of spec) {
    const bas = s.startsWith("@/") ? join(ROT, s.slice(2)) : s.startsWith(".") ? resolve(dirname(fil), s) : null;
    if (!bas) continue;
    const traff = [bas, `${bas}.ts`, `${bas}.tsx`, join(bas, "index.ts"), join(bas, "index.tsx")].find((p) => /\.tsx?$/.test(p) && existsSync(p) && statSync(p).isFile());
    if (traff) ut.push(traff);
  }
  return ut;
}

function klientnabara(): { filer: Set<string>; starter: number } {
  const alla = ["app", "components", "lib"].flatMap((k) => filerUnder(join(ROT, k)));
  const text = new Map(alla.map((f) => [f, readFileSync(f, "utf8")]));
  const ko = alla.filter((f) => arKlientfil(text.get(f)!));
  const starter = ko.length;
  const sedda = new Set(ko);
  while (ko.length) {
    const f = ko.pop()!;
    for (const i of importer(f, text.get(f) ?? readFileSync(f, "utf8"))) {
      if (!sedda.has(i)) {
        sedda.add(i);
        ko.push(i);
      }
    }
  }
  return { filer: sedda, starter };
}

describe("tidsgransSignal", () => {
  it("ger webbläsarens egen signal när AbortSignal.timeout finns", () => {
    const s = tidsgransSignal(60_000);
    assert.ok(s instanceof AbortSignal);
    assert.equal(s.aborted, false);
  });

  it("ger en signal som avbryts efter tidsgränsen när AbortSignal.timeout saknas (Safari före 16)", async () => {
    const egen = Object.getOwnPropertyDescriptor(AbortSignal, "timeout")!;
    // @ts-expect-error: härmar en webbläsare utan AbortSignal.timeout
    delete AbortSignal.timeout;
    try {
      assert.equal(typeof (AbortSignal as { timeout?: unknown }).timeout, "undefined");
      const s = tidsgransSignal(20);
      assert.ok(s instanceof AbortSignal, "ingen signal alls");
      assert.equal(s.aborted, false);
      await new Promise((klar) => setTimeout(klar, 80));
      assert.equal(s.aborted, true, "signalen avbröts inte efter tidsgränsen");
    } finally {
      Object.defineProperty(AbortSignal, "timeout", egen);
    }
  });

  it("kastar aldrig, inte ens utan AbortController", () => {
    const sparad = globalThis.AbortController;
    const egen = Object.getOwnPropertyDescriptor(AbortSignal, "timeout")!;
    // @ts-expect-error: härmar en webbläsare utan AbortSignal.timeout
    delete AbortSignal.timeout;
    // @ts-expect-error: och utan AbortController
    globalThis.AbortController = undefined;
    try {
      assert.equal(tidsgransSignal(10), undefined);
    } finally {
      globalThis.AbortController = sparad;
      Object.defineProperty(AbortSignal, "timeout", egen);
    }
  });
});

describe("kod som kan hamna i webbläsaren anropar inte AbortSignal.timeout själv", () => {
  const { filer, starter } = klientnabara();
  const egen = join(ROT, "lib", "tidsgrans-signal.ts");

  it("provet ser klientkoden: många startfiler, och de kända filerna är med", () => {
    assert.ok(starter > 60, `bara ${starter} filer med "use client" hittades`);
    for (const f of ["lib/use-klarna-ruta.ts", "components/favoriter-hamtning.ts", "lib/sok-index.ts", "lib/sok-rankning.ts", "components/wishlist.tsx"]) {
      assert.ok(filer.has(join(ROT, f)), `${f} räknas inte som klientkod: importgrafen läses fel`);
    }
  });

  it("ingen sådan fil innehåller AbortSignal.timeout(", () => {
    const syndare = [...filer]
      .filter((f) => f !== egen && /AbortSignal\s*\.\s*timeout\s*\(/.test(utanKommentarer(readFileSync(f, "utf8"))))
      .map((f) => relative(ROT, f))
      .sort();
    assert.deepEqual(syndare, [], `använd tidsgransSignal (lib/tidsgrans-signal.ts) i: ${syndare.join(", ")}`);
  });

  it("hjälparen själv frågar om funktionen finns innan den anropas", () => {
    const t = readFileSync(egen, "utf8");
    assert.match(t, /typeof AbortSignal\.timeout === "function"\) return AbortSignal\.timeout\(ms\)/);
  });
});
