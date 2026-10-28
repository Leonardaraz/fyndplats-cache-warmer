import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hamtaPrisjaktArtiklar, MIN_POSTER } from "./prisjakt-motor.ts";

// Påhittade artikelnummer (TEST-…). Riktiga får aldrig stå i repot.
function svar(body: unknown, status = 200): typeof fetch {
  return (async (_url: unknown, init?: RequestInit) => {
    svar.senast = init;
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  }) as typeof fetch;
}
svar.senast = undefined as RequestInit | undefined;

function manga(n: number): Record<string, { mpn: string; marke: string | null }> {
  const ut: Record<string, { mpn: string; marke: string | null }> = {};
  for (let i = 0; i < n; i++) ut[`v${i}`] = { mpn: `TEST-${String(i).padStart(4, "0")}`, marke: i % 2 ? "HOMCOM" : null };
  return ut;
}

describe("hamtaPrisjaktArtiklar", () => {
  it("skickar hemligheten och ber om ett ocachat svar", async () => {
    const f = svar({ ok: true, varianter: manga(MIN_POSTER), produkter: {} });
    const r = await hamtaPrisjaktArtiklar({ fetchImpl: f, hemlighet: "hemligt", url: "https://motor.test/x" });
    assert.equal(r.poster, MIN_POSTER);
    assert.equal((svar.senast?.headers as Record<string, string>).authorization, "Bearer hemligt");
    assert.equal(svar.senast?.cache, "no-store");
  });

  it("räknar ogiltiga poster och släpper dem", async () => {
    const varianter = { ...manga(MIN_POSTER), trasig: { mpn: 7 }, utan: null };
    const r = await hamtaPrisjaktArtiklar({ fetchImpl: svar({ ok: true, varianter, produkter: {} }), hemlighet: "h" });
    assert.equal(r.ogiltiga, 2);
    assert.equal(Object.hasOwn(r.artiklar.varianter, "trasig"), false);
  });

  it("kastar utan hemlighet, på fel status, fel form och för få poster — och felet bär inget nummer", async () => {
    const fall: Array<[string, Parameters<typeof hamtaPrisjaktArtiklar>[0]]> = [
      ["utan hemlighet", { fetchImpl: svar({}), hemlighet: undefined }],
      ["401", { fetchImpl: svar({ ok: false }, 401), hemlighet: "h" }],
      ["inte JSON", { fetchImpl: svar("<html>"), hemlighet: "h" }],
      ["fel form", { fetchImpl: svar({ ok: true, varianter: [] }), hemlighet: "h" }],
      ["för få", { fetchImpl: svar({ ok: true, varianter: manga(5), produkter: {} }), hemlighet: "h" }],
    ];
    for (const [namn, d] of fall) {
      await assert.rejects(hamtaPrisjaktArtiklar(d), (err: Error) => {
        assert.doesNotMatch(err.message, /TEST-/, namn);
        return true;
      }, namn);
    }
  });
});
