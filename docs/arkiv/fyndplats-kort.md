# Arkiv: Fyndplats-kort (egna svenska feature- och spec-kort)

Arkiverad 2026-10-27 på Leonards besked: *"I seo polering guiden du följer står det att man
ska göra sån där fyndplatskort bilder? Om det gör det, ta bort det vi slutar med det"*.
Guiden sa det: `docs/polish/bildmetoder.md` hade ett helt avsnitt om kortbygge,
`docs/polish/varianter.md` en komplett kortpipeline, `docs/agent-handoff.md` ett steg 3d, och
runbooken lät ett färgkort byggas och ett kort per variant som undantag. Texterna nedan är
flyttade ordagrant ur de filerna och ur `CLAUDE.md`, och är historik, inte instruktion.

**Vi bygger inga Fyndplats-kort längre.** Inte spec-kort, feature-kort, färgkort, detaljkort
ur sidans egna foton eller kort per storlek, och inte heller som undantag när leverantören
saknar en måttbild eller originalet bär en logotyp (undantaget från 2026-10-24 är borta).
Det som gäller i stället:

- En bild väljs bland leverantörens egna bilder och används som den är. Bär den text,
  en logotyp, ett märke som är motivet eller fel färg stryks den. Har sidan färre än fem
  bilder får en bild beskäras enligt runbookens undantag (`polish/bildmetoder.md`,
  *Beskärning*).
- Saknas en bild för en variant, eller går den inte att använda, byggs inget kort. Ett
  färgval utan foto rättas enligt runbooken (tas bort på en publicerad sida, flaggas i
  `FLAGGADE.md` på en dold), och en storlek eller ett utförande utan egen måttbild flaggas
  till Leonard.
- Koden finns kvar tills Leonard beslutar om borttagning: `scripts/cardkit.py` (där
  `hero_white`, `crop` och `grid_overlay` fortfarande hör till hjältebildens metoder, medan
  kortfunktionerna `card_photo`, `card_grid`, `card_spec` och `card_swatch` inte används),
  `tools/polish-gates/bygg-kort.py`, `gate-kort.py`, `komponera-hjalte.py`,
  `bygg-storlekskort.py`, `skriv-storlekskort.js` och i `tools/polish-assets/` `kortbygge.py`,
  `kortkvitto.py`, `kortrunda.py` och `kortsvep.py`.
- De kort som redan ligger på publicerade sidor ligger kvar tills Leonard bestämt om de
  ska tas bort (`tools/polish-gates/FLAGGADE.md`, lärdom 230). Rundornas egna
  `README`-filer och loggarna i `CLAUDE.md` och `FLAGGADE.md` som beskriver kort som byggdes
  är historik och ändras inte.
- Ordet `kort` i runbooken betyder oftast produkt-id:ts första åtta tecken (`kort ⇥ position
  ⇥ text`), inte ett Fyndplats-kort.

---

**Ur `docs/polish/bildmetoder.md`, avsnittet *Kortbygge (K)* i sin helhet (tidigare rad 476–596):**

## Kortbygge (K) – egna svenska feature- och spec-kort

### Egna feature-kort (när leverantörens feature-slides är mörka AliExpress-collage)

Vissa produkter (särskilt verktyg/elektronik) har feature-bilder som är **mörka collage/infografik/i-bruk-foton** — inte enskilda produktbilder. De går alltså inte att vitmåla (H-metoderna) och textborttagning (T-metoderna) lämnar dem fortfarande "AliExpress-iga". Då kan du **bygga egna rena, svenska feature-kort** på ljus bakgrund av de RIKTIGA produktfotona — hela katalogen ser då ut som ett eget varumärke. Verifierat på CNC-fräsen (2026-07-08): 5 mörka slides → 5 rena kort, **plus 2 engelska spec-blad → 2 svenska spec-kort** (maskinen urklippt + svensk spec-lista).

