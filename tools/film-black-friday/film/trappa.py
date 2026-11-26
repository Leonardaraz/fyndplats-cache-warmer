"""Scen 1-3: guldtrappan i den svarta studion. Brickan kliver ett steg ner per timme."""
from __future__ import annotations

import json
import math

import bpy

from . import b3d
from .common import FPS, PRODUKTER, UT, blanda, brus1, dampad_svang, hex_lin, in_kub, led, mjuk, mjukare, ut_expo

# ---- trappans matt (meter) ----
N = 12            # steg, markta 07..18
DJUP = 0.44       # stegdjup
STIG = 0.24       # steghojd
BREDD = 2.2
PLATTA = 0.03     # guldplattans tjocklek
AVSATS = 0.9      # extra djup bakom oversta steget

BRICKA_B, BRICKA_H, BRICKA_T = 0.74, 0.92, 0.04
FOT_H = 0.03
BRICKA_X = 0.24
KROPP_Z = FOT_H + 0.012 + BRICKA_H / 2   # brickans mitt over stegets yta

# ---- tider (sekunder) ----
T_FORSTA_STEG = 4.0      # brickan landar pa steg 08
STEG_TAKT = 0.5
ANTAL_KLIV = 8           # 07 -> 15
HOPP_TID = 0.30
T_NARBILD = 8.5
T_STAMPEL = 10.5
STAMPEL_FLYG = 0.20
T_SLOCKNAR = 11.5

VILA = 0.05              # sa svagt gloder en timme som inte har tants
SIFFROR_X = -BREDD / 2 + 0.50


def steg_z(i: int) -> float:
    return (N - i) * STIG


def steg_y(i: int) -> float:
    return -(i + 0.5) * DJUP


def landningstid(k: int) -> float:
    """Tiden da brickan landar pa steg k (k = 1..ANTAL_KLIV)."""
    return T_FORSTA_STEG + (k - 1) * STEG_TAKT


def bricklage(t: float) -> dict:
    """Brickans lage vid tiden t: fotens mittpunkt (z = stegets yta), lutning (+ = framat) och steg."""
    steg = 0
    for k in range(1, ANTAL_KLIV + 1):
        if t >= landningstid(k):
            steg = k
    y, z, lut = steg_y(steg), steg_z(steg), 0.0
    nasta = steg + 1
    if nasta <= ANTAL_KLIV:
        tl = landningstid(nasta)
        t0 = tl - HOPP_TID
        if t0 - 0.12 < t < t0:      # ansats: lutar sig lite bakat
            lut = -math.radians(2.0) * mjuk(led(t, t0 - 0.12, t0))
        if t >= t0:
            s = (t - t0) / HOPP_TID
            lyft = 0.06
            a = 2 * lyft + 2 * math.sqrt(lyft * lyft + lyft * STIG)
            b = -STIG - a
            y = blanda(steg_y(steg), steg_y(nasta), s)
            z = steg_z(steg) + a * s + b * s * s
            lut = -math.radians(2.0) * (1 - s) ** 2 + math.radians(5.0) * math.sin(math.pi * s)
    if steg >= 1:                    # avklingande gungning efter landningen
        tau = t - landningstid(steg)
        lut += math.radians(dampad_svang(tau, 2.8, 12.0, 5.2))
        z += 0.004 * math.exp(-16 * tau) * abs(math.sin(2 * math.pi * 6.0 * tau))
    tau = t - T_STAMPEL              # stampeln slar till: brickan gungar bakat
    if tau >= 0:
        lut -= math.radians(dampad_svang(tau, 3.6, 6.5, 3.3))
    return {"x": BRICKA_X, "y": y, "z": z, "lut": lut, "steg": steg}


