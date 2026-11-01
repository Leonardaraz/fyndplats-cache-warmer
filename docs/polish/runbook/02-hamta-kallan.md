## 2. Hämta källan

Läs varje produkt med en GET:

```
GET https://www.wixapis.com/stores/v3/products/{id}?fields=PLAIN_DESCRIPTION&fields=MEDIA_ITEMS_INFO&fields=DIRECT_CATEGORIES_INFO
```

Läs sedan saldot för hela rundan i ett anrop:

```
POST https://www.wixapis.com/stores/v3/inventory-items/query
{ "query": { "filter": { "productId": { "$in": [ … ] } }, "cursorPaging": { "limit": 100 } } }
```

Skriv filerna:

| fil | rad |
|---|---|
| `ids.tsv` | `kort ⇥ produkt-id ⇥ pris och tyskt namn` |
| `bilder.tsv` | `kort ⇥ position ⇥ wix-fil-id` |
| `variant.tsv` | `kort ⇥ variant-id` |
| `lager.tsv` | `kort ⇥ saldo` |
| `kallor.json` | `{ "kort": "källtext" }`, alltså `plainDescription` med artikelnumren redigerade |

Skriv filerna ur verktygssvaret med ett skript och redigera artikelnumren redan i det
steget. Skriv aldrig av en källtext eller ett id. Ett Aosom-utkast har en enda variant och
inga variantval. En VEVOR-familj har en variant per artikel.

**Läs mappningsraden** för varje produkt med **"Polering — läs och stämpla mappningsraden"**
(`polish-mapping.yml`, `mode` = `las`, en produkt per körning). Svaret säger:

- **prisgrinden:** STÄMMER, PRISGRINDEN FALLER (drift: rör inte priset, välj en annan
  produkt eller flagga), SLUTSALD, LÅST PRIS eller EJ AVGÖRBAR,
- för VEVOR **`vevorGranskning`**: `gpsr`, `medicinteknik` och `bildgranskning` (se
  VEVOR-avsnittet).

Det är den enda kontrollen av priset och av VEVOR-flaggorna, för skrivsteget gör ingen.

### Vad källan är värd

Den tyska texten har tre delar, och de är olika mycket värda. Till dem kommer importens
svenska spec-block.

- **`Lieferumfang`** är det som ligger i kartongen. Den raden gäller.
- **`Technische Daten` och `Produktdetails`** ger mått och laster.
- **Titeln, `Beschreibung` och säljpunkterna** är marknadsföring. Titelns kategoriord är en
  hypotes: en "Gaming Stuhl" kan vara en kontorsstol, en "Frühbeet" en odlingslåda utan
  lock och en "Esszimmerstuhl" en bänk. `Lieferumfang` och bild 1 och 2 avgör. Importens
  alt-texter är titeln i ny form och inget eget vittne.
- **Spec-blocket** (`Mått`, `Färg`, `Material`, `Vikt`, `Paketmått`) kommer ur feedens
  kolumner, inte ur den tyska texten, och kan säga emot den:
  - ☠️ **`Vikt` är fraktvikten**, alltså feedkolumnen `Weight (incl. Package)`. Anger den
    tyska texten ingen produktvikt (`Gewicht`) skriver du `Fraktvikt: X kg` i spec-tabellen,
    och du skriver aldrig i löptexten att varan väger X. `gate.py` fäller båda.
  - `Mått` kan ha axlarna i fel ordning. Måttritningen avgör geometrin.
  - `Färg`-värdet står kvar på tyska. Översätt det efter bilden.
  - Blocket kan vara lånat från en annan modell. Saknas måttritning prövar du proportionerna
    mot studiobilden, till exempel hjulets andel av höjden.

**Ett tal som är exakt detsamma som grannfältets är misstänkt**, till exempel en stol vars
djup är exakt bordets eller en vikt som är exakt syskonets. Läs om fältet. Ett tal du inte
kan belägga står inte på sidan.
