// Medlemsrutan direkt (lib/medlem/tidig.ts): skriptet i produktsidans HTML,
// variant-id:n till servern och platsen som hålls medan svaret är på väg.
// Skriptet körs här i en sandlåda med en låtsad document/localStorage/fetch.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  TOM_VARIANT,
  VANTAN_MAX_MS,
  VARIANT_MAX,
  VY_NYCKEL,
  giltigVy,
  hallPlats,
  ledtradUrFraga,
  medlemsprisAdress,
  medlemsprisSkript,
  sidansVarianter,
} from "./tidig.ts";

const PID = "9aaeed8f-0d1a-41ad-9641-14fc6bd7afab";
const V1 = "1f2e3d4c-0000-4000-8000-000000000001";
const V2 = "1f2e3d4c-0000-4000-8000-000000000002";

type Sandlada = {
  hamtade: { url: string; init: unknown }[];
  attr: Map<string, string>;
  stil: Map<string, string>;
  timers: { ms: number; fn: () => void }[];
  win: Record<string, unknown>;
};

function kor(skript: string, { kaka = "", lagrat = null as string | null, lagringKastar = false } = {}): Sandlada {
  const hamtade: Sandlada["hamtade"] = [];
  const attr = new Map<string, string>();
  const stil = new Map<string, string>();
  const timers: Sandlada["timers"] = [];
  const win: Record<string, unknown> = {};
  const documentElement = {
    setAttribute: (k: string, v: string) => attr.set(k, String(v)),
    getAttribute: (k: string) => (attr.has(k) ? attr.get(k)! : null),
    removeAttribute: (k: string) => attr.delete(k),
    style: { setProperty: (k: string, v: string) => stil.set(k, v) },
  };
  const ctx = {
    window: win,
    document: { cookie: kaka, documentElement },
    localStorage: {
      getItem: (k: string) => {
        if (lagringKastar) throw new Error("SecurityError");
        return k === VY_NYCKEL ? lagrat : null;
      },
    },
    fetch: (url: string, init: unknown) => {
      hamtade.push({ url, init });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ medlemspris: true }) });
    },
    setTimeout: (fn: () => void, ms: number) => timers.push({ fn, ms }),
    Date,
    JSON,
  };
  vm.runInNewContext(skript, ctx);
  return { hamtade, attr, stil, timers, win };
}

const vy = (o: Record<string, unknown>) => JSON.stringify(o);

test("variant-id ur frågan: giltiga, unika, högst VARIANT_MAX", () => {
  assert.deepEqual(ledtradUrFraga(null), []);
  assert.deepEqual(ledtradUrFraga(""), []);
  assert.deepEqual(ledtradUrFraga(`${V1},${V2},${V1}`), [V1, V2]);
  assert.deepEqual(ledtradUrFraga(`${V1},../etc,a b,${"x".repeat(65)},${V2}`), [V1, V2]);
  const manga = Array.from({ length: 150 }, (_, i) => `v${i}`).join(",");
  assert.equal(ledtradUrFraga(manga).length, VARIANT_MAX);
});

test("sidans variant-id: en produkt utan val får Wix tomma id", () => {
  assert.deepEqual(sidansVarianter([]), [TOM_VARIANT]);
  assert.deepEqual(sidansVarianter([null, undefined, "a b"]), [TOM_VARIANT]);
  assert.deepEqual(sidansVarianter([V1, V1, V2]), [V1, V2]);
});

test("adressen är densamma för skriptet, kortet och rutan", () => {
  assert.equal(medlemsprisAdress(PID), `/api/medlem/priser?p=${PID}`);
  assert.equal(medlemsprisAdress(PID, [V1, V2]), `/api/medlem/priser?p=${PID}&v=${V1},${V2}`);
  assert.equal(medlemsprisAdress(PID, ["a b", V1]), `/api/medlem/priser?p=${PID}&v=${V1}`);
});

test("utan tecknet gör skriptet ingenting: inget anrop och ingen plats", () => {
  const s = medlemsprisSkript(PID, [V1], false);
  for (const kaka of ["", "fp_cookie=1", "fp_medlem_inne=0", "x_fp_medlem_inne=1", "fp_medlem_inne=1x"]) {
    const r = kor(s, { kaka, lagrat: vy({ t: "1", h: 70, r: 70, n: "guld" }) });
    assert.equal(r.hamtade.length, 0, kaka);
    assert.equal(r.attr.size, 0, kaka);
  }
});

