"""Scen 1-3: guldtrappan i den svarta studion, en auktionsdag fran kl 07.

Varan sjalv, en riktig 3D-modell (film/modeller), star pa en vridplatta overst i trappan och kliver ett steg
ned per timme. Ett enda huvudljus gar som en sol bakom den, fran vanster bakifran pa morgonen till hoger
bakifran pa eftermiddagen, sa att varans egen skugga sveper nedfor trappan som en klockvisare. Sedan:
En prisskylt star bredvid vridplattan och foljer med i varje kliv: den visar exempelvarans pris for varje
timme, raknat som auktionen raknar det (film/prisstege.py). Sedan "Vagar du vanta?", och SALD-stampeln
slar ned pa skylten.
"""
from __future__ import annotations

import json
import math

import bpy
from mathutils import Vector

from . import b3d, modeller
from .common import (FPS, PRODUKTER, UT, blanda, brus1, dampad_svang, hex_lin, in_kub, kelvin_rgb, klocka, led, mjuk,
                     mjukare, sol, ut_expo, ut_kub)

# ---- trappans matt (meter): stegen ar djupa nog for en fatolj pa sin vridplatta ----
N = 12            # steg, markta 07..18
DJUP = 1.15       # stegdjup
STIG = 0.30       # steghojd
BREDD = 3.2
PLATTA = 0.035    # guldplattans tjocklek
AVSATS = 1.6      # extra djup bakom oversta steget
VRID_R, VRID_H = 0.57, 0.05
PRODUKT_X = 0.40
BRICKA_X = PRODUKT_X        # stoft.py: varans sida i trappan
SIFFROR_X = -0.62          # timmarna star nara varan, sa att narbilden far med bada

# ---- tider (sekunder) ----
T_FORSTA_STEG = 4.0      # varan landar pa steg 08
STEG_TAKT = 0.5
ANTAL_KLIV = 8           # 07 -> 15
HOPP_TID = 0.34
T_NARBILD = 8.5
T_STAMPEL = 10.5
STAMPEL_FLYG = 0.20
T_SLOCKNAR = 11.5
VRID = (-125.0, 0.0, 2.9)   # vridplattan: varan snurrar in fran profilen och bromsar in mot kameran, klar 2,9 s

# ---- prisskylten: star pa stegets yta bredvid vridplattan, framfor varans vanstra sida, och foljer med i
# varje kliv (barn till vridplattans mitt, men den snurrar inte med) ----
SKYLT_LAGE = (-0.48, -0.38)          # relativt vridplattans mitt (x, y)
SKYLT_B, SKYLT_H = 0.60, 0.34
SKYLT_VINKEL = (-8.0, 0.0, 10.0)     # lutar bakat och vrider sig lite mot kameran
SKYLT_FOT = 0.022 + 0.008            # foten och glappet under kortet
SKYLT_PRIS_Z = SKYLT_FOT + SKYLT_H * 0.38   # mitt pa priset (nedre delen av kortet): dar SALD slar ned
STAMPEL_SKALA = 0.80                 # stampeln tacker priset pa skylten

VILA = 0.05              # sa svagt gloder en timme som inte har tants
SOL_AVSTAND = 15.0


def steg_z(i: int) -> float:
    return (N - i) * STIG


def steg_y(i: int) -> float:
    return -(i + 0.5) * DJUP


def sattsteg(i: int) -> tuple[float, float]:
    """Framkanten (y) och mitthojden (z) for sattsteget under steg i, dar timmen star."""
    return -(i + 1) * DJUP, steg_z(i) - PLATTA - (STIG - PLATTA) / 2


def landningstid(k: int) -> float:
    """Tiden da varan landar pa steg k (k = 1..ANTAL_KLIV)."""
    return T_FORSTA_STEG + (k - 1) * STEG_TAKT


def vridvinkel(t: float) -> float:
    a0, a1, t1 = VRID
    return math.radians(blanda(a0, a1, ut_kub(led(t, 0.0, t1))))


def prisbyte_ruta(k: int) -> float:
    """Halvrutan da skylten byter till timme k (1..ANTAL_KLIV): strax fore rutan da varan landar,
    mellan tva rutors slutartider (slutaren ar oppen f-0.25 till f+0.25), sa att bytet aldrig syns som en spokbild."""
    return round(landningstid(k) * FPS) - 0.5


