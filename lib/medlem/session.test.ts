// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Sessionen: HS256 med en egen hemlighet, 90 dagar, förnyas efter ett dygn.
import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { SESSION_DAGAR, behoverFornyas, kakaAttribut, lasSession, nySession, signera, teckenVarde } from "./session.ts";
import { delnyckel } from "./inloggning.ts";

const H = "test-hemlighet-som-bara-finns-i-provet";
const NU = Date.parse("2026-11-04T12:00:00.000Z");
const ID = "m_0123456789abcdef0123456789abcdef01234567";

test("en ny session läses tillbaka och gäller i 90 dagar", () => {
  const { token, maxAgeS } = nySession(ID, "kund@example.se", NU, H);
  assert.equal(maxAgeS, SESSION_DAGAR * 86_400);
  const s = lasSession(token, H, NU);
  assert.ok(s);
  assert.equal(s.sub, ID);
  assert.equal(s.email, "kund@example.se");
  assert.ok(lasSession(token, H, NU + (SESSION_DAGAR * 86_400 - 1) * 1000));
  assert.equal(lasSession(token, H, NU + SESSION_DAGAR * 86_400 * 1000), null);
});

test("fel hemlighet, ändrad last, alg none och skräp avvisas", () => {
  const { token } = nySession(ID, "kund@example.se", NU, H);
  assert.equal(lasSession(token, "en-annan", NU), null);
  assert.equal(lasSession(token, "", NU), null);
  const [h, , sig] = token.split(".");
  const falsk = Buffer.from(JSON.stringify({ sub: ID, email: "annan@example.se", typ: "medlem", iat: 1, exp: 9e9 })).toString("base64url");
  assert.equal(lasSession(`${h}.${falsk}.${sig}`, H, NU), null);
  const none = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  assert.equal(lasSession(`${none}.${falsk}.`, H, NU), null);
  assert.equal(lasSession("skräp", H, NU), null);
  assert.equal(lasSession(null, H, NU), null);
});

test("en token från appens inloggning (AUTH_JWT_SECRET-formen) blir ingen medlemssession", () => {
  // Samma hemlighet men utan delnyckeln och utan typ: avvisas.
  const huvud = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const last = Buffer.from(JSON.stringify({ email: "kund@example.se", exp: 9e9 })).toString("base64url");
  const sig = createHmac("sha256", H).update(`${huvud}.${last}`).digest("base64url");
  assert.equal(lasSession(`${huvud}.${last}.${sig}`, H, NU), null);
});

test("sessionens nyckel är densamma som inloggningens delnyckel för sessionen", () => {
  const s = { sub: ID, email: "kund@example.se", typ: "medlem" as const, iat: 1, exp: 2 };
  const token = signera(s, H);
  const [h, l] = token.split(".");
  const sig = createHmac("sha256", delnyckel(H, "session")).update(`${h}.${l}`).digest("base64url");
  assert.equal(token.split(".")[2], sig);
});

test("förnyas efter ett dygn, inte före", () => {
  const { token } = nySession(ID, "kund@example.se", NU, H);
  const s = lasSession(token, H, NU)!;
  assert.equal(behoverFornyas(s, NU + 23 * 3_600_000), false);
  assert.equal(behoverFornyas(s, NU + 24 * 3_600_000), true);
});

test("kakan är httpOnly, Lax och gäller hela sajten", () => {
  assert.deepEqual(kakaAttribut(60), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 });
  assert.equal(kakaAttribut(60, false).secure, false);
});

test("E3: profilvalet företag följer med i token, och allt annat än \"foretag\" läses som privat", () => {
  const f = lasSession(nySession(ID, "kund@example.se", NU, H, "foretag").token, H, NU);
  assert.equal(f?.profil, "foretag");
  const p = lasSession(nySession(ID, "kund@example.se", NU, H).token, H, NU);
  assert.ok(p);
  assert.equal("profil" in p, false, "en privat session bär inget profilfält");
  const konstig = signera({ sub: ID, email: "kund@example.se", typ: "medlem", profil: "admin" as unknown as "foretag", iat: NU / 1000, exp: NU / 1000 + 60 }, H);
  assert.equal(lasSession(konstig, H, NU)?.profil, undefined);
  assert.equal(teckenVarde("foretag"), "f");
  assert.equal(teckenVarde("privat"), "1");
  assert.equal(teckenVarde(undefined), "1");
});
