# Bildmetoder – fördjupning

> Detta är **mekaniken**. Reglerna för vilka bilder som ska finnas och hur de får
> se ut står i [`seo-polish-runbook.md`](../seo-polish-runbook.md) — den här filen
> beskriver bara **hur** man gör det, när standardvägen inte räcker.
>
> **Standardvägen för en hjältebild:** `hero_white()` (H-0) → ren leverantörsbild →
> Wix generate-image (H-A) sist, och aldrig på position 0 (C2PA-märkning).
>
> **Metodprefix:** `T-` = textborttagning, `H-` = hjältebild, `K-` = kortbygge.
> Prefixen finns för att A och B tidigare betydde olika saker i två avsnitt.

-----

## Textborttagning (T) – tvätta loggor och inbränd text


**T-A – Wix Generate Image (REKOMMENDERAD, samma mekanism som `H-A`):**

Samma `POST .../generate-image` → polla `GET .../generated-image/{executionId}` som i `H-A`, men med en **tvätt-prompt** som uttryckligen **bevarar** bakgrunden i stället för att byta till vit:

> Remove ALL burned-in text, captions, labels, callouts, banners, badges, and graphic overlays from this photo. Keep the photographed product (**&lt;beskriv produkten kort&gt;**), its real background, lighting, shadows, and any people or hands shown, completely unchanged and identical — do not add, remove, redraw, recolor, or restyle any physical part. The final image must be the plain, clean original photograph with zero text or graphic overlays anywhere. Do NOT change the background to white — preserve the original background exactly as photographed. High resolution, professional product photography.

Samma **guardrail som för H-metoderna gäller alltid**: `Read` resultatet sida-vid-sida mot originalet innan det används — faktatrohet går alltid före ren bild.

> **Beprövat (2026-07-08):** troget över 19 bilder — handhållna närbilder, person i rörelse, regn, trä-/stenbakgrund; text/banderoller borta, produkt + bakgrund identiska i alla sida-vid-sida-jämförelser.

> **Hastighetsgräns:** `generate-image`-endpointen kan bli hastighetsbegränsad efter många anrop i rad, och avkylningen kan ta **flera minuter** (upplevt: >10 min, inte bara en kort burst-gräns) — planera batchar om **3–6 anrop åt gången**. Misslyckas ett jobb (`status:"FAILED"`): försök om **en gång**; misslyckas det igen → **ta bort bilden** ur galleriet i stället för att fastna i en retry-loop mot en fortsatt begränsad endpoint. Den kan alltid läggas till igen senare.

> ⚠️ **Ledarlinjer och callout-streck: korsar linjen PRODUKTEN — retuschera inte, byt crop.** Leverantörens feature-bilder drar tunna streck från en textetikett fram till detaljen de pekar på, så linjen slutar nästan alltid **ovanpå** varan. Ligger den på slät bakgrund: tvätta bort den. Ligger den över produkten: **välj ett annat utsnitt, en annan källbild, eller släng bilden** — laga den inte.
>
> Kostade fyra försök på **en** linje över en framåt/back-vippknapp (2026-08-11): `cv2.inpaint` med TELEA och NS lämnade grå utsmetningar på den blanka plasten, och en kolumn-blend mellan rena rader ovanför/nedanför suddade ut symbolen `◀0▶` som satt under linjen. Facit blev att inte visa knappen alls och beskriva funktionen i texten i stället — kunden förlorade ingenting, och ingen bild ljuger. Regeln är samma som den fasta bildregeln högst upp: **hellre en bild mindre än en förvanskad vara.**
>
> Praktiskt: mät linjens exakta utsträckning med `grid_overlay` **innan** du bestämmer dig. Slutar den före silhuetten kan ett crop som börjar strax efter linjens slut rädda bilden utan en enda retuscherad pixel.

**T-B – manuell text-täckning (fallback – bara om Metod A/C är otillgängliga och bakgrunden är helt slät/enfärgad):**

Täck text-/loggregionen med bakgrundsfärgen (PIL eller ImageMagick; `tesseract` ger bbox:ar om regionen är svår att ringa in manuellt). Fungerar bara för släta studiobakgrunder — för komplexa/röriga bakgrunder utan Metod A/C tillgänglig, ta bort bilden i stället för att riskera ett klumpigt manuellt utklipp.

**T-C – Lokal LaMa-inpainting (SISTA UTVÄGEN — installera bara vid faktiskt behov):**

> ⏱️ **Kostnadsnot:** ~200 MB modellnedladdning plus torch/easyocr/opencv-installation, och den har **inte behövts en enda gång på ~40 produkter** (2026-07 → 2026-08). Gå hit först när Metod A är bevisat blockerad *och* bilden är värd att rädda. Är alternativet att bara ta bort bilden ur galleriet — gör det i stället.

