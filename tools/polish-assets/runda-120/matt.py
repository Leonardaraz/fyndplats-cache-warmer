# -*- coding: utf-8 -*-
"""Runda 120 — de åtta barbordssetens mått, EN källa.

Varje tal här är läst ur leverantörens egen spec-rad. Inget är räknat,
inget är hämtat från ett syskon, och inget är läst ur en måttritning:
ritningen används för att AVGÖRA vid motsägelse, inte för att fylla luckor.

☠️ MAXLASTEN PÅ BORDSSKIVAN ÄR RUNDANS SÄKERHETSSIFFRA. Den spretar 20 → 170 kg
   över åtta visuellt lika bord, och runbookens Steg 2 säger vad som gäller:
   en säkerhetsrelevant begränsning skrivs som ett POSITIVT VILLKOR med egen
   rubrik, aldrig som ett varningsblock. `441d2209` tål 20 kg — två kassar —
   och det är den uppgift kunden märker först av alla.
"""

import re

# Färgsyskon: identiskt chassi, identiska mått, identisk vikt, olika träfärg.
SYSKON = {"c88b5bbb": "63a37524", "63a37524": "c88b5bbb"}

# Tre delar (bord + två sittplatser) respektive fem delar (bord + fyra).
TRE = ["441d2209", "394de213", "f4ed1264", "3b38e191", "51c43e67", "c3bda64a"]
FEM = ["c88b5bbb", "63a37524"]
ALLA = TRE + FEM

# Set där sittplatsen har RYGGSTÖD — de tre får säga det, de andra inte.
MED_RYGG = {"3b38e191", "51c43e67"}
# Set med förvaring inbyggd i bordet.
MED_FORVARING = {"394de213", "c3bda64a"}

# ☠️ VAD MÅTTRITNINGEN FAKTISKT VISAR — läst ur bild 3 på varje produkt.
#
#    Regel 7 nedan ställer två TEXTläsningar mot varandra. Den här är den
#    tredje källan, och den enda som inte är text: ritningen är ortografisk
#    och därför pålitlig på GEOMETRI (runbookens regel 9 — "står etiketten
#    mot ritningen, mät ritningen"). Den fällde `3b38e191`, där spec-raden
#    bar bordets djup i stolens fält.
#
#    ⚠️ BARA GEOMETRI. En LASTSIFFRA i en ritning är text som råkat ritas,
#    och den vinner ingenting över spec-raden — samma gräns runbooken drar.
RITNING = {
    "441d2209": {"bord": "80 × 50 × 87 cm", "sits": "40 × 30 × 57 cm"},
    "394de213": {"bord": "80 × 50 × 90 cm", "sits": "Ø30 × 60 cm"},
    "f4ed1264": {"bord": "100 × 40 × 90 cm", "sits": "41 × 41 × 60 cm"},
    "3b38e191": {"bord": "89 × 45 × 87 cm", "sits": "39 × 43 × 95 cm"},
    "51c43e67": {"bord": "100 × 40 × 90,5 cm", "sits": "41 × 47 × 92 cm"},
    "c3bda64a": {"bord": "100 × 60 × 95 cm", "sits": "32 × 32 × 68 cm"},
    "c88b5bbb": {"bord": "100 × 60 × 88 cm", "sits": "32 × 32 × 57 cm"},
    "63a37524": {"bord": "100 × 60 × 88 cm", "sits": "32 × 32 × 57 cm"},
}

