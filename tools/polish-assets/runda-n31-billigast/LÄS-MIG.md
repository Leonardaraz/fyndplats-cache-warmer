# Runda N31 — åtta produkter, 1 769–1 799 kr

Åtta Aosom-utkast polerade och publicerade: en trädgårdsbro i metall, en
paviljong, ett barbord med vinställ och två pallar, ett 2-pack matstolar, en
spinningcykel, ett fotbollsspel, en gräsklippare och en hängsoffa.

Rundan börjar på **`81bff775`**, som N30 verifierade ren och uttryckligen
lämnade som första kandidat hit därför att den rundan redan var full på åtta.
Den var fortfarande ren vid en FÄRSK `las` (saldo 86, `stämmer: true`), och
priset 1 769 kr är också rundans lägsta. Därifrån går urvalet billigast-först
och landar på 1 799 kr.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 81bff775 | Trädgårdsbro 135,5 cm i svart metall – bågformat däck och räcken | FP-tradgardsbro-135-cm | 1 769 kr | 86 |
| 86c60239 | Paviljong 294 × 294 cm med dubbeltak – myggnät och 195 cm fri höjd | FP-paviljong-294-cm | 1 769 kr | 65 |
| a7c39a89 | Barbord 121,5 cm med vinställ och glashållare – två barpallar ingår | FP-barbord-med-vinstall | 1 769 kr | 156 |
| cae81077 | Matstolar 2-pack med lammullskänsla – svarta ben, bär 120 kg | FP-matstolar-2-pack | 1 799 kr | 37 |
| 07d1208e | Spinningcykel med filtbroms – sadel 78–93 cm, LCD och mobilhållare | FP-spinningcykel-85-cm | 1 799 kr | 81 |
| cec4d9a9 | Fotbollsspel 121 cm med 22 spelare – två räkneverk och minibollar | FP-fotbollsspel-121-cm | 1 799 kr | 180 |
| fda8a9de | Gräsklippare 40 cm för 36 V-batteri – 45 L box, batteri ingår inte | FP-grasklippare-40-cm | 1 799 kr | 114 |
| 180f81c1 | Hängsoffa 2-sits i konstrotting – kedjor och dynor, stativ ingår inte | FP-hangsoffa-2-sits | 1 799 kr | 25 |

Alla åtta: `needsAiPolish: false`, `draftStatus: "published"` — stämplat via
`/api/admin/mapping` (workflowen "Polering — läs och stämpla mappningsraden",
läge `stampla`), och varje stämpling verifierad genom en helt SEPARAT
`las`-körning mot mappningsraden (åtta körningar, åtta loggar lästa).
Prisgrinden (`1,20 × landedCostSek`, charm99) `stämmer: true` på alla åtta,
ingen slutsåld, ingen låst. `aosomFreightShare` 0,29–0,427 — ingen i närheten
av 0,5-tröskeln. Saldon 25–180.

## ☠️ BJÖRNEN FINNS INTE — källan påstår den två gånger

`cec4d9a9`:s tyska text säger det på två ställen:

```
Der Tischkicker punktet mit niedlichem Bärendesign …
✔ Lebendiger Stil mit grünem Spielfeld und niedlichem Bärenmuster
```

Spelplanen på fotona är en vanlig grön plan med vita linjemarkeringar. Det
finns ingen björn någonstans — inte på planen, inte på sargen, inte på benen,
inte på figurerna. Påståendet är med all sannolikhet överfört från en annan
artikel i leverantörens copy.

⚠️ **Ingen grind kunde ha fångat det.** Ordet står i källan, alltså är
siffergrinden ren och mönstergrindarna rena; det är ett SANT påstående om en
produkt som inte finns, precis den klass runda J1 skrev ned. Det som fångade
det var husregeln *titta på bilderna FÖRE texten*: björnen letades efter på
bild 1 i full upplösning innan brödtexten skrevs.

Den svenska texten nämner därför ingen björn. Det den säger om utseendet —
grön spelplan, ljus träton i sargen, ljusgrå ben, röda och gula utespelare med
blå målvakter — är avläst på fotot.

## ☠️ MÅTTRITNINGEN BÄR ETT SIFFERFEL: 365 cm där spec-raden säger 265

`86c60239`:s egen måttbild märker totalhöjden **365 cm**. Spec-raden säger
`294L x 294B x 265H cm`.

Ritningen avgör frågan mot sig själv. Den bär två lodräta pilar i samma
projektion, och den ena är känd: genomgångshöjden **195 cm**, som också står i
källtexten. Mätt i bildens pixlar spänner 195-pilen 520 px, alltså 2,67 px/cm.
365-pilen spänner 710 px — **266 cm** på ritningens egen skala. Det är
spec-radens 265, inte 365.

Det är alltså tillverkningens eget sifferfel, samma klass som N30:s
`82d04879`, vars måttbild märkte en 200 cm hög rastgård med **"2 cm"**. Texten
använder 265 cm genomgående.

