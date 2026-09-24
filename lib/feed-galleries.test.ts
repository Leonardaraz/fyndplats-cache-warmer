// Repot kör node --test (se package.json).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const utanKommentarer = (fil: string) =>
  readFileSync(fil, "utf8")
    .split("\n")
    .filter((rad) => !rad.trim().startsWith("//"))
    .join("\n");

test("Google-flödet faller tillbaka på produktens eget galleri", () => {
  // Produktionsflödet 2026-09-24: 557 av 3 393 produkter hade en enda
  // extrabild. V3-svepet läser bara de 1 200 nyaste produkterna, och resten
  // fick en tom lista i stället för listningens galleri.
  const t = utanKommentarer("app/feed/google.xml/route.ts");
  assert.match(t, /galleries\.get\(pid\)\s*\|\|\s*byId\.get\(pid\)\?\.gallery\s*\|\|\s*\[\]/);
  assert.doesNotMatch(t, /galleries\.get\(pid\)\s*\|\|\s*\[\]/, "utan reserven får de flesta produkter noll extrabilder");
});

test("variantsvepet kapar inte tyst vid 10 000", () => {
  // Katalogen hade 7 006 varianter 2026-09-24. Med det gamla taket hade
  // Google-flödet tappat produkter runt mitten av november utan ett enda fel.
  const t = utanKommentarer("lib/products.ts");
  const tak = Number((t.match(/const MAX_VARIANTSIDOR = (\d+)/) || [])[1]);
  assert.ok(tak >= 20, `MAX_VARIANTSIDOR är ${tak}, katalogen har redan 8 sidor`);
  assert.match(t, /for \(let page = 0; page < MAX_VARIANTSIDOR; page\+\+\)/);
  assert.match(t, /SIDTAKET SLOG I efter \$\{out\.length\} varianter/, "ett tak som slår i ska loggas som fel");
});
