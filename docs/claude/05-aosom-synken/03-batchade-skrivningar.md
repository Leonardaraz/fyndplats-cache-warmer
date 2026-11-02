### ✅ Skrivningarna är batchade sedan 2026-09-04 — spärren är irrelevant, inte uthärdlig

Raden ovan stod länge som "kvar som strukturellt": `bulkUpdateInventoryQuantities`
är ett BULK-API som tar en array, men synken anropade den med EN produkt i taget.
Loopen går nu i **tuggor om 50 produkter** (`CHUNK_PRODUKTER`): en läsning och
en skrivning per tugga i stället för två anrop per produkt.

| | före | efter |
|---|---:|---:|
| Wix-anrop per svep (~4 500 mappningar) | ~1 800 | **~180** |
| Anrop i det uppmätta 429-fönstret | 2 095 → 1 190 fel | ryms med marginal |

☠️ **Hela ombyggnaden vilar på EN mätning: bulk-svaret bär radens id.** Uppmätt
mot skarpa Wix, båda utfallen:

```
fel:      {"itemMetadata":{"id":"2f3b…","originalIndex":0,"success":false,
           "error":{"code":"INVALID_REVISION","description":"Outdated revision…"}}}
framgång: {"itemMetadata":{"id":"2f3b…","originalIndex":0,"success":true}}
bulkActionMetadata: {totalSuccesses, totalFailures, undetailedFailures}
```

Attributionen behöver alltså inte lita på ORDNINGEN. Det är avgörande, för
*"Wix före mappningen"* är en garanti **per produkt**: hade svaret varit
aggregerat kunde en enda revisionskonflikt i ett anrop med femtio produkter
antingen ha fällt hela tuggan eller bokförts på fel produkt — tyst, samma klass
som `sku`-förväxlingen. Mätrutten är `/api/admin/wix-inventory-probe`
(workflow-lägena `api-matning` och `api-matning-skriv`); den skriver ingenting
utan `?write=1`, och det den då skriver är samma saldo tillbaka.

Uppmätt samtidigt, och därför inte gissat: `$in` på `productId` fungerar (fem id
gav fem poster mot ett för ett enskilt), läsningens sida är **100**, och
`bulk/inventory-items/update` svarar `200` med ett individuellt utfall per rad
på **20, 50 och 100 rader**. 101 är oprövat — därav `BATCH_LAGERRADER = 100`.

#### ☠️ Och sida TVÅ av samma läsning gick aldrig att hämta (2026-09-13)

Raden ovan mäter sidans STORLEK. Ingen mätte vad som händer när den inte
räcker. `queryInventoryItemsByProductIds` skickade `filter` igen tillsammans
med markören, och `inventory-items/query` avvisar det:

```
400 INVALID_CURSOR: "Sort or filter can not be specified together with cursor"
```

Uppmätt i båda riktningarna på skarpa Wix, SAMMA markör:

| sida två skickad med | svar |
|---|---|
| `filter` + markör | **400 INVALID_CURSOR** |
| bara markören | **200**, och fortsatte på RÄTT produkt |

Att sida två fortsatte på rätt produkt är beviset att **markören bär frågan
själv** — filtret ligger inuti den (base64:en innehåller ordagrant
`productId` och id:t). Att skicka det igen är alltså inte bara onödigt, det
är det som fäller anropet.

⚠️ **Felet var i drift, inte teoretiskt.** Halterneck-linnet `7fce5f84` har
29 färger × storlekar, alltså fler än 100 lagerrader. Synken loggade samma
400 på VARJE körning varannan timme — den produktens lager gick aldrig att
läsa, medan rutten svarade 200 och körningen såg frisk ut. Nionde gången
samma familj.

☠️ **Och testsviten var grön hela tiden.** Pagineringstestet kollar att
markören FLYTTAS, inte att kroppen går att skicka — en grind som mäter fel
sak. Det nya testet fäller när buggen återinförs, och bara det.

☠️ **Formen är INTE gemensam för Wix — städa inte "samma fel" överallt.**
`ecom/v1/orders/search` tar emot `filter` + `sort` + markör utan att klaga
(uppmätt samma dag: sida två gav 200 och rätt nästa order). `fetchOrders`
står därför orörd med flit. Två API-familjer, samma kroppsform, olika svar —
precis som `getProductMedia` MÅSTE begära `MEDIA_ITEMS_INFO` medan
produktpriset kommer med oombedt. **Mät per endpoint.**

