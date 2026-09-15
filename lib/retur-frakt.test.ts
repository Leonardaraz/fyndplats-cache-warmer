// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Två sorters prov i samma fil, båda kring samma paragraf.
//
// 1) BETEENDET hos arSkrymmande(). Gränsen avgör vilka produkter som får
//    kostnadsupplysningen enligt 2 kap. 2 § första stycket 11, och ett fel åt
//    fel håll flyttar returkostnaden till oss enligt 13 § första stycket.
//
// 2) EN REPO-BRED GRIND mot att någon text erbjuder sig att hämta varan. 2 kap.
//    13 § andra stycket: den som erbjuder sig att hämta ska hämta PÅ EGEN
//    BEKOSTNAD, och 1 kap. 4 § gör varje villkor som säger annat utan verkan.
//    Vi står rent idag — men det är en mening bort från att inte göra det, och
//    den meningen skulle kosta pengar utan att någon märkte något.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  arSkrymmande,
  PAKET_MAX_KG,
  PAKET_MAX_SIDA_CM,
  SKRYMMANDE_REGEL,
  SKRYMMANDE_RETURKOSTNAD,
  SKRYMMANDE_RETURKOSTNAD_KORT,
  KALLA,
  KALLA_DATUM,
} from "./retur-frakt.ts";

test("paketgods är inte skrymmande", () => {
  assert.equal(arSkrymmande({ langstaSidaCm: 60, viktKg: 5 }), false);
});

test("gränsvärdet självt ryms som paket", () => {
  // 120 cm och 20 kg ÄR postbara — det är över gränsen som det brister.
  assert.equal(
    arSkrymmande({ langstaSidaCm: PAKET_MAX_SIDA_CM, viktKg: PAKET_MAX_KG }),
    false,
  );
});

test("en centimeter över gränsen är skrymmande", () => {
  assert.equal(arSkrymmande({ langstaSidaCm: PAKET_MAX_SIDA_CM + 1, viktKg: 5 }), true);
});

test("vikten ensam kan göra varan skrymmande", () => {
  // En 30 kg:s kompakt vara är inte lång, men en privatperson kan inte posta
  // den. Hade vi bara mätt längden hade den klassats som paketgods.
  assert.equal(arSkrymmande({ langstaSidaCm: 40, viktKg: PAKET_MAX_KG + 1 }), true);
});

test("okänt mått räknas som skrymmande", () => {
  // Den säkra riktningen: att upplysa i onödan kostar ingenting, att låta bli
  // flyttar returkostnaden till oss.
  assert.equal(arSkrymmande({}), true);
  assert.equal(arSkrymmande({ langstaSidaCm: null, viktKg: null }), true);
  assert.equal(arSkrymmande({ langstaSidaCm: 0, viktKg: 0 }), true);
});

test("skräpvärden faller åt det säkra hållet", () => {
  assert.equal(arSkrymmande({ langstaSidaCm: NaN, viktKg: NaN }), true);
  assert.equal(arSkrymmande({ langstaSidaCm: -5, viktKg: -1 }), true);
  assert.equal(arSkrymmande({ langstaSidaCm: Infinity, viktKg: 5 }), true);
  assert.equal(arSkrymmande({ langstaSidaCm: 40, viktKg: NaN }), true);
});

test("halva uppgiften friskriver inte varan", () => {
  // Första versionen av modulen lät ett känt och lågt mått räcka. Provet nedan
  // är vad som avslöjade felet: en femkilosvara kan vara en tre meter lång
  // gardinstång, så en låg vikt säger ingenting om längden. Saknas ettdera
  // måttet är varan skrymmande tills motsatsen är mätt.
  assert.equal(arSkrymmande({ viktKg: 5 }), true);
  assert.equal(arSkrymmande({ langstaSidaCm: 40 }), true);
  assert.equal(arSkrymmande({ viktKg: 40 }), true);
  assert.equal(arSkrymmande({ langstaSidaCm: 40, viktKg: 5 }), false);
});

test("kostnadsupplysningen bär både regeln och ett belopp", () => {
  // Utan belopp är meningen inte den upplysning 2 § första stycket 11 kräver,
  // och då bär vi kostnaden enligt 13 § första stycket. Provet finns för att en
  // framtida omskrivning inte ska kunna "förenkla bort" siffran.
  for (const t of [SKRYMMANDE_RETURKOSTNAD, SKRYMMANDE_RETURKOSTNAD_KORT]) {
    assert.match(t, /\d[\d\s]*–[\d\s]*\d\s*kr/, `saknar belopp: ${t}`);
    assert.match(t, new RegExp(`${PAKET_MAX_SIDA_CM}\\s*cm`));
    assert.match(t, new RegExp(`${PAKET_MAX_KG}\\s*kg`));
  }
  assert.match(SKRYMMANDE_REGEL, new RegExp(`${PAKET_MAX_SIDA_CM}\\s*cm`));
});