def siffra_styrka(i: int, t: float) -> float:
    """Hur starkt timmen pa steg i lyser vid tiden t."""
    if i == 0:
        if t < landningstid(1):
            return VILA + (1.0 - VILA) * mjuk(led(t, 0.25, 0.6))
        v = 0.42 + 0.58 * math.exp(-(t - landningstid(1)) * 6.0)
    elif i <= ANTAL_KLIV:
        tl = landningstid(i)
        if t < tl:
            return VILA
        tau = t - tl
        aktuell = i == ANTAL_KLIV or t < landningstid(i + 1)
        v = 1.0 + 1.4 * math.exp(-tau * 9.0) if aktuell else 0.42 + 0.58 * math.exp(-(t - landningstid(i + 1)) * 6.0)
    elif i == ANTAL_KLIV + 1:
        if t < T_NARBILD or t > T_STAMPEL:
            return VILA
        puls = 0.5 + 0.5 * math.sin(2 * math.pi * (t - T_NARBILD) / 1.0 - math.pi / 2)
        return VILA + 0.10 + 0.28 * puls      # nasta steg lockar, som ett hjartslag
    else:
        return VILA
    if i < ANTAL_KLIV and t >= T_NARBILD:
        v *= 0.07                              # i narbilden far de passerade timmarna vila
    return v


def ljusniva(t: float) -> float:
    """Studions ljus: tant fran forsta rutan, en blixt vid stampeln, slocknar sedan."""
    upp = 0.85 + 0.15 * ut_expo(led(t, 0.0, 0.4))       # forsta bildrutan ar redan ljus (flodet)
    tau = t - T_STAMPEL
    blixt = 1.0 + (0.9 * math.exp(-tau * 14.0) if tau >= 0 else 0.0)
    ner = 1.0 - mjukare(led(t, T_SLOCKNAR, T_SLOCKNAR + 0.3))
    return upp * blixt * ner


def ljusmalbana() -> dict[int, tuple[float, float, float]]:
    """Stralkastarens mal per bildruta: foljer brickan mjukt, som en foljestralkastare med lite eftersläp."""
    lage = {"y": steg_y(0), "z": steg_z(0) + 0.55}
    bana = {}
    k = 1 - math.exp(-(1 / FPS) / 0.16)
    for f in range(-2, int(12.0 * FPS) + 3):
        p = bricklage(f / FPS)
        lage["y"] += (p["y"] - lage["y"]) * k
        lage["z"] += (steg_z(p["steg"]) + 0.55 - lage["z"]) * k
        bana[f] = (BRICKA_X, lage["y"], lage["z"])
    return bana


