# Runda 121 — åtta städvagnar och mopphinkar

| id | sida | pris |
|---|---|--:|
| `45bac2cb` | `mopphink-hjul-26-liter-press-gul` | 1 179 |
| `731c8bfc` | `mopphink-hjul-26-liter-press-bla` | 1 129 |
| `74ea10dc` | `mopphink-tva-hinkar-78-cm` | 1 569 |
| `e526fd01` | `mopphink-36-liter-press-innerhink` | 969 |
| `da0f30b2` | `moppvagn-25-liter-korg-hylla-gul` | 1 119 |
| `d8ebb279` | `moppvagn-25-liter-korg-hylla-bla` | 1 119 |
| `9aa46e31` | `stadvagn-121-cm-tre-hyllplan-sopsack` | 1 479 |
| `75fcdcfb` | `stadvagn-122-cm-mopphink-sopsack` | 2 269 |

Underlaget står i `STEG1.md` (familjeval och sökordskrock), `STEG2-5.md`
(laglighetsgrind och leverantörens sju motsägelser) och `STEG4.md` (bilderna).

## ☠️ Rundans dyraste fynd låg i ett FÄLTNAMN, inte i en produkt

`wix.request` tar request-kroppen i **`body`**, inte i `data`. Med `data`
slukas den tyst — anropet lyckas, Wix svarar 200 med standardprojektionen, och
markören man skickade in fanns aldrig i förfrågan. Det gjorde katalogsvepet
omöjligt att köra och omöjligt att felsöka: alla tre paging-placeringar gav
samma 100 rader, för ingen av dem nådde fram.

Det korrigerar uppgift #404, som gissade att `cursorPaging` låg på fel nivå.
Regeln står nu i runbokens API-fällor: **pröva att kroppen biter innan du
mäter något med den.** `limit: 5` mot ett API som svarar 100 är den billigaste
kontrollen som finns.

## ✅ Steg 7-skrivningen kvitterades MEKANISKT

Alla åtta lästes tillbaka, och teckensumman av den SYNLIGA texten jämfördes
mot källan i `skrivning.json`. **8 av 8 stämmer på tecknet**, fem `<h2>` per
sida.

Wix skriver om markup vid sparning (`<strong>` blir ett `<span>`), men den
synliga texten är oförändrad — därför är summan jämförbar, och därför fångar
den både en KAPAD och en DUBBLERAD avskrift. Runda 119:s `5d1696db` fick sin
text två gånger för att den skrevs av för hand, och en radräkning hade inte
sett det. `verifiera.py` är kontrollen.

## Vad grinden fällde före skrivningen

Fyra saker, två i texten och två i grinden — alla verifierade genom att
återinföras.

| | vad | mutationstest |
|---|---|--:|
| text | `9aa46e31` sa aldrig att moppen inte ingår | 2 fel |
| text | tyska citattecken kring varningsskyltens ord | — |
| grind | färggrinden läste korslänkarnas ankartext | 5 fel |
| grind | lastgrindens fönster var 40 tecken, inte en mening | 7 fel |

☠️ **Moppgrinden är POSITIV med flit.** Fem av åtta källtexter skriker
*"HINWEIS: Der Mopp ist NICHT enthalten"* i versaler. En grind som bara
förbjuder ett felaktigt påstående svarar grönt på en sida som TIGER — och det
var precis vad städvagnen gjorde, trots att den har clips för moppskaft.

## Steg 9: två bilder bort, fyrtio alt-texter in

`75fcdcfb` gick från fem bilder till tre. Bild 4 och 5 bar tysk text inbränd i
pixlarna (`FÜR DIE EWIGKEIT GEBAUT`, `WARNSCHILD "NASSER BODEN"`).

Fyrtio alt-texter skrivna, noll bilder utan. **Varje alt-text beskriver en
bild jag faktiskt sett** — fem bilder granskades i ett eget ark just för att de
inte fanns med i de första arken.

## Steg 10: kategoriträdet har inget löv för städutrustning

Åtta produkter kopplade till **Verktyg & Hemmafix** och verifierade med
`list-categories-for-items`. Men trädet har 54 kategorier och ingen heter
`Städ` eller `Rengöring` — samma sak som uppgift #402 för projektionsdukarna.
Lämnas till Leonard.

## Steg 8: sex av åtta delade två SKU:er

