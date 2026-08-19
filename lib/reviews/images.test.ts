import { describe, expect, it } from "vitest";
import { MAX_REVIEW_IMAGES, reviewImageFields, reviewImages } from "./images";

// Datamodellen ar tvadelad med flit: imageUrl (forsta bilden, finns pa alla
// 1932 aldre rader) plus imageUrls (hela listan, pa nya rader). Testerna nedan
// lockar bakatkompatibiliteten — en aldre rad far aldrig sluta fungera.

describe("reviewImages", () => {
  it("laser en GAMMAL rad med bara imageUrl", () => {
    expect(reviewImages({ imageUrl: "a.jpg" })).toEqual(["a.jpg"]);
  });

  it("laser en NY rad med bada falten, forsta bilden forst", () => {
    expect(reviewImages({ imageUrl: "a.jpg", imageUrls: ["a.jpg", "b.jpg", "c.jpg"] }))
      .toEqual(["a.jpg", "b.jpg", "c.jpg"]);
  });

  it("dubbletter tas bort aven nar imageUrl upprepas i listan", () => {
    expect(reviewImages({ imageUrl: "a.jpg", imageUrls: ["b.jpg", "a.jpg"] }))
      .toEqual(["a.jpg", "b.jpg"]);
  });

  it("klarar imageUrls UTAN imageUrl", () => {
    expect(reviewImages({ imageUrls: ["b.jpg"] })).toEqual(["b.jpg"]);
  });

  it("tom lista nar raden saknar bilder — aldrig ett kast", () => {
    expect(reviewImages({})).toEqual([]);
    expect(reviewImages(null)).toEqual([]);
    expect(reviewImages(undefined)).toEqual([]);
    expect(reviewImages({ imageUrl: "" })).toEqual([]);
    expect(reviewImages({ imageUrl: "   " })).toEqual([]);
  });

  it("tal skrap i imageUrls utan att slappa igenom det", () => {
    // Wix Data ar lost typat; faltet kan innehalla vad som helst.
    expect(reviewImages({ imageUrls: "inte-en-array" as unknown })).toEqual([]);
    expect(reviewImages({ imageUrls: [null, 5, {}, "ok.jpg"] as unknown })).toEqual(["ok.jpg"]);
  });
});

describe("reviewImageFields", () => {
  it("haller hasImage, imageUrl och imageUrls i takt", () => {
    expect(reviewImageFields(["a.jpg", "b.jpg"])).toEqual({
      hasImage: true,
      imageUrl: "a.jpg",
      imageUrls: ["a.jpg", "b.jpg"],
    });
  });

  it("ALLA tre nycklarna finns alltid — annars kan en spread inte rensa", () => {
    // Granskning 2026-08-19: forsta versionen utelamnade imageUrls vid EN bild.
    // Falten satts nastan alltid genom en spread over en BEFINTLIG rad, och en
    // nyckel som saknas i hogerledet lamnar det gamla vardet kvar.
    expect(reviewImageFields(["a.jpg"])).toEqual({
      hasImage: true,
      imageUrl: "a.jpg",
      imageUrls: ["a.jpg"],
    });
    expect(Object.keys(reviewImageFields([])).sort()).toEqual(["hasImage", "imageUrl", "imageUrls"]);
  });

  it("spread over en rad med gamla leverantorsadresser RENSAR dem", () => {
    // Den faktiska buggen, reproducerad: withOwnImage flyttade hem imageUrl men
    // lamnade ett imageUrls fullt av aliexpress-media.com — alltsa exakt den
    // lacka funktionen finns for att stoppa, aterinford bakvagen.
    const gammal = {
      hasImage: true,
      imageUrl: "https://ae-pic.aliexpress-media.com/a.jpg",
      imageUrls: [
        "https://ae-pic.aliexpress-media.com/a.jpg",
        "https://ae-pic.aliexpress-media.com/b.jpg",
      ],
    };
    const ny = { ...gammal, ...reviewImageFields(["https://static.wixstatic.com/egen.jpg"]) };
    expect(JSON.stringify(ny)).not.toContain("aliexpress");
    expect(ny.imageUrls).toEqual(["https://static.wixstatic.com/egen.jpg"]);
  });

  it("spread rensar aven nar bilderna forsvunnit helt", () => {
    const gammal = { hasImage: true, imageUrl: "a.jpg", imageUrls: ["a.jpg", "b.jpg"] };
    const ny = { ...gammal, ...reviewImageFields([]) };
    expect(ny.hasImage).toBe(false);
    expect(ny.imageUrl).toBeUndefined();
    expect(ny.imageUrls).toBeUndefined();
  });

  it("ingen bild ger hasImage:false och tomma adressfalt", () => {
    // undefined ar RATT varde har: items/save ar en helersattning och
    // JSON.stringify tappar undefined, sa faltet forsvinner ur raden — vilket
    // ar vad vi vill nar bilderna faktiskt ar borta.
    expect(reviewImageFields([])).toEqual({ hasImage: false, imageUrl: undefined, imageUrls: undefined });
    expect(reviewImageFields(["", "  "]).hasImage).toBe(false);
  });

  it("kapar vid taket", () => {
    const manga = ["a", "b", "c", "d", "e"].map((x) => `${x}.jpg`);
    const f = reviewImageFields(manga);
    expect(f.imageUrls).toHaveLength(MAX_REVIEW_IMAGES);
    expect(f.imageUrl).toBe("a.jpg");
  });

  it("dubbletter raknas en gang mot taket", () => {
    expect(reviewImageFields(["a.jpg", "a.jpg", "b.jpg"]).imageUrls).toEqual(["a.jpg", "b.jpg"]);
  });

  it("rundgang: skriv och las ger samma lista", () => {
    const urls = ["a.jpg", "b.jpg", "c.jpg"];
    expect(reviewImages(reviewImageFields(urls))).toEqual(urls);
  });
});
