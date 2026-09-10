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
