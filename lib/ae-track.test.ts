// Run: node --test --experimental-strip-types lib/ae-track.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { deriveAeStatus, translateAeDescription } from "./ae-track.ts";

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

test("translateAeDescription – okänd text skrubbas på ursprungs-ord", () => {
  assert.equal(translateAeDescription("Departed from Shenzhen warehouse"), "Departed from warehouse");
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
