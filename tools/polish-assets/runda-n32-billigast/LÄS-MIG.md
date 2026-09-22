# Runda N32 — åtta produkter, 1 799–1 859 kr

Åtta Aosom-utkast: en elkamin för vägg, en renfamilj med LED, en madrass
140 × 200, två matstolar, en motionscykel, ett vridbart skrivbord, en tv-bänk
och en basketkorg för vägg.

Rundan börjar på **1 799 kr**, där N31 slutade, och går billigast-först till
1 859 kr. Allt som låg på 1 799 kr och redan var avvisat av N31 (barhocker,
fåtöljer, kontorsstolar, förvaringsbänkar, `0263494c`, `4fc0b3b5`, `9fb1ff7f`
och OUT_OF_STOCK-listan) är inte omprövat — avvisningarna gäller.

| id | produkt | SKU | pris | saldo |
|---|---|---|---:|---:|
| 40fb1b24 | Elkamin för vägg 89,2 cm med välvd glasfront – 2000 W och 7 ljusfärger | FP-elkamin-vagg-89-cm | 1 799 kr | 79 |
| c6f8a0f1 | Renfamilj med LED i tre delar – 283 lysdioder och röda rosetter, 134 cm | FP-renfamilj-led-134-cm | 1 819 kr | 115 |
| 8f95113c | Madrass 140 × 200 cm, 20 cm hög – gelmemoryskum och avtagbart överdrag | FP-madrass-140x200-20-cm | 1 819 kr | 75 |
| 41b2bc81 | Matstolar 2-pack i linnelook – ben i gummiträ, sitthöjd 48 cm | FP-matstolar-linnelook-2-pack | 1 839 kr | 62 |
| 6ab7b3b0 | Motionscykel med magnetmotstånd i 8 steg – Bluetooth, sadel 65–91 cm | FP-motionscykel-8-steg | 1 839 kr | 113 |
| b42b4802 | Skrivbord som vrids 360° – hörnbord, rakt eller ihopvridet, med förvaring | FP-skrivbord-vridbart-360 | 1 849 kr | 164 |
| 2808fff3 | TV-bänk 120 cm med två skjutdörrar – rustik brun, för tv upp till 60 tum | FP-tv-bank-120-skjutdorrar | 1 859 kr | 53 |
| db1d494f | Basketkorg för väggmontering 110 × 75 cm – fjädrande ring Ø45 cm | FP-basketkorg-vagg-110-cm | 1 859 kr | 20 |

Alla tio `las`-körningar (de åtta plus två reserver) svarade `supplier:
"aosom"`, `needsAiPolish: true`, `draftStatus: "pending_review"` och
prisgrinden `stämmer: true` (`1,20 × landedCostSek`, charm99). Ingen slutsåld,
ingen låst. `aosomFreightShare` 0,22–0,43 — ingen över 0,5. Saldon 20–164.
Körda med `ref: main`, alltså mot den mergade workflowen med allowlisten.

⚠️ **Ingen av de åtta bär `prisgrupp`** i den del av raden `las` visar, och
prisgrinden räknade husets regel och fick `stämmer: true` på alla. Priset rörs
inte oavsett.

Alla åtta är nu `needsAiPolish: false`, `draftStatus: "published"` —
stämplade via `/api/admin/mapping` (läge `stampla`, run 3647–3654) och varje
stämpel verifierad i en helt SEPARAT `las`-körning (run 3655–3662, åtta loggar
lästa).

## ☠️ Tre priser ändrades MEDAN rundan pågick — inte av rundan

Priserna i tabellen ovan är de som gällde vid `las` 19:21. Under rundan körde
någon annan två jobb från `main`: **"Aosom — synka lager och priser"** (run 30
19:19–19:29, grön, och run 31 19:32–19:52, som slutade `failure` — inte
undersökt här, det är inte rundans jobb) och **"Pris — konkurrentregeln"**
(två körningar 19:18).
Tre av rundans åtta fick nytt pris under tiden:

| id | vid urvalet | efter | när |
|---|---:|---:|---|
| `41b2bc81` matstolar | 1 839 kr | **1 469 kr** | mellan 19:22 och steg 1 (revision 1 → 2 utan att rundan skrivit) |
| `2808fff3` tv-bänk | 1 859 kr | **1 499 kr** | samma fönster |
| `c6f8a0f1` renar | 1 819 kr | **1 669 kr** | 19:52:59 (`aosomSyncedAt`), efter rundans slutläsning |

☠️ **Rundan rörde inget pris.** Steg 1–3 hade inte `variantsInfo` i fältmasken,
och steg 4 skrev tillbaka varianten exakt som en FÄRSK `GET` i samma anrop
lämnade den — med `revision` ur samma läsning, så en samtidig synkskrivning
hade gett `409` i stället för en tyst överskrivning. Steg 4:s egen rapport
visar att den skrev tillbaka de NYA priserna (`prisFore: 1469` och `1499`).

⚠️ **Och prisgrinden säger `stämmer: true` på alla tre efteråt**, med
`grossSek` 1 469, 1 499 och 1 669 i mappningen. Det betyder att
`landedCostSek` sjönk i samma skrivning — kostnaden rörde sig, och priset
följde regeln. Det är ingen drift. Men det betyder också att rundans
prisintervall i rubriken är urvalets, inte dagens.

⚠️ **Vilket jobb som skrev är INTE fastställt.** Renarnas `aosomSyncedAt`
flyttades till 19:52:59, alltså synken. Men matstolarnas och tv-bänkens
`aosomSyncedAt` står kvar på 2026-09-18 respektive 2026-09-22 06:20 — deras
pris och kostnad ändrades alltså utan att synkstämpeln rördes. Det är värt en
egen titt för den som äger prisjobben; rundan har inte gjort den.

⚠️ **Varför det spelar roll för nästa runda:** en `las` är ett ögonblick. Under
en pågående synk kan två läsningar samma kvart ge olika pris, och en runda som
bara jämför mot det FÖRSTA hade kallat det andra drift. Läs `aosomSyncedAt` och
Actions-listan innan en prisavvikelse tolkas.

## Urvalet: 5 984 rader svepta, 107 utkast i spannet, 10 till `las`

### Dubblettskärmen: full täckning, tre pass

| | pass 1 (kandidatlista, 1 799–1 899 kr) | pass 2 (kortlistan, permutationsokänslig) |
|---|---:|---:|
| Lästa rader | **5 984** | **5 984** |
| Sidor | 60 | 60 |
| Utan `plainDescription` | **0** | **0** |
| Publicerade | 3 055 | 3 055 |
| …med tolkbar trippel | **2 423 (79 %)** | 2 423 |
| Utkast | 2 929 | 2 929 |
| …med tolkbar trippel | **2 929 (100 %)** | 2 929 |

Samma metod som `DUBBLETTMATNING.md`: svepet går OFILTRERAT (`filter` på
toppnivå är en tyst no-op, inuti `search` + markör ger `400 SE-1141`), `fields`
skickas om på varje sida, och `utanText` räknas — **0** i varje svep.

☠️ **Mönstret självtestades på alla sju former i SAMMA anrop som svepet**,
innan en enda rad lästes — bokstav efter talet, bokstav före, utan bokstav,
`cm` efter varje tal, decimal sist, B T H och bokstav-före med decimal.
**7 av 7** i båda svepen; svepet hade avbrutit annars.

⚠️ **Utkastens täckning är 100 % av en tråkig anledning:** varje utkast bär
importens spec-flik med `Paketmått: a × b × c cm`, så varje utkast har minst EN
trippel — paketets. Det är därför fotavtrycksgolvet (största måttet ≥ 60 cm)
och en granskning av VILKEN trippel som träffade behövs innan en träff kallas
dubblett.

**Pass 2** ställde de tio på kortlistan mot hela katalogen igen, nu med
tripplarna SORTERADE (så att `140 × 200` och `200 × 140` blir samma) och utan
fotavtrycksgolv. Det gav många falsklarm på paket- och delmått — alla lästa —
och en äkta träff: `8ecc9a1b` (se klustren nedan), som därför ströks ur
kortlistan.

