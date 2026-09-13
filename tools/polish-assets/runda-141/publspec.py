# -*- coding: utf-8 -*-
"""Runda 141 — spec-tabellen pa en PUBLICERAD sida finns i TVA former.

☠️ Katalogens publicerade spec-block ar inte ett format utan tva, och en
   grind som kanner ett av dem laser det andra som TOMT:

   A. LISTFORM   <li><p>Etikett: varde</p></li>
   B. FLYTFORM   <p><span style="font-weight: 700">Etikett:</span> varde.
                    <span …>Etikett2:</span> varde2. …</p>

   Uppmatt pa de elva publicerade traningsbankarna: SEX i listform, FEM i
   flytform — och de fem ar precis gymstationerna, alltsa en sammanhangande
   grupp. Det ar inte slump: de ar skrivna i en annan runda.

   Samma familj som #385 (butikens rekommendationsrad i tva serialiseringar).
   Forsta monstret gav noll rader pa ALLA elva; det andra pa fem av elva.
   ⚠️ NOLL PA ALLA ar tellet — en akta matning varierar.
"""
import re

_LISTRAD = re.compile(
    r"<li>\s*(?:<p>)?\s*(?:<strong>|<span style=\"font-weight: 700\">)?"
    r"([A-ZÅÄÖa-zåäö][^<:]{1,45}?):"
    r"(?:</strong>|</span>)?\s*([^<]{1,140})")
_FLYTRAD = re.compile(
    r"(?:<strong>|<span style=\"font-weight: 700\">)\s*"
    r"([A-ZÅÄÖa-zåäö][^<:]{1,45}?):\s*(?:</strong>|</span>)\s*([^<]{1,160})")


def specblock(html, rubrik="Tekniska specifikationer"):
    """Returnerar spec-flikens rahtml, eller tom strang."""
    i = html.find(rubrik)
    if i < 0:
        return ""
    j = html.find("</details>", i)
    return html[i:j if j > 0 else i + 4000]


def spec(html, rubrik="Tekniska specifikationer"):
    """Etikett -> varde, oavsett vilken av de tva formerna sidan bar."""
    blk = specblock(html, rubrik)
    if not blk:
        return {}
    ut = {k.strip(): v.strip().rstrip(". ") for k, v in _LISTRAD.findall(blk)}
    if ut:
        return ut
    return {k.strip(): v.strip().rstrip(". ") for k, v in _FLYTRAD.findall(blk)}


def _sjalvtest():
    """☠️ Grinden maste bevisas pa BADA formerna, annars ar den halvblind."""
    fel = []
    a = spec('x Tekniska specifikationer</summary><div><ul>'
             '<li><p>Mått: 53 × 153 cm</p></li>'
             '<li><p>Nettovikt: 12 kg</p></li></ul></details>')
    if a != {"Mått": "53 × 153 cm", "Nettovikt": "12 kg"}:
        fel.append("listform: %r" % (a,))
    b = spec('x Tekniska specifikationer</summary><div><p>'
             '<span style="font-weight: 700">Yttermått:</span> 148 × 108 cm. '
             '<span style="font-weight: 700">Viktblock:</span> 45 kilo.'
             '</p></details>')
    if b != {"Yttermått": "148 × 108 cm", "Viktblock": "45 kilo"}:
        fel.append("flytform: %r" % (b,))
    if spec("ingen spec har alls") != {}:
        fel.append("saknad rubrik ska ge tom dict")
    return fel


if __name__ == "__main__":
    import io, json, sys
    fel = _sjalvtest()
    print("sjalvtest: %d fel" % len(fel))
    for f in fel:
        print("  ☠️", f)
    if fel:
        sys.exit(1)

    ut, former = {}, {}
    for s in json.load(open("publicerade-spec.json", encoding="utf-8")):
        h = io.open("live-publ/%s.html" % s, encoding="utf-8").read()
        blk = specblock(h)
        ut[s] = spec(h)
        former[s] = "lista" if _LISTRAD.search(blk) else ("flyt" if blk else "—")
        print("%-50s %-6s %2d rader" % (s, former[s], len(ut[s])))
    io.open("publicerade-spec.json", "w", encoding="utf-8").write(
        json.dumps(ut, ensure_ascii=False, indent=1))
    tomma = [s for s, d in ut.items() if not d]
    print("\nformer:", {f: list(former.values()).count(f) for f in set(former.values())})
    print("tomma :", tomma if tomma else "inga")
