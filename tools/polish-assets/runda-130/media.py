# -*- coding: utf-8 -*-
"""Runda 130 Steg 9 — galleriets ordning och alt-texter.

☠️ ALT-TEXTEN SKRIVS I FILEN, ALDRIG INLINE I API-ANROPET. Runda 129 grindade
   texten här och skrev sedan av den för hand i anropet: `bomlåda` i stället
   för `blomlåda` nådde ÅTTA alt-texter. PATCH-svaret ekar tillbaka precis det
   man skickade, så det ser rätt ut för att det ÄR det man skrev.

☠️ FYRA BILDER BÄR TYSK TEXT och plockas bort. Två av dem påstår dessutom
   `widersteht ALLEN Witterungseinflüssen` — motsatsen till IP44. De ersätts
   av rundans egna kort, inte av tystnad.

⚠️ MÅTTRITNINGEN LIGGER SIST på alla sex, av samma skäl som runda 104:
   den är en ritning, inte ett produktfoto, och plats 3 är en säljplats.
"""

# Rå bildlista, position 1–5 per produkt (samma ordning som `bilder.txt`).
RA = {}
_i = 0
for _rad in open(__file__.replace("media.py", "bilder.txt"), encoding="utf-8"):
    _pid, _fil = _rad.split()
    RA.setdefault(_pid, []).append(_fil)

# ☠️ BORT: tysk text inbränd i pixlarna.
BORT = {
    "65e3c24f": [4, 5],   # IP44-SCHUTZ · RUNDER STAHLSOCKEL
    "4e23a904": [4],      # QUADRATISCHER STAHLSOCKEL
    "ef0c374b": [4],      # Schutzart IP44
}

# Skrivordning. "kort" = rundans eget Fyndplats-kort.
ORDNING = {
    "65e3c24f": [1, 2, "kort", 3],
    "4e23a904": [1, 2, "kort", 5, 3],
    "66a26135": [1, 2, "kort", 4, 5, 3],
    "5ffb91a2": [1, 2, "kort", 4, 5, 3],
    "ef0c374b": [1, 2, "kort", 5, 3],
    "a8cf27cd": [1, 2, "kort", 4, 5, 3],
}

ALT = {
    "65e3c24f": {
        1: "Solcellslampa 144 cm med tre skärmar i konstrotting på svart stativ, mot vit bakgrund",
        2: "Lampan står vid en solstol på en altan i skymningen, alla tre skärmarna tända",
        3: "Måttritning: 144 cm hög, skärmarna 37 cm brett, foten 28 cm tvärs över",
        "kort": "Faktakort: tre skärmar och en rund hylla, 144 cm, 15 lumen",
    },
    "4e23a904": {
        1: "Bågformad solcellslampa 178 cm med hängande skärm i konstrotting, mot vit bakgrund",
        2: "Bågen lyser över ett dukat trädgårdsbord om kvällen",
        3: "Måttritning: 178 cm hög, bågen når 44 cm ut, foten 28 × 28 cm",
        5: "Lampan står i hörnet av en pergola med tänd slinga och loungemöbler",
        "kort": "Faktakort: en skärm hängande i en båge, 178 cm, 15 lumen",
    },
    "66a26135": {
        1: "Pelarlampa 77 cm i vriden svart flätning kring vit innerskärm, mot vit bakgrund",
        2: "Pelaren står på ett trädäck bredvid en soffa, tänd i skymningen",
        3: "Måttritning: 77 cm hög med en fot på 22 × 22 cm",
        4: "Pelaren lyser i en planteringsrabatt om kvällen",
        5: "Pelaren står på en stenlagd uteplats vid en loungegrupp",
        "kort": "Faktakort: vriden flätning kring vit skärm, 77 cm, 25 lysdioder",
    },
    "5ffb91a2": {
        1: "Solcellslampa 130 cm med skärm av stående spjälor på smalt svart stativ, mot vit bakgrund",
        2: "Lampan står tänd på en terrass bredvid en utesoffa",
        3: "Måttritning: 130 cm hög, skärmen 34 cm tvärs över, foten 28 cm",
        4: "Närbild på skärmen där ljuset silar ut mellan spjälorna",
        5: "Närbild på den runda svarta foten där stativet fästs",
        "kort": "Faktakort: skärm av stående spjälor, 130 cm, 15 lumen",
    },
    "ef0c374b": {
        1: "Två solcellslyktor i sandfärgad konstrotting med svarta lock, mot vit bakgrund",
        2: "De två lyktorna står tända på marken vid en hängande äggstol i skymningen",
        3: "Måttritning: den större lyktan 45 × 45 cm, den mindre 35 × 35 cm",
        5: "Lyktorna lyser bredvid en krukväxt en mörk kväll",
        "kort": "Faktakort: två lyktor i olika storlek, 45 och 35 cm",
    },
    "a8cf27cd": {
        1: "Avsmalnande solcellslykta 61 cm i brun lindad plastlina, mot vit bakgrund",
        2: "Lyktan lyser varmt på ett trädäck intill en trappa om kvällen",
        3: "Måttritning: 61 cm hög, 21,5 cm tvärs över vid foten och 15 cm i toppen",
        4: "Närbild ovanifrån på solcellen i lyktans topp",
        5: "Närbild på strömbrytaren märkt ON och OFF under solcellen",
        "kort": "Faktakort: avsmalnande lindad lina, 61 cm, 0,8 watt",
    },
}


