"""Scen 4-6: hallen med hundra brickor, glasskivan med de tre loftena och kuben som landar."""
from __future__ import annotations

import math

import bpy

from . import b3d
from .common import (FPS, KUB_HOGER, KUB_TOPP, KUB_VANSTER, UT, blanda, hex_lin, in_kub, in_ut_kub, led, mjuk, mjukare,
                     ut_back, ut_expo, ut_kub)

# ---- hallens matt ----
KOLUMNER, RADER = 10, 10
DX, DY = 1.30, 1.60
BRICKA_B, BRICKA_H, BRICKA_T = 0.74, 0.92, 0.04
FOT_H = 0.03
KROPP_Z = FOT_H + 0.012 + BRICKA_H / 2
LAMP_Z = 4.1
UTVALDA = [(3, 0), (4, 0), (5, 0), (6, 0)]     # (kolumn, rad) for de fyra fynden som vander sig

# ---- tider ----
T_LAMPOR = [12.0, 12.25, 12.5, 12.75, 13.0]
T_VAROR = [14.0, 15.0, 16.0, 17.0]
VAND_TID = 0.48
T_GLAS = 18.0
T_RADER = [18.0, 19.0, 20.0]
T_SJUNK = 21.0
T_KUB_BITAR = [21.75, 21.875, 22.0]            # vanster, hoger, topp klickar pa plats
T_KUB_FALL = 22.2
T_KUB_LANDAR = 22.5
T_SMALNAR = 24.5

GLAS_Y = -8.45
GLAS_B, GLAS_H = 1.04, 2.5
RAD_B = 0.92                                    # textradernas bredd pa glaset (meter)
RAD_PX = [(1800, 520), (1800, 300), (1800, 300)]
RAD_Z = [1.80, 1.50, 1.28]
KUB_PLATS = (0.0, -9.4)
KUB_S = 0.9
KUB_SVAV = 1.45


def plats(i: int, j: int) -> tuple[float, float]:
    return ((i - (KOLUMNER - 1) / 2) * DX, (j - (RADER - 1) / 2) * DY)


def lampniva(k: int, t: float) -> float:
    """Lamprad k: tands med ett klick, dampas bakom glaset och nar kuben kommer, slacks i sista halvsekunden."""
    tau = t - T_LAMPOR[k]
    if tau < 0:
        return 0.0
    v = 1.0 + 0.55 * math.exp(-tau * 11.0)
    v *= blanda(1.0, 0.62, mjuk(led(t, 13.5, 14.0)))      # lugnare bakgrund nar fynden visas
    v *= blanda(1.0, 0.80, mjuk(led(t, 17.6, 18.3)))
    v *= blanda(1.0, 0.09, mjuk(led(t, T_SJUNK, T_SJUNK + 1.0)))
    v *= 1.0 - mjukare(led(t, T_SMALNAR, 25.0))
    return v


def vandning(n: int, t: float) -> tuple[float, float]:
    """Utvald bricka n: vinkel kring Z (pi = ryggen mot kameran) och ett litet lyft under vandningen."""
    t1 = T_VAROR[n]
    k = led(t, t1 - VAND_TID, t1)
    return math.pi * (1 - ut_back(k, 1.25)), 0.035 * math.sin(math.pi * k)


def sjunk(j: int, t: float) -> float:
    """Raderna sjunker undan i golvet, framifran och bakat."""
    return -1.25 * in_kub(led(t, T_SJUNK + 0.035 * j, T_SJUNK + 0.035 * j + 0.6))


