# -*- coding: utf-8 -*-
"""Kvittot på kortreparationen: kör `grindar.kortfel` mot VARJE live sida.

☠️ Räknat i git är inte mätt i butiken. Att `kort/` bär 65 filer bevisar att
   korten BYGGDES, inte att de sitter på sidorna — exakt skillnaden mellan
   "filtrets avsikt" och "utfallet" som CLAUDE.md redan skrivit ned en gång
   om Vercel-byggena. Den här filen läser kundens sida.
"""
import sys

sys.path.insert(0, ".")
import grindar as G                                              # noqa: E402

BAS = "https://www.fyndplats.se/produkt/"
UTKAST = {"stadvagn-93-cm-fyra-hinkar-press-sopsack",
          "verktygsvagn-smal-56-cm-tio-krokar",
          "verktygsvagn-102-cm-verktygsplatta"}


def main(rundor):
    fel, granskade, hoppade = 0, 0, 0
    for r in rundor:
        sys.path.insert(0, f"runda-{r}")
        sys.modules.pop("texter", None)
        import texter as T                                       # noqa: PLC0415
        for pid, slug in T.SLUG.items():
            if slug in UTKAST:
                hoppade += 1
                print(f"  –   {pid}  {slug:42} utkast, inte publicerad")
                continue
            try:
                html, h = G.hamta_isr(BAS + slug)
            except Exception as e:                               # noqa: BLE001
                print(f"  FEL {pid}  {slug}: {e}")
                fel += 1
                continue
            granskade += 1
            k = G.kortfel(html)
            print(("  FEL " if k else "  OK  ")
                  + f"{pid}  {slug:42} {h.get('x-vercel-cache','?')}")
            for x in k:
                print("        ☠️", x)
            fel += len(k)
        sys.path.pop(0)
    print(f"\n{granskade} publicerade sidor granskade, {hoppade} utkast hoppade, "
          f"{fel} fel")
    return fel


if __name__ == "__main__":
    sys.exit(1 if main([int(a) for a in sys.argv[1:]]) else 0)
