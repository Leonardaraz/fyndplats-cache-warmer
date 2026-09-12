# Runda 138 — Steg 2 till 5

35 bilder granskade, sju produkter.

## Steg 2 — laglighetsgrinden passerar

Klösmöbler är **ingen stoppklass**: L80 (SJVFS 2019:15) reglerar burar, hus och
inhägnader där djuret HÅLLS, inte möbler djuret använder fritt i hemmet. EN 1930
gäller barngrindar; ingen av de sju nämner barn i någon kanal.

Säkerhetsrelevanta uppgifter till spec-tabellen, som **positiva villkor med egen
rubrik** — aldrig som varningsblock:

| produkt | takspänne | tippskydd | maxlast | rek. kattvikt |
|---|---|---|--:|--:|
| `1366a476` | **nej** — tippskyddslina | `Kippsicherungsseil` | **20 kg** | **under 6 kg** |
| `839a2ef5` | ja | ja | 10 kg | upp till 5 kg |
| `68bc6c0c` | ja | ja | 10 kg | under 5 kg |
| `e5b31270` | ja (`Deckenspanner`) | ja | — | upp till 5 kg |
| `fecadb3e` | ja (`Spannstange`) | ja | — | upp till 5 kg |
| `505a0dde` | ja | halkskydd | — | under 5 kg |
| `7bdc47b8` | ja | — | ca 10 kg | upp till 5 kg |

☠️ **`1366a476` är familjens UNDANTAG åt andra hållet: 20 kg maxlast och
6 kg kattvikt.** De sex andra ligger på 10 kg och 5 kg. Det är den enda i
rundan som får beskrivas för en tyngre katt, och det talet ska stå — men bara
på den.

☠️ **RÄTTAD: den här tabellen sa först `saknas` på båda fälten för
`1366a476`.** Felet var inte källan utan MIN LÄSNING: den första hämtningen
kapades vid 1 700 tecken, och `Maximale Belastung` och `Gewicht des Haustiers`
är de två SISTA raderna i dess `Technische Daten`. Kapningen såg ut som ett
tomt fält.

