import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MAX_REVIEW_IMAGES, isOwnReviewImageUrl, repairWixMediaUrl, reviewImageFields, reviewImages } from "./review-images.ts";

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

  it("ALLA tre nycklarna finns alltid — annars kan en spread inte rensa", () => {
    // Granskning 2026-08-19: forsta versionen utelamnade imageUrls vid EN bild.
    // Falten satts nastan alltid genom en spread over en BEFINTLIG rad, och en
    // nyckel som saknas i hogerledet lamnar det gamla vardet kvar.
    assert.deepEqual(reviewImageFields(["a.jpg"]), {
      hasImage: true,
      imageUrl: "a.jpg",
      imageUrls: ["a.jpg"],
    });
  });

  it("spread over en rad med gamla leverantorsadresser RENSAR dem", () => {
    const gammal = {
      hasImage: true,
      imageUrl: "https://ae-pic.aliexpress-media.com/a.jpg",
      imageUrls: [
        "https://ae-pic.aliexpress-media.com/a.jpg",
        "https://ae-pic.aliexpress-media.com/b.jpg",
      ],
    };
    const ny = { ...gammal, ...reviewImageFields(["https://static.wixstatic.com/egen.jpg"]) };
    assert.doesNotMatch(JSON.stringify(ny), /aliexpress/);
    assert.deepEqual(ny.imageUrls, ["https://static.wixstatic.com/egen.jpg"]);
  });

  it("ingen bild ger hasImage:false och tomma adressfalt", () => {
    assert.deepEqual(reviewImageFields([]), {
      hasImage: false, imageUrl: undefined, imageUrls: undefined,
    });
    assert.equal(reviewImageFields(["", "  "]).hasImage, false);
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

// Bakgrund: 2026-08-22 visade fem produkter fran dagens import tomma knappar i
// stallet for kundbilder. Wix CDN svarade 403 pa 22 adresser. Orsaken var inte
// adressformen utan att kontoprefixet saknades i det sparade id:t. Verifierat
// skarpt: samma id med prefix svarar 200 med riktig bilddata.
describe("repairWixMediaUrl", () => {
  const BAS = "https://static.wixstatic.com/media/";
  // De verkliga id:na fran utredningen.
  const TRASIG = "148e964cebe741d6b37d53b0089f06ef~mv2.jpg";
  const HEL = "b379ce_7c69b5057ea341c4ada2ec724bf54f83~mv2.jpg";

  it("satter tillbaka kontoprefixet nar det saknas", () => {
    assert.equal(repairWixMediaUrl(BAS + TRASIG), BAS + "b379ce_" + TRASIG);
  });

  it("ror inte en adress som redan har prefix", () => {
    assert.equal(repairWixMediaUrl(BAS + HEL), BAS + HEL);
  });

  it("behaller transform-suffixet", () => {
    const suffix = "/v1/fill/w_400,h_400,al_c,q_80/file.webp";
    assert.equal(repairWixMediaUrl(BAS + TRASIG + suffix), BAS + "b379ce_" + TRASIG + suffix);
  });

  it("ror inte andra vardar — leverantorsbilder ska lamnas ifred", () => {
    for (const u of [
      "https://ae01.alicdn.com/kf/Sabc123.jpg",
      "https://example.com/media/utan-understreck~mv2.jpg",
      "https://static.wixstatic.example/media/" + TRASIG,
    ]) {
      assert.equal(repairWixMediaUrl(u), u, u);
    }
  });

  it("skrap returneras oforandrat i stallet for att bli en halv adress", () => {
    for (const u of ["", "inte en adress", "wix:image://v1/abc~mv2.jpg", "/lokal/bild.jpg"]) {
      assert.equal(repairWixMediaUrl(u), u, JSON.stringify(u));
    }
  });

  it("lasvagen reparerar — det ar dar de 22 trasiga bilderna satt", () => {
    const ut = reviewImages({ imageUrl: BAS + TRASIG, imageUrls: [BAS + TRASIG] });
    assert.deepEqual(ut, [BAS + "b379ce_" + TRASIG]);
  });

  it("skrivvagen reparerar — butiken far aldrig spara en trasig adress", () => {
    // app/api/omdome/route.ts skriver kundens egna bilder genom den har vagen.
    const f = reviewImageFields([BAS + TRASIG]);
    assert.equal(f.imageUrl, BAS + "b379ce_" + TRASIG);
    assert.deepEqual(f.imageUrls, [BAS + "b379ce_" + TRASIG]);
  });

  it("reparerad och oreparerad form av SAMMA bild dedupas till en", () => {
    // En rad kan ha imageUrl utan prefix och imageUrls med — utan dedup efter
    // reparation hade kunden fatt samma bild tva ganger.
    const ut = reviewImages({ imageUrl: BAS + TRASIG, imageUrls: [BAS + "b379ce_" + TRASIG] });
    assert.deepEqual(ut, [BAS + "b379ce_" + TRASIG]);
  });
});

// Sedan bilderna laddas upp i egna anrop skickar klienten ADRESSERNA till
// sparningen i stallet for bytena. Utan den har kontrollen hade en giltig
// token kunnat peka ett omdome mot vilken bild som helst pa internet och fa
// den renderad pa produktsidan som ett kundfoto.
describe("isOwnReviewImageUrl", () => {
  const VAR = "https://static.wixstatic.com/media/b379ce_148e964cebe741d6b37d53b0089f06ef~mv2.jpg";

  it("slapper igenom var egen media, med och utan transform", () => {
    assert.equal(isOwnReviewImageUrl(VAR), true);
    assert.equal(isOwnReviewImageUrl(`${VAR}/v1/fit/w_600,h_600,q_85/file.jpg`), true);
    assert.equal(isOwnReviewImageUrl(`  ${VAR}  `), true);
  });

  it("slapper igenom den prefixlosa formen — den repareras till var egen", () => {
    // Samma reparation som lasvagen gor, sa en rad som fastnat i den gamla
    // formen inte avvisas i onodan.
    assert.equal(isOwnReviewImageUrl("https://static.wixstatic.com/media/148e964cebe741d6b37d53b0089f06ef~mv2.jpg"), true);
  });

  it("avvisar andra vardar", () => {
    assert.equal(isOwnReviewImageUrl("https://ae01.alicdn.com/kf/nagot.jpg"), false);
    assert.equal(isOwnReviewImageUrl("https://evil.example/bild.jpg"), false);
    // Vard som BORJAR ratt men inte ar det.
    assert.equal(isOwnReviewImageUrl("https://static.wixstatic.com.evil.example/media/b379ce_x~mv2.jpg"), false);
  });

  it("avvisar ett annat Wix-konto", () => {
    assert.equal(isOwnReviewImageUrl("https://static.wixstatic.com/media/aaaaaa_148e964c~mv2.jpg"), false);
  });

  it("avvisar http, skrap och fel typ", () => {
    assert.equal(isOwnReviewImageUrl("http://static.wixstatic.com/media/b379ce_x~mv2.jpg"), false);
    assert.equal(isOwnReviewImageUrl(""), false);
    assert.equal(isOwnReviewImageUrl("javascript:alert(1)"), false);
    assert.equal(isOwnReviewImageUrl(null), false);
    assert.equal(isOwnReviewImageUrl(42), false);
  });
});
