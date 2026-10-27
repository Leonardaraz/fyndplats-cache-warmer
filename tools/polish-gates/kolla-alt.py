#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# kolla-alt.py (2026-10-23): jämför alt-texterna i butikens egen sidodata mot facit i en rundas tillagg.json. Ren läsning.
#
#   kolla-alt.py <tillagg.json> <slugfil> <ut-katalog>
#
# tillagg.json har formen i tools/polish-assets/fargtillagg-cowork-3/tillagg.json
# ({ "sidor": [ { "id": "<wix-id>", "bilder": [ { "val": "<färg>", "fil": "<Wix fil-id>", "alt": "<alt-text>" } ] } ] }).
# slugfilen har en rad per sida: "<id8> <slug>". Sidorna hämtas med curl till <ut-katalog>/<id8>.html, och varje skriven fils alt-text
# läses ur sidans `imageAlts` (fil-id → alt-text).
#
# Varför: återläsningen av galleriet jämför fil-id, och livekontrollen jämför fil-id. Ingen av dem ser ett avskriftsfel i en alt-text.
# Texten går genom en avskrift in i `ExecuteWixAPI`, det enda steg där en bokstav kan gå förlorad, och `imageAlts` är det som
# butiken faktiskt skickar till kunden. Omgång 3 (rad 55–159): 123 av 123 lika.
#
# Slutar med exit 0 när alla alt-texter är lika, annars exit 1 (en rad per avvikelse, bara id8 och fil-id, aldrig texten i sin helhet).
# Hämta först när butikens cache hunnit ikapp (`age` på sidan), annars saknas en fil som just skrivits.
import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

if len(sys.argv) < 4:
    sys.exit(__doc__)
plan = json.load(open(sys.argv[1]))
slugfil, ut = sys.argv[2], sys.argv[3]
os.makedirs(ut, exist_ok=True)
slug = {}
for rad in open(slugfil):
    p = rad.split(None, 1)
    if len(p) == 2:
        slug[p[0]] = p[1].strip()
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
DEC = json.JSONDecoder()


def las(s, nyckel, start=0):
    i = s.find('"' + nyckel + '":', start)
    if i < 0:
        return None
    j = i + len(nyckel) + 3
    while s[j] in " \n":
        j += 1
    try:
        return DEC.raw_decode(s[j:])[0]
    except ValueError:
        return None


def hamta(i8):
    f = os.path.join(ut, i8 + ".html")
    if not os.path.exists(f) or os.path.getsize(f) < 5000:
        subprocess.run(["curl", "-sS", "--max-time", "60", "-A", UA, "-o", f, "https://www.fyndplats.se/produkt/" + slug[i8] + "?cb=" + i8], capture_output=True)
    return f


ids = [s["id"][:8] for s in plan["sidor"]]
with ThreadPoolExecutor(6) as ex:
    list(ex.map(hamta, ids))
ok = fel = saknas = 0
rader = []
for s in plan["sidor"]:
    i8 = s["id"][:8]
    html = open(os.path.join(ut, i8 + ".html"), encoding="utf-8", errors="replace").read().replace('\\"', '"')
    p = html.find('"productId":"' + i8)
    alts = las(html, "imageAlts", p) if p >= 0 else None
    if not isinstance(alts, dict):
        rader.append(f"{i8} SAKNAR imageAlts i sidans data")
        saknas += len(s["bilder"])
        continue
    for b in s["bilder"]:
        a = alts.get(b["fil"])
        if a is None:
            saknas += 1
            rader.append(f"{i8} {b['fil'][7:15]} SAKNAS i imageAlts")
        elif a.strip() == b["alt"].strip():
            ok += 1
        else:
            fel += 1
            rader.append(f"{i8} {b['fil'][7:15]} ALT SKILJER ({len(a.strip())} tecken på sidan, {len(b['alt'].strip())} i facit)")
print("\n".join(rader))
print(f"alt-texter: {ok} lika, {fel} skiljer, {saknas} saknas av {ok + fel + saknas}")
sys.exit(0 if fel == 0 and saknas == 0 else 1)
