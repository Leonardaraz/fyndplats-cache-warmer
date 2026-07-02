import { describe, expect, it } from "vitest";
import {
  translateAxisName,
  translateValue,
  translateVariantOptions,
  translateOptionColorCodes,
  buildVariantTranslator,
  buildTranslatorFromBase,
  residualEnglishTokens,
  isSizeLikeAxis,
  inferMislabeledColorAxis,
} from "./variant-translations";

describe("translateAxisName", () => {
  it("översätter kända axlar", () => {
    expect(translateAxisName("Color")).toBe("Färg");
    expect(translateAxisName("Colour")).toBe("Färg");
    expect(translateAxisName("Size")).toBe("Storlek");
    expect(translateAxisName("Material")).toBe("Material");
  });

  it("strippar kolon-suffix före uppslag", () => {
    // AE skickar ibland axeln som "name: value" — vi vill bara axeln.
    expect(translateAxisName("Color: F2025-Sverige")).toBe("Färg");
    expect(translateAxisName("Size：XL")).toBe("Storlek"); // fullbredds-kolon
  });

  it("är skiftlägesokänslig och trimmar", () => {
    expect(translateAxisName("  COLOR  ")).toBe("Färg");
  });

  it("faller tillbaka på råvärdet för okänd axel", () => {
    expect(translateAxisName("Sparkle Level")).toBe("Sparkle Level");
  });
});

describe("translateValue", () => {
  it("översätter kända färger och material (fullt match)", () => {
    expect(translateValue("Red")).toBe("Röd");
    expect(translateValue("Black")).toBe("Svart");
    expect(translateValue("Light Blue")).toBe("Ljusblå");
    expect(translateValue("Stainless Steel")).toBe("Rostfritt stål");
  });

  it("lämnar universella storlekar oförändrade", () => {
    expect(translateValue("5XL")).toBe("5XL");
    expect(translateValue("M")).toBe("M");
    expect(translateValue("XXL")).toBe("XXL");
  });

  it("översätter bara första ordet vid partiellt match", () => {
    // "Pink Diamond" → "Rosa Diamond" (första ordet matchar, resten orört).
    expect(translateValue("Pink Diamond")).toBe("Rosa Diamond");
    expect(translateValue("Blue Edition")).toBe("Blå Edition");
  });

  it("faller tillbaka på råvärdet utan match", () => {
    expect(translateValue("F2025-Sverige")).toBe("F2025-Sverige");
    expect(translateValue("Vortex")).toBe("Vortex");
  });

  it("översätter ALLA kända ord token-vis, inte bara det första", () => {
    expect(translateValue("Black with LED")).toBe("Svart med LED");
    expect(translateValue("Black without LED")).toBe("Svart utan LED");
    expect(translateValue("33-Grey")).toBe("33-Grå"); // bindestreck bevaras
    expect(translateValue("B6AC Blue")).toBe("B6AC Blå"); // kod-prefix orört
    expect(translateValue("100 inch")).toBe("100 tum"); // enhet → svenska vid import
    expect(translateValue("120 Inches")).toBe("120 tum");
  });

  it("översätter den utökade ordlistan (enheter, tillbehör, kvalificerare)", () => {
    // Enheter & antal
    expect(translateValue("6 Feet")).toBe("6 fot");
    expect(translateValue("1 Pair")).toBe("1 par");
    // Universalstorlek (fasta fraser, fullt match)
    expect(translateValue("Free Size")).toBe("Universalstorlek");
    expect(translateValue("One Size")).toBe("Universalstorlek");
    // "With X"-tillbehör (utnyttjar "with"→"med"). Innehållsord behåller sin
    // versal från tabellen → "Med Batteri" (samma mönster som "Bomull Läder").
    expect(translateValue("With Battery")).toBe("Med Batteri");
    expect(translateValue("Wireless Charger")).toBe("Trådlös Laddare");
    // Kvalificerare
    expect(translateValue("Foldable")).toBe("Hopfällbar");
    expect(translateValue("Waterproof")).toBe("Vattentät");
    // "remote control" som HEL fras (inte löst "remote")
    expect(translateValue("Remote Control")).toBe("Fjärrkontroll");
  });

  it("rör INTE tvetydiga fraser där en lös översättning vore fel", () => {
    // "right"/"left"/"wide"/"deep" är medvetet utelämnade ur tabellen, så dessa
    // idiom förblir orörda i stället för att fel-översättas token-vis.
    expect(translateValue("Right Angle")).toBe("Right Angle");
    expect(translateValue("Wide Angle")).toBe("Wide Angle");
    // "remote" finns BARA som fras → "With Remote Control" blir "Med Remote
    // Control" (korrekt halv-översatt), aldrig "Med Fjärrkontroll Control".
    expect(translateValue("With Remote Control")).toBe("Med Remote Control");
  });

  it("översätter djur, instrument och kontakttyper", () => {
    expect(translateValue("Lion")).toBe("Lejon");
    expect(translateValue("Rabbit")).toBe("Kanin");
    expect(translateValue("EU Plug")).toBe("EU-kontakt");
    expect(translateValue("Touchscreen model")).toBe("Pekskärmsmodell");
  });

  it("lämnar modellnamn, berlock-text och koder orörda", () => {
    expect(translateValue("iPhone 15 Pro")).toBe("iPhone 15 Pro");
    expect(translateValue("LOVE")).toBe("LOVE");
    expect(translateValue("KM-6631")).toBe("KM-6631");
    expect(translateValue("KID110")).toBe("KID110");
    expect(translateValue("Care Bear")).toBe("Care Bear"); // 'bear' översätts ej
  });

  it("full paritet med storefront-ordboken på sammansatta fraser", () => {
    expect(translateValue("Army Green")).toBe("Armégrön");
    expect(translateValue("Sky Blue")).toBe("Himmelsblå");
    expect(translateValue("Type-C to USB-A")).toBe("Type-C till USB-A");
    expect(translateValue("Gym with Tent")).toBe("Gym med tält");
    expect(translateValue("5pc Sets 3")).toBe("5-delars set 3");
    expect(translateValue("Squirrel Maracas")).toBe("Maracas, ekorre");
  });
});

