# Runda 84, Steg 1 — sju sensorsoptunnor, 20 till 60 liter

Familjen `Mülleimer` är **59 utkast** i kön mot **18 publicerade**
papperskorgssidor. Urvalet är gjort på VOLYM, för det är den enda axeln
kunden jämför på och den enda där en dubblett blir uppenbar.

## Dubblettkontroll: volymen avgör

Publicerade sensortunnor täcker **30, 50, 68 och 72 liter**:

| publicerad | volym | mått |
|---|--:|---|
| `soptunna-med-sensor` (`3d3ebf08`) | 30 L | 33 × 25 × 58 cm |
| `soptunna-med-sensor-50-liter` (`e77edc35`) | 50 L | 35,5 × 26 × 83,5 cm |
| `soptunna-med-sensor-68-liter` (`62c7d72d`) | 68 L | 40,5 × 29,5 × 78 cm |
| `sopsorteringstunna-med-sensor-72-liter` (`efd99fb0`) | 47 + 2 × 12,5 L | 42 × 30 × 81 cm |

Rundans sju har därför **volymer som ingen publicerad sida har**:

| id8 | pris | volym | mått (L × B × H) | batteri |
|---|--:|--:|---|---|
| `466e799a` | 859 | **20 L** | 33 × 25 × 42,5 | 4 × AA |
| `7846d05f` | 859 | **42 L** | 30,5 × 30,5 × 68 *(rund)* | 4 × AA |
| `0cc5c634` | 919 | **48 L** | 40,5 × 29,5 × 57 | ☠️ **4 × D** |
| `4ef74d40` | 1039 | **55 L** | 41 × 26,5 × 59 | 4 × AA |
| `dcd756bd` | 1059 | **58 L** | 40,9 × 28,9 × 68 | ☠️ **4 × D** |
| `aabcd677` | 1099 | **45 L** | 38 × 25,5 × 67,5 | *anges inte* |
| `96beca79` | 1219 | **60 L** | 39 × 27 × 66 | 4 × AA |

☠️ **Ett 30-liters sensorutkast valdes BORT trots att måtten skiljer.**
`c3e0c4a6` är 32 × 30,5 × 51 cm mot den publicerade 30-litersidans
33 × 25 × 58 cm — alltså en annan modell. Men två 30-literssensortunnor på
samma sajt är precis den interna dubblett CLAUDE.md pekar ut som den Google
straffar. Volymen är kundens sökord; att den skiljer sig i en decimal på
djupet räddar ingenting.

---

## ☠️ Steg 2/5: TVÅ tunnor ska MONTERAS — och det står bara i en del av källan

`96beca79` (60 L) och `4ef74d40` (55 L) har båda en produktgrafik med
rubriken **GETEILTE BAUWEISE**, som visar fyra lösa stålpaneler, en lockram
och ett lock som klickas på en innerbehållare.

⚠️ **Första utkastet av det här stycket sa att källan tiger om det. Det var
fel, och det upptäcktes genom att läsa HELA den tyska texten** — runda 83:s
lärdom, en runda senare. Punktlistan säger det rakt ut:

| id8 | den tyska punktlistan |
|---|---|
| `4ef74d40` | *"Die abnehmbare Struktur … ermöglicht eine **werkzeugfreie Montage**"* |
| `96beca79` | *"Einzigartiges modulares Design … ermöglicht eine **schnelle, einfache Montage**"* |
| `aabcd677` | ✅ *"**Keine Montage erforderlich**"* |

Det som ÄR sant är var uppgiften bor: i `Beschreibung`-punkterna, aldrig i
`Technische Daten` och aldrig i `Lieferumfang` — och det är spec-blocket den
råa importen speglar till den svenska fliken. **En kund som läser det
oputsade utkastet ser alltså ingenting om montering.** Paketmåtten bekräftar
det oberoende: 60-litersmodellen packas 42,5 × **15** × 65,5 cm och
55-litersmodellen 33 × **18** × 59,5 cm — platt, inte som en hel tunna.

Båda sidorna säger `Montering: krävs (verktygsfritt)` i specen och förklarar
det i en vanlig fråga. De fem övriga säger `Montering: krävs inte`.

