// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// FAQ:n sa "Vårt kontor och lager finns på Bergviksgatan 10 i Södertälje".
// Bergviksgatan 10 är företagsadressen, och den var fram till 2026-10-16 också
// returadressen i returmejlen. Det är alltså inget lager. Hela sortimentet kommer från Aosom (MH Handel
// GmbH) och skickas från leverantörs- och logistikpartnerlager inom EU.
//
// Sju ytor till sa "vårt lager" eller "vårt EU-lager". Ingen av dem påstod något
// om Södertälje, men alla påstod ägande. Garanti-sidan och EU_STOCK_NOTE hade
// hela tiden rätt formulering ("lager inom EU", "EU-lager"), så det som drev
// isär var kopian runt omkring — samma mönster som returtexten.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["app", "lib", "components", "emails", "content", "docs"];
const EXT = /\.(ts|tsx|md|mdx)$/;
const SKIP = /node_modules|\.next|\.test\.tsx?$|lagerpastaende\.ts$/;

function files(dir: string, out: string[] = []): string[] {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e);
    if (SKIP.test(p)) continue;
    if (statSync(p).isDirectory()) files(p, out);
    else if (EXT.test(p)) out.push(p);
  }
  return out;
}

const prose = (t: string) =>
  t.replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1 ")
    .replace(/<\/?[A-Za-z][^>]*>/g, "")
    .replace(/\s+/g, " ");

const ALL = ROOTS.flatMap((r) => files(r)).map((p) => ({ p, t: prose(readFileSync(p, "utf8")) }));

test("det finns filer att granska", () => {
  assert.ok(ALL.length > 50, `hittade bara ${ALL.length} filer`);
});

test("ingen text påstår att Fyndplats har ett eget lager", () => {
  // "vårt lager", "vårt EU-lager", "eget lager" — alla påstår ägande av ett
  // lager vi inte har. Rätt formulering finns redan: "lager inom EU",
  // "EU-lager", "våra leverantörers och logistikpartners lager".
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    const m = t.match(/(vårt|vårat|eget|egna) (eu-)?lag(er|ret)/gi);
    if (m) bad.push(`${p}: ${[...new Set(m)].join(", ")}`);
  }
  assert.deepEqual(bad, []);
});

test("☠️ ingen text säger \"aldrig direkt från länder utanför\" (Leonard 2026-11-28)", () => {
  // Leonard: "det låter inte bra". Löftet sägs positivt i stället (nästa prov).
  // Integritetstexternas "överföring utanför EU/EES" handlar om personuppgifter
  // och fångas inte: mönstret kräver "från länder utanför" eller "skickar aldrig".
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    const m = t.match(/aldrig[^.]{0,30}från länder utanför|skickar aldrig direkt/gi);
    if (m) bad.push(`${p}: ${[...new Set(m)].join(", ")}`);
  }
  assert.deepEqual(bad, []);
});

test("löftet står med Leonards mening på Om oss, garantisidan, Vanliga frågor och tullinlägget", () => {
  const MENING = "Alla våra varor skickas från lager inom EU. Därför tillkommer ingen importtull eller förtullningsavgift.";
  for (const fil of [
    "app/omoss/page.tsx",
    "app/eu-lager-garanti/page.tsx",
    "app/vanliga-fragor/page.tsx",
    "content/blog/nya-tullreglerna-2026-eu-lager.md",
  ]) {
    assert.ok(prose(readFileSync(fil, "utf8")).includes(MENING), fil);
  }
});

test("företagsadressen kallas aldrig lager", () => {
  // Bergviksgatan 10 får stå som företagsadress — e-handelslagen kräver att den
  // finns — men den får inte beskrivas som ett lager.
  //
  // Att FÖRNEKA påståendet är precis vad vi vill. Första versionen av det här
  // provet föll på min egen rättelse — "det är inget lager" matchade lika bra
  // som "det är vårt lager", eftersom mönstret bara letade efter två ord nära
  // varandra. En nekning i samma mening friar därför.
  const NEKAT = /\b(inte|inget|ingen|aldrig)\b/i;
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    for (const re of [
      /Bergviksgatan[^.]{0,80}lag(er|ret)/gi,
      /lag(er|ret)[^.]{0,80}Bergviksgatan/gi,
      /(kontor och lager|lager och kontor)[^.]{0,60}Södertälje/gi,
    ]) {
      for (const m of t.match(re) || []) {
        if (!NEKAT.test(m)) bad.push(`${p}: ${m.slice(0, 90)}`);
      }
    }
  }
  assert.deepEqual(bad, []);
});
