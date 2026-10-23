// Repot kör node --test (se package.json) — syskonmodulen importeras MED .ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  arTillfalligt,
  felStatus,
  hamtaKatalogSidor,
  KATALOG_PAUSER_MS,
  KATALOG_SAMTIDIGA,
  type KatalogSida,
} from "./katalog-sidor.ts";

const intill = (n: number) => Array.from({ length: n }, (_, i) => i);
const ingenVantan = { vanta: async () => {} };
const fel = (status: number, text: string) => Object.assign(new Error(text), { status });

/** En katalog med n produkter (0, 1, 2 …) som svarar som Wix: en sida och
 *  totalantalet. Varje anrop tar en kort stund, så att flera hinner vara på väg
 *  samtidigt, och räknas. */
function katalog(n: number, fordrojning: (skip: number) => number = () => 2) {
  const rader = intill(n);
  const stat = { anrop: 0, samtidigt: 0, flestSamtidigt: 0, klara: [] as number[] };
  const hamta = async (skip: number, limit: number): Promise<KatalogSida<number>> => {
    stat.anrop++;
    stat.samtidigt++;
    stat.flestSamtidigt = Math.max(stat.flestSamtidigt, stat.samtidigt);
    await new Promise((r) => setTimeout(r, fordrojning(skip)));
    stat.samtidigt--;
    stat.klara.push(skip);
    return { items: rader.slice(skip, skip + limit), totalCount: n };
  };
  return { hamta, stat };
}

test("alla sidor kommer i ordning, sex åt gången", async () => {
  // 2026-10-21: 5 064 synliga produkter, alltså 51 sidor med 64 rader på den sista.
  const { hamta, stat } = katalog(5064);
  const r = await hamtaKatalogSidor(hamta, ingenVantan);
  assert.deepEqual(r.items, intill(5064));
  assert.equal(r.sidor, 51);
  assert.equal(r.rapporteratTotalt, 5064);
  assert.equal(r.slogITaket, false);
  assert.equal(r.omforsok, 0, "den sista sidan är inte kort bara för att den har 64 rader");
  assert.equal(r.kortaSidor, 0);
  assert.equal(stat.anrop, 51, "varje sida hämtas en gång");
  // Sex är mätningens val (10–13 s mot 65,7 s en i taget). Talet står här och
  // inte som konstanten, så att en ändring av konstanten syns i testet.
  assert.equal(KATALOG_SAMTIDIGA, 6);
  assert.equal(stat.flestSamtidigt, 6, "sex sidor åt gången, inte en och inte fler");
});

test("ordningen är sidornas, inte i vilken ordning svaren kom", async () => {
  // Senare sidor svarar först inom varje omgång.
  const { hamta, stat } = katalog(1234, (skip) => 30 - (skip / 100) * 2);
  const r = await hamtaKatalogSidor(hamta, ingenVantan);
  assert.notDeepEqual(stat.klara, [...stat.klara].sort((a, b) => a - b), "svaren ska komma i oordning");
  assert.deepEqual(r.items, intill(1234));
});

test("samma rader som när sidorna hämtades en i taget", async () => {
  const parallellt = await hamtaKatalogSidor(katalog(1234).hamta, ingenVantan);
  const enITaget = katalog(1234);
  const sekventiellt = await hamtaKatalogSidor(enITaget.hamta, { ...ingenVantan, samtidiga: 1 });
  assert.equal(enITaget.stat.flestSamtidigt, 1);
  assert.deepEqual(parallellt.items, sekventiellt.items);
});

test("Wix SDK:s fel bär HTTP-statusen i status, och ett nätverksfel saknar den", () => {
  // Uppmätt 2026-10-21: queryProducts().limit(500).find() kastar ett SDKError med
  // status 400 och response.status 400.
  assert.equal(felStatus({ status: 400, response: { status: 400 } }), 400);
  assert.equal(felStatus({ response: { status: 503 } }), 503);
  assert.equal(felStatus(new TypeError("fetch failed")), null);
  assert.equal(felStatus(undefined), null);
});

test("429, 408, 5xx och nätverksfel går över; andra 4xx gör det inte", () => {
  for (const s of [408, 429, 500, 502, 503, 504]) assert.equal(arTillfalligt({ status: s }), true, String(s));
  assert.equal(arTillfalligt(new TypeError("fetch failed")), true);
  for (const s of [400, 401, 403, 404]) assert.equal(arTillfalligt({ status: s }), false, String(s));
});

