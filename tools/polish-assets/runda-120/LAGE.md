# Runda 120 — barbordsset, åtta produkter

Familjen är barbord med pallar eller stolar. Steg 1 mätte 57 sidor till
`cursor === null`: 47 utkast, **noll publicerade konkurrenter**.

| steg | kvitto |
|---|---|
| 1 | 57 sidor, 47 utkast, 0 publicerade konkurrenter |
| 2 | bordslasten 20–170 kg; fem set utan lastuppgift uteslutna |
| 3 | `matt.py` 8 regler, 12 muterade fall, 0 släppta |
| 4 bilder | 40 granskade i två pass, 3 åtgärdade, 0 tyska |
| 4 pris | 8 av 8 `stämmer: true` (runs 2400–2407) |
| 6–7 | 8 texter 0 fel, 38 självtestfall, 9 fältfall |
| 7 skrivet | **8 av 8** — priset orört, alla kvar som utkast |
| 8 Wix-SKU | **8 av 8** distinkta, varje sträng läst tillbaka ur svaret |
| 8 mappning | **8 av 8** stämplade (runs 2408–2415), `ändrat: variantSkus` |
| 9 kort | 8 kort + 2 bildpolerade filer, **md5-identiska efter uppladdning** |
| 9 galleri | **47 bilder** över åtta produkter, kortet på plats 3, ritningen sist |
| 10 | **8 av 8**, `totalSuccesses 1 / totalFailures 0` |
| 12 | två fynd, båda lagade — se nedan |

## Steg 8 — SKU-krocken var verklig

Tre av åtta produkter delade den råa SKU:n `FP-bartisch-set-bartisch`. Samma
krock runda 108 mätte upp, och den syns inte i mappningsstämplingen: den
skriver mappningsradens `variants[].sku`, inte Wix egen.

`sku.py` speglar `lib/import/sku.ts`, men handplockar tre rader där
24-teckenkapningen tar bort just det som SKILJER produkterna åt:

| | regeln ger | valt |
|---|---|---|
| `c88b5bbb` ljus ek | `FP-barbord-fyra-pallar-ljus` | `FP-barbord-fyra-pallar-ek` |
| `63a37524` rustikbrun | `FP-barbord-fyra-pallar` ← färgen bortkapad | `FP-barbord-fyra-pallar-brun` |
| `c3bda64a` hyllplan | `FP-barbord-100-cm-tva` | `FP-barbord-100-hyllplan` |

Runbokens färgfamiljsundantag: behåll den särskiljande svansen, kapa mitten.

## ☠️ Steg 7 får INTE skicka `visible: false`

Uppmätt på rundans egna åtta, samma kropp så när som på det ena fältet:

| Steg 7-kroppen | produkter | `variantsInfo.variants[].visible` efteråt |
|---|--:|---|
| med `"visible": false` | 2 | **`false` på båda** |
| utan fältet | 6 | `true` på alla sex |

Produktens `false` speglas ned på VARIANTEN, och en variant som står `false`
betyder att sidan saknar köpbar variant den dag den publiceras. Ingenting
klagar — produktens egen `visible` ekas tillbaka som önskat. Steg 8:s
`variantsInfo`-PATCH kräver tvärtom BÅDA leden. Båda varianterna återställda.

## Steg 10 — kategorin är MÄTT, inte gissad

Trädet har **inget möbellöv**. Frågan blev därför: var ligger husets egna
publicerade matgrupper inomhus?

| sida | kategorier |
|---|---|
| `f8a5196f` matgrupp med hylla | Hem & Inredning, All Products |
| `0058ad50` matgrupp med stoppade stolar | Hem & Inredning, All Products |

Båda på toppkategorin ensam — och den ena har till och med en hylla utan att
hamna i Förvaring & Organisering. Alla åtta barborden fick samma.

## ☠️ Steg 12 hittade två fel som INGEN grind kan se

1. **"Hyllan lyfter av damm snabbt"** (394de213) är inte svenska. Felet låg i
   `texter.py`, inte i skrivningen — grinden kontrollerar stavning, tal, ton
   och påståenden, men har ingen IDIOM-kontroll. Rättat till "samlar damm".
   Sökt i hela batchen: en förekomst.
2. **`Färg` upprepade `Yta` ordagrant** på samma produkt ("vit ram med skiva i
   ekoptik" två gånger i spec-tabellen). `farg_lang` är nu "vit ram med
   ekfärgad skiva".

⚠️ **Och ett eget fel i skrivvägen:** första galleri-PATCHen escapades för
hand och blev **"Fristlående"** i stället för "Fristående". API-svaret ekade
tillbaka felet som "sparat" — exakt runbokens egen fälla. Resten av rundans
kroppar kommer ur `ensure_ascii=True`, alltså maskinescapade.

⚠️ **`ordsumma()` i `skrivning.py` är en NY implementation.** Alla åtta summor
flyttade sig när filen genererades om, men en fälts-diff visar att bara
394de213:s HTML faktiskt ändrades. Summorna före och efter är alltså inte
jämförbara — det är funktionen som skiljer, inte texten. Från och med nu är
`skrivning.py` definitionen.
