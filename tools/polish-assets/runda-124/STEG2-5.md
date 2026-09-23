# Runda 124 Steg 2–5 — elva bärbara verktygslådor

## Steg 2 — laglighetsgrind: ingen spärr, men EN bindande uppgift

En verktygslåda i lackerad stålplåt bär ingen egen produktstandard och ingen
CE-märkning: den är varken maskin, elprodukt, leksak eller trycksatt. GPSR
gäller som alltid, men det finns inget harmoniserat krav att mäta mot.

Det som DÄREMOT binder är **lasterna** — de är det enda säkerhetspåståendet på
sidan, och en överlastad låda som lossnar i handtaget är en verklig risk. Alla
elva lastuppgifter kommer därför oförändrade från leverantörens brödtext, och
inget tal är härlett.

**Ingen spärr. Elva produkter går vidare.**

## Steg 3 — mappningsraden för alla elva

Elva `las`-körningar (2461–2471), alla `success`.

| id | pris | prisgrind | saldo | EU-lager | frakt­andel |
|---|--:|---|--:|---|--:|
| `7b544155` | 799 | ✅ stämmer | 62 | ja | 0,447 |
| `22bedfb0` | 919 | ✅ | 70 | ja | 0,437 |
| `370918a9` | 949 | ✅ | 71 | ja | 0,420 |
| `aafbf543` | 979 | ✅ | 66 | ja | 0,451 |
| `5541fbb0` | 1 039 | ✅ | 117 | ja | 0,423 |
| `0283be34` | 1 129 | ✅ | 23 | ja | 0,392 |
| `8a6922ce` | 1 179 | ✅ | 35 | ja | 0,373 |
| `b9cca4a6` | 1 199 | ✅ | 31 | ja | 0,369 |
| `94925af2` | 1 349 | ✅ | 197 | ja | 0,326 |
| `aae03048` | 1 399 | ✅ | 197 | ja | 0,316 |
| `f50b75d8` | 1 429 | ✅ | 130 | ja | 0,308 |

Elva av elva: pris stämmer mot `×1,20 charm99`, saldo över noll, EU-lager,
fraktandel under 0,5. **Ingen hålls tillbaka.** Ingen behöver `?skipFreightHeavy`.

☠️ **Alla elva delar SKU med minst en annan** — `FP-werkzeugkoffer` bärs av tre,
`FP-werkzeugkiste-leer-49-7` av tre, `FP-werkzeugkiste-mit-3` och
`FP-werkzeugkiste-abschlie` av två var. Det är uppgift #272 igen: **krocken
skapas av importen**, som kapar den tyska sluggen, inte av poleringen. Steg 8
ger alla elva var sin svensk SKU och löser den på köpet.

## Modellgrupperna — tre familjer och två ensamma

| grupp | konstruktion | medlemmar |
|---|---|---|
| **A** | 51 × 22 cm, kallvalsat stål, två spännlås | `aafbf543` `5541fbb0` `0283be34` `8a6922ce` |
| **B** | 49,7 × 25,3 cm, plastkåpa + stållådor, minilådor | `370918a9` `b9cca4a6` `f50b75d8` |
| **C** | 60 × 26 × 34 cm, stålhölje, cylinderlås | `94925af2` `aae03048` |
| — | uppfällbar femfacksbox | `7b544155` |
| — | 45 cm, tre lådor + fack | `22bedfb0` |

## Steg 4 — bilderna: 55 granskade

**Noll bilder med TYSK text i pixlarna.** Alla elva måttritningar är rent
numeriska och bekräftar brödtextens mått exakt.

Men fyra andra fynd, och tre av dem hade nått kund:

### ☠️ F1 — `370918a9` har TVÅ lådor, inte fyra

Steg 1 skrev "4 fack". Tre oberoende källor säger två:

| källa | vad den säger |
|---|---|
| tyska brödtexten | *"verfügt über **zwei Schubladen**"* |
| höjden | **28,9 cm** mot syskonets 40,7 — 11,8 cm är exakt två lådor |
| hjältebild + måttritning | två orange lådfronter, inte fyra |

Rättat. Syskonet `b9cca4a6` (40,7 cm) och `f50b75d8` (40,7 cm) har fyra.
**Samma modellserie i två höjder** — inte dubbletter av varandra.

### ☠️ F2 — `94925af2` och `aae03048` HETER "3 Schubladen" och har SEX

Namnet är leverantörens, och det är fel. Brödtexten säger *"sechs
Schubladen"*, lådstorlekslistan har tre format (15 / 50,5 / 50,5 cm breda),
och verkstadsbilden visar layouten utan tvekan:

```
tre små lådor sida vid sida  (15 × 22 × 3 cm, 5 kg var)
en genomgående grund          (50,5 × 22 × 3 cm)
en genomgående grund          (50,5 × 22 × 3 cm)
en genomgående djup           (50,5 × 22 × 7,5 cm)
```

**3 + 3 = sex.** Våra namn och texter säger sex.

### ☠️ F3 — grupp A är HÄNGLÅSBAR, inte nyckellåsbar

Tyskans *"abschließbar"* läses lätt som "går att låsa med nyckel". Bilden säger
något annat: de två förkromade spännlåsen har **en ögla för hänglås** i nederkant,
och det finns **ingen låscylinder**. Leveransen är låda + anvisning — **inget lås,
ingen nyckel**.

