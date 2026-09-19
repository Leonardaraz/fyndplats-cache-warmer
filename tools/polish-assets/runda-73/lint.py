# -*- coding: utf-8 -*-
"""Grindar för runda 73. Körs mot texter.py INNAN något skrivs till Wix.

De REGLER som gäller varje runda importeras från ../grindar.py — de får inte
finnas i en kopia här. Det som står i den här filen är rundans egna FAKTA.

☠️ SJU EXTERNA FACIT den här rundan, mot runda 72:s ett. Tre av batchens
   åtta är färgsyskon till publicerade sidor, och varje "finns i fler
   färger"-mening är ett påstående om MÅLET. Färgorden i dem granskas därför
   mot målens facit, inte mot batchens.

☠️ RUNDANS EGEN GRIND: `massage`. Källan till `b1e98da4` kallar produkten
   "Massagestuhl" mitt i en mening om ryggens vred. Ingen produkt i rundan har
   en massagefunktion, så ordet är förbjudet rakt av — samma form som runda
   72:s blankettförbud, och av ett skäl som är uppmätt i just den här batchen.

⚠️ EXTERN bär `farg` men TOMMA `last`/`grad` för de sidor där talen inte är
   avlästa. En tom mängd FÄLLER varje talpåstående om den sidan — det är rätt
   riktning: en korshänvisning får inte påstå ett tal ingen har läst.
"""
import glob
import json
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from grindar import (TYSKA, HUSMARKEN, LANDORD, ATTRIBUTION, ARTNR,   # noqa: E402
                     ANKARE, FARGORD, LAGERFRAS, pastaenden, strip_taggar,
                     sku_bas, dela_pa_ankare, synlig_meningstext,
                     pastar_i_listan)
from texter import PRODUKTER, bygg                                    # noqa: E402

FEL = []


def fal(kort, vad):
    FEL.append("%s  %s" % (kort, vad))


# ------------------------------------------------------- rundans fakta ---
A = {"969d9ec9"}    # tät väv 310 g/m², gungar + vrider, 135°
B = {"b72f093d"}    # gungande tv-fåtölj, mugghållare ×2, 135°   (839-974)
C = {"54cf1f44"}    # reclinerfåtölj, handtag, INGET gradtal
D = {"acb1f904"}    # tv-fåtölj med sidoficka, 135°, 100 kg
E = {"e57125fb"}    # väggnära, 150°, 15 cm bakom
F = {"b1e98da4"}    # snurrfåtölj med vred + fotpall             (833-360)
G = {"b67fdc2b"}    # vilfåtölj med fotpall + förvaringsfack     (833-359)
H = {"7eee41b6"}    # bäddfåtölj, fem lägen, INGET gradtal

# ☠️ Publicerade sidor batchen länkar till. `kalla` betyder LÄST LIVE UR WIX,
#    inte "jag minns den" — KANDA ser bara rundor med en skrivning.json på
#    disk, och de här sidorna är polerade utanför den konventionen.
#
#    ⚠️ `last` och `grad` är TOMMA där talen inte är avlästa. Tom mängd fäller
#    varje talpåstående om sidan, vilket är den säkra riktningen: en
#    korshänvisning får inte bära ett tal ingen har läst. Färgorden är låsta i
#    sidornas egna sluggar och är därför facit.
def _ext(farg, drag=(), last=(), grad=()):
    return dict(farg=set(farg), drag=set(drag), last=set(last), grad=set(grad),
                kalla="wix 2026-09-06")


EXTERN = {
    # 839-974 — samma modell som b72f093d i tre andra färger
    "gungande-tv-fatolj-morkbla": _ext({"mörkblå"}, {"gungar", "mugghållare"}),
    "gungande-tv-fatolj-gra": _ext({"grå"}, {"gungar", "mugghållare"}),
    "gungande-tv-fatolj-beige": _ext({"beige"}, {"gungar", "mugghållare"}),
    # 833-360 — samma modell som b1e98da4 i svart
    "konstladerfatolj-med-fotpall-svart": _ext({"svart"}, {"fotpall", "360",
                                                           "vred"}),
    # 833-359 — samma modell som b67fdc2b i tre andra färger
    "vilfatolj-graddvit-med-fotpall": _ext({"gräddvit"},
                                           {"fotpall", "360", "förvaringsfack"}),
    "vilfatolj-morkgra-med-fotpall": _ext({"mörkgrå"},
                                          {"fotpall", "360", "förvaringsfack"}),
    "tv-fatolj-forvaringspall-145": _ext({"svart"},
                                         {"fotpall", "360", "förvaringsfack"}),
}

