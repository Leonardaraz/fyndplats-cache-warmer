# Runda 104 Steg 2 + 4 + 5 — elva utkast granskade var för sig

Varje utkast lästes av en egen agent som hämtade källtexten OCH laddade ner
och tittade på alla fem bilderna. Måttritningen lästes av tal för tal och
ställdes mot spec-blocket, enligt runda 103:s regel.

## Fyra modeller, klustrade på MÅTTRADEN

| modell | mått (L × B × H) | medlemmar | färg i källan |
|---|---|---|---|
| **A** terrängfordon | 100 × 64 × 56 | `ed84746c` · `60ab2042` · `3b992525` | Grau+Schwarz · Blau+Schwarz · Gelb+Schwarz |
| **B** elbil | 96 × 61 × 56 | `f15febb2` · `3d9dff8a` · `2f6ff71c` | Rosa · Orange · Blau |
| **C** motorcykel | 106,5 × 56 × 80 | `5e9cc2d2` · `1e27f7e0` | Weiß · Gelb |
| **D** polisbil | 96 × 60 × 45 | `9308a7dc` | Mehrfarbig |
| **E** sportbil | 98 × 59 × 43 | `c0abfddd` | Grau |
| **F** quad | 100 × 65 × 73 | `883db249` | Orange |

✅ **Ingen kopierad spec-block-fälla den här gången.** Modell A:s tre syskon och
modell B:s tre syskon har identiska tal på både ritning och i text, och
ritningarna bekräftar dem. Det är motsatsen till runda 103.

## ☠️ SEX av elva bär ett FORDONSVARUMÄRKE

| utkast | märke | var det sitter |
|---|---|---|
| `ed84746c` `60ab2042` `3b992525` | **Kawasaki Teryx KRX 1000** | i texten OCH fysiskt på fordonet i alla fem bilder |
| `5e9cc2d2` `1e27f7e0` | **Aprilia RX 125** | i texten OCH på framskärm/styrkåpa i bild |
| `c0abfddd` | **Maserati GranTurismo Folgore** | i texten OCH treudden på grill, huv, nav och nackstöd |

☠️ **`c0abfddd` är en Maserati** — det syntes inte i Steg 1, där texten bara sa
"lizenzierte … von [BRAND NAME]". Agenten hittade "Maserati Gran Turismo
Folgore-Design" i brödtexten och treudden i pixlarna.

Licenspåståendena ordagrant: *"Kawasaki-lizenziert"*, *"Das von Aprilia
autorisierte Elektromotorrad"*, *"Dieses konzipierte, lizenzierte
Kinder-Elektroauto"*.

**Fem utkast är helt märkesfria:** modell B:s tre, polisbilen och quaden.
(Quaden bär tillverkarens egen beteckning `QLS-ATV` / `BIGHORN 2.0` i
pixlarna — en modellbeteckning, inte ett licensierat fordonsmärke.)

## ☠️ Två färgangivelser är FEL mot bilden

| utkast | källan säger | bilden visar |
|---|---|---|
| `3b992525` | `Gelb` (gul) | **beige/sand** — pixelmätt `#d6b69d`, nyans 29–30°, mättnad 20–34 %. Gult ligger runt 50–60° med hög mättnad. |
| `1e27f7e0` | `Gelb` (gul) | **svart motorcykel** med gula och röda dekaler |

Att skriva "gul" på någon av dem vore ett direkt fel mot kunden. Färgen ska
läsas ur bilden, inte ur källans färgord.

## ☠️ Åldern motsäger sig själv på modell A

Spec-blocket och måttritningen säger båda `3-5 Jahre`. **Bildernas alt-text —
alltså feedens ursprungstitel — säger `3-8 Jahren`.** Ritningen och specen är
eniga; alt-texten är den som avviker. **Skriv 3–5 år, aldrig 3–8.**

Det är samma familj av fel som runda 103, men åt andra hållet: där ljög
spec-blocket och ritningen hade rätt, här ljuger TITELN och de två andra har
rätt. Regeln står sig: ritningen är facit.

## Tal som INTE går att skriva

| utkast | vad som inte går att avgöra |
|---|---|
| modell A (tre st) | **ingen batterikapacitet alls** i källan — bara "12V" i namnet. Ingen motoreffekt. |
| `9308a7dc` | spec säger `Motor: 25W` (singular), säljpunkten säger `Zwei Motoren`. 2 × 25 W eller 25 W totalt går inte att avgöra. |
| `5e9cc2d2` `1e27f7e0` | spec säger `Motor: 12V 25W` (singular), brödtexten säger `zwei 12V Motoren` två gånger. Samma oklarhet. |
| `883db249` | **motoreffekt anges inte alls** |

Husets regel gäller: när källan motsäger sig själv väljer man inte, man
utelämnar.

## ⚠️ `883db249` har INGEN måttritning

Fem bilder, ingen av dem en måttritning. Måtten `100 × 65 × 73` går alltså inte
att verifiera mot något oberoende. Efter runda 103 är det ett skäl att lägga
den sist, inte att lita på texten.

## ☠️ Importen lämnar TYSKA FÄRGVÄRDEN i den SVENSKA spec-tabellen

Uppmätt på sju av elva: raden har svensk etikett och tyskt värde.

`Färg: Grau` · `Färg: Blau` · `Färg: Gelb` · `Färg: Weiß` · `Färg: Pink` ·
`Färg: Multifarben` · `Material: Kunststoff`

Det är ett IMPORT-fel, inte ett poleringsfel — men det når kunden om ingen
rättar det. Samma klass som `[BRAND NAME]`-platshållaren.

## ⚠️ Tysk text i pixlarna på NIO av elva

Måttritningarna bär `Empfohlenes Alter: 3-5 Jahre` och `Gewichtsgrenze: 30KG`
inbränt. Position 3 är normalt en av de rena positionerna (23/30 enligt husets
mätning), men här är den tysk på nästan hela familjen.

Bara `5e9cc2d2` och `1e27f7e0` (motorcyklarna) är fria från tysk text i bild.

## Vad som går att polera NU

**Modell B — de tre elbilarna.** Märkesfria, fullständiga specar (batteri
12V 4,5 Ah, motor 2 × 12V 25W, laddtid 8–12 h, körtid 45 min), ritning och text
överens på varje tal, och tre distinkta färger.

| id8 | färg | pris |
|---|---|--:|
| `f15febb2` | rosa | 2 229 |
| `3d9dff8a` | orange | 2 069 |
| `2f6ff71c` | blå | 2 159 |

De sex märkesbärande väntar på den juridiska genomgången.
