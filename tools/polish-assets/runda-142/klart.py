# -*- coding: utf-8 -*-
"""Runda 142 — klart-kriteriet som GRIND, offline-halvan.

Den grindar SIDANS FORM, inte rundans påståenden — därför en egen fil och
inte fler rader i `grind.py`.

☠️ FLIKRUBRIKEN ÄR EN ALLOWLIST PÅ FYRA STRÄNGAR, mätt i butikens källkod.
   Allt som ska ligga i BRÖDTEXTEN måste stå FÖRE den första flikrubriken;
   ett block mellan två flikrubriker hamnar i den FÖREGÅENDE fliken.
"""
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import grindar as G                                              # noqa: E402
import texter as T                                               # noqa: E402
import brodtext as B                                             # noqa: E402

H2 = re.compile(r"<h2>(.*?)</h2>", re.S)
FLIKAR = ["Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor"]

# ☠️ Ordboundade tyska markörer. Ett tecken som finns i svenskan (ö, ä) får
#    ALDRIG stå i teckenklassen, och en naken ordstam fäller svenska böjningar
#    (`Rampe` inuti `Rampernas`). `Boxsack` och `Standbox` är entydigt tyska;
#    `Boxen` är det INTE — det är svenskans plural av box.
TYSKT = re.compile(
    r"(?<![0-9A-Za-zÅÄÖåäö])(?:"
    r"boxsack|standbox\w*|punchingball|boxbirne|boxst[äa]nder|boxdummy|"
    r"saugnapf\w*|saugn[äa]pfe\w*|standfu[sß]\w*|gef[üu]llt\w*|"
    r"h[öo]henverstellbar\w*|lieferumfang|abmessung\w*|gesamtma[sß]e|"
    r"gewicht|farbe|kunstleder|stahl|schwarz|weiss|wei[sß]|rot\b|"
    r"f[üu]r\b|und\b|mit\b|das\b|der\b|die\b"
    r")(?![0-9A-Za-zÅÄÖåäö])", re.I)


def _fel_per_produkt(pid):
    fel = []
    html = B.HTML[pid]
    rubriker = [r.strip() for r in H2.findall(html)]
    forsta = next((i for i, r in enumerate(rubriker) if r in FLIKAR), None)
    if forsta is None:
        fel.append("ingen flikrubrik alls")
    else:
        efter = rubriker[forsta:]
        if efter != FLIKAR:
            fel.append("flikrubrikerna efter den första är %r, väntade %r"
                       % (efter, FLIKAR))
    # Korslanken MASTE ligga fore forsta flikrubriken (runda 120).
    if forsta is not None:
        delar = H2.split(html)
        # delar: [fore, rubrik1, text1, rubrik2, text2, ...]
        efter_forsta_flik = "".join(delar[1 + 2 * forsta:])
        if "<a href" in efter_forsta_flik:
            fel.append("korslänk ligger EFTER en flikrubrik — hamnar i fliken")

    falt = {"namn": T.NAMN[pid], "titel": T.TITEL[pid], "meta": T.META[pid],
            "slug": T.SLUG[pid], "sokord": "\n".join(T.SOKORD[pid]),
            "html": G.strip_taggar(html)}
    for namn, txt in falt.items():
        for m in TYSKT.finditer(txt):
            fel.append("%s: TYSK REST %r i %r"
                       % (namn, m.group(0), txt[max(0, m.start() - 30):
                                                m.start() + 25]))
    if not T.SOKORD.get(pid):
        fel.append("sökorden är tomma — importen lämnar leverantörens rubrik där")
    if re.search(r"bra\s+att\s+veta|det\s+du\s+b[öo]r\s+veta", html, re.I):
        fel.append("förbjudet varningsblock ('Bra att veta')")
    vantad = "FP-" + G.sku_bas(T.SLUG[pid])
    if T.SKU[pid] != vantad:
        fel.append("SKU %r men husregeln ger %r" % (T.SKU[pid], vantad))
    if not T.WIX_VARIANT.get(pid):
        fel.append("wixVariantId saknas — Steg 8 ger 422 och skriver INGET")
    return fel


