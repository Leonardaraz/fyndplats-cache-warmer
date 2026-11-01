// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  MENY_GRUPPER, AVDELNINGSORDNING, grupperaUnderkategorier, ordnaAvdelningar, avdelningIHuvudmenyn, manadISverige,
} from "./meny-grupper.ts";
import { asciiSlug } from "./category-slug.ts";

const sub = (slug: string) => ({ id: slug, slug });

test("varje underkategori kommer med exakt en gång, okända sist under Mer", () => {
  const subs = ["kontorsstolar", "soffor-baddsoffor", "ny-kategori", "gamingstolar", "byraer"].map(sub);
  const g = grupperaUnderkategorier("mobler", subs);
  assert.deepEqual(g.map((x) => x.rubrik), ["Vardagsrum", "Sovrum", "Kontor & gaming", "Mer"]);
  assert.deepEqual(g.flatMap((x) => x.subs.map((s) => s.slug)).sort(), subs.map((s) => s.slug).sort());
  assert.deepEqual(g.at(-1)?.subs.map((s) => s.slug), ["ny-kategori"]);
});

test("tomma grupper visas inte", () => {
  const g = grupperaUnderkategorier("husdjur", [sub("klostrad")]);
  assert.deepEqual(g, [{ rubrik: "Katt", subs: [sub("klostrad")] }]);
});

test("avdelning utan grupper får en rubriklös lista i Wix ordning", () => {
  const subs = [sub("massagebankar"), sub("hudvard-ansikte")];
  assert.deepEqual(grupperaUnderkategorier("skonhet-halsa", subs), [{ rubrik: null, subs }]);
  assert.deepEqual(grupperaUnderkategorier("skonhet-halsa", []), []);
});

test("ingen slug står i två grupper, och alla är butikens ASCII-slugar", () => {
  for (const [avd, grupper] of Object.entries(MENY_GRUPPER)) {
    const alla = grupper.flatMap((g) => g.slugs);
    assert.equal(new Set(alla).size, alla.length, avd);
    for (const s of [avd, ...alla]) assert.match(s, /^[a-z0-9-]+$/, s);
  }
});

test("Jul & Högtider står i menyn september–januari, i svensk tid", () => {
  assert.equal(avdelningIHuvudmenyn("Jul & Högtider", new Date("2026-09-01T00:30:00+02:00")), true);
  assert.equal(avdelningIHuvudmenyn("Jul & Högtider", new Date("2027-01-31T12:00:00+01:00")), true);
  assert.equal(avdelningIHuvudmenyn("Jul & Högtider", new Date("2027-02-01T00:30:00+01:00")), false);
  // 31 augusti 23:30 UTC är redan 1 september i Sverige.
  assert.equal(manadISverige(new Date("2026-08-31T23:30:00Z")), 9);
  assert.equal(avdelningIHuvudmenyn("Jul & Högtider", new Date("2026-07-15T12:00:00Z")), false);
  assert.equal(avdelningIHuvudmenyn("Möbler", new Date("2026-07-15T12:00:00Z")), true);
});

// ── VEVOR-trädet 2026-10-31 ─────────────────────────────────────────────────

test("menyns ordning är den Leonard godkände för VEVOR-trädet", () => {
  assert.deepEqual(AVDELNINGSORDNING, [
    "Hem & Inredning", "Möbler", "Kök & Husgeråd", "Trädgård & Utemöbler", "Bygg & Renovering",
    "Barn & Familj", "Skönhet & Hälsa", "Husdjur", "Sport & Fritid", "Jul & Högtider",
    "Verktyg & Maskiner", "Bil & Garage", "Företag & Proffs",
  ]);
});

test("avdelningarna ordnas efter menyns ordning, inte efter antal produkter", () => {
  const a = (name: string, count: number) => ({ name, count });
  // Med 12 000 publicerade verktyg hade storleksordningen satt Verktyg först.
  const ut = ordnaAvdelningar([
    a("Verktyg & Maskiner", 12000), a("Okänd mindre", 5), a("Möbler", 700), a("Okänd större", 50),
    a("Hem & Inredning", 400), a("Bil & Garage", 47),
  ]);
  assert.deepEqual(ut.map((x) => x.name), [
    "Hem & Inredning", "Möbler", "Verktyg & Maskiner", "Bil & Garage", "Okänd större", "Okänd mindre",
  ]);
});

