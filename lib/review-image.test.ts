import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_MIME, MAX_BYTES, MAX_IMAGES, mediaFileName, validateUpload } from "./review-image.ts";
import { MAX_REVIEW_IMAGES } from "./review-images.ts";

describe("validateUpload", () => {
  it("slapper igenom de tillatna typerna", () => {
    for (const m of ALLOWED_MIME) assert.equal(validateUpload(1000, m), null);
  });

  it("tal en charset-svans pa mime-typen", () => {
    assert.equal(validateUpload(1000, "image/jpeg; charset=binary"), null);
    assert.equal(validateUpload(1000, "IMAGE/JPEG"), null);
  });

  it("avvisar for stora filer", () => {
    assert.equal(validateUpload(MAX_BYTES + 1, "image/jpeg"), "for_stor");
    assert.equal(validateUpload(MAX_BYTES, "image/jpeg"), null);
  });

  it("avvisar typer vi inte visar", () => {
    // SVG ar avsiktligt INTE tillaten: den kan bara skript och renderas inline.
    for (const m of ["image/svg+xml", "image/gif", "application/pdf", "text/html", "", null]) {
      assert.equal(validateUpload(1000, m), "fel_typ");
    }
  });

  it("avvisar tom fil", () => {
    assert.equal(validateUpload(0, "image/jpeg"), "tom");
  });
});

describe("mediaFileName", () => {
  it("innehaller aldrig kunddata", () => {
    const namn = mediaFileName("prod-123", "order-9__abc");
    assert.match(namn, /^omdome-[a-zA-Z0-9_-]+-[a-zA-Z0-9_-]+\.jpg$/);
  });

  it("rensar tecken som inte hor hemma i ett filnamn", () => {
    const namn = mediaFileName("../../etc/passwd", "a b/c");
    // Stammen (allt fore filandelsen) far inte bara sokvag eller blanksteg.
    const stam = namn.replace(/\.jpg$/, "");
    assert.doesNotMatch(stam, /[./\\ ]/, "ingen sokvag, inga blanksteg");
    assert.match(namn, /\.jpg$/);
  });

  it("ar deterministiskt — samma omdome ger samma namn", () => {
    assert.equal(mediaFileName("p", "r"), mediaFileName("p", "r"));
  });
});

describe("taket for antal bilder", () => {
  it("formularets tak och lagrets tak MASTE vara samma", () => {
    // Ar de olika accepterar formularet bilder som lagret sedan kapar bort —
    // kunden ser sin tredje bild i forhandsvisningen och den forsvinner.
    assert.equal(MAX_IMAGES, MAX_REVIEW_IMAGES);
  });
});

describe("mediaFileName med index", () => {
  it("ger UNIKA namn per bild inom samma omdome", () => {
    // Utan suffix hade bild 2 och 3 skrivit over den forsta i mediabiblioteket.
    const namn = [0, 1, 2].map((i) => mediaFileName("p", "r", i));
    assert.equal(new Set(namn).size, 3);
  });

  it("forsta bilden behaller det gamla namnet utan suffix", () => {
    assert.equal(mediaFileName("p", "r", 0), mediaFileName("p", "r"));
  });
});
