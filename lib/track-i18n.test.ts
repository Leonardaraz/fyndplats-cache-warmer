// Run: node --test --experimental-strip-types lib/track-i18n.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { matchPhrase, orderEventsNewestFirst, svCountry, svLocation, dedupeEvents } from "./track-i18n.ts";

test("svCountry – ISO-2 och engelskt namn → svenska; okänt passerar", () => {
  assert.equal(svCountry("Germany"), "Tyskland");
  assert.equal(svCountry("DE"), "Tyskland");
  assert.equal(svCountry("spain"), "Spanien");
  assert.equal(svCountry("SE"), "Sverige");
  assert.equal(svCountry("Narnia"), "Narnia"); // okänt land → oförändrat
  assert.equal(svCountry(""), "");
  assert.equal(svCountry(undefined), "");
});

test("svLocation – översätter land, föredrar strukturerad stad+land", () => {
  // Fri-text-land (17TRACK la landet i location) → svenska.
  assert.equal(svLocation("Germany"), "Tyskland");
  assert.equal(svLocation("Spain", {}), "Spanien");
  // Stad + land ur fri-text.
  assert.equal(svLocation("Frankfurt, Germany"), "Frankfurt, Tyskland");
  // Strukturerad adress vinner (visar exakt stad) + land översätts.
  assert.equal(svLocation("", { city: "Årsta", country: "SE" }), "Årsta, Sverige");
  assert.equal(svLocation("Germany", { country: "DE" }), "Tyskland");
  // Bara stad → passerar.
  assert.equal(svLocation("", { city: "Årsta" }), "Årsta");
  assert.equal(svLocation(""), "");
});

test("dedupeEvents – tar bort exakta dubbletter, bevarar ordning + distinkta", () => {
  const evs = [
    { time: "2026-07-14T06:37:00+01:00", description: "På väg", location: "Tyskland" },
    { time: "2026-07-10T08:00:00+01:00", description: "På väg", location: "Spanien" },
    { time: "2026-07-10T08:00:00+01:00", description: "På väg", location: "Spanien" }, // dubblett
    { time: "2026-07-10T10:13:00+01:00", description: "På väg", location: "Spanien" }, // annan tid → behålls
  ];
  const out = dedupeEvents(evs);
  assert.equal(out.length, 3);
  assert.equal(out[0].location, "Tyskland");
  assert.equal(out[2].time, "2026-07-10T10:13:00+01:00");
});

test("orderEventsNewestFirst – nyast först (aktiv markör hamnar på nuvarande steg)", () => {
  const evs = [
    { time: "2026-05-28T05:17:00Z", status: "Registrerad" },
    { time: "2026-06-04T16:53:00Z", status: "På väg" },
    { time: "2026-06-05T13:36:00Z", status: "Levererad" },
  ];
  const ordered = orderEventsNewestFirst(evs);
  assert.equal(ordered[0].status, "Levererad"); // nuvarande steg först
  assert.equal(ordered[2].status, "Registrerad"); // äldsta sist
  // Indata muteras inte
  assert.equal(evs[0].status, "Registrerad");
});

test("orderEventsNewestFirst – händelser utan tid hamnar sist, stabil ordning", () => {
  const evs = [
    { status: "A" },
    { time: "2026-06-01T00:00:00Z", status: "B" },
    { status: "C" },
  ];
  const ordered = orderEventsNewestFirst(evs);
  assert.equal(ordered[0].status, "B");
  assert.deepEqual(ordered.slice(1).map((e) => e.status), ["A", "C"]); // stabilt
});

test("orderEventsNewestFirst – olika tidszons-offset sorteras på RIKTIG tid", () => {
  // earlyZulu = 23:00Z; lateOffset visas som 01:00+02:00 = 23:00Z men +30 min senare i Z.
  const evs = [
    { time: "2026-06-05T01:30:00+02:00", status: "senare" }, // = 23:30Z
    { time: "2026-06-04T23:00:00Z", status: "tidigare" }, // = 23:00Z
  ];
  // Lexikalt skulle "2026-06-05..." felaktigt hamna först; på riktig tid är
  // "senare" (23:30Z) nyast → ska ligga först.
  const ordered = orderEventsNewestFirst(evs);
  assert.equal(ordered[0].status, "senare");
  assert.equal(ordered[1].status, "tidigare");
});

