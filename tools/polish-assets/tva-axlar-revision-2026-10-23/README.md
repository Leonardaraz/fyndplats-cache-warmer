# Färg × storlek: revision av sidorna med två val (2026-10-23)

Leonards skärmbilder 2026-10-23 (13:12 svensk tid): bokhyllan `79ab08fe` visade både den lilla (sju plan) och den
stora (nio plan) hyllan under båda höjderna och båda färgerna, och Wix-panelen visade samma kopplingar. Hans uppdrag:
*"gör audit för att lösa det här problemet"*.

## Resultat

49 publicerade sidor har två val med minst två synliga värden (läst ur Wix, bara läsning).

| dom | sidor | vad |
| :-- | --: | :-- |
| FEL | 16 | bilder av en annan storlek (eller färg) syns tydligt under valet |
| SVAG | 14 | storlekarna ser nästan likadana ut på fotona (mattor, ringar, överdrag) |
| ANNAT | 2 | projektorduken (butikens etikettfel) och skjutdörrsbeslaget (inga kopplingar) |
| OK | 17 | 13 klädsidor (storleken ändrar inte fotot) och 4 där varje färg bara finns i en storlek |

`sidor.tsv` har domen per sida, vad kunden ser i dag och hur många bilder varje kombination får efter omlänkningen.
`klass.tsv` har varje bild på tio av sidorna: vilken färg och vilken storlek den visar (`-` = gäller alla, `?` = okänd).
`givare.tsv` och `givare-bilder.txt` visar de dolda givarna (pensionerade utkast) vars bilder ligger på sidorna. En
givare är EN artikel, alltså en kombination, och dess pris är samma som sidans variant, så bildens storlek går att
avgöra utan att titta. Givarnas namn står inte här: de är leverantörens titlar och repot är publikt.

Två fel i den visuella genomgången rättades av givarna: hunden på den vita kattrappan (`acf527`) räknades först som tre
steg, men bilden kommer från fyrstegsartikeln och har fyra steg i förstoring. Räkna med givaren när den finns.

## Orsaken

1. **Butiken ger varje bild EN ägare**, det första val som kopplar den (`fetchV3ImageOwners` på `headless-site`), och
   visar ägarens bilder under alla val i den andra optionen. En bild av en viss kombination går inte att visa bara där.
2. **Sammanslagningen och färgbildsverktyget kopplar givarens bilder till färgen** (eller storleken), aldrig till båda.
   Varje gång en storlek lagts till i en färg som redan fanns har den nya storlekens foton hamnat under den gamla.

Ingen sida har i dag en bild kopplad till val i två optioner (0 av 5 116 publicerade, mätt samma dag).

## Lösningen

1. **Butiken** (`butik-kopplingar.patch`, gren `headless-site`): en bild syns när den, i varje option som kopplar den,
   är kopplad till det valda valet. Inom en option räcker ett av valen. Kombinationens första bild är bilden som passar
   kombinationen och är kopplad i flest optioner. 11 nya tester, gröna; de fäller när den gamla regeln läggs tillbaka.
   Sidor där varje bild har högst en koppling ser ut precis som förut (testat). Två ändringar syns direkt:
   - 30 sidor med ett val har en bild kopplad till flera val. Den syns nu under alla de valen, i dag bara under det första.
   - Projektordukens storleksbilder börjar synas (butiken översatte "85 tum" till "85 tum (216 cm)" och hittade aldrig
     valet). Sidan länkas om samtidigt, annars syns den vita 99-tumsduken under svart.
2. **Länka om** de 16 FEL-sidorna en i taget: varje bild kopplas till sin färg OCH sin storlek, gemensamma bilder
   (närbilder utan storlek, kort som gäller alla) till det de gäller. Visuell kontroll per bild, givaren där den finns.
3. **Fyll** kombinationer som får färre än fyra bilder med bilder ur kombinationens egen artikel (feeden eller aosom.de).
4. **Motorn**: varukorgens bild per variant (Wix tar första bilden hos variantens första val, i dag alltid färgens) och
   sammanslagningen kopplar framöver en ny storlek i en befintlig färg till både färgen och storleken.

## Planer, torrkörda

`agare-<id8>.json` finns för alla 16 FEL-sidor, projektorduken och matstationen: planer för `tools/polish-gates/bygg-agare.py`, där en lista som
ägare är en bild av en kombination och flera val i samma option betyder "något av dem". Alla 18 är torrkörda mot Wix (`--torr`, ingenting skrivet)
och korskörda genom butiksändringens egen kod: samma bilder och samma första bild i alla 81 kombinationer. Utfallet per sida står i `sidor.tsv`,
och skälet för varje bild i `klass.tsv`. De skrivs först när butiksändringen är ute, och spärren i `bygg-agare.py` vägrar annars.

Fem kombinationer i lager har inget eget foto och visar sin färgs foton från de andra storlekarna, som i dag: skrivbordet Vit × 63 cm, spegeln
Guld × 50 × 110 cm och järngrinden Vit × 74–87, Vit × 74–80 och Svart × 74–80. De behöver egna foton (steg 3).

Projektordukens bilder är granskade med ögonen: `7a2bde` och `76436a` visar den vita 99-tumsduken (kopplas till Vit och
99 tum), och närbilderna `fb125d` (nederkanten) och `7f121f` (ändkåpan) visar den vita kassetten men saknar koppling och
syns i dag också under Svart. De kopplas till Vit.

Skrivbordets vita miljöbilder är 80 cm-bordet, inte 63 cm som den första genomgången trodde: lagda bredvid samma scen med det svarta
63 cm-bordet är den vita skivan 315 px bred mot 262 px.

## Skrivet 2026-10-24

Butiksändringen mergades 2026-10-24 00:33:14 UTC (PR #770, squash `5d53d4e3`, produktionsbygget READY 00:38:05), och 17 av de 18 planerna skrevs 00:43:53–00:52:19 UTC, en eller två sidor per körning
(`bygg-agare.py <ut.js> <plan> --kompakt --utan-vy`). Variantbilderna skrevs om i fyra körningar 00:47:23–00:54:37 (`bygg-variantbild-farg.py --kompakt`). Hamsterburen `13fe619f` skrevs inte: planen ger
Mörkgrå × 85 × 45 en bild av en annan storlek i varukorgen, och det är Leonards val.

- Wix läste tillbaka i varje skrivning: 17 av 17 sidor, 0 avvikelser. Wix variantbild är färgens första foto på alla 78 varianter.
- `kolla-agare.py` mot butikens sidodata: 17 av 17 stämmer (fyra sidor var ☠️ med en cache som var ungefär tio minuter gammal och rätt några minuter senare).
- **Webbläsare, en kombination i taget** (`tools/polish-gates/live-alla-kombinationer.sh`, 00:57–01:00 UTC): **78 av 78 kombinationer visar exakt planens bilder** (`verifiera-live.py`).
- `katalogkontroll-tva-axlar-bilder.py` över alla 49 sidor med två val: 0 med en måttbild för fel val, 5 med foton som nämner en annan storlek (11 före mergen), 7 färgträffar (14 före), 1 varukorgstips (vedboden).

Bilder per kombination (min–max) och länkade bilder per val före → efter står i CLAUDE.md, *Efter butiksmergen*. De 16 kombinationer som fortfarande visar färre än fyra bilder (tio sidor: förvaringstornet,
hundbädden med tak, skrivbordet, kattrappan, hundgrinden med husdjursdörr, dörrgrinden, verktygslådan, väggspegeln, bokhyllan och den hopfällbara hundbädden) är steg 3 och väntar på svaret för Härma Aosom.
