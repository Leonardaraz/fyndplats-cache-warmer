#!/usr/bin/env python3
"""Fångar att en runda som bara skriver alt-texter råkar ändra galleriets ordning (2026-11-20).

ANVÄNDNING (från rundans katalog, före bygg-bildplan.py):  python3 ../../polish-gates/kontroll-galleriordning.py

Läser bilder.tsv och alt.tsv, sorterar som bygg-media.py gör och jämför med galleriets nuvarande ordning, som är
positionsordningen i bilder.tsv (en runda som BARA rättar alt-texter listar bilderna i den ordning de ligger i Wix).
Skriver de sidor där ordningen skulle ändras och slutar med felkod 1 om det finns någon.

Orsaken: bygg-media.py lägger SIST varje bild vars alt-text börjar på Måttbild, Måttskiss eller Måttritning, och
annars källposition 3. En BEFINTLIG alt-text som börjar så på en bild som inte redan är sist, eller en position 3
som inte numrerats om till 101+, flyttar bilden utan att något fel syns (T127 och alt-rundan 2026-11-20, där
`654d3653` hade en befintlig "Måttskiss …" på plats 4 av 7). Lösningen är att numrera om till 101+ och att skriva om
inledningen på en befintlig alt-text som annars flyttar bilden. Läs galleriets ordning i Wix efter skrivningen.
"""
import collections, io, re, sys

alt = {}
for r in io.open("alt.tsv", encoding="utf-8"):
    if r.strip():
        k, p, a = r.rstrip("\n").split("\t")
        alt[(k, int(p))] = a

per = collections.defaultdict(list)
for r in io.open("bilder.tsv", encoding="utf-8"):
    if r.strip():
        k, p, f = r.rstrip("\n").split("\t")
        per[k].append((int(p), f))


def ar_matt(a):
    return re.match(r"\s*(Måttbild|Måttskiss|Måttritning)\b", a, re.I) is not None


fel = 0
for k, rader in sorted(per.items()):
    rader.sort()
    har_matt = any(ar_matt(alt[(k, p)]) for p, _ in rader if (k, p) in alt)
    ny = sorted(rader, key=lambda t: ((ar_matt(alt[(k, t[0])]) if har_matt else str(t[0]) == "3"), t[0]))
    if [p for p, _ in ny] != [p for p, _ in rader]:
        fel += 1
        print(f"{k}: ordningen ändras {[p for p, _ in rader]} -> {[p for p, _ in ny]}"
              f"{'  (Måttbild-alt på ' + str([p for p, _ in rader if ar_matt(alt[(k, p)])]) + ')' if har_matt else '  (position 3 sist)'}")
print(f"{len(per)} sidor kontrollerade, {fel} med ändrad ordning")
sys.exit(1 if fel else 0)
