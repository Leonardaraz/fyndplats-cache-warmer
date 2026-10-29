// Klassningen av el och batterier. Texterna är påhittade, men orden är de som
// står i Aosoms tyska produkttexter och i våra svenska namn. De falska träffarna
// under "kända falska träffar" är de former som stoppade sidor utan el i den
// första körningen (2026-10-22).

import { describe, expect, it } from "vitest";
import { elOchBatteriSignaler, klassaElOchBatteri, SIGNALORD, SVAGORD } from "./el-och-batteri";

const ord = (...texter: string[]) => elOchBatteriSignaler(texter).map((s) => s.ord);
const svaga = (...texter: string[]) => klassaElOchBatteri(texter).svaga.map((s) => s.ord);

describe("elOchBatteriSignaler: träffar", () => {
  it.each([
    ["Kinderauto 12V mit Fernbedienung, Musik und LED-Scheinwerfern", ["Volt", "Fjärrkontroll", "LED"]],
    ["Kinderauto mit 2,4G Fernbedienung und MP3-Anschluss", ["Fjärrkontroll", "Musik och ljud"]],
    ["Batteriebetrieben, 2 x AA Batterien nicht enthalten", ["Batteri"]],
    ["Lieferung ohne Batterien", ["Batteri"]],
    ["Akku-Laubbläser", ["Akku"]],
    ["Solarleuchte für den Garten", ["Solcell", "Leuchte"]],
    ["Elektrischer Kamin mit Flammeneffekt, 2000 W", ["Elektrisk", "Watt"]],
    ["Elektromotor mit 24 V", ["Elektrisk", "Volt", "Motor"]],
    ["TV-Schrank mit LED-Beleuchtung", ["LED", "Belysning"]],
    ["Aufstehsessel mit Massagefunktion und Wärmefunktion", ["Värme", "Massage"]],
    ["Höhenverstellbarer Schreibtisch, Motor", ["Motor"]],
    ["Filterpumpe für den Pool", ["Pump"]],
    ["Spiegelschrank mit Steckdose und USB-Anschluss", ["Stickkontakt", "USB"]],
    ["Stehlampe, Stecker und Kabel 1,5 m", ["Lampa", "Stickkontakt"]],
    ["Stehlampe mit E27-Fassung", ["Lampa", "Glödlampa"]],
    ["Wandleuchte und Pollerleuchte aus Metall", ["Leuchte"]],
    ["Wasserpumpe für den Teich", ["Pump"]],
    ["Heizstrahler für die Terrasse", ["Värme"]],
    ["Infrarot-Heizstrahler, 1500 W", ["Watt", "Värme"]],
    ["Standventilator mit Timer", ["Timer", "Fläkt"]],
    ["Mini-Kühlschrank, 48 L", ["Kyla"]],
    ["Wanduhr im Retro-Design", ["Klocka"]],
    ["Heimtrainer mit LCD-Display", ["Display"]],
    ["Kinderküche mit Licht und Geräuschen", ["Ljuseffekt", "Musik och ljud"]],
    ["Spielküche mit realistischen Geräuschen", ["Musik och ljud"]],
    ["Popcornmaschine im Retro-Stil", ["Hushållsapparat"]],
    ["Massagesessel mit Vibrationsmassage", ["Massage"]],
    ["Elbil för barn med fjärrkontroll", ["El-", "Fjärrkontroll"]],
    ["Barnbil med batteri och fjärrkontroll", ["Batteri", "Fjärrkontroll"]],
    ["Golvlampa med tre skärmar", ["Lampa"]],
    ["Uppresningsfåtölj med motor och värmefunktion", ["Motor", "Värme"]],
    ["Laddbar ljusslinga", ["Laddbar", "Ljuseffekt"]],
    ["Gungren i plysch med vaggvisa", ["Musik och ljud"]],
    ["Brödrost för fyra skivor", ["Hushållsapparat"]],
  ])("%s", (text, vantat) => {
    expect(ord(text).sort()).toEqual([...vantat].sort());
  });

  it("läser alla texter tillsammans: en träff i beskrivningen räcker", () => {
    expect(ord("Gartenbank aus Holz", "Gartenmöbel", "Mit integrierter LED-Leiste")).toEqual(["LED"]);
  });

  it("varje etikett kommer en gång, hur många träffar texten än har", () => {
    expect(ord("LED", "LED-Leiste", "mit LEDs")).toEqual(["LED"]);
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
    "Die Farben leuchten auch nach Jahren",
    "Pflanzen mit Licht versorgen",
    "Kunstbaum, geeignet für Lichterketten",
    "Spiegel, gut beleuchtet durch das Fenster",
    // Vadderat, inte watt.
    "Wattierter Sitz mit dicker Polsterung",
    // Mått med W för bredd.
    "Gesamtmaße: 120 x 60W x 75H cm",
    "Abmessungen 60W cm",
    // W och V före ett ord med å, ä, ö eller ü: \b såg det som ett helt ord.
    "Pokerset im Koffer mit 5 Würfel und 2 Kartenspielen",
    "Wäscheregal mit 2 Wäschekörben",
    "Vogelkäfig für 2 Vögel",
    // V-bromsar och V-ringar.
    "Kinderroller mit 2 V-Bremsen",
    "Sprungtuch mit 72 V-Ringen",
    // Motorik är inte en motor, och en motorcykel kan trampas.
    "Fördert die Motorik und Koordination",
    "Fördert die motorischen Fähigkeiten",
    "Leksak som tränar motoriken",
    "Tretmotorrad für Kinder",
    "Motorradgarage aus Oxford-Stoff",
    // Förzinkat, svetsat och lackerat stål.
    "Gerätehaus aus elektroverzinktem Stahl",
    "Hundekäfig, elektrolytisch verzinkt",
    "Pulverbeschichtet, elektrogeschweißt, mit Elektrotauchlackierung",
    // Utrymme för andras apparater.
    "Platz für Elektrogeräte, Elektronik und Elektrowerkzeuge",
    "Küchenschrank mit Mikrowellenfach und Platz für Kaffeemaschine und Toaster",
    "Schrank über der Waschmaschine",
    "Bezug in der Waschmaschine waschbar",
    "Rollwagen passt neben den Kühlschrank",
    "Nähtisch für Ihre Nähmaschine",
    // Tysta hjul, lådor och tak.
    "Rollen sind geräuscharm, Schubladen geräuschlos",
    "Filzgleiter verhindern Kratzer und Geräusche",
    "Dachbox, reduziert Windgeräusche",
    "Vordach dämpft Regengeräusche",
    "Filtdynor som är ljuddämpande",
    // Musik som inte är ljud från varan.
    "Notenständer für Musiker und Musikinstrumente",
    "Regal für Ihre Musik- und Filmsammlung",
    "Lautsprecherständer für Ihre Lautsprecher",
    // Fjärrkontrollen i soffans sidoficka.
    "Sofa mit Seitentaschen für Fernbedienungen und Zeitschriften",
    "Couchtisch mit Fach für Fernbedienung",
    "Gungstol med ficka för fjärrkontrollen",
    // Manuella pumpar och pumpor.
    "Aufblasbares Boot inkl. Luftpumpe",
    "Basketballständer mit Ball und Pumpe",
    "Höstdekoration pumpa",
    "Schwengelpumpe als Gartendeko",
    // Sinnesleksaker, inte sensorer.
    "Fördert die sensorische Entwicklung",
    // Laserskuren metall och en projektorduk.
    "Gartendeko aus lasergeschnittenem Metall",
    "Projektorleinwand 100 Zoll für Beamer und Projektoren",
    // Ventilationsöppningar och en gräsluftare.
    "Kleintierstall mit Lüftungsfenstern",
    "Rasenlüfter mit Spikewalze",
    // Lufttillförsel och tid.
    "Transportbox mit guter Luftzufuhr",
    "Die Uhrzeit spielt keine Rolle",
    "Rund um die Uhr geschützt",
    "Trehjuling med ringklocka",
    "Vit julgran med pynt – kulor, klockor och trummor",
    // Värmetålig, elementskydd, golvvärme, eldkorgar och grillar.
    "Värmebeständig bordsskiva",
    "Wärmedämmung aus Holz",
    "Heizkörperverkleidung aus MDF",
    "Teppich, geeignet für Fußbodenheizung",
    "Feuerschale als Heizquelle für kühle Abende",
    "Holzkohlegrill, schnell aufheizen",
    "Gasgrill mit drei Brennern à 3,5 kW, Piezo-Zündung",
    "Gas-Heizstrahler für die Terrasse",
    // Kylboxar med is.
    "Kühlbox ohne Strom, hält 72 Stunden kalt",
    "Kylbox 42,6 liter utan el",
    // En massagebänk och en stötdämpad boxningssäck.
    "Klappbare Massageliege aus Holz",
    "Federn dämpfen Vibrationen",
    // TV-bänk utan el: TV:n är inte varan.
    "TV-Bank für Fernseher bis 65 Zoll",
    "TV-Bank für LED-, LCD- und Plasma-Fernseher",
    "Monitorständer für LCD-Monitore bis 27 Zoll",
    // Dekorationer på pinne.
    "Gartenstecker aus Metall, 3er Set",
    // En blandarkran är inget batteri.
    "Waschtisch mit Becken, Mischbatterie nicht im Lieferumfang",
    // En solvärmd dusch och en lampa som inte följer med.
    "Gartendusche Solardusche 35 L",
    "Platz für eine Lampe und Bücher",
    "Zelt mit Lampenhaken",
    // Det varan inte behöver.
    "Funktioniert ganz ohne Batterien, rein mechanisch",
    "Benötigt keinen Strom",
    "Kein Akku nötig, reiner Pedalantrieb",
    "Åkhäst på hjul – utan batterier",
  ])("%s", (text) => {
    expect(ord(text)).toEqual([]);
  });

  it("en tom eller saknad text ger inga signaler", () => {
    expect(elOchBatteriSignaler([])).toEqual([]);
    expect(elOchBatteriSignaler(["", null, undefined])).toEqual([]);
  });
});

