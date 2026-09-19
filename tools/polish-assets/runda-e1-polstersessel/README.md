# Runda E1 — åtta Polstersessel

Första rundan i familj E. Alla åtta är publicerade och stämplade. Tre
färgfamiljer, inga enskilda produkter.

| id | slug | pris | vad det är |
|---|---|---:|---|
| `59544dc3` | gungfatolj-fotpall-linnelook-gra | 2 459 kr | gungfåtölj + fotpall |
| `d551aa1d` | gungfatolj-fotpall-linnelook-beige | 2 399 kr | samma, beige |
| `4abad4c4` | baddfatolj-190x80-cm-morkgra | 2 379 kr | bädd 190 × 80 cm |
| `38ca04a9` | baddfatolj-190x80-cm-bla | 2 379 kr | samma, blå |
| `543fd196` | snurrfatolj-60-cm-gul | 1 399 kr | 60 cm snurrfåtölj |
| `827314e4` | snurrfatolj-60-cm-svart | 1 399 kr | samma, svart |
| `ea30fc2a` | snurrfatolj-60-cm-morkgra | 1 349 kr | samma, mörkgrå |
| `bb0d9831` | snurrfatolj-60-cm-cremevit | 1 179 kr | samma, cremevit |

## Dubblettkollen — tre familjer, alla nya

Avgjord på MÅTT, samma metod som familj D. Alla tre kandidatgrupper hade en
publicerad sida som såg ut som en trolig dubblett, och alla tre föll på
måtten:

| utkastet | närmaste publicerade | vad som skiljer |
|---|---|---|
| **P1** 60 × 61 × 88 cm, snurrar | `snurrfatolj-gra-stalfot` 71 × 69 × 104 | golvyta, höjd, rygg 43 × 41 mot 48 × 64, 120 mot 150 kg, ingen fotpall |
| **P1** | `liten-fatolj-60-cm-chenille` 60 × 57 × 83 | lika bred, men 4 cm djupare och 5 cm högre hos oss — och den publicerade **snurrar inte** |
| **P2** sits 13 cm, rygg 11 cm, 120 kg | `gungfatolj-graddvit-med-fotpall` | sits 13 cm stämmer, men den publicerade bär **150 kg** i konstläder på **träram** |
| **P2** | `loungefatolj-ljusgra-med-fotpall` | 13 cm sits stämmer, men ryggen där är **26 cm** och stolen snurrar |
| **P3** bädd **190 × 80** | `baddfatolj-190-cm` (190 × **72**) och `baddfatolj-manchester-90-cm` (190 × **90**) | bäddbredden — 80 ligger mitt emellan |

P3 är alltså en tredje bäddbredd i samma längd, och det är den upplysningen
kunden faktiskt behöver. Den står först i texten.

## ☠️ Två bäddfåtöljer gömde sig under `Polstersessel`

`4abad4c4` och `38ca04a9` heter *"Polstersessel mit Bettfunktion, 3-in-1
Design, Schlafsessel"* och har bädd 190 × 80 × 28 cm. Varken `^Schlafsessel`
eller `^Klappsessel` — de två sökningar familj D byggdes på — hade hittat dem.

Det är exakt samma lärdom som de fyra Skandidesign-utkasten i D1, en gång
till: **leverantörens huvudord beskriver inte produkten.** Familj D är därför
klar som SCOPAD (24 namngivna utkast), inte som produktklass. Uppgift #133.

## ⚠️ FORDELNING.md:s histogram undermäter familjer som inte heter `…sessel`

Filen listar `^Bürostuhl` som 13 och `^Schaukelstuhl` som 13. Mätt i dag:
**100** respektive **36**.

Talen är inte fel — de är svar på en annan fråga. Histogrammet räknades över
de 356 utkast som innehåller delsträngen `Sessel`, så `Bürostuhl: 13` betyder
"tretton Bürostuhl-utkast som också nämner Sessel". För familjer vars
huvudord ÄR `Sessel` stämmer talen (`Polstersessel` 14, `Akzentsessel` 10,
`Fernsehsessel` 7 — alla verifierade). För alla andra undermäter de grovt.

Filens egen regel gäller alltså åt båda hållen: kör delsträngen för att
HITTA, huvudordet för att RÄKNA — och räkna om innan en runda planeras.

