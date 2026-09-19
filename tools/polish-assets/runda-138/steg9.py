# -*- coding: utf-8 -*-
"""Runda 138 Steg 9 — galleriets ordning och alt-texterna, i EN FIL som grindas.

☠️ ALT-TEXTEN PASSERAR INGEN AV RUNDANS ORDINARIE GRINDAR. `grind.granska`
   läser `texter.py`; alt-texten skrivs rakt in i Wix media och finns aldrig
   där. Varje regel grinden vaktar är alltså oskyddad i alt-texten — och det
   är det sämsta stället att ha ett hål, för alt-texten är vad Google och
   skärmläsaren läser. Runda 106 mätte upp det: sex sidor vars brödtext sa
   "säljs inte som kaninbostad", och fem av dem hade "kaniner" i en alt-text.

   Filen kör därför rundans EGEN `FORBJUDET` mot varje alt-text — samma lista,
   samma mönster, inte en omskriven variant.

☠️ BESKRIV VARAN, INTE STAJLINGEN. Leverantörens miljöbilder är iscensatta och
   katten i bilden är inte produktinformation. Ingen alt-text nedan nämner en
   katt: utelämnad är texten fortfarande sann och fullständig för sitt syfte,
   medan "en katt ligger i hängmattan" blir ett påstående om användningen.

⚠️ GALLERIETS ORDNING ÄR FAST: hjälte, verklighetsbild, VÅRT KORT, detaljer,
   och MÅTTRITNINGEN SIST. Rå-importen lägger ritningen på plats 3 — mitt i
   det kunden bläddrar först — och den ska längst bak.
"""
import json
import re
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import grindar as G                                              # noqa: E402
import grind as GR                                               # noqa: E402
import matt as M                                                 # noqa: E402
import texter as T                                               # noqa: E402

GALLERI = json.load(open(os.path.join(HAR, "galleri.json"), encoding="utf-8"))
KORT = json.load(open(os.path.join(HAR, "kort-wix.json"), encoding="utf-8"))

# Källplats i det RÅA galleriet: 1 hjälte, 2 miljö, 3 måttritning, 4–5 detalj.
# ☠️ Steg 4 fällde fyra bilder: `1366a476` 4 och 5 (tysk marknadsgrafik och
#    PawHut-reklam), `839a2ef5` 4 och `68bc6c0c` 4 (båda "WARUM SIE ES
#    BRAUCHEN?"). De står inte i någon ordning nedan och når därför aldrig Wix.
ORDNING = {
    "1366a476": [1, 2, "KORT", 3],
    "839a2ef5": [1, 2, "KORT", 5, 3],
    "68bc6c0c": [1, 2, "KORT", 5, 3],
    "e5b31270": [1, 2, "KORT", 4, 5, 3],
    "fecadb3e": [1, 2, "KORT", 4, 5, 3],
    "505a0dde": [1, 2, "KORT", 4, 5, 3],
    "7bdc47b8": [1, 2, "KORT", 4, 5, 3],
}

