# Runda 127 — läget

Åtta kontorshurtsar och en kubhylla ur Aosoms `Rollcontainer`-familj. Sex av
de åtta är nästan identiska trelådors-hurtsar, och det är rundans hela
svårighet: familjen är STANDARDISERAD, så de vanliga skiljetecknen räcker inte.

## Sidorna

| kort | slug | pris | bilder | SKU |
|---|---|--:|--:|---|
| `709f7aac` | `kubhylla-pa-hjul-tre-fack` | 979 | 5 | `FP-kubhylla-pa-hjul-tre` |
| `4d5b3bb5` | `smal-hurts-37-cm-tre-lador` | 1 419 | 4 | `FP-smal-hurts-37-cm-tre` |
| `66866eb7` | `smal-hurts-tva-lador-67-cm` | 1 599 | 4 | `FP-smal-hurts-tva-lador` |
| `9ba9af92` | `hurts-vit-tre-lador-60-cm` | 1 629 | 5 | `FP-hurts-vit-tre-lador` |
| `521aec3c` | `hurts-mellanvagg-centrallas` | 1 729 | 5 | `FP-hurts-mellanvagg` |
| `3273d2ee` | `hurts-vit-greppfri-front` | 1 729 | 4 | `FP-hurts-vit-greppfri` |
| `9b8c7308` | `hurts-vit-infallt-handtag` | 1 749 | 4 | `FP-hurts-vit-infallt` |
| `21a12739` | `hurts-svart-infallt-handtag` | 1 759 | 4 | `FP-hurts-svart-infallt` |

## Tio fynd

### ☠️ 1. Fyra tal på decimalen räcker INTE i en standardiserad kategori

`9b8c7308` och `3273d2ee` är båda vita, båda 39 × 48 × 59, båda med
lådinnermått 32,6 × 43,2 — och ändå två olika skåp. **39 × 48 × 59 med en
hängmappslåda på 32,6 × 43,2 är branschens standardformat för en
skrivbordshurts**; där är talen en NORM, inte ett fingeravtryck. Det som
skiljer är greppet: infällt handtag mot greppfri front, synligt i bild 1 på
båda. Uppgift #476.

### ☠️ 2. dHash är STRUKTURELLT BLIND över en färgändring

Samma modell i två färger gav 38,59 % skillnad; två olika modeller i samma
färg gav 43,83 %. Talen ligger så nära varandra att tröskeln inte kan skilja
dem åt. **Pixelgrinden bevisar likhet, aldrig skillnad.** Uppgift #477.

### ☠️ 3. `9ba9af92` är färgsyskon till en PUBLICERAD sida

`66c9f2b5` (`hurts-hjul-tre-lasbara-lador`, svart, 1 559 kr). Den nya sidan
korslänkar till den; den publicerade länkar inte tillbaka — uppgift #480.

### ☠️ 4. `709f7aac` kan inte bära en skrivare, trots att leverantören döpt den så

Namnet säger `Druckerablage`. `Technische Daten` säger **3 kg per hyllplan,
9 kg totalt**; en bordsskrivare väger 5–10. Sidan säljer den som kubhylla för
pärmar och papper, och båda lasttalen står utskrivna. Grinden `SKRIVARE`
fäller ordet i både brödtext och alt-text.

### ☠️ 5. `521aec3c`:s lasttal går inte ihop — och sidan skriver inget totaltal

Källan säger 40 kg totalt och 5 kg per låda på två lådor. 2 × 5 ≠ 40, och det
finns ingen `Tischplatte`-rad som hos syskonen. **Bara det entydiga talet
skrivs.** `LAST_TOT[pid] is None` gör totallastgrinden NEGATIV för just den —
ett totaltal på sidan är ett fel.

### ☠️ 6. `66866eb7`:s axelbeteckningar motsäger sig själva

Lådans "B" (40,5) är bredare än skåpets "L" (37). Bilden avgör: 37 är fronten,
43,5 är djupet. Samma fälla som uppgift #462 — leverantörens egen beteckning
är ingen källa.

### ☠️ 7. Lådspärren är OVERIFIERAD och skrivs inte ut

`21a12739`:s bild 4 påstår på engelska att bara en låda kan öppnas åt gången.
Ingen av de två M2-sidornas tyska brödtext nämner den. Bilden plockas bort och
påståendet skrivs inte — grinden `LÅDSPÄRR` fäller det i båda riktningar.

⚠️ **Rättat under rundan:** en första läsning sa att syskonets bild 4 MOTSÄGER
spärren (tre lådor öppna samtidigt). I originalupplösning är den bilden en
komponerad render — lådfronterna svävar i omöjliga vinklar. Den säger
ingenting, varken för eller emot. **En kontaktkarta duger för att HITTA text i
pixlarna, aldrig för att avgöra vad en bild bevisar.**

