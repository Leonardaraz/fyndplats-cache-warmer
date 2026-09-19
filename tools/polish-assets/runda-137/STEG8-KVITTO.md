# Runda 137 Steg 8 — SKU-resynk

Steget har TVÅ halvor och de skriver till olika ställen. Wix-halvan är den
kunden och feeden ser; mappningshalvan är den bokföringen ser.

## Halva 1 — Wix variant-SKU (`variantsInfo`-PATCH)

Verifierat med en **separat GET efter skrivningen**, inte med PATCH-ekot, och
jämfört **sträng för sträng** mot husregelns svar — inte "finns en SKU".

| pid | SKU | revision | sträng | pris | produkt | variant | bilder |
|---|---|--:|---|---|---|---|---|
| `c7bd00b9` | `FP-klostrad-takspant-ek` | 4 | **OK** | ORÖRT | false | true | 5 → 5 |
| `a73a1a1c` | `FP-klostrad-takspant-gratt` | 3 | **OK** | ORÖRT | false | true | 5 → 5 |
| `f5f71f5d` | `FP-klostrad-90-cm-cremevit` | 3 | **OK** | ORÖRT | false | true | 5 → 5 |
| `dd3b541b` | `FP-klostrad-90-cm-gratt` | 3 | **OK** | ORÖRT | false | true | 5 → 5 |
| `f489937f` | `FP-klospelare-91-morkgra` | 3 | **OK** | ORÖRT | false | true | 5 → 5 |
| `5616c567` | `FP-klospelare-91-ljusbrun` | 3 | **OK** | ORÖRT | false | true | 5 → 5 |
| `1ae60dbc` | `FP-kattrappa-66-cm-beige` | 3 | **OK** | ORÖRT | false | true | 5 → 5 |
| `819bf51c` | `FP-kattrappa-66-cm-ljusgra` | 3 | **OK** | ORÖRT | false | true | 5 → 5 |

Alla åtta bar `FP-deckenhoher-kratzbaum`, `FP-kratzbaum…` eller motsvarande
TYSK sträng före skrivningen — och de fyra takspända delade den inbördes.
Det är exakt den krock uppgift #473 och runbookens barstolsavsnitt beskriver,
och den är borta nu.

## ☠️ Wix KRÄVER `price` i variantobjektet — och det är en prisrisk

Första försöket skickade `{id, sku, visible}` och avvisades:

```
product.variantsInfo.variants[0].price — must not be empty (REQUIRED_FIELD)
```

En SKU-skrivning kan alltså inte undvika att röra prisfältet. Det finns bara
ett säkert svar, och det är husets eget från `updateV3VariantPrices`: **läs
priset och eka tillbaka exakt samma sträng.** Aldrig räkna, aldrig hämta ur
facit, aldrig runda.

Tre spärrar i skrivningen, alla åt samma håll:

1. **Saknas `price.actualPrice.amount` i läsningen skrivs INGENTING.** Ett
   utelämnat fält är inte ett nolltal — samma regel som att hellre utelämna
   `visible` än gissa det.
2. **Priset jämförs mot facit FÖRE skrivningen.** Skiljer det sig har något
   annat rört produkten sedan Steg 3, och då är det inte SKU-stegets sak att
   skriva över det.
3. **Priset läses tillbaka EFTER och jämförs mot facit igen.** Kolumnen
   `pris` ovan är den mätningen, inte en förhoppning.

## ☠️ `visible` skickas explicit i BÅDA leden

En `variantsInfo`-PATCH publicerar annars utkastet (uppmätt mot skarpa V3
2026-08-28), och produktens `false` speglas ned på varianten. Bodyn bär
därför `product.visible` oförändrat OCH `variants[].visible` per variant,
med `visible` i fältmasken. Återläsningen visar båda: produkten `false`,
varianten `true` — åtta av åtta.

## ⚠️ Bildräkningen är vakten mot uppgift #501

`variantsInfo`-PATCH:en nollar variantens `media`-pekare. Här är det
harmlöst — alla åtta är enkelvariantsprodukter (`choices: []`) och galleriet
ligger i `media.itemsInfo` — men det ska MÄTAS, inte antas. Kolumnen
`bilder` är läst före och efter varje skrivning: 5 → 5 på alla åtta.
