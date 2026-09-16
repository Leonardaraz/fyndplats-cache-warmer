# Runda N5 — nio produkter 949–969 kr

Urvalet fortsätter **billigast uppåt** bland produkter där vi är billigare än
dealproffsen (Leonards regel). N2 täckte 599–699 kr, N3 699–879, N4 899–939,
den här 949–969.

| kort | vårt | deras | gap | produkt |
| :-- | --: | --: | --: | :-- |
| 3b868848 | 949 | 1 039 | +90 | Fällbart skrivbord som blir sidobord |
| 92fc308c | 949 | 979 | +30 | Sensorsoptunna 50 liter med mjukstängning |
| d7b7f77f | 949 | 989 | +40 | Gungren för barn med vaggvisor |
| 281ed0b1 | 959 | 969 | +10 | Barnförvaring med fyra stora lådor |
| 3a334cef | 959 | 969 | +10 | Konstgjord buxbom 115 cm |
| 3ddfd60c | 959 | 1 179 | +220 | Kontorsstol, höjdjusterbar |
| 132a00c5 | 969 | 1 049 | +80 | Växtställ i två plan med dräneringshål |
| 3c8fe7db | 969 | 1 239 | +270 | Kontorsstol i teddyfleece |
| 43b12b37 | 969 | 999 | +30 | Gungelefant med djurljud |

## Urvalet kom ur en FULLSTÄNDIG mätning, inte ett golv

Prisjämförelsen kördes med `fran_pris=940` och slutade på **0 prefix kvar** —
alltså är "de säljer den inte" ett besked och inte ett golv. Det är hela
skillnaden mot en delkörning, där varje produkt vars prefix ligger senare i
markören hade räknats som "de säljer den inte" när sanningen är "vi har inte
frågat än".

☠️ **Och sorteringen är numera ett FACIT, inte en avskrift.** Rapporten
sorterade bara på gapets storlek; den här rundans regel är billigast uppåt.
Tabellen härleddes därför om för hand vid varje runda, ur en summering som
inte går att läsa tillbaka programmatiskt. `dealproffsen.yml` skriver nu
listan sorterad på vårt pris, med prisgolv, till både summeringen och stdout.

## Elva kandidater föll innan en rad text skrevs

**En på lagergrinden:** `137403f6` (solpanel 100 W) står `OUT_OF_STOCK`. En
sida för en vara ingen kan köpa är slöseri i båda ändar.

**Fem på säsong** — mitten av september: campingbord, två odlingslådor,
häcksax och en solsängsdyna. En utegrupp som poleras nu får sin första
besökare om sju månader.

**Fem på måttskärmen mot hela den publicerade katalogen:**

| utkast | krockar med | delade tripplar |
|---|---|---|
| `339a695e` golvfåtölj | `db645ff8` | **3** |
| `b12666e7` väggspegel guld | `719ffb14` väggspegel 110 × 50 svart | 2 |
| `c0dd9d0c` köksset | `0ab3483a` + `b330de9c` frukostset | 2 mot vardera |
| `eb19eca6` köksset | samma två | 2 mot vardera |
| `4ab77ce5` kattlåda rostfritt | `8ef08765` | 2 |

Spegeln är lärorik: den är samma spegel i GULD där vi redan säljer den i
svart. Måtten avslöjar det, namnet gör det inte.

## Bildhashen gav ett ÄKTA negativt

Varje kandidatbild jämfördes på bytestorlek + pixelmått mot huvudbilden på
**2 808 publicerade produkter**: **noll träffar**, och noll interna krockar.
Den byte-identiska klassen finns alltså inte här — och det är precis därför
måttkollen ovan behövdes. De två grindarna fångar olika klasser.

## ☠️ Två utkast är SAMMA vara som två andra utkast

Aosoms egen feed bär mer än en artikelrad för samma fysiska produkt, och
dubblettspärren nycklar på `supplierProductId` — två artikelnummer är två
nycklar, alltså importeras båda. Spärren gör precis vad den ska och ser ändå
ingenting. Tredje gången huset möter klassen.

| par | delade tripplar | beslut |
|---|---|---|
| `3b868848` ≡ `5ae05b43` fällbart skrivbord | **4 av 4**, identiska | behåll den billigare, pensionera `5ae05b43` |
| `c0dd9d0c` ≡ `eb19eca6` köksset | **4 av 4**, identiska | båda faller ändå på skärmen ovan |

