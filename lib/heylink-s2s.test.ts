// lib/heylink-s2s.test.ts — köpet till Heylink från servern (lib/heylink-s2s.ts).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  HEYLINK_API,
  HEYLINK_SIDA,
  arProduktion,
  heylinkAdress,
  heylinkKropp,
  heylinkNyckel,
  skickaTillHeylink,
  tvatta,
} from "./heylink-s2s.ts";
import { giltigtKlickId, klickForKassan, nyttMarke, type HeylinkKop } from "./heylink.ts";
import { klickId, avsiktParametrar } from "./kassa/flode.ts";

// Påhittad nyckel med samma form som Heylinks (bokstäver och siffror). Den
// riktiga står bara i Vercel.
const NYCKEL = "NYCKEL" + "x".repeat(40) + "0123456789";
const KLICK = "1022ea3e58444dac5cc144959c08029";
const ROT = new URL("../", import.meta.url).pathname;
const las = (rel: string) => readFileSync(join(ROT, rel), "utf8");

const KOP: HeylinkKop = {
  orderId: "10234",
  orderSubTotal: 479.2,
  orderTotal: 659,
  orderTax: 131.8,
  orderShippingSubTotal: 48,
  orderCurrencyCode: "SEK",
  orderItems: [{ itemId: "v-1", itemName: "Soffbord", itemPrice: 479.2, itemQuantity: 1 }],
};

describe("nyckeln", () => {
  it("godtar bara en nyckel på minst 32 bokstäver och siffror", () => {
    assert.equal(heylinkNyckel(NYCKEL), NYCKEL);
    assert.equal(heylinkNyckel(` ${NYCKEL}\n`), NYCKEL);
    for (const v of [undefined, "", "kort", "x".repeat(31), `${NYCKEL}&a=1`, `${NYCKEL} x`]) assert.equal(heylinkNyckel(v), null, String(v));
  });

  it("bara produktionen skickar", () => {
    assert.equal(arProduktion({ VERCEL_ENV: "production" }), true);
    assert.equal(arProduktion({ VERCEL_ENV: "preview", NODE_ENV: "production" }), false);
    assert.equal(arProduktion({ NODE_ENV: "development" }), false);
    assert.equal(arProduktion({}), false);
  });

  it("☠️ adressen bär nyckeln, och tvatta tar bort den ur allt som loggas", () => {
    const adress = heylinkAdress(NYCKEL);
    assert.ok(adress.startsWith(`${HEYLINK_API}?`));
    const q = new URL(adress).searchParams;
    assert.equal(q.get("secretKey"), NYCKEL);
    assert.equal(q.get("pageUrl"), HEYLINK_SIDA);
    assert.doesNotMatch(tvatta(`fel mot ${adress}`, NYCKEL), new RegExp(NYCKEL));
    assert.match(tvatta(`fel mot ${adress}`, NYCKEL), /<nyckel>/);
  });
});

describe("kroppen", () => {
  it("är köpet med klick-id:t, samtycket och momssatsen, med Heylinks fältnamn", () => {
    const k = heylinkKropp(KOP, KLICK);
    assert.equal(k.hltid, KLICK);
    assert.equal(k.consentStatus, "marketing");
    assert.equal(k.orderTaxRate, 25);
    assert.equal(k.orderId, "10234");
    assert.equal(k.orderSubTotal, 479.2);
    assert.equal(k.orderTotal, 659);
    assert.equal(k.orderShippingSubTotal, 48);
    assert.equal(k.orderCurrencyCode, "SEK");
    assert.deepEqual(k.orderItems, KOP.orderItems);
    // Ingen frakt med moms utan momssats, och inga fält Heylink inte känner till.
    assert.equal("orderShipping" in k, false);
  });
});

describe("skickaTillHeylink", () => {
  it("POST med JSON till adressen med nyckeln, och ok på Heylinks svar", async () => {
    const anrop: { url: string; init: RequestInit }[] = [];
    const hamta = (async (url: string, init: RequestInit) => {
      anrop.push({ url, init });
      return new Response(JSON.stringify({ code: 200, data: { success: true }, message: "success" }), { status: 200 });
    }) as unknown as typeof fetch;
    const u = await skickaTillHeylink(heylinkKropp(KOP, KLICK), NYCKEL, hamta);
    assert.deepEqual(u, { ok: true, status: 200 });
    assert.equal(anrop.length, 1);
    assert.equal(anrop[0].url, heylinkAdress(NYCKEL));
    assert.equal(anrop[0].init.method, "POST");
    assert.equal((anrop[0].init.headers as Record<string, string>)["Content-Type"], "application/json");
    assert.ok(anrop[0].init.signal, "anropet har en tidsgräns");
    assert.equal(JSON.parse(String(anrop[0].init.body)).hltid, KLICK);
  });

  it("ett nej från Heylink och ett nätfel blir utfall, aldrig ett kast, och orsaken bär aldrig nyckeln", async () => {
    const nej = (async (url: string) => new Response(`bad key in ${url}`, { status: 401, statusText: "Unauthorized" })) as unknown as typeof fetch;
    const a = await skickaTillHeylink(heylinkKropp(KOP, KLICK), NYCKEL, nej);
    assert.equal(a.ok, false);
    assert.equal(a.ok === false && a.status, 401);
    assert.doesNotMatch(a.ok === false ? a.orsak : "", new RegExp(NYCKEL));

    const lyckadesInte = (async () => new Response(JSON.stringify({ data: { success: false } }), { status: 200 })) as unknown as typeof fetch;
    assert.equal((await skickaTillHeylink(heylinkKropp(KOP, KLICK), NYCKEL, lyckadesInte)).ok, false);

    const natfel = (async (url: string) => {
      throw new TypeError(`fetch failed: ${url}`);
    }) as unknown as typeof fetch;
    const b = await skickaTillHeylink(heylinkKropp(KOP, KLICK), NYCKEL, natfel);
    assert.equal(b.ok, false);
    assert.equal(b.ok === false && b.status, null);
    assert.doesNotMatch(b.ok === false ? b.orsak : "", new RegExp(NYCKEL));
  });
});

