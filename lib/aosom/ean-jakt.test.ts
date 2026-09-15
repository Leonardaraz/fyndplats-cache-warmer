import { describe, expect, it } from "vitest";
import {
  arGiltigGtin13,
  harTysktPrefix,
  pdfLankar,
  sokEan,
  sokEanIPdf,
  trettonsiffringar,
} from "./ean-jakt";

// ☠️ VARFOR DE HAR TESTERNA FINNS (2026-09-15).
//
// Aosoms EAN-kolumn ar tom pa 6 095 av 6 095 rader — matt, inte antaget, och
// den ligger som kolumn TVA sa den gar inte att missa. Samma matning visade en
// kolumn ingen last: `pdf`, ifylld pa 5 917 rader. En produktmanual trycker
// nastan alltid streckkoden, sa den ar den enda vagen till EAN som finns kvar
// utan att fraga Aosom.
//
// Faran ar inte att missa koden. Faran ar att HITTA en som inte finns: en
// slumpmassig trettonsiffring klarar GS1:s kontrollsiffra i ETT FALL AV TIO,
// och en PDF ar full av tal. En "traff" som i sjalva verket ar ett matt eller
// ett datum hade blivit en falsk GTIN i Merchant Center — sämre an ingen alls.

describe("arGiltigGtin13", () => {
  it("godkanner en riktig GS1-kod", () => {
    // 4250871216963 — dealproffsens kod for en Aosom-artikel, matt 2026-09-14.
    expect(arGiltigGtin13("4250871216963")).toBe(true);
  });

  it("faller nar kontrollsiffran ar fel", () => {
    expect(arGiltigGtin13("4250871216964")).toBe(false);
  });

  it("faller pa fel langd och pa icke-siffror", () => {
    expect(arGiltigGtin13("425087121696")).toBe(false);
    expect(arGiltigGtin13("42508712169633")).toBe(false);
    expect(arGiltigGtin13("42508712169a3")).toBe(false);
  });
});

describe("trettonsiffringar", () => {
  it("☠️ plockar ALDRIG tretton siffror ur en langre sekvens", () => {
    // Utan grinden hade ett tjugosiffrigt objekt-id i PDF:en gett atta
    // overlappande "kandidater", varav nagon klarar kontrollsiffran.
    expect(trettonsiffringar("00000000000000000000")).toEqual([]);
    expect(trettonsiffringar("x4250871216963x")).toEqual(["4250871216963"]);
  });

  it("hittar tal som star for sig", () => {
    expect(trettonsiffringar("EAN: 4250871216963\n4251774001000 st")).toEqual([
      "4250871216963",
      "4251774001000",
    ]);
  });
});

describe("harTysktPrefix", () => {
  it("400-440 ar tyska GS1-block", () => {
    expect(harTysktPrefix("4250871216963")).toBe(true);
    expect(harTysktPrefix("4009900000000")).toBe(true);
  });

  it("⚠️ svenska (730-739) och kinesiska (690-699) block ar inte tyska", () => {
    // Inte ett fel — bara ett svagare indicium. Aosom ar en tysk leverantor
    // och de matta koderna for deras artiklar ligger pa 425x.
    expect(harTysktPrefix("7350000000000")).toBe(false);
    expect(harTysktPrefix("6901234567890")).toBe(false);
  });
});

describe("sokEan", () => {
  it("skiljer signal fran brus — rapporterar bada talen", () => {
    const fynd = sokEan([
      "matt 1234567890123 och 9876543210987",  // brus
      "EAN 4250871216963",                      // signal
    ]);
    expect(fynd.kandidater).toBe(3);
    expect(fynd.tyska).toEqual(["4250871216963"]);
  });

  it("☠️ samma kod pa tva stallen raknas EN gang i fyndet", () => {
    // Annars ser en manual som trycker koden pa varje sida ut som tjugo
    // fynd — ett tal som later som bevis och inte ar det.
    const fynd = sokEan(["4250871216963", "sid 2: 4250871216963"]);
    expect(fynd.kandidater).toBe(2);
    expect(fynd.giltiga).toEqual(["4250871216963"]);
  });

  it("en tom manual ger noll — och det ar ett svar, inte ett fel", () => {
    expect(sokEan([]).giltiga).toEqual([]);
  });
});