test("med tecknet startar skriptet EN hämtning och lämnar löftet till rutan", () => {
  for (const t of ["1", "f"]) {
    const r = kor(medlemsprisSkript(PID, [V1, V2], false), { kaka: `a=b; fp_medlem_inne=${t}; c=d` });
    assert.equal(r.hamtade.length, 1);
    assert.equal(r.hamtade[0].url, medlemsprisAdress(PID, [V1, V2]));
    // Objektet kommer från sandlådans egen värld: jämför innehållet.
    assert.equal(JSON.stringify(r.hamtade[0].init), JSON.stringify({ credentials: "same-origin" }));
    const e = (r.win.__fpMp as Record<string, { t: string; at: number; p: unknown }>)[PID];
    assert.equal(e.t, t);
    assert.ok(e.p instanceof Promise || typeof (e.p as Promise<unknown>).then === "function");
    // Ingen förra ruta: ingen plats hålls.
    assert.equal(r.attr.has("data-mp"), false);
  }
});

test("platsen hålls med förra rutans höjd och metall, och släpps efter VANTAN_MAX_MS", () => {
  const r = kor(medlemsprisSkript(PID, [V1], false), { kaka: "fp_medlem_inne=f", lagrat: vy({ t: "f", h: 148, r: 66, n: "platina" }) });
  assert.equal(r.attr.get("data-mp"), PID);
  assert.equal(r.attr.get("data-mp-niva"), "platina");
  assert.equal(r.stil.get("--mp-h"), "148px");
  assert.equal(r.stil.get("--mp-r"), "66px");
  assert.equal(r.timers.length, 1);
  assert.equal(r.timers[0].ms, VANTAN_MAX_MS);
  r.timers[0].fn();
  assert.equal(r.attr.has("data-mp"), false);
});

test("timern släpper bara sin egen plats, inte nästa sidas", () => {
  const r = kor(medlemsprisSkript(PID, [V1], false), { kaka: "fp_medlem_inne=1", lagrat: vy({ t: "1", h: 70, r: 70 }) });
  r.attr.set("data-mp", "en-annan-produkt");
  r.timers[0].fn();
  assert.equal(r.attr.get("data-mp"), "en-annan-produkt");
});

test("ingen plats: annat tecken, reavara, Brons (höjd 0) eller trasig lagring", () => {
  const fall: [string, Parameters<typeof kor>[1], boolean][] = [
    ["annat tecken", { kaka: "fp_medlem_inne=1", lagrat: vy({ t: "f", h: 148, r: 66 }) }, false],
    ["reavara", { kaka: "fp_medlem_inne=1", lagrat: vy({ t: "1", h: 70, r: 70 }) }, true],
    ["Brons", { kaka: "fp_medlem_inne=1", lagrat: vy({ t: "1", h: 0, r: 0 }) }, false],
    ["för hög", { kaka: "fp_medlem_inne=1", lagrat: vy({ t: "1", h: 9000, r: 70 }) }, false],
    ["inte heltal", { kaka: "fp_medlem_inne=1", lagrat: vy({ t: "1", h: 70.5, r: 70 }) }, false],
    ["text som höjd", { kaka: "fp_medlem_inne=1", lagrat: vy({ t: "1", h: "70px;color:red", r: 70 }) }, false],
    ["konstig nivå", { kaka: "fp_medlem_inne=1", lagrat: vy({ t: "1", h: 70, r: 70, n: "guld\"]{}" }) }, false],
    ["inte JSON", { kaka: "fp_medlem_inne=1", lagrat: "{" }, false],
    ["lagringen kastar", { kaka: "fp_medlem_inne=1", lagringKastar: true }, false],
  ];
  for (const [namn, opt, rea] of fall) {
    const r = kor(medlemsprisSkript(PID, [V1], rea), opt);
    assert.equal(r.attr.has("data-mp"), false, namn);
    assert.equal(r.stil.size, 0, namn);
    // Hämtningen startar ändå: platsen är bara en tidpunkt.
    assert.equal(r.hamtade.length, 1, namn);
  }
});

