# Fyndplats cache-warmer — projektanvisningar

Den här filen laddas i varje chatt, så den är bara en innehållsförteckning
(Leonards beslut 2026-11-01, för att spara tokens). Allt som stod här tidigare
står ordagrant i ämnesfilerna under `docs/claude/`, i samma ordning som förut.
Läs filen för det du ska göra innan du gör det. Hittar du inte rätt fil:

```
grep -rn "sökord" docs/claude/
```

- Ny kunskap skrivs i den ämnesfil den hör till, aldrig här. Ett nytt ämne får
  en egen fil och en rad i listan nedan.
- SEO-polering: skillen `seo-polering` (`.claude/skills/seo-polering/SKILL.md`)
  och runbooken `docs/seo-polish-runbook.md`, som har en fil per steg.
- `tools/docs-index/innehall.test.ts` fäller om den här filen växer över 30 000
  byte, om en ämnesfil eller en underrubrik saknas i listan, om en sökväg här
  inte finns och om ett citat nedan inte längre står ordagrant i sin fil.

## Regler som alltid gäller

Ordagrant ur filerna. Skälen står där.

- **En arbetsdag ska bli en eller två deploys, inte fem.** Samla dagens
  ändringar på grenen och merga när de hänger ihop — merga inte varje fix för
  sig så fort den är grön. *(`01-bunta-ihop-deploys.md`)*
- En bugg som skadar kunder just nu får sin egen deploy direkt. Det är
  kostnaden värd. Allt annat väntar in sina syskon. *(`01-bunta-ihop-deploys.md`)*
- ⚠️ **Undantagen är `docs/`, `tools/` och markdown — INGET annat.** En fil i
  ROTEN bygger, hur dokumentationsartad den än är. *(`01-bunta-ihop-deploys.md`)*
- **Kontrollera efter varje merge att merge-commiten fått ett bygge**
  (`list_deployments` med `sha`, eller commit-statusen på merge-commiten).
  *(`01-bunta-ihop-deploys.md`)*
- **Räkna byggen i Vercels deployment-lista, inte i `git diff`** — filtret kan
  vara ur funktion utan att spannet ändras. *(`01-bunta-ihop-deploys.md`)*
- ☠️ **Feedens adress är en hemlighet och får aldrig hårdkodas.**
  *(`04-aosom-leverantoren.md`)*
- ☠️ **Aosoms artikelnummer får aldrig synas någonstans.** Inte i kundtext,
  spec-tabell, alt-text, SKU eller slug, och inte i rundans filer, commits,
  Actions-loggar eller PR-texter. *(`docs/seo-polish-runbook.md`)*
- **Actions-loggar på ett publikt repo går att läsa utan inloggning.** Det finns
  ingen "intern" logg här. *(`05-aosom-synken/40-att-polera-aosom.md`)*
- ☠️ **Rabattnivån står bara i `FyndplatsAppConfig` (`vevorProRabatt`, procent
  som text).** Aldrig i kod, tester, loggar eller ett svar
  *(`08-vevor-steg-4-importen.md`)*
- ☠️ **Ett svar utan fel är inget kvitto.**
  *(`05-aosom-synken/37-reparationen-524.md`)*
- ☠️ **Aldrig inne i Aosoms synkfönster** (`lib/wix/synkfonster.ts`: :12–:29 UTC
  var tredje timme, 00, 03 … 21).
  *(`05-aosom-synken/34-tvaaxliga-sidor/17-kostnaden-skrivs-in-varukostnad.md`)*
- ☠️ **Regeln: en fix som inte är mergad finns inte för den som kör
  workflowen.** `workflow_dispatch` tar en `ref`, och default är `main`.
  *(`05-aosom-synken/40-att-polera-aosom.md`)*
- Ingenting raderas ur Media Manager, varken av sig självt eller för hand.
  *(`05-aosom-synken/39-bildstadningen.md`)*
- **en spärr man måste komma ihåg glöms bort.** *(`04-aosom-leverantoren.md`)*
- **en obegränsad fan-out skalar med katalogen — den är en tidsinställd bomb,
  inte en bugg.** Leta efter `Promise.all` över något som växer.
  *(`38-dod-listning.md`)*

