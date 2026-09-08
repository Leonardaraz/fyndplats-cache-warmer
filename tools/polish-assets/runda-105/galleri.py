# -*- coding: utf-8 -*-
"""Runda 105 Steg 9 — galleriets ordning och alt-texter.

Ordningen är runbookens: 1 hjältebild, 2 verklighetsbild, 3 eget kort,
sist MÅTTRITNINGEN. Runda 104 lade ritningen på plats 3 på alla sju sidor
(uppgift #371); det upprepas inte här.

☠️ Fyra bilder har TYSK TEXT inbränd i pixlarna och plockas bort helt. En av
   dem bär dessutom leverantörens logotyp som banderoll — inte som märke på
   varan, alltså inte Leonards undantag från 2026-08-06.
"""
KORT = {
    "a0bb5be8": "b379ce_b06f303e34644d2eaf719c74571ccb4f~mv2.jpg",
    "4b089c02": "b379ce_43d4c0a134ba4231b945adde757cac47~mv2.jpg",
    "27aa4c23": "b379ce_ee63434b4bfa4004aaee32dcd6e87c09~mv2.jpg",
    "d4787641": "b379ce_03cd78a141f04501a6767702b5aff5c2~mv2.jpg",
    "f55d9635": "b379ce_ceb14e565c3141c0af2b7d27459b1910~mv2.jpg",
    "1f9fe2c2": "b379ce_5e0bc13faf1b4fc89c79d5b10ee41542~mv2.jpg",
    "1f6de209": "b379ce_9dbbe96ff783437a8c0f1b24ed278039~mv2.jpg",
    "609bec0f": "b379ce_3408b75698564fc393c4479a13bfb4e8~mv2.jpg",
}

