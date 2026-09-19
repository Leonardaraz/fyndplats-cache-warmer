# Runda 139 — Steg 12: läsa sidan som kund

Tio sidor lästa uppifrån och ned. **Fyra fel**, alla osynliga för varje
mekanisk grind rundan har — fyra sidor omskrivna, sex orörda.

| | |
|---|---:|
| Sidor lästa | 10 |
| Sidor med fynd | 4 |
| Sidor omskrivna | **4** |
| Byte-identiska mot källan efteråt | **4/4** |
| `visible:false` genom hela steget | 4/4 |

## Fynd 1 ☠️ Ett tal härlett ur FRAKTVIKTEN nådde kundtexten (`a4d8feca`)

Texten sa *"Den väger under sju kilo, så det går att bära den med en hand."*
Källan har inget `Gewicht` alls — bara `SVENSK SPEC … Vikt 6,8 kg`, och det
fältet är **fraktvikten** (öppen uppgift #488), alltså tunnan PLUS kartongen.

Två fel i ett: talet mätte fel sak, och `Vikt` står inte i den här sidans
spec-tabell — kunden hade alltså inget att kontrollera påståendet mot.
Bärlöftet var dessutom en slutsats, inte en mätning.

Jämför `3a96740e`, som HAR ett tyskt `Gewicht: 14 kg` och därför bär `Vikt`
i tabellen. Rundan skiljer alltså redan på de två talen — den här meningen
var undantaget som slank igenom.

Ersatt med något mätt och kontrollerbart: golvytan `Ø35 cm`.

## Fynd 2 ☠️ Spec-tabellen räknade fyra delar och listade fem (`b04b5375`)

Tabellen bar BÅDE `Klösstam: Ø20 × 32 cm` OCH `Klivsteg: 3 stycken`, medan
samma tabell sa `Antal delar: 4`. En kund som räknar får fem.

Det är inte två delar utan en. Källan säger `Kratzstamm: Ø20 x 32B cm`, och
Steg 4 mätte ritningen: *"tre separata väggpinnar à Ø20 × 32 cm"*. En
uppförstoring av huvudbilden avgjorde saken — de tre delarna är **vågräta
sisallindade pinnar** på var sin rund väggplatta. Leverantörens `Kratzstamm`
och vår `klivsteg` är alltså SAMMA tre föremål.

Tabellen har nu en rad: `Klivsteg: 3 stycken, Ø20 × 32 cm vardera,
sisallindade`. Måttet är kvar, fantomdelen borta, och att stegen också är
klösytor står nu i texten i stället för att bara antydas av en rad ingen
kunde placera.

⚠️ **Att båda namnen var "rätt" var precis problemet.** Ingen faktagrind kan
fälla en tabell där varje rad stämmer mot källan — felet uppstår först när en
läsare summerar raderna.

## Fynd 3 Sidan gav två olika svar på samma fråga (`3a96740e`)

Ingressen och h2:n sa *"tre sätt att ligga"*; FAQ:n svarade *"Fem"*. Båda är
sanna — tre sorters liggplats, fem platser — men sidan band aldrig ihop dem,
så en kund som räknar möter en motsägelse.

FAQ-svaret binder nu ihop dem: *"Fem, i tre olika utföranden: …"*.

## Fynd 4 Samma uppmaning tre gånger på en sida (`90573e36`)

*"Mät takhöjden innan du beställer"* → *"Mät takhöjden först"* → FAQ:ns
*"Vilken takhöjd krävs?"*. Kravet är äkta och måste stå, men tre gånger läser
som tjat. Leonards regel: det som måste stå med står med, som ett positivt
villkor på rätt plats — inte som en upprepad varning.

`Så spänner du den` börjar nu i själva momentet. Kravet står kvar två gånger:
i sin egen h2 och i FAQ:n.

## Den mekaniska halvan

`steg12-lint.py`. Osynliga tecken byggs ur KODPUNKTER och grinden påstår
något om sig själv (`assert all(ord(t) > 0x20 …)`) — en grind vars villkor är
ett osynligt tecken går inte att granska genom att läsas.

☠️ **Sortimentssuperlativ-grinden fällde först två KORREKTA sidor**, och den
rättelsen är ett fynd i sig. `högst` i *"toppbädden sitter högst"* och `lägsta`
i *"börja med den lägsta delen"* handlar om produkten själv, inte om batchen.
Grinden kräver nu ett sortimentsuttryck (`av våra`, `i sortimentet`, `hos oss`,
`vi har`) inom 90 tecken, och bär ett självtest som kör den ÅT BÅDA HÅLLEN:
den måste fyra på ett inplanterat *"Den högsta av våra klösmöbler"* och tiga
på den korrekta formuleringen. Ett larm som fyrar på varje riktig sida lär
mottagaren att sluta läsa.

Syskonlikhet, 5-gram Jaccard på synlig text:

| | median | högsta par |
|---|---:|---:|
| Runda 45 (åtta olika modeller) | 0,026 | 0,078 |
| **Runda 139** | **0,030** | **0,103** |

Tio olika konstruktioner, inga tvillingar — talen ligger där de ska. De
delade meningarna är skötselraden och väggraden, medvetet ordagranna.

## Kvittot

☠️ **Inklistringen kunde inte nå Wix fel.** Batch 64 mätte 9 fel mot 0 när
texten skrevs direkt i anropet. Här hashar anropet varje sträng I SANDBOXEN
mot filens hash och PATCHar bara vid träff — en felskriven sträng ger
`skrev: false` och produkten rörs inte. Alla fyra gav träff.

Revisionen lästes färskt direkt före varje PATCH (`5 → 6` på alla fyra; en
annan session rör katalogen). Texten verifierades med en SEPARAT `GET
?fields=PLAIN_DESCRIPTION` — en PATCH-respons bär inget `?fields` (#457):

```
3a96740e  källa→norm 2376594/3184    Wix 2376594/3184    BYTE-IDENTISK
90573e36  källa→norm 396963618/3603  Wix 396963618/3603  BYTE-IDENTISK
a4d8feca  källa→norm 47254122/2985   Wix 47254122/2985   BYTE-IDENTISK
b04b5375  källa→norm 716331202/3276  Wix 716331202/3276  BYTE-IDENTISK
```

Bara `plainDescription` skrevs. `visible`, `variantsInfo`, priser, media och
`options` rördes aldrig — payloaden grindades mot den listan innan den lämnade
filen, och `visible:false` lästes tillbaka på alla fyra.

**Regeln, en gång till: en grön grind betyder att grinden är nöjd, inte att
texten är rätt.** Alla fyra fynden passerade tio mekaniska grindar. Det som
hittade dem var att läsa sidan i ordning, som någon som funderar på att köpa.
