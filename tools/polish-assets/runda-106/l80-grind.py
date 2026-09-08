# -*- coding: utf-8 -*-
"""Runda 106 Steg 2 — SJVFS 2019:15 (L80) mot varje smådjursstall.

☠️ GRINDEN RÄKNAR BARA BOTTENPLANET. Runbooken, ordagrant: "Hyllplan och
   våningar räknas INTE in i golvytan — bara bottenytan, och höjden mäts per
   delyta." Övervåningen är kaninens HYLLA (8 kap. 21 §: hylla att sitta på och
   under), inte golvyta. Det är samma regel som fällde sköldpaddshusen i
   runda 105, och den är hela skillnaden mot leverantörens marknadsföring:
   den summerar våningarna.

☠️ EN DELYTA SOM INTE KLARAR KRAVEN RÄKNAS INTE ALLS. Tre krav per delyta:
   fri höjd, kortaste sida och — därefter — summan av ytorna. En löpbox som är
   41 cm djup ger aldrig en 2–3,5 kg kanin dess 0,6 m kortaste sida, hur lång
   den än är; att lägga den till ytan hade varit att räkna en korridor som rum.

⚠️ Där leverantören bara anger YTTERhöjden (`anm` i matt.py) räknas den ändå,
   alltså till produktens FÖRDEL. Faller den på det talet faller den med
   marginal — och släpps den igenom på det talet är domen inte färdig.
"""
import sys

sys.path.insert(0, "/home/user/fyndplats-cache-warmer/tools/polish-assets/runda-106")
import matt as M                                                    # noqa: E402


def godkanda(delar, krav_sida_m, krav_hojd_m):
    """Delytor som SJÄLVA klarar både höjd- och sidokravet."""
    ut = []
    for namn, L, B, H in delar:
        if L <= 0 or B <= 0 or H <= 0:
            continue                       # okänt mått är inget bevis
        if H / 100.0 < krav_hojd_m:
            continue
        if min(L, B) / 100.0 < krav_sida_m:
            continue
        ut.append((namn, L, B, H))
    return ut


def yta(delar):
    return sum(L * B / 10000.0 for _n, L, B, _H in delar)


def racker(delar, krav):
    """krav = (minsta yta m², kortaste sida m, minsta höjd m) -> (klarar, yta, delar)"""
    kyta, ksida, khojd = krav
    ok = godkanda(delar, ksida, khojd)
    y = yta(ok)
    return (y >= kyta - 1e-9, y, ok)


# ── kraven, hämtade ur matt.py:s tabeller (aldrig omskrivna här) ────────────
_, _, _, _, _, K_SIDA, K_HOJD = M.KANIN_NORMAL          # 2–3,5 kg
KANIN = (M.KANIN_NORMAL[1], K_SIDA, K_HOJD)             # 0,7 / 0,6 / 0,6
_, _, _, _, _, D_SIDA, D_HOJD = M.L80_KANIN[0]          # ≤2 kg, dvärgkanin
DVARGKANIN = (M.L80_KANIN[0][1], D_SIDA, D_HOJD)        # 0,5 / 0,5 / 0,5
_m = M.L80_GNAGARE["Marsvin"]
MARSVIN = (_m[0], _m[3], _m[4])                         # 0,30 / 0,40 / 0,25
_d = M.L80_GNAGARE["Degu"]
DEGU = (_d[0], _d[3], _d[4])                            # 0,30 / 0,40 / 0,40

_h = M.L80_GNAGARE["Guldhamster"]
GULDHAMSTER = (_h[0], _h[3], _h[4])                     # 0,12 / 0,25 / 0,20
_r = M.L80_GNAGARE["Brun råtta"]
RATTA = (_r[0], _r[3], _r[4])                           # 0,18 / 0,30 / 0,30

DJUR = [("kanin 2–3,5 kg", KANIN), ("dvärgkanin ≤2 kg", DVARGKANIN),
        ("marsvin", MARSVIN), ("degu", DEGU),
        ("råtta", RATTA), ("guldhamster", GULDHAMSTER)]

# hur många djur i grupp ytan räcker till (per-djur-talet ur samma tabeller)
PER_DJUR = {"kanin 2–3,5 kg": M.KANIN_NORMAL[2], "dvärgkanin ≤2 kg": M.L80_KANIN[0][2],
            "marsvin": M.L80_GNAGARE["Marsvin"][1], "degu": M.L80_GNAGARE["Degu"][1],
            "råtta": M.L80_GNAGARE["Brun råtta"][1],
            "guldhamster": M.L80_GNAGARE["Guldhamster"][1]}

# ── kontrollmätning: grinden måste kunna FÄLLA och SLÄPPA IGENOM ───────────
assert racker([("x", 120, 70, 70)], KANIN)[0] is True          # 0,84 m², 70 cm djup
assert racker([("x", 120, 41, 70)], KANIN)[0] is False         # för smal
assert racker([("x", 120, 70, 45)], KANIN)[0] is False         # för låg
assert racker([("x", 100, 60, 61)], KANIN)[0] is False         # 0,60 < 0,70 m²
assert racker([("x", 120, 41, 70)], MARSVIN)[0] is True        # 0,49 m², 41 cm
assert racker([("x", 120, 39, 70)], MARSVIN)[0] is False       # 39 < 40 cm sida
assert racker([("x", 60, 40, 24)], MARSVIN)[0] is False        # 24 < 25 cm höjd
# en delyta som faller får inte bidra med sin yta:
assert abs(racker([("stor", 200, 41, 70), ("liten", 61, 61, 70)], KANIN)[1] - 0.3721) < 1e-6
# okänt mått (0) räknas aldrig som godkänt:
assert racker([("okänd", 0, 0, 0), ("x", 120, 70, 70)], KANIN)[1] == 0.84
print("självtest: 8 kontroller gröna\n")

if __name__ == "__main__":
    rader = [(k, v) for k, v in M.UTKAST.items() if v[10] == "stall"]
    rader.sort(key=lambda kv: -kv[1][2])
    print("%-9s %7s  %-24s %8s %8s | %s"
          % ("id", "pris", "yttermått", "botten", "godkänd", "lagligt för (max antal i grupp)"))
    print("-" * 122)
    slutsats = {}
    for k, v in rader:
        namn, slug, pris, lager, sku, vid, farg, ytter, delar, ovan, typ, anm = v
        klarar, godk = [], 0.0
        for etikett, krav in DJUR:
            ok, y, d = racker(delar, krav)
            if ok:
                godk = max(godk, y)
                antal = int(y / PER_DJUR[etikett] + 1e-9)
                klarar.append("%s (%d)" % (etikett, antal))
        botten = yta(delar)
        slutsats[k] = klarar
        print("%-9s %7d  %-24s %5.2f m² %5.2f m² | %s"
              % (k, pris, "%g × %g × %g" % ytter, botten, godk,
                 ", ".join(klarar) if klarar else "☠️ INGET djur i tabellerna"))
    print()
    for etikett, _krav in DJUR:
        n = sum(1 for k in slutsats if any(x.startswith(etikett) for x in slutsats[k]))
        print("  %-18s %2d av %d stall" % (etikett, n, len(rader)))
    inget = [k for k in slutsats if not slutsats[k]]
    print("\n  ☠️ %d stall klarar INGET djur i L80:s tabeller: %s"
          % (len(inget), ", ".join(sorted(inget))))
