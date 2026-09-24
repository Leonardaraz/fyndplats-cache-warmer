# Runda N22 — nio produkter, 1 349 kr

Nio Aosom-utkast polerade och publicerade. Alla nio ligger på EXAKT samma pris
som Runda N21: 1 349 kr — screeningen fortsatte alltså samma prisplatå i
stället för att gå vidare till en ny, högre nivå. Platå-mönstret som redan
sågs i N15–N19 och N21 håller alltså längre än sex produkter åt gången.

| id | produkt | SKU | pris |
|---|---|---|---:|
| fffbe044 | Odlingslåda i metall, 2-pack, 120 x 60 x 60 cm | FP-odlingslada-2pack-120cm | 1 349 kr |
| d9238d45 | Smalt badrumsskåp med 5 lådor, vit | FP-badrumsskap-smalt-vit | 1 349 kr |
| d48f0b07 | Klätterställning 7-i-1 för inomhusbruk, rosa | FP-klatterstallning-7i1-rosa | 1 349 kr |
| d1132894 | Sittbänk i sammet med guldfärgade ben, blå | FP-sittbank-sammet-bla | 1 349 kr |
| cbba79ae | Aktivitetstavla för barn i lastbilsform, väggmonterad | FP-aktivitetstavla-lastbil | 1 349 kr |
| a57587a8 | Barnkök med telefon, kritavla och mikrovågsugn, vitt | FP-barnkok-telefon-kritavla | 1 349 kr |
| a00b6e08 | Tvättställsskåp fristående med två lådor, vitt | FP-tvattstallsskap-fristaende | 1 349 kr |
| 973e6901 | Skrivbord i högglans vitt med två lådor, 100 x 50 cm | FP-skrivbord-hogglans-100cm | 1 349 kr |
| 7838bc0e | Barnkök med ugn, diskho och ljudeffekter, vitt | FP-barnkok-ugn-diskho | 1 349 kr |

Alla nio: `needsAiPolish: false`, `draftStatus: "published"` — stämplat via
`/api/admin/mapping` (workflowen "Polering — läs och stämpla mappningsraden",
läge `stampla`), och varje stämpling verifierad genom en helt SEPARAT
`las`-körning mot mappningsraden (inte samma anrop som skrev). Prisgrinden
(`1,20 × landedCostSek`, charm99) `stämmer: true` på alla nio, ingen slutsåld,
ingen låst. `aosomFreightShare` 0,326–0,389 — ingen över 0,5-tröskeln.

## ☠️ Ny defektklass: hela marknadsföringsgrafiker i "rena" bildpositioner

Husets etablerade regel (`RENA_BILDPOSITIONER = [1,2,3,8,9]`) bygger på en
mätning från 2026-08-27: positionerna räddar 93 % rena bilder mot resten av
feeden. Den mätningen gällde BAKGRUNDSTYSK TEXT på i övrigt vanliga produkt-
och miljöfoton — inte hela infografik-bilder.

Vid den manuella bildgranskningen inför den här rundan (ursprungligen gjord
för att leta efter tredjepartsvarumärken) visade sig 4 av 9 produkter (44 %)
ändå bära en FULLSTÄNDIG tysk marknadsföringsgrafik — en fet rubrik plus
3–4 ikon-bildtexter — i en position som `RENA_BILDPOSITIONER` klassar som
säker:

| produkt | position (lokal, av 5) | grafikens tyska text |
|---|---|---|
| d48f0b07 (klätterställning) | 4 | "EIN TOLLES GESCHENK FÜR KINDER" |
| cbba79ae (aktivitetstavla) | 4 | "GEEIGNET FÜR VERSCHIEDENE RÄUME" |
| a00b6e08 (tvättställsskåp) | 4 OCH 5 | "FSC-Zertifiziert – Eine verantwortungsvolle Wahl" + ett 4-rutors funktionsschema |
| 7838bc0e (barnkök) | 4 | "AUFWACHSEN IN DER KÜCHE – ROLLENSPIELE" |

Det här är en TREDJE defektklass, skild från de två huset redan känner till:

1. Bakgrundstysk text på ett i övrigt normalt foto (mätt, motiverar
   `RENA_BILDPOSITIONER`).