| SKU före | bars av |
|---|---|
| `FP-reinigungseimer` | `45bac2cb`, `731c8bfc`, `74ea10dc` |
| `FP-reinigungswagen` | `da0f30b2`, `d8ebb279`, `9aa46e31` |

Importens fel (uppgift #272), inte poleringens. Alla åtta har nu en egen SKU
härledd ur den nya sluggen. Priset lästes omedelbart före varje
`variantsInfo`-skrivning, ekades tillbaka och jämfördes efteråt: **8 av 8
orörda**.

## Steg 14: 8 av 8 gröna — men grinden fälldes tolv gånger först

Första körningen gav **12 fel på 8 sidor**. Alla tolv var GRINDFEL, och båda
klasserna mättes fram i stället för att gissas — en kontrollkörning med
`lambda h: h` i stället för tvätten visade att `blå` inte fanns i `egna`
ÖVERHUVUDTAGET, alltså kunde träffen inte komma från sidans egen text.

| klass | träffar | vad som faktiskt hände |
|---|--:|---|
| `LEVERANSLAND` | 8 | butikens chrome har **två** rader med `EU-lager` |
| `FÄRGORD` | 4 | tvätten dödade `href` → korslänken lästes som sidans egen mening |

☠️ **Ett brett `https?://\S+` i tvätten dödar korslänkarna.** `egna_meningar`
kör tvätten FÖRE `dela_pa_ankare`, och ankarmönstret kräver ett intakt
`href="…"`. Med adressen struken är ankaret inte längre ett ankare, och
länktexten — som NAMNGER syskonets färg, med flit — faller ned bland sidans
egna meningar. Grinden fyrade alltså på exakt det korslänkarna finns för att
säga. `egna_meningar`s egen docstring varnar för samma sak för SLUGGEN;
ett URL-mönster gör det en nivå bredare.

☠️ **Och chromet har TVÅ `EU-lager`-rader, inte en.** Fraktraden
(`Skickas från EU-lager – ingen importtull…`) var täckt sedan runda 117.
Sidfotslänken `Ångra köp EU-lager &amp; tull Köpvillkor` var det inte — och
den fyrade på alla åtta korrekta sidor.

Tvätten stryker nu bara `src`/`srcset`/`\d{2,4}w` och båda chrome-raderna, och
har ett **eget fyrfallssjälvtest** — den går inte att pröva mot en levande
sida utan att först ha en levande sida, så den prövas mot strängar i stället.

Efter lagningen:

```
OK  45bac2cb  mopphink-hjul-26-liter-press-gul
OK  731c8bfc  mopphink-hjul-26-liter-press-bla
OK  74ea10dc  mopphink-tva-hinkar-78-cm
OK  e526fd01  mopphink-36-liter-press-innerhink
OK  da0f30b2  moppvagn-25-liter-korg-hylla-gul
OK  d8ebb279  moppvagn-25-liter-korg-hylla-bla
OK  9aa46e31  stadvagn-121-cm-tre-hyllplan-sopsack
OK  75fcdcfb  stadvagn-122-cm-mopphink-sopsack

8 sidor, 0 fel
```

Flikraden är grön på alla åtta (`grindar.flikfel`), stämplingen kvitterad i
`polish-mapping.yml`-körningarna **2424–2431, alla `success`**.

**Runda 121 är därmed klar i alla fjorton steg.**

## Kvar för Leonard

- **Fyra utkast i familjen** går till runda 122: `6490e360` (1 299),
  `0cbffcd9` (2 339), `740fa6d0` (2 429), `832f9eec` (2 699). Alla fyra är
  systemvagnar med press och delar konstruktion — de ska granskas som en grupp.
- ⚠️ **`da0f30b2` och `d8ebb279` saknar totalt lasttal på sidan.** Leverantören
  anger 15 kg totalt, men hinken rymmer 25 liter och 25 liter vatten väger
  25 kg. Talet är alltså antingen bara hyllornas eller så får hinken inte
  fyllas — och han säger inte vilket. Korgens 5 kg står; totalen gör det inte.
- ⚠️ **`45bac2cb` (gul) kostar 1 179 kr och `731c8bfc` (blå) 1 129 kr** trots
  identisk konstruktion, identiska mått och identisk vikt. Priset är inte
  poleringens att röra, men skillnaden är värd ett beslut.
- ⚠️ **Kategoriträdet saknar ett löv för städutrustning.** De åtta ligger på
  `Verktyg & Hemmafix`, som är det närmaste som finns.
