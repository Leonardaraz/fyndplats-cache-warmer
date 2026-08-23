# Varianter – mekanik

> **Reglerna** för varianter står i [`seo-polish-runbook.md`](../seo-polish-runbook.md)
> Steg 6 och 11: vilka varianter som ska bort, att varje variant som ser olika ut
> behöver en egen bild, att uttags-/spänningsaxeln bara får ha EU-värdet, och att
> variantetiketten aldrig bär en obekräftad prestandasiffra.
>
> Den här filen är **hur** man genomför det i Wix V3 — PATCH-kroppar, låsningar och
> följdsteg som inte sker av sig själva.

-----

## Döpa om variantalternativ i efterhand (Wix V3)

Rå AliExpress-varianter kan bära namn som är obegripliga eller direkt vilseledande. Mediahyllan `1dd82a63` hade en option som hette **"Färg"** men innehöll fem möbeltyper, och suffixen **TypeA/TypeB betydde motsatta saker beroende på färg**: `24 rader Svart TypeB` var en bred hylla för 1 899 kr, `24 rader Brun TypeB` ett skåp med dörrar för 3 939 kr. **Priset följer möbeln, bokstaven gör det inte** — använd priset som facit när du avkodar leverantörens etiketter, och titta på varje variantbild innan du döper om.

**Omdöpning på plats går INTE.** `choice.name` speglar den låsta `choice.key`. Ett försök att PATCH:a nya namn med bevarade `choiceId` ger `428 MISSING_VARIANT_OPTION_CHOICE` med `optionsMissingChoice: ["färg","modell"]` — Wix tolkar det som "ta bort optionen, skapa en ny" och hittar då varken gamla eller nya val. PATCH:en faller atomiskt, så inget går sönder av försöket.

**Rätt väg — ersätt optionen och laga följdskadorna i ordning:**

1. **Säkerhetskopiera först** till scratchpad: per variant `sku`, `wixVariantId`, pris, synlighet, lagersaldo och lagerpostens id. Utan den kan du inte återställa.
2. **PATCH `options` + `variantsInfo`** (`fieldMask: ["options","variantsInfo"]`). Skicka optionen HELT utan id:n — nytt `name`, nya `choices` med bara `name` + `choiceType` — och identifiera varje variant med `optionChoiceNames` (`optionName` + `choiceName` + `renderType`, alla tre krävs). **Behåll varje `sku` och pris exakt.** `linkedMedia: [{id}]` kan skickas inline med de nya valen och överlever — variantbilderna behöver alltså inte länkas om separat.
   - ☠️ **`choice.name` får vara högst 50 tecken.** Över det svarar Wix `400 MAX_LENGTH` och namnger varje för långt val med sin faktiska längd. Gränsen är lätt att spränga när etiketten ska bära mått + utförande + färg (`128–191 × 144–187 cm – dubbelstång, krom, utdragbar` = 51). Räkna före PATCH:en och korta det minst särskiljande ledet — hela PATCH:en faller annars, och produkten står kvar i det kollapsade mellanläget.
   - ⚠️ **Kollapsen flippar `visible` till `true`.** Punkt 2 ovan körs i två PATCH:ar (först `options: []` + EN variant utan choices, sedan den nya optionen), och den första sätter tyst tillbaka produkten till synlig. På ett utkast betyder det att en halvfärdig produkt utan varianter ligger publicerad tills nästa PATCH går igenom. **Skicka därför alltid `visible` explicit i PATCH nummer två** — och läs av `visible` i svaret på båda, aldrig bara på den sista.
3. **Skapa lagerposterna på nytt.** `/stores/v3/products` skapar dem INTE (bara `/products-with-inventory` gör det vid create). Efter steg 2 har produkten noll lagerposter medan den ligger publicerad. Kör `POST /stores/v3/bulk/inventory-items/create` med `{productId, variantId, trackQuantity:true, quantity}` och verifiera saldo mot säkerhetskopian.
4. **Peka om mappningen.** Allt nedströms nycklar på `wixVariantId`: lagersynken (`lib/sync/inventory.ts:27`), `lib/sync/shippability.ts:151` och auktionsmotorn (`lib/auction/seed.ts:96`). Missar du det slutar lagret tyst att uppdateras — varianterna hamnar i `unmatched`, ingen krasch.
5. **Skriv om mappningens `choices` också.** `lib/orders/place-order.ts:66` matchar order → AliExpress-SKU på `v.choices[optionNamn] === valt värde`. Byter optionen namn från "Färg" till "Modell" matchar inget. **Räddningen är att SKU testas först** (rad 62) — därför är regeln: byt aldrig SKU i samma operation.

**Kontrollera till sist** att `FyndplatsAuctions` inte har state med gamla variant-ID (tomt = inget att så om), och att synken inte skriver tillbaka de gamla namnen — `lib/sync/aliexpress-sync.ts` rör varken `options` eller `variantsInfo`, så omdöpningen är beständig.

**Sajten visar gamla namn i upp till 5 minuter** efteråt: headless-PDP:n är ISR med `x-nextjs-stale-time: 300`. Verifiera mot Wix-API:t direkt, och kontrollera sidan igen efter cachefönstret innan du rapporterar klart.
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

> ☠️ **Efter ett galleribyte måste `linkedMedia` återställas** — samma fälla, beskriven en gång i runbookens Steg 9. Återställningen kräver `variantsInfo` verbatim i samma PATCH, annars 428 `MISSING_VARIANT_OPTION_CHOICE`.

-----
