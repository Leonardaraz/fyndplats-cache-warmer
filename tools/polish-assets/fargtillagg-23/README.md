# fargtillagg-23 — dubbelmotorstativet `7ab49b8a`, Svart (2026-10-29)

Leonard: *"den har vita bilder på svarta alternativ ta bort o hämta rena bilder på
svarta alternativ o koppla"*.

## Vad Svart visade

Svart (`f4f0198e`) hade fyra länkade svarta bilder. Butiken visade dessutom tre
olänkade bilder med det vita stativet, eftersom de räknas som gemensamma
(`arKort`): kortet om bordsskivorna (plats 3), specifikationskortet (plats 4) och
den vita måttskissen (plats 5). Torrkörningen sa `nuvarande 7`.

## Vad som gjordes

1. **Ett svart foto till Svart.** Feedens position 4, 6, 7, 8, 9 och 10 för den
   svarta artikeln laddades upp som kandidater och granskades
   (`granskning.tsv`). Position 10 valdes och skrevs med `aosom-fargtillagg`
   (`plan` → `skriv`): galleri 9 → 10, länken till Svart, återläst,
   variantbilden rättad och kopplingen sparad i mappningen.
2. **De tre vita bilderna länkades till Vit** (`a2f396b7`), så att de bara syns
   där. Inget verktyg länkar en befintlig gemensam bild till en färg
   (`aosom-fargtillagg` fäller den som `annan_kalla`), så skrivningen gjordes med
   ExecuteWixAPI på Leonards begäran, med samma steg som `skrivSida` i
   `lib/aosom/fargbilder-kor.ts`: läsningen med `MERCHANT_DATA`, `options` och
   `variantsInfo` ordagrant ur GET:en med bara kostnaden kvar i
   `revenueDetails`, `visible` explicit, fältmasken
   `options, variantsInfo, visible`. Återläst: Vit 2 → 5 länkar, Svart
   oförändrad, galleriet oförändrat, och varianternas id, SKU, pris, synlighet,
   val och kostnad oförändrade. Ingen bild togs bort.
3. `variantbild.yml` (skarp, bara sidan): 1 rättad, 0 avvikelser.

## Inte gjort

- Svarta versioner av de två Fyndplats-korten. De visar det vita stativet och
  syns nu bara på Vit. Leonards beslut 2026-09-30 är leverantörens rena bilder
  före egna kort.
- Måttskisserna (båda färgerna) säger 83–130 cm i bredd, medan Aosoms text,
  kortet och sidan säger att ramen dras ut 100–156 cm. Inget är ändrat.
