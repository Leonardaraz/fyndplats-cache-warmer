# Runda 140 — Steg 1: familjemätning och val

Familjen är **hundsoffor och hundbäddar i tyg** — 15 tyska utkast.

## Katalogen, mätt hela vägen

| | |
|---|---:|
| Produkter totalt | **5 695** |
| Publicerade | 2 702 |
| Tyska utkast (osynliga, namn utan å/ä/ö) | **1 908** |

Svepet gick i två etapper om 28 + 29 sidor. Andra etappen slutade med
`avhuggen: false` — **kvittot är att markören tog slut, inte radantalet**.
Kroppen sondades först med `limit: 5` mot ett API som annars svarar 100; utan
den sonden mäter man en kropp som aldrig nådde fram (`body`, aldrig `data`).

## ☠️ Min första lucksmätning var FEL — och felet är runbokens eget

Familjemätningen kördes först mot **halva** katalogen, med smala svenska ord
gissade ur huvudet. Den sa `Hundesofa: 13 utkast mot NOLL publicerade` — den
största luckan i hela katalogen.

Det var fel. Ett bredare svep mot **hela sitemapen** (2 684 produktsidor,
gratis, inget Wix-anrop) gav åtta:

```
hundsoffa-stor-hund-upphojd          upphojd-hundbadd-61-cm
upphojd-hundbadd-76-cm-natpanel      upphojd-hundbadd-92x76-svart
upphojd-hundbadd-kantkudde-natbotten upphojd-hundbadd-xl-utomhus-122x92
kattbadd-med-kattoron-50-cm          kattbadd-sjogras-43-cm
```

Mitt mönster var `hundsoffa|hundbadd` mot SLUGGEN — och sex av de åtta heter
`upphojd-hundbadd-…`, alltså med prefix. Regeln i uppgift #494 gäller ordagrant:
**ett svenskt ord kan inte gissas, och ett stamord räcker aldrig.**

Rättad mätning över hela beståndet:

| familj | tyska utkast | publicerade (brett svep) |
|---|--:|--:|
| soptunna | 36 | 27 |
| golvlampa | 17 | 31 |
| gungstol | 10 | 32 |
| valphage / hundhage | 17 | 17 |
| campingtält | 11 | 11 |
| hönshus | 15 | — |
| smådjursstall | 19 | 39 |
| **hundsoffa / hundbädd** | **15** | **8** |
| **hantelbank / träningsbank** | **13** | **7** |

## Varför hundsofforna och inte soptunnorna

De åtta publicerade är inte samma produkttyp. **Sex av dem är UPPHÖJDA
NÄTBÄDDAR** — metallram med spänd duk — och två är kattbäddar. Bara
`hundsoffa-stor-hund-upphojd` är en stoppad hundsoffa.

Utkasten är genomgående stoppade tygsoffor med rygg och träben
(`Samt`, `Schaumstoff`, `Birkenholz` / `Kiefernholz`). Luckan är alltså
**en publicerad sida mot fjorton utkast av samma typ** — och de åtta
publicerade blir korslänkar, inte konkurrenter.

Soptunnorna (36 mot 27) är däremot i praktiken klara, och golvlampor och
gungstolar har fler publicerade sidor än utkast.

## Syskongrupper, mätta på mått + materialsträng + pris

☠️ **Tre av utkasten är samma modell i tre färger.** Beviset är inte namnet
utan att måtten OCH materialsträngen är ordagrant identiska:

| p8 | mått | material | färg | pris |
|---|---|---|---|--:|
| `01fcdf1d` | 98 × 67 × 25 | `Polyester, MDF, Schaumstoff, Kiefernholz` | Grau | 1 169 |
| `bb3cd4ed` | 98 × 67 × 25 | samma sträng | Grün | 1 139 |
| `881540a6` | 98 × 67 × 25 | samma sträng | Blau | 1 059 |
| `68f8cae9` | *oläst* | samma sträng | Dunkelblau | 1 039 |

Den fjärde bär samma materialsträng men fick inte sitt `Gesamtabmessungen`
läst — **fältet är alltså `None` tills det gått att läsa om**, aldrig det tal
grannen råkar ha (Steg 3, regel 7).

⚠️ **Och ett par som INTE är färgsyskon utan ett dubblettmisstanke:**

| p8 | färg | pris | källtext |
|---|---|--:|---|
| `5b8162d1` | Dunkelgrau | 1 039 | **byte-identisk** |
| `1835c144` | Dunkelgrau | 1 069 | **byte-identisk** |

Samma färg, samma material (`samtartiges Polyester, Schaumstoff, Birkenholz`),
samma text, 30 kronor isär. Det är den INTERNA dubblettens signatur, inte en
färgvariant — måtten och bilderna måste avgöra innan något poleras.

Ett tredje par delar text men skiljer i färg och pris — `9ee2fa6e` (Grün,
1 519) och `c11948ac` (Dunkelgrau, 1 649), båda 25 kg.

## ☠️ En kandidat är en ANNAN produkttyp och pekar rakt in i de publicerade

`01ac2f63` — *Outdoor-Hundeschlafplatz mit Baldachin*, 749 kr, material
`Metall, Oxford, Netzstoff`. Det är en **upphöjd nätbädd med soltak**, alltså
exakt den typ de sex publicerade `upphojd-hundbadd-…`-sidorna redan täcker.
Den ska genom måttgrinden och pixelgrinden mot dem innan den ens övervägs —
och `upphojd-hundbadd-xl-utomhus-122x92` är den mest sannolika träffen.

## Kvar att göra innan Steg 2

1. Läsa `Gesamtabmessungen` för de nio vars mått inte gick att plocka ur
   ingressen — måtten bor i `Technische Daten`, som klipptes av 520-teckens-
   fönstret i svepet.
2. Måttgrind i BÅDA riktningar: mellan utkasten (färgsyskon mot dubblett) och
   mot de åtta publicerade.
3. Pixelgrind på `01ac2f63` mot de sex upphöjda nätbäddarna.

Priserna ovan är **lästa, inte poleringens sak** — de står här bara som en
axel i syskonmätningen. Rör dem inte.