MAXLAST = {
    "969d9ec9": {"120 kg"},
    "b72f093d": {"150 kg"},
    "54cf1f44": {"150 kg"},
    "acb1f904": {"100 kg"},
    "e57125fb": {"120 kg"},
    # ☠️ FOTPALLENS last är ett EGET och LÄGRE tal på de två som har en pall.
    #    Den måste passera grinden, annars fälls just den mening som finns för
    #    att kunden inte ska sätta sig på pallen.
    "b1e98da4": {"120 kg", "100 kg"},
    "b67fdc2b": {"120 kg", "100 kg"},
    "7eee41b6": {"120 kg"},
}

GRADER = {
    "969d9ec9": {"135°", "360°"},
    # ☠️ b72f093d VRIDER men källan ger inget gradtal för vridningen. 360° får
    #    därför inte stå — talet finns inte, och den publicerade syskonsidans
    #    text är inte facit för vår.
    "b72f093d": {"135°"},
    # ☠️ Tomma mängder är AKTIVA BESLUT. C:s källa ger ingen ryggvinkel alls
    #    (handtag, inga hack) och H är en bäddfåtölj med fem LÄGEN, inte grader.
    "54cf1f44": set(),
    "acb1f904": {"135°", "360°"},
    "e57125fb": {"150°"},
    "b1e98da4": {"360°"},
    "b67fdc2b": {"145°", "360°"},
    "7eee41b6": set(),
}

# ☠️ FÄRGEN ÄR AVLÄST UR PIXLARNA OCH KALIBRERAD MOT PUBLICERADE SIDOR, inte
#    hämtad ur feedens Farbe-kolumn. Källan har FEL på fem av åtta, och varje
#    fel går åt det håll som hade krockat med ett publicerat syskons ord.
FARG = {
    "969d9ec9": {"ljusgrå"},
    "b72f093d": {"gråbrun"},     # källan: Hellbraun — L 39 %, S 7 %
    "54cf1f44": {"grå"},         # källan: Hellgrau — L 50 %, ljusgrå tar vid 58
    "acb1f904": {"gräddvit"},
    "e57125fb": {"brun"},        # källan: Dunkelbraun + Schwarz — L 44 %
    "b1e98da4": {"ljusgrå"},     # källan: Grau — L 67 %
    "b67fdc2b": {"gråbrun"},     # källan: Braun — S 6 %
    "7eee41b6": {"grå"},
}

# ☠️ Färgord som ETT ANNAT syskon i batchen äger ordagrant. Utan raden släpper
#    den delade grinden igenom HUVUDET i en sammansättning — "grå" när facit
#    säger "ljusgrå" — och rundans grå blir omöjlig att skilja från dess
#    ljusgrå. Runda 70:s lagning, oförändrad.
RESERVERADE = set()
for _f in FARG.values():
    RESERVERADE |= _f
for _e in EXTERN.values():
    RESERVERADE |= _e["farg"]

VIKT = {
    "969d9ec9": "45 kg",
    "b72f093d": "50 kg",
    "54cf1f44": "44,5 kg",
    "acb1f904": "22,5 kg",
    "e57125fb": "41,5 kg",
    "b1e98da4": "18 kg",
    "b67fdc2b": "24 kg",
    "7eee41b6": "19,5 kg",
}

# ☠️ Påståenden som MÅSTE nå kunden, ordagrant.
MASTE_STA = {
    "969d9ec9": ["135°", "360°", "120 kg", "310 g/m²"],
    "b72f093d": ["135°", "150 kg", "mugghållare"],
    "54cf1f44": ["150 kg", "87 cm"],
    "acb1f904": ["135°", "100 kg", "sidoficka"],
    "e57125fb": ["150°", "15 cm"],
    # ☠️ FOTPALLENS lägre last måste nå kunden ORDAGRANT. Utan raden är den
    #    osynlig för varje grind: 100 och 120 är BÅDA giltiga tal för de två
    #    produkter som har en pall, så en mutation som skriver stolens last på
    #    pallen passerar maxlast-grinden orörd. Mutationstestet mätte det.
    "b1e98da4": ["120 kg", "100 kg", "vred", "43 × 38"],
    "b67fdc2b": ["145°", "120 kg", "100 kg", "40 × 34"],
    "7eee41b6": ["120 kg", "185,5", "fem lägen"],
}