## Ämnesfilerna

Sökvägarna är relativa till `docs/claude/`. Under varje fil står dess
underrubriker. En katalog är ett avsnitt som är uppdelat på en fil per
underrubrik.

- `01-bunta-ihop-deploys.md`: Så här jobbar vi: bunta ihop deploys
  - Varför — mätt, inte antaget
  - Särskilt för import- och poleringspass
  - ☠️ En PUSH till grenen bygger också — inte bara en merge (2026-09-05)
  - ✅ Löst i `vercel.json` — dokumentation utlöser inget bygge (Leonards ja 2026-09-05)
  - ✅ Kvitterat i drift — och så här SER ett hoppat bygge ut
  - ☠️ Filtret FÖRGIFTAR SIG SJÄLVT — och slutade fungera efter sju hoppade byggen (2026-09-05)
  - ✅ Läkningen är inte engångs — den upprepas, och det är meningen (2026-09-05)
  - ☠️ En merge gav inget bygge — GitHub skickade ingen push-händelse (2026-09-25)
  - Undantaget
- `02-import-och-ai-kostnad.md`: Import-arbetsflöde & AI-kostnad (`AI_ENRICHMENT_ENABLED`)
  - Default-läge: RÅ import → polera via chatten (GRATIS)
  - Variantöversättning: tabell → cache → Haiku → svenskhets-grind → färg-grind (egen switch `VARIANT_AI_TRANSLATION_ENABLED`)
  - Bulk-läge: AI-berikning PÅ (kostar Anthropic-credits)
  - Var det gatas
- `03-tom-cron-tugga-tyst.md`: En tom cron-tugga ska vara TYST (2026-09-04)
- `04-aosom-leverantoren.md`: Aosom: andra leverantören, samma pipeline (`lib/aosom/`)
  - Vägen in
  - Syskonimporten: en sidas familj, utan artikelnummer (2026-09-30)
  - Så körs den: GitHub Actions, inte en terminal
  - ☠️ Artikelnumret når aldrig en Actions-logg (2026-09-27)
  - Fyra saker som inte ska tas bort
