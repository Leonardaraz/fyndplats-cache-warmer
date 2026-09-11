# Runda 130 — sex solcellslampor i konstrotting

## Steg 1 — familjen

Katalogsvep 2026-09-11 via `products/search` (57 sidor, `avhuggen: false`,
**unika == lästa**, alltså inget sidbrytningsfel):

| | |
|---|--:|
| Produkter totalt | 5 649 |
| Publicerade | 2 578 |
| Utkast | 3 071 |

Talet 2 578 är 9 fler än runda 129:s 2 569 — exakt den rundans nio sidor.

Rundan tar de sex rottinglamporna som runda 129 parkerade. Den sjunde
parkerade posten, `137403f6`, är en **bärbar solpanel på 100 W** — en
laddare, inte belysning, och alltså en annan produkttyp. Den står kvar.

### Krocksvep

Sökning på `rotting|rattan|korg|solcell|lykta|utomhuslamp|trädgårdsbelys|solar`
över alla 5 649 gav 152 träffar. **Ingen publicerad rottinglampa finns.** Det
som ligger ute är runda 129:s nio master, rottingMÖBLER (loungeset, sidobord,
barvagn), korgar i annan mening (tvättkorg, kattkorg, basketkorg) och en
väderstation med solcell. Noll sökordskrockar, noll måttvillingar.

☠️ **De nio publicerade från runda 129 är SYSKON, inte konkurrenter** — samma
familj, annan konstruktion. Varje sida i runda 130 korslänkar till dem.

### SKU-krocken avgjordes när sluggen valdes, inte i Steg 8

