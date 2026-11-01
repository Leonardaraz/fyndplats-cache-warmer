### Färgbilderna: varje färg får alla sina bilder (2026-09-30)

Sammanslagningen tog bara givarens första bild. Givaren pensionerades och ligger
kvar dold med sina ~5 bilder, och en tillagd färg visade en bild i butiken.
Torrkörningen 2026-09-30: 516 sidor med givare för 796 tillagda val. Givarna blir
raderbara från 2026-10-11, så bilderna ska flyttas innan dess.

Workflowen **"Bilder — ge varje färg på en sammanslagen sida alla sina bilder"**
(`plan` · `skriv`) → `/api/admin/fargbilder` → `lib/aosom/fargbilder.ts` (ren
logik) och `lib/aosom/fargbilder-kor.ts` (Wix). Torrt som default. `hogst`
(standard 10, högst 50, räknar bara sidor utan hinder) eller `sidor` (wix-id),
`ta_med_granskade` och `tillat_ur_galleriet`.

- **Givaren hittas via filen.** Valets `linkedMedia[0]` ligger i exakt ett dolt
  utkasts galleri. SKU:n går inte att använda, eftersom den nya variantens SKU är
  sidans plus färgen. Två dolda produkter med samma fil ger hindret `flera_givare`.
  Är träffen inte givarens bild 1 blir det en varning.
- **Butikens ägarregler** (headless-site `lib/variant-bilder.ts`, kopierade
  ordagrant). Länkade bilder först. Kort och måttbilder (`arKort`) är gemensamma.
  En olänkad bild som nämner exakt en färg hör till den, och övriga olänkade foton
  hör till huvudbildens färg. En givares egen fil går före alt-texten. Ett foto
  vars färg saknar länkad bild står kvar orört i galleriet. Efter skrivningen är
  varje färgs bilder länkade.
  ⚠️ **Gemensamma kort och måttbilder visas som andra bild under varje färg, även när
  de föreställer värdens färg** (2026-10-22: hundbäddens blå måttbild under Brun,
  agilityhindrets träbågar under Grå, sminkpallens rosa under Vit). Frågan om de ska
  länkas till sin egen färg står hos Leonard (FLAGGADE, lärdom 147). Tills han svarat
  är gemensamma måttbilder standard, och skumklossarnas `d70e483e` måttbild är länkad
  till sin färg som prov. På fåtöljen `41395340` (T91) fick båda färgerna var sin
  måttbild: givarens angav samma tal som sidans text och togs med som sista bild, och
  värdens länkades till värdens färg (FLAGGADE, lärdom 149).
- **Wix 50 och tabellen.** Galleriet får huvudbilden, de gemensamma korten, andra
  axlars bilder, varje redan länkad bild och sedan en bild i taget till den färg
  som har minst. Resten sparas i Postgres-tabellen `fargbilder` (`overflow`), som
  butiken kan läsa via `GET /api/fargbilder?pid=`. Den skapas vid första
  användningen (`FARGBILD_DDL`). Bildstädningen räknar varje fil-id i tabellen
  som använd.
