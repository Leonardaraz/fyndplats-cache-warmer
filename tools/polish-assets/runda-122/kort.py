# -*- coding: utf-8 -*-
"""Runda 122 Steg 11 — fyra Fyndplats-kort, byggda i efterhand.

Rundan skeppade utan kort, som 121-128. Se `grindar.kortfel`, som numera fäller
en live sida utan eget kort.

⚠️ 832f9eec ÄR ETT UTKAST (`visible: false`) — den hålls tillbaka på slutsålt
   lager (uppgift #456-familjen). Kortet byggs ändå, så sidan är komplett den
   dag lagret kommer tillbaka. Media-PATCHen på ett utkast måste eka `visible`
   oförändrat; en `variantsInfo`-PATCH PUBLICERAR ett utkast, och den riktningen
   är den farliga med 2 700 opolerade tyska utkast i katalogen.

☠️ 0cbffcd9 och 740fa6d0 är FÄRGSYSKON med identiska siffror — bara ramens färg
   skiljer. Kickern måste bära den, annars blir korten identiska.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import grind as GR                                               # noqa: E402
import kortrunda as KR                                           # noqa: E402
import texter as T                                               # noqa: E402

KORT = {
    "6490e360": ("Moppvagn 73 cm", "Två hinkar och press"),
    "0cbffcd9": ("Städvagn 111 cm, grå ram", "Två hinkar, press och säck"),
    "740fa6d0": ("Städvagn 111 cm, svart ram", "Två hinkar, press och säck"),
    "832f9eec": ("Städvagn 93 cm", "Fyra hinkar och sopsäck"),
}

RADER = {
    "6490e360": ["Yttermått", "Hinkarnas mått", "Pressens mått", "Hjul", "Vikt"],
    "0cbffcd9": ["Yttermått", "Hinkarnas volym", "Backens mått",
                 "Sopsäckens mått", "Vikt"],
    "740fa6d0": ["Yttermått", "Hinkarnas volym", "Backens mått",
                 "Sopsäckens mått", "Vikt"],
    # ☠️ Ingen viktrad finns i spec-tabellen för 832f9eec — kortet får INTE
    #    låna syskonets. Säckens två mått bär femte raden i stället.
    "832f9eec": ["Yttermått", "Stora hinkar", "Små hinkar",
                 "Sopsäckens mått", "Säckens öppning"],
}

FILER = {
    "6490e360": "b379ce_806dbecaacd54dd6bbb146c3acb18a1e~mv2.jpg",
    "0cbffcd9": "b379ce_a0b497a339624cf699ec895b71793c5c~mv2.jpg",
    "740fa6d0": "b379ce_983557d3d11c4c72bfebc450fbfe8683~mv2.jpg",
    "832f9eec": "b379ce_3329d9b6b06d414abc3a23714fa2de25~mv2.jpg",
}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER, FILER,
           forbjudet=GR.FORBJUDET + GR.TONGRINDAR)
