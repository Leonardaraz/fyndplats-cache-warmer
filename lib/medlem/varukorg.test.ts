// Varukorgen för medlemmar (lib/medlem/varukorg.ts): Wix-korgen läses, och den
// låsta korgen följer reglerna från provordern i E0.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  beloppAvOre,
  foretagPaBeslut,
  forskottskund,
  forskottsnotering,
  forskottsorderKropp,
  FORSKOTT_MARKOR,
  kontrolleraForskottsorder,
  postnummer,
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
import { exklMoms, prissatt } from "./pris.ts";
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

/** En rad som `GET /ecom/v2/carts/{id}` svarar med (formen uppmätt 2026-11-06, värdena påhittade). */
function wixRadV2(id: string, produkt: string, variant: string | null, antal: number, pris: string, fore = pris, appId = STORES_APP_ID) {
  return {
    id,
    name: { original: `Vara ${produkt}`, translated: `Vara ${produkt}` },
    quantityInfo: { confirmedQuantity: antal, requestedQuantity: antal, availableQuantity: 78, fixedQuantity: false },
    pricing: {
      unitPrice: { amount: pris, convertedAmount: pris },
      totalPrice: { amount: pris, convertedAmount: pris },
      priceUndetermined: false,
      breakdown: { fullPrice: { amount: fore, convertedAmount: fore }, salePrice: { amount: pris, convertedAmount: pris } },
    },
    source: { catalogReference: { catalogItemId: produkt, appId, ...(variant ? { options: { variantId: variant } } : {}) }, rootCatalogItemId: produkt },
    attributes: { descriptionLines: [], itemType: { preset: "PHYSICAL" } },
    status: "IN_STOCK",
  };
}