**Pass 3 — på namn**, eftersom en madrass mäts med två tal och inte som en
trippel: alla publicerade sidor med *madrass*, *elkamin*, *renar*,
*basketkorg*, *tv-bänk*, *motionscykel* eller *hörnskrivbord* i namnet listades
och jämfördes. Ingen publicerad madrass 140 × 200; de två publicerade
väggkorgarna är 113 × 73 cm (`db1118d0`, `8a9b1da9`) mot rundans 110 × 75; de
två närmaste motionscyklarna mäter 93 × 48,5 och 103 × 49 cm (`22816ea5`,
`4e68327e`) mot rundans 86 × 51; ingen publicerad elkamin är väggmonterad på
89 cm; ingen publicerad upplyst renfamilj.

### Avvisade i spannet

**Publicerade dubbletter (trippelträff mot en levande sida):**

| id | produkt | pris | krockar med |
|---|---|---:|---|
| `5a18bc0a` | Schuhschrank 20 Paar | 1 839 kr | `3ec7aac4` *Skoskåp för 20 par – fem plan* |
| `4b0a1fdb` | Bistroset Gussaluminium | 1 839 kr | `66d781f8` *Bistroset för 2 personer i gjuten aluminium* |
| `a32b547e` | Outdoor-Katzenhaus | 1 859 kr | `13f60ff6` *Katthus utomhus 96 cm* |
| `0625d9a7` | Hunde Agility Steg | 1 859 kr | `4fdd8d3c` *Balansbom för hund 335 cm* |
| `136b52a7` · `5466fe81` | tunnelväxthus | 1 819 / 1 829 kr | publicerade tunnelväxthus 6 × 3 och 3,97 m — och fel säsong |
| `56da1c05` | Barstühle Cordbezug 2er | 1 819 kr | `f61517b6` *Barstolar 2-pack i manchester* |
| `a1e0b128` | Kinder-Elektroauto Audi RS e-tron GT | 1 839 kr | `4d989256` *Elbil för barn – Audi RS e-tron GT* — och licensfrågan |

**Licens, djurboenden och kluster** — alla skrivna i `FLAGGADE.md` (N32-raderna)
och orörda: inget `las`, ingen stämpling, ingen skrivning.

- Märken i namnet: `d28ff7e4` (Audi), `b1b9afac` (*Audi-lizenziert*), `23d70358`
  (*Bentley GT lizenzierte*), `4974e63e` (Vespa), två Mercedes-kluster om fyra
  och tre utkast.
- Djurboenden: `a2acfed0`, `ad8fcc1c`, `8869a0f7`/`07b3ee0e`, `5e538454`,
  `9fa7b6e1`, `a721e442`/`2b70bbef`. SJVFS-frågan är INTE prövad — källorna
  lästes inte, och det står uttryckligen så i filen.
- Billigare tvilling som utkast: `8ecc9a1b` (elkamin, alla tre tripplarna
  identiska med `32140f01` på 1 619 kr), `f854b88a`, `2ba4f295`, `e470eaf3`,
  `d2b4b403`, `5878da5f`, `21a338f4`.
- Två sidor för en vara utan billigare tvilling: `81eb4872`/`1af22c51`
  (autoscooter, båda 1 799 kr) och `e1f80a21` (turnräck, billigast i sitt
  kluster) — samma hållning som N31 tog på `b6e44df4`.

**Familjer som N27–N31 redan avvisat:** `40403336` och `a8f70d31` (fåtöljer),
`0036618d`, `526052d2`, `9276f63e`, `9f3f78c4` (kontorsstolar), `aa5720a4`,
`26796baf` (barhocker), `14d95b9a` och `021a72a4` (barbord — samma mättade
familj), `7d67adb3` (bäddfåtölj, dessutom trippelträff mot publicerade
`7eee41b6`), och gokartklustret (`28b06f78`, `181892d3`, `8b04789b`, `589058f1`).

**Fel säsong mitt i september**, och rundan gick att fylla med annat:
`caaf0e08` (bistroset), `d06918ec` (tält), `88b9c863` (gungställning),
`357e5acb` (rottinggrupp), `51af5715` och `740c7d47` (växthus), `9722e1ae`,
`95b4f2c6` och `6639767f` (solsängar och dynor), `bcb45a1f` och `46ee944a`
(trädgårdsmöbler), `fbef9f5f` (kolgrill).

