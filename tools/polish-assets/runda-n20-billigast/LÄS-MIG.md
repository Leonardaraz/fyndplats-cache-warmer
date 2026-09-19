# Runda N20 — sex produkter, 1 229–1 339 kr

Sex Aosom-utkast polerade och publicerade. Till skillnad från N15–N19 delar de
INTE samma pris — "billigast uppåt" gav den här gången en spridning, inte en platå.

| id | produkt | SKU | pris |
|---|---|---|---:|
| 00a83f2f | Skobänk i bambu med förvaring, 100 cm | FP-skobank-bambu-forvaring | 1 229 kr |
| 48e85aee | Högt badrumsskåp, tvåtonat grått, 183 cm | FP-badrumsskap-hogt-183cm | 1 249 kr |
| 5a004e82 | Stapelbara Halloween-clowner med rörelse | FP-halloween-clowner-stapelbara | 1 259 kr |
| 4239a0a5 | Vit badrumskommod med tre lådor och skåp | FP-badrumskommod-3-lador-vit | 1 269 kr |
| 4c6ffd03 | Konstgjord julgran 180 cm, 1696 grenspetsar | FP-julgran-180cm-1696-toppar | 1 299 kr |
| e78ebbb6 | LED-helkroppsspegel 40x150 cm | FP-led-helkroppsspegel-40x150 | 1 339 kr |

Alla sex: `needsAiPolish: false`, `draftStatus: "published"` — stämplat via
`/api/admin/mapping`, och varje stämpling verifierad två gånger: en gång genom
API-svarets `.ändrat`-fält, en gång till genom en helt separat `las`-körning
mot mappningsraden. Prisgrinden (`1,20 × landedCostSek`, charm99) `stämmer:
true` på alla sex, ingen slutsåld, ingen låst. `aosomFreightShare` 0,282–0,422
— ingen över 0,5-tröskeln.

## Screeningen fångade en sjunde kandidat som en äkta dubblett

Ett sjunde kandidat, `ef78ea0e` (Badezimmerspiegel LED, oregelbunden
80 × 60 cm), screenades av en fristående agent innan något skrevs och visade
sig vara en **exakt dubblett** av redan publicerade `b4881a7a` — samma
oregelbundna badrumsspegel, samma 80×60-variant, nio oberoende specar
identiska (1250 lumen, 27 W, 30×20 cm imfri zon, 4 mm härdat glas, samma
monteringssätt, samma färgtemperaturer). Måtttrippel-metoden hade INTE fångat
den (källan skriver dimensioner som par, inte trippel, för en spegel) — bara
det andra nätet (lumen + "oregelbunden/asymmetrisk") gjorde det.

`ef78ea0e` är **pensionerad**: `draftStatus: "rejected"`, `needsAiPolish:
false`, samma åtgärd som `34341c4f` och N2:s kattlådor. Ingen ommappning
(`aosom-remap` hade fällts på `redan_aosom` — den kvarhållna sidan är redan
Aosom). Ingen radering — ett osynligt utkast kostar ingenting.

## Två bilder strukna för besläktade men olika skäl

- **`48e85aee` (badskap), position 5**: ett tydligt läsbart **ESTEE LAUDER
  Swiss Performing Extract**-flaskprop i skåpet. Inget leverantörs- eller
  husmärke (så det utlöser inte husets märkesregel), men ett tredjeparts
  varumärke vi inte har rätt att visa på en produktsida vi säljer. Bilden är
  struken — produkten går live med 4 bilder i stället för 5, mätta-skissen
  fortfarande sist.
- **`e78ebbb6` (spegel), positionerna 4 och 5**: tysk marknadsföringsgrafik
  inbränd i pixlarna ("3 VERWENDUNGSMÖGLICHKEITEN" / "SICHER UND KLAR"),
  samma klass grafik CLAUDE.md redan dokumenterar för 46 % av feedens bilder.
  Båda strukna — produkten går live med 3 bilder (hero, livsstil,
  måttritning), inte 5.

Ingen `bilder-bort.tsv` skrevs: rundans `bilder.tsv` listar bara de bilder som
faktiskt behålls, så `bygg-media.py`:s egen radräkning (`har[kort]`) blir
redan rätt utan att dra ifrån något.

## Källpåståenden rättade eller förtydligade mot fotot

- **`48e85aee` (badskap)**: den AUTOGENERERADE svenska specraden (från
  importen) sa bara "Färg: Dunkelgrau" och alt-texterna bara "Hellgrau" — men
  både den tyska introt och Technische Daten är eniga: skåpet är TVÅTONAT,
  mörkgrå stomme med ljusgrå luckor. Fixat i både brödtext och den
  omskrivna spec-raden ("Mörkgrå med ljusgrå luckor").
