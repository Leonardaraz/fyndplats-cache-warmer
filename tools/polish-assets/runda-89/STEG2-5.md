# Runda 89 — Steg 2, 4 och 5: laglighet, bilder och verifierade påståenden

## Steg 2 — laglighetsgrinden

Samma ram som runda 88 slog fast, och den gäller oförändrat för alla sex:

- **EN 14619** täcker sparkcyklar för 20–100 kg. Under 20 kg är fordonet en
  leksak (**EN 71-1**). Alla sex anges för 100 kg, alltså EN 14619:s spann.
  **Källan anger ingen standard** för någon av dem, och då påstås ingen.
- **Trafikförordningen (1998:1276) 1 kap 4 §**: en sparkcykel är ett
  *lekfordon*, och den som åker räknas som **gående**. Trottoar och gångbana
  är alltså rätt plats.
- **Hjälm är inget lagkrav** för en sparkcykel. Hjälmlagen för barn under 15
  gäller *cykel*. Rådet ges ändå — leverantörens egen text ger det, och
  bilderna visar barn med hjälm och knäskydd.

Ingen av rundans sex är eldriven. Ordet elsparkcykel, motor, batteri eller
hastighet får inte förekomma.

## Steg 4 — 30 bilder granskade

### ☠️ En bild bär inbränd tysk reklamtext och stryks

`c4375606-3` är en marknadsföringsgrafik: **"PERFEKTES GESCHENK FÜR IHR
KIND!"**, *"Geeignet für Kinder ab 5 Jahren"*, *"Gute Tragfähigkeit"*,
*"Stabil & Sicher"*, *"Spaßig & Lehrreich"*. Kontrollerad i zoom, inte i
miniatyr. Den kan inte visas för en svensk kund och tas bort.

Följden: `c4375606` har **fyra** bilder kvar mot syskonens fem. Den saknar
dessutom måttritning helt — ritningen ligger bara på det rosa syskonet
`79186373`, och den ritningen visar en rosa sparkcykel. Den kan alltså inte
lånas till den svarta sidan.

### ✅ Logotypkollen: ren

Tolv övre vänstra hörn (bild 1 och 2 för alla sex) uppförstorade. Ramen och
styrets stoppning bär ordet **"SCOOTER"** i guld eller grått — ett generiskt
ord, inget husmärke. Ingen HOMCOM, Outsunny, PawHut eller Aiyaplay.

### ⚠️ Syskonbilderna är SAMMA render omfärgad

Runda 59:s fynd upprepas i alla tre modellerna: bild 1 på `c4375606` och
`79186373` är samma flicka i samma pose mot samma vita botten, med ramen
omfärgad. Detsamma för `479e9c2e`/`d9239c8e` och `4fd26086`/`89deaca7`.
Alt-texterna måste därför skilja på FÄRG, inte på scen.

### ⚠️ Två färgnamn i källan stämmer inte med bilden

| id8 | källan säger | bilden visar |
|---|---|---|
| `d9239c8e` | Blau | **turkos / ljusblå** |
| `89deaca7` | Blau | **turkos / ljusblå** |
| `479e9c2e` | Schwarz | svart ram med **röd framgaffel och röd fälg** |

Texten beskriver det som syns. "Blå" hade varit fel ord för en turkos ram,
och att kalla `479e9c2e` bara "svart" hade tappat den enda detalj som
skiljer den från syskonet i bild.

### ✅ Måttritningarna bekräftar brödtexten

| modell | ritningen visar | stämmer mot specen |
|---|---|:-:|
| A2 (`79186373`) | 143 cm · 58 cm · 92–100 cm · 36 cm · 12 cm · 11 cm | ✅ |
| D (`479e9c2e`, `d9239c8e`) | 120 cm · 58 cm · 75–80 cm | ✅ |
| F (`4fd26086`, `89deaca7`) | 135 cm · 58 cm · 88–94 cm | ✅ |

## Steg 5 — påståenden mot bild och källa

### ☠️ Fotbollsmönstret finns inte i någon bild