⚠️ **Och ritningen bär ett tal som INTE står i källtexten:** markytan
**285 × 285 cm**. Taket är 294 × 294, alltså skjuter det ut nio centimeter åt
varje håll över fötterna — precis den uppgift en kund behöver för att veta om
paviljongen får plats. Talet är kvitterat i `foto-tal.txt`.

## ☠️ HÄNGSOFFAN HAR INGET STATIV, och källan säger det på en enda rad

`180f81c1`:s `Technische Daten` slutar med:

```
✔ Hinweis: Der Ständer ist nicht im Lieferumfang enthalten
```

Det är hela beskedet, sist i en lista på nio rader, och det avgör vad kunden
faktiskt får. Produkten är soffan plus kedjor; upphängningspunkten köps eller
finns redan.

⚠️ **Källan är dessutom oense med sig själv om varutypen.** `Lieferumfang`
säger `1 x Rattan-Hängesessel` — en hängSTOL — medan namnet, måtten
(115 × 66 cm, sits 110 × 54) och varenda bild visar en tvåsitsig BÄNK. Måtten
och bilderna vinner.

Det står därför i produktnamnet (*"stativ ingår inte"*), i första stycket, i
en egen rubrik, i Egenskaper och som första FAQ-rad. Samma hållning som N30 tog
på hönsrastgården: när det tyska namnet säger fel varutyp är det texten som
måste säga vad varan ÄR.

## Urvalet: 5 865 rader svepta, 27 kandidater i kollisionskollen, 10 till `las`

Kandidaterna togs i prisordning från 1 759 kr och uppåt — golvet N30 slutade
på. Ingen ny kandidat fanns kvar på 1 759 kr som inte redan var avvisad, så
rundan börjar på 1 769.

### Dubblettskärmen: full täckning i båda riktningarna

| | omgång 1 (kandidatlista) | omgång 2 (kandidaternas trippel) |
|---|---:|---:|
| Lästa rader | **5 865** | **5 865** |
| Sidor | 59 | 59 |
| Utan `plainDescription` | **0** | **0** |
| Publicerade | 3 047 | 3 047 |
| …med tolkbar trippel | **2 315 (76 %)** | **2 315** |
| Utkast | 2 818 | 2 818 |
| …med tolkbar trippel | **2 727 (97 %)** | **2 727** |

⚠️ `utanText` räknades i varje svep och var **0**. Utan den räknaren hade ett
svep som tappat `fields` på sida två gett noll krockar och sett ut att ha gjort
sitt jobb — det är exakt det felet `DUBBLETTMATNING.md` mätte upp till två
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

### ☠️ EN LICENSIERAD TREDJEPARTSRÄTTIGHET — rundans billigaste kandidat

`c37e0018` (Elektro-Kinderfahrzeug VW Käfer, **1 759 kr**, ren i
dubblettskärmen) är rundans billigaste kandidat och den är **orörd**. Källan
säger det rakt ut:

```
✔ Lizenziert von Volkswagen Beetle für ein authentisches Fahrerlebnis
```

Det är en namngiven licensierad tredjepartsrättighet i den tyska källtexten,
alltså precis det fall husets regel säger att man inte ska publicera, inte
pensionera och inte röra. Raden är orörd: inget `las`, ingen stämpling, ingen
Wix-skrivning.

⚠️ **Och den observation som gör det till ett affärsbeslut och inte en
självklarhet:** katalogen har redan publicerade elbilar med licensierade
bilmärken — `fde98f23` *Elbil barn Audi Q8 e-tron Sportback 12V* (2 399 kr)
och `b0dbfc97` *Elbil barn BMW i4 12V 115 cm* (3 099 kr), båda polerade av
tidigare rundor. Om de är godkända är VW-bubblan det också; om VW-bubblan inte
är det bör de två granskas om. **Frågan hör till Leonard, och den här rundan
avgör den inte.**

### Fyra föll på PUBLICERADE dubbletter, alla med exakt trippelträff

| id | produkt | pris | krockar med |
|---|---|---:|---|
| `a4e3545d` | Gartenschrank 79 × 43 × 92 | 1 769 kr | publicerade `dd08c210` *Trädgårdsskåp 79 cm med arbetsbänk i galvad plåt* (1 659 kr), **identisk trippel** |
| `cf18cd15` | Kinder Elektroauto 98 × 49,5 × 43 | 1 779 kr | publicerade `fde98f23` *Elbil barn Audi Q8* (2 399 kr) **+ tre utkastsyskon** |
| `2967c62c` | Rudergerät 138 × 62 × 50 | 1 779 kr | publicerade `7a095db9` *Roddmaskin för hemmet* (2 269 kr), **identisk trippel** |
| `1ec62247` · `95095a9b` · `515c4cc0` · `fdd915bc` | polytunnel, trädgårdsskåp, fotbollsmål, sandlåda | 1 769–1 779 kr | redan avvisade av N30 mot publicerade sidor |

