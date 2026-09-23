# -*- coding: utf-8 -*-
"""Runda 107 Steg 14 — läs de sju publicerade sidorna som kunden ser dem.

☠️ `?cb=` BUSTAR INTE ISR-cachen. Next.js nycklar på RUTTEN, inte på query.
   `grindar.hamta_isr` hämtar därför TVÅ gånger: den första beställer
   ombyggnaden, den andra är mätningen.

☠️ KONTROLLMÄTNING: hjältebildens media-id MÅSTE hittas i HTML:en. Utan den vet
   man inte om ett "noll fel" betyder ren sida eller tom hämtning.

☠️ GRINDEN LÄSER HELA HTML:EN, INTE BARA BRÖDTEXTEN — och det är runda 106:s
   dyraste lärdom. Där var källtextgrinden grön på alla sex sidor medan FEM av
   dem hade "kaniner" i en ALT-TEXT, på sidor vars brödtext säger att hagen
   inte säljs som kaninbostad. Alt-texten står i `<img alt="…">` i den
   renderade sidan, så en grind som söker i hela svaret ser den; en som
   klipper ut beskrivningen först gör det inte.

☠️ TVÅ sanktionerade ställen får nämna kanin, och båda är PER PRODUKT:
   upplysningen (`kaninraden`) och nej-svaret i FAQ (`kaninfaq`). De hämtas ur
   `texter.py` i stället för att skrivas om här — samma literal, inga
   tvillingar som glider isär.
"""
import os, re, sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
import grindar as G                                              # noqa: E402
sys.path.insert(0, HAR)
import texter as T                                               # noqa: E402
import alt as A                                                  # noqa: E402
import importlib.util
_s = importlib.util.spec_from_file_location("hb", HAR + "/hamta-bilder.py")
HB = importlib.util.module_from_spec(_s); _s.loader.exec_module(HB)
_s2 = importlib.util.spec_from_file_location("gm", HAR + "/gen-media.py")
GM = importlib.util.module_from_spec(_s2); _s2.loader.exec_module(GM)

BAS = "https://www.fyndplats.se/produkt/"

# nyckel -> (slug, golvyta som ska stå på sidan)
SIDOR = {
 "a75fcfde": ("smadjursstall-230-natur", "0,86 m²"),
 "c0770388": ("smadjursstall-230-gra",   "0,86 m²"),
 "2253c509": ("smadjursstall-141-natur", "0,75 m²"),
 "2435c4d1": ("smadjursstall-156-gra",   "0,76 m²"),
 "dcdf889d": ("smadjursstall-156-natur", "0,76 m²"),
 "525e6acf": ("smadjursstall-123-natur", "0,61 m²"),
 "079f2901": ("smadjursstall-123-gra",   "0,61 m²"),
}

# ☠️ Ordlistan är vald för DEN HÄR familjen: orden som FAKTISKT ligger i
#    leverantörens tyska text för de sju. `Stall` står inte här — det är
#    svenska. `Rampe` inte heller: det är "ramp" med ett e och skulle fälla
#    varje korrekt svensk mening om rampen (runda 56:s `re·gelb·undet` igen,
#    fast åt andra hållet).
FORBJUDET = [
  ("tyskt ord", re.compile(r"\b(Hasenstall|Kaninchenstall|Kaninchenk|Kleintierstall|"
                           r"Freigehege|Freilauf|Auslauf|Bodenwanne|Meerschweinchen|"
                           r"Zwergkaninchen|Doppelstock|Etagen|Abmessungen|Lieferumfang|"
                           r"Geeignet f|Tannenholz|Asphaltdach|Bitumendach|winterfest)", re.I)),
  ("husmärke", re.compile(r"\b(PawHut|HOMCOM|Outsunny|Aiyaplay|Vinsetto|Aosom)\b", re.I)),
  ("lagerland", re.compile(r"Skickas fr[åa]n\s+(Tyskland|Polen|Spanien|Kina)", re.I)),
  ("artikelnummer", G.ARTNR),
  ("trasig relativ länk", re.compile(r"https:/produkt")),
  ("leverantörsattribution", re.compile(r"\bleverant[öo]ren?s?\b", re.I)),
]
KANINORD = re.compile(r"kanin", re.I)
FLIKAR = ["Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor"]