def kub_rot(t: float) -> dict:
    """Kubens rot (bottenmitt): svavar medan ytorna klickar ihop, faller och landar."""
    if t < T_KUB_FALL:
        z = KUB_SVAV + 0.03 * math.sin((t - 21.0) * 4.0)
        vrid = math.radians(-26.0) * (1 - mjuk(led(t, 21.2, T_KUB_FALL)))
    elif t < T_KUB_LANDAR:
        s = (t - T_KUB_FALL) / (T_KUB_LANDAR - T_KUB_FALL)
        z = KUB_SVAV * (1 - s * s)
        vrid = 0.0
    else:
        tau = t - T_KUB_LANDAR
        z = 0.022 * math.exp(-tau * 20) * abs(math.sin(2 * math.pi * 5.5 * tau))
        vrid = 0.0
    return {"location": (KUB_PLATS[0], KUB_PLATS[1], z), "rotation_euler": (0, 0, vrid)}


def kub_bit(n: int, t: float, slut, fran, snurr) -> dict:
    """Kubens tre ytor flyger in var for sig och klickar pa plats. Nar den sista sitter tar den hela kuben over."""
    t1 = T_KUB_BITAR[n]
    t0 = t1 - 0.62
    if t < t0 or t >= T_KUB_BITAR[2]:
        return {"location": tuple(a + b for a, b in zip(slut, fran)), "rotation_euler": snurr, "scale": (0.0001,) * 3}
    k = ut_back(led(t, t0, t1), 1.1)
    kr = ut_kub(led(t, t0, t1))
    return {"location": tuple(a + b * (1 - k) for a, b in zip(slut, fran)),
            "rotation_euler": tuple(v * (1 - kr) for v in snurr), "scale": (1.0,) * 3}


def _kubmaterial(namn: str, par, axel: str, glod: float):
    """Loggans tonade orange: fargen ligger som eget ljus sa att den blir densamma oavsett lampor."""
    m = bpy.data.materials.new(namn)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sx = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sx.inputs[0])
    ramp = nt.nodes.new("ShaderNodeMapRange")
    ramp.inputs["From Min"].default_value = -KUB_S / 2
    ramp.inputs["From Max"].default_value = KUB_S / 2
    nt.links.new(sx.outputs[axel], ramp.inputs["Value"])
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs["A"].default_value = (*hex_lin(par[0]), 1)
    mix.inputs["B"].default_value = (*hex_lin(par[1]), 1)
    nt.links.new(ramp.outputs["Result"], mix.inputs["Factor"])
    dm = nt.nodes.new("ShaderNodeMix")
    dm.data_type = "RGBA"
    dm.blend_type = "MULTIPLY"
    dm.inputs["Factor"].default_value = 1.0
    dm.inputs["B"].default_value = (0.07, 0.07, 0.07, 1)
    nt.links.new(mix.outputs["Result"], dm.inputs["A"])
    nt.links.new(dm.outputs["Result"], b.inputs["Base Color"])
    nt.links.new(mix.outputs["Result"], b.inputs["Emission Color"])
    b.inputs["Emission Strength"].default_value = glod
    b.inputs["Roughness"].default_value = 0.36
    b.inputs["Coat Weight"].default_value = 1.0
    b.inputs["Coat Roughness"].default_value = 0.08
    return m