### ☠️ Sju kluster föll på att den BILLIGASTE tvillingen är ett utkast

Samma klass som N30 skrev ned, och den är större den här gången — sju kluster i
stället för tre. Ingen av kandidaterna har en publicerad motsvarighet, så
husets gamla regel (*ett utkastsyskon utan publicerad sida blockerar inte*)
hade släppt fram dem allihop. Det som stoppar dem är att en BILLIGARE identisk
tvilling ligger som utkast någon annanstans i kön:

| kandidat | pris | billigaste syskon | dess pris | vad som binder |
|---|---:|---|---:|---|
| `b6e44df4` Heimtrainer 2-in-1 | 1 779 kr | `58c60fb4` · `21a338f4` | 1 799 / 1 899 kr | identiskt NAMN och trippel 105 × 48 × 118 |
| `2437acc2` Kletter-/Rutschspielzeug | 1 779 kr | `069b34de` | **1 599 kr** | identiskt namn, trippel 147 × 49 × 47 |
| `41e74ad1` Elektro-Kinderquad | 1 779 kr | `252cbea7` | **1 599 kr** | identiskt namn och trippel 85 × 55,5 × 62 |
| `662a3683` Bodensofa | 1 799 kr | `33cde470` | **1 699 kr** | identisk trippel 102 × 73 × 60 (+ `22cfc372` 1 869 kr) |
| `3c992c78` Ganzkörperspiegel 150 × 40 | 1 799 kr | `5dce837b` | **1 659 kr** | 40 × 40 × 149 mot 40 × 40 × 149,5 |
| `cd9b4686` Klapptisch | 1 799 kr | `a6bd7d56` | **1 599 kr** | identiskt namn och trippel 169 × 60 × 75 |
| `b4e961b7` Go-Kart | 1 799 kr | `d0ab51e9` · `a23a9d86` | **1 659 kr** | identisk trippel 100 × 58 × 58,5; ligger dessutom inom toleransen för N30:s redan flaggade gokart-kluster |

⚠️ **`b6e44df4` är den intressanta:** den är BILLIGAST i sitt eget kluster
(1 779 mot 1 799 och 1 899), alltså hade den gamla regeln haft rätt om just
den. Men de tre är tre sidor för en fysisk vara, och att publicera en av dem
medan de två andra ligger kvar som utkast är en presentationsfråga som inte är
avgjord. **Alla sju klustren lämnas orörda och namnges här.**

### Tre lämnas orörda på en DJURSKYDDSFRÅGA som inte går att avgöra

| id | produkt | pris | trippel |
|---|---|---:|---|
| `1d344d6d` | Kleintierstall med Freigehege och ramp | 1 769 kr | 122 × 63 × 92 |
| `6e20595e` | Freigehege Kleintierstall, Kaninchenstall | 1 799 kr | 120 × 120 × 60 |
| `6d806998` | Hasenstall 2 Etagen | 1 799 kr | 147 × 54 × 84 |

Alla tre är kaninboenden. `1d344d6d`:s källa är den tydligaste och den avgör
ingenting — den säger uttryckligen att köparen får räkna själv:

```
Der Käufer muss die Anzahl der Tiere bestimmen, die in den Stall passen,
je nach Rasse und Größe.
```

☠️ **Samma hållning som N27 tog på kaninstallet `512a4396`, N29 på
sköldpaddslådan `a2bf8b4d` och N30 på valplådan `cef5747d`: en fråga som inte
går att avgöra säkert på de uppgifter källan ger publiceras inte.** L 80
(SJVFS 2019:15) ställer krav på yta och höjd i förhållande till djurets vikt
och antal, och källan anger varken ras, vikt eller avsett antal. Det är ett
konstaterat kunskapsglapp, inte ett konstaterat brott mot föreskriften, och de
två ska inte skrivas som om de vore samma sak. Raderna är **orörda**: inget
`las`, ingen stämpling, ingen Wix-skrivning.

### Sexton sållades bort FÖRE `las`

| id | familj | varför |
|---|---|---|
| `4207445a` · `e4e8c76b` · `e51647cd` · `09c10d30` | Barhocker 2-pack | 12 publicerade barbordsidor och 22 barstolssidor; avvisade av N28 och N30 av samma skäl |
| `f5b60acd` · `1936c1f4` · `80501518` · `33ccacba` | Sessel / Polstersessel | fåtöljfamiljen är den mättade — 225 publicerade sidor, lägst gap per sida i hela katalogen |
| `f50863c6` · `9deed3c1` · `ae766521` · `68db1b39` | Bürostuhl / gamingstol | elva rundor (K1–K11) har redan gått på kontorsstolar |
| `1ecdb437` · `657da149` · `59567c6b` | Gartenbank / Hocker mit Stauraum | förvaringsbänksfamiljen, avvisad av N27, N28 och N30 |
| `e4beca3e` · `a6e01595` | sideboard, skumklossar 8-delar | avvisade av N30, oförändrade |

