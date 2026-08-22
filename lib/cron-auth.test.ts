import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";

// Cron-rutternas auth ska ALLTID faila stängt när CRON_SECRET saknas.
//
// Bakgrund (2026-08-22): `review-queue` och `review-translate` svarade
// `if (!secret) return true` — alltså ÖPPEN endpoint utan nyckel. Den senare
// kan skriva om recensionstext och PUBLICERA den till kundsidor. I produktionen
// är nyckeln satt, så de var skyddade i praktiken; felet var att defaulten pekade
// åt fel håll på just den rutt där det spelade mest roll.
//
// Testet läser källfilerna i stället för att importera dem: rutterna drar in
// halva applikationen (Wix-klienter, store, LLM) och skulle behöva mockas var
// för sig.
//
// Det som låses är ANTI-MÖNSTRET, inte en viss kodform. Rutterna använder tre
// olika auth-former i dag (enkel jämförelse, timing-safe, samt fallback på
// EXTENSION_API_TOKEN) och alla tre är i sin ordning — det enda som aldrig är
// det är att sakna nyckel och ändå släppa igenom.

function cronRutter(): string[] {
  return execSync("ls app/api/cron/*/route.ts", { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);
}

describe("cron-rutternas auth", () => {
  const rutter = cronRutter();

  it("hittar rutterna över huvud taget", () => {
    // Utan den här raden blir testet grön-och-tomt om sökvägen ändras.
    expect(rutter.length).toBeGreaterThanOrEqual(10);
  });

  it("ingen rutt släpper igenom anrop när hemligheten saknas", () => {
    const oppna = rutter.filter((fil) => {
      const src = execSync(`cat ${fil}`, { encoding: "utf8" });
      // "saknas hemligheten → släpp in" i någon av sina former.
      return /if \(!\w+\)\s*return true/.test(src);
    });
    expect(oppna).toEqual([]);
  });

  it("varje rutt som läser CRON_SECRET jämför den också mot ett headervärde", () => {
    const utanJamforelse = rutter.filter((fil) => {
      const src = execSync(`cat ${fil}`, { encoding: "utf8" });
      if (!src.includes("process.env.CRON_SECRET")) return false;
      // Antingen direkt strängjämförelse eller timingSafeEqual.
      return !/Bearer \$\{/.test(src) || !/=== `Bearer|timingSafeEqual/.test(src);
    });
    expect(utanJamforelse).toEqual([]);
  });
});
