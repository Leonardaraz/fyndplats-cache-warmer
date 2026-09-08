# Runda 102 — läge

Fem färgsyskon som STÄNGER två modeller ur runda 101.

| id8 | modell | färg | klädsel | pris | slug |
|---|---|---|---|--:|---|
| `5a31b710` | B | cremevit | konstläder | 2 449 | massagefatolj-cremevit-fotpall-forvaring |
| `071cad5d` | B | brun | konstläder | 2 479 | massagefatolj-brun-fotpall-forvaring |
| `2de635c3` | B | mörkgrå | tyg | 2 599 | massagefatolj-morkgra-tyg-forvaring |
| `3b61e50c` | C | brun | konstläder | 2 329 | massagefatolj-brun-160-kg |
| `70d0a9ea` | C | svart | konstläder | 2 549 | massagefatolj-svart-160-kg |

## Klart

- **Steg 1** — hela katalogen svept (`avhuggen: false`): 5 553 produkter,
  3 204 utkast, 2 349 publicerade. Massagefamiljen är 105 utkast mot 52
  publicerade sidor. Måttgrinden hittade att runda 101 var OFULLSTÄNDIG.
- **Steg 2** — laglighetsgrind: inget hälsopåstående, 12 V lågspänning,
  maxlast uttrycklig, mikrolåsningen flaggad av leverantören själv.
- **Steg 3** — prisgrind via workflowen, 5/5 gröna. `landedCostSek 2033,12 →
  2 449` med charm99 på `5a31b710`; alla fem `stammer true`.
- **Steg 4** — bilderna granskade; en främmande måttritning hittad (nedan).
- **Steg 5** — påståenden per produkt mot den EGNA tyska källan.
- **Steg 7a** — ☠️ runda 101:s ÅTTA LIVE-SIDOR omskrivna: syskonlistan säger
  nu **tretton** och bär **tolv absoluta länkar** var. 8/8 hashar stämmer mot
  filen, alla `visible:true`, noll trasiga länkar.

- **Steg 7b** — de fem nya skrivna: namn, slug, seoData och brödtext.
  **5/5 hashar stämmer mot `facit13.json`**, tolv absoluta länkar var, noll
  trasiga (`https:/`), fyra sökord var, titeln skild från namnet, alla
  fortfarande `visible:false`.

  ⚠️ Grinden körde FÖRE skrivningen: hashen räknades på det som skulle
  skickas och jämfördes mot facit LÄST ur filen. Hade JS-kompositionen driftat
  från `texter.py` hade anropet avbrutit sig självt utan att röra Wix.

- **Steg 8** — SKU re-synkad till den svenska sluggen på alla fem.
  `FP-massagefatolj-cremevit-forvaring`, `-brun-forvaring`, `-morkgra-tyg`,
  `-brun-160-kg`, `-svart-160-kg`. Alla distinkta, alla ≤ 40 tecken.

  ☠️ Färgfamiljen spränger `PRODUCT_PART_MAX = 24` precis som hundvagnarna
  gjorde: den särskiljande svansen behålls och mitten kapas. Den gamla
  krocken `FP-relaxsessel-mit-fu` på två produkter är därmed borta.

  ☠️ `variantsInfo`-PATCH:en bar uttryckligt `visible:false` på produkten och
  `visible:true` per variant. Återläsning: 5/5 produkter fortfarande utkast,
  5/5 varianter synliga. Utan det hade SKU-patchen publicerat fem tyska
  bildgallerier.

- **Steg 9 (galleri + alt-texter)** — den främmande måttritningen är borta ur
  `3b61e50c` (5 → 4 bilder), och alla 24 bilderna bär svensk alt-text.
  5/5 stämmer ordagrant, noll tomma, noll tyska, alla fem fortfarande utkast.

  ☠️ **Första skrivningen TÖMDE alt-texten i stället för att sätta den.** Jag
  skickade `items[].image.altText` — där man LÄSER den — och Wix släppte den
  tyst: fem bilder gick från tysk text till TOM. Rätt fält är
  `items[].altText`; `image` är readOnly.

  ⚠️ Och regeln stod redan i runbooken, på tre ställen (Fasta fakta rad 244,
  Steg 9 rad 2149, katalogsvepet rad 4536). Jag läste Steg 9:s inledning men
  inte punktlistan. **En regel som står nedskriven men inte läses är lika
  verkningslös som en oskriven** — skillnaden är att den här kostade en
  skrivning i stället för en runda.

  ☠️ **Andra skrivningen bar ett GENUSFEL.** *Fåtölj* är ett en-ord medan
  *konstläder* och *tyg* är ett-ord, så samma färgnamn böjs olika i samma
  mening: "i cremevitt konstläder" men "Cremevit massagefåtölj". Fyra av fem
  fick "Cremevitt/Brunt/Mörkgrått massagefåtölj". Rättat, och grinden i
  anropet fäller nu på ett-ordsformen före "massagefåtölj".

- **Steg 10** — alla fem ligger nu i `Hem & Inredning`, `Massage & Återhämtning`
  och `Skönhet & Hälsa`, exakt som de åtta publicerade syskonen.
  15 skrivningar, 15 lyckade, noll misslyckade, verifierat efter paus.

  ☠️ **`directCategoriesInfo` finns INTE i query-projektionen.** Ett svep över
  hela katalogen gav `kat: []` för alla tretton — även för de åtta publicerade
  som bevisligen ÄR kategoriserade. Samma tysta asymmetri som
  `plainDescription` och `MEDIA_ITEMS_INFO`: fältet är med i typen men tomt i
  svaret om man inte begär det. **Ett tomt fält är inget svar.** Rätt väg är
  `POST /categories/v1/categories/list-categories-for-items`.

  ☠️ Och `POST /categories/v1/bulk/categories/list-categories-for-items` finns
  inte — den ger 404. Läsningen ligger under `/categories/`, skrivningen under
  `/bulk/categories/add-item`. Sök upp endpointen, gissa den inte.

