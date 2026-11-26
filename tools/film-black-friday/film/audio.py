"""Filmens ljudbild, byggd i kod (inga inspelningar, inga rattigheter att kopa).

120 slag i minuten: varje steg i trappan, varje lampa och varje vara landar pa ett slag.
Tonart d-moll som loser upp i D-dur nar kuben landar. Stegen nerfor trappan spelas som en
fallande skala, sa att man hor priset ga ner.

    python -m film.audio            # skriver out/ljud.wav
"""
from __future__ import annotations

import math

import numpy as np
from scipy import signal
from scipy.io import wavfile

from .common import LANGD, UT

SR = 48000
N = int(LANGD * SR)

TON = {"D1": 36.71, "A1": 55.0, "Bb1": 58.27, "C2": 65.41, "D2": 73.42, "F2": 87.31, "G2": 98.0, "A2": 110.0, "Bb2": 116.54,
       "C3": 130.81, "D3": 146.83, "E3": 164.81, "F3": 174.61, "G3": 196.0, "A3": 220.0, "Bb3": 233.08, "C4": 261.63, "D4": 293.66,
       "E4": 329.63, "F4": 349.23, "F#3": 185.0, "F#4": 369.99, "G4": 392.0, "A4": 440.0, "Bb4": 466.16, "C5": 523.25, "D5": 587.33, "E5": 659.25,
       "F5": 698.46, "F#5": 739.99, "A5": 880.0, "D6": 1174.66}

rng = np.random.default_rng(7)


# ------------------------------------------------------------------ grundstenar
def tidsaxel(langd: float) -> np.ndarray:
    return np.arange(int(langd * SR)) / SR


def lp(x, hz, ordning=2):
    return signal.sosfilt(signal.butter(ordning, hz, "low", fs=SR, output="sos"), x)


def hp(x, hz, ordning=2):
    return signal.sosfilt(signal.butter(ordning, hz, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, ordning=2):
    return signal.sosfilt(signal.butter(ordning, [lo, hi], "band", fs=SR, output="sos"), x)


def brus(langd: float) -> np.ndarray:
    return rng.standard_normal(int(langd * SR))


def ton_ner(f0: float, f1: float, langd: float, fall: float) -> np.ndarray:
    """Sinus vars tonhojd faller fran f0 mot f1 (som en trumma)."""
    t = tidsaxel(langd)
    f = f1 + (f0 - f1) * np.exp(-t / fall)
    return np.sin(2 * math.pi * np.cumsum(f) / SR)


class Mix:
    """Stereobuss med torrt ljud och en sandning till rumsklangen."""

    def __init__(self):
        self.torr = np.zeros((N, 2))
        self.rum = np.zeros((N, 2))

    def lagg(self, x: np.ndarray, t: float, styrka: float = 1.0, pan: float = 0.0, rum: float = 0.0) -> None:
        i = int(round(t * SR))
        if i >= N:
            return
        if i < 0:
            x = x[-i:]
            i = 0
        x = x[: N - i]
        if x.ndim == 1:
            v, h = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
            st = np.column_stack([x * v, x * h]) * math.sqrt(2)
        else:
            st = x
        self.torr[i : i + len(x)] += st * styrka
        if rum > 0:
            self.rum[i : i + len(x)] += st * styrka * rum


def rumsklang(x: np.ndarray, efterklang: float = 2.4, fordrojning: float = 0.022) -> np.ndarray:
    """Stor, mork sal: avklingande brus som impuls, hoger och vanster olika."""
    n = int(efterklang * 1.3 * SR)
    t = np.arange(n) / SR
    ut = np.zeros_like(x)
    for k in range(2):
        r = np.random.default_rng(100 + k).standard_normal(n)
        ir = r * np.exp(-6.9 * t / efterklang)
        ir = lp(ir, 5200) * 0.6 + lp(ir, 1400) * 0.4       # hoga toner dor fortare
        ir[: int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))
        ir = np.concatenate([np.zeros(int(fordrojning * SR)), ir])
        ir /= np.sqrt(np.sum(ir**2))
        ut[:, k] = signal.fftconvolve(x[:, k], ir)[: len(x)]
    return ut


