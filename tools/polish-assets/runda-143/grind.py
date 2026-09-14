# -*- coding: utf-8 -*-
"""Runda 143 — textgrinden, med självtest åt BÅDA hållen (#505).

☠️ RUNDANS EGNA FÖRBUD, utöver den delade modulen:

 1. **MAXLAST UTAN SÄCK.** Sex produkter bär ett kilotal som är lätt att läsa
    som en användarvikt (#548). Varje mening med ett `bär … kg` måste också
    innehålla ordet `säck`.
 2. **CE.** Sportredskap omfattas inte av något direktiv som ger CE-märkning.
 3. **ALLA GOLV / ALLA VÄGGAR.** Sugproppar fäster inte på matta, och ett
    väggfäste för 100 kg hör inte hemma i en gipsskiva. Leverantörens egna
    "geeignet für jeden Boden" får inte översättas rakt av.
 4. **ÅLDER.** Produkterna är inga leksaker, EN 71 gäller dem inte, och
    leverantören är själv oense om målgruppen.
 5. **BOLLENS HÖJDLÄGEN på `c00988e3`.** Ingressen säger fyra, punktlistan fem.
    Antalet får inte skrivas — spannet 167–187 cm får det.
 6. **BOXSTÅNGENS LÄNGD på `438295ae`.** Ritningen säger 45 cm, texten 50.
 7. **RUNBOOKENS EGEN NOTATION.** ☠️ och ⚠️ är interna märken och har inget
    på en kundsida att göra — de läckte in i en säljande mening i runda 95.
"""
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import grindar as G                                              # noqa: E402
import matt as M                                                 # noqa: E402
import texter as T                                               # noqa: E402
import brodtext as B                                             # noqa: E402

FORBJUDET = [
    # ☠️ Ärvd ur den delade modulen, inte kopierad hit. Se grindar.py.
    ("SORTIMENTSSUPERLATIV", G.SORTIMENTSSUPERLATIV.pattern),
    ("MARKNADSPÅSTÅENDE", G.MARKNADSPASTAENDE.pattern),
    ("CE-PÅSTÅENDE",
     r"\bCE-?m[äa]rk\w*|\bCE\b(?!\s*[0-9])"),
    ("ÅLDERSPÅSTÅENDE",
     r"\b(?:fr[åa]n|[öo]ver|upp\s+till)\s+\d{1,2}\s*[åa]rs?\b"
     r"|\b\d{1,2}\s*[-–]\s*\d{1,2}\s*[åa]r\b|\bEN\s*71\b"),
    ("ALLA UNDERLAG",
     r"\b(?:alla|varje|vilket\s+som\s+helst|samtliga)\s+"
     r"(?:golv|v[äa]ggar|v[äa]gg|underlag|ytor|yta)\b"
     r"|\bp[åa]\s+alla\s+(?:golv|v[äa]ggar)\b"
     r"|\bvar\s+som\s+helst\b"),
    ("RUNBOOKNOTATION",
     r"[☠⚠️]"),
    ("PRISPÅSTÅENDE",
     r"billig\w*|prisv[äa]rd\w*|kostar\s+(?:mindre|mer)|l[öo]nar\s+sig"
     r"|\bfynd(?:pris|k[öo]p)\w*"),
    ("LEVERANTÖRSATTRIBUTION",
     r"leverant[öo]ren\s+(?:anger|s[äa]ger|uppger|lovar)"
     r"|enligt\s+(?:leverant[öo]ren|tillverkaren)"),
]


def _falt(pid):
    """Varje kundsynligt fält, som (namn, text)."""
    return [
        ("namn", T.NAMN[pid]),
        ("titel", T.TITEL[pid]),
        ("meta", T.META[pid]),
        ("slug", T.SLUG[pid]),
        ("sku", T.SKU[pid]),
        ("brodtext", G.synlig_meningstext(B.HTML[pid])),
    ]


# ── ☠️ 1. MAXLAST: talet måste stå i en mening som också säger `säck` ──────
_MAXLAST = re.compile(r"b[äa]r[^.!?]{0,80}?\b(\d{2,3})\s*kg", re.I)


