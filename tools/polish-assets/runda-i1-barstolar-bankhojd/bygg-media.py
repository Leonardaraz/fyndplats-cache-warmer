#!/usr/bin/env python3
"""Bygger bildnyttolasten ur SAMMA källor som grinden läser (bilder.tsv + alt.tsv).

Visningsordningen sätter måttskissen (källposition 3) SIST — livsstilsbilderna
säljer, ritningen svarar på en fråga kunden ställer efteråt. Bilder som står i
bilder-bort.tsv finns inte i alt.tsv och kommer därför aldrig med.
"""
import json, collections

fil = {}
for r in open("bilder.tsv", encoding="utf-8"):
    kort, pos, f = r.rstrip("\n").split("\t")
    fil[(kort, pos)] = f

vis = collections.OrderedDict()
for r in open("alt.tsv", encoding="utf-8"):
    kort, pos, alt = r.rstrip("\n").split("\t")
    vis.setdefault(kort, []).append((pos, fil[(kort, pos)], alt))

ut = collections.OrderedDict()
for kort, rader in vis.items():
    rader.sort(key=lambda t: (t[0] == "3", int(t[0])))   # måttskissen sist
    assert len({f for _, f, _ in rader}) == len(rader), f"{kort}: dubblettbild"
    ut[kort] = [{"id": f, "altText": a} for _, f, a in rader]

json.dump(ut, open("nyttolast-media.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for k, v in ut.items():
    print(k, len(v), " ".join(p for p, _, _ in vis[k]))