- `05-aosom-synken/`: Aosom-synken: ett anrop ger hela sanningen (`lib/aosom/sync.ts`). En fil per avsnitt, inledningen först.
  - `05-aosom-synken/00-inledning.md`
  - `05-aosom-synken/01-sex-egenskaper.md`: Sex egenskaper som inte ska tas bort
  - `05-aosom-synken/02-lagerskrivningen-och-edge-sparren.md`: ☠️ Lagerskrivningen sprang ihjäl sig mot Wix edge-spärr (2026-09-02)
  - `05-aosom-synken/03-batchade-skrivningar.md`: ✅ Skrivningarna är batchade sedan 2026-09-04 — spärren är irrelevant, inte uthärdlig
    - ☠️ Och sida TVÅ av samma läsning gick aldrig att hämta (2026-09-13)
  - `05-aosom-synken/04-stampel-som-ljuger.md`: ✅ En stämpel som ljuger rättas mot butiken (2026-09-30)
  - `05-aosom-synken/05-stampeln-pa-farska-raden.md`: ✅ Stämpeln läggs på den färska raden — synken skriver inte över (2026-09-30)
  - `05-aosom-synken/06-stamplarna-per-tugga.md`: Stämplarna läses och sparas en tugga i taget (2026-10-29)
  - `05-aosom-synken/07-sa-kors-den-for-hand.md`: Så körs den för hand
  - `05-aosom-synken/08-svansen-av-katalogen.md`: ☠️ Synken nådde aldrig svansen av katalogen (2026-10-13)
  - `05-aosom-synken/09-levande-fyndauktion.md`: ☠️ En levande fyndauktion äger priset (2026-10-13)
  - `05-aosom-synken/10-prislast.md`: `prisLast`: en rad där synken räknar om men INTE skriver (2026-09-05)
  - `05-aosom-synken/11-prissynken-skrev-aldrig.md`: ☠️ Prissynken skrev aldrig ett enda pris till Wix (2026-08-29)
  - `05-aosom-synken/12-auditen-20-rader.md`: Auditen: driften är 20 rader, inte 1 611 (2026-08-29)
  - `05-aosom-synken/13-variantsinfo-patch-publicerar.md`: ☠️ En `variantsInfo`-PATCH PUBLICERAR ett utkast
    - ☠️ VARIANTEN HAR ETT EGET `visible` — och 31 sidor gick inte att köpa (2026-09-06)
    - ☠️ Och en FLERVARIANTSPRODUKT kräver att `options` följer med (2026-09-13)
  - `05-aosom-synken/14-variantens-bild-med-namn.md`: ☠️ Variantens bild följer bara valet om valen skickas med NAMN (2026-10-03)
  - `05-aosom-synken/15-bestallning-i-klump.md`: Aosom beställs i klump, inte via API (`lib/aosom/bulk-order.ts`)
  - `05-aosom-synken/16-postnummer-utan-leverans.md`: Postnummer dit Aosom inte levererar (2026-10-26)
  - `05-aosom-synken/17-resten-av-guiden.md`: Resten av vad guiden säger
  - `05-aosom-synken/18-vad-sparren-inte-ser.md`: Vad spärren INTE ser
    - ☠️ Men AE-listningen bär Aosoms artikelnummer i klartext (2026-09-06)
    - ☠️ Och en TREDJE klass: Aosoms EGEN feed bär samma vara två gånger (2026-09-12)
  - `05-aosom-synken/19-akta-dubbletter-mappas-om.md`: Äkta dubbletter mappas om till Aosom (Leonards regel 2026-09-03)
  - `05-aosom-synken/20-fargsammanslagning.md`: Färgsammanslagning: ett utkast blir en FÄRG på en publicerad sida (2026-09-27)
    - Sammanslagning v2: storlek, fler val och en publicerad givare (2026-09-27)
    - Givarens 301 landar på givarens färg (2026-10-06)
    - En sammanslagen sida får ny text med `varianter` i planen (2026-09-30)
    - Färg och storlek på samma sida (2026-09-27)
  - `05-aosom-synken/21-pensionerade-utkast.md`: Pensionerade utkast raderas efter fjorton dygn (2026-09-28)
  - `05-aosom-synken/22-fargbilderna.md`: Färgbilderna: varje färg får alla sina bilder (2026-09-30)
  - `05-aosom-synken/23-bilder-bort.md`: Bilder bort: också de som ett färgval pekar på (2026-10-14)
  - `05-aosom-synken/24-farger-utan-bilder-aliexpress.md`: Färger utan egna bilder på en AliExpress-sida (2026-10-21)
  - `05-aosom-synken/25-syskonsvepet.md`: Syskonsvepet: färg, storlek och samma vara i hela sortimentet (2026-09-27)
  - `05-aosom-synken/26-google-och-dubbletter.md`: Kan Google se att det är dubbletter? (Leonards fråga 2026-08-27)
  - `05-aosom-synken/27-bildpositionerna.md`: Bilderna: bara position 1, 2, 3, 8 och 9 hämtas hem
  - `05-aosom-synken/28-ovriga-bildpositioner.md`: De andra positionerna hämtas för granskning (2026-09-30)
  - `05-aosom-synken/29-miljobilden.md`: Miljöbilden ska vara andra bilden (2026-10-01)
  - `05-aosom-synken/30-fargval-med-fa-bilder.md`: Färgval med få bilder: fler bilder per färg (2026-10-21)
    - Bildstädningen rör inte färgbilderna (kontrollerat 2026-10-22)
  - `05-aosom-synken/31-storleksvyer.md`: Storleksvyer och andra enkla val: mätta först 2026-10-22
  - `05-aosom-synken/32-cowork-rundan.md`: Cowork-rundan: bilder ur aosom.de:s galleri, plats 11 och uppåt (2026-10-22)
  - `05-aosom-synken/33-delade-mattbilder.md`: Delade måttbilder på storleksidor visas under fel storlek (2026-10-22)
  - `05-aosom-synken/34-tvaaxliga-sidor/`: Tvåaxliga sidor: färgfoton på färgen, ett kort per storlek (2026-10-23). En fil per avsnitt, inledningen först.
    - `05-aosom-synken/34-tvaaxliga-sidor/00-inledning.md`
    - `05-aosom-synken/34-tvaaxliga-sidor/01-mattbild-en-farg-en-storlek.md`: Det som inte går att rätta med länkar: en måttbild som visar EN färg i EN storlek
    - `05-aosom-synken/34-tvaaxliga-sidor/02-wix-regel-for-variantbilden.md`: Wix:s regel för variantens bild (mätt 2026-10-23 på tre dolda testprodukter, raderade direkt efteråt)
    - `05-aosom-synken/34-tvaaxliga-sidor/03-katalogkontrollen-atta-sidor.md`: Katalogkontrollen och de åtta sidorna
    - `05-aosom-synken/34-tvaaxliga-sidor/04-korten-per-storlek.md`: Korten per storlek: `runda-bilder-soptunna-storlekskort` (2026-10-23)
    - `05-aosom-synken/34-tvaaxliga-sidor/05-forvaringskistan.md`: Förvaringskistan: samma recept utan kort (`farg-forst.js`, 2026-10-23)
    - `05-aosom-synken/34-tvaaxliga-sidor/06-mattbilder-fel-storlek-16-sidor.md`: Måttbilder för fel storlek på 16 sidor till (Leonards fråga 2026-10-23)
    - `05-aosom-synken/34-tvaaxliga-sidor/07-de-16-sidorna-agare-per-bild.md`: De 16 sidorna rättade: en uttalad ägare per bild (`bygg-agare.py`, 2026-10-23)
    - `05-aosom-synken/34-tvaaxliga-sidor/08-motorn-lankar-pa-bada-optionerna.md`: Motorn rättar nu sidor med länkar på båda optionerna (Leonards ja 2026-10-23)
    - `05-aosom-synken/34-tvaaxliga-sidor/09-leonards-svar-sex-fragor.md`: Leonards svar på de sex frågorna: ett kort per storlek, dubbletter borta, gemensamma bilder delas (2026-10-23)
    - `05-aosom-synken/34-tvaaxliga-sidor/10-fargneutrala-mattkort.md`: Färgneutrala måttkort på 16 sidor: alla färger på samma kort (Leonards skärmbilder 2026-10-23 06:47 svensk tid)
    - `05-aosom-synken/34-tvaaxliga-sidor/11-en-bild-per-kombination.md`: En bild per kombination: revisionen av alla sidor med två val (Leonard 2026-10-23, 13:12 svensk tid)
    - `05-aosom-synken/34-tvaaxliga-sidor/12-efter-butiksmergen-17-sidor.md`: Efter butiksmergen: de 17 sidorna omlänkade en och en, och mätta i en riktig webbläsare (2026-10-24)
    - `05-aosom-synken/34-tvaaxliga-sidor/13-originalen-tillbaka.md`: Originalen tillbaka: inga Fyndplats-kort där leverantören har en måttbild (Leonards svar 11, 2026-10-24)
    - `05-aosom-synken/34-tvaaxliga-sidor/14-harma-aosom.md`: Härma Aosom: samma bilder som Aosom har kopplat, på varje färg och storlek (Leonards uppdrag 2026-10-24)
    - `05-aosom-synken/34-tvaaxliga-sidor/15-harma-aldsta-fotona-soptunnan.md`: Härma lämnade de äldsta fotona som färgfoton: soptunnan `c841717c` rättad (2026-10-27)
    - `05-aosom-synken/34-tvaaxliga-sidor/16-harma-exakt-agare-13-sidor.md`: Härma-sidorna: exakt ägare på 13 sidor (2026-10-28)
    - `05-aosom-synken/34-tvaaxliga-sidor/17-kostnaden-skrivs-in-varukostnad.md`: Kostnaden skrivs in: `/api/admin/varukostnad` (punkt 5b, körd 2026-10-28)
    - `05-aosom-synken/34-tvaaxliga-sidor/18-elva-harma-sidor-utanfor.md`: De elva Härma-sidorna som låg utanför: minimal ägarplan (2026-10-28)
  - `05-aosom-synken/35-nattens-sammanslagna-sidor.md`: Nattens utkast blev sju sammanslagna sidor: mät varje vy live (2026-10-22)
  - `05-aosom-synken/36-bildimporten-tystnade.md`: Bildimporten tystnade — 397 av 675 produkter fick noll bilder
  - `05-aosom-synken/37-reparationen-524.md`: Reparationen rapporterade 524 av 524 lagade. 214 produkter saknade ändå bilder
  - `05-aosom-synken/38-wix-importerade-om.md`: ☠️ Wix importerade om VARJE bild — halva lagringen var kopior (2026-08-28)
  - `05-aosom-synken/39-bildstadningen.md`: Städningen av det som blev kvar
    - ☠️ Bildstädningen är avstängd helt (Leonard 2026-10-23 och 2026-10-30)
    - Bildfixen lämnade dessutom sina egna kopior
    - Bara det som saknas laddas om (byggt 2026-08-28)
    - ☠️ Städningen raderade kundernas recensionsbilder (2026-09-04)
    - ☠️ 260 recensioner hade döda foton igen (2026-10-06)
    - ☠️ Bloggen, reservkatalogen och ordrarna stod inte i listan (2026-10-14)
    - ☠️ Granskningen före första körningen: varianterna och en karenstid (2026-10-14)
    - ☠️ Två skilda 429:or — och den ena går inte att vänta ut
    - ☠️ Ett fel som slukas av en kommandosubstitution finns inte
  - `05-aosom-synken/40-att-polera-aosom.md`: Att polera en Aosom-produkt
    - ☠️ TITTA PÅ BILDERNA FÖRE TEXTEN, inte efter (2026-09-07)
    - ☠️ Skriv texten i en FIL först — mätt 9 fel mot 0 (2026-09-04)
    - ☠️ Och filen är inte det som skickas — `fontagen-weight` (2026-09-06)
    - ☠️ Filgrinden täcker bara halva vägen — grinda den PUBLICERADE texten
    - ☠️ Katalogsvepet: fem fel, och fyra av dem var osynliga (2026-09-07)
    - ☠️ En backfill som rapporterar NOLL kan ha mätt fel sak (2026-09-07)
    - ☠️ Och en fjärde: checklistan som ingen mätte (2026-09-06)
    - ☠️ En grind kan vara PÅSLAGEN och ändå blind — alt-svepet var det (2026-09-07)
    - ☠️ Och GRINDARNA själva drev isär — 19 kopior i tre versioner (2026-09-06)
    - ☠️ Och en TREDJE blind fläck: `<title>` och metabeskrivningen (2026-09-06)
    - ☠️ En OMERGAD gren skyddar ingenting — workflowen körs från `main` (2026-09-07)
    - ☠️ Korten GRINDAS sedan 2026-09-16 — och de byggs ur en fil
    - ☠️ Tre publicerade/utkastade sidor var EN kattlåda (2026-09-16)
    - ☠️ Flera produkter kan dela EN SKU — kolla varje batch
