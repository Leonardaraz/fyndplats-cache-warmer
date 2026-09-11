# Runda 129 — nio solcellslyktor på mast

## Steg 1 — familjen, och varför den valdes

Katalogsvep 2026-09-11 via `products/search` (57 sidor, `avhuggen: false`,
**unika == lästa**, alltså inget sidbrytningsfel):

| | |
|---|--:|
| Produkter totalt | 5 649 |
| Publicerade | 2 569 |
| Utkast | 3 080 |

Familjen valdes på **förhållandet**, inte på antalet. Tyska huvudord med
flest utkast är `kinder` (77) och `elektro` (62) — båda är prefix över
vitt skilda produkttyper, inte familjer. Kandidatmätningen, **två**
sökningar per familj (utkast på tyskt huvudord, publicerade på svenskt ord,
runbookens regel efter runda 60):

| familj | utkast | publicerade |
|---|--:|--:|
| **solcellslampor** | **15** | **0** |
| sideboard | 15 | 9 |
| schlafsofa | 13 | 9 |
| küchenschrank | 13 | 10 |
| barhocker | 13 | 20 |
| mülleimer | 16 | 26 |
| campingzelt | 13 | 28 |

☠️ **Nollan är GRANSKAD, inte antagen.** Sökningen på svenska solord gav sju
publicerade träffar och **alla sju är falska**: en snögubbe med lykta, en
animerad halloweenhäxa, två planteringsbord, en planteringsvagn, en
fågelmatare med kamera (soldriven) och en väderstation med solcell. Ingen av
dem är en lampa. Familjen har alltså noll sökordskrockar och noll
måttvillingar mot katalogen — runbookens billigaste runda.

⚠️ **Rundan tar NIO av femton.** De sex rottinglamporna (`65e3c24f`,
`4e23a904`, `66a26135`, `5ffb91a2`, `ef0c374b`, `a8cf27cd`) är en egen
konstruktion med egna färgtvillingar och blir runda 130. `137403f6` är en
bärbar solpanel på 100 W — en laddare, inte belysning, och alltså en annan
produkttyp. Alla tre grupperna står i `matt.py` så nästa runda slipper mäta
om familjen.

