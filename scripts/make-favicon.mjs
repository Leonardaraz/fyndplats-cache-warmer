// One-shot favicon generator. Rasterises public/logo.svg → 32×32 PNG and
// wraps it in a single-image ICO container. Modern browsers accept PNG-in-ICO.
// Run: node scripts/make-favicon.mjs

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const svgPath = path.join(root, "public", "logo.svg");
const outPath = path.join(root, "app", "favicon.ico");

const SIZE = 32;

const png = await sharp(await fs.readFile(svgPath))
  .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9, palette: true })
  .toBuffer();

// ICO = ICONDIR (6) + ICONDIRENTRY (16) + PNG bytes
const ICONDIR = Buffer.alloc(6);
ICONDIR.writeUInt16LE(0, 0);   // reserved
ICONDIR.writeUInt16LE(1, 2);   // type: 1 = icon
ICONDIR.writeUInt16LE(1, 4);   // image count

const ENTRY = Buffer.alloc(16);
ENTRY.writeUInt8(SIZE === 256 ? 0 : SIZE, 0);  // width (0 = 256)
ENTRY.writeUInt8(SIZE === 256 ? 0 : SIZE, 1);  // height
ENTRY.writeUInt8(0, 2);                         // colors in palette (0 = none)
ENTRY.writeUInt8(0, 3);                         // reserved
ENTRY.writeUInt16LE(1, 4);                      // color planes
ENTRY.writeUInt16LE(32, 6);                     // bits per pixel
ENTRY.writeUInt32LE(png.length, 8);             // image data size
ENTRY.writeUInt32LE(6 + 16, 12);                // offset to image data

const ico = Buffer.concat([ICONDIR, ENTRY, png]);
await fs.writeFile(outPath, ico);

console.log(`wrote ${outPath} (${ico.length} bytes, png=${png.length})`);
