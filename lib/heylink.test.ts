// Heylink: klick-id:t, det sparade klicket och ordern till tacksidan.
// Kör: node --test --experimental-strip-types lib/heylink.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  HEYLINK_DAGAR,
  HEYLINK_NYCKEL,
  HEYLINK_SKICKAD,
  HEYLINK_TAGG,
  giltigtKlickId,
  heylinkKop,
  klickIdUrSokdel,
  nyttMarke,
  tolkaMarke,
  type HeylinkOrder,
} from "./heylink.ts";

const ID = "1022ea3e58444dac5cc144959c08029";
const DYGN = 24 * 60 * 60 * 1000;

describe("klick-id:t", () => {
  it("Heylinks eget exempel är giltigt", () => {
    assert.equal(giltigtKlickId(ID), ID);
  });

  it("skräp sparas aldrig", () => {
    for (const fel of ["", "kort", "<script>alert(1)</script>", "a b c d e f g h", "ä".repeat(20), "x".repeat(129), 12345678, null, undefined, {}]) {
      assert.equal(giltigtKlickId(fel), null, String(fel));
    }
  });

  it("läses ur adressens sökdel, var det än står", () => {
    assert.equal(klickIdUrSokdel(`?hltid=${ID}`), ID);
    assert.equal(klickIdUrSokdel(`hltid=${ID}`), ID);
    assert.equal(klickIdUrSokdel(`?utm_source=gowish&hltid=${ID}&variant=abc`), ID);
    assert.equal(klickIdUrSokdel(`?HLTID=${ID}`), ID, "namnet jämförs utan hänsyn till skiftläge, som i Heylinks skript");
    assert.equal(klickIdUrSokdel(`?hltid=${ID}#omdomen`), ID);
  });

  it("andra parametrar är inte ett klick", () => {
    assert.equal(klickIdUrSokdel(""), null);
    assert.equal(klickIdUrSokdel("?"), null);
    assert.equal(klickIdUrSokdel(`?xhltid=${ID}`), null);
    assert.equal(klickIdUrSokdel(`?hltidx=${ID}`), null);
    assert.equal(klickIdUrSokdel("?hltid="), null);
    assert.equal(klickIdUrSokdel("?hltid"), null);
    assert.equal(klickIdUrSokdel("?hltid=%3Cscript%3E"), null);
    assert.equal(klickIdUrSokdel("?hltid=%E0%A4%A"), null, "ett värde som inte går att avkoda kastar inte");
  });

  it("det första giltiga värdet gäller", () => {
    assert.equal(klickIdUrSokdel(`?hltid=x&hltid=${ID}`), ID);
  });
});

describe("det sparade klicket", () => {
  const nu = Date.UTC(2026, 10, 25, 12);

  it("gäller i 30 dagar, samma tid som Heylinks inställning för kontot", () => {
    assert.equal(HEYLINK_DAGAR, 30);
    const sparat = nyttMarke(ID, nu);
    assert.deepEqual(tolkaMarke(sparat, nu), { id: ID, t: nu });
    assert.deepEqual(tolkaMarke(sparat, nu + 30 * DYGN), { id: ID, t: nu });
    assert.equal(tolkaMarke(sparat, nu + 30 * DYGN + 1), null);
  });

  it("ett klick långt i framtiden gäller inte: klockan har ställts om", () => {
    assert.deepEqual(tolkaMarke(nyttMarke(ID, nu + 3600_000), nu), { id: ID, t: nu + 3600_000 });
    assert.equal(tolkaMarke(nyttMarke(ID, nu + 2 * DYGN), nu), null);
  });

  it("trasigt eller ändrat innehåll är inget klick", () => {
    for (const fel of [null, undefined, "", "inte json", "null", "[]", '"text"', '{"id":"kort","t":1}', `{"id":"${ID}"}`, `{"id":"${ID}","t":"igår"}`, `{"id":"<b>","t":${nu}}`]) {
      assert.equal(tolkaMarke(fel, nu), null, String(fel));
    }
  });
});