test("skriptet och sidans egen regel (hallPlats) håller platsen i exakt samma fall", () => {
  const kandidater: unknown[] = [];
  for (const t of ["1", "f", "x", undefined])
    for (const h of [0, 1, 70, 600, 601, -1, 70.5, "70"])
      for (const r of [0, 66, 601, "66"])
        for (const n of [undefined, "guld", "vip", "Guld", "g-uld", 3])
          kandidater.push({ t, h, r, ...(n === undefined ? {} : { n }) });
  let lika = 0;
  for (const k of kandidater) {
    for (const tecken of ["1", "f"]) {
      const r = kor(medlemsprisSkript(PID, [], false), { kaka: `fp_medlem_inne=${tecken}`, lagrat: JSON.stringify(k) });
      assert.equal(r.attr.has("data-mp"), hallPlats(k, tecken), JSON.stringify({ k, tecken }));
      lika++;
    }
  }
  assert.ok(lika > 1000);
  assert.equal(giltigVy({ t: "1", h: 70, r: 70, n: "guld" }), true);
  assert.equal(giltigVy({ t: "1", h: 70 }), false);
});

test("skriptet kan inte avslutas inifrån och vägrar ett id i fel form", () => {
  assert.equal(medlemsprisSkript("</script><script>alert(1)</script>", [], false), "");
  assert.equal(medlemsprisSkript("a b", [], false), "");
  const s = medlemsprisSkript(PID, ["</script>", V1], false);
  assert.ok(!/<\/script/i.test(s));
  assert.ok(!s.includes("</script>"));
  // Syntaxen håller: skriptet går att tolka.
  assert.doesNotThrow(() => new vm.Script(s));
});

// ── Servern: läsningarna går samtidigt ─────────────────────────────────────
// Rutten och profilen läser Wix; de laddas inte här. Proven läser koden och
// fäller om ordningen blir seriell igen (Leonard 2026-11-13).

const rutt = readFileSync(new URL("../../app/api/medlem/priser/route.ts", import.meta.url), "utf8");
const medlemspris = readFileSync(new URL("./medlemspris.ts", import.meta.url), "utf8");

test("rutten startar produkten, golvet och historiken innan profilen är läst, och bara med en session", () => {
  const forhand = rutt.indexOf("forhamtaProdukt(produktId");
  const profil = rutt.indexOf("await medlemsprofil()");
  assert.ok(forhand > 0 && profil > forhand, "förhämtningen ska starta före profilen");
  assert.match(rutt, /const forhand = session \? forhamtaProdukt\(/);
  assert.match(rutt, /medlemsprisForProdukt\(produktId, mp\.profil, forhand\)/);
  assert.match(rutt, /ledtradUrFraga\(fraga\.get\("v"\)\)/);
});

test("profilen läser växeln, medlemmen, reglerna, liggaren och företaget i ETT Promise.all", () => {
  const start = medlemspris.indexOf("export async function medlemsprofil(");
  const slut = medlemspris.indexOf("\n}\n", start);
  const kropp = medlemspris.slice(start, slut);
  const alla = kropp.match(/await Promise\.all\(\[([\s\S]*?)\]\)/);
  assert.ok(alla, "Promise.all saknas");
  for (const del of ["lageP", "hamtaMedlem(session.sub)", "aktuellaRegler()", "liggarraderForEpost(session.email)", "hamtaForetagsprofil(session.sub)"]) {
    assert.ok(alla![1].includes(del), `${del} ska läsas samtidigt med de andra`);
  }
  // Växeln går före allt, och en spärrad medlem får inget pris.
  assert.ok(kropp.indexOf('if (lage === "av") return { utan: "av" }') < kropp.indexOf('return { utan: "sparrad" }'));
  // Ingen läsning före Promise.all väntar på en annan.
  const fore = kropp.slice(0, kropp.indexOf("await Promise.all"));
  assert.equal((fore.match(/await hamta|await aktuella|await liggar/g) ?? []).length, 0);
});

test("golvet för sidans variant-id frågas medan produkten läses; det som saknas frågas efteråt", () => {
  const f = medlemspris.slice(medlemspris.indexOf("export function forhamtaProdukt("));
  assert.match(f, /produkt: lasProdukt\(produktId\)/);
  assert.match(f, /golv: ledtrad\.length \? hamtaGolv\(/);
  assert.match(medlemspris, /const saknas = varianter\.filter\(\(v\) => !golv\.has\(golvnyckel\(produktId, v\.variantId\)\)\)/);
});
