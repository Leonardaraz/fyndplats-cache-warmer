# -*- coding: utf-8 -*-
"""Runda 63, Steg 9 — svenska alt-texter, en per bild.

Alla 39 bilder bär tysk alt-text från importen. De byts mot svenska som
beskriver vad bilden VISAR — inte en upprepning av produktnamnet.

☠️ EN bild plockas BORT i stället för att få alt-text: `e16338a9` bild 3 bär en
`Produktinformation`-ruta med tyskan "Rasse — Britisch Kurzhaar / Gewicht —
3,5 Kg" INBRÄND i pixlarna. Ingen alt-text i världen döljer text i en bild.

⚠️ Måttritningarna i övrigt bär bara siffror och behålls.
"""
import json
import re
import sys

BORT = {("e16338a9", 3)}   # (kort, position 1-indexerad)

ALT = {
 "b3672df6": [
  "Öppen kattbädd i ljus konstrotting med två flätade kattöron och vit kudde, sedd snett uppifrån",
  "Kattbädden på ett golv framför ett fönster med en katt som ligger utsträckt i den",
  "Måttritning av kattbädden: 50 cm bred, 50 cm djup, 25 cm hög och öppning 45 cm",
  "Närbild på en katt som sover hoprullad i kattbädden på en ljus rya",
  "Kattbädden placerad på en matta bredvid en fåtölj i ett vardagsrum",
 ],
 "165471af": [
  "Glesflätad rund kattsäng i beige på trebent stativ med rosa kudde",
  "Två katter som ligger tillsammans i den glesflätade kattsängen på ett vardagsrumsgolv",
  "Måttritning av kattsängen: diameter 56 cm och 35 cm hög, märkt för 5 kg",
  "Kattsängen utan kudde sedd snett uppifrån, den glesa flätningen syns genom skålen",
  "Närbild på flätningen där de tunna trådarna bildar ett oregelbundet nätmönster",
 ],
 "ad90a1cc": [
  "Kupolformad kattigloo i ljus konstrotting med stor rund ingång och grå kudde",
  "Kattigloon står på en matta i ett grönt rum med en katt som tittar ut ur ingången",
  "Måttritning av kattigloon: diameter 50 cm, höjd 31 cm och ingång 31 cm",
  "Närbild på en grå katt som ligger på kudden inne i kattigloon",
  "Kattigloon i ett rum med krukväxt och katt som vilar inne i kupolen",
 ],
 "f6e3098e": [
  "Tunnformad kattkorg i ljus konstrotting med rund ingång och en katt som ligger inne i den",
  "Kattkorgen står bredvid en vit byrå med en katt som tittar ut genom öppningen",
  "Måttritning av kattkorgen: diameter 40 cm, höjd 30 cm och kudde på 32 cm",
  "Kattkorgen sedd snett framifrån med den mjuka kudden synlig genom ingången",
 ],
 "1ed0d9cb": [
  "Klotformad kattgrotta i mörk flätning på trebent metallstativ med ljus kudde",
  "Den upphöjda kattgrottan i ett vardagsrum med en katt som ligger inne i klotet",
  "Måttritning av kattgrottan: diameter 52 cm, total höjd 58 cm, jämförd med en person",
  "Närbild på de smala metallbenen och den tjocka kudden i botten av grottan",
  "Närbild på den beigea kudden som fyller hela botten av kattgrottan",
 ],
 "e16338a9": [
  "Fyrkantig kattkoja flätad i vattenhyacint med bågformad dörr och vit kudde på taket",
  "Kattkojan står på ett golv i ett grönt rum med en katt som ligger på taket",
  None,                                  # tysk text inbränd — plockas bort
  "Närbild på en gråvit katt som ligger på den vita kudden ovanpå kattkojan",
  "Närbild på den flätade vattenhyacinten och den vita plyschkudden på ovansidan",
 ],
 "73cb432c": [
  "Rund sittpuff i flätad vattenhyacint med lock av ljust trä och kattöppning i sidan",
  "Sittpuffen står bredvid en grå soffa med en katt som ligger inne i öppningen",
  "Måttritning av sittpuffen: 44 cm bred, 43 cm djup, 42 cm hög och kudde 38 cm",
  "En person sitter på sittpuffens trälock medan en katt tittar ut genom öppningen",
  "Närbild uppifrån på det runda trälocket och den flätade vattenhyacinten under",
 ],
 "d82950a3": [
  "Grå stoppad fotpall i sammetslook med furuben och en öppning i sidan",
  "Fotpallen står vid en grå soffa med en katt som tittar ut genom sidoöppningen",
  "Måttritning av fotpallen: 60 cm bred, 45 cm djup, 44,5 cm hög, 5 cm golvavstånd",
  "Fotpallen framför en soffa med blå kudde, locket stängt och öppningen synlig",
  "Locket uppfällt så att den vadderade kattbädden inuti syns, med en katt i den",
 ],
}

MAX = 125
FRAMMANDE = re.compile(r"\b(Katzen|Kissen|Rattan\b|Hocker|Sitz|cat|bed|indoor)", re.I)
MARKEN = re.compile(r"\b(HOMCOM|Outsunny|PawHut|Aiyaplay|Vinsetto|Aosom)\b", re.I)


def grinda():
    bilder = json.load(open("bilder.json", encoding="utf-8"))
    fel, sedda = [], {}
    for kort, texter_ in ALT.items():
        if len(texter_) != len(bilder[kort]):
            fel.append("%s: %d alt-texter mot %d bilder"
                       % (kort, len(texter_), len(bilder[kort])))
        for i, t in enumerate(texter_, 1):
            if t is None:
                if (kort, i) not in BORT:
                    fel.append("%s bild %d: tom alt-text utan beslut om borttagning"
                               % (kort, i))
                continue
            if (kort, i) in BORT:
                fel.append("%s bild %d: ska plockas bort men har alt-text" % (kort, i))
            if len(t) > MAX:
                fel.append("%s bild %d: %d tecken (max %d)" % (kort, i, len(t), MAX))
            m = FRAMMANDE.search(t)
            if m:
                fel.append("%s bild %d: främmande ord %r" % (kort, i, m.group(0)))
            if MARKEN.search(t):
                fel.append("%s bild %d: husmärke" % (kort, i))
            if t in sedda:
                fel.append("%s bild %d: DELAD alt-text med %s" % (kort, i, sedda[t]))
            sedda[t] = "%s bild %d" % (kort, i)
    return fel


if __name__ == "__main__":
    f = grinda()
    for r in f:
        print("FEL", r)
    n = sum(1 for v in ALT.values() for t in v if t)
    print("%d alt-texter, %d bilder plockas bort — %s"
          % (n, len(BORT), "rena" if not f else "%d fel" % len(f)))
    sys.exit(1 if f else 0)
