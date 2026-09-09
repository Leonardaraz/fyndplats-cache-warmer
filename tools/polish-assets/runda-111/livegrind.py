# -*- coding: utf-8 -*-
"""Runda 111 Steg 14 — läs rundans SJU publicerade sidor som kunden ser dem.

Rundan publicerade sju nya sidor i SEX konstruktioner (D1 furu + tyg i två
storlekar, D2 furu + tryckt fiberduk, E1 flätat pappersrep, E2 flätad
pappersfiber med hyllor, F1 polyester på stål med hjul, F2 polyester på
metall). Grinden körs på rundans sju; familjens femton äldre sidor rördes inte.

☠️ FACIT HÄMTAS UR `facit-live.json`, som LÄSTES UR KATALOGEN — inte kopierat
   från runda 110:s facit. Två rundors filer som bär samma tal är just den
   tvilling huset förlorat tid på fyra gånger (`SHIP_AXIS_RE`, `EU_TULL_CODES`,
   `mapWithConcurrency`, kortfilerna).

☠️ MATERIALKONTROLLEN ÄR PER PRODUKT (`grind.MATERIALORD`), inte per grupp.
   Rundan har SEX material och FEM sidor på 160 × 170 cm i familjen; ett delat
   materialord hade fällt fem korrekta sidor. De två tygskärmarna (F1, F2) får
   dessutom inte bära ordet TRÄ alls — de har ingen träbit i sig.

☠️ TONGRINDARNA KÖRS ÄVEN HÄR, och de är rundans dyraste lärdom. Steg 12 hittade
   FYRA tonfel som textgrinden släppte igenom, på tre produkter vars text redan
   var skriven till Wix:

     db70e38c  "5 kg per hylla enligt leverantören."
     79b349f7  "Leverantören anger uttryckligen att…"   (brödtext + FAQ)
     23d20823  "…är den rundans lättaste skärm"

   Mot kunden är VI leverantören, och `runda` är vårt ord för en arbetsomgång.
   Ingen av meningarna var osann — det var VEM SOM TALADE som var fel, och det
   ser en faktagrind aldrig. Grindarna finns nu i BÅDA lägena: före skrivningen
   i `grind.py` och här mot den renderade sidan.

☠️ `?cb=` BUSTAR INTE ISR-cachen. Next.js nycklar på RUTTEN, inte på query.
   `grindar.hamta_isr` hämtar därför TVÅ gånger: den första beställer
   ombyggnaden, den andra är mätningen.

☠️ KONTROLLMÄTNING: hjältebildens media-id MÅSTE hittas i HTML:en. Utan den vet
   man inte om ett "noll fel" betyder ren sida eller tom hämtning.

☠️ GRINDEN LÄSER HELA HTML:EN, INTE BARA BRÖDTEXTEN — runda 106:s dyraste
   lärdom. Alt-texten står i `<img alt="…">` i den renderade sidan. Rundan bar
   dessutom TOM alt-text på två av sju gallerier och leverantörens råa tyska
   titel på de fem andra före Steg 9, så just den kontrollen är rundans
   viktigaste.

⚠️ RUNDANS EGNA LÖFTEN prövas med SAMMA funktioner som brödtextgrinden
   (`BARRIAR`, `morklaggningslofte`, `UTOMHUSLOFTE`, `LJUDLOFTE`, `VADERLOFTE`,
   `BROMSLOFTE` ur `grind.py`) — inte med omskrivna kopior.
   `morklaggningslofte` känner skillnad på ett löfte och dess förnekande, och
   sidorna bär flera nekande meningar med flit: "den mörklägger inte",
   "mörklägger ingenting" och "Den mörklägger ändå inte ett rum".
"""
import os, re, sys, json

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
import grindar as G                                              # noqa: E402
sys.path.insert(0, HAR)
import texter as T                                               # noqa: E402
import matt as _m                                                # noqa: E402
from grind import (BARRIAR, UTOMHUSLOFTE, LJUDLOFTE, VADERLOFTE,  # noqa: E402
                   BROMSLOFTE, HYLLAST, MATERIALORD, FORBJUDET_ORD,
                   morklaggningslofte)

