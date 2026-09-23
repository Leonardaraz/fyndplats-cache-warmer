# Runda 119 Steg 1–5 — familjens nio sista köksvagnar och köksöar

## Svepet

Hela katalogen läst via `products/search`: **3 133 utkast** (32 sidor) och
**2 490 publicerade** (25 sidor), unika = rader i båda, `avhuggen: false`.
Alla nio utkast fortfarande `visible:false`, tyska, fem bilder, en variant.

### ☠️ Svepet svarade först NOLL TRÄFFAR — och det var svepets fel

Ett `products/search` över publicerade sidor gav **0 träffar** på
`koksvagn|kokso|serveringsvagn|…` i en familj jag visste hade tjugosex.
Orsaken: **`slug` är en STRÄNG i `products/search`**, inte ett objekt.
`p.slug?.name` blev `undefined`, `STAM.test("")` blev falskt, och svepet
rapporterade en tom familj utan ett enda fel.

Det som avslöjade det var runbookens egen regel — **misstro svepet först** —
och kontrollen den kräver: svepet MÅSTE hitta `koksvagn-106-cm-utfallbar-skiva-vit`,
en sida jag vet ligger ute. `kanslig_kontroll: 1` efter lagningen.

⚠️ Samma anrop returnerar `url` som ett OBJEKT (`{relativePath, url}`) medan
`slug` är en sträng. Formen är alltså inte konsekvent inom samma svar; läs den
i stället för att härleda den ur syskonfältet.

## Familjen: 26 publicerade, 9 utkast kvar

| segment | publicerat | pris |
|---|--:|---|
| smala rullvagnar | 5 | 349–689 |
| serverings- och barvagnar (runda 118) | 8 | 749–1 239 |
| köksvagnar (runda 117 m.fl.) | 11 | 1 299–2 099 |
| köksöar | 2 | 2 069 och 2 919 |

Utkasten ligger på **1 379–3 679 kr**, alltså mitt i och ovanför det
publicerade. Två frågor måste därför besvaras innan något skrivs: är någon av
dem en dubblett, och krockar något sökord?

## Måttgrinden — mot HELA familjen, inte mot batchen

| id | pris | yttermått cm | vikt | maxlast | material |
|---|--:|---|--:|--:|---|
| `ad390a36` | 1 379 | 53 × 37 × 89 | 16,5 | 30 kg | spånskiva, stål |
| `dac7a904` | 1 459 | 108,8 × 51 × 92,5 | 26 | 50 kg | MDF, spån, furu |
| `c86ff1a6` | 1 459 | 83 × 40 × 83 | 29,7 | 37 kg | spån, gummiträ, stål |
| `5d1696db` | 1 499 | 84 × 36 × 85 | 19,6 | 50 kg | bambu |
| `6cf7cfcf` | 1 569 | 67 × 37 × 87 | 20 | 40 kg | MDF, furu |
| `36526a8d` | 2 039 | 86 × 50 × 86,5 | 16,8 | 15 kg skiva | metall, rostfritt |
| `9e5e788c` | 2 629 | 115 × 70 × 89 | 48,7 | 105 kg | MDF |
| `d8bbbdde` | 2 639 | 120 × 68 × 85 | 41,6 | 100 kg | spånskiva |
| `e0fed2c9` | 3 679 | 129 × 65 × 91 | 57,8 | 112 kg | MDF |

### ✅ `6cf7cfcf` är INTE en dubblett av publicerade `cc1eb1d9` — mätt, inte tyckt

Runda 117 lyfte ur den ur batchen med motiveringen att den delar fotavtryck med
en publicerad sida och ligger trettio kronor ifrån den. Nu är båda mätta rad
för rad, och **fem oberoende innermått skiljer**:

| | utkast `6cf7cfcf` | live `cc1eb1d9` |
|---|---|---|
| pris | 1 569 | 1 599 |
| yttermått | 67 × 37 × **87** | 67 × 37 × **85,5** |
| låda invändigt | 26 × 28,7 × **18,4** | 26 × 28,5 × **20,5** |
| bricka | **30 × 28,5 × 4,5** | 28,5 × 33,5 × 7 utv. |
| öppen hylla | **30 × 29,5** | 32 × 34 × 18,3 |
| hyll-/lådlast | **5 kg** | **3 kg** |
| skivans material | **furu** | **gummiträ** |

