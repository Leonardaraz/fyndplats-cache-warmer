# Fördelning av poleringsfamiljer mellan två sessioner

Skriven 2026-09-05 av sessionen som kör runda 62–66. Syftet är att två chattar ska
kunna polera samtidigt utan att skriva till samma produkt.

☠️ **Krocken är inte teoretisk.** Två sessioner har redan polerat samma katalog
samtidigt (uppgift #262). En produkt som två sessioner skriver till samtidigt får
`revision`-konflikt i bästa fall och en halvt applicerad patch i sämsta.

## Regeln: ägandet går på FAMILJ, inte på produkt

En id-lista blir gammal. En familjeregel gör det inte, och den täcker även de utkast
som importeras i natt.

| Familj | Regel mot produktnamnet | Ägare |
|---|---|---|
| Manuella reclinerfåtöljer | `^Relaxsessel` UTAN `Elektrisch\|Massage\|Aufstehhilfe\|beheizb\|Heiz\|USB\|Motor` | **Runda 62–66-sessionen** |
| Allt annat nedan | se tabellen | **Den andra sessionen** |

Rör inte den andres familj ens för en liten rättelse. Skriv i stället en rad här.

-----

## Mätningen som ligger till grund (2026-09-05)

Läst i ETT svep: **5 499 produkter**, varav **3 618 utkast** och 1 881 publicerade.
`unika == lästa rader`, alltså ingen markör som snurrar på stället.

⚠️ **Två mätfällor, båda uppmätta — gör inte om dem.**

1. **Ledande adjektiv gömmer familjen.** Delsträngen `Sessel` ger **356** utkast,
   huvudordet bara **126**. Skillnaden är namn som `Drehbarer …`, `Elektrischer …`.
   Runbokens regel gäller: kör delsträngen för att HITTA, huvudordet för att RÄKNA.
2. **`Sessel` är inte en familj utan ett dussin.** Histogram över första ordet:

   | | | | |
   |---|--:|---|--:|
   | Relaxsessel | 96 | Kindersessel | 8 |
   | Massagesessel | 28 | Bodensessel | 7 |
   | Schlafsessel | 14 | Fernsehsessel | 7 |
   | Sessel | 14 | Ohrensessel | 6 |
   | Polstersessel | 14 | Klappsessel | 6 |
   | Bürostuhl | 13 | Chefsessel | 5 |
   | Schaukelstuhl | 13 | Gaming(-)Sessel | 8 |
   | Akzentsessel | 10 | Hängesessel | 4 |
   | Aufstehsessel | 9 | | |

-----

## Fyra rundor som är redo att köras

Alla åtta-listor nedan är **utkast (`visible:false`) 2026-09-05**. Läs om produkten
precis innan du börjar — kön ljuger, och en annan session kan ha hunnit före.

⚠️ **Dubblettkollen är INTE gjord för någon av dem.** Jag har bara tagit fram vilka
publicerade sidor de ska jämföras mot. Gör Steg 1-jämförelsen på MÅTT, inte på namn —
se fyndet under runda D för varför.

### Runda A — Barnfåtöljer (`^Kindersessel`), exakt 8

```
4791575c 1399  Kindersessel mit neigbarer Rücklehne 62 x 52 x 69cm Massivholz
1a73ab8d 1159  Kindersessel mit Hocker, Rückenlehne Diamantmuster
188a80b4 1129  Kindersessel mit Ottomane für Kinder von 3 bis 5 Jahren
31710969 1119  Kindersessel Sessel für Kinder mit massiven Holzfüßen
8f150623 1099  Kindersessel, Kindersofa mit Holzrahmen, Samtoptik
b24ce3da 1079  Kindersessel, Kindersofa mit Holzrahmen, Samtoptik
4e92e841 1079  Kindersessel Kindersofa mit Leinen-Optik, massiven Holzfüßen
37d254ee  999  Kindersessel Kindersofa mit Kord-Optik, massiven Holzfüßen
```

- **Steg 2-grinden är verklig här.** Barnmöbel: åldersintervallet i namnet
  ("3 bis 5 Jahren") är ett påstående som måste stämma mot måtten, och ingen
  EN-norm får skrivas ut utan källa. Se uppgift #252 — en husdjursprodukt fick
  barnnormer påklistrade.
- Dubblettkolla mot: `barnfatolj-teddyfleece-bjornoron` (1 029),
  `barnfatolj-med-fotpall` (1 379).
- `8f150623`/`b24ce3da` och `4e92e841`/`37d254ee` ser ut som färgsyskon —
  verifiera på måtten, inte på namnet.

### Runda B — Öronlappsfåtöljer (`^Ohrensessel`), 6 st

```
c0e67ea5 3369  Ohrensessel mit Fußhocker, Polstersessel mit Kautschukholzbeinen
16f36d37 2599  Ohrensessel Relaxsessel Sessel, Vintage-Design, Knopfheftung
7b98c4c1 2599  Ohrensessel im Vintage-Design, Lesesessel, Akzentsessel, Holzbeine
80e4ed24 2329  Ohrensessel Sessel mit Tufting, hoher Rückenlehne, Gepolstert
72f30eb9 2199  Ohrensessel Relaxsessel Sessel, Vintage-Design, Knopfheftung
121ce68f 2159  Ohrensessel Sessel mit Tufting, hoher Rückenlehne, Gepolstert
```

☠️ **Högst dubblettrisk av alla fyra rundorna.** Tre öronlappsfåtöljer ligger redan
publicerade i samma prisband: `oronlappsfatolj-beige-110-cm` (2 969),
`oronlappsfatolj-med-fotpall-gul` (3 199), `oronlappsfatolj-blatt-knappad-rygg`
(2 299). Gör måttjämförelsen FÖRST — det kan visa sig att bara två eller tre av de
sex är nya, och då är rundan en annan.

Fyll på till åtta ur `^Akzentsessel` (10 st) om det behövs.

### Runda C — Hängfåtöljer och golvfåtöljer, 11 st

```
648a9257 4899  Hängesessel mit Gestell, Eiförmiger Hängeschaukel mit abnehmbarem…
814b4e85 4399  Hängesessel mit Gestell für 2 Personen faltbar Hängekorb
ebec4bc1 2529  Hängesessel Outdoor Hängesessel Egg Chair, wetterbeständig
6681ae28 1769  Hängesessel mit Gestell faltbar Polyrattan Hängekorb mit Kissen
666ce96b 2419  Bodensessel mit Rückenlehne, rahmenloser Gaming-Sessel für Erwachsene
724cc4b5 1559  Bodensessel Klappmatratze Schlafmatte, 2-in-1-Design
a8d37d72 1539  Bodensessel Klappmatratze Schlafmatte, 2-in-1-Design
9c71885a 1499  Bodensessel Klappmatratze Schlafmatte, 2-in-1-Design
90529d40 1319  Bodensessel mit 5-fach verstellbarer Rückenlehne, drehbar
db34f7d5 1299  Bodensessel mit 5-fach verstellbarer Rückenlehne, drehbar
87717be0 1299  Bodensessel mit 5-fach verstellbarer Rückenlehne, drehbar
```

- **Två produkttyper — dela på två rundor** om det blir rörigt. Hängfåtöljerna är
  utomhus och har egen Steg 2-grind (upphängning, maxlast, väder).
- Dubblettkolla mot: `hangstol-med-stativ-fristaende-morkgra` (2 199),
  `golvfatolj-fallbar-13-lagen` (899), `golvfatolj-360-grader-fem-lagen` (1 229).
  ⚠️ `golvfatolj-fallbar-13-lagen` polerades i runda 65 — de tre `5-fach
  verstellbarer`-utkasten är exakt den produktklassen.
- `724cc4b5`/`a8d37d72`/`9c71885a` och `90529d40`/`db34f7d5`/`87717be0` ser ut som
  två tripplar färgsyskon.

### Runda D — Bäddfåtöljer, 24 st (blir tre rundor)

`^Schlafsessel` (14) + `^Klappsessel … mit Bettfunktion` (6) + de fyra under.

```
Schlafsessel
dd2f1769 3229  Schlafsessel 3-in-1, ausklappbarer Sessel aus Cord
6a204d58 3199  Schlafsessel 3 in 1 Umwandelbarer Sessel mit Bettfunktion
57ba0224 3199  Schlafsessel, 6-stufig verstellbare Lehne, Leinenoptik
82798d95 3149  Schlafsessel 3-in-1, ausklappbarer Sessel aus Cord
583577bc 2959  Schlafsessel, 6-stufig verstellbare Lehne, Leinenoptik
0317a03e 2749  Schlafsessel, 3-in-1 Klappbarer Leinen-Schlafsessel
0761c9d0 2659  Schlafsessel 2-in-1 mit Bettfunktion, Schlafsofa
6efbe712 2639  Schlafsessel, Gästebett, Holz-Armlehnen, metallrahmen
1df737ee 2399  Schlafsessel, Gästebett, verstellbare Rückenlehne, bis 120 kg
02925ee6 2239  Schlafsessel 3 in 1 Klappbar Sessel mit Schlaffunktion, 186 cm
c46bda54 1969  Schlafsessel, Gästematratze, 3-fach faltbar, kompakt
1706c47d 1899  Schlafsessel, Polstersessel, zum Gästebett umwandelbar
79daabe1 1549  Schlafsessel Relaxsessel Gästebett, abnehmbarer Bezug, 70 cm
f8c671b3 1499  Schlafsessel Relaxsessel Gästebett, abnehmbarer Bezug, 70 cm

Klappsessel
0f6ea98d 2969  Klappsessel mit Bettfunktion, klappbarer Relaxsessel in Leinenoptik
1663062d 2829  Klappsessel mit Bettfunktion, klappbarer Relaxsessel in Leinenoptik
8800a1b5 2759  Klappsessel mit Bettfunktion, klappbarer Relaxsessel in Samtoptik
0559bbb2 2619  Klappsessel mit Bettfunktion, Klappbarer Relaxsessel in Samtoptik
3c81a3a6 2569  Klappsessel mit Bettfunktion, Gästebett, faltbar, bis 250 kg
a6eb718c 2499  Klappsessel mit Bettfunktion, Klappbarer Relaxsessel in Samtoptik
```

☠️ **Fyra till, och de heter något helt annat.** De här bär `Relaxsessel im
Skandidesign, Liegesessel, Lesesessel` i namnet:

```
96a6b909 2359  (Beige)      286f4e14 2199  (Dunkelgrau)
c10d0b7e 2079  (Schwarz)    e4e62a4f 2059  (Blau)
```

**De är inte läsfåtöljer.** Tekniska data säger `Bett Größe 185 × 63 × 26 cm`,
`Bett Liegefläche 185 × 60 × 9 cm`, `Lieferumfang: 1 x Schlafsofa`. Ordet "Bett"
står inte i namnet någonstans. Hade de polerats på namnet hade fyra sidor sålt en
säng som en läsfåtölj.

**Och de finns redan publicerade.** Varje mått är identiskt med
`baddfatolj-med-armstod` (eb1e475e, 2 129 kr, gräddvit):

| | utkastet | den publicerade |
|---|---|---|
| Som fåtölj | 63 × 73 × 81 cm | 63 × 73 × 81 cm |
| Sittyta | 56 × 57 × 37 cm | 56 × 57 × 37 cm |
| Sitstjocklek | 20 cm | 20 cm |
| Ryggstöd | 48 × 58 × 9 cm | 48 × 58 × 9 cm |
| Armstöd | 36 × 4 cm, 15 cm över sits | 36 × 4 cm, 15 cm över sits |
| Kudde | 61 × 40 × 11 cm | 61 × 40 × 11 cm |
| Vikt | 17,5 kg | 17,5 kg |

De är alltså **färgsyskon** till en sida vi säljer. Det är inte skäl att välja bort
dem — butiken publicerar färgsyskon — men de ska poleras SOM bäddfåtöljer med
`baddfatolj-med-armstod`:s svenska text som mall.

**Lärdomen för hela runda D: jämför på MÅTT, aldrig på namn.** Leverantörens namn
beskrev fel produkt, och en namnjämförelse hade svarat "ingen dubblett".

Dubblettkolla mot: `baddfatolj-190-cm` (2 519), `baddfatolj-med-armstod` (2 129),
`baddfatolj-gastsang-180-cm` (3 119), `vikbar-baddmadrass-174-cm` (1 499).

-----

## ☠️ Två `^Relaxsessel`-utkast är BODENSESSEL — familjeregeln räcker inte (2026-09-05)

Runda 69:s Steg 1 tog upp paret `64856235` och `4f6bef7d` (1 299 kr, "Relaxsessel
Lesesessel, drehbar, Leinenoptik, 62 cm x 70 cm x 95 cm"). Namnet börjar på
`Relaxsessel`, alltså mitt enligt tabellen ovan. **Produkten är det inte.**
Brödtexten säger `Bodenstuhl`, `Bodensessel` och `Bodensofa`, och `Lieferumfang`
är `1 x Bodensofa`. Ryggen har fem lägen (3 bakåt + 2 framåt) och foten snurrar
360° — samma beskrivning som familj C:s `Bodensessel … 5-fach verstellbarer
Rückenlehne, drehbar`.

Och de tre i den familjen är **redan publicerade** av den andra sessionen, med
exakt måtten ovan:

| publicerad | pris | mått | vikt |
|---|--:|---|--:|
| `db34f7d5` golvfåtölj, grön | 1 299 | 62 × 70 × 95 cm | 11 kg |
| `87717be0` golvfåtölj, mörkgrå | 1 299 | 62 × 70 × 95 cm | 11 kg |
| `90529d40` golvfåtölj, beige | 1 319 | 62 × 70 × 95 cm | 11 kg |
| `c458fc66` golvfåtölj, fem ryggvinklar, **15 cm** sits | 1 229 | — | — |

Utkastens sits är **15 cm** tjock och de publicerade tres är **17 cm**, så
`c458fc66` är troligen samma modell som utkasten och de tre andra en syskonmodell.
Det är inte avgjort här — och det ska inte avgöras av mig: **produkten hör till
familj C, som ägs av den andra sessionen.** Runda 69 lämnade dem orörda.

⚠️ **Lärdomen för den här filens egen regel:** familjeindelningen går på NAMNETS
första ord, och leverantörens namn beskriver inte alltid produkten. Samma fälla
som runda D:s Skandidesign-kvartett, en familj bort. Kör måttjämförelsen mot de
publicerade sidorna innan du polerar ett utkast vars brödtext talar om något
annat än namnet.

-----

## Familjer som är kvar men INTE redo

- **`^Massagesessel` (28) + `^Aufstehsessel` (9) + el-Relaxsessel (27).** Egen
  Steg 2-grind: elsäkerhet, hälsopåståenden, och gränsen mot medicinteknisk
  produkt (uppresningshjälp). ☠️ Dessutom **högst dubblettrisk i hela katalogen** —
  cirka tjugo massage- och uppresningsfåtöljer ligger redan publicerade
  (`uppresningsfatolj-*`, `massagefatolj-*`, `reclinerfatolj-*-massage-*`).
  Mät innan du planerar en runda; det kan vara nästan tomt.
- **`^Bürostuhl` (13) + `^Chefsessel` (5).** Kontorsstolar, inte fåtöljer.
  Se uppgift #123: en skrivbordsstol får inte säljas som arbetsstol utan grund.
- **`^Schaukelstuhl` (13).** Gungstolar — runda 26 polerade åtta. Dubblettrisken
  är hög.
- **`^Polstersessel` (14), `^Akzentsessel` (10), `^Fernsehsessel` (7),
  `^Sessel` (14).** Omätta.

-----

## Hur den här filen hålls levande

Skriv en rad när du tar en familj, och stryk den när den är klar. En familj utan
ägare är fri; en familj med ägare rör man inte.

| Familj | Ägare | Status |
|---|---|---|
| Manuella `^Relaxsessel` | runda 62–73-sessionen | ✅ **KLAR** (0 utkast kvar) |
| `^Kindersessel` | den andra sessionen | ✅ klar (0 utkast) |
| `^Ohrensessel` | den andra sessionen | ✅ klar (0 utkast) |
| `^Hängesessel` + `^Bodensessel` | den andra sessionen | ✅ klar (0 utkast) |
| `^Schlafsessel` + de fyra Skandidesign | den andra sessionen | ✅ klar (0 utkast) |
| **Fåtöljresten** — se nästa avsnitt | **runda 62–73-sessionen** | ☠️ **BÅDA sessionerna skriver här — se sista avsnittet** |
| El-/massage-/uppresningsfåtöljer | — | fri, men INTE redo (egen Steg 2-grind) |
| **Kontorsstolar** (`Bürostuhl`/`Chefsessel`/`Drehstuhl`/`Schreibtischstuhl`) | **runda 62–76-sessionen** | **pågår (runda 76)** — 186 utkast mätt 2026-09-06, 7 publicerade i runda 75 |

-----

## ✅ Fåtöljfamiljen är i praktiken färdig — 30 utkast kvar av 356 (2026-09-06)

Uppmätt i ETT svep efter runda 73: **5 502 produkter, `unika == lästa`,
`avhuggen: false`**, 3 500 utkast och 2 002 publicerade.

| familj | utkast kvar |
|---|--:|
| Manuella `^Relaxsessel` | **0** |
| `^Kindersessel`, `^Ohrensessel`, `^Hängesessel`, `^Bodensessel`, `^Schlafsessel` | **0** |
| `^Sessel`, `^Akzentsessel`, `^Fernsehsessel`, `^Polstersessel`, `^Klappsessel` | 38 |
| …varav el/massage/uppresning (se nedan) | −8 |
| **Äkta manuella fåtöljer kvar** | **30** |

De 174 publicerade fåtöljsidorna är vad Steg 1:s dubblettgrind ska mäta mot.

### ☠️ Uteslutningsregeln måste köras på HELA namnet, inte på första ordet

Åtta av de 38 är el-, massage- eller uppresningsfåtöljer — men de bär
`Fernsehsessel` eller `Sessel` som FÖRSTA ord och avslöjar sig först senare:

```
485cf3e8 6399  Fernsehsessel Relaxsessel mit Aufstehhilfe, Elektrisch TV-Sessel
56ea6bb7 6279  Sessel mit Aufstehhilfe, Massagesessel, Relaxsessel mit
4635adcb 5669  Fernsehsessel mit Aufstehhilfe Elektrisch, Massagesessel mit
d3ee8cea 5599  Fernsehsessel Relaxsessel mit Aufstehhilfe für Senioren
4e619979 5549  Fernsehsessel mit Aufstehhilfe, Wärme- und Massagefunktion
fbe9eb37 5519  Fernsehsessel mit Massage- und Wärmefunktion, Elektrischer
c9944061 5499  Fernsehsessel mit Massage- und Wärmefunktion, Elektrischer
8151ce59 5169  Fernsehsessel mit Aufstehhilfe Elektrisch, Massagesessel mit
```

Filens ägarregel går på namnets första ord — men UNDANTAGSregeln får inte göra
det, för då hamnar åtta elprodukter i en manuell runda. Samma fälla som runda
D:s Skandidesign-kvartett och de två `^Relaxsessel` som var `Bodensessel`:
**leverantörens namn beskriver inte produkten, och det som avgör står inte
först.** De åtta hör till familjen "kvar men INTE redo" längre ned.

### De 30 som är kvar, grupperade på namnmönster

Fyra tydliga syskongrupper — polera hela gruppen i samma runda, annars blir
"finns i fler färger" ofullständig på varje sida som publiceras först:

| grupp | antal | id8 | prisband |
|---|--:|---|---|
| `Akzentsessel mit Hocker … Cord-Optik` | **6** | e1c41327 · 58fb3025 · 66adcdff · 4a9c33d2 · 791e7292 · bc220489 | 2 059–2 499 |
| `Sessel Drehbar Loungesessel … wasserabweisend` | 3 | 2fb3f782 · 3bb43b68 · 5896ed65 | 2 279–2 719 |
| `Sessel, Polsterstuhl mit bequemer Sitzschale` | 3 | 6ec4b0fb · 2b2f7349 · cec69b8f | 1 529–1 669 |
| `Sessel Wohnzimmer Relaxsessel Loungesessel` | 2 | 41395340 · e93fab42 | 1 529 |

⚠️ Grupperingen ovan är gjord på NAMN och är därför bara en HYPOTES. Runda 70
och 72 mätte båda att namnet döljer familjen — kör `Gesamtmaße` +
`Belastbarkeit` + paketmått innan rundan låses.

## ☠️ Familjen grupperas på MÅTT, inte på namn — J var en kvartett (2026-09-05)

Runda 69 tog `37e5dfcf` och `dd5553fa` som ett par. Runda 70 hittade två till
med **exakt samma mått och ordagrant samma tyska brödtext** — `73112149` och
`5c0e83d1` — plus `84e3794d`, som är familj L:s tredje syskon på samma sätt.

Namnen döljer det, för leverantören namnger samma modell olika:

| id8 | tyskt namn (början) |
|---|---|
| `37e5dfcf` | Relaxsessel, 145° neigbar, verstellbare Fußstütze… |
| `73112149` | Relaxsessel, verstellbar, Liegefunktion, bis 120 kg… |
| `5c0e83d1` | Relaxsessel, 145° neigbar, verstellbare Fußstütze… |

Alla fyra: 78 × 87 × 100 cm, liggande 78 × 151 × 89, 145°, 360°, 120 kg,
21,5 kg, paket 79 × 64 × 52, `Kunstleder, Holz`.

**Gruppera på `Gesamtmaße` + `Belastbarkeit` + paketmått innan en runda väljs
ut.** Ett halvt syskonskap ger en publicerad sida vars "finns i fler färger"
är ofullständig så fort resten poleras — och den bristen syns inte förrän
familjen är klar.

---

## ☠️ Fåtöljresten POLERAS AV BÅDA SESSIONERNA — mätt, inte anat (2026-09-06)

Runda 74 tog åtta produkter ur "Fåtöljresten". Mitt i rundan, mellan
media-skrivningen och publiceringen, hade **sex av de åtta fått SKU och
blivit publicerade av någon annan.**

Att det är den andra sessionen är mätt, inte gissat: SKU:n
`FP-manchesterfatolj-petrolbla` har en produktdel på 26 tecken, medan både
`PRODUCT_PART_MAX` i `lib/import/sku.ts` och `sku_bas` i `grindar.py` kapar
vid **24**. Ingen kodväg i repot kan producera strängen — den är handskriven.

**Skadan blev noll, och det var tur.** Inga dubblettsidor skapades (elva
träffar i katalogsvepet: mina åtta plus två publicerade syskon plus en
orelaterad), och min slug, mitt namn, min brödtext, min SEO och alla sex
bilder överlevde på alla åtta. Men det hade lika gärna kunnat bli två sidor
för samma möbel — precis den interna dubblett Google straffar, och som
`CLAUDE.md` kallar "den farliga dubbletten".

⚠️ **Den här filen räckte inte.** Fåtöljresten stod redan som upptagen av
runda 62–73-sessionen när runda 74 började. Ägarskapet var alltså SKRIVET
och ändå kolliderade vi — en fördelningsfil hjälper bara den som läser om
den, och en session som redan valt sin familj läser den inte igen.

**Praktisk regel tills något bättre finns: läs produktens `revision` FÖRE
varje skrivsteg och jämför mot den du senast lämnade.** Runda 74 upptäckte
kollisionen på exakt det sättet (rev 6 → rev 8 utan mina skrivningar
emellan), och det var billigare än varje annan kontroll.

Vid krock: **butiken vinner, inte den egna filen.** Runda 74 behöll de sex
SKU:er som redan låg i butiken och stämplade mappningen med DEM — en
mappning som bär ett annat SKU än butiken är samma klass av lögn som den som
lät prissynken skriva till ingenting i en månad.

-----

## Kontorsstolarna är katalogens största oägda familj — 186 utkast (2026-09-06)

Tagen av runda 62–75-sessionen efter kollisionen i Fåtöljresten. Mätt i samma
svep som ovan (5 502 produkter, `unika == lästa`, `avhuggen: false`):

| mätning | träffar |
|---|--:|
| Delsträng `bürostuhl\|chefsessel\|drehstuhl\|schreibtischstuhl\|gaming.?stuhl\|arbeitsstuhl` | **186** |
| Huvudord (`^Bürostuhl` m.fl.) | 125 |
| **Osynliga för huvudordsmätningen** (ledande adjektiv) | **24** |
| Publicerade sidor med kontorsstols-slug | **37** |

⚠️ **Den gamla siffran i den här filen var `^Bürostuhl` (13)** — den räknades i
fåtöljsvepets scope, inte som en egen mätning. Verkliga talet är fjorton gånger
så stort. En familj mätt "på vägen förbi" är ingen mätning.

☠️ **Trettiosju publicerade kontorsstolar är den högsta dubblettrisken någon
runda mött.** Jämför måtten, inte namnen, innan något poleras.

⚠️ **Massage- och värmemodellerna kräver egen Steg 2-grind** (el, och
hälsopåståenden om massage). De ligger kvar i familjen men poleras inte förrän
grinden är körd — samma hållning som el-/uppresningsfåtöljerna.

### Runda 75 tog sju av dem — och grupp D är nästa

Publicerade 2026-09-06: `kontorsstol-benvit-boucle`, `kontorsstol-ljusgra-boucle`,
`kontorsstol-ljusbrun-boucle`, `kontorsstol-graddvit-fotstod`,
`kontorsstol-brun-fotstod`, `snurrstol-gra-fast-fot`, `snurrstol-benvit-fast-fot`.
Hela rundan ligger i `runda-75/LAGE.md`.

☠️ **Dubblettrisken var inte teoretisk.** Ett åttonde utkast (`501ba88f`) visade
sig vara samma produkt i samma kulör som den publicerade
`kontorsstol-fotstod-sammet` och plockades ur rundan. Bevisningen är åtta
samstämmiga MÅTT — inte paketmåttet, som varken duger som modellsignatur
(runda 74) eller går att jämföra mot publicerade sidor, vilka listar
produktmåttet.

**Runda 76 började på grupp D:** `10235819` (Hellgrau) och `4fa0ae0a`
(Dunkelgrau), 74 × 65 × 120–128 cm, 120 kg. Dubblettgrinden var ren på båda.

### Runda 76 tog åtta — två chefsstolar, tre nätryggar, tre sminkstolar

Publicerade 2026-09-06: `chefsstol-ljusgra-fotstod`, `chefsstol-gra-fotstod`,
`skrivbordsstol-turkos-natrygg`, `skrivbordsstol-rosa-natrygg`,
`skrivbordsstol-ljusgra-natrygg`, `sminkstol-rosa-teddytyg`,
`sminkstol-gra-teddytyg`, `sminkstol-graddvit-teddytyg`.
Hela rundan ligger i `runda-76/LAGE.md`.

☠️ **Fyra av åtta färgord är mätta fram, inte översatta.** Källan kallar en
turkos stol `Grün`, en ljusgrå `Dunkelgrau` och en grå `Grau`. Det är samma
skäl som gjorde färgmätningen till ett eget steg: leverantörens färgord är
inte ett facit, det är en gissning gjord i ett annat land.

☠️ **Importens SKU-krock mätt igen: åtta produkter bar TRE distinkta SKU:er**
före Steg 8. Runda 75 fann fem av sju; den här åtta av åtta. Krocken skapas av
importen, och den syns bara för att Steg 8 läser butiken innan den skriver.

### Runda 77 tog sju — fem ritstolar och ett hjärtryggat färgpar

Publicerade 2026-09-06: `ritstol-uppfallbara-armstod`, `ritstol-utan-armstod`,
`ritstol-med-svankstod`, `ritstol-95-115-cm`, `ritstol-sitthojd-87-cm`,
`skrivbordsstol-vit-hjartrygg`, `skrivbordsstol-rosa-hjartrygg`.
Hela rundan ligger i `runda-77/LAGE.md`.

☠️ **Sökordskrocken låg på sida 31 av 56.** Fem ritstolar i EN runda skulle ha
konkurrerat med varandra OCH med en redan publicerad sjätte,
`ritstol-fotring-natrygg-55-76-cm`. Ett svep som stannat vid sveptakets trettio
sidor hade aldrig sett den. Varje sida bär nu sin egen särskiljare i namn, slug
och title, och de fem korslänkar varandra och den publicerade.

☠️ **`sku_bas` inverterade betydelsen.** `utan` är ett fogeord, så ritstolen
UTAN armstöd fick `FP-ritstol-armstod`. Fogeordet är behållet med flit
(`FP-ritstol-utan-armstod`) — runda 58:s precedens, men första gången
avvikelsen handlar om BETYDELSE och inte om längd.

☠️ **Ny grind i Steg 14: korslänkarnas MÅL.** Faciten hashar den synliga texten,
alltså ankartexten — men `href` bor i ett attribut och stryks av strip. En länk
kan alltså peka i tomma luften med grön textgrind. `live.py` kräver nu `200`
på varje länkmål: rundans sjutton länkar mot åtta mål, alla gröna.

### Runda 78 tog åtta — en NY familj: rullpallar och arbetspallar

Publicerade 2026-09-06: `verkstadspall-med-lador-135-kg`,
`pendelpall-vippande-sits`, `salongspall-utan-rygg-9-cm-skum`,
`arbetspall-rygg-och-fotring`, `rullpall-svart-rygg-43-55-cm`,
`rullpall-beige-rygg-43-55-cm`, `rullpall-ringrygg-bred-fot`,
`rullpallar-2-pack-48-63-cm`. Hela rundan ligger i `runda-78/LAGE.md`.

☠️ **De 33 "rullpallarna" var 16.** `Sitzhocker` betyder både *arbetspall på
hjul* och *sittpuff med förvaring*, och sjutton av träffarna var puffar —
en annan produkttyp, redan polerad i runda 24. Ett ord som bär två
produkttyper är ett såll som släpper igenom fel vara; familjen avgjordes på
SPECEN, inte på namnet.

☠️ **Tvillinggrinden fällde `df3a97c6`** — 50 × 50 × 83–98 cm och 120 kg,
exakt samma som den publicerade `arbetsstol-hjul-51-67-cm-avtagbar-rygg`. Och
de TVÅ publicerade sidorna (`arbetsstol-hjul-…` och `sadelstol-med-ryggstod-vit`)
delar redan samma fem tal med varandra — samma klass som #305, flaggat.

☠️ **Två skrivformer där LÄSNINGEN visar fel form.** `slug` är ett objekt på
GET men en NAKEN STRÄNG på PATCH (`400 "Unexpected value for StringValue"`),
precis som bildposten är `{image:{id}}` på GET men `{id, altText}` på PATCH.
Regeln är en, inte två: en skrivning byggd ur ett läst svar väljer fel gren så
fort formerna skiljer sig. Kategorianropets fält heter dessutom `item`, inte
`itemReference` — tredje formfelet i samma runda.

☠️ **`Gesamtabmessungen` är SITSEN, inte fotavtrycket**, på två av åtta:
`239e68b8` anger 39 cm mot ritningens fotkryss på 44, `28532aab` Ø35,5 mot
48,5. Tretton centimeter fel för en kund som mäter sin plats.

☠️ **`sku_bas` inverterade betydelsen andra rundan i rad.** `utan` är fogeord,
så pallen UTAN rygg fick `FP-salongspall-rygg-9-cm`. Efter runda 77:s ritstol
utan armstöd är det inte längre ett undantag utan ett mönster: varje produkt
vars särskiljare är en NEKNING får fel SKU av regeln.

☠️ **Importens SKU-krock mätt en fjärde gång:** `FP-rollhocker` bars av TRE
produkter. Åtta produkter, sex distinkta SKU:er före Steg 8.

**Rullpallsfamiljen har åtta utkast kvar. Kontorsstolsfamiljen ~164.**
