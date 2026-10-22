// Klassningen av el och batterier. Texterna är påhittade, men orden är de som
// står i Aosoms tyska produkttexter och i våra svenska namn.

import { describe, expect, it } from "vitest";
import { elOchBatteriSignaler, SIGNALORD } from "./el-och-batteri";

const ord = (...texter: string[]) => elOchBatteriSignaler(texter).map((s) => s.ord);

describe("elOchBatteriSignaler: träffar", () => {
  it.each([
    ["Kinderauto 12V mit Fernbedienung, Musik und LED-Scheinwerfern", ["Volt", "Fjärrkontroll", "LED", "Glödlampa", "Musik och ljud"]],
    ["Batteriebetrieben, 2 x AA Batterien nicht enthalten", ["Batteri"]],
    ["Akku-Laubbläser", ["Akku"]],
    ["Solarleuchte für den Garten", ["Solcell", "Leuchte"]],
    ["Elektrischer Kamin mit Flammeneffekt, 2000 W", ["Elektrisk", "Watt"]],
    ["TV-Schrank mit LED-Beleuchtung", ["LED", "Belysning"]],
    ["Aufstehsessel mit Massagefunktion und Wärmefunktion", ["Värme", "Massage"]],
    ["Höhenverstellbarer Schreibtisch, Motor", ["Motor"]],
    ["Filterpumpe für den Pool", ["Pump"]],
    ["Spiegelschrank mit Steckdose und USB-Anschluss", ["Stickkontakt", "USB"]],
    ["Stehlampe, Stecker und Kabel 1,5 m", ["Lampa", "Stickkontakt"]],
    ["Wasserpumpe für den Teich", ["Pump"]],
    ["Heizstrahler für die Terrasse", ["Värme"]],
    ["Standventilator mit Timer", ["Timer", "Fläkt"]],
    ["Mini-Kühlschrank, 48 L", ["Kyla"]],
    ["Wanduhr im Retro-Design", ["Klocka"]],
    ["Heimtrainer mit LCD-Display", ["Display", "Träningsmaskin"]],
    ["Kinderküche mit Licht und Geräuschen", ["Ljuseffekt", "Musik och ljud"]],
    ["Popcornmaschine im Retro-Stil", ["Hushållsapparat"]],
    ["Elbil för barn med fjärrkontroll", ["El-", "Fjärrkontroll"]],
    ["Golvlampa med tre skärmar", ["Lampa"]],
    ["Uppresningsfåtölj med motor och värmefunktion", ["Motor", "Värme"]],
    ["Laddbar ljusslinga", ["Laddbar", "Ljuseffekt"]],
  ])("%s", (text, vantat) => {
    expect(ord(text).sort()).toEqual([...vantat].sort());
  });

  it("läser alla texter tillsammans: en träff i beskrivningen räcker", () => {
    expect(ord("Gartenbank aus Holz", "Gartenmöbel", "Mit integrierter LED-Leiste")).toEqual(["LED"]);
  });

  it("varje etikett kommer en gång, hur många träffar texten än har", () => {
    expect(ord("LED", "LED-Leiste", "mit LED")).toEqual(["LED"]);
  });

  it("varje signal bär sin grupp", () => {
    expect(elOchBatteriSignaler(["Akku"])).toEqual([{ grupp: "batteri", ord: "Akku" }]);
  });
});

describe("elOchBatteriSignaler: kända falska träffar som ska utebli", () => {
  it.each([
    // Ljus i parasoll- och växthustexter.
    "Sonnenschirm mit UV-Schutz gegen Sonnenlicht",
    "Gewächshaus, lichtdurchlässige Folie für viel Tageslicht",
    "Kinderstuhl in leuchtenden Farben",
    // Vadderat, inte watt.
    "Wattierter Sitz mit dicker Polsterung",
    // Mått med W för bredd.
    "Gesamtmaße: 120 x 60W x 75H cm",
    "Abmessungen 60W cm",
    // Motorik är inte en motor, och en motorcykel kan trampas.
    "Fördert die Motorik und Koordination",
    "Leksak som tränar motoriken",
    "Tretmotorrad für Kinder",
    // Förzinkat stål.
    "Gerätehaus aus elektroverzinktem Stahl",
    "Hundekäfig, elektrolytisch verzinkt",
    // Tysta hjul och lådor.
    "Rollen sind geräuscharm, Schubladen geräuschlos",
    "Filtdynor som är ljuddämpande",
    // Manuella pumpar och pumpor.
    "Aufblasbares Boot inkl. Luftpumpe",
    "Höstdekoration pumpa",
    // Sinnesleksaker, inte sensorer.
    "Fördert die sensorische Entwicklung",
    // Laserskuren metall.
    "Gartendeko aus lasergeschnittenem Metall",
    // Ventilationsöppningar.
    "Kleintierstall mit Lüftungsfenstern",
    // Lufttillförsel och tid.
    "Transportbox mit guter Luftzufuhr",
    "Die Uhrzeit spielt keine Rolle",
    // Värmetålig, inte en värmare.
    "Värmebeständig bordsskiva",
    "Wärmedämmung aus Holz",
    // En massagebänk utan apparat.
    "Klappbare Massageliege aus Holz",
    // TV-bänk utan el: TV:n är inte varan.
    "TV-Bank für Fernseher bis 65 Zoll",
    // Dekorationer på pinne och dekorativa handpumpar.
    "Gartenstecker aus Metall, 3er Set",
    "Schwengelpumpe als Gartendeko",
    // En blandarkran är inget batteri.
    "Waschtisch mit Becken, Mischbatterie nicht im Lieferumfang",
  ])("%s", (text) => {
    expect(ord(text)).toEqual([]);
  });

  it("en tom eller saknad text ger inga signaler", () => {
    expect(elOchBatteriSignaler([])).toEqual([]);
    expect(elOchBatteriSignaler(["", null, undefined])).toEqual([]);
  });
});

describe("SIGNALORD", () => {
  it("listar varje etikett en gång", () => {
    expect(new Set(SIGNALORD).size).toBe(SIGNALORD.length);
    expect(SIGNALORD).toContain("LED");
    expect(SIGNALORD).toContain("Batteri");
  });
});
