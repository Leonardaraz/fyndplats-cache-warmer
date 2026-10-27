// lib/sista-led.test.ts
//
// Run with: `npm test` (node --test --experimental-strip-types).
//
// Rutan "Leverans i Sverige" på /sparning. Två saker låses här:
//   • Texten lovar bara det spårningen visar. Bokningen nämns först när GLS
//     visat den, ombudet först när ombudet syns.
//   • En knapp finns bara när länken finns. En knapp till en tom sökning hos
//     DSV är sämre än ingen knapp.
//   • Ett paket på väg tillbaka, eller som inte kunde lämnas, får inga löften.
// Numren är påhittade.

import test from "node:test";
import assert from "node:assert/strict";
import {
  DSV_SPARNING,
  POSTNORD_SPARNING,
  UPS_SPARNING,
  dsvLed,
  postnordLed,
  sistaLedInfoFor,
  sistaLedRuta,
  transportorLankar,
} from "./sista-led.ts";

const DSV_NR = "1000000001";
// UPS:s eget exempelnummer, inget riktigt paket.
const UPS_NR = "1Z999AA10123456784";

test("dsvLed: DSV:s eget nummer, länk till deras spårning och det gamla namnet", () => {
  assert.deepEqual(dsvLed(DSV_NR), {
    namn: "DSV",
    tidigare: "DB Schenker",
    nummer: DSV_NR,
    lank: DSV_SPARNING + DSV_NR,
  });
  assert.equal(DSV_SPARNING, "https://www.dsv.com/mydsv/tracking-public/?refNumber=");
  assert.equal(dsvLed(DSV_NR, "ombud").satt, "ombud");
  assert.equal(dsvLed(DSV_NR, "bokad").satt, "bokad");
});

test("dsvLed utan nummer: ingen länk och inget nummer", () => {
  const info = dsvLed(undefined, "bokad");
  assert.equal(info.nummer, undefined);
  assert.equal(info.lank, undefined);
  assert.equal(info.satt, "bokad");
  assert.equal(dsvLed("").lank, undefined);
});

test("postnordLed: samma nummer, versaler och utan mellanslag", () => {
  assert.deepEqual(postnordLed(" cc123456789de "), {
    namn: "PostNord",
    lank: POSTNORD_SPARNING + "CC123456789DE",
  });
  assert.equal(
    POSTNORD_SPARNING,
    "https://www.postnord.se/vara-verktyg/spara-brev-paket-och-pall?shipmentId=",
  );
});

test("sistaLedInfoFor: bara PostNord, DSV kommer från GLS egen spårning", () => {
  assert.deepEqual(sistaLedInfoFor("PostNord", "01234567890123"), postnordLed("01234567890123"));
  assert.equal(sistaLedInfoFor("DSV", "01234567890123"), undefined);
  assert.equal(sistaLedInfoFor("Bring", "01234567890123"), undefined);
  assert.equal(sistaLedInfoFor(undefined, "01234567890123"), undefined);
});

test("PostNord efter DPD: samma nummer, knapp till PostNord", () => {
  const ruta = sistaLedRuta(postnordLed("01234567890123"), { transportor: "DPD", status: "InTransit" });
  assert.equal(ruta.rubrik, "Leverans i Sverige");
  assert.equal(ruta.namn, "PostNord");
  assert.equal(
    ruta.text,
    "DPD lämnar över paketet till PostNord, som delar ut det i Sverige. Spårningsnumret är detsamma hos PostNord.",
  );
  assert.equal(ruta.nummer, undefined, "samma nummer visas inte en gång till");
  assert.deepEqual(ruta.knapp, {
    text: "Följ paketet hos PostNord",
    href: POSTNORD_SPARNING + "01234567890123",
  });
});

test("PostNord levererat: dåtid och en knapp som visar paketet", () => {
  const ruta = sistaLedRuta(postnordLed("01234567890123"), { transportor: "DPD", status: "Delivered", levererad: true });
  assert.equal(ruta.text, "PostNord delade ut paketet i Sverige. Spårningsnumret är detsamma hos PostNord.");
  assert.equal(ruta.knapp?.text, "Visa paketet hos PostNord");
});

