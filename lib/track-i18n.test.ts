// Run: node --test --experimental-strip-types lib/track-i18n.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { matchPhrase } from "./track-i18n.ts";

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
