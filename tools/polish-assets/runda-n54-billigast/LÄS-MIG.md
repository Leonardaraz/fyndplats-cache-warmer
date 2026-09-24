# Runda N54 — femton produkter för 769–779 kr

Femton Aosom-utkast polerade och publicerade, billigast först utan
prisjämförelse, på samma arbetssätt som N45–N53. Rundan började med N53:s
reserv, vedstället `f267fdc4`, och tog sedan de fjorton kandidater på 779 kr
som dubblettskärmen släppte igenom. Ingen kandidat byttes ut.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| f267fdc4 | Vedställ 0,6 m³ med vattentätt överdrag – 200 cm långt, bär 200 kg | FP-vedstall-overdrag-200 | 769 kr | 43 |
| 0773ceb6 | Sensorsoptunna 50 liter i rostfritt stål – smal, med lock som stängs mjukt | FP-sensorsoptunna-50-rostfri | 779 kr | 197 |
| 0ad9c123 | Golvspegel i vitt, 148 cm hög – helkroppsspegel med två lutningslägen | FP-golvspegel-helkropp-vit | 779 kr | 88 |
| 1884a543 | Pedaltränare för armar och ben – träna sittande, display och steglöst motstånd | FP-pedaltranare-armar-ben | 779 kr | 120 |
| 2f31a1d9 | Båglampa med vit kupa och marmorfot – 180 cm, med fotbrytare | FP-baglampa-marmorfot-vit | 779 kr | 167 |
| 383d8de2 | Fotpall i mörkgrå chenille med svarta stålben – 45 × 41 × 38 cm, bär 120 kg | FP-fotpall-chenille-morkgra | 779 kr | 140 |
| 403dfd8d | Elektrisk fyrhjuling för barn 18–36 månader – 6 V, 2,5 km/h, framåt och bakåt | FP-elfyrhjuling-barn-bla | 779 kr | 82 |
| 50adf7ed | Tre växtpiedestaler i svart stål med skiva i träimitation – 50, 70 och 90 cm | FP-vaxtpiedestal-3-set-svart | 779 kr | 99 |
| 71341341 | Vit bokhylla med åtta öppna fack – 74,3 × 24 × 80 cm, står upp eller ligger ned | FP-bokhylla-8-fack-vit | 779 kr | 45 |
| 916d2e9f | Leksaksmotor att reparera – hjullastare med 63 delar, ljus, ljud och dimeffekt | FP-leksaksmotor-hjullastare | 779 kr | 197 |
| b281ec33 | Aktivitetstavla för väggen formad som en larv – sju lekar, 108 cm lång | FP-aktivitetstavla-vagg-larv | 779 kr | 143 |
| d2fb42b1 | Knästol med gungande ram i björk – grå klädsel, för skrivbord på 75–90 cm | FP-knastol-bjork-gra | 779 kr | 176 |
| d444fbae | Konstgjord fiolfikus 150 cm i vit kruka – stammar av trä, formbara grenar | FP-konstfikus-fiol-150 | 779 kr | 101 |
| f3d0cde9 | Elektronisk darttavla – 27 spel, upp till 16 spelare, sex pilar och nätadapter | FP-darttavla-elektronisk-27 | 779 kr | 145 |
| fa0c30ac | Två konstgjorda eukalyptusklot i vita krukor – 65 cm, för inne och ute | FP-eukalyptusklot-2-set-65 | 779 kr | 61 |

**Inget pris är rört.** Alla 15 `las`-körningar (4304–4318) gick gröna,
alltså stämde prisgrinden på varje rad. Källtexterna, bild-id och variant-id
lästes i Wix med artikelnumren redigerade i själva anropet och togs ur
sessionens logg med ett skript, och steg 4:s färska läsning gav samma
variant-id på alla 15. Inget skrevs av för hand.

## Bilder före text

Kontaktarken och högpassarken lästes före texten. En bild ströks, och sju
gånger stämde källan inte med sig själv eller med bilderna. Så här valde
texten:

- Bokhyllan har åtta fack enligt källans inledning, namnet och bilderna, men
  en punkt i källans lista säger fem. Texten säger åtta.
- Leksaksmotorn kallas grävmaskin i källan, och namnet säger 68 delar.
  Bilderna visar en hjullastare med skopa och *DOZER* på grillen, och
  källtexten räknar 63 delar och 4 verktyg. Texten säger hjullastare, 63
  delar och 4 verktyg.
- Pedaltränarens måttbild säger 41 cm där källtexten och spec-raden säger
  40. Texten följer källtexten.
- Vedställets inledning nämner en bärväska som saknas i källans lista över
  vad som ingår. Texten nämner ingen väska.
- Fiolfikusen sägs komma färdigmonterad, men trädet är 150 cm högt och
  paketet 85 cm långt. Texten lovar ingen färdig växt, bara att grenarna
  formas efter uppackningen.
