// Företagsprofilen (lib/medlem/foretag.ts): ansökan, villkorsversion och profilens läge.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  VILLKOR_FORETAG_VERSION,
  foretagsprofilId,
  foretagsprofilUrRad,
  foretagsstatusText,
  kanHandlaSomForetag,
  postnrText,
  provaForetagsansokan,
  type Foretagsprofil,
} from "./foretag.ts";
import { orgnrFeltext, provaOrgnr } from "./orgnr.ts";
import { readFileSync } from "node:fs";
import { AVGIFT_PROCENT, POSTA_INOM_DAGAR } from "../retur-policy.ts";
import { PAKET_MAX_KG, PAKET_MAX_SIDA_CM, SKRYMMANDE_SPANN } from "../retur-frakt.ts";

const ORG = { prova: provaOrgnr, feltext: orgnrFeltext };

/** Ett giltigt aktiebolag (Luhn) och ett giltigt personnummer (enskild firma). */
const AB = "556012-5790";
const PNR = "811218-9876";

function form(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    namn: "Byggbolaget i Norr AB",
    orgnr: AB,
    gata: "Storgatan 1",
    postnr: "123 45",
    ort: "Umeå",
    naring: "1",
    villkor: VILLKOR_FORETAG_VERSION,
    ...over,
  };
}

test("en fullständig ansökan från ett aktiebolag godtas och numret sparas med bindestreck", () => {
  const p = provaForetagsansokan(form({ orgnr: "5560125790" }), ORG);
  assert.equal(p.ok, true);
  if (!p.ok) return;
  assert.deepEqual(p.ansokan, {
    namn: "Byggbolaget i Norr AB",
    orgnr: AB,
    orgnrVisas: AB,
    form: "juridisk",
    faktura: { gata: "Storgatan 1", postnr: "12345", ort: "Umeå" },
    villkorVersion: VILLKOR_FORETAG_VERSION,
  });
});

test("en enskild firma godtas (F4) och numret visas bara maskerat", () => {
  const p = provaForetagsansokan(form({ orgnr: PNR, namn: "Anna Svensson Snickeri" }), ORG);
  assert.equal(p.ok, true);
  if (!p.ok) return;
  assert.equal(p.ansokan.form, "enskild");
  assert.equal(p.ansokan.orgnr, PNR);
  assert.equal(p.ansokan.orgnrVisas, "******-9876");
});

test("E3-1: fel kontrollsiffra avvisas med orgnr.ts egen text", () => {
  const p = provaForetagsansokan(form({ orgnr: "556012-5791" }), ORG);
  assert.equal(p.ok, false);
  if (p.ok) return;
  assert.equal(p.fel.orgnr, orgnrFeltext("kontrollsiffra"));
});

test("E3-12: utan godkända villkor, eller med en annan version, går ansökan inte igenom", () => {
  for (const villkor of [undefined, "", "0", "2"]) {
    const p = provaForetagsansokan(form({ villkor }), ORG);
    assert.equal(p.ok, false, `villkor=${String(villkor)}`);
    if (!p.ok) assert.ok(p.fel.villkor);
  }
});

test("näringsverksamhet måste kryssas i", () => {
  const p = provaForetagsansokan(form({ naring: undefined }), ORG);
  assert.equal(p.ok, false);
  if (!p.ok) assert.ok(p.fel.naring);
  assert.equal(provaForetagsansokan(form({ naring: "on" }), ORG).ok, true);
});

test("fel i adressen pekas ut fält för fält", () => {
  const p = provaForetagsansokan(form({ gata: "", postnr: "1234", ort: "1" }), ORG);
  assert.equal(p.ok, false);
  if (p.ok) return;
  assert.deepEqual(Object.keys(p.fel).sort(), ["gata", "ort", "postnr"]);
  assert.equal(provaForetagsansokan(form({ postnr: "01234" }), ORG).ok, false, "inga svenska postnummer börjar på 0");
});

test("en annan leveransadress prövas bara när rutan är ikryssad", () => {
  assert.equal(provaForetagsansokan(form({ lgata: "", lpostnr: "x" }), ORG).ok, true);
  const fel = provaForetagsansokan(form({ annanLeverans: "1", lgata: "Lagervägen 4", lpostnr: "x", lort: "Luleå" }), ORG);
  assert.equal(fel.ok, false);
  if (!fel.ok) assert.deepEqual(Object.keys(fel.fel), ["lpostnr"]);
  const ok = provaForetagsansokan(form({ annanLeverans: "1", lgata: "Lagervägen 4", lpostnr: "97234", lort: "Luleå" }), ORG);
  assert.equal(ok.ok, true);
  if (ok.ok) assert.deepEqual(ok.ansokan.leverans, { gata: "Lagervägen 4", postnr: "97234", ort: "Luleå" });
});

