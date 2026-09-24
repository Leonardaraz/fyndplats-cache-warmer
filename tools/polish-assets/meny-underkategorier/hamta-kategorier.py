#!/usr/bin/env python3
"""Kategorisidornas produktlänkar, för PageRank-modellen (pagerank.py).
Argument: <bas-url> [utfil]. Läser sitemapen, hämtar varje /kategori/-sida och
sparar {slug: {bc, ids, n, status}}: brödsmulan ur BreadcrumbList, produkt-id:n
ur sidans produktlista och antalet ur hjälterubriken ("14 produkter –")."""
import json, re, subprocess, sys
bas = sys.argv[1].rstrip("/")
ut = sys.argv[2] if len(sys.argv) > 2 else "kategorier.json"
def hamta(url):
    r = subprocess.run(["curl", "-sS", "--compressed", "--max-time", "90", "-w", "\n%{http_code}", url], capture_output=True)
    body, _, kod = r.stdout.rpartition(b"\n")
    return kod.decode(), body.decode("utf8", "replace")
_, karta = hamta(f"{bas}/sitemap.xml")
slugs = sorted(set(re.findall(r"/kategori/([a-z0-9-]+)</loc>", karta)))
res = {}
for s in slugs:
    kod, t = hamta(f"{bas}/kategori/{s}")
    bc = None
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', t, re.S):
        try:
            d = json.loads(m.group(1))
        except ValueError:
            continue
        if isinstance(d, dict) and d.get("@type") == "BreadcrumbList":
            bc = [[e["name"], e["item"]] for e in d["itemListElement"]]
    ids = sorted(set(re.findall(r'\\"id\\":\\"([0-9a-f-]{36})\\",\\"slug\\":\\"[^"\\]+\\"', t)))
    n = re.search(r"(\d[\d\s ]*) produkter? –", t)
    res[s] = {"bc": bc, "ids": ids, "n": int(re.sub(r"\D", "", n.group(1))) if n else None, "status": kod}
    print(f"{kod} {s} {len(ids)} id, n={res[s]['n']}", file=sys.stderr)
json.dump(res, open(ut, "w"), ensure_ascii=False)
print(f"{len(res)} kategorisidor → {ut}")
