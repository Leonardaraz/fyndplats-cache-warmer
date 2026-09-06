# Runda E2 — sex Polstersessel

⏸ **FÖRBEREDD, INTE PUBLICERAD.** Texterna är skrivna och filgrindade, men
ingenting är skrivet till Wix. Skälet står under "Varför inget är skrivet".

Med den här rundan är `^Polstersessel` slut: 8 i E1 + 6 här = 14.

| id | slug | pris | vad det är |
|---|---|---:|---|
| `1877cf83` | cordfatolj-fotpall-180-kg-beige | 2 889 kr | cord, fotpall, 180 kg, sitthöjd 52 |
| `5d150926` | snurrfatolj-svart-stalfot | 2 159 kr | **fjärde färgen** i publicerad familj |
| `6d327e6b` | loungefatolj-teddyfleece-77-cm | 1 899 kr | 77 × 77 cm, teddyfleece |
| `99b812a6` | fatolj-skandinavisk-stil-gummitra-cremevit | 1 629 kr | **färgsyskon** till publicerad sida |
| `87f2551f` | loungefatolj-gummitra-65-cm-cremevit | 1 499 kr | 65 × 80 cm, S-fjädrar |
| `c3e9b292` | fatolj-furuben-linnelook-cremevit | 1 239 kr | låg, 72 cm, furuben |

## ☠️ Varför inget är skrivet till Wix

Prisgrinden går genom GitHub-workflowen `polish-mapping.yml`, och
GitHub-servern kopplade ner mitt i passet. Kostnaden (`landedCostSek`) finns
bara i Postgres och nås bara via `/api/admin/mapping` med `CRON_SECRET` —
alltså bara genom workflowen.

Samma läge som runda D3 hamnade i, och samma beslut: **en grind man inte kan
köra är en grind som inte har godkänt.** Uppgift #107 säger dessutom att tre
Aosom-utkast har fel pris och inte får poleras; vilka tre står inte skrivet,
så att skriva text till en av dem vore att gå emot en stående instruktion på
en gissning.

**Kvar när GitHub är uppe:** prisgrind ×6 → skriv texterna → checksumma →
ta bort den tyska bilden på `1877cf83` → alt-texter → SKU + publicera →
stämpla → live-grinda.

## ☠️ Två av sex är färgsyskon till sidor vi redan säljer

Hittade på MÅTT. Ingen namnjämförelse hade sett något av dem.

**`5d150926`** heter *"Polstersessel, Akzentsessel mit Hocker, drehbar,
ergonomisch"* och är fjärde färgen av vår publicerade snurrfåtölj på stålfot.
Varenda tal är identiskt — golvyta 71 × 69, höjd 104, tillbakalutad 93 × 97,
sits 47 × 47 på 45, rygg 48 × 64, armstöd 30 × 12 × 15, fotpall 42 × 43 och
35–40 cm, fot Ø55, 150 och 50 kg — **inklusive vikt 22 kg och paketmått
77 × 56 × 39 cm**.

**`99b812a6`** är färgsyskon till `fatolj-skandinavisk-stil-gummitra`. Även
här stämmer varje tal, paketmåttet 69 × 34 × 61 inräknat.

**Båda är äkta nya färger, inte dubbletter — mätt på pixlar, inte på
etiketter.** `99b812a6` mäter (216,213,204) mot den publicerades (171,166,168)
över tre beskärningar: 45–65 ljusare per kanal och varmare i tonen.
`5d150926` skildes bara med 2 per kanal i en av tre beskärningar, så den
avgjordes med ögon i stället: en bild bredvid de tre publicerade visar samma
stol i fyra tyger, och utkastets är märkbart mörkare och slätare än den
publicerade mörkgrå.

☠️ **Följden för namngivningen:** båda ska slugga in i sin befintliga familj
(`snurrfatolj-…-stalfot`, `fatolj-skandinavisk-stil-gummitra-…`), inte få
ett påhittat eget namn. En femte snurrfåtölj som heter något annat är en
sida kunden inte hittar från de andra fyra.

## ☠️ Tre falska superlativ — som grinden inte kunde se

Första utkastet innehöll tre påståenden om sortimentet:

| jag skrev | verkligheten |
|---|---|
| *"180 kg — den högsta bärigheten bland våra fåtöljer med fotpall"* | omätt; ett dussin publicerade fåtöljer med fotpall är inte kontrollerade |
| *"13 kg — den lättaste fåtöljen med träram vi säljer"* | **fel** — `sammetsfatolj-senapsgul` väger 9 kg, `cocktailfatolj` 10 kg |
| *"10,8 kg — den lättaste i vårt sortiment av fåtöljer med träram"* | **fel**, samma två motexempel |

Alla tre är borta. Två av dem var motbevisade av tal jag hade framme i samma
arbetspass — jag hade läst `sammetsfatolj-senapsgul`s 9 kg en halvtimme
tidigare, i dubblettkollen.

☠️ **Filgrinden kan inte fånga det här.** Varje SIFFRA fanns i källan; det
var påståendet OM SORTIMENTET som var obelagt. Samma klass som D1:s *"den
längsta liggytan bland våra bäddfåtöljer"*. **Regeln: ett superlativ är ett
påstående om alla andra sidor, och det måste mätas mot alla andra sidor —
annars skriv det mätta talet i stället.**

## ☠️ Steg 2 — tre fynd

### 1. Två motstridiga liggmått (`1877cf83`)

Specen ger både `Maximale Liegefläche: 68 × 117 × 56` och
`Liegegröße (Max.): 68 × 108 × 75`. 117 och 108 kan inte båda vara samma
mått, och varken det ena eller det andra går ihop med stolens djup 91,5 plus
fotpallens 48 (= 139,5). **Inget av dem skrivs.**

### 2. Ritningen och specen är oense om en dyna (`c3e9b292`)

Måttritningen skriver 13 cm, specraden 12 cm. Skillnaden går inte att
härleda ur övriga mått. **12 cm skrivs** — det är siffran som står i text,
och att överdriva en dynas tjocklek är fel riktning att fela åt.

### 3. Materiallistan säger metall, bilderna visar trä (`6d327e6b`)

Benen ser ut som trä på varje foto. Materiallistan säger `Metall`, och
källtexten skriver `Beine in Holzoptik` — träoptik. Texten säger därför
*"metall med träfärgad yta"*. En kund som tror sig köpa träben ska inte
behöva upptäcka det vid uppackningen.

## ☠️ En tysk grafik till — tredje rundan i rad

`1877cf83` bild 4 är en monteringsgrafik med tysk text inbränd:
*"Öffnen Sie den Reißverschluss unter dem Sitz, um an die Montageteile zu
gelangen"*. Ska tas bort vid publiceringen; produkten får fyra bilder.

Sammanlagt tre rundor, tre grafiker, alla på **position 4** — samma position
varje gång. `RENA_BILDPOSITIONER = [1,2,3,8,9]` tar redan bort 4–7 ur
importen, så de här har kommit in på annat sätt eller före regeln. Värt en
mätning: hur många publicerade sidor bär en grafik på plats 4?

## Måttritningarna bekräftade allt

Bild 3 är en måttritning på alla sex och stämde överallt. Den avgjorde
dessutom en tolkningsfråga på `1877cf83`, där specens bokstäver är
inkonsekventa (`68L x 91,5B` mot `68B x 117T`): ritningen visar 68 cm som
BREDD och 91,5 cm som DJUP, och 52 + 36 = 88 bekräftar att 52 är sitthöjden.

## Grindarna

| grind | utfall |
|---|---|
| Prisgrind | ⏸ **går inte att köra — GitHub nere** |
| Filgrind (mönster + tal) | **0 fynd i 6 filer** |
| Mutationstest av grinden | 4 injicerade fel → 5 fynd, 0 falska |
| Superlativgranskning (ögon, inte grind) | 3 fynd → alla borttagna |
| Bildgranskning | 1 tysk grafik hittad, 29 bilder rena |
| Checksumma, alt-texter, live-grind | ⏸ väntar på publicering |

## ⚠️ Fyra nästan identiska cremevita trästolar

`99b812a6` (1 629), `87f2551f` (1 499) och `c3e9b292` (1 239) är alla
cremevita på ljus träram, och den publicerade
`fatolj-skandinavisk-stil-gummitra` (1 699, ljusgrå) är samma modell som
`99b812a6`. Måtten skiljer dem — 68 × 74 × 82, 65 × 80 × 83 och 64 × 70 × 72
— men på ett produktkort ser de nästan likadana ut.

Samma fråga som #122 om öronlappsfåtöljerna. Texterna gör skillnaden tydlig
genom att jämföra dem mot varandra på måtten, men om de ska ligga i samma
kategori är Leonards beslut.
