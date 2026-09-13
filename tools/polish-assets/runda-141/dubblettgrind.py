# -*- coding: utf-8 -*-
"""Runda 141 Steg 1 — dubblettgrind mot HELA familjen, inte mot batchen.

Runda 102:s regel (#361): mattgrinden kors mot alla publicerade av samma typ.
Har ar det ELVA sidor — en hogre krockrisk an nagon runda pa lange.

☠️ Matten BEVISAR ingen dubblett (#532). Tre av fyra par i runda 138 var fel.
   Det matten gor ar att TA FRAM KANDIDATER som sedan avgors pa bilden. En
   grind som sager "bevisad" pa matt ensamt ar fel byggd.

⚠️ Och matten star i OLIKA ORDNING i de tva kallorna. Leverantorens tyska
   skriver ibland L x B x H, ibland B x T x H (8a0e05f4). Butikens sidor
   skriver sin egen ordning. Darfor jamfors SORTERADE mangder av tal — en
   ordningskanslig jamforelse hade missat varje par som matts annorlunda.
"""
import io, json, re, sys

sys.path.insert(0, "..")
import matt                                                       # noqa: E402

TOL = 2.0          # cm; tillverkningstolerans + avrundning i tva sprak

# ☠️ EN ABSOLUT TROSKEL DUGER INTE, och forsta korningen visade varfor:
#    med MIN_TRAFF = 2 flaggades ALLA ATTA utkasten. Bankar ar bankar — 30,
#    75 och 100 cm aterkommer overallt. En grind som flaggar allt flaggar
#    ingenting, samma familj som "noll pa alla ar tellet".
#
# ⚠️ Och en publicerad sida med LANG spec-lista ar en MAGNET: den med femton
#    tal var narmast for FYRA olika utkast, bara for att den har flest tal att
#    trafffa. Darfor kravs BADE hog andel av utkastets matt OCH att traffen
#    inte ar utspadd i den publicerades mangd.
MIN_ANDEL = 0.80   # minst 80 % av utkastets matt maste mota
MIN_TRAFF = 5      # och minst fem matt, sa tva slumptal inte racker


def _tal(s):
    """Alla cm-tal i en strang, som floats. '43-107' ger bada andarna."""
    return [float(t.replace(",", ".")) for t in re.findall(r"\d+(?:[.,]\d+)?", str(s))]


def matt_ur_utkast(d):
    ut = []
    for nyckel in ("tot", "hopfalld", "sits", "rygg", "sitsdyna", "ryggdyna"):
        if d.get(nyckel):
            ut += _tal(d[nyckel])
    return sorted(set(ut))


def matt_ur_publicerad(spec):
    ut = []
    for etikett, varde in spec.items():
        if re.search(r"m[åa]tt|storlek|yttermått|hopfällt|sits|rygg|dyna|höjd",
                     etikett, re.I):
            ut += _tal(varde)
    return sorted(set(ut))


def totalmatt_ur_publicerad(spec):
    """Bara TOTALMATTET — raden som beskriver hela mobeln."""
    import re as _re
    for etikett, varde in spec.items():
        if _re.search(r"^(m[åa]tt|yttermått|totalm[åa]tt)\b", etikett.strip(), _re.I) \
           and not _re.search(r"hopf[äa]ll|ihopf", etikett, _re.I):
            return sorted(_tal(varde))
    return []


def traffar(a, b):
    """Antal tal i a som har en motsvarighet i b inom TOL."""
    kvar, n = list(b), 0
    for x in a:
        for i, y in enumerate(kvar):
            if abs(x - y) <= TOL:
                kvar.pop(i)
                n += 1
                break
    return n


def _sjalvtest():
    fel = []
    if _tal("43-107") != [43.0, 107.0]:
        fel.append("_tal tappar spannets bada andar")
    if _tal("73,5-85") != [73.5, 85.0]:
        fel.append("_tal klarar inte decimalkomma")
    # ☠️ Matten maste motas OAVSETT ordning — kallorna skriver olika.
    if traffar([100.0, 50.0], [50.0, 100.0]) != 2:
        fel.append("jamforelsen ar ordningskanslig")
    # Och ett tal far bara konsumeras EN gang.
    if traffar([50.0, 50.0], [50.0]) != 1:
        fel.append("ett publicerat tal konsumeras tva ganger")
    if traffar([50.0], [53.5]) != 0:
        fel.append("toleransen ar for vid")
    return fel


if __name__ == "__main__":
    fel = _sjalvtest()
    print("sjalvtest: %d fel" % len(fel))
    for f in fel:
        print("  ☠️", f)
    if fel:
        sys.exit(1)

    publ = json.load(io.open("publicerade-spec.json", encoding="utf-8"))
    pm = {s: matt_ur_publicerad(d) for s, d in publ.items()}

    print("\n%-9s %-38s traff  utkastets matt" % ("utkast", "narmaste publicerade"))
    kandidater = []
    for pid, d in sorted(matt.M.items(), key=lambda x: x[1]["pris"]):
        um = matt_ur_utkast(d)
        rank = sorted(((traffar(um, v), s) for s, v in pm.items()), reverse=True)
        n, bast = rank[0]
        andel = n / float(len(um)) if um else 0.0
        traff = n >= MIN_TRAFF and andel >= MIN_ANDEL
        print("%-9s %-38s %2d/%-2d %3.0f%% %s" % (
            pid, bast[:38], n, len(um), andel * 100, "☠️ KANDIDAT" if traff else ""))
        if traff:
            kandidater.append((pid, bast, n, um, pm[bast]))

    # ☠️ PASEN GENERERAR KANDIDATER — TOTALMATTET AVGOR.
    #    18b94738 fick 83 % pa pasen och ar uppenbart en annan mobel: 110 cm
    #    trabank mot 207 cm gymstation. Med bara sex tal i utkastets pase
    #    racker slumpen langt. Det som inte gar att fa av slump ar att HELA
    #    mobelns yttermatt motts, tal for tal.
    print("\nkandidater pa pasen: %d — nu totalmatt mot totalmatt" % len(kandidater))
    bevisade = []
    for pid, s, n, um, pmv in kandidater:
        ut_tot = sorted(_tal(matt.M[pid]["tot"]))
        pu_tot = totalmatt_ur_publicerad(publ[s])
        moter = len(ut_tot) == len(pu_tot) and traffar(ut_tot, pu_tot) == len(ut_tot)
        print("\n  %s  ~  %s" % (pid, s))
        print("     utkastets totalmatt    :", ut_tot)
        print("     publicerades totalmatt :", pu_tot)
        print("     VERDIKT:", "☠️ SAMMA MODELL — avgors pa farg och bild"
              if moter else "faller — annan mobel, pasen var slump")
        if moter:
            bevisade.append((pid, s))
    print("\nkvar efter totalmattet: %d" % len(bevisade))
    for pid, s in bevisade:
        print("   ☠️ %s  ~  %s" % (pid, s))
