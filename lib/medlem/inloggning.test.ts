// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Inloggningen utan lösenord: länk och sexsiffrig kod, 15 minuter, fem försök.
import test from "node:test";
import assert from "node:assert/strict";
import {
  GILTIG_MS,
  MAX_KODFORSOK,
  farSkicka,
  hashaToken,
  ipNyckel,
  medlemsId,
  normaliseraEpost,
  nyInloggning,
  provaKod,
  provaLank,
  sakertMal,
  stadaKod,
  type Inloggningsrad,
} from "./inloggning.ts";

const HEMLIGHET = "test-hemlighet-som-bara-finns-i-provet";
const NU = Date.parse("2026-11-04T12:00:00.000Z");

function rad(over: Partial<Inloggningsrad> = {}) {
  const ny = nyInloggning("kund@example.se", NU, HEMLIGHET);
  const r: Inloggningsrad = { epost: "kund@example.se", skapad: ny.skapad, giltigTill: ny.giltigTill, kodHash: ny.kodHash, forsok: 0, ...over };
  return { ny, r };
}

test("e-posten normaliseras och orimliga adresser avvisas", () => {
  assert.equal(normaliseraEpost(" Kund@Example.SE "), "kund@example.se");
  for (const fel of ["", "kund", "kund@", "@example.se", "kund@example", "a b@example.se", 42, null, `${"a".repeat(250)}@example.se`]) {
    assert.equal(normaliseraEpost(fel), null, String(fel));
  }
});

test("medlemmens id är stabilt, unikt per e-post och visar inte adressen", () => {
  const a = medlemsId("kund@example.se");
  assert.equal(a, medlemsId("kund@example.se"));
  assert.notEqual(a, medlemsId("kund2@example.se"));
  assert.match(a, /^m_[0-9a-f]{40}$/);
  assert.ok(!a.includes("kund"));
});

test("koden är sex siffror, och varken koden eller token sparas i klartext", () => {
  const { ny, r } = rad();
  assert.match(ny.kod, /^\d{6}$/);
  assert.equal(ny.tokenHash, hashaToken(ny.token));
  assert.ok(!JSON.stringify(r).includes(ny.kod));
  assert.ok(!JSON.stringify(r).includes(ny.token));
  assert.equal(Date.parse(ny.giltigTill) - NU, GILTIG_MS);
});

test("rätt kod går in, fel kod inte, och koden är bunden till e-posten", () => {
  const { ny, r } = rad();
  assert.equal(provaKod(r, ny.kod, NU + 60_000, HEMLIGHET), "ok");
  const annan = ny.kod === "000000" ? "000001" : "000000";
  assert.equal(provaKod(r, annan, NU, HEMLIGHET), "fel-kod");
  assert.equal(provaKod({ ...r, epost: "annan@example.se" }, ny.kod, NU, HEMLIGHET), "fel-kod");
  assert.equal(provaKod(r, ny.kod, NU, "en-annan-hemlighet"), "fel-kod");
});

test("koden dör efter 15 minuter, efter fem fel och när den använts", () => {
  const { ny, r } = rad();
  assert.equal(provaKod(r, ny.kod, NU + GILTIG_MS, HEMLIGHET), "utgangen");
  assert.equal(provaKod({ ...r, forsok: MAX_KODFORSOK }, ny.kod, NU, HEMLIGHET), "for-manga-forsok");
  assert.equal(provaKod({ ...r, anvand: new Date(NU).toISOString() }, ny.kod, NU, HEMLIGHET), "anvand");
  assert.equal(provaLank(r, NU), "ok");
  assert.equal(provaLank(r, NU + GILTIG_MS), "utgangen");
  assert.equal(provaLank({ ...r, anvand: "x" }, NU), "anvand");
});

test("koden får skrivas med mellanslag eller bindestreck", () => {
  assert.equal(stadaKod("123 456"), "123456");
  assert.equal(stadaKod("123-456"), "123456");
  assert.equal(stadaKod("12345"), null);
  assert.equal(stadaKod("abcdef"), null);
});

test("högst fem koder i timmen per e-post, tjugo per adress, och 30 sekunder emellan", () => {
  const nyss = new Date(NU - 10_000).toISOString();
  assert.equal(farSkicka({ senasteTimmenEpost: 0, senasteTimmenIp: 0, senasteSkapad: null }, NU), "ok");
  assert.equal(farSkicka({ senasteTimmenEpost: 1, senasteTimmenIp: 1, senasteSkapad: nyss }, NU), "for-tatt");
  assert.equal(farSkicka({ senasteTimmenEpost: 5, senasteTimmenIp: 5, senasteSkapad: null }, NU), "for-manga");
  assert.equal(farSkicka({ senasteTimmenEpost: 0, senasteTimmenIp: 20, senasteSkapad: null }, NU), "for-manga");
});

test("ip-nyckeln är en hash, och målet efter inloggningen stannar på sajten", () => {
  assert.match(ipNyckel("192.0.2.1", HEMLIGHET), /^[0-9a-f]{32}$/);
  assert.equal(sakertMal("/konto"), "/konto");
  assert.equal(sakertMal("//evil.example"), "/konto");
  assert.equal(sakertMal("https://evil.example"), "/konto");
  assert.equal(sakertMal("/\\evil"), "/konto");
  assert.equal(sakertMal(undefined), "/konto");
});

test("token, order-id och den maskerade adressen", async () => {
  const { arToken, orderGuid, maskeradEpost } = await import("./inloggning.ts");
  assert.equal(arToken(nyInloggning("kund@example.se", NU, HEMLIGHET).token), true);
  assert.equal(arToken("kort"), false);
  assert.equal(arToken("a".repeat(43) + "/"), false);
  assert.equal(orderGuid("1DE22A36-70DE-41F1-9CA7-3395759AAFBE"), "1de22a36-70de-41f1-9ca7-3395759aafbe");
  assert.equal(orderGuid("20001"), null);
  assert.equal(maskeradEpost("kund@example.se"), "k•••@example.se");
});