- `06-vevor-steg-1-och-3-leverantorstyp.md`: VEVOR: steg 1 och 3 — leverantören är en uttömmande typ (2026-10-21)
  - Steg 1: varje val mellan leverantörer tar ställning till alla
  - Steg 3: synken tar emot ett besked, inte en Aosom-rad
  - Inte gjort, med flit
- `07-vevor-steg-2-lasaren.md`: VEVOR: steg 2, läsaren av produktsidorna (2026-10-29)
  - ☠️ VEVOR visar två sidmallar, och läsaren kände bara den ena (2026-10-30)
  - Familjens specifikation per variant (2026-10-30)
- `08-vevor-steg-4-importen.md`: VEVOR: steg 4, importen som osynliga utkast (2026-10-29)
- `09-vevor-steg-5-synken.md`: VEVOR: steg 5, synken (2026-10-29)
  - Katalogtaken
  - Vad en körning läser
- `10-vevor-steg-7-gpsr.md`: VEVOR: steg 7, publiceringsspärren och produktsäkerheten (2026-10-29)
- `11-vevor-steg-8-syskon-betyg-recensioner.md`: VEVOR: steg 8, syskon, betyg och recensioner vid importen (2026-10-29)
  - Familjeregeln: bara färg, storlek, längd och förpackning delar en sida (2026-10-30)
  - Varje färg får sina egna bilder (2026-10-30)
  - Radera och börja om
