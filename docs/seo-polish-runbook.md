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
> behövs, och [`polish/varianter.md`](polish/varianter.md) för produkter med flera varianter.

## Fasta regler

- Butik **Fyndplats**, site ID `e6d27e90-4749-4720-9afe-0bbe91c1b3d3`, **Catalog V3**.
  V1-siten `8c62127f-…` används inte.
- Allt kunden ser skrivs på **svenska**.
- **Rör inte priset.** Prissättningen är Leonards beslut.
- Butiken är headless Next.js på Vercel och uppdateras via ISR (300 s), utan ny deploy.
  `seoData`-taggarna `title` och `meta description` blir sidans `<title>` och
  metabeskrivning. JSON-LD och OpenGraph byggs ur produktfälten.
- ☠️ **Aosoms artikelnummer får aldrig synas någonstans.** Inte i kundtext, spec-tabell,
  alt-text, SKU eller slug, och inte i rundans filer, commits, Actions-loggar eller
  PR-texter. Repot är publikt, och numret leder raka vägen till vårt inköpspris:
  dealproffsen publicerar samma sträng som `sku` och `mpn`. Redigera bort det ur källtexten
  redan när den hämtas (`‹REDIGERAT›`). Döp inte heller om raden: `Modellreferens`,
  `Referens` och `Artikelnr` läcker lika mycket. Skrivplanen vägrar en plan som bär ett
  artikelnummer.
- **Husmärken ska bort.** HOMCOM, Outsunny, PawHut, Aiyaplay, SportNow, Vinsetto, Kleankin,
  Zonekiz, Durhand och Aosom (`gatelib.MARKEN`, `lib/import/sku.ts`) stryks ur namn,
  SEO-titel, meta, slug, sökord och alt-texter. Etablerade märken med eget sökvärde behålls.
  Är du osäker: behåll märket och flagga till Leonard.
- **Ett märke som sitter fysiskt på varan** (tryckt, graverat eller gjutet) hör till varan.
  Bilden behålls och ingenting flaggas *(Leonard 2026-08-06)*. Testet: skulle märket synas
  om du fotade varan själv efter uppackning?
- **Skriv aldrig avsändarland eller lagerland** *(Leonard 2026-08-15)*. Bara
  EU-lager-ribbonen får visa det. Sök på `Skickas från` i slutkollen.
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
`visible: false` och vars namn saknar å, ä och ö. Läs om varje produkt precis innan du
börjar, eftersom en annan session kan ha hunnit före.

**Välj familj efter luckan, inte efter högen.** Räkna utkasten mot de publicerade sidorna
av samma produkttyp. En familj med många publicerade sidor ger krockar och dubbletter,
medan en familj med få ger lediga sökord. Hitta familjen med en delsträng, eftersom ett
ledande adjektiv (`Ergonomischer Kniestuhl`) annars gömmer halva familjen. Räkna den sedan
på huvudordet, alltså namn som börjar med produkttypen (`^Konsolentisch`), så att `Regal`
inte räknas när ordet bara beskriver en egenskap. Läs igenom namnen innan du bestämmer dig.

**Saldo.** Skriv varje produkts saldo i `lager.tsv` (summan av `quantity` ur
`inventory-items/query`). `gate-lager.py` fäller ett saldo på 3 eller lägre, eftersom
butiken drar av en buffert på tre och kunden då ser "Slutsåld" från första dagen. Ett
saldo under 5 är tunt.

### Laglighetsgrinden

Kör den före allt bild- och textarbete. Den gäller bara klasserna nedan.

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
(`<h2>Så används den hemma</h2>`), med samma kärnmening ordagrant på varje sida i gruppen.
Regeln gäller varje bur, även när källan inte nämner den.

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

Har produkten en säkerhetsrelevant gräns (maxlast, ålder) står siffran i spec-tabellen.
Avgör gränsen hur varan får användas skrivs den som ett positivt villkor med egen rubrik,
till exempel *"Från 14 år"* eller *"Maxlast 120 kg"*. Den skrivs aldrig som ett
varningsblock.