Metod A:s hastighetsgräns kan kvarstå **långt över en timme** (sett en tidigare session), utan synlig kvot i Premium Features API (inte en "slut för månaden"-spärr, se noterna under `H-A`). Kör då exakt samma sorts textborttagning **lokalt** i sandboxen — samma AI-kvalitet på röriga bakgrunder, men helt utanför Wix rate-limit:

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install "setuptools<80" wheel && pip install --no-build-isolation fire   # fire kräver äldre setuptools för att bygga
pip install easyocr opencv-python-headless simple-lama-inpainting scikit-image
# LaMa-modellen: Sanster/models på GitHub är ofta egress-blockad i sandboxen -> HF-spegel i stället:
curl -sSL -o big-lama.pt "https://huggingface.co/JosephCatrambone/big-lama-torchscript/resolve/main/lama.pt"
```

Kör modellen **direkt via torch** (hoppa över `simple-lama-inpainting`-paketets wrapper — bygget av dess `fire`-beroende failar ofta ändå): ladda `torch.jit.load("big-lama.pt")`, maska text-regionerna som pixel-rektanglar (identifierade genom att `Read`-granska bilden, inte blint OCR), och kör `model(bild_tensor, mask_tensor)`.

> **Kritisk regel — kompositera ALLTID tillbaka originalet utanför masken:** nätverket garanterar **inte** pixel-identiskt resultat utanför den maskade regionen (kan hallucinera en enstaka färgartefakt nära en svår kant, t.ex. en sadel-urskärning). Sista steget MÅSTE vara `output = where(mask > 0, nätverkets_utdata, originalbilden)` — annars kan ett oskyldigt-seende hörn få en osynlig defekt som bara syns vid inzoomning. Verifierat: en sådan artefakt uppstod och fångades/fixades 2026-07-08 innan leverans.
>
> **Maska aldrig över riktiga fotoobjekt** (person, kroppsdel, produktdetalj) även om text råkar överlappa dem i originalbilden — dela upp masken i flera mindre rektanglar och hellre lämna ett enstaka ord/textfragment kvar (flagga det) än att riskera att förvanska ett fotograferat objekt. Hände en gång denna session (en arm/axel i en collage-bild) — löst genom att bara maska textraden som INTE overlappade kroppsdelen.
>
> **Andra artefaktklassen — maskgräns för nära textens faktiska utsträckning:** till skillnad från kompositeringsbuggen ovan (fel UTANFÖR masken) kan nätverket lämna kvar svaga spöklika prick-/strimmefragment **INNE i** den maskade regionen, om maskens nederkant ligger för nära text-descendrar ("g"/"p"/"y") eller kommatecken som sticker ner under rubrikraden. Facit: zooma in exakt vid den tilltänkta maskgränsen i originalbilden FÖRE körning, och lämna minst ~20–30 px marginal mellan textens synliga utsträckning och maskgränsen (bredare dilate, t.ex. 5–6). Verifiera alltid resultatet genom att zooma in **precis vid maskens gräns** — inte bara helhetsintrycket, för dessa fragment syns knappt i full storlek. Hände på 2 av 5 bilder på CNC-fräs-produkten (2026-07-08), fixat genom att utöka masken nedåt och köra om.
>
> **Verifierat (2026-07-08):** 36 bilder tvättade över 8 produkter (7 WEST BIKING + CNC-fräs) efter att Metod A varit blockerad — samma visuella kvalitet som Metod A (sten/regn/gata/inomhus/mörk-gradient-bakgrunder rekonstruerade naturtroget).

**Få in resultatet i Wix utan att spränga kontexten:** en tvättad bild i full storlek (800×800+) blir 75 000+ tokens som base64 — för stort för `Read`+`UploadImageToWixSite`. Två vägar:
1. **Chatt-bifogning**: `SendUserFile` → Leonard bifogar tillbaka i chatten (`download_url` resolveras automatiskt av `UploadImageToWixSite`) — funkar, men chattgränssnittet tillåter bara ~5 filer/meddelande, så stora batchar kräver flera omgångar.
2. **Publik GitHub-branch (rekommenderad för batchar ≥10 bilder):** i en isolerad `git worktree` (rör ALDRIG huvudarbetsträdet), skapa en **orphan-branch namngiven `claude/...`** (repo-push-behörigheten godkänner bara det prefixet — taggar och andra grennamn nekas med 403), lägg in bilderna, committa, pusha. Verifiera först att repot är publikt (`curl` mot en känd fil på `raw.githubusercontent.com`). Anropa sedan `UploadImageToWixSite` med `image:[{download_url:"https://raw.githubusercontent.com/<ägare>/<repo>/<gren>/<fil>"}, …]` — **alla bilder i ett enda anrop**. Radera grenen efteråt; `git push origin --delete` kan nekas av samma behörighetsbegränsning — då är kvarlämnad gren ofarlig (inga hemligheter, bara bildfiler) men be Leonard städa manuellt via GitHub om han vill.
   > **Kostnadsrisk:** en ny gren-push kan trigga en automatisk Vercel-preview-byggning (sett hela denna session på varje `claude/`-gren). Fråga Leonard innan du kör — han avgör om den (troligen försumbara) risken är okej, kontra att vänta eller använda chatt-vägen i stället.

**Så här sätts resultatet in (alla tre metoderna):**

3. Metod A ger ett `fileId` direkt (ingen uppladdning behövs); Metod B/C laddas upp med `mcp__Wix__UploadImageToWixSite` (via chatt-bifogning eller GitHub-branch, se ovan) → ny `static.wixstatic.com`-URL/fileId.
4. Ersätt item:et på **samma position** i `itemsInfo.items` med det **fullständiga item-objektet** (inte bara `url`+`altText` — det är det verifierat fungerande formatet från denna sessions PATCH:ar): `{ "id": "<fileId>", "altText": "<svensk alt>", "mediaType": "IMAGE", "image": { "id": "<fileId>", "url": "https://static.wixstatic.com/media/<fileId>", "altText": "<svensk alt>" } }` i Steg 9-PATCH:en. Verifiera via re-GET att item:et fått `image.url`. Position 0 = `media.main` = produktkortet.
5. **Radera aldrig originalfilen** ur Media Manager (den blir föräldralös och tas i de återkommande städsvepen). Var den gamla bilden `linkedMedia` för ett variantval: koppla om valet till det **nya** media-item-id:t (Steg 11B), annars tappar färgvalet sitt bildbyte.

> 🔒 **Tvätten gäller bara overlay-grafik, aldrig varan** — se den fasta regeln högst upp (inkl. avgörande-testet och misstagsfallen: för snäv beskärning, `rembg` som äter tunna delar). Ett husmärke tryckt på varan lämnas orört **utan att flaggas** — så ser produkten ut. Osäker på om något är pålagt eller sitter på varan? Flagga med före/efter-preview i chatten.

> 🗂️ **Skrivreglerna för `media.itemsInfo` står i runbookens Steg 9** — hela arrayen
> tillbaka, aldrig `media.main`, re-GET för verifiering, och att galleribyten nollställer
> `linkedMedia`. Läs dem innan du patchar; här nedanför står bara hur bilden görs.

Procedur (utgå från `media.itemsInfo.items` från Steg 3):

```js
const itemsA = items.map((it, i) => ({ ...it, altText: newAlt[i], image: it.image ? { ...it.image, altText: newAlt[i] } : it.image }));
// hämta färsk revision, sedan (OBS: inget media.main – det är readOnly):
PATCH .../products/{PRODUCT_ID}
body = { product: { id:"{PRODUCT_ID}", revision:"{FÄRSK}", media: { itemsInfo: { items: itemsA } } } }
```

Verifiera direkt efter:

```
GET .../products/{PRODUCT_ID}?fields=MEDIA_ITEMS_INFO   // alla items ska ha image.url; count oförändrad — utom bilder som MEDVETET togs bort/ersattes med T-/H-metoderna
```

-----


-----

## Hjältebild (H) – ren vit produktbild



Leverantörsbilderna har ofta fula/mörka/röriga bakgrunder (ibland med hörn-logga). Det som får katalogen att se ut som ett **riktigt varumärke** är **enhetlighet** — inte att varje bild är vit. Regel: **hjältebilden (första item = `media.main` = produktkortet) ska vara en ren produktbild på vit studio-bakgrund med mjuk skugga.** Konsekvent inramning mellan produkter = proffsigt.

Klassa varje bild utifrån bildgenomgången i Steg 4:

- **Ren enskild produktbild på ful/mörk/rörig bakgrund** (ev. hörn-logga i bakgrunden) → **klipp ut produkten och lägg på vit + mjuk kontaktskugga**. En overlay-logga i bakgrunden försvinner automatiskt (den ligger utanför produktens silhuett).
- **Nyttig kontextbild** (detalj, i-bruk, skala, storleksjämförelse) → **behåll**, tvätta bara logga/inbränd text (T-metoderna). **Vitmåla inte** — kontexten säljer, och komplexa bilder är där urklippet riskerar klippa kablar/smådelar.
- **Text-tung infografik** → ta bort/flagga (samma regel som i T-avsnittet).

> 🚨 **AI-genererad HJÄLTEBILD gör produkten "Begränsad" i Google Merchant Center och tappar de kostnadsfria listningarna.** *(Uppmätt 2026-08-14 efter Leonards rapport.)* Wix `generate-image` (Metod A) bäddar in **C2PA-manifest** (`jumb`-box) och **IPTC `digitalSourceType: trainedAlgorithmicMedia`** i filen. Google läser det och flaggar **"AI-etikett för tillgångar"**. Sitter etiketten på **huvudbilden** försvinner produkten ur kostnadsfria listningar helt; sitter den på en annan bild i galleriet visas produkten fortfarande, men just den bilden döljs.
>
> Katalogsvep 2026-08-14: **28 av 756 produkter** hade AI-märkt huvudbild — 20 av dem WEST BIKING-batchen, alltså EN poleringsomgång som slog ut en hel kategori ur gratistrafiken. Alla 28 hade redan minst en ren bild i galleriet.
>
> **Konsekvens för metodvalet:** Metod 0 är inte bara billigare och trognare — den är **den enda som håller produkten kvar i kostnadsfria listningar**. Den tröskar och beskär en riktig fotografi och är inte generativ AI, så ingen provenance-stämpel skrivs. Rangordningen för hjälten är därför hård: **Metod 0 → ren leverantörsbild → Metod A först när de två är uttömda** — och väljer du Metod A, lägg resultatet **någon annanstans än position 0**.
>
> **Kontrollera före publicering** (markören ligger inom första 64 KB):
>
> ```bash
> curl -sS -r 0-65536 "<wixstatic-url>" | grep -qa trainedAlgorithmicMedia && echo "AI-märkt — får INTE bli hjälte"
> ```
>
> ⛔ **Strippa aldrig C2PA/IPTC-taggen för att komma förbi filtret.** Är bilden genuint AI-genererad är taggen en upplysning, och att ta bort den för att nå gratislistningarna är att kringgå ett upplysningskrav — det riskerar hela Merchant Center-kontot. Rätt åtgärd är att byta bilden, inte att dölja hur den gjordes.

**H-0 – `hero_white()` (PROVA ALLTID FÖRST — gratis, deterministisk, ingen AI):**

Merparten av leverantörsbilderna från HOMCOM/Outsunny/PawHut/Sportnow ligger **redan** på vit studiobakgrund — de är bara snedcentrerade, har olika marginal och ett gråaktigt ljusbrus. Då behövs varken AI eller urklipp: tröskla bort bruset, beskär till produktens bbox och centrera på ren vit duk.

```python
import sys; sys.path.insert(0, "scripts")
import cardkit as ck
ck.hero_white("orig/o01.jpg", "out/hjalte.jpg")          # → (bredd, höjd) på produkten
ck.hero_white("orig/o02.jpg", "out/h2.jpg", fyll=0.94)   # smal produkt: fyll mer av duken
```

Utdata är 2000×2000 med produkten på ~90 % av duken. Fördelen mot både Metod A och B: den **rör aldrig en pixel innanför silhuetten**, så inga tunna delar kan ätas och inget kan omritas. Parametern `trosk` (default 245) är hur ljus en pixel måste vara för att räknas som bakgrund — sänk den om en ljus produkt åker med i bakgrunden, höj den om en gråaktig studiobakgrund blir kvar. **Granska ändå med `Read`.**

Funkar bara när bakgrunden faktiskt är vit/nästan vit. Är den rörig, mörk eller en miljöbild → Metod A.

**H-A – Wix Generate Image (för rörig/mörk bakgrund – server-side AI, ingen uppladdning):**

Wix egen AI byter bakgrund **server-side** och sparar resultatet **direkt i Media Manager** (du får ett `fileId` – **ingen base64-uppladdning**). Fördelar: den klarar det u2net INTE klarar — **mörk-på-mörk + tunna slangar/kablar/lösa klämmor** renderas rent — och utdata blir **~1024 px** (skarpare än en 800 px-källa). Detta är standardvägen för vita hjältar.

```
POST https://www.wixapis.com/social-publisher/v1/generate-image
  body: { "userInput": "<prompt nedan>", "imageUrl": "<wixstatic-url på originalhjälten, UTAN transform>" }
  → { executionId }