def granska(nyckel, html):
    fel = []
    slug, yta = SIDOR[nyckel]
    hjalte = HB.GALLERIER[nyckel][0].replace(".jpg", "")
    kort = GM.KORTFIL[nyckel].replace(".jpg", "")
    if hjalte not in html:
        fel.append("KONTROLLMÄTNINGEN FALLER — hjältebilden finns inte i HTML:en")
    if kort not in html:
        fel.append("vårt eget kort saknas i galleriet")
    if yta not in html:
        fel.append(f"golvytan {yta} står inte på sidan")
    # ⚠️ Flikarna kontrolleras på <summary> i den RENDERADE sidan, inte på att
    #    ordet finns någonstans: en rubrik som inte matchar splittern renderas
    #    inline mitt i brödtexten och ser bara ut som en rubrik till.
    for f in FLIKAR:
        if f"<summary>{f}</summary>" not in html and f">{f}<" not in html:
            fel.append(f"fliken <summary>{f}</summary> saknas i renderad HTML")
    if "SJVFS" not in html:
        fel.append("den rättsliga upplysningen (SJVFS 2019:15) saknas")
    if "säljs inte som kaninbostad" not in html:
        fel.append("raden om att stallet inte säljs som kaninbostad saknas")

    # ☠️ Meningarna står TVÅ gånger i svaret — som HTML och en gång till i
    #    Next.js JSON-nyttolast med `<`-escapade taggar. SJÄLVA meningen är
    #    identisk i båda, så `str.replace` städar bort båda.
    # ⚠️ FAQ-FRÅGANS RUBRIK måste också strykas, inte bara svaret. Sidan bär
    #    ett FAQPage-JSON-LD där frågan står som `"name"` och svaret som
    #    `"text"` — en fråga som nämner kanin är ingen utfästelse, svaret är
    #    "Nej.". Frågan HÄRLEDS ur texten (den <strong>…?</strong> som står
    #    närmast före svaret) i stället för att skrivas om här.
    #
    # ☠️ Och en varning om felmeddelandet: efter strykningen står `"text":""`
    #    kvar i den STRUKNA kopian, vilket ser ut som ett tomt FAQ-svar i
    #    utskriften. Det är ett artefakt av grinden, inte ett fel på sidan —
    #    kontrollmätt mot skarpa sidan: alla sju svaren är ifyllda. Läs
    #    MEDDELANDET, och kontrollera påståendet innan du bokför ett fynd.
    svar = T.kaninfaq(nyckel)
    ihtml = T.PRODUKTER[nyckel]["html"]
    fraga = re.findall(r"<strong>([^<]*\?)</strong>", ihtml[:ihtml.find(svar)])[-1]

    # ☠️ Sidan bär ordet i FYRA former: som HTML, som FAQPage-JSON-LD, och en
    #    gång till i Next.js nyttolast med `\u003c`-escapade taggar. Normalisera
    #    FÖRST, så räcker en strykning per sanktionerad mening.
    norm = (html.replace("\\u003c", "<").replace("\\u003e", ">")
                .replace("\\u0026", "&").replace('\\"', '"'))

    # ⚠️ BUTIKENS "liknande produkter"-rad är ANDRA produkters kort — deras
    #    namn, deras alt-texter, deras länkar. Uppmätt på båda 230-sidorna:
    #    raden länkar till `kaninhus-utomhus-122-cm-rastgard` och
    #    `kaninbur-inomhus-…`, alltså riktiga kaninbostäder. Det är inget
    #    påstående om DEN HÄR varan, och rekommendationen är dessutom rimlig.
    #
    # ☠️ Ett första försök strök `<a class="prod">…</a>` och FÖLL ÄNDÅ: raden
    #    finns i TVÅ serialiseringar, en gång som HTML och en gång i Next.js
    #    Flight-nyttolast (`["$","$L40","kaninhus-…",{"className":"prod",…`).
    #    En strykning som bara känner den ena formen ser ut att bita.
    #    Därför stryks i stället andra produkters IDENTITETER — sluggen och
    #    namnet — som är samma literal i båda formerna, och som per definition
    #    inte är påståenden om den här varan. Sidans egna alt-texter rörs inte.
    andras = set(re.findall(r"/produkt/([a-z0-9-]+)", norm)) - {slug}
    andras |= set(re.findall(r'"pname">([^<]+)<', norm))
    rensad = norm
    for token in sorted(andras, key=len, reverse=True):
        rensad = rensad.replace(token, "")

    # ☠️ KONTROLLMÄTNING på strykningen själv: sidans EGNA alt-texter måste
    #    finnas kvar efteråt. Hela poängen med grinden är att den läser dem
    #    (runda 106), och en strykning som råkade svälja galleriet hade gjort
    #    "noll fel" meningslöst — samma klass som en tom hämtning.
    egen_alt = A.galleri(nyckel)[0]
    if egen_alt not in rensad:
        fel.append("KONTROLLMÄTNINGEN FALLER — strykningen åt sidans egen alt-text")

    utan = rensad
    for sanktionerad in (G.synlig_meningstext(T.kaninraden(nyckel)), svar, fraga):
        utan = utan.replace(sanktionerad, "")
    m = KANINORD.search(utan)
    if m:
        i = max(0, m.start() - 70)
        fel.append(f"KANINLÖFTE utanför upplysningen och nej-svaret: "
                   f"…{utan[i:m.end() + 70]}…")

    for etikett, monster in FORBJUDET:
        t = monster.search(html)
        if t:
            fel.append(f"{etikett}: {t.group(0)!r}")
    return fel


if __name__ == "__main__":
    grona = 0
    for nyckel, (slug, _yta) in SIDOR.items():
        html, hdr = G.hamta_isr(BAS + slug)
        fel = granska(nyckel, html)
        if not fel:
            grona += 1
        print(f"{'OK ' if not fel else 'FEL'} {slug:<26} {len(html):>7} tecken  "
              f"cache={hdr.get('x-vercel-cache')} age={hdr.get('age')}")
        for f in fel:
            print("      ✗", f)
    print(f"\n{grona} av {len(SIDOR)} sidor gröna")
    sys.exit(0 if grona == len(SIDOR) else 1)
