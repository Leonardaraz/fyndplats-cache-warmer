import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { HEMLIGA_FLODEN, MIN_KODLANGD, arHemligFil, flodeskod, hemligtFlode } from "./hemlig-adress.ts";

// Påhittade koder. De riktiga står bara i Vercel.
const KOD_P = "p".repeat(20) + "0123456789abcdef";
const KOD_G = "g".repeat(20) + "fedcba9876543210";
const MILJO = { PRICERUNNER_FLODE_KOD: KOD_P, GOWISH_FLODE_KOD: KOD_G };

const ROT = new URL("../../", import.meta.url).pathname;
const las = (rel: string) => readFileSync(join(ROT, rel), "utf8");

describe("flodeskod", () => {
  it("godtar en kod på minst 32 bokstäver och siffror", () => {
    assert.equal(flodeskod(KOD_P), KOD_P);
    assert.equal(flodeskod(` ${KOD_P} `), KOD_P);
  });

  it("ingen kod när variabeln saknas, är för kort eller bär andra tecken", () => {
    for (const v of [undefined, "", "x".repeat(MIN_KODLANGD - 1), `${KOD_P}/`, `${KOD_P}-x`, `${KOD_P}.xml`]) {
      assert.equal(flodeskod(v), null, String(v));
    }
  });
});

describe("hemligtFlode", () => {
  it("bara exakt <namn>-<kod>.xml, och varje flöde har sin egen kod", () => {
    assert.equal(hemligtFlode(`pricerunner-${KOD_P}.xml`, MILJO), "pricerunner.xml");
    assert.equal(hemligtFlode(`gowish-${KOD_G}.xml`, MILJO), "gowish.xml");
    for (const fil of [
      "pricerunner.xml",
      "gowish.xml",
      "prisjakt.xml",
      `pricerunner-${KOD_G}.xml`,
      `gowish-${KOD_P}.xml`,
      `prisjakt-${KOD_P}.xml`,
      `google-${KOD_P}.xml`,
      `pricerunner-${KOD_P}`,
      `pricerunner-${KOD_P}.xml.gz`,
      `pricerunner-${KOD_P.slice(1)}.xml`,
      `pricerunner-${KOD_P}x.xml`,
      `Pricerunner-${KOD_P}.xml`,
      `pricerunner-${KOD_P.toUpperCase()}.xml`,
      `gz/pricerunner-${KOD_P}.xml`,
      "",
    ]) {
      assert.equal(hemligtFlode(fil, MILJO), null, fil);
    }
  });

  it("utan kod, eller med en för kort, finns ingen hemlig adress för det flödet", () => {
    assert.equal(hemligtFlode(`pricerunner-${KOD_P}.xml`, {}), null);
    assert.equal(hemligtFlode("pricerunner-.xml", {}), null);
    assert.equal(hemligtFlode("pricerunner-kort.xml", { PRICERUNNER_FLODE_KOD: "kort" }), null);
    // GoWish-flödet har kvar sin adress när bara PriceRunners kod saknas.
    assert.equal(hemligtFlode(`gowish-${KOD_G}.xml`, { GOWISH_FLODE_KOD: KOD_G }), "gowish.xml");
    assert.equal(arHemligFil(`gowish-${KOD_G}.xml`, "gowish", null), false);
  });

  it("namnet i loggen är ett namn, aldrig en adress", () => {
    for (const { namn, prefix, variabel } of Object.values(HEMLIGA_FLODEN)) {
      assert.doesNotMatch(namn, /[/.]|\.xml/, namn);
      assert.match(prefix, /^[a-z]+$/);
      assert.match(variabel, /^[A-Z]+_FLODE_KOD$/);
    }
  });

  it("varje flöde med hemlig adress har en sparad kopia, så adressen svarar direkt", () => {
    const lager = las("lib/feed/flodeslager.ts").match(/export const LAGRADE_FLODEN = \[([^\]]*)\]/)?.[1] ?? "";
    for (const flode of Object.keys(HEMLIGA_FLODEN)) assert.ok(lager.includes(`"${flode}"`), `${flode} saknas i LAGRADE_FLODEN`);
  });
});

