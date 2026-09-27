# Runda 143 — Steg 9 + 10: galleriet omordnat, 97 alt-texter, kategorierna kopplade

## Steg 9 — 17 av 17 kvitterade byte för byte

| | |
|---|---:|
| Produkter | 17 |
| Bilder i galleriet efter | **97** |
| Egna Fyndplats-kort | 17 |
| Bilder utdömda i Steg 4 | 4 |
| Bilder omtvättade | 1 |
| Alt-texter skrivna | **97** |
| Kvarvarande tyska alt-texter | **0** |
| Poster utan alt-text | **0** |

Ordningen är runbokens: hjältebild, verklighetsbild, eget kort, detaljer,
**måttritningen sist**. Position 3 var måttritningen på ALLA sjutton — det är
kontrollerat på fyra kontaktark, inte antaget utifrån importens positionsregel.

### ☠️ Kortens attribution vilar på md5, inte på ordningen i anropet

`UploadImageToWixSite` svarar `success: true` med `operationStatus: PENDING`
och bär inget filnamn. Kopplingen pid → fil-id skulle därför ha vilat på
ORDNINGEN i `imageUrls` — samma antagande huset brände sig på i
bulk-lagerskrivningen. `kortkvitto.py` laddar i stället ner originalet från
Wix och jämför md5 mot den lokala filen: **17 av 17 READY och attribuerade på
innehåll**, och samma kontroll gjordes på den tvättade måttritningen.

### ☠️ Alt-texten är kundtext utan skydd — `altgrind.py` är nätet

Steg-grinden läser `texter.py`. Alt-texterna finns aldrig där, så varje regel
den vaktar är oskyddad en nivå ner. Runda 106 mätte upp precis det: sex sidor
gröna i textgrinden, fem av dem med det förbjudna ordet i en alt-text.

`altgrind.py` kör därför rundans EGEN `FORBJUDET` plus den delade modulens
kategoriska regler över exakt de strängar som skickas, och vaktar dessutom
ordningen. Mutationstestad mot rundans verkliga data — åtta införda fel, åtta
fällda, och grön igen efteråt:

| införd mutation | grinden svarade |
|---|---|
| husmärke i en alt-text | `HUSMÄRKE 'homcom'` |
| artikelnummer i en alt-text | `ARTIKELNUMMER '[artikelnr]'` |
| landord i en alt-text | `LANDORD 'tyskland'` |
| utdömd bild tillbaka i ordningen | `bild 5 är utdömd men ligger kvar` |
| måttritningen inte sist | `måttritningen ligger inte sist` |
| kortet utan `Faktakort: ` | `kortets alt-text måste börja med` |
| tom alt-text | `TOM alt-text` |
| hjältebilden inte först | `hjälte, verklighet, kort måste ligga först` |

⚠️ **Två delade konstanter är ORDLISTOR, inte mönster.** `G.HUSMARKEN`,
`G.LANDORD` och `G.LAGERFRAS` är `list`; en `.finditer` på dem kastar.
Kontrollerat med `type()` i stället för antaget av namnet.

⚠️ **`leveransloften` vill ha sidans leveransomfattning som andra argument.**
Den läses ur `Ingår`-raden i produktens EGEN html, så alt-texten och brödtexten
prövas mot samma facit — ingen avskriven tvilling.

### Tre sidor säger i alt-texten att säcken inte ingår

