import { describe, expect, it } from "vitest";
import { validateRedirect } from "./redirects";

// Valideringen är sista försvarslinjen innan en rad hamnar i den tabell som
// storefronten omdirigerar besökare med — en trasig rad kan i värsta fall peka
// kunder bort från sajten.
describe("validateRedirect", () => {
  it("godkänner en normal produkt→produkt-redirect", () => {
    expect(validateRedirect({ fromSlug: "gammal-produkt", toPath: "/produkt/ny-produkt" })).toBeNull();
  });

  it("godkänner produkt→kategori och svenska tecken i slug", () => {
    expect(validateRedirect({ fromSlug: "hopfallbart-babybadkar", toPath: "/kategori/baby-smabarn" })).toBeNull();
    expect(validateRedirect({ fromSlug: "vaxsmältare", toPath: "/kategori/hushallsapparater" })).toBeNull();
  });

  it("kräver fromSlug utan /produkt/-prefix", () => {
    expect(validateRedirect({ fromSlug: "", toPath: "/butik" })).toMatch(/saknas/);
    expect(validateRedirect({ fromSlug: "/produkt/x", toPath: "/butik" })).toMatch(/utan \/produkt\//);
  });

  it("stoppar externa och protokoll-relativa mål", () => {
    expect(validateRedirect({ fromSlug: "x", toPath: "https://evil.example" })).toMatch(/intern sökväg/);
    expect(validateRedirect({ fromSlug: "x", toPath: "//evil.example" })).toMatch(/intern sökväg/);
    expect(validateRedirect({ fromSlug: "x", toPath: "produkt/y" })).toMatch(/intern sökväg/);
  });

  it("stoppar radbrytningar/mellanslag i målet (header-smuggling)", () => {
    expect(validateRedirect({ fromSlug: "x", toPath: "/produkt/y\r\nSet-Cookie: a=b" })).toMatch(/radbrytningar/);
    expect(validateRedirect({ fromSlug: "x", toPath: "/produkt/y z" })).toMatch(/radbrytningar/);
  });

  it("stoppar self-redirect (skulle ge oändlig loop)", () => {
    expect(validateRedirect({ fromSlug: "samma", toPath: "/produkt/samma" })).toMatch(/samma sida/);
  });

  it("stoppar skräptecken i slug", () => {
    expect(validateRedirect({ fromSlug: "bad slug!", toPath: "/butik" })).toMatch(/ogiltig fromSlug/);
  });
});
