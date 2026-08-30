import { describe, expect, it } from "vitest";
import { deriveInitials, ensureReviewId } from "../import/review-import";
import {
  BOT_BLOCKED,
  fetchAosomReviews,
  isGenericAuthor,
  parseAosomProductReviews,
} from "./reviews";

/** Bygger en sida med de JSON-LD-block Aosom faktiskt levererar. */
function sida(product: unknown, extra: unknown[] = []): string {
  const blocks = [
    { "@type": "BreadcrumbList", itemListElement: [] },
    ...extra,
    product,
  ];
  return (
    "<html><head>"
    + blocks
      .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
      .join("")
    + "</head><body>Hej</body></html>"
  );
}

const FEM_FEMSTJÄRNIGA = Array.from({ length: 5 }, (_, i) => ({
  "@type": "Review",
  author: { "@type": "Person", name: `Person ${i}` },
  description: `Sehr zufrieden mit dem Produkt, Nummer ${i}.`,
  reviewRating: { "@type": "Rating", ratingValue: 5 },
}));

describe("parseAosomProductReviews", () => {
  it("läser aggregatet och recensionerna ur Product-blocket", () => {
    const html = sida({
      "@type": "Product",
      name: "HOMCOM Bürostuhl",
      aggregateRating: { "@type": "AggregateRating", ratingValue: 4.8, reviewCount: 88 },
      review: [
        {
          "@type": "Review",
          author: { "@type": "Person", name: "Siegfried K." },
          description: "Auch wenn Halloween ausgefallen ist, war der Geist der Hingucker.",
          reviewRating: { ratingValue: 5 },
          datePublished: "2026-03-04",
        },
      ],
    });
    const r = parseAosomProductReviews(html);
    expect(r.rating).toBe(4.8);
    expect(r.reviewCount).toBe(88);
    expect(r.reviews).toHaveLength(1);
    expect(r.reviews[0].rating).toBe(5);
    expect(r.reviews[0].customerName).toBe("Siegfried K.");
    expect(r.reviews[0].language).toBe("de");
    expect(r.reviews[0].date).toBe("2026-03-04");
  });

  it("☠️ tar aggregatet RÅTT och räknar det aldrig ur de hämtade texterna", () => {
    // Aosom bär fem femstjärniga texter men säger själv 4,8 av 88. Räknar man
    // snittet av texterna blir sidan 5,0 av 5 — deras urval blir vår sanning.
    const html = sida({
      "@type": "Product",
      aggregateRating: { ratingValue: 4.8, reviewCount: 88 },
      review: FEM_FEMSTJÄRNIGA,
    });
    const r = parseAosomProductReviews(html);
    expect(r.reviews).toHaveLength(5);
    expect(r.reviews.every((x) => x.rating === 5)).toBe(true);
    expect(r.rating).toBe(4.8);
    expect(r.reviewCount).toBe(88);
  });

  it("släpper platshållarnamn så alla rader inte blir samma initialer", () => {
    const html = sida({
      "@type": "Product",
      aggregateRating: { ratingValue: 5, reviewCount: 2 },
      review: [
        { "@type": "Review", author: { name: "Aosom Kunde" }, description: "Toller Stuhl, sehr bequem.", reviewRating: { ratingValue: 5 } },
        { "@type": "Review", author: "Anonym", description: "Gutes Preis-Leistungs-Verhältnis.", reviewRating: { ratingValue: 4 } },
      ],
    });
    const r = parseAosomProductReviews(html);
    expect(r.reviews.map((x) => x.customerName)).toEqual([undefined, undefined]);
  });

  it("behåller betyget även när sidan saknar recensionstexter", () => {
    const html = sida({
      "@type": "Product",
      aggregateRating: { ratingValue: 4.9, reviewCount: 12 },
    });
    const r = parseAosomProductReviews(html);
    expect(r.rating).toBe(4.9);
    expect(r.reviewCount).toBe(12);
    expect(r.reviews).toEqual([]);
  });

  it("läser både reviewBody och description", () => {
    const html = sida({
      "@type": "Product",
      review: [
        { "@type": "Review", reviewBody: "Text i reviewBody.", reviewRating: { ratingValue: 5 } },
        { "@type": "Review", description: "Text i description.", reviewRating: { ratingValue: 4 } },
      ],
    });
    const r = parseAosomProductReviews(html);
    expect(r.reviews.map((x) => x.text)).toEqual(["Text i reviewBody.", "Text i description."]);
  });

  it("ett trasigt JSON-LD-block fäller inte de andra", () => {
    const html =
      '<script type="application/ld+json">{ trasigt json</script>'
      + sida({ "@type": "Product", aggregateRating: { ratingValue: 4.2, reviewCount: 7 } });
    expect(parseAosomProductReviews(html).rating).toBe(4.2);
  });

  it("hanterar sträng-siffror och kommatecken i aggregatet", () => {
    const html = sida({
      "@type": "Product",
      aggregateRating: { ratingValue: "4,6", ratingCount: "21" },
    });
    const r = parseAosomProductReviews(html);
    expect(r.rating).toBe(4.6);
    expect(r.reviewCount).toBe(21);
  });

  it("svarar tomt när sidan saknar Product-block", () => {
    expect(parseAosomProductReviews("<html><body>inget</body></html>")).toEqual({ reviews: [] });
  });
});

