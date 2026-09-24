"""Bygger skrivplan.json ur seo.tsv + säkerhetskopian (fore/).

Ny seoData = TVÅ taggar (titel + metabeskrivning), husets form. Importens og-
och keywords-taggar tas bort; butiken härleder og:title/og:description själv.
settings behålls som de var, med två rättelser:
  - fokusord skrivna utan å/ä/ö (slug-stil) byts mot svenska,
  - de nio utan titel hade fokusord utan `origin` och utan huvudord.
raa = kontrollsumma (kontroll.summa) över JSON.stringify(seoData) -- samma
funktion räknas om i skrivanropet, och HELA skrivningen avbryts vid avvikelse.
"""
import json, glob, re, copy
from kontroll import summa, js

FOKUS = {
    "cc2add44": "foliehus med rullbar dörr",
    "75b88995": "tunnelväxthus 600 x 300 cm",
    "b8496223": "tunnelväxthus 300 x 200 cm",
    "11d486a3": "miniväxthus två odlingsytor",
    "eac7fdca": "växthus med takfönster",
    "e0b85bb6": "miniväxthus i trä grått",
    "83a5fc0e": "miniväxthus i trä brunt",
    "87485b8a": "drivbänk i trä",
    "ad667726": "bågtunnelväxthus grönt",
    "3e60d4ee": "bågtunnelväxthus transparent",
    "1a46d2af": "växthus med skjutdörr",
    "0667fc10": "tomatväxthus",
}
SLUGORD = re.compile(r"\b(vaxthus|dorr\w*|gront|gratt|tra|stal|forzinkat|fonster|natfonster|drivbank|bagtunnel\w*|tva|minivaxthus|premiumvaxthus|polytunnelvaxthus|tomatvaxthus|uppfallbart|gra)\b")

fore = {r["id"]: r for f in sorted(glob.glob("fore/del*.json")) for r in json.load(open(f))}
typ = {l.split()[0]: l.split()[2] for l in open("ids.txt")}
seo = {}
for rad in open("seo.tsv", encoding="utf-8"):
    k, t, d = rad.rstrip("\n").split("\t")
    seo[k] = (t, d)

plan = []
for fid in [l.split()[0] for l in open("ids.txt")]:
    k = fid[:8]
    t, d = seo[k]
    gammal = fore[fid]["s"]
    ny = {"tags": [
        {"type": "title", "children": t, "custom": False, "disabled": False},
        {"type": "meta", "props": {"name": "description", "content": d}, "children": "", "custom": True, "disabled": False},
    ]}
    if "settings" in gammal:
        s = copy.deepcopy(gammal["settings"])
        kw = s.get("keywords", [])
        if typ[fid] == "INGEN":
            kw = [{"term": x["term"], "isMain": i == 0, "origin": "USER"} for i, x in enumerate(kw)]
        if k in FOKUS:
            assert kw and kw[0]["isMain"], k
            kw[0] = {"term": FOKUS[k], "isMain": True, "origin": "USER"}
        for x in kw:
            assert not SLUGORD.search(x["term"]), (k, x["term"])
        s["keywords"] = kw
        ny["settings"] = s
    plan.append({"id": fid, "seoData": ny, "raa": summa(js(ny))})

json.dump(plan, open("skrivplan.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(len(plan), "rader i skrivplanen;", sum("settings" in p["seoData"] for p in plan), "med settings")
