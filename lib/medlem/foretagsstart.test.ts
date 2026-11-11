// Den direkta vägen till ett företagskonto (lib/medlem/foretagsstart.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FORETAGSVAG,
  STEG,
  efterInloggning,
  foretagsvag,
  klartext,
  stegLage,
  trappmening,
  trappspann,
  trappsteg,
  utvag,
  visaForetagsvag,
} from "./foretagsstart.ts";
import { ORDERTRAPPA } from "./pris.ts";
import { sakertMal } from "./inloggning.ts";

const las = (f: string) => readFileSync(new URL(f, import.meta.url), "utf8");

test("utloggad: vägen visas bara när medlemskontot är öppet och prisväxeln står på pa", () => {
  assert.equal(foretagsvag({ oppen: true, prisPa: true, inloggad: false }), "start");
  // Läget test: en besökare hade skapat ett konto och mötts av "inte öppnat än" i steg 2.
  assert.equal(foretagsvag({ oppen: true, prisPa: false, inloggad: false }), "privat");
  assert.equal(foretagsvag({ oppen: false, prisPa: true, inloggad: false }), "privat");
  assert.equal(visaForetagsvag(true, true), true);
  assert.equal(visaForetagsvag(true, false), false);
  assert.equal(visaForetagsvag(false, true), false);
});

test("inloggad utan företag: steg 2 direkt, också för en testare i läget test", () => {
  assert.equal(foretagsvag({ oppen: true, prisPa: true, inloggad: true, oppetForMedlem: true, foretag: null }), "uppgifter");
  assert.equal(foretagsvag({ oppen: true, prisPa: false, inloggad: true, oppetForMedlem: true, foretag: null }), "uppgifter");
  // Växeln släpper inte fram medlemmen: /konto visar Mina sidor utan företagsrutan.
  assert.equal(foretagsvag({ oppen: true, prisPa: false, inloggad: true, oppetForMedlem: false, foretag: null }), "privat");
  assert.equal(foretagsvag({ oppen: true, prisPa: true, inloggad: true, foretag: null }), "privat");
});

test("ett konto som redan har ett företag sköter det på Mina sidor, vilket läge det än har", () => {
  for (const foretag of ["granskas", "aktiv", "nekad"] as const) {
    assert.equal(foretagsvag({ oppen: true, prisPa: true, inloggad: true, oppetForMedlem: true, foretag }), "mina-sidor");
    // Också när växeln stängts efteråt: företaget finns kvar och syns på Mina sidor.
    assert.equal(foretagsvag({ oppen: true, prisPa: false, inloggad: true, oppetForMedlem: false, foretag }), "mina-sidor");
  }
  assert.equal(utvag("mina-sidor"), "/konto#foretag");
  assert.equal(utvag("privat"), "/konto");
});

test("efter inloggningen i steg 1: vidare till steg 2 bara när servern säger att kontot saknar företag och är öppet", () => {
  assert.equal(efterInloggning({ ok: true, oppet: true, foretag: null }), "uppgifter");
  assert.equal(efterInloggning({ ok: true, oppet: true, foretag: "aktiv" }), "mina-sidor");
  assert.equal(efterInloggning({ ok: true, oppet: true, foretag: "granskas" }), "mina-sidor");
  assert.equal(efterInloggning({ ok: true, oppet: false, foretag: "nekad" }), "mina-sidor");
  assert.equal(efterInloggning({ ok: true, oppet: false, foretag: null }), "privat");
  // Ett svar som inte går att lita på lämnar vägen, hellre än ett formulär som nekas.
  assert.equal(efterInloggning(null), "privat");
  assert.equal(efterInloggning({ ok: false, oppet: true, foretag: null }), "privat");
  assert.equal(efterInloggning({ ok: true, oppet: "ja", foretag: null }), "privat");
});

test("vägens adress är ett godkänt mål efter inloggningen, så att länken i mejlet också landar där", () => {
  assert.equal(FORETAGSVAG, "/konto/foretag");
  assert.equal(sakertMal(FORETAGSVAG), FORETAGSVAG);
});

test("stegraden: gjorda steg är klara, och sista steget är klart när man står på det", () => {
  assert.deepEqual([...STEG], ["E-post", "Företaget", "Klart"]);
  assert.deepEqual([0, 1, 2].map((i) => stegLage(i, 0)), ["nu", "sen", "sen"]);
  assert.deepEqual([0, 1, 2].map((i) => stegLage(i, 1)), ["klar", "nu", "sen"]);
  assert.deepEqual([0, 1, 2].map((i) => stegLage(i, 2)), ["klar", "klar", "klar"]);
});

