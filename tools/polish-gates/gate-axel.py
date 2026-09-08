#!/usr/bin/env python3
"""Axelgrind — kontrollerar att texten läser rätt BOKSTAV, inte bara rätt tal.

☠️ VARFÖR DEN FINNS. Uppmätt i runda K14 på sex av åtta soffor: Aosoms tyska
block och den svenska spec-flik importen bygger bär SAMMA TAL under OLIKA
axelbokstav.

    tyska (facit)    Gesamtabmessungen: 242B x 87/156T x 87H cm
    svensk spec-flik Mått:              242L x 87-156B x 87H cm

I tyskan är B = Breite (bredd), T = Tiefe (djup). I den svenska raden är
L = Längd, B = Bredd. Talen är identiska; bokstäverna betyder olika saker.
Skriver man av den svenska raden blir en 242 cm BRED soffa "87–156 cm bred".

☠️ INGEN SIFFERGRIND KAN FÅNGA DET. Varje siffra finns ordagrant i källan, så
`gate.py` är grön oavsett vilken läsning texten valde. Samma familj som #217
(grinden mäter fel facit) fast en nivå djupare: här är TALET rätt och
BETYDELSEN fel.

☠️ OCH FÖRSTA VERSIONEN AV GRINDEN VAR FÖR TRUBBIG — det syntes först när den
kördes skarpt. Den jämförde VARJE "N cm bred" mot produktens totalbredd och gav
64 fynd på åtta texter, nästan alla falska: "sittytan är 198 cm bred" är ett
riktigt påstående om SITSEN. En grind som fyrar på varje deltal lär mottagaren
att sluta läsa — samma argument som mot att varna vid 48 h på token-förnyelsen.

Grinden fäller därför BARA på den felform axelbokstäverna faktiskt kan orsaka:
att produktens EGET djupmått binds till "bred", eller dess breddmått till
"djup"/"hög". Ett legitimt delmått (sits, armstöd, kudde) kan aldrig utlösa
den, eftersom talet då inte är något av produktens tre egna mått.

⚠️ Och ordningen bryts INNE i det tyska blocket också. Uppmätt på 34341c4f:
varje måttrad går B x T x H utom kudden, som går B x H x T:

    Gesamtabmessungen: 242B x 87/156T x 87H     <- B T H
    Kissenmaße:         70B x  47H  x  15T      <- B H T

Läs bokstäverna PER RAD, aldrig listans mönster.

ANVÄNDNING (från rundans katalog):  python3 ../../polish-gates/gate-axel.py
  axelfacit.json  {"<kort>": {"tyska","svenska","bredd","djup","hojd"[,"djupMax"]}}
                  GENERERAS SERVER-SIDE ur plainDescription — aldrig skriven av
                  en modell, aldrig avskriven för hand (#225).
  <kort>.html     den svenska texten, om den finns ännu
"""
import io, json, os, re, sys

AXEL = {"B": "Breite/bredd", "T": "Tiefe/djup", "H": "Höhe/höjd", "L": "Länge/längd"}

MONSTER = [
    (re.compile(r"(\d{2,3})\s*cm\s+bred", re.I), "bredd"),
    (re.compile(r"(\d{2,3})\s*cm\s+djup", re.I), "djup"),
    (re.compile(r"(\d{2,3})\s*cm\s+hög", re.I), "hojd"),
]


def main():
    if not os.path.exists("axelfacit.json"):
        raise SystemExit(
            "  [AVBRYT] axelfacit.json saknas.\n"
            "  Generera den SERVER-SIDE ur plainDescription. Skriv den aldrig för\n"
            "  hand och låt aldrig en agent skriva den — ett facit som en modell\n"
            "  formulerat är inget facit (#225)."
        )
    facit = json.load(io.open("axelfacit.json", encoding="utf-8"))
    produkter = [k for k in facit if not k.startswith("_")]
    fynd, varningar, kallkonflikt = [], [], []

    for kort in produkter:
        v = facit[kort]
        tys = dict((tal, bok) for tal, bok in re.findall(r"(\d+)(?:[-/]\d+)?\s*([BTHL])", v.get("tyska", "")))
        for tal, bok in re.findall(r"(\d+)(?:[-/]\d+)?\s*([BTHL])", v.get("svenska", "")):
            if tal in tys and tys[tal] != bok:
                kallkonflikt.append(
                    f"  {kort}: {tal} är {tys[tal]} ({AXEL[tys[tal]]}) i tyskan men "
                    f"{bok} ({AXEL[bok]}) i den svenska spec-fliken — TYSKAN GÄLLER"
                )

        html = f"{kort}.html"
        if not os.path.exists(html):
            continue
        txt = re.sub(r"<[^>]+>", " ", io.open(html, encoding="utf-8").read())

        # ☠️ ETT TAL KAN VARA TVÅ AXLAR SAMTIDIGT. 34341c4f är 87 cm djup OCH
        # 87 cm hög (242B x 87/156T x 87H). En uppslagstabell tal -> EN axel
        # skrev över den ena med den andra och fällde en korrekt text. Tredje
        # gången samma familj i den här grinden: den måste kunna säga "båda".
        egna = {}
        for axel in ("bredd", "djup", "hojd"):
            if v.get(axel):
                egna.setdefault(v[axel], set()).add(axel)
        if v.get("djupMax"):
            egna.setdefault(v["djupMax"], set()).add("djup")

        sedda = set()
        for regex, axel in MONSTER:
            for m in regex.finditer(txt):
                tal = int(m.group(1))
                ratt = egna.get(tal)
                if ratt is None:
                    continue                      # ett delmått — grinden uttalar sig inte
                if axel not in ratt:
                    fynd.append(
                        f"  {kort}: {tal} cm är produktens {'/'.join(sorted(r.upper() for r in ratt))} "
                        f"enligt tyska blocket ({v['tyska']}), men texten binder talet till "
                        f"{axel.upper()}. Rad: …{m.group(0)}…"
                    )
                else:
                    sedda.add(axel)

        for axel in ("bredd", "djup", "hojd"):
            if v.get(axel) and axel not in sedda:
                varningar.append(f"  {kort}: texten anger aldrig produktens {axel} ({v[axel]} cm) med ord")

    for r in kallkonflikt:
        print(r)
    if kallkonflikt:
        print()
    for r in varningar:
        print(r)
    if varningar:
        print()
    for r in fynd:
        print(r)

    grindade = sum(1 for k in produkter if os.path.exists(f"{k}.html"))
    print(f"\nGRIND: {len(fynd)} axelfel i {grindade} skrivna texter "
          f"({len(varningar)} saknade egna mått, {len(kallkonflikt)} axelkonflikter i källan)")
    sys.exit(1 if fynd else 0)


main()
