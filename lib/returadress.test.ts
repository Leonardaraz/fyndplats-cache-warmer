// lib/returadress.test.ts
//
// Run: npm test (node --test --experimental-strip-types).
//
// Vart en retur ska. Hemadressen som returadress är borttagen (Leonard
// 2026-10-16): returer går till leverantörens returlager. Två saker låses här:
//   • En adress visas bara när varje vara i returen hör till samma leverantör
//     och den leverantören har en adress. Allt annat ger ingen adress, och
//     kvittot lovar då att vi mejlar den inom 1 arbetsdag.
//   • Hemadressen och namnet står varken i returflödet eller i något mejl.
// Produkt-id:n och den andra leverantörens adress är påhittade.

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  AOSOM_TILLVERKARE,
  RETURADRESSER,
  arAosomTillverkare,
  orderRaderUr,
  produktIdnFor,
  returadressRader,
  valjReturadress,
  type Returadress,
} from "./returadress.ts";

const AOSOM = RETURADRESSER.aosom;

test("bara Aosom-varor ger Aosom-adressen", () => {
  assert.equal(valjReturadress(["aosom"]), AOSOM);
  assert.equal(valjReturadress(["aosom", "aosom", "aosom"]), AOSOM);
});

test("blandat eller okänt ger ingen adress", () => {
  assert.equal(valjReturadress(["aosom", null]), null, "en vara gick inte att avgöra");
  assert.equal(valjReturadress([null]), null);
  assert.equal(valjReturadress([null, null]), null);
  assert.equal(valjReturadress([]), null, "inga varor alls");
  assert.equal(valjReturadress(["aosom", "annan"]), null, "två leverantörer");
  assert.equal(valjReturadress(["annan"]), null, "leverantör utan adress");
});

test("en ny leverantör får sin egen adress, aldrig en annans", () => {
  const ny: Returadress = { mottagare: "Exempel GmbH", rader: ["Lagerstraße 1", "12345 Exempelstadt"], land: "Tyskland" };
  const adresser = { ...RETURADRESSER, ny };
  assert.equal(valjReturadress(["ny", "ny"], adresser), ny);
  assert.equal(valjReturadress(["aosom", "ny"], adresser), null, "blandat mellan två med adress");
  assert.equal(valjReturadress(["ny"]), null, "utan adress i registret");
  // Ett namn som råkar finnas på Object.prototype är ingen leverantör.
  assert.equal(valjReturadress(["toString"]), null);
});

test("Aosom-adressen är returlagret i Neu Wulmstorf", () => {
  assert.deepEqual(returadressRader(AOSOM), [
    "MH Handel GmbH",
    "Retourenlager",
    "Bei der Lehmkuhle 4a",
    "21629 Neu Wulmstorf",
    "Tyskland",
  ]);
  assert.equal(AOSOM.land, "Tyskland");
});

test("ingen returadress nämner leverantörens varumärke", () => {
  // Kunden handlar av oss (lib/leverantor.test.ts). Mottagaren är bolaget som
  // redan står som tillverkare i produktsidans säkerhetsflik.
  for (const [nyckel, adress] of Object.entries(RETURADRESSER)) {
    assert.doesNotMatch(returadressRader(adress).join(" "), /aosom|ali\s?express/i, nyckel);
  }
});

test("en Aosom-vara känns igen på Aosoms tillverkare, inte bara på att motorn svarar", () => {
  assert.equal(arAosomTillverkare(AOSOM_TILLVERKARE), true);
  assert.equal(arAosomTillverkare(` ${AOSOM_TILLVERKARE} `), true);
  // En annan leverantörs tillverkare i samma svar är ingen Aosom-vara.
  assert.equal(arAosomTillverkare("Exempel GmbH"), false);
  // Ett svar utan tillverkare går inte att avgöra.
  assert.equal(arAosomTillverkare(""), null);
  assert.equal(arAosomTillverkare(null), null);
  assert.equal(arAosomTillverkare(undefined), null);
});

test("Aosom-adressens mottagare är samma bolag som tillverkaren", () => {
  // Bolaget står redan i produktsidans säkerhetsflik, så adressen avslöjar
  // inget nytt för kunden.
  assert.equal(AOSOM.mottagare, AOSOM_TILLVERKARE);
});

