// Run: node --test --experimental-strip-types lib/ae-track.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { INTE_LEVERERAT as AE_INTE_LEVERERAT, deriveAeStatus, translateAeDescription } from "./ae-track.ts";
import { INTE_LEVERERAT, matchPhrase } from "./track-i18n.ts";

test("translateAeDescription – verkliga AliExpress-fraser (order #10012)", () => {
  assert.equal(translateAeDescription("The seller has shipped your package."), "Säljaren har skickat ditt paket");
  assert.equal(translateAeDescription("Package collected by carrier."), "Paketet har hämtats upp av transportören");
  assert.equal(translateAeDescription("Shipping update"), "Transportuppdatering");
});

test("translateAeDescription – specifik fras vinner över generisk", () => {
  // "Order shipped" får INTE slukas av registrerings-frasen (regressionsskydd
  // mot /order|…/-buggen) och "out for delivery" inte av "delivered".
  assert.equal(translateAeDescription("Order shipped"), "Säljaren har skickat ditt paket");
  assert.equal(translateAeDescription("Out for delivery"), "Paketet är ute för leverans");
  assert.equal(translateAeDescription("Arrived at sorting center"), "Paketet har anlänt till en sorteringsterminal");
  assert.equal(translateAeDescription("Order information received"), "Fraktsedel skapad – paketet förbereds");
});

test("lagerstadiet – de fyra fraserna från spårning 13289200665172", () => {
  // Ordagrant som /api/track returnerade dem 2026-09-02, alla fyra oöversatta
  // ute hos kunden. AliExpress-källan hade aldrig fått reglerna som PHRASE_SV
  // (17TRACK-flödet) lagades med 2026-08-31.
  assert.equal(translateAeDescription("Your order is being packed"), "Din order packas.");
  assert.equal(
    translateAeDescription("Package picked and ready for packing."),
    "Varan är plockad och klar för packning.",
  );
  assert.equal(
    translateAeDescription("Package ready to be shipped by warehouse."),
    "Paketet är färdigpackat och väntar på transportören.",
  );
  assert.equal(translateAeDescription("Package left warehouse."), "Paketet har lämnat avsändarens lager.");
});

test("lagerstadiet läses INTE som en upphämtningsskanning", () => {
  // "picked and ready for packing" innehåller "picked". Hamnar regeln efter
  // upphämtningsmönstren blir varan "hämtad av transportören" medan den i
  // själva verket ligger kvar på lagret — ett senare skede än sanningen.
  assert.notEqual(
    translateAeDescription("Package picked and ready for packing."),
    "Paketet har hämtats upp av transportören",
  );
  // Riktiga upphämtningar ska fortfarande matcha som förut.
  assert.equal(
    translateAeDescription("Package collected by carrier."),
    "Paketet har hämtats upp av transportören",
  );
});

test("de två kanalerna säger samma sak om samma händelse", () => {
  // Divergerar lydelserna ser kunden olika text beroende på vilken källa som
  // råkade svara — det var precis så det här hålet uppstod.
  for (const rad of [
    "Your order is being packed",
    "Package picked and ready for packing.",
    "Package ready to be shipped by warehouse.",
    "Package left warehouse.",
  ]) {
    assert.equal(translateAeDescription(rad), matchPhrase(rad), rad);
  }
});

test("translateAeDescription – okänd text skrubbas på ursprungs-ord", () => {
  // "Sorted at" har ingen regel → faller igenom till skrubben.
  assert.equal(translateAeDescription("Sorted at Yiwu hub"), "Sorted at hub");
  // "Departed from <stad> warehouse" träffar numera lagerregeln i stället för
  // att falla igenom — svenska OCH utan ursprungsordet, alltså bättre än den
  // skrubbade engelskan raden gav förut.
  assert.equal(
    translateAeDescription("Departed from Shenzhen warehouse"),
    "Paketet har lämnat avsändarens lager.",
  );
});

test("deriveAeStatus – levererat är terminalt oavsett senare uppdateringar", () => {
  assert.equal(deriveAeStatus(["Shipping update", "Package delivered.", "Out for delivery"]), "Delivered");
});

