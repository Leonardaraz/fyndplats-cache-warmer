// Bild-URL:erna skickas till klienten som bara media-nyckeln (se forClient i
// lib/products.ts): värddelen är identisk för varenda bild och kostade
// 113 330 B per /alla-produkter att upprepa 3 238 gånger.
//
// Hela kedjan vilar på att wixMediaKey släpper igenom en naken nyckel
// oförändrad. Går den sönder blir varje produktbild på varje listsida en trasig
// <img> — det är inget en typ fångar, så det fångas här.
import test from "node:test";
import assert from "node:assert/strict";
import { wixMediaKey } from "./wix-media-key.ts";

const NYCKEL = "b379ce_6e7d56e6a5834ab3adb2edbf8ea3c411~mv2.jpg";
const HEL = `https://static.wixstatic.com/media/${NYCKEL}`;

test("wixMediaKey plockar nyckeln ur en hel Wix-URL", () => {
  assert.equal(wixMediaKey(HEL), NYCKEL);
  assert.equal(wixMediaKey(`${HEL}/v1/fill/w_600,h_600,al_c,q_72/file.webp`), NYCKEL);
});

test("wixMediaKey släpper igenom en naken nyckel oförändrad", () => {
  assert.equal(wixMediaKey(NYCKEL), NYCKEL);
  // Kontoprefixet är inte valfritt: utan b379ce_ svarar Wix CDN 403 (se
  // lib/review-images.ts). Nyckeln får alltså aldrig kapas här.
  assert.ok(wixMediaKey(NYCKEL)?.startsWith("b379ce_"));
});

test("wixMediaKey säger nej till allt som inte är en nyckel", () => {
  assert.equal(wixMediaKey(""), null);
  assert.equal(wixMediaKey("/logo.svg"), null, "lokal sökväg");
  assert.equal(wixMediaKey("https://images.unsplash.com/photo-123"), null, "annan värd");
  assert.equal(wixMediaKey("data:image/png;base64,iVBOR"), null, "data-URI");
});

test("naken nyckel och hel URL ger samma nyckel — därav samma <img src>", () => {
  // Det här är hela poängen. tightFillUrl bygger sin URL som
  // `.../media/${wixMediaKey(url)}/v1/...`, så när de två formerna ger samma
  // nyckel blir <img src> identisk vare sig servern skickat hel URL eller
  // klienten fått den nakna nyckeln. (tightFillUrl självt kan inte importeras
  // här — dess modul drar in data/image-crops.json, se wix-media-key.ts.)
  assert.equal(wixMediaKey(NYCKEL), wixMediaKey(HEL));
  assert.equal(wixMediaKey(NYCKEL), wixMediaKey(`${HEL}/v1/fill/w_600,h_600,al_c,q_72/file.webp`));
});
