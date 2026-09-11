// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// 7 a § prisinformationslagen har TVÅ regler, och skillnaden mellan dem är
// pengar: lägstaregeln ger ett lägre jämförpris än gradvis-regeln, alltså en
// mindre rabatt att skylta med. Att välja fel regel är därför inte ett
// skönhetsfel — det är antingen ett överdrivet rabattpåstående eller en förlorad
// försäljning.
//
// Proven nedan är byggda kring de fyra fall som faktiskt skiljer reglerna åt,
// plus de fall där vi inte får påstå någon sänkning alls.
import test from "node:test";
import assert from "node:assert/strict";
import { jamforpris, idagISO, tillMinor, FONSTER_DAGAR, type Observation } from "./price-history.ts";

const IDAG = "2026-09-11";
const DAG_MS = 86_400_000;

/** Datum n dagar före IDAG. */
function dag(n: number): string {
  const t = Date.UTC(2026, 8, 11) - n * DAG_MS;
  return new Date(t).toISOString().slice(0, 10);
}

/** Observationer: [dagar före idag, pris i öre]. */
function obs(...par: [number, number][]): Observation[] {
  return par.map(([n, p]) => ({ datum: dag(n), prisMinor: p }));
}

test("platt pris i hela fönstret ger det priset", () => {
  const r = jamforpris(obs([40, 199900]), IDAG, 149900);
  assert.deepEqual(r, { prisMinor: 199900, grund: "lagsta-30-dagar" });
});

test("en tidigare kampanj sänker jämförpriset", () => {
  // Det HÄR är hela poängen med lagen. Utan den hade vi jämfört mot 1 999 kr
  // trots att varan kostade 1 699 kr för två veckor sedan.
  const r = jamforpris(
    obs([40, 199900], [19, 169900], [14, 199900]),
    IDAG,
    149900,
  );
  assert.deepEqual(r, { prisMinor: 169900, grund: "lagsta-30-dagar" });
});

test("gradvis sänkning jämförs mot priset före första sänkningen", () => {
  // 1999 → 1799 → 1599 → idag 1499. Lägstaregeln hade gett 1 599 kr; lagen
  // säger uttryckligen att gradvis nedtrappning i stället jämförs mot 1 999 kr.
  const r = jamforpris(
    obs([40, 199900], [9, 179900], [4, 159900]),
    IDAG,
    149900,
  );
  assert.deepEqual(r, { prisMinor: 199900, grund: "fore-forsta-sankningen" });
});

test("en ensam sänkning är inte gradvis", () => {
  // 1999 → idag 1499 är EN sänkning. Då gäller lägstaregeln, och de två
  // reglerna råkar ge samma tal — men grunden ska vara den rätta.
  const r = jamforpris(obs([40, 199900]), IDAG, 149900);
  assert.equal(r?.grund, "lagsta-30-dagar");
});

test("nedtrappning som pågår in i fönstret mäts från fönstrets början", () => {
  // 2 499 kr låg utanför de 30 dagarna och räknas inte — lagen frågar efter
  // sänkningar "under denna tid". Priset dag −30 var 2 299 kr, och det är det
  // pris som gällde före varje sänkning INOM fönstret.
  //
  // Min första version svarade 1 899 kr här, för att jag krävde att körningen
  // började strikt inne i serien. Det var ett villkor jag hittat på, inte
  // lagens.
  const r = jamforpris(
    obs([40, 249900], [35, 229900], [25, 209900], [15, 189900]),
    IDAG,
    149900,
  );
  assert.deepEqual(r, { prisMinor: 229900, grund: "fore-forsta-sankningen" });
});

test("för kort historik ger inget jämförpris", () => {
  // Ingen observation på eller före dag −30 → vi vet inte vad priset var då.
  // Produkten får då inte visa någon rea. Det är kravet per PRODUKT, inte per
  // butik, och nya produkter träffas av det.
  assert.equal(jamforpris(obs([10, 199900]), IDAG, 149900), null);
  assert.equal(jamforpris([], IDAG, 149900), null);
});

test("glest mätt men täckt fönster fungerar", () => {
  // Priset är en trappa: en observation gäller tills nästa. Ett missat
  // cron-pass ska inte slå ut jämförpriset i en månad.
  const r = jamforpris(obs([90, 199900]), IDAG, 149900);
  assert.deepEqual(r, { prisMinor: 199900, grund: "lagsta-30-dagar" });
});

test("ingen sänkning att påstå när priset inte är lägre", () => {
  assert.equal(jamforpris(obs([40, 149900]), IDAG, 149900), null);
  assert.equal(jamforpris(obs([40, 129900]), IDAG, 149900), null);
});

