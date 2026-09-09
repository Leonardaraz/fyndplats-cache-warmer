# -*- coding: utf-8 -*-
"""Runda 111 — grinden. Sju sidor, sex konstruktioner, tolv självtestfall.

☠️ TRE LÖFTESGRINDAR ÄRVS ORDAGRANT från runda 108/110 (barriär, mörkläggning,
   utomhus) tillsammans med det AVGRÄNSADE nekningsfönstret — högst tre ord
   bakåt och aldrig över en satsgräns. Kopian är medveten: rundans grindfiler
   är per runda med flit, och mönstren har passerat fjorton publicerade sidor.

☠️ FYRA GRINDAR ÄR RUNDANS EGNA, och alla fyra har en KÄLLA i leverantörens
   text som de finns för att hindra oss att upprepa:

   LJUDLOFTE   `99040238`: "reduziert störendes Licht und Lärm"
   VADERLOFTE  `79b349f7`: "Der wetterfester Outdoor Paravent" — medan dess
               EGEN spectabell säger "Nur für den Innenbereich geeignet"
   BROMSLOFTE  tolv hjul syns; att de går att LÅSA står ingenstans
   HYLLAST     `db70e38c`: 5 kg per hylla. Nämns hyllorna utan lasten är det
               en säkerhetsuppgift som tappats bort

☠️ MATERIALGRINDEN ÄR PER PRODUKT, inte per grupp. Rundan har sex material
   och FEM sidor på 160 × 170 cm i familjen — ett delat materialord hade
   fällt fem korrekta sidor och släppt igenom fel material på två.
"""
import os, re, sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
import grindar as G                                            # noqa: E402
sys.path.insert(0, HAR)
import matt                                                    # noqa: E402
import texter as T                                             # noqa: E402

# ── Ärvda löftesgrindar (runda 108, oförändrade) ─────────────────────────────
BARRIAR = re.compile(
    r"(stänger?\s+(inne|ute)\s+(barn|djur|husdjur)"
    r"|håller?\s+(barn|djur|husdjur)\s+(borta|inne|ute)"
    r"|fungerar\s+som\s+(en\s+)?(barriär|grind|skydd)"
    r"|barnsäker|djursäker)", re.I)
MORKLAGG_ORD = re.compile(r"(mörklägg\w*|ogenomskinlig\w*|helt\s+tät\w*)", re.I)
MORKLAGG_FRAS = re.compile(
    r"(blockerar\s+(ljus|solljus)"
    r"|släpper\s+inte\s+igenom\s+(något\s+)?ljus)", re.I)
# ☠️ NEKANDET EFTER ORDET MÄTTES BARA PÅ GRANNORDET, och det räckte inte för
#    den här rundan. Två korrekta meningar föll:
#
#      "…men mörklägger ingenting."       ← 'ingenting' saknades i ordlistan
#      "Den mörklägger ändå inte ett rum" ← 'ändå' står emellan
#
#    Fönstret efter är därför symmetriskt med fönstret före: högst tre ord
#    fram, och aldrig över en satsgräns. Ett 'inte' i NÄSTA mening negerar
#    lika lite som ett i föregående. Båda riktningarna har egna självtestfall,
#    så uppmjukningen inte kan glida vidare till en meningsvid vakt.
NEKANDE_EFTER = {"inte", "aldrig", "ingenting", "inget", "ingen", "inga"}
NEKANDE_FORE = {"dålig", "dåligt", "dåliga", "ingen", "inget", "inga", "utan",
                "inte", "aldrig"}
SATSGRANS = re.compile(r"[.!?:;]")
NEKFONSTER = 3


def _nekat_fore(txt, start):
    granser = [m.end() for m in SATSGRANS.finditer(txt[:start])]
    sats = txt[granser[-1]:start] if granser else txt[:start]
    ord_ = re.findall(r"[\wåäöÅÄÖ]+", sats)[-NEKFONSTER:]
    return any(o.lower() in NEKANDE_FORE for o in ord_)


def _nekat_efter(txt, slut):
    m = SATSGRANS.search(txt[slut:])
    sats = txt[slut:slut + m.start()] if m else txt[slut:]
    ord_ = re.findall(r"[\wåäöÅÄÖ]+", sats)[:NEKFONSTER]
    return any(o.lower() in NEKANDE_EFTER for o in ord_)


def morklaggningslofte(txt):
    for m in MORKLAGG_FRAS.finditer(txt):
        return m
    for m in MORKLAGG_ORD.finditer(txt):
        if _nekat_fore(txt, m.start()) or _nekat_efter(txt, m.end()):
            continue
        return m
    return None


