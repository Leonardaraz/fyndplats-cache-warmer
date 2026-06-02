import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  describeRouting,
  isLatencyTolerant,
  resolveImportPath,
  type TriggerSource,
} from "./trigger-routing";

const BATCH_SOURCES: TriggerSource[] = ["bulk", "cron", "admin-batch"];
const REALTIME_SOURCES: TriggerSource[] = ["extension", "admin-singleton"];

beforeEach(() => {
  delete process.env.USE_BATCH_API;
});
afterEach(() => {
  delete process.env.USE_BATCH_API;
});

describe("isLatencyTolerant", () => {
  it("bakgrundskällor tål latens", () => {
    for (const s of BATCH_SOURCES) expect(isLatencyTolerant(s)).toBe(true);
  });
  it("UX-blockerande källor tål INTE latens", () => {
    for (const s of REALTIME_SOURCES) expect(isLatencyTolerant(s)).toBe(false);
  });
});

describe("resolveImportPath", () => {
  it("med USE_BATCH_API=false → ALLT realtid", () => {
    process.env.USE_BATCH_API = "false";
    for (const s of [...BATCH_SOURCES, ...REALTIME_SOURCES]) {
      expect(resolveImportPath(s)).toBe("realtime");
    }
  });

  it("med USE_BATCH_API=true → bakgrundskällor batch, UX-källor realtid", () => {
    process.env.USE_BATCH_API = "true";
    for (const s of BATCH_SOURCES) expect(resolveImportPath(s)).toBe("batch");
    for (const s of REALTIME_SOURCES) expect(resolveImportPath(s)).toBe("realtime");
  });

  it("extension är ALDRIG batch, ens med flaggan på", () => {
    process.env.USE_BATCH_API = "true";
    expect(resolveImportPath("extension")).toBe("realtime");
  });
});

describe("describeRouting", () => {
  it("nämner trigger + path", () => {
    process.env.USE_BATCH_API = "true";
    expect(describeRouting("bulk")).toContain("trigger=bulk");
    expect(describeRouting("bulk")).toContain("path=batch");
    expect(describeRouting("extension")).toContain("path=realtime");
  });
});
