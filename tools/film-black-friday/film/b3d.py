"""Hjalpfunktioner for Blender (bpy 5.x): geometri, material, text, nyckelrutor och rendering."""
from __future__ import annotations

import math
import warnings
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

from .common import FPS, FONTS, hex_lin

warnings.filterwarnings("ignore", category=DeprecationWarning)


# ------------------------------------------------------------------ scen
def ny_scen() -> bpy.types.Scene:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
    sc = bpy.context.scene
    sc.render.fps = FPS
    sc.unit_settings.system = "METRIC"
    v = bpy.data.worlds.new("Varld")
    v.use_nodes = True
    v.node_tree.nodes["Background"].inputs[0].default_value = (0, 0, 0, 1)
    v.node_tree.nodes["Background"].inputs[1].default_value = 0.0
    sc.world = v
    return sc


def samling(namn: str, foralder: bpy.types.Collection | None = None) -> bpy.types.Collection:
    c = bpy.data.collections.new(namn)
    (foralder or bpy.context.scene.collection).children.link(c)
    return c


def lanka(obj: bpy.types.Object, coll: bpy.types.Collection | None = None) -> bpy.types.Object:
    (coll or bpy.context.scene.collection).objects.link(obj)
    return obj


def tom(namn: str, plats=(0, 0, 0), coll=None) -> bpy.types.Object:
    o = bpy.data.objects.new(namn, None)
    o.location = plats
    return lanka(o, coll)


# ------------------------------------------------------------------ material
def _nytt_material(namn: str):
    m = bpy.data.materials.new(namn)
    m.use_nodes = True
    nt = m.node_tree
    return m, nt, nt.nodes["Principled BSDF"], nt.nodes["Material Output"]


def principled(namn: str, farg, metall=0.0, strav=0.5, **inputs) -> bpy.types.Material:
    m, nt, b, _ = _nytt_material(namn)
    if isinstance(farg, str):
        farg = hex_lin(farg)
    b.inputs["Base Color"].default_value = (*farg, 1)
    b.inputs["Metallic"].default_value = metall
    b.inputs["Roughness"].default_value = strav
    for k, v in inputs.items():
        b.inputs[k].default_value = v
    return m


def guld(namn: str, strav=0.2, borstat=False, farg=(1.0, 0.70, 0.30), riktning="X") -> bpy.types.Material:
    """Guld. Borstat guld far langa strimmor i en riktning och utdragna blankningar."""
    m, nt, b, _ = _nytt_material(namn)
    b.inputs["Base Color"].default_value = (*farg, 1)
    b.inputs["Metallic"].default_value = 1.0
    b.inputs["Roughness"].default_value = strav
    if borstat:
        tc = nt.nodes.new("ShaderNodeTexCoord")
        mp = nt.nodes.new("ShaderNodeMapping")
        skala = {"X": (1.2, 160, 160), "Y": (160, 1.2, 160), "Z": (160, 160, 1.2)}[riktning]
        mp.inputs["Scale"].default_value = skala
        nz = nt.nodes.new("ShaderNodeTexNoise")
        nz.inputs["Scale"].default_value = 1.0
        nz.inputs["Detail"].default_value = 3.0
        nz.inputs["Roughness"].default_value = 0.6
        mr = nt.nodes.new("ShaderNodeMapRange")
        mr.inputs["From Min"].default_value = 0.3
        mr.inputs["From Max"].default_value = 0.7
        mr.inputs["To Min"].default_value = max(0.02, strav - 0.07)
        mr.inputs["To Max"].default_value = strav + 0.09
        nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
        nt.links.new(mp.outputs["Vector"], nz.inputs["Vector"])
        nt.links.new(nz.outputs["Fac"], mr.inputs["Value"])
        nt.links.new(mr.outputs["Result"], b.inputs["Roughness"])
        bp = nt.nodes.new("ShaderNodeBump")
        bp.inputs["Strength"].default_value = 0.035
        bp.inputs["Distance"].default_value = 0.002
        nt.links.new(nz.outputs["Fac"], bp.inputs["Height"])
        nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
        b.inputs["Anisotropic"].default_value = 0.55
        # fast borstriktning: tangenten pekar langs strimmorna
        vm = nt.nodes.new("ShaderNodeCombineXYZ")
        vm.inputs[{"X": 0, "Y": 1, "Z": 2}[riktning]].default_value = 1.0
        vt = nt.nodes.new("ShaderNodeVectorTransform")
        vt.vector_type = "VECTOR"
        vt.convert_from = "OBJECT"
        vt.convert_to = "WORLD"
        nt.links.new(vm.outputs[0], vt.inputs[0])
        nt.links.new(vt.outputs[0], b.inputs["Tangent"])
    return m


