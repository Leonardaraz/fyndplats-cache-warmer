import { describe, expect, it } from "vitest";
import { butikensAdress } from "./butik-neon-till-wix";

describe("butikensAdress", () => {
  it("skickar bara kopieringens parametrar vidare, till butikens rutt", () => {
    const ut = new URL(
      butikensAdress(
        "https://motor.example/api/admin/butik-neon-till-wix?lage=kopiera&dryRun=false&tabeller=orders&key=hemlig&after=f1.abc",
        "https://www.fyndplats.se/",
      ),
    );
    expect(ut.origin + ut.pathname).toBe("https://www.fyndplats.se/api/admin/neon-till-wix");
    expect([...ut.searchParams.keys()].sort()).toEqual(["after", "dryRun", "lage", "tabeller"]);
    expect(ut.searchParams.get("key")).toBeNull();
  });
});
