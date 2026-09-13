# Vad fotona sa INNAN texten skrevs — runda M2

Kontaktarket byggdes före brödtexten (regeln från runda J1). Rundan gav tre fynd,
och två av dem hade ingen grind kunnat se.

## ☠️ Källan ljuger om sin egen produkt: `d6413671` håller ingen käpp

Källtextens första säljpunkt, ordagrant:

```
✔ Aufblasbares Weihnachtsdeko mit einem Entwurf von einem Weihnachtsmann
  mit einem Gehstock in der Hand
```

`Gehstock` är en promenadkäpp. Position 4 är en närbild på exakt det föremålet,
och det är en **polkagriskäpp** — röd- och vitrandig, med den böjda kroken uppåt.
Ingen käpp, ingen handtagsknopp, inget trä.

Produktens EGNA alt-texter säger `Zuckerstange` — alltså polkagris. Källan
motsäger alltså sig själv: brödtexten säger käpp, alt-texten säger polkagris,
och fotot ger alt-texten rätt.

⚠️ **Ingen grind kunde ha fångat det.** `Gehstock` står i källan, så en svensk
text som skrev "promenadkäpp" hade varit spårbar till sitt underlag: siffergrinden
ren, språkgrinden ren, orddiffen noll. Det är samma klass som golvlampan i J1 —
en sann utsaga om en produkt som inte finns. Det enda som avgör är ögat på fotot.

**Regeln, en gång till: källans ORD är ett påstående, inte ett facit.** När den
beskriver konstruktion, antal delar eller vad en figur håller i handen — titta.

## ☠️ Reklamplanschen är INTE en hash — fem produkter, tre filer, två husmärken

