# -*- coding: utf-8 -*-
"""Runda 143 Steg 9 — galleriets NYA ordning och alt-texterna.

Runbokens ordning: 1 hjältebild · 2 verklighetsbild · 3+ eget kort · SIST
måttritning. Importen ger positionerna 1, 2, 3, 8, 9, och på ALLA sjutton är
position 3 måttritningen — kontrollerat på fyra kontaktark, inte antaget.

☠️ ALT-TEXTEN PASSERAR INGEN AV STEG-GRINDARNA av sig själv. Den bor i Wix
   media och aldrig i `texter.py`, så varje regel textgrinden vaktar är
   oskyddad här. `altgrind.py` kör därför rundans EGEN förbudslista plus den
   delade modulen över exakt de strängar som skickas.

☠️ Tre produkter visar en boxsäck som INTE ingår (`f8d974b3`, `d307632a`,
   `b6c4c619`). Alt-texten säger det rakt ut där säcken syns — en alt-text som
   bara beskriver "säcken hängande i kroken" är ett löfte en skärmläsare läser
   som produktinformation.

⚠️ Beskriv VARAN, inte stajlingen: ingen av texterna nämner personen i bilden.
"""

# Kortens fil-id, kvitterade på md5 mot de lokala filerna (`kortkvitto.py`),
# inte på ordningen i uppladdningsanropet.
KORT = {
    "f8d974b3": "b379ce_ddbbfeb6f39b452fa4dc7adbbfef2235~mv2.jpg",
    "d307632a": "b379ce_d5dc55409a1f429b96f15a4a8326c35d~mv2.jpg",
    "49d6d56f": "b379ce_0d382a68b1fc499b833e9e0da0040f02~mv2.jpg",
    "6f603856": "b379ce_b45fb3b1dd0e4835b2012c781e020719~mv2.jpg",
    "c00988e3": "b379ce_7111103ab3c74937b8f78402fe205f96~mv2.jpg",
    "7eeb7497": "b379ce_2a9d1bae3e664c3594ef266fb0aec4a1~mv2.jpg",
    "1409d762": "b379ce_c692e57868c74a6680cde7af60ce4295~mv2.jpg",
    "0deb6901": "b379ce_65328487314847bd8396a5573e9eed3e~mv2.jpg",
    "74602345": "b379ce_2cb51877c448402aab549d50ddf02d77~mv2.jpg",
    "702c7795": "b379ce_d630ccdcedd14abea2b7c85089500055~mv2.jpg",
    "c5c228ab": "b379ce_1834eb0134cc4dab989c2e4030b0be0c~mv2.jpg",
    "9119599f": "b379ce_5836083f9db94d598f316e9ea9f95df1~mv2.jpg",
    "86f2cb63": "b379ce_1931a4c150454acfa877286b57747b36~mv2.jpg",
    "57986794": "b379ce_4463a97e43ce495792da7b57319db7d3~mv2.jpg",
    "438295ae": "b379ce_4155b9ef3c324e4b9bb48f7e9f1e2bd6~mv2.jpg",
    "87ec8a16": "b379ce_8132c0e5bb1a4a1c9221a48d0f361615~mv2.jpg",
    "b6c4c619": "b379ce_ef1dede2bd0e425e8ea7664b01898d47~mv2.jpg",
}

# ☠️ `f8d974b3`s måttritning är OMTVÄTTAD — leverantörens logotyp låg i övre
#    HÖGRA hörnet. Den gamla filen ligger kvar i Media Manager men lämnar
#    galleriet; se `tvatt/LASMIG.md`.
ERSATT = {("f8d974b3", 3): "b379ce_d99dc050470444aeb75907c2e921ebf1~mv2.jpg"}

# Ordningen anges som gamla positioner; "K" är rundans egna kort.
# Bilder som plockas bort (STEG4.md) står helt enkelt inte med.
ORDNING = {
    "f8d974b3": [1, 2, "K", 4, 5, 3],
    "d307632a": [1, 2, "K", 4, 5],          # 3: ritningen är BEVISAT defekt
    "49d6d56f": [1, 2, "K", 4, 3],          # produkten har bara fyra bilder
    "6f603856": [1, 2, "K", 4, 5, 3],
    "c00988e3": [1, 2, "K", 5, 3],          # 4: helbilds husmärkeslogotyp
    "7eeb7497": [1, 2, "K", 4, 5, 3],
    "1409d762": [1, 2, "K", 4, 3],          # 5: helbilds husmärkeslogotyp
    "0deb6901": [1, 2, "K", 4, 5, 3],
    "74602345": [1, 2, "K", 4, 5, 3],
    "702c7795": [1, 2, "K", 4, 5, 3],
    "c5c228ab": [1, 2, "K", 4, 5, 3],
    "9119599f": [1, 2, "K", 4, 5, 3],
    "86f2cb63": [1, 2, "K", 4, 5, 3],
    "57986794": [1, 2, "K", 4, 5, 3],
    "438295ae": [1, 2, "K", 4, 5, 3],
    "87ec8a16": [1, 2, "K", 4, 3],          # 5: engelsk, felstavad etikett
    "b6c4c619": [1, 2, "K", 4, 5, 3],
}