### Dubblettskärmen

I vissa familjer finns vart fjärde utkast redan som publicerad sida. Dubbletterna är av tre
sorter:

- **Aosom-varor som vi redan säljer som AliExpress-sidor.** De bär ett AliExpress-id, så
  ingen spärr som jämför id ser dem.
- **Samma vara två gånger i Aosoms feed**, under två artikelnummer och ofta till olika pris.
- **Färgsyskon:** samma vara i flera färger, bland utkasten eller mot en publicerad sida.

Gör två kontroller, i den här ordningen:

1. **Måtten sållar.** Läs produktens totalmått ur `Gesamtabmessungen` eller `Gesamtmaße`.
   Axelbokstaven sitter ofta inne i talet (`218B x 79T x 91H cm`), och `Paketmått` är
   kartongen, alltså fel nyckel. Jämför alla tre talen, med en tolerans på ±1,5 cm, mot
   varje publicerad sida och mellan utkasten. Material- och lastrader stärker en träff.
   Svep hela katalogen och sök brett, eftersom samma vara kan heta `redskapsbod`,
   `redskapsskap`, `förråd` och `skjul`. `https://www.fyndplats.se/sitemap.xml` listar de
   publicerade sidorna utan något Wix-anrop.
2. **Bilderna avgör.** Lägg varje träffs bilder sida vid sida. Är medelavståndet under 1,0
   på 320 × 320 i gråskala (`dubblettgrind.py`) är det samma foto. Ett högre avstånd
   bevisar ingenting, eftersom de två inköpsvägarna fotograferar samma vara var för sig.
   Avgör på konstruktion, detaljer och måttritning.

En dubblett poleras inte och raderas inte. Den publicerade sidan kan vara billigare eller
ha historik, och vilken som ska bort är Leonards beslut. Skriv en rad i `FLAGGADE.md` och
ta nästa. Av färgsyskon poleras ett, och resten flaggas som ett sortimentsbeslut. Ska en
sida säga "finns i N färger" räknar du färgerna i katalogen, inte i kön, eftersom ett
publicerat syskon inte ligger i kön.

### Sökordet och krocken

Välj det svenska ord folk söker på: **huvudord och kvalificerare** för den exakta
produkttypen (`sadelstol`, inte `arbetsstol`). Lås ordet först när du har sett bilderna.
Använd `web_search` bara när produkttypen är oklar eller ordet krockar, och se då vad Jula,
Biltema, Clas Ohlson och liknande butiker kallar varan.

Kontrollera krocken mot hela katalogen innan du låser ordet:

- Slå upp kandidatsluggarna med `$in`. `slug` tar bara `$eq` och `$in`, med högst tio
  värden per `$in`.
- Ett katalogsvep är klart först när markören är `null`. Räkna antalet unika id.
- Ta med en känd publicerad slug som kontroll. Hittar svepet inte den är svepet trasigt.

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

En Aosom-rad har en enda variant och inga variantval.

### Vad källan är värd

Den tyska texten har tre delar, och de är olika mycket värda. Till dem kommer importens
svenska spec-block.

- **`Lieferumfang`** är det som ligger i kartongen. Den raden gäller.
- **`Technische Daten` och `Produktdetails`** ger mått och laster.
- **Titeln, `Beschreibung` och säljpunkterna** är marknadsföring. Titelns kategoriord är en
  hypotes: en "Gaming Stuhl" kan vara en kontorsstol, en "Frühbeet" en odlingslåda utan
  lock och en "Esszimmerstuhl" en bänk. `Lieferumfang` och bild 1 och 2 avgör.
