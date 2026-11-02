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
`treeReference: {"appNamespace": "@wix/stores"}`, `returnNonVisibleCategories: true` och
`cursorPaging: {"limit": 100}`, med markören tills den tar slut, som
`lib/wix/kategoritrad.ts`). Trädet har drygt 200 kategorier, och utan flaggan saknas de dolda.
Gissa aldrig ur minnet. Koppla
föräldern, det smalaste lövet som passar och den sökordskategori som finns för
produkttypen. Finns inget löv räcker föräldern. Välj aldrig `All Products`, eftersom Wix
lägger till den själv. Workflowen slår upp namnen, och torrkörningen fäller ett namn som
inte finns.

Sökordskategorin är den sida som rankar på huvudordet, och dess text påstår saker om alla
sina produkter. Läs dess facit (`tools/polish-assets/runda-s*/<slug>-text.json`, fältet
`facit`) och pröva varje *alla*, *varje* och *ingen* mot den nya produkten. Bryter produkten
ett påstående skriver du en rad i `FLAGGADE.md` i stället för att koppla den.
