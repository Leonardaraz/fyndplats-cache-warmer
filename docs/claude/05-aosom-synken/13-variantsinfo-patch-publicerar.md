### ☠️ En `variantsInfo`-PATCH PUBLICERAR ett utkast

Uppmätt mot skarpa V3 2026-08-28 på ett osynligt Aosom-utkast: en PATCH med
`fieldMask: ["variantsInfo"]` och **oförändrat pris** tog produkten från
`visible:false` till `visible:true`. Fältmasken skyddar alltså inte synligheten —
Wix behandlar en variantskrivning som en publicering.

Konsekvensen var inte teoretisk. `updateV3VariantPrices` skickade inte med
`visible`, och `price-repair` filtrerar inte på synlighet. Med 2 700+ opolerade
tyska utkast i katalogen hade en enda prisreparation kunnat lägga ut dem på
sajten. Funktionen skickar nu alltid tillbaka `visible` oförändrad; saknas
fältet i svaret utelämnas det hellre än gissas. Fem tester i `v3-prices.test.ts`
låser det.

#### ☠️ VARIANTEN HAR ETT EGET `visible` — och 31 sidor gick inte att köpa (2026-09-06)

Regeln ovan gäller PRODUKTEN. Varje variant i `variantsInfo.variants[]` bär ett
eget `visible`, och en variantsInfo-PATCH som inte bär det nollställer det. Samma
fälla, en nivå ner — och den här riktningen är dyrare, för den syns inte i något
utkast: produkten ligger kvar publicerad.

Uppmätt på hela den publicerade katalogen (2 032 produkter, fyra slices, 100 %
täckning): **31 sidor var publicerade men oköpbara.** Noll delvis dolda.

```
produkt   visible: true            → sidan ligger ute, i sitemapen, indexerad
variant   visible: false           → butiken visar "Slutsåld"
Wix-lager quantity: 197, IN_STOCK  → varan finns
```

Butiken behandlar en produkt utan en enda synlig variant som slutsåld: sidan
renderade *"Varan är tillfälligt slut hos oss"* och JSON-LD `OutOfStock` medan
lagret var fullt. Alla 31 var fåtöljer och madrasser ur poleringsrundor.

⚠️ **Och det är INTE repots kod som tappar fältet — båda skrivarna är
kontrollerade och gör rätt.** `createProduct` sätter `visible: v.visible ?? true`,
och `updateV3VariantPrices` muterar varianterna från sin EGEN GET, så fältet
följer med. Defekten sitter i poleringens SKU-steg, som skrivs **för hand från
chatten**: mappningsradens SKU går via `/api/admin/mapping`, men Wix-variantens
SKU har ingen egen rutt, så den PATCHas med ett handbyggt variantobjekt. Utelämnar
man `visible` där defaultar Wix det till `false`.

☠️ **Regeln för den som skriver `variantsInfo` för hand: bygg aldrig
variantobjektet från grunden.** Läs produkten, ta variantobjektet som det står
och ändra bara fältet du menar — precis som `updateV3VariantPrices` gör. Ett
handbyggt objekt tappar tyst varje fält du inte råkade tänka på, och `visible`
är det dyraste av dem.

☠️ **Och produktens `inventory.availabilityStatus` sa `IN_STOCK` hela tiden.**
Wix egen produktnivå vet ingenting om det här; frågar man den ser katalogen
frisk ut. Det enda som avslöjar det är `variantsInfo.variants[].visible` —
och det fältet finns **inte i sökprojektionen**, så en katalogskanning kräver
en GET per produkt. 2 032 GETs ryms inte i ExecuteWixAPI:s 60 sekunder; kör i
slices om ~500.

⚠️ **Två mätfällor på vägen dit, båda värda att komma ihåg.** Butikens ISR gör
att en enstaka hämtning kan servera en gammal rendering — måttet blev
trovärdigt först när `age` var 11 sekunder och sidan FORTFARANDE sa
`OutOfStock`. Och `brodtext`-svepet strippar taggar, så texten "Slutsåld" syns
även när den ligger i dold markup; det som faktiskt skiljer är JSON-LD:ns
`availability`.

Lagningen är att skriva tillbaka `visible: true` på varianten med produktens
`visible` medskickad explicit. Verifierat per rad: 0 → 1 synlig variant,
produktens synlighet oförändrad, **pris och SKU orörda på alla 31**.

#### ☠️ Och en FLERVARIANTSPRODUKT kräver att `options` följer med (2026-09-13)

`updateV3VariantPrices` har fungerat i månader och föll ändå på 56 av 382
produkter första gången den mötte AE-halvan:

```
428 MISSING_OPTIONS_ON_UPDATE_VARIANTS
"Missing product options. Options must be provided for variants"
```

Alla 56 var flervariantsprodukter — bland dem halterneck-linnet med 29 färger.
De enkelvarianta gick igenom.

☠️ **Skälet att felet aldrig setts är husets genomgående asymmetri, och den
gäller mer kod än den här funktionen.** `updateV3VariantPrices` hade bara två
anropare, Aosom-synken och prisreparationen, och **en Aosom-rad ÄR en artikel
med EN variant**. Funktionen var alltså aldrig prövad på det fall där den inte
fungerar. Samma dag föll `jamforelsePris` på exakt samma sak åt andra hållet:
den avvisar varje produkt med `variantCount > 1`, ett gratis bälte-och-hängslen
för Aosom och fel för AE.

**Regeln: kod som bara mötts av Aosom-halvan bär antaganden ingen sett.**
AE-halvan har färg- och storleksvarianter; Aosom-halvan har det aldrig. Innan
en befintlig funktion släpps på AE-rader: fråga vad den gör med fler än en
variant, och mät det.

☠️ **OCH OPTIONS MÅSTE STÅ I FÄLTMASKEN — min första fix var en no-op.** Den
lade dem i KROPPEN men utelämnade dem ur masken, med motiveringen att Wix
behöver options för att VALIDERA varianterna och att en skrivning kunde tappa
det projektionen råkat utelämna. Mätningen var entydig: exakt samma produkter
föll på exakt samma 428. **En fältmask-PATCH läser bara det som står i masken**
— allt annat i kroppen ignoreras, så Wix såg dem aldrig. Resonemanget var
rimligt och fel, och det som avgjorde var att felen var IDENTISKA, inte färre.

✅ **Och farhågan är mätt bort, inte bortresonerad (2026-09-13).** Round-trippen
prövades på en 75-variantsprodukt genom att skriva tillbaka EXAKT samma priser —
samma medicin som `wix-inventory-probe`: en skrivning vars enda ändring är
ingen ändring.

| | före | efter |
|---|---:|---:|
| revision | 24 | **25** (skrivningen tog) |
| optioner | 2 (Färg, Storlek) | 2 (Färg, Storlek) |
| val med `linkedMedia` | 15 | **15** |
| val med `altText` | 15 | **15** |
| varianter / med SKU / synliga | 75 / 75 / 75 | **75 / 75 / 75** |

Noll avvikelser. Samma produkt mättes en gång till efter en SKARP höjning
(499 → 549): fortfarande noll avvikelser mot samma facit. Strukturen tas
oförändrad ur produktens EGEN GET, som redan går med
`?fields=VARIANT_OPTION_CHOICE_NAMES` — projektionen vars hela syfte är att
bära valens namn. Det är samma round-trip-princip som `visible`, inte ett
handbyggt objekt, och det är skillnaden mot fällan i poleringens SKU-steg.
