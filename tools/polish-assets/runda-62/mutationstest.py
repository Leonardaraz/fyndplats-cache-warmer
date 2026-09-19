# -*- coding: utf-8 -*-
"""Runda 62 — bevisar att varje grind FÄLLER på just sitt fel.

☠️ Två lärdomar från tidigare rundor är inbyggda:
  · Ett mutationstest som bara kräver "någon brist" provar inte grinden du tror.
    Varje mutation har därför ett VÄNTAT feltextfragment.
  · Ett mutationstest som bara läser stdout rapporterar en KRASCH som godkänt.
    Undantag fångas och räknas som misslyckande, och ett eget fall provar just det.
"""
import copy
import re
import sys

HAR = __file__.rsplit("/", 1)[0]
sys.path.insert(0, HAR)
import texter          # noqa: E402
import lint            # noqa: E402

D_PROD = next(p for p in texter.PRODUKTER if p["modell"] == "D")
G_PROD = next(p for p in texter.PRODUKTER if p["modell"] == "G")
SVART = next(p for p in texter.PRODUKTER if p["farg"] == "Svart")


def med_text(prod, ersatt=None, falt=None, aven_falt=False):
    """Kör granska() med en muterad html och/eller muterade fält.

    ☠️ `aven_falt=True` kör samma ersättningar på name/title/meta. Utan det
    testar en mutation som tar bort ett FAKTUM ingenting: grinden läser fyra
    bärare (namn, titel, meta, brödtext) och fyra av mina första mutationer
    rörde bara den sista. Faktumet stod kvar, grinden teg med rätta, och
    testet såg ut att avslöja ett hål som inte fanns.
    """
    p = copy.deepcopy(prod)
    if falt:
        p.update(falt)
    if ersatt and aven_falt:
        for f in ("name", "title", "meta"):
            for fran, till in ersatt:
                p[f] = p[f].replace(fran, till)
    orig = texter.bygg
    if ersatt:
        def bygg(q):
            h = orig(q)
            for fran, till in ersatt:
                h = h.replace(fran, till)
            return h
        texter.bygg = bygg
    try:
        return lint.granska(p)
    finally:
        texter.bygg = orig


