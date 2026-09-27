#!/usr/bin/env python3
"""Intern PageRank för fyndplats.se i fyra lägen, byggd ur butikens egna sidor.

Underlag: kategorier.json (115 kategorisidor med sina produktlänkar, hämtade
ur förhandsbygget med hamta-kategorier.py) och uppmätta länkmönster:
  - varje sida: menyn (10 avdelningar + butik/blogg/auktion) + sidfoten (~13 sidor)
  - startsidan: 14 avdelningslänkar till + 12 produkter
  - avdelnings- och underkategorisida: brödsmula, 9 andra avdelningar, ALLA sina
    produkter (rutnät + A–Ö-index) och 8 produkter som står på varje kategorisida
  - produktsida: brödsmula (hem, avdelning), bläddringsraden (en underkategori),
    9 avdelningschips och 6 liknande produkter
Lägen:
  A  produktion i dag (server-HTML)
  A+ som A, plus Förfina-chipsen på avdelningssidan (syns först när JS kört)
  B  #647: produktens brödsmula länkar också till den smalaste underkategorin
  C  B + menyns underkategorier i server-HTML på varje sida (det som byggdes)
  D  C + avdelningssidans A–Ö-index bara för produkter utan underkategori (förkastat)
"""
import collections, json, os, random, statistics, sys
H = os.path.dirname(os.path.abspath(__file__))
res = json.load(open(f"{H}/kategorier.json"))  # skapas av hamta-kategorier.py <bas-url>
N = len(res)
cnt = collections.Counter(i for v in res.values() for i in set(v["ids"]))
vanliga = sorted(i for i, c in cnt.items() if c >= N * 0.5)
slug = lambda url: url.rstrip("/").rsplit("/", 1)[-1]
dept = [s for s, v in res.items() if len(v["bc"]) == 3]
sub = [s for s, v in res.items() if len(v["bc"]) == 4]
parent = {s: slug(res[s]["bc"][2][1]) for s in sub}
p2sub = collections.defaultdict(list); p2dept = collections.defaultdict(list)
for s in sub:
    for i in set(res[s]["ids"]) - set(vanliga): p2sub[i].append(s)
for d in dept:
    for i in set(res[d]["ids"]) - set(vanliga): p2dept[i].append(d)
prods = sorted(set(p2sub) | set(p2dept) | set(vanliga))
ovrigt = [f"o{i}" for i in range(16)]
BUTIK = [l.strip() for l in open(f"{H}/butik-underkat.txt") if l.strip()]
# Menyordningen, läst ur menypanelerna i förhandsbygget (samma ordning som bläddringsraden).
MENY = {l.strip(): i for i, l in enumerate(open(f"{H}/menyordning.txt")) if l.strip()}  # butik, blogg, auktion + sidfotens sidor
nodes = ["hem"] + [f"d:{d}" for d in dept] + [f"s:{s}" for s in sub] + [f"p:{p}" for p in prods] + ovrigt
ix = {n: i for i, n in enumerate(nodes)}
rng = random.Random(24)
related = {}
for p in prods:
    pool = sorted(set(i for s in p2sub.get(p, []) for i in res[s]["ids"]) - {p} - set(vanliga)) or \
           sorted(set(i for d in p2dept.get(p, []) for i in res[d]["ids"]) - {p} - set(vanliga))
    related[p] = rng.sample(pool, min(6, len(pool)))
def smalast(p):
    ss = [s for s in p2sub.get(p, []) if (res[s]["n"] or 0) >= 5]
    return min(ss, key=lambda s: (res[s]["n"], s)) if ss else None