UTOMHUSLOFTE = re.compile(
    r"(väderbeständig\w*|tål\s+(regn|väder|sol)|för\s+utomhusbruk"
    r"|kan\s+stå\s+ute\b|utomhusskärm)", re.I)
LJUDLOFTE = re.compile(
    r"(dämpar\s+(ljud|buller|oljud)|ljudd(ämpande|ämpning)|bullerd\w+"
    r"|minskar\s+(ljud|buller|oljud)|stänger\s+ute\s+(ljud|buller))", re.I)

# ── Rundans egna ─────────────────────────────────────────────────────────────
# ☠️ VÄDERLÖFTET är INTE samma sak som utomhuslöftet. Leverantören kallar
#    duken "spritzwasserfest"; det är en egenskap hos TYGET. Att skärmen
#    skulle tåla väder är ett annat påstående, och det är det som förbjuds.
VADERLOFTE = re.compile(
    r"(väderbeständig\w*|vädertålig\w*|tål\s+(väder|väta|regn|snö)"
    r"|regntät\w*|klarar\s+(regn|väder|snö))", re.I)

# ☠️ BROMSLÖFTET. Tolv hjul syns på bilden, låsning gör det inte.
BROMSLOFTE = re.compile(
    r"(låsbar\w*\s+hjul|hjul\w*\s+(går|kan)\s+att\s+lås|bromsa\w*\s+hjul"
    r"|hjul\s+med\s+broms|hjullås)", re.I)

# Materialordet varje sida MÅSTE bära, och de ord den inte får bära.
MATERIALORD = {
    "e858810e": ["furu", "tyg"],
    "f641d190": ["furu", "tyg"],
    "1c1eb875": ["furu", "fiberduk"],
    "23d20823": ["pappersrep", "furu"],
    "db70e38c": ["pappersfiber", "bambu"],
    "79b349f7": ["polyester", "stål"],
    "99040238": ["polyester", "metall"],
}
# ☠️ TVÅ AV SJU ÄR HELT UTAN TRÄ. En sida som säger "träet" om en stålstomme
#    är runda 110:s fel en gång till, bara med annat material.
FORBJUDET_ORD = {
    "79b349f7": re.compile(r"\b(trä|träet|furu|bambu|tall)\b", re.I),
    "99040238": re.compile(r"\b(trä|träet|furu|bambu|tall)\b", re.I),
}

HJUL_SIDA = "79b349f7"
HYLL_SIDA = "db70e38c"
HYLLORD = re.compile(r"\bhyll(a|an|or|orna|plan|planen)\b", re.I)
HYLLAST = re.compile(r"5\s*kg", re.I)

MENING = re.compile(r"[^.!?]+[.!?]")


def upprepade_meningar(txt):
    """Två IDENTISKA meningar på samma sida. Runda 110:s fel nr 1."""
    sedda, ut = set(), []
    for m in MENING.finditer(txt):
        s = " ".join(m.group(0).split()).strip().lower()
        if len(s) < 25:
            continue
        if s in sedda:
            ut.append(s)
        sedda.add(s)
    return ut


SPECRAD = re.compile(r"<li><strong>([^<]+):</strong>\s*([^<]*)</li>")


def specfel(html):
    """☠️ Ett spec-VÄRDE får inte bära en annan spec-RADS etikett.
    Runda 110: `Material: flätad bambu, gångjärn i metall` bredvid
    `Gångjärn: metall` — sant, men samma uppgift på två rader."""
    rader = SPECRAD.findall(html)
    etiketter = {e.strip().lower() for e, _ in rader}
    ut = []
    for etikett, varde in rader:
        for annan in etiketter:
            if annan == etikett.strip().lower() or len(annan) < 5:
                continue
            if re.search(r"\b" + re.escape(annan) + r"\b", varde, re.I):
                ut.append(f"{etikett}: värdet bär raden {annan!r}s etikett")
    return ut


