# Runda N30 — åtta produkter, 1 739–1 759 kr

Åtta Aosom-utkast polerade och publicerade: en hönsrastgård i galvat stål, en
sideboard, en hopfällbar motionscykel, ett skrivbord på två meter, ett 2-pack
nattduksbord, elva stora skumklossar och två leksakskök.

Rundan börjar på **`82d04879`**, som N29 verifierade rent och uttryckligen
lämnade som första kandidat hit därför att den rundan redan var full på åtta.
Den var fortfarande ren vid en FÄRSK `las` (saldo 39, `stämmer: true`), och
priset 1 739 kr är också rundans lägsta. Därifrån går urvalet billigast-först
och landar på 1 759 kr, där sex kandidater delar pris.

| id | produkt | SKU | pris |
|---|---|---|---:|
| 82d04879 | Hönsrastgård 200 × 200 cm – galvat stål, tak och låsbar dörr | FP-honsrastgard-2x2-m | 1 739 kr |
| 19f566d8 | Sideboard 120 cm i vitt med träskiva – låda, skåp och öppna fack | FP-sideboard-120-cm | 1 749 kr |
| 5f730167 | Motionscykel hopfällbar med ryggstöd – 8 motståndslägen, 120 kg | FP-motionscykel-hopfallbar | 1 759 kr |
| 041fa621 | Skrivbord 200 × 60 cm – rustik brun skiva på svart stålstativ | FP-skrivbord-200-cm | 1 759 kr |
| cd473c5e | Nattduksbord 2-pack med tre lådor – greppfri front i vitt | FP-nattduksbord-2-pack | 1 759 kr |
| d5229703 | Skumklossar 11 delar för 1–3 år – sex former i konstläder | FP-skumklossar-11-delar | 1 759 kr |
| 89b2a551 | Leksakskök 100,9 cm med rinnande vatten – kyl, mikro och ugn | FP-leksakskok-80-cm | 1 759 kr |
| 10957741 | Leksakskök i hörn med 14 delar – rinnande vatten och ugn | FP-leksakskok-14-delar | 1 759 kr |

Alla åtta: `needsAiPolish: false`, `draftStatus: "published"` — stämplat via
`/api/admin/mapping` (workflowen "Polering — läs och stämpla mappningsraden",
läge `stampla`), och varje stämpling verifierad genom en helt SEPARAT
`las`-körning mot mappningsraden (åtta körningar, åtta loggar lästa).
Prisgrinden (`1,20 × landedCostSek`, charm99) `stämmer: true` på alla åtta,
ingen slutsåld, ingen låst. `aosomFreightShare` 0,297–0,429 — ingen i närheten
av 0,5-tröskeln. Saldon 20–132.

## ☠️ HÖNSRASTGÅRDEN ÄR EN HAGE, INTE ETT HUS — och det tyska namnet säger fel

Produkten heter `Freilaufgehege … Hühnerstall` i Aosoms feed, alltså både
"rastgård" och "hönshus" i samma sträng. Bilderna avgör och källtexten
instämmer: det är en gånghög inhägnad utan golv, utan rede och utan sittpinne,
och källan skriver själv *"Passt perfekt zu einem Holzstall"*.

⚠️ **Skillnaden är inte språklig.** N28 lämnade `c5541fef` orörd för att ett
HÖNSHUS måste ha rede enligt L 111 (SJVFS 2019:20). Kravet gäller huset; en
hage är en hage. Men det förutsätter att den svenska texten inte påstår att
varan är ett boende. Den svenska sidan skriver därför ut vad varan ÄR i en
egen rubrik — *"Det här är hagen, inte huset"* — och FAQ:n svarar rakt på
"Ingår ett hönshus?" med **Nej**.

Måttmässigt: 200 × 200 cm = **4 m²**, som källan anger för 4–6 höns, alltså
0,67–1,0 m² per höna. Det är mångdubbelt över de täthetstal Jordbruksverkets
föreskrifter arbetar med för frigående höns, och hagen är dessutom ett
komplement till ett hus som köps separat. Ingen regeltolkning behövdes för att
publicera den; det som behövdes var att texten säger sanningen om varutypen.

### ☠️ Och måttbilden bär ett ENHETSFEL som texten inte får ärva

Aosoms egen måttritning (bild 3) märker totalhöjden **"2 cm"**. Stapeln går
från marken till nocken, och spec-raden säger `200H cm`. Det är alltså
tillverkningens eget decimalfel, inte en tolkningsfråga — men en avskrift som
följer BILDEN hade skrivit att en rastgård är två centimeter hög.

