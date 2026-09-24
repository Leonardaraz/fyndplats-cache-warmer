# Runda S4 + S5 — tretton sökordskategorier och tre sidor som byter sökord

2026-09-24. Leonards fråga var om vi ska jaga sökord med lägre svårighet i
stället för de ord Jysk och IKEA äger. Svaret i data: ja, men med en egen
sida per huvudord. Semrush visade huvudord med 1 900–9 900 sökningar i
månaden och svårighet 10–28 där vi har produkterna men ingen sida att ranka
med. Toppen på Google bestod av zoobutiker, specialbutiker och Biltema, inte
jättarna. Sökord där IKEA eller Jysk ligger etta (skohylla, vinställ,
badrumsskåp) valdes bort.

## 1. Urvalet

Semrush SE, uppmätt samma dag (sökningar/mån · svårighet 0–100):

| sida | huvudsökord | produkter | toppen i dag |
|---|---|--:|---|
| Elbilar för barn | elbil barn 8 100 · 14; fyrhjuling barn 5 400 · 17 | 54 | — |
| Klösträd | kattträd 8 100 · 23; klösträd 5 400 · 27 | 106 | tectake, zooplus, kattkompaniet, arkenzoo |
| Kattlådor | kattlåda 8 100 · 23; med tak 2 400 · 20 | 22 | zoobutiker |
| Katthus | katthus 1 900 · 13 | 12 | dealproffsen etta |
| Hundkojor | hundkoja 2 400 · 10; hundhus 590 | 12 | — |
| Redskapsbodar & förråd | redskapsbod 4 400 · 18; förrådstält 1 000 · 11 | 31 | — |
| Sparkcyklar för barn | sparkcykel barn 6 600 · 25 | 31 | euroskateshop, biltema, stiga, stadium |
| Hundbäddar & hundsoffor | hundbädd 9 900 · 16 | 21 | tinybuddy, arkenzoo, zoo.se, dogman |
| Hundburar | hundbur 5 400 · 21 | 17 | arkenzoo, mimsafe, biltema, dogman |
| Garagetält | garagetält 5 400 · 14 | 6 | dancovershop, tältpartner, jula |
| Leksakskök | leksakskök 5 400 · 17 | 10 | IKEA etta, resten små |
| Sandlådor | sandlåda 5 400 · 24 | 8 | — |
| Gunghästar & gungdjur | gunghäst 2 400 · 18 | 19 | — |

Bortvalt: **rutschkana** (12 100 · 18). Toppen är Bauhaus, Biltema och
lekplatsleverantörer med utomhusrutschkanor, medan våra är
inomhusrutschkanor för småbarn. Det är fel sökintention.

Kategorisidorna rankade knappt före rundan. Bäst var *datorbord gaming* på
plats 25, och Lek & Tillbehör för husdjur syntes bara på *djurleksak* runt
plats 90. En flytt riskerade alltså inga befintliga placeringar.

## 2. I Wix

Tretton kategorier är skapade, synliga och kopplade till 349 produkter, med
0 fel per rad i bulk-svaren. En separat återläsning av alla tretton mot
planen gav LIKA på varje kategori.

| kategori | id | förälder |
|---|---|---|
| Elbilar för barn | 611d7185-ef2c-4e40-80af-0a939b344017 | Barn & Familj |
| Sparkcyklar för barn | d578d329-5175-433f-b7e1-a49848810aac | Barn & Familj |
| Leksakskök | 4bb05321-9c2a-4673-97b1-f06aaeb6cf52 | Barn & Familj |
| Sandlådor | 67ed76bd-9e0b-4b55-a72a-80d702257a97 | Barn & Familj |
| Gunghästar & gungdjur | a4401ef3-a3b2-4b77-93f5-57be26b01b11 | Barn & Familj |
| Klösträd | 2886d26c-b2a2-4633-a6c8-12cbb9d76105 | Husdjur |
| Kattlådor | f6833f33-81bc-474d-9c69-353bc84ea053 | Husdjur |
| Katthus | c1cda19f-f1f8-4793-ac26-3e58ddb658e6 | Husdjur |
| Hundkojor | 150cf556-d8af-4980-8492-873656f7b27a | Husdjur |
| Hundbäddar & hundsoffor | 1c4b09ae-a3fb-4cbc-bdbf-89f67d596342 | Husdjur |
| Hundburar | 9c56abfd-8168-4683-bb63-6d6e07d93276 | Husdjur |
| Redskapsbodar & förråd | 8083286a-260c-4a23-8ad7-9f04285cb8cb | Trädgård & Utemöbler |
| Garagetält | 86186d48-adc5-4fea-bc8b-070285ff7a42 | Trädgård & Utemöbler |

