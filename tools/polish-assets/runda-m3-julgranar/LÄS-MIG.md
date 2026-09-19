# Runda M3 — körlogg

Åtta julgranar, 599–1 849 kr. Alla Aosom-utkast, alla publicerade.

## Steg för steg, med kvitton

| steg | utfall |
| :-- | :-- |
| Källor hämtade ordagrant | 8/8, kontrollsumma räknad i anropet |
| Källor bevisade mot `kvitto-kalla.json` | **8/8 LIKA** |
| Lagergrind i urvalet | 8/8 spårat saldo, 83–197 |
| Dubblettskärm på huvudbildens hash | 8 unika huvudbilder |
| Kontaktark byggt FÖRE brödtexten | 8 ark, 40 bilder |
| Homoglyfsvep före grindning | **0 fynd** (noll icke-latinska tecken i åtta filer) |
| Grindar (siffer/axel/alt/seo/sku/superlativ/länk) | 7 rena, noll varningar |
| Transkriberingsspärr FÖRE varje skrivning | **8/8**, rå kontrollsumma mot repofilen |
| Bilder skrivna | 37 (3 borttagna, se `bilder-bort.tsv`) |
| Alt-texter skrivna | 37, noll tyska |
| SEO skriven | 8 × två taggar, keywords rensade |
| Variant-SKU skriven | 8/8 svenska, unika, i eget sista anrop |
| Kategorier | **18/18** kopplade, noll fel, noll odetaljerade |
| Wix-återläsning mot facit | **8/8** på nio kontroller per produkt |

