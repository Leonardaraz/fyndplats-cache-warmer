// Provet är det som avgör om ett fullt pass (1 622 renderingar) körs eller inte,
// och att det är FAST är hela dess kostnadsargument. Går den egenskapen förlorad
// i en framtida omskrivning blir kvartscronen tyst mycket dyrare — det syns inte
// i något gränssnitt, bara på fakturan. Därför låses den här.
import test from "node:test";
import assert from "node:assert/strict";
import { allaNekade, arSakerSlug, fastProv, felkoder, kvarEfterPass, MAX_KVAR, MAX_LED, PROV_STORLEK, roterad, tolkaLed } from "./warm-urval.ts";

const katalog = (n: number) => Array.from({ length: n }, (_, i) => `produkt-${i}`);

test("provet är fast — samma katalog ger samma sidor varje gång", () => {
  const k = katalog(1622);
  assert.deepEqual(fastProv(k), fastProv(k));
});

test("provet är lagom stort och utan dubbletter", () => {
  const p = fastProv(katalog(1622));
  assert.equal(p.length, PROV_STORLEK);
  assert.equal(new Set(p).size, PROV_STORLEK, "samma sida två gånger vore ett svagare prov");
});

test("provet sprids över katalogen, inte i ett hörn", () => {
  // Klumpar det ihop sig i början missar det ett läge där bara svansen är kall.
  const n = 1622;
  const index = fastProv(katalog(n)).map((s) => Number(s.split("-")[1]));
  assert.ok(index[0]! < n / 12, "första sidan ska ligga tidigt");
  assert.ok(index[index.length - 1]! > n * 0.9, "sista sidan ska ligga sent");
  for (let i = 1; i < index.length; i++) {
    assert.ok(index[i]! > index[i - 1]!, "stigande ordning");
  }
});

test("små och tomma kataloger kraschar inte", () => {
  assert.deepEqual(fastProv([]), []);
  assert.equal(fastProv(katalog(1)).length, 1);
  assert.equal(fastProv(katalog(5)).length, 5, "färre sidor än provet → ta alla");
  assert.equal(new Set(fastProv(katalog(5))).size, 5, "och utan dubbletter");
});

// ── Rotationen ────────────────────────────────────────────────────────────
//
// Hinner ett fullt pass inte klart innan deadline (1 622 sidor / 8 parallella
// à ~1 s ≈ 200 s mot 240 — marginalen är liten) ska nästa körning fortsätta på
// ett ANNAT ställe. Steget räknas därför per körning, inte per timme.
//
// Det här var ett riktigt fel en stund: rotationen skrevs för en timcron och
// följde med när värmningen flyttade till en kvartscron. Då fick alla fyra
// körningar per timme samma startpunkt — ett avbrutet pass gjorde om samma huvud
// tre gånger till och nådde aldrig svansen. Och dyrt blev det, för provet är
// spritt över katalogen och hade sett svansen som kall och triggat ett nytt
// fullt pass var 15:e minut.

const KVART = 15 * 60_000;

test("rotationen flyttar sig mellan körningar, inte bara mellan timmar", () => {
  const k = katalog(1622);
  const t = Date.UTC(2026, 8, 4, 12, 0, 0);
  const forsta = roterad(k, t)[0];
  assert.notEqual(roterad(k, t + KVART)[0], forsta, "nästa kvart ska börja på annat ställe");
  assert.notEqual(roterad(k, t + 2 * KVART)[0], forsta);
  assert.notEqual(roterad(k, t + 3 * KVART)[0], forsta);
});

test("samma körning ger samma ordning — ingen slump", () => {
  const k = katalog(1622);
  const t = Date.UTC(2026, 8, 4, 12, 0, 0);
  assert.deepEqual(roterad(k, t), roterad(k, t + 1000), "inom samma kvart: identisk");
});

test("rotationen tappar aldrig en sida", () => {
  const k = katalog(1622);
  const ut = roterad(k, Date.UTC(2026, 8, 4, 12, 0, 0));
  assert.equal(ut.length, k.length);
  assert.equal(new Set(ut).size, k.length);
});

test("rotationen betar av hela katalogen över ett dygn", () => {
  // 96 körningar per dygn à 8×40 = 320 sidors steg. Täcker de ~1 622 sidorna
  // många gånger om — det som skulle gå sönder är om steget vore noll.
  const k = katalog(1622);
  const t0 = Date.UTC(2026, 8, 4, 0, 0, 0);
  const starter = new Set(Array.from({ length: 96 }, (_, i) => roterad(k, t0 + i * KVART)[0]));
  assert.ok(starter.size > 4, `startpunkterna ska variera, fick ${starter.size}`);
});

