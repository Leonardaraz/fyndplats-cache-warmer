#!/usr/bin/env python3
"""Bygger media-skrivningen MEKANISKT ur media.tsv (fil-id per källposition)
och alt.tsv (ordning + alt-text).

☠️ HELA itemsInfo.items ERSÄTTS. En bild utan altText förlorar sin alt-text —
det var så åtta sidor blev kvar med tysk alt efter en felfri textpolering.
"""
import json, sys, collections

# media.tsv: kort + fil-id i KÄLLANS ordning (position 1..5)
filer = {}
for l in open("media.tsv"):
    c = l.rstrip("\n").split("\t")
    if len(c) >= 6:
        filer[c[0]] = {str(i + 1): c[i + 1] for i in range(5)}

# alt.tsv: raderna står i den ORDNING sidan ska visa dem
ordning = collections.defaultdict(list)
for l in open("alt.tsv"):
    c = l.rstrip("\n").split("\t")
    if len(c) == 3:
        ordning[c[0]].append((c[1], c[2]))

rev = json.load(open("rev-efter-text.json"))
prods, fel = [], []
for k, rader in ordning.items():
    if len(rader) != 5: fel.append(f"{k}: {len(rader)} rader")
    items = []
    for pos, alt in rader:
        fid = filer[k].get(pos)
        if not fid: fel.append(f"{k}: saknar fil-id för källposition {pos}"); continue
        if not fid.startswith("b379ce_"): fel.append(f"{k}: misstänkt fil-id {fid!r}")
        if not alt.strip(): fel.append(f"{k}: tom alt-text på position {pos}")
        items.append({"id": fid, "altText": alt, "mediaType": "IMAGE"})
    if len({i["id"] for i in items}) != len(items): fel.append(f"{k}: dubblettbild i listan")
    prods.append({"product": {"id": rev[k]["id"], "revision": rev[k]["rev"],
                              "media": {"itemsInfo": {"items": items}}}})
if fel:
    print("GRIND FALLER:\n" + "\n".join(fel)); sys.exit(1)

par = int(sys.argv[1]) if len(sys.argv) > 1 else None
if par is None:
    print(f"GRIND REN: {len(prods)} produkter, {sum(len(p['product']['media']['itemsInfo']['items']) for p in prods)} bilder")
else:
    print(json.dumps({"products": prods[par*4:par*4+4]}, ensure_ascii=False, separators=(",", ":")))
