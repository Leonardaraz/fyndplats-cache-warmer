#!/usr/bin/env python3
"""Bygger axelfacit.json MEKANISKT ur rundans kallor.json.

☠️ VARFÖR DEN FINNS SOM SKRIPT. #225 säger att facit aldrig får skrivas för
hand eller av en modell. Fram till runda M2 byggde varje runda sin egen
engångssnutt, och två av dem byggde den fel på var sitt sätt:

  * M1 och M2 skrev talen som STRÄNGAR ("170"). gate-axel.py slår upp
    heltal, så uppslaget gav alltid None och grinden KUNDE INTE FÄLLA.
    Båda rundorna gick igenom med "0 axelfel" utan att ha jämfört något.
  * M1:s första generator kände bara igen etiketten `Gesamtmaße` och missade
    `Gesamtabmessung` i singular, vilket gav en tom facitrad — samma tystnad
    en annan väg.

☠️ OCH AXELBOKSTAVEN ÄR INTE ETT FACIT. Uppmätt i runda M2 mot åtta
måttritningar: Aosom använder TVÅ bokstavsscheman för samma geometri.

    321bdedf   170B x 100T x 245H      B = front,  T = bortre
    80e1a550   140L x 100B x 240H      L = front,  B = bortre
    (och så för sex produkter till)

Bokstaven för den bortre axeln är alltså `T` på en produkt och `B` på sju.
Läser man bokstäverna ordagrant heter SAMMA fysiska axel "djup" på den ena
produkten och "bredd" på den andra, i samma runda.

Vad som DÄREMOT håller: **position**. Tal 1 är den frontvända horisontalen,
tal 2 den bortre, tal 3 höjden — bekräftat mot ritningen på 8 av 8 i M2, mot
1 av 8 för den bokstavstrogna läsningen. Samma regel förklarar K14-fyndet:
där var 242 (position 1) bredden, och buggen var att position 2 lästes som
bredd.

Facit byggs därför POSITIONELLT. Bokstäverna sparas i `bokstaver` så att
gate-axel fortfarande kan rapportera när tyskan och den svenska spec-fliken
är oense — det är en upplysning om källan, inte ett facit om produkten.

ANVÄNDNING (från rundans katalog):
    python3 ../../polish-gates/bygg-axelfacit.py
"""
import io, json, re, sys

# Aosom använder alla fyra omväxlande — M1 föll på att bara känna igen två.
ETIKETT = r"(?:Gesamtabmessungen|Gesamtabmessung|Gesamtmaße|Gesamtmasse|Maße|Masse)"
AXLAR = ("bredd", "djup", "hojd")


def axelpar(rad):
    """Plockar (tal, bokstav) i ordning ur en tysk måttrad.

    ☠️ AOSOM SKRIVER BOKSTAVEN PÅ BÅDA SIDOR OM TALET. Uppmätt:
        Gesamtabmessungen: 160L x 90B x 240H     <- tal först
        Maße:              L100 x B55 x H120     <- BOKSTAV först
    Ett mönster som bara kan det ena gav tom facit på det andra, alltså en
    grind som inte kunde fälla. Båda former läses här, i radens ordning.
    """
    TAL = r"\d+(?:[.,]\d+)?(?:\s*[/-]\s*\d+(?:[.,]\d+)?)?"
    ut = []
    for m in re.finditer(r"(?:(%s)\s*([BLTH])\b|\b([BLTH])\s*(%s))" % (TAL, TAL), rad):
        if m.group(1) is not None:
            ut.append((m.group(1), m.group(2)))
        else:
            ut.append((m.group(4), m.group(3)))
    return ut


def tal(s):
    """'170' -> 170, '87/156' -> [87, 156], '53,5' -> 53.5 (jämförs inte)."""
    delar = re.split(r"[/-]", s)
    ut = []
    for d in delar:
        d = d.strip().replace(",", ".")
        v = float(d)
        ut.append(int(v) if v == int(v) else v)
    return ut[0] if len(ut) == 1 else ut


