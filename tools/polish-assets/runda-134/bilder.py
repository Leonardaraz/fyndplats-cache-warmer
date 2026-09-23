# -*- coding: utf-8 -*-
"""Runda 134 Steg 9 — galleriets ordning och alt-texterna.

Läst ur skarpa Wix 2026-09-12: alla sex står på revision 3, `visible:false`,
fem bilder var, och samma TYSKA alt-text på alla fem
("Kratztonne, 50 cm, 2 Höhlen, …"). Ordningen nedan är därför den råa
importens, och den är underlaget — inte en gissning.

☠️ ALT-TEXTEN PASSERAR INGEN AV STEG-GRINDARNA. `grind.py` läser `html`,
   `namn`, `titel` och `meta` ur `texter.py`; alt-texten finns inte där och
   skrivs rakt in i Wix media. Runda 106 mätte vad det kostar: sex sidor vars
   brödtext säger att hagen inte säljs som kaninbostad, grind grön på alla sex,
   och "kaniner" i fem alt-texter. `altfel()` nedan kör därför rundans EGEN
   `FORBJUDET`-lista och rundans EGEN talgrind över varje alt-text — samma
   listor, inte omskrivna varianter.

⚠️ ALT-TEXTEN BESKRIVER VARAN, INTE STAJLINGEN. Leverantörens miljöbilder är
   iscensatta, och katten i bilden är ingen produktuppgift. Varje detalj om
   varan är kvar; djuren är utelämnade.
"""
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
sys.path.insert(0, os.path.join(HAR, ".."))
import grind as GR                                               # noqa: E402
import grindar as G                                              # noqa: E402
import matt as M                                                 # noqa: E402
import texter as T                                               # noqa: E402

PRODUKTER = ["f6857ca0", "09336fdf", "d0b80807",
             "f4e6159e", "668e0e0c", "38022bcb"]

# Galleriet som det LIGGER, i ordning. Härlett ur runda 133:s bytesvep
# (`runda-133/bilder.py`), kontrollerat mot skarpa Wix samma dag.
GALLERI = {
    "f6857ca0": ["b379ce_b992bb672c724b91806a1f38784ddd5a~mv2.jpg",
                 "b379ce_33a335ac81b94d39969f6f7cb957d17e~mv2.jpg",
                 "b379ce_526d44af2f29439b9d7672bd412a7e10~mv2.jpg",
                 "b379ce_47392ba0455e4c7a810ced79e7998d44~mv2.jpg",
                 "b379ce_4ea1fc8d66344bb99613d33f4daadb12~mv2.jpg"],
    "09336fdf": ["b379ce_35fa06ac56f3414b98f11a068f84b34e~mv2.jpg",
                 "b379ce_9407848ed37d45abbc0a406e89f0e326~mv2.jpg",
                 "b379ce_673a2084207746c2aa909797c87fc350~mv2.jpg",
                 "b379ce_111687b6e9894b0588373cc0211995ba~mv2.jpg",
                 "b379ce_b4acf07ca762470a95f2c7836ef99dc8~mv2.jpg"],
    "d0b80807": ["b379ce_34c10c0c083649cfbb006bda1d8f0bc9~mv2.jpg",
                 "b379ce_40a95a61fe064f63a9a72209065547e5~mv2.jpg",
                 "b379ce_2641773d26be46b780258c96fe099951~mv2.jpg",
                 "b379ce_76bd5f35a11141b7b4d10d654e0d2605~mv2.jpg",
                 "b379ce_a96636e2db724be98ad4c935abda11a5~mv2.jpg"],
    "f4e6159e": ["b379ce_87d621653ca74be08b57b0144ae126a8~mv2.jpg",
                 "b379ce_36b52ede98c343dda50f9d8c84796bf2~mv2.jpg",
                 "b379ce_c29da4e676324993bf57d6e4c8deec08~mv2.jpg",
                 "b379ce_95dc521053cb4dbcbaa8a594f1de1250~mv2.jpg",
                 "b379ce_1206159fdb5643a4bca3e91fa00c9de9~mv2.jpg"],
    "668e0e0c": ["b379ce_b69087867edd4480b77998691f43b239~mv2.jpg",
                 "b379ce_9a41a31bfd744113a7a434df54de966d~mv2.jpg",
                 "b379ce_7a722eb0890e4278b73b2e9ec3e66236~mv2.jpg",
                 "b379ce_1e70a581f8ad45bb8c5acd14b3e8ca7f~mv2.jpg",
                 "b379ce_ff25ef2498cf4681af862318cce4b3a3~mv2.jpg"],
    "38022bcb": ["b379ce_b6d9b7bc119843f0ae2f724d3318bbc0~mv2.jpg",
                 "b379ce_898948f63092417880d2174c9e31fb4f~mv2.jpg",
                 "b379ce_286316a52ea2447497875d990a477532~mv2.jpg",
                 "b379ce_e8a99a2eb09f40188bf01fb887b2307e~mv2.jpg",
                 "b379ce_fa2029ed0f304aa08111ec86507f931b~mv2.jpg"],
}

