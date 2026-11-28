"""Byggstenar och material for varumodellerna.

Alla matt i meter. Varans framsida pekar mot -Y (kameran star pa -Y-sidan), Z uppat, och golvet ar z = 0.
Geometrin byggs med bmesh, sa att varje vara blir exakt de matt produktsidan anger.
"""
from __future__ import annotations

import math
import random

import bmesh
import bpy
from mathutils import Matrix, Vector

from .. import b3d


# ------------------------------------------------------------------ objekt ur bmesh
def _obj(namn: str, bm: bmesh.types.BMesh, mat=None, coll=None, mjuk=True, skarp=None) -> bpy.types.Object:
    me = bpy.data.meshes.new(namn)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(namn, me)
    b3d.lanka(o, coll)
    if mat is not None:
        me.materials.append(mat)
    if mjuk:
        me.shade_smooth()
        if skarp is not None:
            me.set_sharp_from_angle(angle=math.radians(skarp))
    else:
        me.shade_flat()
    return o


def forfina(o: bpy.types.Object, niva: int = 1) -> bpy.types.Object:
    """Subdivision surface vid renderingen (mjuka dynor)."""
    md = o.modifiers.new("mjuk", "SUBSURF")
    md.levels = niva
    md.render_levels = niva
    return o


def foralder(barn, rot: bpy.types.Object) -> None:
    for b in barn:
        b.parent = rot


