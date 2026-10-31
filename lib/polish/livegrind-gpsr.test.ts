// livegrind.py läser produktsäkerhetsfliken på den publicerade sidan. VEVOR:s
// flik har två parter ("Tillverkare" och "Ansvarig i EU") och en egen rad om
// bruksanvisningen, och första versionen kände bara Aosoms form: varje
// VEVOR-sida hade fällts med "fliken saknar tillverkaren" och en orddiff på
// butikens egen rad (2026-10-31). Fallen bor i livegrind.py (`--prov`), där
// regeln bor, och testet fäller om självprovet slutar gå igenom.
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const LIVEGRIND = resolve(__dirname, "../../tools/polish-gates/livegrind.py");

describe("livegrind: produktsäkerhetsfliken för Aosom och VEVOR", () => {
  it("självprovet går igenom", () => {
    const ut = execFileSync("python3", [LIVEGRIND, "--prov"], { encoding: "utf-8" });
    expect(ut).toContain("PROV OK");
  });
});