# ------------------------------------------------------------------ instrument
def tick(hog: bool = True) -> np.ndarray:
    """Ett slag fran en klocka: kort knapp med lite tra i."""
    langd = 0.09
    t = tidsaxel(langd)
    f1, f2, kropp = (2650.0, 4300.0, 520.0) if hog else (1900.0, 3100.0, 400.0)
    x = 0.55 * np.sin(2 * math.pi * f1 * t) * np.exp(-t / 0.006)
    x += 0.30 * np.sin(2 * math.pi * f2 * t) * np.exp(-t / 0.004)
    x += 0.50 * np.sin(2 * math.pi * kropp * t) * np.exp(-t / 0.018)
    knapp = bp(brus(langd), 1800, 7000) * np.exp(-t / 0.0025)
    return (x + 0.5 * knapp) * np.minimum(1, t / 0.0003)


def duns(f0=120.0, f1=44.0, langd=0.5, fall=0.035, avkling=0.16) -> np.ndarray:
    """Mjukt slag. Har en kort knapp i mellanregistret sa att det hors aven i en telefonhogtalare."""
    t = tidsaxel(langd)
    x = ton_ner(f0, f1, langd, fall) * np.exp(-t / avkling)
    x += 0.5 * ton_ner(f0 * 3.1, f1 * 4.0, langd, fall * 0.6) * np.exp(-t / (avkling * 0.3))
    x += 0.35 * bp(brus(langd), 900, 4200) * np.exp(-t / 0.006)
    return np.tanh(x * 1.5) * np.minimum(1, t / 0.002)


def bom(f0=70.0, f1=31.0, langd=2.4, fall=0.12, avkling=0.7) -> np.ndarray:
    """Djup, lang small (stampeln, kuben)."""
    t = tidsaxel(langd)
    x = ton_ner(f0, f1, langd, fall) * np.exp(-t / avkling)
    x += 0.35 * ton_ner(f0 * 2.02, f1 * 2, langd, fall * 0.7) * np.exp(-t / (avkling * 0.45))
    return np.tanh(x * 1.8) * np.minimum(1, t / 0.003)


def klubba(f: float, langd=1.6, avkling=0.55, ljus=1.0) -> np.ndarray:
    """Mjuk klubba pa trastav (marimba/vibrafon): ren grundton med lite overtoner i anslaget."""
    t = tidsaxel(langd)
    x = np.sin(2 * math.pi * f * t) * np.exp(-t / avkling)
    x += 0.28 * ljus * np.sin(2 * math.pi * f * 3.98 * t) * np.exp(-t / (avkling * 0.16))
    x += 0.10 * ljus * np.sin(2 * math.pi * f * 9.9 * t) * np.exp(-t / (avkling * 0.05))
    x += 0.20 * np.sin(2 * math.pi * f * 2.0 * t) * np.exp(-t / (avkling * 0.5))
    x *= 1 + 0.06 * np.sin(2 * math.pi * 4.6 * t)
    return x * np.minimum(1, t / 0.0025)


def ackord(toner: list[str], langd=3.2, avkling=1.1, ljus=0.6) -> np.ndarray:
    x = np.zeros(int(langd * SR))
    for i, n in enumerate(toner):
        k = klubba(TON[n], langd, avkling * (1.15 - 0.05 * i), ljus)
        fordroj = int(0.012 * i * SR)             # latt rullat ackord
        x[fordroj:] += k[: len(x) - fordroj] / (1 + 0.25 * i)
    return lp(x, 4200)


