"""Exempelvarans timpriser i trappan, raknade som auktionen raknar dem.

Formeln ar densamma som i auktionsmotorn (`lib/auction/engine.ts`): `up9`, rabattgolvet i `buildFloor`
och `buildLadder`. Taket (`MAX_DISCOUNT`) och antalet sanksteg lases ur motorns egen fil, sa att filmen
aldrig visar storre rabatt an auktionen ger. Motorn har dessutom ett marginalgolv ur inkopspriset, som kan
gora en varas stege grundare. Darfor stams filmens priser av mot varans egen stege i auktionens ko innan
de renderas (fatoljen 2026-11-27: kl 07-15 identiska).

Filmen visar bara timmarna 07-15. Golvet kl 18 visas aldrig.

    python -m film.prisstege            # skriver ut exempelvarans timpriser
"""
from __future__ import annotations

import math
import re
import subprocess

from .common import ROT

MOTOR = ROT.parents[1] / "lib" / "auction" / "engine.ts"
TIMMAR = 9          # 07, 08 ... 15: varan kliver atta steg i trappan (trappa.ANTAL_KLIV + 1)


def _motorns_kalla(fran_main: bool = True) -> str:
    """Motorns kallkod. I forsta hand som den ar pa origin/main, alltsa det som galler i drift."""
    if fran_main:
        try:
            subprocess.run(["git", "-C", str(ROT), "fetch", "-q", "origin", "main"], check=True, timeout=60,
                           capture_output=True)
            ut = subprocess.run(["git", "-C", str(ROT), "show", "origin/main:lib/auction/engine.ts"], check=True,
                                capture_output=True, text=True, timeout=30)
            return ut.stdout
        except Exception:
            pass
    return MOTOR.read_text(encoding="utf-8")


def motorns_regler(fran_main: bool = True) -> dict:
    """Taket och antalet sanksteg, lasta ur motorn."""
    kalla = _motorns_kalla(fran_main)
    tak = re.search(r"export const MAX_DISCOUNT\s*=\s*([0-9.]+)", kalla)
    timmar = re.search(r"export const AUCTION_DAY_HOURS\s*=\s*([0-9]+)", kalla)
    if not tak or not timmar:
        raise RuntimeError("hittar inte MAX_DISCOUNT eller AUCTION_DAY_HOURS i lib/auction/engine.ts")
    return {"tak": float(tak.group(1)), "steg": int(timmar.group(1)) - 1}


def up9(n: float) -> int:
    """Avrunda uppat till narmaste heltal som slutar pa 9 (butikens prisregel)."""
    v = math.ceil(n)
    while v % 10 != 9:
        v += 1
    return v


def rabattgolv(listpris: int, tak: float) -> int:
    return min(up9(listpris * (1 - tak)), listpris)


def stege(listpris: int, golv: int, steg: int) -> list[int]:
    """Som buildLadder: [0] = listpriset kl 07, [steg] = golvet kl 18, 9-slut och aldrig stigande."""
    golv = min(golv, listpris)
    ut = [listpris]
    for i in range(1, steg + 1):
        ra = listpris - (listpris - golv) * i / steg
        ut.append(max(min(up9(ra), ut[i - 1]), golv))
    ut[steg] = golv
    return ut


def timpriser(listpris: int, regler: dict | None = None) -> list[int]:
    """Priset kl 07, 08 ... 15 for en vara med det har listpriset, med motorns tak."""
    r = regler or motorns_regler()
    return stege(listpris, rabattgolv(listpris, r["tak"]), r["steg"])[:TIMMAR]


def main() -> None:
    from .texturer import val, varor
    r = motorns_regler()
    p = varor()[val()["trappa"]]
    lista = int(round(float(p["pris"])))
    print(f"tak {r['tak'] * 100:.0f} %, {r['steg']} sanksteg")
    for h, kr in zip(range(7, 7 + TIMMAR), timpriser(lista, r)):
        print(f"  kl {h:02d}  {kr} kr")


if __name__ == "__main__":
    main()
