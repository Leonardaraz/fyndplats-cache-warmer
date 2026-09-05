# -*- coding: utf-8 -*-
"""Runda 63 — grindar. Körs på texterna INNAN något skrivs till Wix.

☠️ Ordlistan får bara innehålla ord som är främmande i SVENSKAN. Runda 61 fällde
fyra korrekta texter på "Kalkfilter", som är tyskt OCH svenskt. Pröva varje nytt
ord mot svenskan innan du lägger in det. Här gäller det särskilt "Rattan": det
tyska ordet ÄR nästan det svenska ("rotting"), så grinden letar efter det
SVENSKA ordet på fel produkt i stället — se grind 5.
"""
import re
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
import texter  # noqa: E402

# ---------------------------------------------------------------- fakta ---
# Vilka som är PLAST och vilka som är äkta naturgräs. Uppmätt ur Technische
# Daten, se LAGE.md Steg 5 punkt 1. Grind 5 vilar på den här tabellen.
KONSTMATERIAL = {"b3672df6", "ad90a1cc", "f6e3098e", "165471af", "1ed0d9cb"}
NATURGRAS = {"e16338a9", "73cb432c"}
VARKEN = {"d82950a3"}                       # MDF, plysch, furuben

# Vem som får påstå vad om tvätt. Två av åtta har uttryckligen INTE tvättbar
# kudde ("Dickes Kissen … (nicht waschbar)").
EJ_TVATTBAR = {"165471af", "1ed0d9cb"}
# Leverantören säger varken ja eller nej. Då gör inte vi det heller.
TVATT_OKAND = {"f6e3098e"}

# Monteras eller inte, ur Lieferumfang/Beschreibung.
MONTERAS = {"e16338a9", "73cb432c", "d82950a3"}

# Lasttal som FÅR stå, per produkt. Tom mängd = inget lasttal alls (f6e3098e,
# vars källa motsäger sig själv).
LAST = {
    "b3672df6": {"10 kg"},
    "ad90a1cc": {"4 kg"},
    "f6e3098e": set(),
    "165471af": {"5 kg"},
    "1ed0d9cb": {"10 kg"},
    "e16338a9": {"16 kg"},
    "73cb432c": {"80 kg", "5 kg"},
    "d82950a3": {"30 kg", "15 kg", "5 kg"},
}

# --------------------------------------------------------------- ordlistor ---
FRAMMANDE = [
    "Katzenh", "Katzenbett", "Katzenkorb", "Katzenhaus", "Katzenzelt",
    "Kuschel", "Rückzugsort", "Wasserhyazinthen", "Wasserhyazinthengras",
    "Kissen", "Liegefl", "Gesamtabmessungen", "Gesamtma", "Innenma",
    "Belastbarkeit", "Lieferumfang", "Beschreibung", "Technische",
    "Nettogewicht", "Stubentiger", "Samtpfote", "Wohnkultur", "Holzbeine",
    "Spanplatte", "Paulownia Holz", "Metalldraht", "Türöffnung", "Turoffnung",
    "waschbar", "abnehmbar", "geeignet", "stilvoll", "gemütlich",
    # engelska
    "cat cave", "pet bed", "rattan basket", "washable", "indoor",
]

MEDICINSKT = [
    "lindr", "botar", "smärt", "läker", "terapeutisk", "medicinsk",
    "stressen försvinner", "botemedel", "helar",
]

SUPERLATIV = [
    "bäst i test", "marknadens bästa", "överlägsen", "perfekt för alla",
    "unik", "revolutionerande", "oslagbar", "världens", "alla katter älskar",
]

HUSMARKEN = ["HOMCOM", "Outsunny", "PawHut", "Aiyaplay", "Vinsetto", "Aosom",
             "Kleankin", "ZoneKiz"]

LANDER = ["Tyskland", "Kina", "Polen", "Spanien", "Nederländerna",
          "tyska lager", "tyskt lager", "EU-lager"]