def bygg(lage):
    nav = [ix[f"d:{d}"] for d in dept] + [ix[o] for o in ovrigt]
    if lage in ("C", "D"):
        nav += [ix[f"s:{s}"] for s in sub] + [ix[f"d:{d}"] for d in dept] * 2  # panelrubrik + "Se alla"
    ut = {}
    ut[ix["hem"]] = [ix[f"d:{d}"] for d in dept] + [ix[f"d:{d}"] for d in dept[:4]] + \
        [ix[f"p:{p}"] for p in prods[:12]]
    for d in dept:
        e = [ix["hem"], ix["o0"]] + [ix[f"d:{x}"] for x in dept if x != d] + \
            [ix[f"p:{i}"] for i in set(res[d]["ids"])]
        if lage == "A+": e += [ix[f"s:{s}"] for s in sub if parent[s] == d]
        if lage == "D":  # A–Ö-indexet bara för produkter utan underkategori, rutnätet (24) kvar
            ids = res[d]["ids"]
            behall = set(ids[:24]) | {i for i in ids if not p2sub.get(i)}
            e = [x for x in e if not nodes[x].startswith("p:") or nodes[x][2:] in behall]
        ut[ix[f"d:{d}"]] = e
    for s in sub:
        ut[ix[f"s:{s}"]] = [ix["hem"], ix["o0"], ix[f"d:{parent[s]}"]] + \
            [ix[f"d:{x}"] for x in dept if x != parent[s]] + [ix[f"p:{i}"] for i in set(res[s]["ids"])]
    for p in prods:
        dd = p2dept.get(p) or ([parent[p2sub[p][0]]] if p2sub.get(p) else [dept[0]])
        e = [ix["hem"], ix[f"d:{dd[0]}"]] + [ix[f"d:{x}"] for x in dept if x != dd[0]]
        if p2sub.get(p): e.append(ix[f"s:{min(p2sub[p], key=lambda s: MENY.get(s, 999))}"])  # bläddringsraden: första i menyordningen
        if lage in ("B", "C", "D") and smalast(p): e.append(ix[f"s:{smalast(p)}"])
        e += [ix[f"p:{r}"] for r in related[p]]
        ut[ix[f"p:{p}"]] = e
    for o in ovrigt: ut[ix[o]] = []
    # /butik (o0) länkar i server-HTML till underkategorierna i MAIN_GROUPS,
    # mätt i produktionen 2026-09-24 (butik-underkat.txt).
    ut[ix["o0"]] = [ix[f"s:{s}"] for s in BUTIK if f"s:{s}" in ix]
    return nav, ut
def pagerank(nav, ut, hemandel, d=0.85, varv=60):
    n = len(nodes)
    tele = [(1 - hemandel) / n] * n; tele[ix["hem"]] += hemandel
    pr = tele[:]
    for _ in range(varv):
        ny = [(1 - d) * t for t in tele]; navdel = 0.0
        for u in range(n):
            e = ut[u]; grad = len(e) + len(nav)
            del_ = d * pr[u] / grad
            for v in e: ny[v] += del_
            navdel += del_
        for v in nav: ny[v] += navdel
        pr = ny
    return pr
if __name__ == "__main__":
    print(f"{len(dept)} avdelningar, {len(sub)} underkategorier, {len(prods)} produkter, {len(nodes)} noder")
    for hemandel, namn in ((0.0, "jämn teleport"), (0.85, "externa länkar till startsidan")):
        print(f"\n== {namn} ==")
        bas = None; bas_p = None
        for lage in ("A", "A+", "B", "C", "D"):
            nav, ut = bygg(lage)
            pr = pagerank(nav, ut, hemandel)
            ps = [pr[ix[f"p:{p}"]] for p in prods]
            med_p = statistics.median(ps)
            ss = {s: pr[ix[f"s:{s}"]] for s in sub}
            dd = [pr[ix[f"d:{x}"]] for x in dept]
            tot = sum(pr)
            rad = (f"{lage:3} underkat median {statistics.median(ss.values())/med_p:6.1f}× produkt, "
                   f"andel {sum(ss.values())/tot*100:5.1f} %  | avdelning median {statistics.median(dd)/med_p:6.1f}× "
                   f"| produkter andel {sum(ps)/tot*100:5.1f} %")
            if bas is None: bas = ss; bas_p = med_p
            else: rad += (f" | underkat median {statistics.median(ss[s]/bas[s] for s in sub):5.2f}× läge A, "
                          f"medianprodukt {med_p/bas_p:4.2f}× läge A")
            print(rad)
            if lage == "A": a_med_p = med_p
            if lage == "C":
                for s in ("tv-bankar", "golvlampor", "byraer", "hantlar-hantelset", "massagebankar", "snurrfatoljer"):
                    if s in ss:
                        print(f"    {s:20} i dag {bas[s]/a_med_p:5.2f}× medianprodukt → {ss[s]/med_p:6.1f}× ({ss[s]/bas[s]:5.0f}× läge A)")
