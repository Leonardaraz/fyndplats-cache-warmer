# Runda 85 — sex sopsorteringstunnor, klara och live

| id8 | slug | pris | volym | material |
|---|---|--:|--:|---|
| `17fb1869` | `soptunna-med-2-fack-30-liter` | 899 | 2 × 15 = 30 L | 410 rostfritt |
| `b10b80ee` | `soptunna-med-2-fack-40-liter-silver` | 1029 | 2 × 20 = 40 L | 410 rostfritt, polerat |
| `10c47f8e` | `soptunna-med-2-fack-40-liter-svart` | 1029 | 2 × 20 = 40 L | 410 rostfritt, polerat |
| `213be879` | `soptunna-med-2-fack-40-liter-smal` | 1129 | 2 × 20 = 40 L | 410 rostfritt |
| `a00882ed` | `soptunna-med-2-fack-60-liter` | 1379 | 2 × 30 = 60 L | **pulverlackerad plåt** |
| `ec672f4d` | `utdragbar-soptunna-3-fack-31-liter` | 1179 | 15 + 8 + 8 = 31 L | **ABS och plast** |

Priserna är orörda. Alla sex är `visible: true` på produkt OCH variant,
kopplade till Kök & Husgeråd + Köksredskap & Tillbehör, och stämplade
`needsAiPolish:false` / `draftStatus:published` via workflowen.

## Live-kvittot

Alla sex hämtade OCACHAT (`x-vercel-cache: MISS`), alla `200`, och alla sex
matchar facit på **både längd och hash**:

```
17fb1869  2878  lika      213be879  3015  lika
b10b80ee  2943  lika      a00882ed  2853  lika
10c47f8e  2904  lika      ec672f4d  3076  lika
```

Att hashen stämmer är hela poängen: kundens text är BYTE FÖR BYTE den lint
godkände, så varje lint-regel gäller på live-sidan per konstruktion. Sju
korslänksmål svarar 200.

## Rundans fyra fynd

### ☠️ Tredje facket syns bara i EN av fem bilder

`ec672f4d` säljs som tre fack (15 + 8 + 8 liter). Produktrenderingen och
miljöbilden visar **två** hinkar — det är kameravinkeln, inte varan.
Explosionsvyn har tre färgblock: grön 8 L, blå 8 L med texten upp och ner,
orange 15 L.

Hade granskningen stannat vid renderingen hade en korrekt text sett ut som
ett fel, och att "rätta" den hade gjort tre fack till två i namn, slug,
titel och kort. **Bilden är inte ETT bevis — den är fem, och de säger olika
mycket.**

### ☠️ Sex syskon, TRE stommaterial — och bilden avgjorde

Fyra tunnor i 410 rostfritt, en i pulverlackerad plåt, en i ABS. Att kopiera
grannens materialrad är rundans naturligaste fel, och specen ensam är ett
svagt facit. Bilden är den oberoende källan, och den delar dem på exakt
samma ställe:

- de fyra i rostfritt bär leverantörens egen **"Rahmen aus Edelstahl"**-grafik
- `a00882ed` har **ingen** sådan grafik alls — påståendet SAKNAS, vilket är
  precis vad "inte rostfritt" ser ut som
- `ec672f4d`:s grafik säger "Zuverlässiger Rahmen" och aldrig Edelstahl

Materialet står i spec-raden `Stomme`, kortet byggs ur samma lista linten
granskar, och lintens `FEL_MATERIAL_RE` fäller om brödtexten glider.

### ☠️ Två syskon delade BÅDA sina miljöscener

`b10b80ee` och `10c47f8e` är samma tunna i silver och svart, och
leverantören har klistrat in dem i **exakt** samma två scener: samma
marmorköksö med samma växt, och samma kontor med samma person i samma pose.

Att lägga båda scenerna på båda sidorna hade gett två av VÅRA egna URL:er
nästan identiska foton — den dubblett Google straffar, och den uppstår av
oss, inte av leverantören. Köket gick till silvret, kontoret till svarta.
Priset är fyra bilder per sida i stället för fem, och det är rätt pris.

### ⚠️ Måttritningen flyttades SIST — runda 84 lämnade den på plats 4

Runbookens ordning är hjältebild → verklighetsbild → egna kort → ritning,
och skälet är Leonards regel: kunden ska inte möta två spec-tabeller i rad.
Med kortet på plats 3 och ritningen på plats 4 blir det precis det. Runda 84
lade kortet rätt men lät ritningen ligga kvar direkt efter — rättat här.

## Tre grindar som byggdes för att de FÄLLDE

1. **Alt-textens tal måste stå i produktens egen spec.** En alt-text kan
   inte bära ett ankare, så ett syskons volym har ingen väg att bli korrekt
   där — bara att bli fel.
2. ☠️ **Måttritningens alt-text jämförs med MÅTTRADEN, inte med hela specen.**
   Grind 1 räckte inte, och det är mätt: byter man `b10b80ee`:s "45,8 cm bred"
   mot syskonets "40 cm bred" släpps det igenom, eftersom 40 cm står i den
   produktens PAKETMÅTT. Ritningen påstår sig återge en bestämd rad, så den
   får jämföras med just den raden.
3. **Ordlistan läses ur `lint.TYSKA_BANK`, aldrig kopieras.** Runda 84 bar en
   egen kopia i `live.py`. Samma familj som `SHIP_AXIS_RE` och `EU_TULL_CODES`.

`media-mutationstest.py` kör nio mutationer mot alt-grinden: **9/9 fångade**.

## Kortet som kontaktarket fällde

`17fb1869`:s rubrik hette **"Låg och bred"**. Tunnan är 41,7 cm bred och
43,2 cm hög — alltså knappt HÖGRE än bred. Felet syns bara när rubriken
står bredvid fotot, och det är precis vad kontaktarket är till för. Blev
"Låg modell — 43,2 cm hög", där talet bär rubriken utan jämförelseord.

## Kvar att avgöra ur familjen

| id8 | varför den inte poleras nu |
|---|---|
| `e42eca69` | exakt dubblett av publicerade `soptunna-med-3-fack-45-liter` |
| `300a9113` / `43ea33bd` | identiska med varandra |
| `56b32f2f` | tredje 40-litersmodellen — volymen är tagen tre gånger om |
| `a23f72f3` / `3b452c6e` | 56 L, och den volymen har redan en publicerad sida |
| `c3e0c4a6` | 30 L sensortunna, dubblett mot runda 84 |
