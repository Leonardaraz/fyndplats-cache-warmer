// Att PriceRunner- och Prisjakt-flödena verkligen får EAN-kartan FLODE_GTIN
// (lib/feed/flode-gtin.ts). Kör:
// node --test --experimental-strip-types lib/feed/flode-gtin-anvandning.test.ts
//
// ☠️ VARFÖR (2026-11-15). #917 lade CDON-koderna i FLODE_GTIN och skickade
// kartan från rutterna. #919 flyttade bygget till egna byggare
// (lib/feed/harledda.ts och lib/feed/prisjakt-hemlig.ts), skrivna mot den gamla
// koden: PriceRunner utan karta och det hemliga Prisjakt-flödet med
// PRISJAKT_GTIN. Båda kompilerar (kartan är valfri, och typen tar båda
// formerna), och inget annat prov läser anropen. En vanlig konfliktlösning
// hade alltså tyst tagit bort cirka 3 000 koder ur två flöden. Byggarna går
// inte att ladda här (de importerar med @/), så provet läser källan.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROT = join(import.meta.dirname, "..", "..");
const las = (p: string) => readFileSync(join(ROT, p), "utf8");

function filer(dir: string): string[] {
  const ut: string[] = [];
  for (const namn of readdirSync(dir)) {
    if (namn === "node_modules" || namn.startsWith(".")) continue;
    const p = join(dir, namn);
    if (statSync(p).isDirectory()) ut.push(...filer(p));
    else if (/\.(ts|tsx)$/.test(namn) && !/\.test\.ts$/.test(namn)) ut.push(p);
  }
  return ut;
}

const kod = (rel: string) =>
  las(rel)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

describe("☠️ PriceRunner- och Prisjakt-flödena får FLODE_GTIN", () => {
  it("PriceRunner-byggaren väljer koderna ur FLODE_GTIN", () => {
    const t = kod("lib/feed/harledda.ts");
    assert.match(t, /import \{ FLODE_GTIN \} from "@\/lib\/feed\/flode-gtin";/);
    assert.match(t, /tillPricerunner\(\s*googleXml,[\s\S]*?\},\s*gtinUrval\(googleXml, FLODE_GTIN\),?\s*\)/);
  });

  it("det hemliga Prisjakt-flödet byggs med FLODE_GTIN", () => {
    const t = kod("lib/feed/prisjakt-hemlig.ts");
    assert.match(t, /import \{ FLODE_GTIN \} from "@\/lib\/feed\/flode-gtin";/);
    assert.match(t, /tillPrisjakt\([\s\S]*?\},\s*FLODE_GTIN,\s*motorn\.artiklar,?\s*\)/);
  });

  // Borttaget 2026-11-26: Prisjakt läser den hemliga adressen, och det öppna
  // flödet bar samma EAN-koder för vem som helst.
  it("☠️ det öppna Prisjakt-flödet finns inte längre", () => {
    assert.throws(() => kod("app/feed/prisjakt.xml/route.ts"), /ENOENT/);
  });

  it("varje fil som bygger ett PriceRunner- eller Prisjakt-flöde skickar FLODE_GTIN", () => {
    const byggare: string[] = [];
    for (const fil of filer(ROT)) {
      const rel = fil.slice(ROT.length + 1);
      if (!/^(app|lib|components)\//.test(rel)) continue;
      if (rel === "lib/feed/pricerunner.ts" || rel === "lib/feed/prisjakt.ts") continue;
      const t = kod(rel);
      if (!/\btillPricerunner\(|\btillPrisjakt\(/.test(t)) continue;
      byggare.push(rel);
      assert.match(t, /\bFLODE_GTIN\b/, `${rel} bygger ett flöde utan FLODE_GTIN`);
    }
    assert.deepEqual(byggare.sort(), ["lib/feed/harledda.ts", "lib/feed/prisjakt-hemlig.ts"]);
  });

  it("dealproffsens karta läses bara genom FLODE_GTIN", () => {
    const anvander: string[] = [];
    for (const fil of filer(ROT)) {
      const rel = fil.slice(ROT.length + 1);
      if (!/^(app|lib|components)\//.test(rel) || rel === "lib/feed/prisjakt-gtin.ts") continue;
      if (/\bPRISJAKT_GTIN\b/.test(kod(rel))) anvander.push(rel);
    }
    assert.deepEqual(anvander, ["lib/feed/flode-gtin.ts"]);
  });
});
