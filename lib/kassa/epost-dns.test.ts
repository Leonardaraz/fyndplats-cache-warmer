// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { domanTarEmotEpost, type Uppslag } from "./epost-dns.ts";

const fel = (code: string) => () => Promise.reject(Object.assign(new Error(code), { code }));
const mx = (...namn: string[]) => () => Promise.resolve(namn.map((exchange, i) => ({ exchange, priority: 10 * (i + 1) })));
const adr = (...ip: string[]) => () => Promise.resolve(ip);
const fraga = (u: Uppslag) => domanTarEmotEpost("exempel.se", u, 50);

describe("domanTarEmotEpost", () => {
  it("e-postservrar finns: ja, utan att fråga efter adressen", async () => {
    let fragad = false;
    assert.equal(await fraga({ mx: mx("mx1.exempel.se", "mx2.exempel.se"), adress: () => ((fragad = true), Promise.resolve([])) }), "ja");
    assert.equal(fragad, false);
  });

  it("domänen finns inte: nej", async () => {
    assert.equal(await fraga({ mx: fel("ENOTFOUND"), adress: adr("1.2.3.4") }), "nej");
  });

  it("domänens eget nej (en ensam punkt, RFC 7505): nej", async () => {
    assert.equal(await fraga({ mx: mx("."), adress: adr("1.2.3.4") }), "nej");
  });

  it("inga e-postservrar men en adress: ja (e-posten levereras dit)", async () => {
    assert.equal(await fraga({ mx: fel("ENODATA"), adress: adr("1.2.3.4") }), "ja");
    assert.equal(await fraga({ mx: mx(), adress: adr("1.2.3.4") }), "ja");
  });

  it("varken e-postservrar eller adress: nej", async () => {
    assert.equal(await fraga({ mx: fel("ENODATA"), adress: fel("ENODATA") }), "nej");
    assert.equal(await fraga({ mx: fel("ENODATA"), adress: fel("ENOTFOUND") }), "nej");
    assert.equal(await fraga({ mx: mx(), adress: adr() }), "nej");
  });

  it("☠️ allt osäkert släpper igenom kunden: tidsgräns, trasig namnserver, okänt fel", async () => {
    const aldrig = () => new Promise<never>(() => {});
    assert.equal(await fraga({ mx: aldrig, adress: adr("1.2.3.4") }), "okant");
    for (const k of ["ETIMEOUT", "ESERVFAIL", "ECONNREFUSED", "EREFUSED", "", "NAGOT_NYTT"]) assert.equal(await fraga({ mx: fel(k), adress: adr("1.2.3.4") }), "okant", k);
    assert.equal(await fraga({ mx: fel("ENODATA"), adress: fel("ESERVFAIL") }), "okant");
    assert.equal(await fraga({ mx: fel("ENODATA"), adress: aldrig }), "okant");
    assert.equal(await fraga({ mx: () => Promise.reject(new Error("utan kod")), adress: adr() }), "okant");
  });
});

describe("rutten och kassan", () => {
  const rutt = readFileSync(new URL("../../app/api/kassa/epost-kontroll/route.ts", import.meta.url), "utf8");
  const kassa = readFileSync(new URL("../../app/kassa/kassa.tsx", import.meta.url), "utf8");
  const sida = readFileSync(new URL("../../app/kassa/page.tsx", import.meta.url), "utf8");

  it("rutten prövar formen först, hoppar över kända tjänster och loggar aldrig adressen", () => {
    assert.match(rutt, /const fel = epostFel\(epost\);\s*if \(fel\) return svar\(\{ svar: "nej", skal: fel \}\);/);
    assert.match(rutt, /if \(KANDA_DOMANER\.includes\(doman\)\) return svar\(\{ svar: "ja" \}\);/);
    assert.doesNotMatch(rutt, /console\.\w+\([^)]*(epost|doman|ascii)/);
    assert.match(rutt, /export const runtime = "nodejs";/);
  });

  it("kassan prövar adressen när kunden lämnar fältet, och bara ett säkert nej spärrar", () => {
    assert.match(kassa, /provaEpost\(varden\.epost\.trim\(\)\);/);
    assert.match(kassa, /if \(j\?\.svar !== "nej"\) return;/);
    assert.match(kassa, /\.catch\(\(\) => \{\}\);/);
    assert.equal(kassa.split("const prov = provaForm({ ...varden,").length - 1, 2, "båda betalvägarna ska pröva formuläret med domänens nej");
    assert.doesNotMatch(kassa, /const prov = provaKassa\(\{ \.\.\.varden,/);
  });

  it("ett tryck på förslaget släcker felet om den gamla adressen", () => {
    assert.match(kassa, /setVarden\(\(x\) => \(\{ \.\.\.x, epost: epostTips \}\)\);\s*\/\/[^\n]*\n\s*setFel\(\(x\) => \(x\.epost \? \{ \.\.\.x, epost: "" \} : x\)\);/);
  });

  it("förslaget står kvar bredvid felet", () => {
    assert.match(kassa, /const epostTips = rorda\.has\("epost"\) \? epostForslag\(varden\.epost\) : null;/);
    assert.match(kassa, /f === "epost" && epostTips \? <>\{epostFelUtanForslag\(felText \?\? ""\)\} \{hjalp\}<\/> : felText/);
  });

  it("den inloggade medlemmens e-post följer med till kassan och skrivs efter de sparade uppgifterna", () => {
    assert.match(sida, /medlemsEpost = \(await inloggad\(\)\)\?\.email \?\? null;/);
    assert.match(sida, /<Kassa stripeNyckel=\{stripeNyckel\} last=\{last\} medlemsEpost=\{medlemsEpost\} \/>/);
    const sparade = kassa.indexOf('lasJson<Partial<Varden>>("local", ADRESS_NYCKEL)');
    const medlem = kassa.indexOf("setVarden((v) => (v.epost === medlemsEpost ? v : { ...v, epost: medlemsEpost }));");
    assert.ok(sparade > 0 && medlem > sparade, "medlemmens effekt ska stå efter den som läser de sparade uppgifterna");
  });
});
