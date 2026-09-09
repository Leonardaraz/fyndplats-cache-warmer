# -*- coding: utf-8 -*-
"""Runda 112 Steg 14 — läs rundans NIO publicerade sidor som kunden ser dem.

Familjen hade NOLL publicerade syskon före rundan, så grinden mäter hela
familjen och inte en batch ur den.

☠️ FACIT HÄMTAS UR `facit-live.json`, som LÄSTES UR KATALOGEN efter
   publiceringen — inte kopierat från rundans egna filer. Två filer som bär
   samma tal är just den tvilling huset förlorat tid på fyra gånger.

☠️ MATERIALKONTROLLEN LÄSER `rensad`, INTE `html`. Runda 111 mätte upp priset:
   `79b349f7` fälldes på `bambu`, och alla sex förekomsterna satt i grannen
   "Skoställ i bambu, fyra plan" — vår egen text hade noll. Felet går åt BÅDA
   hållen: en sida som TAPPAT sitt eget materialord kan godkännas av att en
   granne bär ordet.

☠️ LÖFTESGRINDARNA LÄSER SIDAN UTAN BILDADRESSER — och det var rundans sista
   fynd. Första körningen fällde ALLA NIO på `UPPLÖSNINGSLÖFTE`, och träffen
   var `1080w` i Wix EGEN `srcset`:

     …/v1/fill/w_1080,h_1080,al_c,q_72/file.webp 1080w, …

   Alltså bildens bredd i pixlar, inte ett påstående om duken. Ett larm som
   fyrar på varje korrekt sida lär mottagaren att sluta läsa — samma regel som
   mot ett rött synk-jobb vid varje svep. Adresserna stryks därför före
   löftesgrindarna; alt-texterna är attributvärden och står kvar.

   ⚠️ Uppmjukningen prövas ÅT BÅDA HÅLLEN i självtestet: ett äkta `4K`- och
   `1080p`-löfte i brödtexten måste fortfarande fälla. Utan det hade fixen
   kunnat vara `return []` och sett lika grön ut.

☠️ RUNDANS EGNA LÖFTEN prövas med SAMMA mönster som textgrinden
   (`MORKLAGGNING`, `UPPLOSNING`, `VINKELLOFTE`, `TONGRINDAR`,
   `MATERIALORD`, `FORBJUDET_ORD` ur `grind.py`) — inte med omskrivna kopior.

☠️ `?cb=` BUSTAR INTE ISR-cachen. Next.js nycklar på RUTTEN, inte på query.
   `grindar.hamta_isr` hämtar därför TVÅ gånger: den första beställer
   ombyggnaden, den andra är mätningen.

⚠️ RUNDANS SIGNATUR PRÖVAS SÄRSKILT: varje sida ska bära BÅDA måtten — duken
   och den synliga bildytan — eller, på de tre där de är lika, det ena måttet
   med den uttryckliga meningen att hela duken är bild. Det är sidans enda
   skydd mot att kunden köper 84 tum och mäter 165 cm på väggen.
"""
import json
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
import grindar as G                                              # noqa: E402
sys.path.insert(0, HAR)
import texter as T                                               # noqa: E402
import matt as _m                                                # noqa: E402
from grind import (MORKLAGGNING, UPPLOSNING, VINKELLOFTE, TONGRINDAR,  # noqa: E402
                   MATERIALORD, FORBJUDET_ORD)

FACIT = json.load(open(os.path.join(HAR, "facit-live.json"), encoding="utf-8"))
BAS = "https://www.fyndplats.se/produkt/"

# nyckel -> (slug, dukmåttet, bildytemåttet) — båda ska stå ORDAGRANT på sidan.
SIDOR = {k: (T.SLUG[k], T.duk(k), T.bild(k)) for k in _m.RUNDAN}

