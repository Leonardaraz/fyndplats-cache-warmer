// Sidhuvudets vägval (lib/sidhuvud-val.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { harRea, valjSidhuvud, type SidhuvudKallor } from "./sidhuvud-val.ts";

const MENY = { tree: [{ slug: "mobler" }], hasSale: true };
const DELAD = { tree: [{ slug: "fran-cachen" }], hasSale: false };

function kallor(o: { laddad: boolean; deladFaller?: boolean }) {
  const anrop: string[] = [];
  const k: SidhuvudKallor<{ slug: string }> = {
    laddad: () => o.laddad,
    levande: async () => {
      anrop.push("levande");
      return MENY;
    },
    delad: async () => {
      anrop.push("delad");
      if (o.deladFaller) throw new Error("ingen cache");
      return DELAD;
    },
  };
  return { k, anrop };
}

test("varm instans: bygger ur katalogen och rör inte datacachen", async () => {
  const { k, anrop } = kallor({ laddad: true });
  assert.deepEqual(await valjSidhuvud(k), MENY);
  assert.deepEqual(anrop, ["levande"]);
});

test("kall instans: läser datacachen och väntar inte in katalogen", async () => {
  const { k, anrop } = kallor({ laddad: false });
  assert.deepEqual(await valjSidhuvud(k), DELAD);
  assert.deepEqual(anrop, ["delad"]);
});

test("kall instans där datacachen faller: bygger ur katalogen som förut", async () => {
  const { k, anrop } = kallor({ laddad: false, deladFaller: true });
  assert.deepEqual(await valjSidhuvud(k), MENY);
  assert.deepEqual(anrop, ["delad", "levande"]);
});

test("REA-knappen kräver en nedsatt vara i lager", () => {
  assert.equal(harRea([]), false);
  assert.equal(harRea([{ onSale: true, inStock: false }, { onSale: false, inStock: true }]), false);
  assert.equal(harRea([{ onSale: false, inStock: true }, { onSale: true, inStock: true }]), true);
});

// Datacachens revalidate sänker den pågående renderingens (lib/kort-livslangd.ts).
// Ett lägre tal än produktsidans hade gjort varje produktsida som byggs på en
// kall instans kortlivad, och en tagg hade följt med till varje sida.
test("datacachen lever lika länge som produktsidan och har ingen tagg", () => {
  const kod = readFileSync(new URL("./sidhuvud-data.ts", import.meta.url), "utf8");
  assert.match(kod, /revalidate:\s*PRODUKTSIDA_SEKUNDER\s*[,}]/);
  assert.doesNotMatch(kod, /tags\s*:/);
  assert.match(kod, /katalogenArDegraderad/, "en degraderad katalog får aldrig cachas");
});

test("sidhuvudet väntar inte längre in katalogen själv", () => {
  const kod = readFileSync(new URL("../components/site.tsx", import.meta.url), "utf8");
  const sidhuvud = kod.slice(kod.indexOf("export async function SiteHeader"), kod.indexOf("export async function SiteFooter"));
  assert.match(sidhuvud, /sidhuvudsdata\(\)/);
  assert.doesNotMatch(sidhuvud, /getProducts\(|getCategoryTree\(/);
});
