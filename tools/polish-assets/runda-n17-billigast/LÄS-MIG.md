# Runda N17 — sex produkter, billigast uppåt

Sjuttonde rundan i urvalet *billigast uppåt bland de produkter där vi är
billigare än dealproffsen*. Alla sex är Aosom-utkast som publicerats, alla
sex har fått ett eget Fyndplats-kort sist i bildlistan.

| kort | produkt | pris | kategori |
| :-- | :-- | --: | :-- |
| `0caa8b84` | Fristående badrumsskåp i bambu, tre hyllplan, smalt | 1 179 kr | Badrum & Hemtextil |
| `1327c4c6` | Köksmaskin med degkrok och vispar, 1400 W, 5,5 L, svart | 1 179 kr | Köksmaskiner & Apparater |
| `3a305d61` | Hjullastare för barn med rörlig skopa, tramp-drift, gul | 1 179 kr | Utelek & Spel |
| `3e8edc1c` | Fåtölj i konstläder, extra bred och djup sits, grå | 1 179 kr | Hem & Inredning |
| `4164ae56` | Skrivbord 120×60 cm med Z-format metallstativ, industristil | 1 179 kr | Hem & Inredning |
| `58ccd9bc` | Kupoltält för 2 personer med tambur och sovdel, ljusblått | 1 179 kr | Friluftsliv & Resa |

Fåtöljen och skrivbordet kopplades till toppkategorin `Hem & Inredning` utan
löv — trädet har inget sittmöbel- eller kontorslöv, och runbooken säger att
toppkategorin räcker då (samma regel som klösträden i `Husdjur`).

## Två kandidater uteslöts före polering

