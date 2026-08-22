import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { collapseShipFromAxis, isShipAxis } from "./ship-axis";

// Måleritältet (AE 1005007857803500) som avslöjade problemet: fem storlekar ×
// fem EU-lager, alla ibockade av tillägget. Priserna är de riktiga från
// listningen 2026-08-18 — de skiljer sig kraftigt mellan lager på samma vara,
// vilket är hela poängen med att välja lager i stället för att låta kunden göra det.
const PRIS: Record<string, Record<string, number>> = {
  "10ft x 8.5ft x 8.5ft": { france: 267.55, "CZECH REPUBLIC": 267.55, Germany: 267.55, spain: 259.91, Poland: 267.55 },
  "23ft x 13ft x 9ft": { france: 711.67, "CZECH REPUBLIC": 671, Germany: 711.67, spain: 691.33, Poland: 711.67 },
  "30ft x 16ft x 12ft": { france: 838.63, "CZECH REPUBLIC": 831.21, Germany: 889.45, spain: 1017.37, Poland: 1017.37 },
  "33ft x 21ft x 15ft": { france: 1103.83, "CZECH REPUBLIC": 1103.83, Germany: 1103.83, spain: 1103.83, Poland: 1103.83 },
};

function maleritalt() {
  return Object.entries(PRIS).flatMap(([storlek, perLand]) =>
    Object.entries(perLand).map(([land, costUsd]) => ({
      options: { Size: storlek, "Ships From": land },
      costUsd,
    })),
  );
}