def bygg(tagning: str, look: dict | None = None) -> dict:
    from . import texturer
    look = look or {}
    sc = b3d.ny_scen()
    fasta = b3d.samling("fasta")
    ljus = b3d.samling("ljus")

    m_golv = b3d.svart_sten("golv", strav=look.get("golv_strav", 0.075), variation=0.025)
    m_guld_borstat = b3d.guld("guld_borstat", strav=0.26, borstat=True)
    m_guld = b3d.guld("guld_blankt", strav=0.14)
    m_kram = b3d.lack("kramlack", hex_lin("#FBF6EC"), strav=0.42)
    b3d.golv("golv", 120, m_golv, fasta)

    rutor = range(int(12.0 * FPS) - 2, int(25.0 * FPS) + 3)

    # ---------- hundra brickor (delad geometri)
    skiva0 = b3d.rundad_skiva("bricka_mall", BRICKA_B, BRICKA_H, BRICKA_T, 0.034, m_kram, fas=0.004, coll=fasta)
    ram0 = b3d.rundad_skiva("ram_mall", BRICKA_B + 0.024, BRICKA_H + 0.024, BRICKA_T + 0.012, 0.046, m_guld, fas=0.003,
                            coll=fasta, hal=(BRICKA_B - 0.006, BRICKA_H - 0.006, 0.031))
    fot0 = b3d.lada("fot_mall", (0.36, 0.14, FOT_H), (0, 0, 0), m_guld_borstat, fas=0.006, coll=fasta)
    etikett0 = b3d.text("fynd_mall", "FYND", "Geist-SemiBold.ttf", 0.036, djup=0.002, material=m_guld, coll=fasta, avstand=1.5)
    mallar = (skiva0, ram0, fot0, etikett0)

    radrotter = []
    for j in range(RADER):
        rr = b3d.tom(f"rad{j}", coll=fasta)
        radrotter.append(rr)
        b3d.baka(rr, rutor, lambda t, j=j: {"location": (0, 0, sjunk(j, t))})

    brickrotter = {}
    for j in range(RADER):
        for i in range(KOLUMNER):
            x, y = plats(i, j)
            rot = b3d.tom(f"b_{i}_{j}", (x, y, 0), fasta)
            rot.parent = radrotter[j]
            rot.rotation_euler = (0, 0, math.pi)          # ryggen mot kameran
            brickrotter[(i, j)] = rot
            for mall, lage in ((skiva0, (0, 0, KROPP_Z)), (ram0, (0, 0, KROPP_Z)), (fot0, (0, 0, FOT_H / 2))):
                o = bpy.data.objects.new(f"{mall.name}_{i}_{j}", mall.data)
                fasta.objects.link(o)
                o.location = lage
                o.parent = rot
            nr = j * KOLUMNER + i + 1
            # pa ryggen: FYND och numret i guld
            e = bpy.data.objects.new(f"fynd_{i}_{j}", etikett0.data)
            fasta.objects.link(e)
            e.rotation_euler = (0, 0, math.pi)
            e.location = (0, BRICKA_T / 2 + 0.0015, KROPP_Z + 0.135)
            e.parent = rot
            s = b3d.text(f"nr_{i}_{j}", f"{nr}", "Newsreader-Display-SemiBold.ttf", 0.21, djup=0.003, material=m_guld, coll=fasta)
            s.rotation_euler = (0, 0, math.pi)
            s.location = (0, BRICKA_T / 2 + 0.002, KROPP_Z - 0.03)
            s.parent = rot
    for mall in mallar:
        mall.hide_render = True
        mall.location = (0, 0, -50)

    # de fyra utvalda far sitt kort pa framsidan och vander sig mot kameran
    for n, (i, j) in enumerate(UTVALDA):
        rot = brickrotter[(i, j)]
        tex = UT / "tex" / f"kort{n}.png"
        m_kort = b3d.bildlack(f"kort{n}", b3d.bild(tex), ton=hex_lin("#FBF6EC"), strav=0.42)
        kort = b3d.plan_xz(f"kort{n}", BRICKA_B - 0.012, BRICKA_H - 0.012, m_kort, fasta)
        kort.location = (0, -BRICKA_T / 2 - 0.0008, KROPP_Z)
        kort.parent = rot
        x, y = plats(i, j)

        def fn(t, n=n, x=x, y=y):
            vinkel, lyft = vandning(n, t)
            return {"rotation_euler": (0, 0, vinkel), "location": (x, y, lyft)}

        b3d.baka(rot, rutor, fn)

    # ---------- lamprader (en framfor varje radpar, sa att sidan mot kameran blir belyst)
    m_lampa = b3d.ljusmaterial("lampglas", (1.0, 0.86, 0.66), styrka=look.get("lampglas", 5.0), objektstyrd=True)
    lampor = []
    for k in range(5):
        y = (k * 2 - 0.5 - (RADER - 1) / 2) * DY
        b3d.lada(f"lamphus{k}", (14.6, 0.20, 0.07), (0, y, LAMP_Z + 0.06), m_guld_borstat, fas=0.006, coll=fasta)
        glas = b3d.lada(f"lampglas{k}", (14.4, 0.12, 0.02), (0, y, LAMP_Z + 0.012), m_lampa, coll=fasta)
        glas.color = (1, 1, 1, 0)
        glas.visible_shadow = False
        la = b3d.ytljus(f"lampa{k}", (0, y, LAMP_Z - 0.02), 1.0, (14.2, 0.22), farg=(1.0, 0.90, 0.76), spridning=150, coll=ljus)
        lampor.append((la, glas))
    E_LAMPA = look.get("e_lampa", 430.0)

    # ---------- framljus for de utvalda brickorna (foljer kameran)
    fram_mal = b3d.tom("fram_mal", coll=ljus)
    fram = b3d.ytljus("framljus", (0, -12, 3.2), 1.0, (1.4, 1.4), farg=(1.0, 0.95, 0.88), spridning=50, coll=ljus)
    fram.visible_glossy = False
    b3d.sikta(fram, fram_mal)
    E_FRAM = look.get("e_fram", 26.0)

    # ---------- glasskivan med tre rader
    m_glas = b3d.principled("rokglas", (0.62, 0.60, 0.56), 0.0, 0.03,
                            **{"Transmission Weight": 0.93, "IOR": 1.45, "Coat Weight": 0.4, "Coat Roughness": 0.02})
    glas_rot = b3d.tom("glas_rot", (0, GLAS_Y, 0), fasta)
    skiva = b3d.rundad_skiva("glasskiva", GLAS_B, GLAS_H, 0.03, 0.02, m_glas, fas=0.003, coll=fasta)
    skiva.location = (0, 0, GLAS_H / 2 + 0.03)
    skiva.parent = glas_rot
    for sida in (-1, 1):
        list_ = b3d.lada(f"glaslist{sida}", (0.014, 0.044, GLAS_H), (sida * (GLAS_B / 2 + 0.005), 0, GLAS_H / 2 + 0.03), m_guld, fas=0.003, coll=fasta)
        list_.parent = glas_rot
    sockel = b3d.lada("glassockel", (GLAS_B + 0.10, 0.16, 0.03), (0, 0, 0.015), m_guld_borstat, fas=0.006, coll=fasta)
    sockel.parent = glas_rot
    b3d.baka(glas_rot, rutor, lambda t: {"location": (0, GLAS_Y, blanda(-2.7, 0.0, ut_kub(led(t, 17.45, 18.0)))
                                                      - 2.8 * in_kub(led(t, T_SJUNK, T_SJUNK + 0.55)))})
    for n in range(3):
        tex = b3d.bild(UT / "tex" / f"rad{n}.png")
        m = bpy.data.materials.new(f"rad{n}")
        m.use_nodes = True
        nt = m.node_tree
        nt.nodes.clear()
        ut = nt.nodes.new("ShaderNodeOutputMaterial")
        ti = nt.nodes.new("ShaderNodeTexImage")
        ti.image = tex
        ti.extension = "CLIP"
        em = nt.nodes.new("ShaderNodeEmission")
        em.inputs["Strength"].default_value = look.get("rad_glod", 1.0)
        tr = nt.nodes.new("ShaderNodeBsdfTransparent")
        mx = nt.nodes.new("ShaderNodeMixShader")
        oi = nt.nodes.new("ShaderNodeObjectInfo")
        mu = nt.nodes.new("ShaderNodeMath")
        mu.operation = "MULTIPLY"
        nt.links.new(ti.outputs["Color"], em.inputs["Color"])
        nt.links.new(ti.outputs["Alpha"], mu.inputs[0])
        nt.links.new(oi.outputs["Alpha"], mu.inputs[1])
        nt.links.new(mu.outputs[0], mx.inputs["Fac"])
        nt.links.new(tr.outputs[0], mx.inputs[1])
        nt.links.new(em.outputs[0], mx.inputs[2])
        nt.links.new(mx.outputs[0], ut.inputs["Surface"])
        bpx, hpx = RAD_PX[n]
        rad = b3d.plan_xz(f"rad{n}", RAD_B, RAD_B * hpx / bpx, m, fasta)
        rad.visible_shadow = False
        rad.parent = glas_rot

        def rad_fn(t, n=n):
            k = ut_expo(led(t, T_RADER[n] - 0.30, T_RADER[n]))
            return {"location": (0, -0.019 - 0.24 * (1 - k), RAD_Z[n] + 0.03 * (1 - k)), "scale": (1 + 0.10 * (1 - k),) * 3}

        b3d.baka(rad, rutor, rad_fn)
        for f in rutor:
            t = f / FPS
            a = mjuk(led(t, T_RADER[n] - 0.30, T_RADER[n] - 0.05))
            if t >= T_RADER[n]:
                a *= 1.0 + 0.8 * math.exp(-(t - T_RADER[n]) * 7.0)
            rad.color[3] = min(a, 1.0) if t < T_RADER[n] else a
            rad.keyframe_insert("color", frame=f, index=3)

    # i kubens tagning har glasskivan redan sjunkit: snett fran sidan blev dess text olaslig och bilden rorig
    if tagning == "E":
        for o in [glas_rot] + list(glas_rot.children_recursive):
            o.hide_render = True

    # ---------- kuben: tre orange ytor som blir Fyndplats-kuben
    S, T = KUB_S, 0.03
    glod = look.get("kub_glod", 1.0)
    m_v = _kubmaterial("kub_vanster", (KUB_VANSTER[1], KUB_VANSTER[0]), "Z", glod)
    m_h = _kubmaterial("kub_hoger", (KUB_HOGER[1], KUB_HOGER[0]), "Z", glod)
    m_t = _kubmaterial("kub_topp", KUB_TOPP, "Y", glod)
    m_karna = b3d.principled("kub_karna", hex_lin("#B43C0A"), 0.0, 0.5,
                             **{"Emission Color": (*hex_lin("#D9440E"), 1), "Emission Strength": 0.4})
    kub = b3d.tom("kub_rot", coll=fasta)
    b3d.baka(kub, rutor, kub_rot)
    # den fardiga kuben: ett stycke med loggans tre ytor
    hel = b3d.lada("kub", (S, S, S), (0, 0, S / 2), None, fas=0.014, coll=fasta)
    for m in (m_karna, m_t, m_v, m_h):
        hel.data.materials.append(m)
    for p in hel.data.polygons:
        nx, ny, nz = p.normal
        p.material_index = 1 if nz > 0.6 else 2 if ny < -0.6 else 3 if nx > 0.6 else 0
    hel.parent = kub
    b3d.baka(hel, rutor, lambda t: {"scale": ((1.0,) * 3 if t >= T_KUB_BITAR[2] else (0.0001,) * 3)})
    # de tre ytorna som flyger in: vanster (normal -y), hoger (normal +x), topp
    bitar = [
        ("kub_bit_v", (S, T, S), (0, -S / 2 + T / 2, S / 2), m_v, (-3.4, -3.4, 0.7), (0.0, 0.0, math.radians(-150))),
        ("kub_bit_h", (T, S, S), (S / 2 - T / 2, 0, S / 2), m_h, (3.4, 3.4, 0.7), (0.0, 0.0, math.radians(150))),
        ("kub_bit_t", (S, S, T), (0, 0, S - T / 2), m_t, (0.0, 0.0, 4.4), (math.radians(160), 0.0, math.radians(60))),
    ]
    for n, (namn, storlek, slut, mat, fran, snurr) in enumerate(bitar):
        o = b3d.lada(namn, storlek, (0, 0, 0), mat, fas=0.008, coll=fasta)
        o.parent = kub
        b3d.baka(o, rutor, lambda t, n=n, slut=slut, fran=fran, snurr=snurr: kub_bit(n, t, slut, fran, snurr))

    # kubens stralkastare: tands nar brickorna sjunker, smalnar av i sista halvsekunden
    kubmal = b3d.tom("kubmal", (KUB_PLATS[0], KUB_PLATS[1], 0.45), ljus)
    kubspot = b3d.spot("kubspot", (KUB_PLATS[0] + 0.6, KUB_PLATS[1] - 0.8, 10.5), 1.0, 20.0, mjukhet=0.25, radie=0.08,
                       farg=(1.0, 0.90, 0.76), coll=ljus)
    b3d.sikta(kubspot, kubmal)
    E_KUBSPOT = look.get("e_kubspot", 900.0)

    # ---------- nyckla ljusen
    for f in rutor:
        t = f / FPS
        for k, (la, glas) in enumerate(lampor):
            niva = lampniva(k, t)
            la.data.energy = E_LAMPA * niva
            la.data.keyframe_insert("energy", frame=f)
            glas.color[3] = niva
            glas.keyframe_insert("color", frame=f, index=3)
        if t < T_SJUNK:
            kv = kam_CD(t)
            fram.location = (kv["pos"][0] + 0.9, kv["pos"][1] - 0.6, kv["pos"][2] + 2.2)
            fram_mal.location = (kv["mal"][0], kv["mal"][1], 0.55)
        fram.keyframe_insert("location", frame=f)
        fram_mal.keyframe_insert("location", frame=f)
        fram.data.energy = E_FRAM * mjuk(led(t, 13.5, 14.0)) * (1 - mjuk(led(t, 17.7, 18.2)))
        fram.data.keyframe_insert("energy", frame=f)
        pa = mjuk(led(t, T_SJUNK, T_SJUNK + 0.5))
        smal = mjukare(led(t, T_SMALNAR, 25.0))
        blixt = 1 + (0.8 * math.exp(-(t - T_KUB_LANDAR) * 10) if t >= T_KUB_LANDAR else 0.0)
        kubspot.data.energy = E_KUBSPOT * pa * blixt * (1 - 0.5 * smal)
        kubspot.data.keyframe_insert("energy", frame=f)
        kubspot.data.spot_size = math.radians(blanda(20.0, 6.5, smal))
        kubspot.data.keyframe_insert("spot_size", frame=f)

    volymljus = [la.name for la, _ in lampor] + ["kubspot"]
    return {"scen": sc, "fasta": fasta, "ljus": ljus, "volymljus": volymljus,
            "dis_mitt": (0, -2.0, LAMP_Z / 2 + 3.0), "dis_storlek": (34, 44, LAMP_Z + 6.4)}


