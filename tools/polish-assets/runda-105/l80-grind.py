# -*- coding: utf-8 -*-
"""Steg 2 — L80-grind för sköldpaddshusen.

Regeln (SJVFS 2019:15, 10 kap. 3 § + bilaga 1:7 tabell 1): en landsköldpadda
ska ha BÅDE minsta yta OCH minsta höjd för sin skallängd. Kravet växer med
djuret, så frågan är inte "får den säljas?" utan "hur stor sköldpadda räcker
den till?".

☠️ KONSERVATIVT PÅ TRE PUNKTER:
 1. INNERMÅTT, inte yttermått. Träets tjocklek är ingen golvyta.
 2. Leverantörens egna m²-tal används ALDRIG när de motsäger leverantörens
    egna cm-mått — då gäller produkten av cm-måtten (se avvikelser nedan).
 3. Höjden mäts PER DELYTA. En delyta räknas bara in om den själv når
    höjdkravet — annars kan ett lågt bottenplan bära ett krav det inte klarar.
"""
import matt as data

def bracket(langd):
    for maxl, yta, grupp, hojd in data.L80:
        if langd <= maxl:
            return yta, grupp, hojd
    raise AssertionError

def racker_till(delar):
    """Största skallängd (cm) modellen klarar. Returnerar (langd, yta, hojd)."""
    basta = (0, 0.0, 0.0)
    for maxl, kravyta, _grupp, kravhojd in data.L80:
        # summera bara de delytor som SJÄLVA når höjdkravet
        yta = sum(b * d / 10000.0 for _n, b, d, h in delar if h / 100.0 >= kravhojd)
        if yta >= kravyta:
            hojd = min(h for _n, b, d, h in delar if h / 100.0 >= kravhojd)
            basta = (maxl, yta, hojd)
        else:
            break
    return basta

# --- kontrollmätning: grinden måste kunna fälla OCH släppa igenom ---
assert racker_till([("x", 100, 50, 30)])[0] == 20, "grinden släpper inte igenom ett känt godkänt fall"
assert racker_till([("x", 100, 50, 24)])[0] == 10, "grinden mäter inte höjden per delyta"
assert racker_till([("x", 20, 20, 100)])[0] == 0,  "grinden fäller inte en för liten yta"
assert racker_till([("stor", 200, 100, 15), ("liten", 40, 30, 40)])[0] == 10, \
    "en LÅG storyta får inte bära ett krav den inte klarar"

rader = []
for nyckel in sorted(data.MODELLER):
    m = data.MODELLER[nyckel]
    langd, yta, hojd = racker_till(m["delar"])
    total = sum(b * d / 10000.0 for _n, b, d, _h in m["delar"])
    rader.append((nyckel, m["ytter"], total, yta, hojd, langd, m["ids"], m["farger"]))

print(f"{'':2} {'yttermått':<20} {'inneryta':>8} {'godkänd':>8} {'höjd':>6} {'räcker t.o.m.':>14}  utkast")
for n, ytter, total, yta, hojd, langd, ids, farger in rader:
    txt = f"{langd} cm" if langd else "INGEN"
    print(f"{n:2} {ytter:<20} {total:8.2f} {yta:8.2f} {hojd:6.1f} {txt:>14}  {len(ids)} st ({farger})")

print()
print("Leverantörens egna m²-tal mot leverantörens egna cm-mått:")
for txt, angiven, b, d in [
    ("D huvuddel", 0.23, 37.5, 51), ("D soldel", 0.43, 76.5, 51),
    ("B bottenplan (påstått 0,73 m²)", 0.73, 112, 65),
    ("F spelyta", 0.35, 116, 46), ("F huvudhus", 0.16, 41.5, 41.5),
    ("G huvuddel", 0.13, 30, 44), ("G löpdel", 0.19, 44.5, 44),
    ("B huvudhus", 0.25, 65, 38), ("B solplats", 0.20, 61, 36),
]:
    rakn = b * d / 10000.0
    avvik = (angiven - rakn) / rakn * 100
    flagga = "  <-- AVVIKER" if abs(avvik) > 5 else ""
    print(f"  {txt:<34} angivet {angiven:.2f}  räknat {rakn:.3f}  {avvik:+6.1f} %{flagga}")
