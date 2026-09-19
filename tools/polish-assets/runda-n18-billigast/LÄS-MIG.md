# Runda N18 — sju produkter, 1 199 kr

Sju Aosom-utkast polerade och publicerade i "billigast uppåt"-ordningen.

| id | produkt | SKU | pris |
|---|---|---|---:|
| 08e388b6 | Metalldetektor med 4 söklägen, vattentät IP68, hopfällbar | FP-metalldetektor-ip68 | 1 199 kr |
| 0e2b93bb | Rutschbana 5-i-1 för barn med kikare och basketkorg | FP-rutschbana-5-i-1-barn | 1 199 kr |
| 1518c06f | Hopfällbar träningsbänk med rygglyft | FP-traningsbank-rygglyft | 1 199 kr |
| 2318c310 | Sängbänk med förvaring, guldben | FP-sangbank-forvaring-guld | 1 199 kr |
| 24cf38d1 | Badrumsskåp i bambu, smalt och 163 cm högt | FP-badrumsskap-bambu-32 | 1 199 kr |
| 2f8d1c8f | Hopfällbar golvfåtölj, bäddbar till madrass | FP-golvfatolj-baddbar | 1 199 kr |
| 2fdbc619 | Klöstunna i vattenhyacint, tre nivåer | FP-klostunna-vattenhyacint | 1 199 kr |

Alla sju: `needsAiPolish: false`, `draftStatus: "published"` — stämplat via
`/api/admin/mapping` (workflowen "Polering — läs och stämpla mappningsraden"),
och varje stämpling verifierad två gånger: en gång genom att läsa det verkliga
API-svarets `.ändrat`-fält (inte bara ett grönt jobb), och en gång till genom
en helt separat `las`-körning mot mappningsraden. Task #300 flaggade en
misstanke om att den här mekanismen kunde vara trasig för hela N-serien —
den misstanken höll inte för N18: alla sju stämplingar tog, bevisat.

Prisgrinden: `1199` stämmer mot regeln (`1,20 × landedCostSek`, charm99) på
alla sju. Ingen är slutsåld, ingen är låst, ingen ligger utanför
`aosomFreightShare > 0,5` (spannet är 0,297–0,378).

## ☠️ Alt-texterna var trasiga på ALLA SJU — grinden såg det bara på tre

Den publicerade texten (brödtext, SEO, flikar, kategori) var korrekt från
start — noll orddiff på alla sju vid första livegrind-körningen. Men
alt-svepet fällde tre produkter (2318c310, 2fdbc619 med tydlig tysk text,
och en tredje som visade sig vara samma fel efter manuell kontroll).

Vid närmare granskning var alt-texten fel på **alla sju**, inte bara de tre
grinden hittade:

- **Tre produkter** (1518c06f, 2318c310, 2fdbc619): varenda bild i galleriet
  bar exakt SAMMA sträng — leverantörens råa tyska/engelska importtitel
  (t.ex. `"Bettbank mit Stauraum, dicke Polsterung, atmungsaktiver Stoff,
  Stahlfüße, 100x40x49 cm, Creme"`), ordagrant satt som `altText` på varje
  medieobjekt vid import.
- **Fyra produkter** (08e388b6, 0e2b93bb, 24cf38d1, 2f8d1c8f): `altText`
  saknades helt i Wix. Butikens frontend fyller då i en generisk
  `"{produktnamn} – bild N"`, som är korrekt svenska men inte den
  bildspecifika texten `alt.tsv` faktiskt innehöll.

**Ingen av de sju hade min avsedda `alt.tsv`-text.** Poleringens alt-textsteg
hade alltså aldrig nått Wix för den här rundan — mekaniskt samma klass av fel
som husets "ett svar utan fel är inget kvitto", fast ett steg tidigare: här
kördes steget aldrig, snarare än att det kördes och tystnade.

**Och grinden missade fyra av de sju tysta felen helt.** `gatelib.TYSKA`
matchar kända tyska funktionsord (`mit`, `und`, `für`, `der`, `die`, `das`).
1518c06f:s kvarvarande text — `"Roman Chair Hyperextension Bank & Hantelbank
Klappbar Trainingsbank, Multifunktion..."` — innehåller inget av dem och
klarade alt-svepet rent, trots att den är lika otillåten som de två grinden
fällde. De fyra "REN"-produkterna med den generiska fallbacken hade
förstås inget att fälla på, eftersom fallbacken är äkta (om generisk) svenska.

Lagat genom att läsa varje produkts `media.itemsInfo.items` (fem bilder per
produkt, id + befintlig ordning) och skriva tillbaka EXAKT samma array med
bara `altText` bytt — round-trip-principen, aldrig ett handbyggt
medieobjekt. Skrivningen gjordes med `id` (Wix Media Manager-filens id),
aldrig `url` (som hade importerat om bilderna som externa, se husets regel
om wixstatic-adresser).

