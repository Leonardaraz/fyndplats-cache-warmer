// Offerten (lib/medlem/offert.ts) och den låsta korgen för offertens rader
// (lib/medlem/varukorg.ts: lastKorgKropp, korgenBarRaderna).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MEDDELANDE_MAX,
  OFFERT_GILTIG_DAGAR,
  aktuellStatus,
  arOffertId,
  giltigTill,
  kanBetalas,
  offertId,
  offertStatusText,
  offertSummor,
  offertUrRad,
  rensaMeddelande,
  type Offert,
} from "./offert.ts";
import { STORES_APP_ID, korgenBarRaderna, lastKorgKropp, type Lastrad } from "./varukorg.ts";

const NU = Date.parse("2026-11-04T20:00:00.000Z");

function offert(over: Partial<Offert> = {}): Offert {
  return {
    id: "o_0123456789ab",
    medlemsId: "m_" + "a".repeat(40),
    foretagNamn: "Bygg i Norr AB",
    status: "prissatt",
    rader: [
      { produktId: "p1", variantId: "v1", appId: STORES_APP_ID, namn: "Pallställ", antal: 12, aOre: 249_000, offertOre: 229_000 },
      { produktId: "p2", appId: STORES_APP_ID, namn: "Arbetsbänk", antal: 2, aOre: 399_000, offertOre: 379_000 },
    ],
    skapad: "2026-11-04T10:00:00.000Z",
    prissatt: "2026-11-04T19:00:00.000Z",
    giltigTill: giltigTill(Date.parse("2026-11-04T19:00:00.000Z")),
    ...over,
  };
}

test("id: o_ och tolv hexsiffror, och inget annat godtas", () => {
  assert.equal(offertId("ABCDEF0123456789"), "o_abcdef012345");
  assert.equal(arOffertId("o_abcdef012345"), true);
  for (const fel of ["o_abc", "x_abcdef012345", "o_ABCDEF012345", "", null]) assert.equal(arOffertId(fel), false);
  assert.throws(() => offertId("12"));
});

test("E3-10: offerten gäller i 14 dygn från prissättningen, sedan är den utgången och kan inte betalas", () => {
  const o = offert();
  assert.equal(Date.parse(o.giltigTill!) - Date.parse(o.prissatt!), OFFERT_GILTIG_DAGAR * 86_400_000);
  assert.equal(kanBetalas(o, NU), true);
  const sist = Date.parse(o.giltigTill!) - 1;
  assert.equal(kanBetalas(o, sist), true);
  assert.equal(aktuellStatus(o, sist + 1), "utgangen");
  assert.equal(kanBetalas(o, sist + 1), false);
  assert.equal(kanBetalas(offert({ status: "accepterad" }), NU), true);
});

test("bara en prissatt eller accepterad offert med pris på varje rad kan betalas", () => {
  for (const status of ["skickad", "betald", "avbojd", "utgangen"] as const) assert.equal(kanBetalas(offert({ status }), NU), false, status);
  const utanPris = offert();
  delete utanPris.rader[1].offertOre;
  assert.equal(kanBetalas(utanPris, NU), false);
});

test("summorna: listpriset alltid, offertens summa först när alla rader har pris", () => {
  assert.deepEqual(offertSummor(offert()), { listaOre: 12 * 249_000 + 2 * 399_000, offertOre: 12 * 229_000 + 2 * 379_000 });
  const halv = offert();
  delete halv.rader[0].offertOre;
  assert.equal(offertSummor(halv).offertOre, null);
});

test("raden i Wix läses tillbaka, och en trasig rad eller okänd status blir null", () => {
  const o = offert({ meddelande: "Leverans till lagret i Luleå" });
  const rad = { _id: o.id, ...o };
  assert.deepEqual(offertUrRad(rad), o);
  assert.equal(offertUrRad({ ...rad, status: "okand" }), null);
  assert.equal(offertUrRad({ ...rad, rader: [] }), null);
  assert.equal(offertUrRad({ ...rad, rader: [{ produktId: "p1" }] }), null);
  assert.equal(offertUrRad({ ...rad, _id: "fel" }), null);
});

