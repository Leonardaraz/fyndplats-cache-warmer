#!/usr/bin/env python3
"""bygg-tillagg-flera.py <ut.js> [--torr] <id8> [<id8> ...]: bygger ETT ExecuteWixAPI-skript som kör galleri-tillagg.js för flera sidor i följd.

Skriptet är galleri-tillagg.js oförändrat (alla spärrar, kontrollsumman av planen och återläsningen per sida), insvept i en funktion per sida. Planerna kommer ur
plan_<id8>.json i den här katalogen (bygg.py). Högst tre sidor per skript: varje sida tar 8–12 sekunder, ExecuteWixAPI har 60. En sida som inte hinner
får steg "tid" och körs om. --torr skriver ingenting (hasMutations false).
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
GATES = os.path.join(HERE, "..", "..", "polish-gates")


def fnv(s):
    m = 0xFFFFFFFFFFFFFFFF
    h = 0xCBF29CE484222325
    for b in s.encode():
        h ^= b
        h = (h * 0x100000001B3) & m
    return format(h, "016x")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    torr = "--torr" in sys.argv[1:]
    ut, ids = args[0], args[1:]
    if not ids or len(ids) > 3:
        sys.exit("1–3 sidor per skript")
    src = open(os.path.join(GATES, "galleri-tillagg.js"), encoding="utf-8").read().split("\n")
    rader = [l.rstrip() for l in src if not re.match(r"^\s*//", l) and l.strip()]
    text = "\n".join(rader)
    for gammal in ("  const T0 = Date.now();\n", "  const PLAN = null;\n", '  const SUM = "";\n', "  const TORR = false;\n"):
        if text.count(gammal) != 1:
            sys.exit("mallen saknar raden %r" % gammal)
        text = text.replace(gammal, "")
    if not text.startswith("async function () {\n") or not text.rstrip().endswith("\n}"):
        sys.exit("mallen har en oväntad form")
    kropp = text[len("async function () {\n"):].rstrip()
    kropp = kropp[:-2]  # den sista }
    planer = []
    for id8 in ids:
        plan = json.load(open(os.path.join(HERE, "plan_%s.json" % id8.replace(":", "_")), encoding="utf-8"))
        js = json.dumps(plan, ensure_ascii=False, separators=(",", ":"))
        planer.append("[%s,\"%s\"]" % (js, fnv(js)))
    ut_js = (
        "async function () {\n"
        "  const TORR = %s;\n"
        "  const PLANER = [\n    %s\n  ];\n"
        "  const kor = async function (PLAN, SUM) {\n  const T0 = Date.now();\n%s\n  };\n"
        "  const ut = [];\n  const T00 = Date.now();\n"
        "  for (const pr of PLANER) {\n"
        "    if (Date.now() - T00 > 36000) { ut.push({ ok: false, steg: \"tid\", id: String(pr[0].id).slice(0, 8), fel: \"ej körd, tiden räckte inte (kör om)\" }); continue; }\n"
        "    try { ut.push(await kor(pr[0], pr[1])); } catch (e) { ut.push({ ok: false, steg: \"undantag\", id: String(pr[0].id).slice(0, 8), fel: String(e && e.message ? e.message : e).slice(0, 160) }); }\n"
        "  }\n  return ut;\n}\n"
    ) % ("true" if torr else "false", ",\n    ".join(planer), kropp)
    open(ut, "w", encoding="utf-8").write(ut_js)
    print(len(ut_js), "tecken,", len(ids), "sidor", "(TORR)" if torr else "(SKARPT)")


if __name__ == "__main__":
    main()
