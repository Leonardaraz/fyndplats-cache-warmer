## 2. Hämta källan

Läs varje produkt med en GET:

```
GET https://www.wixapis.com/stores/v3/products/{id}?fields=PLAIN_DESCRIPTION&fields=MEDIA_ITEMS_INFO&fields=DIRECT_CATEGORIES_INFO
```

Läs sedan saldot för hela rundan i ett anrop:

```
POST https://www.wixapis.com/stores/v3/inventory-items/query
{ "query": { "filter": { "productId": { "$in": [ … ] } }, "cursorPaging": { "limit": 100 } } }
```

Skriv filerna:

| fil | rad |
|---|---|
| `ids.tsv` | `kort ⇥ produkt-id ⇥ pris och tyskt namn` |
| `bilder.tsv` | `kort ⇥ position ⇥ wix-fil-id` |
| `variant.tsv` | `kort ⇥ variant-id` |
| `lager.tsv` | `kort ⇥ saldo` |
| `kallor.json` | `{ "kort": "källtext" }`, alltså `plainDescription` med artikelnumren redigerade |

Skriv filerna ur verktygssvaret med ett skript och redigera artikelnumren redan i det
steget. Skriv aldrig av en källtext eller ett id. Ett Aosom-utkast har en enda variant och
inga variantval. En VEVOR-familj har en variant per artikel.

**Läs mappningsraden** för varje produkt med **"Polering — läs och stämpla mappningsraden"**
(`polish-mapping.yml`, `mode` = `las`, en produkt per körning). Svaret säger:

- **prisgrinden:** STÄMMER, PRISGRINDEN FALLER (drift: rör inte priset, välj en annan
  produkt eller flagga), SLUTSALD, LÅST PRIS eller EJ AVGÖRBAR,
- för VEVOR **`vevorGranskning`**: `gpsr`, `medicinteknik` och `bildgranskning` (se
  VEVOR-avsnittet).

Det är den enda kontrollen av priset och av VEVOR-flaggorna, för skrivsteget gör ingen.

### Kontrollera kategorin (tidigt)

*Leonard 2026-11-01.* Kontrollera att produkten ligger i en lämplig kategori **direkt när du
har läst den**, före bilderna och texten, och lägg den i en lämplig kategori om den inte gör
det. GET:en ovan bär redan `directCategoriesInfo`. Kategorin avgör vilket sökord produkten
tävlar om, vilka syskon den krockar med, vilka filter den hamnar i och vilken brödsmula
Google ser. En text som är rätt skriven för en produkt i fel kategori hamnar ändå fel.

