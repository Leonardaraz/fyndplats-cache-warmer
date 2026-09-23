# -*- coding: utf-8 -*-
"""Runda 60 — räknar fram SKU:erna med SAMMA regel som lib/import/sku.ts.

☠️ Regeln kapar produktdelen vid 24 tecken på HEL ORDSGRÄNS. Två slugs som
skiljer sig först efter tecken 24 får därför IDENTISK SKU — runda 58 hittade
två redan publicerade produkter som bar samma.
"""
import re, sys, os, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from texter import P

SKU_MAX, PRODUCT_PART_MAX = 40, 24
CONNECTORS = {"for", "med", "i", "och", "the", "with", "pa", "av"}
MARKEN = {"succebuy","vevor","homcom","pawhut","outsunny","giantex","costway","tobbi",
          "aosom","zeny","happybuy","goplus","vivohome","kkmoon","yaheetech","vingli",
          "skyshalo","bentism","walnew","moukey","sportnow","vinsetto","aiyaplay",
          "zonekiz","kleankin"}

def skuslug(s):
    s = unicodedata.normalize("NFD", (s or "").lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")

def strip_brand(slug):
    d = [t for t in slug.split("-") if t]
    while len(d) > 1 and d[0] in MARKEN:
        d.pop(0)
    return d

def drop_connectors(tokens):
    kvar = [t for t in tokens if t not in CONNECTORS]
    return kvar or tokens

def join_within(tokens, maxlen):
    ut = ""
    for t in tokens:
        kand = (ut + "-" + t) if ut else t
        if len(kand) > maxlen:
            if not ut:
                return t[:maxlen]
            break
        ut = kand
    return ut

def sku_for(slug):
    return ("FP-" + join_within(drop_connectors(strip_brand(skuslug(slug))),
                                PRODUCT_PART_MAX))[:SKU_MAX].rstrip("-")

if __name__ == "__main__":
    sett, fel = {}, []
    for k, v in P.items():
        s = sku_for(v["slug"])
        print("%-10s %-46s %s" % (k, v["slug"], s))
        if len(s) > SKU_MAX:
            fel.append("%s: SKU %d tecken (max %d)" % (k, len(s), SKU_MAX))
        if s in sett:
            fel.append("%s och %s får SAMMA SKU %r" % (sett[s], k, s))
        sett[s] = k
    print()
    for f in fel:
        print("FEL:", f)
    print("SKU-grind: %d distinkta SKU:er." % len(sett) if not fel
          else "SKU-GRINDEN FÄLLER: %d fel" % len(fel))
    open("skuer.txt", "w").write("".join("%s %s\n" % (k, sku_for(v["slug"]))
                                          for k, v in P.items()))
    raise SystemExit(1 if fel else 0)