- `12-vevor-poleringen.md`: VEVOR-poleringen (2026-10-30)
- `13-vevor-kategorierna.md`: VEVOR: kategorierna (2026-10-31)
- `14-prissattningen.md`: Prissättningen är marknadskalibrerad, inte påhittad (`FyndplatsPricingConfig`)
  - `charm99` är PÅSLAGEN sedan 2026-09-03
  - Var talet kommer ifrån
  - Tre fällor som redan kostat
  - Referenspriser är fiktion — båda hållen
  - Varför vi förlorar på billiga varor — och vad som faktiskt löser det
  - B2B-kontot är en rabatt på varan och ett straff på frakten (mätt 2026-08-27)
  - Fler länder: feeden har frakten till 40 (2026-10-21)
  - Danskt sortiment och pris per sida (2026-10-22)
  - Vad som INTE är fixat
  - ☠️ Och AE-radernas kostnad FRYSER vid importen (2026-09-06)
- `15-prishojning-ae.md`: Prishöjning på AE-halvan (`lib/pricing/ae-prishojning.ts`)
  - Sex grindar som inte ska tas bort
  - ☠️ En tappad stämpel gör omkörningen till 499 → 549 → 609
  - Kvittot
- `16-automatisk-rea.md`: Automatisk rea: jämförpriset följer lagen (`lib/pricing/rea.ts`, 2026-11-01)
- `17-dealproffsen.md`: Dealproffsen: vi jämför inte med dem (Leonard 2026-10-21)
  - ☠️ Och den hittade ett tyst tak som redan var passerat (2026-09-14)
  - ☠️ Familjer med många publicerade sidor ger krockar (2026-09-15)
  - ⚠️ Deras EAN är äkta — men den är INTE vår att publicera (2026-09-14)
  - ✅ Aosom svarade: leveransen är WHITE LABEL — vi är varumärkesägaren (2026-09-15)
  - ☠️ Google Shopping: `brand` och `mpn` krockar med två husregler (2026-09-15)
  - `feed-info`: vad finns EGENTLIGEN i Aosoms feed
