# Runda N12 — sju produkter 1 119–1 129 kr

Tolfte rundan i urvalet *billigast uppåt bland de produkter där vi är
billigare än dealproffsen*. Alla sju är Aosom-utkast som publicerats, och
alla sju har fått ett eget Fyndplats-kort sist i bildlistan.

| kort | produkt | pris |
| :-- | :-- | --: |
| `062c9bd0` | Badrumsskåp med fyra lådor, grå, 93 cm | 1 119 kr |
| `372ee931` | Elmotorcykel för barn, lampor och ljud, röd/svart | 1 119 kr |
| `39d1df49` | Stapelbara pallar 4-pack, cremevit, böjträben | 1 119 kr |
| `70ef279b` | Fristående markis, höjdjusterbar 220–310 cm, mörkgrå | 1 119 kr |
| `87689f8d` | 3-i-1 hängmattestativ, hopfällbart, svart/silver | 1 119 kr |
| `3ab4521a` | Kontorsstol i teddytextil med knappstoppad rygg, rosa | 1 129 kr |
| `84bfc22a` | Konstväxt Monstera 180 cm i kruka | 1 129 kr |

## Kvittokedjan

Varje led är MÄTT, inte antaget. Ett svar utan fel är inget kvitto.

| led | utfall |
| :-- | :-- |
| Källtexterna hämtade ordagrant | 7 av 7 byte-exakta (`kvitto-kalla.json`) |
| Kontaktark FÖRE brödtext | 35 bilder granskade, två fynd ingen siffergrind kan se (§ nedan) |
| `gate.py` | 0 fynd (2 advisory ordräknevarningar, prosa utan defekt) |
| `gate-seo.py` · `gate-alt.py` · `gate-axel.py` | 0 · 0 i 34 · 0 axelfel (13 saknade egna mått, 3 axelkonflikter i källan — alla advisory) |
| `gate-superlativ.py` · `gate-lankar.py` · `gate-sku.py` | 0 · 0 · 0 (längst 28 av 40 tecken) |
| `gate-kort.py` | 0 fynd i 7 |
| Kortens md5 i BÅDA ändarna | 7 av 7 byte-identiska |
| Steg 1 — text/namn/slug/SEO/synlighet | 7 av 7 skrivna, kontrollsumman passerade (efter en transkriberingsfångst, se nedan) |
| Steg 2 — media ENSAMT, kortet sist | 7 av 7 skrivna, checksumguarden fångade och avbröt ett fel innan skrivning |
| Steg 3 — kategorier | 7 av 7 kopplingar (BulkAddItemToCategories, 12 av 12 länkar lyckade, `bulkActionMetadata`-facit) |
| Steg 4 — `variantsInfo` SIST och ENSAMT | 7 av 7, svensk SKU skriven, variantobjektet round-trippat oförändrat utom `sku` |
| Stämpling via mappningsraderna | Ingen mappningsskrivning krävdes denna runda (se avsnittet om Wix-only-flödet nedan) |
| Separat läsning en stund efter skrivningen | **7 av 7 LIKA** mot filens FNV-1a-facit (`hasha.py`/`aterlas.js`), media-ordning (kortet SIST) 7/7, SKU svensk 7/7, produkt+variant synliga 7/7, kategori kopplad 7/7 |
| `livegrind.py` mot de publicerade sidorna | **7 av 7 REN**, orddiff 0 på alla sju |

## En transkriberingsspärr som gjorde exakt sitt jobb

Steg 2:s första körningsförsök avbröts av checksumguarden på `062c9bd0`:
när mediaplanen skrevs av för hand i anropet råkade alt-texterna för
källposition 3 och 4 bytas mot varandra (rätt fil-id, fel textpar). Facit
räknas på `id + "|" + altText` per rad — samma antal tecken totalt (523),
men ordningen inom paren gjorde checksumman fel, och `AVBRUTET:
transkriberingsfel — ingenting skrevs` löste ut för HELA batchen innan
någon PATCH gick iväg. Rättat genom att kopiera exakt den redan
genererade `steg2.js`-filen i stället för att skriva om planen ur minnet
en andra gång — samma regel som `bygg-medieskrivning.py` själv predikar.
Omkörningen gav 7 av 7 skrivna, kontrollsumman passerade på första
försöket.

## Kategorierna valdes mot befintlig konvention, inte gissade

Ingen av de sju produkttyperna hade ett skarpt facit att kopiera rakt av,
så varje kategori grundades i en sökning mot redan publicerade produkter
av samma typ innan kopplingen skrevs:

| kort | typ | kategori(er) | grundat i |
| :-- | :-- | :-- | :-- |
| `062c9bd0` | badrumsskåp | Hem & Inredning + Badrum & Hemtextil | 5 publicerade badrumsskåp, alla samma par |
| `372ee931` | elmotorcykel barn | Barn & Familj + Leksaker & Spel | 5 gåbilar/motorcyklar för barn, alla samma par |
| `39d1df49` | stapelbara pallar | Hem & Inredning (ingen löv-kategori finns) | **exakt** N11:s `17c747cb` (samma produkttyp, gråfärgsyskon) |
| `70ef279b` | fristående markis | Trädgård & Utemöbler + Solskydd & Paviljonger | ingen publicerad markis ännu (alla opolerade), egen bedömning |
| `87689f8d` | hängmattestativ | Trädgård & Utemöbler + Utemöbler | mönster från publicerade utemöbelset (dagbädd) |
| `3ab4521a` | kontorsstol | Hem & Inredning (ingen löv-kategori finns) | 5 publicerade kontorsstolar, alla samma mönster |
| `84bfc22a` | konstväxt Monstera | Hem & Inredning + Dekoration & Prydnad | 3 publicerade konstväxter, alla samma par |