Texten använder **200 cm** genomgående. Det tal som däremot BARA står på
bilden och inte i källtexten är takfotens höjd, **146 cm**, och den är
kvitterad i `foto-tal.txt` i stället för att smygas in.

## Urvalet: tjugosex kandidater granskade, nio föll

Kandidaterna togs i prisordning från 1 739 kr och uppåt. Tjugosex granskades i
dubblettskärmen, tio togs till en FÄRSK `las`-körning.

### En föll på SALDO 0 — samma rad som N29 mätte

| id | produkt | pris | `aosomSyncedQty` |
|---|---|---:|---:|
| `6df0ce88` | Aktenschrank / plåtskåp med justerbar hylla | 1 739 kr | **0** |

⚠️ **Talet är oförändrat sedan N29, och stämpeln likaså** (`aosomSyncedAt`
2026-09-02). En rad som fallit ur feeden får aldrig sitt pris omräknat, så
`stämmer: true` och en grön `las`-körning betyder ingenting om köpbarheten —
det är `aosomSyncedQty` som är facit och det talet måste LÄSAS.

### Fyra föll på PUBLICERADE dubbletter, alla med exakt trippelträff

| id | produkt | krockar med |
|---|---|---|
| `515c4cc0` | Fußballtor 300 × 120 × 200 | publicerade `329184c4` *Fotbollsmål 300 × 200 cm*, **identisk trippel** |
| `95095a9b` | Gartenschrank 83 × 40 × 92 | publicerade `616b057f` *Trädgårdsskåp 83 cm med planteringsbord i galvad plåt* |
| `fdd915bc` | Sandkasten 124 × 116 × 146 | publicerade `2606fa30` *Sandlåda med lekstugetak 124 × 116 cm* |
| `1ec62247` | Polytunnel 300 × 200 × 198 | publicerade `b8496223` *Polytunnelväxthus i förzinkat stål* + fyra till |

### Tre kluster föll på att den BILLIGASTE tvillingen ligger under rundans golv

☠️ **Det här är en ny variant av husets interna dubblett, och den är värd att
skriva ned.** Tre kandidater har utkastsyskon med IDENTISK måtttrippel och
nästan identiskt namn — alltså samma fysiska vara flera gånger i Aosoms egen
feed (`#244`). Ingen av dem har någon publicerad motsvarighet, så husets regel
(*ett utkastsyskon utan publicerad sida blockerar inte*) skulle ha släppt fram
dem. Det som stoppar dem är en annan sak:

| kandidat | pris | billigaste syskon | dess pris |
|---|---:|---|---:|
| `b805ee4d` Hundeanhänger | 1 739 kr | `1004b036` | **1 649 kr** |
| `7ed73bad` Hundeanhänger | 1 749 kr | `1004b036` | **1 649 kr** |
| `9429fdc7` Fahrradanhänger | 1 739 kr | `d22b83b1` | **1 449 kr** |
| `e665ebdf` · `64a7e00f` Gokart | 1 759 kr | `2f5c20fc` | **1 529 kr** |

Att publicera 1 739-raden när samma vara finns som utkast för 1 649 hade lagt
ut den DYRASTE tvillingen. Kundpriset är ju inte ett förhandlingsutrymme utan
kostnaden gånger regeln, så det billigare syskonet har en lägre inköpskostnad
— det är en annan feedrad för samma produkt. Rätt drag är att ta den billigaste
när rundan når dit, inte att ta den dyraste för att den råkar ligga först i
prisordning över golvet. **Klustren lämnas orörda och namnges här.**

### En lämnas orörd på en DJURSKYDDSFRÅGA som inte går att avgöra

`cef5747d` (Hunde-Wurfbox, 196 × 96 × 48 cm, 1 759 kr, saldo ej kontrollerat —
den togs aldrig till `las`) är ren i dubblettskärmen och stor till ytan. Det som
stoppar den är L 102 (SJVFS 2020:8), som ställer krav på valplåda i förhållande
till tikens storlek, och källan säger bara *"Geeignet für große und kleinere
Hunderassen"* utan att ange vilka mankhöjder lådan är avsedd för.

☠️ **Samma hållning som N27 tog på kaninstallet `512a4396` och N29 på
sköldpaddslådan `a2bf8b4d`: en fråga som inte går att avgöra säkert på de
uppgifter källan ger publiceras inte.** Det är inte ett konstaterat brott mot
föreskriften — det är ett konstaterat kunskapsglapp, och de två ska inte
skrivas som om de vore samma sak. Raden är **orörd**: inget `las`, ingen
stämpling, ingen Wix-skrivning.

### Sexton kandidater sållades bort FÖRE `las`