GET  https://www.wixapis.com/social-publisher/v1/generated-image/{executionId}   // polla tills status=READY (async ~10–30 s)
  → { status:"READY", imageUrl, fileId }
```

Prompt-mall (låser produkten, byter bara bakgrund — fyll i produktspecifika delar):

> Replace ONLY the background with a clean pure white (#FFFFFF) studio background and add a soft realistic contact shadow beneath the product. Keep the product itself completely unchanged and identical: same shape, proportions, display, buttons, **&lt;slang/klämmor/lins/portar…&gt;**, text, logos and colors. Do not add, remove, redraw, or restyle any part of the product. Professional e-commerce product photo, product centered, high resolution.

Sätt sedan `fileId` som hjälte-item (position 0) i `media.itemsInfo.items` (samma PATCH-mönster som nedan) — ingen uppladdning behövs.

> **Guardrail (obligatoriskt – generativ AI):** ladda ner resultatet, `Read` det och **jämför sida-vid-sida mot originalet**. Verifiera att INGEN produktdetalj ändrats (knappar, text, form, färg, antal delar, loggor). Ser något omritat/tillagt/borttaget ut → generera om med skarpare prompt, annars behåll originalet. **Faktatrohet går alltid före vit bakgrund.** *(Verifierat troget på Baseus kompressor `1dbdec91`, startbooster `86408870`/`63b38487`, bilkamera `e3c3df4c` — inkl. slang/klämmor som u2net ghostade/tappade.)*

> ⛔ **Använd INTE Metod A på produkter vars etikett bär text du säljer på** (kosmetik, kosttillskott, kemi, allt med innehåll/volym/vikt tryckt på förpackningen). Modellen ritar om etiketten: på hudvårdssetet `e50235e7` blev finstilta ingredienslistor rent nonsens och **"100g/3.53oz" blev "100g/2.53oz"** — en felaktig viktuppgift i huvudbilden. Guardrailen fångade det och resultatet slängdes. För sådana produkter: geometrisk maskning enligt Metod B/D, aldrig generativ.

**H-D – vit klisterkontur som maskeringsnyckel (när leverantören redan friställt åt dig):**

Många leverantörsbilder (särskilt kosmetik/småvaror) visar produkterna som "dekaler" med en **vit kontur** runt varje vara mot en färgad bakgrund. Konturen är en gratis, pixelperfekt mask — och till skillnad från både rembg och generativ AI rör den inte en enda produktpixel:

```python
vit    = (lum > 225) & (sat < 0.10)                 # konturen + vita partier
kontur = ndimage.binary_closing(vit, iterations=3)
m      = största komponenten av ndimage.binary_fill_holes(kontur)
```

Två fällor, båda sedda på hudvårdssetet `e50235e7`:
- **Instängd bakgrund.** Ligger två produkter kant i kant sluter deras konturer ihop en ficka av bakgrunden som `fill_holes` fyller. Hitta den som en liten **inre** komponent (`m & ~vit`) — produktinsidorna är 100 000+ px, fickorna några tusen — och radera allt under tröskeln, med några px utvidgning för antialias-fransen.
- **Testa mot `vit`, inte mot `kontur`.** Slutningen bryggar över smala springor och sväljer just de fransar du vill bli av med, så de aldrig dyker upp som egen inre komponent. Med `kontur` låg tre orange flisor kvar längs sömmen; med råa `vit` försvann de.

**Ingen slagskugga på den här sorten.** Produkterna bär redan leverantörens egen 3D-skuggning och ligger i en solfjäder utan underlag. Med skugga blir den vita konturen synlig som en dekal-kant; utan skugga försvinner den helt mot vitt. Konturen ska däremot **inte** eroderas bort — vit på vitt syns den ändå inte, och erosion äter produktens egna kanter.

> 🔍 **Läs etiketten i källbilden INNAN du väljer den som hjälte.** Leverantörsfiler kan vara trasiga. Hudvårdssetets bild 2 hade en förstörd tub: finstilta raderna utsmetade och `100g/` bortsuddat (`(/3.53oz.`). Maskningen var perfekt och felet följde ändå med hela vägen till butiken — Leonard såg det på tio sekunder. Zooma in varje etikett med `Read` **på källan**, inte bara på resultatet, och byt källa om texten inte går att läsa.

> 🔑 **Saknar galleriet en användbar källbild — hämta leverantörens original ur mappningen.** `FyndplatsMappings.imageAnalysis` sparar URL:erna till alla leverantörsbilder vid import. **AliExpress mediadomän (`ae-pic-a1.aliexpress-media.com`) svarar 200 härifrån även om produktsidan är blockerad (302, 0 byte)** — så originalen går att ladda ner när galleriet bara innehåller beskurna varianter. Växelriktaren `043bd5c8` hade ett enda produktfoto i galleriet, en extrem närbild av framsidans vänstra hörn; sex original låg kvar i mappningen och ett av dem visade hela enheten. Upplösningen är dock leverantörens: 800×800 var maxvärdet, alla storlekssuffix (`_960x960.jpg`, `_2200x2200.jpg` …) ger samma fil. Räkna därför fram hjältens sida ur varans NATIVA bredd i stället för att slentrianmässigt ta 1600 — här blev 1400 rätt (1,7× uppskalning + lätt oskarp mask).

> ℹ️ **Nyansering av "u2net klarar inte mörkt-på-mörkt":** det som fälls är **tunna utskott** mot mörk bakgrund (slang, flätad kabel, lösa klämmor). En solid mörk kropp mot mörk bakgrund går ofta utmärkt — växelriktaren, nästan svart mot mörkblått, gav en enda komponent med 100 % av alfan och alla ventilgaller och flänsar intakta. Testa innan du drar slutsatsen att Metod A behövs; här var Metod A dessutom förbjuden av etikettregeln ovan, eftersom effektangivelsen står tryckt på höljet.

**H-E – per-produkt-rembg ur en flatlay (när enda hela källan är en full-bleed miljöbild):**

Kör **inte** rembg på hela flatlayen — modellen letar ETT dominant motiv och gav mos på fem varor (behöll rosa papper, tonade bort tre produkter). Kör den i stället på **en generös låda runt varje produkt** och komponera ihop dem efteråt. Behåll lådornas inbördes placering: det är leverantörens komposition, och varje varas vinkel och ljus hör ihop med den.

Två saker gör metoden ren:
- **Kastskuggan skiljs på ALPHA, inte på luminans.** rembg tar med skuggan på pappret men ger den låg alpha — varan låg på 246–254, skuggan på 113–216. Ett luminanströskel-försök åt i stället upp flaskans mörka bottenband och hade ätit den mörkgröna tuben helt (lum ≈ 123). Ta kärnan på `alpha > 225`, största komponenten, `fill_holes`.
- **Bygg om kanten, ärv den inte.** Originalets yttersta pixlar är halvt papper; behåller man dem mot vitt syns en rosa/grön brätte längs varje vara. Erodera en pixel in i varan och gör en egen mjuk kant (`gaussian_filter(0.8)`), så överlever ingen pappersfärgad pixel.

Kontrollera till sist att ingen produkts slutliga bbox rör sin lådkant — då är den beskuren och lådan måste växa.

**H-F – bygg om ljuset (produkter som SJÄLVA lyser):** `scripts/hero/lyshero-vit.py`

Regeln "en tänd LED-produkt mot mörk botten går inte att flytta till vitt" står kvar — men den betyder inte att produkten saknar vit hjälte. Den betyder att man måste **bygga om ljuset i stället för att flytta det**.

Urklipp misslyckas här av två skäl samtidigt: glöden finns bara som ljus tillagt i mörker, och själva varan är vit. Hexagonlampan `f267a4e2` hade dessutom bara två hela källor — ett beskuret garagefoto och leverantörens 3D-render mot marinblå botten. Rakt urklipp av rendern mot vitt gav ett spöke: vita rör på vit botten syns inte alls.

Gör så här i stället:

1. **Mät hur varan faktiskt ser ut mot LJUST underlag** i något av leverantörens egna foton. Lägg ett tvärsnitt vinkelrätt genom röret och skriv ut luminansen. På hexagonlampan (a3, x=700/780/860) mättes: tak ~190 → ljusspill upp mot 235 → **mörk kåpkant ned till ~90–165** → mättad vit kärna 255 i ~15 px → spill faller av mot ~155.
2. **Den mörka kanten är hela bilden.** Ett lysande vitt rör syns mot ljus botten tack vare plastkåpans skuggade fläns — inte tack vare glöden. Första försöket satte kanten på 196–212 och lampan försvann; 132–154 gjorde den till ett fysiskt föremål.
3. **Botten får inte vara 255.** Ljus kan bara visas som något ljusare än sin omgivning. Lägg hörnen runt 218 och lyft mot 255 närmast varan (brett spill σ≈110 för rummet, tajt σ≈22 för halon). Kunden läser det som vitt, och det är fysiskt sammanhängande.
4. **Geometrin tas ur leverantörens render, pixel för pixel.** Största ljusa komponenten är lampan; måttpilar och text ligger som egna komponenter och faller bort av sig själva. Rendern är nedtonad mot sin mörka botten — lyft med `255 − (255 − rgb) · 0,5` så rören blir vita men silverdetaljen i kopplingsnoderna överlever.

> ⛔ **H-A är förbjuden även här**, trots att lampan saknar tryckt text. Vi säljer på **antal** och **mått** — "fem hexagoner", "24 LED-rör", "244 × 170 cm" — och en generativ omritning räknar fel på precis den sortens saker, exakt som den skrev om finstilen på hudvårdstuben. Etikettregeln gäller allt som är räknebart eller mätbart i bilden, inte bara bokstäver.

**H-G – vit hjälte ur en bokeh-bild (rembg + separat mask för mörka delar):** `scripts/hero/bokeh-hero.py`

Den snyggaste produktbilden ligger ofta INTE på vit botten. Julgranståget `91de8b52` hade sin hjälte hämtad ur en vit remsa på 3,7:1 — varan fyllde en tredjedel av kvadraten och remsan släpade dessutom med leverantörens gyllene notgrafik och en avskuren gran. Den största, skarpaste bilden av hela ekipaget låg i stället mot bokeh, på 1,7:1. Ta den och byt botten.

- **rembg ensamt räcker inte när varan har svarta delar.** u2net gav rälsen alpha ≈ 0,5, och halvgenomskinligt svart mot vit botten blir **grått**. Rälsen såg urblekt ut fastän masken "fungerade". Lägg en egen luminansmask ovanpå: här låg rälsen under 130 och bokehn aldrig under 181, så `np.maximum(rembg_alpha, lum < 130)` gav den solid. Mät alltid bakgrundens minsta luminans innan du väljer tröskel.
- **Låt det som bleder i källan fortsätta bleda.** Rälsen går ut ur vänsterkanten och nederkanten i originalet. Ankra kompositionen mot dukens nederkant så den gör det även i hjälten — klipper man av rälsen mitt i den vita ytan hänger den i luften.
- **Kolla efter fragment ur grannbilden.** Beskärningen tog med underkanten av ringen ovanför, som blev en rad sliprar svävande över tåget. Behåll bara den största sammanhängande komponenten.

**H-H – hjälten fanns redan, fel bild var vald:** `scripts/hero/vitbotten-hero.py`

Innan du bygger något: **kontrollera om leverantören redan har en hel bild mot ren vit botten.** Fågelbogungan `560760da` hade sin hjälte beskuren ur MÅTTSKISSEN — sitsen kapad av bildkanten, två tredjedelar rep och tomrum, och en kvarglömd streckad måttlinje uppe till höger. Hela gungan låg samtidigt i en annan leverantörsbild mot exakt 255-vitt. Där behövs ingen maskering alls: mät varans bbox, beskär, skala och klistra på en vit duk. Kolla bakgrundens faktiska värden först (`a.min(axis=2) < 235` + största komponenterna) — är den redan 255 rakt igenom är arbetet gjort.

> ⚠️ **Två färgvägar i samma bildset är en fälla.** Gungans måttskiss visar en BRUN sitsduk (RGB ≈ 50,33,26); alla övriga leverantörsbilder och vårt eget materialkort visar en SVART (≈ 37,37,37). Den gamla hjälten ledde alltså med undantaget. Mät sitsens/ytans faktiska RGB i varje källa innan du väljer hjälte, och led aldrig med den variant som bara förekommer i en enda bild. Notera avvikelsen till Leonard i stället för att gissa vilken som skeppas.

> ℹ️ **Människor i hjälten är rätt val ibland.** För en barnprodukt vars titel lovar "kompisgunga" visar bilden med två barn i både hela varan OCH påståendet. Den döljer dessutom sitsduken, vilket är en fördel när färgen är osäker — vi lovar bara det vi vet.

**H-I – flera rembg-körningar som slås ihop till en mask:** `scripts/hero/flerdelsmask-hero.py`

När produkten består av flera delar i olika färg och ljushet klarar u2net sällan hela scenen i ett svep — och vilken del som tappas beror på beskärningen. Bilbanan `4b127cb9` gav:

| körning | resultat |
|---|---|
| hela bilden | ramp, målbåge och förvaringslåda bra — **startboxen genomskinlig** (mörk plast mot mörkblå vägg) |
| utsnitt runt rampen | startboxen solid — **målbågen tappad** |
| tätt utsnitt runt huset | huset solid |

Lösningen är inte att hitta den enda rätta körningen utan att **köra flera och unionera maskerna**, var och en begränsad till den del den är bra på (`mask_a | mask_b | mask_c`, där b och c maskeras ned till sin egen ruta). Regeln från Metod E gäller alltså även inom en och samma bild: ju mer föremålet dominerar sin ruta, desto bättre alfa.

Två vinster på köpet när man maskerar produkten i stället för att radera bakgrunden: leverantörens rubriktext, inzoomade cirklar och miljö försvinner av sig självt, och **de lösa golvbilarna med dem**. Det senare är viktigt — leverantören visar ofta samma fem bilar två gånger, både på banan och bredvid den, och i en hjälte läser kunden det som tio. Vi säljer fem.

> ⛔ **H-A är förbjuden även här** — "5 banor" och "5 bilar" står i titeln, och generativ omritning räknar fel på antal. Samma regel som för hexagonlampan.

**H-J – genomskinlig produkt mot vitt: mät väggen först:** `scripts/hero/genomskinlig-hero.py`

En klar skiva visar det som ligger bakom den, så normalt gäller samma varning som för LED (Metod F): flyttar man den till vitt försvinner den. **Men det är ett mätbart påstående, inte en regel — mät innan du drar slutsatsen.**

Skärmtaket `fbef53b8` var monterat på en gräddvit husvägg:

| | värde |
|---|---|
| väggen bakom | ~244 |
| polykarbonatskivan | ~223 |
| skivans räfflor | ned mot 184 |
| vitt | 255 |

Skillnaden mellan väggen och vitt är alltså **elva nivåer**. Skivans utseende ändras knappt av bytet, och räfflorna, reflexerna, den svarta ramen och aluminiumlisten bär bilden. Då behövs ingen rekonstruktion alls: hämta silhuetten med rembg, behåll originalpixlarna innanför, lägg vitt utanför.

Regeln blir: **ta silhuetten, inte alfan.** För ett genomskinligt föremål ska man inte alfa-blanda mot den nya bottnen — det tunnar ut skivan en gång till. Tröskla masken (`alfa > 0,43`), behåll största komponenten, och kopiera in originalets RGB rakt av.

Ligger produkten i stället mot mörk eller färgad botten går det inte: då bär skivan den bakgrundens färg och måste fotograferas om. Leta i så fall efter en annan leverantörsbild med ljus vägg innan du ger upp.

**H-K – hitta varan på TEXTUR när luminansen inte räcker:** `scripts/hero/textur-hero.py`

Mattan `14987bb4` hade en närbild i ett rum som hjälte, beskuren på alla fyra kanter — man såg luggen men aldrig varan. En 160 × 120-matta måste visa sin form.

Leverantörens måttbild visade hela mattan platt, men mot en botten som ligger nästan på samma ljushet: **matta ~199, botten ~227**. Ingen luminanströskel i världen hittar den kanten rent. Textur gör det direkt: luggens **lokala standardavvikelse är ~7,9 medan den släta bottnen ligger på exakt 0**.

```python
lok = ndimage.uniform_filter(lum, 9)
std = np.sqrt(np.clip(ndimage.uniform_filter(lum * lum, 9) - lok * lok, 0, None))
m = ndimage.binary_opening(std > 3.0, iterations=4)
```

Varan är en fylld rektangel, så ingen mask behövs — rad- och kolumnprofil på `m` ger de fyra kanterna. Begränsa profilen till ett grovt område först, annars drar måttpilarna och möbelskissen ut rutan (mitt första försök gav kvot 1,53 i stället för 1,36 av just det skälet).

> ✅ **Gratis rättningsprov: jämför rutans kvot mot måtten i titeln.** 1550 × 1143 px = 1,356 mot 160/120 = 1,333. Två procents skillnad är luggens mjuka kant. Hade jag fått 1,53 hade rutan varit fel — och det märks utan att man ens tittar på bilden.

Lägg en mjuk kontaktskugga under (offset ~16 px, `gaussian_filter(26)`, 17 % styrka), annars svävar en platt vara mot vitt.

**Ta bort ett slutsålt variantval (V3):** filtrera bort valet ur `options[].choicesSettings.choices` OCH dess variant ur `variantsInfo.variants` i **samma** PATCH med `fieldMask: ["options", "variantsInfo"]` — delar man upp det blir det 428 `MISSING_VARIANT_OPTION_CHOICE`. Den kvarvarande varianten **behåller sitt id**, så lagersaldo, pris, SKU och mappningens `wixVariantId` överlever orörda (verifierat på klösträdet `30e1851b`: 100 st och 859 kr kvar efter). Wix städar dessutom bort den föräldralösa lagerposten själv — ett `DELETE` på den svarar 404 efteråt. Kom ihåg att ta bort raden ur mappningens `variants` också, annars letar lagersynken efter en variant som inte finns.

**H-L – hjälten var redan vit men fel beskuren:** `scripts/hero/miniatyr-hero.py`

En vit botten betyder inte att hjälten är gjord. Paviljongen `d78f7211` låg redan mot 255-vitt men var en dålig beskärning av leverantörens original: högra sidan och möblernas underkant kapades av bildkanten, **och uppe i högra hörnet låg ett löst fragment kvar av den inzoomade miniatyr som originalet har där**. Originalet visar hela varan.

Miniatyren och varan går att skilja åt utan risk med komponentmärkning — paviljongen 1,26 Mpx, miniatyren 0,15 Mpx. **Men verifiera överlappningen innan du raderar**, för deras y-intervall snuddar vid varandra (varan börjar y 488, miniatyren slutar y 535) även om de inte möts i x-led:

```python
overlapp = int(vara[my0:my1, mx0:mx1].sum())
if overlapp:
    raise SystemExit("varan ligger i miniatyrens ruta – radera inte blint")
```

> 🔁 **Leta efter samma fel i KORTEN.** Spec-kortet för paviljongen var byggt av exakt samma trasiga beskärning och bar därför samma svävande fragment. Har du hittat en defekt i en beskärning, sök igenom galleriets övriga bilder efter den innan du släpper produkten — den följer med överallt där samma urklipp återanvänts.

När kortets foto byggs om: fotorutan i `card_spec` har kvot 1,64 medan paviljongen är 1,36. **Fyll ut i SIDLED med vitt** i stället för att beskära — en beskärning hade kapat taket.

**H-M – när varje vit källa har något ivägen, ta miljöbilden i stället:** `scripts/hero/miljobild-hero.py`

Reflexen är att välja den källa som redan ligger mot vitt. Pop-up-tältet `3eb52634` visar varför det kan vara fel val. Mät ÖVERLAPPNINGEN innan du bestämmer dig:

| källa | botten | problem |
|---|---|---|
| a0, collage | vitt | den gula infällda cirkeln (centrum 1510, 1630, radie 284) skär in i tältväggen — väggens underkant ligger på y ≈ 1447, så bågen döljer en lins **434 px bred och upp till 101 px djup** |
| a2, måttbild | ljusgrön | måttstapeln "1,82 m" ligger tvärs över dörröppningen |
| a1, miljöbild | gräs och himmel | inget ivägen — tältet helt och oskymt |

De två vita källorna hade krävt att man **hittar på produktpixlar** för att fylla igen. Miljöbilden krävde bara en bakgrundsborttagning, och gräs mot mörkgrå duk är hög kontrast som u2net klarar utmärkt. Räkna ut hur stor rekonstruktionen skulle bli innan du väljer — 434 × 101 px påhittad vägg är dyrare än en rembg-körning.

> ⚠️ **Kantbrätten: filtrera inte på färg, bygg om.** Första försöket tog bort gräsgröna pixlar i en 7 px-remsa längs alfakanten. Det åt upp antialiasingen där duken möter gräset och gav en **sågtandad vägg**. Rätt åtgärd är Metod E:s regel: erodera 2 px in i varan och gör en helt egen mjuk kant (`gaussian_filter(0.9) * 1.18`). Då överlever ingen gräsfärgad pixel, och kanten blir rak.

Ett urklipp ur en miljöbild behåller det man ser genom varan — här bord, stolar och huset genom tältets dörröppning. Det är sant och läses som genomsikt, så låt det vara.

Även här gällde regeln från Metod L: **spec-kortet var byggt av samma trasiga beskärning** och bar samma gula fragment. Ombyggt.

**H-N – variantbilder: en per färg, identiska så när som på färgen:** `scripts/hero/varianter-hero.py`

När produkten har färgval är hjälten inte en bild utan en uppsättning. **Den enda regel som spelar roll är att de ska vara utbytbara** — samma skala, samma placering, samma botten — så att bilden inte hoppar när kunden klickar mellan färgerna. CarPlay-adaptern `e932fcb2` hade silver på 823 px bredd och orange på 858; varan flyttade och skalade om sig vid varje färgbyte.

Bygg alla ur samma sorts källa i en och samma loop, med samma måltal, och **lägg in ett poseprov**: källornas rutor ska ha samma kvot efter normering, annars är det inte samma vinkel och då får de inte skalas efter varandra.

```python
kvoter = [w / h for w, h in rutor.values()]
if max(kvoter) - min(kvoter) > 0.04:
    raise SystemExit("källornas rutor har olika kvot – inte samma pose")
```

> ⚠️ **Grå gloria kommer oftast av vår egen bearbetning, inte av källan.** Mät innan du skyller på leverantören: de gamla bilderna hade bakgrund 254 och en kant som tonade ut över ett tiotal pixlar (249 → 242 → …), medan originalet är rent — 255 rakt in, 6 px mjuk kant, sedan produkten på 3. Glorian uppstod i uppskalningen till 1400 px från en 336 px-källa.

> 🔒 **Byt variantbilder i TRE steg — Wix låser dem.** Ett försök att ersätta dem rakt av ger `404 PRODUCT_MEDIA_NOT_EXIST: Products must include media files linked to choices`, eftersom `linkedMedia` fortfarande pekar på de gamla. Ordningen är: (1) PATCH:a in de nya bilderna **utan** att ta bort de gamla, (2) peka om `options[].choicesSettings.choices[].linkedMedia` till de nya (skicka `variantsInfo` verbatim i samma PATCH, annars 428), (3) PATCH:a bort de gamla — nu när inget längre länkar dem. Media-ingesten är asynkron, så verifiera med en re-GET och försök om tills alla val pekar rätt.

**H-B – rembg-urklipp + uppladdning (sista utvägen – bara om Metod 0 och A båda är uteslutna):**

Tre begränsningar: (1) base64-upp via `UploadImageToWixSite` klarar i praktiken bara **~800 px / ~18 kB** innan strängen blir för stor att överföras rent; (2) **mörk-på-mörk med tunna utskott** (slang, flätad kabel, lösa klämmor) ghostas/tappas av u2net; (3) den ritar om alfakanten, alltså varan. Är bakgrunden redan vit → Metod 0 är både gratis och trognare. Är den rörig → Metod A.

```bash
# u2net-modellen (rembg) hämtas EN gång och cachas i ~/.u2net/u2net.onnx.
# GitHub-releasen är egress-blockad (403) → hämta från Hugging Face-spegeln:
mkdir -p ~/.u2net
curl -sL "https://huggingface.co/tomjackson2023/rembg/resolve/main/u2net.onnx" -o ~/.u2net/u2net.onnx
pip install -q rembg onnxruntime pillow
```

```python
from rembg import remove
from PIL import Image, ImageFilter
src = Image.open("orig.jpg").convert("RGB")     # originalupplösning, utan transform
cut = remove(src)                                # RGBA – produkten urklippt
prod = cut.crop(cut.getbbox())
side = int(max(prod.size) / 0.82)                # produkten ~82 % av en 1:1-ruta
canvas = Image.new("RGB", (side, side), (255, 255, 255))
ox, oy = (side - prod.width) // 2, (side - prod.height) // 2
# mjuk, dämpad kontaktskugga (djup + studiokänsla; INTE platt utklipp):
sh = Image.new("RGBA", (side, side), (0, 0, 0, 0)); m = prod.split()[3]
tmp = Image.new("RGBA", prod.size, (0, 0, 0, 0)); tmp.putalpha(m)
sh.paste(tmp, (ox, oy + int(prod.height * 0.03)), tmp)
sh = sh.filter(ImageFilter.GaussianBlur(18))
r, g, b, a = sh.split(); a = a.point(lambda v: int(v * 0.28)); sh = Image.merge("RGBA", (r, g, b, a))
canvas.paste(sh, (0, 0), sh); canvas.paste(prod, (ox, oy), prod)
canvas.convert("RGB").save("white.jpg", quality=92)
```

Ladda upp `white.jpg` via `mcp__Wix__UploadImageToWixSite` → ersätt item:et på **samma position** i `itemsInfo.items` — samma fullständiga item-objekt med `id` i toppnivån som i punkt 4 ovan (`{"url": …}` ensamt ger `400 id or url must not be empty`). Position 0 = `media.main` = produktkortet. Skicka **hela** arrayen; skrivreglerna står i runbookens Steg 9.

> **Guardrail (obligatoriskt):** öppna resultatet med `Read` och **titta** innan du ersätter. Tunna kablar/lösa smådelar kan klippas fel (halo eller avklippt del). Ser det fel ut → **behåll originalet** och flagga (före/efter-preview i chatten). **Radera aldrig originalfilen** (städas i orphan-svepen). Var bilden `linkedMedia` för ett variantval: koppla om valet till det **nya** media-item-id:t (Steg 11B).

-----


-----

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


-----

## Avancerad retusch (flera problemzoner samtidigt)



> Detta är **fördjupningen**. Vanliga fall klaras av T-metoderna (tvätta text/logga),
> 3c (vit hjälte) och 3d (bygg svenska kort). Läs hit när en bild har flera
> problemzoner samtidigt, eller när en zon ligger ovanpå strukturerad bakgrund.

Rå-importens sekundärbilder (pos 1+) är ofta leverantörs-infographics med engelsk/
kinesisk text, VEVOR-branding, måttpilar och insatscirklar. Målet: **varje bild ska
se ut som ett eget professionellt foto — retuschen får inte synas överhuvudtaget.**
Signalen "produkten är bildpolerad" = galleriet innehåller **Fyndplats spec-/feature-kort**
(gräddvit `(250,248,243)` + orange logga).

**Arbetsgång per produkt.** Verktyget är **`scripts/cardkit.py`** (`hero_white` ·
`crop` · `grid_overlay` · `card_photo` · `card_grid` · `card_spec` · `render`).
Behövs LaMa-inpainting utöver det, se `T-C` — den installeras bara vid
faktiskt behov och har inte krävts på ~40 produkter.

1. **Ladda ner galleriet i full upplösning** och gör en kontaktkarta (se bildgenomgången i Steg 4 —
   **en** rutnätsbild, inte N separata `Read`). Identifiera per
   bild: ren produktbild (behåll orörd) / foto med textoverlay (rensa) / ren
   leverantörs-spec (ersätt med svenskt kort) / **variant-/måttblad som visar en specifik
   variant (behåll & städa — se variant-regeln nedan, släng ALDRIG)** / äkta dubblett (släng en).
2. **Mät koordinater med rutnät** — `ck.grid_overlay(src, dst, 0.05)` ritar linjer med
   procent-etiketter; läs av exakta boxar ur den och beskär med `ck.crop(src, dst,
   x0, x1, y0, y1)` (relativa 0–1-koordinater).
   Gissa ALDRIG koordinater ur minnet; det är största felkällan.
3. **Välj teknik per zon** (i fallande prioritet):
   - **Komponentrekonstruktion** (vit-bakgrundscollage): behåll stora sammanhängande
     regioner (foton/produkt), släng små (text), bygg om på vit duk. Pixelperfekt,
     ingen retusch alls → använd alltid när bakgrunden är vit. Fungerar EJ när
     pilar/streck binder ihop text med produkten till en komponent.
   - **LaMa-inpainting** för text/loggor/piller över foton. Regler: **smala masker
     per element** (aldrig en stor box över flera element — ger dimma/plattor);
     maskmarginal ~10–15 px UTANFÖR elementets kant (annars förlänger LaMa
     elementets färg); färgpredikat (`m_orange`, `m_dark(t)`, ljus-mask) hellre än
     `m_all` när elementet ligger nära produkt; kompositera resultatet in i
     originalet (bara maskzonen ändras).
   - **Exakt bandbeskärning** när texten ligger i ett rent kant-band/kolumn utan
     produkt/person: skär EXAKT vid bandets kant, inget mer. Aldrig hårda inzoomningar
     som kapar människor eller produkt.
   - **Planpassning + kornighet** (`plane_fill`) för stora ytor på släta väggar/gradienter.
   - **Klonstämpel/HF-transplantat** för texturer (gräs/trä) — verifiera att källan är
     ren och på samma skärpedjup; spegla inte riktade texturer (chevron-artefakter).
4. **QC vid 100 % zoom på varje redigerad zon före publicering.** Leta: spökbokstäver
   (vita halos — öka dilation), färgtoner, dimfläckar, brutna kantlinjer, tile-skarvar.
   Iterera tills osynligt. **Går det inte att göra osynligt → bilden utgår.** Hellre
   färre perfekta bilder än en synlig retusch.
5. **Bygg Fyndplats-kort** med `scripts/cardkit.py`: `card_spec(out, foto, kicker,
   titel, [(nyckel, värde), …])` (produktbild + verifierat spec-rutnät, 6–10 rader)
   och `card_photo` / `card_grid` för feature-kort. **Alla siffror ska vara
   avlästa ur källbilder/beskrivning — aldrig gissade.** Vid flera varianter med olika
   mått: ett spec-kort per variant, länkat till respektive choice (Steg 11-reglerna).
6. **Ta bort dropship-branding även i bilder** (VEVOR-logga på väska/produktfoto →
   LaMa bort). Produktens egen förpackning i bild är OK.
7. **Uppladdning:** committa bilderna till en orphan-gren med prefixet `claude/img-…`
   (git worktree, force-push OK — push-behörigheten godkänner bara `claude/`-prefixet,
   se T-avsnittet) → `UploadImageToWixSite` med raw-GitHub-URL →
   patcha `media.itemsInfo.items` (hela arrayen + svenska alt-texter, ALDRIG
   `media.main`) och omlänka ev. variant-choice-bilder (options + variantsInfo
   ordagrant tillsammans).

> ⚠️ **Variantbilder — varje variant som SER OLIKA UT ska ha sin EGEN bild (Leonard-krav, 2026-07-19, hårt).**
> Skiljer sig varianternas *utseende* (olika modell/design/form/storlek — t.ex. bänkar med olika
> ryggstöd, stege med 4 vs 5 steg, väska 16" vs 20", basketställning med olika backboard) → du får
> **ALDRIG** kollapsa dem till en gemensam bild eller ersätta de olika variant-/måttbladen med **ETT
> gemensamt kort byggt ur hero**. Kunden måste se exakt den variant hen väljer.
> - **Behåll (eller återställ) leverantörens differentierade variant-/måttblad — ett per variant.**
>   Original hämtas från `https://static.wixstatic.com/media/<mediaId>~mv2.jpg` **även efter** att de
>   tagits ur galleriet (filen lever kvar i Media Manager tills orphan-svepen).
> - Städa bara bort **VEVOR-loggan** (vit boxfyll `ImageDraw.rectangle` på vit bg, annars LaMa) och
>   ev. stor **engelsk marknads-/spec-panel** (beskär bort halva bilden). **Måtten (cm/tum/mm)
>   BEHÅLLS — de är inte fula och behövs för att skilja varianterna.**
> - Länka varje choice till sin egen bild: `linkedMedia:[hero, <variant-egen-bild>]` (Steg 11B).
> - **Undantag där gemensam bild ÄR rätt:** varianten ändrar inte utseendet — ren **färgvariant utan
>   separat källfoto** (t.ex. PCP svart/silver, bara en pump fotad) eller **kapacitets-/måttvariant på
>   fysiskt identisk produkt** (t.ex. slangvagn 76/91 m — samma vagn). Då räcker gemensam bild + värdet i texten.
> - **Verifiera efteråt:** GET `VARIANT_OPTION_CHOICE_NAMES` och kontrollera att varje choice har ett
>   **unikt** `linkedMedia`-id (utöver hero). Två olika-seende varianter som pekar på samma icke-hero-id
>   = fel. (Rättat i efterhand på bänk/stege/väska/basket 2026-07-19 — gör aldrig om det.)

### När etiketten sitter PÅ produkten (2026-08-24, transportvagnen)

Komponentrekonstruktionen ovan säger att den inte fungerar när pilar/streck binder ihop
text med produkten. Det stämmer — men **den bindningen är också lösningen**, och innan du
retuscherar ska du fråga om etiketten ska bort alls.

> 🚨 **Fråga först: måste måttet bort?** Transportvagnens tre hjul bar "46cm/18.11in",
> "25cm/10in" och "86cm/33.8in" tryckta på gummit. Jag transplanterade in rena hjul från
> en annan leverantörsbild. Tekniskt lyckat — och Leonard förkastade det: *"Såg inte bra
> ut. Du kanske kan låta måtten som fanns på däcken finnas kvar så däcken inte ser
> konstiga ut."*
>
> Han har rätt. Ett transplantat bär den andra bildens **ljussättning och skärpa** med
> sig, och blir det för jämnt och för mjukt lyst mot resten av fotot läser det som en
> påklistrad dekal — den skarpa nätsidan bredvid gjorde kontrasten värre. **En retusch
> bedöms mot bilden den sitter i, aldrig mot sig själv.** QC:a både inzoomat **och** i den
> storlek kunden faktiskt ser. Ett mått tryckt på ett däck är dessutom information, inte
> skräp; det blev konstigt först när jag försökte ta bort det.

**Metod 0c — behåll det som rör produkten, släng det som svävar fritt.** På en
leverantörs-**måttritning** är bilden redan uppdelad åt dig: måtten vars pilar når fram
till varan sitter ihop med den i samma sammanhängande komponent, medan de yttre måtten
ligger fritt på vit botten som egna komponenter. Kartlägg dem i stället för att gissa —
`ndimage.label` plus en overlay med numrerade bboxar — och behåll produktkomponenten plus
de mått du vill ha kvar. Ingen mask, ingen målning, ingen rörd produktpixel.

Transportvagnens a8 bestod av 32 komponenter: nr 6 (vagnen + 46/25 cm-texterna +
86 cm-pilen), nr 21 + 23 (86 cm-texten), och 29 komponenter till för banderollen och de
fem yttre måtten 97/52/23/50/76 cm. `BEHALL = {6, 21, 23}` gav exakt "vagnen med
däckmåtten kvar".

> ⚠️ **Spärra på komponentnivå, inte med rektanglar.** Hjulen sticker in i 50 cm- och
> 76 cm-måttens ytor, så en rektangelkontroll där träffar vagnen i stället för måttet (den
> fällde två gånger innan jag bytte). `assert set(np.unique(lab[behall])) - {0} == BEHALL`
> är exakt. Rektangel-spärrar bara där de bevisligen ligger utanför produktens bbox.

**Måste du ändå retuschera** — texten sitter på varan och det finns ingen ritning att
plocka isär — gäller tre regler, alla köpta med misslyckade försök på samma bild:

> ⚠️ **1. En inpaint-mask får bara ligga på EN yta.** Biharmonisk fyllning interpolerar
> mellan maskens ränder. En rektangel som spänner från vit botten in på svart gummi ger en
> **grå smet** som äter både produktens kant och det som råkade ligga i vägen. Dela zonen
> per yta: vitt blir vitt, en rak stång ritas om som radkopia av sitt eget tvärsnitt
> (uppmätt lutning), och bara gummit fylls biharmoniskt — med rutans ränder på gummi hela
> vägen runt.
>
> ⚠️ **2. Kantregelns tröskel avgör vad som är "fritt".** Kantregeln (behåll bara klumpar
> som INTE rör zonens kant) är rätt verktyg för text som flyter i vitt — men vid tröskeln
> 242 hänger en siffra ihop med däcket via dess **mjuka skugga** och räknas som produkt.
> Tryckt text är nästan svart: vid `L < 45` stod siffran fri som en enda klump. Mät
> tröskeln, och `assert` att masken blev **en** klump.
>
> ⚠️ **3. Bygg aldrig en donator-mask på ljushet.** Vid transplantation maskade jag
> `mean(2) > 200` över hela hjulskivan för att fånga textens ljusa kant — och tog
> **kromnavet** (L 200–240), ekrarna och den vita fondremsan bakom däcket. Rotations-
> kopieringen malde sönder navet till ett svart plask. Maska på **färg + läge**, och lägg
> in spärren som en assertion: `assert not (mask & nav).any()`.

Fungerar transplantation ändå bäst i ett visst fall: låna en ren instans av samma detalj
från en annan bild av samma produkt (slår all syntes) → rotationskopiering runt
hjulcentrum (mönstret repeterar runt omkretsen) → biharmonisk fyllning på **en** slät yta.
Färgmatcha med en ren **nivåförskjutning** mellan två verifierade rutor av samma material
med jämförbar spridning — inte gain, och aldrig objektmedelvärden mot varandra. Låt
klistermasken följa **innehållet** (gräs/teal/vit fond ut) i stället för en cirkel.

**Beslutsträd vid problemzoner:** text över slät bakgrund → LaMa · text i kantpanel →
bandbeskärning · stort grafikelement mitt i strukturerad bakgrund (handtag, bordskant,
gräs) → försök LaMa/geometrisk omritning, max ~3 iterationer, annars utgår bilden ·
element som täcker både produkt och bakgrund → LaMa med produkt-skonande färgpredikat.


-----
