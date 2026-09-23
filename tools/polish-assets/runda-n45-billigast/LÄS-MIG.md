# Runda N45 — femton produkter för 559–599 kr

Femton Aosom-utkast polerade och publicerade, billigast först utan
prisjämförelse. Första rundan på det snabbare arbetssättet (2026-09-23): en
träff mot en publicerad sida i dubblettskärmen betyder att kandidaten hoppas
över utan utredning, stämpelns egen återläsning ersätter den separata `las`,
och resultaten loggas här direkt efter varje steg.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 173bc5bd | Smal julgran 195 cm med 556 grenspetsar och 25 kottar – Ø54 cm, i sektioner | FP-julgran-smal-195-556-spetsar | 559 kr | 112 |
| 300d3415 | Julby i trä med 10 LED – kyrka, hus och granar, 45 × 10 × 25 cm | FP-julby-tra-10-led | 559 kr | 197 |
| 2cb5b77e | LED-björk 180 cm med 96 LED – vit stam, 12 grenar och 5 m sladd | FP-led-bjork-180-96-led | 559 kr | 197 |
| badc577d | Nattduksbord med dold låda – svart, öppet fack med mellanvägg, 40 × 30 × 46 cm | FP-nattduksbord-dold-lada-svart | 559 kr | 28 |
| db4808e6 | Smart hula hoop med viktkula och räknare – 16 delar för midjor 76–113 cm | FP-hula-hoop-viktkula-rosa | 559 kr | 197 |
| edac1214 | Konstgjord bambu 90 cm med 504 blad – fem stammar och kruka med cement | FP-konstbambu-90-504-blad | 559 kr | 54 |
| 06675244 | Julgran 100 cm med snöade spetsar och kottar – Ø60 cm, guldfärgad kruka | FP-julgran-100-sno-kottar | 569 kr | 197 |
| 119c6052 | Medicinskåp med kodlås – 30 × 14 × 30 cm, halvhylla och handtag, för väggen | FP-medicinskap-kodlas-30x30 | 569 kr | 197 |
| 2f1246a1 | Hängande halloweenmumie 142 cm – röda ögon, ljud och spindlar | FP-halloween-mumie-142 | 569 kr | 197 |
| 5f8aed80 | Förvaringsskåp med två tyglådor – rustikt brun, stålram, 45 × 40 × 70,5 cm | FP-skap-tva-tyglador-rustik | 579 kr | 22 |
| 80558327 | Duschpall i bambu med hylla – bär 100 kg, 47,5 × 26 × 44,5 cm | FP-duschpall-bambu-hylla | 579 kr | 53 |
| b99bb9cc | Bokhylla på hjul med tre plan – vit metall, låsbara hjul, 69 × 26 × 108 cm | FP-bokhylla-hjul-tre-plan-vit | 579 kr | 42 |
| be52938b | Lekmatta 196 × 176 cm, dubbelsidig och vikbar – 1,5 cm tjockt skum | FP-lekmatta-196x176-dubbelsidig | 579 kr | 58 |
| 30fe3828 | Sidobord med laddstation – eluttag, USB och USB-C, två tyglådor, 63 cm högt | FP-sidobord-laddstation-tyglador | 599 kr | 197 |
| 33cf9b15 | Snöskyffel 45 cm med extra handtag – D-grepp, metallkant och aluminiumskaft | FP-snoskyffel-45-extra-handtag | 599 kr | 197 |

**Inget pris är rört.**

## Wix, i den ordning det skrevs

| steg | utfall |
|---|---|
| 1 text, namn, slug, SEO, synlighet (två anrop, 8 + 7) | 15 av 15 skrivna, transkriberingsspärren ren i båda |
| 2 media | 15 av 15 skrivna, 70 bilder, spärren ren |
| 3 kategorier | 31 av 31 rader success i 11 kategorier, `bulkActionMetadata` 0 fel överallt |
| 4 variant-SKU (sist och ensam) | 15 av 15 skrivna; alla varianter synliga före, pris orört (559–599) |
| stämpel (`stampla`, körningar 4038–4052) | 15 av 15 gröna; rutten läser tillbaka raden själv och svarar 500 om den inte stämmer |
| 5 separat återläsning | 15 av 15 helt verifierade vid första läsningen (text-hash, namn, slug, SEO två taggar, media, kategorier, SKU, synlig variant); pris 559–599 som förut |

## Grindar före skrivningen

Alla rena, omkörda för protokollet efter publiceringen: `gate.py` (0 fynd i 15
filer mot källan), `gate-axel.py` (0 axelfel), `gate-alt.py` (70 alt-texter,
0 fynd), `gate-seo.py`, `gate-lager.py` (lägsta saldo 22), `gate-sku.py`,
`gate-superlativ.py`, `gate-lankar.py` och läck- och teckensvepet (0 fynd i
20 filer). Formsvepet på hela katalogen hittar bara våra egna SKU- och
slug-delar (`100-sno`, `504-blad`, `556-grenspetsar`), inga artikelnummer.

## Live

`hamta-live.sh 130` (alla 15 med HTTP 200) följt av `livegrind.py`: orddiff 0
på alla 15, 0 avvikelser i den publicerade texten. `livekoll.py`: 15 av 15 OK
med brödsmula, pris och `InStock`, och 70 av 70 alt-texter. Den andra
korrekturläsningen av publicerad text gjordes inte, enligt det snabbare
arbetssättet; grindarna ovan är desamma som förut.

## Hölls

Sexton kandidater hoppades över eller byttes ut, alla med en rad i
`FLAGGADE.md`: en dyrare tvilling till lekmattan, fem träffar mot publicerade
sidor (sparkcykel, trädbokhylla, springcykel, miniugn, sadelpallar), en
brusig förvaringshylla, två med för lite saldo och ljusgardinen som byttes mot
snöskyffeln. Reserverna till N46 står sist i filen.
