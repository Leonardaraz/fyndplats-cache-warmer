"""Renderar tagningarna med Cycles till EXR (linjart ljus). Volympasset (ljuskaglan i diset) renderas for sig i lag upplosning.

    python -m film.render still --tagning A --ruta 0 --kvalitet prov
    python -m film.render anim  --tagning A --kvalitet final [--fran 0 --till 254] [--volym]
"""
from __future__ import annotations

import argparse
import math
import sys
import time

import bpy

from . import b3d
from .common import BREDD, FPS, HOJD, TAGNINGAR, UT

KVALITET = {
    #            skala  spp  troskel  volymskala volym-spp
    "skiss": (0.25, 8, 0.2, 0.125, 8),
    "utkast": (0.5, 14, 0.12, 0.25, 12),
    "prov": (0.5, 28, 0.06, 0.25, 24),
    "final": (1.0, 32, 0.05, 1 / 3, 40),
    "hog": (1.0, 64, 0.02, 0.5, 64),
}


def installningar(sc, kvalitet: str, volym: bool, over: dict | None = None) -> None:
    over = over or {}
    skala, spp, troskel, vskala, vspp = KVALITET[kvalitet]
    spp = over.get("spp", spp)
    troskel = over.get("troskel", troskel)
    skala = over.get("skala", skala)
    sc.render.engine = "CYCLES"
    cy = sc.cycles
    cy.device = "CPU"
    cy.samples = vspp if volym else spp
    cy.use_adaptive_sampling = not volym
    cy.adaptive_threshold = troskel
    cy.adaptive_min_samples = 8
    cy.use_denoising = True
    cy.denoiser = "OPENIMAGEDENOISE"
    cy.denoising_input_passes = "RGB_ALBEDO_NORMAL"
    cy.max_bounces = over.get("studs", 7)
    cy.diffuse_bounces = 2
    cy.glossy_bounces = over.get("blankstuds", 5)
    cy.transmission_bounces = over.get("glasstuds", 6)
    cy.denoising_prefilter = over.get("forfilter", "ACCURATE")
    if "brusfilter" in over:
        cy.denoising_quality = over["brusfilter"]
    cy.volume_bounces = 0
    cy.transparent_max_bounces = 6
    cy.caustics_reflective = False
    cy.caustics_refractive = False
    cy.sample_clamp_indirect = 8.0
    cy.blur_glossy = 0.6
    cy.use_animated_seed = True
    cy.pixel_filter_type = "BLACKMAN_HARRIS"
    cy.filter_width = 1.5
    r = sc.render
    r.resolution_x, r.resolution_y = BREDD, HOJD
    r.resolution_percentage = int(round((vskala if volym else skala) * 100))
    r.use_persistent_data = True
    r.use_motion_blur = True
    # en halv ruta som standard; kranakningen i trappan (A) far kortare slutare sa att prisskylten gar att lasa
    r.motion_blur_shutter = over.get("slutare", 0.5)
    r.motion_blur_position = "CENTER"
    r.film_transparent = False
    r.threads_mode = "AUTO"
    r.use_overwrite = False
    r.use_placeholder = True
    ims = r.image_settings
    ims.media_type = "MULTI_LAYER_IMAGE"
    ims.file_format = "OPEN_EXR_MULTILAYER"
    ims.color_depth = "16"
    ims.exr_codec = "ZIP"
    vl = sc.view_layers[0]
    vl.use_pass_position = not volym
    vl.use_pass_z = not volym


def volymlada(sc, mitt, storlek, tathet: float, coll) -> bpy.types.Object:
    """Dis i luften: gor ljuskaglan synlig. Finns bara i volympasset."""
    o = b3d.lada("dis", storlek, mitt, None, coll=coll)
    m = bpy.data.materials.new("dis")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    ut = nt.nodes.new("ShaderNodeOutputMaterial")
    vs = nt.nodes.new("ShaderNodeVolumeScatter")
    vs.inputs["Density"].default_value = tathet
    vs.inputs["Anisotropy"].default_value = 0.35
    vs.inputs["Color"].default_value = (1, 1, 1, 1)
    nt.links.new(vs.outputs[0], ut.inputs["Volume"])
    o.data.materials.append(m)
    o.visible_shadow = False
    return o


def _bara_volymljus(sc, d) -> None:
    """Volympasset: allt fast blir hallout, och bara de ljus som ska synas i diset far lysa."""
    for lc in sc.view_layers[0].layer_collection.children:
        if lc.name == "fasta":
            lc.holdout = True
    behall = set(d.get("volymljus", ()))
    for o in sc.objects:
        if o.type == "LIGHT" and o.name not in behall:
            o.hide_render = True


