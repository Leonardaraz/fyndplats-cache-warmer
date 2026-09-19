# Runda 115 Steg 5–7 — sju texter, och grinden fällde fyra egna fel

Texten skrevs till FIL först och grindades före varje API-anrop. Runda 64 mätte
skillnaden: inline i anropet gav **9 fel**, fil → grind → anrop gav **0**.

## Grinden fällde fyra klasser — alla i MIN text, ingen i produkten

### ☠️ 1. LEVERANTÖRSATTRIBUTION på alla sju

Jag skrev *"åldern **leverantören** anger är 18–36 månader"*. Mot kunden är
**vi** leverantören — samma husregelbrott som runda 64 mätte upp och som ligger
i tonregeln sedan dess. Rättat till *"åldern som anges är …"*.

### ☠️ 2. "trampa" i en icke-negerad mening — och grinden VIDGADES INTE

Meningen *"Det gör den användbar långt innan ett barn klarar att trampa"* är
sant och ofarligt, men står utan negation. Frestelsen var att lägga `innan` i
NEGATION.

**Det hade varit fel.** `innan` är en svag negator som lika gärna ursäktar ett
verkligt löfte (*"innan du kör måste du trampa igång den"*) — exakt den falska
godkännande som kostade runda 114. Meningen ströks i stället; raden ovanför
säger redan samma sak.

**Regeln: vidga inte grinden för att passa texten. Ändra texten.**

### ☠️ 3. NEGATIONEN SAKNADE PLURALFORMEN

Självtestfall B — *"Den har inga pedaler alls"* — fälldes som ett LÖFTE om
pedaler. Orsaken: listan hade `ingen|inget` men **inte `inga`**.

Samma klass som `nej` som saknades i runda 114:s grind. Böjningarna skrivs nu
som ETT mönster (`ing(?:en|et|a)`) i stället för en uppräkning som kan tappa en
form. Verifierat genom att ta bort pluralformen: exakt ett fall faller.

⚠️ De sju riktiga texterna passerade ändå — men av tur. Deras negerande mening
råkade bära BÅDE `ingen` och `inga` (*"ingen motor att ladda och inga pedaler
att nå"*). En text som bara skrivit *"Den har inga pedaler"* hade fått
falsklarm, och ett falsklarm på korrekt text lär mottagaren att sluta läsa.

### ☠️ 4. OMVÄND ORDFÖLJD SLAPP FÖRBI TONGRINDEN — och ögat hittade den

Grinden fångade *"vi har inte fått"* men inte ***"har vi** inte fått"*. Den
formen stod kvar i en text grinden hade godkänt, och hittades först vid
genomläsningen med ögon.

Svensk huvudsatsinversion är regel, inte undantag: ett tonmönster måste tåla
båda ledföljderna. Mönstret är nu `(?:vi\s+har|har\s+vi)`, med ett eget
självtestfall.

⚠️ **Det är runbokens egen ordning som fångade den.** Grind FÖRE skrivningen,
ögon EFTER. Grinden ensam hade släppt igenom formuleringen till kund.

## Rundans egna grindar

| grind | vad den vaktar |
|---|---|
| `TRAMPLOFTE` | pedaler/trampa får bara stå negerat — varan har inga |
| `MOTORLOFTE` | eldriven/batteridriven likaså |
| `GASTOLSLOFTE` | gåstol är EN 1273, en annan produktkategori |
| `TOALETT` | leverantörens "Notfall-WC" är inte vår formulering |
| `FARTLOFTE` | farten är barnets egen, inte en produktegenskap |
| `MARKE` | märket bara där `LICENS` namnger det — alltså Caterpillar på ETT |
| talgrind | zonindelad: syskonets tal bara i länkens EGET stycke |

Plus signaturkontrollen: **pedalfrågan måste finnas i FAQ:n på alla sju**, och
den måste besvaras med nej. Det är rundans viktigaste besked till kunden.

## De sju sidorna

| nyckel | namn | slug |
|---|---|---|
| `cc6b56f9` | Grävmaskin att sitta på 85 cm – manövrerbar skopa och tippskydd | `gravmaskin-att-sitta-pa-85-cm` |
| `fb142c5c` | Hjullastare att sitta på 78 cm – skopa fram och leksakshink | `hjullastare-att-sitta-pa-78-cm` |
| `738ca991` | Bandgrävare att sitta på 78 cm – larvband och grävarm | `bandgravare-att-sitta-pa-larvband` |
| `0c05c1a0` | Frontlastare att sitta på 80 cm – stor skopa och växelspak | `frontlastare-att-sitta-pa-80-cm` |
| `23ba27a5` | Sparktraktor med släp, skopa och grep – ljus och musik | `sparktraktor-slap-skopa-grep` |
| `39d85f18` | Sparktraktor med släp och sandleksaker – gul | `sparktraktor-slap-sandleksaker-gul` |
| `389ac5ac` | Sparktraktor med släp och sandleksaker – blå | `sparktraktor-slap-sandleksaker-bla` |

Namn 44–63 tecken, titlar 31–40, metabeskrivningar 101–128 — alla inom taken.
Korslänkar går parvis inom grupperna: grävmaskin ↔ hjullastare, bandgrävare ↔
frontlastare, och de tre traktorerna i en kedja.
