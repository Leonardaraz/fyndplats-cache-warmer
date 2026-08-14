// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
import test from "node:test";
import assert from "node:assert/strict";
import { linkedPathsInHtml, buildBlogLinkIndex } from "./blog-link-index.ts";

const post = (slug: string, contentHtml: string, date = "2026-01-01", title = slug) => ({
  slug,
  title,
  date,
  contentHtml,
});

test("linkedPathsInHtml – plockar relativa produkt- och kategorilänkar", () => {
  const html = `<p>Se <a href="/produkt/stodben-4-pack">stödben</a> i <a href="/kategori/friluftsliv-resa">Friluftsliv</a>.</p>`;
  assert.deepEqual(linkedPathsInHtml(html), ["/produkt/stodben-4-pack", "/kategori/friluftsliv-resa"]);
});

test("linkedPathsInHtml – behåller dubbletter (antalet är relevanssignalen)", () => {
  const html = `<a href="/produkt/solpanel">a</a><a href="/produkt/solpanel">b</a>`;
  assert.deepEqual(linkedPathsInHtml(html), ["/produkt/solpanel", "/produkt/solpanel"]);
});

test("linkedPathsInHtml – absoluta länkar mot egen domän normaliseras till sökväg", () => {
  const html = `<a href="https://www.fyndplats.se/produkt/eldkorg">x</a><a href="https://fyndplats.se/produkt/hangmatta">y</a>`;
  assert.deepEqual(linkedPathsInHtml(html), ["/produkt/eldkorg", "/produkt/hangmatta"]);
});

test("linkedPathsInHtml – frågesträng och fragment bryter slug:en, inte matchen", () => {
  const html = `<a href="/produkt/dieselvarmare?variant=8kw">a</a><a href="/produkt/tak-talt#specs">b</a>`;
  assert.deepEqual(linkedPathsInHtml(html), ["/produkt/dieselvarmare", "/produkt/tak-talt"]);
});

test("linkedPathsInHtml – ignorerar externa domäner och andra interna sidor", () => {
  const html =
    `<a href="https://example.com/produkt/fejk">extern</a>` +
    `<a href="/blogg/nagon-guide">blogg</a>` +
    `<a href="/fyndauktion">auktion</a>`;
  assert.deepEqual(linkedPathsInHtml(html), []);
});

test("linkedPathsInHtml – tom/saknad HTML ger tom lista", () => {
  assert.deepEqual(linkedPathsInHtml(""), []);
  assert.deepEqual(linkedPathsInHtml(undefined as unknown as string), []);
});

test("buildBlogLinkIndex – vänder länkriktningen: sökväg → inlägg som länkar dit", () => {
  const index = buildBlogLinkIndex([
    post("vinterforvaring", `<a href="/produkt/dieselvarmare">v</a>`),
    post("utelivet", `<a href="/produkt/eldkorg">e</a>`),
  ]);
  assert.deepEqual(
    index.get("/produkt/dieselvarmare")?.map((p) => p.slug),
    ["vinterforvaring"],
  );
  assert.deepEqual(index.get("/produkt/eldkorg")?.map((p) => p.slug), ["utelivet"]);
  assert.equal(index.get("/produkt/finns-inte"), undefined);
});

test("buildBlogLinkIndex – ett inlägg räknas EN gång per sökväg, med antal länkar", () => {
  const index = buildBlogLinkIndex([
    post("guide", `<a href="/produkt/solpanel">a</a><a href="/produkt/solpanel">b</a><a href="/produkt/solpanel">c</a>`),
  ]);
  const hits = index.get("/produkt/solpanel");
  assert.equal(hits?.length, 1);
  assert.equal(hits?.[0].hits, 3);
});

test("buildBlogLinkIndex – flest länkar rankas först", () => {
  const index = buildBlogLinkIndex([
    post("namner-i-forbifarten", `<a href="/produkt/x">en</a>`, "2026-05-01"),
    post("eget-avsnitt", `<a href="/produkt/x">1</a><a href="/produkt/x">2</a>`, "2026-01-01"),
  ]);
  assert.deepEqual(index.get("/produkt/x")?.map((p) => p.slug), ["eget-avsnitt", "namner-i-forbifarten"]);
});

test("buildBlogLinkIndex – vid lika många länkar vinner nyaste inlägget", () => {
  const index = buildBlogLinkIndex([
    post("gammal", `<a href="/produkt/x">1</a>`, "2025-03-01"),
    post("ny", `<a href="/produkt/x">1</a>`, "2026-07-01"),
  ]);
  assert.deepEqual(index.get("/produkt/x")?.map((p) => p.slug), ["ny", "gammal"]);
});

test("buildBlogLinkIndex – inlägg utan slug hoppas över (skulle ge /blogg/ som href)", () => {
  const index = buildBlogLinkIndex([post("", `<a href="/produkt/x">1</a>`)]);
  assert.equal(index.size, 0);
});

test("buildBlogLinkIndex – saknat datum kraschar inte sorteringen", () => {
  const index = buildBlogLinkIndex([
    { slug: "utan-datum", title: "T", date: "", contentHtml: `<a href="/produkt/x">1</a>` },
    post("med-datum", `<a href="/produkt/x">1</a>`, "2026-02-02"),
  ]);
  assert.deepEqual(index.get("/produkt/x")?.map((p) => p.slug), ["med-datum", "utan-datum"]);
});