# ☠️ Ordlistan är vald för DEN HÄR familjen: orden som FAKTISKT ligger i
#    leverantörens tyska text. `Stativ` står INTE här — det är svenska ord i
#    vår egen text (`stativ`, `stativduk`), och en grind som fäller på det
#    hade fällt fyra korrekta sidor.
FORBJUDET = [
  ("tyskt ord", re.compile(r"\b(Leinwand|Beamer|Projektionsleinwand|Fernbedienung|"
                           r"Bildschirm|Bodenpf[äa]hle|Motorleinwand|Netzstoff|"
                           r"Kunststoff|Metallgeh[äa]use|Wandmontage|Deckenmontage|"
                           r"Lieferumfang|Abmessungen|Verriegelungsmechanismus|"
                           r"Einsatzm[öo]glichkeiten)")),
  ("husmärke", re.compile(r"\b(PawHut|HOMCOM|Outsunny|Aiyaplay|Vinsetto|Aosom)\b", re.I)),
  ("lagerland", re.compile(r"Skickas fr[åa]n\s+(Tyskland|Polen|Spanien|Kina)", re.I)),
  ("artikelnummer", G.ARTNR),
  ("trasig relativ länk", re.compile(r"https:/produkt")),
]
FLIKAR = ["Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor"]


def granska(nyckel, html):
    fel = []
    slug, dukstr, bildstr = SIDOR[nyckel]
    hjalte = FACIT[nyckel]["hjalte"].replace(".jpg", "")
    kort = FACIT[nyckel]["kort"].replace(".jpg", "")
    if hjalte not in html:
        fel.append("KONTROLLMÄTNINGEN FALLER — hjältebilden finns inte i HTML:en")
    if kort not in html:
        fel.append("vårt eget kort saknas i galleriet")
    for f in FLIKAR:
        if f"<summary>{f}</summary>" not in html and f">{f}<" not in html:
            fel.append(f"fliken <summary>{f}</summary> saknas i renderad HTML")

    norm = (html.replace("\\u003c", "<").replace("\\u003e", ">")
                .replace("\\u0026", "&").replace('\\"', '"'))

    # Butikens rekommendationsrad är ANDRA produkters kort, i två
    # serialiseringar. Deras identiteter stryks; sidans egna alt-texter rörs ej.
    andras = set(re.findall(r"/produkt/([a-z0-9-]+)", norm)) - {slug}
    andras |= set(re.findall(r'"pname">([^<]+)<', norm))
    rensad = norm
    for token in sorted(andras, key=len, reverse=True):
        rensad = rensad.replace(token, "")

    if FACIT[nyckel]["alt1"] not in rensad:
        fel.append("KONTROLLMÄTNINGEN FALLER — strykningen åt sidans egen alt-text")

    # ⚠️ Rundans signatur: BÅDA måtten, eller det ena med sin förklaring.
    if dukstr not in rensad:
        fel.append(f"dukmåttet {dukstr} står inte på sidan")
    if bildstr not in rensad:
        fel.append(f"bildytan {bildstr} står inte på sidan")
    if dukstr != bildstr and "Synlig bildyta" not in rensad:
        fel.append("duk och bildyta skiljer sig men raden `Synlig bildyta` saknas")
    if f"{_m.RUNDAN[nyckel][0]} tum" not in rensad:
        fel.append(f"tumtalet {_m.RUNDAN[nyckel][0]} står inte på sidan")

    # ☠️ Bildadresserna bort FÖRE löftesgrindarna. `https:/produkt` (en snedstreck)
    #    matchas inte av mönstret och överlever, så den trasiga länken kan
    #    fortfarande fångas — men den kontrollen läser `rensad` med flit.
    utan_url = re.sub(r"https?://[^\s\"'<>\\]+", " ", rensad)
    syn = G.synlig_meningstext(rensad)
    for ord_ in MATERIALORD[nyckel]:
        if ord_ not in rensad.lower():
            fel.append(f"materialet nämner inte {ord_!r} — importfelet lever kvar live")
    if nyckel in FORBJUDET_ORD:
        t = FORBJUDET_ORD[nyckel].search(syn)
        if t:
            fel.append(f"FEL MATERIAL live: {t.group(0)!r}")

    for etikett, monster in (("MÖRKLÄGGNINGSLÖFTE", MORKLAGGNING),
                             ("UPPLÖSNINGSLÖFTE", UPPLOSNING),
                             ("VINKELLÖFTE", VINKELLOFTE)) + TONGRINDAR:
        m = monster.search(utan_url)
        if m:
            i = max(0, m.start() - 70)
            fel.append(f"{etikett} på sidan: …{utan_url[i:m.end() + 70]}…")

    for etikett, monster in FORBJUDET:
        t = monster.search(rensad if etikett == "trasig relativ länk" else utan_url)
        if t:
            fel.append(f"{etikett}: {t.group(0)!r}")
    return fel


