# Soptunnan `c841717c`: exakt ägare för varje foto (2026-10-27)

Leonard 2026-10-27, två skärmbilder av Svart × 60 liter (2 029 kr, elva miniatyrer): *bilderna är inte kopplade helt rätt efter storlek*. Han föreslog att radera alla bilder och hämta om dem en storlek och färg i taget. Det behövdes inte: felet satt i länkarna, inte i filerna.

## Orsak

De nio äldsta bilderna (galleriplats 1–9) var länkade bara till färgen, och två av dem (de två första packshoten) till båda storlekarna. De länkades när ingen kunde veta vilken Aosom-artikel varje foto kom från. Härma Aosom (2026-10-24) lade till tolv foton med exakt ägare (färg och storlek) men lät de gamla vara, enligt regeln *ingenting gammalt får ändras*. Därför visade butiken:

- under Svart × 60 liter 45-litersartikelns packshot som första bild och tre av dess miljöbilder (plats 1–4), och 60-litersartikelns eget packshot som femte,
- under Silver × 45 liter 60-litersartikelns packshot som första bild,
- under Silver × 60 liter tre av Silver × 45:s foton (plats 7–9),
- under Svart × 45 liter 60-litersartikelns packshot (plats 5).

Härma-analysen (Aosoms eget galleri per artikel, läst i Leonards Chrome) säger vilka kombinationer Aosom visar varje foto under. De nio gamla bilderna ligger var och en i exakt en kombinations galleri hos Aosom (bildavstånd 0 mot Aosoms foto), och inget av de 42 fotona delas mellan kombinationer. Därför är ägaren för varje foto en färg och en storlek.

## Vad som skrevs

Planen `agare-c841717c.json` ger alla 25 bilder sin ägare ([färg, storlek]). Nio ändrades (plats 1–9). De andra 16 hade redan exakt ägare: plats 10–13 sedan tidigare och plats 14–25 från Härma. `bygg-agare.py` skrev bara optionen Storlek (Färg var redan lika med planen):

| | länkade bilder före → efter |
| :-- | --: |
| Storlek 45 liter | 7 → 12 |
| Storlek 60 liter | 13 → 13 |
| Färg Svart och Silver | 13 och 12, oförändrade |

Ingen fil raderades eller hämtades om, och galleriet (ordning, alt-texter), varianternas id, SKU, pris, kostnad, synlighet och lager är oförändrade och lästes tillbaka. Skrivet ca 22:57 UTC (revision 54 → 55, 0 avvikelser), utanför Aosoms synkfönster. Wix nollställer variantens bild (varukorg, kassa, order) vid en sådan skrivning, så `variantbild-farg.js` kördes strax efter (ca 22:59 UTC, revision 55 → 56, 0 avvikelser): Svart → `9a66fa` och Silver → `c63be6` för båda storlekarna.

## Före och efter (butikens vy per kombination)

| kombination | bilder före → efter | första bilden före → efter |
| :-- | :-- | :-- |
| Svart × 45 liter | 7 → 6 | `9a66fa` → `9a66fa` (45-litersartikelns packshot) |
| Svart × 60 liter | 11 → 7 | `9a66fa` (45 liter) → `f24135` (60-litersartikelns eget packshot) |
| Silver × 60 liter | 9 → 6 | `c63be6` → `c63be6` |
| Silver × 45 liter | 7 → 6 | `c63be6` (60 liter) → `51dba8` (45-litersartikelns eget packshot) |

Varje kombination visar nu bara de foton Aosom visar för den, i galleriets ordning, och börjar med sitt eget packshot. Ingen kombination ligger under fyra bilder.

## Mätt live

- `kolla-agare.py` (butikens egen sidodata, `age` 44 s, 23:01 UTC): **ALLT STÄMMER MOT PLANEN**, ägare per bild och vy per kombination.
- `live-alla-kombinationer.sh` (riktig webbläsare, en kombination i taget, 23:02 UTC): **4 av 4 kombinationer OK, 0 avvikelser**. Priserna är oförändrade: 1 299, 2 029, 1 959 och 1 179 kr.
- Katalogkontrollens tips: SPEC [], FOTO [], FÄRG [15] (plats 15 nämner de svarta innerhinkarna i en bild på silvertunnan, falskt tips), VARUKORG 0.

## Kvar

- ☠️ **Varukorgens bild är färgens första foto för båda storlekarna.** Svart × 60 liter visar 45-litersartikelns packshot i varukorgen, kassan och ordern, och Silver × 45 liter (slutsåld) 60-litersartikelns. Det är hur Wix räknar variantens bild på en sida med färg först, det gäller alla tvåaxliga sidor, och det kräver motorändringen som CLAUDE.md kallar (d) under *Kvar efter natten*. Inte gjort.
- ☠️ **Samma fel finns på de andra Härma-sidorna**, se `harma-aldre-bilder.tsv` och `aosom-galleri-per-kombination.json` nedan. Ingenting av det är rättat.

## Filer

- `agare-c841717c.json`: planen för `bygg-agare.py` (alla 25 bilder, `slug` med).
- `aosom-galleri-per-kombination.json`: för varje av de 30 Härma-sidorna vilka kombinationer Aosom visar varje gammalt foto under (`gamla_foton`, hex6 → [[färg, storlek]]) och vilket foto som är Aosoms första för varje kombination (`pos1`). Ur Härma-analysen, utan artikelnummer och adresser. Det är underlaget för att rätta de andra sidorna, och det finns inte någon annanstans i repot: analysen ligger i en privat scratchpad.
- `harma-aldre-bilder.tsv`: mätningen över de 30 sidorna (butikens sidodata 2026-10-27 23:03 UTC mot Aosoms galleri per artikel). Kolumnerna: antal kombinationer, kombinationer där butikens första bild är ett foto Aosom visar för en annan kombination, kombinationer där två av de tre första är det, och antal (kombination, foto)-par där fotot visas under en kombination Aosom inte har det i. Soptunnan står på 0 efter rättningen.

## Återställning

Länkarna före (Wix, revision 54), om Leonard vill ha tillbaka dem:

- Storlek 45 liter: `9a66fa`, `c63be6`, `f7fa1a`, `8f1a3d`, `8ce262`, `3bb664`, `778305`.
- Storlek 60 liter: `9a66fa`, `c63be6`, `facf13`, `a3f7d5`, `dc46fd`, `a30dd8`, `c82bb3`, `374e6a`, `b4c720`, `6b6adb`, `f9a949`, `6c8780`, `99c05b`.
- Färg Svart: `9a66fa`, `468a85`, `e4859c`, `181a2c`, `f24135`, `f7fa1a`, `facf13`, `dc46fd`, `6b6adb`, `f9a949`, `3bb664`, `6c8780`, `99c05b`.
- Färg Silver: `c63be6`, `51dba8`, `ec81e3`, `c61ffd`, `8f1a3d`, `a3f7d5`, `a30dd8`, `c82bb3`, `374e6a`, `b4c720`, `8ce262`, `778305`.

En plan där plats 1–9 har färgen som enda ägare (`["Svart"]`, `["Silver"]`), utom `9a66fa` och `c63be6` som också har båda storlekarna, och därefter `variantbild-farg.js`, återskapar läget.
