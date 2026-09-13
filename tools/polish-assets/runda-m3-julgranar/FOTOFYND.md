# Vad fotona sa INNAN texten skrevs — runda M3

Kontaktarket byggdes före brödtexten (regeln från runda J1). Fyrtio bilder över
åtta granar. Rundan gav fyra fynd, och två av dem kunde ingen grind ha sett.

## ☠️ Tre granar med IDENTISK källtext är tre OLIKA granar

`89d967af`, `5edc1480` och `efba03f0` bär exakt samma tyska namn
(*Weihnachtsbaum, Kunsttanne, realistisches Aussehen, schneller Aufbau*) och
källtexter som är ord för ord identiska. Det enda som skiljer dem i TEXT är fem
tal: höjden, grenantalet, formningstiden, vikten och paketmåttet.

Läst bara i källan är slutsatsen självklar och fel: *en modell i tre storlekar,
skriv samma text tre gånger och byt talen*. Fotot säger något annat.

| kort | höjd | grenar | bredd ÷ höjd | vad bild 1 visar |
| :-- | --: | --: | --: | :-- |
| `89d967af` | 210 cm | 2 608 | **0,67** | smal, tydliga våningar med luft emellan, **rödbrun stam synlig hela vägen upp** |
| `5edc1480` | 180 cm | 1 942 | **0,76** | tätast och bredast, **ingen stam syns**, uppåtriktade grenspetsar, klassisk kon |
| `efba03f0` | 150 cm | 1 290 | **0,67** | låg och bred, kort stam bara nertill, **blandade nållängder** med långa spretiga spetsar |

☠️ **`5edc1480` är en annan konstruktion, inte ett mellansteg.** Den är märkbart
bredare i förhållande till sin höjd (0,76 mot 0,67) och saknar den synliga stam
som är det första ögat fastnar på hos de två andra. Talet 0,76 finns i källan —
men bara som två separata mått som ingen jämför. Det var fotot som ställde frågan.

**Följden för texten:** de tre får skilda första meningar och skilda namn. Att
skriva "samma gran i tre storlekar" hade varit en sann mening om fel produkt.

## ☠️ `bdc71526` står på en LYKTA — källan säger bara "Standfuß"

Källtexten nämner foten tre gånger och aldrig vad den är:

```
✔ Schlanker, fester Standfuß des Weihnachtsbaums sorgt für Stabilität
  und zaubert magisches Licht
✔ Basisgröße: 18,5L x 18,5B x 26,5H cm
   … während der rustikale, feste Standfuß jedem Raum einen
     zauberhaften, festlichen Akzent verleiht
```

Läst som text är det ett vanligt granstativ, och *"zaubert magisches Licht"* är
granens egna lysdioder. Bild 1 och 4 visar något helt annat: foten är en
**lykta** — en fyrkantig, avsmalnande sockel i antikmässing med ett välvt
glasfönster som lyser inifrån. Måttet 18,5 × 18,5 × 26,5 cm är lyktan.

Det är produktens mest särskiljande drag och det enda som skiljer den från varje
annan 120-centimetersgran i sortimentet — och det står inte i källan.

⚠️ **Ingen grind kunde ha fångat det.** En svensk text som skrev "stadig fot"
hade varit spårbar till sitt underlag, ren i siffergrinden, ren i språkgrinden,
orddiff noll. Samma klass som golvlampan i J1 och tomtens käpp i M2.

## ☠️ Två bilder ska bort som ingen textgrind kan se

| kort | pos | vad det är |
| :-- | --: | :-- |
| `d09b1b4c` | 4 | tysk instruktionsgrafik: *"FÜR EIN ÜPPIGES ERSCHEINUNGSBILD … HINWEIS: Bitte breiten Sie alle Zweige einzeln aus"* |
| `5edc1480` | 5 | husmärket **HOMCOM by Aosom** + *"Frohe Weihnachten!"* |
| `bdc71526` | 5 | **samma fil**, byte-identisk (hash `ebbdc78b`) |

Hash-svepet hittade paret `5edc1480#5` / `bdc71526#5` — 39 unika hashar av 40.
Det hittade **inte** `d09b1b4c#4`, som är unik och därför osynlig för varje
teknik som grupperar på likhet. M2:s lärdom gäller alltså åt båda hållen:
**hashen grupperar, den klassificerar inte** — och den ser bara det som råkar
förekomma två gånger.

⚠️ Planschen i den här rundan visar dessutom en **rosa** gran som inte är någon
av de åtta, i ett rum med fyra granar. Den hade sålt en produkt vi inte har.

## `e1d9dfe8` är en UTOMHUSprodukt, och det syns bara på fotot

Källan säger det i förbigående, mitt i en säljpunkt om stabilitet: *"entlang der
Einfahrt oder in Töpfen neben der Haustür"*. Den har ingen av de andra sju
granarnas `Nur für den Innenbereich`-rad, och den bär `IP44`.

Bild 2 avgör frågan: de två granarna står tända på en snötäckt veranda, nedkörda
i varsin utekruka. Bild 1 och 3 visar varför det går — varje gran sitter på en
**trebent metallspjut** som trycks ner i jorden, inte på ett stativ. De 75 cm i
måttet är gran plus spjut; själva granen är 57 cm.

## `28aa840d`: "Weiß" i specen är KRUKAN, inte granen

Källans `Farbe: Weiß` och den tyska alt-texten *"…Topf, Mini-Tischbaum für
Zuhause Büro, Weiß"* läses lätt som en vit gran. Fotot: granen är **grön med
vit rimfrost** på de nedåtböjda spetsarna, och det som är vitt är den
dekorativa **krukan** (Ø16 × 15H cm). Källan säger det själv en rad längre ner
(*"weiße dekorative Topfbasis"*) — men bara om man läser hela stycket.

⚠️ Och den säljs som `Mini-Tischbaum`. Bild 2, 3 och 5 visar den på GOLVET
bredvid en fåtölj; bara bild 4 visar den på ett bord. 90 cm är båda delarna, och
texten säger båda.

## `d09b1b4c`: källan motsäger sig själv om färgen

Tyska tekniska blocket säger `Farbe: Grün`, den svenska spec-raden säger
`Färg: Weiß`, alt-texten säger `Grün + Weiß`. Fotot ger alt-texten rätt: en grön
gran täckt av vitt konstsnö. Specen skrivs `Grön och vit`.

## Pynt: sex av åtta levereras tomma

Fem av granarna fotograferas pyntade. Bara `e1d9dfe8` har pynt i
`Lieferumfang` (bär, kottar, kulor, blad). `89d967af`, `5edc1480` och
`efba03f0` säger det rakt ut i källan (*"Baumschmuck ist NICHT INBEGRIFFEN und
werden auf dem Foto nur zu Demonstrationszwecken verwendet"*); för
`d09b1b4c`, `9f776653` och `bdc71526` framgår det bara av `Lieferumfang`.
Alla sju säger det i texten.