☠️ **Det första urvalet missade fjorton produkter, och det var ett brett svep
som hittade dem, inte urvalet.** Namnsvepet över alla 3 349 publicerade
produkter hittade:
- sex katträd som heter *Kattorn* eller *Klöstorn*, tre klätterväggar med
  sisalstolpe och ett *katträd* (med två t);
- en *Kattstuga*;
- tre gungdjur som heter *Gungren*, *Gungelefant* och *Gungsvan*.

Alla är kontrollerade mot beskrivningen, till exempel sisal eller mattextil
på klösträden, innan de kopplades. Regeln från katalogsvepet 2026-09-07
gäller: en riktad kontroll hittar det den letar efter, så kör den breda ändå.

⚠️ **Hundkojorna låg inte i någon kategori alls**, bara i All Products.
Brödsmulan var alltså *Hem / Butik / produkt*. Kategorin Hundkojor är deras
första.

⚠️ **Lek & Tillbehör för husdjur har en raderad produkt kvar som
kategoripost** (`75714848-cc42-42c6-933b-4341cef91c69`, 404 på GET).
Butiken filtrerar på produkter, så ingen kund ser den, men Wix
`itemCounter` räknar den.

## 3. Butiken — PR #646 mot `headless-site`

- **Texter.** 13 nya sidor och 3 sidor som byter sökord. Varje sida har
  titel, metabeskrivning, brödtext och tre frågor. Källan är
  `<slug>-text.json` i den här katalogen, med ett **facit** per påstående,
  grindat med `../../polish-gates/gate-kategori.py`. Posterna i
  `lib/category-seo.ts` och `lib/category-content.ts` är genererade ur
  filerna med skript. En import av båda filerna jämförd mot källan gav
  16 av 16 identiska.
- **Tre sidor byter sökord** så att ingen konkurrerar med en ny sida:
  - Lek & Tillbehör för husdjur: klösträd → hundtrappa, hundramp, agility,
    kattbädd.
  - Leksaker & Spel: elbilar → gåbil, balanscykel, klätterställning.
  - Baby & Småbarn: gunghästar → lekmatta (3 600 · 13), gåvagn (2 400 · 20),
    babygunga (1 600 · 19).
- **Nytt test:** `ett huvudsökord finns i exakt en kategorititel`. Det fällde
  krocken i Baby & Småbarn, som bar "gunghästar" i titeln, redan vid första
  körningen.
- **Google-flödet (`google.xml`):** de nya slugarna mappas till samma
  Google-kategori som produkterna redan hade. Barn & Familj är omappad med
  flit, så utan raderna hade en elbil vars första underkategori blev Elbilar
  för barn tappat 1239 (Toys & Games).
- **/butik (`category-groups.ts`):** de nya underkategorierna och Julgranar
  länkas som chips från gruppkorten. Mega-menyn hämtar dem ur Wix på egen
  hand.

### Struktur: en flytt, resten tillägg

Klösträden (106) **flyttas ut** ur Lek & Tillbehör för husdjur. De utgjorde
60 % av den sidans lista, och en sida med titeln "Hundtrappa, hundramp …"
som mest visar katträd hänger inte ihop. Flytten görs precis före merge, så
att titel och lista byts samtidigt.