def skylt_timme(t: float) -> int:
    """Vilken timme skylten visar vid tiden t: 0 = kl 07 (startpriset) ... ANTAL_KLIV = kl 15."""
    f = t * FPS
    return sum(1 for k in range(1, ANTAL_KLIV + 1) if f >= prisbyte_ruta(k))


PRISBYTE_NYCKLAR = tuple(x for k in range(1, ANTAL_KLIV + 1) for x in (prisbyte_ruta(k) - 0.05, prisbyte_ruta(k) + 0.05))


def _vrid_xyz(p, vinkel_grader) -> tuple[float, float, float]:
    """Roterar en punkt som Blender gor med euler XYZ (forst X, sedan Y, sedan Z)."""
    x, y, z = p
    ax, ay, az = (math.radians(v) for v in vinkel_grader)
    y, z = y * math.cos(ax) - z * math.sin(ax), y * math.sin(ax) + z * math.cos(ax)
    x, z = x * math.cos(ay) + z * math.sin(ay), -x * math.sin(ay) + z * math.cos(ay)
    x, y = x * math.cos(az) - y * math.sin(az), x * math.sin(az) + y * math.cos(az)
    return x, y, z


def stampel_varld() -> tuple[float, float, float]:
    """Var SALD-stampeln landar i varlden (pa skyltens pris, nar varan star pa sista steget)."""
    lokal = _vrid_xyz((0.0, -0.036, SKYLT_PRIS_Z), SKYLT_VINKEL)
    return (PRODUKT_X + SKYLT_LAGE[0] + lokal[0], steg_y(ANTAL_KLIV) + SKYLT_LAGE[1] + lokal[1],
            steg_z(ANTAL_KLIV) + lokal[2])


def varulage(t: float) -> dict:
    """Varans lage vid tiden t: vridplattans mitt pa stegets yta, lutning (+ = framat) och steg."""
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
            lut = -math.radians(1.6) * mjuk(led(t, t0 - 0.12, t0))
        if t >= t0:
            s = (t - t0) / HOPP_TID
            lyft = 0.07
            a = 2 * lyft + 2 * math.sqrt(lyft * lyft + lyft * STIG)
            b = -STIG - a
            y = blanda(steg_y(steg), steg_y(nasta), mjuk(s) * 0.35 + s * 0.65)
            z = steg_z(steg) + a * s + b * s * s
            lut = -math.radians(1.6) * (1 - s) ** 2 + math.radians(4.0) * math.sin(math.pi * s)
    if steg >= 1:                    # fjadrande ram: avklingande gungning efter landningen
        tau = t - landningstid(steg)
        lut += math.radians(dampad_svang(tau, 2.4, 10.0, 4.2))
        z += 0.005 * math.exp(-16 * tau) * abs(math.sin(2 * math.pi * 5.0 * tau))
    tau = t - T_STAMPEL              # stampeln slar i steget framfor: varan gungar till
    if tau >= 0:
        lut += math.radians(dampad_svang(tau, 1.8, 6.5, 3.3))
    return {"x": PRODUKT_X, "y": y, "z": z, "lut": lut, "steg": steg}


bricklage = varulage


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
    """Solens och framljusets mal per bildruta: foljer varan mjukt, med lite efterslap."""
    lage = {"y": steg_y(0), "z": steg_z(0) + 0.6}
    bana = {}
    k = 1 - math.exp(-(1 / FPS) / 0.16)
    for f in range(-2, int(12.0 * FPS) + 3):
        p = varulage(f / FPS)
        lage["y"] += (p["y"] - lage["y"]) * k
        lage["z"] += (steg_z(p["steg"]) + 0.6 - lage["z"]) * k
        bana[f] = (PRODUKT_X, lage["y"], lage["z"])
    return bana


def solspets(t: float, mal) -> tuple[float, float, float]:
    """Var solen (spotljuset) star vid tiden t, sett fran malet."""
    r = sol(klocka(t))["riktning"]
    return tuple(m + SOL_AVSTAND * c for m, c in zip(mal, r))


def val() -> dict:
    return json.loads((PRODUKTER / "val.json").read_text(encoding="utf-8"))


def las_produkt(slug: str | None = None) -> dict:
    slug = slug or val()["trappa"]
    varor = json.loads((PRODUKTER / "varor.json").read_text(encoding="utf-8"))
    if slug not in varor:
        raise SystemExit(f"hittar inte varan {slug!r} i varor.json (kor python -m film.varudata {slug})")
    return varor[slug]