def satt_kamera(sc, namn: str, fn, rutor) -> bpy.types.Object:
    kam = b3d.kamera(namn)
    mal = b3d.tom(namn + "_mal")
    fokus = b3d.tom(namn + "_fokus")
    b3d.sikta(kam, mal)
    kam.data.dof.focus_object = fokus
    for f in rutor:
        v = fn(f / FPS)
        kam.location = v["pos"]
        kam.keyframe_insert("location", frame=f)
        mal.location = v["mal"]
        mal.keyframe_insert("location", frame=f)
        fokus.location = v["fokus"]
        fokus.keyframe_insert("location", frame=f)
        kam.data.lens = v["lins"]
        kam.data.keyframe_insert("lens", frame=f)
        kam.data.dof.aperture_fstop = v["blandare"]
        kam.data.dof.keyframe_insert("aperture_fstop", frame=f)
    sc.camera = kam
    return kam


def bygg(tagning: str, volym: bool, look: dict | None = None):
    info = TAGNINGAR[tagning]
    f0, f1 = info["rutor"]
    rutor = range(f0 - 2, f1 + 3)
    if info["set"] == "trappa":
        from . import trappa
        look = dict(look or {})
        d = trappa.bygg(trappa.las_produkt(), look)
        sc = d["scen"]
        satt_kamera(sc, "kam" + tagning, trappa.kam_A if tagning == "A" else trappa.kam_B, rutor)
        if volym:
            volymlada(sc, d.get("dis_mitt", (0, -2.5, 5.0)), d.get("dis_storlek", (16, 22, 10.2)),
                      (look or {}).get("dis", 0.022), None)
            _bara_volymljus(sc, d)
    else:
        from . import hall
        d = hall.bygg(tagning, look)
        sc = d["scen"]
        satt_kamera(sc, "kam" + tagning, hall.KAMEROR[tagning], rutor)
        if volym:
            volymlada(sc, d.get("dis_mitt", (0, 0, 4.0)), d.get("dis_storlek", (30, 40, 8.2)), (look or {}).get("dis", 0.012), None)
            _bara_volymljus(sc, d)
    sc.frame_start, sc.frame_end = f0, f1
    return sc


def main(argv=None) -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("lage", choices=["still", "anim"])
    ap.add_argument("--tagning", required=True)
    ap.add_argument("--ruta", type=int, default=None)
    ap.add_argument("--fran", type=int, default=None)
    ap.add_argument("--till", type=int, default=None)
    ap.add_argument("--kvalitet", default="prov")
    ap.add_argument("--volym", action="store_true")
    ap.add_argument("--look", default=None, help="JSON med lookparametrar")
    ap.add_argument("--etikett", default="")
    ap.add_argument("--over", default=None, help="JSON som andrar renderingsinstallningar (spp, troskel, skala, studs ...)")
    a = ap.parse_args(argv)
    import json
    look = json.loads(a.look) if a.look else None
    t0 = time.time()
    sc = bygg(a.tagning, a.volym, look)
    installningar(sc, a.kvalitet, a.volym, json.loads(a.over) if a.over else None)
    mapp = UT / "exr" / (a.kvalitet + a.etikett) / a.tagning
    mapp.mkdir(parents=True, exist_ok=True)
    stam = "vol_" if a.volym else "bild_"
    f0, f1 = TAGNINGAR[a.tagning]["rutor"]
    if a.lage == "still":
        f = a.ruta if a.ruta is not None else f0
        sc.frame_set(f)
        sc.render.use_overwrite = True
        sc.render.use_placeholder = False
        sc.render.filepath = str(mapp / f"{stam}{f:04d}.exr")
        bpy.ops.render.render(write_still=True)
        print(f"KLAR still {a.tagning} ruta {f} {time.time()-t0:.1f}s -> {sc.render.filepath}")
    else:
        sc.frame_start = a.fran if a.fran is not None else f0
        sc.frame_end = a.till if a.till is not None else f1
        sc.render.filepath = str(mapp / f"{stam}####.exr")
        bpy.ops.render.render(animation=True)
        n = sc.frame_end - sc.frame_start + 1
        print(f"KLAR anim {a.tagning} {sc.frame_start}-{sc.frame_end} {time.time()-t0:.1f}s ({(time.time()-t0)/n:.1f}s/ruta)")


if __name__ == "__main__":
    main()
