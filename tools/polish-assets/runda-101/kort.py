# -*- coding: utf-8 -*-
"""Runda 101 — ett eget Fyndplats-kort per massagefåtölj.

Kortet är det enda i galleriet som är VÅRT. Utan det är sidan en
vidarebefordran av leverantörens marknadsföring (Leonards krav 2026-08-26).

☠️ VÄRDET HÄRLEDS ur spec-tabellen — `kortbygge.varde()` läser raden och tar
   det som står efter kolonet. Ett kort kan alltså inte skriva ett tal som
   inte står i tabellen.

⚠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT. Bild 1 är på alla åtta en studiobild av
   fåtöljen MED sin fotpall, och rubrikerna beskriver bara det som syns där:

     A  två runda fötter under fåtölj och pall  -> "på var sin rund fot"
     B  korsformad träfot under båda            -> "på korsfot i trä"
     C  hög rygg som reser sig över armstöden   -> "105 cm hög rygg"
     D  blanka kromade fötter under båda        -> "kromad fot"

   ☠️ Modell B:s förvaringslock är STÄNGT på bild 1. Kortet får därför inte
      lova förvaringen — den syns först på bild 4. Rubriken beskriver foten.

☠️ EGEN TVÅVÄGSGRIND, spegling av lint.py:s regler 3 och 5: kortet får bara
   bära produktens EGEN maxlast. Kortet är det första kunden ser; ett fel där
   är felet på den mest synliga ytan.
"""
import re
import sys

sys.path.insert(0, "/home/user/fyndplats-cache-warmer/tools/polish-assets")
sys.path.insert(0, "/home/user/fyndplats-cache-warmer/tools/polish-assets/runda-101")
import kortbygge                                                  # noqa: E402
import texter as T                                                # noqa: E402

HAR = "/home/user/fyndplats-cache-warmer/tools/polish-assets/runda-101"

KORT = {
    "cd7e9036": ("Massagefåtölj", "Fåtölj och fotpall på var sin rund fot",
                 [("Mått", 0), ("Fotpall", 4), ("Maxlast", 8)]),
    "7062dc79": ("Massagefåtölj", "Fåtölj och fotpall på var sin rund fot",
                 [("Mått", 0), ("Fotpall", 4), ("Maxlast", 8)]),
    "9c8a7a80": ("Massagefåtölj", "Fåtölj och fotpall på var sin rund fot",
                 [("Mått", 0), ("Fotpall", 4), ("Maxlast", 8)]),
    "1932abe1": ("Massagefåtölj", "Fåtölj och fotpall på korsfot i trä",
                 [("Mått", 0), ("Fotpall", 4), ("Maxlast", 7)]),
    "89fead7d": ("Massagefåtölj", "Fåtölj och fotpall på korsfot i trä",
                 [("Mått", 0), ("Fotpall", 4), ("Maxlast", 7)]),
    "54d25930": ("Massagefåtölj", "105 cm hög rygg, bär 160 kg",
                 [("Mått", 0), ("Ryggstöd", 3), ("Maxlast", 8)]),
    "c50fa916": ("Massagefåtölj", "105 cm hög rygg, bär 160 kg",
                 [("Mått", 0), ("Ryggstöd", 3), ("Maxlast", 8)]),
    "b8b6fee1": ("Massagefåtölj", "Kromad fot och fristående ottoman",
                 [("Mått", 0), ("Mått utfälld", 1), ("Maxlast", 7)]),
}


def specrader(pid):
    return ["%s: %s" % (k, v.replace("{kladselstor}", T.KLADSEL[pid].capitalize()))
            for k, v in T.SPEC[T.MODELL[pid]]]


def granska_kort(pid, kicker, rubrik, rader):
    m = T.MODELL[pid]
    hel = (kicker + " " + rubrik + " " +
           " ".join("%s %s" % (e, v) for e, v in rader)).lower()

    # 1. Fåtöljens EGEN maxlast måste stå.
    egen = "160 kg" if m == "C" else "120 kg"
    if egen not in hel:
        raise SystemExit("kortet på %s saknar maxlasten %s" % (pid, egen))
    # 2. Och ingen ANNAN modells fåtöljslast får stå.
    annan = "120 kg" if m == "C" else "160 kg"
    if annan in hel:
        raise SystemExit("kortet på %s bär FEL maxlast %s" % (pid, annan))
    # 3. Modell B:s förvaringslock är stängt på bild 1 — lova det inte i
    #    RUBRIKEN. Regeln gäller rubriken, inte spec-raderna: en spec-rad är
    #    ett härlett värde ur tabellen, inte ett löfte fotot ska bära.
    rubrikyta = (kicker + " " + rubrik).lower()
    if m == "B" and re.search(r"förvaring|stauraum|lock", rubrikyta):
        raise SystemExit("kortet på %s lovar förvaringen i RUBRIKEN, "
                         "men locket är stängt på bild 1" % pid)
    # 4. Inget artikelnummer, inget tyskt spår.
    if re.search(r"\d{3}-\d{3}", hel):
        raise SystemExit("kortet på %s bär artikelnummer" % pid)
    if re.search(r"tyskland|sessel|hocker", hel):
        raise SystemExit("kortet på %s bär tyskt spår" % pid)
    return True


def sjalvtest():
    fall = [
        ("fel maxlast på A", "cd7e9036", "Massagefåtölj", "Bär 160 kg",
         [("Mått", "77 × 84 × 95 cm")]),
        ("saknad maxlast", "cd7e9036", "Massagefåtölj", "Rund fot",
         [("Mått", "77 × 84 × 95 cm")]),
        ("fel maxlast på C", "54d25930", "Massagefåtölj", "Bär 120 kg",
         [("Mått", "76 × 81 × 105 cm")]),
        ("B lovar förvaringen", "1932abe1", "Massagefåtölj",
         "Fotpall med förvaring",
         [("Maxlast", "120 kg (fåtölj), 100 kg (fotpall)")]),
        ("artikelnummer", "b8b6fee1", "Massagefåtölj", "700-164 kromad fot",
         [("Maxlast", "120 kg (fåtölj), 60 kg (ottoman)")]),
        ("tyskt spår", "54d25930", "Massagesessel", "160 kg hög rygg",
         [("Maxlast", "160 kg (fåtölj), 20 kg (fotpall)")]),
    ]
    ok = 0
    for namn, pid, k, r, rader in fall:
        try:
            granska_kort(pid, k, r, rader)
            print("  ☠️ mutationen %r FÅNGADES INTE" % namn)
        except SystemExit:
            ok += 1
    print("  %d/%d mutationer fångade" % (ok, len(fall)))
    return ok == len(fall)


if __name__ == "__main__":
    print("=== självtest ===")
    if not sjalvtest():
        raise SystemExit("grinden är inte tvåvägs")

    print("\n=== grind mot de riktiga korten ===")
    for pid, (k, r, rader) in KORT.items():
        spec = specrader(pid)
        varden = [(e, kortbygge.varde(spec[i], e)) for e, i in rader]
        granska_kort(pid, k, r, varden)
        print("  ✅ %s  %s / %s" % (pid, k, r))
        for e, v in varden:
            print("        %-14s %s" % (e + ":", v))

    print("\n=== bygger ===")
    produkter = [{"kort": pid, "spec": specrader(pid)} for pid in KORT]
    namn, facit = kortbygge.bygg(HAR, produkter, KORT)
    print("  %d kort byggda" % len(namn))
