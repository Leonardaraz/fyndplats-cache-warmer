# Runda 89 — Steg 1: fyra sparkcykelmodeller mätta mot tre publicerade sidor

Runda 88 tog åtta av familjens 24 utkast och lämnade sexton. Planen var att
polera de åtta "utan publicerat syskon" (A2, D, F, G). **Mätningen visar att
den indelningen var fel på två punkter**, och det ändrar rundan.

## Katalogsvepet: 39 träffar, `avhuggen: false`

Hela katalogen svept i två halvor (56 sidor à 100), filtrerad på
`roller|scooter|tretroller|kickboard|sparkcykel` i namn ELLER slug. Alla
åtta planerade utkast är kvar som `visible: false` — den andra sessionen
har inte rört dem.

Svepet hittade också sex utkast som runda 88:s familjeräkning inte tog med,
eftersom de inte heter `Kinderroller`:

| id8 | vad |
|---|---|
| `7d4cfd1b` | **E-Scooter, Elektro-Tretroller, 6 km Reichweite** — eldriven, annan produktklass |
| `19fc1a9e` | **Pro Stunt-Scooter** för freestyle |
| `ab68ed78` | **Cityroller Aluminium**, hopfällbar, 200 mm — vuxenmodell |
| `eb4418ad` | Roller Kinder Scooter, **hopfällbar**, justerbara grepp |
| `68f8f1a7` | Tretroller 12 Zoll med handbroms och ställ |
| `28d7dfd9` `50b28808` | Kinderscooter Leichtbau, ljusblå + svart |

De är inte rundans, men de hör till samma sökordsgranne och ska räknas när
familjen sägs vara "slut".

## Mätningen, rad för rad

| | mått L×B×H | hjul | broms | maxlast | styre | fotplatta |
|---|---|---|---|---|---|---|
| **A2** utkast · svart 1 379 · rosa 1 439 | **143** × 58 × 92–100 | 16" fram OCH bak, luft | V-broms fram + bak | 100 kg | 92–100 | 36 × 12, 11 cm |
| **F** utkast · orange 1 179 · blå 1 229 | **135** × 58 × 88–94 | **Ø41 fram, Ø30 bak** | dubbelt, fram + bak | 100 kg | 88–94 | — |
| **G** utkast · grön 1 199 · vit 1 269 | **139** × 58 × 90–96 | Ø40 båda | dubbelt, fram + bak | 100 kg | 90–96 | — |
| **D** utkast · svart 1 129 · blå 1 249 | 120 × **58** × 75–80 | Ø12" | dubbelt | 100 kg | 75–80 | — |
| `4080448d` **PUBLICERAD** rosa 1 469 | 135 × 58 × 92–100 | 16 fram, 12 bak, luft | hand fram + bak | 100 kg | 92–100 | 36 × 12, 11 cm |
| `bd3bdc1b` **PUBLICERAD** blå 1 079 | **139** × 58 × 90–96 | 16" (Ø40), luft | fram + bak | 100 kg | 90–96 | — |
| `a06e46b7` **PUBLICERAD** blå 1 229 | 120 × **52** × 80–88 | 12" | **hand bak** | **50 kg** | 80–88 | 32 × 11 |

## ☠️ G är samma modell som en PUBLICERAD sida — på varenda axel

`bd3bdc1b` och G delar **139 × 58 × 90–96 cm, Ø40 cm luftdäck, broms fram
och bak, 100 kg, från 5 år**. Det är inte en liknande produkt, det är
samma. `bd3bdc1b` är den blå; G:s två utkast är **grön** (`aef9a8d9`) och
**vit** (`5129f6b0`).

**G hålls därför tillbaka** och poleras MOT den publicerade sidans text,
som runda 69 och 74 gjorde — inte som en fristående familj.

☠️ **Och den publicerade sidan säljer redan en färg den inte kan skicka.**
`bd3bdc1b`:s spec-rad säger ordagrant **"Färg: blå eller grön"**. Sidan har
EN variant med ETT artikelnummer. Den gröna är `aef9a8d9`, ett eget utkast
med ett eget artikelnummer. Kunden som väljer grönt på den blå sidan får
den blå. Det måste rättas innan eller samtidigt som den gröna publiceras.

## ⚠️ F är INTE `4080448d`, trots att båda har 16 tum fram och 12 bak

Det ser ut som samma produkt tills man lägger måtten bredvid varandra:

| | F (utkast) | `4080448d` (publicerad) |
|---|---|---|
| längd | 135 cm | 135 cm |
| **styrhöjd** | **88–94 cm** | **92–100 cm** |
| hjul | Ø41 / Ø30 cm | 16 tum / 12 tum |
| fotplatta | anges inte | 36 × 12 cm |

Sex centimeter i styrhöjd är precis den sortens skillnad som runda 88 lärde
sig att INTE lita på — men här finns ett andra vittne: F:s tyska brödtext
säger **"Gummiräder im Fußballdesign"**. Fotbollsmönstrade hjul är en
synlig egenskap som `4080448d` varken har eller påstår. Bilderna avgör i
Steg 4; håller mönstret är F en egen modell.

`4080448d` är med största sannolikhet modell **H** (`ea013fde`,
"Kinderroller 16/12 Zoll"), som runda 88 redan höll tillbaka.

## ✅ D är trygg — och det är MÅTTEN som visar det

D och `a06e46b7` är båda 120 cm långa med 12-tumshjul, och där slutar
likheten:

- bredd **58** mot **52 cm**
- styre **75–80** mot **80–88 cm**
- maxlast **100** mot **50 kg**
- **dubbelt bromssystem** mot **handbroms bara på bakhjulet**

Dubbel maxlast och en broms till är inte en variantskillnad. Olika produkter.

## ☠️ Men samma mätning avslöjar en dubblett runda 88 SKAPADE

`a06e46b7` är 120 × 52 × 80–88 cm, 12 tum, 50 kg, handbroms på bakhjulet,
ståyta 32 × 11 cm, material stål/plast/EVA. **Det är runda 88:s modell A,
axel för axel** — samma modell som `b1dcd424`, `41269686` och `82b5a517`,
publicerade i går för 1 039, 1 059 och 1 099 kr.

`a06e46b7` är **blå** och kostar **1 229 kr**. `b1dcd424` är **blå** och
kostar **1 039 kr**. Samma produkt, samma färg, två sidor, 190 kr isär.

Runda 88:s Steg 1 gissade att `a06e46b7` var modell C, på dess svenska
beskrivning ("stora 12-tumshjul, broms och justerbart styre, blå"). Sju
mätta axlar säger A. **Lärdomen: en publicerad sidas SVENSKA text duger
inte som modellidentitet — spec-tabellen gör det.**

☠️ **Och mappningsraden förklarar VARFÖR spärren inte fångade den.**
`a06e46b7` bär `supplierProductId: "1005008315863862"` — ett
AliExpress-listnings-id — och `shipsFromCountries: ["ES"]`. Den är alltså
inköpt via AliExpress, inte ur Aosom-feeden. Dubblettspärren nycklar på
`supplierProductId`, så en Aosom-artikel och samma vara köpt via AE ser för
den ut som två helt olika produkter.

Det är exakt den dubblett `CLAUDE.md` beskriver som **den farliga**: ~586
produkter vi redan säljer är Aosom-varor inköpta via AE, och de "fångas i
poleringen, inte av spärren". Runda 88:s polering fångade den inte, för den
jämförde svenska beskrivningar i stället för spec-tabeller.

⚠️ Vad som ska göras med paret är **Leonards beslut**, inte rundans:
husets regel (2026-09-03) säger att sidan vi behåller mappas om till Aosoms
artikelnummer och den andra pensioneras. Det rör en publicerad sida och en
prisskillnad på 190 kr. Mätningen står här; åtgärden väntar.

## ☠️ Och en ogrundad certifiering på samma publicerade sida

`a06e46b7` bär `Certifieringar: EN71-1-2-3` i spec-tabellen och
*"Den är CE/EN71-testad för barnsäkerhet"* i en vanlig fråga. Runda 88:s
Steg 2-grind slog fast att källan inte anger någon standard för den här
familjen, och `STANDARD_RE` finns i linten just för att hindra påståendet.
Sidan publicerades före den grinden.

## Rundans sex

Kvar som ren, fristående familj: **A2, D och F — sex produkter.**

| modell | id8 | färg | pris |
|---|---|---|--:|
| **D** | `479e9c2e` | svart | 1 129 |
| **F** | `4fd26086` | orange | 1 179 |
| **G** *(hålls tillbaka)* | — | — | — |
| **F** | `89deaca7` | blå | 1 229 |
| **D** | `d9239c8e` | blå | 1 249 |
| **A2** | `c4375606` | svart | 1 379 |
| **A2** | `79186373` | rosa | 1 439 |

Sex produkter, tre modeller, två färger var.