| id | produkt | varför |
|---|---|---|
| `cae106e7` | Hundetrolley 112 × 65 × 100 | trippelträff mot publicerade `41fddd87` — samma avvisning som N29 gjorde |
| `6db99b9b` | Hollywoodschaukel 171 × 108 × 154 | exakt publicerad dubblett `2de2c549`, avvisad av N29 |
| `5e3b71a7` · `4207445a` · `e4e8c76b` · `e51647cd` | Barhocker 2-pack | 12 publicerade barbordsidor och 22 barstolssidor; N28 publicerade nyss en till |
| `f5b60acd` · `1936c1f4` · `80501518` | Sessel / Rattansessel | fåtöljfamiljen är den mättade — 225 publicerade sidor, lägst gap per sida i hela katalogen |
| `f50863c6` · `9deed3c1` · `ae766521` | Bürostuhl / gamingstol | elva rundor (K1–K11) har redan gått på kontorsstolar |
| `fd9c5f30` · `1ecdb437` | Hocker mit Stauraum / Gartenbank | förvaringsbänksfamiljen, avvisad av N27 och N28 av samma skäl |
| `e4beca3e` | Sideboard 106 × 30 × 81,2 | trippelträff mot publicerade `7cb38ae8` *Leksakshylla med lådor 105 cm* (105 × 30 × 80) — olika produkt, men en träff är ett skäl att titta, och 32 publicerade sideboardsidor gör det inte värt |
| `a6e01595` | Schaumstoff Bausteine 8-teilig | källan bär INGEN tolkbar måtttrippel, alltså går den inte att dubblettpröva den vägen — och rundan bär redan ett skumklosset |

### Två verifierade kandidater valdes bort med flit

`81bff775` (Gartenbrücke i metall, 135,5 × 74 × 91 cm, 1 769 kr, saldo 86,
`stämmer: true`) är ren i varje spärr och dessutom en HELT NY varukategori —
noll publicerade trädgårdsbroar i katalogen. Den föll bara på att rundan tar
åtta och att sex kandidater delade priset 1 759 kr. **Den ligger orörd som
första kandidat till N31.**

⚠️ Två av dess fem bilder måste dock strykas: position 4 och 5 bär tysk text
inbränd i pixlarna (`Strom` respektive `Schotterstraße`). Det är uppmätt här
så att N31 slipper göra om det.

`86c60239` (Pavillon 294 × 294 × 265 cm, 1 769 kr) och `a7c39a89` (Bartisch-Set
121,5 × 40 × 122 cm, 1 769 kr) är rena i dubblettskärmen men ligger över de
åtta billigaste och togs aldrig till `las`.

## ☠️ FLAGGAT TILL LEONARD: fem affärsbeslut, inget av dem taget här

1. **`cef5747d` — Hunde-Wurfbox, L 102-frågan går inte att avgöra.** Se ovan.
   Raden är orörd.
2. **`a2bf8b4d` — Schildkrötenbox, L 80-frågan går inte att avgöra.** Flaggad
   av N29, fortfarande orörd.
3. **`c5fc0b7b` — Angry Birds-dekaler på en Aosom-vara.** Flaggad av N27,
   fortfarande orörd. Frågan om Aosom har Rovio-licensen är inte besvarad.
4. **`16b8a47c` — papegojburen underskrider SJVFS 2019:15.** Flaggad av N27,
   fortfarande orörd.
5. **`c5541fef` — Zwerghühnerstall underskrider redeskravet.** Flaggad av N28,
   fortfarande orörd.

Ingen av de fem har rörts av den här rundan: inget `las`, ingen stämpling,
ingen Wix-skrivning.

⚠️ **Och en sjätte punkt som är en presentationsfråga, inte ett hinder:** de
tre trailer- och gokart-klustren ovan är sju utkast för tre fysiska varor.
Frågan om de ska pensioneras (`draftStatus: "rejected"`) eller bara lämnas
liggande är Leonards, precis som med `dd8902e8`/`d499532f` i N-seriens tidigare
mätning. Ett osynligt utkast kostar ingenting medan det väntar.

## Dubblettskärmen: full täckning i båda riktningarna

Skärmen kördes som `DUBBLETTMATNING.md` kräver — måtttrippel ur den TYSKA
källans egen text, jämförd mot HELA katalogen i båda riktningarna (publicerade
sidor OCH övriga utkast) — och täckningen räknades i varje svep.

