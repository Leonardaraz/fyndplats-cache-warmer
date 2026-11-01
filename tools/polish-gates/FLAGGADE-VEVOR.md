# Flaggade VEVOR-utkast — rör INTE dessa utan Leonards beslut

VEVOR-chattens egen flaggfil (Leonard 2026-10-31: en chatt för VEVOR och en för
Aosom). Samma regler som `FLAGGADE.md`: läs filen FÖRE urvalet, lämna varje rad
orörd, lägg till en rad när en runda hittar ett skäl att hålla tillbaka ett
utkast, och stryk en rad med ett kort resultat när Leonard har beslutat. Raden
tas aldrig bort.

Filen finns för att de två chattarna arbetar på var sin gren. Skrev båda i
`FLAGGADE.md` hade grenarna krockat i samma fil vid varje merge. En lärdom som
gäller båda leverantörerna skrivs i `FLAGGADE.md`.

☠️ Repot är publikt: inga artikelnummer, modellnummer, adresser eller priser.
Ett utkast anges med sitt Wix-id.

## Flaggade utkast

| Wix-id | skäl | runda | beslut |
|---|---|---|---|
| 552380c0 | Specifikationen har `Effekt: Hög` utan siffra. 2000 W står bara i utkastets maskinöversatta namn, och fjärrkontrollens knappar (800 och 1200 W) är avlästa på fotot. Texten säger 2000 W. Skyddsklassen IP34 finns i tabellen och är inte frågan. Leonard kan kontrollera effekten mot VEVOR:s sida. | vevor-1 | väntar |
| (kategorin Terrassvärmare & Infravärmare) | Leonard 2026-11-01: lägg de sex värmarna där. De är kopplade (återläst 6 av 6, kategorin har 14 synliga produkter). Kategorisidans text påstår saker som nu är för snäva: *"Tre av värmarna är IP65-klassade"* och *"till båda infravärmarna följer ett skyddshölje"* (en av mina sex är IP65, och infravärmarna är fler än två), och den räknar upp tre specifika modeller. Texten är inte ändrad. | vevor-1 | väntar på Leonard: ny kategoritext (texten ägs av sökordsrundorna, `runda-s6-sasongskategorier`) |
| 40920372 | Källan kallar konsolerna *"tillverkad av tjockt gjutjärn"*, medan specifikationen har Fästmaterial *Kolstål* och Tjocklek *2 mm*. Lastkapaciteten 136,1 kg anges utan att säga om den gäller en konsol eller båda. Texten följer specifikationen: kolstål, ingen tjocklek, och kapaciteten som VEVOR skriver den. En översatt recension (`gen-10nhdgg`, 4 av 5) säger att konsolerna böjer sig av kundens egen vikt, "hälften av det som var tänkt", och inte stängs helt när de fälls ihop. Sidan anger 136,1 kg. Den står kvar som kritik, men Leonard kan välja att dölja den i `/admin/reviews`. | vevor-3 | väntar |
| da2906aa, 34302322 | Effektraderna säger emot sig själva i båda: *Total effekt* är lägre än *Pumpeffekt* (9,3 mot 12,8 W och 19 mot 35,5 W). Ingen effekt skrivs. På da2906aa står flödet som 396,3 GPH / 850 L/h, vilket inte är samma tal (396,3 GPH är ungefär 1 500 L/h), och texten tar det lägre. På 34302322 stämmer GPH och L/h. Källan på da2906aa nämner en UV-lampa som varken specifikationen eller fotona visar, och den skrivs inte. Färgen står som svart i specifikationen medan fotot på da2906aa visar blågrått, och texten säger *blågrå och svart*. | vevor-3 | väntar |
| aa14d5af | Inget lås ingår (specifikationen: *Låsmekanism* och *Nycklar* är *Ej tillämpligt*), medan utkastets namn säger *cykelkedjelås*. Texten säger att kedjan låses med ett eget hänglås och att inget lås ingår. Namnet säger 1,7 m och specifikationen 1800 mm och 180 cm: texten har 180 cm. | vevor-3 | väntar |
| eac8bb5b | Källan lovar hälsoeffekter för lampan (autism, ADHD, ångest). De skrivs inte. Importens kategorilänk *Trädgårdsdekor & Belysning* står kvar, eftersom verktyget aldrig tar bort en kategori, och rundan lade till *Hem & Inredning + Belysning*. Specifikationen anger ingen skyddsklass för lampan. | vevor-3 | väntar |
| 741de613 | Utkastets rubrik säger 142 cm, specifikationen 137 × 69,9 × 30,5 cm: texten har specifikationens mått. Utkastets adress slutar på `-4`, vilket tyder på att minst tre andra produkter har samma titel. De är inte undersökta (Leonard: leta inte familjer). SKU:n är gjord unik med färgen. | vevor-3 | väntar |

