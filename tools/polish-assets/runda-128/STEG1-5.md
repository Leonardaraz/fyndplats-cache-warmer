# Runda 128 — Steg 1 till 5

Nio utkast ur Aosoms verktygs- och skåpfamilj: ett plåtskåp, ett högt
verktygsskåp, fem rullande verktygsvagnar (varav ett färgpar) och en
svetsvagn.

## Steg 1 — svepet och måttjämförelsen

Katalogsvepet gick i två etapper via `products/search` med markör:
**57 sidor, 5 649 rader, `avhuggen: false`.** Svepet hittade runda 127:s egna
åtta nypublicerade sidor, vilket är kvittot på att läsningen inte var tom.

☠️ **Etapp ett samlade bara KANDIDATERNA, inte konkurrenterna** — och det såg
ut som ett resultat. Första listan gav 16 publicerade träffar och saknade
varenda sida runda 123–125 publicerat, trots att deras sluggar alla bär
`verktyg` eller `verkstad`. Orsaken var inte filtret utan att den första
etappen aldrig kördes med konkurrentregeln. Med båda etapperna korrekt körda:
**44 publicerade träffar**, varav 23 är verktygsförvaring.

**Måttjämförelsen mot alla 23 publicerade:**

| kandidat | mått (B × D × H) | vikt | närmaste publicerade | dom |
|---|---|--:|---|---|
| `bc2e7191` | 71 × 39 × 70 | 12,7 | `12cb8a2c` 78 × 35 × 73, 17 kg | unik |
| `beeada22` | 75 × 33 × 110 | 24 | — | unik |
| `1654dd75` | 96 × 33,5 × 75 | 29,7 | — | unik |
| `f2495eee` | 65,5 × 34,5 × 76 | 25 | `50a64a95` 67,5 × 33 × 77, 26,1 | unik |
| `1db06f83` | 69 × 33 × 133 | 28 | `5910cd6f` 60,5 × 33,5 × 131, 27 | unik |
| `b920d526` | 61,5 × 33 × 113 | 41,7 | `1b534b0e` 61,5 × 33 × 82,5, 25,7 | unik |
| `d9965552` | 61,5 × 33 × 113 | 41,7 | samma | **färgsyskon till `b920d526`** |
| `fc6fdd63` | 76 × 33 × 75 | 41,1 | `b43f5ca0` 76 × 31 × 76, 15 kg | unik |
| `81c123fa` | 75 × 40 × 180 | 36,2 | — | unik |

**Noll dubbletter.** Två observationer som ser ut som träffar men inte är det:

⚠️ **Samma KABINETT delas av tre modeller.** `1db06f83`s skåpdel utan hjul är
`61,6 × 33 × 66`, och det är exakt `f2495eee`s `Schrankabmessungen` — och de
publicerade `1b534b0e`/`5447468e` står på samma `61,5 × 33` fotavtryck.
Leverantören bygger tre produkter på en stomme. Uppgift #407 igen: ett delat
kabinett ger måttträffar som INTE är dubbletter.

⚠️ **`b920d526` är inte den publicerade 82,5-skåpet med en kista på.** Den
lägre delen är `61,5 × 33 × 76`, inte 82,5, och lådindelningen är en annan.
Den konkurrerar däremot direkt med de publicerade 82,5-skåpen och måste
korslänkas.

## ☠️ Lagret lyfte två skåp ur rundan

Läst ur BUTIKEN (`inventory-items/search`), inte ur mappningen:

| id | lager |
|---|--:|
| `81c123fa` | 135 |
| `1654dd75` | 197 |
| `f2495eee` | 130 |
| `b920d526` | 76 |
| `d9965552` | 42 |
| `1db06f83` | 41 |
| `bc2e7191` | 35 |
| `fc6fdd63` | 33 |
| `beeada22` | **3** |
| `6df0ce88` | ☠️ **0** |
| `5a0f9799` | ☠️ **0** |

