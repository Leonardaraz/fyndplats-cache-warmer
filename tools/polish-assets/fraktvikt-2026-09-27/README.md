# Fraktvikten i B1–B19 (2026-09-27)

## Felet

Importens spec-rad `Vikt` är feedkolumnen `Weight (incl. Package) in kg`, alltså vikten
med förpackning. Rundorna B1–B19 skrev av den som varans vikt: **142 av 147 sidor** med en
importviktrad bar den som `Vikt`, och ett tjugotal sa dessutom i löptexten att varan väger
så mycket. Runbooken hade regeln redan, men ingen grind höll den.

Samma fel finns i **616 texter i 69 äldre rundor**, och i 131 av dem står det i löptexten.

## Rättelsen

| steg | vad | var |
|---|---|---|
| filerna | etiketten `Fraktvikt`, löptexten omskriven ("paketet väger …"), planerna ombyggda | `2ecc4efb` |
| Wix | workflowen **"Polering — skriv en runda till Wix"**, läget `skriv`, en runda i taget | körningarna nedan |
| grinden | `gate.py` fäller importens vikt under etiketten `Vikt` och i "väger X kg" | `a33696c0` |
| resten av katalogen | tredje saxen i **"SEO — städa publicerad produkttext"**, verkar efter merge | `8ba08bff` |

Grinden är prövad åt båda hållen: mot B-filerna före rättelsen fäller den exakt de 142
sidorna, och mot filerna efter rättelsen ingen.

### Skrivningarna

Alla nitton slutade `success`, alltså skrivna, återlästa och stämplade.

| runda | körning | runda | körning |
|---|---|---|---|
| B1 | 36309857237 | B11 | 36311541597 |
| B2 | 36310015368 | B12 | 36311692310 |
| B3 | 36310174591 | B13 | 36311880138 |
| B4 | 36310325129 | B14 | 36312027851 |
| B5 | 36310576435 | B15 | 36312167758 |
| B6 | 36310717828 | B16 | 36312348134 |
| B7 | 36310869722 | B17 | 36312499745 |
| B8 | 36311009376 | B18 | 36312646042 |
| B9 | 36311229493 | B19 | 36312799953 |
| B10 | 36311390554 | | |

## Live

`hamta-live.sh 130`, `livegrind.py` och `livekoll.py` per runda, 10:28–11:06 UTC, alla sidor
hämtade med HTTP 200 ur en rendering som gjordes efter skrivningen:

| | |
|---|--:|
| `livekoll.py` (InStock, brödsmula, titel och meta mot `seo.tsv`, alt-texterna) | 150 av 150 |
| alt-texter på sidan | 576 av 576 |
| orddiff mot rundans källfil | 0 på 150 av 150 |
| sidor som visar `Fraktvikt` | 142 |
| sidor där den publicerade HTML:en fortfarande kallar fraktvikten `Vikt` | 0 |

Den sista raden är `gatelib.fraktvikt_fel` körd mot den hämtade sidan i stället för mot
källfilen.

`livegrind.py` fällde en gång, på B4: ordet `robust` i en kundrecension på sidan. Ordet
stavas likadant på svenska och är struket ur de tyska orden (`a9558091`); B4 går rent efteråt.
