// Beskärning plus skalning i samma Wix-adress (lib/wix-crop). Produktkorten
// med vitt band i botten klipps med x_44,y_0,w_1512,h_1512 och skalas sedan.
import test from "node:test";
import assert from "node:assert/strict";
import { cropFillUrl, skalaWixSvans } from "./wix-crop.ts";

const NYCKEL = "b379ce_f18ccf613d55494a82d01731ab8bb772~mv2.png";
const BAND = { x: 44, y: 0, w: 1512, h: 1512 };

test("cropFillUrl klipper först och skalar sedan till begärd storlek", () => {
  assert.equal(
    cropFillUrl(NYCKEL, BAND, 120, 120, 80),
    `https://static.wixstatic.com/media/${NYCKEL}/v1/crop/x_44,y_0,w_1512,h_1512/fill/w_120,h_120,al_c,q_80/file.webp`,
  );
});

test("loadern skalar bara fill-delen — rektangeln i originalpixlar står kvar", () => {
  const url = cropFillUrl(NYCKEL, BAND, 800, 800);
  const svans = url.slice(url.indexOf("/v1/"));
  assert.equal(
    skalaWixSvans(svans, 384),
    "/v1/crop/x_44,y_0,w_1512,h_1512/fill/w_384,h_384,al_c,q_72/file.webp",
  );
});

test("loadern behåller proportionen i en rektangulär fill", () => {
  assert.equal(skalaWixSvans("/v1/fill/w_640,h_480,al_c,q_72/file.webp", 320), "/v1/fill/w_320,h_240,al_c,q_72/file.webp");
});

test("crop utan fill och transform utan storlek lämnas orörda", () => {
  assert.equal(skalaWixSvans("/v1/crop/x_44,y_0,w_1512,h_1512/file.webp", 384), null);
  assert.equal(skalaWixSvans("/v1/fill/al_c/file.webp", 384), null);
});

test("listan över kort med vitt band är 16 hextecken per kort, utan dubbletter", async () => {
  const { readFileSync } = await import("node:fs");
  const data = JSON.parse(readFileSync(new URL("../data/image-crops.json", import.meta.url), "utf-8"));
  const lista: string[] = data.vittBand;
  assert.ok(lista.length > 400, `${lista.length} kort`);
  assert.equal(new Set(lista).size, lista.length);
  for (const id of lista) assert.match(id, /^[0-9a-f]{16}$/);
  assert.ok(lista.includes("f18ccf613d55494a"), "ultraljudstvättens 2 L-kort");
});