### Sex kandidater föll på OUT_OF_STOCK i Wix

`2ca1a259` · `55f4c0d9` · `d93d729a` · `58c60fb4` · `7e08f1df` · `3da48fb6`
står som `OUT_OF_STOCK` i katalogen och togs aldrig vidare. Saldot LÄSTES,
det antogs inte — `gate-lager.py` fäller numera på allt som ligger på eller
under `LAGER_BUFFERT` (3), eftersom butikens `synligtSaldo()` visar 0 där.

### Tre verifierade kandidater valdes bort med flit

| id | produkt | pris | varför inte |
|---|---|---:|---|
| `0263494c` | Faltbarer Fahrradanhänger (hund) | 1 799 kr | ren i varje spärr, `stämmer: true`, saldo 68 — men **tre av fem bilder bär tysk text inbränd** (`Die Gesamtbreite des Produkts beträgt 70 cm…`, `MEHRERE EINGÄNGE`, `INSTALLATION DES ANSCHLUSSES`). Kvar blir två bilder, vilket är för tunt för en produktsida. ⚠️ Bilderna bär dessutom **PawHut** i klartext. Mätt här så att nästa runda slipper göra om det. |
| `4fc0b3b5` | Softbaustein-Set 12 delar | 1 799 kr | ren i varje spärr, saldo 102, `stämmer: true`. N30 publicerade nyss ett skumklosset (`d5229703`), och katalogen bär ytterligare två 7-delarsset som utkast. Presentationsfrågan är inte avgjord. |
| `9fb1ff7f` | Tunnelgewächshaus 445 × 300 × 205 | 1 799 kr | ren i dubblettskärmen, togs aldrig till `las` — fel säsong i mitten av september, och rundan var full |

## Facit bevisat mot skarpa Wix — 8 av 8 på första körningen

`kallor.json` och `bilder.tsv` skrevs av från Wix-svaret, alltså genom exakt
den transkribering huset har mätt upp som felkällan. Båda kontrollerades därför
mekaniskt mot skarpa V3 innan en enda grind kördes: h·31-summa över
`plainDescription` per produkt och hela bildlistan i ordning, jämförd på
servern.

**8 av 8 text LIKA, 8 av 8 bildlista LIKA.** Teckenantalen stämde också exakt —
men det är inte beviset: N27:s fällda avskrift hade RÄTT teckenantal och fel
summa. Det är summan som avgör.

## Elva sakfel hittade — sju av dem bara i bilderna

Husregeln från runda J1 (*"titta på bilderna FÖRE texten"*) betalade sig igen.

- ☠️ **`cec4d9a9`: björnen finns inte.** Se avsnittet ovan. Källan påstår den
  två gånger; fotona visar en vanlig grön plan.

- ☠️ **`07d1208e`: den importerade spec-radens FÄRG är fel.** Raden säger
  `Färg: Weiß, Beige, Braun`. Den tyska `Technische Daten` säger `Schwarz`, och
  varenda bild visar en SVART cykel med RÖDA detaljer — sadel, displayhållare,
  motståndsvred och en orange ring på svänghjulskåpan. Sidan skriver svart med
  röda detaljer.

- ☠️ **`07d1208e`: pulsmätning påstås i ingressen men finns inte i listan.**
  Ingressen räknar upp `Herzfrequenz`; punktlistan säger `Zeit,
  Geschwindigkeit, Distanz und Kalorienverbrauch` och den (strukna)
  LCD-grafiken listar samma fyra plus ett svepläge. Inga pulsgivare syns på
  styret. **Texten påstår därför ingen puls** och räknar upp de fyra värden
  två källor av tre är överens om.

- ☠️ **`180f81c1`: stativet ingår inte, och källan säger det en gång.** Se
  avsnittet ovan.

- ☠️ **`86c60239`: måttbildens 365 cm är ett sifferfel för 265.** Se avsnittet
  ovan, med mätningen mot ritningens egen skala.

- ☠️ **`fda8a9de`: namnet läser som en sladdklippare, varan är en
  batteriklippare utan batteri.** `Elektro Rasenmäher 800 W` ser ut som en
  maskin man sätter i ett uttag. Källan säger `36V 800W bürstenloser Motor` och
  `Dieses Produkt enthält keinen Akku oder Ladegerät`. Att batteriet köps
  separat står i första stycket, i en egen rubrik, i Egenskaper och som första
  FAQ-rad. ⚠️ Källans `Stromkabel: 1,1 m` nämns INTE i den svenska texten —
  ingen kabel syns på något foto, och att skriva ut talet hade gjort en redan
  tvetydig uppgift värre.