⚠️ **Det är en egen fälla, och den är värd namnet.** En avhuggen läsning
skiljer sig inte från ett saknat värde när man bara har utdraget framför sig —
och slutsatsen blev dessutom en FIN berättelse ("den enda utan maxlast, alltså
den lucka en batchtext fyller i av vana"), vilket gör den svårare att
misstänka. Ett tomt fält får aldrig påstås utan att hela blocket lästs.

`e5b31270`, `fecadb3e` och `505a0dde` saknar däremot maxlast på riktigt —
kontrollerat på fullständiga blad. Skriv inget tak för dem.

## Steg 4 — fyra bilder ska bort, och två etiketter ska INTE bort

| id | 3 (ritning) | 4 (källa 8) | 5 (källa 9) | behålls |
|---|---|---|---|--:|
| `1366a476` | ren | ☠️ tysk marknadsgrafik | ☠️ **PawHut-reklam** | **3** |
| `839a2ef5` | ren | ☠️ tysk marknadsgrafik | detalj (insydd etikett) | **4** |
| `68bc6c0c` | ren | ☠️ tysk marknadsgrafik | detalj, ren | **4** |
| `e5b31270` | ren | detalj, ren | detalj, ren | **5** |
| `fecadb3e` | ren | detalj, ren | detalj, ren | **5** |
| `505a0dde` | ren | detalj, ren | detalj (insydd etikett) | **5** |
| `7bdc47b8` | ren | detalj, ren | detalj, ren | **5** |

**Alla sju måttritningar är rena** — bara siffror med `cm`, redan med
decimalkomma. De går rakt in i galleriet.

### ☠️ De fyra som ska bort

| bild | vad den bär |
|---|---|
| `1366a476` nr 4 | `50%IGE VERBESSERUNG DER STABILITÄT`, `Anti-Kipp-Gurt`, `Verbreiterte Basis` |
| `1366a476` nr 5 | **PawHut-logotyp** + `Ihre Welt, ihre Regeln. Hoch hinaus, tief schlafen.` |
| `839a2ef5` nr 4 | `WARUM SIE ES BRAUCHEN?`, `Baumelnder Ball`, `Kratzbäume` |
| `68bc6c0c` nr 4 | `WARUM SIE ES BRAUCHEN?`, `Federball`, `Schlenkerball`, `Seil Katzenspielzeug` |

`1366a476` blir därmed **tre leverantörsbilder plus vårt eget kort** — tunnast i
rundan, men kortet är klart-kriteriet och det uppfylls.

### ✅ De två etiketterna STANNAR — Leonards regel, inte ett förbiseende

`839a2ef5` bild 5 och `505a0dde` bild 5 visar båda en **insydd PawHut-etikett**
på fotmattan, läsbar i närbild. Det är inte overlay-text: det är en vävd lapp
som sitter på varan.

Runbookens avgörande-test, ordagrant: *skulle det synas om du fotade varan själv
efter uppackning?* → **ja**. Leonards regel från 2026-08-06 gäller:
*"om märket sitter fysiskt på varan så gör vi inget åt det, det är så produkten
ser ut."*

⚠️ **Skillnaden mot uppgift #282 är VAR märket sitter, inte VAD det står.** Där
var `HOMCOM by Aosom` inbränt i pixlarna uppe till vänster — pålagt, alltså
borttagbart. Här är det en lapp i tyget. Samma namn, motsatt beslut, och det är
regeln som skiljer dem.

## Steg 5 — fem fynd, och det farligaste är ett ORD

### ☠️ 1. TRE av sju är INTE sisal — och familjen bjuder in till felet

| produkt | leverantörens `Material` | klösytan är |
|---|---|---|
| `1366a476` | Spanplatte, Plüsch, PP-Baumwolle, **Sisal** | sisal |
| `839a2ef5` | Spanplatte, Polyester, Schaumstoff, **Sisal** | sisal |
| `68bc6c0c` | Spanplatte, Polyester, **Baumwollseil** | **bomullsrep** |
| `e5b31270` | Spanplatte, Samt, **Baumwollseil** | **bomullsrep** |
| `fecadb3e` | Spanplatte, Plüsch, **Jute**, PP-Baumwolle | **jute** |
| `505a0dde` | Spanplatte, Polyester, **Sisal** | sisal |
| `7bdc47b8` | Spanplatten, Plüsch — *"mit Sisal und Plüsch umwickelt"* | sisal |

**Sisal är familjens standardord**, och tre av sju har det inte. Ett bomullsrep
är mjukare mot tassarna och slits snabbare; jute är en tredje sak. Skriver man
"sisal" på dem är det ett materialpåstående som inte håller — och det är exakt
den sortens fel en gemensam batchtext producerar, eftersom ordet stämmer på
majoriteten.

### ☠️ 2. `1366a476` bär ett OGRUNDAT JÄMFÖRELSEPÅSTÅENDE i bilden

Bild 4, ordagrant: **`50%IGE VERBESSERUNG DER STABILITÄT`**. Femtio procent mot
VAD? Ingen jämförelsepunkt anges någonstans i källan. Bilden plockas bort av
andra skäl, men talet får aldrig vandra vidare till svensk text — varken som
"50 % stabilare" eller som "extra stabil".

### ☠️ 3. `505a0dde`:s svenska spec-rad säger `Färg: Gelb`

Oöversatt tyska, OCH bara en av tre färger. Varan är gul-krämig stam, vita plan
och **ljusblå** fotmatta — allt tre syns på bild 1 och 5. Raden är alltså fel på
två sätt samtidigt: fel språk och ofullständig.

### ⚠️ 4. `1366a476` är inte takspänd, och det är lätt att missa

Sex av sju har spännstång mot taket. Den sjunde har `Kippschutz-Set` — en
**väggrem**. Bilderna skiljer dem tydligt (ingen stång över toppen på bild 1),
men namnen gör det inte: alla sju heter `Kratzbaum` och sex av dem säger
`deckenhoch` eller `höhenverstellbar`. Det är en batchtext bort från att sälja
en väggförankrad möbel som takspänd.

### ⚠️ 5. Måttritningarna bär en MÄNNISKOSILUETT på 180 cm

Fyra av sju ritningar (`e5b31270`, `fecadb3e`, `505a0dde`, `7bdc47b8`) har en
skalfigur märkt `180 cm`. Det är en referens för att visa hur högt trädet är,
**inte ett produktmått** — runda 137 mätte exakt samma sak, och talgrinden
fällde det med rätta. Det får inte in i någon alt-text och inte i spec-tabellen.
