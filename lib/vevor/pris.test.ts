import { describe, expect, it } from "vitest";
import { MAX_RABATT_PROCENT, RabattFel, VEVOR_MOMSDELARE, tolkaRabatt, vevorLandadKostnadSek } from "./pris";

// Varje rabatt och pris här är påhittat. Den riktiga nivån står bara i
// FyndplatsAppConfig, aldrig i repot.

describe("tolkaRabatt", () => {
  it("läser procent med komma, punkt och procenttecken", () => {
    expect(tolkaRabatt("4")).toBeCloseTo(0.04, 10);
    expect(tolkaRabatt("4,25")).toBeCloseTo(0.0425, 10);
    expect(tolkaRabatt("4.25 %")).toBeCloseTo(0.0425, 10);
    expect(tolkaRabatt(" 0 ")).toBe(0);
    expect(tolkaRabatt(String(MAX_RABATT_PROCENT))).toBeCloseTo(MAX_RABATT_PROCENT / 100, 10);
  });

  it("☠️ en saknad rabatt kastar, i stället för att bli 0", () => {
    expect(() => tolkaRabatt(undefined)).toThrow(RabattFel);
    expect(() => tolkaRabatt("")).toThrow(RabattFel);
    expect(() => tolkaRabatt("   ")).toThrow(RabattFel);
  });

  it("☠️ allt som inte är en procent kastar, och meddelandet bär aldrig värdet", () => {
    for (const fel of ["4,257", "abc", "-4", "4%%", "0.0425", "31", "99"]) {
      let meddelande = "";
      try {
        tolkaRabatt(fel);
      } catch (err) {
        expect(err).toBeInstanceOf(RabattFel);
        meddelande = (err as Error).message;
      }
      expect(meddelande, fel).not.toBe("");
      expect(meddelande).not.toContain(fel);
    }
  });
});

describe("vevorLandadKostnadSek", () => {
  it("sidans pris ÷ 1,24 × (1 − rabatten) × 1,25", () => {
    expect(VEVOR_MOMSDELARE).toBe(1.24);
    // 1 240 / 1,24 = 1 000; × 0,9575 = 957,50; × 1,25 = 1 196,875
    expect(vevorLandadKostnadSek(1240, 0.0425)).toBe(1196.88);
    expect(vevorLandadKostnadSek(1240, 0)).toBe(1250);
  });

  it("vägrar ett pris som inte är ett positivt tal, och en rabatt utanför gränserna", () => {
    expect(() => vevorLandadKostnadSek(0, 0.04)).toThrow();
    expect(() => vevorLandadKostnadSek(Number.NaN, 0.04)).toThrow();
    expect(() => vevorLandadKostnadSek(100, -0.01)).toThrow(RabattFel);
    expect(() => vevorLandadKostnadSek(100, 0.31)).toThrow(RabattFel);
  });
});
