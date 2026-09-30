#!/usr/bin/env python3
"""Bygger rundans bildplan.json — det workflowen "Polering — skriv bara bilderna"
skickar till /api/admin/polish-bilder.

Tvilling till bygg-skrivplan.py för en runda som BARA ändrar bildlistan på redan
polerade sidor (2026-09-30). Samma kedja för bilderna: alt-grinden först, sedan
bygg-media.py, som skriver nyttolast-media.json med måttskissen sist. Planen bär
bara kort, pid och bildlistan.

Läser (alla från rundans katalog):
  ids.tsv  bilder.tsv  alt.tsv  kallor.json (för alt-grindens siffror)

bilder.tsv listar varje bild produkten SKA ha efter skrivningen: de som redan
sitter kvar och de nya, med källposition. Listan ersätter hela galleriet, så en
bild som inte står där försvinner från sidan.

ANVÄNDNING (från rundans katalog):  python3 ../../polish-gates/bygg-bildplan.py
"""
import hashlib, io, json, os, subprocess, sys
HAR = os.path.dirname(os.path.abspath(__file__))

MAX_PRODUKTER = 50
KEDJA = ("gate-alt.py", "bygg-media.py")


def undantag():
    ut = {}
    if os.path.exists("grind-undantag.txt"):
        for rad in io.open("grind-undantag.txt", encoding="utf-8"):
            delar = rad.strip().split(None, 1)
            if not delar or delar[0].startswith("#"):
                continue
            if len(delar) < 2:
                raise SystemExit(f"  [AVBRYT] grind-undantag.txt: {rad.strip()!r} saknar skäl")
            ut[delar[0]] = delar[1]
    return ut


def kor_grindarna():
    kvitt, foll = undantag(), []
    for skript in KEDJA:
        r = subprocess.run([sys.executable, os.path.join(HAR, skript)],
                           capture_output=True, text=True)
        if r.returncode == 0:
            print(f"  {skript}: ren")
            continue
        ut = (r.stdout + r.stderr).rstrip()
        # bygg-media.py skriver planens bilder och får aldrig kvitteras bort.
        if skript in kvitt and skript != "bygg-media.py":
            print(f"  {skript}: föll, kvitterad ({kvitt[skript]})")
        else:
            print(f"  {skript}: FÖLL\n" + "\n".join("    " + x for x in ut.splitlines()[-25:]))
            foll.append(skript)
    return foll


def main():
    runda = os.path.basename(os.getcwd())
    print("Grindarna:")
    foll = kor_grindarna()
    if foll:
        sys.stderr.write(f"BYGGET FALLER — {', '.join(foll)} har fynd. Rätta filerna, "
                         "eller kvittera alt-grinden i grind-undantag.txt om källan inte räcker.\n")
        sys.exit(1)

    ids = {}
    for r in io.open("ids.tsv", encoding="utf-8"):
        if r.strip():
            d = r.rstrip("\n").split("\t")
            ids[d[0]] = d[1]
    media = json.load(io.open("nyttolast-media.json", encoding="utf-8"))

    fel = []
    if len(ids) > MAX_PRODUKTER:
        fel.append(f"{len(ids)} produkter i ids.tsv — högst {MAX_PRODUKTER} per plan")
    for k in media:
        if k not in ids:
            fel.append(f"{k}: har bilder men ingen rad i ids.tsv")

    produkter = []
    for k, pid in ids.items():
        if k not in media:
            fel.append(f"{k}: saknar bilder i nyttolast-media.json")
            continue
        if not pid.startswith(k):
            fel.append(f"{k}: produkt-id:t i ids.tsv börjar inte med kortet")
            continue
        produkter.append({
            "kort": k,
            "pid": pid,
            "media": [{"id": m["id"], "altText": m["altText"]} for m in media[k]],
        })

    if fel:
        sys.stderr.write("BYGGET FALLER — bildplan.json skrivs inte:\n" + "\n".join("  " + f for f in fel) + "\n")
        sys.exit(1)

    data = (json.dumps({"runda": runda, "produkter": produkter}, ensure_ascii=False, indent=1) + "\n").encode("utf-8")
    io.open("bildplan.json", "wb").write(data)
    print(f"bildplan.json: {len(produkter)} produkter, {len(data)} byte")
    print(f"plan_sha256: {hashlib.sha256(data).hexdigest()}")


if __name__ == "__main__":
    main()