- ⚠️ **`a7c39a89`: det är inte ett rektangulärt bord.** Källan skriver
  *"einen rechteckigen Tisch"*. Bild 1 och måttbilden visar att ena änden är
  ett smalt hylltorn som BÄR skivan i stället för ett benpar — med glashållare
  under den översta hyllan, ett öppet fack, två vinställ och en bottenhylla.
  Det är formen som avgör var möbeln kan stå, och den svenska texten har en
  egen rubrik om den.

- ⚠️ **`cae81077`: ryggskalet böjer sig framåt till två låga armstöd.** Det
  nämns inte i något mått och i ingen punkt i källan. Det syns direkt i bild 1
  och 3, och det ändrar hur stolen känns att sitta i.

- ⚠️ **`81bff775`: de 91 cm är från MARKEN, inte från gångytan.** Källan
  skriver *"Mit ihren 91 cm hohen Sicherheitsgeländern"*, vilket läses som
  räckeshöjd ovanför däcket. Talet är produktens totalhöjd
  (`135,5L x 74B x 91H`), och däcket välver sig dessutom 12 cm på mitten.
  Texten skriver *"Från marken till räckets överkant är det 91 cm"*.

- ⚠️ **`81bff775`: sidobalkarna slutar i fyra fotplattor MED FÄSTHÅL.** Bara
  synligt på bild 1 i full upplösning. Det avgör om bron går att skruva fast,
  vilket är en säkerhetsfråga på en bro man går på. Antalet är kvitterat i
  `foto-tal.txt`.

- ⚠️ **`86c60239`: markytan 285 × 285 cm står bara på ritningen.** Taket är
  294 × 294. Kvitterat i `foto-tal.txt`.

Därtill en sak som texten medvetet INTE påstår:

⚠️ **`a7c39a89`: bordsskivans höjd över golvet är inte dimensionerad någonstans.**
Måttbilden märker tornets 122 cm, skivans 120 cm och pallarnas 60 cm, men inte
höjden till bordsytan. Den går att räkna fram ur ritningens pixlar till ungefär
88–90 cm — och det är en härledning, inte en avläsning. Sidan anger därför
tornets höjd och pallarnas höjd och påstår ingenting om bordsytans.

## Fyra bilder strukna, alla för tysk text i pixlarna

| id | position | vad bilden är |
|---|---:|---|
| `81bff775` | 4 | bron över en bäck, med **Strom** inbränt i nedre vänstra hörnet |
| `81bff775` | 5 | bron på en grusgång, med **Schotterstraße** inbränt i nedre högra hörnet |
| `07d1208e` | 4 | tysk grafik: *Multifunktions-LCD-Monitor* med Geschwindigkeit, Zeit, Entfernung, Verbrannte Kalorien |
| `07d1208e` | 5 | tysk grafik: *PRAKTISCHE DETAILS* med Rutschfester Griff, Ergonomischer Sitz, Pedale mit Befestigungsgurten |

☠️ **`81bff775`:s två är exakt de N30 mätte upp och skrev ned**, så den
kontrollen behövde bara bekräftas, inte göras om. Det är vad en anteckning i en
föregående rundas LÄS-MIG är till för.

⚠️ **Två produkter blir därmed trebildsprodukter.** `bygg-media.py` och
`gate-alt.py` räknar antalet ur `bilder.tsv` minus `bilder-bort.tsv` i stället
för att anta fem, så ingen av dem klagade. Måttritningen finns kvar på båda —
det var livsstilsbilderna som föll, inte fakta.

De övriga 36 bilderna granskades en och en i kontaktark på 620 px höjd, och de
åtta som bär mått lästes i full upplösning. Ingen byte-identisk dubblett fanns
i rundan (md5 på alla 40 hemhämtade filer, noll kollisioner) — den kontroll som
fällde N29:s `346b40f7` position 4.

## Fyra husmärken flaggade till Leonard, på tre produkter

| id | märke | var |
|---|---|---|
| `fda8a9de` | **Outsunny** | stort på gräsboxen, synligt i alla fem bilderna, plus en liten logotyp på batterikåpan |
| `07d1208e` | **HOMCOM** | på ramen vid vevpartiet, synligt i bild 1 |
| `cec4d9a9` | **JOZO** | *"JOZO Game table"* tryckt på sargens långsida |
| `cec4d9a9` | **GOPLUS** | på det tvärgående staget mellan benen |

Bilderna är BEHÅLLNA. Husets praxis är publicera-och-flagga för
tredjepartsmärken i leverantörens foton. Inget av märkena står i någon text,
alt-text eller SEO-tagg.

⚠️ **`cec4d9a9` bär TVÅ olika märken samtidigt**, och varken `JOZO` eller
`GOPLUS` står i `gatelib.MARKEN`. De fälldes alltså inte av någon grind — de
hittades på fotot. Orden är medvetet INTE tillagda i listan här: ordlistan får
bara byggas på när ett ord faktiskt riskerar att hamna i vår egen text, och de
här sitter i pixlar vi inte skriver.

## ☠️ En grind saknade ett tecken huset redan publicerar — `³`

