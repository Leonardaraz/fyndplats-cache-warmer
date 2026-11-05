// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Medlemsnivån (specen, "Privat"). Talen är specens acceptanskriterier:
// E1-4 (365 dagar bakåt), E1-5 (gränserna), E1-6 (återbetalning samma dag,
// frakt räknas inte), E1-7 (ett köp faller ur), E1-9 (varningen en gång).
import test from "node:test";
import assert from "node:assert/strict";
import {
  REGLER_V1,
  beraknaK,
  bidrag,
  dagnummer,
  dagSomText,
  dagTillDatum,
  kronor,
  medManuellNiva,
  nivaFor,
  nivalage,
  nyNivaAttMeddela,
  reglerFel,
  stockholmsDag,
  stockholmsDatum,
  varningAttSkicka,
  type KPost,
} from "./niva.ts";

const idag = dagnummer("2026-11-04");
/** En betald order på dagen `dag` kl 12 svensk tid (11 UTC på vintern). */
const kop = (id: string, datum: string, varorOre: number, ater: { datum: string; ore: number }[] = []): KPost => ({
  orderId: id,
  ordernummer: id,
  betald: `${datum}T11:00:00.000Z`,
  raknas: true,
  varorOre,
  aterbetalningar: ater.map((a) => ({ tid: `${a.datum}T11:00:00.000Z`, varorOre: a.ore })),
});

test("E1-5: gränserna ligger exakt på specens belopp", () => {
  assert.equal(nivaFor(199_999, REGLER_V1).namn, "Brons");
  assert.equal(nivaFor(200_000, REGLER_V1).namn, "Silver");
  assert.equal(nivaFor(4_999_999, REGLER_V1).namn, "Diamant");
  assert.equal(nivaFor(5_000_000, REGLER_V1).namn, "VIP");
  assert.equal(nivaFor(0, REGLER_V1).namn, "Brons");
});

test("tabellen är specens: sex nivåer, 0–5 %", () => {
  assert.deepEqual(
    REGLER_V1.nivaer.map((n) => [n.namn, n.franOre / 100, n.rabattProcent]),
    [
      ["Brons", 0, 0],
      ["Silver", 2000, 1],
      ["Guld", 4000, 2],
      ["Platina", 7000, 3],
      ["Diamant", 20000, 4],
      ["VIP", 50000, 5],
    ],
  );
  assert.equal(reglerFel(REGLER_V1), null);
  assert.notEqual(reglerFel({ version: 2, nivaer: [{ namn: "A", franOre: 10, rabattProcent: 0 }] }), null);
  assert.notEqual(
    reglerFel({ version: 2, nivaer: [{ namn: "A", franOre: 0, rabattProcent: 0 }, { namn: "B", franOre: 0, rabattProcent: 1 }] }),
    null,
  );
});

test("dygnen räknas i svensk tid, inte i UTC", () => {
  // 23:30 UTC den 3 november är 00:30 svensk tid den 4 november.
  assert.equal(stockholmsDatum("2026-11-03T23:30:00.000Z"), "2026-11-04");
  assert.equal(stockholmsDag("2026-11-03T23:30:00.000Z"), idag);
  // Sommartid: 22:30 UTC den 30 juni är 00:30 den 1 juli.
  assert.equal(stockholmsDatum("2026-06-30T22:30:00.000Z"), "2026-07-01");
  assert.equal(dagTillDatum(idag), "2026-11-04");
  assert.equal(dagSomText(idag), "4 november 2026");
});

test("E1-4: ett köp räknas i 365 dagar; 365 och 366 dagar gamla räknas inte", () => {
  const dag364 = dagTillDatum(idag - 364);
  const dag365 = dagTillDatum(idag - 365);
  const dag366 = dagTillDatum(idag - 366);
  assert.equal(bidrag(kop("a", dag364, 10_000), idag), 10_000);
  assert.equal(bidrag(kop("b", dag365, 10_000), idag), 0);
  assert.equal(bidrag(kop("c", dag366, 10_000), idag), 0);
  // Ett köp i dag räknas, ett i morgon finns inte än.
  assert.equal(bidrag(kop("d", "2026-11-04", 10_000), idag), 10_000);
  assert.equal(bidrag(kop("e", "2026-11-05", 10_000), idag), 0);
});

