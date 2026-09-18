# Runda N11 — sju produkter 1 089–1 099 kr

Elfte rundan i urvalet *billigast uppåt bland de produkter där vi är billigare
än dealproffsen*. Alla sju är Aosom-utkast som publicerats, och alla sju har
fått ett eget Fyndplats-kort sist i bildlistan.

| kort | produkt | pris |
| :-- | :-- | --: |
| `ffaa3fad` | Runt trädgårdsbord i gjutaluminium, vintagemönster, 60 cm | 1 089 kr |
| `0136e7d9` | Förvaringstorn med sex lådor för barnrummet, blå | 1 099 kr |
| `17c747cb` | Stapelbara pallar 4-pack, grå sits, ben i böjträ | 1 099 kr |
| `227fae7d` | Konstgjort bambuträd 180 cm i svart kruka | 1 099 kr |
| `2bc98714` | Skobänk i bambu med stoppad sits och öppen hylla | 1 099 kr |
| `56b32f2f` | Soptunna i rostfritt stål med två 20-litersfack | 1 099 kr |
| `5f66bf37` | Vibrationsplatta med 120 hastigheter och motståndsband | 1 099 kr |

## Kvittokedjan

Varje led är MÄTT, inte antaget. Ett svar utan fel är inget kvitto.

| led | utfall |
| :-- | :-- |
| Källtexterna hämtade ordagrant | 7 av 7 byte-exakta (`kvitto-kalla.json`) — en U+202F-mellanslagsdefekt hittad och rättad i `2bc98714` |
| Kontaktark FÖRE brödtext | 35 bilder granskade, två fynd ingen siffergrind kan se (§3 nedan) |
| `gate.py` | 0 fynd |
| `gate-seo.py` · `gate-alt.py` · `gate-axel.py` | 0 · 0 i 32 · 0 axelfel (två `axellos`-produkter utan positionsfacit, se nedan) |
| `gate-superlativ.py` · `gate-lankar.py` · `gate-sku.py` | 0 · 0 · 0 (längst 31 av 40 tecken) |
| `gate-kort.py` | 0 fynd i 7 |
| Kortens md5 i BÅDA ändarna | 7 av 7 byte-identiska |
| Steg 1 — text/namn/slug/SEO/synlighet | 7 av 7 skrivna, kontrollsumman passerade |
| Steg 2 — media ENSAMT, kortet sist | 7 av 7 skrivna, alt-textgrinden passerade |
| Steg 3 — kategorier | 7 av 7 kopplingar (BulkAddItemToCategories, `bulkActionMetadata` facit) |
| Steg 4 — `variantsInfo` SIST och ENSAMT | 7 av 7, svensk SKU skriven, variantobjektet round-trippat oförändrat utom `sku` |
| Stämpling via `polish-mapping.yml` | 7 av 7 gröna, körda med uttryckligt `ref: main` |
| Separat återläsning en stund senare | **7 av 7 LIKA** mot filens FNV-facit (plainDescription), media-ordning, SKU och kategori 7/7 stämmer |
| `livegrind.py` mot de publicerade sidorna | **5 av 7 REN**, orddiff 0 på alla sju |

## De två slutsålda: äkta lagerbesked, inte en textdefekt

`ffaa3fad` (trädgårdsbordet) och `227fae7d` (bambuträdet) flaggades av
`livegrind.py` som SLUTSÅLD — sidorna renderar OutOfStock trots orddiff 0.
Grinden namnger själv två möjliga orsaker och säger uttryckligen "läs lagret
innan du lagar något".

Kontrollerat direkt i Wix: båda produkternas `visible: true`, båda
varianternas `visible: true`, men `inventoryStatus.inStock: false`. Det är
alltså inte den dokumenterade variant-visible-buggen — varianterna är
synliga, de är genuint slut hos Aosom just nu. Aosom-synken (var 6:e timme)
räknar om saldot mot feeden av sig själv; ingenting i den här rundans
skrivning orsakade eller behöver rätta det. Priset stämmer på båda, så det
är heller ingen `slutsald`-prisgrindsträff att vänta på — bara ett
lagerbesked som läker sig självt.

## Två fynd som bara ett öga på fotot kunde se — och som stannade i backloggen

Kontaktarken byggdes före brödtexten, enligt regeln från runda J1. Båda
ledde till att kandidaten uteslöts helt, inte till en texträttelse:

