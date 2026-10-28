// Run: node --test --experimental-strip-types lib/wix-lager-grind.test.ts
//
// ☠️ Efter flytten till Wix (lib/wix-lager.ts) får ingen kod skriva till Neon
// utan att först fråga växeln. En fil som använder `sql` utan `anvanderWix`
// hade fortsatt skriva till Neon efter växlingen, och raden hade aldrig synts
// i Wix: samma tystnad som motorns /api/tracking-events 2026-09-01. Grinden
// läser källkoden och fäller på varje sådan fil.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROT = new URL("..", import.meta.url).pathname;

/** Kopieringen läser Neon med flit, oavsett växeln. */
const UNDANTAG = new Set(["app/api/admin/neon-till-wix/route.ts"]);

function filer(katalog: string): string[] {
  const ut: string[] = [];
  for (const namn of readdirSync(join(ROT, katalog))) {
    const rel = `${katalog}/${namn}`;
    const st = statSync(join(ROT, rel));
    if (st.isDirectory()) ut.push(...filer(rel));
    else if (/\.(ts|tsx)$/.test(namn) && !/\.test\.ts$/.test(namn)) ut.push(rel);
  }
  return ut;
}

const ANVANDER_SQL = /\bsql(\/\*sql\*\/)?`|\bsql\.query\(|\bsql<[^>]*>(\/\*sql\*\/)?`/;

test("☠️ varje fil som använder sql frågar växeln (anvanderWix) först", () => {
  const brister = [...filer("app"), ...filer("lib")]
    .filter((f) => !UNDANTAG.has(f))
    .filter((f) => {
      const kod = readFileSync(join(ROT, f), "utf8");
      return ANVANDER_SQL.test(kod) && !kod.includes("anvanderWix(");
    });
  assert.deepEqual(brister, []);
});

test("grinden ser en fil som använder sql utan växeln", () => {
  assert.equal(ANVANDER_SQL.test("await sql/*sql*/`SELECT 1`"), true);
  assert.equal(ANVANDER_SQL.test("await sql.query(text, [])"), true);
  assert.equal(ANVANDER_SQL.test("const r = await sql<{ n: number }>/*sql*/`SELECT 1`"), true);
  assert.equal(ANVANDER_SQL.test("const sqlText = 'x'"), false);
});