def bygg(produkt: dict, look: dict | None = None) -> dict:
    """Bygger trappan, brickan, stampeln och ljuset, och nycklar rorelserna for 0-12 s."""
    look = look or {}
    sc = b3d.ny_scen()
    fasta = b3d.samling("fasta")       # allt fast: blir hallout i volympasset
    ljus = b3d.samling("ljus")

    # ---------- material
    m_golv = b3d.svart_sten("golv", strav=look.get("golv_strav", 0.06), variation=0.025)
    m_sten = b3d.svart_sten("sten", strav=0.16, variation=0.04)
    m_guld_borstat = b3d.guld("guld_borstat", strav=0.26, borstat=True)
    m_guld = b3d.guld("guld_blankt", strav=0.14)
    m_kram = b3d.lack("kramlack", hex_lin("#FBF6EC"), strav=0.42)
    m_siffra = b3d.ljusmaterial("siffra", (1.0, 0.60, 0.20), styrka=look.get("siffra_styrka", 12.0),
                                objektstyrd=True, vilofarg=(0.55, 0.38, 0.16))

    b3d.golv("golv", 80, m_golv, fasta)

    # ---------- trappan
    siffror = []
    pilar: dict[int, bpy.types.Object] = {}
    for i in range(N):
        z = steg_z(i)
        djup = DJUP + (AVSATS if i == 0 else 0)
        yc = steg_y(i) + (AVSATS / 2 if i == 0 else 0)
        b3d.lada(f"kropp{i}", (BREDD, djup, z - PLATTA), (0, yc, (z - PLATTA) / 2), m_sten, fas=0.004, coll=fasta)
        b3d.lada(f"platta{i}", (BREDD + 0.03, djup + 0.022, PLATTA), (0, yc - 0.011, z - PLATTA / 2),
                 m_guld_borstat, fas=0.005, coll=fasta)
        s = b3d.text(f"timme{i}", f"{7 + i:02d}", "Newsreader-Display-SemiBold.ttf", 0.215, djup=0.004, material=m_siffra, coll=fasta)
        bredd_siffror, _ = b3d.centrera(s)
        zc = z - PLATTA - (STIG - PLATTA) / 2
        s.location = (SIFFROR_X, -(i + 1) * DJUP - 0.003, zc)
        s.color = (1, 1, 1, VILA)
        siffror.append(s)
        # pilen nedat: fran 08 och framat har priset gatt ner ett steg (planen: "timmar och pilar nedat")
        if i >= 1:
            pil = b3d.text(f"pil{i}", "\u2193", "Geist-Medium.ttf", 0.155, djup=0.004, material=m_siffra, coll=fasta)
            bredd_pil, _ = b3d.centrera(pil)
            pil.location = (SIFFROR_X + bredd_siffror / 2 + 0.05 + bredd_pil / 2, -(i + 1) * DJUP - 0.003, zc)
            pil.color = (1, 1, 1, VILA)
            pilar[i] = pil

    # ---------- brickan
    from .foton import forbered
    rot = b3d.tom("bricka_rot", coll=fasta)   # star pa stegets yta, mitt under foten
    skiva = b3d.rundad_skiva("bricka", BRICKA_B, BRICKA_H, BRICKA_T, 0.034, m_kram, fas=0.004, coll=fasta)
    ram = b3d.rundad_skiva("bricka_ram", BRICKA_B + 0.024, BRICKA_H + 0.024, BRICKA_T + 0.012, 0.046, m_guld, fas=0.003,
                           coll=fasta, hal=(BRICKA_B - 0.006, BRICKA_H - 0.006, 0.031))
    fot = b3d.lada("bricka_fot", (0.36, 0.14, FOT_H), (0, 0, FOT_H / 2), m_guld_borstat, fas=0.006, coll=fasta)
    for o in (skiva, ram):
        o.location = (0, 0, KROPP_Z)
    foto_b, foto_h = BRICKA_B - 0.07, BRICKA_H - 0.07
    foto_bild = b3d.bild(forbered(produkt["slug"], kvot=foto_b / foto_h))
    m_foto = b3d.bildlack("foto", foto_bild, ton=hex_lin("#FBF6EC"), strav=0.42)
    foto = b3d.plan_xz("foto", foto_b, foto_h, m_foto, fasta)
    foto.location = (0, -BRICKA_T / 2 - 0.0008, KROPP_Z)
    for o in (skiva, ram, fot, foto):
        o.parent = rot

    # ---------- prisskylten vid oversta steget
    skylt_rot = b3d.tom("skylt_rot", (-0.66, steg_y(0) - 0.04, steg_z(0)), fasta)
    sk_b, sk_h = 0.80, 0.46
    sk = b3d.rundad_skiva("skylt", sk_b, sk_h, 0.02, 0.018, m_kram, fas=0.003, coll=fasta)
    sk_ram = b3d.rundad_skiva("skylt_ram", sk_b + 0.016, sk_h + 0.016, 0.028, 0.026, m_guld, fas=0.002, coll=fasta,
                              hal=(sk_b - 0.004, sk_h - 0.004, 0.016))
    sk_fot = b3d.lada("skylt_fot", (0.32, 0.11, 0.022), (0, 0, 0.011), m_guld_borstat, fas=0.004, coll=fasta)
    for o in (sk, sk_ram):
        o.location = (0, 0, 0.022 + 0.008 + sk_h / 2)
    skylt_tex = UT / "tex" / "prisskylt.png"
    if skylt_tex.exists():
        m_sk = b3d.bildlack("skylt_tryck", b3d.bild(skylt_tex), ton=hex_lin("#FBF6EC"), strav=0.42)
        tryck = b3d.plan_xz("skylt_tryck", sk_b - 0.012, sk_h - 0.012, m_sk, fasta)
        tryck.location = (0, -0.0108, 0.022 + 0.008 + sk_h / 2)
        tryck.parent = skylt_rot
    for o in (sk, sk_ram, sk_fot):
        o.parent = skylt_rot
    skylt_rot.rotation_euler = (math.radians(-8), 0, math.radians(8))

    # ---------- stampeln SALD: orange platta i loggans farg med ljus, upphojd text
    m_stampel = b3d.principled("stampel", tuple(c * 0.22 for c in hex_lin("#FE6D22")), 0.0, 0.34,
                               **{"Coat Weight": 1.0, "Coat Roughness": 0.06,
                                  "Emission Color": (*hex_lin("#FE6D22"), 1), "Emission Strength": look.get("stampel_glod", 0.72)})
    m_stampel_text = b3d.principled("stampel_text", hex_lin("#FFF6E8"), 0.0, 0.4,
                                    **{"Emission Color": (*hex_lin("#FFF1DC"), 1), "Emission Strength": look.get("stampel_text_glod", 0.55)})
    st_rot = b3d.tom("stampel_rot", coll=fasta)
    st_rot.parent = rot
    st_b, st_h, st_t = 0.70, 0.27, 0.03
    st_platta = b3d.rundad_skiva("stampel_platta", st_b, st_h, st_t, 0.045, m_stampel, fas=0.005, coll=fasta)
    st_text = b3d.text("stampel_text", "SÅLD", "Geist-Black.ttf", 0.178, djup=0.008, fas=0.0012, material=m_stampel_text, coll=fasta, avstand=1.08)
    st_text.location = (0.004, -st_t / 2 - 0.003, -0.003)
    st_linje = b3d.rundad_skiva("stampel_linje", st_b - 0.045, st_h - 0.045, 0.004, 0.028, m_stampel_text, fas=0.0, coll=fasta,
                                hal=(st_b - 0.045 - 0.012, st_h - 0.045 - 0.012, 0.022))
    st_linje.location = (0, -st_t / 2 - 0.001, 0)
    for o in (st_platta, st_text, st_linje):
        o.parent = st_rot
    st_y = -BRICKA_T / 2 - 0.006 - st_t / 2
    st_z = KROPP_Z - 0.04
    st_vinkel = math.radians(9.0)

    def stampel_fn(t):
        t0 = T_STAMPEL - STAMPEL_FLYG
        if t < t0:
            return {"location": (0, -6.0, st_z), "rotation_euler": (0, st_vinkel, 0), "scale": (0.0001,) * 3}
        k = in_kub(led(t, t0, T_STAMPEL))
        tau = t - T_STAMPEL
        tryck_in = 0.0 if tau < 0 else 0.06 * math.exp(-tau * 30)      # liten studs i skalan vid traffen
        sk_ = blanda(2.7, 1.0, k) * (1 + tryck_in)
        return {"location": (blanda(0.25, 0.0, k), blanda(-3.4, st_y, k), blanda(st_z + 0.5, st_z, k)),
                "rotation_euler": (0, blanda(math.radians(34.0), st_vinkel, k), 0), "scale": (sk_,) * 3}

    # ---------- ljus
    mal = b3d.tom("ljusmal", coll=ljus)
    # 1) stralkastaren ovanifran: syns som kagla i diset och ger guldet sin glans
    kastare = b3d.spot("kastare", (0.3, 1.2, 11.5), 1.0, look.get("kagla", 21.0), mjukhet=0.22, radie=0.07,
                       farg=(1.0, 0.90, 0.76), coll=ljus)
    b3d.sikta(kastare, mal)
    # 2) mjuk ljuslada framifran som lyser upp fotot (syns inte i diset och ger inga blankningar)
    fram = b3d.ytljus("framljus", (2.6, -9.5, 6.4), 1.0, (1.6, 1.6), farg=(1.0, 0.96, 0.90), spridning=38, coll=ljus)
    fram.visible_glossy = False
    b3d.sikta(fram, mal)
    # 3) stor varm lada hogt bakom: speglas i guldplattorna och ger motljus
    bak = b3d.ytljus("bakljus", (0.0, 7.5, 6.5), 1.0, (7.0, 3.0), farg=(1.0, 0.84, 0.62), coll=ljus)
    b3d.sikta_fast(bak, (0, -3.0, 1.2))
    # tva svarta skarmar bakom trappan, osynliga for kameran: utan dem speglas bakljusets lada som en vit
    # flack i det blanka golvet bredvid trappan
    m_skarm = b3d.principled("skarm", (0.0, 0.0, 0.0), 0.0, 1.0)
    for sida in (-1, 1):
        sk = b3d.lada(f"skarm{sida}", (7.0, 0.02, 10.0), (sida * (BREDD / 2 + 0.05 + 3.5), 1.05, 5.0), m_skarm, coll=ljus)
        sk.visible_camera = False
        sk.visible_shadow = False
        sk.visible_diffuse = False
        sk.visible_volume_scatter = False
    # bakljuset lyser pa allt utom golvet
    mottagare = bpy.data.collections.new("bakljus_mottagare")
    trappdelar = bpy.data.collections.new("trappa_mottagare")
    for o in fasta.objects:
        if o.name != "golv" and not o.name.startswith("kropp"):
            mottagare.objects.link(o)
        if o.name.startswith(("platta", "timme")):      # bara guldet: stenens sidor ska forbli morka
            trappdelar.objects.link(o)
    bak.light_linking.receiver_collection = mottagare
    # 4) tva smala kantljus som ritar trappans sidor och stegens framkanter
    kanter = []
    for namn, x in (("kant_v", -5.5), ("kant_h", 5.5)):
        k = b3d.ytljus(namn, (x, -6.0, 2.8), 1.0, (0.35, 5.0), farg=(1.0, 0.82, 0.58), spridning=80, coll=ljus)
        b3d.sikta_fast(k, (0, -2.8, 1.5))
        # kantljusen ritar bara trappan: de far inte blanda ut fotot pa brickan eller speglas i golvet
        k.light_linking.receiver_collection = trappdelar
        kanter.append(k)

    E = {"kastare": look.get("e_kastare", 2300.0), "framljus": look.get("e_fram", 56.0),
         "bakljus": look.get("e_bak", 1100.0), "kant_v": look.get("e_kant", 320.0), "kant_h": look.get("e_kant", 320.0)}

    # ---------- nyckla rorelserna (0..12 s plus marginal)
    rutor = range(-2, int(12.0 * FPS) + 3)

    def rot_fn(t):
        p = bricklage(t)
        return {"location": (p["x"], p["y"], p["z"]), "rotation_euler": (p["lut"], 0, 0)}

    b3d.baka(rot, rutor, rot_fn)
    b3d.baka(st_rot, rutor, stampel_fn)

    bana = ljusmalbana()
    lampor = [kastare, fram, bak] + kanter
    for f in rutor:
        t = f / FPS
        mal.location = bana[f]
        mal.keyframe_insert("location", frame=f)
        fram.location = (bana[f][0] + 2.36, bana[f][1] - 9.28, bana[f][2] + 2.97)
        fram.keyframe_insert("location", frame=f)
        niva = ljusniva(t)
        for o in lampor:
            lokal = 0.22 if (t >= T_NARBILD and o.name in ("bakljus", "kant_v", "kant_h")) else 1.0
            o.data.energy = E[o.name] * niva * lokal
            o.data.keyframe_insert("energy", frame=f)
        slack = 1.0 - mjukare(led(t, T_SLOCKNAR, T_SLOCKNAR + 0.45))
        for i, s in enumerate(siffror):
            s.color[3] = siffra_styrka(i, t) * slack
            s.keyframe_insert("color", frame=f, index=3)
            if i in pilar:
                pilar[i].color[3] = s.color[3]
                pilar[i].keyframe_insert("color", frame=f, index=3)

    if look.get("utan_skylt"):
        for o in [skylt_rot] + list(skylt_rot.children):
            o.hide_render = True
    return {"scen": sc, "fasta": fasta, "ljus": ljus, "bricka": rot, "mal": mal, "foto": foto, "skylt": skylt_rot,
            "volymljus": ["kastare"]}


