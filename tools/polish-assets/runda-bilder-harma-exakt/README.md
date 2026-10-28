# Härma-sidorna: exakt ägare för varje foto på 13 sidor (2026-10-28)

Leonard 2026-10-27: *"Kör a, ta bort guld. Ja 1999, och ja jag menade de 6 väntade punkterna"*. Punkt 6 var att ge de andra Härma-sidorna samma rättning som soptunnan `c841717c` (`runda-bilder-soptunna-exakt`, 2026-10-27), en sida i taget, torrt först och live per kombination. Sensorsoptunnan `92fc308c` togs först som prov. Sedan följde de tolv sidor där butikens första bild var ett foto Aosom visar för en annan kombination (`runda-bilder-soptunna-exakt/harma-aldre-bilder.tsv`, kolumnen `forsta_bilden_fel`).

## Orsak

Samma som på soptunnan. Härma Aosom (2026-10-24) la 356 nya foton på sina exakta kombinationer men lät de äldre fotona behålla sina gamla länkar, enligt regeln *ingenting gammalt får ändras*. De äldre fotona var länkade till hela färgen eller hela storleken, och en del var "pinnade" till sina dåvarande val för att ingen vy skulle ändras. Butiken visar en bild under en kombination när den, i varje option som länkar den, är länkad till det valda valet (`imageKopplingar`), och kombinationens första bild är den första bilden i färgens lista som passar och är länkad i flest optioner. Därför visade 13 sidor under minst en kombination ett foto som Aosom visar för en annan, och på tolv av dem var det kombinationens första bild.

Aosoms eget galleri per artikel är facit för ett fotos ägare, inte alt-texten och inte ögat (`runda-bilder-soptunna-exakt/aosom-galleri-per-kombination.json`).

## Vad som skrevs

Planerna `agare-<id8>.json` ger alla galleribilder sin ägare. Planen är byggd av `tools/polish-gates/bygg-harma-agare.py`, granskad på kontaktark med planens ägare och nuvarande länkar under varje bild (361 foton på 13 sidor), prövad torrt med `bygg-agare.py --torr` och skriven med `bygg-agare.py --kompakt --utan-vy`. Därefter kördes `variantbild-farg.js`.

| sida | foton | fick ny ägare | kombinationer | bilder per kombination före → efter | första bilden bytt på |
| :-- | --: | --: | --: | :-- | --: |
| `92fc308c` sensorsoptunnan | 30 | 16 | 6 | 7 → 4–7 | 0 |
| `14fb0f98` kantskydd, runda | 22 | 14 | 4 | 8–10 → 5–6 | 2 |
| `233c83cf` dörrgrind i järn | 30 | 10 | 6 | 5–10 → 5–8 | 4 |
| `351d244c` mattan | 29 | 11 | 5 | 6–12 → 5–7 | 3 |
| `38f70f83` odlingstunneln | 29 | 10 | 4 | 8–11 → 7–8 | 2 |
| `3b868848` skrivbordet | 33 | 12 | 5 | 6–9 → 4–9 | 1 |
| `5466fe81` tunnelväxthuset | 23 | 6 | 3 | 8–11 → 7–8 | 1 |
| `75a38b7b` julgranen | 17 | 5 | 3 | 5–10 → 5–6 | 1 |
| `7bc96b8f` hundbädden | 28 | 13 | 5 | 7–11 → 4–7 | 3 |
| `7d1fb82b` buxbomsklotten | 23 | 5 | 3 | 7–12 → 7–9 | 1 |
| `91f5c078` hammocköverdraget | 39 | 11 | 7 | 5–11 → 4–8 | 2 |
| `934297b1` hundsängen med tak | 28 | 8 | 4 | 7–11 → 6–8 | 2 |
| `c438d4ba` väggspegeln | 30 | 16 | 6 | 4–8 → 4–8 | 1 |
| **summa** | **361** | **137** | **61** | **500 → 379 bilder i vyerna** | **23** |

