"""Grind för en KATEGORITEXT (sökordskategori i butiken, `headless-site`).

    python3 ../../polish-gates/gate-kategori.py julgranar-text.json

Filen bär `seo` (title, description) och `content` (intro[], faq[{q, a}]) —
exakt de två poster som läggs i `lib/category-seo.ts` och
`lib/category-content.ts` på butiksgrenen. Grinden kör:

- husets GRINDAR ur gatelib (husmärke, artikelnummer, fraktland, leverantör,
  tyska rester, stavning, homoglyfer, EN-norm),
- teckenlistan (TILLATNA_TECKEN),
- markup: butiken visar intro och FAQ som REN TEXT (`<p>{para}</p>`,
  `<dd>{f.a}</dd>`), så `**fet**`, `<strong>`, `[länk](…)` och `&nbsp;` syns
  ordagrant för kunden. Uppmätt på /kategori/belysning 2026-09-24:
  `**Sockeln**` hade stått med asteriskerna sedan 2026-08-12,
- superlativ i samma mening som ett omfång ("smalast av våra"),
- och butikstesternas längdkrav (`category-seo.test.ts`): titel ≤ 48 + suffix,
  beskrivning 110–165, intro ≥ 90 ord, minst två frågor.

Sifferpåståendena grindas INTE här — de stäms av mot produktbeskrivningarna
och skrivs som facit i filens `facit`-fält. Ordlistorna bor i gatelib och
importeras; en egen lista här hade glidit isär (gate-kopior.test.ts).
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gatelib as G  # noqa: E402

if len(sys.argv) != 2:
    sys.exit("användning: gate-kategori.py <kategoritext.json>")

d = json.load(open(sys.argv[1], encoding="utf-8"))
texter = [("seo.title", d["seo"]["title"]), ("seo.description", d["seo"]["description"])]
texter += [(f"intro[{i}]", t) for i, t in enumerate(d["content"]["intro"])]
for i, f in enumerate(d["content"]["faq"]):
    texter += [(f"faq[{i}].q", f["q"]), (f"faq[{i}].a", f["a"])]

# Butiken renderar texterna som ren text; allt här syns ordagrant för kunden.
MARKUP = re.compile(r"\*+|`+|_+|<[^>]*>|\[[^\]]*\]\([^)]*\)|&[A-Za-z0-9#]+;|^#{1,6}\s", re.M)

fynd = []
for namn, t in texter:
    for etikett, monster in G.GRINDAR:
        for m in re.finditer(monster, t):
            fynd.append(f"{namn}: {etikett} {m.group(0)!r}")
    for m in MARKUP.finditer(t):
        fynd.append(f"{namn}: MARKUP {m.group(0)!r} (butiken visar ren text)")
    for ch in t:
        if ord(ch) > 127 and ch not in G.TILLATNA_TECKEN:
            fynd.append(f"{namn}: TECKEN {ch!r} U+{ord(ch):04X}")
    for men in G.meningar(t):
        if re.search(G.SUPERLATIV, men, re.I) and re.search(G.OMFANG, men, re.I):
            fynd.append(f"{namn}: SUPERLATIV+OMFÅNG {men!r}")

title, desc = d["seo"]["title"], d["seo"]["description"]
if len(title) + len(" | Fyndplats") > 60:
    fynd.append(f"title {len(title)} tecken + suffix > 60")
if not 110 <= len(desc) <= 165:
    fynd.append(f"description {len(desc)} tecken (110–165)")
ord_ = len(" ".join(d["content"]["intro"]).split())
if ord_ < 90:
    fynd.append(f"intro {ord_} ord (minst 90)")
if len(d["content"]["faq"]) < 2:
    fynd.append("färre än två FAQ")

print(f"title {len(title)} · description {len(desc)} · intro {ord_} ord · faq {len(d['content']['faq'])}")
for f in fynd:
    print("FYND", f)
print("RENT" if not fynd else f"{len(fynd)} FYND")
sys.exit(1 if fynd else 0)