- **Spec-blocket** (`Mått`, `Färg`, `Material`, `Vikt`, `Paketmått`) kommer ur feedens
  kolumner, inte ur den tyska texten, och kan säga emot den:
  - ☠️ **`Vikt` är fraktvikten**, alltså feedkolumnen `Weight (incl. Package)`. Anger den
    tyska texten ingen produktvikt (`Gewicht`) skriver du `Fraktvikt: X kg` i spec-tabellen,
    och du skriver aldrig i löptexten att varan väger X.
  - `Mått` kan ha axlarna i fel ordning. Måttritningen avgör geometrin.
  - `Färg`-värdet står kvar på tyska. Översätt det efter bilden.

**Ett tal som är exakt detsamma som grannfältets är misstänkt**, till exempel en stol vars
djup är exakt bordets eller en vikt som är exakt syskonets. Läs om fältet. Ett tal du inte
kan belägga står inte på sidan.

-----

## 3. Bilderna före texten

`python3 ../../polish-gates/bygg-ark.py` hämtar varje bild i full upplösning och bygger ett
kontaktark per produkt i `ark/`. Titta på arket innan du skriver något. Bilderna visar vad
varan är, hur många delar den har och hur den sitter ihop. Golvlampan `13a53d52` beskrevs
till exempel med två skärmar utifrån källans två mått, men fotot visar en.

Titta på alla bilder. Mätningen som sa att position 1 och 2 alltid är rena gällde tysk
text. Varumärken på rekvisita sitter oftast i miljöbilderna, och i runda B19 bar de flesta
miljöbilder ett.

**Stryk** en bild genom att skriva en rad i `bilder-bort.tsv` (`kort ⇥ position ⇥ skäl`)
när den bär:

- inbränd text på ett annat språk än svenska, oftast tyska eller engelska (`Family-size`, `7 Cups`)
- ett riktigt varumärke, en webbadress eller text på rekvisita (flaskor, böcker, ljus) som
  går att läsa i full upplösning
- leverantörens logotyp, som ofta sitter i det övre vänstra hörnet (`HOMCOM by Aosom`)
- en annan färgvariant än den som säljs

**Behåll** text som sitter fysiskt på varan (knappar, märket på godset), en måttritning som
bara har siffror och enheter, och text som går att läsa först i flerfaldig förstoring.
Hellre två rena bilder än tre där en bär ett varumärke.

**Läs siffrorna i en infografik innan du stryker den.** Ett tal som avgör köpet kan finnas
bara i bilden. Ett exempel är gasolregulatorn på 50 mbar, där svenska tuber kräver 30 mbar.
Sådana fakta ska in i texten.

Tal som du räknar i ett foto, till exempel dörrar, lådor och fack, skriver du i
`foto-tal.txt` (`kort tal skäl`). Annars fäller `gate.py` dem som tal utan källa.

**Färgen på en del av varan** (fälg, ben, beslag, randning) kräver att du förstorar just
den delen minst två gånger. Kontaktarket räcker bara för färgen på hela varan. Räkna upp
varje färgad del.

**Galleriet:** plats 1 är den renaste produktbilden, som blir både huvudbild och
delningsbild. Plats 2 är en miljöbild, därefter kommer detaljer, och måttritningen ligger
sist (`bygg-media.py` lägger den sist). Polerar du syskon samtidigt fördelar du
miljöscenerna så att två sidor inte delar samma foto.

Rundan bearbetar inga bilder, den väljer bland dem som finns. Behövs en bearbetad bild står
metoderna i [`polish/bildmetoder.md`](polish/bildmetoder.md).

**Alt-texterna** (`alt.tsv`: `kort ⇥ position ⇥ text`) beskriver det som syns på just den
bilden, på svenska och olika för varje bild. Beskriv varan, inte rekvisitan: djuret, barnet
eller kaffekoppen i miljöbilden hör inte till produkten. Samma förbjudna ord gäller som i
texten.

-----

## 4. Verifiera påståendena

Det här är det viktigaste steget. Ungefär varannan produkt har minst ett påstående från
leverantören som inte stämmer.

1. **Bilden vinner** över texten om det som syns: färg, form, antal och konstruktion.
   Packbilden är den säkraste källan till vad som ingår.
