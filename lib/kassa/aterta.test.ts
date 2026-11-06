// Påminnelsemejlets länk till vår kassa (lib/kassa/aterta.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { ATERTA_SOKVAG, BUTIK, aterHemlighet, aterLank, aterNyckel, aterVunnenIWix, kopSparrSedan, lasAterNyckel, medKod, valjAterLank } from "./aterta.ts";

const H = "en-hemlighet-som-ar-lang-nog-1234";
const KORG = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const ANNAN = "ffffffff-1111-4222-8333-444455556666";
const WIX = "http://www.fyndplats.se/__ecom/checkout?checkoutId=abc&recover=1";

test("nyckeln går att läsa tillbaka med samma hemlighet", () => {
  const k = aterNyckel(KORG, H);
  assert.equal(lasAterNyckel(k, H), KORG);
  // Stora bokstäver i id:t ger samma korg.
  assert.equal(lasAterNyckel(aterNyckel(KORG.toUpperCase(), H), H), KORG);
});

test("en ändrad signatur, en annan korg eller en annan hemlighet läses inte", () => {
  const k = aterNyckel(KORG, H);
  const [id, sig] = k.split(".");
  const annanSig = sig.slice(0, -1) + (sig.endsWith("A") ? "B" : "A");
  assert.equal(lasAterNyckel(`${id}.${annanSig}`, H), null);
  assert.equal(lasAterNyckel(`${ANNAN}.${sig}`, H), null);
  assert.equal(lasAterNyckel(k, "en-annan-hemlighet-lika-lang-12345"), null);
  assert.equal(lasAterNyckel(k, null), null);
});

test("trasiga nycklar läses inte", () => {
  for (const k of [undefined, null, 42, "", KORG, `${KORG}.`, `inte-ett-id.${aterNyckel(KORG, H).split(".")[1]}`, `${aterNyckel(KORG, H)}x`, "x".repeat(200)]) {
    assert.equal(lasAterNyckel(k, H), null, String(k));
  }
});

test("hemligheten: nyhetsbrevets först, sedan cronens, och bara om den är lång nog", () => {
  assert.equal(aterHemlighet({ NEWSLETTER_SECRET: H, CRON_SECRET: "cron-hemlighet-som-ocksa-ar-lang" }), H);
  assert.equal(aterHemlighet({ CRON_SECRET: H }), H);
  assert.equal(aterHemlighet({ CRON_SECRET: "kort" }), null);
  assert.equal(aterHemlighet({}), null);
});

test("länken leder till /kassa/aterta med nyckeln", () => {
  const l = aterLank(KORG, H);
  assert.ok(l.startsWith(`${BUTIK}${ATERTA_SOKVAG}?k=`));
  const k = new URL(l).searchParams.get("k");
  assert.equal(lasAterNyckel(k, H), KORG);
});

test("mejlet får vår länk bara när vår kassa är på, hemligheten finns och Wix gav korgens id", () => {
  assert.equal(valjAterLank({ egen: true, hemlighet: H, cartId: KORG, wixUrl: WIX }), aterLank(KORG, H));
  // Annars Wix länk, med https.
  const wix = "https://www.fyndplats.se/__ecom/checkout?checkoutId=abc&recover=1";
  assert.equal(valjAterLank({ egen: false, hemlighet: H, cartId: KORG, wixUrl: WIX }), wix);
  assert.equal(valjAterLank({ egen: true, hemlighet: null, cartId: KORG, wixUrl: WIX }), wix);
  assert.equal(valjAterLank({ egen: true, hemlighet: H, cartId: undefined, wixUrl: WIX }), wix);
  assert.equal(valjAterLank({ egen: true, hemlighet: H, cartId: "inte-ett-id", wixUrl: WIX }), wix);
  // Utan någon länk alls: butikens startsida.
  assert.equal(valjAterLank({ egen: false, hemlighet: H, cartId: KORG, wixUrl: null }), BUTIK);
  assert.equal(valjAterLank({ egen: false, hemlighet: H, cartId: KORG, wixUrl: "javascript:alert(1)" }), BUTIK);
});

test("rabattkoden följer bara med vår länk", () => {
  const var_ = aterLank(KORG, H);
  assert.equal(medKod(var_, "FP-AB12 CD"), `${var_}&kod=FP-AB12CD`);
  assert.equal(new URL(medKod(var_, "FP+5%")).searchParams.get("kod"), "FP+5%");
  assert.equal(medKod(var_, ""), var_);
  assert.equal(medKod(var_, null), var_);
  const wix = "https://www.fyndplats.se/__ecom/checkout?checkoutId=abc";
  assert.equal(medKod(wix, "FP-AB12"), wix);
  assert.equal(medKod(BUTIK, "FP-AB12"), BUTIK);
});

test("påminnelsen stoppas bara när Wix säger att kassan är återvunnen", () => {
  assert.equal(aterVunnenIWix({ abandonedCheckout: { status: "RECOVERED" } }), true);
  assert.equal(aterVunnenIWix({ abandonedCheckout: { status: "ABANDONED" } }), false);
  assert.equal(aterVunnenIWix({ abandonedCheckout: {} }), false);
  assert.equal(aterVunnenIWix({}), false);
  assert.equal(aterVunnenIWix(null), false);
});

test("ett köp från tre timmar före den övergivna kassan stoppar påminnelsen", () => {
  const kassan = "2026-01-15T12:00:00.000Z";
  assert.equal(kopSparrSedan(kassan), "2026-01-15T09:00:00.000Z");
  // Köpet strax efter att kunden lämnade korgen, före Wix övergivna kassa: stoppar.
  assert.ok("2026-01-15T11:05:00.000Z" >= kopSparrSedan(kassan)!);
  // Ett köp dagen före stoppar inte en ny påminnelse.
  assert.ok("2026-01-14T11:05:00.000Z" < kopSparrSedan(kassan)!);
  for (const t of [undefined, null, "", "inte ett datum"]) assert.equal(kopSparrSedan(t), null, String(t));
});
