# -*- coding: utf-8 -*-
"""Runda 113 — åtta faktakort (Leonards regel 2026-08-26).

☠️ SPEC-RADERNA HÄMTAS MEKANISKT UR SIDANS EGEN TEXT, aldrig omskrivna för
   hand. `kortbygge.varde` kräver att kortets etikett finns i radens egen
   etikett, så ett kort inte kan skriva "Vikt: vit".

⚠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT. Alla åtta går att SE i hjältebilden:
   nyckellåset med nyckeln i, greppkanten längs överkanten, touchpanelen i
   vinkylarnas överkant, trådhyllorna, den blå innerbelysningen.

☠️ OCH KORTET ÄR DET ENDA STÄLLE DÄR ENERGIKLASSEN SYNS UTAN ATT KUNDEN
   SCROLLAR. Det spelar roll här och inte i tidigare rundor: klassen är ett
   LAGKRAV enligt (EU) 2019/2016, och de två sidor som hade den som en riktig
   etikettbild förlorade den bilden — den bar leverantörens artikelnummer.
   Raden `Energiklass` ligger därför på alla åtta korten, inte bara på de
   sidor där den råkade få plats.
"""
import re
import sys

BAS = "/home/user/fyndplats-cache-warmer/tools/polish-assets"
sys.path.insert(0, BAS)
import kortbygge                                                   # noqa: E402
sys.path.insert(0, BAS + "/runda-113")
import texter as T                                                 # noqa: E402
import matt                                                        # noqa: E402

HAR = BAS + "/runda-113"


def specrader(nyckel):
    html = T.bygg(nyckel)["html"]
    block = re.search(r"<h2>Tekniska specifikationer</h2><ul>(.*?)</ul>",
                      html, re.S).group(1)
    return [re.sub(r"<[^>]+>", "", li) for li in re.findall(r"<li>(.*?)</li>", block, re.S)]


KICKER = {k: {"A": "Minifrys med nyckellås",
              "B": "Minifrys med vändbar dörr",
              "C": "Vinkyl med kompressor"}[matt.GRUPPER[k]] for k in matt.WIX}

RUBRIK = {
    "8cfe5171": "Nyckellås mitt på dörren",
    "a33ece7a": "Nyckellås mitt på dörren",
    "9a33e15f": "Greppkant längs hela överkanten",
    "b2c76518": "Greppkant längs hela överkanten",
    "47a91a17": "Smalt skåp, touchpanel i överkant",
    "15d30e23": "Bänkhögt skåp, flaskorna ligger på tvären",
    "480849a7": "Högt och smalt, hyllorna är trådställ",
    "fdbfcea0": "Blå innerbelysning bakom dubbelglaset",
}

# ☠️ `Dörröppning` är den rad som SKILJER grupp A från grupp B — 135° mot 180°.
#    Utan den hade de fyra frysarnas kort varit identiska så när som på färgen,
#    och kabinettet är ju detsamma. Det var precis den likheten som gjorde att
#    måttgrinden i Steg 1 gav 3/3 på fyra rader.
ETIKETTER = {
    "8cfe5171": ["Yttermått", "Volym", "Temperaturområde", "Energiklass",
                 "Dörröppning", "Färg"],
    "a33ece7a": ["Yttermått", "Volym", "Temperaturområde", "Energiklass",
                 "Dörröppning", "Färg"],
    "9a33e15f": ["Yttermått", "Volym", "Temperaturområde", "Energiklass",
                 "Dörröppning", "Färg"],
    "b2c76518": ["Yttermått", "Volym", "Temperaturområde", "Energiklass",
                 "Dörröppning", "Årsförbrukning"],
    "47a91a17": ["Yttermått", "Flaskkapacitet", "Temperaturområde", "Energiklass",
                 "Ljudnivå", "Årsförbrukning"],
    "15d30e23": ["Yttermått", "Flaskkapacitet", "Temperaturområde", "Energiklass",
                 "Ljudnivå", "Årsförbrukning"],
    "480849a7": ["Yttermått", "Flaskkapacitet", "Temperaturområde", "Energiklass",
                 "Ljudnivå", "Årsförbrukning"],
    "fdbfcea0": ["Yttermått", "Flaskkapacitet", "Temperaturområde", "Energiklass",
                 "Ljudnivå", "Årsförbrukning"],
}


def rader(nyckel):
    spec = specrader(nyckel)
    ut = []
    for e in ETIKETTER[nyckel]:
        träffar = [i for i, r in enumerate(spec) if r.split(":")[0].strip() == e]
        if len(träffar) != 1:
            raise SystemExit(f"{nyckel}: etiketten {e!r} finns {len(träffar)} gånger")
        ut.append((e, träffar[0]))
    return ut


def kontroll():
    """☠️ Två rader med samma värde läser som ett fel. Grinden, inte ögat."""
    fel = []
    for k in matt.WIX:
        spec = specrader(k)
        varden = [kortbygge.varde(spec[i], e) for e, i in rader(k)]
        if len(set(varden)) != len(varden):
            fel.append("%s: två rader bär samma värde %s" % (k, varden))
        # ☠️ LAGKRAVET ska stå på KORTET också, inte bara i brödtexten.
        if "Energiklass" not in ETIKETTER[k]:
            fel.append("%s: kortet saknar energiklassen" % k)
        # ☠️ Grupp A och B delar kabinett. Skiljer korten sig inte åt är de
        #    två kort för vad som ser ut som samma vara.
        if matt.GRUPPER[k] in "AB" and "Dörröppning" not in ETIKETTER[k]:
            fel.append("%s: frysens kort saknar raden som skiljer modellerna" % k)
    # samma rubrik får bara delas av FÄRGSYSKON, aldrig av två modeller
    for a in matt.WIX:
        for b in matt.WIX:
            if a < b and RUBRIK[a] == RUBRIK[b] and matt.GRUPPER[a] != matt.GRUPPER[b]:
                fel.append("%s och %s delar rubrik men är olika grupper" % (a, b))
    return fel


RADER = {k: rader(k) for k in matt.WIX}

if __name__ == "__main__":
    fel = kontroll()
    if fel:
        raise SystemExit("KORTGRINDEN FALLER:\n  " + "\n  ".join(fel))
    print("kortgrinden: 0 fel")
    produkter = [{"kort": k, "spec": specrader(k)} for k in matt.WIX]
    kortdata = {k: (KICKER[k], RUBRIK[k], RADER[k]) for k in matt.WIX}
    foton = {k: "%s/panelfoton/%s.jpg" % (HAR, k) for k in matt.WIX}
    print("\n=== spec-rader som kommer på korten ===")
    for p in produkter:
        k = p["kort"]
        print("  %s  %s | %s" % (k, KICKER[k], RUBRIK[k]))
        for e, i in RADER[k]:
            print("        %-18s %s" % (e + ":", kortbygge.varde(p["spec"][i], e)))
    print("\n=== bygger ===")
    namn, facit = kortbygge.bygg(HAR, produkter, kortdata, foton=foton)
    print("  %d kort byggda" % len(namn))