M = {
    "441d2209": dict(
        pris=1139, delar=3, sittplatser=2,
        bord="80 × 50 × 87 cm", bordb=80, bordd=50, bordh=87,
        sits="40 × 30 × 57 cm", sitthojd=57, sitstyp="pall utan ryggstöd",
        bordlast="20 kg", sitslast="120 kg",
        material="spånskiva och stål", yta="melaminyta i grå träoptik",
        farg="grå", farg_lang="grå skiva med svart stålram",
        fotter="justerbara fötter", montering="Setet levereras omonterat med monteringsanvisning.",
        vikt="15,5 kg", paket="93,5 × 58 × 13,5 cm",
        ingar="1 bord, 2 pallar och en monteringsanvisning"),
    "394de213": dict(
        pris=1259, delar=3, sittplatser=2,
        bord="80 × 50 × 90 cm", bordb=80, bordd=50, bordh=90,
        sits="Ø30 × 60 cm", sitthojd=60, sitstyp="rund pall utan ryggstöd",
        bordlast="70 kg", sitslast="100 kg",
        hylla="64 × 34 cm",
        material="MDF och metall", yta="vit ram med skiva i ekoptik",
        farg="vit", farg_lang="vit ram med skiva i ekoptik",
        fotter="fotskydd under benen", montering="Setet levereras omonterat med monteringsanvisning.",
        vikt="15,5 kg", paket="101 × 58 × 17 cm",
        ingar="1 bord, 2 pallar och en monteringsanvisning"),
    "f4ed1264": dict(
        pris=1269, delar=3, sittplatser=2,
        bord="100 × 40 × 90 cm", bordb=100, bordd=40, bordh=90,
        sits="41 × 41 × 60 cm", sitthojd=60, sitstyp="pall utan ryggstöd",
        # ☠️ SITSENS DIAMETER ÄR INTE MÄTT. Ritningen märker ut 41 × 41 som
        #    BENENS fotavtryck vid golvet och lämnar den runda sitsen omärkt;
        #    Steg 1 läste samma 41 som en diameter, Steg 3 skrev Ø30 utan
        #    källa. Tre läsningar, tre olika tal, noll belägg — då är None
        #    det ärliga värdet och texten nämner den inte.
        sitsyta=None,
        bordlast="60 kg", sitslast="120 kg",
        material="stål, spånskiva och MDF", yta="melaminyta i marmoroptik",
        farg="vit", farg_lang="vit marmoroptik med svart stålram",
        fotter="justerbara fötter", montering="Setet levereras omonterat med monteringsanvisning.",
        vikt="17,5 kg", paket="110 × 48 × 13 cm",
        ingar="1 bord, 2 pallar och en monteringsanvisning"),
    "3b38e191": dict(
        pris=1349, delar=3, sittplatser=2,
        bord="89 × 45 × 87 cm", bordb=89, bordd=45, bordh=87,
        # ☠️ RITNINGEN SÄGER 43, SPEC-RADEN SA 45 — och 45 är BORDETS djup på
        #    exakt den här produkten. Samma fingeravtryck som c3bda64a:s vikt:
        #    ett tal som kopierats in från grannfältet. Runbookens regel 9 är
        #    entydig för MÅTT: ritningen är ortografisk och avgör.
        sits="39 × 43 × 95 cm", sitthojd=64, sitstyp="stol med hög rygg",
        sitsyta="39 × 38 cm",
        bordlast="60 kg", sitslast="100 kg",
        material="MDF och metall", yta="pulverlackerat metallrör och slät skiva",
        farg="naturfärgad", farg_lang="naturfärgad skiva med svart metallram",
        fotter="pulverlackerade ben", montering="Setet levereras omonterat med monteringsanvisning.",
        vikt="19,5 kg", paket="111 × 53 × 21 cm",
        ingar="1 bord, 2 stolar och en monteringsanvisning"),
    "51c43e67": dict(
        pris=1369, delar=3, sittplatser=2,
        bord="100 × 40 × 90,5 cm", bordb=100, bordd=40, bordh=90.5,
        sits="41 × 47 × 92 cm", sitthojd=60, sitstyp="stoppad pall med ryggstöd",
        sitsyta="Ø36 cm, 3 cm tjock dyna", rygg="35,5 × 20 cm",
        bordlast="50 kg", sitslast="130 kg",
        material="MDF, stål, PU och skumplast", yta="melaminyta i grå träoptik",
        farg="grå", farg_lang="grå skiva med svart stålram",
        fotter="fotplattor under benen", montering="Setet levereras omonterat med monteringsanvisning.",
        vikt="18,8 kg", paket="110 × 52 × 19 cm",
        ingar="1 bord, 2 pallar och en monteringsanvisning"),
    "c3bda64a": dict(
        pris=1779, delar=3, sittplatser=2,
        bord="100 × 60 × 95 cm", bordb=100, bordd=60, bordh=95,
        sits="32 × 32 × 68 cm", sitthojd=68, sitstyp="pall utan ryggstöd",
        hylla="94,5 × 29 cm, 33,5 och 39,5 cm fri höjd",
        hylla_kort="94,5 × 29 cm",
        bordlast="170 kg", skivlast="130 kg", hyllast="20 kg", sitslast="140 kg",
        golvyta="1,5 × 1,5 m", fotstod="43 cm och 14,5 cm över golvet",
        material="MDF och stål", yta="melaminyta i ekoptik",
        farg="ekfärgad", farg_lang="ekfärgad skiva med svart stålram",
        fotter="justerbara fötter", montering="Setet levereras omonterat med monteringsanvisning.",
        # ☠️ VIKT OCH PAKETMÅTT ÄR OVERIFIERADE — de får inte nå en kundtext.
        #    Steg 1 läste 20 kg ur den här produktens egen rad; Steg 3 skrev
        #    29,4 kg, vilket är EXAKT vikten på bc2157d2 — ett set som inte
        #    ens ligger i batchen. Det är fingeravtrycket av en rad som
        #    kopierats från fel produkt, och de två läsningarna kan inte båda
        #    ha rätt. Wix svarar 403 just nu, så ingen av dem går att
        #    skiljedöma; då är `None` det ärliga värdet. Regel 7 nedan gör det
        #    omöjligt att glömma.
        vikt=None, paket=None,
        ingar="1 bord, 2 pallar och en monteringsanvisning"),
    "c88b5bbb": dict(
        pris=1559, delar=5, sittplatser=4,
        bord="100 × 60 × 88 cm", bordb=100, bordd=60, bordh=88,
        sits="32 × 32 × 57 cm", sitthojd=57, sitstyp="pall utan ryggstöd",
        bordlast="25 kg", sitslast="100 kg",
        # ☠️ SPÅNSKIVA här, MDF på färgsyskonet. Se kontroll() punkt 4.
        material="spånskiva och stål", yta="skiva i ljus ekoptik",
        farg="ekfärgad", farg_lang="ljus ekoptik med svart stålram",
        fotter="justerbara skyddsfötter", montering="Setet levereras omonterat med monteringsanvisning.",
        vikt="26,1 kg", paket="113 × 69 × 17,5 cm",
        ingar="1 bord, 4 pallar och en monteringsanvisning"),
    "63a37524": dict(
        pris=1599, delar=5, sittplatser=4,
        bord="100 × 60 × 88 cm", bordb=100, bordd=60, bordh=88,
        sits="32 × 32 × 57 cm", sitthojd=57, sitstyp="pall utan ryggstöd",
        bordlast="25 kg", sitslast="100 kg",
        material="MDF och stål", yta="skiva i rustik brun träoptik",
        farg="rustikbrun", farg_lang="rustikbrun träoptik med svart stålram",
        fotter="justerbara skyddsfötter", montering="Setet levereras omonterat med monteringsanvisning.",
        vikt="26,1 kg", paket="113 × 69 × 17,5 cm",
        ingar="1 bord, 4 pallar och en monteringsanvisning"),
}

