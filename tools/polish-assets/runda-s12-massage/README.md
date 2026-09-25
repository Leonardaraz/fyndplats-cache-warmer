# Runda S12: Massagebänkar, och två massagesidor byter sökord (2026-09-24)

Två befintliga sidor hade samma huvudord i titeln:

- Massage & Återhämtning: "Massagebänkar & massageutrustning"
- Kropp & Välbefinnande: "Massagebänkar & hjälpmedel för kroppen"

De delade alltså på *massagebänk*, och ingen av dem bestod mest av bänkar.
Massage & Återhämtning har 78 produkter, varav 64 stolar och fåtöljer och elva
bänkar. Kropp & Välbefinnande har åtta produkter, varav en bänk.

Rundan ger bänkarna en egen sida och flyttar de två gamla sidorna till ord som
ingen annan sida tar. Allt följer med i samma butiksdeploy som S6–S11 (#647).

## 1. Data

Semrush (Sverige), volym per månad och svårighet, hämtat 2026-09-24:

| sida | sökord (volym/svårighet) | produkter |
|---|---|--:|
| massagebankar (ny) | massagebänk 1 900/24, massagebord 260/16, behandlingsbänk 260/4, massagesäng 210/16, massagebänk hopfällbar 170/11, bärbar massagebänk 90/6 | 10 |
| massage-aterhamtning | fåtölj med uppresningshjälp 140/9, uppresningsfåtölj 70/5, kontorsstol med massage 70/6 | 78 |
| kropp-valbefinnande | rollator 4 400/13, sittdyna 4 400/18, ljusterapilampa 2 900/18, dagsljuslampa 1 000/19 | 8 |

### Var vi rankar i dag

Samma dag, Semrush för fyndplats.se:

| sökord | position | volym | sida |
|---|--:|--:|---|
| massagebänk | **28** | 1 900 | /kategori/massage-aterhamtning |
| massagesäng | 39 | 210 | /kategori/massage-aterhamtning |
| massagebank | 40 | 30 | /kategori/massage-aterhamtning |
| kontorsstol massage | **10** | 40 | en produktsida (kontorsstol med massage och fotstöd) |
| massageapparat bäst i test | 18 | 880 | /basta-i-test/massagepistoler |

Kropp & Välbefinnande rankar inte på något alls.

**Avvägningen:** Massage & Återhämtning ligger på sida tre för *massagebänk*,
och där kommer nästan inga klick. Den nya sidan har alla tio bänkar och ordet
i titeln, så relevansen för *massagebänk* samlas där. Den gamla sidan beskrev
bänkar men bestod mest av stolar. Priset är att placeringen kan sjunka en tid
medan Google hittar den nya sidan. På sida tre kostar det i praktiken ingenting.

Produktsidan på plats 10 för *kontorsstol massage* kan få konkurrens av den
nya titeln. Volymen är 40 i månaden, och en kategorisida med fjorton stolar är
en rimligare landningssida för ett generiskt sökord än en enskild stol.

Orden till Massage & Återhämtning har låg volym. Sidan är ändå värd en ny
titel av två skäl: den gamla titeln tävlade med den nya bänksidan, och den
beskrev en tiondel av sidans produkter.

Kropp & Välbefinnande har bara två rollatorer, en ljusterapilampa och en
sittdyna. Orden är ändå de enda på sidan med volym, och den gamla titeln
lovade bänkar som sidan inte har.

### Medvetet INTE med, och varför

En svepning över **hela katalogen** (6 067 produkter, 61 sidor, läst till
slutet) på produktnamnen:

| sökord (volym/svårighet) | produkter i katalogen |
|---|--:|
| massagepistol 12 100/28 | **0** |
| massagekudde 3 600/24 | **0** |
| massagedyna 1 900/18 | **0** |
| nackmassage 1 300/17 | **0** |
| fotmassage 4 400/29 | 1 (fot- och vadmassagen) |
| massageapparat 1 000/21 | 1 (muskelmassageapparaten) |

En kategorisida utan produkter rankar inte, och en sida med en produkt är en
produktsida med extra steg. **Det här är en sortimentsfråga och ingen
SEO-fråga.** Massagepistol har högst volym av alla ord i rundan och ingen vara
bakom sig.

Guiden /basta-i-test/massagepistoler rankar redan på plats 18 för
*massageapparat bäst i test* (880 i månaden) utan att vi säljer en enda
massagepistol. Om sortimentet får massagepistoler finns alltså redan en sida
som tar emot trafiken.

## 2. Urvalet

- **Massagebänkar (10):** alla massagebänkar som är synliga, även den
  slutsålda `fd3cd842`. Den dolda och slutsålda `2cfd373a` är inte med. Alla
  tio har *massagebänk* i namnet, och det var produktvakten i skrivanropet.
- **Kopplingarna är additiva.** Bänkarna ligger kvar i Massage & Återhämtning,
  och en av dem ligger kvar i Kropp & Välbefinnande.

## 3. Wix

Kategorin **Massagebänkar** (`95861adf-4118-4418-914d-85c67853c50a`) skapades
2026-09-24 under Skönhet & Hälsa.

- **Planen** står i `koppling.json`, med kontrollsumman **1273416337**
  (FNV-1a över `slug:id,…`). Den räknades om i skrivanropet.
- **Vakterna i samma anrop, före första skrivningen:**
  - varken sluggen eller namnets slug fanns
  - namnet ger exakt den slug butiken räknar fram
  - föräldern fanns och var synlig
  - varje produkt var synlig och hade *massagebänk* i namnet

  De tog 0,4 sekunder och föll inte på något.
- **Resultat:** 10 av 10 kopplade, 0 fel. En separat återläsning visade
  varken saknade eller extra produkter.
- **Wix har nu 118 kategorier, varav 117 synliga.**
- **En raderad produkt ligger kvar som koppling i Massage & Återhämtning:**
  `e9865458` svarar 404 men står kvar bland kategorins 79 kopplingar. Butiken
  visar den inte, eftersom den inte finns. Kopplingen skadar ingenting och
  lämnas orörd.

## 4. Texterna

Tre filer med `seo`, `content` och `facit`, alla RENT genom
`gate-kategori.py`. Omtitlarna bär dessutom fältet `andring` med den gamla
titeln och skälet.

**Kontrollen mot produkterna ändrade sex saker innan något skrevs till
butiken.** Alla sex hade passerat grinden. Grinden fäller en superlativ bara
när den står bredvid ett omfångsord ("av våra"), och ingen av de här gjorde
det.

| fel i utkastet | vad produkterna säger | nu |
|---|---|---|
| "Maxlasten står i varje beskrivning" | tre bänkar anger ingen maxlast | "Där maxlasten anges ligger den mellan 130 och 250 kg" |
| "Höjden ställs mellan 61 och 92 cm" | den slutsålda bänken börjar på 58 cm, två har motstridiga höjder | "höjden går att ställa på alla", och de två som går till 92 cm nämns |
| "två bänkar i trä bär mest" och "den lättaste väger 13 kg" | tre bänkar anger varken vikt eller maxlast, så ingen superlativ håller | vikterna och maxlasterna som faktiskt anges |
| "aluminium gör inte bänken lättare" | produktsidan för `a353ea02` säger att aluminiumramen gör den lättare än en trämodell | bara vikterna, inget påstående om materialet |
| "150 till 165 cm långa i liggläge" | två uppresningsfåtöljer är 144 cm | "144 till 165 cm" |
| "den tjockaste dynan, 9 cm" | fem bänkar anger ingen tjocklek | "en 9 cm tjock dyna" |

Dessutom ströks *och värme* ur "kontorsstolar med massage och värme", eftersom
nio av fjorton har värme, och en FAQ som hänvisade till "det avstånd
tillverkaren anger" skrevs om. Grinden fällde på ordet *tillverkaren*.

**Regeln som följer:** en superlativ eller ett "alla" över en grupp kräver
att **varje** produkt i gruppen anger talet. Saknas talet på en enda vara är
påståendet en gissning, oavsett om grinden ser det.

⚠️ **En observation om produktsidorna som INTE är rättad här:** bänken
`a353ea02` säger att "Aluminiumramen är det som gör den lättare än en
trämodell av samma storlek". Butikens egna träbänkar med samma liggyta,
185 × 60 cm, väger 15,5 kg, och den väger 17,5 kg. Bänken `0baf501b` har frågan *Hur
mycket väger bänken?* utan ett svar i kilo. Båda hör till en produktpolering,
inte till kategorisidan.

**Inget påstående vilar på en slutsåld produkt.** Lagret lästes före texterna.
Slutsålda är bänken `fd3cd842` och massagefåtöljen `1932abe1`, och ingen av
texterna bygger på dem.

## 5. Butiken

Commit `cdf72170` på `claude/sasongskategorier-s6-bz3j9l` (#647).

- `infoga.py`: en ny post och två utbytta. `jamfor.mts` gav **3 av 3 lika
  källan**.
- **Den gamla Kropp-texten** sa att en bänk i aluminium är lättare än en i
  trä, och att vi skickar från EU-lager med 3–7 dagars leverans. Båda är
  borta.
- **Google-flödet:** 2074 Massage Tables (sv: *Massagebord*) för den nya
  sidan, kontrollerat mot taxonomifilen på sv-SE och en-US. Massage &
  Återhämtning och Kropp & Välbefinnande behåller 469 Health & Beauty. De
  blandar stolar, bänkar och hjälpmedel, och en smalare nod hade varit fel för
  de flesta produkterna.
- **Testet för unika huvudsökord:** sju nya ord:
  - *massagebänk* och *behandlingsbänk*
  - *uppresningsfåtölj* och *kontorsstol med massage*
  - *rollator*, *ljusterapi* och *sittdyna*

  Med den gamla Kropp-titeln kvar fäller det med "/massagebänk/i finns i 2
  titlar: kropp-valbefinnande, massagebankar". Det är provat, och sedan
  återställt.
- **/butik:** Skönhet & Hälsa länkar till Massagebänkar.
- **Kontroller:** `npm test` 787 av 787. `tsc` gav samma 76 fel som basen
  (alla i testfiler). `eslint` rent.

## 6. Förhandsbygget

`dpl_F6JAvZAf4oQPZNjDDSVnu7uaAy5c` (`cdf72170`, #647:s huvud) svarade
07:07 UTC, tre minuter efter pushen.

- **53 av 53 sidor är lika källan** för S6–S12. Jämförelsen gäller `<title>`,
  metabeskrivning, canonical, varje introstycke, varje FAQ och antalet frågor
  i FAQPage-JSON-LD. Ingen sida visar `**`. Både de tre S12-sidorna och de 50
  från S6–S11 är lika.
- **Kontrollsidorna** Golvlampor, Skönhet & Hälsa, Hantlar, Köksmaskiner,
  Badrumsskåp, Massagestolar och Hudvård & Ansikte svarar 200 med sina titlar.
  Massagestolar och Hudvård ligger i samma gren som de nya sidorna.
- **Sitemapen** har 104 kategori-URL:er (103 före S12), och alla 53 sidor
  finns med.
- **Antal produkter på sidan mot antal kopplade:**

  | sida | på sidan | kopplade | skillnad |
  |---|--:|--:|---|
  | Massagebänkar | 9 | 10 | den slutsålda bänken `fd3cd842` |
  | Massage & Återhämtning | 75 | 79 | den raderade `e9865458`, den dolda `2cfd373a` och de slutsålda `fd3cd842` och `1932abe1` |
  | Kropp & Välbefinnande | 8 | 8 | ingen (tungtrumman är delvis slut men visas) |

- **Google-flödet:** 4 av de 10 bänkarna går från 469 Health & Beauty till
  2074 Massage Tables. De andra sex behåller 469, eftersom deras första
  underkategori i Wix är Massage & Återhämtning. **Ingen produkt får en sämre
  nod.** S12 rör inga andra produkter i flödet: omtitlarna ändrar inte
  taxonomin.

## 7. Live

#647 mergades 2026-09-25 01:29 UTC och gick live 01:43 UTC med produktionsbygget
`dpl_3Mb4VcsjhGdcxtR5rpuKuVvDFqbK` (hur bygget kom till står i S13:s avsnitt 7).

- `livekoll.py`: **3 av 3** sidor lika källan. Massage & Återhämtning heter
  "Uppresningsfåtölj & kontorsstol med massage" och Kropp & Välbefinnande
  "Rollator, ljusterapilampa & sittdyna".
- Massagebänkar har sina 10 i Wix och finns i sitemapen och menyn.
- **Brödsmulan:** tre bänkar som bara ligger i Massagebänkar får
  *Hem / Skönhet & Hälsa / Massagebänkar / …*. Bänken som ligger kvar i Kropp &
  Välbefinnande (avsnitt 2) får Kropp & Välbefinnande som nivå tre, eftersom
  den sidan har 8 produkter mot Massagebänkars 9 synliga. Regeln gör rätt.
  ☠️ Ska alla tio bänkar peka på Massagebänkar måste bänken ut ur Kropp &
  Välbefinnande. Men sidans intro räknar upp den (*"… och en hopfällbar
  massagebänk"*), och den texten är live. Texten ändras därför först, i en
  butiksdeploy, och kopplingen tas bort i Wix efteråt. Sidan har då sju
  produkter. Omvänd ordning ger en sida som lovar en bänk den inte har.