test("kundens meddelande rensas och kortas", () => {
  assert.equal(rensaMeddelande("  Hej <b>där</b>\u0007  \nRad två "), "Hej b där /b \nRad två");
  assert.equal(rensaMeddelande("x".repeat(MEDDELANDE_MAX + 50)).length, MEDDELANDE_MAX);
  assert.equal(rensaMeddelande(undefined), "");
});

test("statustexten följer läget och sista dagen", () => {
  assert.match(offertStatusText(offert({ status: "skickad" }), NU), /inom en arbetsdag/);
  assert.match(offertStatusText(offert(), NU), /till och med 18 november/);
  assert.match(offertStatusText(offert(), Date.parse(offert().giltigTill!)), /Utgången/);
  assert.match(offertStatusText(offert({ status: "betald" }), NU), /Betald/);
});

const RADER: Lastrad[] = [
  { produktId: "p1", variantId: "v1", appId: STORES_APP_ID, antal: 12, pOre: 229_000 },
  { produktId: "p2", variantId: null, appId: STORES_APP_ID, antal: 2, pOre: 379_000 },
];

test("den låsta korgen för offerten: E0:s regler och offertens pris i salePrice och fullPrice", () => {
  const k = lastKorgKropp(RADER, "inkop@exempel.se") as { cart: Record<string, unknown>; catalogItems: Record<string, unknown>[] };
  assert.deepEqual(k.cart, {
    customerInfo: { openAccess: true, email: "inkop@exempel.se" },
    settings: { lockCouponCode: true, lockGiftCard: true },
    deliveryInfo: { address: { country: "SE" } },
    source: { channelType: "WEB" },
  });
  assert.deepEqual(k.catalogItems[0], {
    catalogReference: { catalogItemId: "p1", appId: STORES_APP_ID, options: { variantId: "v1" } },
    quantity: 12,
    catalogOverrideFields: { salePrice: "2290.00", fullPrice: "2290.00" },
  });
  assert.throws(() => lastKorgKropp([{ ...RADER[0], appId: "annan" }], "x@y.se"));
  assert.throws(() => lastKorgKropp([], "x@y.se"));
});

test("kontrollen efter skapandet: varje rad ska bära offertens pris, i vilken ordning som helst", () => {
  const wix = (pris1: string) => ({
    lineItems: [
      { id: "b", catalogReference: { catalogItemId: "p2", appId: STORES_APP_ID }, quantity: 2, price: { amount: "3790.00" } },
      { id: "a", catalogReference: { catalogItemId: "p1", appId: STORES_APP_ID, options: { variantId: "v1" } }, quantity: 12, price: { amount: pris1 } },
    ],
  });
  assert.equal(korgenBarRaderna(RADER, wix("2290.00")), true);
  assert.equal(korgenBarRaderna(RADER, wix("2490.00")), false, "katalogpriset i stället för offertens");
  assert.equal(korgenBarRaderna(RADER, { lineItems: [] }), false);
  // Wix svarar på POST /ecom/v2/carts i V2-formen; förut godkändes den aldrig.
  const v2 = (id: string, produkt: string, variant: string | null, antal: number, pris: string) => ({
    id,
    name: { original: produkt },
    quantityInfo: { confirmedQuantity: antal, requestedQuantity: antal },
    pricing: { unitPrice: { amount: pris }, breakdown: { fullPrice: { amount: pris }, salePrice: { amount: pris } } },
    source: { catalogReference: { catalogItemId: produkt, appId: STORES_APP_ID, ...(variant ? { options: { variantId: variant } } : {}) } },
  });
  assert.equal(korgenBarRaderna(RADER, { lineItems: [v2("b", "p2", null, 2, "3790"), v2("a", "p1", "v1", 12, "2290")] }), true);
  assert.equal(korgenBarRaderna(RADER, { lineItems: [v2("b", "p2", null, 2, "3790"), v2("a", "p1", "v1", 12, "2490")] }), false);
});