De två sista lyftes ur batchen och parkerades (uppgift #482). ☠️ `5a0f9799`
är dessutom FÄRGSYSKON till `beeada22` — samma text ordagrant utom
`Farbe: Weiß` mot `Schwarz`, samma 75 × 33 × 110, samma 10/50 kg, samma 17
hyllägen. Den vita går inte att skicka; den svarta poleras nu och den vita
får sin sida när lagret kommer tillbaka.

## Steg 2 — laglighetsgrinden

Ingen av de nio har elektriska delar, så LVD/EMC är inte i bild. Tre saker
gäller ändå:

1. ☠️ **`81c123fa` är 180 cm hög och tar 210 kg — och källan nämner INTE
   väggförankring.** De två lägre skåpen (`beeada22`, `6df0ce88`) säger
   uttryckligen *"kann an der Wand befestigt werden"*; det höga säger
   ingenting. Sidan får alltså **inte** lova väggförankring, och måste i
   stället säga att tyngsta lasten hör hemma längst ned.
2. **Låsbara skåp är inte barnsäkra.** Inget av låsen är ett barnskydd, och
   inget påstående om det får skrivas.
3. **`bc2e7191` bär gasflaskor.** Kedjorna är dokumenterade och får beskrivas;
   allt utöver det — täthet, tryck, säkerhetsgodkännande — är påståenden
   källan inte backar upp.

Ingen spärr fäller någon produkt. Rundan går vidare med alla nio.

## Steg 3 — prisgrinden

Kördes via `polish-mapping.yml` läge `las`, Actions **2526–2534**, nio
`success`. Workflowen `exit 1`:ar på `stammer: false` och `EJ AVGORBAR`, så
grön körning ÄR grindens dom. **9 av 9.**

## Steg 4 — bilderna

| id | bort | orsak |
|---|--:|---|
| `bc2e7191` | — | rena |
| `beeada22` | — | rena |
| `fc6fdd63` | — | rena |
| `b920d526` | — | rena |
| `d9965552` | — | rena (tre bilder från start) |
| `81c123fa` | — | rena |
| `1654dd75` | **4** | *"ZENTRALVERRIEGELUNG — Einmal abschließen, um alle Schubladen während Ihrer Abwesenheit zu sichern"* |
| `f2495eee` | **4** | *"Autowerkstatt · Garage · Lagerhaus · Werkstätten"* |
| `1db06f83` | **4, 5** | *"Kugelgelagerte Schienen / EVA-Schutzeinlagen"* respektive *"Garage · Autowerkstatt · Lagerhalle · Werkstätten"* |

Fyra bilder bort på tre produkter. `1db06f83` tappar två och behåller tre.

⚠️ **`d9965552` har bara TRE bilder mot syskonets fem — och det är inte ett
importfel.** Den blå har en egen fotoserie i en annan studio; det är inte
samma bilder omfärgade. Att räkna det som en saknad import hade gett en
bildreparation som laddar om bilder som aldrig funnits.

## Steg 5 — leverantörens påståenden

### ☠️ 1. `1654dd75`s spec-block säger `Material: Kunststoff`

Tyskans `Technische Daten` säger `Stahl, EVA`, brödtexten säger
*"pulverbeschichtetem Stahl"*, och bilderna visar en plåtvagn. Spec-blocket
säger **plast**. Det är inte en nyansskillnad som i uppgift #472 — det är fel
materialklass rakt av, och den som bygger spec-tabellen ur den råa raden
säljer en stålvagn för 2 479 kr som plast.

### ☠️ 2. `f2495eee`s spec-block säger `Material: Edelstahl` om hela vagnen

`Technische Daten` säger `Stahl, Edelstahl` och brödtexten preciserar:
*"Eine Edelstahloberfläche"* — det är BÄNKSKIVAN som är rostfri, stommen är
pulverlackerat stål. Sidan skriver därför "stål med bänkskiva i rostfritt",
aldrig "rostfri vagn".

### ☠️ 3. `81c123fa` bär ett LEVERANSLÖFTE i källan (uppgift #478)

Ordagrant: *"WICHTIG: Wir liefern lhnen den Artikel kostenfrei bis
Bordsteinkante."* Det är leverantörens villkor mot en tysk kund, inte vårt mot
en svensk. Grinden `leveransloften` fäller det; ingen del av det når sidan.

### ☠️ 4. Två skåp säger att innerbredden är lika med ytterbredden

`81c123fa`: yttermått `75L x 40B`, `Innenmaße des oberen/unteren Schranks:
75B x 37,5T x 74H`. `6df0ce88` (parkerad): `80L x 40B`, `Innenmaße: 80L x 34B
x 81H`. Ett plåtskåp med väggar kan inte ha samma inner- som ytterbredd.
Samma klass som runda 127:s `66866eb7`. **Innerbredden skrivs inte ut** —
innerhöjden och innerdjupet är entydiga och räcker.

### ☠️ 5. `fc6fdd63`s lådantal GÅR IHOP — men bara om man läser ett stavfel

Källan: 14 lådor, varav fem i underskåpet. Lådmåtten för överkistan är
`15 × 22 × 3`, `50,5 × 22 × 3` och `50,5 × 22 × 7,5` — den första är en
tredjedel av kistans 60 cm bredd, alltså tre i bredd. Bilden bekräftar: två
rader om tre små överst, sedan helbreda lådor. 6 + 2 + 1 = 9 i kistan, 5 i
underskåpet = **14**. ✓

☠️ Samma sak på `b920d526`/`d9965552`, där källan skriver *"Oberen Kasten: 6
**keine** Schubladen"*. "keine" är ett stavfel för "kleine" — och det syns
bara för att summan går ihop: 6 + 2 + 1 + 2 + 5 = **16**, vilket är precis
vad brödtexten säger. Läst ordagrant hade det blivit "6 INGA lådor".

### ☠️ 6. `fc6fdd63`s spec-block anger bara UNDERSKÅPETS höjd

`Mått: 76L x 33B x 75H` är underskåpet. Överkistan är `60 × 26 × 34`, så hela
vagnen är **109 cm** hög. Sidan anger båda.

### 7. `b920d526`/`d9965552` bär två vikter

`Nettogewicht: 38 kg` mot spec-blockets `41,7 kg`. Samma klass som runda
127:s `9b8c7308`. **Sidan anger det högre talet** — den som ska bära den ensam
ska inte bli överraskad.

### 8. `bc2e7191`: svetsen på bilden ingår inte

`Lieferumfang` är vagn + anvisning. Bild 2 visar en svetsmaskin och en
gasflaska som inte följer med. Sidan säger det.

### 9. `1db06f83` är TRE delar som kan användas var för sig

Hålplatta, lådkista och skåp — bild 1 visar dem separerade. Lasttalen är
differentierade: 80 kg totalt, 5 kg per hålplattekrok, 20 kg arbetsyta,
8 kg per låda. Alla fyra skrivs ut.

## Vad som lämnas till Leonard

| | |
|---|---|
| Sortiment | `b920d526`/`d9965552` (61,5 × 33 × 113, tvådelade) konkurrerar direkt med de publicerade `verktygsskap-bla-82-cm` och `verktygsskap-svart-82-cm` på samma fotavtryck. Korslänkas, men om butiken ska ha fyra skåp på samma stomme är ett sortimentsbeslut. |
| #482 | `6df0ce88` och `5a0f9799` slutsålda — den vita är färgsyskon till rundans svarta. |
