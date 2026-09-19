# Runda 81 — läget

Åtta campingstolar och trädgårdsstolar, alla publicerade och live-verifierade
2026-09-06. Live-grinden gick grön på FÖRSTA passet.

| id8 | slug | pris | antal |
|---|---|--:|--:|
| `6307893c` | `campingstolar-2-pack-gra-fotstod` | 1079 | 2 stolar |
| `46d2c85a` | `campingstolar-2-pack-nackstod-kylficka` | 1099 | 2 stolar |
| `4401be4f` | `dubbel-campingstol-bla-tva-sitsar` | 999 | **1 möbel** |
| `8b66533f` | `dubbel-campingstol-khaki-tva-sitsar` | 999 | **1 möbel** |
| `65c84a9b` | `dubbel-campingstol-gron-tva-sitsar` | 999 | **1 möbel** |
| `bdb600fe` | `fallstolar-2-pack-lag-sits-37-cm` | 1059 | 2 stolar |
| `cce86277` | `tradgardsstolar-hog-rygg-2-pack` | 1099 | 2 stolar |
| `e39db7dd` | `tradgardsstolar-akacia-rotting-2-pack` | 1549 | 2 stolar |

## ☠️ Rundans fynd: "2er Set" och "2 Sitzer" är ETT ord isär

Tre utkast som läser som tvåpack är EN 143 cm bred dubbelsits. Beviset är
leverantörens egen `Lieferumfang`-rad (`1 x Campingstuhl`), inte min läsning
av titeln. Lintens `antal`-grind fäller nu åt BÅDA håll, och Fyndplats-kortets
underrubrik bär svaret där kunden faktiskt tittar: *"Två stolar i paketet"*
mot *"EN stol med två sitsar"*.

## ✅ Kategoriträdet HAR löv för den här familjen — till skillnad från runda 80

Runda 80 skrev ned att trädet saknar möbellöv och la kontorsstolarna i
toppkategorin. Det gäller INTE här. Husets konvention lästes ur sex
publicerade sidor i stället för att gissas — den är **löv + förälder**, och
`All Products` skrivs aldrig (det anropet räknas som lyckat men gör inget,
uppgift #291):

| | kategori |
|---|---|
| fem campingstolar | Sport & Fritid → Friluftsliv & Resa |
| tre trädgårdsstolar | Trädgård & Utemöbler → Utemöbler |

16 av 16 kopplingar `totalSuccesses`, noll fel. Grinden är
`bulkActionMetadata`, aldrig `directCategoriesInfo` (som släpar).

⚠️ **Söksvarets kategorifält kom TOMT.** `POST /stores/v3/products/search`
returnerar `directCategoriesInfo: []` även för produkter som filtret självt
hittade på just den kategorin — samma tysta projektion som `MEDIA_ITEMS_INFO`
och `PLAIN_DESCRIPTION`. Läs kategorierna med `GET /stores/v3/products/{id}`,
inte ur söksvaret. Rutten heter dessutom `/stores/v3/products/search`;
`/stores/v3/products-search` är en 404.

## ☠️ Ordlistan fällde sig själv på TVÅ ord — och förkontrollen fångade det

Live-grindens tyska ordlista fick `oxford` och `khaki`. Båda står i VÅR EGEN
text (`600D Oxford-väv` på fyra sidor, `khaki` på tre), så grinden hade
fällt åtta korrekta sidor med åtta felaktiga fel. Regeln i live.py:s
docstring är alltså inte dekoration — **kör hela listan mot
`texter.bygg()` innan den används skarpt.** Efter strykningen: 97 tyska ord,
6 husmärken, **noll självträffar**.

⚠️ `textilene` ströks av samma skäl (vår text säger *textilenväv*).
`getränkehalter` och `klappstuhl` fick STÅ KVAR — tyskan stavar med ä/k
respektive `uhl` där svenskan inte har något släktord — men det är MÄTT, inte
antaget.

## Steg för steg

| steg | utfall |
|---|---|
| 1 | fem av åtta felklassade i den tyska titeln — se `STEG1.md` |
| 2–6 | lint 0/8, mutationstest 35/35, prisgrind grön (körning 1557–1564) |
| 7–9 | åtta texter skrivna i två anrop, facit-grind 8/8 inne i anropet |
| kort | åtta Fyndplats-kort importerade, alla åtta bytetal exakta |
| 11 | media skriven: 6 bilder/produkt, kortet på plats 3, **0 utan alt-text** |
| 10 | 16/16 kategorikopplingar |
| 13 | åtta publicerade, SKU skriven, **pris oförändrat på alla åtta** |
| stämpling | åtta `stampla`-körningar, alla `success` |
| 14 | **alla 8 sidor och 8 länkmål rena, första passet** |

☠️ **Prisbeviset ligger i skrivningen, inte i en efterkontroll.** Steg 13:s
anrop läser variantens pris FÖRE PATCH:en och jämför mot ekot: alla åtta
`prisFöre == prisEfter`. En variantspridning som råkat röra priset hade
synts i samma svar som gjorde den.

☠️ **Åtta gröna `stampla` ÄR ett kvitto här** — men bara för att rutten
avvisar ett okänt `wixVariantId` med **422 innan den skriver något**. Utan
den grinden hade "success" bara betytt att `jq` klarade sig.

## Kvar att göra i nästa runda

Deferrade utkast står i `STEG1.md`. Två med egen historia:

- `ee610afd` — **FJÄRDE färgen** i den publicerade `vilstol-bjork-*`-familjen
  (gräddvit). Ska korslänka till alla tre publicerade syskon.
- `e4a986ad` (sminkstol) och `bff8e42d` (chefsstol med massage + värme) från
  runda 80. Den senare behöver runda 26:s massagegrind och en krockkontroll
  mot åtta publicerade `massagestol-*`-sidor.

Öppna sedan tidigare: #253, #256, #259, #261, #263, #264, #266, #268, #270,
#271, #272, #283, #295, #298, #300, #302, #305, #311.