describe("translateVariantOptions", () => {
  it("översätter både axelnamn och värden i ett record", () => {
    expect(
      translateVariantOptions({ Color: "Red", Size: "5XL" }),
    ).toEqual({ Färg: "Röd", Storlek: "5XL" });
  });
});

describe("translateOptionColorCodes", () => {
  it("remappar färgkods-tabellen till översatta nycklar", () => {
    expect(
      translateOptionColorCodes({ Color: { Red: "#ff0000", Black: "#000000" } }),
    ).toEqual({ Färg: { Röd: "#ff0000", Svart: "#000000" } });
  });
});

describe("buildVariantTranslator — kollisions-säker (dark/deep blue förblir distinkta)", () => {
  it("håller distinkta råvärden distinkta även när de annars översätts lika", () => {
    const variants = [
      { options: { Color: "Dark Blue" } },
      { options: { Color: "Deep Blue" } },
      { options: { Color: "Red" } },
    ];
    const t = buildVariantTranslator(variants);
    const a = t.options({ Color: "Dark Blue" }).Färg;
    const b = t.options({ Color: "Deep Blue" }).Färg;
    expect(a).not.toBe(b); // INTE samma → varianterna kollapsar inte i deriveOptions
    expect(a).toBe("Mörkblå"); // första behåller ren översättning
    expect(b).toContain("Mörkblå"); // andra särskiljs (råvärdet i suffix)
    expect(t.options({ Color: "Red" }).Färg).toBe("Röd");
  });

  it("axisKeyedMap remappar colorCodes med SAMMA distinkta nycklar (bägge hex överlever)", () => {
    const variants = [{ options: { Color: "Dark Blue" } }, { options: { Color: "Deep Blue" } }];
    const t = buildVariantTranslator(variants);
    const codes = t.axisKeyedMap({ Color: { "Dark Blue": "#001", "Deep Blue": "#002" } });
    expect(Object.keys(codes.Färg).length).toBe(2); // ingen "sista vinner"-kollaps
    expect(codes.Färg[t.options({ Color: "Dark Blue" }).Färg]).toBe("#001");
    expect(codes.Färg[t.options({ Color: "Deep Blue" }).Färg]).toBe("#002");
  });

  it("icke-kolliderande/okända värden översätts som vanligt", () => {
    const t = buildVariantTranslator([{ options: { Size: "XL" } }, { options: { Size: "S" } }]);
    expect(t.options({ Size: "XL" })).toEqual({ Storlek: "XL" });
    expect(t.options({ Size: "S" })).toEqual({ Storlek: "S" });
  });

  it("unik även när disambig-formen själv krockar (audit F1)", () => {
    const raws = ["Mörkblå 2", "dark blue", "deep blue", "deep blue "]; // sista två är distinkta råsträngar
    const t = buildVariantTranslator(raws.map((r) => ({ options: { Color: r } })));
    const out = raws.map((r) => t.options({ Color: r }).Färg);
    expect(new Set(out).size).toBe(4); // alla fyra distinkta → ingen variant-kollaps
  });
});