describe("ordern till Heylink", () => {
  const order = (o: Partial<HeylinkOrder> = {}): HeylinkOrder => ({
    number: "10021",
    rader: [{ namn: "Elkamin", variant: "Färg: Svart", antal: 1, bild: "https://static.wixstatic.com/media/x.jpg", belopp: 769, produktId: "p-1", variantId: "v-1" }],
    frakt: 0,
    fraktExMoms: 0,
    totalt: 769,
    moms: 153.8,
    valuta: "SEK",
    ...o,
  });
  const GUID = "6f1c2c1e-0d3b-4b1f-9c2a-1a2b3c4d5e6f";

  it("varorna utan moms och frakt: 769 kr blir 615,20 (mätt på en riktig order 2026-10-09)", () => {
    assert.deepEqual(heylinkKop(order(), GUID), {
      orderId: "10021",
      orderSubTotal: 615.2,
      orderTotal: 769,
      orderCurrencyCode: "SEK",
      orderTax: 153.8,
      orderItems: [{ itemName: "Elkamin", itemQuantity: 1, itemId: "v-1", itemPrice: 615.2, itemVariant: "Färg: Svart", itemImageUrl: "https://static.wixstatic.com/media/x.jpg" }],
    });
  });

  it("frakten räknas bort utan moms", () => {
    // 299 kr vara + 19 kr frakt = 318 kr, varav moms 63,60. Frakten utan moms 15,20.
    const kop = heylinkKop(order({ rader: [{ namn: "Vara", antal: 1, belopp: 299 }], frakt: 19, fraktExMoms: 15.2, totalt: 318, moms: 63.6 }), GUID)!;
    assert.equal(kop.orderSubTotal, 239.2);
    assert.equal(kop.orderShippingSubTotal, 15.2);
    assert.equal(kop.orderTax, 63.6);
    assert.equal(kop.orderTotal, 318);
    assert.equal(kop.orderItems[0].itemPrice, 239.2);
  });

  it("saknar Wix frakten utan moms räknas den ur frakten med moms", () => {
    const kop = heylinkKop(order({ rader: [{ namn: "Vara", antal: 1, belopp: 299 }], frakt: 19, fraktExMoms: undefined, totalt: 318, moms: 63.6 }), GUID)!;
    assert.equal(kop.orderSubTotal, 239.2);
    assert.equal(kop.orderShippingSubTotal, 15.2);
  });

  it("saknar ordern momsen räknas den som 25 %", () => {
    const kop = heylinkKop(order({ moms: undefined }), GUID)!;
    assert.equal(kop.orderSubTotal, 615.2);
    assert.equal(kop.orderTax, undefined);
  });

  it("en rabatt följer med, eftersom totalen är det kunden betalade", () => {
    // Två varor för 500 kr styck, 100 kr rabatt: kunden betalade 900 kr, moms 180.
    const kop = heylinkKop(order({ rader: [{ namn: "Vara", antal: 2, belopp: 900 }], totalt: 900, moms: 180 }), GUID)!;
    assert.equal(kop.orderSubTotal, 720);
    assert.deepEqual(kop.orderItems, [{ itemName: "Vara", itemQuantity: 2, itemPrice: 360 }]);
  });

  it("beloppen är tal, inte text: skriptet läser en text som tusentalsavgränsad", () => {
    const kop = heylinkKop(order(), GUID)!;
    for (const v of [kop.orderSubTotal, kop.orderTotal, kop.orderTax, kop.orderItems[0].itemPrice]) assert.equal(typeof v, "number");
  });

  it("ordernumret är det läsbara, och Wix interna id bara när numret saknas", () => {
    assert.equal(heylinkKop(order({ number: null }), GUID)!.orderId, GUID);
    assert.equal(heylinkKop(order({ number: "0" }), GUID)!.orderId, GUID, "Wix ger 0 innan ordern är godkänd");
    assert.equal(heylinkKop(order({ number: null }), ""), null);
    assert.equal(heylinkKop(order({ number: null }), "<script>"), null);
  });

  it("en order utan total, eller där varorna inte kostar något, lämnas inte", () => {
    assert.equal(heylinkKop(order({ totalt: undefined }), GUID), null);
    assert.equal(heylinkKop(order({ totalt: 0 }), GUID), null);
    assert.equal(heylinkKop(order({ totalt: 19, moms: 3.8, frakt: 19, fraktExMoms: 15.2 }), GUID), null);
  });

  it("variantens id går före produktens, och en bild som inte är en https-adress utelämnas", () => {
    const kop = heylinkKop(order({ rader: [
      { namn: "A", antal: 1, belopp: 100, produktId: "p-1" },
      { namn: "B", antal: 1, belopp: 100, bild: "wix:image://v1/abc.jpg/fil.jpg" },
    ], totalt: 200, moms: 40 }), GUID)!;
    assert.equal(kop.orderItems[0].itemId, "p-1");
    assert.equal(kop.orderItems[1].itemId, undefined);
    assert.equal(kop.orderItems[1].itemImageUrl, undefined);
  });

  it("ordern bär varken namn, adress eller e-post", () => {
    assert.deepEqual(Object.keys(heylinkKop(order(), GUID)!).sort(), ["orderCurrencyCode", "orderId", "orderItems", "orderSubTotal", "orderTax", "orderTotal"]);
  });

  it("en okänd valuta blir SEK", () => {
    assert.equal(heylinkKop(order({ valuta: "kr" }), GUID)!.orderCurrencyCode, "SEK");
    assert.equal(heylinkKop(order({ valuta: "DKK" }), GUID)!.orderCurrencyCode, "DKK");
  });
});

