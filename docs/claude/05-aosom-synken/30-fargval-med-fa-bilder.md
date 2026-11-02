### Färgval med få bilder: fler bilder per färg (2026-10-21)

Leonard, med en skärmbild av strandparasollen där färgen Grön visade två bilder: *"Det finns
produkter med varianter som har 4 bilder eller mindre, kan du hämta bilderna till de
varianter som har 4 eller mindre och koppla rätt och kolla att rätt bild syns i live sidan
som test så din metod är rätt."*

**Omfattningen, mätt 2026-10-21** med `tools/polish-gates/katalogkontroll-farg-bilder.js`
(`products/search` med `MEDIA_ITEMS_INFO` och butikens ägarregler som i `fargVy`, bara
färgvalen): 534 av 951 publicerade sidor med färgval har minst ett färgval som visar fyra
bilder eller färre, och 1 097 av 2 533 färgval gör det. 442 är Aosom-sidor med en artikel
per färg (240 med två färger, 128 med tre, 57 med fyra och 17 med fem eller fler) och 92 är
AliExpress-sidor (26 där den sämsta färgen visar en bild, 31 två, 25 tre och 10 fyra).
Sidorna, leverantören och minsta antal bilder står i
`tools/polish-assets/farger-fler-bilder-2026-10-21/flaggade.tsv`. Importen tar feedens
position 1, 2, 3, 8 och 9, poleringen stryker det som bär text eller märke, och en färg som
kom in genom en sammanslagning fick bara en del av givarens bilder.

⚠️ **Mätningen är en uppskattning, och butikens regel är inte `fargVy`s.** Uppmätt live
(`tools/polish-gates/live-bilder.mjs`, 69 AliExpress-sidor med en axel): skriptets regel
stämmer exakt på 60, `fargVy` på 47. Skillnaderna: en länkad bild visas bara för det FÖRSTA val
som länkar den, och en olänkad bild utan färgnamn hör till huvudbildens färg bara när varje
färgval är ett enda färgord (Svart, Vit). Heter ett val "Nattsvart M" eller "Base 210T Rosa"
visas bilden för alla färger. `fargVy` och `olankadeAgare` räknar fortfarande den gamla
vägen. På sidor med fler än en axel (hamsterburen `13fe619f` räknas som 0 för Mörkgrå, fast
den visar bilder per storlek) gäller ingen av reglerna, och en första, bredare mätning över
alla val gav 628 sidor. Mät den enskilda sidan live innan du tar den som given.

**Piloten: strandparasollen** `57988115` (AliExpress-sida, två färger). Grön visade två
bilder och Blå fyra. Efter åtgärden visar Grön fem och Blå sju, mätt live per färg med
`node tools/polish-gates/live-galleri.mjs <slug> <galleri-id.json>`, som klickar varje färg i
väljaren och skriver ut galleriet (väljaren på den här sidan är en enda axel utan
`.pdp-axis`-omslag, och skriptet läser nu den formen också). Metoden för en AliExpress-sida,
som inget verktyg gör åt en:

1. **Hitta fotona.** Listningens SKU-bilder, galleri och beskrivningsbilder läses krypterat
   med `ae-skubilder.yml` (push som ändrar `tools/ae-skubilder/kor.json`). Hämta dem lokalt,
   bygg ett kontaktark och titta på varje bild: tysk eller spansk text, märke och en annan
   färg stryks. Leverantörens rena gröna foton räckte inte till fem, så parasollet fick
   2026-10-21 ett specifikationskort med den gröna varan som femte bild (`scripts/cardkit.py`,
   `card_spec`). Den vägen är stängd sedan 2026-10-27 (inga Fyndplats-kort): räcker
   leverantörens rena foton inte till fem stannar färgen på det antalet.
2. **Importera filerna** till Media Manager (`site-media/v1/files/import`, vänta på `READY`).
   Ett utsnitt görs med Wix egen crop-adress och importeras som en ny fil, aldrig som en
   leverantörsbild i repot.
3. **Skriv galleriet vid fil-id**, och länka sedan färgens bilder med `options` och
   `variantsInfo` ordagrant ur produktens egen GET, `visible` explicit (se *Färger som inte
   kom via verktyget* i `docs/polish/syskon.md`). Kör `variantbild.yml` efteråt.
4. **En bild som visas för alla färger länkas inte.** Närbilden på den röda knappen som fäller
   upp parasollet är densamma i båda färgerna, så den ligger olänkad med en alt-text som
   nämner båda färgerna (butikens `arKort`-regel: en olänkad bild som nämner flera färger är
   gemensam). Lägg aldrig en annan färgs foto på ett val.
5. **Mät live per färg** efter butikens cache (`age` på sidan, `uppdatera-andrade` var femte
   minut), och läs tillbaka id, SKU, pris och synlighet i en separat läsning.

Metoden prövades på sex AliExpress-sidor till (`30169925`, `587c92f3`, `82b05d93`, `39a5c0bf`, `5b21090e`, `53b941a0`, skrivna
med `tools/polish-gates/skriv-fargbilder.js`, högst tre sidor per körning inom ExecuteWixAPI:s 60 sekunder). Alla lästes
tillbaka i Wix och mättes live med exakt de antal planen räknade fram: cykelstället Svart 7 och Vit 4, cykelpumpen Svart 8
och Vit 4, barstolarna Svart 5, liggunderlaget Grön 4, Blå 3 och Grå 2, ballongbågen Vit 3 och hollywoodgungan Blå 4.
☠️ **Utbytet är litet.** En AliExpress-listning har sällan en bild per färg: galleriet visar oftast en färg och
beskrivningsbilderna är spanska eller engelska säljgrafiker, så en färg får ett till fyra foton. Av ungefär 25 granskade
sidor gick tio att förbättra, och kläder med 7–29 färger går inte alls. Fyra sidor (`228aea02`, `314168d1`, `8f21a666`,
`928bb3c4`) är importerade och verifierade men inte skrivna. Spåret pausades 2026-10-21 efter Leonards besked *Fokusera på
aosom produkterna*.

För Aosom-sidorna finns verktyget **"Bilder — fler bilder till en färg på en sammanslagen
Aosom-sida"** (`aosom-fargtillagg.yml`) → `/api/admin/aosom-fargtillagg` →
`lib/aosom/fargtillagg.ts`, med tre lägen: `kandidater` (laddar upp feedens position 3, 8, 9
och 10 för varje färgs artikel, bara de som färgens vy inte redan visar), `plan` och `skriv`.
En människa tittar på varje kandidat (46 procent av feedens bilder bär tysk text, och ett
märke syns inte i någon grind), och de godkända filerna skrivs i `tillagg.json` i rundans
katalog med en svensk alt-text per bild. Verktyget väljer aldrig bilder. PR #749 mergades
2026-10-21 (squash `4f31bf31`, Leonards *Merga*), produktionsbygget var READY efter 85 sekunder och
rutten svarar, så workflowen körs med `workflow_dispatch` från `main`.