**OUT_OF_STOCK i spannet** (lästes, antogs inte): `d93d729a`, `0b36127f`,
`58c60fb4`, `8729625c`, `b47f2372`, `d9f4c334`, `93413274`, `4f2e0c41`,
`7e08f1df`, `cc6549e3`, `3da48fb6`, `d288fee7`, `57dda9ba`, `e5fa8651`.

**Två reserver** klarade `las` och varje spärr men kom inte med för att rundan
var full: `30f2151f` (varmluftsugn 36 L, 1 899 kr) och `2f251ce3` (matstolar i
sammetslook, 1 899 kr). Mellan dem och rundans sista produkt ligger `82000c6b`
(en andra väggbasketkorg, 1 869 kr) och `5c566983` (matsalsbänk, 1 869 kr),
som inte prövades vidare. Alla fyra står under *Bortvalda* i `FLAGGADE.md`.

## Facit bevisat mot skarpa Wix — 8 av 8 på första körningen

`kallor.json` och `bilder.tsv` skrevs av från Wix-svaret och kontrollerades
sedan mekaniskt mot skarpa V3 innan en enda grind kördes: h·31-summa över
`plainDescription` och hela bildlistan i ordning, jämförd på servern, med
`?fields=PLAIN_DESCRIPTION&fields=MEDIA_ITEMS_INFO` och ett avbrott om något av
fälten saknades i projektionen.

**8 av 8 text LIKA, 8 av 8 bildlista LIKA.**

## Sakfel och tveksamheter — hittade i bilderna och i källan

Kontaktarken byggdes FÖRE texten (`bygg-ark.py`, 600 px celler), och de bilder
som bär mått lästes i full upplösning.

- ☠️ **`40fb1b24`: spec-radens mått tillhör en annan modell.** Den importerade
  raden säger `Mått: Modell7/88,5 x 13,5 x 56cm`. Den tyska `Technische Daten`
  säger `89,2 x 13,5 x 48 cm (L x B X H)`, och produktens egen måttbild märker
  **89,2 cm, 13,5 cm och 48 cm**. Texten använder 89,2 × 13,5 × 48 genomgående.
- ⚠️ **`40fb1b24`: två kabellängder i samma källa** — `Leitung: 1,5 m` och
  `Kabellänge: 1,6 m`. Ingen av dem står i den svenska texten.
- ⚠️ **`40fb1b24`: vad sidans lysdioder är.** Källan säger 18 lysdioder som
  *Hintergrundbeleuchtung* i 7 färger. Bild 2 visar ett orange sken på väggen
  ovanför kaminen och bild 4 fyra upplysta fönster på kortsidan. Texten säger
  att de ger ett sken på väggen — inte var de sitter.
- ⚠️ **`6ab7b3b0`: två träningsappar namngivna i källan.** Källan nämner två
  tredjepartsappar vid namn som kompatibla. Texten säger bara *Bluetooth för
  träningsappar*: kompatibiliteten går inte att kontrollera härifrån, och
  apparnas namn är andras varumärken.
- ⚠️ **`6ab7b3b0`: pulsen.** Källans punktlista räknar med `Herzfrequenz`, och
  bild 1 i full upplösning visar en kontaktplatta på det vänstra handtaget.
  Texten nämner puls bland displayens värden men påstår inget om var den mäts.
- ⚠️ **`2808fff3`: måttbilden bär en annan last än texten.** Bild 3 skriver
  *110 lbs (50 kg)* med pilar mot skivan. Källans text säger `50 kg
  (insgesamt), 20 kg (Tischplatte)`. Texten skriver 20 kg på skivan och 50 kg
  för hela bänken, både i brödtexten och som FAQ-svar, och säger åt kunden att
  kontrollera tv:ns vikt. Bilden behålls — den är måttbilden — men den är
  flaggad här.
- ⚠️ **`b42b4802`: bild 5 visar TVÅ skrivbord.** Två förvaringsdelar och två
  skivor i samma rum. Kunden får ett. Bilden är struken.
