// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Produktsidans livslängd hänger på att INGEN hämtning på sidans väg har en
// kortare revalidate än sidan själv: Next sänker hela rutten till den lägsta
// fetch-tiden. Så byggdes produktsidorna om var femte minut fram till
// 2026-10-01 (V3-hämtningens 300 s), fast sidan sade en timme. Proven läser
// källan, som lib/meganav-ssr.test.ts, eftersom TSX-sidan inte går att köra här.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  PRODUKTSIDA_SEKUNDER,
  produktTagg,
  recensionsTagg,
  gpsrTagg,
  produktensTaggar,
  planeraUppdatering,
  behoverSlug,
  giltigSlug,
} from "./produkt-cache.ts";

const las = (fil: string) => readFileSync(fil, "utf8");

test("sidans literal och konstanten är samma tal", () => {
  const sida = las("app/produkt/[slug]/page.tsx");
  const m = sida.match(/export const revalidate = (\d+);/);
  assert.ok(m, "hittade ingen `export const revalidate = <tal>;` i produktsidan");
  assert.equal(Number(m[1]), PRODUKTSIDA_SEKUNDER);
  assert.equal(PRODUKTSIDA_SEKUNDER, 6 * 3600, "säkerhetsnätet är sex timmar tills Leonard sagt annat");
});

test("inga produktsidor förbyggs (de kallstartade och hämtade hela katalogen)", () => {
  const sida = las("app/produkt/[slug]/page.tsx");
  assert.match(sida, /export async function generateStaticParams\(\) \{\s*return \[\];\s*\}/);
});

test("produktsidans hämtningar använder sidans livslängd och egna taggar", () => {
  assert.match(
    las("lib/products.ts"),
    /next: \{ revalidate: PRODUKTSIDA_SEKUNDER, tags: \[produktTagg\(productId\)\] \}/,
    "V3-produkten ska cachas lika länge som sidan och tömmas per produkt",
  );
  assert.match(
    las("lib/reviews.ts"),
    /next: \{ revalidate: PRODUKTSIDA_SEKUNDER, tags: \["reviews", recensionsTagg\(productId\)\] \}/,
  );
  assert.match(las("lib/review-aggregates.ts"), /revalidate: PRODUKTSIDA_SEKUNDER/);
  assert.match(las("lib/gpsr.ts"), /tags: \["gpsr", gpsrTagg\(productId\)\]/);
  // Sidfotens Google-betyg: token-hämtningen (50 min) ligger inne i unstable_cache.
  assert.match(las("lib/google-reviews.ts"), /unstable_cache\(hamtaGoogleReviews, \["google-reviews-v1"\], \{\s*revalidate: 21600,/);
});

test("ingen annan modul har en kort revalidate utan att stå på listan", () => {
  // Varje post här är granskad: modulen körs INTE när en produktsida renderas,
  // eller körs inne i unstable_cache där fetch-tiden inte räknas.
  const granskade: Record<string, string> = {
    "auction-motor.ts": "15 s — Fyndauktionen och startsidan, inte produktsidan",
    "image-scores.ts": "600 s — startsidan och /butik",
    "redirects.ts": "300 s — bara när produkten inte finns (404/omdirigering)",
    "google-reviews.ts": "3000 s token — inne i unstable_cache",
    "kort-livslangd.ts": "300 s — med flit, bara i reservgrenar (sidor byggda på reservdata)",
    "kundvagn-underlag.ts": "3600 s — varukorgens förslag och värmningscronen, aldrig en sidrendering",
  };
  // Hela lib/ och components/, också undermappar. Sidfiler i app/ har egna
  // `export const revalidate` för sina egna rutter och räknas inte här.
  const filer = (rot: string): string[] =>
    (readdirSync(rot, { recursive: true }) as string[])
      .filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f))
      .map((f) => `${rot}/${f}`);
  const hittade: string[] = [];
  for (const fil of [...filer("lib"), ...filer("components")]) {
    const namn = fil.split("/").pop() as string;
    const kod = las(fil).replace(/\/\/.*$/gm, "");
    // Både `revalidate: 300` och `unstable_cache(..., { revalidate: 300 })`.
    for (const m of kod.matchAll(/revalidate:\s*([\d_]+)/g)) {
      const sek = Number(m[1].replace(/_/g, ""));
      if (sek < PRODUKTSIDA_SEKUNDER && !(namn in granskade)) hittade.push(`${fil}: revalidate ${sek}`);
    }
  }
  assert.deepEqual(hittade, [], "kort revalidate utanför listan — sänker den produktsidan?");
});

