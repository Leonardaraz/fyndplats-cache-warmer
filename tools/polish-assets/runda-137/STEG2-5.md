# Runda 137 — Steg 2 till 5

40 bilder granskade, åtta produkter. **Noll leverantörsreklamer, noll tyska
textrutor, noll logotyper i övre vänstra hörnet.** Alla åtta måttritningar
(källposition 3) bär bara siffror med `cm` — de går rakt in i galleriet.

Det är ovanligt rent för den här familjen, och det är värt att säga rakt ut:
utfallet varierar kraftigt mellan produkter, och att en runda är ren betyder
inte att nästa är det.

## Steg 2 — laglighetsgrinden passerar, med två villkor att bära vidare

Klösmöbler är **ingen stoppklass**. L80 (SJVFS 2019:15) reglerar burar, hus
och inhägnader där djuret HÅLLS — inte möbler djuret använder fritt i hemmet.
EN 1930 gäller **barngrindar**; ingen av de åtta nämner barn i någon kanal.

Två säkerhetsrelevanta uppgifter ska ändå vidare till spec-tabellen och
skrivas som **positiva villkor med egen rubrik**, aldrig som varningsblock:

| grupp | uppgift | källa |
|---|---|---|
| `c7bd00b9` · `a73a1a1c` | takspänne + tippskydd ingår | `Anti-Kipp-Sicherung`, `Deckenspanner` |
| `f489937f` · `5616c567` | bärförmåga 10 kg | `Belastbarkeit: 10 kg` |
| alla åtta | rekommenderad kattvikt | 4 kg (90 cm-paret), annars 5 kg |

⚠️ **Kattvikten är en REKOMMENDATION, bärförmågan ett TAK.** De två är olika
tal med olika innebörd och de står i olika fält. Bara `f489937f`/`5616c567`
anger båda; de takhöga anger bara kattvikt. Skriv inte ut ett tak som inte
finns i källan.

## Steg 5 — sex fynd, ett av dem avgjort av bilden

### ☠️ 1. `dd3b541b` säljer en KOJA som en KATTLÅDA

Färgsyskonen beskriver samma 30 × 30 × 28 cm-utrymme olika:

| | leverantörens `Beschreibung` |
|---|---|
| `f5f71f5d` (creme) | "Ausgestattet mit Kratzbaum, **Katzenhöhle**, …" |
| `dd3b541b` (grå) | "Ausgestattet mit Kratzbaum, **Katzentoilette mit abnehmbarem Bezug**, …" |

Båda har IDENTISKA `Technische Daten` och kallar utrymmet `Katzenbox` —
ett ord som rymmer båda tolkningarna.

**Bilden avgör.** Båda visar en sluten plyschklädd låda med ett runt hål på
Ø18 cm, och `dd3b541b`:s bild 4 visar en katt som LIGGER inne i den. En
kattlåda har öppen ovansida eller en utdragbar pannae; det här har varken.

Det är alltså en **koja**, och `dd3b541b`:s beskrivning är hopklistrad från
en annan produkt. Hade texten fått bestämma sålde vi en sovplats som en
toalett.

⚠️ Samma klass som runbokens `Gaming Stuhl`-mätning: **ordet i källan säger
ingenting om vad varan ÄR.** Skillnaden här är att SYSKONET säger rätt, så
motsägelsen är synlig utan att man tittar — om man läser båda.

### ☠️ 2. `a73a1a1c` anger sitt eget mått i METER

Alt-texten, ordagrant: `40 cm x 40 m x 250 cm`. Fyrtio **meter** djup.
Ett rent skrivfel hos leverantören, men det sitter i det fält som blir
kundens bildbeskrivning om man kopierar alt-texten rakt av.

### ☠️ 3. `819bf51c`:s färg står i tre kanaler och stämmer i noll

| kanal | säger |
|---|---|
| `Technische Daten` | `Farbe: Grau` |
| svensk spec-rad | `Färg: Grau` (dessutom oöversatt) |
| alt-text | `schwarz+grau` |
| **bilden** | **ljusgrå plyschsteg, mörkgrå stammar** |

Ingen av kanalerna säger "ljusgrå med mörkgrå stammar", som är vad kunden
får. `schwarz` är för mörkt — stammarna är mörkgrå, inte svarta.

### ☠️ 4. `höhenverstellbar` är ett ostött påstående i tre kanaler

Trapporna påstås höjdjusterbara i `Beschreibung` OCH i båda alt-texterna.
`Technische Daten` ger däremot FASTA stephöjder — 18, 33, 50 och 66 cm —
och bilden visar en styv ram utan justering.

Det källan FAKTISKT stödjer står i samma mening: *"3-stufige bzw. 4-stufige
Katzentreppe"*. Trappan kan alltså byggas med tre steg i stället för fyra,
vilket sänker toppen från 66 till 50 cm. **Skriv det konkreta, inte
marknadsordet.**

### ☠️ 5. Den svenska `Material`-raden är opålitlig i HELA batchen

Importen skriver en svensk spec-rad som inte stämmer med den tyska källan:

| produkt | tyska `Technische Daten` | svensk spec-rad |
|---|---|---|
| `f489937f` · `5616c567` | E1 Spanplatte, **Lammwolle**, **Sisal** | `Material: Polyester` |
| `a73a1a1c` · `c7bd00b9` | Spanplatte, Polyester, **Sisal** | `Material: Polyester` |
| `f5f71f5d` | Spanplatte, Sisal, Plüsch, Filz | `Material: Sparticles, Sisal, Plush, Felt` |

Den sista är dubbelt trasig: **engelska** i en svensk tabell, och
`Sparticles` är inget ord alls — det är `Spanplatte` som gått sönder i
maskinen. Bygg spec-tabellen ur den TYSKA raden, aldrig ur den svenska.

### ⚠️ 6. Stammarnas material skiljer mellan färgsyskonen — flaggat, inte skrivet

`1ae60dbc`:s närbild (källposition 8) visar otvetydigt **jutelindade**
stammar: repvarven syns. `819bf51c`:s närbild visar en mörkgrå, matt och
jämn yta utan synliga varv.

`Technische Daten` är identisk för båda (`Ø2,5 cm` respektive `Ø6,7 cm`) och
nämner ingen materialskillnad. **Bilden räcker inte för att avgöra** om den
grå är mörkfärgad sisal eller textil.

🔒 Följden för texten: ingen av de två sidorna påstår ett stammaterial. De
beskriver stammarnas GROVLEK, som är mätt och identisk. Ett materialord som
bara den ena bilden stödjer är precis den sortens gissning som blir ett fel
på en kundsida.