Varje kombination visar nu bara de foton Aosom visar för den (utom undantagen under Handjusteringar), i galleriets ordning, och börjar med kombinationens eget packshot. **Ingen kombination ligger under fyra bilder, varken före eller efter** (minst fyra på alla 61). Den första bilden är butikens egen uträkning per kombination (`variantTable.image`) och är lika med webbläsarens första bild på alla 61. Den har bytts på 23 kombinationer. Tabellen per kombination, med antal bilder och första bilden före och efter, står i `fore-efter.tsv`.

Ingen fil raderades eller hämtades om. Galleriets ordning och alt-texter, varianternas id, SKU, pris, kostnad, synlighet och lager, produkternas namn och adress, och länkarna i den andra optionen är oförändrade och lästes tillbaka efter varje skrivning (0 avvikelser på alla 13). Skrivet 02:25–02:47 UTC, utanför Aosoms synkfönster (03:12). Wix nollställer variantens bild (varukorg, kassa, order) vid en id-skrivning av optionerna, så `variantbild-farg.js` kördes direkt efter: sensorsoptunnan 02:2x och de tolv andra i tre körningar 02:48–02:50 UTC. Alla varianter har färgens första foto som variantbild (0 avvikelser).

## Handjusteringar efter byggaren

Byggaren ger ett förslag. Dessa ändringar gjordes för hand efter kontaktarken och står i planerna:

- **Första bild per kombination utan feedens första foto** (`233c83cf`, `38f70f83`, `75a38b7b` m.fl.): `ordning` pekar ut kombinationens packshot först i färgens lista. Butiken väljer första bilden ur färgens lista, så utan `ordning` blir det fotot som råkar komma först.
- `351d244c`: det bruna packshotet `bf7710` gäller alla bruna storlekar och är länkat i båda optionerna, så att det kan bli första bild för 230 × 160 och 300 × 200 (feedens första saknas där).
- ☠️ **Fyra kombinationer hade bara tre egna foton och fick ett foto till** (Leonards minimum är fyra bilder, "4 är godkänt"). Det är undantag från exakt ägare, och de ska ses av Leonard:
  - `3b868848` Vit × 63 cm: `dabe86`, ett vitt miljöfoto ur Vit × 80 cm (inget mått i bilden), länkat till Vit.
  - `7bc96b8f` Ljusgrå × 91 × 76 cm: `9b6b79`, soffscenen ur Ljusgrå × 106 × 76, länkad till Ljusgrå + 91 × 76 + 106 × 76.
  - `91f5c078` Mörkgrå × 205 cm: `0d2258`, gräsfotot ur Mörkgrå × 177, länkat bara till Mörkgrå (kan aldrig bli första bild).
  - `c438d4ba` Guld × 50 × 110 cm: `9584da`, Guld-fotot på grå vägg ur 60 × 90, länkat till Guld + 60 × 90 + 50 × 110.
- ☠️ **Wix tar högst 15 länkade bilder per val**, se nedan. `38f70f83`: `acfae5` länkades bara till Grön (inte också till 200 cm). `91f5c078`: `36d3ee`, `39d017` och `217b93` länkades bara till Svart (inte också till 205 cm).

## 15 länkar per val (mätt 2026-10-24, glömdes 2026-10-28)

Första skrivningen av odlingstunneln `38f70f83` gav `400 … optionSettings.choicesSettings is invalid`. Storleken 200 cm skulle få 16 länkade bilder, och Wix tar 15. Hammocken `91f5c078` hade 17 på 205 cm. Taket var redan mätt 2026-10-24 (lärdom 217) och `harma-skriv.js` räknar det (`LANKTAK`), men `bygg-agare.py` och `lank-om-bilder.js`, som den här rundan skrev med, räknade inte. Jag hade dessutom kortat torrskriptet och räknade inte för hand. Galleriets tak är ett annat tal (50, `lib/wix/limits.ts`). Ett foto med en ägarlista räknas mot varje val i listan, så ett foto för en kombination kostar en länk i färgen och en i storleken.

