# Kategoriernas sökord: baslinjen före S6–S13 (2026-09-24)

Rundorna S4–S13 har byggt kategorisidor kring sökord med volym och låg
svårighet. S4/S5 gick live med #646 samma morgon som mätningen gjordes
(2026-09-24). S6–S13, 63 sidor, går live med butiks-PR #647. Den här katalogen
är alltså mätpunkten **före** för alla rundorna, så att strategin kan mätas mot
verkliga placeringar i stället för mot förhoppningar.

## Filerna

| fil | vad | källa |
|---|---|---|
| `baslinje-2026-09-24.tsv` | 102 huvudsökord på 74 sidor, med volym, svårighet och dagens placering | se nedan |
| `kategori-rankning-2026-09-24.tsv` | alla 77 sökord där en `/kategori/`-sida rankar topp 100 | Semrush `resource_organic`, mål `www.fyndplats.se/kategori/` |
| `doman-over-200-2026-09-24.tsv` | alla 204 sökord över 200 sökningar/mån där domänen rankar topp 100, vilken sida som helst | Semrush `resource_organic`, mål `fyndplats.se`, volym > 200 |

**Huvudsökorden** är butikens egna: testet *ett huvudsökord finns i exakt en
kategorititel* i `lib/category-seo.test.ts` (grenen
`claude/sasongskategorier-s6-bz3j9l`) har 102 ordstammar. Varje stam är
utskriven som det sökord titeln bygger på (`hantl` → *hantlar*, `soptunn` →
*soptunna*). Volym och svårighet kommer från Semrush `phrase_these`
(databas `se`), hämtade samma dag i två anrop.

**Placeringen** är domänens bästa placering för exakt det sökordet, ur
domänfilen. `ej topp 100` betyder att sökordet har volym över 200 och att
ingen sida på fyndplats.se finns bland de hundra första. Tre sökord har volym
under 200 och står som `ej mätt`: *uppresningsfåtölj*, *kontorsstol med
massage* och *radiatorskydd*. Domänfilen är filtrerad på volym och täcker dem
inte, och ingen kategorisida rankar på dem.

## Vad den säger i dag

- **102 huvudsökord, 906 250 sökningar i månaden sammanlagt.**
- **Domänen rankar topp 100 på tre av dem**, och alla tre går till en gammal,
  bred sida:

  | sökord | volym | position | sida i dag | sidan som bygger på ordet |
  |---|--:|--:|---|---|
  | massagebänk | 1 900 | 28 | Massage & Återhämtning | Massagebänkar (S12) |
  | hantlar | 12 100 | 58 | Träning & Gym | Hantlar & hantelset (S9) |
  | behandlingsbänk | 260 | 60 | Massage & Återhämtning | Massagebänkar (S12) |

- **Ingen av S4/S5:s 13 huvudsökord rankar.** Sidorna hade varit live i
  några timmar, och Semrush placeringar ligger oftast dagar efter. Talet är
  alltså en ren före-mätning, inte ett besked om att sidorna inte fungerar.
- **20 kategorisidor rankar på något alls**, på sammanlagt 77 sökord, nästan
  alla långsvansade (*solskydd altan* 53, *mus till dator* 56, *kompishalsband*
  57).
- **Produktsidorna rankar redan på långsvansen runt flera huvudsökord:**

  | sökord | position |
  |---|--:|
  | *stapelbara pallar* | 2 |
  | *stegpall barn* | 8 |
  | *bänkugn* | 16 |
  | *vinkyl smal* | 18 |
  | *hamsterbur stor* | 20 |
  | *golvlampa med bord* | 21 |
  | *badrumsskåp smalt* | 24 |
  | *kattlåda med tak* | 30 |

  Kategorisidan ska ta huvudordet, och produktsidan långsvansen. Tappar en av
  de här placeringarna efter #647 är det värt att titta på, eftersom det kan
  betyda att kategorisidan konkurrerar med sin egen produkt.

## Vad mer som ändras med #647

Utöver texterna ändrar samma deploy tre saker som påverkar hur mätningen ska
läsas:

- **Produktsidornas brödsmula länkar till den smalaste underkategorin**
  (`ae95508e`), alltså Hem / Möbler / Snurrfåtöljer / produkt. Före ändringen
  länkade 5 av 40 mätta produktsidor till sin sökordskategori. Efter den länkar
  alla produkter i en indexerbar underkategori dit. I förhandsbygget gjorde alla
  60 stickprov som ligger i en underkategori det.
  Sökordskategorierna får alltså både text och länkar på en gång, och
  mätningen kan inte skilja de två effekterna åt.
- **Google-flödet får extrabilder på alla produkter** (557 av 3 393 före). Det
  rör Shopping, inte de organiska placeringarna här.
- **Menyns underkategorier ligger i HTML:en** (`2513ae85`). Förut renderades
  bara panelen man hovrar över, och startsidan, den enda sidan med externa
  länkar, länkade till 0 av 105 underkategorier. En PageRank-modell ger
  underkategorierna 45–86 gånger mer internt värde, se
  `../meny-underkategorier/`. Det är sannolikt den största av de tre
  ändringarna, och mätningen kan inte skilja den från de andra två.

