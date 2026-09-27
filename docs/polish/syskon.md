# Syskon – ett utkast blir ett val på en publicerad sida

> Runbooken ([Dubblettskärmen](../seo-polish-runbook.md#dubblettskärmen)) säger **när**
> ett syskon ska bli ett val på en sida i stället för en egen sida. Den här filen säger
> **hur**, och vad verktygen gör och inte gör.
>
> - Hitta syskonen: workflowen **"Dubbletter — hitta färg- och storlekssyskon"**
>   (`/api/admin/aosom-familjer`, `lib/aosom/familjer.ts`). Den skriver ingenting.
> - Lägg in dem: workflowen **"Dubbletter — lägg ett utkast som färg eller storlek på en
>   publicerad sida"** (`/api/admin/aosom-sammanslagning`, `lib/aosom/sammanslagning.ts`).
>
> Båda svarar i en publik Actions-logg och skriver aldrig ut artikelnummer eller inköpspris.

-----

## Vad en sammanslagen sida är

En publicerad Aosom-sida med optionen `Färg`, `Storlek` eller båda, och en Aosom-artikel per
variant. Alla kombinationer behöver inte finnas. Butiken visar en kombination som saknas som
ej valbar. Balansbommen `4fdd8d3c` var den första, med tre färger.

Resten av kedjan läser artikeln per variant via `lib/aosom/artiklar.ts`:

- Synken skriver saldo och pris per variant.
- Beställningsfilen väljer artikel på orderradens variant.
- Google-flödet får en rad per variant.

**Priset:** sammanslagningen rör inget pris, så det nya valet har utkastets pris. Från nästa
synk följer valet husets regel. Ett prislås eller ett konkurrentpris som utkastet hade
följer inte med, och planen varnar för det.

-----

## 1. Hitta syskonen

Kör svepet med `typ` och `lage` satta till `alla`, en gång per runda. Svaret börjar med en
summering och listar sedan varje familj:

```
[färg · en publicerad · 1 P + 3 U · verktyget klarar · prisspann 12 %]
  P <wix-id>  Weiß      99 × 65 × 94  719 kr  saldo 197  <sidans svenska namn>
  U <wix-id>  Hellblau  99 × 65 × 94  729 kr  saldo 109
```

`P` är en publicerad sida och `U` ett utkast. Färgen är feedens tyska värde. Översätt den
efter bilden innan du anger den i sammanslagningen, där den står som i butiken. `verktyget klarar` betyder att minst ett par i
familjen går att lägga in som val, inte att det ska göras. `N till i feeden` betyder att
familjen har fler artiklar som vi inte har importerat. `⚠️ materialet skiljer` betyder att
det kan vara två modeller och inte två färger.

Svepet kopplar två feedrader så här:

| relation | kräver |
|---|---|
| färg | samma mått och paket, vikt inom 5 %, olika färg. Dessutom samma modellnamn, eller samma klunga (Aosoms gruppering), material och kategori |
| samma vara | samma som färg, men också samma färg |
| storlek | samma klunga, olika mått, samma färg, material och kategori, och samma modellnamn |

**Svepet är ett underlag, inte ett beslut.** Se varje par med bilderna innan något slås
ihop. Tre saker ser svepet inte:

- **En publicerad AliExpress-sida.** Svepet läser bara Aosom-mappningar. De dubbletterna
  hittar du med runbookens mått- och bildkontroll.
- **Ett par som skiljer sig i feeden.** Två rader med olika mått eller mer än 5 % skillnad
  i vikt kopplas inte ihop, även om bilderna visar samma vara.
- **Varför ett par inte kom med.** Det svarar inputen `par` på: `id,id;id,id` ger vad
  svepet såg för varje par (klunga, mått, paket, vikt, färg, material, kategori och
  namnlikhet).

Senaste mätningen (2026-09-27): 777 familjer över 1 949 sidor (873 publicerade, 1 076
utkast). Av dem är 666 färg, 84 storlek, 14 färg och storlek och 13 samma vara. 277 har en
publicerad sida, 254 bara utkast och 246 flera publicerade. Verktyget klarar minst ett par i
512.

-----

## 2. Förbered sidan

- **Namnet får inte bära sidans färg eller mått.** Efter sammanslagningen säljer sidan fler
  än ett, och verktyget vägrar (`namnet_bar_farg`, `namnet_bar_storlek`). Skriv om namnet
  och titeln först. Sluggen står kvar, eftersom en ändrad slug på en publicerad sida ger
  en 404.
- **Polera syskon som bara finns bland utkasten innan de slås ihop.** Polera ett av dem,
  helst det med flest rena bilder och saldo. Skriv namn, slug och titel utan färg och mått,
  och lägg sedan de andra som val på den sidan. Verktyget kräver en publicerad sida
  (`behall_ej_publicerad`).
- **Granska utkastets bilder** enligt runbookens steg 3 innan du anger `bilder`. Utkastet
  är opolerat, och 46 % av feedens bilder bär tysk text.

-----

## 3. Plan (`mode: plan`)

| input | värde |
|---|---|
| `behall` | den publicerade sidan (Wix-id) |
| `utkast` | syskonet (Wix-id). En publicerad givare kräver `omdirigera: ja` |
| `farg_utkast`, `storlek_utkast` | syskonets värde på varje axel sidan har eller får |
| `farg_behall`, `storlek_behall` | sidans värde, bara på en axel den får för **första** gången |
| `sku` | den nya variantens SKU. Tom: sidans SKU plus syskonets värden, måttet före färgen |
| `bilder` | utkastets bilder som följer med, 1-baserat. Tom: se nedan |

Stava värdena som butiken (`Grå`, `110 × 85 cm`). Ett värde som sidan redan har stavas om
till sidans form, så `grå` och `Grå` blir samma val.

Tre vanliga fall:

| sidan har | ange |
|---|---|
| inga val, syskonet är en annan färg | `farg_behall: Svart`, `farg_utkast: Grå` |
| färg, syskonet är ett annat mått | `farg_utkast: Grå`, `storlek_utkast: 110 × 85 cm`, `storlek_behall: 90 × 70 cm` |
| färg och storlek | `farg_utkast` och `storlek_utkast` |

**Bilderna utan `bilder`:** en ny färg får syskonets huvudbild och en ny storlek i en färg
sidan redan har får ingen. En storlekssida som får färg behåller storlekarnas bilder. Färgen
bär bilden i butiken.

Planen visar tillståndet (`ny`, `utoka`, `wix_klar` eller `klar`), axlarna, alla värden
efteråt, den nya varianten, antalet varianter och saknade kombinationer, priser, saldo, SKU
och bilder. Läs varningarna. De stoppar ingenting men säger vad som måste göras efteråt.

### Hindren och vad du gör

| hinder | gör så här |
|---|---|
| `namnet_bar_farg`, `namnet_bar_storlek` | Skriv om sidans namn utan färgen eller måttet, sedan planen igen. |
| `sku_ogiltig`, `sku_for_lang`, `sku_upptagen`, `sku_lika` | Ange `sku` själv: `FP-`, gemener och bindestreck, högst 40 tecken (Wix gräns), måttet före färgen, unik. |
| `kombinationen_finns` | Sidan säljer redan den färgen och det måttet. Utkastet är en dubblett: pensionera det. |
| `farg_lika`, `storlek_lika` | Sidan och syskonet har samma värde på en ny axel, och det skiljer ingenting åt. Kontrollera värdena. |
| `saknar_farg_utkast`, `saknar_storlek_utkast`, `saknar_farg_behall`, `saknar_storlek_behall`, `inget_val` | Ett värde saknas. Se tabellen över inputs ovan. |
| `utkast_publicerat` | Syskonet ligger ute. Kör med `omdirigera: ja` om det är meningen: recensionerna kopieras, adressen omdirigeras (301) och sidan avpubliceras. |
| `givaren_har_oppna_ordrar` | Vänta tills syskonets ordrar är behandlade. |
| `behall_ej_aosom` | Sidan är mappad mot AliExpress. Flagga till Leonard. |
| `bilder_ogiltiga` | En bildposition finns inte på utkastet. |
| övriga | Datan går inte ihop: en mappning saknas, en artikel sitter redan på en annan sida, eller syskonet finns inte i feeden eller skickas inte till Sverige. Flagga till Leonard och tvinga aldrig fram en körning. |

-----

## 4. Skriv (`mode: byt`)

En givare per körning. Kör igen för nästa syskon. Verktyget gör, i den här ordningen:

1. Bildlistan, bara om den ändras.
2. Optionerna, varianterna och den nya variantens lager i **ett** anrop
   (`products-with-inventory`). Den nya varianten finns alltså aldrig utan ett lager vi har
   satt. Faller anropet rullas bilderna tillbaka.
3. En återläsning som kontrollerar varje variant på alla axlar. Stämmer något inte skrivs
   ingen mappning, och synken nollar den nya varianten tills en omkörning är klar.
4. Mappningen: en artikel per variant.
5. Syskonet pensioneras (`draftStatus: rejected`) och raderas aldrig. En publicerad givare
   omdirigeras först och avpubliceras sedan, så adressen svarar aldrig 404.

En körning som faller halvvägs tas upp av nästa: `wix_klar` gör bara det som återstår.

-----

## 5. Efter sammanslagningen

- **Texten.** Sidan beskriver fortfarande en färg eller ett mått. `Färg:`-raden i
  *Tekniska specifikationer* ska räkna upp alla färger och `Mått:`-raden alla mått.
  Stryk meningar i löptexten som påstår en enda färg, och kontrollera SEO-titeln och
  metan.
- **Så skrivs texten.** Poleringens skrivworkflow klarar bara sidor med en variant,
  eftersom SKU-steget och återläsningen kräver det. Ändringen görs därför med en PATCH av
  bara de fält som ändras (`plainDescription`, och `seoData` om titeln ändras), med
  fältmask och med texten ur en fil. Läs sedan tillbaka och jämför med filen efter
  `wixnorm`. Rör aldrig `variantsInfo` eller `options` för hand.
- **Aldrig i en runda igen.** Rundans gamla filer beskriver sidan före sammanslagningen och
  skulle skriva tillbaka en enda färg, och skrivworkflowen stannar på SKU-steget
  (`oväntat antal varianter`).
- **Live.** Vänta ut ISR-fönstret och kontrollera att väljaren visar alla värden och att
  en saknad kombination är ej valbar.
- **Synken.** Nästa körning skriver saldo och pris per variant. I en torrkörning ska
  `okandaVarianter` vara 0.

-----

## Det som inte är byggt

- **Textsteg för sidor med flera varianter** i skrivworkflowen. Tills det finns skrivs
  texten efter en sammanslagning med en PATCH enligt ovan.
- **En AliExpress-sida som sidan vi behåller.** Verktyget kräver en Aosom-mappning. Är
  syskonet samma vara i samma färg mappar du först om sidan till Aosom
  ("Dubbletter — mappa om en produkt till Aosom").