test("deriveAeStatus – nyaste raden styr sista milen", () => {
  assert.equal(deriveAeStatus(["Out for delivery", "Shipping update"]), "OutForDelivery");
  assert.equal(deriveAeStatus(["Ready for pickup at service point", "Shipping update"]), "AvailableForPickup");
  // DHL:s lydelse (2026-10-08): samma steg som översättningen.
  assert.equal(deriveAeStatus(["Package arrived at pick-up point", "Shipping update"]), "AvailableForPickup");
  assert.equal(deriveAeStatus(["Parcel is at the service point"]), "AvailableForPickup");
});

test("deriveAeStatus – misslyckat leveransförsök är inte levererat/ute", () => {
  assert.equal(deriveAeStatus(["Delivery attempt failed, package not delivered"]), "InTransit");
});

test("deriveAeStatus – transit och tom lista → InTransit", () => {
  assert.equal(deriveAeStatus(["Shipping update", "The seller has shipped your package."]), "InTransit");
  assert.equal(deriveAeStatus([]), "InTransit");
});

test("translateAeDescription – upphämtningsställe med bindestreck (DHL, 2026-10-08)", () => {
  assert.equal(translateAeDescription("Package arrived at pick-up point"), "Paketet finns för upphämtning hos ditt ombud");
});

// ☠️ "delivered" i en text som säger att det INTE har skett, eller att det
// ska ske. /sparning sa "Paketet är levererat." om ett GLS-paket som låg kvar
// på terminalen (order 10075, 2026-10-13). I AliExpress-flödet hade samma
// text dessutom gett statusen Delivered, och då mejlar
// /api/cron/ae-delivery-poll kunden att paketet är framme.
const INTE_LEVERERADE = [
  // GLS, ordagrant från order 10075.
  "The parcel is stored in the parcel center to be delivered at a new delivery date.",
  "The shipment could not be delivered",
  "Your parcel couldn’t be delivered today",
  "Delivery attempt failed, package not delivered",
  "Undelivered",
  "The item will be delivered tomorrow",
  "Your parcel is being delivered",
  "The item could not be delivered to the recipient's mailbox",
];

test("☠️ ett paket som inte är levererat kallas aldrig levererat, i någon av kanalerna", () => {
  for (const rad of INTE_LEVERERADE) {
    assert.notEqual(matchPhrase(rad), "Paketet är levererat.", `17TRACK: ${rad}`);
    assert.notEqual(matchPhrase(rad), "Paketet har levererats till mottagarens brevlåda.", `17TRACK: ${rad}`);
    assert.notEqual(translateAeDescription(rad), "Paketet är levererat", `AliExpress: ${rad}`);
    assert.notEqual(deriveAeStatus([rad]), "Delivered", `status: ${rad}`);
    // Inte heller som nyaste rad efter en vanlig uppdatering.
    assert.notEqual(deriveAeStatus([rad, "Shipping update"]), "Delivered", `status: ${rad}`);
  }
});

test("ett levererat paket kallas fortfarande levererat", () => {
  for (const rad of ["Delivered", "The parcel has been delivered.", "Package delivered.", "Delivered. Signature not required."]) {
    assert.equal(matchPhrase(rad), "Paketet är levererat.", `17TRACK: ${rad}`);
    assert.equal(translateAeDescription(rad), "Paketet är levererat", `AliExpress: ${rad}`);
    assert.equal(deriveAeStatus([rad]), "Delivered", `status: ${rad}`);
  }
  assert.equal(
    matchPhrase("The shipment item has been delivered to the recipient's mailbox"),
    "Paketet har levererats till mottagarens brevlåda.",
  );
});

test("GLS 'expected to be delivered during the day' är ute för leverans, i båda kanalerna", () => {
  const rad = "The parcel is expected to be delivered during the day.";
  assert.equal(matchPhrase(rad), "Paketet är ute för leverans.");
  assert.equal(translateAeDescription(rad), "Paketet är ute för leverans");
  assert.equal(deriveAeStatus([rad, "Shipping update"]), "OutForDelivery");
});

test("☠️ de två INTE_LEVERERAT är samma mönster", () => {
  // ae-track.ts får inte importera från track-i18n.ts, så mönstret finns två
  // gånger. Glider de isär kallas samma text levererat i den ena kanalen.
  assert.equal(AE_INTE_LEVERERAT.source, INTE_LEVERERAT.source);
  assert.equal(AE_INTE_LEVERERAT.flags, INTE_LEVERERAT.flags);
});