def svart_sten(namn: str, strav=0.1, variation=0.05) -> bpy.types.Material:
    m, nt, b, _ = _nytt_material(namn)
    b.inputs["Base Color"].default_value = (0.006, 0.006, 0.007, 1)
    b.inputs["Roughness"].default_value = strav
    b.inputs["Specular IOR Level"].default_value = 0.6
    tc = nt.nodes.new("ShaderNodeTexCoord")
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 0.55
    nz.inputs["Detail"].default_value = 5.0
    nz.inputs["Roughness"].default_value = 0.55
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = 0.25
    mr.inputs["From Max"].default_value = 0.75
    mr.inputs["To Min"].default_value = max(0.01, strav - variation)
    mr.inputs["To Max"].default_value = strav + variation
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    nt.links.new(nz.outputs["Fac"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], b.inputs["Roughness"])
    return m


def lack(namn: str, farg, strav=0.4, klarlack=1.0, klarlack_strav=0.04) -> bpy.types.Material:
    return principled(
        namn, farg, 0.0, strav,
        **{"Coat Weight": klarlack, "Coat Roughness": klarlack_strav, "Coat IOR": 1.5},
    )


def bildlack(namn: str, bild: bpy.types.Image, ton=(1, 1, 1), strav=0.4) -> bpy.types.Material:
    """Lackad yta med ett foto tryckt pa: fotot multipliceras med lackens ton."""
    m, nt, b, _ = _nytt_material(namn)
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = bild
    tex.extension = "EXTEND"
    tex.interpolation = "Cubic"
    mx = nt.nodes.new("ShaderNodeMix")
    mx.data_type = "RGBA"
    mx.blend_type = "MULTIPLY"
    mx.inputs["Factor"].default_value = 1.0
    mx.inputs["A"].default_value = (*ton, 1)
    nt.links.new(tex.outputs["Color"], mx.inputs["B"])
    nt.links.new(mx.outputs["Result"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = strav
    b.inputs["Coat Weight"].default_value = 1.0
    b.inputs["Coat Roughness"].default_value = 0.04
    return m


def ljusmaterial(namn: str, farg, styrka=1.0, objektstyrd=False, vilofarg=None) -> bpy.types.Material:
    """Lysande yta. Med objektstyrd=True styr objektets farg-alfa styrkan (kan nyckelsattas per objekt)."""
    m = bpy.data.materials.new(namn)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    ut = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    if isinstance(farg, str):
        farg = hex_lin(farg)
    em.inputs["Color"].default_value = (*farg, 1)
    em.inputs["Strength"].default_value = styrka
    if objektstyrd:
        oi = nt.nodes.new("ShaderNodeObjectInfo")
        mu = nt.nodes.new("ShaderNodeMath")
        mu.operation = "MULTIPLY"
        mu.inputs[1].default_value = styrka
        nt.links.new(oi.outputs["Alpha"], mu.inputs[0])
        nt.links.new(mu.outputs[0], em.inputs["Strength"])
    if vilofarg is not None:
        bs = nt.nodes.new("ShaderNodeBsdfPrincipled")
        bs.inputs["Base Color"].default_value = (*vilofarg, 1)
        bs.inputs["Metallic"].default_value = 1.0
        bs.inputs["Roughness"].default_value = 0.3
        ad = nt.nodes.new("ShaderNodeAddShader")
        nt.links.new(bs.outputs[0], ad.inputs[0])
        nt.links.new(em.outputs[0], ad.inputs[1])
        nt.links.new(ad.outputs[0], ut.inputs["Surface"])
    else:
        nt.links.new(em.outputs[0], ut.inputs["Surface"])
    return m


def bild(sokvag: Path | str, namn: str | None = None, fargrymd="sRGB") -> bpy.types.Image:
    img = bpy.data.images.load(str(sokvag), check_existing=True)
    if namn:
        img.name = namn
    try:
        img.colorspace_settings.name = fargrymd
    except TypeError:
        pass
    return img


# ------------------------------------------------------------------ geometri
def _mesh_fran_bm(namn: str, bm: bmesh.types.BMesh) -> bpy.types.Mesh:
    me = bpy.data.meshes.new(namn)
    bm.to_mesh(me)
    bm.free()
    return me


def _slipa(obj: bpy.types.Object, fas: float, segment: int = 3) -> None:
    """Fasar kanterna och bakar in resultatet. Stora plana ytor behaller sin riktning (viktade normaler),
    sa att speglingar i dem blir raka och blankningarna fastnar i kanten."""
    me = obj.data
    if fas <= 0:
        me.shade_flat()
        return
    me.shade_smooth()
    md = obj.modifiers.new("fas", "BEVEL")
    md.width = fas
    md.segments = segment
    md.limit_method = "ANGLE"
    md.angle_limit = math.radians(40)
    vn = obj.modifiers.new("normaler", "WEIGHTED_NORMAL")
    vn.mode = "FACE_AREA"
    vn.weight = 100
    vn.keep_sharp = False
    dg = bpy.context.evaluated_depsgraph_get()
    ny = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
    gammal = obj.data
    obj.modifiers.clear()
    obj.data = ny
    bpy.data.meshes.remove(gammal)


def lada(namn: str, storlek, plats=(0, 0, 0), material=None, fas=0.0, coll=None) -> bpy.types.Object:
    """Ratblock centrerat i plats, storlek = (x, y, z)."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, calc_uvs=True)
    for v in bm.verts:
        v.co.x *= storlek[0]
        v.co.y *= storlek[1]
        v.co.z *= storlek[2]
    obj = bpy.data.objects.new(namn, _mesh_fran_bm(namn, bm))
    lanka(obj, coll)
    obj.location = plats
    if material:
        obj.data.materials.append(material)
    _slipa(obj, fas)
    return obj


def rundad_skiva(namn: str, bredd: float, hojd: float, tjock: float, radie: float, material=None,
                 fas=0.0, coll=None, hornsteg: int = 10, hal: tuple[float, float, float] | None = None) -> bpy.types.Object:
    """Staende skiva med rundade horn i XZ-planet, tjocklek langs Y. Mitten i origo.

    hal = (bredd, hojd, radie) gor skivan till en ram.
    """
    def kontur(b, h, r):
        p = []
        r = min(r, b / 2 - 1e-4, h / 2 - 1e-4)
        for cx, cz, a0 in ((b / 2 - r, h / 2 - r, 0), (-b / 2 + r, h / 2 - r, 90), (-b / 2 + r, -h / 2 + r, 180), (b / 2 - r, -h / 2 + r, 270)):
            for i in range(hornsteg + 1):
                a = math.radians(a0 + 90 * i / hornsteg)
                p.append((cx + r * math.cos(a), cz + r * math.sin(a)))
        return p

    bm = bmesh.new()
    yttre = [bm.verts.new((x, 0, z)) for x, z in kontur(bredd, hojd, radie)]
    if hal:
        inre = [bm.verts.new((x, 0, z)) for x, z in kontur(*hal)]
        n = len(yttre)
        for i in range(n):
            bm.faces.new((yttre[i], yttre[(i + 1) % n], inre[(i + 1) % n], inre[i]))
    else:
        bm.faces.new(yttre)
    bm.normal_update()
    res = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:])
    nya = [e for e in res["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=nya, vec=(0, tjock, 0))
    bmesh.ops.translate(bm, verts=bm.verts[:], vec=(0, -tjock / 2, 0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    obj = bpy.data.objects.new(namn, _mesh_fran_bm(namn, bm))
    lanka(obj, coll)
    if material:
        obj.data.materials.append(material)
    _slipa(obj, fas)
    return obj


def plan_xz(namn: str, bredd: float, hojd: float, material=None, coll=None, mot_minus_y=True) -> bpy.types.Object:
    """Staende plan i XZ med UV 0..1, synlig sida mot -Y (mot kameran)."""
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new("UVMap")
    hx, hz = bredd / 2, hojd / 2
    pts = [(-hx, 0, -hz), (hx, 0, -hz), (hx, 0, hz), (-hx, 0, hz)]
    uvs = [(0, 0), (1, 0), (1, 1), (0, 1)]
    vs = [bm.verts.new(p) for p in pts]
    f = bm.faces.new(vs if mot_minus_y else vs[::-1])
    for lp, u in zip(f.loops, uvs if mot_minus_y else uvs[::-1]):
        lp[uv].uv = u
    obj = bpy.data.objects.new(namn, _mesh_fran_bm(namn, bm))
    lanka(obj, coll)
    if material:
        obj.data.materials.append(material)
    return obj


def golv(namn: str, storlek: float, material, coll=None) -> bpy.types.Object:
    bm = bmesh.new()
    h = storlek / 2
    vs = [bm.verts.new(p) for p in ((-h, -h, 0), (h, -h, 0), (h, h, 0), (-h, h, 0))]
    bm.faces.new(vs)
    obj = bpy.data.objects.new(namn, _mesh_fran_bm(namn, bm))
    lanka(obj, coll)
    obj.data.materials.append(material)
    return obj


_typsnitt: dict[str, bpy.types.VectorFont] = {}


def typsnitt(fil: str) -> bpy.types.VectorFont:
    if fil not in _typsnitt:
        _typsnitt[fil] = bpy.data.fonts.load(str(FONTS / fil))
    return _typsnitt[fil]


def text(namn: str, innehall: str, font: str, storlek: float, djup=0.0, fas=0.0, material=None,
         coll=None, x="CENTER", y="CENTER", avstand=1.0) -> bpy.types.Object:
    """Text som mesh, staende i XZ-planet med framsidan mot -Y."""
    cu = bpy.data.curves.new(namn, "FONT")
    cu.body = innehall
    cu.font = typsnitt(font)
    cu.size = storlek
    cu.extrude = djup / 2
    cu.bevel_depth = fas
    cu.bevel_resolution = 2 if fas > 0 else 0
    cu.align_x = x
    cu.align_y = y
    cu.space_character = avstand
    cu.resolution_u = 6
    tmp = bpy.data.objects.new(namn + "_kurva", cu)
    lanka(tmp, coll)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    bpy.data.objects.remove(tmp)
    bpy.data.curves.remove(cu)
    obj = bpy.data.objects.new(namn, me)
    lanka(obj, coll)
    # textkurvan ligger i XY; res den sa att den star i XZ och lases fran -Y
    for v in me.vertices:
        xk, yk, zk = v.co
        v.co = (xk, -zk, yk)
    me.update()
    if material:
        me.materials.append(material)
    return obj


def centrera(obj: bpy.types.Object) -> tuple[float, float]:
    """Flyttar meshens punkter sa att glyfernas faktiska ram har sin mitt i origo (x och z). Ger bredd och hojd."""
    me = obj.data
    xs = [v.co.x for v in me.vertices]
    zs = [v.co.z for v in me.vertices]
    cx, cz = (min(xs) + max(xs)) / 2, (min(zs) + max(zs)) / 2
    for v in me.vertices:
        v.co.x -= cx
        v.co.z -= cz
    me.update()
    return max(xs) - min(xs), max(zs) - min(zs)


# ------------------------------------------------------------------ ljus och kamera
def spot(namn: str, plats, effekt: float, vinkel_grader: float, mjukhet=0.3, radie=0.12, farg=(1, 1, 1), coll=None):
    ld = bpy.data.lights.new(namn, "SPOT")
    ld.energy = effekt
    ld.spot_size = math.radians(vinkel_grader)
    ld.spot_blend = mjukhet
    ld.shadow_soft_size = radie
    ld.color = farg
    o = bpy.data.objects.new(namn, ld)
    o.location = plats
    return lanka(o, coll)


def ytljus(namn: str, plats, effekt: float, storlek, farg=(1, 1, 1), spridning=180.0, coll=None):
    ld = bpy.data.lights.new(namn, "AREA")
    ld.energy = effekt
    if isinstance(storlek, (tuple, list)):
        ld.shape = "RECTANGLE"
        ld.size, ld.size_y = storlek
    else:
        ld.shape = "SQUARE"
        ld.size = storlek
    ld.color = farg
    ld.spread = math.radians(spridning)
    o = bpy.data.objects.new(namn, ld)
    o.location = plats
    return lanka(o, coll)


def sikta(obj: bpy.types.Object, mal: bpy.types.Object) -> None:
    c = obj.constraints.new("TRACK_TO")
    c.target = mal
    c.track_axis = "TRACK_NEGATIVE_Z"
    c.up_axis = "UP_Y"


def sikta_fast(obj: bpy.types.Object, punkt) -> None:
    """Riktar ett ljus eller en kamera mot en punkt utan lank (engangsrotation)."""
    riktning = Vector(punkt) - Vector(obj.location)
    obj.rotation_euler = riktning.to_track_quat("-Z", "Y").to_euler()


def kamera(namn: str, brannvidd=50.0, blandare=2.8, coll=None):
    cd = bpy.data.cameras.new(namn)
    cd.lens = brannvidd
    cd.sensor_fit = "VERTICAL"
    cd.sensor_height = 36.0
    cd.clip_start = 0.05
    cd.clip_end = 200
    cd.dof.use_dof = True
    cd.dof.aperture_fstop = blandare
    cd.dof.aperture_blades = 9
    o = bpy.data.objects.new(namn, cd)
    return lanka(o, coll)


# ------------------------------------------------------------------ nyckelrutor
def nyckla(block, vag: str, f: int, varde=None, index: int = -1) -> None:
    if varde is not None:
        if index >= 0:
            getattr(block, vag)[index] = varde
        else:
            setattr(block, vag, varde)
    block.keyframe_insert(vag, frame=f, index=index)


def baka(obj, rutor, fn) -> None:
    """fn(t) -> dict med t.ex. location/rotation_euler/scale. En nyckel per ruta, linjart emellan."""
    for f in rutor:
        for vag, v in fn(f / FPS).items():
            setattr(obj, vag, v)
            obj.keyframe_insert(vag, frame=f)


def baka_varde(block, vag: str, rutor, fn, index: int = -1) -> None:
    for f in rutor:
        nyckla(block, vag, f, fn(f / FPS), index)
