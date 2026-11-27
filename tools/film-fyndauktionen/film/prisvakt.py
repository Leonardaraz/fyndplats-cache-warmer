"""Jamfor priserna i filmen med butikens priser just nu.

Laser om varje varas produktsida (samma kalla som kunden ser) och jamfor med priset som
texturerna byggdes av. Avslutar med felkod 1 om nagot pris skiljer sig eller en vara inte
gar att kopa, sa att den kan anvandas fore leverans och fore publicering.

    python -m film.prisvakt
"""
from __future__ import annotations

import sys

from .hamta_kandidater import las_sida
from .texturer import pris_text, val, varor


def main() -> None:
    v = val()
    fynd = varor()
    platser = [("trappa", v["trappa"])] + [(f"hall {n + 1}", h) for n, h in enumerate(v["hall"])]
    fel = 0
    for plats, slug in platser:
        i_filmen = fynd[slug]
        film_kr = int(round(float(i_filmen["pris"])))
        nu = las_sida(slug)
        nu_kr = int(round(float(nu.get("pris") or 0))) if nu else 0
        hogsta = nu.get("hogsta_pris") if nu else None
        ok = nu_kr == film_kr and nu.get("lager") == "InStock" and not (hogsta and float(hogsta) != float(nu_kr))
        fel += 0 if ok else 1
        tecken = "ok " if ok else "FEL"
        extra = "" if not hogsta or float(hogsta) == float(nu_kr) else f" (varianter upp till {hogsta} kr)"
        print(f"{tecken} {plats:7} filmen {pris_text(i_filmen):>9}  butiken {nu_kr:>5} kr  {nu.get('lager', '?'):<10} {slug}{extra}")
    if fel:
        print(f"\n{fel} vara/varor stammer inte: byt vara eller uppdatera priset och rendera om de tagningar som visar den.")
        sys.exit(1)
    print("\nAlla priser i filmen ar butikens priser just nu.")


if __name__ == "__main__":
    main()
