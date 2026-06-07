// Run: node --test --experimental-strip-types lib/track-i18n.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { matchPhrase, orderEventsNewestFirst } from "./track-i18n.ts";

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

test("okänd text → null (anroparen faller tillbaka på stage-text)", () => {
  assert.equal(matchPhrase("Some totally unknown carrier blurb 12345"), null);
  assert.equal(matchPhrase(""), null);
});
