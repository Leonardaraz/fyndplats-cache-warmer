// Bloggens markdown: produktrader och tabeller (köpguiderna, 2026-10-07).
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "./local-blog.ts";

const bild = (s: string) => `[![${s}](https://static.wixstatic.com/media/${s}.jpg)](/produkt/${s} "${s}")`;

test("en ensam produktbild blir en figur, inte en rad", () => {
  const html = renderMarkdown(bild("a"));
  assert.ok(html.startsWith('<figure class="blog-product-img">'));
  assert.ok(!html.includes("blog-produktrad"));
});

test("produktbilder utan tomrad emellan blir en rad", () => {
  const html = renderMarkdown([bild("a"), bild("b"), bild("c")].join("\n"));
  assert.equal((html.match(/blog-produktrad/g) || []).length, 1);
  assert.equal((html.match(/<figure/g) || []).length, 3);
});

test("en tomrad delar raden, som förut", () => {
  const html = renderMarkdown([bild("a"), "", bild("b")].join("\n"));
  assert.ok(!html.includes("blog-produktrad"));
  assert.equal((html.match(/<figure/g) || []).length, 2);
});

test("tabell med rubrik, länkar och fetstil", () => {
  const md = ["| Situation | Välj |", "|---|---|", "| Liten lägenhet | [Klöstunna](/kategori/klostrad) |", "| Stor katt | **Takspänt** |", "", "Efter."].join("\n");
  const html = renderMarkdown(md);
  assert.ok(html.includes('<th scope="col">Situation</th>'));
  assert.ok(html.includes('<td><a href="/kategori/klostrad">Klöstunna</a></td>'));
  assert.ok(html.includes("<td><strong>Takspänt</strong></td>"));
  assert.equal((html.match(/<tr>/g) || []).length, 3);
  assert.ok(html.endsWith("<p>Efter.</p>"));
});

test("en rad som bara börjar med | utan avgränsare är vanlig text", () => {
  assert.equal(renderMarkdown("| inte en tabell"), "<p>| inte en tabell</p>");
});