> ⚠️ **Position 0 = ren VIT produkt-hjälte, även med eget kort-galleri.** Bygg gärna feature-/spec-KORT för plats 1→N, men produktkortets bild (`media.main` = plats 0) ska vara en **ren vit studio-hjälte** (H-metoderna) — INTE ett kort och INTE en kontext-/livsstilsbild på grå/rörig bakgrund. Har du bara monterade/röriga foton: kör Steg 3c Metod A (Wix Generate Image) på det renaste produktfotot → vit bakgrund. (Lärdom: pakethållarväskan `9e79abae` fick först en rack-livsstilsbild som hjälte i stället för vit — flaggat av Leonard, rättat 2026-07-09; livsstilsbilden flyttades till plats 1 som kontext.)
>
> **Tredje felläget: hjälten är en NÄRBILD.** Vit bakgrund räcker inte — hjälten måste visa HELA varan. Musikbordet `67b738c7` hade en 1780×960-detaljbild som plats 0: benen bortklippta, vindspelet kapat i vänsterkant, tvåtonsblocket i högerkant. Wix beskär dessutom till kvadrat i produktkortet, så en bred bild zoomas in ytterligare. **Mät hjälten:** är den inte ungefär kvadratisk, eller rör varan bildkanten, är den fel. Måttskissen är ofta enda hela studiofotot i galleriet — måttpilarna är overlay och tas bort enligt Steg 3b.
>
> ⚠️ **Klassa overlay per KOMPONENT, inte per pixel, när varan har samma färg som overlayen.** Musikbordets måttpilar är orange — och bordet har orange fötter, orange xylofontangent och orange band på tvåtonsblocket. Ett pixelfilter på orange hade skalperat varan. Etikettera i stället sammanhängande komponenter och släng de vars MEDELFÄRG är overlayens platta vektorton (här (254,155,87) i var och en av 14 komponenter); varans orange sitter inbäddat i den stora produktkomponenten och kan då aldrig råka följa med. Utvidga overlay-masken några pixlar så antialias-brämen runt siffror och pilspetsar går med.
>
> ⚠️ **"Behåll största komponenten" är FEL på produkter med hängande delar.** Vindspelets rör hänger i vita snören som inte överlever bakgrundströskeln — rören blev tre egna komponenter à ~10 000 px och hade fallit bort. Behåll allt utom det du aktivt identifierat som overlay.

> 📐 **ALLA kortfoton ska ha PANELENS proportion — aldrig 1:1, aldrig portratt i en liggande panel.** Panelerna anvander `object-fit: cover`, sa ett foto med fel proportion **zoomas in** tills det tacker panelen: en staende bild i `card_photo` blir en extrem narbild av mitten. Uppmatt med en sond-rendering 2026-08-26 (1-radig h1 + 2-radig bildtext):
>
> | Kort | Panel | Proportion |
> |---|---|---|
> | `card_photo` | 1416 × 1005 | **1,41** |
> | `card_spec` (8 rader) | 1416 × 776 | **1,83** |
> | `card_grid` rows=2, 4 paneler | 695 × 489 | **1,42** |
> | `card_grid` rows=1, 2 paneler | 695 × 1005 | **0,69** |
> | `card_grid` rows=1, 3 paneler | 455 × 1005 | **0,45** |
> | `card_grid` rows=1, 4 paneler | 334 × 1005 | **0,33** |
>
> Anvand `cardkit.fit_pane(src, dst, "photo"|"spec"|"grid2x2"|…)` som beskar kallan till ratt proportion innan den matas in — den skalar aldrig upp och lagger aldrig till vit yta. Racker inte kallan till (ett smalt staende motiv i en liggande panel) ar `fit=True` ratt val i stallet: den letterboxar men zoomar aldrig. *(Leonards rapport 2026-08-26: "bilderna ska inte vara for inzoomade".)*
>
> 📐 **`card_spec`-fotot: samma sak, aldrig 1:1.** Panelen renderas med `object-fit: contain`, så ett kvadratiskt foto skalas efter höjden och krymper. Lasertag-setets kort matades med den kvadratiska hjältebilden, där pistolerna upptar 88 % av bredden men bara 31 % av höjden — resultatet blev att de fyllde **51,6 %** av panelen och såg små ut. Inget fel på kortmotorn, felet låg i indata. Beskär fotot till panelens proportion först: samma bild fyllde då **87,5 %** (1 398 → 2 373 px). Mät före och efter i stället för att titta — skillnaden är lätt att underskatta i miniatyr.

