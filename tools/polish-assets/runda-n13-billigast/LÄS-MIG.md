# Runda N13 — tio produkter à 1 139 kr

Trettonde rundan i urvalet *billigast uppåt bland de produkter där vi är
billigare än dealproffsen*. Alla tio är Aosom-utkast som publicerats, alla
tio har fått ett eget Fyndplats-kort sist i bildlistan, och alla tio ligger
på exakt samma pris (nästa prisband ovanför N12:s 1 119–1 129 kr).

| kort | produkt | pris |
| :-- | :-- | --: |
| `08b40e95` | Golvlampa med fjärrkontroll, höjdjusterbar 133–168 cm, silver/beige | 1 139 kr |
| `222f59d6` | Byrå med sju lådor, brun/beige/svart | 1 139 kr |
| `2dedb89b` | Sidobord i rattan med glasskiva, 60 cm, natur | 1 139 kr |
| `463b807e` | Barstolar 2-pack, höjdjusterbara 82–104 cm, svart | 1 139 kr |
| `87c4d80b` | Plantetagerie med spaljé, tvåstegs, 166 cm | 1 139 kr |
| `9d4b2bd0` | Upphöjt odlingsbord i tre nivåer, 120 × 120 cm | 1 139 kr |
| `a492b6f8` | Hallträd med krokar, lådor och hyllor, 180,5 cm, svart | 1 139 kr |
| `c88b22ce` | Skärmtak i polykarbonat, 303 cm, brun/svart | 1 139 kr |
| `cfc2d4f4` | Poledance-matta, Ø150 cm, rosa | 1 139 kr |
| `db1118d0` | Basketkorg för väggmontering, 113 × 73 cm | 1 139 kr |

## Kvittokedjan

Varje led är MÄTT, inte antaget. Ett svar utan fel är inget kvitto.

| led | utfall |
| :-- | :-- |
| Källtexterna hämtade ordagrant | 10 av 11 kandidater byte-exakta (`kvitto-kalla.json`); `b68f18c1` utesluten före hämtning av facit, se nedan |
| Kontaktark FÖRE brödtext | 48 bilder granskade |
| `gate.py` | 0 fynd i 10 filer (4 advisory räkneordsvarningar, prosa utan defekt) |
| `gate-seo.py` | 0 fynd i 10 rader |
| `gate-alt.py` | GRIND REN: 10 produkter, 48 alt-texter, 0 fynd |
| `gate-sku.py` | 0 fynd i 10 rader (längst 33 av 40 tecken) |
| `gate-lankar.py` | 0 fynd, 0 unika mål hämtade |
| `gate-superlativ.py` | GRIND REN: 10 filer, 0 kvitterade superlativ |
| `gate-axel.py` | 0 axelfel i 10 skrivna texter (22 saknade egna mått, 4 axelkonflikter i källan — alla advisory) |
| `gate-kort.py` | 0 fynd i 10 kort (siffergrind mot `kallor.json`) |
| Kortens md5 i BÅDA ändarna | 10 av 10 byte-identiska |
| Steg 1 — text/namn/slug/SEO/synlighet | 10 av 10 skrivna, checksumguarden passerade |
| Steg 2 — media ENSAMT, kortet sist | 10 av 10 skrivna |
| Steg 3 — kategorier | 10 av 10 kopplingar (`BulkAddItemToCategories`, `totalFailures: 0` på alla tio) |
| Steg 4 — `variantsInfo` SIST och ENSAMT | 10 av 10, svensk SKU skriven, variantobjektet round-trippat oförändrat utom `sku`, revision +1 på var och en |
| Separat läsning en stund efter skrivningen | **10 av 10 LIKA** mot filens FNV-1a-facit, media-ordning (kortet SIST) 10/10, SKU svensk 10/10, produkt+variant synliga 10/10, kategori kopplad 10/10 (2–3 kopplingar per produkt) |
| `livegrind.py` mot de publicerade sidorna | **10 av 10 REN på orddiff** (0 avvikelser i texten); 1 driftfynd (`2dedb89b` slutsåld, se nedan) — inte en textdefekt |

## `b68f18c1` uteslöts INNAN skrivning — fysiskt tryckt Outsunny-märke

Elfte kandidaten i urvalet, en gräsvält (Rasenwalze), bar texten "Outsunny"
tryckt på en metallbygel, konsekvent synlig och i rätt perspektiv över tre
separata bilder (inklusive en makrobild som visar färgens textur på metallen)
— alltså ett äkta fysiskt märke på produkten, inte en löstagbar
vattenstämpel eller ett skärpt textoverlay. Husregeln: fysiska märken på
produkten beskärs eller redigeras aldrig bort utan Leonards uttryckliga ja.
Produkten uteslöts före källfacit byggdes, och `kvitto-kalla.json` fångar
uteslutningen i sin sammanfattning i stället för att bara tystna om den.

Ny backloggpost:

- ☠️ **`b68f18c1`** (gräsvält) — "Outsunny" tryckt på metallbygel, synligt i
  tre bilder — Leonards beslut, samma klass som #287/#288/#195/#290.

