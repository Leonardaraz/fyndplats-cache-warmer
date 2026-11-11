import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FLODEN_ATT_HALLA_FARSKA, flodesrad, hamtaFloden } from "./flodesvarmning.ts";

const svar = (status: number, huvuden: Record<string, string>, kropp = "<x/>") =>
  new Response(kropp, { status, headers: huvuden });

describe("hamtaFloden", () => {
  it("hämtar sitemapen och de tre öppna flödena, ett i taget och i ordning", async () => {
    const anrop: string[] = [];
    let samtidigt = 0;
    let mest = 0;
    const hamta = (async (adress: string) => {
      anrop.push(String(adress));
      samtidigt++;
      mest = Math.max(mest, samtidigt);
      await new Promise((r) => setTimeout(r, 5));
      samtidigt--;
      return svar(200, { "x-vercel-cache": "STALE", age: "7586" });
    }) as unknown as typeof fetch;
    const { utfall, hoppade } = await hamtaFloden("https://www.fyndplats.se", { hamta });
    assert.deepEqual(anrop, [
      "https://www.fyndplats.se/sitemap.xml",
      "https://www.fyndplats.se/feed/google.xml",
      "https://www.fyndplats.se/feed/products.xml",
      "https://www.fyndplats.se/feed/pricerunner.xml",
    ]);
    assert.equal(mest, 1);
    assert.deepEqual(hoppade, []);
    assert.deepEqual(utfall.map((u) => [u.path, u.status, u.cache, u.alderS]), FLODEN_ATT_HALLA_FARSKA.map((p) => [p, 200, "STALE", 7586]));
  });

  it("läser svaret till slut", async () => {
    let lasta = 0;
    const hamta = (async () => {
      const bitar = [new Uint8Array(10), new Uint8Array(20), new Uint8Array(30)];
      const strom = new ReadableStream<Uint8Array>({
        pull(c) {
          const b = bitar.shift();
          if (!b) return c.close();
          lasta += b.length;
          c.enqueue(b);
        },
      });
      return new Response(strom, { status: 200 });
    }) as unknown as typeof fetch;
    await hamtaFloden("https://x", { hamta });
    assert.equal(lasta, 60 * FLODEN_ATT_HALLA_FARSKA.length);
  });

  it("ett fel i ett flöde stoppar inte de andra", async () => {
    let n = 0;
    const hamta = (async () => {
      n++;
      if (n === 2) throw new Error("timeout");
      return svar(n === 3 ? 500 : 200, {});
    }) as unknown as typeof fetch;
    const { utfall } = await hamtaFloden("https://x", { hamta });
    assert.deepEqual(utfall.map((u) => u.status), [200, 0, 500, 200]);
    assert.equal(utfall[1].cache, "fel");
  });

  it("slutar när tidsbudgeten är förbrukad och säger vad som blev kvar", async () => {
    let klocka = 0;
    const hamta = (async () => {
      klocka += 100_000;
      return svar(200, {});
    }) as unknown as typeof fetch;
    const { utfall, hoppade } = await hamtaFloden("https://x", { hamta, nu: () => klocka, budgetMs: 240_000 });
    assert.equal(utfall.length, 3);
    assert.deepEqual(hoppade, ["/feed/pricerunner.xml"]);
  });

  it("listan bär aldrig Prisjakts adresser", () => {
    for (const p of FLODEN_ATT_HALLA_FARSKA) assert.doesNotMatch(p, /prisjakt/i);
  });
});

describe("flodesrad", () => {
  it("en rad med status, cache och ålder", () => {
    assert.equal(flodesrad({ path: "/feed/google.xml", status: 200, cache: "STALE", alderS: 7586, ms: 412 }), "/feed/google.xml 200 STALE 7586 s (0,4 s)");
    assert.equal(flodesrad({ path: "/sitemap.xml", status: 0, cache: "fel", alderS: 0, ms: 150_000 }), "/sitemap.xml fel fel 0 s (150,0 s)");
  });
});

describe("jobbet är schemalagt", () => {
  it("varannan timme, och rutten finns", () => {
    const vercel = JSON.parse(readFileSync(join(import.meta.dirname, "..", "vercel.json"), "utf8")) as { crons: { path: string; schedule: string }[] };
    assert.deepEqual(vercel.crons.filter((c) => c.path === "/api/cron/farska-floden"), [{ path: "/api/cron/farska-floden", schedule: "37 */2 * * *" }]);
    const rutt = readFileSync(join(import.meta.dirname, "..", "app", "api", "cron", "farska-floden", "route.ts"), "utf8");
    assert.match(rutt, /hamtaFloden\(SITE\)/);
    assert.match(rutt, /export const maxDuration = 300;/);
  });
});
