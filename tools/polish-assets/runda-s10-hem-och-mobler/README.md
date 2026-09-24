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

(fylls i)

## 7. Live

(fylls i efter merge 2026-09-25)

## Återställning

Kopplingarna är additiva. Butiksposterna tas bort genom att backa `d9710540`.
Förvarings live-text är fortfarande den från `1914cb2e` tills #647 mergas.
