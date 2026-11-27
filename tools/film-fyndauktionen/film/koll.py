"""Kontroll av den fardiga filmen: langd, bildrutor, flimmer och enstaka ljusa prickar.

    python -m film.koll leverans/fyndplats-black-friday-torsdag.mp4

Laser filmen i liten storlek via ffmpeg och letar efter rutor dar ljuset hoppar utan att nagot
hander i bilden (brus som inte togs bort, eller en ruta som saknas och blev svart).
"""
from __future__ import annotations

import json
import subprocess
import sys

import numpy as np

B, H = 270, 480


def las(fil: str) -> np.ndarray:
    ut = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", fil, "-vf", f"scale={B}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
                        check=True, capture_output=True).stdout
    return np.frombuffer(ut, dtype=np.uint8).reshape(-1, H, B).astype(np.float32) / 255.0


def main() -> None:
    fil = sys.argv[1]
    info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_name,width,height,r_frame_rate,nb_frames,pix_fmt,sample_rate,channels",
                                      "-of", "json", fil], check=True, capture_output=True).stdout)
    print("langd:", info["format"]["duration"], "s")
    for s in info["streams"]:
        print("  strom:", {k: v for k, v in s.items() if v not in (None, "0/0")})
    f = las(fil)
    n = len(f)
    medel = f.mean(axis=(1, 2))
    print(f"rutor: {n}   forsta rutans medelljus {medel[0]:.3f}   sista {medel[-1]:.3f}   morkaste {medel.min():.3f} (ruta {int(medel.argmin())})")
    # svarta rutor mitt i en ljus scen (saknad rendering)
    for i in range(1, n - 1):
        if medel[i] < 0.004 and medel[i - 1] > 0.02 and medel[i + 1] > 0.02:
            print(f"  VARNING: ruta {i} ar svart mellan tva ljusa rutor")
    # flimmer: ljuset i en ruta avviker fran bada grannarna at samma hall
    flimmer = []
    for i in range(1, n - 1):
        a, b, c = medel[i - 1], medel[i], medel[i + 1]
        avvik = min(b - a, b - c) if b > max(a, c) else min(a - b, c - b) if b < min(a, c) else 0.0
        if avvik > 0.012:
            flimmer.append((i, round(float(avvik), 4)))
    print("flimmer (ruta, avvikelse):", flimmer[:30] if flimmer else "inget over troskeln")
    # prickar: enstaka pixlar som blixtrar till i en enda ruta
    prickar = []
    for i in range(1, n - 1):
        d = f[i] - np.maximum(f[i - 1], f[i + 1])
        antal = int((d > 0.35).sum())
        if antal > 0:
            prickar.append((i, antal))
    mest = sorted(prickar, key=lambda p: -p[1])[:20]
    print("rutor med pixlar som blixtrar till (ruta, antal pixlar av %d):" % (B * H), mest if mest else "inga")


if __name__ == "__main__":
    main()