## Lärdomar

**Runda vevor-1 (2026-11-01): sex infraröda värmare.**

(a) ☠️ **`gate.py` fällde varje VEVOR-sida på FRAKTVIKT.** Grinden tog specifikationens `Vikt` för Aosoms viktrad med förpackning. Hos VEVOR är raden varans egen vikt. Lagat i `gatelib.fraktvikt_fel` (tidig retur på markören `=== vevor-källa`), och `tools/polish-kedja/vevor_kalla.py` lägger markören i rundans `kallor.json`. Två tester i `lib/polish/grindluckor.test.ts`: REN med markören och FÄLLER utan den.

(b) **Namnet är en källa.** Utkastets namn bär ofta effekten ("2000W") som specifikationen saknar, och siffergrinden läser bara `kallor.json`. `vevor_kalla.py` lägger namnet dit som eget block. Bildernas alt-text tas inte med: den är maskinöversatt och bär anspråk specifikationen inte har (WiFi, IP55).

(c) **Specifikationen vinner över namnet.** Utkastets namn är maskinöversatt och bär anspråk tabellen saknar: 43943aac heter "med WiFi-kontroll" medan tabellen bara har fjärrkontroll och mekanisk brytare, och 552380c0 har `Effekt: Hög` medan namnet säger 2000 W. WiFi finns inte i texten. 2000 W gör det, och är flaggat ovan.

(d) **Bilder med AI-märkning eller app-skärmar stryks** (`bilder-bort.tsv`): 9bb0043a position 2 och 43943aac position 3.

(e) **Märket sätts av skrivsteget**, inte av namnet eller SEO-titeln. GPSR-raden kommer från motorns standardrad.

(f) **Nya underkategorier är dolda** tills tio varor är publicerade (cronen `kategorier-synlighet`). `KATEGORI SAKNAS` i livekollen är därför väntat för Värme, ventilation & AC. Varje ny runda i den kategorin för den närmare.

(g) **`ghw.py write` tar `<runda> <sha> <läge>`**, inte ett workflow-namn. Kör aldrig flera `ghw`-processer samtidigt mot samma workflow, låset är per process.

(h) **En parallell läsning av mappningsloggen gav samma körning sex gånger** (fem av sex filer visade samma wix-id). Läs en i taget och kontrollera `wixProductId` i svaret.

(i) **Recensionerna: VEVOR visar 154 (snitt 4,23) på alla sex sidor, men importen tar bara dem som gäller sidans egen artikel.** Mätt ur VEVOR-avläsningarna och recensionslagret 2026-11-01: alla sex avläsningar bär samma betyg (154 recensioner, snitt 4,23) och tio sparade texter, eftersom VEVOR visar en familjs recensioner på varje artikel i familjen. Lagret har `b46eb759` en recension (översatt och publicerad), `f79f7c66` och `52528dd1` tre dolda och en väntande vars artikel inte går att avgöra, och `9bb0043a`, `43943aac` och `552380c0` inga rader. Det är alltså filtret på egen artikel som ger noll eller en, inte att ingen hade recensioner. Den första versionen av den här raden skrev "de övriga tre har inga alls", vilket gällde lagret och inte VEVOR:s sida. De två väntande oavgjorda raderna kan prövas med workflowen *VEVOR — recensioner om en annan artikel* (`plan`, läser bara).

(j) **Utfall runda vevor-1, mätt 2026-11-01 18:06 UTC** (ISR-medveten hämtning, `livegrind.py`, `livekoll.py`): 6 av 6 sidor svarar 200 och är OK, orddiffen mot rundans filer är 0 på alla sex (306–361 ord), och alt-texterna är 34 av 34. Skrivningen återlästes separat 6 av 6 LIKA före live-kontrollen. Brödsmulan visar bara `Trädgård & Utemöbler`: underkategorin Värme, ventilation & AC är dold tills tio varor är publicerade, och rundan har sex. Fyra till i samma kategori gör den synlig (kandidater: växthusvärmare, takfläktar, termostat).

