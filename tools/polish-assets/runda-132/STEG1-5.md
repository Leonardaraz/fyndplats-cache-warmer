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

## Steg 7 — KVITTERAT, tio av tio byte-exakta (2026-09-11)

Fösta skrivningen bar **rotrelativa** korslänkar (`/produkt/…`). Wix skriver om
dem till `https:/produkt/…` — ETT snedstreck, alltså en adress vars VÄRDNAMN
blir `produkt`. PATCH-svaret ekar tillbaka det man skickade, så felet syns inte
där. Det som fångade det var längden: återläsningen låg **exakt +18 tecken** på
alla tio sidor (6 per länk × 3).

Alla tio är omskrivna med absolut butiksadress och verifierade mot `facit.json`:

| | |
|---|---:|
| lästa tillbaka med `?fields=PLAIN_DESCRIPTION` | 10 |
| hash + längd stämmer mot facit | **10** |
| Wix lagrade == källan (efter `wixnorm.normalisera`) | **10** |
| residual (`diff`) | **+0 på alla tio** |
| trasiga `https:/`-hrefs kvar | **0** |

⚠️ **Läsningen måste delas upp eller sorteras.** Tio produkter med brödtext är
~55 000 tecken och kapas vid 50 000. `$in`-listans ORDNING styr ingenting —
Wix sorterar `createdDate` fallande som default, så den äldsta produkten ligger
alltid sist och faller utanför kapningen. `"sort": [{"fieldName":"createdDate",
"order":"ASC"}]` under `search` vänder listan och gör den sista läsbar.

## Steg 8a — Wix variant-SKU omsynkad (2026-09-11)

Sex av tio delade SKU i Wix före rundan — fyra på `FP-haustiertreppe`, två på
`FP-haustiertreppe-fur-hunde`. Det var alltså en LEVANDE defekt, inte bara en
tysk sträng.

| pid | före | efter |
|---|---|---|
| 8f6147b5 | `FP-hundetreppe-3-stufen-34` | `FP-husdjurstrappa-3-steg` |
| 4c25eb86 | `FP-katzentreppe-4-stufige` | `FP-husdjurstrappa-4-steg` |
| 762cc411 | `FP-katzentreppe-3-stufen` | `FP-kattrappa-3-steg-boucle` |
| f384c51d | `FP-haustiertreppe-fur-hunde` | `FP-hundtrappa-ljus-tralook` |
| 3ff2bc32 | `FP-haustiertreppe-fur-hunde` | `FP-hundtrappa-morkbrun-4` |
| 03715963 | `FP-hundetreppe-3-stufen-48` | `FP-hundtrappa-gradvit` |
| c38f929e | `FP-haustiertreppe` | `FP-hundtrappa-morkbla` |
| 96d2803c | `FP-haustiertreppe` | `FP-husdjurstrappa-gra-2` |
| 11436227 | `FP-haustiertreppe` | `FP-husdjurstrappa-mork-2` |
| 71e8e879 | `FP-haustiertreppe` | `FP-husdjurstrappa-skum` |

Alla tio härledda ur sluggen med `grindar.sku_bas` (aldrig skrivna för hand),
distinkta, ≤ 40 tecken, ASCII. `bulkActionMetadata: 10 lyckade, 0 fel`.

☠️ **Varianten LÄSTES en och en, den rekonstruerades inte.** Två av tio
(`3ff2bc32`, `762cc411`, `4c25eb86`) bär INGEN `media` på varianten medan de
övriga sju gör det — formen varierar alltså inom samma runda, och en
"self-evident" rekonstruktion hade skrivit ett fält Wix inte hade.
`products/search` returnerar inte `variantsInfo` ens med
`fields=VARIANT_OPTION_CHOICE_NAMES`; bara GET gör det.

Varje rad bär `visible: false` på produkten OCH `visible: true` på varianten,
enligt husregeln om att en `variantsInfo`-PATCH annars publicerar utkastet.

## Steg 9 — galleriet: tio egna kort, svenska alt-texter, måttet sist

Ordningen är `[1, 2, KORT, 4, 5, 3]` — måttritningen låg på plats 3 hos ALLA
tio (samma mönster som runda 104) och ligger nu sist. Kortet på plats 3.

Uppladdningen kvitterades **på innehållet, inte på ordningen**: `UploadImageToWixSite`
svarar utan filnamn och med `operationStatus: PENDING`, så attributionen vilar
annars på `imageUrls`-ordningen. `kortkvitto.py` laddade ner varje uppladdad fil
och jämförde md5 mot den lokala — **10 av 10 READY och attribuerade**.

☠️ **Alt-texterna har en EGEN grind** (`alttexter.granska`), för de finns aldrig
i `texter.py` och passerar därför ingen av textgrindens vanliga vägar. Den kör
rundans förbjudna-ord-lista, ARTNR, homoglyfer, tyska ord, en talgrind mot
spec-tabellen och en djurgrind. Den fällde ett äkta fynd: måttritningens alt på
`8f6147b5` skrev **"med 15 cm djupa steg"** — talet står i leverantörens ritning
men INTE i vår spec-tabell (som säger `Steghöjd: 10 cm`). Struket.