test("rotationen tål tom och enradig katalog", () => {
  assert.deepEqual(roterad([], Date.now()), []);
  assert.deepEqual(roterad(["a"], Date.now()), ["a"]);
});

// ── Kedjan efter en deploy ────────────────────────────────────────────────
//
// 2026-10-23: körningen efter deployen värmde 1 824 av 5 092 sidor och sedan
// inga fler, för provets egen hämtning värmde provet. Ett avbrutet pass lämnar
// nu resten till ett led (ett POST till samma rutt), högst MAX_LED. Det som
// låses här är att resten räknas exakt, att ett led bara kan värma säkra
// produktsökvägar, och att kedjan räcker till katalogen men aldrig går vidare
// efter MAX_LED.


test("resten efter ett avbrutet pass är exakt det som inte hann hämtas", () => {
  const ordning = katalog(10);
  assert.deepEqual(kvarEfterPass(ordning, { ok: 3, fel: 1 }), ordning.slice(4), "fel räknas som hämtade, de görs inte om");
  assert.deepEqual(kvarEfterPass(ordning, { ok: 10, fel: 0 }), []);
  assert.deepEqual(kvarEfterPass(ordning, { ok: 0, fel: 0 }), ordning, "ett pass som inte hann börja lämnar allt");
});

test("en säker slug är en produktsökväg och inget annat", () => {
  for (const ok of ["hundbadd-med-tak-76-cm-i-brun", "a", "kontorsstol-130-kg", "räksmörgås", "x".repeat(300)]) {
    assert.ok(arSakerSlug(ok), ok);
  }
  for (const fel of ["", "..", ".", "a/b", "../admin", "a?b=1", "a#b", "a b", "a\tb", "%2Fadmin", "a\\b", "x".repeat(301), 7, null]) {
    assert.ok(!arSakerSlug(fel), String(fel));
  }
});

test("ett led tas emot bara med giltigt led-nummer och säkra slugs", () => {
  assert.deepEqual(tolkaLed({ led: 1, kvar: ["a", "b"] }), { led: 1, kvar: ["a", "b"] });
  assert.deepEqual(tolkaLed({ led: MAX_LED, kvar: ["a"] }), { led: MAX_LED, kvar: ["a"] });
  for (const [namn, kropp] of [
    ["null", null],
    ["lista", [1, 2]],
    ["led 0", { led: 0, kvar: ["a"] }],
    ["led över taket", { led: MAX_LED + 1, kvar: ["a"] }],
    ["led som text", { led: "1", kvar: ["a"] }],
    ["led med decimaler", { led: 1.5, kvar: ["a"] }],
    ["tom lista", { led: 1, kvar: [] }],
    ["kvar som text", { led: 1, kvar: "a" }],
    ["osäker slug", { led: 1, kvar: ["a", "../admin"] }],
    ["en slug som inte är text", { led: 1, kvar: ["a", 3] }],
  ] as const) {
    assert.ok("fel" in tolkaLed(kropp), namn);
  }
});

test("ett led tar högst MAX_KVAR sidor", () => {
  assert.ok(!("fel" in tolkaLed({ led: 1, kvar: Array(MAX_KVAR).fill("a") })));
  assert.ok("fel" in tolkaLed({ led: 1, kvar: Array(MAX_KVAR + 1).fill("a") }));
});

/** Kör kedjan på låtsas: varje körning hinner `kapacitet` sidor. */
function kedja(n: number, kapacitet: number): { varmda: Set<string>; led: number; kvar: number } {
  const varmda = new Set<string>();
  const pass = (lista: readonly string[]) => {
    const gjorda = lista.slice(0, kapacitet);
    gjorda.forEach((s) => varmda.add(s));
    return { ok: gjorda.length, fel: 0, avbruten: gjorda.length < lista.length };
  };
  const ordning = katalog(n);
  let resultat = pass(ordning);
  let rest = kvarEfterPass(ordning, resultat);
  let led = 0;
  while (resultat.avbruten && led + 1 <= MAX_LED) {
    led++;
    const kropp = tolkaLed(JSON.parse(JSON.stringify({ led, kvar: rest })));
    assert.ok(!("fel" in kropp), "kroppen som kedjan själv bygger ska alltid tas emot");
    resultat = pass(kropp.kvar);
    rest = kvarEfterPass(kropp.kvar, resultat);
  }
  return { varmda, led, kvar: resultat.avbruten ? rest.length : 0 };
}

