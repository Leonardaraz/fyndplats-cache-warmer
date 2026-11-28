"""Hamtar fynden som butikens auktionssida visar just nu: namn, ordinarie pris och bild.

Kallan ar den publika sidan fyndplats.se/fyndauktion, alltsa samma uppgifter som kunden ser.
Stegen och golvet finns inte dar och hamtas aldrig. Resultatet sparas i assets/products/
(mappen checkas inte in).

    python -m film.fetch_fynd            # lista + bilder for alla fynd pa sidan
    python -m film.fetch_fynd --lista    # bara listan
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROT = Path(__file__).resolve().parent.parent
MAL = ROT / "assets" / "products"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
SIDA = "https://www.fyndplats.se/fyndauktion"


def hamta(url: str, mal: Path | None = None) -> bytes:
    cmd = ["curl", "-s", "-S", "-L", "-m", "60", "--retry", "2", "-A", UA, url]
    if mal is not None:
        cmd += ["-o", str(mal)]
    ut = subprocess.run(cmd, check=True, capture_output=True)
    return ut.stdout


def las_fynd(html: str) -> list[dict]:
    """Plockar auktionsraderna ur sidans inbaddade data (Next.js-flodet)."""
    text = html.replace('\\"', '"').replace("\\u0026", "&")
    fynd: dict[str, dict] = {}
    for m in re.finditer(r'\{"slug":"([^"]+)","name":"([^"]+)","img":"([^"]+)"', text):
        start = m.start()
        slut = text.find("}", start)
        bit = text[start : slut + 1]
        try:
            rad = json.loads(bit)
        except json.JSONDecodeError:
            continue
        if "listPrice" not in rad:
            continue
        fynd.setdefault(rad["slug"], rad)
    return sorted(fynd.values(), key=lambda r: (r.get("startAt", ""), r.get("slot", 0)))


def main() -> None:
    bara_lista = "--lista" in sys.argv
    MAL.mkdir(parents=True, exist_ok=True)
    html = hamta(SIDA).decode("utf-8", errors="replace")
    fynd = las_fynd(html)
    ut = []
    for rad in fynd:
        post = {
            "slug": rad["slug"],
            "namn": rad["name"],
            "pris": rad["listPrice"],
            "pris_text": rad.get("priceFormatted"),
            "pris_nu": rad.get("priceNum"),
            "start": rad.get("startAt"),
            "slot": rad.get("slot"),
            "i_lager": rad.get("inStock"),
            "bild": rad["img"],
            "bild2": rad.get("img2"),
        }
        ut.append(post)
    (MAL / "fynd.json").write_text(json.dumps(ut, ensure_ascii=False, indent=1), encoding="utf-8")
    starter = sorted({p["start"] for p in ut if p["start"]})
    print(f"{len(ut)} fynd, start: {starter}")
    if bara_lista:
        return
    for p in ut:
        fil = MAL / f"{p['slug']}.jpg"
        if not fil.exists() or fil.stat().st_size < 2000:
            hamta(p["bild"], fil)
    print("bilder klara:", len(list(MAL.glob("*.jpg"))))


if __name__ == "__main__":
    main()
