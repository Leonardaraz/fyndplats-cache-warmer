# -*- coding: utf-8 -*-
"""Runda 125 Steg 11 — tio Fyndplats-kort, byggda i efterhand.

⚠️ TRE 69 CM-VAGNAR OCH TVÅ 82,5 CM-SKÅP delar storlek. Kickern bär därför
   lådantalet där storleken inte räcker: 35b4fba0 har fem lådor, bc698424 och
   f4fabca6 sju — och de två sista är rena färgsyskon med identiska siffror.
   Samma avvägning som runda 128:s röda och blå verktygsvagn: raderna ÄR lika,
   för varan är densamma, och det är kickern och fotot som skiljer sidorna.
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
    "6c9d7288": ("Verktygsvagn 82 cm, blå", "Tre plan och en låda"),
    "3659a7eb": ("Verktygsvagn 102 cm", "Avtagbar överkista"),
    "bdd01b5f": ("Verkstadsvagn 70–130 cm", "Två lådor och undre bricka"),
    "5745c3cb": ("Verktygslådor i tre delar", "Stapelbart set på hjul"),
    "35b4fba0": ("Verktygsvagn 69 cm, fem lådor", "Röd med nyckellås"),
    "bc698424": ("Verktygsvagn 69 cm, sju lådor", "Mattsvart med nyckellås"),
    "f4fabca6": ("Verktygsvagn 69 cm i rött", "Sju lådor och nyckellås"),
    "1b534b0e": ("Verktygsskåp 82,5 cm, blått", "Fem lådor och arbetsyta"),
    "5447468e": ("Verktygsskåp 82,5 cm, svart", "Fem lådor och arbetsyta"),
    "5910cd6f": ("Verktygsskåp 131 cm", "Tre delar och sex lådor"),
}

RADER = {
    "6c9d7288": ["Mått", "Hyllplan", "Låda", "Bärförmåga", "Vikt"],
    "3659a7eb": [("Mått totalt", "Mått"), "Överkista", "Rullskåp",
                 "Antal lådor", "Vikt"],
    "bdd01b5f": ["Mått", ("Arbetsytan utdragen", "Arbetsyta utdragen"),
                 "Antal lådor", "Bärförmåga", "Vikt"],
    "5745c3cb": [("Mått staplat", "Staplat"), "Antal delar",
                 ("Teleskophandtag", "Handtag"), "Bärförmåga", "Vikt"],
    "35b4fba0": ["Mått", "Bänkskiva", "Antal lådor", "Bärförmåga", "Vikt"],
    "bc698424": ["Mått", "Bänkskiva", "Antal lådor", "Bärförmåga", "Vikt"],
    "f4fabca6": ["Mått", "Bänkskiva", "Antal lådor", "Bärförmåga", "Vikt"],
    "1b534b0e": ["Mått", "Arbetsyta", "Antal lådor", "Bärförmåga", "Vikt"],
    "5447468e": ["Mått", "Arbetsyta", "Antal lådor", "Bärförmåga", "Vikt"],
    "5910cd6f": [("Mått staplat", "Staplat"), "Överkista", "Rullskåp",
                 "Antal lådor", "Vikt"],
}

FILER = {
    "6c9d7288": "b379ce_8fbaa663f7a44ae8b1e7f9dcd8bceec2~mv2.jpg",
    "3659a7eb": "b379ce_b99dfd7a8b0d4fdda679e4f5c2c16796~mv2.jpg",
    "bdd01b5f": "b379ce_6d33971865ea4e8895c1ffdccea2ab59~mv2.jpg",
    "5745c3cb": "b379ce_08e38dbce3d34b7ea0e8032ecfc30ab2~mv2.jpg",
    "35b4fba0": "b379ce_97ecfe53645249b48ec4b49319c22b17~mv2.jpg",
    "bc698424": "b379ce_40c52196a845431f8c629e4b8d428a85~mv2.jpg",
    "f4fabca6": "b379ce_af3be6b012ee42599ebab903b445c0a4~mv2.jpg",
    "1b534b0e": "b379ce_0455c60d75fa47e4af772400b0d806ea~mv2.jpg",
    "5447468e": "b379ce_582ca0c2f5ff4cc38354894a265dd2b5~mv2.jpg",
    "5910cd6f": "b379ce_f71879b502ed4181ae6d03222725f2ee~mv2.jpg",
}

if __name__ == "__main__":
    KR.kor(HAR, T, KORT, RADER, FILER,
           forbjudet=GR.FORBJUDET + GR.TONGRINDAR)