test("kedjan värmer hela katalogen från 2026-10-23", () => {
  // 1 824 sidor per körning, uppmätt 01:15 UTC. Leden har 200 s i stället för
  // 240 och räknas här lågt, till 1 400.
  const k = kedja(5092, 1400);
  assert.equal(k.varmda.size, 5092, "varje sida värms");
  assert.equal(k.kvar, 0);
  assert.ok(k.led <= 3, `fyra körningar räcker, fick ${k.led + 1}`);
});

test("kedjan stannar efter MAX_LED och säger hur många som blev kvar", () => {
  const kapacitet = 1000;
  const n = kapacitet * (MAX_LED + 1) + 500;
  const k = kedja(n, kapacitet);
  assert.equal(k.led, MAX_LED);
  assert.equal(k.kvar, 500);
  assert.equal(k.varmda.size, kapacitet * (MAX_LED + 1));
});


// ── Led 4 nekades (2026-11-06) ────────────────────────────────────────────
//
// Efter båda nattens deployer värmde led 1–3 som vanligt, men led 4 fick nej på
// varje sida direkt ("0/3736 (fel 3736)" och "0/2328 (fel 2328)") och sa sedan
// "katalogen klar". Taket är därför det djup som fungerade, och ett led får
// 700 s i stället för 200.

test("kedjan går aldrig djupare än tre led, det djup som fungerade 2026-11-06", () => {
  assert.ok(MAX_LED <= 3, `MAX_LED är ${MAX_LED}`);
  assert.ok(!("fel" in tolkaLed({ led: 3, kvar: ["a"] })));
  assert.ok("fel" in tolkaLed({ led: 4, kvar: ["a"] }), "ett led 4 tas aldrig emot");
});

test("tre led à 700 s räcker till katalogen från 2026-11-06", () => {
  // 6 016 produktsidor. Natten mot 2026-11-06 hann ett led 250–700 kalla sidor
  // på 200 s; på 700 s blir det ungefär 870–2 450. Räknat lågt till 1 600.
  const k = kedja(6016, 1600);
  assert.equal(k.varmda.size, 6016, "varje sida värms");
  assert.equal(k.kvar, 0);
  assert.ok(k.led <= MAX_LED);
});

test("ett pass där allt nekades är inte klart, ett pass med något värmt är det", () => {
  assert.equal(allaNekade({ ok: 0, fel: 3736 }), true, "led 4 natten mot 2026-11-06");
  assert.equal(allaNekade({ ok: 0, fel: 0 }), false, "ett tomt pass har inte nekats");
  assert.equal(allaNekade({ ok: 1, fel: 3735 }), false, "en enda värmd sida betyder att vägen fungerar");
});

test("felkoderna står i loggen, vanligast först", () => {
  assert.equal(felkoder({ "508": 2328 }), "508×2328");
  assert.equal(felkoder({ "0": 3, "508": 10, "500": 3 }), "508×10, 0×3, 500×3", "lika många i kodordning");
  assert.equal(felkoder({}), "");
});

test("rutten kallar aldrig ett nekat pass klart och loggar felkoderna", async () => {
  // Rutten drar in Next och går inte att köra här; kopplingen prövas i källan.
  const { readFile } = await import("node:fs/promises");
  const rutt = await readFile(new URL("../app/api/cron/varm-katalogen/route.ts", import.meta.url), "utf8");
  const led = rutt.slice(rutt.indexOf("export async function POST("));
  assert.ok(led.indexOf("allaNekade(pass)") > -1, "ledet prövar om allt nekades");
  assert.ok(led.indexOf("allaNekade(pass)") < led.indexOf("katalogen klar"), "före raden som säger att katalogen är klar");
  assert.ok(led.indexOf("allaNekade(pass)") < led.indexOf("startaLed("), "och innan nästa led startas");
  const kron = rutt.slice(rutt.indexOf("export async function GET("), rutt.indexOf("export async function POST("));
  assert.ok(kron.indexOf("allaNekade(varmning)") > -1 && kron.indexOf("allaNekade(varmning)") < kron.indexOf("startaLed("), "kronan startar ingen kedja på ett nekat pass");
  assert.match(rutt, /export const maxDuration = 800;/);
  assert.match(rutt, /felkoder\(pass\.koder\)/, "statuskoderna står i loggraden");
});
