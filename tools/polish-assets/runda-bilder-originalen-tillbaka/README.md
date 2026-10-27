# Originalens måttbilder tillbaka (2026-10-24)

Leonards svar 11 på de 21 frågorna (2026-10-24): *"Jag vill inte ha Fyndplats-kort egentligen, varje produkt har ju sin egen original-specifikationsbild, varje en ska vara kopplad till rätt variant."*

Natten till 2026-10-23 ersattes leverantörens måttbilder på 16 sidor av färgneutrala Fyndplats-kort (se CLAUDE.md, *Färgneutrala måttkort på 16 sidor*). Den här rundan lägger tillbaka originalen, var och en länkad till sin färg OCH storlek, och tar bort korten som originalen ersätter. Originalen låg kvar i Media Manager (bildstädningen hade tidigast tagit dem 2026-10-26 03:50 UTC), så de lades tillbaka vid samma fil-id och ingen fil laddades upp på nytt. Filerna sitter i gallerierna igen, så karenstiden börjar om och städningen rör dem inte.

## Utfall

| | |
| :-- | --: |
| sidor | 17 |
| original tillbaka i gallerierna | 37 |
| Fyndplats-kort borttagna | 23 |
| kort som står kvar som begränsad reserv | 4 (på 3 sidor) |
| kombinationer mätta live i en webbläsare | 77 av 77 (+ hamsterburens 3), 0 avvikelser |
| kombinationer där ett original eller ett kort blev första bild | **0** |

Sidorna: soptunnan `c841717c`, hammocköverdraget `91f5c078`, odlingstunneln `38f70f83`, sensorsoptunnan `92fc308c`, matstationen `1d4eb6b1`, kattrappan `4d9ba658`, den hopfällbara hundbädden `c3d1fa41`, kantskydden `44d4907b`, julgranen `75a38b7b`, väggspegeln `c438d4ba`, hundsängen med tak `934297b1`, hundbädden med tak `01ac2f63`, vedboden `4a2ab58e`, tunnelväxthuset `5466fe81`, bokhyllan `79ab08fe`, skrivbordet `3b868848` och buxbomsklotten `7d1fb82b`. Förvaringskistan `b129d5ae` är orörd (inget original finns).

### Kort som finns kvar, och varför

1. **Fyra reservkort (`behall-som-reserv.tsv`, `ändra.json`)**: kattrappans två kort (Vit och Brun), hundsängens Blå 106 × 76 cm och bokhyllans Vit 136 cm. Färgen saknar eget original, och utan kortet hade vyn fått färre bilder än före rundan. Kortet ägs bara av de färger och storlekar som saknar original (till exempel `[Vit, Brun, 60 × 40 cm]`), så det visas aldrig under en färg som har sitt eget.
2. **Kort där leverantören inte har någon måttbild**: hammockens 177 cm, kantskyddens Ø305 och Ø366, hundbäddens 107 × 61 × 20 cm och kistans M och L.
3. **Bänken `7b818c3b`, Svart** (`../runda-bilder-bank-svart-kort`): leverantörens måttbild har deras logotyp i hörnet, och ett utsnitt som tar bort loggan tar bort måtten. Leonard sa *Okej* på ett eget måttkort för Svart (fråga 2b), och det är det enda nya kortet.

Originalet för den vita bokhyllan på 109 cm (`f69ad1`) lades inte tillbaka: bilden har en kapacitetsmärkning på 27 kg medan sidans text säger 21 kg för 109 cm.

### Vyer som fortfarande visar färre än fyra bilder (9, samma som före rundan)

Hundbädden med tak `01ac2f63`: Mörkblå × 92 × 76 cm (3), Mörkblå × 76 × 61 cm (3), Brun × 61 × 46 cm (2). Skrivbordet `3b868848`: Natur och vit × 80 cm (2). Kattrappan `4d9ba658`: Grå × 45 × 40 cm (3) och Brun × 45 × 40 cm (3). Bokhyllan `79ab08fe`: Vit × 136 cm (2). Hopfällbara hundbädden `c3d1fa41`: Brun och svart × 107 × 61 × 20 cm (3). Väggspegeln `c438d4ba`: Svart × 50 × 110 cm (2). De väntar på Cowork-svaret för *Härma Aosom* (130 varianter på 30 sidor).

## Så gjordes det (och i den här ordningen)