(k) **Byggen för rundans sex pushar, mätt i Vercels deployment-lista** (motorns projekt, 2026-11-01 17:52–18:14 UTC): `1fb23cc0` READY (rörde `lib/` och `tools/`), `8af9387f` READY, och `25293744`, `cc42aea9`, `c698863d` och `f3c7a843` CANCELED med `#ignored-build-step`. Två byggen för sex pushar. `8af9387f` rörde bara `tools/` men pushades 48 sekunder efter kodpushen, före dess bygge hann bli READY, vilket är fallet *pusha inte två gånger inom samma byggfönster* i `CLAUDE.md`.

(l) ☠️ **Dubblettbilder: `gate-bilddubblett.py` fann en identisk bild i en runda som redan var publicerad** (2026-11-01 18:08 UTC). Grinden kommer från grenen `claude/vevor-polering-jul-1` (Leonard 2026-11-01, olivträdets position 3 och 4) och ligger inte på den här grenen än, så rundan skrevs utan den. Körd efteråt fann den `f79f7c66` position 1 och 6 identiska (avvikelse 0,000), och md5 på importens källfiler visade att VEVOR lagt samma fil två gånger i sitt eget galleri. Positionskopplingen position till Wix-fil stämde på alla sidor (md5 på varje bild mot sin källa). Min alt-text på position 6 ("snett från vänster, värmehuvudet vinklat åt sidan") beskrev en vy som inte fanns: ögat såg två lika bilder som två olika. Position 6 stryks i en egen liten bildrunda (`runda-vevor-1-bilddubblett`, `bygg-bildplan.py`, workflowen *Polering — skriv bara bilderna*): torr OK, skriv OK, galleriet läst tillbaka 5 bilder, huvudbilden orörd, alt-texterna lika med planen, namn, pris, SKU och synlighet oförändrade. Sidan har fem bilder kvar, så minimikravet håller. Det andra paret grinden flaggade, `52528dd1` position 3 och 6 (0,029), visar samma värmare påslagen respektive släckt och sedd bakifrån. Det kvitteras i `bilddubblett-ok.txt`. Kör grinden på en runda *före* skrivplanen, inte efter.

(m) **Grenen `claude/vevor-polering-jul-1` är en tidigare VEVOR-chatt, inte en parallell session.** Den har två rundor med 16 utkast (girlanger, lyktor och konstväxter, `runda-vevor-1` och `runda-vevor-2`) och ingen PR. Leonard 2026-11-01: *"Det är bara du som jobbar med produkterna ingen annan"*. Den första versionen av den här raden skrev att två sessioner polerade parallellt, vilket var fel. Ingen produkt förekommer i båda grenarna (0 gemensamma id), och rundorna ligger kvar där. Den som mergar den grenen får en konflikt i den här filen, att lösa genom att behålla båda raderna och lärdomarna. Den grenen har inte fraktviktsundantaget i `gatelib.py` (lärdom a), och den här har bilddubblettgrinden (lärdom l, kopierad ordagrant därifrån sedan runda 3). Rundkatalogerna heter olika, så filerna krockar inte.

(n) **En ändrad skrivplan skriver om hela rundan, så strykningar måste in i rundans egna filer först.** När värmarna lades under Terrassvärmare & Infravärmare (Leonard 2026-11-01) byggdes `skrivplan.json` om och kördes som en hel runda (text, bilder, kategorier, SKU). Hade `bilder-bort.tsv` och `alt.tsv` i huvudrundan inte fått strykningen av `f79f7c66` position 6 först, hade omskrivningen lagt tillbaka dubbletten. Kategoristeget lägger bara till: de tidigare kopplingarna (Bygg & Renovering och Värme, ventilation & AC) ligger kvar. Läst tillbaka efteråt i Wix: alla sex synliga, kategorin kopplad på alla, `f79f7c66` fem bilder. Live (2026-11-01 18:49 UTC): JSON-LD-brödsmulan är *Hem › Trädgård & Utemöbler › Terrassvärmare & Infravärmare* på alla sex, orddiff 0 och alt-texter 33 av 33 efter omskrivningen. Kategorisidans egen lista var fortfarande cachad (24 minuter gammal, 7 produktlänkar) och följer när cachen går ut, högst en timme.