// En Wix-order i den form ecom/v1/orders svarar med, nedkortad.
const ORDER = {
  lineItems: [
    {
      productName: { original: "Fåtölj i sammet", translated: "Fåtölj i sammet" },
      catalogReference: { catalogItemId: "11111111-1111-4111-8111-111111111111" },
    },
    {
      productName: { original: "Skohylla med  tre plan" },
      catalogReference: { catalogItemId: "22222222-2222-4222-8222-222222222222" },
    },
    { productName: "Presentkort", _id: "33333333-3333-4333-8333-333333333333" },
    { name: "Gammal rad", productId: "44444444-4444-4444-8444-444444444444" },
  ],
};

test("orderns rader läses med namn och produkt-id, aldrig radens eget id", () => {
  const rader = orderRaderUr(ORDER);
  assert.equal(rader.length, 4);
  assert.deepEqual(rader[0].produktId, "11111111-1111-4111-8111-111111111111");
  assert.deepEqual(rader[2].produktId, null, "_id är radens id, inte produktens");
  assert.deepEqual(rader[3].produktId, "44444444-4444-4444-8444-444444444444");
  assert.ok(rader[3].namn.includes("Gammal rad"));
  assert.deepEqual(orderRaderUr({}), []);
  assert.deepEqual(orderRaderUr({ lineItems: "trasig" }), []);
});

test("varje vald vara kopplas till sina produkter i ordern", () => {
  const rader = orderRaderUr(ORDER);
  assert.deepEqual(produktIdnFor(["Fåtölj i sammet"], rader), [["11111111-1111-4111-8111-111111111111"]]);
  // Versaler och dubbla mellanslag spelar ingen roll.
  assert.deepEqual(produktIdnFor(["skohylla med tre plan"], rader), [["22222222-2222-4222-8222-222222222222"]]);
  // Okänt namn, och en rad utan produkt-id, går inte att avgöra.
  assert.deepEqual(produktIdnFor(["Något annat"], rader), [null]);
  assert.deepEqual(produktIdnFor(["Presentkort"], rader), [null]);
});

test("utan valda varor gäller hela ordern", () => {
  const rader = orderRaderUr(ORDER);
  assert.deepEqual(produktIdnFor([], rader), [
    ["11111111-1111-4111-8111-111111111111"],
    ["22222222-2222-4222-8222-222222222222"],
    null,
    ["44444444-4444-4444-8444-444444444444"],
  ]);
});

test("samma namn på två rader ger båda produkterna", () => {
  const rader = orderRaderUr({
    lineItems: [
      { productName: { original: "Pall" }, catalogReference: { catalogItemId: "a1" } },
      { productName: { original: "Pall" }, catalogReference: { catalogItemId: "b2" } },
      { productName: { original: "Pall" }, catalogReference: { catalogItemId: "a1" } },
    ],
  });
  assert.deepEqual(produktIdnFor(["Pall"], rader), [["a1", "b2"]]);
});

// ── Hemadressen ─────────────────────────────────────────────────────────────
// Bergviksgatan 10 står kvar som företagsadress i mejlens sidfot och på
// sajtens juridiska sidor: e-handelslagen och distansavtalslagen kräver den
// (Leonard 2026-10-16). Som returadress får den aldrig stå igen.

const RETURFLODET = [
  "lib/returadress.ts",
  "lib/returadress-order.ts",
  "lib/withdrawal.ts",
  "app/api/angra/route.ts",
  "app/api/admin/email-test/route.ts",
  "emails/_retur.tsx",
  "emails/withdrawal-receipt.tsx",
  "emails/return-confirmation.tsx",
  "components/angra-form.tsx",
];

test("hemadressen och namnet står inte i returflödet", () => {
  const traffar: string[] = [];
  for (const fil of RETURFLODET) {
    const text = readFileSync(join(process.cwd(), fil), "utf8");
    const m = text.match(/Bergviksgatan|Araz|152\s?44/i);
    if (m) traffar.push(`${fil}: ${m[0]}`);
  }
  assert.deepEqual(traffar, []);
});

function filerUnder(dir: string, ut: string[] = []): string[] {
  for (const namn of readdirSync(dir)) {
    const p = join(dir, namn);
    if (statSync(p).isDirectory()) filerUnder(p, ut);
    else if (/\.(tsx?|mdx?)$/.test(p)) ut.push(p);
  }
  return ut;
}

test("namnet står inte i något mejl", () => {
  const traffar = filerUnder(join(process.cwd(), "emails")).filter((p) => /Araz/i.test(readFileSync(p, "utf8")));
  assert.deepEqual(traffar, []);
});

test("den gamla modulen med hemadressen är borta", () => {
  assert.equal(existsSync(join(process.cwd(), "lib/return-address.ts")), false);
});
