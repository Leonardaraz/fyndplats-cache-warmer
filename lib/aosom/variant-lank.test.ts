import { describe, it, expect, vi } from "vitest";
import { lankaVarianter, type LankbarRad } from "./variant-lank";

const rad = (r: LankbarRad): LankbarRad => r;

const HUVUD = "https://www.aosom.de/item/x~HUVUD.html?utm_source=b2b";
const VARIANT = "https://www.aosom.de/item/x~VARIANT.html?utm_source=b2b";

describe("lankaVarianter", () => {
  it("byter till variantens egen Aosom-adress när kunden köpte en annan artikel än huvudartikeln", async () => {
    const feed = vi.fn(async () => [{ sku: "A-1", url: HUVUD }, { sku: "a-2", url: VARIANT }]);
    const [r] = await lankaVarianter([rad({ artikelnummer: "A-2", huvudartikel: "A-1", kallUrl: HUVUD })], feed);
    expect(r.kallUrl).toBe(VARIANT);
    expect(r.varning).toBeUndefined();
  });

  it("hämtar inte flödet när raden redan är huvudartikeln", async () => {
    const feed = vi.fn(async () => []);
    const rader = [{ artikelnummer: "A-1", huvudartikel: "A-1", kallUrl: HUVUD }, { artikelnummer: "X", kallUrl: null }];
    expect(await lankaVarianter(rader, feed)).toBe(rader);
    expect(feed).not.toHaveBeenCalled();
  });

  it("hämtar flödet en gång för flera rader", async () => {
    const feed = vi.fn(async () => [{ sku: "A-2", url: VARIANT }, { sku: "B-2", url: "https://www.aosom.de/item/y~B2.html" }]);
    const ut = await lankaVarianter([
      { artikelnummer: "A-2", huvudartikel: "A-1", kallUrl: HUVUD },
      { artikelnummer: "B-2", huvudartikel: "B-1", kallUrl: HUVUD },
    ], feed);
    expect(feed).toHaveBeenCalledTimes(1);
    expect(ut.map((r) => r.kallUrl)).toEqual([VARIANT, "https://www.aosom.de/item/y~B2.html"]);
  });

  it("varnar och behåller huvudsidan när artikeln saknas i flödet", async () => {
    const [r] = await lankaVarianter([rad({ artikelnummer: "A-2", huvudartikel: "A-1", kallUrl: HUVUD })], async () => []);
    expect(r.kallUrl).toBe(HUVUD);
    expect(r.varning).toMatch(/Välj varianten med artikelnummer A-2/);
  });

  it("varnar när flödet inte går att hämta", async () => {
    const [r] = await lankaVarianter(
      [{ artikelnummer: "A-2", huvudartikel: "A-1", kallUrl: HUVUD, varning: "Tidigare." }],
      async () => { throw new Error("503"); },
    );
    expect(r.kallUrl).toBe(HUVUD);
    expect(r.varning).toMatch(/^Tidigare\. Länken öppnar produktens huvudsida \(Aosoms flöde gick inte att hämta\)/);
  });
});
