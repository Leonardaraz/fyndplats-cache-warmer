// Run: node --test --experimental-strip-types lib/ae-track.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { deriveAeStatus, translateAeDescription } from "./ae-track.ts";
import { matchPhrase } from "./track-i18n.ts";

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
});

test("deriveAeStatus – misslyckat leveransförsök är inte levererat/ute", () => {
  assert.equal(deriveAeStatus(["Delivery attempt failed, package not delivered"]), "InTransit");
});

test("deriveAeStatus – transit och tom lista → InTransit", () => {
  assert.equal(deriveAeStatus(["Shipping update", "The seller has shipped your package."]), "InTransit");
  assert.equal(deriveAeStatus([]), "InTransit");
});