def matta(toner: list[str], langd: float, in_tid=1.2, ut_tid=1.2, mork=900.0) -> np.ndarray:
    """Varm bakgrundston: nagra latt forstamda sagtander genom ett morkt filter."""
    t = tidsaxel(langd)
    x = np.zeros((len(t), 2))
    for n in toner:
        f = TON[n]
        for k, ost in enumerate((-0.35, 0.0, 0.35)):
            fas = rng.uniform(0, 1)
            sag = 2 * ((t * f * (1 + ost / 100) + fas) % 1.0) - 1
            x[:, k % 2] += sag
            x[:, (k + 1) % 2] += 0.5 * sag
    lfo = 0.75 + 0.25 * np.sin(2 * math.pi * 0.13 * t + 1.0)
    for k in range(2):
        x[:, k] = lp(x[:, k], mork, 3) * lfo
    kuvert = np.minimum(1, t / in_tid) * np.minimum(1, (langd - t) / ut_tid)
    return x * kuvert[:, None] / (2.2 * len(toner))


def bas(f: float, langd: float, avkling: float = 0.9) -> np.ndarray:
    t = tidsaxel(langd)
    x = np.sin(2 * math.pi * f * t) + 0.28 * np.sin(2 * math.pi * 2 * f * t) + 0.08 * np.sin(2 * math.pi * 3 * f * t)
    return np.tanh(x * 1.2) * np.exp(-t / avkling) * np.minimum(1, t / 0.012)


def svep(langd: float, lo: float, topp: float, hi: float, toppen_vid=0.55, skarpa=1.6) -> np.ndarray:
    """Luftsvep: brus genom ett filter vars mittfrekvens far upp och ner. Stereo."""
    n = int(langd * SR)
    t = np.arange(n) / n
    mitt = np.where(t < toppen_vid, lo * (topp / lo) ** (t / toppen_vid), topp * (hi / topp) ** ((t - toppen_vid) / (1 - toppen_vid)))
    kuvert = np.sin(math.pi * np.clip(t / (2 * toppen_vid), 0, 0.5)) ** 2 * np.where(t > toppen_vid, np.cos(0.5 * math.pi * (t - toppen_vid) / (1 - toppen_vid)) ** 2, 1.0)
    ut = np.zeros((n, 2))
    for k in range(2):
        x = np.random.default_rng(50 + k + int(lo)).standard_normal(n)
        lag = band = 0.0
        y = np.empty(n)
        g = 2 * np.sin(math.pi * np.minimum(mitt, SR / 6.5) / SR)
        q = 1.0 / skarpa
        for i in range(n):            # tillstandsvariabelt filter
            lag += g[i] * band
            hog = x[i] - lag - q * band
            band += g[i] * hog
            y[i] = band
        ut[:, k] = y * kuvert
    return ut / (np.abs(ut).max() + 1e-9)


def stigare(langd: float, f0=180.0, f1=900.0) -> np.ndarray:
    t = tidsaxel(langd)
    f = f0 * (f1 / f0) ** (t / langd)
    x = np.sin(2 * math.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * math.pi * np.cumsum(f * 1.498) / SR)
    x = x * 0.5 + 0.5 * bp(brus(langd), 400, 6000) * (t / langd)
    return x * (t / langd) ** 2.2


def skimmer(langd=3.6, grund=TON["D5"], antal=70, dur=True) -> np.ndarray:
    """Guldskimmer: manga sma klara toner som tands och klingar ut. Stereo."""
    n = int(langd * SR)
    ut = np.zeros((n, 2))
    steg = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31] if dur else [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24]
    r = np.random.default_rng(31)
    for _ in range(antal):
        f = grund * 2 ** (r.choice(steg) / 12) * (1 + r.normal(0, 0.0015))
        if f > 9500:
            f /= 2
        start = int(r.uniform(0, 0.9) ** 1.8 * SR * 1.1)
        d = r.uniform(0.5, 2.0)
        m = min(n - start, int(d * 3.2 * SR))
        t = np.arange(m) / SR
        x = np.sin(2 * math.pi * f * t) * np.exp(-t / d * 2.2) * np.minimum(1, t / 0.004) * r.uniform(0.25, 1.0)
        pan = r.uniform(-0.9, 0.9)
        ut[start : start + m, 0] += x * math.cos((pan + 1) * math.pi / 4)
        ut[start : start + m, 1] += x * math.sin((pan + 1) * math.pi / 4)
    return ut / (np.abs(ut).max() + 1e-9)


