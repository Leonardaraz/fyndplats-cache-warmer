# Runda 119 — familjens nio sista köksvagnar och köksöar

Sex köksvagnar och tre köksöar, 1 379 till 3 679 kr. Den familj runda 117
och 118 arbetat i är därmed slut på utkastsidan.

| steg | skrivning | kvitto |
|---|---|---|
| 1 | familjen svept | 3 133 utkast + 2 490 publicerade, unika = rader, `avhuggen: false`, `kanslig_kontroll: 1` |
| 1 | måttgrind | 26 publicerade mätta; `6cf7cfcf` INTE dubblett (5 innermått skiljer); tre köksöar alla distinkta |
| 4 | bildgenomgång | 12 av 27 bilder bär tysk text; 0 av 18 hörn bär husmärke |
| 4 | prisgrinden | **9/9 `stämmer: true`** (runs 2382–2390), alla i lager, fraktandel 0,256–0,397 |
| 5 | leverantörsgrind | tre produkter har två olika yttermått i sin egen data; ritningen avgör |
| 7 | namn, slug, seoData, brödtext | **9/9 ordsumma IDENTISK**, priset oförändrat, kvar som utkast, 0 FAQ ihop |
| 8 | variant-SKU | 9/9, priset oförändrat, varianten synlig, produkten kvar som utkast |
| 9 | kort byggda | 9/9, 168–206 kB (tak 215), `kontroll()` 0 fel |
| 9 | alt-grinden | **44 alt-texter, 0 fel**, 20 självtestfall, 0 släppte igenom |
| 9 | galleriet skrivet | **44 bilder, 0 tomma alt-texter**, ordsumman identisk på alla nio |
| 10 | kategorier | **9/9 förälder + löv**, namngivet per rad, `misslyckade: 0` |
| 12 | läst som kund | fyra fynd, varav **ett var en grindlucka** |
| 13 | publicerade | **9/9 `visible: true`**, priset orört, varianten synlig |
| 13 | mappningsraderna | 9/9 stämplade (runs 2391–2399), kvitto `needsAiPolish, draftStatus, variantSkus` |

## Steg 9 — galleriet

Ordningen är runbookens: hjältebild, verklighetsbild, **eget faktakort på
plats 3**, detaljfoton, och **måttritningen SIST**. Leverantörens bild 3 ÄR
ritningen och ligger i rå-importen kvar på plats 3 — uppgift #371 mätte att
den låg kvar där på alla sju av runda 104:s sidor.

Tolv tyska bilder utelämnades. Kvar blev 44 bilder över nio produkter, och
återläsningen med en EGEN `GET …?fields=MEDIA_ITEMS_INFO` bekräftade antalet
per produkt, noll tomma alt-texter, kortet på plats 3 och ritningen sist på
alla nio.

### ✅ En media-PATCH behöver INTE slå ner variantens `visible`

Runbooken säger att den gör det "varje gång", mätt i runda 45 på 8 av 8.
Mätningen är riktig och slutsatsen för bred — det som kaskaderar är
`visible` **i fältmasken**, inte PATCH:en:

| | runda 45 | runda 119 |
|---|---|---|
| `fieldMask` | `["media", "visible"]` | **`["media"]`** |
| produktens `visible` efter | false | false |
| variantens `visible` efter | **true → false** ☠️ | **true, orörd** |

Med `visible` utelämnad ur masken överlevde varianten HELA kedjan — media,
en sen texträttelse och publiceringen — på 9 av 9. Det är 2026-09-07:s
kaskadmätning sedd från andra hållet, och det betyder att Steg 9 och Steg 12
inte behöver bära `variantsInfo` bara för att skydda varianten.

⚠️ Priset för att utelämna `visible` är att PATCH:en inte längre uttryckligen
håller nere synligheten. Här var det ofarligt (en media-PATCH är ingen
variantskrivning), men **en `variantsInfo`-PATCH publicerar utan `visible`** —
den regeln står oförändrad.

## Steg 12 — fyra fynd, varav ett var en grindlucka

Steg 12 lästes på det Wix FAKTISKT lagrat, inte på den lokala filen. Det är
inte samma sak: en transkriberingsdrift hade också synts.

### ☠️ Talgrinden täckte bara BRÖDTEXTEN

Namn, titel, meta och slug gick fria. Det är just i ett NAMN uppgift #326
hittade ett ohärlett tal på två publicerade sidor — och grinden byggdes då
där felet SYNTES, alltså i brödtexten, inte där regeln gäller.