## ☠️ 60-litersmodellen har TVÅ luktfunktioner, och bara den ena ingår

Källan säger att ett lager **aktivt kolfiber** binder lukt — det sitter i
tunnan och följer med. Produktbildens fjärde ruta visar dessutom en
**hållare för ett doftblock** i locket, och i hörnet står
**"Deodorant nicht enthalten"**.

Att slå ihop dem till "luktfilter" vore runda 52:s sandlådefel: hälften av
funktionen finns i kartongen och hälften ska köpas till. Specen har därför
två rader — `Luktfilter: aktivt kolfiber, ingår` och `Hållare för doftblock:
ja (blocket ingår inte)`.

## ☠️ Batteritypen skiljer, och den kostar pengar

Fem tunnor går på **4 × AA**, två på **4 × D**. D-celler är dyrare och
säljs inte i varje mataffär. Det är en riktig skillnad mellan två annars
snarlika tunnor, och den ska stå i specen på båda — inte kopieras från
syskonet.

☠️ **Ingen av dem har batterier med i kartongen.** Källan säger det rakt ut
(`nicht enthalten`, `nicht mitgeliefert`) och sidorna säger det också.

## ☠️ "Edelstahl" är inte hela tunnan — och den svenska fliken skriver bort plasten

| id8 | tyska brödtexten | den maskinsatta svenska fliken |
|---|---|---|
| `7846d05f` | `Edelstahl, Kunststoff` | ☠️ **`Edelstahl`** |
| `c3e0c4a6` *(vald bort)* | `Edelstahl, Kunststoff` | ☠️ **`Edelstahl`** |
| `4ef74d40` | `ABS, 430 Edelstahl` | `Edelstahl/Kunststoff` |
| `aabcd677` | `Edelstahl, Kunststoff, ABS` | `Edelstahl/Polypropylen` |
| `0cc5c634` · `dcd756bd` | `Edelstahl, ABS` | `Edelstahl/ABS` |
| `96beca79` | `Edelstahl` | `Edelstahl` |

Locket är plast på var enda en — det syns på bilderna, där locket är svart
och stommen borstat stål. **Poleringen följer brödtexten**, som runda 83
gjorde, och skriver `Stomme i rostfritt stål, lock i plast` i stället för
det svepande "rostfritt".

Samma fälla som runda 57:s *rostfria lögn*: ett material som stämmer på
delen kunden ser och inte på delen som går sönder.

## ☠️ Två vikter där källan säger två olika saker

De två D-cellstunnorna har samma tyska text ord för ord, och båda bär två
vikter som inte stämmer överens:

| id8 | tyska brödtexten | den svenska fliken | skillnad |
|---|--:|--:|--:|
| `0cc5c634` | 3,2 kg | **3,8 kg** | 0,6 kg |
| `dcd756bd` | ca. 4 kg | **4,3 kg** | 0,3 kg |

Skillnaden är liten och åt samma håll, och den tyska texten säger själv
*"ca."* om den ena. Vikten på en soptunna är dessutom inget kunden väljer
på. Sidorna anger därför **den svenska fliken**, som är det högre och därmed
det försiktigare talet, och säger ingenting om att uppgifterna skiljer sig —
en brasklapp om tre hektogram är brus, inte upplysning.

⚠️ Runda 83:s regel gäller alltså med sin egen gräns: skiljer källorna sig
**materiellt** utelämnas talet, och en halv kilo på en fyra kilos tunna är
inte materiellt. Att slentrianmässigt stryka varje tal två källor är oense
om vore att göra sidan sämre av principskäl.

## ⚠️ Två tal som är utelämnade med flit

* `466e799a`: `Öffnung der Abdeckung: 59 cm` på en tunna som är **42,5 cm
  hög**. Ett lock kan inte öppna 59 centimeter på en 42,5 cm hög tunna som
  ett linjärt mått — det är antingen en vinkel eller höjden med locket uppe,
  och källan säger inte vilket. Talet står inte på sidan.
* `96beca79`: den svenska fliken säger `Mått: 60L` i måttfältet — en volym i
  ett fält som ska bära centimeter. Måtten tas från `Gesamtabmessungen`.