test("en prishöjning ger inget jämförpris", () => {
  // 1499 i hela fönstret, idag 1999 → ingen sänkning.
  assert.equal(jamforpris(obs([40, 149900]), IDAG, 199900), null);
});

test("dagens egen rad räknas inte som sin egen historik", () => {
  // Snapshotet kan ha hunnit skriva dagens pris innan sidan renderas. Räknades
  // den raden in skulle lägsta bli dagens pris, och då vore ingen sänkning
  // någonsin påståbar.
  const r = jamforpris(obs([40, 199900], [0, 149900]), IDAG, 149900);
  assert.deepEqual(r, { prisMinor: 199900, grund: "lagsta-30-dagar" });
});

test("senare rad för samma dag vinner", () => {
  // Scenariot är en tidigare kampanj (alltså lägstaregeln, inte gradvis) så att
  // provet mäter DUBBLETTHANTERINGEN och inget annat: skrivs 1 599 kr sist för
  // dag −19 ska lägsta bli 1 599, inte 1 699.
  const bas = obs([40, 199900]);
  const efter = obs([14, 199900]);
  const en = jamforpris([...bas, ...obs([19, 169900]), ...efter], IDAG, 149900);
  assert.deepEqual(en, { prisMinor: 169900, grund: "lagsta-30-dagar" });

  const tva = jamforpris(
    [...bas, ...obs([19, 169900]), ...obs([19, 159900]), ...efter],
    IDAG,
    149900,
  );
  assert.deepEqual(tva, { prisMinor: 159900, grund: "lagsta-30-dagar" });
});

test("skräpvärden ignoreras i stället för att slå igenom", () => {
  const skrap: Observation[] = [
    { datum: "inte-ett-datum", prisMinor: 100 },
    { datum: dag(20), prisMinor: 0 },
    { datum: dag(18), prisMinor: -500 },
    { datum: dag(16), prisMinor: 1499.5 },
  ];
  const r = jamforpris([...obs([40, 199900]), ...skrap], IDAG, 149900);
  assert.deepEqual(r, { prisMinor: 199900, grund: "lagsta-30-dagar" });
});

test("ogiltig indata ger null, inte ett tal", () => {
  assert.equal(jamforpris(obs([40, 199900]), "2026-13-45", 149900), null);
  assert.equal(jamforpris(obs([40, 199900]), IDAG, 0), null);
  assert.equal(jamforpris(obs([40, 199900]), IDAG, -1), null);
  assert.equal(jamforpris(obs([40, 199900]), IDAG, 1499.5), null);
});

test("fönstret är 30 dagar, och gränsdagen räknas in", () => {
  assert.equal(FONSTER_DAGAR, 30);
  // Observation exakt på dag −30 räcker för att täcka fönstret.
  assert.notEqual(jamforpris(obs([30, 199900]), IDAG, 149900), null);
  // Dag −29 räcker inte.
  assert.equal(jamforpris(obs([29, 199900]), IDAG, 149900), null);
});

test("en dipp UTANFÖR fönstret påverkar inte jämförpriset", () => {
  // 1 299 kr för 40 dagar sedan är historia som lagen inte frågar efter.
  const r = jamforpris(obs([45, 129900], [40, 199900]), IDAG, 149900);
  assert.deepEqual(r, { prisMinor: 199900, grund: "lagsta-30-dagar" });
});

test("idagISO följer butikens dygn, inte serverns", () => {
  // Serverns UTC-midnatt ligger en eller två timmar fel mot Europe/Stockholm.
  // Ett snapshot som hamnar på fel datum ger en lucka den ena dagen och en
  // dubblett den andra — och en lucka i fönstrets början gör att ingen rea får
  // visas alls.
  //
  // Sommartid (UTC+2): 22:30 UTC den 10:e är redan den 11:e i Sverige.
  assert.equal(idagISO(new Date("2026-09-10T22:30:00Z")), "2026-09-11");
  assert.equal(idagISO(new Date("2026-09-10T21:59:00Z")), "2026-09-10");
  // Vintertid (UTC+1): gränsen flyttar sig en timme.
  assert.equal(idagISO(new Date("2026-01-10T23:30:00Z")), "2026-01-11");
  assert.equal(idagISO(new Date("2026-01-10T22:59:00Z")), "2026-01-10");
});

test("tillMinor avrundar till hela ören och avvisar icke-priser", () => {
  assert.equal(tillMinor(1499), 149900);
  assert.equal(tillMinor(1379.5), 137950);
  // 19.99 * 100 blir 1998.9999999999998 i flyttal — därav Math.round.
  assert.equal(tillMinor(19.99), 1999);
  assert.equal(tillMinor(0), null);
  assert.equal(tillMinor(-5), null);
  assert.equal(tillMinor(NaN), null);
  assert.equal(tillMinor(Infinity), null);
});
