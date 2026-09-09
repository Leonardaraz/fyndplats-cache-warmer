# Runda 109 — familjens två sista sexpanelsfärger, och en pensionerad AE-sida

Leonards beslut 2026-09-09 på uppgift #387: den publicerade `d4118d39` sålde
BÅDA färgerna på en sida för 1 529 kr medan Aosom har dem som två artiklar
(1 329 vit / 1 239 svart). Han valde **dela i två färgsidor**.

Det är hans ommappningsregel (2026-09-03) tillämpad på ett **1:2-fall**: en
AE-sida buntar två artiklar leverantören säljer var för sig, och
`lib/aosom/remap.ts` vägrar en flervariantssida (`flera_varianter`). Regeln
förutsätter 1:1; här var den inte tillämpbar, och delningen löser samma sak
utan att röra ett pris.

## Utfallet

| | |
|---|---|
| Nya sidor | `rumsavdelare-240-vit` 1 329 · `rumsavdelare-240-svart` 1 239 |
| Rättade live-sidor | sex, ny syskonlista och rättad träformulering |
| Live-grinden | **8 av 8 gröna** |
| Pensionerad | `d4118d39` → `visible:false`, `draftStatus: rejected` |
| Redirect | `hopfallbar-rumsavdelare` → `/produkt/rumsavdelare-240-svart` |

Sexpanelsraden är nu komplett i fyra färger — vit, svart, natur, brun — och
"vit eller svart" på en sida som bara kan skeppa den ena finns inte längre.

☠️ **Ordningen var inte valfri.** Ersättarna publicerades FÖRST, och
avpubliceringen läser tillbaka att båda är `visible:true` innan den skriver.
Annars hade butiken stått utan varan i fönstret mellan avpubliceringen och
redirecten. Redirecten skrevs sedan UTAN `force`, vilket är möjligt just för
att sidan då inte längre är synlig — `force` finns för att kapa en säljande
sida, och att behöva den hade varit ett tecken på fel ordning.

## Steg 3 + 6 — mappningsraden

| nyckel | artnr | pris | landedCost | prisgrind | lager | frakt ÷ inköp |
|---|---|--:|--:|:-:|--:|--:|
| `ffb5239f` | 830-814V01WT | 1 329 | 1 100,61 | ✅ | 21 | 0,396 |
| `7bd4f691` | 830-814V01BK | 1 239 | 1 031,52 | ✅ | 26 | 0,423 |

Artikelnumrens `V01` kodar sex paneler. `matt.kontroll()` prövar det mekaniskt
på alla åtta (V00=4, V01=6, V02=8) — familjeavläsningen är därmed testad, inte
läst.

## ☠️ Två rättelser av runda 108, båda hittade av den fjärde färgen

**1. Färguppräkningen i ett DELAT textblock.** Runda 108 skrev att tallen
"syns som ljusa streck … tydligast på de ljusa modellerna och som svaga
glimtar på de bruna". Mätt på närbilderna:

| färg | trä-% | trä L | väv L | kontrast |
|---|--:|--:|--:|--:|
| vit | 8,7 | 223 | 226 | 4 |
| natur | 97,9 | 179 | 125 | 54 |
| brun | 0,0 | 131 | 62 | 69 |
| **svart** | 2,0 | 159 | 37 | **123** |

På svart är träet TYDLIGAST av alla fyra; på natur har trä och väv samma ton
och läses inte som streck alls. Mätaren är dessutom oanvändbar på vit och
natur (den kan inte skilja varmt trä från varm väv) — den är bara avgörande
där den håller med ögat: brun ≈ osynligt, svart = högst kontrast.

**Regeln: ett delat textblock får inte räkna upp färger.** Meningen är
omskriven till det som gäller på alla fyra fotona, och sex live-sidor fick
rättelsen.

**2. Motiveringen till att "massiv tall" ströks var fel.** Runda 108 skrev att
leverantören anger `Kiefernholz`, inte `Massivholz`. De två utkasten här —
samma familj, samma textmall — skriver ordagrant *"Der Rahmen des Raumtrenners
aus **massivem** Kiefernholz"*. Ändringen står kvar (kortare och lika sann),
men LAGE.md:s andra halva är mätbart falsk: den publicerade `d4118d39` säger
"Ramen är av massiv tall" på **två** ställen.

☠️ Runda 108:s tyska källtext går inte att läsa om — sidorna är omskrivna och
den sparades aldrig lokalt. **Spara leverantörens råtext i `steg3.json`**, inte
bara mappningsraden; annars går en motivering inte att pröva i efterhand.

## Steg 4 — de två gallerierna är INTE lika

| plats | `ffb5239f` vit | `7bd4f691` svart |
|--:|---|---|
| 1 | studio | studio |
| 2 | miljö | miljö |
| 3 | måttritning | måttritning |
| 4 | **miljö** | närbild väv |
| 5 | **miljö** | närbild fot |