- Växtpiedestalerna kallas stapelbara i källan. Bilderna visar inte hur, och
  alla tre är 21 × 21 cm, så texten säger det inte.
- Darttavlans spec-rad säger 50 cm där källtexten och måttbilden säger 51,5.
  Texten följer källtexten och måttbilden.

1 bild ströks (`bilder-bort.tsv`): pedaltränarens bild 4 bär tre rader tysk
text inbränd i bilden. 74 bilder återstår, och måttbilden ligger sist på alla
15 produkter.

Högpassarken (`bygg-ghost.py`, två produkter per ark) visade inga
vattenstämplar i någon av de 75 bilderna. En misstänkt kontur nere till höger
i golvspegelns bild 2 var mattans mönster, vilket syntes vid förstoring.

Alla räkneord i texterna har sin siffra i källtexten, så ingen rad behövdes i
`foto-tal.txt`.

## Andra varor av samma slag i katalogen

Katalogen har redan en annan elektrisk fyrhjuling för barn (med släpvagn),
andra eukalyptusklot (Ø52 cm på spett) och tre andra elektroniska darttavlor
(18, 26 och 31 spel). Ingen av dem är samma vara som rundans, och
dubblettskärmen gav ingen träff mot dem.

## Wix, i den ordning det skrevs

| steg | utfall |
|---|---|
| 1a text, namn, slug, SEO, synlighet (8 produkter) | 8 av 8 skrivna, transkriberingsspärren ren |
| 1b text, namn, slug, SEO, synlighet (7 produkter) | 7 av 7 skrivna, transkriberingsspärren ren |
| 2 media | 15 av 15 skrivna, 74 bilder, spärren ren |
| 3 kategorier | 30 av 30 rader success i 11 kategorier, `bulkActionMetadata` 0 fel överallt |
| 4 variant-SKU (sist och ensam) | 15 av 15 skrivna; alla varianter synliga före, priserna orörda (769 och 779 kr) |
| 5 separat återläsning | 15 av 15 helt verifierade vid första läsningen (text-hash, namn, slug, SEO två taggar, media, kategorier, SKU, synlig variant); priserna som förut, alla `IN_STOCK` |
| stämpel (`stampla`, körningar 4319–4333) | 15 av 15 gröna; rutten läser tillbaka raden själv och svarar 500 om den inte stämmer |

## Grindar

Alla rena: `gate.py` (0 fynd i 15 filer mot källan, 0 varningar),
`gate-axel.py` (0 axelfel), `gate-alt.py` (74 alt-texter, 0 fynd),
`gate-seo.py` (0 fynd i 15 rader), `gate-lager.py` (lägsta saldo 43),
`gate-sku.py` (längsta SKU 28 av 40 tecken), `gate-superlativ.py`,
`gate-lankar.py` och läck- och teckensvepet (0 fynd i 20 filer). Formsvepet för
artikelnummer: 40 filer och 0 träffar.

Formsvepet slog först till på golvspegelns SKU och slug, där färgen och
höjden hade samma form som ett artikelnummer utan att vara ett. Båda döptes
om innan något skrevs till Wix. Korrekturpasset ändrade dessutom två
meningar före skrivningen, om leksaksmotorns dimfunktion och om
aktivitetstavlans material. Grindarna kördes om efter båda ändringarna.

## Live

`hamta-live.sh 130`: alla 15 gav HTTP 200 vid båda hämtningarna, utan ett
enda omförsök. Vid den skarpa hämtningen var `age` 148–149 s på alla 15
sidor, alltså gjordes alla renderingar efter Wix-skrivningarna.

`livegrind.py`: orddiff 0 på alla 15, alltså 0 avvikelser i den publicerade
texten. `livekoll.py`: 15 av 15 OK med brödsmula, pris 769 eller 779 kr
och `InStock`, och 74 av 74 alt-texter.

## Hölls

Alla med en rad i `FLAGGADE.md`:

- två troliga färgsyskon till fyrhjulingen i rundan
- två sensorsoptunnor att jämföra med den nyss publicerade på 50 liter
- 23 träffar mot publicerade sidor av samma slag, nio på 779 kr och fjorton
  på 799 kr
- fyra som var slut i lager
- åtta där skärmen inte kunde läsa några mått, utöver de två
  sensorsoptunnorna
- sju i familjer som redan är täckta eller inte gick att avgöra utan
  utredning

Alla 28 kandidater på 769–779 kr är alltså antingen publicerade eller
flaggade. Nästa runda börjar på 799 kr, där skärmen gav 21 rena kandidater.

Båda vedställen, N53:s för brasveden inne och N54:s för veden ute, ligger
nu ute före eldningssäsongen.
