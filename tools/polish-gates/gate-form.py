#!/usr/bin/env python3
"""Filgrind för ARTIKELNUMMERFORM i allt som når kunden: namn, text, SEO, alt-texter och kategorier.

☠️ VARFÖR DEN FINNS (2026-10-15, runda N168). `lib/polish/skrivplan.ts` vägrar en
plan där NÅGOT kundfält bär en artikelnummerform: gatelibs ARTNR, eller tre
tecken, bindestreck, minst tre till och minst en siffra (mått och spänningar som
`230-240V` släpps). Rutten kontrollerar namn, slug, html, SEO-titel, SEO-beskrivning,
SKU, varje alt-text och varje kategori.

`gate-sku.py` speglade formen bara för SKU:n och slugen. Golvlampan `a9013b5c`
skrevs med "tre E27-sockel" i text, rubrik, egenskapslista, FAQ och SEO-beskrivning:
alla lokala grindar var rena, workflowens torrkörning vägrade planen
(`html har artikelnummerform`, `seoBesk har artikelnummerform`) och inget skrevs.
Det kostade en push och en körning. `E27-sockel` är tre tecken, ett bindestreck
och sex till, med en siffra — exakt den form ett Aosom-artikelnummer har.

Skriv i stället "sockel av typen E27", "E27 sockel" eller något annat utan
bindestreck efter ett tretecksord med siffra. ☠️ Försvaga ALDRIG formen här eller
i rutten: en vägrad plan skriver ingenting och skrivs om, ett läckt artikelnummer
går inte att ta tillbaka, och ordet är Aosoms nummer som dealproffsen publicerar.

Grinden speglar FORM, TILLATEN_FORM och ARTNR TECKEN FÖR TECKEN. Träffen skrivs
ut MASKERAD (varje siffra blir #) så att den går att hitta och laga, men aldrig
som den står.

ANVÄNDNING (från rundans eller enhetens katalog):  python3 ../../polish-gates/gate-form.py
  namn.tsv      "kort  namn"
  <kort>.html   texten som skrivs (alla kort i ids.tsv eller namn.tsv)
  seo.tsv       "kort  titel  beskrivning"
  alt.tsv       "kort  position  alt-text"
  kategori.tsv  "kort  Kategori + Kategori"
"""
import glob
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gatelib import ARTNR  # noqa: E402

# Speglar FORM och TILLATEN_FORM i lib/polish/skrivplan.ts.
BRED_FORM = re.compile(r"\b[0-9A-Za-z]{3}-[0-9A-Za-z]{3,}\b")
TILLATEN_FORM = re.compile(r"^\d{2,4}-\d{2,4}(V|W|HZ|MM|CM)?$", re.I)


def traffar(s):
    """Träffarna i strängen, med ruttens två former."""
    ut = [m.group(0) for m in BRED_FORM.finditer(s)
          if re.search(r"\d", m.group(0)) and not TILLATEN_FORM.match(m.group(0))]
    ut += [m.group(0) for m in re.finditer(ARTNR, s)]
    return ut


def maskera(s):
    return re.sub(r"\d", "#", s)


def las(fn):
    if not os.path.exists(fn):
        return []
    return [r.rstrip("\n").split("\t") for r in open(fn, encoding="utf-8") if r.strip()]


fynd = 0
kontrollerade = 0


def kolla(fil, nr, falt, kort, text):
    global fynd, kontrollerade
    kontrollerade += 1
    for t in traffar(text):
        print(f"{fil}:{nr}  [ARTIKELNUMMERFORM] {falt} för {kort} bär formen {maskera(t)!r}, "
              "som rutten vägrar (tre tecken, bindestreck, minst tre till med en siffra)")
        fynd += 1


for nr, d in enumerate(las("namn.tsv"), 1):
    if len(d) >= 2:
        kolla("namn.tsv", nr, "namnet", d[0], d[1])

for nr, d in enumerate(las("seo.tsv"), 1):
    if len(d) >= 3:
        kolla("seo.tsv", nr, "SEO-titeln", d[0], d[1])
        kolla("seo.tsv", nr, "SEO-beskrivningen", d[0], d[2])

for nr, d in enumerate(las("alt.tsv"), 1):
    if len(d) >= 3:
        kolla("alt.tsv", nr, f"alt-texten för bild {d[1]}", d[0], d[2])

for nr, d in enumerate(las("kategori.tsv"), 1):
    if len(d) >= 2:
        for k in d[1].split(" + "):
            kolla("kategori.tsv", nr, "kategorin", d[0], k)

kort_med_text = set()
for fn in ("ids.tsv", "namn.tsv"):
    kort_med_text |= {d[0] for d in las(fn) if d}
for fn in sorted(glob.glob("[0-9a-f]" * 8 + ".html")):
    kort_med_text.add(fn[:8])
for kort in sorted(kort_med_text):
    fn = f"{kort}.html"
    if os.path.exists(fn):
        kolla(fn, 1, "texten", kort, open(fn, encoding="utf-8").read())

print(f"\nGRIND: {fynd} fynd i {kontrollerade} kontrollerade fält")
sys.exit(1 if fynd else 0)