// --- GOLDEN: lås känt-korrekta översättningar + fäll-fixar i CI. Varje framtida
//     ändring i tabellen som bryter en av dessa fäller bygget. Det här ÄR
//     "auditen som permanent kod" — den glömmer aldrig en läxa. ---
describe("golden — fäll-fixar, LED och orörda idiom (lås i CI)", () => {
  const cases: Array<[string, string]> = [
    // Fäll-fixar (audit 2026-06): hela frasen vinner över token-vis fel-översättning.
    ["Spring Steel", "Fjäderstål"],
    ["Wine Glass", "Vinglas"],
    ["Bone China", "Benporslin"],
    ["Coffee Maker", "Kaffebryggare"],
    ["Coffee Cup", "Kaffekopp"],
    ["Iron Box", "Strykjärn"],
    ["Steam Iron", "Ångstrykjärn"],
    // LED-färgtemperatur (fasta fraser → helt svenska, inte "Warm Vit").
    ["Warm White", "Varmvit"],
    ["Cool White", "Kallvit"],
    ["Natural White", "Naturvit"],
    ["Warm Light", "Varmt ljus"],
    ["White Light", "Vitt ljus"],
    // De omgivande BARA-orden behåller sin giltiga färg-/säsongs-användning.
    ["Spring", "Vår"],
    ["Wine", "Vinröd"],
    ["Coffee", "Kaffebrun"],
    ["Iron", "Järn"],
    // Medvetet UTELÄMNADE tvetydiga ord → idiomet lämnas orört (aldrig fel-översatt).
    ["Right Angle", "Right Angle"],
    ["Wide Angle", "Wide Angle"],
  ];
  it.each(cases)("translateValue(%j) === %j", (input, expected) => {
    expect(translateValue(input)).toBe(expected);
  });
});

