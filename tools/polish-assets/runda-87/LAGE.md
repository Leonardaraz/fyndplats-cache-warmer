# Runda 87 — åtta garage- och förrådstält, KLAR. Alla åtta publicerade och live-verifierade.

| id8 | slug | pris | mått B × D × H | SKU |
|---|---|--:|---|---|
| `5f6592ad` | `garagetalt-162x222-cm-morkgra` | 1 319 | 162 × 221,5 × 163 | `FP-garagetalt-162x222-morkgra` |
| `72051417` | `garagetalt-120x179-cm-ljusgra` | 1 379 | 120 × 179 × 165 | `FP-garagetalt-120x179-ljusgra` |
| `a165b178` | `garagetalt-120x179-cm-morkgra` | 1 399 | 120 × 179 × 165 | `FP-garagetalt-120x179-morkgra` |
| `8bdba748` | `cykelgarage-245-cm-brett-bagformat-tak` | 1 499 | 245 × 120 × 200 | `FP-cykelgarage-245-bagformat` |
| `20c0942e` | `garagetalt-162x222-cm-ljusgra` | 1 599 | 162 × 221,5 × 163 | `FP-garagetalt-162x222-ljusgra` |
| `0f5e3fea` | `garagetalt-190x230-cm-220-cm-hogt` | 1 869 | 190 × 230 × 220 | `FP-garagetalt-190x230-hogt` |
| `6a419d8b` | `garagetalt-300x300-cm-9-kvm` | 2 129 | 300 × 300 × 210 | `FP-garagetalt-300x300-cm` |
| `95a9d7cc` | `forradstalt-300x447-cm-13-kvm` | 3 139 | 300 × 447 × 255 | `FP-forradstalt-300x447-cm` |

Priserna är orörda.

## ✅ Kvitto: stämplade, publicerade, live

**Stämplingen** — åtta körningar av `polish-mapping.yml`, läge `stampla`. Alla
åtta loggar bär utfallet per produkt, inte bara exitkoden:

```
OK: 72051417-… uppdaterad — needsAiPolish, draftStatus, variantSkus
OK: a165b178-… uppdaterad — needsAiPolish, draftStatus, variantSkus
OK: 5f6592ad-… uppdaterad — needsAiPolish, draftStatus, variantSkus
OK: 20c0942e-… uppdaterad — needsAiPolish, draftStatus, variantSkus
OK: 8bdba748-… uppdaterad — needsAiPolish, draftStatus, variantSkus
OK: 0f5e3fea-… uppdaterad — needsAiPolish, draftStatus, variantSkus
OK: 6a419d8b-… uppdaterad — needsAiPolish, draftStatus, variantSkus
OK: 95a9d7cc-… uppdaterad — needsAiPolish, draftStatus, variantSkus
```

⚠️ **Det gröna jobbet är inte kvittot, `ändrat`-listan är det.** Ett grönt
workflow-jobb säger bara att curl fick 2xx. Att raden FAKTISKT bär de tre
fälten vet man för att rutten läser tillbaka efter skrivningen och svarar 500
om den inte gör det. (Och `jq`-syntaxfelet 2026-09-02 fällde varenda stämpling
i tolv timmar EFTER att skrivningen gått igenom — därför läses just den raden,
inte jobbets färg.)

**Publiceringen** — en PATCH per produkt med `visible: true` på BÅDE produkten
och varianten, med facit-grinden inne i anropet. Alla åtta `PUBLICERAD`,
`produktSynlig: true`, `variantSynlig: [true]`, priser och SKU:er oförändrade.

**Steg 14 — live-grinden, `live.py`:** alla åtta svarar `200` med
`x-vercel-cache: MISS`, alltså en FÄRSK rendering och inte ett cachat svar från
utkastet (runda 60:s lärdom). Texten stämmer mot facit på **både längd och
hash** på alla åtta — 3 190 / 3 094 / 3 437 / 3 111 / 3 880 / 3 964 / 3 797 /
3 630 tecken — så kundens sida är byte för byte den text linten godkände, och
varje lint-regel gäller på live-sidan per konstruktion.

**Korslänkarnas elva mål svarar alla 200**, inklusive de tre som pekar utanför
rundan (`cykeltalt-silverbelagd-oxford`,
`platbod-240x206-cm-snolast-30-kg-las-9-stodpelare`,
`redskapsbod-metall-2-81-m2-skjutdorr-morkgra`).

## Klart-kriteriet — grönt på alla åtta

Läst tillbaka ur Wix före publiceringen, `brister: []` på var och en: facit på
både längd och hash, alla tre flikrubrikerna som RENA `<h2>`, ingen tysk text i
beskrivningen eller i `seoData.settings.keywords`, ingen kommalista av tal,
inget artikelnummer, sex bilder med `image.url` och unika alt-texter, kortet på
plats 3, SKU på rätt `wixVariantId`, och kategorier.

Kategorier: **24 av 24 lyckade** — Trädgård & Utemöbler + Hem & Inredning +
Förvaring & Organisering.