def _batchfel():
    fel = []
    for namn, karta in (("slug", T.SLUG), ("SKU", T.SKU),
                        ("namn", T.NAMN), ("titel", T.TITEL)):
        sett = {}
        for pid, v in karta.items():
            sett.setdefault(v, []).append(pid)
        for v, pids in sett.items():
            if len(pids) > 1:
                fel.append("DELAD %s %r på %s" % (namn, v, ", ".join(pids)))
    # ☠️ Varje lankmal maste FINNAS och bli SYNLIGT (#544). Mal inom batchen
    #    publiceras i samma runda; mal utanfor maste redan ligga i sitemapen.
    import io, json
    sitemap = set(json.load(io.open(os.path.join(HAR, "sitemap-slugs.json"),
                                    encoding="utf-8")))
    egna = set(T.SLUG.values())
    for pid, html in B.HTML.items():
        for m in re.finditer(r'<a href="https://www\.fyndplats\.se/produkt/'
                             r'([a-z0-9-]+)"', html):
            mal = m.group(1)
            if mal not in egna and mal not in sitemap:
                fel.append("%s länkar till %r som varken finns i batchen "
                           "eller i sitemapen" % (pid, mal))
            if mal == T.SLUG[pid]:
                fel.append("%s länkar till SIG SJÄLV" % pid)
    return fel


PLANTERADE_K = [
    ("flik", lambda: B.HTML.__setitem__(
        "56cca82a", B.HTML["56cca82a"].replace(
            "<h2>Användning och skötsel</h2>", "<h2>Montering och skötsel</h2>")),
     "flikrubrikerna efter"),
    ("tyskt", lambda: T.META.__setitem__(
        "ce8813ce", "Ein Punchingball mit Standfuß."), "TYSK REST"),
    ("sku", lambda: T.SKU.__setitem__("93073695", "FP-punchingboll"),
     "husregeln ger"),
    ("variant", lambda: T.WIX_VARIANT.__setitem__("4fe5959f", ""),
     "wixVariantId saknas"),
    ("delad slug", lambda: T.SLUG.__setitem__(
        "2730de6f", T.SLUG["136a4671"]), "DELAD slug"),
    ("dod lank", lambda: B.HTML.__setitem__(
        "f0430bc5", B.HTML["f0430bc5"].replace(
            "fristaende-boxningssack-160-230-cm", "en-sida-som-inte-finns")),
     "varken finns i batchen"),
]


def sjalvtest():
    """Kontraktet live-grinden kräver: `(fel-lista, antal fall)`."""
    import copy
    fel = []
    for etikett, mutera, vantad in PLANTERADE_K:
        sparat = (dict(T.SLUG), dict(T.SKU), dict(T.NAMN), dict(T.TITEL),
                  dict(T.META), dict(T.WIX_VARIANT), dict(B.HTML))
        try:
            mutera()
            traffar = []
            for pid in T.SLUG:
                traffar += _fel_per_produkt(pid)
            traffar += _batchfel()
            if not [t for t in traffar if vantad in t]:
                fel.append("MUTATION SLAPP IGENOM: %s — väntade %r (fick %s)"
                           % (etikett, vantad, traffar[:1] or "inget"))
        finally:
            (T.SLUG, T.SKU, T.NAMN, T.TITEL, T.META, T.WIX_VARIANT,
             B.HTML) = [d for d in sparat]
            # Modulattributen ar ombundna — skriv tillbaka i ORIGINALobjekten
            # sa att andra moduler som redan hallit en referens foljer med.
    return fel, len(PLANTERADE_K)


if __name__ == "__main__":
    alla = []
    for pid in T.SLUG:
        for f in _fel_per_produkt(pid):
            alla.append("%s  %s" % (pid, f))
    alla += _batchfel()
    st, antal = sjalvtest()
    print("klart: %d produkter, %d fel, %d självtestbrister (%d fall)"
          % (len(T.SLUG), len(alla), len(st), antal))
    for r in alla + st:
        print("  ☠️", r)
    raise SystemExit(1 if (alla or st) else 0)
