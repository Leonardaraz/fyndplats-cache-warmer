# Syskon – lägg en artikel som färg eller storlek på en publicerad sida

> **När** ett syskon ska bli ett val står i [`seo-polish-runbook.md`](../seo-polish-runbook.md)
> under *Dubblettskärmen* och *Syskon blir val på sidan*. Den här filen beskriver **hur**
> verktyget fungerar: inputs, lägen, hinder och vad som händer om något går fel.
>
> Koden finns i `lib/aosom/sammanslagning.ts` och rutten i
> `/api/admin/aosom-sammanslagning`. Workflowen heter **"Dubbletter — lägg ett utkast som
> färg eller storlek på en publicerad sida"** (`.github/workflows/aosom-sammanslagning.yml`).
> Planen är aktuell per #666 (2026-09-27).

## Vad den gör

En Aosom-artikel blir en **variant** på en publicerad Aosom-sida. Varianten ligger på
optionen `Färg`, på `Storlek` eller på båda. Efteråt har sidan en artikel per variant.
Synken speglar varje variants saldo och pris för sig, beställningsfilen beställer den
variant kunden valde, och importens dubblettspärr ser alla artiklarna. Allt det läser
artiklarna via `lib/aosom/artiklar.ts`.

Verktyget lägger till ett syskon per körning. En familj med sju färger kräver alltså sex
körningar.

## Inputs

