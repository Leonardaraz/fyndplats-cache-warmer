# Fyndplats – SEO-polera produkter

> **Körbar instruktion för poleringen.** En runda tar ungefär åtta utkast från urval till
> kontrollerad livesida. All skrivning till Wix går via workflowen **"Polering — skriv en
> runda till Wix"**. Ingenting skrivs för hand.
>
> **Kön består av Aosom- och VEVOR-utkast** som ligger som `visible: false`. Aosoms är tyska
> feedrader, VEVOR:s är svensk text från VEVOR:s produktsidor. **VEVOR-utkast poleras i en
> egen chatt** med [`polish/vevor.md`](polish/vevor.md) som startdokument, och Aosoms i en
> annan *(Leonard 2026-10-31)*. Runbooken är gemensam för båda.
> **AliExpress importeras inte längre** (2026-09-27). De AliExpress-sidor som redan ligger
> i butiken finns kvar ett tag, men de poleras inte och får inget produktsäkerhetsavsnitt.
> De spelar ändå roll här: en Aosom-vara kan redan säljas som AliExpress-sida, och då är
> utkastet en dubblett (se [Dubblettskärmen](polish/runbook/01-valj-atta.md#dubblettskärmen)).
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
- Butiken är headless Next.js på Vercel och uppdateras utan ny deploy. Produktsidan cachas i
  sex timmar, men butikens cron `uppdatera-andrade` bygger om en ändrad sida inom fem minuter.
  Räkna med en kvart.
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
  ☠️ **Rutten och `gate-form.py` (i bygget, steg 8) läser formen bredare än de andra
  grindarna:** tre tecken, bindestreck och minst tre
  tecken till, med minst en siffra, i namn, slug, SKU, brödtext, SEO och alt-texter (utom
  mått som `18-36` och `12-24V`). Den fäller alltså vanliga ord: `MP3-format` (N151 fälldes
  på det, 2026-10-14), `12V-motor`, `HP4-design`, och i en slug `bmw-s1000rr` eller
  `amg-glc63s`. Skriv om ordet (`formatet MP3`, `motor på 12 V`) i stället för att leta
  efter en kvittens: en vägrad plan skriver ingenting, men rundan måste byggas om.
  ☠️ **Har en redan publicerad sidas slug eller SKU formen** (`12v-vit`, `amg-glc63s`) går den
  inte att skriva om oförändrad, och grinden rörs inte. Byt till en adress och en SKU utan
  formen (`12-volt`, `glc-63-s`: ingen grupp om tre tecken med en siffra i, följd av ett
  bindestreck och minst tre tecken till), skriv dem i rundans plan och lägg en 301 från den gamla adressen med
  `redirect-add.yml` så snart bytet är skrivet (T21 och T22). Butikens cache för den gamla
  adressen töms inom en timme, och tills dess visar den sidans gamla text.
- **Husmärken ska bort.** HOMCOM, Outsunny, PawHut, Aiyaplay, SportNow, Vinsetto, Kleankin,
  Zonekiz, Durhand och Aosom (`gatelib.MARKEN`, `lib/import/sku.ts`) stryks ur namn,
  SEO-titel, meta, slug, sökord och alt-texter. Etablerade märken med eget sökvärde behålls.
  Är du osäker: behåll märket och flagga till Leonard.
- **Ett märke som sitter fysiskt på varan** (tryckt, graverat, gjutet eller en fastsydd
  etikett) hör till varan. Bilden behålls hel och produkten hålls inte tillbaka för det
  *(Leonard 2026-08-06, bekräftat 2026-09-27: "vi ändrar inget på deras utseende eller
  bild")*. Testet: skulle märket synas om du fotade varan själv efter uppackning?
  Skriv det aldrig i texten. Beslutet gäller leverantörens husmärken. Märkena på Aosoms
  barnfordon och andra fordon (Mercedes-Benz, Lamborghini m.fl.) är licensierade av Aosom
  *(Leonard 2026-10-08)*: sådana varor hålls inte kvar, och märket får stå i namn, text och
  alt-text när det är en del av varan. Andra varumärken och licensfigurer utanför fordonen
  är fortfarande en licensfråga: flagga till Leonard.
- **Skriv aldrig avsändarland eller lagerland** *(Leonard 2026-08-15)*. Bara
  EU-lager-ribbonen får visa det. Sök på `skickas från` utan hänsyn till versaler i
  slutkollen, eftersom `gate.py` bara ser den gemena formen.
- **Wix nås bara via Wix-kopplingen:** `wix.request` i `ExecuteWixAPI`, eller
  `CallWixSiteAPI` när den svarar 403. Det finns ingen nyckel i sessionen, och ett rakt
  anrop mot `www.wixapis.com` svarar 403, vilket ser ut som ett behörighetsfel. Saknas
  Wix-verktygen går ingen runda att köra, och då ber du Leonard slå på kopplingen. Sök
  efter verktygen i stället för att fråga efter kopplingens status, för den kan säga
  `connected` även när inga verktyg är laddade.

## VEVOR-utkast: det som skiljer

Står i [`polish/vevor.md`](polish/vevor.md), VEVOR-chattens startdokument. Läs det före
rundan när utkasten är VEVOR:s. Resten av runbooken gäller båda leverantörerna, utom de
avsnitt som `polish/vevor.md` räknar upp som Aosoms.

## Rundan steg för steg

Allt körs från rundans katalog, `tools/polish-assets/runda-<namn>/`. Grindarna och
byggskripten ligger i `tools/polish-gates/` och anropas därifrån
(`python3 ../../polish-gates/<skript>`). Kopiera dem aldrig in i rundan.

| # | Steg | Filer som skrivs |
|---|---|---|
| 1 | [Välj åtta](polish/runbook/01-valj-atta.md): kön, saldo, laglighet, dubbletter och sökord | `ids.tsv`, `lager.tsv`, `djurbostad.tsv`, `sammanslagna.tsv` |
| 2 | [Hämta källan](polish/runbook/02-hamta-kallan.md) | `bilder.tsv`, `variant.tsv`, `kallor.json` |
| 3 | [Bilderna före texten](polish/runbook/03-bilderna-fore-texten.md) | `ark/`, `bilder-bort.tsv`, `foto-tal.txt`, `alt.tsv` |
| 4 | [Verifiera påståendena](polish/runbook/04-verifiera-pastaendena.md) | — |
| 5 | [Skriv texten](polish/runbook/05-skriv-texten.md) | `<kort>.html`, `namn.tsv`, `slugs.txt`, `seo.tsv`, `sku.tsv`, `kategori.tsv` |
| 6 | [Läs sidan som kund](polish/runbook/06-las-sidan-som-kund.md) | — |
| 7 | [Recensionerna](polish/runbook/07-recensionerna.md) | `recensioner-kalla.json`, `recensioner.json` |
| 8 | [Grindar och skrivplan](polish/runbook/08-grindar-och-skrivplan.md) | `axelfacit.json`, `vantat-hash.tsv`, `nyttolast-media.json`, `skrivplan.json`, `grind-undantag.txt`, `superlativ.txt`, `rad-tal.txt` |
| 9 | [Skriv till Wix](polish/runbook/09-skriv-till-wix.md) | — |
| 10 | [Kontrollera live](polish/runbook/10-kontrollera-live.md) | `live/` |
| 11 | [Dokumentera](polish/runbook/11-dokumentera.md) | rader i `FLAGGADE.md` |

`kort` är produkt-id:ts första åtta tecken. `ark/`, `orig/` och `live/` är hämtad data och
committas inte. Kommandon med `../../polish-gates/` körs från rundans katalog; de som skrivs
`tools/polish-gates/…` körs från repots rot.

Varje steg står i en egen fil i `polish/runbook/`, och länkarna i tabellen pekar
dit. Läs stegets fil helt när du kommer till steget, innan du gör något i det.
Gör stegen i ordning och hoppa inte över något. *Klart-kriterium*,
*Wix-läsfällor* och *Utanför poleringen* står kvar nedan i den här filen.
Fördjupningarna i `polish/` läser du när ett steg hänvisar till dem.

-----

## Klart-kriterium

Grindarna och live-kontrollen täcker det mesta. Gå igenom listan före `skriv` i steg 9;
punkterna under *Efter skriv* kontrollerar du efteråt.

**Urval**

- Varje produkt har saldo minst 1 (`lager.tsv`), har klarat laglighetsgrinden och
  dubblettskärmen, och prisgrinden i mappningsraden säger inte FALLER, SLUTSALD eller LÅST
  PRIS utan att du vet varför. För VEVOR: ingen möjlig medicinteknik.
- Det som hoppades över står i `FLAGGADE.md`.

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

- Minst fem bilder, eller en rad i `FLAGGADE.md` om det inte gick.
- Plats 1 visar hela varan tydligt. Ingen bild bär inbränd text på ett annat språk,
  leverantörens logotyp eller fel färg. Text på rekvisitan i en miljöbild är okej, och
  VEVOR-loggan på varan får stå. Måttritningen ligger sist.
- Varje alt-text är på svenska, unik och beskriver det som syns.

**Recensioner**

- Varje väntande recension på rundans produkter har ett beslut i `recensioner.json`, och
  `torr` i steg 7 gick igenom. På en VEVOR-produkt gäller det recensionerna om produktens
  egna artiklar.

**Data**

- SKU:n börjar med `FP-`, har högst 40 tecken och är unik. Kategorin är kopplad med förälder,
  smalaste löv och sökordskategorin när en finns, utan att bryta dess text. Priset är orört.
  Saldot är minst 1.

**Efter skriv**

- Steg 9:s `skriv` slutade `success`, med alla produkter verifierade och stämplade, och med
  0 fel och 0 avvikelser för recensionerna.
- Live-kontrollen i steg 10 är ren, och de översatta recensionerna syns på sidorna.

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
  in som val. En sammanslagen Aosom-sida skrivs sedan 2026-09-30 med skrivworkflowen och
  `sammanslagna.tsv` (se [Syskon blir val på sidan](polish/runbook/01-valj-atta.md#syskon-blir-val-på-sidan)). För de
  äldre AliExpress-sidorna gäller [`polish/varianter.md`](polish/varianter.md).
  Variantobjekt och optioner byggs aldrig för hand.
  Den delade optionen "Färg" finns i två upplagor (`0b32a475-…` och `719645a9-…`), används
  av över hundra produkter och får aldrig döpas om.
- **Fraktvikten på äldre sidor:** 616 texter i 69 rundor före B1 bär fraktvikten som `Vikt`.
  Workflowen **"SEO — städa publicerad produkttext"** byter etiketten där talet är
  fraktvikten, och listar meningarna i löptexten som måste skrivas om för hand.
- **Info-sektioner:** skapa ingen per produkt, eftersom taket är 400. Innehållet står i
  beskrivningen.
- **Städrunda på publicerade sidor** (`tools/polish-assets/runda-stadning-*`, 2026-09-27):
  högst 20 sidor per runda, och `fore/` är ögonblicksbilden som rättelserna görs mot.
  `python3 ../../polish-gates/diffgrind.py` kör grindkedjan på `fore/` och på filerna och
  fäller bara på nya fynd och på fynd i målklasserna. Äldre avvikelser som flikrubriker eller
  fraktvikt stoppar alltså inte en städning som inte rör dem, och `grind-undantag.txt` räknar
  upp dem. Produkter med flera varianter skrivs med `sammanslagna.tsv` (sedan 2026-09-30).
  Sidor vars oförändrade slug fälls av skrivplanens formkontroll (`212-manchester`,
  `med-100`) går inte att skriva med workflowen: byt adress och lägg en omdirigering.
- **Katalogsvep** (tomma alt-texter, löv utan förälder, leverantörskoder i publicerad text)
  är återkommande underhåll och ingår inte i rundan. Leverantörskoder städas med workflowen
  **"SEO — städa publicerad produkttext"**.