ALT = {
 "1366a476": {
  1: "Beige klösträd på 200 cm med två hålor ovanpå varandra, hängmatta och "
     "fyra stolpar, fotat mot vit bakgrund",
  2: "Det beiga klösträdet står fritt på golvet intill ett fönster i ett "
     "vardagsrum, med hålornas öppningar vända ut mot rummet",
  3: "Måttritning över klösträdet med bredd, djup och höjd i centimeter",
  "KORT": "Faktakort: 59 × 59 × 200 cm, två hålor på 35 × 40 × 29 och "
          "40 × 40 × 29 cm, hängmatta Ø40 cm och 20 kg bärförmåga",
 },
 "839a2ef5": {
  1: "Grönt klösträd format som en kaktus, med orange hängmatta och katthus "
     "nedtill, fotat mot vit bakgrund",
  2: "Kaktusklösträdet står uppspänt mellan golv och tak längs en grön vägg "
     "i ett vardagsrum",
  3: "Måttritning över klösträdet med längd, bredd och höjdspann i centimeter",
  5: "Närbild på det gröna katthuset och de två plattformarna ovanför, med "
     "orange bottenplatta",
  "KORT": "Faktakort: 55 × 34 × 230–275 cm, katthus 35 × 35 × 30 cm med "
          "öppning 18 × 23 cm, hängmatta Ø30 × 15 cm och 10 kg bärförmåga",
 },
 "68bc6c0c": {
  1: "Klösträd i vitt och mörkgrått med två takspända stolpar och runda plan, "
     "fotat mot vit bakgrund",
  2: "Klösträdet står uppspänt mot taket i ett vardagsrum med gröna väggar",
  3: "Måttritning över klösträdet med längd, bredd och höjdspann i centimeter",
  5: "Närbild på den runda hängmattan och plattformarna mellan den vita och "
     "den mörkgrå stolpen",
  "KORT": "Faktakort: 60 × 44 × 225–255 cm, bas 60 × 44 cm, rund hängmatta "
          "Ø30 × 8 cm, hängmatta i tyg 42 × 18 × 13 cm och 10 kg bärförmåga",
 },
 "e5b31270": {
  1: "Grått klösträd med rund bottenplatta, katthus och takspänd stolpe, "
     "fotat mot vit bakgrund",
  2: "Det grå klösträdet står uppspänt mot taket i ett vardagsrum med soffa "
     "och soffbord",
  3: "Måttritning över klösträdet med diameter och höjdspann i centimeter",
  4: "Närbild på hängmattan och katthusets öppning på den sammetsklädda "
     "stolpen",
  5: "Närbild på en plattform i sammet med en hängande leksaksboll i snöre",
  "KORT": "Faktakort: Ø60 × 225–255 cm, katthus Ø30 × 28 cm med öppning "
          "18 × 20 cm, hängmatta Ø30 × 12 cm och stammar i tre grovlekar",
 },
 "fecadb3e": {
  1: "Klösträd i träfärg och beige med katthus, stege och takspänd stolpe, "
     "fotat mot vit bakgrund",
  2: "Klösträdet står uppspänt mot taket intill ett fönster i ett ljust "
     "vardagsrum",
  3: "Måttritning över klösträdet med längd, bredd och höjdspann i centimeter",
  4: "Närbild på katthuset i träfärg med rund öppning och vit front",
  5: "Närbild underifrån på stegen och den jutelindade stammen",
  "KORT": "Faktakort: 40 × 40 × 240–260 cm, katthus 34 × 34 × 34 cm med "
          "öppning Ø20 cm, stege 39 × 18 cm och hängmatta Ø30 × 13 cm",
 },
 "505a0dde": {
  1: "Gul klöspelare med två liggytor och takspänd stam, fotad mot vit "
     "bakgrund",
  2: "Klöspelaren står uppspänd mellan golv och tak i ett vardagsrum med "
     "bänk och krukväxter",
  3: "Måttritning över klöspelaren med längd, bredd och höjdspann i centimeter",
  4: "Närbild på den sisallindade stammen och en av liggytorna",
  5: "Närbild på den ljusblå fotplattan där den sisallindade stammen är "
     "infäst",
  "KORT": "Faktakort: 47 × 34 × 220–260 cm, bas 47 × 34 cm, två liggytor på "
          "40 × 20 cm och en stam på Ø9,1 cm lindad med sisal",
 },
 "7bdc47b8": {
  1: "Ljusgrått klösträd med två sovhålor, tunnel, stegar och takspänd "
     "stolpe, fotat mot vit bakgrund",
  2: "Det ljusgrå klösträdet står uppspänt mot taket i ett vardagsrum med "
     "soffa och krukväxt",
  3: "Måttritning över klösträdet med längd, bredd och höjdspann i centimeter",
  4: "Närbild på en sisallindad stam med hängande leksaksboll ovanför en "
     "plattform",
  5: "Närbild på den övre sovhålan med runt fönster och stegen ned till "
     "nästa plan",
  "KORT": "Faktakort: 60 × 45 × 240–260 cm, katthåla 45 × 35 × 25 cm med "
          "öppning 18 × 18 cm, 10 kg bärförmåga och kattvikt upp till 5 kg",
 },
}