Runda M1 lärde huset att gruppera på huvudbildens hash (#243). Den här rundan
visar gränsen för den tekniken. Hash-svepet över rundans 39 bilder gav ETT fynd:

| hash | sitter på |
| :-- | :-- |
| `5182e1aa8876021330cbcc7a4ae9e02c` | `2f881d00#5` · `46dd0605#5` · `d6413671#5` |

Tre produkter. Ögonen på kontaktarket gav **fem**:

| kort | pos | hash | byte | vad det är |
| :-- | --: | :-- | --: | :-- |
| `2f881d00` | 5 | `5182e1aa…` | 1 261 486 | HOMCOM-plansch + tysk mening |
| `46dd0605` | 5 | `5182e1aa…` | 1 261 486 | samma fil |
| `d6413671` | 5 | `5182e1aa…` | 1 261 486 | samma fil |
| `7bc7805a` | 5 | **`cba49ca1…`** | **1 261 406** | **SAMMA PLANSCH, annan fil** |
| `32bc0d95` | 5 | **`135e7707…`** | 1 690 903 | **Outsunny-plansch, annat husmärke** |

☠️ **`7bc7805a#5` är den farliga.** Den ser likadan ut som de tre andra — samma
motiv, samma tyska mening, samma logotyp — men är **80 byte mindre** och har en
helt annan hash. En regel formulerad som *"ta bort bilder med hash 5182e1aa"*
hade lämnat två av fem planscher publicerade, och den ena bär ett husmärke i
stora lysande bokstäver.

**Regeln: hashen grupperar, den klassificerar inte.** Sista bilden på ett
Aosom-utkast ska SES, inte matchas mot en känd hash. Planschen finns i minst två
byte-varianter och under minst två husmärken.

## Måttritningens människosilhuett bär tre olika tal

M1:s dyraste fynd var att `180` i en måttritning var SILHUETTEN och inte
produkten. Den här rundan har silhuetten i fyra ritningar, och talet skiljer sig
mellan dem:

| kort | silhuetten säger | produktens höjd |
| :-- | --: | --: |
| `80e1a550` | 1,82 m | 240 cm |
| `2f881d00` | 1,82 m | 122 cm |
| `7bc7805a` | **1,83 m** | 180 cm |
| `46dd0605` · `d6413671` · `32bc0d95` | 1,8 m | 243 / 240 / 184 cm |

Inget av de talen är produktens, och inget av dem står i någon källtext. De är
utelämnade ur både brödtext och alt-texter.

⚠️ `7bc7805a` är den som lurar: produkten ÄR 180 cm hög, och silhuetten bredvid
är 183. Ett tal som nästan stämmer är svårare att upptäcka än ett som inte alls
gör det.

## Vad fotona lade TILL som källan inte nämner

**`2f881d00` — en hund som inget tyskt ord nämner.** Namnet säger
`Weihnachtsmann mit Schlitten und Rentier`, och specen säger samma sak. I släden
sitter dessutom en **gråvit hund med tomteluva och tungan ute**, med framtassarna
över kanten på en grön klappsäck. Den syns i position 1, 2 och 4. Det är
produktens bästa detalj och den fanns inte i ett enda ord.

**`032b728d` — granen har en guldstjärna.** Källan säger bara att tomten håller
en `Weihnachtsbaum`. Granen är grön med blå kulor och en gul stjärna i toppen.

## De två polkagristomtarna skiljs på vantarna

`46dd0605` och `d6413671` har **identiska tyska produktnamn**
(`Aufblasbar Weihnachtsdeko, 2,4 m Weihnachtsmann mit LED-Beleuchtung`) och
ligger 40 kr isär. De är olika produkter, och skillnaden syns direkt i bild:

| | `46dd0605` | `d6413671` |
| :-- | :-- | :-- |
| vantar och muddar | **gröna** | **svarta** |
| mått | 125 × 95 × 243 cm | 160 × 90 × 240 cm |
| armställning | uppåt, smal siluett | utsträckta, bred siluett |
| källans färg | `Rot+Weiß+Grün` | `Rot, Weiß+Schwarz` |
| ljus | 2 LED | 2 ljusmoduler à 0,9 W |

Båda håller en polkagriskäpp. Vantfärgen är det som skiljer dem på ett kort, och
den står i BÅDA namnen och i första meningen.

## `321bdedf`: samma tal, olika axelbokstav

Tyska specen säger `170B x 100T x 245H` (Breite × Tiefe × Höhe). Den importerade
svenska spec-raden säger `170L x 100B x 245H` — samma tal, men `100` har bytt
bokstav från djup till bredd. Måttritningen ger tyskan rätt: **1,7 m bred, 1 m
djup, 2,45 m hög.** Brödtexten följer ritningen. Spec-raden är importens och rörs
inte.

## Noll tyska inbrända grafiker i övrigt

Position 3 är måttritning på alla åtta och bär bara tal och enheter — ingen tysk
rubrik. Position 4 är detaljfoto utan text. Utöver de fem planscherna finns
ingen inbränd tyska i rundans 39 bilder.

## Bara fyra bilder på `032b728d`

`032b728d` har fyra bilder, och position 4 är en andra vit studiobild snarare än
ett detaljfoto. Efter planschstädningen har den alltså inget närbildsmaterial
alls. Kandidat för eget spec-kort, samma klass som #212, #216 och #223.

## ⚠️ `032b728d`: ritningen och specen är 3 cm oense — och ritningen är i minoritet

| säger | höjd |
| :-- | --: |
| `Gesamtmaße: 150L x 78B x 243H cm` | **243** |
| tyska produktnamnet (`243 cm`) | **243** |
| importens svenska spec-rad (`150 x 78 x 243 cm`) | **243** |
| **måttritningen, position 3** | **240** |

M1:s regel sa *"ta höjden ur specblocket och kontrollera mot ritningen"* — men
den sa inte vad man gör när de INTE stämmer. Här vinner specen på tre mot ett,
och framför allt: spec-raden är den enda av de fyra som kunden faktiskt ser på
sidan. En brödtext på 240 hade motsagt produktens egen spec-tabell två rader
längre ned.

**Brödtexten skriver 243.** Bredd och djup stämmer (150 och 78 på både ritning
och spec). Avvikelsen är bara höjden och bara 3 cm, men den är värd att stå
nedskriven: nästa gång ritningen och specen bråkar är tiebreakern **den
spec-rad kunden ser**, inte ritningen.
