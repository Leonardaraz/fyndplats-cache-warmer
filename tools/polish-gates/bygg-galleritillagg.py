#!/usr/bin/env python3
"""bygg-galleritillagg.py <ut.js> <plan.json> [--torr]: gör galleri-tillagg.js till ett färdigt ExecuteWixAPI-skript.

plan.json (2026-10-23, måttkorten per storlek):
  {"id": "<fullt produkt-id>", "filer": [{"fil": "b379ce_<32 hex>~mv2.jpg", "alt": "<svensk alt-text>"}, ...]}

Planen bäddas in i skriptet tillsammans med en kontrollsumma (FNV-1a över JSON.stringify av planen), och skriptet räknar om summan i samma anrop som skriver:
en plan som skrivits av för hand avvisas. Alt-texterna ska komma ur rundans kortalt.tsv, aldrig skrivas av: rundans planer.py bygger planerna ur den.
--torr bygger en torrkörning (ingenting skrivs, hasMutations false).

  python3 -P bygg-galleritillagg.py ut.js plan.json [--torr]
Kör ut.js via ExecuteWixAPI, sedan bygg-agare.py (ägare per bild), bilder-bort.yml för de gamla måttbilderna och bygg-variantbild-farg.py.
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))


def fnv(s: str) -> str:
    m = 0xFFFFFFFFFFFFFFFF
    h = 0xCBF29CE484222325
    for b in s.encode():
        h ^= b
        h = (h * 0x100000001B3) & m
    return format(h, "016x")


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    ut, planfil = sys.argv[1], sys.argv[2]
    torr = "--torr" in sys.argv[3:]
    src = open(os.path.join(HERE, "galleri-tillagg.js"), encoding="utf-8").read()
    plan = json.load(open(planfil, encoding="utf-8"))
    if set(plan) != {"id", "filer"}:
        sys.exit(f"planen ska ha id och filer: {sorted(plan)}")
    for k in plan["filer"]:
        if set(k) != {"fil", "alt"}:
            sys.exit(f"en fil ska ha fil och alt: {sorted(k)}")
    # JSON.stringify och json.dumps ger samma text för strängar och objekt med nycklarna i samma ordning.
    js = json.dumps(plan, ensure_ascii=False, separators=(",", ":"))
    for gammal, ny in (
        ("  const PLAN = null;\n", f"  const PLAN = {js};\n"),
        ('  const SUM = "";\n', f'  const SUM = "{fnv(js)}";\n'),
    ):
        if src.count(gammal) != 1:
            sys.exit(f"mallen saknar raden {gammal!r}")
        src = src.replace(gammal, ny)
    if torr:
        if src.count("const TORR = false;") != 1:
            sys.exit("mallen saknar const TORR = false;")
        src = src.replace("const TORR = false;", "const TORR = true;", 1)
    open(ut, "w", encoding="utf-8").write(src)
    print(len(src), "tecken, fnv", fnv(js), "(TORRKÖRNING: skriver ingenting, hasMutations false)" if torr else "")


if __name__ == "__main__":
    main()