⚠️ **SKU-krockarna är ÄRVDA, inte skapade här.** Fyra utkast bär redan
`FP-solar-laterne` och tre bär `FP-solar-stehlampe-rattan` — importen kapar
produktdelen vid 24 tecken och de tyska sluggarna är identiska ända dit
(uppgift #272). Steg 8 måste alltså räkna varje SKU inom 24 tecken innan
sluggen låses, inte efter.

## Steg 2 — laglighets- och påståendegrinden

Familjen säljs på EN sak, och det är precis då den ska prövas (runda 97):
*den lyser upp trädgården gratis*. Fem fynd.

### 1. ☠️ IP44 är STÄNKSKYDD — "vattentät" får inte skrivas

Leverantören skriver `Wasserdicht` på flera av de nio och anger samtidigt
IP44. Enligt IEC 60529 betyder den andra fyran **skydd mot vattenstänk från
alla riktningar** — inte nedsänkning, inte kraftiga strålar. Den första
fyran är fasta föremål större än 1 mm.

Texten skriver därför **stänkskyddad enligt IP44** och aldrig "vattentät".
Leverantörens vidare påstående på ett av de parkerade utkasten —
*"widersteht Regen, Schnee, Frost und Hagel"* — är inget IP44 intygar och
upprepas inte.

### 2. ☠️ Svensk vinter är en HÅRD GRÄNS som hör hemma på sidan

Varje spec lovar 6–8 timmars lystid på 5–8 timmars laddning. Det
förutsätter sol. Clas Ohlsons egen guide för solcellsbelysning säger två
saker som gäller alla nio:

> "Förvara solcellsbatterierna inomhus vintertid så att de inte fryser
> sönder."

> "En optimalt laddad och bra placerad lampa med väl fungerande batterier
> kan lysa upp till 5–6 timmar."

Det är samma klass som gasolgrillarnas 50 mbar (runda 44): ett villkor som
avgör om varan går att använda, och som ska skrivas som ett **positivt
villkor med egen `<h2>`**, inte som en varningslista.

### 3. ⚠️ Ljusstyrkan är DEKORATIV — och det är kategorins klyscha

| | lumen |
|---|--:|
| `14aa1777` | 200 / 100 |
| `1f14ab66` | 200 / 100 |
| `db933c3c` | 120 |
| `4ef7c2b4` | 90 |
| `c9ab8531` | 60 |
| `6747b6c0` | 40 |
| `a6727ca5`, `9938574b`, `ec8ab782` | anges inte |

En vanlig 40 W-glödlampa ger cirka 450 lm. De nio ligger alltså på en
tiondel till knappt hälften av det. Att skriva *"lyser upp gången"* som en
förmåga är precis den kategoriklyscha runda 97 mätte upp på
foderstationerna: den känns som en produktegenskap och är obevisad.

**Beskriv mekaniken** — hur många huvuden, hur många lumen, när den tänds —
och låt kunden dra slutsatsen. Tre av nio saknar lumenvärde helt och får då
inget ljusstyrkepåstående alls.

### 4. ⚠️ CE står inte i källan för någon av de nio

Rottinglamporna i runda 130 listar `CE` respektive `CE DOC`; av rundans nio
gör bara `a6727ca5` det (`CE-LVD, MSDS(Batterie), IP44`). Ingen sida skriver
ett certifieringspåstående — det är inte ett säljargument som hör hemma i
brödtext, och ett ogrundat sådant fälldes redan i runda 54.

### 5. **Flameffekten är ett LJUSMÖNSTER, inte en låga**

`a6727ca5` säljs som `Fackelflammen`. Det är sex lysdioder som flimrar.
Texten säger flameffekt och aldrig något som antyder eld.

## Steg 5 — talen, och de som INTE fick användas

☠️ **Vikten är två tal, och importen skriver det grova under fel etikett.**
Se uppgift #488. Fyra av nio har både `Nettogewicht` i tyskan och ett
tyngre tal i spec-tabellen; kvoten är 1,27–1,47, alltså emballage.
`Vikt` skrivs bara där nettot är känt, annars `Vikt med emballage`.

☠️ **`4ef7c2b4`: ingressens "12 Paneelen" används INTE.** `Technische Daten`
anger ETT solpanel på 4,5 V / 1,62 W. En ingress kan vara ett syskons
(runbookens minibackofen-fall) och väger aldrig tyngre än spec-blocket.

☠️ **`a6727ca5`: leverantören kallar 3500 K "Kalt".** 3500 K är
varmneutralt vitt; kallvitt börjar norr om 5000 K. Talet används,
etiketten inte. Systerprodukten `9938574b` anger 6000 K och där stämmer
"kall" — alltså är det en felskrivning på den ena, inte en husstandard.

⚠️ **`1f14ab66` och `14aa1777` motsäger varandra om laddning och lystid**
(8 h → 6 h mot 6 h → 8 h) trots samma solpanelstorlek (16,5 × 15 cm).
Varje sida bär sitt eget tal; ingen förening gissas fram.

⚠️ **`db933c3c`: spec-tabellen säger `Material: 21 Edelstahl`.** Tyskan
säger `201 Edelstahl`. Nollan har fallit bort i importen — 21 finns inte som
stålsort. Skrivs som rostfritt stål 201.

⚠️ **`ec8ab782` saknar lumen, laddtid och paketmått i källan.** De fälten
utelämnas i stället för att härledas ur ett syskon.

☠️ **Parkerad defekt att ta i runda 130:** `ef0c374b`:s spec-tabell säger
`Mått: 45m x 45m x 45m` — METER. Tyskan säger Ø45 × 45H cm för den stora
lampan och Ø35 × 35H för den lilla. Två fel i en rad: fel enhet, och två
lampor beskrivna som en.

## Steg 4 — bilderna

Alla nio har fem bilder var. Granskade i kontaktark om tre produkter, ruta
460 px (☠️ en siffra läses aldrig på ett kontaktark — runbookens regel efter
runda 104 — men tysk text syns).

| id | bort | vad som stod i pixlarna |
|---|---|---|
| `14aa1777` | **4 och 5** | `VERSTELLBARE STAHLHÖHE` · `EINFACHE MONTAGE` + `Schrauben`/`Erdspieße` |
| `4ef7c2b4` | **4** | `HÖHENVERSTELLBAR …` upptill OCH `4/3/2 Abschnitte` nedtill |
| `a6727ca5` | **4** | `Perfekt für Ihre Terrasse …` mitt i ett fyrfältskollage |
| `9938574b` | **4** | `STABIL HALTEN / Befestigen Sie den Sockel mit Erdnägeln` |
| `1f14ab66`, `c9ab8531`, `ec8ab782`, `db933c3c`, `6747b6c0` | — | **alla fem rena** |

⚠️ **Beskärning prövades och dög inte på någon av de fyra.** Regeln är att en
utländsk infografik byggs om hellre än kastas, men här går texten inte att
kapa bort utan att kapa varan: `14aa1777`:s rubrik ligger i SAMMA höjdband som
den högsta lampans huvud, `4ef7c2b4` bär text både överst och nederst,
`9938574b`:s text slutar 40 px in i lampfoten, och `a6727ca5`:s banderoll
ligger mitt i kollaget. En förstoring av `14aa1777-04` och `9938574b-39`
avgjorde det — inte kontaktarket.

☠️ **`db933c3c` bär TOM alt-text på alla fem bilderna.** Rå-importens tillstånd
(uppgift #381); de övriga åtta bär leverantörens tyska titel. Poleringen
skriver om allihop.

✅ **Två mätningar kom UR bilderna, inte ur texten:**

- `6747b6c0` bild 5 visar taket med **fyra solceller**, vilket bekräftar
  tyskans *"4 Solarpanels"*.
- `4ef7c2b4` bild 3 ger planteringsfoten som **37 cm bred och 31 cm hög** —
  ett mått som inte står i `Technische Daten`.

## Steg 3 — mappningsraden, och prisgrinden

Nio `las`-körningar av **Polering — läs och stämpla mappningsraden**, alla
`success`. ☠️ Det är ett ÄKTA kvitto just här: workflowen gör `exit 1` både på
`EJ AVGORBAR` och på `stämmer: false` för en Aosom-rad, och den grenen är
läst. Nio gröna jobb = prisgrinden höll på nio produkter.

Läst ur en av loggarna (`14aa1777`, `PRODUCT_ID` i env-blocket är facit —
körningsordningen i Actions är den inte):

```
supplier aosom · needsAiPolish true · draftStatus pending_review
hasEuWarehouse true · aosomSyncedQty 117
wixVariantId 627c6f0e-… · sku FP-solar-laterne-2er-set · grossSek 1299
faktiskt 1299 · stammer true · regel x1.2, avrundning charm99
aosomFreightShare 0.309
```

✅ **Wix variant-id ÄR mappningens `wixVariantId` — mätt, inte antaget.**
`variantsInfo.variants[0].id` för `14aa1777` är byte-identiskt med raden ovan.
De övriga åtta id:na är därför lästa ur Wix i stället för ur åtta loggar.

## Steg 8 — SKU:erna

☠️ **Fyra av nio delar redan SKU:n `FP-solar-laterne`** (`1f14ab66`,
`c9ab8531`, `4ef7c2b4`, `ec8ab782`). Importen kapar produktdelen vid 24 tecken
på hel ordgräns och de tyska sluggarna är identiska ända dit — uppgift #272:s
mönster, ärvt och inte skapat här.

De nio planerade sluggarna och vad `lib/import/sku.ts` gör av dem:

| slug | SKU |
|---|---|
| `solcellslampa-180-cm-2-pack` | `FP-solcellslampa-180-cm-2` |
| `solcellslampa-195-cm-planteringskruka` | `FP-solcellslampa-195-cm` |
| `solcellslampa-182-cm-tva-klot` | `FP-solcellslampa-182-cm-tva` |
| `solcellslampa-185-cm-tre-lyktor` | `FP-solcellslampa-185-cm-tre` |
| `solcellslampa-189-cm-tre-skarmar` | `FP-solcellslampa-189-cm-tre` |
| `solcellslampa-dimbar-tre-lyktor-rostfri` | `FP-solcellslampa-dimbar-tre` |
| `solcellslampa-177-cm-tradgardslykta` | `FP-solcellslampa-177-cm` |
| `solcellslykta-129-cm-2-pack` | `FP-solcellslykta-129-cm-2` |
| `solcellslampa-160-cm-rostfri` | `FP-solcellslampa-160-cm` |

☠️ **`db933c3c` fick INTE höjden i sluggen.** 182,5 cm ligger ett komma från
`c9ab8531`:s 182 cm, och två sidor som skiljs av en decimal skiljs inte alls i
en kategorilista. Den heter efter det som faktiskt är dess särart: den dimbara,
avtagbara LED-modulen.

### ☠️ Det första SKU-svepet gav ett FALSKT FRISKINTYG

Svepet över katalogen rapporterade **`distinktaSkuer: 0` på 66 sidor** och
"noll krockar". Nio SKU:er var bevisade minuten innan, alltså var det
FÄLTVÄGEN som var fel: listan ligger under `variants`, inte under
`productVariants`. Ett svep som läser fel fält svarar exakt likadant som en
ren katalog.

Det som avslöjade det var den **kända nämnaren** — runbookens regel efter
2026-08-26. Svepet bär sedan dess en **positiv kontroll** i sig självt:

| | |
|---|--:|
| sidor | 66 |
| variantrader | 6 588 |
| distinkta SKU:er | **5 418** |
| positiv kontroll `FP-solar-laterne` | **4 träffar** |
| krockar mot rundans nio | **0** |

De fyra träffarna är exakt de fyra utkast som mättes oberoende mot Wix. Två
vägar, samma tal.

☠️ **Och grinden som skulle räkna SKU:n var själv drven** — se uppgift #484:
`grindar.FOGEORD` bar `till`, `som` och `utan` som produktionen inte stryker,
och saknade `the` och `with` som den stryker, och `sku_bas` saknade
märkesstrykningen helt. Lagat, och `_kallkodsgrind_sku()` läser nu
`lib/import/sku.ts` och fäller om någon av sidorna rör sig.

## Steg 7–8 — utfall och två mätningar

### Steg 7: nio av nio gröna

Varje skrivning hashades före (mot `facit` i `skrivning.json`) och efter
(mot Wix återläsning med `?fields=PLAIN_DESCRIPTION`). Alla nio stämmer, och
alla nio står kvar som `visible: false`.

| pid | slug | hash |
|---|---|--:|
| `14aa1777` | `solcellslampa-180-cm-2-pack` | 630397412 |
| `1f14ab66` | `solcellslampa-195-cm-planteringskruka` | 828714149 |
| `c9ab8531` | `solcellslampa-182-cm-tva-klot` | 526037118 |
| `4ef7c2b4` | `solcellslampa-185-cm-tre-lyktor` | 318833594 |
| `ec8ab782` | `solcellslampa-189-cm-tre-glaskupor` | 128461424 |
| `db933c3c` | `solcellslampa-dimbar-tre-lyktor-rostfri` | 579492951 |
| `a6727ca5` | `solcellslampa-177-cm-tradgardslykta` | 43295628 |
| `9938574b` | `solcellslykta-129-cm-2-pack` | 796943089 |
| `6747b6c0` | `solcellslampa-160-cm-rostfri` | 117528014 |

### ☠️ De fullständiga produkt-id:na fanns inte på disk — och en gissning svarade 404

Rundans filer bar bara de åtta första tecknen. Efter komprimeringen fanns
ingen källa till resten, och första skrivförsöket gick mot ett påhittat
id: `404 Entity not found`. Felet var ofarligt just för att Wix inte har
någon produkt på ett gissat id — men samma gissning mot ett id som RÅKAR
finnas hade skrivit rundans text på en främmande produkt.

Alla nio är nu upplösta ur katalogen och ligger i `produkt-id.json`.
**En runda ska bära sina fullständiga id:n på disk, inte i sitt eget minne.**

### ☠️ `products/search` bär INTE `variantsInfo` — och svarade noll utan att fela

Steg 8:s krockkontroll kördes först som ett svep över `products/search`.
Utfallet: 5 649 lästa produkter, **noll** med variant, **noll** distinkta
SKU:er, noll krockar. Det ser ut som ett rent besked och är en falsk
friskförklaring — projektionen bär helt enkelt inte fältet.

Det som fällde den var den positiva kontrollen: `FP-solar-laterne` är känd
sedan tidigare i katalogen och svepet hittade den **noll** gånger. En
kontroll med känd nämnare är skillnaden mot att tro på en nolla.

Rätt väg är `POST /stores/v3/products/search-variants` (Read-Only Variants
V3), som svarar under nyckeln `variants`. Omkört:

| | |
|---|--:|
| Varianter lästa | 6 588 |
| Med SKU | 6 580 |
| Distinkta SKU:er | **5 418** |
| Positiv kontroll `FP-solar-laterne` | **4** |
| Krockar mot rundans nio | **0** |

⚠️ `sku` går INTE att filtrera på. `query-variants` filtrerar bara på
`productData.productId` och variant-id — svepet är alltså enda vägen.

### ☠️ Fyra av rundans egna nio delade SKU — importen kapade dem lika

De fyra `FP-solar-laterne` i tabellen ovan är `1f14ab66`, `c9ab8531`,
`4ef7c2b4` och `ec8ab782`. Fyra olika lampor, fyra olika tyska namn, samma
kapade bas. Det är uppgift #272/#473 mätt en gång till, och poleringen är
det som löser den: varje sida får sin egen härledda SKU.

Katalogen bär dessutom 6 580 SKU:er på 5 418 distinkta strängar — alltså
~1 160 delade förekomster till. Den svansen är inte rundans att laga, men
talet är mätt nu.

### ☠️ En `variantsInfo`-PATCH KRÄVER `price` — och priset får aldrig räknas

Första SKU-skrivningen avvisades: `product.variantsInfo.variants[0].price
must not be empty`. Fältet är obligatoriskt även när man bara vill röra
SKU:n.

Priset ekas därför tillbaka ORDAGRANT ur samma läsning som gav revisionen,
och bara `actualPrice.amount` (plus `compareAtPrice` när den finns) —
`priceAfterDiscount` är read-only. Skrivningen avbryts för den produkt vars
pris inte gick att läsa, i stället för att gissa. Efter varje skrivning
jämförs beloppet mot det inlästa: **nio av nio orörda.**

`visible` ekas på BÅDA nivåerna, och alla nio står kvar som utkast efteråt.

### ☠️ Återläsningen ljög NEGATIVT — för tredje gången (jfr #316, #460)

`a6727ca5` rapporterade `skuStammer: false` direkt efter sin PATCH: den
gamla tyska SKU:n låg kvar i svaret, trots att revisionen hade ökat. En
fristående omläsning en stund senare gav den nya SKU:n och revision 4 —
läsningen hade legat en revision efter.

Omskrivningen var villkorad på att SKU:n FORTFARANDE var fel, så ingenting
skrevs en andra gång. Det är poängen: en retry som skriver oavsett hade
brunnit en revision på ett problem som inte fanns.

## Steg 9 — bilderna

49 bilder över nio produkter, jämförda **ord för ord mot `media.py`** efter
skrivningen: **0 avvikelser**. Kortet ligger på plats 3 och måttritningen sist
på alla nio; alla nio står kvar som `visible: false`.

| pid | bilder efter | bortplockade |
|---|--:|--:|
| `14aa1777` | 4 | 2 |
| `1f14ab66` | 6 | 0 |
| `c9ab8531` | 6 | 0 |
| `4ef7c2b4` | 5 | 1 |
| `ec8ab782` | 6 | 0 |
| `db933c3c` | 6 | 0 |
| `a6727ca5` | 5 | 1 |
| `9938574b` | 5 | 1 |
| `6747b6c0` | 6 | 0 |

### ☠️ Kortets fil-id BEVISADES med md5 — ett giltigt men fel id är tyst

Ett kort-id som råkar peka på en ANNAN fil ger ingen felkod: bilden laddas,
sidan ser hel ut, och kunden får fel produktbild. Varje fil hämtades därför
från `static.wixstatic.com/media/<id>` och md5-jämfördes mot kortet på disk:
**9 av 9 byte-identiska.** Identitet, inte tilltro.

### ☠️ `bomlåda` nådde Wix på ÅTTA alt-texter — filen sa `blomlåda`

Alt-texterna skrevs först i `media.py`, grindades där, och sedan **skrevs av
för hand** in i API-anropet. Avskrivningen tappade ett `l` i åtta av 27
texter. Exakt batch 64:s mätning en gång till: *inline i anropet ger fel,
fil först ger noll* — men den regeln gäller bara om anropet LÄSER filen.
Här skrevs filen och ignorerades.

Två saker gjorde det ofarligt:

1. **Rättelsen skrev inte om någon mening.** Den läste den skrivna strängen
   ur Wix och bytte bara ordet (`split(FEL).join(RÄTT)`), så ingen ny text
   passerade en tangentbordsrad. 8 rättade, 0 övriga rörda.
2. **Kvittot är en LOKAL DIFF mot planfilen**, inte en blick på svaret.
   PATCH-svaret ekar tillbaka exakt det man skrev — det kan aldrig se
   felstavningen. Det som fångade den var att läsa tillbaka från Wix och
   jämföra mot `media.py` i Python.

⚠️ **Regeln skärpt: en skrivning är inte klar förrän den DIFFATS mot filen.**
Att grinda filen räcker inte när handen står mellan filen och API:t.

### ☠️ Återläsningen direkt efter media-PATCH låg en revision efter — på 3 av 5

Batch A rapporterade tre av fem som oförändrade, och listan den visade var
exakt den gamla importordningen. En fristående omläsning strax efter gav rätt
ordning på alla fem, med revisionen ett steg högre än den lögnaktiga läsningen
visade.

Det är uppgift #394 mätt igen, och nu med mekanismen synlig: läsningen
serverade tillståndet FÖRE skrivningen. **Verifiera i ett SEPARAT anrop, inte
i samma.** Batch B skrevs därför utan inbyggd kontroll, och kvitterades i en
egen läsning efteråt.

### ☠️ Alt-texten skrevs efter kontaktarken, inte efter produktnamnet

Varje rad i `media.ALT` beskriver vad som FINNS i bilden — att `db933c3c`:s
livsstilsbild visar någon som matar en katt, att `6747b6c0`:s sista bild är
taket snett uppifrån. Det gick bara att skriva genom att titta på bilderna.
En alt-text härledd ur produktnamnet hade blivit sann om produkten och falsk
om bilden, vilket är hela poängen med alt-text.

Grinden (`media.py` + rundans `FORBJUDET`/`TYSKA`) kontrollerar dessutom:
inga tal, inga artikelnummer, inga homoglyfer, inga tyska ord — och en egen
lista mot **avdiakritiserad svenska** (`matt`, `hojd`, `narbild`), som fällde
hela första utkastet efter att det skrivits genom en heredoc.

## Steg 10 — kategorierna

Trädet har 54 kategorier och ett löv som passar exakt:
**`Trädgård & Utemöbler > Trädgårdsdekor & Belysning`**. Lövet är etablerat, inte
tomt — det bar 35 artiklar före rundan.

Alla nio låg före skrivningen **bara i `All Products`**. Efter: förälder + löv,
verifierat i ett SEPARAT anrop (uppgift #357: en läsning i samma anrop som
kategoriskrivningen kan ljuga negativt). **9 av 9 har båda.**

☠️ **`query-categories` kräver `treeReference`** (`{appNamespace: "@wix/stores"}`)
i kroppen, och `list-categories-for-items` vill ha fältet **`items`**, inte
`itemReferences`. Båda svarar 400 med rätt fältnamn i meddelandet — högljutt,
alltså ofarligt, men värt att skriva ned.

⚠️ **`itemsInfo.count` är 0 på VARENDA kategori i query-svaret.** Det är en
projektion som inte efterfrågats, inte ett tomt träd — lövet innehöll 35 artiklar
när det lästes med `list-items`. Läs aldrig antalet ur trädfrågan.

## Steg 12 — källgrinden före publicering

`grind.granska` + flikstruktur + osynliga tecken över alla nio: **0 fel**.
`grindar._sjalvtest()`: 56 fall, 0 fel.

☠️ **`grindar.flikfel` är en LIVE-grind och får inte köras på källan.** Den letar
efter `<summary>`-element; källans `plainDescription` bär `<h2>`, och det är
butikens `splitFlikar` som gör om dem vid rendering. Körd mot källan gav den
**27 fel på nio korrekta sidor** — ett falsklarm av exakt den sort runbooken
varnar för. Källsidan kontrolleras i stället på `<h2>`-rubrikerna:

- de tre flikrubrikerna finns ordagrant,
- inget annat block ligger EFTER den första flikrubriken (allt hamnar annars i
  fel flik — runda 118–120:s fel),
- flikordningen är spec → skötsel → FAQ,
- och inga U+00AD / U+00A0 / U+200B / U+FEFF i namn, titel, meta, slug eller HTML.

## Steg 13 — publicerade

**9 av 9 live**, och varje rad kontrollerad i ett separat anrop efter skrivningen:

| pid | slug | bilder |
|---|---|--:|
| `14aa1777` | `solcellslampa-180-cm-2-pack` | 4 |
| `1f14ab66` | `solcellslampa-195-cm-planteringskruka` | 6 |
| `c9ab8531` | `solcellslampa-182-cm-tva-klot` | 6 |
| `4ef7c2b4` | `solcellslampa-185-cm-tre-lyktor` | 5 |
| `ec8ab782` | `solcellslampa-189-cm-tre-glaskupor` | 6 |
| `db933c3c` | `solcellslampa-dimbar-tre-lyktor-rostfri` | 6 |
| `a6727ca5` | `solcellslampa-177-cm-tradgardslykta` | 5 |
| `9938574b` | `solcellslykta-129-cm-2-pack` | 5 |
| `6747b6c0` | `solcellslampa-160-cm-rostfri` | 6 |

`visible: true` på **både produkt och variant** på alla nio — en produkt som går
live med en osynlig variant syns men går inte att lägga i varukorgen, och det
syns inte i produktvyn. SKU och pris lästes tillbaka oförändrade på alla nio,
och ingen bild saknar alt-text.
