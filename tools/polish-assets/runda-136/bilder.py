# -*- coding: utf-8 -*-
"""Runda 136 Steg 9 — galleriets ordning, strykningar och alt-texterna.

Läst ur skarpa Wix 2026-09-12: alla åtta har fem bilder och SAMMA tyska
alt-text på alla fem. Ordningen nedan är därför den råa importens, och den är
underlaget — inte en gissning.

☠️ ALT-TEXTEN PASSERAR INGEN AV STEG-GRINDARNA. `grind.py` läser `html`,
   `namn`, `titel` och `meta` ur `texter.py`; alt-texten finns inte där och
   skrivs rakt in i Wix media. `altfel()` kör därför rundans EGNA listor —
   samma `FORBJUDET`, samma `SVENSKAN`, samma talgrind, samma typordslista.

⚠️ ALT-TEXTEN BESKRIVER VARAN, INTE STAJLINGEN. Flera miljöbilder har en katt
   i sig, och katten är ingen produktuppgift.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
sys.path.insert(0, os.path.join(HAR, ".."))
import grind as GR                                               # noqa: E402
import grindar as G                                              # noqa: E402
import matt as M                                                 # noqa: E402
import texter as T                                               # noqa: E402

PRODUKTER = ["4a5acc7d", "860b6eb9", "05136778", "105c685a",
             "7f8e495b", "ae1c848f", "f8528666", "63a586da"]

# ☠️ GALLERIET LÄSES UR FIL, ALDRIG AVSKRIVET. `galleri.json` skrevs av
#    Steg 4:s hämtning direkt ur Wix och stämmer mot återläsningen i Steg 8.
GALLERI = json.load(open(os.path.join(HAR, "galleri.json"), encoding="utf-8"))

# ☠️ TRE PRODUKTER BÄR SAMMA LEVERANTÖRSREKLAM på källposition 9 (Wix-plats 5):
#    gult band, ordmärke, vattenstämpel, tre rader tysk slogan — och varan syns
#    inte alls i bilden. Det finns inget delfoto av varan att bygga ett svenskt
#    kort av, alltså är det runbokens "ren textinfografik → ta bort" och inte
#    dess "marknadsgrafik med användbara delfoton → klipp ut fotona".
#    Samma fynd som uppgift #428 och #282.
BORT = {"4a5acc7d": [5], "860b6eb9": [5], "05136778": [5]}

# ☠️ FYRA BILDER ERSÄTTS AV EN BESKUREN VERSION (`bildfix.py`). Tre
#    måttritningar bar en tysk textruta nedtill och ett kollage en tysk rubrik
#    upptill; bandet är kapat i det uppmätta gapet och bilden paddad tillbaka
#    till kvadrat. Nyckeln är (pid, Wix-position) och värdet filen i `fix/`.
BESKURNA = {
    ("ae1c848f", 3): "ae1c848f-3.jpg",
    ("f8528666", 3): "f8528666-3.jpg",
    ("63a586da", 3): "63a586da-3.jpg",
    ("05136778", 4): "05136778-4.jpg",
}

# Fil-id i Wix Media Manager för de beskurna bilderna, efter uppladdning ur
# grenen. Fylls när uppladdningen är kvitterad — tom tills dess.
BESKUREN_FIL = {}

# Faktakortens fil-id i Wix Media Manager, efter uppladdning ur grenen.
KORTFIL = {}

# ORDNINGEN ÄR RUNBOKENS: 1 hjälte, 2 verklighet, 3 eget kort, sist måttritning.
# Talen är POSITIONER I `GALLERI`; "kort" är rundans eget Faktakort.
ORDNING = {
    "4a5acc7d": [1, 2, "kort", 4, 3],
    "860b6eb9": [1, 2, "kort", 4, 3],
    "05136778": [1, 2, "kort", 4, 3],
    "105c685a": [1, 2, "kort", 4, 5, 3],
    "7f8e495b": [1, 2, "kort", 4, 5, 3],
    "ae1c848f": [1, 2, "kort", 4, 5, 3],
    "f8528666": [1, 2, "kort", 4, 5, 3],
    "63a586da": [1, 2, "kort", 4, 5, 3],
}

# ☠️ NYCKELN ÄR ORIGINALPOSITIONEN, inte den nya platsen — annars hade en
#    omflyttning tyst gett en bild grannens text.
ALT = {
 "4a5acc7d": {
  1: "Klöstorn 100 cm i grå mattextil, med tre hålor med vit plyschkant och "
     "en bädd med uppvikt kant överst",
  2: "Klöstornet står mot en ljus vägg, med en håla på framsidan och en på "
     "sidan, båda med en boll hängande i öppningen",
  3: "Måttritning över klöstornet: sockel 41 × 41 cm, total höjd 100 cm och "
     "hålor på 18 × 18 cm",
  4: "Närbild på bädden överst, med uppvikt kant i vit plysch mot den grå "
     "mattextilen",
  "kort": "Faktakort: klöstorn 41 × 41 × 100 cm med tre hålor på 18 × 18 cm "
          "och en bädd på toppen",
 },
 "860b6eb9": {
  1: "Klöstunna 101 cm i grått, med tre hålor med vit plyschkant, två "
     "hoppsteg på en sisalstam och en bred fot",
  2: "Klöstunnan står i ett sovrum bredvid en säng, med hoppstegen längs "
     "sidan och bädden överst",
  3: "Måttritning över klöstunnan: fot 50 × 36 cm, total höjd 101 cm, tunna "
     "Ø36 cm och hålor på 17 × 16 cm",
  4: "Närbild på bädden överst i tunnan, med vit plyschkant runt hela "
     "liggytan och en håla under",
  "kort": "Faktakort: klöstunna Ø36 cm och 101 cm hög, med tre hålor och "
          "hoppsteg längs en sisalstam",
 },
 "05136778": {
  1: "Klösträd 160 cm med två kojor på var sin höjd, en bädd överst, en "
     "hängmatta på sidan och en stege upp från sockeln",
  2: "Klösträdet står i ett vardagsrum bredvid en soffa, med den övre kojan "
     "i axelhöjd och bädden högst upp",
  3: "Måttritning över klösträdet: sockel 48 × 48 cm, total höjd 160 cm, "
     "övre koja 45 × 30 cm och nedre koja 30 × 30 cm",
  4: "Fyra närbilder på klösträdet: den övre kojans ingång, en sisalstolpe, "
     "hängmattan och bädden överst",
  "kort": "Faktakort: klösträd 48 × 48 × 160 cm med två kojor, hängmatta och "
          "bädd på toppen",
 },
 "105c685a": {
  1: "Klösträd 139 cm i grönt med bladkrona högst upp, rund klösskiva, grön "
     "koja och en stege längs framsidan",
  2: "Klösträdet står mot en grön vägg bredvid en hylla, med bladkronan "
     "ovanför kojan och klösskivan vänd ut i rummet",
  3: "Måttritning över klösträdet: sockel 48 × 44 cm, total höjd 139 cm, "
     "koja Ø30 cm och klösskiva Ø30 cm",
  4: "Närbild på den runda klösskivan i sisal, monterad lodrätt på en "
     "jutelindad stam",
  5: "Närbild på kojans gröna tak och den jutelindade stammen ovanför",
  "kort": "Faktakort: klösträd 48 × 44 × 139 cm med bladkrona, koja Ø30 cm "
          "och rund klösskiva",
 },
 "7f8e495b": {
  1: "Klösträd 79 cm med en koja av flätad vass nederst och en rund bädd i "
     "gräddvit plysch på en sisalstam ovanför",
  2: "Klösträdet står på ett trägolv mot en grön vägg, med kojans runda "
     "öppning vänd ut i rummet och en pompong hängande från bädden",
  3: "Måttritning över klösträdet: sockel 60 × 40 cm, total höjd 79 cm, koja "
     "Ø40 cm och bädd Ø34 cm",
  4: "Närbild på den övre bädden i gräddvit plysch, med uppvikt kant runt "
     "hela liggytan",
  5: "Klösträdet snett framifrån, med bädden överst och den flätade kojans "
     "öppning under",
  "kort": "Faktakort: klösträd 60 × 40 × 79 cm med koja av flätad vass Ø40 cm "
          "och bädd Ø34 cm",
 },
 "ae1c848f": {
  1: "Klösträd 79 cm med en rund koja i jute och en bred vit liggyta ovanför, "
     "buren av två jutelindade stammar",
  2: "Klösträdet står på ett trägolv mot en beige vägg, med den breda "
     "liggytan i höjd med en fönsterbräda",
  3: "Måttritning över klösträdet: sockel 70 × 49 cm, total höjd 79 cm, koja "
     "Ø36 cm och liggyta 60 × 40 cm",
  4: "Närbild på den breda liggytan i vit plysch, med uppvikt kant och kojans "
     "tak under",
  5: "Närbild på kojans välvda ingång med plyschkant, i den jutelindade "
     "runda stommen",
  "kort": "Faktakort: klösträd 70 × 49 × 79 cm med rund koja Ø36 cm och "
          "liggyta 60 × 40 cm",
 },
 "f8528666": {
  1: "Klösträd 98 cm med en flätad koja, en flätad bädd överst, en klösramp "
     "och en rund liggyta på sidan",
  2: "Klösträdet står mot en vit vägg bredvid en bänk, med rampen lutande "
     "ned mot golvet och bädden högst upp",
  3: "Måttritning över klösträdet: sockel 60 × 40 cm, total höjd 98 cm, koja "
     "46 × 33,5 cm och bädd 34 × 34 cm",
  4: "Närbild på pompongen som hänger i ett svart snöre under den flätade "
     "bädden",
  5: "Närbild på den flätade bädden överst, med mjuk insida innanför den "
     "flätade kanten",
  "kort": "Faktakort: klösträd 60 × 40 × 98 cm med flätad koja 46 × 33,5 cm "
          "och korgbädd 34 × 34 cm",
 },
 "63a586da": {
  1: "Klösträd 104 cm med en liggtunnel mellan två stammar, en topplatta med "
     "uppvikt kant och en lägre sidoplattform",
  2: "Klösträdet står mot en grå vägg under en tavla, med tunnelns öppning "
     "vänd ut i rummet",
  3: "Måttritning över klösträdet: sockel 60 × 40 cm, total höjd 104 cm, "
     "tunnel Ø32 cm och topplatta 51 × 33 cm",
  4: "Närbild in i liggtunneln, med gräddvit insida och en pompong hängande "
     "i öppningen",
  5: "Närbild på en av stammarna, klädd i grov sisal mot tunnelns grå väv",
  "kort": "Faktakort: klösträd 60 × 40 × 104 cm med liggtunnel Ø32 cm och "
          "topplatta 51 × 33 cm",
 },
}


def altfel():
    """Rundans EGNA grindar, körda mot alt-texterna. Se modulens huvud."""
    fel = []
    for pid in PRODUKTER:
        tillatna = M.FACIT[pid]["tal"]
        huvudord, forbjudna = M.TYP[pid]
        for nyckel in ORDNING[pid]:
            text = ALT[pid].get(nyckel)
            namn = "%s bild %s" % (pid, nyckel)
            if not text:
                fel.append("%s: SAKNAR alt-text" % namn)
                continue
            # ☠️ Ett item UTAN altText blir ett item utan alt-text, även om
            #    det hade en. Tunna texter får aldrig nå skrivningen.
            if len(text) < 40:
                fel.append("%s: alt-texten är %d tecken — för tunn"
                           % (namn, len(text)))
            for monster, skal in GR.FORBJUDET + GR.SVENSKAN:
                if monster.search(text):
                    fel.append("%s: %s — %r" % (namn, skal, text[:80]))
            for ord_, sammanhang in G.versalfel(text):
                fel.append("%s: VERSAL MITT I ORD %r — %r"
                           % (namn, ord_, sammanhang))
            for m in G.ARTNR.finditer(text):
                fel.append("%s: ARTIKELNUMMER %r" % (namn, m.group(0)))
            # Talgrinden: varje tal måste stå i produktens facit.
            for m in GR.TAL.finditer(text):
                v = float(m.group(1).replace(",", "."))
                if v in GR.TAL_UNDANTAG or v in tillatna or int(v) in tillatna:
                    continue
                fel.append("%s: OHÄRLETT TAL %s — %r" % (namn, m.group(1), text[:80]))
            # ☠️ Produkttypen gäller även här. En klöstunna får inte kallas
            #    klösträd i alt-texten bara för att fältet är ett annat.
            #
            # ⚠️ MEN HUVUDORDET KRÄVS BARA DÄR DET HÖR HEMMA. Ett första
            #    utkast krävde det i VARJE alt-text och fällde elva korrekta
            #    närbilder ("Närbild på bädden överst, med uppvikt kant …") —
            #    en detaljbild namnger inte hela möbeln, den namnger detaljen.
            #    Kravet ligger därför på HJÄLTEBILDEN och på KORTET, som är de
            #    två som beskriver varan som helhet. Förbudet mot fel typord
            #    gäller oförändrat i alla.
            if nyckel in (1, "kort") and not GR._vikt(huvudord).search(text):
                fel.append("%s: saknar huvudordet %r" % (namn, huvudord))
            for f in forbjudna:
                if GR._vikt(f).search(text):
                    fel.append("%s: FEL PRODUKTTYP %r — %r" % (namn, f, text[:80]))
            if nyckel == "kort" and not text.startswith("Faktakort: "):
                fel.append("%s: kortets alt-text börjar inte med 'Faktakort: '"
                           % namn)
        # ☠️ Kortet får ALDRIG ligga på plats 1 — det är hjältebildens plats,
        #    och kortet blir annars produktkortet i butiken.
        if ORDNING[pid][0] == "kort":
            fel.append("%s: Faktakortet ligger på plats 1" % pid)
        if "kort" not in ORDNING[pid]:
            fel.append("%s: inget Faktakort i galleriet" % pid)
        # ☠️ EN STRUKEN BILD FÅR INTE LIGGA KVAR I ORDNINGEN — det är hela
        #    poängen med Steg 4:s beslut.
        for p in BORT.get(pid, []):
            if p in ORDNING[pid]:
                fel.append("%s: struken bild %d ligger kvar i ordningen" % (pid, p))
        # Och varje position som INTE är struken ska vara med.
        kvar = [i for i in range(1, len(GALLERI[pid]) + 1)
                if i not in BORT.get(pid, [])]
        saknas = [i for i in kvar if i not in ORDNING[pid]]
        if saknas:
            fel.append("%s: bild %s tappad ur ordningen" % (pid, saknas))
    return fel


if __name__ == "__main__":
    f = altfel()
    for x in f:
        print("☠️", x)
    print("%d produkter, %d bilder, %d strykningar, %d beskurna, %d fel"
          % (len(PRODUKTER), sum(len(ORDNING[p]) for p in PRODUKTER),
             sum(len(v) for v in BORT.values()), len(BESKURNA), len(f)))
    sys.exit(1 if f else 0)