def maxlast_utan_sack(text):
    fel = []
    for mening, par in G.meningar(text):
        if not re.search(r"\bb[äa]r\b", mening, re.I):
            continue
        if not re.search(r"\d{2,3}\s*kg", mening):
            continue
        # Säcken får stå i meningen själv ELLER i den direkt följande —
        # G.meningar ger paret just för att en förklaring ofta ligger efter.
        if not re.search(r"s[äa]ck", par, re.I):
            fel.append("MAXLAST UTAN SÄCK: %r" % mening.strip()[:110])
    return fel


# ── ☠️ 5 och 6: två tal som INTE får skrivas på bestämda rader ────────────
FORBJUDET_TAL = {
    # c00988e3: ingressen säger fyra höjdlägen, punktlistan fem.
    "c00988e3": [(r"\b(?:fyra|fem|4|5)\s+(?:olika\s+)?(?:h[öo]jdl[äa]gen?|l[äa]gen|steg)\b"
                  r"|\b(?:h[öo]jdl[äa]gen?|l[äa]gen)\s*[:\s]\s*(?:fyra|fem|4|5)\b",
                  "bollens höjdlägen — källan säger fyra på ett ställe och fem på ett annat")],
    # 438295ae: ritningen säger 45 cm, texten 50.
    "438295ae": [(r"\bboxst[åa]ng\w*[^.!?]{0,40}?\b(?:45|50)\s*cm"
                  r"|\b(?:45|50)\s*cm[^.!?]{0,40}?\bboxst[åa]ng",
                  "boxstångens längd — ritningen säger 45 cm, texten 50")],
}


def granska(pid, html=None, live=False):
    fel = []
    falt = _falt(pid) if html is None else [("live", G.synlig_meningstext(html))]

    for namn, text in falt:
        # Den delade modulens grindar
        for f in G.ARTNR.findall(text):
            fel.append("%s: ARTIKELNUMMER %r" % (namn, f))
        for m in G.HUSMARKEN:
            if re.search(r"\b%s\b" % re.escape(m), text, re.I):
                fel.append("%s: HUSMÄRKE %r" % (namn, m))
        for o in G.LANDORD:
            if re.search(r"\b%s\b" % re.escape(o), text, re.I):
                fel.append("%s: LANDORD %r" % (namn, o))
        for fras in G.LAGERFRAS:
            if fras in text.lower():
                fel.append("%s: LAGERFRAS %r" % (namn, fras))
        for h in G.homoglyfer(text):
            fel.append("%s: HOMOGLYF %s" % (namn, h))
        for m in G.TREKONSONANT.finditer(text):
            fel.append("%s: TREKONSONANT %r" % (namn, m.group(0)))
        # Rundans egna
        for etikett, monster in FORBJUDET:
            for m in re.finditer(monster, text, re.I):
                fel.append("%s: %s %r" % (namn, etikett, m.group(0)))
        for monster, forklaring in FORBJUDET_TAL.get(pid, []):
            for m in re.finditer(monster, text, re.I):
                fel.append("%s: FÖRBJUDET TAL (%s) %r" % (namn, forklaring, m.group(0)))
        fel += ["%s: %s" % (namn, f) for f in maxlast_utan_sack(text)]

    if live:
        # ☠️ `G.flikfel` letar efter <summary> — butikens rendering, inte vår
        #    källtext. Runda 134 och 139 skrev ned samma fälla; den här grinden
        #    gick i den ändå och fällde 17 av 17 korrekta sidor.
        fel += ["struktur: %s" % f for f in G.flikfel(html)]
    if html is None:
        # Offline är rubrikerna <h2>: exakt en var, i allowlistens ordning.
        for f in G.FLIKAR_SOM_KRAVS:
            n_ = B.HTML[pid].count("<h2>" + f + "</h2>")
            if n_ != 1:
                fel.append("struktur: FLIK %r står %d gånger som <h2> (ska vara 1)"
                           % (f, n_))
        plats = [B.HTML[pid].find("<h2>" + f + "</h2>") for f in G.FLIKAR_SOM_KRAVS]
        if sorted(plats) != plats:
            fel.append("struktur: FLIKORDNINGEN är %s, ska följa %s"
                       % (plats, list(G.FLIKAR_SOM_KRAVS)))
        # Leveranslöften mot det leveranslistan FAKTISKT har.
        syn = G.synlig_meningstext(B.HTML[pid])
        fel += ["löfte: %s" % f
                for f in G.leveransloften(syn, M.P[pid].get("ingar", []), pid)]
    return fel