- `18-google-shopping.md`: Google Shopping: huvudfeed i butiksrepot, TILLÄGGSFEED här (2026-09-15)
  - Fyra egenskaper som inte ska tas bort
- `19-prisjakt.md`: Prisjakt: artikelnummer och märke till butikens hemliga flöde (2026-10-28)
- `20-aosom-recensioner.md`: Aosom-recensioner: hämtas i webbläsaren, läses in via rutt (2026-09-16)
- `21-recensioner-fore-2021.md`: Recensioner daterade före 2021 visas inte (2026-09-23)
- `22-aliexpress-kon-toms.md`: AliExpress-kön töms: väntande AliExpress-recensioner döljs (2026-10-06)
- `23-kundomdomen-initialer-fran-ordern.md`: Kundomdömen utan namn får initialer från ordern (2026-10-18)
- `24-initialerna.md`: ☠️ Initialerna: aldrig Q, W, X, Y, Z och aldrig bokstavsordning (2026-10-30)
  - Inga två recensioner på samma produkt med samma initialer (2026-10-30)
- `25-recensionernas-svenska.md`: Recensionernas svenska ska låta som en kund, inte som en AI (2026-09-24)
- `26-recensionerna-poleras-med-produkten.md`: Recensionerna poleras med produkten (2026-10-30)
- `27-kategorilistan-kapades-vid-100.md`: ☠️ Butikens kategorilista kapades vid 100 (2026-09-24)
- `28-kategorisidans-adress.md`: ☠️ Kategorisidans adress räknas ur NAMNET, och é blev bindestreck (2026-09-24)
- `29-sidovagnarna-1200-nyaste.md`: ☠️ Butikens sidovagnar läste bara de 1 200 nyaste produkterna (2026-09-24)
- `30-menyns-underkategorier.md`: ☠️ Menyns underkategorier syntes inte för Google (2026-09-24)
- `31-langsvansen.md`: Långsvansen bärs av smala kategorier, inte av produktsidor (2026-09-24)
- `32-domanens-lankar.md`: ☠️ Domänen saknar riktiga länkar — det är bromsen nu (2026-09-24)
- `33-slutsalda-sidor-med-trafik.md`: Slutsålda sidor med trafik: omdirigera bara det som är borta för gott (2026-10-18)
- `34-restock-bevakarna.md`: Restock-bevakarna (`/admin/restock-list`, 2026-09-30)
  - Restock-mejlet (2026-09-30)
