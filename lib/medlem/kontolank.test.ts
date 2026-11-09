// Menylänken "Mitt konto" (lib/medlem/kontolank.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

test("sidhuvudet håller knappens plats från första ritningen: inget hopp när svaret kommer (CLS 0,002 → 0)", () => {
  const komp = readFileSync(new URL("../../components/konto-lank.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
  // Okänt läge från början, också på servern; bara ett nej tar bort knappen.
  assert.match(komp, /useState<Kontolank>\(\{ synlig: null,/);
  const lank = komp.slice(komp.indexOf("export function KontoLank()"), komp.indexOf("export function KontoFotLank()"));
  assert.match(lank, /if \(synlig === false\) return null;/);
  assert.doesNotMatch(lank, /if \(!synlig\) return null;/);
  // Medan frågan pågår: osynlig, utanför tabbordningen och för skärmläsare.
  assert.match(lank, /data-vantar=\{vantar \? "" : undefined\}/);
  assert.match(lank, /aria-hidden=\{vantar \? true : undefined\}/);
  assert.match(lank, /tabIndex=\{vantar \? -1 : undefined\}/);
  assert.match(css, /\.konto-btn\[data-vantar\]\{visibility:hidden\}/);
  // visibility, aldrig display: platsen ska finnas, så att :has(.konto-btn) gäller direkt.
  assert.doesNotMatch(css, /\.konto-btn\[data-vantar\]\{[^}]*display:none/);
});
