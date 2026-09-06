# Runda 73 — läget

Åtta Relaxsessel-utkast polerade och publicerade: Steg 1 → färgmätning →
grindar → mutationstest → kort → Wix-skrivning → SKU → bilder → kategori →
prisgrind → publicering → stämpling → live-grind. **Priserna är orörda.**

| id8 | slug | SKU | pris | färg (källan → skrivs) |
|---|---|---|--:|---|
| 969d9ec9 | `fatolj-tat-vav-ljusgra-135-grader` | `FP-fatolj-tat-vav-ljusgra` | 4 969 | Hellgrau → ljusgrå |
| b72f093d | `tv-fatolj-grabrun-gungande` | `FP-tv-fatolj-grabrun` | 4 479 | Hellbraun → **gråbrun** |
| 54cf1f44 | `reclinerfatolj-gra-150-kg` | `FP-reclinerfatolj-gra-150` | 3 919 | Hellgrau → **grå** |
| acb1f904 | `tv-fatolj-sidoficka-graddvit` | `FP-tv-fatolj-sidoficka` | 3 919 | Cremeweiß → gräddvit |
| e57125fb | `vaggnara-fatolj-brun-150-grader` | `FP-vaggnara-fatolj-brun-150` | 4 149 | Dunkelbraun → **brun** |
| b1e98da4 | `snurrfatolj-ljusgra-med-fotpall` | `FP-snurrfatolj-ljusgra` | 2 079 | Grau → **ljusgrå** |
| b67fdc2b | `vilfatolj-grabrun-med-fotpall` | `FP-vilfatolj-grabrun` | 2 579 | Braun → **gråbrun** |
| 7eee41b6 | `baddfatolj-65-cm-fem-lagen` | `FP-baddfatolj-65-cm-fem` | 1 969 | Grau → grå |

Prisgrinden grön på alla åtta (`las`-körning 1344–1351), stämplingen grön på
alla åtta (`stampla` 1352–1359), kategori `totalSuccesses: 1` per produkt,
kortet på position 3 med noll tomma alt-texter på alla åtta.

## ☠️ KÄLLANS FÄRGORD ÄR FEL PÅ FEM AV ÅTTA — och varje fel går åt samma håll

Runda 66 mätte att källan kallade en mellangrå fåtölj "Schwarz"; runda 69 att
två "Schwarz" låg 49 luminanssteg isär. Båda visade att ORDET ljuger. Det som
saknades var facit för vad HUSET menar med sina egna ord.

Det facit finns i katalogen. `farg.py` läser upp publicerade sidor där det
svenska ordet redan är låst och kalibrerar mot dem:

    grå 35–55 %   ·   gråbrun 40 % vid S 5 %   ·   brun 45–46 % vid S 18–22 %
    ljusgrå 58–63 %   ·   beige 77 %

**Varje av de fem felen pekar mot ett ord ett publicerat syskon redan äger.**
"Hellbraun" skrivet som beige hade krockat med `gungande-tv-fatolj-beige`;
"Braun" skrivet som brun hade legat i bandet `konstladerfatolj-brun-145-grader`
använder (S 18 %). En absolut skala hade inte sett det — bara kalibreringen mot
husets egna publicerade sidor gör skillnaden mätbar.

## ☠️ Angränsande artikelnummer är INGET släktskapsbevis

Måtten hittade tre familjer, artikelnumret avgjorde dem. Två av grupperna bär
GRANNBASER och är olika modeller:

| | `833-359` (b67fdc2b) | `833-360` (b1e98da4) |
|---|---|---|
| mått | 80 × 86 × 99 | 78 × 67 × 98 |
| vikt | 24 kg | 18 kg |
| fot | träkryss | rund metallfot |
| pall | med förvaringsfack | slät |

Bara SAMMA bas är ett bevis. Alt-texterna och kortrubrikerna säger därför
"kryssfot av trä" respektive "var sin runda fot" redan i hjältebilden, så en
kund som får de två sidorna bredvid varandra kan skilja dem åt.

## ☠️ Mutationstestet hittade ett hål grinden inte kunde se

Fotpallens maxlast är ett EGET och lägre tal på de två produkter som har en
lös pall. Men `MAXLAST` bär då BÅDA talen — annars fälls den mening som finns
just för att kunden inte ska sätta sig på pallen. Följden: en mutation som
skriver stolens 120 kg på pallen passerar maxlast-grinden orörd, för 120 står
i facit.

Grinden hade rätt och var ändå blind. Lagningen är `MASTE_STA`: "100 kg" måste
stå ORDAGRANT i texten. **Ett tal som är giltigt i två roller behöver en grind
på FÖREKOMSTEN, inte bara på värdet.**

## ☠️ En kortrubrik måste bäras av fotot SOM DET BLIR

`969d9ec9`s rubrik sa först "Tät möbelväv med synlig struktur". Kortet sprängde
215 kB-taket och bygget mjukade upp fotot 0,9 px — alltså suddade det bort
exakt det rubriken pekade på. Rubriken beskriver nu bredden och armstöden,
som blurren inte rör.

Bygget kan garantera värdet, etiketten och storleken. Det kan inte se att
dess EGEN uppmjukning motsäger rubriken — det gör bara ögon mot det färdiga
kortet.

## Fyra rättelser före skrivningen, alla fångade av grindarna

1. Tre "Tillverkaren anger/är uttrycklig…" — mot kunden är VI leverantören.
   Regeln är runda 53:s och grinden delas via `../grindar.py`.
2. "150° är den flataste vinkeln i sortimentet" — ett obelagt påstående om
   1 994 publicerade sidor. Avgränsat till "den här omgången".
3. Två tal om ANDRA produkter utan länk. `LAST_RE` läste dem som påståenden
   om den här produkten och fällde rätt; de är korshänvisningar nu.
4. Sex meta-beskrivningar över 160 tecken.

## Steg 4: bilderna

Fyrtio källbilder granskade. **Noll leverantörslogotyper, noll inbränd tysk
text** — till skillnad från runda 72, där en bild bar fyra tyska etiketter i
pixlarna. Alla fem positionerna används på alla åtta.

## Steg 5: tre påståenden källan gör som inte håller

1. ☠️ `b1e98da4` kallas **"Massagestuhl"** mitt i en mening om ryggens vred.
   Ingen motor, inga vibrationspunkter, inget elnät. Ordet är en
   klipp-och-klistra-rest. `lint.py` förbjuder `massage` rakt av i rundan.
2. `54cf1f44`s spec-tabell bär `90L` som upprätt bredd. Nittio är den
   LIGGANDE bredden; måttritningen säger 87. Ritningen är facit.
3. `acb1f904`s `96-106H` är två TILLSTÅND, inte ett intervall.

## ⚠️ Eget ärende: familjen 833-359 säljs under tre namnmönster

`vilfatolj-graddvit-med-fotpall`, `vilfatolj-morkgra-med-fotpall` och
`tv-fatolj-forvaringspall-145` — den sista är SVART (`833-359BK`) men bär
inget färgord alls i sitt namn, och står på `aosomSyncedQty: 0`. En kund som
jämför de fyra kan inte se vilken som är vilken.

## ⚠️ `bulk/categories/add-item` kräver `treeReference` i BODYN

Runda 72:s anrop dokumenterades som "ETT item och MÅNGA kategorier" — sant,
men ofullständigt. Utan `treeReference: {appNamespace: "@wix/stores"}` svarar
rutten `400 treeReference must not be empty`. Läsningen
(`categories/query`) tar den också.
