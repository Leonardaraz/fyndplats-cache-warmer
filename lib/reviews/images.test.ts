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

  it("EN bild skriver inte imageUrls — gamla formen racker", () => {
    // Halller raderna sa lika de befintliga som mojligt.
    expect(reviewImageFields(["a.jpg"])).toEqual({ hasImage: true, imageUrl: "a.jpg" });
  });

  it("ingen bild ger hasImage:false och inga adressfalt", () => {
    // VIKTIGT: imageUrl far inte bli undefined i objektet — JSON.stringify
    // tappar undefined, och items/save ar en HELERSATTNING. En rad som redan
    // har en bild skulle da tyst tappa den.
    expect(reviewImageFields([])).toEqual({ hasImage: false });
    expect(reviewImageFields(["", "  "])).toEqual({ hasImage: false });
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
