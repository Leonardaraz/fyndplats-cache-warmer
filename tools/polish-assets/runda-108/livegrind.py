# -*- coding: utf-8 -*-
"""Runda 108 Steg 14 — läs de sex publicerade sidorna som kunden ser dem.

☠️ `?cb=` BUSTAR INTE ISR-cachen. Next.js nycklar på RUTTEN, inte på query.
   `grindar.hamta_isr` hämtar därför TVÅ gånger: den första beställer
   ombyggnaden, den andra är mätningen.

☠️ KONTROLLMÄTNING: hjältebildens media-id MÅSTE hittas i HTML:en. Utan den vet
   man inte om ett "noll fel" betyder ren sida eller tom hämtning.

☠️ GRINDEN LÄSER HELA HTML:EN, INTE BARA BRÖDTEXTEN — runda 106:s dyraste
   lärdom. Alt-texten står i `<img alt="…">` i den renderade sidan, så en grind
   som söker i hela svaret ser den; en som klipper ut beskrivningen först gör
   det inte. Den här rundan hade dessutom leverantörens RÅA TYSKA TITEL som
   alt-text på alla trettio bilderna före Steg 9, så just den kontrollen är
   rundans viktigaste.

⚠️ RUNDANS EGNA LÖFTEN prövas med SAMMA funktioner som brödtextgrinden
   (`BARRIAR`, `morklaggningslofte`, `UTOMHUSLOFTE` ur `grind.py`) — inte med
   omskrivna kopior. `morklaggningslofte` känner skillnad på ett löfte och dess
   förnekande, och sidan bär tre nekande meningar med flit:
   "mörklägger inte", "ett dåligt mörkläggningsdraperi" och FAQ-svaret.
"""
import os, re, sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
import grindar as G                                              # noqa: E402
sys.path.insert(0, HAR)
import texter as T                                               # noqa: E402
import alt as A                                                  # noqa: E402
from grind import BARRIAR, UTOMHUSLOFTE, morklaggningslofte      # noqa: E402
import importlib.util
_s = importlib.util.spec_from_file_location("hb", HAR + "/hamta-bilder.py")
HB = importlib.util.module_from_spec(_s); _s.loader.exec_module(HB)
_s2 = importlib.util.spec_from_file_location("gm", HAR + "/gen-media.py")
GM = importlib.util.module_from_spec(_s2); _s2.loader.exec_module(GM)

BAS = "https://www.fyndplats.se/produkt/"

# nyckel -> (slug, breddmått som ska stå på sidan)
SIDOR = {k: (T.PRODUKTER[k]["slug"], "%d × 1,6 × 170 cm" % T.STORLEK[v[0]][0])
         for k, v in T.PRODUKTER_IN.items()}

# ☠️ Ordlistan är vald för DEN HÄR familjen: orden som FAKTISKT ligger i
#    leverantörens tyska text. `Panel` står inte här — det är svenska.
#    `Natur` inte heller: det är färgnamnet på tre av sidorna.
FORBJUDET = [
  ("tyskt ord", re.compile(r"\b(Raumtrenner|Raumteiler|Paravent|Trennwand|Sichtschutz|"
                           r"Kiefernholz|Polypropylen|Webmuster|Metallscharnier|"
                           r"Faltbar|Gefaltete|Gesamtabmessungen|Einzelpaneel|"
                           r"Abmessungen|Lieferumfang|Wohnzimmer|Freistehend|"
                           r"Schlafzimmer|Homeoffice|Weiß|Braun)", re.I)),
  ("husmärke", re.compile(r"\b(PawHut|HOMCOM|Outsunny|Aiyaplay|Vinsetto|Aosom)\b", re.I)),
  ("lagerland", re.compile(r"Skickas fr[åa]n\s+(Tyskland|Polen|Spanien|Kina)", re.I)),
  ("artikelnummer", G.ARTNR),
  ("trasig relativ länk", re.compile(r"https:/produkt")),
  ("leverantörsattribution", re.compile(r"\bleverant[öo]ren?s?\b", re.I)),
]
FLIKAR = ["Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor"]


def granska(nyckel, html):
    fel = []
    slug, matt = SIDOR[nyckel]
    hjalte = HB.GALLERIER[nyckel][0].replace(".jpg", "")
    kort = GM.KORTFIL[nyckel].replace(".jpg", "")
    if hjalte not in html:
        fel.append("KONTROLLMÄTNINGEN FALLER — hjältebilden finns inte i HTML:en")
    if kort not in html:
        fel.append("vårt eget kort saknas i galleriet")
    if matt not in html:
        fel.append(f"måttet {matt} står inte på sidan")
    for f in FLIKAR:
        if f"<summary>{f}</summary>" not in html and f">{f}<" not in html:
            fel.append(f"fliken <summary>{f}</summary> saknas i renderad HTML")
    if "polypropen" not in html.lower():
        fel.append("materialet nämner inte polypropen — importfelet lever kvar live")

    # ☠️ Normalisera FÖRST: sidan bär texten både som HTML och en gång till i
    #    Next.js nyttolast med `<`-escapade taggar.
    norm = (html.replace("\\u003c", "<").replace("\\u003e", ">")
                .replace("\\u0026", "&").replace('\\"', '"'))

    # ⚠️ BUTIKENS "liknande produkter"-rad är ANDRA produkters kort — deras
    #    namn, alt-texter och länkar, i TVÅ serialiseringar. Runda 107 mätte
    #    att en strykning av `<a class="prod">…</a>` SER ut att bita utan att
    #    göra det. Andra produkters IDENTITETER (slug + namn) är samma literal
    #    i båda formerna, och är per definition inte påståenden om den här
    #    varan. Sidans egna alt-texter rörs inte.
    andras = set(re.findall(r"/produkt/([a-z0-9-]+)", norm)) - {slug}
    andras |= set(re.findall(r'"pname">([^<]+)<', norm))
    rensad = norm
    for token in sorted(andras, key=len, reverse=True):
        rensad = rensad.replace(token, "")

    # ☠️ KONTROLLMÄTNING på strykningen själv: sidans EGNA alt-texter måste
    #    finnas kvar. En strykning som svalde galleriet hade gjort "noll fel"
    #    meningslöst — samma klass som en tom hämtning.
    egen_alt = A.galleri(nyckel)[0]
    if egen_alt not in rensad:
        fel.append("KONTROLLMÄTNINGEN FALLER — strykningen åt sidans egen alt-text")

    for etikett, sok in (("BARRIÄRLÖFTE", BARRIAR.search),
                         ("MÖRKLÄGGNINGSLÖFTE", morklaggningslofte),
                         ("UTOMHUSLÖFTE", UTOMHUSLOFTE.search)):
        m = sok(rensad)
        if m:
            i = max(0, m.start() - 70)
            fel.append(f"{etikett} på sidan: …{rensad[i:m.end() + 70]}…")

    for etikett, monster in FORBJUDET:
        t = monster.search(html)
        if t:
            fel.append(f"{etikett}: {t.group(0)!r}")
    return fel


if __name__ == "__main__":
    grona = 0
    for nyckel, (slug, _m) in SIDOR.items():
        html, hdr = G.hamta_isr(BAS + slug)
        fel = granska(nyckel, html)
        if not fel:
            grona += 1
        print(f"{'OK ' if not fel else 'FEL'} {slug:<24} {len(html):>7} tecken  "
              f"cache={hdr.get('x-vercel-cache')} age={hdr.get('age')}")
        for f in fel:
            print("      ✗", f)
    print(f"\n{grona} av {len(SIDOR)} sidor gröna")
    sys.exit(0 if grona == len(SIDOR) else 1)
