## SEO-titeln och metabeskrivningen ska vara sidans egna (2026-11-11)

Semrush fann 63 publicerade sidor som delade SEO-titel med en annan sida (30 grupper) och
fyra som delade metabeskrivning (två grupper). Sökmotorerna läser två sidor med samma titel
som dubbletter och visar högst en av dem. Samma dag publicerades en fåtölj till med en titel
som redan fanns, och två konstgjorda häckar skilde sig till slut bara på ett kommatecken.

Rubrikerna på sidorna skilde sig. Det var titeln som var för allmän: `Uppresningsfåtölj med
massage och värme` stod på tre olika fåtöljer. Ungefär tio av grupperna är färg- eller
storlekssyskon som kunde ha varit en sida med val, de övriga är olika modeller.

☠️ **Ingenting hade stoppat det.** Rundans grindar jämför bara produkterna i samma runda, och
syskonen polerades i olika rundor, ibland av olika chattar. Regeln "titeln skiljer sig från
syskonen" stod i runbooken, och en regel man måste komma ihåg glöms bort.

### Spärren i poleringens skrivning (`lib/polish/seo-unik.ts`)

Textsteget i "Polering — skriv en runda till Wix" frågar butiken efter alla publicerade
sidors titel och metabeskrivning innan det läser eller skriver något, i torrt läge och
skarpt. Står planens titel eller beskrivning redan på en annan publicerad sida avbryts
steget med `SEO-titel eller metabeskrivning står redan på en annan publicerad sida`, kort-id
för båda sidorna och `Ingenting skrivet`. Rätta `seo.tsv`, bygg om planen och kör igen.

- **Jämförelsen görs på en nyckel, inte på strängen** (`seoNyckel`): utan ` | Fyndplats`,
  gemener, och bara bokstäver och siffror. Ett kommatecken, ett tankstreck eller ett
  gångertecken gör inte två titlar av en.
- **Planens egna produkter räknas inte som andra sidor.** En omskrivning av en publicerad
  sida får behålla sin titel, och två produkter i samma plan får byta titel med varandra.
  Två rader i SAMMA plan med samma titel fälls av `valideraPlan`, före Wix.
- **Frågan filtrerar på `visible: true`.** Mätt 2026-11-11 mot butiken: filtret biter åt
  båda hållen. Svaret prövas ändå, och ett utkast i svaret kastar (`filtret bet inte`).
  Utkasten är två tredjedelar av katalogen och bär tyska titlar.
- **Kan butiken inte svara skrivs ingenting.** Läsningen kastar, och rutten svarar 500.
- En publicerad sida utan titeltagg räknas med sitt namn, för det är vad butiken visar.
- Felet bär kort-id och fältnamn, aldrig texten: svaret går till en publik logg.

Kostnaden är en läsning av de publicerade sidorna per körning av textsteget, 100 per
anrop. Tiden är inte mätt i drift: med cirka 6 200 publicerade sidor är det 62 anrop.

### Rätta publicerade sidor: `seo-titel.yml`

Poleringens textsteg skriver namn, adress, brödtext och synlighet i samma anrop och kräver
en hel runda per sida. För en sida som redan är publicerad och bara ska få en egen titel
finns workflowen **"SEO — titel och metabeskrivning på publicerade sidor"**
(`/api/admin/seo-titel`, `lib/polish/seo-titel.ts`).

- Den skriver **bara `seoData`**, med fältmask. Namn, adress, brödtext, synlighet, bilder,
  pris och varianter står inte i anropet.
- Bara sidor som är publicerade nu. Ett utkast stoppar hela planen: det poleras i en runda.
- Samma spärr som ovan mot de andra publicerade sidorna, och inom planen.
- Titeln slutar på ` | Fyndplats` och är högst 60 tecken, beskrivningen 50 till 160.
- Lägena är `torr`, `skriv` och `verifiera`, som i "Kategori — ta bort felaktiga
  kategorilänkar": `skriv` kräver antalet sidor som torrkörningen sa att den skriver.
- ☠️ `skriv` vägras i Aosoms synkfönster och när fönstret börjar inom fem minuter. Synken
  skriver priser på samma produkter, och två skrivningar på samma revision fäller den ena.
- En sida som bär fler än två SEO-taggar skrivs om även när texterna stämmer, så att bara
  husets två står kvar. En tredje tagg är ett gömställe (se *Katalogsvepet* i
  `05-aosom-synken/40-att-polera-aosom.md`).

Planen byggs i en katalog `tools/polish-assets/runda-seo-<plan>/` med `ids.tsv`
(`kort ⇥ pid`), `seo.tsv` (`kort ⇥ titel ⇥ meta`) och de publicerade sidorna i `live/`:

```
python3 ../../polish-gates/bygg-seo-titel.py <plan>
```

Bygget kör `gate-seo.py` mot de publicerade sidorna (tal, husmärken, artikelnummer, tecken,
längd, suffix) och skriver `tools/polish-assets/seo-titel/<plan>.json` och dess sha256 först
när grinden är utan fynd. `lib/polish/seo-titel.test.ts` prövar varje planfil i grenen mot
serverns regler och fäller om en titel står i två planer.

### De 66 sidorna: `semrush-1` och `semrush-2`

Två planer bär nya titlar för 62 sidor och nya metabeskrivningar för fyra (två färgpar som
delade beskrivning). En sida behåller sin titel, eftersom den blir ensam om den när syskonet
får sin. Varje titel bär det som skiljer sidan från syskonen och som redan står i sidans
rubrik: mått, material, färg eller en funktion.

Körs efter mergen, utanför synkfönstret, i den här ordningen för varje plan: `torr`, läs
antalet, `skriv` med antalet. Butikens sidor byggs om inom fem minuter. Kontrollera sedan
`<title>` på ett par sidor per plan och kör om granskningen i Semrush.

### Inte gjort

- **Syskonen är fortfarande egna sidor.** Tre paviljongtak, två Kawasaki-bilar och två
  smådjurshagar skiljer sig bara i färg och hör hemma på en sida med färgval
  (`05-aosom-synken/20-fargsammanslagning.md`). Det är ett eget beslut.
- **Ingen nattlig kontroll av hela katalogen i motorn.** Spärren hindrar nya dubbletter från
  poleringen. En titel som ändras för hand i Wix, eller en sida som publiceras på en annan
  väg, syns i butikens veckorapport om SEO och på butikens `/admin/seo-health`
  (`lib/seo-dubbletter.ts` i butiken, samma nyckel som här).
- Butikens `<title>` är `seoData`-titeln när den skiljer sig från namnet, annars
  `{namn} | Fyndplats`. Två sidor med olika titeltagg men samma namn är inte prövat.
