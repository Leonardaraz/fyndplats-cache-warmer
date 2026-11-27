"""Hamtar produktsidor for kandidater ur auktionskon: namn, butikens pris, lagerstatus och huvudbild.

    python -m film.hamta_kandidater slug1 slug2 ...
Skriver assets/products/kandidater.json och laddar ner bilderna (mappen checkas inte in).
"""
from __future__ import annotations

import html as htmlmod
import json
import re
import sys

from .common import PRODUKTER
from .fetch_fynd import hamta


def las_sida(slug: str) -> dict | None:
    sida = hamta(f"https://www.fyndplats.se/produkt/{slug}").decode("utf-8", errors="replace")
    ut = {"slug": slug}
    for m in re.finditer(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', sida, re.S):
        try:
            d = json.loads(htmlmod.unescape(m.group(1)))
        except json.JSONDecodeError:
            continue
        for nod in d if isinstance(d, list) else [d]:
            if isinstance(nod, dict) and nod.get("@type") in ("Product", "ProductGroup"):
                ut["namn"] = nod.get("name")
                bild = nod.get("image")
                ut["bild"] = bild[0] if isinstance(bild, list) else bild
                erb = nod.get("offers") or {}
                if isinstance(erb, list):
                    erb = erb[0]
                ut["pris"] = erb.get("price") or erb.get("lowPrice")
                ut["hogsta_pris"] = erb.get("highPrice")
                ut["lager"] = str(erb.get("availability", "")).rsplit("/", 1)[-1]
    if "bild" not in ut:
        m = re.search(r'<meta property="og:image" content="([^"]+)"', sida)
        if m:
            ut["bild"] = htmlmod.unescape(m.group(1))
    return ut


def main() -> None:
    PRODUKTER.mkdir(parents=True, exist_ok=True)
    ut = []
    for slug in sys.argv[1:]:
        p = las_sida(slug)
        if p and p.get("bild"):
            m = re.match(r"(https://static\.wixstatic\.com/media/[^/]+)", p["bild"])
            stor = (m.group(1) + "/v1/fit/w_2000,h_2000,q_90/file.jpg") if m else p["bild"]
            fil = PRODUKTER / f"{slug}.jpg"
            if not fil.exists() or fil.stat().st_size < 2000:
                hamta(stor, fil)
            p["bild_stor"] = stor
        ut.append(p)
        print(f"{p.get('pris')!s:>7} {p.get('lager', '?'):<12} {slug}  |  {p.get('namn')}")
    (PRODUKTER / "kandidater.json").write_text(json.dumps(ut, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
