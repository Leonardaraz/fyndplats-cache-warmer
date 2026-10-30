# fargtillagg-24 — massagefåtöljen `89fead7d`, Mörkgrå (2026-10-30)

Leonard: *"mörkgråa varianten har en tysk textad bild som nummer 3, ta bort den och
kolla om det finns en annan ren bild du kan ersätta den med"*.

## Vad Mörkgrå visade

Mörkgrå (`7909f4e8`) hade fem länkade bilder: packshot, vardagsrum, ett närbildsfoto
av sitsen med en knuten hand, ett foto av foten och måttskissen. Bild 3 (galleriets
plats 9) bär tysk text inbränd (*Hochdichter Komfortsitz* med en tysk brödtext). Det är
feedens position 8 för den mörkgrå artikeln. Svart (`f4f0198e`) har samma motiv utan
text och visade ingenting felaktigt.

## Vad som gjordes

1. **Den tyska bilden bort.** `bilder-bort.yml`, torrt och sedan skarpt med planens sha:
   galleriet 11 → 10, Mörkgrå 5 → 4 länkade bilder, återläst (galleri, alt-texter,
   länkar, synlighet och varianter), varukorgens bild rättad.
2. **Alla tio feedpositioner för den mörkgrå artikeln hämtades och granskades**
   (`aosom-fargtillagg`, `kandidater`, tio uppladdade, noll missar; `granskning.tsv`).
   Position 1, 2, 3 och 9 är bilder sidan redan har (dHash 0). Position 4, 5, 6, 7 och 8
   är tyska säljgrafiker. Position 10 är ett rent närbildsfoto av armstödet och
   sidofickan med fjärrkontrollen mot vit botten, och skrevs.
3. **Skrivningen.** `plan` → `skriv` (plan sha `fa5a7b0b…`): galleri 10 → 11, länken till
   Mörkgrå, återläst, variantbilden rättad, kopplingen sparad i mappningen.

## Återläst i Wix efteråt

- Galleriet 11 bilder, den tyska borta, den nya på plats 11 med alt-texten *Närbild på
  armstödet och sidofickan med fjärrkontrollen på den mörkgrå massagefåtöljen*.
- Mörkgrå: fem länkade bilder (`91ecf4`, `5c44ce`, `a34aef`, `a04cd1`, `70c85f`).
  Svart oförändrad med sex.
- Varianternas id, SKU, pris (2 399 och 2 519 kr), synlighet och kostnad oförändrade.
  Varukorgens bild: Svart `c5410a`, Mörkgrå `91ecf4`.

## Observation, inte ändrad

Alt-texten på galleriets plats 9 (`a34aef`, foten med de två svarta knapparna) säger
*Närbild på sits och armstöd, med den korsformade träfoten under*. Bilden visar foten
och kanten på sitsen, inget armstöd. Texten beskrev snarare den nya bilden.
