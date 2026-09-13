# Runda L4 — cypresser och lavendelklot, 699–1 169 kr

Sju utkast som stänger konstväxtklustret. Alla sju delar familj men skiljer sig
på de två axlar en kund faktiskt väljer efter: **hur växten står** (kruka eller
jordspett) och **vilken form den har**.

| kort | form | antal | höjd | montering | pris | saldo |
|---|---|---:|---:|---|---:|---:|
| `39c90d59` | smal kon, 831 blad | 2 | 90 | svart odlingskruka | 1 169 | 114 |
| `5a2bd33d` | smal kon, 831 blad | 2 | 100 / 80 | **jordspett** | 1 099 | 16 |
| `7e66b14b` | smal kon, 638 blad | **1** | 120 | svart odlingskruka | 979 | 74 |
| `74330920` | rund buske, 387 blad | 2 | 60 | **jordspett** | 819 | 32 |
| `007e8c7b` | spiral, 693 blad | **1** | 90 | tyngd kruka | 799 | 66 |
| `85619689` | bred kon, blågrön | 2 | 90 | **grå dekorkruka** | 779 | 23 |
| `e8c4c9d7` | lavendelklot Ø42 | 2 | — | **ingen kruka** | 699 | 37 |

## Så här togs den fram

1. **Lagergrinden i urvalet.** `a1aed632` föll för andra gången — saldo 0 nu,
   1 vid L3. Se `utesluten/`.
2. **Källorna hämtade ordagrant ur Wix och bevisade** — 7 av 7 exakta,
   `kvitto-kalla.json`. Inget artikelnummer i rundans katalog.
3. **Dubblettskärm på byte-identiska bilder**, utvidgad till en PUBLICERAD
   sida: 40 bilder, 40 unika md5, noll delade mot `0e520c93`.
4. **Kontaktark FÖRE brödtexten.** Sju fynd, se `FOTOFYND.md`.
5. **Texterna skrivna i fil**, aldrig inline i ett API-anrop.
6. **Grindarna körda**, alla gröna.

## ☠️ Den dubblett som inte var en dubblett

`007e8c7b` är en spiralformad konstväxt på 90 cm i svart kruka. Det är
PUBLICERADE `0e520c93` också. Bildskärmen gav noll gemensamma md5 — men det är
sufficient bevis, inte nödvändigt (#194): två fotograferingar av samma vara
passerar den skärmen utan att blinka.

Det som avgjorde var fotona skalade till samma höjd sida vid sida. Den
publicerade är **mörkt grön och nålig och väger 7 kg**; kandidaten är **ljust
grön med breda platta solfjädrar och väger 4,3 kg**, i en mindre kruka. Två
olika växter i samma form.

De är ändå nära syskon i kundens öga — samma höjd, samma form, samma krukstil,
1 019 mot 799 kr. Texterna är därför skrivna så att lövverket är det första
som skiljer dem åt.

## ⚠️ Två par i rundan som måste gå att skilja åt

`39c90d59` och `5a2bd33d` har **samma bladantal (831) och samma Ø33**. De är
samma växtkropp i två monteringar: en i kruka på 90 cm och 8 kg, en på
jordspett på 100 cm och 3 kg. Monteringen står därför i första meningen i
båda texterna och i båda produktnamnen — annars är sidorna omöjliga att skilja
åt i en kategorilista.

## Vad som INTE gick igenom

`bilder-bort.tsv` tar bort måttritningen från `5a2bd33d`. Den bär en tysk
mening över hela nederkanten. **Talet 80 cm lästes ur den först** och står i
`foto-tal.txt` — ritningen är det enda stället höjden utan spett finns.

## Filer

| fil | vad |
|---|---|
| `kallor.json` + `kvitto-kalla.json` | källtexterna ordagrant, med checksummebevis |
| `<kort>.html` | de svenska texterna |
| `FOTOFYND.md` | vad fotona sa innan texten skrevs |
| `foto-tal.txt` | tal som bara går att läsa på bilden |
| `alt.tsv` | 34 alt-texter |
| `bilder-bort.tsv` | måttritningen med tysk mening |
| `namn.tsv`, `slugs.txt`, `sku.tsv`, `seo.tsv` | namn, slug, SKU, sökresultat |
| `kategori.tsv` | kategorikopplingar |
| `ids.tsv`, `lager.tsv` | urvalets facit och saldo |
| `axelfacit.json` | genererad server-side ur `plainDescription` |
