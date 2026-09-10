# Runda 122 — läge

Fyra städvagnar med press, familjens sista. Tre publicerade, en hålls tillbaka.

| id | sida | pris | saldo | status |
|---|---|--:|--:|---|
| `6490e360` | `moppvagn-dubbla-hinkar-press-73-cm` | 1 299 | 160 | **LIVE** |
| `0cbffcd9` | `stadvagn-111-cm-press-sopsack-gra` | 2 339 | 146 | **LIVE** |
| `740fa6d0` | `stadvagn-111-cm-press-sopsack-svart` | 2 429 | 106 | **LIVE** |
| `832f9eec` | `stadvagn-93-cm-fyra-hinkar-press-sopsack` | 2 699 | **0** | polerad, **ej publicerad** |

## Kvitton

| steg | kvitto |
|---|---|
| 1 | 57-sidigt svep till `cursor === null`; 3 108 utkast / 2 515 publicerade — runda 121:s tal minus dess åtta publicerade, exakt |
| 1 | dubblettgrinden fällde `a389ddaa` mot publicerade `5b27721d` på ÅTTA fält (uppgift #453) |
| 2 | ingen el → ingen CE; "professionell" är ingen certifiering; moppen ingår inte på någon av de fyra |
| 3 | prisgrinden **OK på alla fyra** mot ×1,2 + charm99; alla fyra `hasEuWarehouse: true` |
| 4 | tjugo bilder granskade: **noll tysk pixeltext, noll leverantörslogotyper** |
| 5 | sju motsägelser, tre avgjorda av bilden (se STEG2-5.md) |
| 7 | teckensumman återläst ur Wix **4 av 4 exakt** — 2288 / 2249 / 2251 / 2287 |
| 8 | alla fyra delade SKU:n `FP-putzwagen`; alla fyra har nu en egen |
| 9 | tjugo alt-texter, **noll utan**, alla verifierade ordagrant vid återläsning |
| 10 | 4 av 4 i `Verktyg & Hemmafix`, verifierat på `directCategoryIds` |
| 13 | tre publicerade, **priset orört på alla fyra**; mappningarna stämplade i körning 2436–2439, alla `success` |

## ☠️ Tre grindfel och tre textfel i samma runda

Textgrinden fyrade tio gånger på första körningen. Uppdelningen är poängen:

| fynd | klass | vad det var |
|---|---|---|
| ATTRIBUTION | **textfel** | "Leverantören anger måtten…" — mot kunden är VI leverantören |
| FÄRGORD × 2 | **textfel** | FAQ:n namngav syskonets färg i sidans EGNA meningar |
| MOPPGRINDEN × 4 | grindfel | mönstret krävde en ordagrann fras; texterna sade samma sak med andra ord |
| TILLBEHÖR | grindfel | samma sak, en nivå smalare |

☠️ **Moppgrinden fällde fyra KORREKTA texter.** Den letade efter strängen
`moppen ingår inte` medan sidorna sade *"Moppen och moppskaftet köper du
separat"* — ett besked som når kunden precis lika väl. En positiv grind måste
leta efter BESKEDET, inte efter en formulering: kravet är nu en mening som
nämner moppen och nekar den, med negation eller "separat".

☠️ **Och färgordet var ett riktigt fel, inte ett grindfel.** Korslänken ovanför
namnger redan syskonets färg och länkar dit; FAQ-frågan *"Vad är skillnaden mot
den svarta?"* upprepade den i sidans egen brödtext, och en färg i sidans egna
meningar är exakt vad färggrinden finns för (uppgift #330). Frågan heter nu
"Vad skiljer den här från syskonmodellen?".

Alla fem verifierade genom att återinföras: rätt grind faller för rätt fel,
och bara den.

## ☠️ Kategoriläsningen "svarade tomt" — och det var MIN läsare som hade fel

Skrivningen gick igenom med 200 och fyra resultat. Återläsningen rapporterade
`0 kategorier` på alla fyra, alltså precis det mönster uppgift #357 och #390
beskriver. Mätt på råsvaret i stället för antaget:

```
{"categoriesForItems":[{"item":{...},"directCategoryIds":["05e9…","4367…"],
                        "indirectCategoryIds":["3ed8…"]}]}
```

Fältet heter **`directCategoryIds`**, inte `categoryIds`. Skrivningen hade
landat hela tiden; det var extraktionen som läste ett fält som inte finns.
Tre oberoende vägar gav samma svar — `list-categories-for-items`,
`GET ?fields=DIRECT_CATEGORIES_INFO` och en `products/search` på kategorin.

**Regeln: ett tomt svar är inte ett kvitto på att skrivningen missade — det
kan vara ett kvitto på att LÄSAREN är fel.** Mät råsvaret innan du drar en
slutsats om skrivningen.

## ✅ Steg 14: 3 av 3 gröna på FÖRSTA körningen

```
grindar._sjalvtest(): 36 fall, 0 fel
OK  6490e360  moppvagn-dubbla-hinkar-press-73-cm
OK  0cbffcd9  stadvagn-111-cm-press-sopsack-gra
OK  740fa6d0  stadvagn-111-cm-press-sopsack-svart

3 sidor, 0 fel
```

☠️ **Det är kvittot på uppgift #452.** Runda 121 behövde TVÅ körningar och
tolv lagade grindfel för att komma hit — alla tolv i rundans egen kopia av
tvätten. Runda 122 ärver `grindar.butikstvatt()` i stället för att skriva om
den, och kommer grön på första försöket. Ingen ny tvätt skrevs, alltså kunde
ingen av de två felen återuppstå.

Grinden kör dessutom `G._sjalvtest()` och `G.tvillingsvep()` FÖRE sidorna: en
grind som prövar sig själv först är skillnaden mellan "sidan är trasig" och
"grinden är trasig".

⚠️ `832f9eec` ingår INTE i körningen — den är slutsåld och ligger som utkast,
och dess URL svarar 404. En grind som fällde på det hade lärt mottagaren att
ignorera raden. `PUBLICERADE` i `livegrind.py` håller den utanför med flit.

## Kvar för Leonard

- ☠️ **`a389ddaa` är en bevisad dubblett av publicerade `5b27721d`** — åtta
  fält, åtta träffar. Ommappningen är ditt beslut (uppgift #453).
- ⚠️ **Maxlasten går inte att skriva ut på någon av de fyra.** Leverantören
  anger 15 respektive 25 kg totalt, men hinkarna rymmer 36–48 liter — alltså
  36–48 kg vatten. Talet står inte på sidorna. Samma fråga som runda 121:s
  två moppvagnar.
- ⚠️ **`832f9eec` är slutsåld hos Aosom** (saldo 0). Sidan är färdigpolerad
  och stämplad men inte publicerad; publicera när lagret kommer tillbaka.
- ⚠️ **`0cbffcd9` 2 339 kr mot `740fa6d0` 2 429 kr** — 90 kr isär trots
  identiska mått, identisk vikt, identiskt paketmått och ordagrant samma
  leverantörstext. Priset är inte poleringens att röra.
- ⚠️ **Kategoriträdet saknar fortfarande ett löv för städutrustning.** De fyra
  ligger på `Verktyg & Hemmafix`, som är det närmaste som finns.
- **Tre verktygsvagnar går till runda 123**: `12cb8a2c` (78 × 35 × 73, 90 kg),
  `c8105590` (70,5 × 35 × 82,5, 120 kg) och `887d388d` (83 × 43 × 97, 91 kg).
  Alla tre mätta som SKILDA från de nio publicerade verktygsvagnarna.
