import { describe, it } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { processReviewImage } from "./review-image-process.ts";

// Kundbilden publiceras offentligt pa produktsidan. Tva krav som drar at olika
// hall maste bada halla, och de testas har for att ingen ska "stada" bort det
// ena av misstag.

const AI_XMP =
  '<?xpacket begin="?"?><x:xmpmeta xmlns:x="adobe:ns:meta/">' +
  '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
  '<rdf:Description xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" ' +
  'Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia"/>' +
  "</rdf:RDF></x:xmpmeta><?xpacket end=\"w\"?>";

async function mobilfoto(): Promise<Buffer> {
  return sharp({ create: { width: 60, height: 40, channels: 3, background: "#8899aa" } })
    .jpeg()
    .withExif({
      IFD0: { Copyright: "Kund" },
      // Koordinaterna ett mobilfoto bar med sig.
      GPSIFD: { GPSLatitudeRef: "N", GPSLatitude: "59/1 20/1 0/1" },
    })
    .withXmp(AI_XMP)
    .toBuffer();
}

describe("processReviewImage — metadata", () => {
  it("SLANGER EXIF: kundens GPS far aldrig publiceras", () => {
    // Ett mobilfoto bar exakta koordinater. Publicerat avslojar det var kunden
    // bor — en konkret skada mot en verklig person.
    return (async () => {
      const fore = await sharp(await mobilfoto()).metadata();
      assert.ok(fore.exif, "testbilden ska ha EXIF att bli av med");

      const efter = await sharp(await processReviewImage(await mobilfoto())).metadata();
      assert.equal(efter.exif, undefined, "EXIF (och darmed GPS) ska vara borta");
    })();
  });

  it("BEHALLER XMP: AI-proveniensen far aldrig strippas", () => {
    // C2PA och IPTC:s DigitalSourceType ligger i XMP. Att tvatta bort den och
    // publicera bilden som ett kundfoto vore att dolja precis det markningen
    // finns for.
    return (async () => {
      const efter = await sharp(await processReviewImage(await mobilfoto())).metadata();
      assert.ok(efter.xmp, "XMP ska overleva");
      assert.match(String(efter.xmp), /trainedAlgorithmicMedia/);
    })();
  });

  it("skalar ner stora bilder men forstorar aldrig sma", async () => {
    const stor = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: "#fff" } })
      .jpeg().toBuffer();
    assert.equal((await sharp(await processReviewImage(stor)).metadata()).width, 1600);

    const liten = await sharp({ create: { width: 300, height: 200, channels: 3, background: "#fff" } })
      .jpeg().toBuffer();
    assert.equal((await sharp(await processReviewImage(liten)).metadata()).width, 300);
  });

  it("normaliserar alltid till JPEG", async () => {
    const png = await sharp({ create: { width: 50, height: 50, channels: 4, background: "#0000" } })
      .png().toBuffer();
    assert.equal((await sharp(await processReviewImage(png)).metadata()).format, "jpeg");
  });
});
