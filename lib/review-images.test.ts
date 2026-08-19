import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MAX_REVIEW_IMAGES, reviewImageFields, reviewImages } from "./review-images.ts";

// Datamodellen ar tvadelad med flit: imageUrl (forsta bilden, finns pa alla
// 1932 aldre rader) plus imageUrls (hela listan, pa nya rader). Testerna nedan
// lockar bakatkompatibiliteten — en aldre rad far aldrig sluta fungera.

describe("reviewImages", () => {
  it("laser en GAMMAL rad med bara imageUrl", () => {
    assert.deepEqual(reviewImages({ imageUrl: "a.jpg" }), ["a.jpg"]);
  });

  it("laser en NY rad med bada falten, forsta bilden forst", () => {
    assert.deepEqual(reviewImages({ imageUrl: "a.jpg", imageUrls: ["a.jpg", "b.jpg", "c.jpg"] }), [
      "a.jpg", "b.jpg", "c.jpg",
    ]);
  });

  it("dubbletter tas bort aven nar imageUrl upprepas i listan", () => {
    assert.deepEqual(reviewImages({ imageUrl: "a.jpg", imageUrls: ["b.jpg", "a.jpg"] }), [
      "a.jpg", "b.jpg",
    ]);
  });

  it("klarar imageUrls UTAN imageUrl", () => {
    assert.deepEqual(reviewImages({ imageUrls: ["b.jpg"] }), ["b.jpg"]);
  });

  it("tom lista nar raden saknar bilder — aldrig ett kast", () => {
    assert.deepEqual(reviewImages({}), []);
    assert.deepEqual(reviewImages(null), []);
    assert.deepEqual(reviewImages(undefined), []);
    assert.deepEqual(reviewImages({ imageUrl: "" }), []);
    assert.deepEqual(reviewImages({ imageUrl: "   " }), []);
  });

  it("tal skrap i imageUrls utan att slappa igenom det", () => {
    // Wix Data ar lost typat; faltet kan innehalla vad som helst.
    assert.deepEqual(reviewImages({ imageUrls: "inte-en-array" as unknown }), []);
    assert.deepEqual(reviewImages({ imageUrls: [null, 5, {}, "ok.jpg"] as unknown }), ["ok.jpg"]);
  });
});

describe("reviewImageFields", () => {
  it("haller hasImage, imageUrl och imageUrls i takt", () => {
    assert.deepEqual(reviewImageFields(["a.jpg", "b.jpg"]), {
      hasImage: true,
      imageUrl: "a.jpg",
      imageUrls: ["a.jpg", "b.jpg"],
    });
  });

  it("EN bild skriver inte imageUrls — gamla formen racker", () => {
    // Halller raderna sa lika de befintliga som mojligt.
    assert.deepEqual(reviewImageFields(["a.jpg"]), { hasImage: true, imageUrl: "a.jpg" });
  });

  it("ingen bild ger hasImage:false och inga adressfalt", () => {
    // VIKTIGT: imageUrl far inte bli undefined i objektet — JSON.stringify
    // tappar undefined, och items/save ar en HELERSATTNING. En rad som redan
    // har en bild skulle da tyst tappa den.
    assert.deepEqual(reviewImageFields([]), { hasImage: false });
    assert.deepEqual(reviewImageFields(["", "  "]), { hasImage: false });
  });

  it("kapar vid taket", () => {
    const manga = ["a", "b", "c", "d", "e"].map((x) => `${x}.jpg`);
    const f = reviewImageFields(manga);
    assert.equal((f.imageUrls).length, MAX_REVIEW_IMAGES);
    assert.equal(f.imageUrl, "a.jpg");
  });

  it("dubbletter raknas en gang mot taket", () => {
    assert.deepEqual(reviewImageFields(["a.jpg", "a.jpg", "b.jpg"]).imageUrls, ["a.jpg", "b.jpg"]);
  });

  it("rundgang: skriv och las ger samma lista", () => {
    const urls = ["a.jpg", "b.jpg", "c.jpg"];
    assert.deepEqual(reviewImages(reviewImageFields(urls)), urls);
  });
});
