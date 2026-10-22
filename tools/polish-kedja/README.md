# Poleringskedjans skript (ögonblicksbild 2026-10-21)

Skripten som kördes för rundorna N181–N293 och T21–T81 (PR #749). De skrevs i en
chattsession och bodde i dess scratchpad, och en ny container hade inte haft dem.
Här ligger de som de kördes, så att nästa session inte börjar om. Ingenting här körs
av Vercel eller av en workflow; allt är hjälpmedel för den som polerar från chatten.
Reglerna för själva polerandet står i `docs/seo-polish-runbook.md` och
`tools/polish-gates/FLAGGADE.md`.

## Läs först

- **Sökvägarna är sessionens.** `SP` (och i vissa filer `ROT`) pekar på scratchpaden
  och repots plats i containern. Ändra dem till din arbetskatalog innan något körs.
  Det är medvetet inte ändrat här, eftersom skripten är sparade som de kördes.
- **Källdata per produkt** ligger som JSON i `t15/data/<id8>.json` och registret i
  `n100/data.json` i arbetskatalogen. De hämtas ur Wix med GET produkt
  (`fields=PLAIN_DESCRIPTION`, `MEDIA_ITEMS_INFO`, `VARIANT_OPTION_CHOICE_NAMES`) och
  `inventory-items/query`. Formen syns i `kalla.py` och `refresh_reg.py`: `fullid`,
  `name`, `slug`, `visible`, `revision`, `html`, `items` (id och alt), `variants` (sku,
  id, pris, vis, lager, ch) och `options`.
- **Inga nycklar i repot.** `kor_lankar.py` behöver ett nyckelpar bredvid sig, som
  skapas lokalt och aldrig committas:
  `openssl genrsa -out privat.pem 3072`, `openssl rsa -in privat.pem -pubout -out publik.pem`,
  `base64 -w0 publik.pem > publik.b64`. Utfilen har artikelnummer. Den skrivs inte ut
  och committas aldrig.
- **Allt skrivande till Wix går via workflowerna** (`polish-write.yml`, `polish-bilder.yml`,
  `aosom-sammanslagning.yml`, `redirect-add.yml`). `ExecuteWixAPI` används bara för läsning,
  slugkontroll och återläsning.
- `gh api` är Claude Codes inbyggda GitHub-klient. `ghw.py` startar workflowerna med den.

## Ordningen för en runda

**Ny sida ur ett dolt utkast (N-runda)**

1. Kandidater: `pool_dolda.js` (läsning, alla dolda produkter med saldo; sätt `FRAN` för
   bara de nya efter nattens import 04:40 UTC).
2. Förkontroll av varje kandidat: hela katalogsvepet (`../polish-gates/dubblettsvep-bevis.js`),
   mappningen (`las.py` eller `las_full.py` via `polish-mapping.yml`, läget `las`: en
   Aosom-rad med artikelnummer, inte pensionerad) och vid tvekan `kor_lankar.py`. Saldot ska
   vara över noll.
3. Underlag: `refresh_reg.py <id8>...`, `mkenheter.py` (spec till enheter), `bygg_enhet.py`
   (arbetskatalog per enhet, kontaktark och originalbilder), `hornark-ark.py` (hörn för
   logotyper), `kalla.py` och `mkrad.py` (källtext och bildrader). Titta på bilderna före texten.
4. Texten skrivs i `mall-n/v1.py` (en funktion `bygg(KAT)` som ger en post per sida).
   `mall-n/n258lib.py` skriver enhetens filer och kör `hasha.py` och `bygg-skrivplan.py`,
   och den senare kör grindkedjan och bygger skrivplanen. `enheter_nXXX.py` och
   `samla_nXXX.py --bygg` sätter ihop rundans rotfiler. Kopiera föregående rundas filer
   och byt rundnummer och rundkatalog.
5. Grindar: `leak.py <rundkatalog>` ska ge `TRÄFFAR 0`, `nyaord.py <rundkatalog>` listar
   ord som aldrig förekommit i en tidigare runda, och slugarna kontrolleras mot Wix.
6. `commit_push.sh "<meddelande>" <runda>` committar rundans rotfiler och pushar grenen
   (planen och korten måste ligga i grenen innan workflowen läser dem).
7. Kedjan (`mall-n/kor_n258.sh`): vänta ut Aosom-fönstret (timmar delbara med tre,
   minut 15–29), sedan `ghw.py write <runda> <plan-sha256> torr,skriv`.
8. Återläsning: `mkaterlas2.py` (bygger `bygg_aterlas.py`s ExecuteWixAPI-kod; `mkaterlas3.py`
   lägger dessutom till optionerna och varianternas val för sidor som slagits ihop) och live:
   `../polish-gates/hamta-live.sh 130` följt av `livegrind.py` och `livekoll.py`
   (`mall-n/live_n258.sh`). Svaret över 100 000 tecken sparas av verktyget i en fil som
   är avkortad vid 100 000 tecken: koden fyller ut med ett `pad` på 101 000 tecken, och
   `visa_aterlas.py` läser fram till `,"pad"`.

**Snabbvägen sedan 2026-10-21 (`mall-rund/`, N283 och framåt)**

☠️ **Före bygget:** kontrollera att utkastet inte redan har en runda. `grep -l "^<id>" tools/polish-assets/runda-*/ids.tsv` och en färsk läsning av produkten (revision över 3 eller `visible: true` betyder att den är skriven). N291 byggdes om för en sida som N283 hade skrivit tre timmar tidigare, och den andra skrivningen bytte adress (lärdom 39).

`mkrunda.py <prefix> <rundnamn> <spec.json>` bygger hela arbetskatalogen ur en kompakt spec
(`{"enheter": [{"huvud": id8, "syskon": [{"id8", "varde"}], "axel", "huvudvarde", "kategori", "noter", "publicerad"}]}`,
se `mall-rund/exempel/spec_t78.json`). Den läser saldo och pris ur `t15/data`, skriver
`<prefix>lib.py`, `enheter_<prefix>.py`, `samla_<prefix>.py` och `bygg_givare_<prefix>.py` ur
mallarna `rundlib.py`, `enheter_P.py`, `samla_P.py` och `bygg_givare_P.py`, och kör
`bygg_enhet.py` (kontaktark och originalbilder). Kör den med `/usr/bin/python3` (PIL).
Rundnamnet får vara högst 60 tecken, och givarrundan blir `<rundnamn>-givare-alt` eller
`runda-<prefix>-givare-alt` när namnet blir för långt.

1. Skriv `v1_<prefix>.py` (en funktion `bygg(KAT)`, en post per sida). Exemplen i
   `mall-rund/exempel/`: `v1_n288_ny_sida_med_utsnitt.py` (en ny sida med ett utsnitt av en
   måttbild), `v1_t78_farg_och_storlek_pa_varden.py` (värdtext med riktade ersättningar och
   givarens bilder och alt-texter, med färg OCH storlek) och
   `v1_n287_storlek_och_farg_med_givare.py` (fem sidor med givare och utsnitt).
2. `enheter_<prefix>.py` kör grindarna per enhet, `samla_<prefix>.py --bygg` bygger rundans
   `skrivplan.json` och `bygg_givare_<prefix>.py` givarnas `bildplan.json`. Skriv ut båda
   sha256-summorna: ändras en fil efter bygget ändras summan, och kedjan måste få den senaste.
3. `leak.py` och `nyaord.py` med sökvägen `tools/polish-assets/<runda>`, sedan
   `commit_push.sh`.
4. Förkontrollen av sammanslagningar: `forplan.sh`-mönstret (`aosom-sammanslagning.yml
   mode=plan`) mot färska Wix-sidor, och en genomgång av BÅDA sidornas bilder sida vid sida.
   Ett färgsyskon avgörs på bilderna, inte på måtten (lärdom 40).
5. Kedjan: `mall-rund/exempel/kor_t78.sh` (värdskrivning, omdirigering, givarbilder, sammanslagning)
   eller `kor_n288.sh`-mönstret för en ny sida (bara `ghw.py write`).
6. Återläsning: `mkkompakt.py <rundkatalog> <ut.js> [givar-id8=fullt-id ...]` skriver
   ExecuteWixAPI-koden (facit per sida, options, varianternas val, kompakt SEO och givarnas
   synlighet) som ska ge `N av N LIKA`. Live: `live_rund.sh <runda> <loggkatalog>` (kör
   `hamta-live.sh`, `livegrind.py` och `livekoll.py` i bakgrunden, 6–9 minuter).
7. Kompletteringskontroll före slutrapporten: kör `pool_dolda.js` utan `FRAN`, och jämför
   id8-listan mot id:n i rundornas `ids.tsv`, `kallor.json`, `*.tsv`, `docs/` och
   `FLAGGADE.md`. Det som ingen nämner läses ur Wix och mappningen (`las_ids.py`):
   2026-10-21 var 15 av 748 onämnda, 13 av dem redan pensionerade och två hundkojor
   kvar i kön (N289).

**Tvillingkontroll och utsnitt (N262–N264)**

- Innan ett utkast som hållits som "möjlig dubblett" byggs: jämför det mot publicerade
  sidor med `bildtvilling.py` (dHash) och `ark_tvilling.py` (kontaktark), läs de
  publicerade sidornas mått ur live-HTML, och läs `las` (`las_enkel.py`). Ett utkast
  som redan är pensionerat (`rejected`) byggs inte.
- Titta på bilderna före texten. Feedens position 4–7 och 10 hämtas med
  `kor_bildkandidater.py` (position 10 är oftast ren). Rubriker och bildtexter skärs
  bort med Wix beskärnings-URL (`…/v1/crop/x_,y_,w_,h_,q_95/<namn>.jpg`): mät gränsen
  i pixlar på ett band med linjal, förhandsgranska med `kropp.py` (butikens kvadrat ur
  mitten ritas in), ladda upp alla utsnitt i ETT `UploadImageToWixSite`-anrop och para
  varje uppladdad fil mot sitt utsnitt med md5 (svaret säger inte vilket id som hör
  till vilken adress). `mall-n/enheter_n262.py` byter fil-id för de beskurna
  positionerna i enhetens `bilder.tsv` (samma etikett, ny fil), och `extra_bilder`
  lägger bara till etiketter som saknas (feedens position 10). Utsnitten ligger
  oanvända i Media Manager tills kedjan skrivit dem, och nattens bildstädning
  (03:50 UTC) tar dem om de inte sitter på en produkt före dess.
- Strider måttbilden mot källans mått stryks bilden (`bilder-bort.tsv` med skäl utan
  namn) och sidan skriver källans mått.
- Slug och SKU får inte bära `3x3` (siffra-bokstav-siffra) eller `x3-oxford`
  (tre tecken med siffra, bindestreck, minst tre tecken): skriv `3-x-3-m`.

**Färg eller storlek på en publicerad sida (T-runda)**

1. Samma förkontroll. Värden ska vara en Aosom-sida med artikelnummer (en AliExpress-rad
   vägras med `behall_ej_aosom`), och färgen ska inte redan finnas på värden.
2. `mall-t/v1.py` bygger värdens nya text med riktade ersättningar, och `mall-t/kor_t54.sh`
   är kedjan: värdens skrivplan (`ghw.py write`), omdirigering vid ny adress
   (`kor_wf.py redirect-add.yml <ref> from_slug=... to_path=...`), givarens bilder
   (`ghw.py bilder`) och sammanslagningen (`ghw.py merge mall-t/merge_t54.json`).
3. Återläsning och live som ovan.
4. En värd som redan är sammanslagen (`sammanslagen` i `sammanslagna.tsv`) skrivs med
   `html_raw` och riktade ersättningar, och alt-texter med löpnummer skrivs om med ord
   (`live_alt`). Givarens bilder får svenska alt-texter före sammanslagningen
   (`mall-t/bygg_givare_t72.py` bygger bildplanen, `mall-t/kor_t72.sh` är kedjan med
   värdens skrivplan, givarbilderna och sammanslagningen). Kör `forplan.sh` först:
   planläget fångar galleritak och felaktiga axlar innan något skrivits.

`polish-write` och `polish-bilder` delar concurrency-grupp och körs i följd. Starta aldrig två
körningar av samma workflowfil samtidigt.

## Filerna

| fil | gör |
| :-- | :-- |
| `ghw.py` | startar och väntar ut `polish-write`, `polish-bilder`, `aosom-sammanslagning` och valfri workflow |
| `kor_wf.py` | en workflow med inputs som `nyckel=värde`, svar som JSON |
| `kor_lankar.py` | `leverantorslankar.yml` med krypterat svar; artikelnumren öppnas bara lokalt |
| `las.py`, `las_full.py` | läser en mappningsrad via `polish-mapping.yml` (läget `las`) |
| `pool_dolda.js` | dolda produkter med saldo (läsning) |
| `refresh_reg.py`, `mkenheter.py`, `bygg_enhet.py` | register, enheter och arbetskataloger |
| `hornark-ark.py`, `mkrad.py`, `kalla.py` | hörnark, bildrader och källtext för granskning |
| `leak.py`, `nyaord.py` | läckagegrind (leverantörsord och artikelnummerform) och stavningskoll |
| `bygg_aterlas.py`, `mkaterlas2.py` | återläsningskoden för ExecuteWixAPI |
| `commit_push.sh` | committar rundans rotfiler och pushar med omförsök |
| `las_enkel.py`, `las_ids.py` | `las` för flera id8 på en gång (fyra åt gången), full id ur `t15/data` eller `sweep/full_ids_1016.json` |
| `bildtvilling.py`, `ark_tvilling.py`, `dhash_jamfor.py` | dHash-jämförelse och kontaktark mellan ett utkasts bilder och publicerade sidors bilder (läses ur live-HTML) |
| `kor_bildkandidater.py` | laddar upp feedens positioner till Media Manager (`aosom-bildkandidater.yml`) och skriver ut fil-id |
| `kropp.py` | förhandsgranskar ett utsnitt med butikens kvadrat ur mitten inritad |
| `ark_ids.py` | kontaktark för en lista id8 |
| `kolla308.py` | kontrollerar att gamla adresser svarar 308 till rätt mål |
| `forplan.sh` | `aosom-sammanslagning.yml` i planläge för alla rader före kedjan |
| `bygg_t62.py` | bygger bildplanen för svenska alt-texter på sammanslagna bilder |
| `pens_plan.py` | planen för pensionerade utkast (`pensionerade-radera.yml`, läget `plan`) med färska antal |
| `kor_logg.py` | kör en workflow, väntar ut den och sparar jobbloggen i en fil (till exempel `pensionerade-radera.yml` med `bekrafta` och `per`) |
| `mkaterlas3.py`, `visa_aterlas.py` | återläsningskoden med optioner och varianternas val (efter sammanslagningar), och en läsare som skriver en kompakt sammanfattning av det sparade svaret (fram till `,"pad"`, `--alt` visar alt-texterna) |
| `mall-n/` | N258 som mall för en ny sida, och N262 (`*_n262.*`) som mall för en runda med utsnitt av bilder |
| `mall-rund/` | `mkrunda.py` och dess mallar (`rundlib.py`, `enheter_P.py`, `samla_P.py`, `bygg_givare_P.py`) och `exempel/` med T78, N287 och N288 som förlagor, T89 (fem hållna värdar med givare, riktade ersättningar och en givare med tysk säljgrafik som får feedens position 10) och T90 (en värd utan optioner, där givarens måttbild lämnas) |
| `mkkompakt.py` | återläsningskoden med options, varianternas val, kompakt SEO och givarnas synlighet, ur rundkatalogen |
| `live_rund.sh` | ISR-medveten livehämtning, `livegrind.py` och `livekoll.py` för en runda i bakgrunden |
| `mall-t/` | T54 som mall för ett färg- eller storleksval på en publicerad sida, T65 (`*_t65.*`) för en värdtext byggd med riktade ersättningar, och T72 (`*_t72.*`) för en redan sammanslagen värd med givarens alt-texter |

`hornark-ark.py` klipper bara de två nedre hörnen ur varje bild. `../polish-gates/hornark.py` tar
alla fyra hörnen högpassfiltrerade.

`las.py` och `las_full.py` slår upp Wix-id:t ur `sweep/full_ids_1016.json` (en karta från id8 till
fullständigt id som byggs ur ett katalogsvep) och faller annars tillbaka på det som anges, som
då måste vara ett fullständigt id.