F:s tyska text lovar *"Langlebige aufblasbare Gummiräder im
**Fußballdesign**"*. Zoomat på `4fd26086-3`: framhjulet är ett vanligt
grovmönstrat gummidäck på ekerfälg i aluminium, med V-broms. Inget
fotbollsmönster någonstans i de tio bilderna på de två F-produkterna.

**Påståendet följer inte med till svenskan.** Det är rundans enda påstående
där leverantören lovar något bilden motsäger.

### ☠️ "Für die ganze Familie … zur Arbeit" — den här gången STÄMMER lasten

A2:s tyska inledning är samma familjeargument som fällde runda 88:s modell
A. Skillnaden är att A2 faktiskt **klarar 100 kg** och har ett styre på
92–100 cm. En vuxen får plats. Påståendet är alltså inte osant här.

⚠️ Men det ska ändå inte skrivas som leverantören gör. "Till jobbet" är en
pendlingsutsaga om en sparkcykel som säljs för barn från 5 år, och runda 88
gav redan modell I rollen som "den en vuxen kan låna". A2 får sin egen
vinkel: **den största** — 143 cm, 16-tumshjul fram OCH bak, V-bromsar.

### ☠️ Styrhöjden säger emot åldern, och siffran ska styra

Alla tre modellerna anges "ab 5 Jahren". Måtten säger något annat:

| modell | lägsta styrhöjd |
|---|--:|
| D | **75 cm** |
| F | 88 cm |
| A2 | **92 cm** |

A2:s LÄGSTA läge är högre än D:s HÖGSTA. Samma åldersuppgift på båda kan
alltså inte vara vägledande. Texterna gör som runda 88:s modell B gjorde:
de anger åldern som leverantören gör, men låter **styrhöjden** vara det
kunden mäter mot.

### ✅ Bromsarna är verifierade i bild

- **A2**: V-broms fram och bak, manövrerad från styret — bromsoken syns på
  `79186373-4` och `c4375606-4`.
- **F**: V-broms på framhjulet syns i zoom på `4fd26086-3`.
- **D**: bromsvajer och grepp syns på `479e9c2e-3`.

Alla tre anges med **broms på båda hjulen**. Ingen av dem har bara bakbroms
— det skiljer dem från runda 88:s modell A och B.

### ⚠️ Mekaniska fel i källan, lagade vid importen eller här

- `[BRAND NAME]`-hålet: D:s tyska inledning börjar *"Dieser Tretroller **von**
  ist das ideale Geschenk"* — prepositionen pekar på ingenting. Hela texten
  skrivs om, så det spelar ingen roll för kunden, men det är ett kvitto på
  att strykningen är mekanisk.
- D:s två syskon har **olika paketmått** (92,5 × 46 × 15,5 mot 89 × 16 × 44)
  trots identiska produktmått. Runda 59:s regel: paketmått bevisar ingenting.
  Brödtexten är ordagrant densamma, alltså samma modell.
- A2 anger både **totalbredd 58 cm** och **styrbredd 56 cm**. Båda stämmer
  och båda får stå — det är inte en motsägelse.

### Verifierade tal per modell

**A2** — 143 × 58 × 92–100 cm · styrbredd 56 cm · fotplatta 36 × 12 cm ·
markfrigång 11 cm · **16-tumshjul fram och bak, luftdäck** · **V-broms fram
och bak** · stålram · **maxlast 100 kg** · från 5 år · **vikt 10,6 kg** ·
metallstöd · kullagrat styre

**D** — 120 × 58 × 75–80 cm · **hjul Ø12 tum** · uppblåsbara gummidäck ·
**broms fram och bak** · stål, aluminium och gummi · pulverlackerad stålram ·
**maxlast 100 kg** · från 5 år · **vikt 8,2 kg** · mjukt omlindat styre ·
montering krävs

**F** — 135 × 58 × 88–94 cm · **framhjul Ø41 cm, bakhjul Ø30 cm** ·
uppblåsbara gummidäck · **broms fram och bak** · stål, aluminium och gummi ·
pulverlackerad stålram · **maxlast 100 kg** · från 5 år · **vikt 9,5 kg** ·
montering krävs
