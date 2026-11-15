import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  LAGER_BIT_BYTE,
  LAGER_MAX_ALDER_S,
  LAGER_TTL_S,
  LAGRADE_FLODEN,
  type Lager,
  alderText,
  anvandbar,
  arLagratFlode,
  delaIBitar,
  lasHuvud,
  lasKopia,
  sattIhop,
  sparaKopia,
} from "./flodeslager.ts";
import { KOMPRIMERADE_FLODEN } from "./prisjakt-svar.ts";

/**
 * Ett lager som beter sig som Runtime Cache: värdet går genom JSON, en post
 * får vara högst 2 MB, och `set` sväljer sina fel. `tappa` låter en skrivning
 * försvinna tyst, som när paketet ger upp efter 500 ms.
 */
function provlager(opts: { tappa?: (nyckel: string) => boolean; kasta?: boolean } = {}) {
  const poster = new Map<string, string>();
  const skrivna: { nyckel: string; byte: number; ttl?: number }[] = [];
  const lager: Lager = {
    async get(nyckel) {
      if (opts.kasta) throw new Error("lagret svarar inte");
      const v = poster.get(nyckel);
      return v === undefined ? null : JSON.parse(v);
    },
    async set(nyckel, varde, o) {
      if (opts.kasta) throw new Error("lagret svarar inte");
      const json = JSON.stringify(varde);
      skrivna.push({ nyckel, byte: Buffer.byteLength(json), ttl: o?.ttl });
      if (Buffer.byteLength(json) > 2 * 1024 * 1024) return; // för stor: Vercel tar inte emot den
      if (opts.tappa?.(nyckel)) return;
      poster.set(nyckel, json);
    },
  };
  return { lager, poster, skrivna };
}

const tyst = async <T>(f: () => Promise<T>): Promise<{ svar: T; varningar: string[] }> => {
  const varningar: string[] = [];
  const w = console.warn;
  console.warn = (...a: unknown[]) => void varningar.push(a.join(" "));
  try {
    return { svar: await f(), varningar };
  } finally {
    console.warn = w;
  }
};

// Som Pinterest-flödet: knappt 2,9 MB som går att komprimera dåligt.
const gz = randomBytes(2_879_046);
const meta = { byggd: Date.parse("2026-11-15T08:37:00Z"), xmlByte: 19_600_000 };

describe("bitarna", () => {
  it("delas och sätts ihop till exakt samma byte, för alla längder runt en bitgräns", () => {
    for (const n of [0, 1, LAGER_BIT_BYTE - 1, LAGER_BIT_BYTE, LAGER_BIT_BYTE + 1, 3 * LAGER_BIT_BYTE + 17]) {
      const b = randomBytes(n);
      const delar = delaIBitar(b);
      assert.equal(delar.length, Math.ceil(n / LAGER_BIT_BYTE));
      assert.deepEqual(sattIhop(delar), b);
    }
  });

  it("☠️ varje post ryms i Runtime Cache: högst 2 MB som JSON", () => {
    const delar = delaIBitar(gz);
    assert.equal(delar.length, 6);
    for (const d of delar) assert.ok(Buffer.byteLength(JSON.stringify(d)) < 2 * 1024 * 1024);
  });

  it("en bit som saknas eller inte är en sträng ger ingenting", () => {
    assert.equal(sattIhop(["QUJD", null]), null);
    assert.equal(sattIhop(["QUJD", 5]), null);
  });

  it("en bit ur en Buffer med förskjutning läses från rätt ställe", () => {
    const stor = randomBytes(100);
    const del = stor.subarray(10, 60);
    assert.deepEqual(sattIhop(delaIBitar(del, 16)), Buffer.from(del));
  });
});