describe("klassaElOchBatteri: breda ord och utdrag", () => {
  it("ett brett ord som inte är en stark signal visas med utdrag", () => {
    const k = klassaElOchBatteri(["Sofa mit Seitentaschen für Fernbedienungen und Zeitschriften"]);
    expect(k.starka).toEqual([]);
    expect(k.svaga).toEqual([
      {
        grupp: "el",
        ord: "Fjärrkontroll",
        utdrag: "Sofa mit Seitentaschen für Fernbedienungen und Zeitschriften",
      },
    ]);
  });

  it("en etikett som redan är stark kommer inte igen bland de breda", () => {
    const k = klassaElOchBatteri(["Liegestuhl mit Fernbedienung und Seitentaschen für Fernbedienungen"]);
    expect(k.starka.map((t) => t.ord)).toEqual(["Fjärrkontroll"]);
    expect(k.svaga.map((t) => t.ord)).toEqual([]);
  });

  it("det som negationen tar bort syns bland de breda orden", () => {
    expect(svaga("Kühlbox ohne Strom, hält 72 Stunden kalt")).toEqual(["Ström", "Kyla"]);
    expect(svaga("Funktioniert ganz ohne Batterien")).toEqual(["Batteri"]);
  });

  it("utdraget kortas med … och visar texten runt träffen", () => {
    const text = `${"Ein langer Text über den Garten. ".repeat(5)}Mit LED-Beleuchtung. ${"Und noch mehr Text. ".repeat(5)}`;
    const [led] = klassaElOchBatteri([text]).starka;
    expect(led.ord).toBe("LED");
    expect(led.utdrag.startsWith("…")).toBe(true);
    expect(led.utdrag.endsWith("…")).toBe(true);
    expect(led.utdrag).toContain("Mit LED-Beleuchtung");
    expect(led.utdrag.length).toBeLessThanOrEqual(130);
  });

  it("☠️ ett artikelnummer i texten redigeras bort ur utdraget", () => {
    const [led] = klassaElOchBatteri(["Ersatzteil zu 845-030CG mit LED"]).starka;
    expect(led.utdrag).not.toContain("845-030CG");
    expect(led.utdrag).toContain("‹REDIGERAT›");
  });

  it("utdraget tas ur originaltexten, också när en negation stod nära", () => {
    const [b] = klassaElOchBatteri(["Funktioniert ohne Strom. Batterien nicht enthalten."]).starka;
    expect(b.ord).toBe("Batteri");
    expect(b.utdrag).toBe("Funktioniert ohne Strom. Batterien nicht enthalten.");
  });
});

describe("SIGNALORD och SVAGORD", () => {
  it("listar varje etikett en gång", () => {
    expect(new Set(SIGNALORD).size).toBe(SIGNALORD.length);
    expect(new Set(SVAGORD).size).toBe(SVAGORD.length);
    expect(SIGNALORD).toContain("LED");
    expect(SIGNALORD).toContain("Batteri");
    expect(SVAGORD).toContain("Träningsmaskin");
  });
});