def las_produkt(slug: str | None = None) -> dict:
    from .texturer import _fynd, val
    slug = slug or val()["trappa"]
    fynd = _fynd()
    if slug not in fynd:
        raise SystemExit(f"hittar inte produkten {slug!r}")
    return fynd[slug]


# ------------------------------------------------------------------ kameror
def _skak(t: float) -> tuple[float, float, float]:
    """Liten kamerastot vid varje landning och en storre vid stampeln."""
    dx = dz = 0.0
    for k in range(1, ANTAL_KLIV + 1):
        tau = t - landningstid(k)
        if 0 <= tau < 0.35:
            a = 0.005 * math.exp(-tau * 16)
            dz += -a * math.cos(2 * math.pi * 11 * tau)
            dx += a * 0.5 * math.sin(2 * math.pi * 9 * tau + k)
    tau = t - T_STAMPEL
    if 0 <= tau < 0.7:
        a = 0.03 * math.exp(-tau * 8)
        dz += -a * math.cos(2 * math.pi * 12 * tau)
        dx += a * 0.7 * math.sin(2 * math.pi * 9.5 * tau)
    return dx, 0.0, dz


def _andas(t: float, styrka: float = 0.012) -> tuple[float, float, float]:
    """Langsam, jamn drift i kamerans lage: nagra pixlar, sa att bilden lever utan att skaka."""
    return (styrka * (brus1(t * 0.35, 11) + 0.35 * brus1(t * 0.9, 12)), 0.0,
            styrka * 0.7 * (brus1(t * 0.31, 13) + 0.35 * brus1(t * 0.8, 14)))


