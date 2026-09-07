# Runda 98 — Steg 4 och 5: bilderna och leverantörens påståenden

Trettio bilder granskade på kontaktark, sex i förstoring. Bilderna avgjorde
en motsägelse texten inte kunde lösa, fällde en konstruktionsbeskrivning som
hade ärvts fel, och tog bort två bilder.

## ☠️ 143bef7b har SKJUTDÖRRAR — och hade fått gångjärn om texten ärvts

Det här är runda 97:s `868cc038` en gång till, åt andra hållet: där såldes ett
gångjärnsskåp som "skjutdörrar". Bevisen ligger i pixlarna, inte i spec-raden:

| bevis | vad man ser |
|---|---|
| **Bottenskena** | en metallist löper längs framkanten, FRAMFÖR panelerna |
| **Två plan** | vänster panel ligger framför höger; skarven syns mitt på |
| **Knopparnas läge** | en i vardera YTTERÄNDE, inte två i mitten |
| **Inga gångjärn** | ingenstans längs sidokanterna |
| **Två OLIKA dörrbredder** | spec: 29,5 och 36 cm — summa 65,5 på en 60 cm bred front, alltså 5,5 cm överlapp |

Sista raden är den som gör slutsatsen mekanisk i stället för visuell: två
gångjärnsdörrar på ett 60 cm brett skåp är ungefär 28 + 28. Två olika breda
paneler som tillsammans är BREDARE än fronten kan bara vara skjutdörrar.

Fronten är dessutom **akryl**, inte trä — spec-raden säger `MDF, Edelstahl,
Acryl` och brödtexten `Acryltüren`, men importens svenska spec-rad säger bara
`Holzwerkstoff/Edelstahl`. Sidan anger alla tre materialen var för sig.

## ☠️ Modell B:s alt-text bär SYSKONETS höjd

| källa | säger |
|---|---|
| alt-texten på alla fem bilderna | `35,5x60x30 cm` |
| spec-raden `Maße` | `60L x 30B x 43H cm` |
| måttritningen i bild 3 | **43 cm**, utskrivet |

35,5 är modell A:s höjd. Två källor mot en, och den ena är en ritning med
måttlinje. **Publicerat: 43 cm.** Lintens regel 5 kräver sedan dess att
modellens EGET mått står i brödtexten, så en ärvd höjd fälls mekaniskt.

## Två bilder fällda — och syskonen delar INTE bildset

☠️ **`18b9ec99-4` är en engelsk marknadsföringsinfografik.** Rubrik
*"ELEVATED DESIGN FOR COMFORTABLE EATING"*, en `Ours`-mot-`Others`-jämförelse
med bockar och röda kryss, röntgade hundryggar — och fyra hälsopåståenden
(*"Reduces excessive bending"*, *"Supports a more natural eating posture"*).
Tre skäl att fälla den, vart och ett tillräckligt: engelsk text i pixlarna,
jämförande reklam mot onämnda konkurrenter, och exakt de hälsopåståenden
runda 97:s Steg 2-grind förbjuder.

☠️ **`143bef7b-5` är husmärkets gula banderoll** — samma bild som runda 97
fällde på `1fc55b3d-5`, med samma tyska rad *"Cleverer Komfort, geschaffen für
Begleiter"*. Ingen produkt syns. Sidan får fyra bilder.

⚠️ **Och det viktiga: de tre färgsyskonen har OLIKA bilder på plats 4 och 5.**
Grå har infografiken, vit har en skålnärbild, svart har skålarna med luckorna
öppna. En process som läste texten — där syskonen är nära identiska — hade
antagit ett gemensamt galleri och skrivit en alt-text som passar på en av tre.
Bildsetet är alltså inte en egenskap hos MODELLEN utan hos VARJE utkast.

## Måttritningarna: fem kapade, en orörd

Fem bar samma inbrända ruta nedtill — hundsiluett med `Schulterhöhe`-pil, en
orange `HINWEIS`-etikett och två rader tysk text. Kapningen mättes maskinellt:
den första raden nedanför produkten där mittfältet är minst 99,3 % vitt över
minst 22 rader i följd.

| modell | kapad vid | räddade tal |
|---|--:|---|
| A (tre färger) | **0,714** | 60 / 30 / 35,5 / 28 / 27 cm + skålens 24 / 7 cm |
| B (två färger) | **0,740** | 60 / 30 / 43 cm + skålens 24 / 7 cm |

☠️ **`143bef7b-3` bar ingen tysk text alls** och rördes inte. Den är en
rumsbild med enbart siffror. Att kapa den efter mönster hade tagit bort
`60 cm`- och `30 cm`-etiketterna utan att ta bort någon tyska.

## ⚠️ Husmärket sitter FYSISKT på 18b9ec99

En oval etikett på skåpets ovansida, i perspektiv med ytan och med samma
skuggning — alltså tryckt på varan, inte pålagd i filen. Leonards regel
gäller: *"om märket sitter fysiskt på varan så gör vi inget åt det"*. Bilden
behålls oförändrad, och märket nämns aldrig i text eller alt-text.

## Steg 5 — leverantörens påståenden

| påstående | utfall |
|---|---|
| "entlastet Hals und Nacken" (alla sex) | **STRUKET** — runda 97:s Steg 2-grind |
| Mankhöjd 55–65 / 60–75 / 50–60 cm | **PUBLICERAT** — ritning och brödtext säger samma sak på alla tre modellerna |
| Maxlast 15+15 / 20+10 / 15+30 kg | **PUBLICERAT** — per yta, internt konsekvent |
| `Material: Holzwerkstoff/Edelstahl` | **OMSKRIVET** — tyskt ord i en svenskmärkt rad, och ofullständigt på 143bef7b |
| Skålvolym 2 L (A, B) och 2,1 L (C) | **PUBLICERAT** som leverantören anger, per modell |

⚠️ **`Lieferumfang` motsäger punktlistan på modell B och 143bef7b.** Listan
säger *"1 x Futterstation, 1 x Handbuch"* medan punkterna säger *"Zwei
abnehmbare Edelstahlnäpfe"* och spec-raden ger skålarnas mått och volym.
Modell A:s lista räknar däremot upp *"2 x Edelstahlnapf"*.

Två källor mot en, och produkten har Ø 22 cm hål i skivan som är oanvändbara
utan skålar. Sidorna skriver därför att två skålar ingår. Det är inte att
välja mellan två motstridiga TAL — det är att läsa en grov packlista mot en
detaljerad beskrivning av samma sak.

⚠️ **9a600fda:s kulör är mätt, inte gissad.** Artikelnumret säger `GY` och
spec-raden `Grau`, men bilden har en tydlig blåton: medelfärgen i kroppens
mittfält är R113 G120 B122, alltså **b − r = +9**, mot exakt 0 på det
neutralgrå syskonet 18b9ec99. Sidan säger "grå" — det är vad kunden skulle
kalla den och vad leverantören anger — men skillnaden mot syskonet är verklig.
