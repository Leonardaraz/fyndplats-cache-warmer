# ⚠️ Sortimentet är fullt av samma stol — mätt 2026-09-06

Ett måttsvep över **173 publicerade fåtöljsidor** plus de kvarvarande
utkasten. Slutsatsen ändrar vad "polera vidare" betyder.

## ☠️ Två publicerade sidor är samma stol — 48 % isär i pris

| sida | pris | mått |
|---|---:|---|
| `fatolj-fotstod-5-lagen-bjork` | **1 729 kr** | 66,5 × 94 × 100 cm, sits 55,5 × 51,5 × 40, ryggstöd 75 × 55 × 71, fotstöd 55,5 × 33 i fem lägen, stomme 60 × 22 mm, maxlast 120 kg, björk |
| `vilstol-bjork-femstegs-fotstod` | **1 169 kr** | identiskt på varje tal |

Båda ligger ute. **560 kronor, 48 %, för samma möbel.** Den dyrare säger
dessutom *"Färg: svart eller grå"* och täcker alltså båda kulörerna, medan
den billigare är den svarta.

Det här är precis den interna dubblett runbooken varnar för — *"Två egna
URL:er med samma foton är den dubblett Google faktiskt straffar"* — men
värre, eftersom priserna skiljer så mycket att en kund som hittar båda känner
sig lurad av den ena.

☠️ Och det höll på att bli fyra sidor: runda E3:s A3-par (`84082d41` brun,
`7e00970f` grå) är samma stol igen. **De är stoppade.**

## ☠️ Golvfåtöljen är SJU publicerade sidor — och två utkast till på väg

Sju publicerade sidor delar måtten 62 × 70 × 95 cm och vikten 11 kg:

`golvfatolj-360-grader-fem-lagen` · `golvfatolj-beige-fem-lagen` ·
`golvfatolj-gra-fem-lagen` · `golvfatolj-petrolbla-fem-lagen` ·
`golvfatolj-vridfot-beige` · `golvfatolj-vridfot-gron` ·
`golvfatolj-vridfot-morkgra`

⚠️ **Namngivningen är dessutom inkonsekvent inom familjen** — fyra heter
`…-fem-lagen` och tre `…-vridfot-…`, för samma stol. Det gör dem svåra att
hitta från varandra.

Utkastet `40304dee` (1 199 kr) har samma 62 × 70 × 95, samma sitthöjd 37,
samma 15 cm sits, samma 120° och samma 11 kg — och färgen anges `Dunkelgrau`,
vilket `golvfatolj-vridfot-morkgra` redan säljer. **Det ser ut som en ren
dubblett, inte en ny färg.** Utkastet `339a695e` (979 kr) matchar
`golvfatolj-fallbar-13-lagen` (899 kr) på varje tal — där skiljer färgen
(blå publicerad, mörkgrå utkast), så det är ett äkta syskon, men det blir
sida nummer nio i kategorin.

## Mönstret, fyra rundor i rad

| runda | produkter | varav färgsyskon till redan publicerad sida |
|---|---:|---:|
| D3 | 7 | 2 av 7 |
| E1 | 8 | 0 av 8 |
| E2 | 6 | **2 av 6** |
| E3 | 10 | **8 av 10** |
| `^Sessel` (nästa) | 14 | minst 5, troligen fler |

Det är inte slumpen. Aosoms feed säljer varje modell i alla sina kulörer, och
importen skapar ett utkast per kulör. Ju längre poleringen kommer, desto
större andel av det som återstår är färger av något vi redan har.

## ⚠️ Vad det betyder för arbetet

Fram till nu har varje runda behandlat färgsyskon som "publicera, men flagga
prisspannet". Det har gett tre öppna frågor till Leonard om samma sak:

- **#122** sex nästan identiska öronlappsfåtöljer
- **#131** 190 cm-bäddfåtöljen på fem sidor, 700 kr spann
- **#139** manchesterfåtöljen på sju sidor, 580 kr spann

Och nu en fjärde och femte: björkvilstolen på två sidor med 48 % spann, och
golvfåtöljen på sju.

**Frågan är inte längre om enskilda familjer ska publiceras.** Den är hur
färgsyskon ska presenteras överhuvudtaget:

1. **En sida per färg** — som idag. Maximal räckvidd i sök, men kunden ser
   sju likadana rutor och katalogen ser uppblåst ut.
2. **En sida med färgval** som Wix-variant. En URL, en produkt, kunden väljer
   kulör. Kräver att befintliga sidor slås ihop och att synken hanterar
   flera artikelnummer per produkt — inte gratis.
3. **Ett urval** — publicera de tre–fyra kulörer som säljer och lämna resten
   som utkast.

☠️ **Det som INTE går är att fortsätta som nu utan beslut.** Varje runda
lägger till fler sidor av samma möbel, och de två publicerade
björkvilstolarna visar vad det slutar i: samma stol, två priser, 48 % isär,
och ingen som märker det förrän någon mäter.

## Så här mättes det

Yttermått och vikt lästes ur `plainDescription` på alla publicerade sidor
vars slug innehåller `fatolj` (173 st) och jämfördes mot utkastens
tekniska data.

⚠️ **En fälla i mätningen, för den som gör om den:** ett reguljärt uttryck
som tar det FÖRSTA måttet i texten träffar fel på polerade sidor, eftersom
våra egna texter citerar syskonens mått i brödtexten före sin egen
spec-tabell. Fem rader i det första svepet var sådana artefakter. Läs
spec-tabellen, inte första träffen — och verifiera varje kandidat mot den
faktiska sidan innan den räknas som en dubblett.
