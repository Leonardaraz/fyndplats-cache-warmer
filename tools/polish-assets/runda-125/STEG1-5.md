# Runda 125 Steg 1–5 — verktygsfamiljens rullande halva

## ☠️ Steg 1: utkastfiltret dolde SEX av familjen — tyskan har också ä och ö

Runbookens Steg-1-regel säger *"filtrera på `visible === false` **och** att namnet
saknar å/ä/ö"*. Ä och Ö är SAMMA teckenkoder i tyskan. Uppmätt över hela
katalogen 2026-09-10:

| | |
|---|--:|
| Utkast totalt | 3 087 |
| Varav namnet bär **ä eller ö** | **1 130** |
| Andel osynlig för regeln | **36,6 %** |

I den här familjen kostade det sex rader: `Rädern`, `Lochwänden`, `Sägeböcke`,
`Außenbereich`. Bland dem `5745c3cb` och `a389ddaa` — **precis de två runda 124
uttryckligen lämnade över**. De hittades bara för att de saknades där de skulle
stå.

✅ **Rättningen: `å` finns INTE i tyskan.** Använd `/[åÅ]/` som utkast-
diskriminator, eller kräv ett tyskt drag (`ß`, `ü`, `mit`/`und`/`für`). Aldrig
`[åäöÅÄÖ]`. Uppgift #465.

Med rätt filter: **33 träffar** på `Werkzeug|Werkstatt|Werkbank|Rollschrank|Metallschrank`,
mot 21 med det gamla.

### Vad som räknades bort ur de 33

