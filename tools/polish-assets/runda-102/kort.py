# -*- coding: utf-8 -*-
"""Runda 102 — ett eget Fyndplats-kort per massagefåtölj.

Samma familj som runda 101, så samma rubriker och samma spec-rader gäller:
modell B står på korsfot i trä, modell C har 105 cm hög rygg och bär 160 kg.

⚠️ RUBRIKEN MÅSTE BÄRAS AV FOTOT. Bild 1 är på alla fem en studiobild av
   fåtöljen MED sin fotpall. Granskat i den här rundan:

     B  korsformad träfot under både fåtölj och pall  -> "på korsfot i trä"
     C  rund svart tallriksfot under båda, hög rygg   -> "105 cm hög rygg"

☠️ Modell B:s förvaringslock är STÄNGT på bild 1 — kortet får inte lova
   förvaringen i rubriken. Grinden nedan fäller på det.

Grinden är runda 101:s, oförändrad, och den importeras i stället för att
kopieras: en tvilling som glider isär är husets vanligaste bugg.
"""
import importlib.util
import sys

BAS = "/home/user/fyndplats-cache-warmer/tools/polish-assets"
sys.path.insert(0, BAS)
sys.path.insert(0, BAS + "/runda-101")
import kortbygge                                                   # noqa: E402

# ☠️ Filen heter kort.py i BÅDA rundorna. Ett vanligt `import kort` hade
#    importerat DEN HÄR filen igen (cirkulärt) — grinden måste laddas via
#    sin fulla sökväg för att det ska bli runda 101:s och inte min egen.
_spec = importlib.util.spec_from_file_location(
    "kort101", BAS + "/runda-101/kort.py")
_k101 = importlib.util.module_from_spec(_spec)
sys.modules["kort101"] = _k101
_spec.loader.exec_module(_k101)
granska_kort, specrader, sjalvtest = (
    _k101.granska_kort, _k101.specrader, _k101.sjalvtest)

HAR = BAS + "/runda-102"

KORT = {
    "5a31b710": ("Massagefåtölj", "Fåtölj och fotpall på korsfot i trä",
                 [("Mått", 0), ("Fotpall", 4), ("Maxlast", 7)]),
    "071cad5d": ("Massagefåtölj", "Fåtölj och fotpall på korsfot i trä",
                 [("Mått", 0), ("Fotpall", 4), ("Maxlast", 7)]),
    "2de635c3": ("Massagefåtölj", "Fåtölj och fotpall på korsfot i trä",
                 [("Mått", 0), ("Fotpall", 4), ("Maxlast", 7)]),
    "3b61e50c": ("Massagefåtölj", "105 cm hög rygg, bär 160 kg",
                 [("Mått", 0), ("Ryggstöd", 3), ("Maxlast", 8)]),
    "70d0a9ea": ("Massagefåtölj", "105 cm hög rygg, bär 160 kg",
                 [("Mått", 0), ("Ryggstöd", 3), ("Maxlast", 8)]),
}

if __name__ == "__main__":
    print("=== självtest (runda 101:s grind, oförändrad) ===")
    if not sjalvtest():
        raise SystemExit("grinden är inte tvåvägs")

    print("\n=== grind mot runda 102:s kort ===")
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
