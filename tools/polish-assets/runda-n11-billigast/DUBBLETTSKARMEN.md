# Dubblettskärmen — Runda N11

## 1. Kandidatlistan (dealproffsen-jämförelsen, `fran_pris=1080`)

Körningen 2026-09-18 gav ett prisband som i praktiken låg på 1 089–1 099 kr
(inget pris låg mellan). Nio kandidater föll i bandet innan urvalet:

| wix-id | vart pris | deras pris | under med | utfall |
| :-- | --: | --: | --: | :-- |
| `ffaa3fad` | 1 089 | 1 189 | 100 kr | **behållen** |
| `0136e7d9` | 1 099 | 1 129 | 30 kr | **behållen** |
| `17c253d6` | 1 099 | 1 129 | 30 kr | uteslöts direkt — namnmatch mot #285-klustret (elfyrhjuling), se §2 |
| `17c747cb` | 1 099 | 1 299 | 200 kr | **behållen** |
| `227fae7d` | 1 099 | 1 149 | 50 kr | **behållen** |
| `2bc98714` | 1 099 | 1 149 | 50 kr | **behållen** |
| `4f7c87ea` | 1 099 | 1 129 | 30 kr | uteslöts — SPORTNOW tryckt på produkten, se §3 |
| `4fb98338` | 1 099 | 1 299 | 200 kr | uteslöts — PawHut-bricka på produkten, se §3 |

Fem behölls direkt. Tre platser behövde ersättas.

## 2. `17c253d6` — uteslöts på namnmatch, aldrig fullt verifierad

Namnet ("Kinder Quad Elektro 6V Kinderquad mit Vorwärtsfunktion, Musik")
matchar exakt det redan flaggade #285-klustret från N10 (tre utkast + en
publicerad sida för samma elfyrhjuling). Måtten (70×42×45) skiljer sig
faktiskt från de fyra kända #285-måtten — det är alltså sannolikt ett
FEMTE syskon i samma familj, inte samma exakta sida. Eftersom en fullständig
verifiering (bild + mått mot alla fyra) inte gjordes innan pagineringsbugten
(§6) upptäcktes, hölls den konservativt utanför i stället för att chansa.
**Kvarstår som en tillagd rad i #285, inte ett eget nummer.**

## 3. Två kandidater föll på kontaktarksgranskningen, inte på siffror

Regeln sedan runda J1: bilderna granskas FÖRE brödtexten. Båda dessa
upptäcktes där, inte av någon mått- eller textgrind.

- ☠️ **`4f7c87ea` (fotbollsmål, 180×60×120 cm).** "SPORTNOW" står tryckt
  direkt på den övre tvärstången i alla fem bilderna — texten böjer sig med
  rörets rundning och perspektivet ändras med kameravinkeln i varje bild,
  vilket utesluter en plan bildoverlay. Dessutom sitter en svart
  "SPORTNOW"-lapp fastsydd mitt i nätet, likaså i alla fem bilder. Båda är
  fysiska märken på PRODUKTEN, inte i bildfilen — och husregeln (skärpt
  denna session) säger att sådana ALDRIG beskärs bort. Samma klass som
  #195 (VINSETTO på gamingstolarna): **Leonards beslut**, inte mitt.
- ☠️ **`4fb98338` (hundmatstation, 60×30×35 cm).** En liten oval
  "PawHut"-bricka sitter monterad på skåpets främre vänstra hörn, synlig i
  fyra av fem bilder på samma relativa position — ett fysiskt namnskylt,
  inte en vattenstämpel. PawHut står redan i husets lista över
  dropship-varumärken att strippa ur TEXT, men en bricka SKRUVAD I möbeln
  går inte att strippa utan att redigera bilden, vilket är förbjudet.
  Samma klass som ovan.

Båda är nya rader i backloggen (se avslutande rapport), inte lösta här.

## 4. Ersättarna — och två av tre visade sig vara dubbletter

Fem nya kandidater hämtades i prisordning för att ersätta de tre uteslutna:
`56b32f2f` (soptunna), `5f66bf37` (vibrationsplatta), `636e14f1`
(reptilterrarium), `6952ff0c` (stepper), `7adde575` (shoppingvagn).

