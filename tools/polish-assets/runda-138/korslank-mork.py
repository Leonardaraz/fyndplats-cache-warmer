# -*- coding: utf-8 -*-
"""Runda 138: korslänken TILLBAKA från den publicerade mörkgrå syskonsidan.

☠️ UPPGIFT #480: inom ett FÄRGPAR går länken åt BÅDA håll. `7bdc47b8`
   (ljusgrå) länkar till `klostrad-takspant-240-260-cm` (mörkgrå) sedan
   Steg 7. Den mörkgrå sidan hade INGEN korslänkssektion alls — mätt mot
   skarpa Wix: `barLjusgratt: false`, ingen "Passar inte den här?".
   En envägslänk är halva nyttan: den redan indexerade sidan är den som
   kan skicka vidare auktoritet till den nypublicerade.

☠️ BLOCKET MÅSTE LIGGA FÖRE FÖRSTA FLIKRUBRIKEN. Butikens `splitFlikar`
   lägger allt EFTER en matchande rubrik i den fliken, ända fram till nästa
   match — ett block mellan `Tekniska specifikationer` och `Vanliga frågor`
   hamnar alltså INNE i spec-tabellen. Runda 120 mätte det på åtta sidor.
   Infogningen sker därför vid `FORSTA_FLIK`, inte i slutet.

⚠️ FIL FÖRST, INTE INLINE. Batch 64 mätte 9 fel mot 0 på exakt den
   skillnaden: en sträng som skrivs direkt i ett JSON-anrop kan ingen grind
   läsa, och PATCH-svaret ekar tillbaka precis det man skrev.
   `korslank-mork-fore.html` är dessutom verifierad byte-identisk med Wix
   (3730 tecken, hash 419002493) innan något byggs ovanpå den.
"""
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
import grindar as G                                              # noqa: E402

PRODUKT = "39ec9d58-d721-4ef9-b9ca-ed1746cffa11"
SLUG = "klostrad-takspant-240-260-cm"
BAS = "https://www.fyndplats.se"
FORSTA_FLIK = "<h2>Tekniska specifikationer</h2>"

# Samma rubrik och samma ingress som rundans egna sidor — inte en egen
# variant. En tvilling till en husformulering glider isär precis som en
# tvilling till en regel gör.
INGRESS = "Passar inte den här?"
LEDTEXT = "Fler klösmöbler hos oss:"

# ☠️ FÄRGSYSKONET FÖRST — det är det enda länken #480 kräver. De två andra
#    speglar `7bdc47b8`:s egen lista, så paret ser likadant ut åt båda håll.
LANKAR = [
    ("klostrad-ljusgratt-240-260-cm", "samma modell i ljusgrått"),
    ("klostrad-225-255-cm-fyra-plan-bomullsrep", "takspänt klösträd i fyra plan"),
    ("klostrad-230-275-cm-gront-katthus", "takspänt klösträd med katthus i grönt"),
]


def block():
    # ☠️ ABSOLUT URL, ALDRIG ROTRELATIV: Wix skriver om "/produkt/…" till
    #    "https:/produkt/…" — ETT snedstreck, alltså död länk.
    lankar = ", ".join('<a href="{}/produkt/{}">{}</a>'.format(BAS, s, t)
                       for s, t in LANKAR)
    return ("<h2>" + INGRESS + "</h2>"
            + "<p>" + LEDTEXT + " " + lankar + ".</p>")


def bygg(fore):
    i = fore.index(FORSTA_FLIK)
    return fore[:i] + block() + fore[i:]


def grinda(ny, blk):
    """Grindar BLOCKET (vår text) och HELHETEN (strukturen)."""
    fel = []

    # Vår egen text: artikelnummer, homoglyfer, trekonsonant, jargong, versal.
    syn = G.strip_taggar(blk)
    if G.ARTNR.search(blk):
        fel.append("ARTIKELNUMMER i blocket: %r" % G.ARTNR.search(blk).group(0))
    for tecken, namn, sammanhang in G.homoglyfer(blk):
        fel.append("HOMOGLYF %r (%s) i %r" % (tecken, namn, sammanhang))
    m = G.TREKONSONANT.search(syn)
    if m:
        fel.append("TREKONSONANT %r" % G.mening_kring(syn, m.start()))
    if G.JARGONG.search(syn):
        fel.append("JARGONG: %r" % G.JARGONG.search(syn).group(0))
    for f in G.versalfel(syn):
        fel.append("VERSALFEL: %s" % (f,))

    # ☠️ Inga TAL i blocket. Ett tal som tillhör GRANNEN blir annars vårt
    #    påstående på den här sidan — samma fälla som zonindelningen finns för.
    import re
    tal = re.findall(r"\d[\d\s,.]*", syn)
    if tal:
        fel.append("TAL i korslänksblocket: %r" % tal)

    # Strukturen: blocket ska ligga FÖRE första flikrubriken, och antalet
    # flikrubriker får inte ha ändrats.
    if ny.index("<h2>" + INGRESS + "</h2>") > ny.index(FORSTA_FLIK):
        fel.append("BLOCKET LIGGER EFTER FÖRSTA FLIKRUBRIKEN")
    for flik in ["Tekniska specifikationer", "Användning och skötsel",
                 "Vanliga frågor"]:
        n = ny.count("<h2>" + flik + "</h2>")
        if n != 1:
            fel.append("FLIKRUBRIK %r förekommer %d gånger" % (flik, n))

    # Ankartexterna ska peka på sluggar som INTE är den här sidan.
    for s, t in LANKAR:
        if s == SLUG:
            fel.append("LÄNK TILL SIG SJÄLV: %s" % s)
        if not t or t[0].isupper():
            fel.append("ANKARTEXT ska vara gemen löptext: %r" % t)

    # Allt utanför blocket måste vara ORÖRT.
    if ny.replace(blk, "", 1) != open(
            os.path.join(HAR, "korslank-mork-fore.html"),
            encoding="utf-8").read().rstrip("\n"):
        fel.append("NÅGOT UTANFÖR BLOCKET ÄNDRADES")
    return fel


if __name__ == "__main__":
    fore = open(os.path.join(HAR, "korslank-mork-fore.html"),
                encoding="utf-8").read().rstrip("\n")
    blk = block()
    ny = bygg(fore)
    fel = grinda(ny, blk)
    h = 0
    for c in ny:
        h = (h * 31 + ord(c)) % 1000000007
    print("block  :", blk)
    print()
    print("före %d tecken  →  efter %d tecken   hash %d" % (len(fore), len(ny), h))
    print("%d fel" % len(fel))
    for f in fel:
        print("  -", f)
    with open(os.path.join(HAR, "korslank-mork-efter.html"), "w",
              encoding="utf-8") as f:
        f.write(ny)
    sys.exit(1 if fel else 0)