Regeln säger "varje tal kunden ser", och namnet är det första kunden ser.
Utökad till alla fyra fälten gav den **en enda träff i den här rundan**:

| fält | står | uppmätt |
|---|---|---|
| `dac7a904` namn | 101 cm arbetsyta | **101,5** |
| `dac7a904` titel | 101 cm arbetsyta | 101,5 |
| `dac7a904` slug | `koksvagn-101-cm-…` | 101,5 |

Avrundningen är RÄTT — `101-5` i en slug läses som ett intervall — men den
var **oskriven**, och en oskriven avrundning är hur ett tal driver. Den bor
nu i `matt.RUBRIKTAL` med två krav som `matt.kontroll()` vaktar: nedåt
(uppåt vore ett löfte varan inte håller) och högst 1 ifrån (annars är det
inte en avrundning utan ett nytt tal med ett gammalt i närheten).

### ☠️ Och självtestriggen kunde bara skada `html`

Ett självtest som inte kan skada FÄLTET bevisar ingenting om grinden som
vaktar det. Det är den mekaniska förklaringen till hur uppgift #326:s tal
kunde ligga i två produktnamn med varenda grind grön. `FALTFALL` skadar
namn, titel, meta och slug var för sig — och bär ett fall som ska **släppas
igenom** (`dac7a904`s rubriktal), så att grinden inte bara är sträng utan
rätt.

### ☠️ Ny grind: PÅSTÅENDE OM VÅRT EGET SORTIMENT

`e0fed2c9`s ingress sa *"Den största köksön i sortimentet, och den enda med
utdragsbrickor"*. Båda var sanna den dagen. Båda blir osanna av nästa
nattliga import, **utan att någon rör sidan**.

Det är en annan defekt än OGRUNDAD SUPERLATIV, och skillnaden är vad man kan
verifiera mot: superlativen mäter varan mot marknaden, den här mäter den mot
en katalog vi själva ändrar varje natt. Ingen produktdata kan avgöra den.
Skriv om varan, inte om hyllan den står på.

### Två textfel till, båda osynliga för varje mekanisk grind

| id | vad |
|---|---|
| `d8bbbdde` | *"vill ha ETT stort skåp"* — versaler mitt i kundtext |
| `5d1696db` | FAQ-frågan *"Tål glasytan varma kastruller?"* lovade ett ja/nej som svaret inte gav |

Den andra är värd sin rad: svaret var korrekt och fullständigt som
skötselråd, och ändå fel — för frågan ställde en annan fråga än den svaret
besvarade. Frågan skrevs om i stället för svaret.

## Steg 10 — kategorierna följer PRODUKTTYPEN, inte rundan

Runda 118:s nio sidor ligger i tre olika par, och mönstret är typbaserat:
förvaringsmöbel → `Hem & Inredning` + `Förvaring & Organisering`, serverande
vagn → `Kök & Husgeråd` + `Servering & Glas`, utomhusmöbel → `Trädgård &
Utemöbler` + `Utemöbler`.

Runda 119 följer samma logik och lägger de åtta inomhusvagnarna i samma löv
som runda 117:s åtta köksvagnar — sjutton sidor i ett löv i stället för två.
Grillvagnen `36526a8d` går till **`Grill & Utekök`**, som är ett exaktare löv
än runda 118:s `Utemöbler`: den är ingen möbel för uteplatsen utan ett utekök
på hjul, och namnet säger det.

⚠️ Avvikelsen mot runda 118 är alltså medveten och inte ett slarv — men den
gör familjen delad över två utomhuslöv, och det är precis vad uppgift #323
handlar om. Städningen av kategoriträdet får avgöra vilket som ska gälla.

## Steg 14 — live-grinden, och ett hål i en DELAD modul

| | |
|---|---:|
| sidor granskade | **9** |
| fel på sidorna | **0** |
| självtestfall | 23 |
| fall som avslöjade ett verkligt hål | **1** |

⚠️ `cache HIT` i loggen är RÄTT utfall, inte en gammal sida. `hamta_isr`
hämtar två gånger med paus: första hämtningen får *stale-while-revalidate*
och startar ombyggnaden, andra får den nya sidan — och den är per definition
en HIT. Det är MISS på andra hämtningen som vore misstänkt.

### ☠️ Leveranslöftesgrinden kände inte svensk PLURAL — tolv ord av tretton

