# Runda S8: sex sökordskategorier för husdjur och ved (2026-09-24)

Samma grepp som i S4, S5 och S7: sökord med hög volym och låg svårighet, där
vi har produkterna men ingen egen sida. Kandidaterna stod redan i S7:s data
("en naturlig runda S8"), och rundan följer med i samma butiksdeploy som S6
och S7 (#647), så den kostar ingen egen produktionsdeploy.

## 1. Data

Semrush (Sverige), volym per månad och svårighet, hämtat samma natt:

| sida | sökord | volym | svårighet | produkter |
|---|---|--:|--:|--:|
| kaninburar-marsvinsburar | kaninbur (+ kaninhus 1 300, marsvinsbur 1 300, kaninbur utomhus 720, kaninbur inomhus 480, kaninhage 390) | 4 400 | 19 | 31 |
| vedstall-vedbodar | vedställ (+ vedställ inomhus 1 900, vedförvaring 1 300, vedbod 1 300, vedställ utomhus 590) | 3 600 | 25 | 15 |
| honshus-honsgardar | hönshus (+ hönsgård 1 600, hönslucka 390, hönsbur 390, hönsrede 260) | 3 600 | 18 | 20 |
| terrarier | terrarium | 3 600 | 17 | 8 |
| hamsterburar-gnagarburar | hamsterbur (+ hamsterbur stor 590, råttbur 590, chinchillabur 320) | 2 400 | 13 | 15 |
| hundvagnar | hundvagn (+ cykelvagn hund 1 000) | 1 900 | 14 | 28 |

Sammanlagt runt 35 000 sökningar i månaden på svårighet 13–25.

**Vi rankar inte topp 100 på något av huvudorden** (Semrush `resource_organic`
för fyndplats.se, alla sökord över 400 i volym). Två produktsidor rankar på
närliggande ord:

- marsvinsburen `f3fdcd4a` på plats **27** för *marsvinsbur* och 30 för *marsvins bur*
- hamsterburen `a97d3650` på plats **20** för *hamsterbur stor*

Båda ligger på sida två eller tre, där klicken är nästan noll. En kategorisida
matchar söksyftet bättre (en lista att jämföra, inte en enskild bur) och
länkar till produkten. Risken är att Google en tid väljer mellan sidorna.
Utfallet går att följa i Semrush.

### Medvetet INTE med i rundan

- **Hundtrappa (2 900/17) och hundramp (880/13).** De står redan i titeln
  *Hundtrappa, hundramp, agility & kattbädd* på Lek & Tillbehör för husdjur.
  Den titeln satte S4/S5 i natt (`6ae80eee`), och den gick live med #646 för
  några timmar sedan. En egen sida nu hade bytt titel på den igen innan
  bytet hunnit mätas. Samma skäl som när S7 lät gungstolar vänta.
- **Vedkorg (6 600/13).** Vi säljer inga vedkorgar. Ett vedställ har en
  vedbärare i canvas, men det räcker inte för en sida med sökordet i titeln.
- **Fågelbur (1 600/23), kattbur (2 900/19) och kattgård (720/14).** Noll,
  noll och en synlig produkt.
- **Hundbur (5 400/21)** har redan en egen sida (Hundburar).

## 2. Urvalet

**Svepet** läste alla 6 025 produkter (två anrop med markör) och matchade de
synliga på namn med breda mönster (`kanin|marsvin|smådjur|hydda|gnagar|hamster…`,
`höns|värp|…`, `\bved|brasved|…`).

**Varje kandidat kontrollerades sedan mot sin beskrivning**, eftersom namnet
inte räcker:

- *Smådjursstall* och *smådjurshage* säger inget om djuret. Fördelningen
  mellan de två bursidorna gjordes på beskrivningen: 31 nämner kanin eller
  marsvin (25 av dem båda), och 15 nämner hamster, gnagare, råtta, degu eller
  chinchilla. Ingen hamnade på båda.
- **Strukna efter kontroll:** ett ankhus (ankor, inte höns), två eldkorgar
  med vedhylla (de är eldkorgar), en elkamin med vedfack, ett set
  eldstadsverktyg utan ställ och en reptilinkubator (den är ingen
  terrarium). Svepets falska träffar föll också bort: ett klösträd med
  "hydda", en terrassvärmare (*osc**iller**ing*), en muskelmassageapparat
  (*r**ödl**jus*) och en gamingstol med kaninöron.

## 3. Wix

Sex kategorier skapade 2026-09-24 ca 04:11 UTC, direkt under en huvudkategori
(menyn visar två nivåer):

| kategori | förälder | produkter |
|---|---|--:|
| Kaninburar & marsvinsburar | Husdjur | 31 |
| Hamsterburar & gnagarburar | Husdjur | 15 |
| Terrarier | Husdjur | 8 |
| Hönshus & hönsgårdar | Husdjur | 20 |
| Hundvagnar | Husdjur | 28 |
| Vedställ & vedbodar | Trädgård & Utemöbler | 15 |

- **Planen** står i `koppling.json` med fullständiga produkt-id och
  kontrollsumman **364083334**: FNV-1a (32 bitar) över
  `slug:id,id,…|slug:…` i planens ordning. Summan räknades om i skrivanropet.
  Ett avskrivningsfel i planen hade alltså bara kunnat avbryta skrivningen,
  aldrig koppla fel produkt.
- **Vakterna i samma anrop, före första skrivningen:**
  - att ingen av de sex slugarna redan fanns
  - att båda föräldrarna fanns
  - att varje produkt var synlig
  - att beskrivningen nämner djuret (de två bursidorna) eller att namnet bär
    sidans ord (de fyra andra)

  De tog 2,3 sekunder och föll inte på något.
- **Resultat:** 117 av 117 kopplade, 0 fel, 0 odetaljerade.
- **Separat återläsning:** antal och en kontrollsumma över de sorterade
  medlemmarna var lika planen på alla sex, med rätt förälder och synlig.
- **Kopplingarna är additiva.** Ingen produkt har flyttats ur sin gamla kategori.

## 4. Texterna

Sex filer, `<slug>-text.json`, med `seo`, `content` och `facit`. Alla går
RENT genom `gate-kategori.py`, som sedan i natt också fäller på markup
(se S7 avsnitt 5).

Varje påstående har ett **facit** ur produktbeskrivningarna, hämtat med
utdrag i samma natt. Facit och två genomläsningar mot det ändrade drygt ett
dussin formuleringar innan något skrevs till butiken. Exempel:

- *"Hönshusen har värprede och sittpinnar"* → **de flesta**. 7 av 9 nämner
  båda; ett saknar rede i texten och ett sittpinne.
- *"Maxvikten står i namnet"* → **oftast**. 25 av 28 hundvagnar har kg i
  namnet, och en har ingen maxvikt alls.
- *"Två vedställ har eldstadsverktyg"* → **flera**. Namnen visar fyra, men
  bara två beskrivningar nämner verktygen. Därför står det nu "i
  produktnamnet eller beskrivningen".
- *"Stålbodarna är två"* → tre produkter i två storlekar.
- *"Cykelvagnarna blir hundvagn"* → gäller **modellerna 2-i-1**, inte alla.
- *"110 cm lång"* → **mäter 110 cm**. Buren står på ben, och namnet säger
  inte om måttet är längd eller höjd.
- En räkning av *fäll* i hundvagnarnas beskrivningar gav 28 av 28, men
  ordet träffar också suffletter. Texten säger därför **"flera är
  hopfällbara"**, vilket produktnamnen bär.

## 5. Butiken

Commit `a538c2df` på `claude/sasongskategorier-s6-bz3j9l`, samma gren som S6
och S7, alltså **#647 i EN deploy** 2026-09-25. Commiten före den,
`a5bafa95`, är belysningsrättelsen ur S7.

- `lib/category-seo.ts` och `lib/category-content.ts`: sex poster,
  genererade med `infoga.py` ur textfilerna. `jamfor.mts` gav **6 av 6 lika
  källan**, och S7 (13/13) och S6 (12/12) var oförändrade.
- **Google-flödet** får ett taxonomi-ID per sida, kontrollerat mot Googles
  taxonomifil på både sv-SE och en-US:

  | sida | ID | kategori |
  |---|--:|---|
  | kaninburar-marsvinsburar | 5017 | Small Animal Habitats & Cages (Smådjursburar) |
  | hamsterburar-gnagarburar | 5017 | samma |
  | terrarier | 5029 | Reptile & Amphibian Habitats |
  | honshus-honsgardar | 6991 | Agriculture > Animal Husbandry (Boskapsskötsel) |
  | hundvagnar | 6276 | Pet Strollers (Vagnar för husdjur) |
  | vedstall-vedbodar | 695 | Log Racks & Carriers (Vedställ och vedkorgar) |

  Hönshus saknar egen nod i taxonomin. 6991 är där äggkläckare och hönsfoder
  ligger. ⚠️ Flödet väljer produktens **första** underkategori, så en
  produkt som redan låg i en annan underkategori behåller dess ID.
- **Testet för unika huvudsökord** har sex ord till. Med *kaninbur*
  planterat i Burar, Kläder & Tillbehörs titel fäller det och namnger båda
  sidorna. Utan den ändringen går det igenom.
- **/butik**: Husdjur länkar till de fem husdjurssidorna. Vedsidan ligger
  under Trädgård & Utemöbler, som inte står i `MAIN_GROUPS`, eftersom menyn
  hämtar den grenen ur Wix.
- **Kontroller:** `npm test` 782 av 782. `tsc` gav samma 75 fel före och
  efter; alla fanns redan och alla ligger i testfiler. `eslint` rent.

## 6. Förhandsbygget

(fylls i)

## 7. Live

(fylls i efter merge 2026-09-25)

## Återställning

Kopplingarna är additiva. Att ta bort en av de sex kategorierna tar inte bort
någon produkt ur någon annan listning. Butiksposterna tas bort genom att backa
`a538c2df`.
