import { describe, expect, it } from "vitest";
import { buildCreateProductBody, type WixProductInput } from "./client";

const base: WixProductInput = {
  name: "Test",
  variants: [
    { sku: "s1", actualPrice: "199.00", choices: { Färg: "Röd", Storlek: "M" }, visible: true },
    { sku: "s2", actualPrice: "199.00", choices: { Färg: "Blå", Storlek: "M" }, visible: false },
  ],
};

function getOptions(body: Record<string, unknown>) {
  return (body.product as { options?: any[] }).options ?? [];
}
function getVariants(body: Record<string, unknown>) {
  return (body.product as { variantsInfo: { variants: any[] } }).variantsInfo.variants;
}

describe("buildCreateProductBody — swatches", () => {
  it("renders a colour option as SWATCH_CHOICES with ONE_COLOR + colorCode", () => {
    const body = buildCreateProductBody({
      ...base,
      options: [
        { name: "Färg", choices: [{ name: "Röd", colorCode: "#CC2222" }, { name: "Blå", colorCode: "#2233CC" }] },
        { name: "Storlek", choices: [{ name: "M" }] },
      ],
    });
    const opts = getOptions(body);
    const color = opts.find((o) => o.name === "Färg");
    const size = opts.find((o) => o.name === "Storlek");

    expect(color.optionRenderType).toBe("SWATCH_CHOICES");
    expect(color.choicesSettings.choices[0]).toEqual({ choiceType: "ONE_COLOR", name: "Röd", colorCode: "#CC2222" });
    expect(size.optionRenderType).toBe("TEXT_CHOICES");
    expect(size.choicesSettings.choices[0]).toEqual({ choiceType: "CHOICE_TEXT", name: "M" });
  });

  it("falls back to text when any colour choice lacks a code", () => {
    const body = buildCreateProductBody({
      ...base,
      options: [{ name: "Färg", choices: [{ name: "Röd", colorCode: "#CC2222" }, { name: "Blå" }] }],
    });
    expect(getOptions(body)[0].optionRenderType).toBe("TEXT_CHOICES");
  });

  it("stamps the option renderType onto each variant choice", () => {
    const body = buildCreateProductBody({
      ...base,
      options: [
        { name: "Färg", choices: [{ name: "Röd", colorCode: "#CC2222" }, { name: "Blå", colorCode: "#2233CC" }] },
        { name: "Storlek", choices: [{ name: "M" }] },
      ],
    });
    const v0 = getVariants(body)[0];
    const colorChoice = v0.choices.find((c: any) => c.optionChoiceNames.optionName === "Färg");
    expect(colorChoice.optionChoiceNames.renderType).toBe("SWATCH_CHOICES");
  });

  it("keeps the visible flag (hidden variants still created)", () => {
    const body = buildCreateProductBody(base);
    const variants = getVariants(body);
    expect(variants[0].visible).toBe(true);
    expect(variants[1].visible).toBe(false);
  });
});
