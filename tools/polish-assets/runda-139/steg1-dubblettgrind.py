#!/usr/bin/env python3
"""Runda 139, Steg 1 — dubblettgrinden, kord i BADA riktningar.

  A) utkasten mot varandra
  B) utkasten mot HELA den publicerade klosmobelfamiljen (92 sidor)

☠️ Matten ar INGET BEVIS (#532: "BEVISAD DUBBLETT" var fel pa tre av fyra par).
   Grinden FLAGGAR en traff; den avgor inte. Ett flaggat par gar vidare till
   konstruktions- och bildjamforelse, och det ar DEN som doms pa.
"""
import json, sys, re

UTKAST = {                       # matt ur leverantorens egen Technische Daten, raw/*.txt
    "05c91630": ("40x40x132",  "3 runda plan + hangmatta, stam"),
    "1467588a": ("48x48x92",   "ETT plan, lammfellsimitat, stam 13,5"),
    "27b607dc": ("38x38x80",   "ek + cremevit, minsta"),
    "3a96740e": ("65x50x153",  "hala + tva hangmattor"),
    "3addfbf8": ("60x30x76",   "badd 34, U-stall, jutekudde"),
    "4faf9f4c": ("60x40x113",  "hus 40x30x27, ramp"),
    "8d074911": ("50x40x84",   "VAGGMONTERAT 4-delat, molnform"),
    "90573e36": ("30x25x220-240", "TAKSPAND + tippskyddsrem"),
    "a4d8feca": ("35x60",      "KLOSTUNNA, rund bas, ingen montering"),
    "b04b5375": ("40x28x73",   "VAGGMONTERAT 4-delat, tre separata steg-pinnar"),
    "b813d037": ("48x48x104",  "4 plan, hus 30x25H"),
}

def norm(s):
    """'40x40x230-250' -> ('40','40','230-250'); tal med komma bevaras."""
    if s is None: return None
    return tuple(p.strip() for p in re.split(r"[x×]", s.replace(" ", "")))

def kor():
    pub = json.load(open("publicerade-matt.json"))
    facit = {k: [norm(v) for v in vs] for k, vs in pub["tripplar"].items()}
    for k, v in pub["par_rundabas"].items():
        facit[k] = [norm(v)] if v else []

    fynd = []

    # Riktning A — utkasten mot varandra
    ids = sorted(UTKAST)
    for i, a in enumerate(ids):
        for b in ids[i + 1:]:
            if norm(UTKAST[a][0]) == norm(UTKAST[b][0]):
                fynd.append(("A", a, b, UTKAST[a][0]))

    # Riktning B — utkasten mot hela den publicerade familjen
    for u, (matt, _) in UTKAST.items():
        n = norm(matt)
        for slug, tripplar in facit.items():
            if n in tripplar:
                fynd.append(("B", u, slug, matt))

    return fynd

SJALVTEST = [
    # (matt_a, matt_b, ska_matcha)
    ("40x28x73", "40x28x73", True),
    ("48x48x92", "48x48x90", False),      # 2 cm skiljer -> INTE samma
    ("35x60",    "35x60",    True),       # rund bas: par, inte trippel
    ("40x40x230-250", "40x40x230-260", False),
    ("60x44,5x109", "60x44x109", False),  # decimal spelar roll
]

if __name__ == "__main__":
    for a, b, vantat in SJALVTEST:
        fick = norm(a) == norm(b)
        assert fick == vantat, f"SJALVTEST FALLER: {a} vs {b} gav {fick}, vantat {vantat}"
    print(f"sjalvtest {len(SJALVTEST)}/{len(SJALVTEST)} ok")
    f = kor()
    if not f:
        print("INGA MATTTRAFFAR — noll dubblettkandidater")
    for riktning, a, b, matt in f:
        print(f"[{riktning}] {a}  ~  {b}   ({matt})   -> KRAVER konstruktions- och bildjamforelse")
    print(f"\n{len(f)} traff(ar) av {len(UTKAST)} utkast mot 92 publicerade sidor")