# Bilder vars ENDA motiv är leverantörens marknadsföring — de tas bort.
# Filen blir föräldralös i Media Manager, aldrig raderad: runbokens regel
# ("Radera aldrig originalfilen") och orphan-svepets jobb.
BORT = {
    "d0b80807": [5],   # PawHut-reklam, "Ihre Welt, ihre Regeln"
    "f6857ca0": [5],   # närbild vars enda motiv är den påskruvade PawHut-plattan
}

# Måttritningar där den tyska `Produktinformation`-panelen tvättats bort
# (`tvatt.py`). Fil-id fylls i av `steg9.py` efter uppladdningen.
TVATTAD = {"668e0e0c": 3, "38022bcb": 3}

# ORDNINGEN ÄR RUNBOKENS: 1 hjälte, 2 verklighet, 3 eget kort, sist måttritning.
# Talen är POSITIONER I `GALLERI`; "kort" är rundans egna spec-kort.
ORDNING = {
    "f6857ca0": [1, 2, "kort", 4, 3],
    "09336fdf": [1, 2, "kort", 4, 5, 3],
    "d0b80807": [1, 2, "kort", 4, 3],
    "f4e6159e": [1, 2, "kort", 4, 5, 3],
    "668e0e0c": [1, 2, "kort", 4, 5, 3],
    "38022bcb": [1, 2, "kort", 4, 5, 3],
}

# ☠️ NYCKELN ÄR ORIGINALPOSITIONEN, inte den nya platsen — annars hade en
#    omflyttning tyst gett en bild grannens text.
ALT = {
 "f6857ca0": {
  1: "Kattbädd i sjögräs, 43 cm hög, med hela framsidan öppen och en gräddvit "
     "dyna i botten, vilande i en vagga av furu",
  2: "Kattbädden i sjögräs står på golvet i ett vardagsrum bredvid en vit "
     "byrå, med den öppna framsidan vänd ut i rummet",
  3: "Måttritning över kattbädden i sjögräs: 41 cm bred, 38 cm djup och 43 cm "
     "hög, med en lös dyna på 37 × 27 cm",
  4: "Närbild på vaggans furuände och skruvinfästningen, där sjögräsväven "
     "möter kattbäddens gräddvita plyschkant",
  "kort": "Faktakort: kattbädd i sjögräs, 41 × 38 × 43 cm, öppning Ø35 cm och "
          "lös dyna 37 × 27 cm",
 },
 "09336fdf": {
  1: "Klöstunna i flätad vattenhyacint, 50 cm hög, med en rund dyna på toppen "
     "och en rund håla i sidan",
  2: "Klöstunnan i vattenhyacint står på en matta framför en ljus soffa och "
     "når upp till soffans sitthöjd",
  3: "Måttritning över klöstunnan i vattenhyacint: Ø40 × 50 cm, håla på Ø18 cm "
     "och dyna på Ø38 cm som är 6 cm tjock",
  4: "Närbild på den runda dynan överst på klöstunnan, veckad in mot en samlad "
     "mitt i sammetslen polyester",
  5: "Klöstunnans topp med dynan borttagen: den glesa flätade toppskivan "
     "innanför vattenhyacintkanten, och dynan skymtar i hålan under",
  "kort": "Faktakort: klöstunna i vattenhyacint, Ø40 × 50 cm, två hålor på "
          "Ø18 cm och dyna på Ø38 cm",
 },
 "d0b80807": {
  1: "Klöstunna i sisal, 61 cm hög, med två kojor ovanför varandra och en "
     "hopplattform på stolpe vid sidan",
  2: "Klöstunnan i sisal står mot en vägg i ett vardagsrum, med den övre "
     "kojans öppning i höjd med en byrå",
  3: "Måttritning över klöstunnan i sisal: 60 × 60 × 61 cm, dörröppning "
     "17,5 × 19,5 cm och en bas på Ø59 cm",
  4: "Närbild på den övre kojans valvformade öppning, med mjuk plyschkant mot "
     "klöstunnans gråbruna sisalmantel",
  "kort": "Faktakort: klöstunna i sisal, 60 × 60 × 61 cm, två kojor och "
          "dörröppning 17,5 × 19,5 cm",
 },
 "f4e6159e": {
  1: "Klösträd i beige, 90 cm högt, med topplatå på två sisalstammar, en koja "
     "med två ingångar och en sidoplattform",
  2: "Klösträdet står i ett vardagsrumshörn bredvid en soffa, med en boll "
     "hängande i snöre framför kojan",
  3: "Måttritning över klösträdet: 55 × 39 × 90 cm, topplatå på Ø34 cm och "
     "koja på Ø33 × 22,5 cm per plan",
  4: "Klösträdet sett från sidan i ett ljust rum, där sidoplattformen sitter "
     "ett steg under topplatån",
  5: "Klösträdet vid ett fönster, med klösmattan på kojans framsida och bollen "
     "hängande från topplatån",
  "kort": "Faktakort: klösträd 90 cm, koja med två ingångar, topplatå Ø34 cm "
          "och maxlast 10 kg",
 },
 "668e0e0c": {
  1: "Klöstorn i mörkgrå plysch, 81 cm högt och fyrkantigt, med två kojor "
     "ovanför varandra och en sisalpanel längs hela sidan",
  2: "Klöstornet står mot en grön vägg bredvid en korg, med den ovala "
     "dörröppningen vänd ut i rummet",
  3: "Måttritning över klöstornet: 45 × 45 × 81 cm, dörröppningar på "
     "22 × 26 cm och 22 × 29 cm, samt ett hål på Ø17 cm i toppen",
  4: "Närbild på klöstornets ovala dörröppning, där den nedre kojans golv syns "
     "innanför den mörkgrå plyschkanten",
  5: "Närbild på klöstornets topp: det runda hålet på Ø17 cm i liggytan och "
     "sisalpanelens överkant",
  "kort": "Faktakort: fyrkantigt klöstorn 45 × 45 × 81 cm, två kojor och "
          "sisalpanel på 37 × 68,5 cm",
 },
 "38022bcb": {
  1: "Klösträd 109 cm med klöstunna i grå sisal, tre plan och tre hålor, samt "
     "en gräddvit bädd på stolpe överst",
  2: "Klösträdet står mot en grön vägg, med bädden på stolpen högre än "
     "klöstunnans topp",
  3: "Måttritning över klösträdet: 60 × 44,5 × 109 cm, klöstunna på Ø39 × "
     "80 cm, hålor på Ø16,5 cm och bädd på Ø40 cm",
  4: "Närbild på en av hålorna i klösträdets tunna, med gräddvit plyschkant "
     "mot den grå sisalytan och ett mjukt golv innanför",
  5: "Klösträdets tunna på nära håll: tre runda hålor med gräddvita "
     "plyschkanter i den grå sisalmanteln, och en sisalstam till vänster",
  "kort": "Faktakort: klösträd 109 cm, klöstunna Ø39 × 80 cm med tre hålor och "
          "bädd på Ø40 cm överst",
 },
}


