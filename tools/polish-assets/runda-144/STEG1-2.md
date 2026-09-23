# Runda 144 — växthus, andra vågen

## Steg 1 — familjevalet

Katalogsvep 2026-09-18 via `products/search` (59 sidor, cursor-baserat, `avhuggen: false`):
**5 830 unika produkter, 2 978 utkast, 2 852 publicerade.**

### Skyddsgrindarna omprövades och avfärdades igen

Draft-huvudordsfrekvensen pekade först på `Absperrgitter`/`Türschutzgitter` (45
träffar mot ett GISSAT svenskt nät `skyddsgrind|barngrind|husdjursgrind|trappgrind` →
bara **1** publicerad). Det är exakt #494:s fälla — innan familjen valdes lästes
runda 131:s egen `STEG1-3.md`, som redan mätt om den korrekt: butiken säljer
grindarna som `hundgrind-*`/`dorrgrind-*`/`trappgrind-*`, och det verkliga talet var
**53 utkast / 36 publicerade** redan då (2026-09-11) — den mest MÄTTADE kandidaten av
alla, inte den mest orörda. Familjen är alltså fortsatt fel val; ingen ny mätning
motsäger runda 131:s.

### Tre kandidater mätta på RIKTIGA sluggar, inte gissade

| familj | utkast | publicerade | kvot |
|---|--:|--:|---|
| badezimmerschrank (badrumsskåp) | 43 | 23 | 1,9:1 |
| hochbeet (odlingslåda/-bord) | 35 | 18 | 1,9:1 |
| **gewächshaus + foliengewächshaus (växthus)** | **103** | **27** | **3,8:1** |

Växthusfamiljen vinner på båda måtten: bäst kvot OCH störst absolut lucka.
`hochbeet`/`badezimmerschrank` är redan till hälften täckta (surefire dedupe-risk mot
en publicerad sida av samma modell); växthusfamiljen har bara fjärdedelen täckt.

Metoden var densamma som runda 131 etablerade efter sin egen 35×-felmätning:
**svep publicerade `slug`+`name`, gissa inget svenskt ord** — de tre kandidaterna
ovan mättes mot de FAKTISKA publicerade namnen (`tunnelväxthus-*`, `vaxthus-*`,
`minidrivhus-*`, `drivbank-*`, `vaggvaxthus-*`, `tomatvaxthus-*`, `litet-vaxthus-*`,
`vaxthusskap-*`, `reservoverdrag-*`/`vaxthusduk-*`), inte mot en översatt gissning.

### 103 är TRE olika produktklasser, inte en

| grupp | antal | exempel |
|---|--:|---|
| **kärna — hela växthus** | **86** | `Gewächshaus …`, `Foliengewächshaus …`, `Polytunnel-Gewächshaus …`, `Mini-Gewächshaus …`, `Tunnelgewächshaus …`, `Anlehngewächshaus …` |
| Hochbeet med växthustopp (hybrid) | 5 | `Hochbeet mit Gewächshaus-Dach …` — hör egentligen till odlingslåde-familjen, inte hit |
| Ersättningsdukar (`Gewächshausfolie`/`-abdeckung`) | 12 | tillbehör, inget eget växthus i kartongen |

Runda 144 tar bara **kärnan**. Hybriderna hör till en framtida `hochbeet`-runda
(de säljs som odlingslåda-med-tillval, inte som växthus), och ersättningsdukarna
är redan delvis täckta (4 publicerade `reservoverdrag-*`/`vaxthusduk-*`-sidor) och
förtjänar en egen liten runda där hela jämförelsen är mot dukens mått, inte mot
en stomme.

### Batch 1: åtta produkter, sex olika konstruktioner

Kärnan (86 st) delar en genomgående ordvariation — nästan alla bär ordet
`Foliengewächshaus` NÅGONSTANS i namnet oavsett faktisk form (rak vägg, tunnel,
båge) — så en indelning efter ord i titeln hade blivit godtycklig. Valet styrdes
i stället av att **sprida konstruktion och pris**, så att rundans åtta inte blir
åtta varianter av samma sak:

| pid | namn (rått) | pris | konstruktion |
|---|---|--:|---|
| `ff590562` | Foliengewächshaus, Kunststoff-Abdeckung, Maschentür, Stützstangen | 1 829 | rakväggigt, nätdörr + stödstänger |
| `d44fd4bd` | Bogen-Gewächshaus mit Sandsäcken und Kunststoff-Abdeckung | 799 | låg bågtunnel, sandsäcksförankrad |
| `00e49c84` | Tunnelgewächshaus, aufrollbare Tür und Fenster, verzinkter | 1 249 | tunnel, galvaniserad stomme |
| `f8d3a8fd` | Anlehngewächshaus, Schiebetür, Dachfenster, Polycarbonat+Aluminium | 2 719 | **lutande väggväxthus**, polykarbonat |
| `760f493a` | Mini-Gewächshaus, Kompaktes Pflanzenhaus aus Holz | 779 | **träram**, minidrivhus |
| `52b12860` | Rundbogen-Gewächshaus, 6 Netzfenster, transparente Folie | 1 759 | rundbågsform |
| `c816963e` | Gewächshaus, Treibhaus, transparent, geeignet für Außenbereiche | 1 099 | enkel bas-modell |
| `ca16f9ab` | Gewächshaus mit Dachfenster Aluminium Treibhaus 190×132×201 cm | 4 049 | premium, aluminiumstomme + takfönster |

