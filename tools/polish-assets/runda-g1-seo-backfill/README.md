# Runda G1 — SEO-backfill: 49 sidor, och en lagerincident på vägen

✅ **KLART. Noll av 2 040 publicerade sidor bär tysk SEO-titel.**

Rundan startade som första batchen av de 49 sidor som visade tysk titel i Google
(#147). Innan en enda rad skrevs visade sidorna något annat, och det tog över
först: 31 publicerade sidor gick inte att köpa (#148, avsnittet längst ner).

## Utfallet

| | före | efter |
|---|--:|--:|
| Publicerade sidor | 2 032 | 2 040 |
| **Tysk SEO-titel** | **49** | **0** |
| Svensk titel med `\| Fyndplats` | 1 443 | 1 500 |
| Svensk titel utan suffix (autohärledd) | 540 | 540 |

Sex batchar om 8 (den sista 9). Varje batch: hämta sidorna → läs ledstycket →
skriv `seo.tsv` → filgrind → skriv `seoData` med återläsning → ISR-cykel →
live-grind mot filen.

| batch | produkter | filgrind | live |
|--:|---|--:|--:|
| 1 | bäddfåtölj med armstöd ×5, gästsäng 180 ×3 | 0 fynd | 8/8 REN |
| 2 | snurrfåtölj 60 ×4, recliner ×2, biofåtölj ×2 | 0 fynd | 8/8 REN |
| 3 | bäddfåtölj 190 ×3, 190×80 ×2, manchester ×2, 98 ×1 | 4 → 0 | 8/8 REN |
| 4 | gungfåtölj ×4, relaxfåtölj ×2, vilfåtölj ×2 | 0 fynd | 8/8 REN |
| 5 | loungefåtölj ×3, läsfåtölj ×2, tv-fåtölj ×2, furuben ×1 | 2 → 0 | 8/8 REN |
| 6 | bäddfåtöljer ×5, golvsoffa, snurrfåtölj, hopfällbar ×2 | 1 → 0 | 9/9 REN |

Filgrinden fällde **7 för långa titlar** över tre batchar. Alla kortades, och
syskonen kortades med — en familj ska läsa lika även när en av dem råkar rymmas.

☠️ **Texten skrivs ur produktens EGEN publicerade svenska text.** En backfill
ska bara påstå det sidan redan säger, så `gate-seo.py` läser här `live/<id>.html`
som källa för siffergrinden. Priset, brödtexten, bilderna och SKU:erna är orörda;
**endast `seoData` skrivs**, och varje rad läses tillbaka.

## ☠️ Hämtskriptet hade en tyst bugg, och grinden avslöjade den

Batch 1 gick grön i filgrinden, skrevs, hämtades — och live-grinden fällde alla
åtta med tysk titel. Skrivningen hade gått igenom; det var HÄMTNINGEN som ljög.

En varm träff triggar bara omrendering om sidan **redan är inaktuell**. Sidorna
var 130 sekunder gamla, alltså färska (`stale-time: 300`), så träffen serverade
dem rakt av och startade ingenting. Pausen gick, den skarpa hämtningen fick
samma gamla sida, och grinden jämförde mot en rendering **äldre än skrivningen**:

```
före fixen:  age 281 efter 150 s paus   → renderad före skrivningen
efter fixen: age  92 efter  90 s paus   → renderingen träffen själv startade
```

`hamta-live.sh` väntar nu ut stale-fönstret innan den träffar.

⚠️ Det är andra gången samma dag ISR-cachen förklär ett mätfel till ett fynd —
och båda gångerna var det bara `age` som skilde. **Läs age. Alltid.**

## Kvar

- De **540** sidorna med autohärledd svensk titel utan `| Fyndplats` bär en
  generisk metabeskrivning (*"… från Fyndplats. Fri frakt och 30 dagars öppet
  köp."*). Inte fel språk, men inte skriven heller — ett eget jobb.
- ⚠️ **Poleringens runbook har fortfarande inget SEO-steg.** Backfillen städar
  det som fanns; nästa opolerade Aosom-produkt som publiceras får tysk titel
  igen om steget inte skrivs in. F1 gjorde det för hand.

## ☠️ Lagerincidenten: 31 sidor gick inte att köpa

Batchens åtta sidor hämtades som källmaterial. Alla åtta innehöll ordet
**Slutsåld** — medan Wix höll 197 i lager. Fyra hypoteser föll i tur och ordning:

| hypotes | motbevis |
|---|---|
| Dold mallmarkup som tagg-strippningen gör synlig | F1:s klösträd har `Slutsåld` **0 ggr**, dessa **2 ggr** |
| Slut i lager på riktigt | Wix: `quantity 197`, `IN_STOCK` |
| Gammal ISR-rendering | En rendering **11 sekunder gammal** sa fortfarande `OutOfStock` |
| Butiken läser ett annat Wix-konto | Mina SEO-skrivningar syntes på F1:s live-sidor samma timme |

Orsaken: produkten var `visible: true` men dess enda VARIANT hade
`variantsInfo.variants[0].visible = false`. Butiken behandlar en produkt utan
synliga varianter som slutsåld.

Huset kände till PRODUKTENS `visible` (CLAUDE.md 2026-08-28). Varianten har ett
eget, och det stod ingenstans. ⚠️ Repots kod är oskyldig — defekten sitter i
poleringens SKU-steg, som PATCHar `variantsInfo` med ett **handbyggt**
variantobjekt.

Hela katalogen skannad (2 032 publicerade, fyra slices): **31 helt dolda, noll
delvis**. Alla 31 lagade och live-verifierade `InStock`. Listan i `lagade.txt`,
detaljerna i CLAUDE.md och #148.

## Nyckelorden: 57 av 57 — och en behörighet som föll mitt i

Runbookens Steg 7 vill ha ett huvudnyckelord plus två relaterade i
`seoData.settings.keywords` med `origin: "USER"`. Alla 57 sidor jag publicerat
saknade dem; importens tyska huvudnyckelord låg kvar.

Källan är `nyckelord.tsv` (29 familjer — färgsyskon säljer på samma sökning),
grindad mot husmärken, artikelnummer, tyska ord och versaler: 0 fynd.

☠️ **Mitt i skrivningen tappade `ExecuteWixAPI` sin Stores-behörighet.** Efter
40 skrivna rader svarade varje Stores-anrop **tom `403`** — `{"message":"",
"details":{}}`, utan felkod. Det såg först ut som ett trasigt filter: min
slug-sökning rapporterade "hittades inte" på alla 17, eftersom jag läste
`products` men aldrig `status`.

Mätningen som skilde felen åt:

| API-familj | svar | betyder |
|---|---|---|
| `stores/v3` (search + get) | **403, tom kropp** | behörigheten borta |
| `site-media/v1` | 403 `PERMISSION_DENIED` | behörigheten borta |
| `categories/v1` | 400 `treeReference must not be empty` | **nåbar** — mitt anrop var fel |
| `wix-data/v2` | 400 `WDE0117: MetaSite not found` | annan felväg |

Alltså ingen driftstörning: kodvägens token hade tappat Stores- och
Media-scope medan resten stod kvar. **`CallWixSiteAPI` hade kvar den** och
gick igenom på första försöket — samma site, samma endpoint, annan
auth-väg.

⚠️ **Lärdomen är inte "byt verktyg", den är `status`.** En loop som läser
`(await r.json()).products` och inte `r.status` rapporterar en behörighets-
förlust som sjutton saknade produkter. Femtonde gången samma familj i det
här huset: ett svar utan fel är inget kvitto — och ett svar med fel är
inget kvitto heller, om ingen läser koden.

Utan kodvägen finns ingen serverside-loop, så skrivningen lades om till
**`POST /stores/v3/bulk/products/update`**: en läsning (17 rader), en
skrivning (17 produkter), en återläsning. `17/17 totalSuccesses, 0
totalFailures, 0 undetailedFailures` — och återläsningen visar tre
nyckelord per rad, `isMain` på den första, titeltaggen och
metabeskrivningen kvar, `visible` och priset orörda.
