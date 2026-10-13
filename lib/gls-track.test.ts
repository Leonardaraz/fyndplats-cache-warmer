// Run: node --test --experimental-strip-types lib/gls-track.test.ts
//
// ☠️ Fixturen har samma FORM som GLS svar på rstt027 (uppmätt 2026-10-12), men
// påhittade värden. Inget riktigt spårningsnummer, postnummer eller referens
// hör hemma i ett publikt repo: referenserna i ett riktigt svar är avsändarens
// egna ordernummer.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  GLS_SOK_URL,
  glsSokUrl,
  glsStad,
  glsStatus,
  liknarGlsNummer,
  oversattGls,
  tolkaGlsSvar,
} from "./gls-track.ts";

const SVAR = {
  tuStatus: [
    {
      postalCode: "99999",
      references: [
        { type: "UNITNO", name: "Parcel number:", value: "00000000001" },
        { type: "GLSREF", name: "DB Schenker Sweden parcel number", value: "0000000000000000001" },
        { type: "CUSTREF", name: "Customer's own reference number", value: "REF-PAHITTAD-1" },
      ],
      infos: [{ type: "WEIGHT", name: "Weight:", value: "12.3 kg" }],
      history: [
        {
          time: "14:10:00",
          date: "2026-01-14",
          address: { countryCode: "SE", city: "Malmoe", countryName: "Sweden" },
          evtDscr: "The parcel has reached the parcel center.",
        },
        {
          time: "02:20:00",
          date: "2026-01-13",
          address: { countryCode: "DE", city: "Neuenstein", countryName: "Germany" },
          evtDscr: "The parcel has reached the parcel center.",
        },
        {
          time: "18:30:00",
          date: "2026-01-12",
          address: { countryCode: "DE", city: "Neumuenster", countryName: "Germany" },
          evtDscr: "The parcel was handed over to GLS.",
        },
        {
          time: "04:40:00",
          date: "2026-01-12",
          address: { countryCode: "DE", city: "Hamburg", countryName: "Germany" },
          evtDscr: "The parcel data was entered into the GLS IT system; the parcel was not yet handed over to GLS.",
        },
      ],
      progressBar: { statusInfo: "INTRANSIT", retourFlag: false },
      owners: [{ type: "REQUEST", code: "XX01" }],
      tuNo: "00000000001",
    },
  ],
};

test("hela resan tolkas, nyast först, på svenska", () => {
  const s = tolkaGlsSvar(SVAR);
  assert.ok(s);
  assert.equal(s.status, "InTransit");
  assert.equal(s.handelser.length, 4);
  assert.deepEqual(s.handelser[0], {
    tid: "2026-01-14T14:10:00",
    stad: "Malmö",
    land: "SE",
    beskrivning: "Paketet har kommit till en GLS-terminal.",
    etikett: "Ankommen till terminal",
    original: "The parcel has reached the parcel center.",
  });
  assert.equal(s.handelser[2].stad, "Neumünster");
  assert.equal(s.handelser[2].beskrivning, "Paketet har lämnats till GLS.");
  assert.equal(s.handelser[3].stad, "Hamburg");
  assert.equal(s.handelser[3].tid, "2026-01-12T04:40:00");
});

test("☠️ registreringen läses inte som en upphämtning", () => {
  // Texten innehåller "handed over to GLS", men säger att det INTE har skett.
  const t = oversattGls("The parcel data was entered into the GLS IT system; the parcel was not yet handed over to GLS.");
  assert.deepEqual(t, { text: "Fraktinformation mottagen – paketet är registrerat hos GLS.", etikett: "Registrerad" });
});

test("☠️ ombud och 'väntas levereras' är inte levererat", () => {
  assert.equal(oversattGls("The parcel has been delivered at the ParcelShop (see ParcelShop information).")?.etikett, "Finns för upphämtning");
  assert.equal(oversattGls("The parcel is expected to be delivered during the day.")?.etikett, "Ute för leverans");
  assert.equal(oversattGls("The parcel could not be delivered as the consignee was absent.")?.etikett, "Leveransförsök misslyckades");
  assert.equal(oversattGls("The parcel has been delivered.")?.etikett, "Levererad");
});

