"""Hamtar allt en 3D-modell behover ur butiken: namn, pris, lager, alla produktbilder och mattraderna.

    python -m film.varudata slug1 slug2 ...

Skriver assets/products/varor.json och laddar ner bilderna till assets/products/<slug>/01.jpg ...
(mappen checkas inte in). Mattraderna ("Matt (B x D x H): 67 x 83 x 105 cm", "Material: ...") ar de
som produktsidan visar, sa att modellen far varans riktiga storlek och material.
"""
from __future__ import annotations

import html as htmlmod
import json
import re
import sys

from .common import PRODUKTER
from .fetch_fynd import hamta
from .hamta_kandidater import las_sida

SPEC = re.compile(r"^(Mått|Sits|Rygg|Armstöd|Skiva|Bord|Ben|Höjd|Bredd|Djup|Diameter|Ø|Material|Färg|Vikt|Lampa|Ljus|"
                  r"Skärm|Fot|Sladd|Sitthöjd|Sittyta|Innermått|Yttermått|Storlek)[^:]{0,40}:", re.I)


def _rader(sida: str) -> list[str]:
    s = re.sub(r"<script.*?</script>|<style.*?</style>", " ", sida, flags=re.S)
    t = htmlmod.unescape(re.sub(r"<[^>]+>", "\n", s))
    return [r.strip() for r in t.split("\n") if r.strip()]


def _bilder(sida: str) -> list[str]:
    for m in re.finditer(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', sida, re.S):
        try:
            d = json.loads(htmlmod.unescape(m.group(1)))
        except json.JSONDecodeError:
            continue
        for nod in d if isinstance(d, list) else [d]:
            if isinstance(nod, dict) and nod.get("@type") in ("Product", "ProductGroup"):
                b = nod.get("image") or []
                return b if isinstance(b, list) else [b]
    return []


def main() -> None:
    PRODUKTER.mkdir(parents=True, exist_ok=True)
    fil = PRODUKTER / "varor.json"
    varor = json.loads(fil.read_text(encoding="utf-8")) if fil.exists() else {}
    for slug in sys.argv[1:]:
        p = las_sida(slug) or {"slug": slug}
        sida = hamta(f"https://www.fyndplats.se/produkt/{slug}").decode("utf-8", errors="replace")
        rader = _rader(sida)
        spec, sedda = [], set()
        for i, r in enumerate(rader):
            rad = r
            # etiketten och vardet kan sta i var sitt element: "Matt:" och sedan "134 x 25 cm"
            if SPEC.match(r) and r.endswith(":") and i + 1 < len(rader):
                rad = f"{r} {rader[i + 1]}"
            # matt utan etikett: "112 x 60 x 92 cm"
            elif not SPEC.match(r) and re.search(r"\d\s*[×x]\s*\d.*\bcm\b", r) and len(r) < 90:
                rad = r
            elif not SPEC.match(r):
                continue
            if len(rad) < 200 and rad not in sedda:
                spec.append(rad)
                sedda.add(rad)
        mapp = PRODUKTER / slug
        mapp.mkdir(exist_ok=True)
        bilder = []
        for i, url in enumerate(_bilder(sida), 1):
            m = re.match(r"(https://static\.wixstatic\.com/media/[^/]+)", url)
            stor = (m.group(1) + "/v1/fit/w_2000,h_2000,q_90/file.jpg") if m else url
            ut = mapp / f"{i:02d}.jpg"
            if not ut.exists() or ut.stat().st_size < 2000:
                hamta(stor, ut)
            bilder.append(str(ut.relative_to(PRODUKTER)))
        p.update({"spec": spec, "bilder": bilder})
        varor[slug] = p
        print(f"{p.get('pris')!s:>7} {p.get('lager', '?'):<10} {len(bilder)} bilder  {slug}")
        for r in spec:
            print("         ", r)
    fil.write_text(json.dumps(varor, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
