## Slutsålda sidor med trafik: omdirigera bara det som är borta för gott (2026-10-18)

Leonards fråga: ska produkter som varit slutsålda länge men får trafik
omdirigeras? Search Console (bildsök 28 dagar, webbsök 7 dagar) jämfört med
butikens flöde och Wix lager:

| helt slutsålda sidor med trafik | sidor | webbklick 7 d | bildklick 28 d |
|---|--:|--:|--:|
| Aosom | 46 | 5 | 4 |
| AliExpress, slut under 30 dagar | 27 | 5 | 41 |
| AliExpress, slut minst 30 dagar | 38 | 4 | 9 |
| **alla** (av 124 och 188 produktklick) | **111** | **14** | **54** |

32 av bildklicken gick till ett enda vägghängt sängbord. "Slut i minst X
dagar" är tiden sedan lagerraden i Wix senast ändrades (`updatedDate` i
`inventory-items/query`), alltså en undre gräns.

Regeln, med Leonards ja samma dag:

1. **Omdirigera bara det som är borta för gott och har en likvärdig vara i
   lager.** Borta för gott är AliExpress slut i minst 30 dagar, eller
   Leonards besked. Målet ska svara på samma sökning, aldrig `/butik` eller en
   bred kategori.
2. **Aosom-sidor ligger kvar.** Flödet tar tillfälligt bort varor med lågt
   lager, och 45 av 46 hade varit slut kortare än 30 dagar. Synken fyller på
   och mejlar bevakarna.
3. **Utan likvärdig vara ligger sidan kvar som slutsåld.** En adress som
   redan svarar 404 får vara en 404.

Nio sidor dolda och tolv rader skrivna 2026-10-18, bland dem två döda
fågelbursadresser. Sängbordet pekar på en sida med samma vara i vitt.

Så görs det, och tre saker att inte missa:

- Raderna först, i en batch med "Lägg till 301-redirect" och `force=true`,
  eftersom källan fortfarande är synlig. Sedan döljs sidan med samma anrop som
  sammanslagningen, `{ product: { revision, visible: false }, fieldMask: {
  paths: ["visible"] } }`, och läses tillbaka.
- ☠️ **Workflowens lista visar bara de 200 senast ändrade raderna**
  (`listRedirects(limit = 200)`), och samlingen hade 529. Leta kedjor i hela
  `FyndplatsRedirects`. En rad pekade på en av sidorna som doldes och pekades
  om i samma batch.
- ☠️ **Wix dolde också den enda varianten på produkter utan val** (1 av 1
  synlig blev 0 av 1). På sidorna med två färger stod varianterna kvar.
  Publiceras en sådan sida igen: kontrollera varianten, annars visar sidan
  "Slutsåld" med fullt lager.
- ⚠️ **Räkna med en kvart innan en dold sida pekar vidare.** Produktsidan
  cachas i sex timmar, och butikens cron `uppdatera-andrade` (var femte
  minut) bygger om sidor vars `updatedDate` flyttats. Tio av tolv adresser
  pekade rätt inom fem minuter och de sista två efter fjorton. Att tömma
  sidan för hand (restock-provets läge `sidan`) behövs inte: två sidor
  byggdes om med gammal produktdata och väntade ändå på cronen.