2. Tredjeparts varumärkesläckage (Louis Vuitton, se nedan).
3. **En hel infografik-bild** — ingen produktfoto alls, bara rubrik och
   ikontext. Ingen befintlig textgrind (`gate.py`, `gate-alt.py`,
   `gate-seo.py`, `livegrind.py`) kan se den här klassen, eftersom ingen av
   dem läser bildpixlar. Den enda spärren är ett öga som faktiskt tittar på
   varje bild.

Alla fyra upptäcktes bara för att bildgranskningen (som formellt gjordes för
att kolla efter tredjepartsvarumärken) råkade se på VARJE position 4 och 5,
inte bara de som setts flaggas historiskt. Utan den granskningen hade fyra av
nio publicerade sidor visat en tysk reklamgrafik som fjärde eller femte bild.

**Åtgärd denna runda:** de fyra bilderna uteslöts ur `bilder.tsv` innan någon
Wix-skrivning gjordes; de tre (d48f0b07, cbba79ae, 7838bc0e) resp. tre
(a00b6e08) övriga rena bilderna användes i stället, omordnade så att
måttritningen fortfarande visas sist. Ingen av de fyra produkterna tappade
sin måttritning.

⚠️ **Detta är mätt på ETT stickprov (denna runda, 9 produkter), inte på hela
katalogen.** Om mönstret håller i samma härledda andel som denna runda (44 %)
kan ett tvåsiffrigt antal redan publicerade sidor bära samma sorts grafik i
position 4 eller 5 — ingen av de tidigare rundornas bildgranskningar var
inriktade på att hitta just HELA infografiker, bara bakgrundstext och
varumärken. En katalogbred mätning av just den här defektklassen är ogjord
och borde göras (se öppen punkt nedan).

## Ett tredjepartsvarumärke: `d48f0b07`

Källbild i position 2 (av `d48f0b07`s ursprungliga fem) visade en hylla med
böcker vars ryggar bar Louis Vuittons mönster och namn, synligt i bakgrunden
av en livsstilsbild för klätterställningen. Bekräftat genom att ladda ner
Wix-filens URL på nytt och md5-jämföra mot den lokalt granskade bilden — så
att uteslutningen bygger på en bevisad matchning, inte en gissning om vilket
Wix-fil-id som hörde till vilken feed-position.

Bilden uteslöts ur `bilder.tsv`; produkten publicerades med tre bilder
(positionerna 1, 3, 5 i den ursprungliga femman) i stället för fem.

## En redan existerande SKU-kollision löst i förbigående

`a57587a8` och `7838bc0e` — båda barnkök — bar innan den här rundans Steg 4
samma kvarlämnade tyska variant-SKU (`FP-kinderkuche-spielkuche`), exakt det
mönster huset redan dokumenterat ("Flera produkter kan dela EN SKU" —
importen härleder SKU:n ur den tyska titelns första ord). Löst som en
bieffekt av att ge varje produkt sin egen svenska SKU denna runda
(`FP-barnkok-telefon-kritavla` respektive `FP-barnkok-ugn-diskho`).

## Gate-genomgång

| Gate | Resultat |
|---|---|
| `gate.py` (siffergrind mot `kallor.json`) | 0 fynd i 9 filer, 0 varningar |
| `gate-axel.py` | 0 axelfel (7 tysk/svensk axelbokstavskonflikter i KÄLLAN — tyskan gäller, ärvt; 26 informativa "mått aldrig med ord"-varningar, båda klasserna icke-fällande) |
| `gate-alt.py` | 0 fynd, 39 alt-texter |
| `gate-seo.py` | 0 fynd i 9 rader |
| `gate-lager.py` | 0 fynd, 9 saldon, lägsta 21 |
| `gate-sku.py` | 0 fynd i 9 rader (längsta 29 av 40 tecken) |
| `gate-superlativ.py` | 0 fynd, 0 kvitterade |
| `gate-lankar.py` | 0 fynd, 0 korslänkar i texterna |
| Steg 1 (text/namn/slug/visible/SEO) transkriberingsspärr | 0 avvikelser, 9 av 9 skrivna |
| Steg 1 separat återläsning (`hasha.py`/`aterlas.js`, `PLAIN_DESCRIPTION`+`MEDIA_ITEMS_INFO`+`DIRECT_CATEGORIES_INFO`) | 9 av 9 LIKA |
| Steg 2 (media) transkriberingsspärr | 0 avvikelser, 9 av 9 skrivna |
| Steg 2 oberoende läsning | bildantal matchar `bilder.tsv` exakt på alla nio (5/5/3/5/4/5/3/5/4) |
| Steg 3 (kategori) | 9/9 produkter bär rätt kategori(er), verifierat mot namngiven kategoriträd |
| Steg 4 (variant-SKU, round-trip från FULL GET, sist och ensam) | 9 av 9, `visible` oförändrat på produkt OCH variant |
| Mappningsstämpling + oberoende `las`-verifiering | 9 av 9, båda leden bevisade, prisgrind `stämmer: true` på alla |
| `hamta-live.sh` (ISR-medveten, varm träff + skarpt svep) | 9/9 HTTP 200, age 71–72 s vid det skarpa svepet (bekräftar den egna omrenderingen, inte en gammal cache) |
| `livegrind.py` (orddiff, homoglyf, sid/alt/SEO-svep, flikar+kategori+köpbarhet+korslänk) | **0 avvikelser i den PUBLICERADE texten — 9/9 REN** |