ALT = {
 "f8d974b3": {
  1: "Hopfällbart boxsäcksställ i svart stål, tomt och sett från sidan med den snedställda stolpen och kroken högst upp.",
  2: "Boxsäcksstället uppställt i ett rum med en boxsäck hängd i kroken — säcken ingår inte.",
  "K": "Faktakort: boxsäcksställ 170 × 90 cm, 182–225 cm högt. Kroken sitter 162–205 cm över golvet i tio lägen och bär en säck på 60 kg.",
  4: "Boxsäcksstället mot en vägg, sett snett bakifrån så att benens vinkel och stängerna vid foten syns.",
  5: "Stället i ett hörn med träpanel, där stängerna vid foten är lastade med viktskivor som inte ingår.",
  3: "Måttritning av boxsäcksstället: ramen är 170 cm lång och 90 cm bred, och toppen går från 182 till 225 cm.",
 },
 "d307632a": {
  1: "Boxsäcksställ i svart stål med en röd speedball hängande på ena sidan av ramen och en tom säckkrok på den andra.",
  2: "Boxsäcksstället i ett ljust rum med speedballen monterad och säckkroken tom — boxsäcken ingår inte.",
  "K": "Faktakort: boxsäcksställ 160 × 145 cm, 175–220 cm högt. Speedballen 25 × 25 cm ingår, kroken sitter 165–210 cm över golvet.",
  4: "Närbild på ett av stativets bottenrör där en av de sex stödsträvorna skruvas fast.",
  5: "Närbild på kedjan och kroken i stativets övre ände.",
 },
 "49d6d56f": {
  1: "Boxsäcksställ i svart stål med en röd säck i segelduk hängande i kedjan.",
  2: "Boxsäcksstället med den röda säcken sett från sidan, så att trekantsfotens spets syns mot golvet.",
  "K": "Faktakort: boxsäcksställ 175 × 91 cm, 185–231 cm högt. Säcken Ø29 × 97 cm i segelduk ingår och levereras ofylld.",
  4: "Stället snett framifrån med säcken hängande fritt under den utskjutande överdelen.",
  3: "Måttritning av boxsäcksstället: 185–231 cm högt, 97 cm djupt vid överdelen och 175 × 91 cm i ramen.",
 },
 "6f603856": {
  1: "Boxsäcksställ med böjd ram i svart stål och en svart boxsäck hängande i kedjan.",
  2: "Boxsäcksstället i ett rum med säcken hängande fritt i kedjan under den böjda överarmen.",
  "K": "Faktakort: boxsäcksställ 123 × 141 × 220 cm. Säcken Ø30 × 90 cm på 20 kg ingår, och kedjan roterar ett helt varv.",
  4: "Stället sett från sidan med de tre hållarna för hantelskivor på bottenramen.",
  5: "Boxsäcksstället mot en ljus vägg, där gummirepet spänner säckens undre ände mot bottenramen.",
  3: "Måttritning av boxsäcksstället: 220 cm högt, ramen 123 × 141 cm och säcken 90 cm lång.",
 },
 "c00988e3": {
  1: "Boxsäcksställ där en grå och svart boxsäck hänger på ena sidan av ramen och en orange punchingboll sitter på den andra.",
  2: "Boxsäcksstället mot en betongvägg med säcken i kedjan och punchingbollens skiva högst upp.",
  "K": "Faktakort: boxsäcksställ 115 × 157 × 221 cm. Säcken Ø26 × 86 cm på 20 kg och punchingbollen med skiva Ø60 cm ingår båda.",
  5: "Närbild på stativets bottenrör och den lodräta stolpen där de skruvas ihop.",
  3: "Måttritning av boxsäcksstället: 221 cm högt, ramen 115 × 157 cm och punchingbollen 167–187 cm över golvet.",
 },
 "7eeb7497": {
  1: "Fristående boxningssäck i svart med sex numrerade träffytor i vitt på röda cirklar och en rundad, bred fot.",
  2: "Boxningssäcken stående på golvet i ett rum med snedtak, med de numrerade träffytorna vända utåt.",
  "K": "Faktakort: boxningssäck Ø50 × 165 cm. Slagytan är Ø30 × 95 cm och bär sex numrerade träffytor.",
  4: "Närbild på fotens påfyllningshål med proppen lyft ur.",
  5: "Fotens undersida med sugpropparna sittande i en ring runt kanten.",
  3: "Måttritning av boxningssäcken: 165 cm hög, slagytan Ø30 × 95 cm och foten 50 cm bred.",
 },
 "1409d762": {
  1: "Fristående boxningssäck i svart, hög och smal, stående på en räfflad rund fot.",
  2: "Boxningssäcken stående i ett gym, sedd från sidan så att fjädern mellan säck och fot syns.",
  "K": "Faktakort: boxningssäck Ø50 × 170 cm. Slagytan är Ø28 × 110 cm och foten Ø48 × 30 cm med tolv sugproppar.",
  4: "Närbild på en av fotens sugproppar med påfyllningslocket bredvid.",
  3: "Måttritning av boxningssäcken: 170 cm hög och foten 50 cm bred.",
 },
 "0deb6901": {
  1: "Fristående boxningssäck i svart med en bred slagdyna som sitter som en krage runt säcken, på en räfflad fot.",
  2: "Boxningssäcken stående i ett rum med slagdynan inställd ungefär i midjehöjd.",
  "K": "Faktakort: boxningssäck 57 × 57 × 175 cm. Slagdynan flyttas mellan 65 och 175 cm, och foten rymmer 45 kg sand.",
  4: "Säcken snett framifrån med slagdynans spänne synligt på framsidan.",
  5: "Närbild på säckens rundade topplock ovanför slagytan.",
  3: "Måttritning av boxningssäcken: 175 cm hög och foten 57 cm bred.",
 },
 "74602345": {
  1: "Fristående boxningssäck i svart och rött på en mönstrad fot, med ett tryckt tecken mitt på slagytan.",
  2: "Boxningssäcken stående framför en tegelvägg, sedd rakt framifrån i full höjd.",
  "K": "Faktakort: boxningssäck Ø60 × 180 cm. Slagytan är Ø25 × 110 cm och foten rymmer 60 kg sand.",
  4: "Närbild snett uppifrån på foten, där de tre fjädrarna sitter mellan stången och fotens ovansida.",
  5: "Säcken stående vid ett fönster, sedd från sidan i full höjd.",
  3: "Måttritning av boxningssäcken: 180 cm hög, slagytan 110 cm och foten 60 cm bred.",
 },
 "702c7795": {
  1: "Fristående boxningssäck i svart på en bred fot med taggiga sugproppar runt hela kanten.",
  2: "Boxningssäcken stående på ett gymgolv, sedd från sidan i full höjd.",
  "K": "Faktakort: boxningssäck 60 × 60 × 180 cm. Slagytan är Ø32 × 115 cm och foten rymmer 120 kg sand.",
  4: "Säcken sedd snett framifrån i ett rum med hantlar längs väggen.",
  5: "Säcken stående vid ett fönster med den breda foten närmast i bild.",
  3: "Måttritning av boxningssäcken: 180 cm hög, slagytan Ø32 × 115 cm och foten 60 × 60 cm.",
 },
 "c5c228ab": {
  1: "Fristående boxningssäck klädd i konstläder, brun upptill och svart nedtill, på en rund svart fot.",
  2: "Boxningssäcken stående på ett trägolv, sedd i full höjd med teleskopstången mellan säck och fot.",
  "K": "Faktakort: boxningssäck 58 × 58 cm, 158–186 cm hög. Slagytan är Ø36 × 80 cm och foten Ø55 × 60 cm.",
  4: "Närbild på sömmen där den bruna och den svarta konstläderdelen möts.",
  5: "Fotens ovansida med den kromade kopplingsstången i mitten.",
  3: "Måttritning av boxningssäcken: 158–186 cm hög, kopplingsstången 26 cm och foten Ø55 cm.",
 },
 "9119599f": {
  1: "Boxdocka med formad överkropp i mörkblått och svart, med ljusa träffytor markerade över bröst och mage.",
  2: "Boxdockan stående i ett rum, sedd snett framifrån så att kroppens form framträder.",
  "K": "Faktakort: boxdocka 55 × 55 cm, 178–207 cm hög. Kroppen är 46 cm bred och 90 cm hög.",
  4: "Närbild på sömmen mellan den mörkblå och den svarta klädseln.",
  5: "Närbild på den räfflade teleskopstången och skruvarna som låser höjden.",
  3: "Måttritning av boxdockan: 178–207 cm hög, kroppen 46 × 90 cm och foten 55 cm bred.",
 },
 "86f2cb63": {
  1: "Rött boxställ med en speedball högst upp, en andra boll på sidan, en röd kickdyna på stolpen och en boxstång rakt ut.",
  2: "Boxstället i ett ljust rum, sett från sidan så att bollarnas och kickdynans lägen på stolpen syns.",
  "K": "Faktakort: boxställ 107 × 36 cm, 140–205 cm högt. Kickdyna Ø15 × 53 cm, två speedballs Ø15 × 17 cm och boxstång.",
  4: "Närbild på den röd-vita speedballen och fjädern den sitter fast i.",
  5: "Närbild på kickdynans röda, kornade yta.",
  3: "Måttritning av boxstället: 140–205 cm högt, kickdynan 53 cm lång och foten 107 cm bred med stången utfälld.",
 },
 "57986794": {
  1: "Blått boxställ med en speedball högst upp, en andra boll på sidan, en blå kickdyna på stolpen och en boxstång rakt ut.",
  2: "Boxstället i ett gym, sett rakt framifrån med båda bollarna och kickdynan på stolpen.",
  "K": "Faktakort: boxställ 107 × 36 cm, 140–205 cm högt. Kickdyna Ø15 × 53 cm, två speedballs Ø15 × 17 cm och boxstång.",
  4: "Boxstället i ett gym, sett från sidan med bottenplattan platt mot golvet.",
  5: "Stället i ett gym med hantelställ längs väggen, sett i full höjd.",
  3: "Måttritning av boxstället: 140–205 cm högt, kickdynan 53 cm lång och foten 107 cm bred med stången utfälld.",
 },
 "438295ae": {
  1: "Svart boxställ med en speedball högst upp, en andra boll på sidan, en svart kickdyna på stolpen och en boxstång rakt ut.",
  2: "Boxstället i ett ljust rum, sett snett framifrån med båda bollarna ovanför kickdynan.",
  "K": "Faktakort: boxställ 107 × 36 cm, 140–205 cm högt. Kickdyna Ø15 × 53 cm, två speedballs Ø15 × 17 cm och boxstång.",
  4: "Närbild på den övre speedballen och boxstången där de sitter fast på stolpen.",
  5: "Närbild snett underifrån på bottenplattan och fjädrarna som bär stolpen.",
  # ☠️ Ritningen säger 45 cm om boxstången där sidans text säger 50 — talet är
  #    därför inte publicerbart och står inte i alt-texten heller.
  3: "Måttritning av boxstället: 140–205 cm högt, kickdynan 53 cm lång och foten 107 × 34 cm.",
 },
 "87ec8a16": {
  1: "Boxställ med en röd-vit speedball högst upp, en röd reflexstång åt sidan och en blå slagdyna, på en rund fot.",
  2: "Boxstället i ett gym, sett från sidan med reflexstången utfälld åt sidan.",
  "K": "Faktakort: boxställ 80,5 × 48 cm, 163–205 cm högt. Reflexstång Ø6 × 45 cm, slagdyna Ø18 × 7 cm och speedball Ø15 × 17 cm.",
  4: "Närbild på den blå slagdynan med sin vita måltavla.",
  3: "Måttritning av boxstället: 163–205 cm högt, reflexstången 45 cm och foten 48 cm bred.",
 },
 "b6c4c619": {
  1: "Väggfäste för boxsäck i svart stål, med väggplatta, utskjutande arm och en snedställd stödstång.",
  2: "Väggfästet monterat på en vägg med en boxsäck hängande i kroken — säcken ingår inte.",
  "K": "Faktakort: väggfäste för boxsäck 80 × 17 × 48 cm. Nio vinklar, bär en säck på 100 kg och monteras i betong, tegel eller massivt trä.",
  4: "Fästet på en vägg sett snett underifrån, så att stödstångens vinkel mot väggplattan syns.",
  5: "Väggfästet med armen riktad rakt ut från väggplattan och kroken hängande i änden.",
  3: "Måttritning av väggfästet: armen är 80 cm lång, väggplattan 48 cm hög och fästet 17 cm brett.",
 },
}