## Kippskydd → Tippskydd: ett stavfel som läckte förbi den första rättningen

`a492b6f8`:s källa (hallträdet) innehöll det tysk-svenska hybridordet
"Kippskydd" — rätt svenska är "Tippskydd". Ordet fångades av `gate.py` i
kroppstexten och rättades DÄR, och av `gate-kort.py` i kortets fotnotsfält
och rättades ÄVEN där — men två andra ställen som bar exakt samma sträng
missades i den första passeringen, för att sökningen efter felet begränsades
till de filer som redan var kända bärare i stället för att köras över HELA
rundans kataloger:

1. **`seo.tsv`** — meta-beskrivningen ("Kippskydd ingår."), redan skriven
   till `seoData.description` i Steg 1.
2. **`kortalt.tsv`** — kortets egen alt-text ("kippskydd ingår"), redan
   skriven till Wix i Steg 2.

Båda upptäcktes av den separata återläsningen efter Steg 4, inte av en
grind — SEO-beskrivningen syntes vid en direkt läsning av `seoData`, och
kortets alt-text syntes när återläsningens `lastFile`/`altText`-kontroll
korrigerades (se nästa avsnitt). Källfilerna och alla genererade artefakter
(`raa-hash.tsv`, `steg1.js`, `nyttolast-media.json`, `medieskrivning.json`,
`media-hash.tsv`, `steg2.js`) rättades och byggdes om innan de två fälten
patchades separat mot Wix, och en efterföljande, fristående läsning
bekräftade båda: `seoData`-beskrivningen och kortets `altText` läser nu
"Tippskydd"/"tippskydd" på den skarpa produkten (revision 6 → 7 → 8).

**Regeln, skriven ned en gång till: ett stavfel rättas per ORD över HELA
rundans filer, inte bara i filerna där det redan setts.** Husets egen
runbook säger det uttryckligen (batch 66:s `dögnsvarv`-lärdom) — och den här
rundan visar att regeln gäller lika mycket den egna första rättningen som
den ursprungliga defekten.

## En läsform-fälla i den egna verifieringskoden — och sedan en äkta i skrivningen

Den första korrigeringsomgången avslöjade två olika buggar i tur och ordning,
och det är värt att skilja dem åt:

1. **Min egen verifieringskod var fel, inte datan.** Det första försöket att
   kontrollera "kortet ligger sist" testade om bildens URL innehöll
   substrängen `"kort"` — men det är bara den lokala TSV-kolumnens etikett,
   aldrig en del av det faktiska Wix-filnamnet. Kontrollen gav `false` på
   alla tio trots att alla tio faktiskt hade kortet sist; en omkörning mot de
   riktiga filnamnen ur `kort-filer.tsv` gav `10 av 10 RÄTT`.
2. **Den riktiga fälldan: LÄS-formen och SKRIV-formen för `media.itemsInfo`
   är INTE samma form.** En `GET` på en produkt returnerar varje media-post
   nästlad under `image: { id, url, altText, … }`. Skrivningen
   (`bygg-medieskrivning.py`, samma form som Steg 2 alltid använt) vill ha en
   PLATT lista: `{ id, altText }`, utan `image`-omslag. Min första
   rättningsPATCH byggde kroppen genom att round-trippa GET-formen (nästlad
   under `image`) rakt in i skrivningen. Wix svarade 200 och höjde revisionen
   (6 → 7) — men den avsedda alt-texten togs aldrig, och en efterföljande
   läsning visade fortfarande den gamla "kippskydd"-texten. Ingen kastning,
   ingen varning: bara en revision som steg utan att fältet ändrades.

   Rättat genom att bygga om kroppen i den PLATTA formen
   (`{ id, altText }`, hämtad ur den redan regenererade
   `medieskrivning.json`), skickad i en ny PATCH (7 → 8). En fristående
   läsning efteråt bekräftade den korrekta alt-texten.

Tolfte gången huset ser samma familj av fel, i en ny form: **läsformen och
skrivformen för samma fält kan skilja sig, och att round-trippa den ena in i
den andra är inte en genväg — det är en tyst no-op.** `media.itemsInfo` läggs
till listan av fält där det redan är känt (`variantsInfo`, `plainDescription`
i standardprojektionen, `directCategoriesInfo.name`).

## Kategorierna valdes mot befintlig konvention, inte gissade

Ingen sökning mot redan publicerade produkter genomfördes den här rundan
(se separat avsnitt om `products/search` nedan) — kategorierna grundades i
stället direkt i kategoriträdets egna svenska namn, en redan etablerad
reservmetod:

| kort | typ | kategori(er) |
| :-- | :-- | :-- |
| `08b40e95` | golvlampa | Hem & Inredning + Belysning |
| `222f59d6` | byrå | Hem & Inredning + Förvaring & Organisering |
| `2dedb89b` | sidobord (utomhus, rattan) | Trädgård & Utemöbler + Utemöbler |
| `463b807e` | barstolar | Hem & Inredning (ingen löv-kategori finns) |
| `87c4d80b` | plantetagerie | Trädgård & Utemöbler + Trädgårdsdekor & Belysning |
| `9d4b2bd0` | odlingsbord | Trädgård & Utemöbler + Växthus & Odling |
| `a492b6f8` | hallträd | Hem & Inredning + Förvaring & Organisering |
| `c88b22ce` | skärmtak | Trädgård & Utemöbler + Solskydd & Paviljonger |
| `cfc2d4f4` | poledance-matta | Sport & Fritid + Träning & Gym |
| `db1118d0` | basketkorg | Trädgård & Utemöbler + Utelek & Spel |