# Oppningen: lang lins lagt fran golvet, brickan stor i kaglan. Sedan lyfter kameran och trappan visar sig.
A_NARA_POS = ((1.95, -17.6, 0.55), (1.80, -16.2, 0.66))
A_NARA_MAL = ((0.16, -0.3, 3.36), (0.16, -0.3, 3.30))
# Slutet av kranakningen haller trappans topp med prisskylten under rubriken (y >= 540),
# och brickan hel och mitt i bild langst ner.
A_VID_POS = ((3.3, -12.9, 4.25), (2.0, -12.4, 2.95))
A_VID_MAL = ((0.08, -2.5, 2.42), (0.12, -3.2, 2.00))
A_LYFT = (2.35, 3.80)


def kam_A(t: float) -> dict:
    p = bricklage(t)
    k1 = led(t, 0.0, A_LYFT[1])
    nara_pos = blanda(*A_NARA_POS, k1)
    nara_mal = blanda(*A_NARA_MAL, k1)
    k2 = mjuk(led(t, A_LYFT[0], 8.5))
    vid_pos = blanda(*A_VID_POS, k2)
    vid_mal = blanda(*A_VID_MAL, k2)
    w = mjukare(led(t, *A_LYFT))
    pos = blanda(nara_pos, vid_pos, w)
    bage = math.sin(math.pi * w)
    pos = (pos[0] + 0.55 * bage, pos[1], pos[2] + 0.25 * bage)
    mal = blanda(nara_mal, vid_mal, w)
    lins = math.exp(blanda(math.log(118.0), math.log(58.0), w))
    sk = _skak(t)
    an = _andas(t, 0.010)
    return {"pos": tuple(a + b + c for a, b, c in zip(pos, sk, an)), "mal": mal, "lins": lins, "blandare": 2.2,
            "fokus": (p["x"], p["y"] - 0.02, p["z"] + 0.55)}


B_POS = ((1.10, -9.20, 1.68), (0.90, -8.65, 1.63))
B_MAL = (-0.10, -3.92, 1.38)


def kam_B(t: float) -> dict:
    k = led(t, T_NARBILD, 12.0)
    pos = blanda(*B_POS, mjuk(k) * 0.5 + k * 0.5)
    sk = _skak(t)
    an = _andas(t, 0.008)
    return {"pos": tuple(a + b + c for a, b, c in zip(pos, sk, an)), "mal": B_MAL, "lins": 50.0, "blandare": 2.0,
            "fokus": (BRICKA_X, steg_y(ANTAL_KLIV) - 0.03, steg_z(ANTAL_KLIV) + 0.55)}