> 📐 **Andra orsaken till samma symtom: KÄLLBILDENS egna vita marginaler.** Proportionsregeln ovan räcker inte. `contain` respekterar allt som ligger i filen — även tom vit yta runt varan — så marginalerna adderas i stället för att beskäras bort. Naturehikes vandringsstavar och dunsovsäck (2026-08-26) hade variantkort där produkten upptog **31–38 %** av kortets bredd och dessutom satt ur centrum (stavarna x 888–1466 i en 2000 px-ruta). Leverantörsfotot var korrekt placerat i panelen; fotot hade bara en tom halva.
>
> **Beskär alltid källbilden till varans egen bbox innan den matas in i kortet:**
>
> ```python
> ejv = np.asarray(im).mean(2) < 242
> ys, xs = np.where(ejv)
> im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
> ```
>
> **Mät `tackning` (andelen ejvita pixlar), inte bbox.** Bbox:en på de här korten spände 88 % av bredden och såg därför frisk ut — men det var etikettremsans text som spände, inte varan. Täckningen var **2 %** för stavarna och 5–7 % för sovsäcken. Bbox ljuger så fort kortet har en textremsa.

> 🔧 **Behöver bara fotorutan lagas: rör inte resten av kortet.** Ett färdigt kort går att laga i efterhand utan att sättas om — vitmåla fotorutan (för korten ovan `y 0–1613`, linjalen börjar på 1614), klistra tillbaka varan förstorad och centrerad, och låt etikettremsa och sidfot stå kvar **pixelidentiska**. Spärren är ett rent likhetstest: `assert np.array_equal(b[1614:], fore)`. Att sätta om texterna vore att riskera en felskriven siffra för ingenting.
>
> **Förstoringen syns inte om du räknar på visningsstorleken.** Varan var 550–750 px i källan och förstorades ~1,9×. PDP:n visar kortet i 1080 px, så varan hamnar på ~700 px på skärmen — alltså under sin egen källupplösning, och LANCZOS-förstoringen blir osynlig. Räkna alltid det steget innan du dömer ut en förstoring som för stor.