| | omgång 1 (kandidatlista) | omgång 2 (kandidaternas trippel) | omgång 3 (lågt fotavtrycksgolv) |
|---|---:|---:|---:|
| Lästa rader | **5 865** | **5 865** | **5 865** |
| Sidor | 59 | 59 | 59 |
| Utan `plainDescription` | **0** | **0** | **0** |
| Publicerade | 3 039 | 3 039 | 3 039 |
| …med tolkbar trippel | **2 307 (76 %)** | **2 307** | **2 307** |
| Utkast | 2 826 | 2 826 | 2 826 |
| …med tolkbar trippel | **2 735 (97 %)** | **2 735** | **2 735** |

⚠️ `utanText` räknades i varje svep och var **0**. Utan den räknaren hade ett
svep som tappat `fields` på sida två gett noll krockar och sett ut att ha gjort
sitt jobb — det är exakt det felet DUBBLETTMATNING.md mätte upp till två
tiopotenser.

☠️ **Svepet går OFILTRERAT och filtrerar i koden.** Ett `filter` på kroppens
toppnivå är en tyst no-op (`#245`) och inuti `search` avvisas markören med
`400 SE-1141`. `fields` skickas däremot om på VARJE sida — tvärtom mot
`filter`, och båda felen är tysta åt var sitt håll.

☠️ **Mönstret självtestades på BÅDA axelformerna i SAMMA anrop som svepet**,
sju former, innan en enda rad lästes. Svepet avbryter om någon faller:

```
150L x 50B x 39H cm    bokstav EFTER talet    -> [150, 50, 39]     ✓
L130 x B73 x H90 cm    bokstav FÖRE talet     -> [130, 73, 90]     ✓
99,5 × 76 × 91 cm      utan bokstav           -> [99.5, 76, 91]    ✓
92cm x 63cm x 95cm     "cm" efter varje tal   -> [92, 63, 95]      ✓
45 x 45 x 47,5 cm      decimal sist           -> [45, 45, 47.5]    ✓
242B x 87T x 87H cm    B T H                  -> [242, 87, 87]     ✓
L99,5 x B76 x H91 cm   FÖRE med decimal       -> [99.5, 76, 91]    ✓
```

### ⚠️ En tredje omgång behövdes — fotavtrycksgolvet döljer små produkter

`DUBBLETTMATNING.md` kräver att trippeln är rimlig som fotavtryck (största
måttet ≥ 60 cm) innan den jämförs, annars matchar en kartong mot en stol. Tre
av rundans kandidater är MINDRE än så: nattduksbordet är 40 × 30 × 59,5 och
skumklossarna 25 × 25 × 50. Deras produktmått filtrerades alltså bort av
golvet, och det enda som jämfördes var paketmåttet — vilket är precis det
falsklarm golvet finns för att ta bort, fast åt andra hållet: **golvet gör en
liten produkt oprövad, inte ren.**

En tredje omgång kördes därför med kandidaternas FAKTISKA produktmått och utan
golv. Utfallet:

| kandidat | trippel | publicerade träffar | dom |
|---|---|---:|---|
| `cd473c5e` | 40 × 30 × 59,5 | 1 | falsklarm — `15746de3` *Tvättkorg bambu 72 L* (40 × 30 × 60) |
| `d5229703` | 25 × 25 × 50 / 25³ | 2 | falsklarm — en klösträdsgrotta och en uppblåsbar pepparkaksgubbe |
| `e4beca3e` | 106 × 30 × 81,2 | 1 | **äkta träff**, se avvisningen ovan |
| `19f566d8` | 120 × 35 × 75,2 | 0 | — |
| `89b2a551` | 80 × 29,7 × 100,9 | 0 | — |
| `10957741` | 86 × 64 × 84,5 | 0 | — |

**Träffarna på de åtta som blev kvar:**

| kandidat | trippel | publicerade träffar | utkastträffar | dom |
|---|---|---:|---:|---|
| `82d04879` | 200 × 200 × 200 | 0 | 0 | — |
| `19f566d8` | 120 × 35 × 75,2 | 0 (2 falsklarm på skåpets innermått) | 0 | falsklarmen är soptunnor och en kommod på 118 × 39,5 |
| `5f730167` | 105 × 53,5 × 109 | 0 | 0 | — |
| `041fa621` | 200 × 60 × 75 | 0 | 0 | — |
| `cd473c5e` | 40 × 30 × 59,5 | 0 | 0 | falsklarm bortsett, se ovan |
| `d5229703` | 25 × 25 × 50 | 0 | 0 | falsklarm bortsett, se ovan |
| `89b2a551` | 80 × 29,7 × 100,9 | 0 | 0 | — |
| `10957741` | 86 × 64 × 84,5 | 0 (1 falsklarm på paketmåttet) | 0 | falsklarmet är en publicerad tv-bänk |