# ------------------------------------------------------------------ kameror
VID_POS = ((0.8, -17.2, 5.3), (0.5, -15.6, 4.5))
VID_MAL = ((0.0, -2.0, 1.5), (0.0, -2.6, 1.2))
NARA_Y = -9.84
NARA_Z = 0.95
NER = (13.35, 14.02)          # kameran sanker sig till forsta fyndet


def _vara_x(t: float) -> float:
    """Kamerans sidled langs framre raden: kliver till nasta fynd och landar pa slaget."""
    xs = [plats(i, j)[0] for i, j in UTVALDA]
    x = xs[0]
    for n in range(1, len(xs)):
        if t < T_VAROR[n] - 0.46:
            break
        x = blanda(x, xs[n], in_ut_kub(led(t, T_VAROR[n] - 0.46, T_VAROR[n] - 0.02)))
    return x


def kam_CD(t: float) -> dict:
    # vid bild over hallen
    kv = led(t, 12.0, NER[1])
    vid_pos = blanda(*VID_POS, kv)
    vid_mal = blanda(*VID_MAL, kv)
    # nara: framfor de utvalda brickorna
    x = _vara_x(t)
    andas = 0.03 * math.sin((t - 14.0) * 1.3)
    nara_pos = (x + 0.10, NARA_Y + andas, NARA_Z)
    nara_mal = (x, plats(0, 0)[1], KROPP_Z - 0.02)
    w = mjukare(led(t, *NER))
    pos = blanda(vid_pos, nara_pos, w)
    mal = blanda(vid_mal, nara_mal, w)
    lins = math.exp(blanda(math.log(30.0), math.log(52.0), w))
    fokus = blanda((0.0, -4.0, 0.6), (x, plats(0, 0)[1] - BRICKA_T, KROPP_Z), w)
    blandare = blanda(2.8, 2.0, w)
    # scen 5: kameran backar, glasskivan reser sig och skarpan flyttar till glaset
    g = mjukare(led(t, 17.72, 18.45))
    if g > 0:
        dolly = 0.22 * led(t, 18.0, 21.0)
        glas_pos = (0.06, -12.05 + dolly, 1.36)
        glas_mal = (0.0, GLAS_Y, 1.40)
        pos = blanda(pos, glas_pos, g)
        bage = math.sin(math.pi * g)
        pos = (pos[0] + 0.35 * bage, pos[1], pos[2] + 0.10 * bage)
        mal = blanda(mal, glas_mal, g)
        lins = math.exp(blanda(math.log(lins), math.log(64.0), g))
        fokus = blanda(fokus, (0.0, GLAS_Y - 0.02, 1.5), mjukare(led(t, 17.8, 18.3)))
        blandare = blanda(blandare, 1.6, g)
    return {"pos": pos, "mal": mal, "lins": lins, "blandare": blandare, "fokus": fokus}