test("429 och 502 försöks igen efter 1 och 3 sekunder", async () => {
  const { hamta } = katalog(450);
  const felen = [fel(429, "Too Many Requests"), fel(502, "Bad Gateway")];
  const vantat: number[] = [];
  const r = await hamtaKatalogSidor(
    async (skip, limit) => {
      if (skip === 200 && felen.length) throw felen.shift();
      return hamta(skip, limit);
    },
    { vanta: async (ms) => { vantat.push(ms); } },
  );
  assert.deepEqual(r.items, intill(450));
  assert.deepEqual(vantat, [1000, 3000]);
  assert.equal(r.omforsok, 2);
});

test("ett nätverksfel försöks igen", async () => {
  const { hamta } = katalog(250);
  let felat = false;
  const r = await hamtaKatalogSidor(async (skip, limit) => {
    if (skip === 100 && !felat) {
      felat = true;
      throw new TypeError("fetch failed");
    }
    return hamta(skip, limit);
  }, ingenVantan);
  assert.deepEqual(r.items, intill(250));
  assert.equal(r.omforsok, 1);
});

test("ett permanent fel kastas direkt, och inga nya sidor startas efter det", async () => {
  const { hamta, stat } = katalog(5064);
  const vantat: number[] = [];
  await assert.rejects(
    hamtaKatalogSidor(
      async (skip, limit) => {
        if (skip === 300) throw fel(400, "INVALID_ARGUMENT");
        return hamta(skip, limit);
      },
      { vanta: async (ms) => { vantat.push(ms); } },
    ),
    /INVALID_ARGUMENT/,
  );
  assert.deepEqual(vantat, [], "en felaktig fråga blir inte rätt av att frågas igen");
  // Första sidan plus de som redan var på väg, högst sex. Inte alla 51.
  assert.ok(stat.anrop <= 7, `hämtningen ska sluta efter felet, inte gå klart (${stat.anrop} anrop)`);
});

test("en sida som faller alla gånger fäller hela hämtningen efter 1, 3 och 8 sekunder", async () => {
  // Anroparen fångar felet och visar reservlistan, och nästa begäran försöker igen.
  const { hamta } = katalog(450);
  const vantat: number[] = [];
  await assert.rejects(
    hamtaKatalogSidor(
      async (skip, limit) => {
        if (skip === 100) throw fel(429, "Too Many Requests");
        return hamta(skip, limit);
      },
      { vanta: async (ms) => { vantat.push(ms); } },
    ),
    /Too Many Requests/,
  );
  assert.deepEqual(vantat, [...KATALOG_PAUSER_MS]);
});

test("en kort sida mitt i katalogen hämtas om", async () => {
  // 2026-08-16 gav en enda degraderad sida 16 rader i stället för 78, och 62
  // produkter försvann ur butiken utan ett felmeddelande.
  const { hamta } = katalog(450);
  let kortAnnu = true;
  const r = await hamtaKatalogSidor(async (skip, limit) => {
    const sida = await hamta(skip, limit);
    if (skip === 200 && kortAnnu) {
      kortAnnu = false;
      return { ...sida, items: sida.items.slice(0, 16) };
    }
    return sida;
  }, ingenVantan);
  assert.deepEqual(r.items, intill(450));
  assert.equal(r.omforsok, 1);
  assert.equal(r.kortaSidor, 0);
});

test("en sida som är kort även efter omförsöken ger färre rader än totalantalet", async () => {
  // Då cachar fetchProducts inte katalogen (KAPAD produkthämtning), och nästa
  // begäran hämtar om den.
  const { hamta } = katalog(450);
  const r = await hamtaKatalogSidor(async (skip, limit) => {
    const sida = await hamta(skip, limit);
    return skip === 200 ? { ...sida, items: sida.items.slice(0, 16) } : sida;
  }, ingenVantan);
  assert.equal(r.items.length, 450 - 84);
  assert.equal(r.rapporteratTotalt, 450);
  assert.equal(r.kortaSidor, 1);
  assert.equal(r.omforsok, KATALOG_PAUSER_MS.length);
});

test("växer katalogen under hämtningen hämtas sidan som tillkom", async () => {
  // 500 produkter när första sidan hämtas, 520 när resten hämtas.
  const rader = intill(520);
  let anrop = 0;
  const r = await hamtaKatalogSidor(async (skip, limit) => {
    const n = ++anrop === 1 ? 500 : 520;
    return { items: rader.slice(0, n).slice(skip, skip + limit), totalCount: n };
  }, ingenVantan);
  assert.deepEqual(r.items, intill(520));
  assert.equal(r.rapporteratTotalt, 520);
  assert.equal(r.sidor, 6);
});