⚠️ **Målen är LÄSTA ur katalogen, inte valda ur minnet.** Tio publicerade
förrådsbyggnader i trädgården (`redskapsbod-*`, `platbod-*`, `plastbod-*`,
`plastskjul-*`, `vedbod-*`, `tradgardsforrad-*`) ligger i just de tre. Runda
86:s sju `tradgardsskap-*` ligger i stället i Trädgårdsskötsel & Bevattning —
en avvikelse som hör hemma i kategoristädningen, inte här.

## Fyra mätningar som är värda mer än rundan

### 1. ☠️ `\b` betyder OLIKA saker i Python och JavaScript

Klart-kriteriets tyska ordlista självtestades i Python: **0 träffar**. Samma
mönster kördes som grind i JavaScript och fällde **tre av åtta** på
`tyskt ord i texten: der`.

Texterna var korrekta. Grinden var fel:

| | `\b` | "väder" mot `\bder\b` |
|---|---|---|
| Python `re` | **Unicode-medveten** — å ä ö är ordtecken | ingen träff |
| JavaScript | **ASCII-ONLY** — å ä ö är ICKE-ordtecken | **träff** |

I JavaScript läses `ä` som en ordgräns, så `\bder\b` matchar mitt inne i
**väder**. Samma fälla gäller *kläder*, *läder*, *sönder*.

☠️ **Det farliga är inte träffen — det är att självtestet var GRÖNT.** En grind
vars självtest kör i en annan motor än grinden bevisar ingenting. Samma familj
som `SHIP_AXIS_RE` och `EU_TULL_CODES`, men här är tvillingarna två
REGEXMOTORER, och skillnaden syns inte i källkoden alls.

Lagat i `klartgen.py`: ordgränsen är en explicit klass (`[\wåäöÅÄÖ]`) som beter
sig likadant i båda motorerna, självtestet har fyra svenska regressionsprov åt
andra hållet, och generatorn kör `node tyska-prov.js` **mot den genererade
filen** innan den godkänner den.

### 2. ☠️ Kategorier går inte att läsa ur produkten

Både `products/search` OCH en vanlig `GET /stores/v3/products/{id}` returnerar
`directCategoriesInfo` och `allCategoriesInfo` **tomma** — på produkter som
bevisligen ligger i fyra kategorier. Fältet finns inte i standardprojektionen
och går inte att be om via `fields`.

Läsaren är `categories/v1/categories/list-categories-for-item(s)`. Det ändrar
INTE regeln att skrivningens kvitto är `bulkActionMetadata.totalSuccesses` —
kopplingen är fortfarande eventuellt konsistent.

### 3. ☠️ `VARIANTS_INFO` är inget giltigt `fields`-värde

Det svarar `400 "Failed to parse JSON or deserialize protobuf message"` — ett
fel som läser som ett trasigt ANROP, inte som ett okänt enum-värde. Varianterna
kommer med i standardprojektionen ändå. `PLAIN_DESCRIPTION` MÅSTE däremot
begäras: utan den är `plainDescription` tom sträng.

### 4. Flikkontrollen läser produktens EGNA rubriker

Rundans mittrubrik är produktspecifik — *"Vad 10 kg per kvadratmeter faktiskt
betyder"*, *"Förankringen ingår inte — och den behövs"*, *"Nio kvadratmeter duk
fångar mer väder"*. En hårdkodad lista hade bara kontrollerat de tre
obligatoriska. `live.py` läser därför `<h2>`-raderna ur den byggda texten och
kräver att var och en står på live-sidan.

## Rundans egna grindar

☠️ **Snölasten står bara på TRE av åtta** — de tre där källan anger en siffra
(5 och 10 kg/m²). De fem andra tiger, och tystnaden hör hemma i en vanlig fråga,
aldrig som ett tal. Tyskan kallar två av dem `winterfest`; orden
*vinterklar*, *vintersäker* och *vinterfast* är förbjudna på alla åtta.

☠️ **Förankringen räknas per produkt i BÅDE siffror och bokstäver.** Grinden
läste först bara siffror, så "sexton markankare" slapp igenom. `8bdba748`
levereras UTAN förankring och får aldrig utlova någon.

☠️ **"Vattentät" bara där källan säger det.** `0f5e3fea` får bara
"vattenavvisande".

Alla tre körs om på den renderade sidan i `live.py`, trots att facit-hashen
redan garanterar dem — de är rundans dyraste påståenden och kostar noll.

## Kvar ur familjen

~43 förrådsutkast. Två deferrades med flit:

- **`204b66ce`** (160 × 218) — golvytan ligger för nära paret 162 × 221,5.
- **`f1acf38f`** (300 × 300 × 235) — samma fotavtryck som `6a419d8b`.

⚠️ **De ~7 plåtbodsutkasten med skjutdörr är en DUBBLETTAUDIT, inte en
poleringsrunda.** Steg 1:s breda svep hittade 12 publicerade `platbod-`/
`plastbod-`-sidor som en smal familjeregex missade, och två av dem delar exakta
mått med utkast. Kräver en mått-för-mått-jämförelse innan något poleras.

☠️ **Rundans metodfynd i Steg 1:** en smal familjeregex svarar inte på "finns
inga krockar" — den svarar "jag tittade inte där", och de två är omöjliga att
skilja åt i resultatet.
