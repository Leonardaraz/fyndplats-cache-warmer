import { describe, expect, it, vi } from "vitest";
import { mergePricingRules } from "./pricing-config";
import { ROUNDING_STRATEGIES } from "../import/types";
import { roundPrice } from "../import/pricing";

describe("mergePricingRules — avrundningsstrategin valideras", () => {
  it("☠️ ett okänt strateginamn faller tillbaka i stället för att tyst bli 'none'", () => {
    // roundPrice känner inte igen värdet och returnerar då priset OAVRUNDAT.
    // Uppmätt före spärren: roundPrice(541.85, "charm99 ") = 541.85 — ett
    // blanksteg i configraden hade stängt av charm-prissättningen för hela
    // katalogen och börjat skriva örespriser till kund, utan ett enda fel.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const trasigt of ["charm99 ", "charm-99", "CHARM99", "", "charm8", 99]) {
      const ut = mergePricingRules({ rounding: trasigt as never });
      expect(ROUNDING_STRATEGIES).toContain(ut.rounding);
      // och priset blir fortfarande ett charm-pris, inte 541.85
      expect(roundPrice(541.85, ut.rounding) % 1).toBe(0);
    }
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("varnar synligt — ett tyst fallback är samma fälla en gång till", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mergePricingRules({ rounding: "charm-99" as never });
    expect(warn.mock.calls[0]?.[0]).toMatch(/okänd avrundningsstrategi/i);
    warn.mockRestore();
  });

  it("släpper igenom varje giltig strategi orörd", () => {
    for (const s of ROUNDING_STRATEGIES) {
      expect(mergePricingRules({ rounding: s }).rounding).toBe(s);
    }
  });

  it("saknat värde ger default utan varning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(ROUNDING_STRATEGIES).toContain(mergePricingRules(null).rounding);
    expect(mergePricingRules({}).rounding).toBeDefined();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("PRICE_ROUNDING från env valideras också", () => {
  it("☠️ ett trasigt env-värde castas inte igenom", async () => {
    // Spärren i mergePricingRules faller tillbaka på base.rounding — som kommer
    // HÄRIFRÅN. Utan den här kontrollen hade fallbacken varit meningslös.
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("lib/config.ts", "utf8");
    expect(src).not.toMatch(/process\.env\.PRICE_ROUNDING as /);
    expect(src).toMatch(/isRoundingStrategy\(process\.env\.PRICE_ROUNDING\)/);
  });
});

describe("admin-dropdownen täcker alla strategier", () => {
  it("☠️ listan i editor-client får inte glida från typen", async () => {
    // Samma klass som SHIP_AXIS_RE och EU_TULL_CODES: två listor över samma
    // sak glider isär. En strategi som saknas i dropdownen går inte att välja;
    // en som inte finns i typen går inte att spara.
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("app/admin/pricing/editor-client.tsx", "utf8");
    for (const s of ROUNDING_STRATEGIES) {
      expect(src).toContain(`value: "${s}"`);
    }
  });
});
