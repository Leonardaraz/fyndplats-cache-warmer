# Runda N388: kök, barn och hem (påbörjad 2026-11-24)

Åtta nya Aosom-utkast (importerade 18–24 nov). Steg 1–5 och 7 klara, bilder för tre produkter saknas.

| kort | vara | saldo | prisgrind | bilder |
|---|---|---|---|---|
| 1de2e6f6 | raclettegrill 8 personer, två nivåer | 138 | stämmer | 5 rena (3 är måttbild, läggs sist) |
| 0c27adb9 | fritös 5 liter med tre korgar | 110 | stämmer | 5 rena (3 är måttbild) |
| 754fbf7e | teppanyaki-grill 70 × 23 cm | 114 | stämmer | bild 3 struken (engelsk text): 3 kvar, behöver fler |
| 10196ab8 | vattenkokare och brödrost, gräddvit | 135 | stämmer | bild 3 struken (engelsk text): 4 kvar, behöver en till |
| 87b31333 | sminkspegel LED med förvaringsbox | 53 | stämmer | bild 4 och 5 strukna (tysk text): 3 kvar, behöver två till |
| 4387858a | barnskrivbord med stol, lutande skiva | 150 | stämmer | 5 rena (3 är måttbild) |
| 71ca8e8f | moppset med tvåkammarhink | 140 | stämmer | 5 rena (3 är måttbild) |
| 4a5b6f01 | kökshylla med arbetsskiva, 4 nivåer | 12 | stämmer | 5 rena (3 är måttbild) |

Fraktandel nära 0,5 (polera sist): sminkspegeln 0,49, kökshyllan 0,46, moppsetet 0,44.

## Gjort
- Dubblettsvepet (`aosom-familjer.yml`, alla/alla, 2026-11-24 21:16 UTC): ingen av de åtta står i en familj.
  Mått mot publicerade sidor: fritösen `69cabbc9` (49,5 × 35 × 23 mot 40 × 33 × 24), raclettegrillen `cafe692a`
  (44 × 21 × 13,4 mot 49 × 25,5 × 12,5) och sex vattenkokare med brödrost har andra mått.
- Källtexterna i `kallor.json` är jämförda mot Wix (längd och checksumma lika, alla åtta). Artikelnummer redigerade.
- Paketmåtten som inte går ihop med varan är utelämnade: raclettegrillen (kartongen mindre än grillen),
  barnskrivbordet (96 cm kartong, 110 cm skiva) och kökshyllan (72 cm kartong, 134,5 cm hög). Sladden på 8,7 m
  på fritösen är utelämnad (troligen 0,87 m). Måtten i bild vann över texten om färgen på moppsetet (grå och grön,
  inte bara mörkgrå).
- Recensionerna är lästa: inga väntande på någon av de åtta (`recensioner-kalla.json`), ingen `recensioner.json` behövs.
- Skrivplanen bygger rent med nuvarande bilder (`plan_sha256` ändras när bilderna tillkommer).

## Kvar
- `aosom-bildkandidater.yml` (positionerna 4,5,6,7,10) för 754fbf7e, 10196ab8 och 87b31333 EFTER synkfönstret
  (:12–:29 UTC var tredje timme, nästa 00:12). Granska med strykreglerna, lägg de rena i `bilder.tsv` och `alt.tsv`.
- Steg 8–11: bygg om planen, torr och skriv (en i taget, utanför synkfönstret), läs live, dokumentera i FLAGGADE.
- `ark/` (hämtade bilder) ligger i scratchpad och committas inte.