Den första skrivningen hann skriva om färglistorna på `38f70f83` innan storleken föll. Det ändrade bara ordningen i färgens listor (alla foton var redan länkade dit), och körningen lästes tillbaka. Storleken skrevs om efter justeringen.

**Lagat i verktygen** (en regel man måste komma ihåg glöms bort): `bygg-agare.py` räknar planens länkar per val och vägrar bygga skriptet över 15, `lank-om-bilder.js` avvisar planen på nytt innan något skrivs (`LANKTAK`), och `bygg-harma-agare.py` skriver länkar per val i rapporten och märker de över 15. Prövat mot byggarens egna förslag för de två sidorna: `38f70f83` vägras med `'200 cm' 16 länkade bilder`, och de 13 färdiga planerna bygger.

## Mätt live (02:49–02:51 UTC)

- `kolla-agare.py` (butikens egen sidodata): **13 av 13 sidor stämmer med planen vid första försöket**, ägare per bild och vy per kombination (age 0–283 s).
- `live-alla-kombinationer.sh` (riktig webbläsare, en kombination i taget): **61 av 61 kombinationer OK, 0 avvikelser**. Skriptet jämför mängden foton per kombination med planen, inte ordningen. Webbläsarens första bild kontrollerades därför för sig mot butikens uträkning (`variantTable.image`): 61 av 61 lika.
- Wix variantbild: färgens första foto på alla varianter, läst ur Wix efter `variantbild-farg.js`.

## Kvar

- ☠️ **Varukorgens, kassans och orderns bild är färgens första foto för alla storlekar.** Det är hur Wix räknar variantens bild på en sida med färg först, och det gäller alla tvåaxliga sidor. En kund som väljer Guld × 50 × 110 ser alltså Guld × 50 × 70:s första foto i varukorgen. Det kräver motorändringen som CLAUDE.md kallar (d) under *Kvar efter natten*. Inte gjort.
- **11 sidor har fortfarande ett eller flera foton under en kombination Aosom inte visar dem under**, men rätt första bild: `0136e7d9` (1), `01ac2f63` (2), `1d4eb6b1` (6), `4a2ab58e` (1), `4d9ba658` (3), `543b9076` (2), `6d35a04f` (2), `8901f76d` (3), `926ec7a2` (7), `aafbf543` (4) och `c3d1fa41` (1), ur `harma-aldre-bilder.tsv` (antal kombination-foto-par). Punkt 6 gällde de tolv sidor där första bilden var fel, och de elva ligger utanför. Samma byggare och samma arbetsgång gäller om Leonard vill ha dem också.
- De fyra undantagen ovan (ett foto för mycket på en kombination) väntar på Leonards besked.

## Filer

- `agare-<id8>.json` (13 st): planerna för `bygg-agare.py`, med handjusteringarna. De skrevs som de ligger här.
- `fore-efter.tsv`: butikens vy per kombination före (sidan som butiken renderade strax före skrivningarna) och efter: lager, antal bilder och första bildens hex6.
- `fore-agare.json`: planen *före*, alltså fotonas gamla ägare ur butikens sidodata, med färgens gamla första foto i `forst`. Se Återställning.

## Återställning

`fore-agare.json` har varje fotos gamla ägare (`imageKopplingar` före skrivningen) och färgens gamla första foto. Kör den genom `bygg-agare.py` (en sida i taget, utanför Aosoms synkfönster) och sedan `variantbild-farg.js` för att återskapa läget. Listornas inbördes ordning före skrivningen är inte bevarad utom första fotot per färg, vilket butiken inte visar (galleriets ordning gäller efter första bilden). Galleriet är aldrig ändrat, så ingen fil behöver läggas tillbaka.