// Komponenterna går inte att ladda här (React och "use client"), så proven läser källan.
describe("☠️ Heylinks skript laddas bara på tacksidan, efter samtycke och bara för ett klick från GoWish", () => {
  const ROT = join(import.meta.dirname, "..");
  const kod = (rel: string) =>
    readFileSync(join(ROT, rel), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

  function filer(dir: string): string[] {
    const ut: string[] = [];
    for (const namn of readdirSync(dir)) {
      if (namn === "node_modules" || namn.startsWith(".")) continue;
      const p = join(dir, namn);
      if (statSync(p).isDirectory()) ut.push(...filer(p));
      else if (/\.(ts|tsx|js|mjs|css)$/.test(namn) && !/\.test\.ts$/.test(namn)) ut.push(p);
    }
    return ut;
  }

  it("skriptets adress står på ett enda ställe, och ingen annan fil nämner Heylinks servrar", () => {
    assert.match(HEYLINK_TAGG, /^https:\/\/tag\.heylink\.com\/[0-9a-f-]{36}\/script\.js$/);
    const traffar: string[] = [];
    for (const dir of ["app", "components", "lib"]) {
      for (const fil of filer(join(ROT, dir))) {
        if (/heylink\.com|heylinkapi\.com/.test(kod(fil.slice(ROT.length + 1)))) traffar.push(fil.slice(ROT.length + 1));
      }
    }
    assert.deepEqual(traffar, ["lib/heylink.ts"]);
  });

  it("bara tacksidans komponent lägger in skriptet, och sätter ordern FÖRE det", () => {
    const anvander: string[] = [];
    for (const dir of ["app", "components", "lib"]) {
      for (const fil of filer(join(ROT, dir))) {
        const rel = fil.slice(ROT.length + 1);
        if (rel !== "lib/heylink.ts" && /\bHEYLINK_TAGG\b/.test(readFileSync(fil, "utf8"))) anvander.push(rel);
      }
    }
    assert.deepEqual(anvander, ["components/heylink-kop.tsx"]);
    const t = kod("components/heylink-kop.tsx");
    const order = t.indexOf("window.hlconversion = { ...kop, hltid: klickId };");
    const skript = t.indexOf("document.head.appendChild(tagg)");
    assert.ok(order > 0 && skript > order, "window.hlconversion sätts före skriptet");
    assert.match(t, /if \(!kop \|\| !hasMarketingConsent\(\)\) return;/);
    assert.match(t, /const marke = tolkaMarke\(window\.localStorage\.getItem\(HEYLINK_NYCKEL\), Date\.now\(\)\);\s*if \(!marke\) return;/);
    assert.match(t, /if \(window\.localStorage\.getItem\(HEYLINK_SKICKAD\) === kop\.orderId\) return;/);
    assert.match(t, /if \(document\.getElementById\(HEYLINK_TAGG_ID\)\) return;/);
    assert.match(t, /"heylink:conversion",[\s\S]*?setItem\(HEYLINK_SKICKAD, kop\.orderId\);\s*window\.localStorage\.removeItem\(HEYLINK_NYCKEL\);[\s\S]*?\{ once: true \}/);
  });

  it("tacksidan bygger ordern bara med samtycke i kakan, och bara i produktion", () => {
    const t = kod("app/tack/page.tsx");
    assert.match(t, /const heylink = samtycke && produktion \? heylinkKop\(info, orderId\) : null;/);
    assert.match(t, /const produktion = \(process\.env\.VERCEL_ENV \|\| process\.env\.NODE_ENV \|\| ""\)\.trim\(\) === "production";/);
    assert.match(t, /<HeylinkKop kop=\{heylink\} \/>/);
  });

  it("klicket fångas i layouten, sparas bara med samtycke och tas bort utan", () => {
    assert.match(kod("app/layout.tsx"), /\{IS_PRODUCTION && <HeylinkKlick \/>\}/);
    const t = kod("components/heylink-klick.tsx");
    assert.match(t, /klick = klickIdUrSokdel\(window\.location\.search\) \?\? klick;/);
    assert.match(t, /if \(hasMarketingConsent\(\)\) return;\s*try \{\s*window\.localStorage\.removeItem\(HEYLINK_NYCKEL\);\s*window\.localStorage\.removeItem\(HEYLINK_SKICKAD\);/);
    assert.match(t, /if \(!samtycke \|\| !klick\) return;\s*try \{\s*window\.localStorage\.setItem\(HEYLINK_NYCKEL, nyttMarke\(klick, Date\.now\(\)\)\);/);
    assert.doesNotMatch(t, /createElement|<Script|fetch\(|sendBeacon/, "landningen hämtar och skickar ingenting");
  });

  it("nycklarna i localStorage är butikens egna", () => {
    assert.equal(HEYLINK_NYCKEL, "fp_heylink");
    assert.equal(HEYLINK_SKICKAD, "fp_heylink_order");
  });

  it("sekretesspolicyn säger vad som sparas, vad Heylink får och vad som gäller utan samtycke", () => {
    const t = readFileSync(join(ROT, "app/sekretesspolicy/page.tsx"), "utf8");
    const punkt = t.split("\n").find((l) => l.includes("<strong>Heylink"));
    assert.ok(punkt, "punkten om Heylink saknas");
    for (const ord of ["GoWish", "klick-id", "högst 30 dagar", "ordernumret", "vilka varor", "IP-adress", "skickas inte", "bara nödvändiga cookies"]) {
      assert.ok(punkt.includes(ord), ord);
    }
    assert.match(t, /marknadsföringscookies \(Meta, TikTok, Google och Heylink\)/);
  });
});
