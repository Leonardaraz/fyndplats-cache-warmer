# Runda 75 Steg 1 — kontorsstolar, och en dubblettgrind som gav FEL SVAR

## Familjen

Katalogsvep 2026-09-06: **5 502 produkter, `unika == lästa`, `avhuggen: false`**,
3 485 utkast.

| mätning | träffar |
|---|--:|
| Delsträng `bürostuhl\|chefsessel\|drehstuhl\|schreibtischstuhl\|gaming.?stuhl\|arbeitsstuhl` | **186** |
| Huvudord (`^Bürostuhl` m.fl.) | 125 |
| **Osynliga för huvudordsmätningen** (ledande adjektiv) | **24** |
| Efter att massage/värme lyfts ut (egen Steg 2-grind) | 138 |
| Publicerade sidor med kontorsstols-slug | **37** |

Fördelningsfilen sa `^Bürostuhl (13)` — räknat i fåtöljsvepets scope, inte som
en egen mätning. Verkliga talet är fjorton gånger så stort.

## ☠️ Dubblettgrinden sa "noll krockar" — och hade fel på tre produkter

Första körningen jämförde varje `A × B × C`-trippel i utkastet mot varje trippel
i de publicerade sidorna och rapporterade **0 av 138 med krock**. Det svaret var
falskt, och felet är runda 74:s lärdom en gång till — fast åt det farliga hållet.

☠️ **Grinden läste PAKETMÅTTET ur utkasten och PRODUKTMÅTTET ur de publicerade.**
Utkastens spec-block slutar med `Paketmått: 72 × 45 × 63 cm`, en ren trippel som
regexen hittade först; de publicerade sidorna har inget paketmått alls utan bara
`Mått (B×D×H)`. Grinden jämförde alltså två storheter som aldrig kan mötas — och
en jämförelse som aldrig kan träffa rapporterar noll träffar, inte ett fel.

☠️ **Runbooken visste redan svaret.** Den namnger `0945e4dd` sedan 2026-09-02 som
måttmatchning mot den publicerade `kontorsstol-fotstod-sammet`. Att min egen
mätning sa något annat borde ha vägt lättare än husets skrivna fynd — det gjorde
det inte förrän en grep råkade hitta raden.

⚠️ **Andra försöket var också fel, men syntes.** Det jämförde `Gesamtabmessungen`
mot `Mått:` och gav fortfarande "ren" — för att bara **379 av 2 017** publicerade
sidor hade en måttrad som regexen kunde läsa. Formaten skiljer sig: `Mått totalt`,
`Mått nedfälld`, `Mått i viloläge`, `Sittmått`, och några sidor har ingen alls.

✅ **Det som avgjorde var att läsa ut de 37 publicerade specraderna och jämföra
med ögon.** Regeln: *en dubblettgrind över en heterogen textmassa är ett såll som
måste kalibreras mot ett känt fall innan den får rapportera noll.* Ett "noll
krockar" utan ett bevisat positivt utfall i samma körning är ingen mätning.

## De fyra modellgrupperna — bevisade av BRÖDTEXTEN, inte av namnet

Alla tre grupperna är belagda med byte-identisk tysk brödtext, inte med namnet.
`0945e4dd` heter `Ergonomischer Bürostuhl, neigbare Rückenlehne…` medan syskonen
heter `Bürostuhl Höhenverstellbarer Drehstuhl…` — olika namn, samma text, samma
sju mått. Runda 59:s regel står oemotsagd.

| grupp | Gesamtabmessungen | produkter | verdikt |
|---|---|---|---|
| **A** bouclé, nackstöd, fjäderkärna | 65 × 75 × 115–123 | 75f6c433 Hellgrau · 7ab2f8aa Dunkelgrau · 60c803f0 Braun | **ren** |
| **B** snöflanell, 3-läges rygg, fotstöd | 80 × 80 × 106–114 | cc81673d Cremeweiß · 0945e4dd Braun · ~~501ba88f Dunkelgrau~~ | **tvilling — se nedan** |
| **C** sammetslook, vippfunktion, fast fyrstjärnig fot | 67 × 68 × 103–113 | 348ee535 Grau · 4d83eca6 Cremeweiß | **ren** |
| **D** högrygg med fotstöd | 74 × 65 × 120–128 | 10235819 Hellgrau · 4fa0ae0a Dunkelgrau | **ren — sparad till runda 76** |

