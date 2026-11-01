### Bilder bort: också de som ett färgval pekar på (2026-10-14)

Bildplanen och färgbildsverktyget tappar aldrig en bild som ett val pekar på,
eftersom Wix svarar 404 `PRODUCT_MEDIA_NOT_EXIST` när en länkad bild faller ur
galleriet. Det är rätt som regel och lämnade en lucka: cykelkärran `571e37bf`
fick en tysk och en engelsk måttbild med text inbränd i pixlarna när den blå
färgen slogs ihop med sidan. Båda var länkade till Blå, och runbooken förbjuder
att skriva för hand i Wix.

Workflowen **"Bilder — ta bort bilder ur en publicerad sida (också länkade)"**
→ `/api/admin/bilder-bort` → `lib/aosom/bilder-bort.ts`. Torrt som default:
`skarp=ja` kräver `bekrafta` = planens sha, som står i torrkörningens logg.
Fil-id på bilderna läses ur sidans galleri (`GET /stores/v3/products/{id}?fields=MEDIA_ITEMS_INFO`).

Sex egenskaper som inte ska tas bort:

1. ☠️ **Ordningen är omvänd mot färgbildsverktygets.** Valens `linkedMedia`
   skrivs FÖRST utan bilderna (options + variantsInfo ordagrant ur GET:en och
   `visible` med, som i `skrivSida`), galleriet sedan ensamt. Skrivs galleriet
   först svarar Wix 404. Ett test låser det mot en låtsas-Wix som vägrar
   exakt det, och är verifierat genom att hoppa över länksteget: fem tester
   faller.
2. ☠️ **Verktyget väljer aldrig bilder.** Huvudbilden kan inte tas bort, sidan
   får inte hamna under fyra bilder (`MIN_BILDER`, Leonard: "4 är godkänt"),
   och ett val som hade bilder får inte lämnas utan en. Vem som ska ersätta
   en bild är ett beslut för en människa.
3. ☠️ **En körning som föll mellan länkarna och galleriet är ofarlig.** Valen
   pekar på färre bilder och galleriet har alla kvar. En ny plan ser läget
   (valens länkar redan utan bilderna) och gör bara galleriet.
4. ☠️ **Återläsningen jämför allt.** Galleri, alt-texter, varje vals lista,
   synlighet, och varje variants synlighet, pris, SKU och val. Bara galleriet
   och länkarna får vänta på att Wix läsning hinner ikapp; allt annat stoppar.
5. **Variantbilderna följs upp** (`refreshVariantMedia`). Den läser först och
   skriver bara när en variant avviker, och ett val vars första bild är orörd
   ger ingen skrivning.
6. ☠️ **Svaret bär bara wix-id, platser, antal och hinder.** Aldrig alt-texter,
   namn eller sluggar: loggen är publik.

⚠️ Filerna ligger kvar i Media Manager tills bildstädningen tar dem. Så länge
givarens pensionerade utkast finns räknar städningen filen som använd; den
tas först när utkastet raderats (se *Pensionerade utkast raderas efter
fjorton dygn*).
