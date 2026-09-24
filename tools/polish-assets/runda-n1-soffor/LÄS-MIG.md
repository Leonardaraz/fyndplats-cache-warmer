# Runda N1 — körlogg

Åtta soffor, 2 029–4 839 kr. Alla Aosom-utkast, alla publicerade. Första
rundan där URVALET kommer ur prisjämförelsen mot dealproffsen i stället för
ur en familj i katalogen.

## Steg för steg, med kvitton

| steg | utfall |
| :-- | :-- |
| Källor hämtade ordagrant, summa räknad i anropet | 8/8 |
| Källor bevisade mot filerna på disk | **8/8 LIKA** |
| Artikelnummer i källtexterna | **0 av 8** (#257 gäller inte den här rundan) |
| Lagergrind i urvalet | 8/8 spårat saldo, 14–122 |
| Dubblettskärm: måtttrippel mot 335 publicerade sidor | **0 krockar** |
| Dubblettskärm: huvudbildens hash + källadress, 76 produkter | **0 grupper** |
| Kontaktark byggt FÖRE brödtexten | 8 ark, 40 bilder, 40 unika md5 |
| Grindar (siffer/axel/superlativ/alt/seo/sku/lager) | **rena** |
| Prisgrind via `las` | **8/8 utan fall** |
| Transkriberingsspärr FÖRE varje skrivning | **8/8 stämde**, noll avbrott |
| Bilder skrivna | 33 (7 borttagna) |
| Alt-texter skrivna | 33, noll tyska |
| SEO skriven | 8 × två taggar, keywords rensade |
| Variant-SKU skriven | 8/8 svenska, i ett eget sista anrop |
| Kategorier | **8/8 kopplade**, noll fel |
| Separat Wix-återläsning mot facit | **8/8 byte-exakta** |
| Mappningsraderna stämplade | 8/8 |
| **Live-grind på publicerad sida** | **8/8 REN, orddiff 0** |

## ☠️ Urvalet: pengarna låg i en familj vi redan täckt

Listan över opolerade utkast där vi är billigare än dealproffsen är
**1 577 rader och 532 235 kr**. Rankad på kronor pekar den rakt på
fåtöljer. Femton kandidater ställdes mot 247 publicerade sittmöbler:

| | |
|---|---:|
| kandidater med minst en krock | **14 av 15** |
| krockar totalt | **63** |
| kandidater med EXAKT samma mått som en publicerad sida | 4 |

`1bf87dc9` (79 × 64 × 52) matchar **fyra** publicerade färgsidor av samma
stol. Det är precis vad `#218` och `#220` beskriver, och det betyder att
gap-listans topp är den familj katalogen redan har.

Andra hälften av toppen var trädgårdsmöbler: 285 kandidater och 137 770 kr
i mitten av september. En utegrupp som poleras nu får sin första besökare
om sju månader.

**Urvalsregeln blev därför gap PER PUBLICERAD SIDA i samma kategori**, med
säsongen som filter ovanpå:

| kategori | kandidater | gap kr | publicerade | gap/sida |
|---|---:|---:|---:|---:|
| trädgård/ute | 256 | 127 330 | 132 | 965 |
| **soffa/bäddsoffa** | **79** | **50 430** | **48** | **1 051** |
| matbord/matgrupp | 45 | 27 290 | 36 | 758 |
| fåtölj/recliner | 114 | 75 530 | 225 | 336 |

Soffor ligger högst av det som är inomhus och i säsong.

## Tre skärmar, och två av dem fällde

1. **Lagergrinden** tog tre kandidater på saldo 0 — två fåtöljer och
   `8163e9a0`. Kollen kostade ett Wix-anrop för hela rundan.
2. **Måttskärmen** tog `c6c880c3`: 213 × 82 × 90 cm chenille, 360 kg,
   identiska tal mot publicerade `f7e2b537` "3-sitssoffa i chenille 213 cm".
   Ersatt med `45e68631`.
3. **Bildhashen** gav noll grupper på 76 produkter — väntat, eftersom
   färgsyskon har olika foton. Den fångar en annan dubblettklass än måtten
   (`#194`), och det är därför båda körs.

## ☠️ Och måttskärmen hade nästan en blind fläck

Den tyska källan skriver totalmåttet med axelbokstaven INNE i talet:

```
Gesamtabmessungen: 218B x 79T x 91H cm
```

Ett mönster som kräver `\d+ x \d+ x \d+ cm` hittar inte den raden. Det
hittar däremot **paketmåttet** i den svenska spec-raden (`92 × 43 × 70 cm`),
som är rena tal — så skärmen gick igenom med "noll krockar" på ett facit som
mätte kartongen i stället för soffan.

Första soffsvepet gav noll krockar av exakt det skälet. Med måtten avlästa
för hand ur källtexterna föll `c6c880c3` direkt.

**Regeln: läs produktens mått ur källan, och låt mönstret ta axelbokstaven.**

## ☠️ `products/search` avvisar filter + markör ihop

```
400 SE-1141: "Search, filter and aggregations cannot be specified together with cursor"
```

Samma form som `inventory-items/query` 2026-09-13. Sida två måste skickas
med BARA markören. Tredje endpointen i samma familj — men `orders/search`
tar emot båda, så formen är fortfarande inte gemensam för Wix. Mät per
endpoint.

## ☠️ Två formfel som jag skrev ur minnet

Båda fångades av Wix innan något skrevs, och båda står i `lib/wix/client.ts`:

| jag skrev | rätt form | var den står |
| :-- | :-- | :-- |
| `{image: {id, altText}}` | `{id, altText}` på toppnivån | `setProductMedia` |
| `{catalogItemReference: {…}}` | `{appId, catalogItemId}` platt | `addProductToCollection` |

Repot hade svaret båda gångerna. Det är samma lärdom som "mät per endpoint",
fast en nivå enklare: **läs anroparen som redan fungerar.**

## ⚠️ Min verifieringsgrind fällde ett svenskt ord

Återläsningen flaggade `617ce9ff` för "1 tyska alt-texter". Ordet var
**Beige** — invändningsfri svenska, och det står inte i gatelibs tyska
ordlista. Jag hade skrivit en egen, kortare ordlista i verifieringsanropet
i stället för att använda den delade.

Det är tvillingregeln en gång till, och den här gången i en GRIND: en
handskriven ordlista i ett engångsanrop är per definition en kopia som
redan glidit. `gate-alt.py` gick rent på samma fil med gatelibs 103 ord.

## Vad fotona gav

Se `FOTOFYND.md`. Fyra fynd, och det dyraste är att `b99570fd` är
**gräddvit** medan källan säger `Farbe: Grau` — samma klass som M4:s vita
gran med `Farbe: Grün`.

Sju bilder borta: fyra tyska banners, en engelsk, och en som bär husmärket
i pixlarna. **Fyra av åtta förlorar sin måttritning** till just den tyska
mening Aosom lägger ovanpå måttbilden.

## Åtta tyska SKU:er bytta, noll kollisioner

Till skillnad från M4, där sju av åtta delade en sträng, var alla åtta
unika redan före bytet. De bytte ändå, för de var tyska:
`FP-2-in-1-schlafsessel`, `FP-2-sitzer-sofa-146-cm`,
`FP-zweisitzer-sofa-kompakt`, `FP-2-sitzer-sofa-kleines`,
`FP-2-sitzer-schlafsofa-aus`, `FP-218-cm-3-sitzer-sofa`,
`FP-3-sitzer-sofa-mit`, `FP-3-sitzer-ecksofa`.

## ✅ De fyra måttkorten är byggda och sitter på sidorna

De fyra som förlorade sin måttritning har fått ett eget svenskt kort sist i
galleriet — samma plats ritningen hade. Byggda med `scripts/cardkit.py`,
raderna hämtade ur produktens EGEN spec-flik.

| kort | bilder före | efter |
| :-- | --: | --: |
| `b99570fd` | 3 | **4** |
| `617ce9ff` | 4 | **5** |
| `45e68631` | 4 | **5** |
| `59aeb88a` | 4 | **5** |

☠️ **Fotnoten citerar inte källan.** `KORTLACKAN.md`: nio publicerade kort
bär Aosoms artikelnummer i pixlarna, för att den som byggde dem angav sin
källa — gott hantverk överallt utom här, eftersom ingen textgrind kan läsa
en sträng som ligger i en JPEG. Fotnoten säger bara `måtten i klartext ·
<färg och material>`.

☠️ **OCH KORTENS TEXT PASSERAR INGEN AV RUNDANS GRINDAR.** Första utkastet
till `617ce9ff` hade rubriken *"Smalast i sortimentet, med vingrygg"* — ett
superlativ om VÅR EGEN katalog, och omätt. `gate-superlativ.py` läser
`<kort>.html`, inte `bygg-kort.py`, så den kunde inte se det. Samma familj
som KORTLACKAN, en nivå tidigare: grinden finns, men kortet ligger utanför
det den läser. Rubriken är nu ett faktum (`Bara 117 cm bred`), och
kortrubrikerna grindades för hand mot samma frågeställning.

⚠️ Uppladdningen svarade `PENDING`, inte `READY`. Skrivningen kontrollerar
därför filstatus FÖRST och avbryter på allt som inte är `READY` — en fil som
inte hunnit bli klar var exakt mekanismen bakom *"524 lagade, 214 saknade
ändå bilder"*, och kortet hade blivit en tom ruta.

Verifierat i en separat läsning: 4 av 4 har kortet SIST, med rätt alt-text,
och brödtext, SKU, variantens synlighet och produktens synlighet orörda.

## Kvar efter rundan

- **`d372e8e9` har bara tre bilder.** Den behöll sin måttritning (bild 3 var
  ren), så den behöver inget kort — men galleriet är tunt.

## Live-verifieringen: 8/8 REN

Hämtade med `hamta-live.sh 330` — varm träff, 330 sekunders paus, skarp
hämtning. `age` låg på 340–341 på alla åtta, alltså ungefär pausens längd:
det är renderingen den varma träffen utlöste som lästes, inte en äldre
cachad sida. Alla åtta HTTP 200, 134–144 kB.

```
1fd11824  ord=508  diff=0  -> REN      d372e8e9  ord=524  diff=0  -> REN
b99570fd  ord=447  diff=0  -> REN      45e68631  ord=504  diff=0  -> REN
8aad177d  ord=467  diff=0  -> REN      59aeb88a  ord=501  diff=0  -> REN
617ce9ff  ord=499  diff=0  -> REN      fe56b0e6  ord=491  diff=0  -> REN
```

`REN` täcker varje svep i grinden — sid- och alt-svep, SEO mot `seo.tsv`,
homoglyfer, brödsmulan, skötselfliken, köpbarheten och korslänken.