def strombrytare() -> np.ndarray:
    """Tung strombrytare: tva tata knappar och en dov stot."""
    langd = 0.22
    t = tidsaxel(langd)
    x = np.zeros_like(t)
    for d, s, hz in ((0.0, 1.0, (900, 5200)), (0.021, 0.75, (700, 3800))):
        i = int(d * SR)
        k = bp(brus(langd), *hz) * np.exp(-t / 0.004)
        x[i:] += s * k[: len(x) - i]
    x += 0.9 * np.sin(2 * math.pi * 165 * t) * np.exp(-t / 0.03)
    return x


def lampklick(steg: int) -> np.ndarray:
    """Relaklick nar en lamprad tands, med ett kort surr som stiger for varje rad."""
    langd = 0.5
    t = tidsaxel(langd)
    x = bp(brus(langd), 1200, 6000) * np.exp(-t / 0.003) * 1.2
    x += 0.8 * np.sin(2 * math.pi * 210 * t) * np.exp(-t / 0.02)
    f = 100.0 * 2 ** (steg * 2 / 12)
    surr = sum(np.sin(2 * math.pi * f * k * t) / k for k in (1, 2, 3, 4, 5))
    x += 0.22 * lp(surr, 1500) * np.exp(-t / 0.13) * np.minimum(1, t / 0.01)
    x += 0.35 * np.sin(2 * math.pi * TON["D5"] * 2 ** (steg * 2 / 12) / 2 * t) * np.exp(-t / 0.16)   # liten stigande klang
    return x


def hjartslag() -> np.ndarray:
    a = duns(150, 52, 0.5, 0.03, 0.10)
    b = duns(125, 46, 0.5, 0.03, 0.13)
    x = np.zeros(int(0.8 * SR))
    x[: len(a)] += a
    i = int(0.20 * SR)
    x[i : i + len(b)] += 0.8 * b[: len(x) - i]
    return lp(x, 700)


def stampel() -> np.ndarray:
    """Stampeln slar ner: knapp, tung stot, kort metallklang och en luftstot."""
    langd = 1.4
    t = tidsaxel(langd)
    x = bom(110, 38, langd, 0.05, 0.20) * 0.55
    x += 0.9 * np.sin(2 * math.pi * 215 * t) * np.exp(-t / 0.05)
    x += 0.6 * np.sin(2 * math.pi * 430 * t) * np.exp(-t / 0.03)
    x += 1.1 * lp(brus(langd), 3200) * np.exp(-t / 0.045)
    x += 0.9 * bp(brus(langd), 2000, 9000) * np.exp(-t / 0.008)
    for f, a, d in ((523.0, 0.16, 0.30), (1187.0, 0.10, 0.22), (1931.0, 0.07, 0.16), (2764.0, 0.05, 0.11)):
        x += a * np.sin(2 * math.pi * f * t) * np.exp(-t / d)
    return np.tanh(x * 1.1)


def kublandning() -> np.ndarray:
    langd = 2.4
    t = tidsaxel(langd)
    x = bom(88, 36.7, langd, 0.08, 0.50) * 0.5
    x += 0.8 * np.sin(2 * math.pi * 147 * t) * np.exp(-t / 0.09)
    x += 0.5 * np.sin(2 * math.pi * 294 * t) * np.exp(-t / 0.05)
    x += 0.9 * lp(brus(langd), 2400) * np.exp(-t / 0.07)
    x += 0.7 * bp(brus(langd), 1500, 8000) * np.exp(-t / 0.010)
    return np.tanh(x * 1.15)


def klack(f: float) -> np.ndarray:
    """Kubens ytor klickar ihop: kort, tonande klack."""
    langd = 0.35
    t = tidsaxel(langd)
    x = np.sin(2 * math.pi * f * t) * np.exp(-t / 0.07) + 0.5 * np.sin(2 * math.pi * f * 2.76 * t) * np.exp(-t / 0.03)
    x += 0.6 * bp(brus(langd), 1500, 8000) * np.exp(-t / 0.003)
    x += 0.7 * np.sin(2 * math.pi * 160 * t) * np.exp(-t / 0.025)
    return x


