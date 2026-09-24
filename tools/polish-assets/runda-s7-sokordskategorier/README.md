# Runda S7: elva sökordskategorier till (2026-09-24)

Samma grepp som i S4/S5: sökord med hög volym och låg svårighet, där vi har
produkterna men ingen sida. Den här gången inne i de stora kategorierna:
Förvaring (406 produkter), Fåtöljer (276), Kontorsstolar och Verktyg.

## 1. Data

**Alla kategorier med produkter hade redan en egen titel.** Bara Laddare &
Kablar och Pälsvård & Skötsel saknade, med fem produkter var. Den vägen var
alltså slut, och nästa steg var att hitta grupper av produkter som har egna
sökord men ingen egen sida.

Produktsvep över hela katalogen: 6 025 produkter, varav 3 349 synliga.
Semrush (Sverige), volym per månad och svårighet:

| sida | sökord | volym | svårighet | produkter |
|---|---|--:|--:|--:|
| tv-bankar | tv-bänk | 49 500 | 28 | 18 |
| golvlampor | golvlampa | 33 100 | 23 | 39 |
| badrumsskap | badrumsskåp (+ medicinskåp 2 900, spegelskåp 2 400, högskåp badrum 2 400) | 27 100 | 20 | 54 |
| skoskap-skobankar | skoskåp (+ skohylla 18 100, skobänk 2 400) | 18 100 | 25 | 36 |
| koksoar-koksvagnar | köksö (+ köksö på hjul 2 400, köksvagn 1 000) | 14 800 | 23 | 22 |
| baddfatoljer | bäddfåtölj | 12 100 | 25 | 26 |
| verktygsvagnar-verktygslador | verktygsvagn (+ verktygslåda 8 100) | 9 900 | 16 | 45 |
| varmeflaktar | värmefläkt | 9 900 | 21 | 13 |
| boxningssackar | boxningssäck | 5 400 | 18 | 28 |
| massagestolar | massagestol (+ massagefåtölj 3 600) | 4 400 | 14 | 41 |
| elkaminer | elkamin (+ elektrisk kamin 1 300) | 2 400 | 18 | 27 |

**Vi rankade inte topp 100 på ett enda av sökorden** (Semrush `resource_organic`
för fyndplats.se, alla sökord över 1 000 i volym: 19 rader, inget av dessa). En
ny sida tar alltså ingenting från en befintlig. Allt den får är nytt.

☠️ **En bred föräldrasida med sökordet i titeln räckte inte.** Belysning har
haft titeln "Golvlampor, vägglampor & LED-belysning" och Förvaring "byrå,
skoskåp & garagehylla" sedan 2026-08-12, sex veckor, utan att nå topp 100 på
golvlampa (33 100) eller skoskåp (18 100). Tesen från S4 håller: det krävs en
egen sida med just de produkterna.

**Värmefläkt och elkamin är säsongsord**, med toppen i januari enligt
Semrush-trenden. Sidorna går ut i god tid före uppvärmningssäsongen.

### Medvetet INTE med i rundan

- **Gungstolar (5 400/21), reclinerfåtöljer (3 600/21), barstolar (8 100/25).**
  Fåtöljer och Matbord & stolar bär dem i titeln sedan 2026-09-23. De sattes
  av en annan session i går, och en omtitel dagen efter hade inte gått att
  utvärdera.
- **Husdjurssidor med låg svårighet:** kaninbur 4 400/19, hamsterbur 2 400/13,
  terrarium 3 600/17, hönshus 3 600/18, hundtrappa 2 900/17, hundvagn
  1 900/14. De är en naturlig runda S8.
- **Vedkorg 6 600/13 och vedställ 3 600/25** har säsong nu. Produkterna finns
  (vedställ 9, vedbod 4) men är inte räknade för vedkorg.
- **Tvättkorg (27 100/24)** har bara tio produkter, och **sminkbord (27 100/24)**
  är mest sminkbord för barn, så urvalet matchar inte sökordet.
- **Parasoll, hängmatta och campingstol** har sin topp på sommaren. De tas i vår.

## 2. Wix

Elva kategorier skapade 2026-09-24 03:45 UTC, direkt under en huvudkategori.
Menyn visar bara två nivåer, så en underkategori under en underkategori hade
inte synts där.

| kategori | förälder | produkter |
|---|---|--:|
| Badrumsskåp | Hem & Inredning | 54 |
| Golvlampor | Hem & Inredning | 39 |
| Elkaminer | Hem & Inredning | 27 |
| Värmefläktar | Hem & Inredning | 13 |
| Verktygsvagnar & verktygslådor | Hem & Inredning | 45 |
| Bäddfåtöljer | Möbler | 26 |
| Massagestolar | Möbler | 41 |
| TV-bänkar | Möbler | 18 |
| Skoskåp & skobänkar | Möbler | 36 |
| Köksöar & köksvagnar | Kök & Husgeråd | 22 |
| Boxningssäckar | Sport & Fritid | 28 |

- **Planen** står i `koppling.json`, med kontrollsumman 1464459012. Den räknades
  om i skrivanropet.
- **Innan något skrevs** kontrollerades varje produkt i samma anrop:
  - att prefixet pekar på exakt ett id
  - att produkten är synlig
  - att namnet innehåller sidans sökord

  Vakterna tog 12 sekunder och föll inte på något.
- **Resultat:** 349 av 349 kopplade, 0 fel. En separat återläsning gav
  **11 av 11 lika planen**, med rätt förälder och synlig.
- **Kopplingarna är additiva.** Ingen produkt har flyttats ur sin gamla kategori.

Uteslutet efter kontroll mot beskrivningen:

- **Högskåp:** ett för kök och ett som är en bokhylla ("för böcker och
  dekorationer").
- **Förvaring:** ett smyckesskåp, ett torkställ, tre klädställ med skohylla
  och en knäpall.
- **Övrigt:** en frisörväska, en verktygssats, två utomhusbarvagnar, en
  barvagn och de fyra etanolbrasorna.

## 3. Texterna

Tretton filer, alla grindade RENT med `gate-kategori.py`: elva nya sidor och
två omtitlar. Varje sifferpåstående har ett facit i filens `facit`-fält, med
produktens id-prefix och ett citat ur dess beskrivning.

Tre beslut på vägen:

- **Badrumsfrågan för värmefläktarna besvaras inte med ett ja eller nej.**
  Tre modeller har IP23, och deras egen text säger att de inte hör hemma i
  badrummet. Två har IPX2, och deras text säger motsatsen. FAQ:n hänvisar
  därför till kapslingsklassen i beskrivningen och till en elektriker, och
  gör inget eget påstående om badrumszoner.
- **"Cylindriska kaminer" blev "en cylindrisk kamin".** Det finns bara en.
- **Belysnings och Förvarings gamla slutrad** ("skickas från EU-lager med
  3–7 arbetsdagars leverans") föll i grinden på fraktland. Den är utbytt mot
  rundans standardrad. Övrig gammal text är orörd och står angiven i filens
  `andring`.

## 4. Butiken

Commit `6608dc65` på `claude/sasongskategorier-s6-bz3j9l`, samma gren som S6.
Den följer alltså med **#647 i EN deploy** 2026-09-25, i stället för en egen.

- `lib/category-seo.ts` och `lib/category-content.ts` får elva nya poster och
  två ersatta, genererade med `infoga.py` ur textfilerna. `jamfor.mts` gav
  **13 av 13 lika källan**.
- **Google-flödet** får ett smalare taxonomi-ID per ny sida. Varje ID är
  kontrollerat mot Googles taxonomifil på både sv-SE och en-US:

  | sida | ID | kategori |
  |---|--:|---|
  | badrumsskap | 6356 | Furniture > Cabinets & Storage |
  | golvlampor | 4636 | Lighting > Lamps |
  | elkaminer | 6792 | Home & Garden > Fireplaces |
  | varmeflaktar | 611 | Space Heaters |
  | verktygsvagnar | 3974 | Tool Storage & Organization |
  | baddfatoljer | 6499 | Arm Chairs, Recliners & Sleeper Chairs |
  | massagestolar | 1442 | Massage Chairs |
  | tv-bankar | 457 | Entertainment Centers & TV Stands |
  | skoskap | 5559 | Shoe Racks & Organizers |
  | koksoar | 442 | Furniture > Carts & Islands |
  | boxningssackar | 499720 | Boxing & Martial Arts Training Equipment |

- **Testet för unika huvudsökord** har elva ord till.
- **/butik** länkar till de nya sidorna via `MAIN_GROUPS`.
- **Kontroller:** `npm test` 781 av 781 (782 efter belysningsrättelsen, avsnitt 5). `tsc` gav samma 75 fel före och
  efter; alla fanns redan och alla ligger i testfiler. `eslint` rent.

## 5. Förhandsbygget

`dpl_Fx34qYP3QKEyVU2tjpeBSXwZsPvH` (commit `6608dc65`) blev `READY` efter 166
sekunder. Alla 13 sidor hämtades och jämfördes med källfilerna med
`previewkoll.py`, som kontrollerar status, `<title>`, metabeskrivning, varje
introstycke, varje FAQ och antalet frågor i JSON-LD.

**12 av 13 var lika källan.** Den trettonde var Belysning, och felet fanns
redan live:

☠️ **Butiken visar kategoritexten som REN TEXT** (`<p>{para}</p>` i
`app/kategori/[slug]/page.tsx`). Introstycket om sockel, IP-klass och lumen
hade `**Sockeln**`, `**IP-klassen**` och `**Ljusmängden**`, och asteriskerna
syntes på sidan. Det har de gjort på www.fyndplats.se sedan #400
(2026-08-12), uppmätt samma natt. Styckets text togs oförändrad in i rundan
och bar därför med sig felet.

Kontrollen fällde av en slump: den strippade `**` ur KÄLLAN men inte ur sidan.
Syftet var att tolerera fetstil. Utfallet var att den fångade att fetstilen
aldrig renderas.

- **Rättat** i `belysning-text.json`. Orden är desamma; bara markeringarna är
  borta. Butiksraden är byggd ur filen med ett skript (`a5bafa95`).
- **Grindat på två ställen**, eftersom en regel utan grind glider:
  - `gate-kategori.py` fäller på markup (`**`, `_`, `` ` ``, `<tagg>`,
    `[länk](…)`, `&entitet;`, `#`-rubrik). Alla 42 befintliga kategoritexter
    går igenom. Åtta planterade fel ger åtta fynd, och utan kollen går den
    gamla belysningstexten RENT igenom.
  - Butikstestet `kategoritexterna bär ingen markup` i `category-seo.test.ts`
    täcker titel, beskrivning, intro och FAQ för alla kategorier. Med den
    gamla raden återinförd fäller det, och bara det. `npm test` 782 av 782.
- `jamfor.mts` efter rättelsen: **S7 13 av 13 och S6 12 av 12** lika källan.

Rättelsen verifieras i nästa förhandsbygge, tillsammans med det som mer
följer med i samma push.

## 6. Live

(fylls i efter merge 2026-09-25)

## Återställning

Kopplingarna är additiva. Att ta bort en av de elva kategorierna tar inte
bort någon produkt ur någon annan listning. Butiksposterna tas bort genom att
backa `6608dc65`. Belysnings och Förvarings gamla text finns i `1914cb2e`.
