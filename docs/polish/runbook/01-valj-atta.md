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
[`polish/syskon.md`](../syskon.md).

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
- Sök ordet i namnen i rundans katalogsvep (se [Wix-läsfällor](../../seo-polish-runbook.md#wix-läsfällor)). Svepet är
  klart först när markören är `null`.

Krockar ordet letar du först efter det exakta ordet för den andra varan (`balansbräda hund`
i stället för en andra `hundvippa`). Går det inte skiljer du dem åt med en kvalificerare
som står i **namnet, sluggen och titeln**, inte bara i brödtexten. Samma sak gäller syskon
inom rundan.