2. **Källtexten vinner** om det som inte syns: inomhus eller utomhus, justerbarhet,
   bärighet, ytbehandling och vad som ingår. Läs hela källtexten, så att inga egenskaper
   som bara står där faller bort.
3. **Två källor som säger olika:** ta den konservativa. Går de inte att förena utelämnar du
   uppgiften. Skriv aldrig en brasklapp som "leverantören anger X, men …". Rättelsen står i
   löptexten och i tabellen.
4. **Måttritningen avgör geometrin.** Säger en etikett något annat än ritningen, mät
   ritningen. En last i ritningen är text och väger inte tyngre än specen. Skriv den lägsta
   lasten och stryk den källa vars tal inte står på sidan. Oftast är det ritningen, som
   annars ligger kvar i galleriet.
5. **Varje mätvärde och varje mekanikord ska gå att peka på i källan.** Går det inte skriver
   du det allmänna ordet ("metallskenor", inte "kullagrade skenor"). Var inte mer exakt än
   källan ("soft-close-gångjärn", inte "soft-close på alla luckor").
6. **Skriv ingen negation** ("saknar ram") bara för att källan inte nämner saken.
7. **En funktion som titeln lovar** ska ha ett eget mått i specen. Saknas det tar du reda
   på vad totalmåttet består av innan du skriver om funktionen.
8. **Kapacitet ska mätas, inte kopieras.** Ett tält som säljs som "4 Personen" men har 2–4
   sovplatser får måtten, inte siffran.
9. **Bärighet betyder inte hur många som får plats.** Räkna en vuxen som ungefär 80 kg. En
   bänk som tål mindre än 160 kg beskrivs aldrig som en tvåsits, hur bred den än är. Samma
   sak gäller hyllor, stänger och fästen.
10. **Ett dörrmått gäller en dörrhalva.** Räkna gångjärnen på bild 1. Två uppsättningar
    betyder dubbeldörr, och då skriver du `2 × B × H`.
11. **Räkna efter dina egna tal.** Fyra stolar på 42 cm kräver 168 cm, inte 160.
    Superlativ om sortimentet ("smalast", "den enda") kräver en mätning mot hela katalogen
    och en rad i `superlativ.txt`, annars fäller `gate-superlativ.py`.
12. **Upprepa aldrig ett superlativ utan mätvärde**, varken leverantörens eller våra egna.
13. **Översätt inte marknadsord, beskriv förhållandet.** `begehbar` med 58 cm invändigt djup
    är inget förråd man går in i. `passt durch Standardtüren` säger inget om en svensk
    dörröppning, så skriv bredden. `Fenster` kan vara en ventillucka.
14. **Färg:** skriv efter bilden. Säger två färgfält på samma produkt emot varandra
    utelämnar du färgen. Räkna vittnena först: den tyska texten och importens alt-text är två
    vittnen mot en enda kolumn. En färg som skulle bli likadan som ett syskons är i sig ett tecken på att
    fältet är fel.
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
| **Namn** (H1) | `namn.tsv` | Börjar med fokussökordet. Högst 80 tecken, eftersom Wix avvisar fler. Produkttypen är vad varan faktiskt är. |
| **Slug** | `slugs.txt` (`kort slug`) | ASCII, gemener och bindestreck, med fokussökordet. |
| **SEO-titel** | `seo.tsv` | Högst 60 tecken inklusive ` \| Fyndplats`. Får inte vara identisk med namnet, för då visar butiken `{namn} \| Fyndplats` i stället. |
| **Meta** | `seo.tsv` | Högst 155 tecken, med nyttan och sökordet och inga påståenden som inte är verifierade. |

Båda orden i fokussökordet ska stå i namnet, sluggen och titeln. Det som skiljer produkten
från ett syskon ska synas i alla tre.

