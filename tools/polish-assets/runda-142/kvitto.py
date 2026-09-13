# -*- coding: utf-8 -*-
"""Steg 7:s hashgrind: jamfor Wix SYNLIGA text mot rundans facit.

☠️ Ra HTML gar INTE att jamfora. Wix omserialiserar `<strong>` till
   `<span style="font-weight: 700">` (CLAUDE.md 2026-08-21), sa en rak
   stranghash faller pa varje korrekt skrivning — och ett falsklarm som
   alltid fyrar lar lasaren att hoppa over grinden.

   Grinden jamfor darfor TAGGFRI text. Det ar ocksa ratt matobjekt: batch
   64:s nio fel var stavfel och en husregelbrytning i den SYNLIGA texten,
   inte i markupen.
"""
import io, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brodtext as B

TAGG = re.compile(r"<[^>]*>")


def fnv(s):
    h = 0x811c9dc5
    for ch in s:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return format(h, "08x")


def synlig(html):
    return TAGG.sub("", html)


def facit(pid):
    t = synlig(B.HTML[pid])
    return {"len": len(t), "fnv": fnv(t)}


def granska(svar):
    """svar: {pid: {"len": n, "fnv": "xxxxxxxx"}} fran Wix aterlasning."""
    fel = []
    for pid, f in sorted(svar.items()):
        v = facit(pid)
        if f.get("len") != v["len"] or f.get("fnv") != v["fnv"]:
            fel.append("%s  WIX len=%s fnv=%s  FACIT len=%d fnv=%s"
                       % (pid, f.get("len"), f.get("fnv"), v["len"], v["fnv"]))
    return fel


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    d = {pid: facit(pid) for pid in sorted(B.HTML)}
    io.open(os.path.join(here, "facit-synlig.json"), "w",
            encoding="utf-8").write(json.dumps(d, indent=1, sort_keys=True))
    for pid in sorted(d):
        print("%s  synlig len %4d  fnv %s" % (pid, d[pid]["len"], d[pid]["fnv"]))