## Facit bevisat mot skarpa Wix — 8 av 8 på första körningen

`kallor.json` och `bilder.tsv` skrevs av från Wix-svaret, alltså genom exakt
den transkribering huset har mätt upp som felkällan. Båda kontrollerades därför
mekaniskt mot skarpa V3 innan en enda grind kördes: h·31-summa över
`plainDescription` per produkt och hela bildlistan i ordning, jämförd på
servern.

**8 av 8 text LIKA, 8 av 8 bildlista LIKA.** Teckenantalen stämde också exakt —
men det är inte beviset: N27:s fällda avskrift hade RÄTT teckenantal och fel
summa. Det är summan som avgör.

## Nio sakfel hittade — sex av dem bara i bilderna

Husregeln från runda J1 (*"titta på bilderna FÖRE texten"*) betalade sig igen.

- ☠️ **`82d04879`: måttbildens "2 cm" är ett enhetsfel hos tillverkaren.**
  Se avsnittet ovan. Texten skriver 200 cm ur spec-raden.

- ☠️ **`82d04879`: det tyska NAMNET säger `Hühnerstall`, produkten är en hage.**
  Se avsnittet ovan. Det är inte en nyans: den som köper ett hönshus och får en
  hage har inget boende till sina höns.

- ⚠️ **`82d04879`: takfotens höjd, 146 cm, finns bara på måttbilden.** Den är
  det som avgör om en vuxen kan gå in vid sidorna eller bara i mitten, och den
  är kvitterad i `foto-tal.txt`.

- ☠️ **`041fa621`: bordsskivan är TVÅ plattor, och källan nämner det inte
  någonstans.** Bild 1 och 3 visar en tydlig fog tvärs över mitten. Det är
  inget fel i sig — det är så ett bord på två meter får plats i ett paket på
  113 cm — men det är en sak en kund vill veta innan den öppnar kartongen.
  Sidan säger det i brödtexten, i Egenskaper och i FAQ:n.

- ⚠️ **`041fa621`: källan kallar benfästet `dreieckiges Verbindungsdesign`.**
  Bilderna visar BÖJDA hörnbeslag, en kvartsrund kälform. Texten beskriver det
  som bilderna visar.

- ☠️ **`5f730167`: kroppslängdsspannet 140–190 cm står BARA på måttbilden**,
  och måttbilden är den som stryks för tysk text. Talen är kvitterade i
  `foto-tal.txt` så att uppgiften överlever bilden.

- ⚠️ **`5f730167`: hopfälld är cykeln HÖGRE än uppställd** — 135 cm mot 109.
  Det står i källan men är lätt att läsa förbi, och det ändrar var man kan
  ställa undan den. Samma sorts uppgift som N29:s inversionsbänk.

- ☠️ **`10957741`: köket är ett HÖRNKÖK, och den tyska texten säger det inte.**
  Källan beskriver funktionerna men aldrig formen. Bilderna visar en L-formad
  bänkskiva som går runt ett hörn, och det är den egenskap som avgör var i
  rummet möbeln kan stå.

- ⚠️ **`10957741`: källan säger `Weiß+Silber`, bänkskivan är ljus träimitation.**
  Silvret är kran och vred. Sidan skriver "vit med ljus bänkskiva".

Därtill två saker som texten medvetet INTE påstår:

⚠️ **`d5229703`: måttbilden är tvetydig om den stora triangeln har en välvd
öppning genom sig.** Den ljusare blå formen under triangeln kan läsas både som
ett urtag i prismat och som en separat halvcylinder ritad bakom. Bild 1 visar
en GRÖN båge under den blå triangeln, alltså en av de gröna halvcylindrarna
ställd på ända. Texten beskriver därför halvcylindern som det som blir portal
och påstår ingenting om triangeln.

⚠️ **`89b2a551`: det mesta som ser ut som tillbehör på bild 1 är TRYCKT på
stänkskyddet** — burkarna, redskapen på krokarna, växten. Det som är löst
räknas i källans `Lieferumfang` (fem kastruller i rostfritt, två kaffemuggar),
och det är bara det texten lovar.

## Två bilder strukna, båda för tysk text i pixlarna

| id | position | vad bilden är |
|---|---:|---|
| `5f730167` | 3 | tysk badge: *Geeignet für Körpergrößen von 140 cm bis 190 cm* |
| `89b2a551` | 4 | tysk grafik: rubriken LAGERRAUM över Häkchen · Schrank · Lagerregal |

