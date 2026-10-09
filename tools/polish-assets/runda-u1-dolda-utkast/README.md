# Runda U1: två dolda utkast i lager publiceras

Leonards ja 2026-10-08. Search Console-genomgången samma dag hittade två
polerade utkast som fanns i lager men var dolda:

| kort | produkt | saldo | polerad i |
|---|---|--:|---|
| `d618473f` | Elkamin vit 54,8 cm | 19 | en tidigare runda (faktakorten heter `k03`) |
| `2cfd373a` | Massagebänk 2 zoner cremevit | 136 | runda 83 |

Båda hade sin enda variant dold. En publicering hade alltså visat "Slutsåld"
med fullt lager. Rundan skrivs därför först när #731 (SKU-steget gör den
enda varianten synlig) ligger i produktion.

## Källan är den polerade texten

Den tyska feedtexten finns inte kvar i Wix för någon av dem, eftersom den
skrevs över vid den första poleringen. `kallor.json` bär därför samma sorts
källa som runda B91 använde för en redan publicerad sida:

- `d618473f`: utkastets nuvarande text i Wix 2026-10-08.
- `2cfd373a`: runda 83:s text, läst ur `runda-83/texter.py` med skript.

Runda 83 kontrollerade bänkens mått mot den tyska texten och mot bänkens egen
måttritning. Elkaminens mått står på dess måttritning (bild 3 här).
`bygg-axelfacit.py` hittar ingen tysk måttrad och är kvitterad i
`grind-undantag.txt`.

## Vad som ändrades mot de gamla texterna

- **Inga länkar i texten** (`gate.py`, husets regel sedan B-rundorna). Båda
  hade syskonlänkar. Elkaminens gick dessutom via `/product-page/`, och en av
  dem pekade på en sida som slagits ihop med en annan.
- **13 kg är fraktvikt.** Den tyska texten finns inte kvar, så det går inte
  att belägga att 13 kg är bänkens egen vikt. Spec-raden heter `Fraktvikt`,
  och namnet, titeln och ingressen nämner inte vikten. Samma sak med
  elkaminens 6,3 kg.
- **Den svarta bänken är inte samma modell.** Runda 83 mätte olika underrede,
  höjd (58–81 mot 61–87 cm) och hopfälld tjocklek (13 mot 17 cm). Texten säger
  därför inte "samma bänk finns i svart".
- **Internt språk bort.** "Rundans lättaste", "familjens vanliga 2000" och
  rubriken "Ettusenåttahundrafemtio watt" fanns i de gamla texterna.
- **Elkaminen fick fliken Användning och skötsel**, samma råd som de andra
  elkaminerna, och SEO-titel med `| Fyndplats` och en hel metabeskrivning.
  Den gamla var avklippt mitt i en mening.

## Bilder

Tre bilder stryks (`bilder-bort.tsv`):

- Elkaminens faktakort med "Vikt 6,3 kg".
- Ett miljöfoto med ordet XMAS i träbokstäver.
- Massagebänkens faktakort med rubriken "Rundans lättaste: 13 kg".

Filerna ligger kvar i Media Manager tills bildstädningen tar dem.
Miljöbilden är andra bild och måttbilden sist.

## Kvar efter rundan

- Elkaminen ligger kvar i kategorierna Dekoration & Prydnad och
  Hushållsapparater. Skrivplanen lägger till kategorier men tar inte bort.
- Omdirigeringsraderna för de två adresserna (redirect-add 2026-10-08) blir
  verkningslösa när sidorna är publicerade. Butiken läser dem bara på en 404.
