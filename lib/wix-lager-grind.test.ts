// Run: node --test --experimental-strip-types lib/wix-lager-grind.test.ts
//
// ☠️ Butikens tabeller bor bara i Wix (lib/wix-lager.ts) sedan 2026-11-05, och
// Neon sägs upp. En Postgres-väg som kommer tillbaka skriver då mot en databas
// som inte finns, och raden syns aldrig i Wix.
//
// Den förra grinden (2026-10-29 till 2026-11-05) krävde bara att en FIL som
// använde `sql` också frågade växeln någonstans. SMS-ruttens statusskrivning
// låg i en sådan fil utan att fråga, och skrev till Neon i en vecka efter
// växlingen. Den här grinden fäller därför på varje spår av Postgres, inte på
// en fil i taget.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROT = new URL("..", import.meta.url).pathname;

function filer(katalog: string): string[] {
  const ut: string[] = [];
  for (const namn of readdirSync(join(ROT, katalog))) {
    const rel = `${katalog}/${namn}`;
    const st = statSync(join(ROT, rel));
    if (st.isDirectory()) ut.push(...filer(rel));
    else if (/\.(ts|tsx|js|mjs)$/.test(namn) && !/\.test\.ts$/.test(namn)) ut.push(rel);
  }
  return ut;
}

const POSTGRES = [
  /from\s+["']@vercel\/postgres["']/,
  /from\s+["'](@\/lib\/db|\.{1,2}\/(\.\.\/)*db)["']/,
  /\bsql(\/\*sql\*\/)?`/,
  /\bsql\.query\(/,
  /\bsql<[^>]*>(\/\*sql\*\/)?`/,
  /\banvanderWix\(/,
];

test("☠️ ingen kod når Postgres eller frågar efter växeln", () => {
  const brister = [...filer("app"), ...filer("lib"), ...filer("components")].filter((f) => {
    const kod = readFileSync(join(ROT, f), "utf8");
    return POSTGRES.some((m) => m.test(kod));
  });
  assert.deepEqual(brister, []);
});

test("☠️ lib/db.ts och @vercel/postgres är borta", () => {
  assert.equal(existsSync(join(ROT, "lib/db.ts")), false);
  const paket = JSON.parse(readFileSync(join(ROT, "package.json"), "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  assert.equal(paket.dependencies?.["@vercel/postgres"], undefined);
  assert.equal(paket.devDependencies?.["@vercel/postgres"], undefined);
});

test("grinden ser varje form av Postgres", () => {
  const traffar = (kod: string) => POSTGRES.some((m) => m.test(kod));
  assert.equal(traffar('import { sql } from "@vercel/postgres";'), true);
  assert.equal(traffar('import { sql } from "@/lib/db";'), true);
  assert.equal(traffar("import { sql } from '../db';"), true);
  assert.equal(traffar("await sql/*sql*/`SELECT 1`"), true);
  assert.equal(traffar("await sql.query(text, [])"), true);
  assert.equal(traffar("const r = await sql<{ n: number }>/*sql*/`SELECT 1`"), true);
  assert.equal(traffar("if (await anvanderWix()) {"), true);
  assert.equal(traffar("const sqlText = 'x'"), false);
  assert.equal(traffar('import { sparning } from "@/lib/wix-lager";'), false);
  assert.equal(traffar('import { x } from "./dbg";'), false);
});
