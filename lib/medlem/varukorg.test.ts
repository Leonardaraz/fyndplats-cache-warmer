// Varukorgen för medlemmar (lib/medlem/varukorg.ts): Wix-korgen läses, och den
// låsta korgen följer reglerna från provordern i E0.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  beloppAvOre,
  golvnyckel,
  korgenBarPriserna,
  laastVarukorgKropp,
  lasWixVarukorg,
  oreAvBelopp,
  prisrader,
  STORES_APP_ID,
  type Golvsvar,
  kassaAdress,
  variantpriserUrV3,
} from "./varukorg.ts";
import { prissatt } from "./pris.ts";
import { golvnyckel as klientensNyckel } from "./golv-klient.ts";

function wixRad(id: string, produkt: string, variant: string | null, antal: number, pris: string, appId = STORES_APP_ID) {
  return {
    id,
    catalogReference: { catalogItemId: produkt, appId, ...(variant ? { options: { variantId: variant } } : {}) },
    quantity: antal,
    price: { amount: pris },
    productName: { original: `Vara ${produkt}` },
  };
}

test("belopp: Wix strängar och tal blir öre, och tillbaka med två decimaler", () => {
  assert.equal(oreAvBelopp("499.90"), 49_990);
  assert.equal(oreAvBelopp("499.9"), 49_990);
  assert.equal(oreAvBelopp(499.9), 49_990);
  assert.equal(oreAvBelopp("12"), 1_200);
  assert.equal(oreAvBelopp("0.05"), 5);
  for (const fel of ["", "-1", "1.234", "abc", null, undefined, "1e3"]) assert.equal(oreAvBelopp(fel), null, String(fel));
  assert.equal(beloppAvOre(49_490), "494.90");
  assert.equal(beloppAvOre(5), "0.05");
  assert.equal(beloppAvOre(0), "0.00");
  assert.throws(() => beloppAvOre(-1));
  assert.throws(() => beloppAvOre(1.5));
});

test("besökarens korg läses rad för rad; en trasig rad gör hela korgen oläslig", () => {
  const rader = lasWixVarukorg({ lineItems: [wixRad("a", "p1", "v1", 2, "499.90"), wixRad("b", "p2", null, 1, "99")] });
  assert.deepEqual(rader, [
    { radId: "a", produktId: "p1", variantId: "v1", appId: STORES_APP_ID, antal: 2, aOre: 49_990, namn: "Vara p1" },
    { radId: "b", produktId: "p2", variantId: null, appId: STORES_APP_ID, antal: 1, aOre: 9_900, namn: "Vara p2" },
  ]);
  assert.equal(lasWixVarukorg({ lineItems: [] }), null);
  assert.equal(lasWixVarukorg(null), null);
  assert.equal(lasWixVarukorg({ lineItems: [wixRad("a", "p1", "v1", 0, "10")] }), null);
  assert.equal(lasWixVarukorg({ lineItems: [{ ...wixRad("a", "p1", "v1", 1, "10"), price: {} }] }), null);
});

test("raderna får golvet och undantaget ur motorns svar; andra appar än Stores får aldrig medlemspris", () => {
  const golv = new Map<string, Golvsvar>([
    [golvnyckel("p1", "v1"), { golvOre: 30_000, kostnadOre: 20_000 }],
    [golvnyckel("p2", null), { golvOre: null, kostnadOre: null, utan: "auktion" }],
  ]);
  const korg = lasWixVarukorg({
    lineItems: [wixRad("a", "p1", "v1", 1, "499.90"), wixRad("b", "p2", null, 1, "99"), wixRad("c", "pk", null, 1, "500", "annan-app")],
  })!;
  const r = prisrader(korg, golv);
  assert.equal(r[0].golvOre, 30_000);
  assert.equal(r[0].undantag, undefined);
  assert.equal(r[1].undantag, "auktion");
  assert.equal(r[2].undantag, "tjanst");
});

test("den låsta korgen följer E0: öppen åtkomst, Sverige, webben, låst kupong och presentkort, pris på varje Stores-rad", () => {
  const korg = lasWixVarukorg({ lineItems: [wixRad("a", "p1", "v1", 2, "499.90"), wixRad("c", "pk", null, 1, "500", "annan-app")] })!;
  const golv = new Map<string, Golvsvar>([[golvnyckel("p1", "v1"), { golvOre: 30_000, kostnadOre: 20_000 }]]);
  const beslut = prissatt(prisrader(korg, golv), { typ: "privat", niva: "Guld", nivaProcent: 2 });
  const kropp = laastVarukorgKropp(beslut, korg, "kund@example.se") as any;
  assert.deepEqual(kropp.cart, {
    customerInfo: { openAccess: true, email: "kund@example.se" },
    settings: { lockCouponCode: true, lockGiftCard: true },
    deliveryInfo: { address: { country: "SE" } },
    source: { channelType: "WEB" },
  });
  assert.deepEqual(kropp.catalogItems[0], {
    catalogReference: { catalogItemId: "p1", appId: STORES_APP_ID, options: { variantId: "v1" } },
    quantity: 2,
    catalogOverrideFields: { salePrice: "489.90", fullPrice: "489.90" },
  });
  // Andra appars rader följer med orörda.
  assert.deepEqual(kropp.catalogItems[1], { catalogReference: { catalogItemId: "pk", appId: "annan-app" }, quantity: 1 });
});

