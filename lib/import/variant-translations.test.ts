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
  axisNameUnresolved,
  unresolvedAxisNames,
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

  it("känner igen färg-aktiga axelnamn AE skickar utöver rena 'Color' (LAYER A)", () => {
    // AE döper färg-axeln olika ("Color Name", "Color Family", "Main Color" …);
    // alla ska in i färg-pipelinen så omklassningen/AI fångar icke-färg-värden.
    expect(translateAxisName("Color Name")).toBe("Färg");
    expect(translateAxisName("Color Family")).toBe("Färg");
    expect(translateAxisName("Main Color")).toBe("Färg");
    expect(translateAxisName("Colour Classification")).toBe("Färg");
  });

  it("färg-regexen är ordgräns-säker (rör inte 'colorful'/'tricolor')", () => {
    expect(translateAxisName("colorful")).toBe("colorful");
    expect(translateAxisName("tricolor")).toBe("tricolor");
  });
});

describe("axisNameUnresolved — flaggar bara KVAR-engelska namn (ej svenska lånord)", () => {
  it("self-map-lånord ('Material'→'Material') flaggas INTE (ingen falsk positiv)", () => {
    expect(axisNameUnresolved("Material", "Material")).toBe(false);
    expect(axisNameUnresolved("Design", "Design")).toBe(false);
  });
  it("ett översatt/omklassat slutnamn (≠ rånamnet) är alltid löst", () => {
    expect(axisNameUnresolved("Color Name", "Färg")).toBe(false);
    expect(axisNameUnresolved("Color", "Typ")).toBe(false);
  });
  it("färg-aktigt rånamn räknas som löst (→ 'Färg' via LAYER A)", () => {
    expect(axisNameUnresolved("Color Name", "Color Name")).toBe(false);
  });
  it("ett rått engelskt tabell-miss-namn flaggas", () => {
    expect(axisNameUnresolved("Lighting Mode", "Lighting Mode")).toBe(true);
  });
});

