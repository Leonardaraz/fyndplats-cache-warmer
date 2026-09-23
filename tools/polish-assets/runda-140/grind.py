# -*- coding: utf-8 -*-
"""Runda 140 — textgrinden, med självtest åt BÅDA hållen (#505).

☠️ RUNDANS EGNA FÖRBUD, utöver den delade modulen:

   1. **PVC och vattenavvisning.** `07ac9918`:s bild 5 är en leverantörsgrafik
      med rubriken "PVC MATERIALS" och punkten "Water-resistant". Tyskans
      `Technische Daten` säger `Naturholz, Plüsch, Schaumstoff`. De kan inte
      båda stämma; ingen av dem går att verifiera; ingen av dem skrivs.

   2. **CE-påståenden.** Det finns ingen CE-direktivsfamilj för
      husdjursmöbler.

   3. **`massiv`, `massivt trä` på de fem MDF-stommarna.** Grupp A, `c9ccf5a3`
      och `68f8cae9` har MDF i stommen. Ordet är DÄREMOT korrekt på `ee19a8c8`
      (tyskan: `Massiver Holzrahmen`) och på björkbenen i grupp B och C
      (`massivem Birkenholz` / `Robuste Massivholzbeine`) — därför är förbudet
      PRODUKTSPECIFIKT, inte globalt.

   4. **Attribution uppåt i ledet.** Mot kunden är VI leverantören (batch 64).

   5. **Jordbruksverksreferenser.** L80 sätter mått på förvaringsutrymmen. En
      hundsoffa är en möbel; djuret hålls inte inneslutet och det finns inget
      krav att uppfylla.

   6. **Seriesuperlativ.** `4c5d4687`:s 15 cm var först "seriens högsta" på tre
      ställen. Det är ett MÄTT påstående om hela katalogen som ingen har mätt
      (#533). Fyra sådana ströks innan grinden ens kördes.
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


def _vikt(o):
    """Ordgräns som fungerar på svenska — `\\b` räcker inte (#324)."""
    return re.compile(r"(?<![0-9A-Za-zÅÄÖåäöÉéÜü])" + o
                      + r"(?![0-9A-Za-zÅÄÖåäöÉéÜü])", re.I)


FORBJUDET = [
    (re.compile(r"\b(?:som|se)\s+(?:ovan|nedan|ovanst[åa]ende|f[öo]reg[åa]ende)\b"
                r"|\b(?:ovanst[åa]ende|nedanst[åa]ende)\b", re.I),
     "SIDHÄNVISNING — en produktsida har inget 'ovan'"),
    (re.compile(r"^Samma\s+\w+", re.I),
     "DINGLANDE SYSKONREFERENS"),
    (re.compile(r"\brundan\b|\brunda\s+\d+|\bbatch\b|\butkast\b", re.I),
     "INTERN JARGONG"),
    (re.compile(r"\bmarknadens\b|\bbranschens\b|\bseriens\b"
                r"|\b(?:av|bland|i)\s+v[åa]r[at]?\b|\bvi\s+har\b"
                r"|\bi\s+sortimentet\b|\bhos\s+oss\s+[äa]r\b", re.I),
     "SORTIMENTSSUPERLATIV utan mätvärde (#522, #533)"),
    (_vikt(r"b[äa]st[ae]?"), "SUPERLATIV utan mätvärde"),
    (_vikt(r"st[öo]rst[ae]?"), "SUPERLATIV utan mätvärde"),
    (_vikt(r"h[öo]gst[ae]"), "SUPERLATIV utan mätvärde"),
    (re.compile(r"\bCE[-\s]?m[äa]rkt\w*|\bCE[-\s]?m[äa]rkning\w*", re.I),
     "CE-PÅSTÅENDE — ingen CE-direktivsfamilj täcker husdjursmöbler"),
    (re.compile(r"\bJordbruksverket\w*|\bSJVFS\b|\bL\s?80\b", re.I),
     "MYNDIGHETSREFERENS — L80 gäller förvaringsutrymmen, inte möbler"),
    (re.compile(r"\bPVC\b", re.I),
     "PVC — leverantörsgrafikens påstående, motsagt av spec-blocket"),
    (re.compile(r"\bvattent[äa]t\w*|\bvattenavvisande\w*|\bvattenavst[öo]tande\w*"
                r"|\bfuktavvisande\w*", re.I),
     "VATTENPÅSTÅENDE — ingen av de fjorton har ett belagt sådant"),
    (re.compile(r"\bantibakteriell\w*|\bhypoallergen\w*|\bortoped\w*", re.I),
     "HÄLSOPÅSTÅENDE utan belägg"),
]

# Produktspecifika förbud: (pid, mönster, skäl)
_MDF_STOMMAR = ("01fcdf1d", "bb3cd4ed", "881540a6", "c9ccf5a3", "68f8cae9")
SPECIFIKA = [(p, _vikt(r"massiv\w*"),
              "☠️ MATERIALLÖGN — stommen är MDF på den här modellen")
             for p in _MDF_STOMMAR]
SPECIFIKA += [
    ("07ac9918", _vikt(r"vattenfast\w*"), "Vattenpåstående saknar belägg"),
    ("68f8cae9", re.compile(r"kroppsl[äa]ngd"),
     "☠️ KROPPSLÄNGDEN är inte läsbar här — tyskan säger Schulterhöhe"),
    ("68f8cae9", re.compile(r"90\s*(?:×|x)\s*60"),
     "☠️ DYNMÅTTET är större än sitsen och skrivs inte"),
    ("9ee2fa6e", re.compile(r"92\s*(?:×|x)\s*47"),
     "☠️ DYNMÅTTET är större än sitsen och skrivs inte"),
    ("c11948ac", re.compile(r"92\s*(?:×|x)\s*47"),
     "☠️ DYNMÅTTET är större än sitsen och skrivs inte"),
    ("07ac9918", re.compile(r"63\s*(?:×|x)\s*43"),
     "☠️ DYNMÅTTET är större än sitsen och skrivs inte"),
]

# Steg 2: det POSITIVA villkoret måste stå i texten, per produkt.
KRAVS = {}
for _p in T.NAMN:
    krav = []
    gr = M.M[_p]
    tal = gr["last_kg"] if gr["last_kg"] is not None else gr["hund_kg"]
    if tal is not None:
        s = ("%g" % tal).replace(".", "[,.]")
        krav.append((re.compile(s + r"\s*kg"),
                     "VIKTGRÄNSEN måste stå i texten (Steg 2, villkor 1)"))
    krav.append((re.compile(r"<h2>F[öo]r (?:hundar|husdjur) upp till", re.I),
                 "VIKTGRÄNSEN måste ha EGEN RUBRIK (Steg 2)"))
    KRAVS[_p] = krav


def granska(pid, html=None, live=False):
    """live=True granskar den RENDERADE sidan i stället för källtexten."""
    fel = []
    namn, titel, meta = T.NAMN[pid], T.TITEL[pid], T.META[pid]
    html = html if html is not None else T.bygg(pid)
    if live:
        syn = G.livetext(html, T.SLUG[pid], namn)
    else:
        syn = G.strip_taggar(html)
    allt = " ".join([namn, titel, meta, syn])

    # ── delade grindar ────────────────────────────────────────────────
    if G.ARTNR.search(allt):
        fel.append("ARTIKELNUMMER i kundtext")
    if not live:
        h = G.homoglyfer(allt)
        if h:
            fel.append("HOMOGLYFER: %r" % (h,))
    # ☠️ Fyndsträngen bär MENINGEN, aldrig ett läge (#538) — annars kan
    #    `liverunda`s exakta subtraktion aldrig matcha.
    for t in G.TREKONSONANT.finditer(allt):
        fel.append("TRE LIKA KONSONANTER %r — %r"
                   % (t.group(0), G.mening_kring(allt, t.start())[:90]))
    if G.JARGONG.search(allt):
        fel.append("JARGONG")
    for n in G.granska_namn(namn):
        fel.append("NAMN: " + n)
    if live:
        fel.extend("FLIKSTRUKTUR: %s" % x for x in G.flikfel(html))
    else:
        for f in G.FLIKAR_SOM_KRAVS:
            n_ = html.count("<h2>" + f + "</h2>")
            if n_ != 1:
                fel.append("FLIK: %r förekommer %d gånger som <h2> (ska vara 1)"
                           % (f, n_))
        ordning = [html.find("<h2>" + f + "</h2>") for f in G.FLIKAR_SOM_KRAVS]
        if ordning != sorted(ordning):
            fel.append("FLIK: rubrikerna står i fel ordning")
    for o in G.LANDORD:
        if _vikt(o).search(allt):
            fel.append("LANDORD: " + o)
    for f in G.LAGERFRAS:
        if f.lower() in allt.lower():
            fel.append("LAGERFRAS: " + f)
    for m in G.HUSMARKEN:
        if _vikt(m).search(allt):
            fel.append("HUSMÄRKE: " + m)
    for a in G.ATTRIBUTION:
        if _vikt(a).search(allt):
            fel.append("ATTRIBUTION: " + a + " — mot kunden är VI leverantören")

    # ── rundans egna förbud, över PÅSTÅENDEN (inte naken finditer, #415) ──
    for monster, skal in FORBJUDET:
        if G.pastaenden(syn, monster) or monster.search(namn + " " + titel + " " + meta):
            fel.append(skal)
    for p, monster, skal in SPECIFIKA:
        if p != pid:
            continue
        if G.pastaenden(syn, monster) or monster.search(namn + " " + titel + " " + meta):
            fel.append(skal)

    # ── POSITIVA villkor ur Steg 2 ────────────────────────────────────
    for monster, skal in KRAVS[pid]:
        underlag = html if "<h2>" in monster.pattern else allt
        if not monster.search(underlag):
            fel.append("SAKNAS: " + skal)

    # ── talgrinden, ZONINDELAD (#runbok: ett länkat tal bara i sitt stycke) ──
    if not live:
        fel.extend(_talgrind(pid, html))

    # ── strukturen (bara källtexten: taggarna finns inte på sidan) ────
    if live:
        return fel
    i_flik = html.find("<h2>Tekniska specifikationer</h2>")
    i_kors = html.find(T.KORS_INGRESS[pid])
    if i_kors < 0 or i_flik < 0 or i_kors > i_flik:
        fel.append("KORSLÄNKARNA ligger inte före första flikrubriken")
    for s, _ in T.KORSLANK[pid]:
        if s == T.SLUG[pid]:
            fel.append("SJÄLVLÄNK i korslänkarna")
    if 'href="/' in html:
        fel.append("ROTRELATIV href — Wix skriver om den till en död länk")
    return fel


_TAL = re.compile(r"\d+(?:[,.]\d+)?")
# Tal som är rena formuleringar, inte produktuppgifter.
_FRIA = {"1", "2", "3", "4", "100", "0"}


def _egna_tal(pid):
    """Produktens egen uppsättning tal, härledd ur matt.py."""
    g = M.M[pid]
    ut = set()

    def lagg(v):
        if v is None:
            return
        ut.add(("%g" % v).replace(".", ","))
        ut.add("%g" % v)

    for nyckel in ("tot", "sits", "dyna", "rygg", "paket", "forvaring"):
        v = g.get(nyckel)
        if v:
            for x in v:
                lagg(x)
    for nyckel in ("ben", "vikt_de", "vikt_frakt", "hund_kg", "hund_cm",
                   "last_kg", "bottenhojd"):
        lagg(g.get(nyckel))
    return ut


def _talgrind(pid, html):
    """Ett LÄNKAT tal får bara stå i länkens eget stycke."""
    egna = _egna_tal(pid) | _FRIA
    lankade = set()
    for slug, _ in T.KORSLANK[pid]:
        for annan, s2 in T.SLUG.items():
            if s2 == slug:
                lankade |= _egna_tal(annan)
        for tal in _TAL.findall(slug):
            lankade.add(tal)
    fel = []
    for stycke in re.findall(r"<(?:p|li)\b[^>]*>.*?</(?:p|li)>", html, re.S):
        tillatna = egna | lankade if "<a href" in stycke else egna
        txt = G.strip_taggar(stycke)
        for tal in _TAL.findall(txt):
            if tal not in tillatna:
                fel.append("OHÄRLETT TAL %r i %r" % (tal, txt[:70]))
    return fel


# ── självtest: varje regel har ett fall som SKA fälla och ett som INTE ska ──
SJALVTEST = [
    ("Den är gjord för hundar upp till 30 kg.", None),
    ("Leverantören anger upp till 30 kg.", "ATTRIBUTION"),
    ("Ramen är av massiv furu.", None),                 # sant på ee19a8c8
    ("Klädseln är plysch.", None),
    ("Den är CE-märkt.", "CE-PÅSTÅENDE"),
    ("Den uppfyller Jordbruksverkets krav.", "MYNDIGHETSREFERENS"),
    ("Klädseln är av PVC.", "PVC"),
    ("Överdraget är vattentätt.", "VATTENPÅSTÅENDE"),
    ("Stoppningen är antibakteriell.", "HÄLSOPÅSTÅENDE"),
    ("Benhöjden är 15 cm.", None),
    ("Det är seriens högsta benhöjd.", "SORTIMENTSSUPERLATIV"),
    ("Den högsta av våra hundsoffor.", "SORTIMENTSSUPERLATIV"),
    ("Det är den högsta modellen.", "SUPERLATIV"),
    ("Kroppslängd på högst 60 cm.", None),
    ("Sittytan är 86 × 59 cm.", None),
    ("Vi har den bredaste sittytan.", "SORTIMENTSSUPERLATIV"),
]


def _sjalvtest():
    fel = []
    for txt, vantat in SJALVTEST:
        traff = None
        for monster, skal in FORBJUDET:
            if monster.search(txt):
                traff = skal.split(" ")[0]
                break
        if traff is None:
            for a in G.ATTRIBUTION:
                if _vikt(a).search(txt):
                    traff = "ATTRIBUTION"
                    break
        if vantat is None and traff is not None:
            fel.append("FALSK TRÄFF på %r → %s" % (txt, traff))
        if vantat is not None and (traff is None or not traff.startswith(vantat)):
            fel.append("MISSAD TRÄFF på %r (fick %s, väntat %s)" % (txt, traff, vantat))
    # massiv-förbudet är produktspecifikt: det SKA fälla på en MDF-stomme
    # och vara tyst på ee19a8c8.
    for p, monster, _ in SPECIFIKA:
        if p == "01fcdf1d" and not monster.search("Ramen är av massiv furu."):
            fel.append("massiv-förbudet biter inte på MDF-stommen")
    if any(p == "ee19a8c8" for p, _, _ in SPECIFIKA):
        fel.append("massiv-förbudet är satt på ee19a8c8, som HAR massiv fururam")
    return fel


if __name__ == "__main__":
    st = _sjalvtest()
    if st:
        print("SJÄLVTESTET FALLER:")
        print("\n".join("  " + x for x in st))
        sys.exit(1)
    print("självtest %d/%d ok" % (len(SJALVTEST), len(SJALVTEST)))
    totalt = 0
    for pid in sorted(T.NAMN):
        f = granska(pid)
        totalt += len(f)
        print(("  %s  %s" % (pid, "OK" if not f else "%d FEL" % len(f))))
        for x in f:
            print("      - " + x)
    print("\n%d produkter, %d fel" % (len(T.NAMN), totalt))
    sys.exit(1 if totalt else 0)
