## 3. Bilderna före texten

`python3 ../../polish-gates/bygg-ark.py` hämtar varje bild i full upplösning och bygger ett
kontaktark per produkt i `ark/`. Titta på arket innan du skriver något. Bilderna visar vad
varan är, hur många delar den har och hur den sitter ihop. Golvlampan `13a53d52` beskrevs
till exempel med två skärmar utifrån källans två mått, men fotot visar en.

**Svenska alt-texter säger inget om pixlarna.** En runda som bara byter alt-texter på en redan publicerad sida får ändå gå
igenom hela galleriet: kör `tools/polish-gates/ocr-forgranska.py` (eller `ocr-live.py` mot de publicerade vyerna) över varje bild.
2026-10-22 fann en OCR över 177 bilder på åtta sidor en tysk detaljbild och en leverantörslogotyp som legat ute länkade till
färgval (T88, FLAGGADE, lärdom 141). De tas bort med `bilder-bort.yml` före bildplanen, och galleriet läses om innan
alt-nycklarna byggs, eftersom bilderna efter en borttagen bild byter plats (lärdom 142).

Position 1 är en vit studiobild och har aldrig behövt strykas (0 av 687 produkter i B- och
N-rundorna), så arket räcker för den. Granska 2–5 i full upplösning i `orig/`. Siffror i en
ritning och hur varan är byggd läser du också i `orig/`, aldrig på arket (600 px per bild):
en etikett lästes en gång som 36 cm på arket men var 35.

