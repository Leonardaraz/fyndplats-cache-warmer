# -*- coding: utf-8 -*-
"""Bygger runda 137:s Steg 7-payload till en FIL, som sedan grindas.

☠️ FILEN ÄR HELA POÄNGEN. En sträng som skrivs direkt i ett JSON-anrop kan
   inte läsas av en grind innan den lämnar chatten, och API-svaret ekar
   tillbaka exakt det man skrev — det ser rätt ut för att det ÄR det man
   skrev. Uppmätt 9 fel mot 0 (2026-09-04).

☠️ `visible` SKICKAS INTE. Att skriva ut `visible: false` ser ut som det
   försiktiga valet men speglas ned på VARIANTEN, och en variant med
   `visible: false` betyder att sidan saknar köpbar variant den dag den
   publiceras (uppmätt runda 120: 2 av 2 med fältet fick `false`, 6 av 6
   utan det behöll `true`).
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import grindar as G                                              # noqa: E402
import texter as T                                               # noqa: E402
import matt as M                                                 # noqa: E402
import grind as GR                                               # noqa: E402

FORBJUDNA_FALT = ("visible", "variantsInfo", "price", "priceData",
                  "costAndProfitData", "media", "options")


def _hash(t):
    """Samma formel i Python och i JS-sandboxen — det är hela poängen.
    `h = (h*31 + charCode) % 1000000007`, inget annat."""
    h = 0
    for c in t:
        h = (h * 31 + ord(c)) % 1000000007
    return h


def payload(pid):
    return {
        "id": M.WIX[pid],
        "name": T.NAMN[pid],
        "slug": T.SLUG[pid],
        "plainDescription": T.bygg(pid),
        "seoData": {
            "tags": [
                {"type": "title", "children": T.TITEL[pid],
                 "custom": False, "disabled": False},
                {"type": "meta", "children": "",
                 "custom": False, "disabled": False,
                 "props": {"name": "description", "content": T.META[pid]}},
            ],
            "settings": {
                "preventAutoRedirect": False,
                "keywords": [
                    {"term": t, "isMain": i == 0, "origin": "USER"}
                    for i, t in enumerate(T.SOKORDSLISTA[pid])
                ],
            },
        },
    }


if __name__ == "__main__":
    fel = 0
    ut = {}
    # ☠️ `sjalvtest()` returnerar (fel, antal) — tupeln krävs av `liverunda.kor`
    #    och en naken `for x in st` hade itererat över BÅDA och skrivit ut
    #    antalet som ett fel. Packa upp den.
    st, _fall = GR.sjalvtest()
    for x in st:
        print("☠️", x); fel += 1
    for pid in T.NAMN:
        p = payload(pid)
        ut[pid] = p
        # Grinda det som faktiskt SKICKAS, inte det som byggdes.
        for x in GR.granska(pid, html=p["plainDescription"]):
            print("☠️ %s: %s" % (pid, x)); fel += 1
        for f in FORBJUDNA_FALT:
            if f in p:
                print("☠️ %s: payloaden bär %r" % (pid, f)); fel += 1
        # ☠️ Titeln får ALDRIG vara identisk med namnet — då renderar butiken
        #    mallen "{name} | Fyndplats" i stället, och en titel du räknat
        #    till 52 blir 64 live utan att API-svaret avslöjar det.
        if T.TITEL[pid] == T.NAMN[pid]:
            print("☠️ %s: TITEL == NAMN" % pid); fel += 1
        if len(T.NAMN[pid]) > 80:
            print("☠️ %s: NAMN %d tecken (hård Wix-gräns 80)"
                  % (pid, len(T.NAMN[pid]))); fel += 1
        # ☠️ EXAKT ETT huvudsökord, och det ska ligga först.
        nyckel = p["seoData"]["settings"]["keywords"]
        if sum(1 for k in nyckel if k["isMain"]) != 1 or not nyckel[0]["isMain"]:
            print("☠️ %s: fel antal huvudsökord" % pid); fel += 1
        if len(set(k["term"] for k in nyckel)) != len(nyckel):
            print("☠️ %s: dubblerat sökord" % pid); fel += 1
        for k in nyckel:
            for monster, skal in GR.FORBJUDET:
                if monster.search(k["term"]):
                    print("☠️ %s: sökord %r — %s" % (pid, k["term"], skal)); fel += 1
            if G.ARTNR.search(k["term"]):
                print("☠️ %s: ARTIKELNUMMER i sökord %r" % (pid, k["term"])); fel += 1
            ratt, forbjudna = M.TYP[pid]
            for f in forbjudna:
                if GR._vikt(f).search(k["term"]):
                    print("☠️ %s: sökordet %r bär fel typord %r"
                          % (pid, k["term"], f)); fel += 1
        # ☠️ Sluggen måste stämma med den SKU facit räknar fram — annars
        #    skriver Steg 8 en SKU som inte hör ihop med adressen.
        if "FP-" + G.sku_bas(p["slug"]) != T.SKU[pid]:
            print("☠️ %s: slug och SKU har glidit isär" % pid); fel += 1

    with open(os.path.join(HAR, "steg7.json"), "w", encoding="utf-8") as f:
        json.dump(ut, f, ensure_ascii=False, indent=1)

    # ☠️ HASHARNA SKRIVS AV SAMMA KÖRNING SOM PAYLOADEN. Först låg de i ett
    #    eget skript, och när texten rättades i runda 137 uppdaterades bara
    #    `steg7.json` — klistergrindens facit blev en runda gammalt utan att
    #    något sa till. Exakt husets vanligaste bugg: två filer som beskriver
    #    samma sak och bara den ena underhålls (`SHIP_AXIS_RE`, `EU_TULL_CODES`,
    #    `mapWithConcurrency`). En grind med föråldrat facit är värre än ingen
    #    grind: den svarar med auktoritet på fel fråga.
    hashar = {}
    for pid, p in ut.items():
        kalla = p["plainDescription"]
        hashar[pid] = {
            "skickat": _hash(kalla),
            "vantat_lagrat": _hash(G.wix_normalisera(kalla)),
            "len_norm": len(G.wix_normalisera(kalla)),
        }
    with open(os.path.join(HAR, "steg7-hashar.json"), "w", encoding="utf-8") as f:
        json.dump(hashar, f, ensure_ascii=False, indent=1)
    n = sum(len(p["seoData"]["settings"]["keywords"]) for p in ut.values())
    print("steg7.json: %d produkter, %d sökord, %d fel" % (len(ut), n, fel))
    sys.exit(1 if fel else 0)
