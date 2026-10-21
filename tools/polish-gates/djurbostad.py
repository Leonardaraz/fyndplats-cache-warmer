#!/usr/bin/env python3
"""Laglighetsskärmen för djurbostäder (burar, stall, voljärer) — `djurbostad.tsv`.

☠️ VARFÖR DEN FINNS (2026-10-21). Runbooken har sagt sedan länge att en bur under
Jordbruksverkets minimimått inte ska poleras, men siffrorna i den kom inte ur
föreskriften och ingen grind höll regeln. 108 dolda utkast (hamsterburar,
kaninstall, fågelburar, hönshus, terrarier) hoppades över i alla rundor "för att
de kräver en laglighetskontroll". Den här filen gör kontrollen till en fil som
måste finnas, på samma sätt som `gate-lager.py` gör med saldot.

Tabellerna nedan är LÄSTA UR FÖRESKRIFTEN, inte ur minnet: Statens jordbruksverks
föreskrifter och allmänna råd (SJVFS 2019:15, saknr L 80) om villkor för hållande
m.m. av djur avsedda för sällskap och hobby, bilaga 1:1 (sällskapsfåglar), 1:2
(tamillrar), 1:3 (kaniner, gäller från 15 juli 2019) och 1:4 (gnagare). Den
gällande lydelsen hämtades 2026-10-21 från Jordbruksverkets PDF. Utkastet till nya
regler (2025) drogs tillbaka och ersätts tidigast 2029.

⚠️ TRE SAKER SOM RUNBOKENS GAMLA TABELL HADE FEL ELLER SAKNADE.
  1. KORTASTE SIDAN. Kaniner har ett krav på kortaste sidan (0,5 m för en liten
     kanin, 0,6 m för 2–3,5 kg, 0,7 m över det). Det är den som fäller de flesta
     kaninstall: ett stall på 45–55 cm djup klarar aldrig 0,6 m. Raden saknades.
  2. FÅGLAR HAR TRE MÅTT, inte ett. Golvyta, längsta sida och höjd, och dessutom
     "utrymmets bredd ska vara minst 2 gånger fågelns längd, dock minst 45 cm".
     En bur på 63 x 53 cm klarar ytan (0,33 m²) men inte längsta sidan (0,7 m).
  3. HAMSTERHJUL. Runbooken angav "hjul ≥ 28 cm (dvärg ≥ 20)". Ordet "hjul"
     finns inte någonstans i föreskriften. Uppgiften kom ur något annat och är
     struken.

☠️ HYLLOR OCH VÅNINGAR RÄKNAS INTE. 8 kap. 21 §: "Hyllans yta ska inte adderas
till den totala tillgängliga burytan". Golvytan är marknivån, höjden mäts per
delyta (en löpgång på 36 cm under ett hus på 54 cm är 36 cm hög för kaninen).
Talen i `djurbostad.tsv` är därför markplanets INNERMÅTT, inte
leverantörens totalmått, och där innermått saknas är de totalmått minus
väggtjockleken. En bur som klarar minimimåttet bara på utsidan är HOLD.

☠️ HÖNS OCH ÄNDER ÄR INTE L 80. Föreskriften gäller uttryckligen inte "inhemska
hönsfåglar och andfåglar" (1 kap. 1 §). De hör till SJVFS 2019:23, vars
värphönskapitel gäller höns som hålls för äggproduktion, och det ger inget mått
för en hobbyflock som går att räkna med. Hönshus får därför ingen siffra här:
`typ=hons` är PASS med texten "golvyta inomhus" och Jordbruksverkets riktmärke
(högst 7 höns per m² tillgänglig golvyta) utan ett utlovat antal. Ankor och allt
som kräver en djurartsbedömning (sköldpaddor, reptiler, katter) är `typ=hall`.

FORMAT (tabbseparerat, rader som börjar med # hoppas över):
  kort  lager  art  typ  A  L  K  H  beslut  not
  kort     8 hextecken
  lager    Wix-saldot vid skärmningen
  art      leverantörens uppräknade djurarter, kommaseparerade (se ART och FAGEL)
  typ      bostad | fagel | rastgard | hons | hund | hall
  A        markplanets golvyta i cm²      L längsta sida (cm)
  K        kortaste sida (cm)             H höjd (cm)
  beslut   PASS | HOLD | FAIL
  not      orsaken i klartext (obligatorisk för HOLD och FAIL). Aldrig artikelnummer.

`bostad` och `fagel` RÄKNAS om här, och en rad vars `beslut` skiljer sig från det
uträknade fäller grinden. De övriga typerna är bedömda av en människa och
kontrolleras bara för form.

ANVÄNDNING:  python3 tools/polish-gates/djurbostad.py <katalog med djurbostad.tsv>
"""
import os
import sys