test("krymper katalogen gäller det största totalantalet, så den ofullständiga listan inte cachas", async () => {
  // Produkt 10 döljs efter första sidan. Produkt 100 glider då från sida två
  // till sida ett, som redan är hämtad, och kommer inte med.
  const fore = intill(450);
  const efter = fore.filter((x) => x !== 10);
  let anrop = 0;
  const r = await hamtaKatalogSidor(async (skip, limit) => {
    const lista = ++anrop === 1 ? fore : efter;
    return { items: lista.slice(skip, skip + limit), totalCount: lista.length };
  }, ingenVantan);
  assert.equal(r.items.includes(100), false);
  assert.equal(r.items.length, 449);
  assert.equal(r.rapporteratTotalt, 450, "449 rader mot 450 får fetchProducts att låta bli att cacha");
  assert.equal(r.omforsok, 0, "den sista sidan stämmer mot sitt eget totalantal");
});

test("utan totalantal går hämtningen en sida i taget som förut, och en kort sida är inte slutet", async () => {
  const rader = intill(250);
  const skips: number[] = [];
  const r = await hamtaKatalogSidor(async (skip, limit) => {
    skips.push(skip);
    const lim = skips.length === 2 ? 16 : limit; // andra sidan är degraderad
    return { items: rader.slice(skip, skip + lim), totalCount: null };
  }, ingenVantan);
  assert.deepEqual(r.items, intill(250));
  assert.deepEqual(skips, [0, 100, 116, 216, 250], "stegar med det som faktiskt kom och slutar på en tom sida");
  assert.equal(r.rapporteratTotalt, null);
  assert.equal(r.slogITaket, false);
  assert.equal(r.sidor, 5);
});

test("taket flaggas i stället för att katalogen kapas tyst", async () => {
  const { hamta } = katalog(1000);
  const r = await hamtaKatalogSidor(hamta, { ...ingenVantan, maxSidor: 3 });
  assert.equal(r.slogITaket, true);
  assert.equal(r.sidor, 3);
  assert.equal(r.items.length, 300);
});

test("en tom katalog ger en tom lista", async () => {
  const r = await hamtaKatalogSidor(katalog(0).hamta, ingenVantan);
  assert.deepEqual(r.items, []);
  assert.equal(r.rapporteratTotalt, 0);
  assert.equal(r.slogITaket, false);
  assert.equal(r.omforsok, 0);
});

test("en sida som inte svarar inom tidsgränsen försöks igen", async () => {
  const { hamta } = katalog(250);
  let hangt = false;
  const r = await hamtaKatalogSidor(
    async (skip, limit) => {
      if (skip === 100 && !hangt) {
        hangt = true;
        return new Promise<KatalogSida<number>>(() => {});
      }
      return hamta(skip, limit);
    },
    { ...ingenVantan, sidtidsgrans: 20 },
  );
  assert.deepEqual(r.items, intill(250));
  assert.equal(r.omforsok, 1);
});

test("fetchProducts hämtar sidorna genom hamtaKatalogSidor, och sidovagnarna samtidigt med dem", () => {
  const t = readFileSync("lib/products.ts", "utf8");
  const kropp = t.slice(t.indexOf("async function fetchProducts"), t.indexOf("export const getProducts"));
  assert.match(kropp, /hamtaKatalogSidor/);
  assert.doesNotMatch(kropp, /queryProducts\(\)[\s\S]*for \(let i = 0; i < MAX_SIDOR/, "den gamla slingan hämtade en sida i taget");
  const sidorna = kropp.indexOf("hamtaKatalogSidor");
  const salda = kropp.indexOf("getSoldUnits(");
  const farger = kropp.indexOf("getProductColors(");
  assert.ok(salda >= 0 && salda < sidorna, "försäljningen ska hämtas samtidigt med sidorna, inte efter");
  assert.ok(farger >= 0 && farger < sidorna, "färgvalen ska hämtas samtidigt med sidorna, inte efter");
  assert.doesNotMatch(kropp, /await getSoldUnits\(\)/, "en väntan på försäljningen efter sidorna är den gamla ordningen");
  assert.doesNotMatch(kropp, /await Promise\.all\(\[getProductColors\(\)/, "en väntan på färgvalen efter sidorna är den gamla ordningen");
  // Men först när Wix har svarat på en sida: färgvalen cachar ett misslyckat
  // svar som tomt i 30 minuter, så de ska inte fråga ett Wix som är nere.
  assert.match(kropp, /\.find\(\);\s*startaSidovagnar\(\);/);
  assert.equal((kropp.match(/startaSidovagnar\(\)/g) || []).length, 1, "startas bara efter ett svar");
});

test("morgonmejlet och run-job har tid för en kall instans", () => {
  // 2026-10-21 stoppades morgonmejlet efter 60 s: katalogen tog 66 s att hämta.
  for (const fil of ["app/api/cron/morning-email/route.ts", "app/api/admin/run-job/route.ts"]) {
    const sek = Number((readFileSync(fil, "utf8").match(/export const maxDuration = (\d+)/) || [])[1]);
    assert.ok(sek >= 300, `${fil}: maxDuration ${sek} s`);
  }
});
