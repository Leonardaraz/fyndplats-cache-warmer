import { describe, expect, it } from "vitest";
import { sparningsLank } from "./tracking-link";

describe("sparningsLank", () => {
  it("bygger länken till vår egen spårsida", () => {
    expect(sparningsLank("07434005149850")).toBe("https://www.fyndplats.se/sparning?tn=07434005149850");
  });

  it("URL-kodar nummer med tecken som annars bryter query-strängen", () => {
    expect(sparningsLank("AB 12&34")).toBe("https://www.fyndplats.se/sparning?tn=AB%2012%2634");
  });

  it("tomt eller saknat nummer ger undefined — fältet ska utelämnas, inte skickas tomt", () => {
    expect(sparningsLank("")).toBeUndefined();
    expect(sparningsLank("   ")).toBeUndefined();
    expect(sparningsLank(null)).toBeUndefined();
    expect(sparningsLank(undefined)).toBeUndefined();
  });
});