test("beloppet bär sin källa och sitt datum", () => {
  // Siffran står i ett bindande förköpsbesked. Utan datum går det inte att se
  // när den blev gammal.
  assert.ok(KALLA.length > 5);
  assert.match(KALLA_DATUM, /^\d{4}-\d{2}-\d{2}$/);
});

test("kunden bokar själv — texten lovar aldrig att vi ordnar det", () => {
  for (const t of [SKRYMMANDE_RETURKOSTNAD, SKRYMMANDE_RETURKOSTNAD_KORT]) {
    assert.match(t, /bokar och betalar (du|då) själv|du bokar och betalar/i, t);
  }
});

// ---------------------------------------------------------------- repo-bred

const ROOTS = ["app", "lib", "components", "emails", "content", "docs"];
const EXT = /\.(ts|tsx|md|mdx)$/;
const SKIP = /node_modules|\.next|\.test\.tsx?$/;

function files(dir: string, out: string[] = []): string[] {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e);
    if (SKIP.test(p)) continue;
    if (statSync(p).isDirectory()) files(p, out);
    else if (EXT.test(p)) out.push(p);
  }
  return out;
}

// Samma normalisering som de övriga repo-breda proven: kommentarer och
// import-rader bort (de är till för oss, inte för kunden), JSX-taggar bort, och
// blanktecken ihopdragna så att en radbrytning mitt i en mening inte gömmer den.
const prose = (t: string) =>
  t.replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1 ")
    .replace(/^\s*import[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm, " ")
    .replace(/<\/?[A-Za-z][^>]*>/g, "")
    .replace(/\{"\s*"\}/g, " ")
    .replace(/\s+/g, " ");

const ALL = ROOTS.flatMap((r) => files(r)).map((p) => ({ p, t: prose(readFileSync(p, "utf8")) }));

test("det finns filer att granska", () => {
  assert.ok(ALL.length > 50, `hittade bara ${ALL.length} filer`);
});

test("ingen kundvänd text erbjuder sig att hämta varan", () => {
  // 2 kap. 13 § andra stycket. Avtryckaren är ERBJUDANDET, inte hämtningen:
  // bokar kunden själv en hemhämtning gäller huvudregeln fortfarande. Därför
  // letar mönstren efter OSS som avsändare ("vi hämtar", "vi bokar returen"),
  // inte efter ordet hämtning i sig — transportörens ombudsupphämtning i
  // spårningstexterna ska inte fällas.
  //
  // En nekning i samma mening friar, precis som i lagerpåstående-provet:
  // "vi erbjuder inte upphämtning" är motsatsen till problemet.
  const NEKAT = /\b(inte|inget|ingen|aldrig)\b/i;
  const MONSTER = [
    /\bvi\s+(hämtar|kan hämta|kommer och hämtar)\b/i,
    /\bvi\s+(bokar|ordnar|bekostar|står för|arrangerar)\b[^.!?]{0,60}\b(hämtning\w*|upphämtning\w*|returtransport\w*|returfrakt\w*|transport\w*|frakten)\b/i,
    /\berbjuder\s+(oss\s+)?att\s+hämta\b/i,
    /\bhämt(ar|ning)\b[^.!?]{0,30}\b(åt dig|hos dig|hemma hos dig)\b/i,
  ];
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    for (const re of MONSTER) {
      for (const mening of t.split(/(?<=[.!?])\s+/)) {
        const m = mening.match(re);
        if (m && !NEKAT.test(mening)) bad.push(`${p}: ${m[0]} — "${mening.trim().slice(0, 120)}"`);
      }
    }
  }
  assert.deepEqual(bad, []);
});

test("ingen text lovar att valfri leveranstjänst duger för alla varor", () => {
  // "välj valfri leveranstjänst (PostNord, DHL, Schenker)" är osant för var
  // femte produkt: en privatperson kan inte posta något över 120 cm eller 20 kg.
  // Att dessutom namnge transportörer binder oss vid ett utbud vi inte råder
  // över — Postpaket inrikes avvecklades 4 maj 2026.
  //
  // Formuleringen får leva kvar OM meningen samtidigt bär förbehållet, dvs
  // nämner storlek eller vikt.
  const FORBEHALL = /\b(storlek|mått|vikt|skrymmande|styckegods|tar emot)\b/i;
  const bad: string[] = [];
  for (const { p, t } of ALL) {
    for (const mening of t.split(/(?<=[.!?])\s+/)) {
      if (/valfri\s+(leveranstjänst|transportör|fraktbolag)/i.test(mening) && !FORBEHALL.test(mening)) {
        bad.push(`${p}: "${mening.trim().slice(0, 140)}"`);
      }
    }
  }
  assert.deepEqual(bad, []);
});