Fyndet kom ur ett självtestfall som var **fel skrivet**: det injicerade
*"Fyra glasburkar ingår i leveransen"* i tron att listans `glas` täckte
ordet. Det gör det inte — mönstret slutar i en ordgräns och efter `glas`
står ett `b`. Så långt var det mitt fel, inte grindens.

Men ordet lades till i listan och fälldes **fortfarande inte**. Böjnings-
mönstret var:

```
\b<ord>s?(?:n|en|et|na|erna|arna)?\b
```

Bestämd form och genitiv — men varken `-ar`, `-or` eller `-er`, alltså
**den form ett leveranslöfte faktiskt skrivs i**. Mätt på tretton ord ur
listans egen mitt:

| ord i listan | pluralformen som INTE fälldes |
|---|---|
| `tallrik` · `hink` · `mugg` · `kryddburk` · `skål` | tallrikar, hinkar, muggar, kryddburkar, skålar |
| `dyna` · `väska` · `flagga` · `skärbräda` | dynor, väskor, flaggor, skärbrädor |
| `karaff` · `servett` | karaffer, servetter |
| `kudde` | kuddar |

**Tolv av tretton.** Och att `"nycklar"` står listat BREDVID `"nyckel"` är
fingeravtrycket: någon gick i samma fälla tidigare och lagade ETT ORD i
stället för MÖNSTRET. Samma familj som runbookens egen regel — *en grind
skriven mot PLATSEN där felet hittades täcker inte REGELN.*

`_bojningar()` i `grindar.py` ersätter raden. Stammar på `-a` och `-e`
tappar sin vokal i plural (dyna → dynor, kudde → kuddar), så den trunkerade
stammen får **bara** pluraländelser — annars hade `dyna` matchat ordet `dyn`,
som är svenska för något helt annat.

Kontrollmätt efteråt: **17 av 17 böjningsformer fälls**, och **0 falsklarm**
över runda 118:s och runda 119:s arton källtexter. Modulen är delad med
flit, så rättningen gäller varje kommande runda utan att den behöver veta om
den.

Fyra ord till i `TILLBEHOR`, rundans egen stylingrekvisita: `glasburk`,
`vinflaska`, `barstol`, `fruktkorg`. Leverantörens bilder dukar upp alla
fyra, och `Lieferumfang` är `1 x vagn` + `1 x anvisning`.

### ☠️ Steg 10 SKAPADE en ny grannkanal — och live-grinden var grön FÖRE den

Andra live-körningen fällde tre korrekta sidor. Sidorna hade **växt från
142 till 150 kB** mellan körningarna, utan att en enda rad text ändrats.

Orsaken står i butikens HTML:

```
Föregående  Köksvagn 53 cm med två lådor och öppna fack – vit med träskiva
            157 av 262 i Förvaring & Organisering
Nästa       Köksö 129 cm med utdragsbrickor – 120 cm skiva, dörrfack och fem hjul ⤢
```

Raden visar grannarna **inom kategorin** — och den fanns inte förrän rundans
eget **Steg 10** gav produkterna en kategori. Kanalen är alltså
självförvållad, och den kunde omöjligt ha upptäckts i en runda som körde
Steg 14 före Steg 10.

Grannens namn står där i BÅDA serialiseringarna, precis som uppgift #433:s
par:

| | |
|---|---|
| DOM | `<span class="pbrowse-namn">Köksö 129 cm … och fem hjul</span>` |
| payload | `\"className\":\"pbrowse-namn\",\"children\":\"Köksö 129 cm … och fem hjul\"` |

Utfallet blev tre falsklarm av två olika slag: **FEM HJUL** på två sidor
vars möbler har fyra (grannens namn slutar på *"och fem hjul"*), och
**MASSIVT TRÄ** på `6cf7cfcf` (grannen heter *"Köksvagn 109 cm med massiv
gummiträskiva"*). Exakt runda 117:s fall, en ny modul senare.

✅ Kanalen är nu nummer 7–8 i `_GRANNKANALER`, och klassnamnet matchas som
ett **mönster** (`pname` eller något som slutar på `namn`) i stället för som
en uppräkning. Nästa modul huset lägger till kommer att heta något tredje,
och en lista över kända klassnamn är samma sorts fälla som en svartlista
över homoglyfer.

⚠️ **Och det betyder att en grön Steg 14 är en ÖGONBLICKSBILD.** Sidan
fortsätter ändra sig efter publiceringen medan butikens egna cachar
konvergerar. Kusinen är uppgift #273, där cachen svarade som utkastet — här
svarade den korrekt, men på en sida som ännu inte var färdigbyggd.
