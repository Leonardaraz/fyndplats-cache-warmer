"""Scen 4-6: visningsrummet med dagens fynd, glasskivan med de tre loftena och kuben som landar.

Fyra varor, riktiga 3D-modeller (film/modeller), star pa svarta stenpiedestaler i en diagonal som gar bakat
genom den morka studion. Spotljusen tands i takt, kameran gar fram till varje vara och varan vander sig mot
den pa sin vridplatta. Kvallssolen kommer fran sidan, och SALD slar ned pa tva av plaketterna.
"""
from __future__ import annotations

import json
import math

import bpy
from mathutils import Vector

from . import b3d, modeller
from .common import (FPS, KUB_HOGER, KUB_TOPP, KUB_VANSTER, PRODUKTER, UT, blanda, hex_lin, in_kub, in_ut_kub,
                     kelvin_rgb, klocka, led, mjuk, mjukare, sol, ut_back, ut_expo, ut_kub)

# ---- visningsrummets matt ----
PIEDESTAL = (1.30, 1.05, 0.34)        # bredd, djup, hojd
PLATTA = 0.03
PLAKETT_B, PLAKETT_H = 0.66, 0.20
PLATSER = [(-1.95, -3.9), (-0.65, -1.3), (0.65, 1.3), (1.95, 3.9)]   # en diagonal som gar bakat at hoger
STARTVINKEL = [-62.0, 58.0, -48.0, 64.0]                              # varorna innan de vander sig mot kameran
SALDA = {1: 15.25}                                                   # vara -> tiden da SALD slar ned
SPOTNIVA = [1.0, 0.8, 0.25, 0.25]                                    # ljust tra och ljus sten far mindre ljus an guld
FRAMNIVA = [1.0, 1.0, 0.25, 0.25]                                    # framljuset vid varje vara, samma skal
LAMP_Z = 6.4

# ---- tider ----
T_LAMPOR = [12.0, 12.25, 12.5, 12.75]
T_VAROR = [14.0, 15.0, 16.0, 17.0]
VAND_TID = 0.50
T_GLAS = 18.0
T_RADER = [18.0, 19.0, 20.0]
T_SJUNK = 21.0
T_KUB_BITAR = [21.75, 21.875, 22.0]            # vanster, hoger, topp klickar pa plats
# den hela kuben tar over fran ytorna en halv ruta fore sista klicket, mellan tva rutors slutartider
F_KUB_BYTE = T_KUB_BITAR[2] * FPS - 0.5
T_KUB_BYTE = F_KUB_BYTE / FPS
KUB_BYTE_NYCKLAR = (F_KUB_BYTE - 0.05, F_KUB_BYTE + 0.05)
T_KUB_FALL = 22.2
T_KUB_LANDAR = 22.5
T_SMALNAR = 24.5
STAMPEL_FLYG = 0.20

GLAS_PLATS = (PLATSER[3][0] + 0.10, PLATSER[3][1] - 2.30)
GLAS_Y = GLAS_PLATS[1]
GLAS_B, GLAS_H = 1.04, 2.5
RAD_B = 0.92                                    # textradernas bredd pa glaset (meter)
RAD_PX = [(1800, 520), (1800, 300), (1800, 300)]
RAD_Z = [1.80, 1.50, 1.28]
KUB_PLATS = (-0.35, -6.4)
KUB_S = 0.9
KUB_SVAV = 1.45


def lampniva(k: int, t: float) -> float:
    """Spotljus k: tands med ett klick, dampas bakom glaset och nar kuben kommer, slacks i sista halvsekunden."""
    tau = t - T_LAMPOR[k]
    if tau < 0:
        return 0.0
    v = 1.0 + 0.55 * math.exp(-tau * 11.0)
    v *= blanda(1.0, 0.80, mjuk(led(t, 17.6, 18.3)))
    v *= blanda(1.0, 0.09, mjuk(led(t, T_SJUNK, T_SJUNK + 1.0)))
    v *= 1.0 - mjukare(led(t, T_SMALNAR, 25.0))
    return v


def vandning(n: int, t: float) -> float:
    """Vara n vander sig mot kameran pa sin vridplatta nar kameran kommer fram (landar pa slaget)."""
    t1 = T_VAROR[n]
    k = led(t, t1 - VAND_TID, t1)
    return math.radians(STARTVINKEL[n]) * (1 - ut_back(k, 1.15))