FACIT = json.load(open(os.path.join(HAR, "facit-live.json"), encoding="utf-8"))
BAS = "https://www.fyndplats.se/produkt/"

# nyckel -> (slug, det utfällda måttet som ska stå ORDAGRANT på sidan)
SIDOR = {k: (T.SLUG[k],
             "%s × %s × %s cm" % (T.tal(_m.RUNDAN[k][2]), T.tal(_m.RUNDAN[k][3]),
                                  T.tal(_m.RUNDAN[k][4])))
         for k in _m.RUNDAN}

# ☠️ Ordlistan är vald för DEN HÄR familjen: orden som FAKTISKT ligger i
#    leverantörens tyska text. `Panel` står inte här — det är svenska.
#    `Natur` inte heller: det är färgnamnet på en av sidorna.
FORBJUDET = [
  ("tyskt ord", re.compile(r"\b(Raumtrenner|Raumteiler|Paravent|Trennwand|Sichtschutz|"
                           r"Kiefernholz|Polypropylen|Webmuster|Metallscharnier|"
                           r"Faltbar|Gefaltete|Gesamtabmessungen|Einzelpaneel|"
                           r"Abmessungen|Lieferumfang|Wohnzimmer|Freistehend|"
                           r"Schlafzimmer|Homeoffice|Weiß|Rollen|Stoff|Vlies|"
                           r"Papierseil|Regalböden|wetterfest)", re.I)),
  ("husmärke", re.compile(r"\b(PawHut|HOMCOM|Outsunny|Aiyaplay|Vinsetto|Aosom)\b", re.I)),
  ("lagerland", re.compile(r"Skickas fr[åa]n\s+(Tyskland|Polen|Spanien|Kina)", re.I)),
  ("artikelnummer", G.ARTNR),
  ("trasig relativ länk", re.compile(r"https:/produkt")),
  ("leverantörsattribution", re.compile(r"\bleverant[öo]r(?:en|ens|er|ers)?\b", re.I)),
  ("intern jargong", re.compile(r"\brundan?s?\b", re.I)),
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
    if FACIT[nyckel]["alt1"] not in rensad:
        fel.append("KONTROLLMÄTNINGEN FALLER — strykningen åt sidans egen alt-text")

    # ☠️ MATERIALKONTROLLEN LÄSER `rensad`, INTE `html` — och det är rundans
    #    tredje mätning på samma yta. Runda 110 lade den FÖRE strykningen; där
    #    föll det aldrig ut, för ingen rekommendationsrad råkade bära ett
    #    förbjudet ord. Här gjorde den det: `79b349f7` fälldes på `bambu`, och
    #    alla SEX förekomsterna satt i grannen "Skoställ i bambu, fyra plan" —
    #    vår egen text har noll. Uppmätt: 6 i full text, 0 i den rensade, och
    #    sidans egna ord (polyester, stål, 252, alt-texten) står alla kvar.
    #
    #    Felet gick åt BÅDA hållen samtidigt, och den andra riktningen är den
    #    tystare: en sida som TAPPAT sitt eget materialord hade kunnat godkännas
    #    av att en granne bar ordet. En positiv kontroll mot fel text är lika
    #    trasig som en negativ — den säger bara ja i stället för nej.
    syn = G.synlig_meningstext(rensad)
    for ord_ in MATERIALORD[nyckel]:
        if ord_ not in rensad.lower():
            fel.append(f"materialet nämner inte {ord_!r} — importfelet lever kvar live")
    if nyckel in FORBJUDET_ORD:
        t = FORBJUDET_ORD[nyckel].search(syn)
        if t:
            fel.append(f"TRÄORD på en produkt utan trä, live: {t.group(0)!r}")

    for etikett, sok in (("BARRIÄRLÖFTE", BARRIAR.search),
                         ("MÖRKLÄGGNINGSLÖFTE", morklaggningslofte),
                         ("UTOMHUSLÖFTE", UTOMHUSLOFTE.search),
                         ("LJUDLÖFTE", LJUDLOFTE.search),
                         ("VÄDERLÖFTE", VADERLOFTE.search),
                         ("BROMSLÖFTE", BROMSLOFTE.search)):
        m = sok(rensad)
        if m:
            i = max(0, m.start() - 70)
            fel.append(f"{etikett} på sidan: …{rensad[i:m.end() + 70]}…")

    # ☠️ HYLLASTEN är en SÄKERHETSUPPGIFT. Nämns hyllorna utan lasten är den
    #    tappad — och bara db70e38c har hyllor att nämna.
    if nyckel == "db70e38c" and not HYLLAST.search(syn):
        fel.append("hyllorna nämns men maxlasten 5 kg står inte på sidan")

    # ☠️ Även den här listan läser `rensad`. En grannes tyska titel eller
    #    husmärke är GRANNENS fel, inte den här sidans, och ett larm som fyrar
    #    på varje korrekt sida lär mottagaren att sluta läsa — samma regel som
    #    mot ett rött synk-jobb vid varje svep.
    for etikett, monster in FORBJUDET:
        t = monster.search(rensad)
        if t:
            fel.append(f"{etikett}: {t.group(0)!r}")
    return fel


def _sjalvtest():
    """☠️ EN UPPMJUKAD GRIND MÅSTE PROVAS ÅT BÅDA HÅLLEN.

    Flytten till `rensad` tog bort ett falsklarm. Den fick INTE ta bort
    grinden. Två syntetiska sidor skiljer fallen åt, och de är identiska så
    när som på VAR ordet står:

      A  ordet i SIDANS EGEN brödtext        → ska FÄLLA
      B  ordet bara i grannens produktnamn   → ska SLÄPPA IGENOM

    Utan A hade fixen kunnat vara `return []` och sett lika grön ut.
    """
    f = FACIT["79b349f7"]
    def sida(egen_extra, granne):
        return (
            '<html>' + f["hjalte"].replace(".jpg", "") + ' ' + f["kort"].replace(".jpg", "") +
            '<img alt="' + f["alt1"] + '">'
            '<p>Fem paneler i mörkgrå polyester på en stomme av stål. '
            '252 × 40 × 170 cm. ' + egen_extra + '</p>'
            '<summary>Tekniska specifikationer</summary>'
            '<summary>Användning och skötsel</summary>'
            '<summary>Vanliga frågor</summary>'
            '<a class="prod" href="/produkt/' + granne[0] + '">'
            '<div class="pname">' + granne[1] + '</div></a>'
            '</html>')
    fall = [
        ("A ordet i egen text  ", sida("Stommen är av bambu.", ("skostall-x", "Skoställ i furu")), True),
        ("B ordet hos grannen  ", sida("", ("skostall-bambu-fyra-plan", "Skoställ i bambu, fyra plan")), False),
    ]
    fel = 0
    for etikett, html, ska_falla in fall:
        traff = [x for x in granska("79b349f7", html) if "TRÄORD" in x]
        if bool(traff) != ska_falla:
            print(f"  SJÄLVTEST FEL {etikett}: {'inget larm' if ska_falla else 'falsklarm'}")
            fel += 1
    print(f"självtest: {len(fall)} fall, {fel} fel")
    return fel


if __name__ == "__main__":
    grona = 0
    if _sjalvtest():
        sys.exit(2)
    for nyckel, (slug, _mm) in SIDOR.items():
        html, hdr = G.hamta_isr(BAS + slug)
        fel = granska(nyckel, html)
        if not fel:
            grona += 1
        print(f"{'OK ' if not fel else 'FEL'} {slug:<28} {len(html):>7} tecken  "
              f"cache={hdr.get('x-vercel-cache')} age={hdr.get('age')}")
        for f in fel:
            print("      ✗", f)
    print(f"\n{grona} av {len(SIDOR)} sidor gröna")
    sys.exit(0 if grona == len(SIDOR) else 1)
