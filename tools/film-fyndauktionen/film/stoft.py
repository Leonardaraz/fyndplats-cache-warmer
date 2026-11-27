"""Guldstoft: sma korn som svavar i ljuskaglan och virvlar upp nar nagot landar.

Kornen raknas i varldens koordinater med samma kamera som 3D-renderingen, och ritas som skarpa
punkter i fokus och mjuka skivor utanfor fokus (som i ett riktigt objektiv). Lagret laggs pa
bilden i linjart ljus fore gloden.
"""
from __future__ import annotations

import math

import cv2
import numpy as np

GULD = np.array([1.0, 0.74, 0.36], dtype=np.float32)
VITT = np.array([1.0, 0.93, 0.80], dtype=np.float32)


def _norm(v):
    return v / (np.linalg.norm(v) + 1e-12)


class Kamera:
    def __init__(self, kv: dict, bredd: int, hojd: int):
        self.pos = np.array(kv["pos"], dtype=np.float64)
        mal = np.array(kv["mal"], dtype=np.float64)
        self.fram = _norm(mal - self.pos)
        self.hoger = _norm(np.cross(self.fram, np.array([0.0, 0.0, 1.0])))
        self.upp = np.cross(self.hoger, self.fram)
        self.b, self.h = bredd, hojd
        self.f_m = kv["lins"] / 1000.0
        self.fpx = kv["lins"] / 36.0 * hojd
        self.oppning = self.f_m / kv["blandare"]
        self.skarpa = float((np.array(kv["fokus"]) - self.pos) @ self.fram)

    def projicera(self, P: np.ndarray):
        d = P - self.pos
        z = d @ self.fram
        zs = np.maximum(z, 1e-3)
        u = self.b / 2 + self.fpx * (d @ self.hoger) / zs
        v = self.h / 2 - self.fpx * (d @ self.upp) / zs
        oskarpa_m = self.oppning * self.f_m * np.abs(zs - self.skarpa) / (zs * max(self.skarpa - self.f_m, 1e-3))
        radie = 0.5 * oskarpa_m / 0.036 * self.h
        return u, v, z, radie


def _kagla(P: np.ndarray, spets: np.ndarray, mal: np.ndarray, halvvinkel: float, mjukhet: float) -> np.ndarray:
    """Hur mycket av stralkastarens ljus som nar punkterna (0..1 ganger avstandsfall)."""
    axel = _norm(mal - spets)
    d = P - spets
    langd = np.linalg.norm(d, axis=1) + 1e-9
    cosv = (d @ axel) / langd
    vinkel = np.arccos(np.clip(cosv, -1, 1))
    inne = np.clip((halvvinkel - vinkel) / (halvvinkel * mjukhet + 1e-6), 0, 1)
    inne = inne * inne * (3 - 2 * inne)
    return inne * (100.0 / (langd * langd))