- **`3945b0bc`** pensionerad som intern Aosom/Aosom-dubblett av redan
  publicerade `90214a8b` (task #301) — samma vara, båda raderna bar
  `supplier: "aosom"`, så ommappningen hade varit en no-op. `draftStatus:
  "rejected"`, `needsAiPolish: false`, ingen radering.
- **`363772f0`** (hundbuggy) uteslöts efter en PawHut-logga insydd på
  produkten, synlig i den interiöra bilden — samma klass som #287/#288/#296.
  Flaggad till Leonard som task #302, INTE publicerad.

Fullständig motivering för båda i `uteslutna.md`.

## Varumärkesscreening: alla bilder, inte bara hjältebilden

Alla överlevande bilder på alla sex produkter granskades individuellt (inte
bara position 1). Tre ytterligare exkluderingar utöver de två kandidaterna
ovan, samtliga i icke-hjälte-positioner:

- **`1327c4c6`** (köksmaskin) position 4 och 5 — tysk marknadsföringstext
  inbränd i pixlarna.
- **`3e8edc1c`** (fåtölj) position 4 — "HOMCOM by Aosom"-logga på en
  friskrivningsbild.
- **`58ccd9bc`** (tält) position 5 — Outsunny-logga tryckt på tyget i en
  livsstilsbild.

Ingen av de tre är hjälte- eller delningsbild, så uteslutningen kostar
ingenting i `bilder.tsv`: 0caa8b84, 3a305d61 och 4164ae56 behåller alla fem,
de tre andra behåller 3–4.

## Kvittokedjan

Varje led är MÄTT, inte antaget. Ett svar utan fel är inget kvitto.

| led | utfall |
| :-- | :-- |
| `gate.py` | 0 fynd i 6 filer (siffergrind mot `kallor.json`), 1 varning (se nedan) |
| `gate-seo.py` | 0 fynd i 6 rader |
| `gate-alt.py` | GRIND REN: 6 produkter, 26 alt-texter, 0 fynd |
| `gate-sku.py` | 0 fynd i 6 rader (längst 28 av 40 tecken) |
| `gate-lankar.py` | 0 fynd, 0 unika mål hämtade |
| `gate-superlativ.py` | GRIND REN: 6 filer, 0 kvitterade superlativ |
| `gate-kort.py` | 0 fynd i 6 kort (siffergrind mot `kallor.json`) |
| `gate-axel.py` (mot `axelfacit.json`, byggd server-side) | 0 axelfel — se fyndet nedan |
| `gate-lager.py` | 0 fynd i 6 produkter, lägsta saldo 3 (tältet, `tunt men köpbart`) |
| Kortens md5 i BÅDA ändarna | 6 av 6 byte-identiska (uppladdat → nedladdat → jämfört mot lokal fil) |
| Steg 1 — text/namn/slug/SEO/synlighet, in-call checksumkontroll | 6 av 6 skrivna, checksumman stämde för alla sex innan skrivningen kördes |
| Steg 2 — media ENSAMT, kortet sist | 6 av 6 skrivna, varje bevarad bild round-trippad oförändrad utom `altText` |
| Steg 3 — kategorier | 6 av 6 kopplingar (`BulkAddItemToCategories`, `totalFailures: 0` på alla sex) |
| Steg 4 — `variantsInfo` SIST och ENSAMT | 6 av 6, svensk SKU skriven, variantobjektet round-trippat oförändrat utom `sku` |
| Separat läsning en stund efter skrivningen | 6 av 6: namn/slug/synlighet/SEO(2 taggar)/bildantal/kort-sist/kategori/SKU alla korrekta; `plainDescription` byte-identisk mot källan efter normalisering av Wix egen mellanslags-strippning mellan taggar (samma kända beteende som `wixnorm.py` redan dokumenterar) |
| `hamta-live.sh` + `livegrind.py` mot de publicerade sidorna | **6 av 6 REN, 0 avvikelser** (ord=268–340 per sida, samtliga HTTP 200, 150–156 kB, age 67–245 s efter ISR-fönstret) |

## ☠️ Två produkter — en trampdriven hjullastare och ett tält — bryter bygg-axelfacit.py:s positionsregel (task #303)

`bygg-axelfacit.py`s positionella regel (första horisontella talet = bredd,
andra = djup) är validerad mot femton möbel-/stolsbilder i tidigare rundor
och höll där. Den generaliserar INTE till avlånga föremål som man "går in i"
eller kliver på:

- **`3a305d61`** (hjullastare för barn): facitets positionella läsning gav
  `{bredd: 114, djup: 41, hojd: 52}`. Direkt bildmätning på fordonets egen
  måttritning visar motsatsen — fordonet är LÅNGT (114 cm) i körriktningen
  och SMALT (41 cm) i sittbredd, alltså **bredd 41, djup 114**. Skrivet så i
  `3a305d61.html`.
- **`58ccd9bc`** (kupoltält): facitets positionella läsning gav
  `{bredd: 426, djup: 206, hojd: 154}`. Tältets egen måttritning visar att
  426 cm är LÄNGDEN man kryper in genom (djupet) och 206 cm är BREDDEN,
  alltså **bredd 206, djup 426**. Skrivet så i `58ccd9bc.html`.

Båda fallen är motsatt tilldelning mot vad positionsregeln räknade fram —
inte en gissning, utan mätt direkt mot varje produkts egen måttritning.

`axelfacit.json` är ORÖRD i båda fallen, per #225s regel att facit alltid
genereras mekaniskt och aldrig handredigeras för att "rätta" ett enskilt
fall. I stället skrevs de bildverifierade värdena rakt in i Mått-raden, och
`gate-axel.py` kan då inte bekräfta dem — den svarar korrekt "texten anger
aldrig produktens bredd/djup/höjd med ord" i stället för att antingen
felaktigt godkänna eller felaktigt fälla. Det är precis det säkra utfallet:
grinden vet att den inte vet, i stället för att låtsas veta fel.

**Regeln generaliseras alltså inte utan avstämning mot bilden:** kompakta
möbler (stolar, skåp, bord) följer fortfarande positionsregeln — validerat
igen den här rundan på badrumsskåpet, köksmaskinen och skrivbordet, alla tre
mekaniskt korrekta utan avvikelse. Avlånga/"man går in i"-former (fordon,
tält, och sannolikt liggmöbler och kanoter i framtida rundor) kräver ögon på
måttritningen varje gång.

## En mindre källinkonsekvens till: fåtöljens sits

`gate-axel.py` flaggade dessutom att `3e8edc1c`s källa (Aosoms egen tyska
text) anger 85 cm som "T" (Tiefe/djup) på en rad men läser som "L"
(Länge/längd) på specfliken — en inkonsekvens i KÄLLAN, inte i min skrivna
text. Löst genom att skriva sitsmåttet i FAQ-formen "74 cm bred och 62 cm
djup, enligt källans måttangivelse för själva sitsytan" i stället för att
gissa vilken bokstav som var rätt.

## En harmlös varning: "tre" utan sifferkälla

`gate.py` flaggade att ordet "tre" (i "tre redskap" för köksmaskinen) saknar
en siffra att matcha i källan. Det är korrekt läsning, inte ett fel: "tre"
räknar de tre uppräknade redskapen (visp, degkrok, ballongvisp) i samma
mening — en äkta räkning av uppräknade objekt, inte ett tal som borde stått
i källan. Kvitteras inte i `foto-tal.txt`, eftersom det inte är ett
fotoräknat tal.

## Vad som INTE hittades den här rundan

Inga trasiga länkar, inga SKU-kollisioner, inga tyska SEO-titlar, alla sex är
enkla produkter med en variant vardera (`variantsInfo.variants.length === 1`
bekräftat i Steg 4) — `options`-fältmask-fällan för flervariantsprodukter
gällde alltså inte den här rundan. Lagersaldot kollades den här gången FÖRE
Steg 1 (inte retroaktivt som i N16): lägsta saldo är tältets 3, som är under
`TUNT`-tröskeln (5) men fortfarande köpbart.