# ☠️ EN KVALIFICERAD FÄRG MÅSTE STÅ ORDAGRANT. Den delade grinden undantar
#    HUVUDET i en sammansättning ("grå" godkänns när facit säger "ljusgrå"),
#    och den spärren biter bara när ett SYSKON äger huvudordet. Rundans fem
#    rättade färgord är exakt de som annars hade fallit tillbaka till källans
#    felaktiga ord, så de krävs ordagrant.
for _k, _ord in (("969d9ec9", "ljusgrå"), ("b72f093d", "gråbrun"),
                 ("54cf1f44", "grå"), ("acb1f904", "gräddvit"),
                 ("e57125fb", "brun"), ("b1e98da4", "ljusgrå"),
                 ("b67fdc2b", "gråbrun"), ("7eee41b6", "grå")):
    MASTE_STA[_k].append(_ord)

# ☠️ H fäller ryggen till en BÄDD men har ingen ryggvinkel; den räknas ändå
#    som en fällning. C fäller med handtag. Bara ingen av dem har ett gradtal.
LUTAR = A | B | C | D | E | F | G | H
LUT_RE = re.compile(r"fäller ryggen|ryggen fälls|ryggen läggs|tillbakalutad|"
                    r"ryggvinkel|ryggen låses|ryggen ställs|ryggen har fem|"
                    r"fäll ryggen|fäll upp ryggen|lutar den", re.I)

MED_FOTPALL = F | G          # ☠️ bara dessa två har en LÖS pall
MED_360 = A | D | F | G      # ☠️ B vrider men källan ger inget gradtal
MED_GUNG = A | B
MED_MUGG = B | D
MED_SIDOFICKA = set(D)
MED_VAGGNARA = set(E)
MED_FORVARING = set(G)
MED_KRYSSFOT = set(G)
MED_KNAPPAD = set(G)
MED_VRED = set(F)
MED_FEM_LAGEN = set(H)
MED_BADD = set(H)

TILLATEN_LADER = re.compile(r"konstläder\w*|läderlook\w*|likna(?:r)? läder", re.I)
TILLATEN_SAMMET = re.compile(r"sammetslook\w*|sammetens\b|sammet av naturfiber",
                             re.I)
# ☠️ "linnelook" är tillåtet, naket "linne" är ett NATURFIBERPÅSTÅENDE. Ingen
#    produkt i rundan har äkta linne — tre har linnelook i 100 % polyester.
# ⚠️ GENITIVEN ÄR EN LIKNELSE, inte ett materialpåstående. "linnets matta
#    yta" säger vad väven LIKNAR — samma klass som runda 72:s tillåtna
#    "liknar läder". Ett påstående om att tyget ÄR linne kan inte bäras av
#    en genitiv; det kräver "linne" i grundform, och den fälls fortfarande.
TILLATEN_LINNE = re.compile(r"linnelook\w*|linnets\b", re.I)


def kanda_sluggar():
    """Sluggar tidigare rundor faktiskt skrev. En felstavad länk ska fällas."""
    ut = {}
    for f in sorted(glob.glob(os.path.join(os.path.dirname(HAR),
                                           "runda-*", "skrivning.json"))):
        # ☠️ Hoppa över DEN EGNA rundan — annars förgiftar grinden sig själv
        #    vid andra körningen, precis som byggfiltret i vercel.json gjorde.
        if os.path.dirname(os.path.abspath(f)) == HAR:
            continue
        try:
            d = json.load(open(f, encoding="utf-8"))
        except Exception:
            continue
        for q in (d if isinstance(d, list) else d.get("produkter", [])):
            if q.get("slug"):
                ut[q["slug"]] = os.path.basename(os.path.dirname(f))
    return ut


KANDA = kanda_sluggar()
SLUG2KORT = {p["slug"]: p["kort"] for p in PRODUKTER}
SLUGGAR = {p["slug"]: p for p in PRODUKTER}
GRAD_RE = re.compile(r"\d+°")