**Sluggen byts bara på utkast.** Butiken är headless och gör ingen automatisk
omdirigering, så en ändrad slug på en publicerad sida ger en 404. Måste en publicerad slug
ändras, eller en publicerad produkt tas bort, kör du samtidigt workflowen **"Lägg till
301-redirect"** mot den nya sidan eller mot kategorin, aldrig mot startsidan.

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
  själv till `Kontakta oss` och flyttar `Produktsäkerhet` till en egen flik. Skriv
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
  höjd av ritningen, och `gate-axel.py` kontrollerar det. Fraktvikt heter `Fraktvikt`.
- **Vanliga frågor:** fyra till åtta verkliga köpfrågor, om mått, vad som ingår, montering,
  vad som krävs för att varan ska fungera och last. Fråga och svar skrivs som två `<p>`,
  eftersom Wix tar bort `<br>`.
- **Svensk sifferstil:** decimalkomma (`4,5 kg`), `×` med mellanslag (`72 × 57 × 56 cm`),
  tankstreck i intervall (`18–36 månader`) och snedstreck i talserier (`10/20/30 cm`),
  aldrig en kommalista.
- **Inga länkar i produkttexten.** Menyn och karusellen "Liknande produkter" länkar redan
  mellan sidorna.

### Tonen

Leonard, 2026-08-14: *"Vi ska ju försöka sälja produkter, inte försöka få dom att skita i
att köpa."* Och 2026-08-21: *"Du ska inte skrämma kunderna från att köpa, allt behöver man
inte veta, o andra saker som man måste veta kan stå med på ett snyggt sätt."*

- Skriv inget block med rubriken **"Det du bör veta innan du köper"** eller **"Bra att
  veta"**. Förbudet gäller formen, så det hjälper inte att byta rubrik.
- Mot kunden är det **vi** som är leverantören. Skriv aldrig "leverantören anger", "vi har
  inga uppgifter om" eller "vi kan inte lova".
- Be aldrig kunden mäta, väga eller kontrollera om varan duger, och lägg inte till ett
  tvivel om ett mått som redan står i tabellen.
- En gräns som är en del av köpet, som maxlast, förankring i väggen, batterier som inte
  ingår eller att en elektriker ska koppla in varan, skrivs som ett **positivt villkor med
  egen rubrik**, till exempel *"Passar bilar med fabriksmonterad CarPlay"* eller
  *"Batterier: 3 × AA, ingår inte"*. Den skrivs aldrig som en varning.
- En rättslig upplysning (djurbostäder, hundburar) står kvar, med samma ordalydelse på
  varje sida i gruppen.
- Jämför inte med "den här omgången" eller "våra andra" utan att ha mätt hela katalogen.
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

Sist i rundans källfil `{p}.html` (den som blir `plainDescription`), efter *Vanliga frågor*:

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
när källan säger det. Formuleringarna ovan är desamma som i motorns datafil; håll
dig till dem så att katalogen läser likadant.

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

Skriv `FP-` följt av svenska ord som skiljer varan från syskonen, med mått före färg, till
exempel `FP-tvattstallsskap-76cm-svart`. Högst 40 tecken, eftersom Wix avvisar fler
(`gate-sku.py` fäller). Bara gemener, siffror och bindestreck, inget husmärke och ingen tysk
råtext. SKU:n beskriver produkten, inte kategorin.

SKU:n ska vara unik i hela katalogen. `variantsInfo` finns bara när man läser en produkt i
taget, aldrig i sök- eller frågesvar, så jämför med familjens publicerade sidor när du ändå
går igenom dem. Importen gav produkter med samma början på den tyska titeln samma SKU, så
varje produkt i rundan måste få en egen. Rör aldrig `FYND-`- eller `AE-`-SKU:er på andra
produkter.

### Kategori (`kategori.tsv`)