// De FAKTISKA 17TRACK-texterna från kundens paket (IMG_4194) ska var och en bli
// en EGEN svensk mening — inte alla kollapsa till "Paketet är på väg".
test("riktiga 17TRACK-händelser översätts till distinkt svenska", () => {
  assert.equal(
    matchPhrase("The shipment item has been delivered to the recipient's mailbox"),
    "Paketet har levererats till mottagarens brevlåda.",
  );
  assert.equal(
    matchPhrase("The shipment item has been loaded"),
    "Paketet har lastats för transport.",
  );
  assert.equal(
    matchPhrase("Your item is being processed at our sorting center"),
    "Paketet behandlas på sorteringsterminalen.",
  );
  assert.equal(
    matchPhrase("The shipment item is under transportation"),
    "Paketet är på väg genom transportnätet.",
  );
  assert.equal(
    matchPhrase(
      "We have received a notification from your shipper that they are preparing an item for you. The tracking information will be updated when the parcel is handed over to PostNord",
    ),
    "Vi har fått besked från avsändaren om att din vara förbereds. Spårningen uppdateras när paketet lämnats till transportören.",
  );
});

test("specifika fraser vinner över generiska (ordning)", () => {
  // "delivered to ... mailbox" får INTE bli generiskt "Paketet är levererat."
  assert.equal(
    matchPhrase("Delivered to recipient's mailbox"),
    "Paketet har levererats till mottagarens brevlåda.",
  );
  // ren "Delivered" → generiskt levererat
  assert.equal(matchPhrase("Delivered"), "Paketet är levererat.");
  // "arrived at sorting center" → terminal, inte generisk transit
  assert.equal(
    matchPhrase("Arrived at sorting center"),
    "Paketet har anlänt till en terminal.",
  );
});

test("vanliga milstolpar översätts", () => {
  assert.equal(matchPhrase("Out for delivery"), "Paketet är ute för leverans.");
  assert.equal(matchPhrase("Package handed over to carrier"), "Paketet har lämnats till transportören.");
  assert.equal(matchPhrase("Held at customs"), "Paketet hanteras i tullen.");
});

test("lagerstadiet – de fyra fraserna från order 10024 översätts", () => {
  // Ordagrant som de stod på /sparning 2026-08-31, alla fyra oöversatta.
  assert.equal(matchPhrase("Your order is being packed"), "Din order packas.");
  assert.equal(
    matchPhrase("Package picked and ready for packing."),
    "Varan är plockad och klar för packning.",
  );
  assert.equal(
    matchPhrase("Package ready to be shipped by warehouse."),
    "Paketet är färdigpackat och väntar på transportören.",
  );
  assert.equal(matchPhrase("Package left warehouse."), "Paketet har lämnat avsändarens lager.");
});

test("lagerstadiet läses INTE som en upphämtningsskanning", () => {
  // "picked and ready for packing" innehåller "picked". Hamnar regeln efter
  // upphämtningsmönstren blir varan "hämtad av transportören" medan den i
  // själva verket fortfarande ligger kvar på lagret — ett senare skede än
  // sanningen, vilket är värre än engelska.
  assert.notEqual(
    matchPhrase("Package picked and ready for packing."),
    "Paketet har hämtats av transportören.",
  );
  // Och riktiga upphämtningar ska fortfarande matcha som förut.
  assert.equal(
    matchPhrase("The shipment item has been picked up by the carrier"),
    "Paketet har hämtats av transportören.",
  );
});

test("okänd text → null (anroparen faller tillbaka på stage-text)", () => {
  assert.equal(matchPhrase("Some totally unknown carrier blurb 12345"), null);
  assert.equal(matchPhrase(""), null);
});