describe("klick-id:t i kassan", () => {
  it("kassan skickar klicket bara med samtycke och bara ett klick som inte gått ut", () => {
    const nu = Date.UTC(2026, 10, 26, 12);
    const marke = nyttMarke(KLICK, nu - 24 * 3600 * 1000);
    assert.equal(klickForKassan(marke, true, nu), KLICK);
    assert.equal(klickForKassan(marke, false, nu), null);
    assert.equal(klickForKassan(nyttMarke(KLICK, nu - 31 * 24 * 3600 * 1000), true, nu), null);
    assert.equal(klickForKassan(null, true, nu), null);
  });

  it("kassans regel för klick-id:t är densamma som lib/heylink.ts", () => {
    for (const v of [KLICK, "abc", "a".repeat(8), "a".repeat(128), "a".repeat(129), "abc def12", "abc/def12", "abc.def-_1", 12345678, null, undefined]) {
      assert.equal(klickId(v), giltigtKlickId(v), String(v));
    }
  });

  it("betalningen bär klick-id:t bara när det är giltigt", () => {
    assert.equal(avsiktParametrar("korg-1", 65900, [], KLICK).metadata.hltid, KLICK);
    assert.equal("hltid" in avsiktParametrar("korg-1", 65900, []).metadata, false);
    assert.equal("hltid" in avsiktParametrar("korg-1", 65900, [], "skräp med mellanslag").metadata, false);
  });
});

describe("koden runt anropet", () => {
  it("☠️ nyckeln läses bara i stripe-kassa.ts, och ingen loggrad där bär adressen eller nyckeln", () => {
    const kassa = las("lib/kassa/stripe-kassa.ts");
    assert.match(kassa, /heylinkNyckel\(process\.env\.HEYLINK_SECRET_KEY\)/);
    for (const rad of kassa.split("\n").filter((r) => /console\.(log|info|warn|error)\(/.test(r))) {
      assert.doesNotMatch(rad, /nyckel\b|heylinkAdress|secretKey|hltid\b/, `loggraden bär något hemligt: ${rad.trim().slice(0, 100)}`);
    }
    const lasare: string[] = [];
    for (const fil of filer(join(ROT, "app")).concat(filer(join(ROT, "lib")), filer(join(ROT, "components")))) {
      if (/\.test\.ts$/.test(fil)) continue;
      if (/process\.env\.HEYLINK_SECRET_KEY/.test(readFileSync(fil, "utf8"))) lasare.push(fil.slice(ROT.length));
    }
    assert.deepEqual(lasare, ["lib/kassa/stripe-kassa.ts"]);
  });

  it("forbered tar klick-id:t bara när samtyckeskakan säger ja", () => {
    const rutt = las("app/api/kassa/stripe/forbered/route.ts");
    assert.match(rutt, /const hltid = samtycke \? giltigtKlickId\(body\?\.hltid\) : null;/);
    assert.match(rutt, /forberedStripe\(deps, \{ cartId, kund: prov\.varden, avsiktId, hltid \}\)/);
  });

  it("☠️ ingen fil i repot bär något som liknar Heylinks nyckel (64 hextecken)", () => {
    const traffar: string[] = [];
    for (const fil of filer(ROT)) {
      if (/(^|[^0-9a-f])[0-9a-f]{64}([^0-9a-f]|$)/.test(readFileSync(fil, "utf8"))) traffar.push(fil.slice(ROT.length));
    }
    assert.deepEqual(traffar, []);
  });
});

function filer(dir: string): string[] {
  const HOPPA = new Set(["node_modules", ".next", ".git", ".vercel", "coverage"]);
  const TEXT = /\.(ts|tsx|js|mjs|cjs|json|md|mdx|yml|yaml|txt|xml|html|css|sql|sh|env)$/i;
  const ut: string[] = [];
  for (const namn of readdirSync(dir)) {
    if (HOPPA.has(namn)) continue;
    const vag = join(dir, namn);
    const st = statSync(vag);
    if (st.isDirectory()) ut.push(...filer(vag));
    else if (TEXT.test(namn) && st.size < 5_000_000) ut.push(vag);
  }
  return ut;
}