`gate-seo.py` är den enda grind som läser `TILLATNA_TECKEN`, och den läser bara
`seo.tsv`. `cae81077`:s brödtext säger *"densitet 24 kg/m³"*, alltså i en fil
grinden aldrig tittar i. Ett svep över rundans SAMTLIGA kundvända filer mot
samma lista hittade tecknet direkt.

Uppmätt över alla rundors källfiler: `³` ligger redan ute på minst två
publicerade sidor — K13:s `a3a8d261` (*"25 kg/m³"*) och N26:s `a23ea344`
(*"15,2 m³ per minut"*), båda bekräftade i rundornas egna `live/`-hämtningar.

Det är alltså exakt fallet raden om `Ø` beskriver: **ett tecken vi redan
publicerar ska stå i listan, inte strykas ur texten för att en grind inte känner
igen det.** Skillnaden mot `Ø` är att `³` aldrig FÄLLDE något, och just därför
var hålet tyst. Listan fick `²` när någon skrev om en YTA; ingen tänkte på
VOLYMER.

`³` är tillagt i `gatelib.TILLATNA_TECKEN` med mätningen nedskriven vid
konstanten. **Regeln: svep brett — en grind som bara läser en fil mäter bara
den filen.**

## Gate-genomgång

| Gate | Resultat |
|---|---|
| `kallor.json` + `bilder.tsv` mot skarpa V3 (h·31, server-side) | **8 av 8 text LIKA, 8 av 8 bildlista LIKA** — rent på första körningen |
| Trippelmönstrets självtest (båda axelformerna, i samma anrop som svepet) | **7 av 7 former matchade**, i båda svepen |
| `gate.py` (siffergrind mot `kallor.json`, ordlista, flikar, taggar) | **0 fynd i 8 filer, 0 varningar** |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** i 8 texter (1 axelkonflikt i källan, upplysning) |
| `gate-alt.py` | **REN**, 8 produkter, 36 alt-texter, 0 fynd |
| `gate-seo.py` | **0 fynd** i 8 rader |
| `gate-lager.py` (fäller på `<= LAGER_BUFFERT`) | **0 fynd** i 8 produkter, lägsta saldo 25 |
| `gate-sku.py` | **0 fynd** i 8 rader (längsta 23 av 40 tecken) |
| SKU-krock mot ALLA tidigare rundors `sku.tsv` (53 filer, 417 SKU:er) | **8 av 8 unika, noll krockar, noll prefixöverlapp** |
| `gate-superlativ.py` | **REN**, 8 filer, inga kvitterade superlativ behövdes |
| `gate-lankar.py` | 0 fynd, inga korslänkar i rundan |
| Läcksvep över rundans KUNDVÄNDA filer (artikelnummer, husmärke, fraktland, leverantör, stavning, homoglyf, tysk rest) | **0 fynd i 13 filer** |
| Teckensvep mot `TILLATNA_TECKEN` | 1 fynd (`³`), se avsnittet ovan; **0 efter lagningen** |
| `lib/polish/artikelnummer-lackage.test.ts` | **grön** (3 tester) |
| `gate-kopior.test.ts` + `wixnorm-tvilling.test.ts` | **gröna** (6 tester) |
| Steg 1 (text/namn/slug/visible/SEO) transkriberingsspärr | 0 avvikelser, **8 av 8 skrivna** |
| Steg 2 (media) transkriberingsspärr | 0 avvikelser, **8 av 8 skrivna** |
| Steg 3 (kategori, bulk add-items) | 10 anrop, `totalFailures: 0`, per-rad `success: true` på alla 14 |
| Steg 4 (variant-SKU, round-trip från FÄRSK GET, sist och ensam) | **8 av 8 skrivna**; `options` i både kropp och fältmask, `visible` medskickad |
| Samlad SEPARAT slutläsning av alla fyra stegen | **8 av 8 helt verifierade** |
| Mappningsstämpling + oberoende `las`-verifiering | **8 av 8** |

### ☠️ Transkriberingsspärren FÄLLDE — på ett facit jag hittat på

Steg 4:s första försök avbröts utan att skriva något:

```
{"AVBRUTET":"transkriberingsfel — ingenting skrivet","fick":923040226,"tecken":246}
```

SKU-strängarna var rätt. Det som var fel var det VÄNTADE värdet: jag skrev in
ett påhittat facit (`324505185 / 255`) i stället för att räkna det ur
`sku.tsv`. Räknat ur filen blev facit `923040226 / 246` — exakt det spärren
rapporterade som `fick`.

☠️ **Lärdomen är inte "räkna noggrannare", det är att ett facit aldrig får
skrivas av eller hittas på.** `raahash.py`, `hasha.py` och
`bygg-medieskrivning.py` finns just för att steg 1 och 2 inte ska kunna göra
det här; steg 4:s SKU-lista var det enda facit som inte hade en generator, och
det var det enda som gick fel. Spärren gjorde sitt jobb: **noll produkter
skrevs** medan facit var obevisat.

