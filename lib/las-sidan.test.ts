// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Skrollåset (lib/las-sidan.ts). Låset sitter på html, eftersom html har
// overflow-x:clip och ett lås på body därför aldrig nådde fönstret (2026-11-15).
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { lasSidan, oppnaLas, type Rot } from "./las-sidan.ts";

const rot = (overflow = "", gutter = "", bredd = 375): Rot => ({ style: { overflow, scrollbarGutter: gutter }, clientWidth: bredd });

test("ett lås döljer överflödet och släppet ger tillbaka det som stod förut", () => {
  const r = rot("", "", 375);
  const slapp = lasSidan(r, 375);
  assert.equal(r.style.overflow, "hidden");
  slapp();
  assert.equal(r.style.overflow, "");
  assert.equal(oppnaLas(), 0);

  const r2 = rot("auto", "", 375);
  const slapp2 = lasSidan(r2, 375);
  assert.equal(r2.style.overflow, "hidden");
  slapp2();
  assert.equal(r2.style.overflow, "auto");
});

test("två lås samtidigt: sidan släpps först när båda är släppta", () => {
  const r = rot();
  const forsta = lasSidan(r, 375);
  const andra = lasSidan(r, 375);
  assert.equal(oppnaLas(), 2);
  forsta();
  assert.equal(r.style.overflow, "hidden", "det andra låset håller kvar");
  andra();
  assert.equal(r.style.overflow, "");
  assert.equal(oppnaLas(), 0);
});

test("att släppa samma lås två gånger gör ingenting", () => {
  const r = rot();
  const forsta = lasSidan(r, 375);
  const andra = lasSidan(r, 375);
  forsta();
  forsta();
  assert.equal(r.style.overflow, "hidden", "det andra låset är kvar fast det första släpptes två gånger");
  assert.equal(oppnaLas(), 1);
  andra();
  assert.equal(r.style.overflow, "");
  assert.equal(oppnaLas(), 0);
});

test("rullningslistens plats hålls bara när det finns en rullningslist", () => {
  const medList = rot("", "", 1265);
  const slapp = lasSidan(medList, 1280);
  assert.equal(medList.style.scrollbarGutter, "stable");
  slapp();
  assert.equal(medList.style.scrollbarGutter, "");

  const utanList = rot("", "", 390);
  const slapp2 = lasSidan(utanList, 390);
  assert.equal(utanList.style.scrollbarGutter, "", "ingen lista, ingen reserverad plats");
  slapp2();

  const egen = rot("", "auto", 1265);
  const slapp3 = lasSidan(egen, 1280);
  slapp3();
  assert.equal(egen.style.scrollbarGutter, "auto", "det som stod förut kommer tillbaka");
});

// Källkoden: inget sätter längre overflow på body, och de sex ställena låser via modulen.
const ROT = new URL("..", import.meta.url).pathname;
function filer(dir: string): string[] {
  const ut: string[] = [];
  for (const namn of readdirSync(dir)) {
    const full = join(dir, namn);
    if (statSync(full).isDirectory()) ut.push(...filer(full));
    else if (/\.(ts|tsx)$/.test(namn) && !/\.test\.ts$/.test(namn)) ut.push(full);
  }
  return ut;
}

test("ingen komponent sätter overflow på body", () => {
  const traffar = [...filer(join(ROT, "components")), ...filer(join(ROT, "app")), ...filer(join(ROT, "lib"))].filter((f) =>
    /document\.body\.style\.overflow/.test(readFileSync(f, "utf8")),
  );
  assert.deepEqual(traffar.map((f) => f.slice(ROT.length)), []);
});

test("modulen låser html, och de sex ställena använder den", () => {
  const src = readFileSync(new URL("./las-sidan.ts", import.meta.url), "utf8");
  assert.match(src, /rot: Rot = document\.documentElement/);
  for (const fil of [
    "components/mobilenav.tsx",
    "components/shopbrowser.tsx",
    "components/categorydropdown-client.tsx",
    "components/gallery.tsx",
    "components/ProductReviews.tsx",
    "components/GoogleReviews.tsx",
  ]) {
    const k = readFileSync(join(ROT, fil), "utf8");
    assert.match(k, /import \{ lasSidan \} from "\.\.\/lib\/las-sidan"/, fil);
    assert.match(k, /lasSidan\(\)/, fil);
  }
});
