# Runda K8 — åtta kontorsstolar 1 099–1 249 kr

Familjen K:s billigaste hälft. Åtta produkter, tre färgpar och två ensamma.

| kort | pris | saldo | vad |
| :-- | --: | --: | :-- |
| `29549b48` | 1 249 | 96 | Kontorsstol vit ram, grå nätrygg, uppfällbara armstöd |
| `909b7596` | 1 169 | 70 | Samma stol helsvart |
| `ad27954b` | 1 249 | 61 | Ritstol svart, nätrygg, fotring Ø46 |
| `c131b430` | 1 229 | 64 | Samma ritstol i grått |
| `ad3aa881` | 1 169 | 185 | Kontorsstol grå, 74 cm rygg, flyttbart nackstöd |
| `82d5fa29` | 1 149 | 64 | Samma stol helsvart |
| `cea5a0ce` | 1 249 | 63 | Ritstol svart, fotring 21–39,5 cm |
| `ace8d130` | 1 099 | 88 | Chefsstol svart konstläder + nätväv, metallkryss |

Prisgrinden `stämmer: true` på alla åtta. `aosomFreightShare` 0,352–0,407 — ingen
över 0,5. Lägsta saldo 61.

## ☠️ Sju av åtta delade SKU med varandra — värsta kollisionen hittills

`las`-svaren lästa mot varandra före stämplingen, precis som regeln säger:

| tysk SKU | produkter |
| :-- | --: |
| `FP-burostuhl-ergonomischer` | **4** (29549b48, 909b7596, ad27954b, c131b430) |
| `FP-burostuhl` | **3** (ad3aa881, 82d5fa29, cea5a0ce) |
| `FP-burostuhl-drehstuhl` | 1 (ace8d130) |

Importen härleder SKU:n ur den tyska titelns första ord, och sju av åtta
produkter börjar på `Bürostuhl`. Batch 66 hittade sex produkter på två SKU:er;
det här är sju på två. Alla åtta har nu en egen svensk SKU på BÅDA sidorna.

## ☠️ Variant-SKU takas på 40 TECKEN i Wix

Nytt uppmätt tak. `FP-chefsstol-svart-konstlader-metallkryss` är 41 tecken och
avvisades:

```
sku has size 41, expected 40 or less   violatedRule: MAX_LENGTH  threshold: 40
```

Anropet var en PATCH med två produkter. Den FÖRSTA gick igenom, den andra föll —
alltså en halvskriven runda om felet inte upptäckts. Kortad till
`FP-chefsstol-svart-konstlader-metall` (36) och omkörd. Mät SKU-längden i
`sku.tsv` innan skrivningen; en `awk`-rad räcker.

## ☠️ `variant_skus` i workflowen är JSON, inte `id=sku`

Alla åtta första stämplingsförsöken föll med
`jq: error … Invalid numeric literal at EOF`. Formatet är
`{"<wixVariantId>":"<sku>"}`. Felet ligger FÖRE anropet, så ingenting skrevs —
men det kostade åtta körningar. Beskrivningen i workflowen säger det;
jag läste den inte.

## Bilderna: tre borttagna

| kort | pos | varför |
| :-- | --: | :-- |
| `ad27954b` | 4 | tysk text inbränd (*Ergonomischer Leinen-Sitz*, *Ausgewählter Gaslift*) |
| `c131b430` | 4 | samma grafik |
| `82d5fa29` | 4 | ENGELSK text inbränd (*ADJUSTABLE HEADREST*, *Up/Down*) |

Den engelska är värd en rad för sig: mönstergrindarna letar efter tyska, och en
engelsk marknadsföringsgrafik är lika oanvändbar på en svensk sida. Den fångades
av ögat på kontaktarket, inte av en grind.

## ☠️ Kontaktarket FÖRE texten fällde tre saker

J1-regeln tillämpad, och den betalade sig tre gånger:

1. **`29549b48` är VIT, inte grå.** Källan säger `Farbe: Grau` — men ramen, foten
   och armstöden är vita på fotot; det är väven och sitsen som är grå. Namnet,
   texten och alt-texterna säger nu "vit ram, grå nätrygg". En text som bara
   följt källan hade sagt fel om det första kunden ser.
