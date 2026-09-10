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

## Steg 13 — publicerad, och det som publiceringen avslöjade

| | |
|---|---|
| 13 publicering | **8 av 8** `visible: true` på BÅDA leden, priset orört |
| 13 stämpling | **8 av 8** (runs 2416–2423), `needsAiPolish, draftStatus` läst tillbaka |
| 14 live-grind | **8 av 8 gröna**, 29 självtestfall, 0 fel |

Publiceringen gick som en ren `visible`-PATCH per produkt, och återläsningen i
svaret visar att produktens `true` speglas NED på varianten precis som `false`
gjorde i Steg 7: alla åtta har `variants[0].visible: true`, rätt SKU, rätt pris
och `inStock`.

## ☠️ FLIKRADEN VAR FEL PÅ ALLA ÅTTA — och varje grind var grön

Steg 14 mätte den renderade sidan och fann att flikraden var

    Tekniska specifikationer · Vanliga frågor · Kontakta oss

Den obligatoriska **`Användning och skötsel`** fanns inte. Rundan hade skrivit
`<h2>Montering och skötsel</h2>`, och butikens `splitFlikar` känner exakt fyra
strängar — den är ingen av dem.

☠️ **Värre än en saknad flik:** splittern lägger allt efter en matchande rubrik
i den fliken fram till nästa match. Skötseltexten OCH korslänkarna låg alltså
**inne i spec-tabellen**.

| | före | efter |
|---|---|---|
| `<summary>` | Tekniska specifikationer · Vanliga frågor · Kontakta oss | + **Användning och skötsel** |
| spec-flikens innehåll | spec + skötsel + korslänkar | bara spec |
| korslänkarna | inne i spec-fliken | i brödtexten, före första flikrubriken |

Rättat i `texter.py` (rubriken bytt, korslänksblocket flyttat FÖRE första
flikrubriken), `skrivning.json` omgenererad, och alla åtta `plainDescription`
omskrivna till Wix. Verifierat på den renderade sidan efteråt.

⚠️ **Blast-radien är MÄTT: rundorna 118, 119 och 120** skriver
`Montering och skötsel`. 120 är rättad; **18 publicerade sidor i 118 och 119
bär felet kvar.**

**Regeln: en grind som mäter NÄRVARO svarar inte på en fråga om STRUKTUR.**
Runda 119:s live-grind kollade `if flik not in egen_syn` — ordet stod på sidan,
som `<h2>`, och grinden var grön. Runda 120:s läser `<summary>`, och tre
självtestfall låser den riktningen.

## Två fynd till, båda från live-grindens självtest

1. ☠️ **Sortimentsgrinden kände bara SEX superlativ.** Mutationen
   *"Det smalaste barbordet i sortimentet"* rapporterades som MISSAD — och det
   var GRINDEN som föll, inte sidan: uppräkningen hade `störst|minst|enda|
   bredast|dyrast|billigast` och `smalaste` var inget av dem. Mönstret bär nu
   svenskans superlativÄNDELSE (`\w+ast[ae]?`) med de oregelbundna som egna
   alternativ. Båda formerna står kvar som lås. Samma familj som böjningshålet
   i leveranslöftena — **läs meddelandet, inte bara utfallet.**
2. ⚠️ **`farg` är ett INTERNT licensfält, inte något sidan påstår.** Live-grinden
   fällde `c88b5bbb` på `FÄRGEN 'ekfärgad' saknas` — sidan säger konsekvent
   "ljus ekoptik", och `farg` används bara för att licensiera färgord i
   textgrinden. Facit går sedan dess mot `farg_lang`, som ÄR spec-tabellens
   renderade `Färg:`-värde. Strängare kontroll, och den mäter det den påstår.

⚠️ **Facit är byggt ur `skrivning.json`, inte ur katalogen.** Det är alltså
"det vi skrev"; den RENDERADE SIDAN är den oberoende sidan av jämförelsen.
Namn, slug och titel är dessutom kvitterade ur PATCH-svaren.
