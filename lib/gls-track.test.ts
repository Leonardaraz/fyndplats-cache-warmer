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
        { type: "GLSREF", name: "Swedish shipment number", value: "1000000001" },
        { type: "GLSREF", name: "Origin National Reference in Unicode", value: "900000009" },
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
  // GLS lämnar över till DSV i Malmö, så terminalen i Sverige är inte GLS.
  assert.deepEqual(s.handelser[0], {
    tid: "2026-01-14T14:10:00",
    stad: "Malmö",
    land: "SE",
    beskrivning: "Paketet har kommit till en terminal.",
    etikett: "Ankommen till terminal",
    original: "The parcel has reached the parcel center.",
  });
  assert.equal(s.handelser[1].beskrivning, "Paketet har kommit till en GLS-terminal.");
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

test("☠️ referenser, vikt och postnummer följer aldrig med, bara DSV:s sändnings-id", () => {
  const s = tolkaGlsSvar(SVAR);
  const ut = JSON.stringify(s);
  // Avsändarens ordernummer, avsändarens GLS-kundnummer och kollinumren leder
  // till leverantören. Prövat genom att läsa alla GLSREF-rader: testet fäller.
  for (const hemligt of ["REF-PAHITTAD-1", "0000000000000000001", "900000009", "99999", "12.3 kg", "XX01", "00000000001"]) {
    assert.ok(!ut.includes(hemligt), `${hemligt} läckte ut ur tolkningen`);
  }
  assert.equal(s?.sistaLedNummer, "1000000001");
});

test("DSV blir sista ledet bara när GLS nämner DB Schenker eller DSV", () => {
  assert.equal(tolkaGlsSvar(SVAR)?.sistaLed, "DSV");
  const utan = structuredClone(SVAR);
  utan.tuStatus[0].references = utan.tuStatus[0].references.filter((r) => !/schenker/i.test(r.name));
  const s = tolkaGlsSvar(utan);
  assert.equal(s?.sistaLed, undefined);
  // Sändnings-id:t läses bara för ett DSV-paket.
  assert.equal(s?.sistaLedNummer, undefined);
  assert.equal(s?.handelser[0].beskrivning, "Paketet har kommit till en GLS-terminal.");

  // Byter GLS till DSV:s namn i referenserna känns paketet igen ändå.
  const nyttNamn = structuredClone(SVAR);
  nyttNamn.tuStatus[0].references = nyttNamn.tuStatus[0].references.map((r) =>
    ({ ...r, name: r.name.replace(/DB Schenker/i, "DSV") }));
  const dsv = tolkaGlsSvar(nyttNamn);
  assert.equal(dsv?.sistaLed, "DSV");
  assert.equal(dsv?.sistaLedNummer, "1000000001");
});

test("en svensk terminal är DSV:s, en tysk är GLS", () => {
  const sv = { partner: "DSV" as const, land: "SE" };
  const de = { partner: "DSV" as const, land: "DE" };
  assert.equal(oversattGls("The parcel has reached the parcel center.", sv)?.text, "Paketet har kommit till en terminal.");
  assert.equal(oversattGls("The parcel has reached the parcel center.", de)?.text, "Paketet har kommit till en GLS-terminal.");
  assert.equal(oversattGls("The parcel is on its way to the parcel center.", sv)?.text, "Paketet är på väg till en terminal.");
  assert.equal(oversattGls("The parcel is on its way to the parcel center.", de)?.text, "Paketet är på väg till en GLS-terminal.");
  assert.equal(oversattGls("The parcel is on its way to the parcel center.")?.text, "Paketet är på väg till en GLS-terminal.");
});

test("☠️ sändnings-id:t läses bara ur sin egen rad, och bara som siffror", () => {
  const med = (refs: Array<{ type: string; name: string; value: string }>) => {
    const svar = structuredClone(SVAR);
    svar.tuStatus[0].references = [
      { type: "GLSREF", name: "DB Schenker Sweden parcel number", value: "0000000000000000001" },
      ...refs,
    ];
    return tolkaGlsSvar(svar)?.sistaLedNummer;
  };
  assert.equal(med([{ type: "GLSREF", name: "Swedish shipment number", value: "1000000001" }]), "1000000001");
  // Avsändarens egen referens får aldrig läsas, hur den än heter.
  assert.equal(med([{ type: "CUSTREF", name: "Swedish shipment number", value: "1000000001" }]), undefined);
  assert.equal(med([{ type: "GLSREF", name: "Swedish shipment number", value: "REF-1000" }]), undefined);
  assert.equal(med([{ type: "GLSREF", name: "Origin National Reference in Unicode", value: "900000009" }]), undefined);
  assert.equal(med([]), undefined);
});

// Ordagranna GLS-texter för ett paket som DSV lämnade hos ett ombud (en
// handpump, 2026-10-12), i GLS ordning: nyast först. Uppmätt mot DSV:s
// spårning för samma paket: "Utkörning pågår" till ombudet, "tagits emot av
// ombudet, invänta avisering", "hämtat ut hos DSV ombud".
const OMBUD = [
  ["2026-10-12", "11:16:09", "The parcel has been delivered."],
  ["2026-10-12", "09:53:52", "The parcel has been delivered at the ParcelShop (see ParcelShop information)."],
  ["2026-10-12", "09:36:02", "The parcel has reached the ParcelShop."],
  ["2026-10-12", "09:14:02", "The parcel is expected to be delivered during the day."],
  ["2026-10-12", "03:10:44", "The parcel has reached the parcel center."],
  ["2026-10-09", "16:17:40", "The parcel has reached the parcel center."],
];

