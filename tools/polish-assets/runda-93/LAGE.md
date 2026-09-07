# Runda 93 — läge

## Klart och verifierat

| | `8ea111a2` beige | `9304f8b8` mörkbrun | `bef14fba` brun |
|---|---|---|---|
| Text, namn, slug, SEO | ✅ | ✅ | ✅ |
| Sökord satta | ✅ | ✅ | ✅ |
| SKU (unik) | `FP-pergolatak-250x255-beige` | `…-morkbrun` | `…-brun` |
| Variant `visible` | true | true | true |
| Kategorier (2 löv) | 2/2 | 2/2 | 2/2 |
| Pris (orört) | 599 | 599 | 569 |
| Lager | i lager | i lager | **slut** |
| Publicerad | **NEJ** | **NEJ** | **NEJ** |

Grindar: lint 0 brister · självtest 12 regler · muteringstest 16/16 ·
återläst text jämförd påstående för påstående mot filen.

## ☠️ VARFÖR DE INTE ÄR PUBLICERADE

Åtta av femton bilder bär **tysk text inbränd i pixlarna**
(*"Nur Dach (ohne Rahmen)"*), och fyra av dem bär dessutom logotypen
**`Outsunny by Aosom`**. Att publicera nu vore att lägga ut leverantörens namn
och ett främmande språk på kundens sida — husets hårdaste regel.

Bilderna är **räddningsbara**: texten och logotypen ligger i himlen upptill,
alltså i ett band som runbokens metodtabell säger ska beskäras bort, inte
kastas. Kvar står också att `bef14fba`:s bild 4 och 5 visar en **khaki** duk,
inte den bruna — de två ska bort oavsett beskärning.

**Det som återstår innan publicering:**

1. Beskär bort toppbandet på bild 2, 4 och 5 (beige + mörkbrun) och bild 2
   (brun). Kontrollera att duken inte kapas.
2. Ta bort `bef14fba` bild 4 och 5 — fel färgvariant.
3. Ladda upp de beskurna bilderna och skriv om galleriet.
4. Bygg tre Fyndplats-kort och pusha dem till grenen först.
5. Alt-texter på svenska, unika per bild.
6. Prisgrind + mappningsstämpel via `polish-mapping.yml`.
7. Publicera, live-verifiera.

⚠️ `bef14fba` är **slut i lager**. Den blir "slutsåld" direkt vid publicering.
Överväg att publicera de två andra först.

## Var facit ligger

`facit.json` (hash över SYNLIG text), `html-<id>.html` (exakt kropp som
skrevs), `texter.py` (källan), `lint.py`, `mutationstest.py`, `facitgen.py`.
