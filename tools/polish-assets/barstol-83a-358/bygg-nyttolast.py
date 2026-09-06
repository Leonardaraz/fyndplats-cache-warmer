#!/usr/bin/env python3
"""Bygger BÅDA nyttolasterna ur FILERNA — aldrig ur minnet.

Filen är källan. Anropet transkriberas, och det är i transkriberingen felen
uppstår (fontagen-weight, 2026-09-06). Genom att skriva ut färdig JSON här
kopieras maskingenererad text i stället för handskriven.
"""
import json, sys

ID = "557491d0-be20-4792-92f4-579570adb4ab"
BILD_ID = {
    "1": "b379ce_8c55a5241f7b4b62951c97fbc86b1576~mv2.jpg",
    "2": "b379ce_dfc28ab1491e4278893d893ed1693cbf~mv2.jpg",
    "3": "b379ce_d9e1fd0fe4154e1aab93816bff10c592~mv2.jpg",
    "4": "b379ce_adec2589227f46e4adf10dea709a9aa4~mv2.jpg",
    "5": "b379ce_128752c44ac84e8e87fa7d3772d3d805~mv2.jpg",
}

vad = sys.argv[1]
if vad == "media":
    rader = [l.rstrip("\n").split("\t") for l in open("alt.tsv", encoding="utf-8") if l.strip()]
    print(json.dumps([{"id": BILD_ID[pos], "altText": alt} for _, pos, alt in rader],
                     ensure_ascii=False, indent=1))
elif vad == "text":
    kort, fullt, pris, namn, sku = next(
        l.rstrip("\n").split("\t") for l in open("namn.tsv", encoding="utf-8") if l.strip())
    slug = next(l.split()[1] for l in open("slugs.txt") if l.strip())
    _, titel, beskr = next(
        l.rstrip("\n").split("\t") for l in open("seo.tsv", encoding="utf-8") if l.strip())
    print(json.dumps({
        "namn": namn, "slug": slug, "sku": sku,
        "titel": titel, "beskr": beskr,
        "html": open(f"{kort}.html", encoding="utf-8").read().strip(),
    }, ensure_ascii=False, indent=1))
