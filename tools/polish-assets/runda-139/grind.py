# -*- coding: utf-8 -*-
"""Runda 139 — textgrinden, med självtest åt BÅDA hållen (#505).

☠️ RUNDANS EGNA FÖRBUD, utöver den delade modulen:

   1. `kattlåda` på `4faf9f4c` och `90573e36`. Leverantörens spec-etikett
      säger `Katzenklo`/`Katzentoilette` på det som titeln och ritningen
      kallar HÅLA. Att sälja en håla som kattlåda är ett konkret kundfel.

   2. CE-påståenden. Det finns ingen CE-direktivsfamilj för kattmöbler.

   3. `Leverantören anger` och varje annan attribution uppåt i ledet.
      Mot kunden är VI leverantören (batch 64). Mitt eget första utkast bar
      frasen ÅTTA gånger — den rättades per ORD över hela batchen, inte per
      förekomst, precis som batch 64:s `dögnsvarv` lärde huset.

   4. `massivt trä`, `äkta trä`, `trästomme`. Stommen är SPÅNSKIVA på alla
      tio, och `3addfbf8`:s svenska spec-rad kallar den `Technisches Holz`.

   5. Jordbruksverksreferenser. L80 sätter mått på FÖRVARINGSUTRYMMEN; ett
      klösträd är inredning, och det finns inget krav att uppfylla.
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
    (re.compile(r"\bmarknadens\b|\bbranschens\b|\bvi\s+har\s+(?:marknadens|branschens)\b", re.I),
     "SORTIMENTSSUPERLATIV utan mätvärde (#522)"),
    (_vikt(r"b[äa]st[ae]?"), "SUPERLATIV utan mätvärde"),
    (_vikt(r"st[öo]rst[ae]?"), "SUPERLATIV utan mätvärde"),
    (_vikt(r"gr[öo]vst[ae]?"), "SUPERLATIV utan mätvärde"),
    (re.compile(r"\bCE[-\s]?m[äa]rkt\w*|\bCE[-\s]?m[äa]rkning\w*", re.I),
     "CE-PÅSTÅENDE — ingen CE-direktivsfamilj täcker kattmöbler"),
    (re.compile(r"\bJordbruksverket\w*|\bSJVFS\b|\bL\s?80\b", re.I),
     "MYNDIGHETSREFERENS — L80 gäller förvaringsutrymmen, inte inredning"),
    (re.compile(r"\bmassivt\s+tr[äa]\b|\b[äa]kta\s+tr[äa]\b|\btr[äa]stomme\b", re.I),
     "MATERIALLÖGN — stommen är spånskiva"),
    (re.compile(r"\bTechnisches?\s+Holz\b|\btekniskt\s+tr[äa]\b", re.I),
     "OMSKRIVNING för spånskiva"),
]

# Produktspecifika förbud: (pid, mönster, skäl)
SPECIFIKA = [
    ("4faf9f4c", _vikt(r"kattl[åa]d\w*"),
     "☠️ Utrymmet är en HÅLA (19 × 19 cm öppning), inte en kattlåda"),
    ("90573e36", _vikt(r"kattl[åa]d\w*"),
     "☠️ Utrymmet är en HÅLA (20 × 22 cm öppning), inte en kattlåda"),
    ("90573e36", _vikt(r"st[åa]r\s+fritt"),
     "Den STÅR INTE fritt — den spänns mellan golv och tak"),
    ("a4d8feca", _vikt(r"montering\s+kr[äa]vs"),
     "Den kräver INGEN montering"),
]

# Fält som MÅSTE nämnas, och var. (pid → lista av (mönster, skäl))
KRAVS = {}
for _p in T.NAMN:
    krav = []
    if M.KATTVIKT[_p]:
        tal = M.KATTVIKT[_p].replace(" kg", "").replace(",", "[,.]")
        krav.append((re.compile(tal + r"\s*kg"),
                     "KATTVIKTEN måste stå i texten (Steg 2, villkor 1)"))
    krav.append((re.compile(r"sp[åa]nskiv\w*", re.I),
                 "SPÅNSKIVA måste stå (Steg 2, villkor 4)"))
    KRAVS[_p] = krav
KRAVS["90573e36"].append(
    (re.compile(r"220\s*(?:och|–|-|till)\s*240|220[–-]240"),
     "TAKHÖJDEN 220–240 cm måste stå (Steg 2, villkor 2)"))
for _p in ("8d074911", "b04b5375"):
    KRAVS[_p].append(
        (re.compile(r"regel\s+eller\s+betong", re.I),
         "VÄGGKRAVET måste stå (Steg 2, villkor 3)"))
    KRAVS[_p].append(
        (re.compile(r"skruv\s+och\s+plugg\s+efter\s+v[äa]ggtyp", re.I),
         "INFÄSTNINGSVALET måste stå (Steg 2, villkor 3)"))


def granska(pid):
    fel = []
    namn, titel, meta = T.NAMN[pid], T.TITEL[pid], T.META[pid]
    html = T.bygg(pid)
    syn = G.strip_taggar(html)
    allt = " ".join([namn, titel, meta, syn])

    # ── delade grindar ────────────────────────────────────────────────
    if G.ARTNR.search(allt):
        fel.append("ARTIKELNUMMER i kundtext")
    h = G.homoglyfer(allt)
    if h:
        fel.append("HOMOGLYFER: %r" % (h,))
    t = G.TREKONSONANT.search(allt)
    if t:
        fel.append("TREKONSONANT: %r" % (t,))
    if G.JARGONG.search(allt):
        fel.append("JARGONG")
    for n in G.granska_namn(namn):
        fel.append("NAMN: " + n)
    # ☠️ `G.flikfel` är en LIVE-grind: den letar efter <summary>, som butiken
    #    skapar först vid rendering. På KÄLLTEXTEN ska rubrikerna i stället
    #    stå som <h2>, exakt en gång var, i allowlistens ordning.
    for f in G.FLIKAR_SOM_KRAVS:
        n_ = html.count("<h2>" + f + "</h2>")
        if n_ != 1:
            fel.append("FLIK: %r förekommer %d gånger som <h2> (ska vara 1)" % (f, n_))
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
        if not monster.search(allt):
            fel.append("SAKNAS: " + skal)

    # ── strukturen ────────────────────────────────────────────────────
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


# ── självtest: varje regel har ett fall som SKA fälla och ett som INTE ska ──
SJALVTEST = [
    ("Den är gjord för katter upp till 5 kg.", None),
    ("Leverantören anger upp till 5 kg.", "ATTRIBUTION"),
    ("Stommen är spånskiva.", None),
    ("Stommen är massivt trä.", "MATERIALLÖGN"),
    ("Den är CE-märkt.", "CE-PÅSTÅENDE"),
    ("Den uppfyller Jordbruksverkets krav.", "MYNDIGHETSREFERENS"),
    ("Hålan är sluten.", None),
    ("Marknadens klösträd.", "SORTIMENTSSUPERLATIV"),
    ("Det bästa klösträdet.", "SUPERLATIV"),
    ("Hålan är 30 cm bred.", None),
    ("Stommen är tekniskt trä.", "OMSKRIVNING"),
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