- `35-dubblettsparr-vid-import.md`: Dubblett-spärr vid import
- `36-varianter-delat-inkopspris.md`: Varianter får inte dela inköpspris utan täckning
  - Så körs reparationen
- `37-lagerlandet.md`: Lagerlandet är en del av SKU:n — och lagret tar slut per land
  - Två landslistor, och de svarar på olika frågor
- `38-dod-listning.md`: En död listning FELAR INTE — den svarar 200 med fruset lager
  - Var hyllstatusen gatas (audit 2026-08-24)
  - ☠️ Token-förnyelsen hoppade över i 30 dygn och lät token dö (2026-08-29)
  - Vid felsökning: kolla i den här ordningen
  - Strikes räknas per NÅDD produkt — inte per körning
  - Ett tyst dry-run är det farligaste läget
  - ☠️ Synken låg nere i 57 timmar och ingenting sa till (2026-08-28)
  - AliExpress-synken är avstängd med flit (2026-09-15, Leonard 2026-10-29)
- `39-orderpipelinen.md`: ☠️ Orderpipelinen hade EN väg in, och inget nät under (2026-08-31)
  - `/api/cron/order-backfill` är nätet (`lib/orders/backfill.ts`)
  - Larmet går via mejl, för det är den enda kanal som fungerar
  - En manuellt lagd AliExpress-order är osynlig tills numret kopplas (2026-09-01)
  - Faktura och kvitto: våra egna, inte Wix (2026-10-09)
  - Den gamla GitHub-värmaren är borttagen (2026-10-31)
  - Spårningen hämtas av Vercels cron, inte av GitHub (2026-10-29)
  - Aosom-ordern har ingen automatik alls — den läggs OCH skeppas för hand
  - ☠️ Ett fullt CMS gör importen till en dubblettfabrik
- `40-flytten-tillbaka-till-wix.md`: Flytten tillbaka till Wix CMS (Elite, 2026-10-29)
- `41-drift-datan-i-postgres.md`: ☠️ Drift-datan bor i Postgres sedan 2026-08-31 — inte i Wix Data
  - Var datan bor nu
  - Fem egenskaper som inte ska tas bort
  - Kopiering och verifiering körs från GitHub Actions
  - ☠️ Verifieringen fällde en halvtimme efter växlingen — och hade rätt fel
  - Wix-raderna är raderade sedan 2026-09-01 — taket är frigjort
  - ☠️ Raderingen bröt SEO-poleringen — på fem ställen, inte ett
  - ☠️ Och två fällor till i samma block (2026-09-02)
  - Så såg resonemanget ut innan raderingen
  - ☠️ Och den bröt kundens spårningssida — en läsare auditen inte kunde se
- `42-fyndauktionen-i-postgres.md`: Fyndauktionen flyttar till Postgres (`AUCTIONS_BACKEND`, 2026-09-29)
- `43-recensioner-fran-aliexpress.md`: Recensioner: hämtas server-side från AliExpress, översätts i chatten
  - Vad som faktiskt gallrar — mätt 2026-08-25
  - Så körs den
  - Bilderna flyttas hem — men vid olika tillfällen i de två vägarna
  - Betygen skickas INTE till Google
  - Översättningen görs i chatten — DeepL är borttaget (2026-08-19)
  - Recensionerna är UTE ur Wix — hela migreringen klar (2026-09-04)
  - ☠️ Och en SKRIVARE som skulle blivit föräldralös (2026-09-02)
  - ☠️ Auditen före raderingen: tre scripts, och grinden var blind för dem
  - Den spärr som faktiskt skyddade raderingen
  - Historik: så såg ordningen ut
  - Rätta en enskild recension: dölj, ta bort bara fotot, visa igen (2026-10-29)
- `44-mediainventering.md`: Mediainventering: "utan katalogreferens" är inte "oanvänd"