## ☠️ Steg 2: jag skrev ett påstående källan inte bär

Första utkastet av P2-texten sa: *"Ryggen står i ett fast läge och går inte
att fälla bakåt."* Källan säger ingenting om ryggen alls — bara
`sanfte Schaukelbewegungen`. Jag hade dragit slutsatsen ur att specen TIGER.

**Kontaktarket visade motsatsen.** Bild 4 på båda produkterna visar stolen
tydligt tillbakalutad, och bild 1 visar en pelarbas i metall. Ett negativt
påstående om en funktion är minst lika farligt som ett positivt: en kund som
väljer bort stolen för att den "inte går att fälla" har fått fel besked.

Texten säger nu bara det källan säger — att den gungar mjukt — och jämför med
gungfåtöljen i konstläder utan att påstå något om den här stolens ryggläge.

**Regeln: en spec som tiger är inte en spec som säger nej.** Och: bilderna är
en del av grinden, inte dekoration.

## ☠️ En tysk grafik till, på position 4

`543fd196` bild 4 var en grafik med **"STABILE STRUKTUR"**, `Stahlfüße` och
`Einstellbare Fußpads` inbränt i pixlarna. Borttagen — produkten har fyra
bilder i stället för fem. De tre färgsyskonen har rena bilder i samma position.

Andra rundan i rad som hittar en tysk grafik som `RENA_BILDPOSITIONER` släppt
igenom (D3 hittade en på `6a204d58`). Regeln är en mätning på 30 produkter,
inte en garanti.

## Måttritningarna bekräftade varje tal

Bild 3 är en måttritning på alla åtta, och den är ett oberoende facit mot
specen. Samtliga tal stämde: P1:s 41/47/45/18/47,5/88/61/60 cm och 120 kg,
P2:s 67/99/17/48/41/37/47/75/66 cm och 120 KG, P3:s 28/190/48/83/60/38/75/80
cm och 120 kg. Ingen rättelse behövdes.

⚠️ P2:s ritning avgjorde dessutom en tolkningsfråga: bulletpunkten kallar
ryggen `67 cm ergonomische hohe Rückenlehne`, men specraden säger `67L`, och
sitthöjd 41 + 67 = 108 medan stolen är 99 cm hög. De 67 centimetrarna är
ryggens LÄNGD längs lutningen. Texten skriver det så — *"67 cm hög rygg"*
hade varit ett tal som inte går ihop.

## Grindarna

| grind | utfall |
|---|---|
| Prisgrind (workflow, åtta körningar) | **stämmer på alla åtta** |
| Filgrind (mönster + tal) | 1 fynd → rättat → **0 fynd i 8 filer** |
| Mutationstest av grinden | 3 injicerade fel → 3 fynd, 0 falska |
| Checksumma fil mot Wix | **8/8 identiska** (positionsviktad) |
| Alt-texter | 39 st, 0 tomma |
| Live-grind (8 hämtade sidor) | **8/8 REN, 0 orddiffar** |

Filgrindens fynd var mitt eget: jag hade skrivit *"Fotpallen är 5 cm lägre än
sitsen"*. Femman finns inte i källan — den är 41 − 36, uträknad av mig. Samma
klass som D2:s påhittade "tjugo centimeter". Texten anger nu båda talen och
låter läsaren dra ifrån.

☠️ **Prisgrinden kördes FÖRST den här gången**, före en enda rad text. D3
skrevs klart innan grinden gick att köra och fick ligga och vänta ett helt
pass. Åtta gröna grindar innan skrivandet kostar åtta minuter; åtta texter
som inte får skrivas kostar ett pass.

## SKU:er — åtta produkter delade TRE strängar

Värre än D3, där fem av sju delade två.

| gammal SKU | delades av |
|---|---|
| `FP-polstersessel` | **fyra** produkter |
| `FP-polstersessel-mit-fu` | två |
| `FP-polstersessel-mit` | två |

Alla tre är avhuggna tyska titlar. Alla åtta har nu en egen svensk SKU på
båda sidorna, och priset är oförändrat på varenda en (verifierat före och
efter variantskrivningen — en `variantsInfo`-PATCH rör priset om man inte
ekar tillbaka varianten hel).