**Aosom-sidorna, kartlagda 2026-10-21** (`tools/polish-gates/katalogkontroll-farg-givare.js`, 36 sekunder över 6 125
produkter, bara läsning). De 442 sidorna har **798 färgval på fyra bilder eller färre**. 266 sidor har 4 som sämsta färg,
130 har 3, 36 har 2, 9 har 1 och 1 har 0, så de flesta saknar en eller två bilder. 412 av 442 sidor har inga
gemensamma bilder alls (inga kort eller måttbilder som butiken visar för alla färger). Färgbildsverktyget (`fargbilder.yml`,
`plan`) gav 0 kandidater, men det betyder inte att givarnas bilder sitter på sidorna: det som väntar på granskning
(`granskas`) och det som inte fick plats (`overflow`) ligger i en tabell som bara motorn läser, och planen skriver bara
räknare, inga fil-id. Mätt direkt mot Wix har 298 av de 798 färgvalen en dold givare, men bara **26 färgval en givare med
bilder kvar** (51 bilder). Givarna är alltså i stort sett uttömda. Resten av underlaget finns bara i feeden (position 4–7 och
10, och alla positioner för en färg utan givare), och `aosom-fargtillagg` hämtar dem (PR #749 är mergad).

**Första omgången: givarnas bilder (18 sidor, 35 bilder skrivna, 32 kvar).** De 26 färgvalen granskades på kontaktark och 35 bilder skrevs med
`tools/polish-gates/skriv-fargbilder.js` (samma steg som verktygen: galleriet ensamt vid fil-id, länkarna med `options` och
`variantsInfo` ordagrant ur GET:en, återläsning av galleri, länkar, variant-id, SKU, pris och synlighet). Planen står i
`tools/polish-assets/farger-fler-bilder-2026-10-21/aosom-givare-1.json`. Alla 18 sidor lästes tillbaka utan avvikelser och
mättes live (`tools/polish-gates/kolla-live-farg.py`): varje tillagd bild syns i sin egen färgs vy och i ingen annans, och
antalet unika bilder per sida stämmer med galleriet i Wix. Efteråt rättade `variantbild.yml` varukorgens bild per färg på
alla 24 skrivna sidor (18 Aosom och sex AliExpress, noll avvikelser): kör den efter varje färgbildsskrivning. 24 färgval
fick fler bilder. 12 nådde fem eller fler (mörkbruna hundtrappan `f384c51d` 2 till 6, rosa soffan i
`4f21c7c1` 3 till 5), och 12 står kvar på 2–4: tio eftersom givarens övriga bilder var tyska eller engelska säljgrafiker
(trehjulingen `eeb4a919`, Grå och Rosa: *Security features* och *More details*), och två eftersom en bild som sa emot sidan
togs bort efteråt (blå soffan `f1878c34` 1 till 4 och grå klätterväggen `44663e99` 2 till 3, se nedan). Två givare gav ingenting
(`6334f635`, `a706542f`: *Nur Kissen* och *Hinweis* tryckta mitt i fotona, och beskärningen hade kapat varan). Två
bilder är utsnitt via Wix crop-adress (`834c66fd` Grå och `e76a4098` Ljusgrå), uppladdade som nya filer och verifierade
mot ett lokalt utsnitt (dHash 0).

☠️ **Givarens egna kort flyttas aldrig av `fargbilder`** (*sidans kort gäller alla färger*, `givarensBilder`). På en sida
där värdens kort är länkade till värdens färg är givarens kort det enda kort färgen kan få, och de ligger kvar som
"bilder kvar" i kartläggningen. Jag länkade dem till färgen (de visar färgens egen vara). Ett kort som inte är färgens eget
ska aldrig läggas som val.

**OCR före ögonen** (`tools/polish-gates/ocr-forgranska.py`, RapidOCR i en egen venv, modellerna ligger i paketet). Den hittar
inbränd text (tyska och engelska rubriker, *Nur Kissen*, etiketter) och skiljer bilder med bara siffror från rena foton. Provad
mot 14 bilder jag redan bedömt för hand: alla 14 gav samma utfall. ☠️ **REN är inget bevis.** En logotyp utan bokstäver,
fel färg och en kollage syns inte, och text på varan eller rekvisitan (en affisch, en etikett) står kvar enligt runbooken.
Kör den före kontaktarken så att ögonen går till det som är kvar.

☠️ **Talen i en tillagd måttbild kontrolleras mot sidans text** (`ocr-forgranska.py --tal` skriver talen i bilden, och
`kolla-tal-mot-text.js` jämför dem med `plainDescription` och läser bara). Kontrollen gjordes efter första omgången: på fem av
de 18 sidorna hade en måttbild tal som inte stod i texten, och två av dem sa emot den. Blå soffan `f1878c34` hade fått en bild med
*240 kg* medan sidan säger *Maxbelastning: 100 kg per sits och 10 kg i förvaringen*, och grå klätterväggen `44663e99` hade fått
givarens kort och leverantörens måttritning där trappan är 38 × 20 × 2,8 (kortet) och 38 × 20 med 3,8 cm tjocka rullar
(ritningen), medan sidan säger *38 cm bred, 22 cm djup och 12 cm hög*. De tre bilderna togs bort samma kväll med
`bilder-bort.yml` (planerna var rena, återläsningen stämde, och `variantbild` rättade 3 respektive 1 val; live 21:45 UTC visade
18 respektive 7 unika bilder som galleriet, Blå 4 och Grå 3, och ingen av de borttagna syns i någon färg). De tre andra sidorna
hade bara fler mått än texten och bilderna står kvar: det vita fällbordets inre mått (hylla 75,5 × 14, skiva 75 × 75, bordshöjd 74;
belastningen 40 kg stämmer med sidans *40 kg totalt*), den rosa barnfåtöljens sitthöjd 38 mot sidans 37,5 (avrundat) och
uppresningsfåtöljens mått i upprest läge (128,5 × 83 × 62,5). Ett tal som saknas i texten är ingen motsägelse. En annan
belastning eller ett annat mått på samma del är det, och då tas bilden bort i stället för att texten rättas: texten är
leverantörens uppgifter för värdens artikel, och ett färgsyskons bilder kan höra till en artikel med andra mått. Kör kontrollen
före skrivningen nästa gång. ☠️ Givarens kort dubblerar dessutom värdens egna kort, som redan visas för alla färger.

**Efter merge av PR #749 (2026-10-21):** de ungefär 770 färgval som inte har någon givare med bilder kvar tas i omgångar
om ungefär 20 sidor, sämst färg först (`aosom-ordning.tsv`). Ordningen är `kandidater` med `mal` = sid-id (alla svaga
färger på sidan), OCR och kontaktark, sifferkontroll (`kolla-tal-mot-text.js`), `tillagg.json`, `plan_och_skriv` med
`ref` på grenen som har filen, live och `variantbild`. Wix tar 50 bilder, så ett galleri på 15 är inget hinder längre.

**Feedomgång 1 (2026-10-21, `tools/polish-assets/fargtillagg-1/`):** 20 sidor, 69 färger och 122 bilder
skrevs 22:57–22:59 UTC (116 feedbilder och sex utsnitt), och live-kontrollen blev **ALLT OK**: varje fil syns i sin
egen färgs vy och i ingen annans. Av 75 mätta färgval hade 40 en eller två bilder före och ett har det nu
(Ljusgrå på bänkdynan `a7aa9370`). 25 visar fem eller fler. Räkna med att ungefär 40 procent av kandidaterna blir
bilder: 63 av 75 på feedposition 10, 22 av 59 på 9, 18 av 63 på 3 och 13 av 69 på 8. Verktygen som gjorde jobbet ligger i
`tools/polish-gates/`: `farg-kandidater.py` (hämtar kandidaterna, OCR med textyta och `auto` för säljgrafik över 2,5 %),
`farg-ark.py` (kontaktark per sida med färgens nuvarande bilder som referensrad, dubbletter utsorterade), `farg-tillagg.py`
(`tillagg.json` ur en godkänd-lista), `live-farg-vy.mjs` (färgvyn på en sida med två axlar) och `kolla-live-farg.py`. Fyra
saker att inte missa: **(1)** mät en sida med två axlar med `live-farg-vy.mjs`, för `live-bilder.mjs` hamnar ibland i en annan färgs
vy (hundtrappans Beige); **(2)** måttbilderna jämförs med sidans text före skrivningen, och en feedartikel kan ha andra mått än
värdens (kontorsstolens fyra färger ströks); **(3)** ett utsnitt görs med Wix crop-adress och ska rymma varan i butikens
kvadrat ur mitten; **(4)** `plan_och_skriv` rättar varukorgens bild själv (`variantbilder: N rättade`).

**Feedomgång 2 (2026-10-21, `tools/polish-assets/fargtillagg-2/`):** 25 sidor, 54 färger och 74 bilder skrevs
23:41–23:44 UTC (67 feedbilder och sju utsnitt), och live-kontrollen blev **ALLT OK**. Av 58 mätta färgval hade 156 bilder
före (alla med två till fyra) och 228 efter: 52 fick fler, 18 visar fem eller fler, och två står kvar på två bilder
(Vit på `a706542f` och Mörkgrå på `c519b4fe`, där feeden bara har text i bilderna). Valda per feedposition: 49 av 56
på 10, 12 av 40 på 9, 8 av 38 på 8 och 5 av 45 på 3. Fem saker utöver omgång 1: **(1)** `tools/polish-gates/ocr-live.py` OCR-kör
alla nuvarande bilder i färgvyerna och hittade tysk text på två publicerade sidor (ett informationskort på hundvagnen
`40f46441`, *Nur Pavillondach* på paviljongtaket `e969501f`); **(2)** `live-vyer.py` ritar en rad per färgvy och visade två foton på
gräddvita stolar under Grå på `817e1869`, eftersom butiken knyter ett olänkat foto till huvudbildens färg; **(3)** alla tre sidor
fick bilderna borttagna med `bilder-bort.yml` (torrt först, skarpt med planens sha) före `plan_och_skriv`, eftersom
`aosom-fargtillagg` inte länkar en fil som redan ligger i galleriet (`finns_redan`); **(4)** `farg-krop.py` gör sju utsnitt
från en lista (lokala utsnitt med OCR i 1× och 1,5×, Wix crop-adresser med md5 och parning mot de uppladdade filerna), och
`ocr-boxar.py` ger textrutornas kanter så att utsnittet slutar före texten; **(5)** en måttbild som anger en annan sitthöjd
än sidan (54 mot 50,5 cm), en närbild där leverantörens logotyp är motivet och en projektorduk med *Lorem ipsum* ströks.

**Feedomgång 3 (2026-10-22, `tools/polish-assets/fargtillagg-3/`):** 24 sidor, 80 färger och 129 bilder skrevs
00:30–00:34 UTC (alla feedbilder, inga utsnitt), och live-kontrollen blev **ALLT OK**. Av de 100 färgvyerna på sidorna hade 85
fyra bilder eller färre, och 56 av dem visar fem eller fler efter: 79 vyer fick fler bilder, 18 är oförändrade och tre fick färre
när felbilder togs bort. Valda per feedposition, utan dubbletterna: 77 av 83 på 10, 29 av 37 på 9, 14 av 51 på 3 (alla måttbilder)
och 9 av 50 på 8. Fyra stolsdynor på `39d10fc4` fick ingen bild, eftersom varje kandidat var säljgrafik med tysk text eller en ruta
med *Cushions Only* över bilden. Fem saker utöver omgång 2: **(1)** livemätningen hittade sju bilder som inte skulle visas, på sidor
som ingen tittat på: på hundvagnen `c6928b61` en ram med leverantörens logotyp (*PawHut*) och en tysk säljgrafik (*Vordere Tür*) i både
Mörkgrön och Röd, och med det nya `live-dubbletter.py` tre foton som låg två gånger i samma färgvy (Rosa på `b2ccab13`, Röd och Blå på
`eb02039b`); alla sju togs bort med `bilder-bort.yml` före skrivningen; **(2)** sifferkontrollen fällde en av 15 måttbilder (kontorsstolens
svarta färg: höjd 111–127 cm mot sidans 113–121); **(3)** autostrykningen på textyta tog närbilder av märkesskyltar på bilarnas fronter
(*SIAN*, *e-tron Sportback*, *SLC 300 Final Edition*), och sex autostrukna bilder lästes om: tre hävdes och tre var pixelidentiska med
bilder som redan låg i färgvyn (`farg-dupkoll.py` hittar sådana före skrivningen); **(4)** kandidatläget väljer färger efter antal bilder
*när det körs*, så Mörkgrön och Röd på `c6928b61` (fem bilder, två av dem felbilder) valdes inte och står på tre bilder efter borttagningen;
de tas med i omgång 4; **(5)** butikens cache hade uppdaterats på alla 25 sidor när de mättes sex till sju minuter efter skrivningen.

**Feedomgång 4 (2026-10-22, `tools/polish-assets/fargtillagg-4/`):** 24 sidor, 53 färger och 78 bilder (73 feedbilder och fem utsnitt)
skrevs 01:22–01:25 UTC, och live-kontrollen blev **ALLT OK**. Av de 77 färgvyerna på de 25 sidorna hade 58 fyra bilder eller färre (38 med
tre och 20 med fyra) och efteråt 25 (3 med tre och 22 med fyra). 52 vyer fick fler bilder, 22 är oförändrade och tre fick färre när
felbilder länkades bort. Valda per feedposition, utan dubbletterna: 46 av 53 på 10, 9 av 20 på 9, 11 av 45 på 8 och 7 av 42 på 3
(måttbilder), och fem utsnitt ur måttbilder. Tre vyer står kvar på tre bilder: Grå på hundbädden `01ac2f63` (enda kandidaten var en
bärväska som sidans text inte nämner) och Svart och Blå på studsmattan `39319e6c` (färgerna saknas i flödet, `saknas_i_feeden`).
Sex saker utöver omgång 3: **(1)** två publicerade sidor visade bilder på fel färg trots rätt galleri, och det syntes bara i färgvyerna:
minivästhuset `4a01e8d0` hade tre foton av versionen med vitt överdrag olänkade, och två av alt-texterna nämner en grön list och en grön
stålram, så butiken visade dem under Grön (ett olänkat foto hör till den färg alt-texten nämner), och på skrivbordet `3b868848` var ett foto
av ekskivan länkat till storleken 63 cm och ett till 80 cm, så de visades som andra bild under Svart och Vit. Båda lagades med det nya
`tools/polish-gates/lank-om-bilder.js` (galleriet rörs aldrig, bara valens länkar) och `variantbild.yml`; **(2)** två tyska säljgrafiker
på traktorn `91d28d6f` (Grön och Röd) låg redan ute och togs bort med `bilder-bort.yml` före skrivningen, och de två färgerna fick nya
kandidater (`mal` = `wix-id:val-id`); **(3)** alla sex kandidater på position 10 för fyrhjulingen `2720063f` och Vespan `69042231` var
lagerfoton (amatörfoton på kartong eller en vit golvyta i ett lager) och ströks, och fyra av färgerna fick ett utsnitt ur måttbilden i
stället; **(4)** sifferkontrollen (`kolla-tal-mot-text.js`, tio måttbilder) fällde en: Rosa på gokarten `fdae2809` angav 117 cm mot sidans
121 cm, och sidans text kommer ur en annan färgs artikel; **(5)** utsnitten på terrängbilen `7a8655f0` och Mercedesen `2c72e2b0` kapade bilen
och ströks, och ett julmotiv på studsmattan, en bärväska som texten inte nämner och en bild som var samma fil som position 8 ströks också;
**(6)** `live-farg-vy.mjs` klickade första axeln, som på skrivbordet var Storlek, och väljer nu axeln vars namn börjar på *Färg*.

`lank-om-bilder.js` (ExecuteWixAPI, högst tre sidor per körning, `PLANER = [{ id, axel, tomt, lankar }]`) flyttar länkar mellan val och rör aldrig
galleriet. Varje fil-id ligger redan i galleriet, en bild länkas inte från två val i samma option, ett val som hade länkade bilder töms bara
om det står i `tomt`, `options` och `variantsInfo` tas ordagrant ur GET:en med `visible`, och återläsningen jämför varje vals lista,
galleriets ordning, varianternas id, SKU, synlighet och pris och länkarna i andra optioner. Kör `variantbild.yml` med `ids` efteråt
(`4a01e8d0` och `3b868848`: 2 av 2 rättade, 0 avvikelser).

**Feedomgång 5 (2026-10-22, `tools/polish-assets/fargtillagg-5/`):** 24 sidor, 40 färger och 59 bilder (alla feedbilder, inga utsnitt)
skrevs 02:04–02:07 UTC, och live-kontrollen blev **ALLT OK**. Av de 59 färgvyerna hade 42 fyra bilder eller färre (35 med tre och 7 med
fyra) och efteråt 21 (2 med tre, 19 med fyra, 26 med fem och 12 med sex eller fler). 40 vyer fick fler bilder, 18 är oförändrade och en fick
färre när två dubbletter togs bort. Valda per feedposition, utan dubbletterna: 38 av 38 på 10, 6 av 12 på 9, 6 av 37 på 8 och 9 av 28 på 3
(måttbilder). Landroverns Defender `1c0b4b34` fick ingen bild (Orange saknas i flödet, och de andra kandidaterna var tysk säljgrafik).
Fyra saker utöver omgång 4: **(1)** `~sidan` på kontaktarket betyder att kandidaten liknar en bild i en ANNAN färgs vy, och det kan vara
den färgens eget foto: Grå på `f8efe733` position 8 var Blås foto med turkos stol och ströks efter en jämförelse av stolens färg; **(2)**
`live-dubbletter.py` fann två foton som låg två gånger i Blå på `f8efe733` med pixelskillnad 1,1 och 2,2, alltså omkomprimerade kopior som
gränsen 0,5 inte fångar, och de togs bort med `bilder-bort.yml` före skrivningen (galleri 15 till 13); **(3)** en energietikett som bild
(Svart på `b2c76518`) bär märke och artikelnummer och ströks; **(4)** en måttbild som angav sitsdynan som 63 × 43 cm mot sidans 59,5 × 41
(Blå på `07ac9918`) ströks, och två måttbilder med leverantörens logotyp (*PawHut*, `135d0f48`) ströks.

**Feedomgång 6 (2026-10-22, `tools/polish-assets/fargtillagg-6/`):** 20 sidor, 31 färger och 45 bilder (alla feedbilder, inga utsnitt)
skrevs 02:31–02:34 UTC, och live-kontrollen blev **ALLT OK**. Av de 40 färgvyerna på de 20 sidorna hade 31 fyra bilder eller färre före (24 med
tre och 7 med fyra) och efteråt 14 (alla med fyra). 31 vyer fick fler bilder, 9 är oförändrade och ingen fick färre. Bilderna i vyerna är 146
före och 191 efter. Valda per feedposition, utan dubbletterna: 29 av 29 på 10, 8 av 20 på 9, 5 av 31 på 8 och 3 av 18 på 3 (måttbilder).
Fem av de 25 sidorna fick ingen bild: barnbilen `8ad1e003` (Vit står på tre, och alla kandidater i båda färgerna var tysk säljgrafik),
hundgrinden `6eb13a16` (båda färgerna visar redan fyra, och alla sex kandidater var tysk säljgrafik), förvaringsbänken `592a4bb2` och
agilitysetet `8cf7b1bb` (alla fyra positioner låg redan i galleriet) och barnköket `a57587a8` (Rosa saknas i flödet).
Fyra saker utöver omgång 5: **(1)** sifferkontrollen fällde två av fem måttbilder, och båda gäller en färg vars artikel har andra mått än sidans
text (lärdom 102): kontorsstolen `4871d041` Grå anger höjd 102–119 och bredd 58 cm mot sidans 104,5–121,5 och 60, och väggvärmaren `8475ed8f` Vit
anger 50 × 18,6 × 12,9 cm mot sidans 54 × 18,7 × 12,3. Bilderna ströks, och frågan om en not i texten (som T25) står öppen; **(2)** `~sidan`
på arket gällde två kandidater: Guld på `58f8338d` position 8 var den svarta färgens närbild på ramen (den ligger redan i Svarts vy) och ströks,
och Silver på soptunnan `b10b80ee` position 9 var samma scen som Svarts bild men med silverfärgad tunna (dHash-avstånd 10) och valdes;
**(3)** måttbilden på hamsterburen `92ef25c9` anger två mått i det inre (39 och 34 cm) som texten inte nämner och valdes, eftersom ytterbilden
stämmer (115 × 57 × 55 cm). Den grå burens måttbild är olänkad och syns därför också i Naturträs vy; **(4)** märken som sitter tryckta på varan
(*HOMCOM* på studsmattan och returnätet, *AIYAPLAY* på sparkcykelns stång) och text på rekvisita (affischer, böcker, kaffepåsar) stryks inte, men
leverantörens logotyp över en bild (*PawHut* på hundvagnens måttbilder) gör det.

**Feedomgång 7 (2026-10-22, `tools/polish-assets/fargtillagg-7/`):** 21 sidor, 29 färger och 39 bilder (alla feedbilder, inga utsnitt)
skrevs 02:54–02:57 UTC, och live-kontrollen blev **ALLT OK**. Av de 49 färgvyerna på de 21 sidorna hade 32 fyra bilder eller färre före (18 med
tre och 14 med fyra) och efteråt 16 (3 med tre och 13 med fyra, 25 med fem och 8 med sex eller fler). 29 vyer fick fler bilder, 19 är
oförändrade och en fick färre (Vit på `883db249`, 5 till 3, när två publicerade felbilder togs bort före skrivningen). Bilderna i vyerna är 203
före och 240 efter. Valda per feedposition: 28 av 30 på 10, 5 av 16 på 9, 2 av 29 på 8 och 4 av 14 på 3 (måttbilder). Fyra av de 25 sidorna
fick ingen bild: `74e737ee` (tysk säljgrafik på position 3 och 8, och skjulet på position 9 var beige), `b920d526` (den enda kandidaten var en
omkomprimerad kopia av ett foto som redan låg i Röds vy), `faa2bdb4` (båda färgerna: *Nur Folie* och *Only cover included* över bilden) och
`fdefa04b` (inga kandidater att hämta). Fyra saker utöver omgång 6: **(1)** `kandidater` räknar *uppladdade* filer, inte filer som blivit
READY: två av 122 slutade `FAILED` hos Wix (Svart på `e6d2e70b`, position 8 och 9; `kand.py` visar dem som `?`) medan loggen sa
`missar: 0`. De ströks med skälet "importen misslyckades", och `importMediaByUrl` väntar inte på READY (hjälparen finns i
`lib/wix/bekraftad-bild.ts`, ändringen är inte gjord); **(2)** `live-dubbletter.py` körs på FÖRE-läget också. Efter skrivningen visade den tre
foton som låg två gånger i samma vy på `c5f3914e`, `c841717c` och `d27a28ae`, och alla tre låg där före omgången; **(3)** sifferkontrollen
fällde en av fem måttbilder (Grå på `c131b430`: fotringens höjd 24–41 cm mot sidans 33–43), och två måttbilder med tyska ord (*Tassen,
Familiengröße*, *Schulterhöhe*) ströks; **(4)** en ersättningsduk till ett tunnelväxthus (`d17733fd`, Vit) fick position 10 eftersom sidans text
säger att bara duken ingår och Gröns vy har motsvarande bild, men positionerna 3, 8 och 9 ströks för *Note: Only cover included* och *Nur Abdeckung enthalten*.

**Feedomgång 8 (2026-10-22, `tools/polish-assets/fargtillagg-8/`):** 26 sidor, 48 färger och 60 bilder (alla feedbilder, inga utsnitt)
skrevs 03:37–03:41 UTC (två omgångar, 25 + 1 sida), och live-kontrollen blev **ALLT OK**. Alla 48 skrivna färgvyer fick fler bilder: före hade
47 fyra bilder och en tre, efteråt har 37 fem och 11 sex eller fler, och bilderna i dem är 191 före och 251 efter. Positionerna var 10, 9 och 3:
**46 av 46 på position 10**, 10 av 16 på 9 och 4 av 18 på 3 (måttbilder), utan dubbletterna (42 av 122 kandidater var samma foto som färgens
nuvarande). Sju färger står kvar på fyra bilder: tre saknas i flödet (Vit på `0641bd05`, Grå betong på `5c65d551`, Mörkgrå på `e11ad5cc`), Gul
på `95c2008d` fick fyra i stället för fem när ett tyskt foto togs bort, och Svart och Röd på `a253637c` hade bara tysk eller engelsk säljgrafik
kvar. Tre saker utöver omgång 7: **(1)** `ocr-live.py` över de nuvarande färgvyerna (438 bilder, 8,5 minuter) fann ett tyskt säljfoto som redan
låg ute på en publicerad sida: Gul på `95c2008d` visade *VERSTELLBARE FUSSPOLSTER / Stabiler Stand auf unebenem Boden*. Det togs bort med
`bilder-bort.yml` före skrivningen, och `live-dubbletter.py` på FÖRE-läget fann inga par; **(2)** text på varan eller rekvisitan stryks inte
(*Audi Sport* på bilens front, *CAUTION WET FLOOR* på skurhinkarna, en burk med en butiksetikett i ett renderat kök), men engelska enheter
(*264 lbs (120 kg)*), tyska boktitlar som fyller bilden och en logotyp över fotot (*AIYAPLAY*) gör det; **(3)** sifferkontrollen fällde en av
fem måttbilder: fåtöljen `70d0a9ea` Brun anger fotpallen som 46 × 50 cm mot sidans 47 × 40. Efterarbetet från omgång 6 och 7 är gjort: tre
foton som låg två gånger i samma vy togs bort (`c5f3914e`, `c841717c`, `d27a28ae`, galleri 9 → 8, 15 → 14 och 8 → 7), och den grå
hamsterburens måttbild på `92ef25c9` länkades till Grå med `lank-om-bilder.js` (Grå 4 → 5, Naturträ 6 → 6, 0 avvikelser; `variantbild` rättade 1).

**Feedomgång 9 (2026-10-22, `tools/polish-assets/fargtillagg-9/`):** 25 sidor valdes och 22 skrevs: 34 färger och 48 bilder (alla feedbilder, inga
utsnitt) skrevs 04:09–04:11 UTC i en omgång, och live-kontrollen blev **ALLT OK**. Alla 34 skrivna färgvyer stod på fyra bilder före och fick fler:
21 har nu fem, 12 sex och en sju, alltså 136 bilder före och 184 efter. På de 25 sidorna gick vyerna med fyra bilder eller färre från 40 till 7
(bilderna i alla vyer 344 → 388). Av 91 kandidater (35 på position 10, 30 på 3 och 26 på 9) valdes 48, 18 ströks och 25 var samma foto som färgens
nuvarande. Valda per feedposition, utan dubbletterna: **33 av 35 på position 10**, 4 av 9 på 9 och 11 av 22 på 3 (måttbilder). De 18 strukna: tysk text i en
måttbild (tio, *Empfohlenes Alter*, *Gewichtslimit*), tyska säljgrafiker (*Mehr Details*, tre på `1dfa992a`), leverantörens logotyp (*PawHut* över en
måttbild, *Outsunny* med en engelsk lapp), höstpumpor runt bilen (två på `2f6ff71c`, position 10) och kastruller och stekpannor på en leksaksspis som sidans
text inte nämner. Tre sidor fick ingenting: `0f83c211` (Röd saknas i flödet), `2f31a1d9` (alla positioner låg redan i galleriet) och `2f6ff71c` (allt struket
eller dubbletter), och Brun och vit samt Grön och vit på `1dfa992a` står kvar på fyra. Tre saker utöver omgång 8: **(1)** `ocr-live.py` på FÖRE-läget fann tre tyska säljgrafiker
på två publicerade sidor: två på `0f83c211` Grön (vyn gick från fem till tre) och en på `2f6ff71c` Orange (till tre). `live-dubbletter.py` fann dessutom en
nästan identisk torktumlarbild på `2517c54b` Grå (pixelskillnad 4,6, alltså över gränsen 3 i lärdom 104, och bedömd med ögonen som samma foto, vyn gick till
fem). Fyra bilder på tre av de 25 sidorna (12 procent) togs bort med `bilder-bort.yml` före skrivningen, och en vy kan alltså falla under fyra av just det
skälet; **(2)** en vy som tappar en felbild har ingen ersättning att hämta när feeden saknar färgen eller redan är uttömd, och den står då på sitt nya antal
(`0f83c211` Grön och `2f6ff71c` Orange på tre) tills Leonard beslutar om ett utsnitt; **(3)** position 10 gav 33 av 35 och ligger nu på 174 av 178 över omgång 5–9.

**Feedomgång 10 (2026-10-22, `tools/polish-assets/fargtillagg-10/`):** 25 sidor valdes och 20 skrevs: 35 färger och 35 bilder (alla feedbilder, inga utsnitt, bara
position 10) skrevs 04:46–04:48 UTC i en omgång, och live-kontrollen blev **ALLT OK**. Alla 35 skrivna färgvyer stod på fyra bilder före och visar nu fem. På de 25
sidorna gick vyerna med fyra bilder eller färre från 43 till 9, och bilderna i alla vyer från 346 till 378 (de 35 som skrevs minus tre som togs bort). Av 39 kandidater
valdes 35, 3 ströks (engelsk text över bilden: *Replacement Gazebo Top Cover Only* på paviljongtaket `3f9fda98` och *Cushions Only* på de gräddvita och marinblå dynorna på `485086d2`) och 1 var
samma foto som färgens nuvarande. Fem sidor fick ingenting: `3f9fda98` (allt struket), `5a31b710` och `5f14c112` (Svart respektive Brun saknas i flödet), `75e5fa26` (artikeln
har ingen position 10) och `8aa0bb6c` (enda kandidaten var en dubblett). Tre saker utöver omgång 9: **(1)** `ocr-live.py` och `live-dubbletter.py` på FÖRE-läget fann tre
felbilder på tre av de 25 sidorna, 12 procent igen: en tysk och engelsk säljgrafik med fem textrutor och pilar (*Leinen-Touch-Gewebe*, *Wide Armrest*, *Dicke
Polsterung*, *Side Pocket*, *Stabiler Holzsockel*) på massagefåtöljen `5a31b710` Brun (vyn 5 → 4), och två exakta dubbletter (pixelskillnad 0,0): huvudbilden en gång till som
tredje bild på `75e5fa26` Beige (vyn 4 → 3) och samma miljöbild som andra och sjunde bild på `8aa0bb6c` (vyn 7 → 6). De togs bort med `bilder-bort.yml` före skrivningen
(04:37 UTC torrt och 04:40 UTC skarpt). Text på rekvisitan stryks inte (affischer, böcker, medicinförpackningar med kyrillisk text i ett badrumsskåp, märket på en bilfront), men
textrutor med pilar som lagts över ett foto är säljgrafik; **(2)** `FARG`-raden i `kandidater` säger varför en färg inte får någon kandidat: `finns 10` (positionen ligger redan i
galleriet, `617ce9ff` Mörkgrön), `saknas_i_feeden`, eller tom `hamta` (artikeln har ingen position 10, `75e5fa26` Beige). `okanda_kallor` är bara en varning om att en kandidat kan
vara en dubblett, och den följer med på alla tre färgerna på `485086d2` utan att något hindrade; **(3)** position 10 gav 35 av 38 (utan dubbletten) och ligger nu på 209 av 216 över omgång 5–10.

**Feedomgång 11 (2026-10-22, `tools/polish-assets/fargtillagg-11/`):** 25 sidor valdes och 24 skrevs: 35 färger och 35 bilder (alla feedbilder, bara
position 10) skrevs 05:07–05:10 UTC i en omgång, och live-kontrollen blev **ALLT OK**. Alla 35 skrivna färgvyer stod på fyra bilder före och visar nu fem. På de 25
sidorna gick vyerna med fyra bilder eller färre från 37 till 2, och bilderna i alla vyer från 344 till 379, exakt de 35 som skrevs. Position 10 gav 35 av 35: ingen
kandidat ströks och ingen var en dubblett. En sida fick ingenting, `d348bf64` (artikeln för Svart har ingen position 10), och Grå på `d34f6bab` saknas i flödet (Gråbrun
på samma sida fick sin bild). Två saker utöver omgång 10: **(1)** FÖRE-sveppen (340 unika bilder) fann inga felbilder (omgång 7–10 hade en till tre sidor var). De 87 OCR-träffarna
var märken och dekaler på varan (*Honda*, *Racing / Off-road*, *TT RS Roadster*), böcker, affischer och förpackningar i miljöbilder och leverantörens egna kort. Det enda
paret som `live-dubbletter.py` rapporterade som *likt men olika* (`8df88104` Klassiska färger, plats 1 och 3, avstånd 0, pixelskillnad 0,9) är samma produktfoto med och
utan måttlinjer, och det behölls; **(2)** `live-par.sh` skriver `klart N av 25 sidor`, och de sidor som saknas är de där Node föll medan OCR delade processorerna (två sidor i
både omgång 11 och 12). Mät om dem en och en med `live-bilder.mjs` innan kontrollen körs; **(3)** position 10 gav 35 av 35 och ligger nu på 244 av 251 över omgång 5–11.

**Feedomgång 12 (2026-10-22, `tools/polish-assets/fargtillagg-12/`):** 25 sidor valdes och 24 skrevs: 33 färger och 33 bilder (alla feedbilder, bara
position 10) skrevs 05:24–05:27 UTC i en omgång, och live-kontrollen blev **ALLT OK**. På de 25 sidorna gick vyerna med fyra bilder eller färre från 36 till 6, och
bilderna i alla vyer från 224 till 254 (de 33 som skrevs minus tre som togs bort). Position 10 gav 33 av 33: 21 rena, 1 med bara siffror och 11 med text på varan eller
rekvisitan, och ingen ströks. En sida fick ingenting, `12401205` (positionen låg redan i galleriet, `finns 10`). Tre saker utöver omgång 11: **(1)** `live-dubbletter.py`
på FÖRE-läget fann tre exakta dubbletter (pixelskillnad 0,0 till 0,019) på två sidor: Svart på `087cb4b8` hade samma foto som plats 1 och 3, och Vit och Grön på `0fc3c252`
hade samma foto som plats 2 och 3. De togs bort med `bilder-bort.yml` före skrivningen (gallerierna 9 → 8 och 8 → 6), så de tre färgerna står på fyra bilder efter omgången
i stället för fem. Paret på `fd221e07` Svart (plats 1 och 5, avstånd 6, pixelskillnad 11,6) var *likt men olika*: huvudbilden och en måttbild av samma golvlampa i en annan vinkel, och det behölls; **(2)** `kandidater` köas bakom en pågående skrivning
(samma concurrency-grupp, `polish-write`), så nästa omgångs kandidater går inte att starta medan den förra skrivs; **(3)** position 10 gav 33 av 33 och ligger nu på
277 av 284 över omgång 5–12.

**Feedomgång 13 (2026-10-22, `tools/polish-assets/fargtillagg-13/`):** 25 sidor valdes och 22 skrevs: 27 färger och 27 bilder (alla feedbilder, bara
position 10) skrevs 05:47–05:50 UTC i en omgång, och live-kontrollen blev **ALLT OK** (06:01 UTC, alla 25 sidor mätta). På de 25 sidorna gick vyerna med fyra bilder eller färre
från 33 till 7, och bilderna i alla vyer från 223 till 249 (de 27 som skrevs minus en som togs bort). Position 10 gav 27 av 27: 22 rena, 2 med bara siffror (*VV*) och 3 med
text på varan, och ingen ströks. Tre sidor fick ingenting: `2d65601c` och `3a5060ec` (positionen låg redan i galleriet) och `39a21e71` (Svart och blå saknas i flödet).
Mörkblå på `298492a4` saknas också i flödet (Ljusgrå på samma sida fick sin bild), och Svart på `240d5d8f` hade positionen redan i galleriet. Två saker utöver omgång 12: **(1)** `ocr-live.py` på FÖRE-läget fann en närbild av
leverantörens märke (en HOMCOM-skylt som är hela motivet) som sjunde bild på `3b4594da` Silver. Den togs bort med `bilder-bort.yml` före skrivningen (galleriet 9 → 8), så
färgen står på fyra bilder. Märken som sitter tryckta på varan i ett helbildsfoto stryks inte, men en bild där märket är motivet gör det; **(2)** sidor med två axlar (`233c83cf`, `351d244c`) mäts med
`TVAAX` satt i `live-par.sh`; utan den mätte skriptet fel axel (`351d244c` visade fyra unika bilder) och sidan fick mätas om med `live-farg-vy.mjs`; position 10 gav 27 av 27 och ligger nu på
304 av 311 över omgång 5–13.

**Feedomgång 14 (2026-10-22, `tools/polish-assets/fargtillagg-14/`):** 25 sidor valdes och 24 skrevs: 46 färger och 46 bilder (alla feedbilder, bara
position 10) skrevs 10:49–10:57 UTC i en omgång (run 39765989073, plan sha `d8531f2c…`), och live-kontrollen blev **ALLT OK** (11:02 UTC, de två sista sidorna
mättes om 11:32). På de 24 sidorna gick vyerna med fyra bilder eller färre från 51 av 55 till 8, och bilderna i alla vyer från 220 till 266: 46 vyer fick fler bilder, 9 är
oförändrade och ingen fick färre (efteråt 46 vyer med fem bilder, en med sex, sex med fyra och två med tre). `live-dubbletter.py` fann 0 par. Position 10 gav 46 av 52:
sex ströks (en dubblett av en bild som redan låg i vyn, ett lagerfoto med kartonger, två med leverantörens logotyp över bilden, en närbild på en etikett på en kartong och en tysk
säljgrafik med leverantörens namn). En färg saknas i flödet (`0f83c211`), och `dd979cce` fick ingen bild (båda kandidaterna ströks). Position 10 ligger nu på 350 av 363 över
omgång 5–14. Kvar ur `aosom-ordning.tsv` (442 sidor) utan granskade sidor, givarsidorna och `13fe619f`: 99, varav 20 är valda till omgång 15 (som dessutom tar fem
givarsidor vars färger står kvar på fyra bilder).

**Feedomgång 15 (2026-10-22, `tools/polish-assets/fargtillagg-15/`):** 25 sidor valdes och 23 skrevs: 24 färger och 24 bilder (alla feedbilder, bara
position 10) skrevs 11:46–11:50 UTC i en omgång (run 39773156590, plan sha `b20081e1…`), och live-kontrollen blev **ALLT OK** (11:57 UTC; golvlampan `08b40e95` och
klättersetet `638f2110` mättes om med `live-bilder.mjs`, eftersom färgen väljs med kort och inte med en axel). På de 23 sidorna gick färgvyerna med fyra bilder eller färre från 25 av 51
till 4: 24 vyer fick en bild var och två tappade en felbild. `ocr-live.py` och `live-dubbletter.py` på FÖRE-läget fann två felbilder som togs bort med `bilder-bort.yml` före skrivningen: en
måttbild med engelsk text (*Delivered in 2 cartons Assemble after 2 cartons have arrived*, `526d7fb5` Grå, 5 → 4) och en exakt dubblett (`b8002629` Svart, plats 2 och 5, pixelskillnad 0,0,
5 → 4). Position 10 gav 24 av 26: två ströks (en cykelkärra där ingen röd syns i färgen *Svart och Röd*, `5b3d3c58`, och paviljongtaket `60eaf40e` med engelsk säljtext över bilden, textyta 5,6 %),
och de två sidorna fick ingen bild. Text på rekvisitan (böcker, förpackningar) och märken tryckta på varan (*SPORTnOW* på boxningsstativet, *Mercedes-Benz* på gåbilen) ströks inte. Fyra vyer står
kvar på fyra: Svart på `3f7ef4a1` och `5a31b710` samt de två där en felbild togs bort. Position 10 ligger nu på 374 av 389 över omgång 5–15, och 79 sidor återstår ur `aosom-ordning.tsv`
(tolv av dem har redan använt position 10 eller saknas i flödet och går vidare med position 9, 8 och 3).

**Feedomgång 16 (2026-10-22, `tools/polish-assets/fargtillagg-16/`):** 25 sidor valdes och 22 skrevs: 24 färger och 24 bilder (22 feedbilder på position 10 och två till
för två vyer som tappade en felbild) skrevs 12:31–12:34 UTC i en omgång (run 39778978976, plan sha `e4f72d85…`), och live-kontrollen blev **ALLT OK** (12:41 UTC, alla 25
sidor; tvåaxelsidorna `75a38b7b`, `7bc96b8f` och `7d1fb82b` mättes med `live-farg-vy.mjs`). Färgvyerna med fyra bilder eller färre gick från 25 av 50 till 5, och bilderna i
vyerna från 235 till 256 (24 tillagda, tre felbilder borta). `ocr-live.py` (231 bilder) och `live-dubbletter.py` på FÖRE-läget fann tre felbilder med tysk text på två
publicerade sidor: två säljgrafiker på elskrivbordet `a1f16108` Vit (*Intelligente Steuertafel* och *Sicherheitskonzept*) och en måttbild på radiobilen `81eb4872` Blå med
*Gewichtsgrenze* och *Empfohlenes Alter*. De togs bort med `bilder-bort.yml` 12:30 UTC (torrt först, galleriet 9 → 7 respektive 9 → 8, återläst OK). Eftersom de två vyerna
då hamnade under fem hämtades en extra kandidatomgång för just de färgerna (`mal` = `wix-id:val-id`, positionerna 3, 8, 9 och 10, run 39776511393, fem bilder): Blå och
Vit fick var sin bild på position 10, medan position 3 (samma bild som färgens nuvarande tredje, avstånd 0) och position 8 och 9 (samma tyska säljgrafiker som just tagits
bort) ströks, så Vit står på fyra. I första körningen gav position 10 22 av 24: två ströks (en ersättningsduk till ett tunnelväxthus, `7beb7f2b` Vit, med engelsk ruta
*Note: Only cover included.*, och garagetältet `a165b178` Ljusgrå, vars bild redan låg på sidan med avstånd 0). Text på rekvisitan (bokryggar, förpackningar, en affisch)
och märken tryckta på varan (*SCOOTER* på sparkcykelns styre, *G-Class* på bilens front, *PawHut* på kattstugans etikett, ett *INNOVATE SPORT*-dekal) ströks inte. Ett
par på tvåaxelsidan `7d1fb82b` (Olivgrön, plats 2 och 5, pixelskillnad 10,2) är samma miljö med klot i 40 respektive 50 cm, där den andra är olänkad och visas för alla färger,
alltså *likt men olika*, och behölls. Fem vyer står kvar på fyra: Svart och Blå på `63fd748c` (position 10 låg redan i galleriet), Vit på `7beb7f2b`, Ljusgrå på `a165b178`
och Vit på `a1f16108`.

**Feedomgång 17 (2026-10-22, `tools/polish-assets/fargtillagg-17/`):** 25 sidor valdes och 22 skrevs: 22 färger och 22 bilder (alla feedbilder, bara position 10) skrevs
12:35–12:38 UTC i en omgång (run 39779571835, plan sha `4990c22f…`), och live-kontrollen blev **ALLT OK** (12:46 UTC; tvåaxelsidan `c3d1fa41` mättes med `live-farg-vy.mjs`).
På de 24 enaxliga sidorna gick vyerna med fyra bilder eller färre från 24 av 48 till 2, och bilderna i vyerna från 220 till 242. `kandidater` (run 39777488107, 12:20 UTC)
laddade upp 23 bilder, 0 missar; två färger saknar kandidat eftersom position 10 redan ligger i galleriet (`a37103bf` Svart och `c3d1fa41` Ljusgrå och svart). Position 10
gav 22 av 23: paviljongtaket `d01a6d2b` Beige ströks automatiskt för engelsk text (*Replacement / Gazebo Top Cover Only*, textyta 7,8 %). `ocr-live.py` (226 bilder) och
`live-dubbletter.py` på FÖRE-läget fann inga felbilder och inga par. Ett par flaggades bland kandidaterna: hantelsetet `db6f36b9` (position 10, avstånd 4 mot en bild på
sidan) är samma gymfoto med en beige hantel i stället för den gröna som den andra färgen visar, alltså färgens egen bild, och valdes. Två vyer står kvar på fyra: Svart på
`a37103bf` och Beige på `d01a6d2b`, plus Ljusgrå och svart på tvåaxelsidan.

**Feedomgång 18 (2026-10-22, `tools/polish-assets/fargtillagg-18/`):** de sista 17 av de 42 sidor som aldrig körts. 14 sidor skrevs: 15 färger och 17 bilder (14 feedbilder på position 10
och tre till för två vyer som tappade en felbild) skrevs 12:53–12:56 UTC i en omgång (run 39782098406, plan sha `50d3abf7…`), och live-kontrollen blev **ALLT OK** (13:02 UTC).
På de 17 sidorna gick vyerna med fyra bilder eller färre från 18 av 34 till 4, och bilderna i vyerna från 154 till 169 (17 tillagda, två felbilder borta). `kandidater` (run 39780134084,
12:39 UTC) laddade upp 14 bilder, 0 missar; två färger saknas i flödet (`e999206f` Mörkgrå och `fbd70dae`). `ocr-live.py` (152 bilder) och `live-dubbletter.py` på FÖRE-läget fann två
felbilder som togs bort med `bilder-bort.yml` 12:50 UTC (galleriet 9 → 8 och 10 → 9, återläst OK): en måttbild med engelsk ruta (*Delivered in 2 cartons Assemble after 2 cartons have
arrived*, `e5be35a4` Mörkgrå, samma sort som `526d7fb5` i omgång 15) och en bild som låg två gånger i samma vy (`f9de10ab` Svart och Röd, plats 1 och 3, avstånd 6, pixelskillnad 3,0,
bedömd med ögonen som samma foto). De två vyerna fick en extra kandidatomgång (run 39781688624 och 39781812180): Mörkgrå fick position 10 (position 3 var samma engelska grafik som den som
togs bort, avstånd 3, och ströks) och Svart och Röd position 8 och 9 (närbilder av lådornas skenor och av låset) utöver position 10. Position 10 gav 14 av 14. Ett par på `fbd70dae` (Sand, plats 1 och
5, pixelskillnad 35) är ett belyst foto av lyktan och dess måttritning, alltså *likt men olika*, och behölls. Fyra vyer står kvar på fyra: Natur på `dd08c210` och Vit på `e3340092`
(artikeln har ingen position 10), Orange på `ef20bec9` (position 10 låg redan i galleriet) och Mörkgrå på `e999206f` (saknas i flödet).

**Feedomgång 19 (2026-10-22, `tools/polish-assets/fargtillagg-19/`):** position 3, 8 och 9 för de 42 sidor som bara fått position 10 (omgång 10–18) och position 8 för de tio som fått position 10, 9 och 3
(omgång 8–9), alltså 52 sidor. `kandidater` (run 39784090088, 39784583300 och 39784817119, 13:07–13:13 UTC) laddade upp 100 bilder, 0 missar. 24 valdes (position 3: 6, position 8: 9, position 9: 9) och 76 ströks:
36 var samma foto som en bild färgens vy redan visar, 28 ströks automatiskt för textyta över 2,5 % (tysk säljgrafik) och tolv för hand. Nio av de tolv bär text eller märke: *Gewichtsgrenze* och *Empfohlenes Alter* över
måttbilden (`240d5d8f`, `a6b24d45` och `dd979cce` Rosa och Svart), *Lieferung in 2 Kartons* (`526d7fb5`), *Ersatzabdeckung nur für Pavillon* (`60eaf40e`, position 8 och 9) och leverantörens logotyp *PawHut* över
måttbilden (`2d65601c` Röd och Svart). Tre ströks av sifferkontrollen (`kolla-tal-mot-text.js`): trappans mått 38 × 20 mot sidans 38 × 22 × 12 (`44663e99` Grå), belastningen 220 kg mot sidans 150 kg (`4f21c7c1`
Mörkgrön) och en måttbild som bara gäller den lilla av två storlekar som delar färgvyn (`c3d1fa41`). `ocr-live.py` (592 bilder, 14 minuter) och `live-dubbletter.py` på FÖRE-läget fann inga felbilder och inga par.
Skrivet 13:35–13:38 UTC (run 39788194739, plan sha `b9fe26f8…`): 13 sidor, 13 färger, 24 bilder, alla `ok`, återlästa, med 1–4 rättade variantbilder per sida. **Live 13:45 UTC: ALLT OK**: alla 13 färger visar det
förväntade antalet (vyerna gick från 3–4 bilder till 5–7, 50 → 74 bilder) och ingen bild syns i en annan färgs vy. Resten av de 52 sidorna kunde inte lyftas: position 3, 8 och 9 är de som importen redan tog hem
(`RENA_BILDPOSITIONER`), så en kandidat där är oftast en bild färgen redan visar (36 av 100) eller en som poleringen strukit för tysk text (lärdom 156).

**Feedomgång 20 (2026-10-22, `tools/polish-assets/fargtillagg-20/`):** position 4–7 för de 35 färger på omgång 19:s 52 sidor som stod kvar på fyra bilder eller färre. `kandidater` (run 39786391830 och 39786705928,
13:23–13:27 UTC) laddade upp 134 bilder, 0 missar. 116 (87 %) ströks automatiskt för textyta över 2,5 %, och av de 18 som granskades för hand valdes nio: trädgårdsskåpet `dd08c210` Natur (stängt och öppet i en bild),
båglampan `2f31a1d9` Orange, dynan på gungan `485086d2` Gräddvit och Marinblå, vilfåtöljen `75e5fa26` Beige (tre) och elkaminen `e3340092` Vit (två; *DO NOT COVER* är tryckt på kaminen och ströks inte). De andra nio
ströks för tyska texter eller en collage med tyska etiketter (`12401205`, `e0a73975` ×2, `7beb7f2b`, `d348bf64`), för att de var samma foto som en bild som redan visas (avstånd 2 och 6) eller för att de upprepade en
scen som färgen redan visar (`75e5fa26` och `e3340092`). Position 4–7 gav alltså 9 bilder av 134 (7 %), mot 24 av 100 på position 3, 8 och 9 (omgång 19) och 374 av 389 på position 10 (omgång 5–15).
Skrivet 13:45–13:46 UTC (run 39789637247, filens sha256 `10b43a3f…`, planens sha `e80df14c…`): 5 sidor, 6 färger, 9 bilder, alla `ok`, återlästa, variantbilderna rättade (1–2 per sida). **Live 13:54 UTC: ALLT OK**: alla sex färger visar det förväntade antalet (vyerna gick från 3–4 bilder till 5–6, 23 → 32 bilder) och ingen bild syns i en annan färgs vy.

**Feedomgång 21 (2026-10-22, `tools/polish-assets/fargtillagg-21/`):** position 4–7 för 44 av de 45 sidor där en Aosom-vy visade tre bilder eller färre och position 4–7 aldrig provats (hamsterburen `13fe619f` hoppades över:
två axlar och bilder per storlek). `kandidater` i tre körningar (run 39790563998, 39791110471 och 39791686437, 13:51–14:03 UTC) laddade upp 376 bilder, 0 missar; sex färger saknas i feeden (`1c0b4b34`, `39319e6c` ×2,
`9304f8b8`, `a57587a8`, `d27a28ae`). 336 (89 %) ströks automatiskt för textyta över 2,5 %, och av de 40 som granskades för hand valdes 22: stoldynorna `39d10fc4` i fyra färger (två dynfoton och två tygprov, vars
färg jämfördes med dynornas medelfärg), förvaringsbänken `592a4bb2` Grå (tre), agilitysetet `8cf7b1bb` Orange och gul (tre), elbilen `b1b9afac` Vit (tre bilder mot vit botten; *RS e-tron GT* är tryckt på bilen),
verktygsvagnen `b920d526` Blå och Röd (tre var) och A-hindret `fdefa04b` Grå (tre). De 18 som ströks: tyska eller engelska texter (*Nur Kissen*, *Cushions Only*, *NEIGEFUNKTION*, *RUNDUMANSICHT* och flera), leverantörens
logotyp som motiv (`6575766f` ×2), en bild som redan visas (`a706542f`) och två vagnbilder som liknar färgens första (`b920d526` position 4). `ocr-live.py` (61 bilder på de sex sidorna) och `live-dubbletter.py` på FÖRE-läget
fann inga felbilder och inga par. Skrivet 14:16–14:25 UTC (run 39794286294, plan sha `561a1b62…`, filens sha256 `17ef2846…`): 6 sidor, 10 färger, 22 bilder, alla `ok`, återlästa, variantbilderna rättade (1–4 per sida).
**Live 14:33 UTC: ALLT OK**: alla tio färger visar det förväntade antalet (32 → 54 bilder i vyerna): stoldynorna 3 → 4 i fyra färger, bänken, agilitysetet, A-hindret och verktygsvagnens blå 3 → 6, bilen 4 → 7 och
verktygsvagnens röda 4 → 7. Position 4–7 gav 22 av 376 (6 %), alltså 31 av 510 över omgång 20–21.

**Feedomgång 22 (2026-10-22, `tools/polish-assets/fargtillagg-22/`):** de första utsnitten i färgbildsspåret sedan omgång 4. Underlaget var de 229 bilder ur omgång 21 som ströks automatiskt för textyta på vyer som
visade tre bilder eller färre. `tools/polish-gates/krop-forslag.py` läser textrutorna ur `ocr-boxar.py` och letar den största kvadrat som är minst hälften av bildens kortsida och som ligger 20 pixlar från varje ruta (högst tre
förslag per bild). En bild vars text bär ett förbehåll (*Hinweis*, *Nur*, *ohne*, *only*, *nicht enthalten*, *Zubehör* …) tas inte med, eftersom utsnittet hade klippt bort förbehållet och lämnat en bild som lovar mer än sidan
säljer. Det gav 154 förslag på 153 bilder och 61 färger, som granskades på 20 kontaktark, och **tolv höll (8 %)**: elbilen `211ffd83` (Gul två, Svart en), hundtrappan `2166c50f` Svart, cykelkärran `571e37bf` (Blå och svart,
Grå och turkos), metallskjulet `834c66fd` (Mörkgrå, Ljusgrå, Gråbeige), plastskjulet `a8e5db2d` Mörkgrå och eltraktorn `ec2d9402` (Orange, Grön). Resten ströks för att varan klipps av kvadraten, för infografikens pekare (en
brun prick med streckad linje vid vattenkokarens handtag, `bc2368af` ×3), för grafiken *2200 W* med lågor över kokaren, för en hand med fjärrkontroll (`b1b9afac`) och för kanten av en bildram. Tre rutor justerades före
uppladdningen: skjulens kvadrat flyttades så att hela skjulet ryms, hundtrappans flyttades under de tre små miniatyrernas vita ram och cykelkärrans gjordes större så att hjulen ryms. OCR sa REN på tio av tolv; skjulen gav ord
ur rekvisita i 1,5× (en förpackning, *BOSCH* på ett verktyg) och traktorerna *UUUUUUU* (kylargrillen, inte text). Utsnitten laddades upp i ETT anrop (12 av 12 parade mot adressens md5), och `dHash` mot varje bild på sidorna gav
lägst 56 (gränsen är 12). Skrivet 14:56–14:58 UTC (run 39800088135, plan sha `11a8680f…`, filens sha256 `cbe31146…`): 6 sidor, 11 färger, 12 bilder, alla `ok`, återlästa, 19 variantbilder rättade. Skyddskollen (12 av 12 i
galleriet, i städningens egen tolkning och kvar i Media Manager som `wix-utsnitt`) var grön. **Live 15:07 UTC: ALLT OK**: Gul 3 → 5 och de tio andra färgerna 3 → 4, och `live-dubbletter.py` fann 0 par.

**Alla 442 sidor i `aosom-ordning.tsv` har körts med position 10, omgång 19 tog position 3, 8 och 9, omgång 20–21 position 4–7 och omgång 22 gjorde utsnitt** (se `FLAGGADE.md`, lärdom 154, för hur "körda" räknades). Katalogkontrollen
(`katalogkontroll-farg-antal.js`, 36 sekunder över 6 143 produkter) 2026-10-22 15:08 UTC: **550 av 2 553 färgval visar fyra bilder eller färre** (fördelning 0: 1, 1: 80, 2: 89, 3: 113, 4: 267, 5: 1 560, 6 eller fler: 443),
mot 551 efter omgång 21, 557 efter omgång 20, 576 efter omgång 18 och 1 097 den 21 oktober. På Aosom-sidorna är det 247 vyer på 147 sidor (0: 1, 2: 6, 3: 47, 4: 193; 248 efter omgång 21, 254 på 151 sidor efter omgång 20, 273 på 167
efter omgång 18 och 798 på 442 den 21 oktober), och på AliExpress-sidorna 303 vyer på 96 sidor (oförändrat, spåret är pausat). Nollan är hamsterburen `13fe619f`, som har två axlar och visar bilder per storlek, så mätningen
gäller inte den. **54 av de 247 Aosom-vyerna visar tre bilder eller färre** (`tools/polish-assets/farger-fler-bilder-2026-10-21/svaga-aosom-2026-10-22-1507.txt`). Feedens position 3–10 är därmed provade för dem, och de som är
kvar är tyska säljgrafiker eller saknas i feeden. De 193 vyerna på fyra uppfyller Leonards minimum (*4 är godkänt*) och tas sist. Ett utsnitt lyfter en vy från tre till fyra och inte högre (se `FLAGGADE.md`, lärdom 159–160),
och om fler utsnitt ska göras är det ett beslut för Leonard.

#### Bildstädningen rör inte färgbilderna (kontrollerat 2026-10-22)

Leonards uppdrag 2026-10-22: se till att det som skrivits inte raderas av bildstädningen av misstag. Alla skrivna filer ur omgång 1–14
och givarrundan (`aosom-givare-1.json`, de tre med `struken` borttagna med flit) kontrollerades mot skarpa Wix vid 11:20 UTC: 329 sidor
och 862 filer. Verktyget är `tools/polish-gates/bygg-skyddskoll.py`, som bygger ExecuteWixAPI-kod med inbäddad data och kontrollsumma (den
läser bara). Kör om den efter en skrivning som kan röra gallerier.

| kontroll | utfall |
| :-- | --: |
| filen sitter i produktens galleri | **862 av 862** |
| städningens egen tolkning (`produktensMedianycklar`: huvudbild, galleri, valens länkar) ser den | **862 av 862** |
| Media Manager har filen kvar (`get-files`, state OK, READY) | **862 av 862** |
| Wix CDN serverar den (HEAD mot `static.wixstatic.com/media/<id>`) | **862 av 862 med 200** |
| största galleriet (Wix tar 50) | 34 |

I städningens ögon är 826 av filerna leverantörsfiler och 14 Wix-kopior (de som nattens läge raderar om de blir oanvända), 20 utsnitt (bara
det manuella läget `allt`, tidigast efter 7 dygn, standard 14) och 2 med annan källa. Nattens körning 2026-10-22 03:51 UTC gick igenom alla
läsare (loggraden `varianter: 10851 bilder från 6136 av 6125 produkter`), och de 116 testerna för städningen går igenom.

☠️ **Det som inte skyddas är en fil som inte sitter på någon produkt.** En uppladdad kandidat som ingen skrivit är oanvänd, och städningen
raderar den tidigast tre dygn efter att en körning först såg den oanvänd (karenstiden). Nattens körning är 03:50 UTC: en kandidat som
laddades upp före 03:50 UTC 2026-10-22 kan tidigast raderas 2026-10-25 03:50 UTC, en som laddades upp senare 2026-10-26 03:50 UTC. Godkända
kandidater skrivs därför i samma omgång (det tar några timmar) och de ratade städas bort med flit. En omgångs filer är skyddade först när
de sitter i galleriet, inte när de är uppladdade.

Fem egenskaper som inte ska tas bort:

1. ☠️ **Svaret är publikt.** Det bär bara Wix produkt-id, val-id, färgnamn, Wix egna fil-id
   och wixstatic-adresser, räknare och hinderkoder. Aldrig artikelnummer, feedens adresser
   eller Aosoms produktadress, och ett media-fel följer inte med, för det bär källadressen.
   Filnamnet byggs av wix-id, färgens plats och position, aldrig av källan.
2. ☠️ **En bild tillhör en färg.** En fil vars källa inte är en position hos färgens egen
   artikel blir `annan_kalla`. Ett par som klistrats fel ska inte bli en bild på fel färg.
3. ☠️ **Ingen bild faller ur galleriet och ingen länk tappas.** Huvudbilden och varje färgs
   första bild rörs inte, och de nya bilderna läggs efter färgens sista bild i galleriet och
   sist i valets `linkedMedia`. `kontrolleraLivsplan` fäller en plan som bryter det.
4. ☠️ **Galleriet skrivs vid fil-id, aldrig vid adress.** En wixstatic-adress får Wix att
   importera om bilden till en ny fil (se *Wix importerade om VARJE bild*).
5. ☠️ **Skrivningen kräver planens sha.** Planen räknas om ur färska läsningar i samma
   anrop, och har sidan ändrats sedan någon läste planen skrivs ingenting (409). Sha:n
   täcker filerna och deras alt-texter. Godkända kandidater måste skrivas inom karenstiden,
   tre dygn efter att bildstädningen först såg dem oanvända.

⚠️ **Positionerna är en gissning som kandidaterna prövar.** 3, 8, 9 och 10 är de som oftast
är rena (77, 80, 93 och 53 procent, uppmätt 2026-08-27 och 2026-09-30), men position 4–7 bär
nästan alltid tysk text. En färg som inte får fyra rena bilder ur feeden är en färg
leverantören inte har fler bilder för, och då stannar den på det antalet. Ett utsnitt
(`docs/polish/bildmetoder.md`, *Beskärning*) är den enda genvägen, och bara när utsnittet är
fritt från text och märke.