- ⚠️ **`b42b4802`: inget fälls ihop.** Källan kallar det kompakta läget
  *gefaltet*. Skivan vrids, den viks inte, så texten säger *ihopvridet*.
- ⚠️ **`c6f8a0f1`: färgen.** Källan säger `Silber` i tyskan och `Gold` i
  spec-raden. Bilderna visar ett ljust, silvrigt tyg som lyser gyllene när det
  är tänt, och guldglittrande horn på den största renen. Texten säger det.
- ⚠️ **`8f95113c` och `41b2bc81`: certifieringar som inte står i texten.**
  Madrassens källa hänvisar till en amerikansk skumcertifiering och stolarnas
  till ett textilmärkningssystem (*"entsprechende Bezug"*). Ingen av dem går
  att kontrollera härifrån, och ett certifikat är ett påstående med rättslig
  tyngd — de är utelämnade med flit.
- ⚠️ **`8f95113c`: fastheten står bara i namnet.** `H3 mittelfest` står i det
  tyska produktnamnet, inte i brödtexten. Texten säger *medelfast (H3)*.
- ⚠️ **`db1d494f`: väderbeständigheten står bara i namnet**
  (*wetterbeständig*); brödtexten säger *auf dem Hof*. Texten säger att den
  tål väder och kan sitta ute.

## Bilder strukna

| id | position | skäl |
|---|---:|---|
| `c6f8a0f1` | 4 | tysk grafik: *AUFWÄNDIG GESTALTETE FESTLICHE DETAILS*, *Leuchtend rote Schleifen* |
| `8f95113c` | 3 | tysk grafik: *Kompatibel mit den meisten Bettgestellen*, *Matratzenmaße* |
| `8f95113c` | 4 | tysk grafik: *Einfacher Aufbau*, *Auspacken*, *Ausrollen* |
| `b42b4802` | 5 | visar två exemplar av skrivbordet |

`8f95113c` och `41b2bc81` blir därmed trebildsprodukter; `bygg-media.py`
räknar antalet ur `bilder.tsv` minus `bilder-bort.tsv`. Ingen byte-identisk
dubblett bland rundans 38 hemhämtade filer (md5, noll kollisioner).

## Husmärken i bilderna — flaggade till Leonard

| id | märke | var |
|---|---|---|
| `8f95113c` | **HOMCOM** | en sydd etikett på madrassens kortsida, synlig i alla tre kvarvarande bilder (1, 2, 5); kartongen i den strukna bild 4 bär samma märke |
| `6ab7b3b0` | **SPORTNOW** | på svänghjulskåpan, synligt i alla fem bilderna |

Bilderna är BEHÅLLNA enligt husets praxis (publicera-och-flagga för märken på
själva varan, samma som N31:s Outsunny och HOMCOM). Inget märke står i någon
text, alt-text, SEO-tagg eller SKU. ⚠️ Madrassen är det tydligaste fallet
hittills: etiketten sitter mitt på långsidan i varje bild och är det första
ögat fastnar på. Om Leonard vill ha bort den finns inga bilder kvar utan den.

## Korrekturläsningen av den egna svenskan — ett eget steg

Alla åtta texterna lästes med taggarna strippade, mening för mening, med genus,
kongruens och syftning som enda fråga. **Femton rader ändrades, och ingen av
dem hade fällts av någon grind.** Fem var rena böjningsfel:

| id | stod | ändrat till | varför |
|---|---|---|---|
| `c6f8a0f1` | **Tänd** ser de gyllene ut; släckta är tyget… | **Tända** ser renarna gyllene ut, och släckta är de… | numerus mot plural subjekt, och *släckta* syftade på *tyget* |
| `c6f8a0f1` | Placera kontakten och uttaget **skyddat** | …är **skyddade** från vatten | objektspredikativet ska kongruera med två substantiv |
| `8f95113c` | huvudänden blir **fotände** | …blir **fotänden** | bestämd form |
| `b42b4802` | resten är **vitt** | förvaringsdelen och stålbenet är **vita** | *resten* är ett n-ord; omskrivet till det som faktiskt är vitt |
| `b42b4802` | **Vriden** i vinkel blir **bordet**… | **Står skivan** i vinkel blir bordet… | participet syftade på skivan men satsens subjekt var bordet |