- **`5a004e82` (clowner)**: källan ger tre clowners individuella höjder
  (100/85/95 cm) OCH en total på 180 cm — en naiv summa (280 cm) hade varit
  fel. Skrivet som tre FRISTÅENDE figurer som kan staplas till en samlad höjd
  på 180 cm, inte som tre delar av samma objekt. Bara den mittersta
  (grönhåriga) clownen är animerad.
- **`4239a0a5` (kommod)**: källan säger "zweistufiger Schrank" (två-plans
  skåp) för samma sak som separat beskrivs som "dreistufig verstellbares
  Regal" (hyllan har tre höjdlägen) — två olika påståenden om samma
  utrymme. Skrivet konservativt: skåpet har en hylla som ställs i tre
  höjdlägen, ingen fast "två-plans"-struktur påstås.
- **`4c6ffd03` (julgran)**: `[BRAND NAME]`-borttagningen lämnat en trasig
  mening, "dieser künstliche Weihnachtsbaum **von** wird ...". Skrivet om
  till en hel, korrekt mening utan någon "från"-referens.
- **`e78ebbb6` (spegel)**: samma artefakt, "Ganzkörperspiegel **von** ." —
  samma lagning.
- **Artikelnummer strukna, aldrig transkriberade**: källan för `5a004e82`
  bär `84J-092V00MX` och för `4c6ffd03` `830-877V01GN`. Ingetdera förekommer
  någonstans i den skrivna texten, SEO-fälten eller alt-texterna.

## Gate-genomgång

| Gate | Resultat |
|---|---|
| `gate.py` (siffergrind mot `kallor.json`) | 0 fynd, 0 varningar |
| `gate-axel.py` | 0 axelfel (8 källkonflikter tyska/svenska spec-flikens bokstäver — TYSKAN GÄLLER, ärvt från importen, rör aldrig min egen text) |
| `gate-alt.py` | 0 fynd, 27 alt-texter (5+4+5+5+5+3) |
| `gate-seo.py` | 0 fynd i 6 rader (efter att ett sourcelöst "3" i `4239a0a5`:s SEO-titel byttes mot "tre") |
| `gate-lager.py` | 0 fynd, 7 saldon, lägsta 36 |
| `gate-sku.py` | 0 fynd i 6 rader (längsta 31 av 40 tecken) |
| `gate-superlativ.py` | 0 fynd, 0 kvitterade |
| Steg 1 (text/namn/slug/visible/SEO) transkriberingsspärr | 0 avvikelser, 6 av 6 skrivna |
| Steg 1 separat återläsning (`hasha.py`/`aterlas.js`) | 6 av 6 LIKA |
| Steg 2 (media) transkriberingsspärr | 0 avvikelser, 6 av 6 skrivna |
| Steg 2 separat läsning (bildantal, alt-text) | 6/6, 0 tomma alt-texter, bildantal exakt (5/4/5/5/5/3) |
| Steg 3 (kategori) | 12/12 kopplingar bekräftade individuellt i bulk-svaret |
| Steg 4 (variant-SKU, round-trip, sist och ensam) | 6 av 6, `visible` oförändrat på produkt OCH variant |
| Mappningsstämpling + oberoende `las`-verifiering | 6 av 6, båda leden bevisade, prisgrind `stämmer: true` på alla |
| `hamta-live.sh` (ISR-medveten, varm träff + skarpt svep) | 6/6 HTTP 200, age 97–98 s vid det skarpa svepet |
| `livegrind.py` (orddiff, homoglyf, sid/alt/SEO-svep, flikar+kategori+köpbarhet+korslänk) | **0 avvikelser i den PUBLICERADE texten — 6/6 REN** |

## Kategorier

Alla sex fick toppkategorin `Hem & Inredning`, plus en lövkategori:

| id | lövkategori |
|---|---|
| 00a83f2f | Förvaring & Organisering |
| 48e85aee | Badrum & Hemtextil |
| 5a004e82 | Kalas & Fest |
| 4239a0a5 | Badrum & Hemtextil |
| 4c6ffd03 | Dekoration & Prydnad |
| e78ebbb6 | Badrum & Hemtextil |

## Kort: medvetet uppskjutet, inte glömt

Samma kostnadsavvägning som N15–N19: ett kort kräver att bilder relä:as som
base64 genom modellens kontext, uppskattningsvis 1,4–1,6 miljoner token för en
runda. `bygg-medieskrivning.py` skrev därför bildlistan exakt som
`bygg-media.py` lämnade den, utan tredje post.

## Sammanfattning

Alla sex produkter är publicerade, stämplade och live-verifierade — noll
avvikelser i den skarpt hämtade, ISR-färska sidan för var och en. Rundan
räknas som klar utom faktakorten, som är en medveten uppskjutning av samma
skäl som N15–N19.
