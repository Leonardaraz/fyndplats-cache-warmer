// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Googles tagg hämtas först när besökaren rör sidan (taggLaddare i
// lib/consent.ts, 2026-11-12). Händelser som sker innan dess väntar i
// dataLayer, och taggen läser sidans adress när den kör. Utan en egen adress
// på händelsen hade produktsidans view_item räknats på nästa produkt när
// besökarens första tryck var på en länk.
//
// lib/analytics.ts importerar ./meta utan filändelse och går därför inte att
// köra här; provet läser källan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const kalla = readFileSync(new URL("./analytics.ts", import.meta.url), "utf8");
const send = kalla.slice(kalla.indexOf("function send("), kalla.indexOf("\n}\n", kalla.indexOf("function send(")));

test("varje händelse bär sidans adress när den sker, utan fragmentdel", () => {
  assert.match(send, /g\("event", eventName, \{ page_location: window\.location\.href\.split\("#"\)\[0\], \.\.\.params \}\)/);
});

test("en uttrycklig adress från anroparen vinner", () => {
  // page_location först och params sist: ett anrop som själv anger adressen
  // ska inte skrivas över.
  assert.ok(send.indexOf("page_location") < send.indexOf("...params"));
});

test("alla GA4-händelser går genom send", () => {
  // Ett direktanrop till gtag hade gått förbi adressen.
  const direkt = kalla.split("\n").filter((r) => /\bg\("event"/.test(r));
  assert.equal(direkt.length, 1, direkt.join("\n"));
});