def granska(nyckel, d):
    fel = []
    html, namn, titel, meta = d["html"], d["namn"], d["titel"], d["meta"]
    txt = G.synlig_meningstext(html)
    allt = " ".join([namn, titel, meta, txt])
    v = matt.RUNDAN[nyckel]

    # ☠️ SYSKONRADEN BESKRIVER ANDRA PRODUKTER, och exklusivitetsgrindarna
    #    ("bara hjulsidan får nämna hjul") läste den och fällde en KORREKT
    #    sida: 99040238:s länkrad säger "samma slags tygskärm med fem paneler,
    #    på hjul" — sant, och om grannprodukten. Samma klass som runda 107:s
    #    "liknande produkter"-rad i live-grinden: en grind som läser hela sidan
    #    dömer en annan varas riktiga beskrivning.
    #
    #    Raden stryks därför FÖRE de grindarna — och strykningen har en egen
    #    kontrollmätning, för en strykning som åt hela sidan hade gjort
    #    "noll fel" meningslöst.
    egen_txt = txt.replace(G.synlig_meningstext(T.lankrad(nyckel)), "")
    if len(egen_txt) < len(txt) - 300 or str(matt.RUNDAN[nyckel][2]) not in egen_txt:
        fel.append("KONTROLLMÄTNINGEN FALLER — strykningen av syskonraden åt för mycket")

    fel += G.granska_namn(namn)
    if len(namn) > 80:
        fel.append(f"namnet är {len(namn)} tecken (max 80)")
    if len(titel) > 60:
        fel.append(f"titeln är {len(titel)} tecken (max 60)")
    if titel == namn:
        fel.append("titeln är IDENTISK med namnet — storefronten lägger på suffixet")
    if len(meta) > 155:
        fel.append(f"metan är {len(meta)} tecken (max 155)")
    if G.ARTNR.search(allt):
        fel.append(f"artikelnummer: {G.ARTNR.search(allt).group(0)}")

    # Löften
    for etikett, sok in (("BARRIÄRLÖFTE", BARRIAR.search),
                         ("MÖRKLÄGGNINGSLÖFTE", morklaggningslofte),
                         ("UTOMHUSLÖFTE", UTOMHUSLOFTE.search),
                         ("LJUDLÖFTE", LJUDLOFTE.search),
                         ("VÄDERLÖFTE", VADERLOFTE.search),
                         ("BROMSLÖFTE", BROMSLOFTE.search)):
        m = sok(allt)
        if m:
            fel.append(f"{etikett}: {m.group(0)!r}")

    # Material
    for ord_ in MATERIALORD[nyckel]:
        if ord_ not in allt.lower():
            fel.append(f"nämner inte sitt material {ord_!r}")
    if nyckel in FORBJUDET_ORD:
        m = FORBJUDET_ORD[nyckel].search(txt)
        if m:
            fel.append(f"TRÄORD på en produkt utan trä: {m.group(0)!r}")

    # Hyllasten får aldrig tappas bort där hyllorna nämns
    if HYLLORD.search(egen_txt):
        if nyckel != HYLL_SIDA:
            fel.append("nämner hyllor men är inte hyllsidan")
        elif not HYLLAST.search(egen_txt):
            fel.append("nämner hyllorna men inte maxlasten 5 kg")

    # Hjulen hör till EN produkt
    if re.search(r"\bhjul\w*\b", egen_txt, re.I) and nyckel != HJUL_SIDA:
        fel.append("nämner hjul men är inte hjulsidan")

    # Upprepningar och spec-tabellen
    for s in upprepade_meningar(txt):
        fel.append(f"upprepad mening: {s[:60]!r}")
    fel += specfel(html)

    # Talen ska gå att peka på i matt.py
    for tal_, vad in ((v[2], "bredd"), (v[4], "höjd"), (v[0], "paneler"),
                      (v[1], "panelbredd")):
        if str(tal_) not in allt:
            fel.append(f"{vad} {tal_} saknas i texten")

    # Monteringsbeskedet ska matcha matt.MONTERING
    monteras = matt.MONTERING[nyckel]
    sager_montering = bool(re.search(r"skruvas ihop", txt, re.I))
    sager_fardig = bool(re.search(r"färdigmonterad|levereras färdig", txt, re.I))
    if monteras and not sager_montering:
        fel.append("monteras enligt matt.py men texten säger inte det")
    if (not monteras) and not sager_fardig:
        fel.append("levereras färdig enligt matt.py men texten säger inte det")
    if monteras and sager_fardig:
        fel.append("säger BÅDE monteras och färdigmonterad")

    # Syskonlänkarna måste peka på en slug som finns
    for mal, _ in T.SYSKON[nyckel]:
        slug = T.SLUG.get(mal, mal)
        if slug not in T.SLUG.values() and slug not in T.PUBLICERADE:
            fel.append(f"syskonlänk till okänd slug {slug!r}")
    return fel