Bredd och djup är samma — 67 × 37 är ett vanligt fotavtryck i den här
möbelklassen. Allt annat skiljer, och bilden bekräftar: lådorna sitter till
HÖGER på utkastet och till VÄNSTER på den publicerade, och fronterna är olika
djupa. Två artiklar, inte en.

☠️ **Det som återstår är inte en dubblett utan en SÖKORDSKROCK.** Två sidor som
båda heter "köksvagn med lådor och avtagbar bricka" kannibaliserar varandra.
Utkastet döps därför efter det som faktiskt skiljer — **furuskivan och
spjälhyllorna** — och de två korshänvisar till varandra så paret läser som ett
sortiment i stället för som en dubblett. Samma behandling som runda 118 gav
`764a3efc` mot de två publicerade rullvagnarna.

### ✅ De tre köksöarna är olika möbler, och olika mot båda publicerade

| | fotavtryck | skiva ned → upp | förvaring | hjul |
|---|---|---|---|--:|
| `9e5e788c` | 115 × 70 | 96 × 40 → 96 × 70 | 2 lådor, 2 skåp, 2 öppna fack, 3 kryddplan | 5 |
| `d8bbbdde` | 120 × 68 | 90 × 39 → +90 × 29 | 1 låda, 1 stort skåp, sidohyllor | 4 |
| `e0fed2c9` | 129 × 65 | 120 × 40 → 120 × 65 | 2 lådor, 4 dörrfack, utdragsbrickor | 5 |
| `07a6b8bf` *(live)* | 129 × 46 ned | 120 × 46 → 120 × 72 | 3 skåp, 2 lådor, kryddhyllor | — |
| `3bb5837e` *(live)* | 130 × 44,7 ned | 113 × 44,7 → 113 × 72,2 | glasdörrar, vinställ, 1 låda | — |

☠️ **`e0fed2c9` och `07a6b8bf` delar längden 129 cm och ligger en halv
centimeter isär i höjd** — det är precis den träff måttgrinden finns för. Men
skivan skiljer (120 × 65 mot 120 × 72 uppfälld), förvaringen skiljer helt
(dörrfack och utdragsbrickor mot tre skåp), och bild 1 visar två olika
möbler. Ingen dubblett; 129 cm är bara den bredd en köksö brukar ha.

## Bildgenomgången (Steg 4)

Granskade positionerna 3, 4 och 5 på alla nio — position 1 och 2 är enligt
husets mätning rena i 30/30 fall och hoppas över.

| id | tysk text i pixlarna | behålls |
|---|---|---|
| `ad390a36` | — | 1, 2, 3, 4, 5 |
| `dac7a904` | **4** *(ROBUST UND LANGLEBIG)*, **5** *(VIELSEITIG FÜR JEDEN RAUM)* | 1, 2, 3 |
| `c86ff1a6` | **4** *(EIN HERVORRAGENDER LAGERUNGSHELFER)* | 1, 2, 3, 5 |
| `5d1696db` | **4** *(BAMBUSKONSTRUKTION)*, **5** *(LEICHT ZU ROLLEN…)* | 1, 2, 3 |
| `6cf7cfcf` | — | 1, 2, 3, 4, 5 |
| `36526a8d` | — | 1, 2, 3, 4, 5 |
| `9e5e788c` | **4** *(Flüssigkeit verschüttet?)* | 1, 2, 3, 5 |
| `d8bbbdde` | **4** *(Getränk Verschüttet?)* + **5 är i praktiken TOM** | 1, 2, 3 |
| `e0fed2c9` | **4** *(Flüssigkeit verschüttet?)*, **5** *(Gutes Holz…)* | 1, 2, 3 |

**Tolv av 27 granskade bilder bar tysk text** (44 %) — nära husets uppmätta
46 % över hela feeden, alltså inget avvikande i just den här familjen.

