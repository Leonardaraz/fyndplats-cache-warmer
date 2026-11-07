// lib/sidhuvud-val.test.ts — sidhuvudets vägval och den färdiga menyn
// (lib/sidhuvud-val.ts, kopplingen i lib/sidhuvud-data.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  MENY_MAX_ALDER_MS, MENY_VERSION, arMenytrad, harRea, medTidsgrans, menyRadId, radForMeny, tolkaSparadMeny,
  valjSidhuvud, varforInteSpara, type MenyNod, type SidhuvudKallor,
} from "./sidhuvud-val.ts";

const nod = (slug: string, subs: string[] = []): MenyNod => ({
  id: `id-${slug}`,
  name: `Namn ${slug}`,
  slug,
  count: 0,
  subs: subs.map((s) => ({ id: `id-${s}`, name: `Namn ${s}`, slug: s, count: 0 })),
});
const TRAD = [nod("mobler", ["soffor", "matbord"]), nod("tradgard", ["grillar"]), nod("hem-inredning"), nod("barn", ["lek-och-spel"])];
const LEVANDE = { tree: TRAD, hasSale: true };
const SPARAD = { tree: [nod("fran-wix"), nod("b"), nod("c")], hasSale: false };

function kallor(o: { laddad: boolean; sparad: "finns" | "saknas" | "faller" | "hanger" }) {
  const anrop: string[] = [];
  const k: SidhuvudKallor<MenyNod> = {
    laddad: () => o.laddad,
    levande: async () => {
      anrop.push("levande");
      return LEVANDE;
    },
    sparad: async () => {
      anrop.push("sparad");
      if (o.sparad === "saknas") return null;
      if (o.sparad === "faller") throw new Error("Wix svarar inte");
      if (o.sparad === "hanger") return new Promise<null>(() => {});
      return SPARAD;
    },
    tidsgransMs: 30,
  };
  return { k, anrop };
}

test("varm instans: bygger ur katalogen och läser inte den färdiga menyn", async () => {
  const { k, anrop } = kallor({ laddad: true, sparad: "finns" });
  assert.deepEqual(await valjSidhuvud(k), { data: LEVANDE, kalla: "levande" });
  assert.deepEqual(anrop, ["levande"]);
});

test("kall instans: läser den färdiga menyn och väntar inte in katalogen", async () => {
  const { k, anrop } = kallor({ laddad: false, sparad: "finns" });
  assert.deepEqual(await valjSidhuvud(k), { data: SPARAD, kalla: "sparad" });
  assert.deepEqual(anrop, ["sparad"]);
});

for (const fall of ["saknas", "faller", "hanger"] as const) {
  test(`kall instans där den färdiga menyn ${fall}: bygger ur katalogen som förut`, async () => {
    const { k, anrop } = kallor({ laddad: false, sparad: fall });
    assert.deepEqual(await valjSidhuvud(k), { data: LEVANDE, kalla: "reserv" });
    assert.deepEqual(anrop, ["sparad", "levande"]);
  });
}

test("medTidsgrans: svaret om det hinner, annars null, och timern städas", async () => {
  // En kvarlämnad timer på fem sekunder hade hållit kvar provet så länge.
  assert.equal(await medTidsgrans(Promise.resolve("ja"), 5_000), "ja");
  assert.equal(await medTidsgrans(new Promise<string>((r) => setTimeout(() => r("sent"), 80)), 20), null);
  assert.equal(await medTidsgrans(Promise.reject(new Error("nej")), 50), null);
});

test("REA-knappen kräver en nedsatt vara i lager", () => {
  assert.equal(harRea([]), false);
  assert.equal(harRea([{ onSale: true, inStock: false }, { onSale: false, inStock: true }]), false);
  assert.equal(harRea([{ onSale: false, inStock: true }, { onSale: true, inStock: true }]), true);
});

test("raden tolkas tillbaka till exakt samma meny", () => {
  const nu = Date.parse("2026-11-07T18:00:00Z");
  const rad = radForMeny(LEVANDE, nu);
  assert.equal(rad.v, MENY_VERSION);
  assert.equal(rad.grupper, 4);
  assert.equal(rad.underkategorier, 4);
  assert.equal(rad.skapad, "2026-11-07T18:00:00.000Z");
  assert.ok(rad.byte >= rad.menyJson.length, "byte räknas i UTF-8");
  // Genom Wix: raden sparas som JSON och kommer tillbaka som JSON.
  const viaWix = JSON.parse(JSON.stringify(rad)) as Record<string, unknown>;
  assert.deepEqual(tolkaSparadMeny(viaWix, nu + 60_000), LEVANDE);
  assert.deepEqual(tolkaSparadMeny({ ...viaWix, hasSale: false }, nu)?.hasSale, false, "false är ett svar, inte ett saknat fält");
});