# Tal som får stå i texten utan att komma ur en produktrad ovan.
HARLEDDA = ["1", "2", "3", "4", "5", "60", "100"]

# ☠️ RUBRIKTAL — se runda 119. Ett avrundat tal i namn/titel/slug måste bo här,
#    avrundat NEDÅT och högst 1 ifrån. Runda 120 har inga.
RUBRIKTAL = {}

# ☠️ FÄRGADE DELAR. Vilket färgord som får stå omedelbart före varje vaktad del.
DEL_OK = {
    "441d2209": {"skiva": ["grå"], "ram": ["svart"], "pall": ["grå"]},
    "394de213": {"skiva": ["ekfärgad", "ekoptik"], "ram": ["vit"], "pall": ["vit"]},
    "f4ed1264": {"skiva": ["vit"], "ram": ["svart"], "pall": ["vit"]},
    "3b38e191": {"skiva": ["naturfärgad"], "ram": ["svart"], "stol": ["naturfärgad"]},
    "51c43e67": {"skiva": ["grå"], "ram": ["svart"], "pall": ["grå"]},
    "c3bda64a": {"skiva": ["ekfärgad"], "ram": ["svart"], "pall": ["ekfärgad"]},
    "c88b5bbb": {"skiva": ["ekfärgad"], "ram": ["svart"], "pall": ["ekfärgad"]},
    "63a37524": {"skiva": ["rustikbrun"], "ram": ["svart"], "pall": ["rustikbrun"]},
}