describe("collapseShipFromAxis", () => {
  it("flera lager → en variant per vara, ingen lager-rullista", () => {
    const r = collapseShipFromAxis(maleritalt());
    expect(r.applied).toBe(true);
    expect(r.variants).toHaveLength(4); // fyra storlekar, inte tjugo SKU:er
    expect(r.collapsed).toBe(16);
    const axlar = new Set(r.variants.flatMap((v) => Object.keys(v.options)));
    expect([...axlar]).toEqual(["Size"]); // "Ships From" får ALDRIG bli ett kundval
  });

  it("väljer billigaste lagret per vara — inte samma land för allt", () => {
    const r = collapseShipFromAxis(maleritalt());
    const perStorlek = Object.fromEntries(r.variants.map((v) => [v.options.Size, v]));
    // 23ft och 30ft är billigast i Tjeckien, 10ft i Spanien.
    expect(perStorlek["23ft x 13ft x 9ft"].costUsd).toBe(671);
    expect(perStorlek["23ft x 13ft x 9ft"].shipFrom).toBe("CZ");
    expect(perStorlek["30ft x 16ft x 12ft"].costUsd).toBe(831.21);
    expect(perStorlek["10ft x 8.5ft x 8.5ft"].costUsd).toBe(259.91);
    expect(perStorlek["10ft x 8.5ft x 8.5ft"].shipFrom).toBe("ES");
    // Att låsa allt till ETT land hade kostat 186 USD extra på 30-footern.
    expect(perStorlek["30ft x 16ft x 12ft"].costUsd).toBeLessThan(PRIS["30ft x 16ft x 12ft"].spain);
  });

  it("ETT lager lämnas orört — splitConstantAxes gör spec-raden som förut", () => {
    const en = [
      { options: { Size: "S", "Ships From": "spain" }, costUsd: 10 },
      { options: { Size: "M", "Ships From": "spain" }, costUsd: 12 },
    ];
    const r = collapseShipFromAxis(en);
    expect(r.applied).toBe(false);
    expect(r.variants).toEqual(en); // exakt samma innehåll, inget bortplockat
    expect(r.warehouses).toEqual(["ES"]);
  });

  it("delar de behållna varianterna lager behålls axeln (spec-raden överlever)", () => {
    // Två lager i listningen, men det billigaste/enda med saldo är samma för båda
    // varorna → kunden ska fortfarande få veta att det skickas från Spanien.
    const v = [
      { options: { Size: "S", "Ships From": "spain" }, costUsd: 10 },
      { options: { Size: "S", "Ships From": "Poland" }, costUsd: 20 },
      { options: { Size: "M", "Ships From": "spain" }, costUsd: 12 },
      { options: { Size: "M", "Ships From": "Poland" }, costUsd: 22 },
    ];
    const r = collapseShipFromAxis(v);
    expect(r.applied).toBe(true);
    expect(r.variants).toHaveLength(2);
    expect(r.variants.every((x) => x.options["Ships From"] === "spain")).toBe(true);
    expect(r.warehouses).toEqual(["ES"]);
  });

  it("slutsålt lager väljs bort även när det är billigare", () => {
    // Lärdomen från 2026-08-09: ren pris-/EU-först låste en variant på ett TOMT
    // lager medan ett annat hade saldo — varan blev osäljbar i butiken.
    const v = [
      { options: { Size: "S", "Ships From": "spain" }, costUsd: 10, stock: 0 },
      { options: { Size: "S", "Ships From": "Poland" }, costUsd: 20, stock: 40 },
      { options: { Size: "M", "Ships From": "Germany" }, costUsd: 15, stock: 5 },
    ];
    const r = collapseShipFromAxis(v);
    const s = r.variants.find((x) => x.options.Size === "S");
    expect(s?.shipFrom).toBe("PL");
    expect(s?.costUsd).toBe(20);
  });

  it("EU går före icke-EU även när icke-EU är billigare", () => {
    // US-raderna på måleritältet är billigast av alla (569,81 mot 671) men
    // ligger utanför EU: tull, längre väg och ingen EU-lager-ribbon.
    const v = [
      { options: { Size: "23ft", "Ships From": "United States" }, costUsd: 569.81 },
      { options: { Size: "23ft", "Ships From": "CZECH REPUBLIC" }, costUsd: 671 },
    ];
    const r = collapseShipFromAxis(v);
    expect(r.variants[0].shipFrom).toBe("CZ");
  });

  it("produkt utan lager-axel rörs inte alls", () => {
    const v = [{ options: { Färg: "Röd" }, costUsd: 5 }, { options: { Färg: "Blå" }, costUsd: 5 }];
    const r = collapseShipFromAxis(v);
    expect(r.applied).toBe(false);
    expect(r.variants).toEqual(v);
  });

  it("deterministisk — samma indata ger samma utdata", () => {
    const a = collapseShipFromAxis(maleritalt());
    const b = collapseShipFromAxis(maleritalt());
    expect(a.variants).toEqual(b.variants);
  });

  // LEONARDS FYND 2026-08-21 (SucceBuy-klädstället 1005005972133031): tilläggets
  // "EU-först" bockade i GB-rader, och pickWarehouse rankade dem lika bra som
  // spanska — poängen räknades på isEuCountry, som betyder "snabb leverans" och
  // räknar in GB/NO. Storbritannien lämnade tullunionen: tulldeklaration och
  // importmoms, kostnader som aldrig syns i marginalen.
  it("väljer ALDRIG ett brittiskt lager före ett inom tullunionen", () => {
    const r = collapseShipFromAxis([
      // GB är billigast OCH har saldo — enda skälet att välja Spanien är tullen.
      { options: { Size: "M", "Ships From": "United Kingdom" }, costUsd: 24.99, stock: 50 },
      { options: { Size: "M", "Ships From": "spain" }, costUsd: 29.99, stock: 50 },
    ]);
    expect(r.applied).toBe(true);
    expect(r.variants).toHaveLength(1);
    expect(r.variants[0].shipFrom).toBe("ES");
  });

  it("Norge räknas inte heller som tullunion", () => {
    const r = collapseShipFromAxis([
      { options: { Size: "M", "Ships From": "Norway" }, costUsd: 20, stock: 50 },
      { options: { Size: "M", "Ships From": "Poland" }, costUsd: 30, stock: 50 },
    ]);
    expect(r.variants[0].shipFrom).toBe("PL");
  });

  // Motvikten: saldo väger fortfarande tyngre än tullen. Ett tomt spanskt lager
  // är ingen vinst — varan blir bara osäljbar (lärdomen från audit 2026-08-09).
  it("saldo går före tullunionen — ett tomt EU-lager hjälper ingen", () => {
    const r = collapseShipFromAxis([
      { options: { Size: "M", "Ships From": "spain" }, costUsd: 29.99, stock: 0 },
      { options: { Size: "M", "Ships From": "United Kingdom" }, costUsd: 24.99, stock: 50 },
    ]);
    expect(r.variants[0].shipFrom).toBe("GB");
  });

  // Bara GB och Kina → ingen tullunion att föredra. Då avgör saldo och pris som
  // vanligt; produkten ska inte bli omöjlig att importera.
  it("utan tullunionsalternativ väljs det billigaste med saldo", () => {
    const r = collapseShipFromAxis([
      { options: { Size: "M", "Ships From": "United Kingdom" }, costUsd: 24.99, stock: 50 },
      { options: { Size: "M", "Ships From": "China" }, costUsd: 19.99, stock: 50 },
    ]);
    expect(r.variants[0].shipFrom).toBe("CN");
  });

  it("isShipAxis känner igen engelska, svenska OCH kinesiska formerna", () => {
    for (const n of [
      "Ships From",
      "ships from",
      "Ship Country",
      "Skickas från",
      "Levereras från",
      // AE renderar axelnamnen lokaliserat och faller tillbaka på kinesiska när
      // sidan inte översatts. Utan de här formerna behålls frakt-axeln i
      // signaturen på ena sidan medan den strippats på den andra — och just de
      // produkterna kan aldrig värdematchas (audit 2026-08-20).
      "发货地",
      "送货",
      "发货",
    ]) {
      expect(isShipAxis(n)).toBe(true);
    }
    for (const n of ["Färg", "Storlek", "Size", "Antal", "颜色", "尺寸"]) {
      expect(isShipAxis(n)).toBe(false);
    }
  });

  // Mönstret har drivit isär två gånger på två veckor: kopiorna i
  // variant-reconcile och mapping-repair saknade först de svenska och sedan de
  // kinesiska formerna. Nu IMPORTERAR de originalet — det här testet gör det
  // dyrt att smyga tillbaka en kopia.
  it("SHIP_AXIS_RE finns bara på ETT ställe i lib/", () => {
    const träffar = execSync(
      "grep -rn 'SHIP_AXIS_RE\\s*=' lib/ || true",
      { encoding: "utf8" },
    )
      .trim()
      .split("\n")
      .filter(Boolean);
    expect(träffar).toHaveLength(1);
    expect(träffar[0]).toMatch(/^lib\/import\/ship-axis\.ts:/);
  });
});