Alla workflow-körningar kördes med `ref` satt till den här grenen, aldrig mot
`main` (#181).

## ☠️ Transkriberingsspärren flyttades FÖRE skrivningen

Husets regel sedan `fontagen-weight` är att filen är källan men att bara en
diff mot den LAGRADE texten bevisar att källan kom fram. Det är sant och
otillräckligt: det upptäcker felet efter att kunden kan ha sett det.

Den här rundan räknar i stället kontrollsumman på den sträng som ligger i
API-anropet, i anropet självt, och **avbryter hela skrivningen** om den
avviker från filens:

```js
const avvik = plan.filter(p => SUMMA(p.html) !== p.raa);
if (avvik.length) return { AVBRUTET: "transkriberingsfel — ingenting skrivet", avvik };
```

Åtta texter, åtta träffar, noll avbrott. Kostnaden är en rad kod;
`fontagen-weight` kostade tre klösträd och en felsökningsrunda.

## ☠️ `plainDescription` finns INTE i standardprojektionen

Den första återläsningen rapporterade **0 tecken på alla åtta** och såg
därmed ut som att ingenting skrivits — samma larm som #255, men en annan
mekanism. Uppmätt direkt mot skarpa V3:

```
GET /stores/v3/products/{id}                      → nyckeln saknas HELT (typeof undefined)
GET /stores/v3/products/{id}?fields=PLAIN_DESCRIPTION → 3 434 tecken, rätt text
```

Det är alltså inte släpet från #255 och inte en misslyckad skrivning — det är
en projektion som utelämnar fältet, precis som `getProductMedia` utan
`MEDIA_ITEMS_INFO` och som `variantsInfo` i sökprojektionen.

☠️ **Och min kod gjorde det värre.** `p.plainDescription || ""` förvandlade
ett SAKNAT fält till "0 tecken" — ett tomt svar från rätt API mot rätt
produkt, som i loggen ser ut som ett bevis på att skrivningen föll. Samma
familj som `/api/tracking-events` 2026-09-01: **en läsare som blir TOM syns
varken i en kodaudit eller i en felräknare.**

**Regeln: en återläsning som rapporterar noll måste först bevisa att fältet
fanns i projektionen.** Tre fält krävs på den här rutten och inget av dem är
med som standard:

```
?fields=PLAIN_DESCRIPTION&fields=MEDIA_ITEMS_INFO&fields=DIRECT_CATEGORIES_INFO
```

⚠️ Och `directCategoriesInfo` bär bara `id` i den här projektionen, inte
`name`. En kontroll som läser `c.name` får `null` på varenda rad och kan
alltså aldrig fälla.

## ⚠️ Kategoriräkningen är alltid +1 — "All Products"

Åtta produkter kopplades till 2 (resp. 4) kategorier och läser tillbaka 3
(resp. 5). Den extra är `05e96cd6…` = **All Products**, som Wix sätter själv
och också använder som `mainCategoryId`. Ingen defekt; ett facit som räknar
bara de kopplade blir rött varje gång.

## ☠️ Alt-facit måste räknas på positionerna EFTER borttagningen

`d09b1b4c` föll i återläsningen med fel alt-summa. Orsaken var facit, inte
texten: bilderna 1, 2, 3, 5 blir **1, 2, 3, 4** när bild 4 tas bort, och min
facitsträng bar fortfarande `5:`. `5edc1480` och `bdc71526` slapp undan bara
för att deras borttagna bild råkade vara den SISTA.

Omräknad på nya positionerna: `406445962` mot Wix `406445962` — LIKA.

## Vad fotona gav

Se `FOTOFYND.md`. Fyra fynd, två av dem osynliga för varje textgrind: tre
granar med identisk källtext är tre olika granar, och `bdc71526` står i en
lykta som källan aldrig namnger.

## Bilder som togs bort

Se `bilder-bort.tsv`. En tysk instruktionsgrafik och en husmärkesplansch på
två produkter. ⚠️ Hash-svepet hittade planschparet men **inte** grafiken —
den är unik och därmed osynlig för varje teknik som grupperar på likhet.
M2:s regel gäller alltså åt båda hållen: hashen grupperar, den klassificerar
inte, och den ser bara det som råkar förekomma två gånger.

## Grindarnas eget kvitto

Fyra planterade fel, fyra träffar på rätt produkt och bara den:

| planterat | grind | utfall |
| :-- | :-- | :-- |
| `2 608` → `2 618` | `gate.py` | `[SIFFRA UTAN KÄLLA] '2618'` |
| tysk mening i en alt-text | `gate-alt.py` | två tyska rester på rätt rad |
| SEO-titel utan `\| Fyndplats` + tal utan källa | `gate-seo.py` | båda |
| dubblerad SKU | `gate-sku.py` | namnger båda produkterna |

⚠️ **Ett femte plant föll INTE — och det var rätt.** Jag kastade om
spec-radens `Mått:`-ordning och `gate-axel.py` teg. Grinden är med flit
skarpt avgränsad till PROSA-påståenden (`N cm bred`) efter #250:s falsklarm,
och spec-radens ordning ligger utanför vad den säger sig kontrollera. Ett
korrekt plant — `210 cm bred` på en 210 cm HÖG gran — fäller den direkt:

```
89d967af: 210 cm är produktens HOJD enligt tyska blocket (140L x 140B x 210H cm),
          men texten binder talet till BREDD. Rad: …210 cm bred…
```

Spec-radens ordning kontrollerades i stället en gång för hand mot det
positionella facit: 3 av 3 rätt där bredd/djup finns (de andra fem är
Ø-mått och har inget par att ordna).

## `bygg-axelfacit.py` kunde inte läsa en av åtta måttrader

`Gesamtabmessung: Ø105 x 180Hcm` — utan blanksteg före `cm`. Ett `\b` efter
axelbokstaven kräver ett icke-ordtecken, och `Hcm` har inget, så raden gav
noll par. Generatorn **avbröt** i stället för att skriva en tom facitrad
(#225-härdningen), vilket är precis vad som gjorde felet synligt.

Lookaheaden släpper nu igenom `cm`/`mm`/`m` direkt efter bokstaven och bara
dem. Verifierat åt båda hållen: `180Hcm` parsar, `180 Hinweis` och
`105 x 180 Hoehe` matchar fortfarande inte. M1 och M2 regenererar
byte-identiskt, alltså rör ändringen ingen tidigare runda.

## Live-verifiering: 8/8 REN, orddiff 0

Hämtad ISR-medvetet (`hamta-live.sh 90`): alla åtta var ännu färska (`age=0`),
så skriptet väntade ut hela 305-sekundersfönstret, träffade om dem och läste
först därefter. `age: 100` på alla åtta i den skarpa hämtningen — alltså den
rendering den varma träffen utlöste, inte en äldre cachad sida.

```
89d967af  ord=526  diff=0  REN      bdc71526  ord=586  diff=0  REN
5edc1480  ord=510  diff=0  REN      9f776653  ord=517  diff=0  REN
efba03f0  ord=475  diff=0  REN      28aa840d  ord=509  diff=0  REN
d09b1b4c  ord=583  diff=0  REN      e1d9dfe8  ord=634  diff=0  REN
```

### ☠️ Och ett plant som INTE fällde — för att det landade i JSON-LD

Första försöket att bevisa att grinden lever planterade ett kyrilliskt `т`
(U+0442) i ordet `lyktan` med `replace(..., 1)`. Resultatet var
`diff=0 -> REN`, vilket ser ut som en död grind.

Det var det inte. Ordet förekommer **16 gånger** i sidan, och den FÖRSTA
ligger i FAQ-blockets JSON-LD:

```
@16900   "acceptedAnswer":{"@type":"Answer","text":"120 cm inklusive lyktan."}
@41265   <p>Granen mäter 120 cm på höjden inklusive lyktan och 70 cm …
```

Grinden läser den RENDERADE brödtexten. Ett plant i strukturerad data bevisar
alltså ingenting — varken att grinden ser eller att den är blind.

Omplanterat på rad 41265 fäller den direkt, på rätt produkt och bara den, med
tre oberoende träffar:

```
bdc71526: ord=586 diff=2 -> 4 FEL
  ! ORDDIFF - lyktan
  ! ORDDIFF + lykтan
  ! HOMOGLYF 'т' U+0442: …inklusive lykтan och 70 cm i diameter…
  ! SIDA/HOMOGLYF 'т': …inklusive lykтan och 70 cm i diameter…
```

Och alt-svepet verifierades separat med en tysk mening i en alt-text: två fynd
på rätt produkt, noll på de andra sju. Återställt: **0 avvikelser**.

⚠️ **Regeln för den som kvitterar en grind: plantera där grinden LÄSER.** Ett
plant som inte fäller är tvetydigt tills man vet var det hamnade — och den
tveksamheten är precis vad en död grind gömmer sig i.