test("DSV innan något syns: DSV hör av sig, varken bokning eller ombud utlovas", () => {
  const ruta = sistaLedRuta(dsvLed(DSV_NR), { transportor: "GLS", status: "InTransit" });
  assert.equal(ruta.namn, "DSV");
  assert.equal(
    ruta.text,
    "GLS lämnar över paketet till DSV (tidigare DB Schenker), som delar ut det i Sverige. DSV hör av sig när det är dags att ta emot eller hämta paketet.",
  );
  assert.equal(ruta.nummer, DSV_NR);
  assert.deepEqual(ruta.knapp, { text: "Följ paketet hos DSV", href: DSV_SPARNING + DSV_NR });
});

test("DSV bokad: DSV kontaktar kunden för att boka leveransdag", () => {
  const ruta = sistaLedRuta(dsvLed(DSV_NR, "bokad"), { transportor: "GLS", status: "InTransit" });
  assert.equal(
    ruta.text,
    "GLS har lämnat över paketet till DSV (tidigare DB Schenker), som delar ut det i Sverige. DSV kontaktar dig via sms, e-post eller telefon för att boka leveransdag.",
  );
  assert.equal(ruta.knapp?.text, "Följ paketet hos DSV");
});

test("DSV ombud på väg: avi när det kan hämtas, knappen visar ombudet", () => {
  const ruta = sistaLedRuta(dsvLed(DSV_NR, "ombud"), { transportor: "GLS", status: "InTransit" });
  assert.equal(
    ruta.text,
    "DSV (tidigare DB Schenker) lämnar paketet hos ett ombud nära dig. Du får en avi från DSV när du kan hämta det. Hos DSV ser du ombudets adress och öppettider.",
  );
  assert.deepEqual(ruta.knapp, { text: "Se ombudet hos DSV", href: DSV_SPARNING + DSV_NR });
});

test("DSV ombud framme: invänta avin innan du hämtar", () => {
  const ruta = sistaLedRuta(dsvLed(DSV_NR, "ombud"), { transportor: "GLS", status: "AvailableForPickup" });
  assert.equal(
    ruta.text,
    "Paketet finns hos ett DSV-ombud. Invänta avin från DSV innan du hämtar det. Hos DSV ser du ombudets adress och öppettider.",
  );
  assert.equal(ruta.knapp?.text, "Se ombudet hos DSV");
});

test("DSV levererat vinner över ombud och bokning", () => {
  for (const satt of [undefined, "ombud", "bokad"] as const) {
    const ruta = sistaLedRuta(dsvLed(DSV_NR, satt), { transportor: "GLS", status: "Delivered", levererad: true });
    assert.equal(ruta.text, "DSV (tidigare DB Schenker) delade ut paketet i Sverige.", String(satt));
    assert.equal(ruta.knapp?.text, "Visa paketet hos DSV", String(satt));
    assert.equal(ruta.nummer, DSV_NR, String(satt));
  }
});

test("DSV ute för leverans: bokningen är gjord, ingen ny bokning utlovas", () => {
  // Order 10082: bokningen syns 10-15, utkörningen dagar senare. Raden i
  // historiken säger då "kommer fram i dag", och rutan säger samma sak.
  for (const satt of [undefined, "bokad"] as const) {
    const ruta = sistaLedRuta(dsvLed(DSV_NR, satt), { transportor: "GLS", status: "OutForDelivery" });
    assert.equal(ruta.text, "DSV (tidigare DB Schenker) delar ut paketet i Sverige, och det kommer fram i dag.", String(satt));
    assert.equal(ruta.knapp?.text, "Följ paketet hos DSV");
  }
});

test("på väg tillbaka eller inte lämnat: inga löften, bara partnerns spårning", () => {
  for (const status of ["Returning", "DeliveryFailure", "Undelivered", "Exception", "Expired"]) {
    for (const satt of [undefined, "ombud", "bokad"] as const) {
      const ruta = sistaLedRuta(dsvLed(DSV_NR, satt), { transportor: "GLS", status });
      assert.equal(
        ruta.text,
        "DSV (tidigare DB Schenker) delar ut paketet i Sverige. Hos DSV ser du vad som händer med paketet nu.",
        `${status} ${satt}`,
      );
      assert.equal(ruta.nummer, DSV_NR);
      assert.equal(ruta.knapp?.text, "Följ paketet hos DSV");
    }
    const pn = sistaLedRuta(postnordLed("01234567890123"), { transportor: "DPD", status });
    assert.equal(
      pn.text,
      "PostNord delar ut paketet i Sverige. Spårningsnumret är detsamma hos PostNord, och där ser du vad som händer med paketet nu.",
      status,
    );
    assert.equal(pn.knapp?.text, "Följ paketet hos PostNord");
  }
});