## ☠️ `501ba88f` är inte ett syskon, det är SAMMA VARA I SAMMA FÄRG

Grupp B matchar den publicerade `kontorsstol-fotstod-sammet` (`40988803`) på
**åtta mått**, inte tre:

| | utkasten | publicerad |
|---|---|---|
| Yttermått | 80 × 80 × 106–114 | 80 × 80 × 106–114 |
| Liggläge | 80 × 152 × 90–98 | 80 × 152 × 90–98 |
| Sits | 55 × 50, höjd 52–60 | 55 × 50, sitthöjd 52–60 |
| Sitstjocklek | 15 cm | 15 cm |
| Ryggstöd | 65 × 64, tjocklek 12,5 | 65 × 64, tjocklek 12,5 |
| Armstöd | 43 × 15, höjd 21 | 15 × 43, höjd 21 |
| Fotstöd | 34 × 21 × 5 | 34 × 21 × 5 |
| Maxlast | 120 kg | 120 kg |

Den publicerade sidans färg är **mörkgrå**. `501ba88f` är **Dunkelgrau**.
Det är alltså inte en färgvariant att lägga till — det är samma sida en gång
till, och just den sortens interna dubblett `CLAUDE.md` kallar den farliga.

**`501ba88f` poleras inte.** `cc81673d` (Cremeweiß) och `0945e4dd` (Braun) är
äkta färgsyskon och poleras med länk till den publicerade mörkgrå sidan.

⚠️ `127b4726` togs INTE med: runbooken har redan avfärdat den (grå version av en
publicerad svart nätstol, avgjord på måttritningarna).

## Steg 2 — laglighetsgrinden

Kontorsstolar är ingen stoppklass. Två saker gäller ändå:

1. ☠️ **Ingen av de sju får säljas som arbetsstol för en arbetsplats.**
   Leverantören namnger ingen standard — inte EN 1335, inte någon annan — och
   `Zertifiziert` utan norm är ingen certifiering (samma regel som barngrindarna
   i Steg 2). Texten säger vad stolen ÄR och vad den kan ställas i, aldrig att
   den uppfyller ett arbetsmiljökrav. Uppgift #123, som redan avgjort saken en
   gång för knästolen.
2. ☠️ **Hälsopåståendena i den tyska texten stryks, alla.** Ordagrant i källan:
   *"die ausziehbare Fußstütze die Durchblutung fördert"* (fotstödet främjar
   blodcirkulationen), *"stützt Ihre Wirbelsäule optimal"*, och en inramning där
   arbetsdagen *"oft mit verspanntem Nacken und Rückenschmerzen enden"*. Det är
   medicinska påståenden om en möbel utan ett enda underlag. `ergonomisk` får
   stå kvar som FORMBESKRIVNING, bunden till ett mätbart drag (justerbart
   nackstöd, svankstöd), aldrig som utlovad effekt.

**Maxlast 120 kg** är en säkerhetsrelevant begränsning och får egen rubrik i
brödtexten, enligt Steg 2:s regel om positiva villkor.

## ☠️ Importen har redan gett sju av sju en KROCKANDE SKU

| SKU i butiken i dag | bärs av |
|---|---|
| `FP-burostuhl-mit` | 75f6c433, 7ab2f8aa, 60c803f0 |
| `FP-burostuhl` | cc81673d, 501ba88f |
| `FP-burostuhl-mit-stoffbezug` | 348ee535, 4d83eca6 |

Det är uppgift #272 i skarpt läge: krocken skapas av importen, inte av
poleringen. Alla sju får distinkta SKU:er i Steg 8.

⚠️ **Och den svenska `Material`-etiketten är opålitlig.** Samma modell i grupp A
har `Material: Polyester` på ett utkast och `Material: Metall` på två, medan den
tyska texten säger bouclé + skum + plywood + galvaniserad metall för alla tre.
Tyskan är källan; den importerade svenska raden är det inte.

⚠️ **Grupp C motsäger sig själv om ryggstödets bredd:** `348ee535` säger 65 cm,
`4d83eca6` säger 50 cm, och allt annat är identiskt (67 × 68 × 103–113, sits
48 × 46, vikt 15,5 kg). Ett av talen är fel och det går inte att avgöra vilket —
**ryggstödets bredd utelämnas därför ur båda sidorna.** Hellre en uppgift mindre
än en uppgift som är fel på hälften av sidorna.
