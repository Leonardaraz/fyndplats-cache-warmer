# Runda D1 — åtta bäddfåtöljer

Första av tre rundor i familj D. Två färgfamiljer och en ensam produkt.

| id | slug | pris | familj |
|---|---|---:|---|
| `1df737ee` | baddfatolj-med-armstod-taupe | 2 399 kr | F1 |
| `96a6b909` | baddfatolj-med-armstod-beige | 2 359 kr | F1 |
| `286f4e14` | baddfatolj-med-armstod-morkgra | 2 199 kr | F1 |
| `c10d0b7e` | baddfatolj-med-armstod-svart | 2 079 kr | F1 |
| `e4e62a4f` | baddfatolj-med-armstod-bla | 2 059 kr | F1 |
| `1706c47d` | baddfatolj-188-cm-runda-armstod | 1 899 kr | ensam |
| `79daabe1` | vikbar-baddmadrass-174-cm-bla | 1 549 kr | F5 |
| `f8c671b3` | vikbar-baddmadrass-174-cm-morkgra | 1 499 kr | F5 |

Inga priser rörda.

## Dubblettkollen — måtten avslöjade två familjer som namnen dolde

**F1 har SEX medlemmar, inte fem.** De fyra som heter `Relaxsessel im
Skandidesign` är färgsyskon till publicerade `baddfatolj-med-armstod`
(gräddvit) — det visste runbooken. Måtten avslöjade en femte:

☠️ **`1df737ee` heter `Schlafsessel, Gästebett, verstellbare Rückenlehne`.**
Ingen namnjämförelse i världen hade lagt den i samma familj som fyra
"Relaxsessel im Skandidesign". Måtten gjorde det på en gång: 17,5 kg och
paket 125 × 20 × 61 cm, identiskt med de fyra OCH med den publicerade
gräddvita systern. Sits 20 cm, armstöd 15 cm över sitsen — alla sex lika.

**F5 är färgsyskon till en publicerad sida.** `79daabe1` och `f8c671b3`
delar varje mått med publicerade `vikbar-baddmadrass-174-cm`: 70 × 70 × 61
hopvikt, 174 × 70 × 15 utfälld, sits 70 × 55, rygg 70 × 31, 120 kg.
⚠️ `f8c671b3` ligger dessutom på **exakt samma pris**, 1 499 kr. Bilderna
bekräftar: samma madrass i ljusgrått, blått och mörkgrått.

## ☠️ Steg 2 — tre fynd, och det första rättade mitt eget beslut

### 1. Bäddmåttet: 183 mot 185 — och BÅDA är rätt

Tre av fem utkast säger `Bett Größe 183`, två säger `185`. Publicerade
gräddvita systern säger 183.

**Första slutsatsen var fel.** Jag skrev 183 överallt med motiveringen
"majoritet plus konservativt val". Sedan öppnade jag måttritningen (bild 3
på varje produkt):

| | ritningen säger |
|---|---|
| `96a6b909` (beige) | **185 cm × 56 cm** |
| publicerade gräddvit | **183 cm × 63 cm** |

Två OLIKA ritningar med olika tal. Alltså inget skrivfel — källa och ritning
stämmer överens **per produkt**. Varje sida bär nu sitt eget tal: 185 på
`96a6b909` och `e4e62a4f`, 183 på de tre andra.

**Lärdomen: ett familjebeslut får inte överrida data som finns per produkt.**
Och den hade nått kunden — texten hade sagt 183 medan ritningen på samma
sida sa 185.

### 2. Färgen som motsäger sig själv i samma underlag

`1df737ee` säger `Farbe: Hellbraun` i tyska specen och `Färg: Hellgrau` i
den svenska tabellen. Ljusbrun och ljusgrå är inte samma färg, och färgen är
det första kunden ser. Underlaget kan inte lösa sin egen motsägelse.

**Avgjort på huvudbilden:** tyget är varmgrått åt det bruna hållet —
**taupe**, alltså mitt emellan de två påståendena. Det är en bedömning ur
bilden, inte ur texten, och den är utskriven i `kalla/1df737ee.txt`.
Färgen är synligt mörkare än syskonet i beige, så de går att skilja åt.

### 3. Ett falskt superlativ jag skrev själv

Första utkastet till `1706c47d` kallade dess 188 cm "den längsta liggytan
bland våra bäddfåtöljer". Publicerade `baddfatolj-190-cm` har 190 cm. Ett
superlativ som går att motbevisa på vår egen sajt är det sämsta slaget av
påstående. Ersatt med den jämförelse jag faktiskt kan belägga: fem
centimeter mer än syskonet med armstöd.

Samma text hade också "tio centimeter mer än de flesta bäddfåtöljer" — en
uppfunnen jämförelse. Borta. Och F5-texten hade "en vuxen upp till knappt
175 cm", ett tal som inte står någonstans i underlaget. Borta.

## SKU:er — sex av åtta delade, alla åtta tyska

| gammal SKU | delades av |
|---|---|
| `FP-relaxsessel-im` | **fyra** produkter |
| `FP-schlafsessel-relaxsessel` | **två** produkter |
| `FP-schlafsessel-gastebett` | en (tysk) |
| `FP-schlafsessel` | en (tysk) |

Alla åtta har nu en egen svensk SKU, skriven på båda sidorna.

## Alt-texterna var värre än beskrivningarna

Fem produkter bar **tysk** alt-text (`Relaxsessel im Skandidesign…`) och tre
hade **tom** alt-text på samtliga bilder. Alla 40 är omskrivna på svenska
efter att bilderna faktiskt granskats — inte gissats ur importens
positionsregel. Bild 3 är en måttritning på alla åtta, bild 2 och 4
miljöbilder, bild 5 en detalj- eller baksidesbild.

## Grindarna

| grind | utfall |
|---|---|
| Filgrind (mönster + tal) | 0 fynd |
| Mutationstest av grinden | 3 injicerade fel → 3 fynd, 0 falska |
| Prisgrind (workflow, åtta körningar) | stämmer |
| Checksumma fil mot Wix | 8/8 identiska |
| Alt-texter | 40 st, 0 tomma |
| Live-grind | **8/8 REN**, 0 orddiffar mot källfilerna |

☠️ **Filgrinden fyrade på varje korslänk innan den lagades.** En slug bär
produktens mått (`baddfatolj-190-cm`), och de siffrorna är en ADRESS, inte
ett påstående om varan. `gate-runda-a.py` nollar därför `href` före
siffergrinden. Utan det lär man sig klicka förbi grinden — och då är även
det äkta fyndet borta.

⚠️ **Checksummans längdkollision från runda C2 upprepades**, exakt som
förutspått: `96a6b909`/`c10d0b7e` gav båda 3962 och `79daabe1`/`f8c671b3`
båda 3007. Färgordet och sluggen byts åt var sitt håll och tar ut varandra.
Jämförelsen görs per produkt, så den biter ändå — men en summa är blind för
omkastningar.

## Live-grinden, körd efter ISR-fönstret

Alla åtta sidor svarar 200 på sin nya slug, och orddiffen mot källfilerna är
noll på var och en (456 / 456 / 456 / 456 / 456 / 358 / 358 / 404 ord).
Hämtningen gjordes efter en varm träff så `age` låg på 52–60 sekunder — sidorna
var alltså nyrenderade, inte serverade ur cachen från före skrivningen.