☠️ **Den första kostade rundans enda måttritning på den produkten**, och det
är en verklig förlust — men texten i pixlarna går inte att polera bort, och de
mått bilden bär (105, 53,5, 109, 76–80) står allihop i den tyska spec-raden
ändå. Det enda som BARA fanns på bilden var kroppslängdsspannet, som därför är
kvitterat i `foto-tal.txt`.

⚠️ **Två produkter blir därmed fyrbildsprodukter.** `bygg-media.py` och
`gate-alt.py` räknar antalet ur `bilder.tsv` minus `bilder-bort.tsv` i stället
för att anta fem, så ingen av dem klagade.

De övriga 38 bilderna granskades en och en i kontaktark på 620 px höjd, och de
elva som bar mått lästes i full upplösning. Ingen byte-identisk dubblett fanns
i rundan (md5 på alla 40 hemhämtade filer, noll kollisioner) — den kontroll som
fällde N29:s `346b40f7` position 4.

## Ett husmärke flaggat till Leonard

| id | märke | var |
|---|---|---|
| `5f730167` | SPORTNOW | tryckt på sadelstolpens rör, synligt i bild 1 och i den strukna bild 3 |

Bilderna är BEHÅLLNA. Husets praxis är publicera-och-flagga för
tredjepartsmärken i leverantörens foton. Märket står inte i någon text,
alt-text eller SEO-tagg.

⚠️ N11 valde bort en SPORTNOW-produkt av just det här skälet, och N29
publicerade en. Den bedömningen gäller fortfarande som Leonards — det som är
skrivet här är att raden är publicerad enligt husets praxis och att märket är
uppmätt, inte att frågan är avgjord.

## Gate-genomgång

| Gate | Resultat |
|---|---|
| `kallor.json` + `bilder.tsv` mot skarpa V3 (h·31, server-side) | **8 av 8 text LIKA, 8 av 8 bildlista LIKA** — rent på första körningen |
| Trippelmönstrets självtest (båda axelformerna, i samma anrop som svepet) | **7 av 7 former matchade**, i alla tre svepen |
| `gate.py` (siffergrind mot `kallor.json`, ordlista, flikar, taggar) | **0 fynd i 8 filer, 0 varningar** |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** i 8 texter (6 axelkonflikter i källan, upplysning) |
| `gate-alt.py` | **REN**, 8 produkter, 38 alt-texter, 0 fynd |
| `gate-seo.py` | **0 fynd** i 8 rader |
| `gate-lager.py` (fäller på `<= LAGER_BUFFERT`) | **0 fynd** i 8 produkter, lägsta saldo 20 |
| `gate-sku.py` | **0 fynd** i 8 rader (längsta 26 av 40 tecken) |
| SKU-krock mot ALLA tidigare rundors `sku.tsv` (52 filer, 407 SKU:er) | **8 av 8 unika, noll krockar, noll prefixöverlapp** |
| `gate-superlativ.py` | **REN**, 8 filer, inga kvitterade superlativ behövdes |
| `gate-lankar.py` | 0 fynd, inga korslänkar i rundan |
| Läcksvep över rundans KUNDVÄNDA filer (artikelnummer, husmärke, fraktland, leverantör, stavning, homoglyf, tysk rest) | **0 fynd i 13 filer** |
| Teckensvep mot `TILLATNA_TECKEN` | **0 oväntade tecken** |
| `lib/polish/artikelnummer-lackage.test.ts` | **grön** (3 tester) |
| `gate-kopior.test.ts` + `wixnorm-tvilling.test.ts` | **gröna** (6 tester) |
| Steg 1 (text/namn/slug/visible/SEO) transkriberingsspärr | 0 avvikelser, **8 av 8 skrivna** |
| Steg 2 (media) transkriberingsspärr | 0 avvikelser, **8 av 8 skrivna** |
| Steg 3 (kategori, bulk add-items) | 5 anrop, `totalFailures: 0`, per-rad `success: true` på alla 8 |
| Steg 4 (variant-SKU, round-trip från FÄRSK GET, sist och ensam) | **8 av 8 skrivna**; `options` i både kropp och fältmask, `visible` medskickad |
| Samlad SEPARAT slutläsning av alla fyra stegen | **8 av 8 helt verifierade** |
| Mappningsstämpling + oberoende `las`-verifiering | **8 av 8** |
| `hamta-live.sh` + `livegrind.py` (ISR-medveten live-verifiering) | se nedan |

### ☠️ En STAVNINGSGRIND fällde på korrekt svenska — och ordet byttes, inte listan

`gate.py` fällde `19f566d8` på ordet **`sort`**, som står i `gatelib.STAV_ORD`
därför att det är danska för "svart". Meningen var *"precis den sort som tippar
framåt"*, alltså invändningsfri svenska.

