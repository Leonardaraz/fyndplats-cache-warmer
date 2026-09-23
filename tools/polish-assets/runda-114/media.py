# -*- coding: utf-8 -*-
"""Runda 114 Steg 9 — medialistan per produkt, i galleriets fasta ordning.

☠️ MEDIA-ITEMETS `id` ÄR FIL-ID:T. Skicka `{id, altText}`, ALDRIG `url` — en
   wixstatic-adress i `url` får Wix att IMPORTERA OM filen till en ny kopia.
   Det var mekanismen bakom "524 lagade, 214 saknade ändå bilder" och bakom
   att halva medialagringen var kopior.

☠️ `media.main` SKICKAS INTE. Fältet är read-only i V3 och gav en extra
   omimport av just huvudbilden.

☠️ OCH SVARET PÅ PATCH:EN BÄR ALDRIG `media.itemsInfo`. Kvittot måste hämtas
   med en EGEN GET, och den GET:en måste begära `fields=MEDIA_ITEMS_INFO` —
   utan fältet svarar V3 med en TOM lista som ser ut som raderade bilder.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
import alt                                                        # noqa: E402
import bildplan                                                   # noqa: E402
import matt                                                       # noqa: E402

# Uppladdade 2026-09-09 ur grenen via raw.githubusercontent.com.
KORT = {
    "397b845e": "b379ce_701f5d5691b443068f9a94f86eebdac1~mv2.jpg",
    "412c9f43": "b379ce_4f0416c4689b4194ba91f13e02797f4e~mv2.jpg",
    "d754d015": "b379ce_1dd121fdcc374477a63c1d9fbcc6658b~mv2.jpg",
    "758f0a80": "b379ce_57ab7fa6c6774ed38b30b44fc9908745~mv2.jpg",
    "d5cc9efa": "b379ce_4df7a4913fc04a578ad99f1482d4e28a~mv2.jpg",
    "b3e3aac8": "b379ce_a8977fcce60643e79d05ab845515ffaf~mv2.jpg",
    "b815de72": "b379ce_3b747e773f8945db96e7b9bb41755ddc~mv2.jpg",
    "e6d2e70b": "b379ce_b128fa45bb1141698e512e4312d14945~mv2.jpg",
    "ef0fa603": "b379ce_95eb5deccf4946f2a9493cf9ed76b499~mv2.jpg",
}

# De två beskurna måttritningarna ERSÄTTER leverantörens original i galleriet.
BESKUREN = {
    ("412c9f43", 3): "b379ce_ab5821e4ee39477ebbba363e05fe1c4d~mv2.jpg",
    ("758f0a80", 3): "b379ce_fada49cba6ee4912a029bfa0aabba753~mv2.jpg",
}


def filid(k, pos):
    if pos is None:
        return KORT[k]
    if (k, pos) in BESKUREN:
        return BESKUREN[(k, pos)]
    return matt.BILDER[k][pos - 1]


def lista(k):
    return [{"id": filid(k, p), "altText": alt.ALT[k][p]}
            for p in bildplan.GALLERI[k]]


def kontroll():
    fel = []
    for k in matt.WIX:
        rader = lista(k)
        ider = [r["id"] for r in rader]
        if len(set(ider)) != len(ider):
            fel.append("%s: samma fil två gånger i galleriet" % k)
        if any(not r["altText"] for r in rader):
            fel.append("%s: en bild saknar alt-text" % k)
        if KORT[k] not in ider:
            fel.append("%s: vårt eget kort ligger inte i listan" % k)
        # ☠️ Den ERSATTA originalritningen får aldrig ligga kvar.
        for (kk, pos), _ in BESKUREN.items():
            if kk == k and matt.BILDER[k][pos - 1] in ider:
                fel.append("%s: den OBESKURNA ritningen ligger kvar" % k)
    # Inget kort får hamna på fel produkt.
    if len(set(KORT.values())) != len(KORT):
        fel.append("två produkter delar kortfil")
    return fel


if __name__ == "__main__":
    fel = kontroll()
    if fel:
        raise SystemExit("MEDIAPLANEN FALLER:\n  " + "\n  ".join(fel))
    print("mediaplanen: 0 fel — %d bilder över %d produkter"
          % (sum(len(lista(k)) for k in matt.WIX), len(matt.WIX)))