Återläsningen gjordes i ett EGET anrop och verifierade allt tre: ordningen, de
sextio alt-texterna byte för byte och att varje post har kvar sin `image.url`.
**10 av 10, noll fel.**

## Steg 10 — kategori

Alla tio ligger på **Husdjur** (`a2b4369f`) + **Lek & Tillbehör för husdjur**
(`ea1313f5`) — samma löv som runda 131:s möbelramper och de publicerade
grannarna. Tjugo skrivningar, `totalSuccesses: 2` på var och en, noll fel.
Id:na lästes ur trädet, de skrevs inte ur minnet.

## Steg 8b + 13 — stämplade och LIVE

Tio `polish-mapping`-körningar (läge `stampla`): `needsAiPolish: false`,
`draftStatus: published`, variant-SKU. Alla tio `conclusion: success`.

Publiceringen bar `visible: true` på BÅDE produkt och variant, och skrev om
`seoData.settings.keywords` — importens tyska rubrik låg kvar där, eftersom
Steg 7 bara rör `seoData.tags`.

Återläst en produkt i taget (tio egna GET:ar, inte på PATCH-svaret):

| | |
|---|---:|
| `visible: true` på produkten | **10** |
| `visible: true` på varianten | **10** |
| SKU stämmer mot den polerade sluggen | **10** |
| `settings.keywords` svenskt fokusord | **10** |
| priset orört | **10** |

☠️ **En `variantsInfo`-PATCH som BÄR `media` TAR BORT variantens bild.** Sju av
tio varianter hade ett `media`-objekt (ärvt från importen, med leverantörens
tyska alt-text); efter Steg 13 har **ingen** av dem det. Uppgift #352 säger att
variantens media inte går att SKRIVA via `variantsInfo` — mätningen här visar
att den går att RADERA. Skadan är noll: produkten är enkelvariant utan optioner,
så butiken visar `media.main` (som är intakt och numera svensk), och tre av
rundans tio saknade variantmedia redan som råimport. Men regeln är ny och ska
inte glömmas: **skicka inte `media` i en `variantsInfo`-PATCH.**

## Steg 14 — live-grinden: tio sidor, noll fel

```
grind.sjalvtest():     106 fall, 0 fel
grindar._sjalvtest():   56 fall, 0 fel

8f6147b5  husdjurstrappa-3-steg-sisal          HIT  0 fel
4c25eb86  husdjurstrappa-4-steg-sisal          HIT  0 fel
762cc411  kattrappa-3-steg-boucle              HIT  0 fel
f384c51d  hundtrappa-ljus-tralook-4-steg       HIT  0 fel
3ff2bc32  hundtrappa-morkbrun-4-steg           HIT  0 fel
03715963  hundtrappa-gradvit-forvaring         HIT  0 fel
c38f929e  hundtrappa-morkbla-forvaring         HIT  0 fel
96d2803c  husdjurstrappa-gra-2-steg            HIT  0 fel
11436227  husdjurstrappa-mork-2-steg           HIT  0 fel
71e8e879  husdjurstrappa-skum-avtagbart-steg   HIT  0 fel

SUMMA: 10 sidor, 0 fel
```

`livegrind.py` är en **datafil** — tio pid och ett anrop till `liverunda.kor`.
Uppgift #491 mätte att live-grinden drev isär i fem rundor och att runda 129
tappade rundans EGET självtest utan att någon såg det; båda självtesterna står
därför i utskriften ovan, och de kördes för att den delade modulen kör dem, inte
för att den här rundan mindes att be om det.

Grinden körde `G.kortfel(html)` före rundans egna regler — klart-kriteriet
"minst ett eget Fyndplats-kort i galleriet" glömdes i åtta rundor i rad när det
bara stod i runbooken. Tio sidor, tio kort funna.

⚠️ **`HIT` är rätt svar här, inte ett cachefel.** `G.hamta_isr` lägger på `?cb=`
och hämtar TVÅ gånger; den andra hämtningen av samma cache-bustade adress är per
definition en träff. Det som hade varit fel är `STALE` — och modulen väntar ut
just det, eftersom två hämtningar inte alltid räcker (mätt 2026-09-11).

## Runda 132 — klar

| Steg | Kvitto |
|---|---|
| 7 | 10/10 byte-exakt mot `facit.json`, diff **+0**, noll `https:/`-hrefar |
| 8a | tio variant-SKU:er omskrivna, sex live-krockar rensade, 10/10 lyckade |
| 9 | tio kort md5-attribuerade, galleriet omordnat, 60 alt-texter, **10/10 noll fel** |
| 10 | tjugo kategoriskrivningar, `totalSuccesses: 2` var, noll fel |
| 8b | tio `polish-mapping`-stämplingar, alla `success` |
| 13 | tio egna GET:ar: `visible:true` på produkt OCH variant, rätt SKU, svenska sökord, priset orört |
| 14 | **10 sidor, 0 fel** — båda självtesterna gröna |

Inga produkter hölls tillbaka på slutsålt lager den här rundan.
