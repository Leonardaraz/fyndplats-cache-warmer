import { describe, it, expect } from "vitest";
import {
  needsDescriptionBackfill,
  sanitizeDescriptionHtml,
  descriptionToText,
  visibleDescriptionLength,
  imageCount,
  isMoreInformative,
  looksLikeScrapedBoilerplate,
} from "./description";
import type { AliExpressProduct } from "./types";

function product(over: Partial<AliExpressProduct>): AliExpressProduct {
  return {
    supplierProductId: "1",
    sourceUrl: "https://www.aliexpress.com/item/1.html",
    rawTitle: "Test",
    rawDescription: "",
    imageUrls: [],
    variants: [],
    ...over,
  };
}

describe("needsDescriptionBackfill", () => {
  it("true när beskrivningen är tunn/tom", () => {
    expect(needsDescriptionBackfill(product({ rawDescription: "" }))).toBe(true);
    expect(needsDescriptionBackfill(product({ rawDescription: "Kort." }))).toBe(true);
    expect(needsDescriptionBackfill(product({ descriptionHtml: "<p>Liten</p>" }))).toBe(true);
  });
  it("false när det redan finns en rik beskrivning (≥200 synliga tecken)", () => {
    const rich = "A".repeat(250);
    expect(needsDescriptionBackfill(product({ descriptionHtml: `<p>${rich}</p>` }))).toBe(false);
    expect(visibleDescriptionLength(product({ rawDescription: rich }))).toBe(250);
  });
});

describe("sanitizeDescriptionHtml", () => {
  it("tar bort script/style/iframe + on*-handlers + javascript:", () => {
    const out = sanitizeDescriptionHtml(
      `<p onclick="x()">Hej</p><script>evil()</script><iframe src="x"></iframe><a href="javascript:alert(1)">l</a>`,
    );
    expect(out).not.toMatch(/script|iframe|onclick|javascript:/i);
    expect(out).toContain("Hej");
  });

  it("tar bort dropship-läckande ord men behåller resten + bilder", () => {
    const out = sanitizeDescriptionHtml(
      `<p>Tål vatten. Shipped from China by AliExpress (Shenzhen).</p><img src="https://x.alicdn.com/a.jpg">`,
    );
    expect(out).not.toMatch(/china|aliexpress|shenzhen/i);
    expect(out).toContain("Tål vatten.");
    expect(out).toContain("<img"); // bilden (den faktiska beskrivningen) följer med
  });

  it("kapar till maxLen", () => {
    const big = "<p>" + "x".repeat(20000) + "</p>";
    expect(sanitizeDescriptionHtml(big, 5000).length).toBe(5000);
  });

  it("returnerar tomt när inget meningsfullt blir kvar", () => {
    expect(sanitizeDescriptionHtml("")).toBe("");
    expect(sanitizeDescriptionHtml("<div>   </div>")).toBe("");
    expect(sanitizeDescriptionHtml("<script>only()</script>")).toBe("");
  });
});

describe("descriptionToText", () => {
  it("strippar taggar och normaliserar whitespace", () => {
    expect(descriptionToText("<p>Hej   <b>där</b></p>\n<p>igen</p>")).toBe("Hej där igen");
    expect(descriptionToText("a&nbsp;b")).toBe("a b");
  });
});

describe("sanitizeDescriptionHtml — härdning (audit #2/#3)", () => {
  it("tar bort form/object/embed/svg/meta/link/base/input men behåller text", () => {
    const out = sanitizeDescriptionHtml(
      `<p>Bra produkt.</p><form action="x"><input name="y"></form>` +
        `<object data="x"></object><embed src="x"><svg onload="e()"></svg>` +
        `<meta http-equiv="refresh" content="0;url=evil"><base href="//evil"><link rel="x">`,
    );
    expect(out).toContain("Bra produkt.");
    expect(out).not.toMatch(/<(form|object|embed|svg|meta|link|base|input)\b/i);
    expect(out).not.toMatch(/http-equiv|onload/i);
  });

  it("neutraliserar data:text/html och data:image/svg men inte vanlig text 'Data:'", () => {
    const out = sanitizeDescriptionHtml(`<a href="data:text/html;base64,xxx">l</a><p>Data: 2026</p>`);
    expect(out).not.toMatch(/data:\s*text\/html/i);
    expect(out).toContain("Data: 2026");
  });

  it("strippar fler dropship-läckor: Hong Kong, Ali-Express, alicdn, CJK", () => {
    const out = sanitizeDescriptionHtml(
      `<p>Skickas från Hong Kong via Ali-Express.</p><img src="https://x.alicdn.com/中国/深圳.jpg">`,
    );
    expect(out).not.toMatch(/hong\s?kong|ali-?express|alicdn|中国|深圳/i);
    expect(out).toContain("Skickas från"); // resten kvar
    expect(out).toContain("<img"); // bilden behålls
  });
});