2. **`ad27954b` och `c131b430` har OLIKA måttritningar** — 66 cm djup och
   56–76 cm sitthöjd på den svarta, 76,5 cm djup och 24–41 cm fotringshöjd på
   den gråa. Källtexterna är däremot IDENTISKA utom `Farbe`. Ritningarna är
   alltså renderade var för sig med olika pilar, inte två olika stolar. Texten
   följer källan; inga ritningstal är skrivna.
3. **Två armstödshöjder som ritningen och källan är oense om.** `ad27954b`:
   ritningen säger 18 cm, källan 25 cm över sitsen. `cea5a0ce`: ritningen 14 cm,
   källan 16 cm. **Ingen av dem är skriven i texten** — ett tal som motsägs av en
   bild på samma sida är värre än inget tal. (`ad3aa881`/`82d5fa29` har
   `Armlehnenhöhe: 18 cm` i KÄLLAN och där är 18 skrivet.)

## ⚠️ Två viktkonflikter, medvetet lämnade

| kort | tysk `Gewicht` | svensk `Vikt` |
| :-- | --: | --: |
| `ad27954b` / `c131b430` | 11 kg | **13,9 kg** |
| `ace8d130` | 10 kg | **13,6 kg** |

Läsningen är att den svenska raden är fraktvikt inklusive emballage och den
tyska är produktvikten. Spec-blocket bär den svenska raden, som hela huset gör;
brödtexten nämner ingen produktvikt på de tre. `ad3aa881` (12,65) och `82d5fa29`
(12,6) har ingen konflikt och står i texten.

## Korslänkar

Tre färgpar länkar till varandra. Dessutom länkar de två ritstolarna
(`ad27954b` ↔ `cea5a0ce`) med den skillnad som faktiskt spelar roll:
fotringen ställs 33–43 cm på den ena och 21–39,5 cm på den andra.
`ace8d130` länkar till `82d5fa29` — konstläder mot nätväv i samma prisband.

## Grindar

| grind | utfall |
| :-- | :-- |
| `gate.py` | 0 fynd i 8 filer |
| `gate-alt.py` | REN, 8 produkter, 37 alt-texter |
| `gate-seo.py` | 0 fynd i 8 rader |
| `gate-lager.py` | 0 fynd, lägsta saldo 61 |
| `gate-lankar.py` | 0 fynd, 8 länkar inom rundan |
| `hasha.py` → återläsning | **8/8 LIKA** |

Alla fem filgrindar rena i FÖRSTA körningen. Kategori `Hem & Inredning`
kopplad 8/8 enligt bulk-svarets `itemMetadata`.

⚠️ `All Products` går inte att koppla för hand — den är app-styrd och svarar
`403 MANAGED_CATEGORY_OPERATION_NOT_ALLOWED`. Produkterna hamnar där av sig
själva. Bara `Hem & Inredning` ska kopplas.

## Live-verifierat 2026-09-08 — 8/8 REN

Hämtat ISR-medvetet (varm träff, 305 s, skarp hämtning): alla åtta HTTP 200 med
`age: 100`, alltså renderingar som den varma träffen utlöste — inte cachade
sidor från före skrivningen.

| kort | ord | orddiff |
| :-- | --: | --: |
| `29549b48` | 568 | 0 |
| `909b7596` | 509 | 0 |
| `ad27954b` | 569 | 0 |
| `c131b430` | 558 | 0 |
| `ad3aa881` | 548 | 0 |
| `82d5fa29` | 519 | 0 |
| `cea5a0ce` | 570 | 0 |
| `ace8d130` | 576 | 0 |

`livegrind.py` kör sju svep per sida och alla sju är rena: orddiff mot
källfilen, homoglyfer, sidsvep, **alt-svep**, **SEO-svep exakt mot `seo.tsv`**,
de tre obligatoriska flikarna, kategorins brödsmula, köpbarheten
(ingen `OutOfStock`) och att korslänken överlevt.

De åtta interna korslänkarna är därmed kontrollerade — `gate-lankar.py` kunde
per konstruktion inte hämta dem före skrivningen, eftersom målen då var utkast.