## Mät om

Vänta **fyra till fem veckor efter mergen av #647**, runt 2026-10-30. Google
behöver hitta, indexera och värdera 63 nya eller omskrivna sidor.

Gör sedan samma två anrop och jämför fil mot fil:

1. `resource_organic`: mål `www.fyndplats.se/kategori/`, databas `se`,
   `display_limit` 500, kolumner keyword, position, volume,
   keyword_difficulty, url.
2. `resource_organic`: mål `fyndplats.se`, databas `se`, filter
   `volume greater_than 200`, sortering `volume_desc`, `display_limit` 400.

Volymerna behöver inte hämtas igen. De ändras långsamt, och jämförelsen gäller
placeringarna.

**Tre tal avgör om strategin fungerar:**

- Hur många av de 102 huvudsökorden rankar topp 100, i dag 3, och hur många
  av dem går till **rätt** sida, i dag 0.
- Hur många `/kategori/`-sidor rankar på något alls. I dag är det 20, och
  efter mergen har sitemapen 115 kategorisidor.
- Om någon produktsida i tabellen ovan har tappat mer än tio placeringar.

Kostnad i dag: 1 020 API-enheter för volymerna och 2 040 för domänfilen.
Kategorifilen hämtades tidigare samma dag.

Och ett fjärde tal, ur Googles egna siffror: **organiska landningar på
kategorisidorna per vecka**, före mot efter mergen (`ga4-organisk.sql`,
fråga 2). Se avsnittet om GA4 nedan.

## Tillägg: runda S14 (samma dag)

Runda S14 (`../runda-s14-langsvans-kategorier/`) lade till **13
huvudsökord på fem sidor, 29 040 sökningar i månaden**, sist i
`baslinje-2026-09-24.tsv`. Inget av dem rankar topp 100 i dag. Filen har
alltså 115 huvudsökord, och talet *102* ovan gäller S4–S13.

S14 valdes efter en annan regel än de tidigare rundorna: dealproffsen.se, som
säljer samma Aosom-varor, ligger på plats 1–5 på samma ord med en egen smal
kategorisida. Vid omätningen är deras placering därför ett eget riktmärke.
Samma ord, samma varor och samma sidtyp. Rör sig S14-sidorna inte när
dealproffsen ligger på plats 1–5, är det domänens styrka som bromsar och inte
sidorna.

## Verklig trafik ur GA4 (tillägg 2026-09-24)

Semrush räknar placeringar och uppskattar trafiken. Googles egna siffror
ligger i BigQuery, i projektet `fyndplats`:

| dataset | innehåll | läge 2026-09-24 |
|---|---|---|
| `analytics_361016118` | GA4-exporten, en tabell per dag sedan 2026-08-09 | fungerar, tabellerna har inget utgångsdatum |
| `searchconsole` | Search Consoles massdataexport | ☠️ **tom**, se nedan |
| `merchant_center` | Merchant Centers produkter och resultat | inte undersökt |

Frågorna står i `ga4-organisk.sql`. Den första räknar organiska besök per
vecka och typ av landningssida. Den andra räknar organiska landningar per
kategorisida, före och efter #647.

**Måttet är kolumnen `kategori`.** Före #647 fick kategorisidorna ett fåtal
organiska landningar i veckan, alla på gamla breda sidor och ingen på en
sökordssida. Produktsidorna tar merparten av den organiska trafiken. Fungerar
sökordsrundorna syns det här först, veckor innan Semrush hinner mäta om.

☠️ **Samtyckesbrottet vecka 37.** Från 2026-09-07 exporteras också besök utan
samtycke, och de saknar kanal. Ett Google-besök utan samtycke syns bara som
en hänvisning från google.com. Frågorna räknar det som organiskt när
landningsadressen saknar annonsparametrar (`gclid`, `gad_source`, `gbraid`,
`wbraid`, `dclid`). Före vecka 37 finns bara besök med samtycke, så serien
har ett brott där. Jämför helst perioder som båda ligger efter vecka 37.

☠️ **Search Console-exporten har aldrig levererat.** Tabellerna skapades
2026-08-10, men `ExportLog` och båda datatabellerna har 0 rader. Search
Consoles tjänstekonto äger datasetet, så det är inte datasetets behörighet
som fattas. Felet står i Search Console under Inställningar →
Massdataexport. En vanlig orsak är att kontot saknar rollen BigQuery Job User
i projektet. Det är en hypotes, inte en mätning. När exporten fungerar finns
visningar, klick och placering per sida och sökord, direkt från Google.

⚠️ **Siffrorna står inte här.** Repot är publikt, och sessioner och köp är
affärsdata. De står i mättriggern och räknas om ur BigQuery vid omätningen.

⚠️ **ChatGPT är ungefär lika stor som organisk Google** (kanalen
`AI Assistant`, källa `chatgpt.com`). Besökarna tittar på varor, lägger i
varukorgen och köper, så det är människor och inte robotar. Semrush ser inte
den trafiken, och `robots.txt` släpper in ChatGPT:s robotar.
