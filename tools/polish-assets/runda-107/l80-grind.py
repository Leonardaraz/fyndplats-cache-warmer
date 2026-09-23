# -*- coding: utf-8 -*-
"""Runda 107 Steg 2 — SJVFS 2019:15 mot rundans sju stall.

Samma grind som runda 106, med två skillnader som är MÄTTA och inte ärvda:

1. `BARA_YTTERHOJD` är TOM. Varje delyta i `matt.py` har sin fria höjd ur
   leverantörens egen H-uppgift, så ingen dom behöver bli EJ AVGÖRBAR.
2. Golvytan räknas på INNERMÅTT där leverantören ger båda — se matt.py.

Två regler som inte ska tas bort:

☠️ **Bara delytor som SJÄLVA klarar höjd OCH kortaste sida räknas.** En 26,5 cm
   hög låda under huset är inte golvyta för en degu (kräver 40 cm) hur stor den
   än är. Att summera all bottenyta och sedan jämföra med kravet är den
   uppenbara metoden och den fel — den godkänner en bur som består av två
   utrymmen där inget duger.

☠️ **Antalet djur räknas som 1 + (yta − minsta) / per-djur**, inte som
   yta / per-djur. L80 ger en minsta yta för FÖRSTA djuret och ett mindre
   tillägg för varje ytterligare. Den enkla divisionen ger för många djur.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import matt                                                    # noqa: E402

M = matt
K_YTA, K_SIDA, K_HOJD = 1, 5, 6            # index i L80_KANIN-raden
G_YTA, G_PER, G_SIDA, G_HOJD = 0, 1, 3, 4  # index i L80_GNAGARE-raden

def _kanin(rad):
    return (rad[K_YTA], rad[K_SIDA], rad[K_HOJD], rad[2])   # yta, sida, höjd, per djur

def _gnagare(namn):
    r = M.L80_GNAGARE[namn]
    return (r[G_YTA], r[G_SIDA], r[G_HOJD], r[G_PER])

DJUR = [
    ("kanin 2–3,5 kg",   _kanin(M.KANIN_NORMAL)),
    ("dvärgkanin ≤2 kg", _kanin(M.L80_KANIN[0])),
    ("marsvin",          _gnagare("Marsvin")),
    ("degu",             _gnagare("Degu")),
    ("brun råtta",       _gnagare("Brun råtta")),
    ("guldhamster",      _gnagare("Guldhamster")),
]

YTTERMARGINAL = 10.0   # cm — antagande, inte mätning; används bara om ytterhöjd


def yta(delar):
    return sum(L * B for _n, L, B, _h in delar) / 10000.0


def godkanda(delar, krav_sida_m, krav_hojd_m, ytterhojd=False):
    """Delytor som SJÄLVA klarar både höjd- och sidokravet."""
    ut, osakra = [], []
    for namn, L, B, H in delar:
        if L <= 0 or B <= 0 or H <= 0:
            continue
        if H / 100.0 < krav_hojd_m:
            continue
        if min(L, B) / 100.0 < krav_sida_m:
            continue
        if ytterhojd and H - krav_hojd_m * 100.0 < YTTERMARGINAL:
            osakra.append((namn, L, B, H)); continue
        ut.append((namn, L, B, H))
    return ut, osakra


def antal(y, minsta, per):
    """L80: första djuret kräver minsta ytan, varje ytterligare 'per'."""
    if y < minsta - 1e-9:
        return 0
    return 1 + int((y - minsta + 1e-9) / per)


def racker(delar, krav, ytterhojd=False):
    """-> (dom, godkänd yta m², antal djur, de delytor som räknades)"""
    kyta, ksida, khojd, per = krav
    ok, osakra = godkanda(delar, ksida, khojd, ytterhojd)
    y = yta(ok)
    if y >= kyta - 1e-9:
        return ("JA", y, antal(y, kyta, per), ok)
    if osakra and yta(ok + osakra) >= kyta - 1e-9:
        return ("EJ AVGÖRBAR", yta(ok + osakra), 0, ok + osakra)
    return ("NEJ", y, 0, ok)


def sjalvtest():
    """En grind som aldrig fällt något har inte bevisat att den biter."""
    fel = []
    marsvin = dict(DJUR)["marsvin"]        # 0,30 / 0,40 / 0,25
    kanin = dict(DJUR)["kanin 2–3,5 kg"]   # 0,70 / 0,60 / 0,60

    # 1. En STOR men LÅG låda duger inte — höjden fäller den.
    if racker([("låg", 200, 100, 20)], marsvin)[0] != "NEJ":
        fel.append("en 20 cm hög låda godkändes för marsvin (kräver 25)")
    # 2. En HÖG men SMAL låda duger inte — kortaste sidan fäller den.
    if racker([("smal", 300, 35, 60)], marsvin)[0] != "NEJ":
        fel.append("en 35 cm bred låda godkändes för marsvin (kräver 40)")
    # 3. Två underkända delytor summerar INTE till en godkänd.
    if racker([("a", 200, 100, 20), ("b", 200, 100, 20)], marsvin)[0] != "NEJ":
        fel.append("två för låga delytor summerades till ett ja")
    # 4. En tillräcklig delyta släpps igenom.
    if racker([("ok", 100, 50, 30)], marsvin)[0] != "JA":
        fel.append("en 0,5 m² hög nog låda fälldes för marsvin")
    # 5. Antalet: 0,30 m² = 1 marsvin, 0,45 = 2, 0,60 = 3.
    for y_cm2, vantat in ((3000, 1), (4500, 2), (6000, 3)):
        d, y, n, _ = racker([("x", y_cm2 / 50.0, 50, 30)], marsvin)
        if n != vantat:
            fel.append("0,%02d m² gav %d marsvin, väntade %d" % (y_cm2 / 100, n, vantat))
    # 6. Den enkla divisionen (yta/per) hade gett 4 på 0,60 m² — låser bort den.
    if int(0.60 / marsvin[3]) == 3:
        fel.append("självtestet kan inte skilja formlerna åt")
    # 7. Kanin: 0,70 m² räcker BARA om sidan är 60 och höjden 60.
    if racker([("bred nog", 120, 60, 60)], kanin)[0] != "JA":
        fel.append("0,72 m² med 60 cm sida och 60 cm höjd fälldes för kanin")
    if racker([("för smal", 180, 41, 60)], kanin)[0] != "NEJ":
        fel.append("41 cm kortaste sida godkändes för kanin (kräver 60)")
    # 8. Rundans egen kärnfråga: modell P:s tre boxar ger noll kaniner.
    p = matt.UTKAST["a75fcfde"][5]
    if racker(p, kanin)[0] != "NEJ":
        fel.append("modell P godkändes för kanin — sidan är 41 cm mot kravets 60")
    if racker(p, dict(DJUR)["dvärgkanin ≤2 kg"])[0] != "NEJ":
        fel.append("modell P godkändes för dvärgkanin — 41 cm mot kravets 50")
    # 9. BARA_YTTERHOJD är tom, och det ska vara ett MÄTT påstående.
    utan_hojd = [k for k, v in matt.UTKAST.items()
                 if any(h <= 0 for _n, _L, _B, h in v[5])]
    if set(utan_hojd) != matt.BARA_YTTERHOJD:
        fel.append("BARA_YTTERHOJD stämmer inte mot måtten: %s" % utan_hojd)
    return fel


if __name__ == "__main__":
    brister = sjalvtest()
    if brister:
        print("SJÄLVTESTET FALLER — grinden bevisar ingenting:")
        for b in brister:
            print("  ✗", b)
        sys.exit(2)
    print("självtest: 11 kontroller + BARA_YTTERHOJD mot måtten — gröna\n")

    print("%-9s %-16s %7s | %s" % ("id", "yttermått", "golv m²",
                                   " ".join("%-11s" % n for n, _ in DJUR)))
    for k, v in sorted(matt.UTKAST.items(), key=lambda kv: -kv[1][2]):
        delar, yh = v[5], k in matt.BARA_YTTERHOJD
        celler, golv = [], None
        for namn, krav in DJUR:
            dom, y, n, _ok = racker(delar, krav, yh)
            if namn == "marsvin":
                golv = y
            celler.append("%d st" % n if dom == "JA" else dom[:3])
        print("%-9s %-16s %7.2f | %s"
              % (k, "×".join(str(x) for x in v[4]), golv,
                 " ".join("%-11s" % c for c in celler)))