# (golvyta cm², kortaste sida cm, höjd cm) — SJVFS 2019:15 bilaga 1:3 och 1:4.
ART = {
    "dvkanin": (5000, 50, 50),       # kanin ≤ 2 kg
    "kanin": (7000, 60, 60),         # > 2–3,5 kg; utgångspunkten när vikten inte anges
    "kaninmedel": (8000, 70, 80),    # > 3,5–4,5 kg
    "kaninstor": (9000, 70, 80),     # > 4,5–6 kg (tyska widderkaniner)
    "marsvin": (3000, 40, 25),
    "guldhamster": (1200, 25, 20),
    "dvarghamster": (900, 20, 20),
    "chinchilla": (5000, 50, 100),
    "degu": (3000, 40, 40),
    "rattor": (1800, 30, 30),        # brun råtta
    "gerbil": (1200, 25, 20),
    "mus": (900, 20, 20),            # husmus
    "iller": (50000, 100, 100),      # tamillrar, bilaga 1:2: 5 m², 1 m, 1 m
}
# Bilaga 1:1, i stigande ordning: (golvyta cm², längsta sida cm, höjd cm, fågelns längd cm).
# Bredden ska dessutom vara minst max(45, 2 x längden).
FAGEL = [
    ("fagel20", 3100, 70, 60, 20),
    ("fagel25", 4500, 90, 60, 25),
    ("fagel35", 8400, 120, 80, 35),
    ("fagel45", 14400, 160, 100, 45),
]

TYPER = {"bostad", "fagel", "rastgard", "hons", "hund", "hall"}
BESLUT = {"PASS", "HOLD", "FAIL"}
RANG = {"under": 0, "knappt": 1, "ok": 2}


def mattstatus(varde, minimum):
    """ok från minimum + 1 cm, under när det saknas mer än 4 cm, däremellan knappt."""
    if varde >= minimum + 1:
        return "ok"
    if varde > minimum - 4:
        return "knappt"
    return "under"


def ytstatus(varde, minimum):
    """Ytan har 5 % marginal åt vardera hållet, eftersom innermåttet sällan är exakt."""
    if varde >= minimum * 1.05:
        return "ok"
    if varde >= minimum * 0.95:
        return "knappt"
    return "under"


def samla(*status):
    return min(status, key=lambda s: RANG[s])


def prova_djur(art, a, k, h):
    minimum = ART[art]
    return samla(ytstatus(a, minimum[0]), mattstatus(k, minimum[1]), mattstatus(h, minimum[2]))


def prova_fagel(a, l, k, h):
    """Returnerar (status, största klassen som klarar sig) — hela listan går igenom."""
    basta, klass = "under", None
    for namn, amin, lmin, hmin, langd in FAGEL:
        bredd = max(45, 2 * langd)
        s = samla(ytstatus(a, amin), mattstatus(l, lmin), mattstatus(k, bredd), mattstatus(h, hmin))
        if s == "ok":
            # Klasserna står i stigande ordning, så den sista som klarar sig är den största.
            basta, klass = "ok", namn
        elif RANG[s] > RANG[basta]:
            basta = s
    return basta, klass