test("☠️ servern läser Cart V2: raderna ur source, quantityInfo och pricing (förut blev varje riktig korg tom)", () => {
  const korg = { id: "c1", lineItems: [wixRadV2("00000000-0000-0000-0000-000000000001", "p1", "v1", 2, "1869"), wixRadV2("00000000-0000-0000-0000-000000000002", "p2", null, 1, "99.90")] };
  assert.deepEqual(lasWixVarukorg(korg), [
    { radId: "00000000-0000-0000-0000-000000000001", produktId: "p1", variantId: "v1", appId: STORES_APP_ID, antal: 2, aOre: 186_900, namn: "Vara p1" },
    { radId: "00000000-0000-0000-0000-000000000002", produktId: "p2", variantId: null, appId: STORES_APP_ID, antal: 1, aOre: 9_990, namn: "Vara p2" },
  ]);
  // Rean ligger i breakdown.fullPrice: ingen medlemsrabatt ovanpå (2.1).
  assert.equal(lasWixVarukorg({ lineItems: [wixRadV2("a", "p1", "v1", 1, "949", "999")] })?.[0].rea, true);
  assert.equal(lasWixVarukorg({ lineItems: [wixRadV2("a", "p1", "v1", 1, "999", "999")] })?.[0].rea, undefined);
  // Det kunden får räknas: ett slutsålt antal gör korgen oläslig (vanliga kassan).
  const slut = wixRadV2("a", "p1", "v1", 1, "999");
  assert.equal(lasWixVarukorg({ lineItems: [{ ...slut, quantityInfo: { confirmedQuantity: 0, requestedQuantity: 1 } }] }), null);
  assert.equal(lasWixVarukorg({ lineItems: [{ ...slut, quantityInfo: { requestedQuantity: 3 } }] })?.[0].antal, 3);
  assert.equal(lasWixVarukorg({ lineItems: [{ ...slut, pricing: {} }] }), null);
  // Andra appar än Stores följer med, men får aldrig medlemspris.
  const r = prisrader(lasWixVarukorg({ lineItems: [wixRadV2("a", "p1", "v1", 1, "499.90"), wixRadV2("c", "pk", null, 1, "500", "500", "annan-app")] })!, new Map());
  assert.equal(r[1].undantag, "tjanst");
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
  const kropp = laastVarukorgKropp(beslut, korg, "kund@example.se") as { cart: unknown; catalogItems: unknown[] };
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
  // Den skapade korgen kommer i V2-formen (POST /ecom/v2/carts): förut blev den
  // aldrig godkänd, och medlemskassan och offerten föll på kontrollen.
  const rattV2 = { lineItems: [wixRadV2("y", "p2", null, 3, "95.00"), wixRadV2("x", "p1", "v1", 1, "474.91")] };
  assert.equal(korgenBarPriserna(beslut, korg, rattV2), true);
  assert.equal(korgenBarPriserna(beslut, korg, { lineItems: [wixRadV2("y", "p2", null, 3, "95.00"), wixRadV2("x", "p1", "v1", 1, "499.90")] }), false);
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

test("☠️ 2.1: en reavara får aldrig medlemspris ovanpå, varken i korgen eller på produktsidan", () => {
  // Korgen: Wix fullPrice över priset är en rea. Samma pris i båda är ingen.
  const rea = { ...wixRad("r1", "p1", "v1", 1, "449.00"), fullPrice: { amount: "499.00" } };
  const vanlig = { ...wixRad("r2", "p2", "v2", 1, "499.00"), fullPrice: { amount: "499.00" } };
  const utanFullPrice = wixRad("r3", "p3", "v3", 1, "299.00");
  const rader = lasWixVarukorg({ lineItems: [rea, vanlig, utanFullPrice] });
  assert.ok(rader);
  assert.deepEqual(rader.map((r) => r.rea === true), [true, false, false]);

  const golv = new Map<string, Golvsvar>([
    [golvnyckel("p1", "v1"), { golvOre: 30_000, kostnadOre: 20_000 }],
    [golvnyckel("p2", "v2"), { golvOre: 30_000, kostnadOre: 20_000 }],
    [golvnyckel("p3", "v3"), { golvOre: 20_000, kostnadOre: 15_000 }],
  ]);
  const pr = prisrader(rader, golv);
  assert.equal(pr[0].undantag, "rea");
  assert.equal(pr[1].undantag, undefined);
  // Prismotorn ger reaveran listpriset (= reapriset), de andra rabatten.
  const beslut = prissatt(pr, { typ: "privat", niva: "Guld", nivaProcent: 2 });
  assert.equal(beslut.rader[0].pOre, 44_900);
  assert.equal(beslut.rader[0].begransning, "ej-berattigad");
  assert.ok(beslut.rader[1].pOre < 49_900);

  // Auktionen och flaggan vinner över rean, så att orsaken blir den starkaste.
  const auktion = prisrader([rader[0]], new Map([[golvnyckel("p1", "v1"), { golvOre: null, kostnadOre: null, utan: "auktion" }]]));
  assert.equal(auktion[0].undantag, "auktion");

  // Produktsidan: V3 compareAtPrice över priset är en rea.
  const v = variantpriserUrV3({
    variantsInfo: {
      variants: [
        { id: "a", price: { actualPrice: { amount: "449" }, compareAtPrice: { amount: "499" } } },
        { id: "b", price: { actualPrice: { amount: "499" }, compareAtPrice: { amount: "499" } } },
        { id: "c", price: { actualPrice: { amount: "499" } } },
      ],
    },
  });
  assert.deepEqual(v.map((x) => [x.variantId, x.rea === true]), [["a", true], ["b", false], ["c", false]]);
});

// ─────────────────────────────────────────────────────────────────────────────
// Förskottsordern (E3, villkoren 5.1, svar 3.3)
// ─────────────────────────────────────────────────────────────────────────────

const FORETAG = {
  epost: "inkop@exempel.se",
  foretag: "Exempel AB",
  orgnr: "556000-0000",
  faktura: { gata: "Testgatan 1", postnr: "15244", ort: "Södertälje" },
};

type Ordern = {
  order: {
    buyerNote: string;
    channelInfo: { type: string };
    status: string;
    paymentStatus: string;
    taxIncludedInPrices: boolean;
    lineItems: Record<string, unknown>[];
    priceSummary: Record<string, { amount: string }>;
    billingInfo: { address: Record<string, string>; contactDetails: Record<string, string> };
    shippingInfo: { title: string; logistics: { shippingDestination: { address: Record<string, string> } }; cost: Record<string, unknown> };
  };
};

test("förskottsordern har samma belopp som Wix satte på provordern 10167", () => {
  // 10167: en rad för 94,90 kr inkl. moms och 19 kr frakt. Wix skrev delsumman
  // 75,92 och frakten 15,20 exkl. moms, momsen 22,78 och totalen 113,90.
  const korg = lasWixVarukorg({ lineItems: [wixRad("a", "p1", "v1", 1, "94.90")] })!;
  const beslut = prissatt(prisrader(korg, new Map()), { typ: "foretag", niva: "Brons", nivaProcent: 0 });
  const { kropp, summor } = forskottsorderKropp(beslut, korg, FORETAG, 1_900, exklMoms);
  const o = (kropp as Ordern).order;
  assert.deepEqual(o.priceSummary, {
    subtotal: { amount: "75.92" },
    shipping: { amount: "15.20" },
    tax: { amount: "22.78" },
    discount: { amount: "0.00" },
    total: { amount: "113.90" },
  });
  assert.deepEqual(o.lineItems[0], {
    productName: { original: "Vara p1" },
    catalogReference: { catalogItemId: "p1", appId: STORES_APP_ID, options: { variantId: "v1" } },
    quantity: 1,
    itemType: { preset: "PHYSICAL" },
    physicalProperties: { shippable: true },
    price: { amount: "94.90" },
    totalPriceBeforeTax: { amount: "75.92" },
    totalPriceAfterTax: { amount: "94.90" },
    taxDetails: { taxRate: "0.25", totalTax: { amount: "18.98" } },
    paymentOption: "FULL_PAYMENT_OFFLINE",
  });
  assert.deepEqual(o.shippingInfo.cost, {
    price: { amount: "19.00" },
    totalPriceBeforeTax: { amount: "15.20" },
    totalPriceAfterTax: { amount: "19.00" },
    taxDetails: { taxRate: "0.25", totalTax: { amount: "3.80" } },
  });
  assert.deepEqual(summor, { varorOre: 9_490, fraktOre: 1_900, momsOre: 2_278, totalOre: 11_390 });
});

test("☠️ förskottsordern är obetald och handlagd, med markören först i noteringen", () => {
  const korg = lasWixVarukorg({ lineItems: [wixRad("a", "p1", null, 3, "1831.62"), wixRad("b", "p2", "v2", 1, "249")] })!;
  const beslut = prissatt(prisrader(korg, new Map()), { typ: "foretag", niva: "Brons", nivaProcent: 0 });
  const { kropp, summor } = forskottsorderKropp(beslut, korg, FORETAG, 0, exklMoms);
  const o = (kropp as Ordern).order;
  assert.equal(o.channelInfo.type, "BACKOFFICE_MERCHANT");
  assert.equal(o.status, "APPROVED");
  assert.equal(o.paymentStatus, "NOT_PAID");
  assert.equal(o.taxIncludedInPrices, true);
  assert.ok(o.buyerNote.startsWith(FORSKOTT_MARKOR));
  assert.equal(o.buyerNote, "Förskottsfaktura. Org.nr: 556000-0000.");
  assert.deepEqual(o.billingInfo, {
    address: { country: "SE", city: "Södertälje", postalCode: "152 44", addressLine: "Testgatan 1" },
    contactDetails: { company: "Exempel AB" },
  });
  // Utan egen leveransadress levereras varorna till fakturaadressen.
  assert.deepEqual(o.shippingInfo.logistics.shippingDestination.address, o.billingInfo.address);
  // Summorna går ihop: varorna plus frakten är totalen, momsen är en femtedel av den.
  const varor = 3 * 183_162 + 24_900;
  assert.equal(summor.totalOre, varor);
  assert.equal(oreAvBelopp(o.priceSummary.total.amount), varor);
  assert.equal(
    oreAvBelopp(o.priceSummary.subtotal.amount)! + oreAvBelopp(o.priceSummary.tax.amount)!,
    varor,
    "delsumman exkl. moms plus momsen är totalen",
  );
});

test("☠️ en enskild firmas personnummer skrivs aldrig i ordern", () => {
  const korg = lasWixVarukorg({ lineItems: [wixRad("a", "p1", null, 1, "100")] })!;
  const beslut = prissatt(prisrader(korg, new Map()), { typ: "foretag", niva: "Brons", nivaProcent: 0 });
  // Profilen bär numret för granskningen; kunden till ordern gör det inte.
  const profil = {
    namn: "Anna Andersson Snickeri",
    orgnr: "800101-1234",
    form: "enskild" as const,
    faktura: FORETAG.faktura,
  };
  const enskild = forskottskund(profil, FORETAG.epost);
  assert.equal(enskild.orgnr, undefined);
  assert.equal(forskottskund({ ...profil, form: "juridisk", orgnr: "556000-0000" }, FORETAG.epost).orgnr, "556000-0000");
  const { kropp } = forskottsorderKropp(beslut, korg, enskild, 1_900, exklMoms);
  assert.equal((kropp as Ordern).order.buyerNote, "Förskottsfaktura.");
  assert.equal(forskottsnotering({}), "Förskottsfaktura.");
  assert.doesNotMatch(JSON.stringify(kropp), /\d{6}-?\d{4}/);
});

test("förskottsordern: egen leveransadress, och bara varor ur Wix Stores", () => {
  const korg = lasWixVarukorg({ lineItems: [wixRad("a", "p1", null, 1, "100")] })!;
  const beslut = prissatt(prisrader(korg, new Map()), { typ: "foretag", niva: "Brons", nivaProcent: 0 });
  const lev = { ...FORETAG, leverans: { gata: "Lagervägen 2", postnr: "123 45", ort: "Farsta" } };
  const o = (forskottsorderKropp(beslut, korg, lev, 0, exklMoms).kropp as Ordern).order;
  assert.deepEqual(o.shippingInfo.logistics.shippingDestination.address, {
    country: "SE",
    city: "Farsta",
    postalCode: "123 45",
    addressLine: "Lagervägen 2",
  });
  assert.equal(postnummer("15244"), "152 44");
  assert.equal(postnummer("152 44"), "152 44");

  // Ett presentkort eller en tjänst går inte att förskottsfakturera härifrån.
  const blandad = lasWixVarukorg({ lineItems: [wixRad("a", "p1", null, 1, "100"), wixRad("c", "pk", null, 1, "500", "annan-app")] })!;
  const b2 = prissatt(prisrader(blandad, new Map()), { typ: "foretag", niva: "Brons", nivaProcent: 0 });
  assert.throws(() => forskottsorderKropp(b2, blandad, FORETAG, 0, exklMoms), /Wix Stores/);
  assert.throws(() => forskottsorderKropp(beslut, [{ ...korg[0], antal: 2 }], FORETAG, 0, exklMoms), /stämmer inte/);
  assert.throws(() => forskottsorderKropp(beslut, korg, FORETAG, -1, exklMoms), /frakt/);
});

test("kontrollen av den skapade förskottsordern: obetald, handlagd och våra belopp", () => {
  const korg = lasWixVarukorg({ lineItems: [wixRad("a", "p1", null, 2, "100"), wixRad("b", "p2", "v2", 1, "249")] })!;
  const beslut = prissatt(prisrader(korg, new Map()), { typ: "foretag", niva: "Brons", nivaProcent: 0 });
  const { summor } = forskottsorderKropp(beslut, korg, FORETAG, 1_900, exklMoms);
  const rader = beslut.rader.map((r) => ({ produktId: r.produktId, antal: r.antal, pOre: r.pOre }));
  const skapad = {
    id: "o-1",
    number: 10201,
    paymentStatus: "NOT_PAID",
    channelInfo: { type: "BACKOFFICE_MERCHANT" },
    priceSummary: { total: { amount: "468.00" } },
    // Wix lovar inte ordningen.
    lineItems: [
      { quantity: 1, price: { amount: "249.00" }, catalogReference: { catalogItemId: "p2" } },
      { quantity: 2, price: { amount: "100.00" }, catalogReference: { catalogItemId: "p1" } },
    ],
  };
  assert.deepEqual(kontrolleraForskottsorder(summor, rader, skapad), { ok: true, orderId: "o-1", nummer: "10201" });
  const fel = (over: Record<string, unknown>) => kontrolleraForskottsorder(summor, rader, { ...skapad, ...over });
  assert.equal(fel({ paymentStatus: "PAID" }).ok, false);
  assert.equal(fel({ channelInfo: { type: "WEB" } }).ok, false);
  assert.equal(fel({ priceSummary: { total: { amount: "469.00" } } }).ok, false);
  assert.equal(fel({ lineItems: [skapad.lineItems[0]] }).ok, false);
  assert.equal(
    fel({ lineItems: [skapad.lineItems[0], { ...skapad.lineItems[1], price: { amount: "99.00" } }] }).ok,
    false,
  );
  assert.equal(kontrolleraForskottsorder(summor, rader, null).ok, false);
});

test("☠️ prisbeslutet bär företaget till kvittot, men aldrig en enskild firmas personnummer", () => {
  const bolag = { namn: "Exempel AB", orgnr: "556000-0000", form: "juridisk" as const, faktura: { gata: "Företagsvägen 3", postnr: "15244", ort: "Södertälje" } };
  // Fälten heter som motorn läser dem (foretagUrBeslut i motorns lib/orders/faktura.ts).
  assert.deepEqual(foretagPaBeslut(bolag), {
    foretagNamn: "Exempel AB",
    foretagOrgnr: "556000-0000",
    foretagFaktura: { gata: "Företagsvägen 3", postnr: "15244", ort: "Södertälje" },
  });
  const firma = { ...bolag, namn: "Anna Andersson Snickeri", orgnr: "800101-1234", form: "enskild" as const };
  const ut = foretagPaBeslut(firma);
  assert.equal(ut.foretagOrgnr, undefined);
  assert.equal(ut.foretagNamn, "Anna Andersson Snickeri");
  assert.doesNotMatch(JSON.stringify(ut), /\d{6}-?\d{4}/);
  // Bara adressens tre fält följer med, inget annat ur profilen.
  const medMer = foretagPaBeslut({ ...bolag, faktura: { ...bolag.faktura, extra: "x" } as typeof bolag.faktura });
  assert.deepEqual(Object.keys(medMer.foretagFaktura).sort(), ["gata", "ort", "postnr"]);
});
