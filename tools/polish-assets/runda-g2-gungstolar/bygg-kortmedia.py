#!/usr/bin/env python3
"""Lägger in rundans egna Fyndplats-kort på PLATS 3 i galleriet.

☠️ HELA itemsInfo.items ERSÄTTS av en skrivning — det är inte en insättning.
Varje bild måste därför skickas med igen, med sin alt-text, annars försvinner
den. Ordningen blir: huvudbild, miljöbild, KORTET, resten, måttskissen sist.

Både nyttolasten och facit-filen byggs ur SAMMA källor (vantat-media.tsv +
kort-filer.tsv + kortalt.tsv), så en återläsning som diffar mot facit
faktiskt bevisar något.
"""
import sys, json, collections

vis = collections.OrderedDict()
for r in open("vantat-media.tsv", encoding="utf-8"):
    kort, fid, alt = r.rstrip("\n").split("\t")
    vis.setdefault(kort, []).append((fid, alt))

kortfil = dict(l.rstrip("\n").split("\t") for l in open("kort-filer.tsv", encoding="utf-8") if l.strip())
kortalt = dict(l.rstrip("\n").split("\t") for l in open("kortalt.tsv", encoding="utf-8") if l.strip())

ny = collections.OrderedDict()
for kort, rader in vis.items():
    assert len(rader) == 5, f"{kort}: {len(rader)} bilder, väntade 5"
    ny[kort] = rader[:2] + [(kortfil[kort], kortalt[kort])] + rader[2:]

if len(sys.argv) > 1 and sys.argv[1] == "facit":
    with open("vantat-media-2.tsv", "w", encoding="utf-8") as f:
        for kort, rader in ny.items():
            for fid, alt in rader:
                f.write(f"{kort}\t{fid}\t{alt}\n")
    print(f"facit skrivet: {sum(len(r) for r in ny.values())} bilder, {len(ny)} produkter")
else:
    halva = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    kortlista = list(ny)[halva * 4:(halva + 1) * 4]
    print(json.dumps([[k, [[fid, alt] for fid, alt in ny[k]]] for k in kortlista],
                     ensure_ascii=False))