### ☠️ 8. Två sidor lovade nycklar som leveranslistan inte listar

`4d5b3bb5` och `66866eb7` hade fått "två nycklar följer med" i ett utkast.
Källans `Lieferumfang` listar bara skåp + manual; ett nyckellås nämns i
beskrivningen men aldrig ett ANTAL. Båda säger nu "ett nyckellås" utan tal.
Uppgift #468:s regel: **Lieferumfang är kontraktet.**

### ☠️ 9. `9b8c7308` bild 5 bar HOMCOM-logotypen inbränd

Overlay på en livsstilsbild, inte fysiskt på varan — Leonards regel gäller
alltså inte. Bilden plockades bort. Ett fall till i uppgift #461.

### 10. `9b8c7308` bär två vikter

`Technische Daten` 19,5 kg, spec-blocket 22. Sidan anger det HÖGRE talet — den
som ska bära upp skåpet ensam ska inte bli överraskad.

## ☠️ Grindfyndet som träffar sex tidigare rundor

`grindar.dela_pa_ankare` läckte grannens text: ETT FRÅGETECKEN INNE I
ANKARTEXTEN delade ankaret på två meningar, och bara den första halvan bar
öppningsmarkören. Andra halvan bokfördes som VÅR EGEN mening. Runda 122–127 —
sex rundors grindar — har alltså graderat grannens text som vår.

Lagat med en arvsregel (öppna ankarmål bärs vidare till nästa mening när
ankaret är ostängt), provkört på fyra fall: frågetecken inne i ankaret,
frågetecken utanför, två ankare i rad, inget ankare. **Rundorna 123–126 kördes
om efter lagningen: 36 sidor, 0 fel, ingen drift.**

## ☠️ Verktygsfyndet: `wix.request` bär kroppen under `body`

En PATCH med kroppen under `data` kom fram som en TOM `product`, och Wix
svarade `400 product.revision must not be empty` — på en kropp som bar
`revision: "4"`. Felmeddelandet pekar på fel sak. Uppgift #479.

## Kvitton

| steg | utfall |
|---|---|
| 1–2 | svep 57 sidor, `avhuggen: false`, 2 552 publicerade / 3 097 utkast |
| 3 | prisgrind **8/8** (Actions 2509–2516), lager 10–197, ingen hålls tillbaka |
| 4 | fem bilder fälldes: fyra tyska, en engelsk, en logotyp |
| 5 | nio fynd, se ovan |
| 6–7 | 8/8 skrivna, namn + slug återlästa, `brand: null` på alla |
| 8 | 8/8 variant-SKU:er, `publiceradeAvMisstag: 0` |
| 9 | 35 alt-texter, **0 utan alt**, fem bilder borttagna, alla `visible:false` |
| 10 | 8/8 i Förvaring & Organisering + Hem & Inredning, **läst två gånger** |
| 12 | avskriftskvitto **8 produkter, 0 avvikelser** |
| 13 | 8/8 publicerade, 8/8 mappningar stämplade (Actions 2517–2524) |

Källgrinden: **60 fall, 0 fel · 8 sidor, 0 fel.**

## Kvar i familjen (runda 128+)

Fyra höga plåtskåp: `6df0ce88` (80 × 40 × 92,5, grå), `5a0f9799` + `beeada22`
(75 × 33 × 110, vit/svart — färgsyskon, identisk text), `81c123fa`
(75 × 40 × 180, svart, 3 769 kr — ☠️ bär *"kostenfrei bis Bordsteinkante"*,
uppgift #478).

Åtta rullande verktygsskåp: `1db06f83`, `f2495eee`, `1654dd75`, `fc6fdd63`,
`b920d526`, `d9965552`, `bc2e7191`, `88eb3627`. ☠️ `b920d526`/`d9965552` är
färgsyskon (röd/blå, identiska på 61,5 × 33 × 113 och 41,7 kg), och familjen
har **fjorton publicerade konkurrenter** — måttjämförelsen måste gå mot alla
fjorton före urvalet.

## Till Leonard

| | |
|---|---|
| Sortiment | Sex nästan identiska trelådors-hurtsar live samtidigt. Kvalificerare finns i namn, slug och titel, men om de ska vara sex sidor eller färre är ett sortimentsbeslut. |
| #461 | `9b8c7308` bild 5 bar HOMCOM-logotypen — ett fall till i logotypsvepet. |
| #478 | `81c123fa` (runda 128) bär ett leveranslöfte i leverantörens text. |
| #480 | Den publicerade `66c9f2b5` saknar korslänk tillbaka till sitt nya vita färgsyskon. |
