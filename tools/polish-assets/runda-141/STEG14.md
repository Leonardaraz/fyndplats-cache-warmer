# Runda 141 — Steg 14: live-grinden

```
grind.sjalvtest():     25 fall, 0 fel
grindar._sjalvtest():  78 fall, 0 fel
kontrollsida sissy-squat-bank-3-i-1       2 träffar som är BUTIKENS
     (butikens) OGRUNDAD CERTIFIERING — inget i underlaget säger att bänkarna är provade
     (butikens) SUPERLATIV utan mätvärde

8de3c3ef  traningsbank-115-cm-benstrackare                 HIT    0 fel
7b818c3b  traningsbank-med-stallning-98-122-cm             HIT    0 fel
8a0e05f4  traningsbank-146-cm-tre-lutningar                HIT    0 fel
b4961e6f  traningsbank-butterfly-svart-hopfallbar          HIT    0 fel
83b2cf8b  traningsbank-175-cm-med-skivstangsstall          HIT    0 fel
a4bbe667  traningsbank-180-cm-vit-med-skivstangsstall      HIT    0 fel
18b94738  traningsbank-i-tra-med-hantelfack                HIT    0 fel

SUMMA: 7 sidor, 0 fel
```

Sju `HIT` betyder sju sidor som FAKTISKT hämtades — grinden räknar inte en
utebliven hämtning som noll fel.

Kontrollsidans två träffar är hela skälet till att den finns: båda kommer ur
butikens egen chrome och skulle ha dykt upp på rundans sidor också, utan att
vara rundans text. Utan en kontrollsida hade de sett ut som två fynd per sida.

## ☠️ Grinden fällde 7 av 7 först — och den hade rätt

Första körningen efter publiceringen:

```
SUMMA: 7 sidor, 7 fel
     - SAKNAR EGET KORT — 6 bilder i galleriet, ingen med 'Faktakort: '
```

`grindar.kortfel` mäter prefixet **`Faktakort: `** i galleriets thumb-rad. Det
ÄR kriteriet för runbookens "minst ett eget Fyndplats-kort" — inte en
stavningsdetalj, utan den enda mekaniska definitionen som finns. Rundan hade
skrivit `Spec-kort från Fyndplats med …`.

Två fel i ett, och det andra är det allvarligare:

1. Kortet blev **osynligt för grinden**, alltså räknades sidan som kortlös.
2. Texten ledde med **vårt varumärke** i ett fält som ska beskriva innehåll.
   `kortfel` fäller uttryckligen `Fyndplats-kort:` av precis det skälet;
   `Spec-kort från Fyndplats` är samma överträdelse i en form grinden inte
   kände igen — och DÄRFÖR nådde den live.

☠️ **Formen fanns bara i live-grinden, inte i rundans egen alt-grind.** Det är
mönstret värt att ta med: ett krav som bara en sen grind känner till hinner
skrivas till kund innan det fälls. Lagningen flyttade kravet framåt —
`alttexter._kortformkoll` grindar nu BÅDA halvorna (prefixet OCH varumärket) före
skrivningen, med tre planterade former provkörda.

Kortet ligger på **plats 3** på alla sju, aldrig 1 — huvudbilden och
delningsbilden ska vara varan.

| pid | bilder | kortets plats | rev före → efter media-PATCH |
|---|--:|--:|---|
| `8de3c3ef` | 6 | 3 | 8 → 9 |
| `7b818c3b` | 6 | 3 | 6 → 7 |
| `8a0e05f4` | 6 | 3 | 6 → 7 |
| `b4961e6f` | 6 | 3 | 8 → 9 |
| `83b2cf8b` | 5 | 3 | 7 → 8 |
| `a4bbe667` | 6 | 3 | 8 → 9 |
| `18b94738` | 6 | 3 | 7 → 8 |

Kroppen komponerades aldrig för hand (`mediapatch.py` ur `galleri-facit.json` +
`alttexter.ALT`): `ExecuteWixAPI` är 403, så skrivningen gick via
`CallWixSiteAPI` där kroppen KLISTRAS IN, och det är precis den risk husets
fil-regel finns för. Formen speglar `lib/wix/client.ts#setProductMedia` — fält
`id` (aldrig extern `url`) för filer som redan ligger i Media Manager, ingen
`media.main`, fältmask `media`.

## ☠️ Rundans EGEN självtest hade hoppats över TYST

`liverunda.sjalvtester` gör `getattr(GR, "sjalvtest", None)`. Rundans grind
döpte sin till `_sjalvtest`, så live-grinden hoppade över den — och skrev ut
raden *"rundans grind självtestas i mutation.py"*, en fil som inte finns i den
här rundan. Utskriften var alltså inte bara tyst, den var **falsk**.

Det är runda 129:s bortfall, återskapat. Det hittades bara genom att LÄSA
`liverunda.py` — ingen grind kunde se det, för grinden som skulle ha sett det
var den som hoppades över.

Lagat i båda halvorna: `grind.sjalvtest()` exponeras med kontraktet
`(fel-lista, antal fall)` (25 fall, 0 fel), och `liverunda` fäller nu
HÖGLJUTT på en grind som bär `_sjalvtest` men inte `sjalvtest`. Mätt över alla
39 rundors `grind.py` innan vakten lades till: **noll** bar tillståndet, så den
fäller ingen befintlig runda — den fäller den nästa som döper sin självtest fel.

## Vikterna på fotot: upplysningen finns på alla tre (#554)

Tre sidor visar viktskivor eller hantlar i sina foton (`STEG4.md` rad 100–102).
Mätt meningsvis i de skarpa PATCH-kropparna, inte med en radsökning:

| pid | var upplysningen står |
|---|---|
| `83b2cf8b` | meta + brödtexten två gånger — *"Vikter och skivstång ingår inte"* |
| `a4bbe667` | brödtexten två gånger + egen rubrik *"Vad som behövs utöver bänken"* |
| `18b94738` | FAQ — *"Hantlar ingår inte."* |

De fyra övriga har ingen vikt i bild och behöver därför ingen rad.

## Rundan är klar — 7 av 8

`562e42fc` pensionerades i Steg 1 (bevisad dubblett, ommappad till Aosom, #549).
De sju står publicerade, i kategorin **Sport & Fritid / Träning & Gym**, med
EU-lager-ribbon, svenska sökord och charm99-priset oförändrat.

Kvar, och det hör till STÄDNINGEN (#283) och inte till poleringen — Leonards
sekvensering 2026-09-05, polera färdigt först och rätta strukturen sedan:

- **#551** — `83b2cf8b`:s bild 3 bär `HOMCOM by Aosom` inbränt i pixlarna.
  Bilden är borttagen ur galleriet (därav 5 bilder i stället för 6), men hur
  många publicerade sidor i katalogen som bär en logotyp är **inte mätt**.
- **#555** — sju redan publicerade systerbänkar ligger utanför kategoriträdet.