1. **Läs kopplingen och trädet.** Slå produktens kategori-id mot trädet, med de dolda
   kategorierna, en gång per runda (se [Kategori](05-skriv-texten.md#kategori-kategoritsv) i steg 5).
2. **Bedöm den mot produkttypen**, som bilderna och `Lieferumfang` eller specifikationen
   avgör, aldrig mot titelns kategoriord. Importen gissar: VEVOR:s regel
   (`lib/vevor/kategorier.ts`) har lagt en bilramp under Baby & Småbarn och ett kassaskåp
   med väska bland verktygslådorna, så läs dess val som ett förslag och inte som facit.
   Frågorna är: sitter varan i den avdelning och det löv där en kund som söker just den
   varan skulle leta? Är lövet det smalaste som passar? Finns en sökordskategori för
   typen? Saknar produkten kategori helt, eller ligger den bara i en dold kategori
   (brödsmulan blir då *Hem / Butik / produkt*)?
3. **Passar kopplingen**: skriv den som första raden i `kategori.tsv` redan nu. Steg 5
   prövar den då mot den färdiga texten (sökordskategorins facit) i stället för att välja
   den från början.
4. **Passar den inte, eller saknas den**: lägg produkten i den lämpliga kategorin. Skriv
   förälder, smalaste löv och sökordskategori i `kategori.tsv` med namnen exakt som i Wix,
   så kopplar skrivsteget dem. Finns ingen lämplig kategori i trädet skapar du ingen själv:
   skriv föräldern, och flagga produkten med ett förslag på ny kategori i `FLAGGADE.md`
   (`FLAGGADE-VEVOR.md` för VEVOR). Välj aldrig ett löv bara för att det finns.
5. ☠️ **Den felaktiga kopplingen sitter kvar.** Skrivsteget och **"VEVOR — kategorier till
   utkasten"** lägger bara till och tar aldrig bort. Skriv en rad *Kategori att ta bort* i
   `FLAGGADE.md` / `FLAGGADE-VEVOR.md` med produktens kort och den felaktiga kategorins
   namn. Kopplingen tas bort i en egen åtgärd, med workflowen **"Kategori — ta bort
   felaktiga kategorilänkar"** (se [Ta bort en felaktig kategorilänk](#ta-bort-en-felaktig-kategorilänk)
   nedan); en handbyggd skrivning i Wix är förbjuden. Textsteget publicerar varan, en
   VEVOR-vara också (standardraden gör GPSR komplett), så den visas i den felaktiga
   kategorin tills kopplingen är borta. Skriv därför raden direkt, nämn den i rundans
   slutrapport till Leonard, och ta bort länken med verktyget när han har bett om det
   (de fem första 2026-11-02: "Fixa punkt 2").

Kategorin kontrolleras alltså två gånger med olika uppgift. Här avgörs *var* varan hör
hemma, utan att texten är skriven. I steg 5 prövas den mot sökordskategorins påståenden.

### Ta bort en felaktig kategorilänk

*Leonard 2026-11-02.* Workflowen **"Kategori — ta bort felaktiga kategorilänkar"**
(`kategori-bort.yml`) tar bort de länkar som skrivsteget aldrig tar bort. Den rör bara
kategorilänkar (Categories-tjänstens `remove-items`): ingen produkt-PATCH, så ingenting
annat på varan kan tappas.

1. **Skriv planen** i `tools/polish-assets/kategori-bort/<plan>.json`, en fil per omgång
   (`vevor-1.json` är den första). Per vara: `kort`, `pid`, `bort` (kategorierna som ska
   bort) och `behall` (kategorierna varan ska ligga kvar i). Kategorierna står som
   **sökvägar**, `Kök & Husgeråd > Köksmaskiner & Apparater`, eftersom samma lövnamn finns
   under flera avdelningar. Läs varans länkar live först (GET med
   `fields=DIRECT_CATEGORIES_INFO`): importen lägger både avdelningen och lövet, och båda
   ska bort om varan inte hör dit. En vara som ska ligga kvar i en dold kategori behöver
   minst en synlig kategori bland sina `behall`.
2. **Kör `torr`** med `ref` satt till grenen som bär planen, `plan` (filens namn utan
   `.json`) och `plan_sha256` (`sha256sum` på filen). Körningen skriver ingenting och
   räknar länkarna som tas bort (`attTaBort`).
3. **Kör `skriv`** med samma `plan` och `plan_sha256` och `bekrafta` satt till torrens
   `attTaBort`. Stämmer inte antalet, eller faller något villkor för någon vara, skrivs
   ingenting. Workflowen väntar och läser tillbaka (`verifiera`) och fäller varje vara där
   en länk finns kvar eller en `behall` saknas. Kör `verifiera` ensamt om du vill läsa om.

☠️ Fem egenskaper som inte ska tas bort (`lib/polish/kategori-bort.ts`): planen säger också
vad som ska finnas kvar; alla villkor prövas för alla varor före första skrivningen;
kategorierna är sökvägar och en tvetydig sökväg avbryter; skarpt läge kräver antalet;
`verifiera` läser tillbaka. Rutten körs från `main`, så en ändrad regel finns för
workflowen först när den är mergad: `ref` styr bara vilken planfil som läses.

Tre saker från den första borttagningen (`tools/kategorifix/README.md`, 2026-09-08) gäller
fortfarande:

- **Det är en navigationsändring.** En toppkategorisida rullar inte upp sina löv, så att
  ta bort en direkt topplänk tar varan bort från den kategorins listning. Ta bara bort en
  topplänk när varan inte hör hemma där, som en soppvärmare under Bygg & Renovering.
- **Läsningen släpar efter skrivningen.** Bulk-svaret är facit, och en snabb återläsning
  kan visa länken kvar. Workflowen väntar 45 s och läser om en gång efter 60 s.
- **Planfilen är ångerposten.** Listan `bort` är det som togs bort. Ångra genom att lägga
  tillbaka de kategorierna med kategoristeget.

### Vad källan är värd

Den tyska texten har tre delar, och de är olika mycket värda. Till dem kommer importens
svenska spec-block.

- **`Lieferumfang`** är det som ligger i kartongen. Den raden gäller.
- **`Technische Daten` och `Produktdetails`** ger mått och laster.
- **Titeln, `Beschreibung` och säljpunkterna** är marknadsföring. Titelns kategoriord är en
  hypotes: en "Gaming Stuhl" kan vara en kontorsstol, en "Frühbeet" en odlingslåda utan
  lock och en "Esszimmerstuhl" en bänk. `Lieferumfang` och bild 1 och 2 avgör. Importens
  alt-texter är titeln i ny form och inget eget vittne.
- **Spec-blocket** (`Mått`, `Färg`, `Material`, `Vikt`, `Paketmått`) kommer ur feedens
  kolumner, inte ur den tyska texten, och kan säga emot den:
  - ☠️ **`Vikt` är fraktvikten**, alltså feedkolumnen `Weight (incl. Package)`. Anger den
    tyska texten ingen produktvikt (`Gewicht`) skriver du `Fraktvikt: X kg` i spec-tabellen,
    och du skriver aldrig i löptexten att varan väger X. `gate.py` fäller båda.
  - `Mått` kan ha axlarna i fel ordning. Måttritningen avgör geometrin.
  - `Färg`-värdet står kvar på tyska. Översätt det efter bilden.
  - Blocket kan vara lånat från en annan modell. Saknas måttritning prövar du proportionerna
    mot studiobilden, till exempel hjulets andel av höjden.

**Ett tal som är exakt detsamma som grannfältets är misstänkt**, till exempel en stol vars
djup är exakt bordets eller en vikt som är exakt syskonets. Läs om fältet. Ett tal du inte
kan belägga står inte på sidan.
