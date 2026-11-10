// Bloggens markdown: produktrader och tabeller (köpguiderna, 2026-10-07).
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractProducts, renderMarkdown } from "./local-blog.ts";

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

test("produktlistan för Google tar bara med länkar till produkter", () => {
  // Köpguiden för bäddfåtöljer har en måttbild som länkar till kategorin
  // (2026-10-14). Den ritas som de andra bilderna men är ingen produkt.
  const md = [
    bild("stol"),
    "[![Måttbild](/blog-matt.webp)](/kategori/stolar \"Se alla stolar\")",
    bild("stol"),
    bild("bord"),
  ].join("\n");
  assert.deepEqual(extractProducts(md).map((p) => p.url), ["/produkt/stol", "/produkt/bord"]);
  // Måttbilden ritas ändå, som en vanlig figur i raden.
  assert.equal((renderMarkdown(md).match(/<figure/g) || []).length, 4);
});

test("en miljöbild före produktkortet tar inte över produktens namn och bild", () => {
  // Köpguiden för bäddfåtöljer visar en fåtölj som fåtölj, schäslong och säng
  // högt upp, och produktkortet längre ned (2026-10-14). Listan till Google
  // ska bära kortets namn och bild, i kortens ordning.
  const miljo = "[![Samma bäddfåtölj utfälld till säng, med en kvinna som sover under en filt](https://static.wixstatic.com/media/miljo.jpg)](/produkt/stol \"Säng\")";
  const md = [miljo, "", bild("bord"), bild("stol")].join("\n");
  assert.deepEqual(extractProducts(md), [
    { name: "bord", image: "https://static.wixstatic.com/media/bord.jpg", url: "/produkt/bord" },
    { name: "stol", image: "https://static.wixstatic.com/media/stol.jpg", url: "/produkt/stol" },
  ]);
});

// ── Citatrutor och omskrivna inlägg (2026-11-10) ─────────────────────────────
// Tullinlägget hade "> ### 🇪🇺 Vårt EU-löfte" i en citatruta. Renderaren
// tolkar bara rubriker på egna rader, så tecknen skrevs ut som text och stod
// så på sidan i drygt fyra månader. Sidan länkas från startsidans EU-märke.

test("en rubrikrad i en citatruta blir fet text, utan tecknen kvar", () => {
  const html = renderMarkdown(["> ### Vårt EU-löfte", "> Allt skickas från **EU-lager**."].join("\n"));
  assert.equal(html, "<blockquote><p><strong>Vårt EU-löfte</strong></p><p>Allt skickas från <strong>EU-lager</strong>.</p></blockquote>");
  // En vanlig rad som bara innehåller ett # rörs inte.
  assert.ok(renderMarkdown("> Nummer #1 i test").includes("<p>Nummer #1 i test</p>"));
});

test("inget inlägg skriver ut råa rubriktecken", async () => {
  const { readdirSync, readFileSync } = await import("node:fs");
  const katalog = new URL("../content/blog/", import.meta.url);
  const filer = readdirSync(katalog).filter((f) => f.endsWith(".md"));
  assert.ok(filer.length >= 40, `väntade minst 40 inlägg, fann ${filer.length}`);
  for (const f of filer) {
    const text = readFileSync(new URL(f, katalog), "utf8");
    const kropp = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
    const html = renderMarkdown(kropp);
    assert.doesNotMatch(html, /<(p|li|td|th)>\s*#{1,6}\s/, `${f}: en rubrikrad skrivs ut med tecknen kvar`);
  }
});

test("tullinlägget: uppdaterat, utan handplockade produkter och med frågor och svar", async () => {
  const { getLocalPost } = await import("./local-blog.ts");
  const p = await getLocalPost("nya-tullreglerna-2026-eu-lager");
  assert.ok(p, "inlägget ska finnas");
  assert.equal(p.date, "2026-06-30");
  assert.equal(p.updated, "2026-11-10");
  // De tre handplockade varorna stod kvar i månader, och en av dem var slutsåld.
  assert.deepEqual(p.products, []);
  assert.ok(!p.contentHtml.includes("blog-product-img"));
  assert.equal(p.faq?.length, 5);
  // Källraden står före frågorna, annars hamnar den i sista svaret i FAQPage.
  assert.ok(!p.faq?.some((f) => /Källor/.test(f.a)));
  // Omslaget är en egen bild i /public med formen 1200 × 630, samma mått som
  // sidan reserverar. En bild i annan form flyttar texten när den laddats.
  assert.equal(p.cover, "/blog-eu-tull-2026.jpg");
  const { readFileSync } = await import("node:fs");
  const fil = readFileSync(new URL("../public/blog-eu-tull-2026.jpg", import.meta.url));
  const { bredd, hojd } = jpegMatt(fil);
  assert.ok(Math.abs(bredd / hojd - 1200 / 630) < 0.01, `omslaget är ${bredd} × ${hojd}`);
  assert.ok(fil.length < 200_000, `omslaget väger ${fil.length} byte`);
});

test("ett inlägg utan updated_date har inget uppdateringsdatum", async () => {
  const { getLocalPosts } = await import("./local-blog.ts");
  const alla = await getLocalPosts();
  const utan = alla.filter((p) => !p.updated);
  assert.ok(utan.length >= 40);
  assert.ok(utan.every((p) => p.updated === undefined));
});

/** Bredd och höjd ur en JPEG-fils SOF-segment. */
function jpegMatt(b: Uint8Array): { bredd: number; hojd: number } {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) throw new Error("ingen JPEG-markör");
    const m = b[i + 1];
    const langd = (b[i + 2] << 8) | b[i + 3];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      return { hojd: (b[i + 5] << 8) | b[i + 6], bredd: (b[i + 7] << 8) | b[i + 8] };
    }
    i += 2 + langd;
  }
  throw new Error("inget SOF-segment");
}
