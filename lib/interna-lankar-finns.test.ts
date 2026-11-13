// Varje fast intern länk på startsidan och /butik leder till en sida som finns.
//
// /butik fick genvägar till /under-500-kr och /under-1000-kr innan de sidorna
// fanns, och båda gav 404 i produktion (Leonard 2026-11-13). Proven, bygget och
// webbläsarkontrollerna gick igenom, eftersom ingen av dem följde länkarna.
// Provet läser källan och slår upp varje adress i app/: en mapp per led, ett
// dynamiskt led ([slug]) får ta vilket värde som helst, och sist ska det finnas
// en page.tsx. En omdirigering räknas inte som en sida: länken ska gå direkt dit.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const rot = join(import.meta.dirname, "..");
const app = join(rot, "app");

/** Finns det en sida för adressen i app/? */
function sidaFinns(adress: string): boolean {
  const ren = adress.split(/[?#]/)[0];
  let kat = app;
  for (const led of ren.split("/").filter(Boolean)) {
    const exakt = join(kat, led);
    if (existsSync(exakt) && statSync(exakt).isDirectory()) {
      kat = exakt;
      continue;
    }
    const dynamisk = readdirSync(kat).find((n) => /^\[[^.[\]]+\]$/.test(n) && statSync(join(kat, n)).isDirectory());
    if (!dynamisk) return false;
    kat = join(kat, dynamisk);
  }
  return existsSync(join(kat, "page.tsx"));
}

/** Fasta interna adresser i en källfil: href="/…" och href: "/…". */
function fastaLankar(fil: string): string[] {
  const text = readFileSync(join(rot, fil), "utf8");
  const ut = new Set<string>();
  for (const m of text.matchAll(/href(?:=|:\s*)"(\/[^"]*)"/g)) ut.add(m[1]);
  return [...ut];
}

describe("fasta interna länkar leder till en sida", () => {
  it("uppslaget hittar sidor och känner igen en som saknas", () => {
    assert.ok(sidaFinns("/"));
    assert.ok(sidaFinns("/rea"));
    assert.ok(sidaFinns("/blogg/vilket-inlagg-som-helst"));
    assert.ok(sidaFinns("/under-500-kr/mobler"));
    assert.ok(!sidaFinns("/finns-inte-alls"));
    assert.ok(!sidaFinns("/kopguider"), "/kopguider är en omdirigering till /blogg, ingen sida");
  });

  for (const fil of ["app/page.tsx", "app/butik/page.tsx", "components/price-hub-page.tsx"]) {
    it(fil, () => {
      const lankar = fastaLankar(fil);
      assert.ok(lankar.length > 0, `inga fasta länkar hittade i ${fil}`);
      const saknas = lankar.filter((l) => !sidaFinns(l));
      assert.deepEqual(saknas, [], `${fil} länkar till sidor som inte finns`);
    });
  }

  it("prisgränsernas översikter finns för varje gräns i PRICE_TIERS", () => {
    const programmatic = readFileSync(join(rot, "lib", "seo", "programmatic.ts"), "utf8");
    const granser = programmatic.match(/PRICE_TIERS = \[([\d,\s]+)\] as const/);
    assert.ok(granser, "PRICE_TIERS hittades inte");
    for (const g of granser[1].split(",").map((s) => s.trim())) {
      assert.ok(sidaFinns(`/under-${g}-kr`), `/under-${g}-kr saknar en sida`);
    }
  });
});