- ✅ **Uppgift #358 är avförd som FELAKTIG.** Den påstod att två publicerade
  `massagefatolj`-sidor saknade `Massage & Återhämtning`. Mätt med rätt
  endpoint: **alla åtta har den.** Flaggan kom sannolikt från en återläsning
  som ljög negativt (uppgift #357) — samma fälla, en runda senare.

- **Steg 9 (kort)** — fem egna Fyndplats-kort byggda, grindade och pålagda
  som sista bild. Galleriet är nu 6 / 6 / 6 / **5** / 6 bilder (den fjärde är
  `3b61e50c`, som blev av med den främmande ritningen). Noll tomma alt-texter,
  alla fem fortfarande utkast.

  Rubrikerna är valda mot bild 1 med ögon: modell B står på korsfot i trä,
  modell C har en rygg som reser sig högt över armstöden. Alla värden är
  härledda ur spec-tabellen — kortet kan inte skriva ett tal som inte står
  i tabellen.

  ☠️ Kortet läggs på med `url`, inte `id` — och det är korrekt HÄR och bara
  här: `raw.githubusercontent.com` ÄR en extern adress. En wixstatic-adress i
  samma fält hade fått Wix att importera om filen (husets omimport-bugg).

  ⚠️ Fjärde produkten föll på en **504** mitt i loopen. Anropet har en
  idempotensvakt ("kortet sitter redan"), så omkörningen skrev bara den femte
  och lämnade de fyra i fred. Det är vad vakten finns till för.

## Kvar

- Steg 12 kundläsning · Steg 13 stämpling + publicering · Steg 14 live-grind
- Steg 10 kategorier · Steg 12 kundläsning · Steg 13 stämpling + publicering
- Steg 14 live-grind (kontrollprov först)

## ☠️ Runda 101 var inte fel — den var ofullständig

| kluster | mått | maxlast | utkast som är samma stol |
|---|---|---|---|
| modell **B** | `80 × 86 × 99` | 120/100 kg | `2de635c3` `5a31b710` `071cad5d` |
| modell **C** | `76 × 81 × 105` | 160/20 kg | `3b61e50c` `70d0a9ea` |

Sökordsgrinden i runda 101 kunde omöjligt se det: de tyska namnen är helt
olika (`Relaxsessel mit Fußhocker, Stauraum…` mot `Massagesessel mit
Fußhocker…`). **Bara måtten avslöjar en färgsyskonfamilj som leverantören
döpt olika.** Det är runbookens regel om täta kategorier, och den gäller även
när man just polerat familjen dagen innan.

## ☠️ En främmande måttritning i `3b61e50c`

| | ritningen | den egna texten | syskonets ritning |
|---|---|---|---|
| bredd × djup | **81 × 81** | 76 × 81 | 76 × 81 |
| fotpall | **50 × 46 × 43** | 47 × 40 × 43 | 47 × 40 × 43 |

Två oberoende källor mot en. Ritningen utgår ur galleriet — en felaktig
måttritning är värre än en bild för lite, för kunden mäter sin vägg efter den.

✅ Och min PUBLICERADE modell C kontrollerades i efterhand: dess ritning bär
**105 / 76 / 81 / 54 / 71 / 50 / 51,5 / 45 / 58 / 47 / 40 / 43** — varenda tal
på de två live-sidorna. Inget var ohärlett.

## ☠️ SKU-krocken igen — och nu är den grindad

`FP-relaxsessel-mit-fu` bars av BÅDE `2de635c3` och `70d0a9ea`. Samma
importbugg som runda 101 (uppgift #272): sluggen kapas vid 24 tecken, så varje
produkt vars tyska namn börjar likadant får samma sträng.

Regel 18 i lintet fäller det nu — och den provas genom att återinföra exakt
den här krocken, eftersom mutationsramen bara muterar HTML och inte når en
regel som läser dictarna.

## ☠️ Jag skrev facit FÖR HAND in i verifieringen — och det gick rött

Verifieringen av de åtta live-sidorna bar en `VANTAT`-tabell jag skrivit ur
huvudet i stället för att läsa ur `facit13.json`. Alla åtta rapporterades som
`stammer: false`. **Skrivningen var korrekt hela tiden** — det var facit som
var påhittat.

Grinden gjorde alltså rätt (den vägrade säga OK), men av fel skäl, och tid
gick åt till att felsöka en skrivning som inte var trasig. Regeln är densamma
som för texten: **facit ska LÄSAS ur filen, aldrig skrivas in i anropet.**
Ett handskrivet facit är inte ett facit, det är en gissning med auktoritet.

⚠️ Och en mätdetalj till: `syskonrader: 0` såg ut som att länkarna försvunnit.
Wix serialiserar om `<li><a href>` till `<li><p><a href … target="_self">`, så
mönstret `<li><a href` matchar inget. Räkna `href=` och kontrollera formen i
stället — 12 absoluta länkar, noll av den trasiga `https:/`-formen.

## Familjetexten bor i ETT ställe

`runda-101/texter.py` är utökad till **tretton** produkter i stället för att
runda 102 får en egen fil. Syskonlistan måste vara identisk på alla tretton
sidor, och två filer som båda definierar den är precis den tvilling huset lärt
sig att inte bygga. Antalet HÄRLEDS numera (`RAKNEORD[len(PRODUKTER)]`) — det
skrivs aldrig i klartext igen.

Lintet: **18 regler, 27/27 mutationer fångade, 0 brister i 13 texter.**