# ------------------------------------------------------------------ former
def ror(namn: str, p0, p1, r: float, mat=None, coll=None, seg: int = 24, lock: bool = True) -> bpy.types.Object:
    """Rak cylinder fran p0 till p1."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=lock, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=d.length)
    m = Matrix.Translation((p0 + p1) / 2) @ d.to_track_quat("Z", "Y").to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=m, verts=bm.verts)
    return _obj(namn, bm, mat, coll, skarp=50)


def ring(namn: str, R: float, r: float, plats=(0, 0, 0), normal=(0, 0, 1), mat=None, coll=None,
         seg=(72, 12)) -> bpy.types.Object:
    """Torus med radien R och godstjockleken r, med normalen som axel."""
    nu, nv = seg
    bm = bmesh.new()
    v = [[bm.verts.new(((R + r * math.cos(2 * math.pi * j / nv)) * math.cos(2 * math.pi * i / nu),
                        (R + r * math.cos(2 * math.pi * j / nv)) * math.sin(2 * math.pi * i / nu),
                        r * math.sin(2 * math.pi * j / nv))) for j in range(nv)] for i in range(nu)]
    for i in range(nu):
        for j in range(nv):
            bm.faces.new((v[i][j], v[(i + 1) % nu][j], v[(i + 1) % nu][(j + 1) % nv], v[i][(j + 1) % nv]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    m = Matrix.Translation(Vector(plats)) @ Vector(normal).to_track_quat("Z", "Y").to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=m, verts=bm.verts)
    return _obj(namn, bm, mat, coll)


def kula(namn: str, r: float, plats=(0, 0, 0), mat=None, coll=None, seg: int = 24) -> bpy.types.Object:
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=r)
    bmesh.ops.translate(bm, vec=Vector(plats), verts=bm.verts)
    return _obj(namn, bm, mat, coll)


def svarv(namn: str, profil, mat=None, coll=None, seg: int = 96, plats=(0, 0, 0), skarp: float = 35.0) -> bpy.types.Object:
    """Svarvad form: profil = [(r, z), ...] runt Z-axeln. r = 0 i en ande sluter formen."""
    bm = bmesh.new()
    ringar = []
    for r, z in profil:
        if r <= 1e-7:
            ringar.append([bm.verts.new((0.0, 0.0, z))])
        else:
            ringar.append([bm.verts.new((r * math.cos(2 * math.pi * i / seg), r * math.sin(2 * math.pi * i / seg), z))
                           for i in range(seg)])
    for a, b in zip(ringar, ringar[1:]):
        if len(a) == 1 and len(b) == 1:
            continue
        for i in range(seg):
            j = (i + 1) % seg
            if len(a) == 1:
                bm.faces.new((a[0], b[i], b[j]))
            elif len(b) == 1:
                bm.faces.new((a[i], a[j], b[0]))
            else:
                bm.faces.new((a[i], a[j], b[j], b[i]))
    # en profil som slutar dar den borjade (ett skal) blir sluten
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.translate(bm, vec=Vector(plats), verts=bm.verts)
    return _obj(namn, bm, mat, coll, skarp=skarp)


def bradda(namn: str, langd: float, bredd: float, tjock: float, mat=None, coll=None, fas: float = 0.003,
           plats=(0, 0, 0), rot=(0, 0, 0)) -> bpy.types.Object:
    """Rak bradda: langden langs lokala X (trats fibrer foljer X), bredden langs Y och tjockleken langs Z."""
    o = b3d.lada(namn, (langd, bredd, tjock), (0, 0, 0), mat, fas=fas, coll=coll)
    o.location = plats
    o.rotation_euler = rot
    return o


def profilplatta(namn: str, kontur_xz, tjock: float, mat=None, coll=None, fas: float = 0.003, y: float = 0.0) -> bpy.types.Object:
    """Platta vars kontur ar en polygon i XZ-planet (framifran sett), med tjockleken langs Y."""
    bm = bmesh.new()
    fram = [bm.verts.new((x, y - tjock / 2, z)) for x, z in kontur_xz]
    bak = [bm.verts.new((x, y + tjock / 2, z)) for x, z in kontur_xz]
    n = len(fram)
    bm.faces.new(fram[::-1])
    bm.faces.new(bak)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((fram[i], fram[j], bak[j], bak[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = _obj(namn, bm, mat, coll, mjuk=False)
    b3d._slipa(o, fas)
    return o


def _catmull(punkter, steg: float):
    """Jamn kurva genom punkterna (centripetal Catmull-Rom), samplad med ungefar `steg` meters mellanrum."""
    p = [Vector((u, v)) for u, v in punkter]
    p = [p[0] * 2 - p[1]] + p + [p[-1] * 2 - p[-2]]
    tat = []
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i - 1], p[i], p[i + 1], p[i + 2]
        n = max(2, int((p2 - p1).length / steg))
        for k in range(n):
            t = k / n
            t2, t3 = t * t, t * t * t
            q = 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
            tat.append(q)
    tat.append(p[-2])
    return tat


def band(namn: str, bana, bredd: float, tjock: float, mat=None, coll=None, x: float = 0.0, steg: float = 0.008,
         fas: float = 0.004) -> bpy.types.Object:
    """Bojt band, som en ram i bojd plywood. bana = punkter (y, z) i sidoprofilen, som jamnas till en kurva.
    Tvarsnittet ar `tjock` i profilplanet (vinkelratt mot banan) och `bredd` langs X, centrerat i x.
    UV: u = langden langs banan, sa att trats fibrer foljer bojen."""
    pts = _catmull(bana, steg)
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new()
    rader, s = [], [0.0]
    for i in range(1, len(pts)):
        s.append(s[-1] + (pts[i] - pts[i - 1]).length)
    for i, q in enumerate(pts):
        t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        nrm = Vector((-t.y, t.x))
        hor = []
        for dx, dn in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            yz = q + nrm * (dn * tjock / 2)
            hor.append(bm.verts.new((x + dx * bredd / 2, yz.x, yz.y)))
        rader.append(hor)
    for i in range(len(rader) - 1):
        a, b = rader[i], rader[i + 1]
        for k in range(4):
            f = bm.faces.new((a[k], a[(k + 1) % 4], b[(k + 1) % 4], b[k]))
            for lp in f.loops:
                idx = rader.index(a) if lp.vert in a else i + 1
                lp[uv].uv = (s[idx] * 3.0, (k + (1 if lp.vert in (a[(k + 1) % 4], b[(k + 1) % 4]) else 0)) * 0.25)
    bm.faces.new(rader[0][::-1])
    bm.faces.new(rader[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = _obj(namn, bm, mat, coll, mjuk=False)
    b3d._slipa(o, fas, segment=3)
    return o


def bana_punkt(bana, s_rel: float, steg: float = 0.004):
    """Punkt, tangent och normal pa den jamnade banan vid andelen s_rel (0-1) av langden."""
    pts = _catmull(bana, steg)
    s = [0.0]
    for i in range(1, len(pts)):
        s.append(s[-1] + (pts[i] - pts[i - 1]).length)
    mal = s[-1] * min(max(s_rel, 0.0), 1.0)
    i = next((k for k in range(1, len(s)) if s[k] >= mal), len(s) - 1)
    q = pts[i]
    t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
    return q, t, Vector((-t.y, t.x)), s[-1]


def dyna(namn: str, b: float, d: float, h: float, mat=None, coll=None, puff: float = 0.18, rundning: float = 5.0,
         sommar: int = 14) -> bpy.types.Object:
    """Stoppad dyna: en rundad lada (superellipsoid) som buktar i mitten. b langs X, d langs Y, h langs Z."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=2.0)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=sommar, use_grid_fill=True)
    p = rundning
    for v in bm.verts:
        x, y, z = v.co
        n = (abs(x) ** p + abs(y) ** p + abs(z) ** p) ** (1 / p)
        x, y, z = x / n, y / n, z / n
        z *= 1.0 + puff * (1 - x * x) * (1 - y * y)
        v.co = (x * b / 2, y * d / 2, z * h / 2)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _obj(namn, bm, mat, coll)