test("avbrutna och obetalda ordrar räknas inte", () => {
  assert.equal(bidrag({ ...kop("a", "2026-11-01", 50_000), raknas: false }, idag), 0);
  const obetald: KPost = { orderId: "b", raknas: true, varorOre: 50_000, aterbetalningar: [] };
  assert.equal(bidrag(obetald, idag), 0);
});

test("E1-6: en återbetalning på 300 kr minskar K med 300 kr samma dag, inte dagen före", () => {
  const p = kop("a", "2026-10-01", 250_000, [{ datum: "2026-11-04", ore: 30_000 }]);
  assert.equal(beraknaK([p], idag - 1), 250_000);
  assert.equal(beraknaK([p], idag), 220_000);
  // Bara frakt: orderliggaren ger 0 kr i varuvärde, och K är oförändrat.
  const frakt = kop("b", "2026-10-01", 250_000, [{ datum: "2026-11-04", ore: 0 }]);
  assert.equal(beraknaK([frakt], idag), 250_000);
  // Aldrig under noll, ens om återbetalningarna skulle överstiga varorna.
  assert.equal(bidrag(kop("c", "2026-10-01", 10_000, [{ datum: "2026-10-02", ore: 50_000 }]), idag), 0);
});

test("E1-7: när det äldsta köpet faller ur sjunker K, och dagen syns i förväg", () => {
  const gammal = kop("gammal", "2025-11-20", 150_000); // faller ur 2026-11-20
  const ny = kop("ny", "2026-10-01", 100_000);
  const lage = nivalage([gammal, ny], idag, REGLER_V1);
  assert.equal(lage.kOre, 250_000);
  assert.equal(lage.niva.namn, "Silver");
  assert.equal(dagTillDatum(lage.aldstaFallerUr!), "2026-11-20");
  assert.ok(lage.sankning);
  assert.equal(dagTillDatum(lage.sankning.dag), "2026-11-20");
  assert.equal(lage.sankning.niva.namn, "Brons");
  assert.equal(lage.sankning.kOre, 100_000);
  // Dagen före räknas köpet, på dagen inte.
  assert.equal(beraknaK([gammal, ny], dagnummer("2026-11-19")), 250_000);
  assert.equal(beraknaK([gammal, ny], dagnummer("2026-11-20")), 100_000);
});

test("kvar till nästa nivå, och ingen nästa på VIP", () => {
  const silver = nivalage([kop("a", "2026-10-01", 234_500)], idag, REGLER_V1);
  assert.equal(silver.nasta?.niva.namn, "Guld");
  assert.equal(silver.nasta?.kvarOre, 165_500);
  const vip = nivalage([kop("a", "2026-10-01", 5_000_000)], idag, REGLER_V1);
  assert.equal(vip.niva.namn, "VIP");
  assert.equal(vip.nasta, null);
});

test("sänkningen prövas köp för köp: ett tidigt köp som inte räcker för att sänka ger ingen sänkning där", () => {
  const a = kop("a", "2025-11-20", 10_000); // faller ur 2026-11-20, Guld står kvar
  const b = kop("b", "2026-01-10", 150_000); // faller ur 2027-01-10 → Silver
  const c = kop("c", "2026-10-01", 300_000);
  const lage = nivalage([a, b, c], idag, REGLER_V1);
  assert.equal(lage.niva.namn, "Guld");
  assert.equal(dagTillDatum(lage.sankning!.dag), "2027-01-10");
  assert.equal(lage.sankning!.niva.namn, "Silver");
  assert.deepEqual(lage.raknade.map((r) => r.orderId), ["a", "b", "c"]);
});

test("E1-9: varningen skickas 14 dagar före, exakt en gång", () => {
  const gammal = kop("gammal", "2025-11-18", 150_000); // faller ur 2026-11-18, om 14 dagar
  const ny = kop("ny", "2026-10-01", 100_000);
  const lage = nivalage([gammal, ny], idag, REGLER_V1);
  const v = varningAttSkicka(lage, null);
  assert.deepEqual(v, { fran: "Silver", datum: "2026-11-18" });
  // Dagen efter: samma väntande sänkning, ingen ny varning.
  const imorgon = nivalage([gammal, ny], idag + 1, REGLER_V1);
  assert.equal(varningAttSkicka(imorgon, v), null);
  // 15 dagar före: för tidigt.
  const tidigt = nivalage([kop("g", "2025-11-19", 150_000), ny], idag, REGLER_V1);
  assert.equal(varningAttSkicka(tidigt, null), null);
  // En äldre varning vars datum passerat hindrar inte en ny sänkning.
  assert.ok(varningAttSkicka(lage, { fran: "Silver", datum: "2026-06-01" }));
});

