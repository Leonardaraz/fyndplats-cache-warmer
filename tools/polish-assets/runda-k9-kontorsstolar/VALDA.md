# Runda K9 — åtta kontorsstolar 1 099–2 629 kr

Familj K:s icke-massagehalva. Ett färgpar och sex ensamma, med större spridning
i typ än någon tidigare K-runda: en 220-kilosstol, en böjträstol, två
pälsklädda sminkstolar och en nätryggsstol med avtagbart nackstöd.

| kort | pris | saldo | vad |
| :-- | --: | --: | :-- |
| `e13dd23e` | 2 629 | 129 | Kontorsstol mörkgrå, **220 kg**, 62 cm sits, fickfjädrar |
| `108e1225` | 1 549 | 197 | Kontorsstol svart konstläder med böjträskal |
| `75890fe3` | 1 279 | 10 | Kontorsstol vit konstläder, kristallknappar |
| `b1039e91` | 1 249 | 110 | Skrivbordsstol vit teddyfleece, guldfot, **9 kg** |
| `e4a986ad` | 1 199 | 128 | Sminkstol rosa långhårig konstpäls, 8,9 kg |
| `4a1822e2` | 1 199 | 16 | Kontorsstol cognac mikrofiber, rutstickad |
| `ae9c9e69` | 1 169 | 41 | Samma stol som `75890fe3`, i rosa |
| `4871d041` | 1 099 | 47 | Kontorsstol svart nätrygg, avtagbart nackstöd |

Prisgrinden `stämmer: true` på alla åtta (åtta gröna `las`-körningar).

## ☠️ Lagerkollen tog bort TVÅ av tio kandidater — vid urvalet, inte efteråt

`d9f4c334` (1 879 kr) och `574cf80d` (1 419 kr, Boho med träarmstöd) har
**saldo 0**. `66cf81fe` (1 099 kr) har **saldo 1**. Alla tre var med i det
första urvalet på pris och lades åt sidan när saldot lästes.

Det är precis vad `gate-lager.py` och #173 finns för — men det som faktiskt
räddade rundan var att saldot lästes i URVALET, inte i grinden efteråt. En
grind som fäller när texten redan är skriven kostar en hel produkts arbete.
`574cf80d` var dessutom den mest särpräglade kandidaten i hela listan, alltså
den som hade varit lättast att skriva bra om och sämst att sälja.

## ☠️ Kontaktarket FÖRE texten fällde tre saker igen

1. **`b1039e91` är VIT MED GULDFOT** — källan säger `Farbe: Gold`, den svenska
   spec-raden säger `Färg: Weiß`, och båda är halva sanningen: fleecen är vit,
   foten och gaspelaren guldfärgade. Namnet, texten och alt-texterna säger nu
   båda delarna. Två källor som motsäger varandra och en bild som förklarar
   varför — det går inte att lösa vid skrivbordet.
2. **`4a1822e2` är MIKROFIBER, inte konstläder.** Tyska `Technische Daten` säger
   `Mikrofasertuch`, den svenska spec-raden säger `Kunstleder`. Närbilderna
   visar en matt textil. Samma klass som #189 (`4de34dce`). Texten säger
   mikrofiber och skötselstycket är skrivet för textil, inte för läder — det
   hade varit fel råd åt båda hållen annars.
3. **Tre bilder med tysk text inbränd**: `e13dd23e` positionerna 4 OCH 5
   (`Leinen-Gewebe`, `KOMFORTABLES DESIGN`) och `4871d041` position 4
   (`Mesh-Gewebe`, `Gaslift`). `e13dd23e` har därmed bara tre bilder kvar —
   samma situation som #166.

## ⚠️ En måttkonflikt som INTE skrevs

`4871d041`: källan säger `104,5–121,5H`, måttritningen på sidan säger
**102–119 cm**. Samma travel (17 cm), mätt från olika punkt. Spec-blocket bär
källans tal eftersom det är facit för siffergrinden; alt-texten till ritningen
nämner därför INTE totalhöjden alls. Ett tal som motsägs av en bild på samma
sida är värre än inget tal.

## ⚠️ SKU-kollisionerna fortsätter

