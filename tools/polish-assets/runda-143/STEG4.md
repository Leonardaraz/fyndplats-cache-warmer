# Runda 143 — Steg 4 + 5: kontaktkartan flyttade en produkt mellan grupper och fällde fem bilder

84 bilder hämtade, sex kontaktkartor, varje måttritning läst i förstoring.
Elva fynd, och tre av dem hade texten ensam aldrig kunnat ge.

## ☠️ 1. Leverantörens logotyp låg i ÖVRE HÖGRA hörnet

`f8d974b3` bild 3 bär **`SPORTNOW by Aosom`** inbränt i pixlarna — röd logotyp
med blå pil, plus `by Aosom` i svart under.

Runbookens Steg 4 säger: *"Titta i bildernas ÖVRE VÄNSTRA HÖRN — leverantörens
logotyp bor där."* Den här sitter uppe till **HÖGER**. En granskning som bara
tittar vänster hade släppt igenom den, och #551 hade fått en syster.

**Regeln behöver breddas: leta i BÅDA övre hörnen.** Kostnaden för att titta på
det andra hörnet är noll; kostnaden för att missa är leverantörens namn på en
kundsida.

✅ Bakgrunden är en jämn grå gradient, alltså **tvättbar** — logotypen är pålagd
på bakgrunden, inte på varan. Leonards gräns 2026-08-06 gäller åt andra hållet:
ett märke som sitter FYSISKT på godset rör vi inte.

## ☠️ 2. Fem produkter bär husmärket FYSISKT — och de bilderna ska INTE röras

| pid | var | märke |
|---|---|---|
| `1409d762` | tryckt på säcken | HOMCOM |
| `74602345` | tryckt på säcken och på fotringen | HOMCOM |
| `c00988e3` | tryckt på säcken | HOMCOM |
| `702c7795` | tryckt lodrätt på säcken | SPORTNOW |
| `9119599f` | tryckt på dockans kropp | SPORTNOW |
| `6f603856` | tryckt på säcken | SPORT(NOW) |
| `438295ae` | tryckt i gult på kroppen | SPORTNOW |

Leonard, ordagrant: *"om märket sitter fysiskt på varan så gör vi inget åt det,
det är så produkten ser ut"*. Bilderna står kvar. Märket stryks ur **texten** —
namn, titel, meta, slug, sökord och varje alt-text.

☠️ **Men TVÅ bilder är inte produktfoton, de är MÄRKESKORT.** `1409d762` bild 5
och `c00988e3` bild 4 är helbilds-närbilder av HOMCOM-logotypen med
`Popular Products for Home` under. De visar ingen produktegenskap alls. De är
samtidigt den svagaste bilden i galleriet och den läckigaste. **Båda plockas
bort.**

## ☠️ 3. Måttritningen är INTE alltid facit — `d307632a` bevisar undantaget

| källa | totalhöjd |
|---|---|
| Måttritningen (bild 3) | **175–200 cm** |
| Technische Daten | **175–220 cm** |
| Spec-raden | 220 cm |

Runbooken säger att ritningen vinner när två mått strider. Här förlorar den, och
det går att BEVISA med ett tredje tal i samma text:

```
Hakenhöhe: 165-210 cm
```

Krokhöjden är 10 cm under toppen. Med totalhöjd 220 går det ihop (210 < 220).
Med ritningens 200 skulle kroken sitta **tio centimeter ovanför stativets egen
topp** — fysiskt omöjligt.

✅ **Ritningen är alltså defekt, inte texten.** Och en defekt måttritning får
inte ligga i galleriet: skriver sidan 220 medan bild 3 säger 200 är det en
motsägelse KUNDEN ser, oavsett vem som har rätt. **Bild 3 plockas bort på
`d307632a`.**

**Regeln, ny: när ritningen strider mot texten, leta ett TREDJE tal som
begränsar båda.** Finns det avgör det. Finns det inte står ritningen kvar som
facit.

## ☠️ 4. `c5c228ab` är ingen boxdocka — bilden avgjorde

Namnet säger `Standboxsack **Boxpuppe Boxdummy** DummyTraining Boxpartner`.
Bild 1 och 2 visar en rak **cylindrisk säck** på en fot, brun och svart. Ingen
kropp, inga armar, ingen form.

Det är runbookens `Gaming Stuhl`-fälla i en ny familj: **titelns kategoriord är
en hypotes, inte ett faktum** — och Aosom sökordsstoppar titlarna. Jämför
`9119599f`, som ÄR en docka: torsoformad kropp med färgmarkerade träffytor.

`c5c228ab` flyttas från grupp D till grupp C och säljs som fristående säck.
Hade titeln fått bestämma hade kunden beställt en docka och fått en säck.

## ☠️ 5. `438295ae` skiljer sig från sina "färgsyskon" på MER än färgen

Steg 1 avgjorde de tre som färgsyskon på att varje mått i texten var identiskt.
Ritningarna säger något annat:

| | `86f2cb63` | `57986794` | `438295ae` |
|---|---|---|---|
| Boxstång i ritningen | 50 cm | 50 cm | **45 cm** |
| Boxstång i texten | 50 cm | 50 cm | **50 cm** |
| Husmärke på kroppen | nej | nej | **SPORTNOW i gult** |

☠️ `438295ae`:s egen ritning säger 45 cm där dess egen text säger 50. De två
andras ritningar säger 50 och stämmer med texten. **Boxstångens längd är
därför inte publicerbar på `438295ae`** — och de tre är fortfarande tre sidor,
men skillnaden är inte bara en färg.

