# -*- coding: utf-8 -*-
"""Mutationstest för runda 129:s textgrind.

☠️ EN GRIND SOM ALDRIG FÄLLT ÄR OBEVISAD. Tre av rundans grindar var fel i
   sitt första utkast och fällde KORREKT text — eld-mönstret på adjektivet
   "det låga läget", superlativet på "mår bäst av", och talgrinden på sjutton
   korslänkar som gjorde precis vad de ska. Alla tre lagades, och det enda som
   skiljer en lagad grind från en avväpnad är att man kört muteringen.

☠️ VARJE MUTATION HÄVDAR ATT DEN ÄNDRADE NÅGOT. En mutation som inte muterar
   rapporteras annars som ett hål i grinden — runda 97 la tio minuter på det.

⚠️ Fallen med `ska_falla=False` är lika viktiga som de andra: de låser att
   lagningarna inte gick för långt åt andra hållet.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import grind as GR                                               # noqa: E402
import texter as T                                               # noqa: E402

PID = "ec8ab782"          # tre skärmar, planteringsfot — bär "det låga läget"


def mutera(satt, ska_falla, namn, pid=PID):
    orig_sol = dict(T.SOL)
    orig_kors = {k: list(v) for k, v in T.KORSLANK.items()}
    orig_sku = dict(T.SKU)
    orig_skot = dict(T.SKOTSEL)
    try:
        f0 = GR.granska(pid)
        # ☠️ MUTATIONEN MÅSTE FAKTISKT MUTERA. Men allt grinden läser står
        #    inte i HTML:en — SKU:n gör det inte — så jämförelsen tar med
        #    varje yta grinden dömer på. Ett första utkast jämförde bara
        #    HTML:en och sköt ner SKU-fallet, som var korrekt hela tiden.
        fore = (T.bygg(pid), T.SKU[pid], T.NAMN[pid])
        satt(pid)
        assert (T.bygg(pid), T.SKU[pid], T.NAMN[pid]) != fore, \
            "mutationen ändrade ingenting som grinden läser"
        f = GR.granska(pid)
        nya = [x for x in f if x not in f0]
        ok = bool(nya) == ska_falla
        print(("  OK   " if ok else "  ☠️ FEL ")
              + "%-52s %s" % (namn, "FÄLLD" if nya else "släpptes igenom"))
        for x in nya[:2]:
            print("           " + x[:110])
        return 0 if ok else 1
    finally:
        T.SOL.clear(); T.SOL.update(orig_sol)
        T.KORSLANK.clear(); T.KORSLANK.update(orig_kors)
        T.SKU.clear(); T.SKU.update(orig_sku)
        T.SKOTSEL.clear(); T.SKOTSEL.update(orig_skot)


def _lagg(faltet, text):
    def satt(pid):
        assert text not in faltet[pid], "mutationen ändrade ingenting"
        faltet[pid] = faltet[pid] + " " + text
    return satt


FALL = [
    (_lagg(T.SOL, "Lampan är vattentät."), True, "vattentät"),
    (_lagg(T.SOL, "Den ger en levande låga."), True, "eld: levande låga"),
    (_lagg(T.SOL, "Lyktan är CE-märkt."), True, "certifieringspåstående"),
    (_lagg(T.SOL, "Fri frakt ingår."), True, "leveranslöfte"),
    (_lagg(T.SOL, "Artikelnummer: se etiketten."), True, "artikelnummer-etikett"),
    (_lagg(T.SOL, "Lampan lyser upp hela trädgården."), True, "kategoriklyscha"),
    (_lagg(T.SOL, "Die Helligkeit ist hoch."), True, "tyskt ord"),
    (_lagg(T.SOL, "Stolpen är 313 centimeter i toppen."), True, "ohärlett tal"),
    (_lagg(T.SOL, "Det är marknadens starkaste lampa."), True, "superlativ"),
    (_lagg(T.SOL, "Vi skrev om den i runda 42."), True, "jargong"),
    (_lagg(T.SOL, "Тre skärmar sitter på armarna."), True, "homoglyf"),

    # ☠️ RIKTNINGEN SOM LAGNINGARNA MÅSTE HÅLLA — de här får INTE fälla.
    (_lagg(T.SOL, "Det låga läget drar mindre."), False, "adjektivet 'låga' går fritt"),
    (_lagg(T.SOL, "Batteriet mår bäst av att övervintra inomhus."), False,
     "adverbet 'bäst' går fritt"),
    (_lagg(T.SOL, "Lampan lyser inte upp hela tomten."), False,
     "negerad klyscha går fritt"),
]


def _fel_korslank(pid):
    """☠️ Korslänken påstår GRANNENS höjd. Ett fel tal där är uppgift #480:s
    klass, och den nya talgrinden ska fånga det mot MÅLETS spec."""
    mal, txt = T.KORSLANK[pid][0]
    ny = txt.replace("185", "333")
    assert ny != txt, "mutationen ändrade ingenting"
    T.KORSLANK[pid] = [(mal, ny)] + T.KORSLANK[pid][1:]


def _fel_sku(pid):
    assert T.SKU[pid] != "FP-fel", "mutationen ändrade ingenting"
    T.SKU[pid] = "FP-fel"


FALL += [
    (_fel_korslank, True, "korslänk med FEL grannhöjd"),
    (_fel_sku, True, "SKU som inte följer husregeln"),
]


if __name__ == "__main__":
    fel = sum(mutera(s, v, n) for s, v, n in FALL)
    print("\n%d mutationer, %d fel" % (len(FALL), fel))
    sys.exit(1 if fel else 0)