describe("imageCount", () => {
  it("räknar <img>-taggar", () => {
    expect(imageCount('<p>x</p><img src="a"><IMG src="b"/>')).toBe(2);
    expect(imageCount("<p>ingen bild</p>")).toBe(0);
    expect(imageCount("")).toBe(0);
  });
});

describe("isMoreInformative (audit #1 — ersätt på riktigt innehåll)", () => {
  it("bild-baserad DS-detail ersätter en text-tunn skrapning (även om HTML är kortare)", () => {
    // Skrapning: markup-tung men synligt tom (lazy-iframe-miss). DS: 3 bilder.
    const scraped = { descriptionHtml: '<div class="aaaaaaaaaaaaaaaaaaaaaaaaaaaa"></div>' };
    const detail = '<img src="a"><img src="b"><img src="c">';
    expect(isMoreInformative(detail, scraped)).toBe(true);
  });

  it("rikare text ersätter en tom/tunn beskrivning", () => {
    expect(isMoreInformative("<p>" + "x".repeat(300) + "</p>", { descriptionHtml: "<p></p>" })).toBe(true);
  });

  it("ersätter INTE när nuvarande redan har mer text och lika/fler bilder", () => {
    const current = { descriptionHtml: "<p>" + "x".repeat(500) + "</p>" };
    expect(isMoreInformative("<p>kort</p>", current)).toBe(false);
  });

  it("tom detail ersätter aldrig", () => {
    expect(isMoreInformative("", { descriptionHtml: "<p></p>" })).toBe(false);
  });
});

describe("AE-meta-boilerplate (gazebo-fallet — backfill triggade inte)", () => {
  // Exakt typen av text importen fick istället för den riktiga beskrivningen.
  const AE_BLURB =
    "Buy SucceBuy Pop-up Camping Gazebo Camping Canopy Shelter 6 Sided 12' x 12' / 10' x 10' " +
    "Sun Shade Tents & Canopies Camping & Hiking at Aliexpress for. Find more 15, 153801 and products. " +
    "Enjoy Free Shipping Worldwide! Limited Time Sale Easy Return.";

  it("känns igen som boilerplate (inte riktig produkttext)", () => {
    expect(AE_BLURB.length).toBeGreaterThan(200); // skulle annars passera tunn-gränsen
    expect(looksLikeScrapedBoilerplate(AE_BLURB)).toBe(true);
    expect(
      looksLikeScrapedBoilerplate("Rymlig pop-up-gazebo för upp till 8 personer i vattentätt oxfordtyg."),
    ).toBe(false);
    // EN ensam generisk reklamfras i äkta copy → INTE boilerplate (annars nedgradering).
    expect(looksLikeScrapedBoilerplate("Don't miss our limited time sale on all camping gear!")).toBe(false);
    expect(looksLikeScrapedBoilerplate("Find more matching home decor products in our collection.")).toBe(false);
    // Men ≥2 AE-meta-fraser (utan namnet) → boilerplate.
    expect(
      looksLikeScrapedBoilerplate("Limited time sale! Enjoy free shipping worldwide on every order."),
    ).toBe(true);
  });

  it("needsDescriptionBackfill = true för boilerplate trots >200 tecken", () => {
    expect(needsDescriptionBackfill(product({ descriptionHtml: `<p>${AE_BLURB}</p>` }))).toBe(true);
  });

  it("isMoreInformative ersätter boilerplaten med den riktiga (även kortare) DS-detailen", () => {
    const realDetail = `<p>${"Rymlig pop-up-gazebo för upp till 8 personer. ".repeat(2)}</p>`; // kortare än blurben
    expect(isMoreInformative(realDetail, { descriptionHtml: `<p>${AE_BLURB}</p>` })).toBe(true);
  });
});
