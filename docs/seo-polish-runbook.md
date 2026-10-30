# Fyndplats – SEO-polera produkter

> **Körbar instruktion för poleringen.** En runda tar ungefär åtta utkast från urval till
> kontrollerad livesida. All skrivning till Wix går via workflowen **"Polering — skriv en
> runda till Wix"**. Ingenting skrivs för hand.
>
> **Kön består av Aosom- och VEVOR-utkast** som ligger som `visible: false`. Aosoms är tyska
> feedrader, VEVOR:s är svensk text från VEVOR:s produktsidor (se
> [VEVOR-utkast](#vevor-utkast-det-som-skiljer)).
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

VEVOR:s sortiment importeras sedan 2026-10-29 som osynliga utkast med leverantören `vevor`
på mappningen. Rundan går som för Aosom, med de här skillnaderna.

**Källan är svensk.** Utkastets text är VEVOR:s egen svenska från deras produktsida, utan
reklamblocken (importen tar bort dem). Fliken *Tekniska specifikationer* kommer ur sidans
specifikationstabell. Texten är maskinöversatt och har ofta fel ord och enheter. Läs den som
källa och skriv om den helt, med samma regler för påståenden och siffror som för en Aosom-sida.
På en familj (flera varianter) visar varje rad i fliken som skiljer sig varje varians värde.

**Välj inte de här utkasten:**

- **Utkast utan fliken *Tekniska specifikationer*.** Fliken läggs in av **"VEVOR —
  specifikationen på utkast som saknar den"** när läsaren har läst om sidorna.
- **Gränsfallen i familjeregelns plan** (**"VEVOR — familjeregeln på befintliga utkast"**,
  läget `plan`), tills Leonard har avgjort dem. Ett gränsfall som delas senare raderas, och då
  försvinner poleringen.
- **`vevorGranskning.medicinteknik: true` i mappningsraden** (läsningen i *2. Hämta
  källan*). Flagga utkastet till Leonard.
- **Saldo 0 i `lager.tsv`.** Prisgrindens SLUTSALD bygger på synkens stämpel, och
  VEVOR-synken är avstängd tills poleringen börjar *(Leonard 2026-10-30: "Vi kan sätta på
  den när vi börjar polera")*. Slå på den med **"VEVOR — synken"** (`status`, sedan `pa`)
  före första VEVOR-rundan, så att lager och pris följer VEVOR.

**Märket.** Skrivsteget sätter märket VEVOR i Wix. Skriv det inte i namnet eller SEO-titeln
*(Leonard 2026-10-28)*.

**Artikelnumret.** VEVOR:s nummer har 19 eller 22 tecken, versaler och siffror i ett. Det får
aldrig synas, av samma skäl som Aosoms. Sedan 2026-10-30 fäller `gatelib.ARTNR` och
skrivplanen den formen. De nummer som bär bindestreck eller punkt fångas inte: leta efter dem
med ögonen.

**Bilderna.** Importen tog sex bilder enligt Leonards regel (`lib/vevor/bilder.ts`). Står
`vevorGranskning.bildgranskning` på `true` var mönstret ovanligt, och då granskar du varje
bild extra noga. Blir det färre än fem kvar efter strykningen beskär du enligt undantaget i
*3. Bilderna före texten*. Räcker inte det flaggar du produkten i `FLAGGADE.md`: det finns
inget verktyg som hämtar VEVOR:s övriga bilder. En familj som importerades före 2026-10-30
kan ha syskonens bilder blandade: kör **"VEVOR — rätta familjernas bilder"** (`plan`) först.

- VEVOR-loggan på varan får stå *(Leonard 2026-10-28)*.
- Bilder med säljtext på engelska eller tyska stryks, som Aosoms tyska *(Leonard 2026-10-30)*.
- Aosom-verktygen för bilder (bildkandidater, färgtillägg och miljöbild) läser Aosoms flöde
  och fungerar inte för VEVOR.

**Varianter.** En familj är en sida med en VEVOR-artikel per variant. Ge den en rad i
`sammanslagna.tsv`, som en sammanslagen Aosom-sida (se *En sammanslagen sida skrivs om med
`sammanslagna.tsv`* nedan). SKU-steget hoppas då över, och varje variant behåller sin SKU.

**Leksaker.** Beslutet om EN 71 gäller bara Aosom. En VEVOR-leksak vars källa inte nämner
någon standard flaggas.

**Produktsäkerhet.** Tillverkaren och ansvarig i EU kommer från motorn (VEVOR:s standardrad,
Leonards beslut 2026-10-29). Säkerhetsavsnittet skriver du som vanligt, ur källans text.
VEVOR-varor har ingen förhandsöversättning, så utan ditt avsnitt har fliken ingen
säkerhetsinformation.

**Recensionerna.** Steg 7 tar bara med recensioner om produktens egna artiklar. De andra
räknas och lämnas till VEVOR-verktyget.

**Priset.** Prisgrinden gäller VEVOR-rader sedan 2026-10-30: importen satte regelpriset, och
VEVOR-synken skriver det varje timme när den är påslagen. Säger grinden *PRISGRINDEN FALLER*
är det drift, och då rör du inte priset.

**EU-lager.** Utkasten saknar märkningen "EU-lager", eftersom VEVOR:s sida inte säger
vilket land lagret ligger i. Märkningen avgörs vid publiceringen och är inte avgjord än:
publicera utan den.

**Frakt och retur** *(Leonard 2026-10-30)*. Frakten kontrolleras inte före publiceringen, och
priset räknar med att VEVOR tar 0 kr i frakt. Butiken har ingen returadress för VEVOR, så en
kund som returnerar får adressen per mejl.

## Rundan steg för steg

Allt körs från rundans katalog, `tools/polish-assets/runda-<namn>/`. Grindarna och
byggskripten ligger i `tools/polish-gates/` och anropas därifrån
(`python3 ../../polish-gates/<skript>`). Kopiera dem aldrig in i rundan.

| # | Steg | Filer som skrivs |
|---|---|---|
| 1 | [Välj åtta](#1-välj-åtta): kön, saldo, laglighet, dubbletter och sökord | `ids.tsv`, `lager.tsv`, `djurbostad.tsv`, `sammanslagna.tsv` |
| 2 | [Hämta källan](#2-hämta-källan) | `bilder.tsv`, `variant.tsv`, `kallor.json` |
| 3 | [Bilderna före texten](#3-bilderna-före-texten) | `ark/`, `bilder-bort.tsv`, `foto-tal.txt`, `alt.tsv` |
| 4 | [Verifiera påståendena](#4-verifiera-påståendena) | — |
| 5 | [Skriv texten](#5-skriv-texten) | `<kort>.html`, `namn.tsv`, `slugs.txt`, `seo.tsv`, `sku.tsv`, `kategori.tsv` |
| 6 | [Läs sidan som kund](#6-läs-sidan-som-kund) | — |
| 7 | [Recensionerna](#7-recensionerna) | `recensioner-kalla.json`, `recensioner.json` |
| 8 | [Grindar och skrivplan](#8-grindar-och-skrivplan) | `axelfacit.json`, `vantat-hash.tsv`, `nyttolast-media.json`, `skrivplan.json`, `grind-undantag.txt`, `superlativ.txt`, `rad-tal.txt` |
| 9 | [Skriv till Wix](#9-skriv-till-wix) | — |
| 10 | [Kontrollera live](#10-kontrollera-live) | `live/` |
| 11 | [Dokumentera](#11-dokumentera) | rader i `FLAGGADE.md` |

`kort` är produkt-id:ts första åtta tecken. `ark/`, `orig/` och `live/` är hämtad data och
committas inte. Kommandon med `../../polish-gates/` körs från rundans katalog; de som skrivs
`tools/polish-gates/…` körs från repots rot.

-----

## 1. Välj åtta

**Kön ljuger.** `needsAiPolish` nollställs inte alltid. Ta bara produkter som är
`visible: false`. Ett Aosom-utkast har ett tyskt namn, så ett namn med å är redan polerat;
ett tyskt namn kan ha ä, ö och ü (`Bücherregal`). Ett VEVOR-utkast har ett svenskt namn från
början och känns i stället igen på leverantören `vevor` och `needsAiPolish: true` i
mappningsraden. Läs om varje produkt precis innan du börjar, eftersom en annan session kan
ha hunnit före. Läs `tools/polish-gates/FLAGGADE.md` först och välj ingen produkt som står
där.

**Välj i den ordning som säljer.** Först det som säljer de närmaste veckorna (på hösten jul
och inomhus, inte trädgård), sedan familjer som fyller en sökordskategori. Jämför inte med
dealproffsen eller någon annan butik (Leonard 2026-10-21). En arbetsdelning mellan sessioner,
till exempel att var och en tar sin ände av kön, går före.

Steg 1–3 går omlott: laglighets- och dubblettskärmen behöver källtexten och bilderna, så hämta
dem för kandidaterna innan du bestämmer dig.

**Välj familj efter luckan, inte efter högen.** Räkna utkasten mot de publicerade sidorna
av samma produkttyp: många publicerade sidor ger krockar och dubbletter, få ger lediga
sökord. Hitta Aosom-utkasten med en delsträng på det tyska ordet (VEVOR-utkasten på det
svenska), eftersom ett ledande adjektiv
(`Ergonomischer Kniestuhl`) annars gömmer halva familjen, och läs namnen, så att `Regal` inte
räknas där ordet bara beskriver en egenskap. Räkna de publicerade sidorna på det svenska ord
handeln använder (`studsmatta`, inte `Trampolin`); ett tyskt mönster mot svenska namn ger
alltid noll. Räkna distinkta produkter, så att färgsyskon och utkast med samma totalmått
räknas en gång, och undvik en familj där en annan session nyss har publicerat.

**Saldo.** Skriv varje produkts saldo i `lager.tsv` (summan av `quantity` ur
`inventory-items/query`) och kör `gate-lager.py` redan här. Saldot i Wix är leverantörens
saldo minus det vi sålt som inte syns hos leverantören än (synkens buffert är 0 sedan
2026-10-06), så 0 betyder slutsåld och 1–4 är tunt men köpbart. Grinden fäller 0
och varnar under 5.

### Laglighetsgrinden

Kör den innan du skriver något; husdjurens mått och normer syns ofta först på bilderna.
Den gäller bara klasserna nedan.

**Djurbostäder** (Jordbruksverkets SJVFS 2019:15, L80, bilaga 1:1–1:4; terrarier och sköldpaddshus står i bilaga 1:5–1:7, se *Terrarier och sköldpaddshus* nedan). Minimimåtten är
bindande i Sverige, och många burar är för små. Måtten nedan är lästa ur föreskriften i
Jordbruksverkets egen PDF 2026-10-21, inte ur minnet. Den tidigare tabellen i det här avsnittet
saknade kortaste sida för kaniner och bara hade ett mått för fåglar, och den angav ett
hamsterhjul på 28 cm som inte finns i föreskriften. Utkastet till nya regler (2025) drogs
tillbaka och ersätts tidigast 2029.

| Djur | Golvyta | Kortaste sida | Höjd |
|---|---|---|---|
| Kanin ≤ 2 kg | 0,5 m² (0,3 per djur i grupp) | 0,5 m | 0,5 m |
| Kanin 2–3,5 kg | **0,7 m²** (0,35) | 0,6 m | 0,6 m |
| Kanin 3,5–4,5 kg | 0,8 m² (0,40) | 0,7 m | 0,8 m |
| Kanin 4,5–6 kg | 0,9 m² (0,45) | 0,7 m | 0,8 m |
| Kanin > 6 kg | 1,0 m² (0,5) | 0,8 m | 0,9 m |
| Marsvin | 0,3 m² (0,15) | 0,4 m | 0,25 m |
| Guldhamster | 0,12 m² | 0,25 m | 0,2 m |
| Dvärghamster | 0,09 m² (0,045) | 0,2 m | 0,2 m |
| Gerbil | 0,12 m² (0,06) | 0,25 m | 0,2 m |
| Husmus | 0,09 m² (0,018) | 0,2 m | 0,2 m |
| Brun råtta | 0,18 m² (0,06) | 0,3 m | 0,3 m |
| Degu | 0,3 m² (0,15) | 0,4 m | 0,4 m |
| Chinchilla | 0,5 m² (0,25) | 0,5 m | 1,0 m |
| Iller (tamiller) | 5 m² (1) | 1 m | 1 m |

Sällskapsfåglar har tre mått, och bredden en fjärde regel: *"Utrymmets bredd ska vara minst 2
gånger fågelns längd, dock minst 45 cm."*

| Fågelns längd | Golvyta | Längsta sida | Höjd | Exempel ur föreskriften |
|---|---|---|---|---|
| upp till 20 cm | 0,31 m² | 0,7 m | 0,6 m | sebrafink, kanariefågel, undulat, agapornis |
| 21–25 cm | 0,45 m² | 0,9 m | 0,6 m | diamantduva |
| 26–35 cm | 0,84 m² | 1,2 m | 0,8 m | nymfkakadua, skrattduva |
| 36–45 cm | 1,44 m² | 1,6 m | 1,0 m | |

Utgå från kaninklassen 2–3,5 kg när leverantören inte anger vikten, och från ≤ 2 kg när hen
skriver *Zwergkaninchen*. Tyska widderkaniner väger 4–6 kg. Fem regler som formar texten:

- ☠️ **Hyllor och våningar räknas inte** (8 kap. 21 §: hyllans yta ska inte adderas till
  burytan), och **höjden mäts per delyta**. En löpgång på 36 cm under ett hus på 54 cm är 36
  cm hög för kaninen, och ett stall på 45 cm djup klarar aldrig 0,5 m i kortaste sida. Det är
  de två reglerna som fäller de flesta kaninstall. Räkna på markplanets **innermått**, inte på
  leverantörens totalmått.
- Gnagare utom guldhamstrar ska hållas i par eller grupp (8 kap. 1 §), guldhamstrar ensamma.
  Marsvin och dvärghamstrar skrivs därför som ett par, och guldhamstern som ensam.
- Kaniner och gnagare får inte hållas på nätgolv, utom i betesburar (8 kap. 8 §). Utomhusburar
  ska vara upphöjda från marken på vintern (9 §).
- Kaniner ska ha en hylla att sitta på och under (21 §).
- ☠️ **Hönor och ankor ingår inte i L80** (1 kap. 1 §: inhemska hönsfåglar och andfåglar).
  SJVFS 2019:23 anger mått för värphöns i äggproduktion men inget som går att räkna med för
  en hobbyflock. Skriv därför ingen siffra för antal höns: ange golvytan inomhus och
  riktmärket högst 7 höns per m² tillgänglig golvyta (kortaste sida 0,3 m, fri höjd 0,45 m,
  redet oräknat). Leverantörens "3–4 höns" utlovas inte. Ankor och katter kräver en
  artbedömning som källtexten inte ger och hålls tills en människa har sett bilderna. Sköldpaddor,
  ormar och ödlor bedöms mot bilaga 1:5–1:7 (se nedan).
- **Texterna för de fyra vanligaste fallen** (N276–N282, T76–T77):
  - **Rastgård** (en hage utan sovhus eller värpbo). Egen rubrik, *Rastgård utan sovhus*, med
    meningen *"Hagen är en rastgård och har inget sovhus eller värpbo."* Den ersätter aldrig en
    bostad, och texten nämner bara de arter källan och L80 räknar (kaniner, marsvin,
    dvärgkaniner). Källans påståenden om rovdjur (`Raubtiere`, `Marder`) skrivs aldrig.
  - **Hönsgård eller hönshus.** Ange golvytan och riktmärket, aldrig ett antal. FAQ:n
    *Hur många höns får plats?* svarar med riktmärket och husets golvyta. En gåbar gård utan hus
    heter rastgård, och hönshuset *ingår inte*.
  - **Fåglar.** Par eller grupp (6 kap. 1 §), minst två sittpinnar (10 §) och ett utrymme över
    noll grader (16 §). Sidan anger fågelstorleken (`upp till 25 cm`) och att buren inte passar
    större papegojor. En bild med en ara i en bur som inte klarar arten stryks. Har buren två
    fack som är lägre än 0,6 m var för sig ska texten säga att den används som en enda bur med
    skiljeväggen ur.
  - **Valpningslåda och valpgrind.** Lådan ersätter inte tikens utrymme (SJVFS 2020:8, 10 kap.:
    tik med valpar över tre veckor kräver 2, 3 respektive 4 m² beroende på tikens mankhöjd), och
    en valpgrind är en tillfällig vistelse (2 kap. 1 §).

**Kör grinden innan något skrivs:** `python3 tools/polish-gates/djurbostad.py <katalog>` mot
en `djurbostad.tsv` (formatet står i skriptets huvud). Den räknar om varje bostad ur
innermåtten och fäller en rad vars beslut skiljer sig från måtten. **PASS** polerar du bara
för de arter grinden listar, och texten namnger inga andra. **FAIL** pensioneras
(`needsAiPolish: false`, `draftStatus: "rejected"`) med orsaken i filen. **HOLD** rörs inte tills
innermåtten är mätta på bilderna. Ligger buren under gränsen ska den inte poleras. Flagga den
med den rättsliga orsaken. Den första skärmen, över 108 dolda utkast, ligger i
`tools/polish-assets/djurbostader-skarm-2026-10-21/`: 57 PASS, 32 HOLD och 19 FAIL. Varje PASS
med saldo är polerad i N276–N282 och T77, alla FAIL är pensionerade och alla HOLD är dolda
(läst ur Wix 2026-10-21). N292 mätte fem HOLD på bilderna: två blev PASS (polerade) och tre FAIL
(pensionerade), så skärmen står på 59 PASS, 27 HOLD och 22 FAIL. N293 genomlästes de tio sköldpadds-,
reptil- och terrarieutkasten mot bilaga 1:5–1:7: nio blev PASS (fem sidor) och ett FAIL, så skärmen står på
68 PASS, 17 HOLD och 23 FAIL. Höjden mäts med skalan i måttbilden (totalhöjden eller en människosiluett),
inte med källans fönstermått, och en yta i m² ur en källa räknas om ur de mått den bygger på.

**Terrarier och sköldpaddshus** (SJVFS 2019:15, bilaga 1:5 ormar, 1:6 ödlor, 1:7 sköldpaddor, 1:9
groddjur; läst ur föreskriften 2026-10-21 och använd i N293). Varje rad är längdklassen i cm och
minsta golvyta (m²) / minsta höjd (m) för **ett** djur. Skriptet `tools/polish-gates/kap.py` räknar
vilka klasser ett utrymme klarar, med tabellerna nedan som kod.

- Marklevande ormar: upp till 30 0,03/0,1 · 31–40 0,04/0,12 · 41–50 0,06/0,15 · 51–75 0,12/0,2 ·
  76–100 0,25/0,28 · 101–125 0,43/0,35 · 126–150 0,63/0,45 · 151–200 1,0/0,5 · 201–300 2,15/0,7.
- Trädlevande ormar: upp till 35 0,03/0,17 · 36–40 0,04/0,2 · 41–50 0,06/0,25 · 51–75 0,12/0,4 ·
  76–100 0,25/0,5 · 101–125 0,4/0,65 · 126–150 0,55/0,75 · 151–175 0,75/0,85 · över 175 1,0/1,0.
- Marklevande ödlor: upp till 10 0,06/0,2 · 10–15 0,09/0,2 · 16–20 0,16/0,3 · 21–30 0,36/0,3 ·
  31–40 0,64/0,4 · 41–50 0,9/0,5 · 51–75 1,8/0,6.
- Trädlevande och klipplevande ödlor: upp till 15 0,06/0,25 · 16–20 0,12/0,35 · 21–30 0,25/0,5 ·
  31–40 0,5/0,7 · 41–50 0,81/0,9 · 51–75 1,5/1,2.
- Land- och sumpsköldpaddor (yta per djur i grupp inom parentes): upp till 10 0,12/0,2 (0,04) ·
  11–15 0,3/0,25 (0,1) · 16–20 0,5/0,3 (0,16) · 21–30 1,1/0,4 (0,36) · 31–40 2,0/0,5 (0,66) ·
  41–50 4,0/0,6 (1,33) · över 50 8,0/0,8 (2,6). Vattensköldpaddor har egna rader för vattenyta och
  vattendjup (skal 11–15 cm: 0,35 m² vatten och 0,2 m djup).

Ormar och ödlor mäts från nosspetsen till svansspetsen, sköldpaddor rakt från främre till bakre
skalkant. Grupphållning räknas som yta per djur, och totalen får aldrig understiga raden för ett djur.

- ☠️ **Höjden mäts per delyta.** Boxen med lutande tak (20 cm fram, 50 cm bak) räknas bara där höjden
  räcker: ungefär 0,4 av 0,58 m² når 25 cm, så den räcker till skal upp till 15 cm, inte 20 cm.
  Två våningar räknas inte ihop: den nedre delens höjd avgör.
- ☠️ **Källans m² kan vara ytterytan** (boxens 0,23 och 0,43 m² är utvändiga mått med väggar).
  Räkna ur de invändiga måtten, och skriv *ungefär* när de är uppskattade.
- **Saknas invändiga mått** (terrarier som bara anger yttermått) räknas golvytan med 2–3 cm per
  vägg och höjden med några centimeter mindre än den utvändiga. Bara klasser som klarar
  marginalen får stå i texten.
- **En publicerad sida rättas med riktade ersättningar i sin egen text** (T82 skrevs efter den regeln, med Leonards ja: bilagehänvisning, en tabellrad och en artlista på fyra sidor), inte med en omskrivning. Räkna om tabellen med `kap.py` ur sidans invändiga mått, och ta bort bilder med djur som är större än klassen. En rättelse av en publicerad sida utanför poleringskön skrivs först efter Leonards ja.
- **Texten namnger klasser, inte arter.** *Marklevande ormar upp till 125 cm*, *trädlevande
  ödlor upp till 20 cm*, och en hänvisning till bilaga 2:1 och 2:2 för artens klass. Citera
  **aldrig bilaga 1:4** för reptiler: den gäller gnagare. Namnge aldrig en art vars storlek ligger
  över klassen (en vuxen leopardgecko på 21–30 cm kräver 0,36 m²).
- **Sköldpaddor** ska ha vatten att vada i (10 kap. 6 §), skydd (5 §) och grävbart bottenmaterial om
  arten gräver (4 §), och uppvärmningsplatsen får inte överstiga 50 °C (13 §). En utomhusbox direkt
  på marken ska enligt de allmänna råden ha ett nedgrävt nät under sig (4 kap. 5 §), och
  utomhus ska djuret ha skydd mot värme, nederbörd, blåst och kyla (4 kap. 18 §). Ormar och ödlor
  ska ha gömställen och ett bottenmaterial som passar arten (9 kap. 6–7 §§).
- **Bilder med djur** som är större än klassen sidan nämner stryks (en orm på en meter i ett
  terrarium på 50 cm, en kameleont i ett terrarium på 45 cm). Det är ett löfte om vad som får plats.
- **FAIL** när ingen klass klarar rörelseytans höjd (ett sköldpaddshus med aktivitetsytan 16,5 cm
  hög klarar inte ens 20 cm för skal upp till 10 cm).

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

- **Leksaker och barnfordon:** åldersgränsen ska stå i texten, och EN 71 skrivs som
  `Uppfyller EN 71.` Leonard har beslutat att allt från Aosom uppfyller EN 71 *(2026-10-08:
  Aosom är ett stort europeiskt företag)*, så en leksak eller ett barnfordon från Aosom hålls
  inte kvar för att källtexten saknar certifieringen. Skriv ingen provningsstandard utöver
  EN 71, inget certifikatnummer och inget leverantörsnamn. Beslutet gäller varor från Aosom;
  en leksak från en annan leverantör flaggas som förut när certifieringen saknas.
  `gate.py` fäller `Uppfyller EN 71.` när källtexten inte nämner normen (`EN-NORM UTAN KÄLLA`
  och `SIFFRA UTAN KÄLLA '71'`). Kvittera det i `grind-undantag.txt` med raden
  `gate.py EN 71 antas uppfyllt för allt från Aosom (Leonards beslut 2026-10-08), källtexten nämner ingen standard`.
  ☠️ Kvittensen släpper bara igenom de två EN 71-fynden. Varje annat fynd i `gate.py` fäller
  bygget som vanligt (sedan 2026-10-14): innan dess kvitterade raden hela skriptet, och
  `Polypropylen` (tyska och danska, svenska är polypropen) publicerades i N144b.
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

Alla färger publiceras, och olika priser är inget hinder: varje färg behåller sitt pris
(Leonard 2026-09-27). En träff raderas aldrig för hand. Ett pensionerat utkast raderas
tidigast fjorton dygn senare av ett eget verktyg (CLAUDE.md, *Pensionerade utkast raderas
efter fjorton dygn*). Så gör du med en träff:

| träffen är | så gör du |
|---|---|
| samma vara som en publicerad **AliExpress-sida** | Mappa om den publicerade sidan till Aosom (Leonards regel 2026-09-03): **"Dubbletter — mappa om en produkt till Aosom"**, först `plan` och sedan `byt`, med den publicerade sidan som `wix_product_id`, utkastet som `duplicate_wix_product_id` och `sku` tomt. Kundpriset rörs inte. Stoppar marginalhindret flaggar du i stället. |
| samma vara i samma färg och mått som en publicerad **Aosom-sida** | Pensionera utkastet (`draftStatus: rejected`, `needsAiPolish: false`) med **"Polering — läs och stämpla mappningsraden"**. |
| ett **färg- eller storlekssyskon** till en publicerad Aosom-sida | Lägg utkastet som ett val på sidan, se [Syskon blir val på sidan](#syskon-blir-val-på-sidan). |
| syskon **bara bland utkasten** | Polera ett av dem, helst det med flest rena bilder och saldo, och skriv namn, slug och titel utan färg och mått. Publicera det och lägg sedan de andra som val på den sidan. |
| ett syskon till en publicerad **AliExpress-sida** | Finns sidans egen färg som Aosom-utkast mappar du om sidan (första raden) och lägger sedan syskonet som val. Finns den i feeden men inte som utkast hämtar du den först med **"Aosom — importera en sidas färg- och storlekssyskon"** (sida = syskonutkastet). Finns den inte alls polerar du syskonet som en egen sida, med färgen i namn, slug och titel. Verktyget kräver en Aosom-sida, och alla färger ska säljas. |

**En AliExpress-sida med flera varianter** vägras av ommappningen (`flera_varianter`), om
du inte anger `behall_variant`: Wix-variant-id:t för den färg som finns som Aosom-utkast. Då
tas de andra varianterna bort i Wix och i mappningen före bytet (Leonard 2026-09-28). Sidan
får inga val kvar, men bilderna och texten om de borttagna färgerna står kvar. Slå därför
ihop sidan med Aosom-sidan i samma familj (publicerad givare, `omdirigera=ja`), eller skriv
om den med en runda. ☠️ Det gäller också storlekar: en sida med två storlekar som bara har en
hos Aosom behåller texten om båda, måttbilden för den andra, ett specifikationskort med båda
måtten och en SKU som liknar ett artikelnummer (T76, hönsgården `9158341c`). Skriv om sidan
med en runda mot den nya artikelns tyska text (inte sidans gamla), stryk måttbilden och
eventuella äldre Fyndplats-kort för den borttagna storleken, och byt SKU:n. Verktyget vägrar en sida med obehandlade ordrar (`oppna_ordrar`). Sök
först i feeden (**"Aosom — sök i feeden"**) efter de färger som ska bort: finns en av dem hos
Aosom men inte som utkast, kommer den med importen och läggs då som val.

Skriv en rad i `FLAGGADE.md` för varje utkast som varken blir en egen sida eller ett val, och
ta nästa.

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
   `Mått:`-raden alla mått. Stryk meningar som påstår en enda färg. Skriv hellre texten för
   alla färger innan sammanslagningen, medan sidan har en variant.

**En sammanslagen sida skrivs om med `sammanslagna.tsv` (2026-09-30).** Ska en sida som
redan bär flera färger få en färg till, och texten räknar upp färgerna, tar du med den i en
runda som vanligt men ger den en rad i `sammanslagna.tsv` (`kort`, tab, antal varianter)
och ingen rad i `sku.tsv` eller `variant.tsv`. Skrivworkflowen skriver då text, bilder och
kategorier men hoppar över SKU-steget, och återläsningen kräver att alla varianter finns
kvar och syns. Bildlistan måste bära varje bild ett färgval pekar på, annars skrivs den
inte. En länkad bild som ändå ska bort (text inbränd i en annan språkversion) tas bort med
workflowen **"Bilder — ta bort bilder ur en publicerad sida (också länkade)"**: torrt först,
sedan `skarp=ja` med planens sha (CLAUDE.md, *Bilder bort*). Skriv texten för den nya färgen
också, och lägg sedan på den med sammanslagningen.
Läs sidans nuvarande text och varianter färskt: rundans gamla filer är inaktuella.

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

Finns inget foto i färgen är valet fel på sidan. På en dold sida flaggar du det till Leonard
i `FLAGGADE.md`, för där ser ingen kund felet. På en publicerad sida rättar du det samma
dag, enligt nästa stycke. Lägg aldrig en annan färgs bild på valet.

**En publicerad sida med en färg utan foto rättas samma dag (2026-10-21).** Skoskåpet,
tunnelväxthuset och dieselvärmaren från 27 september stod flaggade i fyra veckor och låg
ute med ett färgval som visade fel färg, tills Leonard såg dem i Wix. En flagga är ingen
åtgärd. Gör så här:

1. **Leta efter ett foto i färgen.** För en AliExpress-sida läser du listningens SKU-bilder
   med workflowen **"AliExpress — färgbilder per SKU (krypterat)"** (`ae-skubilder.yml`).
   Kör den med `workflow_dispatch` från `main` (`produkter`: högst tio Wix-id, `kuvert`: din
   publika nyckel). Push-triggern gäller bara en gammal gren och gör ingenting på din. Svaret
   är krypterat, eftersom bildadresserna är leverantörens. En Aosom-sida har inga
   SKU-bilder, så där söker du i feedens positioner och i syskonutkasten. Av de sex sidor
   Leonard pekade ut 2026-10-21 hade bara tältet en bild per färg hos leverantören. De
   andra fyra bar färgen som ett egenskapsvärde utan foto, och ingen av deras
   galleri- eller beskrivningsbilder visade den saknade färgen.
2. **Finns ett foto, koppla det som det är.** Är fotot en SKU-bild och ren enligt
   strykreglerna i *3. Bilderna före texten* laddar du upp den oförändrad och kopplar den
   till valet med en skrivning av `options` och `variantsInfo` ordagrant ur produktens egen
   GET (se *Färger som inte kom via verktyget* i `docs/polish/syskon.md`). Du bygger inget
   färgkort ur den *(Leonard 2026-10-27: inga Fyndplats-kort)*. Kör sedan `variantbild.yml`
   med `workflow_dispatch` från `main`, `ids` = produktens id och `lage` = `skarp`
   (standard är `torr`), så att variantens bild följer valet. Push-triggern gäller bara en
   gammal gren.
   Valet ska vara synligt, och varje variant ska ha sin egen bild: tältets sex varianter
   hade alla huvudbilden tills workflowen körts.
3. **Finns inget rent foto, ta bort färgen.** Det är en publicerad sida, och en färg utan foto
   visar fel färg för kunden. Blir bara en färg kvar kollapsar du sidan till en variant med
   bevarat id: `options: []` och den kvarvarande variantens objekt ur produktens egen GET
   med `choices: []`. Variantens id, lager och pris står då kvar (läs tillbaka alla tre).
   Skriv ner den borttagna variantens id, SKU, pris och lager i `FLAGGADE.md`, så att
   färgen kan läggas tillbaka när det finns ett foto. Ta sedan bort raderna som lovar
   färgerna (*Finns i …*, *Välj mellan …*) och byt *Färger: …* mot *Färg: …* med den
   kvarvarande färgen. Det är en ren strykning, så den skrevs 2026-10-21 som en PATCH med
   fältmask `plainDescription` och inget annat. Varje sträng som skulle bort eller bytas
   räknades till exakt en träff i samma anrop innan något skrevs, och sidan lästes sedan om i
   ett eget anrop (längd, nya rader, borttagna ord) och live. Ska texten skrivas om i
   stället för strykas går den via skrivplanen som vanligt (*Skriv aldrig för hand i Wix*
   nedan). En dold sida lämnas orörd och flaggas.
4. **Läs galleriet som butiken läser det** (sedan PR #770, 2026-10-24). En bild syns när den,
   i varje option som länkar den, är länkad till det valda valet; inom en option räcker ett
   av valen. En bild som ingen länkar syns för alla. En färg utan kopplade bilder lämnar
   därför sina bilder gemensamma, och de visas för alla färger: hamsterburens naturträ visade
   den mörkgrå burens bilder. Koppla färgens alla bilder. En bild av en viss färg i en viss
   storlek länkas till färgen OCH storleken (ägarlistor i `bygg-agare.py`). Wix tar högst 15
   länkade bilder per val, och en bild med två ägare räknas mot båda valen. Mät på den publicerade sidan med
   `node tools/polish-gates/live-galleri.mjs <slug> [galleri-id.json]` (Playwright): den
   klickar varje kombination i väljaren, både axlar och kort, och skriver galleriet per
   kombination. Väntar du inte ut butikens cache, som fylls på var femte minut efter en
   ändring, mäter du den gamla sidan.
   Efter en sammanslagning mäts varje vy på samma sätt, för katalogkontrollen nedan ser bara varje
   vals första bild: 2026-10-22 hade foton hamnat under fel färg eller storlek på fyra av sju
   sammanslagna sidor. De länkas med `tools/polish-gates/bygg-lank.py` och `variantbild.yml`
   (FLAGGADE, lärdom 135).
   Kort och måttbilder är gemensamma enligt butikens regel (`arKort`) och visas under varje färg. Leonard har avgjort
   frågan (FLAGGADE, lärdom 147): en bild som stämmer för alla färger får delas (2026-10-23), en bild på en viss färgs vara
   visas inte under en annan färg (samma dag), och leverantörens egen måttbild länkas till sin variant, färg OCH storlek
   (2026-10-24, *Originalen tillbaka* i CLAUDE.md).
   På fåtöljen `41395340` (T91) fick båda färgerna i stället var sin måttbild: givarens måttbild angav samma tal som sidans
   text, så den togs med som sista bild och värdens egen länkades till värdens färg med `bygg-lank.py` (FLAGGADE, lärdom 149).
5. **Kör katalogkontrollen.** `products/search` bär `options` med `linkedMedia` och
   `visible` per val, så hela katalogen går att kontrollera på en halv minut (62 sidor,
   `cursorPaging` inuti `search`). `tools/polish-gates/katalogkontroll-farger.js` (klistras
   in i ExecuteWixAPI, skriver ingenting) listar sidor där ett färgval saknar kopplad bild
   och sidor där två färgval har samma första bild, och `katalogkontroll-spec.js` listar
   sidor vars specifikationsflik är ett enda stycke. Utfall 2026-10-21 efter åtgärderna:
   noll av de två första, utom MTB-pedalerna `f56b8b74`, där valen *Svart 2 DU* och *Svart 3
   kullager* skiljer på lager och båda är svarta. Kontrollen fäller på rätt sak: den fann
   plåtboden `2861bf83` (Brun, dold) som enda träff bland de dolda. Titta på räknarna
   (`fargoptioner`, `valMedBild`): en kontroll som inte kan fälla räknas ändå som gjord.
6. **Ett val med fyra bilder eller färre får fler (Leonard 2026-10-21).** Samma kontroll läser
   hur många bilder varje färgval visar i butiken (färgens egna länkade bilder plus de som
   ingen äger, färgens första bild först, `tools/polish-gates/katalogkontroll-farg-bilder.js`)
   och listar de som visar fyra eller färre: 534 av 951 publicerade sidor med färgval den
   dagen. Fler foton hämtas ur leverantörens egen uppsättning,
   aldrig ur en annan färg. På en Aosom-sida gör **"Bilder — fler bilder till en färg på en
   sammanslagen Aosom-sida"** (`aosom-fargtillagg.yml`) det: `kandidater` laddar upp feedens
   position 3, 8, 9 och 10 för just färgens artikel, du tittar på varje bild (tysk text, märke,
   logga och fel färg stryks; kör `tools/polish-gates/ocr-forgranska.py` först, den hittar
   inbränd text men är inget bevis för att en bild är ren), och de godkända skrivs i
   `tillagg.json` med `plan` och `skriv`. Har färgen en dold givare med bilder kvar
   (`katalogkontroll-farg-givare.js`) skrivs de godkända direkt med `skriv-fargbilder.js`, och
   livekollen är `kolla-live-farg.py`. En givares egna Fyndplats-kort läggs inte som val
   *(Leonard 2026-10-27: vi slutar med korten)*. De dubblerar dessutom värdens egna, och
   siffrorna kan skilja. **Före skrivningen: jämför talen i varje måttbild med sidans text**
   (`ocr-forgranska.py --tal`, sedan `kolla-tal-mot-text.js`, som läser). En bild som anger en
   annan belastning eller ett annat mått på samma del än sidan tas inte med (240 kg mot
   *100 kg per sits*, en trappa på 38 × 20 mot *38 × 22 × 12*); fler mått än texten (ett
   läge, ett fack) är ingen motsägelse. Har den redan skrivits tar `bilder-bort.yml` bort den.
   **Efter skrivningen: mät varje färgvy live** (`live-par.sh`, `kolla-live-farg.py`,
   `live-dubbletter.py`) och titta på alla vyer, inte bara antalet (`ocr-live.py` och
   `live-vyer.py`, som ritar en rad per vy). En vy kan visa en bild på fel färg trots rätt
   galleri: ett olänkat foto hör till den färg dess alt-text nämner, och på en sida med två
   axlar styr även en länk på storleken. Då flyttar `lank-om-bilder.js` länkarna utan att röra
   galleriet (se CLAUDE.md, *Feedomgång 4*), och `variantbild.yml` rättar varukorgens bild
   efteråt. Kommer en färg att tappa bilder när felbilderna tas bort, kör `bilder-bort.yml`
   först och `kandidater` om efteråt (`mal` = `wix-id:val-id`).
   På en AliExpress-sida görs det för hand med SKU-bilderna ur `ae-skubilder.yml`: importera
   filerna, skriv galleriet vid id, länka färgens bilder (`options` och `variantsInfo`
   ordagrant), kör `variantbild.yml` och mät live per färg med `live-galleri.mjs`. En bild som
   är densamma i alla färger länkas inte och får en alt-text som nämner färgerna, då visas den
   för alla. Hittar du inga rena foton till en färg stannar den på det antalet. Rapportera det,
   och hitta aldrig på en bild. Beskrivning, mätning och egenskaper: CLAUDE.md, *Färgval med få
   bilder*.

☠️ **En `variantsInfo`-skrivning på ett dolt utkast utan `fields=MERCHANT_DATA` i GET:en
tappar variantens kostnad i Wix.** Uppmätt på plåtboden. Mappningen bär kostnaden och inget
läser Wix-fältet (varukostnaden tas ur mappningen), och publicerade AliExpress-sidor saknar
det redan. En skrivning som bara bär `plainDescription` rör varken varianter eller kostnader.

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
inga variantval. En VEVOR-familj har en variant per artikel.

**Läs mappningsraden** för varje produkt med **"Polering — läs och stämpla mappningsraden"**
(`polish-mapping.yml`, `mode` = `las`, en produkt per körning). Svaret säger:

- **prisgrinden:** STÄMMER, PRISGRINDEN FALLER (drift: rör inte priset, välj en annan
  produkt eller flagga), SLUTSALD, LÅST PRIS eller EJ AVGÖRBAR,
- för VEVOR **`vevorGranskning`**: `gpsr`, `medicinteknik` och `bildgranskning` (se
  VEVOR-avsnittet).

Det är den enda kontrollen av priset och av VEVOR-flaggorna, för skrivsteget gör ingen.

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

**Svenska alt-texter säger inget om pixlarna.** En runda som bara byter alt-texter på en redan publicerad sida får ändå gå
igenom hela galleriet: kör `tools/polish-gates/ocr-forgranska.py` (eller `ocr-live.py` mot de publicerade vyerna) över varje bild.
2026-10-22 fann en OCR över 177 bilder på åtta sidor en tysk detaljbild och en leverantörslogotyp som legat ute länkade till
färgval (T88, FLAGGADE, lärdom 141). De tas bort med `bilder-bort.yml` före bildplanen, och galleriet läses om innan
alt-nycklarna byggs, eftersom bilderna efter en borttagen bild byter plats (lärdom 142).

Position 1 är en vit studiobild och har aldrig behövt strykas (0 av 687 produkter i B- och
N-rundorna), så arket räcker för den. Granska 2–5 i full upplösning i `orig/`. Siffror i en
ritning och hur varan är byggd läser du också i `orig/`, aldrig på arket (600 px per bild):
en etikett lästes en gång som 36 cm på arket men var 35.

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
[`arkiv/fyndplats-kort.md`](arkiv/fyndplats-kort.md). De kort som redan ligger på
publicerade sidor ligger kvar *(Leonard 2026-10-27: "låt de som är gjort ligga kvar")*.

**Undantag: sidor med färre än fem bilder** *(Leonard 2026-09-30 för två eller tre bilder, utvidgat
2026-10-07 till varje sida som annars får färre än fem)*. Där får en leverantörsbild
beskäras så att rubriker, bildtexter och ikoner hamnar utanför. Varan skärs aldrig i, och
ingenting retuscheras eller maskas. Butikens huvudbild visar mitten av
bilden som en kvadrat, så välj utsnittet så att varan syns där. Hur det görs står i
[`polish/bildmetoder.md`](polish/bildmetoder.md) under *Beskärning*.

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
finns. Metoderna står i [`polish/bildmetoder.md`](polish/bildmetoder.md).

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
   går att utelämna, skriver du det skyddande talet och noterar avvikelsen i commitmeddelandet.
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
    Rangordna aldrig varan mot resten av sortimentet ("smalast", "den lättaste … i
    sortimentet", "den enda"), inte ens med en mätning bakom, se *Tonen*.
    `gate-superlativ.py` fäller ett superlativ i samma mening som ett omfång. En rad i
    `superlativ.txt` (`<kort> <skäl>`) är bara till för en träff som inte rankar
    sortimentet. Grinden ser inte superlativ om marknaden i stort ("den lättaste sortens
    gran"), så de hittar du själv.
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

#### Filtren på kategorisidorna läser texten (2026-09-27)

Kategorisidorna filtrerar på mått, material, klädsel, antal, form, placering och
egenskaper. Wix har inga fält för det, så butiken läser uppgifterna ur beskrivningen
(`lib/spec-facets.ts` på headless-site). En uppgift som inte står där den läses finns inte
för filtret, och varan försvinner när kunden använder det. En fel uppgift är värre: då
hamnar varan i fel filter. **Skriv bara det som stämmer, och hoppa över det varan inte har.**

Filtren läser **namnet, ingressen, punkterna under `Egenskaper` och raderna i `Tekniska
specifikationer`**. De läser inte brödtextens avsnitt, `Vanliga frågor`, `Passar inte den
här?` eller länkar, eftersom där ofta jämförs med andra varor. En egenskap som bara står i
en fråga räknas alltså inte.

Raderna i `Tekniska specifikationer`. Formerna nedan är provade mot butikens tolkning:

| Filter | Skriv så här |
|---|---|
| Bredd, djup, höjd | `Mått: 90 × 60 × 75 cm`, alltid bredd × djup × höjd |
| Sitthöjd | `Sitthöjd: 45 cm` eller `Sitthöjd: 45–52 cm` |
| Maxlast | `Maxlast: 120 kg` |
| Vikt | `Vikt: 14,5 kg` |
| Effekt | `Effekt: 2000 W` |
| Volym | `Volym: 1,7 liter` |
| Ålder | `Rekommenderad ålder: 3–8 år` |
| Material | `Material: stål och MDF` |
| Klädsel | `Klädsel: sammet` (manchester, bouclé, chenille, linne, konstläder, nätväv) |
| Lådor | `Antal lådor: 5` |
| Sittplatser | `Sittplatser: 3` |
| Hyllplan, våningar | `Antal hyllplan: 4` eller `Våningar: 3` |
| Sängbredd | `Madrassmått: 140 × 200 cm` |
| Djur | `Passar för: katt och kanin` |
| Placering | `Placering: vägghängd` eller `Placering: fristående` |
| Bränsle | `Bränsle: gasol` (kol, ved, el, pellets, bioetanol). Läses bara på grillar, eldstäder, kaminer och värmare |

- **Form** läses ur namnet (`Runt matbord`, `Oval spegel`) eller ett `Ø` i måttet. Bord
  och speglar utan formord får formen ur måtten.
- **Egenskaperna** skrivs som punkter under `Egenskaper`, så som kunden läser dem:
  `Fyra hjul, två med broms`, `Höj- och sänkbar 72–116 cm`, `LED-belysning i tre
  ljusfärger`, `Batteridriven, 3 × AA (ingår inte)`, `Fjärrkontroll ingår`, `Timer
  1–8 h`, `UV-skyddad duk`, `Vattenavvisande duk`, `Solcellspanel`.
- **Nekat räknas inte:** "inte hjul", "utan batteri". En del av varan räknas inte heller
  som varan: "höjdjusterbart styre", "löphjul", "rullbar dörr". Skriv därför egenskapen
  om varan själv, inte om en del av den.
- **Batterierna till fjärrkontrollen** gör inte lampan batteridriven. Skriv `Fjärrkontroll
  ingår (2 × AAA, ingår inte)` på samma rad, så läses de rätt.

**Måtten** (provade mot tolkningen 2026-09-28):

- **Förpackningens mått** skrivs på en egen rad, `Paketmått: 120 × 60 × 15 cm`. Den läses
  aldrig som produktens mått, så den kan aldrig ersätta `Mått`-raden. Står bara
  kartongens mått på sidan har varan inget måttfilter.
- **Tre tal.** Två tal utan förklaring (`Mått: 60 × 180 cm`) kan vara en spegel, en matta
  eller ett växthus, och ger därför bara bredden. Skriv alltid bredd × djup × höjd. Står
  talen i en annan ordning, skriv axlarna efter: `Mått: 180 × 60 × 2 cm (H × B × D)`.
- **Justerbar höjd** skrivs som intervall, `Mått: 60 × 55 × 73–89 cm` eller `Höjd: 73–89
  cm`. Varan passar då både den som söker 75 och den som söker 85 cm.
- **Ett mått i namnet** räknas bara när där står minst två ("Kaninhus 122 × 93,5 cm"). Ett
  ensamt tal i namnet är för ofta en del av varan ("bred sits på 79 cm"), så skriv
  måtten i `Tekniska specifikationer` även när namnet bär ett.

**När ett filter syns.** Filtret visas bara när tillräckligt många produkter i kategorin
har uppgiften:

| Filter | Visas när |
|---|---|
| Reglagen (mått, sitthöjd, maxlast, vikt, effekt, volym, ålder) och material | minst 60 % av kategorins produkter har uppgiften, och värdena skiljer sig åt |
| Knapparna (klädsel, djur, form, placering, bränsle, lådor, sittplatser, våningar, sängbredd) | minst 40 % har uppgiften och det finns minst två val |
| En egenskap (hjul, LED, timer …) | minst 3 produkter har den, men inte nästan alla (över 90 %) |

En kategori där hälften saknar `Mått`-raden får alltså inget måttfilter alls, inte ens för
de produkter som har den. Varje ifylld rad i en sådan kategori räknas.

Var det lönar sig att börja står i `docs/polish/filterluckor.md`: kategorier där några få
produkter till tänder ett nytt filter, och produkter som faller bort ur filter som redan
syns.

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
  fäller dem. En jämförelse med en annan varugrupp ("samma volym som en inbyggnadsugn")
  skriver du som måttet i stället.
- **Jämför inte produkten med andra varor i vårt sortiment**, inte ens med en mätning bakom.
  Det gäller rankningar ("den enda i sammet", "fem av våra sex"), jämförelser ("högre än de
  övriga modellerna", "mer än dubbelt så mycket som vår sammetspall") och rangord i en
  länktext ("– störst"). Påståendet handlar om andra produkter och blir fel när sortimentet
  ändras. `gate-superlativ.py` ser bara ett superlativ och ett omfång i samma mening, och
  städrundan 2026-09-27 hittade 63 sidor där det gick förbi. En korshänvisning som inte
  rankar står kvar: "Vill du ha massage finns …" med länk.
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
| Tillverkare och ansvarig i EU (MH Handel GmbH, Hamburg) | Motorn, samma för alla Aosom-märken (VEVOR: standardraden i `FyndplatsVevorGpsr`) | Ingenting |
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

Läs källtexten (`kallor.json`): för Aosom feed-radens tyska text — **punktlistan,
`Produktdetails`/`Technische Daten` och brödtexten**, för VEVOR utkastets svenska text och
fliken *Tekniska specifikationer* — och ta med **bara** det som står där:

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
| Standard, antagen (Aosom) | *(källan nämner ingen standard)* | `Uppfyller EN 71.` — bara leksaker och barnfordon från Aosom, Leonards beslut 2026-10-08 |

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

## 7. Recensionerna

*(Leonard 2026-10-30)* Den som polerar en produkt tar också dess recensioner, i samma
runda. Importen sparar leverantörens recensioner dolda (`pending`) på originalspråket, och
de syns först när någon har översatt dem. Mätt 2026-10-30: de flesta produkter har 4–10
väntande recensioner, högst 15 på en VEVOR-produkt och 30 på en Aosom-produkt.

☠️ **Steget går inte att hoppa över.** Workflowen i steg 9 prövar recensionerna för varje
produkt i planen innan den skriver något, och vägrar `skriv` om en produkt har väntande
recensioner utan beslut. En saknad `recensioner.json` räknas som inga beslut. Efter
produkterna skriver den recensionerna, läser tillbaka varje rad och säger till butiken, så
att produktsidan visar dem direkt. Annars cachas de i sex timmar.

1. **Läs.** Kör **"Polering — recensionerna till rundans produkter"**
   (`polish-recensioner.yml`) med `ref` satt till poleringsgrenen, `runda` satt till
   katalogens namn och läget `las`. Den läser produkterna ur `ids.tsv`, skriver
   `recensioner-kalla.json` till rundans katalog och committar den. Per kort står de
   väntande recensionerna: id, betyg, datum, språk, `kopt` (varianten kunden köpte, på en
   VEVOR-familj), antal foton och originaltexten. Inga namn och inget land, och
   artikelnummerformer är redigerade. Står recensentens namn eller en signatur i texten är
   den bortredigerad (`‹NAMN›`) och raden märkt `namn: true`: den döljs, eftersom originalet
   inte får översättas *(husets regel sedan 2026-09-30)*. Butikens egna kunders omdömen är
   inte med. `ids.tsv` måste vara pushad innan du kör `las`, och kolumn 2 ska vara produktens
   Wix-id. Hämta grenen efteråt (`git pull`), eftersom workflowen har committat filen.
2. **Besluta varje recension** i `recensioner.json`:
   ```json
   { "<kort>": { "oversatt": { "<id>": "<svensk text>" }, "dolj": { "<id>": "<skäl>" } } }
   ```
   En översatt recension publiceras. En dold avvisas och går att visa igen i
   `/admin/reviews`. En produkt utan väntande recensioner behöver ingen rad.
3. **Pröva** med samma workflow i läget `torr`, efter att ha pushat `recensioner.json`.
   Felen står per kort och recensions-id. Steg 9:s `torr` gör samma prövning.

**Översättningen** har samma längd och ton som originalet, vardaglig svenska och korta
meningar (CLAUDE.md, *Recensionernas svenska ska låta som en kund*). Innehållet ändras
aldrig, och kritik står kvar.

- Inga tankstreck, semikolon, citattecken eller `…`, och inga AI-fraser som *sammantaget*
  eller *helt och hållet*.
- Ta bort varumärken och marknadsplatser, budfirmor, priser, säljaren och kundtjänst,
  leveranstider och namn. Blir meningen fel utan det, dölj recensionen i stället.

**Dölj** med ett kort skäl, eftersom loggen är publik, när recensionen:

- bara handlar om leveransen, returen eller kundtjänsten,
- gäller en annan vara, färg eller storlek än sidans,
- bär ett namn, en signatur eller hälsouppgifter (`namn: true` i läsningen),
- säger emot sidans fakta, till exempel ett annat mått. Lista den då också i `FLAGGADE.md`
  åt Leonard,
- handlar om ett yngre barn än sidans åldersgräns, eller påstår något om tillverkningslandet,
- handlar om en färg som sidan inte har, när färgen är poängen (på en sammanslagen sida är
  alla sidans färger dess egna),
- är reklam eller inte går att förstå.

En recension som redan är publicerad rättas i `/admin/reviews`, inte med workflowen: den
vägrar ett id som inte väntar.

**Prövningen** fäller hela rundan och skriver ingenting när:

- en produkt i rundan har en väntande recension utan beslut, eller en recension står både
  som översatt och dold,
- ett id inte finns på produkten eller är butikens eget kundomdöme (de godkänner Leonard
  i `/admin/reviews`),
- en översättning är oöversatt, för kort eller för lång jämfört med originalet, har
  engelska kvar eller bryter mot stilen: tankstreck, semikolon, citattecken, tre punkter,
  AI-fras, marknadsplats eller leverantör, budfirma, pris, säljare eller kundtjänst,
  artikelnummer.

**VEVOR.** VEVOR visar en familjs recensioner på varje artikel i familjen. På en
VEVOR-produkt tar `las` därför bara med recensioner om produktens egna artiklar. De andra
räknas som `annan artikel` och `okänd artikel`, får inget beslut och stoppar inte rundan.
Prövningen fäller ett beslut om dem. Verktyget **"VEVOR — recensioner om en annan
artikel"** döljer de förra; kör det före **"VEVOR — recensionernas foton"**, som hoppar över
dolda rader. En okänd artikels recension avgörs om VEVOR-läsaren åter hittar dess text på
sidan (utkast läses en gång per dygn, publicerade sidor var fjärde timme), och då hamnar den
på restlistan nedan. En äldre rad vars text inte längre står på VEVOR:s sida förblir okänd
och räknas bara. Recensioner som importeras efter att PR #839 driftsatts bär sin artikel och
blir aldrig okända.

En VEVOR-vara utan komplett GPSR skrivs men publiceras inte. Dess recensioner skrivs ändå
och syns när varan publiceras.

**Restlistan.** Recensioner kan bli väntande efter poleringen: en senare inläsning
(Aosom-inläsningen tar publicerade produkter), recensioner som kopieras från en givare vid
en sammanslagning, eller en VEVOR-rad vars artikel blivit känd. Kör läget `kvar` (ingen
runda behövs) i början av varje poleringsdag. Det listar varje publicerad produkt med
väntande recensioner att besluta, i `ids.tsv`-form. Ta dem som egna rundor om högst 20
produkter (workflowens tak): `ids.tsv`, `las`, `recensioner.json`, `torr` och `skriv` i
samma workflow.
Mätt 2026-10-30, innan steget fanns: 263 publicerade produkter hade 1 451 sådana
recensioner, alla från Aosom.

-----

## 8. Grindar och skrivplan

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
| `gate-form.py` | artikelnummerformen i alla fält, tecken för tecken som rutten (sedan 2026-10-15) |
| `gate-lager.py` | slutsålt och tunt |
| `gate-superlativ.py` | superlativ om sortimentet; `superlativ.txt` kvitterar bara en träff som inte rankar |
| `bygg-axelfacit.py`, `gate-axel.py` | bredd, djup och höjd mot källans totalmått |
| `bygg-media.py` | bygger `nyttolast-media.json` på nytt ur `bilder.tsv`, `bilder-bort.tsv` och `alt.tsv` |

Rätta fynden i filerna, aldrig i grinden. Går ett fynd inte att laga i filerna, till exempel
när källan saknar totalmått, kvitterar du det i `grind-undantag.txt` (`<skript> <skäl>`);
grinden körs och skrivs ut ändå. Varningar stoppar inte bygget, men gå igenom dem en och en:
`UTSKRIVNA RÄKNEORD UTAN TÄCKNING` betyder att "tre fack" inte har något belägg. Ändrar du en
fil efter `hasha.py` kör du båda kommandona igen.

`gate-form.py` och workflowen vägrar ord med formen tre tecken, bindestreck och tre till,
som `360-graders`, `100-pack` och `E27-sockel`. Skriv `360 grader` och `100 st`.

**Rundor där en värd får en färg ur ett utkast** har en grind till som inte ingår i bygget,
eftersom den behöver sammanslagningsfilen: `python3 tools/polish-gates/gate-vardalt-farg.py
<värdrundans katalog> merge_<prefix>.json`. Den fäller en värdbild vars alt-text nämner
givarens färg (`en grå katt` på en beige tunna). Sammanslagningen länkar då inte bilden till
värdens färg, och butiken visar den bara under givarens (N314, 2026-10-25, lärdom 224).
Den fäller också ett nytt värdnamn (`namn.tsv`) som bär värdens eller givarens färg som hela ord:
sammanslagningens plan vägrar då med `namnet_bar_farg`, och plan-förkontrollen kan inte se det nya
namnet, eftersom den läser namnet som det står i Wix före värdrundan (T104, 2026-10-29, matbordet
`9053bc1a`).
Efter sammanslagningen läser `tools/polish-kedja/mkgalleri.py` värdens galleri och val i ett
anrop och räknar vyn per val.

-----

## 9. Skriv till Wix

1. Har rundan tagit flera timmar kör du om krock- och dubblettkontrollen först, eftersom en
   annan session kan ha publicerat under tiden. Committa sedan rundans filer och pusha
   grenen. Workflowen läser planen ur grenen.
2. Kör **"Polering — skriv en runda till Wix"** med `ref` satt till poleringsgrenen,
   `runda` satt till katalogens namn, `plan_sha256` från bygget och läget `torr`.
   Körningen prövar planen och recensionerna (steg 7) utan att skriva något.
3. Kör samma sak med läget `skriv`. Workflowen prövar recensionerna först och skriver
   ingenting om en produkt har väntande recensioner utan beslut. Sedan skriver den texten,
   som också publicerar produkten, och därefter bilderna, kategorierna och SKU:n, i den
   ordningen. Faller en
   produkt i ett steg stannar den efter det steget. Sedan väntar den 90 sekunder, läser tillbaka varje produkt separat och
   stämplar mappningsraden (`needsAiPolish: false`, `draftStatus: published`) för varje
   produkt som är helt verifierad. Sist skriver den recensionerna ur `recensioner.json`.

**Stannar körningen** har den skrivit alla produkter i det steg som föll, och textsteget har
redan publicerat dem, med importens bilder tills bildsteget körts. Rätta och kör `skriv`
igen direkt; alla steg tål omkörning. Faller bara återläsningen, stämpeln eller
recensionerna kör du läget `stampla`, som också skriver recensionerna. Kontrollera att körningen slutade `success` och inte `cancelled`: workflowen har
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
rundan är dokumenterad, inte efter varje fil. Undantaget är steg 7: `ids.tsv` ska vara
pushad före `las`, och `recensioner.json` före `torr`.

-----

## 10. Kontrollera live

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
  samma svar. Har Wix rätt värde men sidan fel, vänta en kvart och läs om sidan: butikens
  cron bygger om en ändrad sida inom fem minuter, men sidan cachas annars i sex timmar.
  Är sidan fortfarande fel efter det, jämför med Wix.
- Slår `livegrind.py` till på något som inte står i dina filer, jämför med en publicerad
  sida som rundan inte rört. Finns det där hör det till butikens ram.
- På en sida med flera färger ritar butiken bara den förvalda färgens bilder som
  alt-attribut i HTML:en. De andra färgernas alt-texter ligger i sidans data, i en karta
  fil → alt. `livekoll.py` letar där också och skriver i summeringen hur många alt-texter
  som bara sågs där (T1: 46 av 84). En alt-text som saknas på båda ställena är ett fel.
- Recensionerna: varje produkt ska visa de som steg 7 översatte. Saknas de, läs raden
  `recensioner: butiken` i steg 9:s körning. Föll anropet till butiken syns de först när dess cache gått ut,
  efter sex timmar.
- Öppna till sist en av rundans sidor och läs den som kund. Var avsnitten och bilderna
  hamnar syns bara där.

-----

## 11. Dokumentera

- **Ingen `LÄS-MIG.md`** i rundans katalog *(Leonard 2026-09-27)*. Vad som publicerades och
  vad som var oväntat står kort i commitmeddelandet.
- **`tools/polish-gates/FLAGGADE.md`**: en rad per produkt som hoppades över (dubblett,
  slutsåld, laglighet eller fel produkttyp). Filen fylls bara på, inget tas bort.
- PR-beskrivningen uppdateras inför merge, inte efter varje runda.

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
  `sammanslagna.tsv` (se [Syskon blir val på sidan](#syskon-blir-val-på-sidan)). För de
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
