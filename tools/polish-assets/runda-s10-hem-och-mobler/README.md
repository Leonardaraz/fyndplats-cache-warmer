# Runda S10: speglar, möbler i sovrum och hall, tvätt och frukost (2026-09-24)

Samma grepp som i S7–S9: sökord med hög volym och låg svårighet, där vi har
produkterna men ingen egen sida. Den här gången är urvalet gjort ur hela
katalogen och inte ur en enskild kategori. Allt följer med i samma
butiksdeploy som S6–S9 (#647).

## 1. Data

**Katalogsvep 2026-09-24:** 3 374 publicerade produkter, varav 3 039 i lager.
Orden i produktnamnen räknades på servern (hela listan ryms inte i ett svar),
och varje produktfamilj räknades sedan med ett eget mönster.

Semrush (Sverige), volym per månad och svårighet:

| sida | sökord | volym | svårighet | produkter |
|---|---|--:|--:|--:|
| speglar | spegel (+ helkroppsspegel 4 400/19, väggspegel 2 400/18, golvspegel 1 900/18, stor spegel 6 600/18) | 33 100 | 18 | 35 |
| byraer | byrå (+ smal byrå 3 600/23, byrå vit 2 400/22) | 33 100 | 29 | 27 |
| tvattkorgar | tvättkorg (+ tvättkorg med lock 1 900/29) | 27 100 | 24 | 14 |
| vattenkokare-brodrostar | vattenkokare (+ brödrost 18 100/22, brödrost 4 skivor 3 600/23) | 22 200 | 28 | 20 |
| sidobord | sidobord (+ avlastningsbord 14 800/18, runt sidobord 720/16) | 18 100 | 18 | 19 |
| nattduksbord | nattduksbord | 18 100 | 29 | 16 |
| bokhyllor | bokhylla (+ låg bokhylla 1 900/20, smal bokhylla 1 600/23) | 18 100 | 27 | 24 |
| badrumsspeglar | badrumsspegel (+ spegel med belysning 5 400/21, badrumsspegel med belysning 3 600/22) | 5 400 | 23 | 17 |

**Vi rankade inte topp 100 på något av dem.** Enligt Semrush `resource_organic`
för fyndplats.se rankar vi topp 100 på bara två sökord med över 3 500
sökningar: *hantlar* (58) och *uppblåsbart tält* (28). En ny sida tar alltså
ingenting från en befintlig sida.

**Speglar och Badrumsspeglar är två sidor, med flit.** Sökresultatet för
*spegel* är allmänna spegelkategorier, medan *badrumsspegel* är
badrumsbutikernas LED-speglar. Speglar har alla 35 speglarna och
Badrumsspeglar sina 17. Det är samma upplägg som en överkategori med en
underkategori.

### Medvetet INTE med i rundan

- **Sängbord (40 500/30).** Ordet står i Soffbord & småbords titel ("Soffbord,
  satsbord, sängbord & konsolbord"), som en annan session satte 2026-09-23
  (`bec08498`). S7:s regel gäller: en titel byts inte dagen efter att den
  satts, eftersom den då inte går att utvärdera. Nattduksbord tar därför
  bara *nattduksbord* i titeln och nämner sängbord i texten.
- **Elementskydd (14 800/24):** fem produkter.
- **Hallmöbel (18 100/23), klädhängare (18 100/16), hatthylla (14 800/17) och
  klädställning (9 900/20).** En egen hallsida är ett naturligt nästa steg,
  men produkterna behöver räknas först. Därför tar Förvaring inte heller de
  orden i sin nya titel.
- **Sittpuff (14 800/20), fotpall (8 100/18), matgrupp (8 100/18), klaffbord
  (8 100/19), barbord (6 600/20), sideboard (12 100/21), projektorduk
  (4 400/24) och vinställ (9 900/29).** Tänkbara nästa rundor, med 9 till 23
  produkter var.
- **Sminkbord (27 100/24):** fem av åtta är sminkbord för barn, precis som i S7.
- **Hängmatta, parasoll, solsäng och pergola:** sommarsortiment.
- **Airfryer (49 500/29):** sex produkter.

## 2. Urvalet

Varje familj söktes fram på namnet och kontrollerades sedan mot
beskrivningen. Spec-raderna och nyckelegenskaperna togs ut på servern, och
påståendena i texterna stämdes av med riktade sökningar i beskrivningarna.

- **Speglar (35):** alla speglar med *spegel* i namnet. Spegelskåp,
  sminkbord, smyckesskåp, kosmetikkylar och garderober med spegel är INTE med.
- **Badrumsspeglar (17):** 14 med LED, varav en slutsåld, och tre utan
  belysning.
- **Sidobord (19):** grillarna med sidobord, golvlampan med bord och katthuset
  är inte med. Satsbordet är inte heller med, eftersom *satsbord* står i
  Soffbord & småbords titel. Trädgårdsbordet är ute för att namnet leder med
  trädgårdsbord.
- **Nattduksbord (16):** barnbokhyllan som bär *nattduksbord* i namnet är en
  bokhylla och står på den sidan.
- **Byråer (27):** alla med *byrå* i namnet, även byrån för barnrummet.
- **Bokhyllor (24):** barnskrivbordet, barngarderoben och leksaksförvaringen
  är inte med, fast de har en hylla.
- **Tvättkorgar (14):** tolv korgar och sorterare, plus två skåp med tippbara
  tvättkorgar.
- **Vattenkokare & brödrostar (20):** tre vattenkokare, tre brödrostar och
  fjorton set.

## 3. Wix

Åtta kategorier skapade 2026-09-24 05:21 UTC:

- under Hem & Inredning: Speglar, Badrumsspeglar och Tvättkorgar
- under Möbler: Sidobord, Nattduksbord, Byråer och Bokhyllor
- under Kök & Husgeråd: Vattenkokare & brödrostar

- **Planen** står i `koppling.json`, med kontrollsumman **1959212227**
  (FNV-1a över `slug:id,…|…`). Den räknades om i skrivanropet.
- **Vakterna i samma anrop, före första skrivningen:**
  - varken sluggen eller namnets slug fanns
  - namnet ger exakt den slug butiken räknar fram
  - föräldern fanns
  - varje produkt var synlig och bar familjens ord i namnet

  De tog 3,1 sekunder och föll inte på något.
- **Resultat:** 172 av 172 kopplade, 0 fel. En separat återläsning gav 8 av 8
  lika planen, med antal och kontrollsumma över de sorterade medlemmarna.
- **Kopplingarna är additiva.** Produkterna ligger kvar i sina gamla
  kategorier.

### Dolda i 13 minuter, eftersom butikens kategorilista kapades vid 100

Med S10 hade Wix 109 kategorier. Butiken läste bara de första 100, sorterade
på id. Nio kategorier föll därför bort ur menyn och gav 404, bland dem
Skönhet & Hälsa och Golvlampor. Golvlampor låg redan utanför efter S9, och
sidan gav 404 i produktion 05:29 UTC.

| tid (UTC) | vad | synliga |
|---|---|--:|
| 05:21 | S10 skapade och kopplade | 109 |
| 05:31 | de åtta dolda med `categories/visibility`, bara synligheten, kopplingarna kvar | 101 |
| 05:43 | hotfix #649 (`1779e155`) READY i produktion. Alla nio sidor som låg utanför svarar 200 | 101 |
| 05:44 | visade igen med `bulk/categories/show`. 8 av 8 lyckades, och återläsningen visar 8 av 8 synliga | **109** |

Butiken sparar kategorilistan per lambda-instans. En instans som startade
mellan 05:43 och 05:44 kan därför ge 404 på en S10-sida tills den återvinns.
Mätt 05:56: alla åtta S10-sidor svarar 200 i produktion (MISS, nyrenderade)
med mallens titel, så ingen sådan instans svarade. Förhandsbygget och #647:s
produktionsbygge förrenderar alla 109.

## 4. Texterna

Nio filer med `seo`, `content` och `facit`, alla RENT genom
`gate-kategori.py`. Kontrollen mot facit ändrade följande innan något skrevs
till butiken:

- **"Väggspeglarna finns från 40 × 60 cm" föll.** Den asymmetriska spegeln är
  ett par, och den mindre är 49,5 × 31 cm. Texten säger "i flera storlekar och
  former".
- **Badrumsspeglarna är rektangulära och bågformade, plus *en* rund.**
  Utkastet skrev "runda" i plural.
- **"Inbyggd laddstation" på två sängbord föll.** Det ena har eluttag och USB
  men kallar det inte laddstation. RGB-bordets USB driver bara belysningen.
- **Barnhyllorna har *en* kubhylla med tyglådor**, inte flera.
- **Antiimma är en platta *eller folie*.** 26c59183 har en platta på 50 × 40
  cm, och c6a489bf en folie på 30 × 20 cm som stänger av sig själv.
- **Tippskydd:** 11 av 27 byråer har det i kartongen. 499c4386 skriver
  "Tippskyddet ingår inte". Texten säger därför *flera*, inte *nästan alla*.
  Bland bokhyllorna har 18 av 24 tippskydd, och alla höga i lager har det.
- **C-form:** tre sidobord, inte fyra. Hos paret i marmorlook står "skjuts in
  under det stora", och det betyder att det lilla bordet ställs in under det
  stora.
- **IP44:** 11 av 14 LED-speglar, alltså *de flesta*.

**Förvaring & Organisering** (`forvaring-organisering-text.json`, med fältet
`andring`) har ny titel: "Förvaring – förvaringsbänk, skåp & hurts på hjul".
S7:s titel "byrå, bokhylla & förvaringsbänk" hann aldrig gå live, så bytet
kostar ingenting i sökresultaten. Monteringssvaret har inte längre påståendet
om 30–60 minuter, som saknade facit. S7:s fil för Förvaring bär nu
`ersatt_av`, och S7:s `jamfor.mts` och `livekoll.py` hoppar över den.

## 5. Butiken

Commit `d9710540` på `claude/sasongskategorier-s6-bz3j9l` (#647).

- `infoga.py`: åtta nya poster, och Förvaring ersatt. `jamfor.mts` gav
  **9 av 9 lika källan**. S6, S8 och S9 är oförändrade, och S7 ger 12 av 12
  när Förvaring räknas som ersatt.
- **Google-flödet**, kontrollerat mot taxonomifilen på sv-SE och en-US:
  - 595 Mirrors för både Speglar och Badrumsspeglar, eftersom badrumsspeglar
    saknar egen nod
  - 6369 Accent Tables, som på svenska heter exakt *Sidobord*. 1549, som
    först var tänkt, är *Lampbord*.
  - 462 Nightstands, 4195 Dressers, 465 Bookcases och 634 Laundry Baskets
  - 730 Kitchen Appliances för vattenkokare och brödrostar, eftersom fjorton
    av tjugo är set
- **Testet för unika huvudsökord:** *spegel* (som eget ord), *badrumsspegel*,
  *sidobord*, *avlastningsbord*, *nattduksbord*, *byrå*, *bokhyll*,
  *tvättkorg*, *vattenkokare* och *brödrost*. Med *byrå* tillbaka i
  Förvarings titel fäller det med "/byrå/i finns i 2 titlar: byraer,
  forvaring-organisering".
- **/butik:** Hem & Inredning, Möbler och Kök & Husgeråd länkar till de nya
  sidorna.
- **Kontroller:** `npm test` 782 av 782. `tsc` gav samma 75 fel som före
  (alla i testfiler). `eslint` rent.

## 6. Förhandsbygget

Förhandsbygget är `dpl_HvaSkA8AgtYxJzqFhQxBKzSLa91x`, byggt på `b46675e6`. Det är #647-grenen med
`headless-site` inslagen, alltså med hotfixen #649. Det var READY 05:48 UTC, med alla 109 kategorier
synliga. Det första S10-bygget (`d9710540`) gick inte att använda, eftersom butiken då kapade
kategorilistan vid 100.

- **43 av 43 sidor är lika källan** för S6–S10. Jämförelsen gäller `<title>`, metabeskrivning,
  canonical, varje introstycke, varje FAQ och antalet frågor i FAQPage-JSON-LD. Ingen sida visar
  `**`. Rundans nio sidor är med, också Förvarings nya text.
- **Kontrollsidorna** Golvlampor, Skönhet & Hälsa, Hantlar, Köksmaskiner och Badrumsskåp svarar
  200. Det är sidor som låg utanför de 100 första innan hotfixen.
- **Sitemapen** har 96 kategori-URL:er, och alla 43 sidor finns med.
- **Antal produkter på sidan mot antal kopplade:**

  | sida | på sidan | kopplade |
  |---|--:|--:|
  | Speglar | 35 | 35 |
  | Badrumsspeglar | 17 | 17 |
  | Sidobord | 18 | 19 |
  | Nattduksbord | 16 | 16 |
  | Byråer | 26 | 27 |
  | Bokhyllor | 22 | 24 |
  | Tvättkorgar | 13 | 14 |
  | Vattenkokare & brödrostar | 20 | 20 |

  Skillnaden är slutsålda produkter, som sidan döljer i listan (`forListings`).
- **Google-flödet i samma bygge:** 100 av 172 kopplingar bär sidans nya taxonomi-id.
  - Vattenkokare & brödrostar har 20 av 20 och Byråer 21 av 27.
  - Sidobord har bara 4 av 19. De flesta ligger först i Soffbord & småbord, och `taxonomyFor` tar
    produktens första underkategori.
- **Mot produktionens flöde:** 75 av 155 unika produkter byter Shopping-kategori.
  - Alla byten går från en bred nod till en smalare. De breda noderna är 536 Home & Garden,
    436 Furniture, 696 Decor och 594 Lighting.
  - Fem av bytena kommer från S6:s och S7:s mappningar i samma PR: fyra utemöbler går till 4299 och
    ett badrumsskåp till 6356.
  - Stickprov, alla rätt:
    - En tvättsorterare i bambu går till 634 Laundry Baskets.
    - Ett nattduksbord med RGB-LED går från Lighting till 462 Nightstands.
    - Ett C-format sidobord går från Furniture till 6369 Accent Tables.
    - En badrumsspegel med hyllor går till 595 Mirrors.

## 7. Live

#647 mergades 2026-09-25 01:29 UTC och gick live 01:43 UTC med produktionsbygget
`dpl_3Mb4VcsjhGdcxtR5rpuKuVvDFqbK` (hur bygget kom till står i S13:s avsnitt 7).

- `livekoll.py`: **9 av 9** sidor lika källan. Förvarings nya titel är
  "Förvaring – förvaringsbänk, skåp & hurts på hjul".
- Alla åtta nya sidor finns i sitemapen och i menyn på startsidan.
- Wix lästes före mergen, 01:22–01:29 UTC, med `list-items` per kategori. Ingen av de 172 planerade
  kopplingarna saknas. Poleringen har lagt till 13: Speglar har 40 (35
  planerade), Badrumsspeglar 19 (17), Sidobord 23 (19), Byråer 28 (27) och
  Bokhyllor 25 (24). Två av speglarna ligger i både Speglar och
  Badrumsspeglar.

## Återställning

Kopplingarna är additiva. Butiksposterna tas bort genom att backa `d9710540`.
Förvarings gamla text finns i `1914cb2e`.
