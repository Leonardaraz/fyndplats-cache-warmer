#!/usr/bin/env python3
"""Axelgrind — kontrollerar att den svenska texten läser rätt BOKSTAV, inte bara rätt tal.

☠️ VARFÖR DEN FINNS. Uppmätt i runda K14 på sex av åtta soffor: Aosoms tyska
block och den svenska spec-flik importen bygger bär SAMMA TAL under OLIKA
axelbokstav.

    tyska (facit)    Gesamtabmessungen: 242B x 87/156T x 87H cm
    svensk spec-flik Mått:              242L x 87-156B x 87H cm

I tyskan är B = Breite (bredd) och T = Tiefe (djup). I den svenska raden är
L = Längd och B = Bredd. Talen är identiska; bokstäverna betyder olika saker.
Skriver man av den svenska raden blir en 242 cm BRED soffa "87–156 cm bred".

☠️ INGEN SIFFERGRIND KAN FÅNGA DET. Varje siffra finns ordagrant i källan, så
`gate.py` är grön oavsett vilken läsning texten valde. Det är samma familj som
#217 (grinden mäter rundans facit, inte produktens) fast en nivå djupare: här
är TALET rätt och BETYDELSEN fel.

⚠️ Och ordningen bryts inne i det tyska blocket också. Uppmätt på 34341c4f:
varje måttrad går B x T x H utom kudden, som går B x H x T:

    Gesamtabmessungen: 242B x 87/156T x 87H     <- B T H
    Kissenmaße:         70B x  47H  x  15T      <- B H T

Läser man listans mönster i stället för radens bokstäver blir kudden 47 cm
djup och 15 cm hög i stället för 47 hög och 15 tjock. Båda talen finns i
källan. Läs bokstäverna PER RAD.

ANVÄNDNING (från rundans katalog):  python3 ../../polish-gates/gate-axel.py
  axelfacit.json  {"<kort>": {"tyska": "...", "svenska": "...",
                              "bredd": N, "djup": N, "hojd": N}}
                  GENERERAS SERVER-SIDE ur plainDescription — aldrig skriven
                  av en modell (#225).
  <kort>.html     den svenska texten, om den finns ännu
"""
import io, json, os, re, sys

AXEL = {"B": "Breite/bredd", "T": "Tiefe/djup", "H": "Höhe/höjd", "L": "Länge/längd"}

# Svenska formuleringar som binder ett tal till en axel.
MONSTER = [
    (re.compile(r"(\d{2,3})\s*cm\s+bred", re.I), "bredd"),
    (re.compile(r"bred[a-z]*\s+(\d{2,3})\s*cm", re.I), "bredd"),
    (re.compile(r"(\d{2,3})\s*cm\s+djup", re.I), "djup"),
    (re.compile(r"djup[a-z]*\s+(\d{2,3})\s*cm", re.I), "djup"),
    (re.compile(r"(\d{2,3})\s*cm\s+hög", re.I), "hojd"),
    (re.compile(r"höjd[a-z]*\s+(\d{2,3})\s*cm", re.I), "hojd"),
    (re.compile(r"(\d{2,3})\s*cm\s+lång", re.I), "bredd"),   # svensk "lång" om en soffa = tyskans Breite
]


def main():
    if not os.path.exists("axelfacit.json"):
        raise SystemExit(
            "  [AVBRYT] axelfacit.json saknas.\n"
            "  Generera den SERVER-SIDE ur plainDescription (ett ExecuteWixAPI-anrop\n"
            "  som returnerar tyska Gesamtabmessungen + svenska Mått-raden per produkt).\n"
            "  Skriv den ALDRIG för hand och låt aldrig en agent skriva den — filen är\n"
            "  facit, och ett facit som en modell formulerat är inget facit (#225)."
        )
    facit = json.load(io.open("axelfacit.json", encoding="utf-8"))
    fynd, varningar = [], []
    produkter = [k for k in facit if not k.startswith("_")]

    for kort in produkter:
        v = facit[kort]
        tys = re.findall(r"(\d+)(?:[-/]\d+)?\s*([BTHL])", v.get("tyska", ""))
        sve = re.findall(r"(\d+)(?:[-/]\d+)?\s*([BTHL])", v.get("svenska", ""))
        tysMap = {tal: bok for tal, bok in tys}
        for tal, bok in sve:
            if tal in tysMap and tysMap[tal] != bok:
                varningar.append(
                    f"  {kort}: talet {tal} står som {tysMap[tal]} ({AXEL[tysMap[tal]]}) i tyskan "
                    f"men som {bok} ({AXEL[bok]}) i den svenska spec-fliken — TYSKAN GÄLLER"
                )

        # Om den svenska texten finns: kontrollera att den binder rätt tal till rätt axel.
        html = f"{kort}.html"
        if not os.path.exists(html):
            continue
        txt = io.open(html, encoding="utf-8").read()
        txt = re.sub(r"<[^>]+>", " ", txt)
        for regex, axel in MONSTER:
            for m in regex.finditer(txt):
                tal = int(m.group(1))
                vantat = v.get(axel)
                if vantat is None:
                    continue
                alt = v.get("djupMax") if axel == "djup" else None
                if tal != vantat and tal != alt:
                    fynd.append(
                        f"  {kort}: texten säger {tal} cm som {axel.upper()}, "
                        f"men tyska blocket säger {vantat} cm "
                        f"({'/' .join(str(x) for x in [vantat, alt] if x)}). Rad: …{m.group(0)}…"
                    )

    for r in varningar:
        print(r)
    if varningar:
        print()
    for r in fynd:
        print(r)

    grindade = sum(1 for k in produkter if os.path.exists(f"{k}.html"))
    print(f"\nGRIND: {len(fynd)} fynd i {grindade} skrivna texter "
          f"({len(varningar)} axelkonflikter i källan, {len(produkter)} produkter i facit)")
    if grindade == 0:
        print("  (inga <kort>.html ännu — bara källkonflikterna listade)")
    sys.exit(1 if fynd else 0)


main()