⚠️ **Hero-bilden saknas på nya Aosom-varor (2026-10-30 och 2026-10-31).** Aosom lägger ett paketfoto på vit botten som första bild
på aosom.de för sina nya varor, men feeden har det inte: position 1 är då en miljörendering, och position 5–9 är säljgrafik eller
samma miljöbilder (mätt på skåpet `e08e34c4` och golvflutern `a4beec50`). Leonards metod *(2026-10-31: "ta fram aosom artikeln, sök upp
den och hämta dens originalbilder")*: (1) läs artikeln och källadressen ur mappningen **privat**, med `GET wix-data/v2/items/<wix-id>?dataCollectionId=FyndplatsMappings`
i en läsning som aldrig skriver ut den i en logg eller en fil i repot, (2) sök upp varan och hämta originalbilderna på en vanlig, öppen väg.
☠️ **Aosom-sajterna svarar 403 på servrar** (`aosom.de`, `aosom.eu` och `aosom.co.uk`, både curl och WebFetch), och en headless-webbläsare
som försöker ta sig förbi det är en bot-kringgång som vi inte gör. WebSearch är US-only och hittar inte nya artiklar, och dealproffsen
hade inte golvflutern (`sok?s=<artikel>` gav inga träffar). Det som går är Leonards Chrome: Cowork-chatten listar galleriets bildadresser
(som i Cowork-rundorna) eller Leonard klistrar in bilden. Lägg den sedan först i galleriet med bildplanen `runda-bilder-skap-packshot`.

**Stryk** en bild genom att skriva en rad i `bilder-bort.tsv` (`kort ⇥ position ⇥ skäl`)
när den bär:

- inbränd text i grafiken, alltså rubriker, bildtexter eller en webbadress, oftast på tyska
  eller engelska (`Family-size`, `7 Cups`)
- leverantörens logotyp, oftast i ett övre hörn (`HOMCOM by Aosom`). Misstänker du en ljus
  logotyp på ljus vägg eller himmel kör du `bygg-ghost.py`, som gör den synlig.
- en annan färgvariant, modell, storlek eller konfiguration än den som säljs
- samma scen från samma vinkel som en annan bild i galleriet, eller en miljöscen som ett
  publicerat syskon redan bär

**Behåll** text som sitter fysiskt på varan (knappar, märket på godset), en måttritning som
bara har siffror och enheter, och text och märken på rekvisitan i en miljöbild: förpackningar,
burkar, böcker och liknande i eller runt varan. Stryk bara det listan ovan tar upp: så många
användbara bilder som möjligt *(Leonard 2026-07-10)*.

⚠️ **Text på rekvisitan är okej sedan 2026-09-30** *(Leonard, om köksskåpet `fbcf5899`: "text
som är på produkter på det viset är okej")*. Fram till dess ströks en miljöbild när text på
rekvisitan gick att läsa i full upplösning, till exempel "dorset cereals" på ett flingpaket i
vitrinen. Bilder som ströks bara av det skälet får läggas tillbaka.

**Redigera aldrig en bild.** Den behålls eller stryks hel. Ingen beskärning, retuschering
eller maskning av varan *(Leonard 2026-09-27)*, utom beskärningen i undantaget nedan.

**Inga Fyndplats-kort** *(Leonard 2026-10-27)*. Vi bygger inga egna spec-, feature-, färg-
eller storlekskort, inte heller som undantag. En bild som inte duger stryks, beskärs enligt
undantaget nedan eller ersätts av en annan av leverantörens bilder, och finns inget
användbart flaggar du det till Leonard i `FLAGGADE.md`. Hur korten byggdes står i
[`arkiv/fyndplats-kort.md`](../../arkiv/fyndplats-kort.md). De kort som redan ligger på
publicerade sidor ligger kvar *(Leonard 2026-10-27: "låt de som är gjort ligga kvar")*.

**Undantag: sidor med färre än fem bilder** *(Leonard 2026-09-30 för två eller tre bilder, utvidgat
2026-10-07 till varje sida som annars får färre än fem)*. Där får en leverantörsbild
beskäras så att rubriker, bildtexter och ikoner hamnar utanför. Varan skärs aldrig i, och
ingenting retuscheras eller maskas. Butikens huvudbild visar mitten av
bilden som en kvadrat, så välj utsnittet så att varan syns där. Hur det görs står i
[`polish/bildmetoder.md`](../bildmetoder.md) under *Beskärning*.

**Läs siffrorna i en infografik innan du stryker den.** Ett tal som avgör köpet kan finnas
bara i bilden. Ett exempel är gasolregulatorn på 50 mbar, där svenska tuber kräver 30 mbar.
Sådana fakta ska in i texten.

Tal som du räknar i ett foto, till exempel dörrar, lådor och fack, skriver du i
`foto-tal.txt` (`kort tal skäl`). Våra egna anvisningar ("minst 20 cm fritt bakom") skriver
du i `rad-tal.txt`, ett tal per rad. Annars fäller `gate.py` dem som tal utan källa.

**Färgen på en del av varan** (fälg, ben, beslag, randning) kräver att du förstorar just
den delen minst två gånger. Kontaktarket räcker bara för färgen på hela varan. Räkna upp
varje färgad del.

**Galleriet:** `bygg-media.py` behåller källordningen och lägger måttbilden sist: en bild
vars alt-text börjar på *Måttbild*, *Måttskiss* eller *Måttritning* (sedan 2026-10-21; förut
alltid källposition 3, vilket lade fel bild sist när måttbilden låg på 4 eller 5). Har ingen
alt-text det ordet gäller den gamla regeln, källposition 3 sist. Plats 1 blir huvudbild och
delningsbild. Produktsidans
galleri visar varje bild som en kvadrat beskuren från mitten (bara förstoringen visar hela
bilden), så en liggande bild tappar sina kanter och en liggande måttritning sina yttersta
mått. Polerar du syskon samtidigt ska två sidor inte dela samma miljöfoto, så stryk det på
den ena.

Rundan bearbetar inga bilder utom beskärningen i undantaget ovan, den väljer bland dem som
finns. Metoderna står i [`polish/bildmetoder.md`](../bildmetoder.md).

**Minst fem bilder per produkt** *(Leonard 2026-10-07)*. Räcker de rena bilderna inte efter
strykningen hämtar du fler enligt nästa stycke, och finns det text som går att skära bort beskär
du en bild enligt undantaget ovan. Utsnitt får positionerna 11 och uppåt, hela bilder behåller
feedens position, och `granskning.tsv` i rundan skriver varje använt och förkastat kandidatskäl.
Ett utsnitt som bara går att göra genom att skära i varan förkastas.

**För få bilder kvar?** (Aosom; för VEVOR, se VEVOR-avsnittet.) Importen hämtar bara feedens
position 1, 2, 3, 8 och 9. Workflowen **"Bilder — hämta leverantörens övriga bilder för
granskning"** laddar upp position 4–7 till Media Manager utan att röra produkten, men bara med
`skarp` påslagen (standard är torrkörning) och position 4–7 om du inte anger andra. Granska dem med samma strykregler som ovan och lägg de
rena i `bilder.tsv` med sina fil-id. Leverantörens rena bilder är det som används, och
inget Fyndplats-kort byggs *(Leonard 2026-09-30, skärpt 2026-10-27)*. Det gäller också
måttbilder: en variants egen måttbild lämnas kvar och länkas till färg OCH storlek. Saknar
leverantören måttbilden för varianten flaggar du varianten till Leonard i `FLAGGADE.md`. Bär
originalet en logotyp eller text som inte går att beskära bort utan att måtten försvinner
stryker du bilden och flaggar varianten på samma sätt. Ett kort ersätter den inte.
Bilder som ingen väljer ligger kvar i Media Manager: bildstädningen är avstängd sedan
2026-10-30.

Börja med position 10 (`positioner` = `10`). Den är oftast ett miljöfoto utan grafik: den
2026-09-30 var 24 av 45 bilder där rena, mot 1 av 184 på position 4–7, som nästan alltid är
tysk säljgrafik. Förut föll position 10 oftast på text på rekvisitan, alltså etiketter på
burkar och flaskor i kök och badrum. Sedan 2026-09-30 får den texten stå kvar (se *Behåll*
ovan), så position 10 är nästan alltid användbar.

Är sidan redan polerad skrivs bara bildlistan: `bygg-bildplan.py` i stället för
`bygg-skrivplan.py`, och workflowen **"Polering — skriv bara bilderna"**. `bilder.tsv` listar
då varje bild sidan ska ha efteråt, både de som sitter kvar och de nya, eftersom listan
ersätter hela galleriet. Kör läget `verifiera` innan `skriv`. Det skriver ingenting och
faller på varje rad, eftersom de nya bilderna inte sitter där än, men raden visar hur
många bilder sidan har i dag. Talet ska vara lika med antalet bilder i `bilder.tsv` som
sitter kvar. Är det inte det har sidan ändrats sedan listan byggdes, och då byggs listan om
först.

**Alt-texterna** (`alt.tsv`: `kort ⇥ position ⇥ text`) beskriver det som syns på just den
bilden, på svenska och olika för varje bild, med sökordet där det faller sig naturligt.
Beskriv varan, inte rekvisitan: djuret, barnet eller kaffekoppen i miljöbilden hör inte till
produkten. Samma förbjudna ord gäller som i texten. En struken position får ingen rad, och
`gate-alt.py` fäller en som får det.
