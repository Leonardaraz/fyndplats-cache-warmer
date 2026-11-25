## Automatisk rea: jämförpriset följer lagen (`lib/pricing/rea.ts`, 2026-11-01)

Leonards fråga: får en produkt en reaskylt när synken sänker priset? Nej. Synken
skriver bara `actualPrice`, och butikens "Rea", sidan /rea och Google-flödets
`sale_price` kommer från Wix `compareAtPrice`. Samma dag fanns 50 reaskyltar
utanför fyndauktionen, och 49 av dem visade ett överstruket pris som inte var det
lägsta de senaste 30 dagarna. De 49 jämförpriserna togs bort i Wix 2026-11-01,
lästes tillbaka och mättes på de publicerade sidorna. Leonard sa sedan "Fixa" till
förslaget: en reaskylt av sig själv när priset verkligen har sänkts, med rätt
överstruket pris, i högst 30 dagar, och bara för sänkningar på minst 10 %.

**Gränsen är 5 % sedan 2026-11-02** (Leonard: "Ändra så gränsen är 5%"). Den var
10 % den första natten. Körningen 09:40 UTC efter ändringen satte 4 skyltar till,
på produkter sänkta 7–10 %, och tog inte bort någon. Talet står bara i
`MIN_SANKNING_PROCENT` i `lib/pricing/rea.ts`, och gränstestet i `rea.test.ts`
håller det.

