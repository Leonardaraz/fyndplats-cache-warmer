# -*- coding: utf-8 -*-
"""Steg 14 för kort-patchen: renderar de publicerade sidorna sitt eget kort?

Använder `grindar.hamta_isr`, som hämtar TVÅ gånger — den första hämtningen är
väckningen och ger den gamla sidan. Utan det sa den här grinden först "noll av
sex" om sex korrekta sidor.

☠️ KONTROLLMÄTNINGEN ÄR INTE VALFRI. Ett svep utan en känd träff i sig är
   inget svep (runda 104 Steg 1, där fem av 51 sidor tyst inte hämtades och
   utfallet ändå såg ut som "noll dubbletter"). Hjältebildens id MÅSTE hittas
   på varje sida — hittas det inte är det hämtningen som är trasig, inte
   sidan.
"""
import sys

sys.path.insert(0, "/home/user/fyndplats-cache-warmer/tools/polish-assets")
import grindar                                                    # noqa: E402

BAS = "https://www.fyndplats.se/produkt/"

# slug -> (kortets media-id, hjältebildens media-id)
SIDOR = {
    "elbil-barn-12v-utv-fjarrkontroll-rosa":
        ("7a6bc9381a704810a1317f2dcccfb495", "cef3727b9930468094fb962f0ccf9fc0"),
    "elbil-barn-12v-utv-fjarrkontroll-orange":
        ("868595adaa1f44f9a052ec8a5dfa6caa", "3a79a0e44d204e81a0553cb768f40473"),
    "elbil-barn-12v-utv-fjarrkontroll-bla":
        ("2a0e72dcc51541ac83097fde89146cf7", "604bb4bae7594edba6609c08da669230"),
    "maserati-granturismo-folgore-elbil-barn-12v-gra":
        ("2b713d8516b440e3ba0019516c2d5ce8", "9c961603f73942009b26c22cf2437293"),
    "kawasaki-teryx-krx-elbil-barn-12v-vit":
        ("af2c183abad046568b158e783c653dc3", "e6879709a03a47c1bf09f42602db5ed1"),
    "kawasaki-teryx-krx-elbil-barn-12v-beige":
        ("aac29a86bea7450294471462737f4904", "281602b66da3442b937837441a91591f"),
}

if __name__ == "__main__":
    fel = 0
    for slug, (kortid, hjalte) in SIDOR.items():
        html, headers = grindar.hamta_isr(BAS + slug, paus=8)
        if hjalte not in html:
            print("  ☠️ %-46s KONTROLLMÄTNINGEN FÖLL — hjältebilden hittas inte" % slug)
            fel += 1
            continue
        kort = kortid in html
        alt = "Faktakort:" in html
        fel += 0 if (kort and alt) else 1
        print("  %-46s %-5s %7d B  hjälte:✅ kort:%s alt:%s"
              % (slug, headers.get("x-vercel-cache", "?"), len(html),
                 "✅" if kort else "☠️", "✅" if alt else "☠️"))
    print()
    print("✅ %d av %d sidor renderar sitt eget kort" % (len(SIDOR) - fel, len(SIDOR))
          if not fel else "☠️ %d sidor föll" % fel)
    raise SystemExit(1 if fel else 0)