⚠️ **`d8bbbdde` bild 5 fälls inte på SPRÅK utan på INNEHÅLL.** Den är en
urblekt vit yta med två hjul längst ned i kanten — ingen text alls, och därför
osynlig för varje grind som letar efter tyska ord. Ögat är det enda som ser
den. Samma klass som uppgift #401: rätt bild, fel fråga.

✅ **Logotypkollen: noll av arton hörn bär ett husmärke.** Övre vänstra 45 × 17 %
ur bild 1 och 2 på alla nio, granskade som remsa.

## Steg 5 — leverantörens påståenden mot bilderna och mot varandra

☠️ **Tre produkter har två olika yttermått i sin egen data.** Den svenska
spec-raden importen skrev säger något annat än `Technische Daten`, och
måttritningen (bild 3) avgör i alla tre — den är tillverkarens egen.

| id | `Technische Daten` + ritningen | svenska raden |
|---|---|---|
| `6cf7cfcf` | **87 cm hög** | 84 cm |
| `36526a8d` | **86,5 cm hög** | 84,5 cm |
| `5d1696db` | **84 bred × 36 djup** | 36 × 84 — axlarna omkastade |

⚠️ **`c86ff1a6` är inte massivt trä.** `Kautschukholz` gäller SKIVAN;
stommen är spånskiva. Den svenska raden säger bara `Holzwerkstoff`. Texten får
säga gummiträ om skivan och ingenting annat.

⚠️ **`5d1696db`s glasyta är inte angiven som härdad.** Leverantören skriver
`Arbeitsplatte aus Glas` utan mer. Skriv "glasyta", aldrig "härdat glas".

⚠️ **`36526a8d` har batchens HÖGSTA pris och LÄGSTA last** — 2 039 kr och
15 kg på skivan. Det är ingen motsägelse (den är byggd för att stå ute, inte
för att bära en degblandare), men talet ska stå tydligt så ingen kund köper
den som arbetsbänk.

⚠️ **`ad390a36`s bilder 4 och 5 visar den som sminkbord och i en garderob.**
Leverantören säljer den som `Küchen- und Servierwagen`. Bilderna är rena och
positioneringen är sann — vagnen är 53 cm bred och passar var som helst — men
texten ska utgå från köket och nämna de andra rummen som en möjlighet.

## Steg 4 — prisgrinden, alla nio

Kördes via workflowen **Polering — läs och stämpla mappningsraden**, läge
`las` (runs 2382–2390, alla `success`). Priset är Leonards beslut och rörs
inte; grinden svarar bara på om det som redan står stämmer mot regeln.

| id | pris | grinden | saldo | senast synkad | fraktandel |
|---|--:|---|--:|---|--:|
| `ad390a36` | 1 379 | ✅ `stammer: true` | 197 | 2026-09-01 | 0,335 |
| `dac7a904` | 1 459 | ✅ | 197 | 2026-08-31 | 0,396 |
| `c86ff1a6` | 1 459 | ✅ | 23 | 2026-09-04 | 0,397 |
| `5d1696db` | 1 499 | ✅ | 12 | 2026-09-08 | 0,332 |
| `6cf7cfcf` | 1 569 | ✅ | 27 | 2026-09-09 | 0,334 |
| `36526a8d` | 2 039 | ✅ | 35 | 2026-09-10 | 0,256 |
| `9e5e788c` | 2 629 | ✅ | 85 | 2026-09-09 | 0,397 |
| `d8bbbdde` | 2 639 | ✅ | 40 | 2026-08-31 | 0,396 |
| `e0fed2c9` | 3 679 | ✅ | 85 | 2026-09-10 | 0,376 |

**9 av 9 `stammer: true`** mot `×1,20` + `charm99`. Alla nio har saldo hos
leverantören och `hasEuWarehouse: true`, och **ingen fraktandel når 0,5** —
till skillnad från runda 118, där `ca20d60e` fick hållas tillbaka på
`saldo: 0`. Hela batchen är alltså publicerbar.

⚠️ Två rader synkades senast **2026-08-31**, alltså tio dygn sedan. Enligt
husets regel är en försvunnen feedrad ett LAGERBESKED och inte en utgången
produkt — men saldot 197 respektive 40 är från den dagen, inte från idag.
Talet används aldrig i kundtexten; det står här som underlag för beslutet att
publicera.
