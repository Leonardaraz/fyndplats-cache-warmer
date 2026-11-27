"""Sammansattning: EXR fran Cycles -> fardiga bildrutor.

Ordning: ljuskagla (volympass) + guldstoft laggs pa i linjart ljus, sedan glod, tonmappning,
fargsattning, texter, korn och 8-bitars utdata med raster.

    python -m film.comp still --tagning A --ruta 0 --kvalitet prov
"""
from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np
import OpenEXR

from .common import BREDD, HOJD, TAGNINGAR, UT, blanda, led, mjuk, mjukare

cv2.setNumThreads(4)


# ------------------------------------------------------------------ in
def las_exr(sokvag: Path) -> dict[str, np.ndarray]:
    f = OpenEXR.File(str(sokvag))
    ut: dict[str, np.ndarray] = {}
    for del_ in f.parts:
        for namn, kanal in del_.channels.items():
            kort = namn.split(".", 1)[1] if "." in namn else namn
            ut[kort] = np.asarray(kanal.pixels)
    return ut


def las_bild(mapp: Path, f: int) -> dict[str, np.ndarray]:
    d = las_exr(mapp / f"bild_{f:04d}.exr")
    rgb = d["Combined"][..., :3].astype(np.float32)
    rgb = np.nan_to_num(rgb, nan=0.0, posinf=64.0, neginf=0.0)
    ut = {"rgb": np.minimum(rgb, 64.0)}
    if "Position.X" in d:
        ut["pos"] = np.dstack([d["Position.X"], d["Position.Y"], d["Position.Z"]]).astype(np.float32)
    if "Depth.Z" in d:
        ut["z"] = d["Depth.Z"].astype(np.float32)
    vol = mapp / f"vol_{f:04d}.exr"
    if vol.exists():
        v = las_exr(vol)["Combined"][..., :3].astype(np.float32)
        ut["vol"] = np.nan_to_num(v, nan=0.0, posinf=8.0, neginf=0.0)
    return ut


# ------------------------------------------------------------------ farg
AGX_IN = np.array([[0.842479062253094, 0.0784335999999992, 0.0792237451477643],
                   [0.0423282422610123, 0.878468636469772, 0.0791661274605434],
                   [0.0423756549057051, 0.0784336, 0.879142973793104]], dtype=np.float32)
AGX_UT = np.array([[1.19687900512017, -0.0980208811401368, -0.0990297440797205],
                   [-0.0528968517574562, 1.15190312990417, -0.0989611768448433],
                   [-0.0529716355144438, -0.0980434501171241, 1.15107367264116]], dtype=np.float32)
AGX_MIN_EV, AGX_MAX_EV = -12.47393, 4.026069
LUMA = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)


def agx(rgb: np.ndarray, kontrast: float = 1.0, mattnad: float = 1.0) -> np.ndarray:
    """AgX-tonmappning (linjart ljus -> skarmvarden 0..1). Haller fargtonen i starka ljus."""
    v = rgb @ AGX_IN.T
    v = np.clip(np.log2(np.maximum(v, 1e-10)), AGX_MIN_EV, AGX_MAX_EV)
    v = (v - AGX_MIN_EV) / (AGX_MAX_EV - AGX_MIN_EV)
    x2 = v * v
    x4 = x2 * x2
    v = 15.5 * x4 * x2 - 40.14 * x4 * v + 31.96 * x4 - 6.868 * x2 * v + 0.4298 * x2 + 0.1191 * v - 0.00232
    if kontrast != 1.0 or mattnad != 1.0:
        v = np.clip(v, 0, None)
        luma = (v @ LUMA)[..., None]
        v = np.power(v, kontrast)
        luma2 = (v @ LUMA)[..., None]
        v = luma2 + mattnad * (v - luma2)
    v = v @ AGX_UT.T
    return np.clip(v, 0.0, 1.0)


