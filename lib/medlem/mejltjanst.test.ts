import { test } from "node:test";
import assert from "node:assert/strict";
import { AVSANDARE, mejltjanst } from "./mejltjanst.ts";

test("Gmail söker fram koden från avsändaren, också i skräpposten", () => {
  const t = mejltjanst("Kund@Gmail.com");
  assert.equal(t?.namn, "Gmail");
  assert.ok(t?.url.startsWith("https://mail.google.com/"));
  assert.ok(t?.url.includes(encodeURIComponent(AVSANDARE)));
  assert.ok(t?.url.includes("in%3Aanywhere"));
});

test("Outlook, iCloud och Yahoo känns igen på sina domäner", () => {
  assert.equal(mejltjanst("a@hotmail.se")?.namn, "Outlook");
  assert.equal(mejltjanst("a@outlook.com")?.namn, "Outlook");
  assert.equal(mejltjanst("a@icloud.com")?.namn, "iCloud Mail");
  assert.equal(mejltjanst("a@yahoo.se")?.namn, "Yahoo Mail");
});

test("en egen domän eller en trasig adress ger ingen genväg", () => {
  assert.equal(mejltjanst("info@fyndplats.com"), null);
  assert.equal(mejltjanst("utan-snabel-a"), null);
  assert.equal(mejltjanst(""), null);
});
