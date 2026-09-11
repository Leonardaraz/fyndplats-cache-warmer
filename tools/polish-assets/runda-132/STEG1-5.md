# Runda 132 — husdjurstrapporna, Steg 1–5

Familjen är hundtrappor och husdjurstrappor. Runda 131 tog ramperna; det här
är trapporna, och därmed familjens sista utkast.

## Steg 1 — katalogsvep till uttömning

☠️ **Kvittot är `cursor === null`, inte radantalet.** Första svepet svarade
`avhuggen: true` efter 25 sidor / 2 500 produkter. Fortsatt från markören:
32 sidor till, 3 149 produkter, `avhuggen: false`. **Totalt 57 sidor,
5 649 produkter.** Noll slugkrockar, noll SKU-krockar mot rundans tio.

## ☠️ Steg 1 — pixelgrinden på FIL-ID är strukturellt blind

Mediajämförelsen mellan utkastet `a6412efa` och publicerade `543b9076`
svarade **`delade_filer: 0`**. Det såg ut som ett tryggt NEJ på dubblettfrågan.

Det var ett FALSKT NEGATIVT. Bilderna laddades ner och jämfördes på BYTES:

| | fil-id | md5 | storlek |
|---|---|---|--:|
| utkastets bild 3 | `4efc95fd…` | `2530de1bb081c55ff42ee5c3d24b3a8c` | 488 136 |
| publicerades bild 4 | `f166a65a…` | `2530de1bb081c55ff42ee5c3d24b3a8c` | 488 136 |

Samma måttritning, **byte-identisk**. Fil-id:na skiljer för att Wix
OMIMPORTERAR varje bild till en ny fil — det står redan i CLAUDE.md
("591 av 595 wixstatic-filer var kopior"). Två produkter som importerar
SAMMA leverantörsbild får alltså **alltid** två olika fil-id, och en
jämförelse på fil-id kan därför **aldrig** hitta den dubblett som uppstår
när samma vara importerats två gånger — vilket är precis den dubblett som
finns. Uppgift #499.

Hjältebilderna bekräftade: samma fotografering, samma bruna plysch, samma
fyra steg. Den publicerade har bara en hund inkopierad.

✅ **OMMAPPAD 2026-09-11.** `hundtrappa-sma-hundar-katter-4-steg`
(`543b9076`) pekar nu på Aosom; utkastet `a6412efa` pensionerat i samma
skrivning. Planen gav **noll hinder**, kundpriset 689 kr är **orört**, och
rutten kvitterade `verifierat vid återläsning`.

☠️ **Artikelnumret lästes utan att läcka.** `polish-mapping.yml`s
`kuvert`-läge krypterar `supplierProductId` hybridvis mot en engångsnyckel;
nyckelparet genererades här, den publika halvan skickades in, svaret
dekrypterades lokalt och nyckelparet raderades. Klartexten passerade aldrig
den publika loggen. (`visa_kostnad` lämnades `false` — den skriver
inköpspriset till samma publika logg.)

**Byte-grinden kördes också mot de tre publicerade grannarna**
(`hundtrappa-med-forvaring`, `hopfallbar-hundtrappa-3-steg`,
`vikbar-husdjurstrappa-4-steg`) och mot rundans tio inbördes:
**noll byte-identiska bilder.** Ingen ytterligare dubblett.

## Steg 3 — källan säger emot sig själv på fyra av tio

| id | motsägelse | avgjord av |
|---|---|---|
| `8f6147b5` | tyskan `Grau`, svenska spec-tabellen `Beige` | bilden |
| `8f6147b5` | intron lovar sisal; materiallistan nämner inget | bilden |
| `4c25eb86` | spec-tabellens `Mått` är platshållaren **"Modell 1"** | tyskans tal |
| `762cc411` | intron kallar den **"Kletterbaum"** — klätterträd | bilden |
| `f384c51d` | brödtexten säger "dunkler Kaffeefarbe" (syskonets färg) | bilden |
| `c38f929e` | intron kallar den **"Tierschutzgitter"** — skyddsgrind | resten av texten |