def synlig_text(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()


# ☠️ TVÅ SORTERS MENINGAR SOM GRINDARNA MÅSTE SKILJA PÅ.
#
# 1. En FAQ-FRÅGA bär ordet men inte påståendet. "Går kudden att tvätta?" följt
#    av "Nej." är motsatsen till ett tvättbarhetslöfte — men frågan ensam ser
#    ut som ett. Grinden läser därför frågan TILLSAMMANS med sitt svar.
# 2. En KORSHÄNVISNING beskriver en ANNAN produkt. "…finns en sittpuff som bär
#    80 kg" är sant, men inte om den här sidan. Ett block med en länk lyfts
#    därför ut ur produktens egna grindar och prövas mot den LÄNKADE produkten.

KORS_RE = re.compile(r'href="https://www\.fyndplats\.se/produkt/([^"]+)"')
ANKARE_RE = re.compile(
    r'<a href="https://www\.fyndplats\.se/produkt/([^"]+)"[^>]*>(.*?)</a>', re.S)


def dela(html):
    """(hel text i dokumentordning, [(slug, mening), …]).

    ☠️ ENHETEN ÄR MENINGEN, INTE BLOCKET — två utkast fick det fel, åt varsitt
    håll:

      1. Första utkastet LYFTE BORT hela blocket. Då tappade FAQ-frågan sitt
         svar: `Går det att sitta på den?` stod kvar medan `Nej.` försvann,
         och grinden läste frågan som ett påstående.
      2. Andra utkastet märkte hela blocket som korshänvisning. Men ett block
         bär ofta BÅDA sorterna: `Nej. Ovansidan bär 30 kg … Vill du ha en
         möbel att sitta på finns en sittpuff som bär 80 kg.` Då blev det egna
         talet (30 kg) oprövat och det lånade (80 kg) prövat mot fel produkt.

    Länken markeras därför med en platshållare FÖRE taggarna strippas, och
    meningen som bär markören är korshänvisningen. Resten av blocket är eget."""
    # ☠️ Markören måste ligga i den SYNLIGA texten, inte i attributet.
    #    Ett utkast satte den i href:en — och synlig_text() strippar hela
    #    taggen, så markören var borta innan meningarna delades. Grinden
    #    hittade då noll korshänvisningar och fällde fyra korrekta meningar.
    markerad = ANKARE_RE.sub(
        lambda m: "\x00%s\x00 %s" % (m.group(1), m.group(2)), html)
    text = synlig_text(markerad)
    hel, kors = [], []
    for mening in re.findall(r"[^.!?]*[.!?]", text) or [text]:
        rent = mening.replace("\x00", " ")
        m = re.search(r"\x00([^\x00]+)\x00", mening)
        if m:
            kors.append((m.group(1), synlig_text(rent)))
        hel.append(rent)
    return synlig_text(" ".join(hel)), kors


def meningar(s):
    """Ger (mening, mening + nästa mening). Andra elementet är kontexten en
    fråga behöver för att dess svar ska kunna läsas."""
    delar = re.findall(r"[^.!?]*[.!?]", s)
    for i, m in enumerate(delar):
        yield m, m + (delar[i + 1] if i + 1 < len(delar) else "")


def granska(p):
    """Returnerar en lista med fel för EN produkt. Tom lista = godkänd."""
    fel = []
    k = p["kort"]
    html = texter.bygg(p)
    s = synlig_text(html)
    egen, kors = dela(html)
    korstext = " ".join(t for _, t in kors)

    def om_syskon(mening):
        """Sant om MENINGEN är en korshänvisning — den beskriver då en ANNAN
        produkt och prövas mot den i korsgrind(), inte mot den här."""
        return bool(mening.strip()) and mening.strip() in korstext

    # `allt` = allt som når kunden. `eget` = detsamma minus de meningar som
    # handlar om syskonen.
    allt = " ".join([p["name"], p["title"], p["meta"], s])
    eget = " ".join([p["name"], p["title"], p["meta"]]
                    + [m for m in re.findall(r"[^.!?]*[.!?]", egen)
                       if not om_syskon(m)])

    # 1 — främmande ord
    for o in FRAMMANDE:
        if re.search(re.escape(o), allt, re.I):
            fel.append("%s: främmande ord '%s'" % (k, o))

    # 2 — medicinska påståenden och superlativ
    for m in MEDICINSKT:
        if re.search(re.escape(m), allt, re.I):
            fel.append("%s: medicinskt påstående '%s'" % (k, m))
    for sup in SUPERLATIV:
        if re.search(re.escape(sup), allt, re.I):
            fel.append("%s: ogrundat superlativ '%s'" % (k, sup))

    # 3 — husmärken och länder
    for h in HUSMARKEN:
        if re.search(r"\b%s\b" % re.escape(h), allt, re.I):
            fel.append("%s: husmärke '%s'" % (k, h))
    for l in LANDER:
        # ☠️ ORDGRÄNS. Utan den matchar "Polen" inuti "kupolen" — samma fälla
        #    som runda 61:s "Kalkfilter", och den fällde en korrekt text här.
        if re.search(r"\b%s\b" % re.escape(l), allt, re.I):
            fel.append("%s: land utskrivet '%s'" % (k, l))

    # 4 ☠️ — artikelnumret får aldrig nå kunden
    if re.search(r"\b\d{3}-\d{3}[A-Z0-9]{0,8}\b", allt):
        fel.append("%s: artikelnummer i texten" % k)
    for e in ["Artikelnummer", "Modellreferens", "Artikelnr", "Referens:"]:
        if e in allt:
            fel.append("%s: spec-etiketten '%s' får inte finnas" % (k, e))

    # 5 ☠☠ — MATERIALGRINDEN. Fem av åtta är PE- eller PVC-plast och får inte
    #        kallas rotting; två är äkta vattenhyacint och SKA säga det.
    #        Ordet "konstrotting" innehåller "rotting", så testet måste läsa
    #        ordet med gräns framför — annars godkänns varje "konstrotting".
    # ☠️ "konstrotting" INNEHÅLLER "rotting", så gränsen måste vara framför
    #    ordet — annars godkänner grinden varje förekomst. Och LIKNELSEN
    #    "ser ut som rotting" är motsatsen till ett materialpåstående: den
    #    säger uttryckligen att det inte ÄR rotting. Den ena undantagsfrasen
    #    är exakt, så en påståendeform ("är som rotting") släpps inte igenom.
    ROTTING_ENSAMT = re.compile(r"(?<!konst)(?<!konst-)\brotting", re.I)
    utan_liknelse = allt.replace("ser ut som rotting", "ser ut som DET")
    eget_utan_liknelse = eget.replace("ser ut som rotting", "ser ut som DET")
    if k in KONSTMATERIAL:
        for mening, med_svar in meningar(eget_utan_liknelse):
            if not ROTTING_ENSAMT.search(mening):
                continue
            # "Är det äkta rotting?" följt av "Nej, …" är ett FÖRNEKANDE.
            if re.search(r"\bNej\b|\binte\b", med_svar):
                continue
            fel.append("%s: kallar PE/PVC-plast för rotting — '%s'"
                       % (k, mening.strip()[:60]))
        if "konstrotting" not in allt.lower():
            fel.append("%s: säger inte att flätningen är konstrotting" % k)
    if k in NATURGRAS:
        if "vattenhyacint" not in allt.lower():
            fel.append("%s: säger inte vattenhyacint" % k)
        if ROTTING_ENSAMT.search(utan_liknelse):
            fel.append("%s: kallar vattenhyacint för rotting" % k)
    if k in VARKEN:
        if re.search(r"rotting|vattenhyacint", eget_utan_liknelse, re.I):
            fel.append("%s: påstår flätat material som den inte har" % k)
        if "MDF" not in allt:
            fel.append("%s: döljer att stommen är MDF" % k)

    # 6 ☠️ — tvättbarhet: bara den som HAR den får påstå den
    tvatt = re.search(r"tvättbar|tvättas|går i tvättmaskin", s, re.I)
    if k in EJ_TVATTBAR:
        for mening, med_svar in meningar(egen):
            if om_syskon(mening):
                continue
            if not re.search(r"tvätt", mening, re.I):
                continue
            if not re.search(r"\binte\b|\bNej\b", med_svar):
                fel.append("%s: påstår tvättbar kudde — leverantören säger "
                           "uttryckligen motsatsen: '%s'"
                           % (k, mening.strip()[:70]))
    elif k in TVATT_OKAND:
        if tvatt:
            fel.append("%s: påstår något om tvätt — leverantören säger "
                       "ingenting alls om det" % k)
    elif not tvatt:
        fel.append("%s: nämner inte att kudden är tvättbar" % k)

    # 7 ☠️ — monteringen skiljer, och den ska stå rätt
    # ☠️ Frågan "Behöver den monteras?" bär ordet men inte påståendet. Bara
    #    meningar som INTE är frågor räknas som ett påstående om montering.
    pastaenden = " ".join(m for m in re.findall(r"[^.!?]*[.!?]", egen)
                          if not m.strip().endswith("?"))
    monteras_i_text = re.search(r"skruvas ihop|monteras\b(?![^.?!]*\?)|skruvas på|"
                                r"benen skruvas|kommer platt", pastaenden, re.I)
    fardig_i_text = re.search(r"levereras färdig|ingen montering|kommer färdig",
                              pastaenden, re.I)
    if k in MONTERAS:
        if not monteras_i_text:
            fel.append("%s: säger inte att den ska monteras" % k)
        if fardig_i_text:
            fel.append("%s: påstår att den kommer färdig — den monteras" % k)
    else:
        if not fardig_i_text:
            fel.append("%s: säger inte att den kommer färdig" % k)
        if monteras_i_text:
            fel.append("%s: påstår montering på en färdig produkt" % k)

    # 8 ☠️ — LASTTAL: bara leverantörens egna, och inga andra
    for m in re.finditer(r"\b(\d{1,3}(?:,\d)?)\s*kg\b", eget):
        tal = m.group(0).replace(" ", " ")
        tal = re.sub(r"\s+", " ", tal)
        if tal not in LAST[k] and tal not in ("3,5 kg", "4,2 kg", "4,7 kg",
                                              "5,5 kg", "1,5 kg"):
            fel.append("%s: lasttalet '%s' står inte i leverantörens data" % (k, tal))
    for krav in LAST[k]:
        if krav not in allt:
            fel.append("%s: lasttalet '%s' saknas" % (k, krav))
    if k == "f6e3098e":
        for mening, _ in meningar(eget):
            if not re.search(r"maxlast|tål \d|bär \d", mening, re.I):
                continue
            if re.search(r"\bingen\b|\binte\b", mening, re.I):
                continue     # "vi anger ingen maxlast här" är själva poängen
            fel.append("%s: anger ett lasttal trots att källan motsäger sig "
                       "själv — '%s'" % (k, mening.strip()[:60]))

    # 9 ☠️ — utomhusbruk får inte påstås om de flätade i naturgräs
    if k in NATURGRAS:
        for mening, med_svar in meningar(egen):
            if om_syskon(mening):
                continue
            if not re.search(r"\b(utomhus|ute|altan|uterum)\b", mening, re.I):
                continue
            if re.search(r"\binte\b|\bNej\b|\bbehövs\b|\bhör hemma inomhus\b",
                         med_svar, re.I):
                continue
            fel.append("%s: påstår utomhusbruk på flätat naturgräs — '%s'"
                       % (k, mening.strip()[:70]))

    # 10 ☠️ — d82950a3 får INTE säljas som sittplats (30 kg)
    if k == "d82950a3":
        if "<h2>Så mycket tål den</h2>" not in html:
            fel.append("%s: saknar rubriken som bär lastgränsen" % k)
        if "inte</strong> en sittplats" not in html:
            fel.append("%s: förnekar inte uttryckligen att den är en sittplats" % k)
        for mening, med_svar in meningar(egen):
            if om_syskon(mening):
                continue      # "…finns en sittpuff som bär 80 kg" — om syskonet
            if not re.search(r"\bsitta\b", mening, re.I):
                continue
            if re.search(r"\bNej\b|\binte\b", med_svar):
                continue
            fel.append("%s: säljer fotpallen som sittplats — '%s'"
                       % (k, mening.strip()[:70]))
    if k == "73cb432c" and "<h2>Så mycket tål den</h2>" not in html:
        fel.append("%s: saknar rubriken som bär lastgränsen" % k)

    # 11 ☠️ — måtten ska stå, och i rätt form
    if re.search(r"\d+\.\d", s):
        fel.append("%s: decimalpunkt i stället för komma" % k)
    if re.search(r"\d+\s*x\s*\d+", s):
        fel.append("%s: 'x' i stället för '×' mellan mått" % k)

    # 12 ☠️ — korshänvisningen måste vara ABSOLUT
    for a in re.finditer(r'href="([^"]+)"', html):
        if not a.group(1).startswith("https://www.fyndplats.se/"):
            fel.append("%s: relativ länk '%s'" % (k, a.group(1)))

    # 13 — struktur
    if "<br" in html:
        fel.append("%s: <br> i beskrivningen — Wix strippar den" % k)
    for rubrik in ("Tekniska specifikationer", "Användning och skötsel",
                   "Vanliga frågor"):
        if "<h2>%s</h2>" % rubrik not in html:
            fel.append("%s: saknar rubriken %r" % (k, rubrik))

    # 14 — sökordet i namn, slug OCH titel
    w = p["sokord"]
    ascii_w = w.replace("ä", "a").replace("å", "a").replace("ö", "o")
    if w.lower() not in p["name"].lower():
        fel.append("%s: sökordet '%s' saknas i namnet" % (k, w))
    if ascii_w.lower() not in p["slug"]:
        fel.append("%s: sökordet '%s' saknas i sluggen" % (k, w))
    if w.lower() not in p["title"].lower():
        fel.append("%s: sökordet '%s' saknas i titeln" % (k, w))

    # 15 ☠️ — titeln får ALDRIG vara identisk med namnet
    if p["title"].strip() == p["name"].strip():
        fel.append("%s: titeln är identisk med namnet — mallen slår till" % k)

    # 16 — hårda Wix-gränser
    if len(p["name"]) > 80:
        fel.append("%s: namnet är %d tecken (max 80)" % (k, len(p["name"])))
    if len(p["title"]) > 60:
        fel.append("%s: titeln är %d tecken (max 60)" % (k, len(p["title"])))
    if len(p["meta"]) > 160:
        fel.append("%s: metan är %d tecken" % (k, len(p["meta"])))
    if len(p["sku"]) > 40:
        fel.append("%s: SKU:n är %d tecken (max 40)" % (k, len(p["sku"])))

    return fel


def korsgrind(produkter):
    """☠️ EN KORSHÄNVISNING ÄR ETT PÅSTÅENDE OM EN ANNAN PRODUKT.

    Produktens egna grindar hoppar över de meningarna — annars fäller de på
    sanna uppgifter om syskonet. Men då står de oprövade, och en sida som
    säger `…en sittpuff som bär 80 kg` när syskonet bär 30 är precis lika fel
    som ett eget felaktigt tal. Skillnaden är bara VILKEN produkts fakta som
    är facit. Grinden byter alltså facit i stället för att sluta läsa."""
    fel = []
    per_slug = {p["slug"]: p for p in produkter}
    for p in produkter:
        _, kors = dela(texter.bygg(p))
        for slug, text in kors:
            q = per_slug.get(slug)
            if q is None:
                continue                      # fångas av batchgrindarna
            qk = q["kort"]
            for m in re.finditer(r"\b\d{1,3}(?:,\d)?\s*kg\b", text):
                tal = re.sub(r"\s+", " ", m.group(0))
                if tal not in LAST[qk]:
                    fel.append("KORS: %s påstår '%s' om %s (%s) — det talet "
                               "står inte i den produktens data"
                               % (p["kort"], tal, slug, qk))
            if re.search(r"vattenhyacint", text, re.I) and qk not in NATURGRAS:
                fel.append("KORS: %s kallar %s vattenhyacint — den är det inte"
                           % (p["kort"], slug))
            if re.search(r"konstrotting", text, re.I) and qk not in KONSTMATERIAL:
                fel.append("KORS: %s kallar %s konstrotting — den är det inte"
                           % (p["kort"], slug))
            if re.search(r"(?<!konst)\brotting", text, re.I) \
                    and "ser ut som rotting" not in text:
                fel.append("KORS: %s kallar %s rotting rakt av" % (p["kort"], slug))
    return fel


def batchgrindar(produkter):
    """Fel som bara syns när hela batchen granskas tillsammans."""
    fel = []
    for falt in ("slug", "name", "title", "sokord", "sku"):
        sett = {}
        for p in produkter:
            v = p[falt].lower()
            if v in sett:
                fel.append("BATCH: %s krockar mellan %s och %s ('%s')"
                           % (falt, sett[v], p["kort"], p[falt]))
            sett[v] = p["kort"]
    # ☠️ Varje korshänvisning måste peka på en slug som FINNS i batchen eller
    #    i katalogen. En länk till en sida som inte publiceras är en död länk.
    slugs = {p["slug"] for p in produkter}
    for p in produkter:
        for a in re.finditer(r'href="https://www\.fyndplats\.se/produkt/([^"]+)"',
                             texter.bygg(p)):
            if a.group(1) not in slugs:
                fel.append("BATCH: %s länkar till '%s' som inte finns i batchen"
                           % (p["kort"], a.group(1)))
    return fel


def main():
    alla = []
    for p in texter.PRODUKTER:
        alla += granska(p)
    alla += batchgrindar(texter.PRODUKTER)
    alla += korsgrind(texter.PRODUKTER)
    if alla:
        for f in alla:
            print("FEL  " + f)
        print("\n%d fel — INGENTING skrivs." % len(alla))
        return 1
    print("Alla %d produkter passerar 17 grindar." % len(texter.PRODUKTER))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