def _sjalvtest():
    """☠️ EN UPPMJUKAD GRIND MÅSTE PRÖVAS ÅT BÅDA HÅLLEN.

    Strykningen av grannarnas identiteter tar bort ett falsklarm. Den får inte
    ta bort grinden. Två syntetiska sidor skiljer fallen åt:

      A  ordet i SIDANS EGEN brödtext        → ska FÄLLA
      B  ordet bara i grannens produktnamn   → ska SLÄPPA IGENOM
    """
    n = "623b6504"
    f = FACIT[n]
    def sida(egen_extra, granne):
        return ('<html>' + f["hjalte"].replace(".jpg", "") + ' '
                + f["kort"].replace(".jpg", "") + '<img alt="' + f["alt1"] + '">'
                '<p>Duken mäter 171 × 130 cm och är 84 tum. Bildytan är 171 × 130 cm. '
                'Duken är en nätväv i ett hölje av metall. ' + egen_extra + '</p>'
                '<summary>Tekniska specifikationer</summary>'
                '<summary>Användning och skötsel</summary>'
                '<summary>Vanliga frågor</summary>'
                '<a class="prod" href="/produkt/' + granne[0] + '">'
                '<div class="pname">' + granne[1] + '</div></a></html>')
    srcset = ('<img srcset="https://static.wixstatic.com/media/'
              + f["hjalte"] + '/v1/fill/w_1080,h_1080,al_c,q_72/file.webp 1080w, '
              'https://static.wixstatic.com/media/' + f["hjalte"]
              + '/v1/fill/w_4000,h_4000,al_c,q_85/file.webp 4000w">')
    fall = [
        ("A polyester i egen text ", "FEL MATERIAL",
         sida("Duken är av polyester.", ("duk-x", "Projektorduk i väv")), True),
        ("B polyester hos grannen ", "FEL MATERIAL",
         sida("", ("projektorduk-polyester-120", "Projektorduk i polyester, 120 tum")), False),
        ("C 1080p i egen brödtext ", "UPPLÖSNINGSLÖFTE",
         sida("Duken klarar 1080p och 4K.", ("duk-y", "Projektorduk i väv")), True),
        ("D 1080w i Wix srcset   ", "UPPLÖSNINGSLÖFTE",
         sida("", ("duk-y", "Projektorduk i väv")) + srcset, False),
    ]
    fel = 0
    for etikett, sok, html, ska in fall:
        traff = [x for x in granska(n, html) if sok in x]
        if bool(traff) != ska:
            print(f"  SJÄLVTEST FEL {etikett}: {'inget larm' if ska else 'falsklarm'}")
            fel += 1
    print(f"självtest: {len(fall)} fall, {fel} fel")
    return fel


if __name__ == "__main__":
    if _sjalvtest():
        sys.exit(2)
    grona = 0
    for nyckel, (slug, _d, _b) in SIDOR.items():
        html, hdr = G.hamta_isr(BAS + slug)
        fel = granska(nyckel, html)
        if not fel:
            grona += 1
        print(f"{'OK ' if not fel else 'FEL'} {slug:<34} {len(html):>7} tecken  "
              f"cache={hdr.get('x-vercel-cache')} age={hdr.get('age')}")
        for f in fel:
            print("      ✗", f)
    print(f"\n{grona} av {len(SIDOR)} sidor gröna")
    sys.exit(0 if grona == len(SIDOR) else 1)