## ⚠️ 45-litersmodellens vikt förklaras av bilden

`aabcd677` väger **7,8 kg** medan 60-litersmodellen väger 5,6 och
58-litersmodellen 4,3. Måttritningen förklarar det: den har en **separat
innerhink på 25 × 37,5 × 62 cm** som lyfts ur. Vikten är alltså rimlig, inte
ett datafel — men den ska stå tillsammans med innerhinken, annars ser tunnan
onödigt tung ut.

## Bilder som INTE följer med (Steg 4)

Alla 35 bilder granskade på två kontaktark. Fyra bär **inbränd tysk text**:

| id8 | bild | vad som står |
|---|--:|---|
| `466e799a` | 5 | `Küche` · `Badezimmer` · `Wohnzimmer` · `Schlafzimmer` |
| `4ef74d40` | 4 | `GETEILTE BAUWEISE — Schnelle Montage und Demontage` |
| `96beca79` | 4 | `GERUCHSKONTROLL-FILTERSYSTEM … Deodorant nicht enthalten` |
| `96beca79` | 5 | `GETEILTE BAUWEISE — Schnelle Montage und Demontage` |

Inget övre vänsterhörn bär en leverantörslogotyp.

⚠️ **`96beca79` tappar två av fem bilder och har alltså bara tre kvar** plus
Fyndplats-kortet. Det är tunt, men de två som stryks är just de som bär
rundans två viktigaste fynd — och de fynden flyttar in i TEXTEN i stället,
där de går att läsa på svenska.

---

## ☠️ Steg 3: leverantörens EGEN URL bär FÖRÅLDRADE mått — och de såg ut som ett fel i texten

Mappningsraden bär `sourceUrl`, och Aosom bakar in måtten i sin egen
produktslug. På de två ovala tunnorna säger sluggen något annat än sidan den
pekar på:

| id8 | artikelnr | sluggen i `sourceUrl` | `Technische Daten` på SAMMA sida | vår text |
|---|---|---|---|---|
| `0cc5c634` | 851-011V01 | `l40-9 x b28-9 x h64-3` | **L40,5 × B29,5 × H57 cm** | 40,5 × 29,5 × 57 ✅ |
| `dcd756bd` | 851-011 | `l40-9 x b28-9 x h75` | **L40,9 × B28,9 × H68 cm** | 40,9 × 28,9 × 68 ✅ |

Båda sluggarna är alltså fel, och på olika sätt: den ena har den ANDRA
tunnans bredd och en tredje höjd, den andra bara fel höjd. Sidans egen
jämförelsetabell längre ned (`SKU · Farbe · Maße`) säger samma sak som
spec-blocket — `40,5cm x 29,5cm x 57cm` respektive `L40,9 x B28,9 x H68 cm`
— så sluggen står ensam mot två ställen på leverantörens egen sida.

⚠️ **Det här är runda 83:s lärdom spegelvänd, och därför värd att skriva
ned.** Där utgick jag från en ritning och ändrade en text som var rätt. Här
utgick jag från URL:en, som ser auktoritativ ut för att den är
leverantörens, och var nära att "rätta" två korrekta mått. **En URL-slug är
inget facit — den är ett filnamn, och filnamn uppdateras inte när produkten
gör det.** Kolla alltid `Technische Daten` på sidan, inte adressen till den.

## ⚠️ `4ef74d40` är SLUT i lager — `aosomSyncedQty: 0`

55-litersmodellen har noll i saldo, och dess `aosomSyncedAt` är
2026-09-02 medan de andra sex synkades 09-05/09-06. Mönstret stämmer med
Aosoms egen B2B-guide, som CLAUDE.md citerar: *"Items with low stock may be
temporarily removed to avoid overselling"* — raden försvann ur feeden och
synken nollade saldot, precis som den ska.

Sidan publiceras ändå. Ett tomt saldo är ett lagerbesked, inte ett
utgånget sortiment: nästa körning där raden är tillbaka återställer saldot
av sig själv, och en opublicerad sida svarar 404 under tiden. Butiken har
sedan tidigare publicerade produkter i samma läge.
