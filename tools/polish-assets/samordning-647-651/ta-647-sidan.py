#!/usr/bin/env python3
"""Löser konfliktblocken mellan #647 och #651 genom att behålla #647:s sida.

    python3 ta-647-sidan.py --sida var   lib/category-seo.ts lib/category-content.ts
    python3 ta-647-sidan.py --sida deras lib/category-seo.ts lib/category-content.ts

--sida var:   #647 är den gren du står på (headless-site slås in i #647-grenen).
--sida deras: #647 är den som slås in (du står på #651-grenen).

Bara raderna INOM blocken rörs. Allt git redan slagit ihop utanför dem står kvar,
och det är just där #651:s 3–6 ligger i de poster #647 inte rört. Därför inte
`git checkout --ours/--theirs`, som tar hela filen från ena sidan.
Hanterar även diff3-stil (||||||| bas).
"""
import sys

args = sys.argv[1:]
if len(args) < 3 or args[0] != "--sida" or args[1] not in ("var", "deras"):
    sys.exit(__doc__)
behall = "var" if args[1] == "var" else "deras"
for fn in args[2:]:
    ut, tillstand, block = [], "ute", 0
    for rad in open(fn, encoding="utf-8").read().split("\n"):
        if rad.startswith("<<<<<<< "):
            tillstand, block = "var", block + 1
            continue
        if tillstand != "ute" and rad.startswith("||||||| "):
            tillstand = "bas"
            continue
        if tillstand != "ute" and rad == "=======":
            tillstand = "deras"
            continue
        if tillstand != "ute" and rad.startswith(">>>>>>> "):
            tillstand = "ute"
            continue
        if tillstand in ("ute", behall):
            ut.append(rad)
    if tillstand != "ute":
        sys.exit(f"{fn}: ett block slutar aldrig, ingenting skrivet")
    open(fn, "w", encoding="utf-8").write("\n".join(ut))
    print(f"{fn}: {block} block lösta med #647:s sida")
