#!/usr/bin/env python3
"""Bygger bildnyttolasten och facit ur SAMMA källor (media.tsv + alt.tsv).

alt.tsv står i VISNINGSORDNING; kolumn 2 är bildens KÄLLPOSITION i media.tsv.
Måttskissen ligger på källposition 3 i hela den här rundan och skrivs sist.
"""
import sys, json, collections

fil = {}
for r in open("media.tsv", encoding="utf-8"):
    d = r.rstrip("\n").split("\t")
    for i, f in enumerate(d[1:6], 1):
        fil[(d[0], str(i))] = f

vis = collections.OrderedDict()
for r in open("alt.tsv", encoding="utf-8"):
    kort, pos, alt = r.rstrip("\n").split("\t")
    vis.setdefault(kort, []).append((fil[(kort, pos)], alt))

for k, v in vis.items():
    assert len(v) == 5, f"{k}: {len(v)} bilder"
    assert len({f for f, _ in v}) == 5, f"{k}: dubblettbild"

if len(sys.argv) > 1 and sys.argv[1] == "facit":
    with open("vantat-media.tsv", "w", encoding="utf-8") as f:
        for k, rader in vis.items():
            for fid, alt in rader:
                f.write(f"{k}\t{fid}\t{alt}\n")
    print(f"facit: {sum(len(v) for v in vis.values())} bilder, {len(vis)} produkter")
else:
    h = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    ks = list(vis)[h*4:(h+1)*4]
    print(json.dumps([[k, [[f, a] for f, a in vis[k]]] for k in ks], ensure_ascii=False))