Resten var syftning och precision: *"en stor ren med horn som är 134 cm hög"*
(hornen eller renen?), *"Ryggen är böjd som ett skal runt ryggen"* (stolens
rygg och kundens rygg i samma mening, två gånger), *"byts färgen mellan 7
olika"*, *"de två yttre facken"* där dörrarna döljer SEKTIONER (två fack
vardera), *"markerad ruta"* utan artikel, *"Ramen är förstärkt stål"*
(omskrivet till *av förstärkt stål*, samma konstruktion som N30 och N31 mätte
upp), och ett FAQ-svar utan *långa*.

## ☠️ En grind avbröt på en källa som faktiskt var entydig — `(L x B X H)`

`bygg-axelfacit.py` avbröt på `40fb1b24`:

```
[AVBRYT] ingen måttrad hittad för: 40fb1b24
```

Källans rad är `Maße: 89,2 x 13,5 x 48 cm (L x B X H)` — tre nakna tal och
axelbokstäverna som en förklaring i en parentes efteråt, med ett VERSALT `X`
som skiljetecken. Parsern kände bara bokstav-efter och bokstav-före. Den
svenska spec-raden, som är fallbacken, bar dessutom en annan modells mått.

`axelpar` har fått en tredje form, och den fyrar bara när de två vanliga
tiger och när antalet tal före parentesen är exakt lika med antalet bokstäver
i den. ☠️ **Verifierad mot alla tidigare rundor:** generatorn kördes med den
gamla och den nya koden över alla 48 rundor som har `kallor.json`. **47 gav
byte-identisk `axelfacit.json` och samma slutkod; den enda som skiljde var
N32** (1 → 0). Resultatet för kaminen är `{bredd: 89,2, djup: 13,5, hojd: 48}`
— exakt måttbildens.

## Gate-genomgång

| Gate | Resultat |
|---|---|
| `kallor.json` + `bilder.tsv` mot skarpa V3 (h·31, server-side) | **8 av 8 text LIKA, 8 av 8 bildlista LIKA** |
| Trippelmönstrets självtest (sju former, i samma anrop som svepet) | **7 av 7**, i båda svepen |
| `gate.py` | **0 fynd i 8 filer, 0 varningar** (fyra räkneord kvitterade i `foto-tal.txt`) |
| `bygg-axelfacit.py` + `gate-axel.py` | **0 axelfel** i 8 texter (2 axelkonflikter i källan, upplysning) |
| `gate-alt.py` | **REN**, 8 produkter, 34 alt-texter |
| `gate-seo.py` | **0 fynd** i 8 rader |
| `gate-lager.py` | **0 fynd**, lägsta saldo 20 |
| `gate-sku.py` | **0 fynd** (längsta 29 av 40 tecken) |
| SKU-krock mot ALLA tidigare rundors `sku.tsv` (54 filer, 423 SKU:er) | **8 av 8 unika, noll prefixöverlapp** |
| `gate-superlativ.py` | **REN** |
| `gate-lankar.py` | 0 fynd, inga korslänkar |
| Läcksvep över rundans 13 KUNDVÄNDA filer (alla `gatelib.GRINDAR` + extra tyska ord) | **0 fynd** |
| Teckensvep mot `TILLATNA_TECKEN` | **0 oväntade tecken** |
| `artikelnummer-lackage` + `gate-kopior` + `wixnorm-tvilling` (vitest) | **9 av 9 gröna** |
| Steg 1 (text/namn/slug/visible/SEO) transkriberingsspärr | 0 avvikelser, **8 av 8 skrivna** |
| Steg 2 (media, fil-id + alt) transkriberingsspärr | 0 avvikelser, **8 av 8 skrivna** |
| Steg 3 (kategori, bulk add-items) | 11 anrop, `totalFailures: 0`, per-rad `success: true` på alla **17** |
| Steg 4 (variant-SKU, round-trip från FÄRSK GET, sist och ensam) | spärren `202425706 / 274` räknad ur `sku.tsv` av skript, **8 av 8 skrivna** |
| Samlad SEPARAT slutläsning av alla fyra stegen (`steg5.js`) | **8 av 8 helt verifierade** |
| Mappningsstämpling + oberoende `las`-verifiering | **8 av 8** |