# ------------------------------------------------------------------ material
def _noder(m):
    nt = m.node_tree
    return nt, nt.nodes["Principled BSDF"]


def massing(namn: str, strav: float = 0.22, riktning: str = "Z") -> bpy.types.Material:
    """Borstad massing (lampan): varmare och gulare an guldet i trappan."""
    return b3d.guld(namn, strav=strav, borstat=True, farg=(0.88, 0.62, 0.26), riktning=riktning)


def guldmetall(namn: str, strav: float = 0.26) -> bpy.types.Material:
    """Guldfargad metall (satsborden)."""
    return b3d.guld(namn, strav=strav, borstat=False, farg=(0.95, 0.70, 0.33))


def glas(namn: str, ton=(0.93, 0.97, 0.95), strav: float = 0.0, ior: float = 1.52) -> bpy.types.Material:
    """Klart, hardat glas med den svaga gronska som syns i kanten."""
    return b3d.principled(namn, ton, 0.0, strav, **{"Transmission Weight": 1.0, "IOR": ior})


def kupolglas(namn: str, glod: float = 2.0, kelvin: float = 2900.0) -> bpy.types.Material:
    """Bärnstensfargat, matt glas som lyser inifran (lampans skarm)."""
    m = b3d.principled(namn, (0.60, 0.33, 0.07), 0.0, 0.22, **{"Transmission Weight": 0.75, "IOR": 1.5})
    nt, b = _noder(m)
    b.inputs["Emission Color"].default_value = (1.0, 0.50, 0.10, 1)
    b.inputs["Emission Strength"].default_value = glod * 0.45
    return m


def lysdiod(namn: str, styrka: float = 40.0, kelvin: float = 3000.0) -> bpy.types.Material:
    m, nt, b, ut = b3d._nytt_material(namn)
    nt.nodes.remove(b)
    em = nt.nodes.new("ShaderNodeEmission")
    bb = nt.nodes.new("ShaderNodeBlackbody")
    bb.inputs["Temperature"].default_value = kelvin
    nt.links.new(bb.outputs["Color"], em.inputs["Color"])
    em.inputs["Strength"].default_value = styrka
    nt.links.new(em.outputs[0], ut.inputs["Surface"])
    return m


