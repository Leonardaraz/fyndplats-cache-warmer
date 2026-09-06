# -*- coding: utf-8 -*-
"""Runda 78 — bildordning och alt-texter.

☠️ SKRIVFORMEN ÄR PLATT: `{id, altText}`. Den nästlade `{image:{id}}` är den
   form LÄSNINGEN returnerar, och en skrivning byggd ur ett läst svar väljer
   därför lätt fel gren. Uppmätt i runda 76:
   `400 "id or url must not be empty", violatedRule: REQUIRED_ONE_OF_FIELD`.

☠️ ETT PATCH-EKO UTELÄMNAR MEDIA. Svaret på skrivningen är inget kvitto —
   läs tillbaka med `?fields=MEDIA_ITEMS_INFO` i ett eget anrop.

⚠️ ORDNINGEN ÄR PER PRODUKT. Kortet ligger på position 3 (index 2), och
   måttritningen sist. `15ff0d64` har INGEN ritning kvar: dess pos 3 bar
   "Größe des Produkts" och pos 4 tyska rumsetiketter, så båda plockades
   bort. Den står därför på fyra bilder inklusive kortet.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
from texter import PRODUKTER                                          # noqa: E402

BILDER = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))
KORT_ID = json.load(open(os.path.join(HAR, "kort-ids.json"), encoding="utf-8"))

# 1-baserade källpositioner i den ordning kunden ska se dem, kortet undantaget.
# Ritningen sist; tyska bilder utelämnade.
ORDNING = {
    "5646a8ff": [1, 2, 4, 5, 3],
    "f18dfc3b": [1, 2, 4, 5, 3],
    "239e68b8": [1, 2, 4, 5, 3],
    "15ff0d64": [1, 2, 5],           # ☠️ pos 3 och 4 bär tysk text
    "d348bf64": [1, 2, 4, 3],        # produkten har bara fyra bilder
    "fa078e03": [1, 2, 4, 5, 3],
    "87de04ad": [1, 2, 4, 5, 3],
    "28532aab": [1, 2, 4, 5, 3],
}
KORT_INDEX = 2                        # position 3 för kunden

# alt-text per källposition. Ingen nämner leverantör, husmärke eller land.
ALT = {
    "5646a8ff": {
        1: "Verkstadspall med grå stoppad sits, röda verktygsfack och fyra hjul",
        2: "Verkstadspallen i ett garage med verktyg i facken",
        3: "Måttskiss: verkstadspallen är 64,5 cm lång, 33 cm bred och 35 cm hög",
        4: "Verkstadspallen bredvid ett upplyft fordon",
        5: "Verkstadspallen med däck och verkstadsinredning i bakgrunden",
    },
    "f18dfc3b": {
        1: "Pendelpall med vit pelare, rund vit fot och mörkgrå nätsits",
        2: "Pendelpallen vid ett ljust skrivbord",
        3: "Måttskiss: pendelpallen är 56,5 till 71,5 cm hög med 38,5 cm fot",
        4: "Sitsen sedd snett uppifrån med vippmekanismen synlig",
        5: "Närbild på vippleden mellan sits och pelare",
    },
    "239e68b8": {
        1: "Svart salongspall utan rygg på kromat femarmat kryss med hjul",
        2: "Salongspallen framför ett staffli i ett ljust rum",
        3: "Måttskiss: sitsen är 39 cm bred, höjden 52 till 67,5 cm",
        4: "Salongspallen i en frisörsalong under en klippning",
        5: "Salongspallen vid en sminkspegel med belysning",
    },
    "15ff0d64": {
        1: "Svart arbetspall med litet ryggstöd, fotring och fem hjul",
        2: "Arbetspallen framför ett staffli i en ateljé",
        5: "Arbetspallen i en salong där två personer arbetar",
    },
    "d348bf64": {
        1: "Svart rullpall med ryggstöd på böjd stam och femarmad fot",
        2: "Rullpallen vid en frisörstol och en verktygsvagn",
        3: "Måttskiss: total höjd 72 till 84 cm, ryggstödet 32 gånger 23 cm",
        4: "Rullpallen snett bakifrån med ryggstödets stam synlig",
    },
    "fa078e03": {
        1: "Beige rullpall med ryggstöd på böjd stam och svart femarmad fot",
        2: "Den beiga rullpallen i ett rum med gröna fåtöljer",
        3: "Måttskiss: total höjd 72 till 84 cm, foten 48 cm i diameter",
        4: "Den beiga rullpallen bredvid en behandlingsbänk",
        5: "Rullpallen använd vid ett bord av en sittande person",
    },
    "87de04ad": {
        1: "Svart rullpall med ringformat ryggstöd på kromat femarmat kryss",
        2: "Rullpallen framför en spegel i en butiksmiljö",
        3: "Måttskiss: foten är 50 gånger 54 cm, höjden 66 till 78 cm",
        4: "Närbild på ringryggens söm i svart konstläder",
        5: "Närbild på gaslyftens spak under sitsen",
    },
    "28532aab": {
        1: "Två svarta rullpallar med rutstickad sits och kromat kryss",
        2: "De två rullpallarna i en frisörsalong",
        3: "Måttskiss: sitsen är 35,5 cm i diameter, höjden 48 till 63 cm",
        4: "Närbild på det kromade femarmade krysset med fem hjul",
        5: "Närbild på gaslyftens spak och pelare",
    },
}
KORT_ALT = {
    "5646a8ff": "Faktakort från Fyndplats: verkstadspall med lådor, mått och maxlast",
    "f18dfc3b": "Faktakort från Fyndplats: pendelpall med vippande sits, mått och maxlast",
    "239e68b8": "Faktakort från Fyndplats: salongspall utan rygg, mått och maxlast",
    "15ff0d64": "Faktakort från Fyndplats: arbetspall med rygg och fotring, mått och maxlast",
    "d348bf64": "Faktakort från Fyndplats: svart rullpall med rygg, mått och maxlast",
    "fa078e03": "Faktakort från Fyndplats: beige rullpall med rygg, mått och maxlast",
    "87de04ad": "Faktakort från Fyndplats: rullpall med ringrygg, mått och maxlast",
    "28532aab": "Faktakort från Fyndplats: rullpallar i 2-pack, mått och maxlast",
}


def hasha(s):
    h = 0
    for c in s:
        h = (h * 31 + ord(c)) % 1000000007
    return h


def plan():
    ut = {}
    for p in PRODUKTER:
        k = p["kort"]
        b = BILDER[k]["bild"]
        poster = []
        for pos in ORDNING[k]:
            poster.append({"id": b[pos - 1], "altText": ALT[k][pos]})
        poster.insert(KORT_INDEX, {"id": KORT_ID[k], "altText": KORT_ALT[k]})

        # ── grindar ────────────────────────────────────────────────────
        assert poster[KORT_INDEX]["id"] == KORT_ID[k], "%s: kortet inte på pos 3" % k
        assert all(x["altText"].strip() for x in poster), "%s: tom alt-text" % k
        assert len(set(x["id"] for x in poster)) == len(poster), "%s: dubblett" % k
        rit = [i for i, x in enumerate(poster) if "Måttskiss" in x["altText"]]
        if rit:
            assert rit == [len(poster) - 1], "%s: ritningen ligger inte sist" % k
        for x in poster:
            for o in ("aosom", "homcom", "vinsetto", "outsunny", "pawhut",
                      "tyskland", "leverantör"):
                assert o not in x["altText"].lower(), "%s: %r i alt-text" % (k, o)
        ut[k] = poster
    return ut


if __name__ == "__main__":
    p = plan()
    facit = {}
    for k, poster in p.items():
        alt = " | ".join(x["altText"] for x in poster)
        facit[k] = {"antal": len(poster), "altHash": hasha(alt),
                    "kortIndex": KORT_INDEX}
        print("%-9s %d bilder  kort@%d  ritning %s  H%d"
              % (k, len(poster), KORT_INDEX + 1,
                 "sist" if "Måttskiss" in poster[-1]["altText"] else "ingen",
                 hasha(alt)))
    json.dump(facit, open(os.path.join(HAR, "media-facit.json"), "w"),
              ensure_ascii=False, indent=1)
    json.dump(p, open(os.path.join(HAR, "media-plan.json"), "w"),
              ensure_ascii=False, indent=1)
