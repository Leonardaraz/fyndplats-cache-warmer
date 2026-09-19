# Runda K14 — sju soffor, 5 119–6 949 kr

Publicerad 2026-09-12. Familjen är Aosoms soffor; rundan startades 2026-09-08
men fick göras om, eftersom facit var förgiftat (#225).

| kort | produkt | pris | slug |
| :-- | :-- | --: | :-- |
| `ced08fe0` | Hörnsoffa med bäddfunktion och förvaring – mörkgrå | 6 949 | `hornsoffa-baddfunktion-forvaring-morkgra` |
| `2571c73a` | Tresitssoffa 196 cm i antracitgrå manchester – med lös puff | 6 199 | `tresitssoffa-196-cm-antracitgra-manchester-puff` |
| `dfcef1e9` | Tresitssoffa 260 cm i krämvit chenille – 40 cm sitsdyna | 5 999 | `tresitssoffa-260-cm-kramvit-chenille` |
| `94d330fb` | Hörnsoffa 186 cm med lös schäslongmodul | 5 669 | `hornsoffa-186-cm-los-schaslongmodul` |
| `5531de28` | Tresitssoffa 212 cm i mörkgrå manchester – bär 450 kg | 5 339 | `tresitssoffa-212-cm-morkgra-manchester` |
| `166fdb52` | Tresitssoffa 227 cm i krämvit manchester – fjäderkärna | 5 249 | `tresitssoffa-227-cm-kramvit-manchester` |
| `d2f7876e` | Tresitssoffa 248 cm i mörkgrå chenille – 104 cm djup | 5 119 | `tresitssoffa-248-cm-morkgra-chenille` |

`utesluten/34341c4f` är en INTERN DUBBLETT av publicerade `69c5e15c` och ska
inte publiceras — se #240 och `utesluten/LÄS-MIG.md`.

## Facit är ordagrant, och det är bevisat

`kallor.json` är hämtad ur `plainDescription` och verifierad mot Wix med längd
plus FNV-1a-kontrollsumma, 8/8. Den gamla `kallor-tal.json` är BORTTAGEN: två
facit för samma runda är en tvilling, och den gamla vann dessutom i
`las_facit`:s ordning. Den släppte igenom åtta tal utan täckning i källan.

`axelfacit.json` är genererad mekaniskt ur samma källor. Skriv den aldrig för
hand.

## Grindläge

| grind | utfall |
| :-- | :-- |
| `gate.py` | 0 fynd i 7 filer |
| `gate-axel.py` | 0 axelfel (12 axelkonflikter i KÄLLAN — tyska blocket mot svensk spec-flik) |
| `gate-seo.py` | 0 fynd i 7 rader |
| `gate-sku.py` | 0 fynd, 7/7 unika, längsta 31 av 40 tecken |
| `gate-alt.py` | REN: 7 produkter, 32 alt-texter |
| `gate-superlativ.py` · `gate-lankar.py` | REN |
| `livegrind.py` | **7/7 REN, orddiff 0** |

`gate-fragment.py` hör INTE hit — den gäller reparationsrundor som lägger till
ett fragment till en befintlig text. Våra texter ersätter hela beskrivningen.

## Två smala källor utöver produktens egen spec

`foto-tal.txt` bär två tal som bara går att RÄKNA PÅ FOTOT och som källan
aldrig anger: `166fdb52` två sittdynor, `d2f7876e` fem lösa kuddar (tre stora
mot ryggen plus de två små källans Lieferumfang listar). Grinden fäller utan
raden; en rad på fel produkt hjälper inte, och en rad utan skäl avbryter.

⚠️ Siffergrinden ser bara SIFFROR i den svenska texten — ett utskrivet räkneord
passerar ogrindat. Se #241.

## Tre bilder strukna

Tysk text inbränd i pixlarna, se `bilder-bort.tsv`. Följden:

- `2571c73a` har tre bilder kvar — behöver egna kort.
- `d2f7876e` förlorade sin MÅTTRITNING (bild 3 bar "Lieferung in 2 Kartons")
  och behöver ett eget måttkort.

## Live-verifierat 2026-09-12

Sju sidor hämtade ISR-medvetet (varm träff, 252 s paus, skarp hämtning), alla
200 och inga tomma filer. `livegrind.py` ger REN på alla sju — vilket täcker
orddiff, homoglyfer, sidsvep, alt-svep, exakt SEO-jämförelse mot `seo.tsv`, de
tre obligatoriska flikarna och kategorin i brödsmulan.

JSON-LD på alla sju: `InStock`, rätt pris, ingen "Slutsåld" i markupen.