def facit(mal_sluggar, falt, egen_dict):
    """Facit för en korshänvisning — batchens egna OCH de publicerade."""
    ut, kanda_mal = set(), []
    for s in mal_sluggar:
        if s in SLUG2KORT:
            ut |= egen_dict[SLUG2KORT[s]]
            kanda_mal.append(SLUG2KORT[s])
        elif s in EXTERN:
            ut |= EXTERN[s][falt]
            kanda_mal.append(s[:22])
    return ut, kanda_mal


def har_drag(mal_sluggar, drag, agare):
    """Har NÅGOT av länkmålen den här egenskapen?"""
    for s in mal_sluggar:
        if s in SLUG2KORT and SLUG2KORT[s] in agare:
            return True
        if s in EXTERN and drag in EXTERN[s]["drag"]:
            return True
    return False


def kant_mal(mal_sluggar):
    return [s for s in mal_sluggar if s in SLUG2KORT or s in EXTERN]


def kor():
    sedda_sku, sedda_slug = {}, {}

    # ☠️ Facit för en PUBLICERAD sida är värdelöst om sidan inte finns.
    for s in sorted(EXTERN):
        if s not in KANDA and not EXTERN[s].get("kalla"):
            fal("EXTERN", "%s står i EXTERN utan att någon runda har skrivit "
                          "den OCH utan `kalla`" % s)

    for p in PRODUKTER:
        k = p["kort"]
        html = bygg(p)
        synlig = strip_taggar(html)
        meningstext = synlig_meningstext(html)
        allt = " ".join([p["name"], p["title"], p["meta"], synlig]).lower()

        for o in TYSKA:
            if re.search(r"\b%s\b" % re.escape(o), allt):
                fal(k, "tyskt ord: %s" % o)
        if ARTNR.search(" ".join([p["name"], p["title"], p["meta"], synlig])):
            fal(k, "artikelnummer i texten")
        for o in HUSMARKEN:
            if re.search(r"\b%s\b" % o, allt):
                fal(k, "husmärke: %s" % o)
        for o in LANDORD:
            if re.search(r"\b%s\b" % o, allt):
                fal(k, "land utskrivet: %s" % o)
        for o in ATTRIBUTION:
            if re.search(r"\b%s\b" % o, allt):
                fal(k, "attribution: %s" % o)
        for f in LAGERFRAS:
            if f in allt:
                fal(k, "lagerfras: %s" % f)
        if "artikelnr" in allt or "modellreferens" in allt:
            fal(k, "artikelnummer-etikett")

        # ☠️ En mening med länk är ett påstående om den LÄNKADE produkten.
        egna, kors = dela_pa_ankare(html)
        rubrikfalt = " ".join([p["name"], p["title"], p["meta"]])
        LAST_RE = r"(?:bär|maxlast|last|märkt för|gjord för)[^.]{0,40}?(\d+ kg)"

        for mening in egna + [rubrikfalt]:
            for tal in re.findall(LAST_RE, mening.lower()):
                if tal not in MAXLAST[k]:
                    fal(k, "maxlast %s finns inte i facit %s"
                        % (tal, sorted(MAXLAST[k])))
            for grad in GRAD_RE.findall(mening):
                if grad not in GRADER[k]:
                    fal(k, "gradtalet %s finns inte i facit %s"
                        % (grad, sorted(GRADER[k])))
        for mal_sluggar, mening in kors:
            if not kant_mal(mal_sluggar):
                continue
            lfacit, mkn = facit(mal_sluggar, "last", MAXLAST)
            for tal in re.findall(LAST_RE, mening.lower()):
                if tal not in lfacit:
                    fal(k, "korshänvisning påstår %s om %s, facit %s"
                        % (tal, "/".join(mkn), sorted(lfacit)))
            gfacit, _ = facit(mal_sluggar, "grad", GRADER)
            for grad in GRAD_RE.findall(mening):
                if grad not in gfacit:
                    fal(k, "korshänvisning påstår %s om %s, facit %s"
                        % (grad, "/".join(mkn), sorted(gfacit)))

        # Vikten
        if VIKT[k].lower() not in allt:
            fal(k, "vikt %s saknas" % VIKT[k])
        for annan in set(VIKT.values()) - {VIKT[k]}:
            # ☠️ ORDGRÄNS. Utan den matchar "20 kg" inuti "120 kg".
            if re.search(r"(?<![\d,])%s" % re.escape(annan.lower()), allt):
                fal(k, "annan produkts egenvikt %s publicerad" % annan)

        # Färgorden — bara HUVUDET i en sammansättning får släppas igenom.
        def farggrind(text, fc, agare, varifran):
            for ord_ in FARGORD:
                if ord_ in fc:
                    continue
                if (any(b.endswith(ord_) and ord_ != b for b in fc)
                        and ord_ not in (RESERVERADE - fc)):
                    continue
                if re.search(r"(?<![a-zåäö])%s(?![a-zåäö])" % ord_, text.lower()):
                    fal(k, "%sfärgord '%s' stämmer inte mot %s facit %s"
                        % (varifran, ord_, agare, sorted(fc)))

        for mening in egna + [rubrikfalt]:
            farggrind(mening, FARG[k], k, "")
        for mal_sluggar, mening in kors:
            ffacit, mkn = facit(mal_sluggar, "farg", FARG)
            if mkn:
                farggrind(mening, ffacit, "/".join(mkn), "korshänvisningens ")

        # ☠️ Materialfällor. Ett FÖRNEKANDE är tillåtet.
        for tr, mening in pastaenden(TILLATEN_LADER.sub(" ", meningstext),
                                     re.compile(r"\bläder|\bskinn", re.I)):
            fal(k, "läder eller skinn påstås om en väv: %.70s" % mening)
        for tr, mening in pastaenden(TILLATEN_SAMMET.sub(" ", meningstext),
                                     re.compile(r"\bsammet", re.I)):
            fal(k, "sammet påstås naket om en sammetslook-väv: %.70s" % mening)
        for tr, mening in pastaenden(TILLATEN_LINNE.sub(" ", meningstext),
                                     re.compile(r"\blinne", re.I)):
            fal(k, "naket linne påstås om en polyesterväv: %.70s" % mening)
        # ☠️ Ingen produkt i rundan har massivt trä. G:s fot är trä och sägs
        #    vara det — "massiv" är däremot ett ord källan aldrig ger.
        for tr, mening in pastaenden(meningstext,
                                     re.compile(r"\bbomull|massivt trä|"
                                                r"äkta sammet|äkta chenille|"
                                                r"\bek\b|\bvalnöt", re.I)):
            fal(k, "naturmaterial påstås: %.70s" % mening)

        # Hälsopåståenden
        if re.search(r"spänningar|värk|smärt|lindrar|botar|läker|terapeut|"
                     r"sömnstörn|insomn|ammande|amning|förebygger|blodcirk",
                     allt):
            fal(k, "hälsopåstående")
        # ☠️ RUNDANS EGEN GRIND. `b1e98da4`s källa säger "Massagestuhl" mitt i
        #    en mening om ryggens vred. Ingen produkt i rundan har massage.
        if re.search(r"\bmassage", allt):
            fal(k, "massage påstås — ingen produkt i rundan har det")

        # ☠️ Utrustningsgrinden är KORSHÄNVISNINGSMEDVETEN och medveten om
        #    publicerade mål.
        def utrustningsgrind(stam, agare, drag, vad):
            egen = (pastar_i_listan(egna, stam)
                    or stam in rubrikfalt.lower())
            if egen and k not in agare:
                fal(k, "%s påstås men produkten har ingen" % vad)
            if k in agare and not egen:
                fal(k, "%s nämns inte trots att den är säljargumentet" % vad)
            for mal_sluggar, mening in kors:
                if not kant_mal(mal_sluggar):
                    continue
                if stam in mening.lower() and not har_drag(mal_sluggar, drag,
                                                           agare):
                    fal(k, "korshänvisningen påstår %s om %s, som inte har det"
                        % (vad, "/".join(kant_mal(mal_sluggar))))

        for mening in egna:
            if LUT_RE.search(mening) and k not in LUTAR:
                fal(k, "ryggfällning påstås men produkten har fast rygg: %.60s"
                    % mening)
        if k in LUTAR and not any(LUT_RE.search(m) for m in egna):
            fal(k, "ryggfällningen nämns inte trots att den är säljargumentet")

        utrustningsgrind("fotpall", MED_FOTPALL, "fotpall", "lös fotpall")
        utrustningsgrind("360", MED_360, "360", "360° vridfot")
        utrustningsgrind("gungar", MED_GUNG, "gungar", "gungfunktion")
        utrustningsgrind("mugghållare", MED_MUGG, "mugghållare", "mugghållare")
        utrustningsgrind("sidoficka", MED_SIDOFICKA, "sidoficka", "sidoficka")
        utrustningsgrind("väggnära", MED_VAGGNARA, "väggnära",
                         "väggnära mekanism")
        utrustningsgrind("förvaringsfack", MED_FORVARING, "förvaringsfack",
                         "dolt förvaringsfack")
        utrustningsgrind("kryssfot", MED_KRYSSFOT, "kryssfot", "kryssfot av trä")
        utrustningsgrind("knappad", MED_KNAPPAD, "knappad", "knappad rygg")
        utrustningsgrind("vred", MED_VRED, "vred", "låsvred för ryggen")
        utrustningsgrind("fem lägen", MED_FEM_LAGEN, "fem lägen",
                         "rygg i fem lägen")
        utrustningsgrind("bädd", MED_BADD, "bädd", "bäddfunktion")

        # Monteringen ska nämnas på alla åtta.
        pastar = " ".join(p["eg"] + p["spec"]).lower()
        if not re.search(r"monter", pastar):
            fal(k, "monteringen nämns inte i egenskaper eller spec")

        for kravd in MASTE_STA.get(k, []):
            if kravd.lower() not in synlig.lower():
                fal(k, "%r saknas i texten" % kravd[:40])

        for href, txt in ANKARE.findall(html):
            if not href.startswith("https://www.fyndplats.se/produkt/"):
                fal(k, "relativ eller främmande länk: %s" % href)
                continue
            mal = href.rsplit("/", 1)[-1]
            if mal == p["slug"]:
                fal(k, "länk till sig själv")
            elif mal in SLUGGAR:
                pass
            elif mal in EXTERN:
                if mal not in KANDA and not EXTERN[mal].get("kalla"):
                    fal(k, "EXTERN-slug utan bevis att sidan finns: %s" % mal)
            else:
                fal(k, "länk till slug utanför batchen och utan facit: %s" % mal)

        huvud = p["sokord"].split()[0]
        if huvud.lower() not in p["name"].lower():
            fal(k, "fokusordet '%s' saknas i name" % huvud)
        for falt in ("title", "meta"):
            if huvud.lower() not in p[falt].lower():
                fal(k, "fokusordet '%s' saknas i %s" % (huvud, falt))

        vantad = "FP-" + sku_bas(p["slug"])
        if len(vantad) > 40:
            fal(k, "SKU längre än 40 tecken")
        if vantad in sedda_sku:
            fal(k, "SKU %s krockar med %s" % (vantad, sedda_sku[vantad]))
        sedda_sku[vantad] = k
        if p["slug"] in sedda_slug:
            fal(k, "slug krockar med %s" % sedda_slug[p["slug"]])
        sedda_slug[p["slug"]] = k
        if p["slug"] in KANDA:
            fal(k, "slug %s är redan skriven i %s" % (p["slug"], KANDA[p["slug"]]))
        if not re.match(r"^[a-z0-9-]+$", p["slug"]):
            fal(k, "slug är inte ren ASCII-gemener: %s" % p["slug"])

        if len(p["name"]) > 80:
            fal(k, "name %d tecken (max 80)" % len(p["name"]))
        if p["title"] == p["name"]:
            fal(k, "titeln är identisk med namnet — storefronten lägger på suffix")
        if len(p["title"]) > 60:
            fal(k, "title %d tecken (max 60)" % len(p["title"]))
        if not (110 <= len(p["meta"]) <= 160):
            fal(k, "meta %d tecken (110–160)" % len(p["meta"]))

        if re.search(r"\d+\.\d", " ".join([p["name"], p["title"], p["meta"], synlig])):
            fal(k, "decimalpunkt i stället för decimalkomma")
        if re.search(r"\d,\s*\d+\s+och\s+\d+\s*(cm|kg|°)", synlig):
            fal(k, "kommalista av tal med enheten sist — använd snedstreck")

    return FEL


if __name__ == "__main__":
    fel = kor()
    for f in fel:
        print("FEL  " + f)
    print("\n%d fel i %d produkter" % (len(fel), len(PRODUKTER)))
    sys.exit(1 if fel else 0)
