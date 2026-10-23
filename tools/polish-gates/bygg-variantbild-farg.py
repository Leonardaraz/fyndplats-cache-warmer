#!/usr/bin/env python3
"""bygg-variantbild-farg.py <ut.js> <produkt-id>... [--torr] [--kompakt]: gör variantbild-farg.js till ett färdigt ExecuteWixAPI-skript för de angivna sidorna.

  python3 bygg-variantbild-farg.py ut.js 3b868848-b46b-4618-84fa-22971bf0d486 7d1fb82b-f895-453f-b153-b666b565a2bd [--torr] [--kompakt]

Produkt-id:n ska vara fulla Wix-id (36 tecken). --torr bygger en torrkörning (ingenting skrivs, hasMutations false): svaret har variantbilderna före och efter.
--kompakt tar bort radkommentarerna (skriptet klistras in i ExecuteWixAPI). Högst fem sidor per körning (60 s-taket). Se variantbild-farg.js för varför och hur."""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) < 2:
        sys.exit(__doc__)
    ut, ids = args[0], args[1:]
    for i in ids:
        if not re.fullmatch(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", i):
            sys.exit("ogiltigt produkt-id: %r" % i)
    if len(set(ids)) != len(ids):
        sys.exit("samma id två gånger")
    if len(ids) > 5 and "--torr" not in sys.argv[1:]:
        sys.exit("högst fem sidor per körning (en torrkörning läser bara och får ta fler)")
    src = open(os.path.join(HERE, "variantbild-farg.js"), encoding="utf-8").read()
    gammal = "  const IDS = [];\n"
    if src.count(gammal) != 1:
        sys.exit("mallen saknar IDS-raden")
    src = src.replace(gammal, "  const IDS = [%s];\n" % ", ".join('"%s"' % i for i in ids))
    if "--torr" in sys.argv[1:]:
        if src.count("const TORR = false;") != 1:
            sys.exit("mallen saknar const TORR = false;")
        src = src.replace("const TORR = false;", "const TORR = true;", 1)
    if "--kompakt" in sys.argv[1:]:
        src = "".join(rad for rad in src.splitlines(True) if not rad.lstrip().startswith("//"))
    open(ut, "w", encoding="utf-8").write(src)
    print(len(src), "tecken" + (" (TORRKÖRNING: skriver ingenting, hasMutations false)" if "--torr" in sys.argv[1:] else ""))


if __name__ == "__main__":
    main()