test("en rad som inte stämmer med beslutet stoppar korgen", () => {
  const korg = lasWixVarukorg({ lineItems: [wixRad("a", "p1", "v1", 1, "100")] })!;
  const beslut = prissatt(prisrader(korg, new Map()), { typ: "privat", niva: "Brons", nivaProcent: 0 });
  assert.throws(() => laastVarukorgKropp(beslut, [{ ...korg[0], antal: 2 }], "k@example.se"), /stämmer inte/);
  assert.throws(() => laastVarukorgKropp(beslut, [], "k@example.se"), /olika antal/);
});

test("kontrollen efter skapandet: varje Stores-rad ska bära vårt pris, i vilken ordning Wix än svarar", () => {
  const korg = lasWixVarukorg({ lineItems: [wixRad("a", "p1", "v1", 1, "499.90"), wixRad("b", "p2", null, 3, "100.00")] })!;
  const golv = new Map<string, Golvsvar>([
    [golvnyckel("p1", "v1"), { golvOre: 1, kostnadOre: 1 }],
    [golvnyckel("p2", null), { golvOre: 1, kostnadOre: 1 }],
  ]);
  const beslut = prissatt(prisrader(korg, golv), { typ: "privat", niva: "VIP", nivaProcent: 5 });
  const ratt = { lineItems: [wixRad("y", "p2", null, 3, "95.00"), wixRad("x", "p1", "v1", 1, "474.91")] };
  assert.equal(korgenBarPriserna(beslut, korg, ratt), true);
  const katalogpris = { lineItems: [wixRad("x", "p1", "v1", 1, "499.90"), wixRad("y", "p2", null, 3, "95.00")] };
  assert.equal(korgenBarPriserna(beslut, korg, katalogpris), false);
  assert.equal(korgenBarPriserna(beslut, korg, { lineItems: [wixRad("x", "p1", "v1", 1, "474.91")] }), false);
});

test("golvnyckeln är densamma i varukorgen och i klienten mot motorn", () => {
  for (const [p, v] of [["p1", "v1"], ["p2", null], ["a-b", "00000000-0000-0000-0000-000000000000"]] as const) {
    assert.equal(golvnyckel(p, v), klientensNyckel(p, v));
  }
});

test("variantpriserna ur V3: synliga varianter med pris, i öre", () => {
  const produkt = {
    variantsInfo: {
      variants: [
        { id: "v1", price: { actualPrice: { amount: "499.90" } }, inventoryStatus: { inStock: true } },
        { id: "v2", price: { actualPrice: { amount: "549" } }, inventoryStatus: { inStock: false } },
        { id: "dold", visible: false, price: { actualPrice: { amount: "10" } } },
        { id: "utan-pris", price: {} },
        { id: "noll", price: { actualPrice: { amount: "0" } } },
      ],
    },
  };
  assert.deepEqual(variantpriserUrV3(produkt), [
    { variantId: "v1", aOre: 49_990, iLager: true },
    { variantId: "v2", aOre: 54_900, iLager: false },
  ]);
  assert.deepEqual(variantpriserUrV3(null), []);
  assert.deepEqual(variantpriserUrV3({}), []);
});

test("kassans adress: den inre länken, utan inloggningsrad, med butikens klient", () => {
  const inre = "https://www.fyndplats.se/__ecom/checkout?checkoutId=abc";
  const full = `https://www.wix.com/iam/x?redirectUrl=${encodeURIComponent(inre)}`;
  const ut = new URL(kassaAdress(full, "klient-1")!);
  assert.equal(ut.pathname, "/__ecom/checkout");
  assert.equal(ut.searchParams.get("checkoutId"), "abc");
  assert.equal(ut.searchParams.get("hideLoginLogoutBar"), "true");
  assert.equal(ut.searchParams.get("headlessClientId"), "klient-1");
  assert.equal(kassaAdress("https://www.wix.com/iam/x?redirectUrl=https%3A%2F%2Fannan.se%2F", "k"), null);
  assert.equal(kassaAdress("inte en adress", "k"), null);
  assert.equal(kassaAdress(undefined, "k"), null);
});
