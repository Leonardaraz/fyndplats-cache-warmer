import { afterEach, describe, expect, it, vi } from "vitest";
import { oppetUtanKonfiguration } from "./sakerhetslage";

afterEach(() => vi.unstubAllEnvs());

describe("oppetUtanKonfiguration", () => {
  it("öppet bara i lokal utveckling och i prov", () => {
    expect(oppetUtanKonfiguration("development")).toBe(true);
    expect(oppetUtanKonfiguration("test")).toBe(true);
  });

  it("☠️ en driftsatt motor är stängd", () => {
    expect(oppetUtanKonfiguration("production")).toBe(false);
  });

  it("☠️ ett okänt eller tomt läge räknas som stängt, aldrig som öppet", () => {
    expect(oppetUtanKonfiguration("")).toBe(false);
    expect(oppetUtanKonfiguration("preview")).toBe(false);
    expect(oppetUtanKonfiguration("staging")).toBe(false);
    // Ingen slapp jämförelse: fel skiftläge eller ett mellanslag öppnar inget.
    expect(oppetUtanKonfiguration("Development")).toBe(false);
    expect(oppetUtanKonfiguration(" test")).toBe(false);
  });

  it("☠️ saknas NODE_ENV helt är det stängt", () => {
    // Ett utelämnat argument läser NODE_ENV. Finns den inte alls ska svaret
    // vara stängt: ett skript eller en miljö som inte säger vad den är får
    // aldrig det öppna läget på köpet.
    const fore = process.env.NODE_ENV;
    try {
      delete (process.env as Record<string, string | undefined>).NODE_ENV;
      expect(oppetUtanKonfiguration()).toBe(false);
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = fore;
    }
  });

  it("läser NODE_ENV när inget argument ges", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(oppetUtanKonfiguration()).toBe(false);
    vi.stubEnv("NODE_ENV", "development");
    expect(oppetUtanKonfiguration()).toBe(true);
  });
});