### ☠️ Steg 3 avvisades med 400 första gången — och ingenting skrevs

`bulk/categories/{id}/add-items` tar `items` och `treeReference`, inte
`itemReferences`. Alla tio anropen föll på `400` med
`items has size 0 … treeReference must not be empty`, alltså **innan** någon
koppling gjordes — inget halvskrivet tillstånd. Kroppsformen lästes sedan ur
metodens egen dokumentation, inte ur minnet, och omkörningen gav 14 av 14
`success: true`.

⚠️ Det är samma hållning som husets regel om Wix-endpoints: **mät per
endpoint.** `products/search` och `inventory-items/query` är oense om `filter`
och `fields`; kategorirutten har sin egen kroppsform, och den går inte att
härleda ur de andra.

### Axelkonflikten i källan

`gate-axel.py` rapporterar en rad där tyskan och den svenska spec-fliken
använder olika bokstav för samma tal (`86c60239`: 294 är `B` i tyskan och `L` i
spec-fliken). Det är en upplysning om KÄLLAN, inte ett fynd i texten: facit
byggs positionellt av `bygg-axelfacit.py` och rundan skriver måttet som en ren
trippel.

⚠️ **`81bff775` fällde grinden en gång, och rättelsen var språklig.** Texten
skrev *"74 cm bredd"* om det tal som positionellt är produktens DJUP. För en
bro är 135,5 cm längden och 74 cm tvärmåttet, så ingen av husets tre
axelbokstäver läser naturligt — meningen skrevs om till *"74 cm tvärs över"*,
vilket är sant och inte binder talet till fel axel. Grinden hade rätt om
regeln.

## Kategorier

| id | kategori |
|---|---|
| 81bff775 (trädgårdsbro) | Trädgård & Utemöbler → Trädgårdsdekor & Belysning |
| 86c60239 (paviljong) | Trädgård & Utemöbler → Solskydd & Paviljonger |
| fda8a9de (gräsklippare) | Trädgård & Utemöbler → Trädgårdsskötsel & Bevattning |
| 180f81c1 (hängsoffa) | Trädgård & Utemöbler → Utemöbler |
| a7c39a89 (barbord) | Hem & Inredning |
| cae81077 (matstolar) | Hem & Inredning |
| 07d1208e (spinningcykel) | Sport & Fritid → Träning & Gym |
| cec4d9a9 (fotbollsspel) | Barn & Familj → Leksaker & Spel |

Kategori-id:na lästes ur ett FÄRSKT `categories/v1/categories/query`-svar
(54 kategorier) — aldrig ur minnet, aldrig ur en tidigare rundas anteckning.

⚠️ **`a7c39a89` och `cae81077` får toppkategorin `Hem & Inredning` utan löv.**
Trädet har inget möbellöv, och runbooken säger att toppkategorin räcker då —
samma bedömning N23, N25, N27, N28, N29 och N30 gjort.

⚠️ Slutläsningen visar `antalKat: 3` på sex av åtta och `2` på de två utan löv
— i båda fallen den kopplade kategorin (eller två) plus Wix egna
`All Products`, som Wix lägger till själv.

☠️ **Facit för steg 3 är bulk-svarets `itemMetadata` per rad, inte en snabb
återläsning.** Läsprojektionen släpar efter skrivningen (`#281`), så en
omedelbar `GET` kan UNDERrapportera. Här svarade alla tio anropen
`totalFailures: 0` med `success: true` på varenda rad, och den senare,
separata slutläsningen bekräftade det oberoende.

## Fotoräknade tal, kvitterade

`foto-tal.txt` bär tre rader. Alla är avlästa på produktens egen måttbild eller
räknade på ett foto, och ingen står i den tyska källtexten:

| id | tal | vad |
|---|---:|---|
| `81bff775` | 4 | antal fotplattor med fästhål, räknade på bild 1 |
| `86c60239` | 285 | markytans mått, avläst på måttbilden (bild 3) |
| `180f81c1` | 4 | antal upphängningskedjor, räknade på bild 1 och 3 |

## Kort: medvetet uppskjutet, inte glömt

Samma kostnadsavvägning som N15–N30: inget `kort-filer.tsv` finns i rundans
katalog, så ingen produkt fick ett eget faktakort.
`bygg-medieskrivning.py` skriver då bildlistan exakt som `bygg-media.py`
lämnade den, och rapporterar "inget kort denna runda" per produkt — ett
uttalat val, inte en tyst utelämning.

## ☠️ Korrekturläsningen av den egna svenskan är ett EGET steg

N29 mätte upp två böjningsfel som nådde live trots tolv gröna grindar, och N30
gjorde korrekturpasset till ett eget steg FÖRE den kontrollsummerade
skrivningen. Den här rundan gjorde detsamma: alla åtta texterna lästes igenom
med taggarna strippade, mening för mening, med genus och adjektivböjning som
enda fråga.