# id8 -> [(media-id ELLER "KORT", alt-text)] i den ordning galleriet ska ha
GALLERI = {
 "a0bb5be8": [
  ("b379ce_22e44493019845d293ca5c81d6adfcb4~mv2.jpg",
   "Sköldpaddshus 91 cm i gråbrunt trä med vit ram, trälucka över skyddsdelen och nätlock över den öppna delen"),
  ("b379ce_2a3690b477bd4bc28388a4a35683cd22~mv2.jpg",
   "Sköldpaddshuset står på en gräsmatta vid en altan med krukväxter bakom"),
  ("KORT", "Faktakort: 0,48 m² golvyta, 28 cm fri höjd och ett valv på 21 × 20 cm mellan skyddsdel och öppen del"),
  ("b379ce_94d89214713a477abd8bd6bfc83d7704~mv2.jpg",
   "Huset på gräs mot en vit husvägg, med gröna växter och en foderskål synliga genom den genomskinliga sidan"),
  ("b379ce_3d7582757d394869ba4f2e077af820da~mv2.jpg",
   "Uppifrån med båda locken uppfällda på gräset — skyddsdelen till vänster och den öppna delen till höger, med valvet emellan"),
  ("b379ce_866fe762486f4d9593680271315de118~mv2.jpg",
   "Måttritning: 91 cm brett, 60,5 cm djupt och 32 cm högt, skyddsdel 29 cm och öppen del 57 cm, valv 21 × 20 cm"),
 ],
 "4b089c02": [
  ("b379ce_592b972856804ccf8a36755c0b26a207~mv2.jpg",
   "Sköldpaddshus 91 cm i blått trä med vit ram, trälucka över skyddsdelen och nätlock över den öppna delen"),
  ("b379ce_fe380f7e6aeb442ca8365fdc5123ff68~mv2.jpg",
   "Sköldpaddshuset på ett träbord framför ett fönster, med gröna växter inne i den öppna delen"),
  ("KORT", "Faktakort: 0,48 m² golvyta, 28 cm fri höjd och ett valv på 21 × 20 cm mellan skyddsdel och öppen del"),
  ("b379ce_8be6510c6afb48e1ad14dffdac91ef94~mv2.jpg",
   "Huset utomhus mot en mörk trästaket-vägg, med nätlocket stängt och foderskål inne i den öppna delen"),
  ("b379ce_830b51f656be4fa399280081de450d90~mv2.jpg",
   "Måttritning med båda locken uppfällda: 91 cm brett, 60,5 cm djupt och 32 cm högt, valv 21 × 20 cm"),
 ],
 "27aa4c23": [
  ("b379ce_d591542d1e2a4c5e82921cd3c420edef~mv2.jpg",
   "Sköldpaddshus 91 cm i grått trä med båda locken uppfällda — trälucka till vänster, nätlock till höger"),
  ("b379ce_3e8bfdb66dda4bf38ba7d58a30859b70~mv2.jpg",
   "Sköldpaddshuset står på ett golv vid en balkongdörr, med växter och underlag inne i den öppna delen"),
  ("KORT", "Faktakort: 0,48 m² golvyta, 28 cm fri höjd och ett valv på 21 × 20 cm mellan skyddsdel och öppen del"),
  ("b379ce_0150dbcb3d3744408ea84d2c8db60e7f~mv2.jpg",
   "Måttritning: 91 cm brett, 60,5 cm djupt och 32 cm högt"),
 ],
 "d4787641": [
  ("b379ce_5236533fd08f469bab522042d21f44cb~mv2.jpg",
   "Sköldpaddshus 91 cm i obehandlad furu med trälucka över skyddsdelen och nätlock över den öppna delen"),
  ("b379ce_566efc4aa0d34501b32d4f3735480d1b~mv2.jpg",
   "Sköldpaddshuset står på ett trägolv i ett rum med fiskbensparkett"),
  ("KORT", "Faktakort: 0,48 m² golvyta, 28 cm fri höjd och ett valv på 21 × 20 cm mellan skyddsdel och öppen del"),
  ("b379ce_3a3da1187e404cfb82dd6865de6ac1cb~mv2.jpg",
   "Närbild på valvöppningen i skiljeväggen och på nätlocket över den öppna delen"),
  ("b379ce_c27d44ac10f749ddaeddbe0877ab2dbc~mv2.jpg",
   "Huset inomhus vid ett fönster med grönt underlag och en sköldpadda i den öppna delen"),
  ("b379ce_370a2ef49cb8489685bb8506bcc4b09d~mv2.jpg",
   "Måttritning: 91 cm brett, 60,5 cm djupt och 32 cm högt, skyddsdel 29 cm"),
 ],
 "f55d9635": [
  ("b379ce_d8cad8a0d120467bbd92b4075f993743~mv2.jpg",
   "Sköldpaddshus på vita ben 104 cm med orange paneler, lamphållare i orange trä och genomskinlig front"),
  ("b379ce_fab24ddb34734b65875108188235916a~mv2.jpg",
   "Sköldpaddshuset står i ett rum med orange vägg, i bordshöjd bredvid en fåtölj"),
  ("KORT", "Faktakort: 0,46 m² golvyta, 33 cm fri höjd, utdragbar botten 100 × 53 cm och lamphållare som ingår"),
  ("b379ce_f1ce8ed1cf3d452cadd1fb726bacb4f0~mv2.jpg",
   "Huset i ett vardagsrum med bokhylla bakom, sett från sidan så benen och höjden syns"),
  ("b379ce_051252e205f74ab9bf505c8d70e01ee5~mv2.jpg",
   "Närbild genom den genomskinliga fronten på inredningen med sten, sand och växter"),
  ("b379ce_ed9b78cac95a4c9ab0415515f65c45a0~mv2.jpg",
   "Måttritning: 104 cm brett, 53 cm djupt och 82 cm högt, bo 41 cm och aktivitetsdel 59 cm"),
 ],
 "1f9fe2c2": [
  ("b379ce_f8f6aa6c9a394609927ad67d2ab5ced6~mv2.jpg",
   "Sköldpaddshus på vita ben 104 cm med grå paneler, grå lamphållare och genomskinlig front"),
  ("b379ce_620545fdb54244c0951c593f053590cb~mv2.jpg",
   "Sköldpaddshuset står i ett ljust rum framför en persienn, i bordshöjd"),
  ("KORT", "Faktakort: 0,46 m² golvyta, 33 cm fri höjd, utdragbar botten 100 × 53 cm och lamphållare som ingår"),
  ("b379ce_4b2dce66b0314099a11104e5dd4d3a2d~mv2.jpg",
   "Måttritning: 104 cm brett, 53 cm djupt och 82 cm högt, bo 41 cm och aktivitetsdel 59 cm"),
 ],
 "1f6de209": [
  ("b379ce_5e8e4166df29488f862b50f8a74b3e4d~mv2.jpg",
   "Öppet sköldpaddshus 120 cm i grått trä med vit ram, lamphållare på skiljeväggen och genomskinlig front"),
  ("b379ce_f024f6c9e8584255af23124bda5a7032~mv2.jpg",
   "Sköldpaddshuset står på en altan med krukväxter, med sten och växter i den öppna lådan"),
  ("KORT", "Faktakort: 116 × 46 cm invändigt, 0,53 m² golvyta, 31 cm höga väggar och öppen ovansida"),
  ("b379ce_770dda44f4ea496a90f5ac7268109d8f~mv2.jpg",
   "Sett uppifrån genom den öppna ovansidan: sten, sand och växter i hela lådans längd"),
  ("b379ce_b1dd36b146884c4dafe78a3f81c82511~mv2.jpg",
   "Huset på ett vitt bord i ett rum, med lampan hängande över den öppna delen"),
  ("b379ce_40b3c23ce858425aaa7ca5643d47dc82~mv2.jpg",
   "Måttritning: 120 cm brett, 50 cm djupt och 40 cm högt, invändigt 116 cm och väggar 31 cm"),
 ],
 "609bec0f": [
  ("b379ce_3fe0d4a4981844399a21ba2464a65b46~mv2.jpg",
   "Sköldpaddshus 81 cm i grått lackat trä med nätlock över löpdelen, trälock över huvuddelen och lamphållare"),
  ("b379ce_fb601734d589437bb9016a9928402d81~mv2.jpg",
   "Sköldpaddshuset står på ett bord i ett rum, med lampan över löpdelen och underlag i botten"),
  ("KORT", "Faktakort: 0,33 m² golvyta i två rum, 28 cm fri höjd och en öppning på 16 × 22,5 cm emellan"),
  ("b379ce_9ffbb520a1f149bf9bff82ad1896f53e~mv2.jpg",
   "Nätlocket uppfällt och uppställt, så hela löpdelen är öppen ovanifrån"),
  ("b379ce_6f2e64e6957d482eb261adcc125cbaec~mv2.jpg",
   "Måttritning: 81 cm brett, 48 cm djupt och 31,5 cm högt, med lamphållaren 25 × 26 cm"),
 ],
}

# ☠️ Bilder som PLOCKAS BORT — tysk text inbränd i pixlarna. Räknas och namnges
#    så borttagningen är ett beslut och inte ett tapp.
TYSK_TEXT = {
 "609bec0f": ["b379ce_ae69eadd55e9451698fa2e6d33ad15ec~mv2.jpg"],
 "1f9fe2c2": ["b379ce_934ca5e9bc5f4754ba9eabc63377b304~mv2.jpg",
              "b379ce_0e4bb31ab64c4a70a13ddcc7c9c64166~mv2.jpg"],
 "4b089c02": ["b379ce_db918a4b8f8746ddb0fe83cfa9664309~mv2.jpg"],
}