describe("unresolvedAxisNames — kvar-engelska axelnamn ur en byggd översättare", () => {
  it("flaggar en engelsk-namnad axel men inte en svensk", () => {
    const t = buildVariantTranslator([{ options: { "Lighting Mode": "Strobe", Size: "XL" } }]);
    expect(unresolvedAxisNames(t)).toEqual(["Lighting Mode"]);
  });
  it("'Material'-axel flaggas inte (self-map)", () => {
    const t = buildVariantTranslator([{ options: { Material: "Cotton" } }]);
    expect(unresolvedAxisNames(t)).toEqual([]);
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
    expect(translateValue("Unicorn")).toBe("Unicorn");
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
    // Enheter & antal ("6 Feet" KONVERTERAS numera till meter; feet→fot-posten
    // är kvar för residual-detektering + icke-numeriska tokens, se ft→m-sviten)
    expect(translateValue("6 Feet")).toBe("1,8 m");
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
    expect(t.options({ Color: "Red", Effect: "Glow" })).toEqual({ Färg: "Röd", Effekt: "Glöd" });
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

describe("buildVariantTranslator — axel-namn-kollisionssäkerhet (två färg-aktiga axlar)", () => {
  it("kollapsar INTE två axlar som annars båda blir 'Färg' (Color + Color Temperature)", () => {
    const variants = [
      { options: { Color: "Black", "Color Temperature": "3000K" } },
      { options: { Color: "White", "Color Temperature": "6000K" } },
    ];
    const t = buildVariantTranslator(variants);
    const o1 = t.options(variants[0].options);
    expect(Object.keys(o1)).toHaveLength(2); // BÅDA dimensionerna överlever (ingen överskrivning)
    expect(o1.Färg).toBe("Svart");
    const second = Object.keys(o1).find((k) => k !== "Färg")!;
    expect(second).not.toBe("Färg"); // andra färg-aktiga axeln särskild
    expect(o1[second]).toBe("3000K");
    // Distinkta varianter förblir distinkta → ingen variant-kollaps / wixVariantId-desync.
    expect(t.options(variants[1].options).Färg).toBe("Vit");
  });

  it("särskiljer även när två axlar landar på samma klass ('Color Size' + 'Size' → Storlek)", () => {
    const t = buildVariantTranslator([{ options: { "Color Size": "42 inch", Size: "M" } }]);
    const o = t.options({ "Color Size": "42 inch", Size: "M" });
    expect(Object.keys(o)).toHaveLength(2); // ingen kollaps trots samma klass-namn
  });

  it("samma axelnamn oavsett feed-ordning (tie-break på sorterat namn, ej feed-ordning)", () => {
    // AE:s SKU-prop-ordning är inte stabil → tie-breaken får inte bero på den.
    const a = buildVariantTranslator([{ options: { Color: "Black", "Color Temperature": "3000K" } }]);
    const b = buildVariantTranslator([{ options: { "Color Temperature": "3000K", Color: "Black" } }]);
    expect(a.axisNames.get("Color")).toBe(b.axisNames.get("Color"));
    expect(a.axisNames.get("Color Temperature")).toBe(b.axisNames.get("Color Temperature"));
    expect(a.axisNames.get("Color")).toBe("Färg"); // stabil vinnare ("Color" < "Color Temperature")
  });

  it("flaggar en suffix-särskild axel som olöst även i sync-läget ($0 → needsAiPolish)", () => {
    const t = buildVariantTranslator([{ options: { Color: "Black", "Color Temperature": "3000K" } }]);
    expect(unresolvedAxisNames(t)).toContain("Color Temperature"); // ej kund-klart → flaggad
    expect(unresolvedAxisNames(t)).not.toContain("Color"); // rena färg-axeln är OK
  });
});

describe("translateValue — ft→m (nummer-ankrat, aritmetik, NOMINELL/trunkerad avrundning)", () => {
  it("konverterar enkla fot-värden till meter (trunkerat till 1 decimal, svenskt komma)", () => {
    expect(translateValue("10 ft")).toBe("3 m"); // 3,048 → "3" (heltal utan ,0)
    expect(translateValue("12ft")).toBe("3,6 m"); // 3,6576 → trunk 3,6 (EJ 3,7)
    expect(translateValue("10 Feet")).toBe("3 m");
    expect(translateValue("1.5 ft")).toBe("0,4 m"); // 0,4572 → trunk 0,4
  });

  it("konverterar dimensioner — alla tal, kanoniskt ' x ' + ' m'", () => {
    expect(translateValue("10 x 10 ft")).toBe("3 x 3 m"); // tältet (en avslutande enhet)
    expect(translateValue("12 x 12 ft")).toBe("3,6 x 3,6 m");
    expect(translateValue("10ft x 13ft")).toBe("3 m x 3,9 m"); // enhet per tal
  });

  it("rör ALDRIG icke-numeriska 'foot/ft' (nummer-ankring)", () => {
    expect(translateValue("Foot Rest")).toBe("Fot Rest"); // token-posten gäller, ingen aritmetik
    expect(translateValue("5 in 1")).toBe("5 in 1"); // tum-skyddet orört av ft-passet
  });

  it("halvkonverterar ALDRIG en dimension med omgivande text (audit S1) — hellre orört än fel mått", () => {
    // "10x3 m Gazebo" vore ett FELAKTIGT mått — guarden lämnar värdet åt AI/flaggan.
    expect(translateValue("10x10 ft Gazebo")).toBe("10x10 ft Gazebo");
    expect(translateValue("10x10ft(3x3m)")).toBe("10x10ft(3x3m)");
    // …men enhet-per-tal utan naken x-adjacens konverteras fortfarande korrekt.
    expect(translateValue("10ft x 13ft")).toBe("3 m x 3,9 m");
  });

  it("SLUT-ankrad kedja med prefix konverteras HELT (aldrig halvt): 'Tent 10x10ft' → 'Tent 3 x 3 m'", () => {
    // S1-faran var HALV-konvertering; en komplett tal-x-tal-kedja vid slutet är
    // entydig och konverteras i sin helhet, med prefixet bevarat.
    expect(translateValue("Tent 10x10ft")).toBe("Tent 3 x 3 m");
  });
});

describe("translateValue — hopskrivna in-dimensioner med kodprefix (growtältet 2026-06-09)", () => {
  it("'2000D48x48x80in' → '2000D48x48x80 tum' (kedjan entydig trots prefix)", () => {
    expect(translateValue("2000D48x48x80in")).toBe("2000D48x48x80 tum");
    expect(translateValue("2000D60x60x80in")).toBe("2000D60x60x80 tum");
  });

  it("prepositions-skyddet håller fortfarande", () => {
    expect(translateValue("5 in 1")).toBe("5 in 1"); // slutar på "1" → kan aldrig matcha
    expect(translateValue("2 in 1 Charger")).toBe("2 in 1 Laddare");
  });

  it("x-kopplat prefix konverteras ALDRIG (slutpass S-A) — blandade enheter undviks", () => {
    expect(translateValue("8 ft x 8 x 7 ft")).toBe("8 ft x 8 x 7 ft"); // hör ihop över gränsen
    expect(translateValue("48in x 48 x 80in")).toBe("48in x 48 x 80in");
    // …fristående kedjor vid slutet konverteras fortfarande.
    expect(translateValue("Tent 10x10ft")).toBe("Tent 3 x 3 m");
    expect(translateValue("2000D48x48x80in")).toBe("2000D48x48x80 tum");
  });
});

describe("translateValue — bart 'in' som tum i DIMENSIONER (lekhagen 2026-06-09)", () => {
  it("enhet per tal: '32 in x 24 in' → '32 tum x 24 tum'", () => {
    expect(translateValue("32 in x 24 in")).toBe("32 tum x 24 tum");
    expect(translateValue("44 in x 44 in")).toBe("44 tum x 44 tum");
    expect(translateValue("32in x 24in")).toBe("32 tum x 24 tum"); // utan mellanslag
  });

  it("EN avslutande enhet: '24 x 32 in' → '24 x 32 tum'", () => {
    expect(translateValue("24 x 32 in")).toBe("24 x 32 tum");
  });

  it("prepositions-'in' förblir SKYDDAT (hel-värdes-ankringen)", () => {
    expect(translateValue("5 in 1")).toBe("5 in 1"); // produkttyp, inte tum
    expect(translateValue("Made in Sweden")).toBe("Made in Sverige"); // 'in' orört (sweden-token översätts)
    expect(translateValue("42 in")).toBe("42 tum"); // befintliga hel-värdes-regeln kvar
  });
});

describe("VALUE_TRANSLATIONS — fordon/cykelställ (incident 2026-06-09)", () => {
  it("översätter ställ-värdena som skeppades engelska efter Haiku-eko", () => {
    expect(translateValue("Rear Wheel")).toBe("Bakhjul");
    expect(translateValue("Front Wheel")).toBe("Framhjul");
    expect(translateValue("Fork")).toBe("Gaffel");
    expect(translateValue("U Type L Type Fork")).toBe("U-typ & L-typ gaffel");
    expect(translateValue("4 Wheels")).toBe("4 Hjul");
    expect(translateValue("Vertical Type")).toBe("Vertikal");
  });

  it("tabell-träff gör värdet AI-oberoende (residualEnglishTokens → tomt)", () => {
    // Låser att de förgiftade cache-posterna blir oåtkomliga: full-match i
    // tabellen kortsluter kandidat-uttagningen → värdet når aldrig AI/cache igen.
    expect(residualEnglishTokens("Rear Wheel")).toEqual([]);
    expect(residualEnglishTokens("U Type L Type Fork")).toEqual([]);
  });

  it("fraser där lösa tokens annars FEL-översätter vinner som fulla fraser (audit S2)", () => {
    expect(translateValue("Saddle Brown")).toBe("Sadelbrun"); // färg — inte "Sadel Brun"
    expect(translateValue("Spring Steel Fork")).toBe("Fjäderstålsgaffel"); // fjäder, inte säsong
  });

  it("EN=SV-identiska ord är self-maps → aldrig AI-kandidater, aldrig eko-flagg", () => {
    expect(translateValue("Smart")).toBe("Smart");
    expect(translateValue("Universal")).toBe("Universal");
    expect(residualEnglishTokens("Smart")).toEqual([]);
    expect(residualEnglishTokens("Mini Digital")).toEqual([]);
  });
});

describe("translateValue — silvery + hopskrivna antal-enheter (buffévärmaren 2026-06-09)", () => {
  it("'Silvery 4pcs' / 'Gold 4pcs' blir helsvenska ($0, tabell + avgluing)", () => {
    expect(translateValue("Silvery 4pcs")).toBe("Silver 4 st");
    expect(translateValue("Gold 4pcs")).toBe("Guld 4 st");
    expect(translateValue("Silvery")).toBe("Silver");
    expect(translateValue("4pcs")).toBe("4 st"); // orört av tabellen → avgluade formen
    expect(translateValue("4Pcs")).toBe("4 st"); // skiftlägesokänsligt
  });

  it("fras-nycklar med pc/pcs matchar på rå form FÖRE avgluing (golden-skydd)", () => {
    expect(translateValue("5pc Sets 3")).toBe("5-delars set 3");
    expect(translateValue("Random Color 1 PC")).toBe("Slumpmässig färg, 1 st");
  });

  it("avgluar även MITT i värdet (audit S2): '2pcs Red' → '2 st Röd'", () => {
    expect(translateValue("2pcs Red")).toBe("2 st Röd");
    expect(translateValue("2pcs Black")).toBe("2 st Svart");
  });

  it("EN=SV-adjektiv (audit S3) self-mappas → perfekta AI-svar perma-flaggas inte", () => {
    expect(translateValue("Extra Long")).toBe("Extra Lång");
    expect(residualEnglishTokens("Extra Long")).toEqual([]);
    // "Size" är kvar som kandidat (rätt — ordet ÄR engelskt), men "Normal"
    // flaggar inte längre → AI-svaret "Normal storlek" behåller ingen residual.
    expect(residualEnglishTokens("Normal Size")).toEqual(["Size"]);
  });

  it("silvery-posten gör värdet AI-oberoende → den förgiftade cache-posten oåtkomlig", () => {
    expect(residualEnglishTokens("Silvery 4pcs")).toEqual([]);
  });
});