test("ny nivå mejlas bara när nivån stigit över den senast meddelade", () => {
  const silver = nivalage([kop("a", "2026-10-01", 200_000)], idag, REGLER_V1);
  assert.equal(nyNivaAttMeddela(silver, "Brons", REGLER_V1), true);
  assert.equal(nyNivaAttMeddela(silver, "Silver", REGLER_V1), false);
  assert.equal(nyNivaAttMeddela(silver, "Guld", REGLER_V1), false);
  assert.equal(nyNivaAttMeddela(silver, null, REGLER_V1), true);
  const brons = nivalage([], idag, REGLER_V1);
  assert.equal(nyNivaAttMeddela(brons, null, REGLER_V1), false);
});

test("en nivå satt för hand gäller till och med sitt datum", () => {
  const lage = nivalage([kop("a", "2026-10-01", 50_000)], idag, REGLER_V1);
  const satt = medManuellNiva(lage, { namn: "Guld", tillDatum: "2026-12-31" }, REGLER_V1);
  assert.equal(satt.niva.namn, "Guld");
  assert.ok(satt.manuell);
  assert.equal(dagTillDatum(satt.sankning!.dag), "2027-01-01");
  assert.equal(satt.sankning!.niva.namn, "Brons");
  assert.equal(varningAttSkicka(satt, null), null);
  // Passerat datum: den räknade gäller.
  assert.equal(medManuellNiva(lage, { namn: "Guld", tillDatum: "2026-11-03" }, REGLER_V1).niva.namn, "Brons");
  // Okänd nivå ändrar ingenting.
  assert.equal(medManuellNiva(lage, { namn: "Okänd" }, REGLER_V1).niva.namn, "Brons");
});

test("kronor med hårda mellanslag", () => {
  assert.equal(kronor(199_999), "1 999,99 kr");
  assert.equal(kronor(200_000), "2 000 kr");
  assert.equal(kronor(0), "0 kr");
});

test("nattjobbets beslut: ny nivå mejlas, en sänkning följer med tyst, och ingenting skrivs utan ändring", async () => {
  const { medlemsbeslut, lageForMedlem } = await import("./niva.ts");
  const nuMs = Date.parse("2026-11-04T04:40:00.000Z");
  const nuIso = new Date(nuMs).toISOString();
  const guld = lageForMedlem(null, [kop("a", "2026-10-01", 450_000)], REGLER_V1, nuMs);
  // Höjning: mejl, men meddeladNiva sätts först när mejlet gått.
  const hoj = medlemsbeslut({ kOre: 250_000, niva: "Silver", meddeladNiva: "Silver" }, guld, REGLER_V1, nuIso);
  assert.equal(hoj.nyNiva, true);
  assert.deepEqual(hoj.falt, { kOre: 450_000, niva: "Guld", beraknad: nuIso });
  // Oförändrat: inga fält, inga mejl.
  const lika = medlemsbeslut({ kOre: 450_000, niva: "Guld", meddeladNiva: "Guld" }, guld, REGLER_V1, nuIso);
  assert.deepEqual(lika, { falt: {}, nyNiva: false, varning: null });
  // Sänkning: inget mejl i efterhand, meddeladNiva följer med ned.
  const brons = lageForMedlem(null, [], REGLER_V1, nuMs);
  const sank = medlemsbeslut({ kOre: 450_000, niva: "Guld", meddeladNiva: "Guld" }, brons, REGLER_V1, nuIso);
  assert.equal(sank.nyNiva, false);
  assert.equal(sank.falt.meddeladNiva, "Brons");
  // En nivå satt för hand gäller före den räknade.
  const satt = lageForMedlem({ manuellNiva: "VIP" }, [], REGLER_V1, nuMs);
  assert.equal(satt.niva.namn, "VIP");
});