test("taggarna", () => {
  const id = "e0b154ec-0779-4cb3-8149-84f0996fbacf";
  assert.equal(produktTagg(id), `produkt-${id}`);
  assert.equal(recensionsTagg(id), `recensioner-${id}`);
  assert.equal(gpsrTagg(id), `gpsr-${id}`);
  assert.deepEqual(produktensTaggar(id), [produktTagg(id), recensionsTagg(id), gpsrTagg(id)]);
  for (const t of produktensTaggar(id)) assert.ok(t.length <= 256, "Next tar högst 256 tecken per tagg");
});

const A = "e0b154ec-0779-4cb3-8149-84f0996fbacf";
const B = "a23ea344-b9b0-4052-a28b-3d8b0c1d2e3f";

test("planen: taggar per produkt, en sida per slug, dubbletter slås ihop", () => {
  const plan = planeraUppdatering([
    { id: A, slug: "gungstol-beige" },
    { id: A.toUpperCase() },
    { id: B },
  ], new Map([[B, "vattenkokare-1-7-liter"]]));
  assert.deepEqual(plan.ids, [A, B]);
  assert.deepEqual(plan.taggar, [produktTagg(A), produktTagg(B)]);
  assert.deepEqual(plan.sokvagar, ["/produkt/gungstol-beige", "/produkt/vattenkokare-1-7-liter"]);
  assert.deepEqual(plan.slugs, ["gungstol-beige", "vattenkokare-1-7-liter"]);
  assert.deepEqual(plan.utanSlug, []);
  assert.equal(plan.ogiltiga, 0);
});

test("planen: avsändarens slug vinner över uppslaget, och gamla slugar töms också", () => {
  const plan = planeraUppdatering(
    [{ id: A, slug: "nytt-namn", gamlaSlugs: ["gammalt-namn"] }],
    new Map([[A, "uppslaget-som-slapar"]]),
  );
  assert.deepEqual(plan.sokvagar, ["/produkt/nytt-namn", "/produkt/gammalt-namn"]);
  assert.deepEqual(plan.slugs, ["nytt-namn"]);
});

test("planen: utan slug töms bara taggarna, och skräp faller bort", () => {
  const plan = planeraUppdatering([
    { id: A },
    { id: "inte-ett-id", slug: "x" },
    { id: B, slug: "../admin" },
    // @ts-expect-error — skräp från nätet ska inte fälla planen
    null,
  ]);
  assert.deepEqual(plan.ids, [A, B]);
  assert.deepEqual(plan.utanSlug, [A, B]);
  assert.deepEqual(plan.sokvagar, []);
  assert.equal(plan.ogiltiga, 2);
  assert.deepEqual(plan.taggar, [produktTagg(A), produktTagg(B)]);
});

test("planen: bara taggen för det som ändrats — GPSR töms aldrig automatiskt", () => {
  const plan = planeraUppdatering([
    { id: A, slug: "a", vad: "recensioner" },
    { id: B, slug: "b" },
    { id: B, vad: "recensioner" },
  ]);
  assert.deepEqual(plan.taggar, [recensionsTagg(A), produktTagg(B), recensionsTagg(B)]);
  assert.ok(!plan.taggar.some((t) => t.startsWith("gpsr-")));
  // Sidan töms oavsett vad som ändrats.
  assert.deepEqual(plan.sokvagar, ["/produkt/a", "/produkt/b"]);
});

test("☠️ slugen blir en sökväg som värms: bara bokstäver, siffror, - och _", () => {
  for (const ok of ["gungstol-beige", "vattenkokare-1-7-liter", "sang_140", "kök-stol"]) {
    assert.equal(giltigSlug(ok), true, ok);
  }
  for (const nej of ["../admin", "x\\..\\..\\api\\cron\\warm-and-ping", "a.b", "a b", "a/b", "a?b", "a%2Fb", "a\u202eb", "", "x".repeat(201)]) {
    assert.equal(giltigSlug(nej), false, JSON.stringify(nej));
  }
});

test("planen: gamla slugar måste vara en lista, och högst tio per produkt", () => {
  const manga = Array.from({ length: 50 }, (_, i) => `gammal-${i}`);
  const plan = planeraUppdatering([
    { id: A, slug: "ny", gamlaSlugs: manga },
    // @ts-expect-error — skräp från nätet ska inte fälla planen
    { id: B, slug: "b", gamlaSlugs: "inte-en-lista" },
  ]);
  assert.equal(plan.sokvagar.filter((s) => s.startsWith("/produkt/gammal-")).length, 10);
  assert.ok(plan.sokvagar.includes("/produkt/b"));
});

test("behoverSlug: bara de som saknar en giltig slug, en gång var", () => {
  assert.deepEqual(behoverSlug([{ id: A, slug: "finns" }, { id: B }, { id: B }, { id: "skräp" }]), [B]);
});
