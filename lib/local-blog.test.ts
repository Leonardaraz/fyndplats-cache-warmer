// Betalda länkar i annonsinlägg.
//
// VARFÖR DET HÄR TESTET FINNS. Fyndplats säljer märkta samarbetsinlägg i bloggen.
// Två saker måste då stämma, annars bryter vi mot marknadsföringslagen
// (reklamidentifiering) eller Googles regler för köpta länkar:
//   1. Inlägget syns som reklam direkt: rubriken börjar med "Annons:".
//   2. Varje betald länk har rel="sponsored". Den skrivs för hand i markdown
//      som [text](https://… "sponsored").
// Märkningen görs manuellt med flit. Det här testet är skyddsnätet som fångar
// ett glömt steg innan inlägget publiceras. Se docs/SAMARBETEN.md.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderInline } from "./local-blog.ts";

describe("renderInline: länkar", () => {
  test("vanlig länk renderas som förut, utan rel", () => {
    assert.equal(
      renderInline("[Paviljonger](/kategori/paviljonger)"),
      '<a href="/kategori/paviljonger">Paviljonger</a>',
    );
  });

  test('"sponsored" efter adressen ger rel="sponsored"', () => {
    assert.equal(
      renderInline('[Partner AB](https://partner.se "sponsored")'),
      '<a href="https://partner.se" rel="sponsored">Partner AB</a>',
    );
  });

  test("skiftläget spelar ingen roll", () => {
    assert.match(renderInline('[X](https://x.se "Sponsored")'), /rel="sponsored"/);
  });

  test("fetstil runt en sponsrad länk fungerar", () => {
    assert.equal(
      renderInline('**Tips:** läs mer hos [Partner](https://partner.se/sida "sponsored").'),
      '<strong>Tips:</strong> läs mer hos <a href="https://partner.se/sida" rel="sponsored">Partner</a>.',
    );
  });
});

const BLOG_DIR = join(process.cwd(), "content", "blog");
const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

function frontmatterTitle(raw: string): string {
  const fm = raw.match(/^---\s*\n([\s\S]*?)\n---/);
  const t = fm?.[1].match(/^title:\s*"?(.*?)"?\s*$/m);
  return t ? t[1] : "";
}

describe("annonsinlägg i content/blog", () => {
  for (const f of files) {
    const raw = readFileSync(join(BLOG_DIR, f), "utf8").replace(/\r\n/g, "\n");
    const title = frontmatterTitle(raw);
    const body = raw.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "");
    // Produktbilder ([![namn](bild)](produkt)) är våra egna inbäddningar: hoppa över dem.
    const text = body
      .split("\n")
      .filter((l) => !l.trim().startsWith("[!["))
      .join("\n");
    const links = [...text.matchAll(/(?<!!)\[([^\]]+)\]\(([^)]+)\)/g)].map((m) => m[2].trim());
    const isSponsored = (h: string) => /\s+"sponsored"$/i.test(h);
    const isAd = /^Annons:/i.test(title);

    test(`${f}: sponsrade länkar finns bara i inlägg märkta "Annons:"`, () => {
      if (links.some(isSponsored)) {
        assert.ok(isAd, `${f} har sponsrade länkar men rubriken börjar inte med "Annons:"`);
      }
    });

    if (isAd) {
      test(`${f}: annonsinlägget är märkt i texten och alla externa länkar är sponsored`, () => {
        // Första raden under rubriken (H1 renderas inte) ska vara annonsraden.
        const firstLine =
          body
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l && !l.startsWith("# "))[0] ?? "";
        assert.ok(firstLine.startsWith("*Annons"), `${f}: första raden ska börja med *Annons`);
        const external = links.filter(
          (h) => /^https?:\/\//i.test(h) && !/^https?:\/\/(www\.)?fyndplats\.se/i.test(h),
        );
        const unmarked = external.filter((h) => !isSponsored(h));
        assert.deepEqual(unmarked, [], `${f}: externa länkar utan "sponsored": ${unmarked.join(", ")}`);
        assert.ok(links.some(isSponsored), `${f}: annonsinlägg utan någon sponsrad länk`);
      });
    }
  }
});