- ☠️ **Taket är 50, uppmätt 2026-10-21 — dokumentationens 15 stämmer inte.**
  Verktyget byggdes på "About Product Media" (15). En dold testprodukt (raderad
  direkt efteråt) fick 16, 20, 25, 30, 40, 46 och 50 bilder, och varje skrivning
  lästes tillbaka i ett eget anrop. Den 51:a gav `400 MAX_SIZE` (*"has size 51,
  expected 50 or less"*, threshold 50). Dessutom höll 86 publicerade sidor redan
  16–46 bilder. Med 15 som tak vägrade verktygen (`over_tak_redan`,
  `galleriet_fullt`) just de sidor som har flest färger, och överskottet
  parkerades i en tabell som butiken ännu inte läser. Talet bor i
  `WIX_MAX_BILDER_PER_PRODUKT` (`lib/wix/limits.ts`) och läses av färgbilderna,
  miljöbilden, sammanslagningen och planernas validering (`skrivplan.ts`,
  `bildplan.ts`). `lib/aosom/bildtak.test.ts` fäller en modul som hårdkodar ett
  eget tal och låser värdet. ⚠️ **Mätt är en PATCH med fältmask `media`.**
  Skapandet (`products-with-inventory`) och bulk-skrivningarna är inte mätta,
  och importen skapar produkter med färre bilder än så. Höj eller sänk talet bara
  efter en ny mätning, som CHOICES-taket i samma fil — där var dokumentationen
  fel åt det farliga hållet, här åt det försiktiga.
- ☠️ **Butiken läser inte tabellen än.** Ett foto som bara står i tabellen syns
  alltså inte. Därför flyttas sidans egna foton aldrig ur galleriet utan
  `tillat_ur_galleriet=ja` (hindret `ur_galleriet_kraver_butiken`). Givarbilder
  som aldrig legat i galleriet sparas i tabellen ändå, de försvinner inte ur
  något.
- **Opolerad givare** (tyskt namn eller tom alt-text): bilder från position 2
  skrivs inte utan `ta_med_granskade=ja` (Leonard granskar dem själv). De sparas
  som `granskas`, så att städningen inte tar filerna, men butiken får dem inte.
  Ett foto som redan ligger i sidans galleri flaggas aldrig, och en bild som
  skrivits en gång granskas inte igen. ⚠️ `ta_med_granskade` når en redan skriven
  sida bara via `sidor`, för urvalet tar bara sidor med givare kvar att flytta.
- **Alt-text:** en svensk behålls. Annars blir den "<sidans namn> i färgen <färg>",
  med ", bild N" från den andra.
- **Hinder:** `ej_publicerad`, `saknar_fargaxel`, `flera_givare`, `ingen_givare`
  (bara med `sidor`), `oppen_auktion` (bara `live`, eftersom kön har en rad per
  produkt), `givare_publicerad`, `over_tak_redan`, `ur_galleriet_kraver_butiken`
  och `plan_ogiltig`.

☠️ **En länkad bild tappas aldrig, och ingen fil försvinner.** Varje bild ett val
pekar på står kvar i galleriet, och varje färgs nya lista börjar med dess
nuvarande (`kontrolleraPlan`). `skriv` kräver `bekrafta` = planens sha256, räknad
om ur färska läsningar. Stegen:

1. **Tabellen skrivs FÖRST**, obekräftad, och läses tillbaka. Stämmer den inte rörs Wix inte.
   Varje fil planen rör står alltså i tabellen innan Wix ändras, och en
   omkörning läser in tabellens rader.
2. Galleriet skrivs ensamt. Bara olänkade foton kan falla ur det.
3. Länkarna skrivs med options och variantsInfo ur GET:en och `visible`. Om
   försöks bara vid 404 `PRODUCT_MEDIA_NOT_EXIST` eller 409, och bara när det
   enda som avviker är länkarna (högst åtta gånger). Varje annat fel stoppar
   direkt, med felet i svaret.
4. Återläsning: galleriet, alt-texterna, varje vals lista, andra axlar,
   synligheten, och varje variants synlighet, pris, SKU och val. En dold
   variant som blivit synlig stoppar också. Vid första avvikelse stannar
   körningen.
5. Först nu sätts `wix_bekraftad_at` på sidans rader.

☠️ **Rader utan `wix_bekraftad_at` betyder en halvskriven sida.** Tabellen
skrevs i steg 1 men Wix föll därefter. Urvalet räknar bara bekräftade rader som
skrivna, så en halvskriven sida väljs igen av `hogst` även när den inte har
någon givare kvar. Planen räknar dem i `summa.halvskrivna`, och talet ska vara
0 när `kandidaterTotalt` är 0. En ersättning av raderna nollställer
bekräftelsen, och sammanslagningen bekräftar den nya färgens rader först efter
sin egen återläsning.

Ordningen före raderingen: kör `plan` för 10 sidor och titta, sedan `skriv`, och
kör klart alla kandidater (`kandidaterTotalt` ska bli 0) innan
`pensionerade-radera` körs. Det finns ingen spärr i raderingen (Leonards beslut
2026-09-30), men tabellen skyddar filerna mot bildstädningen.
