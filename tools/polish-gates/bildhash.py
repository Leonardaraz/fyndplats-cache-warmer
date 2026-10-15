#!/usr/bin/env python3
"""bildhash.py: byte-identiska bilder mellan produkter, utan en enda nedladdning (2026-10-15).

Wix filbeskrivare (`POST /site-media/v1/files/get-files`) bär ett `hash` (md5 av filens byte). Två sidor med samma
foto har alltså samma hash, vilket är exakt det `bildjamfor2.py` mäter genom att ladda ner varje bild, men över
HELA katalogen på två minuter i stället för en hämtning per bild.

  bildhash.py bygg <karta.json> <svar1.txt> [<svar2.txt> ...]
      Slår ihop sparade ExecuteWixAPI-svar från `bildhashkarta.js` (ett svar per 8–12 sidor om 100 produkter) till
      en karta {id8: {"v": "P"|"D", "h": [hash10, ...]}}. P = publicerad, D = dold. Ett svar som kapats vid
      100 000 tecken avvisas: kör om den delen med färre sidor.

  bildhash.py skarm <karta.json> <id8>[,<id8>...]
      För varje kandidat: vilka ANDRA produkter delar minst en bild med den (publicerade och dolda), och hur många.
      Slutkod 1 om någon kandidat delar en bild med en PUBLICERAD sida.

☠️ DET ÄR EN DUBBLETTSKÄRM, INGEN DOM. En träff betyder att två sidor visar samma foto. Det är nästan alltid samma vara,
men Aosom återanvänder miljöfoton över en produktlinje (position 2 på `e1977f20` är identisk med en annan vibrationsplatta),
så MÅTTEN avgör. Omvänt är en nolla ingen frikännande dom: en AliExpress-sida kan ha egna foton av samma vara, och en
Aosom-artikel i en annan färg har egna foton. Kör den TILLSAMMANS med måtttrippelsvepet (`DUBBLETTMATNING.md`), aldrig i
stället för det.

Hashen är kapad till tio hextecken (40 bitar) i kartan: sannolikheten att två olika av ~35 000 filer krockar är ~0,05 %.
Ett fynd verifieras ändå mot fil-id:n innan något pensioneras.
"""
import collections
import json
import sys


def las_svar(fn):
    t = open(fn, encoding="utf-8").read()
    i = t.find('{"rader"')
    if i < 0:
        sys.exit(f"{fn}: inget svar att läsa (saknar \"rader\")")
    if "TRUNCATED" in t[:200] or t.rstrip().endswith("--- TRUNCATED ---") or "\n--- TRUNCATED ---" in t[-800:]:
        sys.exit(f"{fn}: svaret är kapat vid 100 000 tecken. Kör om delen med färre sidor (PAGES) från samma START.")
    try:
        return json.loads(t[i:])
    except json.JSONDecodeError as e:
        sys.exit(f"{fn}: svaret går inte att tolka ({e})")


def bygg(ut, filer):
    karta = {}
    for fn in filer:
        d = las_svar(fn)
        if d.get("fel"):
            sys.exit(f"{fn}: {d['fel']} misslyckade get-files-anrop, kör om delen")
        for r in d["rader"]:
            pid, vis, hs = r[:8], r[8], (r[9:].split(",") if r[9:] else [])
            if vis not in ("P", "D"):
                sys.exit(f"{fn}: oväntad rad {r[:20]!r}")
            karta[pid] = {"v": vis, "h": hs}
    json.dump(karta, open(ut, "w"))
    p = sum(1 for v in karta.values() if v["v"] == "P")
    bilder = sum(len(v["h"]) for v in karta.values())
    utan = sum(1 for v in karta.values() for h in v["h"] if h == "-")
    print(f"{len(karta)} produkter ({p} publicerade, {len(karta) - p} dolda), {bilder} bilder, {utan} utan hash -> {ut}")


def skarm(kartfil, kandidater):
    karta = json.load(open(kartfil))
    per_hash = collections.defaultdict(set)
    for pid, v in karta.items():
        for h in set(v["h"]):
            if h != "-":
                per_hash[h].add(pid)
    ut = 0
    for c in kandidater:
        if c not in karta:
            print(f"{c}  [SAKNAS] finns inte i kartan (ny produkt? bygg om den delen)")
            ut = 1
            continue
        delar = collections.Counter()
        for h in set(karta[c]["h"]):
            if h == "-":
                continue
            for q in per_hash[h]:
                if q != c:
                    delar[q] += 1
        publ = [(q, n) for q, n in delar.most_common() if karta[q]["v"] == "P"]
        dolda = [(q, n) for q, n in delar.most_common() if karta[q]["v"] == "D"]
        rad = f"{c}  {len(set(karta[c]['h']))} bilder"
        if not delar:
            print(rad + "  ingen delad bild")
            continue
        if publ:
            ut = 1
        print(rad + "  PUBLICERADE: " + (", ".join(f"{q}:{n}" for q, n in publ) or "-")
              + "  DOLDA: " + (", ".join(f"{q}:{n}" for q, n in dolda) or "-"))
    return ut


if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) >= 3 and a[0] == "bygg":
        bygg(a[1], a[2:])
    elif len(a) == 3 and a[0] == "skarm":
        sys.exit(skarm(a[1], [x for x in a[2].split(",") if x]))
    else:
        sys.exit(__doc__)