def tra(namn: str, ljus, mork, strav: float = 0.42, lack: float = 0.25, korn: float = 1.0, koord: str = "OBJECT",
        tathet: float = 1.0, axel: str = "X") -> bpy.types.Material:
    """Tra med fibrer langs X eller Z (objektkoordinater, axel) eller langs U (bojda band med UV).
    ljus/mork = sRGB-hex for tradets ljusa och morka toner."""
    from ..common import hex_lin
    m, nt, b, _ = b3d._nytt_material(namn)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    if koord != "OBJECT":
        mp.inputs["Scale"].default_value = (1.0, 22 * tathet, 1.0)
    elif axel == "Z":
        mp.inputs["Scale"].default_value = (55 * tathet, 55 * tathet, 1.6 * tathet)
    else:
        mp.inputs["Scale"].default_value = (1.6 * tathet, 55 * tathet, 55 * tathet)
    nt.links.new(tc.outputs["Object" if koord == "OBJECT" else "UV"], mp.inputs["Vector"])
    # fibrerna: utdraget brus, och arsringar som buktar med ett grovre brus
    fin = nt.nodes.new("ShaderNodeTexNoise")
    fin.inputs["Scale"].default_value = 2.5
    fin.inputs["Detail"].default_value = 8.0
    fin.inputs["Roughness"].default_value = 0.62
    nt.links.new(mp.outputs["Vector"], fin.inputs["Vector"])
    ringar = nt.nodes.new("ShaderNodeTexWave")
    ringar.wave_type = "BANDS"
    ringar.bands_direction = "X" if (koord == "OBJECT" and axel == "Z") else "Y"
    ringar.inputs["Scale"].default_value = 0.35
    ringar.inputs["Distortion"].default_value = 6.0
    ringar.inputs["Detail"].default_value = 3.0
    nt.links.new(mp.outputs["Vector"], ringar.inputs["Vector"])
    blanda = nt.nodes.new("ShaderNodeMix")
    blanda.data_type = "FLOAT"
    blanda.inputs["Factor"].default_value = 0.45
    nt.links.new(fin.outputs["Fac"], blanda.inputs["A"])
    nt.links.new(ringar.outputs["Fac"], blanda.inputs["B"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.30
    ramp.color_ramp.elements[0].color = (*hex_lin(ljus), 1)
    ramp.color_ramp.elements[1].position = 0.30 + 0.45 / max(korn, 0.2)
    ramp.color_ramp.elements[1].color = (*hex_lin(mork), 1)
    nt.links.new(blanda.outputs["Result"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    rr = nt.nodes.new("ShaderNodeMapRange")
    rr.inputs["To Min"].default_value = strav - 0.06
    rr.inputs["To Max"].default_value = strav + 0.10
    nt.links.new(blanda.outputs["Result"], rr.inputs["Value"])
    nt.links.new(rr.outputs["Result"], b.inputs["Roughness"])
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = 0.06
    bp.inputs["Distance"].default_value = 0.0006
    nt.links.new(blanda.outputs["Result"], bp.inputs["Height"])
    nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    b.inputs["Coat Weight"].default_value = lack
    b.inputs["Coat Roughness"].default_value = 0.18
    return m


def bjork(namn: str, koord: str = "UV") -> bpy.types.Material:
    """Ljus bjorkfaner (fatoljens ram), lackad."""
    return tra(namn, "#E8D3B0", "#D2B58C", strav=0.38, lack=0.35, korn=0.7, koord=koord, tathet=1.2)


def akacia(namn: str, axel: str = "X") -> bpy.types.Material:
    """Oljad akacia (banken): varm honungsbrun med tydliga fibrer."""
    return tra(namn, "#D19D64", "#A06A3C", strav=0.46, lack=0.12, korn=1.1, koord="OBJECT", tathet=0.9, axel=axel)


def sammet(namn: str, farg: str = "#E7E4DC") -> bpy.types.Material:
    """Tyg i sammetslook: mjuk lyster i kanterna och en fin vavstruktur."""
    from ..common import hex_lin
    m, nt, b, _ = b3d._nytt_material(namn)
    b.inputs["Base Color"].default_value = (*hex_lin(farg), 1)
    b.inputs["Roughness"].default_value = 0.86
    b.inputs["Sheen Weight"].default_value = 0.9
    b.inputs["Sheen Roughness"].default_value = 0.35
    b.inputs["Specular IOR Level"].default_value = 0.25
    tc = nt.nodes.new("ShaderNodeTexCoord")
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 900.0
    nz.inputs["Detail"].default_value = 2.0
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    grov = nt.nodes.new("ShaderNodeTexNoise")
    grov.inputs["Scale"].default_value = 18.0
    grov.inputs["Detail"].default_value = 3.0
    nt.links.new(tc.outputs["Object"], grov.inputs["Vector"])
    ton = nt.nodes.new("ShaderNodeMix")
    ton.data_type = "RGBA"
    ton.inputs["Factor"].default_value = 0.08
    ton.inputs["A"].default_value = (*hex_lin(farg), 1)
    nt.links.new(grov.outputs["Color"], ton.inputs["B"])
    nt.links.new(ton.outputs["Result"], b.inputs["Base Color"])
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = 0.12
    bp.inputs["Distance"].default_value = 0.0004
    nt.links.new(nz.outputs["Fac"], bp.inputs["Height"])
    nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m


def stenlook(namn: str, farg: str = "#EEE9DF") -> bpy.types.Material:
    """Kramvit mineral i stenlook med sma prickar i gratt, brunt och svart (sidobordet)."""
    from ..common import hex_lin
    m, nt, b, _ = b3d._nytt_material(namn)
    b.inputs["Roughness"].default_value = 0.62
    tc = nt.nodes.new("ShaderNodeTexCoord")
    lager = []
    for skala, andel, storlek in ((160.0, 0.86, 0.22), (420.0, 0.80, 0.26)):
        vo = nt.nodes.new("ShaderNodeTexVoronoi")
        vo.inputs["Scale"].default_value = skala
        nt.links.new(tc.outputs["Object"], vo.inputs["Vector"])
        # en prick dar cellens slumpvarde ar hogt och punkten ligger nara cellens mitt
        valj = nt.nodes.new("ShaderNodeMath")
        valj.operation = "GREATER_THAN"
        valj.inputs[1].default_value = andel
        sep = nt.nodes.new("ShaderNodeSeparateColor")
        nt.links.new(vo.outputs["Color"], sep.inputs["Color"])
        nt.links.new(sep.outputs[0], valj.inputs[0])
        nara = nt.nodes.new("ShaderNodeMath")
        nara.operation = "LESS_THAN"
        nara.inputs[1].default_value = storlek
        nt.links.new(vo.outputs["Distance"], nara.inputs[0])
        prick = nt.nodes.new("ShaderNodeMath")
        prick.operation = "MULTIPLY"
        nt.links.new(valj.outputs[0], prick.inputs[0])
        nt.links.new(nara.outputs[0], prick.inputs[1])
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        cr = ramp.color_ramp
        cr.elements[0].position = 0.0
        cr.elements[0].color = (*hex_lin("#3B342D"), 1)
        cr.elements[1].position = 1.0
        cr.elements[1].color = (*hex_lin("#A79C8E"), 1)
        e = cr.elements.new(0.5)
        e.color = (*hex_lin("#6E5A45"), 1)
        nt.links.new(sep.outputs[1], ramp.inputs["Fac"])
        lager.append((prick, ramp))
    farg_ut = nt.nodes.new("ShaderNodeMix")
    farg_ut.data_type = "RGBA"
    farg_ut.inputs["A"].default_value = (*hex_lin(farg), 1)
    nt.links.new(lager[0][0].outputs[0], farg_ut.inputs["Factor"])
    nt.links.new(lager[0][1].outputs["Color"], farg_ut.inputs["B"])
    farg2 = nt.nodes.new("ShaderNodeMix")
    farg2.data_type = "RGBA"
    nt.links.new(farg_ut.outputs["Result"], farg2.inputs["A"])
    nt.links.new(lager[1][0].outputs[0], farg2.inputs["Factor"])
    nt.links.new(lager[1][1].outputs["Color"], farg2.inputs["B"])
    nt.links.new(farg2.outputs["Result"], b.inputs["Base Color"])
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 300.0
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = 0.05
    bp.inputs["Distance"].default_value = 0.0003
    nt.links.new(nz.outputs["Fac"], bp.inputs["Height"])
    nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m


def slump(fro: int) -> random.Random:
    return random.Random(fro)
