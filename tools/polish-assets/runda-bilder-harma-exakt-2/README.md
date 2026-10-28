# Härma-sidorna, de elva som låg utanför: minimal ägarplan (2026-10-28)

Leonard 2026-10-28, om de elva tvåaxliga Härma-sidor som den första rundan lämnade (`runda-bilder-harma-exakt/README.md`, *Kvar*): *"Ja prio att fixa."* Samma fel som på de tretton och på
soptunnan `c841717c`: ett äldre foto är länkat till hela färgen eller hela storleken, och butiken visar det därför under en kombination som Aosom inte visar det under.
De elva sidorna hade rätt första bild redan (`harma-aldre-bilder.tsv`, `forsta_bilden_fel` = 0), och felen är få: **30 foton på 11 sidor**.

## Metod: bara de felplacerade fotona ändras

`bygg-harma-agare.py` (den första rundans byggare) ger varje äldre foto den exakta rektangeln. På de här sidorna gör det två saker som inte går:

1. ☠️ **Det spränger Wix tak på 15 länkade bilder per val** (lärdom 217). Fyra av sidorna låg redan på 15 i båda storlekarna, och den fulla planen gav 16–19.
2. **Det flyttar första bilden.** Varje foto som ändras från en länk till två blir starkare i butikens uträkning av första bild.

Den nya byggaren `tools/polish-gates/bygg-harma-minimal.py` ändrar därför BARA de foton som butikens vy visar under en kombination Aosom inte visar dem under, och ger dem det billigaste
ägaruttryck vars effekt är exakt Aosoms uppsättning (samma `rektangel` och `agare_namn` som den fulla byggaren). Övriga foton behåller sina länkar. Den skriver också före-läget per
kombination (antal foton, första bild och varukorgens bild), så att torrkörningen går att jämföra rad för rad. Självprov: `python3 -I tools/polish-gates/bygg-harma-minimal.py --sjalvprov`.

## Vad som skrevs: sju sidor, 17 foton under fel kombination borta

| sida | felplacerade foton | kombinationer | foton i vyerna före → efter |
| :-- | :-- | --: | :-- |
| `0136e7d9` förvaringstornet | 1 | 4 | 7, **8**, 7, 6 → 7, **7**, 7, 6 |
| `01ac2f63` hundbädden med tak | 2 | 6 | 6, 5, 4, 6, **7**, **6** → 6, 5, 4, 6, **6**, **5** |
| `4a2ab58e` vedboden | 1 | 3 | 11, 10, **12** → 11, 10, **11** |
| `6d35a04f` hindersetet | 1 (under två kombinationer) | 3 | 6, **7**, **7** → 6, **6**, **6** |
| `8901f76d` viktvästen | 3 | 3 | 8, 12, **10** → 8, 12, **7** |
| `926ec7a2` projektduken | 7 | 3 | **8**, 8, **11** → **5**, 8, **7** |
| `c3d1fa41` hopfällbara hundbädden | 1 | 3 | 7, 7, **8** → 7, 7, **7** |
| **summa** | **16 foton, 17 par** | **25** | **194 → 177 foton i vyerna** |

Planerna (`agare-<id8>.json`) är de som skrevs. `felfoton.tsv` har varje foto, dess ägare före, Aosoms kombinationer och planens ägare, också för de fyra sidor som lämnades. `fore.json` har före-läget
per kombination. En återställning är planen med de ändrade fotona satta tillbaka till `nuvarande_agare` ur tabellen, skriven med `bygg-agare.py` och följd av `variantbild-farg.js`.

### ☠️ Två sidor behövde skydd för första bilden, och torrkörningen visade det

`bygg-agare.py --torr` svarar med butikens första bild och varukorgens bild per kombination. Jämförelsen mot före-läget fångade två fel i de första planerna, och inget hade syns i ett antal eller i
en vy:

- **Projektduken `926ec7a2`.** Packshoten för Vit × 85 tum (`d80daf`) låg länkad till bara Vit och blev "85 tum" ensam, med en länk. Måttritningen `d6e3e6` hade också en länk och stod före i
  valets lista, så den hade blivit första bild, och Vits första foto, alltså varukorgens bild för båda Vit-storlekarna, hade blivit 99-tumspackshoten. Lagat med `["Vit", "85 tum"]` (två länkar, exakt
  samma vy) och `ordning: {"Vit": ["d80daf"]}`.
- **Hundbädden `01ac2f63`.** `a4014f` gick från en länk till tre (Mörkblå, 92 × 76 och 122 × 92) och gick därmed före `7b713e` som första bild under Mörkblå × 92 × 76. Lagat med
  `ordning: {"Mörkblå": ["a6c639", "7b713e", "0550fb"]}`, så att varje Mörkblå-kombinations nuvarande första foto står först i färgens lista.

Regeln: **ett foto med fler kopplade optioner slår ett med färre som kombinationens första bild, och lika antal ger det som står först i färgens lista.** Kör alltid torren och läs `forsta` och
`varukorg` mot före-läget.

## Skrivet och mätt