test("en rad som inte duger ger ingen meny", () => {
  const nu = Date.parse("2026-11-07T18:00:00Z");
  const rad = radForMeny(LEVANDE, nu) as unknown as Record<string, unknown>;
  const fall: [string, Record<string, unknown> | null][] = [
    ["saknas", null],
    ["annan version", { ...rad, v: MENY_VERSION + 1 }],
    ["utan REA-flagga", { ...rad, hasSale: undefined }],
    ["REA som text", { ...rad, hasSale: "true" }],
    ["trasig JSON", { ...rad, menyJson: "[{" }],
    ["tomt träd", { ...rad, menyJson: "[]" }],
    ["nod utan adress", { ...rad, menyJson: JSON.stringify([{ ...TRAD[0], slug: "" }]) }],
    ["underkategori utan namn", { ...rad, menyJson: JSON.stringify([{ ...TRAD[0], subs: [{ id: "x", slug: "x", count: 0 }] }]) }],
    ["utan tid", { ...rad, skapad: undefined }],
    ["tid som inte går att läsa", { ...rad, skapad: "igår" }],
  ];
  for (const [namn, r] of fall) assert.equal(tolkaSparadMeny(r, nu), null, namn);
});

test("en för gammal meny används inte, en på gränsen används", () => {
  const skapad = Date.parse("2026-11-07T12:00:00Z");
  const rad = radForMeny(LEVANDE, skapad) as unknown as Record<string, unknown>;
  assert.deepEqual(tolkaSparadMeny(rad, skapad + MENY_MAX_ALDER_MS), LEVANDE);
  assert.equal(tolkaSparadMeny(rad, skapad + MENY_MAX_ALDER_MS + 1), null);
  // En tid långt fram (fel klocka) litar vi inte på; några sekunders skillnad går bra.
  assert.equal(tolkaSparadMeny(rad, skapad - 10 * 60_000), null);
  assert.deepEqual(tolkaSparadMeny(rad, skapad - 5_000), LEVANDE);
});

test("vad som aldrig sparas", () => {
  assert.match(varforInteSpara(LEVANDE, true) ?? "", /degraderad/);
  assert.match(varforInteSpara({ tree: TRAD.slice(0, 2), hasSale: false }, false) ?? "", /bara 2 huvudkategorier/);
  assert.match(varforInteSpara({ tree: [...TRAD, nod("x".repeat(410_000))], hasSale: false }, false) ?? "", /för stor/);
  assert.match(varforInteSpara({ tree: [...TRAD, { id: "", name: "", slug: "", count: 0, subs: [] }], hasSale: false }, false) ?? "", /fel form/);
  assert.equal(varforInteSpara(LEVANDE, false), null);
});

test("arMenytrad kräver namn, adress, antal och underkategorier", () => {
  assert.equal(arMenytrad(TRAD), true);
  assert.equal(arMenytrad([]), false);
  assert.equal(arMenytrad({}), false);
  assert.equal(arMenytrad([null]), false);
  assert.equal(arMenytrad([{ ...TRAD[0], subs: undefined }]), false);
  assert.equal(arMenytrad([{ ...TRAD[0], count: "0" }]), false);
});

test("en rad per miljö: en förhandsversion skriver aldrig produktionens meny", () => {
  assert.equal(menyRadId("production"), "sidhuvud-meny-production");
  assert.equal(menyRadId("preview"), "sidhuvud-meny-preview");
  assert.equal(menyRadId(undefined), "sidhuvud-meny-development");
  assert.equal(menyRadId("annat"), "sidhuvud-meny-development");
});

// Källkoden: vägvalet sitter där det ska, och läsningen gör aldrig en ISR-sida dynamisk.
const kod = (fil: string) => readFileSync(new URL(fil, import.meta.url), "utf8");

test("sidhuvudet väntar inte längre in katalogen själv", () => {
  const site = kod("../components/site.tsx");
  const sidhuvud = site.slice(site.indexOf("export async function SiteHeader"), site.indexOf("export async function SiteFooter"));
  assert.match(sidhuvud, /sidhuvudsdata\(\)/);
  assert.doesNotMatch(sidhuvud, /getProducts\(|getCategoryTree\(/);
});

test("☠️ läsningen i renderingen har inget cache-val (no-store gör ISR-sidan dynamisk)", () => {
  const data = kod("./sidhuvud-data.ts");
  const las = data.slice(data.indexOf("async function lasRad"), data.indexOf("let minne"));
  assert.match(las, /fetch\(/);
  assert.doesNotMatch(las, /cache\s*:|revalidate|no-store|hamta\(/);
  assert.match(data, /katalogenArDegraderad\(produkter\)/, "en degraderad katalog får aldrig sparas");
});

test("cronen finns, har tid för en kall katalog och står i vercel.json", () => {
  const rutt = kod("../app/api/cron/meny/route.ts");
  assert.match(rutt, /export const maxDuration = 120/);
  assert.match(rutt, /byggOchSparaMeny\(\)/);
  assert.match(rutt, /sammaHemlighet/);
  const cfg = JSON.parse(kod("../vercel.json")) as { crons: { path: string; schedule: string }[] };
  const rad = cfg.crons.find((c) => c.path === "/api/cron/meny");
  assert.ok(rad, "saknar /api/cron/meny i vercel.json");
  assert.match(rad.schedule, /^\d+(,\d+){3} \* \* \* \*$/, "fyra gånger i timmen");
});