def sjunk(j: int, t: float) -> float:
    """Piedestalerna sjunker undan i golvet, framifran och bakat."""
    return -1.6 * in_kub(led(t, T_SJUNK + 0.05 * j, T_SJUNK + 0.05 * j + 0.65))


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
    if t < t0:
        return {"location": tuple(a + b for a, b in zip(slut, fran)), "rotation_euler": snurr, "scale": (0.0001,) * 3}
    if t >= T_KUB_BYTE:
        # ytan stannar dar den klickade fast. Flog den tillbaka till sin startpunkt syntes resan som
        # en orange spokbild i rorelseoskarpan pa rutan fore bytet (Black Friday-filmen, ruta 659).
        return {"location": tuple(slut), "rotation_euler": (0.0, 0.0, 0.0), "scale": (0.0001,) * 3}
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


def _stampel(namn: str, coll, look):
    """SALD-stampeln: samma orange platta som i trappan."""
    m_stampel = b3d.principled(f"{namn}_mat", tuple(c * 0.22 for c in hex_lin("#FE6D22")), 0.0, 0.34,
                               **{"Coat Weight": 1.0, "Coat Roughness": 0.06,
                                  "Emission Color": (*hex_lin("#FE6D22"), 1), "Emission Strength": look.get("stampel_glod", 0.72)})
    m_text = b3d.principled(f"{namn}_textmat", hex_lin("#FFF6E8"), 0.0, 0.4,
                            **{"Emission Color": (*hex_lin("#FFF1DC"), 1), "Emission Strength": look.get("stampel_text_glod", 0.55)})
    rot = b3d.tom(namn, coll=coll)
    b, h, t = 0.62, 0.23, 0.026
    platta = b3d.rundad_skiva(f"{namn}_platta", b, h, t, 0.04, m_stampel, fas=0.004, coll=coll)
    text = b3d.text(f"{namn}_text", "SÅLD", "Geist-Black.ttf", 0.150, djup=0.007, fas=0.001, material=m_text, coll=coll,
                    avstand=1.08)
    text.location = (0.003, -t / 2 - 0.003, -0.003)
    linje = b3d.rundad_skiva(f"{namn}_linje", b - 0.04, h - 0.04, 0.004, 0.024, m_text, fas=0.0, coll=coll,
                             hal=(b - 0.04 - 0.011, h - 0.04 - 0.011, 0.019))
    linje.location = (0, -t / 2 - 0.001, 0)
    for o in (platta, text, linje):
        o.parent = rot
    return rot, t


def _val() -> list[str]:
    return json.loads((PRODUKTER / "val.json").read_text(encoding="utf-8"))["hall"]


def _centrera_pa(rot, vrid) -> None:
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