Verifierat i tre steg, inget av dem hoppat över:

1. En separat läsning av `media.itemsInfo.items[].altText` mot alla sju
   produkter direkt efter skrivningen — alla 35 alt-texter stämde ordagrant
   mot `alt.tsv`.
2. Ett nytt `hamta-live.sh`-svep (ISR-medvetet, varm träff → 296 s väntan →
   skarp hämtning) och en ny `livegrind.py`-körning: **0 avvikelser på alla
   sju**, mot 4 fel på tre produkter innan fixen.
3. **Manuell genomläsning av alla 35 levande alt-texter**, ord för ord mot
   `alt.tsv` — inte bara ett grönt grindsvar. Det är precis det steg som
   hade avslöjat 1518c06f:s fel om det inte redan var lagat, och det är
   skälet till att det görs som en fast rutin, inte bara vid en misstanke.

⚠️ **Detta är sannolikt inte unikt för N18.** `alt.tsv` har byggts för
varenda tidigare runda (N1–N17 och bakåt), och om samma skrivsteg fallerat
där syns det inte i den befintliga live-grinden — precis av samma skäl som
här: fyra av sju fall ger en ofarlig generisk svensk fallback som aldrig
fäller något mönstersvep, och den tyska varianten fälls bara när texten
råkar innehålla ett av grindens kända ord. Task #245 ("Mät tyska ALT-texter
över hela den publicerade katalogen") är rätt plats att utreda omfattningen
— men mätningen måste jämföra mot varje rundas egen `alt.tsv`, inte bara
söka efter tyska ord, annars missar den exakt det som hände här.

## Kort: medvetet uppskjutet, inte glömt

Faktakorten (`kort.tsv`, `kortalt.tsv`) är byggda och grindade
(`gate-kort.py`: 0 fynd i 7 kort) och renderade till 3200×3200 PNG i
`cards/`. De är **inte uppladdade till Wix** i den här rundan — att relä:a
sju bilder som base64 genom modellens kontext kostar uppskattningsvis
1,4–1,6 miljoner token (base64 tokeniserar ~1 token/tecken, och
`UploadImageToWixSite` tar bara `imageUrls` eller en bild i taget som
`imageBase64`), vilket inte stod i proportion till en enda rundas kort givet
den stående instruktionen att fortsätta polera obegränsat. Samma mönster som
N15/N16/N17:s `kort-tmp`-loggning, men av ett annat skäl (där var det en
sessionsspärr mot radering, här är det en kostnadsavvägning mot uppladdning).

Produkterna säljer och renderar korrekt utan korten; de kan läggas till i en
framtida runda med en billigare uppladdningsväg.

## Utelämnad kandidat

Campingtältet `1674a1a9` ingick i det ursprungliga urvalet men uteslöts
(task #305): Outsunny-loggan syns tryckt på själva produkten i källbilderna,
vilket kräver Leonards beslut på samma sätt som de tidigare VINSETTO- och
PawHut-fallen. Ingen åtgärd tagen på den kandidaten i den här rundan.

## Gate-genomgång

| Gate | Resultat |
|---|---|
| `gate.py` (siffergrind mot `kallor.json`) | 0 fynd |
| `gate-alt.py` (alt.tsv mot kallor.json/bilder.tsv) | 0 fynd, 35 alt-texter |
| `gate-seo.py` (seo.tsv mot varje produkts egen `<kort>.html`) | 0 fynd i 7 rader |
| `gate-kort.py` | 0 fynd i 7 kort |
| `livegrind.py`, FÖRE alt-textfixen | 4 fel (alt-text, 3 produkter) |
| `livegrind.py`, EFTER alt-textfixen | **0 avvikelser, 7/7 REN** |
| Manuell läsning av alla 35 levande alt-texter | matchar `alt.tsv` ordagrant |
| Flikar (`Tekniska specifikationer`, `Användning och skötsel`, `Vanliga frågor`) | närvarande på alla sju (del av livegrind) |
| Kategori (brödsmula ≠ Hem / Butik / produkt) | kopplad på alla sju (del av livegrind) |
| Wix-newline-normalisering | `plainDescription` byte-perfekt på alla sju efter att käll-HTML:ens radbrytningar strippats i facit — Wix tar bort radbrytningar mellan blocktaggar vid lagring, ren formatering, ingen innehållsskillnad |

Alla sju produkter är publicerade, live-verifierade och stämplade. Rundan
räknas som klar utom faktakorten, som är en medveten uppskjutning.