test("☠️ ett paket som ligger kvar på terminalen är inte levererat", () => {
  // Ordagrant GLS text kl 01:10 på natten för order 10075 (2026-10-13).
  // /sparning sa "Paketet är levererat." innan regeln fanns.
  assert.deepEqual(
    oversattGls("The parcel is stored in the parcel center to be delivered at a new delivery date."),
    { text: "Paketet ligger kvar på terminalen och delas ut en annan dag.", etikett: "Ny leveransdag" },
  );
  assert.equal(oversattGls("The parcel is stored in the parcel center.")?.etikett, "På terminalen");
  assert.equal(oversattGls("The parcel is on its way to the final parcel center.")?.etikett, "På väg");
});

test("en okänd text ger null, och anroparen faller tillbaka", () => {
  assert.equal(oversattGls("Something GLS has not said before."), null);
  const s = tolkaGlsSvar({ tuStatus: [{ history: [{ date: "2026-10-12", time: "08:00:00", address: {}, evtDscr: "Something new." }] }] });
  assert.ok(s);
  assert.equal(s.handelser[0].beskrivning, null);
  assert.equal(s.handelser[0].etikett, null);
  assert.equal(s.handelser[0].original, "Something new.");
});

test("☠️ referenser, vikt och postnummer följer aldrig med", () => {
  const ut = JSON.stringify(tolkaGlsSvar(SVAR));
  for (const hemligt of ["REF-PAHITTAD-1", "0000000000000000001", "99999", "12.3 kg", "XX01", "00000000001"]) {
    assert.ok(!ut.includes(hemligt), `${hemligt} läckte ut ur tolkningen`);
  }
});

test("DB Schenker blir sista ledet bara när GLS säger det", () => {
  assert.equal(tolkaGlsSvar(SVAR)?.sistaLed, "DB Schenker");
  const utan = structuredClone(SVAR);
  utan.tuStatus[0].references = utan.tuStatus[0].references.filter((r) => !/schenker/i.test(r.name));
  assert.equal(tolkaGlsSvar(utan)?.sistaLed, undefined);
});

test("fel postnummer, saknad historik och skräp ger null", () => {
  // Ordagrant GLS svar på fel postnummer (404).
  assert.equal(tolkaGlsSvar({ lastError: "E609", exceptionText: "Unfortunately there are no results." }), null);
  // Svaret utan postnummer (rstt029): bara status.
  assert.equal(tolkaGlsSvar({ tuStatus: [{ progressBar: { statusInfo: "INTRANSIT" }, owners: [] }] }), null);
  assert.equal(tolkaGlsSvar({ tuStatus: [{ history: [] }] }), null);
  assert.equal(tolkaGlsSvar({ tuStatus: [{ history: [{ date: "igår", evtDscr: "x" }] }] }), null);
  assert.equal(tolkaGlsSvar(null), null);
  assert.equal(tolkaGlsSvar("text"), null);
});

test("statusen följer GLS, och retur vinner", () => {
  assert.equal(glsStatus("DELIVERED", false), "Delivered");
  assert.equal(glsStatus("INDELIVERY", false), "OutForDelivery");
  assert.equal(glsStatus("INWAREHOUSE", false), "InTransit");
  assert.equal(glsStatus("PREADVICE", false), "InfoReceived");
  assert.equal(glsStatus("NOTDELIVERED", false), "DeliveryFailure");
  assert.equal(glsStatus("NÅGOT_NYTT", false), "InTransit");
  assert.equal(glsStatus(undefined, undefined), "InTransit");
  assert.equal(glsStatus("INTRANSIT", true), "Returning");
});