MUTATIONER = [
    ("främmande ord",
     lambda: med_text(D_PROD, [("<h2>Vanliga frågor", "<p>Kniehocker</p><h2>Vanliga frågor")]),
     "främmande ord 'Kniehocker'"),
    ("medicinskt påstående",
     lambda: med_text(D_PROD, [("Klädseln borstas", "Stolen lindrar ryggont. Klädseln borstas")]),
     "medicinskt påstående"),
    ("superlativ",
     lambda: med_text(D_PROD, falt={"meta": "Marknadens bästa knästol."}),
     "ogrundat superlativ"),
    ("husmärke",
     lambda: med_text(D_PROD, [("formpressad plywood i ljust trä",
                                "HOMCOM formpressad plywood")]),
     "husmärke 'HOMCOM'"),
    ("land utskrivet",
     lambda: med_text(D_PROD, [("Bruksanvisning ingår.", "Skickas från Tyskland.")]),
     "land utskrivet"),
    ("säljs som kontorsstol",
     lambda: med_text(G_PROD, [("Den är smalare än en kontorsstol",
                                "Perfekt som kontorsstol varje dag. Den är smal")]),
     "säljer den som kontorsstol"),
    ("förnekelsen borta",
     lambda: med_text(D_PROD, [("kontorsstol hela arbetsdagen?</strong></p><p>Nej.",
                                "kontorsstol hela arbetsdagen?</strong></p><p>Absolut.")]),
     "förnekar inte uttryckligen"),
    ("pausrådet borta",
     lambda: med_text(D_PROD, [("15–30:e minut", "regelbundet"),
                               ("15–30 minuter", "korta stunder")], aven_falt=True),
     "pausrådet (15–30 minuter) saknas"),
    ("ryggstöd nämns inte",
     lambda: med_text(D_PROD, [("ryggstöd", "stöd bakåt")]),
     "säger inte att den saknar ryggstöd"),
    ("påstår justerbarhet",
     lambda: med_text(G_PROD, falt={"name": "Höjdjusterbar knästol björk mörkgrå"}),
     "påstår justerbarhet"),
    ("träslag på modell D",
     lambda: med_text(D_PROD, [("formpressad plywood i ljust trä", "massiv björk")]),
     "namnger träslag på modell D"),
    ("plywood saknas på D",
     lambda: med_text(D_PROD, [("formpressad plywood", "limmat trä")]),
     "säger inte formpressad plywood"),
    ("björk saknas på G",
     lambda: med_text(G_PROD, [("björk", "lövträ"), ("Björk", "Lövträ")],
                      aven_falt=True),
     "modell G ska säga björk"),
    ("djupet kallas bredd",
     lambda: med_text(D_PROD, [("Bruksanvisning ingår.", "Stolen är 85 cm bred.")]),
     "kallar djupet (85 cm) för bredd"),
    ("maxlasten borta",
     lambda: med_text(D_PROD, [("120 kg", "hög belastning")], aven_falt=True),
     "maxlasten 120 kg saknas"),
    ("fel maxlast",
     lambda: med_text(D_PROD, [("Bruksanvisning ingår.", "Tål 150 kg.")]),
     "fel maxlast '150 kg'"),
    # ⚠️ Pekade tidigare på "en djup koladton", en formulering som ströks när
    #    artikelnumrets CG-suffix visade att koladgrått hör till SYSKONET
    #    9d626528. Mutationen testade då ingenting. Den pekar nu på texten som
    #    faktiskt står där.
    ("överdriven svärta",
     lambda: med_text(SVART, [("seriens mörkaste", "djupsvart")]),
     "överdriver svärtan"),
    ("artikelnummer i texten",
     lambda: med_text(D_PROD, [("Bruksanvisning ingår.", "Artikelnummer 800-288V90GY.")]),
     "artikelnummer i texten"),
    ("relativ länk",
     lambda: med_text(D_PROD, [("https://www.fyndplats.se/produkt/", "/produkt/")]),
     "relativ länk"),
    ("<br> i FAQ",
     lambda: med_text(D_PROD, [("</strong></p><p>Nej.", "</strong><br>Nej.")]),
     "<br> i beskrivningen"),
    ("decimalpunkt",
     lambda: med_text(D_PROD, [("7,5 cm", "7.5 cm")]),
     "decimalpunkt"),
    ("x i stället för ×",
     lambda: med_text(D_PROD, [("41 × 28 cm", "41 x 28 cm")]),
     "'x' i stället för"),
    ("titel = namn",
     lambda: med_text(D_PROD, falt={"title": D_PROD["name"]}),
     "identisk med namnet"),
    ("namnet för långt",
     lambda: med_text(D_PROD, falt={"name": "Gungande knästol " + "x" * 70}),
     "tecken (max 80)"),
    ("sökordet borta ur titeln",
     lambda: med_text(G_PROD, falt={"title": "Sittmöbel i trä | Fyndplats"}),
     "saknas i titeln"),
    # ☠️ Färgmutationen får INTE gå via p["farg"] — spec-tabellen byggs ur det
    #    fältet, så texten hade följt med och grinden jämfört fältet med sig
    #    självt. Defekten grinden vaktar är att TEXTEN säger en annan färg än
    #    produkten, alltså muteras texten och fältet lämnas.
    ("egen färg saknas i texten",
     lambda: med_text(SVART, [("svart", "mörk"), ("Svart", "Mörk"),
                              ("koladton", "gråton")], aven_falt=True),
     "står inte i texten"),
]


def batchmutationer():
    ut = []
    # dubblettslug
    ps = copy.deepcopy(texter.PRODUKTER)
    ps[1]["slug"] = ps[0]["slug"]
    ut.append(("dubblettslug i batchen", lint.batchgrindar(ps), "slug krockar"))
    # två sidor med samma färg inom en modell
    ps = copy.deepcopy(texter.PRODUKTER)
    ps[1]["farg"] = ps[0]["farg"]
    ut.append(("samma färg två gånger i modell D", lint.batchgrindar(ps),
               "två sidor i färgen"))
    return ut


def main():
    trafF = 0
    total = 0

    for namn, kor, vantat in MUTATIONER:
        total += 1
        try:
            fel = kor()
        except Exception as e:                     # ☠️ krasch != godkänt
            print("KRASCH  %-32s %s: %s" % (namn, type(e).__name__, e))
            continue
        if any(vantat in f for f in fel):
            trafF += 1
        else:
            print("MISSAR  %-32s väntade '%s', fick: %s"
                  % (namn, vantat, fel if fel else "(inga fel alls)"))

    for namn, fel, vantat in batchmutationer():
        total += 1
        if any(vantat in f for f in fel):
            trafF += 1
        else:
            print("MISSAR  %-32s väntade '%s', fick: %s" % (namn, vantat, fel))

    # ☠️ Kontrollprov: testet självt måste kunna rapportera en krasch.
    total += 1
    try:
        med_text(D_PROD, falt={"name": None})
        print("MISSAR  kraschfångaren            en None-titel gav inget undantag")
    except Exception:
        trafF += 1

    print("\n%d/%d mutationer fångade." % (trafF, total))
    if trafF != total:
        return 1
    # Och den orörda batchen ska fortfarande vara ren.
    if lint.main() != 0:
        print("Den ORÖRDA batchen fäller — mutationerna läckte.")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