Vit har tre miljöbilder och ingen enda närbild. Strukturen (ritningen på plats
3) är däremot lika, så omflyttningen är densamma. Noll tysk text i pixlarna,
noll logotyper i övre vänstra hörnet, ritningarna bär bara siffror.

☠️ **Och familjens bildordförråd läckte in i en bild som inte visar det.**
Första alt-utkastet skrev "ett bord med en ljus pläd över kanten" om vit bild 5
— lånat från runda 108:s naturfärgade sida, där en rutig pläd FAKTISKT hänger
över skärmens kant. Här är tyget en BORDSDUK och skärmen orörd. Det syntes
först när bilden lästes i FULL STORLEK; i kontaktarkets miniatyr såg tyget ut
att ligga över kanten.

**Kontaktarket säger vilken TYP av bild det är, inte vad som finns i den.**

## Steg 8 — båda halvorna, från början

| halva | verktyg | utfall |
|---|---|---|
| mappningsraden | workflowen `stampla` | `FP-rumsavdelare-240-vit` / `-svart` |
| Wix variant-SKU | `variantsInfo`-PATCH | samma två strängar |

Båda bar `FP-6-teiliger-raumtrenner` före skrivningen — alltså en krock mellan
de två sidorna. Priset ekades tillbaka oförändrat (1 329 / 1 239), `visible`
bars på båda nivåerna, matchningen gick på `wixVariantId`.

## Steg 9 — oskärpan mätt per kort, inte ärvd

| radie | ffb5239f | 7bd4f691 |
|--:|--:|--:|
| 0 | 238 078 ✗ | 275 070 ✗ |
| 1 | **215 924 ✗** | 230 138 ✗ |
| 2 | 186 107 ✅ | 192 061 ✅ |

Vita missar taket med **924 byte** vid r=1. Det är hela skälet att mäta per
kort i stället för att ärva runda 108:s tal: "nästan" är över taket.

## Fyra mätningar om API:t som kostade tid

☠️ **1. Kroppen heter `body`, inte `data`.** A/B på samma fråga i samma anrop:

```
body:  2 rader — exakt de slugar som finns bland fem kandidater
data:  50 orelaterade tyska utkast
```

`data:` skickas inte alls, och felet syns OLIKA beroende på anrop: en PATCH
svarar `revision must not be empty` (tydligt), en query svarar **200 med
femtio rader** (osynligt). En sluggkrockskoll hade sagt "ingen krock" och sett
BEFOLKAD ut medan den inte frågat något — värre än ett tomt svar.

⚠️ Det gjorde att den här rundan först påstod att runbookens Steg 1-snutt inte
biter. Den biter; anropet var mitt.

☠️ **2. `fields=VARIANTS_INFO` finns inte** och ger samma missvisande
`400 Failed to parse JSON or deserialize protobuf message` som kommafällan.
`variantsInfo` ligger i standardprojektionen ändå.

☠️ **3. `list-categories-for-items` svarade TOMT för produkter som bevisligen
har kategorier.** Kontrollmätningen avgjorde det: `d4118d39` och två
publicerade syskon lästes med i samma anrop och kom tillbaka med `[]` — medan
produkt-GET:ens `directCategoriesInfo` visade `Hem & Inredning` på alla tre.
Kroppens fält heter dessutom `items`, inte `itemReferences`.

**Uppgift #313 säger motsatsen** ("kategorier läses med list-categories-for-items,
INTE med GET). Den är mätbart fel i den här sessionen. Den enda läsning som
höll mot en kontrollmätning är produkt-GET med `fields=DIRECT_CATEGORIES_INFO`.

⚠️ **4. Uppgift #357 bekräftades i drift.** Återläsningen DIREKT efter
kategoriskrivningen sa `SAKNAS` för `7bd4f691` — skrivningen hade gått igenom.
Fyra läsningar strax efter gav `HEM → HEM → HEM → HEM` för båda. Den produkt
som lästes närmast sin egen skrivning var den som ljög.

**En enda läsning duger varken som bevis eller som motbevis.**

## Live-grinden, alla åtta

```
OK  rumsavdelare-160-vit      160071 tecken  cache=HIT age=20
OK  rumsavdelare-160-brun     159951 tecken  cache=HIT age=20
OK  rumsavdelare-240-vit      152134 tecken  cache=HIT age=20
OK  rumsavdelare-240-svart    151600 tecken  cache=HIT age=20
OK  rumsavdelare-240-natur    160641 tecken  cache=HIT age=19
OK  rumsavdelare-240-brun     160438 tecken  cache=HIT age=19
OK  rumsavdelare-320-vit      160187 tecken  cache=HIT age=20
OK  rumsavdelare-320-natur    160171 tecken  cache=HIT age=20

8 av 8 sidor gröna
```

Grindens facit ligger i `facit-live.json` och **lästes ur katalogen**, inte
kopierades från runda 108:s filer. Två rundors filer som bär samma tal är just
den tvilling huset förlorat tid på fyra gånger.