class Stoft:
    """Kornen for en uppsattning (trappan eller hallen). Samma fro ger samma film varje gang."""

    def __init__(self, uppsattning: str):
        self.uppsattning = uppsattning
        rng = np.random.default_rng(20261127)
        if uppsattning == "trappa":
            from . import trappa as T
            self.T = T
            n1, n2 = 7000, 600         # korn kring solens kagla, och glesa korn i forgrunden nara kameran
            n = n1 + n2
            self.p0 = np.vstack([
                np.column_stack([rng.uniform(-3.0, 4.2, n1), rng.uniform(-12.5, 3.0, n1), rng.uniform(0.3, 9.0, n1)]),
                np.column_stack([rng.uniform(-1.0, 5.0, n2), rng.uniform(-18.5, -6.0, n2), rng.uniform(0.5, 6.0, n2)])])
            self.fas = rng.uniform(0, 2 * math.pi, (n, 4))
            self.storlek = rng.lognormal(0.0, 0.6, n).astype(np.float32)
            self.vit = rng.random(n) < 0.25
            self.forgrund = np.arange(n) >= n1
            self._malbana = T.ljusmalbana()
            self.skurar = []
            for k in range(1, T.ANTAL_KLIV + 1):
                mitt = np.array([T.PRODUKT_X, T.steg_y(k), T.steg_z(k) + 0.01])
                self.skurar.append(self._skur(rng, 46, T.landningstid(k), mitt, (0.45, 0.40, 0.0), fart=(0.3, 1.3), upp=(0.15, 0.9), liv=(0.35, 0.8), styrka=0.5))
            # SALD slar ned pa prisskylten: skuren runt stampelns kanter, dar den traffar
            st = np.array(T.stampel_varld()) + np.array([0.0, -0.03, 0.0])
            b, h = 0.74 * T.STAMPEL_SKALA / 2, 0.27 * T.STAMPEL_SKALA / 2
            self.skurar.append(self._skur(rng, 420, T.T_STAMPEL, st, (b, 0.01, h), fart=(0.5, 3.6), upp=(-0.3, 2.2), liv=(0.5, 1.5), styrka=1.5,
                                          mot_kamera=2.4, kant=True))
        else:
            from . import hall as H
            self.H = H
            n = 1800
            self.p0 = np.column_stack([rng.uniform(-7.5, 7.5, n), rng.uniform(-16.0, 8.0, n), rng.uniform(0.15, 6.0, n)])
            self.fas = rng.uniform(0, 2 * math.pi, (n, 4))
            self.storlek = rng.lognormal(0.0, 0.55, n).astype(np.float32)
            self.vit = rng.random(n) < 0.25
            self.skurar = []
            pd, ph = H.PIEDESTAL[1], H.PIEDESTAL[2]
            for nr, ts in H.SALDA.items():
                x, y = H.PLATSER[nr]
                st = np.array([x, y - pd / 2 - 0.03, (ph - H.PLATTA) / 2])
                self.skurar.append(self._skur(rng, 260, ts, st, (0.32, 0.01, 0.12), fart=(0.4, 3.0), upp=(-0.2, 1.8), liv=(0.45, 1.3), styrka=1.3,
                                              mot_kamera=2.0, kant=True))
            cx, cy = H.KUB_PLATS
            for k, tk in enumerate(H.T_KUB_BITAR):
                mitt = np.array([cx, cy, H.KUB_SVAV + H.KUB_S / 2])
                self.skurar.append(self._skur(rng, 60, tk, mitt, (0.4, 0.4, 0.4), fart=(0.4, 2.0), upp=(-0.6, 1.2), liv=(0.3, 0.7), styrka=0.9))
            self.skurar.append(self._skur(rng, 900, H.T_KUB_LANDAR, np.array([cx, cy, 0.02]), (0.47, 0.47, 0.0), fart=(0.8, 5.2), upp=(0.2, 2.9),
                                          liv=(0.9, 2.6), styrka=1.7, ring=True))

    # -------------------------------------------------------------- skurar
    @staticmethod
    def _skur(rng, n, t0, mitt, spridning, fart, upp, liv, styrka, mot_kamera=0.0, kant=False, ring=False) -> dict:
        if ring:      # langs en kvadrats kant (kubens fot)
            sida = rng.integers(0, 4, n)
            s = rng.uniform(-1, 1, n)
            px = np.where(sida < 2, s, np.where(sida == 2, -1.0, 1.0)) * spridning[0]
            py = np.where(sida >= 2, s, np.where(sida == 0, -1.0, 1.0)) * spridning[1]
            p = mitt + np.column_stack([px, py, np.zeros(n)])
            ut = np.column_stack([px, py, np.zeros(n)])
            ut /= np.linalg.norm(ut, axis=1, keepdims=True) + 1e-9
            ut[:, :2] += rng.normal(0, 0.35, (n, 2))
        elif kant:    # langs en plattas kant (stampeln), i brickans plan
            vink = rng.uniform(0, 2 * math.pi, n)
            ex, ez = np.cos(vink), np.sin(vink)
            p = mitt + np.column_stack([ex * spridning[0], rng.normal(0, spridning[1], n), ez * spridning[2]])
            ut = np.column_stack([ex, np.zeros(n), ez * 0.6])
        else:
            p = mitt + rng.normal(0, 1, (n, 3)) * np.array(spridning)
            vink = rng.uniform(0, 2 * math.pi, n)
            ut = np.column_stack([np.cos(vink), np.sin(vink) * 0.6, np.zeros(n)])
        v = ut * rng.uniform(fart[0], fart[1], n)[:, None]
        v[:, 2] += rng.uniform(upp[0], upp[1], n)
        v[:, 1] -= mot_kamera * rng.uniform(0.2, 1.0, n)
        return {"t0": t0, "p": p, "v": v, "liv": rng.uniform(liv[0], liv[1], n), "styrka": styrka * rng.lognormal(0, 0.6, n),
                "fas": rng.uniform(0, 2 * math.pi, n), "vit": rng.random(n) < 0.3}

    @staticmethod
    def _skurlage(s: dict, t: float):
        tau = t - s["t0"]
        if tau <= 0 or tau > s["liv"].max():
            return None
        k, g = 2.4, np.array([0.0, 0.0, -2.2])
        e = 1 - math.exp(-k * tau)
        P = s["p"] + s["v"] * (e / k) + g * ((tau - e / k) / k)
        P[:, 2] = np.maximum(P[:, 2], 0.012)
        liv = np.clip(1 - tau / s["liv"], 0, 1)
        glimt = 0.55 + 0.45 * np.sin(tau * 31.0 + s["fas"])
        I = s["styrka"] * liv ** 1.5 * glimt * min(1.0, tau / 0.03)
        return P, I.astype(np.float32), s["vit"]

    # -------------------------------------------------------------- lager
    def lager(self, t: float, kv: dict, bredd: int, hojd: int, pos_pass: np.ndarray | None, z_pass: np.ndarray | None,
              styrka: float = 1.0) -> np.ndarray:
        kam = Kamera(kv, bredd, hojd)
        # svavande korn
        f = self.fas
        P = self.p0 + np.column_stack([0.10 * np.sin(0.31 * t + f[:, 0]), 0.08 * np.sin(0.23 * t + f[:, 1]),
                                       0.07 * np.sin(0.27 * t + f[:, 2]) + 0.035 * t])
        glimt = (0.5 + 0.5 * np.sin(2.3 * t + f[:, 3] * 3.0)) ** 2.2
        if self.uppsattning == "trappa":
            T = self.T
            mal = np.array(self._malbana[int(round(t * 30))])
            niva = T.ljusniva(t)
            spets = np.array(T.solspets(t, mal))       # solen vandrar: kaglans spets foljer den
            ljus = _kagla(P, spets, mal, math.radians(13.0), 0.35) * niva
            I = ljus * (0.2 + 0.8 * glimt) * self.storlek * 2.4
            # forgrundens korn far ett svagt eget ljus, sa att de syns som mjuka skivor nara kameran
            I += np.where(self.forgrund, 0.22, 0.0025) * self.storlek * glimt * niva
        else:
            H = self.H
            niva = np.mean([H.lampniva(k, t) for k in range(len(H.T_LAMPOR))])
            hojdfaktor = np.clip(P[:, 2] / H.LAMP_Z, 0, 1) ** 1.5
            I = (0.05 + 0.5 * hojdfaktor) * (0.2 + 0.8 * glimt) * self.storlek * niva
            if t >= H.T_SJUNK:
                pa = min(1.0, (t - H.T_SJUNK) / 0.5)
                smal = min(1.0, max(0.0, (t - H.T_SMALNAR) / 0.5))
                spets = np.array([H.KUB_PLATS[0] + 0.6, H.KUB_PLATS[1] - 0.8, 10.5])
                malp = np.array([H.KUB_PLATS[0], H.KUB_PLATS[1], 0.45])
                halv = math.radians(10.0 + (3.25 - 10.0) * smal)
                I += _kagla(P, spets, malp, halv, 0.3) * pa * (1 - 0.5 * smal) * (0.2 + 0.8 * glimt) * self.storlek * 1.6
        vit = self.vit
        Pa, Ia, va = [P], [I.astype(np.float32)], [vit]
        for s in self.skurar:
            r = self._skurlage(s, t)
            if r is not None:
                Pa.append(r[0])
                Ia.append(r[1] * 4.0)
                va.append(r[2])
        P = np.concatenate(Pa)
        I = np.concatenate(Ia) * styrka
        vit = np.concatenate(va)

        u, v, z, radie = kam.projicera(P)
        ok = (z > 0.25) & (u > -80) & (u < bredd + 80) & (v > -80) & (v < hojd + 80) & (I > 1e-5)
        # skymt av scenen?
        if pos_pass is not None:
            ph, pb = pos_pass.shape[:2]
            ui = np.clip((u * pb / bredd).astype(int), 0, pb - 1)
            vi = np.clip((v * ph / hojd).astype(int), 0, ph - 1)
            scen_z = (pos_pass[vi, ui] - kam.pos) @ kam.fram
            traff = z_pass[vi, ui] < 1e9 if z_pass is not None else np.ones_like(ok)
            inne = (u >= 0) & (u < bredd) & (v >= 0) & (v < hojd)
            ok &= ~(inne & traff & (z > scen_z + 0.06))
        u, v, radie, I, vit = u[ok], v[ok], radie[ok], I[ok], vit[ok]
        farg = np.where(vit[:, None], VITT, GULD) * I[:, None]
        # nara korn ar stora och ljussvaga: lyft dem lite sa att oskarpeskivorna syns
        farg *= np.clip(radie, 1.0, None)[:, None] ** 0.55
        radie = np.clip(radie, 0.6, 46.0)

        ut = np.zeros((hojd, bredd, 3), dtype=np.float32)
        klasser = [(0.0, 1.3, 1), (1.3, 2.4, 1), (2.4, 4.0, 1), (4.0, 6.5, 1), (6.5, 10.0, 2), (10.0, 16.0, 2), (16.0, 26.0, 4), (26.0, 47.0, 4)]
        for lo, hi, ner in klasser:
            m = (radie >= lo) & (radie < hi)
            if not m.any():
                continue
            bw, bh = bredd // ner, hojd // ner
            acc = np.zeros((bh, bw, 3), dtype=np.float32)
            uu, vv = u[m] / ner - 0.5, v[m] / ner - 0.5
            x0, y0 = np.floor(uu).astype(int), np.floor(vv).astype(int)
            fx, fy = (uu - x0).astype(np.float32), (vv - y0).astype(np.float32)
            c = farg[m] / (ner * ner)
            for dx, dy, w in ((0, 0, (1 - fx) * (1 - fy)), (1, 0, fx * (1 - fy)), (0, 1, (1 - fx) * fy), (1, 1, fx * fy)):
                xi, yi = x0 + dx, y0 + dy
                g = (xi >= 0) & (xi < bw) & (yi >= 0) & (yi < bh)
                np.add.at(acc, (yi[g], xi[g]), c[g] * w[g][:, None])
            r = float(np.sqrt(lo * hi)) / ner if lo > 0 else 0.0
            if r < 0.9:
                acc = cv2.GaussianBlur(acc, (0, 0), 0.62)
            else:
                k = int(math.ceil(r)) + 1
                yy, xx = np.mgrid[-k:k + 1, -k:k + 1].astype(np.float32)
                d = np.sqrt(xx * xx + yy * yy)
                skiva = np.clip(r + 0.5 - d, 0, 1) * (0.82 + 0.18 * np.clip(d / max(r, 1e-3), 0, 1) ** 3)
                skiva /= skiva.sum()
                acc = cv2.filter2D(acc, -1, skiva, borderType=cv2.BORDER_CONSTANT)
            if ner > 1:
                acc = cv2.resize(acc, (bredd, hojd), interpolation=cv2.INTER_LINEAR)
            ut += acc
        return ut