E_LINS = 84.0
E_AVST = (11.6, 10.9)
E_MAL_NER = 0.90             # siktpunkten ligger framfor och under kuben, sa att kuben hamnar i bildens ovre halft


def kam_E(t: float) -> dict:
    """Kuben fran loggans vinkel: snett framifran-ovanifran, lang lins."""
    k = led(t, 21.0, 25.0)
    avst = blanda(*E_AVST, mjuk(k))
    hojd = math.radians(31.0)
    sida = math.radians(45.0)
    cx, cy = KUB_PLATS
    mitt = (cx, cy, KUB_S / 2)
    rikt = (math.cos(hojd) * math.sin(sida), -math.cos(hojd) * math.cos(sida), math.sin(hojd))
    pos = tuple(m + avst * r for m, r in zip(mitt, rikt))
    # skarmens upp-riktning i varlden: flytta siktpunkten nerat langs den
    upp = (-math.sin(hojd) * math.sin(sida), math.sin(hojd) * math.cos(sida), math.cos(hojd))
    mal = tuple(m - E_MAL_NER * u for m, u in zip(mitt, upp))
    # kameran foljer kuben i hojdled medan den svavar och faller, och landar med den
    kub_z = kub_rot(t)["location"][2]
    mal = (mal[0], mal[1], mal[2] + 0.85 * kub_z)
    tau = t - T_KUB_LANDAR
    if 0 <= tau < 0.6:
        a = 0.035 * math.exp(-tau * 9)
        pos = (pos[0] + a * 0.6 * math.sin(2 * math.pi * 9 * tau), pos[1], pos[2] - a * math.cos(2 * math.pi * 12 * tau))
    return {"pos": pos, "mal": mal, "lins": E_LINS, "blandare": 2.8, "fokus": (cx, cy, KUB_S * 0.6)}


KAMEROR = {"C": kam_CD, "D": kam_CD, "E": kam_E}