| kandidat | mått | utfall |
| :-- | :-- | :-- |
| `56b32f2f` | 41,8×36,7×58 | **behållen** — inga märken, inga dubbletter, 5/5 bilder rena |
| `5f66bf37` | 48×32×12,5 | **behållen** — inga märken, inga dubbletter, 3/5 bilder rena (två tyska reklamoverlägg borttagna) |
| `636e14f1` | 50×30×35 | ☠️ **DUBBLETT** — se nedan |
| `6952ff0c` | 40×40×118 | inte behövd — se nedan |
| `7adde575` | 44×58×100 | ☠️ **DUBBLETT** — se nedan |

### ☠️ `7adde575` är redan publicerad som `d3fd579b`

Måtttrippeln (44/58/100) gav en EXAKT träff mot den publicerade
"Shoppingvagn hopfällbar 46 L – 3-i-1 med ryggsäcksläge, max 25 kg"
(`d3fd579b-013e-48d0-ae0b-3aef0a597f89`). Källans egna ord bekräftar det:
samma volym (46 L), samma maxlast (25 kg) och samma tre användningssätt
("Funktioniert als Einkaufswagen, Rucksack oder Nutzwagen" = "3-i-1"). Samma
fysiska vara, redan på sajten. Uteslöts.

### ☠️ `636e14f1` krockar med TVÅ publicerade terrarier

Måtttrippeln (30/35/50) gav träff mot INTE EN utan TVÅ publicerade sidor:
"Glasterrarium 50 × 30 × 35 cm med strukturerad bakvägg, 48 liter"
(`b1b782c5…`) och "Glasterrarium 50 × 30 × 35 cm, 48 liter med frontlucka"
(`ef9d5b47…`). Det här är samma storleksklass som redan polerades i #31
tidigt i den här sessionen — och som uppenbarligen redan finns i minst två
varianter på sajten. En tredje sida i exakt samma mått hade varit precis den
interna dubblett husregeln finns för att förhindra. Uteslöts utan att ens
behöva öppna kontaktarket.

`6952ff0c` (steppern) granskades aldrig färdigt — en möjlig, men inte
säkert avgjord, markering på pedalen gjorde den till en sämre kandidat än
de två redan rena, så den lämnades orörd i reserven i stället för att
utredas vidare.

## 5. Den slutgiltiga sjuan — trippelsvept mot HELA publicerade katalogen

Samtliga sju slutgiltiga kandidater kontrollerades mot samtliga 2 867
publicerade produkter (`visible: true`), i två separata svep beroende på
mättyp:

- **Tretalsformen** (`AxBxC cm`) för `ffaa3fad`, `0136e7d9`, `2bc98714`,
  `56b32f2f`, `5f66bf37` — noll träffar.
- **Diameterformen** (`ØA x B cm`, kräver att bägge talen står IHOP, inte
  bara någonstans i texten var för sig) för `17c747cb` och `227fae7d` —
  noll träffar.

Mönstret är `\d+(?:[.,]\d+)?\s*[x×]\s*…\s*cm` — VERIFIERAT mot fyra
riktiga publicerade sidor innan svepet kördes (multiplikationstecken, INGA
L/B/H-bokstäver, vilket skiljer sig helt från källtextens egen
`60L x 60B x 53H`-form). Ett första försök med fel format missade nästan
allt (bara 15 % täckning, se `kvitto-kalla.json`s syskon-anteckning i
huvudrapporten) — samma lärdom som #219 dokumenterar för `Mått:`-raden.

**Facit: 0 av 7 nya kandidater krockar med den publicerade katalogen.**
Ingen intern kollision är heller möjlig inom själva sjuan — sju helt olika
produktkategorier (trädgårdsbord, förvaringslåda, pallset, konstväxt,
skobänk, soptunna, vibrationsplatta).

## 6. En verklig kodbugg hittades och lagades under skärmningen

`products/search` med `cursorPaging` på requestens TOPPNIVÅ (i stället för
inuti `search`-objektet) gav samma första 100 produkter om och om igen —
exakt #191-bugten, återupptäckt här eftersom N11 var första gången den här
sessionen byggde en HELKATALOG-svepare från grunden i stället för att
återanvända en tidigare rundas skript. Fixat och verifierat med ett
tvåsidigt testanrop (noll överlapp mellan sida 1 och 2) innan några riktiga
svep kördes.