test("svenska orter får prickar, tyska bara när de är kända", () => {
  assert.equal(glsStad("Malmoe", "SE"), "Malmö");
  assert.equal(glsStad("Vaesteraas", "SE"), "Västerås");
  assert.equal(glsStad("Joenkoeping", "se"), "Jönköping");
  assert.equal(glsStad("Oerebro", "SE"), "Örebro");
  assert.equal(glsStad("MALMOE", "SE"), "MALMÖ");
  assert.equal(glsStad("Rosersberg", "SE"), "Rosersberg");
  assert.equal(glsStad("Neumuenster", "DE"), "Neumünster");
  // "oe" är inget omljud här, så ingen allmän regel för Tyskland.
  assert.equal(glsStad("Itzehoe", "DE"), "Itzehoe");
  assert.equal(glsStad("Soest", "DE"), "Soest");
  assert.equal(glsStad("Aarhus", "DK"), "Aarhus");
  assert.equal(glsStad("", "SE"), "");
});

test("adressen är GLS sökning med postnumret utan mellanslag", () => {
  const url = new URL(glsSokUrl(" abcd1234 ", "123 45", 1000));
  assert.equal(`${url.origin}${url.pathname}`, GLS_SOK_URL);
  assert.ok(GLS_SOK_URL.endsWith("/rstt027"));
  assert.equal(url.searchParams.get("match"), "ABCD1234");
  assert.equal(url.searchParams.get("postalCode"), "12345");
  assert.equal(url.searchParams.get("caller"), "witt002");
  assert.equal(url.searchParams.get("type"), "");
  assert.equal(url.searchParams.get("millis"), "1000");
});

test("GLS-nummer: Track ID och kollinummer, inte andra transportörers", () => {
  assert.equal(liknarGlsNummer("ABCD1234"), true);
  assert.equal(liknarGlsNummer("abcd1234"), true);
  assert.equal(liknarGlsNummer("00000000001"), true);
  assert.equal(liknarGlsNummer("000000000012"), true);
  assert.equal(liknarGlsNummer("RR123456789SE"), false);
  assert.equal(liknarGlsNummer("07000000000000"), false);
  assert.equal(liknarGlsNummer("ABC1234"), false);
});

// Källkodsprovet. Varje påstående är prövat genom att återinföra felet det
// gäller: postnumret eller felets text i loggen, och en /api/track som inte
// längre frågar GLS för ett paket 17TRACK kallar GLS.
test("☠️ postnumret når aldrig loggen, och /api/track frågar GLS för GLS-paket", () => {
  const kalla = readFileSync(join(process.cwd(), "lib/gls-source.ts"), "utf8");
  const loggrader = kalla.split("\n").filter((r) => /console\./.test(r));
  assert.ok(loggrader.length > 0, "gls-source loggar inte längre, och då syns inget fel");
  for (const rad of loggrader) {
    assert.doesNotMatch(rad, /postnummer|postalCode|glsSokUrl|\burl\b/i, `postnumret kan nå loggen: ${rad.trim()}`);
    // Felets text kan bära adressen till GLS, och den bär postnumret.
    assert.doesNotMatch(rad, /err\.message|String\(err\)|\$\{err\}/, `felets text kan nå loggen: ${rad.trim()}`);
  }
  const route = readFileSync(join(process.cwd(), "app/api/track/route.ts"), "utf8");
  assert.match(route, /maskCarrier\(leverantor17\) === "GLS"/, "/api/track frågar inte GLS när 17TRACK säger GLS");
  assert.match(route, /fetchGlsSparning\(tn\)/, "/api/track hämtar inte GLS-resan");
});

test("☠️ en GLS-text som tabellen inte känner går aldrig genom den allmänna översättningen", () => {
  // PHRASE_SV läser varje "delivered" som levererat, även "to be delivered".
  // /sparning sa därför "Paketet är levererat." om ett paket som låg kvar på
  // terminalen (order 10075, 2026-10-13). Prövat genom att återinföra felet.
  const route = readFileSync(join(process.cwd(), "app/api/track/route.ts"), "utf8");
  const bygg = route.slice(route.indexOf("function buildGlsBody"), route.indexOf("function carrierFallbackLinks"));
  assert.ok(bygg.length > 0, "buildGlsBody hittades inte");
  assert.match(bygg, /h\.beskrivning \?\? h\.original/, "en okänd GLS-text visas inte som GLS skrev den");
  assert.doesNotMatch(bygg, /toSwedish\(|PHRASE_SV|matchPhrase\(/, "GLS-texten går genom den allmänna översättningen igen");
});
