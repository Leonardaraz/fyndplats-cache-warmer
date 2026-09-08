# Runda 100 — Steg 5: vad leverantören säger och vad som får stå kvar

Bildgranskningen (Steg 4) står sist i `STEG1.md`. Det här är faktakontrollen.

## ☠️ Ett LEVERANSLÖFTE som inte är vårt att ge — på fyra av sex

`4249df4d`, `29c688dc`, `74d3c11c` och `c71418ca` avslutar alla den tyska
texten med:

> *"WICHTIG: Wir liefern Ihnen den Artikel kostenfrei bis Bordsteinkante."*

Fri leverans **till trottoarkanten** är leverantörens villkor mot OSS. Vad
kunden betalar och var paketet ställs av avgörs av butikens fraktvillkor, inte
av en mening som följt med i en produktbeskrivning. Ett löfte om leveranssätt
i brödtexten är dessutom ett avtalsvillkor, inte en produktegenskap.

**Stryks på alla fyra, utan ersättning.** Ingen sida säger något om leverans.

⚠️ Det är samma klass som *"leverantören anger…"*: en mening som är sann i
LEVERANTÖRENS mun och blir ett löfte i vår. Grinden är ordagrann i `lint.py`.

## ☠️ `e71acc53` säger både SEX och FYRA personer

Samma stycke, två meningar isär:

> *"Versammeln Sie Ihre Familie und Freunde mit diesem Gartentisch **für 6
> Personen**… Er bildet einen Metallrahmen für alle Ihre Zusammenkünfte im
> Freien **für vier Personen**."*

Måttritningen ger 145 × 90 cm och inget annat. **Sidan publicerar inget
sittplatsantal alls** — den skriver skivans mått och låter kunden räkna. Att
välja en av två siffror som motsäger varandra vore att gissa åt kunden.

De övriga fem är entydiga och behåller sina tal: `f806eebf` sex, `29c688dc`
upp till sex, `74d3c11c` fyra utbyggt till sex, `c71418ca` sex till åtta.

## ☠️ `4249df4d` har TVÅ vikter och TVÅ materiallistor

| | brödtexten | spec-raden |
|---|---|---|
| vikt | `ca. 26 kg` | **`30 kg`** |
| material | `Metall, Sicherheitsglas, Polyrattan` | **`Metall`** |

Spec-raden är feedens kolumn, brödtexten är marknadsföring — och de kan säga
emot varandra (runbokens regel 2026-09-05). **Vikten publiceras som 30 kg**:
det är feedens tal, och för en kund som ska bära bordet är en underskattad
vikt det dyrare felet.

**Materialet skrivs efter BILDEN**, som visar båda: skiva i säkerhetsglas,
ram och hylla klädda i polyrotting. Spec-radens ensamma "Metall" är
ofullständig, brödtextens tre material är korrekt.

## ☠️ `c71418ca`:s spec-rad lovar ett bord som alltid är 220 cm

| källa | säger |
|---|---|
| tyska brödtexten | `Gesamtabmessungen: 160/220L x 90B x 73H cm` |
| svenska spec-raden | `Mått: 220L x 90B x 73H cm` |
| måttritningen `c71418ca-3` | bara **220 × 90 × 73** |

Måttritningen räddar inte raden — den visar bara det utdragna läget. Det
hopskjutna måttet finns bara i brödtexten, och det är det som gäller när
bordet står i vardagslag. **Sidan skriver 160/220 cm.**

⚠️ Jämför de två andra utdragbara, där ritningen visar BÅDA lägena:
`29c688dc-3` ger 80 × 80 och 160 × 80; `74d3c11c-3` ger 81 × 80 och 162 × 80.
Där är ritningen facit. På `c71418ca` är den ofullständig.

## ⚠️ Maxlasten skiljer per bord och får inte ärvas

| id8 | maxlast |
|---|--:|
| `e71acc53` | 50 kg |
| `f806eebf` | 50 kg |
| `4249df4d` | **80 kg** |
| `29c688dc` | 50 kg |
| `74d3c11c` | **70 kg** |
| `c71418ca` | **70 kg** |

Tre olika tal på sex bord i samma runda. Grinden låser dem per produkt.

## ⚠️ STOLARNA INGÅR INTE — och bara ett utkast säger det

Varenda miljöbild i rundan visar bordet dukat med stolar. Av rundans sex
tyska texter säger **noll** att stolarna inte ingår; det gör däremot
`ef71bb42` (ett av de fyra små borden, utanför rundan) med ett uttryckligt
`HINWEIS: Stühle nicht enthalten`.