> 🔢 **Rätta en SIFFRA på ett publicerat kort: sätt om raden pixelexakt, bygg inte om kortet.**
> Mongar-tältet (2026-08-26) uppgav 210T till 2,2 kg på två kort. Byggskriptet för
> variantkorten fanns inte kvar, och att sätta om kortet hade gjort det olikt sina fyra
> syskonkort som inte skulle ändras. I stället renderas bara textraden om, och att den
> matchar **bevisas innan bytet**:
>
> 1. Mät i originalet: bläckets bbox och färgen. Färgen pekade direkt på `cardkit.MUTED`
>    (#5A564F), vilket band kortet till kortmotorns palett.
> 2. Sök storlek/vikt/teckenmellanrum genom att rendera kandidater och jämföra bbox.
>    36 px / 400 / 0 gav 875×69 — exakt originalets mått.
> 3. Sök **subpixelfasen**: samma rad renderad med `padding-left` i steg om 0,1 px.
>    Vid 40,2 px blev max-diff mot originalet **0**. Först då är fonten, storleken,
>    vikten, färgen, kantutjämningen OCH fasen bevisade — inte antagna.
> 4. Rendera den NYA raden med exakt samma inställningar och klistra in den.
>
> `assert np.array_equal(gammal_rendering, originalrutan)` är hela spärren: reproducerar
> du inte den gamla raden pixelexakt vet du inte heller att den nya blir rätt.
>
> **Raden är oftast högerställd — passa in HÖGERKANTEN, inte vänsterkanten.** En 4:a är
> ett par pixlar bredare än en 2:a i Inter, så vänsterjustering hade skjutit ut raden
> över kortets högermarginal. Kontrollera också att inklistringsrutan är helvit utanför
> texten innan du skriver över den (`ruta[0].min() == 255` på alla fyra kanter).

> ✂️ **Paneler urklippta ur ett FÄRDIGT kort bär med sig den inbrända etiketten.**
> Samma jobb: för att bildbehandlingen skulle bli identisk klipptes de tre tältfotona ur
> det publicerade kortet i stället för att letas upp på nytt. Men `card_grid` ritar en NY
> etikett ovanpå, och panelen `cover`-skalas ~1,13× först — den gamla etiketten hamnade
> därför något större och stack ut under den nya. Dubbla etiketter, tydligt i jämförelsen.
>
> Tvätta bort den gamla etiketten först, och låt bilden själv bevisa att det är säkert:
> mellan varans nedersta pixel och etikettextens översta rad ligger ett **helvitt band**.
> Hittar du bandet kan ingen produktpixel finnas under det — allt därunder är pill, skugga
> eller text. Mät fram bandet, gissa det aldrig:
>
> ```python
> rm = a[:, :xmax].min(2).min(1)
> y = h - 1
> while rm[y] < 225: y -= 1        # etikettexten (tröskeln måste tåla kantutjämning)
> txt = y + 1
> while y >= 0 and rm[y] >= 225: y -= 1
> y0 = y + 1                       # bandets topp — allt härunder får vitas
> assert txt - y0 >= 20, 'för smalt vitt band'
> ```
>
> Etikettens **skugga** sträcker sig en bit ovanför pillen och ligger då delvis över varan.
> Vita där bara pixlar som redan är bakgrund (`min > 200`) — resten är produkt.

### Detaljkort ur sidans egna foton (`paneler.tsv`, 2026-10-22)

När leverantörens övriga bilder inte går att få (gokartarna: artikeln saknades i flödet
och importens filer var städade) går ett kort att bygga av utsnitt ur sidans egen
huvudbild. `bygg-kort.py` gör ett rutnät (`card_grid`) av ett kort som står i
`paneler.tsv`, och kortets rader i `kort.tsv` blir panelernas etiketter, i samma ordning.
Texten grindas alltså av `gate-kort.py` som spec-korten. Exempel:
`tools/polish-assets/runda-bilder-gokart-kort/` (`utsnitt.tsv` bär utsnitten).

- **Utsnittet ska ha panelens proportion** (`cardkit.PANEL`, `grid2x2` = 695/489 för fyra
  paneler), annars zoomar `cover` in.
- **Etiketten täcker panelens nedre vänstra hörn.** Det etiketten påstår ska synas
  ovanför den: gokartarnas bälte låg först under etiketten, och utsnittet fick flyttas.
- Etiketten säger bara det sidans text säger om delen (ratten har tuta och musik,
  bakhjulet är Ø 28 cm).


### Ett kort per storlek på en sida med två val (2026-10-23)

En måttbild som visar EN färg i EN storlek går inte att visa rätt på en sida med färg × storlek. Butikens vy är unionen av bilder utan ägare och bilder som ägs av de valda valen, så bilden visas under varje färg i
storleken eller varje storlek i färgen. Det som går är ett **färgneutralt kort per storlek**, länkat till storleken (`bygg-agare.py`), med hela varan i hjältebilden och sidans egna tal i tabellen.

- **Hjältebilden** av flera färger byggs med `tools/polish-gates/komponera-hjalte.py <ut.jpg> <rader> <bild…>` (`2,2` är två rader med två packshots, `--fyll` och `--trosk` styr storlek och vitrensning). Packshotsen ska ha
  vit bakgrund, och skriptet avbryter hellre än gissar när en ruta saknar vara. Resultatet läggs i rundans `orig/<kort>.jpg` (checkas aldrig in) och byggs med `bygg-kort.py` i läget `foto`, med panelens proportion enligt tabellen ovan.
- **Raderna** i `kort.tsv` hämtar talen ur sidans egen text (`kallor-tal.json`), enheterna skrivs som `&nbsp;<span class=u>cm</span>`, och `gate-kort.py` fäller på ett tal sidan inte bär och på en saknad eller felaktig
  alt-text (`kortalt.tsv`). Skriver sidan flera storlekars värden på samma rad kvitteras raden i `kort-avvik.txt`, med skäl.
- **Vidare:** `galleri-tillagg.js` (galleriet), `bygg-agare.py` (ägare), `bilder-bort.yml` (de gamla måttbilderna), `variantbild-farg.js` (varukorgens bild) och live-kontroll. Ordningen och skälen står i CLAUDE.md,
  *Leonards svar på de sex frågorna*.
- Ett kort för EN storlek visar bara den storleken. Ett kort som listar alla storlekar ska vara gemensamt, alltså olänkat.

---

**Ur `docs/polish/bildmetoder.md`, metodprefixen (tidigare rad 12–12):**

> **Metodprefix:** `B` = beskärning, `T-` = textborttagning, `H-` = hjältebild, `K-` = kortbygge.

---

**Ur `docs/polish/bildmetoder.md`, hjältemetod L, lärdomen om korten (tidigare rad 398–400):**

> 🔁 **Leta efter samma fel i KORTEN.** Spec-kortet för paviljongen var byggt av exakt samma trasiga beskärning och bar därför samma svävande fragment. Har du hittat en defekt i en beskärning, sök igenom galleriets övriga bilder efter den innan du släpper produkten — den följer med överallt där samma urklipp återanvänts.

När kortets foto byggs om: fotorutan i `card_spec` har kvot 1,64 medan paviljongen är 1,36. **Fyll ut i SIDLED med vitt** i stället för att beskära — en beskärning hade kapat taket.

---

**Ur `docs/polish/bildmetoder.md`, hjältemetod M, samma lärdom (tidigare rad 418–418):**

Även här gällde regeln från Metod L: **spec-kortet var byggt av samma trasiga beskärning** och bar samma gula fragment. Ombyggt.

---

**Ur `docs/polish/bildmetoder.md`, inledningen till *Avancerad retusch* (tidigare rad 605–607):**

> Detta är **fördjupningen**. Vanliga fall klaras av T-metoderna (tvätta text/logga),
> 3c (vit hjälte) och 3d (bygg svenska kort). Läs hit när en bild har flera
> problemzoner samtidigt, eller när en zon ligger ovanpå strukturerad bakgrund.

---

**Ur `docs/polish/bildmetoder.md`, *Avancerad retusch*, signalen att en produkt är bildpolerad (tidigare rad 612–613):**

Signalen "produkten är bildpolerad" = galleriet innehåller **Fyndplats spec-/feature-kort**
(gräddvit `(250,248,243)` + orange logga).

---

**Ur `docs/polish/bildmetoder.md`, *Avancerad retusch*, verktyget (tidigare rad 615–616):**

**Arbetsgång per produkt.** Verktyget är **`scripts/cardkit.py`** (`hero_white` ·
`crop` · `grid_overlay` · `card_photo` · `card_grid` · `card_spec` · `render`).

---

**Ur `docs/polish/bildmetoder.md`, *Avancerad retusch*, steg 5 (tidigare rad 650–655):**

5. **Bygg Fyndplats-kort** (☠️ bara när originalet saknas eller inte går att använda: leverantörens
   egen måttbild går alltid före ett kort, Leonard 2026-10-24) med `scripts/cardkit.py`: `card_spec(out, foto, kicker,
   titel, [(nyckel, värde), …])` (produktbild + verifierat spec-rutnät, 6–10 rader)
   och `card_photo` / `card_grid` för feature-kort. **Alla siffror ska vara
   avlästa ur källbilder/beskrivning — aldrig gissade.** Vid flera varianter med olika
   mått: ett spec-kort per variant, länkat till respektive choice (Steg 11-reglerna).

---

**Ur `docs/polish/bildmetoder.md`, *Avancerad retusch*, sista stycket om en för liten källa (tidigare rad 690–690):**

> Först när tillverkaren också saknar bilder: bygg ett `card_spec` med det bästa som finns i panelen och verifierade mått i raderna. Ett kort där panelen visar ~490 px på skärmen bär en 197 px-källa förvånansvärt långt — men det är andrahandsvalet, inte förstahandsvalet.

---

**Ur `docs/polish/varianter.md`, kortpipelinen som stod efter *Döpa om variantalternativ* (tidigare rad 41–97):**

>
> **Gäller även engelska spec-blad:** samma metod bygger om leverantörens spec-blad (Item Model Number / Working Area / Input Voltage …) till rena **svenska spec-kort** (kicker "MODELL X", stor storleksrubrik + effekt-pill, 6-radigt spec-rutnät). Passa på att **rätta felaktig/vilseledande inbränd data**: t.ex. hade CNC-fräsens S4040-blad fel måttcallouts (kopierade från S3020) och båda bladen visade "110V 60Hz" (USA) fast produktens verkliga data är **AC 110/220 V, 50/60 Hz** (EU). Metriska enheter, inga tum/lbs.

**Pipeline (helt lokalt + gratis, ingen Wix-AI):**
1. **Klipp tillgångar** ur bilder som redan har **vit/ren bakgrund** (oftast hjältebilden): maskin, kontroller, spindel osv. Rektangulär beskärning räcker — vit bakgrund smälter sömlöst in i ett vitt kort (ingen urklippning behövs). Beskär SNÄVT så inga tillbehör/skuggor följer med. Foton från mörka källor (t.ex. en i-bruk-bild) presenteras som **rundad foto-banner** (rundade hörn + mjuk skugga) i stället för full-bleed — då krockar de inte med de ljusa korten. Sitter produkten på en **grå/färgad bakgrund med callouts** (typiskt spec-blad) → klipp ut den med **rembg** (`from rembg import remove`) och lägg på vit + mjuk skugga (samma kompositering som i H-metoderna). **Gotcha:** u2net väljer det MEST framträdande objektet — på ett spec-blad kan det bli den vita spec-boxen, inte maskinen. **Beskär först till maskin-regionen** (klipp bort spec-boxen) INNAN `remove()`, och behåll bara största alpha-komponenten (`scipy.ndimage.label`) så lösa callout-text-öar försvinner. Granska alltid med `Read`.
2. **Skriv korten som HTML/CSS** (1600×1600), bädda in fotona som base64 data-URI (self-contained). **Låst premium-mall (from 2026-07-09, `cardkit`-motorn):** typsnitt **Inter** (bädda in `@font-face` som base64-woff2 — Chromium saknar bra default-sans), **varm radial-gradient-bakgrund** i stället för platt vit (`radial-gradient(130% 105% at 50% 20%, #FFF 0%, #FAF7F2 50%, #ECE6DC 100%)` — platt vit såg "billig" ut, Leonard 2026-07-09), centrerad poster-layout, och orange **enhets-accent** (talet i svart ink, enheten i orange: `280–435&nbsp;<span class=u>mm</span>`). Håll typografi + marginaler identiska mellan kort-typerna; footer-lockupen se nedan. **Skriv inte HTML:en för hand — importera `scripts/cardkit.py`**, där mallen redan är låst, så hela katalogen blir pixel-konsekvent:

   ```python
   import sys; sys.path.insert(0, "scripts")
   import cardkit as ck
   U = lambda s: f'<span class=u>{s}</span>'                       # orange enhets-accent

   ck.hero_white("orig/o01.jpg", "out/hjalte.jpg")                  # plats 0 (metod H-0)
   ck.grid_overlay("orig/o05.jpg", "g/o05.jpg", 0.05)               # läs av crop-gränser
   ck.crop("orig/o05.jpg", "crops/detalj.jpg", .15, .34, .24, .43)  # relativa koordinater

   ck.card_photo("k1", "crops/detalj.jpg", "KICKER", "Rubrik",
                 "En rad brödtext.", note="fotnot", fit=True)
   ck.card_grid("k2", ["crops/a.jpg", "crops/b.jpg"], ["Vänster", "Höger"],
                "KICKER", "Rubrik", "En rad brödtext.", note="fotnot", rows=1)
   ck.card_spec("k3", "out/hjalte.jpg", "Specifikation", "Produktnamn",
                [("Höjd", f"156&nbsp;{U('cm')}"), ("Sockel", "E27")], note="fotnot")
   ck.render(["k1", "k2", "k3"])                                    # → cards/*.png, 3200²
   ```

   `card_grid` tar 2–4 foton (`rows=2` ger 2×2). `card_spec` lägger raderna i två
   kolumner — 6–10 rader ser bäst ut. `fit=True` = hela produkten syns (contain);
   `fit=False` = fyller panelen men beskär (bara kontextfoton).
   > **Footer-märke (obligatoriskt from 2026-07-09):** använd **kub-loggan + "Fyndplats"** (lockup), **inte** den gamla grå gles-versalen "FYNDPLATS". Hämta kuben en gång från `https://www.fyndplats.se/icon.png` (orange 3D-kub, transparent PNG), bädda in som data-URI. CSS: `.brandlock{display:flex;align-items:center;gap:15px}` · `img{width:47px;height:47px}` · `b{font-size:37px;font-weight:700;letter-spacing:-.5px;color:#1B1B1A}`. Leonards beslut: nya loggan gäller alla NYA produkter framåt (äldre kort retrofittas bara på begäran).
3. **Rendera → PNG via förinstallerad Chromium** (ingen Wix-AI, ingen hastighetsgräns):
   ```bash
   CHROME=/opt/pw-browsers/chromium-*/chrome-linux/chrome
   "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
     --force-device-scale-factor=2 --window-size=1600,1690 \
     --screenshot=out.png "file://$PWD/card.html"   # 2× → 3200² retina (skarpare i Wix)
   ```
   > ⚠️ **Två renderingsfällor som båda ser ut som designfel men är Chromium-beteende (2026-08-04, kostade två omrenderingar).**
   > 1. **Viewporten blir ~87,5 CSS px LÄGRE än `--window-size`.** Ligger gradienten på `<body>` med `height:1600px` blir bakgrundens positioneringsyta viewporthöjden → gradienten **tilar**, och kortets nedersta ~90 px blir vita medan foten kapas mitt i "Fyndplats". Lägg gradienten på ett **fast `.card`-element** (1600×1600, `overflow:hidden`), rendera med **högre fönsterhöjd** (t.ex. `--window-size=1600,1780`) och **kapa till exakt kvadrat i PIL** efteråt.
   > 2. **Utan `<meta charset="utf-8">` blir å/ä/ö mojibake** (`Ã¥`/`Ã¤`/`Ã¶`) — och inkonsekvent, så några kort ser rätt ut och lurar ögat. Skriv filen med `encoding="utf-8"` OCH sätt meta-taggen.
   >
   > Båda är låsta i **`scripts/cardkit.py`** — importera den i stället för att bygga om mallen (den föregående sessionens kortmallar låg bara i scratchpad och försvann när containern återskapades).
   >
   > **Samma viewport-fälla i SVART variant (2026-08-06, hittad i efterhand på 9 publicerade kort/7 produkter):** renderas med `--window-size=1600,1600` och beskärs till 3200² fylls de saknade ~174 px längst ner med **svart band** under lockupen (i stället för det vita/tilade fallet ovan — beror på bakgrunden). Verifiera därför ALLTID att slutbilden är exakt 3200×3200 **utan** mörka rader i nederkant:
   > ```python
   > a = np.asarray(Image.open(p).convert("RGB")); n = 0
   > for y in range(a.shape[0] - 1, -1, -1):
   >     if a[y].mean() < 40: n += 1
   >     else: break
   > assert n == 0, f"{p}: {n} svarta rader i nederkant — fel window-size"
   > ```
   > Redan drabbade kort lagades utan ombyggnad: bandet är rent tomrum, så bakgrundsgradienten förlängdes ner över det (global lutning + sidled-utjämnad basrad — per-kolumn-extrapolation ger lodräta strimmor).
4. **Granska ALLTID med `Read`** (helhet + inzoomat). Vanliga fel: text kapas (sätt `.photo{flex:1;min-height:0}` så textblocket aldrig trängs bort), och **små källurklipp (<~500 px) blir suddiga** när de skalas upp 2–3× → använd i stället en högupplöst i-bruk-bild som rundad banner, eller acceptera medelstor "spotlight". `object-fit:contain` skalar INTE upp av sig själv; `max-width/height:100%` visar bilden i sin naturliga storlek (små blir små).
5. **Ladda upp** alla kort i ETT `UploadImageToWixSite`-anrop (GitHub-branch-vägen, se [bildmetoder.md](bildmetoder.md)) och byt in dem i galleriet.

> ⚠️ **Produkten grundas — beskär den ALDRIG (cover-crop). Lärdom 2026-07-09 (barncykeln).** En **produkt** (cykel, stol, maskin) ska alltid ligga `object-fit:contain` på en grundad scen — i `cardkit` betyder det **`fit=True`**, och produktbilden bör vara körd genom `hero_white()` så den redan står på ren vit botten med luft runt om. `fit=False` (`object-fit:cover`, full-bleed) är BARA för **kontext-/livsstilsfoton** (en husvagn, en trädgård), aldrig för själva produkten — cover **kapar kanterna** (barncykelns hjul klipptes fram/bak). Två följdregler Leonard tryckte på samma dag:
> - **Beskär källan med marginal runt HELA produkten.** Ett för snävt käll-crop (`x[175:1410]`) klippte hjulkanterna redan innan kortet byggdes — vidga tills det finns luft runt varenda kant, granska sedan med `Read`.
> - **Hjälten ska FYLLA rutan (~80 %).** En liten produkt mitt i en stor tom ruta försvinner i katalog-gridden — skala den grundade produkten så den täcker ~80 % av 1600²-rutan (behåll ändå luft + skugga runt om). Gäller BÅDE plats-0-hjälten och produkt-hjälten på feature-korten.

---

**Ur `docs/agent-handoff.md`, Steg 3d (tidigare rad 152–156):**

- **Steg 3d – Egna svenska feature-/spec-kort** (se runbook Steg 3d): är leverantörens
  feature-slides **mörka AliExpress-collage** eller **engelska spec-blad** (inte enskilda
  produktfoton)? Bygg egna rena kort på ljus bakgrund av de RIKTIGA produktfotona
  (klipp ut med rembg → HTML/CSS → Chromium-render → ladda upp) så hela galleriet ser ut
  som ett eget varumärke. Passa på att rätta felaktig inbränd data (fel spänning/mått).

---

**Ur `docs/seo-polish-runbook.md`, färgval utan foto, punkt 2 (tidigare rad 461–466):**

2. **Finns ett foto, koppla det.** Är fotot en SKU-bild bygger du ett färgkort ur det
   (`scripts/cardkit.py`, `card_swatch`, 1600 × 1600, varan frilagd mot vit botten), lägger
   kortet i grenen och kopplar det till valet med en skrivning av `options` och
   `variantsInfo` ordagrant ur produktens egen GET (se *Färger som inte kom via verktyget*
   i `docs/polish/syskon.md`). Kör sedan `variantbild.yml` (push som ändrar
   `tools/variantbild/kor.json` med produktens id) så att variantens bild följer valet.

---

**Ur `docs/seo-polish-runbook.md`, givarens egna kort (tidigare rad 524–526):**

   livekollen är `kolla-live-farg.py`. En givares egna kort läggs bara som val om de visar
   färgens egen vara och sidan inte redan har ett eget kort (givarens kort dubblerar det, och
   siffrorna kan skilja). **Före skrivningen: jämför talen i varje måttbild med sidans text**

---

**Ur `docs/seo-polish-runbook.md`, avsnittet om för få bilder (tidigare rad 713–717):**

rena i `bilder.tsv` med sina fil-id. Leverantörens rena bilder går före egna kort
*(Leonard 2026-09-30)*. Det gäller också måttbilder: en variants egen måttbild lämnas kvar
och länkas till färg OCH storlek, och ett Fyndplats-kort byggs bara när leverantören saknar
måttbild för varianten eller originalet bär en logotyp eller text som inte går att beskära
bort utan att måtten försvinner *(Leonard 2026-10-24: ingen vill ha korten egentligen)*.

---

**Ur `CLAUDE.md`, *Färgval med få bilder*, metoden för en AliExpress-sida, punkt 1 (tidigare rad 2873–2877):**

1. **Hitta fotona.** Listningens SKU-bilder, galleri och beskrivningsbilder läses krypterat
   med `ae-skubilder.yml` (push som ändrar `tools/ae-skubilder/kor.json`). Hämta dem lokalt,
   bygg ett kontaktark och titta på varje bild: tysk eller spansk text, märke och en annan
   färg stryks. Leverantörens rena gröna foton räckte inte till fem, så det femte är ett
   specifikationskort med den gröna varan (`scripts/cardkit.py`, `card_spec`).

---

**Ur `CLAUDE.md`, *Originalen tillbaka*, regeln framåt (tidigare rad 4233–4258):**

Regeln framåt, och den ersätter *ett kort per storlek*:

1. **Originalet först.** En måttbild som leverantören har för en färg och storlek ligger
   kvar och länkas till exakt den kombinationen. Ett Fyndplats-kort byggs bara när (a)
   leverantören saknar måttbild för varianten (hammockens 177 cm, kantskyddens Ø305 och
   Ø366, hundbäddens 107 × 61 × 20 cm, kistans M och L) eller (b) originalet bär en
   logotyp eller en text som inte får synas och inte går att beskära bort utan att måtten
   försvinner (svarta bänken `7b818c3b`, kortet i `runda-bilder-bank-svart-kort`, Leonards
   *Okej* på fråga 2b).
2. **Ett reservkort ägs av de färger och storlekar som saknar eget original, aldrig av
   storleken** (`ändra.json`: `["Vit", "Brun", "60 × 40 cm"]`). Fyra sådana finns kvar, på
   kattrappan, hundsängen och bokhyllan, och bara där en borttagning hade lämnat en vy
   med färre bilder än före.
3. ☠️ **Färgens första foto länkas också till färgens storlekar.** Kombinationens första
   bild och variantTable-bilden är kandidaten som passar och är kopplad i flest optioner,
   och lika antal ger den tidigaste (`lib/variant-price.ts`). Ett original länkat till färg
   OCH storlek slår därför ett foto länkat bara till färgen och blir första bild: på
   skrivbordet började Vit × 80 cm med Vits måttbild och Svart × 63 cm med Svarts, tills
   fotot länkades också till storlekarna. Kontrollen är `bygg-forsta-koll.py` (ren
   läsning ur Wix, butikens regel): ett original eller kort får aldrig vara första bild.
4. ☠️ **Ett borttaget original läggs tillbaka vid samma fil-id** så länge bildstädningens
   karenstid inte gått ut. Fil-id:n står i `BILDER:`-raden i `bilder-bort`-körningens
   logg. Kör aldrig två `kor_wf.py` samtidigt (`kedja.sh` kör sidorna en och en).
5. ☠️ **En kortrunda ligger direkt under `tools/polish-assets/`.** Ignoreringen
   `*/orig/` gäller bara en nivå ned (nu även `**/orig/`), och kortets fotokälla är
   leverantörens foto. Kontrollera med `git check-ignore -v` före `git add`.
