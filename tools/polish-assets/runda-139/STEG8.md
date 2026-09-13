# Steg 8 — SKU, båda halvorna

Tio produkter, en variant var, inga optionsvärden → `FP-<sku_bas(slug)>`.
Strängarna är RÄKNADE av `grindar.sku_bas` ur den polerade sluggen, inte
skrivna för hand (runda 128 hade fyra handskrivna som stod ett token för korta).

| id | före (leverantörens) | efter (husregeln) |
|---|---|---|
| 1467588a | `FP-kratzbaum-eine-plattform` | `FP-klostrad-92-cm-hangande` |
| 27b607dc | `FP-kratzbaum-inkl-spielzeug` | `FP-klospelare-80-cm-ek` |
| 3a96740e | `FP-kratzbaum-mit` | `FP-klostrad-153-cm-hala` |
| 3addfbf8 | `FP-kratzbaum-katzenbaum` | `FP-klostrad-76-cm-badd` |
| 4faf9f4c | `FP-kratzbaum-inkl` | `FP-klostrad-113-cm-hala` |
| 8d074911 | `FP-wandmontiertes-kratzbaum` | `FP-vaggklostrad-moln-hala` |
| 90573e36 | `FP-katzenbaum-hohle` | `FP-klostrad-220-240-cm` |
| a4d8feca | `FP-katzenbaum-mit-viel` | `FP-klostunna-60-cm-brun` |
| b04b5375 | `FP-kletterstufen` | `FP-vaggklostrad-73-cm-tre` |
| b813d037 | `FP-katzenbaum-4-stock` | `FP-klostrad-104-cm-fyra` |

Alla tio var TYSKA i både Wix och mappningen. Steg 8 hoppas alltså över på båda
sidorna samtidigt eller inte alls — den som lagar bara Wix lämnar kvar driften.

## Krockgrinden: hela katalogen, inte rundan

☠️ **Krocken syns inte i sluggen, den uppstår i den KAPADE strängen** (#473).
Svepet går därför på `sku_bas` av VARJE slug i katalogen:

```
porttest: 37/37 ok   sidor: 57   produkter: 5695   avhuggen: false   krockar: []
```

☠️ **Svepet räknar `sku_bas` i JavaScript, i sandlådan — alltså en TVILLING till
`grindar.sku_bas`.** Tvillingar glider isär (`SHIP_AXIS_RE`, `EU_TULL_CODES`,
`mapWithConcurrency`), så porten kör först ett facit på 37 verkliga sluggar plus
sex syntetiska kantfall (märkesprefix, fogeord, ensamt för långt token, exakt 24
tecken, 25 tecken). Avviker den på ett enda fall avbryts svepet före första
sidan. Facittabellen är genererad ur Python, inte skriven för hand.

## Halva 1 — Wix variantens SKU

`variantsInfo`-PATCH, varianten tillbaka verbatim med bara `sku` bytt.

☠️ **`visible` skickades explicit i BÅDA leden**: produktens `false` (en
`variantsInfo`-PATCH publicerar annars utkastet) och variantens `true`
(produktens `false` speglas annars ned).

**Priset rördes inte.** `price` skickades tillbaka verbatim ur GET-svaret —
en `variantsInfo`-skrivning KRÄVER fältet — och lästes före och efter:
859/869/1019/899/849/1129/979/899/799/799, oförändrat på alla tio.

**Bilderna överlevde.** #501 säger att varje `variantsInfo`-PATCH raderar
variantens media. Varianterna bar noll egna bilder här, och produktens fem plus
huvudbilden räknades efter skrivningen:

```
kvitto: 10/10   (sku satt, produkt osynlig, variant synlig, 5 bilder + huvudbild)
```

Kvittot är en EGEN GET per produkt — ett PATCH-svar bär inget `?fields` och
returnerar `media.items` tomt (#457).

## Halva 2 — mappningsraden

Tio `stampla`-körningar via `polish-mapping.yml`, `needs_ai_polish` och
`draft_status` TOMMA (de är Steg 13:s; en ifylld `draft_status` hade publicerat
tio opolerade utkast). Loggen visar att tomheten verkligen kom fram:

```
NEEDS_POLISH:
DRAFT_STATUS:
VARIANT_SKUS: {"1a4b9543-…":"FP-klostrad-92-cm-hangande"}
Skickar patch: {"variantSkus":{…}}
OK: 1467588a-… uppdaterad — variantSkus
```

⚠️ **`success` på jobbet är inget kvitto — raden är det.** Raden läses tillbaka
med `las` i Steg 13, där en `las` ändå körs per produkt för prisgrinden.

## ☠️ Klistra-grinden täcker nu tre fält, inte ett

Steg 7 lärde att ett handskrivet id passerar en grind som bara hashar texten.
Här hashas `id`, `sku` OCH `wixVariantId` mot filens värden före första
anropet — `id+sku+vid 10/10 ok`. Ett felskrivet variant-id hade annars avvisats
av ruttens 422, men ett felskrivet PRODUKT-id hade skrivit fel produkts SKU.