Rätt svar är INTE att stryka ordet ur listan — den regeln är nedskriven två
gånger i `gatelib.py` och den är hela skälet till att de nitton grindkopiorna
en gång drev isär. Meningen skrevs om till *"den sortens möbel"*, vilket inte
matchar `\bsort\b` och dessutom läser bättre. **Grinden hade fel om just den
meningen och rätt om regeln.**

### Axelkonflikterna i källan

`gate-axel.py` rapporterar sex rader där tyskan och den svenska spec-fliken
använder olika bokstav för samma tal (`19f566d8` bredd och djup, `82d04879`
två av tre axlar, `cd473c5e` bredd och djup). Det är en upplysning om KÄLLAN,
inte ett fynd i texten: facit byggs positionellt av `bygg-axelfacit.py` och
rundan skriver måtten som rena tripplar.

⚠️ **`d5229703` är `axellös` med flit.** Källan har inget totalmått, bara
delmått per kloss — och det är sant: ett set med elva lösa delar HAR inget
yttermått. Generatorn märker raden i stället för att gissa, precis som med
isbjörnsparet i M1.

## Kategorier

| id | kategori |
|---|---|
| 82d04879 (hönsrastgård) | Husdjur → Burar, Kläder & Tillbehör |
| 19f566d8 (sideboard) | Hem & Inredning → Förvaring & Organisering |
| cd473c5e (nattduksbord) | Hem & Inredning → Förvaring & Organisering |
| 5f730167 (motionscykel) | Sport & Fritid → Träning & Gym |
| 041fa621 (skrivbord) | Hem & Inredning |
| d5229703 (skumklossar) | Barn & Familj → Leksaker & Spel |
| 89b2a551 (leksakskök) | Barn & Familj → Leksaker & Spel |
| 10957741 (leksakskök) | Barn & Familj → Leksaker & Spel |

Kategori-id:na lästes ur ett FÄRSKT `categories/v1/categories/query`-svar
(54 kategorier) — aldrig ur minnet, aldrig ur en tidigare rundas anteckning.

⚠️ **`041fa621` får toppkategorin `Hem & Inredning` utan löv.** Trädet har
inget möbel- eller kontorslöv, och runbooken säger att toppkategorin räcker då
— samma bedömning N29 gjorde för sittmöblerna.

⚠️ Slutläsningen visar `antalKat: 2` på alla åtta — den kopplade kategorin plus
Wix egna `All Products`, som Wix lägger till själv.

☠️ **Facit för steg 3 är bulk-svarets `itemMetadata` per rad, inte en snabb
återläsning.** Läsprojektionen släpar efter skrivningen (`#281`), så en
omedelbar `GET` kan UNDERrapportera. Här svarade alla fem anropen
`totalFailures: 0` med `success: true` på varenda rad, och den senare,
separata slutläsningen bekräftade det oberoende.

## Fotoräknade tal, kvitterade

`foto-tal.txt` bär åtta rader. Alla är avlästa på produktens egen måttbild
eller räknade på ett foto, och ingen står i den tyska källtexten:

| id | tal | vad |
|---|---:|---|
| `82d04879` | 146 | takfotens höjd, avläst på måttbilden (bild 3) |
| `82d04879` | 2 | antal reglar på dörren, räknade på bild 1 och 4 |
| `041fa621` | 2 | antal plattor i bordsskivan, fogen avläst på bild 1 och 3 |
| `d5229703` | 6 | antal olika former, räknade på måttbilden (bild 3) |
| `5f730167` | 140 | nedre kroppslängd, avläst på måttbilden (bild 3) |
| `5f730167` | 190 | övre kroppslängd, avläst på måttbilden (bild 3) |
| `10957741` | 45 | bänkskivans höjd, avläst på måttbilden (bild 3) |
| `10957741` | 4 | antal köksredskap i trä, räknade på bild 1 |

## Kort: medvetet uppskjutet, inte glömt

Samma kostnadsavvägning som N15–N29: inget `kort-filer.tsv` finns i rundans
katalog, så ingen produkt fick ett eget faktakort.
`bygg-medieskrivning.py` skriver då bildlistan exakt som `bygg-media.py`
lämnade den, och rapporterar "inget kort denna runda" per produkt — ett
uttalat val, inte en tyst utelämning.

## ☠️ Korrekturläsningen av den egna svenskan är ett EGET steg

N29 mätte upp två böjningsfel (`slätt` för `slät`, `en ryck` för `ett ryck`)
som nådde live trots tolv gröna grindar. Ingen mönstergrind i huset kan se dem
— båda är korrekt stavade svenska ord — och `gatelib` kan inte få en genusgrind
utan att fälla korrekt text.