## Kategorier

Två produkter fick bara toppkategorin, samma husregel som tidigare rundor
("trädet har ingen möbel-löv-kategori, och toppkategorin räcker då") —
sittbänken och skrivbordet, som inte har någon matchande löv i det här
kategoriträdet:

| id | kategori(er) |
|---|---|
| fffbe044 (odlingslåda) | Trädgård & Utemöbler → Växthus & Odling |
| d9238d45 (badrumsskåp) | Hem & Inredning → Badrum & Hemtextil |
| d48f0b07 (klätterställning) | Barn & Familj → Leksaker & Spel |
| d1132894 (sittbänk) | Hem & Inredning (ingen löv — sittmöbel) |
| cbba79ae (aktivitetstavla) | Barn & Familj → Leksaker & Spel |
| a57587a8 (barnkök) | Barn & Familj → Leksaker & Spel |
| a00b6e08 (tvättställsskåp) | Hem & Inredning → Badrum & Hemtextil |
| 973e6901 (skrivbord) | Hem & Inredning (ingen löv — kontorsmöbel) |
| 7838bc0e (barnkök) | Barn & Familj → Leksaker & Spel |

## Två textfel rättade före skrivning

- **`d9238d45`, `a00b6e08`, `973e6901`**: "Kippskydd"/"kippskydd" — ett
  tyskt-klingande falsk vän, inte äkta svenska (`gatelib.py`:s `STAV_ORD`
  mönster `[Kk]ippskydd`). Rättat till korrekt svenska "Tippskydd"/
  "tippskydd", i linje med tidigare publicerade rundors terminologi.
- **`d48f0b07`**: "robust plywood" — "robust" står i `gatelib.py`:s
  `TYSKA_ORD`-lista (ett känt, medvetet inte borttaget ord eftersom det
  ibland är äkta tyska och ibland äkta svenska). Undvikt genom att skriva
  "stabil plywood" i stället.

## Kort: medvetet uppskjutet, inte glömt

Samma kostnadsavvägning som tidigare N-rundor: inget `kort-filer.tsv` fanns
i rundans katalog, så `bygg-medieskrivning.py` skrev bildlistan exakt som
`bygg-media.py` lämnade den, utan tredje post.

## Öppen punkt för framtida arbete

Den nya defektklassen (hela tyska marknadsföringsgrafiker i position 4/5)
är mätt på nio produkter, inte på katalogen. En katalogbred granskning —
sannolikt ett bildinnehålls-svep snarare än ett textsvep, eftersom
ingen befintlig gate läser pixlar — skulle svara på hur många redan
publicerade sidor som bär samma defekt. Ingen sådan mätning är gjord än.

## Sammanfattning

Alla nio produkter är publicerade, stämplade och verifierade i tre separata
led: textinnehåll (återläsning mot fil-hash), mappningsstämpel (oberoende
`las`-körning) och den PUBLICERADE, ISR-färska sidan (`livegrind.py`,
9/9 REN, 0 avvikelser). Rundan räknas som klar utom faktakorten, som är en
medveten uppskjutning av samma skäl som N15–N21.