def altfel():
    """Rundans EGNA grindar, körda mot alt-texterna. Se modulens huvud."""
    fel = []
    for pid in PRODUKTER:
        tillatna = M.FACIT[pid]["tal"]
        huvudord, forbjudet_ord = M.TYP[pid]
        behalls = [n for n in ORDNING[pid]]
        for nyckel in behalls:
            text = ALT[pid].get(nyckel)
            namn = "%s bild %s" % (pid, nyckel)
            if not text:
                fel.append("%s: SAKNAR alt-text" % namn)
                continue
            # ☠️ Ett item UTAN altText blir ett item utan alt-text, även om
            #    det hade en. Tomma texter får aldrig nå skrivningen.
            if len(text) < 40:
                fel.append("%s: alt-texten är %d tecken — för tunn"
                           % (namn, len(text)))
            for monster, skal in GR.FORBJUDET:
                if monster.search(text):
                    fel.append("%s: %s — %r" % (namn, skal, text[:80]))
            for h in G.homoglyfer(text):
                fel.append("%s: HOMOGLYF %r" % (namn, h))
            for m in G.ARTNR.finditer(text):
                fel.append("%s: ARTIKELNUMMER %r" % (namn, m.group(0)))
            for m in GR.TAL.finditer(text):
                v = float(m.group(1).replace(",", "."))
                if v in tillatna or v in GR.TAL_UNDANTAG:
                    continue
                fel.append("%s: OHÄRLETT TAL %s — %r" % (namn, m.group(1),
                                                         text[:80]))
            if not GR._vikt(huvudord).search(text):
                fel.append("%s: saknar huvudordet %r" % (namn, huvudord))
            if forbjudet_ord and forbjudet_ord in text.lower():
                fel.append("%s: FÖRBJUDET TYPORD %r" % (namn, forbjudet_ord))
        # ⚠️ Samma mall × N är precis det rå-importen redan gör.
        texter = [ALT[pid][n] for n in behalls]
        if len(set(texter)) != len(texter):
            fel.append("%s: två alt-texter är IDENTISKA" % pid)
    return fel


def kortalt(pid):
    return ALT[pid]["kort"]


if __name__ == "__main__":
    fel = altfel()
    print("altgrind: %d produkter, %d alt-texter, %d fel"
          % (len(PRODUKTER), sum(len(ORDNING[p]) for p in PRODUKTER), len(fel)))
    for f in fel:
        print("  ✗", f)
    raise SystemExit(1 if fel else 0)