function dsvSvar(rader: string[][], statusInfo = "INTRANSIT") {
  const svar = structuredClone(SVAR);
  svar.tuStatus[0].history = rader.map(([date, time, evtDscr]) => ({
    date, time, evtDscr, address: { countryCode: "SE", city: "", countryName: "Sweden" },
  }));
  svar.tuStatus[0].progressBar = { statusInfo, retourFlag: false };
  return svar;
}

test("☠️ ombudet är DSV:s, och varje steg står på svenska", () => {
  const s = tolkaGlsSvar(dsvSvar(OMBUD, "DELIVERED"));
  assert.ok(s);
  assert.equal(s.satt, "ombud");
  assert.deepEqual(
    s.handelser.slice(0, 4).map((h) => [h.etikett, h.beskrivning]),
    [
      ["Levererad", "Paketet är hämtat hos DSV-ombudet."],
      ["Finns för upphämtning", "Paketet finns hos DSV-ombudet. Invänta avin från DSV innan du hämtar det."],
      ["Hos ombudet", "Paketet har kommit fram till DSV-ombudet."],
      ["På väg till ombudet", "Paketet är på väg till DSV-ombudet."],
    ],
  );
  // "The parcel has reached the ParcelShop." stod på engelska på /sparning.
  for (const h of s.handelser) assert.ok(h.beskrivning, `ingen svensk text för: ${h.original}`);
  assert.ok(!JSON.stringify(s.handelser.map((h) => h.beskrivning)).includes("GLS-ombud"));
});

test("på väg ut från terminalen lovar inte hemleverans innan ombudet syns", () => {
  // Paketet har lämnat terminalen men ombudet syns inte än: det kan vara på
  // väg till ett ombud, så raden säger inte "väntas komma i dag" hem till dig.
  const s = tolkaGlsSvar(dsvSvar(OMBUD.slice(3), "INDELIVERY"));
  assert.equal(s?.satt, undefined);
  assert.deepEqual(
    [s?.handelser[0].etikett, s?.handelser[0].beskrivning],
    ["Ute för leverans", "Paketet har lämnat terminalen och kommer fram i dag."],
  );
  // Utan DSV är det GLS egen utkörning, som förut.
  assert.equal(
    oversattGls("The parcel is expected to be delivered during the day.")?.text,
    "Paketet är ute för leverans och väntas komma i dag.",
  );
});

test("☠️ DSV:s bokning av leveransdag kallas inte 'ligger kvar'", () => {
  // Ordagrant GLS text för order 10082 (elkamin, 26 kg) kl 05:55 2026-10-15.
  // DSV:s spårning för samma paket: "Mottagaren aviseras om leverans. Du
  // kontaktas via SMS, E-post eller telefon för att komma överens om en
  // leveransdag."
  const text = "The parcel is stored in the parcel center to be delivered at a new delivery date.";
  assert.deepEqual(oversattGls(text, { partner: "DSV", land: "SE" }), {
    text: "DSV kontaktar dig via sms, e-post eller telefon för att boka leveransdag.",
    etikett: "Leveransen bokas",
  });
  // Ett ombudspaket bokas inte, en tysk terminal är inte DSV:s, och utan DSV
  // gäller GLS egen text.
  assert.equal(oversattGls(text, { partner: "DSV", ombud: true, land: "SE" })?.etikett, "Ny leveransdag");
  assert.equal(oversattGls(text, { partner: "DSV", land: "DE" })?.etikett, "Ny leveransdag");
  assert.equal(oversattGls(text)?.etikett, "Ny leveransdag");

  const s = tolkaGlsSvar(dsvSvar([
    ["2026-10-15", "05:57:22", "The parcel is stored in the parcel center."],
    ["2026-10-15", "05:55:44", text],
    ["2026-10-15", "04:55:10", "The parcel has reached the parcel center."],
  ]));
  assert.equal(s?.satt, "bokad");
  assert.equal(s?.handelser[1].etikett, "Leveransen bokas");
});

test("rutan och raden säger samma sak om bokningen", () => {
  // En tysk terminal som håller paketet en dag är ingen bokning hos DSV. Raden
  // säger "Ny leveransdag", och då får rutan inte säga att DSV bokar.
  const svar = dsvSvar([
    ["2026-10-13", "17:47:10", "The parcel is stored in the parcel center to be delivered at a new delivery date."],
  ]);
  svar.tuStatus[0].history[0].address.countryCode = "DE";
  const s = tolkaGlsSvar(svar);
  assert.equal(s?.handelser[0].etikett, "Ny leveransdag");
  assert.equal(s?.satt, undefined);
});

test("ett GLS-ombud utan DSV heter fortfarande GLS-ombud", () => {
  assert.equal(oversattGls("The parcel has reached the ParcelShop.")?.text, "Paketet har kommit fram till GLS-ombudet.");
  assert.equal(
    oversattGls("The parcel has been delivered at the ParcelShop (see ParcelShop information).")?.text,
    "Paketet finns att hämta hos ett GLS-ombud.",
  );
  assert.equal(oversattGls("The parcel has been delivered.", { ombud: true })?.text, "Paketet är hämtat hos GLS-ombudet.");
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
  const bygg = route.slice(route.indexOf("function buildGlsBody"), route.indexOf("function buildResponse"));
  assert.ok(bygg.length > 0, "buildGlsBody hittades inte");
  assert.match(bygg, /h\.beskrivning \?\? h\.original/, "en okänd GLS-text visas inte som GLS skrev den");
  assert.doesNotMatch(bygg, /toSwedish\(|PHRASE_SV|matchPhrase\(/, "GLS-texten går genom den allmänna översättningen igen");
});