describe("isGenericAuthor", () => {
  it("känner igen platshållare men inte riktiga namn", () => {
    expect(isGenericAuthor("Aosom Kunde")).toBe(true);
    expect(isGenericAuthor("  ANONYM ")).toBe(true);
    expect(isGenericAuthor(undefined)).toBe(true);
    expect(isGenericAuthor("Siegfried K.")).toBe(false);
    expect(isGenericAuthor("Elfriede Hühnerbein")).toBe(false);
  });
});

describe("fetchAosomReviews", () => {
  const ok = (html: string) =>
    ({ ok: true, status: 200, text: async () => html }) as unknown as Response;

  it("skickar webbläsarrubrikerna Akamai kräver", async () => {
    let headers: Record<string, string> = {};
    await fetchAosomReviews("https://www.aosom.de/item/x~A.html", {
      fetchImpl: (async (_u: string, init: RequestInit) => {
        headers = init.headers as Record<string, string>;
        return ok(sida({ "@type": "Product" }));
      }) as unknown as typeof fetch,
    });
    expect(headers["Accept-Language"]).toContain("de-DE");
    expect(headers["Sec-Fetch-Mode"]).toBe("navigate");
    expect(headers["Upgrade-Insecure-Requests"]).toBe("1");
  });

  it("strippar utm_source ur adressen", async () => {
    let sedd = "";
    await fetchAosomReviews("https://www.aosom.de/item/x~A.html?utm_source=b2b", {
      fetchImpl: (async (u: string) => {
        sedd = u;
        return ok(sida({ "@type": "Product" }));
      }) as unknown as typeof fetch,
    });
    expect(sedd).toBe("https://www.aosom.de/item/x~A.html");
  });

  it("☠️ gör INTE om på 403 — det är en policyspärr, inte otur", async () => {
    // Uppmätt 2026-08-29: Akamai fingeravtrycker klientens TLS, inte rubrikerna.
    // curl får 200 och Node:s fetch 403 med EXAKT samma headers. Ett omförsök
    // ger samma fingeravtryck och samma svar — men kostar 12 s i backoff.
    let n = 0;
    const r = await fetchAosomReviews("https://www.aosom.de/item/x~A.html", {
      sleep: async () => { throw new Error("ska aldrig sova på 403"); },
      fetchImpl: (async () => {
        n++;
        return { ok: false, status: 403 } as unknown as Response;
      }) as unknown as typeof fetch,
    });
    expect(n).toBe(1);
    expect(r.error).toBe(BOT_BLOCKED);
    expect(r.reviews).toEqual([]);
  });

  it("gör fortfarande om på 429 och 5xx", async () => {
    let n = 0;
    const r = await fetchAosomReviews("https://www.aosom.de/item/x~A.html", {
      sleep: async () => {},
      fetchImpl: (async () => {
        n++;
        if (n === 1) return { ok: false, status: 429 } as unknown as Response;
        if (n === 2) return { ok: false, status: 503 } as unknown as Response;
        return ok(sida({ "@type": "Product", aggregateRating: { ratingValue: 4.4, reviewCount: 3 } }));
      }) as unknown as typeof fetch,
    });
    expect(n).toBe(3);
    expect(r.rating).toBe(4.4);
  });

  it("ger upp direkt på 404 — den blir inte bättre av att frågas igen", async () => {
    let n = 0;
    const r = await fetchAosomReviews("https://www.aosom.de/item/x~A.html", {
      sleep: async () => {},
      fetchImpl: (async () => {
        n++;
        return { ok: false, status: 404 } as unknown as Response;
      }) as unknown as typeof fetch,
    });
    expect(n).toBe(1);
    expect(r.error).toBe("HTTP 404");
    expect(r.reviews).toEqual([]);
  });

  it("kastar aldrig — ett nätfel blir ett svar med error", async () => {
    const r = await fetchAosomReviews("https://www.aosom.de/item/x~A.html", {
      sleep: async () => {},
      fetchImpl: (async () => {
        throw new Error("ECONNRESET");
      }) as unknown as typeof fetch,
    });
    expect(r.error).toBe("ECONNRESET");
    expect(r.reviews).toEqual([]);
  });
});