describe("pdfLankar", () => {
  const csv = [
    "SKU,EAN,Name,pdf",
    "845-030CG,,Bod,https://example.test/a.pdf",
    "845-031CG,,Bod 2,",
    "845-032CG,,Bod 3,https://example.test/c.pdf",
  ].join("\n");

  it("laser kolumnen ur RUBRIKRADEN, inte ur AosomRow", () => {
    // ⚠️ `parseAosomFeed` plockar bara falt den kanner vid namn, och
    // `AosomRow` har inget pdf-falt — precis samma blinda flack som gjorde
    // att ingen nagonsin last EAN-kolumnen.
    expect(pdfLankar(csv, 10)).toEqual([
      "https://example.test/a.pdf",
      "https://example.test/c.pdf",
    ]);
  });

  it("hoppar over tomma celler och respekterar antalet", () => {
    expect(pdfLankar(csv, 1)).toEqual(["https://example.test/a.pdf"]);
  });

  it("saknas kolumnen svarar den tomt i stallet for att gissa", () => {
    expect(pdfLankar("SKU,Name\n845-030CG,Bod", 10)).toEqual([]);
  });
});

describe("sokEanIPdf", () => {
  const zlib = require("node:zlib") as typeof import("node:zlib");

  function pdf(strommar: readonly Buffer[], rått = ""): Buffer {
    const delar: Buffer[] = [Buffer.from(`%PDF-1.4\n${rått}\n`, "latin1")];
    for (const s of strommar) {
      delar.push(Buffer.from("stream\n", "latin1"), s, Buffer.from("\nendstream\n", "latin1"));
    }
    return Buffer.concat(delar);
  }

  it("packar upp en Flate-strom och hittar koden i den", () => {
    const ut = sokEanIPdf(pdf([zlib.deflateSync(Buffer.from("(EAN 4250871216963) Tj"))]));
    expect(ut.upppackade).toBe(1);
    expect(ut.tyska).toEqual(["4250871216963"]);
  });

  it("laser aven RATEXTEN — metadata ar ofta opackad", () => {
    expect(sokEanIPdf(pdf([], "/GTIN (4250871216963)")).tyska).toEqual(["4250871216963"]);
  });

  it("☠️ HOPPAR OVER EN FOR STOR STROM i stallet for att packa upp den", () => {
    // Varfor det har testet finns: forsta versionen packade upp VARJE strom,
    // inklusive bilderna. En Flate-packad bild expanderar tiotals ganger, och
    // lambdan dog med `instance was killed because it ran out of available
    // memory` — en dod som INTE gar via try/catch, for processen tar slut i
    // stallet for att kasta. Samma familj som den obegransade fan-outen i
    // runDailySync, som lag nere i 57 timmar.
    const stor = zlib.deflateSync(Buffer.alloc(3_000_000, 0x41));
    const fyllnad = Buffer.alloc(2_100_000, 0x42);      // over MAX_STROM_BYTE
    const ut = sokEanIPdf(pdf([Buffer.concat([stor, fyllnad])]));
    expect(ut.forStora).toBe(1);
    expect(ut.upppackade).toBe(0);
  });

  it("⚠️ en trasig strom ar inte ett fel — ratexten tacker den anda", () => {
    const ut = sokEanIPdf(pdf([Buffer.from("inte packad alls", "latin1")]));
    expect(ut.strommar).toBe(1);
    expect(ut.upppackade).toBe(0);
    expect(ut.forStora).toBe(0);
  });
});