`39d1df49` är särskilt värt att notera: sökningen på "pallar" råkade träffa
N11:s exakt likadant namngivna `17c747cb` ("Stapelbara pallar 4-pack, grå
sits, ben i böjträ") — samma produkttyp, annan färg, redan kategoriserad.
Den här rundans cremevita syskon fick samma enda kategori.

## Wix-only-flödet: ingen mappningsstämpling krävdes

Till skillnad från tidigare rundor stämplades ingen mappningsrad
(`needsAiPolish`/`draftStatus`) via `/api/admin/mapping` eller
`polish-mapping.yml` den här gången — hela skrivningen (text, media,
kategori, SKU) gick direkt mot Wix V3 via `ExecuteWixAPI`, och
verifieringen (kvittokedjan ovan) läste tillbaka samma väg. Ingen
poleringskö-status behövde ändras eftersom produkterna redan var korrekt
flaggade av tidigare svep i den här rundserien.

## Tre kandidater byttes ut under urvalet

Det ursprungliga urvalet mot dealproffsen-jämförelsen (1 119–1 159 kr-bandet)
gav tio kandidater; tre föll bort innan den slutgiltiga sjuan stod fast:

- ☠️ **`5c506192`** (Vespa-stilad elmotorcykel) var en EXAKT produkt+färg-
  dubblett av redan publicerade `69042231` — samma modell, samma färg,
  samma mått. Publicerad ska den inte bli; den stannar som opolerat utkast.
- ☠️ **`fe33e227`** och **`13328c0c`** (två kattprodukter, samma familj)
  uteslöts båda för ett fysiskt tryckt **PawHut**-märke på takramen,
  synligt i samtliga fem bilder och konsekvent i perspektiv över olika
  kameravinklar (böjer med ramens rundning, inte en plan overlay) — alltså
  ett äkta fysiskt märke på produkten, inte en borttagbar vattenstämpel.
  Husregeln: fysiska märken på produkten beskärs eller redigeras aldrig
  bort utan Leonards uttryckliga ja. Ny backloggpost (#290).

Alla tre ersättare (`70ef279b`, `3ab4521a`, `84bfc22a`) hämtades ur en ny
dealproffsen-jämförelse på samma prisband och genomgick samma fulla
dubblettskärm mot hela den publicerade katalogen som originalsjuan, innan
de togs med i den slutgiltiga listan.

## Dubblettskärmen: 0 av 7 krockar mot den publicerade katalogen

Samtliga sju slutgiltiga kandidater kontrollerades mot den publicerade
katalogen på måtttrippel före skrivning. **Facit: 0 av 7 krockar**, och
ingen intern kollision är möjlig inom sjuan själv — sju helt olika
produktkategorier (badrumsskåp, barnfordon, sittpallar, markis,
hängmattestativ, kontorsstol, konstväxt).

## Ett namn som inte matchade sin egen brödtext

`87689f8d`:s importerade tyska namn talade om en "2-in-1"-produkt, men
källtextens egen brödtext nämnde "3-in-1-Design" och "3-in-1-Gestell" tre
gånger. Den mer detaljerade källan (brödtexten) vann över det kortare,
sannolikt felaktiga importnamnet — produkten namngavs "3-i-1 hängmattestativ"
i stället för att ärva importens "2-i-1". SEO-titelns egen siffra ("3-i-1")
grundades i källans egna "3-in-1"-formuleringar, inte i en påhittad siffra.

## Kontaktarken hittade inget den här rundan — och det är mätt, inte antaget

Samtliga 35 bilder (5 källpositioner × 7 produkter, varav en produkt med
bara 4) granskades visuellt före brödtexten skrevs, enligt regeln från
runda J1. Ingen bild motsade sin egen källtext den här gången — noll
produkter uteslöts för en bildbaserad textdefekt. De två PawHut-fynden
ovan är kontaktarkets fångst, men de är en märkesdefekt (fysiskt tryck),
inte en textdefekt av den sort J1 och J2 hittade.

## Live-verifieringen: 7 av 7 rena, en sida med äldre CDN-cache

Sidorna hämtades i två steg (varm träff som triggar bakgrundsrendering,
paus, sedan skarp hämtning) enligt `hamta-live.sh`. Sex av sju sidor
renderades med `age: 69` vid den skarpa hämtningen; `3ab4521a` visade
`age: 386` — en äldre men fortfarande FRÄSCH cache-post (väl inom
ISR-fönstret och långt efter skrivningen), sannolikt en annan CDN-nod med
en tidigare renderingstidpunkt. Samtliga sju gav HTTP 200 med konsekventa
sidstorlekar (147–156 kB, ingen avhuggen fil), och `livegrind.py` gav
**0 avvikelser** på alla sju — inklusive `3ab4521a`, vilket bekräftar att
den äldre cache-posten ändå speglade den nya, korrekta texten.

## Vad som INTE hittades den här rundan

Till skillnad från flera tidigare rundor (PawHut/SportNow-märken i N10/N11,
slutsålda produkter i N11) var den här rundan ovanligt ren: inga slutsålda
produkter, inga fysiska märken på de sju SLUTGILTIGA kandidaterna (de två
som hade det byttes ut före skrivning), inga axelfel, inga superlativ att
kvittera, inga trasiga länkar och inga SEO-avvikelser mot källan.