def bygg():
    ut = {}
    for pid, ordning in ORDNING.items():
        poster = []
        for plats in ordning:
            alt = ALT[pid][plats]
            fil = KORT[pid] if plats == "KORT" else GALLERI[pid][plats - 1]
            # ☠️ `id`, ALDRIG `url`. `url` betyder "extern adress" för V3, så en
            #    wixstatic-adress importeras om till en NY fil — det var så halva
            #    medialagringen blev kopior.
            poster.append({"id": fil, "altText": alt})
        ut[pid] = poster
    return ut


if __name__ == "__main__":
    fel = 0
    ut = bygg()
    for pid, poster in ut.items():
        for i, p in enumerate(poster):
            a = p["altText"]
            # Rundans EGNA förbjudna mönster, oförändrade.
            for monster, skal in GR.FORBJUDET:
                if monster.search(a):
                    print("☠️ %s bild %d: %s — %r" % (pid, i + 1, skal, a)); fel += 1
            for monster, skal in [(re.compile(m, __import__("re").I), m)
                                  for m in M.FORBJUDNA_PASTAENDEN.get(pid, [])]:
                if monster.search(a):
                    print("☠️ %s bild %d: FÖRBJUDET PÅSTÅENDE %s" % (pid, i + 1, skal))
                    fel += 1
            if G.ARTNR.search(a):
                print("☠️ %s bild %d: ARTIKELNUMMER i alt-texten" % (pid, i + 1)); fel += 1
            for c, n, s in G.homoglyfer(a):
                print("☠️ %s bild %d: HOMOGLYF %s (%s)" % (pid, i + 1, c, n)); fel += 1
            if G.TREKONSONANT.search(a):
                print("☠️ %s bild %d: TRE LIKA KONSONANTER — %r" % (pid, i + 1, a)); fel += 1
            # ☠️ Varje TAL i alt-texten måste finnas i mätningen, precis som i
            #    brödtexten. Alt-texten var ogrindad i runda 106.
            #
            # ☠️ ANROPAR RUNDANS EGEN `_talgrind` — SKRIVER INGEN EGEN. Första
            #    utkastet gjorde en tvilling som jämförde STRÄNGAR mot en
            #    mängd TAL (`M.TAL[pid]` är `{200, 20, 24.6, …}`, inte
            #    `{"200", …}`), och som dessutom inte kände svensk decimalkomma.
            #    Den fällde alla 77 talen i rundans korrekta alt-texter — ett
            #    falsklarm på varenda rad, alltså en grind man lär sig stänga av.
            #    Samma familj som `SHIP_AXIS_RE` och `EU_TULL_CODES`: en
            #    tvilling till en grind som redan finns.
            for x in GR._talgrind(pid, a):
                print("☠️ %s bild %d: %s" % (pid, i + 1, x)); fel += 1
        # Kortets alt-text har en egen form, och kortet får aldrig ligga först.
        kort = [i for i, p in enumerate(poster) if p["id"] == KORT[pid]]
        if kort != [2]:
            print("☠️ %s: kortet ligger på plats %s, ska ligga på 3" % (pid, kort)); fel += 1
        if not poster[2]["altText"].startswith("Faktakort: "):
            print("☠️ %s: kortets alt-text saknar `Faktakort: `" % pid); fel += 1
        # ☠️ Måttritningen SIST — rå-importen lägger den på plats 3.
        ritning = GALLERI[pid][2]
        if poster[-1]["id"] != ritning:
            print("☠️ %s: måttritningen ligger inte sist" % pid); fel += 1
        if len(set(p["id"] for p in poster)) != len(poster):
            print("☠️ %s: samma bild två gånger" % pid); fel += 1

    with open(os.path.join(HAR, "steg9-media.json"), "w", encoding="utf-8") as f:
        json.dump(ut, f, ensure_ascii=False, indent=1)
    n = sum(len(v) for v in ut.values())
    print("steg9-media.json: %d produkter, %d bilder, %d fel" % (len(ut), n, fel))
    sys.exit(1 if fel else 0)