test("namnet rensas från kontrolltecken och vinkelparenteser, och för långa namn avvisas", () => {
  const p = provaForetagsansokan(form({ namn: "  Bygg<script>  AB\n" }), ORG);
  assert.equal(p.ok, true);
  if (p.ok) assert.equal(p.ansokan.namn, "Bygg script AB");
  assert.equal(provaForetagsansokan(form({ namn: "A".repeat(101) }), ORG).ok, false);
  assert.equal(provaForetagsansokan(form({ namn: "12" }), ORG).ok, false, "ett namn utan bokstäver");
});

function profil(over: Partial<Foretagsprofil> = {}): Foretagsprofil {
  return {
    medlemsId: "m_" + "a".repeat(40),
    status: "aktiv",
    namn: "Byggbolaget i Norr AB",
    orgnr: AB,
    orgnrVisas: AB,
    form: "juridisk",
    faktura: { gata: "Storgatan 1", postnr: "12345", ort: "Umeå" },
    villkorVersion: VILLKOR_FORETAG_VERSION,
    villkorGodkant: "2026-11-04T20:00:00.000Z",
    ansokt: "2026-11-04T20:00:00.000Z",
    ...over,
  };
}

test("bara en godkänd profil med gällande villkor får handla som företag (E3-12)", () => {
  assert.equal(kanHandlaSomForetag(profil()), true);
  assert.equal(kanHandlaSomForetag(profil({ status: "granskas" })), false);
  assert.equal(kanHandlaSomForetag(profil({ status: "nekad" })), false);
  assert.equal(kanHandlaSomForetag(profil({ villkorVersion: "0" })), false);
  assert.equal(kanHandlaSomForetag(null), false);
});

test("raden läses tillbaka, och en privat rad eller en trasig rad blir null", () => {
  const p = profil({ leverans: { gata: "Lagervägen 4", postnr: "97234", ort: "Luleå" } });
  const rad = { _id: foretagsprofilId(p.medlemsId), typ: "foretag", ...p };
  assert.deepEqual(foretagsprofilUrRad(rad), p);
  assert.equal(foretagsprofilUrRad({ ...rad, typ: "privat" }), null);
  assert.equal(foretagsprofilUrRad({ ...rad, status: "okand" }), null);
  assert.equal(foretagsprofilUrRad({ ...rad, faktura: { gata: "x" } }), null);
  assert.equal(foretagsprofilUrRad(null), null);
  assert.equal(foretagsprofilId("m_1"), "m_1__foretag");
});

test("postnumret skrivs med mellanslag, och statustexten följer läget", () => {
  assert.equal(postnrText("12345"), "123 45");
  assert.equal(postnrText("x"), "x");
  assert.match(foretagsstatusText(profil({ status: "granskas" })), /kontrollerar/);
  assert.match(foretagsstatusText(profil({ status: "nekad" })), /kunde inte godkänna/);
  assert.match(foretagsstatusText(profil({ villkorVersion: "0" })), /ändrats/);
  assert.match(foretagsstatusText(profil()), /Godkänt/);
});

test("☠️ företagsvillkoren: talen i returpunkten hör till versionen", () => {
  // /villkor/foretag tar avgiften, postningsfristen och skrymmandegränserna ur
  // samma konstanter som konsumentvillkoren. Ändras en av dem ändras avtalet,
  // och då ska VILLKOR_FORETAG_VERSION höjas, så att varje företag godkänner
  // den nya texten innan kontot prissätts som företag igen. Höj versionen och
  // skriv in de nya talen här i samma ändring.
  assert.equal(VILLKOR_FORETAG_VERSION, "1");
  assert.deepEqual(
    { AVGIFT_PROCENT, POSTA_INOM_DAGAR, PAKET_MAX_SIDA_CM, PAKET_MAX_KG, SKRYMMANDE_SPANN },
    { AVGIFT_PROCENT: 10, POSTA_INOM_DAGAR: 7, PAKET_MAX_SIDA_CM: 120, PAKET_MAX_KG: 20, SKRYMMANDE_SPANN: "500–5 000 kr" },
  );
});

test("företagsvillkoren har inga luckor kvar", () => {
  // Utkastet hade hakparenteser där Leonard skulle fylla i (svar 3.2,
  // 2026-11-05). En lucka som står kvar är ett villkor utan innehåll.
  const sida = readFileSync(new URL("../../app/villkor/foretag/page.tsx", import.meta.url), "utf8");
  const dok = readFileSync(new URL("../../docs/medlemskap-foretagsvillkor-utkast.md", import.meta.url), "utf8");
  const lucka = /\[(datum|ort|bolagsnamn|nummer|\d+|två år)\]/i;
  assert.doesNotMatch(sida, lucka);
  assert.doesNotMatch(dok, lucka);
  assert.doesNotMatch(sida, /utkast\. Gäller från/i);
});
