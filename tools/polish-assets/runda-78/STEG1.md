# Runda 78, Steg 1 — rullpallar och arbetspallar

## Svepet

| | |
|---|--:|
| sidor | **56** (28 + 28, markören vidareskickad) |
| rader | 5 502 |
| unika id | 5 502 |
| `avhuggen` | **false** |
| publicerade | 2 047 |

⚠️ Kravet på `avhuggen: false` är inte en formalitet. ExecuteWixAPI föll på
**60 s timeout** vid 56 sidor i ETT anrop — svaret blev ett fel, inte en halv
katalog, vilket är rätt håll att fela åt. Men ett svep som i stället tystnat
efter 30 sidor hade sett komplett ut, och det är exakt det som gjorde runda 77:s
krock nästan omöjlig att se.

☠️ **Och FÖRSTA svepet blev för stort att returnera** (~21 900 token mot taket
6 000) och kapades av verktyget. Ett kapat svar är inte ett kapat svep — men om
man läser den kapade listan som "familjen" polerar man en delmängd och tror att
det är helheten. Andra svepet returnerar därför AGGREGAT, inte rader.

## Stolfamiljens tyska utkast, hela katalogen

| familj | utkast |
|---|--:|
| massagestol | 112 |
| kontorsstol | 84 |
| matstol | 64 |
| **rullpall / arbetspall** | **33** |
| gamingstol | 16 |
| knästol | 9 |
| campingstol | 8 |
| övrigt (stol i namnet) | 346 |

☠️ **De 33 "rullpallarna" är 16.** `Sitzhocker` betyder både *arbetspall på
hjul* och *sittpuff med förvaring*, och sjutton av de 33 är puffar
(`Aufbewahrungshocker`, `Fußhocker`, `Polsterbank`) — en helt annan produkt,
redan polerad i runda 24. Ett ord som bär två produkttyper är ett såll som
släpper igenom fel vara; familjen avgjordes på SPECEN, inte på namnet.

## ☠️ Tvillinggrinden fäller `df3a97c6` — och hittar en dubblett som redan är LIVE

| | mått | sitthöjd | totalhöjd | maxlast |
|---|---|---|---|--:|
| utkast `df3a97c6` | 50 × 50 × 83–98 | — | 83–98 | 120 kg |
| publ. `arbetsstol-hjul-51-67-cm-avtagbar-rygg` | 50 × 50 × 83–98 | 51–67 | 83–98 | 120 kg |
| publ. `sadelstol-med-ryggstod-vit` | — | 51–67 | 83–98 | 120 kg |

Utkastet matchar den publicerade arbetsstolen på **alla tre axlar plus
maxlasten**. Det poleras INTE.

⚠️ **Men de två PUBLICERADE sidorna delar samma fem tal med varandra.** Det är
samma klass som #305: en intern dubblett mellan två sidor som redan ligger live,
osynlig för varje id-baserad kontroll eftersom den ena kom in via AliExpress och
den andra via feeden. Flaggat, inte åtgärdat — sidorna ligger och två sidor som
kannibaliserar varandra är ett sortimentsbeslut, inte en poleringsåtgärd.

## Rundans åtta, och varför var och en är sin egen sida

Åtta produkter med åtta olika vinklar — ingen av dem konkurrerar om samma
sökning, och alla åtta korslänkar de andra.

| id8 | pris | mått | sitthöjd | maxlast | vinkeln |
|---|--:|---|---|--:|---|
| 5646a8ff | 849 | 64,5 × 33 × 35 | **fast** | 135 | verkstadspall med lådor och verktygsfack |
| f18dfc3b | 999 | 42,5 × 35,5 × 56,5–71,5 | — | 120 | pendelpall utan rygg, vippar 5° |
| 239e68b8 | 729 | 39 × 34,5 × 52–67,5 | 52–67,5 | 120 | salongspall utan rygg, 9 cm skum |
| 15ff0d64 | 799 | 43 × 43 × 59–75 | 49–65 | 120 | rygg OCH fotring |
| d348bf64 | 799 | Ø35 × 72–84 | 43–55 | 136 | hög, rund bas, svart |
| fa078e03 | 819 | Ø35 × 72–84 | — | 135 | **färgsyskon** till d348bf64, ljusbrun |
| 87de04ad | 949 | 50 × 54 × 66–78 | 45–57 | 136 | bred bas 50 × 54 |
| 28532aab | 1029 | Ø35,5 | 48–63 | 120 | **2-pack** |

## Kvar till runda 79

`983fe163` + `98c1b3cb` (färgpar 32 × 40 × 70–86, vit/svart) · `711f7859`
(Ø50 × 63–83) · `c328a7c0` (38 × 38 × 57–72) · `12ce97db` (48 × 47 × 45–59) ·
`20782c24` (52 × 53 × 49–61, rosa) · `b9ab45db` — ☠️ den sista är INGEN rullpall
utan en snurrstol med armstöd och ryggstöd, 60 × 60 × 79–91 och 10,7 kg. Den
säljs som `Arbeitshocker Drehhocker` i källan; namnet ljuger om produkttypen.

## ☠️ Ett mätfel jag gjorde själv, värt att skriva ned

Första läsningen rapporterade `bilder: 0` på åtta utkast. Det var inte sant:
anropet bar `?fields=PLAIN_DESCRIPTION` utan `MEDIA_ITEMS_INFO`, och V3
returnerar då `media.itemsInfo.items` **tom** i stället för att fela. Exakt den
fälla CLAUDE.md redan bär mätt sedan 2026-08-27 — och den bet ändå, för den ser
i svaret ut som en produkt utan bilder. Alla åtta har fem bilder.