Leveransen är på alla sex `1 x Gartentisch` plus anvisning. **Varje sida säger
i klartext att bordet levereras ensamt.**

## ✅ Det som stämmer och bär texten

- **Alla sex kräver montering** och har anvisning i lådan.
- **Alla sex har justerbara eller halkfria fötter** — det är den detalj som
  gör dem användbara på en ojämn altan, och den syns på fotot (`65a730a4-4`
  visar fotkonstruktionen närbild, samma fot som på flera av dem).
- **Lamellskivorna dränerar regn.** `74d3c11c`:s tyska text säger det rakt ut,
  och konstruktionen syns på `e71acc53`, `74d3c11c` och `c71418ca`.
- **`f806eebf` har 71 cm fri höjd under skivan** vid 75 cm totalhöjd — ett
  användbart tal för den som mäter mot en stol med armstöd.
- **`4249df4d`:s hylla under skivan är 85 × 50 cm** och syns på både foto och
  måttritning.

---

## ☠️ TVÅ RÄTTELSER AV DET HÄR DOKUMENTET, hittade när underlaget lästes rad för rad

Avsnittet "Det som stämmer och bär texten" ovan skrevs ur en sammanfattning.
Två av dess punkter höll inte när de sex tyska texterna lästes ordagrant.

### 1. "Alla sex har justerbara eller halkfria fötter" — FEL

| id8 | vad underlaget säger | vad sidan skriver |
|---|---|---|
| `e71acc53` | **ingenting om fötterna** | **ingenting** |
| `f806eebf` | *"Verstellbare Füße"* | justerbara |
| `4249df4d` | *"Mit rutschfesten Füßen"* | halkfria |
| `29c688dc` | *"Rutschfeste Füße … schützen den Boden"* | halkfria |
| `74d3c11c` | *"verstellbare Fußstützen"* | justerbara |
| `c71418ca` | *"Verstellbare Füße"* | justerbara |

Påståendet om `e71acc53` var ÄRVT: fotkonstruktionen syns på `65a730a4-4`,
en närbild på ett helt annat bord. Det är precis den sortens ärvda detalj
runbokens färgtvillingregel förbjuder — ett foto av ETT syskon bevisar
ingenting om ett annat.

**Och justerbar är inte halkfri.** En justerbar fot skruvas i höjdled mot ett
ojämnt underlag; en halkfri fot står still och skyddar golvet. Grinden (regel 6)
är därför trevägs: den fäller ett fotpåstående utan underlag, en saknad
beskrivning, OCH en förväxling av de två sorterna.

### 2. "Alla sex har anvisning i lådan" — FEL

`4249df4d`:s `Lieferumfang` listar `1 x Gartentisch inkl` och
`1 x Sicherheitsglasplatte`. **Ingen `Anleitung`.** De andra fem har alla ett
`1 x Handbuch` / `1 x Anleitung` / `1 x Bedienungsanleitung`.

Den sidan skriver därför "Montering krävs" utan att lova en anvisning.
Regel 7 är tvåvägs och låser båda riktningarna.

### 3. Och en tredje: `4249df4d` har lika lite sittplatsunderlag som `e71acc53`

Avsnittet ovan sa att bara `e71acc53` saknar ett publicerbart tal. Det stämmer
inte: `4249df4d`:s tyska text nämner **inget antal alls**. Skillnaden mellan de
två är bara HUR underlaget saknas — den ena motsäger sig själv, den andra är
tyst. Utfallet är detsamma, och båda sidorna skriver skivans mått i stället.

**Regeln: en sammanfattning är inte ett underlag.** Alla tre felen kom av att
den här filens första version generaliserade över sex produkter i stället för
att lista dem en och en. Grinden listar dem nu en och en, i `texter.py`:s
`FOTTER`, `ANVISNING` och `SITTPLATSER`.

## ✅ Bilderna behöver ingen kvadrering — alla 30 är redan 900 × 900

Uppmätt på filerna i `rawbilder/`: samtliga trettio är kvadratiska. PDP:ns
centrumbeskärning (`fill/w_N,h_N,al_c`) kan alltså inte kapa något, och #354:s
problem — liggande måttritningar som tappar sina måttetiketter — gäller inte
den här rundan. Kontrollen är ändå värd att göra varje gång: runda 98:s
ritningar var 900 × 642 och tappade sidmåtten.
