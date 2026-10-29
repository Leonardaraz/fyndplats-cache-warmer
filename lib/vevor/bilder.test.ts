import { describe, expect, it } from "vitest";
import { bildnamn, valjVevorBilder } from "./bilder";
import { testbild, testgalleri } from "./testsida";

const namnen = (urls: string[]) => urls.map(bildnamn);

describe("bildnamn", () => {
  it("läser namnets sista led ur en adress med kodade snedstreck och fråga", () => {
    expect(bildnamn(testbild("m100-1.12.jpg"))).toBe("m100-1.12");
    expect(bildnamn(testbild("f3.jpg"))).toBe("f3");
    expect(bildnamn(testbild("m100-10.png"))).toBe("m100-10");
    expect(bildnamn(testbild("omslag.jpg"))).toBeNull();
    expect(bildnamn("https://img.example-cdn.test/us%2FX%E0%2Fa-f1.jpg")).toBe("f1");
  });
});

describe("valjVevorBilder", () => {
  it("vanliga mönstret, 12 bilder: VEVOR:s 9, 8, 1, 10, 11 och 12", () => {
    const v = valjVevorBilder(testgalleri());
    expect(v.monster).toBe("ny");
    expect(v.granskas).toBe(false);
    expect(v.egna).toBe(12);
    expect(namnen(v.urls)).toEqual(["m100-9", "m100-1.12", "m100-1.2", "m100-10", "m100-11", "m100-12"]);
  });

  it("vanliga mönstret med m100-1.1 i stället för m100-1.12", () => {
    const galleri = testgalleri();
    galleri[7] = { url: testbild("m100-1.1.jpg"), egen: true };
    expect(namnen(valjVevorBilder(galleri).urls)).toEqual([
      "m100-9",
      "m100-1.1",
      "m100-1.2",
      "m100-10",
      "m100-11",
      "m100-12",
    ]);
  });

  it("13 bilder i samma mönster räknas från slutet: n−3, n−4, 1, n−2, n−1, n", () => {
    const galleri = testgalleri();
    galleri.splice(7, 0, { url: testbild("f7.jpg"), egen: true });
    expect(galleri).toHaveLength(13);
    const v = valjVevorBilder(galleri);
    expect(v.monster).toBe("ny");
    expect(namnen(v.urls)).toEqual(["m100-9", "m100-1.12", "m100-1.2", "m100-10", "m100-11", "m100-12"]);
  });

  it("☠️ andra produkters bilder räknas aldrig, var de än står i galleriet", () => {
    const galleri = testgalleri();
    galleri.splice(3, 0, { url: testbild("m100-9.jpg", "ANNANMAPP0000000001"), egen: false });
    galleri.push({ url: testbild("m100-12.jpg", "ANNANMAPP0000000001"), egen: false });
    const v = valjVevorBilder(galleri);
    expect(v.monster).toBe("ny");
    expect(v.urls.every((u) => !u.includes("ANNANMAPP"))).toBe(true);
    expect(v.urls).toHaveLength(6);
  });

  it("äldre mönstret utan f-bilder: 1, 8, 9, 10, 11 och 12, och bildgranskning", () => {
    const galleri = ["m100-1.2", ...Array.from({ length: 11 }, (_, i) => `m100-${i + 2}`)].map((n) => ({
      url: testbild(`${n}.jpg`),
      egen: true,
    }));
    const v = valjVevorBilder(galleri);
    expect(v.monster).toBe("gammal");
    expect(v.granskas).toBe(true);
    expect(namnen(v.urls)).toEqual(["m100-1.2", "m100-8", "m100-9", "m100-10", "m100-11", "m100-12"]);
  });

  it("☠️ rätt antal men fel namn på slutet är inget vanligt mönster: sex första och bildgranskning", () => {
    const galleri = testgalleri();
    galleri[11] = { url: testbild("m100-13.jpg"), egen: true };
    const v = valjVevorBilder(galleri);
    expect(v.monster).toBe("okant");
    expect(v.granskas).toBe(true);
    expect(namnen(v.urls)).toEqual(["m100-1.2", "f1", "f2", "f3", "f4", "f5"]);
  });

  it("färre än sex egna bilder: alla, och bildgranskning; inga egna: inga bilder", () => {
    const tre = testgalleri().slice(0, 3);
    expect(valjVevorBilder(tre)).toMatchObject({ monster: "okant", granskas: true, egna: 3 });
    expect(valjVevorBilder(tre).urls).toHaveLength(3);
    const andras = testgalleri("ANNANMAPP0000000001").map((b) => ({ ...b, egen: false }));
    expect(valjVevorBilder(andras)).toEqual({ urls: [], monster: "okant", granskas: true, egna: 0 });
  });
});
