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

`agare-79ab08fe.json` (bokhyllan) och `agare-926ec7a2.json` (projektorduken) är planer för `tools/polish-gates/bygg-agare.py`,
där en lista som ägare är en bild av en kombination. Båda är torrkörda mot Wix (`--torr`, ingenting skrivet) och
korskörda genom butiksändringens egen kod: samma bilder och samma första bild i alla sju kombinationer. Utfallet står i
CLAUDE.md under "En bild per kombination". De skrivs först när butiksändringen är ute.

Projektordukens bilder är granskade med ögonen: `7a2bde` och `76436a` visar den vita 99-tumsduken (kopplas till Vit och
99 tum), och närbilderna `fb125d` (nederkanten) och `7f121f` (ändkåpan) visar den vita kassetten men saknar koppling och
syns i dag också under Svart. De kopplas till Vit.