# ── Självtest ────────────────────────────────────────────────────────────────
FALL = [
    # (etikett, text, ska_fällas, vilken grind)
    ("barriär", "Den stänger inne barn på ett tryggt sätt.", True, BARRIAR.search),
    ("barriär ok", "Den är en avskärmning, inte en barriär.", False, BARRIAR.search),
    ("mörkläggning", "Duken mörklägger rummet helt.", True, morklaggningslofte),
    ("mörkläggning nekad intill", "Den mörklägger inte ett rum.", False, morklaggningslofte),
    # ☠️ Nekandet TRE ord bort, i samma sats — ska släppas igenom.
    ("mörkläggning nekad tre ord bort", "Den räcker inte för att mörklägga.",
     False, morklaggningslofte),
    # ☠️ Och nekandet i FÖREGÅENDE mening negerar ingenting.
    ("nekande i annan mening", "Den är inte tung. Duken mörklägger rummet.",
     True, morklaggningslofte),
    # ☠️ De två fallen som fällde KORREKTA sidor i runda 111.
    ("mörkläggning nekad med ingenting", "Den skymmer insyn men mörklägger ingenting.",
     False, morklaggningslofte),
    ("mörkläggning nekad över ett mellanord", "Den mörklägger ändå inte ett rum.",
     False, morklaggningslofte),
    # …och motproven: nekandet får inte hämtas från nästa mening eller långt bort.
    ("nekande i nästa mening", "Duken mörklägger rummet. Den är inte tung.",
     True, morklaggningslofte),
    ("nekande fyra ord bort efter", "Den mörklägger ett helt stort rum inte alls.",
     True, morklaggningslofte),
    ("utomhus", "Skärmen tål regn och kan stå ute.", True, UTOMHUSLOFTE.search),
    ("ljud", "Skärmen dämpar ljud från rummet bredvid.", True, LJUDLOFTE.search),
    ("väder", "Duken är vädertålig.", True, VADERLOFTE.search),
    ("väder ok", "Duken är stänkskyddad.", False, VADERLOFTE.search),
    ("broms", "Hjulen är låsbara hjul.", True, BROMSLOFTE.search),
    ("broms ok", "Skärmen rullar lätt på sina tolv hjul.", False, BROMSLOFTE.search),
]

if __name__ == "__main__":
    sjfel = 0
    for etikett, txt, ska, sok in FALL:
        blev = bool(sok(txt))
        if blev != ska:
            sjfel += 1
            print(f"✗ SJÄLVTEST {etikett}: väntade {ska}, fick {blev}")
    print(f"självtest: {len(FALL)} fall, {sjfel} fel")

    totalt = sjfel
    for k in matt.RUNDAN:
        fel = granska(k, T.PRODUKTER[k])
        totalt += len(fel)
        print(f"{'OK ' if not fel else 'FEL'} {k}  {matt.GRUPPER[k]}")
        for f in fel:
            print("      ✗", f)

    # ── Korsproduktkontroller ────────────────────────────────────────────────
    for falt in ("namn", "slug", "titel", "meta"):
        sedda = {}
        for k in matt.RUNDAN:
            v = T.PRODUKTER[k][falt]
            if v in sedda:
                totalt += 1
                print(f"✗ KROCK {falt}: {k} och {sedda[v]} delar {v!r}")
            sedda[v] = k

    # ☠️ SKU:n byggs ur sluggen och kapas vid 24 tecken på ordgräns. Två sidor
    #    vars slug delar de första 24 tecknen får SAMMA SKU — och det är exakt
    #    krocken importen redan skapat en gång: e858810e och f641d190 bär båda
    #    `FP-faltbarer-raumtrenner` i Wix just nu.
    def sku(slug):
        del_ = []
        for bit in slug.split("-"):
            provisorisk = "-".join(del_ + [bit])
            if len(provisorisk) > 24:
                break
            del_.append(bit)
        return "FP-" + "-".join(del_)

    sedda = {}
    for k in matt.RUNDAN:
        s = sku(T.PRODUKTER[k]["slug"])
        if s in sedda:
            totalt += 1
            print(f"✗ SKU-KROCK: {k} och {sedda[s]} ger båda {s}")
        sedda[s] = k
    print("\nSKU:er:")
    for k in matt.RUNDAN:
        print(f"  {k}  {sku(T.PRODUKTER[k]['slug'])}")
    print(f"\n{len(matt.RUNDAN)} sidor, {totalt} fel totalt")
    sys.exit(1 if totalt else 0)