def _centrera_pa(rot, vrid) -> None:
    """Lagger varans fotavtryck mitt pa vridplattan."""
    bpy.context.view_layer.update()
    lo, hi = Vector((1e9, 1e9, 1e9)), Vector((-1e9, -1e9, -1e9))
    for o in rot.children_recursive:
        if o.type == "MESH":
            for c in o.bound_box:
                w = o.matrix_world @ Vector(c)
                lo = Vector(map(min, lo, w))
                hi = Vector(map(max, hi, w))
    rot.parent = vrid
    rot.location = (-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, 0.0)


def bygg(produkt: dict, look: dict | None = None) -> dict:
    """Bygger trappan, varan pa vridplattan, stampeln och ljuset, och nycklar rorelserna for 0-12 s."""
    look = look or {}
    sc = b3d.ny_scen()
    fasta = b3d.samling("fasta")       # allt fast: blir hallout i volympasset
    ljus = b3d.samling("ljus")

    # ---------- material
    m_golv = b3d.svart_sten("golv", strav=look.get("golv_strav", 0.06), variation=0.025)
    m_sten = b3d.svart_sten("sten", strav=0.16, variation=0.04)
    # stegen ar djupa och syns ovanifran: satinborstat guld, sa att de inte blir en spegel for ljuslådorna
    # och sa att varans skugga syns tydligt over dem
    m_guld_borstat = b3d.guld("guld_borstat", strav=look.get("trapp_strav", 0.38), borstat=True)
    m_guld = b3d.guld("guld_blankt", strav=0.14)
    m_kram = b3d.lack("kramlack", hex_lin("#FBF6EC"), strav=0.42)
    m_svartlack = b3d.lack("svartlack", (0.006, 0.006, 0.007), strav=0.22)
    m_siffra = b3d.ljusmaterial("siffra", (1.0, 0.60, 0.20), styrka=look.get("siffra_styrka", 12.0),
                                objektstyrd=True, vilofarg=(0.55, 0.38, 0.16))

    b3d.golv("golv", 90, m_golv, fasta)

    # ---------- trappan
    siffror = []
    pilar: dict[int, bpy.types.Object] = {}
    for i in range(N):
        z = steg_z(i)
        djup = DJUP + (AVSATS if i == 0 else 0)
        yc = steg_y(i) + (AVSATS / 2 if i == 0 else 0)
        b3d.lada(f"kropp{i}", (BREDD, djup, z - PLATTA), (0, yc, (z - PLATTA) / 2), m_sten, fas=0.005, coll=fasta)
        b3d.lada(f"platta{i}", (BREDD + 0.03, djup + 0.022, PLATTA), (0, yc - 0.011, z - PLATTA / 2),
                 m_guld_borstat, fas=0.006, coll=fasta)
        s = b3d.text(f"timme{i}", f"{7 + i:02d}", "Newsreader-Display-SemiBold.ttf", 0.25, djup=0.005, material=m_siffra,
                     coll=fasta)
        bredd_siffror, _ = b3d.centrera(s)
        ys, zc = sattsteg(i)
        s.location = (SIFFROR_X, ys - 0.003, zc)
        s.color = (1, 1, 1, VILA)
        siffror.append(s)
        # pilen nedat: fran 08 och framat har priset gatt ner ett steg
        if i >= 1:
            pil = b3d.text(f"pil{i}", "↓", "Geist-Medium.ttf", 0.18, djup=0.005, material=m_siffra, coll=fasta)
            bredd_pil, _ = b3d.centrera(pil)
            pil.location = (SIFFROR_X + bredd_siffror / 2 + 0.06 + bredd_pil / 2, ys - 0.003, zc)
            pil.color = (1, 1, 1, VILA)
            pilar[i] = pil

    # ---------- varan pa vridplattan
    rot = b3d.tom("vara_rot", coll=fasta)       # vridplattans mitt pa stegets yta
    from .modeller import delar
    skiva = delar.svarv("vridskiva", [(0.0, 0.002), (VRID_R - 0.004, 0.002), (VRID_R, 0.006), (VRID_R, VRID_H - 0.010),
                                      (VRID_R - 0.004, VRID_H - 0.006), (0.0, VRID_H - 0.006)], m_svartlack, fasta, seg=160)
    kant = delar.svarv("vridkant", [(VRID_R - 0.0015, VRID_H - 0.011), (VRID_R + 0.002, VRID_H - 0.011),
                                    (VRID_R + 0.004, VRID_H - 0.006), (VRID_R + 0.002, VRID_H), (VRID_R - 0.022, VRID_H),
                                    (VRID_R - 0.024, VRID_H - 0.006), (VRID_R - 0.0015, VRID_H - 0.006)],
                       m_guld, fasta, seg=160)
    vrid = b3d.tom("vrid", (0, 0, VRID_H), fasta)
    for o in (skiva, kant, vrid):
        o.parent = rot
    vara = modeller.bygg(produkt["slug"], fasta)
    _centrera_pa(vara, vrid)

    # ---------- prisskylten bredvid vridplattan: foljer med i varje kliv och visar timmens pris
    skylt_rot = b3d.tom("skylt_rot", (SKYLT_LAGE[0], SKYLT_LAGE[1], 0.0), fasta)
    sk_b, sk_h = SKYLT_B, SKYLT_H
    sk = b3d.rundad_skiva("skylt", sk_b, sk_h, 0.02, 0.016, m_kram, fas=0.003, coll=fasta)
    sk_ram = b3d.rundad_skiva("skylt_ram", sk_b + 0.016, sk_h + 0.016, 0.028, 0.024, m_guld, fas=0.002, coll=fasta,
                              hal=(sk_b - 0.004, sk_h - 0.004, 0.014))
    sk_fot = b3d.lada("skylt_fot", (0.26, 0.11, 0.022), (0, 0, 0.011), m_guld_borstat, fas=0.004, coll=fasta)
    for o in (sk, sk_ram):
        o.location = (0, 0, SKYLT_FOT + sk_h / 2)
    tryck = []
    for k in range(ANTAL_KLIV + 1):
        tex = UT / "tex" / f"skylt{7 + k:02d}.png"
        if not tex.exists():
            raise SystemExit(f"saknar {tex.name}: kor python -m film.texturer")
        m_sk = b3d.bildlack(f"skylt_tryck{k}", b3d.bild(tex), ton=hex_lin("#FBF6EC"), strav=0.42)
        pl = b3d.plan_xz(f"skylt_tryck{k}", sk_b - 0.012, sk_h - 0.012, m_sk, fasta)
        pl.location = (0, -0.0108, SKYLT_FOT + sk_h / 2)
        pl.parent = skylt_rot
        tryck.append(pl)
    for o in (sk, sk_ram, sk_fot):
        o.parent = skylt_rot
    skylt_rot.rotation_euler = tuple(math.radians(v) for v in SKYLT_VINKEL)
    skylt_rot.parent = rot

    # ---------- stampeln SALD: orange platta i loggans farg, slar ned pa prisskylten och tacker priset
    m_stampel = b3d.principled("stampel", tuple(c * 0.22 for c in hex_lin("#FE6D22")), 0.0, 0.34,
                               **{"Coat Weight": 1.0, "Coat Roughness": 0.06,
                                  "Emission Color": (*hex_lin("#FE6D22"), 1), "Emission Strength": look.get("stampel_glod", 0.72)})
    m_stampel_text = b3d.principled("stampel_text", hex_lin("#FFF6E8"), 0.0, 0.4,
                                    **{"Emission Color": (*hex_lin("#FFF1DC"), 1), "Emission Strength": look.get("stampel_text_glod", 0.55)})
    st_rot = b3d.tom("stampel_rot", coll=fasta)
    st_b, st_h, st_t = 0.74, 0.27, 0.03
    st_platta = b3d.rundad_skiva("stampel_platta", st_b, st_h, st_t, 0.045, m_stampel, fas=0.005, coll=fasta)
    st_text = b3d.text("stampel_text", "SÅLD", "Geist-Black.ttf", 0.178, djup=0.008, fas=0.0012, material=m_stampel_text,
                       coll=fasta, avstand=1.08)
    st_text.location = (0.004, -st_t / 2 - 0.003, -0.003)
    st_linje = b3d.rundad_skiva("stampel_linje", st_b - 0.045, st_h - 0.045, 0.004, 0.028, m_stampel_text, fas=0.0,
                                coll=fasta, hal=(st_b - 0.045 - 0.012, st_h - 0.045 - 0.012, 0.022))
    st_linje.location = (0, -st_t / 2 - 0.001, 0)
    for o in (st_platta, st_text, st_linje):
        o.parent = st_rot
    # stampeln ar barn till skylten: den landar platt mot kortet, over priset, och gungar med nar traffen
    # far varan och skylten att ga till
    st_rot.parent = skylt_rot
    st_y = -0.010 - st_t / 2 - 0.006       # framfor kortet och ramen
    st_z = SKYLT_PRIS_Z
    st_vinkel = math.radians(-6.0)

    def stampel_fn(t):
        t0 = T_STAMPEL - STAMPEL_FLYG
        if t < t0:
            return {"location": (0.0, st_y - 8.0, st_z), "rotation_euler": (0, st_vinkel, 0), "scale": (0.0001,) * 3}
        k = in_kub(led(t, t0, T_STAMPEL))
        tau = t - T_STAMPEL
        tryck_in = 0.0 if tau < 0 else 0.06 * math.exp(-tau * 30)      # liten studs i skalan vid traffen
        sk_ = STAMPEL_SKALA * blanda(2.7, 1.0, k) * (1 + tryck_in)
        return {"location": (blanda(0.3, 0.0, k), blanda(st_y - 3.6, st_y, k), blanda(st_z + 0.6, st_z, k)),
                "rotation_euler": (0, blanda(math.radians(30.0), st_vinkel, k), 0), "scale": (sk_,) * 3}

    # ---------- ljus
    mal = b3d.tom("ljusmal", coll=ljus)
    # 1) solen: ett spotljus som gar bakom varan fran morgon till eftermiddag. Syns som kagla i diset.
    solen = b3d.spot("sol", (0, 8, 10), 1.0, look.get("kagla", 26.0), mjukhet=0.35, radie=look.get("solradie", 0.22),
                     farg=(1.0, 0.9, 0.8), coll=ljus)
    b3d.sikta(solen, mal)
    # 2) mjuk ljuslada framifran som foljer varan (ger inga blankningar, syns inte i diset)
    fram = b3d.ytljus("framljus", (2.6, -9.5, 6.4), 1.0, (1.8, 1.8), farg=(1.0, 0.96, 0.90), spridning=40, coll=ljus)
    fram.visible_glossy = False
    b3d.sikta(fram, mal)
    # 3) stor varm lada hogt bakom: speglas i guldplattorna
    bak = b3d.ytljus("bakljus", (0.0, 9.0, 8.0), 1.0, (9.0, 3.5), farg=(1.0, 0.84, 0.62), coll=ljus)
    b3d.sikta_fast(bak, (0, -5.0, 1.6))
    # svarta skarmar bakom trappan, osynliga for kameran: annars speglas bakljuset i golvet bredvid trappan
    m_skarm = b3d.principled("skarm", (0.0, 0.0, 0.0), 0.0, 1.0)
    for sida in (-1, 1):
        skarm = b3d.lada(f"skarm{sida}", (9.0, 0.02, 12.0), (sida * (BREDD / 2 + 0.05 + 4.5), 1.4, 6.0), m_skarm, coll=ljus)
        skarm.visible_camera = False
        skarm.visible_shadow = False
        skarm.visible_diffuse = False
        skarm.visible_volume_scatter = False
    mottagare = bpy.data.collections.new("bakljus_mottagare")
    trappdelar = bpy.data.collections.new("trappa_mottagare")
    for o in fasta.objects:
        if o.name != "golv" and not o.name.startswith("kropp"):
            mottagare.objects.link(o)
        if o.name.startswith(("platta", "timme", "pil")):      # bara guldet: stenens sidor ska forbli morka
            trappdelar.objects.link(o)
    bak.light_linking.receiver_collection = mottagare
    varudelar = bpy.data.collections.new("vara_mottagare")
    for o in [vara] + list(vara.children_recursive) + [skiva, kant] + list(skylt_rot.children_recursive):
        if o.type == "MESH":
            varudelar.objects.link(o)
    fram.light_linking.receiver_collection = varudelar
    # 4) tva smala kantljus som ritar trappans sidor och stegens framkanter
    kanter = []
    for namn, x in (("kant_v", -6.5), ("kant_h", 6.5)):
        k = b3d.ytljus(namn, (x, -9.0, 3.4), 1.0, (0.4, 6.0), farg=(1.0, 0.82, 0.58), spridning=80, coll=ljus)
        b3d.sikta_fast(k, (0, -6.0, 1.8))
        k.light_linking.receiver_collection = trappdelar
        kanter.append(k)

    E = {"sol": look.get("e_sol", 6800.0), "framljus": look.get("e_fram", 95.0),
         "bakljus": look.get("e_bak", 240.0), "kant_v": look.get("e_kant", 160.0), "kant_h": look.get("e_kant", 160.0)}

    # ---------- nyckla rorelserna (0..12 s plus marginal)
    rutor = range(-2, int(12.0 * FPS) + 3)

    def rot_fn(t):
        p = varulage(t)
        return {"location": (p["x"], p["y"], p["z"]), "rotation_euler": (p["lut"], 0, 0)}

    b3d.baka(rot, rutor, rot_fn)
    b3d.baka(vrid, rutor, lambda t: {"rotation_euler": (0, 0, vridvinkel(t))})
    b3d.baka(st_rot, rutor, stampel_fn)
    # skylten byter pris nar varan landar pa nasta steg: bara ett tryck syns at gangen, och bytet sker
    # mellan tva rutors slutartider (PRISBYTE_NYCKLAR)
    for k, pl in enumerate(tryck):
        b3d.baka(pl, rutor, lambda t, k=k: {"scale": (1.0,) * 3 if skylt_timme(t) == k else (0.0001,) * 3},
                 extra=PRISBYTE_NYCKLAR)

    bana = ljusmalbana()
    lampor = [solen, fram, bak] + kanter
    for f in rutor:
        t = f / FPS
        mal.location = bana[f]
        mal.keyframe_insert("location", frame=f)
        s = sol(klocka(t))
        solen.location = solspets(t, bana[f])
        solen.keyframe_insert("location", frame=f)
        solen.data.color = kelvin_rgb(s["kelvin"])
        solen.data.keyframe_insert("color", frame=f)
        fram.location = (bana[f][0] + 2.6, bana[f][1] - 9.4, bana[f][2] + 3.0)
        fram.keyframe_insert("location", frame=f)
        niva = ljusniva(t)
        for o in lampor:
            lokal = 0.22 if (t >= T_NARBILD and o.name in ("bakljus", "kant_v", "kant_h")) else 1.0
            if o is solen:
                lokal = s["styrka"]
            o.data.energy = E[o.name] * niva * lokal
            o.data.keyframe_insert("energy", frame=f)
        slack = 1.0 - mjukare(led(t, T_SLOCKNAR, T_SLOCKNAR + 0.45))
        for i, siffra in enumerate(siffror):
            siffra.color[3] = siffra_styrka(i, t) * slack
            siffra.keyframe_insert("color", frame=f, index=3)
            if i in pilar:
                pilar[i].color[3] = siffra.color[3]
                pilar[i].keyframe_insert("color", frame=f, index=3)

    if look.get("utan_skylt"):
        for o in [skylt_rot] + list(skylt_rot.children):
            o.hide_render = True
    return {"scen": sc, "fasta": fasta, "ljus": ljus, "bricka": rot, "mal": mal, "skylt": skylt_rot,
            "volymljus": ["sol"], "dis_mitt": (0.5, -6.0, 5.0), "dis_storlek": (22, 34, 10.5)}