`f8d974b3`, `d307632a` och `b6c4c619` visar alla en boxsäck som kunden inte
får (#568). Brödtexten bär lasten sedan Steg 7, men en alt-text som bara säger
"säcken hängande i kroken" är ett löfte en skärmläsare läser som
produktinformation. De raderna säger det rakt ut.

### Kvittot

PATCH-svaret bär inte `media` — det kan alltså inte skilja "sparat" från
"raderat". Verifieringen är en SEPARAT `GET …?fields=MEDIA_ITEMS_INFO` där
ordningen och alt-texterna hashas och jämförs mot `media/_allt.json`:
**17 av 17 digests stämmer**, `main` är första posten på alla, och samtliga
står kvar `visible: false`.

## Steg 10 — kategorierna

Alla sjutton kopplade till **Sport & Fritid** + lövet **Träning & Gym**.
Svaret gav `totalSuccesses: 2` och `totalFailures: 0` på varenda produkt.
Grindat på skrivningens svar, inte på en GET direkt efteråt —
`directCategoriesInfo` släpar.

### ☠️ Två tomma svar som INTE var fakta

1. **`parentCategory` finns på en TOPPKATEGORI också**, som `{index: 1}` utan
   `id`. Villkoret `!k.parentCategory` gav därför **noll toppkategorier** ur ett
   träd med tolv. Rätt villkor är `!(k.parentCategory && k.parentCategory.id)`.
2. ☠️ **Jag slog upp grannfamiljen på id UR MINNET, och de id:na fanns inte.**
   Svaret blev tomt och såg ut som "grannarna saknar kategori". Samma klass som
   de två påhittade fil-id:na i runda 138. De riktiga id:na lästes ur
   `runda-142/ids.json`, och först DÅ betyder ett tomt svar något.

⚠️ **Och med de riktiga id:na är svaret fortfarande tomt** — runda 142:s
publicerade boxningsprodukter ligger utanför kategoriträdet. Det är ett eget
fynd, samma familj som de sju träningsbänkarna, och det finns ingen
grannprecedens att kopiera. Trädet fick avgöra.

## ☠️ RÄTTELSE (samma dag): runda 142:s elva HAR kategori — jag frågade fel

Stycket ovan påstår att runda 142:s publicerade boxningsprodukter ligger
utanför kategoriträdet. **Det är fel.** Mätt om mot skarpa V3, med rätt
endpoint:

```
POST /stores/v3/products/query
  fields: ["DIRECT_CATEGORIES_INFO", "ALL_CATEGORIES_INFO"]
  query.filter.id.$in: [runda 142:s elva riktiga id ur ids.json]
```

| | direkta kategorier |
|---|--:|
| Runda 142:s elva | **3 av 3, alla elva** |
| Runda 143:s sjutton | **3 av 3, alla sjutton** |

Kategorierna är identiska på alla 28: `All Products`, `Sport & Fritid`,
`Träning & Gym`. Det finns ingen lucka, och ingenting skrevs.

☠️ **Felet var att `list-categories-for-items` anropades på en URL som inte
finns — och svaret var inte tomt, det var 404.** Den första gissningen i
Steg 10 (`/categories/v1/bulk/categories/list-categories-for-items`) matchar
ingen rutt; de riktiga rutterna heter `…/bulk/categories/{categoryId}/add-items`
och `…/bulk/categories/add-item`. Att en läsning "gav tomt" var alltså en
TOLKNING av ett anrop som aldrig nådde fram.

Två saker gick rätt och en gick fel, och det är värt att skilja dem åt:

- ✅ Att läsa om med RIKTIGA id ur `runda-142/ids.json` var rätt — påhittade
  id hade gett ett tomt svar av en tredje orsak.
- ✅ Att skriva ned "tomt svar" som ett FYND i stället för som en slutsats var
  rätt — det gick att motbevisa.
- ☠️ Att kalla det "ligger utanför kategoriträdet" var fel. **Ett tomt svar
  från ett anrop man inte verifierat är ingen mätning.** Det är #392 och #313
  en tredje gång: på det här API:t betyder tomt nästan alltid fel fråga.

⚠️ **Följdfråga för någon annan:** #555 ("sju publicerade träningsbänkar ligger
utanför kategoriträdet") är samma klass av påstående och bör mätas om med
`products/query` + `DIRECT_CATEGORIES_INFO` innan någon skriver något.

⚠️ `All Products` är Wix egen automatiska kategori och går inte att skriva
till (#291) — den ska inte räknas som ett kategorival.
