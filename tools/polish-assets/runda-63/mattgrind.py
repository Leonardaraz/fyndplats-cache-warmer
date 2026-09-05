# -*- coding: utf-8 -*-
"""Runda 63, Steg 1 — dubblettgrinden. Mäter, dömer inte på namn.

Kör i två riktningar, som runbooken kräver:
  1. kandidat mot kandidat  → färgtvillingar i den EGNA högen
  2. kandidat mot publicerad → samma fysiska vara under ett annat namn

☠️ Grinden körs med en KÄND tvilling som kontroll (`97b5e7e9` / `b92a9b5f`:
samma namn, samma pris, samma tal). En grind som inte fäller på ett fall du vet
är sant är inte mätt, bara skriven.

⚠️ En måttmatchning är ett SÅLL, inte en dom. Vid standardmått ger ±1 cm på tre
axlar falska träffar; ritningarna avgör.

☠️ ANDEL UTAN GOLV ÄR BRUS. Första körningen dömde `6f9fee21` (två cm-tal: 30
och 36) som DUBBLETTMISSTANKE mot ett klösträd på 1 259 kr — 2/2 = 100 %. En
rottingkorg är inte ett klösträd. Med två tal räcker en slump. Grinden kräver
därför BÅDA: minst MIN_TAL tal OCH minst MIN_ANDEL av dem träffade. Samma form
som MASSFEL_ANDEL/MASSFEL_GOLV i migreringens verdikt, och av samma skäl:
andelen ensam fäller små underlag på brus.

☠️ Och den jämför bara inom SAMMA PRODUKTKLASS. En rottingkorg och ett
utomhuskatthus i trä delar gärna ett par tal utan att ha något med varandra att
göra; att låta dem mötas i grinden ger falsklarm som lär läsaren att ignorera
den. Klassen står i publicerade.json, den gissas inte.
"""
import json
import re
import sys

TOL = 1.0
MIN_TAL = 3        # färre tal än så är inget underlag
MIN_ANDEL = 0.99   # och då krävs ALLA

def cm(tal):
    """cm-talen ur fingeravtrycket, som en mängd."""
    ut = set()
    for t in tal:
        m = re.match(r"([\d,\.]+)\s*cm$", t.strip(), re.I)
        if m:
            ut.add(float(m.group(1).replace(",", ".")))
    return ut

def kg(tal):
    ut = set()
    for t in tal:
        m = re.match(r"([\d,\.]+)\s*kg$", t.strip(), re.I)
        if m:
            ut.add(float(m.group(1).replace(",", ".")))
    return ut

def traffar(a, b):
    """Hur många av a:s tal som har en granne inom TOL i b."""
    return sum(1 for x in a if any(abs(x - y) <= TOL for y in b))

kand = json.load(open("kandidater.json", encoding="utf-8"))
pub = json.load(open("publicerade.json", encoding="utf-8"))

print("=== 1. Kandidat mot kandidat — färgtvillingar i egna högen ===")
nycklar = sorted(kand)
par = []
for i, a in enumerate(nycklar):
    for b in nycklar[i + 1:]:
        ca, cb = cm(kand[a]["tal"]), cm(kand[b]["tal"])
        ka, kb = kg(kand[a]["tal"]), kg(kand[b]["tal"])
        if not ca or not cb:
            continue
        andel = traffar(ca, cb) / float(len(ca))
        if andel >= 0.99 and traffar(cb, ca) == len(cb) and ka == kb:
            par.append((a, b, sorted(ca), kand[a]["pris"], kand[b]["pris"]))
for a, b, mat, pa, pb in par:
    kontroll = "  <-- KONTROLL" if {a, b} == {"97b5e7e9", "b92a9b5f"} else ""
    print("  TVILLING  %s = %s   cm %s   %d / %d kr%s"
          % (a, b, mat, pa, pb, kontroll))
if not any({a, b} == {"97b5e7e9", "b92a9b5f"} for a, b, _, _, _ in par):
    print("  ☠️ KONTROLLEN FÄLLDE INTE — grinden är inte mätt. Avbryter.")
    sys.exit(1)
print("  ✅ Kontrollparet fälldes: grinden biter.")

print()
print("=== 2. Kandidat mot PUBLICERAD sida i SAMMA klass (inne-badd) ===")
misstankta = 0
for k in nycklar:
    ck = cm(kand[k]["tal"])
    if not ck:
        print("  %s  inga cm-tal — kan inte grindas, läs för hand" % k)
        continue
    jamforbara = [(s, v) for s, v in pub.items() if v["klass"] == "inne-badd"]
    basta = []
    for s, v in jamforbara:
        cp = set(float(x.replace(",", ".")) for x in v["tal"])
        n = traffar(ck, cp)
        basta.append((n / float(len(ck)), n, len(ck), s, v["pris"]))
    basta.sort(reverse=True)
    andel, n, tot, slug, pris = basta[0]
    if tot < MIN_TAL:
        dom = "FÖR FÅ TAL — läs för hand"
    elif andel >= MIN_ANDEL:
        dom = "DUBBLETTMISSTANKE"
    elif andel >= 0.66:
        dom = "nära"
    else:
        dom = "unik"
    if dom != "unik":
        misstankta += 1
    print("  %-9s %-44s %d/%d  %-22s %4d kr mot %4d kr"
          % (k, kand[k]["namn"][:44], n, tot, dom, kand[k]["pris"], pris))
    if dom != "unik":
        print("      närmast: %s   %s" % (slug, sorted(ck)))
print()
print("%d kandidater behöver bildkontroll mot en publicerad sida." % misstankta)