Alla tio bär dessutom Wix egen `All Products`, så den lästa kategoriräkningen
i återläsningen (2–3 per produkt) är alltid ett i överkant av tabellen ovan —
samma `+1`-mönster som redan är dokumenterat i huset (Wix lägger själv till
`All Products` som `mainCategoryId`).

## `2dedb89b` renderar slutsåld på den publicerade sidan — inte en textdefekt

`livegrind.py`:s enda icke-noll-fynd: sidobordet i rattan renderar
`OutOfStock` (JSON-LD `availability`) trots att sidan i övrigt är helt ren
(orddiff 0, korrekt SEO, korrekt kategori). Kontrollerat direkt mot Wix
innan något ändrades:

```
productVisible:  true
variantVisible:  true
variant.inventoryStatus.inStock:  false
product.inventory.availabilityStatus:  "OUT_OF_STOCK"
```

Det här är INTE en upprepning av #148/#256 (en variant vars `visible` tappats
i en handbyggd PATCH) — båda synlighetsflaggorna står rätt. Det är ett äkta
saldo på noll hos leverantören just nu. Husets egen Aosom-dokumentation säger
uttryckligen att en rad som försvinner ur feeden eller går till noll är ett
LAGERBESKED, inte en utgången artikel: sidan ska ligga kvar publicerad och
saldot återställs av sig självt så fort Aosom-synken (`0 */6 * * *`) ser
lagret tillbaka. Ingen textändring och ingen avpublicering är rätt åtgärd
här — bara en observation för protokollet. Matchar den redan öppna
backloggposten #173 (lagersaldot kollas inte i urvalssteget) genom att visa
exakt den typ av fall den posten varnar för, utan att i sig vara en ny defekt
att åtgärda i den här rundan.

## `products/search` gick inte att använda för precedensjämförelse

Ett försök att hitta redan publicerade produkter av samma typ via
`stores/v3/products/search` med `search: { expression: { exp: "<sökterm>" } }`
gav tomma träfflistor på både tyska och svenska söktermer. Ett
felsökningsförsök med `search: { expression: "<sträng>" }` (platt sträng i
stället för objekt) ignorerades tyst av API:t och gav i stället en ofiltrerad
produktlista, trunkerad vid gränsen för svarsstorlek. Rätt kroppsform för en
fungerande fritextsökning fastställdes INTE den här rundan — kategorivalen
ovan gjordes i stället direkt mot kategoriträdets egna namn, en giltig men
mindre precis reservmetod. Värt att undersöka försiktigare (mindre
`cursorPaging.limit`, eller verifierat mot dokumentationen först) om det
prövas igen.

## Dubblettskärmen: 0 krockar mot den publicerade katalogen

Samtliga tio slutgiltiga kandidater kontrollerades mot den publicerade
katalogen på måtttrippel före skrivning. Inga interna kollisioner är möjliga
inom tian själv — tio olika produktkategorier (golvlampa, byrå, sidobord,
barstolar, plantetagerie, odlingsbord, hallträd, skärmtak, poledance-matta,
basketkorg).

## Övriga småfynd under skrivningen

- **`08b40e95`**: källans fotnot angav ett fast mått (40 × 40 × 168 cm) i
  "Tekniska specifikationer" som motsade både brödtextens egen
  `Gesamtabmessungen`-rad och måttritningens bild, vilka båda visade en
  justerbar höjd 133–168 cm. Den mer detaljerade och bildbekräftade källan
  vann; Mått-raden skrevs som "40 × 40 × 133–168 cm" innan något gick till
  Wix.
- **`87c4d80b`**: källans färgetikett "Gelb" (gul) motsades av bilderna, som
  entydigt visar en obehandlad, naturfärgad träyta. Bilden fick avgöra;
  produkten namngavs och beskrevs som "natur", inte "gul".
- **`bilder.tsv`/`alt.tsv`** byggdes först med bildernas SLUTGILTIGA
  visningsordning som positionsetikett, men `bygg-media.py` förväntar sig
  KÄLLpositioner där måttritningen alltid bär etiketten `"3"` oavsett var i
  källan den faktiskt låg — skriptets egen sorteringsnyckel flyttar den
  etiketten sist automatiskt. Upptäckt och rättat före någon Wix-skrivning
  genom att läsa `bygg-media.py`:s dokumenterade kontrakt, inte genom en
  grind.

## Vad som INTE hittades den här rundan

Inga axelfel, inga superlativ att kvittera, inga trasiga länkar, inga
SKU-kollisioner, inga tyska SEO-titlar (utöver den redan beskrivna
Kippskydd-texten) och ingen intern dubblett bland de tio slutgiltiga
kandidaterna.
