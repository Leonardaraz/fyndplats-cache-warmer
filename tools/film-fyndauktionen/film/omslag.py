"""Omslagsbild (1080 x 1920) for Reels och TikTok: oppningens bild med varan och rubriken stor i overkanten.

Rubriken ligger innanfor 4:5- och 3:4-utsnittet (y 285-1635), sa att den syns aven i profilens rutnat,
och ovanfor brickan, sa att varan syns.

    python -m film.omslag                      # bada versionerna, ruta 50, kvalitet final
    python -m film.omslag --kvalitet utkast_nya --ruta 45
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

import cv2
import numpy as np

from .common import ROT, UT
from .comp import komponera, till_8bit

RADER = {
    "aret-runt": "Varje dag kl 07–19",
}

CSS = """
.ogon { font-family: 'Geist'; font-weight: 600; font-size: 34px; letter-spacing: .22em; text-transform: uppercase;
        color: #E9BE62; padding-left: .22em; white-space: nowrap; text-shadow: 0 1px 18px rgba(0,0,0,.7); }
.ogon .streck { display: inline-block; width: 52px; height: 2px; background: #E9BE62; vertical-align: middle; margin: 0 22px 7px; }
.h { font-family: 'Newsreader'; font-weight: 560; font-size: 128px; line-height: 1.02; letter-spacing: -.026em; color: #FBF6EC;
     white-space: nowrap; text-shadow: 0 3px 36px rgba(0,0,0,.65), 0 0 2px rgba(0,0,0,.4); }
.h em { font-style: italic; font-weight: 520; letter-spacing: -.02em; padding-right: .06em;
        background: linear-gradient(100deg, #F8E3AE 0%, #E9BE62 46%, #D9A53E 100%); -webkit-background-clip: text; background-clip: text;
        color: transparent; -webkit-text-fill-color: transparent; text-shadow: none; filter: drop-shadow(0 3px 22px rgba(0,0,0,.6)); }
.piller { display: inline-block; font-family: 'Geist'; font-weight: 600; font-size: 44px; letter-spacing: -.005em; color: #FBF6EC;
          padding: 16px 44px 18px; border-radius: 999px; border: 2.5px solid rgba(233,190,98,.92); background: rgba(8,6,4,.5);
          white-space: nowrap; text-shadow: 0 1px 14px rgba(0,0,0,.5); }
"""


def spec(variant: str) -> dict:
    html = f"""
      <div style="position:absolute;left:0;top:0;width:1080px;height:900px;
                  background:linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.38) 55%, rgba(0,0,0,0) 100%)"></div>
      <div style="position:absolute;left:0;top:300px;width:1080px;text-align:center">
        <div class="ogon">Fyndplats<span class="streck"></span>Fyndauktionen</div>
        <div class="h" style="margin-top:18px">Priset sjunker</div>
        <div class="h"><em>varje timme.</em></div>
      </div>
      <!-- pillret pa det morka sattsteget under varan: inte over varan, och innanfor 4:5-utsnittet (y 285-1635) -->
      <div style="position:absolute;left:0;top:1462px;width:1080px;text-align:center">
        <span class="piller">{RADER[variant]}</span>
      </div>
    """
    return {"id": f"omslag_{variant}", "w": 1080, "h": 1920, "html": html, "css": CSS}


def main(argv=None) -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ruta", type=int, default=50)
    ap.add_argument("--kvalitet", default="final")
    ap.add_argument("--ut", default=str(ROT / "leverans"))
    a = ap.parse_args(argv)
    mal = UT / "tex"
    mal.mkdir(parents=True, exist_ok=True)
    fil = mal / "omslag_spec.json"
    fil.write_text(json.dumps([spec(v) for v in RADER], ensure_ascii=False), encoding="utf-8")
    subprocess.run(["node", str(ROT / "titles" / "tex.js"), str(fil), str(mal)], check=True)
    bild = komponera(a.ruta, a.kvalitet, titlar=None)
    utmapp = Path(a.ut)
    utmapp.mkdir(parents=True, exist_ok=True)
    for v in RADER:
        ti = cv2.imread(str(mal / f"omslag_{v}.png"), cv2.IMREAD_UNCHANGED).astype(np.float32) / 255.0
        alfa = ti[..., 3:4]
        skarm = bild * (1 - alfa) + ti[..., 2::-1] * alfa
        ut = utmapp / "fyndplats-fyndauktionen-omslag.jpg"
        cv2.imwrite(str(ut), till_8bit(skarm, a.ruta)[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 95])
        print("omslag:", ut)


if __name__ == "__main__":
    main()
