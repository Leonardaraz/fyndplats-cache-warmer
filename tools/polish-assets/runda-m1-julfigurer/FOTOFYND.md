# Vad fotona sa INNAN texten skrevs — runda M1

Kontaktarket byggdes före brödtexten (regeln från runda J1). Den här rundan
betalade igen den regeln dyrare än någon tidigare: **två av åtta produkter har
ett tyskt produktnamn som motsäger produktens egen måttritning**, och båda
gångerna är det NAMNET som ljuger.

## ☠️ Två höjder i namnet som inte finns

| kort | namnet säger | måttritningen | källans spec | facit |
| :-- | :-- | :-- | :-- | :-- |
| `7278ea50` | "**1,8 m**" | 120 cm | `Maße: L100 x B55 x H120 cm` | **120 cm** |
| `be4a760b` | "**2 m**" | 2,38 m | `Gesamtmaße: 175L x 82B x 238H cm` | **238 cm** |

☠️ **`7278ea50` är det dyrare av de två, och mekanismen är värd att minnas:
1,8 m är SILHUETTEN.** Måttritningen ställer produkten bredvid en grå
människofigur märkt `180 cm`, och produkten själv är märkt `120 cm`. Någon har
läst av fel tal ur bilden och satt det i produktnamnet. En svensk text skriven
efter namnet hade lovat kunden en 180 cm hög snögubbe och levererat en på 120 —
en tredjedel bort, på det mått kunden faktiskt handlar efter.

⚠️ **Siffergrinden hade INTE fångat det.** Både 1,8 och 120 står i källan (det
ena i namnet, det andra i specen), så varje tal en text kunde ha använt är
"belagt". Det är samma klass som #217: grinden kan inte skilja ett tal i
NAMNET från ett tal i specen. Det som avgjorde var att ritningen lästes.

**Regeln: det tyska produktnamnets rubrikmått är inte en källa. Ta höjden ur
`Maße`/`Gesamtmaße` i specblocket, och kontrollera mot ritningen.**

## Två produkter är inte alls vad namnet påstår

- **`3225c539`** heter "Schneemann **Outdoor**" och ligger i en runda med
  uppblåsbara figurer — men den är **51 cm hög** (`Ø30 x 51H cm`), en liten
  figur i vit textil över stomme, batteridriven (3 × AA, ingår inte), 30 LED
  varav 3 blinkar. Fotona visar den på ett golv bredvid julklappar inomhus.
  Den är ingen trädgårdsfigur.
  ⚠️ Källan kallar den dessutom "**Lichterkette**" (ljusslinga) i första
  punkten. Det är Aosoms eget slarv — produkten är en figur, inte en slinga.
- **`5a14cc4d`** är inte uppblåsbar heller: två LED-trådfigurer i vit metall-
  och textilstomme, en stor björn **80 × 30 × 60 cm** och en unge
  **53,5 × 20 × 40 cm**.

## De tre pepparkaksgubbarna är TRE OLIKA figurer

Det var rundans öppna dubblettfråga. Bildskärmen gav **39 av 39 unika md5**,
men det är tillräckligt och inte nödvändigt bevis (#194) — fotona avgjorde:

| kort | huvudbonad | i handen | kläder | mått |
| :-- | :-- | :-- | :-- | :-- |
| `d0aeb070` | röd tomteluva | **lyst presentask** | grön väst, röd fluga | 250 × 135 cm |
| `be4a760b` | **svart cylinderhatt** med järnek | **polkagris** | röda shorts, svart fluga | 238 × 175 × 82 cm |
| `ef75aa9a` | röd tomteluva | inget, armarna ut | **grön halsduk** | 183 × 110 × 70 cm |

Tre olika figurer, tre olika storlekar. Texterna ska ändå göra skillnaden till
det FÖRSTA som skiljer sidorna åt — samma sak som cypressparet i L4.

## ☠️ Fem bilder måste bort — tre bär HUSMÄRKET inbränt

Det här är nytt för den här familjen: julsortimentets sista bild är en
marknadsföringsbild med leverantörens egen logotyp i pixlarna.

| kort | bild | vad som är inbränt |
| :-- | --: | :-- |
| `be4a760b` | 5 | **`Outsunny`** i stora lysande bokstäver i snön |
| `ef75aa9a` | 5 | **`HOMCOM by Aosom`** + *"Bringen Sie den Zauber der Feiertage in Ihr Zuhause."* |
| `69331178` | 5 | **`HOMCOM by Aosom`** + samma tyska mening |
| `7278ea50` | 4 | *"EINGEBAUTE LED LEUCHTEN / Leuchtendes nächtliches Display…"* |
| `7278ea50` | 5 | *"DAUERHAFTE MATERIALIEN / Wetterschutzklasse IP44"* |

☠️ Husmärket stryks annars ur TEXT och SKU vid varje polering — men här sitter
det i bilden, där ingen textgrind når det. Bilden är enda åtgärden.

⚠️ `7278ea50` bild 5 bär `IP44`, och det är ett värde värt att ha. Det behöver
dock inte läsas ur bilden: källtexten säger `IP44` två gånger i klartext. Ingen
`foto-tal.txt` behövs för den här rundan.

## Övrigt ur fotona

- `4fc04535` är en **lyktstolpe på 150 cm**, inte en fristående lykta: lykthuvud
  på stolpe, grangirlang med röd rosett runt stolpen, och en belyst grandekor i
  en träliknande kruka vid foten. Ritningen ger 150 cm höjd, 35 cm fot.
- `7278ea50` är en **familj på tre snögubbar** på en gemensam snöbollsfot, inte
  en. Källan säger "Schneemannfamilie"; namnet säger "Schneemänner Schneemann".
- `69331178` pingvinen: 2,5 m enligt både namn, ritning och källa — den stämmer.
