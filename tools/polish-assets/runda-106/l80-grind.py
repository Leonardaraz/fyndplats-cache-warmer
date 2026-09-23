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

☠️ EN YTTERHÖJD BEVISAR INGENTING PÅ NÄRA HÅLL. Tre av rundans hagar anger
   bara husets ytterhöjd (48, 50 och 52 cm), och kaninens krav är 50. Att läsa
   "52 ≥ 50, godkänt" vore att certifiera på bottenramens och takramens
   virkestjocklek. Sådana delytor markeras `ytter=True` och grinden svarar
   **EJ AVGÖRBAR** i stället för JA när kravet ligger inom `YTTERMARGINAL`
   under yttermåttet.

⚠️ `YTTERMARGINAL = 10 cm` är en MEDVETET KONSERVATIV ANTAGANDE, inte en
   mätning — den står här som ett tal man kan ifrågasätta i stället för som en
   tyst avrundning. Praktisk följd i den här rundan: bara kaninverdikten på
   `edc81021` och `117691b5` går från JA till EJ AVGÖRBAR. Marsvinets 25 cm
   ligger långt under alla tre yttermåtten och berörs inte.
"""
import sys

sys.path.insert(0, "/home/user/fyndplats-cache-warmer/tools/polish-assets/runda-106")
import matt as M                                                    # noqa: E402


YTTERMARGINAL = 10.0   # cm — se modulens docstring; antagande, inte mätning


def godkanda(delar, krav_sida_m, krav_hojd_m, ytterhojd=False):
    """Delytor som SJÄLVA klarar både höjd- och sidokravet.

    Returnerar (godkända, osakra). `osakra` är delytor som skulle klarat kravet
    men vars enda höjdmått är produktens YTTERhöjd, med kravet närmare än
    YTTERMARGINAL. De räknas varken som godkända eller underkända.
    """
    ut, osakra = [], []
    for namn, L, B, H in delar:
        if L <= 0 or B <= 0 or H <= 0:
            continue                       # okänt mått är inget bevis
        if H / 100.0 < krav_hojd_m:
            continue
        if min(L, B) / 100.0 < krav_sida_m:
            continue
        if ytterhojd and H - krav_hojd_m * 100.0 < YTTERMARGINAL:
            osakra.append((namn, L, B, H))
            continue
        ut.append((namn, L, B, H))
    return ut, osakra


def yta(delar):
    return sum(L * B / 10000.0 for _n, L, B, _H in delar)


def racker(delar, krav, ytterhojd=False):
    """krav = (minsta yta, kortaste sida, minsta höjd) -> (dom, yta, delytor).

    dom: "JA" · "NEJ" · "EJ AVGÖRBAR" (yttermåttet ligger för nära kravet).
    """
    kyta, ksida, khojd = krav
    ok, osakra = godkanda(delar, ksida, khojd, ytterhojd)
    y = yta(ok)
    if y >= kyta - 1e-9:
        return ("JA", y, ok)
    if osakra and yta(ok + osakra) >= kyta - 1e-9:
        return ("EJ AVGÖRBAR", yta(ok + osakra), ok + osakra)
    return ("NEJ", y, ok)


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
assert racker([("x", 120, 70, 70)], KANIN)[0] == "JA"           # 0,84 m², 70 cm djup
assert racker([("x", 120, 41, 70)], KANIN)[0] == "NEJ"          # för smal
assert racker([("x", 120, 70, 45)], KANIN)[0] == "NEJ"          # för låg
assert racker([("x", 100, 60, 61)], KANIN)[0] == "NEJ"          # 0,60 < 0,70 m²
assert racker([("x", 120, 41, 70)], MARSVIN)[0] == "JA"         # 0,49 m², 41 cm
assert racker([("x", 120, 39, 70)], MARSVIN)[0] == "NEJ"        # 39 < 40 cm sida
assert racker([("x", 60, 40, 24)], MARSVIN)[0] == "NEJ"         # 24 < 25 cm höjd
# yttermåttet certifierar inte på nära håll, men diskvalificerar fortfarande:
assert racker([("x", 120, 100, 52)], DVARGKANIN, True)[0] == "EJ AVGÖRBAR"   # 52 mot krav 50
assert racker([("x", 120, 100, 52)], MARSVIN, True)[0] == "JA"               # 52 mot krav 25
assert racker([("x", 120, 100, 45)], DVARGKANIN, True)[0] == "NEJ"           # under kravet
# en delyta som faller får inte bidra med sin yta:
assert abs(racker([("stor", 200, 41, 70), ("liten", 61, 61, 70)], KANIN)[1] - 0.3721) < 1e-6
# okänt mått (0) räknas aldrig som godkänt:
assert racker([("okänd", 0, 0, 0), ("x", 120, 70, 70)], KANIN)[1] == 0.84
# ☠️ BARA_YTTERHOJD är data, inte prosa — men den ska stämma med mekaniken.
_mek = {k for k, v in M.UTKAST.items() if v[10] == "stall"
        and any(abs(h - v[7][2]) < 1e-9 for _n, _l, _b, h in v[8])}
assert _mek == M.BARA_YTTERHOJD, ("BARA_YTTERHOJD stämmer inte med måtten: "
                                  "mekaniskt %s, listat %s" % (sorted(_mek), sorted(M.BARA_YTTERHOJD)))
print("självtest: 11 kontroller + BARA_YTTERHOJD mot måtten — gröna\n")

if __name__ == "__main__":
    rader = [(k, v) for k, v in M.UTKAST.items() if v[10] == "stall"]
    rader.sort(key=lambda kv: -kv[1][2])
    # ⚠️ DEN GODKÄNDA YTAN ÄR OLIKA PER DJUR och skrivs därför per djur, inte i
    #    en egen kolumn. b54e7a23 har 1,06 m² bottenyta, men husets 38,5 cm är
    #    under marsvinets kortaste sida (40 cm) — för marsvin är ytan 0,72 m²,
    #    för råtta (30 cm) hela 1,06. En gemensam kolumn hade visat det högsta
    #    talet bredvid det strängaste djuret.
    print("%-9s %7s  %-24s %8s | %s"
          % ("id", "pris", "yttermått", "botten", "lagligt för — godkänd yta (max antal i grupp)"))
    print("-" * 130)
    slutsats = {}
    for k, v in rader:
        namn, slug, pris, lager, sku, vid, farg, ytter, delar, ovan, typ, anm = v
        klarar = []
        ar_ytterhojd = k in M.BARA_YTTERHOJD
        for etikett, krav in DJUR:
            dom, y, d = racker(delar, krav, ar_ytterhojd)
            if dom == "JA":
                antal = int(y / PER_DJUR[etikett] + 1e-9)
                klarar.append("%s %.2f m² (%d)" % (etikett, y, antal))
            elif dom == "EJ AVGÖRBAR":
                klarar.append("%s EJ AVGÖRBAR" % etikett)
        botten = yta(delar)
        slutsats[k] = klarar
        print("%-9s %7d  %-24s %5.2f m² | %s"
              % (k, pris, "%g × %g × %g" % ytter, botten,
                 ", ".join(klarar) if klarar else "☠️ INGET djur i tabellerna"))
    print()
    for etikett, _krav in DJUR:
        n = sum(1 for k in slutsats
                if any(x.startswith(etikett) and "EJ AVGÖRBAR" not in x for x in slutsats[k]))
        print("  %-18s %2d av %d stall" % (etikett, n, len(rader)))
    inget = [k for k in slutsats if not slutsats[k]]
    print("\n  ☠️ %d stall klarar INGET djur i L80:s tabeller: %s"
          % (len(inget), ", ".join(sorted(inget))))