def neutral(rgb: np.ndarray) -> np.ndarray:
    """Khronos PBR Neutral: farger under hogdagrarna behalls som de ar, starka ljus rullas mjukt av mot vitt.

    Darfor ser produktfoton och loggans orange ut som i butiken. Ger linjara skarmvarden 0..1.
    """
    start = 0.8 - 0.04
    avmattning = 0.15
    x = rgb.min(axis=2, keepdims=True)
    offset = np.where(x < 0.08, x - 6.25 * x * x, 0.04)
    c = rgb - offset
    topp = c.max(axis=2, keepdims=True)
    d = 1.0 - start
    ny_topp = 1.0 - d * d / (np.maximum(topp, start) + d - start)
    skala = np.where(topp > start, ny_topp / np.maximum(topp, 1e-6), 1.0)
    c2 = c * skala
    g = 1.0 - 1.0 / (avmattning * (np.maximum(topp, start) - ny_topp) + 1.0)
    g = np.where(topp > start, g, 0.0)
    ut = c2 * (1 - g) + ny_topp * g
    return np.clip(np.where(topp > start, ut, c), 0.0, 1.0)


def srgb_oetf(lin: np.ndarray) -> np.ndarray:
    lin = np.clip(lin, 0.0, 1.0)
    return np.where(lin <= 0.0031308, lin * 12.92, 1.055 * np.power(lin, 1 / 2.4) - 0.055)


def filmkurva(skarm: np.ndarray, kontrast: float = 1.0, mattnad: float = 1.0, svarta: float = 0.0) -> np.ndarray:
    """Liten S-kurva och mattnad pa skarmvarden (efter tonmappningen)."""
    v = skarm
    if svarta:
        v = np.clip((v - svarta) / (1 - svarta), 0, 1)
    if kontrast != 1.0:
        mitt = 0.42
        v = np.where(v < mitt, mitt * np.power(np.maximum(v, 0) / mitt, kontrast),
                     1 - (1 - mitt) * np.power(np.maximum(1 - v, 0) / (1 - mitt), kontrast))
    if mattnad != 1.0:
        luma = (v @ LUMA)[..., None]
        v = luma + mattnad * (v - luma)
    return np.clip(v, 0, 1)


