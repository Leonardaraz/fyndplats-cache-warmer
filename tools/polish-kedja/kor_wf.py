#!/usr/bin/env python3
"""kor_wf.py <workflow.yml> <ref> [nyckel=värde ...]: startar en workflow och väntar ut den (ghw.dispatch_and_wait).

Skriver ett JSON-svar med ok, conclusion, url, id och sek. ghw.py ligger bredvid den här filen.
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, "ghw.py"), encoding="utf-8").read()
src = src.split("\ndef main():")[0]
ns = {"__name__": "ghw_lib"}
exec(compile(src, "ghw_lib", "exec"), ns)
wf = sys.argv[1]
ref = sys.argv[2]
inputs = {}
for kv in sys.argv[3:]:
    k, v = kv.split("=", 1)
    inputs[k] = v
res = ns["dispatch_and_wait"](wf, inputs, ref=ref, timeout=1700)
print(json.dumps(res, ensure_ascii=False))