| input | när |
|---|---|
| `mode` | `plan` (standard) skriver ingenting. `byt` skriver. |
| `behall` | Den **publicerade** sidan som behålls (Wix-produkt-id). |
| `utkast` | Givaren, oftast ett utkast. En publicerad sida går också, men kräver `omdirigera=ja`. |
| `farg_utkast` | Givarens färg. Krävs när sidan har eller får färgval. |
| `storlek_utkast` | Givarens storlek. Krävs när sidan har eller får storleksval. |
| `farg_behall` | Sidans egen färg. Anges **bara** när sidan får färgval i den här körningen. |
| `storlek_behall` | Sidans egen storlek. Anges **bara** när sidan får storleksval i den här körningen. |
| `omdirigera` | `ja` när givaren är publicerad. Se [Publicerad givare](#publicerad-givare). |
| `sku` | Den nya variantens SKU. Lämnas fältet tomt blir SKU:n sidans SKU plus givarens nya värden. |
| `bilder` | Givarens bilder som följer med, 1-baserat (`1,2`). Se [Bilder](#bilder). |

Värdena stavas som i butiken (`Grå`, `110 × 85 cm`). Skriver du `grå` på en sida som har
`Grå` räknas det som samma val, så Wix får inget dubbelval. En färg har 2–30 tecken och
bara bokstäver, mellanslag, bindestreck och snedstreck. En storlek har högst 30 tecken och
får innehålla siffror, bokstäver, `×`, `x`, komma, punkt, snedstreck och bindestreck, men
inte ha formen av ett artikelnummer. Värden utanför det ger `farg_ogiltig` eller
`storlek_ogiltig`.

Vilka axlar sidan får beror på vad den har från början:

| sidan har | du anger | resultat |
|---|---|---|
| inga val | `farg_utkast` + `farg_behall` | färgaxel, två varianter |
| inga val | båda axlarna, för givaren och för sidan | två axlar, två varianter |
| färg | `farg_utkast` | en variant till, och ett nytt färgval om färgen är ny |
| färg | `farg_utkast` + `storlek_utkast` + `storlek_behall` | storleksaxeln läggs till, och de gamla varianterna får sidans storlek |
| färg + storlek | `farg_utkast` + `storlek_utkast` | en variant till, med nya val bara där värdet är nytt |

Alla kombinationer behöver inte finnas. Wix tillåter färre varianter än kombinationer, och
butikens väljare dämpar en kombination som saknas. Planen skriver ut hur många som saknas
(`saknadeKombinationer`).

## Lägen

Planen anger ett `tillstånd`:

- **`ny`**: sidan har inga optioner än. Optionerna skapas med två varianter.
- **`utoka`**: sidan har redan optioner från en tidigare sammanslagning. Verktyget lägger
  till en variant, och vid behov ett nytt val eller en ny axel.
- **`wix_klar`**: en tidigare körning föll efter Wix-skrivningen. Bara resten görs.
- **`klar`**: artikeln sitter redan på sidan. Bara efterarbetet görs, till exempel för en
  publicerad givare.

## Arbetsgång

1. **Kör `plan`.** Läs `axlar`, värdena efteråt, `nya varianten`, `SKU`, antalet bilder,
   varningarna och hindren. Planen visar kundpriser och saldon, aldrig artikelnummer eller
   inköpspris, eftersom loggen är publik.
2. **Åtgärda hindren** (tabellen nedan) och kör `plan` igen tills listan är tom.
3. **Granska bilderna** som följer med. Titta på dem, läs inte bara filnamnen.
4. **Kör `byt`.** Ordningen är: bilderna läggs i sidans galleri, optionerna, varianterna och
   lagret skrivs i ett anrop (`products-with-inventory`), valen kopplas till sina bilder, och
   Wix läses tillbaka. Faller variantskrivningen tas de nya bilderna bort igen. Mappningen
   skrivs först när återläsningen stämmer och varje val har sin bild. Därefter pensioneras
   givaren.
5. **Kontrollera live.** Välj varje färg på sidan och se att bilden byter till rätt färg.
   Kontrollera också att varje kombination har rätt pris och lagerstatus.
6. **Rätta texten.** Namnet får inte nämna en enda färg eller ett enda mått. `Färg:`-raden
   ska räkna upp alla färger och `Mått:`-raden alla mått. Planen varnar när beskrivningen
   nämner sidans värde.

## Bilder

**Varje färg ska ha en egen bild kopplad** (`linkedMedia` på valet). Produktsidan byter
till den bilden när färgen väljs, och Google-flödet ger varje färgvariant just den bilden.
En färg utan kopplad bild visar produktens huvudbild, alltså fel färg, både på sidan och
i Google Shopping.

Så väljer verktyget bilder:

- **En ny färg** får givarens huvudbild om du inte anger `bilder`.
- **En ny storlek i en färg sidan redan har** får ingen bild, eftersom den visar samma vara.
- **En sida utan val som får färg** kopplar sin egen färg till sin huvudbild.
- **En storlekssida som får färg** behåller storlekarnas bilder, och sidans egen färg får
  ingen bild. Det är med flit: annars skulle alla storlekar visa samma foto.
- **Ett val som redan har en bild** behåller den. Skulle kopplingen tappas vid skrivningen
  kopplas den om vid återläsningen.

Återläsningen väntar på kopplingen, eftersom Wix tar emot bilden asynkront. Den försöker
upp till åtta gånger med 2,5 sekunders paus. Hinner en bild inte kopplas stoppar körningen
(`… val saknar kopplad bild … mappningen skrevs INTE`), och givaren pensioneras inte. Kör
`byt` igen. Omkörningen ser `wix_klar` och kopplar bilderna. Tills dess är varianten
omappad: nästa synk nollar dess lager, och beställningsfilen håller en order på den.

☠️ **Bara granskade bilder.** 46 % av feedens bilder har tysk text inbränd, och en del
har husmärkets logotyp. Ett utkast är opolerat, så ingen har tittat på dess bilder.

☠️ **Huvudbilden måste visa syskonets färg.** Gör den inte det anger du med `bilder` en
bild som gör det. Den första bilden i `bilder` är den som kopplas till färgen, så sätt den
först. Finns ingen sådan bild slår du inte ihop.

## Publicerad givare

Två publicerade sidor för samma vara är en dubblett. Med `omdirigera=ja` görs detta i
ordning:

1. Givarens recensioner **kopieras** till sidan vi behåller. Givarens egna rader rörs
   inte. Avvisade recensioner och sådana som redan finns på sidan, med samma id eller samma
   text, hoppas över.
2. En **301** skrivs från givarens adress till sidan, innan givaren avpubliceras, så
   adressen aldrig svarar 404. Äldre omdirigeringar som pekade på givaren pekas om.
3. Givaren **avpubliceras** och läses tillbaka.
4. Givaren **pensioneras**.

Kontrollera själv att sidan vi behåller ligger i givarens kategorier, eftersom planen inte
gör det. Den varnar bara.

## Hinder

Hindren stoppar körningen. Varningarna stoppar ingenting men ska läsas.

| hinder | betyder | gör så här |
|---|---|---|
| `inget_val` | Ingen av `farg_utkast` och `storlek_utkast` är angiven. | Ange givarens värde. |
| `samma_produkt` | `behall` och `utkast` är samma id. | Rätta id:na. |
| `behall_saknar_mappning`, `utkast_saknar_mappning` | Id:t saknar mappningsrad. | Kontrollera id:t. |
| `behall_saknas_i_wix`, `utkast_saknas_i_wix` | Produkten finns inte i Wix. | Kontrollera id:t. |
| `behall_ej_aosom`, `utkast_ej_aosom` | Sidan eller givaren är inte en Aosom-mappning. | En AliExpress-sida kan inte ta emot syskon. Mappa om den först, eller gör syskonet till en egen sida, se runbookens *Dubblettskärmen*. En givare som inte är Aosom flaggas. |
| `utkast_saknar_artikel` | Givaren har ingen artikel. | Flagga. |
| `samma_artikel` | Givaren har samma artikel som sidan. | Det är en dubblett, inte ett syskon. Pensionera. |
| `artikeln_upptagen` | Artikeln sitter redan på en annan sida. | Utred vilken sida som ska ha den innan du går vidare. |
| `behall_tvetydig` | Sidans mappning går inte att tolka entydigt. | Flagga. |
| `givaren_redan_sammanslagen` | Givaren bär redan flera artiklar. | Välj en givare med en artikel. |
| `utkast_flera_varianter`, `utkast_flera_varianter_i_wix` | Givaren har mer än en variant. | Verktyget tar bara givare med en variant. |
| `annan_axel`, `flera_optioner_stods_inte` | Sidan har en option som inte heter `Färg` eller `Storlek`, eller för många optioner. | Flagga. |
| `behall_har_redan_optioner` | Wix har optioner som mappningen inte känner till, till exempel handlagda. | Flagga. De är inte verktygets. |
| `behall_mappning_saknar_val`, `behall_mappning_matchar_inte_wix`, `behall_variant_matchar_inte`, `behall_flera_varianter` | Mappningen och Wix är inte överens om sidans varianter. | Flagga. Skriv inte för hand. |
| `saknar_farg_utkast`, `saknar_storlek_utkast` | Sidan har en axel som givaren saknar värde på. | Ange givarens värde på varje axel. |
| `saknar_farg_behall`, `saknar_storlek_behall` | En ny axel läggs till utan sidans eget värde. | Ange `farg_behall` eller `storlek_behall`. |
| `farg_ogiltig`, `storlek_ogiltig` | Värdet bryter mot formen ovan. | Skriv om värdet. |
| `farg_lika`, `storlek_lika` | Den nya axeln har samma värde för sidan och givaren. | En axel som inte skiljer något åt är fel. Kontrollera värdena. |
| `kombinationen_finns` | Sidan har redan exakt den kombinationen. | Givaren är en dubblett. Pensionera den. |
| `sku_ogiltig` | Standard-SKU:n bryter mot formen `FP-…` eller fälls av artikelnummerspärren. | Ange `sku` för hand. Storleken står före färgen. |
| `sku_for_lang` | SKU:n har fler än 40 tecken, som är Wix tak. Standard-SKU:n blir lätt för lång. | Ange en kortare `sku`. |
| `sku_upptagen`, `sku_lika` | SKU:n finns redan, på en annan sida eller på den här. | Ange en annan `sku`. |
| `behall_ej_publicerad` | Sidan ligger inte ute. | Publicera sidan först, eller byt håll. |
| `namnet_bar_farg`, `namnet_bar_storlek` | Sidans namn har sidans färg eller storlek. | Skriv om namnet först. Sluggen står kvar. |
| `utkast_saknar_pris` | Givaren saknar pris i Wix. | Flagga. Priset sätts inte här. |
| `bilder_ogiltiga` | `bilder` pekar utanför givarens bilder eller upprepar en bild. | Rätta numren. |
| `behall_saknar_bilder`, `utkast_saknar_bilder` | Sidan saknar bilder, eller givaren saknar bild när den ska föra in en ny bild. | Lägg till bilder först. |
| `utkast_saknas_i_feeden` | Givarens artikel finns inte i feeden. | Vänta på feeden eller pensionera. |
| `utkast_skickas_inte_till_sverige` | Givaren saknar verklig frakt till Sverige. | Slå inte ihop. |
| `behall_saknar_lagerrad` | En av sidans varianter saknar lagerrad i Wix. | Flagga. |
| `utkast_publicerat` | Givaren ligger ute men `omdirigera` är `nej`. | Kör med `omdirigera=ja` om givaren ska bort. |
| `givare_publicerad_saknar_verktyg` | Rutten saknar något som krävs för en publicerad givare. | Flagga. |
| `givaren_har_oppna_ordrar` | Givaren har öppna ordrar. | Vänta tills de är hanterade. |
| `omdirigeringar_for_manga` | Listan över omdirigeringar nådde taket (1 000) och kan vara avkortad. | Flagga. Verktyget vägrar hellre än gissar. |
| `omdirigering_ogiltig`, `omdirigering_krockar` | 301:an går inte att skriva, eller givarens adress pekar redan någon annanstans. | Utred omdirigeringen först. |

Varningar du ska läsa:

- **Beskrivningen nämner sidans värde.** Skriv om texten efteråt.
- **Den nya storleken gör beskrivningens mått ofullständiga.** Skriv om spec-fliken.
- **Kombinationer som saknas** visas som ej valbara.
- **Givarens pris är låst eller styrs av konkurrentregeln.** Från nästa synk följer den nya
  varianten husets regel.
- **Givaren är slutsåld hos Aosom.** Varianten syns som slut tills synken ser lager.

## Säkerhet

- ☠️ **Halvgjort är säkert, och det är med flit.** Faller något efter Wix-skrivningen har
  Wix en variant som mappningen inte känner till. Synken nollar då dess lager och räknar
  den i `okandaVarianter`, så jobbet blir rött. Beställningsfilen håller en order på den.
  Ingen kund kan få fel vara. Kör om, så gör verktyget bara det som återstår.
- ☠️ **Priset rörs inte.** Den nya varianten får givarens pris som det står i butiken, och
  de gamla varianterna behåller sina.
- ☠️ **Svaret har aldrig ett artikelnummer eller en kostnad.** Actions-loggen är publik.
- **En sammanslagen sida skrivs om med `sammanslagna.tsv`** (2026-09-30), aldrig med
  rundans gamla filer, som skulle skriva tillbaka en enda färg. Skrivworkflowen hoppar då
  över SKU-steget och kräver vid återläsningen att alla varianter finns kvar och syns.
- **En färg som finns i feeden men inte som utkast** hämtas med **"Aosom — importera en
  sidas färg- och storlekssyskon"** (`plan`, sedan `importera`). Den tar sidans wix-id,
  inte ett artikelnummer, och tar med rader som nattens import hoppar över för att frakten
  kostar mer än varan. Samma vara som en av sidans färger importeras aldrig.
- **Wix delar valen över hela butiken.** `Färg` hade 293 val och `Storlek` 203 den
  2026-09-27. Välj korta etiketter som kan återanvändas.

## Färger som inte kom via verktyget

AliExpress-sidor och handlagda val har ofta färger utan kopplad bild. Verktyget rör dem
inte. Ska de rättas kopplas valet med samma metod som verktyget använder
(`kopplaValbilder`). PATCH:a `options`, där valet har `linkedMedia: [{ id }]`, och skicka
med `variantsInfo` ordagrant och `visible` explicit, med
`fieldMask: ["options", "variantsInfo", "visible"]`. Bilden måste redan ligga i produktens
galleri. Utan `visible` kan en variantsInfo-PATCH publicera ett utkast.

Läs tillbaka efteråt: variant-id, SKU och pris ska vara oförändrade, och varje val ska ha
sin bild. Finns inget foto i färgen flaggar du till Leonard. Lägg aldrig en annan färgs bild
på valet.

Den 27 september 2026 rättades trehjulingen 6-i-1 på det sättet. Skoskåpet med tre speglade
luckor (vit), tunnelväxthuset 597 × 295 cm (vit) och dieselvärmaren till husbil (röd, blå)
saknar foto i färgen och är flaggade.