def main():
    kallor = json.load(io.open("kallor.json", encoding="utf-8"))
    ut = {"_om": "Genererad mekaniskt av polish-gates/bygg-axelfacit.py ur kallor.json. "
                 "POSITIONELL: tal 1 = frontvänd horisontal, tal 2 = bortre, tal 3 = höjd. "
                 "Bokstäverna är källans, inte facit — se skriptets docstring."}
    tomma = []
    for kort in sorted(kallor):
        ren = re.sub(r"<[^>]+>", "\n", kallor[kort])
        rader = [x.strip() for x in ren.split("\n") if x.strip()]
        tysk = ""
        for rad in rader:
            m = re.search(ETIKETT + r"\s*:\s*(.+)$", rad)
            if m:
                tysk = m.group(1).strip()
                break
        svensk = ""
        for i, rad in enumerate(rader):
            if rad == "Mått:" and i + 1 < len(rader):
                svensk = rader[i + 1].strip()
                break
        d = {"tyska": tysk, "svenska": svensk}
        par = axelpar(tysk)
        if not par:
            # ☠️ EN PRODUKT KAN SAKNA TOTALMÅTT PÅ RIKTIGT. Uppmätt i M1 på
            # isbjörnsparet 5a14cc4d: källan har "Große Bärenabmessungen" och
            # "Kleine Bärenabmessungen" men inget mått för setet, för det finns
            # inget — det är två figurer. Skillnaden mot ett trasigt facit måste
            # SYNAS: raden märks axellös så att gate-axel kan säga "jämförde
            # inte" i stället för att tiga. En tom rad utan förklaring är en
            # grind som inte kan fälla.
            delmatt = [r for r in rader if re.search(r"abmessungen\s*:", r, re.I)]
            if delmatt:
                d["axellos"] = "inget totalmått i källan; bara delmått: " + " | ".join(delmatt)
            else:
                tomma.append(kort)
        else:
            d["bokstaver"] = "".join(b for _, b in par)
            # ☠️ REN POSITION RÄCKER INTE HELLER. Uppmätt i M1 på 3225c539:
            # "Ø30 x 51H" — diametern bär ingen bokstav, så 51H hamnade på
            # position 1 och HÖJDEN bokfördes som bredd.
            #
            # Bokstäverna är entydiga där de FINNS: H är alltid höjd, T alltid
            # djup, i varje uppmätt rad. Tvetydigheten gäller bara B mot L för
            # de två horisontalerna — Aosom kallar frontmåttet B på en produkt
            # och L på sju. Regeln blir därför: läs H och T ur bokstaven, och
            # låt POSITIONEN skilja de återstående två åt (första = frontvänd
            # = bredd, andra = bortre = djup). Bekräftat mot måttritningen på
            # 8 av 8 i M2 och 7 av 7 måttbärande i M1.
            for t_, b in par:
                if b == "H" and "hojd" not in d:
                    d["hojd"] = tal(t_)
                elif b == "T" and "djup" not in d:
                    d["djup"] = tal(t_)
            horisontal = [x for x in par if x[1] in ("B", "L")]
            # ett B som redan tagits som djup (BTH-schemat) räknas inte om
            for i, (t_, _b) in enumerate(horisontal):
                axel = "bredd" if i == 0 else "djup"
                if axel not in d:
                    d[axel] = tal(t_)
        ut[kort] = d
    io.open("axelfacit.json", "w", encoding="utf-8").write(
        json.dumps(ut, ensure_ascii=False, indent=1))
    for kort in sorted(kallor):
        v = ut[kort]
        print("%-9s %-26s bokstäver=%-4s %s" % (
            kort, v.get("tyska", "—"), v.get("bokstaver", "—"),
            {a: v[a] for a in AXLAR if a in v}))
    if tomma:
        raise SystemExit("\n  [AVBRYT] ingen måttrad hittad för: %s\n"
                         "  En tom facitrad är en grind som inte kan fälla." % ", ".join(tomma))
    print("\nFACIT: %d produkter, alla med måttrad." % len(kallor))


main()
