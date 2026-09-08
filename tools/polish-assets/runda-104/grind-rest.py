# -*- coding: utf-8 -*-
"""Grind för runda 104:s tre sista sidor.

Ärver husets regler ur `tools/polish-assets/grindar.py` i stället för att
kopiera dem — det var precis den kopieringen som lät 80-teckentaket och
ISR-regeln falla bort ur rundans tidigare grind.
"""
import os
import os
import re
import sys

sys.path.insert(0, "/home/user/fyndplats-cache-warmer/tools/polish-assets")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import grindar as g                                                # noqa: E402
import texter_rest as rest                                        # noqa: E402

# ☠️ Osynliga tecken skrivs som \uXXXX, ALDRIG som literaler. En heredoc
#    normaliserade U+00A0 till ett vanligt mellanslag i runda 104, så grinden
#    fyrade på varenda sida och larmet lärde sig bort.
OSYNLIGA = {"­": "U+00AD mjukt bindestreck", "​": "U+200B",
            "﻿": "U+FEFF", " ": "U+00A0 hårt mellanslag",
            " ": "U+2028", " ": "U+202F smalt hårt mellanslag"}

# Tal som FÅR stå i texten. Allt annat tal är ett fynd som ska granskas.
TILLATNA = {
 "5e9cc2d2": {"106,5", "56", "80", "35", "14", "48", "33,5", "1", "3", "8",
              "30", "6", "12", "25", "4,5", "4", "2", "700"},
 "1e27f7e0": {"106,5", "56", "80", "35", "14", "48", "33,5", "1", "3", "8",
              "30", "6", "12", "25", "4,5", "4", "2", "700"},
 "883db249": {"100", "65", "73", "37", "17", "36", "15", "1", "3", "5", "8",
              "30", "12", "10", "45", "2", "700"},
}

# Ord som MÅSTE stå på just den sidan (färgen), och ord som inte får stå där.
FARG = {"5e9cc2d2": ("vit", {"gul", "orange"}),
        "1e27f7e0": ("svart", {"orange"}),
        "883db249": ("orange", {"vit", "gul"})}

FEL_ETIKETTER = ["artikelnummer", "modellreferens", "artikelnr", "referens:"]

STAVFEL = ["dögnsvarv", "engangsjobb", "ihopsattningen", "hard underlag",
           "reccension", "kvalite ", "orginal", "fjadring", "storbage"]


def granska(pid, s):
    fel = []
    txt = s["brod"]
    ren = g.strip_taggar(txt)
    lag = ren.lower()

    # 1. namnlängd — husets regel, inte rundans
    fel += ["NAMN: " + x for x in g.granska_namn(s["namn"])]
    if len(s["seoTitle"]) > 60:
        fel.append("seoTitle %d tecken (tak 60)" % len(s["seoTitle"]))
    if len(s["seoDesc"]) > 160:
        fel.append("seoDesc %d tecken (tak 160)" % len(s["seoDesc"]))

    # 2. osynliga tecken
    for tecken, namn in OSYNLIGA.items():
        for falt in ("namn", "seoTitle", "seoDesc", "brod", "slug", "sku"):
            if tecken in s[falt]:
                fel.append("%s i %s" % (namn, falt))

    # 3. tyska ord, husmärken, lagerland, attribution, artikelnummer
    for ord_ in g.TYSKA:
        if re.search(r"\b%s\b" % re.escape(ord_), lag):
            fel.append("tyskt ord: " + ord_)
    for ord_ in g.HUSMARKEN:
        if ord_ in lag:
            fel.append("husmärke: " + ord_)
    for ord_ in g.LANDORD + g.LAGERFRAS:
        if ord_ in lag:
            fel.append("lagerland/fraktfras: " + ord_)
    for ord_ in g.ATTRIBUTION:
        if re.search(r"\b%s\b" % re.escape(ord_), lag):
            fel.append("attribution (VI är leverantören): " + ord_)
    for m in g.ARTNR.findall(txt):
        fel.append("artikelnummer i texten: " + m)
    for e in FEL_ETIKETTER:
        if e in lag:
            fel.append("förbjuden spec-etikett: " + e)
    for sf in STAVFEL:
        if sf in lag:
            fel.append("känt stavfel: " + sf)

    # 4. pris får inte nämnas
    if re.search(r"\b\d+\s*(kr|kronor|:-)\b", lag):
        fel.append("prisuppgift i texten")

    # 5. färgen
    ska, far_ej = FARG[pid]
    if ska not in lag:
        fel.append("färgordet %r saknas" % ska)
    for f in far_ej:
        if re.search(r"\b%s\b" % f, lag):
            fel.append("främmande färgord: " + f)

    # 6. meningar utan skiljetecken — BARA brödtext.
    #    ☠️ Spec-tabellens <li><p> saknar punkt med flit. Utan den här
    #       strippningen fyrade grinden 22 gånger på korrekta rader.
    brodtext = re.sub(r"<ul>.*?</ul>", " ", txt, flags=re.S)
    # g.meningar ger (mening, mening + nästa) — den andra är till för
    # påstående/förnekande-läsningen och används inte här.
    for mening, _ in g.meningar(g.synlig_meningstext(brodtext)):
        m = mening.strip()
        if m and m[-1] not in ".!?:" and len(m) > 25:
            fel.append("mening utan skiljetecken: …" + m[-45:])

    # 7. alla tal ska vara härledda
    for tal in set(re.findall(r"\d+(?:,\d+)?", ren)):
        if tal not in TILLATNA[pid]:
            fel.append("ohärlett tal: " + tal)

    # 8. syskonlänkarnas ankartext måste stämma med målets färg
    for href, ankare in g.ANKARE.findall(txt):
        slug = href.rstrip("/").split("/")[-1]
        atext = g.strip_taggar(ankare).lower()
        farger_i_slug = [f for f in g.FARGORD if f in slug]
        if farger_i_slug and not any(f in atext for f in farger_i_slug):
            fel.append("ankartext %r stämmer inte med slug %r" % (atext, slug))
    return fel


if __name__ == "__main__":
    # självtest: grinden MÅSTE fälla en känd defekt, annars mäter den ingenting
    prov = dict(rest.SIDOR["883db249-fa84-4836-b7ff-6bba71d6b596"])
    prov["brod"] = prov["brod"] + "<p>Leverantören anger 45 minuter. Artikelnummer: 370-170V90OG</p>"
    self_fel = granska("883db249", prov)
    vantat = ["attribution", "artikelnummer i texten", "förbjuden spec-etikett"]
    if not all(any(v in f for f in self_fel) for v in vantat):
        raise SystemExit("☠️ SJÄLVTESTET FÖLL — grinden fäller inte kända fel:\n  "
                         + "\n  ".join(self_fel))
    print("✅ självtest: grinden fäller attribution, artikelnummer och fel etikett\n")

    total = 0
    for pid, s in rest.SIDOR.items():
        fel = granska(pid[:8], s)
        total += len(fel)
        print("=== %s — %s" % (pid[:8], s["namn"]))
        if fel:
            for f in fel:
                print("   ☠️", f)
        else:
            print("   ✅ inga fynd")
    print()
    raise SystemExit(1 if total else 0)