| bort | varför |
|---|---|
| `d16f677e` Fußballtor-Set *"inkl. Werkzeug"* | huvudordsregeln — `Werkzeug` är egenskap |
| `cf7595fe` `35af025a` `a4e3545d` `fecc1b3f` `7df00a4a` `11282914` | Gartenschrank/-schuppen → bodfamiljen (runda 86–87) |
| `5a0f9799` `beeada22` Aktenschrank | arkivskåp, kontor — egen familj |
| `349b7403` `17e683e0` `941867cb` `9e9c78b9` `88eb3627` `81c123fa` | verkstadsbänkar, sågbockar, metallskåp — nästa runda |
| `a389ddaa` | ☠️ bevisad dubblett av publicerade `5b27721d` (uppgift #453) |

## ☠️ BEVISAD DUBBLETT: `aff28a71` ÄR publicerade `8723db20`

Pixelgrinden gav **0,00 på TVÅ bildpar** — byte-identiska foton, inte lika foton:

```
aff28a71 pos2  ↔  8723db20 pos2   0.00
aff28a71 pos3  ↔  8723db20 pos3   0.00
```

Specen bekräftar rad för rad: 82 × 35 × 76, hyllplan 70 × 35 × 6, låda
61 × 30 × 6,5, 30 kg per plan och 60 kg totalt, färg **röd**. Utkastet kostar
1 079 kr, den publicerade sidan 1 089 kr.

**Poleras INTE.** Vilken av de två som ska bort är ett affärsbeslut med ett
inköpspris i sig — flaggat för Leonard, som runbooken kräver.

⚠️ **Systervarianten `6c9d7288` är däremot en LUCKA**, inte en dubblett: samma
modell rad för rad men **ljusblå + svart** i stället för röd, egna foton
(lägsta avstånd 49,20). Den poleras, med korslänk till den röda.

## ☠️ Måttgrinden gav 3/3 på FEM rader där NOLL är dubbletter

Grinden pekade ut `35b4fba0`, `bc698424` och `f4fabca6` mot BÅDA de publicerade
femlådiga vagnarna, och `6c9d7288`/`aff28a71` mot ett sjätte skåp. Alla utom
`aff28a71` föll bort när specen och bilden lästes:

| utkast | matchade | vad som skilde |
|---|---|---|
| `35b4fba0` | `f9de10ab` (svart), `50a64a95` (blå) | **inget utom färgen** → tredje färgen |
| `bc698424` `f4fabca6` | samma | **7 lådor mot 5** — annan modell på samma stomme |
| `6c9d7288` | `3d71da2b` | talen kom ur PAKETMÅTTET, inte produkten |
| `3659a7eb` | `65b07b7a` | delar överkistan 45 × 24 × 33 — men EN dörr mot TVÅ, och 60 cm mot 80 |
| `5910cd6f` | `3d71da2b` | 131 cm mot 108, annan överkista |

☠️ **Paketmåttet är inte produktmåttet, och grinden läste båda.**
`35b4fba0`, `bc698424` och `f4fabca6` bär alla `Paketmått: 66,5 × 38,5 × 73` —
samma kartong för tre olika modeller. Den publicerade `f9de10ab` bär exakt samma
tal. Tre av fem "3/3" kom därifrån. Uppgift #407:s lärdom en gång till, med en
ny orsak: **stommen delas, och kartongen delas ännu oftare.**

☠️ **Och `65b07b7a` delar överkista med `3659a7eb`** — 45 × 24 × 33, samma
102 cm totalhöjd, samma fem lådor, samma svart-och-rött. Bilden avgjorde:
den publicerade har **två dörrar, två lådor och ett fastskruvat hålplansställ**
på sidan; utkastet har **en dörr, en låda och en liten avlastningsskål**.

## Rundans tio

| # | id | pris | konstruktion | färg |
|---|---|--:|---|---|
| 1 | `6c9d7288` | 1 049 | 3 plan 82 × 35 × 76, 1 låda, hålremsa, 60 kg | **ljusblå + svart** |
| 2 | `3659a7eb` | 1 799 | tvådelad 60 × 28 × 102: överkista 45 × 24 × 33 (4 lådor) + rullskåp (1 låda, låsbar dörr) | svart + röd |
| 3 | `bdd01b5f` | 1 939 | rullbord, arbetsytan drar ut 70 → 130 cm, 1 låda, 80 kg | svart |
| 4 | `5745c3cb` | 1 949 | tre stapelbara kistor 52 × 32 × 72 på hjul, teleskophandtag, 45 kg | röd + svart |
| 5 | `35b4fba0` | 1 979 | 69 × 33 × 75, **5 lådor**, 150 kg | **röd** |
| 6 | `bc698424` | 2 239 | 69 × 33 × 75, **7 lådor** (2 grunda + 5 djupa), 150 kg | **mattsvart** |
| 7 | `f4fabca6` | 2 269 | samma stomme, **7 lådor** | **röd** |
| 8 | `1b534b0e` | 2 299 | 61,5 × 33 × 82,5, **5 lådor** (3 grunda + 2 djupa), lås | **blå** |
| 9 | `5447468e` | 2 369 | samma | **svart** |
| 10 | `5910cd6f` | 2 379 | tre delar 60,5 × 33,5 × 131: överkista (4 lådor) + mellankista + rullskåp (2 lådor, skåp), 100 kg | **röd** |

Fyra färgpar inom rundan: 6↔7, 8↔9, och 5 mot två PUBLICERADE syskon.

## SKU:n räknad i Steg 1, som regeln kräver

Första omgången slugar gav **två SKU-krockar mellan färgsyskon** och åtta
avhuggna sista-tokens. Omskrivna så kvalificeraren ryms i de 24 tecknen:

| id | slug | SKU |
|---|---|---|
| `6c9d7288` | `verktygsvagn-bla-3-plan` | `FP-verktygsvagn-bla-3-plan` |
| `3659a7eb` | `verktygsvagn-overkista` | `FP-verktygsvagn-overkista` |
| `bdd01b5f` | `verkstadsvagn-utdragbar` | `FP-verkstadsvagn-utdragbar` |
| `5745c3cb` | `verktygslada-set-3-delar` | `FP-verktygslada-set-3-delar` |
| `35b4fba0` | `verktygsvagn-rod-5-lador` | `FP-verktygsvagn-rod-5-lador` |
| `bc698424` | `verktygsvagn-svart-7-lador` | `FP-verktygsvagn-svart-7` ⚠️ |
| `f4fabca6` | `verktygsvagn-rod-7-lador` | `FP-verktygsvagn-rod-7-lador` |
| `1b534b0e` | `verktygsskap-bla-82-cm` | `FP-verktygsskap-bla-82-cm` |
| `5447468e` | `verktygsskap-svart-82-cm` | `FP-verktygsskap-svart-82-cm` |
| `5910cd6f` | `verktygsskap-131-cm-rod` | `FP-verktygsskap-131-cm-rod` |

⚠️ Bara `bc698424` tappar en token, och den tappar `lador` — **färgen OCH
antalet står kvar** (`svart-7`), och strängen är unik mot både rundan och de
fjorton publicerade familjesidorna.

☠️ **Sökordskrocken var verklig.** `1b534b0e` är BLÅ med FEM lådor, och
`verkstadsvagn-bla-5-lador` ligger redan publicerad. Löst med ett annat huvudord
och ett annat mått (`verktygsskåp 82 cm`) i stället för en kvalificerare —
runbookens regel om krock i egen batch.

## Steg 2 — laglighetsgrinden: ingen stoppklass

Verkstadsförvaring i stål. Inga djur, ingen el, ingen barnprodukt, inget
livsmedel. Enda bindande påståendena är **bärigheterna** (45–150 kg totalt plus
per låda) och **låsbarheten**. Båda står i leverantörens spec och skrivs
ordagrant. Ingen blockerare.

## Steg 5 — sju fynd som hade nått kund

1. ☠️ **`aff28a71` är publicerade `8723db20`.** Se ovan.
2. ☠️ **`bdd01b5f` bild 4 bär TYSK TEXT i pixlarna**: *FREI BEWEGLICH ·
   Bequem überallhin verschieben · Seitenhandgriff · 4 Universal-Rollen
   (2 mit Bremse)*. Stor, läsbar, går inte att polera bort. **Plockas bort.**
3. ☠️ **`5910cd6f` bild 4 OCH 5 bär tysk text**: *Kugelgelagerte Schienen ·
   EVA-Schutzeinlagen · Seitengriffe* respektive *Autowerkstatt · Lager ·
   Garage · Werkstätten*. **Båda plockas bort** — sidan behåller tre bilder.
4. ☠️ **`35b4fba0`s spec-block bär fel feedkolumn**: `Mått: 5 Schubladen`.
   Samma fel på `bc698424` och `f4fabca6` (`Mått: 7 Schubladen`). Det RIKTIGA
   måttet står bara i den tyska brödtexten och på måttritningen: 69 × 33 × 75.
   Runda 124:s fynd #5 en gång till, nu på tre rader.
5. ☠️ **`5745c3cb`s spec-block säger `Material: Kunststoff`** medan brödtexten
   säger *"Robuster Stahlkörper"* och den tyska specen `Stahl, Kunststoff`.
   Stommen är STÅL med plastdetaljer. Att sälja ett stålset som plast är fel åt
   det dyra hållet.
6. ☠️ **Tre spec-block bär bara HALVA färgen.** `5745c3cb` står som `Rot`
   (är röd + svart), `3659a7eb` som `Rot` (är svart + röd), `bc698424` som
   `Schwarz` medan den tyska raden säger `Mattschwarz`.
7. ⚠️ **`5447468e`s HJÄLTEBILD ser grå ut** — dess drawer-fronter renderas i
   ljusgrått mot en svart stomme. Fyra av fem bilder visar samma skåp som
   entydigt SVART. Färgen är svart; det är ljussättningen i bild 1 som ljuger.
   **Motsatsen till runda 124:s `22bedfb0`** — där ljög spec-fältet och bilden
   hade rätt. Slutsatsen är densamma åt båda håll: **en färg avgörs på FLERA
   bilder, inte på hjälten.**

## Lämnas till Leonard

⚠️ **`1b534b0e` bild 2 bär en läsbar DEWALT-skylt** på hålplanken i bakgrunden.
Tredjepartsmärke i SCENEN, inte på varan — samma klass som runda 124:s
AutoMeter och SKIL. Läggs till uppgift #461 i stället för att plockas bort på
egen hand, så beslutet blir ett och inte fem.
