# Runda 125 — läge

## Tio LIVE, ingen hålls tillbaka

| id | slug | pris | konstruktion |
|---|---|--:|---|
| `6c9d7288` | verktygsvagn-bla-3-plan | 1 049 | 3 plan, 1 låda, hålremsa |
| `3659a7eb` | verktygsvagn-overkista | 1 799 | tvådelad, överkista + rullskåp |
| `bdd01b5f` | verkstadsvagn-utdragbar | 1 939 | arbetsytan drar ut 70 → 130 cm |
| `5745c3cb` | verktygslada-set-3-delar | 1 949 | tre stapelbara kistor på hjul |
| `35b4fba0` | verktygsvagn-rod-5-lador | 1 979 | 69 × 33 × 75, **5 lådor** |
| `bc698424` | verktygsvagn-svart-7-lador | 2 239 | samma stomme, **7 lådor** |
| `f4fabca6` | verktygsvagn-rod-7-lador | 2 269 | samma, röd |
| `1b534b0e` | verktygsskap-bla-82-cm | 2 299 | 61,5 × 33 × 82,5, 5 lådor, lås |
| `5447468e` | verktygsskap-svart-82-cm | 2 369 | samma, svart |
| `5910cd6f` | verktygsskap-131-cm-rod | 2 379 | tredelad, 131 cm, 100 kg |

## Kvitton

| | |
|---|---|
| Prisgrind Steg 3 | 10 av 10 gröna |
| Avskrift (tecken + teckenkodssumma) | **10 av 10 EXAKTA** |
| `<h2>` per sida | 5 |
| Trasiga `https:/`-länkar | 0 |
| Sökord | 4 per sida |
| Alt-texter | **47**, noll utan alt, noll tyska |
| Kategori Verktyg | 10 av 10 |
| SKU i Wix-varianten | 10 av 10, variant-id oförändrade |
| Stämplingar | Actions **2483–2492**, tio `success` |
| Mappningen återläst | `6c9d7288` och `5910cd6f` — `needsAiPolish:false`, `draftStatus:"published"`, rätt SKU på rätt `wixVariantId` |
| Priser efter publicering | identiska med Steg 3 |
| Källgrind | 49 självtestfall 0 fel · 10 sidor 0 fel |
| Mutationstest | **6 mutationer, 0 missar** |
| Runda 123 + 124 omkörda mot lagade `grindar.py` | 0 fel |
| **Steg 14 live** | **10 sidor, 0 fel** |

## Sju fynd som hade nått kund

1. ☠️ **`aff28a71` är publicerade `8723db20`** — två byte-identiska bildpar
   (0,00) och spec rad för rad. Poleras INTE; lämnad till Leonard.
2. ☠️ **Tre bilder bar TYSK TEXT i pixlarna** (`bdd01b5f` pos 4, `5910cd6f`
   pos 4 och 5) — borttagna.
3. ☠️ **Tre spec-block bär lådantalet i `Mått`-fältet** (`35b4fba0`,
   `bc698424`, `f4fabca6`). Det riktiga måttet, 69 × 33 × 75, stod bara i den
   tyska brödtexten och på måttritningen.
4. ☠️ **`5745c3cb`s spec säger `Kunststoff`** medan brödtexten säger stål.
   Stommen är STÅL med plastdetaljer — brödtexten vinner.
5. ☠️ **`bdd01b5f` och `5910cd6f` lovade nycklar** som deras `Lieferumfang`
   inte listar. Husregeln: leveranslistan är kontraktet.
6. ⚠️ **`5447468e`s hjältebild renderar grå.** Fyra av fem bilder visar ett
   entydigt svart skåp. **En färg avgörs på FLERA bilder, aldrig på hjälten** —
   motsatsen till runda 124:s `22bedfb0`, samma slutsats.
7. ☠️ **Tre spec-block bar bara halva färgen** (`Rot` på en röd-svart,
   `Schwarz` på en mattsvart).

## Två blindfläckar i den DELADE grindmodulen — hittade av mutationstestet

Båda satt i `grindar.py` och har alltså gällt varje runda sedan 115:

1. ☠️ **Synkopeklassen saknades i `_bojningar`.** Obetonat `-el`/`-en`/`-er`
   tappar sin vokal i plural: `nyckel → nycklar`, `cykel → cyklar`. Tolv ord i
   leveranslöfteslistan bar just det mönstret.
2. ☠️ **Färggrinden var halvblind.** `röd\w*` matchar inte `rött` — d:et byts
   mot tt. Ny `G.fargformer(f)` bygger grund-, neutrum- och pluralform.

Runda 123 och 124 kördes om mot de lagade grindarna: **0 fel**, alltså ingen
drift.

☠️ **Och en tredje, som mutationen hittade i rundans EGEN grind:** lådantalet
plockades ur ett decimaltal — `\b7\b` matchar sjuan i `25,7 kg`. Lagat med
`(?<![\d,])N(?![\d,])`.

## Lämnat till Leonard

1. ☠️ **`aff28a71` mot publicerade `8723db20`** — vilken av de två som
   pensioneras är ett affärsbeslut. Draft 1 079 kr, publicerad 1 089 kr.
2. ⚠️ **`1b534b0e` bild 2 bär en läsbar DEWALT-skylt** på bakgrundens hålplank.
   Tredjepartsmärke i SCENEN, inte på varan — läggs till uppgift #461 så
   beslutet blir ett och inte fem.
3. ⚠️ **Tre SKU-krockar fanns redan** bland de tio: sex produkter delade tre
   strängar. Skapade av IMPORTEN, inte av poleringen (uppgift #272).
4. ⚠️ **Kategoriträdet har fortfarande inget löv för verktygsförvaring** —
   `Verktyg` har noll underkategorier, så tio sidor till ligger på toppnivån.

## Kvar i familjen

~13 utkast: verkstadsbänkar (`349b7403`, `941867cb`, `9e9c78b9`), sågbockar
(`17e683e0`), rullskåp med klaffbord (`88eb3627`), metallskåp (`81c123fa`),
arkivskåp (`5a0f9799`, `beeada22`) plus trädgårdsskåpen som hör till runda
86–87. Och `a389ddaa`, den bevisade dubbletten som väntar på Leonards ord
(uppgift #453).