describe("sparaKopia och lasKopia", () => {
  it("det som sparas läses tillbaka, byte för byte, med tiden och storleken", async () => {
    const { lager } = provlager();
    assert.equal(await sparaKopia("pinterest.xml", gz, meta, { lager, deploy: "dpl_a" }), true);
    const kopia = await lasKopia("pinterest.xml", { lager, deploy: "dpl_a" });
    assert.ok(kopia);
    assert.deepEqual(kopia.gz, gz);
    assert.equal(kopia.byggd, meta.byggd);
    assert.equal(kopia.xmlByte, meta.xmlByte);
    assert.deepEqual(await lasHuvud("pinterest.xml", { lager, deploy: "dpl_a" }), { byggd: meta.byggd, gzByte: gz.byteLength, xmlByte: meta.xmlByte });
  });

  it("varje post lever längre än gränsen för att användas, men inte ett dygn", async () => {
    const { lager, skrivna } = provlager();
    await sparaKopia("pinterest.xml", gz, meta, { lager, deploy: "dpl_a" });
    assert.equal(skrivna.length, 7, "sex bitar och en pekare, inget skrivet två gånger");
    for (const s of skrivna) assert.equal(s.ttl, LAGER_TTL_S);
    assert.ok(LAGER_TTL_S > LAGER_MAX_ALDER_S && LAGER_TTL_S < 24 * 3600);
  });

  it("en skrivning som gav upp en gång görs om, och kopian sparas", async () => {
    let n = 0;
    const { lager, skrivna } = provlager({ tappa: (nyckel) => nyckel.endsWith(":3") && ++n === 1 });
    assert.equal(await sparaKopia("pinterest.xml", gz, meta, { lager, deploy: "d" }), true);
    assert.equal(skrivna.length, 8, "bara den tappade biten skrevs om");
    assert.deepEqual((await lasKopia("pinterest.xml", { lager, deploy: "d" }))?.gz, gz);
  });

  it("ingen kopia: null, utan varning", async () => {
    const { lager } = provlager();
    const { svar, varningar } = await tyst(() => lasKopia("pinterest.xml", { lager, deploy: "dpl_a" }));
    assert.equal(svar, null);
    assert.deepEqual(varningar, []);
  });

  it("☠️ en ny deploy läser aldrig en kopia som äldre kod byggde", async () => {
    const { lager } = provlager();
    await sparaKopia("pinterest.xml", gz, meta, { lager, deploy: "dpl_gammal" });
    assert.equal(await lasKopia("pinterest.xml", { lager, deploy: "dpl_ny" }), null);
    assert.equal(await lasHuvud("pinterest.xml", { lager, deploy: "dpl_ny" }), null);
  });

  it("flödena har var sin kopia", async () => {
    const { lager } = provlager();
    const annan = randomBytes(1000);
    await sparaKopia("pinterest.xml", gz, meta, { lager, deploy: "d" });
    await sparaKopia("google.xml", annan, meta, { lager, deploy: "d" });
    assert.deepEqual((await lasKopia("pinterest.xml", { lager, deploy: "d" }))?.gz, gz);
    assert.deepEqual((await lasKopia("google.xml", { lager, deploy: "d" }))?.gz, annan);
  });

  it("☠️ en bit som tyst inte går att spara: falskt, och den förra kopian gäller", async () => {
    let tappa = false;
    const { lager } = provlager({ tappa: (nyckel) => tappa && nyckel.endsWith(":3") });
    const forra = randomBytes(1_000_000);
    assert.equal(await sparaKopia("pinterest.xml", forra, meta, { lager, deploy: "d" }), true);
    tappa = true;
    assert.equal(await sparaKopia("pinterest.xml", gz, { ...meta, byggd: meta.byggd + 7_200_000 }, { lager, deploy: "d" }), false);
    const kopia = await lasKopia("pinterest.xml", { lager, deploy: "d" });
    assert.deepEqual(kopia?.gz, forra);
    assert.equal(kopia?.byggd, meta.byggd);
  });

  it("☠️ en pekare som tyst inte sparades: falskt", async () => {
    const { lager } = provlager({ tappa: (nyckel) => !/:[0-9a-f-]{36}:\d+$/.test(nyckel) });
    assert.equal(await sparaKopia("pinterest.xml", gz, meta, { lager, deploy: "d" }), false);
    assert.equal(await lasKopia("pinterest.xml", { lager, deploy: "d" }), null);
  });

  it("☠️ en bit som saknas eller ändrats efteråt ger null och en varning, aldrig en trasig fil", async () => {
    for (const skada of ["ta bort", "andra"] as const) {
      const { lager, poster } = provlager();
      await sparaKopia("pinterest.xml", gz, meta, { lager, deploy: "d" });
      const bit = [...poster.keys()].find((k) => k.endsWith(":2"))!;
      if (skada === "ta bort") poster.delete(bit);
      else poster.set(bit, JSON.stringify(randomBytes(LAGER_BIT_BYTE).toString("base64")));
      const { svar, varningar } = await tyst(() => lasKopia("pinterest.xml", { lager, deploy: "d" }));
      assert.equal(svar, null, skada);
      assert.equal(varningar.length, 1);
      assert.match(varningar[0], /ofullständig/);
    }
  });

  it("en pekare av fel form räknas inte", async () => {
    const { lager, poster } = provlager();
    await sparaKopia("pinterest.xml", gz, meta, { lager, deploy: "d" });
    const pekare = [...poster.keys()].find((k) => k.endsWith(":pinterest.xml"))!;
    const ratt = JSON.parse(poster.get(pekare)!);
    for (const fel of [{ v: 2 }, { delar: 5 }, { sha256: "abc" }, { gen: "" }, { byggd: "i går" }, { gzByte: -1 }]) {
      poster.set(pekare, JSON.stringify({ ...ratt, ...fel }));
      assert.equal(await tyst(() => lasKopia("pinterest.xml", { lager, deploy: "d" })).then((t) => t.svar), null, JSON.stringify(fel));
      assert.equal(await lasHuvud("pinterest.xml", { lager, deploy: "d" }), null);
    }
  });

  it("ett lager som inte svarar: null och falskt, aldrig ett fel som fäller flödet", async () => {
    const { lager } = provlager({ kasta: true });
    const { svar: last, varningar } = await tyst(() => lasKopia("pinterest.xml", { lager, deploy: "d" }));
    assert.equal(last, null);
    assert.equal(varningar.length, 1);
    assert.equal((await tyst(() => lasHuvud("pinterest.xml", { lager, deploy: "d" }))).svar, null);
    assert.equal((await tyst(() => sparaKopia("pinterest.xml", gz, meta, { lager, deploy: "d" }))).svar, false);
  });

  it("den senaste sparningen vinner", async () => {
    const { lager } = provlager();
    const ny = randomBytes(700_000);
    await sparaKopia("pinterest.xml", gz, meta, { lager, deploy: "d" });
    await sparaKopia("pinterest.xml", ny, { ...meta, byggd: meta.byggd + 1000 }, { lager, deploy: "d" });
    assert.deepEqual((await lasKopia("pinterest.xml", { lager, deploy: "d" }))?.gz, ny);
  });
});

