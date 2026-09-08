# Brödsmulan: en produkt ska ha EN toppkategori (2026-09-08)

Butiken renderar tre nivåer — `Hem / <toppkategori> / produkt` — och väljer
**EN** toppkategori när produkten ligger direkt under flera. Lövet visas aldrig.
Vilken av topparna som vinner är inte styrt av oss, så två produkter med
identiska kategorimängder kan få olika brödsmula. Uppmätt: två växthusöverdrag
med exakt samma kategorier landade under var sin topp.

Omfattningen, mätt över hela katalogen:

| | före | efter |
|---|---:|---:|
| Produkter med en toppkategori | 2 106 | **2 184** |
| Produkter med FLER än en | **236** | **163** |

## ☠️ Det här är en NAVIGATIONSändring, inte en kosmetisk fix

Mätt innan en enda rad skrevs, och det är mätningen som avgjorde omfattningen:

```
Produkter i Förvaring & Organisering:                257
Av dem som syns på Hem & Inredning-sidan:            254
Som inte syns där:                                     3
```

**Toppkategorisidan rullar alltså INTE upp sina löv.** Att ta bort en direkt
topplänk tar därmed bort produkten från den listningssidan — den slutar synas
i den kategorin, inte bara i brödsmulan. Därför är det inte en fix man kör
över allt som ser fel ut.

## Vad som faktiskt kördes

Regeln: **behåll den toppkategori som är förälder till produktens löv, ta bort
den andra** — och bara där den borttagna INTE är `Hem & Inredning`, så ingen
produkt lämnar möbellistningen.

- 236 berörda → 139 avgörbara, 97 tvetydiga (löv under båda topparna, eller
  inget löv alls).
- Av de 139 skulle 61 ha lämnat `Hem & Inredning`. **De är INTE körda** —
  Leonards beslut (#204/#207): 31 massagestolar, 24 gaming-/kontorsstolar,
  6 övriga.
- **78 kördes.** `plan-2026-09-08.tsv` är ångerposten: `produktId · behåll ·
  togs bort`, en rad per produkt. Ångra genom att lägga tillbaka kolumn 3.

Borttag per kategori, med bulk-svaret som kvitto:

| kategori | skickade | lyckade | misslyckade |
|---|---:|---:|---:|
| Trädgård & Utemöbler | 39 | 39 | 0 |
| Barn & Familj | 17 | 17 | 0 |
| Kök & Husgeråd | 13 | 13 | 0 |
| Elektronik & Tillbehör | 7 | 7 | 0 |
| Sport & Fritid | 1 | 1 | 0 |
| Skönhet & Hälsa | 1 | 1 | 0 |

## Tre egenskaper i körningen som inte ska tas bort

1. ☠️ **Förkontrollen ligger FÖRE skrivningen och avbryter hela jobbet.**
   Varje rad lästes tillbaka och måste bära exakt två toppkategorier, och de
   två måste vara precis `behåll` och `ta bort`. 78/78 stämde; hade en enda
   fallit hade ingenting skrivits. En delvis körd kategoriändring är svårare
   att upptäcka än en orörd — samma argument som marginalgolvet i
   `price-repair`, som blockerar HELA produkten och aldrig en variant.
2. ☠️ **`All Products` är också en toppkategori och ska räknas BORT.** Wix
   egen samlingskategori ligger utan förälder precis som de riktiga topparna,
   och den ligger på varenda produkt. Räknas den med bär alla 2 347 produkter
   "flera toppkategorier" och mätningen blir meningslös. Den första
   förkontrollen föll på just det: 78 av 78 rapporterades avvikande.
3. ⚠️ **Kategoriläsningen släpar efter skrivningen.** Två av 78 lästes tillbaka
   med båda topparna kvar direkt efter bulk-svaret; en omläsning strax efter
   visade en enda topp på båda. **Facit är bulk-svarets `bulkActionMetadata`**,
   precis som lagersynkens `tolkaBulkUtfall` — en snabb återläsning kan
   UNDERrapportera, och en omkörning på den signalen är ofarlig men
   vilseledande.

## Verifierat live

Tolv sidor, en ur varje borttagsgrupp plus de två som läste tillbaka trögt.
ISR-medveten hämtning (varm träff → 305 s → skarp hämtning, `age` 413–449 s,
alltså renderingar som startade EFTER skrivningen). **12 av 12 brödsmulor
visar exakt den kategori planen säger.**

⚠️ Två av dem är värda ett öga: redskapsskåpet `ca9e1fa5` och soptunneskyddet
`af27fffe` står nu under `Hem & Inredning`, inte `Trädgård & Utemöbler`. Det
är regeln som gör det — deras löv ligger under hemmet — och brödsmulan är
därmed förutsägbar. Om Leonard hellre vill ha dem i trädgården är det en rad
att vända i `plan-2026-09-08.tsv`.
