// Bloggomslagens adressform.
//
// ☠️ VARFÖR DET HÄR TESTET FINNS. Fyra omslag dog för att de pekade på filer
// i Wix Media som motorns nattstädning raderade — den ser bara PRODUKTmedia i
// sin referenslista och kan omöjligt veta att en markdown-fil i det här repot
// pekar på filen. Lösningen är att omslagen bor i /public.
//
// Och de skrivs RELATIVT, med flit. En hårdkodad https://www.fyndplats.se-
// adress pekar på PRODUKTION även när sidan renderas på en preview-deploy:
// filen finns inte där förrän PR:en mergats, så previewen visar trasiga bilder
// fastän ändringen är rätt — och då går fixen inte att granska.
//
// Domänen läggs på i koden, och bara där en full URL faktiskt krävs: JSON-LD
// (byggs för hand, resolvas INTE av metadataBase) och Open Graph.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { absolutCover } from "./blog-cover.ts";

const KATALOG = join(process.cwd(), "content/blog");
const PUBLIC = join(process.cwd(), "public");

function cover(fil: string): string | null {
  const s = readFileSync(join(KATALOG, fil), "utf8");
  const m = s.match(/^cover:\s*(\S+)\s*$/m);
  return m ? m[1] : null;
}

describe("absolutCover", () => {
  test("relativ /public-adress får domänen", () => {
    assert.equal(absolutCover("/blog-paviljong.jpg"), "https://www.fyndplats.se/blog-paviljong.jpg");
  });

  test("en adress som redan är absolut lämnas orörd", () => {
    const u = "https://static.wixstatic.com/media/b379ce_abc~mv2.jpg";
    assert.equal(absolutCover(u), u);
  });

  test("tom adress ger tom sträng — aldrig 'https://www.fyndplats.se'", () => {
    assert.equal(absolutCover(""), "");
  });

  test("adress utan inledande snedstreck får ett", () => {
    assert.equal(absolutCover("blog-x.jpg"), "https://www.fyndplats.se/blog-x.jpg");
  });
});

describe("bloggomslagen", () => {
  const filer = readdirSync(KATALOG).filter((f) => f.endsWith(".md"));

  test("varje inlägg har ett cover", () => {
    for (const f of filer) assert.ok(cover(f), `${f} saknar cover`);
  });

  test("☠️ ett self-hostat omslag skrivs RELATIVT, aldrig med hårdkodad domän", () => {
    // En absolut fyndplats.se-adress skulle rendera trasigt på varje preview.
    for (const f of filer) {
      const c = cover(f)!;
      assert.ok(
        !/^https?:\/\/(www\.)?fyndplats\.se/i.test(c),
        `${f}: omslaget pekar på vår egen domän med full URL (${c}). Skriv det relativt — domänen läggs på av absolutCover().`,
      );
    }
  });

  test("☠️ varje relativt omslag finns FAKTISKT i /public", () => {
    // Utan det här blir en felstavning ett 404 som ingen upptäcker förrän
    // någon tittar på bloggen — precis så de fyra döda låg osedda.
    for (const f of filer) {
      const c = cover(f)!;
      if (!c.startsWith("/")) continue;
      assert.ok(existsSync(join(PUBLIC, c)), `${f}: ${c} saknas i /public`);
    }
  });
});