⚠️ **Steg 4:s facit har en generator den här gången.** N31 föll på ett påhittat
SKU-facit — det enda facit som inte hade ett skript bakom sig. `steg4.js` och
`steg5.js` i den här katalogen är byggda av ett skript ur `sku.tsv`, `ids.tsv`,
`namn.tsv`, `seo.tsv`, `slugs.txt`, `vantat-hash.tsv` och `media-hash.tsv`;
inget tal i dem är skrivet för hand. Steg 3:s kategori-id slogs dessutom upp
på NAMN ur en färsk `categories/query` i samma anrop som skrivningen, i stället
för att klistras in.

⚠️ **`steg5.js` bevisar att fälten fanns innan den tolkar dem.** Saknas
`plainDescription`, `media.itemsInfo`, `directCategoriesInfo` eller
`variantsInfo` i projektionen avbryter den för produkten i stället för att
rapportera noll — samma regel som `aterlas.js`.

### Axelkonflikten i källan

`b42b4802`: 150 är `B` och 40 är `T` i tyskan men `L` och `B` i den svenska
spec-fliken. En upplysning om KÄLLAN; texten skriver måtten som tripplar och
binder aldrig 150 eller 40 till fel axel.

## Kategorier

Lästa ur ett FÄRSKT `categories/v1/categories/query` (54 kategorier), och
valda efter vad tidigare rundor gjort med samma varutyp (mätt på de
publicerade sidornas `directCategoriesInfo`). Slutläsningen visar `antalKat`
2–5, alltså de kopplade plus Wix egna `All Products`:

| id | kategori | förebild |
|---|---|---|
| 40fb1b24 (elkamin) | Hem & Inredning + Dekoration & Prydnad + Hushållsapparater | publicerade elkaminer `31245d0d`, `0fe72ae2` |
| c6f8a0f1 (renar) | Hem & Inredning + Dekoration & Prydnad + Trädgård & Utemöbler + Trädgårdsdekor & Belysning | uppblåsbara tomten `d2e7bd0c` |
| 8f95113c (madrass) | Hem & Inredning | golvmadrasserna `c46bda54`, `79daabe1` |
| 41b2bc81 (matstolar) | Hem & Inredning | N31:s matstolar `cae81077` |
| 6ab7b3b0 (motionscykel) | Sport & Fritid + Träning & Gym | `22816ea5`, `4e68327e` |
| b42b4802 (skrivbord) | Elektronik & Tillbehör + Dator & Gaming | hörnskrivborden `58b51373`, `2299c521` |
| 2808fff3 (tv-bänk) | Hem & Inredning + Förvaring & Organisering | tv-bänkarna `fd11ee7b`, `d1fe16a5` |
| db1d494f (basketkorg) | Trädgård & Utemöbler + Utelek & Spel | väggkorgarna `db1118d0`, `8a9b1da9` |

## Kort: medvetet uppskjutet, inte glömt

Samma kostnadsavvägning som N15–N31: inget `kort-filer.tsv` finns i rundans
katalog, och `bygg-medieskrivning.py` rapporterar "inget kort denna runda" per
produkt — ett uttalat val, inte en tyst utelämning.

## Live-verifiering

`hamta-live.sh 130` + `livegrind.py` mot de publicerade sidorna. Alla åtta
slugs är nya adresser, så den varma träffen gav `age=0` på alla åtta — en
förstagångsrendering. Skriptet väntade ut stale-fönstret (305 s) och pausen
innan den skarpa hämtningen.

**8/8 HTTP 200 (135 028–147 773 B), `age` 140–141 s på alla åtta** — ingen
sida serverades ur en äldre rendering. `livegrind.py`: **8/8 REN, orddiff 0**
(425–570 ord per sida), `exit 0`. REN omfattar homoglyf-, sid-, alt- och
SEO-svepen, de tre flikrubrikerna som `<summary>`, brödsmulans kategori och
`OutOfStock`-kollen.

## ☠️ Andra korrekturläsningen gjordes ADVERSARIELLT — och hittade ett fel i SEO:n