**Tre** av utkasten bar redan `FP-solar-stehlampe-rattan` (importens
24-teckenkapning, uppgift #272). Verifierat mot hela katalogen via
`search-variants`:

| | |
|---|--:|
| Varianter lästa | 6 588 |
| Unika SKU-strängar | 5 421 |
| Delade strängar | 568 |
| Delade förekomster | **1 727** |
| Positiv kontroll `FP-solar-stehlampe-rattan` | **3** (rundans egna) |
| Av rundans sex nya SKU redan tagna | **0** |

☠️ **Första sluggförslaget gav TVÅ sidor samma SKU.**
`solcellslampa-rotting-144-cm…` och `solcellslampa-rotting-130-cm` kapas
båda till `FP-solcellslampa-rotting` (21 tecken; nästa token spränger 24).
Talet flyttades FÖRE materialordet, och då blir alla sex unika. Det kostade
ingenting att räkna före publicering och går inte att laga efteråt utan en
redirect.

## Steg 2 + 5 — laglighets- och påståendegrinden

### 1. ☠️ IP44 är STÄNKSKYDD — `5ffb91a2` säger "wasserdicht" i samma mening

Leverantörens tyska text, ordagrant: *"Wasserdicht gemäß IP44, widersteht
Regen, Schnee, Frost und Hagel"*. Enligt IEC 60529 är den andra fyran skydd
mot **vattenstänk från alla håll** — inte nedsänkning, inte strålar.

Till skillnad från runda 129 är ordet **negationsgrindat** här i stället för
blankt förbjudet: rundans texter FÖRNEKAR det med flit ("den är inte
vattentät"), och en blank spärr hade fällt precis de meningar som gör
sidorna ärliga. Runda 53:s `härdat glas`-lärdom, ordagrant.

### 2. ☠️ 15 lumen är stämningsljus — leverantören säljer det som belysning

Fem av sex anger **15 lm**. Leverantörens ingresser säger *"Erhellen Sie
Ihren Garten"* och *"sorgt für helle Außenbeleuchtung"*. Femton lumen gör
inte det. Varje sida skriver ut talet och vad det räcker till, och
kategoriklyschan (`lyser upp`, `gångbelysning`) är grindad — negerad träff
ursäktas, så sidorna FÅR säga "lyser inte upp gången omkring sig".

### 3. ☠️ `ef0c374b`:s spec sa 45 METER och beskrev bara en av två lampor

Spec-raden importen byggde: `Mått: 45m x 45m x 45m`.

Måttritningen (bild 3, granskad i förstoring) visar **Ø45 × 45 cm** och
**Ø35 × 35 cm** — två lampor, i centimeter. Spec-tabellen har nu två
måttrader och en `Antal`-rad.

### 4. ☠️ `ef0c374b` säljs som "dekorativa sidobord" — locket ÄR solcellen

Tyskan: *"Stilvolle dekorative Beistelltische am Tag, warme Akzentlampen in
der Nacht"*. Ingen maxlast anges någonstans, och det man skulle ställa något
på är solcellspanelen: lägger man något där laddar lyktan inte.

Sidan säger det rakt ut i FAQ:n, och grinden fäller `sidobord` och
`avlastningsbord` om orden återkommer.

### 5. ⚠️ `a8cf27cd` saknar IP-klass, lumenvärde OCH CE-uppgift

Den enda i rundan utan angiven kapslingsklass. Alltså:

- ingen sida får påstå något om hur mycket regn den tål — den säger i stället
  vad som INTE står, och ger det praktiska rådet (under tak, ta in);
- lumenvärdet från syskonen får inte lånas in. Effekten (0,8 W) står i
  källan och skrivs ut, med en mening om varför watt inte är lumen.

☠️ **Första utkastet jämförde ändå med syskonen** — *"mer än de flätade
lamporna i samma serie"*, på fyra ställen. Det är klart-kriteriets förbjudna
omgångsjämförelse i förklädnad: sann om just de fem, läst av kunden som "i
sortimentet", och tyst falsk nästa gång något starkare poleras. Måttgrinden
fällde den på talet `0,06`, som inte är produktens eget. Alla fyra strukna.

### 6. ⚠️ Materialet är PE-rotting, alltså KONSTROTTING

Fem av sex tyska spec-block säger `PE-Rattan`. `ef0c374b`:s SVENSKA spec-rad
säger bara `Rattan` — vilket hade blivit ett påstående om naturmaterial.
Katalogen skiljer redan på orden (`Loungeset i rotting` mot
`Trädgårdsstolar i konstrotting`), så skillnaden är inte akademisk. Grinden
fäller `äkta rotting`, `naturrotting` och `massiv rotting`.

`a8cf27cd` är inte ens flätad: närbilden visar **brun plastlina lindad tätt
runt en pulverlackad stålram**, vilket är precis vad tyskan säger
(*"umwickelt mit schönem Kunststoffgeflecht in Rattanoptik"*). Sidan
beskriver det.

### 7. ⚠️ Färgen: den svenska spec-raden tappar halva värdet på fem av sex

| id8 | tyskan | svenska spec-raden | bilden visar |
|---|---|---|---|
| 65e3c24f | `Schwarz+Gelb` | `Gelb` | svart stativ, skärmar i ljus naturton |
| 4e23a904 | `Schwarz+Gelb` | `Gelb` | svart stativ, skärm i ljus naturton |
| 66a26135 | `Schwarz+Grau` | `Grau` | svart och grått |
| 5ffb91a2 | `Gelb` | `Gelb` | svart stativ, skärm i ljus naturton |
| ef0c374b | `Sand+Schwarz` | `Sand` | sandfärgad flätning, svarta lock |
| a8cf27cd | `Braun` | `Braun` | brun |

"Gelb" är leverantörens ord för naturtonen i flätningen. **Ingen bild visar
något gult.** Sidorna beskriver det bilden visar.

☠️ **Och därför står `Sand` INTE i tyskordlistan.** Det är ett vanligt
svenskt ord; hade det stått där hade grinden fällt rundans enda korrekta
färgbeskrivning. Samma klass som runda 55:s `Metall`/`Glas`/`Magnet`.

### 8. ⚠️ Montering skiljer, och `Lieferumfang` är kontraktet

| id8 | källan säger | spec-raden |
|---|---|---|
| 65e3c24f | `Montage erforderlich` | Krävs |
| 4e23a904 | `Montage erforderlich` + 4 × Erdspieß | Krävs |
| 66a26135 | `Keine Montage erforderlich` | Behövs inte |
| 5ffb91a2 | — | *ingen rad alls* |
| ef0c374b | `Keine Montage erforderlich` | Behövs inte |
| a8cf27cd | `Einfach zu montieren` | Enkel |

`5ffb91a2` får ingen monteringsrad, för källan säger ingenting. Samma regel
som lumenvärdet på `a8cf27cd`.

### 9. ⚠️ Svensk vinter står på varje sida

Solcellslampor laddar inte i november–december på svensk breddgrad, och
Ni-MH tappar kapacitet i minusgrader. Det är en hård gräns som avgör om
varan går att använda, och den skrivs som ett positivt villkor i
`Användning och skötsel` — inte som en varningslista.
*(Kontrollerat mot batteriexperten.se, ljustema.se och bbier.com.)*

## Steg 3 — mappningsraden (facit)

Läst via workflowen **Polering — läs och stämpla mappningsraden**, läge
`las`, 2026-09-11. `PRODUCT_ID` läst ur loggens env-block, aldrig ur
körningsordningen.

| id8 | lager | pris | prisgrinden | fraktandel | EU-lager |
|---|--:|--:|---|--:|---|
| 65e3c24f | 82 | 969 | ✅ stämmer | 0,415 | ja |
| 4e23a904 | 80 | 739 | ✅ stämmer | 0,491 | ja |
| 66a26135 | 24 | 929 | ✅ stämmer | 0,386 | ja |
| 5ffb91a2 | 120 | 899 | ✅ stämmer | 0,401 | ja |
| ef0c374b | 39 | 1 399 | ✅ stämmer | 0,288 | ja |
| a8cf27cd | 82 | 659 | ✅ stämmer | 0,418 | ja |

Alla sex i lager, alla sex under 0,5 i fraktandel, alla sex `hasEuWarehouse`.
**Priset rörs inte.**

## Steg 4 — bilderna

30 bilder hämtade, två kontaktark och ett logotypsvep över varje bilds övre
vänstra fjärdedel (runda 64:s `HOMCOM by Aosom`-fynd).

**Noll leverantörslogotyper.** Fyra bilder bär tysk text:

| bild | text |
|---|---|
| `65e3c24f` bild 4 | `IP44-SCHUTZ / Widersteht allen Witterungseinflüssen` |
| `65e3c24f` bild 5 | `RUNDER STAHLSOCKEL / Sorgen Sie für …` |
| `4e23a904` bild 4 | `QUADRATISCHER STAHLSOCKEL / Sorgen Sie für …` |
| `ef0c374b` bild 4 | `Schutzart IP44 / Widerstehen allen Witterungseinflüssen` |

☠️ Två av dem påstår dessutom *"widersteht ALLEN Witterungseinflüssen"* —
motsatsen till vad IP44 betyder. De ersätts av egna kort, inte av tystnad
(runbookens regel: en utländsk infografik kastas inte, den byggs om).

**En bild bar ett köpavgörande fynd i pixlarna.** `a8cf27cd` bild 5,
uppförstorad: en skjutomkopplare märkt **ON / OFF** på solcellens undersida.
Tyskan säger bara *"(Modus muss eingeschaltet sein)"*. Utan bilden hade
sidan inte kunnat förklara varför en lykta som laddar ändå inte tänds.

## Steg 5 — vad grinden mätte

Textgrinden: **6 produkter, 0 fel.** Mutationstestet: **17 mutationer, 0
missade**, rätt grind fälld i varje fall, kontrollprov rent på båda sidor.

Tre defekter fångades av grinden innan något skrevs:

1. ☠️ **Korslänkarnas slugs var skrivna UR MINNET, och åtta av nio var fel.**
   `solcellslampa-185-cm` mot verkliga `solcellslampa-185-cm-tre-lyktor`.
   Grinden såg det bara indirekt — på att korslänkens TAL inte gick att
   härleda ur målets spec-tabell — och utan den hade sex sidor gått live med
   döda länkar. `SYSKON_129` HÄRLEDS nu ur runda 129:s egen `texter.py`, med
   Wix-svaret som assertion.

2. ☠️ **En FAQ-fråga bar det förbjudna uttrycket** (*"Är flätningen äkta
   rotting?"*), fast svaret förnekade det. Runda 107:s lärdom: en sanktionerad
   fråga måste strykas tillsammans med sitt svar — eller formuleras om.
   Omskriven till *"Är flätningen av naturmaterial?"*, vilket är bättre copy.

3. ☠️ **Fyra omgångsjämförelser** på `a8cf27cd` (punkt 5 ovan).

### ☠️ Och en mätning som var TYST FEL i katalogsvepet

`slug` i Wix V3 är en **STRÄNG**, inte ett objekt med `.name`. Svepet läste
`p.slug && p.slug.name` och fick `undefined` → `""` på **alla 5 649
produkter**, utan ett enda fel. Det syntes först när korslänkarna skulle
verifieras.

Samma familj som `MEDIA_ITEMS_INFO` och `PLAIN_DESCRIPTION`, fast värre: där
saknas ett fält som inte begärts, här finns fältet men läses med fel form.
**En läsning som svarar tomt på 5 649 rader är ett påstående, inte ett
kvitto** — kontrollräkna mot en känd nämnare.

-----

## Steg 7–9 — text, SKU och bilder

Sex texter skrivna i `texter.py` och skrivna till Wix i ETT svep. **6 av 6
hash-verifierade** mot facit efter skrivningen (tag-strippad, whitespace-
normaliserad synlig text), alltså inte lästa ur PATCH-svaret — det ekar
tillbaka ordagrant det man skickade och bekräftar en felstavning som "sparad".

| id8 | slug | SKU | hash |
|---|---|---|--:|
| `65e3c24f` | `solcellslampa-144-cm-tre-skarmar-konstrotting` | `FP-solcellslampa-144-cm-tre` | 444928428 |
| `4e23a904` | `solcellslampa-bage-178-cm-konstrotting` | `FP-solcellslampa-bage-178` | 713661570 |
| `66a26135` | `solcellslampa-pelare-77-cm-konstrotting` | `FP-solcellslampa-pelare-77` | 227477663 |
| `5ffb91a2` | `solcellslampa-130-cm-konstrotting` | `FP-solcellslampa-130-cm` | 293564072 |
| `ef0c374b` | `solcellslyktor-2-pack-45-och-35-cm-konstrotting` | `FP-solcellslyktor-2-pack-45` | 173816665 |
| `a8cf27cd` | `solcellslykta-61-cm-brun-konstrotting` | `FP-solcellslykta-61-cm-brun` | 481320260 |

☠️ **SKU-krocken fångades när SLUGGEN valdes, inte vid Steg 8.**
`solcellslampa-rotting-144-cm…` och `solcellslampa-rotting-130-cm` kapar båda
till `FP-solcellslampa-rotting` — krocken syns inte i sluggen, den uppstår i
den kapade strängen (uppgift #473). Talet flyttades före materialordet, och
SKU:n räknades ur `lib/import/sku.ts` regel i samma stund sluggen skrevs.

Bilderna: 32-bildersgallerier skrivna och **verifierade med separat re-GET**
på alla sex — fyra tyska bilder bort, kortet på plats 3, måttritningen sist.

### ☠️ Två delade moduler var TRASIGA, och båda hade fungerat av en slump

1. **`kortrunda.kontroll` gav falsklarm på korrekt data.** Den rapporterade
   "kortet saknar måttraden" om ett kort som bär TVÅ måttrader, eftersom
   `"Mått,".endswith("mått")` är FALSKT — skiljetecknet räknades som en del av
   ordet. Runda 130:s tvålyktorsprodukt har etiketterna `Mått, större lyktan`
   och `Mått, mindre lyktan`, och den är den första på nio rundor med ett komma
   i etiketten. Lagat med `_matt_ord()` + nio testfall.

2. ☠️ **`kortbygge`s `mjuka` var DÖD KOD i nio rundor.** `bygg` väljer
   `foton.get(k) or kalla(...)`, och `kortrunda.kor` fyller ALLTID `foton` via
   `hamta_hjaltar` — alltså nåddes `kalla`, den enda användaren av `mjuka`,
   aldrig. Bevisat på BYTE: identisk filstorlek vid blur 1,1 / 1,8 / 2,4 / 3,0.
   Verktyget skrev ut `MJUKA UPP FOTOT` som åtgärd och struntade sedan i
   parametern som utför den. `mjuka_upp()` är utbruten ur `kalla` och gäller
   nu oavsett var fotot kom ifrån.

**Båda är samma familj som resten av husets dyra buggar: en kontroll som
fungerade av en slump, och en åtgärd som aldrig kördes.**

## Steg 10 & 13 — kategori, publicering, stämpel

Kategorierna skrevs till föräldern `Trädgård & Utemöbler` och lövet
`Trädgårdsdekor & Belysning`, två lyckade per produkt. **Verifierade med en
SENARE läsning** (`?fields=DIRECT_CATEGORIES_INFO`) — skrivningen är eventuellt
konsistent och en omedelbar återläsning kan ljuga negativt (uppgift #357):

```
6/6  kategorier: 3 (de två + All Products)   visible: true   saknas: []
```

Publiceringen satte `visible: true` på BÅDE produkten och varianten — produktens
`visible:false` speglas nedåt på varianterna, så bara den ena hade lämnat sidan
oköpbar. Priserna ekades ordagrant ur samma läsning som gav revisionen; **inget
pris rördes**.

Stämplingen gick genom `polish-mapping.yml` i `stampla`-läge, sex körningar.
☠️ **Kvittot är `PRODUCT_ID` i loggens env-block, aldrig körningarnas ordning** —
alla sex lästa en och en:

| `PRODUCT_ID` | variant-SKU i patchen | `ändrat` |
|---|---|---|
| `65e3c24f-…` | `FP-solcellslampa-144-cm-tre` | needsAiPolish, draftStatus, variantSkus |
| `4e23a904-…` | `FP-solcellslampa-bage-178` | ✅ |
| `66a26135-…` | `FP-solcellslampa-pelare-77` | ✅ |
| `5ffb91a2-…` | `FP-solcellslampa-130-cm` | ✅ |
| `ef0c374b-…` | `FP-solcellslyktor-2-pack-45` | ✅ |
| `a8cf27cd-…` | `FP-solcellslykta-61-cm-brun` | ✅ |

## Steg 14 — live-grinden: 6 av 6 gröna

```
grind.sjalvtest():     saknas — rundans grind självtestas i mutation.py
grindar._sjalvtest():  56 fall, 0 fel

65e3c24f  solcellslampa-144-cm-tre-skarmar-konstrotting    HIT    0 fel
4e23a904  solcellslampa-bage-178-cm-konstrotting           HIT    0 fel
66a26135  solcellslampa-pelare-77-cm-konstrotting          HIT    0 fel
5ffb91a2  solcellslampa-130-cm-konstrotting                HIT    0 fel
ef0c374b  solcellslyktor-2-pack-45-och-35-cm-konstrotting  HIT    0 fel
a8cf27cd  solcellslykta-61-cm-brun-konstrotting            HIT    0 fel

SUMMA: 6 sidor, 0 fel
```

### ☠️ Tionde kopian blev en DELAD MODUL — och en kopia hade redan drivit

Live-grinden har burits som en egen fil per runda, och filerna drev isär
mätbart:

| runda | rader | `GR.sjalvtest()` |
|---|--:|---|
| 125 | 187 | — |
| 126 | 220 | — |
| 127 | 219 | — |
| 128 | 106 | **körs** |
| 129 | 59 | **tappad** |

Runda 128 körde alltså rundans EGEN grindsjälvtest i Steg 14; runda 129 bantade
filen och tappade anropet, och ingen såg det — ett bortfall av exakt samma slag
som `kortbygge.mjuka` ovan. Reglerna hade redan flyttat till
`grind.granska(pid, html, live=True)`; **ordningen att köra dem** bor nu i
`liverunda.kor`, och `runda-130/livegrind.py` är 25 rader data. Anropet till
rundans självtest är villkorat på förekomst och skriver ut när det SAKNAS —
tystnad var det som gjorde bortfallet osynligt.

Samma skäl som `kortrunda.py`, `SHIP_AXIS_RE`, `EU_TULL_CODES` och
`mapWithConcurrency`: **en regel som varje runda måste minnas glöms bort.**

## Rundan är klar

Sex sidor live, stämplade, kategoriserade och live-grindade. Noll priser rörda,
noll artikelnummer skrivna, noll byggen utlösta (allt ligger i `docs/` och
`tools/polish-assets/`).