Skriv `kort ⇥ Förälder + Löv + Sökordskategori`, med kategorinamnen exakt som i Wix. Läs
trädet varje runda (`POST /categories/v1/categories/query` med
`treeReference: {"appNamespace": "@wix/stores"}`) och gissa aldrig ur minnet. Koppla
föräldern, det smalaste lövet som passar och den sökordskategori som finns för
produkttypen. Finns inget löv räcker föräldern. Välj aldrig `All Products`, eftersom Wix
lägger till den själv. Workflowen slår upp namnen, och torrkörningen fäller ett namn som
inte finns.

-----

## 6. Läs sidan som kund

Grindarna kontrollerar fält. Det här steget läser texten, och det fångar det som grindarna
släpper igenom: sidor som stämmer i varje fält men ändå läser illa. Läs hela texten
uppifrån som någon som funderar på att köpa:

- Låter något defensivt?
- Upprepas ett mått med ett tvivel?
- Ber vi kunden mäta eller kontrollera något?
- Läser sidan som en kopia av syskonets?
- Finns det en mening som inte hjälper någon att bestämma sig? Stryk den.
- Skulle du själv köpa varan? Om svaret är "kanske, men …", rätta det som "men" handlar om
  i texten.

-----

## 7. Grindar och skrivplan

Kör från rundans katalog. Varje grind ska gå igenom utan fynd. Rätta fynden i filerna,
aldrig i grinden.

```bash
G=../../polish-gates
python3 $G/gate.py              # tal mot källan, tyska rester, husmärken, artikelnummer, fraktland, stavning, homoglyfer, flikar
python3 $G/gate-alt.py          # alt.tsv: samma mönster, och antalet mot bilder.tsv minus bilder-bort.tsv
python3 $G/gate-seo.py          # seo.tsv och namn.tsv: längder, suffix och tal mot källan
python3 $G/gate-sku.py          # sku.tsv: längd, form, dubbletter och att alla produkter har en rad
python3 $G/gate-lager.py        # lager.tsv: slutsålt och tunt
python3 $G/bygg-axelfacit.py && python3 $G/gate-axel.py   # bredd, djup och höjd läses på position, inte på axelbokstav
python3 $G/gate-superlativ.py   # superlativ om sortimentet kräver en rad i superlativ.txt
python3 $G/hasha.py             # facit för återläsningen -> vantat-hash.tsv
python3 $G/bygg-media.py        # bilder.tsv, bilder-bort.tsv och alt.tsv -> nyttolast-media.json
python3 $G/bygg-skrivplan.py    # -> skrivplan.json, och skriver ut plan_sha256
```

Ändrar du en fil efter `hasha.py` kör du `hasha.py` och `bygg-skrivplan.py` igen. Bygget
fäller om `vantat-hash.tsv` inte längre stämmer med texterna.

-----

## 8. Skriv till Wix

1. Committa rundans filer och pusha grenen. Workflowen läser planen ur grenen.
2. Kör **"Polering — skriv en runda till Wix"** med `ref` satt till poleringsgrenen,
   `runda` satt till katalogens namn, `plan_sha256` från bygget och läget `torr`.
   Körningen prövar planen utan att skriva något.
3. Kör samma sak med läget `skriv`. Workflowen skriver texten, som också publicerar
   produkten, och därefter bilderna, kategorierna och SKU:n, i den ordningen. Den stannar
   vid första fel. Sedan väntar den 90 sekunder, läser tillbaka varje produkt separat och
   stämplar mappningsraden (`needsAiPolish: false`, `draftStatus: published`) för varje
   produkt som är helt verifierad.

☠️ `ref` är `main` om du inte anger något, och där finns inte planen. Kontrollen av
`plan_sha256` stoppar då körningen innan något skrivs. Flera sessioner kör samma workflow,
så känn igen din körning på gren och commit, inte på var den står i listan.

Ska något rättas efteråt: rätta i rundans filer, kör grindarna, bygg om planen och kör
workflowen igen. Skriv aldrig för hand i Wix. En handbyggd PATCH tappar fält utan att
säga något (variantens `visible`, alt-texter, SKU), och svaret ser ändå lyckat ut.

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
- `age` ska vara ungefär lika lång som pausen. `?cb=` hjälper inte på produktsidan.
- Hämta från `https://www.fyndplats.se`, inte från adressen utan www. Den svarar med 308,
  och utan `-L` får du en tom sida.