test("menyn och mobilmenyn ordnar avdelningarna med ordnaAvdelningar", () => {
  const src = readFileSync("lib/category-groups.ts", "utf8");
  const trad = src.slice(src.indexOf("export function buildCategoryTree"), src.indexOf("// Cachad hierarki"));
  assert.match(trad, /ordnaAvdelningar\(collections/);
  assert.doesNotMatch(trad, /\.sort\(\(a, b\) => b\.count - a\.count\)/, "storleksordningen är tillbaka");
});

test("korten på /butik och startsidan följer menyns ordning", () => {
  // buildGroupCards går igenom MAIN_GROUPS i ordning. Modulen importerar Wix
  // och går inte att köra här, så provet läser källan.
  const src = readFileSync("lib/category-groups.ts", "utf8");
  const lista = src.slice(src.indexOf("export const MAIN_GROUPS"), src.indexOf("// ── Kategori-hero-bilder"));
  const kort = [...lista.matchAll(/^\s+main: "([^"]+)",$/gm)].map((m) => m[1]);
  assert.ok(kort.length >= 10, `hittade bara ${kort.length} avdelningar i MAIN_GROUPS`);
  const platser = kort.map((namn) => AVDELNINGSORDNING.indexOf(namn));
  assert.ok(!platser.includes(-1), `MAIN_GROUPS har en avdelning som menyn inte känner: ${kort[platser.indexOf(-1)]}`);
  assert.deepEqual(platser, [...platser].sort((x, y) => x - y), `MAIN_GROUPS i fel ordning: ${kort.join(", ")}`);
});

test("varje avdelning med rubriker är en avdelning i menyn, med butikens slug", () => {
  const avdelningar = new Set(AVDELNINGSORDNING.map(asciiSlug));
  for (const avd of Object.keys(MENY_GRUPPER)) assert.ok(avdelningar.has(avd), `${avd} finns inte i menyn`);
});

test("Bil & Garage och Verktyg & Maskiner med alla underkategorier synliga", () => {
  const bil = ["domkrafter-billyftar", "verkstadsutrustning", "bilverktyg", "garageinredning", "bildelar", "biltillbehor",
    "takracken-lastbarare", "vinschar", "flakboxar-pickuptillbehor", "bil-slap", "husbil-husvagn", "elbilsladdning-solenergi"].map(sub);
  assert.deepEqual(grupperaUnderkategorier("bil-garage", bil).map((g) => g.rubrik), ["Verkstad", "Bil", "Släp & husbil", "Laddning & solenergi"]);
  const verktyg = ["elverktyg", "verkstadsmaskiner", "svetsning", "kompressorer-tryckluft", "hogtryckstvattar-rengoring",
    "verktygstillbehor", "handverktyg", "verktyg-hemmafix", "verktygsvagnar-verktygslador", "lyft-transport",
    "stegar-stallningar", "arbetsklader-skydd"].map(sub);
  assert.deepEqual(grupperaUnderkategorier("verktyg-maskiner", verktyg).map((g) => g.rubrik), ["Elverktyg & maskiner", "Handverktyg", "Förvaring & lyft", "Arbetskläder"]);
  const bygg = ["vvs-vatten", "pumpar", "el-installation", "varme-ventilation-ac", "badrumsrenovering", "golv-golvverktyg",
    "farg-tapet", "dorrar-dorrbeslag", "beslag-jarnvaror", "byggmaterial-byggverktyg", "trall-racken"].map(sub);
  assert.deepEqual(grupperaUnderkategorier("bygg-renovering", bygg).map((g) => g.rubrik), ["VVS & el", "Golv, färg & dörrar", "Bygg"]);
  // Ingen hamnar under "Mer": varje underkategori har en rubrik.
  for (const [avd, subs] of [["bil-garage", bil], ["verktyg-maskiner", verktyg], ["bygg-renovering", bygg]] as const) {
    assert.equal(grupperaUnderkategorier(avd, subs).flatMap((g) => g.subs).length, subs.length, avd);
  }
});

test("VEVOR:s nya underkategorier i de gamla avdelningarna hamnar under en rubrik, inte under Mer", () => {
  const nya: Record<string, string[]> = {
    "tradgard-utemobler": ["pool-spa", "tradgardsmaskiner", "staket-grindar", "tradgardsanlaggning-konstgras"],
    "sport-fritid": ["hantverk-somnad", "camping-kylboxar", "bat-vattensport", "jakt-fiske"],
    "kok-husgerad": ["glass-is-dessertmaskiner", "matforvaring-koksorganisering", "kottkvarnar-charkuteri"],
    "hem-inredning": ["hemelektronik-tillbehor", "mattor", "kassaskap"],
    mobler: ["kontorstillbehor"],
  };
  for (const [avd, slugs] of Object.entries(nya)) {
    const g = grupperaUnderkategorier(avd, slugs.map(sub));
    assert.ok(!g.some((x) => x.rubrik === "Mer"), `${avd}: ${g.find((x) => x.rubrik === "Mer")?.subs.map((s) => s.slug)}`);
    assert.equal(g.flatMap((x) => x.subs).length, slugs.length, avd);
  }
  // Så länge de nya är dolda ser dagens meny ut som förut: Fritid behåller sina tre.
  assert.deepEqual(grupperaUnderkategorier("sport-fritid", ["friluftsliv-resa", "bil-cykel", "hobby-musik"].map(sub)),
    [{ rubrik: "Fritid", subs: ["friluftsliv-resa", "bil-cykel", "hobby-musik"].map(sub) }]);
});

test("natten efter VEVOR-trädet: bara de synliga underkategorierna, inga tomma rubriker", () => {
  // Wix svarar inte med dolda kategorier, och getCollections sållar bort tomma.
  // Ikväll är två underkategorier synliga i var och en av de två avdelningarna.
  assert.deepEqual(grupperaUnderkategorier("bil-garage", [sub("bil-slap"), sub("elbilsladdning-solenergi")]), [
    { rubrik: "Släp & husbil", subs: [sub("bil-slap")] },
    { rubrik: "Laddning & solenergi", subs: [sub("elbilsladdning-solenergi")] },
  ]);
  assert.deepEqual(grupperaUnderkategorier("verktyg-maskiner", [sub("verktygsvagnar-verktygslador"), sub("verktyg-hemmafix")]), [
    { rubrik: "Handverktyg", subs: [sub("verktyg-hemmafix")] },
    { rubrik: "Förvaring & lyft", subs: [sub("verktygsvagnar-verktygslador")] },
  ]);
  // En avdelning utan en enda synlig underkategori ger ingen rubrik alls.
  assert.deepEqual(grupperaUnderkategorier("bygg-renovering", []), []);
  assert.deepEqual(grupperaUnderkategorier("foretag-proffs", []), []);
  // Företag & Proffs har inga rubriker: en rubriklös lista i Wix ordning.
  const fp = [sub("storkok-restaurang"), sub("salong-spa")];
  assert.deepEqual(grupperaUnderkategorier("foretag-proffs", fp), [{ rubrik: null, subs: fp }]);
});