⚠️ Steg 1:s slutsats står: de ÄR samma modell, och tre sidor med korslänk är
rätt. Men "delar exakt allt utom färgen" var för starkt sagt, och det var
ritningen som visade det. **En färgsyskonsdom ska prövas mot ritningarna, inte
bara mot spec-texten.**

## ☠️ 6. Bilderna lovar en boxsäck som inte ingår — på TVÅ produkter

| pid | bilder som visar en säck | vad `Lieferumfang` listar |
|---|---|---|
| `f8d974b3` | **2, 4 och 5 av 5** | stativ + anvisning |
| `b6c4c619` | **2, 4 och 5 av 5** | fäste + skruvar + krokar + anvisning |

Tre femtedelar av galleriet visar produkten i bruk med en säck som kunden inte
får. Leverantören säger det själv på `f8d974b3`: *"Nur der Boxsackständer:
Boxsack und Hantelscheiben sind nicht im Lieferumfang enthalten."*

Bilderna kan inte plockas bort — då återstår två. **Texten får därför bära
hela lasten**, och orden måste stå i ingressen, inte i en fotnot: säcken ingår
inte. Samma klass som #554, och det var en ⚠️ då; här är det tre av fem bilder
på två sidor.

## ☠️ 7. `b6c4c619`:s bilder visar fästet på en SLÄT VÄGG

Bild 2, 4 och 5 visar fästet monterat på vad som ser ut som målad gips eller
puts. Leverantörens egen text säger betong, tegel eller massivt trä.

Det är Steg 2:s fynd, men det gör det värre: **bilden antyder motsatsen till
kravet.** Kunden som tittar på bild 5 ser ett fäste på en slät grå vägg och
drar slutsatsen att vilken vägg som helst duger. Texten måste alltså inte bara
nämna underlaget — den måste motsäga det bilden visar.

## ☠️ 8. `87ec8a16` bild 5 bär ENGELSK text — och den är FELSTAVAD

Närbilden på bollen visar, ordagrant:

```
WET NEEDLE BEFOE INSERTING
4LBS MAXIMUM PRESSURE
```

`BEFOE` är leverantörens stavfel för `BEFORE`. Bilden är dessutom helbild på en
engelsk instruktionstext på en svensk produktsida. Det är #408:s klass —
skräpet i bilderna är engelskt lika ofta som tyskt. **Bilden plockas bort.**

⚠️ Talet `4 lbs` är i sig ett faktum, men det står bara i en felstavad
engelsk etikett och finns inte i någon textkälla. Det skrivs inte.

## ✅ 9. Ritningarna GAV fakta som texten saknade

Tre produkter fick mått ur bild 3 som inte står i `Technische Daten`:

| pid | nytt ur ritningen |
|---|---|
| `7eeb7497` | säcken är **Ø30 × 95 cm** — texten gav bara Ø50 × 165 totalt |
| `9119599f` | dockans kropp är **46 cm bred och 90 cm hög** |
| `c00988e3` | punchingbollens höjdläge spänner **167–187 cm** |

☠️ **Och `c00988e3`:s räckvidd löser rundans andra motsägelse.** Texten säger
`vier verschiedene Höhen` på ett ställe och `5-stufig` på ett annat. Antalet
går alltså inte att skriva. Men ritningen ger SPANNET, och inget motsäger det.

**Regeln: när två källor är oense om ett ANTAL och en tredje ger SPANNET,
publicera spannet och släpp antalet.** Kunden vill veta hur högt bollen sitter,
inte i hur många hack.

## ✅ 10. Åtta ritningar stämde exakt mot texten

`49d6d56f` (185–231 · 97 · 29 · 175 · 91), `6f603856` (220 · 90 · 30 · 123 ·
141), `1409d762` (170 · 50), `0deb6901` (175 · 57), `74602345` (25 · 110 · 180
· 40 · 60), `702c7795` (32 · 115 · 180 · 60 · 60), `c5c228ab` (158–186 · 26 ·
60 · Ø55) och `b6c4c619` (80 · 17 · 48).

Det är kontrollen som gör de tre avvikelserna ovan till FYND i stället för till
brus: åtta av elva ritningar stämmer på decimalen.

## ⚠️ 11. Två småsaker som inte fäller något

- **`49d6d56f`:s säck visas FYLLD i alla fyra bilder** men levereras tom —
  leverantören skriver *"kann sofort befüllt werden"*. Texten ska säga att
  säcken är ofylld vid leverans.
- **`74602345` bär ett kinesiskt skrifttecken** tryckt på säcken (武, "kampsport").
  Det sitter fysiskt på varan och är alltså ingen overlay. Det får beskrivas,
  och leverantörens egen text gör en poäng av det.
- **`49d6d56f` har bara FYRA bilder**, inte fem. Kandidat för bildreparationen;
  Steg 9 får inte anta fem.
- **`c5c228ab` saknar alt-text helt** på alla fem bilder (`null`), medan de
  övriga sexton bär tysk alt-text.

## Sammanställning: bilder som plockas bort

| pid | bild | varför |
|---|--:|---|
| `d307632a` | 3 | måttritningen säger 175–200 där kroken bevisar 175–220 |
| `1409d762` | 5 | helbilds HOMCOM-logotyp, ingen produktegenskap |
| `c00988e3` | 4 | helbilds HOMCOM-logotyp, ingen produktegenskap |
| `87ec8a16` | 5 | engelsk, felstavad instruktionstext i pixlarna |

Och EN bild tvättas i stället för att plockas: `f8d974b3` bild 3, där
`SPORTNOW by Aosom` ligger på en jämn grå bakgrund.
