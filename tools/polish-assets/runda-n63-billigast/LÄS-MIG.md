# Runda N63 — fyra produkter för 459–1129 kr

Fyra Aosom-utkast är polerade och publicerade, billigast först och utan
prisjämförelse. Sökorden är valda på Semrush-data, och rundan är skriven helt
via workflowen "Polering — skriv en runda till Wix".

| id | produkt | SKU | huvudsökord (sökningar/mån, svårighet) | pris | saldo |
|---|---|---|---|---:|---:|
| fa1fdcbf | Toalettpall i bambu, hopfällbar – U-formad ovansida, halkfria spår, bär 130 kg | FP-toalettpall-bambu | toalettpall (390, 18) | 459 kr | 197 |
| 071dbdf8 | Badrumshylla i bambu och svart stål – fyra plan, 110 cm hög, med tippskydd | FP-badrumshylla-bambu-4plan | badrumshylla (8 100, 28) | 479 kr | 163 |
| c0c2822f | Gatlykta för jul 150 cm med snöat granris och 50 flerfärgade LED, IP44 | FP-gatlykta-snoad-jul | julbelysning utomhus (6 600, 21) | 1 029 kr | 197 |
| 60e250d4 | Snöskyffel med hjul, 95 cm bred – snöplog i aluminium med ställbart handtag | FP-snoskyffel-hjul-95 | snöskyffel med hjul (210, 11) | 1 129 kr | 197 |

**Inget pris är rört.**

## Urvalet: kön är tom med de regler som gäller

N62 mätte hela katalogen direkt efter sin skrivning och hittade 23 utkast som
ingen runda hade rört. Två av dem publicerades här, toalettpallen och
badrumshyllan. De andra 21 hör till familjer som redan är täckta: tio
sidobord och satsbord, ett soffbord, en bokhylla, sju pallar och sittpuffar
och två julgranar.

Rundan tog därför också jul- och vintervarorna, som N60 hade skjutit till
oktober. En sida som publiceras i slutet av september hinner indexeras före
julhandeln i november. Ett nytt svep över katalogen gav 17 julgranar och 13
andra jul- och vintervaror bland utkasten (svepet fångade också vinterfasta
djurbostäder, tält och paviljonger, som redan har andra skäl). Julgranarna och de uppblåsbara
julfigurerna hör till täckta familjer, adventskalendrarna har träffat
publicerade sidor i tidigare skärmar, och julgirlangen har saldo 2. Två gick
vidare: gatlyktan och snöskyffeln.

Fem kandidater dubblettskärmades mot alla 3 420 publicerade sidor. Skärmen gav
bara brus: toalettpallen mot ett väggklösträd och bambuhyllan mot en köksvagn
och balansstenar. De två gatlyktorna träffade varandra (samma mått, 43 × 43 ×
150 cm och 6,1 kg), men inte den publicerade julyktstolpen `4fc04535`, som
mäter Ø35 × 150 cm och väger 4,5 kg. Julgirlangen föll på saldot före
skärmen.

Hölls:

- **Samma slag som en produkt i rundan:** gatlyktan med varmvita LED
  `7c18b805` (1 179 kr). Den har samma mått som den flerfärgade `c0c2822f`
  (1 029 kr), som är billigare, men varmvitt ljus och grönt ris utan snö. Den
  kan tas i en senare runda om varmvitt ska finnas vid sidan av den
  flerfärgade.
- **Saldo 2:** julgirlangen `0b34e594`.

Varje hoppat utkast står med sitt skäl i `FLAGGADE.md`, och ett skript
kontrollerar att vart och ett av de 21 hoppade bland de 23 har exakt ett skäl.

Efter skrivningen lästes saldot om för de 34 utkast som tidigare rundor hoppat
bara för att de var slutsålda eller låg på lagerbufferten. Alla står
fortfarande på 0–3, så inget av dem kan tas än.

## Sökorden

Semrush (databas `se`, 2026-09-24) mätte 39 sökord, som står i `sokord.tsv`.
Valet står i `sokval.tsv`, efter en sökning i butiken på varje huvudord:

- **Toalettpallen** fick `toalettpall` (390, 18). `bajspall` (880, 18) står en
  gång i texten, och `squatty potty` (590, 63) är ett varumärke och används
  inte.
- **Badrumshyllan** fick `badrumshylla` (8 100, 28), eftersom `bambuhylla`
  (260, 11) bärs av två publicerade bambuhyllor.
- **Gatlyktan** fick `julbelysning utomhus` (6 600, 21), med `gatlykta` (320,
  20) i namnet, eftersom `lyktstolpe` (2 400, 14) bärs av den publicerade
  julyktstolpen och fem solcellslampor.
- **Snöskyffeln** fick `snöskyffel med hjul` (210, 11) och `snöplog` (1 300,
  11) i namnet, eftersom `snöskyffel` (9 900, 22) bärs av den publicerade
  snöskyffeln på 45 cm.

## Bilder

Tre bilder är strukna (`bilder-bort.tsv`): en engelsk tidningstitel som går
att läsa i en av toalettpallens bilder, och läsbar text på ett doftljus i två
av badrumshyllans. Toalettpallen har fyra bilder kvar och badrumshyllan tre:
bilden på vit botten, en miljöbild och måttbilden.

## Källa mot bild

- **`c0c2822f`:** en av bilderna visar två gatlyktor längs en gång, men
  leveransen är en. Texten säger det i en av de vanliga frågorna.
- **`c0c2822f`:** lyktan passar också inomhus, enligt tre av bilderna. Källan
  nämner bara entré, veranda och trädgård.
- **`071dbdf8`:** källan säger badrum och hall, men bilderna visar hyllan vid
  ett skrivbord och bredvid en soffa. Texten nämner badrum, hall och soffa.

## Kvitto

- Alla filgrindar gick rena: text (`gate.py`), axel, alt (17 alt-texter), SEO,
  lager (lägsta saldo 163), SKU, superlativ och länkar.
- Ingen av rundans fyra slugar fanns i katalogen. Frågan bar en känd slug som
  kontroll, och den hittades.
- Ruttens båda artikelnummerformer kördes lokalt mot alla 84 strängar i
  planen. Den enda träffen var rundans eget namn i fältet `runda`.
- Torrkörningen (körning 35984456922) godkände text, media och SKU för alla
  fyra och kategorier för alla nio rader, bland dem Juldekoration.
- Skrivningen (körning 35984650238) svarade "Verifierade 4 av 4, stämplade 4,
  stämpelfel 0".