# ------------------------------------------------------------------ effekter
def glod(rgb: np.ndarray, styrka: float = 0.10, troskel: float = 1.0, steg: int = 6) -> np.ndarray:
    """Mjuk glod kring starka ljus: en pyramid av oskarpa kopior laggs tillbaka pa bilden."""
    ljus = np.maximum(rgb - troskel, 0.0)
    ljus = ljus / (1.0 + ljus * 0.02)
    summa = np.zeros_like(rgb)
    niva = ljus
    vikter = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4][:steg]
    h, w = rgb.shape[:2]
    for i, vikt in enumerate(vikter):
        niva = cv2.resize(niva, (max(1, niva.shape[1] // 2), max(1, niva.shape[0] // 2)), interpolation=cv2.INTER_AREA)
        suddig = cv2.GaussianBlur(niva, (0, 0), 2.2)
        summa += cv2.resize(suddig, (w, h), interpolation=cv2.INTER_CUBIC) * vikt
    return rgb + summa * (styrka / sum(vikter)) * len(vikter) * 0.5


def vinjett(h: int, w: int, styrka: float = 0.35) -> np.ndarray:
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((x - w / 2) / (w * 0.85)) ** 2 + ((y - h / 2) / (h * 0.75)) ** 2)
    return (1.0 - styrka * np.clip(r, 0, 1.4) ** 2.2)[..., None].astype(np.float32)


def sammansatt(lager: dict[str, np.ndarray], exponering: float = 1.0, glodstyrka: float = 0.12,
               volymstyrka: float = 1.0, kontrast: float = 1.10, mattnad: float = 1.06,
               full: bool = True, ton: str = "neutral") -> np.ndarray:
    rgb = lager["rgb"]
    h, w = rgb.shape[:2]
    if full and (w, h) != (BREDD, HOJD):
        rgb = cv2.resize(rgb, (BREDD, HOJD), interpolation=cv2.INTER_LANCZOS4)
        h, w = HOJD, BREDD
    rgb = np.maximum(rgb, 0.0)
    if "vol" in lager and volymstyrka > 0:
        v = cv2.resize(lager["vol"], (w, h), interpolation=cv2.INTER_CUBIC)
        v = cv2.GaussianBlur(np.maximum(v, 0), (0, 0), w / 540.0)
        rgb = rgb + v * volymstyrka
    rgb = rgb * exponering
    rgb = glod(rgb, glodstyrka)
    rgb = rgb * vinjett(h, w)
    if ton == "agx":
        return agx(rgb, kontrast, mattnad)
    return filmkurva(srgb_oetf(neutral(rgb)), kontrast, mattnad)


def spara_png(skarm: np.ndarray, sokvag: Path, fro: int = 0) -> None:
    sokvag.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(sokvag), till_8bit(skarm, fro)[..., ::-1])


def till_8bit(skarm: np.ndarray, fro: int = 0) -> np.ndarray:
    """Skarmvarden 0..1 -> 8 bitar RGB, med raster sa att morka toningar inte far rander."""
    rng = np.random.default_rng(fro)
    raster = (rng.random(skarm.shape[:2] + (1,), dtype=np.float32) - 0.5) / 255.0
    return (np.clip(skarm + raster, 0, 1) * 255.0 + 0.5).astype(np.uint8)


# ------------------------------------------------------------------ hela bildrutan
# Fargsattning per tagning: exponering, hur starkt ljuskaglan och stoftet syns, glod.
GRAD = {
    "A": {"exponering": 1.0, "volym": 2.6, "stoft": 1.0, "glod": 0.15},
    "B": {"exponering": 1.0, "volym": 2.0, "stoft": 1.0, "glod": 0.15},
    "C": {"exponering": 1.0, "volym": 1.7, "stoft": 1.0, "glod": 0.13},
    "D": {"exponering": 1.0, "volym": 1.0, "stoft": 1.0, "glod": 0.13},
    "E": {"exponering": 1.0, "volym": 2.2, "stoft": 1.0, "glod": 0.15},
}
_stoft: dict = {}
_kamfn: dict = {}


# Visningsrummet (C) far ett lyft: mest i vidbilden, lite i narbilderna. Det gar tillbaka till 1,0 nar
# glasskivan reser sig (17,6-18,3 s), sa att overgangen till glasskivan (D, samma kameraakning) blir mjuk.
RUM_LYFT = {"vid": 1.30, "nara": 1.10}


def exponering(tagning: str, t: float) -> float:
    e = GRAD[tagning]["exponering"]
    if tagning in ("C", "D"):
        from .hall import NER
        lyft = blanda(RUM_LYFT["vid"], RUM_LYFT["nara"], mjukare(led(t, *NER)))
        e *= blanda(lyft, 1.0, mjuk(led(t, 17.6, 18.3)))
    return e


def tagning_for(f: int) -> str:
    for namn, info in TAGNINGAR.items():
        if info["rutor"][0] <= f <= info["rutor"][1]:
            return namn
    raise ValueError(f)


def _kamera(tagning: str, t: float) -> dict:
    if not _kamfn:
        from . import hall, trappa
        _kamfn.update({"A": trappa.kam_A, "B": trappa.kam_B, **hall.KAMEROR})
    return _kamfn[tagning](t)


def _stoftlager(tagning: str, t: float, w: int, h: int, lager: dict, styrka: float) -> np.ndarray:
    from .stoft import Stoft
    uppsattning = TAGNINGAR[tagning]["set"]
    if uppsattning not in _stoft:
        _stoft[uppsattning] = Stoft(uppsattning)
    return _stoft[uppsattning].lager(t, _kamera(tagning, t), w, h, lager.get("pos"), lager.get("z"), styrka)


def korn(h: int, w: int, fro: int, styrka: float = 0.011) -> np.ndarray:
    rng = np.random.default_rng(1000 + fro)
    g = rng.standard_normal((h, w), dtype=np.float32)
    g = cv2.GaussianBlur(g, (0, 0), 0.55) * 1.6
    return (g * styrka)[..., None]


SLINGA = (738, 749)   # de sista rutorna tonar over till forsta rutan, sa att filmen loopar somlost i apparna


def komponera(f: int, kvalitet: str, skala: float = 1.0, titlar: Path | None = None, stoft: bool = True,
              med_korn: bool = True, ton: str = "neutral", slinga: bool = True) -> np.ndarray:
    """En fardig bildruta som skarmvarden 0..1 (RGB)."""
    if slinga and f >= SLINGA[0]:
        k = (f - SLINGA[0] + 1) / (SLINGA[1] - SLINGA[0] + 1)
        w = k * k * (3 - 2 * k)
        slut = komponera(f, kvalitet, skala, titlar, stoft, med_korn, ton, slinga=False)
        borjan = komponera(0, kvalitet, skala, titlar, stoft, med_korn, ton, slinga=False)
        return np.clip(slut * (1 - w) + borjan * w, 0, 1)
    tagning = tagning_for(f)
    g = GRAD[tagning]
    t = f / 30.0
    # kvalitet kan vara flera nivaer, "final,skiss": den forsta som har rutan anvands
    lager = None
    for kv in kvalitet.split(","):
        mapp = UT / "exr" / kv / tagning
        fil = mapp / f"bild_{f:04d}.exr"
        if fil.exists() and fil.stat().st_size > 0:
            try:
                lager = las_bild(mapp, f)
                break
            except Exception:
                continue
    if lager is None:
        raise FileNotFoundError(f"ingen rendering for ruta {f}")
    w, h = int(round(BREDD * skala)), int(round(HOJD * skala))
    rgb = lager["rgb"]
    if rgb.shape[1] != w:
        rgb = cv2.resize(rgb, (w, h), interpolation=cv2.INTER_LANCZOS4 if rgb.shape[1] < w else cv2.INTER_AREA)
    rgb = np.maximum(rgb, 0.0)
    if "vol" in lager and g["volym"] > 0:
        v = cv2.resize(lager["vol"], (w, h), interpolation=cv2.INTER_CUBIC)
        v = cv2.GaussianBlur(np.maximum(v, 0), (0, 0), w / 400.0)
        rgb = rgb + v * g["volym"]
    if stoft and g["stoft"] > 0:
        rgb = rgb + _stoftlager(tagning, t, w, h, lager, g["stoft"])
    rgb = rgb * exponering(tagning, t)
    rgb = glod(rgb, g["glod"])
    rgb = rgb * vinjett(h, w)
    skarm = agx(rgb) if ton == "agx" else filmkurva(srgb_oetf(neutral(rgb)), 1.10, 1.06)
    # kornet laggs i bilden fore texterna: texten ska vara skarp och ren, som i en riktig efterbearbetning
    if med_korn:
        skarm = skarm + korn(h, w, f) * (0.35 + 0.65 * (1 - np.clip(skarm @ LUMA, 0, 1))[..., None])
    if titlar is not None:
        fil = titlar / f"t_{f:04d}.png"
        if fil.exists():
            ti = cv2.imread(str(fil), cv2.IMREAD_UNCHANGED)
            if ti is not None and ti.shape[2] == 4 and ti[..., 3].any():
                if ti.shape[1] != w:
                    ti = cv2.resize(ti, (w, h), interpolation=cv2.INTER_AREA)
                tf = ti.astype(np.float32) / 255.0
                alfa = tf[..., 3:4]
                farg = tf[..., 2::-1]
                ljus = farg * alfa * (farg.max(axis=2, keepdims=True) > 0.25)
                sken = cv2.GaussianBlur(ljus, (0, 0), 16 * skala) * 0.30
                skarm = skarm * (1 - alfa) + farg * alfa
                skarm = 1 - (1 - skarm) * (1 - np.clip(sken, 0, 1))
    return np.clip(skarm, 0, 1)


def _arbeta(arg):
    f, kvalitet, skala, titlar, ton = arg
    try:
        bild = komponera(f, kvalitet, skala, Path(titlar) if titlar else None, ton=ton)
    except FileNotFoundError:
        w, h = int(round(BREDD * skala)), int(round(HOJD * skala))
        bild = np.zeros((h, w, 3), dtype=np.float32)
    return f, till_8bit(bild, f).tobytes()


def tolka_rutor(text: str) -> list[int]:
    """'0-359,630-749' -> [0, 1, ..., 359, 630, ..., 749]"""
    ut: list[int] = []
    for del_ in text.split(","):
        a, _, b = del_.strip().partition("-")
        ut.extend(range(int(a), int(b or a) + 1))
    return ut


# Kortversionen (16 s): trappan och narbilden, sedan kuben. Ljudet till den ar `film.audio --kort`.
KORTVERSION = "0-359,630-749"


def gor_film(kvalitet: str, mal: Path, skala: float = 1.0, fran: int = 0, till: int = 749, titlar: Path | None = None,
             ljud: Path | None = None, crf: int = 14, ton: str = "neutral", arbetare: int = 4,
             rutor: list[int] | None = None) -> None:
    """rutor: en egen ordning av bildrutor (kortversionen). Ljudet ska da vara gjort for just den ordningen."""
    import subprocess
    from multiprocessing import Pool
    w, h = int(round(BREDD * skala)), int(round(HOJD * skala))
    w -= w % 2
    h -= h % 2
    mal.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-r", "30", "-i", "-"]
    if ljud is not None:
        cmd += ["-ss", f"{(0 if rutor else fran) / 30:.4f}", "-i", str(ljud)]
    cmd += ["-vf", "scale=out_color_matrix=bt709:out_range=tv", "-c:v", "libx264", "-preset", "slow", "-crf", str(crf),
            "-maxrate", "16M", "-bufsize", "32M", "-profile:v", "high", "-level:v", "4.2", "-g", "30", "-keyint_min", "30",
            "-sc_threshold", "0", "-bf", "2", "-pix_fmt", "yuv420p",
            "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv", "-movflags", "+faststart"]
    if ljud is not None:
        cmd += ["-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-shortest"]
    cmd += [str(mal)]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    ordning = rutor if rutor else list(range(fran, till + 1))
    uppgifter = [(f, kvalitet, skala, str(titlar) if titlar else None, ton) for f in ordning]
    with Pool(arbetare) as pool:
        for f, data in pool.imap(_arbeta, uppgifter, chunksize=4):
            ff.stdin.write(data)
    ff.stdin.close()
    ff.wait()
    print(f"film klar: {mal} ({len(ordning)} rutor, {w}x{h})")


def main(argv=None) -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("lage", choices=["still", "film"])
    ap.add_argument("--tagning", default=None)
    ap.add_argument("--ruta", type=int, default=None)
    ap.add_argument("--kvalitet", default="prov")
    ap.add_argument("--ut", default=None)
    ap.add_argument("--ton", default="neutral")
    ap.add_argument("--skala", type=float, default=1.0)
    ap.add_argument("--fran", type=int, default=0)
    ap.add_argument("--till", type=int, default=749)
    ap.add_argument("--titlar", default=None, help="mapp med t_####.png")
    ap.add_argument("--ljud", default=None)
    ap.add_argument("--crf", type=int, default=14)
    ap.add_argument("--utan-stoft", action="store_true")
    ap.add_argument("--rutor", default=None, help=f"egen ordning av rutor, t.ex. kortversionen {KORTVERSION}")
    a = ap.parse_args(argv)
    titlar = Path(a.titlar) if a.titlar else None
    if a.lage == "still":
        f = a.ruta if a.ruta is not None else TAGNINGAR[a.tagning]["rutor"][0]
        skarm = komponera(f, a.kvalitet, a.skala, titlar, stoft=not a.utan_stoft, ton=a.ton)
        tag = tagning_for(f)
        mal = Path(a.ut) if a.ut else UT / "still" / f"{tag}_{f:04d}_{a.kvalitet}.png"
        spara_png(skarm, mal, f)
        print(f"sparad {mal}")
    else:
        gor_film(a.kvalitet, Path(a.ut) if a.ut else UT / f"film_{a.kvalitet}.mp4", a.skala, a.fran, a.till, titlar,
                 Path(a.ljud) if a.ljud else None, a.crf, a.ton, rutor=tolka_rutor(a.rutor) if a.rutor else None)


if __name__ == "__main__":
    main()
