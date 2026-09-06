# Runda G1 — åtta gungstolar, 1 599–1 839 kr

Publicerade, stämplade, kortförsedda och live-verifierade 2026-09-06.

| kort | pris | vad som skiljer den från syskonen | SKU |
|---|--:|---|---|
| `25405611` | 1 639 | gul manchester | `FP-gungstol-gul-manchester` |
| `3b5a67d9` | 1 599 | ljusgrå manchester | `FP-gungstol-ljusgra-manchester` |
| `3dbd4f08` | 1 649 | beige manchester | `FP-gungstol-beige-manchester` |
| `48432e48` | 1 619 | mörkgrå sammetslook, rutstickad rygg | `FP-gungstol-morkgra-sammet` |
| `bde44d3c` | 1 739 | grå teddy, sidoficka, helt stativ i metall | `FP-gungstol-gra-teddy-sidoficka` |
| `4f98b924` | 1 839 | gräddvit teddy, knappad rygg, gummiträ | `FP-gungstol-graddvit-knappad` |
| `dd4e1e06` | 1 729 | ljusgrå teddy, rutstickad rygg | `FP-gungstol-ljusgra-rutstickad` |
| `b4441140` | 1 629 | gräddvit teddy, rutstickad rygg | `FP-gungstol-graddvit-rutstickad` |

Kvittona, alla mätta och inte antagna:

| | |
|---|--:|
| Bilder i galleriet, diffade mot facit | **48 / 48 identiska** |
| Kortet på plats 3 | **8 / 8** |
| Måttskissen sist (de sju som har en) | **7 / 7** |
| Live-grinden (orddiff, alt, SEO, kategori, skötselflik) | **8 / 8 REN, 0 avvikelser** |
| JSON-LD `InStock` / `OutOfStock` | **8 / 0** |
| Mappningsrader stämplade | **8 / 8 gröna** |
| Pris orört efter varje skrivning | **8 / 8** |

## ☠️ Alt-texterna hade ingen filgrind alls

`gate.py` läser bara `*.html`. `alt.tsv` gick därför hela vägen till Wix
ogrindad, och en **dansk stavning** följde med: *"ett litet **rundt** bord"*.
Den nådde aldrig kunden — men bara för att nyttolasten råkade skrivas om för
hand i en omgång, alltså av tur och inte av en spärr. Det som fångade den var
återläsningens diff mot facit, ett steg för sent.

Huset har lärt sig samma sak en gång förut, ett steg SENARE i kedjan: ett
sidsvep som strippar taggar ser inte in i `alt=""` (batch 66). Det här är
samma blinda fläck FÖRE skrivningen.

`gate-alt.py` kör nu samma mönstergrindar som brödtexten plus siffergrinden på
alt-texterna. Verifierad genom att återinföra åtta fel, ett i taget — dansk
stavning, husmärke, artikelnummer, fraktland, påhittat mått, tysk rest, en
saknad bild och en dubbel källposition. Alla åtta fälls, den återställda filen
är ren.

## ☠️ Och kortgrinden gatade fel sak

`gate-kort.py` byggde en EGEN etikettlista och kontrollerade den mot sidan, i
stället för att läsa de rader byggaren faktiskt renderar. Mutationstestet
avslöjade det: ett påhittat `"Ekfanér och läder"` i byggaren gick **rakt
igenom** grinden.

Byggaren exponerar därför raderna som `kort_rader()`, och grinden anropar den.
Det som gatas är nu det som renderas. Efter fixen fälls alla tre mutationerna:
påhittat värde, en nionde rad, och en rad som tagits bort.

**Regeln: en grind som bygger sin egen kopia av det den ska granska gatar
kopian, inte originalet.** Samma familj som `SHIP_AXIS_RE` och `EU_TULL_CODES`
— tvillingar glider isär.

## ⚠️ Sex av åtta delar sina mått med ett syskon

Fyra manchester/sammet har IDENTISKA tal (98 × 71 × 101 cm, sittyta 54 × 49,
sitthöjd 47, rygg 73 × 66, 120 kg, 14 kg); `dd4e1e06` och `b4441140` likaså.
Ett kort som upprepar det som är lika gör ingen nytta, så rubrikparen säger
vad som SKILJER: tyget, ryggens behandling och färgen. Grinden fäller två kort
som fått samma rubrikpar — samma lärdom som F2:s 140/160 cm-par.

Familjerna bär också olika femte rad, och det är RÄTT: manchesterstolarnas
källa anger `Dyntjocklek` men ingen gungvinkel, teddystolarnas tvärtom. Kortet
tar den etikett produktens EGEN källa har; att tvinga in samma etikett på båda
hade betytt ett påhittat värde.

## Tre API-fynd, alla uppmätta

1. ☠️ **`wix.request` läser `body`, inte `data`.** En `data`-nyttolast skickas
   som TOM kropp, och API:t svarar `products has size 0, expected 1 or more`.
   Felet pekar alltså på innehållet i det man skickade, medan felet är
   FÄLTNAMNET. En självkontroll i koden (`products.length !== 4 → avbryt`)
   passerade glatt: arrayen var byggd, den kom bara aldrig fram.
2. ☠️ **`?fields=` i URL-strängen ger `400 Failed to parse JSON`** på en GET.
   `params: { fields: … }` fungerar — men för produktmedia räcker inte heller
   det: `media.itemsInfo.items` kom tillbaka **tom** på båda formerna. Enda
   vägen till galleriet är `products/search` med `fields: ["MEDIA_ITEMS_INFO"]`.
   En tom lista ser för en läsare ut precis som en produkt utan bilder.
3. ⚠️ **`variantsInfo.variants.sku` går INTE att filtrera på** — varken `$in`
   eller `$eq` ("is using non allowed operator"), och `VARIANTS_INFO` är inget
   giltigt `fields`-värde i sökningen. Frågan *"är den här SKU:n ledig i
   katalogen?"* går alltså inte att ställa i bulk; den kräver en GET per
   produkt. Det är mätt belägg för öppna punkten om katalogomfattande
   SKU-dubblettrevision.

☠️ **Och min egen SKU-spärr gick fel väg.** Kollisionskontrollen kastade
(`$in` icke tillåten), felet fångades i ett `try` — och koden skrev ändå.
En kontroll som inte kunde köras såg ut som en kontroll som gick igenom.
Precis det mönster huset skrivit ned nio gånger. SKU:erna var lediga (alla
åtta bar tidigare bara två tyska strängar, `FP-vintage-schaukelstuhl` ×4 och
`FP-schaukelstuhl` ×4), men det visste inte koden när den skrev.

## Ordningen som användes

Text → bilder + alt → **Steg 8 och publicering i SAMMA skrivning** → kategori
→ kort på plats 3 → ISR-cykel → live-grind. SKU och publicering hör ihop av
skäl huset betalat för: en sen `variantsInfo`-PATCH speglar variantens
`visible` ned till `false` och gör sidan oköpbar medan den ligger publicerad.

Kategorin är **`Hem & Inredning` utan löv** — trädet har inget sittmöbel-löv,
och husets regel är att toppkategorin räcker då. Kvittot är brödsmulan i den
renderade sidan, inte API-svaret: varken `categoryIds` (produktsökningen) eller
kategorins postlista går att fråga.
