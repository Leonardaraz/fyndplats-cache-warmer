## Restock-bevakarna (`/admin/restock-list`, 2026-09-30)

Leonards rapport: sidan visade produkterna på engelska. Namnet kom ur
mappningens `seoTitle`, som är leverantörens sidtitel från importen
("… - AliExpress") och aldrig skrivs om av poleringen. Sidan läser nu butikens
namn ur Wix (`searchProductSummaries`, ett anrop per 100 produkter) och visar
leverantören med länk, lagret hos leverantören och lagret hos oss. Vad som
visas bestäms i `lib/restock/rader.ts`.

### Restock-mejlet (2026-09-30)

Leonards granskning av mejlet: leverantörens namn och bild, loggan på vit botten
och en sidfot som sa *"skickades automatiskt av Fyndplats sync-cron. Klicka inte
på okända länkar"* till kunden. Och Aosom-varor fick inget mejl alls. Mejlet
hade dessutom aldrig nått någon: 52 restock-händelser sedan 2026-08-16, noll
notifierade.

Båda synkerna går nu genom `mejlaBevakare` (`lib/restock/notify.ts`). Mejlet
byggs i `lib/restock/mejl.ts` och får butikens kundomslag
(`lib/email/kundmejl.ts`, samma form som butikens egna kundmejl): mörk
rubrikrad med loggan, avsändaren `orders@fyndplats.se`, svar till
kundservice och en sidfot med mejl och telefon.

| synk | när bevakarna mejlas |
|---|---|
| AliExpress | listningen går från slut till aktiv (`justRestocked`), alltså hela produkten |
| Aosom | en lagerrad går från noll till mer än noll i butiken (`aterkomnaLagerrader`) |

Sju egenskaper som inte ska tas bort:

1. ☠️ **Allt kunden ser läses färskt ur Wix precis före utskicket**
   (`getV3ProduktKort`): namn, bild, pris och adress. Mappningens `seoTitle` är
   leverantörens titel, och en bild som inte ligger hos Wix släpps aldrig in.
2. ☠️ **En bevakare stämplas bara när Resend tog emot mejlet.** Den gamla vägen
   stämplade alla, också när `sendEmail` svarade `skipped`. Då var bevakningen
   förbrukad utan att något mejl gått.
3. ☠️ **Aosom räknar per lagerrad, inte per produkt.** Butikens formulär visas när
   den VALDA färgen är slut, också när en annan finns, och bevakningen sparar
   ingen färg. Den 2026-09-30 väntade två av fyra bevakare så (vitt sängbord,
   beige klättervägg). Mejlet säger då vilket utförande som kom tillbaka och
   visar dess bild, ur valets `linkedMedia` — variantens egen `media` bar den
   andra färgens bild. AliExpress-synken ser bara hela produkten och mejlar
   alltså först när varan varit helt slut.
4. ☠️ **Ingen synlig variant, dold produkt eller saknad adress stoppar mejlet.**
   En sida vars enda variant är dold visar "Slutsåld" med fullt lager.
5. ☠️ **Ett pris som synken skrev i samma körning visas inte.** Wix läsning
   släpar efter en skrivning, och mejlet får inte säga ett annat pris än sidan.
6. **Butikens cache för sidan töms före utskicket** (`uppfriskaProduktsida`).
   Produktsidorna cachas en timme och bara en order tömmer dem, så länken hade
   annars kunnat visa "Slutsåld". Kräver `ADMIN_SECRET` i motorns miljö; nyckeln
   går som kakan `fp_admin`, för proxyns `?key=` bygger på en kaka som fetch inte
   sparar. Saknas nyckeln går mejlet ändå, och loggen säger `sidans cache:
   ingen_nyckel`.
7. **Övergången syns bara en gång.** Faller ett utskick får bevakaren inget nytt
   försök förrän varan tagit slut och kommit tillbaka. `restockEjSkickade` i
   Aosom-synkens loggrad ska därför vara noll.

⚠️ **Bevakare vars vara redan finns i lager får inget mejl.** De missade
återkomsten, till exempel för att den skedde innan det här fanns. Adminsidan
säger det på raden.

**Provkörningen** (workflowen **"Restock — provkör sidans cache och mejlet"** →
`/api/admin/restock-prov` → `lib/restock/prov.ts`). `ADMIN_SECRET` finns i två
Vercel-projekt, butiken och motorn, och värdet går inte att läsa tillbaka i
något av dem. Läget `sidan` tömmer en produktsidas cache med samma anrop som före
ett mejl och svarar med butikens statuskod: 200 betyder att värdena är lika, 404
att butikens proxy avvisade nyckeln, och `ingen_nyckel` att den saknas i motorn.
Läget `mejl` skickar restock-mejlet med `[Prov]` i ämnesraden till den interna
larmadressen (samma som vaktens morgonmejl) genom `mejlaBevakare`, utan att röra
en bevakare. Ingen nyckel och ingen adress når loggen.