**Lagen** (7 a § prisinformationslagen): det tidigare priset ska vara det lägsta
som tillämpats de 30 dagarna före sänkningen, och vid en gradvis sänkning priset
före den första sänkningen. En vara som sålts kortare tid än 30 dagar jämförs
med det lägsta priset sedan den började säljas (förarbetena, se "Nya varor får
rea" nedan). Regeln, och varje försiktigt val, står i `lib/pricing/rea.ts`.

Timjobbet `/api/cron/rea?dryRun=false` (minut 40, utanför Aosoms synkfönster och
före VEVOR-synken) → `lib/pricing/rea-kor.ts`:

1. Läser varje variants pris och jämförpris ur Read-Only Variants API
   (`lib/wix/jamforpris.ts`, svepet i `lib/wix/variant-svep.ts`, som
   kostnadsverktyget delar).
2. För prisförloppet per variant i `FyndplatsPrisforlopp` (`lib/pricing/rea-lager.ts`,
   en rad per produkt, bara produkter som någon gång gått att köpa).
3. Bestämmer varje variants jämförpris och skriver ändringarna produkt för produkt
   (`skrivJamforpriser`), med läsning tillbaka och uppföljning av variantbilden.

Workflowen **"Rea — automatisk reaskylt vid verklig prissänkning"** (`rea.yml`):
`status` · `torr` · `skarp` · `seed-torr` · `seed` · `narvaro-torr` · `narvaro` ·
`pa` · `av`.

**Jobbet äger jämförpriset utanför auktionen.** Ett jämförpris som inte följer av
historiken tas bort, också ett som satts för hand. En produkt i en levande auktion
(`live`, också en schemalagd) rörs inte alls.

Tre spärrar innan ett jämförpris skrivs, och alla tre ska stå kvar:

1. ☠️ **`seedKlar`**: historiken är fylld bakåt ur butikens dagliga prisavläsning.
2. ☠️ **`skriv`** (strömbrytaren, `pa`/`av`): av som standard. Historiken förs ändå.
3. ☠️ **Historiken för körningen sparades.** Föll den rörs inga priser, och
   `senast` står kvar så att nästa körning ser luckan.

Tio egenskaper som inte ska tas bort:

1. ☠️ **Jämförpriset blir aldrig högre än lagens, i den strängaste läsningen.** En
   prisändring syns upp till ett dygn sent (timavläsningen, och dygnsavläsningen
   bakåt), så fönstret räknas ett dygn längre (`MARGINAL_MS`), en sänkning räknas
   till en gradvis följd bara när den säkert låg inom 30 dagar, och det lägsta
   priset tas från den tidigaste sänkning lagen kan räkna. Ett egenskapstest kör
   20 000 slumpade förlopp mot facit på det verkliga förloppet.
2. ☠️ **Historiken ska säga vad som gällde när fönstret började.** Antingen ett
   pris, eller punkten "gick inte att köpa": då är varan ny, och får rea mot
   det lägsta priset sedan den började säljas när den gått att köpa i sju dygn
   (nedan). En historik som bara börjar senare, med ett pris, säger ingenting
   om tiden före och ger ingen rea (`ofullstandig`).
3. ☠️ **En tid då varianten inte gick att köpa är inget pris.** Ett utkasts pris
   hade annars gett en sänkning som ingen kund sett.
4. ☠️ **En lucka (mer än tre timmar mellan två körningar) i fönstret ger ingen rea.**
5. ☠️ **En auktion i fönstret ger ingen automatisk rea**: auktionens lägsta pris är
   ett tillämpat pris som historiken inte ser. Auktionens seed köar inte en produkt
   med jämförpris, så en vara med rea går inte till auktionen förrän skylten är borta.
6. ☠️ **Ett jämförpris sätts bara på det pris beslutet gällde.** Har synken skrivit
   ett nytt pris under tiden väntar varianten till nästa körning.
7. ☠️ **Ett nytt pris tar bort jämförpriset** (`updateV3VariantPrices`). Annars hade
   en höjning stått som "Rea" tills jobbet hann räkna om.
8. ☠️ **Bakåtfyllningen gäller bara produkter med en variant.** Butikens avläsning
   sparar det lägsta priset bland produktens varianter, och när en billigare färg
   slogs ihop med sidan hade den nya färgens historik visat en sänkning som aldrig
   hänt. Flervariantsprodukter får rea först efter 30 dagar egen timhistorik.
9. ☠️ **Masspärren** (`MAX_NYA` = 200 nya reaskyltar per körning). Fler än så skrivs
   inte, bara borttagningarna. Läs planen (`torr`) och kör `skarp` med `max_nya`
   om den stämmer.
10. ☠️ **Svaret och loggen bär bara antal och Wix-id, aldrig priser.**

⚠️ **Vad historiken inte ser:** det som fyllts bakåt ur butikens avläsning (02:30
UTC varje dag, sedan 2026-09-17) ser ett pris om dagen. En sänkning som kom och gick
mellan två avläsningar syns inte där. Det gäller bara de första 30 dagarna efter
starten; från första körningen läses priset varje timme.

☠️ **En sänkning före 2026-10-18 ger aldrig rea.** Historiken börjar med butikens
första avläsning 2026-09-17 02:30 UTC, och en sänkning behöver 31 dygn historik
före sig (fönstret och marginalen). Utan det blir beslutet `ofullstandig`, vilken
gräns som än gäller. Vitrinskåpet för vägg är exemplet. Priset sänktes 7–8 oktober,
och skylten som stod kvar efter 2026-11-01 togs bort av den första körningen. Med
5 % kom den inte heller tillbaka. Svaret på "varför har X ingen rea?" står i
varans rad i `FyndplatsPrisforlopp`, där den första punkten visar var historiken
börjar. Mätt 2026-11-02.

### Nya varor får rea (Leonard 2026-11-25)

Leonards fråga i Black Week: "var det inte många vevor produkter som sjunk i
pris? Får dom inte rea stämpel för de är för nya?" Mätt samma dag i
`FyndplatsPrisforlopp`, 2 913 publicerade VEVOR-varianter på 2 628 sidor: 2 796
hade sänkts minst 5 % till dagens pris, 2 794 av dem det senaste dygnet när
synken följde VEVOR:s egna sänkningar (de flesta 7–10 %). 4 klarade regeln. De
andra hade gått att köpa kortare tid än 31 dygn före sänkningen: under 7 dygn
804, 7–13 dygn 1 204, 14–20 dygn 558 och 21–30 dygn 226. Och de hade aldrig
fått skylten för den sänkningen, eftersom fönstret räknas från sänkningen.

**Regeln var husets, inte lagens.** Sverige har inget undantag för nya varor i
7 a § (bara för varor som snabbt blir gamla), och förarbetena säger vad som
gäller i stället (prop. 2021/22:174, författningskommentaren): "Det kan i
praktiken vara så att en produkt har funnits till försäljning under en kortare
tid än 30 dagar. Näringsidkaren ska då ange det lägsta pris som näringsidkaren
har tillämpat på produkten sedan den började säljas." Leonard sa ja till
förslaget: skylt på nya varor, med minst sju dygn i butiken före sänkningen.

Tre delar, och alla tre ska stå kvar:

1. ☠️ **Beviset står i historiken, som en punkt "gick inte att köpa" före det
   första priset.** Regeln (`reaFor`) ger en ny vara rea bara när historiken
   säger att varianten inte gick att köpa när fönstret började. Då är det
   lägsta priset i fönstret det lägsta sedan den började säljas. En historik
   som börjar med ett pris ger `ofullstandig`, hur länge varan än sålts: den
   kan ha sålts billigare före.
2. ☠️ **Sju dygn till salu före sänkningen** (`MIN_KOPBAR_MS`), räknat på tiden
   varianten gick att köpa i fönstret och före den FÖRSTA sänkningen i en
   gradvis följd. Lagen kräver det inte. En vara under sju dygn får `ny`.
3. **Allt annat gäller som förut:** 5 %, högst 30 dagar från den första
   sänkningen, ingen lucka och ingen auktion i fönstret, masspärren.

Punkten kommer dit på två sätt:

- **`lasIn`** sätter den på varje produkt som får sin FÖRSTA rad, daterad till
  timhistorikens början (`TIMHISTORIK_FRAN`, 2026-11-01 14:40 UTC, den första
  timkörningen) eller så långt bak som historiken sparas. Jobbet har läst varje
  variant varje timme sedan dess, så en produkt utan rad har inte gått att köpa.
  ☠️ Bara produktens första rad. En ny variant på en sida som redan har en rad
  får ingen punkt: Wix byter variant-id när valen ändras, och då är den "nya"
  varianten samma vara som såldes under det gamla id:t.
- **`seedaNarvaro`** (workflowen, `narvaro-torr` och `narvaro`) sätter den på
  de produkter som fick sin rad före 2026-11-26 och därför börjar med ett pris.
  Beviset för dagarna före timhistoriken är butikens dagliga avläsning
  (`FyndplatsPrishistorik`, 02:30 UTC, bara synliga produkter). ☠️ Butiken
  gallrar den efter 45 dagar, så beviset börjar dagen efter den tidigaste dagen
  som finns kvar (2026-10-12 när det här skrevs), och punkten dateras dit. En
  produkt som står i avläsningen före sin första punkt såldes före och rörs
  inte. Varje dag fram till timhistorikens början ska vara fullständigt avläst,
  annars görs ingenting. Bara varianter vars första punkt är produktens första
  får punkten. Körningen går att göra om.

Fyra saker som följer av det:

- **Ett fönster som börjar före beviset ger ingen rea.** En vara vars första
  sänkning i följden låg före 12 november har ett fönster som börjar före 12
  oktober, och får `ofullstandig`. Detsamma gäller en produkt som fick sin
  första rad 26 november och sänks före 3 december: fönstret börjar före
  timhistoriken.
- **En variant som kommit till senare på en sida väntar sina 31 dygn**, som
  förut.
- **En sida som raderats och skapats om räknas som ny.** Historiken följer
  Wix-id:t.
- **Fyndauktionens 30-dagarsspärr är oförändrad** (`lib/auction/trettio-dagar.ts`):
  en ny vara stoppas där som förut, med eller utan punkten. Butikens egen
  uträkning för medlemspriset (headless-site `lib/price-history.ts`) är också
  oförändrad.

Kontrollerat: egenskapstestet med 20 000 slumpade förlopp prövar den nya vägen
mot samma facit som förut (det lägsta pris som verkligen tillämpades de 30
dagarna före den första sänkningen i lagens följd), och fäller om färre än 50 av
fallen är nya varor. 30 avsiktliga fel i regeln, timjobbet och bevissteget, ett
i taget: alla fälls.

**Simulerat mot riktiga data 2026-11-25, före mergen** (regeln och bevissteget
omskrivna till en läsning genom Wix-kopplingen, inga skrivningar):

- Bevissteget: 8 692 produkter med historik. 4 531 börjar med ett pris efter 12
  oktober. 1 213 av dem stod i butikens avläsning före sin första punkt och
  lämnas orörda, alla med första punkten vid den första timkörningen. Ingen
  produkt som fick sin rad senare stod i butikens avläsning före. 3 318
  produkter (3 580 varianter) får punkten. Läsningen är 62 frågor på 12
  sekunder.
- Regeln: rea på 2 029 varianter på 1 947 sidor, mot 143 före. 1 886 av dem är
  nya varor: 237 sänkta 5–7 %, 1 417 sänkta 7–10 %, 137 sänkta 10–15 % och 95
  mer än så. Ingen av de 143 tappar sin skylt.
- Kvar utan skylt bland varianter med en sänkning: 893 nya varor under sju
  dygn, 1 043 där historiken inte täcker fönstret och 865 under 5 %.
- Auktionerna är inte med i simuleringen. Torrkörningen efter mergen är facit.

**Efter mergen av nya varor,** i den ordningen, utanför Aosoms synkfönster och
inte runt minut 40 (timjobbet håller låset): `narvaro-torr` (läs `bevisFran`,
`kandidater`, `fannsFore` och `markta`), `narvaro`, `torr` (läs `beslut.nyaVaror`
och `plan.nya`, och titta på några produkter ur `medRea`), sedan `skarp` med
`max_nya` över planens tal tills `ejNadda` är 0. En körning hinner ungefär 200
sekunders skrivningar, så det tar flera. Masspärren håller timjobbet från att
sätta dem själv så länge fler än 200 väntar.

**Efter mergen,** i den ordningen: timjobbet för historiken från första körningen
(strömbrytaren är av). Kör `seed-torr` och läs talen, sedan `seed`, sedan `torr`
och läs planen (nya, byten, borttagningar och `medRea`). Titta på några produkter i
planen. Slå sedan på med `pa`, och mät sidorna live efter nästa körning.