test("ordertrappans bild läser prismotorns tabell: samma gränser och procent som kassan", () => {
  const steg = trappsteg(ORDERTRAPPA);
  const medRabatt = ORDERTRAPPA.filter((s) => s.procent > 0);
  assert.equal(steg.length, medRabatt.length);
  steg.forEach((s, i) => {
    assert.equal(s.procent, medRabatt[i].procent);
    assert.equal(s.kr * 100, medRabatt[i].franOreExMoms);
  });
  // Dagens tabell: 1 % från 5 000 kr till 5 % från 50 000 kr, med hårda mellanslag.
  assert.deepEqual(steg.map((s) => s.text), ["5\u00a0000\u00a0kr", "10\u00a0000\u00a0kr", "20\u00a0000\u00a0kr", "30\u00a0000\u00a0kr", "50\u00a0000\u00a0kr"]);
  assert.deepEqual(steg.map((s) => s.procent), [1, 2, 3, 4, 5]);
  // Beloppet utan enhet är samma tal: de smalaste skärmarna visar bara det.
  for (const s of steg) assert.equal(`${s.tal}\u00a0kr`, s.text);
  // Staplarna växer i jämna steg och den sista är full höjd.
  assert.deepEqual(steg.map((s) => s.hojd), [0.2, 0.4, 0.6, 0.8, 1]);
  assert.equal(trappmening(ORDERTRAPPA), "Ordertrappan: 1\u00a0% från 5\u00a0000\u00a0kr, 2\u00a0% från 10\u00a0000\u00a0kr, 3\u00a0% från 20\u00a0000\u00a0kr, 4\u00a0% från 30\u00a0000\u00a0kr, 5\u00a0% från 50\u00a0000\u00a0kr, räknat exklusive moms.");
  // En tabell utan rabattsteg ger ingen bild och ingen mening.
  assert.deepEqual(trappsteg([{ franOreExMoms: 0, procent: 0 }]), []);
  assert.equal(trappmening([{ franOreExMoms: 0, procent: 0 }]), "");
  // Företagskortets rad kommer ur samma tabell som staplarna.
  assert.equal(trappspann(ORDERTRAPPA), "1–5\u00a0%");
  assert.equal(trappspann([{ franOreExMoms: 0, procent: 0 }, { franOreExMoms: 100, procent: 3 }]), "3\u00a0%");
  assert.equal(trappspann([{ franOreExMoms: 0, procent: 0 }]), "");
});

test("sista steget: godkänt och växlat, godkänt utan växling, och under granskning", () => {
  const vaxlat = klartext({ status: "aktiv", namn: " Exempelbolaget AB ", somForetag: true });
  assert.equal(vaxlat.rubrik, "Exempelbolaget AB är godkänt");
  assert.match(vaxlat.text, /handlar nu som företaget/);
  assert.match(vaxlat.text, /exklusive moms/);
  assert.deepEqual(vaxlat.knappar[0], { text: "Börja handla", href: "/butik" });

  // Profilbytet svarade inte: sidan får inte påstå att priserna redan visas exklusive moms.
  const inteVaxlat = klartext({ status: "aktiv", namn: "Exempelbolaget AB", somForetag: false });
  assert.doesNotMatch(inteVaxlat.text, /handlar nu som företaget/);
  assert.match(inteVaxlat.text, /Du handlar som/);
  assert.deepEqual(inteVaxlat.knappar[0], { text: "Till Mina sidor", href: "/konto#foretag" });

  const granskas = klartext({ status: "granskas", namn: "Exempelbolaget AB", somForetag: false });
  assert.doesNotMatch(granskas.rubrik, /godkänt/);
  assert.match(granskas.text, /mejlar dig när det är godkänt/);
  assert.match(granskas.text, /handla som privatperson/);
  assert.deepEqual(granskas.knappar[0], { text: "Till Mina sidor", href: "/konto#foretag" });

  // Utan namn står det ändå en hel rubrik.
  assert.equal(klartext({ status: "aktiv", somForetag: true }).rubrik, "Företaget är godkänt");
});

test("sidorna hänger ihop: /konto visar växeln, vägen har ett eget mål och stegen ritar sig ur modulen", () => {
  const konto = las("../../app/konto/page.tsx");
  const vag = las("../../app/konto/foretag/page.tsx");
  const start = las("../../app/konto/foretag-start.tsx");
  const rutt = las("../../app/api/konto/foretag/route.ts");
  // /konto: växeln och raden syns bara när vägen är öppen.
  assert.match(konto, /visaForetagsvag\(/);
  assert.match(konto, /<Kontotyp aktiv="privat" \/>/);
  // Vägen: aldrig i ISR-cachen, aldrig i index, och den lämnas med redirect.
  assert.match(vag, /export const dynamic = "force-dynamic";/);
  assert.match(vag, /robots: \{ index: false, follow: false \}/);
  assert.match(vag, /foretagsvag\(/);
  assert.match(vag, /redirect\(utvag\(/);
  // Steg 1 loggar in med vägen som mål, så att länken i mejlet också landar där.
  assert.match(start, /mal=\{FORETAGSVAG\}/);
  // Läget efter inloggningen frågas på servern, och svaret tolkas av modulen.
  assert.match(start, /steg: "lage"/);
  assert.match(start, /efterInloggning\(/);
  // Rutten svarar på läget FÖRE prisväxelns spärr: annars hade ett stängt konto gett 403 i stället för ett besked.
  assert.ok(rutt.indexOf('kropp.steg === "lage"') > 0, "rutten saknar steget lage");
  assert.ok(rutt.indexOf('kropp.steg === "lage"') < rutt.indexOf('skal: "stangt"'), "läget måste besvaras före spärren");
});
