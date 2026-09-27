# Fyndplats – SEO-polera produkter

> **Körbar instruktion för poleringen.** En runda tar ungefär åtta utkast från urval till
> kontrollerad livesida. All skrivning till Wix går via workflowen **"Polering — skriv en
> runda till Wix"**. Ingenting skrivs för hand.
>
> **Kön består av Aosom-utkast:** tyska feedrader som ligger som `visible: false`.
> **AliExpress importeras inte längre** (2026-09-27). De AliExpress-sidor som redan ligger
> i butiken finns kvar ett tag, men de poleras inte och får inget produktsäkerhetsavsnitt.
> De spelar ändå roll här: en Aosom-vara kan redan säljas som AliExpress-sida, och då är
> utkastet en dubblett (se [Dubblettskärmen](#dubblettskärmen)).
>
> Fördjupning: [`polish/bildmetoder.md`](polish/bildmetoder.md) för bildbearbetning när den
> behövs, [`polish/syskon.md`](polish/syskon.md) för färg- och storlekssyskon som blir val på
> en sida, och [`polish/varianter.md`](polish/varianter.md) för AliExpress-sidor med flera
> varianter.

## Fasta regler

- Butik **Fyndplats**, site ID `e6d27e90-4749-4720-9afe-0bbe91c1b3d3`, **Catalog V3**.
  V1-siten `8c62127f-…` används inte.
- Allt kunden ser skrivs på **svenska**.
- **Rör inte priset.** Prissättningen är Leonards beslut.
- Butiken är headless Next.js på Vercel och uppdateras via ISR (300 s), utan ny deploy.
  `seoData`-taggarna `title` och `meta description` blir sidans `<title>` och
  metabeskrivning. OpenGraph byggs ur samma taggar och JSON-LD ur produktfälten.
- ☠️ **Aosoms artikelnummer får aldrig synas någonstans.** Inte i kundtext, spec-tabell,
  alt-text, SKU eller slug, och inte i rundans filer, commits, Actions-loggar eller
  PR-texter. Repot är publikt, och numret leder raka vägen till vårt inköpspris:
  dealproffsen publicerar samma sträng som `sku` och `mpn`. Redigera bort det ur källtexten
  redan när den hämtas (`‹REDIGERAT›`). Döp inte heller om raden: `Modellreferens`,
  `Referens` och `Artikelnr` läcker lika mycket. Skrivplanen vägrar en plan som bär ett
  artikelnummer i vilken form som helst, men `gate.py` och CI:s läcktest ser bara versala
  koder. Redigera därför på formen, utan hänsyn till versaler och oavsett etikett.
- **Husmärken ska bort.** HOMCOM, Outsunny, PawHut, Aiyaplay, SportNow, Vinsetto, Kleankin,
  Zonekiz, Durhand och Aosom (`gatelib.MARKEN`, `lib/import/sku.ts`) stryks ur namn,
  SEO-titel, meta, slug, sökord och alt-texter. Etablerade märken med eget sökvärde behålls.
  Är du osäker: behåll märket och flagga till Leonard.
- **Ett märke som sitter fysiskt på varan** (tryckt, graverat, gjutet eller en fastsydd
  etikett) hör till varan. Bilden behålls hel och produkten hålls inte tillbaka för det
  *(Leonard 2026-08-06, bekräftat 2026-09-27: "vi ändrar inget på deras utseende eller
  bild")*. Testet: skulle märket synas om du fotade varan själv efter uppackning?
  Skriv det aldrig i texten. Beslutet gäller leverantörens husmärken. Andras varumärken på
  varan (bilmärken, licensfigurer) är en licensfråga: flagga till Leonard.
- **Skriv aldrig avsändarland eller lagerland** *(Leonard 2026-08-15)*. Bara
  EU-lager-ribbonen får visa det. Sök på `skickas från` utan hänsyn till versaler i
  slutkollen, eftersom `gate.py` bara ser den gemena formen.
- **Wix nås bara via Wix-kopplingen:** `wix.request` i `ExecuteWixAPI`, eller
  `CallWixSiteAPI` när den svarar 403. Det finns ingen nyckel i sessionen, och ett rakt
  anrop mot `www.wixapis.com` svarar 403, vilket ser ut som ett behörighetsfel. Saknas
  Wix-verktygen går ingen runda att köra, och då ber du Leonard slå på kopplingen. Sök
  efter verktygen i stället för att fråga efter kopplingens status, för den kan säga
  `connected` även när inga verktyg är laddade.

## Rundan steg för steg

Allt körs från rundans katalog, `tools/polish-assets/runda-<namn>/`. Grindarna och
byggskripten ligger i `tools/polish-gates/` och anropas därifrån
(`python3 ../../polish-gates/<skript>`). Kopiera dem aldrig in i rundan.

| # | Steg | Filer som skrivs |
|---|---|---|
| 1 | [Välj åtta](#1-välj-åtta): kön, saldo, laglighet, dubbletter och sökord | `ids.tsv`, `lager.tsv` |
| 2 | [Hämta källan](#2-hämta-källan) | `bilder.tsv`, `variant.tsv`, `kallor.json` |
| 3 | [Bilderna före texten](#3-bilderna-före-texten) | `ark/`, `bilder-bort.tsv`, `foto-tal.txt`, `alt.tsv` |
| 4 | [Verifiera påståendena](#4-verifiera-påståendena) | — |
| 5 | [Skriv texten](#5-skriv-texten) | `<kort>.html`, `namn.tsv`, `slugs.txt`, `seo.tsv`, `sku.tsv`, `kategori.tsv` |
| 6 | [Läs sidan som kund](#6-läs-sidan-som-kund) | — |
| 7 | [Grindar och skrivplan](#7-grindar-och-skrivplan) | `axelfacit.json`, `vantat-hash.tsv`, `nyttolast-media.json`, `skrivplan.json` |
| 8 | [Skriv till Wix](#8-skriv-till-wix) | — |
| 9 | [Kontrollera live](#9-kontrollera-live) | `live/` |
| 10 | [Dokumentera](#10-dokumentera) | `LÄS-MIG.md`, rader i `FLAGGADE.md` |

`kort` är produkt-id:ts första åtta tecken. `ark/`, `orig/` och `live/` är hämtad data och
committas inte.

-----

## 1. Välj åtta

**Kön ljuger.** `needsAiPolish` nollställs inte alltid. Ta bara produkter som är
`visible: false` och vars namn inte innehåller å; ett tyskt namn kan ha ä och ö
(`Bücherregal`). Läs om varje produkt precis innan du börjar, eftersom en annan session kan
ha hunnit före. Läs `tools/polish-gates/FLAGGADE.md` först och välj ingen produkt som står
där.

**Välj i den ordning som säljer.** Först det som säljer de närmaste veckorna (i september jul
och inomhus, inte trädgård), sedan utkast där vi är billigare än dealproffsen (workflowen
**"Pris — jamfor mot dealproffsen"**), sedan familjer som fyller en sökordskategori. En
arbetsdelning mellan sessioner, till exempel att var och en tar sin ände av kön, går före.

Steg 1–3 går omlott: laglighets- och dubblettskärmen behöver källtexten och bilderna, så hämta
dem för kandidaterna innan du bestämmer dig.

**Välj familj efter luckan, inte efter högen.** Räkna utkasten mot de publicerade sidorna
av samma produkttyp: många publicerade sidor ger krockar och dubbletter, få ger lediga
sökord. Hitta utkasten med en delsträng på det tyska ordet, eftersom ett ledande adjektiv
(`Ergonomischer Kniestuhl`) annars gömmer halva familjen, och läs namnen, så att `Regal` inte
räknas där ordet bara beskriver en egenskap. Räkna de publicerade sidorna på det svenska ord
handeln använder (`studsmatta`, inte `Trampolin`); ett tyskt mönster mot svenska namn ger
alltid noll. Räkna distinkta produkter, så att färgsyskon och utkast med samma totalmått
räknas en gång, och undvik en familj där en annan session nyss har publicerat.

**Saldo.** Skriv varje produkts saldo i `lager.tsv` (summan av `quantity` ur
`inventory-items/query`) och kör `gate-lager.py` redan här. Saldot i Wix är redan minskat med
synkens buffert på tre, så 0 betyder slutsåld och 1–4 är tunt men köpbart. Grinden fäller 0
och varnar under 5.

### Laglighetsgrinden

Kör den innan du skriver något; husdjurens mått och normer syns ofta först på bilderna.
Den gäller bara klasserna nedan.

**Djurbostäder** (Jordbruksverkets SJVFS 2019:15, L80). Minimimåtten är bindande i Sverige,
och många burar är för små.

| Djur | Krav |
|---|---|
| Fågel ≤ 20 cm | 0,31 m² golvyta · längsta sida ≥ 0,7 m · höjd ≥ 0,6 m |
| Guldhamster | 0,12 m² · kortaste sida ≥ 25 cm · höjd ≥ 20 cm · hjul ≥ 28 cm (dvärg ≥ 20) |
| Kanin ≤ 2 kg | 0,5 m² ensam / 0,3 m² per djur i grupp |
| Kanin 2–3,5 kg | **0,7 m²** / 0,35 m² |
| Kanin 3,5–4,5 kg | 0,8 m² / 0,40 m² |
| Kanin 4,5–6 kg | 0,9 m² / 0,45 m² |
| Kanin > 6 kg | 1,0 m² / 0,5 m² |

Kaninens minsta höjd är 0,5 m för en liten kanin och 0,9 m för en stor. Utgå från 0,7 m²
när leverantören inte anger vikten. Kaninen ska också ha en hylla att sitta på och under
(8 kap. 21 §). Hyllplan och våningar räknas inte in i golvytan, och höjden mäts per delyta.
För hönshus finns ingen verifierad siffra ännu, och leverantörens antal höns är ofta
orimligt. Publicera aldrig ett antal höns utan att ha kontrollerat SJVFS 2019:15 och
2019:23.

Ligger buren under gränsen ska den inte poleras. Flagga den med den rättsliga orsaken.

**Hundburar** (SJVFS 2020:8, L 102) säljs lagligt, men regeln formar texten. En hund får
inte hållas i stängd bur inomhus. Står buren framme som hundens plats ska dörren tas bort
eller låsas fast i öppet läge. Stängd dörr är tillåten vid transport, utställning, prov,
tävling, träning och jakt. Skriv det som ett positivt villkor med egen rubrik
(`<h2>Så används den hemma</h2>`) och den här kärnmeningen ordagrant på varje sida: *"I
Sverige får en hund inte hållas i stängd bur inomhus. Står buren framme som hundens plats tar
du bort dörren eller låser den i öppet läge. Stängd används den vid transport, utställning,
prov, tävling, träning och jakt."*
Regeln gäller varje bur, även när källan inte nämner den. Passformen anges som hundens längd
från nosen till svansspetsen, med samma mening på varje sida, och aldrig som rasnamn. Aosoms
två grafiker mäter kroppslängden olika, och samma hund kan mäta 60 cm i den ena och 110 cm i
den andra.

**Övriga klasser:**

- **Leksaker:** EN 71-märkningen och åldersgränsen ska stå i texten. Saknas certifieringen
  i källan flaggar du produkten i stället för att gissa.
- **Grindar som marknadsförs för barn** kräver EN 1930. Skillnaden mellan en hundgrind och
  en barngrind ligger i provningen och syns inte på ett foto.

  | Läge | Så gör du |
  |---|---|
  | Källan namnger **EN 1930** | Skriv barnanvändningen med standarden utskriven |
  | Källan säger "certifierad" utan norm | Skriv den som husdjursgrind och utelämna barn |
  | Källan säger att grinden är för barn men nämner ingen norm | Lägg den åt sidan och flagga till Leonard |

  En klämmonterad grind hålls på plats av friktion och ska inte sitta överst i en trappa.
  Skriv monteringssättet i spec-tabellen (`Montering: klämmontage` eller `skruvmontage`).
- **Cykelkärra:** en tillkopplad cykelkärra ska ha röd reflex bakåt, eller en baklykta som
  visar rött ljus bakåt (Transportstyrelsen). Säljs en hundvagn som cykelvagn ska det stå,
  som ett positivt villkor med egen rubrik.
- **El som används mot kroppen, medicintekniska produkter och kosttillskott:** flagga till
  Leonard och polera inte.
- **Rött kors på varan** stoppar inte en publicering *(Leonard 2026-09-27, om medicinskåpet
  `8c4cf7e9`: "skitsamma")*. Emblemet är skyddat (lag 1953:771), så nämn det inte i namn
  eller text.

Har produkten en säkerhetsrelevant gräns (maxlast, ålder) står siffran i spec-tabellen.
Avgör gränsen hur varan får användas skrivs den som ett positivt villkor med egen rubrik,
till exempel *"Från 14 år"* eller *"Maxlast 120 kg"*. Den skrivs aldrig som ett
varningsblock.

### Dubblettskärmen

I vissa familjer finns vart fjärde utkast redan som publicerad sida. Träffarna är av fyra
sorter:

- **Aosom-varor som vi redan säljer som AliExpress-sidor.** De bär ett AliExpress-id, så
  ingen spärr som jämför id ser dem.
- **Samma vara två gånger i Aosoms feed**, under två artikelnummer och ofta till olika pris.
- **Färgsyskon:** samma vara i en annan färg, bland utkasten eller mot en publicerad sida.
- **Storlekssyskon:** samma modell i ett annat mått, ibland också i en annan färg.

Kör först **"Dubbletter — hitta färg- och storlekssyskon"** (`typ` och `lage` satta till
`alla`), en gång per runda. Svepet grupperar alla Aosom-sidor och Aosom-utkast i familjer
utifrån feedens mått, paketmått, vikt, färg, material och Aosoms egen gruppering. Det skriver
ut id, feedens färg, mått, pris och saldo, men aldrig artikelnummer. Ett utkast som står i en
familj är ett syskon eller en dubblett tills bilderna säger annat. Svepet ser bara sidor som
är mappade mot Aosom, så en publicerad AliExpress-sida hittar du bara med kontrollerna nedan.

Gör sedan två kontroller, i den här ordningen:

1. **Måtten sållar.** Läs produktens totalmått ur `Gesamtabmessungen` eller `Gesamtmaße`.
   Axelbokstaven sitter ofta inne i talet (`218B x 79T x 91H cm`), och `Paketmått` är
   kartongen, alltså fel nyckel. Bokstaven kan också stå före talet (`B73`). Jämför alla tre
   talen, med en tolerans på ±1 cm för bredd och djup och ±2 cm för höjd
   (`tools/polish-gates/DUBBLETTMATNING.md`), mot varje publicerad sida och mellan utkasten. Material-
   och lastrader stärker en träff. Ta med en publicerad sida med kända mått som kontroll:
   hittar svepet inte den är svepet trasigt. Svep hela katalogen och sök brett, eftersom samma
   vara kan heta `redskapsbod`, `redskapsskap`, `förråd` och `skjul`. Karusellen *Liknande
   produkter* på en publicerad syskonsida hittar dubbletter under andra namn.
   `https://www.fyndplats.se/sitemap.xml` listar de publicerade sidorna utan något Wix-anrop.
2. **Bilderna avgör.** Lägg varje träffs bilder sida vid sida. Är medelavståndet under 1,0
   på 320 × 320 i gråskala (`dubblettgrind.py`, med kandidaternas bilder i `img/` och de
   publicerade i `pub/`) är det samma foto. Ett högre avstånd
   bevisar ingenting, eftersom de två inköpsvägarna fotograferar samma vara var för sig.
   Avgör på konstruktion, detaljer och måttritning.

En träff poleras inte som egen sida och raderas aldrig:

| träffen är | så gör du |
|---|---|
| samma vara som en publicerad **AliExpress-sida** | Mappa om den publicerade sidan till Aosom (Leonards regel 2026-09-03): **"Dubbletter — mappa om en produkt till Aosom"**, först `plan` och sedan `byt`, med den publicerade sidan som `wix_product_id`, utkastet som `duplicate_wix_product_id` och `sku` tomt. Kundpriset rörs inte. Stoppar marginalhindret flaggar du i stället. |
| samma vara i samma färg och mått som en publicerad **Aosom-sida** | Pensionera utkastet (`draftStatus: rejected`, `needsAiPolish: false`) med **"Polering — läs och stämpla mappningsraden"**. |
| ett **färg- eller storlekssyskon** till en publicerad Aosom-sida | Lägg utkastet som ett val på sidan, se [Syskon blir val på sidan](#syskon-blir-val-på-sidan). |
| syskon **bara bland utkasten** | Polera ett av dem, helst det med flest rena bilder och saldo, och skriv namn, slug och titel utan färg och mått. Publicera det och lägg sedan de andra som val på den sidan. |
| ett syskon till en publicerad **AliExpress-sida** | Flagga till Leonard. Verktyget kräver en sida som är mappad mot Aosom. |

Skriv en rad i `FLAGGADE.md` för varje utkast som inte blir en egen sida och ta nästa.

### Syskon blir val på sidan

En publicerad Aosom-sida kan bära en Aosom-artikel per variant, med valen `Färg`, `Storlek`
eller båda. Synken, beställningsfilen och Google-flödet läser artikeln per variant. Syskonet
läggs in med **"Dubbletter — lägg ett utkast som färg eller storlek på en publicerad
sida"**, ett syskon per körning. Hela arbetsgången och alla hinder står i
[`polish/syskon.md`](polish/syskon.md).

1. **Plan först.** Kör `plan` med sidan som `behall` och syskonet som `utkast`. Ange
   syskonets värde på varje axel sidan har eller får (`farg_utkast`, `storlek_utkast`).
   Ange sidans eget värde bara på en axel sidan får för första gången (`farg_behall`,
   `storlek_behall`). Stava som i butiken (`Grå`, `110 × 85 cm`). Svepets färger är
   feedens tyska värden, så översätt dem efter bilden.
2. **Läs planen och hindren.** Bär sidans namn färgen eller måttet
   (`namnet_bar_farg`, `namnet_bar_storlek`) skriver du om namnet först. Sluggen står
   kvar. Stoppar SKU:n (`sku_ogiltig`, `sku_for_lang`, `sku_upptagen`, `sku_lika`) anger
   du `sku` själv, högst 40 tecken, eftersom det är Wix tak. Vid `kombinationen_finns` är
   utkastet en dubblett: pensionera det.
3. **Bilder.** Utan `bilder` följer utkastets huvudbild med när en ny färg läggs till,
   annars ingen. Ange fler (`bilder: 1,2`) bara för bilder du har granskat enligt steg 3.
   Huvudbilden ska visa varan **i syskonets färg**. Gör den inte det anger du den bild som
   gör det, först i `bilder`, eftersom den första bilden kopplas till färgen. Finns ingen
   sådan bild slår du inte ihop. Se
   [Varje färg har sin egen bild](#varje-färg-har-sin-egen-bild).
4. **Kör `byt`.** Varianten och dess lager skrivs i samma anrop och läses tillbaka innan
   mappningen skrivs. Utkastet pensioneras. Priset rörs inte, och från nästa synk följer
   det nya valet husets regel.
5. **Rätta texten.** Sidan beskriver fortfarande en färg eller ett mått, och planen varnar
   när beskrivningen nämner sidans värde. `Färg:`-raden ska räkna upp alla färger och
   `Mått:`-raden alla mått. Stryk meningar som påstår en enda färg. Ändringen görs utanför
   rundan, se [Utanför poleringen](#utanför-poleringen).

En sammanslagen sida tas aldrig med i en runda igen. Skrivworkflowen klarar bara sidor med
en variant, och rundans gamla filer skulle skriva tillbaka en enda färg.

#### Varje färg har sin egen bild

Varje färgval ska ha en egen bild kopplad i Wix (`linkedMedia` på valet). Butiken och
Google-flödet läser färgens bild just därifrån: produktsidan byter till den när kunden
väljer färgen, och flödet ger varje färgvariant den bilden. En färg utan kopplad bild
visar produktens huvudbild, alltså fel färg. Kunden väljer vit och ser grön, och Google
Shopping annonserar den vita varianten med ett grönt foto.

Sammanslagningen kopplar bilderna själv: sidans färg får sidans huvudbild och syskonets
färg syskonets bild. Återläsningen väntar på kopplingen. Hinner en bild inte kopplas
stoppar körningen med `… val saknar kopplad bild … mappningen skrevs INTE`, och då kör du
`byt` igen. Omkörningen ser att Wix är klart och kopplar bilderna. Ett undantag är med
flit: en storlekssida som får färg behåller storlekarnas bilder, och sidans egen färg får
ingen. Verktyget kopplar bara bilden. Du ansvarar för att den visar rätt färg.

Kontrollera efter `byt` att varje färg i väljaren byter till ett foto i just den färgen.
Samma krav gäller färger som kommit in på annat sätt, som AliExpress-importer och
handlagda val. Den 27 september 2026 saknade fyra sådana sidor färgbilder:
skoskåpet med tre speglade luckor (vit), tunnelväxthuset 597 × 295 cm (vit),
trehjulingen 6-i-1 (alla tre, fotona fanns i galleriet och kopplades samma dag) och
dieselvärmaren till husbil (röd och blå).

Finns inget foto i färgen är valet fel på sidan. Flagga det till Leonard i `FLAGGADE.md`.
Lägg aldrig en annan färgs bild på valet.

### Sökordet och krocken

Välj det svenska ord folk söker på: **huvudord och kvalificerare** för den exakta
produkttypen (`sadelstol`, inte `arbetsstol`). Lås ordet först när du har sett bilderna.
Använd `web_search` bara när produkttypen är oklar eller ordet krockar, och se då vad Jula,
Biltema, Clas Ohlson och liknande butiker kallar varan.

Kontrollera krocken mot hela katalogen innan du låser ordet:

- Slå upp rundans kandidatsluggar och en känd publicerad slug i ett enda `$in`-anrop
  (`slug` tar bara `$eq` och `$in`, med högst tio värden). Hittar anropet inte kontrollen
  är det trasigt.
- Sök ordet i namnen i rundans katalogsvep (se [Wix-läsfällor](#wix-läsfällor)). Svepet är
  klart först när markören är `null`.

Krockar ordet letar du först efter det exakta ordet för den andra varan (`balansbräda hund`
i stället för en andra `hundvippa`). Går det inte skiljer du dem åt med en kvalificerare
som står i **namnet, sluggen och titeln**, inte bara i brödtexten. Samma sak gäller syskon
inom rundan.

-----

## 2. Hämta källan

Läs varje produkt med en GET:

```
GET https://www.wixapis.com/stores/v3/products/{id}?fields=PLAIN_DESCRIPTION&fields=MEDIA_ITEMS_INFO&fields=DIRECT_CATEGORIES_INFO
```

Läs sedan saldot för hela rundan i ett anrop:

```
POST https://www.wixapis.com/stores/v3/inventory-items/query
{ "query": { "filter": { "productId": { "$in": [ … ] } }, "cursorPaging": { "limit": 100 } } }
```

Skriv filerna:

| fil | rad |
|---|---|
| `ids.tsv` | `kort ⇥ produkt-id ⇥ pris och tyskt namn` |
| `bilder.tsv` | `kort ⇥ position ⇥ wix-fil-id` |
| `variant.tsv` | `kort ⇥ variant-id` |
| `lager.tsv` | `kort ⇥ saldo` |
| `kallor.json` | `{ "kort": "källtext" }`, alltså `plainDescription` med artikelnumren redigerade |

Skriv filerna ur verktygssvaret med ett skript och redigera artikelnumren redan i det
steget. Skriv aldrig av en källtext eller ett id. Ett Aosom-utkast har en enda variant och
inga variantval.

### Vad källan är värd

Den tyska texten har tre delar, och de är olika mycket värda. Till dem kommer importens
svenska spec-block.

- **`Lieferumfang`** är det som ligger i kartongen. Den raden gäller.
- **`Technische Daten` och `Produktdetails`** ger mått och laster.
- **Titeln, `Beschreibung` och säljpunkterna** är marknadsföring. Titelns kategoriord är en
  hypotes: en "Gaming Stuhl" kan vara en kontorsstol, en "Frühbeet" en odlingslåda utan
  lock och en "Esszimmerstuhl" en bänk. `Lieferumfang` och bild 1 och 2 avgör. Importens
  alt-texter är titeln i ny form och inget eget vittne.
- **Spec-blocket** (`Mått`, `Färg`, `Material`, `Vikt`, `Paketmått`) kommer ur feedens
  kolumner, inte ur den tyska texten, och kan säga emot den:
  - ☠️ **`Vikt` är fraktvikten**, alltså feedkolumnen `Weight (incl. Package)`. Anger den
    tyska texten ingen produktvikt (`Gewicht`) skriver du `Fraktvikt: X kg` i spec-tabellen,
    och du skriver aldrig i löptexten att varan väger X. `gate.py` fäller båda.
  - `Mått` kan ha axlarna i fel ordning. Måttritningen avgör geometrin.
  - `Färg`-värdet står kvar på tyska. Översätt det efter bilden.
  - Blocket kan vara lånat från en annan modell. Saknas måttritning prövar du proportionerna
    mot studiobilden, till exempel hjulets andel av höjden.

**Ett tal som är exakt detsamma som grannfältets är misstänkt**, till exempel en stol vars
djup är exakt bordets eller en vikt som är exakt syskonets. Läs om fältet. Ett tal du inte
kan belägga står inte på sidan.

-----

## 3. Bilderna före texten

`python3 ../../polish-gates/bygg-ark.py` hämtar varje bild i full upplösning och bygger ett
kontaktark per produkt i `ark/`. Titta på arket innan du skriver något. Bilderna visar vad
varan är, hur många delar den har och hur den sitter ihop. Golvlampan `13a53d52` beskrevs
till exempel med två skärmar utifrån källans två mått, men fotot visar en.

Position 1 är en vit studiobild och har aldrig behövt strykas (0 av 687 produkter i B- och
N-rundorna), så arket räcker för den. Granska 2–5 i full upplösning i `orig/`. Varumärken på
rekvisita sitter oftast i miljöbilden på plats 2, och i runda B19 bar de flesta miljöbilder
ett. Siffror i en ritning och hur varan är byggd läser du också i `orig/`, aldrig på arket
(600 px per bild): en etikett lästes en gång som 36 cm på arket men var 35.

**Stryk** en bild genom att skriva en rad i `bilder-bort.tsv` (`kort ⇥ position ⇥ skäl`)
när den bär:

- inbränd text på ett annat språk än svenska, oftast tyska eller engelska (`Family-size`, `7 Cups`)
- ett riktigt varumärke, en webbadress eller text på rekvisita (flaskor, böcker, ljus) som
  går att läsa i full upplösning
- leverantörens logotyp, oftast i ett övre hörn (`HOMCOM by Aosom`). Misstänker du en ljus
  logotyp på ljus vägg eller himmel kör du `bygg-ghost.py`, som gör den synlig.
- en annan färgvariant, modell, storlek eller konfiguration än den som säljs
- samma scen från samma vinkel som en annan bild i galleriet, eller en miljöscen som ett
  publicerat syskon redan bär

**Behåll** text som sitter fysiskt på varan (knappar, märket på godset), en måttritning som
bara har siffror och enheter, och text som går att läsa först i flerfaldig förstoring. Stryk
bara det listan ovan tar upp: så många användbara bilder som möjligt *(Leonard 2026-07-10)*,
men hellre två rena bilder än tre där en bär ett varumärke på rekvisitan.

**Redigera aldrig en bild.** Den behålls eller stryks hel. Ingen beskärning, retuschering
eller maskning av varan *(Leonard 2026-09-27)*.

**Läs siffrorna i en infografik innan du stryker den.** Ett tal som avgör köpet kan finnas
bara i bilden. Ett exempel är gasolregulatorn på 50 mbar, där svenska tuber kräver 30 mbar.
Sådana fakta ska in i texten.

Tal som du räknar i ett foto, till exempel dörrar, lådor och fack, skriver du i
`foto-tal.txt` (`kort tal skäl`). Våra egna anvisningar ("minst 20 cm fritt bakom") skriver
du i `rad-tal.txt`, ett tal per rad. Annars fäller `gate.py` dem som tal utan källa.

**Färgen på en del av varan** (fälg, ben, beslag, randning) kräver att du förstorar just
den delen minst två gånger. Kontaktarket räcker bara för färgen på hela varan. Räkna upp
varje färgad del.

**Galleriet:** `bygg-media.py` behåller källordningen och lägger källposition 3, som nästan
alltid är måttritningen, sist. Plats 1 blir huvudbild och delningsbild. Produktsidans
galleri visar varje bild som en kvadrat beskuren från mitten (bara förstoringen visar hela
bilden), så en liggande bild tappar sina kanter och en liggande måttritning sina yttersta
mått. Polerar du syskon samtidigt ska två sidor inte dela samma miljöfoto, så stryk det på
den ena.

Rundan bearbetar inga bilder, den väljer bland dem som finns. Behövs en bearbetad bild står
metoderna i [`polish/bildmetoder.md`](polish/bildmetoder.md).

**Alt-texterna** (`alt.tsv`: `kort ⇥ position ⇥ text`) beskriver det som syns på just den
bilden, på svenska och olika för varje bild, med sökordet där det faller sig naturligt.
Beskriv varan, inte rekvisitan: djuret, barnet eller kaffekoppen i miljöbilden hör inte till
produkten. Samma förbjudna ord gäller som i texten. En struken position får ingen rad, och
`gate-alt.py` fäller en som får det.

-----

## 4. Verifiera påståendena

Det här är det viktigaste steget. Ungefär varannan produkt har minst ett påstående från
leverantören som inte stämmer.

1. **Bilden vinner** över texten om det som syns: färg, form, antal och konstruktion.
   Packbilden är den säkraste källan till vad som ingår.
2. **Källtexten vinner** om det som inte syns: inomhus eller utomhus, justerbarhet,
   bärighet, ytbehandling och vad som ingår. Läs hela källtexten, så att inga egenskaper
   som bara står där faller bort.
3. **Två källor som säger olika:** ta talet som skyddar kunden om det är fel, alltså det
   större för yttermått och utrymmesbehov och det mindre för innermått, last och "passar upp
   till". Går de inte att förena utelämnar du uppgiften. Gäller det huvudmåttet, som inte
   går att utelämna, skriver du det skyddande talet och noterar avvikelsen i `LÄS-MIG.md`.
   Skriv aldrig en brasklapp som "leverantören anger X, men …". Rättelsen står i löptexten
   och i tabellen.
4. **Måttritningen avgör geometrin.** Säger en etikett något annat än ritningen, mät
   ritningen. En last i ritningen är text och väger inte tyngre än specen. Säger källorna
   olika om en last skriver du den lägsta, med samma tal i spec-tabellen och i
   Produktsäkerhet. Visar ritningen en högre last stryker du ritningen, annars ligger den kvar
   i galleriet och säger emot sidan.
5. **Varje mätvärde och varje mekanikord ska gå att peka på i källan.** Går det inte skriver
   du det allmänna ordet ("metallskenor", inte "kullagrade skenor"). Var inte mer exakt än
   källan ("soft-close-gångjärn", inte "soft-close på alla luckor").
6. **Skriv ingen negation** ("saknar ram") bara för att källan inte nämner saken.
   **Ett faktum gäller bara sin egen produkt.** Det du läser i en produkts bild eller källa
   skriver du inte på ett syskon, hur likt det än är.
7. **En funktion som titeln lovar** ska ha ett eget mått i specen. Saknas det tar du reda
   på vad totalmåttet består av innan du skriver om funktionen.
8. **Kapacitet ska mätas, inte kopieras.** Ett tält som säljs som "4 Personen" men har 2–4
   sovplatser får måtten, inte siffran. Samma sak med prestandatal som bara gäller ett
   delfall: "42 sekunder till kokning" för en kanna på 1,7 liter gäller en kopp. Skriv
   villkoret eller utelämna talet.
9. **Bärighet betyder inte hur många som får plats.** Räkna en vuxen som ungefär 80 kg. En
   bänk som tål mindre än 160 kg beskrivs aldrig som en tvåsits, hur bred den än är. Samma
   sak gäller hyllor, stänger och fästen.
10. **Ett dörrmått kan gälla en dörrhalva.** Räkna gångjärnen på bild 1. Två uppsättningar
    betyder dubbeldörr, och då skriver du `2 × B × H`.
11. **Räkna efter dina egna tal.** Fyra stolar på 42 cm kräver 168 cm, inte 160.
    Superlativ om sortimentet ("smalast", "den lättaste … i sortimentet", "den enda")
    kräver en mätning mot hela katalogen och en rad i `superlativ.txt` (`<kort> <vad som
    mättes>`), annars fäller `gate-superlativ.py`. Den ser inte superlativ om marknaden i
    stort ("den lättaste sortens gran"), så de hittar du själv.
12. **Upprepa aldrig ett superlativ utan mätvärde**, varken leverantörens eller våra egna.
13. **Översätt inte marknadsord, beskriv förhållandet.** `begehbar` med 58 cm invändigt djup
    är inget förråd man går in i. `passt durch Standardtüren` säger inget om en svensk
    dörröppning, så skriv bredden. `Fenster` kan vara en ventillucka.
14. **Färg:** bilden avgör, med förstoring av delen (se steg 3). Bara när bilden inte kan
    avgöra och fälten säger olika utelämnar du färgen. En färg som skulle bli likadan som ett
    syskons är i sig ett tecken på att fältet är fel.
15. **Träslaget:** är källan oense skriver du `massivt barrträ`. Är den entydig skriver du
    träslaget, till exempel `gran`.
16. **Produkttypens vanliga säljargument kan vara fel.** Den upphöjda matskålen sägs skona
    hundens nacke, men den är förknippad med ökad risk för magomvridning. Beskriv hur varan
    fungerar och låt kunden dra slutsatsen.
17. **Mallar är inga mätningar.** Oifyllda platshållare (`-XX-XXcm`) och tal i en
    marknadsbild som återkommer på olika modeller säger ingenting om just den här varan.

-----

## 5. Skriv texten

Skriv allt i rundans filer. Ingen text skrivs direkt i ett anrop.

### Namn, slug, titel och meta

| fält | fil | regel |
|---|---|---|
| **Namn** (H1) | `namn.tsv` (`kort ⇥ namn`) | Börjar med fokussökordet. Högst 80 tecken, eftersom Wix avvisar fler. Produkttypen är vad varan faktiskt är. Måste namnet kortas stryks färgen före det som hindrar en missuppfattning om vad som ingår (`utan stomme`). |
| **Slug** | `slugs.txt` (`kort slug`) | ASCII, gemener och bindestreck, med fokussökordet. |
| **SEO-titel** | `seo.tsv` (`kort ⇥ titel ⇥ meta`) | Börjar med fokussökordet. Högst 60 tecken inklusive ` \| Fyndplats`. Skiljer den sig inte från namnet struntar butiken i både titeln och metan och visar `{namn} \| Fyndplats` och första stycket. |
| **Meta** | `seo.tsv` | Sikta på högst 155 tecken (`gate-seo.py` fäller över 160), med nyttan och sökordet och inga påståenden som inte är verifierade. |

Fokussökordet står i namnet, sluggen och titeln. Det som skiljer produkten från ett syskon
som får en egen sida ska synas i alla tre. Ett färg- eller storlekssyskon som ska bli ett val
på sidan får däremot ingen egen sida. Skriv då namn, slug och titel utan färgen och måttet,
eftersom sammanslagningen vägrar ett namn som bär sidans färg eller mått.

**Sluggen byts bara på utkast.** Butiken är headless och gör ingen automatisk
omdirigering, så en ändrad slug på en publicerad sida ger en 404. Måste en publicerad slug
ändras, eller en publicerad produkt tas bort, kör du workflowen **"Lägg till 301-redirect
(manuell trigger)"** efter skrivningen, mot den nya sidan eller mot kategorin, aldrig mot
startsidan. Rutten vägrar så länge den gamla sluggen fortfarande är synlig.

### Beskrivningen (`<kort>.html`)

```html
<p>Ingress: vad varan är, i två till tre meningar med fokussökordet.</p>

<h2>En rubrik som säger något</h2>
<p>Ett säljargument per avsnitt, två till fyra avsnitt.</p>

<h2>Egenskaper</h2>
<ul>
<li><p>Kort egenskap</p></li>
</ul>

<h2>Tekniska specifikationer</h2>
<ul>
<li><p><span style="font-weight: 700">Mått:</span> 90 × 60 × 4 cm</p></li>
</ul>

<h2>Användning och skötsel</h2>
<p>Montering, placering och skötsel för just den här varan.</p>

<h2>Vanliga frågor</h2>
<p><span style="font-weight: 700">Fråga?</span></p>
<p>Svar.</p>

<h2>Produktsäkerhet</h2><ul><li>Maxbelastning: 120 kg.</li></ul>
```

- ☠️ **Flikrubrikerna måste stå ordagrant.** Butiken gör flikar av exakt
  `Tekniska specifikationer`, `Användning och skötsel` och `Vanliga frågor`. Den lägger
  själv till `Kontakta oss` och lyfter ut `Produktsäkerhet` till fliken med samma namn. Skriv
  rubrikerna som rena `<h2>` utan fetstil. `Specifikationer` eller `Montering och skötsel`
  blir ingen flik, och då hamnar avsnittet mitt i brödtexten utan att se trasigt ut.
- **Allt som ska stå i brödtexten står före den första flikrubriken.** En annan `<h2>`
  efter en flikrubrik hamnar inne i den fliken.
- **Alla tre flikarna ska finnas**, i den här ordningen. Skötseln ska vara konkret och gälla
  just varan: efterdra skruvarna efter en månad, torka upp vatten på spånskivan direkt,
  stäng av strömmen innan glaset torkas. "Torka av vid behov" säger ingenting. Varje vara
  har skötsel.
- **Tekniska specifikationer** är en `<ul>` med en uppgift per rad och fet etikett. Skriv
  måtten som tre tal utan axelord (`90 × 60 × 4 cm`). I löptexten bestäms bredd, djup och
  höjd av ritningen, och `gate-axel.py` jämför det du skriver med källans totalmåttrad.
  Fraktvikt heter `Fraktvikt`.
- **Vanliga frågor:** fyra till åtta verkliga köpfrågor. Högst en får besvaras med ett tal
  som redan står i tabellen; de andra svarar på det tabellen inte säger: vad som ingår och
  inte, vad som behövs till (verktyg, VVS, el, batterier), montering och var varan passar.
  Fråga och svar skrivs som två `<p>`, eftersom Wix tar bort `<br>`.
- **Svensk sifferstil:** decimalkomma (`4,5 kg`), `×` med mellanslag (`72 × 57 × 56 cm`),
  tankstreck i intervall (`18–36 månader`) och snedstreck i talserier i spec-tabellen
  (`10/20/30 cm`). I löptexten går det bra med "20, 40 och 60 cm".
- **Samma tal överallt.** Ett mått eller antal är detsamma i namn, titel, meta, ingress,
  spec, frågor, alt-texter och produktsäkerhet. Rättar du ett tal söker du efter det i alla
  rundans filer.
- **Inga länkar i produkttexten.** Karusellen *Liknande produkter* länkar mellan
  produktsidorna och menyn till kategorierna. `gate.py` fäller en länk.

### Tonen

Leonard, 2026-08-14: *"Vi ska ju försöka sälja produkter, inte försöka få dom att skita i
att köpa."* Och 2026-08-21: *"Du ska inte skrämma kunderna från att köpa, allt behöver man
inte veta, o andra saker som man måste veta kan stå med på ett snyggt sätt."*

- Skriv inget block med rubriken **"Det du bör veta innan du köper"** eller **"Bra att
  veta"**. Förbudet gäller formen, så det hjälper inte att byta rubrik.
- Mot kunden är det **vi** som är leverantören. Lägg aldrig en uppgift på någon annan
  ("leverantören anger", "tillverkaren rekommenderar", "enligt uppgift") och visa aldrig
  att vi inte vet ("framgår inte", "vi har inga uppgifter om", "vi kan inte lova").
  `gate.py` fångar de vanligaste formerna, inte alla.
- Be aldrig kunden mäta, väga eller kontrollera om varan duger, och lägg inte till ett
  tvivel om ett mått som redan står i tabellen.
- En gräns som är en del av köpet, som maxlast, förankring i väggen, batterier som inte
  ingår eller att en elektriker ska koppla in varan, skrivs som ett **positivt villkor med
  egen rubrik**, till exempel *"Passar bilar med fabriksmonterad CarPlay"* eller
  *"Batterier: 3 × AA, ingår inte"*. Den skrivs aldrig som en varning.
- En rättslig upplysning (djurbostäder, hundburar) står kvar, med samma ordalydelse på
  varje sida i gruppen.
- Skriv aldrig *rundan*, *omgången* eller *batchen*. Det är våra arbetsord, och `gate.py`
  fäller dem. En jämförelse med våra andra varor kräver en mätning av hela katalogen, och en
  jämförelse med en annan varugrupp ("samma volym som en inbyggnadsugn") skriver du som måttet
  i stället.
- Syskonsidor får egna rubriker med det tal som skiljer dem åt. En sida får inte läsas som
  en kopia av syskonets.

### Produktsäkerhet (GPSR) — sista avsnittet, skrivs vid varje polering (2026-09-27)

**Varför.** EU:s produktsäkerhetsförordning (EU) 2023/988, artikel 19, kräver att
varje produktsida visar tillverkare, ansvarig i EU, produktens identitet och
**säkerhetsinformation på svenska**. Den föreslagna svenska kompletteringslagen ger
sanktionsavgift för brott mot just artikel 19 (lägst 10 000 kr). Butiken visar det i
en hopfälld flik **Produktsäkerhet** före *Kontakta oss*.

**Vem gör vad.**

| Del av fliken | Kommer från | Du gör |
|---|---|---|
| Varumärke (HOMCOM, Outsunny …) | Motorn (`lib/gpsr/aosom-data.json`) | Ingenting |
| Tillverkare och ansvarig i EU (MH Handel GmbH, Hamburg) | Motorn, samma för alla Aosom-märken | Ingenting |
| Produkt (namn + bild) | Sidan själv | Ingenting |
| **Säkerhetsinformation** | **Ditt avsnitt i beskrivningen** | **Skriv det** |
| *"Läs bruksanvisningen … och spara den."* | Butiken, på varje produkt | Ingenting |

Butiken lyfter ut ditt avsnitt ur beskrivningen och lägger det i fliken under
tillverkaren. Det blir **inte** en egen flik bredvid och syns inte i brödtexten.
Skriver du inget avsnitt använder fliken motorns förhandsöversättning (hela feeden,
2026-09-27) — **ditt avsnitt vinner alltid**, för det är skrivet för den polerade sidan.

#### Så skriver du det

Sist i rundans källfil `<kort>.html` (den som blir `plainDescription`), efter *Vanliga frågor*:

```html
<h2>Produktsäkerhet</h2><ul><li>Maxbelastning: 120 kg.</li><li>Rekommenderad ålder: 3–5 år.</li><li>Endast för användning under tillsyn av vuxen.</li></ul>
```

- Ren `<h2>Produktsäkerhet</h2>` — samma flikregel som ovan, ingen fetstil på rubriken.
- En uppgift per `<li>`, en fristående mening som slutar med punkt. Högst 12 rader.
- Inga stycken före eller efter listan, ingen egen underrubrik.

#### Källan och vad som ska med

Läs feed-radens tyska text (`kallor.json`) — **punktlistan, `Produktdetails`/`Technische Daten`
och brödtexten** — och ta med **bara** det som står där:

| Typ | Tyskt i källan | Skriv så här |
|---|---|---|
| Maxbelastning | `Belastbarkeit: 35 kg (gesamt), 5 kg (pro Regal)` | `Maxbelastning: 35 kg totalt, 5 kg per hylla.` |
| Användarvikt / -längd | `Max. Benutzergewicht: 120 kg` · `bis 190 cm` | `Max användarvikt: 120 kg.` · `Lämplig för en kroppslängd upp till 190 cm.` |
| Ålder | `Empfohlenes Alter: 3–5 Jahre` · `ab 18 Monaten` | `Rekommenderad ålder: 3–5 år.` · `Rekommenderad ålder: från 18 månader.` |
| Ålderspärr | `Nicht geeignet für Kinder unter 36 Monaten` | `Ej lämplig för barn under 36 månader.` |
| Tillsyn | `unter Aufsicht eines Erwachsenen` | `Endast för användning under tillsyn av vuxen.` |
| Tillsyn, skarp | `nur unter **unmittelbarer** Aufsicht` | `Endast för användning under direkt tillsyn av vuxen.` |
| Tippskydd medföljer | `Anti-Kipp-Set zur Wandbefestigung` | `Levereras med tippskydd för förankring i väggen.` |
| Förankring krävs | `**muss** an der Wand befestigt werden` | `Möbeln ska förankras i väggen för att förhindra att den tippar.` |
| Inomhus / utomhus | `Nur für den Innenbereich` | `Endast för inomhusbruk.` |
| Ej yrkesmässigt | `nicht für gewerbliche Nutzung` | `Ej för yrkesmässigt bruk.` |
| Uttrycklig varning | `Achtung: …` · `Warnung: …` | `Varning: …` (översätt meningen) |
| Standard, certifierad | `Sicherheitsstandard: EN71-1-2-3` | `Uppfyller EN 71-1, EN 71-2 och EN 71-3.` |
| Standard, provad | `Geprüft nach EN71` | `Testad enligt EN 71.` |

Även el-, brand-, värme-, kläm- och kvävningsrisk (smådelar) och batterisäkerhet —
när källan säger det. Håll dig till formuleringarna ovan, så att katalogen läser
likadant.

**Inte med:** säljtext som nämner säkerhet (*"kippsicheres Design"*, *"stabil"*,
*"sicher für Kinder"* utan gräns), mått och funktioner som inte är en gräns,
*"Montage erforderlich"* utan krav på vuxen, *"Batterien nicht enthalten"* (det är
leveransinnehåll — hör hemma i specifikationerna), varumärken och
leverantörsnamn. **Finns ingen säkerhetsinformation i källan: skriv inget avsnitt.**

#### Fyra regler — alla hittades när hela feeden översattes

1. ☠️ **Skärp aldrig källan.** *"direkt tillsyn"* bara vid *unmittelbar/direkt*;
   *"ska förankras"* bara vid *muss/sollte*. Översättningen av feeden skärpte
   150 rader som fick rättas — en säkerhetsuppgift som låter strängare än varan är
   lika fel som en som låter mildare.
2. ☠️ **Varje siffra ska stå i källan**, med decimalkomma. Månader förblir månader
   (*36 månader*, inte *3 år*). `gate.py` kontrollerar det redan mot källtexten,
   liksom varje EN-norm — ett fynd där är ett riktigt fel, inte ett falsklarm.
3. ☠️ **Samma värde i spec-tabellen och i avsnittet.** Aosoms text säger ofta emot
   sig själv: produktdatan säger `max. Belastbarkeit: 98 kg`, punktlistan
   `Bis max. 100 kg`. Uppmätt 2026-09-27: 38 produkter i feeden anger mer än ett
   belastningsvärde; i åtta är det SAMMA del med två olika tal, och alla åtta gånger
   bär punktlistan det högre, avrundade. **Produktdatan gäller** — och säger även
   den emot sig själv tar du **det lägre värdet**. Skriv sedan SAMMA tal i
   *Tekniska specifikationer* och i *Produktsäkerhet*; två olika maxlaster på samma
   sida är två påståenden om varan, och ett av dem är fel.
4. ☠️ **Hitta inte på.** Hellre en rad för lite än en varning som inte står på varan.
   Är det oklart vad en mening syftar på (*"Um dies zu verhindern …"*) — ta med
   uppmaningen, gissa inte risken.

#### Det här är inte ett varningsblock

Förbudet mot *"Det du bör veta"*-block ovan gäller text högt upp som kunden läser som
skäl att avstå. Det här är en hopfälld, lagkrävd flik sist på sidan. Skriv den alltid
när källan har uppgifterna — och flytta **aldrig** upp raderna i ingressen eller
egenskapslistan.

#### Grindarna

- **`gate.py`** läser avsnittet som all annan text: siffror och normer mot källan,
  husmärken, fraktland, leverantörsord. Märket och tillverkaren hör inte hemma i ditt
  avsnitt — fliken lägger dit dem själv.
- **`livegrind.py`** klipper ut fliken innan sidsvepet, eftersom fliken *ska* visa
  `HOMCOM` och `Tyskland` (lagen kräver tillverkarens namn och adress). Dina rader
  svepas och orddiffas som vanligt. Har källfilen ett avsnitt fäller grinden en sida
  där fliken saknas, eller där den saknar tillverkaren (motorn svarade inte när sidan
  renderades — hämta om efter ISR-fönstret).

**AliExpress-varor omfattas inte** (Leonard 2026-09-27) — skriv inget avsnitt för dem.

### SKU (`sku.tsv`)

Skriv `kort ⇥ FP-…`: `FP-` följt av svenska ord som skiljer varan från syskonen, med mått
före färg, till exempel `FP-tvattstallsskap-76cm-svart`. Högst 40 tecken, eftersom Wix avvisar fler
(`gate-sku.py` fäller). Bara gemener, siffror och bindestreck, inget husmärke och ingen tysk
råtext. SKU:n beskriver produkten, inte kategorin. Ska sidan få syskon som val blir deras
SKU sidans SKU plus syskonets mått och färg, så håll den kort (`FP-tvattstallsskap-76cm`).

SKU:n ska vara unik i rundan och mot familjens publicerade sidor, som du ändå läser en i
taget (`variantsInfo` finns bara då). Den syns inte för kunden och går inte ut i
Google-flödet, så det behövs inget katalogsvep. Importen gav produkter med samma början på
den tyska titeln samma SKU, så varje produkt i rundan måste få en egen. Rör aldrig `FYND-`-
eller `AE-`-SKU:er på andra produkter.

### Kategori (`kategori.tsv`)

Skriv `kort ⇥ Förälder + Löv + Sökordskategori` (ett till sex namn), med kategorinamnen
exakt som i Wix. Läs trädet varje runda (`POST /categories/v1/categories/query` med
`treeReference: {"appNamespace": "@wix/stores"}` och `cursorPaging: {"limit": 200}`, som
workflowen; trädet har över hundra kategorier) och gissa aldrig ur minnet. Koppla
föräldern, det smalaste lövet som passar och den sökordskategori som finns för
produkttypen. Finns inget löv räcker föräldern. Välj aldrig `All Products`, eftersom Wix
lägger till den själv. Workflowen slår upp namnen, och torrkörningen fäller ett namn som
inte finns.

Sökordskategorin är den sida som rankar på huvudordet, och dess text påstår saker om alla
sina produkter. Läs dess facit (`tools/polish-assets/runda-s*/<slug>-text.json`, fältet
`facit`) och pröva varje *alla*, *varje* och *ingen* mot den nya produkten. Bryter produkten
ett påstående skriver du en rad i `FLAGGADE.md` i stället för att koppla den.

-----

## 6. Läs sidan som kund

Grindarna kontrollerar fält. Det här steget läser texten, och det fångar det som grindarna
släpper igenom: sidor som stämmer i varje fält men ändå läser illa. Läs hela texten
uppifrån som någon som funderar på att köpa:

- Låter något defensivt?
- Upprepas ett mått med ett tvivel?
- Ber vi kunden mäta eller kontrollera något?
- Läser sidan som en kopia av syskonets?
- Står samma tal överallt, och påstår sidan något om varan som bara stämmer för ett syskon?
- Finns det en mening som inte hjälper någon att bestämma sig? Stryk den.
- Skulle du själv köpa varan? Om svaret är "kanske, men …", rätta det som "men" handlar om
  i texten.

-----

## 7. Grindar och skrivplan

Kör från rundans katalog. Lägg först familjens tyska huvudord i `gatelib.TYSKA_ORD` om de
saknas; ord får bara läggas till, aldrig tas bort.

```bash
G=../../polish-gates
python3 $G/hasha.py             # facit för återläsningen -> vantat-hash.tsv
python3 $G/bygg-skrivplan.py    # kör alla grindar och bygg-media.py, skriver skrivplan.json och plan_sha256
```

Bygget kör grindarna i tur och ordning och vägrar skriva planen vid ett enda fynd:

| grind | kontrollerar |
|---|---|
| `gate.py` | tal mot källan, tyska rester, husmärken, artikelnummer, fraktland, leverantörs- och arbetsord, stavning, osynliga tecken, fraktvikt, länkar och flikar |
| `gate-alt.py` | samma mönster i `alt.tsv`, antalet bilder och att en struken position saknar rad |
| `gate-seo.py` | `seo.tsv`, `namn.tsv` och `slugs.txt`: längder, suffix, tal mot källan, samma mönster, husmärke i sluggen |
| `gate-sku.py` | längd, form, husmärke, dubbletter och att alla produkter har en rad |
| `gate-lager.py` | slutsålt och tunt |
| `gate-superlativ.py` | superlativ om sortimentet utan rad i `superlativ.txt` |
| `bygg-axelfacit.py`, `gate-axel.py` | bredd, djup och höjd mot källans totalmått |
| `bygg-media.py` | bygger `nyttolast-media.json` på nytt ur `bilder.tsv`, `bilder-bort.tsv` och `alt.tsv` |

Rätta fynden i filerna, aldrig i grinden. Går ett fynd inte att laga i filerna, till exempel
när källan saknar totalmått, kvitterar du det i `grind-undantag.txt` (`<skript> <skäl>`);
grinden körs och skrivs ut ändå. Varningar stoppar inte bygget, men gå igenom dem en och en:
`UTSKRIVNA RÄKNEORD UTAN TÄCKNING` betyder att "tre fack" inte har något belägg. Ändrar du en
fil efter `hasha.py` kör du båda kommandona igen.

Workflowens torrkörning vägrar dessutom ord med formen tre tecken, bindestreck och tre till,
som `360-graders`, `100-pack` och `E27-sockel`. Skriv `360 grader` och `100 st`.

-----

## 8. Skriv till Wix

1. Har rundan tagit flera timmar kör du om krock- och dubblettkontrollen först, eftersom en
   annan session kan ha publicerat under tiden. Committa sedan rundans filer och pusha
   grenen. Workflowen läser planen ur grenen.
2. Kör **"Polering — skriv en runda till Wix"** med `ref` satt till poleringsgrenen,
   `runda` satt till katalogens namn, `plan_sha256` från bygget och läget `torr`.
   Körningen prövar planen utan att skriva något.
3. Kör samma sak med läget `skriv`. Workflowen skriver texten, som också publicerar
   produkten, och därefter bilderna, kategorierna och SKU:n, i den ordningen. Faller en
   produkt i ett steg stannar den efter det steget. Sedan väntar den 90 sekunder, läser tillbaka varje produkt separat och
   stämplar mappningsraden (`needsAiPolish: false`, `draftStatus: published`) för varje
   produkt som är helt verifierad.

**Stannar körningen** har den skrivit alla produkter i det steg som föll, och textsteget har
redan publicerat dem, med importens bilder tills bildsteget körts. Rätta och kör `skriv`
igen direkt; alla steg tål omkörning. Faller bara återläsningen eller stämpeln kör du läget
`stampla`. Kontrollera att körningen slutade `success` och inte `cancelled`: workflowen har
en gemensam kö, och en väntande körning avbryts när en annan session startar sin.

☠️ `ref` är `main` om du inte anger något, och där finns inte planen, så körningen stoppar
innan något skrivs. Flera sessioner kör samma workflow, så känn igen din körning på gren
och commit, inte på var den står i listan.

Ska något rättas efteråt: sök felet i alla rundans filer (`<kort>.html`, `namn.tsv`,
`seo.tsv`, `alt.tsv`) och i syskonens texter, rätta, bygg om planen och kör workflowen
igen. En omkörning lägger till kategorier men tar aldrig bort en felkopplad; det är en
egen åtgärd. Skriv aldrig för hand i Wix. En handbyggd PATCH tappar fält utan att säga
något (variantens `visible`, alt-texter, SKU), och svaret ser ändå lyckat ut.

**Pusha sällan.** Pushar som bara rör `tools/` och `docs/` bygger inte på Vercel
(`ignoreCommand` i `vercel.json`), men en lång rad sådana pushar ger till slut ett bygge
ändå, eftersom Vercels referenspunkt inte flyttas fram. Pusha när planen är klar och när
rundan är dokumenterad, inte efter varje fil.

-----

## 9. Kontrollera live

☠️ **Hämta aldrig en produktsida medan produkten är ett utkast.** Butiken cachar svaret,
som då är en 404, och visar det en god stund efter publiceringen. Därför görs ingen
förhandsvisning före skrivningen.

Efter `skriv`:

```bash
bash ../../polish-gates/hamta-live.sh 130   # väcker ISR, väntar 130 s och hämtar varje sida till live/
python3 ../../polish-gates/livegrind.py      # orddiff mot källfilen, homoglyfer, svep av sida, alt och SEO, flikar, kategori
python3 ../../polish-gates/livekoll.py       # InStock, brödsmula, <title> och meta mot seo.tsv, varje alt-text på sidan
```

- Läs HTTP-koderna som `hamta-live.sh` skriver ut. Koden `000` ger en tom fil som ser ren
  ut, och en enstaka 403 betyder ingenting. Hämta om det som faller innan du drar
  slutsatsen att sidan är trasig.
- `age` ska vara ungefär lika lång som pausen. `?cb=` hjälper inte på produktsidan. Har en
  sida nyss renderats väntar skriptet ut den först, alltså upp till fem minuter extra.
- Hämta från `https://www.fyndplats.se`, inte från adressen utan www. Den svarar med 308,
  och utan `-L` får du en tom sida.
- Sidhuvudet (`<title>` och meta) och brödtexten cachas var för sig och kan skilja sig åt i
  samma svar. Har Wix rätt värde men sidan fel, vänta ut ISR och läs om sidan. Är `age`
  över 300 sekunder och sidan fortfarande fel är det inte cachen; jämför med Wix.
- Slår `livegrind.py` till på något som inte står i dina filer, jämför med en publicerad
  sida som rundan inte rört. Finns det där hör det till butikens ram.
- Öppna till sist en av rundans sidor och läs den som kund. Var avsnitten och bilderna
  hamnar syns bara där.

-----

## 10. Dokumentera

- **`LÄS-MIG.md`** i rundans katalog, kort: vad som publicerades (id, namn, SKU, pris och
  saldo), vad som hölls tillbaka och varför, vad som var oväntat och vad nästa runda bör
  veta. Grindutfallet och läsningen som kund får en rad var, inte en tabell.
- **`tools/polish-gates/FLAGGADE.md`**: en rad per produkt som hoppades över (dubblett,
  slutsåld, laglighet eller fel produkttyp). Filen fylls bara på, inget tas bort.
- PR-beskrivningen uppdateras inför merge, inte efter varje runda.

-----

## Klart-kriterium

Grindarna och live-kontrollen täcker det mesta. Gå igenom listan innan du kör `skriv`.

**Text**

- Namn, slug, titel och meta är på svenska och bär fokussökordet, och namn, slug och titel
  skiljer sig från syskonen. Inget husmärke, inget artikelnummer och inget `Skickas från`.
- Ingen tysk text finns kvar, inte heller i `Färg`-värdet.
- De tre flikrubrikerna står ordagrant, i rätt ordning och som rena `<h2>`. Allt innehåll
  i brödtexten står före den första.
- Skötseltexten är konkret. Vanliga frågor har fyra till åtta verkliga frågor, högst en som
  tabellen redan besvarar, med fråga och svar som två `<p>`.
- `<h2>Produktsäkerhet</h2>` står sist när källan har säkerhetsinformation. Varje siffra
  står i källan, ingen rad är skarpare än källan, och maxlasten är densamma som i
  *Tekniska specifikationer*.
- Svensk sifferstil, och samma tal överallt. `Vikt` står bara där källan anger produktens
  vikt, annars `Fraktvikt`.
- Inget varningsblock, ingen uppgift lagd på leverantören eller tillverkaren, inga
  arbetsord som *rundan* och inga länkar.

**Bilder**

- Plats 1 visar hela varan tydligt. Ingen bild bär text på ett annat språk, ett riktigt
  varumärke, läsbar text på rekvisita eller fel färg. Måttritningen ligger sist.
- Varje alt-text är på svenska, unik och beskriver det som syns.

**Data**

- SKU:n börjar med `FP-`, har högst 40 tecken och är unik. Kategorin är kopplad med förälder,
  smalaste löv och sökordskategorin när en finns, utan att bryta dess text. Priset är orört.
  Saldot är minst 1.

-----

## Wix-läsfällor

Rundan läser Wix själv men skriver aldrig dit direkt. De flesta fällorna nedan ger ett svar
som ser friskt ut men har fel innehåll, inte ett felmeddelande.

- **`wix.request` tar kroppen i `body`.** Lägger du den i `data` försvinner den utan fel,
  och Wix svarar med sin standardsida. Pröva med `limit: 5` innan du mäter något.
- **`products/search`:** filter, sortering och markör ligger inuti `search: { … }`. På
  kroppens översta nivå ignoreras de. `fields` ska däremot ligga på den översta nivån och
  skickas med på **varje** sida. Annars kommer fältet tillbaka tomt.
- **Filter och markör går inte att kombinera.** Sida två ger då `400 INVALID_CURSOR` eller
  `SE-1141`. I `products/search` bär markören inte filtret, så svep katalogen ofiltrerat och
  filtrera i koden. I `inventory-items/query` bär markören filtret, så där skickas sida två
  med bara markören.
- **`products/query`** kräver `{ "query": { … } }`. Annars får du samma 50 rader varje gång.
  Använd `search` för att gå igenom katalogen.
- **Räkna unika id och täckning.** Ett svep är klart när markören är `null`. Antalet unika id
  ska vara lika med antalet lästa rader, och fältet du bygger på ska finnas på varje rad du
  räknar.
- **`PLAIN_DESCRIPTION`** ger HTML-texten. `DESCRIPTION` ger rich content och lämnar
  `plainDescription` tom. Ett fält du inte har begärt ser ut som tom text, inte som ett fel.
  `MEDIA_ITEMS_INFO` behövs för bilderna och `DIRECT_CATEGORIES_INFO` för kategorierna, som
  då bara bär id.
- **`variantsInfo`** finns bara när man läser en produkt i taget, aldrig i sök- eller
  frågesvar.
- **`slug`** tar bara `$eq` och `$in`, med högst tio värden i `products/search`, och
  `$contains` finns inte på `name`. `productId` i `inventory-items/query` tar fler värden
  (synken skickar 50). Ett filter på ett fält som inte går att filtrera på kan svara 200
  med hela katalogen.
- **`slug`** har kommit tillbaka både som sträng och som `{ "name": … }`; läs den på båda
  sätten.
- **Kategorierna för en produkt** läses som workflowen gör: `GET` på produkten med
  `fields=DIRECT_CATEGORIES_INFO`, som bara ger id.
- **`ExecuteWixAPI` har 60 sekunder.** Kör ett långt svep i etapper och skicka markören
  vidare. Det finns ingen fältmask, så filtrera i skriptet, och `fields` skickas som
  upprepade parametrar, inte som en kommalista.
- **Svep katalogen en gång per runda**, med namn, slug, `visible` och `PLAIN_DESCRIPTION`,
  spara resultatet i `orig/` och återanvänd det till familjeräkningen, krocken och
  dubblettskärmen. Två eller tre svep i följd ger `Rate limit exceeded` i en kvart.

-----

## Utanför poleringen

- **Sidor med flera varianter:** äldre AliExpress-sidor och Aosom-sidor där syskon lagts
  in som val. Skrivworkflowen klarar bara sidor med en variant, eftersom SKU-steget och
  återläsningen kräver det. Sådana sidor tas därför aldrig med i en runda. En textändring,
  som färgraden efter en sammanslagning, görs med en PATCH av bara de fält som ändras
  (`plainDescription`, och `seoData` om titeln ändras), med fältmask och med texten ur en
  fil. Läs sedan tillbaka texten och jämför den med filen. Variantobjekt och optioner byggs
  aldrig för hand. Mekaniken står i [`polish/varianter.md`](polish/varianter.md) för
  AliExpress-sidorna och i [`polish/syskon.md`](polish/syskon.md) för sammanslagna sidor.
  Den delade optionen "Färg" finns i två upplagor (`0b32a475-…` och `719645a9-…`), används
  av över hundra produkter och får aldrig döpas om.
- **Fraktvikten på äldre sidor:** 616 texter i 69 rundor före B1 bär fraktvikten som `Vikt`.
  Workflowen **"SEO — städa publicerad produkttext"** byter etiketten där talet är
  fraktvikten, och listar meningarna i löptexten som måste skrivas om för hand.
- **Info-sektioner:** skapa ingen per produkt, eftersom taket är 400. Innehållet står i
  beskrivningen.
- **Katalogsvep** (tomma alt-texter, löv utan förälder, leverantörskoder i publicerad text)
  är återkommande underhåll och ingår inte i rundan. Leverantörskoder städas med workflowen
  **"SEO — städa publicerad produkttext"**.
