# -*- coding: utf-8 -*-
"""Runda 63, Steg 1 — SKU:n avgörs när sluggen väljs, inte i Steg 8.

Regeln speglar lib/import/sku.ts: FP- + joinWithinLimit(dropConnectors(
stripBrandPrefix(skuSlugify(slug))), 24). Kapningen går på HEL ordgräns, så ett
tecken över gränsen tappar hela sista ordet — och två slugs som delar sina första
24 tecken på ordgräns får SAMMA SKU.
"""
import re
import sys
import unicodedata

PRODUCT_PART_MAX = 24
CONNECTORS = {"for", "med", "i", "och", "the", "with", "pa", "av"}


def sku_slugify(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def join_within(tokens, mx):
    ut = ""
    for t in tokens:
        kand = (ut + "-" + t) if ut else t
        if len(kand) > mx:
            if not ut:
                return t[:mx]
            break
        ut = kand
    return ut


def sku(slug):
    tokens = [t for t in sku_slugify(slug).split("-") if t]
    kvar = [t for t in tokens if t not in CONNECTORS] or tokens
    return "FP-" + join_within(kvar, PRODUCT_PART_MAX)


PLAN = {
    "b3672df6": "kattbadd-med-kattoron-50-cm",
    "ad90a1cc": "kattigloo-flatad-50-cm",
    "f6e3098e": "kattkorg-i-tva-plan-40-cm",
    "165471af": "kattsang-pa-ben-56-cm",
    "1ed0d9cb": "kattgrotta-upphojd-58-cm",
    "e16338a9": "kattkoja-vattenhyacint-tva-plan",
    # ☠️ Ordningen är vald FÖR SKU:n. "sittpuff-katt-…" kapar till
    # FP-sittpuff-katt — ett kategorinamn som vilken framtida kattpuff som
    # helst återskapar. Med materialet före katten ryms det som skiljer.
    "73cb432c": "sittpuff-vattenhyacint-katt-44-cm",
    "d82950a3": "fotpall-katt-sammet-60-cm",
}

if __name__ == "__main__":
    sedda = {}
    fel = []
    print("%-9s %-34s %-30s" % ("id", "slug", "SKU"))
    for k, slug in PLAN.items():
        s = sku(slug)
        print("%-9s %-34s %-30s %s" % (k, slug, s, "" if len(s) <= 40 else "☠️ ÖVER 40"))
        if s in sedda:
            fel.append("KROCK: %s och %s ger båda %s" % (sedda[s], k, s))
        sedda[s] = k
        if len(s) > 40:
            fel.append("%s: SKU:n är %d tecken (max 40)" % (k, len(s)))
    print()
    for f in fel:
        print("FEL:", f)
    print("Inga krockar i batchen." if not fel else "%d fel" % len(fel))
    raise SystemExit(1 if fel else 0)
