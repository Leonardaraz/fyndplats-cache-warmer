import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

// /admin i en driftsatt motor: saknas inloggningsinställningen NEKAS sidorna.
// Förut släpptes allt igenom då (☠️ en tappad variabel öppnade admin).

const basic = (u: string, p: string) => `Basic ${btoa(`${u}:${p}`)}`;
const anrop = (vag: string, rubriker: Record<string, string> = {}) =>
  middleware(new NextRequest(`https://motor.example${vag}`, { headers: rubriker }));
/** Next markerar "släpp vidare till sidan" med den här rubriken. */
const slapptesIgenom = (res: Response) => res.headers.get("x-middleware-next") === "1";

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("ADMIN_BASIC_USER", "");
  vi.stubEnv("ADMIN_BASIC_PASS", "");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("middleware — /admin", () => {
  it("☠️ utan inställning i drift → 503 med konfigurationsfel, sidan nås inte", async () => {
    for (const vag of ["/admin", "/admin/queue", "/admin/medlemmar"]) {
      const res = anrop(vag);
      expect(res.status).toBe(503);
      expect(slapptesIgenom(res)).toBe(false);
      expect(res.headers.get("cache-control")).toBe("no-store");
      const text = await res.text();
      expect(text).toContain("ADMIN_BASIC_USER");
      expect(text).toContain("ADMIN_BASIC_PASS");
    }
    expect(vi.mocked(console.error)).toHaveBeenCalled();
  });

  it("☠️ inloggningsuppgifter hjälper inte när inställningen saknas", () => {
    expect(anrop("/admin", { authorization: basic("leo", "hemligt") }).status).toBe(503);
    vi.stubEnv("ADMIN_BASIC_USER", "leo");
    expect(anrop("/admin", { authorization: basic("leo", "hemligt") }).status).toBe(503);
  });

  it("med inställning: utan eller med fel uppgifter → 401 och en inloggningsfråga", () => {
    vi.stubEnv("ADMIN_BASIC_USER", "leo");
    vi.stubEnv("ADMIN_BASIC_PASS", "hemligt");
    const fall: Record<string, string>[] = [{}, { authorization: basic("leo", "fel") }];
    for (const rubriker of fall) {
      const res = anrop("/admin/queue", rubriker);
      expect(res.status).toBe(401);
      expect(res.headers.get("www-authenticate")).toContain("Basic");
      expect(slapptesIgenom(res)).toBe(false);
    }
  });

  it("med inställning och rätt uppgifter → sidan nås", () => {
    vi.stubEnv("ADMIN_BASIC_USER", "leo");
    vi.stubEnv("ADMIN_BASIC_PASS", "hemligt");
    const res = anrop("/admin/queue", { authorization: basic("leo", "hemligt") });
    expect(res.status).toBe(200);
    expect(slapptesIgenom(res)).toBe(true);
  });

  it("lokalt och i prov är det öppet utan inställning, som förut", () => {
    for (const lage of ["development", "test"]) {
      vi.stubEnv("NODE_ENV", lage);
      const res = anrop("/admin");
      expect(res.status).toBe(200);
      expect(slapptesIgenom(res)).toBe(true);
    }
  });

  it("/api berörs inte av admin-skyddet", () => {
    const res = anrop("/api/health");
    expect(res.status).toBe(200);
    expect(slapptesIgenom(res)).toBe(true);
  });
});
