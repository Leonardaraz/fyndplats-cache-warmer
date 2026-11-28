"""Jamfor priserna i filmen med butikens priser och auktionens regler just nu.

Laser om varje varas produktsida (samma kalla som kunden ser) och jamfor med priset som
texturerna byggdes av. Skylten i trappan visar dessutom exempelvarans pris for varje timme:
de ska vara precis det auktionen ger med taket som galler i drift (lib/auction/engine.ts pa
origin/main), sa att filmen aldrig visar storre rabatt an en kund kan fa. Avslutar med
felkod 1 om nagot pris skiljer sig eller en vara inte gar att kopa, sa att den kan anvandas
fore leverans och fore publicering.

    python -m film.prisvakt
"""
from __future__ import annotations

import json
import sys

from .common import UT
from .hamta_kandidater import las_sida
from .prisstege import motorns_regler, timpriser
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
    # skyltens timpriser: de som texturerna byggdes av mot auktionens regler i drift och butikens pris nu
    fil = UT / "tex" / "skyltpriser.json"
    regler = motorns_regler()
    if fil.exists():
        skylt = json.loads(fil.read_text(encoding="utf-8"))
        ratt = timpriser(int(round(float(fynd[v["trappa"]]["pris"]))), regler)
        ok = skylt == ratt
        fel += 0 if ok else 1
        print(f"{'ok ' if ok else 'FEL'} skylten kl 07-15 {' '.join(map(str, skylt))} kr"
              f"  (auktionen med tak {regler['tak'] * 100:.0f} %: {' '.join(map(str, ratt))})")
    else:
        fel += 1
        print("FEL skyltens priser saknas (out/tex/skyltpriser.json): kor film.texturer")
    if fel:
        print(f"\n{fel} vara/varor stammer inte: byt vara eller uppdatera priset och rendera om de tagningar som visar den.")
        sys.exit(1)
    print("\nAlla priser i filmen ar butikens priser just nu.")


if __name__ == "__main__":
    main()