test("utan DSV:s nummer: ingen knapp och ingen nummerrad, texten står kvar", () => {
  for (const satt of [undefined, "ombud", "bokad"] as const) {
    for (const levererad of [false, true]) {
      const ruta = sistaLedRuta(dsvLed(undefined, satt), { transportor: "GLS", status: "InTransit", levererad });
      assert.equal(ruta.knapp, undefined, `${satt} ${levererad}`);
      assert.equal(ruta.nummer, undefined, `${satt} ${levererad}`);
      assert.ok(ruta.text.length > 0);
    }
  }
});

test("texten lovar bara det spårningen visar", () => {
  const statusar = ["InTransit", "AvailableForPickup", "OutForDelivery", "Returning", "DeliveryFailure", "Exception"];
  const framat = new Set(["InTransit", "AvailableForPickup"]);
  for (const satt of [undefined, "ombud", "bokad"] as const) {
    for (const status of statusar) {
      const { text } = sistaLedRuta(dsvLed(DSV_NR, satt), { transportor: "GLS", status });
      const fallNamn = `${satt ?? "okänt"} ${status}`;
      // Bokningen bara innan paketet körs ut, och ombudet så länge det är på
      // väg dit eller ligger där. Aldrig när paketet är på väg tillbaka.
      assert.equal(/boka/i.test(text), satt === "bokad" && framat.has(status), `bokning i ${fallNamn}: ${text}`);
      assert.equal(
        /ombud/i.test(text),
        satt === "ombud" && (framat.has(status) || status === "OutForDelivery"),
        `ombud i ${fallNamn}: ${text}`,
      );
      assert.equal(/\bavi\b|avin/i.test(text), satt === "ombud" && !["Returning", "DeliveryFailure", "Exception"].includes(status), `avi i ${fallNamn}: ${text}`);
    }
  }
});

test("rutans texter: inga engelska rester och inga tankstreck", () => {
  const infos = [postnordLed("01234567890123"), dsvLed(DSV_NR), dsvLed(DSV_NR, "bokad"), dsvLed(DSV_NR, "ombud")];
  for (const info of infos) {
    for (const status of ["InTransit", "AvailableForPickup", "OutForDelivery", "Returning", "Delivered"]) {
      const ruta = sistaLedRuta(info, { transportor: "GLS", status, levererad: status === "Delivered" });
      const allt = [ruta.rubrik, ruta.text, ruta.knapp?.text ?? ""].join(" ");
      assert.doesNotMatch(allt, /parcel ?shop|delivery|pickup|shipment|tracking/i, allt);
      assert.doesNotMatch(allt, /[–—]/, allt);
    }
  }
});

test("transportorLankar: ett UPS-nummer får UPS först, och de andra finns kvar", () => {
  const lankar = transportorLankar(UPS_NR);
  assert.deepEqual(lankar.map((l) => l.name), ["UPS", "PostNord", "GLS", "DHL", "DPD"]);
  assert.equal(lankar[0].url, UPS_SPARNING + UPS_NR);
  assert.equal(transportorLankar(UPS_NR.toLowerCase())[0].name, "UPS");
});

test("transportorLankar: andra nummer behåller ordningen, med UPS sist", () => {
  for (const nr of ["RR123456789SE", "01234567890123", "1Z999AA1012345678"]) {
    const lankar = transportorLankar(nr);
    assert.deepEqual(lankar.map((l) => l.name), ["PostNord", "GLS", "DHL", "DPD", "UPS"], nr);
    assert.equal(lankar[0].url, POSTNORD_SPARNING + nr);
    assert.equal(lankar[4].url, UPS_SPARNING + nr);
  }
});

test("transportorLankar: numret kodas i varje adress", () => {
  for (const l of transportorLankar("AB 12/3&x")) {
    assert.ok(l.url.includes("AB%2012%2F3%26x"), `${l.name}: ${l.url}`);
  }
});
