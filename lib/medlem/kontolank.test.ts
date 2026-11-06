// Menylänken "Mitt konto" (lib/medlem/kontolank.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { kontolankText, visaKontolank } from "./kontolank.ts";

test("länken syns bara i läget pa, och bara när inloggningen är öppen", () => {
  assert.equal(visaKontolank("pa", true), true);
  assert.equal(visaKontolank("tyst", true), false);
  assert.equal(visaKontolank("av", true), false);
  // Utan hemligheten är inloggningen stängd: ingen länk till en stängd dörr.
  assert.equal(visaKontolank("pa", false), false);
});

test("länken säger Bli medlem tills tecknet säger att kunden är inloggad", () => {
  assert.equal(kontolankText(null), "Bli medlem");
  assert.equal(kontolankText(undefined), "Bli medlem");
  assert.equal(kontolankText(""), "Bli medlem");
  assert.equal(kontolankText("0"), "Bli medlem");
  assert.equal(kontolankText("1"), "Mitt konto");
  assert.equal(kontolankText("f"), "Mitt konto");
});