describe("åldern", () => {
  const nu = Date.parse("2026-11-15T10:00:00Z");
  it("en kopia används tills den är tre timmar gammal, räknat från när bygget började", () => {
    assert.equal(LAGER_MAX_ALDER_S, 3 * 3600);
    assert.equal(anvandbar(nu - 2 * 3600_000, nu), true);
    assert.equal(anvandbar(nu - 3 * 3600_000 + 1000, nu), true);
    assert.equal(anvandbar(nu - 3 * 3600_000, nu), false);
    assert.equal(anvandbar(nu - 26 * 3600_000, nu), false);
  });

  it("åldern i loggen", () => {
    assert.equal(alderText(nu - 14 * 60_000, nu), "14 min");
    assert.equal(alderText(nu - 72 * 60_000, nu), "1,2 h");
    assert.equal(alderText(nu + 5000, nu), "0 min");
  });
});

describe("listorna", () => {
  it("bara komprimerade flöden sparas, och Pinterest är ett av dem", () => {
    for (const fil of LAGRADE_FLODEN) assert.ok((KOMPRIMERADE_FLODEN as readonly string[]).includes(fil), fil);
    assert.ok(arLagratFlode("pinterest.xml"));
    assert.ok(!arLagratFlode("prisjakt.xml"));
    assert.ok(!arLagratFlode("google.xml"));
  });

  it("jobbet bygger och sparar varje lagrat flöde, och gz-rutten och /feed/pinterest.xml läser kopian", () => {
    const rot = join(import.meta.dirname, "..", "..");
    const jobb = readFileSync(join(rot, "app", "api", "cron", "farska-floden", "route.ts"), "utf8");
    assert.match(jobb, /for \(const fil of LAGRADE_FLODEN\) kopior\.push\(await byggOchSpara\(fil\)\);/);
    assert.match(jobb, /await sparaKopia\(fil, gz, \{ byggd, xmlByte: Buffer\.byteLength\(xml\) \}\)/);
    assert.match(jobb, /if \(arTomtFlode\(xml\)\) return/, "ett tomt flöde sparas aldrig");
    const gzRutt = readFileSync(join(rot, "app", "feed", "gz", "[fil]", "route.ts"), "utf8");
    assert.match(gzRutt, /if \(kopia && anvandbar\(kopia\.byggd\)\)/);
    const pinterest = readFileSync(join(rot, "app", "feed", "pinterest.xml", "route.ts"), "utf8");
    assert.match(pinterest, /if \(request\) \{\n    const kopia = await lasKopia\(FIL\);/, "bara en läsare utifrån får kopian: utan anrop byggs flödet");
  });
});