// --- GOLDEN 2 (djup utbyggnad 2026-07, lekhage-fyndet): enheter, antal och
//     de nya fäll-fixarna. Samma kontrakt som ovan — bryts en rad fälls CI. ---
describe("golden — enheter, antal & djup utbyggnad (lås i CI)", () => {
  const cases: Array<[string, string]> = [
    // Triggerfallet: kvadrattum-storlekar (lekhagen 147f159f) blev rå-engelska
    // OCH flaggades aldrig (såg ut som kod). Nu deterministiskt svenska.
    ["4500-5500sq.in.", "4500-5500 kvadrattum"],
    ["5500sq.in.", "5500 kvadrattum"],
    ["3 Square Meters", "3 kvadratmeter"],
    // Dimensionskedjor & tum-varianter
    ["78.7x58.7in", "78.7x58.7 tum"],
    ["42 in.", "42 tum"],
    // Fot & antal (nummer-ankrat, även glued)
    ["6ft", "6 fot"],
    ["3 Feet", "3 fot"],
    ["2pcs", "2 st"],
    ["25 Pieces", "25 st"],
    ["Set of 3", "Set om 3"],
    ["Pack of 2", "2-pack"],
    // Vikt kräver OMRÄKNING (inte namnbyte) → lämnas medvetet → AI/polering.
    ["5 lbs", "5 lbs"],
    // Fras-skydd: fasta fraser med pc/pcs-former bryts INTE av count-regeln
    // (fullt uppslag på råvärdet sker FÖRE normalizeUnits).
    ["1pc 8MP POE Camera", "1 st 8MP POE-kamera"],
    ["5pc Sets 3", "5-delars set 3"],
    // Nya fäll-fixar: hel fras vinner över token-vis fel-översättning.
    ["Solid Wood", "Massivt trä"],
    ["Solid Color", "Enfärgad"],
    ["Solid", "Solid"], // ensamt tvetydigt → orört
    ["Hot Dog", "Varmkorv"],
    ["Cat 6", "Cat 6"], // nätverkskabel, inte "Katt 6"
    ["Apple Watch", "Apple Watch"], // varumärke orört (apple medvetet utelämnat)
    ["New York", "New York"], // stadsnamn, inte "Ny York"
    ["Type-C", "Type-C"], // USB-namn skyddat som fras …
    ["Type A", "Typ A"], // … men generisk stil-variant token-översätts
    ["USB Type-C", "USB Type-C"],
    ["Spare Parts", "Reservdelar"], // kompound-fras, inte "Reserv delar"
    ["Ice Cream", "Glass"], // inte "Ice Gräddvit"; bart "Cream" lämnas orört …
    ["Cream", "Cream"], // … (färg/glass/hudkräm är tvetydigt → AI/polering)
    ["Mat Black", "Mattsvart"], // AE-stavfel för matte, inte "Matta Svart"
    ["Hook and Loop", "Kardborre"], // stängningstyp, inte "Krok och Loop"
    // Nya ord & fraser (stickprov över grupperna)
    ["Cat", "Katt"],
    ["Unicorn", "Enhörning"],
    ["Dinosaur", "Dinosaurie"],
    ["Tempered Glass", "Härdat glas"],
    ["Aluminum Alloy", "Aluminiumlegering"],
    ["As Picture", "Som på bilden"],
    ["Machine Washable", "Maskintvättbar"],
    ["Cordless", "Sladdlös"],
    ["With Light", "Med belysning"], // fras, inte token-vis "med Ljus"
    ["With Lid", "Med lock"],
    ["3 Tier", "3 våningar"],
    ["Mute", "Tyst"],
    ["Dimmable", "Dimbar"],
    ["Lake Blue", "Sjöblå"],
    ["Off White", "Benvit"],
  ];
  it.each(cases)("translateValue(%j) === %j", (input, expected) => {
    expect(translateValue(input)).toBe(expected);
  });
});

describe("residualEnglishTokens", () => {
  it("tomt för värden som tabellen (fullt) hanterar", () => {
    expect(residualEnglishTokens("Red")).toEqual([]);
    expect(residualEnglishTokens("Spring Steel")).toEqual([]); // fras → full match
    expect(residualEnglishTokens("Warm White")).toEqual([]);
    expect(residualEnglishTokens("Black with LED")).toEqual([]); // black/with kända, LED = akronym
  });
  it("tomt för koder/mått/storlekar (inte engelska ord)", () => {
    expect(residualEnglishTokens("5XL")).toEqual([]);
    expect(residualEnglishTokens("M")).toEqual([]);
    expect(residualEnglishTokens("XXL")).toEqual([]); // versal-akronym
    expect(residualEnglishTokens("KM-6631")).toEqual([]);
    expect(residualEnglishTokens("B6AC")).toEqual([]);
  });
  it("flaggar genuint oöversatta engelska ord (→ AI-kandidat)", () => {
    expect(residualEnglishTokens("Glow Mode")).toEqual(["Glow", "Mode"]);
    expect(residualEnglishTokens("iPhone 15 Pro")).toEqual(["iPhone", "Pro"]);
  });
});

describe("buildTranslatorFromBase — injicerbar bas (delas av AI-fallbacken)", () => {
  it("använder den injicerade översättningen och behåller kollisions-säkerheten", () => {
    const base = (raw: string) => (raw === "Glow" ? "Glöd" : translateValue(raw));
    const t = buildTranslatorFromBase([{ options: { Color: "Red", Effect: "Glow" } }], base, translateAxisName);
    expect(t.options({ Color: "Red", Effect: "Glow" })).toEqual({ Färg: "Röd", Effect: "Glöd" });
  });

  it("axisOverrides namnger okänd icke-färg-axel; deterministisk klass vinner över override", () => {
    const ov = new Map([["Color", "Material"]]);
    // okänd klass (material): ingen deterministisk träff → AI-override "Material"
    const t1 = buildTranslatorFromBase([{ options: { Color: "Cotton" } }], translateValue, translateAxisName, ov);
    expect(t1.options({ Color: "Cotton" })).toEqual({ Material: "Bomull" });
    // storlek matchar en deterministisk klass → vinner över override
    const t2 = buildTranslatorFromBase([{ options: { Color: "42 inch" } }], translateValue, translateAxisName, ov);
    expect(t2.options({ Color: "42 inch" })).toEqual({ Storlek: "42 tum" });
  });
});