Och ett par till, en nivå mildare: `92fc308c` och `e87ab865` delar
PRODUKTmåttet 30,5 × 30,5 × 85 men har olika kartong (33 × 33 × 92 mot
33 × 33 × 86). Samma soptunna i två färger. Den billigare tas; den andra
publiceras inte, för då vore den en färgdubblett av vår egen nya sida.

## ☠️ En kandidat med bara EN mått-trippel kan grinden aldrig fälla

Skärmen kräver **två** delade tripplar — en delad komponent är inte samma
produkt. Följden är att en kandidat vars källa bara ger EN trippel aldrig kan
nå tröskeln: grinden svarar "inga krockar" utan att ha kunnat jämföra.

Fem kandidater är i det läget: `40690da1` (katthus i rotting), `9d2c88bd`,
`dc534033`, `1dc4b1ba` och `4444ab0f`. De räknas därför som OGRANSKADE, inte
som rena — samma skillnad som mellan `utanTraff` och `viBilligare` i
prisjämförelsen, och samma klass som SKU-kollen som itererade en tom lista.

`40690da1` hade annars legat i den här rundan på priset (959 kr). Den väntar.

## Rundan stängd — kvittokedjan hela vägen

| steg | facit | utfall |
|---|---|---|
| källorna ordagranna | kontrollsumma räknad server-side | **9/9** |
| artikelnummer i källfilerna (#257) | grep på `NNN-NNNXX` | **0** |
| lagersaldo | Wix inventory | 9/9 köpbara (68–197) |
| bildhash mot publicerade | md5 på huvudbilden | 0 träffar (äkta negativt) |
| måttskärm | den vida trippeln | 11 kandidater bortvalda |
| åtta filgrindar + kortgrinden | `tools/polish-gates/` | REN |
| kortens parning vid uppladdning | md5 hemhämtat mot lokal kopia | **9/9** |
| textskrivning | kontrollsumma i SAMMA anrop | 9/9, noll avbrott |
| media | `fieldMask: ["media"]`, ensam | **54 poster, 0 utan alt** |
| kategori | bulk-svarets `itemMetadata` per rad | **15/15** |
| variantsInfo | sist och ensam | 9/9, variantens `visible` kvar |
| stämpling | rutten läser tillbaka, 500 om värdet inte sitter | **9/9 gröna** |
| återläsning | SEPARAT anrop, `aterlas.js` | **9/9 LIKA**, alla synliga |
| kortens parning i BUTIKEN | Wix-mediaid **och** filnamn, samma post | **9/9**, kortet sist |
| **live-grind** | publicerad sida mot källfil | **9/9 REN, orddiff 0** |

Live-hämtningen gav `age` 101–102 s mot en paus på 90 — alltså den rendering
den varma träffen utlöste, inte en äldre cachad sida.

⚠️ **Återläsningen kom ur `aterlas.js`, inte ur minnet.** Det är hela skälet
filen finns: i N4 skrev jag om både `gatelib.fnv` och `wixnorm.normalisera`
för hand i anropet, och nio KORREKTA skrivningar rapporterades som SKILJER.
Den här gången gick den rakt igenom på första försöket.

## ☠️ Och kortkontrollen byggde ändå en ny tvilling — 0 av 9 på FACIT

Verifieringen av att korten sitter på rätt produkt svarade först **0 av 9**.
Inget av korten saknades: jag jämförde `kort-filer.tsv` mot fel fält.

```
kort-filer.tsv bär   b379ce_503fcc…~mv2.png   ← Wix MEDIAID
image.filename bär   kort-3b868848.png        ← LOKALA uppladdningsfilen
id / image.id / uploadId bär mediaid:t
```

Regeln `aterlas.js` bär sedan N4 höll, och den höll i ett helt nytt hörn:
**alla rader skiljer → misstänk FACIT; några rader skiljer → misstänk
skrivningen.** Nio av nio är för systematiskt för nio oberoende fel.

Det som avgjorde var att dumpa EN enda mediapost och läsa vad fälten faktiskt
heter — inte att resonera om vilket fält som borde vara rätt. Kontrollen
kräver numera att BÅDA handtagen pekar på samma post, så en träff inte kan
vara en tillfällighet.

☠️ **Och grenen kan sessionen inte radera själv** (403 på ref-borttagning).
`branch-cleanup.yml` äger rätten och läser sitt facit ur den UTCHECKADE
grenen, så facit pushas FÖRE körningen och `ref` sätts till arbetsgrenen.
Raderingen är verifierad genom att läsa fjärren, inte genom workflowens
exit-kod: `git ls-remote origin 'refs/heads/kort-*'` svarar tomt.