Allt annat är **additivt**, samma princip som Möbler ("en ingång till, inte
en flytt"). Sparkcyklar, leksakskök, sandlådor och gunghästar ligger kvar i
Leksaker & Spel, och hundburar och hundbäddar i Burar, Kläder & Tillbehör.
Ingen av de gamla sidorna siktar längre på de orden, och det är titeln som
avgör vilken sida som tävlar.

## 4. Fel som fångades före skrivningen

- ☠️ **Luftdäck.** Den första sökningen flaggade nästan alla sparkcyklar. En
  exakt räkning gav 15 luftdäck, 13 massiva EVA/PU-hjul, 2 gummidäck och 1
  okänd. "De flesta har luftdäck" hade varit fel, så texten tar upp valet
  mellan luftdäck och massiva hjul, ordagrant ur beskrivningarna.
- ☠️ **Plyschgunghästar tål inte maskintvätt.** Ljudmodulen sitter inuti
  (e72638dd, 968209bd, 5b080c23). Det planerade "klädseln går att tvätta"
  var fel.
- ☠️ **Hundkojorna är inte isolerade.** Alla tio utomhuskojor säger det
  själva: *"ett väderskydd, inte en isolerad vinterbostad"*. Texten säger
  samma sak.
- ⚠️ **"Står i varje beskrivning".** Två av de tre tillagda gungdjuren anger
  ingen maxvikt, så formuleringen ströks. Samma sak för hundkojornas storlek:
  10 av 12 anger den.
- ⚠️ **Leksakskök "med rinnande vatten"** gäller tre kök, inte alla. Ett kök
  har uttryckligen *"diskho med kran (inget rinnande vatten)"*, så titeln
  lovar inte vatten.

## 5. Att följa upp — hittat på vägen, inte gjort

- ☠️ **Bygglovsmeningen på bodarna på 12,4 m² strider mot Boverket.** Fem
  produktsidor (7f7aa2a4, ca2f0e47, 74e737ee, e74d5f67, 5a30aaa8) säger att
  *"12,4 kvadratmeter är större än vad som är bygglovsfritt i många
  kommuner"*. Friggeboden får vara 15 m² och 3 meter hög. Bodarna har
  yttermått 3,85 × 3,4 m (13,1 m²) och 2 m i nock, så de ryms. Meningen kan
  skrämma bort köpare av de dyraste bodarna (8 779–9 869 kr). Den rättas i
  poleringsflödet, med grindar och återläsning, inte här.
- **Trädgårdens åtta underkategorier saknar egen SEO-titel och text**:
  Växthus & Odling, Utemöbler, Solskydd & Paviljonger, Grill & Utekök,
  Trädgårdsskötsel & Bevattning, Trädgårdsdekor & Belysning, Utelek & Spel
  och Terrassvärmare. *solskydd altan* (720) ligger ändå på plats 53 och
  *utegrill* (590) på 78, på mallens titel.
- **Trädgård & Utemöbler saknas i `MAIN_GROUPS`** och har därför inget
  gruppkort på /butik eller startsidan, trots 405 produkter.
- **Nästa kandidater:**
  - skötbord 8 100 · 24, men bara en produkt;
  - balanscykel 5 400 · 18, fyra produkter, alltså under gränsen fem;
  - vedbod 1 300 · 22, fyra produkter;
  - bollhav 2 900 · 24.
  Alla behöver fler produkter innan en egen sida lönar sig.

## 6. Live

PR #646 mergades 2026-09-24 (`9c5c8b34`, `dpl_CsasozhJWhmfnubiNQWByTCTZxH6`).
Den nya titeln syntes på `/kategori/klostrad` 120 sekunder efter merge.

☠️ **Det blev dagens TREDJE butiksdeploy, inte den andra.** Julgranarna (#645)
byggdes först, och #641 från en annan session byggdes däremellan. Jag räknade
bara mina egna och läste inte deployment-listan före merge. Regeln i
`CLAUDE.md` säger att man ska räkna byggen i listan, och den gäller även för
butiken.

**Klösträden flyttades ur Lek & Tillbehör precis före merge.** Det var 103
stycken, inte 106: tre av de 106 låg aldrig i den kategorin. Bulk-svaret gav
103 lyckade, 0 fel och 0 odetaljerade. En separat återläsning visade Lek &
Tillbehör 62 och Klösträd 106, med noll överlapp. De fyra produkter i Lek som
bär sisal är kattbäddar och husdjurstrappor och ligger kvar.

⚠️ **Återställning:** gör ett bulk-add av Klösträds medlemmar till Lek &
Tillbehör (`ea1313f5-b60d-4264-b44b-76e83e96168c`). Då följer tre produkter
med som inte låg där före flytten. **Vilka tre är inte sparat:** listan över
de 103 räknades fram inne i skrivanropet och returnerades aldrig. Kategorierna
per produkt efteråt skiljer dem inte heller åt. Nästa flytt ska spara
id-listan före skrivningen.

**Förhandsbygget och live gav samma utfall.** Alla 16 sidor hämtades och
jämfördes mot `<slug>-text.json` med `livekoll.py`:

| kontroll | utfall |
|---|--:|
| `<title>` = källans titel + ` \| Fyndplats` | 16/16 |
| metabeskrivning ordagrant | 16/16 |
| brödtextens stycken på sidan | 4/4 på varje sida |
| FAQ, fråga och svar | 3/3 på varje sida |
| FAQPage-JSON-LD, antal frågor | 3 på varje sida |
| brödsmula *Hem / Butik / förälder / sida* | 16/16 |

Antal produkter per sida live, efter butikens egna filter (slutsålda döljs
och bilddubbletter slås ihop):

| sida | kopplade i Wix | visas |
|---|--:|--:|
| Klösträd | 106 | 100 |
| Elbilar för barn | 54 | 41 |
| Redskapsbodar & förråd | 31 | 27 |
| Sparkcyklar för barn | 31 | 31 |
| Kattlådor | 22 | 19 |
| Hundbäddar & hundsoffor | 21 | 21 |
| Gunghästar & gungdjur | 19 | 16 |
| Hundburar | 17 | 16 |
| Katthus | 12 | 11 |
| Hundkojor | 12 | 10 |
| Leksakskök | 10 | 8 |
| Sandlådor | 8 | 8 |
| Garagetält | 6 | 6 |
| Lek & Tillbehör för husdjur | 62 | **56** (154 före flytten) |

Samtliga ligger över gränsen fem.

**Struktur:**
- Alla 14 nya kategorier (de 13 plus Julgranar) finns i kategoriträdet som
  mega-menyn och dropdownen byggs av, med samma antal som sidan visar.
- Alla 14 finns i `sitemap.xml`.
- /butik länkar 12 av dem. Redskapsbodar och Garagetält saknas där eftersom
  Trädgård & Utemöbler inte finns i `MAIN_GROUPS`, se avsnitt 5.

**Google-flödet** (`/feed/google.xml`, 4 264 rader): varje rad för en produkt
på de nya sidorna bär `g:google_product_category`, noll saknas. Klösträd,
kattlådor och hundkojor ger 2, redskapsbodar och garagetält 536, och
leksakskök 1239. De rader som får 537 (Baby & Toddler) eller 536 gör det via
en äldre kategori som produkten redan låg i (Baby & Småbarn, Utelek & Spel).
Det är samma val av första underkategori som före rundan, alltså ingen
regression.

⚠️ **CollectionPage-JSON-LD:ns `description` är fortfarande mallen**
(*"Handla {namn} hos Fyndplats – noga utvalda fynd …"*) och inte sidans
metabeskrivning. Det gäller alla kategorisidor och är inte nytt, men det är
en rad att byta vid nästa butiksdeploy.
