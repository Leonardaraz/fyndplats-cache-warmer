# Runda N19 — sju produkter, 1 219 kr

Sju Aosom-utkast polerade och publicerade i "billigast uppåt"-ordningen.

| id | produkt | SKU | pris |
|---|---|---|---:|
| f0e40907 | Väggarderob i trädform med fåglar, åtta krokar | FP-vaggarderob-tradform | 1 219 kr |
| 5d79afbe | Smådjursstall i två plan, orange, 90 cm | FP-smadjursstall-90cm | 1 219 kr |
| 1f055143 | Skärmtak i polykarbonat, 295 cm, med väggfäste | FP-skarmtak-295cm | 1 219 kr |
| ecb304cd | Ölpongbord/campingbord, hopfällbart, tre höjder | FP-olpongbord-hopfallbart | 1 219 kr |
| ba3e6e04 | Ståbord på hjul, C-form, höjd 73–110 cm | FP-stabord-c-form | 1 219 kr |
| f6be9960 | Växttrappa i stål, fyra nivåer, 162 cm | FP-vaxttrappa-4nivaer | 1 219 kr |
| 92a468c7 | Trimbord för hund, hopfällbart, 91,5 cm | FP-trimbord-hund | 1 219 kr |

Alla sju: `needsAiPolish: false`, `draftStatus: "published"` — stämplat via
`/api/admin/mapping` (workflowen "Polering — läs och stämpla mappningsraden"),
och varje stämpling verifierad två gånger: en gång genom att läsa det
verkliga API-svarets `.ändrat`-fält (inte bara ett grönt jobb), och en gång
till genom en helt separat `las`-körning mot mappningsraden. Task #300
flaggade en misstanke om att den här mekanismen kunde vara trasig för hela
N-serien — den misstanken höll inte för N18, och håller inte för N19 heller:
alla sju stämplingar tog, bevisat på samma sätt en andra gång.

Prisgrinden: `1219` stämmer mot regeln (`1,20 × landedCostSek`, charm99) på
alla sju. Ingen är slutsåld, ingen är låst. `aosomFreightShare` ligger mellan
0,321 och 0,361 — ingen över 0,5-tröskeln som annars hade skjutit upp
poleringen.

## Trevägskedjan i `bygg-axelfacit.py` tystade en tredje siffra

Ölpongbordets källa ger tre höjder i en kedja: `54/62/70H`. Facit-generatorns
`TAL`-regex tillät bara EN valfri slash-förlängning
(`\d+(?:[/-]\d+)?`), så en trevägskedja tappade sin FÖRSTA siffra —
`ecb304cd` fick `hojd: [62, 70]` i stället för `[54, 62, 70]`.

Fixat genom att byta den avslutande `?` mot `*`
(`\d+(?:[/-]\d+)*`), vilket tillåter valfritt många förlängningar utan att
ändra det vanliga tvåvägsfallet. Verifierat på båda hållen: en ny
regressionstest (`axelfacit.test.ts`, "TREVÄGSKEDJA") fäller på den gamla
regexen och går grön på den nya; hela den befintliga svepet (17 tester)
förblev oförändrat grönt. `bygg-axelfacit.py` är en delad generator — fixen
gäller alla framtida rundor, inte bara den här.

## Två källpåståenden motsagda av bilderna

- **Smådjursstallet (5d79afbe):** källtexten nämner "Grün"/"Gelb" som
  färgalternativ, men samtliga produktbilder visar stallet i orange med
  obehandlade trähandtag. Texten beskriver konsekvent orange.
- **Skärmtaket (1f055143):** källan säger "Weiß" (vit), men bilderna visar
  en genomskinlig polykarbonatskiva med SVARTA konsoler — ingen vit del
  någonstans. Texten beskriver konsolerna som svarta och skivan som
  genomskinlig, aldrig vit.

Båda är exempel på husets regel "titta på bilderna före texten": källtexten
kan vara fel, och fotot är facit.

## Skärmtakets axelmärkning — en medveten avvikelse från positionsdefaulten

`bygg-axelfacit.py`:s positionsheuristik antar bredd–djup–höjd i den ordning
måtten står i källan. För skärmtaket ger källan
`295 × 90 × 23,5 cm` som bredd–djup–höjd, vilket är fysiskt rimligt (295 cm
längs väggen, 90 cm utstick, 23,5 cm skivtjocklek) — facit-generatorns
positionsordning höll här, till skillnad från N17:s långsmala format. Alla
sju produkters spec-rader skrevs ändå med det explicita
"(bredd × djup × höjd)"-tillägget, konsekvent med övriga rundor, och utan
någon "N cm bred/djup/hög"-adjektivfras som utlöser `gate-axel.py`:s
mönstervarning.

## Ölpongbordets siffergrind behövde två foto-kvitton

`gate.py` flaggade två utskrivna tal ("två", "fyra") utan exakt
källordsmatchning i Campingtisch-texten. Båda är bildhärledda fakta (två
symmetriska spelmarkeringshalvor på skivan, fyra ben synliga i
produktbilderna) och kvitteras i `foto-tal.txt` enligt den etablerade
mekanismen. Efter kvittona: 0 fynd, 0 varningar.

## ☠️ Jag höll på att klona en tvilling av `bygg-medieskrivning.py` — fångat i tid