Rundans agent stannade före det här steget (den hann skriva, stämpla och
verifiera, men inte läsa den publicerade texten en andra gång). Steget togs
därför över och gjordes som en flerperspektivsgranskning i stället för en
ensam genomläsning: tre oberoende läsare med var sin lins (genomläsning för
grammatik, mekanisk utplockning av varje sats med en/ett, adjektiv eller
particip, och innehåll/läckor/siffror), och varje fynd prövat av tre
oberoende granskare som uttryckligen försökte MOTBEVISA det — ett fynd står
bara om minst två av tre bekräftar det och citatet finns ordagrant i filen.

**Tre råfynd, ett bekräftat (3 av 3), två avfärdade (0 av 3).**

| id | fält | stod | nu | röster |
|---|---|---|---|--:|
| `b42b4802` | metabeskrivning | *hörnbord 105 × 85 cm, rakt 150 cm eller 100 × 40 cm* | *…rakt 150 cm eller **ihopvridet** 100 × 40 cm* | 3/3 |

Uppräkningen namngav två av skrivbordets tre lägen men inte det tredje, så
100 × 40 cm lästes som ett andra mått för det RAKA läget. Källan
(`100B x 40T x 75H cm (gefaltet)`), brödtexten, Egenskaper, FAQ och
produktnamnet säger alla att det är det ihopvridna läget. Ett sakfel i den
text Google visar i sökresultatet — och ingen grind kunde se det, för varje
tal i meningen står i källan och varje ord är korrekt svenska.

De två avfärdade var korrekt svenska: *"om det får ligga kvar"* (syftar på
*svett*, ett t-ord) och en alt-text vars bisats syftar rätt.

Rättelsen gick samma väg som rundans skrivningar: `seo.tsv` först →
`gate-seo.py` (0 fynd, 153 av 160 tecken) → nyttolasten GENERERAD ur filen,
med kontrollsumman omräknad i samma anrop som skrivningen (både titel och
beskrivning, eftersom rundans byggare bara summerar brödtexten) →
fältmask-PATCH med bara `seoData` (revision 4 → 5) → en SEPARAT
återläsning: titel- och beskrivningssumman lika med filens, två taggar,
`keywords: []`, och namn, brödtext, SKU, variantens `visible` och priset
(1 849 kr) orörda → ny live-hämtning och `livegrind.py`, vars SEO-svep
jämför `<meta name="description">` EXAKT mot `seo.tsv`.

**Live efter rättelsen:** ny omhämtning efter ISR-fönstret, 8/8 HTTP 200 med `age` 139–147 s (`2808fff3` gav `HTTP 000` en gång och gick igenom på skriptets eget omförsök). Sidan serverar den rättade texten i både `<meta name="description">` och `og:description` — butiken härleder den senare ur de två taggarna, precis som husets tvåtaggsregel säger. `livegrind.py`, vars SEO-svep jämför EXAKT mot den rättade `seo.tsv`: **8/8 REN, orddiff 0**, `exit 0`.

⚠️ **Varför en adversariell granskning och inte bara en till genomläsning:**
N29–N31 hittade två till fem böjningsfel per runda som ingen grind såg, och
alltid i den egna svenskan. Här fanns inget böjningsfel kvar efter
korrekturpasset före skrivningen (fem rättade där) — men läsaren med
innehållslinsen hittade ett SAKFEL i ett fält som ingen av rundans tidigare
kontroller läste med den frågan. Samma lärdom som katalogsvepet 2026-09-07:
en riktad kontroll hittar det den letar efter.

## Sammanfattning

Alla åtta produkter är publicerade, stämplade och verifierade i separata led:
facit mot skarpa Wix före grindarna (8/8 LIKA), de fyra skrivstegen var för
sig i en senare separat läsning (8/8), mappningsstämpeln via åtta oberoende
`las`-körningar, den publicerade sidan via `livegrind.py` (8/8 REN) och den
publicerade svenskan via en adversariell granskning (ett sakfel i en
metabeskrivning, rättat och omverifierat). Priset rördes inte; tre priser
ändrades under rundan av andra jobb (se avsnittet ovan).