# ------------------------------------------------------------------ kameror
def _skak(t: float) -> tuple[float, float, float]:
    """Liten kamerastot vid varje landning och en storre vid stampeln."""
    dx = dz = 0.0
    for k in range(1, ANTAL_KLIV + 1):
        tau = t - landningstid(k)
        if 0 <= tau < 0.35:
            a = 0.006 * math.exp(-tau * 16)
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


def _foljd() -> dict[int, tuple[float, float, float]]:
    """Varans lage per bildruta med ett mjukt efterslap (kritiskt dampat), for kameran att folja."""
    lage = [PRODUKT_X, steg_y(0), steg_z(0)]
    fart = [0.0, 0.0, 0.0]
    w = 2 * math.pi / 0.85
    dt = 1 / FPS
    bana = {}
    for f in range(-2, int(12.0 * FPS) + 3):
        p = varulage(f / FPS)
        mal = (p["x"], p["y"], steg_z(p["steg"]) if f / FPS < landningstid(ANTAL_KLIV) + 0.2 else p["z"])
        for i in range(3):
            acc = w * w * (mal[i] - lage[i]) - 2 * w * fart[i]
            fart[i] += acc * dt
            lage[i] += fart[i] * dt
        bana[f] = tuple(lage)
    return bana


_FOLJD: dict[int, tuple[float, float, float]] | None = None