describe("isSizeLikeAxis — felmärkt 'Color'-axel med storlekar", () => {
  it("true när ALLA värden är mått/storlekar", () => {
    expect(isSizeLikeAxis(["42 in", "50 in"])).toBe(true);
    expect(isSizeLikeAxis(["42 inch", "50 inch"])).toBe(true);
    expect(isSizeLikeAxis(["10 cm"])).toBe(true);
    expect(isSizeLikeAxis(["S", "M", "L"])).toBe(true);
    expect(isSizeLikeAxis(["5XL"])).toBe(true);
    expect(isSizeLikeAxis(['12"'])).toBe(true);
  });
  it("false för färger, blandat och tomt", () => {
    expect(isSizeLikeAxis(["Red", "Blue"])).toBe(false);
    expect(isSizeLikeAxis(["42 in", "Black"])).toBe(false); // blandat → orört
    expect(isSizeLikeAxis(["Style A", "Style B"])).toBe(false);
    expect(isSizeLikeAxis([])).toBe(false);
  });
});

describe("translateValue — tum-enheter (nummer-ankrat, säkert)", () => {
  it("normaliserar entydiga tum-former", () => {
    expect(translateValue("42 in")).toBe("42 tum");
    expect(translateValue("50 inch")).toBe("50 tum");
    expect(translateValue('12"')).toBe("12 tum");
  });
  it("rör INTE löst 'in' (preposition)", () => {
    expect(translateValue("5 in 1")).toBe("5 in 1");
    expect(translateValue("Built-in")).toBe("Built-in");
  });
});

describe("inferMislabeledColorAxis — hela icke-färg-klassen under 'Color'", () => {
  it("klassificerar storlek/kontakt/antal/spänning/lagring/volym", () => {
    expect(inferMislabeledColorAxis(["42 in", "50 in"])).toBe("Storlek");
    expect(inferMislabeledColorAxis(["S", "M", "L"])).toBe("Storlek");
    expect(inferMislabeledColorAxis(["EU Plug", "US Plug"])).toBe("Kontakt");
    expect(inferMislabeledColorAxis(["1 PCS", "2 Pcs"])).toBe("Antal");
    expect(inferMislabeledColorAxis(["Set of 3", "Set of 5"])).toBe("Antal");
    expect(inferMislabeledColorAxis(["110V", "220V"])).toBe("Spänning");
    expect(inferMislabeledColorAxis(["64GB", "128GB"])).toBe("Lagring");
    expect(inferMislabeledColorAxis(["500ml", "1.5L"])).toBe("Volym");
  });
  it("returnerar null (behåll 'Färg') för färger, blandat och tomt", () => {
    expect(inferMislabeledColorAxis(["Red", "Blue"])).toBeNull();
    expect(inferMislabeledColorAxis(["Champagne", "Ivory"])).toBeNull(); // exotiska färger → orört
    expect(inferMislabeledColorAxis(["EU Plug", "Red"])).toBeNull(); // blandat
    expect(inferMislabeledColorAxis(["2 PCS Red", "3 PCS Blue"])).toBeNull(); // antal+färg → behåll Färg (audit N1)
    expect(inferMislabeledColorAxis([])).toBeNull();
  });
});