describe("rutten på de hemliga adresserna", () => {
  const rutt = las("app/feed/[fil]/route.ts");

  it("☠️ läser aldrig anropets adress, så koden kan inte hamna i en loggrad", () => {
    assert.doesNotMatch(rutt, /request\.url|nextUrl|pathname/);
    // tomtFlodeSvar loggar det den får, och de öppna rutterna skickar sin adress dit.
    assert.doesNotMatch(rutt, /tomtFlodeSvar/);
    for (const rad of rutt.split("\n").filter((r) => /console\.(log|info|warn|error)\(/.test(r))) {
      assert.doesNotMatch(rad, /\bfil\b|params/, `loggraden bär filnamnet: ${rad.trim().slice(0, 80)}`);
    }
  });

  it("varje svar bär X-Robots-Tag: noindex, också 404 och 503", () => {
    const svar = rutt.match(/new Response\(|flodessvarUrKopia\(|flodessvar\(xml|huvudsvar\(/g) ?? [];
    const medNoindex = rutt.match(/\.\.\.NOINDEX/g) ?? [];
    assert.ok(svar.length >= 7, `väntade minst sju svar, såg ${svar.length}`);
    assert.equal(medNoindex.length, svar.length, "ett svar i rutten saknar ...NOINDEX");
  });

  it("PriceRunner- och GoWish-flödet byggs med samma byggare som de öppna rutterna, utan artikelnummer", () => {
    assert.match(rutt, /"pricerunner\.xml": pricerunnerXml,\n\s*"gowish\.xml": gowishXml,/);
    const harlett = rutt.slice(rutt.indexOf("async function harlettFlode("), rutt.indexOf("export async function GET("));
    assert.ok(harlett.length > 200);
    assert.doesNotMatch(harlett, /hamtaPrisjaktArtiklar|prisjaktHemligXml|PRISJAKT_HEMLIG_KOPIA/);
  });

  it("☠️ det öppna Prisjakt-flödet är borta, och adressen faller till 404 här", () => {
    assert.equal(existsSync(join(ROT, "app/feed/prisjakt.xml")), false);
    assert.equal(hemligtFlode("prisjakt.xml", MILJO), null);
  });
});

describe("inget flöde i ett sökindex", () => {
  it("next.config.ts sätter X-Robots-Tag: noindex på allt under /feed/ och på /api/feed/products.xml", () => {
    const config = las("next.config.ts");
    for (const source of ["/feed/:fil*", "/api/feed/products.xml"]) {
      const i = config.indexOf(`source: "${source}",`);
      assert.ok(i > 0, `regeln för ${source} saknas`);
      assert.match(config.slice(i, i + 160), /headers: \[\{ key: "X-Robots-Tag", value: "noindex" \}\]/, source);
    }
    // Bildsitemapen är en sitemap och ska läsas av sökmotorerna.
    assert.doesNotMatch(config, /source: "\/api\/feed\/:|source: "\/api\/feed\/image-sitemap/);
  });
});

// ☠️ Koderna får aldrig stå i repot. Testet letar efter något som ser ut som en
// hemlig adress i allt som checkas in, och efter kod som läser variablerna
// någon annanstans än i lib/feed/hemlig-adress.ts.
describe("de hemliga adresserna i repot", () => {
  const HOPPA = new Set(["node_modules", ".next", ".git", ".vercel", "coverage"]);
  const TEXT = /\.(ts|tsx|js|mjs|cjs|json|md|mdx|yml|yaml|txt|xml|html|css|sql|sh|env)$/i;
  const MONSTER = /(pricerunner|gowish)-[A-Za-z0-9]{32,}\.xml/;

  function* filer(dir: string): Generator<string> {
    for (const namn of readdirSync(dir)) {
      if (HOPPA.has(namn)) continue;
      const vag = join(dir, namn);
      const st = statSync(vag);
      if (st.isDirectory()) yield* filer(vag);
      else if (TEXT.test(namn) && st.size < 5_000_000) yield vag;
    }
  }

  it("ingen fil bär en adress på formen pricerunner-<lång kod>.xml eller gowish-<lång kod>.xml", () => {
    const traffar: string[] = [];
    const laser: string[] = [];
    for (const fil of filer(ROT)) {
      const rel = fil.slice(ROT.length);
      const text = readFileSync(fil, "utf8");
      if (MONSTER.test(text)) traffar.push(rel);
      if (/^(app|lib|components)\//.test(rel) && !/\.test\.ts$/.test(rel) && /process\.env\.(PRICERUNNER|GOWISH)_FLODE_KOD|miljo\[/.test(text)) laser.push(rel);
    }
    assert.deepEqual(traffar, []);
    assert.deepEqual(laser, ["lib/feed/hemlig-adress.ts"]);
  });
});