Skrivet 14:52–15:03 UTC, före Aosoms synkfönster 15:12. Kostnadsjobbet (`varukostnad.yml`, startat 14:29) gick samtidigt över hela katalogen i id-ordning, och ingen sida skrevs på samma produkt
som jobbet höll på med. Tre av sidorna (`0136e7d9`, `01ac2f63`, `8901f76d`) hade kostnad på alla varianter sedan tidigare och ingår inte i jobbet. `4a2ab58e` skrevs sedan jobbet passerat den.
`6d35a04f`, `926ec7a2` och `c3d1fa41` skrevs innan jobbet nått dem: skrivarna bär kostnaden tillbaka där den finns, och jobbet fyller i den efteråt ur en färsk läsning utan att röra länkarna.
Varje sida: `bygg-agare.py --kompakt --utan-vy` via ExecuteWixAPI (`avvikelser: []`, revision +1 per ändrad option), sedan `variantbild-farg.js` (`avvikelser: []`, varje variant har färgens första foto).

| kontroll | utfall |
| :-- | :-- |
| Wix läser tillbaka varje skrivning (galleri, länkar, variant-id, SKU, pris, kostnad, synlighet, namn och adress) | 7 av 7 sidor, 0 avvikelser |
| `variantbild-farg.js`: varje variants bild är färgens första foto | 7 av 7 sidor, 0 avvikelser |
| `kolla-agare.py` mot butikens sidodata | 7 av 7 sidor, varje kombination lika med planen |
| webbläsare, en kombination i taget (`live-alla-kombinationer.sh`, `live-galleri-kort.mjs` för kortsidan) | **25 av 25 kombinationer OK, 0 avvikelser** (före: 10 av 25 visade minst ett foto för mycket, 9 mätta i webbläsaren och kortsidan `c3d1fa41` ur butikens data) |
| butikens första bild per kombination, före → efter | **lika på 25 av 25** |
| varukorgens bild (färgens första foto), före → efter | **lika på 25 av 25** |
| minsta antal foton i en vy | 4 (Leonards minimum) |

Efter kostnadssvepet (`varukostnad.yml`, 14:29–16:37 UTC, CLAUDE.md under *Kostnaden skrivs in*) kontrollerades alla sju sidor igen med `kolla-agare.py` (16:37 UTC): **7 av 7 stämmer mot sina planer**, varje kombination lika som före svepet, och alla varianter har kostnad (3 av 3, 3 av 3, 3 av 3, 4 av 4, 6 av 6, 3 av 3 och 3 av 3). Svepet skrev `6d35a04f` 15:32, `926ec7a2` 15:51 och `c3d1fa41` 16:12, alltså efter ägarplanerna, och butikens cache renderades om efter varje skrivning (15:41, 16:00 och 16:15), så kontrollen speglar slutläget. Kostnadsskrivningen rörde inga länkar.

## Fyra sidor lämnades: Wix tar högst 15 länkade bilder per val

`1d4eb6b1` matstationen, `4d9ba658` kattrappan, `543b9076` hundtrappan och `aafbf543` verktygslådan har 15 länkade bilder på båda storlekarna redan (`aafbf543`: Röd, Svart och Röd och 3 lådor).
Att placera de felplacerade fotona exakt kostar en länk till per foto och storlek, 16–19 på de fullaste valen, och Wix svarar `400 … choicesSettings is invalid`. Felplacerade foton: 6, 3, 2 och 3.

- Det är **närbilder av samma färg**: tyg, hörn, skålar, stolpar, en katt på ett trappsteg och ett spänne. Ingen visar en annan färg eller ett mått, och ingen har en nästan identisk tvilling
  i galleriet (dHash mot alla foton på sidan), så ett borttaget foto hade inte funnits kvar i rätt kombination.
- **Undantaget är spännet `435f39` på verktygslådan**, en närbild på en röd låda som visas under Svart och Röd. Det kräver en länk till Röd, som ligger på 15.
- Att ta bort de felplacerade fotona frigör länkar men tar också bort fotot där det är rätt, och varje kombination tappar då ett eller två foton av de fyra till sju den har. Det är ett beslut för
  Leonard, och bygg-verktygen väljer aldrig bilder. Sidorna har rätt första bild och varukorgsbild.

**Avgjort 2026-10-28 (Leonard: *Vi gör som du rekommenderar*).** Närbilderna på de fyra sidorna ligger kvar. Spännet `435f39` på verktygslådan togs bort: ett olänkat foto på plats 14 av 31,
som därför visades under alla fyra kombinationer, också under Svart och Röd. Det togs bort med `bilder-bort.yml` (torr, sedan skarp med planens sha). Galleriet 31 → 30, fotona per
kombination 10, 9, 9 och 8 → 9, 8, 8 och 7, och första bilden, varukorgens bild, länkar, SKU, pris, kostnad och lager oförändrade (separat läsning i Wix före och efter, och en riktig
webbläsare, en kombination i taget).

## Filer

- `agare-<id8>.json` (7 st): planerna som skrevs, med skydden ovan.
- `felfoton.tsv`: de 30 felplacerade fotona på alla elva sidor, med ägare före, Aosoms kombinationer och planens ägare (eller *lämnas*).
- `fore.json`: före-läget per kombination på de sju sidorna (antal foton, första bild, varukorgens bild).
