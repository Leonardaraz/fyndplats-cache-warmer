#!/usr/bin/env python3
"""bygg-harma.py <plan.json> <ut.js> [--ids id8,id8,…] [--torr|--fake] [--kompakt]: gör harma-skriv.js till ett färdigt ExecuteWixAPI-skript för en eller flera sidor.

plan.json (2026-10-24, Härma Aosom): [{"id": "<fullt produkt-id>", "filer": [{"h": "<32 hex ur Wix fil-id>", "alt": "<svensk alt-text>", "a": ["<valets namn>", …]}, …]}, …]
  a    ägarna: namnen på de val bilden hör till, i vilken option som helst. Flera val i samma option betyder "något av dem", val i flera optioner "alla optioner måste passa".
--ids   väljer sidor ur planen (de första åtta tecknen i produkt-id:t), i den ordningen. Högst fem sidor i en skarp körning (skriptet hoppar över resten efter 36 s, 60 s-taket), ungefär femton i en torr.
--torr  skriver ingenting (hasMutations false) och svarar med valens länkar före → efter och, per kombination, antal bilder och butikens första bild före → efter.
        Alt-texterna byts mot en platshållare i en torr plan: de skrivs inte, och planen blir kortare att klistra in. Alt-texterna kontrolleras här i stället (samma regler).
--fake  som --torr men hoppar över kontrollen av filerna hos Wix (påhittade fil-id).
--kompakt tar bort radkommentarerna och indragen ur ut.js (skriptet klistras in i ExecuteWixAPI).
Planen bäddas in med en kontrollsumma (FNV-1a över JSON.stringify av planen) som skriptet räknar om i samma anrop som skriver: en plan som skrivits av för hand avvisas.
Efter en skarp körning: variantbild.yml (dryRun=false, ids), eftersom en id-skrivning av optionerna nollställer variantens bild."""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
FORBJUDET = re.compile(r"https?:|www\.|\.(?:com|se|de)\b|homcom|outsunny|pawhut|aiyaplay|vinsetto|kleankin|zonekiz|sportnow|durhand|aosom|aliexpress|alibaba|vevor|succebuy|giantex|costway|fyndplats|leverant", re.I)


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
    planfil, ut = sys.argv[1], sys.argv[2]
    args = sys.argv[3:]
    torr = "--torr" in args
    fake = "--fake" in args
    kompakt = "--kompakt" in args
    plan = json.load(open(planfil, encoding="utf-8"))
    if "--ids" in args:
        val = args[args.index("--ids") + 1].split(",")
        per = {p["id"][:8]: p for p in plan}
        saknas = [v for v in val if v not in per]
        if saknas:
            sys.exit("saknas i planen: %s" % saknas)
        plan = [per[v] for v in val]
    for p in plan:
        if set(p) != {"id", "filer"} or not re.fullmatch(r"[0-9a-f-]{36}", p["id"]):
            sys.exit("sidan ska ha id och filer: %s" % sorted(p))
        for f in p["filer"]:
            if set(f) != {"h", "alt", "a"} or not re.fullmatch(r"[0-9a-f]{32}", f["h"]):
                sys.exit("%s: en fil ska ha h, alt och a: %s" % (p["id"][:8], sorted(f)))
            if not 20 <= len(f["alt"].strip()) <= 250 or FORBJUDET.search(f["alt"]):
                sys.exit("%s %s: alt-texten duger inte: %s" % (p["id"][:8], f["h"][:6], f["alt"][:60]))
            if not f["a"] or not all(isinstance(n, str) and n for n in f["a"]):
                sys.exit("%s %s: ägarna saknas" % (p["id"][:8], f["h"][:6]))
        if len({f["h"] for f in p["filer"]}) != len(p["filer"]):
            sys.exit("%s: en fil står två gånger" % p["id"][:8])
    if torr or fake:
        plan = [dict(id=p["id"], filer=[dict(h=f["h"], alt="x" * 20, a=f["a"]) for f in p["filer"]]) for p in plan]
    js = json.dumps(plan, ensure_ascii=False, separators=(",", ":"))
    src = open(os.path.join(HERE, "harma-skriv.js"), encoding="utf-8").read()
    for gammal, ny in (("  const PLANER = null;\n", "  const PLANER = %s;\n" % js), ('  const SUM = "";\n', '  const SUM = "%s";\n' % fnv(js))):
        if src.count(gammal) != 1:
            sys.exit("mallen saknar raden %r" % gammal)
        src = src.replace(gammal, ny)
    if torr or fake:
        gammal = "  const TORR = false;\n"
        if src.count(gammal) != 1:
            sys.exit("mallen saknar const TORR = false;")
        src = src.replace(gammal, '  const TORR = %s;\n' % ('"fake"' if fake else "true"))
    if kompakt:
        rader = []
        for r in src.split("\n"):
            t = r.strip()
            if not t or t.startswith("//"):
                continue
            rader.append(t)
        src = "\n".join(rader) + "\n"
    open(ut, "w", encoding="utf-8").write(src)
    print("%d tecken, %d sidor, %d filer, fnv %s%s" % (len(src), len(plan), sum(len(p["filer"]) for p in plan), fnv(js),
                                                       " (TORRKÖRNING: skriver ingenting, hasMutations false)" if (torr or fake) else ""))


if __name__ == "__main__":
    main()