**Fem rader ändrades, och ingen av dem hade fällts av någon grind:**

| id | stod | ändrat till | varför |
|---|---|---|---|
| `cae81077` | Benen är **svartlackerat stål** | Benen är **av** svartlackerat stål | numerusbrott mellan plural subjekt och neutral predikatsfyllnad |
| `cec4d9a9` | **En** bredare fotavtryck | **Ett** bredare fotavtryck | *fotavtryck* är t-ord |
| `07d1208e` | med **en** vridvred | med **ett** vred | *vred* är t-ord, och ordet var dessutom hopskrivet fel |
| `86c60239` | en duk som **ligger hopvikt** | en duk som **viks ihop fuktig** | participet skulle böjts *hopviken* mot ett n-ord; meningen skrevs om i stället |
| `180f81c1` | *stomme i stål klädd med…* | *Stommen är av stål och klädd med…* | *klädd* kunde syfta på *stål* (t-ord) i stället för *stomme* |

☠️ **`cae81077`-raden är exakt det fel N30 mätte upp** (*"Benen är
svartlackerat fyrkantsrör"*). Att samma konstruktion uppstod igen, en runda
senare, i en annan produkt och av samma skribent, är själva argumentet för att
passet ska vara ett steg och inte en känsla: felet är systematiskt, inte
slumpmässigt.

Därtill tre rena sakrättelser i samma pass: *"ett steg på ungefär sju
millimeter"* (en uträkning som inte står i någon källa) ströks, *"knivarna"*
blev *"kniven"* (klipparen har en), och *"den gröna duken"* blev *"den gröna
spelytan"* (spelplanen är tryckt skiva, inte tyg).

## Live-verifiering

`hamta-live.sh 130` + `livegrind.py` mot de publicerade sidorna. Alla åtta
slugs är NYA adresser (produkterna låg på tyska slugs innan), så den varma
träffen gav `age=0` på alla åtta — en förstagångsrendering, inte en cachad
gammal sida. Skriptet väntade därför ut hela stale-fönstret (305 s) plus pausen
innan den skarpa hämtningen.

**8/8 HTTP 200 (144 906–156 904 B), 8/8 REN, 0 avvikelser i den PUBLICERADE
texten**, och grinden avslutar med `exit 0`.

Orddiffen mot källfilen är **0 på alla åtta** (540–660 ord per sida). `REN`
betyder att samtliga delkontroller gick igenom, inte bara orddiffen:
homoglyfsvepet, sid-, alt- och SEO-svepen, de tre obligatoriska flikrubrikerna
som `<summary>`-element, brödsmulans andra led (alltså en riktig kategori, inte
`Hem / Butik / produkt`) och `OutOfStock`-kollen.

⚠️ **Åldrarna lästes innan svepet togs på allvar**, och de är enhetliga:
**140 sekunder på alla åtta**, alltså precis pausen mellan omträffen och den
skarpa hämtningen. Ingen sida serverades ur en äldre rendering — till skillnad
från N26:s `66d781f8` (`age: 431`) och N27:s `e5049d65` (`age: 450`).
**Läs `age` innan du litar på ett svep.**

### Och den andra genomläsningen gav noll

Enligt N29:s lärdom och N30:s disciplin lästes den PUBLICERADE svenskan igenom
en andra gång, med genus och adjektivböjning som enda fråga. Satserna plockades
ut MEKANISKT — varje sats som bär ett adjektiv, ett particip eller en obestämd
artikel — och varje `en`/`ett`-par märktes ut i utskriften så att det inte gick
att läsa förbi. **219 satser, lästa en och en. Noll fynd.**

Det är väntat men inte överflödigt: orddiffen är 0, alltså ÄR live-texten
filens text, och filen korrekturlästes före skrivningen. Att läsa om den på
den publicerade sidan är det som skiljer ett antagande från ett kvitto — och
det var precis i det ledet N29 hittade sina två fel.

⚠️ **En sats lästes och godkändes med flit:** `cae81077`:s *"drar du åt en
färdigt innan de andra ens fått fäste"*. Den mekaniska utplockningen parade
ihop `en` med `färdigt` och såg ut som ett genusfel. Det är det inte — `en` är
pronomen för *en skruv* (n-ord) och `färdigt` är adverb till *drar åt*.
Utplockaren ska vara trubbig åt det hållet: den ska lämna fler satser till
ögat, inte färre.

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

Elva sakfel rättades före skrivningen, sju av dem synliga bara i bilderna.
Två spärrar fällde och skrev ingenting — transkriberingsspärren på ett påhittat
facit och kategorirutten på fel kroppsform — och båda gångerna var det rätt
beteende. Åtta affärsbeslut är flaggade till Leonard och orörda. Rundan räknas
som klar utom faktakorten, som är en medveten uppskjutning av samma skäl som
N15–N30.