- Sidhuvudet (`<title>` och meta) och brödtexten cachas var för sig och kan skilja sig åt i
  samma svar. Har Wix rätt värde men sidan fel, vänta ut ISR och läs om sidan.

-----

## 10. Dokumentera

- **`LÄS-MIG.md`** i rundans katalog, kort: vad som publicerades (id, namn, SKU, pris och
  saldo), vad som hölls tillbaka och varför, vad som var oväntat och vad nästa runda bör
  veta.
- **`tools/polish-gates/FLAGGADE.md`**: en rad per produkt som hoppades över (dubblett,
  slutsåld, laglighet eller fel produkttyp). Filen fylls bara på, inget tas bort.
- PR-beskrivningen uppdateras inför merge, inte efter varje runda.

-----

## Klart-kriterium

Grindarna och live-kontrollen täcker det mesta. Gå igenom listan innan du kör `skriv`.

**Text**

- Namn, slug, titel och meta är på svenska, bär fokussökordet och skiljer sig från
  syskonen i alla fyra. Inget husmärke, inget artikelnummer och inget `Skickas från`.
- Ingen tysk text finns kvar, inte heller i `Färg`-värdet.
- De tre flikrubrikerna står ordagrant, i rätt ordning och som rena `<h2>`. Allt innehåll
  i brödtexten står före den första.
- Skötseltexten är konkret. Vanliga frågor har fyra till åtta verkliga frågor, med fråga
  och svar som två `<p>`.
- `<h2>Produktsäkerhet</h2>` står sist när källan har säkerhetsinformation. Varje siffra
  står i källan, ingen rad är skarpare än källan, och maxlasten är densamma som i
  *Tekniska specifikationer*.
- Svensk sifferstil. `Vikt` står bara där källan anger produktens vikt, annars `Fraktvikt`.
- Inget varningsblock, inget "leverantören anger" och ingen jämförelse med omgången.

**Bilder**

- Plats 1 visar hela varan tydligt. Ingen bild bär text på ett annat språk, ett riktigt
  varumärke, läsbar text på rekvisita eller fel färg. Måttritningen ligger sist.
- Varje alt-text är på svenska, unik och beskriver det som syns.

**Data**

- SKU:n börjar med `FP-`, har högst 40 tecken och är unik. Kategorin är kopplad med förälder
  och löv. Priset är orört. Saldot ligger över bufferten.

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
  `SE-1141`. Skicka filtret bara på första sidan, eller gå igenom katalogen utan filter och
  filtrera i koden.
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
- **`$in`** tar högst tio värden, `slug` tar bara `$eq` och `$in`, och `$contains` finns
  inte på `name`. Ett filter på ett fält som inte går att filtrera på kan svara 200 med hela
  katalogen.
- **`slug`** är en sträng i sök- och frågesvar men ett objekt `{ "name": … }` när man läser
  en produkt.
- **Kategorierna för en produkt** läses med `POST /categories/v1/categories/list-categories-for-items`
  (utan `bulk/`). Svaret heter `categoriesForItems[].directCategoryIds`, och anropet kräver
  `treeReference`.

-----

## Utanför poleringen

- **Produkter med flera varianter**, i praktiken AliExpress-sidor: mekaniken står i
  [`polish/varianter.md`](polish/varianter.md). Den delade optionen "Färg" (`0b32a475-…`)
  används av över hundra produkter och får aldrig döpas om.
- **Info-sektioner:** skapa ingen per produkt, eftersom taket är 400. Innehållet står i
  beskrivningen.
- **Katalogsvep** (tomma alt-texter, löv utan förälder, leverantörskoder i publicerad text)
  är återkommande underhåll och ingår inte i rundan. Leverantörskoder städas med workflowen
  **"SEO — städa publicerad produkttext"**.
