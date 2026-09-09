# -*- coding: utf-8 -*-
"""Runda 113 Steg 11 — bygger media-PATCHarna ur bildplanen.

☠️ MEDIA-ITEMETS `id` ÄR FIL-ID:T. Skicka `{id, altText}`, aldrig `url` — en
   wixstatic-adress skickad som `url` får Wix att IMPORTERA OM filen till en
   ny kopia, asynkront, och produkten visar då fyra av fem bilder ett tag.

☠️ `media.main` SKICKAS INTE. Den är read-only i V3 och gav en extra omimport.

☠️ OCH PATCH-SVARET INNEHÅLLER ALDRIG `media.itemsInfo`. Läs tillbaka med ett
   EGET GET, annars kvitterar man en skrivning mot ett svar som inte kan
   innehålla beviset.
"""
import json
import bildplan
import hamta_bilder_shim as HB   # se nedan
import matt

# Fyndplats-korten, uppladdade 2026-09-09 (id ur UploadImageToWixSite-svaret).
KORT = {
    "8cfe5171": "b379ce_15127836483b406e953488322ada73ef~mv2.jpg",
    "a33ece7a": "b379ce_9e707c4a0e0048d5bded3db117412f5a~mv2.jpg",
    "9a33e15f": "b379ce_ebd0ae7842894d62bae880049d5f44ed~mv2.jpg",
    "b2c76518": "b379ce_c39e04115837423886fb9bd0680f1149~mv2.jpg",
    "47a91a17": "b379ce_8d05ef920a2f44b7b66829d78c3feefc~mv2.jpg",
    "15d30e23": "b379ce_ec1228eaa44d43a5af49430febc584a0~mv2.jpg",
    "480849a7": "b379ce_202c52d430774bfeb8a2b0f336dc6799~mv2.jpg",
    "fdbfcea0": "b379ce_e9fb7006d1204113aebc0d9634d0e38f~mv2.jpg",
}

# Beskurna måttritningar — ERSÄTTER råbilden på sin plats i galleriet.
ERSATT = {
    ("47a91a17", 3): "b379ce_4d487db0d08943a5b315805bdc3a3ac2~mv2.jpg",
    ("15d30e23", 3): "b379ce_437ecd09f4f040c0a5edea45e25afa93~mv2.jpg",
    ("fdbfcea0", 3): "b379ce_d35f05bab36d4dc0b0b1a24462449eac~mv2.jpg",
}


def filid(kort, index):
    if index == "KORT":
        return KORT[kort]
    if (kort, index) in ERSATT:
        return ERSATT[(kort, index)]
    return HB.BILDER[kort][index - 1]


def galleri(kort):
    return [filid(kort, i) for i, _ in bildplan.GALLERI[kort]]


def kontroll():
    fel = []
    for k in matt.WIX:
        g = galleri(k)
        if len(g) != len(set(g)):
            fel.append("%s: samma fil-id två gånger i galleriet" % k)
        if KORT[k] not in g:
            fel.append("%s: kortet ligger inte i galleriet" % k)
        # ☠️ Ingen BORTTAGEN råbild får smyga in via index-räkningen.
        for i in bildplan.BORTTAGNA.get(k, {}):
            if HB.BILDER[k][i - 1] in g:
                fel.append("%s: borttagen bild %d ligger kvar i galleriet" % (k, i))
        # ☠️ De två etikettbilderna med ARTIKELNUMMER får aldrig med.
        for etikett in ("b379ce_023e8f2102a74a72b68c9b1272a30eb2~mv2.jpg",
                        "b379ce_033b615b5c964793a53b81a9e784a479~mv2.jpg"):
            if etikett in g:
                fel.append("☠️ %s: ETIKETTBILDEN MED ARTIKELNUMMER ligger i galleriet" % k)
        # en ersatt ritning ska vara den BESKURNA, inte originalet
        for (kk, i), nytt in ERSATT.items():
            if kk == k and HB.BILDER[k][i - 1] in g:
                fel.append("%s: originalritningen i stället för den beskurna" % k)
    return fel


if __name__ == "__main__":
    fel = kontroll()
    for x in fel:
        print("  ✗", x)
    if fel:
        raise SystemExit(1)
    import alt
    for n, grupp in enumerate([list(matt.WIX)[:3], list(matt.WIX)[3:6], list(matt.WIX)[6:]], 1):
        rader = []
        for k in grupp:
            poster = [{"id": f, "altText": alt.ALT[k][j]}
                      for j, f in enumerate(galleri(k))]
            rader.append('  {id:"%s", rev:"%s", media:{itemsInfo:{items:%s}}}'
                         % (matt.WIX[k], "REV", json.dumps(poster, ensure_ascii=False)))
        open("js-media-%d.txt" % n, "w").write(",\n".join(rader))
    print("media: %d gallerier, 0 fel" % len(matt.WIX))