def bedom(rad):
    """Uträknat beslut och de arter/klasser som klarar sig, för bostad och fagel."""
    arter = [x for x in rad["art"].split(",") if x]
    if rad["typ"] == "fagel":
        status, klass = prova_fagel(rad["A"], rad["L"], rad["K"], rad["H"])
        return {"ok": "PASS", "knappt": "HOLD", "under": "FAIL"}[status], [klass] if klass else []
    status = {a: prova_djur(a, rad["A"], rad["K"], rad["H"]) for a in arter}
    ok = [a for a, s in status.items() if s == "ok"]
    if ok:
        return "PASS", ok
    if any(s == "knappt" for s in status.values()):
        return "HOLD", []
    return "FAIL", []


def las(vag):
    rader, fel = [], []
    with open(vag, encoding="utf-8") as f:
        for nr, rad in enumerate(f, 1):
            rad = rad.rstrip("\n")
            if not rad.strip() or rad.startswith("#"):
                continue
            antal_fel = len(fel)
            d = rad.split("\t")
            if len(d) != 10:
                fel.append(f"rad {nr}: {len(d)} kolumner, förväntade 10")
                continue
            kort, lager, art, typ, a, l, k, h, beslut, orsak = d
            r = {"kort": kort, "art": art, "typ": typ, "beslut": beslut, "not": orsak.strip(), "rad": nr}
            if len(kort) != 8 or any(c not in "0123456789abcdef" for c in kort):
                fel.append(f"rad {nr}: kort ska vara 8 hextecken")
            try:
                r["lager"] = int(lager)
            except ValueError:
                fel.append(f"{kort}: lager ska vara ett heltal")
                r["lager"] = 0
            if typ not in TYPER:
                fel.append(f"{kort}: okänd typ {typ!r}")
            if beslut not in BESLUT:
                fel.append(f"{kort}: okänt beslut {beslut!r}")
            if typ in ("bostad", "fagel"):
                try:
                    for namn, varde in (("A", a), ("L", l), ("K", k), ("H", h)):
                        r[namn] = float(varde)
                except ValueError:
                    fel.append(f"{kort}: A, L, K och H ska vara tal för typ {typ}")
                for x in [x for x in art.split(",") if x]:
                    if typ == "bostad" and x not in ART:
                        fel.append(f"{kort}: okänd art {x!r}")
            if beslut in ("HOLD", "FAIL") and not r["not"]:
                fel.append(f"{kort}: {beslut} saknar orsak")
            # En rad med ett formfel räknas inte om: en okänd art ska ge ett FEL, inte en traceback.
            r["ogiltig"] = len(fel) > antal_fel
            rader.append(r)
    return rader, fel


def main():
    katalog = sys.argv[1] if len(sys.argv) > 1 else "."
    vag = os.path.join(katalog, "djurbostad.tsv")
    if not os.path.exists(vag):
        print("FEL: djurbostad.tsv saknas — skärmen måste finnas innan någon text skrivs", file=sys.stderr)
        return 2
    rader, fel = las(vag)
    sedda = set()
    for r in rader:
        if r["kort"] in sedda:
            fel.append(f"{r['kort']}: förekommer två gånger")
        sedda.add(r["kort"])
        if r["typ"] in ("bostad", "fagel") and not r["ogiltig"] and all(k in r for k in ("A", "L", "K", "H")):
            beslut, passar = bedom(r)
            r["passar"] = passar
            if beslut != r["beslut"]:
                fel.append(f"{r['kort']}: filen säger {r['beslut']} men måtten ger {beslut}")
        else:
            r["passar"] = []

    antal = {b: sum(1 for r in rader if r["beslut"] == b) for b in sorted(BESLUT)}
    for r in rader:
        print(f"{r['kort']}  {r['beslut']:<4} lager {r['lager']:>3}  {r['typ']:<8} {','.join(r['passar']) or '-'}")
    ko = [r["kort"] for r in rader if r["beslut"] == "PASS" and r["lager"] > 0]
    pension = [r["kort"] for r in rader if r["beslut"] == "FAIL"]
    print(f"\n{len(rader)} rader · " + " · ".join(f"{b} {n}" for b, n in antal.items()))
    print(f"polerkö (PASS med saldo): {len(ko)}")
    print(f"pensioneras (FAIL): {len(pension)}")
    if fel:
        print("\nFEL:", file=sys.stderr)
        for f in fel:
            print("  " + f, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
