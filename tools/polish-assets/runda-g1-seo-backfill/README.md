# Runda G1 — SEO-backfill, som blev en lagerincident

⏸ **SEO-BACKFILLEN ÄR INTE GJORD.** Rundan startade som första batchen av de 49
sidor som bär tysk SEO-titel (#147). Innan en enda rad skrevs visade sidorna
något annat, och det tog över: **31 publicerade sidor gick inte att köpa.**

## Så hittades det

Batchens åtta sidor hämtades som källmaterial — meningen var att skriva
metabeskrivningen ur produktens egen publicerade svenska text. Alla åtta
innehöll ordet **Slutsåld**.

Fyra hypoteser föll i tur och ordning, och ordningen är poängen:

| hypotes | motbevis |
|---|---|
| Dold mallmarkup som tagg-strippningen gör synlig | F1:s klösträd har `Slutsåld` **0 ggr**, dessa **2 ggr** |
| Slut i lager på riktigt | Wix: `quantity 197`, `IN_STOCK` |
| Gammal ISR-rendering | En rendering **11 sekunder gammal** sa fortfarande `OutOfStock` |
| Butiken läser ett annat Wix-konto | Mina SEO-skrivningar syntes på F1:s live-sidor samma timme |

## ☠️ Orsaken: varianten har ett eget `visible`

```
produkt   visible: true    → sidan ligger ute, i sitemapen, indexerad
variant   visible: false   → butiken visar "Slutsåld"
lager     197, IN_STOCK    → varan finns
```

Huset kände till PRODUKTENS `visible` — CLAUDE.md 2026-08-28 dokumenterar att en
`variantsInfo`-PATCH publicerar ett utkast, och regeln blev att alltid skicka
tillbaka det. Varianten har ett eget, och det stod ingenstans.

⚠️ **Repots kod är oskyldig.** `createProduct` sätter `visible: v.visible ?? true`
och `updateV3VariantPrices` muterar varianterna från sin egen GET. Defekten
sitter i poleringens SKU-steg, som skrivs **för hand från chatten** — Wix-variantens
SKU har ingen egen rutt, så den PATCHas med ett handbyggt variantobjekt.

☠️ **Regeln: bygg aldrig ett variantobjekt från grunden.** Läs produkten, ta
objektet som det står, ändra bara fältet du menar.

## Omfattning och åtgärd

Hela den publicerade katalogen skannad — 2 032 produkter i fyra slices, 100 %
täckning. `variantsInfo` finns **inte i sökprojektionen**, så det krävs en GET
per produkt, och 2 032 GETs ryms inte i ExecuteWixAPI:s 60 sekunder.

| | |
|---|--:|
| Publicerade | 2 032 |
| **Helt dolda varianter (oköpbara)** | **31** |
| Delvis dolda | 0 |
| Lagade | **31** |
| Live-verifierade `InStock` | **31 / 31** |

Varje skrivning återläst i Wix: 0 → 1 synlig variant, produktens synlighet
oförändrad, **pris och SKU orörda på alla 31**.

⚠️ **Ett verifieringspass räcker inte.** Sex sidor såg först ut att vara kvar
som slutsålda. Varje sida cachas för sig, så passets egen första hämtning
serverade den gamla renderingen och triggade omrenderingen. Andra passet gav
`age` 32–36 s och `InStock` på alla sex.

Listan över de 31 ligger i `lagade.txt`.

## Kvar

- **SEO-backfillen** för de 49 (#147) är fortfarande ogjord. `slugs.txt` här är
  de åtta som var tänkta som första batch.
- En återkommande koll vore billig: *"publicerad produkt utan en enda synlig
  variant"* är alltid ett fel.
