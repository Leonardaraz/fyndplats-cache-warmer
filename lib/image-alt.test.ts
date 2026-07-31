// Run: node --test --experimental-strip-types lib/image-alt.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { altForImage, imgKey } from "./image-alt.ts";

const WIX = "https://static.wixstatic.com/media/b379ce_abc123~mv2.jpg/v1/fill/w_640,h_640/file.jpg";
const WIX_OTHER_TRANSFORM = "https://static.wixstatic.com/media/b379ce_abc123~mv2.jpg/v1/fit/w_1600,h_1600/file.jpg";

test("imgKey – samma foto med olika transform ger samma nyckel", () => {
  assert.equal(imgKey(WIX), "b379ce_abc123~mv2.jpg");
  assert.equal(imgKey(WIX), imgKey(WIX_OTHER_TRANSFORM));
  assert.equal(imgKey(""), "");
});

test("altForImage – Wix egen alt-text vinner", () => {
  const alts = { "b379ce_abc123~mv2.jpg": "Svart väggskåp med öppna dörrar" };
  assert.equal(altForImage(WIX, 0, "Väggskåp i stål", alts), "Svart väggskåp med öppna dörrar");
  // Även när samma foto kommer med annan transform-URL (nyckeln är fil-id:t).
  assert.equal(altForImage(WIX_OTHER_TRANSFORM, 3, "Väggskåp i stål", alts), "Svart väggskåp med öppna dörrar");
});

test("altForImage – faller tillbaka på produktnamn, numrerat efter första bilden", () => {
  assert.equal(altForImage(WIX, 0, "Barnstaffli i trä"), "Barnstaffli i trä");
  assert.equal(altForImage(WIX, 1, "Barnstaffli i trä"), "Barnstaffli i trä – bild 2");
  assert.equal(altForImage(WIX, 4, "Barnstaffli i trä", {}), "Barnstaffli i trä – bild 5");
});

test("altForImage – tom/blank Wix-alt räknas inte som alt-text", () => {
  const alts = { "b379ce_abc123~mv2.jpg": "   " };
  assert.equal(altForImage(WIX, 1, "Kulbana", alts), "Kulbana – bild 2");
});

test("altForImage – aldrig tom sträng, ens utan produktnamn", () => {
  assert.equal(altForImage(WIX, 0, ""), "Produktbild");
  assert.equal(altForImage(WIX, 2, "   "), "Produktbild – bild 3");
});