1. **Underlag** (`orig.tsv`, `bort.tsv`): vilka 41 filer som togs bort 2026-10-23 och vilken färg och storlek varje original hör till. Fil-id:n lästes ur `BILDER:`-raden i loggen för varje `bilder-bort`-körning, och varje original granskades på kontaktark (ren måttbild, bara siffror, siffrorna stämmer mot sidans text).
2. **Planer** (`bygg.py`): `plan_<id8>.json` (galleritillägg), `agare_<id8>.json` (en ägare per bild i hela galleriet) och `bort_<id8>.txt` (korten som tas bort). Basen för de åtta äldre sidorna är `bas-gammal-form.json`, för de andra revisionsrundans `agare-<id8>.json`.
3. **Galleritillägg** (`galleri-tillagg.js`, `bygg-tillagg-flera.py`): originalen sist i galleriet, med svenska alt-texter, och korten kvar.
4. **Ägare** (`bygg-agare.py`): originalet länkas till färg OCH storlek, korten är kvar.
5. **Kort bort** (`bilder-bort.yml`, en sida i taget med `bort.sh`: torrt först, sedan skarpt med planens sha). Motorn rättar variantbilderna i samma körning.
6. **Variantbild** (`variantbild-farg.js`) på sidor som inte gick via `bilder-bort` (kattrappan och hundsängen).
7. **Kontroll** (`bygg-forsta-koll.py`, `kolla-agare.py`, `live-alla-kombinationer.sh`): se nedan.

## ☠️ Fyra saker som inte ska tas bort

1. **Färgens första foto länkas också till färgens storlekar** (`bas-gammal-form.json`, `ändra.json`). Butikens regel för kombinationens första bild och variantens bild (`lib/variant-price.ts`) är att den bild som passar kombinationen och är kopplad i FLEST optioner vinner, och lika antal ger den tidigaste. Ett original som är länkat till färg OCH storlek (två optioner) slår därför färgens första foto, om det bara är länkat till färgen (en option), och blev kombinationens första bild. Mätt på skrivbordet före ändringen: Vit × 80 cm började med Vits måttbild och Svart × 63 cm med Svarts. Med fotot länkat också till storlekarna har det samma antal och går först.
2. **Mät första bilden per kombination ur Wix data före och efter** (`bygg-forsta-koll.py`, ren läsning). Den fäller på ett original eller kort som första bild, på en Wix-variantbild som inte är färgens första foto och på en vy under fyra bilder. Alla 17 sidor: 0 originals eller kort först.
3. **Kör aldrig två `kor_wf.py` samtidigt.** `dispatch_and_wait` kopplar ihop fel körning. Tre borttagningar som startades samtidigt kopplades alla till odlingstunnelns körning, så de två andra sidornas skarpa körningar föll på sha-kontrollen (planen de hämtade var odlingstunnelns). Inget raderades fel, eftersom en skarp körning kräver planens sha, och de två kördes om en i taget. Kedjan `kedja.sh` kör sidorna en och en.
4. **Reservkort ägs av färgerna som saknar eget original**, inte av storleken. Ägs det av storleken visas det under varje färg i storleken, även en färg som har sitt eget original.

## Kontroller (alla gjorda 2026-10-24 10:48–10:56 UTC, butikens cache 7–20 sekunder gammal)

- Wix, läst tillbaka efter varje skrivning (galleri, alt-texter, länkar, variant-id, SKU, pris, synlighet, lager): 0 avvikelser på alla steg.
- `bygg-forsta-koll.py` över alla 17 sidor: första bilden är ett foto på varje kombination, och Wix-variantbilden är färgens första foto på varje variant (kattrappan och hundsängen rättades med `variantbild-farg.js` efter ägarskrivningen).
- `kolla-agare.py` mot butikens egen sidodata: 17 av 17 *ALLT STÄMMER MOT PLANEN*.
- `live-alla-kombinationer.sh` i en riktig webbläsare, en kombination i taget: 77 av 77 kombinationer visar exakt planens bilder (den hopfällbara hundbädden, där båda axlarna är kort, mättes med `live-galleri-kort.mjs`).
- Hamsterburen `13fe619f` (skriven tidigare samma dag): 3 av 3 kombinationer med fem bilder.

## Filer

`orig.tsv` (originalen: hex6, fil, ägare, alt-text), `bort.tsv` och `behall-som-reserv.tsv` (korten), `bas-gammal-form.json`, `ändra.json`, `bygg.py`, `bygg-tillagg-flera.py`, `bygg-forsta-koll.py`, `vyer.py` (butikens bildantal per kombination ur planerna), `plan_*.json`, `agare_*.json` och `bort_*.txt`.
