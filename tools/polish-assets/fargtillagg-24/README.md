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

## Live

Mätt 10:36 UTC med `live-galleri.mjs`, en färg i taget, efter att butikens cache byggts om
(sidan `age` 20 s). Svart visar sina sex bilder (#1–#6) och Mörkgrå sina fem (#7–#11):
packshot, vardagsrum, foten, måttskissen och den nya närbilden sist. Den tyska bilden syns
inte i någon färg.

☠️ **En omrendering gick fel i fem minuter.** Butiken byggde om sidan 10:30:53, sekunder
efter skrivningen, och sidan fick då SDK-listans sex första bilder och inga Mörkgrå-bilder:
`imageOwners` hade tre poster (Svart, ur alt-texten) och Mörkgrå visade Svarts bilder
(mätt: båda färgerna `#1–#6` plus Mörkgråas variantbild). Wix var rätt hela tiden: GET,
query och search gav elva bilder och rätt länkar när det mättes 10:31 och 10:33. Koden i
`lib/products.ts` (headless-site) förklarar formen: faller V3-anropet i `fetchV3ProductRaw`
behåller sidan SDK-galleriet och markeras kortlivad (`kortLivslangd`), och den byggdes om
korrekt 10:35:53. Varför anropet föll är inte mätt. Mät därför om sidan efter fem minuter
innan en färgsida kallas rätt eller fel, och titta på `imageOwners`, inte bara antalet bilder.

## Alt-texten på plats 9 rättad (2026-10-30, Leonards *Fixa alt texten*)

Alt-texten på galleriets plats 9 (`a34aef`) sa *Närbild på sits och armstöd, med den
korsformade träfoten under*. Bilden visar ett ben på den korsformade foten med två svarta
skruvar, och bara kanten på sitsen längst upp. Inget armstöd syns, så texten beskrev den
nya bilden på plats 11 i stället. Alla Mörkgrås bilder lades bredvid sina alt-texter:

| plats | bild | alt-text |
| :-- | :-- | :-- |
| 7 | packshot på vit botten | oförändrad (beskriver också sidans funktioner, inte bara bilden) |
| 8 | i ett vardagsrum, fjärrkontrollen i fickan | stämmer, oförändrad |
| 9 | ett ben på korsfoten, två svarta skruvar | **rättad:** *Närbild på ett ben på den korsformade foten i trä, med två svarta skruvar* |
| 10 | måttskiss | **stavfel rättat:** *mörkgråa* → *mörkgrå* |
| 11 | armstödet med sidofickan och fjärrkontrollen | stämmer, oförändrad |

Rättningen är bildplanen `tools/polish-assets/runda-alt-massagefatolj/bildplan.json`
(workflowen *Polering — skriv bara bilderna*, sha256 `b68b478b…`). Den bär hela galleriet i
oförändrad ordning, med samma fil-id, och ändrar bara texten på plats 9 och 10. Ingen färg
nämns i den nya texten på plats 9, så bildens ägare ändras inte av ordval (en olänkad bild
som nämner en färg hör till den färgen), och bilden är dessutom länkad till Mörkgrå.

### Utfall

- Torrkörning (run 41048474765): 1 av 1 sida läst, 11 bilder, ingen länkad bild tappas.
- Skarpt (run 41048730550, 11:32 UTC, utanför Aosoms synkfönster): 1 av 1 skriven, `variantbilder:
  1 rättad, 0 kvar, 0 avvikelser`, återläsningen ok med 11 bilder. Wix revision 35 → 37.
- Egen läsning i Wix efteråt: galleriet har samma elva fil-id i samma ordning, bara alt-texten på
  plats 9 och 10 skiljer från före. Valens länkar är oförändrade (Svart sex, Mörkgrå fem), båda
  varianterna är synliga med sina SKU och priser (2 399 och 2 519 kr), varje variants bild är sin
  färgs första (`c5410a` och `91ecf4`), produktens namn, adress och synlighet är orörda.
- Live (butikens cache byggd om 11:36 UTC): sidans `images` har 11 bilder, `imageOwners` Svart sex
  och Mörkgrå fem, och alla elva `imageAlts` är lika med Wix. I en webbläsare visar Svart #1–#6 och
  Mörkgrå #7–#11, med priserna 2 399 och 2 519 kr.
