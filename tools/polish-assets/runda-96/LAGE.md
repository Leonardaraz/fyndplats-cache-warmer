# Runda 96 — läge

Reservtaksfamiljens fyra sista utkast. **Publicerade, stämplade,
live-verifierade.** Rundan avslutades med en rättning av FEM redan
publicerade sidor — se sista avsnittet, det är rundans egentliga fynd.

## De fyra

| id8 | slug | vad | pris | SKU |
|---|---|---|--:|---|
| `3f9fda98` | `paviljongtak-3x3-dubbeltak-morkgra` | 3 × 3 dubbeltak, mörkgrå | 729 | `FP-paviljongtak-3x3-morkgra` |
| `2bfaf6dd` | `paviljongtak-3x3-dubbeltak-kaffebrun` | 3 × 3 dubbeltak, kaffebrun | 779 | `FP-paviljongtak-3x3-kaffebrun` |
| `9a3600f8` | `pergolamarkis-285x2-utdragbar-morkgra` | veckad pergolamarkis 2,85 × 2 m | 639 | `FP-pergolamarkis-285x2-morkgra` |
| `22dbd372` | `pergolatak-298x293-vaggmonterat-morkgra` | fast pergolatak 298 × 293 cm | 729 | `FP-pergolatak-298x293-morkgra` |

Alla fyra bar samma SKU-stam som familjens övriga utkast
(`FP-ersatzdach-fur-…`) och har fått unika. Priserna är ORÖRDA — kontrollerat
med återläsning: `förePris === efterPris` på alla fyra.

## Grindarna

| grind | utfall |
|---|---|
| `lint.py` | **0 brister** |
| självtest i `lint.py` | 32/32 |
| `mutationstest.py` | **32/32**, en dokumenterad blind fläck |
| prisgrind (`polish-mapping.yml` läge `las`) | `stammer: true` × 4 |
| transkriberingshash före/efter PATCH | lika × 4 |
| galleri | 6 / 3 / 6 / 6 bilder återlästa |
| kategorier | 2 löv var |
| stämpling | `needsAiPolish, draftStatus, variantSkus` × 4 |
| `livegrind.py` | **0 brister på fyra live-sidor** |

`2bfaf6dd` har TRE bilder, inte sex: två av dess fyra källbilder bär badgar
mitt i motivet ("Ersatz Gazebo Top Cover nur") och gick inte att beskära rena.
Färre bilder är billigare än en tysk badge. Grinden läser antalet ur
`media-alt.json`, aldrig ur en konstant — annars hade den fällt en korrekt sida.

## ☠️ Rundans fynd: utkastlistan är inte familjen

Steg 1 svepte poleringskön, hittade två färgsyskon till runda 95:s roströda duk
och skrev "**tre** färger". Sanningen är **fyra**:
`paviljongtak-3x3-dubbeltak-creme` (`507ae3d5`) var redan publicerad och är
SAMMA duk — 300 × 300 cm stor duk, 86 × 86 cm litet tak, 18 cm snedställd kant,
180 g/m², åtta dräneringshål, kardborre.

Sidan syntes inte, av två skäl som förstärkte varandra:

1. Den ligger inte i poleringskön — den är publicerad sedan en äldre runda.
2. ☠️ Den stod i runda 95:s egen källa, men under rubriken **"Har du en annan
   storlek?"** med texten *"ett dubbeltak i creme **i samma storlek**"*.
   Rubriken motsäger sin egen mening. En korslänk under fel rubrik läser som
   "redan avfärdad" och är därför **sämre än ingen korslänk alls**.

Fem publicerade sidor räknade alltså fel, och alla fem är rättade:

| id8 | färg | sa förut | säger nu |
|---|---|---|---|
| `507ae3d5` | creme | inget syskonavsnitt alls | fyra färger, länkar de tre andra |
| `271327e1` | roströd | "en färg till" → pekade på mörkgrön | fyra färger + mörkgrön som ANNAN duk |
| `3f9fda98` | mörkgrå | "tre färger" | fyra färger |
| `2bfaf6dd` | kaffebrun | "tre färger" | fyra färger |
| `b6ebc5ba` | mörkgrön | "en färg till" | ensam om sitt 88 × 88-mått, fyra andra finns |

`b6ebc5ba` står UTANFÖR fyrfärgslistan med flit: dess lilla tak mäter
88 × 88 cm, inte 86 × 86. Att lägga den i listan hade gjort listan till en lögn
av precis det slag den finns för att laga. Ett test i `syskonfix/fix.py` fäller
om den kryper in.

## Tre saker skrivningen lärde

1. ☠️ **Söksträngen är gratis att stava fel, ersättningen är inte det.**
   `byt()` kräver EXAKT en träff. Den fjärde sidans gamla stycke räknade upp
   färgerna i en annan ordning än jag härledde, och skrivningen dog på **0
   träffar innan något skickades**. En felstavning i en SÖKsträng kan bara ge
   noll träffar; en felstavning i en ERSÄTTNING når kunden. Därför är
   ersättningarna hash-grindade mot Python-sidans lint och sökningarna inte.

2. ☠️ **Två läsformer som ser lika ut svarar på olika frågor.** Hashen ersätter
   varje tagg med ett BLANKSTEG (identitet, får aldrig ändras); linten tar bort
   inline-taggar UTAN blanksteg (läsbarhet). Blandas de blir `</a>,` till " ,"
   och grinden rapporterar hängande komman som inte finns — och, värre, en
   verifiering som jämförde de två sa "0 träffar" om fem sidor där två just
   bevisats korrekta med hash. Verifieringen var fel, inte datan.

3. ☠️ **En PATCH syns inte direkt, och `?cb=` hjälper inte.** `3f9fda98`
   svarade 200 med den GAMLA texten på en helt färsk cache-bust, och med den
   nya trettio sekunder senare. Runda 60:s cachegåta åt andra hållet: där
   serverades utkastet, här den förra versionen. `livegrind.py` gör därför om
   HELA kontrollen när bristerna är av färskhetstyp, och dömer först när de
   står kvar.

⚠️ Butiken svarar dessutom ibland **403 på en giltig begäran** — samma slug gav
403 i ett svep och 200 sekunder senare. Ett 403 är inget verdikt förrän det
upprepats.

## Kvar

- `271327e1` uppger inte 180 g/m² i spec-tabellen, medan de tre andra
  färgerna gör det. Tre källor säger 180; bara dess EGET underlag säger 170 på
  ett ställe och 180 på ett annat. Talet är därför medvetet utelämnat där, inte
  glömt. Texten "samma väv" är sann utan det.
- Familjen har inga utkast kvar. Nästa runda tar en ny familj ur poleringskön.
