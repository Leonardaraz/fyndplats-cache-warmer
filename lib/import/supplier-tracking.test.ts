import { describe, expect, it } from "vitest";
import {
  computeComplaintRate,
  computeSupplierStatus,
  updateRunningAverage,
} from "./supplier-tracking";

describe("computeComplaintRate", () => {
  it("0 sålda → 0 % (kan inte dela på noll)", () => {
    expect(computeComplaintRate(0, 0)).toBe(0);
    expect(computeComplaintRate(3, 0)).toBe(0);
  });

  it("räknar andel sålda enheter som klagats på", () => {
    expect(computeComplaintRate(1, 10)).toBe(10);
    expect(computeComplaintRate(1, 20)).toBe(5);
    expect(computeComplaintRate(3, 100)).toBe(3);
  });

  it("avrundar till två decimaler", () => {
    expect(computeComplaintRate(1, 3)).toBe(33.33);
    expect(computeComplaintRate(2, 7)).toBe(28.57);
  });
});

describe("computeSupplierStatus", () => {
  it("blocked när klagomålsprocent > 10", () => {
    expect(computeSupplierStatus({ complaintRate: 12, avgShipDays: 5 })).toBe("blocked");
    expect(computeSupplierStatus({ complaintRate: 10.01, avgShipDays: 0 })).toBe("blocked");
  });

  it("warning när klagomålsprocent > 5 men ≤ 10", () => {
    expect(computeSupplierStatus({ complaintRate: 6, avgShipDays: 5 })).toBe("warning");
    expect(computeSupplierStatus({ complaintRate: 10, avgShipDays: 5 })).toBe("warning");
  });

  it("warning när låg klagomålsprocent men leveranstid > 30 dagar", () => {
    expect(computeSupplierStatus({ complaintRate: 2, avgShipDays: 31 })).toBe("warning");
    expect(computeSupplierStatus({ complaintRate: 0, avgShipDays: 45 })).toBe("warning");
  });

  it("good när allt är inom gränserna", () => {
    expect(computeSupplierStatus({ complaintRate: 5, avgShipDays: 30 })).toBe("good");
    expect(computeSupplierStatus({ complaintRate: 0, avgShipDays: 0 })).toBe("good");
    expect(computeSupplierStatus({ complaintRate: 4.99, avgShipDays: 29 })).toBe("good");
  });

  it("blockerad väger tyngre än leveranstid", () => {
    expect(computeSupplierStatus({ complaintRate: 15, avgShipDays: 40 })).toBe("blocked");
  });
});

describe("updateRunningAverage", () => {
  it("första sampelet blir medlet", () => {
    expect(updateRunningAverage(0, 0, 12)).toEqual({ avg: 12, samples: 1 });
  });

  it("uppdaterar löpande medel korrekt", () => {
    const a = updateRunningAverage(0, 0, 10); // 10
    const b = updateRunningAverage(a.avg, a.samples, 20); // (10+20)/2 = 15
    const c = updateRunningAverage(b.avg, b.samples, 30); // (10+20+30)/3 = 20
    expect(b).toEqual({ avg: 15, samples: 2 });
    expect(c).toEqual({ avg: 20, samples: 3 });
  });

  it("avrundar till två decimaler", () => {
    const a = updateRunningAverage(0, 0, 10);
    const b = updateRunningAverage(a.avg, a.samples, 11); // 10.5
    const c = updateRunningAverage(b.avg, b.samples, 11); // (10+11+11)/3 = 10.6667 → 10.67
    expect(c.avg).toBe(10.67);
  });
});
