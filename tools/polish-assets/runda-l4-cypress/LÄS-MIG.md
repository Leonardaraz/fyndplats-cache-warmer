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

## ☠️ Ny mätning: LÄSPROJEKTIONEN SLÄPAR ÄVEN FÖR MEDIA

Runbooken vet redan att kategoriläsningen är eventuellt konsistent, och att
bulk-svarets `itemMetadata` är facit i stället för en återläsning. Samma sak
gäller **`media.itemsInfo`**, vilket den här rundan mätte upp.

En `GET …?fields=MEDIA_ITEMS_INFO` direkt efter en media-PATCH gav för två av
sju produkter det GAMLA tillståndet:

| | vad återläsningen sa | vad som faktiskt gällde |
|---|---|---|
| `39c90d59` | 0 alt-texter satta | **5 satta** |
| `5a2bd33d` | 5 bilder, 5 tyska alt | **4 bilder, 4 svenska alt** |

De fem andra rapporterade rätt direkt. En läsning en stund senare visade att
alla sju var korrekta hela tiden — skrivningarna hade gått igenom.

⚠️ **Riktningen spelar roll: den här släpningen UNDERrapporterar.** Den kan
få en korrekt skrivning att se misslyckad ut, och därmed utlösa en omskrivning
som inte behövs — men den kan inte få en misslyckad skrivning att se lyckad ut.
Det är det ofarliga hållet att fela åt, och tvärtom mot `sku`-förväxlingen.

**Regeln: verifiera media i en EGEN runda efter att alla skrivningar är gjorda,
inte direkt efter var och en.** Det är så SKU-skrivningen i den här rundan är
upplagd, och den gav sju av sju rätt på första försöket.

## Skrivningen till Wix — kvitto

| kontroll | utfall |
|---|---|
| text mot källfil | **7/7 exakta** |
| namn, slug, `visible: true` | 7/7 |
| SEO, två taggar, tyskt nyckelord rensat | 7/7 |
| alt-texter | **34 satta, 0 tyska** |
| bilder | 34 (måttritningen borta från `5a2bd33d`) |
| variant-SKU | **7/7**, alla unika — fyra delade `FP-2er-set-kunstliche` |
| variantens `visible` och priset | orörda på alla sju |
| kategorier | **19 av 19**, noll fel |

## Mappningsraden — las + stampla

Fjorton körningar av `polish-mapping.yml`, alla med **explicit
`ref: claude/seo-polering-runbook-review-uq6fwl`** (aldrig `main` — #181).

| läge | körningar | utfall |
|---|---|---|
| `las` | 2802–2808 | **7/7 gröna** |
| `stampla` | 2809–2815 | **7/7 gröna** |

En grön `las` ÄR prisgrindens kvitto: workflowen avslutar med `exit 1` på både
`stammer: false` och `EJ AVGORBAR`, så ett grönt jobb betyder att mappningens
kostnad, husets regelpris och Wix faktiska pris är överens på raden.

## Live-verifieringen — 7/7 REN

Hämtat ISR-medvetet (`hamta-live.sh 90`): varm träff, 305 s väntan tills sidorna
hunnit bli inaktuella, sedan skarp hämtning. Alla sju svarade **HTTP 200** med
`age` 62–71 s — alltså den rendering den varma träffen utlöste, inte en äldre
cachad sida.

```
39c90d59  ord=491  diff=0  -> REN        74330920  ord=508  diff=0  -> REN
5a2bd33d  ord=492  diff=0  -> REN        007e8c7b  ord=475  diff=0  -> REN
7e66b14b  ord=468  diff=0  -> REN        85619689  ord=489  diff=0  -> REN
                                         e8c4c9d7  ord=473  diff=0  -> REN
TOTALT: 0 avvikelser i den PUBLICERADE texten
```

### ☠️ Och grinden är verifierad att den KAN SE

En grind som är påslagen säger ingenting om att den kan fälla (#171, runda J2:
alt-svepet var på, dokumenterat och blint i en hel runda). Tre fel planterades
därför i en kopia av de hämtade sidorna, ett per svep:

| planterat | i | vad grinden sa |
|---|---|---|
| `Gewicht` i `<title>` | `39c90d59` | **3 fel** — sidsvep, exakt SEO-diff mot `seo.tsv`, tyskt ord i titeln |
| tysk alt-text | `5a2bd33d` | **2 fel** — `Kunststoff` och `mit` |
| *"Leverantören anger…"* i brödtexten | `7e66b14b` | **13 fel** — orddiff 12 + husregelbrottet |

De fyra orörda sidorna förblev REN. Rätt produkt, rätt svep, inga falsklarm.

⚠️ **Och asymmetrin syns i talen: orddiffen var 0 på både titel- och
alt-planteringen.** Orddiffen läser BRÖDTEXT. En tysk titel och en tysk
alt-text passerar den helt — de fångas bara av SEO- respektive alt-svepet.
Det är exakt varför de tre svepen finns var för sig, och varför en runda som
bara mäter orddiffen kan rapportera 0 avvikelser med tyska i sökresultatet.
