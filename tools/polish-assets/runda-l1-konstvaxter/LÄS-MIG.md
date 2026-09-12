# Runda L1 — åtta konstväxter 1 019–1 329 kr (2026-09-12)

Ny familj. Åtta tyska Aosom-utkast → publicerade svenska produktsidor.

| kort | produkt | pris | saldo |
| :-- | :-- | --: | --: |
| `278dd771` | Blåregn 165 cm | 1 329 | 81 |
| `0dd83b50` | Buxbom 2-pack 90 cm | 1 299 | 115 |
| `3110f93b` | Fikonfikus 180 cm | 1 179 | 68 |
| `63351b54` | Ficus 180 cm PEVA | 1 069 | 182 |
| `f4ce2f1d` | Banyanträd 180 cm | 1 059 | 161 |
| `756a7cd2` | Häckskydd 300 × 150 | 1 039 | 62 |
| `0e520c93` | Cederträd 90 cm spiral | 1 019 | 24 |
| `68911c57` | LED-björk 150 cm | 599 | 87 |

## ☠️ Fotogranskningen FÖRE texten fällde fyra källor

J1-regeln (`docs/seo-polish-runbook.md`) säger att kontaktarket byggs före
brödtexten. Den betalade sig: **fyra av åtta källor** bar påståenden som bara
fotot kan avgöra. Se `FOTOFYND.md`.

Och kontaktarken fällde **två fel till, i min EGEN text**, efter att den var
skriven och alla mönstergrindar var gröna:

1. ☠️ **`0e520c93` cederträd — antalet är tvetydigt i BILDERNA.** Huvudbilden
   och båda miljöbilderna visar **två** spiraler; `Lieferumfang` säger
   `1 x Künstlicher Zedernbaum`. Min spec-tabell hade ingen antalsrad alls, och
   brödtexten skrev *"Två på var sida om en dörr är den klassiska
   placeringen"* — läsbart som ett 2-pack. Det är en returrisk, inte ett
   skönhetsfel. Lagat med `<li>Antal: 1 träd</li>`, en omskriven mening
   (*"beställer du två stycken — leveransen är ett träd"*) och en egen
   FAQ-rad som säger att bilderna visar ett par för att illustrera placeringen.
2. ☠️ **`f4ce2f1d` banyanträd — en formbeskrivning härledd ur MÅTTEN.** Jag
   skrev *"kronan breder ut sig åt sidorna i stället för att gå uppåt"* ur
   75 × 75 × 180. Fotot visar ett tämligen konventionellt upprätt träd med
   lövverk i övre halvan och bar stam nedanför. Exakt J1-fällan en gång till,
   i egen regi. Rubriken heter nu `Lövverket sitter högt` och beskriver det
   fotot visar.

En tredje kontroll gick ren: björktexten bär **inget snöpåstående**
(`grep -io "snö[a-zå-ö]*" 68911c57.html` → tomt), trots att grenarna ser
snödammade ut på bilden.

## Grindar

| grind | utfall |
| :-- | :-- |
| `gate.py` | **0 fynd** i 8 filer, 3 varningar (alla prosa-räkneord) |
| `gate-alt.py` | **REN** — 8 produkter, 40 alt-texter |
| `gate-seo.py` | 0 fynd i 8 rader |
| `gate-sku.py` | 0 fynd (längsta 25 av 40 tecken) |
| `gate-superlativ.py` | REN |
| `gate-lankar.py` | 0 fynd (inga korslänkar skrivna) |
| `gate-lager.py` | 0 fynd (lägsta saldo 24) |

⚠️ `gate-fragment.py` gäller INTE den här rundan — den grindar tilläggsfragment,
och L1 skriver hela produkttexter. Att den ger 8 fynd här är rätt beteende.

`gate-seo.py` fällde ett produktnamn på **84 tecken** mot Wix tak på 80. Wix
avvisar då HELA skrivningen, inte bara namnet. `278dd771` kortades till 66.

## Skrivningen bevisad, inte antagen

Varje text skrevs i en fil först och kontrollsummerades efter återläsning ur
Wix (FNV-1a, delad mellan Python och JS). Wix normaliserar HTML vid sparandet
— `tools/polish-gates/wixnorm.py` — så facit är `normalisera(fil)`:

| kort | förväntat (tecken / fnv) | Wix svarade | |
| :-- | --: | --: | :-- |
| `278dd771` | 2802 / 2282778 | 2802 / 2282778 | ✅ |
| `0dd83b50` | 2725 / 224717201 | 2725 / 224717201 | ✅ |
| `3110f93b` | 2936 / 660418008 | 2936 / 660418008 | ✅ |
| `63351b54` | 2684 / 563174237 | 2684 / 563174237 | ✅ |
| `f4ce2f1d` | 2883 / 116694929 | 2883 / 116694929 | ✅ |
| `756a7cd2` | 2766 / 691537405 | 2766 / 691537405 | ✅ |
| `0e520c93` | 2801 / 31550081 | 2801 / 31550081 | ✅ |
| `68911c57` | 2927 / 255129950 | 2927 / 255129950 | ✅ |

**8 av 8 exakta.** Talen ligger i `kvitto-fil.json` (råfilen) och
`kvitto-normaliserad.json` (det Wix ska lagra).

## ☠️ Fyra av åtta bar TYSKA alt-texter — och det upptäcktes bara för att steget kördes

Precis den defekt runda J1 lämnade efter sig (#175): brödtexten var perfekt
och bilderna skrek tyska. Mätt FÖRE alt-skrivningen:

```
3110f93b  alt×5  "Künstlicher Geigenfeigenbaum Kunstpflanze mit 91 Blättern…"
63351b54  alt×5  "Künstlicher Ficus-Baum, realistisch, pflegeleicht…"
f4ce2f1d  alt×5  "Künstlicher Banyanbaum Kunstpflanze mit Massivholzstamm…"
68911c57  alt×5  "Künstliche Birke mit LED-Beleuchtung, 96 kaltweiße Mikro-LEDs…"
```

De övriga fyra hade `altText: null`. **20 tyska alt-texter**, alla borta nu:
40 av 40 skrivna, bildordningen oförändrad, verifierat per rad.

⚠️ Och bildordningen jämfördes mot `bilder.tsv` FÖRE skrivningen — alla 40
fil-id i samma ordning. En positionsmatchad alt-skrivning mot en omkastad
lista hade satt måttritningens text på huvudbilden, tyst.

## Kategorier

Facit är bulk-svarets `itemMetadata` per rad, inte en återläsning
(läsprojektionen släpar). **20 av 20 kopplingar, 0 fel, 0 undetailedFailures.**
Motiveringen per produkt står i `KATEGORI-SKAL.md`.

## Bilderna

**Noll** tyska inbrända grafiker på alla 40 bilderna — långt renare än
katalogens uppmätta 46 %. `bilder-bort.tsv` är därför tom med flit.
Måttritningarna bekräftade dessutom varje mått jag skrivit.

## Uteslutna

Tre produkter föll på lagergrinden (`utesluten/LÄS-MIG.md`) — första gången
grinden biter som ett medvetet URVALSSTEG i stället för som en bieffekt av
prisgrinden (#173).
