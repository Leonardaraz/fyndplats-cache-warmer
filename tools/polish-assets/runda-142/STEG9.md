# Runda 142 — Steg 9: galleriet, alt-texterna och elva egna kort

**11 av 11 gröna.** 65 bilder skrivna, checksumman stämmer exakt mot facit på
varenda produkt.

## Kvittot är en CHECKSUMMA, inte ett API-svar

☠️ **PATCH-svaret bär inget `media.itemsInfo`** — fältet kommer bara på en GET
med `?fields=MEDIA_ITEMS_INFO`, och PATCH tar inte `fields`. Svaret kan alltså
inte skilja "sparat" från "raderat" (#457). Kvittot är därför en egen GET, och
jämförelsen går på en **FNV-1a över `fil-id|alt-text` radvis**:

| | |
|---|--:|
| Produkter | **11** |
| Bilder skrivna | **65** |
| Checksumma == facit | **11 / 11** |
| Kortet på plats 3 | 11 / 11 |
| Måttritningen sist | 11 / 11 |
| `visible` efter skrivningen | `false` × 11 |

⚠️ **Checksumman går över ORDNINGEN OCH texten i ETT.** En omkastad lista och en
felstavad bokstav ger båda ett annat tal — en radräkning hade bara sett det
första. Samma form som Steg 7:s hashgrind, och den är giltig av samma skäl:
texterna är BMP-bara, så `charCodeAt` i Wix-sandlådan och `ord` i Python räknar
identiskt. En assert i byggskriptet fäller om ett tecken utanför BMP smyger in.

☠️ **`speglat` kontrolleras också.** Runbokens regel är att sätta
`items[i].altText` och INTE `items[i].image.altText` — `image` är readOnly, och
patchar man bara den svarar Wix 200 utan att skriva texten. Kvittot läser båda
fälten och kräver att de är lika; 11 av 11 speglade ned av sig själva.

## Två spärrar FÖRE skrivningen

1. **Varje fil-id jag skickade kontrollerades mot Wix nuvarande galleri.** Elva
   produkter, 54 leverantörsbilder — alla fanns. Det är grinden mot runda 138:s
   fel (#536): två PÅHITTADE fil-id skrevs, och Wix svarade 200 genom att tyst
   utelämna dem. Korten undantas (de är nya) och är kvitterade på md5 av
   `kortkvitto.py` i stället.
2. **Det som KASTAS jämfördes mot `KASTAS`, inte mot ögat.** Skriptet räknar ut
   differensen mellan Wix nuvarande lista och min och kräver att den är exakt
   den bild jag avsett kasta. En bild som råkat falla bort hade annars sett ut
   som en lyckad skrivning.

## Ordningen

`[hjälte, verklighetsbild, KORT, detalj, detalj, måttritning]` — måttritningen
SIST, inte på plats 3 som runda 104 gjorde på alla sju sidor (#371).

☠️ **Att index 2 i `bilder.json` är måttritningen är KONTROLLMÄTT, inte antaget.**
Kontaktarket `steg9-index2.jpg` visar elva måttritningar på elva produkter.
Leverantörens ordning är position 1, 2, 3, 8, 9 — alltså är index 2 position 3,
och det är den positionen Steg 4 mätte upp som måttritning i 23 av 30 fall.

## En bild kastad: `56cca82a` index 3

Den TYSKA marknadsgrafiken (`STABILER SOCKEL`). Enda bilden i rundan som kastas
— talen den bar bor nu i spec-tabellen och på rundans eget kort. Produkten har
därför fem bilder mot de andras sex, och kvittot förväntar sig just fem.

## Alt-texten gick genom RUNDANS EGEN förbjudna-ord-lista

☠️ **Alt-texten passerar ingen av rundans vanliga grindar** — textgrinden läser
`texter.py` och `brodtext.py`, och alt-texten finns i ingendera. Varje regel
grinden vaktar är alltså oskyddad på det ställe Google och skärmläsaren läser.

`alttexter.granska()` kör därför `grind.FORBJUDET` — **samma lista, inte en
omskriven variant** — plus `ARTNR`, homoglyferna och trekonsonantsregeln över
varenda alt-text. Och en till, som är rundans egen: **samma text på två bilder
är en mall, inte en beskrivning**, så en dubblett inom en produkt fäller.

⚠️ **Varan beskrivs, inte stajlingen.** Barnet på `56cca82a` bild 02, boxaren på
`93073695` bild 02 och växten på `f0430bc5` bild 02 är leverantörens iscensättning
och inte produktinformation. Utelämnade är texterna fortfarande sanna och
fullständiga.