Grupp C är motsatsen och det syns: **cylinderlås i den svarta fronten**, och
leveransen listar uttryckligen **2 × nyckel**.

Skillnaden står i texten på alla sex sidorna. En kund som köper grupp A i tron
att den låses med nyckel är felinformerad av oss, inte av leverantören.

### ☠️ F4 — `22bedfb0` anges som röd men har SVARTA lådfronter

Leverantören skriver `Farbe: Rot`. Stommen är röd, men **lådfronterna är svarta**
i hjältebilden, i livsstilsbilden och i måttritningen. Texten säger röd stomme
med svarta fronter.

### ☠️ F5 — `f50b75d8`:s spec-block bär FEL FEED-KOLUMN

```
Mått: 4 Fächer          ← ett antal, inte ett mått
Material: Kunststoff    ← lådorna är stål
```

Brödtexten och måttritningen ger **49,7 × 25,3 × 40,7 cm** och **stål + plast**.
Samma klass som runda 123:s `12cb8a2c`. Spec-blocket används inte.

## Steg 5 — leverantörens påståenden

### ☠️ F6 — "rostar inte" och "rosthärdig" i SAMMA text (`7b544155`)

Leverantören skriver både *"Stahl, dass nicht rostet"* och *"Pulverbeschichtung
**zur Rostbeständigkeit**"*, plus *"Kratz- und Rostfest"*. Pulverlackerat
SPCC-stål är **rosthärdigt så länge lacken är hel** — det är inte rostfritt.
Texten skriver aldrig att den inte rostar.

### ⚠️ F7 — totallast och lådlast är TVÅ tak, inte en motsägelse

Det ser ut som en självmotsägelse och är det inte: ett tak per låda och ett för
hela lådan är två oberoende gränser, och totalen binder.

| grupp | totalt | per låda |
|---|--:|---|
| A (3 lådor) | 16 kg | **2 kg** + 10 kg i övre facket |
| A (4 lådor) | 18 kg | **2 kg** + 10 kg i övre facket |
| B | 30 kg | 10 kg |
| C | 50 kg | 15 kg bred, 5 kg liten |

☠️ **Grupp A:s 2 kg per låda är lågt nog att förtjäna en egen mening.** En
hylsnyckelsats väger mer än så. Det står rakt ut på alla fyra sidorna.

### ⚠️ F8 — verktygen på bilderna ingår inte

Leveransen är låda + anvisning (grupp C dessutom två nycklar). Bilderna visar
skruvmejslar, hylsor, tejp och en genomskinlig sorteringsask — inget av det
följer med.

**Undantag som DÄREMOT ingår, och som ska stå med:** grupp B:s **två uttagbara
minilådor** och den **uttagbara plastinsatsen** (47 × 20 × 4 cm). De står i
brödtexten, syns i måttritningen och i bildens inzoomning.

### ☠️ F9 — fyra livsstilsbilder bär en LÄSBAR TREDJEPARTSLOGOTYP

Position 2 på `5541fbb0`, `8a6922ce`, `94925af2` och `aae03048` visar samma
verkstadsscen, och på hyllan står tre blå lådor med **"AutoMeter"** i gul
etikett — skarpt läsbart. På `94925af2` och `aae03048` position 4 syns dessutom
en röd **"SKIL"**-kartong med artikelnummer.

Det är inte vår leverantörs märke och inte tysk text, alltså inget som runbokens
bildregler täcker. Men **position 2 är delningsbilden**, den som hamnar i en
Google- eller sociala förhandsvisning, och ett annat företags registrerade märke
är illa placerat just där.

**Lämnat till Leonard, inte åtgärdat.** Att gallra fyra livsstilsbilder på eget
bevåg är en större ändring än underlaget bär, och varumärkesfrågan är hans.

### ☠️ F10 — `8a6922ce` position 4 bär ENGELSK text i pixlarna

En bakgrundsburk med stor läsbar text:

```
INTERIOR/EXTERIOR PROPERTY DAMAGE
```

Det är främmande språk i pixlarna — samma grund som en tysk grafik fälls på —
och formuleringen läser dessutom illa på en verktygslådesida. **Bilden är
borttagen.** `8a6922ce` går live med fyra bilder.

### ⚠️ F11 — husmärkets skylt sitter FYSISKT på varan

En vit plåtetikett med rött emblem sitter på fronten på nästan alla elva.
Leonards regel 2026-09-05 gäller ordagrant: *"om märket sitter fysiskt på varan
så gör vi inget åt det, det är så produkten ser ut"*. Orörd.

## Dubblettgrinden efter bilderna: STEG1:s dom står

`b9cca4a6` (gul) och `f50b75d8` (orange) delar mått, lådantal och last exakt och
har **samma renderade scener omfärgade** — färgsyskon, precis som runda 59:s
ugnar. Viktskillnaden (10,8 mot 12 kg) är leverantörens enda avvikande tal och
räcker inte som motbevis.

⚠️ **Prisgapet mellan dem är 230 kr (19 %) för samma låda i en annan färg.**
Det följer inköpspriset, inte ett beslut. **Priset rörs inte** — men sidorna
korslänkar så kunden ser båda.