def plan(pid):
    """Ger (filnamn-eller-KORT, alttext) i skrivordning för en produkt."""
    ut = []
    for p in ORDNING[pid]:
        fil = "KORT" if p == "kort" else RA[pid][p - 1]
        ut.append((fil, ALT[pid][p]))
    return ut


if __name__ == "__main__":
    import re
    import sys

    sys.path.insert(0, "..")
    import grindar as G

    fel = []
    for pid in ORDNING:
        # ☠️ En bild som ligger i BORT får aldrig smyga tillbaka i ORDNINGEN.
        for p in BORT.get(pid, []):
            if p in ORDNING[pid]:
                fel.append("%s: position %d är TYSK men ligger i ordningen" % (pid, p))
        if ORDNING[pid][0] != 1:
            fel.append("%s: plats 1 är inte studiobilden" % pid)
        if ORDNING[pid][2] != "kort":
            fel.append("%s: kortet ligger inte på plats 3" % pid)
        if ORDNING[pid][-1] != 3:
            fel.append("%s: måttritningen ligger inte sist" % pid)
        alt = [a for _, a in plan(pid)]
        if len(set(alt)) != len(alt):
            fel.append("%s: två alt-texter är lika" % pid)
        for a in alt:
            if G.homoglyfer(a):
                fel.append("%s: homoglyf i alt-text %r" % (pid, a[:40]))
            if G.ARTNR.search(a):
                fel.append("%s: ARTIKELNUMMER i alt-text" % pid)
            for ord_ in ("Rattan", "Schwarz", "Gelb", "Grau", "Schutzart", "IP44-SCH"):
                if re.search(r"\b" + ord_, a, re.I):
                    fel.append("%s: tyskt ord %r i alt-text" % (pid, ord_))
            # ☠️ DE-DIAKRITIK-GRIND. Runda 129 skrev först `matt`, `hojd` och
            #    `narbild` genom ett heredoc som åt prickarna.
            for tappat in ("matt", "hojd", "narbild", "skarm", "flatning",
                           "storlek av", "gangar"):
                if re.search(r"\b" + tappat + r"\b", a.lower()):
                    fel.append("%s: SAKNAR DIAKRIT %r i %r" % (pid, tappat, a[:40]))
        if len(plan(pid)) < 4:
            fel.append("%s: bara %d bilder" % (pid, len(plan(pid))))
    for f in fel:
        print("  ☠️", f)
    print("%d produkter, %d bilder totalt, %d fel"
          % (len(ORDNING), sum(len(plan(p)) for p in ORDNING), len(fel)))
    for pid in ORDNING:
        print("%s  %s" % (pid, [f[:18] for f, _ in plan(pid)]))
    sys.exit(1 if fel else 0)
