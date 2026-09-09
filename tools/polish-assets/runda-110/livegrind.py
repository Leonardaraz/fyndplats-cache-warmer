# -*- coding: utf-8 -*-
"""Runda 110 Steg 14 — läs rundans SEX publicerade sidor som kunden ser dem.

Rundan publicerade sex nya sidor i TRE konstruktioner (grupp A polypropenväv på
tallram, B bambu på tallram, C helbambu). Grinden körs på rundans sex; runda
109:s åtta rördes inte den här gången.

☠️ FACIT HÄMTAS UR `facit-live.json`, som LÄSTES UR KATALOGEN — inte kopierat
   från runda 109:s facit. Två rundors filer som bär samma tal är just den
   tvilling huset förlorat tid på fyra gånger (`SHIP_AXIS_RE`, `EU_TULL_CODES`,
   `mapWithConcurrency`, kortfilerna).

☠️ MATERIALKONTROLLEN ÄR PER GRUPP (`grind.MATERIALORD` / `FORBJUDET_ORD`).
   Ett delat "polypropen" hade fällt de fyra bambusidorna, och ett delat
   "bambu" de två grupp A-sidorna. Grupp C får dessutom inte bära ordet TRÄ
   alls — den är helbambu, och Steg 7:s delade FAQ-svar sa "Träet är
   obehandlat" på en produkt utan en träbit i sig.

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
from grind import BARRIAR, UTOMHUSLOFTE, morklaggningslofte      # noqa: E402
import json
FACIT = json.load(open(os.path.join(HAR, "facit-live.json"), encoding="utf-8"))

BAS = "https://www.fyndplats.se/produkt/"

# nyckel -> (slug, breddmått som ska stå på sidan)
import matt                                                        # noqa: E402
# nyckel -> (slug, det utfällda måttet som ska stå ordagrant på sidan)
SIDOR = {k: (T.PRODUKTER[k]["slug"],
             "%d × %s × %d cm" % (matt.RUNDAN[k][1], matt.RUNDAN[k][2], matt.RUNDAN[k][3]))
         for k in matt.RUNDAN}

# ☠️ Ordlistan är vald för DEN HÄR familjen: orden som FAKTISKT ligger i
#    leverantörens tyska text. `Panel` står inte här — det är svenska.
#    `Natur` inte heller: det är färgnamnet på tre av sidorna.
FORBJUDET = [
  ("tyskt ord", re.compile(r"\b(Raumtrenner|Raumteiler|Paravent|Trennwand|Sichtschutz|"
                           r"Kiefernholz|Polypropylen|Webmuster|Metallscharnier|"
                           r"Faltbar|Gefaltete|Gesamtabmessungen|Einzelpaneel|"
                           r"Abmessungen|Lieferumfang|Wohnzimmer|Freistehend|"
                           r"Schlafzimmer|Homeoffice|Weiß|Waschschwarz|Bräune|Baumwollfaden)", re.I)),
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
    hjalte = FACIT[nyckel]["hjalte"].replace(".jpg", "")
    kort = FACIT[nyckel]["kort"].replace(".jpg", "")
    if hjalte not in html:
        fel.append("KONTROLLMÄTNINGEN FALLER — hjältebilden finns inte i HTML:en")
    if kort not in html:
        fel.append("vårt eget kort saknas i galleriet")
    if matt not in html:
        fel.append(f"måttet {matt} står inte på sidan")
    for f in FLIKAR:
        if f"<summary>{f}</summary>" not in html and f">{f}<" not in html:
            fel.append(f"fliken <summary>{f}</summary> saknas i renderad HTML")
    # ☠️ MATERIALORDET ÄR OLIKA PER GRUPP. Grupp A:s väv är POLYPROPEN och
    #    importens spec-block sa bara "Kiefernholz"; grupp B och C är bambu.
    #    En delad kontroll hade fällt fyra korrekta sidor.
    from grind import MATERIALORD, FORBJUDET_ORD
    import matt as _m
    for ord_ in MATERIALORD[_m.GRUPPER[nyckel]]:
        if ord_ not in html.lower():
            fel.append(f"materialet nämner inte {ord_!r} — importfelet lever kvar live")
    if _m.GRUPPER[nyckel] in FORBJUDET_ORD:
        t = FORBJUDET_ORD[_m.GRUPPER[nyckel]].search(G.synlig_meningstext(html))
        if t:
            fel.append(f"TRÄ PÅ EN BAMBUPRODUKT live: {t.group(0)!r}")

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
    egen_alt = FACIT[nyckel]["alt1"]
    if egen_alt not in rensad:
        fel.append("KONTROLLMÄTNINGEN FALLER — strykningen åt sidans egen alt-text")

    from grind import LJUDLOFTE
    for etikett, sok in (("BARRIÄRLÖFTE", BARRIAR.search),
                         ("MÖRKLÄGGNINGSLÖFTE", morklaggningslofte),
                         ("UTOMHUSLÖFTE", UTOMHUSLOFTE.search),
                         ("LJUDLÖFTE", LJUDLOFTE.search)):
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
