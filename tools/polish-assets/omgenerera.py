# -*- coding: utf-8 -*-
"""Bygger om `html` i en runda 118/119-skrivning.json efter flikrättningen.

☠️ DEFINITIONERNA ÄR BEVISADE, INTE GISSADE. Den gamla HTML:en ligger kvar i
   filen, så varje derivatfält gick att räkna om på den gamla texten och
   jämföras mot det lagrade talet — 9/9 på alla tre.

☠️ Och skillnaden mot runda 120 är ETT TECKEN. Runda 118/119 ersätter en tagg
   med ett MELLANSLAG, runda 120 med ingenting:

       runda 118/119:  re.sub(r"<[^>]+>", " ", html)
       runda 120:      re.sub(r"<[^>]+>", "",  html)

   Det är hela förklaringen till att runda 120:s åtta checksummor "flyttade
   sig" när filen genererades om. Summorna är alltså inte jämförbara MELLAN
   rundor — bara inom en. Två fält som heter likadant och betyder olika saker,
   husets vanligaste bugg i miniatyr.
"""
import json
import re
import sys


def _text(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()


def ordsumma(html):
    h = 0
    for ch in _text(html):
        h = (h * 31 + ord(ch)) % 1000000007
    return h


DERIVAT = {
    "ordsumma": ordsumma,
    "ord": lambda h: len(_text(h).split()),
    "synliga_tecken": lambda h: len(_text(h)),
}

runda = sys.argv[1]
sys.path.insert(0, runda)
import texter as T                                            # noqa: E402

sti = f"{runda}/skrivning.json"
data = json.load(open(sti, encoding="utf-8"))

# ── Först: BEVISA definitionerna mot den gamla texten ────────────────────
for falt, fn in DERIVAT.items():
    if falt not in next(iter(data.values())):
        continue
    fel = [p for p, v in data.items() if fn(v["html"]) != v[falt]]
    assert not fel, f"{falt} går inte att reproducera för {fel} — skriv inte över"
    print(f"  {falt}: definitionen reproducerad {len(data)}/{len(data)}")

# ── Sedan: bygg om ───────────────────────────────────────────────────────
for pid, v in data.items():
    namn, slug, titel, meta, sokord, html = T.bygg(pid)
    for f, vardet in (("namn", namn), ("slug", slug), ("titel", titel)):
        assert v[f] == vardet, f"{pid}: {f} ändrades — {v[f]!r} → {vardet!r}"
    v["html"] = html
    for falt, fn in DERIVAT.items():
        if falt in v:
            v[falt] = fn(html)

json.dump(data, open(sti, "w"), ensure_ascii=False, indent=1)
print(f"  {sti} omgenererad, {len(data)} produkter")