# ☠️ Fallen ligger på MODULNIVÅ för att antalet ska kunna HÄRLEDAS.
#    `sjalvtest()` måste enligt `liverunda.sjalvtester` svara
#    `(fel-lista, antal fall)`, och ett avskrivet antal är en tvilling som
#    glider isär så fort någon lägger till ett fall. Runda 143 skrev först
#    "GRÖNT (12 fall)" som en konstant — den siffran hade stått kvar oförändrad
#    hur många fall som än lades till.
# Varje rad: (namn, muterad text, ska_falla).
SJALVTESTFALL = [
        ("maxlast utan säck faller",
         "Stället bär upp till 60 kg.", True),
        ("maxlast MED säck går fritt",
         "Stället bär en säck på upp till 60 kg.", False),
        ("CE-påstående faller",
         "Produkten är CE-märkt och testad.", True),
        ("ålder faller",
         "Passar från 12 års ålder.", True),
        ("alla golv faller",
         "Sugpropparna fäster på alla golv.", True),
        ("alla väggar faller",
         "Fästet kan monteras på alla väggar.", True),
        ("var som helst faller",
         "Stället kan ställas var som helst i hemmet.", True),
        ("runbooknotation faller",
         "☠️ Underlaget avgör, inte fästet.", True),
        ("prispåstående faller",
         "Ett billigt sätt att komma igång.", True),
        ("leverantörsattribution faller",
         "Leverantören anger 25 minuters montering.", True),
        ("den riktiga golvmeningen går fritt",
         B.SUGPROPP_GOLV, False),
        ("den riktiga underlagsmeningen går fritt",
         "Fästet är byggt för betong, tegel eller massivt trä.", False),
]


def _sjalvtest():
    """☠️ En grind som inte provats åt BÅDA håll är ett antagande."""
    fel = []
    for namn, text, ska in SJALVTESTFALL:
        traff = []
        for etikett, monster in FORBJUDET:
            for m in re.finditer(monster, text, re.I):
                traff.append("%s %r" % (etikett, m.group(0)))
        traff += maxlast_utan_sack(text)
        if bool(traff) != ska:
            fel.append("SJÄLVTEST: %r — väntade %s, fick %s"
                       % (namn, "FALL" if ska else "FRITT", traff or "FRITT"))
    return fel


def sjalvtest():
    """Kontraktet live-grinden kräver: `(fel-lista, antal fall)`.

    ☠️ NAMNET ÄR GRINDEN. `liverunda.sjalvtester` gör
       `getattr(GR, "sjalvtest", None)` — en runda som bara har `_sjalvtest`
       får den TYST överhoppad (#556). Och formen är grinden näst efter
       namnet: en naken lista passerar `getattr` men fälls av kontrollen i
       `liverunda`, som kräver tvåtupeln.
    """
    return _sjalvtest(), len(SJALVTESTFALL)


if __name__ == "__main__":
    st, antal = sjalvtest()
    print("SJÄLVTEST:", "GRÖNT (%d fall)" % antal if not st
          else "%d FEL av %d fall" % (len(st), antal))
    for f in st:
        print("  ✗", f)

    tot = 0
    for pid in T.BATCH:
        f = granska(pid)
        tot += len(f)
        if f:
            print("\n%s — %d fel" % (pid, len(f)))
            for x in f:
                print("   ✗", x)
    print("\nTEXTGRIND:", "GRÖN" if not tot and not st else "%d fel" % (tot + len(st)))
