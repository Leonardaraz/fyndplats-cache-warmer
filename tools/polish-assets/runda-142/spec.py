# -*- coding: utf-8 -*-
"""Rundans spec-tabell som DATA — parsad ur den byggda HTML:en.

☠️ INGEN TVILLING. Runda 141 bar `texter.SPEC` vid sidan av brödtextens
   `R()`-rader, alltså två listor av samma tal som kunde glida isär. Här
   LÄSES tabellen ur den HTML kunden faktiskt får, så kortets rader är
   bevisligen samma strängar som sidans spec-block.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brodtext as B                                             # noqa: E402

_BLOCK = re.compile(r"<h2>Tekniska specifikationer</h2><ul>(.*?)</ul>", re.S)
_RAD = re.compile(r"<li><p>([^:<]+):\s*(.*?)</p></li>", re.S)


def _las(pid):
    m = _BLOCK.search(B.HTML[pid])
    if not m:
        raise KeyError("%s saknar spec-block" % pid)
    rader = _RAD.findall(m.group(1))
    if not rader:
        raise KeyError("%s: spec-blocket gav noll rader" % pid)
    return [(e.strip(), v.strip()) for e, v in rader]


SPEC = {pid: _las(pid) for pid in B.HTML}


if __name__ == "__main__":
    for pid in sorted(SPEC):
        print("%s  %2d rader" % (pid, len(SPEC[pid])))
        for e, v in SPEC[pid]:
            print("      %-28s %s" % (e, v[:60]))
