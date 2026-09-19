# -*- coding: utf-8 -*-
"""Delad grind för alla batchar i leverantörssvepet."""
import re, sys

AKTOR = re.compile(
    r"(?<![A-Za-zÅÄÖåäö0-9])(leverantör\w*|tillverkar\w*|producent\w*|"
    r"importör\w*|grossist\w*|fabrikant\w*|distributör\w*)"
    r"(?![A-Za-zÅÄÖåäö0-9])", re.I)
OSYNLIGT = {chr(c): "U+%04X" % c for c in (0x00AD, 0x00A0, 0x200B, 0xFEFF)}
assert all(ord(t) > 0x20 for t in OSYNLIGT), "grinden ar avvapnad"


def granska(PAR):
    fel = []
    sedda = {}
    for i, (vem, g, n) in enumerate(PAR, 1):
        def k(t):
            fel.append("par %2d (%s): %s" % (i, vem, t))
        if AKTOR.search(n):
            k("aktören står kvar: %r" % AKTOR.search(n).group(0))
        # ☠️ STÄD-par är EFTERSTÄDNING av en mening där aktören redan är
        #    borttagen (ett dinglande "de", en syftning utan huvudord). De
        #    får sakna aktör i gammal — men INGEN av sidorna får ha en.
        stad = vem.startswith("STÄD")
        if stad:
            if AKTOR.search(g):
                k("STÄD-par men gamla strängen har en aktör kvar")
        elif not AKTOR.search(g):
            k("gamla strängen innehåller ingen aktör")
        if g == n:
            k("gammal == ny")
        if g in sedda:
            k("dubblett av par %d" % sedda[g])
        sedda[g] = i
        # ☠️ Ordningsfällan: körs det KORTA paret först äter det upp texten
        #    som det LÅNGA paret skulle ha bytt ut. Det korta måste stå EFTER.
        #    (Regeln var inverterad fram till batch 3 och kunde aldrig fyra.)
        for tidigare, j in list(sedda.items()):
            if j < i and tidigare in g:
                k("par %d är delsträng av det här — det korta paret måste "
                  "stå EFTER det långa" % j)
        for d, t in (("dubbelt mellanslag", "  "), (" före punkt", " ."),
                     (" före komma", " ,")):
            if t in n:
                k("ny text har%s" % d)
        for t, kod in OSYNLIGT.items():
            if t in g or t in n:
                k("osynligt tecken %s" % kod)
        if n and g.rstrip().endswith(".") != n.rstrip().endswith("."):
            k("skiljetecken i slutet skiljer sig")
    return fel


def sjalvtest():
    """☠️ En grind som aldrig fyrat är ingen grind. Återinför fällan."""
    kort = ("x", "Tillverkaren anger 25 kg.", "Maxlasten är 25 kg.")
    lang = ("x", "Tillverkaren anger 25 kg. Det är mycket.",
            "Maxlasten är 25 kg. Det är mycket.")
    if not granska([kort, lang]):
        raise AssertionError("ordningsregeln fyrar inte på kort-före-langt")
    if granska([lang, kort]):
        raise AssertionError("ordningsregeln fyrar pa RATT ordning")
    # STÄD-undantaget får inte släppa igenom en kvarvarande aktör
    if not granska([("STÄD", "enligt tillverkaren, och de", "och de")]):
        raise AssertionError("STAD-undantaget slapper igenom en aktor")
    if granska([("STÄD", "och de rekommenderar", "och rekommendationen")]):
        raise AssertionError("STAD-undantaget faller pa ett giltigt par")
    return True


if __name__ == "__main__":
    sjalvtest()
    mod = __import__(sys.argv[1])
    f = granska(mod.PAR)
    for r in f:
        print("  ☠️ " + r)
    print("\n  %d par, %d brister" % (len(mod.PAR), len(f)))
    sys.exit(1 if f else 0)