| tysk SKU | produkter i rundan |
| :-- | --: |
| `FP-schreibtischstuhl` | 2 (`108e1225`, `b1039e91`) |
| `FP-burostuhl-ergonomisch` | 2 (färgparet) |
| `FP-burostuhl` | 1 (`4871d041`) — samma sträng som tre av K8:s |
| `FP-burostuhl-ergonomischer` | 1 (`e13dd23e`) — samma som fyra av K8:s |

Alltså inte bara inom rundan utan ÖVER rundor: `FP-burostuhl` bars av tre
K8-produkter innan de döptes om. `gate-sku.py` (byggd samma dag) fäller
dubbletter inom rundan; kollisioner utanför den syns bara i `las`-svaren, och
de lästes mot varandra som regeln säger.

## Korslänkar

Färgparet länkar till varandra. De två pälsklädda länkar till varandra med den
skillnad som betyder något (kort teddylugg mot långhårig päls, guldfot mot
krom). De två kompakta designstolarna länkar på klädseln (avtorkbart
konstläder mot mikrofiber som suger). Och de två fullstora kontorsstolarna
länkar på maxlast: 220 kg mot 120 kg.

## Grindar

| grind | utfall |
| :-- | :-- |
| `gate.py` | 0 fynd i 8 filer |
| `gate-alt.py` | REN, 8 produkter, 37 alt-texter |
| `gate-seo.py` | 0 fynd i 8 rader |
| `gate-lager.py` | 0 fynd, lägsta saldo 10 |
| `gate-lankar.py` | 0 fynd, 8 länkar inom rundan |
| `gate-sku.py` | 0 fynd, längsta 39 av 40 tecken |
| `hasha.py` → återläsning | **8/8 LIKA** |

Alla SEX filgrindar rena i FÖRSTA körningen. Kategori `Hem & Inredning`
kopplad 8/8 enligt bulk-svarets `itemMetadata`.

## ☠️ `fields=A,B` är ett 400, inte en tyst ignorering

`GET /stores/v3/products/{id}?fields=PLAIN_DESCRIPTION,MEDIA_ITEMS_INFO` svarar
`Failed to parse JSON or deserialize protobuf message`. Rätt form är upprepade
parametrar: `?fields=PLAIN_DESCRIPTION&fields=MEDIA_ITEMS_INFO`. Värt att veta
åt andra hållet också — det här är ETT av få ställen där Wix faktiskt säger
ifrån i stället för att svara med en tystare projektion.

## Facit byggdes MEKANISKT, inte avskrivet

`kallor-tal.json` räknades fram server-side ur de tyska källtexterna med en
JS-spegling av `gatelib.tal()`, och de två implementationerna verifierades mot
varandra på ett hårt fall (tusental med både mellanslag och punkt, decimalkomma
och intervall) — identiskt utfall. Ingen siffra i facit har passerat en
avskrift.

## Live-verifierat 2026-09-08 — 8/8 REN

Hämtat ISR-medvetet (varm träff, 305 s, skarp hämtning): alla åtta HTTP 200 med
`age: 100–101`, alltså renderingar som den varma träffen utlöste.

| kort | ord | orddiff |
| :-- | --: | --: |
| `e13dd23e` | 593 | 0 |
| `108e1225` | 529 | 0 |
| `75890fe3` | 500 | 0 |
| `b1039e91` | 542 | 0 |
| `e4a986ad` | 551 | 0 |
| `4a1822e2` | 555 | 0 |
| `ae9c9e69` | 497 | 0 |
| `4871d041` | 562 | 0 |

`livegrind.py` kör sju svep per sida och alla sju är rena: orddiff mot
källfilen, homoglyfer, sidsvep, alt-svep, SEO-svep exakt mot `seo.tsv`, de tre
obligatoriska flikarna, kategorins brödsmula, köpbarheten (ingen `OutOfStock`
— värt att notera på en runda där två kandidater föll på saldo 0) och att
korslänken överlevt.

De åtta interna korslänkarna är därmed kontrollerade — `gate-lankar.py` kunde
per konstruktion inte hämta dem före skrivningen.
