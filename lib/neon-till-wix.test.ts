// Run: node --test --experimental-strip-types lib/neon-till-wix.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  forsegla,
  godkand,
  hashatId,
  kortFel,
  oppna,
  redigerad,
  skiljandeFalt,
  synka,
  type Kalla,
  type KallRad,
  type WixPost,
  type WixSida,
} from "./neon-till-wix.ts";

// En Neon-tabell i minnet, läst med markör som rutten gör det.
function neon(namn: string, rader: KallRad[]): Kalla {
  const sorterade = [...rader].sort((a, b) => (a.id < b.id ? -1 : 1));
  return {
    namn,
    kollektion: `K_${namn}`,
    async lasNeon(efter, antal) {
      const fran = efter === null ? 0 : sorterade.findIndex((r) => r.id > JSON.parse(efter)[0]);
      const ut = fran < 0 ? [] : sorterade.slice(fran, fran + antal);
      return { rader: ut, nasta: ut.length ? JSON.stringify([ut[ut.length - 1].id]) : null };
    },
    async raknaNeon() {
      return sorterade.length;
    },
    async allaIdn() {
      return new Set(sorterade.map((r) => r.id));
    },
  };
}

function wixMinne(start: Record<string, WixPost[]> = {}, klocka = () => "2026-10-29T10:00:00.000Z") {
  const data = new Map<string, Map<string, WixPost>>();
  for (const [k, rader] of Object.entries(start)) data.set(k, new Map(rader.map((r) => [r._id, r])));
  const kol = (k: string) => data.get(k) ?? data.set(k, new Map()).get(k)!;
  const sida: WixSida = {
    async hamtaIdn(k, idn) {
      return idn.map((id) => kol(k).get(id)).filter((r): r is WixPost => Boolean(r));
    },
    async sidaEfter(k, efter, antal) {
      return [...kol(k).values()].sort((a, b) => (a._id < b._id ? -1 : 1)).filter((r) => efter === null || r._id > efter).slice(0, antal);
    },
    async rakna(k) {
      return kol(k).size;
    },
    async spara(k, rader) {
      for (const r of rader) {
        const fore = kol(k).get(r.id);
        kol(k).set(r.id, { ...r.data, _id: r.id, _createdDate: fore?._createdDate ?? klocka(), _updatedDate: klocka() });
      }
      return { sparade: rader.length, fel: [] };
    },
    async taBort(k, idn) {
      for (const id of idn) kol(k).delete(id);
      return { borttagna: idn.length, fel: [] };
    },
  };
  return { sida, kol };
}

test("kopiera skriver det som saknas och det som skiljer, och raderar aldrig", async () => {
  const w = wixMinne({ K_t: [{ _id: "b", v: 1 }, { _id: "c", v: 9 }, { _id: "x", v: 0 }] });
  const s = await synka([neon("t", [{ id: "a", data: { v: 1 } }, { id: "b", data: { v: 1 } }, { id: "c", data: { v: 2 } }])], w.sida, {
    lage: "kopiera",
    dryRun: false,
  });
  const t = s.tabeller[0];
  assert.deepEqual([t.granskade, t.lika, t.saknas, t.olika, t.skrivna], [3, 1, 1, 1, 2]);
  assert.equal(w.kol("K_t").get("c")?.v, 2);
  assert.equal(w.kol("K_t").has("x"), true);
});

test("kopiera är torr som default, och verifiera skriver aldrig", async () => {
  const w = wixMinne({ K_t: [{ _id: "x", v: 0 }] });
  const torr = await synka([neon("t", [{ id: "a", data: { v: 1 } }])], w.sida, { lage: "kopiera" });
  assert.equal(torr.dryRun, true);
  assert.equal(w.kol("K_t").has("a"), false);
  const ver = await synka([neon("t", [{ id: "a", data: { v: 1 } }])], w.sida, { lage: "verifiera", dryRun: false });
  assert.equal(ver.dryRun, true);
  assert.deepEqual([ver.tabeller[0].saknas, ver.tabeller[0].extra], [1, 1]);
  assert.equal(godkand(ver), false);
});

test("markören bär hela tabeller över flera varv", async () => {
  const rader = Array.from({ length: 1200 }, (_, i) => ({ id: `r${String(i).padStart(4, "0")}`, data: { i } }));
  const w = wixMinne();
  let t = 0;
  const forsta = await synka([neon("t", rader)], w.sida, { lage: "kopiera", dryRun: false, tidsbudgetMs: 1, now: () => (t += 1) });
  assert.equal(forsta.stoppadAv, "tidsbudget");
  const andra = await synka([neon("t", rader)], w.sida, { lage: "kopiera", dryRun: false, efter: forsta.markor });
  assert.equal(andra.stoppadAv, "klart");
  assert.equal(w.kol("K_t").size, 1200);
});

test("☠️ delta: en rad drift rört efter växlingen vinner, och en borttagen väcks inte", async () => {
  const KOPIERAD = "2026-10-29T09:00:00.000Z";
  const VAXLING = "2026-10-29T09:30:00.000Z";
  const w = wixMinne({ K_t: [{ _id: "a", v: "wix", _createdDate: "2026-10-29T09:10:00.000Z", _updatedDate: "2026-10-29T09:45:00.000Z" }] });
  const s = await synka(
    [
      neon("t", [
        { id: "a", data: { v: "neon" }, andrad: Date.parse("2026-10-29T09:20:00Z") },
        { id: "borta", data: { v: 1 }, andrad: Date.parse("2026-10-28T12:00:00Z") },
      ]),
    ],
    w.sida,
    { lage: "delta", dryRun: false, vaxling: VAXLING, kopieradSedan: KOPIERAD },
  );
  assert.equal(w.kol("K_t").get("a")?.v, "wix");
  assert.equal(w.kol("K_t").has("borta"), false);
  assert.deepEqual([s.tabeller[0].wixNyare, s.tabeller[0].borttagenIWix], [1, 1]);
});

test("jämförelsen bryr sig inte om systemfält, null eller nyckelordning", () => {
  assert.deepEqual(skiljandeFalt({ a: 1, b: { x: 1, y: 2 }, c: null }, { _id: "z", _updatedDate: "t", b: { y: 2, x: 1 }, a: 1 }), []);
  assert.deepEqual(skiljandeFalt({ v: [1, 2] }, { v: [2, 1] }), ["v"]);
});

test("☠️ svaret bär aldrig ett id eller ett felinnehåll i klartext", async () => {
  const w = wixMinne();
  const s = await synka([neon("t", [{ id: "kund@exempel.se", data: { v: 1 } }])], w.sida, { lage: "verifiera" });
  s.tabeller[0].fel.push("Wix Data bulk-save K_t (400 WDE0009): Document kund@exempel.se is too large");
  const ut = JSON.stringify(redigerad(s));
  assert.equal(ut.includes("kund@exempel.se"), false);
  assert.ok(ut.includes(hashatId("kund@exempel.se")));
  assert.equal(kortFel("Wix Data bulk-save K_t (400 WDE0009): Document kund@exempel.se"), "400 WDE0009");
});

test("☠️ markören förseglas och öppnas bara med samma hemlighet", () => {
  const m = { tabell: "newsletter_subscribers", fas: "fram" as const, efter: '["kund@exempel.se"]' };
  const f = forsegla(m, "hemlig")!;
  assert.equal(f.includes("kund"), false);
  assert.deepEqual(oppna(f, "hemlig"), m);
  assert.throws(() => oppna(f, "annan"));
  assert.throws(() => oppna('{"tabell":"x"}', "hemlig"));
  assert.equal(oppna("", "hemlig"), null);
});