Priser 799–4 049 kr. Sex konstruktionstyper (rakväggigt/bågtunnel/väggmonterat
lutande/mini i trä/rundbåge/premium-aluminium) — ingen delar formfamilj med en
annan i samma runda, så ingen risk att skriva samma sida två gånger. De
resterande ~78 kärnväxthusen (inklusive flera tydliga storleksstegar av samma
modell, t.ex. `… Foliengewächshaus mit Regalen Rollbar` i 2,7×2×2 / 3×2×2 / 4×3×2 m)
tas i kommande rundor.

⚠️ **Flera drafts delar exakt samma namn men olika pris** (Wix-slug-suffix `-2`).
Det är INTE grund att anta dubblett — samma mönster som runda 61:s frukostset
(artikelnumrets bas = modell, suffix = variant) och som `PRODUCT_PART_MAX`-kapade
sluggar överallt i den här familjen. Facit är mappningens `sourceUrl`/artikelnummer
och de faktiska måtten, inte namnet. De två `-2`-paren i den här batchen
(`ff590562`/dess syskon fanns inte i batchen — batchen har inga sådana par;
noterat för nästa runda) prövas var för sig i Steg 5 när de tas.

## Steg 2 — laglighetsgrind: bygglov, snölast, materialets namn

Ärver runda 50:s tre villkor (`#226`) rakt av — inget nytt behövs, familjen är
densamma. Verifierat mot aktuell svensk källa i dag, eftersom bygglovsreglerna
ändrades 2025-12-01 (se nedan).

### 1. Bygglov — friggebod/attefallshus heter numera komplementbyggnad

Sedan 2025-12-01 är begreppen "friggebod" och "attefallshus" borttagna ur lagen
och ersatta av **komplementbyggnad**. Ett växthus räknas som en sådan (samma
kategori som förråd, garage, gäststuga). Bygglovsfri "pott": den sammanlagda ytan
för alla bygglovsfria komplementbyggnader på tomten får vara högst **45 m²**, och
byggnaden ska stå minst **4,5 meter från tomtgränsen** (närmare kräver grannens
skriftliga medgivande). ([bygglovstjanst.se](https://www.bygglovstjanst.se/nya-regler-for-bygglov/))

Alla åtta i den här batchen är enstaka växthus på 2–8 m² — långt under 45 m²-potten
för sig själva. **Ingen av sidorna påstår att bygglov krävs eller inte krävs** —
det beror på vad kunden redan har på tomten, vilket vi inte känner till. Regeln
skrivs alltså INTE ut som ett kategoriskt "inget bygglov behövs" (det kan vara
fel för en kund med redan fulla 45 m²) och inte heller som en skrämmande
varning. Den utelämnas helt ur brödtexten, precis som `SORTIMENT`-regeln säger
om påståenden som kan sluta vara sanna: en byggregel som gäller HELA tomten,
inte den här produkten ensam, hör inte hemma i en produktbeskrivning.

### 2. Snölast — ingen certifiering finns att luta sig mot, så det skrivs inte som ett tal

Feedens `Technische Daten` anger aldrig en snölastklass (ingen `kg/m²` eller
EN-standard för växthus förekommer i någon av de åtta). Att skriva ut en
snölastsiffra vore att hitta på ett mätvärde ingen källa ger (Steg 5, regel 5:
"superlativ/mätvärde utan siffra bakom sig upprepas aldrig"). Det som DÄREMOT
är sant och görbart utan att gissa: en folie- eller nätklädd stomme är lättare
byggd än ett permanent uterum, och tunga snölaster kan få den att kollapsa om
den inte skottas. Det skrivs som ett positivt skötselråd i "Användning och
skötsel" — `Skotta taket vid snöfall` — inte som en varning, och bara på de
produkter där konstruktionen faktiskt är folie/nät (dvs. inte på den
aluminium+polykarbonatstomme som är styvare).

### 3. Materialets namn — aldrig "härdat glas" om det är folie eller PC-skiva

Ingen av de åtta är glasväxthus. Käll-materialen är `Kunststoff-Abdeckung` (PE-
eller PVC-folie), `Polycarbonat` (`f8d3a8fd`, `ca16f9ab` har `PC-Platten`/
Aluminium-ram med paneler) eller ren `transparente Folie`/`Netzfenster`. **Skriv
alltid det faktiska materialet** — `PE-folie`, `polykarbonatskivor`, `nätfönster`
— aldrig det generiska "glas", och aldrig ordet härdning om det inte är belagt.
Samma regel som soffbordens glasskivor (runda 36) och matgruppernas (runda 53):
ett materialpåstående som inte stämmer med källan skrivs om, det läggs inte till
en brasklapp.

**Ingen av de tre punkterna stoppar familjen.** Alla åtta går vidare till Steg 3.
