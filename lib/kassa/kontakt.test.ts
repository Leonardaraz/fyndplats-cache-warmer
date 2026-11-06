// Kassans e-post till Wix-korgen för påminnelsemejlen (kontaktUrKropp i lib/kassa/formular.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { kontaktUrKropp } from "./formular.ts";

const KORG = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

test("en giltig e-post och ett giltigt nummer skickas, numret i E.164", () => {
  assert.deepEqual(kontaktUrKropp({ cartId: KORG, epost: " info+prov-1@fyndplats.com ", telefon: "070-123 45 67" }), {
    cartId: KORG,
    epost: "info+prov-1@fyndplats.com",
    telefon: "+46701234567",
  });
});

test("ett ogiltigt eller saknat nummer stoppar inte e-posten", () => {
  assert.deepEqual(kontaktUrKropp({ cartId: KORG, epost: "kund@example.se", telefon: "12" }), { cartId: KORG, epost: "kund@example.se", telefon: null });
  assert.deepEqual(kontaktUrKropp({ cartId: KORG, epost: "kund@example.se" }), { cartId: KORG, epost: "kund@example.se", telefon: null });
});

test("utan giltig e-post eller korg skickas ingenting", () => {
  for (const b of [
    null,
    {},
    { cartId: KORG },
    { cartId: KORG, epost: "kund@" },
    { cartId: KORG, epost: "kund@example" },
    { cartId: KORG, epost: 42 },
    { cartId: "inte-ett-id", epost: "kund@example.se" },
    { cartId: `${KORG}x`, epost: "kund@example.se" },
    { epost: "kund@example.se" },
  ]) {
    assert.equal(kontaktUrKropp(b), null, JSON.stringify(b));
  }
});
