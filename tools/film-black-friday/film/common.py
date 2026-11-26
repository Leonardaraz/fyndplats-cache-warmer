"""Gemensamma tal for hela filmen: tid, format, farger och rorelsekurvor."""
from __future__ import annotations

import math
from pathlib import Path

ROT = Path(__file__).resolve().parent.parent
ASSETS = ROT / "assets"
FONTS = ASSETS / "fonts"
PRODUKTER = ASSETS / "products"
UT = ROT / "out"

FPS = 30
BREDD, HOJD = 1080, 1920
LANGD = 25.0
ANTAL_RUTOR = int(LANGD * FPS)  # 750
TAKT = 0.5  # 120 slag i minuten

# Scenernas granser i sekunder (bildmanuset)
SCENER = {
    "s1": (0.0, 2.5),
    "s2": (2.5, 8.5),
    "s3": (8.5, 12.0),
    "s4": (12.0, 18.0),
    "s5": (18.0, 21.0),
    "s6": (21.0, 25.0),
}

# Tagningar: en kamera per tagning. Rutor ar [forsta, sista] inklusive.
TAGNINGAR = {
    "A": {"set": "trappa", "rutor": (0, 254)},     # scen 1 + 2: ljuset tands, trappan
    "B": {"set": "trappa", "rutor": (255, 359)},   # scen 3: vagar du vanta
    "C": {"set": "hall", "rutor": (360, 539)},     # scen 4: hundra fynd
    "D": {"set": "hall", "rutor": (540, 629)},     # scen 5: tryggt kop
    "E": {"set": "hall", "rutor": (630, 749)},     # scen 6: kuben
}


def ruta(t: float) -> int:
    return int(round(t * FPS))


def tid(f: float) -> float:
    return f / FPS


# ---- farger (sRGB-hex ur butikens Black Friday-tema och loggan) ----
SVART = "#050505"
GULD = "#D9A53E"
GULD_LJUS = "#F5DA98"
KRAM = "#FBF6EC"
ORANGE = "#FE6D22"
KUB_TOPP = ("#FC7E26", "#FF9838")
KUB_VANSTER = ("#FF4210", "#FA3A0B")
KUB_HOGER = ("#FF852B", "#FF6B1E")


def hex_srgb(h: str) -> tuple[float, float, float]:
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) / 255.0 for i in (0, 2, 4))  # type: ignore[return-value]


def srgb_till_linjar(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_lin(h: str) -> tuple[float, float, float]:
    return tuple(srgb_till_linjar(c) for c in hex_srgb(h))  # type: ignore[return-value]


# ---- rorelsekurvor ----
def kl(x: float, a: float = 0.0, b: float = 1.0) -> float:
    return a if x < a else b if x > b else x


def led(t: float, t0: float, t1: float) -> float:
    """0..1 mellan t0 och t1, klamrad."""
    if t1 <= t0:
        return 1.0 if t >= t1 else 0.0
    return kl((t - t0) / (t1 - t0))


def mjuk(x: float) -> float:
    x = kl(x)
    return x * x * (3 - 2 * x)


def mjukare(x: float) -> float:
    x = kl(x)
    return x * x * x * (x * (6 * x - 15) + 10)


def ut_kub(x: float) -> float:
    x = kl(x)
    return 1 - (1 - x) ** 3


def ut_kvint(x: float) -> float:
    x = kl(x)
    return 1 - (1 - x) ** 5


def in_kub(x: float) -> float:
    x = kl(x)
    return x**3


def in_ut_kub(x: float) -> float:
    x = kl(x)
    return 4 * x**3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def ut_expo(x: float) -> float:
    x = kl(x)
    return 1.0 if x >= 1 else 1 - 2 ** (-10 * x)


def ut_back(x: float, s: float = 1.70158) -> float:
    x = kl(x)
    return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2


def blanda(a, b, k: float):
    if isinstance(a, (tuple, list)):
        return tuple(x + (y - x) * k for x, y in zip(a, b))
    return a + (b - a) * k


def dampad_svang(tau: float, amp: float, damp: float, frekv: float) -> float:
    """Avklingande svangning efter en landning (tau = tid sedan landningen)."""
    if tau < 0:
        return 0.0
    return amp * math.exp(-damp * tau) * math.sin(2 * math.pi * frekv * tau)


def brus1(x: float, fro: int = 0) -> float:
    """Jamnt endimensionellt brus i -1..1 (deterministiskt)."""
    i = math.floor(x)
    f = x - i

    def h(n: int) -> float:
        n = (n * 374761393 + fro * 668265263) & 0xFFFFFFFF
        n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
        return ((n ^ (n >> 16)) & 0xFFFF) / 32767.5 - 1.0

    u = f * f * (3 - 2 * f)
    return h(i) * (1 - u) + h(i + 1) * u