describe("visningsnamn", () => {
  /** Hela vägen namn → det som faktiskt renderas på produktsidan. */
  function visasSom(namn: string | undefined): string {
    const html = sida({
      "@type": "Product",
      review: [{
        "@type": "Review",
        ...(namn ? { author: { name: namn } } : {}),
        description: "En tillräckligt lång recensionstext för att komma igenom.",
        reviewRating: { ratingValue: 5 },
      }],
    });
    const r = parseAosomProductReviews(html).reviews[0];
    return deriveInitials(r.customerName, ensureReviewId(r));
  }

  it("visar riktiga namn som initialer — samma format som AliExpress-raderna", () => {
    expect(visasSom("Leonard Araz")).toBe("L.A.");
    expect(visasSom("Siegfried K.")).toBe("S.K.");
    expect(visasSom("Elfriede Hühnerbein")).toBe("E.H.");
  });

  it("släpper aldrig igenom hela namnet", () => {
    for (const n of ["Leonard Araz", "Siegfried K.", "Elfriede Hühnerbein"]) {
      const visat = visasSom(n);
      expect(visat).not.toContain(n.split(" ")[0]);
      expect(visat).toMatch(/^[A-ZÅÄÖÜ]\.[A-ZÅÄÖÜ]\.$/);
    }
  });

  it("platshållaren ger INTE 'A.K.' på varenda rad", () => {
    // Två olika recensioner, båda signerade "Aosom Kunde": initialerna härleds
    // ur radens id och varierar, i stället för att bli samma bokstäver överallt.
    const html = sida({
      "@type": "Product",
      review: [
        { "@type": "Review", author: { name: "Aosom Kunde" }, description: "Toller Stuhl, immer wieder gerne, sehr bequem.", reviewRating: { ratingValue: 5 } },
        { "@type": "Review", author: { name: "Aosom Kunde" }, description: "In großen und ganzen ein Hingucker im Garten.", reviewRating: { ratingValue: 5 } },
      ],
    });
    const visade = parseAosomProductReviews(html).reviews
      .map((r) => deriveInitials(r.customerName, ensureReviewId(r)));
    expect(visade.every((v) => /^[A-ZÅÄÖÜ]\.[A-ZÅÄÖÜ]\.$/.test(v))).toBe(true);
    expect(visade[0]).not.toBe("A.K.");
    expect(new Set(visade).size).toBe(2);
  });
});