describe("buildVariantTranslator — döper om felmärkt 'Color'-axel (hela klassen)", () => {
  it("storlekar under 'Color' → 'Storlek', enheter → svenska", () => {
    const t = buildVariantTranslator([{ options: { Color: "42 inch" } }, { options: { Color: "50 inch" } }]);
    expect(t.options({ Color: "42 inch" })).toEqual({ Storlek: "42 tum" });
    expect(t.options({ Color: "50 inch" })).toEqual({ Storlek: "50 tum" });
  });
  it("kontakttyper under 'Color' → 'Kontakt'", () => {
    const t = buildVariantTranslator([{ options: { Color: "EU Plug" } }, { options: { Color: "US Plug" } }]);
    expect(t.options({ Color: "EU Plug" })).toEqual({ Kontakt: "EU-kontakt" });
  });
  it("antal under 'Color' → 'Antal'", () => {
    const t = buildVariantTranslator([{ options: { Color: "1 PCS" } }, { options: { Color: "2 PCS" } }]);
    expect(t.options({ Color: "1 PCS" })).toEqual({ Antal: "1 st" });
  });
  it("låter en ÄKTA färgaxel vara 'Färg'", () => {
    const t = buildVariantTranslator([{ options: { Color: "Red" } }, { options: { Color: "Blue" } }]);
    expect(t.options({ Color: "Red" })).toEqual({ Färg: "Röd" });
  });
  it("rör inte en blandad axel (en riktig färg bland värdena avbryter omdöpningen)", () => {
    const t = buildVariantTranslator([{ options: { Color: "Red" } }, { options: { Color: "42 inch" } }]);
    expect(t.options({ Color: "Red" }).Färg).toBe("Röd"); // axeln förblir 'Färg'
  });
  it("AI-vägen (injicerad bas via buildTranslatorFromBase) får samma omdöpning", () => {
    const t = buildTranslatorFromBase(
      [{ options: { Color: "42 inch" } }, { options: { Color: "50 inch" } }],
      translateValue,
      translateAxisName,
    );
    expect(t.options({ Color: "42 inch" })).toEqual({ Storlek: "42 tum" });
  });
});

// --- Djup utbyggnad 2026-07: nya axelnamn, axelklasser och måttformer ---

describe("translateAxisName — utökade axlar", () => {
  it("översätter de nya AE-axlarna", () => {
    expect(translateAxisName("Emitting Color")).toBe("Ljusfärg");
    expect(translateAxisName("Cable Length")).toBe("Kabellängd");
    expect(translateAxisName("Applicable Age")).toBe("Ålder");
    expect(translateAxisName("Load Capacity")).toBe("Maxbelastning");
    expect(translateAxisName("Wood Type")).toBe("Träslag");
    expect(translateAxisName("Compatible Model")).toBe("Passar modell");
  });
});

describe("isSizeLikeAxis — dimensionskedjor, intervall & ytenheter", () => {
  it("true för lekhage-fallets värden och dimensionskedjor", () => {
    expect(isSizeLikeAxis(["4500-5500sq.in.", "5500sq.in."])).toBe(true);
    expect(isSizeLikeAxis(["78.7x58.7in", "78.7x70.3in"])).toBe(true);
    expect(isSizeLikeAxis(["50-60 inch"])).toBe(true);
  });
  it("false förblir false för färger/stilar", () => {
    expect(isSizeLikeAxis(["Lake Blue", "Off White"])).toBe(false);
  });
});

describe("inferMislabeledColorAxis — effekt, färgtemperatur & kapacitet", () => {
  it("klassificerar W/K/mAh-värden under 'Color'", () => {
    expect(inferMislabeledColorAxis(["10W", "20W"])).toBe("Effekt");
    expect(inferMislabeledColorAxis(["3000K", "6500K"])).toBe("Ljusfärg");
    expect(inferMislabeledColorAxis(["2000mAh", "5000mAh"])).toBe("Kapacitet");
  });
  it("guldkarat ('18K') träffas INTE av Kelvin-klassen", () => {
    expect(inferMislabeledColorAxis(["18K", "24K"])).toBeNull();
  });
});

describe("buildVariantTranslator — lekhage-fallet ände-till-ände", () => {
  it("kvadrattum-storlekar blir svenska och axeln 'Storlek' behålls/sätts", () => {
    // Som axeln faktiskt kom ("Size") …
    const t1 = buildVariantTranslator([
      { options: { Size: "4500-5500sq.in." } },
      { options: { Size: "5500sq.in." } },
    ]);
    expect(t1.options({ Size: "4500-5500sq.in." })).toEqual({ Storlek: "4500-5500 kvadrattum" });
    expect(t1.options({ Size: "5500sq.in." })).toEqual({ Storlek: "5500 kvadrattum" });
    // … och felmärkt under "Color" → omdöps deterministiskt till "Storlek".
    const t2 = buildVariantTranslator([
      { options: { Color: "4500-5500sq.in." } },
      { options: { Color: "5500sq.in." } },
    ]);
    expect(t2.options({ Color: "4500-5500sq.in." })).toEqual({ Storlek: "4500-5500 kvadrattum" });
  });
});