def bygg(tagning: str, look: dict | None = None) -> dict:
    look = look or {}
    sc = b3d.ny_scen()
    fasta = b3d.samling("fasta")
    ljus = b3d.samling("ljus")

    m_golv = b3d.svart_sten("golv", strav=look.get("golv_strav", 0.075), variation=0.025)
    m_sten = b3d.svart_sten("sten", strav=0.16, variation=0.04)
    m_guld_borstat = b3d.guld("guld_borstat", strav=0.26, borstat=True)
    m_guld = b3d.guld("guld_blankt", strav=0.14)
    m_svartlack = b3d.lack("svartlack", (0.006, 0.006, 0.007), strav=0.22)
    b3d.golv("golv", 120, m_golv, fasta)

    rutor = range(int(12.0 * FPS) - 2, int(25.0 * FPS) + 3)
    from .modeller import delar

    # ---------- fyra piedestaler med var sin vara pa en vridplatta och en plakett med priset
    pb, pd, ph = PIEDESTAL
    varor = _val()
    vridar = []
    varudelar = []          # framljuset lyser bara pa varorna: inte pa plaketterna, glaset eller stamplarna
    for n, (x, y) in enumerate(PLATSER):
        sank = b3d.tom(f"piedestal{n}", (x, y, 0), fasta)
        b3d.baka(sank, rutor, lambda t, n=n, x=x, y=y: {"location": (x, y, sjunk(n, t))})
        kropp = b3d.lada(f"piedestal_kropp{n}", (pb, pd, ph - PLATTA), (0, 0, (ph - PLATTA) / 2), m_sten, fas=0.005, coll=fasta)
        topp = b3d.lada(f"piedestal_platta{n}", (pb + 0.02, pd + 0.02, PLATTA), (0, 0, ph - PLATTA / 2), m_guld_borstat,
                        fas=0.005, coll=fasta)
        skiva = delar.svarv(f"vridskiva{n}", [(0.0, 0.0), (0.46, 0.0), (0.465, 0.004), (0.465, 0.026), (0.46, 0.03),
                                              (0.0, 0.03)], m_svartlack, fasta, seg=128, plats=(0, 0, ph))
        kant = delar.ring(f"vridkant{n}", 0.462, 0.004, (0, 0, ph + 0.03), mat=m_guld, coll=fasta, seg=(128, 8))
        vrid = b3d.tom(f"vrid{n}", (0, 0, ph + 0.03), fasta)
        tex = UT / "tex" / f"kort{n}.png"
        delar_ = [kropp, topp, skiva, kant, vrid]
        if tex.exists():
            m_kort = b3d.bildlack(f"plakett{n}", b3d.bild(tex), ton=tuple(c * 0.9 for c in hex_lin("#FBF6EC")), strav=0.42,
                                  sken=look.get("plakett_sken", 0.22))
            kort = b3d.plan_xz(f"plakett{n}", PLAKETT_B, PLAKETT_H, m_kort, fasta)
            kort.location = (0, -pd / 2 - 0.0035, (ph - PLATTA) / 2)
            ram = b3d.rundad_skiva(f"plakett_ram{n}", PLAKETT_B + 0.02, PLAKETT_H + 0.02, 0.006, 0.012, m_guld, fas=0.0015,
                                   coll=fasta, hal=(PLAKETT_B - 0.002, PLAKETT_H - 0.002, 0.008))
            ram.location = (0, -pd / 2 - 0.0028, (ph - PLATTA) / 2)
            delar_ += [kort, ram]
        for o in delar_:
            o.parent = sank
        vara = modeller.bygg(varor[n], fasta)
        _centrera_pa(vara, vrid)
        varudelar.extend([o for o in [vara] + list(vara.children_recursive) if o.type == "MESH"])
        b3d.baka(vrid, rutor, lambda t, n=n: {"rotation_euler": (0, 0, vandning(n, t))})
        vridar.append(vrid)

    # SALD pa tva av plaketterna nar kvallen kommer
    stamplar = []
    for n, ts in SALDA.items():
        x, y = PLATSER[n]
        st, st_t = _stampel(f"stampel{n}", fasta, look)
        st_y = y - pd / 2 - 0.006 - st_t / 2
        st_z = (ph - PLATTA) / 2

        def fn(t, ts=ts, x=x, st_y=st_y, st_z=st_z, n=n):
            t0 = ts - STAMPEL_FLYG
            dz = sjunk(n, t)
            if t < t0:
                return {"location": (x, st_y - 6.0, st_z), "rotation_euler": (0, math.radians(-5), 0), "scale": (0.0001,) * 3}
            k = in_kub(led(t, t0, ts))
            tau = t - ts
            tryck = 0.0 if tau < 0 else 0.06 * math.exp(-tau * 30)
            s = blanda(2.6, 1.0, k) * (1 + tryck)
            return {"location": (x + blanda(0.25, 0.0, k), blanda(st_y - 3.0, st_y, k), blanda(st_z + 0.5, st_z, k) + dz),
                    "rotation_euler": (0, blanda(math.radians(28.0), math.radians(-5), k), 0), "scale": (s,) * 3}

        b3d.baka(st, rutor, fn)
        stamplar.append(st)

    # ---------- spotljus over varje piedestal (kaglor i diset), tands i takt
    m_lampa = b3d.ljusmaterial("lampglas", (1.0, 0.86, 0.66), styrka=look.get("lampglas", 6.0), objektstyrd=True)
    lampor = []
    for k, (x, y) in enumerate(PLATSER):
        hus = b3d.lada(f"lamphus{k}", (0.24, 0.24, 0.10), (x + 0.35, y - 1.5, LAMP_Z + 0.06), m_guld_borstat, fas=0.006, coll=fasta)
        glas = b3d.lada(f"lampglas{k}", (0.16, 0.16, 0.012), (x + 0.35, y - 1.5, LAMP_Z), m_lampa, coll=fasta)
        glas.color = (1, 1, 1, 0)
        glas.visible_shadow = False
        glas.visible_glossy = False      # annars speglas lampglaset som en ljus flack i det blanka golvet
        hus.visible_camera = False
        sp = b3d.spot(f"lampa{k}", (x + 0.35, y - 1.5, LAMP_Z - 0.02), 1.0, look.get("spotkagla", 27.0), mjukhet=0.32,
                      radie=0.08, farg=(1.0, 0.90, 0.76), coll=ljus)
        b3d.sikta_fast(sp, (x, y, PIEDESTAL[2] + 0.5))
        sp.visible_glossy = False        # spotljusets kalla speglas annars som en ljus flack i golvet
        lampor.append((sp, glas))
    E_LAMPA = look.get("e_lampa", 5600.0)

    # ---------- kvallssolen fran sidan: lag, varm, och den kastar varornas skuggor over golvet
    solmal = b3d.tom("solmal", (0.0, 0.0, 0.6), ljus)
    solen = b3d.spot("sol", (12, 6, 3), 1.0, look.get("solkagla", 34.0), mjukhet=0.4, radie=0.3, farg=(1.0, 0.8, 0.6), coll=ljus)
    b3d.sikta(solen, solmal)
    solen.visible_glossy = False     # solens kalla speglades som en ljus flack i det blanka golvet
    E_SOL = look.get("e_sol", 9000.0)

    # ---------- framljus som foljer kameran och lyser upp varan den star vid
    fram_mal = b3d.tom("fram_mal", coll=ljus)
    fram = b3d.ytljus("framljus", (0, -12, 3.2), 1.0, (1.6, 1.6), farg=(1.0, 0.95, 0.88), spridning=50, coll=ljus)
    b3d.sikta(fram, fram_mal)
    mottagare = bpy.data.collections.new("fram_mottagare")
    for o in varudelar:
        mottagare.objects.link(o)
    # framljuset syns i varornas speglingar (guld och glas behover nagot ljust att spegla), men lyser
    # bara pa varorna: plaketterna, glaset och stamplarna nas inte
    fram.light_linking.receiver_collection = mottagare
    E_FRAM = look.get("e_fram", 140.0)
    # stor varm ljuslada bakom raden: kantljus i guldet och glaset, ocksa den bara pa varorna
    kant = b3d.ytljus("kantljus", (0.6, 10.5, 5.2), 1.0, (8.0, 2.4), farg=(1.0, 0.86, 0.66), coll=ljus)
    b3d.sikta_fast(kant, (0.0, 0.0, 0.8))
    kant.light_linking.receiver_collection = mottagare
    kant.visible_camera = False
    E_KANT = look.get("e_kant", 700.0)

    # ---------- glasskivan med tre rader
    m_glas = b3d.principled("rokglas", (0.62, 0.60, 0.56), 0.0, 0.03,
                            **{"Transmission Weight": 0.93, "IOR": 1.45, "Coat Weight": 0.4, "Coat Roughness": 0.02})
    glas_rot = b3d.tom("glas_rot", (GLAS_PLATS[0], GLAS_Y, 0), fasta)
    skiva = b3d.rundad_skiva("glasskiva", GLAS_B, GLAS_H, 0.03, 0.02, m_glas, fas=0.003, coll=fasta)
    skiva.location = (0, 0, GLAS_H / 2 + 0.03)
    skiva.parent = glas_rot
    for sida in (-1, 1):
        list_ = b3d.lada(f"glaslist{sida}", (0.014, 0.044, GLAS_H), (sida * (GLAS_B / 2 + 0.005), 0, GLAS_H / 2 + 0.03), m_guld,
                         fas=0.003, coll=fasta)
        list_.parent = glas_rot
    sockel = b3d.lada("glassockel", (GLAS_B + 0.10, 0.16, 0.03), (0, 0, 0.015), m_guld_borstat, fas=0.006, coll=fasta)
    sockel.parent = glas_rot
    b3d.baka(glas_rot, rutor, lambda t: {"location": (GLAS_PLATS[0], GLAS_Y, blanda(-2.7, 0.0, ut_kub(led(t, 17.45, 18.0)))
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
    hel = b3d.lada("kub", (S, S, S), (0, 0, S / 2), None, fas=0.014, coll=fasta)
    for m in (m_karna, m_t, m_v, m_h):
        hel.data.materials.append(m)
    for p in hel.data.polygons:
        nx, ny, nz = p.normal
        p.material_index = 1 if nz > 0.6 else 2 if ny < -0.6 else 3 if nx > 0.6 else 0
    hel.parent = kub
    b3d.baka(hel, rutor, lambda t: {"scale": ((1.0,) * 3 if t >= T_KUB_BYTE else (0.0001,) * 3)}, extra=KUB_BYTE_NYCKLAR)
    bitar = [
        ("kub_bit_v", (S, T, S), (0, -S / 2 + T / 2, S / 2), m_v, (-3.4, -3.4, 0.7), (0.0, 0.0, math.radians(-150))),
        ("kub_bit_h", (T, S, S), (S / 2 - T / 2, 0, S / 2), m_h, (3.4, 3.4, 0.7), (0.0, 0.0, math.radians(150))),
        ("kub_bit_t", (S, S, T), (0, 0, S - T / 2), m_t, (0.0, 0.0, 4.4), (math.radians(160), 0.0, math.radians(60))),
    ]
    for n, (namn, storlek, slut, mat, fran, snurr) in enumerate(bitar):
        o = b3d.lada(namn, storlek, (0, 0, 0), mat, fas=0.008, coll=fasta)
        o.parent = kub
        b3d.baka(o, rutor, lambda t, n=n, slut=slut, fran=fran, snurr=snurr: kub_bit(n, t, slut, fran, snurr),
                 extra=KUB_BYTE_NYCKLAR)

    # kubens stralkastare: tands nar piedestalerna sjunker, smalnar av i sista halvsekunden
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
            la.data.energy = E_LAMPA * niva * SPOTNIVA[k]
            la.data.keyframe_insert("energy", frame=f)
            glas.color[3] = niva
            glas.keyframe_insert("color", frame=f, index=3)
        s = sol(klocka(t))
        # kvallssolen star till hoger bakom varorna (eftermiddag, sedan allt lagre mot kvallen)
        solen.location = tuple(m + 18.0 * c for m, c in zip(solmal.location, s["riktning"]))
        solen.keyframe_insert("location", frame=f)
        solen.data.color = kelvin_rgb(s["kelvin"])
        solen.data.keyframe_insert("color", frame=f)
        sol_pa = mjuk(led(t, 12.2, 13.6)) * (1 - mjuk(led(t, 19.6, 21.0)))
        solen.data.energy = E_SOL * s["styrka"] * sol_pa
        solen.data.keyframe_insert("energy", frame=f)
        if t < T_SJUNK:
            kv = kam_CD(t)
            fram.location = (kv["pos"][0] + 0.9, kv["pos"][1] - 0.6, kv["pos"][2] + 2.2)
            fram_mal.location = (kv["mal"][0], kv["mal"][1], 0.6)
        fram.keyframe_insert("location", frame=f)
        fram_mal.keyframe_insert("location", frame=f)
        fram.data.energy = E_FRAM * framniva(t) * mjuk(led(t, 13.4, 14.0)) * (1 - mjuk(led(t, 17.7, 18.2)))
        fram.data.keyframe_insert("energy", frame=f)
        kant.data.energy = E_KANT * mjuk(led(t, 12.0, 13.0)) * (1 - mjuk(led(t, T_SJUNK, T_SJUNK + 0.8)))
        kant.data.keyframe_insert("energy", frame=f)
        pa = mjuk(led(t, T_SJUNK, T_SJUNK + 0.5))
        smal = mjukare(led(t, T_SMALNAR, 25.0))
        blixt = 1 + (0.8 * math.exp(-(t - T_KUB_LANDAR) * 10) if t >= T_KUB_LANDAR else 0.0)
        kubspot.data.energy = E_KUBSPOT * pa * blixt * (1 - 0.5 * smal)
        kubspot.data.keyframe_insert("energy", frame=f)
        kubspot.data.spot_size = math.radians(blanda(20.0, 6.5, smal))
        kubspot.data.keyframe_insert("spot_size", frame=f)

    volymljus = [la.name for la, _ in lampor] + ["kubspot", "sol"]
    return {"scen": sc, "fasta": fasta, "ljus": ljus, "volymljus": volymljus,
            "dis_mitt": (0.0, -1.5, LAMP_Z / 2 + 1.5), "dis_storlek": (30, 36, LAMP_Z + 4.0)}


# ------------------------------------------------------------------ kameror
# vidbilden: raden av piedestaler ligger mitt i bild, fran den narmaste nere till vanster till den bortersta
# uppe till hoger, och rubriken har morker ovanfor sig
VID_POS = ((-2.0, -8.8, 2.4), (-1.8, -8.1, 2.15))
VID_MAL = ((-1.0, -0.3, 0.45), (-1.15, -1.0, 0.5))
NER = (13.35, 14.02)          # kameran gar fram till forsta fyndet
NARA_AVST = 3.55
NARA_Z = 1.05
LINS_NARA = 38.0


def _varans_hojd(n: int) -> float:
    return PIEDESTAL[2] + 0.03 + {0: 0.30, 1: 0.62, 2: 0.46, 3: 0.24}.get(n, 0.4)


def _vara_lage(t: float) -> tuple[float, float, float]:
    """Punkten kameran tittar pa i visningsrummet: kliver till nasta fynd och landar pa slaget."""
    x, y = PLATSER[0]
    h = _varans_hojd(0)
    for n in range(1, len(PLATSER)):
        if t < T_VAROR[n] - 0.46:
            break
        k = in_ut_kub(led(t, T_VAROR[n] - 0.46, T_VAROR[n] - 0.02))
        x, y, h = blanda(x, PLATSER[n][0], k), blanda(y, PLATSER[n][1], k), blanda(h, _varans_hojd(n), k)
    return x, y, h


def _varuindex(t: float) -> float:
    """Vilken vara kameran star vid, som ett tal: 1.5 ar mitt emellan vara 1 och 2 (samma tider som _vara_lage)."""
    i = 0.0
    for n in range(1, len(PLATSER)):
        if t < T_VAROR[n] - 0.46:
            break
        i = (n - 1) + in_ut_kub(led(t, T_VAROR[n] - 0.46, T_VAROR[n] - 0.02))
    return i


def framniva(t: float) -> float:
    """Framljusets styrka vid den vara kameran star vid: guldet behover mycket, ljust tra och ljus sten lite."""
    i = _varuindex(t)
    lo = min(int(i), len(FRAMNIVA) - 1)
    hi = min(lo + 1, len(FRAMNIVA) - 1)
    return blanda(FRAMNIVA[lo], FRAMNIVA[hi], i - lo)


def kam_CD(t: float) -> dict:
    kv = led(t, 12.0, NER[1])
    vid_pos = blanda(*VID_POS, kv)
    vid_mal = blanda(*VID_MAL, kv)
    x, y, h = _vara_lage(t)
    andas = 0.03 * math.sin((t - 14.0) * 1.3)
    nara_pos = (x + 0.55, y - NARA_AVST + andas, NARA_Z + 0.25 * (h - 0.75))
    nara_mal = (x - 0.05, y, h)
    w = mjukare(led(t, *NER))
    pos = blanda(vid_pos, nara_pos, w)
    mal = blanda(vid_mal, nara_mal, w)
    lins = math.exp(blanda(math.log(30.0), math.log(LINS_NARA), w))
    fokus = blanda((0.0, -2.0, 0.6), (x, y - 0.3, h), w)
    blandare = blanda(2.8, 2.0, w)
    # scen 5: kameran backar, glasskivan reser sig och skarpan flyttar till glaset
    g = mjukare(led(t, 17.72, 18.45))
    if g > 0:
        dolly = 0.22 * led(t, 18.0, 21.0)
        glas_pos = (GLAS_PLATS[0] + 0.06, GLAS_Y - 3.6 + dolly, 1.36)
        glas_mal = (GLAS_PLATS[0], GLAS_Y, 1.40)
        pos = blanda(pos, glas_pos, g)
        bage = math.sin(math.pi * g)
        pos = (pos[0] + 0.35 * bage, pos[1], pos[2] + 0.10 * bage)
        mal = blanda(mal, glas_mal, g)
        lins = math.exp(blanda(math.log(lins), math.log(64.0), g))
        fokus = blanda(fokus, (GLAS_PLATS[0], GLAS_Y - 0.02, 1.5), mjukare(led(t, 17.8, 18.3)))
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
    upp = (-math.sin(hojd) * math.sin(sida), math.sin(hojd) * math.cos(sida), math.cos(hojd))
    mal = tuple(m - E_MAL_NER * u for m, u in zip(mitt, upp))
    kub_z = kub_rot(t)["location"][2]
    mal = (mal[0], mal[1], mal[2] + 0.85 * kub_z)
    tau = t - T_KUB_LANDAR
    if 0 <= tau < 0.6:
        a = 0.035 * math.exp(-tau * 9)
        pos = (pos[0] + a * 0.6 * math.sin(2 * math.pi * 9 * tau), pos[1], pos[2] - a * math.cos(2 * math.pi * 12 * tau))
    return {"pos": pos, "mal": mal, "lins": E_LINS, "blandare": 2.8, "fokus": (cx, cy, KUB_S * 0.6)}


KAMEROR = {"C": kam_CD, "D": kam_CD, "E": kam_E}
