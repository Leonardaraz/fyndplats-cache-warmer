# Runda 73 — Steg 1, 4 och 5: mätningarna innan texten

## Katalogsvepet är komplett, inte avhugget

`avhuggen: false` på båda etapperna: **5 502 produkter, 1 994 publicerade**,
172 publicerade fåtöljsidor. Familjen `^Relaxsessel` UTAN
`Elektrisch|Massage|Aufstehhilfe|beheizb|Heiz|USB|Motor` har **exakt åtta**
utkast kvar — hela resten av de 86 Relaxsessel-utkasten tillhör den andra
chattens familjer.

## Dubblettgrinden: tre av åtta är färgsyskon till publicerade sidor

Grinden plockar VARJE `A × B × C cm`-trippel ur alla 172 publicerade
fåtöljsidor och matchar mot utkastens yttermått — inte bara `Mått`-raden, som
saknades på ~50 av sidorna.

| utkast | mått | publicerade med samma trippel |
|---|---|---|
| b72f093d | 88 × 96 × 108 | `gungande-tv-fatolj-` morkbla · gra · beige |
| b1e98da4 | 78 × 67 × 98 | `konstladerfatolj-med-fotpall-svart` |
| b67fdc2b | 80 × 86 × 99 | `vilfatolj-graddvit-…` · `vilfatolj-morkgra-…` · `tv-fatolj-forvaringspall-145` |

Övriga fem (969d9ec9, 54cf1f44, acb1f904, e57125fb, 7eee41b6) har **ingen**
dimensionell tvilling i katalogen.

## ☠️ Måtten hittade familjen — ARTIKELNUMRET avgjorde den

Runda 72:s regel körd skarpt. Alla tre grupper är äkta färgsyskon:

| familj | bas | utkastet | publicerade syskon |
|---|---|---|---|
| Gungande tv-fåtölj 88 × 96 × 108 | **839-974** | b72f093d `839-974V00LR` | `V00DB` mörkblå + grå + beige |
| Vilfåtölj m. fotpall 80 × 86 × 99 | **833-359** | b67fdc2b `833-359` | `V00CW` gräddvit · `V00CG` mörkgrå · `BK` svart |
| Reclinerfåtölj m. fotpall 78 × 67 × 98 | **833-360** | b1e98da4 `833-360` | `BK` svart |

☠️ **Och numren visar det måtten dolde: `833-359` och `833-360` är GRANNAR men
OLIKA MODELLER.** 80 × 86 × 99 / 24 kg / träkryss / pall med förvaring mot
78 × 67 × 98 / 18 kg / rund metallfot / slät pall. Angränsande artikelnummer
är inget släktskapsbevis — bara samma bas är det.

⚠️ De två utkasten b67fdc2b och b1e98da4 bär BASEN utan suffix, alltså
modellens ursprungsfärg; de publicerade syskonen bär suffix.

## ☠️ Källans färgord är FEL på fem av åtta — mätt mot husets egen skala

En absolut mätning räcker inte. `farg.py` kalibrerar mot publicerade sidor där
det svenska ordet redan är låst (`grå` 35–55 %, `gråbrun` 40 % / S 5 %,
`brun` 45–46 % / S 18–22 %, `ljusgrå` 58–63 %, `beige` 77 %).

| utkast | källan | uppmätt | skrivs | varför |
|---|---|---|---|---|
| 969d9ec9 | Hellgrau | L 65 %, S 5 % | ljusgrå | ✓ |
| b72f093d | Hellbraun | L 39 %, S 7 %, H 26° | **gråbrun** | ☠️ mörkare än husets grå, långt från beige |
| 54cf1f44 | Hellgrau | L 50 %, S 4 % | **grå** | ☠️ ljusgrå börjar vid 58 % |
| acb1f904 | Cremeweiß | L 81 %, S 32 % | gräddvit | ✓ |
| e57125fb | Dunkelbraun+Schwarz | L 44 %, S 26 % | **brun** | ☠️ S 26 % ⇒ brun, men inte mörk |
| b1e98da4 | Grau | L 67 %, S 5 % | **ljusgrå** | ☠️ ljusare än hela husets ljusgrå-band |
| b67fdc2b | Braun | L 40 %, S 6 % | **gråbrun** | ☠️ S 6 % ⇒ gråbrun, inte brun |
| 7eee41b6 | Grau | L 50 %, S 2 % | grå | ✓ |

**Varje fel går åt det håll som hade krockat med ett publicerat syskons ord.**
"Hellbraun" skrivet som beige hade krockat med `gungande-tv-fatolj-beige`;
"Braun" skrivet som brun hade legat i ett band huset redan använder för en
mättare nyans.

## Steg 4: bilderna

Fyrtio källbilder granskade på kontaktarket. **Noll leverantörslogotyper, noll
inbränd tysk text.** Alla fem positioner går att använda på alla åtta.

## Steg 5: två påståenden källan gör som inte håller

1. ☠️ **b1e98da4:s tyska text säger "Der Massagestuhl verfügt über eine
   Mikroverriegelungsfunktion".** Produkten har ingen massagefunktion —
   ingen motor, inga vibrationspunkter, inget elnät, och namnet säger det
   inte heller. Ordet är en klipp-och-klistra-rest ur en annan produkts text.
   Funktionen den beskriver (ryggen låses med ett vred) är verklig och står på
   det publicerade syskonets sida. Skrivs som vredet, aldrig som massage.
2. ⚠️ **54cf1f44:s spec-tabell säger `90L x 96B x 98H`** medan den tyska texten
   och måttritningen säger **87 × 96 × 98** upprätt. Nittio är LIGGANDE bredd.
   Måttritningen är facit (runbokens regel): 87 cm.

## ⚠️ En observation om den publicerade katalogen, inte om rundan

Familjen `833-359` säljs i fyra färger under **tre olika namnmönster**:
`vilfatolj-graddvit-med-fotpall`, `vilfatolj-morkgra-med-fotpall` och
`tv-fatolj-forvaringspall-145` — den sista är SVART (`833-359BK`) men bär
inget färgord alls i sitt namn, och står dessutom på `aosomSyncedQty: 0`.
En kund som jämför de fyra kan inte se vilken som är vilken. Eget ärende.
