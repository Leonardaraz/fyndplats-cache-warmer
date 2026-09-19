"""Steg 9: bygger media.itemsInfo.items per produkt ur ORDNING + ALT.

Positionerna 1-5 slår upp i wixbilder.json (leverantörens bilder, i feed-
ordning). "K" är rundans egna kort. c3bda64a:s position 2 och 3 ersätts av de
polerade filerna — bakgrunden lagad, varan orörd.
"""
import json

import alt as A

wix = json.load(open("wixbilder.json"))
kort = json.load(open("kortfiler.json"))
pol = json.load(open("polerade-filer.json"))

# Ersättningar: (produkt, feedposition) → nytt fil-id
ERSATT = {
    ("c3bda64a", 2): pol["c3bda64a-02"],
    ("c3bda64a", 3): pol["c3bda64a-03"],
}

REV = {"441d2209": 3, "394de213": 3, "f4ed1264": 4, "3b38e191": 3,
       "51c43e67": 5, "c3bda64a": 3, "c88b5bbb": 5, "63a37524": 4}


def filid(pid, plats):
    if plats == "K":
        return kort[pid]
    if (pid, plats) in ERSATT:
        return ERSATT[(pid, plats)]
    return wix[pid][plats - 1]        # feedposition 1-5 → index 0-4


def bygg(pid):
    ut = []
    for plats in A.ORDNING[pid]:
        text = A.ALT[pid][plats]
        ut.append({"id": filid(pid, plats), "altText": text})
    return ut


def kontroll():
    """Fäller på tomma alt-texter, dubbletter i galleriet och saknat kort."""
    fel = []
    for pid in A.ORDNING:
        rader = bygg(pid)
        idn = [r["id"] for r in rader]
        if len(set(idn)) != len(idn):
            fel.append(f"{pid}: samma fil tva ganger i galleriet")
        if kort[pid] not in idn:
            fel.append(f"{pid}: kortet saknas i galleriet")
        if idn[2] != kort[pid]:
            fel.append(f"{pid}: kortet ligger inte pa plats 3")
        if idn[-1] != filid(pid, 3):
            fel.append(f"{pid}: mattritningen ligger inte sist")
        for i, r in enumerate(rader):
            if not r["altText"].strip():
                fel.append(f"{pid} bild {i + 1}: tom alt-text")
            if len(r["altText"]) > 1000:
                fel.append(f"{pid} bild {i + 1}: alt-text > 1000 tecken")
    return fel


if __name__ == "__main__":
    ut = {}
    for pid in A.ORDNING:
        rader = bygg(pid)
        ut[pid] = {"revision": str(REV[pid]), "items": rader}
        print(f"{pid}  {len(rader)} bilder  ordning {A.ORDNING[pid]}")
    fel = kontroll()
    print()
    print(f"kontroll: {len(fel)} fel")
    for f in fel:
        print("  x", f)
    if not fel:
        json.dump(ut, open("galleri.json", "w"), ensure_ascii=False, indent=1)
        print(f"galleri.json skriven - {sum(len(v['items']) for v in ut.values())} bilder totalt")