- ☠️ **`4f7c87ea` (fotbollsmål)** — "SPORTNOW" tryckt direkt på den övre
  tvärstången i alla fem bilder (böjer sig med rörets rundning, ändrar
  perspektiv med kameravinkeln — inte en plan overlay) och en svart
  "SPORTNOW"-lapp fastsydd mitt i nätet. Fysiska märken på PRODUKTEN, och
  husregeln säger att sådana ALDRIG beskärs bort. Samma klass som #195
  (VINSETTO på gamingstolarna). Ny backloggpost.
- ☠️ **`4fb98338` (hundmatstation)** — en oval "PawHut"-bricka monterad på
  skåpets främre vänstra hörn, synlig i fyra av fem bilder. Ett fysiskt
  namnskylt, inte en vattenstämpel — PawHut står redan på husets
  textstrippningslista, men en SKRUVAD bricka går inte att ta bort utan att
  redigera bilden. Ny backloggpost.

Båda ersattes (av `56b32f2f` och `5f66bf37`), och båda ersättningarna
genomgick samma fulla dubblettskärm som originalsjuan innan de godkändes.

## Ersättningsrundan hittade två till interna dubbletter

De två första ersättningskandidaterna visade sig själva vara dubbletter av
redan publicerade sidor, och uteslöts i sin tur:

- `7adde575` (shoppingvagn) matchar publicerade `d3fd579b` exakt (46 l
  volym, 25 kg maxlast, samma "3-i-1"-beskrivning).
- `636e14f1` (reptilterrarium) matchar TVÅ publicerade terrarier
  (`b1b782c5`, `ef9d5b47`) vid identiska 50×30×35 cm.

Detta validerar varför skärmen körs på varje ersättningskandidat och inte
bara på originalbatchen — se `DUBBLETTSKARMEN.md` §4 för fullständig
genomgång.

## Den slutgiltiga sjuan: trippelsvept mot hela den publicerade katalogen

Samtliga sju slutgiltiga kandidater kontrollerades mot samtliga 2 867
publicerade produkter, i två separata mönster efter måtttyp: tretalsformen
(`AxBxC cm`) för fem produkter och diameterformen (`ØA x B cm`, kräver att
båda talen står IHOP) för de två resterande. Mönstret verifierades mot fyra
riktiga publicerade sidor innan svepet kördes (multiplikationstecken, inga
L/B/H-bokstäver — skiljer sig helt från källtextens egna `60L x 60B x 53H`).

**Facit: 0 av 7 kandidater krockar med den publicerade katalogen**, och
ingen intern kollision är möjlig inom sjuan själv (sju helt olika
produktkategorier).

## En verklig kodbugg återupptäcktes och lagades under skärmningen

`products/search` med `cursorPaging` på requestens TOPPNIVÅ (i stället för
inuti `search`-objektet) gav samma första 100 produkter om och om igen —
exakt #191-bugen, återupptäckt här eftersom N11 var första gången den här
sessionen byggde en helkatalog-svepare från grunden i stället för att
återanvända en tidigare rundas skript. Fixat och verifierat med ett
tvåsidigt testanrop (noll överlapp mellan sida 1 och 2) innan några riktiga
svep kördes.

## `axelfacit.json`: två produkter utan positionsfacit, av olika skäl

`ffaa3fad` och `227fae7d` kom ut `axellos` ur `bygg-axelfacit.py`. För
`227fae7d` är det strukturellt korrekt — källan har ingen enskild
totalmåttrad. För `ffaa3fad` är det ett mindre, redan existerande hål i den
delade generatorns `ETIKETT`-regex (den känner inte igen ett naket
"Abmessungen:" utan "Gesamt-"-prefix). Bedömt som lågrisk (min egen text är
oberoende sifferverifierad av `gate.py`, och `axellos` degraderar tyst i
stället för att påstå fel) och avsiktligt INTE lagat mitt i rundan, givet
den delade skriptens krav på att kunna regenerera alla tidigare rundor
byte-identiskt.

## Uteslutna utan diskussion: SPORTNOW/PawHut hölls till foton, inte till namn

Ingen av de nio ursprungliga kandidaterna uteslöts på namn ensamt utom
`17c253d6` (namnmatch mot #285-klustret, aldrig fullt bildverifierad eftersom
den redan var diskvalificerad). De två varumärkesuteslutningarna byggde
uteslutande på att fysiskt se märket i bilden, i linje med regeln "titta på
bilderna FÖRE texten".
