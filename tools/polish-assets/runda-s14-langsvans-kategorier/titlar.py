"""Byter titel på två befintliga sidor, så att ingen av dem konkurrerar med en
ny S14-sida om samma sökord.

    python3 titlar.py <sökväg till headless-site>

Varje byte kräver att den gamla titeln står exakt en gång i
lib/category-seo.ts. Står den inte där, eller mer än en gång, skrivs ingenting.
"""
import sys

BUTIK = sys.argv[1]
FIL = f"{BUTIK}/lib/category-seo.ts"
BYTEN = {
    # Motorcyklar för barn tar "motorcykel barn" och "elmotorcykel barn".
    "elbilar-for-barn": (
        "Elbil för barn – fyrhjuling, motorcykel, traktor",
        "Elbil för barn – fyrhjuling, traktor & gokart",
    ),
    # Odlingslådor tar "odlingslåda", "odlingslådor" och "planteringslåda".
    "vaxthus-odling": (
        "Tunnelväxthus, väggväxthus & odlingslådor",
        "Tunnelväxthus, väggväxthus & drivbänkar",
    ),
}

text = open(FIL, encoding="utf-8").read()
for slug, (gammal, ny) in BYTEN.items():
    rad = f'title: "{gammal}",'
    antal = text.count(rad)
    if antal != 1:
        sys.exit(f"{slug}: den gamla titeln står {antal} gånger, väntade 1. Ingenting skrivet.")
for slug, (gammal, ny) in BYTEN.items():
    text = text.replace(f'title: "{gammal}",', f'title: "{ny}",')
open(FIL, "w", encoding="utf-8").write(text)
print("klart:", ", ".join(BYTEN))
