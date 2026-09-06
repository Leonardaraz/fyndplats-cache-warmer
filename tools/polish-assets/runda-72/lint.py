# -*- coding: utf-8 -*-
"""Grindar för runda 72. Körs mot texter.py INNAN något skrivs till Wix.

De REGLER som gäller varje runda importeras från ../grindar.py — de får inte
finnas i en kopia här. Det som står i den här filen är rundans egna FAKTA.

☠️ NYTT I DEN HÄR RUNDAN: `EXTERN` bär facit för en publicerad sida som är
   FÄRGSYSKON till tre av batchens produkter (samma artikelnummerbas 839-423).
   Korshänvisningen "finns i fler färger" pekar dit, och den är ett påstående
   om MÅLET — alltså måste målets last, gradtal och färg granskas som om det
   vore batchens egna.

⚠️ Grinden vet INTE att syskonets basbeskrivning är fel (uppgift #298). Den
   kontrollerar tal, inte formuleringar. Det som fångade felet var ögonen mot
   fotot — och det är varför Steg 5 finns.
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
W = {"64856235", "35872574", "4f6bef7d"}   # GOLVFÅTÖLJ 62×70×95, 120°, 360°
X = {"f192540f"}                            # 75 cm, fotpall 60 kg, 135°
Y = {"78cb09ba"}                            # vippfunktion, fotpall, 132°
Z = {"8f6636e4"}                            # träfot, fotpall två höjder, 135°
AA = {"b8001a1b"}                           # nackstöd 10 cm, fotpall, 135°
AE = {"dbbe7253"}                           # liten linnestol, INGEN mekanik

# ☠️ Publicerad sida som batchen länkar till. Facit hämtat ur dess LEVANDE
#    spec-tabell (läst ur Wix 2026-09-06), inte ur minnet. Den bär samma
#    artikelnummerbas som W — 839-423 — alltså samma modell i en fjärde färg.
EXTERN = {
    # ☠️ `kalla` betyder LÄST LIVE UR WIX, inte "jag minns den". KANDA ser
    #    bara rundor med en skrivning.json på disk, och den här sidan är
    #    polerad utanför den konventionen. Att bara ta bort existenskollen
    #    hade lämnat varje EXTERN-slug ogranskad; markören flyttar beviset
    #    till en källa i stället för att avskaffa det.
    "golvfatolj-360-grader-fem-lagen":
        dict(last={"120 kg"}, grad={"120°", "360°"}, farg={"ljusgrå"},
             drag={"360", "fem lägen"}, kalla="wix 2026-09-06"),
}

MAXLAST = {}
for _k in W | X:
    MAXLAST[_k] = {"120 kg"}
for _k in Y | AA | AE:
    MAXLAST[_k] = {"150 kg"}
for _k in Z:
    MAXLAST[_k] = {"130 kg"}
# ☠️ FOTPALLENS last är ett EGET tal och lägre än stolens på tre av fyra.
#    Den måste få passera grinden, annars fälls den mening som finns just för
#    att kunden inte ska sätta sig på pallen.
MAXLAST["f192540f"] |= {"60 kg"}
MAXLAST["8f6636e4"] |= {"80 kg"}
MAXLAST["b8001a1b"] |= {"80 kg"}

GRADER = {}
for _k in W:
    GRADER[_k] = {"120°", "360°"}
GRADER["f192540f"] = {"135°", "360°"}
GRADER["78cb09ba"] = {"132°"}
GRADER["8f6636e4"] = {"135°", "360°"}
GRADER["b8001a1b"] = {"135°", "360°"}
# ☠️ dbbe7253 får INGET gradtal alls. Stolen fälls inte, vrider inte och har
#    ingen vinkel i källan. Samma spärr som runda 70:s familj P och runda
#    68:s familj F — en tom mängd är ett aktivt beslut, inte en glömska.
GRADER["dbbe7253"] = set()

# ☠️ Färgen är AVLÄST UR PIXLARNA, inte ur feedens Farbe-kolumn. `35872574`
#    heter "Blau" och mäter H 193° / S 41 % — cyan, inte blått. `78cb09ba`
#    heter "Grau" och ligger på 20 % i mörkaste decilen (svartbandets tak)
#    men 41 % i medianen; ögat och medianen vinner på ett blankt läder.
FARG = {
    "64856235": {"grå"},
    "35872574": {"petrolblå"},
    "4f6bef7d": {"beige"},
    "f192540f": {"svart"},
    "78cb09ba": {"grå"},
    "8f6636e4": {"ljusgrå"},
    "b8001a1b": {"svart"},
    "dbbe7253": {"beige", "svart", "svarta"},   # klädseln respektive benen
}

# ☠️ Färgord som ETT ANNAT syskon i batchen äger ordagrant. Utan den här raden
#    släpper den delade grinden igenom HUVUDET i en sammansättning — "grå" när
#    facit säger "ljusgrå" — och rundans grå blir omöjlig att skilja från dess
#    ljusgrå. Runda 70:s lagning, oförändrad.
RESERVERADE = set()
for _f in FARG.values():
    RESERVERADE |= _f

VIKT = {}
for _k in W:
    VIKT[_k] = "11 kg"
VIKT["f192540f"] = "22 kg"
VIKT["78cb09ba"] = "25 kg"
VIKT["8f6636e4"] = "25 kg"
VIKT["b8001a1b"] = "31,6 kg"
VIKT["dbbe7253"] = "11 kg"

# ☠️ Påståenden som MÅSTE nå kunden, ordagrant.
MASTE_STA = {}
for _k in W:
    MASTE_STA[_k] = ["37 cm", "120 kg", "fem lägen"]
MASTE_STA["f192540f"] = ["135°", "60 kg", "75 cm"]
MASTE_STA["78cb09ba"] = ["132°", "150 kg", "vippfunktion"]
MASTE_STA["8f6636e4"] = ["135°", "80 kg", "36 eller 40 cm"]
MASTE_STA["b8001a1b"] = ["135°", "10 cm", "118 cm", "80 kg"]
MASTE_STA["dbbe7253"] = ["150 kg", "67 × 67 cm", "linne"]

# ☠️ EN KVALIFICERAD FÄRG MÅSTE STÅ ORDAGRANT. Den delade grinden undantar
#    HUVUDET i en sammansättning ("grå" godkänns när facit säger "ljusgrå"),
#    och runda 70 täppte till det bara när ett SYSKON äger huvudordet.
#    "petrolblå" har inget syskon som äger "blå" — alltså hade kvalificeraren
#    kunnat falla bort tyst, och det är precis den skillnad rundans
#    färgmätning slog fast (H 193°, cyan, inte blått).
MASTE_STA["35872574"].append("petrolblå")
MASTE_STA["8f6636e4"].append("ljusgrå")

LUTAR = W | X | Y | Z | AA          # ☠️ AE lutar INTE — den har ingen mekanik
LUT_RE = re.compile(r"fäller ryggen|ryggen fälls|tillbakalutad|ryggvinkel|"
                    r"ryggen låses|ryggen ställs", re.I)

MED_FOTPALL = X | Y | Z | AA        # fyra har en LÖS pall i Lieferumfang
MED_360 = W | X | Z | AA            # ☠️ Y och AE saknar vridfot i källan
MED_VIPP = set(Y)                   # bara Y:s källa säger `Wippfunktion`
MED_TRAFOT = set(Z)                 # ☠️ AE har svarvade BEN, inte en träfot
MED_MASSIVTRA = set(Z)              # källan: "Fußgestelle aus massivem Holz"
MED_NACKSTOD = set(AA)              # bara AA:s nackstöd går att ställa
MED_VAGG60 = set(X)                 # ☠️ tre olika väggavstånd i rundan
MED_VAGG50 = set(Y)
MED_LINNE = set(AE)                 # ☠️ AE är ENDA med äkta linne, inte look

TILLATEN_LADER = re.compile(r"konstläder\w*|läderlook\w*|likna(?:r)? läder", re.I)
TILLATEN_SAMMET = re.compile(r"sammetslook\w*|sammetens\b|sammet av naturfiber",
                             re.I)


def kanda_sluggar():
    """Sluggar tidigare rundor faktiskt skrev. En felstavad länk ska fällas."""
    ut = {}
    for f in sorted(glob.glob(os.path.join(os.path.dirname(HAR),
                                           "runda-*", "skrivning.json"))):
        # ☠️ Hoppa över DEN EGNA rundan. skrivning.py skriver hit, så en
        #    andra körning hade annars fällt varenda slug som "redan skriven
        #    i runda-71" — grinden förgiftar sig själv precis som
        #    byggfiltret i vercel.json gjorde. En grind som lyser rött på
        #    korrekt arbete lär läsaren att sluta läsa den.
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

    # ☠️ Facit för en PUBLICERAD sida är värdelöst om sidan inte finns. Varje
    #    EXTERN-nyckel måste kunna kvitteras mot en tidigare rundas
    #    skrivning.json — annars är korshänvisningen en länk till ingenting,
    #    och grinden hade granskat ett påstående om en sida som aldrig skrevs.
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
        # ☠️ Runda 71 hade ett BLANKETTFÖRBUD mot "massivt trä" — där hade
        #    ingen produkt det. Här har 8f6636e4 det ordagrant i källan
        #    ("Fußgestelle aus massivem Holz"), så förbudet blir en ÄGARGRIND
        #    i stället: rätt produkt får säga det, alla andra fälls. Ett
        #    förbud mot ett sant påstående är lika fel som ett tyst godkänt
        #    falskt.
        for tr, mening in pastaenden(meningstext,
                                     re.compile(r"\bbomull|äkta linne|"
                                                r"äkta sammet|äkta chenille", re.I)):
            fal(k, "naturmaterial påstås: %.70s" % mening)

        # Hälsopåståenden
        if re.search(r"spänningar|värk|smärt|lindrar|botar|läker|terapeut|"
                     r"sömnstörn|insomn|ammande|amning|förebygger|blodcirk",
                     allt):
            fal(k, "hälsopåstående")
        if re.search(r"\bmassage", allt):
            fal(k, "massage påstås — ingen produkt i rundan har det")

        # ☠️ Utrustningsgrinden är KORSHÄNVISNINGSMEDVETEN (runda 67) och
        #    sedan runda 70 också MEDVETEN OM PUBLICERADE MÅL.
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
        for mal_sluggar, mening in kors:
            if not kant_mal(mal_sluggar):
                continue
            if LUT_RE.search(mening) and not har_drag(mal_sluggar, "lut", LUTAR):
                fal(k, "korshänvisningen påstår ryggfällning om %s, som har "
                       "fast rygg" % "/".join(kant_mal(mal_sluggar)))

        utrustningsgrind("fotpall", MED_FOTPALL, "fotpall", "lös fotpall")
        utrustningsgrind("360", MED_360, "360", "360° vridfot")
        utrustningsgrind("vippfunktion", MED_VIPP, "vippfunktion", "vippfunktion")
        utrustningsgrind("träfot", MED_TRAFOT, "träfot", "träfot")
        utrustningsgrind("massiv", MED_MASSIVTRA, "massiv",
                         "massivt trä")
        utrustningsgrind("nackstöd", MED_NACKSTOD, "nackstöd",
                         "justerbart nackstöd")
        # ☠️ Stammen är "N cm fritt", inte bara talet: runda 71 fällde en
        #    korrekt text för att "80 cm" matchade ett RYGGSTÖD som är 80 cm
        #    högt. Talet ensamt är inte påståendet — det är talet plus vad
        #    det mäter.
        utrustningsgrind("60 cm fritt", MED_VAGG60, "60 cm fritt",
                         "60 cm väggavstånd")
        utrustningsgrind("50 cm fritt", MED_VAGG50, "50 cm fritt",
                         "50 cm väggavstånd")
        # ☠️ "linne" utan "look" är ett NATURFIBERPÅSTÅENDE. Sju av åtta har
        #    polyester; bara dbbe7253 har äkta linne enligt källan. Grinden
        #    tittar på ordet linne som INTE följs av "look".
        utrustningsgrind("linne,", MED_LINNE, "linne,", "äkta linne")

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
                # ☠️ Facit finns — men sidan måste också bevisligen finnas.
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