(o) ☠️ **Två kontroller av kategorin ser rena ut utan att vara det.** En sträng-träff på kategorinamnet i produktsidans HTML räknar menyn, som listar alla kategorier på varje sida, så den gav träffar före och efter. Och `livekoll.py` skriver bara brödsmulans andra steg (`Trädgård & Utemöbler`), så kolumnen ser likadan ut med och utan lövet. Läs JSON-LD:ns `BreadcrumbList` i stället: den är det som visar om lövet sitter på sidan.

**Runda vevor-3 (2026-11-01): åtta blandade utkast** (myntsorterare, bänkskiva för tvättmaskin, hyllkonsoler, cykelkedja, två akvariefilter, knappmaskin, bubbelrörslampa).

(p) **Avläsningens `punkter` är en källa som utkastet saknar.** I rått läge hamnar VEVOR:s punktlista inte i utkastets beskrivning, men den bär fakta som specifikationen saknar (vad som ingår, antal skruvar, papperstyngd, material). `tools/polish-kedja/vevor_kalla.py` tar en tredje parameter (`punkter.json`, bara punktlistan) och lägger den som eget block `=== källa: punkter på VEVOR:s sida ===`, så att siffergrinden tar tal ur den. Rundorna 1 och 2 saknade blocket. Punkterna kan bära modellnummer: filen med de oredigerade raderna ligger aldrig i repot.

(q) ☠️ **VEVOR:s position 2 är ofta en AI-märkt bild.** Tre av åtta i runda 3 (da2906aa, 34302322 och 3a022547) bar texten *"AI-Generated Character and Scene"* nere i hörnet och stryks hela (`bilder-bort.tsv`). Titta på position 2 först. Märkningen syns på ett kontaktark bara om arket är stort nog att läsa hörnet.

(r) **Modellnumrets etikett finns i flera varianter** (*Artikelmodellnummer*, *Artikellägenummer*, *Modell*, *Artikelnummer*, *Produktmodell*, *Modellnummer*). `vevor_kalla.py` tar bort raderna ur källblocken. Raderna börjar med taggar (`<li><p><span …>Artikellägenummer:</span> …`), så etiketten matchas på raden efter att taggarna tagits bort. Första versionen matchade på råtexten och tog ingenting. Importen lämnade raden *Artikellägenummer* kvar i utkastets specifikation på eac8bb5b. Utkastet är dolt och skrivsteget ersätter hela beskrivningen, så sidan som publiceras bär den inte, men kolla etiketten i källan före varje runda.

(s) **`gate-bilddubblett.py` körs före skrivplanen** (lärdom l). I runda 3 fann den aa14d5af position 1 och 3 identiska (0,000), och position 3 stryks. Efter strykningarna: 0 fynd och 0 misstänkta i 8 produkter (44 bilder), och varje sida har minst fem bilder kvar (fyra sidor har fem, fyra har sex).

(t) **`batch` fälls som internt ord.** VEVOR:s text säger *Batch* för ett förinställt antal (0–999 mynt på myntsorteraren). Skriv *förinställt antal*. Samma gäller *magisk bok* i knappmaskinens källa: ordet togs bort, eftersom källan bara belägger en bok för teckning och inspiration med pandatema.

(u) **Ett tal från ett foto skrivs i `foto-tal.txt` som texten skriver det.** Diametern Ø 155 mm står i texten som 15,5 cm och raden måste säga `15,5`, inte `15`: grinden jämför strängen, och `[SIFFRA UTAN KÄLLA] '15,5'` fälldes på det.

(v) **Nya underkategorier är fortfarande dolda.** *Företag & Proffs › Butik, evenemang & trafik* (myntsorteraren) och *Sport & Fritid › Hantverk & sömnad* (knappmaskinen) har färre än tio publicerade varor, så brödsmulan visar bara avdelningen tills cronen `kategorier-synlighet` visar dem. `KATEGORI SAKNAS` i livekollen är väntat för de två.