# ------------------------------------------------------------------ partituret
def bygg() -> np.ndarray:
    m = Mix()

    # ---- scen 1 (0-2,5): ljuset tands, basen vaknar, klockan borjar ticka
    m.lagg(strombrytare(), 0.0, 0.85, 0.0, rum=0.5)
    m.lagg(bom(74, 36.7, 2.4, 0.2, 0.8), 0.02, 0.20, 0.0, rum=0.25)
    m.lagg(ackord(["D3", "A3", "D4", "F4"], 3.0, 1.5, 0.5), 0.03, 0.30, 0.0, rum=0.7)
    m.lagg(matta(["D2", "A2", "D3"], 9.2, 1.6, 1.2, mork=750), 0.0, 0.13)
    m.lagg(matta(["F3", "A3"], 6.6, 2.5, 0.8, mork=1500), 2.5, 0.09, rum=0.4)

    # klockan: tick pa varje slag, tock pa vartannat (0,5 s mellan slagen)
    for i in range(1, 17):
        t = 0.5 * i
        if t >= 8.5:
            break
        m.lagg(tick(i % 2 == 1), t, 0.52 if t < 4.0 else 0.36, -0.15 if i % 2 else 0.15, rum=0.3)

    # ---- scen 2 (2,5-8,5): kameran lyfter, brickan kliver ner (fallande skala)
    m.lagg(svep(1.7, 180, 2600, 300, 0.6), 2.25, 0.30, rum=0.5)
    skala = ["A4", "G4", "F4", "E4", "D4", "C4", "Bb3", "A3"]
    bastoner = ["D2", "D2", "Bb1", "C2", "G2", "F2", "Bb1", "A1"]
    for k, (ton, b) in enumerate(zip(skala, bastoner)):
        t = 4.0 + 0.5 * k
        m.lagg(duns(105, 46, 0.4, 0.03, 0.13), t, 0.26, 0.0, rum=0.2)
        m.lagg(klubba(TON[ton], 1.5, 0.50, 1.3), t, 0.50, 0.25 - 0.07 * k, rum=0.5)
        m.lagg(klubba(TON[ton] * 2, 0.9, 0.22, 0.6), t, 0.10, -0.2, rum=0.6)
        m.lagg(klubba(TON[ton] / 2, 1.2, 0.40, 0.5), t, 0.14, 0.0, rum=0.4)
        m.lagg(bas(TON[b], 0.9, 0.42), t, 0.15)
        m.lagg(svep(0.26, 500, 2400, 900, 0.75), t - 0.27, 0.06, rum=0.3)             # brickans luftdrag fore landningen

    # ---- scen 3 (8,5-12): narbild, hjartslag, stampeln, tystnad
    m.lagg(bom(74, 36.7, 2.0, 0.15, 0.7), 8.5, 0.15, rum=0.3)
    m.lagg(ackord(["D3", "A3", "D4"], 2.6, 1.1, 0.5), 8.5, 0.30, 0.0, rum=0.6)
    for t in (8.75, 9.5, 10.02):
        m.lagg(hjartslag(), t, 0.48 if t < 10 else 0.56)
    spanning = matta(["A4", "Bb4"], 2.05, 1.7, 0.03, mork=2800)
    spanning *= (np.linspace(0, 1, len(spanning)) ** 2.0)[:, None]
    m.lagg(hp(spanning[:, 0], 300)[:, None] * np.ones((1, 2)), 8.47, 0.36, rum=0.6)
    m.lagg(stigare(0.62, 240, 1500), 9.88, 0.16, 0.0, rum=0.5)
    m.lagg(svep(0.32, 300, 3800, 1200, 0.85), 10.19, 0.50, rum=0.3)                   # stampeln flyger in
    m.lagg(stampel(), 10.5, 1.0, 0.0, rum=0.30)
    # strombrytaren slar av: ljuset slocknar
    m.lagg(strombrytare(), 11.5, 0.60, 0.0, rum=0.6)
    t = tidsaxel(0.6)
    m.lagg(np.sin(2 * math.pi * np.cumsum(620 * np.exp(-t / 0.16) + 90) / SR) * np.exp(-t / 0.2), 11.52, 0.10, 0.0, rum=0.5)

    # ---- scen 4 (12-18): lamprad efter lamprad, hundra fynd, fyra varor
    for k, (t, n) in enumerate(zip((12.0, 12.25, 12.5, 12.75, 13.0), ("D4", "F4", "G4", "A4", "C5"))):
        m.lagg(lampklick(k), t, 0.62, -0.6 + 0.3 * k, rum=0.5)
        m.lagg(klubba(TON[n], 1.2, 0.40, 1.0), t, 0.26, -0.6 + 0.3 * k, rum=0.6)
    m.lagg(stigare(1.5, 150, 620), 12.0, 0.20, 0.0, rum=0.4)
    m.lagg(matta(["Bb2", "F3", "D4"], 5.2, 1.4, 1.0, mork=1700), 12.2, 0.10, rum=0.35)
    # "100": ett stort, varmt slag
    m.lagg(ackord(["Bb2", "F3", "D4", "F4", "C5"], 3.4, 1.3, 0.9), 13.5, 0.55, rum=0.6)
    m.lagg(ackord(["D5", "F5"], 2.2, 0.8, 1.0), 13.5, 0.22, rum=0.7)
    m.lagg(bom(88, 58.3, 1.6, 0.10, 0.55), 13.5, 0.22, rum=0.3)
    m.lagg(duns(140, 58, 0.5, 0.03, 0.16), 13.5, 0.40, rum=0.3)
    m.lagg(skimmer(2.6, TON["Bb4"], 34, dur=True), 13.5, 0.26, rum=0.7)
    varor = [("F2", ["A4", "C5"]), ("C2", ["G4", "E5"]), ("D2", ["A4", "D5"]), ("Bb1", ["D5", "F5"])]
    for k, (b, toner) in enumerate(varor):
        t = 14.0 + k
        m.lagg(svep(0.40, 260, 2600, 700, 0.8), t - 0.42, 0.22, rum=0.4)             # brickan vander sig
        m.lagg(duns(110, 48, 0.45, 0.03, 0.15), t, 0.36, 0.0, rum=0.2)
        m.lagg(bas(TON[b], 1.1, 0.55), t, 0.17)
        for j, n in enumerate(toner):
            m.lagg(klubba(TON[n], 1.6, 0.6, 1.2), t + 0.012 * j, 0.40, -0.3 + 0.6 * j, rum=0.6)
        m.lagg(klubba(TON[toner[0]] / 2, 1.3, 0.5, 0.6), t, 0.16, 0.0, rum=0.5)
        m.lagg(tick(False), t + 0.5, 0.30, 0.2, rum=0.3)
    for t in (13.0,):
        m.lagg(tick(True), t, 0.20, -0.2, rum=0.3)

    # ---- scen 5 (18-21): tre mjuka slag i takt
    m.lagg(svep(0.9, 200, 1500, 350, 0.5), 17.55, 0.18, rum=0.5)
    for k, (t, toner, b) in enumerate(((18.0, ["F3", "A3", "C4", "F4"], "F2"), (19.0, ["C3", "G3", "C4", "E4"], "C2"), (20.0, ["Bb2", "F3", "D4", "F4"], "Bb1"))):
        m.lagg(ackord(toner, 2.6, 0.95, 0.8), t, 0.52, 0.0, rum=0.6)
        m.lagg(klubba(TON[toner[-1]] * 2, 1.4, 0.5, 0.8), t, 0.14, 0.3, rum=0.7)
        m.lagg(bas(TON[b], 1.0, 0.5), t, 0.15)
        m.lagg(duns(100, 46, 0.4, 0.03, 0.12), t, 0.20)
        m.lagg(tick(True), t + 0.5, 0.28, -0.2, rum=0.3)
    m.lagg(matta(["F3", "C4"], 3.6, 1.0, 1.0, mork=1500), 17.8, 0.07, rum=0.4)

    # ---- scen 6 (21-25): brickorna sjunker, kuben satts ihop, landar i guldstoft
    m.lagg(svep(1.0, 900, 1600, 120, 0.2, 1.2), 20.95, 0.34, rum=0.5)
    m.lagg(matta(["A2", "E3", "A3"], 1.75, 0.6, 0.12, mork=1100), 20.9, 0.13)
    for k, (t, f) in enumerate(((21.75, TON["A4"]), (21.875, TON["D5"]), (22.0, TON["F#5"]))):
        m.lagg(svep(0.34, 400, 3200, 1500, 0.85), t - 0.33, 0.18, rum=0.3)
        m.lagg(klack(f), t, 0.50, -0.4 + 0.4 * k, rum=0.5)
    m.lagg(svep(0.34, 2400, 600, 150, 0.15, 1.3), 22.18, 0.28, rum=0.2)               # fallet
    m.lagg(kublandning(), 22.5, 1.0, 0.0, rum=0.4)
    m.lagg(ackord(["D3", "A3", "D4", "F#4", "A4"], 2.6, 1.5, 0.8), 22.5, 0.50, rum=0.6)
    m.lagg(ackord(["F#4", "A4", "D5"], 2.6, 1.3, 1.0), 22.52, 0.30, rum=0.7)
    m.lagg(bas(TON["D2"], 2.2, 1.0), 22.5, 0.20)
    m.lagg(skimmer(2.5, TON["D5"], 80), 22.52, 0.48, rum=0.8)
    m.lagg(matta(["D3", "A3", "D4", "F#4"], 2.55, 0.25, 0.5, mork=1400), 22.5, 0.10, rum=0.3)
    # klockan tickar tva ganger till
    m.lagg(tick(True), 24.0, 0.55, -0.15, rum=0.35)
    m.lagg(tick(False), 24.5, 0.55, 0.15, rum=0.35)

    # ---- rum, mastring
    vat = rumsklang(m.rum)
    mix = m.torr + 0.40 * vat
    mix = np.column_stack([hp(mix[:, 0], 30, 2), hp(mix[:, 1], 30, 2)])
    # tonbalans: lite mindre bas och mer luft, sa att ljudet bar i sma hogtalare
    for k in range(2):
        mix[:, k] = mix[:, k] - 0.30 * lp(mix[:, k], 170, 2) + 0.75 * hp(mix[:, k], 1700, 1) + 0.5 * hp(mix[:, k], 5000, 1)
    # latt kompression pa summan: tar ner de hogsta topparna utan att pumpa
    niva = np.abs(mix).max(axis=1)
    kuv = np.zeros(N)
    a_in, a_ut = math.exp(-1 / (0.003 * SR)), math.exp(-1 / (0.15 * SR))
    v = 0.0
    for i in range(N):
        x = niva[i]
        v = a_in * v + (1 - a_in) * x if x > v else a_ut * v + (1 - a_ut) * x
        kuv[i] = v
    troskel = 0.55
    forst = np.where(kuv > troskel, (troskel + (kuv - troskel) / 2.0) / np.maximum(kuv, 1e-9), 1.0)
    mix = mix * forst[:, None]
    mix = np.tanh(mix * 1.15) / math.tanh(1.15)
    mix *= 0.56 / np.abs(mix).max()                      # topp ca -5 dB: runt -14 LUFS, som apparna anda normaliserar till
    # sista 60 ms tonas ut och forsta 2 ms in, sa att filmen gar runt utan knapp
    ut = int(0.06 * SR)
    mix[-ut:] *= np.linspace(1, 0, ut)[:, None] ** 2
    mix[: int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))[:, None]
    return mix


def main() -> None:
    mix = bygg()
    mal = UT / "ljud.wav"
    mal.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(str(mal), SR, (mix * 32767).astype(np.int16))
    rms = 20 * math.log10(np.sqrt(np.mean(mix**2)) + 1e-12)
    print(f"ljud klart: {mal}  langd {len(mix) / SR:.3f} s  topp {20 * math.log10(np.abs(mix).max()):.1f} dB  RMS {rms:.1f} dB")


if __name__ == "__main__":
    main()