def kontroll():
    """Fäller på det som gick fel i tidigare rundor — och på rundans egna risker."""
    fel = []

    for pid, d in M.items():
        # 1. ☠️ MAXLASTEN PÅ BORDET är rundans säkerhetssiffra och får aldrig
        #    saknas. De tre set som inte anger den valdes bort ur batchen; ett
        #    som smyger in utan siffra ska fälla här och inte upptäckas i text.
        if not d.get("bordlast"):
            fel.append(f"{pid}: BORDLAST saknas — setet hör inte hemma i batchen")

        # 2. Sitthöjden måste ligga under bordshöjden, annars går pallen inte in.
        if d["sitthojd"] >= d["bordh"]:
            fel.append(f"{pid}: SITTHÖJD {d['sitthojd']} ≥ bordshöjd {d['bordh']}")

        # 3. ☠️ RYGGSTÖD är ett påstående, inte en detalj. Bara två av åtta har
        #    det, och `sitstyp` är det enda stället texten får hämta det ifrån.
        #
        #    ⚠️ Första utkastet gjorde `"ryggstöd" in sitstyp` och fällde sex av
        #    åtta korrekta rader: `pall UTAN ryggstöd` innehåller ordet. En
        #    kontroll som läser ORDET i stället för PÅSTÅENDET är samma familj
        #    som runda 114:s falska godkännande, fast åt andra hållet — där
        #    ursäktade en negation ett löfte, här fällde en negation ett
        #    korrekt nekande.
        har_rygg = ("rygg" in d["sitstyp"]
                    and "utan rygg" not in d["sitstyp"])
        if har_rygg != (pid in MED_RYGG):
            fel.append(f"{pid}: RYGGSTÖD i sitstyp={d['sitstyp']!r} mot "
                       f"MED_RYGG={pid in MED_RYGG}")

        # 4. ☠️ FÄRGSYSKON ÄR INTE MATERIALSYSKON. c88b5bbb och 63a37524 har
        #    identiskt chassi, identiska mått, identisk vikt och identisk last
        #    — men leverantören anger SPÅNSKIVA på den ena och MDF på den
        #    andra. Frestelsen är att kopiera texten mellan dem; den här
        #    kontrollen finns för att göra det omöjligt att göra i tysthet.
        sy = SYSKON.get(pid)
        if sy:
            for f_ in ("bord", "sits", "vikt", "paket", "bordlast", "sitslast"):
                if d[f_] is None or M[sy][f_] is None:
                    continue          # overifierat fält jämförs inte
                if d[f_] != M[sy][f_]:
                    fel.append(f"{pid}/{sy}: SYSKON men {f_} skiljer "
                               f"({d[f_]} mot {M[sy][f_]})")
            if d["material"] == M[sy]["material"]:
                fel.append(f"{pid}/{sy}: materialet är LIKA — mätningen sa att "
                           f"det skiljer, så någon har kopierat")

        # 5. Delantalet måste stämma med vad som ingår.
        if str(d["sittplatser"]) not in d["ingar"]:
            fel.append(f"{pid}: {d['sittplatser']} sittplatser men ingar={d['ingar']!r}")
        if d["delar"] != d["sittplatser"] + 1:
            fel.append(f"{pid}: {d['delar']} delar men {d['sittplatser']} sittplatser + 1 bord")

    # 6. Två set får inte dela exakt samma bordsmått UTAN att vara syskon.
    sett = {}
    for pid, d in M.items():
        n = (d["bord"], d["sits"])
        if n in sett and SYSKON.get(pid) != sett[n]:
            fel.append(f"{pid} och {sett[n]} delar mått utan att vara syskon")
        sett[n] = pid

    # 8. ☠️ MÅTTRITNINGEN ÄR TREDJE KÄLLAN, och den enda som inte är text.
    #    Den fällde `3b38e191`: spec-raden gav stolen 45 cm djup, vilket är
    #    BORDETS djup på samma produkt, medan ritningen visar 43. Regel 7 kunde
    #    inte se det — båda TEXTläsningarna bar samma fel, för de kom ur samma
    #    rad. Det som skiljer är att ritningen är ortografisk.
    for pid, ritn in RITNING.items():
        if pid not in M:
            continue
        for falt, uppmatt in ritn.items():
            if M[pid][falt] != uppmatt:
                fel.append(f"{pid}: {falt} {M[pid][falt]!r} (spec) mot "
                           f"{uppmatt!r} (RITNINGEN) — ritningen avgör måtten")

    # 7. ☠️ TVÅ OBEROENDE LÄSNINGAR AV SAMMA LEVERANTÖRSRAD MÅSTE STÄMMA.
    #    `produkter.json` skrevs i Steg 1 ur katalogsvepet; den här filen
    #    skrevs i Steg 3 ur spec-blocken. Sju av åtta rader stämde exakt på
    #    både vikt och paketmått — och den åttonde bar en vikt som hörde till
    #    ett set utanför batchen. EN läsning hade sett fullkomligt frisk ut.
    #
    #    Regeln är alltså inte "läs noga" utan LÄS TVÅ GÅNGER UR OLIKA KÄLLOR
    #    OCH JÄMFÖR. Ett fält där de två inte möts är `None` tills det gått
    #    att läsa om — aldrig det tal som råkade skrivas sist.
    try:
        import json as _json, os as _os
        p2 = _json.load(open(_os.path.join(_os.path.dirname(__file__) or ".",
                                           "produkter.json"), encoding="utf-8"))
    except OSError:
        p2 = {}
    def _norm(v):
        return re.sub(r"[\s]|kg|cm", "", (v or "")).replace("x", "×")
    for pid, d in M.items():
        rad = p2.get(pid)
        if not rad:
            continue
        for eget, steg1 in (("vikt", "vikt"), ("paket", "paket")):
            a, b = d.get(eget), rad.get(steg1)
            if b in (None, "", "—"):
                continue              # Steg 1 läste inte fältet — inget att möta
            if a is None:
                continue              # redan märkt overifierat
            if _norm(b) not in _norm(a):
                fel.append(f"{pid}: {eget} {a!r} (Steg 3) mot {b!r} (Steg 1) "
                           f"— två läsningar av samma rad är oense, sätt None")
    return fel


if __name__ == "__main__":
    import sys
    if "--lasttabell" in sys.argv:
        # Loggens lasttabell GENERERAS härifrån. Handskriven gav den två fel
        # på sexton tal; en logg som avviker från talkällan är en andra sanning.
        print("| set | bordslast | sitslast |")
        print("|---|--:|--:|")
        for last, pid in sorted(((M[p]["bordlast"], p) for p in ALLA),
                                key=lambda t: int(t[0].split()[0])):
            print(f"| `{pid}` | {last} | {M[pid]['sitslast']} |")
        raise SystemExit(0)
    f = kontroll()
    print(f"matt.kontroll(): {len(M)} produkter, {len(f)} fel")
    for x in f:
        print("  ✗", x)