☠️ **`Vikt` i den svenska spec-tabellen är FRAKTVIKTEN** (uppgift #488).
Uppmätt i tre fall: 0,81 mot 1,5 kg · 4,2 mot 5,0 · 4,2 mot 5,0. Varans vikt
står i tyskans `Gewicht`.

## ☠️ Steg 4 — bilden omkullkastade tre av fyra antaganden

Jag hade läst intron som kopierad i alla tre sisalfallen. **Fel i två av tre.**

| id | sisal i texten | sisal på bilden | verdikt |
|---|---|---|---|
| `8f6147b5` | ja | **JA** | intron var SANN — materiallistan är ofullständig |
| `4c25eb86` | ja | **JA** | intron var SANN |
| `762cc411` | ja (intro) | **NEJ** — bouclé på stolparna | intron är kopierad |

Färgerna, lästa ur bilden i förstoring:

| id | tyskan | spec-tabellen | **bilden** |
|---|---|---|---|
| `8f6147b5` | Grau | Beige | **ljusgrå** |
| `4c25eb86` | Grau | — | **mörkgrå, nära antracit** |
| `762cc411` | Beige | Beige | **gräddvit** |
| `f384c51d` | Natur | Naturholz | **ljus trälook, gräddvita dynor** |
| `3ff2bc32` | Dunkelbraun | Dunkelbraun | **mörkbrun, bruna dynor** |
| `03715963` | Weiß | Weiß | **gräddvitt tyg, vita dynor** |
| `c38f929e` | Schwarz | Schwarz | **mörkblått tyg, bruna dynor** |

**Logotypsvep:** alla 50 bilders övre vänstra hörn granskade. **Noll
logotyper, noll tysk text i pixlarna.**

## Steg 5 — grinden fällde 30, varav 3 var grindbuggar

☠️ **`\bramp` matchar INTE "Hundramp"** — d och r är båda ordtecken. Exakt
runda 131:s fälla en gång till, fångad av rundans eget självtest. Rättad
till bar `ramp`.

☠️ **`dela_pa_ankare` räcker inte för att stryka korslänkarna.** Ankarens
ETIKETT ("samma trappa i mörkbrunt") stannar i den egna strängen, så
grannens färg och grannens tal såg ut att stå i vår text — sex av tio sidor
fälldes för grannens ord. Blocket skärs nu bort på RUBRIKNIVÅ
(`utan_korslankar`), och både PER_PRODUKT, talgrinden och färggrinden läser
den zonen.

De 20 äkta fynden, alla rättade per ORD över hela batchen:

| fynd | antal |
|---|--:|
| metan saknade ordet "trappa" (typgrinden) | 6 |
| kommalista av tal ("15, 29,5, 45 och 59,5") | 8 |
| texten sa 54 cm där specen säger 54,2 | 4 |
| maxlasten 15 kg saknades i namn och meta | 2 |
| ordet "sisal" på en produkt utan sisal | 1 |

## ☠️ Steg 5 — NIO av tio handskrivna SKU:er var fel

SKU:n skrevs först för hand. Mot husregeln (`grindar.sku_bas`, speglar
`lib/import/sku.ts`) skilde sig **nio av tio** — och två PAR krockade efter
kapningen vid 24 tecken:

```
03715963  hopfallbar-hundtrappa-forvaring-*  →  FP-hopfallbar-hundtrappa
c38f929e  hopfallbar-hundtrappa-forvaring-*  →  FP-hopfallbar-hundtrappa   ☠️
96d2803c  hopfallbar-husdjurstrappa-2-*      →  FP-hopfallbar
11436227  hopfallbar-husdjurstrappa-2-*      →  FP-hopfallbar              ☠️
```

Krocken syns INTE i sluggen (uppgift #473) — den uppstår i den KAPADE
strängen. Sluggarna är därför omskrivna så att **det som skiljer syskonen åt
ryms innan kapningen**: färgordet står före stegantalet. `SKU` HÄRLEDS nu i
`texter.py` i stället för att skrivas, så de två inte kan glida isär igen.

## Rundans tio

| id8 | slug | steg | höjd | maxlast | pris |
|---|---|--:|---|--:|--:|
| `8f6147b5` | `husdjurstrappa-3-steg-sisal` | 3 | 34 cm | 50 kg | 849 |
| `4c25eb86` | `husdjurstrappa-4-steg-sisal` | 4 | 59 cm | 50 kg | 799 |
| `762cc411` | `kattrappa-3-steg-boucle` | 3 | 34 cm | 10 kg | 849 |
| `f384c51d` | `hundtrappa-ljus-tralook-4-steg` | 4 | 54,2 cm | 30 kg | 819 |
| `3ff2bc32` | `hundtrappa-morkbrun-4-steg` | 4 | 54,2 cm | 30 kg | 799 |
| `03715963` | `hundtrappa-gradvit-forvaring` | 3 | 48 cm | — | 759 |
| `c38f929e` | `hundtrappa-morkbla-forvaring` | 3 | 48 cm | — | 749 |
| `96d2803c` | `husdjurstrappa-gra-2-steg` | 2 | 20 cm | — | 619 |
| `11436227` | `husdjurstrappa-mork-2-steg` | 2 | 20 cm | — | 569 |
| `71e8e879` | `husdjurstrappa-skum-avtagbart-steg` | 3 | 39 cm | 15 kg | 749 |

**Fyra saknar angiven maxlast**, och ingen siffra räknas fram åt dem —
grinden fäller varje "bär upp till N" på dem.

☠️ **`71e8e879`:s översta steg är INTE fastsatt.** Källans egen varning säger
att det måste stödja mot soffan eller sängen. Den står i kundtexten, både i
"Att tänka på" och i FAQ:n.