def foljd(t: float) -> tuple[float, float, float]:
    global _FOLJD
    if _FOLJD is None:
        _FOLJD = _foljd()
    f = max(-2, min(int(12.0 * FPS) + 2, int(round(t * FPS))))
    return _FOLJD[f]


# Oppningen: varan stor pa vridplattan, lagt och snett framifran, med prisskylten nere till vanster. Kameran
# aker in och glider at sidan medan varan snurrar in, sa att det hander nagot fran forsta rutan. Sedan lyfter
# kameran och foljer varan nedfor trappan, med trappan och timmarna under den och rubriken ovanfor.
A_NARA = {"pos": (1.95, -4.9, 0.20), "mal": (-0.10, 0.0, 0.62), "lins": 62.0}
A_VID = {"pos": (2.9, -7.8, 2.35), "mal": (-0.30, -1.05, 0.25), "lins": 52.0}
A_LYFT = (2.35, 3.85)
A_START = 1.20      # forsta rutan star 20 % langre bort och aker in till A_NARA
A_DRIFT = 0.50      # sidoglidning under oppningen (meter)


def kam_A(t: float) -> dict:
    fx, fy, fz = foljd(t)
    w = mjukare(led(t, *A_LYFT))
    inat = blanda(A_START, 1.0, ut_kub(led(t, 0.0, A_LYFT[0])))
    nara = (A_NARA["pos"][0] * inat, A_NARA["pos"][1] * inat, A_NARA["pos"][2])
    rel_pos = blanda(nara, A_VID["pos"], w)
    rel_mal = blanda(A_NARA["mal"], A_VID["mal"], w)
    bage = math.sin(math.pi * w)
    rel_pos = (rel_pos[0] + 0.45 * bage, rel_pos[1] - 0.3 * bage, rel_pos[2] + 0.35 * bage)
    # sidoglidningen under oppningen ger vridplattans rorelse djup
    drift = A_DRIFT * (1 - w) * led(t, 0.0, A_LYFT[0])
    pos = (fx + rel_pos[0] - drift, fy + rel_pos[1], fz + rel_pos[2])
    mal = (fx + rel_mal[0], fy + rel_mal[1], fz + rel_mal[2])
    lins = math.exp(blanda(math.log(A_NARA["lins"]), math.log(A_VID["lins"]), w))
    sk = _skak(t)
    an = _andas(t, 0.010)
    p = varulage(t)
    # skarpan ligger mellan varan och prisskylten framfor den, sa att priset gar att lasa aven i kranakningen
    fokus = (p["x"] + 0.45 * SKYLT_LAGE[0], p["y"] - 0.1 + 0.45 * (SKYLT_LAGE[1] + 0.1), p["z"] + 0.42)
    return {"pos": tuple(a + b + c for a, b, c in zip(pos, sk, an)), "mal": mal, "lins": lins, "blandare": 2.4,
            "fokus": fokus}


# Narbilden: fatoljen och skylten under rubrikerna, timmen 15 till vanster, och skylten (dar SALD slar ned)
# mitt i bild. Inget viktigt nere till hoger, dar apparnas knappar ligger.
B_POS = ((-0.10, -4.90, 1.95), (-0.15, -4.40, 1.85))   # relativt varans plats pa steg 15
B_MAL = (-0.45, -0.40, 0.50)
B_LINS = 42.0


def kam_B(t: float) -> dict:
    k = led(t, T_NARBILD, 12.0)
    bas = (PRODUKT_X, steg_y(ANTAL_KLIV), steg_z(ANTAL_KLIV))
    rel = blanda(*B_POS, mjuk(k) * 0.5 + k * 0.5)
    pos = tuple(b + r for b, r in zip(bas, rel))
    mal = tuple(b + r for b, r in zip(bas, B_MAL))
    sk = _skak(t)
    an = _andas(t, 0.008)
    return {"pos": tuple(a + b + c for a, b, c in zip(pos, sk, an)), "mal": mal, "lins": B_LINS, "blandare": 2.2,
            "fokus": (PRODUKT_X - 0.25, steg_y(ANTAL_KLIV) - 0.30, steg_z(ANTAL_KLIV) + 0.35)}