`bygg-medieskrivning.py` fanns redan sedan runda N9 (task #284), med en
skyddad regressionstest (`mediaskrivning-grind.test.ts`, 8 fall). Den antog
dock att VARJE runda har ett kort: den kräver `kort-filer.tsv` och
`kortalt.tsv` för varenda produkt och avbryter annars med "saknar rad i
kort-filer.tsv". N19 skjuter upp korten (samma skäl som N15–N18), och jag
läste aldrig existerande verktyg innan jag skrev en egen variant med samma
filnamn — precis den `git status`-check jag borde ha gjort FÖRST.

`git diff --stat` avslöjade det innan något committades: filen visade sig
vara **ändrad**, inte ny. Ordagrant husets egen regel, en gång till: **en
tvilling glider isär, och den som glider tystast är den som ser ut att
fungera.** Min version hade tyst tappat kortstödet och bytt fältnamn
(`items` i stället för `poster`) utan att någon av de åtta befintliga
testerna kunde varna, eftersom de aldrig kördes innan skrivningen redan gått
till Wix.

Lagat genom att återställa originalet (`git checkout --`) och UTÖKA det med
en explicit gren: saknas `kort-filer.tsv` HELT (filen finns inte, till
skillnad från en tom fil) skrivs bildlistan exakt som `bygg-media.py`
lämnade den, utan tillägg — kort förblir valfritt på FILNIVÅ, inte per
produkt. Kortfilen-fallet är oförändrat, byte för byte. Verifierat åt båda
hållen:

- De ursprungliga åtta testerna mot N9:s (kort-innehållande) data: **8/8
  gröna, oförändrade**.
- Ett nytt niende test, med en syntetisk kortlös fixture: bekräftar att
  bygget lyckas utan kort-filer.tsv/kortalt.tsv och att bildlistan blir
  exakt `bygg-media.py`:s utdata, ingen tredje post tillagd.

N19:s egen `steg2.js` är regenererad med det lagade verktyget efteråt, så
den committade artefakten matchar det som faktiskt producerade skrivningen.
Själva Wix-skrivningen (gjord med min ursprungliga, nu bortkastade variant)
behövde INTE göras om — den var redan oberoende verifierad korrekt (7/7,
5 bilder, 0 tomma alt-texter). Felet satt i verktygsfilen i repot, inte i
det som nådde kunden.

## Kategorier

Alla sju kopplades till en toppkategori plus en lövkategori, utom
ståbordet (ba3e6e04), som bara fick toppkategorin `Hem & Inredning` — ingen
lövkategori i trädet passar ett litet sidobord, samma situation som husets
tidigare "sittmöbler utan löv"-precedent.

| id | toppkategori | lövkategori |
|---|---|---|
| f0e40907 | Hem & Inredning | Förvaring & Organisering |
| 5d79afbe | Husdjur | Burar, Kläder & Tillbehör |
| 1f055143 | Trädgård & Utemöbler | Solskydd & Paviljonger |
| ecb304cd | Sport & Fritid | Friluftsliv & Resa |
| ba3e6e04 | Hem & Inredning | *(ingen)* |
| f6be9960 | Trädgård & Utemöbler | Växthus & Odling |
| 92a468c7 | Husdjur | Pälsvård & Skötsel |

Kopplat via `BulkAddItemToCategories` (en produkt, flera kategorier per
anrop), verifierat per rad i bulk-svarets `itemMetadata` — alla 13
kopplingar (2 kategorier × 6 produkter + 1 × ba3e6e04) rapporterade
`success: true` individuellt, inte bara ett aggregerat antal.

## Kort: medvetet uppskjutet, inte glömt

Faktakort är inte byggda för den här rundan. Samma kostnadsavvägning som
N18: att relä:a sju bilder som base64 genom modellens kontext kostar
uppskattningsvis 1,4–1,6 miljoner token, vilket inte står i proportion till
en enda rundas kort. Produkterna säljer och renderar korrekt utan dem.

## Gate-genomgång

| Gate | Resultat |
|---|---|
| `gate.py` (siffergrind mot `kallor.json`, med `foto-tal.txt`-kvitton) | 0 fynd, 0 varningar |
| `gate-axel.py` | 0 hårda fynd |
| `gate-alt.py` | 0 fynd, 35 alt-texter |
| `gate-seo.py` | 0 fynd i 7 rader |
| `gate-lager.py` | 0 fynd, 7 saldon |
| `gate-sku.py` | 0 fynd i 7 rader (längsta 25 av 40 tecken) |
| `gate-superlativ.py` | 0 fynd |
| Steg 1 (text/SEO/slug/visible) transkriberingsspärr | 0 avvikelser, 7 av 7 skrivna |
| Steg 1 separat återläsning (`hasha.py`/`aterlas.py`) | 7 av 7 LIKA |
| Steg 2 (media) transkriberingsspärr | 0 avvikelser, 7 av 7 skrivna |
| Steg 2 separat läsning (alt-text, antal bilder) | 7/7, 0 tomma alt-texter |
| Steg 3 (kategori) | 13/13 kopplingar bekräftade individuellt |
| Steg 4 (variant-SKU, round-trip, sist och ensam) | 7 av 7, `visible` oförändrat på alla |
| Mappningsstämpling + oberoende `las`-verifiering | 7 av 7, båda leden bevisade |
| `hamta-live.sh` (ISR-medveten, varm träff → 164 s ålder vid skarp hämtning) | 7/7 HTTP 200, en transient miss läkt av omförsöket |
| `livegrind.py` | **0 avvikelser på alla sju — 7/7 REN** |

Alla sju produkter är publicerade, stämplade och live-verifierade. Rundan
räknas som klar utom faktakorten, som är en medveten uppskjutning.
