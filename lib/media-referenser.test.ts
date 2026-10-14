// Listan över Wix-bilder butiken pekar på (motorns bildstädning läser den).
import { test } from "node:test";
import assert from "node:assert/strict";
import { byggManifest, GOLV, HOPPA_OVER, LASBARA, underGolv, wixMediaIdn } from "./media-referenser.ts";

const ID = "b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg";

test("hittar id i adresser, wix:image-URI:er, nakna id och transformer", () => {
  const text = [
    `https://static.wixstatic.com/media/${ID}`,
    "[![a](https://static.wixstatic.com/media/b379ce_1111111111111111111111111111111a~mv2.png/v1/fill/w_640,h_640/file.webp)](/produkt/a)",
    "wix:image://v1/b379ce_2222222222222222222222222222222b~mv2.jpeg/namn.jpeg#originWidth=800",
    '"img": "b379ce_3333333333333333333333333333333c~mv2.webp"',
  ].join("\n");
  assert.deepEqual(wixMediaIdn(text).sort(), [
    ID,
    "b379ce_1111111111111111111111111111111a~mv2.png",
    "b379ce_2222222222222222222222222222222b~mv2.jpeg",
    "b379ce_3333333333333333333333333333333c~mv2.webp",
  ].sort());
});

test("URL-kodad tilde och versaler blir samma id som i biblioteket", () => {
  const kodad = "/_next/image?url=https%3A%2F%2Fstatic.wixstatic.com%2Fmedia%2Fb379ce_0e6a6260c9f243b3afd79cbaf147b67b%7Emv2.jpg&w=640";
  assert.deepEqual(wixMediaIdn(kodad), [ID]);
  assert.deepEqual(wixMediaIdn(ID.toUpperCase()), [ID]);
});

test("gamla id-former fångas hela, så att motorn aldrig matchar en halv sträng", () => {
  const gammal = "b379ce_4444444444444444444444444444444d~mv2_d_1920_1080_s_2.jpg";
  assert.deepEqual(wixMediaIdn(`url(${gammal})`), [gammal]);
});

test("listan räknar varje id en gång och per källa", () => {
  const m = byggManifest([
    { kalla: "blogg", text: `${ID} ${ID}` },
    { kalla: "kod", text: ID },
  ], new Date("2026-10-14T00:00:00Z"));
  assert.deepEqual(m.idn, [ID]);
  assert.deepEqual(m.perKalla, { blogg: 1, kod: 1 });
  assert.deepEqual(m.filer, { blogg: 1, kod: 1 });
});

test("en lista under golvet är trasig, inte tom", () => {
  assert.match(underGolv(byggManifest([{ kalla: "blogg", text: ID }])) ?? "", /bloggen gav 1/);
  const manga = Array.from({ length: GOLV.totalt }, (_, i) => `b379ce_${i.toString(16).padStart(32, "0")}~mv2.jpg`);
  const hel = byggManifest([
    { kalla: "blogg", text: manga.slice(0, GOLV.blogg).join(" ") },
    { kalla: "reservkatalog", text: manga.join(" ") },
  ]);
  assert.equal(underGolv(hel), null);
});

test("testfiler, node_modules och binärer läses inte", () => {
  assert.ok(HOPPA_OVER.test("lib/media-referenser.test.ts"));
  assert.ok(HOPPA_OVER.test("node_modules/x/index.js"));
  assert.ok(!HOPPA_OVER.test("content/blog/baddfatolj-kopguide-2026.md"));
  assert.ok(LASBARA.test("content/blog/a.md"));
  assert.ok(!LASBARA.test("public/blog/omslag.webp"));
});
