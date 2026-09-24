# Runda N46 — femton produkter för 599 kr

Femton Aosom-utkast polerade och publicerade, billigast först utan
prisjämförelse, på samma snabbare arbetssätt som N45: en träff mot en
publicerad sida i dubblettskärmen betyder att kandidaten hoppas över,
stämpelns egen återläsning ersätter den separata `las`, och resultaten loggas
här direkt efter varje steg.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 2fc13340 | Luftmadrass för två, 203 × 152 cm – 22 cm hög, handpump och två kuddar | FP-luftmadrass-tva-203x152 | 599 kr | 32 |
| 308cabee | Konstgjord palm 100 cm med 27 blad – fem stammar och kruka med cement | FP-konstpalm-100-27-blad | 599 kr | 95 |
| 423edb5d | Bokhylla för barn med fyra hyllor – vit med ribbor i furu, 60 × 10 × 98 cm | FP-barnbokhylla-fyra-hyllor-vit | 599 kr | 197 |
| 4dc2759a | Upphöjd husdjurssäng i grå plysch – rundad rygg och ben i furu, Ø40,5 cm | FP-husdjurssang-upphojd-gra | 599 kr | 91 |
| 61917e9a | Sidobord i svart stål med hylla – industristil, 40 × 40 × 45 cm | FP-sidobord-svart-stal-hylla | 599 kr | 197 |
| 6690086e | Hopfällbar skohylla i bambu med fyra plan – 12 par, 60 × 29 × 67 cm | FP-skohylla-bambu-fyra-plan | 599 kr | 118 |
| 7ba0423b | Blomsterhylla i trä med sex plan – karboniserad gran, 95 × 28 × 96,5 cm | FP-blomsterhylla-tra-sex-plan | 599 kr | 15 |
| 80de1b65 | Konstgjorda lavendelträd 60 cm, två stycken – kulformade kronor och kruka | FP-lavendeltrad-60-tva | 599 kr | 91 |
| 8aab4f48 | Badrumsskåp i bambu – öppen hylla och skåp med lamelldörr, 33 × 36,5 × 67 cm | FP-badrumsskap-bambu-67 | 599 kr | 11 |
| 97cf9327 | Uppblåsbar snögubbe 180 cm med LED – polkagriskäpp och julklapp, IP44 | FP-snogubbe-uppblasbar-180 | 599 kr | 56 |
| 9c3b6e2f | Konstgjort rosenträd 90 cm med rosa rosor – flätad stam och kruka med cement | FP-rosentrad-rosa-90 | 599 kr | 69 |
| af994f2d | Barstol med gaslyft, sitthöjd 55–76 cm – svart sits, vridbar 360° | FP-barstol-gaslyft-svart | 599 kr | 135 |
| b73863ff | Vinställ för väggen, sex flaskor – svart stålrör, 27 × 10 × 71 cm | FP-vinstall-vagg-sex-flaskor | 599 kr | 175 |
| b8d8a982 | Elektronisk darttavla i skåp – 31 spel, 285 varianter, upp till 8 spelare | FP-darttavla-skap-31-spel | 599 kr | 197 |
| cc18bc6f | Konstgjord bananväxt 150 cm med 18 blad – i kruka med cement | FP-bananvaxt-150-18-blad | 599 kr | 16 |

**Inget pris är rört.** Alla 15 `las`-körningar (4053–4067) gick gröna, alltså
stämde prisgrinden (`x1,2`, `charm99`) på varje rad.

## Bilder

Kontaktarken lästes före texten. Två bilder ströks: snögubbens bild 5 bär
husmärkets logga, och rosenträdets måttbild (bild 3) har tysk text inbränd.
Rosenträdet har därför ingen måttbild; måtten står i texten.

## Wix, i den ordning det skrevs

| steg | utfall |
|---|---|
| 1a text, namn, slug, SEO, synlighet (8 produkter) | 8 av 8 skrivna, transkriberingsspärren ren |
| 1b text, namn, slug, SEO, synlighet (7 produkter) | 7 av 7 skrivna, transkriberingsspärren ren |
| 2 media | 15 av 15 skrivna, 73 bilder, spärren ren |
| 3 kategorier | 34 av 34 rader success i 15 kategorier, `bulkActionMetadata` 0 fel överallt |
| 4 variant-SKU (sist och ensam) | 15 av 15 skrivna; alla varianter synliga före, pris 599 orört |
| stämpel (`stampla`, körningar 4068–4082) | 15 av 15 gröna; rutten läser tillbaka raden själv och svarar 500 om den inte stämmer |
| 5 separat återläsning | 15 av 15 helt verifierade vid första läsningen (text-hash, namn, slug, SEO två taggar, media, kategorier, SKU, synlig variant); pris 599 som förut |

## Grindar före skrivningen

Alla rena: `gate.py` (0 fynd i 15 filer mot källan; två räknetal kvitterade i
`foto-tal.txt`), `gate-axel.py` (0 axelfel), `gate-alt.py` (73 alt-texter, 0
fynd), `gate-seo.py` (en titel med `2-pack` skrevs om till `Två …` eftersom
tvåan inte stod i källan), `gate-lager.py` (lägsta saldo 11), `gate-sku.py`,
`gate-superlativ.py`, `gate-lankar.py` och läck- och teckensvepet (0 fynd i
20 filer). SKU och slug krockar inte med någon tidigare runda.

## Live

`hamta-live.sh 130` (alla 15 med HTTP 200, `age` 150–574 s vid den skarpa
hämtningen) följt av `livegrind.py`: orddiff 0 på alla 15, 0 avvikelser i den
publicerade texten. `livekoll.py`: 15 av 15 OK med brödsmula, pris 599 och
`InStock`, och 73 av 73 alt-texter.

## Hölls

Alla med en rad i `FLAGGADE.md`: lavendelträdens tvilling, en darttavla med
samma siffror som en publicerad, sju träffar mot publicerade sidor, en
salongspall ur `main`-seriens familj, ljusgardinen (sommarsäsong igen) och
fem säsongsvaror. Reserverna till N47 står sist i filen.