Den här rundan lade därför in ett uttryckligt korrekturpass FÖRE den
kontrollsummerade skrivningen: alla åtta texterna lästes igenom med taggarna
strippade, mening för mening, med genus och adjektivböjning som enda fråga.
Fem rader ändrades, och ingen av dem hade fällts av någon grind:

| id | stod | ändrat till | varför |
|---|---|---|---|
| `cd473c5e` | …blir **densamma** på båda sidor | **desamma** | tre uppräknade subjekt kräver plural |
| `cd473c5e` | **Släpp inte lådan att falla** | **Låt inte lådan falla** | anglicism, inte svensk konstruktion |
| `041fa621` | …som **håller bordet från att** vagga | …som **hindrar bordet från att** vagga | anglicism (*keeps from*) |
| `041fa621` | Benen **är svartlackerat fyrkantsrör** | Benen **är av** svartlackerat fyrkantsrör | numerusbrott mellan subjekt och predikatsfyllnad |
| `d5229703` | …**mjuk** att landa på | **Det är mjukt** att landa på | predikativet band till fel led (konstläder är t-genus) |

Därtill fyra rena läsbarhetsrättelser (`smalna av gången`, `till post som ska
sorteras eller en kaffebryggare`, `sist av allt helt`, `den påfyllda hon`).

☠️ **Poängen är att det är ett steg, inte en känsla.** Det som skiljer det från
N29:s fynd är inte att texten var bättre skriven, utan att läsningen gjordes
FÖRE skrivningen i stället för efter publiceringen.

## Live-verifiering

`hamta-live.sh 120` + `livegrind.py` mot de publicerade sidorna. Alla åtta
slugs är NYA adresser (produkterna låg på tyska slugs innan), så den varma
träffen gav `age=0` på alla åtta — en förstagångsrendering, inte en cachad
gammal sida. Skriptet väntade därför ut hela stale-fönstret (305 s) plus pausen
innan den skarpa hämtningen.

**8/8 HTTP 200 (148 580–154 759 B), 8/8 REN, 0 avvikelser i den PUBLICERADE
texten**, och grinden avslutar med `exit 0`.

Orddiffen mot källfilen är **0 på alla åtta** (469–634 ord per sida). `REN`
betyder att samtliga delkontroller gick igenom, inte bara orddiffen:
homoglyfsvepet, sid-, alt- och SEO-svepen, de tre obligatoriska flikrubrikerna
som `<summary>`-element, brödsmulans andra led (alltså en riktig kategori, inte
`Hem / Butik / produkt`) och `OutOfStock`-kollen.

⚠️ **Åldrarna lästes innan svepet togs på allvar**, och de är enhetliga:
**130 sekunder på alla åtta**, alltså precis pausen mellan omträffen och den
skarpa hämtningen. Ingen sida serverades ur en äldre rendering — till skillnad
från N26:s `66d781f8` (`age: 431`) och N27:s `e5049d65` (`age: 450`).
**Läs `age` innan du litar på ett svep.**

### Och den andra genomläsningen gav noll

Enligt N29:s lärdom lästes den PUBLICERADE svenskan igenom en andra gång, med
genus och adjektivböjning som enda fråga — 119 satser med adjektivfras,
utplockade mekaniskt ur live-texten och lästa en och en. **Noll fynd.**

Det är väntat men inte överflödigt: orddiffen är 0, alltså ÄR live-texten
filens text, och filen korrekturlästes före skrivningen. Att läsa om den på
den publicerade sidan är det som skiljer ett antagande från ett kvitto — och
det var precis i det ledet N29 hittade sina två fel.

Rundans fyra Wix-skrivsteg är dessutom redan oberoende verifierade var för sig
i en separat, senare läsning (tabellen ovan), så live-grinden är det FEMTE
ledet, inte det enda.

## Sammanfattning

Alla åtta produkter är publicerade, stämplade och verifierade i flera separata
led: facit mot skarpa Wix innan grindarna (8/8 LIKA på första körningen),
textinnehållet efter skrivningen mot fil-hash i en senare, separat läsning,
bild/kategori/SKU/pris i samma slutläsning (8/8 helt verifierade, med både
produktens och VARIANTENS `visible: true` och priset oförändrat),
mappningsstämpeln via åtta oberoende `las`-körningar, och den publicerade sidan
via `livegrind.py`.

Nio sakfel rättades före skrivningen, sex av dem synliga bara i bilderna. Fem
affärsbeslut är flaggade till Leonard och orörda. Rundan räknas som klar utom
faktakorten, som är en medveten uppskjutning av samma skäl som N15–N29.
