## VEVOR: kategorierna (2026-10-31)

Leonard sa ja till förslaget "Kategoriträd för VEVOR" 2026-10-31, alla fem
besluten:

1. Verktyg & Fordon heter Verktyg & Maskiner, och Bil & släp och
   Elbilsladdning & solenergi flyttar till nya Bil & Garage.
2. Företag & Proffs blir en egen avdelning, sist i menyn.
3. Vapenskåpen (61) får ingen kategori och publiceras inte (SS 3492).
4. Hjälpmedel blir en underkategori, och varje vara publiceras först efter en
   egen granskning. Det är poleringen: en VEVOR-vara publiceras bara genom den.
5. Menyn har 13 avdelningar i Leonards ordning. Den bor i butiken
   (`AVDELNINGSORDNING`, se butikens `CLAUDE.md`).

**I Wix** skapades 3 avdelningar och 51 underkategorier dolda samma dag (134
synliga kategorier orörda). Butiken visar bara kategorier som är synliga i Wix
och har köpbara produkter, så de syns först när varor publiceras.

**De nya kategorierna blir synliga av sig själva vid tio publicerade produkter**
(Leonard 2026-10-31). Cronen `/api/cron/kategorier-synlighet?dryRun=false`
(minut 37 varje timme) → `lib/vevor/kategorier-synlighet.ts`; workflowen
**"Kategorier — visa nya kategorier med minst tio produkter"** (`torr` · `skarp`)
kör samma rutt för hand. Den räknar synliga produkter i varje dold kategori som
reglerna lägger varor i (Wix Count Products med `allCategoriesInfo` och
`visible`, så en avdelning räknar med sina underkategorier), visar de som når
tio med Update Category Visibility (`PATCH /categories/v1/categories/visibility`;
Update Category tar inte `visible`), läser tillbaka och ber sedan butiken bygga
om `/sitemap.xml`, `/` och `/butik` (`tomOchBesok`, `ADMIN_SECRET` som kakan
`fp_admin`). Butiken tar sedan med kategorin i menyn, på sin sida och i
sitemapen (`lib/site-urls.ts` utelämnar bara tunna kategorier med 1–4
produkter). Kategorisidan har en generell text när den saknar egen. Uppmätt
2026-10-31 på två tillfälliga testkategorier som raderades direkt: Wix vägrar
visa en underkategori under en dold avdelning (428 "Category can't be visible
if at least one of the parent categories is hidden"), och att visa avdelningen
visar inte dess underkategorier. Torrkörningen samma dag: 54 dolda nya
kategorier, alla med 0 produkter, och 15 äldre dolda kategorier som jobbet
aldrig rör.

- ☠️ **Bara nya kategorier**: dolda, ett regelmål och skapade från och med
  `NYA_FRAN` (2026-10-31). En äldre dold kategori (Elektronik & Tillbehör,
  Mode & Accessoarer med flera) rörs aldrig. Ska en ny kategori förbli dold:
  lägg namnet i `HALLS_DOLDA`.
- ☠️ **Jobbet döljer aldrig något**, och avdelningen visas före underkategorin.
  En underkategori under en dold avdelning väntar (`vantarPaAvdelning`).
- ☠️ **Ett trädfel stoppar körningen**, och en visning räknas först när trädet
  läses om. En tom körning loggar ingenting.

**Reglerna** står i `lib/vevor/kategorier.ts`: VEVOR:s egen kategori (de tre
första nivåerna i brödsmulan) och, där den blandar varor, produktnamnet ger
avdelning och underkategori. Första regel som passar vinner.

- **Importen** kopplar varje nytt utkast till avdelningen och underkategorin
  (`kopplaKategorier`, `lib/vevor/import-drift.ts`) och märker vapenskåpen
  (`vevorGranskning.vapenskap`). Ett fel i kopplingen fäller aldrig importen;
  det räknas i `kategorier.fel` i loggraden.
- **Verktyget** för utkasten som redan fanns: workflowen **"VEVOR — kategorier
  till utkasten"** (`plan` · `skriv`) → `/api/admin/vevor-kategorier` →
  `lib/vevor/kategorier-kor.ts`. Kategorier läggs bara till, och bara på
  opolerade dolda utkast, och `skriv` kräver `bekrafta` = planens antal. Saknas
  ett regelmål i Wix kopplas ingenting (`stoppadAv: "trad"`).
- ☠️ **Vapenskåpen märks på alla VEVOR-rader**, också polerade och publicerade,
  och på varje artikel i en familj, både i importen och i verktyget. Märkningen
  görs före kontrollen av trädet och av `bekrafta`. Ett vapenskåp som redan är
  publicerat räknas i `vapenskap.publicerade` (med Wix-id), och workflowen
  varnar: dölj det i Wix för hand. Vapenregeln gäller alla sökvägar
  (vapen-, gevärs-, pistol- och jaktskåp, bösskåp, "skåp för gevär", gun safe),
  inte bara Kassaskåp. Hellre ett skåp för mycket som spärras än ett för lite.
- ⚠️ **Kategorier läggs bara till, aldrig tas bort.** Rättas en regel efter
  att verktyget eller importen kopplat en vara ligger den kvar i den gamla
  kategorin också. Ta bort den gamla kopplingen för hand, eller i poleringen.
- ☠️ **En vara i Hjälpmedel får `vevorGranskning.medicinteknik`** (`arHjalpmedel`,
  i importen och i verktyget, på samma rader och i samma steg som vapenskåpen).
  Poleringen stannar på flaggan och flaggar varan till Leonard, och det är så
  beslut 4 hålls. Granskningen 2026-10-31 fann 36 av 119 utkast i Hjälpmedel
  utan flaggan (duschstolar, toalettförhöjare, förflyttningsbänkar,
  stödhandtag, inkontinensunderlägg): namnen lät inte som vård, och flaggan
  sattes bara på VEVOR:s vårdkategorier och vårdord. `hjalpmedel.publicerade`
  ska vara 0.
- ☠️ **Spritapparaterna får ingen kategori och publiceras inte**
  (`vevorGranskning.spritapparat`, Leonards fråga 2026-10-31). Alkohollagen
  (2010:1622) 2 kap. 1 § andra stycket förbjuder att tillverka, överlåta eller
  inneha en apparat "som uppenbarligen är ägnad för tillverkning av sprit" utan
  rätt att tillverka sprit, och 11 kap. 2 § ger böter eller fängelse i högst ett
  år. Två regler, före allt annat utom vapenskåpen: en destillator som säljs för
  alkohol, var den än står (alkohol, whisky, brandy, moonshine, hembränt,
  thumper, "Vinframställningsset"), och varje destillator i VEVOR:s
  Bryggutrustning, också de som säljs för eteriska oljor eller vatten: en panna
  på 12–70 liter med kylspiral är en sprit-panna vad texten än säger. Mätt
  2026-10-31 på 15 246 avläsningar: 36 spärras (17 i lager). Elektriska
  vattendestillatorer på bänken (4–6 liter, 10 st) och laboratoriesatser i glas
  (6 st) spärras inte; alkohollampan i en labbsats och alkoholbrännaren under en
  dryckesdispenser är värme. Märkningen görs som för vapenskåpen, på alla
  VEVOR-rader och i samma steg, och en publicerad spritapparat räknas i
  `spritapparat.publicerade`. Morgonmejlet listar synliga vapenskåp och
  spritapparater för sig ("VEVOR-SIDOR SOM INTE FÅR SÄLJAS"). Bryggutrustning
  utan destillator (jästankar, bryggsystem, kittlar) säljs som vanligt.
- **Publiceringsspärren** (`lib/publicering.ts`) vägrar ett märkt vapenskåp och
  en märkt spritapparat på alla vägar, före GPSR, och kön visar "🔒 Vapenskåp,
  publiceras inte" och "🔒 Spritapparat, publiceras inte".
- `lasKategoritradet` (`lib/wix/kategoritrad.ts`) läser trädet med dolda
  kategorier. Poleringens kategoristeg läser samma träd, så att den kan välja
  en dold underkategori.

**Granskningen** 2026-10-31, mot alla VEVOR-artiklar i lager (12 000):

| | |
|---|--:|
| utan kategori | 1 (VEVOR:s egen "Annan") |
| vapenskåp och vapenfodral | 61 |
| Bygg & Renovering | 1 752 |
| Verktyg & Maskiner | 1 744 |
| Sport & Fritid | 1 662 |
| Trädgård & Utemöbler | 1 608 |
| Bil & Garage | 1 583 |
| Kök & Husgeråd | 751 |
| Hem & Inredning | 711 |
| Företag & Proffs | 622 |
| Möbler | 564 |
| Barn & Familj | 352 |
| Husdjur | 304 |
| Skönhet & Hälsa | 151 |
| Jul & Högtider | 134 |

Fem till sex slumpade namn per underkategori lästes, och en hel lista för
Kassaskåp, Hemsäkerhet och namnreglerna utan sökväg. Det gav ett trettiotal
rättade regler, och 617 artiklar bytte plats. Testerna under "auditens fynd" i
`lib/vevor/kategorier.test.ts` låser rättelserna; varje rättelse återinförd
fälls av rätt test. Det som rättades, i grova drag:

- ☠️ **Ett ord långt in i namnet säger inte vad varan är.** VEVOR räknar upp
  vad varan passar till: en bilramp "för rullstol och barnvagn" låg under Baby &
  Småbarn och en husdomkraft ("stolpe för") under avspärrningarna. Namnregeln
  för barnvagnar tittar nu bara på huvudnamnet, före första kommatecknet.
- ☠️ "Kassaskåp med brandsäker väska" gick till verktygslådorna (regeln var
  `fodral|väska`). Bara hårda fodral gör det nu, och vapenregeln tar också
  gevär och hagel.
- VEVOR:s kategori Hemsäkerhet är mest barnsäkerhet och avspärrningar:
  barngrindar, lekhagar och sängskydd går till Baby & Småbarn, sammetsrep och
  stolpar till Butik, evenemang & trafik.
- Hundbadkar låg under Terrarier (VEVOR:s reptilkategori), kommersiella frysar
  och ismaskiner under Kyl & frys och Glass, bröllopsdekor och stolsöverdrag
  under Dekoration och Utemöbler, PCP-pumpar för luftgevär under Pumpar,
  skorstenssotning under Elkaminer och farthinder under Hemelektronik.

**Kodgranskningen samma dag** (en oberoende granskare, sedan en jämförelse av
gamla och nya regler mot de 1 005 avläsningar som rättelserna kan röra) gav
reglerna för vapenskåp i alla sökvägar, produkttypen före egenskaperna bland
djurtillbehören ("Hönshus med ramp" är ett hönshus, "Klösträd med kattbädd" ett
klösträd), att bara typen före " för " räknas (`fore`), `\borm` (plattform och
formad är inga ormar), barnvagnar för husdjur till Hundvagnar, bröllop före
evenemangsregeln och tältkaminen före gnistskydden. På riktiga data ändrade det
en enda vara: ett engelskt "Gun Safe" under Kassaskåp blev vapenskåp. Testerna
under "kodgranskningen 2026-10-31" låser fallen.

Kvar, med flit:

- **Elbilar för barn får inga VEVOR-varor:** VEVOR har inga i lager. Tre
  trehjulingar ligger under Utelek & Spel och Baby & Småbarn.
- **Smart hem & säkerhet** får två (ett första hjälpen-skåp och ett cykellås)
  och **Elkaminer** fyra spismantlar. Eldstadsverktyg och askhinkar ligger
  under Gnistskydd, som närmaste kategori i trädet.

**Läget 2026-10-31 före mergen** (läst i Wix, inget skrivet):

- 9 468 VEVOR-rader, alla opolerade dolda utkast. Ingen är publicerad, och 40
  utkast spridda över listan saknade kategori. De 51 nya kategorierna är tomma.
- Trädet: alla 144 regelmål finns, 0 fel och inga dubbletter bland 203
  kategorier.
- Torrkörningen av reglerna mot utkasten: 9 416 får en kategori, 51 är
  vapenskåp, 1 har ingen regel och 0 saknar avläsning. Avdelningarna: Verktyg &
  Maskiner 1 463, Bygg & Renovering 1 442, Sport & Fritid 1 314, Bil & Garage
  1 274, Trädgård & Utemöbler 1 181, Kök & Husgeråd 575, Hem & Inredning 535,
  Möbler 477, Företag & Proffs 388, Barn & Familj 311, Husdjur 241, Skönhet &
  Hälsa 125 och Jul & Högtider 90.
- Bil & släp har 43 produkter och Elbilsladdning & solenergi 6, så Bil & Garage
  syns efter flytten. Tre av dem (pallbockar och två takboxar) ligger också
  direkt i Verktyg & Fordon och visas därför under båda avdelningarna tills den
  kopplingen tas bort. Butiken räknar en avdelning som produkterna i den och i
  dess underkategorier.

⚠️ **Kör `skriv` på natten, utanför synkfönstren.** Om en kategorikoppling
flyttar produktens `updatedDate` (inte mätt) ser butikens cron
`uppdatera-andrade` tusentals ändrade produkter, och över 3 000 på elva minuter
kapar den fönstret: de äldsta ändringarna, också prisändringar på synliga
sidor, väntar då på säkerhetsnätet (sex timmar). Mät `updatedDate` på en
kopplad produkt efter första varvet och läs butikens logg efter `[uppdatera]
fler än`.

**Natten då butikens meny-PR mergas**, i den ordningen och precis före mergen:
byt namn på Verktyg & Fordon i Wix, visa Bil & Garage, och flytta sedan Bil &
släp och Elbilsladdning & solenergi under den. ☠️ Bil & Garage visas FÖRE
flytten: Wix vägrar en synlig underkategori under en dold avdelning (428), och
en flytt in under en dold avdelning kan dölja de två kategorierna med 49
produkter. En tom avdelning visas inte i butiken, så att visa den först är
ofarligt. Ta också bort de tre produkterna i Bil & släp ur Verktyg & Fordon.
Namnbytet görs med Update Category (`PATCH /categories/v1/categories/{id}` med
`revision`) och flytten med Move Category (`POST
/categories/v1/categories/{id}/move`, `parentCategoryId` och `position`).
`NAMNBYTEN` och `FLYTTADE` gör att importen och verktyget fungerar både före
och efter.