**Sex egenskaper som inte ska tas bort:**

1. ☠️ **En mappning skrivs bara för rader Wix uttryckligen bekräftat.**
   `tolkaBulkUtfall` har tre konservativa regler, alla åt samma håll: en
   SKICKAD rad Wix inte nämner är inte bevisat skriven; `undetailedFailures`
   gör HELA anropet oadresserbart; saknat id härleds ur `originalIndex` mot det
   vi faktiskt skickade. Hellre en skrivning för mycket nästa körning än en
   mappning som ljuger.
2. ☠️ **En produkt med FLERA lagerrader skrivs bara om ALLA går igenom.**
   Halvskrivet lager är svårare att upptäcka än orört.
3. ☠️ **`limit` är EXAKT — tuggan kapas mot det som återstår**
   (`min(CHUNK, limit - skrivna)`). En tugga med N produkter kan aldrig ge fler
   än N skrivningar. Utan kapningen hade `limit: 1` skrivit hela första tuggan,
   och `limit` finns för att hålla rutten innanför sina 300 sekunder. Ett test
   på markören fångade just det.
4. ☠️ **`utanLagerrader` räknas, och de produkterna stämplas INTE.** Den gamla
   `setStock` svarade `if (poster.length === 0) return;` — inget fel, ingen
   räknare — och loopen bokförde ändå produkten som synkad, för alltid. Nionde
   gången samma klass: ett svar utan fel är inget kvitto.
5. **Torrkörningen LÄSER lagret.** Den ska säga sanningen om vad en skarp
   körning skulle göra, och `utanLagerrader` går inte att veta utan att titta.
   Läsningar ändrar ingenting.
6. **Pacingen ligger kvar** trots att anropen är ~40 i stället för ~2 000. Den
   kostar fem sekunder på ett helt svep, och den är billigare än att mäta upp
   var den nya gränsen går.

**Verifierat i drift 2026-09-04**, i den ordning som gör talen meningsfulla:

| körning | granskade | lager | priser | fel | varv | tid |
|---|---:|---:|---:|---:|---:|---:|
| torrkörning FÖRE | 4 542 | 676 (skulle) | 0 | 0 | 2 | 2:52 |
| skarpt lagersvep | 4 542 | **677** | — | **0** | 2 | 1:41 |
| torrkörning EFTER | 4 542 | **0** | **0** | **0** | **1** | 1:34 |

Sista raden är kvittot: efter ETT skarpt svep vill ingenting skrivas om. Jämför
med samma katalog 2026-09-02, före batchningen:

| | lager skrivna | fel |
|---|---:|---:|
| skarpt svep FÖRE pacing | 905 | **1 190** |
| skarpt svep EFTER pacing | 1 110 | 1 |
| **skarpt svep, batchat** | **677** | **0** |

`utanLagerrader` är **0** — varenda mappning har lagerrader i Wix, alltså finns
ingen föräldralös katalogdel som tyst bokfördes som synkad av den gamla vägen.

⚠️ **En ny mätning, ingen åtgärd: `lagerDrift`.** Läsningen ser numera butikens
FAKTISKA saldo, och räknar hur många produkter där det skiljer sig från det
mappningen tror att den skrev. Det är exakt samma frågeställning som
`jamforelsePris` byggdes för på PRISET — och där kostade förväxlingen en månad
och tjugo rader. Lagret triggas fortfarande på mappningens tal, alltså har det
samma teoretiska hål. Talet är medvetet bara **mätt**: att byta facit vore en
beteendeändring med hela katalogen som blast-radie, samma dag som loopen byggs
om. Mät först, som huset gjorde med priserna.

☠️ **Och mätningen är gjord: `lagerDrift` är 1 av 4 542** (2026-09-04, samma
tal i tre körningar i rad). Lagret har alltså INTE det hål priserna hade — där
var svaret tjugo rader. Att göra butiken till facit även för lagret är därmed
inte akut, och den enda drivande raden rättas av nästa körning som rör den.
Talet står i loggraden och i workflow-summeringen; går det upp är det ett
besked, inte brus. **Det höll i fyra veckor — se nästa avsnitt.**
